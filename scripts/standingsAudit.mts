// Full-season spectator audit. Run with tsx: seed, output directory, number of seasons.
import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { newLeague, playRegular, offseason } from './lib/headless.mts';
import { nextRandom } from '../src/engine/rng';
import { seasonMax, stdIds, twoWayIds, TWO_WAY_MAX } from '../src/engine/cba';
import type { BoxLine, GameResult, SimTeam } from '../src/engine/sim';

const seasons = Number(process.argv[4] || 10);
assert.ok(Number.isSafeInteger(seasons) && seasons > 0, 'Supply a positive integer season count');
const seed = Number(process.argv[2]),
  dir = join(process.argv[3] || '.review/standings-audit-current', String(seed));
assert.ok(Number.isSafeInteger(seed), 'Supply a numeric league seed');
mkdirSync(dir, { recursive: true });
assert.ok(!existsSync(join(dir, 'seasons.jsonl')), 'Use a fresh output directory to avoid mixing audit runs');
const g = newLeague(seed);
g.enterSpectator();
assert.equal(g.state.managed.length, 0);
const external = { rs: (seed ^ 0x43af64b1) >>> 0 };
Math.random = () => nextRandom(external);
const start = Date.now();
const basePlay = g.playGame.bind(g),
  baseSimTeam = g.simTeam.bind(g);
let seasonGames: Match[] = [],
  current: SimTeam[] | undefined;
let upgrades: Record<number, number> = {};
const baseMove = g.aiMove.bind(g);
g.aiMove = (...args: any[]) => {
  const e = baseMove(...args);
  if (e?.type === 'Signing' && e.pids?.length === 2) {
    const tid = args[2].teams.find((t: any) => t.abbr === e.teams)?.tid;
    if (tid != null) upgrades[tid] = (upgrades[tid] || 0) + 1;
  }
  return e;
};
let shotContext: Record<string, { n: number; p: number; blocked: number }> = {};
g.shotObserver = (e: any) => {
  if (e.fouled) return;
  const k = e.zone + '/' + e.contest;
  const z = (shotContext[k] ||= { n: 0, p: 0, blocked: 0 });
  z.n++;
  z.p += e.probability;
  z.blocked += +e.blocked;
};
type Match = { teams: SimTeam[]; day: number; result: number[][] };
const fields: (keyof BoxLine)[] = [
  'pts',
  'fga',
  'fgm',
  'tpa',
  'tpm',
  'fta',
  'ftm',
  'orb',
  'drb',
  'tov',
  'ast',
  'xP',
  'onPO',
  'onPD',
  'blk',
  'stl',
];
const box = (rows: Record<number, BoxLine>) => fields.map(field => Object.values(rows).reduce((s, r) => s + r[field], 0));
const strength = (team: SimTeam) => {
  const weight = team.players.reduce((s, p) => s + p.target, 0);
  return team.players.reduce((s, p) => s + p.ovr * p.target, 0) / Math.max(1, weight);
};
g.simTeam = (s: any, tid: number) => {
  const team = baseSimTeam(s, tid);
  if (current) current.push(team);
  return team;
};
g.playGame = (s: any, h: number, a: number): GameResult => {
  if (s.phase !== 'regular') return basePlay(s, h, a);
  const teams: SimTeam[] = (current = []);
  try {
    const result = basePlay(s, h, a);
    assert.equal(teams.length, 2);
    seasonGames.push({ teams, day: s.day, result: [box(result.home.box), box(result.away.box)] });
    return result;
  } finally {
    current = undefined;
  }
};
function checkRoster() {
  const issues: string[] = [],
    seen = new Set<number>();
  for (const [tid, ids] of Object.entries(g.state.rosters) as [string, number[]][]) {
    if (stdIds(g, ids).length > seasonMax(g.state) || twoWayIds(g, ids).length > TWO_WAY_MAX) issues.push('Roster limit ' + tid);
    for (const id of ids) {
      if (!g.db.P[id]?.r || g.db.P[id].gone) issues.push('Missing player ' + id);
      if (seen.has(id)) issues.push('Duplicate player ' + id);
      if (
        !Number.isFinite(g.db.P[id]?.ovr) ||
        !Number.isFinite(g.db.P[id]?.pot) ||
        Object.values(g.db.P[id]?.r || {}).some(v => typeof v === 'number' && !Number.isFinite(v))
      )
        issues.push('Bad rating ' + id);
      seen.add(id);
    }
  }
  return issues;
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => sum(xs) / xs.length;
const std = (xs: number[]) => {
  const avg = mean(xs);
  return Math.sqrt(mean(xs.map(x => (x - avg) ** 2)));
};
let high = -1,
  low = 100;
try {
  for (let index = 1; index <= seasons; index++) {
    if (index > 1) {
      const y = g.Y;
      offseason(g);
      assert.equal(g.Y, y + 1, 'offseason advanced');
      assert.equal(g.state.phase, 'regular', 'reached next regular season');
      assert.ok(g.state.po == null);
    }
    seasonGames = [];
    upgrades = {};
    shotContext = {};
    const issues = checkRoster();
    const opening: SimTeam[] = g.state.teams.map(t => g.simTeam(g.state, t.tid));
    const norm = structuredClone(g.db.norms);
    await playRegular(g);
    issues.push(...checkRoster());
    assert.equal(g.state.teams.length, 30);
    assert.equal(seasonGames.length, 1230);
    assert.equal(g.state.games.filter(x => !x.po).length, 1230);
    const teams = g.state.teams
      .map(t => {
        assert.equal(t.w + t.l, 82);
        const rows = seasonGames.flatMap(m =>
          m.teams.flatMap((p, i) =>
            p.tid === t.tid ? [{ us: m.result[i], them: m.result[1 - i], team: p, opp: m.teams[1 - i], home: i === 0 }] : [],
          ),
        );
        const us = fields.map((_, k) => sum(rows.map(r => r.us[k]))),
          them = fields.map((_, k) => sum(rows.map(r => r.them[k])));
        const margins = rows.map(r => r.us[0] - r.them[0]),
          won = margins.filter(m => m > 0).length;
        assert.equal(rows.length, 82);
        assert.equal(won, t.w);
        const oppPoss = us[13] / 5,
          ourPoss = us[12] / 5;
        return {
          tid: t.tid,
          name: t.region + ' ' + t.name,
          w: t.w,
          l: t.l,
          openingStrength: strength(opening[t.tid]),
          gameStrength: mean(rows.map(r => strength(r.team))),
          opponentStrength: mean(rows.map(r => strength(r.opp))),
          pd: mean(margins),
          net: 100 * (us[0] / ourPoss - them[0] / oppPoss),
          expNet: 100 * (us[11] / ourPoss - them[11] / oppPoss),
          ortg: (100 * us[0]) / ourPoss,
          drtg: (100 * them[0]) / oppPoss,
          closeW: margins.filter(m => m > 0 && m <= 5).length,
          closeL: margins.filter(m => m < 0 && m >= -5).length,
          blowW: margins.filter(m => m >= 20).length,
          blowL: margins.filter(m => m <= -20).length,
          bigW: margins.filter(m => m >= 30).length,
          bigL: margins.filter(m => m <= -30).length,
          us,
          them,
        };
      })
      .sort((a, b) => b.w - a.w || b.net - a.net);
    const margins = seasonGames.map(m => m.result[0][0] - m.result[1][0]);
    const selected = teams.filter(t => t.w >= 68 || t.w <= 12);
    const best = teams[0],
      worst = teams.at(-1)!;
    if (best.w > high) {
      high = best.w;
      if (!selected.includes(best)) selected.push(best);
    }
    if (worst.w < low) {
      low = worst.w;
      if (!selected.includes(worst)) selected.push(worst);
    }
    const record = {
      seed,
      index,
      year: g.Y,
      games: seasonGames.length,
      teams,
      fields,
      issues,
      upgrades,
      shotContext,
      spread: std(teams.map(t => t.w / 82)),
      marginSD: std(margins),
      meanMargin: mean(margins.map(Math.abs)),
      blowouts20: margins.filter(x => Math.abs(x) >= 20).length,
      blowouts30: margins.filter(x => Math.abs(x) >= 30).length,
      close: margins.filter(x => Math.abs(x) <= 5).length,
      elapsed: (Date.now() - start) / 1000,
    };
    if (selected.length) {
      const keep = new Set(selected.map(t => t.tid));
      const payload = {
        seed,
        index,
        year: g.Y,
        norm,
        fields,
        selected,
        opening,
        schedule: g.db.days,
        games: seasonGames.filter(m => m.teams.some(t => keep.has(t.tid))),
      };
      writeFileSync(join(dir, 'replay-' + index + '.json.gz'), gzipSync(JSON.stringify(payload), { level: 1 }));
    }
    appendFileSync(join(dir, 'seasons.jsonl'), JSON.stringify(record) + '\n');
    writeFileSync(
      join(dir, 'progress.json'),
      JSON.stringify({ seed, index, year: g.Y, best: best.w, worst: worst.w, spread: record.spread, issues, elapsed: record.elapsed }),
    );
    console.log(JSON.stringify({ seed, index, year: g.Y, best: best.w, worst: worst.w, issues, elapsed: record.elapsed }));
  }
} catch (e) {
  writeFileSync(join(dir, 'failure.txt'), String(e?.stack || e));
  throw e;
}

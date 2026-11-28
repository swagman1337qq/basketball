// Read-only court-value diagnostic. Usage: node --import tsx scripts/cardRealism.mts 36 96
// This is a same-role team comparison, not an NBA BPM estimate or a card rating override.
import fs from 'node:fs';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { applyCard, exportCard } from '../src/engine/playerCard';
import { mulberry32 } from '../src/engine/rng';
import { autoTen, optionRanks, TEN_KEYS } from '../src/engine/tendencies';
import { ovrExact } from '../src/engine/ratings';

const audit = JSON.parse(fs.readFileSync(new URL('../docs/PLAYER_CARD_REALISM_2026-11-27.json', import.meta.url), 'utf8'));
const index = Number(process.argv[2] ?? 36),
  games = Number(process.argv[3] ?? 96);
const entry = audit.cards.find((x: any) => x.index === index);
if (!entry || !Number.isInteger(games) || games < 2) throw new Error('Choose a card index 0–36 and at least two games per world.');
const seeds = [24211, 24322, 24433, 24544],
  group = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };
const worlds = seeds.map(seed => {
  Math.random = mulberry32(seed + 55731);
  const g = Game.create(seed, [0]);
  return { seed, g, opponents: g.state.teams.slice(1).map(t => g.simTeam(g.state, t.tid)) };
});
function trial(card: any, w: (typeof worlds)[number]) {
  const { g, seed, opponents } = w,
    s = g.state,
    ids = s.rosters[0];
  const pid = ids.slice(0, 5).find(id => g.db.P[id].grp === group[card.pos]) ?? ids[0];
  const old = g.db.P[pid],
    p = structuredClone(old),
    rows: any[] = [];
  g.db.P[pid] = p;
  try {
    Object.assign(p, { age: card.age, rot: 24, fat: 0, adjust: 0, hot: 0, inj: undefined, ctype: 'standard' });
    Math.random = mulberry32(seed + 991);
    const error = applyCard(p, card, g.db.C);
    if (error) throw new Error(error);
    p.tenQ = Object.fromEntries(TEN_KEYS.map(k => [k, 0]));
    const rank = optionRanks(g.db.P, { 0: ids }).get(pid) ?? 3;
    autoTen(p, { rank, mode: g.strategies(s.teams, s, true)[0], roles: g.rolesOf(p) });
    const team = g.simTeam(s, 0),
      us = team.players.find(x => x.id === pid)!;
    us.target = 24;
    us.manual = true;
    const rest = team.players.filter(x => x.id !== pid),
      sum = rest.reduce((a, x) => a + x.target, 0);
    for (const x of rest) x.target *= 216 / sum;
    for (let j = 0; j < games; j++) {
      Math.random = mulberry32((seed * 100003 + j * 19271 + 31177) >>> 0);
      const op = opponents[j % opponents.length],
        away = j % 2 === 1;
      const r = new GameSim(away ? op : team, away ? team : op, { norms: g.db.norms }).run();
      const a = away ? r.away : r.home,
        b = away ? r.home : r.away,
        q = a.box[pid];
      const poss = (Object.values(a.box).reduce((v, x) => v + x.onPO, 0) + Object.values(b.box).reduce((v, x) => v + x.onPO, 0)) / 10;
      rows.push({
        net: (100 * (a.pts - b.pts)) / poss,
        min: q.min,
        pts: q.pts,
        ast: q.ast,
        reb: q.orb + q.drb,
        stl: q.stl,
        blk: q.blk,
        tov: q.tov,
        fgm: q.fgm,
        fga: q.fga,
      });
    }
    return { rows, rank, ovr: ovrExact(p) };
  } finally {
    g.db.P[pid] = old;
  }
}
const diffs: number[] = [],
  samples: any[] = [],
  contexts: any[] = [];
for (const w of worlds) {
  const ps = Object.values(w.g.db.P).filter(
    (p: any) => p.r && !p.cls && !p.retired && p.grp === group[entry.revised.pos] && p.pos === entry.revised.pos,
  ) as any[];
  const pool = ps.length ? ps : (Object.values(w.g.db.P).filter((p: any) => p.r && !p.cls && p.grp === group[entry.revised.pos]) as any[]);
  pool.sort((a, b) => Math.abs(ovrExact(a) - 50) - Math.abs(ovrExact(b) - 50));
  const c = exportCard(structuredClone(pool[0]));
  c.pos = entry.revised.pos;
  const baseline = trial(c, w),
    result = trial(entry.revised, w);
  const d = result.rows.map((x, j) => x.net - baseline.rows[j].net);
  diffs.push(...d);
  samples.push(...result.rows);
  contexts.push({
    seed: w.seed,
    delta: d.reduce((a, b) => a + b, 0) / d.length,
    cardRank: result.rank,
    baselineOvr: baseline.ovr,
    cardOvr: result.ovr,
  });
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length,
  m = mean(diffs);
const se = Math.sqrt(diffs.reduce((s, d) => s + (d - m) ** 2, 0) / (diffs.length - 1) / diffs.length);
const worldSe = Math.sqrt(contexts.reduce((s, x) => s + (x.delta - m) ** 2, 0) / (contexts.length - 1) / contexts.length);
const total = (k: string) => samples.reduce((s, x) => s + x[k], 0),
  min = total('min');
console.log(
  JSON.stringify(
    {
      index,
      label: entry.label,
      collegeOnly: entry.revised.historical.league === 'NCAA',
      games: samples.length,
      seeds,
      minutes: 24,
      mode: 'AI refreshed; current roster option rank',
      deltaNetPer100: m,
      pairedGameSE: se,
      betweenWorldSE: worldSe,
      ci95: [m - 1.96 * Math.max(se, worldSe), m + 1.96 * Math.max(se, worldSe)],
      contexts,
      per36: Object.fromEntries(['pts', 'ast', 'reb', 'stl', 'blk', 'tov'].map(k => [k, (36 * total(k)) / min])),
      fg: total('fgm') / total('fga'),
    },
    null,
    2,
  ),
);

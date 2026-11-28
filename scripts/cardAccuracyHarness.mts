// Historical-card test harness; no league save is read or changed.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/engine/Game';
import { applyCard } from '../src/engine/playerCard';
import { mulberry32 } from '../src/engine/rng';
import { GameSim, type BoxLine, type ShotEvent, type SideResult } from '../src/engine/sim';
import { autoTen, optionRanks, TEN_KEYS } from '../src/engine/tendencies';
import { computeAdvanced, PER_TEAM_FIELDS, type Row, type StatLine } from '../src/engine/advanced';

type Mode = 'authored' | 'ai';
type Bucket = { releases: number; attempts: number; makes: number; expectedMakes: number; expectedAttempts: number };
type Options = {
  minutes?: number;
  games?: number;
  seeds?: number[];
  offset?: number;
  rank?: number;
  modes?: Mode[];
  details?: boolean;
  advanced?: boolean;
};

const group: Record<string, string> = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };
const worlds = new Map<number, { g: Game; opponents: ReturnType<Game['simTeam']>[] }>();
const rateFields = ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'];
const addBox = (totals: StatLine, box: BoxLine) => {
  for (const [key, value] of Object.entries(box)) totals[key] = (totals[key] ?? 0) + value;
};
const div = (n: number, d: number) => (d > 0 ? n / d : 0);

function world(seed: number) {
  const cached = worlds.get(seed);
  if (cached) return cached;
  Math.random = mulberry32(991127 + seed);
  const g = Game.create(seed, [0]),
    opponents = g.state.teams.slice(1).map(t => g.simTeam(g.state, t.tid));
  const result = { g, opponents };
  worlds.set(seed, result);
  return result;
}

function trackShot(buckets: Record<string, Bucket>, e: Readonly<ShotEvent>) {
  const b = (buckets[e.technique] ??= { releases: 0, attempts: 0, makes: 0, expectedMakes: 0, expectedAttempts: 0 });
  b.releases++;
  b.attempts += Number(e.attempt);
  b.makes += Number(e.made);
  b.expectedMakes += e.probability;
  b.expectedAttempts += e.fouled ? e.probability : 1;
}

function stats(t: StatLine, games: number, minutes: number, buckets: Record<string, Bucket>) {
  const normalized = Object.fromEntries(rateFields.map(k => [k, div(t[k], t.min) * minutes]));
  const raw = Object.fromEntries(rateFields.map(k => [k, div(t[k], games)]));
  const zones = Object.fromEntries(
    [
      ['rim', t.rm, t.ra],
      ['paint', t.km, t.ka],
      ['mid', t.mm - t.km, t.ma - t.ka],
      ['corner', t.cm, t.ca],
      ['aboveBreak', t.bm, t.ba],
    ].map(([name, m, a]) => [name, { share: div(a as number, t.fga), pct: div(m as number, a as number) }]),
  );
  const techniques = Object.fromEntries(
    Object.entries(buckets).map(([key, b]) => [
      key,
      {
        attempts: div(b.attempts, t.min) * minutes,
        share: div(b.attempts, t.fga),
        pct: div(b.makes, b.attempts),
        expectedPct: div(b.expectedMakes, b.expectedAttempts),
      },
    ]),
  );
  if (!Object.keys(techniques).length)
    for (const [type, key] of Object.entries({
      dunk: 'dunk',
      layup: 'layup',
      hook: 'hook',
      floater: 'floater',
      tip: 'tip',
      paintJumper: 'paintJump',
    })) {
      techniques[type] = {
        attempts: div(t[key + 'A'], t.min) * minutes,
        share: div(t[key + 'A'], t.fga),
        pct: div(t[key + 'M'], t[key + 'A']),
        expectedPct: undefined as any,
      };
    }
  return {
    games,
    min: div(t.min, games),
    ...normalized,
    reb: normalized.orb + normalized.drb,
    raw: { ...raw, reb: raw.orb + raw.drb },
    fg: div(t.fgm, t.fga),
    two: div(t.fgm - t.tpm, t.fga - t.tpa),
    tp: div(t.tpm, t.tpa),
    ft: div(t.ftm, t.fta),
    ts: div(t.pts, 2 * (t.fga + 0.44 * t.fta)),
    efg: div(t.fgm + 0.5 * t.tpm, t.fga),
    ftr: div(t.fta, t.fga),
    tpar: div(t.tpa, t.fga),
    tovPct: div(t.tov, t.fga + 0.44 * t.fta + t.tov),
    poss100: Object.fromEntries(['pts', 'ast', 'tov', 'orb'].map(k => [k, 100 * div(t[k], t.onPO)])),
    zones,
    techniques,
    creation: Object.fromEntries(
      [
        ['cns', 'qm', 'qa'],
        ['pullup', 'um', 'ua'],
        ['step', 'sm', 'sa'],
        ['fade', 'dm', 'da'],
      ].map(([k, m, a]) => [k, { share: div(t[a], t.qa + t.ua + t.sa + t.da), pct: div(t[m], t[a]) }]),
    ),
  };
}

// Aggregate the replay pool into two teams for the game's contextual estimates. These are matched-minute
// test figures and depend on the randomly generated opponents and teammates.
function advanceGame(
  side: SideResult,
  other: SideResult,
  tid: number,
  g: Game,
  seed: number,
  pid: number,
  teams: StatLine[],
  rows: Map<string, Row>,
) {
  const team = teams[tid];
  team.gp++;
  const fields = PER_TEAM_FIELDS.filter(f => f !== 'gp' && !/^o[A-Z]/.test(f));
  for (const [id, box] of Object.entries(side.box)) {
    for (const key of fields) team[key] += (box as unknown as StatLine)[key];
    if (box.min <= 0) continue;
    const key = +id === pid ? 'carrier' : `${seed}:${id}`;
    let row = rows.get(key);
    if (!row) {
      const p = g.db.P[+id];
      row = { tid, t: { gp: 0 }, p: { id: rows.size + 1, age: p.age, pos: p.pos } };
      rows.set(key, row);
    }
    row.t.gp++;
    addBox(row.t, box);
  }
  for (const box of Object.values(other.box)) {
    for (const key of fields) {
      const opponentKey = 'o' + key[0].toUpperCase() + key.slice(1);
      if (opponentKey in team) team[opponentKey] += (box as unknown as StatLine)[key];
    }
  }
}

const teamBlank = () => Object.fromEntries(PER_TEAM_FIELDS.map(k => [k, 0]));

export function evaluateCard(card: any, options: Options = {}) {
  const {
    minutes = card.historical?.minutes ?? card.target?.min ?? card.targets?.min ?? card.target?.mpg ?? card.targets?.mpg ?? card.mpg ?? 36,
    games = 100,
    seeds = [101, 202, 303],
    offset = 0,
    modes = ['authored', 'ai'],
    rank,
    details = false,
    advanced = false,
  } = options;
  if (!(minutes > 0 && minutes <= 48) || !Number.isInteger(games) || games < 1 || !seeds.length) {
    throw new Error('Expected historical minutes in (0, 48], a positive game count, and at least one seed');
  }
  const result: Record<string, unknown> = { minutes, seeds, gamesPerModePerWorld: games, offset };
  const random = Math.random;
  try {
    for (const mode of modes) {
      const total: StatLine = {},
        buckets: Record<string, Bucket> = {};
      const teams = [teamBlank(), teamBlank()],
        rows = new Map<string, Row>(),
        roles: number[] = [];
      let g!: Game,
        ovr = 0,
        potential = 0,
        wins = 0;
      for (const seed of seeds) {
        const w = world(seed);
        g = w.g;
        const s = g.state,
          starters: number[] = s.rosters[0].slice(0, 5);
        const pid = starters.find(id => g.db.P[id].grp === group[card.pos]) ?? starters[0];
        const original = g.db.P[pid],
          p = structuredClone(original);
        g.db.P[pid] = p;
        try {
          Math.random = mulberry32(771 + seed);
          Object.assign(p, {
            age: card.age ?? p.age,
            fat: 0,
            adjust: 0,
            rot: minutes,
            ctype: 'standard',
            dev: false,
            inj: undefined,
            hot: 0,
          });
          const error = applyCard(p, card, g.db.C);
          if (error) throw new Error(error);
          p.tenQ = Object.fromEntries(TEN_KEYS.map(k => [k, 0]));
          const optionRank = rank ?? optionRanks(g.db.P, { 0: s.rosters[0] }).get(pid) ?? 0;
          roles.push(optionRank);
          if (mode === 'ai') autoTen(p, { rank: optionRank, mode: g.strategies(s.teams, s, true)[0], roles: g.rolesOf(p) });
          ovr = p.ovr;
          potential = p.tpot ?? p.pot;
          const team = g.simTeam(s, 0),
            player = team.players.find(x => x.id === pid);
          if (!player) throw new Error('Card did not make the test rotation');
          const others = team.players.filter(x => x.id !== pid),
            sum = others.reduce((a, x) => a + x.target, 0);
          player.target = minutes;
          player.manual = true;
          for (const x of others) x.target *= div(240 - minutes, sum);
          Math.random = mulberry32(17717 + seed * 10000 + offset);
          const onShot = details
            ? (e: Readonly<ShotEvent>) => {
                if (e.shooterId === pid) trackShot(buckets, e);
              }
            : undefined;
          for (let j = 0; j < games; j++) {
            const opponent = w.opponents[(((j + offset) % w.opponents.length) + w.opponents.length) % w.opponents.length];
            const away = j % 2 === 1;
            const res = new GameSim(away ? opponent : team, away ? team : opponent, { norms: g.db.norms, onShot }).run();
            const us = away ? res.away : res.home,
              them = away ? res.home : res.away;
            addBox(total, us.box[pid]);
            wins += Number(us.pts > them.pts);
            if (advanced) {
              advanceGame(us, them, 0, g, seed, pid, teams, rows);
              advanceGame(them, us, 1, g, seed, pid, teams, rows);
            }
          }
        } finally {
          g.db.P[pid] = original;
        }
      }
      const n = games * seeds.length;
      let context: StatLine | undefined;
      if (advanced) {
        const adv = computeAdvanced(
          g,
          g.Y,
          { 0: teams[0], 1: teams[1] },
          [...rows.values()],
          tid => div(tid ? n - wins : wins, n),
          [0, 1],
          n,
          true,
        );
        const line = adv.byPid[rows.get('carrier')!.p.id];
        context = Object.fromEntries(
          [
            'per',
            'usgp',
            'astp',
            'orbp',
            'drbp',
            'trbp',
            'stlp',
            'blkp',
            'bpm',
            'obpm',
            'dbpm',
            'ows',
            'dws',
            'ws',
            'ws48',
            'vorp',
            'ortg',
            'drtg',
            'onOff100',
          ].map(k => [k, line[k]]),
        );
      }
      result[mode] = { ovr, potential, ranks: roles, ...stats(total, n, minutes, buckets), advanced: context };
    }
  } finally {
    Math.random = random;
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , file, games = '100', seeds = '101,202,303', offset = '0', minutes, rank] = process.argv;
  if (!file) throw new Error('Usage: cardAccuracyHarness.mts CARD [GAMES] [SEEDS] [OFFSET] [MPG] [OPTION_RANK]');
  const card = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const out = evaluateCard(card, {
    games: +games,
    seeds: seeds.split(',').map(Number),
    offset: +offset,
    ...(minutes ? { minutes: +minutes } : {}),
    ...(rank ? { rank: +rank } : {}),
    details: true,
    advanced: true,
  });
  console.log(JSON.stringify(out));
}

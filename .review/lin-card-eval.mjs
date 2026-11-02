// Production-engine comparison at Lin's historical minutes. No shot/box-score stubs.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepare, runtime } from './reproduce.mjs';

await prepare();
const engine = name => import(pathToFileURL(join(runtime, 'src/engine', name + '.mjs')).href);
const [{ Game }, cards, tendencies, { GameSim }, { mulberry32 }] = await Promise.all(
  ['Game', 'playerCard', 'tendencies', 'sim', 'rng'].map(engine)
);
export { cards };

function rates(total, minutes, targetMinutes) {
  const out = {};
  for (const k of ['pts', 'fga', 'tpa', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf']) {
    out[k] = total[k] / minutes * targetMinutes;
  }
  out.reb = out.orb + out.drb;
  for (const [k, m, a] of [
    ['fg', 'fgm', 'fga'], ['tp', 'tpm', 'tpa'], ['ft', 'ftm', 'fta'],
    ['rimPct', 'rm', 'ra'], ['paintPct', 'km', 'ka'],
    ['cornerPct', 'cm', 'ca'], ['aboveBreakPct', 'bm', 'ba']
  ]) out[k] = total[a] ? total[m] / total[a] : 0;
  // mm/ma include non-RA paint: subtract it to get true outside-paint mid-range.
  out.outsideMidPct = (total.mm - total.km) / (total.ma - total.ka);
  for (const [k, a] of [['rimShare', 'ra'], ['paintShare', 'ka'], ['cornerShare', 'ca'], ['aboveBreakShare', 'ba']]) {
    out[k] = total[a] / total.fga;
  }
  out.midShare = (total.ma - total.ka) / total.fga;
  return out;
}

export function evaluateLin(card, { seeds = [101, 202, 303], games = 200, offset = 14000001, minutes = 940 / 35 } = {}) {
  const randomBefore = Math.random, total = {}, modes = { authored: {}, ai: {} }, observed = { authored: 0, ai: 0 };
  try {
    for (const seed of seeds) {
      // Each world starts independently of how many worlds/cards were evaluated before it.
      Math.random = mulberry32(991127 + seed);
      const g = Game.create(seed, [0]), s = g.state;
      for (const mode of ['authored', 'ai']) {
        const candidates = s.rosters[0].slice(0, 5);
        const pid = candidates.find(id => g.db.P[id].grp === 'G') ?? candidates[0];
        const original = g.db.P[pid], p = structuredClone(original);
        g.db.P[pid] = p;
        Math.random = mulberry32(771 + seed);
        const error = cards.applyCard(p, card, g.db.C);
        if (error) throw new Error(error);
        Object.assign(p, { age: card.age, fat: 0, adjust: 0, rot: minutes, ctype: 'standard', dev: false, inj: undefined, hot: 0 });
        p.tenQ = Object.fromEntries(tendencies.TEN_KEYS.map(k => [k, 0]));
        if (mode === 'ai') tendencies.autoTen(p, { rank: 3, roles: g.rolesOf(p) });
        const home = g.simTeam(s, 0), carrier = home.players.find(x => x.id === pid);
        const others = home.players.filter(x => x.id !== pid), sum = others.reduce((a, x) => a + x.target, 0);
        carrier.target = minutes; carrier.manual = true;
        others.forEach(x => { x.target *= (240 - minutes) / sum; });
        const opponents = s.teams.slice(1).map(t => g.simTeam(s, t.tid));
        Math.random = mulberry32(17717 + seed * 10000 + offset);
        for (let j = 0; j < games; j++) {
          const opp = opponents[(j + offset) % opponents.length], flip = j % 2 === 1;
          const result = new GameSim(flip ? opp : home, flip ? home : opp, { norms: g.db.norms }).run();
          const b = (flip ? result.away : result.home).box[pid];
          observed[mode] += b.min;
          for (const [k, v] of Object.entries(b)) if (typeof v === 'number') {
            total[k] = (total[k] ?? 0) + v;
            modes[mode][k] = (modes[mode][k] ?? 0) + v;
          }
        }
        g.db.P[pid] = original;
      }
    }
  } finally { Math.random = randomBefore; }
  return {
    measured: rates(total, observed.authored + observed.ai, minutes),
    byStyle: Object.fromEntries(Object.entries(modes).map(([mode, t]) => [mode, rates(t, observed[mode], minutes)])),
    counts: total, observedMinutes: observed, seeds, gamesPerStylePerWorld: games,
    games: games * seeds.length * 2, offset
  };
}

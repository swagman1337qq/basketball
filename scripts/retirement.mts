import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { retirementChance, retirementProduction, keepFreeAgent } from '../src/engine/retirement';
import { newLeague, clr } from './lib/headless.mts';
import { Game } from '../src/engine/Game';
import { shiftOvr, syncOvr } from '../src/engine/ratings';
const season = 2052;
const line = (gp: number, mpg: number, ppg: number, more: any = {}) => {
  const avg = {
    min: mpg,
    pts: ppg,
    fgm: ppg / 2.8,
    fga: ppg / 1.15,
    ftm: ppg / 6,
    fta: ppg / 5,
    orb: 1,
    drb: 3,
    ast: 2,
    stl: 0.7,
    blk: 0.3,
    tov: 1.6,
    pf: 2,
    ...more,
  };
  return { season, tid: 0, po: false, gp, ...Object.fromEntries(Object.entries(avg).map(([k, v]) => [k, Number(v) * gp])) };
};
const scorer = {
  age: 37,
  ovr: 48,
  stats: [line(75, 37, 25.2, { orb: 3.4, drb: 8.2, ast: 1.4, fga: 22.5, fgm: 8.6, ftm: 2.8, fta: 3.3, tov: 4 })],
};
const big = { age: 36, ovr: 50, stats: [line(62, 31, 16.2, { fgm: 6.4, fga: 9.5, orb: 3.3, drb: 6.5, ast: 1, blk: 0.9, tov: 1.2 })] };
const guard = { age: 35, ovr: 49, stats: [line(69, 28.1, 13.8, { fgm: 4.6, fga: 9.8, ast: 3.9, orb: 0.2, drb: 1.7, tov: 1.2 })] };
for (const p of [scorer, big, guard]) {
  const before = JSON.stringify(p);
  assert(retirementProduction(p, season).useful);
  assert(retirementChance(p, season, true) <= 0.012, 'Productive veterans almost always continue');
  assert(retirementChance(p, season, false) <= 0.012);
  assert(keepFreeAgent(p, season), 'The unsigned-player cleanup must not undo production protection');
  assert.equal(JSON.stringify(p), before, 'Stats and ratings are read-only');
  assert(
    retirementChance(p, season + 1, false) > retirementChance(p, season, false),
    'A year out of the league removes stale production protection',
  );
  assert(!keepFreeAgent(p, season + 1));
}
const role = { age: 36, ovr: 46, stats: [line(65, 24, 6, { fgm: 2.2, fga: 4.9, orb: 2, drb: 4, ast: 3, stl: 1.2, blk: 1, tov: 0.8 })] };
assert(retirementProduction(role, season).useful, 'Useful defenders/playmakers need no scoring threshold');
const empty = { age: 36, ovr: 35, stats: [line(30, 5, 1, { fgm: 0.3, fga: 1.2, orb: 0.1, drb: 0.5, ast: 0.1, tov: 0.5 })] };
assert(!retirementProduction(empty, season).useful);
assert(retirementChance(empty, season, false) > retirementChance(empty, season, true));
assert(retirementChance(empty, season, true) > retirementChance(scorer, season, true) * 10);
const split = {
  ...scorer,
  stats: [
    {
      ...scorer.stats[0],
      gp: 30,
      ...Object.fromEntries(
        Object.entries(scorer.stats[0])
          .filter(([k]) => !['gp', 'season', 'tid', 'po'].includes(k))
          .map(([k, v]) => [k, Number(v) * 0.4]),
      ),
    },
    {
      ...scorer.stats[0],
      tid: 1,
      gp: 45,
      ...Object.fromEntries(
        Object.entries(scorer.stats[0])
          .filter(([k]) => !['gp', 'season', 'tid', 'po'].includes(k))
          .map(([k, v]) => [k, Number(v) * 0.6]),
      ),
    },
  ],
};
assert.deepEqual(retirementProduction(split, season), retirementProduction(scorer, season), 'All traded-team rows count once');
assert(!retirementProduction({ ...scorer, stats: [line(1, 37, 60)] }, season).useful, 'One-game outliers do not protect a career');
assert(
  !retirementProduction({ ...scorer, stats: [{ ...scorer.stats[0], po: true }] }, season).useful,
  'Playoff-only lines cannot stand in for a full season',
);
assert(
  !retirementProduction({ ...scorer, stats: [{ ...scorer.stats[0], season: season + 1 }] }, season).useful,
  'Future lines cannot affect retirement',
);
assert.equal(retirementChance({ ...scorer, age: 25 }, season, true), 0);
assert(retirementChance({ ...scorer, age: 43 }, season, true) < 0.04, 'No hidden age cap for productive players');
assert(retirementChance(scorer, season, true) > 0, 'Rare voluntary retirement remains possible');
assert(
  retirementChance({ ...empty, ovr: 65, stats: [] }, season, true) < 0.03,
  'Good returning players are not retired solely for missing a season',
);
const declined = { ...empty, stats: [{ ...scorer.stats[0], season: season - 1 }, ...empty.stats] };
assert(!retirementProduction(declined, season).useful, 'A poor current season replaces a strong older one');
assert(!keepFreeAgent(declined, season));
assert(
  !retirementProduction({ ...scorer, stats: [line(80, 37, 25, { fga: 38, fgm: 8, ftm: 3, fta: 5, tov: 7 })] }, season).useful,
  'Scoring volume alone cannot outweigh extreme inefficiency',
);
assert.equal(
  retirementChance({ ...scorer, retired: { season: season - 1 } }, season, true),
  0,
  'Existing retirees are not reconsidered or resurrected',
);

// Actual training-camp pipeline: the three supplied production shapes, on both
// a managed and AI team, plus an unsigned scorer below the old overall cutoff.
const g: any = newLeague(7381),
  P = g.db.P,
  ids: number[] = [];
for (const tid of [0, 1])
  for (const [i, fixture] of [scorer, big, guard].entries()) {
    const id = g.state.rosters[tid][i],
      p = P[id];
    Object.assign(p, JSON.parse(JSON.stringify(fixture)), { age: fixture.age - 1, frozen: true, exp: g.Y + 5 });
    p.stats.forEach(r => (r.season = g.Y));
    shiftOvr(p, fixture.ovr);
    syncOvr(p);
    ids.push(id);
  }
const fid = g.state.fa[0],
  free = P[fid];
Object.assign(free, JSON.parse(JSON.stringify(scorer)), { age: scorer.age - 1, frozen: true });
free.stats.forEach(r => (r.season = g.Y));
shiftOvr(free, scorer.ovr);
syncOvr(free);
ids.push(fid);
// Force the 90-player free-agent cap to run, with enough higher-overall young
// players that this veteran falls below it. His current production must keep
// him available through that second cleanup too.
const fillerIds = Array.from({ length: 110 }, (_, i) => 1000000 + i);
for (const id of fillerIds) {
  const p = JSON.parse(JSON.stringify(free));
  Object.assign(p, { id, name: 'Pool fixture ' + id, age: 26, stats: [], frozen: true });
  shiftOvr(p, 50);
  P[id] = p;
}
g.setState(st => ({ fa: [...st.fa, ...fillerIds] }));
assert(g.state.fa.filter(id => P[id].ovr > free.ovr).length >= 90);
const oldY = g.Y,
  stats = ids.map(id => JSON.stringify(P[id].stats)),
  ratings = ids.map(id => JSON.stringify(P[id].r));
ids.forEach(id => assert(P[id].ovr < 52, 'These fixtures reproduce the previous automatic retirement trigger'));
g.setState({ phase: 'fa', day: Game.FA_END, faStart: 0, offerSheets: [], agentCalls: [] });
clr(g);
const random = Math.random;
Math.random = () => 0.5;
try {
  g.startPreseason();
} finally {
  Math.random = random;
}
assert.equal(g.Y, oldY + 1, 'The real annual rollover completed');
assert.equal(g.state.phase, 'preseason');
ids.forEach((id, i) => {
  assert(!P[id].retired, 'A productive veteran must survive the old automatic/35% retirement path');
  assert.equal(JSON.stringify(P[id].stats), stats[i]);
  assert.equal(JSON.stringify(P[id].r), ratings[i]);
});
assert(
  g.state.fa.includes(fid) || Object.values(g.state.rosters).some((r: any) => r.includes(fid)),
  'Unsigned scorer remains available or signs',
);
const saved: any = Game.load(JSON.parse(JSON.stringify(g.toSave())));
ids.forEach(id => assert(!saved.db.P[id].retired));
saved.setState({ retireAge: 35 });
saved.enforceRetirement();
ids.forEach(id => assert(saved.db.P[id].retired, 'An explicit mandatory retirement setting still applies'));

const batch = Array.from({ length: 1000 }, (_, i) => ({
  ...scorer,
  age: 32 + (i % 12),
  stats: Array.from({ length: 20 }, (_, j) => ({ ...scorer.stats[0], season: season - j })),
}));
const start = performance.now();
let sink = 0;
for (let n = 0; n < 20; n++) for (const p of batch) sink += retirementChance(p, season, true);
const ms = (performance.now() - start) / 20;
assert(ms < 100, 'Once-a-summer retirement reads stay lightweight');
console.log(
  JSON.stringify({
    status: 'PASS',
    productionCases: 3,
    managedAndAIPlayers: 6,
    unsignedVeteran: true,
    statAndRatingMutation: false,
    saveReopen: true,
    mandatorySetting: true,
    per1000PlayersMs: +ms.toFixed(2),
    sink,
  }),
);

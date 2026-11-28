import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { checkTrade, nums, stdIds, twoWayIds, TWO_WAY_MAX } from '../src/engine/cba';
import { waivePlayer } from '../src/engine/contracts';
import { aiTradeIdea } from '../src/engine/tradeLogic';
import { mulberry32 } from '../src/engine/rng';

Math.random = mulberry32(20261127);
// Finish unrelated save migrations before checking that roster repair consumes no randomness.
const base = Game.load(Game.create(20261127, [0]).toSave()).toSave();
const fixture = () => {
  const g = Game.load(structuredClone(base)),
    s = g.state;
  Object.assign(s, { phase: 'regular', day: 10, gmSetup: false, god: false, capEasy: false, easyContracts: false, cap: {} });
  for (const tid of [0, 1]) {
    while (s.rosters[tid].length < 18) s.rosters[tid].push(s.fa.shift());
    for (const id of s.rosters[tid]) {
      const p = g.db.P[id];
      Object.assign(p, { ctype: 'standard', amt: 1, exp: g.Y + 2, age: 27, kicker: 0, inc: [] });
      for (const k of ['signed', 'ntc', 'extNoTrade', 'rookieScale', 'twoWay', 'capOverride']) delete p[k];
    }
    s.teams[tid].capAdj = 0;
  }
  return g;
};
const markTwoWay = (g: Game, tid: number, ids: number[]) => {
  for (const id of ids) Object.assign(g.db.P[id], { ctype: 'twoWay', amt: nums(g).TWO_WAY, capOverride: 0, twoWay: { tid, games: 12 } });
};
const expectLegal = (result: ReturnType<typeof checkTrade>, why: string) => assert(result.ok, why + ': ' + result.errs.join(' '));

// The same league-office rule must apply to either side and to a two-way hidden in a larger package.
const g = fixture(),
  s = g.state,
  a = s.rosters[0],
  b = s.rosters[1];
markTwoWay(g, 0, a.slice(0, 3));
markTwoWay(g, 1, b.slice(0, 3));
for (const god of [false, true]) {
  const st = { ...s, god },
    incomingB = checkTrade(g, st, 0, 1, [a[0], a[3]], [b[3]], [], []),
    incomingA = checkTrade(g, st, 0, 1, [a[3]], [b[0], b[3]], [], []);
  for (const [result, tid] of [
    [incomingB, 1],
    [incomingA, 0],
  ] as const) {
    assert.equal(result.ok, false, 'a trade cannot increase either team from three to four two-ways');
    assert(
      result.errs.some(e => e.includes(s.teams[tid].abbr) && /two.way/i.test(e) && /4/.test(e)),
      'name the offending team and count',
    );
  }
}
expectLegal(checkTrade(g, s, 0, 1, [a[0]], [b[0]], [], []), 'one-for-one two-way swap at the limit');
g.db.P[b[2]].ctype = 'standard';
expectLegal(checkTrade(g, s, 0, 1, [a[0], a[3]], [b[3]], [], []), 'receiving a third two-way remains legal');
// An old or God Mode roster can trade toward legality even if one outgoing player leaves it above three.
g.db.P[a[1]].ctype = g.db.P[a[2]].ctype = 'standard';
markTwoWay(g, 1, b.slice(0, 5));
expectLegal(checkTrade(g, s, 0, 1, [a[3]], [b[0]], [], []), 'reducing five two-ways to four remains legal');
g.db.P[b[4]].ctype = 'standard';
expectLegal(checkTrade(g, s, 0, 1, [a[3]], [b[0]], [], []), 'trading away a fourth two-way restores a legal roster');
const pickA = s.assets.find((p: any) => p.owner === 0 && p.rd === 2),
  pickB = s.assets.find((p: any) => p.owner === 1 && p.rd === 2);
assert(pickA && pickB);
expectLegal(checkTrade(g, s, 0, 1, [], [], [pickA.id], [pickB.id]), 'pick-only trades do not worsen an already excessive two-way roster');

// Exercise the actual salary-dump selector: both clubs want this package, but a full receiver
// must send a standard player back and its three two-ways leave no spot for the young sweetener.
const market: any = fixture(),
  ms = market.state,
  ma = ms.rosters[0],
  mb = ms.rosters[1],
  bad = ma[3],
  young = ma[0],
  back = mb[3];
Object.assign(ms, { teams: ms.teams.slice(0, 2), managed: [], assets: [] });
markTwoWay(market, 0, ma.slice(0, 3));
markTwoWay(market, 1, mb.slice(0, 3));
Object.assign(market.db.P[bad], { amt: 20, age: 30, ovr: 40, pot: 40 });
Object.assign(market.db.P[young], { age: 21, ovr: 40, pot: 45 });
delete market.db.P[young].dr;
market.db.P[back].exp = market.Y + 1;
for (const id of mb.filter((id: number) => id !== back)) market.db.P[id].exp = market.Y + 3;
ms.teams[0].capAdj = nums(market).CAP + 1;
market.strategies = () => ({ 0: 'middle', 1: 'rebuild' });
market.taxWeary = () => false;
market.fair = () => 1;
market.pVal = (p: any) => (p.id === young ? 1 : p.id === bad ? -10 : 0);
market.tradeP = (p: any, _st: string, tid: number) => (p.id === bad ? -10 : p.id === young ? (tid === 1 ? 30 : 1) : p.id === back ? 2 : 0);
market.kVal = () => 0;
assert.equal(stdIds(market, mb).length, 15);
assert.equal(
  aiTradeIdea(market, ms, () => 0.65),
  null,
  'AI rejects the otherwise desirable salary dump that creates a fourth two-way',
);
market.db.P[mb[0]].ctype = 'standard';
// Keep the standard roster full when freeing the two-way place.
ms.rosters[1] = mb.filter((id: number) => id !== mb[4]);
const accepted = aiTradeIdea(market, { ...ms }, () => 0.65);
assert(
  accepted?.aP.includes(bad) && accepted.aP.includes(young) && accepted.bP.includes(back),
  'the selector finds the same salary dump once a legal two-way place exists',
);
expectLegal(
  checkTrade(market, ms, accepted.a, accepted.b, accepted.aP, accepted.bP, accepted.aK, accepted.bK),
  'AI control package clears league-office rules',
);

// Waiver claims also need a two-way place, even when standard roster space is available.
for (const count of [TWO_WAY_MAX, TWO_WAY_MAX - 1]) {
  const waiver = fixture(),
    ws = waiver.state,
    outgoing = ws.rosters[0][0];
  ws.teams = ws.teams.slice(0, 2);
  ws.rosters[1] = ws.rosters[1].slice(0, count + 14);
  markTwoWay(waiver, 0, [outgoing]);
  markTwoWay(waiver, 1, ws.rosters[1].slice(0, count));
  waiver.db.P[outgoing].ovr = 60;
  const box = { rosters: structuredClone(ws.rosters), fa: ws.fa.slice(), cap: structuredClone(ws.cap) };
  Math.random = () => 0;
  waivePlayer(waiver, ws, box, 0, waiver.db.P[outgoing]);
  assert.equal(box.rosters[1].includes(outgoing), count < TWO_WAY_MAX, 'a claim needs a free two-way place');
  assert.equal(box.fa.includes(outgoing), count === TWO_WAY_MAX, 'unclaimed player enters free agency');
  assert(twoWayIds(waiver, box.rosters[1]).length <= TWO_WAY_MAX);
}

// Repair old AI rosters on load, retaining the user's manual God Mode roster and every earned rating/statistic.
const old = fixture(),
  os = old.state,
  aiIds = os.rosters[1].slice(0, 5),
  userIds = os.rosters[0].slice(0, 4);
os.god = true;
markTwoWay(old, 1, aiIds);
markTwoWay(old, 0, userIds);
aiIds.forEach((id: number, i: number) => {
  old.db.P[id].ovr = i < 3 ? 40 : 50 + i;
  old.db.P[id].stats = [{ season: old.Y, tid: 1, gp: 7, min: 202, pts: 101, ast: 11, reb: 20 }];
});
const released = aiIds
    .slice()
    .sort((x: number, y: number) => old.db.P[x].ovr - old.db.P[y].ovr || x - y)
    .slice(0, 2),
  protectedData = (game: Game) =>
    JSON.stringify({
      players: Object.values(game.db.P).map((p: any) => [p.id, p.r, p.ovr, p.pot, p.tpot, p.ceil, p.stats, p.rh, p.awards]),
      history: game.state.history,
      tstats: game.state.tstats,
      trades: game.db.trades,
    }),
  protectedBefore = protectedData(old),
  rosterBefore = structuredClone(os.rosters),
  capBefore = structuredClone(os.cap),
  txBefore = new Map(released.map((id: number) => [id, structuredClone(old.db.P[id].tx || [])])),
  input = structuredClone(old.toSave());
Math.random = () => {
  throw new Error('Loading an excess two-way roster must not consume random numbers');
};
const repaired = Game.load(structuredClone(input)),
  repairedAgain = Game.load(structuredClone(input));
assert.equal(twoWayIds(repaired, repaired.state.rosters[1]).length, TWO_WAY_MAX);
assert.deepEqual(repaired.state.rosters[0], rosterBefore[0], 'managed God Mode roster remains under manual control');
assert.equal(twoWayIds(repaired, repaired.state.rosters[0]).length, 4);
assert.equal(
  protectedData(repaired),
  protectedBefore,
  'repair preserves ratings, rating history, statistics, league history and past trades',
);
for (const [tid, ids] of Object.entries(rosterBefore))
  assert.deepEqual(
    repaired.state.rosters[tid],
    tid === '1' ? (ids as number[]).filter(id => !released.includes(id)) : ids,
    'only the excess AI two-ways leave their roster',
  );
for (const id of released) {
  const p = repaired.db.P[id],
    prior = txBefore.get(id)!;
  assert.equal(repaired.state.fa.filter((pid: number) => pid === id).length, 1);
  assert.deepEqual(p.tx.slice(0, -1), prior, 'existing transaction history is retained');
  assert.equal(p.tx.at(-1).k, 'waive');
  assert.equal(p.tx.at(-1).tid, 1);
  assert.match(p.tx.at(-1).text, /waived/i);
  assert.equal(p.waived.tid, 1);
  assert.equal(p.waived.season, old.Y);
  assert.equal(p.waived.day, os.day);
  assert.equal(p.lastTid, 1);
  assert.equal(p.ctype, 'standard');
  assert.equal(p.twoWay, undefined);
  assert.equal(p.capOverride, undefined);
  assert(
    repaired.state.lgLog.some((entry: any) => entry.type === 'Release' && entry.pids?.includes(id)),
    'release appears in league transactions',
  );
}
assert.deepEqual(repaired.state.cap, { ...capBefore, 1: capBefore[1] || {} }, 'non-guaranteed two-ways do not create dead salary');
const repairState = (game: Game) =>
  JSON.stringify({
    rosters: game.state.rosters,
    fa: game.state.fa,
    cap: game.state.cap,
    log: game.state.lgLog,
    players: Object.values(game.db.P).map((p: any) => [p.id, p.tx, p.waived, p.ctype, p.twoWay]),
  });
assert.equal(repairState(repairedAgain), repairState(repaired), 'repair is deterministic for the same saved league');
const reloaded = Game.load(structuredClone(repaired.toSave()));
assert.equal(repairState(reloaded), repairState(repaired), 'save and reload is idempotent and creates no duplicate releases');
assert.equal(protectedData(reloaded), protectedBefore);

console.log(
  'PASS: two-way trade limits on both sides, legal swaps and reductions, salary-dump selector, waiver claims, and deterministic AI save repair with preserved stats and manual rosters.',
);

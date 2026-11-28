import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { nums, numsForSeason, yosOf, yosForSeason, maxFor, newExtension, extensionFirst } from '../src/engine/cba';
import { acceptance, applySigning, validateSigning, aiTerms } from '../src/engine/contracts';
import { askOf, askingFloor, aiExtensions, openFreeAgency } from '../src/engine/cbaFlow';
import { mulberry32 } from '../src/engine/rng';

Math.random = mulberry32(20261127);
const g: any = Game.create(20261127, [0]);
const N = nums(g);
for (const id of Object.values(g.state.rosters).flat() as number[]) {
  const p = g.db.P[id];
  if (!p.rookie) assert.ok(p.amt <= N.max(yosOf(g, p)) + 0.01, p.name + ' generated service max');
  assert.ok(p.contractMeta && p.contractMeta.cap === N.CAP);
}
assert.ok(g.state.fa.every((id: number) => g.db.P[id].ask0 === g.db.P[id].ask));
const p: any = structuredClone(g.db.P[g.state.rosters[0][0]]);
p.stats = [
  { season: 2027, gp: 82 },
  { season: 2028, gp: 82 },
  { season: 2028, po: true, gp: 12 },
];
p.exp = 2029;
g.state.season = 2028;
g.state.phase = 'fa';
g.db.capYear = 2029;
for (const [base, previous, incoming] of [
  [5, 6, 7],
  [8, 9, 10],
]) {
  p.yos0 = base;
  assert.equal(yosOf(g, p), previous);
  assert.equal(yosForSeason(g, p, 2029), incoming, 'completed season counted once, playoffs not twice');
  assert.equal(maxFor(g, g.state, p, 0).amt, N.max(incoming));
}
p.yos0 = 8;
p.age = 29;
p.ovr = 68;
p.pot = 68;
p.mood = 'Open';
assert.ok(askOf(g, p) <= N.max(10));
const state = { ...g.state, rosters: { ...g.state.rosters, 0: [] }, cap: {}, fa: [p.id] };
p.birdTid = 0;
p.yrsWith = 10;
const terms = { method: 'bird', amt: N.max(10), years: 3 };
p.ask = N.max(10);
p.pers = { mot: 'Money' };
assert.equal(g.askFor(p, state), N.max(10), 'user negotiation quote uses incoming service tier');
assert.equal(aiTerms(g, state, 0, p)?.amt, N.max(10), 'AI quote uses the same incoming tier');
assert.ok(acceptance(g, state, 0, p, terms).ok);
assert.ok(validateSigning(g, state, 0, p, terms).ok, 'legal incoming-tier max is available in the real signing validator');
const box = { rosters: { ...state.rosters }, fa: [...state.fa], overseas: [], cap: {} };
applySigning(g, state, box, 0, p, terms);
assert.equal(p.signed.season, 2029);
assert.equal(p.contractMeta.service, 10);
assert.equal(p.ctype, 'max');
g.state.easyContracts = true;
state.easyContracts = true;
assert.ok(validateSigning(g, state, 0, p, { ...terms, method: 'std' }).ok, 'simple contracts accept the incoming service-tier max too');
const easyFuture = numsForSeason(g, 2030);
assert.equal(easyFuture.AP1, easyFuture.AP2, 'cached future numbers follow simple-contract mode');
g.state.easyContracts = false;
state.easyContracts = false;
assert.ok(numsForSeason(g, 2030).AP1 < numsForSeason(g, 2030).AP2, 'projection cache refreshes when mode changes back');
p.exp = 2029;
const start = p.exp + 1;
const mx = maxFor(g, g.state, p, 0, 'vetExt').amt;
p.ext = newExtension(g, g.state, p, 0, mx, 3, 0.08);
assert.equal(p.ext.maxPct, 0.35);
assert.equal(newExtension(g, g.state, p, 0, mx - 0.01, 3, 0.08).maxPct, undefined, 'an explicit dollar below max remains fixed');
assert.equal(extensionFirst(g, p), mx);
const projected = numsForSeason(g, start).CAP;
assert.ok(Number.isFinite(numsForSeason(g, NaN).CAP), 'missing contract year cannot stall cap projection');
assert.equal(numsForSeason(g, start + 0.5).CAP, projected, 'fractional imported year cannot create a nonterminating projection');
g.db.caps.CAP += 10; // a customized cap applies to an explicit max deal
assert.equal(extensionFirst(g, p), +(numsForSeason(g, start).CAP * 0.35).toFixed(2));
assert.ok(numsForSeason(g, start).CAP > projected);
p.ext = newExtension(g, g.state, p, 0, mx * 0.8, 3, 0.08);
assert.equal(p.ext.maxPct, undefined);
const dollars = p.ext.amt;
g.db.caps.CAP += 10;
assert.equal(extensionFirst(g, p), dollars, 'ordinary extension keeps fixed dollars');
p.ext = { amt: 9.25, yrs: 2 };
assert.equal(extensionFirst(g, p), 9.25, 'legacy extension is not silently repriced');
g.state.phase = 'preseason';
g.state.season = 2029;
p.stats.push({ season: 2029, gp: 0 });
p.yos0 = 7;
assert.equal(yosForSeason(g, p, 2030, true), 10, 'extension projects final guaranteed service year once');
g.db.P[p.id] = p;
p.ask = 0.5;
delete p.ask0;
assert.ok(askingFloor(g, p) >= askOf(g, p) * 0.85, 'old and initial free agents protected without ask0');
p.ask0 = askOf(g, p) * 2;
assert.ok(askingFloor(g, p) <= askOf(g, p), 'old ask does not trap aging players above market');
// An AI veteran extension cap cannot force a breakout player to accept a bargain.
g.state.managed = [];
g.state.me = -1;
p.amt = 2;
p.exp = 2029;
p.yrsWith = 3;
p.signed = { season: 2026 };
p.pers = { mot: 'Money' };
delete p.ext;
delete p.rookieScale;
g.state.rosters[0] = [p.id];
Math.random = () => 0;
aiExtensions(g, g.state, 100);
assert.equal(p.ext, undefined, 'breakout waits for free agency instead of capped cheap extension');
p.amt = maxFor(g, g.state, p, 0, 'vetExt').amt;
aiExtensions(g, g.state, 100);
assert.ok(p.ext, 'positive control: same eligible veteran can accept a market extension');
// The production offseason activates a max as a percentage, and leaves a
// separately negotiated dollar extension unchanged.
const legacy = g.db.P[g.state.rosters[1][0]];
legacy.exp = g.Y;
legacy.ext = { amt: 9.25, yrs: 2, raise: 0.05 };
const oldStats = structuredClone(p.stats);
p.exp = g.Y;
p.ext = newExtension(g, g.state, p, 0, maxFor(g, g.state, p, 0, 'vetExt').amt, 3, 0.08);
const pending = Game.load(g.toSave());
assert.equal(pending.db.P[p.id].ext.maxPct, p.ext.maxPct, 'max provenance survives save and reload');
const expected = extensionFirst(g, p);
g.state.picks = [];
const patch = openFreeAgency(g, g.state);
assert.equal(p.amt, expected, 'maximum extension activates at the new cap');
assert.equal(legacy.amt, 9.25, 'fixed-dollar extension activates unchanged');
assert.deepEqual(p.stats, oldStats, 'offseason contract transition leaves historical statistics intact');
g.state = { ...g.state, ...patch };
// Loading a current save does not rewrite existing contracts or their history.
const save = g.toSave();
const loaded = Game.load(structuredClone(save));
assert.equal(loaded.db.P[p.id].amt, p.amt);
assert.deepEqual(loaded.db.P[p.id].stats, p.stats);
assert.deepEqual(loaded.db.P[p.id].contractMeta, p.contractMeta);
assert.equal(loaded.db.capYear, g.db.capYear);
console.log(
  'PASS: contract-year service tiers, projected max extensions, fixed/legacy dollars, initial contracts, star asks and discounted extension rejection.',
);

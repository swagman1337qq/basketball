// Unit tests (2026-11-08): small, fast checks of pure engine functions (a few seconds, no league simulation).
// Run alone with `npx tsx scripts/unit.mts`, or with everything fast via `npm test`.
import assert from 'node:assert/strict';
import { compressT, squeezeTop, unsqueezeTop, TOP_KNEE } from '../src/engine/potential';
import { curve, possessionKind, interiorD, glassSkill, USG_KNEE, USG_K } from '../src/engine/sim';
import { finishCurve, finishingPct, finishMix, FINISH_TYPES } from '../src/engine/finishing';
import { ovrWeights, sameOvrWeights, overallWith, ovrExact, OVR_W, FEEL_W } from '../src/engine/ratings';
import { stayChance } from '../src/engine/cbaFlow';
import { taxBill, nums } from '../src/engine/cba';
import { newLeague } from './lib/headless.mts';

let n = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    n++;
  } catch (e: any) {
    console.log('FAIL ' + name + ': ' + (e?.message || e));
    process.exitCode = 1;
  }
};

// The rating scale.
test('squeezeTop leaves the scale below the knee alone and inverts', () => {
  for (const x of [40, 55, TOP_KNEE]) assert.equal(squeezeTop(x), x);
  for (const x of [63, 70, 83, 99]) {
    assert.ok(squeezeTop(x) < x);
    assert.ok(Math.abs(unsqueezeTop(squeezeTop(x)) - x) < 1e-9);
  }
});
test('compressT only compresses past 70 and keeps order', () => {
  assert.equal(compressT(65), 65);
  assert.ok(compressT(80) < 80 && compressT(80) > compressT(75));
});

// Shooting curves and possession outcomes.
test('shooting curves rise with the rating', () => {
  for (const k of ['three', 'rim', 'jumper', 'ft'])
    for (let r = 2; r < 99; r += 3) assert.ok(curve(k, r + 3) > curve(k, r), k + ' at ' + r);
});
test('finishing curves rise with skill and stay in bounds', () => {
  for (const t of FINISH_TYPES) {
    for (let s = 5; s < 95; s += 5) assert.ok(finishCurve(t, s + 5) > finishCurve(t, s));
    const lo = finishingPct({ r: {} as any }, t),
      hi = finishingPct({ r: { lay: 99, dnk: 99, ins: 99, fg: 99, jmp: 99, stre: 99 } }, t);
    assert.ok(lo >= 0.03 && hi <= 0.99 && hi >= lo);
  }
});
test('a finish mix adds up to 1', () => {
  const p = { r: { hgt: 70, jmp: 60, dnk: 60, lay: 55, ins: 50, fg: 50, stre: 55 }, grp: 'B' };
  for (const zone of ['rim', 'paint'] as const)
    assert.ok(Math.abs(Object.values(finishMix(p, zone)).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});
test('possessionKind partitions the roll in order', () => {
  assert.equal(possessionKind(0.01, 0.05, 0.1, 0.1), 'nsf');
  assert.equal(possessionKind(0.1, 0.05, 0.1, 0.1), 'tov');
  assert.equal(possessionKind(0.2, 0.05, 0.1, 0.1), 'trip');
  assert.equal(possessionKind(0.9, 0.05, 0.1, 0.1), 'fga');
  assert.equal(possessionKind(0.17, 0.05, 0.1, 0.1, 0.05), 'tov'); // extra turnover risk comes out of shots, not fouls
});
test('strength helps post defense and the glass (2026-11-08)', () => {
  const r = { hgt: 70, diq: 60, blk: 60, jmp: 60, reb: 60, box: 60, ape: 4 };
  assert.ok(interiorD({ ...r, stre: 70 }) > interiorD({ ...r, stre: 40 }));
  assert.ok(glassSkill({ ...r, stre: 70 }) > glassSkill({ ...r, stre: 40 }));
});
test('the usage penalty starts past its knee', () => {
  assert.ok(USG_KNEE > 0.2 && USG_KNEE < 0.3 && USG_K > 0 && USG_K < 1);
});

// The overall.
test("overall weights: copies compare equal and recompute today's overall", () => {
  const w = ovrWeights();
  assert.ok(sameOvrWeights(w, ovrWeights()));
  w.W.G.diq += 1;
  assert.ok(!sameOvrWeights(w, ovrWeights()));
  const p = { grp: 'G', r: Object.fromEntries(Object.keys(OVR_W.G).map(k => [k, 60])), intg: { feel: 60 }, wing: 0, hgt: '6\' 3"' };
  assert.ok(Math.abs(overallWith(p, ovrWeights()) - ovrExact(p)) < 1e-9);
  for (const G of ['G', 'W', 'B']) assert.ok(FEEL_W[G] > 0 && Object.values(OVR_W[G]).every(v => v > 0));
});

// Contracts and the cap.
const g: any = newLeague(3);
test('the luxury tax grows with payroll, more for repeaters', () => {
  const N = nums(g);
  assert.equal(taxBill(g, N.TAX - 1, false), 0);
  const a = taxBill(g, N.TAX + 5, false),
    b = taxBill(g, N.TAX + 15, false);
  assert.ok(a > 0 && b > a && taxBill(g, N.TAX + 15, true) > b);
});
test('minimum and maximum salaries are ordered', () => {
  const N = nums(g);
  assert.ok(N.min(0) <= N.min(5) && N.min(5) <= N.min(10) && N.max(0) < N.max(7) && N.max(7) < N.max(10) && N.min(10) < N.max(0));
});
test("a star's chance to stay is bounded and loyalty helps", () => {
  const s = g.state,
    tid = s.teams[0].tid,
    id = s.rosters[tid][0],
    p = g.db.P[id];
  const base = { ...p, pers: { ...p.pers, mot: 'Money' } },
    loyal = { ...p, pers: { ...p.pers, mot: 'Loyalty' } };
  const a = stayChance(g, s, tid, base),
    b = stayChance(g, s, tid, loyal);
  assert.ok(a >= 0.15 && a <= 0.95 && b >= 0.15 && b <= 0.95 && b > a);
});

console.log((process.exitCode ? 'FAIL' : 'PASS') + ': ' + n + ' unit tests passed');

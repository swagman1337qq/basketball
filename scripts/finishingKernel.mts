// Mechanism tests: technique semantics, preferences and normalization. Run with
// `npx tsx scripts/finishingKernel.mts`; full-game validation is separate.
import assert from 'node:assert/strict';
import { FINISH_BASE, FINISH_TYPES, computeFinishNorms, finishMean, finishMix, finishingPct, naturalDunkShare } from '../src/engine/finishing';

const r = { hgt: 40, jmp: 65, stre: 55, lay: 60, dnk: 30, ins: 40, fg: 60 };
const p = { r, grp: 'G', tend: { dunk: 0.1 } };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-12, a + ' vs ' + b);

// Changing a different technique or its frequency must not change the accuracy
// of a fixed event. This is the defect that a total-FG% fitting test cannot catch.
const layup = finishingPct(p, 'layup');
for (const dnk of [1, 30, 62, 63, 99]) for (const ins of [1, 40, 99]) {
  close(finishingPct({ ...p, r: { ...r, dnk, ins } }, 'layup'), layup);
}
const dunk = finishingPct(p, 'dunk');
close(finishingPct({ r: { dnk: 1 } }, 'layup'), finishingPct({ r: { dnk: 99 } }, 'layup'));
for (const lay of [1, 60, 99]) for (const preference of [0, 0.1, 1]) {
  close(finishingPct({ ...p, r: { ...r, lay }, tend: { dunk: preference } }, 'dunk'), dunk);
}
for (const type of FINISH_TYPES) {
  const noDunks = finishingPct({ ...p, tend: { dunk: 0 } }, type);
  close(finishingPct({ ...p, tend: { dunk: 1 } }, type), noDunks);
}

for (const [type, key] of [['layup', 'lay'], ['dunk', 'dnk'], ['floater', 'lay'], ['hook', 'ins'], ['tip', 'lay'], ['paintJumper', 'fg']] as const) {
  let before = -1;
  for (let value = 1; value <= 99; value++) {
    const chance = finishingPct({ ...p, r: { ...r, [key]: value } }, type);
    assert.ok(chance >= before && chance > 0 && chance < 1, type + ' must be bounded and monotone');
    before = chance;
  }
}
assert.ok(finishingPct({ r: { ...r, dnk: 90 } }, 'dunk') > 0.9);

for (const grp of ['G', 'W', 'B']) for (let skill = 1; skill <= 99; skill++) {
  for (const context of [{}, { transition: true }, { putback: true }]) {
    const player = { r: { ...r, hgt: skill, jmp: skill, dnk: skill }, grp };
    for (const zone of ['rim', 'paint'] as const) {
      const mix = finishMix(player, zone, context);
      close(Object.values(mix).reduce((a, b) => a + b, 0), 1);
      assert.ok(Object.values(mix).every(v => Number.isFinite(v) && v >= 0 && v <= 1));
      assert.ok(Number.isFinite(finishMean(player, zone, undefined, context)));
      close(finishMix({ ...player, tend: { dunk: 0 } }, zone, context).dunk, 0);
      if (zone === 'paint') close(mix.dunk, 0);
    }
  }
  if (skill < 99) {
    const next = naturalDunkShare({ ...r, hgt: skill, jmp: skill, dnk: skill + 1 }, grp);
    assert.ok(Math.abs(next - naturalDunkShare({ ...r, hgt: skill, jmp: skill, dnk: skill }, grp)) < 0.02);
  }
}

// Per-type exposure-weighted centering must not lump Dunks into Layup accuracy.
const entries = [40, 50, 60, 70].map((s, i) => ({ p: { r: { hgt: s, jmp: s, stre: s, lay: s, dnk: s, ins: s, fg: s }, grp: ['G', 'W', 'B', 'B'][i] }, rimWeight: 1 + i, paintWeight: 5 - i }));
const norms = computeFinishNorms(entries);
for (const type of FINISH_TYPES) {
  let sum = 0, mass = 0;
  for (const e of entries) {
    const w = finishMix(e.p, 'rim')[type] * e.rimWeight + finishMix(e.p, 'paint')[type] * e.paintWeight;
    sum += w * finishingPct(e.p, type, norms); mass += w;
  }
  close(sum / mass, FINISH_BASE[type]);
}
assert.ok(Object.values(computeFinishNorms([]).offset).every(v => v === 0));
assert.ok(Object.values(finishMix({ r: {} }, 'rim')).every(Number.isFinite));
console.log('Finishing technique independence, conditional monotonicity, zero preferences, smooth availability and type-weighted normalization passed.');

import assert from 'node:assert/strict';
import { dunkContextBonus } from '../src/engine/finishing';
for (let base = 0.5; base <= 0.98; base += 0.01) {
  let before = base;
  for (let bonus = 0; bonus <= 0.5; bonus += 0.005) {
    const p = base + dunkContextBonus(base, bonus);
    assert.ok(p >= before - 1e-12 && p < 1, 'better context helps without clipping');
    assert.ok(p <= base + bonus + 1e-12, 'headroom never gives weak technique an extra bonus');
    before = p;
    assert.ok(base + 0.001 + dunkContextBonus(base + 0.001, bonus) > p, 'better technique stays better');
  }
}
const chance = (bonus: number) => 0.89 + dunkContextBonus(0.89, bonus);
assert.ok(chance(0.12) < 0.96, 'ordinary stacked bonuses do not become automatic');
assert.ok(chance(0.18) > chance(0.12), 'extra transition/size still helps');
assert.equal(dunkContextBonus(0.89, 0), 0);
console.log('PASS: smooth dunk context headroom, monotone skills and favorable conditions, no ordinary 99% saturation.');

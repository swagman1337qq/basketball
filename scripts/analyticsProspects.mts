// The analytics prospect model's spread (analytics.ts AM_SPREAD): a skilled, unbiased analyst's level and ceiling for
// draft prospects move about one point per point of their real overall and potential, and the best prospects don't
// read systematically low (before 2026-11-28 the ceiling moved 0.59 a point: top prospects read about 5 low).
// Run: npx tsx scripts/analyticsProspects.mts
import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { analystView, anKind } from '../src/engine/analytics';

const R: number[][] = [];
for (const seed of [41, 42]) {
  const g: any = newLeague(seed),
    s = g.state,
    P = g.db.P,
    a: any = { id: 1, skill: 100, bias: {}, role: 'head' },
    cls = Math.min(
      ...Object.keys(g.db.cls)
        .map(Number)
        .filter(y => y >= g.Y),
    );
  for (const id of g.db.cls[cls]) {
    const p = P[id];
    if (anKind(g, s, p) !== 'prospect') continue;
    const v = analystView(g, a, p);
    if (v?.kind === 'am') R.push([v.peak, p.tpot, v.now, p.ovr]);
  }
}
const slope = (xi: number, yi: number) => {
  const n = R.length,
    mx = R.reduce((t, r) => t + r[xi], 0) / n,
    my = R.reduce((t, r) => t + r[yi], 0) / n;
  return R.reduce((t, r) => t + (r[xi] - mx) * (r[yi] - my), 0) / R.reduce((t, r) => t + (r[xi] - mx) ** 2, 0);
};
const bC = slope(1, 0),
  bL = slope(3, 2);
assert.ok(R.length > 150, `${R.length} prospects`);
assert.ok(bC > 0.85 && bC < 1.15, `ceiling slope ${bC.toFixed(3)}`);
assert.ok(bL > 0.85 && bL < 1.15, `level slope ${bL.toFixed(3)}`);
const top = R.slice()
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40),
  bias = top.reduce((t, r) => t + r[0] - r[1], 0) / top.length,
  all = R.reduce((t, r) => t + r[0] - r[1], 0) / R.length;
assert.ok(Math.abs(bias) < 2.5, `top prospects' ceiling off by ${bias.toFixed(2)}`);
assert.ok(Math.abs(all) < 2, `class ceiling off by ${all.toFixed(2)} on average`);
console.log(`analytics prospects ok: ceiling slope ${bC.toFixed(2)}, level slope ${bL.toFixed(2)}, top 40 ${bias.toFixed(2)}`);

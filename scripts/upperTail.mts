import assert from 'node:assert/strict';
import { OVR_W, SOFT_K, softTop, ratingGrowthFactor, ratingGrowthGain, syncOvr } from '../src/engine/ratings';
import { applyChange, bodyChange, develop, SKILLS, skillChange, ovrDelta } from '../src/engine/development';
import { ceilFor } from '../src/engine/potential';
import { growIntangible, ratingValue, TRAINABLE, limitWholeRating } from '../src/engine/ratingCeilings';

const close = (a: number, b: number) => assert(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
assert.equal(SOFT_K, 88);
for (const rating of [4, 50, 70, 85, 87, 88]) {
  assert.equal(softTop(rating), rating);
  assert.equal(ratingGrowthFactor(rating), 1);
}
for (const rating of [89, 90, 92, 95, 97]) assert(ratingGrowthFactor(rating + 1) < ratingGrowthFactor(rating));
assert(ratingGrowthFactor(95) > 0.09 && ratingGrowthFactor(95) < 0.1);
assert(ratingGrowthFactor(97) < 0.05);
assert(ceilFor({ gen: null }, 'blk', 117) >= 95, 'A 95 signature ceiling needs no generational flag');
assert(softTop(110) < 95 && softTop(150) < 98);
assert(softTop(88 + 1e-7) > 88 && softTop(88 + 1e-7) < 88.000001);

// Crossing 88 in one large update must cost the same work as many small updates.
for (const start of [85, 87.5, 88, 90, 95]) {
  const bulk = start + ratingGrowthGain(start, 30);
  let split = start;
  for (let i = 0; i < 300; i++) split += ratingGrowthGain(split, 0.1);
  close(bulk, split);
  assert(ratingGrowthGain(start, -2) === -2, 'Aging is not softened by the growth curve');
}
assert(88 + ratingGrowthGain(88, 7) < 92, 'A seven-point raw gain cannot jump from 88 to 95');
assert(88 + ratingGrowthGain(88, 28) >= 95, '95 remains reachable through enough sustained work');

const player = (id = 288) => {
  const p: any = {
    id,
    grp: 'W',
    pos: 'SF',
    age: 19,
    hgt: '6′7″',
    wing: 83,
    r: Object.fromEntries(Object.keys(OVR_W.W).map(k => [k, 75])),
    rx: {},
    intg: { feel: 75, poise: 75 },
    ceil: Object.fromEntries(TRAINABLE.map(k => [k, 75])),
    pers: { work: 99 },
    tpot: 90,
    gen: null,
    ph: { a0: 18, g: {} },
  };
  syncOvr(p);
  return p;
};
const gainsAt = (v: number) => {
  const p = player();
  for (const k of SKILLS) {
    p.r[k] = v;
    p.ceil[k] = 98;
  }
  const change = skillChange(p, 1, { w: Object.fromEntries(SKILLS.map(k => [k, 1])), lazy: Object.fromEntries(SKILLS.map(k => [k, 0])) });
  return ovrDelta(p, change);
};
assert(gainsAt(95) > 0 && gainsAt(95) < gainsAt(90) / 3, 'Redistribution cannot refund the 95+ slowdown');
assert(gainsAt(95) < 0.2, 'At 95 only a small part of the requested overall growth lands');
const raw = player();
SKILLS.forEach(k => {
  raw.r[k] = 3;
  raw.ceil[k] = 97;
});
const rawChange = skillChange(
  raw,
  1000,
  { w: Object.fromEntries(SKILLS.map(k => [k, 1])), lazy: Object.fromEntries(SKILLS.map(k => [k, 0])) },
  0.5,
);
assert(
  Object.values(rawChange).every(v => v <= 5),
  'An enormous overall budget cannot add more than half a year of raw work to one skill',
);

const opts = { year: 2027, work: 99, slow: 1, rnd: () => 0.9, focus: 'Balanced', keys: [] };
const camp = player();
camp.r.fg = 88;
camp.ceil.fg = 97;
camp.r.fg = limitWholeRating(camp, 'fg', 95);
assert(ratingValue(camp, 'fg') > 91 && ratingValue(camp, 'fg') < 92, 'Camp also retains a small fractional gain instead of leaping to 95');
const reached: Record<string, number> = {};
// Exceptional signature builds: actual development, normal mode, no generational gift/breakthrough.
for (const signature of ['blk', 'fg', 'pss']) {
  const p = player();
  p.r[signature] = 88;
  p.ceil[signature] = ceilFor(p, signature, 120);
  syncOvr(p);
  const limits = { ...p.ceil };
  for (let month = 1; month <= 96; month++) {
    p.age = 19 + Math.floor((month - 1) / 12);
    applyChange(p, develop(p, 0.06, 1 / 12, { ...opts, keys: [signature] }));
    if (p.r[signature] >= 95) {
      reached[signature] = month;
      break;
    }
  }
  assert(reached[signature], signature + ' can naturally reach a displayed 95');
  assert(p.gen === null && !p.brk && !p.godPot);
  assert.deepEqual(p.ceil, limits, 'The profile earns 95 within its existing ceiling');
  for (const k of TRAINABLE) assert(ratingValue(p, k) <= p.ceil[k] + 0.0001);
}

// Body and intangible gains also use the tail, not just the 14 basketball skills.
for (const key of ['spd', 'acc', 'jmp', 'stre', 'endu']) {
  const lo = player(),
    hi = player();
  lo.r[key] = 88;
  hi.r[key] = 95;
  lo.ceil[key] = hi.ceil[key] = 97;
  const a = bodyChange(lo, 0.5, opts)[key],
    b = bodyChange(hi, 0.5, opts)[key];
  assert(a > 0 && b > 0 && b < a / 5, key);
}
for (const key of ['feel', 'poise']) {
  const lo = player(),
    hi = player();
  lo.intg[key] = 88;
  hi.intg[key] = 95;
  lo.ceil[key] = hi.ceil[key] = 97;
  growIntangible(lo, key, 1);
  growIntangible(hi, key, 1);
  assert(ratingValue(hi, key) - 95 < (ratingValue(lo, key) - 88) / 5, key);
}
console.log(
  'PASS: hardening starts at 88, steep progressive returns, no large-step/redistribution bypass, physical and intangible growth; normal 95 signatures reached after ' +
    JSON.stringify(reached) +
    ' months of exceptional focused development.',
);

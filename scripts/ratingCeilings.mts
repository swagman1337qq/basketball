import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { applyChange, bodyChange, develop, SKILLS } from '../src/engine/development';
import { ceilFor, floorCeil, initCeil, liftCeil, refreshPot } from '../src/engine/potential';
import { MENTAL, PHYSICAL, TRAINABLE, growIntangible, ratingValue, breakthroughEligible } from '../src/engine/ratingCeilings';
import { setRating, syncOvr } from '../src/engine/ratings';
import { applyTranslation } from '../src/engine/translation';
import { mulberry32 } from '../src/engine/rng';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const set = (p: any, k: string, v: number) => {
  if (MENTAL.includes(k)) {
    p.intg[k] = Math.floor(v);
    (p.ix ||= { f: 0, p: 0 })[k === 'feel' ? 'f' : 'p'] = v - Math.floor(v);
  } else {
    p.r[k] = Math.floor(v);
    (p.rx ||= {})[k] = v - Math.floor(v);
  }
};
const within = (p: any, ceiling = p.ceil) => {
  for (const k of TRAINABLE) assert(ratingValue(p, k) <= ceiling[k] + 0.00011, `${p.id} ${k}: ${ratingValue(p, k)} > ${ceiling[k]}`);
};
const opt = { year: 2027, work: 99, slow: 1, rnd: () => 0.9, focus: 'Athleticism', keys: SKILLS };
const worlds = [11, 12, 2027].map(seed => {
  Math.random = mulberry32(seed);
  return Game.create(seed, [0]);
});
let count = 0,
  varied = 0;
for (const g of worlds)
  for (const p of Object.values(g.db.P) as any[]) {
    if (!p?.r || p.retired || p.gone) continue;
    count++;
    assert(
      TRAINABLE.every(k => Number.isFinite(p.ceil?.[k])),
      'Every generated player needs all 21 limits',
    );
    within(p);
    assert(TRAINABLE.every(k => (MENTAL.includes(k) ? p.intg[k] : p.r[k]) < 99 || p.gen === k || p.brk?.[k]));
    if (new Set(SKILLS.map(k => p.ceil[k])).size >= 8) varied++;
    assert(new Set(SKILLS.map(k => p.ceil[k])).size >= 4, 'No generated player gets one universal skill ceiling');
  }
assert(varied / count > 0.99, 'Individual skill limits remain varied within players');

const g = worlds[0],
  p: any = clone(g.db.P[g.state.rosters[0][0]]);
p.age = 19;
p.tpot = 99;
p.pers.work = 99;
p.ph = { a0: 18, g: {} };
TRAINABLE.forEach((k, i) => {
  p.ceil[k] = 42 + i * 1.37;
  set(p, k, p.ceil[k]);
});
const fixed = clone(p.ceil);
// Exercise the otherwise astronomically rare creation branch without relying on a lucky seed.
const random = Math.random,
  generational = clone(p),
  ordinary = clone(p);
try {
  delete generational.gen;
  delete ordinary.gen;
  Math.random = () => 0;
  initCeil(generational, 75);
  assert(TRAINABLE.includes(generational.gen));
  assert(generational.ceil[generational.gen] >= 96);
  const gift = generational.gen;
  Math.random = () => 1;
  initCeil(ordinary, 75);
  assert.equal(ordinary.gen, null);
  Math.random = () => 0;
  initCeil(ordinary, 75);
  assert.equal(ordinary.gen, null, 'Re-fitting a prospect cannot reroll a failed generational chance');
  initCeil(generational, 75);
  assert.equal(generational.gen, gift, 'His one generational rating remains the same');
} finally {
  Math.random = random;
}
for (let i = 0; i < 60; i++) {
  applyChange(p, develop(p, 100, 0.5, opt));
  MENTAL.forEach(k => growIntangible(p, k, 100));
  applyChange(p, Object.fromEntries([...SKILLS, ...PHYSICAL].map(k => [k, 1000])));
  refreshPot(p);
  within(p, fixed);
  assert.deepEqual(p.ceil, fixed, 'No saturation escape or potential refit');
}
// Late-career IQ growth used to bypass skill ceilings.
p.age = 29;
SKILLS.forEach(k => set(p, k, p.ceil[k]));
applyChange(p, develop(p, 0, 0.5, opt));
within(p, fixed);

// First-camp gains and summer noise cannot raise ceilings or ratings past them.
p.age = 19;
p.dx = { o: 11, c: 9, sh: { shoot: 8, play: 8 }, tier: 'steal' };
SKILLS.forEach(k => set(p, k, p.ceil[k]));
applyTranslation(p);
within(p, fixed);
refreshPot(p);
assert.deepEqual(p.ceil, fixed);
const summer = Game.load(clone(g.toSave()));
const sp: any = summer.db.P[summer.state.rosters[0][0]];
sp.age = 19;
sp.tpot = 99;
sp.gem = 0;
sp.dx = null;
TRAINABLE.forEach((k, i) => {
  sp.ceil[k] = 45 + i * 0.7;
  set(sp, k, sp.ceil[k]);
});
const summerLimits = clone(sp.ceil);
summer.setState({
  phase: 'fa',
  offerSheets: [],
  agentCalls: [],
  mailRead: summer.state.mailSeq || 0,
  letterUnread: null,
  letterOpen: null,
  notices: [],
  dialog: null,
});
const oldYear = summer.Y;
summer.startPreseason();
assert.equal(summer.Y, oldYear + 1, 'Exercise the real summer route');
within(sp, summerLimits);
assert.deepEqual(sp.ceil, summerLimits);

// All physical ratings get the same upper-curve rule as basketball skills.
for (const k of PHYSICAL) {
  const q: any = clone(p);
  q.age = 18;
  delete q.ph;
  q.gen = null;
  delete q.brk;
  q.r[k] = 92;
  delete q.rx[k];
  delete q.ceil[k];
  floorCeil(q);
  assert(q.ceil[k] < 95, `${k} must not retain unrestricted frame growth above 85`);
  assert.equal(ceilFor(q, k, 110), ceilFor(q, 'tp', 110));
  for (let i = 0; i < 100; i++) {
    const change = bodyChange(q, 0.5, opt);
    applyChange(q, change);
    within(q);
  }
  assert(q.r[k] < 99);
  q.ceil[k] = 98.4;
  q.r[k] = 98;
  q.rx[k] = 0;
  applyChange(q, { [k]: 20 });
  assert.equal(q.r[k], 98);
  q.brk = { [k]: 1 };
  q.ceil[k] = 99;
  applyChange(q, { [k]: 20 });
  assert.equal(q.r[k], 99, 'Only a recorded breakthrough unlocks 99');
}

// God Mode itself changes no player limit or development outcome.
const normal = Game.load(clone(g.toSave())),
  god = Game.load(clone(g.toSave()));
god.setState({ god: true });
const id = g.state.rosters[0][0],
  np = normal.db.P[id],
  gp = god.db.P[id];
assert.deepEqual(gp.ceil, np.ceil);
for (const q of [np, gp]) {
  q.age = 19;
  q.tpot = 99;
  q.ph = { a0: 18, g: {} };
  SKILLS.forEach(k => set(q, k, Math.max(4, Math.floor(q.ceil[k]) - 5)));
  syncOvr(q);
  q.dv0 = { o: q.ovr, a: 19 };
}
const beforeGrowth = clone(np.r);
for (const engine of [normal, god]) {
  Math.random = mulberry32(8831);
  for (let i = 0; i < 24; i++) engine.devIdle(engine.state, engine.db.P[id]);
}
assert.notDeepEqual(np.r, beforeGrowth, 'Compare active growth, not two inactive players');
assert.deepEqual(gp.r, np.r);
assert.deepEqual(gp.rx, np.rx);
assert.deepEqual(gp.ceil, np.ceil);
const originalLimit = gp.ceil.tp;
const aboveLimit = clone(gp);
aboveLimit.ceil.tp = 60;
setRating(aboveLimit, 'tp', 95);
aboveLimit.rx.tp = 0;
liftCeil(aboveLimit);
refreshPot(aboveLimit);
applyChange(aboveLimit, { tp: 3 });
assert.equal(aboveLimit.r.tp, 95, 'A direct edit above the personal cap cannot keep growing toward the global maximum');
assert.equal(aboveLimit.ceil.tp, 60);
setRating(aboveLimit, 'tp', 98);
assert(!breakthroughEligible(aboveLimit, 'tp'), 'An above-ceiling God Mode edit cannot trigger a natural ceiling increase');
aboveLimit.ceil.tp = 98;
assert(breakthroughEligible(aboveLimit, 'tp'));
setRating(gp, 'tp', 99);
gp.rx.tp = 0;
liftCeil(gp);
refreshPot(gp);
assert.equal(gp.r.tp, 99, 'Explicit God Mode edits may exceed the limit');
assert.equal(gp.ceil.tp, originalLimit);
applyChange(gp, { tp: 100 });
assert.equal(gp.r.tp, 99);
assert.equal(gp.ceil.tp, originalLimit);
const reopened = Game.load(clone(god.toSave()));
assert.equal(reopened.db.P[id].r.tp, 99);
assert.equal(reopened.db.P[id].ceil.tp, originalLimit);
const editingLimits = clone(gp.ceil);
for (const k of TRAINABLE) {
  if (MENTAL.includes(k)) {
    gp.intg[k] = 99;
    (gp.ix ||= { f: 0, p: 0 })[k === 'feel' ? 'f' : 'p'] = 0;
  } else {
    setRating(gp, k, 99);
    gp.rx[k] = 0;
  }
}
liftCeil(gp);
refreshPot(gp);
assert.deepEqual(gp.ceil, editingLimits, 'Even explicit edits never erase or lift the saved personal limits');
// Old saves acquire missing physical/mental limits once, without erasing ratings or re-fitting skills.
const legacy = clone(g.toSave());
delete (legacy.db as any).ratingCeilV;
const plain = Game.load(legacy);
const lp = plain.db.P[id],
  before = clone(lp.r),
  limits = clone(lp.ceil);
PHYSICAL.concat(MENTAL).forEach(k => delete lp.ceil[k]);
delete plain.db.ratingCeilV;
const migrated = Game.load(clone(plain.toSave()));
assert.deepEqual(migrated.db.P[id].r, before);
assert(TRAINABLE.every(k => Number.isFinite(migrated.db.P[id].ceil[k])));
SKILLS.forEach(k => assert.equal(migrated.db.P[id].ceil[k], limits[k]));

// Lifetime stress: real idle development for 300 young players across three worlds, 30 years each.
let careers = 0,
  body90 = 0,
  body99 = 0;
for (const world of worlds) {
  Math.random = mulberry32(world.Y + careers + 881);
  const sample = (Object.values(world.db.P) as any[]).filter(q => q?.r && q.age <= 23 && !q.retired && !q.gone).slice(0, 100);
  for (const source of sample) {
    const q = clone(source),
      ceiling = clone(q.ceil);
    let elite = false;
    for (let year = 0; year < 30; year++) {
      for (let month = 0; month < 12; month++) {
        world.devIdle(world.state, q);
        MENTAL.forEach(k => growIntangible(q, k, k === 'feel' ? 0.04 : 0.1));
        within(q, ceiling);
      }
      elite ||= PHYSICAL.some(k => q.r[k] >= 90);
      body99 += PHYSICAL.filter(k => q.r[k] === 99 && !q.brk?.[k] && q.gen !== k).length;
      q.age++;
    }
    assert.deepEqual(q.ceil, ceiling);
    careers++;
    if (elite) body90++;
  }
}
assert.equal(body99, 0);
assert(body90 / careers < 0.01, '90+ athletes remain very rare');
console.log(
  `PASS: ${count} generated players, all 21 varied ceilings; hard caps in growth/camp/summer/IQ/intangibles; God Mode and legacy saves; ${careers} 30-year careers, ${body90} reached a 90+ body rating, no unearned 99.`,
);

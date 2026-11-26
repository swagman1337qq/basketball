import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { Game } from '../src/engine/Game';
import { amateurSeasons, classStats, realLines, schoolPath, setGodPlayerAge } from '../src/engine/amateurStats';
const g = newLeague(614);
const p: any = g.mkPlayer(42, 22, g.state.natW || {}, g.Y, 'G');
Object.assign(p, {
  age: 22,
  dAge: 22,
  cls: g.Y,
  from: { team: 'Duke', lg: 'NCAA' },
  am: { r: { ...p.r }, grp: p.grp, feel: p.intg?.feel },
});
g.db.cls[g.Y] = [p.id];
const before = structuredClone(classStats(g, g.Y, [p.id])[p.id]);
assert.equal(before.length, 4);
const priorPath = schoolPath(p);
setGodPlayerAge(g, p, 28);
// Age edits add played seasons, up to five, while retaining the old numbers.
const older = classStats(g, g.Y, [p.id])[p.id]; // same gv: the age helper invalidates the memo
assert.equal(older.length, 6, 'aging a prospect up adds college seasons');
assert.deepEqual(
  older.slice(-4).map(x => x.age),
  before.map(x => x.age + 6),
);
assert.deepEqual(
  older.slice(-4).map(x => x.disp),
  before.map(x => x.disp),
);
assert.deepEqual(schoolPath(p).slice(-4), priorPath);
assert.equal(older.filter(row => row.gp > 0).length, 5, 'a fifth played year is added; excess years are redshirts');
assert.ok(older[0].season === g.Y - 5);
setGodPlayerAge(g, p, 19);
const younger = classStats(g, g.Y, [p.id])[p.id];
assert.equal(younger.length, 1);
assert.equal(younger[0].age, 19);
assert.equal(younger[0].season, g.Y);
assert.deepEqual(younger[0].disp, before.at(-1)!.disp);
assert.equal(schoolPath(p).length, 1);
const freshman = structuredClone(younger[0].disp);
setGodPlayerAge(g, p, 23);
assert.equal(amateurSeasons(g, p).length, 5, 'aging a 19-year-old prospect to 23 gives him the years in between');
assert.deepEqual(classStats(g, g.Y, [p.id])[p.id].at(-1)!.disp, freshman, 'his last season keeps its numbers');
const saved = Game.load(g.toSave());
assert.equal(saved.db.P[p.id].amAgeEdit.years, 5);
assert.equal(schoolPath(saved.db.P[p.id]).length, 5);
assert.equal(classStats(g, g.Y, [p.id])[p.id].filter(row => row.gp > 0).length, 5);

// Exact request: one played season at 19 becomes five at 24, for a prospect
// and a player already drafted. Age edits never change NBA seasons or ratings.
for (const drafted of [false, true]) {
  const q: any = g.mkPlayer(42, 19, g.state.natW || {}, g.Y, 'G');
  const cls = drafted ? g.Y - 3 : g.Y;
  Object.assign(q, { age: 19, dAge: 19, cls, from: { team: 'Duke', lg: 'NCAA' }, am: { r: { ...q.r }, grp: q.grp, feel: q.intg?.feel } });
  g.db.cls[cls] = [...(g.db.cls[cls] || []), q.id];
  const first = structuredClone(classStats(g, cls, [q.id], q.id)[q.id]);
  assert.equal(first.length, 1);
  const nba = structuredClone(q.stats),
    ratings = structuredClone(q.r);
  const random = Math.random;
  Math.random = () => {
    throw new Error('An age edit must not consume simulation randomness');
  };
  try {
    setGodPlayerAge(g, q, 24);
  } finally {
    Math.random = random;
  }
  const five = structuredClone(classStats(g, cls, [q.id])[q.id]);
  assert.equal(five.filter(row => row.gp > 0).length, 5);
  assert.equal(five.length, 6, 'five played seasons plus the extra calendar year as a redshirt');
  assert.deepEqual(five.at(-1)!.disp, first[0].disp);
  assert.deepEqual(q.stats, nba);
  assert.deepEqual(q.r, ratings);
  setGodPlayerAge(g, q, 23);
  assert.equal(classStats(g, cls, [q.id])[q.id].filter(row => row.gp > 0).length, 5);
  setGodPlayerAge(g, q, 19);
  assert.deepEqual(classStats(g, cls, [q.id])[q.id], first, 'aging down restores the exact original season');
  setGodPlayerAge(g, q, 24);
  assert.deepEqual(classStats(g, cls, [q.id])[q.id], five, 'aging back up restores the same added years and numbers');
  const loaded = Game.load(g.toSave());
  assert.deepEqual(classStats(loaded, cls, [q.id])[q.id], five, 'the resized college career survives save/load');
}

// Historical rows, including two schools in one year: keep complete seasons.
const h: any = structuredClone(p);
h.id = g.db.nid++;
h.age = 22;
h.dAge = 22;
delete h.amAgeEdit;
h.real = [...Array(4)].map((_, i) => ({
  season: g.Y - 3 + i,
  team: 'School ' + i,
  lg: 'NCAA',
  gp: 30,
  mp: 25,
  pts: 10 + i,
  fg: 4,
  fga: 9,
  tp: 1,
  tpa: 3,
  ft: 1,
  fta: 2,
}));
h.real.push({ ...h.real.at(-1), team: 'Transfer school', gp: 10 });
const original = structuredClone(h.real),
  oldLines = realLines(g, h);
setGodPlayerAge(g, h, 28);
assert.equal(realLines(g, h).length, 7, 'historical players can gain generated seasons without overwriting source rows');
assert.deepEqual(
  realLines(g, h)
    .filter(row => row.season >= g.Y - 3)
    .map(x => x.age),
  oldLines.map(x => x.age + 6),
);
assert.deepEqual(h.real, original);
setGodPlayerAge(g, h, 19);
assert.equal(realLines(g, h).length, 2, 'both transfer rows in freshman season survive');
assert.ok(realLines(g, h).every(x => x.age === 19));
assert.deepEqual(h.real, original, 'source history retained');
setGodPlayerAge(g, h, 28);
assert.equal(realLines(g, h).length, 7, 'hidden source and added seasons return when aged up');
assert.deepEqual(h.real, original);

// Current age edits move draft age by the delta, not to the current age.
const veteran: any = structuredClone(h);
delete veteran.amAgeEdit;
Object.assign(veteran, { age: 30, dAge: 22, cls: g.Y - 8, real: undefined });
setGodPlayerAge(g, veteran, 36);
assert.equal(veteran.dAge, 28);
assert.equal(schoolPath(veteran).length, 6, 'drafted players gain college years too');
const plain: any = { age: 25 };
setGodPlayerAge(g, plain, 28);
assert.equal(plain.age, 28);
assert.equal(plain.dAge, undefined);
console.log(
  'College age edits: aging a prospect up adds seasons (kept ones unchanged), freshman trimming, memo invalidation, transfers, source preservation, veteran tenure and save roundtrip passed.',
);

const undrafted: any = structuredClone(h);
delete undrafted.amAgeEdit;
Object.assign(undrafted, { age: 22, dAge: 22, cls: 0, undrafted: g.Y });
assert.equal(realLines(g, undrafted).at(-1)!.age, 22);
setGodPlayerAge(g, undrafted, 19);
assert.equal(realLines(g, undrafted).length, 2);
assert.ok(realLines(g, undrafted).every(x => x.age === 19));
console.log('Undrafted historical players retain correct college ages.');

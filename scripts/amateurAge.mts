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
// 2026-11-10: a prospect aged up gets the extra college years (up to six); the four he had keep their numbers.
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
assert.ok(schoolPath(p).filter(st => !st.kind || st.kind === 'short').length <= 4, 'past four played, the added years are redshirts');
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
assert.equal(realLines(g, h).length, 5);
assert.deepEqual(
  realLines(g, h).map(x => x.age),
  oldLines.map(x => x.age + 6),
);
assert.deepEqual(h.real, original);
setGodPlayerAge(g, h, 19);
assert.equal(realLines(g, h).length, 2, 'both transfer rows in freshman season survive');
assert.ok(realLines(g, h).every(x => x.age === 19));
assert.deepEqual(h.real, original, 'source history retained');

// Current age edits move draft age by the delta, not to the current age.
const veteran: any = structuredClone(h);
delete veteran.amAgeEdit;
Object.assign(veteran, { age: 30, dAge: 22, cls: g.Y - 8, real: undefined });
setGodPlayerAge(g, veteran, 36);
assert.equal(veteran.dAge, 28);
assert.equal(schoolPath(veteran).length, 4);
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

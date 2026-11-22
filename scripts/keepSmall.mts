// Keeping saves small (2026-11-22): coaches' generated careers are stored as stints and read back exactly; an older
// save's rows convert on load; a coach or analyst retired five seasons who can't be reached from anything is let go,
// and anyone with a history here stays.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { coachRows, packPast, pastOf, unpackPast } from '../src/engine/coachCareer';
import { coachDb, forgetRetired, FORGET_AFTER, type Coach } from '../src/engine/staff';
import { anDb, forgetAnalysts, mkAnalyst } from '../src/engine/analytics';

const g = Game.create(31, [0]),
  s: any = g.state;
const all = Object.values(coachDb(g)) as Coach[];

// Every career is stored as stints, and reads back row for row.
assert.ok(all.length > 200);
assert.equal(all.filter(c => c.past).length, 0, 'no career left as rows');
assert.ok(
  all.every(c => c.pz),
  'every coach has a stored career',
);
all.forEach(c => assert.deepEqual(packPast(unpackPast(c.pz!)), c.pz));
const before = new Map(all.map(c => [c.id, JSON.stringify(coachRows(g, s, c))]));

// An older save kept the rows: they convert on load and the careers are unchanged.
const old = JSON.parse(JSON.stringify(g.toSave()));
const oc: Record<string, any> = old.db?.coaches || old.coaches;
assert.ok(oc, 'coaches in the save');
Object.values(oc).forEach((c: any) => {
  c.past = JSON.parse(JSON.stringify(unpackPast(c.pz)));
  delete c.pz;
});
const re = Game.load(old);
const reAll = Object.values(coachDb(re)) as Coach[];
assert.equal(reAll.filter(c => c.past).length, 0, 'older rows became stints');
reAll.forEach(c => assert.equal(JSON.stringify(coachRows(re, re.state, c)), before.get(c.id), 'same career for ' + c.name));
assert.ok(JSON.stringify(re.toSave()).length < JSON.stringify(old).length, 'the save got smaller');

// A row the stints can't hold stays a row.
assert.equal(packPast([{ season: 2020, team: 'X', level: 'Somewhere', role: 'Assistant' }]), null);

// Long retired: unreachable coaches go; a coach with seasons here, an award or a playing career here stays.
const C = coachDb(g),
  free = all.filter(c => c.tid == null && !c.ret && !(c.h || []).length && c.pid == null && !(c.coy || []).length);
const [gone, recent, worked, coy] = free;
gone.ret = g.Y - FORGET_AFTER;
recent.ret = g.Y - FORGET_AFTER + 1;
worked.ret = g.Y - 9;
worked.h = [[g.Y - 12, 3, 1, 0]];
worked.raise = { ask: 1, season: g.Y - 10 };
coy.ret = g.Y - 9;
coy.coy = [g.Y - 11];
forgetRetired(g);
assert.equal(C[gone.id], undefined, 'never worked here, retired five seasons: let go');
assert.ok(C[recent.id], 'retired four seasons: kept');
assert.ok(C[worked.id] && !C[worked.id].raise, 'worked here: kept, without what only mattered while working');
assert.ok(C[coy.id], 'Coach of the Year: kept');
assert.ok(pastOf(C[worked.id]).length >= 0);

// Analysts: gone after five seasons away without a record with you; with one, kept.
const A = anDb(g),
  a1 = mkAnalyst(g),
  a2 = mkAnalyst(g);
a1.ret = a2.ret = g.Y - 5;
a2.rec = [{ y: g.Y - 6, n: 100, mae: 3, all: 0, sh: [0, 0], df: [0, 0], old: [0, 0], sm: [0, 0] }];
forgetAnalysts(g);
assert.equal(A[a1.id], undefined);
assert.ok(A[a2.id]);
console.log('keepSmall: ok');

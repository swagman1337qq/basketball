import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import * as ST from '../src/engine/staff';
import { coachRows } from '../src/engine/coachCareer';
import { RosterReports } from '../src/ui/screens/RosterTeamDetails';

const a = Game.create(31, [0]),
  b = Game.create(32, [0]);
for (const [g, rating] of [
  [a, 99],
  [b, 1],
] as const) {
  g.db.staffRev = 71251;
  ST.staffOf(g, 0).forEach(c => ST.CR_KEYS.forEach(k => (c.r[k] = rating)));
}
assert.equal(ST.staffFx(a, a.state, 0).q, 0.95);
assert.deepEqual(ST.staffFx(b, b.state, 0), ST.fxOf(ST.staffOf(b, 0)), 'Each save has its own effects cache');
assert.equal(ST.staffFx(a, a.state, 0).q, 0.95, 'Switching back keeps the first save intact');
// Replacing a loaded db on the same Game object also isolates the cache.
const original = a.db;
a.db = b.db;
assert.equal(ST.staffFx(a, a.state, 0).q, 0.35);
a.db = original;

const g = Game.create(33, [0]),
  s = g.state,
  year = g.Y;
const c = ST.staffOf(g, 0).find(x => x.role === 'asst')!;
c.amt = 1;
c.exp = year;
const before = ST.staffCost(g, s, 0);
const oldRole = c.role;
assert.match(ST.resignCoach(g, s, 0, c.id, { amt: 9, years: 3, role: 'lead' }), /already have/);
assert.equal(c.role, oldRole);
assert.equal(ST.staffOf(g, 0).filter(x => x.role === 'lead').length, 1);
assert.equal(ST.resignCoach(g, s, 0, c.id, { amt: 9, years: 3, role: 'asst' }), '');
assert.equal(c.amt, 1);
assert.equal(c.exp, year);
assert.deepEqual(c.next, { start: year + 1, amt: 9, exp: year + 3 });
assert.equal(ST.staffCost(g, s, 0), before, 'Signing next season cannot change this season payroll');
assert.match(ST.resignCoach(g, s, 0, c.id, { amt: 12, years: 3, role: 'asst' }), /already/);
assert.equal(c.next!.amt, 9, 'A second renewal cannot overwrite a signed extension');
assert(!ST.staffExpiring(g, s).some(n => n.lines.some((l: string) => l.includes(c.name))));
ST.staffContractsEnd(g, s);
assert.equal(c.tid, 0, 'A renewed coach stays when free agency opens');
assert.equal(c.amt, 1, 'June rollover does not charge next year salary early');
// Saving/loading keeps the future deal and does not activate it early.
const savedCoach = JSON.parse(JSON.stringify(c));
const reopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(reopened.db.coaches[c.id].next, c.next, 'The real save codec preserves signed extensions');
assert.equal(reopened.db.coaches[c.id].amt, 1);
g.db.coaches[c.id] = savedCoach;
ST.ensureStaff(g);
assert.equal(savedCoach.amt, 1);
s.season++;
ST.ensureStaff(g);
assert.equal(savedCoach.amt, 9);
assert.equal(savedCoach.exp, year + 3);
assert.equal(savedCoach.next, undefined);
const activatedCost = ST.staffCost(g, s, 0);
ST.ensureStaff(g);
assert.equal(ST.staffCost(g, s, 0), activatedCost, 'Activation is idempotent');

// A firing owes each guaranteed contract only in the seasons it covers.
const f = Game.create(34, [0]),
  fs = f.state,
  fy = f.Y;
const fired = ST.staffOf(f, 0).find(x => x.role === 'asst')!;
fired.amt = 1;
fired.exp = fy;
assert.equal(ST.resignCoach(f, fs, 0, fired.id, { amt: 9, years: 2, role: 'asst' }), '');
const fc = ST.staffCost(f, fs, 0);
assert.equal(ST.fireCoach(f, fs, 0, fired.id), '');
assert.equal(ST.staffCost(f, fs, 0), fc);
assert.equal(fired.next, undefined, 'Leaving cannot carry an old employer extension into a new job');
ST.staffContractsEnd(f, fs);
assert.equal(f.db.coachDead[0].length, 1, 'Only the future guarantee remains after June');
fs.season++;
const pay = ST.staffOf(f, 0).reduce((sum, x) => sum + x.amt, 0);
assert.equal(ST.staffCost(f, fs, 0), +((ST.SUPPORT * f.CAP) / 165 + pay + 9).toFixed(2));
fs.season += 2;
assert.equal(ST.staffCost(f, fs, 0), +((ST.SUPPORT * f.CAP) / 165 + pay).toFixed(2));

// Older coaches acquire a persistent generated career before an unseen profile can be rewritten.
const vet = ST.staffOf(g, 0).find(x => x.role === 'asst')!;
delete vet.past;
vet.bg = 'NBA assistant';
vet.since = g.Y - 15;
vet.made = g.Y;
const expected = JSON.parse(JSON.stringify(coachRows(g, s, vet).filter(r => r.season < g.Y)));
delete vet.past;
assert.equal(ST.fireCoach(g, s, 0, vet.id), '');
assert.deepEqual(JSON.parse(JSON.stringify(coachRows(g, s, vet).filter(r => r.season < g.Y))), expected);
const persisted = JSON.parse(JSON.stringify(vet));
const careerReopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(careerReopened.db.coaches[vet.id].past, JSON.parse(JSON.stringify(vet.past)));
g.db.coaches[vet.id] = persisted;
ST.godEditCoach(g, vet.id, { off: 99, def: 99, game: 99 });
assert.deepEqual(JSON.parse(JSON.stringify(coachRows(g, s, persisted).filter(r => r.season < g.Y))), expected);
persisted.ret = g.Y - 5;
persisted.h = [[g.Y - 6, 0, 1, 1]];
persisted.coy = [g.Y - 7];
ST.staffYear(g, s);
assert.equal(g.db.coaches[vet.id], persisted, 'Retired coaches and award links remain resolvable');
assert.deepEqual(persisted.h, [[g.Y - 6, 0, 1, 1]]);
assert.deepEqual(persisted.coy, [g.Y - 7]);
assert(!ST.freeCoaches(g).includes(persisted));
assert(!ST.staffOf(g, 0).includes(persisted));

// Roster reports render actual staff, including new hires, and remove people who left.
const vm: any = { ctx: { gm: f, s: fs, T: fs.teams, open() {}, openTeamPage() {} } };
const render = () => renderToStaticMarkup(createElement(RosterReports, { vm, tid: 0, season: f.Y, ids: [] }));
const incoming = ST.freeCoaches(f).find(x => x.id !== fired.id)!;
assert.equal(ST.hireCoach(f, fs, 0, incoming.id, { amt: 20, years: 2, role: 'asst' }), '');
const html = render();
for (const coach of ST.staffOf(f, 0)) {
  assert(html.includes(coach.name), coach.name);
  assert(html.includes(ST.ROLE_LABEL[coach.role!]));
}
assert(html.includes(incoming.name));
assert(!html.includes(fired.name));
assert.equal(ST.fireCoach(f, fs, 0, incoming.id), '');
assert(!render().includes(incoming.name));
console.log(
  'PASS: save-isolated staff effects; deferred, unique-role renewals; activation and firing guarantees; immutable careers; retired archives; actual roster staff.',
);

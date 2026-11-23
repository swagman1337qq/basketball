// God Mode analyst edits (ui/analystEditing.ts, 2026-11-23): name, gender, nationality, age, years in analytics, face,
// and the contract with no upper limit on its end season (3000 is fine); only in God Mode; nothing changes on a bad
// draft; the edits survive save/reopen, and a long contract doesn't end when free agency opens.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as AN from '../src/engine/analytics';
import { analystBioDraft, saveAnalystBio } from '../src/ui/analystEditing';

const g = Game.create(57, [0]),
  s: any = g.state,
  me = s.me,
  Y = g.Y;
const a = AN.deptOf(g, me).find(x => x.role === 'analyst')!;

// Not in God Mode: refused, unchanged.
const before = JSON.stringify(a);
assert.match(saveAnalystBio(g, a.id, { ...analystBioDraft(g, a), name: 'Pat Example' }), /God Mode/);
assert.equal(JSON.stringify(a), before);

g.setState({ god: true });
const nat = Object.keys(g.db.C).find(k => k !== a.nat && g.db.C[k]?.n)!;
const draft = {
  ...analystBioDraft(g, a),
  name: '  Robin   Testwell ',
  fem: !a.fem,
  nat,
  age: 61,
  years: 30,
  faceSeed: 12345,
  amt: 2.5,
  exp: 3000,
  next: { start: 3001, exp: 3005, amt: 4 },
};
assert.equal(saveAnalystBio(g, a.id, draft), '');
assert.equal(a.name, 'Robin Testwell');
assert.equal(a.first, 'Robin');
assert.equal(a.last, 'Testwell');
assert.equal(a.fem, draft.fem);
assert.equal(a.nat, nat);
assert.equal(AN.anAge(g, a), 61);
assert.equal(AN.anYears(g, a), 30);
assert.equal(a.faceSeed, 12345);
assert.equal(a.amt, 2.5);
assert.equal(a.exp, 3000, 'no upper limit on the end season');
assert.deepEqual(a.next, { start: 3001, exp: 3005, amt: 4 });
assert.equal(a.rep, AN.anRepOf(g, a), 'reputation follows his years');

// Bad drafts change nothing.
const ok = JSON.stringify(a);
for (const bad of [
  { name: ' ' },
  { age: 12 },
  { years: -1 },
  { nat: 'XXX' },
  { exp: Y - 1 },
  { exp: 3000.5 },
  { amt: -1 },
  { next: { start: 3000, exp: 3002, amt: 1 } }, // starts before the deal ends
  { next: { start: 3002, exp: 3001, amt: 1 } },
])
  assert.ok(saveAnalystBio(g, a.id, { ...analystBioDraft(g, a), ...bad }), JSON.stringify(bad));
assert.equal(JSON.stringify(a), ok);

// Far-future years work for the extension too, and the payroll line uses the new salary.
assert.equal(saveAnalystBio(g, a.id, { ...analystBioDraft(g, a), next: { start: 3001, exp: 99999, amt: 4 } }), '');
assert.equal(a.next!.exp, 99999);
assert.ok(AN.analyticsCost(g, s, me) >= 2.5);

// Free agency opening: a contract through 3000 doesn't end.
g.setState({ god: false });
const gone = AN.anContractsEnd(g, g.state);
assert.ok(!gone.some((n: any) => n.title?.includes(a.name)));
assert.equal(a.tid, me);

// Save and reopen.
const re = Game.load(JSON.parse(JSON.stringify(g.toSave())));
const b = (re.db as any).analysts[a.id] as AN.Analyst;
assert.equal(b.name, 'Robin Testwell');
assert.equal(b.exp, 3000);
assert.equal(b.next!.exp, 99999);
assert.equal(b.faceSeed, 12345);
assert.equal(b.nat, nat);

// Someone in the pool: bio edits work, no contract to set.
re.setState({ god: true });
const free = AN.freeAnalysts(re)[0];
assert.equal(saveAnalystBio(re, free.id, { ...analystBioDraft(re, free), name: 'Jordan Pool', exp: 3000, amt: 9 }), '');
assert.equal(free.name, 'Jordan Pool');
assert.equal(free.exp, 0, 'no contract without a department');
assert.equal(free.amt, 0);
console.log('ok analystEditing');

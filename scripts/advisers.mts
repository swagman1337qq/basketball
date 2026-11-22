// Advice from your real staff (assistants.ts advisers): the lineup advice and free-agent picks come from your Lead
// Assistant, Head of Player Development and Head of Analytics, the lineup's accuracy from the Lead Assistant's eye,
// and a missing role falls back to the next person on the staff.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { advisers, faAdvice, lineupAdvice } from '../src/engine/assistants';
import { staffOf, fireCoach } from '../src/engine/staff';
import { deptOf, fireAnalyst } from '../src/engine/analytics';

const g = Game.create(77, [0]),
  s: any = g.state,
  me = s.me;
const st = staffOf(g, me),
  lead = st.find(c => c.role === 'lead')!,
  dev = st.find(c => c.role === 'dev')!,
  head = deptOf(g, me).find(a => a.role === 'head')!;
assert.ok(lead && dev && head, 'a starting staff and department');

// The lineup advice: the real people, with ids to open their profiles.
const a = lineupAdvice(g, s, me);
assert.deepEqual(
  a.staff.map(x => [x.name, x.role]),
  [
    [lead.name, 'Lead Assistant'],
    [dev.name, 'Head of Player Development'],
    [head.name, 'Head of Analytics'],
  ],
);
assert.equal(a.staff[0].cid, lead.id);
assert.equal(a.staff[2].aid, head.id);
assert.ok(
  a.lines.every(l => a.staff.some(x => x.name === l.by)),
  'every line is signed by someone on the staff',
);

// Accuracy from the Lead Assistant's eye for talent.
lead.r.eye = 90;
assert.equal(advisers(g, s, me).noise, 0, 'a great eye reads form exactly');
lead.r.eye = 30;
assert.ok(Math.abs(advisers(g, s, me).noise - 2.4) < 1e-9, 'a poor eye misjudges');

// Free agency: the Lead Assistant's picks, with the Head of Analytics' price check.
const f = faAdvice(g, s, me);
assert.equal(f.by.cid, lead.id);
assert.equal(f.by.role, 'Lead Assistant');
assert.equal(f.ana?.aid, head.id);
assert.ok(f.summary.length > 0);

// No department: the numbers lines fall to the Lead Assistant; no Lead Assistant: the next coach steps in.
deptOf(g, me).forEach(x => fireAnalyst(g, s, me, x.id, true));
const b = lineupAdvice(g, s, me);
assert.ok(!b.staff.some(x => x.aid != null), 'no analyst without a department');
assert.equal(faAdvice(g, s, me).ana, null);
assert.equal(fireCoach(g, s, me, lead.id, true), '');
const w = advisers(g, s, me);
assert.notEqual(w.lead.cid, lead.id);
assert.equal(w.lead.role, 'Assistant Coach', 'an Assistant Coach steps in');
console.log('advisers: ok');

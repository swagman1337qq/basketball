// No mid-contract raises; underpaid coaches interview for a step up (2026-11-23, staff.ts underpaid, carousel.ts
// interviewFor). An Assistant Coach whose market price is 1.3× his salary or more can take an AI team's Lead Assistant or
// Head of Player Development opening; nobody moves sideways or down, a coach with a signed extension stays, each
// interviews once a summer, and you're told when one leaves (no payout: his new team pays him).
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as ST from '../src/engine/staff';
import { fillAiStaffs } from '../src/engine/carousel';

const g: any = Game.create(61, [0]),
  s = g.state,
  me = s.me;
const C = ST.coachDb(g);
const mine = ST.staffOf(g, me);
const asst = mine.find(c => c.role === 'asst')!,
  lead = mine.find(c => c.role === 'lead')!;
// Badly underpaid, ambitious and not loyal; known around the league.
Object.assign(asst, { amt: 0.2, rep: 80, born: g.Y - 40 });
Object.assign(asst.pers, { amb: 99, loyal: 10 });
delete asst.next;
delete asst.intY;
assert.ok(ST.underpaid(g, asst));
// An AI team loses its Lead Assistant: an opening that is a step up for him.
const ai = s.teams.find((t: any) => t.tid !== me).tid;
const open = ST.staffOf(g, ai).find(c => c.role === 'lead')!;
Object.assign(open, { tid: null, role: null, amt: 0, exp: 0 });
const others = s.teams.filter((t: any) => t.tid !== me && t.tid !== ai).map((t: any) => t.tid);
others.forEach((t: number) => assert.ok(ST.staffOf(g, t).some(c => c.role === 'lead'))); // only one opening

const fixed = (v: number, f: () => void) => {
  const r = Math.random;
  Math.random = () => v;
  try {
    f();
  } finally {
    Math.random = r;
  }
};
const size0 = ST.staffOf(g, me).length,
  old = asst.amt,
  notices: any[] = [];
fixed(0.01, () => fillAiStaffs(g, s, { notices }));
assert.equal(asst.tid, ai, 'took the promotion');
assert.equal(asst.role, 'lead');
assert.ok(asst.amt >= old * 1.1, 'for more money');
assert.equal(ST.staffOf(g, me).length, size0 - 1);
assert.ok(!(g.db.coachDead?.[me] || []).length, 'no payout: his new team pays him');
const n = notices.find(x => x.title === asst.name + ' leaves for a promotion');
assert.ok(n, 'you are told');
console.log(n.lines.join(' / '));

// Not sideways: your Lead Assistant (underpaid too) doesn't interview for an assistant's job.
Object.assign(lead, { amt: 0.2, rep: 80 });
lead.intY = undefined;
const opening2 = ST.staffOf(g, ai).find(c => c.role === 'asst')!;
Object.assign(opening2, { tid: null, role: null, amt: 0, exp: 0 });
fixed(0.01, () => fillAiStaffs(g, s, { notices }));
assert.equal(lead.tid, me, 'no sideways or downward moves');
assert.equal(lead.role, 'lead');

// A signed extension, a fair salary or one interview a summer: he stays.
const a2 = ST.staffOf(g, me).find(c => c.role === 'asst' || c.role === 'dev');
if (a2) {
  Object.assign(a2, { amt: 0.2, rep: 80, role: 'asst' });
  a2.next = { start: g.Y + 1, exp: g.Y + 3, amt: 0.3 };
  const op3 = ST.staffOf(g, ai).find(c => c.role === 'dev')!;
  Object.assign(op3, { tid: null, role: null, amt: 0, exp: 0 });
  fixed(0.01, () => fillAiStaffs(g, s, { notices }));
  assert.equal(a2.tid, me, 'a signed extension: he stays');
  delete a2.next;
  a2.amt = ST.coachAsk(g, a2, 'asst');
  assert.ok(!ST.underpaid(g, a2), 'paid his market price: not underpaid');
}
const back = C[asst.id];
assert.equal(back.intY, g.Y, 'interviewed this summer');

// No mid-contract raise requests at training camp.
const y = ST.staffYear(g, s).notices;
assert.ok(!y.some((x: any) => /asks for a raise/.test(x.title)));
console.log('ok staffInterviews');

// Pre-draft workouts and the combine (workouts.ts): the class's top prospects measured once and in sane ranges;
// workouts from the lottery to the first pick, at most WO_MAX, refused by prospects far above your pick; a workout
// halves the miss in your ceiling read and adds intel; save and reopen.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as W from '../src/engine/workouts';

const g = Game.create(41, [0]),
  me = (g.state as any).me,
  Y = g.Y,
  P: any = g.db.P;
const ids: number[] = (g.db as any).cls[Y].filter((id: number) => P[id]);
const rank = (id: number) => (g.db as any).rank?.[id] ?? 999;

// The combine: the board's top COMBINE_N, measured once.
W.runCombine(g, g.state);
const measured = ids.filter(id => P[id].cmb != null);
assert.equal(measured.length, Math.min(W.COMBINE_N, ids.length));
const top = ids.slice().sort((a, b) => rank(a) - rank(b));
assert.ok(
  top.slice(0, W.COMBINE_N).every(id => P[id].cmb != null),
  'the top of the board is invited',
);
const cs = measured.map(id => W.combineOf(P[id])).filter(Boolean) as W.Combine[];
assert.ok(cs.length >= measured.length * 0.8, 'most attend');
for (const c of cs) {
  assert.ok(c.bare > 64 && c.bare < 92 && c.shoes > c.bare && c.reach > c.bare * 1.2, 'sizes ' + JSON.stringify(c));
  assert.ok(c.maxV >= 22 && c.maxV <= 46 && c.stdV < c.maxV && c.lane >= 9.9 && c.lane <= 13.4 && c.bench >= 0);
}
const before = JSON.stringify(measured.map(id => P[id].cmb));
W.runCombine(g, g.state);
assert.equal(JSON.stringify(measured.map(id => P[id].cmb)), before, 'measured once');
assert.equal(W.ftIn(80.25), '6′8¼″');

// Workouts: closed in the regular season, open at the lottery.
assert.equal(W.woOpen(g.state), false);
g.setState({ phase: 'lottery' });
assert.equal(W.woOpen(g.state), true);
const slot = W.bestSlot(g, g.state, me)!;
assert.ok(slot >= 1 && slot <= 60, 'your first pick ' + slot);
const willing = top.filter(id => W.woAnswer(g, g.state, me, P[id]).ok);
const refusing = top.filter(id => !W.woAnswer(g, g.state, me, P[id]).ok);
assert.ok(willing.length >= 20, 'plenty will come');
if (slot > 3) assert.ok(refusing.length >= 1, 'a prospect far above your pick won’t come');
if (refusing.length) assert.match(W.doWorkout(g, g.state, me, refusing[0]), /won’t come in/);

// A workout: intel, a sharper ceiling read, a report.
const pid = willing[willing.length - 1],
  p = P[pid],
  intel0 = (g.state as any).intel?.[pid] || 0;
const truth = p.tpot ?? p.pot,
  readBefore = g.potRead(p, me);
assert.equal(W.doWorkout(g, g.state, me, pid), '');
assert.ok(W.worked(g.state, Y, me, pid));
assert.ok(((g.state as any).intel[pid] || 0) >= Math.min(12, intel0 + 5.9), 'intel added');
assert.ok(Math.abs(g.potRead(p, me) - truth) <= Math.abs(readBefore - truth), 'the read moves toward the truth');
assert.match(W.doWorkout(g, g.state, me, pid), /already/);
const r = W.woReport(p);
assert.equal(r.drills.length, 3);
assert.ok(r.drills.every(([, m, a]) => m >= 0 && m <= a));

// The limit, and God Mode past it.
for (const id of willing.slice(0, -1)) if (W.woUsed(g.state, Y, me) < W.WO_MAX) W.doWorkout(g, g.state, me, id);
assert.equal(W.woUsed(g.state, Y, me), W.WO_MAX);
const extra = willing.find(id => !W.worked(g.state, Y, me, id))!;
assert.match(W.doWorkout(g, g.state, me, extra), /all 12/);
assert.equal(W.doWorkout(g, g.state, me, extra, true), '', 'God Mode: past the limit');

// Other teams' reads untouched; the draft under way closes the window.
const other = (g.state as any).teams.find((t: any) => t.tid !== me).tid;
assert.equal(W.worked(g.state, Y, other, pid), false);
g.setState({ phase: 'draft', picks: [{ n: 1, rd: 1, orig: 0, pid: top[0] }] });
assert.equal(W.woOpen(g.state), false);

// Save and reopen.
const re = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.ok(W.worked(re.state, Y, me, pid));
assert.deepEqual(re.db.P[measured[0]].cmb, P[measured[0]].cmb);
// The screens render: the combine numbers, the invite, the report.
{
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  const { CombineGrid, WorkoutBlock } = await import('../src/ui/screens/DraftWorkout');
  const html = renderToStaticMarkup(createElement(CombineGrid, { p: P[measured.find(id => W.combineOf(P[id]))!] }));
  assert.ok(html.includes('Wingspan') && html.includes('Max vertical') && /\d′\d/.test(html), 'combine grid');
  const g2 = Game.create(43, [0]);
  W.runCombine(g2, g2.state);
  g2.setState({ phase: 'lottery' });
  const vm: any = { ctx: { gm: g2, s: g2.state } };
  const q = (g2.db as any).cls[g2.Y].map((id: number) => g2.db.P[id]).find((x: any) => W.woAnswer(g2, g2.state, me, x).ok);
  assert.match(renderToStaticMarkup(createElement(WorkoutBlock, { vm, p: q })), /Bring him in for a workout/);
  W.doWorkout(g2, g2.state, me, q.id);
  vm.ctx.s = g2.state;
  const rep = renderToStaticMarkup(createElement(WorkoutBlock, { vm, p: q }));
  assert.ok(rep.includes('Worked out for you.') && rep.includes('Shooting drills') && rep.includes('Medical'), 'report');
}
console.log('workouts: ok');

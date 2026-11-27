// Coaches phase 3 (carousel.ts): AI staffs, the owner's target, firing only after two missed seasons, a frugal
// owner waiting out a contract, hiring (a team can't be blocked from offering your assistant a head coaching job),
// and the Mailbox / league-log notices.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as ST from '../src/engine/staff';
import { carousel, hireHeadCoach, targetMet } from '../src/engine/carousel';
import { headCoachOf } from '../src/engine/coachCareer';

const g = Game.create(41, [0]),
  s: any = g.state,
  d: any = g.db,
  Y = g.Y;
const ai = s.teams.map((t: any) => t.tid).filter((t: number) => !g.isUser(s, t));

// Every AI team runs a full staff of people, and it drives the team.
for (const tid of ai) {
  const st = ST.staffOf(g, tid),
    n = (r: string) => st.filter(c => c.role === r).length;
  assert.equal(n('hc'), 1, 'one head coach');
  assert.equal(n('lead'), 1, 'a Lead Assistant');
  assert.ok(n('asst') >= 2, 'two assistants');
  assert.equal(n('dev'), 1, 'a development head');
  assert.ok(ST.hasStaff(g, s, tid));
}
// The head coach makes the calls: an AI staff weighs the same as yours (you are your team's head coach).
{
  const st = ST.staffOf(g, ai[0]).map(c => ({ ...c, r: { ...c.r } }));
  const hc = st.find(c => c.role === 'hc')!;
  hc.r.game = 90;
  assert.equal(ST.fxOf(st).q, +Math.min(0.95, 0.573 + (90 - 50) * 0.012).toFixed(3), 'in-game reads come from the head coach');
}
// An AI owner's coaching line follows his type (frugal well below a win-now spender).
{
  const byArch: Record<string, number[]> = {};
  ai.forEach((t: number) => (byArch[s.teams[t].arch] ||= []).push(ST.staffCost(g, s, t)));
  const avg = (k: string) => (byArch[k] || []).reduce((a, x) => a + x, 0) / Math.max(1, (byArch[k] || []).length);
  if (byArch['Frugal Profit-Seeker'] && byArch['Win-Now Spender'])
    assert.ok(avg('Frugal Profit-Seeker') < avg('Win-Now Spender'), 'frugal owners pay less for coaching');
}

// The owner's target: the media's preseason projection for his team.
const setProj = (tid: number, w: number) => {
  d.preds = d.preds || {};
  d.preds[Y] = d.preds[Y] || { season: Y, locked: true, outlets: { a: { wins: {} }, b: { wins: {} } } };
  Object.values(d.preds[Y].outlets).forEach((o: any) => (o.wins[tid] = w));
};
// The strongest team of an owner type: one a bad season won't turn into a rebuilding team (patience 3, not 2).
const pick = (arch: string) =>
  ai.filter((t: number) => s.teams[t].arch === arch).sort((a: number, b: number) => s.teams[b].str - s.teams[a].str)[0] ?? ai[0];
const bad = (tid: number) => {
  setProj(tid, 50);
  s.teams[tid].w = 30;
  s.teams[tid].l = 52;
};
// Everyone else has an ordinary season (on target), so only the teams under test change coaches.
ai.forEach((t: number) => {
  setProj(t, 41);
  s.teams[t].w = 41;
  s.teams[t].l = 41;
});
const winNow = pick('Win-Now Spender');
bad(winNow);
assert.equal(targetMet(g, s, winNow, 'Missed the playoffs').met, false);
s.teams[winNow].w = 49;
s.teams[winNow].l = 33;
assert.equal(targetMet(g, s, winNow, 'Lost in the second round').met, true, 'within the tolerance');

// One missed season never costs a head coach his job, not even when his contract ends.
{
  bad(winNow);
  const hc = headCoachOf(g, winNow)!;
  hc.exp = Y;
  d.hcMiss = { [winNow]: 0 };
  const out = carousel(g, s, () => 'Missed the playoffs');
  assert.equal(headCoachOf(g, winNow)?.id, hc.id, 'kept after one miss');
  assert.equal(d.hcMiss[winNow], 1);
  assert.ok(hc.exp > Y, 'renewed');
  assert.ok(!out.notices.some(n => n.title.includes(s.teams[winNow].name)));
}
// The second missed season in a row: fired, paid out, a new head coach hired, the Mailbox and log told.
{
  delete d.carouselY;
  const hc = headCoachOf(g, winNow)!,
    owed = hc.exp > Y;
  const out = carousel(g, s, () => 'Missed the playoffs');
  const now = headCoachOf(g, winNow)!;
  assert.notEqual(now.id, hc.id, 'fired after two misses');
  assert.ok(hc.tid !== winNow && hc.role !== 'hc', 'gone (out of work, or an assistant on a top team)');
  assert.equal(d.hcMiss[winNow], 0, 'a new coach starts clean');
  if (owed)
    assert.ok(
      (d.coachDead[winNow] || []).some((x: any) => x.name === hc.name),
      'his deal is paid out',
    );
  const tn = s.teams[winNow].region + ' ' + s.teams[winNow].name;
  assert.ok(
    out.notices.some(n => n.title === 'Coaching change: ' + tn),
    'a Mailbox notice for the team',
  );
  assert.ok(
    out.log.some(e => e.text === tn + ' fired head coach ' + hc.name),
    'the firing in the league log',
  );
  assert.ok(
    out.log.some(e => e.text.startsWith(tn + ' hired ' + now.name + ' as head coach')),
    'the hiring in the league log',
  );
  assert.equal(ST.staffOf(g, winNow).filter(c => c.role === 'hc').length, 1);
}
// A frugal owner won't pay two head coaches: he waits for the contract to end.
{
  const fr = pick('Frugal Profit-Seeker');
  s.teams[fr].arch = 'Frugal Profit-Seeker';
  bad(fr);
  const hc = headCoachOf(g, fr)!;
  hc.exp = Y + 2;
  d.hcMiss = { [fr]: 1 };
  delete d.carouselY;
  carousel(g, s, () => 'Missed the playoffs');
  assert.equal(headCoachOf(g, fr)?.id, hc.id, 'kept while he is still owed');
  hc.exp = Y;
  delete d.carouselY;
  carousel(g, s, () => 'Missed the playoffs');
  assert.notEqual(headCoachOf(g, fr)?.id, hc.id, 'let go when his contract ends');
}
// A rebuilding team sits through a third missed season.
assert.equal((await import('../src/engine/carousel')).patience(g, s, ai[0], 'rebuild'), 3);

// An AI team can't be stopped from offering your assistant a head coaching job: you're told.
{
  const mine = ST.staffOf(g, s.me).find(c => c.role === 'lead')!;
  (mine as any).repAdj = ((mine as any).repAdj || 0) + 80 - mine.rep;
  mine.rep = ST.repOf(g, mine);
  mine.born = Y - 45;
  const tid = pick('Asset Hoarder');
  s.teams[tid].arch = 'Asset Hoarder';
  ST.staffOf(g, tid)
    .filter(c => c.role === 'hc')
    .forEach(c => Object.assign(c, { tid: null, role: null }));
  // every other rising assistant out of the way
  ST.staffOf(g, 0); // (warm)
  (Object.values(ST.coachDb(g)) as any[]).forEach(c => {
    if (c.id !== mine.id && c.tid != null && c.role !== 'hc') c.rep = Math.min(c.rep, 30);
  });
  const R = Math.random;
  Math.random = () => 0;
  const out = { notices: [] as any[], log: [] as any[] };
  const h = hireHeadCoach(g, s, tid, out);
  Math.random = R;
  assert.equal(h.c.id, mine.id, 'your Lead Assistant takes the head coaching job');
  assert.equal(mine.tid, tid);
  assert.equal(mine.role, 'hc');
  assert.ok(
    out.notices.some(n => n.title === mine.name + ' leaves to be head coach'),
    'the Mailbox tells you',
  );
}

// An older save (phase 2) gets AI staffs on load, made to measure.
{
  const o = Game.create(42, [0]);
  const od: any = o.db;
  (Object.values(ST.coachDb(o)) as any[]).forEach(c => {
    if (c.tid != null && c.role !== 'hc' && !o.isUser(o.state, c.tid)) Object.assign(c, { tid: null, role: null });
  });
  od.staffV = 2;
  ST.ensureStaff(o);
  assert.equal(od.staffV, 3);
  const t = o.state.teams.find((x: any) => !o.isUser(o.state, x.tid)).tid;
  assert.ok(ST.staffOf(o, t).length >= 5, 'AI staff restored');
}
console.log('coachCarousel: ok');

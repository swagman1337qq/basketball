// Mid-season firings (carousel.ts midSeasonFirings, interimVerdict): an AI head coach heading far below his owner's
// target between 15 and 65 games can be fired; the Lead Assistant takes over as interim; once a season per team; never
// before 20 games, never by a frugal owner, never on your team; at season's end the carousel keeps an interim who
// played .500 or clearly better, else he goes back to the bench and isn't promoted again that summer.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { staffOf } from '../src/engine/staff';
import { carousel, isInterim, midSeasonFirings } from '../src/engine/carousel';
import { coachRows, headCoachOf, staffSeason } from '../src/engine/coachCareer';

const g: any = Game.create(57, [0]),
  s: any = g.state,
  d: any = g.db,
  Y = g.Y;
s.phase = 'regular';
const ai = s.teams.map((t: any) => t.tid).filter((t: number) => !g.isUser(s, t));
const project = (tid: number, w: number) => {
  d.preds = d.preds || {};
  d.preds[Y] = d.preds[Y] || { season: Y, locked: true, outlets: { a: { wins: {} }, b: { wins: {} } } };
  Object.values(d.preds[Y].outlets).forEach((o: any) => (o.wins[tid] = w));
};
// Every team on pace for its projection; one disaster.
ai.forEach((t: number) => {
  project(t, 41);
  Object.assign(s.teams[t], { w: 15, l: 15 });
});
const [A, B] = ai;
s.teams[A].arch = 'Win-Now Spender';
project(A, 55);
const rnd = Math.random;
Math.random = () => 0; // the owner always pulls the trigger when he would
// Not before 15 games.
Object.assign(s.teams[A], { w: 1, l: 11 });
assert.equal(midSeasonFirings(g, s, 40).log.length, 0, 'too early');
// 4–21 with a 55-win roster: fired; his Lead Assistant takes over.
Object.assign(s.teams[A], { w: 4, l: 21 });
const hc0 = headCoachOf(g, A)!,
  lead0 = staffOf(g, A).find(c => c.role === 'lead')!;
const out = midSeasonFirings(g, s, 50);
assert.equal(out.log.length, 1, 'one firing: ' + out.log.map((x: any) => x.text));
assert.equal(out.notices.length, 1, 'a Mailbox notice');
assert.match(out.log[0].text, /interim/);
assert.equal(hc0.tid, null, 'the head coach is gone');
assert.equal(headCoachOf(g, A)?.id, lead0.id, 'the Lead Assistant is head coach');
assert.ok(isInterim(g, lead0), 'as interim');
assert.ok(d.coachDead?.[A]?.some((x: any) => x.name === hc0.name) || hc0.exp <= Y, 'the owner pays out his deal');
// Once a season: even at 4–40 he isn't fired again.
Object.assign(s.teams[A], { w: 4, l: 40 });
assert.equal(midSeasonFirings(g, s, 80).log.length, 0, 'once a season');
// A frugal owner never pays two head coaches; your team is yours to run.
s.teams[B].arch = 'Frugal Profit-Seeker';
project(B, 55);
Object.assign(s.teams[B], { w: 4, l: 21 });
assert.equal(midSeasonFirings(g, s, 80).log.length, 0, 'not a frugal owner');
project(s.me, 60);
Object.assign(s.teams[s.me], { w: 3, l: 25 });
assert.equal(midSeasonFirings(g, s, 80).log.filter((x: any) => x.teams === s.teams[s.me].abbr).length, 0, 'never your team');
// A team on pace, or a little short, keeps its coach.
assert.ok(
  ai.slice(2).every((t: number) => headCoachOf(g, t) && !isInterim(g, headCoachOf(g, t)!)),
  'the rest of the league keeps its coaches',
);
Math.random = rnd;

// Their coaching records split the season: the fired coach 4–21, the interim the games since.
const yr = (c: any) => coachRows(g, s, c).find(r => r.season === Y)!;
Object.assign(s.teams[A], { w: 24, l: 38 });
assert.deepEqual([yr(hc0).w, yr(hc0).l, yr(hc0).fin], [4, 21, 'Fired mid-season'], 'his part of the season');
assert.deepEqual([yr(lead0).w, yr(lead0).l, yr(lead0).role], [20, 17, 'Head Coach'], 'the interim’s part, under way');
// Season's end. He went 20–17 after a 4–21 start: kept, on a real deal.
staffSeason(g, s);
assert.deepEqual([yr(lead0).w, yr(lead0).l], [20, 17], 'the interim’s part, stored');
const c1 = carousel(g, s, () => 'Missed the playoffs');
assert.equal(headCoachOf(g, A)?.id, lead0.id, 'kept');
assert.ok(!isInterim(g, lead0), 'no longer interim');
assert.ok(lead0.exp >= Y + 2, 'signed on for two or three years');
assert.ok(c1.notices.some((n: any) => /Interim coach kept/.test(n.title)));

// Another season, another interim who goes 10–30: back to the bench, and the job goes to someone else.
const g2: any = Game.create(58, [0]),
  s2: any = g2.state,
  d2: any = g2.db,
  Y2 = g2.Y;
s2.phase = 'regular';
const A2 = s2.teams.map((t: any) => t.tid).find((t: number) => !g2.isUser(s2, t));
d2.preds = { [Y2]: { season: Y2, locked: true, outlets: { a: { wins: { [A2]: 55 } } } } };
s2.teams[A2].arch = 'Win-Now Spender';
Object.assign(s2.teams[A2], { w: 5, l: 20 });
Math.random = () => 0;
midSeasonFirings(g2, s2, 50);
Math.random = rnd;
const int2 = headCoachOf(g2, A2)!;
assert.ok(isInterim(g2, int2));
Object.assign(s2.teams[A2], { w: 15, l: 50 });
carousel(g2, s2, () => 'Missed the playoffs');
const now = headCoachOf(g2, A2)!;
assert.notEqual(now.id, int2.id, 'a new head coach');
assert.equal(int2.tid, A2, 'the interim stays on the staff');
assert.equal(int2.role, 'lead', 'as Lead Assistant again');
console.log('midSeason: ok');

// The daily driver must include the game the outgoing coach coached on firing day.
{
  const oldRandom = Math.random;
  let fired = false;
  for (let seed = 1; seed <= 12 && !fired; seed++) {
    const q: any = Game.create(905, [0]);
    const team = 1,
      opponent = 2;
    const day = Array.from({ length: q.db.days.length }, (_, i) => i).find(
      i => q.dateOf(i).getMonth() === 11 && q.dateOf(i).getDate() === 1,
    )!;
    assert(day != null, 'December monthly check exists');
    q.state.day = day;
    q.db.days[day] = [[team, opponent]];
    q.state.teams.forEach((t: any) => Object.assign(t, { w: 20, l: 20 }));
    Object.assign(q.state.teams[team], { w: 4, l: 21, arch: 'Win-Now Spender' });
    q.db.preds = { [q.Y]: { outlets: { a: { wins: { [team]: 55 } } } } };
    const outgoing = headCoachOf(q, team)!;
    let state = seed;
    Math.random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) | 0;
      return (state >>> 0) / 4294967296;
    };
    const patch = q.simDay(q.state, undefined, 0);
    Math.random = oldRandom;
    if (q.db.midFired?.[team] == null) continue;
    fired = true;
    const record = outgoing.h!.find((r: number[]) => r[0] === q.Y)!;
    assert.deepEqual(record.slice(4, 6), [patch.teams[team].w, patch.teams[team].l], 'Outgoing coach owns the complete firing-day record');
    assert.deepEqual([q.db.interimAt[team].w, q.db.interimAt[team].l], record.slice(4, 6), 'Interim starts after that completed game');
  }
  Math.random = oldRandom;
  assert(fired, 'At least one seeded real daily run exercises a firing');
}
console.log('midSeason daily integration: ok');

// With no Lead Assistant, the actual Assistant Coach role is named correctly.
{
  const q: any = Game.create(906, [0]),
    team = 1;
  const lead = staffOf(q, team).find(c => c.role === 'lead')!;
  lead.role = 'asst';
  Object.assign(q.state.teams[team], { w: 4, l: 21, arch: 'Win-Now Spender' });
  q.db.preds = { [q.Y]: { outlets: { a: { wins: { [team]: 55 } } } } };
  const savedRandom = Math.random;
  Math.random = () => 0;
  const change = midSeasonFirings(q, q.state, 50);
  Math.random = savedRandom;
  assert.match(change.notices[0].lines[1], /the Assistant Coach, takes over/);
}

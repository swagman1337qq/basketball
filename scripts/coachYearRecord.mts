// Coaches' yearly growth and reputation follow last season's record (2026-11-23). staffYear runs at training camp,
// after every team's record is reset to 0–0, so it used to read every staff as a .500 one: a winning staff never
// grew faster and winning never moved a coach's reputation. Now it reads his own row for last season (staff.ts
// lastSeasonWp; his part of a season split by a mid-season firing), else his team's league-history line.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { coachDb, coachOvr, lastSeasonWp, staffYear, teamWp, type Coach } from '../src/engine/staff';
import { headCoachOf } from '../src/engine/coachCareer';

const g: any = Game.create(83, [0]),
  s = g.state,
  me = s.me,
  Y1 = g.Y - 1;
const ai = s.teams.filter((t: any) => t.tid !== me && headCoachOf(g, t.tid)).map((t: any) => t.tid);
const [ta, tb] = ai;
const A = headCoachOf(g, ta)!,
  B = headCoachOf(g, tb)!;
// Last season: A's team won 62, B's 20. This camp both teams are 0–0.
s.history = [{ year: Y1, season: Y1 - 1 + '–' + String(Y1).slice(2), teams: { [ta]: { w: 62, l: 20 }, [tb]: { w: 20, l: 62 } } }];
A.h = [[Y1, ta, 3, 0]];
B.h = [[Y1, tb, 3, 0]];
assert.equal(s.teams[ta].w + s.teams[ta].l, 0, 'records are reset at camp');
assert.equal(lastSeasonWp(g, s, A), 62 / 82, 'his team’s line in league history');
assert.equal(lastSeasonWp(g, s, B), 20 / 82);
assert.equal(teamWp(g, s, ta), 62 / 82, 'a team at 0–0 reads last season');
// His own part of a split season (an interim head coach, carousel.ts) comes first.
const C = { ...A, h: [[Y1, ta, 3, 0, 30, 10]] } as Coach;
assert.equal(lastSeasonWp(g, s, C), 0.75, 'his own W–L');
assert.equal(lastSeasonWp(g, s, { ...A, h: [] } as Coach), null, 'not here last season');
// An older save's history without `year` still matches by the season label.
s.history = [{ season: Y1 - 1 + '–' + String(Y1).slice(2), teams: { [ta]: { w: 62, l: 20 }, [tb]: { w: 20, l: 62 } } }];
assert.equal(lastSeasonWp(g, s, A), 62 / 82, 'label fallback');

// The yearly step itself: two coaches alike in every way but last season's record. With the dice fixed, the
// winner grows more and gains reputation; the loser's reputation slips.
A.ceil = coachOvr(A) + 20; // room to grow
Object.assign(B, { r: { ...A.r }, ceil: A.ceil, since: A.since, born: A.born, repAdj: 0 });
(A as any).repAdj = 0;
const ovr0 = coachOvr(A);
const rnd = Math.random;
Math.random = () => 0.5;
try {
  staffYear(g, s);
} finally {
  Math.random = rnd;
}
const C2 = coachDb(g);
console.log('growth', { winner: +(coachOvr(C2[A.id]) - ovr0).toFixed(2), loser: +(coachOvr(C2[B.id]) - ovr0).toFixed(2) });
console.log('repAdj', { winner: (C2[A.id] as any).repAdj, loser: (C2[B.id] as any).repAdj });
assert.ok(coachOvr(C2[A.id]) > coachOvr(C2[B.id]), 'a winning staff grows faster');
assert.ok((C2[A.id] as any).repAdj > 0 && (C2[B.id] as any).repAdj < 0, 'winning moves reputation');
console.log('ok coachYearRecord');

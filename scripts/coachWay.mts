// AI head coaches' own way (staff.ts coachWay, coach.ts withWay, Game.coachWayFor): about a quarter of coaches each
// way on pace and rotation depth; pace moves one step within Slow–Fast, the focus fills a balanced one; a deep bench
// moves starters' minutes to the 6th–9th men and a tight rotation the reverse; your teams play your way.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { coachDb, coachWay, type Coach } from '../src/engine/staff';
import { withWay } from '../src/engine/coach';
import { headCoachOf } from '../src/engine/coachCareer';

const g: any = Game.create(81, [0]),
  s = () => g.state,
  me = s().me;

// The spread over every coach in the league.
const all = Object.values(coachDb(g)) as Coach[],
  share = (f: (c: Coach) => boolean) => all.filter(f).length / all.length;
const fast = share(c => coachWay(c).pace > 0),
  slow = share(c => coachWay(c).pace < 0),
  deep = share(c => coachWay(c).depth > 0),
  tight = share(c => coachWay(c).depth < 0);
console.log('ways:', { fast, slow, deep, tight }, 'of', all.length);
[fast, slow, deep, tight].forEach(x => assert.ok(x > 0.12 && x < 0.4, 'about a quarter each way'));
assert.deepEqual(coachWay(all[0]), coachWay(all[0]), 'stable');

// The tactics: one step of pace, within Slow–Fast; a balanced focus takes his.
const base = (pace: string, focus = 'Balanced') => ({ pace, focus }) as any;
assert.equal(withWay(base('Average'), { pace: 1, focus: null }).pace, 'Fast');
assert.equal(withWay(base('Fast'), { pace: 1, focus: null }).pace, 'Fast', 'never Very fast as an identity');
assert.equal(withWay(base('Slow'), { pace: -1, focus: null }).pace, 'Slow');
assert.equal(withWay(base('Average'), { pace: 0, focus: 'Defense first' }).focus, 'Defense first');
assert.equal(
  withWay(base('Average', 'Offense first'), { pace: 0, focus: 'Defense first' }).focus,
  'Offense first',
  'the roster’s call stands',
);

// An AI team: its head coach's way reaches the game.
const ai = s().teams.find((t: any) => t.tid !== me && headCoachOf(g, t.tid)).tid;
const way = coachWay(headCoachOf(g, ai)!);
assert.deepEqual(g.coachWayFor(s(), ai), way);
assert.deepEqual(g.simTeam(s(), ai).way, { pace: way.pace, focus: way.focus });
assert.equal(g.simTeam(s(), me).way, null, 'your team plays your way');
// Rotation depth: the same roster under a deep-bench coach and a tight one.
const orig = g.coachWayFor.bind(g),
  starters = (depth: number) => {
    g.coachWayFor = () => ({ pace: 0, depth, focus: null });
    const ps = g.simTeam(s(), ai).players;
    g.coachWayFor = orig;
    return [ps.slice(0, 5).reduce((a: number, p: any) => a + p.target, 0), ps.slice(5, 9).reduce((a: number, p: any) => a + p.target, 0)];
  };
const [d5, d9] = starters(1),
  [n5, n9] = starters(0),
  [t5, t9] = starters(-1);
assert.ok(d5 < n5 && n5 < t5, 'starters play less under a deep-bench coach: ' + [d5, n5, t5]);
assert.ok(d9 > n9 && n9 > t9, 'the bench plays more: ' + [d9, n9, t9]);
assert.ok(Math.abs(d5 + d9 - (t5 + t9)) < 0.01, 'the same minutes, shared differently');
// The Tactics screen shows the coach's pace for an AI team.
g.coachWayFor = () => ({ pace: 1, depth: 0, focus: null });
const fastT = g.coachTactics(s(), ai).pace;
g.coachWayFor = () => ({ pace: -1, depth: 0, focus: null });
const slowT = g.coachTactics(s(), ai).pace;
g.coachWayFor = orig;
const order = ['Very slow', 'Slow', 'Average', 'Fast', 'Very fast'];
assert.ok(order.indexOf(fastT) > order.indexOf(slowT), 'pace follows the coach: ' + fastT + ' vs ' + slowT);
console.log('coachWay: ok');

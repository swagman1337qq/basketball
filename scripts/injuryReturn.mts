// Coming back from injury (injuryReturn.ts): a long injury ends with a minutes limit that rises game by game and
// a higher injury risk while it lasts (less with a better medical staff, more if you lift the limit); short ones
// and day-to-day knocks don't; the game's minutes targets follow the limit; the summer clears it; save and reopen.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as R from '../src/engine/injuryReturn';

const g: any = Game.create(71, [0]),
  s = () => g.state,
  me = s().me,
  ids: number[] = s().rosters[me],
  p = g.db.P[ids[0]],
  q = g.db.P[ids[1]];

// The pieces.
R.startRamp(q, 5);
assert.equal(q.ramp, undefined, 'a short injury: no limit');
R.startRamp(q, 30);
assert.deepEqual(q.ramp, { k: 5, g: 0, m: 30 });
assert.equal(R.rampCap(q), 18, 'the first game back: 18 minutes');
const caps: number[] = [];
while (q.ramp) {
  caps.push(R.rampCap(q));
  R.rampTick(q);
}
assert.deepEqual(caps, [18, 21, 24, 28, 31], 'rising game by game');
assert.equal(R.rampCap(q), Infinity, 'then no limit');
R.startRamp(q, 200);
assert.equal(q.ramp.k, 8, 'at most eight games');
assert.ok(R.rampRisk(q, 1) > 1.5 && R.rampRisk(q, 0.5) < R.rampRisk(q, 1), 'more risk, less with better doctors');
R.liftRamp(q, true);
assert.equal(R.rampCap(q), Infinity);
assert.ok(R.rampRisk(q, 1) > 2, 'lifted: twice the extra risk');
R.liftRamp(q, false);
assert.equal(R.rampCap(q), 18);
delete q.ramp;

// Through the game: a long injury ends in injTick, the limit starts, the minutes targets follow it, games played
// count it down.
// This checks recovery and minutes limits. A fresh random injury during the
// same tick correctly clears a ramp, so disable new injuries in this fixture.
g.setState({ phase: 'regular', noInj: true });
p.inj = { name: 'Sprained ankle', games: 1, miss: 24, until: 0 };
const out: any[] = [];
const teamPlayed = { [ids[2]]: 30 }; // his team played today (with the calendar on, injuries count down on game days)
g.injTick(s().rosters, s().day, s(), out, teamPlayed);
assert.equal(p.inj, undefined, 'healed');
assert.equal(p.ramp?.k, 4, 'a limit for four games (25 missed)');
const target = () => g.simTeam(s(), me).players.find((x: any) => x.id === p.id)?.target;
assert.ok(target() <= 18, 'tonight’s target is within the limit: ' + target());
g.injTick(s().rosters, s().day, s(), [], { [p.id]: 18 });
assert.equal(p.ramp.g, 1, 'a game played counts');
g.injTick(s().rosters, s().day, s(), [], teamPlayed);
assert.equal(p.ramp.g, 1, 'a game he sat doesn’t');
// A day-to-day knock never starts one.
q.inj = { name: 'Bruised knee', games: 1, miss: 0, until: 0, dtd: true };
g.injTick(s().rosters, s().day, s(), [], teamPlayed);
assert.equal(q.inj, undefined);
assert.equal(q.ramp, undefined);

// Save and reopen; the summer clears it.
const re: any = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(re.db.P[p.id].ramp, p.ramp);
g.setState({ phase: 'lottery' });
assert.equal(p.ramp, undefined, 'the summer finishes every comeback');
console.log('injuryReturn: ok');

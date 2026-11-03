import assert from 'node:assert/strict';
import { DAY } from '../src/engine/cba';
import { Game } from '../src/engine/Game';
import { mulberry32 } from '../src/engine/rng';
import { newLeague } from './lib/headless.mts';

const game = newLeague(919);
for (const clubs of [30, 32]) {
  const schedule = game.buildSchedule(clubs, mulberry32(991), true);
  const dates = Array.from({ length: clubs }, () => [] as number[]);
  let unequalRest = false;
  schedule.forEach((matches, day) => {
    const played = new Set<number>();
    for (const [home, away] of matches) {
      assert.notEqual(home, away);
      assert.ok(!played.has(home) && !played.has(away));
      played.add(home);
      played.add(away);
      if (dates[home].at(-1) !== dates[away].at(-1)) unequalRest = true;
      dates[home].push(day);
      dates[away].push(day);
    }
  });
  assert.ok(unequalRest);
  for (const teamDates of dates) {
    assert.equal(teamDates.length, 82);
    const gaps = teamDates.slice(1).map((date, i) => date - teamDates[i]);
    assert.ok(gaps.includes(1) && gaps.some(gap => gap > 2));
    assert.ok(!gaps.some((gap, i) => gap === 1 && gaps[i + 1] === 1));
  }
}
for (const round of Object.values(DAY)) {
  assert.equal(game.dateOf(game.ruleSlot(round)).getTime(), new Date(game.Y - 1, 9, 21 + Math.round(round * 2.14)).getTime());
}
const loaded = Game.load(structuredClone(game.toSave()));
assert.equal(loaded.db.calendarV, 1);
assert.deepEqual(loaded.db.days, game.db.days);

const legacy = newLeague(919);
delete legacy.db.calendarV;
legacy.db.days = legacy.buildSchedule(30, mulberry32(991));
const legacyLoad = Game.load(structuredClone(legacy.toSave()));
assert.equal(legacyLoad.db.days.length, 82);
assert.equal(legacyLoad.fmtS(DAY.TRADE_DEADLINE), game.fmtS(game.ruleSlot(DAY.TRADE_DEADLINE)));

const day = game.db.days.findIndex((matches, slot) => slot > 0 && matches.length > 0 && !matches.flat().includes(0));
game.state.day = day;
const player = game.db.P[game.state.rosters[0][0]];
game.godInjure(player.id, 'Calendar test', 2);
player.fat = 60;
const returnDay = player.inj.until;
assert.equal(game.injGamesOnCalendar(game.state, 0, returnDay), 2);
const update = game.simDay(game.state, undefined, 0);
assert.equal(update.day, day + 1);
assert.equal(update.games.length, game.db.days[day].length);
assert.equal(update.teams[0].w + update.teams[0].l, 0);
assert.equal(player.inj.miss || 0, 0);
assert.equal(player.inj.games, 2);
assert.ok(player.fat < 60);
const team = 1;
const shortDay = game.db.days.findIndex((_, slot) => game.userGame(slot, team) && game.restDays(team, slot) === 0);
const restedDay = game.db.days.findIndex((_, slot) => game.userGame(slot, team) && game.restDays(team, slot) >= 2);
for (const id of game.state.rosters[team]) game.db.P[id].fat = 90;
const rested = game.simTeam({ ...game.state, day: restedDay }, team).players[0];
const tired = game.simTeam({ ...game.state, day: shortDay }, team).players.find(p => p.id === rested.id);
assert.ok(tired && tired.target < rested.target, 'AI reduces a tired starter’s target on a back-to-back');
const recoverySlot = game.db.days.findIndex((_, slot) => game.calNow({ ...game.state, day: slot }) === returnDay);
assert.ok(recoverySlot > day);
game.healCal({ ...game.state, day: recoverySlot });
assert.equal(player.inj, undefined, 'injury clears on the return date');
console.log('Calendar passed: 30/32 teams, 82 games each, back-to-backs, unequal rest, no three straight days, preserved deadline dates, legacy/current saves and off-day recovery.');

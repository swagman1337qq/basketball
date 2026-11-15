import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import { teamSeasonStats, teamSeasonValue } from '../src/ui/teamSeasonStats';
import { RosterTeamDetails } from '../src/ui/screens/RosterTeamDetails';

const g = Game.create(165, [0]);
g.state.gm = { ...(g.state.gm || {}), name: 'Morgan Hartwell' };
g.state.phase = 'regular';
for (let n = 0; n < 3; n++) {
  const result = g.playGame(g.state, 0, 1);
  g.addBox(result, false, undefined, undefined, g.state);
  g.state.games.push({ day: n, h: 0, a: 1, hp: result.home.pts, ap: result.away.pts, ot: result.ot });
}
const sourceBefore = JSON.stringify(g.state.tstats);
const teams = teamSeasonStats(g, g.state, g.Y);
for (const tid of [0, 1]) {
  const scores = g.state.games.map(game => (tid === game.h ? game.hp : game.ap));
  assert.equal(teamSeasonValue(g, teams[tid], 'pts'), scores.reduce((n, score) => n + score, 0) / scores.length);
  const clock = g.state.games.reduce((n, game) => n + 48 + 5 * game.ot, 0);
  assert.equal(teams[tid].min, clock * 5);
  assert(Math.abs(teamSeasonValue(g, teams[tid], 'pace') - (g.possOf(teams[tid]) * 48) / clock) < 1e-9);
}
assert.equal(JSON.stringify(g.state.tstats), sourceBefore, 'Display must not alter saved team totals');
// Saved minutes also survive an incomplete/older game log and roster changes.
const noLog = { ...g.state, games: [], rosters: { ...g.state.rosters, 0: [] } };
const fallback = teamSeasonStats(g, noLog, g.Y);
assert(Math.abs(fallback[0].min - teams[0].min) < 0.01, 'All player team stints, including players off the roster, supply minutes');
const fake: any = {
  Y: 2030,
  playersIn: () => [
    {
      stats: [
        { season: 2029, tid: 0, min: 240, po: false },
        { season: 2029, tid: 0, min: 1000, po: true },
      ],
    },
  ],
};
const oldState = { tstats: { 0: { gp: 2, pts: 300 } }, tstatsHist: { 2029: { 0: { gp: 1, pts: 101 } } }, games: [{ h: 0, a: 1, ot: 4 }] };
assert.equal(teamSeasonStats(fake, oldState, 2029)[0].pts, 101);
assert.equal(teamSeasonStats(fake, oldState, 2029)[0].min, 240, 'Historical minutes exclude current-season games and playoff rows');
const overtimeState = {
  tstats: { 0: { gp: 2 } },
  games: [
    { h: 0, a: 1, ot: 2 },
    { h: 1, a: 0, ot: 0 },
    { h: 0, a: 1, ot: 4, po: true },
  ],
};
assert.equal(teamSeasonStats(fake, overtimeState, 2030)[0].min, (58 + 48) * 5, 'Overtime clock counts, postseason clock does not');
assert(
  Number.isNaN(teamSeasonStats({ ...fake, playersIn: () => [] }, { ...overtimeState, games: [] }, 2030)[0].min),
  'Missing records cannot become invented minutes',
);
const vm: any = { ctx: { gm: g, s: g.state, T: g.state.teams, isMine: (tid: number) => tid === 0, openTeamPage() {} } };
const own = renderToStaticMarkup(React.createElement(RosterTeamDetails, { vm, tid: 0, season: g.Y }));
assert(own.includes('Head coach:</b> Morgan Hartwell'));
assert(own.includes('Executive:</b> Morgan Hartwell'));
assert(!own.includes('Associate head coach:') && !own.includes('Preseason odds:') && !own.includes('attendance/game:'));
assert(!own.includes('regular season · 3 game'), 'The season selector is the only season label');
assert(own.includes(teamSeasonValue(g, teams[0], 'pace').toFixed(1)), 'Pace renders from recorded game time');
const other = renderToStaticMarkup(React.createElement(RosterTeamDetails, { vm, tid: 1, season: g.Y }));
assert(other.includes('Executive:</b> ' + g.state.teams[1].gm));
assert(!other.includes('Morgan Hartwell'));
console.log(
  'PASS: real season scores, OT-aware pace, traded-player minutes, historical/playoff isolation, missing-data handling, and the manager name in both roles.',
);

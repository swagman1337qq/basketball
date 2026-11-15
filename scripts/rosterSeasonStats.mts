import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { rosterSeasonStats, rosterPlayoffAdvanced } from '../src/ui/rosterSeasonStats';
import { teamSeasonValue } from '../src/ui/teamSeasonStats';

const g = Game.create(872, [0]);
const results: Record<string, any> = {};
for (const [i, kind] of ['reg', 'playin', 'po'].entries()) {
  const res = g.playGame(g.state, 0, 1);
  g.addBox(res, kind !== 'reg', undefined, undefined, g.state);
  const bid = g.keepBox(res, i, kind);
  g.state.games.push({ day: i, h: 0, a: 1, hp: res.home.pts, ap: res.away.pts, ot: res.ot, bid, ...(kind !== 'reg' ? { po: kind } : {}) });
  results[kind] = res;
}
const regular = rosterSeasonStats(g, g.state, g.Y);
const playoffs = rosterSeasonStats(g, g.state, g.Y, true);
assert.equal(teamSeasonValue(g, regular.teams[0], 'pts'), results.reg.home.pts);
assert.equal(teamSeasonValue(g, playoffs.teams[0], 'pts'), results.po.home.pts);
assert.equal(playoffs.teams[0].gp, 1);
assert.equal(playoffs.teams[0].pts, results.po.home.pts, 'Play-in and regular-season scoring cannot enter playoff totals');
assert.equal(playoffs.teams[1].pts, results.po.away.pts);
assert.equal(playoffs.teams[0].w + playoffs.teams[0].l, 1);
assert.equal(playoffs.teams[0].min, (48 + 5 * results.po.ot) * 5);
for (const [pid, line] of Object.entries(results.po.home.box) as [string, any][]) {
  if (!(line.min > 0)) continue;
  assert.equal(playoffs.players[pid].gp, 1);
  for (const key of Game.BOX_F.filter(k => k !== 'min')) assert.equal(playoffs.players[pid][key], line[key]);
  assert.equal(playoffs.teamPlayers['0:' + pid].pts, line.pts);
}
const advanced = rosterPlayoffAdvanced(g, g.state, g.Y, playoffs);
const pid = Object.keys(advanced).find(id => playoffs.players[id].fga > 0)!;
const line = playoffs.players[pid];
assert(
  Math.abs(advanced[pid].tsp - (100 * line.pts) / (2 * (line.fga + 0.44 * line.fta))) < 1e-9,
  'Advanced shooting uses the playoff line',
);
for (const metric of ['per', 'epm', 'lebron', 'darko', 'bpm', 'ws']) assert(Number.isFinite(advanced[pid][metric]), metric);
const year = g.Y;
g.state.season++;
g.state.tstatsHist = { [year]: g.state.tstats };
g.state.tstats = {};
g.state.games = [];
assert.deepEqual(rosterSeasonStats(g, g.state, g.Y, true).teams, {}, "A new season cannot reuse last year's playoffs");
assert.equal(rosterSeasonStats(g, g.state, year).teams[0].pts, results.reg.home.pts);
const past = rosterSeasonStats(g, g.state, year, true);
assert(past.legacy, 'Merged older postseason lines need an availability notice');
assert.equal(past.teams[0].pts, results.playin.home.pts + results.po.home.pts);
assert.equal(past.teams[0].w, undefined, 'Never replace an unavailable past playoff record with the regular-season record');
console.log(
  'PASS: season/competition isolation, pure current playoff boxes excluding play-in, player lines, advanced stats, and honest historical fallbacks.',
);

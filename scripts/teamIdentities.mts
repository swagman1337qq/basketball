import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { FRANCHISES } from '../src/data/franchises';
import { defaultTeamSpecs } from '../src/data/world';
import { LOUD_COLORS, LOUD_V7, PALETTE_V } from '../src/data/palette';
import { sideOf, nearestDiv } from '../src/data/geo';
import { newLeague } from './lib/headless.mts';
const names = { PHX: 'Spitfires', WAS: 'Blossoms', ABQ: 'Crystals', TSM: 'Steel Moris' };
for (const [abbr, name] of Object.entries(names)) {
  const rows = FRANCHISES.filter(f => f.abbr === abbr);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, name);
  assert.deepEqual(rows[0].colors, LOUD_COLORS[abbr]);
}
const starting = defaultTeamSpecs();
assert.equal(starting.length, 30);
for (const abbr of ['ABQ', 'TSM'])
  assert(!starting.some(t => t.abbr === abbr), 'Expansion additions cannot silently join the starting league');
assert.deepEqual(LOUD_COLORS.TSM, ['#000000', '#ffffff']);
assert.equal(sideOf('Temecula'), 'West');
assert.equal(nearestDiv('West', 'Temecula'), 'Pacific');
const g: any = newLeague(912),
  save = () => JSON.parse(JSON.stringify({ db: { ...g.db, C: undefined }, state: g.state }));
assert.equal(g.state.teams.length, 30);
assert(!g.state.teams.some(t => ['ABQ', 'TSM'].includes(t.abbr)));
const d = save();
d.db.paletteV = 7;
for (const [tid, abbr, name, region] of [
  [0, 'PHX', 'Chill', 'Phoenix'],
  [1, 'WAS', 'Blossoms', 'Washington'],
] as const)
  for (const list of [d.db.teams, d.state.teams]) Object.assign(list[tid], { abbr, name, region, colors: [...LOUD_V7[abbr]] });
d.state.expTeams = [
  { ...FRANCHISES.find(f => f.abbr === 'ABQ'), name: 'Roadrunners', icon: 'Sun', colors: [...LOUD_V7.ABQ] },
  { ...FRANCHISES.find(f => f.abbr === 'TSM') },
];
d.state.history = [
  { season: g.Y - 1, teams: { 0: { abbr: 'PHX', name: 'Phoenix Chill' }, 1: { abbr: 'WAS', name: 'Washington Blossoms' } } },
];
const players = JSON.stringify(Object.values(d.db.P).map((p: any) => [p.id, p.r, p.stats]));
const h: any = Game.load(d);
for (const [tid, abbr] of [
  [0, 'PHX'],
  [1, 'WAS'],
] as const) {
  assert.equal(h.state.teams[tid].name, names[abbr]);
  assert.equal(h.db.teams[tid].name, names[abbr]);
  assert.deepEqual(h.state.teams[tid].colors, LOUD_COLORS[abbr]);
  assert.deepEqual(h.db.teams[tid].colors, LOUD_COLORS[abbr]);
}
assert.equal(h.state.expTeams[0].name, 'Crystals');
assert.equal(h.state.expTeams[0].icon, 'Gem');
assert.deepEqual(h.state.expTeams[0].colors, LOUD_COLORS.ABQ);
assert.equal(h.state.history[0].teams[0].name, 'Phoenix Spitfires');
assert.equal(h.db.paletteV, PALETTE_V);
assert.equal(h.state.teams.length, 30);
assert(!h.state.teams.some(t => ['ABQ', 'TSM'].includes(t.abbr)));
assert.equal(
  JSON.stringify(Object.values(h.db.P).map((p: any) => [p.id, p.r, p.stats])),
  players,
  'Rebranding must not alter ratings or player stats',
);
const custom = save();
custom.db.paletteV = 7;
for (const list of [custom.db.teams, custom.state.teams])
  Object.assign(list[0], { abbr: 'PHX', region: 'Phoenix', name: 'Custom Firebirds', colors: ['#123456', '#654321'] });
custom.state.expTeams = [{ ...FRANCHISES.find(f => f.abbr === 'ABQ'), name: 'Roadrunners', colors: ['#112233', '#ddeeff'] }];
const kept: any = Game.load(custom);
assert.equal(kept.state.teams[0].name, 'Custom Firebirds');
assert.deepEqual(kept.state.teams[0].colors, ['#123456', '#654321']);
assert.equal(kept.state.expTeams[0].name, 'Crystals');
assert.deepEqual(kept.state.expTeams[0].colors, ['#112233', '#ddeeff']);
console.log(
  'PASS: expansion catalogue, unchanged starting league, exact names/colors, West/Pacific geography, pending expansion, historical names, custom colors, unchanged player ratings/stats.',
);

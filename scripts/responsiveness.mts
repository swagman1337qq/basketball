import { seasonLeaders } from '../src/engine/leaders';
import { entityNameIndex } from '../src/ui/entityNameIndex';
import { planBoxArchive, rememberBoxArchive } from '../src/db/boxArchive';
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { encodeDb, encodeState } from '../src/engine/saveCodec';
import { RATING_KEYS } from '../src/data/world';
import { cachedProfileSeason, computeProfileSeason } from '../src/ui/profileStatsData';
import { seasonAdvanced } from '../src/engine/advanced';
const g = Game.create(684, [0]);
const s = g.state;
const first = g.saveVersion;
for (const patch of [
  { screen: 'trade' },
  { modal: true, pid: s.rosters[0][0], ptab: 'overview', extYears: null, extAmt: null, extMsg: null },
  { ptab: 'stats', ptabHist: ['overview'] },
  { boxId: 'test' },
  { q: 'test' },
])
  g.setState(patch);
assert.equal(g.saveVersion, first, 'Browsing screens, profiles, tabs, search and boxes does not queue a league-data save');
g.setState({ gv: (s.gv || 0) + 1 });
assert.equal(g.saveVersion, first + 1, 'Player edits remain dirty');
g.setState({ extMsg: 'Agreed', log: [...s.log] });
assert.equal(g.saveVersion, first + 2, 'An extension result with data changes remains dirty');
g.setState({ rosters: { ...g.state.rosters } });
assert.equal(g.saveVersion, first + 3, 'Roster/trade updates remain dirty');
g.setState({ modal: false, boxId: null, q: '' });
const raw = structuredClone(g.saveSnapshot());
assert.deepEqual(
  { db: encodeDb(raw.db, RATING_KEYS), state: encodeState(raw.state) },
  g.toSave(),
  'Worker snapshot encoding exactly matches existing saves',
);
assert.equal(raw.db.C, undefined);
assert.equal(raw.state.modal, false);
const res = g.playGame(g.state, 0, 1);
g.addBox(res, false, undefined, undefined, g.state);
g.setState({ day: g.state.day + 1 });
const pid = g.state.rosters[0][0],
  y = g.Y;
const values = computeProfileSeason(g, g.state, pid, y, false, false);
assert.deepEqual(values.advanced, seasonAdvanced(g, g.state, y).byPid[pid]);
g.setState({ modal: true, pid, ptab: 'stats' });
assert.strictEqual(cachedProfileSeason(g, g.state, pid, y, false, false), values, 'Profile navigation reuses exact calculated values');
const statsRevision = g.statsVersion;
g.setState({ tMine: [pid], tkMine: [], tExcludeK: ['pick'], tMsg: 'Test proposal', offers: null });
assert.equal(g.statsVersion, statsRevision, 'Proposed trades do not change statistical revisions');
assert.strictEqual(cachedProfileSeason(g, g.state, pid, y, false, false), values, 'Proposed trades retain exact profile statistics');
g.setState({ unknownFutureData: true });
assert.equal(cachedProfileSeason(g, g.state, pid, y, false, false), undefined, 'Unknown data changes invalidate conservatively');
computeProfileSeason(g, g.state, pid, y, false, false);
g.setState({ gv: (g.state.gv || 0) + 1 });
assert.equal(cachedProfileSeason(g, g.state, pid, y, false, false), undefined, 'Data edits invalidate profile values');
const reopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.equal(cachedProfileSeason(reopened, reopened.state, pid, y, false, false), undefined, 'Caches do not leak into another save');
console.log(
  'PASS: navigation/data save revisions, byte-equivalent worker format, unchanged advanced stats, cache reuse and edit/save isolation.',
);
const archiveBoxes: any = { a: { details: { shots: [1, 2] } }, b: { details: { shots: [3] } } };
rememberBoxArchive('league-a', archiveBoxes);
assert.equal(planBoxArchive('league-a', archiveBoxes).records.length, 0);
archiveBoxes.c = { details: { shots: [4] } };
const pendingArchive = planBoxArchive('league-a', archiveBoxes);
assert.deepEqual(
  pendingArchive.records.map(x => x.bid),
  ['c'],
);
archiveBoxes.d = { details: { shots: [5] } };
pendingArchive.acknowledge();
assert.deepEqual(
  planBoxArchive('league-a', archiveBoxes).records.map(x => x.bid),
  ['d'],
  'In-flight saves cannot acknowledge later games',
);
assert.equal(planBoxArchive('league-b', archiveBoxes).records.length, 4, 'Archives never leak across leagues');
archiveBoxes.a = { details: { shots: [9] } };
assert.deepEqual(
  planBoxArchive('league-a', archiveBoxes).records.map(x => x.bid),
  ['a', 'd'],
);
console.log('PASS: incremental archives retain every box, send only changed/new games and isolate in-flight jobs and saves.');

const links = entityNameIndex(['LA', 'Los Angeles', 'Los Angeles Stars', 'Shěn Jiànjūn', 'A. Brown', 'C++']);
assert.deepEqual(links('Los Angeles Stars trade Shěn Jiànjūn to LA.'), [
  { start: 0, name: 'Los Angeles Stars' },
  { start: 24, name: 'Shěn Jiànjūn' },
  { start: 40, name: 'LA' },
]);
assert.deepEqual(links('LAL XLAX 2LA LA2 _LA A. Brown C++'), [
  { start: 21, name: 'A. Brown' },
  { start: 30, name: 'C++' },
]);
assert.deepEqual(links('𐐀LA'), [], 'Unicode letters also enforce word boundaries');
console.log('PASS: trade name links preserve longest matches, punctuation, Unicode names and word boundaries.');

const makeLeaders = (pts: number) => {
  const totals = { gp: 82, min: 2460, pts, fgm: 300, fga: 650, tpm: 100, tpa: 250, ftm: 120, fta: 140, ast: 200 };
  return {
    Y: 2055,
    db: {},
    statsVersion: 0,
    state: { day: 9, phase: 'regular', gv: 0, teams: [{ w: 82, l: 0 }] },
    playersIn: () => [{ stats: [{ season: 2055, gp: 82 }] }],
    seasonTotals: () => totals,
    totals,
  };
};
const a = makeLeaders(820),
  b = makeLeaders(1640);
const aResult = seasonLeaders(a as any, a.state, 2055, 'pg');
assert.equal(aResult.pts, 100);
assert.equal(seasonLeaders(b as any, b.state, 2055, 'pg').pts, 200, 'League-leader caches cannot leak across saves');
assert.strictEqual(seasonLeaders(a as any, a.state, 2055, 'pg'), aResult);
a.totals.pts = 2460;
a.statsVersion++;
assert.equal(seasonLeaders(a as any, a.state, 2055, 'pg').pts, 300, 'A statistical edit with the same game count refreshes leaders');
a.Y = 2056;
a.state.gv++;
a.totals.pts = 3280;
assert.equal(seasonLeaders(a as any, a.state, 2055, 'pg').pts, 400, 'Historical leader edits refresh too');
console.log('PASS: league-isolated leader caches, proposed-trade reuse, unknown-change safety, and current/historical edits.');

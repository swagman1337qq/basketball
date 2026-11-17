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

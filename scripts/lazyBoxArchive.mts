import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { db, putSave, getSave, exportSave, importSave, readSavedBox } from '../src/db/saves';
import { createSaveWriter } from '../src/db/saveWriter';
import { createBoxDetailLoader } from '../src/db/boxDetails';
import { boxSummary, boxMatchesSummary, isBoxReference, planBoxArchive } from '../src/db/boxArchive';
import { encodeDb, encodeState } from '../src/engine/saveCodec';
import { rosterSeasonStats } from '../src/ui/rosterSeasonStats';

const game = Game.create(219, [0]);
const recordGame = (day: number, po = false) => {
  const result = new GameSim(game.simTeam(game.state, 0), game.simTeam(game.state, 1), { norms: game.db.norms, record: true }).run();
  return game.keepBox(result, day, po ? 'po' : 'reg');
};
const ids = Array.from({ length: 5 }, (_, i) => recordGame(i, i === 4));
game.state.games = ids.map((bid, i) => ({
  bid,
  day: i,
  a: 0,
  b: 1,
  pa: game.db.boxes[bid].home.pts,
  pb: game.db.boxes[bid].away.pts,
  ...(i === 4 ? { po: 'po' } : {}),
}));
const input = game.toSave();
const originalBoxes = structuredClone(input.db.boxes);
const row = { id: 'lazy-test', name: 'Test league', createdAt: 1, updatedAt: 1, summary: 'test', data: input };
await putSave(row);
assert.deepEqual(input.db.boxes, originalBoxes, 'Saving never mutates an import/export snapshot');
let reads = 0;
db.boxes.hook('reading', value => {
  reads++;
  return value;
});
const lazy = (await getSave(row.id, { lazyBoxes: true }))!;
assert.equal(reads, 0, 'Opening a converted league reads no detailed game bodies');
assert(ids.every(id => isBoxReference(lazy.data.db.boxes[id]) && !lazy.data.db.boxes[id].details));
for (const id of ids) {
  assert.deepEqual(lazy.data.db.boxes[id].home, originalBoxes[id].home);
  assert.deepEqual(lazy.data.db.boxes[id].away, originalBoxes[id].away);
}
const loaded = Game.load(lazy.data);
const fullGame = Game.load(structuredClone(input));
const expectedPlayoffs = rosterSeasonStats(fullGame, fullGame.state, fullGame.Y, true);
assert.equal(expectedPlayoffs.legacy, false, 'Exercise exact per-game playoff aggregation');
assert.deepEqual(rosterSeasonStats(loaded, loaded.state, loaded.Y, true), expectedPlayoffs, 'Summary-only playoff totals stay exact');
const loader = createBoxDetailLoader();
let at = reads;
assert.deepEqual(await loader.load(loaded, row.id, ids[0]), originalBoxes[ids[0]]);
assert.equal(reads, at + 1, 'Opening a game reads only that body');
at = reads;
await loader.load(loaded, row.id, ids[0]);
assert.equal(reads, at, 'A repeated game uses the bounded detail cache');
for (const id of ids) await loader.load(loaded, row.id, id);
assert.equal(loader.cacheSize(loaded.db.boxes), 3);
assert(
  ids.every(id => !loaded.db.boxes[id].details),
  'Viewing games does not hydrate the live season',
);
const complete = (await getSave(row.id))!;
assert.deepEqual(complete.data.db.boxes, originalBoxes, 'Default full loading still preserves every detailed game');
const migrated = { ...row, id: 'old-split', data: { ...input, db: { ...input.db, boxes: {}, $boxKeys: ids } } };
await db.saves.put(migrated);
for (const id of ids) await db.boxes.put({ saveId: migrated.id, bid: id, box: originalBoxes[id] });
const older = (await getSave(migrated.id, { lazyBoxes: true }))!;
assert(ids.every(id => isBoxReference(older.data.db.boxes[id])));
assert.deepEqual((await getSave(migrated.id))!.data.db.boxes, originalBoxes);
at = reads;
await getSave(migrated.id, { lazyBoxes: true });
assert.equal(reads, at, 'Older split saves need their summary conversion only once');
assert.deepEqual(
  await loader.load(Game.load(older.data), migrated.id, ids[0]),
  originalBoxes[ids[0]],
  'Unversioned legacy archives remain readable',
);

// Capture actual exported files without browser UI; each must be entirely self-contained.
const oldDocument = globalThis.document,
  oldCreate = URL.createObjectURL,
  oldRevoke = URL.revokeObjectURL;
let blob: Blob;
(globalThis as any).document = { createElement: () => ({ click() {} }) };
URL.createObjectURL = value => {
  blob = value as Blob;
  return 'blob:test';
};
URL.revokeObjectURL = () => {};
const exportData = async (g: Game) => {
  await exportSave({ ...row, data: g.toSave() });
  const result = JSON.parse(await blob.text());
  assert(!result.data.db.$boxKeys && !result.data.db.$boxHeads);
  assert(!Object.values(result.data.db.boxes).some(isBoxReference), 'No browser-only references may enter a downloaded save');
  return result;
};
const makeNew = (g: Game, tag: string) => {
  const id = g.Y + '-' + tag;
  g.db.boxes[id] = { ...structuredClone(originalBoxes[ids[0]]), day: 91, details: { ...originalBoxes[ids[0]].details, fixtureTag: tag } };
  g.setState({ gv: (g.state.gv || 0) + 1 });
  return id;
};
const oldWorker = globalThis.Worker;
let pending: any;
class HeldWorker {
  onmessage: any;
  onerror: any;
  onmessageerror: any;
  job: any;
  postMessage(job: any) {
    this.job = structuredClone(job);
    pending = this;
  }
  terminate() {}
}
(globalThis as any).Worker = HeldWorker;
const writer = createSaveWriter();
try {
  const firstNew = makeNew(loaded, 'unsaved-a');
  const viewedFullGame = loaded.db.boxes[firstNew];
  at = reads;
  assert(!!(await loader.load(loaded, row.id, firstNew)).details);
  assert.equal(reads, at);
  const saving = writer.save(loaded, row);
  for (let i = 0; i < 100 && !pending; i++) await new Promise(r => setTimeout(r, 2));
  assert(pending);
  const secondNew = makeNew(loaded, 'unsaved-b');
  const expectedA = structuredClone(loaded.db.boxes[firstNew]),
    expectedB = structuredClone(loaded.db.boxes[secondNew]);
  const exported = await exportData(loaded);
  for (const id of ids) assert.deepEqual(exported.data.db.boxes[id], originalBoxes[id]);
  assert.deepEqual(exported.data.db.boxes[firstNew], expectedA);
  assert.deepEqual(exported.data.db.boxes[secondNew], expectedB, 'Exports include new games created while another save is pending');
  const job = pending.job;
  await putSave(
    { ...job.meta, data: { db: encodeDb(job.snapshot.db, job.ratingKeys), state: encodeState(job.snapshot.state) } },
    job.archive,
  );
  pending.onmessage({ data: { id: job.id, ok: true } });
  await saving;
  assert(isBoxReference(loaded.db.boxes[firstNew]), 'Successfully saved details may leave live memory');
  assert(
    boxMatchesSummary(viewedFullGame, loaded.db.boxes[firstNew], row.id, firstNew),
    'An open game remains valid across post-save detail eviction',
  );
  assert.deepEqual(loaded.db.boxes[secondNew], expectedB, 'Games appended during a write remain complete until saved');
  assert.deepEqual(
    planBoxArchive(row.id, loaded.db.boxes).records.map(x => x.bid),
    [secondNew],
  );
  assert.deepEqual(await loader.load(loaded, row.id, firstNew), expectedA);
  const finalExport = await exportData(loaded);
  assert.deepEqual(finalExport.data.db.boxes[secondNew], expectedB);
  const imported = await importSave(new File([JSON.stringify(finalExport)], 'league.json'));
  assert.deepEqual(
    (await getSave(imported.id))!.data.db.boxes,
    finalExport.data.db.boxes,
    'Exports reimport with all old and unsaved game details',
  );
  await assert.rejects(
    importSave(new File([JSON.stringify({ kind: 'front-office-save', data: loaded.toSave() })], 'incomplete.json')),
    /missing game details/,
  );
  await assert.rejects(
    putSave({ ...row, data: loaded.toSave() }, { keys: ids, records: [{ bid: ids[0], box: loaded.db.boxes[ids[0]] }] }),
    /summary cannot replace/,
  );
  assert.deepEqual(await readSavedBox(row.id, ids[0]), originalBoxes[ids[0]]);
} finally {
  await writer.dispose();
  (globalThis as any).Worker = oldWorker;
  (globalThis as any).document = oldDocument;
  URL.createObjectURL = oldCreate;
  URL.revokeObjectURL = oldRevoke;
}

const failedGame = Game.load((await getSave(row.id, { lazyBoxes: true }))!.data);
const failedId = makeNew(failedGame, 'save-failure');
const failedBody = structuredClone(failedGame.db.boxes[failedId]);
const rejectSave = (_mods: any, key: any) => {
  if (key === row.id) throw Error('fixture save failure');
};
db.saveIndex.hook('updating', rejectSave);
const fallbackWriter = createSaveWriter();
await assert.rejects(fallbackWriter.save(failedGame, row), /fixture save failure/);
assert.deepEqual(failedGame.db.boxes[failedId], failedBody, 'A failed write never evicts unsaved details');
assert.equal(await db.boxes.get([row.id, failedId]), undefined, 'A failed write rolls back its archive records');
db.saveIndex.hook('updating').unsubscribe(rejectSave);
await fallbackWriter.save(failedGame, row);
assert(isBoxReference(failedGame.db.boxes[failedId]));
assert.deepEqual(await readSavedBox(row.id, failedId), failedBody);
await fallbackWriter.dispose();

// Late reads must not become another game's or another season's details.
const fresh = () => Game.load(structuredClone(lazy.data));
const delayed: { resolve: (box: any) => void; saveId: string; bid: string }[] = [];
const delayedLoader = createBoxDetailLoader((saveId, bid) => new Promise(resolve => delayed.push({ resolve, saveId, bid })));
let current = true;
const slowGame = fresh();
const stopped = delayedLoader.load(slowGame, row.id, ids[0], { isCurrent: () => current }).catch(error => error);
current = false;
delayed[0].resolve(await readSavedBox(row.id, ids[0]));
assert.equal((await stopped).name, 'AbortError');
assert.equal(delayedLoader.cacheSize(slowGame.db.boxes), 0);
const resetGame = fresh(),
  oldMap = resetGame.db.boxes;
const reset = delayedLoader.load(resetGame, row.id, ids[0]).catch(error => error);
resetGame.db.boxes = {};
delayed[1].resolve(await readSavedBox(row.id, ids[0]));
assert.equal((await reset).name, 'AbortError');
assert.equal(delayedLoader.cacheSize(oldMap), 0);
const cancelledGame = fresh(),
  abort = new AbortController();
const cancelled = delayedLoader.load(cancelledGame, row.id, ids[0], { signal: abort.signal }).catch(error => error);
abort.abort();
assert.equal((await cancelled).name, 'AbortError');
delayed[2].resolve(await readSavedBox(row.id, ids[0]));
const scopeGame = fresh();
await assert.rejects(delayedLoader.load(scopeGame, 'another-league', ids[0]), /another league/);
const replace = delayedLoader.load(scopeGame, row.id, ids[0]).catch(error => error);
scopeGame.db.boxes[ids[0]] = { ...scopeGame.db.boxes[ids[0]] };
delayed[3].resolve(await readSavedBox(row.id, ids[0]));
assert.equal((await replace).name, 'AbortError');
const stale = fresh();

const replacementRow = (await getSave(row.id))!;
replacementRow.data.db.boxes[ids[0]] = {
  ...structuredClone(originalBoxes[ids[0]]),
  details: { ...originalBoxes[ids[0]].details, fixtureTag: 'another session' },
};
await putSave(replacementRow);
await assert.rejects(createBoxDetailLoader().load(stale, row.id, ids[0]), /no longer match/);
await assert.rejects(putSave({ ...row, data: stale.toSave() }), /changed in another session/);
await assert.rejects(exportSave({ ...row, data: stale.toSave() }), /changed in another session/);
assert.deepEqual(
  await readSavedBox(row.id, ids[0]),
  replacementRow.data.db.boxes[ids[0]],
  'Rejected stale writes leave the current archive intact',
);
let attempts = 0;
const retryLoader = createBoxDetailLoader(async (saveId, bid) => {
  if (!attempts++) throw Error('temporary read failure');
  return readSavedBox(saveId, bid);
});
const retryGame = Game.load((await getSave(migrated.id, { lazyBoxes: true }))!.data);
await assert.rejects(retryLoader.load(retryGame, migrated.id, ids[1]), /temporary/);
assert.deepEqual(await retryLoader.load(retryGame, migrated.id, ids[1]), originalBoxes[ids[1]]);
db.close();
console.log(
  'PASS: detail-free opens, exact summaries/playoff totals, one-game reads, bounded cache, legacy migration, in-flight/unsaved exports, round-trip import, post-commit eviction, stale/cancelled/season/league reads, immutable versions and retry.',
);

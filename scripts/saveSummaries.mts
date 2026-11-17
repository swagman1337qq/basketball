import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
const legacy = new Dexie('front-office');
legacy.version(3).stores({ saves: 'id, updatedAt', meta: 'key', boxes: '[saveId+bid], saveId' });
const data: any = {
  db: {
    P: { 1: { name: 'Player', history: 'retained'.repeat(10000) } },
    boxes: { game: { details: { shots: [1, 2], pbp: ['made shot'], stints: [3] } } },
  },
  state: {
    me: 0,
    managed: [0],
    season: 2041,
    phase: 'draft',
    pi: 1,
    picks: [{ n: 1 }, { n: 2 }],
    teams: [
      {
        tid: 0,
        region: 'Test',
        name: 'Club',
        abbr: 'TC',
        colors: ['#123', '#456'],
        icon: 'Star',
        logoStyle: 'round',
        logoImg: 'custom-image',
        w: 10,
        l: 4,
        privateLedger: 'must not enter preview',
      },
    ],
  },
};
const before = structuredClone(data);
const original: any = { id: 'old-league', name: 'Old league', createdAt: 1, updatedAt: 2, summary: 'old summary', data };
await legacy.table('saves').put(original);
await legacy.table('meta').put({ key: 'cards', value: [{ name: 'Retained card' }] });
await legacy
  .table('saves')
  .put({ ...original, id: 'spectator', updatedAt: 1, data: { ...data, state: { ...data.state, spectator: true, managed: [] } } });
legacy.close();
const { db, listSaves, getSave, putSave, deleteSave, exportSave } = await import('../src/db/saves');
await db.open();
assert.deepEqual((await db.meta.get('cards'))!.value, [{ name: 'Retained card' }], 'The shared card library survives the upgrade');
let reads = 0;
const countRead = (row: any) => {
  reads++;
  return row;
};
db.saves.hook('reading', countRead);
const summaries = await listSaves();
assert.equal(reads, 0, 'League lists must not read full save rows');
assert.deepEqual(
  summaries.map(x => x.id),
  ['old-league', 'spectator'],
);
assert.equal(summaries[0].preview.phase, 'Draft · Pick 2');
assert.equal(summaries[0].preview.season, '2040–41');
assert.equal(summaries[0].preview.team.logoImg, 'custom-image');
assert.equal(summaries[0].preview.team.privateLedger, undefined);
assert.equal(summaries[1].preview.team, undefined);
assert.equal(summaries[1].preview.teamName, 'Spectator league');
assert.equal(summaries[1].preview.managed, 0);
assert(!('data' in summaries[0]));
assert(JSON.stringify(summaries[0]).length < 1000);
assert.deepEqual((await getSave(original.id))!.data, before, 'Old save migration preserves every field and archived game');
assert.deepEqual(data, before, 'Writing a summary never modifies the input save');
const updated = {
  ...original,
  name: 'Updated league',
  updatedAt: 3,
  data: { ...data, state: { ...data.state, season: 2042, phase: 'regular', picks: [] } },
};
await putSave(updated);
const updatedSummary = (await listSaves())[0];
assert.equal(updatedSummary.preview.season, '2041–42');
assert.equal(updatedSummary.preview.phase, 'Regular season');
assert.equal(updatedSummary.name, 'Updated league');
let exported: Blob | undefined;
const oldDoc = globalThis.document,
  oldURL = URL.createObjectURL,
  oldRevoke = URL.revokeObjectURL;
(globalThis as any).document = { createElement: () => ({ click() {} }) };
URL.createObjectURL = value => {
  exported = value as Blob;
  return 'blob:test';
};
URL.revokeObjectURL = () => {};
try {
  await exportSave(summaries[0]); // Deliberately stale preview: export loads the latest full save.
  const json = JSON.parse(await exported!.text());
  assert.equal(json.name, 'Updated league');
  assert.deepEqual(json.data.db.boxes, data.db.boxes);
  assert.deepEqual(json.data.db.P, data.db.P);
  assert(!('$boxKeys' in json.data.db));
} finally {
  (globalThis as any).document = oldDoc;
  URL.createObjectURL = oldURL;
  URL.revokeObjectURL = oldRevoke;
}
const reject = (_key: any, row: any) => {
  if (row.id === 'rollback') throw Error('fixture summary failure');
};
db.saveIndex.hook('creating', reject);
await assert.rejects(putSave({ ...original, id: 'rollback' }), /fixture summary failure/);
assert.equal(await db.saves.get('rollback'), undefined, 'Summary failure rolls back the full save');
assert.equal(await db.boxes.where('saveId').equals('rollback').count(), 0, 'Summary failure rolls back archived games');
assert.equal(await db.saveIndex.get('rollback'), undefined);
db.saveIndex.hook('creating').unsubscribe(reject);
const rejectUpdate = (_mods: any, key: any) => {
  if (key === original.id) throw Error('fixture preview update failure');
};
db.saveIndex.hook('updating', rejectUpdate);
await assert.rejects(
  putSave({ ...updated, data: { ...updated.data, db: { ...updated.data.db, boxes: { replacement: { pts: 99 } } } } }),
  /fixture preview update failure/,
);
const afterFailedUpdate = (await getSave(original.id))!;
assert.deepEqual(afterFailedUpdate.data, updated.data, 'A failed preview update preserves the previous full save and its original games');
assert.equal(await db.boxes.get([original.id, 'replacement']), undefined);
db.saveIndex.hook('updating').unsubscribe(rejectUpdate);

await deleteSave(original.id);
assert.equal(await db.saves.get(original.id), undefined);
assert.equal(await db.saveIndex.get(original.id), undefined);
assert.equal(await db.boxes.where('saveId').equals(original.id).count(), 0);
assert.equal((await listSaves())[0].id, 'spectator', 'Deleting one league preserves another');
db.close();
console.log(
  'PASS: lightweight-only listing, v3 migration, accurate previews, full-data preservation, latest full export, atomic rollback and isolated deletion.',
);

import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import { Game } from '../src/engine/Game';
import { mulberry32 } from '../src/engine/rng';
import { encodeDb, encodeState, decodeDb } from '../src/engine/saveCodec';
import { capturePlayers, playerSignature, SnapshotChanged, bindGameSave, isStaleSave, storageRevision } from '../src/db/playerArchive';
import { protectUnsavedLeave } from '../src/ui/unsavedLeave';

Math.random = mulberry32(10419);
const fixture = Game.create(10419, [0]);
const result = fixture.playGame(fixture.state, 0, 1),
  bid = fixture.keepBox(result, 0);
const input = structuredClone(fixture.toSave());
const row = { id: 'player-save', name: 'Player persistence', createdAt: 1, updatedAt: 1, summary: 'Test', data: input };
// An actual v4 schema, created before the current database is opened. The upgrade
// must add a store without rewriting any existing league or shared card records.
const legacy = new Dexie('front-office');
legacy.version(4).stores({ saves: 'id, updatedAt', meta: 'key', boxes: '[saveId+bid], saveId', saveIndex: 'id, updatedAt' });
await legacy.table('saves').put(row);
await legacy.table('meta').put({ key: 'cards', value: [{ name: 'Retained library card' }] });
legacy.close();
const { db, getSave, putSave, exportSave, importSave, deleteSave, listSaves } = await import('../src/db/saves');
const { createSaveWriter } = await import('../src/db/saveWriter');
await db.open();
assert.equal(db.verno, 5);
assert.deepEqual((await db.saves.get(row.id))!.data, input, 'Schema upgrade leaves the full original row intact');
assert.equal(await db.players.count(), 0, 'No eager migration during the schema upgrade');
assert.equal((await db.meta.get('cards'))!.value[0].name, 'Retained library card');

const opened = (await getSave(row.id, { lazyBoxes: true }))!;
const game = Game.load(opened.data);
bindGameSave(game, opened);
assert.deepEqual((await getSave(row.id))!.data, input, 'First legacy migration preserves the exact full save format');
const originalBox = structuredClone(input.db.boxes[bid]);
const writers: any[] = [];
let writes: string[] = [],
  deletes = 0;
db.players.hook('creating', (_key, record) => {
  writes.push(record.pid);
});
db.players.hook('updating', (_mods, _key, record) => {
  writes.push(record.pid);
});
db.players.hook('deleting', () => {
  deletes++;
});
const writer = createSaveWriter();
writers.push(writer);
const dirty = () => game.setState({ gv: (game.state.gv || 0) + 1 });
async function exact(g = game, id = row.id) {
  const actual = (await getSave(id))!;
  const expected = g.toSave();
  expected.db.boxes = structuredClone(actual.data.db.boxes);
  assert.deepEqual(actual.data, expected, 'Incremental reconstruction exactly matches a full legacy save');
  assert.deepEqual(actual.data.db.boxes[bid], originalBox, 'Detailed game history stays intact');
  return actual;
}
await writer.save(game, row);
assert.equal(writes.length, Object.keys(game.db.P).length, 'First baseline writes complete player records');
const main = (await db.saves.get(row.id))!;
assert.deepEqual(main.data.db.P, {});
assert(!main.data.db.$ret && !main.data.db.$gone, 'No hidden retired/gone player payload remains in the main row');
assert.equal(main.data.db.$playersArchive.keys.length, Object.keys(game.db.P).length);
await exact();
writes = [];
await writer.save(game, row);
assert.equal(writes.length, 0, 'Unchanged players are not rewritten');
game.state.unanticipatedSetting = { array: [1, 2] };
game.db.newWorldFeature = { nested: { value: 8 } };
game.setState({ gv: 8 });
writes = [];
await writer.save(game, row);
assert.equal(writes.length, 0, 'Metadata-only changes do not write player records');
await exact();
const pid = String(game.state.rosters[0][0]),
  player = game.db.P[pid];
const cases: [string, () => void][] = [
  [
    'nested future field',
    () => {
      player.futureFeature = { values: [{ value: 3 }] };
    },
  ],
  [
    'same-object deep edit',
    () => {
      player.futureFeature.values[0].value = 4;
    },
  ],
  [
    'shared graph',
    () => {
      const shared = { value: 8 };
      player.futureFeature = { left: shared, right: shared };
    },
  ],
  [
    'break shared reference',
    () => {
      player.futureFeature.right = { ...player.futureFeature.left };
    },
  ],
  [
    'contract',
    () => {
      player.amt += 0.25;
      player.salary = { ...player.salary, 2045: 4.25 };
    },
  ],
  [
    'history array append',
    () => {
      (player.tx ||= []).push({ k: 'Test', season: game.Y, text: 'Full detail' });
    },
  ],
  [
    'stats',
    () => {
      player.stats = [{ season: game.Y, tid: 0, gp: 1, min: 30, pts: 21, unknownStat: 3 }];
    },
  ],
  [
    'injury',
    () => {
      player.inj = { name: 'Test injury', games: 4, dtd: false, until: 200 };
    },
  ],
  [
    'ratings and ceiling',
    () => {
      player.r.tp += 0.1;
      player.ceil = { ...player.ceil, tp: 81.25 };
    },
  ],
  [
    'face and identity',
    () => {
      player.faceSeed = 23;
      player.name = 'Persistence Test';
      player.nat = 'CA';
    },
  ],
  [
    'property deletion',
    () => {
      delete player.futureFeature.left.value;
    },
  ],
  [
    'explicit undefined',
    () => {
      player.futureFeature.optional = undefined;
    },
  ],
  [
    'undefined deletion',
    () => {
      delete player.futureFeature.optional;
    },
  ],
];
for (const [name, change] of cases) {
  writes = [];
  change(); // Intentionally no dirty notification: comparisons must find content changes.
  await writer.save(game, row);
  assert.deepEqual(writes, [pid], name + ' writes only the changed player');
  await exact();
}
const sigPairs = [
  [{ a: undefined }, {}],
  [[,], [undefined]],
  [NaN, null],
  [-0, 0],
  [Infinity, null],
  [{ x: { a: 1 } }, { x: { a: 2 } }],
];
for (const [a, b] of sigPairs) assert.notEqual(playerSignature(a), playerSignature(b));
const shared = { value: 1 };
assert.notEqual(
  playerSignature({ left: shared, right: shared }),
  playerSignature({ left: { value: 1 }, right: { value: 1 } }),
  'Shared and separate object graphs cannot collide',
);
assert.equal(
  playerSignature({ left: shared, right: shared }),
  playerSignature(structuredClone({ left: shared, right: shared })),
  'Shared graphs have stable exact signatures',
);
for (const value of [new Date(1), new Map([['a', 1]]), { $exactPlayerSignature: 'undefined' }, Object.assign([1], { extra: 2 })])
  assert.equal(playerSignature(value), undefined, 'Exotic values always take a full-record path');
for (const value of [new Date(1), new Map([['a', 1]]), { $exactPlayerSignature: 'undefined' }]) {
  player.futureFeature = { value };
  writes = [];
  await writer.save(game, row);
  await exact();
  writes = [];
  await writer.save(game, row);
  assert.deepEqual(writes, [pid], 'Unsupported comparison values are never silently skipped');
}
delete player.futureFeature;
await writer.save(game, row);

// Preparing a snapshot while a real edit, navigation or season replacement occurs
// must discard that preparation; there must be no partial state/player commit.
let interrupted = false;
await assert.rejects(
  capturePlayers(
    game,
    undefined,
    async () => {
      if (!interrupted) {
        interrupted = true;
        player.amt += 1;
        dirty();
      }
    },
    0,
  ),
  SnapshotChanged,
);
assert(interrupted);
let replaced = false;
await assert.rejects(
  capturePlayers(
    game,
    undefined,
    async () => {
      if (!replaced) {
        replaced = true;
        game.db = { ...game.db, P: { ...game.db.P } };
      }
    },
    0,
  ),
  SnapshotChanged,
);
await writer.save(game, row);
await exact();

// Quota failures must preserve the last complete commit and leave the changed
// player pending for a successful retry.
const beforeQuota = (await getSave(row.id))!,
  quota = () => {
    throw new DOMException('Storage full', 'QuotaExceededError');
  };
db.players.hook('updating', quota);
player.amt += 0.125;
await assert.rejects(writer.save(game, row), error => (error as Error).name === 'QuotaExceededError');
assert.deepEqual((await getSave(row.id))!.data, beforeQuota.data);
db.players.hook('updating').unsubscribe(quota);
await writer.save(game, row);
await exact();

// Roll back after player writes and after replacing archived games. Main state,
// index, players, details and deletion lists must remain at the previous commit.
const snapshotStore = async () => ({
  main: await db.saves.get(row.id),
  index: await db.saveIndex.get(row.id),
  players: await db.players.where('saveId').equals(row.id).toArray(),
  boxes: await db.boxes.where('saveId').equals(row.id).toArray(),
});
const beforeFailure = await snapshotStore();
const fail = () => {
  throw Error('injected final-index failure');
};
db.saveIndex.hook('updating', fail);
player.amt += 2;
game.db.boxes.newGame = { ...structuredClone(originalBox), details: { ...originalBox.details, test: 'uncommitted' } };
dirty();
await assert.rejects(writer.save(game, row), /injected/);
assert.deepEqual(await snapshotStore(), beforeFailure, 'The complete write rolls back atomically');
assert(game.db.boxes.newGame.details, 'Failed saves retain unsaved game details');
db.saveIndex.hook('updating').unsubscribe(fail);
writes = [];
await writer.save(game, row);
assert(writes.includes(pid), 'Failed captures are not acknowledged as saved');
await exact();
delete game.db.boxes.newGame;

const originalWorker = globalThis.Worker;
let pending: any;
class HeldWorker {
  onmessage: any;
  onerror: any;
  onmessageerror: any;
  job: any;
  terminated = false;
  postMessage(job: any) {
    this.job = structuredClone(job);
    pending = this;
  }
  terminate() {
    this.terminated = true;
  }
}
const waitPending = async () => {
  for (let i = 0; i < 2000 && !pending; i++) await new Promise(r => setTimeout(r, 2));
  assert(pending, 'Worker receives a prepared immutable snapshot');
  return pending;
};
const commit = async (job: any) =>
  putSave(
    { ...job.meta, data: { db: encodeDb(job.snapshot.db, job.ratingKeys), state: encodeState(job.snapshot.state) } },
    job.archive,
    job.players,
  );
try {
  (globalThis as any).Worker = HeldWorker;
  const queuedWriter = createSaveWriter();
  writers.push(queuedWriter);
  pending = null;
  const start = queuedWriter.save(game, row);
  let held = await waitPending();
  await commit(held.job);
  held.onmessage({ data: { id: held.job.id, ok: true } });
  await start;
  player.amt += 3;
  dirty();
  pending = null;
  const first = queuedWriter.save(game, row);
  held = await waitPending();
  const capturedAmt = player.amt;
  assert.equal(Object.keys(held.job.snapshot.db.P).length, 0, 'Unchanged player database is not transferred');
  assert.equal(held.job.players.records.length, 1);
  assert.equal(held.job.players.records[0].player.amt, capturedAmt);
  player.amt += 4;
  player.tx.push({ k: 'Test', season: game.Y, text: 'Later edit' });
  const remove = String(game.state.rosters[1].at(-1));
  const newId = String(Math.max(...Object.keys(game.db.P).map(Number)) + 1);
  const added = { ...structuredClone(player), id: +newId, name: 'New snapshot player' };
  delete game.db.P[remove];
  game.db.P[newId] = added;
  game.state.rosters[1] = game.state.rosters[1].filter(id => String(id) !== remove);
  dirty();
  const second = queuedWriter.save(game, row);
  assert.equal(held.job.players.records[0].player.amt, capturedAmt, 'Later edits cannot mutate the pending snapshot');
  await commit(held.job);
  held.onmessage({ data: { id: held.job.id, ok: true } });
  pending = null;
  const savedVersion = await first;
  assert(savedVersion < game.saveVersion, 'First ack cannot acknowledge edits made during writing');
  held = await waitPending();
  assert.deepEqual(new Set(held.job.players.records.map((item: any) => item.pid)), new Set([pid, newId]));
  assert(!held.job.players.keys.includes(remove));
  await commit(held.job);
  held.onmessage({ data: { id: held.job.id, ok: true } });
  await second;
  assert.equal(await db.players.get([row.id, remove]), undefined, 'Removed players are deleted in the same commit');
  assert.equal((await getSave(row.id))!.data.db.$playersArchive, undefined);
  await exact();

  // Commit succeeds but the worker reports failure before the ack: the fallback
  // retries the immutable job idempotently, with no duplicate player writes.
  const lostAck = createSaveWriter();
  writers.push(lostAck);
  pending = null;
  writes = [];
  const lost = lostAck.save(game, row);
  held = await waitPending();
  await commit(held.job);
  const wroteOnce = writes.length;
  held.onerror(new Error('ack lost'));
  await lost;
  assert(held.terminated);
  assert.equal(writes.length, wroteOnce);
  await exact();
  writes = [];
  await lostAck.save(game, row);
  assert.equal(writes.length, 0, 'Lost-ack recovery acknowledges only committed records');
} finally {
  (globalThis as any).Worker = originalWorker;
}

// A hidden/closing tab must be able to release a capture already waiting on the
// host scheduler. Priority returns to normal batching after that queue drains.
const urgentRow = { ...row, id: 'urgent-test', data: fixture.toSave() };
await putSave(urgentRow);
const urgentSource = (await getSave(urgentRow.id))!,
  urgentGame = Game.load(urgentSource.data);
bindGameSave(urgentGame, urgentSource);
const urgentWriter = createSaveWriter();
writers.push(urgentWriter);
const schedulerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'scheduler');
let hostCalls = 0,
  blockHost = true;
const releases: (() => void)[] = [];
Object.defineProperty(globalThis, 'scheduler', {
  configurable: true,
  value: {
    yield: () => {
      hostCalls++;
      return blockHost ? new Promise<void>(resolve => releases.push(resolve)) : Promise.resolve();
    },
  },
});
try {
  const urgentSave = urgentWriter.save(urgentGame, urgentRow);
  for (let i = 0; i < 1000 && !hostCalls; i++) await new Promise(r => setTimeout(r, 2));
  assert(hostCalls);
  urgentWriter.expedite();
  await urgentSave;
  const before = hostCalls;
  const ordinary = urgentWriter.save(urgentGame, urgentRow);
  for (let i = 0; i < 1000 && hostCalls === before; i++) await new Promise(r => setTimeout(r, 2));
  assert(hostCalls > before, 'Urgent mode must not make future background saves synchronous');
  blockHost = false;
  releases.forEach(release => release());
  await ordinary;
} finally {
  if (schedulerDescriptor) Object.defineProperty(globalThis, 'scheduler', schedulerDescriptor);
  else delete (globalThis as any).scheduler;
}
await deleteSave(urgentRow.id);
const leaveTarget = new EventTarget();
let saved = false,
  flushes = 0;
const removeGuard = protectUnsavedLeave(
  leaveTarget as any,
  game,
  () => saved,
  () => {
    flushes++;
  },
);
let leave = new Event('beforeunload', { cancelable: true });
leaveTarget.dispatchEvent(leave);
assert(leave.defaultPrevented);
assert.equal(flushes, 1);
saved = true;
leave = new Event('beforeunload', { cancelable: true });
leaveTarget.dispatchEvent(leave);
assert(!leave.defaultPrevented);
game.busy = true;
leave = new Event('beforeunload', { cancelable: true });
leaveTarget.dispatchEvent(leave);
assert(leave.defaultPrevented);
game.busy = false;
removeGuard();

// Separate sessions are leases on the revision they actually opened. A stale
// save cannot overwrite a newer session, even by falling back to the full path.
const aRow = (await getSave(row.id, { lazyBoxes: true }))!,
  bRow = (await getSave(row.id, { lazyBoxes: true }))!;
const a = Game.load(aRow.data),
  b = Game.load(bRow.data);
bindGameSave(a, aRow);
bindGameSave(b, bRow);
const wa = createSaveWriter(),
  wb = createSaveWriter();
writers.push(wa, wb);
a.db.P[pid].amt += 7;
a.setState({ gv: 91 });
await wa.save(a, row);
const latest = await snapshotStore();
b.db.P[pid].amt += 99;
b.setState({ gv: 92 });
await assert.rejects(wb.save(b, row), isStaleSave);
assert.deepEqual(await snapshotStore(), latest, 'Stale-session rejection leaves every stored table untouched');

// A manifest cannot fabricate absent player records, and incomplete file imports
// cannot replace complete stored leagues. All exports stay standalone v1 files.
const badData = encodeDb({ ...a.saveSnapshot().db, P: {}, boxes: {} }, []);
await assert.rejects(
  putSave({ ...row, data: { db: badData, state: a.toSave().state } }, undefined, {
    keys: ['missing-player'],
    records: [],
    expectedRevision: (await db.saves.get(row.id))!.data.db.$playersArchive.revision,
    revision: storageRevision(),
  }),
  /complete player snapshot/,
);
assert.deepEqual(await snapshotStore(), latest);
await assert.rejects(
  importSave(new File([JSON.stringify({ kind: 'front-office-save', version: 1, data: latest.main!.data })], 'incomplete.json')),
  /missing player records/,
);
const doc = globalThis.document,
  url = URL.createObjectURL,
  revoke = URL.revokeObjectURL;
let blob: Blob;
(globalThis as any).document = { createElement: () => ({ click() {} }) };
URL.createObjectURL = x => {
  blob = x as Blob;
  return 'blob:test';
};
URL.revokeObjectURL = () => {};
try {
  const preview = (await listSaves()).find(item => item.id === row.id)!;
  await exportSave(preview);
  const exported = JSON.parse(await blob!.text());
  assert(!exported.data.db.$playersArchive && !exported.data.db.$boxKeys);
  assert.equal(Object.keys(decodeDb(exported.data.db).P).length, Object.keys(a.db.P).length);
  assert.deepEqual(exported.data.db.boxes[bid], originalBox);
  const imported = await importSave(new File([JSON.stringify(exported)], 'complete.json'));
  assert.deepEqual((await getSave(imported.id))!.data, exported.data, 'Full player/game exports reimport exactly');
  await deleteSave(imported.id);
  assert.equal(await db.players.where('saveId').equals(imported.id).count(), 0);
} finally {
  (globalThis as any).document = doc;
  URL.createObjectURL = url;
  URL.revokeObjectURL = revoke;
}

// Missing/corrupted archived players fail explicitly; never open an incomplete
// league or silently publish an export missing a player.
const record = await db.players.get([row.id, pid]);
await db.players.delete([row.id, pid]);
await assert.rejects(getSave(row.id), /incomplete/);
await db.players.put(record!);
assert.deepEqual(await snapshotStore(), latest);
for (const item of writers) await item.dispose();
await deleteSave(row.id);
assert.equal(await db.players.count(), 0);
assert.equal(await db.boxes.count(), 0);
assert.equal((await db.meta.get('cards'))!.value[0].name, 'Retained library card');
db.close();
console.log(
  'PASS: v4 upgrade, exact full-save reconstruction, deep/direct edits, special values, migration, zero/one-record writes, rollback, capture restarts, in-flight edits/deletes/additions, queued writes, lost-ack fallback, stale sessions, manifests, export/import, archive integrity and deletion',
);

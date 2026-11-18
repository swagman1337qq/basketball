import assert from 'node:assert/strict';
import { Worker as ThreadWorker } from 'node:worker_threads';
import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/engine/Game';
import { capturePlayers, storageRevision } from '../src/db/playerArchive';
import { planBoxArchive } from '../src/db/boxArchive';
import { RATING_KEYS } from '../src/data/world';
import { mulberry32 } from '../src/engine/rng';

await mkdir('.review', { recursive: true });
const dir = await mkdtemp(resolve('.review/player-worker-'));
let implementation = pathToFileURL(resolve('src/db/saveWorker.ts')).href;
if (process.argv.includes('--production')) {
  const asset = (await readdir('dist/assets')).find(name => /^saveWorker-.*\.js$/.test(name));
  assert(asset);
  implementation = pathToFileURL(resolve('dist/assets/' + asset)).href;
}
const runner = `import 'fake-indexeddb/auto';
import {parentPort} from 'node:worker_threads';
import Dexie from 'dexie';
globalThis.self=globalThis;
globalThis.postMessage=message=>parentPort.postMessage(message);
Dexie.dependencies.indexedDB=globalThis.indexedDB;Dexie.dependencies.IDBKeyRange=globalThis.IDBKeyRange;
const {db,getSave}=await import('../../src/db/saves');
let queue=Promise.resolve();
parentPort.on('message',message=>{queue=queue.then(async()=>{
 if(message.probe){parentPort.postMessage({id:message.id,probe:true,row:await getSave(message.saveId)});return;}
 await self.onmessage({data:message});
}).catch(error=>parentPort.postMessage({id:message.id,runnerError:String(error.stack)}));});
await import(${JSON.stringify(implementation)});
parentPort.postMessage({ready:true});`;
await writeFile(dir + '/runner.ts', runner);
// Bundle source imports into the Node runner. A production worker is imported
// untouched, exercising Vite's actual emitted worker with a real thread/IDB.
await build({
  entryPoints: [dir + '/runner.ts'],
  outfile: dir + '/runner.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  plugins: [
    {
      name: 'source-url',
      setup(b) {
        b.onResolve({ filter: /^file:.*saveWorker\.ts$/ }, () => ({ path: resolve('src/db/saveWorker.ts') }));
      },
    },
  ],
});
const worker = new ThreadWorker(pathToFileURL(dir + '/runner.mjs'));
const waiting = new Map<number, { resolve: (x: any) => void; reject: (x: any) => void }>();
let readyResolve: () => void;
const ready = new Promise<void>(resolve => {
  readyResolve = resolve;
});
worker.on('message', message => {
  if (message.ready) {
    readyResolve();
    return;
  }
  const entry = waiting.get(message.id);
  if (!entry) return;
  waiting.delete(message.id);
  if (message.runnerError) entry.reject(Error(message.runnerError));
  else entry.resolve(message);
});
worker.on('error', error => {
  for (const entry of waiting.values()) entry.reject(error);
});
const send = (message: any) =>
  new Promise<any>((resolve, reject) => {
    waiting.set(message.id, { resolve, reject });
    worker.postMessage(message);
  });
try {
  await ready;
  Math.random = mulberry32(7149);
  const game = Game.create(7149, [0]);
  game.db.boxes = { one: { home: { pts: 101 }, away: { pts: 99 }, details: { pbp: ['Full record'], shots: [1], stints: [2] } } };
  const meta = { id: 'real-worker', name: 'Real worker', createdAt: 1, updatedAt: 1, summary: 'Test' };
  const first = await capturePlayers(game);
  const archive = planBoxArchive(meta.id, game.db.boxes);
  const job = {
    id: 1,
    meta,
    snapshot: first.snapshot,
    ratingKeys: RATING_KEYS,
    archive: { keys: archive.keys, records: archive.records, references: archive.references },
    players: { keys: first.keys, records: first.records, expectedRevision: null, revision: storageRevision() },
  };
  const expected = structuredClone(game.toSave());
  assert.deepEqual(await send(job), { id: 1, ok: true });
  archive.acknowledge();
  assert.deepEqual((await send({ id: 101, probe: true, saveId: meta.id })).row.data, expected);
  const pid = String(game.state.rosters[0][0]);
  game.db.P[pid].amt += 2;
  game.db.P[pid].newNestedFeature = { array: [{ value: 22 }] };
  game.setState({ gv: 1 });
  const second = await capturePlayers(game, first);
  assert.equal(second.records.length, 1);
  const nextArchive = planBoxArchive(meta.id, game.db.boxes);
  const next = {
    ...job,
    id: 2,
    snapshot: second.snapshot,
    archive: { keys: nextArchive.keys, records: nextArchive.records, references: nextArchive.references },
    players: { keys: second.keys, records: second.records, expectedRevision: job.players.revision, revision: storageRevision() },
  };
  assert.deepEqual(await send(next), { id: 2, ok: true });
  const latest = (await send({ id: 102, probe: true, saveId: meta.id })).row;
  assert.deepEqual(latest.data, game.toSave(), 'Actual worker round-trip matches a complete foreground save');
  const stale = await send({ ...job, id: 3 });
  assert.equal(stale.ok, false);
  assert.equal(stale.stale, true);
  const incomplete = await send({
    ...next,
    id: 4,
    players: { keys: ['not-in-archive'], records: [], expectedRevision: next.players.revision, revision: storageRevision() },
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.error, /complete player snapshot/);
  assert.deepEqual((await send({ id: 103, probe: true, saveId: meta.id })).row, latest, 'Worker errors cannot alter committed data');
  console.log(
    'PASS: real ' +
      (process.argv.includes('--production') ? 'production' : 'source') +
      ' save worker, full/one-player payloads, exact codec parity, stale-session signaling and incomplete-write rollback',
  );
} finally {
  await worker.terminate();
}

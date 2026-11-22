import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/engine/Game';
import { SimulationBrowse } from '../src/ui/simulationBrowse';
import { BrowseCopyWarmup, type BrowseIdleScheduler } from '../src/ui/simulationBrowseIdle';
import { copyIdleBrowseDb } from '../src/ui/simulationBrowseIdleCopy';
import { mulberry32 } from '../src/engine/rng';
import { newLeague, clr } from './lib/headless.mts';

const immediate = () => new Promise<void>(done => setImmediate(done));
function idleQueue() {
  const tasks = new Map<number, () => void>();
  let seq = 0;
  const schedule: BrowseIdleScheduler = run => {
    const id = ++seq;
    tasks.set(id, run);
    return () => {
      tasks.delete(id);
    };
  };
  const tick = async () => {
    const first = tasks.entries().next().value;
    if (first) {
      tasks.delete(first[0]);
      first[1]();
    }
    await immediate();
  };
  const drain = async () => {
    for (let n = 0; n < 10000; n++) {
      await tick();
      if (!tasks.size) {
        await immediate();
        if (!tasks.size) return;
      }
    }
    throw Error('Idle work did not settle');
  };
  return { tasks, schedule, tick, drain };
}
const hash = (v: any) =>
  createHash('sha256')
    .update(JSON.stringify(v, (_k, x) => (typeof x === 'string' ? x.replace(/n1800000000000-\d+/g, 'notice-id') : x)))
    .digest('hex');
const random = Math.random,
  now = Date.now,
  scheduler = Object.getOwnPropertyDescriptor(globalThis, 'scheduler');
try {
  Date.now = () => 1800000000000;
  const q = idleQueue(),
    warm = new BrowseCopyWarmup(q.schedule),
    db: any = { P: {}, boxes: {}, rapm: {} };
  for (let id = 0; id < 1800; id++)
    db.P[id] = { id, stats: Array.from({ length: 30 }, (_, season) => ({ season, gp: 82, pts: id + season })) };
  let ready: any,
    accepts = 0,
    valid = true;
  const accept = (x: any) => {
    ready = x;
    accepts++;
  };
  Math.random = () => {
    throw Error('Idle preparation must not consume randomness');
  };
  const before = hash(db);
  warm.start(db, 1, undefined, () => valid, accept);
  assert.equal(q.tasks.size, 1);
  assert.equal(accepts, 0, 'No work until the host is idle');
  await q.drain();
  assert.equal(accepts, 1);
  assert.deepEqual(ready, db);
  assert.equal(hash(db), before);
  warm.start(db, 2, ready, () => valid, accept);
  warm.stop();
  assert.equal(q.tasks.size, 0);
  await q.drain();
  assert.equal(accepts, 1, 'Cancellation never publishes a partial copy');
  warm.start(db, 3, undefined, () => valid, accept);
  await q.tick();
  assert.equal(q.tasks.size, 1, 'Long copies wait for another idle slot');
  valid = false;
  await q.drain();
  assert.equal(accepts, 1);
  const unsupported = new BrowseCopyWarmup(() => undefined);
  unsupported.start(db, 1, undefined, () => true, accept);
  await immediate();
  assert.equal(accepts, 1);
  valid = true;
  warm.start({ P: { 1: { notCloneable() {} } } }, 4, undefined, () => true, accept);
  await q.drain();
  assert.equal(accepts, 1, 'Speculative copy failures do not escape');
  warm.stop();
  unsupported.stop();
  const brokenCancel = new BrowseCopyWarmup(() => () => {
    throw Error('Host cancellation failed');
  });
  brokenCancel.start(db, 1, undefined, () => true, accept);
  assert.doesNotThrow(() => brokenCancel.stop());
  await immediate();
  assert.equal(accepts, 1);
  const shared: any = { number: -0, missing: undefined, sparse: [, undefined, NaN, Infinity] };
  const metadata: any = { a: shared, b: shared };
  metadata.self = metadata;
  Object.defineProperty(metadata, '__proto__', { value: { marker: 3 }, enumerable: true });
  const graph = await copyIdleBrowseDb({ P: {}, boxes: {}, metadata }, undefined, immediate, () => false);
  assert.deepEqual(graph.metadata, structuredClone(metadata));
  assert.equal(graph.metadata.a, graph.metadata.b);
  assert.equal(graph.metadata.self, graph.metadata);
  assert.equal(Object.getPrototypeOf(graph.metadata), Object.prototype);
  let getterCalls = 0;
  await assert.rejects(
    copyIdleBrowseDb(
      {
        P: {},
        boxes: {},
        metadata: {
          get unsupported() {
            getterCalls++;
            return 1;
          },
        },
      },
      undefined,
      immediate,
      () => false,
    ),
  );
  assert.equal(getterCalls, 0, 'Idle copying does not run custom accessors');
  console.log(
    'PASS: actual-idle scheduling, bounded slices, cancellation, source invalidation, unsupported hosts and failed speculative copies',
  );

  const fixture = newLeague(1927);
  fixture.enterSpectator();
  clr(fixture);
  fixture.setState(fixture.simDay(fixture.state, undefined, 0));
  clr(fixture);
  const data = fixture.toSave(),
    results: any[] = [];
  for (const warming of [false, true]) {
    Math.random = mulberry32(2193);
    const g = Game.load(structuredClone(data)),
      queue = idleQueue();
    const reader = new SimulationBrowse(g, () => {}, immediate, warming ? queue.schedule : () => undefined);
    const disconnect = reader.connect(),
      pid = g.state.rosters[0][0];
    const rng = mulberry32(39145);
    let draws = 0,
      checked = false,
      failure: unknown;
    Math.random = () => {
      draws++;
      return rng();
    };
    const untouched = hash(g.toSave());
    await queue.drain();
    assert.equal(hash(g.toSave()), untouched);
    assert.equal(draws, 0);
    g.setState({ screen: 'roster' });
    assert.equal(queue.tasks.size, 0, 'Navigation does not rebuild a finished copy');
    // Deliberately omit notification: preparation must still compare content.
    g.db.P[pid].stats[0].pts += 9;
    const expected = structuredClone(g.db);
    Object.defineProperty(globalThis, 'scheduler', {
      configurable: true,
      value: {
        yield: async () => {
          try {
            if (g.dayInProgress && !checked) {
              checked = true;
              assert.equal(queue.tasks.size, 0, 'No speculative work competes with the simulator');
              assert.deepEqual(reader.view!.db, expected, 'Even an unannounced in-place edit replaces stale prepared values');
            }
          } catch (error) {
            failure = error;
            g.stopSim();
          }
          await immediate();
        },
      },
    });
    await g.sim(2);
    if (failure) throw failure;
    assert(checked);
    results.push({ save: hash(g.toSave()), draws });
    disconnect();
    assert.equal(queue.tasks.size, 0);
    await queue.drain();
  }
  assert.deepEqual(results[1], results[0], 'Warming changes no current stats, saved data or simulation randomness');
  console.log(
    'PASS: prepared/unprepared real simulations match completely, unannounced edits refresh, simulation cancels idle work and disconnect releases tasks',
  );
} finally {
  Math.random = random;
  Date.now = now;
  if (scheduler) Object.defineProperty(globalThis, 'scheduler', scheduler);
  else delete (globalThis as any).scheduler;
}

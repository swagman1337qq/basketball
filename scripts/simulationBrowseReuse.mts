import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/engine/Game';
import { mulberry32 } from '../src/engine/rng';
import { SimulationBrowse } from '../src/ui/simulationBrowse';
import { copyBrowseDb, sameBrowseRecord } from '../src/ui/simulationBrowseCopy';
import { newLeague, clr } from './lib/headless.mts';

const immediate = () => new Promise<void>(done => setImmediate(done));
const random = Math.random,
  now = Date.now,
  scheduler = Object.getOwnPropertyDescriptor(globalThis, 'scheduler');
const hash = (value: any) =>
  createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => (typeof v === 'string' ? v.replace(/n1800000000000-\d+/g, 'notice-id') : v)))
    .digest('hex');
try {
  Date.now = () => 1800000000000;
  const values = [undefined, null, NaN, -0, { a: [undefined, , 3], b: NaN }, new Date(0), new Map([[1, 2]])];
  for (const value of values) {
    const old = structuredClone(value);
    if (sameBrowseRecord(value, old)) assert.deepEqual(value, old);
  }
  assert(!sameBrowseRecord(-0, 0));
  assert(!sameBrowseRecord([undefined], [,]));
  assert(!sameBrowseRecord(new Date(0), new Date(1)));
  assert(!sameBrowseRecord({ a: 1, b: 2 }, { b: 2, a: 1 }), 'Iteration order is preserved');
  const shared = { n: 1 },
    aliased = { a: shared, b: shared };
  assert(sameBrowseRecord(aliased, structuredClone(aliased)));
  assert(!sameBrowseRecord(aliased, { a: { n: 1 }, b: { n: 1 } }));
  assert(!sameBrowseRecord({ a: { n: 1 }, b: { n: 1 } }, structuredClone(aliased)));
  const cycle: any = { a: 2 };
  cycle.self = cycle;
  assert(sameBrowseRecord(cycle, structuredClone(cycle)));
  assert(!sameBrowseRecord(cycle, cycle), 'Live objects are never reused');

  const source: any = {
    P: { 1: { stats: [{ gp: 1, pts: 2 }], ratings: [1, 2] }, 2: { name: 'Unchanged' } },
    rapm: { 2041: { a: [1, 2] } },
    boxes: { b: { score: [1, 2] } },
    days: [[1, 2]],
    custom: new Date(0),
  };
  const first = await copyBrowseDb(source, undefined, immediate);
  assert.notEqual(first.P[1], source.P[1]);
  assert.equal(first.boxes.b, source.boxes.b);
  const again = await copyBrowseDb(source, first, immediate);
  assert.equal(again.P[1], first.P[1]);
  assert.equal(again.P[2], first.P[2]);
  assert.equal(again.days, first.days);
  assert.notEqual(again.custom, first.custom, 'Unusual objects are copied conservatively');
  source.P[1].stats[0].pts++;
  source.rapm[2041].a[1]++;
  source.custom.setTime(3);
  source.P[3] = { name: 'Added' };
  delete source.P[2];
  source.days.reverse();
  const edited = await copyBrowseDb(source, again, immediate);
  assert.deepEqual(edited, source);
  assert.notEqual(edited.P[1], again.P[1], 'In-place edits with unchanged game counts are copied');
  assert.notEqual(edited.rapm[2041], again.rapm[2041]);
  assert(!('2' in edited.P));
  assert.equal(await copyBrowseDb(source, edited, immediate, () => true), null);
  console.log('PASS: complete comparisons, cycles, aliases, numeric edge cases, insertions, removals and in-place changes');

  const fixture = newLeague(915);
  fixture.enterSpectator();
  clr(fixture);
  const data = fixture.toSave(),
    results: any[] = [];
  for (const browsing of [false, true]) {
    Math.random = mulberry32(19041);
    const g = Game.load(structuredClone(data)),
      reader = new SimulationBrowse(g, () => {}, immediate);
    const disconnect = browsing ? reader.connect() : () => {};
    const rng = mulberry32(3729);
    let draws = 0,
      sampled = false,
      expected: any,
      oldView: any,
      failure: unknown;
    Math.random = () => {
      draws++;
      return rng();
    };
    Object.defineProperty(globalThis, 'scheduler', {
      configurable: true,
      value: {
        yield: async () => {
          try {
            if (browsing && g.dayInProgress && !sampled) {
              sampled = true;
              assert.deepEqual(reader.view!.db, expected, 'Every browsing record equals the completed pre-run database');
              assert.notEqual(reader.view!.db, g.db);
              const before = hash({ db: g.db, state: g.state });
              assert.throws(() => reader.view!.toSave(), /cannot be saved/);
              if (oldView) {
                const screen = reader.view!.state.screen;
                oldView.setState({ screen: 'trade' });
                assert.equal(reader.view!.state.screen, screen);
              }
              oldView = reader.view;
              assert.equal(before, hash({ db: g.db, state: g.state }));
            }
          } catch (e) {
            failure = e;
            g.stopSim();
          }
          await immediate();
        },
      },
    });
    for (let run = 0; run < 3; run++) {
      const pid = g.state.rosters[0][0];
      if (run === 1) {
        const p = g.db.P[pid];
        p.r[Object.keys(p.r)[0]] += 1;
        if (p.stats.length) p.stats[0].pts += 3;
        g.setState({ gv: (g.state.gv || 0) + 1 });
      }
      if (run === 2) {
        g.db = structuredClone(g.db);
        g.setState({ gv: (g.state.gv || 0) + 1 });
      }
      expected = structuredClone(g.db);
      sampled = false;
      await g.sim(2);
      if (failure) throw failure;
      if (browsing) assert(sampled);
      assert.equal(reader.view, null);
      clr(g);
    }
    results.push({ save: hash(g.toSave()), draws });
    disconnect();
  }
  assert.deepEqual(results[1], results[0], 'Repeated runs preserve every saved field and random draw');

  Math.random = mulberry32(19041);
  const changing = Game.load(structuredClone(data));
  let changed = false,
    unsafe = false;
  const reader = new SimulationBrowse(
    changing,
    () => {},
    async () => {
      if (!changed) {
        changed = true;
        changing.setState({ gv: (changing.state.gv || 0) + 1 });
      }
      await immediate();
    },
  );
  const disconnect = reader.connect();
  Object.defineProperty(globalThis, 'scheduler', {
    configurable: true,
    value: {
      yield: async () => {
        if (changing.dayInProgress && reader.view) unsafe = true;
        await immediate();
      },
    },
  });
  await changing.sim(1);
  disconnect();
  assert(changed);
  assert(!unsafe, 'A source change during preparation falls back to the input lock');
  console.log(
    'PASS: repeated real simulations, edits between runs, database replacement, late handlers, complete-save/RNG parity and changed-source fallback',
  );
} finally {
  Math.random = random;
  Date.now = now;
  if (scheduler) Object.defineProperty(globalThis, 'scheduler', scheduler);
  else delete (globalThis as any).scheduler;
}

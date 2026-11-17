import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Game } from '../src/engine/Game';
import { GameSim, blankLine } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
import { runCooperatively, yieldToBrowser } from '../src/engine/cooperative';
import { allStarDay, runAllStar } from '../src/engine/allStar';
import { createSaveWriter } from '../src/db/saveWriter';
import { db, getSave } from '../src/db/saves';
import { SimulationGuard } from '../src/ui/SimulationGuard';
import { newLeague } from './lib/headless.mts';

const originalRandom = Math.random,
  originalNow = Date.now;
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'scheduler');
Date.now = () => 1800000000000;
const immediate = () => new Promise<void>(resolve => setImmediate(resolve));
// Notice IDs include a process-global counter. Normalize only those IDs, retaining
// their reference graph; compare every other saved field and random draw exactly.
function hash(value: any) {
  const ids = new Map<string, string>();
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_k, v) =>
        typeof v === 'string'
          ? v.replace(/n1800000000000-\d+/g, id => {
              if (!ids.has(id)) ids.set(id, 'notice-' + ids.size);
              return ids.get(id)!;
            })
          : v,
      ),
    )
    .digest('hex');
}
function load(data: any) {
  Math.random = mulberry32(55191);
  return Game.load(structuredClone(data));
}
function random(seed: number) {
  const rnd = mulberry32(seed);
  let count = 0;
  Math.random = () => {
    count++;
    return rnd();
  };
  return () => count;
}
// The original whole-day driver's checks and commit order, before cooperative work.
async function originalDriver(g: any, n: number, forced?: any) {
  if (g.busy || g.state.phase !== 'regular' || g.mailWaiting() || !g.canPlay()) return;
  g.busy = true;
  g.quiet = n > 1;
  g.stopReq = false;
  try {
    for (let i = 0; i < n; i++) {
      if (g.stopReq) break;
      const v = g.version,
        mail0 = g.state.mailSeq || 0;
      g.setState((s: any) => g.simDay(s, i === 0 ? forced : undefined, n - i - 1));
      if (g.version === v) break;
      if ((g.state.mailSeq || 0) > mail0 && g.mailWaiting()) break;
      if (!(g.state.allStars || {})[g.Y] && g.state.day >= allStarDay(g)) runAllStar(g);
      if (i < n - 1) await immediate();
    }
  } finally {
    g.busy = false;
    g.flushEmit();
    if (g.state.simming) g.setState({ simming: null });
  }
}

try {
  const fixture = newLeague(919);
  fixture.state.mailRead = fixture.state.mailSeq || 0;
  const snapshot = fixture.toSave();
  const modes = ['normal', 'mail', 'forced', 'god', 'fullCCP', 'monthly', 'allStar', 'final', 'noGames', 'legacyCalendar'];
  let compared = 0;
  for (const mode of modes) {
    const a = load(snapshot),
      b = load(snapshot);
    if (mode === 'mail') {
      const notice = { id: 'simulation-mail-stop', tone: 'info', title: 'Test incoming offer', lines: ['Test'] };
      const day = a.simDay.bind(a),
        steps = b.simDaySteps.bind(b);
      a.simDay = (s, forced, left) => {
        const patch = day(s, forced, left);
        return patch && { ...patch, notices: [notice] };
      };
      b.simDaySteps = function* (s, forced, left) {
        const patch = yield* steps(s, forced, left);
        return patch && { ...patch, notices: [notice] };
      };
    }
    const day =
      mode === 'monthly'
        ? a.db.days.findIndex((_: any, d: number) => d > 0 && a.dateOf(d).getMonth() !== a.dateOf(d - 1).getMonth())
        : mode === 'allStar'
          ? allStarDay(a) - 1
          : mode === 'final'
            ? a.db.days.length - 1
            : mode === 'noGames'
              ? a.db.days.findIndex((xs: any[]) => !xs.length)
              : 0;
    a.state.day = b.state.day = day;
    if (mode === 'allStar')
      for (const g of [a, b]) {
        for (const [tid, ids] of Object.entries(g.state.rosters) as [string, number[]][])
          for (const id of ids)
            g.db.P[id].stats = [
              { ...blankLine(), season: g.Y, tid: +tid, gp: 20, min: 600, pts: 300, fgm: 100, fga: 220, ast: 70, drb: 80 },
            ];
      }
    if (day >= allStarDay(a) && mode !== 'allStar')
      a.state.allStars = b.state.allStars = { [a.Y]: { East: { starters: [], reserves: [] }, West: { starters: [], reserves: [] } } };
    if (mode === 'fullCCP') a.state.ccpFull = b.state.ccpFull = true;
    if (mode === 'legacyCalendar') {
      delete a.db.calendarV;
      delete b.db.calendarV;
    }
    const match = a.db.days[day][0];
    if (mode === 'god') a.state.godWin = b.state.godWin = { [a.Y + ':' + day + ':' + match[0] + ':' + match[1]]: match[1] };
    random(17419);
    const forced = mode === 'forced' ? a.playGame(a.state, match[0], match[1]) : undefined;
    const countA = random(5119 + day);
    const days = mode === 'normal' ? 4 : mode === 'mail' ? 10 : 1;
    await originalDriver(a, days, forced && structuredClone(forced));
    const calls = countA(),
      expected = hash(a.toSave());
    let pauses = 0;
    Object.defineProperty(globalThis, 'scheduler', {
      configurable: true,
      value: {
        yield: async () => {
          pauses++;
          await immediate();
        },
      },
    });
    const countB = random(5119 + day);
    await b.sim(days, forced && structuredClone(forced));
    assert.equal(countB(), calls, mode + ': identical random consumption');
    assert.equal(hash(b.toSave()), expected, mode + ': complete league data unchanged');
    assert.ok(pauses > 0, 'Host receives control');
    assert.equal(b.busy, false);
    assert.equal(b.dayInProgress, false);
    if (mode === 'mail') {
      assert.equal(b.state.day, 1);
      assert.ok(b.mailWaiting());
    }
    compared++;
  }

  // GameSim's original step/run contract: full recorded details, overtime and RNG.
  for (const seed of [11, 37, 909]) {
    random(seed);
    const teams = [fixture.simTeam(fixture.state, 0), fixture.simTeam(fixture.state, 1)];
    const ca = random(seed),
      a = new GameSim(...(structuredClone(teams) as any), { record: true, norms: fixture.db.norms }).run(),
      calls = ca();
    const cb = random(seed),
      steps = new GameSim(...(structuredClone(teams) as any), { record: true, norms: fixture.db.norms }).runSteps();
    let pauses = 0;
    const b = await runCooperatively(
      steps,
      async () => {
        pauses++;
        await immediate();
      },
      0,
    );
    assert.equal(cb(), calls);
    assert.deepEqual(b, a);
    assert.ok(pauses > 0);
  }

  // Queue saving while a day is partly applied. No updater, second simulation or
  // snapshot may see/persist a partial day; Stop commits exactly one complete day.
  const g = load(snapshot),
    expected = load(snapshot);
  random(712);
  await originalDriver(expected, 1);
  const expectedHash = hash(expected.toSave());
  let attempted = false,
    updaterCalled = false,
    wrote = false,
    saving: Promise<number> | undefined;
  let changedSnapshots = 0;
  const rawSnapshot = g.saveSnapshot.bind(g);
  g.saveSnapshot = () => {
    changedSnapshots++;
    return rawSnapshot();
  };
  const writer = createSaveWriter();
  Object.defineProperty(globalThis, 'scheduler', {
    configurable: true,
    value: {
      yield: async () => {
        if (g.dayInProgress && !attempted) {
          attempted = true;
          assert.equal(g.state.day, 0, 'Unfinished day is not published');
          assert.throws(() => g.toSave(), /Finish the simulation day/);
          changedSnapshots = 0;
          g.setState(() => {
            updaterCalled = true;
            return { phase: 'draft' };
          });
          await g.sim(50);
          saving = writer.save(g, { id: 'yield-safety', name: 'Test', createdAt: 1 });
          void saving.then(() => {
            wrote = true;
          });
          await immediate();
          assert.equal(changedSnapshots, 0, 'Writer waits before cloning an unfinished day');
          assert.equal(wrote, false);
          assert.equal(updaterCalled, false);
          const markup = renderToStaticMarkup(createElement(SimulationGuard, { game: g }, createElement('button', null, 'Trade')));
          assert.match(markup, /inert=""/);
          assert.match(markup, /data-simulation-stop/);
          g.stopSim();
        }
        await immediate();
      },
    },
  });
  random(712);
  await g.sim(20);
  assert.ok(attempted);
  await saving;
  assert.equal(g.state.day, 1);
  assert.equal(g.busy, false);
  assert.equal(g.dayInProgress, false);
  const saved = (await getSave('yield-safety'))!;
  assert.equal(hash(saved.data), expectedHash, 'Saved result is the whole original day');
  const live = g.toSave();
  assert.equal(
    hash({ ...live, db: { ...live.db, boxes: saved.data.db.boxes } }),
    expectedHash,
    'Live player/state data matches the complete day after save compaction',
  );
  assert.equal(Object.keys(saved.data.db.boxes).length, g.db.days[0].length);
  await writer.dispose();

  // Immediate Stop does not start a day. Idle notifications do not dirty saves.
  const stopEarly = load(snapshot),
    before = hash(stopEarly.toSave());
  const busyEvents: boolean[] = [];
  stopEarly.subscribeSimulation(() => {
    busyEvents.push(stopEarly.busy);
    if (stopEarly.busy) stopEarly.stopSim();
  });
  await stopEarly.sim(10);
  assert.deepEqual(busyEvents, [true, false]);
  assert.equal(hash(stopEarly.toSave()), before);

  // Host scheduling failures fall back to a real task without consuming RNG.
  Object.defineProperty(globalThis, 'scheduler', {
    configurable: true,
    value: { yield: () => Promise.reject(new Error('host unavailable')) },
  });
  const count = random(7);
  await yieldToBrowser();
  assert.equal(count(), 0);
  const channelDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MessageChannel');
  try {
    Object.defineProperty(globalThis, 'MessageChannel', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('channel unavailable');
        }
      },
    });
    await yieldToBrowser();
    assert.equal(count(), 0);
  } finally {
    if (channelDescriptor) Object.defineProperty(globalThis, 'MessageChannel', channelDescriptor);
    else delete (globalThis as any).MessageChannel;
  }
  console.log(
    `PASS: ${compared} driver scenarios, exact recorded games/RNG, mid-day Stop/save/edit isolation, host fallback and inert controls`,
  );
} finally {
  Math.random = originalRandom;
  Date.now = originalNow;
  if (descriptor) Object.defineProperty(globalThis, 'scheduler', descriptor);
  else delete (globalThis as any).scheduler;
  db.close();
}

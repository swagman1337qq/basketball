// Navigation must not touch the mutable day, consume game randomness, or change
// any saved league data. Bundle UI reads with their normal asset loaders too.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

await mkdir('.review', { recursive: true });
const directory = await mkdtemp(resolve('.review/simulation-browse-'));
assert(directory.startsWith(resolve('.review') + sep), 'Temporary test files stay inside the workspace review directory');
const originalRandom = Math.random,
  originalNow = Date.now,
  scheduler = Object.getOwnPropertyDescriptor(globalThis, 'scheduler'),
  storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const immediate = () => new Promise<void>(done => setImmediate(done));
const cursor = [
  'screen',
  'modal',
  'pid',
  'ptab',
  'ptabHist',
  'pageStack',
  'teamModal',
  'listModal',
  'boxId',
  'boxTeam',
  'q',
  'rosterAt',
  'rosterView',
  'rosterSub',
  'showJson',
  'baseY',
  'navTick',
  'awardsYear',
  'stand',
  'navCollapsed',
];
function hash(value: any) {
  const ids = new Map<string, string>();
  return createHash('sha256')
    .update(
      JSON.stringify({ value }, (_key, v) =>
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
function withoutCursor(game: any) {
  const saved = game.toSave();
  for (const key of cursor) delete saved.state[key];
  return hash(saved);
}

try {
  await build({
    stdin: {
      contents: `
        export {Game} from './src/engine/Game';
        export {SimulationBrowse,BROWSE_SCREENS} from './src/ui/simulationBrowse';
        export {buildView} from './src/ui/viewModel';
        export {RosterScreen} from './src/ui/screens/RosterScreen';
        export {StandingsScreen} from './src/ui/screens/StandingsScreen';
        export {StatsScreen} from './src/ui/screens/StatsScreen';
        export {ScheduleScreen} from './src/ui/screens/ScheduleScreen';
        export {TradeScreen} from './src/ui/screens/TradeScreen';
        export {PlayerModal} from './src/ui/modals/PlayerModal';
        export {BoxScoreModal} from './src/ui/modals/BoxScoreModal';
        export {newLeague} from './scripts/lib/headless.mts';
        export {mulberry32} from './src/engine/rng';
        export {renderToStaticMarkup} from 'react-dom/server';
        export {createElement} from 'react';
      `,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    jsx: 'automatic',
    loader: { '.css': 'empty', '.png': 'dataurl', '.webp': 'dataurl' },
    outfile: directory + '/bundle.mjs',
  });
  const m = await import(pathToFileURL(directory + '/bundle.mjs').href);
  Date.now = () => 1800000000000;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });
  const fixture = m.newLeague(919);
  fixture.setState(fixture.simDay(fixture.state, undefined, 0));
  fixture.setState({ mailRead: fixture.state.mailSeq || 0, letterUnread: null, god: true });
  const data = fixture.toSave();
  const extra = { saveId: 'isolated-browse-test', saveName: 'Test', saveStatus: 'Saved', onExit() {}, onSwitch() {}, onExport() {} };
  const vm = (view: any) => m.buildView(view, { current: null }, extra);
  const render = (component: any, view: any) => m.renderToStaticMarkup(m.createElement(component, { vm: vm(view) }));
  const results: { hash: string; draws: number }[] = [];

  for (const browsing of [false, true]) {
    Math.random = m.mulberry32(8819);
    const game = m.Game.load(structuredClone(data)),
      beforePlayers = hash(game.db.P),
      pid = game.state.rosters[0][0],
      bid = Object.keys(game.db.boxes)[0],
      beforeDay = game.state.day;
    let preparationPauses = 0,
      dayPauses = 0,
      draws = 0,
      stale: any;
    const random = m.mulberry32(81913);
    Math.random = () => {
      draws++;
      return random();
    };
    const reader = new m.SimulationBrowse(
      game,
      () => {},
      async () => {
        if (++preparationPauses === 1) {
          assert.equal(game.dayInProgress, false, 'Engine waits for isolated read data');
          assert.equal(game.state.day, beforeDay);
          const before = withoutCursor(game),
            rng = draws;
          const view = reader.view;
          for (const screen of m.BROWSE_SCREENS) {
            view.setState({ screen, modal: false });
            vm(view);
          }
          for (const [screen, component] of [
            ['roster', m.RosterScreen],
            ['standings', m.StandingsScreen],
            ['stats', m.StatsScreen],
            ['schedule', m.ScheduleScreen],
            ['trade', m.TradeScreen],
          ]) {
            view.setState({ screen, modal: false });
            render(component, view);
          }
          view.setState({ pid, modal: true, ptab: 'overview' });
          render(m.PlayerModal, view);
          view.setState({ boxId: bid, boxTeam: null });
          render(m.BoxScoreModal, view);
          view.setState({ boxId: null, screen: 'roster', modal: false });
          assert.equal(draws, rng, 'Reading controls and renderers never consume simulation randomness');
          assert.equal(withoutCursor(game), before, 'Preparation reads leave source data unchanged');
        }
        await immediate();
      },
    );
    const disconnect = browsing ? reader.connect() : () => {};
    let schedulingError: unknown;
    Object.defineProperty(globalThis, 'scheduler', {
      configurable: true,
      value: {
        yield: async () => {
          // yieldToBrowser intentionally catches scheduler failures. Preserve test
          // assertions separately so they cannot be mistaken for a host fallback.
          try {
            if (browsing && game.dayInProgress && dayPauses++ === 0) {
              const view = reader.view;
              stale = view;
              assert.notEqual(view.db, game.db);
              assert.notEqual(view.db.P[pid], game.db.P[pid]);
              assert.equal(hash(view.db.P), beforePlayers, 'Only completed player stats are visible');
              assert.equal(view.db.boxes[bid], game.db.boxes[bid], 'Completed detailed boxes are reused');
              const sourceCursor = hash(game.state.pageStack),
                rng = draws;
              let updaterRan = false;
              game.setState(() => {
                updaterRan = true;
                return { phase: 'draft' };
              });
              assert.equal(updaterRan, false, 'Source updaters remain blocked mid-day');
              view.setState({ phase: 'draft' });
              assert.equal(view.state.phase, 'regular', 'Reader rejects league-changing patches');
              view.setState({ ptab: 'edit' });
              assert.notEqual(view.state.ptab, 'edit', 'God Mode editing stays locked');
              assert.throws(() => view.toSave(), /Browsing copies cannot be saved/);
              vm(view).ctx.open(pid);
              assert.equal(view.state.modal, true);
              vm(view)
                .ptabs.find(t => t.label === 'Stats')
                .go();
              assert.equal(view.state.ptab, 'stats');
              render(m.PlayerModal, view);
              vm(view).ctx.openTeam(1);
              assert.equal(view.state.rosterView.tid, 1);
              view.setState({ boxId: bid });
              render(m.BoxScoreModal, view);
              view.setState({ boxId: null, screen: 'standings', modal: false });
              render(m.StandingsScreen, view);
              assert.equal(hash(game.state.pageStack), sourceCursor, 'Cursor changes stay out of the mutable day');
              assert.equal(draws, rng);
            }
          } catch (error) {
            schedulingError = error;
            game.stopSim();
          }
          await immediate();
        },
      },
    });
    await game.sim(2);
    if (schedulingError) throw schedulingError;
    assert.equal(game.busy, false);
    assert.equal(reader.view, null);
    if (browsing) {
      assert(preparationPauses > 0 && dayPauses > 0);
      assert.equal(game.state.screen, 'standings', 'Browsing location survives completion');
      const finished = withoutCursor(game);
      stale.setState({ screen: 'roster', phase: 'draft' });
      assert.equal(withoutCursor(game), finished, 'Late reader handlers cannot mutate the completed game');
    }
    results.push({ hash: withoutCursor(game), draws });
    disconnect();
    assert.equal(game.prepareSimulation, undefined);
  }
  assert.deepEqual(results[1], results[0], 'Every non-cursor saved field and random draw matches without browsing');

  // Stop during preparation starts no day and consumes no game randomness.
  Math.random = m.mulberry32(8819);
  const stopped = m.Game.load(structuredClone(data)),
    before = withoutCursor(stopped);
  const stopping = new m.SimulationBrowse(
    stopped,
    () => {},
    async () => {
      stopped.stopSim();
      await immediate();
    },
  );
  const disconnectStop = stopping.connect();
  await stopped.sim(20);
  assert.equal(withoutCursor(stopped), before);
  assert.equal(stopping.view, null);
  disconnectStop();

  // A failed preparation falls back to the original complete input lock, while
  // simulation still produces exactly the baseline results.
  Math.random = m.mulberry32(8819);
  const fallback = m.Game.load(structuredClone(data));
  const failed = new m.SimulationBrowse(
    fallback,
    () => {},
    async () => {
      throw new Error('Test preparation failure');
    },
  );
  const disconnectFailure = failed.connect();
  let fallbackDraws = 0;
  const random = m.mulberry32(81913);
  Math.random = () => {
    fallbackDraws++;
    return random();
  };
  Object.defineProperty(globalThis, 'scheduler', { configurable: true, value: { yield: immediate } });
  await fallback.sim(2);
  assert.deepEqual({ hash: withoutCursor(fallback), draws: fallbackDraws }, results[0]);
  assert.equal(failed.view, null);
  disconnectFailure();
  console.log(
    'PASS: isolated browsing, actual screen/profile/box renderers, identical full saves/RNG, cursor retention, Stop and safe fallback',
  );
} finally {
  Math.random = originalRandom;
  Date.now = originalNow;
  if (scheduler) Object.defineProperty(globalThis, 'scheduler', scheduler);
  else delete (globalThis as any).scheduler;
  if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
  else delete (globalThis as any).localStorage;
  await rm(directory, { recursive: true, force: true });
}

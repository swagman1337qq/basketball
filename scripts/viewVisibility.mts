import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, mkdtemp, rm, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
await mkdir('.review', { recursive: true });
const dir = await mkdtemp(resolve('.review/view-visibility-'));
try {
  await build({
    stdin: {
      contents: `
      export {Game} from './src/engine/Game'; export {buildView} from './src/ui/viewModel';
      export {renderToString} from 'react-dom/server'; export {createElement} from 'react';
      export {FinancesScreen} from './src/ui/screens/FinancesScreen';
      export {OwnerScreen} from './src/ui/screens/OwnerScreen';
      export {TransactionsScreen} from './src/ui/screens/TransactionsScreen';
      export {ScoutingScreen} from './src/ui/screens/ScoutingScreen';
      export {OverseasScreen} from './src/ui/screens/OverseasScreen';
      export {DevelopmentScreen} from './src/ui/screens/DevelopmentScreen';
      export {TradeScreen} from './src/ui/screens/TradeScreen';
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
    outfile: dir + '/bundle.mjs',
  });
  (globalThis as any).localStorage = { getItem: () => null, setItem() {} };
  const m = await import(pathToFileURL(dir + '/bundle.mjs').href);
  const source = process.argv[2];
  const g = source ? m.Game.load(JSON.parse(await readFile(source, 'utf8')).data) : m.Game.create(938, [0]);
  const extras = { saveId: 'test', saveName: 'test', saveStatus: 'Saved', onExit() {}, onSwitch() {}, onExport() {} };
  const vm = () => m.buildView(g, { current: null }, extras);
  const checks = [
    ['fin', 'fin', 'FinancesScreen'],
    ['owner', 'own', 'OwnerScreen'],
    ['tx', 'txSegs', 'TransactionsScreen'],
    ['scouting', 'scoutRegions', 'ScoutingScreen'],
    ['overseas', 'ovRows', 'OverseasScreen'],
    ['dev', 'devRows', 'DevelopmentScreen'],
    ['trade', 'tMine', 'TradeScreen'],
    ['settings', 'natRows', null],
    ['draft', 'draftRows', null],
  ];
  for (const [screen, key, component] of checks) {
    g.setState({ screen, modal: false, teamModal: null, boxId: null });
    const current = vm();
    assert(current[key] != null, screen + ' data is present');
    if (Array.isArray(current[key])) assert(current[key].length > 0, screen + ' list populated');
    if (component) {
      const html = m.renderToString(m.createElement(m[component], { vm: current }));
      assert(html.length > 100, screen + ' renders');
      assert(!html.includes('Something went wrong'), screen + ' has no fallback error');
    }
    g.setState({ modal: true, pid: g.state.rosters[g.state.me][0], ptab: 'overview' });
    const hidden = vm();
    assert(hidden[key] == null || hidden[key].length === 0, screen + ' skips hidden data');
    assert.equal(hidden.books.length, current.books.length, 'Shared shell books remain available');
    assert.equal(hidden.ph.note, current.ph.note, 'Shared phase controls remain available');
  }

  let evaluations = 0;
  const evaluate = g.evalTrade.bind(g);
  g.evalTrade = (...args: any[]) => {
    evaluations++;
    return evaluate(...args);
  };
  g.setState({ screen: 'trade', modal: true });
  assert.equal(vm().tr, null);
  assert.equal(evaluations, 0, 'Hidden trades do not run trade evaluation');
  g.setState({ modal: false });
  assert(vm().tr);
  assert(evaluations > 0, 'Visible trades retain evaluation');
  g.setState({ screen: 'owner', modal: false, teamModal: 0 });
  assert.equal(vm().own, null, 'Team 0 also hides the underlying screen');
  console.log(
    'PASS: visible screen data, rendered finance/owner/transactions/scouting/overseas/development/trade screens, hidden profile work and intact shell controls.',
  );
} finally {
  await rm(dir + '/bundle.mjs', { force: true });
  await (await import('node:fs/promises')).rmdir(dir);
}

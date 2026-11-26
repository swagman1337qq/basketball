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
      export {Game} from './src/engine/Game'; export {GameSim} from './src/engine/sim';
      export {BoxScoreModal} from './src/ui/modals/BoxScoreModal'; export {boxSummary} from './src/db/boxArchive'; export {buildView} from './src/ui/viewModel';
      export {ProfileOverview} from './src/ui/modals/ProfileMain';
      export {ListModal} from './src/ui/modals/ListModal';
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

  const profilePlayer = g.db.P[g.state.rosters[g.state.me][0]],
    originalFrom = profilePlayer.from,
    originalBio = { born: profilePlayer.born, raised: profilePlayer.raised, rep: profilePlayer.rep };
  g.setState({ screen: 'dash', modal: true, pid: profilePlayer.id, ptab: 'overview', teamModal: null, listModal: null, boxId: null });
  for (const [country, league, team] of [
    ['US', 'NCAA', 'UCLA'],
    ['FR', 'LNB', 'Test French Club'],
    ['', 'Unknown', 'Unknown Location Club'],
  ]) {
    profilePlayer.from = { country, lg: league, team };
    profilePlayer.born = profilePlayer.raised = profilePlayer.rep = country === 'US' ? 'FR' : 'US';
    g.setState({ gv: (g.state.gv || 0) + 1, listModal: null });
    const current = vm(),
      row = current.pl.bgRows.find((r: any) => r.v === team || r.v.startsWith(team + ' ('));
    assert(row, 'School/club biography row is present');
    assert.equal(row.hasFlag, !!country);
    assert.equal(row.flag, country ? g.flag(country) : '', 'Flag follows the institution country, not nationality');
    assert(!current.pl.bgRows.some((r: any) => r.k === 'Grew up'));
    const html = m.renderToString(m.createElement(m.ProfileOverview, { vm: current }));
    assert(!html.includes('Grew up'));
    if (country) assert(html.includes('title="' + g.db.C[country].n + '"'), 'Institution country labels the flag');
    row.open();
    assert.equal(g.state.listModal.type, 'from');
    assert.equal(g.state.listModal.team, team, 'School/club still opens its existing list');
  }
  profilePlayer.from = originalFrom;
  Object.assign(profilePlayer, originalBio);
  g.setState({ listModal: null });

  const cohortYear = g.Y - 1;
  Object.assign(profilePlayer, { cls: g.Y + 1, draft: cohortYear, dr: { rd: 1, pick: 18 } });
  g.db.cls[cohortYear] = [];
  g.db.pickUsed = { ...(g.db.pickUsed || {}), [cohortYear + '-1-0']: { n: 18, pid: profilePlayer.id, tid: 0 } };
  const archivedId = g.db.nid++;
  g.db.P[archivedId] = {
    id: archivedId,
    name: 'Archived draft pick',
    pos: 'G',
    grp: 'G',
    age: 35,
    ovr: 40,
    pot: 40,
    rep: 'US',
    her: 'US',
    retired: { season: g.Y },
    gone: 1,
    stats: [],
  };
  g.db.pickUsed[cohortYear + '-2-0'] = { n: 32, pid: archivedId, tid: 0 };
  g.setState({ screen: 'dash', modal: false, boxId: null, listModal: { type: 'class', year: cohortYear } });
  const cohort = vm();
  assert.equal(cohort.lm.rows.find((p: any) => p.id === profilePlayer.id).extra, '18');
  assert(
    cohort.lm.rows.some((p: any) => p.id === archivedId),
    'archived picks render alongside current players',
  );
  const cohortHtml = m.renderToString(
    m.createElement(m.ListModal, {
      vm: { ...cohort, lm: { ...cohort.lm, rows: cohort.lm.rows.filter((p: any) => [profilePlayer.id, archivedId].includes(p.id)) } },
    }),
  );
  assert(cohortHtml.includes('Archived draft pick') && !cohortHtml.includes('Board #'));
  g.setState({ listModal: null });

  let bid = Object.keys(g.db.boxes || {})[0];
  if (!bid) bid = g.keepBox(new m.GameSim(g.simTeam(g.state, 0), g.simTeam(g.state, 1), { norms: g.db.norms, record: true }).run(), 0);
  g.setState({ screen: 'dash', modal: false, teamModal: null, boxId: bid });
  const fullBox = g.db.boxes[bid];
  const completeHtml = m.renderToString(m.createElement(m.BoxScoreModal, { vm: vm() }));
  assert(!completeHtml.includes('Loading game details'));
  g.db.boxes[bid] = m.boxSummary(fullBox, extras.saveId, bid);
  const lazyHtml = m.renderToString(m.createElement(m.BoxScoreModal, { vm: vm() }));
  assert(lazyHtml.includes('Loading game details'), 'Lazy games show loading rather than claim details were not recorded');
  assert(lazyHtml.includes('Line Score') && lazyHtml.includes('Four Factors'));
  assert(lazyHtml.includes('Play-by-Play') && lazyHtml.includes('Shot Charts') && lazyHtml.includes('Plus/Minus'));
  assert(lazyHtml.includes('Q1') && lazyHtml.includes('Q4'), 'Quarter controls remain available');
  console.log(
    'PASS: visible screen data, rendered finance/owner/transactions/scouting/overseas/development/trade screens, hidden profile work and intact shell controls.',
  );
} finally {
  await rm(dir + '/bundle.mjs', { force: true });
  await (await import('node:fs/promises')).rmdir(dir);
}

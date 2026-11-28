import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, mkdtemp, rm, rmdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

await mkdir('.review', { recursive: true });
const dir = await mkdtemp(resolve('.review/extension-limits-'));
try {
  await build({
    stdin: {
      contents: `export {Game} from './src/engine/Game';
      export {extensionRules,validateExtension,numsForSeason,maxFor,newExtension} from './src/engine/cba';
      export {aiExtensions} from './src/engine/cbaFlow';
      export {buildView} from './src/ui/viewModel'; export {PlayerModal} from './src/ui/modals/PlayerModal';
      export {renderToString} from 'react-dom/server'; export {createElement} from 'react';
      export {capGrowthFor} from './src/engine/capModel';`,
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
  const g: any = m.Game.create(20261128, [0]),
    id = g.state.rosters[0][0],
    p = g.db.P[id];
  const currentCap = 153 / 0.35 / m.capGrowthFor(2035),
    factor = currentCap / g.CAP;
  for (const key of Object.keys(g.db.caps)) g.db.caps[key] = +(g.db.caps[key] * factor).toFixed(1);
  g.db.capYear = 2034;
  Object.assign(g.state, {
    season: 2034,
    phase: 'preseason',
    day: 0,
    me: 0,
    managed: [0],
    pid: id,
    modal: true,
    ptab: 'contract',
    teamModal: null,
    listModal: null,
    boxId: null,
    extYears: null,
    extAmt: null,
    extMsg: null,
    awards: { 2033: { allLeague: [[id]] } },
  });
  Object.assign(p, {
    age: 28,
    ovr: 70,
    pot: 70,
    yos0: 1,
    exp: 2034,
    amt: 66.96,
    raise: 0,
    raiseBase: 66.96,
    ctype: 'standard',
    cls: 0,
    draftTid: 0,
    leftAsFA: false,
    yrsWith: 8,
    signed: { season: 2031, phase: 'preseason' },
    pers: { ...p.pers, mot: 'Money' },
    stats: Array.from({ length: 7 }, (_, i) => ({
      season: 2027 + i,
      tid: 0,
      gp: 82,
      gs: 82,
      min: 2500,
      pts: 1840,
      fgm: 700,
      fga: 1400,
      tpm: 120,
      tpa: 300,
      ftm: 320,
      fta: 400,
      orb: 100,
      drb: 300,
      reb: 400,
      ast: 200,
      stl: 60,
      blk: 40,
      tov: 140,
      pf: 150,
    })),
  });
  delete p.ext;
  delete p.rookieScale;
  delete p.noResign;
  delete p.opt;
  g.fair = () => g.CAP;
  g.moodOf = () => ({ hap: 80, hapLabel: 'Content', hapColor: 'green', factors: [] });
  const history = structuredClone(p.stats),
    pay = p.amt;
  const future = m.numsForSeason(g, 2035),
    max = future.max(9, 'super');
  let rules = m.extensionRules(g, g.state, p, 0);
  assert.ok(Math.abs(rules.ordinaryMax - 93.74) < 0.01, 'screenshot ordinary ceiling reproduced');
  assert.equal(rules.maxFirst, max, 'eligible supermax bypasses 140%');
  assert.equal(rules.defaultYears, 5, 'one year left requires five new seasons');
  assert.equal(rules.minFirst, future.max(9, 'rose'), 'designated deal has the 30% minimum');
  assert.ok(m.validateExtension(g, g.state, p, 0, max, 5).ok);
  assert.equal(m.validateExtension(g, g.state, p, 0, max, 3).ok, false, 'a short deal cannot use the designated exception');
  assert.equal(m.validateExtension(g, g.state, p, 0, max, 6).ok, false);
  assert.equal(m.validateExtension(g, g.state, p, 0, rules.minFirst - 1, 5).ok, false);
  assert.equal(m.validateExtension(g, g.state, p, 0, max + 0.01, 5).ok, false);
  const extras = { saveId: 'test', saveName: 'test', saveStatus: 'Saved', onExit() {}, onExport() {}, onSwitch() {} };
  const vm = () => m.buildView(g, { current: null }, extras);
  let view = vm();
  assert.equal(view.pl.canExt, true);
  assert.equal(view.ext.max, max);
  assert.equal(view.ext.years, 5);
  assert.ok(view.ext.rule.includes('Designated veteran supermax') && !view.ext.rule.includes('140%'));
  const html = m.renderToString(m.createElement(m.PlayerModal, { vm: view }));
  assert.ok(html.includes('Designated veteran supermax') && html.includes('35%'));
  assert.ok(html.includes('step="0.01"'), 'salary input can enter the exact maximum without rounding it away');
  view.ext.offer();
  assert.equal(p.ext.amt, max, 'normal Offer extension accepts the eligible market-max deal');
  assert.equal(p.ext.yrs, 5);
  assert.equal(p.ext.maxPct, 0.35);
  assert.deepEqual(p.stats, history);
  assert.equal(p.amt, pay, 'existing salary preserved until activation');
  delete p.ext;
  g.state.extMsg = null;

  g.state.extYears = 3;
  g.state.extAmt = max;
  view = vm();
  assert.equal(view.ext.max, 93.74);
  assert.equal(view.ext.amt, 93.74, 'standard amount stays within displayed limit');
  assert.ok(view.ext.limitNote.includes('Choose 5 new seasons'));
  view.ext.offer();
  assert.equal(p.ext, undefined, 'no forced bargain to satisfy a lower extension ceiling');
  assert.ok(g.state.extMsg.includes('Choose 5'));
  g.state.god = true;
  g.state.extYears = 6;
  g.state.extAmt = max + 11;
  view = vm();
  view.ext.force();
  assert.equal(p.ext.amt, max + 11);
  assert.equal(p.ext.yrs, 6);
  assert.equal(p.ext.maxPct, undefined);
  delete p.ext;
  g.state.god = false;
  g.state.extYears = null;
  g.state.extAmt = null;

  // The same player still uses ordinary rules outside the designated window.
  g.state.phase = 'regular';
  g.state.day = 20;
  rules = m.extensionRules(g, g.state, p, 0);
  assert.equal(rules.canDesignate, false);
  assert.equal(rules.maxFirst, 93.74);
  assert.equal(rules.maxSalary, max, 'the ordinary ceiling does not cut his market asking price');
  view = vm();
  assert.ok(view.ext.limitNote.includes('offseason'));
  assert.equal(m.validateExtension(g, g.state, p, 0, max, 5).ok, false);
  g.state.phase = 'preseason';
  g.state.day = 0;
  p.signed = { season: 2033, phase: 'preseason' };
  assert.equal(m.extensionRules(g, g.state, p, 0).canDesignate, false, 'three-year designated anniversary enforced');
  p.signed = { season: 2031, phase: 'preseason' };

  p.exp = 2035;
  p.raise = 0.05;
  p.yos0 = 0;
  rules = m.extensionRules(g, g.state, p, 0, 3, 0);
  assert.equal(rules.designatedYears, 4);
  assert.equal(rules.ordinaryMax, +(g.salAt(p, p.exp) * 1.4).toFixed(2), 'ordinary ceiling uses final guaranteed salary');
  assert.equal(m.extensionRules(g, g.state, p, 0, 4).maxFirst, m.maxFor(g, g.state, p, 0, 'vetExt').amt);
  p.exp = 2034;
  p.raise = 0;
  p.yos0 = 1;
  g.state.awards = {};
  assert.equal(m.extensionRules(g, g.state, p, 0).maxFirst, 93.74, 'no honors: no designated salary exception');
  p.yos0 = 4;
  assert.equal(m.extensionRules(g, g.state, p, 0).canDesignate, false, 'ordinary ten-year 35% maximum is not a designated extension');
  p.yos0 = 1;
  g.state.easyContracts = true;
  rules = m.extensionRules(g, g.state, p, 0);
  assert.equal(rules.maxFirst, future.max(9));
  assert.equal(rules.maxYears, 5);
  assert.ok(m.validateExtension(g, g.state, p, 0, rules.maxFirst, 3).ok);
  g.state.easyContracts = false;

  // AI must use the identical exception and legal length, rather than reject it
  // as over 140% or sign a short, invalid supermax.
  g.state.awards = { 2033: { allLeague: [[id]] } };
  g.state.managed = [];
  g.state.me = -1;
  for (const tid of Object.keys(g.state.rosters)) g.state.rosters[tid] = +tid === 0 ? [id] : [];
  const oldRandom = Math.random;
  Math.random = () => 0;
  try {
    g.state.phase = 'regular';
    g.state.day = 20;
    m.aiExtensions(g, g.state, 100);
    assert.equal(p.ext, undefined, 'the AI cannot force an ordinary discount outside the designated window');
    g.state.phase = 'preseason';
    g.state.day = 0;
    m.aiExtensions(g, g.state, 100);
  } finally {
    Math.random = oldRandom;
  }
  assert.equal(p.ext?.amt, max);
  assert.equal(p.ext?.yrs, 5);
  assert.equal(p.ext?.maxPct, 0.35);
  delete p.ext;
  g.fair = () => g.CAP * 0.2;
  Math.random = () => 0;
  try {
    m.aiExtensions(g, g.state, 100);
  } finally {
    Math.random = oldRandom;
  }
  assert.equal(p.ext?.yrs, 3, 'a market price below the designated minimum uses an ordinary extension');
  assert.ok(p.ext.amt <= 93.74 && p.ext.amt < future.max(9, 'rose'));
  assert.equal(p.ext.maxPct, undefined, 'a discounted ordinary extension keeps fixed dollar terms');
  assert.deepEqual(p.stats, history);
  assert.equal(p.amt, pay);
  console.log(
    'PASS: screenshot supermax ceiling, legal lengths/windows/minimums, ordinary/final-year limits, rendered form, real offer, AI parity, fixed God Mode terms and preserved history.',
  );
} finally {
  await rm(dir + '/bundle.mjs', { force: true });
  await rmdir(dir);
}

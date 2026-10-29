// Review-only probes for revision a40d31fa. Run with Node 24+: node .review/reproduce.mjs
// No dependencies or game-code edits. Uses Node's TS transform; React rendering alone is stubbed.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export let runtime = join(root, '.review', 'runtime-' + Date.now());
const copy = x => JSON.parse(JSON.stringify(x));

export async function prepare() {
  runtime = join(root, '.review', 'runtime-' + Date.now());
  async function compile(dir) {
    for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) { await compile(rel); continue; }
      if (!rel.endsWith('.ts')) continue;
      const source = await readFile(join(root, rel), 'utf8');
      const js = stripTypeScriptTypes(source, { mode: 'transform' }).replace(/from\s*(['"])([^'"]+)\1/g, (all, quote, target) => {
        if (target === 'react') return 'from ' + JSON.stringify(pathToFileURL(join(runtime, 'react.mjs')).href);
        return target.startsWith('.') ? 'from ' + quote + target.replace(/\.ts$/, '') + '.mjs' + quote : all;
      });
      const output = join(runtime, rel.replace(/\.ts$/, '.mjs'));
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, js);
    }
  }
  await compile('src/engine');
  await compile('src/data');
  await writeFile(join(runtime, 'react.mjs'), 'export const createElement=(...args)=>args;');
}

export async function runProbes() {
  await prepare();
  const engine = name => import(pathToFileURL(join(runtime, 'src/engine', name + '.mjs')).href);
  const [{ Game }, cba, contracts, flow, preFA, pickRules, frontOffice] = await Promise.all(
    ['Game', 'cba', 'contracts', 'cbaFlow', 'preFA', 'pickRules', 'frontOffice'].map(engine)
  );
  const base = copy(Game.load(copy(Game.create(2027, [0]).toSave())).toSave());
  const fresh = () => Game.load(copy(base));
  const boxOf = s => ({ rosters: { ...s.rosters }, fa: [...s.fa], overseas: [...s.overseas], cap: { ...s.cap } });
  const result = [];
  function record(id, observed, evidence) { result.push({ id, observed, evidence }); }

  try {
    Game.create(44, Array.from({ length: 30 }, (_, i) => i));
    record('F01', false, { created: true });
  } catch (e) { record('F01', /reading 'tid'/.test(e.message), { error: e.message }); }

  {
    const g = fresh(), p = g.db.P[g.state.rosters[0][0]];
    Object.assign(p, { amt: 40, exp: g.Y + 4, opt: undefined });
    const before = cba.teamSalary(g, g.state, 0);
    g.setState({ dialog: { type: 'abroad', pid: p.id } }); g.confirmDialog();
    const after = cba.teamSalary(g, g.state, 0), dead = cba.deadThis(g, g.state, 0);
    record('F02', Math.abs(before - after - 40) < .01 && dead === 0, { before, after, dead });
  }

  {
    const g = fresh(), p = g.db.P[g.state.rosters[0][0]], box = boxOf(g.state);
    Object.assign(p, { amt: 10, exp: g.Y, ext: { amt: 30, yrs: 4, raise: .08 } });
    const guarantee = cba.remainingGuaranteed(g, g.state, p);
    contracts.waivePlayer(g, g.state, box, 0, p, 'buyout', 0);
    const newSalary = cba.nums(g).min(cba.yosOf(g, p));
    contracts.applySigning(g, g.state, box, 1, p, { method: 'min', amt: newSalary, years: 1 });
    g.state = { ...g.state, ...box, phase: 'draft', picks: [], managed: [1], me: 1 };
    flow.openFreeAgency(g, g.state);
    record('F03', p.amt === 30 && !guarantee[g.Y + 1], { originalExtension: 30, newlySignedSalary: newSalary, salaryAfterRollover: p.amt, guarantee });
  }

  {
    const g = fresh(), s = g.state, Y = g.Y;
    s.assets = s.assets.map(a => ({ ...a, owner: a.orig }));
    s.assets.find(a => a.yr === Y && a.rd === 1 && a.orig === 0).owner = 2;
    s.swaps = [{ id: 'review-swap', yr: Y, from: 1, to: 0 }];
    const settled = pickRules.settlePickRules(g, s, [{ n: 10, rd: 1, orig: 0 }, { n: 1, rd: 1, orig: 1 }]);
    const after = settled.assets.find(a => a.yr === Y && a.rd === 1 && a.orig === 0).owner;
    record('F04', after !== 2, { swapHolder: 0, thirdPartyOwnerBefore: 2, thirdPartyOwnerAfter: after });
  }

  {
    const g = fresh(); g.state.phase = 'fa'; g.state.managed = [0, 1];
    const pid = g.state.rosters[1].at(-1), p = g.db.P[pid];
    g.state.rosters[1] = g.state.rosters[1].filter(x => x !== pid); g.state.fa.push(pid);
    Object.assign(p, { rfa: { tid: 1, qo: 3 }, birdTid: 1, ask: 3 }); p.pers.mot = 'Loyalty';
    g.setState({ dialog: { type: 'sign', pid, method: 'ntmle', amt: 5, years: 2 } }); flow.userSign(g);
    const signed = g.state.rosters[0].includes(pid), sheets = g.state.offerSheets?.length || 0;
    record('F05', signed && sheets === 0, { signed, sheets, matchingRightsAfter: p.rfa });
  }

  {
    const g = fresh(); g.state.phase = 'fa'; g.state.managed = [0, 1];
    const p = g.db.P[g.state.fa.find(id => g.db.P[id].ovr < 48)];
    Object.assign(p, { rfa: { tid: 1, qo: 5 }, birdTid: 1, yrsWith: 3, ask: 5 });
    g.setState({ dialog: { type: 'sign', pid: p.id, method: 'offer', amt: 10, years: 3 } }); flow.userSign(g);
    const sheet = g.state.offerSheets?.[0]; if (sheet) flow.answerOfferSheet(g, sheet.id, false);
    const cap = cba.capState(g.state, 0), signed = g.state.rosters[0].includes(p.id);
    record('F06', signed && cap.exc.ntmle === cba.nums(g).NTMLE && !cap.hardCap, { signed, exceptions: cap.exc, hardCap: cap.hardCap });
  }

  {
    const g = fresh(); g.state.phase = 'fa';
    const p = g.db.P[g.state.fa[0]]; p.birdTid = 0; p.rfa = { tid: 0, qo: 5 };
    g.state.cap = { ...g.state.cap, 0: { hardCap: 'AP1' } };
    g.state.teams[0].capAdj = (g.state.teams[0].capAdj || 0) + g.AP1 - 2 - cba.teamSalary(g, g.state, 0);
    g.state.offerSheets = [{ id: 'review-sheet', pid: p.id, to: 0, from: 1, terms: { method: 'cap', amt: 5, years: 2 } }];
    flow.answerOfferSheet(g, 'review-sheet', true);
    const salary = cba.teamSalary(g, g.state, 0);
    record('F07', salary > g.AP1 && g.state.rosters[0].includes(p.id), { salary, limit: g.AP1 });
  }

  {
    const g = fresh(), P = g.db.P; g.state.day = 40;
    const p0 = P[g.state.fa.find(id => P[id].ovr < 48)], box = boxOf(g.state);
    contracts.applySigning(g, g.state, box, 0, p0, { method: 'min', amt: cba.nums(g).min(cba.yosOf(g, p0)), years: 1 });
    g.state = { ...g.state, ...box };
    g.state.rosters[0].slice(0, 4).forEach(id => P[id].inj = { name: 'Review injury', games: 10 });
    const p = P[g.state.fa.find(id => P[id].ovr < 48)], terms = { method: 'hardship', amt: cba.nums(g).min(cba.yosOf(g, p)), years: 0 };
    const allowed = contracts.validateSigning(g, g.state, 0, p, terms).ok;
    g.setState({ dialog: { type: 'sign', pid: p.id, ...terms } }); flow.userSign(g);
    const signed = g.state.rosters[0].includes(p.id), canPlay = g.canPlay();
    record('F08', allowed && signed && !canPlay, { allowed, signed, standardContracts: cba.stdIds(g, g.state.rosters[0]).length, canPlay });
  }

  {
    const g = fresh(); g.state.assets = g.state.assets.map(a => ({ ...a, owner: a.orig }));
    const give = [g.Y + 1, g.Y + 2].map(y => y + '-1-0'), receive = [g.Y + 1, g.Y + 2].map(y => y + '-1-1');
    const check = cba.checkTrade(g, g.state, 0, 1, [], [], give, receive);
    record('F09', check.errs.some(x => x.includes('Stepien')), { give, receive, errors: check.errs });
  }

  {
    const g = Game.create(2027, [0, 1]);
    Object.assign(g.state, { phase: 'draft', picks: [], pi: 0, preFA: { opts: [] } });
    for (const row of preFA.preFARows(g, g.state, 0)) if (row.required && !row.decided)
      g.state.decide = { ...g.state.decide, [(row.kind === 'teamOpt' ? 'opt' : 'let') + row.pid]: true };
    const p = g.db.P[g.state.rosters[1].at(-1)]; p.exp = g.Y; delete p.opt; delete p.ext;
    g.state.decide['let' + p.id] = true;
    const pending = preFA.preFAPending(g, g.state, 1); g.startFA();
    record('F10', g.state.phase === 'fa' && p.birdTid === 1, { pendingForSecondClub: pending, phase: g.state.phase, letGoPid: p.id, retainedBirdTid: p.birdTid });
  }

  {
    const g = fresh(); g.state.phase = 'playoffs';
    g.state.po = { rounds: [[{ a: 0, b: 1, sa: 1, sb: 8, wa: 0, wb: 0, conf: 'East', g: [] }]], champ: null, finals: {} };
    const calls = { injury: 0, fatigue: 0 };
    g.injTick = () => calls.injury++; g.fatigueTick = () => calls.fatigue++; g.simPo('game');
    record('F11', g.state.games.length === 1 && calls.injury === 0 && calls.fatigue === 0, { games: g.state.games.length, calls });
  }

  {
    const g = fresh(); g.state.phase = 'draft';
    g.state.teams.push({ ...g.state.teams[0], tid: 30 }, { ...g.state.teams[1], tid: 31 });
    g.state.rosters[30] = []; g.state.rosters[31] = [];
    const p = g.db.P[g.db.cls[g.Y][0]], box = { rosters: { ...g.state.rosters }, fa: [] };
    flow.signDraftee(g, g.state, box, 0, p, { n: 33, rd: 2 }, true);
    record('F12', p.dr.pick !== 1, { teams: 32, overallPick: 33, expectedRoundPick: 1, recorded: p.dr });
  }

  {
    const g = Game.create(2027, [0]);
    const before = Object.fromEntries(Object.values(g.db.P).filter(p => p.r).map(p => [p.id, { ovr: p.ovr, grp: p.grp }]));
    const loaded = Game.load(copy(g.toSave()));
    const changes = Object.values(loaded.db.P).filter(p => p.r && before[p.id] && (p.ovr !== before[p.id].ovr || p.grp !== before[p.id].grp));
    record('F13', changes.length > 0, { changedPlayers: changes.length, example: changes[0] && { id: changes[0].id, before: before[changes[0].id], after: { ovr: changes[0].ovr, grp: changes[0].grp } } });
  }

  {
    const g = fresh(); g.state.bonusPaid = 5;
    Object.assign(g.state, { phase: 'fa', faStart: 0, day: 92 }); g.startPreseason();
    const expense = frontOffice.financesOf(g, g.state, 0).exp.find(x => x[0] === 'Incentive bonuses paid');
    record('F14', g.state.phase === 'preseason' && expense?.[1] === 5, { phase: g.state.phase, expense, carriedBonus: g.state.bonusPaid });
  }

  {
    // Run the actual offline plugin against an isolated public directory. Only paths change.
    const publicDir = join(runtime, 'cache-fixture', 'public');
    await mkdir(publicDir, { recursive: true });
    const icon = join(publicDir, 'icon.svg');
    let pluginSource = await readFile(join(root, 'pwa/offlinePlugin.mjs'), 'utf8');
    pluginSource = pluginSource.replace("pub('public')", 'pub(' + JSON.stringify(publicDir) + ')')
      .replace("relative('public', p)", 'relative(' + JSON.stringify(publicDir) + ', p)')
      .replace("readFileSync('pwa/sw-template.js',", 'readFileSync(' + JSON.stringify(join(root, 'pwa/sw-template.js')) + ',');
    const pluginFile = join(runtime, 'cache-fixture', 'offlinePlugin.mjs');
    await writeFile(pluginFile, pluginSource);
    const { offlinePlugin } = await import(pathToFileURL(pluginFile).href);
    const generate = () => { let emitted; offlinePlugin().generateBundle.call({ emitFile: asset => emitted = asset.source }, {}, { 'index.html': {}, 'assets/app-123.js': {} }); return emitted; };
    await writeFile(icon, '<svg><!-- version 1 --></svg>'); const first = generate();
    await writeFile(icon, '<svg><!-- version 2 --></svg>'); const second = generate();
    record('F15', first === second, { publicContentsChanged: true, generatedServiceWorkerUnchanged: first === second });
  }

  {
    const g = fresh(), overseas = await engine('overseas');
    const p = g.db.P[g.state.overseas.find(id => g.db.P[id].abroad?.clause === 'Buyout')];
    const before = new Map(g.state.assets.map(a => [a.id, a.owner]));
    const negotiation = overseas.negotiateBuyout(g, p.id, p.abroad.fee, true);
    const forfeited = g.state.assets.find(a => a.owner === -1 && before.get(a.id) !== -1);
    Object.assign(g.state, { season: forfeited?.yr || g.Y + 1, phase: 'draft', pi: 0,
      picks: [{ n: g.state.teams.length + 1, rd: 2, orig: forfeited?.orig ?? 0, pid: null }] });
    let error;
    try { g.aiDraft(false); } catch (e) { error = e.message; }
    record('F16', !!forfeited || /reading 'abbr'/.test(error || ''), { negotiation, forfeited, error });
  }

  const arithmetic = [];
  for (const seed of [7, 44, 2027]) {
    const g = Game.create(seed, [0]), res = g.playGame(g.state, 0, 1);
    for (const key of ['home', 'away']) {
      const side = res[key], rows = Object.values(side.box), sum = k => rows.reduce((a, b) => a + (b[k] || 0), 0);
      arithmetic.push({ seed, side: key, points: sum('pts') === side.pts && 2 * sum('fgm') + sum('tpm') + sum('ftm') === side.pts,
        minutes: Math.abs(sum('min') - (240 + 25 * res.ot)) < 1e-6,
        plusMinus: sum('pm') === 5 * (side.pts - res[key === 'home' ? 'away' : 'home'].pts),
        validShooting: rows.every(b => b.fgm <= b.fga && b.tpm <= b.tpa && b.ftm <= b.fta) });
    }
  }
  const output = { revision: 'a40d31fa3a958a4be772b13d16e5ae6f271d4c70', findings: result, arithmetic };
  await writeFile(join(root, '.review', 'reproduced.json'), JSON.stringify(output, null, 2));
  return output;
}

if (typeof process !== 'undefined' && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await runProbes();
  console.table(output.findings.map(({ id, observed }) => ({ finding: id, defectObserved: observed })));
  console.log('Evidence: .review/reproduced.json. Arithmetic checks:', output.arithmetic);
}

// Measuring the overall's weights from the engine (ratings.ts OVR_W, FEEL_W; 2026-11-01). Every game, every
// rotation player on both teams gets each rating (and Feel) nudged by ±D at random; the margin per 100 possessions
// is regressed on the nudges (each team's sum per position group and rating, weighted by the player's share of the
// minutes). A coefficient is what +10 in that rating for the group's whole rotation is worth, in net points per
// 100. Each group's weights are those values as shares of the group's total (a 1% floor, so every rating counts a
// little), adding up to 100.
//
//   npx tsx scripts/measureOvr.mts <games> <seed> <out.json>      one worker (run several seeds, then combine)
//   npx tsx scripts/measureOvr.mts combine out1.json out2.json ...  solves the regression and prints the weights
//   npm run test:ratings  (measureOvr.mts check [games] [workers])  the guard after an engine change, below
//   npx tsx scripts/measureOvr.mts baseline [games] [workers]       records the values the guard checks against
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { FEEL_W, OVR_W } from '../src/engine/ratings';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';

const KEYS = ['hgt', 'stre', 'spd', 'acc', 'jmp', 'endu', 'ins', 'dnk', 'lay', 'ft', 'fg', 'tp', 'oiq', 'diq', 'blk', 'stl', 'drb', 'pss', 'reb', 'box', 'feel'];
const GRPS = ['G', 'W', 'B'], NF = GRPS.length * KEYS.length, D = 5;

function work(N: number, seed: number, out: string) {
  const RR = Math.random; Math.random = mulberry32(seed); const g: any = Game.create(seed, [0]); Math.random = RR;
  const s = g.state, P = g.db.P, tids = s.teams.map((t: any) => t.tid);
  // A team's rotation in the engine's order and each player's share of the minutes (Game.ROTATION).
  const rot = (tid: number) => s.rosters[tid].slice().sort((a: number, b: number) => P[b].ovr - P[a].ovr).slice(0, 10).map((id: number, i: number) => ({ id, w: (Game.ROTATION[i] ?? 0) / 48 })).filter((x: any) => x.w > 0);
  // Normal equations, accumulated: X'X (NF+1 with the intercept, which also holds home court: team a is at home), X'y.
  const K = NF + 1, XX = Array.from({ length: K }, () => new Float64Array(K)), Xy = new Float64Array(K); let yy = 0, n = 0;
  for (let i = 0; i < N; i++) {
    const rnd = mulberry32((seed * 1e6 + i * 2654435761) >>> 0), a = tids[Math.floor(rnd() * tids.length)]; let b = a; while (b === a) b = tids[Math.floor(rnd() * tids.length)];
    const f = new Float64Array(K); f[0] = 1;
    const saved: [any, any, number | undefined][] = [];
    ([[a, 1], [b, -1]] as [number, number][]).forEach(([tid, sg]) => rot(tid).forEach(({ id, w }: any) => {
      const p = P[id], gi = GRPS.indexOf(p.grp); if (gi < 0) return; saved.push([p, { ...p.r }, p.intg?.feel]);
      KEYS.forEach((k, ki) => { const d = rnd() < 0.5 ? -D : D;
        if (k === 'feel') { if (p.intg) p.intg.feel = Math.max(1, Math.min(99, (p.intg.feel ?? 50) + d)); }
        else if (p.r[k] != null) p.r[k] = Math.max(1, Math.min(99, p.r[k] + d)); else return;
        f[1 + gi * KEYS.length + ki] += sg * w * d; }); }));
    const old = Math.random; Math.random = rnd;
    const A = g.simTeam(s, a), B = g.simTeam(s, b), r: any = new GameSim(A, B, { norms: g.db.norms }).run();
    Math.random = old; saved.forEach(([p, r0, fe]) => { p.r = r0; if (p.intg && fe != null) p.intg.feel = fe; });
    const poss = Object.values(r.home.box).reduce((x: number, q: any) => x + (q.onPO || 0), 0) / 5 + Object.values(r.away.box).reduce((x: number, q: any) => x + (q.onPO || 0), 0) / 5;
    const y = (100 * (r.home.pts - r.away.pts)) / Math.max(1, poss / 2) / 2; // net per 100 possessions (each team's)
    for (let u = 0; u < K; u++) { if (!f[u]) continue; Xy[u] += f[u] * y; for (let v = 0; v < K; v++) if (f[v]) XX[u][v] += f[u] * f[v]; }
    yy += y * y; n++;
    if (i % 2000 === 1999 || i === N - 1) { writeFileSync(out, JSON.stringify({ n, yy, XX: XX.map(r => Array.from(r)), Xy: Array.from(Xy) })); console.log('seed', seed, 'games', n); } // saved as it goes: combine any time
  }
}

// The regression from saved worker files: each coefficient (net per 100 for +10 across a group's rotation) and its standard error.
function solve(files: string[]) {
  const parts = files.map(f => JSON.parse(readFileSync(f, 'utf8'))), K = NF + 1;
  const XX = Array.from({ length: K }, (_, u) => Array.from({ length: K }, (_, v) => parts.reduce((a, p) => a + p.XX[u][v], 0))), Xy = Array.from({ length: K }, (_, u) => parts.reduce((a, p) => a + p.Xy[u], 0)), n = parts.reduce((a, p) => a + p.n, 0);
  const M = XX.map((r, i) => [...r, Xy[i]]);
  for (let c = 0; c < K; c++) { let pv = c; for (let r = c + 1; r < K; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r; [M[c], M[pv]] = [M[pv], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < K; r++) if (r !== c) { const q = M[r][c] / d; if (q) for (let k = c; k <= K; k++) M[r][k] -= q * M[c][k]; } }
  const beta = M.map((r, i) => r[K] / (r[i] || 1e-12));
  // Standard errors: residual variance × diag((X'X)^-1), from the inverse by the same elimination.
  const yy = parts.reduce((a, p) => a + p.yy, 0), rss = yy - beta.reduce((a, b, i) => a + b * Xy[i], 0), s2 = rss / Math.max(1, n - K);
  const inv = (() => { const A = XX.map((r, i) => [...r, ...Array.from({ length: K }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < K; c++) { let pv = c; for (let r = c + 1; r < K; r++) if (Math.abs(A[r][c]) > Math.abs(A[pv][c])) pv = r; [A[c], A[pv]] = [A[pv], A[c]]; const d = A[c][c] || 1e-12; for (let k = 0; k < 2 * K; k++) A[c][k] /= d; for (let r = 0; r < K; r++) if (r !== c) { const q = A[r][c]; if (q) for (let k = 0; k < 2 * K; k++) A[r][k] -= q * A[c][k]; } }
    return A.map(r => r.slice(K)); })();
  const val = (gi: number) => KEYS.map((k, ki) => { const j = 1 + gi * KEYS.length + ki; return { k, b: beta[j] * 10, se: Math.sqrt(Math.max(0, s2 * inv[j][j])) * 10 }; });
  return { n, home: beta[0], val };
}

function combine(files: string[]) {
  const { n, home, val } = solve(files);
  console.log('games', n, '| home court', home.toFixed(2), 'per 100');
  const out: any = {};
  GRPS.forEach((G, gi) => {
    // A group's rotation plays about these minute shares together (a guard-heavy five: two guards, two wings, one big).
    const v = val(gi);
    const tot = v.reduce((a, x) => a + Math.max(0, x.b), 0), floor = 0.01 * tot / 0.79;
    const w = v.map(x => ({ ...x, raw: Math.max(floor, x.b) })), T = w.reduce((a, x) => a + x.raw, 0);
    out[G] = Object.fromEntries(w.map(x => [x.k, +(Math.round((100 * x.raw) / T * 2) / 2).toFixed(1)]));
    console.log(G, w.map(x => x.k + ' ' + x.b.toFixed(2) + '±' + x.se.toFixed(2)).join(' | '));
  });
  console.log(JSON.stringify(out));
}

// The guard (2026-11-08), for after any engine change: a fresh measurement compared with the last recorded one
// (scripts/ratingValues.json, written by `baseline`). It fails when a rating's value in games drops clearly (more
// than 0.1 net per 100 for +10 and 3.2 standard errors, about a 4% chance of a false alarm over all 63 ratings), the way steals once quietly stopped mattering after a
// possession change. It also reports, without failing, ratings whose share of the value is well away from their
// weight in the overall (ratings.ts OVR_W, FEEL_W: the overall is going stale) and ratings that count for 4% or more
// of an overall without clearly helping win. 100,000 games: about 8 minutes on 4 cores.
//   npm run test:ratings                                   check against the recorded values
//   npx tsx scripts/measureOvr.mts baseline 160000          record new values (after a deliberate engine change)
const BASE_FILE = new URL('./ratingValues.json', import.meta.url);
async function measure(games: number, workers: number, seed0: number) {
  const dir = mkdtempSync(join(tmpdir(), 'ovrcheck-')), files: string[] = [], self = process.argv[1];
  await Promise.all(Array.from({ length: workers }, (_, i) => new Promise<void>((done, fail) => {
    const out = join(dir, 'w' + i + '.json'); files.push(out);
    const c = spawn(process.execPath, [...process.execArgv, self, String(Math.ceil(games / workers)), String(seed0 + i), out], { stdio: 'ignore' });
    c.on('exit', code => (code === 0 ? done() : fail(new Error('worker ' + i + ' exited ' + code)))); })));
  return solve(files);
}
async function baseline(games: number, workers: number) {
  const { n, val } = await measure(games, workers, 7001);
  const grp = (gi: number) => '{ ' + val(gi).map(x => JSON.stringify(x.k) + ': [' + +x.b.toFixed(3) + ', ' + +x.se.toFixed(3) + ']').join(', ') + ' }';
  writeFileSync(BASE_FILE, '{\n "measured": "' + new Date().toISOString().slice(0, 10) + '",\n "games": ' + n + ',\n "note": "Net points per 100 possessions for +10 in a rating across a position group\'s rotation, with its standard error (scripts/measureOvr.mts baseline). npm run test:ratings fails when a rating falls clearly below this.",\n "values": {\n' + GRPS.map((G, gi) => '  "' + G + '": ' + grp(gi)).join(',\n') + '\n }\n}\n'); console.log('Recorded the values of ' + n + ' games in scripts/ratingValues.json');
}
async function check(games: number, workers: number) {
  const base = JSON.parse(readFileSync(BASE_FILE, 'utf8')), { n, val } = await measure(games, workers, 9001), drops: string[] = [], weak: string[] = [], drift: string[] = [];
  GRPS.forEach((G, gi) => {
    const v = val(gi), W: Record<string, number> = { ...OVR_W[G], feel: FEEL_W[G] }, wt = KEYS.reduce((a, k) => a + (W[k] ?? 0), 0), tot = v.reduce((a, x) => a + Math.max(0, x.b), 0);
    v.forEach(x => { const [b0, se0] = base.values[G][x.k], drop = b0 - x.b, z = drop / Math.hypot(x.se, se0), share = (100 * (W[x.k] ?? 0)) / wt, got = (100 * Math.max(0, x.b)) / tot;
      if (drop > 0.1 && z > 3.2) drops.push(G + ' ' + x.k + ': ' + b0.toFixed(2) + ' → ' + x.b.toFixed(2) + ' ± ' + x.se.toFixed(2) + ' net per 100 for +10');
      if (share >= 4 && x.b < 1.5 * x.se) weak.push(G + ' ' + x.k + ' (' + share.toFixed(1) + '% of the overall, ' + x.b.toFixed(2) + ')');
      if (Math.abs(got - share) >= 4) drift.push(G + ' ' + x.k + ' ' + share.toFixed(1) + '% → ' + got.toFixed(1) + '%'); });
    console.log(G, v.map(x => x.k + ' ' + x.b.toFixed(2)).join(' | '));
  });
  console.log('\n' + n + ' games, against ' + base.games + ' recorded on ' + base.measured + '.');
  if (weak.length) console.log('Count for 4%+ of an overall without clearly helping win: ' + weak.join(', '));
  if (drift.length) console.log('Weight → measured share, 4+ points apart (the overall is going stale): ' + drift.join(', '));
  if (drops.length) { console.log('\nFAIL: ratings worth clearly less than recorded:\n  ' + drops.join('\n  ')); process.exit(1); }
  console.log('PASS: no rating is worth clearly less than recorded.');
}

if (process.argv[2] === 'combine') combine(process.argv.slice(3));
else if (process.argv[2] === 'check') await check(+(process.argv[3] || 100000), +(process.argv[4] || 4));
else if (process.argv[2] === 'baseline') await baseline(+(process.argv[3] || 160000), +(process.argv[4] || 4));
else work(+process.argv[2], +process.argv[3], process.argv[4]);

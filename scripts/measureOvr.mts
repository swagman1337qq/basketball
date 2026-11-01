// Measuring the overall's weights from the engine (ratings.ts OVR_W, FEEL_W; 2026-11-01). Every game, every
// rotation player on both teams gets each rating (and Feel) nudged by ±D at random; the margin per 100 possessions
// is regressed on the nudges (each team's sum per position group and rating, weighted by the player's share of the
// minutes). A coefficient is what +10 in that rating for the group's whole rotation is worth, in net points per
// 100. Each group's weights are those values as shares of the group's total (a 1% floor, so every rating counts a
// little), adding up to 100.
//
//   npx tsx scripts/measureOvr.mts <games> <seed> <out.json>      one worker (run several seeds, then combine)
//   npx tsx scripts/measureOvr.mts combine out1.json out2.json ...  solves the regression and prints the weights
import { readFileSync, writeFileSync } from 'fs';
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
    if (i % 2000 === 0) console.log('seed', seed, 'game', i);
  }
  writeFileSync(out, JSON.stringify({ n, yy, XX: XX.map(r => Array.from(r)), Xy: Array.from(Xy) }));
}

function combine(files: string[]) {
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
  console.log('games', n, '| home court', beta[0].toFixed(2), 'per 100');
  const out: any = {};
  GRPS.forEach((G, gi) => {
    // A group's rotation plays about these minute shares together (a guard-heavy five: two guards, two wings, one big).
    const v = KEYS.map((k, ki) => { const j = 1 + gi * KEYS.length + ki; return { k, b: beta[j] * 10, se: Math.sqrt(Math.max(0, s2 * inv[j][j])) * 10 }; });
    const tot = v.reduce((a, x) => a + Math.max(0, x.b), 0), floor = 0.01 * tot / 0.79;
    const w = v.map(x => ({ ...x, raw: Math.max(floor, x.b) })), T = w.reduce((a, x) => a + x.raw, 0);
    out[G] = Object.fromEntries(w.map(x => [x.k, +(Math.round((100 * x.raw) / T * 2) / 2).toFixed(1)]));
    console.log(G, w.map(x => x.k + ' ' + x.b.toFixed(2) + '±' + x.se.toFixed(2)).join(' | '));
  });
  console.log(JSON.stringify(out));
}

if (process.argv[2] === 'combine') combine(process.argv.slice(3)); else work(+process.argv[2], +process.argv[3], process.argv[4]);

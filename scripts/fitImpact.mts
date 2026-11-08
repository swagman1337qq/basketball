// Fitting the impact metrics to this engine (2026-11-01, docs/ADVANCED_ESTIMATES.md). Three steps:
//
//   npx tsx scripts/fitImpact.mts collect data.json --seeds 21,22,23 --seasons 4
//       plays seeded leagues and keeps every regular-season game line, each season's player totals and lineup
//       regression totals (Game.addStints), for the fits below;
//   npx tsx scripts/fitImpact.mts fit data.json
//       fits the box-score prior (the "SPM", as EPM and LEBRON fit theirs to RAPM) and DARKO's decay per stat
//       (how fast each stat forgets old games, by how well it predicts the next 20 games), and prints them for
//       advanced.ts;
//   npx tsx scripts/fitImpact.mts test --seeds 31,32 --seasons 4
//       the prediction test on new leagues: each team's next-season net rating from its players' metric this
//       season (newcomers at −2), for BPM, EPM, LEBRON and DARKO, old method against new.
import { readFileSync, writeFileSync } from 'fs';
import { newLeague, offseason, playRegular } from './lib/headless.mts';

const mode = process.argv[2],
  file = process.argv[3];
const arg = (k: string, d: string) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const GROUP: Record<string, string> = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };
// One game line: id, season, day, offensive and defensive possessions on the floor, then the box score.
export const GL = [
  'id',
  'Y',
  'day',
  'onPO',
  'onPD',
  'pts',
  'xP',
  'fga',
  'fta',
  'tpm',
  'ast',
  'tov',
  'orb',
  'drb',
  'stl',
  'blk',
  'pf',
] as const;

async function collect() {
  const seeds = arg('seeds', '21,22,23').split(',').map(Number),
    seasons = +arg('seasons', '4'),
    out: any = { leagues: [] };
  for (const seed of seeds) {
    const g = newLeague(seed),
      games: number[][] = [],
      L: any = { seed, seasons: [], games };
    const orig = g.addBox.bind(g);
    g.addBox = (res: any, po: boolean, ...rest: any[]) => {
      if (!po)
        for (const side of [res.home, res.away])
          for (const [k, b] of Object.entries(side.box) as [string, any][])
            if (b.min > 0) games.push([+k, g.Y, g.state.day, ...GL.slice(3).map(f => +(b[f] || 0).toFixed(2))]);
      return orig(res, po, ...rest);
    };
    for (let s = 0; s < seasons; s++) {
      if (s > 0) offseason(g);
      await playRegular(g);
      const Y = g.Y,
        rows: any[] = [];
      Object.values(g.db.P).forEach((p: any) =>
        (p.stats || []).forEach((r: any) => {
          if (r.season !== Y || r.po || !r.min) return;
          rows.push({
            id: p.id,
            tid: r.tid,
            grp: GROUP[p.pos] || 'W',
            age: p.age,
            t: Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v === 'number')),
          });
        }),
      );
      L.seasons.push({
        Y,
        rapm: JSON.parse(JSON.stringify(g.db.rapm?.[Y] || {})),
        rows,
        teams: JSON.parse(JSON.stringify(g.state.tstats || {})),
      });
      console.log('seed', seed, 'season', Y, 'rows', rows.length, 'game lines', games.length);
    }
    out.leagues.push(L);
  }
  writeFileSync(file, JSON.stringify(out));
}

// ── fitting ──────────────────────────────────────────────────────────────────────────────────────────────
function solve(A: number[][], b: number[]): number[] {
  const n = b.length,
    M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-9;
    for (let r = 0; r < n; r++)
      if (r !== c) {
        const f = M[r][c] / d;
        if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-9));
}
// Ridge RAPM for one team-season with no box prior (toward the league average), points per 100 above the
// league's; y 'yp' = actual points, 'yx' = expected points.
function rapmTeam(M: any, lgPP: number, lam: number, y: 'yp' | 'yx') {
  const ids = Object.keys(M.yp).map(Number);
  if (!ids.length) return {} as Record<number, { b: number; n: number }>;
  const A = ids.map(a => ids.map(b => M.xx[Math.min(a, b) + ',' + Math.max(a, b)] || 0)),
    Ar = A.map((r, i) => r.map((v, j) => v + (i === j ? lam : 0)));
  const rhs = ids.map((id, i) => M[y][id] - lgPP * A[i][i]),
    beta = solve(Ar, rhs),
    o: Record<number, { b: number; n: number }> = {};
  ids.forEach((id, i) => (o[id] = { b: beta[i] * 100, n: A[i][i] }));
  return o;
}
// The box-score features, per 100 possessions on the floor (offense on offensive trips, defense on defensive).
export const SPM_F = ['pts', 'fga', 'fta', 'tpm', 'ast', 'tov', 'orb', 'drb', 'stl', 'blk', 'pf'] as const;
const feats = (t: any, luck: boolean) => {
  const o = Math.max(1, t.onPO),
    d = Math.max(1, t.onPD);
  return SPM_F.map(k => (100 * (k === 'pts' && luck ? t.xP : t[k] || 0)) / (['drb', 'stl', 'blk', 'pf'].includes(k) ? d : o));
};
// Weighted ridge regression of y on [1, x], ridge `lam` on the slopes toward `toward` (or 0).
function wls(X: number[][], y: number[], w: number[], lam: number, toward?: number[]) {
  const k = X[0].length + 1,
    A = Array.from({ length: k }, () => new Array(k).fill(0)),
    b = new Array(k).fill(0);
  X.forEach((x, i) => {
    const r = [1, ...x];
    for (let a = 0; a < k; a++) {
      b[a] += w[i] * r[a] * y[i];
      for (let c = 0; c < k; c++) A[a][c] += w[i] * r[a] * r[c];
    }
  });
  const W = w.reduce((s, v) => s + v, 0);
  for (let a = 1; a < k; a++) {
    A[a][a] += lam * W;
    b[a] += lam * W * (toward ? toward[a - 1] : 0);
  }
  return solve(A, b);
}

function fit() {
  const D = JSON.parse(readFileSync(file, 'utf8')),
    LAM_FIT = +arg('lam', '2500');
  // 1. Targets: each player-team-season's RAPM (no prior) for offense and defense, actual and expected points.
  const S: { x: number[]; xL: number[]; o: number; d: number; oX: number; dX: number; nO: number; nD: number; grp: string }[] = [];
  D.leagues.forEach((L: any) =>
    L.seasons.forEach((sz: any) => {
      let sp = 0,
        sx = 0,
        sn = 0;
      Object.values(sz.rapm).forEach((T: any) => {
        for (const k in T.O.yp) {
          sp += T.O.yp[k];
          sx += T.O.yx[k];
          sn += T.O.xx[k + ',' + k] || 0;
        }
      });
      const lgP = sp / sn,
        lgX = sx / sn;
      Object.entries(sz.rapm).forEach(([tid, T]: [string, any]) => {
        const O = rapmTeam(T.O, lgP, LAM_FIT, 'yp'),
          Dd = rapmTeam(T.D, lgP, LAM_FIT, 'yp'),
          OX = rapmTeam(T.O, lgX, LAM_FIT, 'yx'),
          DX = rapmTeam(T.D, lgX, LAM_FIT, 'yx');
        sz.rows
          .filter((r: any) => r.tid === +tid && r.t.onPO >= 300 && r.t.onPD >= 300)
          .forEach((r: any) => {
            if (!O[r.id] || !Dd[r.id]) return;
            S.push({
              x: feats(r.t, false),
              xL: feats(r.t, true),
              o: O[r.id].b,
              d: -Dd[r.id].b,
              oX: OX[r.id].b,
              dX: -DX[r.id].b,
              nO: O[r.id].n,
              nD: Dd[r.id].n,
              grp: r.grp,
            });
          });
      });
    }),
  );
  console.log('player-team-seasons:', S.length);
  // 2. The SPM: offense and defense, each on every feature (as BPM does), small ridge on the slopes.
  const fitOne = (
    rows: typeof S,
    xs: (r: (typeof S)[0]) => number[],
    ys: (r: (typeof S)[0]) => number,
    ws: (r: (typeof S)[0]) => number,
    lam = 1e-4,
    toward?: number[],
  ) => wls(rows.map(xs), rows.map(ys), rows.map(ws), lam, toward);
  const r4 = (a: number[]) => a.map(v => +v.toFixed(4));
  const epmO = fitOne(
      S,
      r => r.x,
      r => r.o,
      r => r.nO,
    ),
    epmD = fitOne(
      S,
      r => r.x,
      r => r.d,
      r => r.nD,
    );
  const lebO = fitOne(
      S,
      r => r.xL,
      r => r.oX,
      r => r.nO,
    ),
    lebD = fitOne(
      S,
      r => r.xL,
      r => r.dX,
      r => r.nD,
    );
  // LEBRON's prior by position group (its "role" adjustment): each group's own fit, pulled toward the pooled one.
  const byGrp: any = {};
  ['G', 'W', 'B'].forEach(G => {
    const R = S.filter(r => r.grp === G);
    byGrp[G] = {
      o: r4(
        fitOne(
          R,
          r => r.xL,
          r => r.oX,
          r => r.nO,
          0.002,
          lebO.slice(1),
        ),
      ),
      d: r4(
        fitOne(
          R,
          r => r.xL,
          r => r.dX,
          r => r.nD,
          0.002,
          lebD.slice(1),
        ),
      ),
    };
  });
  // How well each prior explains the targets (weighted correlation), against BPM's fixed coefficients.
  const wcor = (a: number[], b: number[], w: number[]) => {
    const W = w.reduce((s, v) => s + v, 0),
      ma = a.reduce((s, v, i) => s + v * w[i], 0) / W,
      mb = b.reduce((s, v, i) => s + v * w[i], 0) / W;
    let sab = 0,
      saa = 0,
      sbb = 0;
    a.forEach((v, i) => {
      sab += w[i] * (v - ma) * (b[i] - mb);
      saa += w[i] * (v - ma) ** 2;
      sbb += w[i] * (b[i] - mb) ** 2;
    });
    return sab / Math.sqrt(saa * sbb);
  };
  const pred = (c: number[], x: number[]) => c[0] + x.reduce((s, v, i) => s + c[i + 1] * v, 0);
  const bpmO = (x: number[]) =>
      0.8 * (0.86 * x[0] - 0.56 * x[1] - 0.246 * x[2] + 0.389 * x[3] + 0.807 * x[4] - 0.964 * x[5] + 0.397 * x[6]),
    bpmD = (x: number[]) => 0.25 * x[7] + 1.6 * x[8] + 1.2 * x[9] - 0.3 * x[10];
  console.log(
    'fit to RAPM (weighted r): offense BPM',
    wcor(
      S.map(r => bpmO(r.x)),
      S.map(r => r.o),
      S.map(r => r.nO),
    ).toFixed(3),
    '→ fitted',
    wcor(
      S.map(r => pred(epmO, r.x)),
      S.map(r => r.o),
      S.map(r => r.nO),
    ).toFixed(3),
    '| defense BPM',
    wcor(
      S.map(r => bpmD(r.x)),
      S.map(r => r.d),
      S.map(r => r.nD),
    ).toFixed(3),
    '→ fitted',
    wcor(
      S.map(r => pred(epmD, r.x)),
      S.map(r => r.d),
      S.map(r => r.nD),
    ).toFixed(3),
  );
  // 3. DARKO's decay per stat: before each game, his decayed rate (with a prior worth K possessions at the league
  // rate) predicts his next 20 games; pick the per-game decay, the summer carry-over and K that predict best.
  const byP = new Map<number, number[][]>();
  D.leagues.forEach((L: any, li: number) =>
    L.games.forEach((r: number[]) => {
      const k = li * 1e6 + r[0];
      (byP.get(k) || byP.set(k, []).get(k)!).push(r);
    }),
  );
  const idx = (k: string) => (GL as readonly string[]).indexOf(k),
    stats = ['pts', 'xP', 'fga', 'fta', 'tpm', 'ast', 'tov', 'orb', 'drb', 'stl', 'blk', 'pf'];
  // The prior is a bench player's rate (seasons under 1,000 minutes): what an unknown player is most likely to be.
  const bench = new Set<string>();
  D.leagues.forEach((L: any, li: number) =>
    L.seasons.forEach((sz: any) => {
      const m: Record<number, number> = {};
      sz.rows.forEach((r: any) => (m[r.id] = (m[r.id] || 0) + r.t.min));
      Object.entries(m).forEach(([id, v]) => {
        if (v < 1000) bench.add(li * 1e6 + +id + ':' + sz.Y);
      });
    }),
  );
  // Running totals per player and column, so any 20-game window is one subtraction.
  const pre = new Map<number[][], number[][]>();
  byP.forEach(gs => {
    gs.sort((a, b) => a[1] - b[1] || a[2] - b[2]);
    pre.set(
      gs,
      GL.map((_, c) => {
        const o = [0];
        gs.forEach(r => o.push(o[o.length - 1] + r[c]));
        return o;
      }),
    );
  });
  const decay: any = {};
  stats.forEach(k => {
    const ki = idx(k),
      pi = ['drb', 'stl', 'blk', 'pf'].includes(k) ? idx('onPD') : idx('onPO');
    let num = 0,
      den = 0;
    byP.forEach((gs, pk) =>
      gs.forEach(r => {
        if (!bench.has(pk + ':' + r[1])) return;
        num += r[ki];
        den += r[pi];
      }),
    );
    const lg = num / den;
    let best: any = null;
    for (const d of [0.95, 0.97, 0.98, 0.985, 0.99, 0.993, 0.996, 0.998, 1])
      for (const m of [0.1, 0.2, 0.3, 0.5, 0.7, 1])
        for (const K of [30, 60, 100, 300, 700, 1500]) {
          let err = 0,
            w = 0;
          byP.forEach(gs => {
            const cs = pre.get(gs)!,
              cv = cs[ki],
              cp = cs[pi];
            let s = 0,
              n = 0;
            for (let i = 0; i < gs.length - 20; i++) {
              const r = gs[i];
              if (i && gs[i - 1][1] !== r[1]) {
                s *= m;
                n *= m;
              }
              if (i >= 10 && gs[i + 20][1] === r[1]) {
                const fs = cv[i + 20] - cv[i],
                  fn = cp[i + 20] - cp[i];
                if (fn > 50) {
                  const p = (s + K * lg) / (n + K),
                    a = fs / fn;
                  err += fn * (p - a) ** 2;
                  w += fn;
                }
              }
              s = s * d + r[ki];
              n = n * d + r[pi];
            }
          });
          if (!best || err / w < best.e) best = { d, m, K, e: err / w };
        }
    decay[k] = { d: best.d, m: best.m, K: best.K, prior: +lg.toFixed(5) };
    console.log('decay', k.padEnd(4), JSON.stringify(decay[k]));
  });
  const outc = { epm: { o: r4(epmO), d: r4(epmD) }, lebron: { o: r4(lebO), d: r4(lebD), grp: byGrp }, decay };
  console.log(JSON.stringify(outc));
  writeFileSync(file.replace(/\.json$/, '') + '.fit.json', JSON.stringify(outc, null, 1));
}

// ── prediction test ──────────────────────────────────────────────────────────────────────────────────────
async function test() {
  const A = await import('../src/engine/advanced');
  const seeds = arg('seeds', '31,32').split(',').map(Number),
    seasons = +arg('seasons', '4'),
    cfg = arg('cfg', '');
  const pairs: Record<string, { p: number; a: number }[]> = {};
  const fitC = cfg ? JSON.parse(readFileSync(cfg, 'utf8')) : undefined;
  for (const seed of seeds) {
    A.setImpactFit(fitC); // on while the games are played: DARKO keeps its game-by-game state
    const g = newLeague(seed),
      snaps: Record<number, any> = {},
      tst: Record<number, any> = {};
    for (let s = 0; s < seasons; s++) {
      if (s > 0) offseason(g);
      await playRegular(g);
      snaps[g.Y] = JSON.parse(JSON.stringify(g.db.rapm[g.Y]));
      tst[g.Y] = JSON.parse(JSON.stringify(g.state.tstats));
      console.log('seed', seed, 'season', g.Y);
    }
    g.db.rapm = snaps; // every season's lineup totals, for the test
    for (const [variant, lam] of [
      ['old', 10000],
      ['new', 3000],
      ['new', 10000],
      ['new', 30000],
    ] as [string, number][]) {
      A.setImpactFit(variant === 'new' ? fitC : null);
      A.RAPM.lambda = lam;
      A.clearAdvancedCache(g);
      const years = Object.keys(snaps).map(Number).sort();
      for (let i = 0; i < years.length - 1; i++) {
        const y0 = years[i],
          y1 = years[i + 1],
          a0 = A.seasonAdvanced(g, g.state, y0).byPid,
          T1 = y1 === g.Y ? g.state.tstats : tst[y1];
        const min1: Record<number, Record<number, number>> = {};
        Object.values(g.db.P).forEach((p: any) =>
          (p.stats || []).forEach((r: any) => {
            if (r.season === y1 && !r.po) (min1[r.tid] ||= {})[p.id] = (min1[r.tid]?.[p.id] || 0) + r.min;
          }),
        );
        Object.entries(min1).forEach(([tid, ms]) => {
          const T = T1[+tid];
          if (!T) return;
          const poss = g.possOf(T),
            net = (100 * (T.pts - T.oPts)) / poss;
          ['bpm', 'epm', 'lebron', 'darko'].forEach(k => {
            let s = 0,
              w = 0;
            Object.entries(ms).forEach(([id, m]) => {
              const v = a0[+id]?.[k];
              s += m * (v == null || !(a0[+id].minTot >= 250) ? -2 : v);
              w += m;
            });
            (pairs[variant + (variant === 'new' ? ' λ' + lam / 1000 + 'k' : '') + ' ' + k] ||= []).push({ p: s / w, a: net });
          });
        });
      }
    }
  }
  const cor = (xs: { p: number; a: number }[]) => {
    const n = xs.length,
      mp = xs.reduce((s, x) => s + x.p, 0) / n,
      ma = xs.reduce((s, x) => s + x.a, 0) / n;
    let c = 0,
      vp = 0,
      va = 0;
    xs.forEach(x => {
      c += (x.p - mp) * (x.a - ma);
      vp += (x.p - mp) ** 2;
      va += (x.a - ma) ** 2;
    });
    return c / Math.sqrt(vp * va);
  };
  Object.entries(pairs).forEach(([k, xs]) => console.log(k.padEnd(14), 'r =', cor(xs).toFixed(3), '(' + xs.length + ' team-seasons)'));
}

if (mode === 'collect') await collect();
else if (mode === 'fit') fit();
else if (mode === 'test') await test();
else console.log('collect | fit | test (see the top of this file)');

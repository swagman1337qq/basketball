// League normalization for the bell curve. Recomputed from the actual rosters at the
// start of every season (and when a league is created or loaded), so the 2026
// baselines stay the league mean even as ratings drift upward or downward over time.
import { effTend } from './tendencies';
import { computeFinishNorms } from './finishing';
import {
  BASE,
  blockSkill,
  PASS_FLOOR,
  PASS_KNEE,
  PASS_SLOPE,
  passQ,
  creMeanOf,
  creSkill,
  lineupCre,
  curve,
  CURVE_OF,
  DEFAULT_NORMS,
  foulDrawWeight,
  gambleB,
  gambleS,
  interiorD,
  perimD,
  stealSkill,
  rebSkill,
  shotProfile,
  usageRaw,
  ZONES,
  zoneSkill,
  type JumpZone,
  type Norms,
  type Zone,
} from './sim';

export interface NormEntry {
  p: any;
  roles: string[];
  min: number;
  tid: number;
}

const wmean = (xs: { v: number; w: number }[]) => {
  let a = 0,
    b = 0;
  xs.forEach(x => {
    a += x.v * x.w;
    b += x.w;
  });
  return b ? a / b : 0;
};

export function computeNorms(entries: NormEntry[], season: number): Norms {
  const E = entries
    .filter(e => e.min > 0)
    .map(e => ({
      ...e,
      use: usageRaw({ ...e.p, tend: effTend(e.p), alpha: e.p.pers?.alpha, touches: e.p.pers?.touches, roles: e.roles }),
      sk: zoneSkill(e.p.r),
    }));
  if (!E.length) return { ...DEFAULT_NORMS, season };
  const n: Norms = JSON.parse(JSON.stringify(DEFAULT_NORMS));
  n.season = season;
  n.usage = wmean(E.map(e => ({ v: e.use, w: e.min })));
  n.perimD = wmean(E.map(e => ({ v: perimD(e.p.r), w: e.min })));
  n.pss = wmean(E.map(e => ({ v: e.p.r.pss, w: e.min })));
  n.handle = wmean(E.map(e => ({ v: (e.p.r.drb + e.p.r.pss) / 2, w: e.min })));
  n.reb = wmean(E.map(e => ({ v: rebSkill(e.p.r), w: e.min })));
  // Interior defense is measured on each team's two tallest rotation players, as in the engine.
  const byTeam = new Map<number, typeof E>();
  E.forEach(e => byTeam.set(e.tid, [...(byTeam.get(e.tid) || []), e]));
  const bigs: { v: number; w: number }[] = [];
  byTeam.forEach(list =>
    list
      .filter(e => e.min >= 12)
      .sort((a, b) => b.p.r.hgt - a.p.r.hgt)
      .slice(0, 3)
      .forEach(e => bigs.push({ v: interiorD(e.p.r), w: e.min })),
  );
  n.interiorD = wmean(bigs) || DEFAULT_NORMS.interiorD;
  n.diq = wmean(E.map(e => ({ v: e.p.r.diq, w: e.min })));
  n.oiq = wmean(E.map(e => ({ v: e.p.r.oiq, w: e.min })));
  n.stl = wmean(E.map(e => ({ v: stealSkill(e.p.r), w: e.min })));
  n.gamB = wmean(E.map(e => ({ v: gambleB(e.p.r), w: e.min })));
  n.gamS = wmean(E.map(e => ({ v: gambleS(e.p.r), w: e.min })));
  // Shot-blocking, like the engine, on each team's two best shot-blockers in the rotation.
  const blk: { v: number; w: number }[] = [];
  byTeam.forEach(list =>
    list
      .filter(e => e.min >= 12)
      .sort((a, b) => blockSkill(b.p.r) - blockSkill(a.p.r))
      .slice(0, 2)
      .forEach(e => blk.push({ v: blockSkill(e.p.r), w: e.min })),
  );
  n.blk = wmean(blk) || DEFAULT_NORMS.blk;
  // Lineup creation as the engine sees it on the floor: about two thirds of a game with the five who play
  // most, a third with a bench-heavy five (the 4th–8th in minutes).
  const cre: { v: number; w: number }[] = [];
  byTeam.forEach(list => {
    const rot = list
      .slice()
      .sort((a, b) => b.min - a.min)
      .map(e => creSkill(e.p.r));
    if (rot.length >= 5) cre.push({ v: 0.65 * lineupCre(rot.slice(0, 5)) + 0.35 * lineupCre(rot.slice(3, 8)), w: 1 });
  });
  n.creL = wmean(cre) || undefined;
  // On the floor as the engine plays it (about two thirds of a game with the five who play most, a third with the 4th–8th):
  // the typical setter (sim.ts, the pass before a shot: for each shooter, the other four weighted as the engine picks
  // who sets it up, the soft ceiling on one passer's share included) and the two best shot-blockers on the floor.
  const setters: { v: number; w: number }[] = [],
    blkL: { v: number; w: number }[] = [];
  byTeam.forEach(list => {
    const rot = list.slice().sort((a, b) => b.min - a.min);
    if (rot.length < 5) return;
    (
      [
        [rot.slice(0, 5), 0.65],
        [rot.slice(3, 8), 0.35],
      ] as [typeof E, number][]
    ).forEach(([L, lw]) => {
      const b2 = L.map(e => blockSkill(e.p.r)).sort((a, b) => b - a);
      blkL.push({ v: (b2[0] + b2[1]) / 2, w: lw });
      L.forEach(sh => {
        const c = L.filter(e => e !== sh),
          q = c.map(e => passQ({ r: e.p.r, feel: e.p.intg?.feel ?? 50 })),
          t = c.map(e => (effTend(e.p) as any)?.pass ?? 1);
        const ws = c.map(
            (e, i) => Math.pow(Math.max(PASS_FLOOR, q[i]), 2.4) * Math.max(0.75, Math.min(1.45, 0.45 + e.p.r.drb / 80)) * t[i],
          ),
          wt = ws.reduce((a, b) => a + b, 0),
          wi = ws.indexOf(Math.max(...ws)),
          top = wt > 0 ? ws[wi] / wt : 0;
        if (top > PASS_KNEE) {
          const sh2 = PASS_KNEE + (top - PASS_KNEE) * PASS_SLOPE;
          ws[wi] = (sh2 * (wt - ws[wi])) / (1 - sh2);
        }
        const W = ws.reduce((a, b) => a + b, 0);
        if (W > 0) setters.push({ v: ws.reduce((a, w, i) => a + w * q[i], 0) / W, w: lw * sh.use });
      });
    });
  });
  n.passQ = wmean(setters) || undefined;
  n.blkL = wmean(blkL) || undefined;

  // Shot volume = minutes × usage; iterate so the skill means and the share correction agree.
  const vol = (e: (typeof E)[number]) => e.min * e.use;
  n.draw =
    E.reduce((a, e) => a + e.min * foulDrawWeight({ r: e.p.r, tend: effTend(e.p) }, e.use), 0) /
    Math.max(
      1e-6,
      E.reduce((a, e) => a + vol(e), 0),
    );
  for (const z of ZONES) n.skill[z] = wmean(E.map(e => ({ v: e.sk[z], w: vol(e) })));
  // Players with their own shot mix (tendencies.ts, version 4) take what's set: the share correction only
  // steers the old, computed mixes (and stays put when there are none).
  const legacy = E.some(e => !effTend(e.p)?.zs);
  for (let it = 0; it < 4; it++) {
    const prof = E.map(e => shotProfile({ r: e.p.r, roles: e.roles, tend: effTend(e.p), pers: e.p.pers, grp: e.p.grp }, n));
    const tot = E.reduce((a, e) => a + vol(e), 0);
    for (const z of ZONES) {
      const share = E.reduce((a, e, i) => a + vol(e) * prof[i][z], 0) / tot;
      if (legacy) n.shareCorr[z] *= BASE.zone[z].share / share;
      n.skill[z] = wmean(E.map((e, i) => ({ v: e.sk[z], w: vol(e) * prof[i][z] * (z === 'mid' ? 1 - (effTend(e.p)?.pf ?? 0.52) : 1) })));
    }
  }
  const prof = E.map(e => shotProfile({ r: e.p.r, roles: e.roles, tend: effTend(e.p), pers: e.p.pers, grp: e.p.grp }, n));
  // Use the same authored mix and technique choice as the game. Each technique
  // centers its own execution curve; dunk ability no longer re-centers layups.
  n.finish = computeFinishNorms(
    E.map((e, i) => ({
      p: { r: e.p.r, grp: e.p.grp, tend: effTend(e.p) },
      rimWeight: vol(e) * prof[i].rim,
      paintWeight: vol(e) * prof[i].mid * (effTend(e.p)?.pf ?? 0.52),
    })),
  );
  n.rimHgt = wmean(E.map((e, i) => ({ v: e.p.r.hgt, w: vol(e) * prof[i].rim })));
  for (const z of ZONES)
    n.offset[z] = Math.max(
      -0.08,
      Math.min(
        0.08,
        -wmean(
          E.map((e, i) => ({
            v: curve(CURVE_OF[z as Zone], e.sk[z]),
            w: vol(e) * prof[i][z] * (z === 'mid' ? 1 - (effTend(e.p)?.pf ?? 0.52) : 1),
          })),
        ),
      ),
    );
  // Jump-shot creation, per tier, weighted by each player's jump shots there (the paint's floaters and hooks aren't jumpers).
  n.cre = {} as Record<JumpZone, any>;
  (['mid', 'c3', 'atb'] as JumpZone[]).forEach(z => {
    const xs = E.map((e, i) => {
        const t = effTend(e.p),
          w = vol(e) * prof[i][z] * (z === 'mid' ? 1 - (t?.pf ?? 0.52) : 1);
        return { m: creMeanOf(e.p.r, t?.cre, z), w };
      }),
      W = xs.reduce((a, x) => a + x.w, 0) || 1;
    n.cre![z] = {
      pct: xs.reduce((a, x) => a + x.m.pct * x.w, 0) / W,
      ast: xs.reduce((a, x) => a + x.m.ast * x.w, 0) / W,
      blk: xs.reduce((a, x) => a + x.m.blk * x.w, 0) / W,
    };
  });
  n.ftOffset = Math.max(
    -0.08,
    Math.min(0.08, -wmean(E.map(e => ({ v: curve('ft', e.p.r.ft), w: e.min * foulDrawWeight({ r: e.p.r, tend: effTend(e.p) }, e.use) })))),
  );
  return n;
}

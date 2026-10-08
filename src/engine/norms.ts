// League normalization for the bell curve. Recomputed from the actual rosters at the
// start of every season (and when a league is created or loaded), so the 2026
// baselines stay the league mean even as ratings drift upward or downward over time.
import { effTend } from './tendencies';
import { BASE, blockSkill, creMeanOf, curve, CURVE_OF, DEFAULT_NORMS, gambleB, gambleS, interiorD, perimD, stealSkill, rebSkill, shotProfile, usageRaw, ZONES, zoneSkill, type JumpZone, type Norms, type Zone } from './sim';

export interface NormEntry { p: any; roles: string[]; min: number; tid: number }

const wmean = (xs: { v: number; w: number }[]) => { let a = 0, b = 0; xs.forEach(x => { a += x.v * x.w; b += x.w; }); return b ? a / b : 0; };

export function computeNorms(entries: NormEntry[], season: number): Norms {
  const E = entries.filter(e => e.min > 0).map(e => ({ ...e, use: usageRaw({ ...e.p, tend: effTend(e.p), alpha: e.p.pers?.alpha, touches: e.p.pers?.touches, roles: e.roles }), sk: zoneSkill(e.p.r) }));
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
  byTeam.forEach(list => list.filter(e => e.min >= 12).sort((a, b) => b.p.r.hgt - a.p.r.hgt).slice(0, 3).forEach(e => bigs.push({ v: interiorD(e.p.r), w: e.min })));
  n.interiorD = wmean(bigs) || DEFAULT_NORMS.interiorD;
  n.diq = wmean(E.map(e => ({ v: e.p.r.diq, w: e.min })));
  n.oiq = wmean(E.map(e => ({ v: e.p.r.oiq, w: e.min })));
  n.stl = wmean(E.map(e => ({ v: stealSkill(e.p.r), w: e.min })));
  n.gamB = wmean(E.map(e => ({ v: gambleB(e.p.r), w: e.min })));
  n.gamS = wmean(E.map(e => ({ v: gambleS(e.p.r), w: e.min })));
  // Shot-blocking, like the engine, on each team's two best shot-blockers in the rotation.
  const blk: { v: number; w: number }[] = [];
  byTeam.forEach(list => list.filter(e => e.min >= 12).sort((a, b) => blockSkill(b.p.r) - blockSkill(a.p.r)).slice(0, 2).forEach(e => blk.push({ v: blockSkill(e.p.r), w: e.min })));
  n.blk = wmean(blk) || DEFAULT_NORMS.blk;

  // Shot volume = minutes × usage; iterate so the skill means and the share correction agree.
  const vol = (e: (typeof E)[number]) => e.min * e.use;
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
      n.skill[z] = wmean(E.map((e, i) => ({ v: e.sk[z], w: vol(e) * prof[i][z] })));
    }
  }
  const prof = E.map(e => shotProfile({ r: e.p.r, roles: e.roles, tend: effTend(e.p), pers: e.p.pers, grp: e.p.grp }, n));
  n.rimHgt = wmean(E.map((e, i) => ({ v: e.p.r.hgt, w: vol(e) * prof[i].rim })));
  for (const z of ZONES) n.offset[z] = Math.max(-0.08, Math.min(0.08, -wmean(E.map((e, i) => ({ v: curve(CURVE_OF[z as Zone], e.sk[z]), w: vol(e) * prof[i][z] })))));
  // Jump-shot creation, per tier, weighted by each player's jump shots there (the paint's floaters and hooks aren't jumpers).
  n.cre = {} as Record<JumpZone, any>;
  (['mid', 'c3', 'atb'] as JumpZone[]).forEach(z => { const xs = E.map((e, i) => { const t = effTend(e.p), w = vol(e) * prof[i][z] * (z === 'mid' ? 1 - (t?.pf ?? 0.52) : 1); return { m: creMeanOf(e.p.r, t?.cre, z), w }; }), W = xs.reduce((a, x) => a + x.w, 0) || 1;
    n.cre![z] = { pct: xs.reduce((a, x) => a + x.m.pct * x.w, 0) / W, ast: xs.reduce((a, x) => a + x.m.ast * x.w, 0) / W, blk: xs.reduce((a, x) => a + x.m.blk * x.w, 0) / W }; });
  n.ftOffset = Math.max(-0.08, Math.min(0.08, -wmean(E.map(e => ({ v: curve('ft', e.p.r.ft), w: vol(e) * (e.p.r.ins + e.p.r.dnk + e.p.r.stre / 2) })))));
  return n;
}

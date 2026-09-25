// League normalization for the bell curve. Recomputed from the actual rosters at the
// start of every season (and when a league is created or loaded), so the 2026
// baselines stay the league mean even as ratings drift upward or downward over time.
import { BASE, curve, CURVE_OF, DEFAULT_NORMS, interiorD, perimD, rebSkill, shotProfile, usageRaw, ZONES, zoneSkill, type Norms, type Zone } from './sim';

export interface NormEntry { p: any; roles: string[]; min: number; tid: number }

const wmean = (xs: { v: number; w: number }[]) => { let a = 0, b = 0; xs.forEach(x => { a += x.v * x.w; b += x.w; }); return b ? a / b : 0; };

export function computeNorms(entries: NormEntry[], season: number): Norms {
  const E = entries.filter(e => e.min > 0).map(e => ({ ...e, use: usageRaw({ ...e.p, alpha: e.p.pers?.alpha, touches: e.p.pers?.touches, roles: e.roles }), sk: zoneSkill(e.p.r) }));
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

  // Shot volume = minutes × usage; iterate so the skill means and the share correction agree.
  const vol = (e: (typeof E)[number]) => e.min * e.use;
  for (const z of ZONES) n.skill[z] = wmean(E.map(e => ({ v: e.sk[z], w: vol(e) })));
  for (let it = 0; it < 4; it++) {
    const prof = E.map(e => shotProfile({ r: e.p.r, roles: e.roles }, n));
    const tot = E.reduce((a, e) => a + vol(e), 0);
    for (const z of ZONES) {
      const share = E.reduce((a, e, i) => a + vol(e) * prof[i][z], 0) / tot;
      n.shareCorr[z] *= BASE.zone[z].share / share;
      n.skill[z] = wmean(E.map((e, i) => ({ v: e.sk[z], w: vol(e) * prof[i][z] })));
    }
  }
  const prof = E.map(e => shotProfile({ r: e.p.r, roles: e.roles }, n));
  for (const z of ZONES) n.offset[z] = Math.max(-0.08, Math.min(0.08, -wmean(E.map((e, i) => ({ v: curve(CURVE_OF[z as Zone], e.sk[z]), w: vol(e) * prof[i][z] })))));
  n.ftOffset = Math.max(-0.08, Math.min(0.08, -wmean(E.map(e => ({ v: curve('ft', e.p.r.ft), w: vol(e) * (e.p.r.ins + e.p.r.dnk + e.p.r.stre / 2) })))));
  return n;
}

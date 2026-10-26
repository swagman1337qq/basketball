// College and club stats for draft prospects (2026-10-26). Nothing is stored: each season line is worked out when
// it's shown, from the prospect's true amateur game (p.r before the hidden NBA translation, translation.ts; p.am, kept as the summer after his draft began, from then on), the
// level he plays at, his age and role, and a season's luck, seeded by his id and the season, so the same player
// always shows the same numbers. Earlier seasons step his game back by the growth he had left at each age.
// The numbers never hint at the translation; where they disagree with the board (your scouts' read, with its
// errors), the scouts may have misread him. Advanced stats come from the game's own formulas (advanced.ts),
// computed over the whole class per season (so BPM is relative to the class).
import type { Game } from './Game';
import { mulberry32 } from './rng';
import { ovrExact } from './ratings';
import { blockSkill, offAbility, rebSkill, stealSkill, zoneSkill } from './sim';
import { SKILLS } from './development';
import { amateurAdvanced, type StatLine } from './advanced';
import { COLLEGES, IVY_LEAGUE, MID_MAJORS, MORE_COLLEGES } from '../data/world';
import { tierOf } from '../data/leagues';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// How good his opponents are, on the ratings scale (an NBA rotation player is about 50).
export function compLevel(from: any): { c: number; label: string; college: boolean } {
  const lg = from?.lg || '', team = from?.team || '';
  if (lg === 'NCAA') return COLLEGES.includes(team) ? { c: 41, label: 'NCAA, power program', college: true } : MORE_COLLEGES.includes(team) ? { c: 38, label: 'NCAA, power conference', college: true } : IVY_LEAGUE.includes(team) ? { c: 31, label: 'NCAA, Ivy League', college: true } : MID_MAJORS.includes(team) ? { c: 34, label: 'NCAA, mid-major', college: true } : { c: 33, label: 'NCAA', college: true };
  if (lg === 'EuroLeague') return { c: 52, label: 'EuroLeague', college: false };
  if (lg === 'Overtime Elite') return { c: 29, label: 'Overtime Elite', college: false };
  const t = tierOf(lg);
  return t >= 4 ? { c: 20, label: 'Junior', college: false } : t === 3 ? { c: 23, label: 'High school', college: true } : t === 2 ? { c: 37, label: lg + ' (second division)', college: false } : { c: 45, label: lg, college: false };
}

// His game in an earlier season: the skills he had yet to add by the draft (about 3 a year in his teens, 2 at
// 20–21, 1 after), his body a little less grown.
function snapshot(p: any, yearsBack: number) {
  const r = { ...(p.am?.r || p.r) }; let age = p.dAge ?? p.age;
  for (let k = 0; k < yearsBack; k++) { age--; const d = age < 20 ? 3 : age < 22 ? 2.2 : 1.2; SKILLS.forEach(s => (r[s] = Math.max(4, r[s] - d))); ['spd', 'acc', 'jmp', 'stre'].forEach(s => (r[s] = Math.max(4, r[s] - d * 0.4))); }
  return { r, age };
}

export interface AmLine { season: number; team: string; lg: string; level: string; age: number; gp: number; mpg: number; disp: StatLine; t: StatLine }
// One season: per-possession rates from his game against the level, then a season's luck on the attempts.
export function seasonLine(p: any, season: number, yearsBack: number): AmLine {
  const rnd = mulberry32(((p.id * 2654435761) ^ (season * 40503) ^ 0xa11) >>> 0), nz = (s: number) => Math.exp(s * (rnd() + rnd() + rnd() - 1.5) * 2);
  const { r, age } = snapshot(p, yearsBack), lv = compLevel(p.from), o = ovrExact(p.am ? { ...p, r, grp: p.am.grp, intg: { ...p.intg, feel: p.am.feel }, rx: p.am.rx } : { ...p, r }), dom = o - lv.c, zs = zoneSkill(r), off = offAbility(r);
  const C = Math.max(lv.c, o - 22); // far above his competition, the edge levels off (a high-school star's numbers stay believable)
  const gp = lv.college ? 29 + Math.floor(rnd() * 7) : 22 + Math.floor(rnd() * 13);
  const mpg = +((lv.college ? cl(22 + 0.8 * dom, 6, 36) : cl(10 + 0.6 * dom, 4, 32)) * cl(nz(0.06), 0.85, 1.15)).toFixed(1);
  // Rates per possession on the floor.
  const usg = cl(0.2 * Math.exp(0.025 * (off - C - 2)) * nz(0.05), 0.09, 0.38);
  const tovR = cl(0.14 * Math.exp(-((r.drb * 0.5 + r.pss * 0.3 + r.oiq * 0.2) - C - 8) / 70) * (1 + (usg - 0.2)) * nz(0.08), 0.06, 0.26);
  const ftr = cl(0.3 * Math.exp((r.ins * 0.4 + ((r.dnk + (r.lay ?? r.dnk)) / 2) * 0.3 + r.stre * 0.15 + (r.acc ?? r.spd) * 0.15 - C - 12) / 40) * nz(0.1), 0.08, 0.75);
  const w = { rim: Math.exp((zs.rim - 55) / 15), mid: 0.6 * Math.exp((zs.mid - 55) / 15), three: 1.1 * Math.exp((r.tp - 55) / 12) }, wt = w.rim + w.mid + w.three;
  const pct = { rim: cl(0.62 + 0.0035 * (zs.rim - C - 12), 0.4, 0.8), mid: cl(0.41 + 0.003 * (zs.mid - C - 12), 0.25, 0.56), three: cl(0.355 + 0.003 * (zs.atb - C - 12), 0.18, 0.47), ft: cl(0.7 + 0.005 * (r.ft - 45), 0.4, 0.93) };
  const astR = cl(0.2 * Math.exp((r.pss * 0.6 + r.oiq * 0.2 + r.drb * 0.2 - C - 10) / 22) * nz(0.08), 0.03, 0.48);
  const rb = rebSkill(r), orbR = cl(0.05 * Math.exp((rb - C - 10) / 18) * nz(0.08), 0.01, 0.18), drbR = cl(0.14 * Math.exp((rb - C - 10) / 22) * nz(0.06), 0.06, 0.34);
  const stlR = cl(0.016 * Math.exp((stealSkill(r) - C - 10) / 20) * nz(0.1), 0.005, 0.045), blkR = cl(0.03 * Math.exp((blockSkill(r) - C - 10) / 14) * nz(0.12), 0.002, 0.15);
  const pf40 = 2.6 * (1 + (50 - r.diq) / 150);
  // A season at a given pace: possessions on the floor → attempts → makes (with their luck).
  const binom = (n: number, q: number) => Math.max(0, Math.min(n, Math.round(n * q + Math.sqrt(n * q * (1 - q)) * (rnd() + rnd() + rnd() - 1.5) * 2)));
  const build = (pace40: number, minFrame: number) => {
    const poss = (pace40 * mpg / 40) * gp, used = usg * poss, tov = Math.round(tovR * used), fta = Math.round(ftr * Math.max(0, used - tov) * 0.6), fga = Math.max(0, Math.round(used - tov - 0.44 * fta));
    const tpa = Math.round(fga * w.three / wt), rimA = Math.round(fga * w.rim / wt), midA = fga - tpa - rimA;
    const tpm = binom(tpa, pct.three), rimM = binom(rimA, pct.rim), midM = binom(midA, pct.mid), ftm = binom(fta, pct.ft), fgm = tpm + rimM + midM;
    const ast = Math.round(astR * Math.max(0, poss * 0.42 - fgm)), orb = Math.round(orbR * poss * 0.52), drb = Math.round(drbR * poss * 0.52);
    return { gp, gs: gp, min: mpg * gp * minFrame, pts: 2 * (rimM + midM) + 3 * tpm + ftm, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl: Math.round(stlR * poss), blk: Math.round(blkR * poss * 0.55), tov, pf: Math.round(pf40 * mpg / 40 * gp) } as StatLine;
  };
  // What he did (his level's pace in 40-minute games) and the same rates at an NBA pace in 48-minute terms for the formulas.
  const pace = lv.college ? 68 : 72, disp = build(pace, 1);
  return { season, team: p.from?.team || '—', lg: p.from?.lg || '', level: lv.label, age, gp, mpg, disp, t: { ...disp, min: disp.min * 48 / 40, ...scale(disp, 100 / pace) } };
}
// Counting stats at another pace (the formulas' 48-minute, NBA-pace frame).
function scale(t: StatLine, f: number): StatLine { const o: StatLine = {}; ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'].forEach(k => (o[k] = t[k] * f)); return o; }

// The seasons he played before the draft: up to four in college (from 18), four abroad (from 16), one in high
// school or a junior team; shown through the league's current season.
export const amClass = (p: any): number => (p?.cls || p?.undrafted || 0); // his draft class (undrafted players keep theirs)
// Is there a true amateur game to show? Before his first NBA summer it's p.r; after it, the copy kept then (older
// saves didn't keep one).
export const hasAmateur = (g: Game, p: any) => !!(p?.r && amClass(p) && (p.am || amClass(p) >= g.Y) && g.db.cls?.[amClass(p)]?.includes(p.id));
export function amateurSeasons(g: Game, p: any): { season: number; back: number }[] {
  if (!hasAmateur(g, p)) return [];
  const lv = compLevel(p.from), dAge = p.dAge ?? p.age, n = lv.label === 'High school' || lv.label === 'Junior' ? 1 : lv.college ? cl(dAge - 18, 1, 4) : cl(dAge - 16, 1, 4);
  const out: { season: number; back: number }[] = []; const c = amClass(p); for (let y = c - n + 1; y <= Math.min(c, g.Y); y++) out.push({ season: y, back: c - y });
  return out;
}

// A whole class's lines with their advanced stats (memoized per class, season and edit counter).
const MEMO = new WeakMap<object, { key: string; v: Record<number, (AmLine & { adv: StatLine })[]> }>();
export function classStats(g: Game, cls: number, ids: number[], gv = 0): Record<number, (AmLine & { adv: StatLine })[]> {
  const key = cls + '|' + g.Y + '|' + gv + '|' + ids.length;
  const memo = MEMO.get(g.db); if (memo?.key === key) return memo.v;
  const P = g.db.P, bySeason: Record<number, { p: any; line: AmLine }[]> = {};
  ids.forEach(id => { const p = P[id]; amateurSeasons(g, p).forEach(({ season, back }) => (bySeason[season] = bySeason[season] || []).push({ p, line: seasonLine(p, season, back) })); });
  const out: Record<number, (AmLine & { adv: StatLine })[]> = {};
  Object.keys(bySeason).forEach(y => {
    const list = bySeason[+y], adv = amateurAdvanced(g, list.map(x => ({ p: x.p, t: x.line.t })));
    list.forEach(({ p, line }) => (out[p.id] = out[p.id] || []).push({ ...line, adv: adv[p.id] || {} }));
  });
  Object.values(out).forEach(a => a.sort((x, y) => x.season - y.season));
  MEMO.set(g.db, { key, v: out });
  return out;
}

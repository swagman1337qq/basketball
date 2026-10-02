// Potential: a ceiling, not a prediction.
//  • The truth, hidden: every skill has its own ceiling (p.ceil), shaped by his development profile
//    (development.ts): a specialist's ceilings are high in his area and modest elsewhere. His full
//    ceiling is the overall he'd have with every skill there and his body at its frame's best.
//  • His development plan: from where he was when he came into the league (p.dv0) to his full ceiling,
//    spread over the years to about 27 (most of it by 23). Each year's growth is that year's share of
//    the plan times his hidden pace (paceOf) and the year's luck, work, minutes and coaching (Game.ts).
//    A typical player gets about four fifths of the way; a lost year stays lost (nothing makes it up).
//  • True potential (p.tpot): how good he could still become if everything goes extremely well (the
//    rest of his plan at a pace a quarter above normal, never past his full ceiling). For a prospect
//    that's his full ceiling; it shrinks when years go by without the growth.
//  • What the league sees (p.pot): the scouting consensus of his true potential. It's a few points off
//    for a prospect and sharpens every season he plays. AI teams draft and trade on it; your staff reads
//    your own players more closely; God Mode shows the truth.
import { BODY, bodyLeft, devProfile, groupOf, SKILLS } from './development';
import { ovrExact, OVR_ADJ, OVR_W, wngBonus } from './ratings';
import { mulberry32 } from './rng';
import { rollGem } from './intangibles';

// His plan: the share of his growth planned at each age (from 18; renormalized from his first season).
const W_AGE: Record<number, number> = { 18: 0.14, 19: 0.15, 20: 0.15, 21: 0.14, 22: 0.13, 23: 0.11, 24: 0.09, 25: 0.07, 26: 0.05, 27: 0.03, 28: 0.01 };
const wAge = (a: number) => (a < 18 ? 0 : W_AGE[a] ?? 0);
const wRem = (a: number) => { let s = 0; for (let x = Math.max(18, a); x <= 28; x++) s += wAge(x); return s; };
export const TYPICAL = 0.77; // how much of his plan a typical player gets (pace, minutes, luck); sets a new player's ceilings
const BEST = 1.25; // "everything goes extremely well": a quarter above a normal pace all the way
// His development pace, hidden and fixed: most develop at a normal pace, about one in nine barely
// develops at all (the prospect who never gets better), about one in seven develops fast.
export function paceOf(p: any) { const r = mulberry32(((p.id * 2246822519) ^ 0x51ce) >>> 0), u = r(); return +(u < 0.11 ? 0.1 + 0.2 * r() : u < 0.85 ? 0.75 + 0.35 * r() : 1.1 + 0.2 * r()).toFixed(2); }
export const paceLabel = (x: number) => (x < 0.4 ? 'barely develops' : x < 0.85 ? 'a little slow' : x < 1.1 ? 'normal' : 'fast');

const val = (p: any, k: string) => p.r[k] + ((p.rx || {})[k] || 0);
function ovrOf(p: any, v: Record<string, number>) {
  const W = OVR_W[p.grp] || OVR_W.W; let a = 0, t = 0;
  for (const k in W) { const x = v[k] ?? val(p, k); if (x == null) continue; a += W[k] * x; t += W[k]; }
  return (t ? a / t : 50) + wngBonus(p) - (OVR_ADJ[p.grp] ?? 2.5);
}
const withBody = (p: any, c: Record<string, number>) => { const v = { ...c }; BODY.forEach(k => (v[k] = val(p, k) + bodyLeft(p, k))); return v; };
const current = (p: any) => Object.fromEntries(SKILLS.map(k => [k, val(p, k)]));
const plan0 = (p: any) => p.dv0 || { o: ovrExact(p), a: p.age };
// His full ceiling: every skill at its ceiling (or where it is, if he's past it), his body at its best.
export function fullCeil(p: any) { const c: Record<string, number> = {}; SKILLS.forEach(k => (c[k] = Math.max(val(p, k), p.ceil?.[k] ?? val(p, k)))); return ovrOf(p, withBody(p, c)); }
// This age's planned growth at a normal pace (Game.devRate multiplies it by his pace); it fades out
// in the last few points under his full ceiling.
export function planRate(p: any, age: number) {
  const d = plan0(p), W = wRem(d.a), F = fullCeil(p), o = ovrExact(p); if (W <= 0) return 0;
  return (Math.max(0, F - d.o) * wAge(age) * (d.k ?? 1)) / W * Math.min(1, Math.max(0, F - o) / 3);
}
// True potential: his overall plus the rest of his plan at its best, never past his full ceiling.
function trueOf(p: any, F: number) { const d = plan0(p), W = wRem(d.a), o = ovrExact(p); return Math.min(F, o + (W > 0 ? (Math.max(0, F - d.o) * wRem(p.age) * BEST * (d.k ?? 1)) / W : 0)); }
export function truePot(p: any) { return Math.max(p.ovr, Math.min(100, Math.round(trueOf(p, fullCeil(p))))); }

// The shape of his ceilings: by his development profile, plus a little per skill (fixed for him).
function gapShape(p: any) { const d = devProfile(p), r = mulberry32(((p.id * 2654435761) ^ 0x7e11) >>> 0), w: Record<string, number> = {}; SKILLS.forEach(k => (w[k] = d.aff[groupOf(k)] * (0.6 + 0.8 * r()))); return w; }
// Move his skill ceilings from `base` along his shape until his full ceiling is F.
function fit(p: any, base: Record<string, number>, F: number) {
  const w = gapShape(p), at = (t: number) => Object.fromEntries(SKILLS.map(k => [k, Math.max(val(p, k), Math.min(99, base[k] + t * w[k]))]));
  let lo = -120, hi = 120;
  for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; if (ovrOf(p, withBody(p, at(m))) < F) lo = m; else hi = m; }
  const c = at((lo + hi) / 2); p.ceil = Object.fromEntries(SKILLS.map(k => [k, +c[k].toFixed(1)]));
}
const startPlan = (p: any) => { p.dv0 = { o: +ovrExact(p).toFixed(2), a: p.age }; };
// A new player: his plan starts now, with ceilings set so a typical career peaks at `peak`. When the
// rating scale cuts his ceiling short (a raw star prospect would need skills past 99), his plan aims
// that much higher (dv0.k), so he still peaks around `peak` on average, just closer to his ceiling.
export function initCeil(p: any, peak: number) {
  startPlan(p); const o = p.dv0.o, want = o + Math.max(0, peak - o) / TYPICAL; fit(p, current(p), want);
  const got = fullCeil(p) - o; if (got > 0.5 && want - o > got + 0.05) p.dv0.k = +Math.min(1.25, (want - o) / got).toFixed(3);
}
// Set his true potential to T (God Mode, player cards): a fresh plan from now, his full ceiling at T.
export function setTruePot(p: any, T: number) { startPlan(p); fit(p, current(p), Math.max(p.dv0.o, T)); refreshPot(p); }
// Raise or lower his true potential by d points (a breakout, a serious injury, a hidden gem surfacing).
export function moveTruePot(p: any, d: number) {
  if (!d) return; if (!p.ceil) initCeil(p, p.pot ?? p.ovr);
  const F = fullCeil(p), dp = plan0(p), W = wRem(dp.a), r = W > 0 ? (wRem(p.age) * BEST) / W : 0, capped = trueOf(p, F) >= F - 0.01;
  fit(p, p.ceil, F + d / (capped ? 1 : Math.max(0.25, r)));
}
// God Mode raised a rating past its ceiling: that's his new ceiling there.
export function liftCeil(p: any) { if (!p.ceil) return; SKILLS.forEach(k => { if (p.ceil[k] < p.r[k]) p.ceil[k] = p.r[k]; }); }

// The consensus: true potential plus the league's miss (p.perr), never below his overall.
export function refreshPot(p: any) { if (!p?.r) return; if (!p.ceil) initCeil(p, p.pot ?? p.ovr); p.tpot = truePot(p); p.pot = Math.max(p.ovr, Math.min(100, Math.round(p.tpot + (p.perr || 0)))); }
// The scouts' miss on a new player (points of potential, either way; fixed from his id).
export function rollPerr(p: any, sd: number) { const r = mulberry32(((p.id * 40503) ^ 0x9e11) >>> 0); p.perr = +((r() + r() + r() - 1.5) * 2 * sd).toFixed(2); }
// Every summer the league learns more: the miss shrinks (gone by 27).
export function sharpen(p: any, rnd: () => number = Math.random) { p.perr = p.age >= 27 ? 0 : +((p.perr || 0) * 0.75 + (rnd() + rnd() + rnd() - 1.5) * 2 * 0.6).toFixed(2); }
// How far a team's scouts miss on top of the league's read (points of potential, typical size): the
// scouting budget buys accuracy. Easy mode's forgiving scouting cuts it to a third.
export const scoutSd = (budget = 4, easy = false) => Math.max(0.6, Math.min(4, 4.2 - 0.3 * budget)) * (easy ? 0.35 : 1);
// A team's own read of another team's player: the league's read plus its scouts' miss, fixed for that
// team and player (scouts hold their opinions), smaller for older players whose game is known.
export function teamRead(p: any, tid: number, sd: number) {
  const r = mulberry32((((tid + 3) * 2246822519) ^ (p.id * 3266489917)) >>> 0), youth = Math.max(0.25, Math.min(1, (27 - p.age) / 8));
  return Math.max(p.ovr, Math.min(100, Math.round(p.pot + (r() + r() + r() - 1.5) * 2 * sd * youth)));
}
// What a viewer sees: God Mode the truth; your staff your own players almost exactly; anyone else your
// scouts' read (tid/sd) or, without them, the league's read.
export function potView(p: any, o: { god?: boolean; own?: boolean; tid?: number; sd?: number }) { if (!p) return 0; const t = p.tpot ?? p.pot; return o.god ? t : o.own ? Math.max(p.ovr, Math.round(t + (p.perr || 0) * 0.3)) : o.tid != null ? teamRead(p, o.tid, o.sd ?? 2) : p.pot; }
// Where he stands against his development plan (for reports): 'behind', 'ahead', or null (on track, or done).
export function planStatus(p: any): 'behind' | 'ahead' | null {
  const d = p.dv0; if (!d || p.age > 27) return null; const W = wRem(d.a), F = fullCeil(p), gap = F - d.o; if (W <= 0 || gap < 4) return null;
  const done = (ovrExact(p) - d.o) / gap, due = TYPICAL * (1 - wRem(p.age + 1) / W);
  return done < due - 0.15 ? 'behind' : done > due + 0.15 ? 'ahead' : null;
}
// An undrafted or fringe player (the CCP's player pool, tryouts and draft): the overwhelming majority
// never become NBA players, about one in a hundred becomes a bench player, about one in five hundred a
// starter, a high-level player is rarer still, and a star is a once-in-a-decade story (Ben Wallace,
// Austin Reaves). His expected peak is drawn from that ladder; the younger he is, the more of a climb
// is possible. His hidden gem chance is low (late bloomers, VanVleet and Caruso types), and the
// league's read of him is rougher (fewer scouts watch him).
export function fringePeak(p: any, rnd: () => number) {
  const u = rnd(), young = Math.max(0.2, Math.min(1, (25 - p.age) / 4)), o = p.ovr;
  const draw = u < 0.988 ? o + rnd() * 4 * young : u < 0.9975 ? 48 + rnd() * 7 : u < 0.9993 ? 56 + rnd() * 5 : u < 0.99985 ? 62 + rnd() * 3 : 66 + rnd() * 6;
  return Math.round(Math.max(o, o + (draw - o) * (0.35 + 0.65 * young)));
}
export function makeFringe(p: any, rnd: () => number = Math.random) {
  delete p.gem; rollGem(p, rnd, 0.01);
  // His hidden gem is a late bloom into a role player or, now and then, a starter; a star is the ladder's call.
  if (p.gem) { const add = rnd() < 0.8 ? 4 + Math.floor(rnd() * 5) : 9 + Math.floor(rnd() * 5); p.gem = { add, left: add, tier: add >= 9 ? 'starter' : 'role' }; }
  initCeil(p, fringePeak(p, rnd)); rollPerr(p, 4.5); refreshPot(p);
}
// His ceilings in each skill (God Mode), highest first.
export function ceilList(p: any): [string, number][] { return p.ceil ? (Object.entries(p.ceil) as [string, number][]).map(([k, v]) => [k, Math.round(v)] as [string, number]).sort((a, b) => b[1] - a[1]) : []; }

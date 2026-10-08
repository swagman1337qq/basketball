// Playing style: how a player chooses to shoot, apart from how well he shoots. Ratings decide ability
// (whether the shot goes in); tendencies decide behavior (how much of the offense he takes on, where
// his shots come from, how he gets them, how often he gets to the line).
//
// Stored on the player (p.ten, tenV 4) the way the NBA reports them:
//   Location: shares of all his shots, adding up to 100% (NBA.com shooting by zone)
//     ra      Restricted Area          paint   In the Paint (Non-RA)    mid   Mid-Range
//     c3      Corner 3                 atb     Above the Break 3
//   Creation: shares of his jump shots (mid-range and threes), adding up to 100%
//     cns     Catch & Shoot (no dribble)        pullup  Pull-Up (off the dribble)
//     step    Stepback (a pull-up off a step back: harder to make, almost never blocked)
//     fade    Fadeaway (fading or turning away, often from the post: hard to make, almost never blocked)
//   Separate, as a 0–100 score (50 = league typical):
//     usage   Usage rate (USG%): how much of the offense he takes on (shown as USG% through the engine)
//     ftr     Free throw rate: free throw attempts per field goal attempt
// What you set is what he takes; his ratings decide how many go in (sim.ts), and each creation type
// plays differently there (make rate, assisted, blocked).
//
// Each has a target: what his current abilities, role, team situation and personality point to,
// plus a personal quirk that never changes (two players with the same ratings don't play alike).
// Tendencies move toward the target gradually and probabilistically: a big step chance each summer
// after development, a small one month to month in season, the shares always adding up to 100.
// Young players adapt fastest; veterans keep their habits, except that a body that has lost its
// burst has to adapt (fewer shots at the rim, fewer trips to the line).
//
// Shot volume (usage) is a behavior too, not his overall. It moves toward what his offensive game,
// his role and his personality point to: a player who becomes a better scorer or a more complete
// creator, or grows an elite weapon, or becomes his team's best option, takes on more of the
// offense over a season or two (young players grow into a bigger role fastest); one whose game
// declines, or who joins a team with better options, gives some back. Egotistic, ball-dominant and
// selfish players take more shots than their game earns, and believe in shots they can't make.
import { BASE, CRE_BASE, DEFAULT_NORMS, offAbility, PAINT_SHARE, shotProfile, usageRaw, type Cre, type Norms, type Tend } from './sim';
export { offAbility };

export const TEN_KEYS = ['usage', 'ra', 'paint', 'mid', 'c3', 'atb', 'cns', 'pullup', 'step', 'fade', 'ftr'] as const;
export type TenKey = (typeof TEN_KEYS)[number];
export const ZONE_TEN = ['ra', 'paint', 'mid', 'c3', 'atb'] as const;
export type ZoneTen = (typeof ZONE_TEN)[number];
export const CRE_TEN = ['cns', 'pullup', 'step', 'fade'] as const;
export type CreTen = (typeof CRE_TEN)[number];
export const TEN_LABEL: Record<TenKey, string> = { usage: 'Usage rate', ra: 'Restricted Area', paint: 'In the Paint (Non-RA)', mid: 'Mid-Range', c3: 'Corner 3', atb: 'Above the Break 3', cns: 'Catch & Shoot', pullup: 'Pull-Up', step: 'Stepback', fade: 'Fadeaway', ftr: 'Free throw rate' };
// The NBA's definitions (NBA.com stats: advanced, shooting by zone, shot dashboard, four factors).
export const TEN_DESC: Record<TenKey, string> = {
  usage: 'Usage rate (USG%): the share of his team’s plays he uses (shots, free-throw trips, turnovers) while he’s on the floor',
  ra: 'Restricted Area (shooting by zone): shots inside the restricted-area arc, four feet from the basket, as a share of his shots',
  paint: 'In the Paint (Non-RA) (shooting by zone): shots in the paint outside the restricted area (floaters, hooks, short turnarounds), as a share of his shots',
  mid: 'Mid-Range (shooting by zone): shots outside the paint and inside the three-point line, as a share of his shots',
  c3: 'Corner 3 (shooting by zone): threes from either corner, below the break, as a share of his shots',
  atb: 'Above the Break 3 (shooting by zone): threes from anywhere but the corners, as a share of his shots',
  cns: 'Catch & Shoot: jump shots off a pass with no dribble, as a share of his jump shots. The easiest jumper, and almost always assisted',
  pullup: 'Pull-Up: jump shots off the dribble, as a share of his jump shots. A little harder than catch-and-shoot, rarely assisted; his handle helps',
  step: 'Stepback: pull-ups off a step back for space, as a share of his jump shots. Harder to make unless he has the handle and quickness, almost never blocked',
  fade: 'Fadeaway: jumpers fading or turning away (often from the post), as a share of his jump shots. Hard to make, almost never blocked; mid-range touch, size and strength help',
  ftr: 'Free throw rate (FTA rate, one of the four factors): free throw attempts per field goal attempt',
};
// League shares of each zone (the engine's baselines; the paint and mid-range split its mid tier).
const ZB: Record<ZoneTen, number> = { ra: BASE.zone.rim.share, paint: BASE.zone.mid.share * PAINT_SHARE, mid: BASE.zone.mid.share * (1 - PAINT_SHARE), c3: BASE.zone.c3.share, atb: BASE.zone.atb.share };
// NBA units: league-typical value at 50, spread `k` (`kLo` below 50, where a zone falls off faster:
// a non-shooter takes almost no threes, a great shooter only somewhat more than most), cap. Usage is
// shown through the engine (expUsg), the zones through his whole shot mix (zoneShares, adding up to
// 100%), catch & shoot and pull-ups through his jump shots. Version 3 only (fromLegacy), and free throw rate.
type UnitKey = ZoneTen | 'cns' | 'pullup' | 'ftr'; // the version 3 scales (free throw rate still uses its own)
const UNIT: Record<UnitKey, { typ: number; k: number; kLo?: number; max: number; dp: number; suf: string }> = {
  ra: { typ: ZB.ra * 100, k: 28, kLo: 22, max: 85, dp: 0, suf: '% of shots' }, paint: { typ: ZB.paint * 100, k: 28, kLo: 22, max: 60, dp: 0, suf: '% of shots' }, mid: { typ: ZB.mid * 100, k: 28, kLo: 22, max: 60, dp: 0, suf: '% of shots' },
  c3: { typ: ZB.c3 * 100, k: 34, kLo: 14, max: 45, dp: 0, suf: '% of shots' }, atb: { typ: ZB.atb * 100, k: 38, kLo: 14, max: 80, dp: 0, suf: '% of shots' },
  cns: { typ: 30, k: 30, max: 85, dp: 0, suf: '% of shots' }, pullup: { typ: 22, k: 20, max: 70, dp: 0, suf: '% of shots' },
  ftr: { typ: 0.253, k: 42, max: 0.9, dp: 3, suf: ' FTA per FGA' }, // fitted to what players actually shoot (the engine's foul share is steeper: FTR_K)
};
export const tenUnit = (k: UnitKey, score: number) => { const u = UNIT[k]; return Math.min(u.max, u.typ * Math.exp((score - 50) / (score < 50 && u.kLo ? u.kLo : u.k))); };
export const tenScore = (k: UnitKey, val: number) => { const u = UNIT[k], x = Math.log(Math.max(0.001, val) / u.typ); return cl(50 + (x < 0 && u.kLo ? u.kLo : u.k) * x, 2, 98); };
export const tenFmt = (k: UnitKey, val: number) => { const u = UNIT[k]; return (u.dp === 3 ? val.toFixed(3).replace(/^0/, '') : val.toFixed(u.dp)) + u.suf; };
export const tenSuffix = (k: UnitKey) => UNIT[k].suf.trim();

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (id: number, salt: number) => ((((id + 1) * 2654435761) ^ (salt * 40503)) >>> 0) % 100000 / 100000;
const nrmH = (id: number, salt: number) => (hash(id, salt) + hash(id, salt + 7) + hash(id, salt + 13) - 1.5) * 2; // about N(0, 1)

// His personal quirks: fixed per player (and per tendency), about ±7 on the 0–100 scale (±3.5 for shot volume).
const SALT: Record<TenKey, number> = { usage: 0, cns: 6, pullup: 7, mid: 8, ra: 11, paint: 12, c3: 13, atb: 14, ftr: 15, step: 16, fade: 17 }; // fixed, so quirks survive list changes
export const quirkOf = (p: any, k: TenKey) => (p.tenQ?.[k] ?? +(nrmH(p.id, 101 + SALT[k]) * (k === 'usage' ? 3.5 : 7)).toFixed(1));

// Defense and rebounding, on the same scale as offAbility: the gap says scorer or specialist.
export const defAbility = (r: any) => r.diq * 0.3 + ((r.blk ?? r.diq) + (r.stl ?? r.diq)) * 0.1 + r.reb * 0.2 + (r.box ?? r.reb) * 0.1 + r.stre * 0.1 + r.hgt * 0.1;

// His team context, when known: his place among its rotation as an offensive option (0 = first
// option), and where the team is headed (Game.strategies). A bare number is the rank.
export interface TenCtx { rank?: number | null; mode?: 'rebuild' | 'middle' | 'contend'; roles?: string[] } // roles (Game.rolesOf) tilt where his shots come from
const ctxOf = (c?: number | null | TenCtx): TenCtx => (typeof c === 'number' ? { rank: c } : c || { rank: null });

// Where his game points today. Each style is read against his own offensive level (what he does
// best compared with the rest of his game), plus a little for level itself, since better players
// create a bit more of everything.
export function tenTargets(p: any, ctx?: number | null | TenCtx): Record<TenKey, number> {
  const r = p.r || {}, f = p.pers || {}, g = p.grp, big = g === 'B', guard = g === 'G', wing = !big && !guard, age = p.age ?? 25, { rank, mode } = ctxOf(ctx);
  const t = (v: number) => cl(v, 2, 98), acc = r.acc ?? r.spd, finish = Math.max(r.dnk, r.lay ?? r.dnk), lay = r.lay ?? r.dnk;
  const L = (r.drb + r.pss + r.fg + r.tp + r.ins + finish + acc + r.oiq) / 8, rel = (x: number) => x - L + 0.3 * (L - 52);
  const shoot3 = r.tp < 40 ? 50 + (r.tp - 50) * 2.2 : 50 + rel(r.tp) * 0.7; // non-shooters stop taking threes
  const handle = (r.drb + acc) / 2, postSk = r.ins * 0.5 + r.stre * 0.25 + r.hgt * 0.25, offA = offAbility(r);
  // At the rim: drives and cuts for a guard or wing; rolls, lobs, putbacks and deep post seals for a big.
  const rimSk = big ? r.dnk * 0.3 + r.hgt * 0.25 + r.jmp * 0.2 + r.ins * 0.25 : finish * 0.4 + acc * 0.3 + r.drb * 0.15 + r.spd * 0.15;
  // Drawing fouls: attacking off the dribble, or a big's strength and touch inside.
  const attack = big ? postSk * 0.45 + r.dnk * 0.3 + r.stre * 0.25 : acc * 0.3 + r.spd * 0.15 + r.drb * 0.25 + finish * 0.3;
  const out: Record<TenKey, number> = {
    ra: t(41 + rel(rimSk) * 1.1 + (big ? 10 : guard ? -3 : 0) + (r.tp < 40 ? (40 - r.tp) * 0.5 : 0) - (age >= 31 ? (age - 30) * 1.5 : 0)),
    paint: t(42 + rel(big ? postSk : lay * 0.5 + r.fg * 0.3 + r.drb * 0.2) * 1.0 + (big ? 8 : guard ? -2 : 0) + (age >= 30 && big ? 3 : 0)), // a big's hooks, a guard's floaters
    mid: t(46 + rel(r.fg) * 1.2 + (f.alpha ? 4 : 0) + (f.touches ? 4 : 0) + (f.volatile ? 3 : 0) + (age >= 31 ? 4 : 0) - (big && r.fg < 50 ? 6 : 0)),
    c3: t(5 + shoot3 + (wing ? 6 : guard ? -3 : -6) - (handle - L) * 0.4 + (f.team ? 4 : 0)), // spot-up shooters wait in the corners
    atb: t(5 + shoot3 + (guard ? 4 : big ? -8 : 0) + (handle - L) * 0.3 + (f.heat ? 4 : 0) + (f.alpha ? 2 : 0)), // ball handlers pull up from the top
    cns: t((r.tp < 40 ? 50 + (r.tp - 50) * 1.8 : 50 + rel(r.tp) * 0.85) - (handle - L) * 0.5 + (f.team ? 8 : 0) + (f.pro ? 3 : 0)),
    pullup: t(50 + rel((r.drb + (r.fg + r.tp) / 2) / 2) * 1.3 + (f.heat ? 6 : 0) + (f.flashy ? 3 : 0) + (f.alpha ? 3 : 0) + (f.touches ? 3 : 0) + (big ? -10 : 0)),
    // Stepbacks take a handle, quickness and range; showmen, heat checkers and alphas love them; bigs rarely.
    step: t(50 + rel((r.drb + acc + Math.max(r.tp, r.fg)) / 3) * 1.3 + (f.flashy ? 5 : 0) + (f.heat ? 4 : 0) + (f.alpha ? 3 : 0) + (big ? -16 : wing ? -2 : 2) - (age >= 32 ? (age - 31) * 1.5 : 0)),
    // Fadeaways and turnarounds: mid-range touch and a post game; veterans who lost a step lean on them.
    fade: t(50 + rel(r.fg * 0.55 + postSk * 0.45) * 1.1 + (f.alpha ? 3 : 0) + (f.touches ? 3 : 0) + (big ? 3 : guard ? -3 : 0) + (age >= 30 ? (age - 29) * 1.2 : 0)),
    ftr: t(41.5 + rel(attack) * 1.1 + (big ? 3 : 0) + (f.fearless ? 2 : 0) + (f.flashy ? 1 : 0) - (age >= 32 ? age - 31 : 0)),
    usage: 50,
  };
  // Shot volume, on top of what his offensive game earns him right away in the engine (usageRaw):
  // - his level as a scorer and creator against the league (rotation players average about 57):
  //   a better scorer or a more complete creator earns a bigger share, a declining one gives it back;
  // - an elite scoring weapon earns shots even in a narrow game (a sniper, a rim finisher);
  // - a scorer more than a stopper wants the ball; a defensive specialist is asked to fit in;
  // - his role: the first option carries the load, the fifth fits in; on a rebuilding team the young
  //   talent gets the ball, on a contender a young role player waits his turn;
  // - personality: egotistic, ball-dominant and selfish players want more shots than their game earns
  //   and believe in shots they can't make (a weak game pulls the egotistic and selfish down only half
  //   as much); heat checkers, fearless and legacy-driven players a little more; team players fewer;
  // - a pass-first player finishes fewer possessions; a teenager defers unless he's the best option;
  //   veterans hand some over.
  const rimS = 0.25 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.3 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, weapon = Math.max(rimS, r.fg, r.tp);
  const belief = f.alpha || f.padder ? 0.5 : f.touches ? 0.7 : f.heat || f.fearless ? 0.85 : 1, lvl = (offA - 57) * 0.55;
  const ego = cl((f.alpha ? 6 : 0) + (f.touches ? 4 : 0) + (f.padder ? 3 : 0) + (f.heat ? 2 : 0) + (f.fearless ? 2 : 0) + (f.legacy ? 1.5 : 0) + (f.flashy ? 1 : 0) + (f.volatile ? 1 : 0) - (f.team ? 5 : 0), -5, 8); // traits overlap: one appetite
  const rankB = rank == null ? 0 : [6, 3, 0, -2, -4, -5, -6][Math.min(6, rank)];
  const situation = age > 24 ? 0 : mode === 'rebuild' ? 3 : mode === 'contend' && (rank ?? 9) > 0 ? -2 : 0;
  out.usage = t(48 + (lvl < 0 ? lvl * belief : lvl) + cl((weapon - 64) * 0.25, 0, 4) + cl((offA - defAbility(r)) * 0.35, -6, 3) + rankB + situation + ego
    - cl((r.pss - offA) * 0.12, -3, 4) + (age <= 20 && (rank ?? 9) > 0 ? -3 : 0) + (age >= 33 ? -3 : 0));
  return out;
}

// ── Shares ─────────────────────────────────────────────────────────────────────────────────────────
// Round a group of shares to one decimal so they add up to exactly 100 (`keep` stays as given and the
// others make room in proportion).
export function round100<T extends string>(o: Record<T, number>, keep?: T): Record<T, number> {
  const ks = Object.keys(o) as T[], out = {} as Record<T, number>, pos = (k: T) => Math.max(0, +o[k] || 0);
  const others = keep ? ks.filter(k => k !== keep) : ks, ot = others.reduce((a, k) => a + pos(k), 0);
  let rest = 100;
  if (keep) { out[keep] = Math.round(cl(+o[keep] || 0, 0, 100) * 10) / 10; rest = 100 - out[keep]; }
  others.forEach(k => (out[k] = Math.round((ot > 0 ? (pos(k) * rest) / ot : rest / others.length) * 10) / 10));
  const diff = Math.round((100 - ks.reduce((a, k) => a + out[k], 0)) * 10) / 10;
  if (diff && others.length) { const big = others.reduce((a, k) => (out[k] > out[a] ? k : a), others[0]); out[big] = Math.round((out[big] + diff) * 10) / 10; }
  return out;
}
// Calibration of the location targets: a league of target mixes lands on the NBA's shares (BASE).
const TCAL: Record<ZoneTen, number> = { ra: 1.03, paint: 1.17, mid: 1.12, c3: 0.86, atb: 0.93 };
const CCAL: Record<CreTen, number> = { cns: 1.083, pullup: 1.016, step: 0.73, fade: 0.86 };
// How far a score moves a share off the league's: [above 50, below 50] (non-shooters fall off fast).
const ZK: Record<ZoneTen, [number, number]> = { ra: [28, 22], paint: [28, 22], mid: [28, 22], c3: [34, 14], atb: [38, 14] };
const CK: Record<CreTen, number> = { cns: 22, pullup: 20, step: 15, fade: 15 };
const roleMult = (k: ZoneTen, roles: string[]) => (k === 'ra' && roles.includes('Slasher') ? 1.3 : 1) * ((k === 'c3' || k === 'atb') && roles.includes('Floor spacer') ? 1.25 : 1)
  * (k === 'c3' && roles.includes('3-and-D wing') ? 1.4 : 1) * ((k === 'c3' || k === 'atb') && roles.includes('Stretch big') ? 1.5 : 1);
// Shares from scores (50 = league typical): a zone's weight is its league share scaled by his score,
// tilted by his roles, then the zones add up to 100; the same for the four ways he creates jumpers.
export function sharesFromScores(sc: Partial<Record<TenKey, number>>, roles: string[] = []): Record<ZoneTen | CreTen, number> {
  const z = {} as Record<ZoneTen, number>, c = {} as Record<CreTen, number>;
  ZONE_TEN.forEach(k => { const d = (sc[k] ?? 50) - 50; z[k] = ZB[k] * TCAL[k] * Math.exp(d / (d < 0 ? ZK[k][1] : ZK[k][0])) * roleMult(k, roles); });
  CRE_TEN.forEach(k => (c[k] = CRE_BASE[k] * CCAL[k] * Math.exp(((sc[k] ?? 50) - 50) / CK[k])));
  return { ...round100(z), ...round100(c) };
}
const quirks = (p: any) => Object.fromEntries(TEN_KEYS.map(k => [k, quirkOf(p, k)])) as Record<TenKey, number>;
// His targets: usage and free throw rate as scores, location and creation as shares, quirks included.
export function targetTen(p: any, ctx?: number | null | TenCtx): Record<TenKey, number> {
  const tg = tenTargets(p, ctx), q = quirks(p), sc = {} as Record<TenKey, number>;
  TEN_KEYS.forEach(k => (sc[k] = cl(tg[k] + q[k], 2, 98)));
  return { ...sharesFromScores(sc, ctxOf(ctx).roles || []), usage: Math.round(sc.usage * 10) / 10, ftr: Math.round(sc.ftr * 10) / 10 };
}

// A new player (or one from an older save): his tendencies start where his game points, plus quirks.
export function initTendencies(p: any, ctx?: number | null | TenCtx) {
  p.tenQ = quirks(p);
  p.ten = targetTen(p, ctx); p.tenV = 4;
  return p.ten;
}
// Hand-set multipliers (older saves' God Mode fine-tuning, player cards) on the engine's zones, foul
// drawing, assisted makes and usage, turned into the same change on his (version 3) scores.
export function applyMult(p: any, h: any) {
  if (!h || !p.ten) return;
  const add = (k: TenKey, m: number, kk: number) => { if (m > 0 && isFinite(m) && p.ten[k] != null) p.ten[k] = Math.round(cl(p.ten[k] + kk * Math.log(m), 2, 98)); };
  const zk = (k: ZoneTen, m: number) => (m < 1 ? UNIT[k].kLo ?? UNIT[k].k : UNIT[k].k);
  add('ra', h.rim, zk('ra', h.rim)); add('paint', h.mid, zk('paint', h.mid)); add('mid', h.mid, zk('mid', h.mid)); add('c3', h.c3, zk('c3', h.c3)); add('atb', h.atb, zk('atb', h.atb));
  add('ftr', h.draw, FTR_K); add('usage', h.usg, USG_K);
  if (h.ast > 0) { add('cns', h.ast, 30); add('pullup', 1 / h.ast, 30); } // assisted rate = exp((C&S − pull-up) / 60)
}
// Version 3 (2026-10-07 and before) stored every tendency as a 0–100 score that the engine turned into a
// shot mix. Turn one into the shot mix it played (the same norms and roles the engine used), so a save
// or card plays the same; stepbacks and fadeaways (new) come from his game, carved out of his pull-ups
// and catch-and-shoot jumpers in proportion.
export function fromLegacy(p: any, norms?: Norms | null, roles: string[] = []) {
  const t = p.ten, w = (k: ZoneTen) => tenUnit(k, t[k] ?? 50) / UNIT[k].typ, wp = ZB.paint * w('paint'), wm = ZB.mid * w('mid'), pf = wp / (wp + wm);
  const prof = shotProfile({ r: p.r, roles, tend: { rim: w('ra'), mid: (wp + wm) / (ZB.paint + ZB.mid), pf, c3: w('c3'), atb: w('atb') }, pers: p.pers, grp: p.grp }, norms || DEFAULT_NORMS);
  const zones = round100({ ra: prof.rim, paint: prof.mid * pf, mid: prof.mid * (1 - pf), c3: prof.c3, atb: prof.atb });
  const tg = targetTen({ ...p, ten: undefined }, { roles }), sf = Math.min(60, tg.step + tg.fade);
  const wc = 0.53 * tenUnit('cns', t.cns ?? 50) / UNIT.cns.typ, wu = 0.47 * tenUnit('pullup', t.pullup ?? 50) / UNIT.pullup.typ;
  const cre = round100({ cns: (100 - sf) * wc / (wc + wu), pullup: (100 - sf) * wu / (wc + wu), step: tg.step, fade: tg.fade });
  p.ten = { usage: t.usage ?? 50, ftr: t.ftr ?? 50, ...zones, ...cre }; p.tenV = 4;
  p.tenQ = { ...quirks(p), ...(p.tenQ || {}) }; delete p.tenPrev; // last summer's arrows were on the old scale
  return p.ten;
}
// Keys from before the NBA's shot categories, removed on load.
const OLD_KEYS = ['drive', 'iso', 'pnr', 'roll', 'post', 'three', 'pass'];
const V3_KEYS = ['usage', 'ra', 'paint', 'mid', 'c3', 'atb', 'cns', 'pullup', 'ftr'] as const;
// Every player gets version 4 tendencies: new players from their game; older saves move over through
// version 3 (hand-set multipliers included) to the shot mix they played. `norms` and `roles` are what the
// engine used then (Game passes them when a save loads; defaults otherwise).
export function ensureTen(p: any, norms?: Norms | null, roles?: string[]) {
  if (!p?.r) return null;
  if (!p.ten || !p.tenQ) { if (p.ten && p.tenV === 3 && !p.tenQ) p.tenQ = quirks(p); else { initTendencies(p); delete p.tend; return p.ten; } }
  if (p.tenV !== 4) {
    if (p.tenV !== 3 || V3_KEYS.some(k => p.ten[k] == null)) { // from before the NBA's categories: keep usage, catch & shoot, pull-ups and mid-range
      const tg = tenTargets(p, null), keep = p.tenV === 3 ? V3_KEYS : ['usage', 'cns', 'pullup', 'mid'];
      V3_KEYS.forEach(k => { if (p.ten[k] == null || !keep.includes(k)) { p.tenQ[k] = quirkOf(p, k); p.ten[k] = Math.round(cl(tg[k] + p.tenQ[k], 2, 98)); } });
      OLD_KEYS.forEach(k => { delete p.ten[k]; delete p.tenQ[k]; });
    }
    if (p.tend) applyMult(p, p.tend);
    fromLegacy(p, norms, roles);
  }
  delete p.tend;
  return p.ten;
}

// One step of evolution. `frac` is how big a step this is (1 = a summer, about 0.15 = a month);
// `prob` the chance each tendency (each group of shares) moves at all this time. Returns the changes.
export function evolveTendencies(p: any, ctx: number | null | TenCtx, frac: number, prob: number, rnd: () => number = Math.random): Record<string, number> {
  if (!ensureTen(p) || p.tenLock) return {};
  const tg = targetTen(p, ctx), age = p.age ?? 25, ageF = age <= 24 ? 1.25 : age <= 29 ? 1 : age <= 33 ? 0.8 : 0.65, before = { ...p.ten }, d: Record<string, number> = {};
  (['usage', 'ftr'] as const).forEach(k => {
    if (rnd() > prob) return;
    const cur = p.ten[k], gap = tg[k] - cur;
    let rate = (k === 'usage' ? 0.45 : 0.3) * ageF * (0.5 + rnd());
    if (k === 'usage' && gap > 0 && age <= 25) rate *= 1.25; // a young player who's earned a bigger role grows into it quickly
    if (k === 'usage' && gap < 0 && !(p.pers?.alpha || p.pers?.padder || p.pers?.touches)) rate *= 1.3; // a fading game loses its shots, unless his ego won't let go
    if (gap < 0 && age >= 30 && k === 'ftr') rate *= 1.4; // the body forces it
    p.ten[k] = Math.round(cl(cur + gap * Math.min(1, rate * frac) + (rnd() + rnd() - 1) * 1.5 * Math.sqrt(frac), 2, 98) * 10) / 10;
  });
  // The shares move as a group (they always add up to 100): toward his targets, with a little noise.
  for (const keys of [ZONE_TEN, CRE_TEN] as readonly (readonly (ZoneTen | CreTen)[])[]) {
    if (rnd() > prob) continue;
    const nx = {} as Record<string, number>;
    keys.forEach(k => { const cur = p.ten[k] ?? 0, gap = tg[k] - cur; let rate = 0.3 * ageF * (0.5 + rnd()); if (gap < 0 && age >= 30 && k === 'ra') rate *= 1.4;
      nx[k] = Math.max(0, cur + gap * Math.min(1, rate * frac) + (rnd() + rnd() - 1) * 0.08 * Math.sqrt(frac) * Math.max(2, cur)); });
    Object.assign(p.ten, round100(nx));
  }
  TEN_KEYS.forEach(k => { const x = Math.round((p.ten[k] - before[k]) * 10) / 10; if (x) d[k] = x; });
  return d;
}

// What the engine plays (sim.ts): his shot mix and how he creates his jumpers as fractions, how often
// he's the one fouled, and his shot volume.
const ex = (v: number, k: number) => Math.exp((v - 50) / k), USG_K = 60, FTR_K = 28; // shot volume: +20 on the tendency is about 40% more of the offense
export function effTend(p: any): Tend | undefined {
  const t = ensureTen(p);
  if (!t) return undefined;
  const mid = (t.paint || 0) + (t.mid || 0);
  return {
    zs: { rim: t.ra / 100, mid: mid / 100, c3: t.c3 / 100, atb: t.atb / 100 }, pf: mid > 0 ? t.paint / mid : PAINT_SHARE,
    cre: { cns: t.cns / 100, pullup: t.pullup / 100, step: t.step / 100, fade: t.fade / 100 },
    draw: Math.exp((t.ftr - 50) / FTR_K), // his share of the team's shooting fouls
    usg: ex(t.usage, USG_K),
  };
}

// For the editors and the profile: his shares, and setting one (the others in its group make room in
// proportion, so they still add up to 100).
export const zoneShares = (p: any) => { const t = ensureTen(p); return Object.fromEntries(ZONE_TEN.map(k => [k, t?.[k] ?? 0])) as Record<ZoneTen, number>; };
export const creShares = (p: any) => { const t = ensureTen(p); return Object.fromEntries(CRE_TEN.map(k => [k, t?.[k] ?? 0])) as Record<CreTen, number>; };
export const isZone = (k: string): k is ZoneTen => (ZONE_TEN as readonly string[]).includes(k);
export const isCre = (k: string): k is CreTen => (CRE_TEN as readonly string[]).includes(k);
export function setShare(ten: Record<string, number>, k: ZoneTen | CreTen, v: number): Record<string, number> {
  const keys = (isZone(k) ? ZONE_TEN : CRE_TEN) as readonly string[], g = Object.fromEntries(keys.map(x => [x, x === k ? v : ten[x] ?? 0]));
  return { ...ten, ...round100(g as Record<string, number>, k as string) };
}
// The league's typical share for each (the line on the profile's bars).
export const typShare = (k: ZoneTen | CreTen) => Math.round((isZone(k) ? ZB[k] : CRE_BASE[k]) * 1000) / 10;

// Each team's rotation ranked as offensive options (by offensive ability, among its top 9 by overall).
export function optionRanks(P: Record<number, any>, rosters: Record<string, number[]>): Map<number, number> {
  const m = new Map<number, number>();
  Object.values(rosters).forEach(ids => { const rot = ids.map(id => P[id]).filter(q => q?.r && !q.inj?.major).sort((a, b) => b.ovr - a.ovr).slice(0, 9);
    rot.slice().sort((a, b) => offAbility(b.r) - offAbility(a.r)).forEach((q, i) => m.set(q.id, i)); });
  return m;
}

// A short read of his style for the profile: his two or three strongest leanings.
const STYLE: Record<ZoneTen | CreTen | 'ftr', string> = { ra: 'shots at the rim', paint: 'floaters and hooks', mid: 'mid-range shots', c3: 'corner threes', atb: 'threes above the break', cns: 'catch-and-shoot jumpers', pullup: 'pull-up jumpers', step: 'stepbacks', fade: 'fadeaways', ftr: 'trips to the line' };
export function styleLine(p: any): string {
  const t = ensureTen(p); if (!t) return '';
  const lean: [keyof typeof STYLE, number][] = [...ZONE_TEN.filter(k => t[k] >= 8).map(k => [k, t[k] / (ZB[k] * 100)] as [ZoneTen, number]), ...CRE_TEN.filter(k => t[k] >= 12).map(k => [k, t[k] / (CRE_BASE[k] * 100)] as [CreTen, number])];
  if (t.ftr >= 62) lean.push(['ftr', 1.4 + (t.ftr - 62) / 30]);
  const top = lean.filter(([, v]) => v >= 1.4).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => STYLE[k]);
  const vol = t.usage >= 65 ? 'A high-usage scorer' : t.usage >= 55 ? 'A willing scorer' : t.usage <= 35 ? 'A low-usage role player' : t.usage <= 45 ? 'Plays within the offense' : 'A balanced option';
  return vol + (top.length ? ', heavy on ' + (top.length > 1 ? top.slice(0, -1).join(', ') + ' and ' + top[top.length - 1] : top[0]) : '') + '.';
}

// Usage rate in NBA terms (USG%, league mean 20): what the engine expects from his usage tendency
// together with the usage his offensive game earns him. `score` overrides the tendency (editing).
export function expUsg(p: any, norms: Norms | null | undefined, roles: string[] = [], score?: number) {
  const t = ensureTen(p), e = effTend(p) || {};
  if (t && score != null) e.usg = (e.usg ?? 1) / ex(t.usage, USG_K) * ex(score, USG_K);
  return Math.min(40, 20 * usageRaw({ ovr: p.ovr, r: p.r, alpha: p.pers?.alpha, touches: p.pers?.touches, roles, tend: e }) / (norms?.usage || 1)); // nobody sustains more than about 40%
}
// The usage tendency that gives a USG% (God Mode editing).
export function usageScoreFor(p: any, norms: Norms | null | undefined, roles: string[], usg: number) {
  let lo = 2, hi = 98; for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (expUsg(p, norms, roles, mid) < usg) lo = mid; else hi = mid; }
  return Math.round((lo + hi) / 2 * 10) / 10;
}

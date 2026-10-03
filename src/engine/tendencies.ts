// Playing style: how a player chooses to shoot, apart from how well he shoots. Ratings decide ability
// (whether the shot goes in); tendencies decide behavior (how much of the offense he takes on, where
// his shots come from, how he gets them, how often he gets to the line).
//
// Only the shot categories the NBA itself tracks on NBA.com, each shown in its NBA unit. Stored on the
// player (p.ten) as a 0–100 score, 50 = league typical:
//   usage   Usage rate (USG%): share of his team's plays he uses while on the floor (advanced stats)
//   ra      Restricted Area: share of his shots (shooting by zone)
//   paint   In the Paint (Non-RA): share of his shots (shooting by zone)
//   mid     Mid-Range: share of his shots (shooting by zone)
//   c3      Corner 3: share of his shots (shooting by zone)
//   atb     Above the Break 3: share of his shots (shooting by zone)
//   cns     Catch & Shoot: jump shots from 10+ feet with no dribble, share of his shots (shot dashboard)
//   pullup  Pull-Up: jump shots from 10+ feet off the dribble, share of his shots (shot dashboard)
//   ftr     Free throw rate: free throw attempts per field goal attempt (four factors)
//
// Each has a target: what his current abilities, role, team situation and personality point to,
// plus a personal quirk that never changes (two players with the same ratings don't play alike).
// Tendencies move toward the target gradually and probabilistically: a big step chance each summer
// after development, a small one month to month in season. Young players adapt fastest; veterans
// keep their habits, except that a body that has lost its burst has to adapt (fewer shots at the
// rim, fewer trips to the line).
//
// Shot volume (usage) is a behavior too, not his overall. It moves toward what his offensive game,
// his role and his personality point to: a player who becomes a better scorer or a more complete
// creator, or grows an elite weapon, or becomes his team's best option, takes on more of the
// offense over a season or two (young players grow into a bigger role fastest); one whose game
// declines, or who joins a team with better options, gives some back. Egotistic, ball-dominant and
// selfish players take more shots than their game earns, and believe in shots they can't make.
//
// The engine plays them (effTend): the five zones set his shot mix (sim.ts shotProfile; the paint and
// mid-range share the engine's mid tier), catch & shoot against pull-ups decides how often his makes
// are assisted, free throw rate how often he's the one fouled, usage how much he shoots.
import { BASE, DEFAULT_NORMS, offAbility, PAINT_SHARE, shotProfile, usageRaw, type Norms, type Tend } from './sim';
export { offAbility };

export const TEN_KEYS = ['usage', 'ra', 'paint', 'mid', 'c3', 'atb', 'cns', 'pullup', 'ftr'] as const;
export type TenKey = (typeof TEN_KEYS)[number];
export const ZONE_TEN = ['ra', 'paint', 'mid', 'c3', 'atb'] as const;
export type ZoneTen = (typeof ZONE_TEN)[number];
export const TEN_LABEL: Record<TenKey, string> = { usage: 'Usage rate', ra: 'Restricted Area', paint: 'In the Paint (Non-RA)', mid: 'Mid-Range', c3: 'Corner 3', atb: 'Above the Break 3', cns: 'Catch & Shoot', pullup: 'Pull-Up', ftr: 'Free throw rate' };
// The NBA's definitions (NBA.com stats: advanced, shooting by zone, shot dashboard, four factors).
export const TEN_DESC: Record<TenKey, string> = {
  usage: 'Usage rate (USG%): the share of his team’s plays he uses (shots, free-throw trips, turnovers) while he’s on the floor',
  ra: 'Restricted Area (shooting by zone): shots inside the restricted-area arc, four feet from the basket, as a share of his shots',
  paint: 'In the Paint (Non-RA) (shooting by zone): shots in the paint outside the restricted area (floaters, hooks, short turnarounds), as a share of his shots',
  mid: 'Mid-Range (shooting by zone): shots outside the paint and inside the three-point line, as a share of his shots',
  c3: 'Corner 3 (shooting by zone): threes from either corner, below the break, as a share of his shots',
  atb: 'Above the Break 3 (shooting by zone): threes from anywhere but the corners, as a share of his shots',
  cns: 'Catch & Shoot (shot dashboard): jump shots from 10+ feet where he held the ball 2 seconds or less and took no dribble, as a share of his shots',
  pullup: 'Pull-Up (shot dashboard): jump shots from 10+ feet after one or more dribbles, as a share of his shots',
  ftr: 'Free throw rate (FTA rate, one of the four factors): free throw attempts per field goal attempt',
};
// League shares of each zone (the engine's baselines; the paint and mid-range split its mid tier).
const ZB: Record<ZoneTen, number> = { ra: BASE.zone.rim.share, paint: BASE.zone.mid.share * PAINT_SHARE, mid: BASE.zone.mid.share * (1 - PAINT_SHARE), c3: BASE.zone.c3.share, atb: BASE.zone.atb.share };
// NBA units: league-typical value at 50, spread `k` (`kLo` below 50, where a zone falls off faster:
// a non-shooter takes almost no threes, a great shooter only somewhat more than most), cap. Usage is
// shown through the engine (expUsg), the zones through his whole shot mix (zoneShares, adding up to
// 100%), catch & shoot and pull-ups through his jump shots (jumpShares).
const UNIT: Record<Exclude<TenKey, 'usage'>, { typ: number; k: number; kLo?: number; max: number; dp: number; suf: string }> = {
  ra: { typ: ZB.ra * 100, k: 28, kLo: 22, max: 85, dp: 0, suf: '% of shots' }, paint: { typ: ZB.paint * 100, k: 28, kLo: 22, max: 60, dp: 0, suf: '% of shots' }, mid: { typ: ZB.mid * 100, k: 28, kLo: 22, max: 60, dp: 0, suf: '% of shots' },
  c3: { typ: ZB.c3 * 100, k: 34, kLo: 14, max: 45, dp: 0, suf: '% of shots' }, atb: { typ: ZB.atb * 100, k: 38, kLo: 14, max: 80, dp: 0, suf: '% of shots' },
  cns: { typ: 30, k: 30, max: 85, dp: 0, suf: '% of shots' }, pullup: { typ: 22, k: 20, max: 70, dp: 0, suf: '% of shots' },
  ftr: { typ: 0.253, k: 42, max: 0.9, dp: 3, suf: ' FTA per FGA' }, // fitted to what players actually shoot (the engine's foul share is steeper: FTR_K)
};
export const tenUnit = (k: Exclude<TenKey, 'usage'>, score: number) => { const u = UNIT[k]; return Math.min(u.max, u.typ * Math.exp((score - 50) / (score < 50 && u.kLo ? u.kLo : u.k))); };
export const tenScore = (k: Exclude<TenKey, 'usage'>, val: number) => { const u = UNIT[k], x = Math.log(Math.max(0.001, val) / u.typ); return cl(50 + (x < 0 && u.kLo ? u.kLo : u.k) * x, 2, 98); };
export const tenFmt = (k: Exclude<TenKey, 'usage'>, val: number) => { const u = UNIT[k]; return (u.dp === 3 ? val.toFixed(3).replace(/^0/, '') : val.toFixed(u.dp)) + u.suf; };
export const tenSuffix = (k: Exclude<TenKey, 'usage'>) => UNIT[k].suf.trim();

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (id: number, salt: number) => ((((id + 1) * 2654435761) ^ (salt * 40503)) >>> 0) % 100000 / 100000;
const nrmH = (id: number, salt: number) => (hash(id, salt) + hash(id, salt + 7) + hash(id, salt + 13) - 1.5) * 2; // about N(0, 1)

// His personal quirks: fixed per player (and per tendency), about ±7 on the 0–100 scale (±3.5 for shot volume).
const SALT: Record<TenKey, number> = { usage: 0, cns: 6, pullup: 7, mid: 8, ra: 11, paint: 12, c3: 13, atb: 14, ftr: 15 }; // fixed, so quirks survive list changes
export const quirkOf = (p: any, k: TenKey) => (p.tenQ?.[k] ?? +(nrmH(p.id, 101 + SALT[k]) * (k === 'usage' ? 3.5 : 7)).toFixed(1));

// Defense and rebounding, on the same scale as offAbility: the gap says scorer or specialist.
export const defAbility = (r: any) => r.diq * 0.3 + ((r.blk ?? r.diq) + (r.stl ?? r.diq)) * 0.1 + r.reb * 0.2 + (r.box ?? r.reb) * 0.1 + r.stre * 0.1 + r.hgt * 0.1;

// His team context, when known: his place among its rotation as an offensive option (0 = first
// option), and where the team is headed (Game.strategies). A bare number is the rank.
export interface TenCtx { rank?: number | null; mode?: 'rebuild' | 'middle' | 'contend' }
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

// A new player (or one from an older save): his tendencies start where his game points, plus quirks.
export function initTendencies(p: any, ctx?: number | null | TenCtx) {
  const tg = tenTargets(p, ctx);
  p.tenQ = Object.fromEntries(TEN_KEYS.map(k => [k, quirkOf(p, k)]));
  p.ten = Object.fromEntries(TEN_KEYS.map(k => [k, Math.round(cl(tg[k] + p.tenQ[k], 2, 98))])); p.tenV = 3;
  return p.ten;
}
// Hand-set multipliers (older saves' God Mode fine-tuning, player cards) on the engine's zones, foul
// drawing, assisted makes and usage, turned into the same change on his tendencies. Turnover and
// passing multipliers aren't shot tendencies and are dropped.
export function applyMult(p: any, h: any) {
  if (!h || !p.ten) return;
  const add = (k: TenKey, m: number, kk: number) => { if (m > 0 && isFinite(m) && p.ten[k] != null) p.ten[k] = Math.round(cl(p.ten[k] + kk * Math.log(m), 2, 98)); };
  const zk = (k: ZoneTen, m: number) => (m < 1 ? UNIT[k].kLo ?? UNIT[k].k : UNIT[k].k);
  add('ra', h.rim, zk('ra', h.rim)); add('paint', h.mid, zk('paint', h.mid)); add('mid', h.mid, zk('mid', h.mid)); add('c3', h.c3, zk('c3', h.c3)); add('atb', h.atb, zk('atb', h.atb));
  add('ftr', h.draw, FTR_K); add('usage', h.usg, USG_K);
  if (h.ast > 0) { add('cns', h.ast, 30); add('pullup', 1 / h.ast, 30); } // assisted rate = exp((C&S − pull-up) / 60)
}
// Keys from before the NBA's shot categories, removed on load.
const OLD_KEYS = ['drive', 'iso', 'pnr', 'roll', 'post', 'three', 'pass'];
// Players saved before a tendency existed get it now (from where his game points, plus his quirk).
// Saves from before the NBA's shot categories keep how usage, catch & shoot, pull-ups and mid-range
// have evolved; the zones and free throw rate start from his game, and hand-set multipliers move in.
export function ensureTen(p: any) {
  if (!p?.r) return null;
  if (!p.ten || !p.tenQ) initTendencies(p);
  else if (p.tenV !== 3 || TEN_KEYS.some(k => p.ten[k] == null)) {
    const tg = tenTargets(p, null), keep = p.tenV === 3 ? TEN_KEYS : ['usage', 'cns', 'pullup', 'mid'];
    TEN_KEYS.forEach(k => { if (p.ten[k] == null || !keep.includes(k)) { p.tenQ[k] = quirkOf(p, k); p.ten[k] = Math.round(cl(tg[k] + p.tenQ[k], 2, 98)); } });
    OLD_KEYS.forEach(k => { delete p.ten[k]; delete p.tenQ[k]; if (p.tenPrev) delete p.tenPrev[k]; });
    p.tenV = 3;
  }
  if (p.tend) { applyMult(p, p.tend); delete p.tend; }
  return p.ten;
}

// One step of evolution. `frac` is how big a step this is (1 = a summer, about 0.15 = a month);
// `prob` the chance each tendency moves at all this time. Returns the changes (rounded).
export function evolveTendencies(p: any, ctx: number | null | TenCtx, frac: number, prob: number, rnd: () => number = Math.random): Record<string, number> {
  if (!ensureTen(p) || p.tenLock) return {};
  const tg = tenTargets(p, ctx), age = p.age ?? 25, ageF = age <= 24 ? 1.25 : age <= 29 ? 1 : age <= 33 ? 0.8 : 0.65, d: Record<string, number> = {};
  TEN_KEYS.forEach(k => {
    if (rnd() > prob) return;
    const cur = p.ten[k], gap = tg[k] + p.tenQ[k] - cur;
    let rate = (k === 'usage' ? 0.45 : 0.3) * ageF * (0.5 + rnd());
    if (k === 'usage' && gap > 0 && age <= 25) rate *= 1.25; // a young player who's earned a bigger role grows into it quickly
    if (k === 'usage' && gap < 0 && !(p.pers?.alpha || p.pers?.padder || p.pers?.touches)) rate *= 1.3; // a fading game loses its shots, unless his ego won't let go
    if (gap < 0 && age >= 30 && (k === 'ra' || k === 'ftr')) rate *= 1.4; // the body forces it
    const step = gap * Math.min(1, rate * frac) + (rnd() + rnd() - 1) * 1.5 * Math.sqrt(frac);
    const nx = Math.round(cl(cur + step, 2, 98) * 10) / 10;
    if (Math.abs(nx - cur) >= 0.05) { d[k] = +(nx - cur).toFixed(1); p.ten[k] = nx; }
  });
  return d;
}

// What the engine plays: the tendencies as multipliers (1 = typical).
const ex = (v: number, k: number) => Math.exp((v - 50) / k), USG_K = 60, FTR_K = 28; // shot volume: +20 on the tendency is about 40% more of the offense
export function effTend(p: any): Tend | undefined {
  const t = ensureTen(p);
  if (!t) return undefined;
  const w = (k: ZoneTen) => tenUnit(k, t[k]) / UNIT[k].typ, wp = ZB.paint * w('paint'), wm = ZB.mid * w('mid'); // a zone's weight against a league-typical shooter
  return {
    rim: w('ra'), mid: (wp + wm) / (ZB.paint + ZB.mid), pf: wp / (wp + wm), c3: w('c3'), atb: w('atb'),
    draw: Math.exp((t.ftr - 50) / FTR_K), // his share of the team's shooting fouls
    ast: Math.exp(((t.cns - 50) - (t.pullup - 50)) / 60), // catch-and-shoot makes come off a pass; pull-ups don't
    usg: ex(t.usage, USG_K),
  };
}

// His shot mix in the NBA's zones (% of his shots): what the engine plays from his tendencies, skills
// and roles (sim.ts shotProfile). `over`: tendency scores to try instead (editing).
export function zoneShares(p: any, norms: Norms | null | undefined, roles: string[] = [], over?: Partial<Record<TenKey, number>>): Record<ZoneTen, number> {
  const t = ensureTen(p), e = (t ? effTend(over ? { ...p, ten: { ...t, ...over }, tenQ: p.tenQ, tenV: 3 } : p) : undefined) || {};
  const prof = shotProfile({ r: p.r, roles, tend: t ? e : undefined, pers: p.pers, grp: p.grp }, norms || DEFAULT_NORMS), pf = e.pf ?? PAINT_SHARE;
  return { ra: 100 * prof.rim, paint: 100 * prof.mid * pf, mid: 100 * prof.mid * (1 - pf), c3: 100 * prof.c3, atb: 100 * prof.atb };
}
// The zone tendency that gives a share of his shots there (God Mode editing).
export function zoneScoreFor(p: any, norms: Norms | null | undefined, roles: string[], k: ZoneTen, share: number) {
  let lo = 2, hi = 98; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (zoneShares(p, norms, roles, { [k]: m })[k] < share) lo = m; else hi = m; }
  return Math.round((lo + hi) / 2 * 10) / 10;
}
// Catch & shoot and pull-up jumpers as shares of his shots (NBA shot dashboard): his jump shots from
// 10+ feet (mid-range, threes, the longer paint shots) split by the two tendencies (league-wide about
// 28% and 25% of shots); the NBA counts a few as neither (held 2+ seconds without a dribble).
export function jumpShares(p: any, norms: Norms | null | undefined, roles: string[] = [], over?: Partial<Record<TenKey, number>>): { cns: number; pullup: number } {
  const t = { ...(ensureTen(p) || {}), ...over } as Record<TenKey, number>, z = zoneShares(p, norms, roles, over), J = (z.mid + z.c3 + z.atb + 0.25 * z.paint) * 0.92;
  const wc = 0.53 * tenUnit('cns', t.cns ?? 50) / UNIT.cns.typ, wu = 0.47 * tenUnit('pullup', t.pullup ?? 50) / UNIT.pullup.typ;
  return { cns: (J * wc) / (wc + wu), pullup: (J * wu) / (wc + wu) };
}
// The catch & shoot or pull-up tendency that gives a share of his shots (God Mode editing).
export function jumpScoreFor(p: any, norms: Norms | null | undefined, roles: string[], k: 'cns' | 'pullup', share: number) {
  let lo = 2, hi = 98; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (jumpShares(p, norms, roles, { [k]: m })[k] < share) lo = m; else hi = m; }
  return Math.round((lo + hi) / 2 * 10) / 10;
}

// Each team's rotation ranked as offensive options (by offensive ability, among its top 9 by overall).
export function optionRanks(P: Record<number, any>, rosters: Record<string, number[]>): Map<number, number> {
  const m = new Map<number, number>();
  Object.values(rosters).forEach(ids => { const rot = ids.map(id => P[id]).filter(q => q?.r && !q.inj?.major).sort((a, b) => b.ovr - a.ovr).slice(0, 9);
    rot.slice().sort((a, b) => offAbility(b.r) - offAbility(a.r)).forEach((q, i) => m.set(q.id, i)); });
  return m;
}

// A short read of his style for the profile: his two or three strongest leanings.
const STYLE: Record<Exclude<TenKey, 'usage'>, string> = { ra: 'shots at the rim', paint: 'floaters and hooks', mid: 'mid-range shots', c3: 'corner threes', atb: 'threes above the break', cns: 'catch-and-shoot jumpers', pullup: 'pull-up jumpers', ftr: 'trips to the line' };
export function styleLine(p: any): string {
  const t = ensureTen(p); if (!t) return '';
  const top = (TEN_KEYS.filter(k => k !== 'usage') as Exclude<TenKey, 'usage'>[]).map(k => [k, t[k]] as [Exclude<TenKey, 'usage'>, number]).filter(([, v]) => v >= 62).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => STYLE[k]);
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

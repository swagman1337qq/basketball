// Playing style: how a player chooses to play, apart from how well he plays. Attributes decide
// ability (whether the shot goes in); tendencies decide behavior (which shots he looks for, how
// often he ends the possession himself, whether he drives, posts up or pulls up).
//
// Only categories the NBA itself tracks (NBA.com advanced stats, player tracking and play types),
// each shown in its NBA unit. Stored on the player (p.ten) as a 0–100 score, 50 = league typical:
//   usage   Usage rate (USG%): share of team plays he uses while on the floor (advanced)
//   drive   Drives per 36 minutes (player tracking)
//   cns     Catch & shoot: share of his shots (player tracking)
//   pullup  Pull-up shooting: share of his shots (player tracking)
//   iso     Isolation: share of his possessions (play type)
//   pnr     P&R ball handler: share of his possessions (play type)
//   roll    P&R roll man: share of his possessions (play type)
//   post    Post-up: share of his possessions (play type)
//   mid     Mid-range: share of his shots (shot zones)
//   three   3-point attempt rate: share of his shots
//   pass    Passes made per 36 minutes (player tracking)
//
// Each has a target: what his current abilities, role, team situation and personality point to,
// plus a personal quirk that never changes (two players with the same ratings don't play alike).
// Tendencies move toward the target gradually and probabilistically: a big step chance each summer
// after development, a small one month to month in season. Young players adapt fastest; veterans
// keep their habits, except that a body that has lost its burst has to adapt (fewer drives).
//
// Shot volume (usage) is a behavior too, not his overall. It moves toward what his offensive game,
// his role and his personality point to: a player who becomes a better scorer or a more complete
// creator, or grows an elite weapon, or becomes his team's best option, takes on more of the
// offense over a season or two (young players grow into a bigger role fastest); one whose game
// declines, or who joins a team with better options, gives some back. Egotistic, ball-dominant and
// selfish players take more shots than their game earns, and believe in shots they can't make.
//
// The engine reads the tendencies as multipliers (effTend): the shot mix, how often he draws
// fouls, how often his makes are assisted, turnovers, how often he's the passer, and usage.
// Hand-set multipliers (God Mode, player cards) sit on top and fade toward normal a little every
// summer unless his tendencies are locked.
import { offAbility, usageRaw, type Norms, type Tend } from './sim';
export { offAbility };

export const TEN_KEYS = ['usage', 'drive', 'cns', 'pullup', 'iso', 'pnr', 'roll', 'post', 'mid', 'three', 'pass'] as const;
export type TenKey = (typeof TEN_KEYS)[number];
export const TEN_LABEL: Record<TenKey, string> = { usage: 'Usage rate', drive: 'Drives', cns: 'Catch & shoot', pullup: 'Pull-up shooting', iso: 'Isolation', pnr: 'P&R ball handler', roll: 'P&R roll man', post: 'Post-up', mid: 'Mid-range', three: '3-point attempt rate', pass: 'Passes made' };
// The NBA's definitions (NBA.com stats: advanced, player tracking, play types, shot zones).
export const TEN_DESC: Record<TenKey, string> = {
  usage: 'Usage rate (USG%): the share of his team\u2019s plays he uses (shots, free-throw trips, turnovers) while he\u2019s on the floor',
  drive: 'Drives (player tracking): touches that start 20+ feet from the basket and are dribbled inside 10 feet',
  cns: 'Catch & shoot (player tracking): jump shots from 10+ feet with no dribble before the shot, as a share of his shots',
  pullup: 'Pull-up (player tracking): jump shots from 10+ feet taken after dribbling, as a share of his shots',
  iso: 'Isolation (play type): possessions he ends going one-on-one, as a share of his possessions',
  pnr: 'Pick & roll ball handler (play type): possessions he ends as the ball handler in a pick and roll',
  roll: 'Pick & roll roll man (play type): possessions he ends as the screener, rolling or popping',
  post: 'Post-up (play type): possessions he ends from a post-up',
  mid: 'Mid-range (shot zones): shots outside the paint and inside the three-point line, as a share of his shots',
  three: '3-point attempt rate: threes as a share of his shots',
  pass: 'Passes made (player tracking), per 36 minutes',
};
// Display in NBA units: league-typical value at 50, spread `k`, cap. Typical values are for NBA
// rotation players (2024–25): usage is shown through the engine (usageOf).
const UNIT: Record<Exclude<TenKey, 'usage'>, { typ: number; k: number; max: number; dp: number; suf: string }> = {
  drive: { typ: 5.5, k: 16, max: 26, dp: 1, suf: ' per 36' }, cns: { typ: 30, k: 30, max: 85, dp: 0, suf: '% of shots' }, pullup: { typ: 22, k: 20, max: 70, dp: 0, suf: '% of shots' },
  iso: { typ: 6, k: 16, max: 35, dp: 1, suf: '% of plays' }, pnr: { typ: 13, k: 13, max: 55, dp: 1, suf: '% of plays' }, roll: { typ: 6, k: 13, max: 40, dp: 1, suf: '% of plays' },
  post: { typ: 3.5, k: 13, max: 40, dp: 1, suf: '% of plays' }, mid: { typ: 12, k: 22, max: 45, dp: 0, suf: '% of shots' }, three: { typ: 40, k: 34, max: 92, dp: 0, suf: '% of shots' },
  pass: { typ: 36, k: 45, max: 85, dp: 0, suf: ' per 36' },
};
export const tenUnit = (k: Exclude<TenKey, 'usage'>, score: number) => { const u = UNIT[k]; return Math.min(u.max, u.typ * Math.exp((score - 50) / u.k)); };
export const tenScore = (k: Exclude<TenKey, 'usage'>, val: number) => { const u = UNIT[k]; return cl(50 + u.k * Math.log(Math.max(0.05, val) / u.typ), 2, 98); };
export const tenFmt = (k: Exclude<TenKey, 'usage'>, val: number) => { const u = UNIT[k]; return val.toFixed(u.dp) + u.suf; };
export const tenSuffix = (k: Exclude<TenKey, 'usage'>) => UNIT[k].suf.trim();

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (id: number, salt: number) => ((((id + 1) * 2654435761) ^ (salt * 40503)) >>> 0) % 100000 / 100000;
const nrmH = (id: number, salt: number) => (hash(id, salt) + hash(id, salt + 7) + hash(id, salt + 13) - 1.5) * 2; // about N(0, 1)

// His personal quirks: fixed per player (and per tendency), about ±7 on the 0–100 scale (±3.5 for shot volume).
const SALT: Record<TenKey, number> = { usage: 0, pass: 1, drive: 2, iso: 3, pnr: 4, post: 5, cns: 6, pullup: 7, mid: 8, three: 9, roll: 10 }; // fixed, so quirks survive list changes
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
  const r = p.r || {}, f = p.pers || {}, g = p.grp, big = g === 'B', guard = g === 'G', age = p.age ?? 25, { rank, mode } = ctxOf(ctx);
  const t = (v: number) => cl(v, 2, 98), acc = r.acc ?? r.spd, finish = Math.max(r.dnk, r.lay ?? r.dnk);
  const L = (r.drb + r.pss + r.fg + r.tp + r.ins + finish + acc + r.oiq) / 8, rel = (x: number) => x - L + 0.3 * (L - 52);
  const shoot3 = r.tp < 40 ? 50 + (r.tp - 50) * 2.2 : 50 + rel(r.tp) * 0.7; // non-shooters stop taking threes
  const handle = (r.drb + acc) / 2;
  const attack = big ? r.dnk * 0.35 + r.jmp * 0.25 + r.hgt * 0.2 + r.spd * 0.2 : acc * 0.3 + r.spd * 0.15 + r.drb * 0.25 + finish * 0.3;
  const postSk = r.ins * 0.5 + r.stre * 0.25 + r.hgt * 0.25, offA = offAbility(r);
  const out: Record<TenKey, number> = {
    three: t(shoot3 - (big ? 6 : 0) + (f.team ? 3 : 0) + (f.heat ? 3 : 0)),
    mid: t(50 + rel(r.fg) * 1.2 + (f.alpha ? 4 : 0) + (f.touches ? 4 : 0) + (f.volatile ? 3 : 0) + (age >= 31 ? 4 : 0)),
    drive: t(50 + rel(attack) * 1.25 + (big ? -20 : 0) + (age >= 31 ? -(age - 30) * 1.5 : 0)), // bigs attack the rim on rolls and post-ups, not drives
    pullup: t(50 + rel((r.drb + (r.fg + r.tp) / 2) / 2) * 1.3 + (f.heat ? 6 : 0) + (f.flashy ? 3 : 0) + (big ? -10 : 0)),
    cns: t((r.tp < 40 ? 50 + (r.tp - 50) * 1.8 : 50 + rel(r.tp) * 0.85) - (handle - L) * 0.5 + (f.team ? 8 : 0) + (f.pro ? 3 : 0)),
    post: t(50 + rel(postSk) * 1.3 + (big ? -3 : guard ? -14 : -4) + (age >= 30 && !guard ? 3 : 0)),
    iso: t(50 + rel(r.drb * 0.35 + acc * 0.25 + r.fg * 0.2 + r.oiq * 0.2) * 1.0 + (f.alpha ? 10 : 0) + (f.touches ? 6 : 0) - (f.team ? 8 : 0) + (big ? -8 : 0)),
    pnr: t(50 + rel(r.drb * 0.5 + r.pss * 0.5) * 1.0 + (big ? -26 : guard ? 3 : -4)),
    roll: t(50 + rel(r.dnk * 0.4 + r.hgt * 0.3 + r.spd * 0.3) * 1.0 + (big ? 5 : guard ? -26 : -10)),
    // Passes made: passing skill, the ball in his hands, and how his passing compares with his scoring.
    pass: t(50 + rel(r.pss) * 0.9 + (r.pss - offA) * 0.5 + (r.drb - L) * 0.3 + (guard ? 8 : big ? -2 : 0) + (f.team ? 6 : 0) - (f.alpha ? 4 : 0) - (f.padder ? 4 : 0) + (f.flashy ? 3 : 0)),
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
  //   and believe in shots they can't make (a weak game pulls the egotistic and selfish down only half as much); heat
  //   checkers, fearless and legacy-driven players a little more; team players fewer;
  // - heavy passers finish fewer possessions; a teenager defers unless he's the best option;
  //   veterans hand some over.
  const rimS = 0.25 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.3 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, weapon = Math.max(rimS, r.fg, r.tp);
  const belief = f.alpha || f.padder ? 0.5 : f.touches ? 0.7 : f.heat || f.fearless ? 0.85 : 1, lvl = (offA - 57) * 0.55;
  const ego = cl((f.alpha ? 6 : 0) + (f.touches ? 4 : 0) + (f.padder ? 3 : 0) + (f.heat ? 2 : 0) + (f.fearless ? 2 : 0) + (f.legacy ? 1.5 : 0) + (f.flashy ? 1 : 0) + (f.volatile ? 1 : 0) - (f.team ? 5 : 0), -5, 8); // traits overlap: one appetite
  const rankB = rank == null ? 0 : [6, 3, 0, -2, -4, -5, -6][Math.min(6, rank)];
  const situation = age > 24 ? 0 : mode === 'rebuild' ? 3 : mode === 'contend' && (rank ?? 9) > 0 ? -2 : 0;
  out.usage = t(48 + (lvl < 0 ? lvl * belief : lvl) + cl((weapon - 64) * 0.25, 0, 4) + cl((offA - defAbility(r)) * 0.35, -6, 3) + rankB + situation + ego
    - (out.pass - 50) * 0.12 + (age <= 20 && (rank ?? 9) > 0 ? -3 : 0) + (age >= 33 ? -3 : 0));
  return out;
}

// A new player (or one from an older save): his tendencies start where his game points, plus quirks.
export function initTendencies(p: any, ctx?: number | null | TenCtx) {
  const tg = tenTargets(p, ctx);
  p.tenQ = Object.fromEntries(TEN_KEYS.map(k => [k, quirkOf(p, k)]));
  p.ten = Object.fromEntries(TEN_KEYS.map(k => [k, Math.round(cl(tg[k] + p.tenQ[k], 2, 98))])); p.tenV = 2;
  return p.ten;
}
// Players saved before a tendency existed get it now (from where his game points, plus his quirk).
// Saves from the first version (with "Pick and roll" and "Pass-first", and drives that counted a
// big's rolls) move to the NBA's tracking categories.
export function ensureTen(p: any) {
  if (!p?.r) return null; if (!p.ten || !p.tenQ) return initTendencies(p);
  if (TEN_KEYS.some(k => p.ten[k] == null) || p.tenV !== 2) {
    const tg = tenTargets(p, null), fill = (k: TenKey) => { p.tenQ[k] = quirkOf(p, k); p.ten[k] = Math.round(cl(tg[k] + p.tenQ[k], 2, 98)); };
    // Categories whose meaning changed start fresh from his game; usage, pull-ups, isolation, mid-range
    // and threes keep how they've evolved.
    if (p.tenV !== 2) (['drive', 'cns', 'pnr', 'roll', 'post', 'pass'] as TenKey[]).forEach(fill);
    TEN_KEYS.forEach(k => { if (p.ten[k] == null) fill(k); });
    p.tenV = 2;
  }
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
    if (gap < 0 && age >= 30 && (k === 'drive' || k === 'post')) rate *= 1.4; // the body forces it
    const step = gap * Math.min(1, rate * frac) + (rnd() + rnd() - 1) * 1.5 * Math.sqrt(frac);
    const nx = Math.round(cl(cur + step, 2, 98) * 10) / 10;
    if (Math.abs(nx - cur) >= 0.05) { d[k] = +(nx - cur).toFixed(1); p.ten[k] = nx; }
  });
  return d;
}

// Hand-set multipliers (God Mode, player cards) fade a quarter of the way toward normal each summer.
export function fadeHandTend(p: any) {
  if (!p.tend || p.tenLock) return;
  Object.keys(p.tend).forEach(k => { const v = Math.pow(p.tend[k], 0.75); if (Math.abs(v - 1) < 0.02) delete p.tend[k]; else p.tend[k] = +v.toFixed(3); });
  if (!Object.keys(p.tend).length) delete p.tend;
}

// What the engine plays: the tendencies as multipliers (1 = typical), times any hand-set ones.
const ex = (v: number, k: number) => Math.exp((v - 50) / k), USG_K = 60; // shot volume: +20 on the tendency is about 40% more of the offense
export function effTend(p: any): Tend | undefined {
  const t = ensureTen(p), h = p?.tend || {};
  if (!t) return p?.tend;
  const big = p.grp === 'B';
  const rimC = big ? 0.2 * t.drive + 0.4 * t.post + 0.4 * t.roll + 6 : 0.7 * t.drive + 0.1 * t.post + 0.1 * t.pnr + 0.1 * t.roll; // a big's rim attack: rolls, post-ups, putbacks
  const midC = 0.45 * t.mid + 0.25 * t.pullup + 0.15 * t.iso + 0.15 * (big ? t.post : t.pnr);
  const c3C = 0.55 * t.three + 0.45 * t.cns, atbC = 0.6 * t.three + 0.4 * t.pullup;
  const o: Tend = {
    rim: ex(rimC, 30), mid: ex(midC, 28), c3: c3C < 30 ? ex(c3C, 14) * ex(30, 34) / ex(30, 14) : ex(c3C, 34), atb: atbC < 30 ? ex(atbC, 14) * ex(30, 34) / ex(30, 14) : ex(atbC, 34), // non-shooters fall off fast
    draw: ex(0.6 * t.drive + 0.4 * t.post, 40),
    ast: Math.exp(((t.cns - 50) + 0.4 * (t.roll - 50) - 0.5 * (t.iso - 50) - 0.4 * (t.pullup - 50)) / 70), // roll men and spot-up shooters are fed; isolations and pull-ups aren't
    tov: Math.exp(((t.iso - 50) * 0.25 + (t.pnr - 50) * 0.2 + (t.pass - 50) * 0.25) / 60),
    pass: ex(t.pass, 30),
    usg: ex(t.usage, USG_K) * Math.exp(-(t.pass - 50) / 300),
  };
  (Object.keys(o) as (keyof Tend)[]).forEach(k => { if (h[k] != null) o[k] = (o[k] as number) * h[k]; });
  return o;
}

// Each team's rotation ranked as offensive options (by offensive ability, among its top 9 by overall).
export function optionRanks(P: Record<number, any>, rosters: Record<string, number[]>): Map<number, number> {
  const m = new Map<number, number>();
  Object.values(rosters).forEach(ids => { const rot = ids.map(id => P[id]).filter(q => q?.r && !q.inj?.major).sort((a, b) => b.ovr - a.ovr).slice(0, 9);
    rot.slice().sort((a, b) => offAbility(b.r) - offAbility(a.r)).forEach((q, i) => m.set(q.id, i)); });
  return m;
}

// A short read of his style for the profile: his two or three strongest leanings.
export function styleLine(p: any): string {
  const t = ensureTen(p); if (!t) return '';
  const top = TEN_KEYS.filter(k => k !== 'usage').map(k => [k, t[k]] as [TenKey, number]).filter(([, v]) => v >= 62).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => TEN_LABEL[k].toLowerCase());
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

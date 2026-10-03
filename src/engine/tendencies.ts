// Playing style: how a player chooses to play, apart from how well he plays. Attributes decide
// ability (whether the shot goes in); tendencies decide behavior (which shots he looks for, how
// often he ends the possession himself, whether he passes, drives or pulls up).
//
// Ten tendencies, 0–100 (50 = typical for a player of his type), stored on the player (p.ten):
//   usage   shot volume: how much of the offense he wants (and is trusted) to finish
//   pass    pass-first vs shoot-first
//   drive   attacks the rim (off the dribble for guards and wings; rolls, cuts and putbacks for bigs)
//   iso     goes one-on-one
//   pnr     runs (or rolls in) the pick and roll
//   post    posts up
//   cns     catch-and-shoot
//   pullup  pull-up jumpers off the dribble
//   mid     mid-range frequency
//   three   three-point frequency
//
// Each has a target: what his current abilities, role, team situation and personality point to,
// plus a personal quirk that never changes (two players with the same ratings don't play alike).
// Tendencies move toward the target gradually and probabilistically: a big step chance each summer
// after development, a small one month to month in season. Young players adapt fastest; veterans
// keep their habits, except that a body that has lost its burst has to adapt (fewer drives). A
// player who becomes a better scorer, or his team's best option, takes on more shot volume over a
// season or two; one whose game declines, or who joins a better team, gives some back.
//
// The engine reads the tendencies as multipliers (effTend): the shot mix, how often he draws
// fouls, how often his makes are assisted, turnovers, how often he's the passer, and shot volume.
// Hand-set multipliers (God Mode, player cards) sit on top and fade toward normal a little every
// summer unless his tendencies are locked.
import type { Tend } from './sim';

export const TEN_KEYS = ['usage', 'pass', 'drive', 'iso', 'pnr', 'post', 'cns', 'pullup', 'mid', 'three'] as const;
export type TenKey = (typeof TEN_KEYS)[number];
export const TEN_LABEL: Record<TenKey, string> = { usage: 'Shot volume', pass: 'Pass-first', drive: 'Drives to the rim', iso: 'Isolation', pnr: 'Pick and roll', post: 'Post-ups', cns: 'Catch-and-shoot', pullup: 'Pull-up jumpers', mid: 'Mid-range', three: 'Three-pointers' };
export const TEN_DESC: Record<TenKey, string> = {
  usage: 'How much of the offense he finishes himself', pass: 'Looks to pass before he looks to shoot', drive: 'Attacks the basket (guards and wings off the dribble, bigs on rolls, cuts and putbacks)',
  iso: 'Clears out and goes one-on-one', pnr: 'Runs the pick and roll as the ball handler, or rolls and pops as the screener', post: 'Back-to-the-basket play',
  cns: 'Spots up for catch-and-shoot jumpers', pullup: 'Shoots off the dribble', mid: 'Takes mid-range shots', three: 'Takes threes',
};

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (id: number, salt: number) => ((((id + 1) * 2654435761) ^ (salt * 40503)) >>> 0) % 100000 / 100000;
const nrmH = (id: number, salt: number) => (hash(id, salt) + hash(id, salt + 7) + hash(id, salt + 13) - 1.5) * 2; // about N(0, 1)

// His personal quirks: fixed per player (and per tendency), about ±7 on the 0–100 scale (±4.5 for shot volume).
export const quirkOf = (p: any, k: TenKey) => (p.tenQ?.[k] ?? +(nrmH(p.id, 101 + TEN_KEYS.indexOf(k)) * (k === 'usage' ? 4.5 : 7)).toFixed(1));

// Offensive ability as a scorer and creator (not his overall: a defensive specialist can be a 70
// and still not a scorer).
export function offAbility(r: any) {
  const rim = 0.25 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.3 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, z = [rim, r.fg, r.tp].sort((a, b) => b - a);
  const scoring = z[0] * 0.5 + z[1] * 0.3 + z[2] * 0.1 + r.ft * 0.1;
  return scoring * 0.55 + r.drb * 0.17 + r.oiq * 0.15 + (r.acc ?? r.spd) * 0.13;
}

// Defense and rebounding, on the same scale as offAbility: the gap says scorer or specialist.
export const defAbility = (r: any) => r.diq * 0.3 + ((r.blk ?? r.diq) + (r.stl ?? r.diq)) * 0.1 + r.reb * 0.2 + (r.box ?? r.reb) * 0.1 + r.stre * 0.1 + r.hgt * 0.1;

// Where his game points today. Each style is read against his own offensive level (what he does
// best compared with the rest of his game), plus a little for level itself, since better players
// create a bit more of everything. `rank`: his place among his team's rotation as an offensive option
// (0 = first option), when known.
export function tenTargets(p: any, rank?: number | null): Record<TenKey, number> {
  const r = p.r || {}, f = p.pers || {}, g = p.grp, big = g === 'B', guard = g === 'G', age = p.age ?? 25;
  const t = (v: number) => cl(v, 2, 98), acc = r.acc ?? r.spd, finish = Math.max(r.dnk, r.lay ?? r.dnk);
  const L = (r.drb + r.pss + r.fg + r.tp + r.ins + finish + acc + r.oiq) / 8, rel = (x: number) => x - L + 0.3 * (L - 52);
  const shoot3 = r.tp < 40 ? 50 + (r.tp - 50) * 2.2 : 50 + rel(r.tp) * 0.7; // non-shooters stop taking threes
  const handle = (r.drb + acc) / 2;
  const attack = big ? r.dnk * 0.35 + r.jmp * 0.25 + r.hgt * 0.2 + r.spd * 0.2 : acc * 0.3 + r.spd * 0.15 + r.drb * 0.25 + finish * 0.3;
  const postSk = r.ins * 0.5 + r.stre * 0.25 + r.hgt * 0.25, offA = offAbility(r);
  const out: Record<TenKey, number> = {
    three: t(shoot3 - (big ? 6 : 0) + (f.team ? 3 : 0) + (f.heat ? 3 : 0)),
    mid: t(50 + rel(r.fg) * 1.2 + (f.alpha ? 4 : 0) + (f.touches ? 4 : 0) + (f.volatile ? 3 : 0) + (age >= 31 ? 4 : 0)),
    drive: t(50 + rel(attack) * 1.25 + (big ? -4 : 0) + (age >= 31 ? -(age - 30) * 1.5 : 0)),
    pullup: t(50 + rel((r.drb + (r.fg + r.tp) / 2) / 2) * 1.3 + (f.heat ? 6 : 0) + (f.flashy ? 3 : 0) + (big ? -10 : 0)),
    cns: t(50 + rel(r.tp) * 0.85 - (handle - L) * 0.5 + (f.team ? 8 : 0) + (f.pro ? 3 : 0)),
    post: t(50 + rel(postSk) * 1.3 + (big ? 6 : guard ? -14 : -4) + (age >= 30 && !guard ? 3 : 0)),
    iso: t(50 + rel(r.drb * 0.35 + acc * 0.25 + r.fg * 0.2 + r.oiq * 0.2) * 1.0 + (f.alpha ? 10 : 0) + (f.touches ? 6 : 0) - (f.team ? 8 : 0) + (big ? -8 : 0)),
    pnr: t(50 + rel(big ? r.dnk * 0.4 + r.hgt * 0.3 + r.spd * 0.3 : r.drb * 0.5 + r.pss * 0.5) * 1.0),
    // Pass vs shot: how his passing compares with his scoring (a better passer becomes more pass-minded).
    pass: t(50 + (r.pss - offA) * 1.2 + (r.oiq - L) * 0.2 + (f.team ? 8 : 0) - (f.alpha ? 8 : 0) - (f.padder ? 6 : 0) + (f.flashy ? 3 : 0)),
    usage: 50,
  };
  // Shot volume (on top of the volume his overall already earns him in the engine): a scorer more than
  // a defender or rebounder wants more of it, a defensive specialist less; the team's first option is
  // expected to carry the load, the fifth to fit in. Pass-first players finish fewer possessions;
  // teenagers defer; veterans hand some over.
  const rankB = rank == null ? 0 : [8, 4, 0, -3, -5, -6, -7][Math.min(6, rank)];
  out.usage = t(50 + cl((offA - defAbility(r)) * 0.6, -10, 10) + rankB - (out.pass - 50) * 0.2 + (age <= 21 ? -4 : age >= 33 ? -3 : 0));
  return out;
}

// A new player (or one from an older save): his tendencies start where his game points, plus quirks.
export function initTendencies(p: any, rank?: number | null) {
  const tg = tenTargets(p, rank);
  p.tenQ = Object.fromEntries(TEN_KEYS.map(k => [k, quirkOf(p, k)]));
  p.ten = Object.fromEntries(TEN_KEYS.map(k => [k, Math.round(cl(tg[k] + p.tenQ[k], 2, 98))]));
  return p.ten;
}
export const ensureTen = (p: any) => (p?.ten && p.tenQ ? p.ten : p?.r ? initTendencies(p) : null);

// One step of evolution. `frac` is how big a step this is (1 = a summer, about 0.15 = a month);
// `prob` the chance each tendency moves at all this time. Returns the changes (rounded).
export function evolveTendencies(p: any, rank: number | null, frac: number, prob: number, rnd: () => number = Math.random): Record<string, number> {
  if (!ensureTen(p) || p.tenLock) return {};
  const tg = tenTargets(p, rank), age = p.age ?? 25, ageF = age <= 24 ? 1.25 : age <= 29 ? 1 : age <= 33 ? 0.8 : 0.65, d: Record<string, number> = {};
  TEN_KEYS.forEach(k => {
    if (rnd() > prob) return;
    const cur = p.ten[k], gap = tg[k] + p.tenQ[k] - cur;
    let rate = (k === 'usage' ? 0.38 : 0.3) * ageF * (0.5 + rnd());
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
const ex = (v: number, k: number) => Math.exp((v - 50) / k);
export function effTend(p: any): Tend | undefined {
  const t = ensureTen(p), h = p?.tend || {};
  if (!t) return p?.tend;
  const big = p.grp === 'B';
  const rimC = big ? 0.45 * t.drive + 0.35 * t.post + 0.2 * t.pnr : 0.75 * t.drive + 0.1 * t.post + 0.15 * t.pnr;
  const midC = 0.5 * t.mid + 0.25 * t.pullup + 0.15 * t.iso + 0.1 * (big ? t.post : t.mid);
  const c3C = 0.55 * t.three + 0.45 * t.cns, atbC = 0.6 * t.three + 0.4 * t.pullup;
  const o: Tend = {
    rim: ex(rimC, 30), mid: ex(midC, 28), c3: c3C < 30 ? ex(c3C, 14) * ex(30, 34) / ex(30, 14) : ex(c3C, 34), atb: atbC < 30 ? ex(atbC, 14) * ex(30, 34) / ex(30, 14) : ex(atbC, 34), // non-shooters fall off fast
    draw: ex(0.6 * t.drive + 0.4 * t.post, 40),
    ast: Math.exp(((t.cns - 50) - 0.5 * (t.iso - 50) - 0.4 * (t.pullup - 50)) / 70),
    tov: Math.exp(((t.iso - 50) * 0.25 + (t.pnr - 50) * 0.2 + (t.pass - 50) * 0.25) / 60),
    pass: ex(t.pass, 30),
    usg: ex(t.usage, 70) * Math.exp(-(t.pass - 50) / 200),
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
  const vol = t.usage >= 65 ? 'A high-volume scorer' : t.usage >= 55 ? 'A willing scorer' : t.usage <= 35 ? 'A low-usage role player' : t.usage <= 45 ? 'Plays within the offense' : 'A balanced option';
  return vol + (top.length ? ' who leans on ' + (top.length > 1 ? top.slice(0, -1).join(', ') + ' and ' + top[top.length - 1] : top[0]) : '') + '.';
}

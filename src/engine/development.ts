// Player development, rating by rating.
//
// How much better (or worse) a player gets is worked out in Game.ts: his age, the room under his
// potential, his hidden development factor, work ethic, the season he had, minutes, coaching. This
// module decides where that change lands, so players grow in their own way instead of every rating
// rising together:
//  • His body follows its own track. Speed, burst and leaping barely grow after 20–21 and start to go
//    at his own athletic peak (26–29); strength and stamina fill out into the mid-20s. Each has a
//    yearly cap and a lifetime cap set by his frame, and none of it comes from skill work: a player
//    who learns to shoot doesn't get faster.
//  • His skills grow by his development profile, fixed for each player: where his growth tends to go
//    (a specialist pours it into one area, a well-rounded player spreads it), what he already has a
//    feel for, his age (feel for the game comes late, the dunk early), his training focus and his
//    team's system. Skills he isn't working on stall, and can slip.
// The overall moves by the same amount as before; what changes is what it's made of. (Aging works the
// same way: athleticism goes first, feel for the game and the shot hold on.)
import { mulberry32 } from './rng';
import { OVR_W } from './ratings';
import { GROUPS } from './translation';
import { repAffinity } from './tactics';

export const BODY = ['spd', 'acc', 'jmp', 'stre', 'endu'];
export const SKILLS = Object.values(GROUPS).flatMap(g => g.keys); // the 14 basketball skills, in five groups
const GROUP_OF: Record<string, string> = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, x]) => x.keys.map(k => [k, g])));
export const groupOf = (k: string) => GROUP_OF[k];
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seeded = (...xs: number[]) => mulberry32(xs.reduce((h, x) => (Math.imul(h ^ x, 2654435761) + 0x9e3779b9) >>> 0, 0x5eed1e5));
const nrm = (r: () => number) => (r() + r() + r() - 1.5) * 2; // roughly a standard normal

// Work ethic, 0–100 (average 50): from his id, so world generation and older saves get the same value.
export function workEthicOf(id: number) { return Math.round(cl(50 + nrm(seeded(id, 77)) * 18, 5, 99)); }
export const workLabel = (w: number) => (w >= 75 ? 'Tireless worker' : w >= 60 ? 'Hard worker' : w >= 40 ? 'Normal work ethic' : w >= 25 ? 'Coasts at times' : 'Poor work ethic');

export type DevPath = 'specialist' | 'two' | 'rounded' | 'organic';
export interface DevProfile { aff: Record<string, number>; path: DevPath; lead: string[]; low: string; athPeak: number; cap: Record<string, number> }
// How well a skill group suits his position (from the overall's weights), softened: a guard leans to
// shooting and playmaking, a big to finishing and the glass, but anyone can grow anything.
function fitOf(grp: string, g: string) {
  const W = OVR_W[grp] || OVR_W.W, avg = SKILLS.reduce((a, k) => a + W[k], 0) / SKILLS.length, ks = GROUPS[g].keys;
  return Math.pow(ks.reduce((a, k) => a + W[k], 0) / ks.length / avg, 0.45);
}
const PROFILES = new Map<string, DevProfile>();
// His development profile: hidden, fixed for life (from his id and position group).
//  • About 30% are specialists (one area takes most of the growth, another barely moves), 20% grow
//    two areas, 15% are well-rounded (a little everywhere) and the rest grow their own uneven way.
//  • His athletic peak (26–29.5), when speed, burst and leaping start to decline.
//  • His frame: how much quickness (usually a little), strength and stamina he can still add from 18.
export function devProfile(p: any): DevProfile {
  const key = p.id + ':' + p.grp; let d = PROFILES.get(key); if (d) return d;
  const r = seeded(p.id, 101), gs = Object.keys(GROUPS), u = r();
  const path: DevPath = u < 0.3 ? 'specialist' : u < 0.5 ? 'two' : u < 0.65 ? 'rounded' : 'organic';
  const aff: Record<string, number> = Object.fromEntries(gs.map(g => [g, Math.exp((path === 'rounded' ? 0.15 : 0.4) * nrm(r)) * fitOf(p.grp, g)]));
  const pick = (not: string[], byFit: boolean) => { const c = gs.filter(g => !not.includes(g)), w = c.map(g => (byFit ? fitOf(p.grp, g) : 1)); let x = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < c.length; i++) { x -= w[i]; if (x <= 0) return c[i]; } return c[c.length - 1]; };
  const lead: string[] = [];
  const top = (not: string[]) => Math.max(...gs.filter(g => !not.includes(g)).map(g => aff[g]));
  if (path === 'specialist') { lead.push(pick([], true)); aff[pick(lead, false)] *= 0.45; aff[lead[0]] = Math.max(aff[lead[0]] * 2.1, top(lead) * 1.6); } // his area clearly leads
  else if (path === 'two') { lead.push(pick([], true)); lead.push(pick(lead, true)); const t = top(lead); lead.forEach(g => (aff[g] = Math.max(aff[g] * 1.7, t * 1.2))); }
  const m = gs.reduce((a, g) => a + aff[g], 0) / gs.length; gs.forEach(g => (aff[g] = +(aff[g] / m).toFixed(3)));
  const ath = 0.5 + Math.pow(r(), 1.6) * 6.5;
  const cap = { spd: ath * (0.6 + r() * 0.8), acc: ath * (0.6 + r() * 0.8), jmp: ath * (0.6 + r() * 0.8), stre: 4 + r() * 12, endu: 3 + r() * 9 };
  d = { aff, path, lead, low: gs.slice().sort((a, b) => aff[a] - aff[b])[0], athPeak: +(26 + r() * 3.5).toFixed(1), cap };
  PROFILES.set(key, d); return d;
}

// This season's emphasis: what he happened to work on (a summer spent on his handle). Same all season.
function emphasis(p: any, year: number) { const r = seeded(p.id, year, 7); return Object.fromEntries(Object.keys(GROUPS).map(g => [g, Math.exp(0.25 * nrm(r))])); }

// keys: the training focus's ratings; reps: his system's practice reps; role: his role in games (environment.ts roleReps)
export interface WeightOpts { year: number; keys?: string[]; reps?: Record<string, number> | null; repF?: number; role?: Record<string, number> | null }
// w: each skill's share of growth; lazy: how far each is from what he's working on (0–1: a skill he
// isn't working on slips a little; one that's simply maxed out at its ceiling doesn't).
export interface Weights { w: Record<string, number>; lazy: Record<string, number> }
const LATE: Record<string, 1> = { oiq: 1, diq: 1, box: 1 }; // feel for the game comes with years
const EARLY: Record<string, 1> = { dnk: 1, blk: 1 }; // the skills that ride on young legs
// How a year's growth is shared among his skills. A skill grows toward its own ceiling (p.ceil,
// potential.ts) and stops there.
export function skillWeights(p: any, o: WeightOpts): Weights {
  const d = devProfile(p), e = emphasis(p, o.year), a = p.age, focus = (o.keys || []).filter(k => SKILLS.includes(k));
  const v = (k: string) => p.r[k] + ((p.rx || {})[k] || 0), avg = SKILLS.reduce((s, k) => s + v(k), 0) / SKILLS.length, w: Record<string, number> = {}, it: Record<string, number> = {};
  SKILLS.forEach(k => {
    const g = GROUP_OF[k];
    let i = d.aff[g] * e[g] * (o.role?.[g] ?? 1); // what he works on, and what his role in games asks of him
    if (LATE[k]) i *= cl(0.65 + (a - 19) * 0.08, 0.65, 1.4);
    if (EARLY[k]) i *= cl(1.25 - (a - 21) * 0.08, 0.5, 1.25);
    if (focus.length) i *= focus.includes(k) ? 2.2 : 0.45; // the training focus decides where growth goes, not how much
    if (o.reps?.[k]) i *= 1 + o.reps[k] * (o.repF ?? 1) * repAffinity(p, k); // his system's practice reps
    it[k] = i;
    w[k] = i * cl(1 + (v(k) - avg) / 50, 0.6, 1.4) // what he already has a feel for grows faster
      * cl(((p.ceil?.[k] ?? 100) - v(k)) / 12, 0.02, 1.4) * cl((100 - v(k)) / 40, 0.05, 1.2); // and slows near its ceiling
  });
  const mi = SKILLS.reduce((s, k) => s + it[k], 0) / SKILLS.length || 1;
  return { w, lazy: Object.fromEntries(SKILLS.map(k => [k, cl(1 - it[k] / mi, 0, 1)])) };
}

// Where a decline shows first: the athletic skills go, feel for the game and the shot hold on.
const SLIP: Record<string, number> = { oiq: 0.35, diq: 0.5, pss: 0.45, box: 0.6, ft: 0.55, fg: 0.6, tp: 0.65, drb: 0.9, lay: 1, ins: 0.9, reb: 1, stl: 1.2, blk: 1.5, dnk: 1.8 };
const NEGLECT = 0.22; // the cost of growth elsewhere: a skill he isn't working on stalls, or slips
const SPILL = 1.6; // no skill grows more than about 1.6× faster than an even spread would need
export const dimAt = (v: number, gen = false) => { const k = gen ? 85 : 75; return v <= k ? 1 : Math.exp(-(v - k) / 16); }; // a generational skill (p.gen, potential.ts) keeps growing longer
// Spread an overall change (in overall points) across his skills by the weights. A skill with a small
// share slips a little, and the overall moves by `target`. When most of it would go into skills that
// count little at his position (a guard who learns to box out), part of it spills over evenly so a
// single skill doesn't run away. Returns rating changes.
export function skillChange(p: any, target: number, sw: Weights): Record<string, number> {
  const W = OVR_W[p.grp] || OVR_W.W, T = Object.values(W).reduce((a, b) => a + b, 0), out: Record<string, number> = {};
  if (!target) { SKILLS.forEach(k => (out[k] = 0)); return out; }
  const up = target > 0, base = up ? sw.w : SLIP, m = SKILLS.reduce((a, k) => a + base[k], 0) / SKILLS.length || 1;
  const u: Record<string, number> = Object.fromEntries(SKILLS.map(k => [k, base[k] / m - (up ? NEGLECT * sw.lazy[k] : 0)]));
  const ws = SKILLS.reduce((a, k) => a + W[k], 0), den = SKILLS.reduce((a, k) => a + W[k] * u[k], 0);
  if (den < ws / SPILL) { const b = (ws / SPILL - den) / (ws - den); SKILLS.forEach(k => (u[k] = (1 - b) * u[k] + b)); }
  const c = (target * T) / SKILLS.reduce((a, k) => a + W[k] * u[k], 0);
  SKILLS.forEach(k => (out[k] = c * u[k]));
  // Diminishing returns: the higher a skill already is, the less of the growth aimed at it lands there
  // (about half at 85, a third at 90, a quarter at 95); the rest goes to his other skills below.
  const vv = (k: string) => p.r[k] + ((p.rx || {})[k] || 0);
  let lost = 0; if (up) SKILLS.forEach(k => { const f = dimAt(vv(k), p.gen === k); if (f < 1 && out[k] > 0) { lost += W[k] * out[k] * (1 - f); out[k] *= f; } });
  // A rating can't pass its ceiling (or drop below 4): what doesn't fit goes to his other skills, so
  // the overall moves by `target` while there's room anywhere (a star maxed in his best skills grows
  // elsewhere); with every skill at its ceiling, he's done growing.
  for (let pass = 0; pass < 3; pass++) {
    const v = (k: string) => p.r[k] + ((p.rx || {})[k] || 0); let spill = 0; const open: string[] = [];
    SKILLS.forEach(k => { const top = Math.min(99.5, (p.ceil?.[k] ?? 99.5) + 0.5), hi = Math.max(0, top - v(k)), lo = 4 - v(k); if (out[k] > hi) { spill += W[k] * (out[k] - hi); out[k] = hi; } else if (out[k] < lo) { spill += W[k] * (out[k] - lo); out[k] = lo; } else if ((up || u[k] > 0) && (up ? v(k) + out[k] < top - 1 : v(k) + out[k] > 6)) open.push(k); }); // growth that doesn't fit can land on any skill with room left
    if (pass === 0) spill += lost;
    if (!spill || !open.length) break;
    const sw2 = (k: string) => Math.max(0.15, u[k]) * (up ? dimAt(v(k), p.gen === k) : 1), den2 = open.reduce((a, k) => a + W[k] * sw2(k), 0); open.forEach(k => (out[k] += (spill * sw2(k)) / den2));
  }
  return out;
}

// The body: how much of each physical rating's lifetime growth is still ahead at each age.
const YOUTH: Record<string, (a: number) => number> = {
  spd: a => cl((22.5 - a) / 4.5, 0, 1), acc: a => cl((22.5 - a) / 4.5, 0, 1), jmp: a => cl((22.5 - a) / 4.5, 0, 1),
  stre: a => cl((26.5 - a) / 8.5, 0, 1), endu: a => cl((27 - a) / 9, 0, 1),
};
const YEAR_CAP: Record<string, number> = { spd: 2.5, acc: 2.5, jmp: 2.5, stre: 4, endu: 4 };
// How much a physical rating can still grow (his frame, at his age).
export function bodyLeft(p: any, k: string) { const d = devProfile(p), ph = p.ph || { a0: p.age, g: {} }; return Math.max(0, Math.min(d.cap[k] * YOUTH[k](ph.a0) - (ph.g[k] || 0), d.cap[k] * YOUTH[k](p.age))); }
export interface BodyOpts { focus?: string; work: number; slow: number; rnd: () => number; dry?: boolean }
// His physical ratings over part of a year (frac: 1/12 for a month in season, 0.5 for the summer).
// Growth comes from his frame and age only (Athleticism or Conditioning focus speeds it up, never past
// his frame); decline starts at his athletic peak for speed, burst and leap, at 29 for stamina and 31
// for strength (`slow`: work ethic and professionalism slow it). `dry`: a preview, nothing is recorded.
export function bodyChange(p: any, frac: number, o: BodyOpts): Record<string, number> {
  const d = devProfile(p), a = p.age, ph = p.ph || { a0: a, g: {} }, out: Record<string, number> = {};
  if (!o.dry && !p.ph) p.ph = ph;
  BODY.forEach(k => {
    const Y = YOUTH[k], left = d.cap[k] * Y(ph.a0) - (ph.g[k] || 0);
    let x = 0;
    if (left > 0) {
      const f = (o.focus === 'Athleticism' && k !== 'endu') || (o.focus === 'Conditioning' && k === 'endu') ? 1.5 : o.focus === 'Rebounding' && k === 'stre' ? 1.2 : 1;
      x = Math.min(left, Math.min(YEAR_CAP[k], d.cap[k] * Math.max(0, Y(a) - Y(a + 1)) * f * (0.85 + o.work / 333) * (0.5 + o.rnd())) * frac);
      if (!o.dry) ph.g[k] = +((ph.g[k] || 0) + x).toFixed(3);
    }
    const t = k === 'stre' ? a - 31 : k === 'endu' ? a - 29 : a - d.athPeak;
    if (t >= 0) x -= (k === 'stre' ? 0.3 + 0.35 * t : k === 'endu' ? 0.4 + 0.45 * t : 0.4 + 0.5 * t + 0.04 * t * t) * o.slow * frac;
    out[k] = x;
  });
  return out;
}
// A young player's body arrives ahead of his game: athletes come into the league close to the speed
// and leaping they'll have at their peak, while their skills have most of the way to go. So a new young
// player's physical ratings start about where his peak would put them (less what his
// frame still adds), and his skills start lower by the same weight: his overall doesn't change. `room`:
// how much his overall is expected to grow (potential − overall).
export function bodyAhead(p: any, room: number) {
  if (!(room > 0) || !p.r) return;
  const d = devProfile(p), W = OVR_W[p.grp] || OVR_W.W, sh: Record<string, number> = {};
  BODY.forEach(k => (sh[k] = cl(room - d.cap[k] * YOUTH[k](p.age), 0, 30)));
  const down = BODY.reduce((a, k) => a + W[k] * sh[k], 0) / SKILLS.reduce((a, k) => a + W[k], 0);
  BODY.forEach(k => (p.r[k] = Math.round(cl(p.r[k] + sh[k], 4, 100))));
  SKILLS.forEach(k => (p.r[k] = Math.round(cl(p.r[k] - down, 4, 100))));
}
// The overall change a set of rating changes makes.
export function ovrDelta(p: any, dl: Record<string, number>) {
  const W = OVR_W[p.grp] || OVR_W.W, T = Object.values(W).reduce((a, b) => a + b, 0);
  let x = 0; for (const k in dl) x += (W[k] ?? 0) * dl[k]; return x / T;
}
// Add rating changes through the hidden decimals (whole points land on the rating).
export function applyChange(p: any, dl: Record<string, number>) {
  p.rx = p.rx || {};
  for (const k in dl) {
    if (k === 'hgt' || !dl[k]) continue;
    const x = (p.rx[k] || 0) + dl[k], whole = Math.trunc(x), r = p.r[k] + whole;
    if (r > 100 || r < 4) { p.r[k] = cl(r, 4, 100); p.rx[k] = 0; } else { p.r[k] = r; p.rx[k] = +(x - whole).toFixed(4); }
  }
}
// One stretch of development: the body on its own track, then the rest of the overall change (target)
// spread across his skills. Body growth never pulls his skills down; body decline is part of the target.
export function develop(p: any, target: number, frac: number, o: BodyOpts & WeightOpts): Record<string, number> {
  const body = bodyChange(p, frac, o), bo = ovrDelta(p, body);
  const rest = target >= 0 ? Math.max(0, target - bo) : target - bo;
  const sk = skillChange(p, rest, skillWeights(p, o));
  return { ...body, ...sk };
}

// The coaching budget's effect: diminishing returns, at most +12% growth at the maximum ($40M) and −9%
// at the minimum ($5M); it slows aging by a little less. A multiplier, never flat points: good coaching
// helps a player reach his ceiling, it doesn't raise it.
export function coachMult(budget = 18) { const c = cl((budget - 18) / 22, -0.6, 1); return c >= 0 ? 1 + (0.12 * (1 - Math.exp(-2.5 * c))) / (1 - Math.exp(-2.5)) : 1 + 0.15 * c; }
export const coachAging = (m: number) => 1 - (m - 1) * 0.6;

// What his coaching staff can tell you about how he develops (exact: God Mode adds the hidden numbers).
export function devOutlook(p: any, exact: boolean): [string, string][] {
  const d = devProfile(p), L = (g: string) => GROUPS[g].label, a = p.age, out: [string, string][] = [];
  const top = Object.keys(d.aff).sort((x, y) => d.aff[y] - d.aff[x]), f = (g: string) => d.aff[g];
  out.push(['Growth goes to', f(top[0]) >= 1.6 * f(top[1]) ? 'Mostly ' + L(top[0]) + ' (a specialist)' : f(top[4]) >= 0.7 && f(top[0]) <= 1.35 ? 'A little of everything (well-rounded)' : f(top[1]) >= 1.15 * f(top[2]) ? L(top[0]) + ' and ' + L(top[1]) : L(top[0]) + ', then ' + L(top[1])]);
  out.push(['Slowest to grow', L(d.low)]);
  const ph = p.ph || { a0: a, g: {} }, left = (k: string) => d.cap[k] * YOUTH[k](ph.a0) - (ph.g[k] || 0);
  const quick = ['spd', 'acc', 'jmp'].some(k => left(k) > 0.5 && YOUTH[k](a) > 0), strong = left('stre') > 1 && YOUTH.stre(a) > 0;
  out.push(['Body', a >= d.athPeak ? 'Past his athletic peak: speed and leaping are going' : quick ? 'Still getting a little quicker; ' + (strong ? 'filling out' : 'close to his full strength') : strong ? 'Quickness is set; still filling out' : a >= d.athPeak - 1.5 ? 'At his athletic peak' : 'Physically mature']);
  out.push(['Work ethic', workLabel(p.pers?.work ?? 50)]);
  if (exact) out.push(['Hidden profile', Object.keys(d.aff).map(g => L(g) + ' ' + d.aff[g].toFixed(2)).join(' · ') + ' · athletic peak ' + d.athPeak + ' · frame left: ' + BODY.map(k => k + ' +' + Math.max(0, left(k)).toFixed(1)).join(', ') + ' · work ' + (p.pers?.work ?? 50)]);
  return out;
}

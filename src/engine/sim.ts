// Possession-by-possession game engine. One engine plays every game: the Live Game
// screen steps it on a timer, quick sims run it to the end.
//
// Everything is anchored on the 2026 league baselines below (the 50th percentile).
// Player ratings only move a player away from those means (the "bell curve"), and the
// league normalization in norms.ts re-centres the curves every season, so rating drift
// never inflates league stats. These formulas are engine code, not save data: nothing in
// God Mode can edit them.

import { tacticEffects, type TacFx, type Tactics } from './tactics';
import { gamePlan, liveTactics, type CoachPlan, type LiveMemory, type TacKey } from './coach';
export type { Tactics } from './tactics';

export type Side = 'home' | 'away';
export type Zone = 'rim' | 'mid' | 'c3' | 'atb';
export const ZONES: Zone[] = ['rim', 'mid', 'c3', 'atb'];

// ── 2025-26 baselines (per team, per game; Basketball-Reference league averages) ─────
// The league's spread matches too: team scoring from about 106 to 122 a game (2025-26: Brooklyn 105.9,
// Denver 122.1), ORtg and net rating spreads, single-game margins and home court (LINEUP_REG,
// TOV_K, LEAD_K, the venue and tempo effects).
export const BASE = {
  pace: 99.4, pts: 115.6,
  fg: 0.471, tp: 0.360, tpa: 37.0, ft: 0.783,
  trb: 43.8, orb: 11.4, drb: 32.4, ast: 26.7, stl: 8.4, blk: 4.8, tov: 14.5,
  ortg: 115.8, ts: 0.581, efg: 0.546, tovPct: 0.127, orbPct: 0.26, ftr: 0.206,
  dist: 14.5, rimPct: 0.696, c3Pct: 0.388,
  // The four shot-quality tiers the engine simulates: share of FGA, FG%, average
  // distance (ft) and assisted rate. Together they reproduce the league lines above
  // (47.1% FG, 43% of shots from three at 36.0%, corner threes 38.8%, rim 69.6%, 14.6 ft).
  zone: {
    rim: { share: 0.31, pct: 0.696, dist: 2.5, ast: 0.55 },
    mid: { share: 0.26, pct: 0.37, dist: 12.2, ast: 0.48 },
    c3: { share: 0.105, pct: 0.388, dist: 22.5, ast: 0.95 },
    atb: { share: 0.325, pct: 0.351, dist: 25.8, ast: 0.82 },
  } as Record<Zone, { share: number; pct: number; dist: number; ast: number }>,
};

// The mid tier holds two NBA shot zones: in the paint outside the restricted area (floaters, hooks,
// short turnarounds; about half of these shots) and mid-range. Paint shots go in a little more often
// (and touch around the rim counts for them); mid-range a little less, so the tier's average holds.
export const PAINT_SHARE = 0.52;
const PAINT_D = 0.02;
// ── Creating jump shots (tendencies.ts: catch & shoot, pull-up, stepback, fadeaway) ──────────────────
export type Cre = 'cns' | 'pullup' | 'step' | 'fade';
export const CRES: Cre[] = ['cns', 'pullup', 'step', 'fade'];
export type JumpZone = 'mid' | 'c3' | 'atb';
// League shares of jump shots: about half off the catch, a third pulled up, stepbacks and fadeaways the rest.
export const CRE_BASE: Record<Cre, number> = { cns: 0.52, pullup: 0.32, step: 0.09, fade: 0.07 };
// Where each is taken: corner threes are nearly all catch-and-shoot, fadeaways are mid-range shots.
const CRE_Z: Record<JumpZone, Record<Cre, number>> = { mid: { cns: 0.75, pullup: 1, step: 0.8, fade: 1.9 }, c3: { cns: 1, pullup: 0.3, step: 0.35, fade: 0.05 }, atb: { cns: 1, pullup: 1, step: 1.15, fade: 0.25 } };
export function creMix(cre: Record<Cre, number> | undefined, z: JumpZone): Record<Cre, number> {
  const c = cre || CRE_BASE, w = {} as Record<Cre, number>; let t = 0;
  for (const k of CRES) { w[k] = Math.max(0, c[k] ?? 0) * CRE_Z[z][k]; t += w[k]; }
  for (const k of CRES) w[k] = t > 0 ? w[k] / t : CRE_BASE[k];
  return w;
}
// Make rate by type (re-centred on the league below): off the catch is the cleanest look; his handle
// makes pull-ups, his handle and quickness stepbacks, and mid-range touch, size and strength fadeaways.
export function creAdj(r: any, c: Cre): number {
  const drb = r.drb ?? 50, acc = r.acc ?? r.spd ?? 50;
  return c === 'cns' ? 0.022 : c === 'pullup' ? -0.015 + 0.0006 * (drb - 55) : c === 'step' ? -0.045 + 0.0012 * ((drb + acc) / 2 - 55)
    : -0.035 + 0.001 * ((r.fg ?? 50) * 0.5 + (r.hgt ?? 50) * 0.25 + (r.stre ?? 50) * 0.25 - 52);
}
// Assisted (a catch-and-shoot make nearly always is, a stepback almost never) and blocked (fades and stepbacks create space).
const CRE_AST: Record<Cre, number> = { cns: 1.5, pullup: 0.22, step: 0.12, fade: 0.55 };
const CRE_BLK: Record<Cre, number> = { cns: 1, pullup: 1.1, step: 0.45, fade: 0.3 };
export interface CreMean { pct: number; ast: number; blk: number }
export function creMeanOf(r: any, cre: Record<Cre, number> | undefined, z: JumpZone): CreMean {
  const m = creMix(cre, z); let pct = 0, ast = 0, blk = 0;
  for (const k of CRES) { pct += m[k] * creAdj(r, k); ast += m[k] * CRE_AST[k]; blk += m[k] * CRE_BLK[k]; }
  return { pct, ast, blk };
}
const TYP_R = { drb: 55, acc: 55, spd: 55, fg: 52, hgt: 52, stre: 52 };
const DEFAULT_CRE: Record<JumpZone, CreMean> = { mid: creMeanOf(TYP_R, undefined, 'mid'), c3: creMeanOf(TYP_R, undefined, 'c3'), atb: creMeanOf(TYP_R, undefined, 'atb') };
const CRE_KEY: Record<Cre, [keyof BoxLine, keyof BoxLine]> = { cns: ['qm', 'qa'], pullup: ['um', 'ua'], step: ['sm', 'sa'], fade: ['dm', 'da'] };
const CRE_LABEL: Record<Cre, string> = { cns: 'a catch-and-shoot', pullup: 'a pull-up', step: 'a stepback', fade: 'a fadeaway' };

// Per offensive trip at league average (≈115 trips a game: 89 FGA, 14.5 TOV, FT-only trips).
// Offensive-rebound chance per point of glass-skill edge between the lineups (2026-10-17: 0.004 → 0.0022).
const ORB_K = 0.0022;
// How much a lineup's ball-handling, feel and IQ (offense) and pressure, feel and hands (defense) move
// the turnover rate: a 1/k change in the exponent per rating point (2025-26 team TOV% spread).
// 2026-10-17: handle 200 → 240, press 85 → 110: team TOV% spread was wider than the NBA's (sd 0.011–0.014 vs about
// 0.010) and turnovers drove too much of the gap between good and bad teams.
const TOV_K = { handle: 240, press: 110, feelO: 400, feelD: 210, oiq: 350, hands: 420 };
const RATE = { tov: 0.118, stealShare: 0.573, offFoul: 0.1, foulTrip: 0.066, nonShoot: 0.066, andOne: 0.072, rebCredit: 0.89, liveFt: 0.9, astF: 1.39, dt: 1.075 };
// Small constant nudges (fatigue, venue and adjustment penalties sit below zero on average);
// found by simulating full seasons against the baselines.
export const CAL: Record<Zone | 'ft', number> = { rim: 0.007, mid: 0.008, c3: 0.007, atb: 0.005, ft: 0.019 };
// Defenses key on a lineup of shot-makers and help off one that can't shoot, so part of a lineup's
// shooting edge (its players' usage-weighted average against the league) is given back on every
// shot; the differences between its own players stay. Without it, team shooting spread about twice
// as wide as the NBA's (2025-26 team eFG%: .520 to .577).
const LINEUP_REG = 0.66;
// The scoreboard: a team well ahead relaxes (looser shots, careless passes) and one well behind plays
// with urgency, so margins drift back a little, as in real games: NBA margins vary about 12–13 points
// around what the two teams' strength predicts (independent trips alone would give about 18).
const LEAD_K = 0.0018;
export const BLOCK_ON_MISS: Record<Zone, number> = { rim: 0.36, mid: 0.053, c3: 0.008, atb: 0.008 };

// ── The bell curve: rating → deviation from the baseline percentage ─────────────
// Asymmetric on purpose: elite ratings add little (a 90 three-point shooter is ~40%),
// poor ratings cost a lot (a 40 is ~27%). The norms' offsets re-centre the league mean.
const CURVE: Record<string, { mid: number; up: number; down: number; soft?: number }> = {
  three: { mid: 65, up: 0.0016, down: 0.0029 },
  rim: { mid: 60, up: 0.0025, down: 0.0032 },
  jumper: { mid: 55, up: 0.0022, down: 0.0028 },
  ft: { mid: 60, up: 0.005, down: 0.005, soft: 80 }, // the best shooters are 90–93% (Curry, Nash): a 90 is about 90%, a 100 about 92.5%
};
// Above average, each extra point is worth a little less (an elite finisher makes ~75–80% at the rim,
// not 90%), so superstars' efficiency stays in the range of the NBA's best.
// Free throws fall off faster at the bottom: below 40 each point costs half again as much, so a 20
// shoots like Shaq (about 53–55%) and a 1 like Ben Wallace (about 41%), not a passable 51%.
const FT_KNEE = 40, FT_LOW = 0.0025, FT_PERFECT = 98.5; // a perfect 99: 98% (ftPct)
export const curve = (k: string, r: number) => { const c = CURVE[k], d = r - c.mid; return (d >= 0 ? (d * c.up) / (1 + d / (c.soft ?? 40)) : d * c.down) - (k === 'ft' ? FT_LOW * Math.max(0, FT_KNEE - r) : 0); };
export const CURVE_OF: Record<Zone, string> = { rim: 'rim', mid: 'jumper', c3: 'three', atb: 'three' };

// A player's skill for each tier (0–99 scale).
// At the rim, size counts: a 6'2" guard finishes over and around length that a 7-footer just
// shoots over, so in the NBA small guards make about 58–64% in the restricted area and centers
// 70%+. Height and length (wingspan) are a big part of finishing; touch and craft (Layups, Inside)
// let a skilled small guard still finish well.
// On top of that, a straight size edge on every rim shot: about 4 points of FG% between a 6'2" guard
// and a 7-footer with the same skills (centered on the league, so overall scoring doesn't move).
const RIM_SIZE = 0.0015;
export function zoneSkill(r: any): Record<Zone, number> {
  // A taller shooter gets his jumper off over the contest a little more easily (a few points of skill for
  // half a foot); long arms help at the rim.
  return { rim: 0.2 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.2 * r.ins + 0.25 * r.hgt + 0.1 * r.jmp + ape(r) * 1.0, mid: r.fg + 0.12 * (r.hgt - 50), c3: r.tp + 0.08 * (r.hgt - 50), atb: r.tp + 0.08 * (r.hgt - 50) };
}
// Offensive ability as a scorer and creator (not his overall: a defensive specialist can be a 70
// and still not a scorer). Rotation players average about 57.
export function offAbility(r: any) {
  const rim = 0.25 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.3 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, z = [rim, r.fg, r.tp].sort((a, b) => b - a);
  const scoring = z[0] * 0.5 + z[1] * 0.3 + z[2] * 0.1 + r.ft * 0.1;
  return scoring * 0.55 + r.drb * 0.17 + r.oiq * 0.15 + (r.acc ?? r.spd) * 0.13;
}

// Raw usage weight: how often he ends a possession while on the floor. USG% in the UI is
// this relative to the league mean (= 20%). This is the usage-rate gatekeeper: volume
// comes from usage and minutes, efficiency from shooting ratings, so a pure shooter with
// low usage can't put up star numbers (points ≈ possessions × USG% × TS%). Two parts: what his
// offensive game earns him right away (a better scorer and creator gets more of the ball; his
// overall doesn't, so a defensive specialist isn't fed like a scorer), times his shot-volume
// tendency, which carries his role, confidence and habits and moves over seasons (tendencies.ts).
export function usageRaw(p: { ovr: number; r: any; alpha?: boolean; touches?: boolean; roles?: string[]; tend?: Tend }) {
  let u = Math.exp(0.019 * (offAbility(p.r) - 57)) * (p.tend?.usg ?? 1);
  if (p.alpha) u *= 1.05;
  if (p.touches) u *= 1.06;
  if (p.roles?.includes('Primary creator')) u *= 1.05;
  return u;
}
export const mental = (r: any) => (r.oiq + r.diq) / 2;
// `ape` is wingspan minus height in inches (the league averages about +4): long arms help
// contests, blocks, rebounds and steals; short arms hurt them.
const ape = (r: any) => (r.ape ?? 4) - 4;
// Defensive IQ is positioning: staying in front, rotating on time, helping and recovering, reading
// the play. It drives team defense (how hard every shot is), fouls and defensive three seconds.
// Blocks and Steals are separate skills: they decide who gets the blocks and steals. A defender whose
// shot-blocking or steals run well ahead of his Defensive IQ gambles: he racks up the numbers but
// leaves his spot, so the shots he doesn't get to are easier (the Hassan Whiteside effect).
export const perimD = (r: any) => r.diq * 0.5 + r.spd * 0.125 + (r.acc ?? r.spd) * 0.125 + r.hgt * 0.25 + ape(r) * 0.8; // size and length contest shots on the perimeter too
export const interiorD = (r: any) => r.hgt * 0.4 + r.diq * 0.3 + (r.blk ?? r.hgt) * 0.15 + r.jmp * 0.15 + ape(r) * 1.5;
// Piling up blocks takes everything at once: timing and leap (Blocks), height and length, the lift
// to get up, the lateral quickness to rotate over in time, and the positioning (Defensive IQ) to be
// there. A weighted geometric mean, so a weakness anywhere drags it down: a long, bouncy shot-blocker
// who's slow or out of position still blocks some shots, just not a league-leading number.
const g01 = (v: number) => Math.max(5, Math.min(100, v)) / 100;
export const blockSkill = (r: any) => 100 * Math.pow(g01(r.blk ?? r.hgt), 0.32) * Math.pow(g01(r.hgt), 0.18) * Math.pow(g01(50 + ape(r) * 6), 0.15) * Math.pow(g01(r.jmp), 0.12) * Math.pow(g01((r.acc ?? r.spd) * 0.6 + r.spd * 0.4), 0.1) * Math.pow(g01(r.diq), 0.16);
export const stealSkill = (r: any) => (r.stl ?? r.diq) * 0.7 + (r.acc ?? r.spd) * 0.15 + r.spd * 0.15 + ape(r) * 1.0;
export const gambleB = (r: any) => Math.max(0, (r.blk ?? r.diq) - r.diq - 8);
export const gambleS = (r: any) => Math.max(0, (r.stl ?? r.diq) - r.diq - 8);
export const rebSkill = (r: any) => r.reb * 0.55 + r.hgt * 0.33 + r.jmp * 0.12 + ape(r) * 0.9;
// Team rebounding also counts box-outs: a great boxer wins the glass for his team without
// grabbing many rebounds himself.
export const glassSkill = (r: any) => rebSkill(r) * 0.75 + (r.box ?? r.reb) * 0.25;
// Floors for handing out assists, steals, blocks and rebounds. Anyone playing real minutes picks
// up some of each just by being on the floor (a kick-out, a loose ball, a long rebound), so the
// worst passers, rebounders and defenders count as these skill levels when the credit is shared
// out. The team totals don't change, only who gets them; the best players lose a sliver.
// Without them a weak passer in 20+ minutes a night averaged 0.2 assists, a small guard under a
// rebound, a slow big 0.2 steals; nobody in NBA history with real minutes posts lines like that.
const PASS_FLOOR = 42, REB_FLOOR = 36, STEAL_FLOOR = 32, BLOCK_FLOOR = 30;

export interface Norms {
  season: number;
  usage: number; // minutes-weighted mean raw usage
  skill: Record<Zone, number>; // volume-weighted mean tier skill
  offset: Record<Zone, number>; // re-centres each tier's curve on its baseline
  shareCorr: Record<Zone, number>; // keeps the league shot mix on the baseline shares
  ftOffset: number;
  perimD: number; interiorD: number; reb: number; pss: number; handle: number;
  rimHgt?: number; // the league's typical height rating at the rim, weighted by rim attempts
  diq?: number; oiq?: number; blk?: number; stl?: number; gamB?: number; gamS?: number; // minutes-weighted league means (blk: each team's top shot-blockers)
  cre?: Record<JumpZone, CreMean>; // the league's jump-shot creation, per tier: keeps a typical mix on the league's make rate, assists and blocks
  adj?: Record<Zone, number>; tovM?: number; adjFrom?: number; // the league's drift correction (Game.leagueDrift): make rates by tier and turnovers, from last season's results
}
export const DEFAULT_NORMS: Norms = { season: 0, usage: 1, skill: { rim: 58, mid: 55, c3: 55, atb: 55 }, offset: { rim: 0, mid: 0, c3: 0, atb: 0 }, shareCorr: { rim: 1, mid: 1, c3: 1, atb: 1 }, ftOffset: 0, perimD: 55, interiorD: 58, reb: 58, pss: 55, handle: 55, diq: 52, oiq: 52, blk: 58, stl: 52, gamB: 2, gamS: 2 };

// Shot profile: the league tier shares tilted by the player's relative skill, roles and tactics.
// Shot tendencies: real players' shot diets aren't only their skills (rookie Luka Dončić took 43% of
// his shots from three while making 33%). Multipliers on each zone's share and on drawing shooting
// fouls, and how loose he is with the ball (risky passes); 1 (or missing) = what his skills and
// roles suggest. Set per player in God Mode.
export interface Tend { rim?: number; mid?: number; c3?: number; atb?: number; pf?: number; draw?: number; tov?: number; ast?: number; usg?: number; pass?: number; zs?: Record<Zone, number>; cre?: Record<Cre, number> } // zs: his shot mix as fractions (tendencies.ts, version 4: what he takes, used as is); cre: how he creates his jump shots // usg: how often he ends a possession (shot volume); pf: the share of his mid-tier shots taken in the paint; pass: how often he's the passer on a teammate's make
// Players carry evolving playing-style tendencies (tendencies.ts, effTend) that fill these in; autoTend
// below is only the fallback for a player without them.
// Every player's default shot diet, from his skills and personality (a hand-set tendency for a zone
// replaces it). A non-shooter barely takes threes (a big with no range lives at the rim); pull-up
// threes need a handle, so a spot-up shooter who can't dribble takes his threes from the corners and
// rarely drives; bad mid-range shooters avoid it. Heat checkers pull up, alphas and ball-stoppers
// take more of their own jumpers, team-first players more catch-and-shoot threes.
export function autoTend(p: any): Record<Zone, number> {
  const r = p.r || {}, f = p.pers || p, big = p.grp === 'B', cl2 = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const gate = (v: number, lo: number, hi: number) => { const x = cl2(((v ?? 50) - lo) / (hi - lo), 0, 1); return 0.03 + 0.97 * x * x; };
  const three = gate(r.tp, 18, 42), creator = ((r.drb ?? 50) + (r.acc ?? r.spd ?? 50)) / 2;
  const t: Record<Zone, number> = { rim: 1, mid: gate(r.fg, 15, 38), c3: three, atb: three };
  t.atb *= cl2(0.6 + (creator - 45) / 60, 0.5, 1.4);
  t.c3 *= cl2(1.35 - (creator - 45) / 80, 0.8, 1.5);
  if (!big) t.rim *= cl2((creator - 20) / 35, 0.45, 1.35);
  if (f.heat) t.atb *= 1.15;
  if (f.alpha) { t.mid *= 1.1; t.atb *= 1.08; }
  if (f.touches) t.mid *= 1.08;
  if (f.flashy) t.atb *= 1.08;
  if (f.volatile) t.mid *= 1.08;
  if (f.team) { t.c3 *= 1.1; t.atb *= 0.93; t.mid *= 0.93; }
  if (f.pro) t.c3 *= 1.05;
  return t;
}
export function shotProfile(p: { r: any; roles?: string[]; tend?: Tend; pers?: any; grp?: string }, n: Norms, mult?: Partial<Record<Zone, number>>) {
  // His own shot mix (tendencies.ts): what he takes, as set; only the game situation tilts it (tactics, a run-out).
  const zs = p.tend?.zs;
  if (zs) { let t = 0; const w = {} as Record<Zone, number>; for (const z of ZONES) { w[z] = Math.max(0, zs[z]) * (mult?.[z] ?? 1); t += w[z]; } for (const z of ZONES) w[z] = t > 0 ? w[z] / t : BASE.zone[z].share; return w; }
  const sk = zoneSkill(p.r), roles = p.roles || [], auto = autoTend(p);
  const w = {} as Record<Zone, number>;
  let tot = 0;
  for (const z of ZONES) {
    // Skill tilts the mix a little right away; most of how a better shooter shoots more comes through his
    // tendencies, which follow his skills gradually (tendencies.ts).
    let x = BASE.zone[z].share * n.shareCorr[z] * Math.exp((p.tend?.[z] != null ? 0.02 : 0.04) * (sk[z] - n.skill[z]));
    if (z === 'rim' && roles.includes('Slasher')) x *= 1.3;
    if ((z === 'c3' || z === 'atb') && roles.includes('Floor spacer')) x *= 1.25;
    if (z === 'c3' && roles.includes('3-and-D wing')) x *= 1.4;
    if ((z === 'c3' || z === 'atb') && roles.includes('Stretch big')) x *= 1.5;
    x *= p.tend?.[z] ?? auto[z];
    if (mult?.[z]) x *= mult[z]!;
    w[z] = x; tot += x;
  }
  for (const z of ZONES) w[z] /= tot;
  return w;
}

export interface SimPlayer {
  id: number; name: string; pos: string; grp: string; ovr: number; r: any;
  crowd?: boolean; clutch?: boolean; padder?: boolean; selfish?: boolean; alpha?: boolean; touches?: boolean;
  adj?: boolean; dtd?: boolean; fat?: number; age?: number; protect?: boolean; flag?: string;
  conf?: number; // hidden confidence 0–100 (50 neutral): a small shooting nudge either way
  roles?: string[];
  feel?: number; poise?: number; // intangibles (intangibles.ts): vision and anticipation; composure
  flashy?: boolean; heat?: boolean; volatile?: boolean; villain?: boolean; fearless?: boolean; // villain: hostile road crowds fire him up; fearless: wants the ball when it matters, pressure doesn't touch him
  // playing style: showtime passes; heat checks when hot; forced shots when frustrated
  tend?: Tend; // shot tendencies: how often he takes each shot and draws fouls (1 = what his skills suggest)
  hot?: number; // a streaky shooter's current run, −1 (ice cold) to +1 (on fire); 0 for everyone else
  target: number; // minutes per 48 the coach wants him to play
  manual?: boolean; // you set his minutes by hand (Roster: Manual): a lineup style doesn't push him far past them
}
export interface FourFactors { efg: number; tov: number; orb: number; ftr: number }
export interface SimTeam {
  tid: number; name: string; abbr: string; rec: string; players: SimPlayer[];
  tactics?: Tactics | null; situ?: { lead?: Tactics | null; trail?: Tactics | null } | null;
  ff?: FourFactors; // season Four Factors (regressed early on) for the clutch tiebreaker
  chem?: number; // locker room 0–100: a good room shoots a little better, a toxic one worse
  tempo?: number; // an extra pace multiplier on its trips' length (unused now that every team's staff sets the pace)
  aiKeys?: TacKey[]; // the settings its coaching staff runs (coach.ts); the rest come from `tactics` as set
  coach?: number; // the staff's quality, 0.35–0.95 (coach.ts coachQuality): how often it makes its reads
}
export interface SimOpts { pbp?: boolean; norms?: Norms }

export interface BoxLine {
  min: number; fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number; orb: number; drb: number;
  ast: number; tov: number; stl: number; blk: number; pf: number; pts: number; pm: number; gs: number;
  rm: number; ra: number; mm: number; ma: number; cm: number; ca: number; bm: number; ba: number; // made/att: rim, mid, corner 3, above-the-break 3
  km: number; ka: number; // made/att in the paint outside the restricted area (floaters, hooks): part of the mid tier (mm/ma count them too)
  qm: number; qa: number; um: number; ua: number; sm: number; sa: number; dm: number; da: number; // jump shots made/att by how he created them: catch & shoot, pull-up, stepback, fadeaway
}
export interface SideState { pts: number; qs: number[]; box: Record<number, BoxLine>; tiers: Record<string, [number, number]>; poss: number; fouls: number }
export interface SideResult { tid: number; pts: number; qs: number[]; box: Record<number, BoxLine>; poss: number }
export interface GameResult { home: SideResult; away: SideResult; ot: number; coach?: { home: string[]; away: string[] } } // coach: the staffs' game plans and adjustments
export interface PbpEvent { side: Side; time: string; text: string; sub: string; score: string; ids?: number[] }

export const TIER_KEY: Record<Zone, ['rm' | 'mm' | 'cm' | 'bm', 'ra' | 'ma' | 'ca' | 'ba']> = { rim: ['rm', 'ra'], mid: ['mm', 'ma'], c3: ['cm', 'ca'], atb: ['bm', 'ba'] };
export const blankLine = (): BoxLine => ({ min: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, pm: 0, gs: 0, rm: 0, ra: 0, mm: 0, ma: 0, cm: 0, ca: 0, bm: 0, ba: 0, km: 0, ka: 0, qm: 0, qa: 0, um: 0, ua: 0, sm: 0, sa: 0, dm: 0, da: 0 });
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');
const avg = (arr: SimPlayer[], f: (p: SimPlayer) => number) => arr.reduce((s, p) => s + f(p), 0) / arr.length;
function wpick<T>(arr: T[], w: (x: T) => number): T {
  const ws = arr.map(w), tot = ws.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
export const fmtClock = (t: number) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
export const qName = (q: number) => (q <= 4 ? 'Q' + q : 'OT' + (q > 5 ? q - 4 : ''));
const LABEL: Record<Zone, (p: SimPlayer) => string> = { rim: p => (p.r.dnk > 62 && Math.random() < p.r.dnk / ((p.r.lay ?? 50) + p.r.dnk) ? 'a dunk' : 'a layup'), mid: () => 'a mid-range jumper', c3: () => 'a corner three', atb: () => 'a three pointer' };

// Four Factors composite (Dean Oliver's 40/25/20/15 weights), in rough league standard deviations.
export const ffScore = (f: FourFactors) => (0.4 * (f.efg - BASE.efg)) / 0.025 + (0.25 * (BASE.tovPct - f.tov)) / 0.012 + (0.2 * (f.orb - BASE.orbPct)) / 0.025 + (0.15 * (f.ftr - BASE.ftr)) / 0.03;

// Intangibles are measured from the NBA average (Feel ≈ 54, Poise ≈ 55), so only the unusual stand out.
const FEEL_MID = 54, POISE_MID = 55;
// Shots at the rim: the most of a guard's or wing's shots that can come there (see the shot choice).
const RIM_CAP = 0.58;
const TIRED0 = 0.13; // a typical player's tiredness on the floor: fatigue effects are measured from it, so league totals hold
const SUB_MARGIN = 285; // seconds ahead of his minutes target before a bench player comes in

interface PlayerCache { use: number; prof: Record<Zone, number>; skill: Record<Zone, number>; role: boolean; star: boolean; q: number } // q: his shot-making against the league, over his own shot mix
type Ev = (ids: number[], text: () => string, sub?: () => string, scoring?: boolean) => void;

export class GameSim {
  q = 1;
  t = 720;
  pos: Side = Math.random() < 0.5 ? 'home' : 'away';
  done = false;
  pbp: PbpEvent[] = [];
  home: SideState;
  away: SideState;
  on: Record<Side, SimPlayer[]> = { home: [], away: [] };
  teams: Record<Side, SimTeam>;
  norms: Norms;
  private cache = new Map<SimPlayer, PlayerCache>();
  private afterOrb = false;
  private streak = new Map<number, number>(); // makes (+) or misses (−) in a row tonight, for heat checks and frustration
  // Energy tonight (0–100). It drains on the floor (slower with Endurance, faster for players 33 and up),
  // comes back on the bench and at the breaks, and starts lower for a player worn down by recent heavy
  // minutes (p.fat). A tired player (below about 88) shoots, handles, defends and rebounds worse, and the
  // rotation brings him out sooner.
  en = new Map<SimPlayer, number>(); // read by the live game view
  private tired(p: SimPlayer) { return cl((88 - (this.en.get(p) ?? 100)) / 60, 0, 1); }
  private drain(sec: number) {
    (['home', 'away'] as Side[]).forEach(k => this.teams[k].players.forEach(p => { const e = this.en.get(p) ?? 100, on = this.on[k].includes(p);
      this.en.set(p, cl(on ? e - (sec / 60) * 3.7 * (1.55 - p.r.endu / 100) * (p.age >= 33 ? 1.1 : 1) : e + (sec / 60) * 2.8, 0, 100)); }));
  }
  private rest(x: number) { this.en.forEach((e, p) => this.en.set(p, Math.min(100, e + x))); }
  private fastBreak = false; // the defense crashed the glass and lost the rebound: this trip is a run-out

  constructor(home: SimTeam, away: SimTeam, public opts: SimOpts = {}) {
    this.teams = { home, away };
    this.norms = opts.norms || DEFAULT_NORMS;
    const side = (t: SimTeam): SideState => ({ pts: 0, qs: [0, 0, 0, 0], box: Object.fromEntries(t.players.map(p => [p.id, blankLine()])), tiers: {}, poss: 0, fouls: 0 });
    this.home = side(home);
    this.away = side(away);
    [...home.players, ...away.players].forEach(p => this.en.set(p, cl(100 - 0.35 * (p.fat || 0) - (p.dtd ? 5 : 0), 55, 100)));
    // Each coaching staff's plan for tonight's opponent (coach.ts).
    (['home', 'away'] as Side[]).forEach(k => { const T = this.teams[k]; if (T.aiKeys?.length) this.plan[k] = gamePlan(T.players, this.teams[other(k)].players, T.coach ?? 0.65); });
    (['home', 'away'] as Side[]).forEach(k => {
      this.teams[k].players.forEach(p => {
        const use = usageRaw(p), rel = use / this.norms.usage;
        const prof = shotProfile(p, this.norms), skill = zoneSkill(p.r);
        this.cache.set(p, { use, prof, skill, role: rel < 0.9 && mental(p.r) < 62, star: rel >= 1.25 || mental(p.r) >= 65, q: ZONES.reduce((a, z) => a + prof[z] * (curve(CURVE_OF[z], skill[z]) + this.norms.offset[z]), 0) });
      });
      this.on[k] = this.avail(k).slice(0, 5);
      this.on[k].forEach(p => (this[k].box[p.id].gs = 1));
    });
    this[this.pos].poss++;
  }

  usgPct(p: SimPlayer) { return (20 * (this.cache.get(p)?.use || 1)) / this.norms.usage; }
  private elapsed() { return this.q <= 4 ? (this.q - 1) * 720 + (720 - this.t) : 2880 + (this.q - 5) * 300 + (300 - this.t); }
  private avail(k: Side) {
    const ps = this.teams[k].players.filter(p => this[k].box[p.id].pf < 6);
    return ps.length >= 5 ? ps : this.teams[k].players.slice(0, 5);
  }

  // Who is on the floor for the coming trip: minute targets, foul trouble, clutch and garbage time.
  private rotate(k: Side) {
    const S = this[k], ps = this.avail(k), diff = Math.abs(this.home.pts - this.away.pts);
    if (ps.length <= 5) { this.on[k] = ps; return; }
    const late = this.q >= 4 && this.t < 300;
    if ((late && diff > 20) || (this.q >= 4 && this.t < 480 && diff > 24) || (this.q >= 4 && this.t < 180 && diff > 15)) { // garbage time
      const deep = ps.slice(5).sort((a, b) => a.target - b.target);
      this.on[k] = (deep.length >= 5 ? deep : [...deep, ...ps.slice(0, 5)]).slice(0, 5);
      return;
    }
    if (late && diff <= 8) { this.on[k] = this.shape(k, ps.slice().sort((a, b) => b.target - a.target).slice(0, 5), ps); return; }
    if (this.q === 3 && this.t === 720) { this.on[k] = this.shape(k, ps.slice(0, 5), ps); return; }
    const el = this.elapsed();
    const trouble = (p: SimPlayer) => this.q <= 4 && S.box[p.id].pf >= this.q + 2 && !(this.q === 4 && this.t < 360);
    const deficit = (p: SimPlayer) => (p.target * 60 * el) / 2880 - S.box[p.id].min * 60 - (trouble(p) ? 900 : 0) - Math.max(0, 72 - (this.en.get(p) ?? 100)) * 10; // a gassed player sits
    let on = this.on[k].filter(p => ps.includes(p));
    for (const p of ps) if (on.length < 5 && !on.includes(p)) on.push(p);
    for (let guard = 0; guard < 5; guard++) {
      const bench = ps.filter(p => !on.includes(p));
      if (!bench.length) break;
      const inP = bench.reduce((a, b) => (deficit(b) > deficit(a) ? b : a));
      const outP = on.reduce((a, b) => (deficit(b) < deficit(a) ? b : a));
      if (deficit(inP) <= deficit(outP) + SUB_MARGIN) break;
      on = on.map(p => (p === outP ? inP : p));
    }
    this.on[k] = this.shape(k, on, ps, deficit);
  }

  // Lineup style: small ball keeps at most one big on the floor, twin towers two when available.
  // In the run of play the swaps follow the minutes (`need`: how far behind his minutes target each
  // player is): the big most due for minutes comes in for the wing least due, so every big on the roster
  // shares the time instead of the starter being sent straight back in (a 20-minute big played 46 a night
  // under Twin towers while two healthy bigs sat). Without `need` (the second-half and closing lineups)
  // they follow the targets.
  private shape(k: Side, on: SimPlayer[], ps: SimPlayer[], need?: (p: SimPlayer) => number) {
    // A player whose minutes you set by hand and who has had them goes to the back of the queue: the
    // extra minutes a lineup style needs go to the players on automatic minutes first.
    const lu = this.teams[k].tactics ? this.tac(k).lineup : null;
    if (lu !== 'Small ball' && lu !== 'Twin towers') return on;
    const nb0 = on.filter(p => p.grp === 'B').length;
    if ((lu === 'Small ball' && nb0 <= 1) || (lu === 'Twin towers' && nb0 >= 2)) return on; // already the right shape
    const ow = new Map<SimPlayer, number>(ps.map(p => { const d = need ? need(p) : 0; return [p, need ? d - (p.manual && d < 0 ? 1e5 : 0) : p.target]; }));
    const due = (a: SimPlayer, b: SimPlayer) => ow.get(b)! - ow.get(a)!; // most due first
    const big = (p: SimPlayer) => p.grp === 'B';
    for (let guard = 0; guard < 3; guard++) {
      const nb = on.filter(big).length, bench = ps.filter(p => !on.includes(p));
      if (lu === 'Small ball' && nb > 1) {
        const inP = bench.filter(p => !big(p)).sort(due)[0]; if (!inP) break;
        const outP = on.filter(big).sort(due).pop(); on = on.map(p => (p === outP ? inP : p));
      } else if (lu === 'Twin towers' && nb < 2) {
        const inP = bench.filter(big).sort(due)[0]; if (!inP) break;
        const outP = on.filter(p => !big(p)).sort(due).pop(); if (!outP) break; on = on.map(p => (p === outP ? inP : p));
      } else break;
    }
    return on;
  }

  plan: Partial<Record<Side, CoachPlan>> = {};
  mem: Record<Side, LiveMemory> = { home: { cp: -1, def: null }, away: { cp: -1, def: null } };
  // Tactics in force for a side right now: the settings you set (and your situational presets, late in
  // games), and for the rest the coaching staff's call for this trip (coach.ts liveTactics).
  tac(k: Side): Tactics {
    const T = this.teams[k], lead = this[k].pts - this[other(k)].pts;
    let t: Tactics = T.tactics || {};
    if (T.situ && this.q >= 4 && this.t < 300) {
      if (lead >= 6 && T.situ.lead) t = { ...t, ...T.situ.lead };
      if (lead <= -6 && T.situ.trail) t = { ...t, ...T.situ.trail };
    }
    const plan = this.plan[k];
    if (!plan || !T.aiKeys?.length) return t;
    const key = (this.home.poss + this.away.poss) * 16 + this.q, c = this.tacCache[k]; // one call per side per trip
    if (c && c.key === key) return c.t;
    const O = this[other(k)], ob = () => { const b = { tpm: 0, tpa: 0, rm: 0, ra: 0 }; for (const id in O.box) { const l = O.box[id]; b.tpm += l.tpm; b.tpa += l.tpa; b.rm += l.rm; b.ra += l.ra; } return b; };
    const m = this.mem[k], before = m.note;
    const live: any = liveTactics(plan, { q: this.q, t: this.t, lead, oppOn: this.on[other(k)] || [], oppBox: ob, ftPct: p => this.ftPct(p) }, m, T.coach ?? 0.65);
    if (m.note && m.note !== before) this.notes[k].push(m.note + ' (' + (this.q <= 4 ? 'Q' + this.q : 'OT') + ')');
    const out: any = { ...t };
    for (const ak of T.aiKeys) out[ak] = live[ak];
    this.tacCache[k] = { key, t: out };
    return out;
  }
  private tacCache: Partial<Record<Side, { key: number; t: Tactics }>> = {};
  notes: Record<Side, string[]> = { home: [], away: [] };

  step() {
    if (this.done) return;
    this.rotate('home');
    this.rotate('away');
    const n = this.norms, offK = this.pos, defK = other(offK), O = this[offK], D = this[defK];
    const onO = this.on[offK], onD = this.on[defK], tO = this.tac(offK), tD = this.tac(defK);
    const C = (p: SimPlayer) => this.cache.get(p)!;
    const pbp = !!this.opts.pbp;
    const putback = this.afterOrb;
    this.afterOrb = false;

    // Clutch: last 5:00 of the 4th or OT within 6 points → the Four Factors tiebreaker.
    const clutch = this.q >= 4 && this.t < 300 && Math.abs(this.home.pts - this.away.pts) <= 6;
    const fo = this.teams[offK].ff, fd = this.teams[defK].ff;
    const cAdv = clutch && fo && fd ? cl((ffScore(fo) - ffScore(fd)) / 2, -2, 2) : 0;

    // Venue: away role players lose efficiency, ball security and defense; stars don't. Worth about 2.5
    // points a game to the home team, as in the NBA (home teams win about 55%).
    const awayOff = offK === 'away', awayDef = defK === 'away';
    const roadPen = (p: SimPlayer) => (awayOff && !p.villain && C(p).role && !C(p).star ? (p.crowd ? 0.026 : 0.013) * cl(1 - ((p.poise ?? POISE_MID) - POISE_MID) / 60, 0.3, 1.6) : 0); // poise steadies him on the road
    const roadDef = awayDef ? onD.filter(p => C(p).role && !C(p).star).length * 0.002 : 0;
    const condPen = (p: SimPlayer) => (p.adj ? 0.03 : 0) + (p.dtd ? 0.03 : 0) + (p.conf == null ? 0 : cl((50 - p.conf) * 0.0004, -0.012, 0.012));

    const handleO = avg(onO, p => p.r.drb * 0.45 + p.r.pss * 0.45 + (p.r.acc ?? p.r.drb) * 0.1), pressD = avg(onD, p => perimD(p.r));
    // Intangibles: Feel on the floor finds better shots and fewer turnovers (and reads passing lanes
    // on defense); Poise keeps a team steady against pressure.
    const feelO = avg(onO, p => p.feel ?? FEEL_MID), feelD = avg(onD, p => p.feel ?? FEEL_MID), poiseO = avg(onO, p => p.poise ?? POISE_MID);
    const connectors = onO.filter(p => p.roles?.includes('Connector')).length, poa = onD.filter(p => p.roles?.includes('Point-of-attack defender')).length;
    // Offensive IQ is decision-making (the read, the cut, when to pass, when to shoot); Defensive IQ is
    // positioning and rotations; quick hands (Steals) force turnovers. All relative to the league.
    const oiqO = avg(onO, p => p.r.oiq) - (n.oiq ?? 52), diqD = avg(onD, p => p.r.diq) - (n.diq ?? 52), handsD = avg(onD, p => stealSkill(p.r)) - (n.stl ?? 52);
    const gamB = onD.reduce((a, p) => a + gambleB(p.r), 0) - 5 * (n.gamB ?? 2), gamS = onD.reduce((a, p) => a + gambleS(p.r), 0) - 5 * (n.gamS ?? 2);
    const star = onO.reduce((a, b) => (C(b).use > C(a).use ? b : a));
    // Usage decides who ends the trip (the gatekeeper); ball-handling decides turnovers.
    // Selfish players take far more shots (big numbers), stop the ball for everyone else and
    // don't get back on defense: good stats, a worse team.
    // Tactics (only teams you manage run any; AI teams play Balanced and skip this).
    const fx: TacFx | null = this.teams[offK].tactics || this.teams[defK].tactics ? tacticEffects(tO, tD, onO, onD, p => C(p).use) : null;
    const fb = this.fastBreak; this.fastBreak = false;
    const cl2 = clutch ? this.clutchPick(onO, tO, offK) : null;
    const useBase = (p: SimPlayer) => (fx && fx.useExp !== 1 ? Math.pow(C(p).use, fx.useExp) : C(p).use) * (fx?.use.get(p) ?? 1) * (p.selfish ? 1.3 : p.padder ? 1.1 : 1) * (p.dtd ? 0.9 : 1) * (clutch && tO.clutch === 'Isolate the star' && p === star ? 2.5 : 1) * (cl2 && cl2.includes(p) ? 2.2 : 1);
    // Usage ceiling, from NBA history: Luka Dončić's heaviest season used 38% of his team's trips
    // while he was on the floor; the record is Russell Westbrook's 41.7% (2016–17). A star is held
    // to Luka's 38% on a normal roster; only when his teammates are far worse than him (a 75 among
    // 20s) can he climb, to a hard 58% (a 75 among 20s scores about 38), so nobody averages 50. Clutch plays can break the rule.
    // Moods: a heat-check player who's hit two straight wants the ball and pulls up from deep; a
    // volatile one who's missed three straight (or just missed with his team down 18+) forces bad shots.
    const trail = O.pts - D.pts <= -18, mood = (p: SimPlayer) => { const k = this.streak.get(p.id) || 0; return clutch ? '' : p.heat && k >= 2 ? 'heat' : p.volatile && (k <= -3 || (trail && k < 0)) ? 'tilt' : ''; };
    const useMood = (p: SimPlayer) => { const m = mood(p); return (m === 'heat' ? 1.45 : m === 'tilt' ? 1.3 : 1) * (awayOff && p.villain ? 1.08 : 1) * (clutch && p.fearless ? 1.6 : 1); };
    const uw = onO.map(p => useBase(p) * useMood(p)), ut = uw.reduce((a, b) => a + b, 0), ui = uw.indexOf(Math.max(...uw));
    const gapO = onO[ui].ovr - onO.filter((_, i) => i !== ui).reduce((a, p) => a + p.ovr, 0) / Math.max(1, onO.length - 1), USG_CAP = 0.33 + 0.17 * cl((gapO - 28) / 27, 0, 1);
    // A star far better than everyone around him has to take over: his share grows with the gap (up to the ceiling).
    const takeover = 1 + Math.max(0, gapO - 25) / 20; uw[ui] *= takeover; const ut2 = uw.reduce((a, b) => a + b, 0);
    const uF = !clutch && uw[ui] / ut2 > USG_CAP ? takeover * (USG_CAP / (1 - USG_CAP)) * (ut2 - uw[ui]) / uw[ui] : takeover;
    const use = (p: SimPlayer) => useBase(p) * useMood(p) * (p === onO[ui] ? uF : 1);
    const pTov = (1 + 0.02 * onO.filter(p => p.flashy).length) * (1 + 0.3 * (avg(onO, p => this.tired(p)) - TIRED0)) * RATE.tov * (n.tovM ?? 1) * Math.exp(-(handleO - n.handle) / TOV_K.handle + (pressD - n.perimD) / TOV_K.press - (feelO - FEEL_MID) / TOV_K.feelO + (feelD - FEEL_MID) / TOV_K.feelD) * (1 - 0.015 * connectors) * (1 + 0.025 * poa) * (1 - 0.08 * cAdv) * Math.exp(-oiqO / TOV_K.oiq + handsD / TOV_K.hands) + (fx ? fx.tov * (fx.tov > 0 ? cl(1 - (poiseO - POISE_MID) / 100, 0.5, 1.5) : 1) : 0) - (fb ? 0.03 : 0);
    const pTrip = RATE.foulTrip * (1 + 0.1 * cAdv) * (fx ? fx.trip : 1);
    const pNsf = putback ? 0 : RATE.nonShoot * (fx ? fx.nsf : 1);
    // Hack-a-Shaq: in the penalty, foul their worst free-throw shooter away from the ball (not in
    // the last two minutes of a quarter, when that earns a free throw and the ball).
    const hackT = tD.foul === 'Hack-a-Shaq' && !putback && this[defK].fouls > 4 && this.t > 120 ? onO.reduce((a: SimPlayer | null, p) => (this.ftPct(p) < 0.62 && (!a || this.ftPct(p) < this.ftPct(a)) ? p : a), null) : null;
    // Who coughs it up: whoever has the ball, so usage first. Creators handle it most and throw the
    // riskiest passes (star playmakers lead the NBA in turnovers: about 4 a game); a good handle
    // only trims that a little.
    const handler = wpick(onO, p => Math.pow(use(p), 1.7) * (0.5 + p.r.pss / 100) * (1.25 - p.r.drb / 220) * (1.35 - p.r.oiq / 150) * (p.tend?.tov ?? 1) * (p.flashy ? 1.3 : 1));
    const r = Math.random();
    const kind0 = hackT && Math.random() < 0.5 ? 'hack' : r < pNsf ? 'nsf' : r < pNsf + pTov + roadPen(handler) + (handler.adj ? 0.015 : 0) ? 'tov' : r < pNsf + pTov + pTrip ? 'trip' : 'fga';
    // Defensive three seconds: bigs who don't read the play camp in the lane (about 0.4 a game).
    const p3 = putback ? 0 : 0.0011 * onD.reduce((a, p) => a + (p.grp === 'B' ? Math.exp((52 - p.r.diq) / 12) : 0), 0);
    const kind1 = kind0 === 'fga' && Math.random() < p3 ? 'd3' : kind0;
    // The end of a close game (the 4th or overtime): the score and the clock decide what each side does.
    const eg = this.endgame(O, D, onO, onD, offK, defK, putback);
    const kind = eg.foul ? 'ifoul' : eg.last ? (eg.hold ? 'hold' : 'fga') : eg.hold && kind1 !== 'tov' ? 'hold' : kind1;

    // Clock: a whistle, a quick putback, or a normal trip at the offense's pace.
    const paceF = (fx ? fx.dt : 1) * Math.pow(this.teams[offK].tempo ?? 1, 0.7) * Math.pow(this.teams[defK].tempo ?? 1, 0.3);
    const t0 = this.t, dt = Math.min(this.t, eg.dt != null && kind !== 'nsf' && kind !== 'd3' ? eg.dt : (kind === 'nsf' || kind === 'd3') && this.q >= 4 && this.t <= 24 ? 0.4 + Math.random() * 1.6 : kind === 'nsf' || kind === 'hack' || kind === 'd3' ? 2 + Math.random() * 4 : putback ? 3 + Math.random() * 6 : fb ? 3 + Math.random() * 5 : (7 + Math.random() * 12.6) * paceF * RATE.dt);
    onO.forEach(p => (O.box[p.id].min += dt / 60));
    onD.forEach(p => (D.box[p.id].min += dt / 60));
    this.drain(dt);
    this.t -= dt;
    const qi = Math.min(this.q, 5) - 1;
    const addQ = (S: SideState, x: number) => { while (S.qs.length <= qi) S.qs.push(0); S.qs[qi] += x; };
    const time = pbp ? qName(this.q) + ' ' + fmtClock(this.t) : '';
    const ev: Ev = (ids, text, sub, scoring) => {
      if (pbp) this.pbp.unshift({ side: offK, time, text: text(), sub: sub ? sub() : '', score: scoring ? this.away.pts + '–' + this.home.pts : '', ids });
    };
    const score = (p: SimPlayer, x: number) => { O.pts += x; addQ(O, x); O.box[p.id].pts += x; onO.forEach(y => (O.box[y.id].pm += x)); onD.forEach(y => (D.box[y.id].pm -= x)); };
    const foul = () => { const f = wpick(onD, p => 110 - p.r.diq); D.box[f.id].pf++; D.fouls++; return f; };

    let keep = false;
    if (kind === 'ifoul' && eg.foul) {
      // A foul on purpose: the trailing team stops the clock, or the team up 3 fouls before a three can go up.
      const f = foul(), tg = eg.foul;
      if (D.fouls > 4) keep = this.freeThrows(O, D, onO, onD, tg, 2, score, ev, f, eg.up3 ? 'up3' : 'int', cAdv);
      else { ev([f.id, tg.id], () => f.name + ' fouls ' + tg.name + (eg.up3 ? ' before he can shoot (up 3)' : ' on purpose'), () => 'A foul to give: side out'); keep = true; }
    } else if (kind === 'hold') {
      // Ahead with the shot clock off: dribble out the clock.
      const h = onO.reduce((a, p) => (p.r.drb + p.r.pss > a.r.drb + a.r.pss ? p : a));
      ev([h.id], () => (eg.last ? 'Time runs out' : this.t <= 0 ? h.name + ' dribbles out the clock' : 'No foul: ' + h.name + ' runs the clock'));
    } else if (kind === 'hack' && hackT) {
      const f = foul();
      keep = this.freeThrows(O, D, onO, onD, hackT, 2, score, ev, f, 'hack', cAdv);
    } else if (kind === 'd3') {
      const v = onD.filter(p => p.grp === 'B').reduce((a: SimPlayer | null, p) => (!a || p.r.diq < a.r.diq ? p : a), null) || onD[0];
      keep = this.freeThrows(O, D, onO, onD, onO.reduce((a, p) => (p.r.ft > a.r.ft ? p : a)), 1, score, ev, v, 'tech', cAdv);
    } else if (kind === 'nsf') {
      // Non-shooting foul: a side-out, or two free throws once the defense is in the bonus.
      const f = foul();
      if (D.fouls > 4) keep = this.freeThrows(O, D, onO, onD, wpick(onO, p => use(p)), 2, score, ev, f, 'bonus', cAdv);
      else { ev([f.id], () => 'Foul on ' + f.name, () => 'Side out'); keep = true; }
    } else if (kind === 'tov') {
      O.box[handler.id].tov++;
      const x = Math.random();
      const stealShare = cl(RATE.stealShare * Math.exp(handsD / 160), 0.35, 0.8);
      if (x < stealShare) {
        const s2 = wpick(onD, p => Math.pow(Math.max(STEAL_FLOOR, stealSkill(p.r) + ((p.feel ?? FEEL_MID) - FEEL_MID) * 0.4), 1.2) * (p.roles?.includes('Point-of-attack defender') ? 1.5 : 1));
        D.box[s2.id].stl++;
        ev([s2.id, handler.id], () => s2.name + ' steals the ball from ' + handler.name, () => '(' + D.box[s2.id].stl + ' STL)');
      } else if (x < stealShare + RATE.offFoul) {
        O.box[handler.id].pf++;
        ev([handler.id], () => 'Offensive foul on ' + handler.name, () => '(' + O.box[handler.id].tov + ' TOV)');
      } else ev([handler.id], () => handler.name + (Math.random() < 0.5 ? ' loses the ball out of bounds' : ' throws it away'), () => '(' + O.box[handler.id].tov + ' TOV)');
    } else if (kind === 'trip') {
      // Fouled on a missed shot: two free throws (three on a three).
      const sh = wpick(onO, p => use(p) * (p.r.ins + (p.r.dnk + (p.r.lay ?? p.r.dnk)) / 2 + p.r.stre / 2 + (p.r.acc ?? 50) / 4) * (p.roles?.includes('Slasher') ? 1.2 : 1) * (p.tend?.draw ?? 1));
      keep = this.freeThrows(O, D, onO, onD, sh, Math.random() < 0.08 ? 3 : 2, score, ev, foul(), 'shot', cAdv);
    } else {
      // Field goal attempt: usage picks the shooter, his profile picks the tier.
      const sh = wpick(onO, p => use(p) * (eg.need3 ? Math.exp((p.r.tp - 50) / 14) : 1)); // needing a three, it goes to a shooter
      const prof0 = this.profile(sh, tO, fx, fb), md = mood(sh);
      // A heat check is a deep pull-up; a frustrated shot is a contested jumper, rarely a drive.
      const prof = md === 'heat' ? { ...prof0, atb: prof0.atb * 2, c3: prof0.c3 * 0.6 } : md === 'tilt' ? { ...prof0, mid: prof0.mid * 1.5, atb: prof0.atb * 1.4, rim: prof0.rim * 0.6 } : prof0;
      // A high-usage player can't live on spot-up threes: the defense keys on him and his shots come off
      // the dribble, at the rim and from mid-range too. The more of the offense he carries, the more a
      // three-heavy mix (over 48% threes) bends back: 20+ shots a night at 75% threes becomes about 55%.
      const shS = use(sh) / onO.reduce((a, p) => a + use(p), 0), s3 = prof.c3 + prof.atb, sAll = s3 + prof.rim + prof.mid, f3 = sAll > 0 ? s3 / sAll : 0, hi3 = cl((shS - 0.17) / 0.15, 0, 1);
      const n3 = f3 > 0.48 && hi3 > 0 ? f3 - (f3 - 0.48) * 0.8 * hi3 : f3, k3 = f3 > 0 ? n3 / f3 : 1, kO = f3 < 1 ? (1 - n3) / (1 - f3) : 1;
      // Late: needing a three he shoots one, unless he loses track of the score (a low Offensive IQ); needing two he attacks.
      const egZ = eg.need3 ? (Math.random() < this.brainfart(sh.r.oiq) * 1.5 ? 'two' : 'three') : eg.go2 ? 'two' : null;
      const zw = Object.fromEntries(ZONES.map(k => [k, prof[k] * (k === 'c3' || k === 'atb' ? k3 * (egZ === 'two' ? 0.08 : 1) : kO * (egZ === 'three' ? 0 : 1))])) as Record<Zone, number>;
      // A guard or wing can't live at the rim: the defense walls off the paint and gives him the jumper instead.
      // Past 58% of his shots at the rim, the rest go to his other shots (bigs, who score off rolls, lobs and
      // putbacks, are exempt).
      if (sh.grp !== 'B' && !putback && egZ !== 'three') { const tot = ZONES.reduce((a, k) => a + zw[k], 0), rs = tot > 0 ? zw.rim / tot : 0; if (rs > RIM_CAP) { const kr = RIM_CAP / rs, ko = (1 - RIM_CAP) / (1 - rs); ZONES.forEach(k => (zw[k] *= k === 'rim' ? kr : ko)); } }
      const z = wpick(ZONES, k => zw[k]);
      // A shot at the buzzer is rushed: a catch and heave with a second or less, a hurried one with two.
      const rush = this.q >= 4 ? (eg.last ? 0.25 : putback ? 0 : t0 <= 1.2 ? 0.12 : t0 <= 2.5 ? 0.05 : 0) : 0;
      const paint = z === 'mid' && Math.random() < (sh.tend?.pf ?? PAINT_SHARE), cs = C(sh).skill; // a mid-tier shot in the paint (non-RA) or from mid-range
      const sk = cs[z] + (paint ? 0.5 * ((cs.rim - n.skill.rim) - (cs.mid - n.skill.mid)) : 0), subD = z !== 'mid' ? 0 : paint ? PAINT_D : -PAINT_D * PAINT_SHARE / (1 - PAINT_SHARE);
      // A jump shot (mid-range or a three): how he creates it. A heat check comes off the dribble.
      const jz: JumpZone | null = z === 'rim' || paint ? null : (z as JumpZone), cm = jz ? n.cre?.[jz] ?? DEFAULT_CRE[jz] : null;
      const cre: Cre | null = jz ? (() => { const m = creMix(sh.tend?.cre, jz); return wpick(CRES, k => m[k] * (md === 'heat' && k === 'cns' ? 0.2 : 1)); })() : null;
      const creD = cre && cm ? creAdj(sh.r, cre) - cm.pct : 0;
      const lab = () => (paint ? (sh.grp === 'B' ? 'a hook shot' : 'a floater') : cre && cre !== 'cns' ? CRE_LABEL[cre] + (z === 'mid' ? (cre === 'fade' ? '' : ' jumper') : z === 'c3' ? ' corner three' : ' three') : LABEL[z](sh));
      const bigs = onD.slice().sort((a, b) => b.r.hgt - a.r.hgt).slice(0, 2);
      const intD = avg(bigs, p => interiorD(p.r));
      const rimPro = onD.some(p => p.roles?.includes('Rim protector'));
      // Rotations (the whole lineup's Defensive IQ) make every shot harder; gamblers leave easier ones.
      const small = z === 'rim' ? cl(1 + (55 - sh.r.hgt) / 100, 0.75, 1.3) : 1; // good rim protection bothers a small finisher more than a big one, who shoots over it
      const defAdj = (z === 'rim' ? small * (0.0021 * (intD - n.interiorD) + (rimPro ? 0.007 : 0)) - 0.0005 * gamB : z === 'mid' ? 0.001 * (pressD - n.perimD) - 0.0003 * gamS : 0.0008 * (pressD - n.perimD) - 0.0004 * gamS) + 0.0008 * diqD;
      // Tactics: the scheme's effect on this shot, the player's own adjustment (a box-and-one chaser,
      // an isolation star), and a cost for shots forced beyond his natural mix; a run-out is easier.
      const forced = fx ? Math.log(Math.max(0.2, prof[z] / C(sh).prof[z])) : 0;
      const tacD = fx ? fx.pct[z] + (fx.pctP.get(sh) ?? 0) - (forced > 0 ? forced * (0.07 + 0.0025 * Math.max(0, n.skill[z] - sk)) : 0.02 * forced) : 0; // a poor shooter forced into shots suffers most
      const fbD = fb && z === 'rim' ? 0.06 : 0;
      // Usage vs efficiency: the more of the offense runs through him, the more the defense keys on
      // him, so a heavy-usage star's shots get a little harder (the NBA's well-known trade-off).
      // A smart player keyed on by the defense makes the read and gets a better shot; an alpha (or a hot
      // hand) chucks it over the double team anyway.
      const shShare = use(sh) / onO.reduce((a, p) => a + use(p), 0), oiqSh = sh.r.oiq - (n.oiq ?? 52);
      const usgPen = shShare > 0.24 ? (shShare - 0.24) * 0.18 * (sh.alpha || md === 'heat' ? 1.1 : cl(1 - oiqSh / 60, 0.4, 1.5)) : 0;
      const readD = oiqSh >= 0 ? 0.0003 * oiqSh : 0.0005 * oiqSh; // shot selection: knowing which shots to take
      const moodD = md === 'heat' ? -0.02 : md === 'tilt' ? -0.04 : 0;
      const hotD = sh.hot ? sh.hot * (z === 'rim' ? 0.025 : 0.09) : 0; // a streaky shooter's hot or cold stretch
      const lineQ = onO.reduce((a, p) => a + C(p).q * C(p).use, 0) / Math.max(1e-6, onO.reduce((a, p) => a + C(p).use, 0)), leadD = -LEAD_K * cl(O.pts - D.pts, -30, 30);
      // At the rim, a guard or wing who can't shoot (his best of 3PT and mid-range under 55) finds the paint packed:
      // the defense sags off him (up to −6% at the worst); shooters around him open the lane a little (and vice versa).
      const pct = creD + hotD + readD + moodD + leadD + BASE.zone[z].pct + subD + CAL[z] + curve(CURVE_OF[z], sk) + n.offset[z] + (n.adj?.[z] ?? 0) - rush - 0.055 * (this.tired(sh) - TIRED0) * (z === 'rim' ? 0.8 : 1.15) + 0.025 * (avg(onD, p => this.tired(p)) - TIRED0) - LINEUP_REG * lineQ - defAdj + tacD + fbD - usgPen + 0.00012 * (feelO - FEEL_MID) - 0.0001 * (feelD - FEEL_MID) + (clutch ? 0.0005 * ((sh.fearless ? Math.max(80, sh.poise ?? POISE_MID) : sh.poise ?? POISE_MID) - POISE_MID) : 0) + (awayOff && sh.villain ? 0.02 : 0) + roadDef + 0.012 * cAdv + (clutch && sh.clutch ? 0.03 : 0) - roadPen(sh) - condPen(sh) + (z === 'rim' ? RIM_SIZE * (sh.r.hgt - (n.rimHgt ?? 55)) - (sh.grp !== 'B' && !putback ? 0.15 * cl((55 - Math.max(sh.r.tp, sh.r.fg)) / 100, 0, 0.4) : 0) + 0.0006 * (avg(onO.filter(p => p !== sh), p => p.r.tp) - 50) : 0) - (sh.protect && z !== 'rim' ? 0.02 : 0) - (onO.some(p => p.selfish && p !== sh) ? 0.015 : 0) + (onD.some(p => p.selfish) ? 0.012 : 0) + ((this.teams[offK].chem ?? 50) - 50) * 0.00015;
      const three = z === 'c3' || z === 'atb', b = O.box[sh.id], [mk, at] = TIER_KEY[z];
      b.fga++; b[at]++; if (three) b.tpa++; if (paint) b.ka++; if (cre) (b as any)[CRE_KEY[cre][1]]++;
      const T0 = O.tiers[z] || [0, 0]; O.tiers[z] = [T0[0], T0[1] + 1];
      if (Math.random() < cl(pct, 0.1, 0.9)) {
        b.fgm++; b[mk]++; if (three) b.tpm++; if (paint) b.km++; if (cre) (b as any)[CRE_KEY[cre][0]]++; this.streak.set(sh.id, Math.max(0, this.streak.get(sh.id) || 0) + 1);
        O.tiers[z] = [O.tiers[z][0] + 1, O.tiers[z][1]];
        score(sh, three ? 3 : 2);
        let passer: SimPlayer | null = null;
        const aRate = RATE.astF * BASE.zone[z].ast * Math.exp((avg(onO.filter(p => p !== sh), p => Math.max(p.r.pss, (p.r.pss + p.r.drb) / 2)) - n.pss) / 60) * (fx ? fx.ast : 1) * Math.exp((feelO - FEEL_MID) / 120) * Math.exp((avg(onO.filter(p => p !== sh), p => p.r.oiq) - (n.oiq ?? 52)) / 110) + 0.02 * connectors;
        const stopper = onO.some(p => p.selfish && p !== sh) ? 0.9 : 1, iso = sh.selfish ? 0.85 : 1; // a selfish player stops the ball: less sharing around him, and he makes his own shots off the dribble
        if (!putback && Math.random() < cl(aRate * (cre && cm ? CRE_AST[cre] / cm.ast : 1) * stopper * iso, 0.05, 0.97)) { // a self-creator's makes come off his own dribble
          passer = wpick(onO.filter(p => p.id !== sh.id), p => Math.pow(Math.max(PASS_FLOOR, p.r.pss * (1 + ((p.feel ?? FEEL_MID) - FEEL_MID) / 300 + (p.r.oiq - 50) / 400)), 2.4) * cl(0.45 + p.r.drb / 80, 0.75, 1.45) * (p.roles?.includes('Primary creator') ? 1.2 : 1) * (p.tend?.pass ?? 1) * (p.selfish ? 0.85 : 1) * (p.flashy ? 1.12 : 1)); // vision (Feel) and decision-making (Offensive IQ) sharpen his passing a little; the best passer gets about 40% of his team's assists while he's on the floor, like an NBA lead guard (Chris Paul's rookie AST% was 36.7)
          O.box[passer.id].ast++;
        }
        ev(passer ? [sh.id, passer.id] : [sh.id], () => sh.name + ' makes ' + lab() + ' (' + b.pts + ' PTS)', () => (passer ? 'Assisted by ' + passer.name + ' (' + O.box[passer.id].ast + ' AST)' : ''), true);
        if (Math.random() < RATE.andOne) keep = this.freeThrows(O, D, onO, onD, sh, 1, score, ev, foul(), 'and1', cAdv);
      } else {
        this.streak.set(sh.id, Math.min(0, this.streak.get(sh.id) || 0) - 1);
        const bs2 = onD.map(p => blockSkill(p.r)).sort((a, b) => b - a), blkT = (bs2[0] + (bs2[1] ?? bs2[0])) / 2;
        const blkP = 1.18 * BLOCK_ON_MISS[z] * Math.exp((blkT - (n.blk ?? 58)) / 22) * (rimPro ? 1.3 : 1) * (z === 'rim' ? Math.exp((55 - sh.r.hgt) / 150) : 1) * (cre && cm ? CRE_BLK[cre] / cm.blk : 1); // small finishers get blocked more; stepbacks and fadeaways rarely
        if (Math.random() < blkP) {
          const bl = wpick(onD, p => Math.pow(Math.max(BLOCK_FLOOR, blockSkill(p.r)), 3) * (p.roles?.includes('Rim protector') ? 1.6 : 1));
          D.box[bl.id].blk++;
          ev([bl.id, sh.id], () => bl.name + ' blocks ' + sh.name, () => '(' + D.box[bl.id].blk + ' BLK)');
        } else ev([sh.id], () => sh.name + ' misses ' + lab());
        keep = this.rebound(O, D, onO, onD, cAdv, ev, fx ? fx.orb : 0);
        if (!keep && tO.reb === 'Crash the glass' && Math.random() < 0.35) this.fastBreak = true;
      }
    }
    if (!keep) { this.pos = defK; this[defK].poss++; }
    if (this.t <= 0) {
      if (this.q >= 4 && this.home.pts !== this.away.pts) {
        this.done = true;
        if (pbp) this.pbp.unshift({ side: this.home.pts > this.away.pts ? 'home' : 'away', time: 'Final', text: 'Final: ' + this.teams.away.abbr + ' ' + this.away.pts + ', ' + this.teams.home.abbr + ' ' + this.home.pts, sub: '', score: '' });
      } else {
        if (pbp) this.pbp.unshift({ side: offK, time: qName(this.q) + ' 0:00', text: 'End of ' + (this.q <= 4 ? 'quarter ' + this.q : 'overtime'), sub: '', score: '' });
        this.q++;
        this.t = this.q > 4 ? 300 : 720;
        this.home.fouls = 0; this.away.fouls = 0;
        this.rest(this.q === 3 ? 18 : 6); // halftime, or a quarter break (before overtime too)
      }
    }
    if (this.pbp.length > 220) this.pbp.length = 220;
  }

  private profile(p: SimPlayer, _t: Tactics, fx: TacFx | null, fb = false) {
    const m: Partial<Record<Zone, number>> = { ...(fx ? fx.prof : {}) };
    if (fb) m.rim = (m.rim || 1) * 2.2; // a run-out ends at the rim
    if (p.protect) Object.assign(m, { c3: (m.c3 || 1) * 0.5, atb: (m.atb || 1) * 0.5 });
    if (!Object.keys(m).length) return this.cache.get(p)!.prof;
    // The same system tilts the same player the same way all night: cache each tilt (a big share of a game's time otherwise).
    const key = (m.rim ?? 1) + ',' + (m.mid ?? 1) + ',' + (m.c3 ?? 1) + ',' + (m.atb ?? 1);
    let pc = this.profCache.get(p); if (!pc) this.profCache.set(p, (pc = new Map()));
    let pr = pc.get(key); if (!pr) pc.set(key, (pr = shotProfile(p, this.norms, m)));
    return pr;
  }
  private profCache = new Map<SimPlayer, Map<string, Record<Zone, number>>>();
  // A perfect 99 is a different animal: 98% every season, José Calderón's record year (98.1% in
  // 2008–09) as his normal. Everyone else follows the curve (a 98 is about 92%).
  private ftPct(p: SimPlayer) { return p.r.ft >= FT_PERFECT ? 0.98 : BASE.ft + CAL.ft + curve('ft', p.r.ft) + this.norms.ftOffset; }
  // Clutch play options beyond isolating the star: the pick and roll pair, or tonight's hot hand.
  private clutchPick(onO: SimPlayer[], t: Tactics, k: Side): SimPlayer[] | null {
    if (t.clutch === 'Pick and roll') {
      const h = onO.reduce((a, p) => (p.r.drb + p.r.pss > a.r.drb + a.r.pss ? p : a)), rest = onO.filter(p => p !== h);
      return [h, rest.reduce((a, p) => (p.r.dnk + p.r.hgt > a.r.dnk + a.r.hgt ? p : a))];
    }
    if (t.clutch === 'Hot hand') { const B = this[k].box; return [onO.reduce((a, p) => (B[p.id].pts - B[p.id].fga * 0.5 > B[a.id].pts - B[a.id].fga * 0.5 ? p : a))]; }
    return null;
  }

  // A late-game mental mistake (losing track of the score, the clock or the foul count): rare for a sharp
  // player (under 1% at a 70), more common for a low-IQ one (about 3% at 50, 17% at 30).
  private brainfart(iq: number) { return cl(0.05 * Math.exp((45 - iq) / 12), 0.004, 0.25); }
  // The last 48 seconds of the 4th or overtime in a game within 12. From the offense's side (lead = its
  // margin) it returns what the two teams do on this trip:
  // - trailing on defense: foul on purpose to stop the clock, once the shot clock is off (24 seconds) in a
  //   one-possession game, or with time to catch up in a two- or three-possession one; the ball goes to a sure
  //   handler and good free throw shooter, so that's who gets fouled (foul);
  // - leading on offense and not fouled: dribble out the clock with the shot clock off (hold), or work the
  //   shot clock before that (dt);
  // - up 3 on defense with 7 seconds or less: sometimes foul before a three can go up (up3; better staffs
  //   more often), so the trailing team gets two free throws instead of a shot to tie;
  // - tied or down 1–2: hold for the last shot and mostly attack for two (go2); down 3: a quick three
  //   (need3); down more: hurry, mostly threes;
  // - after an offensive rebound with seconds left: a quick putback or kick-out.
  // Low-IQ teams and players botch some of it (brainfart): no foul, a quick shot when ahead, a two when down 3.
  private endgame(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], _offK: Side, defK: Side, putback: boolean) {
    const out: { foul?: SimPlayer; up3?: boolean; dt?: number; need3?: boolean; go2?: boolean; hold?: boolean; last?: boolean } = {};
    const t = this.t, lead = O.pts - D.pts;
    if (this.q < 4 || t > 48 || Math.abs(lead) > 12) return out;
    // Under a second: no time to run anything. Ahead, the clock runs out; behind or tied, a catch and heave.
    if (t < 1) { out.last = true; out.dt = t; out.hold = lead > 0; out.need3 = lead <= -3; return out; }
    const diqD = avg(onD, p => p.r.diq), oiqO = avg(onO, p => p.r.oiq), coachD = this.teams[defK].coach ?? 0.65;
    const target = () => wpick(onO, p => Math.max(10, p.r.drb + p.r.pss) * Math.exp((p.r.ft - 60) / 15));
    if (lead > 0) {
      if (putback) return out;
      const need = Math.ceil(lead / 3), want = lead <= 3 ? t <= 24 : t <= 12 + lead * 5 && need <= t / 7 + 1;
      if (want && Math.random() > this.brainfart(diqD)) { out.foul = target(); out.dt = 0.8 + Math.random() * 2.2; return out; }
      // (Not fouled: the defense lost track. With more than six seconds left it gets another chance to foul.)
      if (t <= 24) { if (Math.random() > this.brainfart(oiqO)) { out.hold = true; out.dt = t <= 6 ? t : 2 + Math.random() * 4; } return out; }
      if (Math.random() > this.brainfart(oiqO)) out.dt = 14 + Math.random() * 9;
      return out;
    }
    if (lead === -3 && !putback && t <= 7 && Math.random() < 0.15 + 0.35 * coachD) { out.foul = target(); out.up3 = true; out.dt = 0.6 + Math.random() * 1.2; return out; }
    const d = -lead;
    if (putback) { out.dt = Math.min(t, 0.6 + Math.random() * 1.6); out.need3 = d === 3 && t <= 10 && Math.random() < 0.7; return out; }
    if (d <= 2) { if (t <= 24) { out.dt = Math.max(1, t - (0.8 + Math.random() * 3.5)); out.go2 = d > 0 && Math.random() < 0.75; } }
    else if (d === 3) { if (t <= 24) out.dt = Math.min(t, 1.5 + Math.random() * 7); out.need3 = t <= 14 || Math.random() < 0.6; }
    else { out.dt = Math.min(t, 1.5 + Math.random() * 5); out.need3 = d <= 9 && Math.random() < (t <= 20 ? 0.75 : 0.5); }
    return out;
  }

  // Free throws. Returns true if the offense keeps the ball (offensive rebound off a live miss).
  private freeThrows(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], sh: SimPlayer, n: number, score: (p: SimPlayer, x: number) => void, ev: Ev, fouler: SimPlayer, kind: 'shot' | 'bonus' | 'and1' | 'hack' | 'tech' | 'int' | 'up3', cAdv: number) {
    const pct = cl(this.ftPct(sh) - (sh.adj ? 0.02 : 0) - 0.03 * (this.tired(sh) - TIRED0) + (this.q >= 4 && this.t < 300 ? 0.0006 * ((sh.poise ?? POISE_MID) - POISE_MID) : 0), 0.3, sh.r.ft >= FT_PERFECT ? 0.99 : 0.95);
    let made = 0, last = false, miss: '' | 'rim' | 'air' | 'in' | 'forgot' = '';
    for (let i = 0; i < n; i++) {
      // The last one with seconds left, when making it can't tie or win (down 2 or more): miss it on purpose off
      // the rim and fight for the rebound. It sometimes drops in anyway, or misses the rim (a violation); a
      // low-IQ shooter can forget and make it.
      if (i === n - 1 && kind !== 'tech' && this.q >= 4 && this.t <= 3.5 && this.t >= 0.6 && O.pts + made - D.pts <= -2) {
        if (Math.random() < this.brainfart(sh.r.oiq)) miss = 'forgot';
        else { O.box[sh.id].fta++; const x = Math.random(); miss = x < 0.05 ? 'in' : x < 0.12 ? 'air' : 'rim'; last = miss === 'in'; if (last) { made++; O.box[sh.id].ftm++; } continue; }
      }
      O.box[sh.id].fta++; last = Math.random() < pct; if (last) { made++; O.box[sh.id].ftm++; }
    }
    if (made) score(sh, made);
    if (kind === 'tech') { ev([sh.id, fouler.id], () => 'Defensive three seconds on ' + fouler.name, () => sh.name + (made ? ' makes' : ' misses') + ' the technical free throw', !!made); return true; }
    const how = kind === 'bonus' ? ' (bonus)' : kind === 'hack' ? ' on purpose (Hack-a-Shaq)' : kind === 'int' ? ' on purpose to stop the clock' : kind === 'up3' ? ' before he can shoot (up 3)' : ' on the shot';
    const after = miss === 'rim' ? ' and misses the last one on purpose' : miss === 'air' ? ', then misses the rim on purpose: a violation' : miss === 'in' ? ': he tried to miss the last one, but it dropped in' : miss === 'forgot' ? ' (he forgot to miss the last one on purpose)' : '';
    ev([sh.id, fouler.id], () => (kind === 'and1' ? 'And one: ' + fouler.name + ' fouls ' + sh.name : fouler.name + ' fouls ' + sh.name + how), () => sh.name + ' makes ' + made + ' of ' + n + ' free throw' + (n === 1 ? '' : 's') + after, made > 0);
    if (miss === 'air') return false;
    if (miss === 'rim') return this.rebound(O, D, onO, onD, cAdv, ev, -0.08); // a scramble the defense usually wins
    if (!last && Math.random() < RATE.liveFt) return this.rebound(O, D, onO, onD, cAdv, ev);
    return false;
  }

  private rebound(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], cAdv: number, ev: Ev, tacOrb = 0) {
    // Glass skill edge per point 0.004 → 0.0028 (2026-10-17): team ORB% spread was about 0.035 against the NBA's 0.025.
    const orbP = cl(BASE.orbPct + ORB_K * (avg(onO, p => glassSkill(p.r)) - avg(onD, p => glassSkill(p.r))) + 0.03 * (avg(onD, p => this.tired(p)) - avg(onO, p => this.tired(p))) + 0.015 * cAdv + tacOrb, 0.12, 0.45);
    const off = Math.random() < orbP;
    if (Math.random() < RATE.rebCredit) {
      const pool = off ? onO : onD, S = off ? O : D;
      const rb = wpick(pool, p => Math.pow(Math.max(REB_FLOOR, rebSkill(p.r)), 2) * (p.roles?.includes('Rebounder') ? 1.3 : 1) * (1 - Math.max(0, (p.r.box ?? 50) - 55) / 120) * (1 - 0.35 * this.tired(p)));
      if (off) S.box[rb.id].orb++; else S.box[rb.id].drb++;
      ev([rb.id], () => rb.name + ' grabs the ' + (off ? 'offensive' : 'defensive') + ' rebound', () => '(' + (S.box[rb.id].orb + S.box[rb.id].drb) + ' REB)');
    }
    if (off) this.afterOrb = true;
    return off;
  }

  run() { let guard = 0; while (!this.done && guard++ < 8000) this.step(); return this.result(); }

  result(): GameResult {
    const pack = (k: Side): SideResult => ({ tid: this.teams[k].tid, pts: this[k].pts, qs: this[k].qs.slice(), box: this[k].box, poss: this[k].poss });
    const cn = (k: Side) => [...(this.plan[k]?.notes || []), ...this.notes[k]];
    return { home: pack('home'), away: pack('away'), ot: Math.max(0, this.q - 4), ...(this.plan.home || this.plan.away ? { coach: { home: cn('home'), away: cn('away') } } : {}) };
  }
}

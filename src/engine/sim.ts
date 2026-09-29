// Possession-by-possession game engine. One engine plays every game: the Live Game
// screen steps it on a timer, quick sims run it to the end.
//
// Everything is anchored on the 2026 league baselines below (the 50th percentile).
// Player ratings only move a player away from those means (the "bell curve"), and the
// league normalization in norms.ts re-centres the curves every season, so rating drift
// never inflates league stats. These formulas are engine code, not save data: nothing in
// God Mode can edit them.

import { tacticEffects, type TacFx, type Tactics } from './tactics';
export type { Tactics } from './tactics';

export type Side = 'home' | 'away';
export type Zone = 'rim' | 'mid' | 'c3' | 'atb';
export const ZONES: Zone[] = ['rim', 'mid', 'c3', 'atb'];

// ── 2026 baselines (per team, per game) ─────────────────────────────────────────
export const BASE = {
  pace: 98.8, pts: 113.8,
  fg: 0.467, tp: 0.360, tpa: 37.6, ft: 0.78,
  trb: 44.1, orb: 11.1, drb: 33.0, ast: 26.5, stl: 8.2, blk: 4.9, tov: 14.3,
  ortg: 114.5, ts: 0.576, efg: 0.543, tovPct: 0.126, orbPct: 0.252, ftr: 0.189,
  dist: 14.5, rimPct: 0.696, c3Pct: 0.388,
  // The four shot-quality tiers the engine simulates: share of FGA, FG%, average
  // distance (ft) and assisted rate. Together they reproduce the league lines above
  // (46.7% FG, 42% of shots from three at 36.0%, corner threes 38.8%, rim 69.6%, 14.5 ft).
  zone: {
    rim: { share: 0.31, pct: 0.696, dist: 2.5, ast: 0.55 },
    mid: { share: 0.268, pct: 0.37, dist: 12.2, ast: 0.48 },
    c3: { share: 0.105, pct: 0.388, dist: 22.5, ast: 0.95 },
    atb: { share: 0.317, pct: 0.351, dist: 25.8, ast: 0.82 },
  } as Record<Zone, { share: number; pct: number; dist: number; ast: number }>,
};

// Per offensive trip at league average (≈113 trips a game: 89 FGA, 14 TOV, FT-only trips).
const RATE = { tov: 0.1155, stealShare: 0.573, offFoul: 0.1, foulTrip: 0.069, nonShoot: 0.07, andOne: 0.072, rebCredit: 0.89, liveFt: 0.9, astF: 1.12, dt: 1.04 };
// Small constant nudges (fatigue, venue and adjustment penalties sit below zero on average);
// found by simulating full seasons against the baselines.
const CAL: Record<Zone | 'ft', number> = { rim: 0.007, mid: 0.008, c3: 0.007, atb: 0.005, ft: 0.011 };
const BLOCK_ON_MISS: Record<Zone, number> = { rim: 0.36, mid: 0.053, c3: 0.008, atb: 0.008 };

// ── The bell curve: rating → deviation from the baseline percentage ─────────────
// Asymmetric on purpose: elite ratings add little (a 90 three-point shooter is ~40%),
// poor ratings cost a lot (a 40 is ~27%). The norms' offsets re-centre the league mean.
const CURVE: Record<string, { mid: number; up: number; down: number }> = {
  three: { mid: 65, up: 0.0016, down: 0.0036 },
  rim: { mid: 60, up: 0.0025, down: 0.004 },
  jumper: { mid: 55, up: 0.0022, down: 0.0035 },
  ft: { mid: 60, up: 0.0035, down: 0.006 },
};
// Above average, each extra point is worth a little less (an elite finisher makes ~75–80% at the rim,
// not 90%), so superstars' efficiency stays in the range of the NBA's best.
export const curve = (k: string, r: number) => { const c = CURVE[k], d = r - c.mid; return d >= 0 ? (d * c.up) / (1 + d / 40) : d * c.down; };
export const CURVE_OF: Record<Zone, string> = { rim: 'rim', mid: 'jumper', c3: 'three', atb: 'three' };

// A player's skill for each tier (0–99 scale).
export function zoneSkill(r: any): Record<Zone, number> {
  return { rim: 0.25 * r.dnk + 0.25 * (r.lay ?? r.dnk) + 0.3 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, mid: r.fg, c3: r.tp, atb: r.tp };
}
// Raw usage weight: how often he ends a possession while on the floor. USG% in the UI is
// this relative to the league mean (= 20%). This is the usage-rate gatekeeper: volume
// comes from usage and minutes, efficiency from shooting ratings, so a pure shooter with
// low usage can't put up star numbers (points ≈ possessions × USG% × TS%).
export function usageRaw(p: { ovr: number; r: any; alpha?: boolean; touches?: boolean; roles?: string[] }) {
  let u = Math.exp(0.022 * (p.ovr - 50) + 0.004 * (p.r.oiq - 50) + 0.003 * (p.r.drb - 50));
  if (p.alpha) u *= 1.05;
  if (p.touches) u *= 1.06;
  if (p.roles?.includes('Primary creator')) u *= 1.05;
  return u;
}
export const mental = (r: any) => (r.oiq + r.diq) / 2;
// `ape` is wingspan minus height in inches (the league averages about +4): long arms help
// contests, blocks, rebounds and steals; short arms hurt them.
const ape = (r: any) => (r.ape ?? 4) - 4;
export const perimD = (r: any) => r.diq * 0.6 + r.spd * 0.2 + (r.acc ?? r.spd) * 0.2 + ape(r) * 0.6;
export const interiorD = (r: any) => r.hgt * 0.5 + r.diq * 0.3 + r.jmp * 0.2 + ape(r) * 1.2;
export const rebSkill = (r: any) => r.reb * 0.6 + r.hgt * 0.25 + r.jmp * 0.15 + ape(r) * 0.7;
// Team rebounding also counts box-outs: a great boxer wins the glass for his team without
// grabbing many rebounds himself.
export const glassSkill = (r: any) => rebSkill(r) * 0.75 + (r.box ?? r.reb) * 0.25;

export interface Norms {
  season: number;
  usage: number; // minutes-weighted mean raw usage
  skill: Record<Zone, number>; // volume-weighted mean tier skill
  offset: Record<Zone, number>; // re-centres each tier's curve on its baseline
  shareCorr: Record<Zone, number>; // keeps the league shot mix on the baseline shares
  ftOffset: number;
  perimD: number; interiorD: number; reb: number; pss: number; handle: number;
}
export const DEFAULT_NORMS: Norms = { season: 0, usage: 1, skill: { rim: 58, mid: 55, c3: 55, atb: 55 }, offset: { rim: 0, mid: 0, c3: 0, atb: 0 }, shareCorr: { rim: 1, mid: 1, c3: 1, atb: 1 }, ftOffset: 0, perimD: 55, interiorD: 58, reb: 58, pss: 55, handle: 55 };

// Shot profile: the league tier shares tilted by the player's relative skill, roles and tactics.
// Shot tendencies: real players' shot diets aren't only their skills (rookie Luka Dončić took 43% of
// his shots from three while making 33%). Multipliers on each zone's share and on drawing shooting
// fouls, and how loose he is with the ball (risky passes); 1 (or missing) = what his skills and
// roles suggest. Set per player in God Mode.
export interface Tend { rim?: number; mid?: number; c3?: number; atb?: number; draw?: number; tov?: number; ast?: number }
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
  const sk = zoneSkill(p.r), roles = p.roles || [], auto = autoTend(p);
  const w = {} as Record<Zone, number>;
  let tot = 0;
  for (const z of ZONES) {
    let x = BASE.zone[z].share * n.shareCorr[z] * Math.exp(0.04 * (sk[z] - n.skill[z]));
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
  adj?: boolean; dtd?: boolean; fat?: number; protect?: boolean; flag?: string;
  conf?: number; // hidden confidence 0–100 (50 neutral): a small shooting nudge either way
  roles?: string[];
  feel?: number; poise?: number; // intangibles (intangibles.ts): vision and anticipation; composure
  flashy?: boolean; heat?: boolean; volatile?: boolean; villain?: boolean; fearless?: boolean; // villain: hostile road crowds fire him up; fearless: wants the ball when it matters, pressure doesn't touch him
  // playing style: showtime passes; heat checks when hot; forced shots when frustrated
  tend?: Tend; // shot tendencies: how often he takes each shot and draws fouls (1 = what his skills suggest)
  target: number; // minutes per 48 the coach wants him to play
}
export interface FourFactors { efg: number; tov: number; orb: number; ftr: number }
export interface SimTeam {
  tid: number; name: string; abbr: string; rec: string; players: SimPlayer[];
  tactics?: Tactics | null; situ?: { lead?: Tactics | null; trail?: Tactics | null } | null;
  ff?: FourFactors; // season Four Factors (regressed early on) for the clutch tiebreaker
  chem?: number; // locker room 0–100: a good room shoots a little better, a toxic one worse
}
export interface SimOpts { pbp?: boolean; norms?: Norms }

export interface BoxLine {
  min: number; fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number; orb: number; drb: number;
  ast: number; tov: number; stl: number; blk: number; pf: number; pts: number; pm: number; gs: number;
  rm: number; ra: number; mm: number; ma: number; cm: number; ca: number; bm: number; ba: number; // made/att: rim, mid, corner 3, above-the-break 3
}
export interface SideState { pts: number; qs: number[]; box: Record<number, BoxLine>; tiers: Record<string, [number, number]>; poss: number; fouls: number }
export interface SideResult { tid: number; pts: number; qs: number[]; box: Record<number, BoxLine>; poss: number }
export interface GameResult { home: SideResult; away: SideResult; ot: number }
export interface PbpEvent { side: Side; time: string; text: string; sub: string; score: string; ids?: number[] }

export const TIER_KEY: Record<Zone, ['rm' | 'mm' | 'cm' | 'bm', 'ra' | 'ma' | 'ca' | 'ba']> = { rim: ['rm', 'ra'], mid: ['mm', 'ma'], c3: ['cm', 'ca'], atb: ['bm', 'ba'] };
export const blankLine = (): BoxLine => ({ min: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, pm: 0, gs: 0, rm: 0, ra: 0, mm: 0, ma: 0, cm: 0, ca: 0, bm: 0, ba: 0 });
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
const SUB_MARGIN = 285; // seconds ahead of his minutes target before a bench player comes in

interface PlayerCache { use: number; prof: Record<Zone, number>; skill: Record<Zone, number>; role: boolean; star: boolean }
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
  private fastBreak = false; // the defense crashed the glass and lost the rebound: this trip is a run-out

  constructor(home: SimTeam, away: SimTeam, public opts: SimOpts = {}) {
    this.teams = { home, away };
    this.norms = opts.norms || DEFAULT_NORMS;
    const side = (t: SimTeam): SideState => ({ pts: 0, qs: [0, 0, 0, 0], box: Object.fromEntries(t.players.map(p => [p.id, blankLine()])), tiers: {}, poss: 0, fouls: 0 });
    this.home = side(home);
    this.away = side(away);
    (['home', 'away'] as Side[]).forEach(k => {
      this.teams[k].players.forEach(p => {
        const use = usageRaw(p), rel = use / this.norms.usage;
        this.cache.set(p, { use, prof: shotProfile(p, this.norms), skill: zoneSkill(p.r), role: rel < 0.9 && mental(p.r) < 62, star: rel >= 1.25 || mental(p.r) >= 65 });
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
    if (late && diff > 20) {
      const deep = ps.slice(5).sort((a, b) => a.target - b.target);
      this.on[k] = (deep.length >= 5 ? deep : [...deep, ...ps.slice(0, 5)]).slice(0, 5);
      return;
    }
    if (late && diff <= 8) { this.on[k] = this.shape(k, ps.slice().sort((a, b) => b.target - a.target).slice(0, 5), ps); return; }
    if (this.q === 3 && this.t === 720) { this.on[k] = this.shape(k, ps.slice(0, 5), ps); return; }
    const el = this.elapsed();
    const trouble = (p: SimPlayer) => this.q <= 4 && S.box[p.id].pf >= this.q + 2 && !(this.q === 4 && this.t < 360);
    const deficit = (p: SimPlayer) => (p.target * 60 * el) / 2880 - S.box[p.id].min * 60 - (trouble(p) ? 900 : 0);
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
    this.on[k] = this.shape(k, on, ps);
  }

  // Lineup style: small ball keeps at most one big on the floor, twin towers two when available.
  // Swaps use the minute targets (the big who'd play least goes out, the wing who'd play most comes in).
  private shape(k: Side, on: SimPlayer[], ps: SimPlayer[]) {
    const lu = this.teams[k].tactics ? this.tac(k).lineup : null;
    if (lu !== 'Small ball' && lu !== 'Twin towers') return on;
    const big = (p: SimPlayer) => p.grp === 'B';
    for (let guard = 0; guard < 3; guard++) {
      const nb = on.filter(big).length, bench = ps.filter(p => !on.includes(p));
      if (lu === 'Small ball' && nb > 1) {
        const inP = bench.filter(p => !big(p)).sort((a, b) => b.target - a.target)[0]; if (!inP) break;
        const outP = on.filter(big).sort((a, b) => a.target - b.target)[0]; on = on.map(p => (p === outP ? inP : p));
      } else if (lu === 'Twin towers' && nb < 2) {
        const inP = bench.filter(big).sort((a, b) => b.target - a.target)[0]; if (!inP) break;
        const outP = on.filter(p => !big(p)).sort((a, b) => a.target - b.target)[0]; if (!outP) break; on = on.map(p => (p === outP ? inP : p));
      } else break;
    }
    return on;
  }

  // Tactics in force for a side right now (situational presets take over late in games).
  tac(k: Side): Tactics {
    const T = this.teams[k], base = T.tactics || {};
    if (T.situ && this.q >= 4 && this.t < 300) {
      const lead = this[k].pts - this[other(k)].pts;
      if (lead >= 6 && T.situ.lead) return { ...base, ...T.situ.lead };
      if (lead <= -6 && T.situ.trail) return { ...base, ...T.situ.trail };
    }
    return base;
  }

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

    // Venue: away role players lose efficiency, ball security and defense; stars don't.
    const awayOff = offK === 'away', awayDef = defK === 'away';
    const roadPen = (p: SimPlayer) => (awayOff && !p.villain && C(p).role && !C(p).star ? (p.crowd ? 0.05 : 0.025) * cl(1 - ((p.poise ?? POISE_MID) - POISE_MID) / 60, 0.3, 1.6) : 0); // poise steadies him on the road
    const roadDef = awayDef ? onD.filter(p => C(p).role && !C(p).star).length * 0.004 : 0;
    const condPen = (p: SimPlayer) => (p.adj ? 0.03 : 0) + (p.dtd ? 0.03 : 0) + Math.min(0.04, Math.max(0, (p.fat || 0) - 25) * 0.001) + (p.conf == null ? 0 : cl((50 - p.conf) * 0.0004, -0.012, 0.012));

    const handleO = avg(onO, p => p.r.drb * 0.45 + p.r.pss * 0.45 + (p.r.acc ?? p.r.drb) * 0.1), pressD = avg(onD, p => perimD(p.r));
    // Intangibles: Feel on the floor finds better shots and fewer turnovers (and reads passing lanes
    // on defense); Poise keeps a team steady against pressure.
    const feelO = avg(onO, p => p.feel ?? FEEL_MID), feelD = avg(onD, p => p.feel ?? FEEL_MID), poiseO = avg(onO, p => p.poise ?? POISE_MID);
    const connectors = onO.filter(p => p.roles?.includes('Connector')).length, poa = onD.filter(p => p.roles?.includes('Point-of-attack defender')).length;
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
    const gapO = onO[ui].ovr - onO.filter((_, i) => i !== ui).reduce((a, p) => a + p.ovr, 0) / Math.max(1, onO.length - 1), USG_CAP = 0.38 + 0.2 * cl((gapO - 28) / 27, 0, 1);
    // A star far better than everyone around him has to take over: his share grows with the gap (up to the ceiling).
    const takeover = 1 + Math.max(0, gapO - 25) / 20; uw[ui] *= takeover; const ut2 = uw.reduce((a, b) => a + b, 0);
    const uF = !clutch && uw[ui] / ut2 > USG_CAP ? takeover * (USG_CAP / (1 - USG_CAP)) * (ut2 - uw[ui]) / uw[ui] : takeover;
    const use = (p: SimPlayer) => useBase(p) * useMood(p) * (p === onO[ui] ? uF : 1);
    const pTov = (1 + 0.02 * onO.filter(p => p.flashy).length) * RATE.tov * Math.exp(-(handleO - n.handle) / 45 + (pressD - n.perimD) / 60 - (feelO - FEEL_MID) / 90 + (feelD - FEEL_MID) / 150) * (1 - 0.04 * connectors) * (1 + 0.035 * poa) * (1 - 0.08 * cAdv) + (fx ? fx.tov * (fx.tov > 0 ? cl(1 - (poiseO - POISE_MID) / 100, 0.5, 1.5) : 1) : 0) - (fb ? 0.03 : 0);
    const pTrip = RATE.foulTrip * (1 + 0.1 * cAdv) * (fx ? fx.trip : 1);
    const pNsf = putback ? 0 : RATE.nonShoot * (fx ? fx.nsf : 1);
    // Hack-a-Shaq: in the penalty, foul their worst free-throw shooter away from the ball (not in
    // the last two minutes of a quarter, when that earns a free throw and the ball).
    const hackT = tD.foul === 'Hack-a-Shaq' && !putback && this[defK].fouls > 4 && this.t > 120 ? onO.reduce((a: SimPlayer | null, p) => (this.ftPct(p) < 0.62 && (!a || this.ftPct(p) < this.ftPct(a)) ? p : a), null) : null;
    // Who coughs it up: whoever has the ball, so usage first. Creators handle it most and throw the
    // riskiest passes (star playmakers lead the NBA in turnovers: about 4 a game); a good handle
    // only trims that a little.
    const handler = wpick(onO, p => Math.pow(use(p), 1.3) * (0.5 + p.r.pss / 100) * (1.25 - p.r.drb / 220) * (p.tend?.tov ?? 1) * (p.flashy ? 1.3 : 1));
    const r = Math.random();
    const kind = hackT && Math.random() < 0.5 ? 'hack' : r < pNsf ? 'nsf' : r < pNsf + pTov + roadPen(handler) + (handler.adj ? 0.015 : 0) ? 'tov' : r < pNsf + pTov + pTrip ? 'trip' : 'fga';

    // Clock: a whistle, a quick putback, or a normal trip at the offense's pace.
    const paceF = fx ? fx.dt : 1;
    const dt = Math.min(this.t, kind === 'nsf' || kind === 'hack' ? 2 + Math.random() * 4 : putback ? 3 + Math.random() * 6 : fb ? 3 + Math.random() * 5 : (7 + Math.random() * 12.6) * paceF * RATE.dt);
    onO.forEach(p => (O.box[p.id].min += dt / 60));
    onD.forEach(p => (D.box[p.id].min += dt / 60));
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
    if (kind === 'hack' && hackT) {
      const f = foul();
      keep = this.freeThrows(O, D, onO, onD, hackT, 2, score, ev, f, 'hack', cAdv);
    } else if (kind === 'nsf') {
      // Non-shooting foul: a side-out, or two free throws once the defense is in the bonus.
      const f = foul();
      if (D.fouls > 4) keep = this.freeThrows(O, D, onO, onD, wpick(onO, p => use(p)), 2, score, ev, f, 'bonus', cAdv);
      else { ev([f.id], () => 'Foul on ' + f.name, () => 'Side out'); keep = true; }
    } else if (kind === 'tov') {
      O.box[handler.id].tov++;
      const x = Math.random();
      if (x < RATE.stealShare) {
        const s2 = wpick(onD, p => Math.max(1, p.r.diq + (p.r.acc ?? p.r.spd) + ape(p.r) * 2 + ((p.feel ?? FEEL_MID) - FEEL_MID) * 0.6) * (p.roles?.includes('Point-of-attack defender') ? 1.5 : 1));
        D.box[s2.id].stl++;
        ev([s2.id, handler.id], () => s2.name + ' steals the ball from ' + handler.name, () => '(' + D.box[s2.id].stl + ' STL)');
      } else if (x < RATE.stealShare + RATE.offFoul) {
        O.box[handler.id].pf++;
        ev([handler.id], () => 'Offensive foul on ' + handler.name, () => '(' + O.box[handler.id].tov + ' TOV)');
      } else ev([handler.id], () => handler.name + (Math.random() < 0.5 ? ' loses the ball out of bounds' : ' throws it away'), () => '(' + O.box[handler.id].tov + ' TOV)');
    } else if (kind === 'trip') {
      // Fouled on a missed shot: two free throws (three on a three).
      const sh = wpick(onO, p => use(p) * (p.r.ins + (p.r.dnk + (p.r.lay ?? p.r.dnk)) / 2 + p.r.stre / 2 + (p.r.acc ?? 50) / 4) * (p.roles?.includes('Slasher') ? 1.2 : 1) * (p.tend?.draw ?? 1));
      keep = this.freeThrows(O, D, onO, onD, sh, Math.random() < 0.08 ? 3 : 2, score, ev, foul(), 'shot', cAdv);
    } else {
      // Field goal attempt: usage picks the shooter, his profile picks the tier.
      const sh = wpick(onO, p => use(p));
      const prof0 = this.profile(sh, tO, fx, fb), md = mood(sh);
      // A heat check is a deep pull-up; a frustrated shot is a contested jumper, rarely a drive.
      const prof = md === 'heat' ? { ...prof0, atb: prof0.atb * 2, c3: prof0.c3 * 0.6 } : md === 'tilt' ? { ...prof0, mid: prof0.mid * 1.5, atb: prof0.atb * 1.4, rim: prof0.rim * 0.6 } : prof0;
      const z = wpick(ZONES, k => prof[k]);
      const sk = C(sh).skill[z];
      const bigs = onD.slice().sort((a, b) => b.r.hgt - a.r.hgt).slice(0, 2);
      const intD = avg(bigs, p => interiorD(p.r));
      const rimPro = onD.some(p => p.roles?.includes('Rim protector'));
      const defAdj = z === 'rim' ? 0.003 * (intD - n.interiorD) + (rimPro ? 0.01 : 0) : z === 'mid' ? 0.0015 * (pressD - n.perimD) : 0.0012 * (pressD - n.perimD);
      // Tactics: the scheme's effect on this shot, the player's own adjustment (a box-and-one chaser,
      // an isolation star), and a cost for shots forced beyond his natural mix; a run-out is easier.
      const forced = fx ? Math.log(Math.max(0.2, prof[z] / C(sh).prof[z])) : 0;
      const tacD = fx ? fx.pct[z] + (fx.pctP.get(sh) ?? 0) - (forced > 0 ? forced * (0.07 + 0.0025 * Math.max(0, n.skill[z] - sk)) : 0.02 * forced) : 0; // a poor shooter forced into shots suffers most
      const fbD = fb && z === 'rim' ? 0.06 : 0;
      // Usage vs efficiency: the more of the offense runs through him, the more the defense keys on
      // him, so a heavy-usage star's shots get a little harder (the NBA's well-known trade-off).
      const shShare = use(sh) / onO.reduce((a, p) => a + use(p), 0), usgPen = shShare > 0.24 ? (shShare - 0.24) * 0.18 : 0;
      const moodD = md === 'heat' ? -0.02 : md === 'tilt' ? -0.04 : 0;
      const pct = moodD + BASE.zone[z].pct + CAL[z] + curve(CURVE_OF[z], sk) + n.offset[z] - defAdj + tacD + fbD - usgPen + 0.0002 * (feelO - FEEL_MID) - 0.00015 * (feelD - FEEL_MID) + (clutch ? 0.0005 * ((sh.fearless ? Math.max(80, sh.poise ?? POISE_MID) : sh.poise ?? POISE_MID) - POISE_MID) : 0) + (awayOff && sh.villain ? 0.02 : 0) + roadDef + 0.012 * cAdv + (clutch && sh.clutch ? 0.03 : 0) - roadPen(sh) - condPen(sh) - (sh.protect && z !== 'rim' ? 0.02 : 0) - (onO.some(p => p.selfish && p !== sh) ? 0.015 : 0) + (onD.some(p => p.selfish) ? 0.012 : 0) + ((this.teams[offK].chem ?? 50) - 50) * 0.00015;
      const three = z === 'c3' || z === 'atb', b = O.box[sh.id], [mk, at] = TIER_KEY[z];
      b.fga++; b[at]++; if (three) b.tpa++;
      const T0 = O.tiers[z] || [0, 0]; O.tiers[z] = [T0[0], T0[1] + 1];
      if (Math.random() < cl(pct, 0.1, 0.9)) {
        b.fgm++; b[mk]++; if (three) b.tpm++; this.streak.set(sh.id, Math.max(0, this.streak.get(sh.id) || 0) + 1);
        O.tiers[z] = [O.tiers[z][0] + 1, O.tiers[z][1]];
        score(sh, three ? 3 : 2);
        let passer: SimPlayer | null = null;
        const aRate = RATE.astF * BASE.zone[z].ast * Math.exp((avg(onO.filter(p => p !== sh), p => p.r.pss) - n.pss) / 60) * (fx ? fx.ast : 1) * Math.exp((feelO - FEEL_MID) / 120) + 0.02 * connectors;
        if (!putback && Math.random() < cl(aRate * (sh.tend?.ast ?? 1), 0.05, 0.97)) { // a self-creator's makes come off his own dribble
          passer = wpick(onO.filter(p => p.id !== sh.id), p => Math.pow(p.r.pss, 3.2) * Math.exp(((p.feel ?? FEEL_MID) - FEEL_MID) / 45) * (p.roles?.includes('Primary creator') ? 1.25 : 1) * (p.selfish ? 0.35 : 1) * (p.flashy ? 1.12 : 1)); // the best passer gets about 40% of his team's assists, like an NBA lead guard
          O.box[passer.id].ast++;
        }
        ev(passer ? [sh.id, passer.id] : [sh.id], () => sh.name + ' makes ' + LABEL[z](sh) + ' (' + b.pts + ' PTS)', () => (passer ? 'Assisted by ' + passer.name + ' (' + O.box[passer.id].ast + ' AST)' : ''), true);
        if (Math.random() < RATE.andOne) keep = this.freeThrows(O, D, onO, onD, sh, 1, score, ev, foul(), 'and1', cAdv);
      } else {
        this.streak.set(sh.id, Math.min(0, this.streak.get(sh.id) || 0) - 1);
        const blkP = BLOCK_ON_MISS[z] * Math.exp((intD - n.interiorD) / 25) * (rimPro ? 1.3 : 1);
        if (Math.random() < blkP) {
          const bl = wpick(onD, p => Math.pow(Math.max(1, p.r.hgt * 1.2 + p.r.jmp * 0.6 + p.r.diq * 0.4 + ape(p.r) * 3), 2) * (p.roles?.includes('Rim protector') ? 1.6 : 1));
          D.box[bl.id].blk++;
          ev([bl.id, sh.id], () => bl.name + ' blocks ' + sh.name, () => '(' + D.box[bl.id].blk + ' BLK)');
        } else ev([sh.id], () => sh.name + ' misses ' + LABEL[z](sh));
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
      }
    }
    if (this.pbp.length > 220) this.pbp.length = 220;
  }

  private profile(p: SimPlayer, _t: Tactics, fx: TacFx | null, fb = false) {
    const m: Partial<Record<Zone, number>> = { ...(fx ? fx.prof : {}) };
    if (fb) m.rim = (m.rim || 1) * 2.2; // a run-out ends at the rim
    if (p.protect) Object.assign(m, { c3: (m.c3 || 1) * 0.5, atb: (m.atb || 1) * 0.5 });
    return Object.keys(m).length ? shotProfile(p, this.norms, m) : this.cache.get(p)!.prof;
  }
  private ftPct(p: SimPlayer) { return BASE.ft + CAL.ft + curve('ft', p.r.ft) + this.norms.ftOffset; }
  // Clutch play options beyond isolating the star: the pick and roll pair, or tonight's hot hand.
  private clutchPick(onO: SimPlayer[], t: Tactics, k: Side): SimPlayer[] | null {
    if (t.clutch === 'Pick and roll') {
      const h = onO.reduce((a, p) => (p.r.drb + p.r.pss > a.r.drb + a.r.pss ? p : a)), rest = onO.filter(p => p !== h);
      return [h, rest.reduce((a, p) => (p.r.dnk + p.r.hgt > a.r.dnk + a.r.hgt ? p : a))];
    }
    if (t.clutch === 'Hot hand') { const B = this[k].box; return [onO.reduce((a, p) => (B[p.id].pts - B[p.id].fga * 0.5 > B[a.id].pts - B[a.id].fga * 0.5 ? p : a))]; }
    return null;
  }

  // Free throws. Returns true if the offense keeps the ball (offensive rebound off a live miss).
  private freeThrows(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], sh: SimPlayer, n: number, score: (p: SimPlayer, x: number) => void, ev: Ev, fouler: SimPlayer, kind: 'shot' | 'bonus' | 'and1' | 'hack', cAdv: number) {
    const pct = cl(BASE.ft + CAL.ft + curve('ft', sh.r.ft) + this.norms.ftOffset - (sh.adj ? 0.02 : 0) + (this.q >= 4 && this.t < 300 ? 0.0006 * ((sh.poise ?? POISE_MID) - POISE_MID) : 0), 0.4, 0.95);
    let made = 0, last = false;
    for (let i = 0; i < n; i++) { O.box[sh.id].fta++; last = Math.random() < pct; if (last) { made++; O.box[sh.id].ftm++; } }
    if (made) score(sh, made);
    ev([sh.id, fouler.id], () => (kind === 'and1' ? 'And one: ' + fouler.name + ' fouls ' + sh.name : fouler.name + ' fouls ' + sh.name + (kind === 'bonus' ? ' (bonus)' : kind === 'hack' ? ' on purpose (Hack-a-Shaq)' : ' on the shot')), () => sh.name + ' makes ' + made + ' of ' + n + ' free throw' + (n === 1 ? '' : 's'), made > 0);
    if (!last && Math.random() < RATE.liveFt) return this.rebound(O, D, onO, onD, cAdv, ev);
    return false;
  }

  private rebound(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], cAdv: number, ev: Ev, tacOrb = 0) {
    const orbP = cl(BASE.orbPct + 0.004 * (avg(onO, p => glassSkill(p.r)) - avg(onD, p => glassSkill(p.r))) + 0.015 * cAdv + tacOrb, 0.12, 0.45);
    const off = Math.random() < orbP;
    if (Math.random() < RATE.rebCredit) {
      const pool = off ? onO : onD, S = off ? O : D;
      const rb = wpick(pool, p => Math.pow(rebSkill(p.r), 2) * (p.roles?.includes('Rebounder') ? 1.3 : 1) * (1 - Math.max(0, (p.r.box ?? 50) - 55) / 120));
      if (off) S.box[rb.id].orb++; else S.box[rb.id].drb++;
      ev([rb.id], () => rb.name + ' grabs the ' + (off ? 'offensive' : 'defensive') + ' rebound', () => '(' + (S.box[rb.id].orb + S.box[rb.id].drb) + ' REB)');
    }
    if (off) this.afterOrb = true;
    return off;
  }

  run() { let guard = 0; while (!this.done && guard++ < 8000) this.step(); return this.result(); }

  result(): GameResult {
    const pack = (k: Side): SideResult => ({ tid: this.teams[k].tid, pts: this[k].pts, qs: this[k].qs.slice(), box: this[k].box, poss: this[k].poss });
    return { home: pack('home'), away: pack('away'), ot: Math.max(0, this.q - 4) };
  }
}

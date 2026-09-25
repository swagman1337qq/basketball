// Possession-by-possession game engine. One engine plays every game: the Live Game
// screen steps it on a timer, quick sims run it to the end.
//
// Everything is anchored on the 2026 league baselines below (the 50th percentile).
// Player ratings only move a player away from those means (the "bell curve"), and the
// league normalization in norms.ts re-centres the curves every season, so rating drift
// never inflates league stats. These formulas are engine code, not save data: nothing in
// God Mode can edit them.

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
export const curve = (k: string, r: number) => { const c = CURVE[k], d = r - c.mid; return d >= 0 ? d * c.up : d * c.down; };
export const CURVE_OF: Record<Zone, string> = { rim: 'rim', mid: 'jumper', c3: 'three', atb: 'three' };

// A player's skill for each tier (0–99 scale).
export function zoneSkill(r: any): Record<Zone, number> {
  return { rim: 0.45 * r.dnk + 0.35 * r.ins + 0.1 * r.hgt + 0.1 * r.jmp, mid: r.fg, c3: r.tp, atb: r.tp };
}
// Raw usage weight: how often he ends a possession while on the floor. USG% in the UI is
// this relative to the league mean (= 20%). This is the usage-rate gatekeeper: volume
// comes from usage and minutes, efficiency from shooting ratings, so a pure shooter with
// low usage can't put up star numbers (points ≈ possessions × USG% × TS%).
export function usageRaw(p: { ovr: number; r: any; alpha?: boolean; touches?: boolean; roles?: string[] }) {
  let u = Math.exp(0.045 * (p.ovr - 50) + 0.015 * (p.r.oiq - 50) + 0.01 * (p.r.drb - 50));
  if (p.alpha) u *= 1.1;
  if (p.touches) u *= 1.06;
  if (p.roles?.includes('Primary creator')) u *= 1.12;
  return u;
}
export const mental = (r: any) => (r.oiq + r.diq) / 2;
export const perimD = (r: any) => r.diq * 0.6 + r.spd * 0.4;
export const interiorD = (r: any) => r.hgt * 0.5 + r.diq * 0.3 + r.jmp * 0.2;
export const rebSkill = (r: any) => r.reb * 0.6 + r.hgt * 0.25 + r.jmp * 0.15;

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
export function shotProfile(p: { r: any; roles?: string[] }, n: Norms, mult?: Partial<Record<Zone, number>>) {
  const sk = zoneSkill(p.r), roles = p.roles || [];
  const w = {} as Record<Zone, number>;
  let tot = 0;
  for (const z of ZONES) {
    let x = BASE.zone[z].share * n.shareCorr[z] * Math.exp(0.04 * (sk[z] - n.skill[z]));
    if (z === 'rim' && roles.includes('Slasher')) x *= 1.3;
    if ((z === 'c3' || z === 'atb') && roles.includes('Floor spacer')) x *= 1.25;
    if (z === 'c3' && roles.includes('3-and-D wing')) x *= 1.4;
    if ((z === 'c3' || z === 'atb') && roles.includes('Stretch big')) x *= 1.5;
    if (mult?.[z]) x *= mult[z]!;
    w[z] = x; tot += x;
  }
  for (const z of ZONES) w[z] /= tot;
  return w;
}

export interface SimPlayer {
  id: number; name: string; pos: string; grp: string; ovr: number; r: any;
  crowd?: boolean; clutch?: boolean; padder?: boolean; alpha?: boolean; touches?: boolean;
  adj?: boolean; dtd?: boolean; fat?: number; protect?: boolean; flag?: string;
  conf?: number; // hidden confidence 0–100 (50 neutral): a small shooting nudge either way
  roles?: string[];
  target: number; // minutes per 48 the coach wants him to play
}
export interface Tactics { pace?: string; off?: string; def?: string; clutch?: string }
export interface FourFactors { efg: number; tov: number; orb: number; ftr: number }
export interface SimTeam {
  tid: number; name: string; abbr: string; rec: string; players: SimPlayer[];
  tactics?: Tactics | null; situ?: { lead?: Tactics | null; trail?: Tactics | null } | null;
  ff?: FourFactors; // season Four Factors (regressed early on) for the clutch tiebreaker
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
const LABEL: Record<Zone, (p: SimPlayer) => string> = { rim: p => (p.r.dnk > 62 ? 'a dunk' : 'a layup'), mid: () => 'a mid-range jumper', c3: () => 'a corner three', atb: () => 'a three pointer' };

// Four Factors composite (Dean Oliver's 40/25/20/15 weights), in rough league standard deviations.
export const ffScore = (f: FourFactors) => (0.4 * (f.efg - BASE.efg)) / 0.025 + (0.25 * (BASE.tovPct - f.tov)) / 0.012 + (0.2 * (f.orb - BASE.orbPct)) / 0.025 + (0.15 * (f.ftr - BASE.ftr)) / 0.03;

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
    if (late && diff <= 8) { this.on[k] = ps.slice().sort((a, b) => b.target - a.target).slice(0, 5); return; }
    if (this.q === 3 && this.t === 720) { this.on[k] = ps.slice(0, 5); return; }
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
    this.on[k] = on;
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
    const roadPen = (p: SimPlayer) => (awayOff && C(p).role && !C(p).star ? (p.crowd ? 0.05 : 0.025) : 0);
    const roadDef = awayDef ? onD.filter(p => C(p).role && !C(p).star).length * 0.004 : 0;
    const condPen = (p: SimPlayer) => (p.adj ? 0.03 : 0) + (p.dtd ? 0.03 : 0) + Math.min(0.04, Math.max(0, (p.fat || 0) - 25) * 0.001) + (p.conf == null ? 0 : cl((50 - p.conf) * 0.0004, -0.012, 0.012));

    const handleO = avg(onO, p => (p.r.drb + p.r.pss) / 2), pressD = avg(onD, p => perimD(p.r));
    const connectors = onO.filter(p => p.roles?.includes('Connector')).length, poa = onD.filter(p => p.roles?.includes('Point-of-attack defender')).length;
    const star = onO.reduce((a, b) => (C(b).use > C(a).use ? b : a));
    // Usage decides who ends the trip (the gatekeeper); ball-handling decides turnovers.
    const use = (p: SimPlayer) => C(p).use * (p.padder ? 1.1 : 1) * (p.dtd ? 0.9 : 1) * (clutch && tO.clutch === 'Isolate the star' && p === star ? 2.5 : 1);
    const pTov = RATE.tov * Math.exp(-(handleO - n.handle) / 45 + (pressD - n.perimD) / 60) * (1 - 0.04 * connectors) * (1 + 0.035 * poa) * (1 - 0.08 * cAdv) + (tD.def === 'Aggressive' ? 0.02 : 0);
    const pTrip = RATE.foulTrip * (1 + 0.1 * cAdv) * (tD.def === 'Aggressive' ? 1.15 : 1);
    const pNsf = putback ? 0 : RATE.nonShoot * (tD.def === 'Aggressive' ? 1.25 : 1);
    const handler = wpick(onO, p => use(p) * (1.3 - (p.r.drb + p.r.pss) / 200));
    const r = Math.random();
    const kind = r < pNsf ? 'nsf' : r < pNsf + pTov + roadPen(handler) + (handler.adj ? 0.015 : 0) ? 'tov' : r < pNsf + pTov + pTrip ? 'trip' : 'fga';

    // Clock: a whistle, a quick putback, or a normal trip at the offense's pace.
    const paceF = tO.pace === 'Fast' ? 0.92 : tO.pace === 'Slow' ? 1.08 : 1;
    const dt = Math.min(this.t, kind === 'nsf' ? 2 + Math.random() * 4 : putback ? 3 + Math.random() * 6 : (7 + Math.random() * 12.6) * paceF * RATE.dt);
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
    if (kind === 'nsf') {
      // Non-shooting foul: a side-out, or two free throws once the defense is in the bonus.
      const f = foul();
      if (D.fouls > 4) keep = this.freeThrows(O, D, onO, onD, wpick(onO, p => use(p)), 2, score, ev, f, 'bonus', cAdv);
      else { ev([f.id], () => 'Foul on ' + f.name, () => 'Side out'); keep = true; }
    } else if (kind === 'tov') {
      O.box[handler.id].tov++;
      const x = Math.random();
      if (x < RATE.stealShare) {
        const s2 = wpick(onD, p => (p.r.diq + p.r.spd) * (p.roles?.includes('Point-of-attack defender') ? 1.5 : 1));
        D.box[s2.id].stl++;
        ev([s2.id, handler.id], () => s2.name + ' steals the ball from ' + handler.name, () => '(' + D.box[s2.id].stl + ' STL)');
      } else if (x < RATE.stealShare + RATE.offFoul) {
        O.box[handler.id].pf++;
        ev([handler.id], () => 'Offensive foul on ' + handler.name, () => '(' + O.box[handler.id].tov + ' TOV)');
      } else ev([handler.id], () => handler.name + (Math.random() < 0.5 ? ' loses the ball out of bounds' : ' throws it away'), () => '(' + O.box[handler.id].tov + ' TOV)');
    } else if (kind === 'trip') {
      // Fouled on a missed shot: two free throws (three on a three).
      const sh = wpick(onO, p => use(p) * (p.r.ins + p.r.dnk + p.r.stre / 2) * (p.roles?.includes('Slasher') ? 1.2 : 1));
      keep = this.freeThrows(O, D, onO, onD, sh, Math.random() < 0.08 ? 3 : 2, score, ev, foul(), 'shot', cAdv);
    } else {
      // Field goal attempt: usage picks the shooter, his profile picks the tier.
      const sh = wpick(onO, p => use(p));
      const prof = this.profile(sh, tO);
      const z = wpick(ZONES, k => prof[k]);
      const sk = C(sh).skill[z];
      const bigs = onD.slice().sort((a, b) => b.r.hgt - a.r.hgt).slice(0, 2);
      const intD = avg(bigs, p => interiorD(p.r));
      const rimPro = onD.some(p => p.roles?.includes('Rim protector'));
      const defAdj = z === 'rim' ? 0.003 * (intD - n.interiorD) + (rimPro ? 0.01 : 0) : z === 'mid' ? 0.0015 * (pressD - n.perimD) : 0.0012 * (pressD - n.perimD);
      const tacD = ({ Switch: { c3: -0.01, atb: -0.01, rim: 0.01 }, Drop: { mid: 0.02, rim: -0.02 } } as any)[tD.def || '']?.[z] || 0;
      const pct = BASE.zone[z].pct + CAL[z] + curve(CURVE_OF[z], sk) + n.offset[z] - defAdj + tacD + roadDef + 0.012 * cAdv + (clutch && sh.clutch ? 0.03 : 0) - roadPen(sh) - condPen(sh) - (sh.protect && z !== 'rim' ? 0.02 : 0);
      const three = z === 'c3' || z === 'atb', b = O.box[sh.id], [mk, at] = TIER_KEY[z];
      b.fga++; b[at]++; if (three) b.tpa++;
      const T0 = O.tiers[z] || [0, 0]; O.tiers[z] = [T0[0], T0[1] + 1];
      if (Math.random() < cl(pct, 0.1, 0.9)) {
        b.fgm++; b[mk]++; if (three) b.tpm++;
        O.tiers[z] = [O.tiers[z][0] + 1, O.tiers[z][1]];
        score(sh, three ? 3 : 2);
        let passer: SimPlayer | null = null;
        const aRate = RATE.astF * BASE.zone[z].ast * Math.exp((avg(onO.filter(p => p !== sh), p => p.r.pss) - n.pss) / 60) + 0.02 * connectors;
        if (!putback && Math.random() < cl(aRate, 0.2, 0.97)) {
          passer = wpick(onO.filter(p => p.id !== sh.id), p => Math.pow(p.r.pss, 5) * (p.roles?.includes('Primary creator') ? 1.3 : 1));
          O.box[passer.id].ast++;
        }
        ev(passer ? [sh.id, passer.id] : [sh.id], () => sh.name + ' makes ' + LABEL[z](sh) + ' (' + b.pts + ' PTS)', () => (passer ? 'Assisted by ' + passer.name + ' (' + O.box[passer.id].ast + ' AST)' : ''), true);
        if (Math.random() < RATE.andOne) keep = this.freeThrows(O, D, onO, onD, sh, 1, score, ev, foul(), 'and1', cAdv);
      } else {
        const blkP = BLOCK_ON_MISS[z] * Math.exp((intD - n.interiorD) / 25) * (rimPro ? 1.3 : 1);
        if (Math.random() < blkP) {
          const bl = wpick(onD, p => Math.pow(p.r.hgt * 1.2 + p.r.jmp * 0.6 + p.r.diq * 0.4, 2) * (p.roles?.includes('Rim protector') ? 1.6 : 1));
          D.box[bl.id].blk++;
          ev([bl.id, sh.id], () => bl.name + ' blocks ' + sh.name, () => '(' + D.box[bl.id].blk + ' BLK)');
        } else ev([sh.id], () => sh.name + ' misses ' + LABEL[z](sh));
        keep = this.rebound(O, D, onO, onD, cAdv, ev);
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

  private profile(p: SimPlayer, t: Tactics) {
    const m: Partial<Record<Zone, number>> = {};
    if (t.off === 'Inside') Object.assign(m, { rim: 1.2, atb: 0.88, mid: 0.93 });
    if (t.off === 'Perimeter') Object.assign(m, { atb: 1.18, c3: 1.2, mid: 0.82, rim: 0.9 });
    if (t.off === 'Pace and space') Object.assign(m, { atb: 1.25, c3: 1.3, mid: 0.7, rim: 0.9 });
    if (p.protect) Object.assign(m, { c3: (m.c3 || 1) * 0.5, atb: (m.atb || 1) * 0.5 });
    return Object.keys(m).length ? shotProfile(p, this.norms, m) : this.cache.get(p)!.prof;
  }

  // Free throws. Returns true if the offense keeps the ball (offensive rebound off a live miss).
  private freeThrows(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], sh: SimPlayer, n: number, score: (p: SimPlayer, x: number) => void, ev: Ev, fouler: SimPlayer, kind: 'shot' | 'bonus' | 'and1', cAdv: number) {
    const pct = cl(BASE.ft + CAL.ft + curve('ft', sh.r.ft) + this.norms.ftOffset - (sh.adj ? 0.02 : 0), 0.4, 0.95);
    let made = 0, last = false;
    for (let i = 0; i < n; i++) { O.box[sh.id].fta++; last = Math.random() < pct; if (last) { made++; O.box[sh.id].ftm++; } }
    if (made) score(sh, made);
    ev([sh.id, fouler.id], () => (kind === 'and1' ? 'And one: ' + fouler.name + ' fouls ' + sh.name : fouler.name + ' fouls ' + sh.name + (kind === 'bonus' ? ' (bonus)' : ' on the shot')), () => sh.name + ' makes ' + made + ' of ' + n + ' free throw' + (n === 1 ? '' : 's'), made > 0);
    if (!last && Math.random() < RATE.liveFt) return this.rebound(O, D, onO, onD, cAdv, ev);
    return false;
  }

  private rebound(O: SideState, D: SideState, onO: SimPlayer[], onD: SimPlayer[], cAdv: number, ev: Ev) {
    const orbP = cl(BASE.orbPct + 0.004 * (avg(onO, p => rebSkill(p.r)) - avg(onD, p => rebSkill(p.r))) + 0.015 * cAdv, 0.12, 0.42);
    const off = Math.random() < orbP;
    if (Math.random() < RATE.rebCredit) {
      const pool = off ? onO : onD, S = off ? O : D;
      const rb = wpick(pool, p => Math.pow(rebSkill(p.r), 2) * (p.roles?.includes('Rebounder') ? 1.3 : 1));
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

// The analytics department (2026-11-20, coaches phase 4): a Head of Analytics and two analysts, hired from a pool
// of analytics people on contracts you negotiate (1–5 years, like coaches).
//  • Each analyst: a hidden skill (how much noise is in his numbers) and hidden biases, none to three of:
//    loves threes, trusts college box plus/minus too much, blind to defense, chases small samples, skeptical of
//    older players. You see reputation and background; your read of his skill sharpens month by month while he works
//    for you, and his biases show in his track record (God Mode: exact).
//  • Numbers only: they never see ratings. Their models were fitted on simulated leagues (2026-11-20): an NBA
//    player's level from his per-36 production, shooting efficiency, minutes and age (R² 0.93); a prospect's level
//    and ceiling from his last college or club season per 40 minutes, box plus/minus, age and level of play
//    (ceiling R² 0.67, about ±3.8). A careful analyst regresses a small sample toward what his minutes say; a biased
//    one moves his weights (a shooter's threes count extra, defense counts for nothing, college BPM for more, the
//    last few weeks for everything, birthdays past 29 against him).
//  • Advice: the draft (their own board), a player's level, ceiling and fit with your team, what his contract is
//    worth (free agency, trades). Shown next to your scouts' and coaches' read where they disagree.
//  • Track record: their projections on opening night and their draft boards are saved, then graded (a season
//    later for players, three seasons later for draft classes), so their hit rates and tendencies show over time.
// Nothing here runs during games: views are worked out when shown (cached by day), records once a season.
import type { Game } from './Game';
import { randomName } from '../data/heritage';
import { natDefault } from '../data/world';
import { classStats, compLevel } from './amateurStats';
import { firstSeason } from './contracts';
import { fmtMoney as money } from './capModel';
import { mulberry32 } from './rng';
import { potView, scoutSd } from './potential';

export type AnRole = 'head' | 'analyst';
export const AN_ROLE_LABEL: Record<AnRole, string> = { head: 'Head of Analytics', analyst: 'Analyst' };
export const AN_MAX: Record<AnRole, number> = { head: 1, analyst: 2 };
export const BIAS_KEYS = ['threes', 'cbpm', 'noD', 'small', 'old'] as const;
export type BiasKey = (typeof BIAS_KEYS)[number];
export const BIAS_LABEL: Record<BiasKey, string> = {
  threes: 'Loves threes',
  cbpm: 'Trusts college box plus/minus too much',
  noD: 'Blind to defense',
  small: 'Chases small samples',
  old: 'Skeptical of older players',
};
const BG = [
  'PhD in statistics',
  'Economics PhD',
  'Physics PhD',
  'Former quant, finance',
  'Software engineer',
  'Sports data journalist',
  'Betting market modeler',
  'College program analyst',
  'Former team video coordinator',
  'Former college player, then analytics',
];

export interface Analyst {
  id: number;
  name: string;
  first: string;
  last: string;
  native?: string;
  fem: boolean;
  nat: string;
  race: string;
  born: number;
  pers: { money: number; loyal: number; amb: number };
  skill: number; // hidden, 1–99: the noise in his numbers
  bias: Partial<Record<BiasKey, number>>; // hidden, strength 0.4–1
  rep: number; // visible 0–100
  bg: string;
  since: number; // first season in analytics
  tid: number | null;
  role: AnRole | null;
  amt: number;
  exp: number;
  next?: { start: number; amt: number; exp: number };
  read: number; // your read of his skill, 0–1
  ret?: number;
  rec?: AnRec[]; // graded seasons (player projections)
  drec?: AnDraftRec[]; // graded draft classes
  faceSeed?: number;
}
// One graded season of his opening-night projections: mean absolute error, his mean error overall and on shooters,
// defenders, players past 30 and small samples ([sum of errors, count]).
export interface AnRec {
  y: number;
  n: number;
  mae: number;
  all: number;
  sh: [number, number];
  df: [number, number];
  old: [number, number];
  sm: [number, number];
  jm?: [number, number]; // players whose numbers jumped or fell a lot the season before: his error in the swing's direction
}
// One graded draft class: how often he had two players in the right order three seasons on (and your scouts),
// and his error on prospects with a big college box plus/minus.
export interface AnDraftRec {
  cls: number;
  n: number;
  hit: number;
  scouts: number;
  bpm: [number, number];
  all: number;
}

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const bell = () => Math.random() + Math.random() + Math.random() - 1.5;
const lfOf = (g: Game) => g.CAP / 165;
export const anAge = (g: Game, a: Analyst) => g.Y - a.born;
export const anYears = (g: Game, a: Analyst) => Math.max(0, g.Y - a.since);

// ── Store ───────────────────────────────────────────────────────────────────────────
export function anDb(g: Game): Record<number, Analyst> {
  const d: any = g.db;
  if (!d.analysts) d.analysts = {};
  if (!d.anSeq) d.anSeq = 1;
  return d.analysts;
}
const bump = (g: Game) => ((g.db as any).anRev = ((g.db as any).anRev || 0) + 1);
export const anRev = (g: Game) => (g.db as any).anRev || 0;
export const deptOf = (g: Game, tid: number): Analyst[] =>
  (Object.values(anDb(g)) as Analyst[])
    .filter(a => a.tid === tid && !a.ret)
    .sort((a, b) => (a.role === 'head' ? -1 : 0) - (b.role === 'head' ? -1 : 0) || b.rep - a.rep);
export const freeAnalysts = (g: Game) => (Object.values(anDb(g)) as Analyst[]).filter(a => a.tid == null && !a.ret);

export function mkAnalyst(g: Game, o: { age?: number; lvl?: number } = {}): Analyst {
  const A = anDb(g),
    d: any = g.db,
    id = d.anSeq++;
  const fem = Math.random() < 0.15;
  const natW = (g.state as any)?.natW || natDefault(),
    tot = Object.values(natW).reduce((a: number, b: any) => a + +b, 0) as number;
  let x = Math.random() * tot,
    nat = 'US';
  for (const [k, w] of Object.entries(natW))
    if ((x -= +(w as number)) <= 0) {
      nat = k;
      break;
    }
  if (Math.random() < 0.6) nat = 'US'; // front offices hire at home
  const nm: any = randomName(nat, Math.random, undefined, fem);
  const age = Math.round(o.age ?? cl(33 + bell() * 14, 23, 66));
  const years = Math.max(0, Math.round((age - 23) * (0.3 + Math.random() * 0.6)));
  const nb = Math.random(),
    nBias = nb < 0.25 ? 0 : nb < 0.7 ? 1 : nb < 0.95 ? 2 : 3,
    keys = [...BIAS_KEYS].sort(() => Math.random() - 0.5).slice(0, nBias),
    bias: Partial<Record<BiasKey, number>> = {};
  keys.forEach(k => (bias[k] = +(0.4 + Math.random() * 0.6).toFixed(2)));
  const a: Analyst = {
    id,
    name: nm.name,
    first: nm.first,
    last: nm.last,
    ...(nm.native ? { native: nm.native } : {}),
    fem,
    nat,
    race: nm.race,
    born: g.Y - age,
    pers: {
      money: Math.round(cl(50 + bell() * 40, 1, 99)),
      loyal: Math.round(cl(50 + bell() * 40, 1, 99)),
      amb: Math.round(cl(50 + bell() * 40, 1, 99)),
    },
    skill: Math.round(cl(50 + bell() * 30 + (o.lvl ?? 0) + Math.min(10, years * 0.6), 8, 96)),
    bias,
    rep: 0,
    bg: BG[Math.floor(Math.random() * BG.length)],
    since: g.Y - years,
    tid: null,
    role: null,
    amt: 0,
    exp: 0,
    read: 0,
  };
  a.rep = anRepOf(g, a);
  A[id] = a;
  return a;
}
// Reputation: years in the field, how good the league has seen him be (known over about six years), his record.
export function anRepOf(g: Game, a: Analyst) {
  const y = anYears(g, a),
    known = Math.min(1, y / 6),
    recF = (a.rec || []).slice(-3).reduce((t, r) => t + (3 - r.mae) * 2, 0);
  return Math.round(cl(14 + y * 2 + (a.skill - 50) * 0.55 * known + (/PhD/.test(a.bg) ? 4 : 0) + recF, 0, 100));
}

// ── Your read ───────────────────────────────────────────────────────────────────────
export function readSkill(a: Analyst, exact = false) {
  if (exact) return a.skill;
  const h = (((a.id * 2654435761) ^ 0x51ab) >>> 0) / 4294967296 - 0.5;
  return Math.round(cl(a.skill + h * 40 * (1 - a.read), 1, 99));
}
export const anReadLabel = (a: Analyst) =>
  a.read >= 0.95 ? 'Fully known' : a.read >= 0.6 ? 'Known well' : a.read >= 0.25 ? 'Getting to know' : 'Just met';

// ── Money ───────────────────────────────────────────────────────────────────────────
export function anAsk(g: Game, a: Analyst, role: AnRole) {
  const base = 0.15 + 1.5 * Math.pow(a.rep / 100, 1.5),
    rf = role === 'head' ? 1.7 : 1,
    mf = 0.85 + (a.pers.money / 99) * 0.4;
  return +(base * rf * mf * lfOf(g)).toFixed(2);
}
export const anPrefYears = (a: Analyst) => (a.pers.amb >= 70 ? 2 : a.pers.loyal >= 65 ? 4 : 3);
export function anAccept(g: Game, s: any, tid: number, a: Analyst, t: { amt: number; years: number; role: AnRole }) {
  const ask = anAsk(g, a, t.role) * (a.tid === tid ? 0.95 - (a.pers.loyal - 50) / 500 : 1);
  const gap = Math.max(0, Math.abs(t.years - anPrefYears(a)) - 1),
    value = t.amt * (1 - gap * 0.06);
  const ok = value >= ask - 0.005;
  return {
    ok,
    ask: +ask.toFixed(2),
    why: ok
      ? ''
      : (a.fem ? 'She' : 'He') + '’s looking for about ' + money(ask) + ' a year' + (gap ? ' over ' + anPrefYears(a) + ' years' : '') + '.',
  };
}
// The Analytics department line in Finances: salaries and anyone fired still owed.
export function analyticsCost(g: Game, s: any, tid: number) {
  const pay = deptOf(g, tid).reduce((t, a) => t + a.amt, 0),
    dead = ((g.db as any).anDead?.[tid] || []).filter((x: any) => x.thru >= g.Y).reduce((t: number, x: any) => t + x.amt, 0);
  return +(pay + dead).toFixed(2);
}

// ── Hiring, roles, firing ───────────────────────────────────────────────────────────
const roleFull = (g: Game, tid: number, role: AnRole, except?: number) =>
  deptOf(g, tid).filter(a => a.role === role && a.id !== except).length >= AN_MAX[role];
export function hireAnalyst(
  g: Game,
  s: any,
  tid: number,
  id: number,
  t: { amt: number; years: number; role: AnRole },
  force = false,
): string {
  const a = anDb(g)[id];
  if (!a || a.ret) return 'That analyst isn’t available.';
  const resign = a.tid === tid;
  if (resign && a.next) return 'Already signed an extension.';
  if (resign && t.role !== a.role) return 'Change the job first, then renew the contract.';
  if (!resign) {
    if (a.tid != null && !force) return 'Under contract with another team.';
    if (roleFull(g, tid, t.role) && !force)
      return t.role === 'head' ? 'You already have a Head of Analytics.' : 'You already have two analysts. Let one go first.';
  }
  if (!force) {
    if (t.years < 1 || t.years > 5) return 'Contracts run 1 to 5 years.';
    const r = anAccept(g, s, tid, a, t);
    if (!r.ok) return r.why;
  }
  const Y1 = resign ? a.exp + 1 : firstSeason(g, s),
    deal = { amt: +t.amt.toFixed(2), exp: Y1 + Math.max(1, Math.round(t.years)) - 1 };
  if (resign) a.next = { start: Y1, ...deal };
  else {
    Object.assign(a, { tid, role: t.role, ...deal });
    a.read = Math.max(a.read, 0.15);
  }
  bump(g);
  return '';
}
function detach(a: Analyst) {
  Object.assign(a, { tid: null, role: null, amt: 0, exp: 0 });
  a.read = Math.min(a.read, 0.15);
  delete a.next;
}
// Let him go: he's paid to the end of his deal.
export function fireAnalyst(g: Game, s: any, tid: number, id: number, god = false): string {
  const a = anDb(g)[id];
  if (!a || a.tid !== tid) return 'Not in your department.';
  if (!god && a.exp >= g.Y) {
    const d: any = g.db;
    d.anDead = d.anDead || {};
    d.anDead[tid] = [...(d.anDead[tid] || []).filter((x: any) => x.thru >= g.Y), { name: a.name, amt: a.amt, thru: a.exp }];
  }
  detach(a);
  bump(g);
  return '';
}
export function setAnRole(g: Game, s: any, tid: number, id: number, role: AnRole, god = false): string {
  const a = anDb(g)[id];
  if (!a || a.tid !== tid) return 'Not in your department.';
  if (roleFull(g, tid, role, id)) {
    if (!god && role === 'head') {
      const cur = deptOf(g, tid).find(x => x.role === 'head' && x.id !== id);
      if (cur && !roleFull(g, tid, 'analyst', cur.id)) cur.role = 'analyst';
      else return 'Move someone first.';
    } else if (!god) return 'Move someone first.';
  }
  a.role = role;
  bump(g);
  return '';
}
// God Mode: anyone into the department, no talks.
export function godAnalyst(g: Game, s: any, tid: number, id: number, role: AnRole) {
  const a = anDb(g)[id];
  if (!a) return 'That analyst isn’t available.';
  if (a.tid != null && a.tid !== tid) detach(a);
  Object.assign(a, { tid, role, amt: a.amt || anAsk(g, a, role), exp: a.exp >= g.Y ? a.exp : firstSeason(g, s) + anPrefYears(a) - 1 });
  delete a.ret;
  bump(g);
  return '';
}

// ── A new league or an older save: a pool, and a department for each of your teams ────
export const AN_POOL = 30;
export function ensureAnalytics(g: Game) {
  const d: any = g.db,
    s: any = g.state;
  anDb(g);
  if (!d.anV) {
    for (let i = 0; i < AN_POOL; i++) mkAnalyst(g);
    d.anV = 1;
    (s.managed || [s.me]).forEach((tid: number) => starterDept(g, s, tid));
  }
  Object.values(anDb(g)).forEach(a => activateNext(a, g.Y));
  bump(g);
}
// The department a team starts with: three ordinary analysts on short deals.
export function starterDept(g: Game, s: any, tid: number) {
  if (s.spectator || deptOf(g, tid).length) return;
  (['head', 'analyst', 'analyst'] as AnRole[]).forEach((role, i) => {
    const a = mkAnalyst(g, { age: 28 + Math.floor(Math.random() * 20), lvl: -4 });
    a.skill = Math.round(cl(a.skill, 38, 62));
    a.rep = anRepOf(g, a);
    Object.assign(a, { tid, role, amt: anAsk(g, a, role), exp: firstSeason(g, s) + (i % 2), read: 0.3 });
  });
}
function activateNext(a: Analyst, year: number) {
  if (!a.next || a.next.start > year) return;
  Object.assign(a, { amt: a.next.amt, exp: a.next.exp });
  delete a.next;
}

// ── Monthly and yearly ──────────────────────────────────────────────────────────────
export function anMonth(g: Game, s: any) {
  let n = 0;
  (Object.values(anDb(g)) as Analyst[]).forEach(a => {
    if (a.tid != null && !a.ret && g.isUser(s, a.tid) && a.read < 1) {
      a.read = Math.min(1, a.read + 0.04);
      n++;
    }
  });
  if (n) bump(g);
}
// Training camp: experience (a little sharper the first ten years), retirements (rare before 60), the pool topped up.
export function anYear(g: Game, s: any): any[] {
  const notices: any[] = [];
  (Object.values(anDb(g)) as Analyst[]).forEach(a => {
    if (a.ret) return;
    activateNext(a, g.Y);
    if (a.tid != null && !g.isUser(s, a.tid)) detach(a); // a team you no longer run has no department
    if (anYears(g, a) < 10 && Math.random() < 0.5) a.skill = Math.min(97, a.skill + 1);
    const age = anAge(g, a),
      pr = 0.008 + Math.max(0, age - 60) * 0.03 + (a.tid == null ? 0.03 : 0);
    if (Math.random() < pr) {
      if (a.tid != null && g.isUser(s, a.tid))
        notices.push({
          tone: 'info',
          title: 'Analyst leaving: ' + a.name,
          lines: [a.name + ' (' + AN_ROLE_LABEL[a.role!] + ') is leaving the game.'],
        });
      a.ret = g.Y;
      a.tid = null;
      a.role = null;
      return;
    }
    a.rep = anRepOf(g, a);
  });
  for (let i = freeAnalysts(g).length; i < AN_POOL; i++) mkAnalyst(g, { age: 24 + Math.floor(Math.random() * 18) });
  bump(g);
  return notices;
}
export function anExpiring(g: Game, s: any): any[] {
  const out: any[] = [];
  (s.managed || [s.me]).forEach((tid: number) => {
    const ex = deptOf(g, tid).filter(a => a.exp <= g.Y && !a.next);
    if (ex.length)
      out.push({
        tone: 'warn',
        title: 'Analysts’ contracts ending',
        lines: [
          ex.map(a => a.name + ' (' + AN_ROLE_LABEL[a.role!] + ')').join(', ') +
            ' ' +
            (ex.length === 1 ? 'has a contract that ends' : 'have contracts that end') +
            ' June 30. Re-sign on the Analytics screen, or ' +
            (ex.length === 1 ? 'that analyst leaves' : 'they leave') +
            ' when free agency opens.',
        ],
      });
  });
  return out;
}
export function anContractsEnd(g: Game, s: any): any[] {
  const out: any[] = [];
  (Object.values(anDb(g)) as Analyst[]).forEach(a => {
    activateNext(a, g.Y);
    if (a.tid == null || a.ret || a.exp > g.Y || a.next) return;
    if (g.isUser(s, a.tid))
      out.push({
        tone: 'info',
        title: 'Analyst gone: ' + a.name,
        lines: [a.name + ' (' + AN_ROLE_LABEL[a.role!] + ') left when the contract ended. Hire a replacement on the Analytics screen.'],
      });
    detach(a);
  });
  const d: any = g.db;
  if (d.anDead) Object.keys(d.anDead).forEach(k => (d.anDead[k] = d.anDead[k].filter((x: any) => x.thru > g.Y)));
  bump(g);
  return out;
}

// ── The numbers ─────────────────────────────────────────────────────────────────────
// Fitted 2026-11-20 on three simulated leagues (scratch fits, ordinary least squares): an NBA player's overall from
// his per-36 numbers (players with 300+ minutes, weighted by minutes up to 1,500); a prospect's overall and true
// potential from his last amateur season per 40 minutes.
const NBA_NOW = {
  c: 23.1,
  pts: 0.149,
  tpm: 0.146,
  fga: 0.265,
  fta: -0.047,
  ast: 0.842,
  orb: 0.823,
  drb: 0.098,
  stl: 3.116,
  blk: 3.042,
  tov: -1.224,
  pf: -0.298,
  ts: 12.33,
  mpg: 0.359,
  gs: 0.353,
  age: -0.012,
};
const AM_NOW = {
  c: -12.2,
  pts: -0.08,
  tpm: 0.753,
  fga: 0.098,
  fta: 1.421,
  ast: 0.82,
  orb: -0.084,
  drb: 0.576,
  stl: 2.347,
  blk: 3.721,
  tov: -0.998,
  ts: 11.36,
  mpg: 0.204,
  bpm: -0.043,
  age: 0.165,
  lvl: 0.709,
};
const AM_PEAK = {
  c: 63.24,
  pts: -0.123,
  tpm: 0.478,
  fga: -0.093,
  fta: 1.519,
  ast: 0.781,
  orb: -0.485,
  drb: 0.41,
  stl: 3.049,
  blk: 4.657,
  tov: -0.059,
  ts: 13.06,
  mpg: 0.177,
  bpm: -0.236,
  age: -2.531,
  lvl: 0.592,
};
// League averages per 36 (NBA) and per 40 (amateur), the zero points for the bias adjustments.
const AVG36 = { tpm: 1.4, stl: 1.0, blk: 0.7, drb: 5.2 };
const AVG40 = { tpm: 1.5, stl: 1.3, blk: 0.9, drb: 5.5 };
// What's left to grow, by age (the league's typical gap between a player's level and his peak), and a season's change.
const GROW: Record<number, number> = { 18: 21, 19: 20, 20: 17, 21: 14, 22: 10, 23: 6.5, 24: 4, 25: 2.5, 26: 1.5, 27: 0.6 };
const YEAR: Record<number, number> = {
  19: 4,
  20: 4,
  21: 3.5,
  22: 3,
  23: 2.2,
  24: 1.4,
  25: 0.9,
  26: 0.5,
  27: 0.2,
  28: 0,
  29: -0.3,
  30: -0.7,
  31: -1.2,
  32: -1.7,
  33: -2.2,
};
export const growLeft = (age: number) => (age < 18 ? 22 : (GROW[age] ?? 0));
const yearChange = (age: number) => (age < 19 ? 4 : age > 33 ? -3 : (YEAR[age] ?? 0));

// A player's numbers, as an analytics department sees them: this season and last (NBA, regular season), or his last
// two amateur seasons. Cached per player and day.
interface Nums {
  kind: 'nba' | 'am' | 'none';
  x: Record<string, number>; // rates (per 36 NBA, per 40 amateur) for the most recent sample, the careful blend
  xs: Record<string, number>; // the latest season alone (what a small-sample chaser goes by)
  xp?: Record<string, number>; // the season before it (NBA): what a chaser extrapolates the jump from
  min: number; // minutes behind the blend
  minS: number; // minutes in the latest season
  age: number;
  hot: number; // last five games' Game Score minus his season's (NBA)
}
const NUMS = new WeakMap<object, Map<string, Nums>>();
// A class's college and club lines (amateurStats.ts classStats: box plus/minus is relative to the class), computed
// with the same list the draft board uses so its one-slot memo is shared, and kept here per class.
const AMC = new WeakMap<object, Map<string, Record<number, any[]>>>();
function amLines(g: Game, cls: number, pid: number): any[] {
  const gv = (g.state as any)?.gv || 0,
    base: number[] = (g.db as any).cls?.[cls] || [],
    ids = base.includes(pid) ? base : [...base, pid],
    key = cls + '|' + g.Y + '|' + gv + '|' + ids.length;
  let m = AMC.get(g.db);
  if (!m) AMC.set(g.db, (m = new Map()));
  let v = m.get(key);
  if (!v) {
    v = classStats(g, cls, ids, gv);
    if (m.size > 12) m.clear();
    m.set(key, v);
  }
  return v[pid] || [];
}
function rates(t: any, per: number, kind: 'nba' | 'am') {
  const m = t.min || 1,
    f = per / m,
    x: Record<string, number> = {};
  ['pts', 'tpm', 'fga', 'fta', 'ast', 'orb', 'drb', 'stl', 'blk', 'tov', 'pf'].forEach(k => (x[k] = (t[k] || 0) * f));
  x.ts = t.fga + t.fta ? t.pts / (2 * (t.fga + 0.44 * t.fta)) : 0.5;
  x.mpg = t.gp ? t.min / t.gp : 0;
  if (kind === 'nba') x.gs = t.gp ? (t.gs || 0) / t.gp : 0;
  return x;
}
function seasonTot(p: any, y: number) {
  const t: any = { gp: 0, min: 0 };
  (p.stats || []).forEach((r: any) => {
    if (r.season !== y || r.po) return;
    for (const k in r) if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + r[k];
  });
  return t;
}
export function numsOf(g: Game, p: any): Nums {
  const key = p.id + '|' + g.Y + '|' + ((g.state as any)?.day ?? 0) + '|' + (p.stats || []).length;
  let m = NUMS.get(g.db);
  if (!m) NUMS.set(g.db, (m = new Map()));
  const hit = m.get(key);
  if (hit) return hit;
  let out: Nums = { kind: 'none', x: {}, xs: {}, min: 0, minS: 0, age: p.age, hot: 0 };
  const cur = seasonTot(p, g.Y),
    prev = seasonTot(p, g.Y - 1);
  if (cur.min + prev.min >= 60) {
    // careful blend: last season at half weight
    const b: any = { gp: cur.gp + prev.gp * 0.5, min: cur.min + prev.min * 0.5 };
    for (const k of ['pts', 'tpm', 'fga', 'fta', 'ast', 'orb', 'drb', 'stl', 'blk', 'tov', 'pf', 'gs', 'fgm', 'ftm', 'tpa'])
      b[k] = (cur[k] || 0) + (prev[k] || 0) * 0.5;
    const latest = cur.min >= 60 ? cur : prev,
      before = cur.min >= 60 ? prev : seasonTot(p, g.Y - 2);
    const l5 = p.last5 || [],
      gm5 = l5.length ? l5.reduce((t: number, x: any) => t + x.gmsc, 0) / l5.length : 0,
      gsS = latest.gp
        ? (latest.pts +
            0.4 * (latest.fgm || 0) -
            0.7 * latest.fga +
            latest.stl +
            0.7 * latest.ast +
            0.7 * latest.blk +
            0.7 * latest.orb +
            0.3 * latest.drb -
            latest.tov -
            0.4 * (latest.fta - (latest.ftm || 0)) -
            0.4 * (latest.pf || 0)) /
          latest.gp
        : 0;
    out = {
      kind: 'nba',
      x: rates(b, 36, 'nba'),
      xs: rates(latest, 36, 'nba'),
      ...(before.min >= 300 ? { xp: rates(before, 36, 'nba') } : {}),
      min: b.min,
      minS: latest.min,
      age: p.age,
      hot: l5.length >= 3 ? gm5 - gsS : 0,
    };
  } else {
    const cls = p.cls || p.undrafted;
    if (cls) {
      const st = amLines(g, cls, p.id);
      const ls = st.filter((l: any) => l.gp > 0 && l.disp?.min > 0);
      const L = ls[ls.length - 1],
        P2 = ls[ls.length - 2];
      if (L) {
        const blend = (a: any, b2: any) => {
          const o: any = { gp: a.gp + (b2?.gp || 0) * 0.5, min: a.disp.min + (b2?.disp.min || 0) * 0.5 };
          for (const k of ['pts', 'tpm', 'fga', 'fta', 'ast', 'orb', 'drb', 'stl', 'blk', 'tov', 'pf'])
            o[k] = (a.disp[k] || 0) + (b2?.disp[k] || 0) * 0.5;
          return o;
        };
        const lv = compLevel(p.from).c;
        const x = rates(blend(L, P2), 40, 'am'),
          xs = rates({ ...L.disp, gp: L.gp }, 40, 'am');
        x.mpg = xs.mpg = L.mpg;
        x.bpm = P2 ? ((L.adv?.bpm ?? 0) * 2 + (P2.adv?.bpm ?? 0)) / 3 : (L.adv?.bpm ?? 0);
        xs.bpm = L.adv?.bpm ?? 0;
        x.lvl = xs.lvl = lv;
        x.age = xs.age = p.age;
        out = { kind: 'am', x, xs, min: L.disp.min + (P2?.disp.min || 0) * 0.5, minS: L.disp.min, age: p.age, hot: 0 };
      }
    }
  }
  if (m.size > 3000) m.clear();
  m.set(key, out);
  return out;
}
const dot = (W: Record<string, number>, x: Record<string, number>) =>
  Object.keys(W).reduce((t, k) => t + (k === 'c' ? W.c : W[k] * (x[k] ?? 0)), 0);
const noise = (a: Analyst, pid: number, salt: number) => {
  const r = mulberry32(((a.id * 2654435761) ^ (pid * 40503) ^ (salt * 7919)) >>> 0);
  return r() + r() + r() + r() - 2; // sd ≈ 0.58
};

export interface AnView {
  now: number; // his level now, on the overall scale
  peak: number; // where he'll top out
  next: number; // next season
  kind: 'nba' | 'am';
  conf: 'Low' | 'Medium' | 'High';
}
// One analyst's view of a player (null: no numbers to go on).
export function analystView(g: Game, a: Analyst, p: any): AnView | null {
  const n = numsOf(g, p);
  if (n.kind === 'none') return null;
  const b = a.bias,
    sm = b.small || 0,
    x = sm ? mix(n.x, n.xs, sm) : n.x,
    min = sm ? n.min * (1 - sm) + n.minS * sm : n.min,
    sd = 0.6 + (100 - a.skill) / 16,
    age = n.age;
  let now: number, peak: number;
  const oldF = b.old ? b.old * Math.max(0, age - 29) : 0;
  if (n.kind === 'nba') {
    let raw = dot(NBA_NOW, x);
    // A chaser takes the latest season at face value and extrapolates the jump from the one before.
    if (sm && n.xp) raw += sm * 0.8 * (dot(NBA_NOW, n.xs) - dot(NBA_NOW, n.xp));
    if (b.threes) raw += b.threes * 2.2 * ((x.tpm ?? 0) - AVG36.tpm);
    if (b.noD)
      raw -=
        b.noD *
        (NBA_NOW.stl * ((x.stl ?? 0) - AVG36.stl) + NBA_NOW.blk * ((x.blk ?? 0) - AVG36.blk) + NBA_NOW.drb * ((x.drb ?? 0) - AVG36.drb));
    // A small sample: a careful analyst leans on what his minutes say; a chaser believes it (and the last week).
    const prior = 38 + 0.5 * (x.mpg ?? 0),
      k = 120 * (1 - 0.85 * sm);
    now = prior + (raw - prior) * (min / (min + k)) + sm * 0.35 * n.hot;
    now += noise(a, p.id, g.Y) * sd * 1.7 - oldF * 0.5;
    peak = now + growLeft(age);
  } else {
    const rawN = dot(AM_NOW, x),
      rawP = dot(AM_PEAK, x);
    let adj = 0;
    if (b.threes) adj += b.threes * 2 * ((x.tpm ?? 0) - AVG40.tpm);
    if (b.noD) adj -= b.noD * (AM_PEAK.stl * ((x.stl ?? 0) - AVG40.stl) + AM_PEAK.blk * ((x.blk ?? 0) - AVG40.blk));
    if (b.cbpm) adj += b.cbpm * 0.6 * (x.bpm ?? 0);
    const shrink = min / (min + 150 * (1 - 0.85 * sm)); // a short college season says less
    now = 40 + (rawN + adj * 0.5 - 40) * shrink + noise(a, p.id, g.Y) * sd * 1.6;
    peak = 50 + (rawP + adj - 50) * shrink + noise(a, p.id, g.Y + 7) * sd * 2.2 - oldF;
    peak = Math.max(peak, now);
  }
  const next = n.kind === 'nba' ? now + yearChange(age) - oldF * 0.8 : now + 2;
  return {
    now: Math.round(cl(now, 20, 85) * 10) / 10,
    peak: Math.round(cl(peak, 20, 90) * 10) / 10,
    next: Math.round(cl(next, 20, 88) * 10) / 10,
    kind: n.kind,
    conf: min >= 1200 ? 'High' : min >= 400 ? 'Medium' : 'Low',
  };
}
function mix(a: Record<string, number>, b: Record<string, number>, w: number) {
  const o: Record<string, number> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = (a[k] ?? b[k] ?? 0) * (1 - w) + (b[k] ?? a[k] ?? 0) * w;
  return o;
}
// The department's view: its people weighted (the head counts half again), with each one's own.
export interface DeptView extends AnView {
  by: { a: Analyst; v: AnView }[];
}
const DV = new WeakMap<object, Map<string, DeptView | null>>();
export function deptView(g: Game, s: any, tid: number, p: any): DeptView | null {
  const key = tid + '|' + p.id + '|' + g.Y + '|' + (s.day ?? 0) + '|' + anRev(g) + '|' + (p.stats || []).length;
  let m = DV.get(g.db);
  if (!m) DV.set(g.db, (m = new Map()));
  if (m.has(key)) return m.get(key)!;
  const by = deptOf(g, tid)
    .map(a => ({ a, v: analystView(g, a, p) }))
    .filter(x => x.v) as { a: Analyst; v: AnView }[];
  let out: DeptView | null = null;
  if (by.length) {
    const w = (a: Analyst) => (a.role === 'head' ? 1.5 : 1),
      W = by.reduce((t, x) => t + w(x.a), 0),
      avg = (k: 'now' | 'peak' | 'next') => Math.round((by.reduce((t, x) => t + x.v[k] * w(x.a), 0) / W) * 10) / 10;
    out = { now: avg('now'), peak: avg('peak'), next: avg('next'), kind: by[0].v.kind, conf: by[0].v.conf, by };
  }
  if (m.size > 3000) m.clear();
  m.set(key, out);
  return out;
}
export const hasDept = (g: Game, tid: number) => deptOf(g, tid).length > 0;

// ── Advice ──────────────────────────────────────────────────────────────────────────
// What his contract is worth to them: his projected level next season priced at the league's going rate, against
// what he's paid (or asks), a year.
export function contractValue(g: Game, v: AnView, salary: number) {
  const worth = g.fair(Math.round(v.next));
  return { worth: +worth.toFixed(2), surplus: +(worth - salary).toFixed(2) };
}
// Your team's needs by the numbers (team stats against the league, this season or last), and how he fills them.
const NEEDS: { k: string; label: string; team: (t: any) => number; him: (x: Record<string, number>) => number; def?: boolean }[] = [
  { k: 'tp', label: '3-point shooting', team: t => (t.tpm || 0) / Math.max(1, t.gp), him: x => x.tpm ?? 0 },
  { k: 'reb', label: 'rebounding', team: t => ((t.orb || 0) + (t.drb || 0)) / Math.max(1, t.gp), him: x => (x.orb ?? 0) + (x.drb ?? 0) },
  { k: 'ast', label: 'playmaking', team: t => (t.ast || 0) / Math.max(1, t.gp), him: x => x.ast ?? 0 },
  { k: 'rim', label: 'rim protection', team: t => (t.blk || 0) / Math.max(1, t.gp), him: x => x.blk ?? 0, def: true },
  { k: 'stl', label: 'forcing turnovers', team: t => (t.stl || 0) / Math.max(1, t.gp), him: x => x.stl ?? 0, def: true },
  {
    k: 'eff',
    label: 'efficient scoring',
    team: t => (t.pts || 0) / Math.max(1, 2 * ((t.fga || 0) + 0.44 * (t.fta || 0))),
    him: x => (x.ts ?? 0.5) * 10,
  },
];
export function teamNeeds(g: Game, s: any, tid: number, blindD = false): { k: string; label: string; rank: number }[] {
  const src = (s.tstats && Object.values(s.tstats).some((t: any) => t?.gp >= 5) ? s.tstats : (s.tstatsHist || {})[g.Y - 1]) || {};
  const tids = s.teams.map((t: any) => t.tid).filter((t: number) => src[t]?.gp);
  if (!src[tid]?.gp) return [];
  return NEEDS.filter(n => !(blindD && n.def))
    .map(n => {
      const v = n.team(src[tid]);
      return { k: n.k, label: n.label, rank: 1 + tids.filter((t: number) => n.team(src[t]) > v).length };
    })
    .filter(n => n.rank >= Math.ceil(tids.length * 0.6))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);
}
// How he fills them: his rate in each needed area against the league's typical player's.
const TYP: Record<string, number> = { tp: 1.4, reb: 6.6, ast: 3.3, rim: 0.7, stl: 1.0, eff: 5.6 };
export function fitWith(g: Game, s: any, tid: number, p: any): { fills: string[]; needs: { label: string; rank: number }[] } | null {
  const dept = deptOf(g, tid);
  if (!dept.length) return null;
  const blindD = dept.some(a => a.role === 'head' && (a.bias.noD || 0) >= 0.6);
  const n = numsOf(g, p),
    needs = teamNeeds(g, s, tid, blindD);
  if (n.kind === 'none' || !needs.length) return { fills: [], needs };
  const f = n.kind === 'am' ? 36 / 40 : 1,
    x = n.x;
  const fills = needs
    .filter(nd => {
      const def = NEEDS.find(q => q.k === nd.k)!;
      const v = def.him(x) * (nd.k === 'eff' ? 1 : f);
      return v >= TYP[nd.k] * 1.25;
    })
    .map(nd => nd.label);
  return { fills, needs };
}
// The department's verdict on a trade: projected level next season of what comes in and what goes out, priced, and
// where they disagree with the ratings. Shaped like the Assistant GM's advice (TradeScreen AdviceBox).
export function tradeView(g: Game, s: any, tid: number, give: number[], get: number[]) {
  if (!hasDept(g, tid) || !(give.length + get.length)) return null;
  const P = g.db.P;
  const val = (ids: number[]) =>
    ids.map(id => {
      const p = P[id],
        v = deptView(g, s, tid, p);
      return { p, v, val: v ? contractValue(g, v, g.capHit ? g.capHit(p) : p.amt) : null };
    });
  const ins = val(get),
    outs = val(give);
  const sum = (xs: any[]) => xs.reduce((t, x) => t + (x.val ? x.val.surplus : 0), 0),
    lvl = (xs: any[]) => xs.reduce((t, x) => t + (x.v ? Math.max(0, x.v.next - 40) : 0), 0);
  const dS = sum(ins) - sum(outs),
    dL = lvl(ins) - lvl(outs);
  const tone = dS > 2 && dL > -3 ? 'good' : dS < -2 || dL < -6 ? 'bad' : 'ok';
  const head =
    tone === 'good'
      ? 'The numbers like it: more value for the money.'
      : tone === 'bad'
        ? 'The numbers say you’re giving up more than you get.'
        : 'Close to even by the numbers.';
  const lines: string[] = [];
  [...ins.map(x => ({ ...x, side: 'in' })), ...outs.map(x => ({ ...x, side: 'out' }))].forEach(x => {
    if (!x.v || !x.val) {
      lines.push(x.p.name + ': not enough numbers to judge.');
      return;
    }
    lines.push(
      x.p.name +
        ' (' +
        (x.side === 'in' ? 'in' : 'out') +
        '): projected ' +
        Math.round(x.v.next) +
        ' next season, worth about ' +
        money(Math.max(0, x.val.worth)) +
        ' a year against ' +
        money(x.p.amt) +
        (Math.abs(x.v.next - x.p.ovr) >= 4
          ? ' (rated ' + x.p.ovr + ': they ' + (x.v.next > x.p.ovr ? 'think he’s better' : 'think he’s worse') + ')'
          : '') +
        '.',
    );
  });
  return { tone, head, lines: lines.slice(0, 6) };
}
// Where the department and your scouts (your coaches, for your own players) disagree on his ceiling.
export function disagreement(g: Game, s: any, tid: number, p: any, scoutsPot: number) {
  const v = deptView(g, s, tid, p);
  if (!v) return null;
  const d = v.peak - scoutsPot;
  return Math.abs(d) >= 4 ? { d: Math.round(d), v } : null;
}

// ── Track record ────────────────────────────────────────────────────────────────────
// Where he'll be when the season ends: half of next season's change (young players grow and veterans slip during
// the season too).
export const seasonEnd = (v: AnView) => v.now + (v.next - v.now) * 0.5;
// Opening night: each of your analysts projects the league's regulars (last season's 150 most-used) and your roster.
// Rows [pid, projection × 10, flags: 1 shooter, 2 defender, 4 past 30, 8 small sample].
export function anOpening(g: Game, s: any) {
  const d: any = g.db,
    Y = g.Y;
  if ((d.anProj || {})[Y]) return;
  const mine = new Set<number>((s.managed || [s.me]).flatMap((t: number) => s.rosters[t] || []));
  const all = (Object.values(s.rosters) as number[][])
    .flat()
    .map(id => g.db.P[id])
    .filter(Boolean);
  const byMin = all.map(p => ({ p, m: seasonTot(p, Y - 1).min })).sort((a, b) => b.m - a.m);
  const used = byMin.slice(0, 150).map(x => x.p),
    small = byMin
      .filter(x => x.m >= 150 && x.m < 800)
      .slice(0, 40)
      .map(x => x.p); // small samples, to see who chases them
  const list = [...new Set([...used, ...small, ...all.filter(p => mine.has(p.id))])];
  const team = (s.managed || [s.me])[0];
  const out: Record<number, number[][]> = {};
  deptOf(g, team).forEach(a => {
    out[a.id] = list
      .map(p => {
        const v = analystView(g, a, p);
        if (!v || v.kind !== 'nba') return null;
        const n = numsOf(g, p),
          sw = n.xp ? dot(NBA_NOW, n.xs) - dot(NBA_NOW, n.xp) : 0,
          fl =
            ((n.xs.tpm ?? 0) >= 2.2 ? 1 : 0) |
            ((n.xs.stl ?? 0) + (n.xs.blk ?? 0) >= 2.4 ? 2 : 0) |
            (p.age >= 31 ? 4 : 0) |
            (n.min < 800 ? 8 : 0) |
            (sw >= 3 ? 16 : 0) |
            (sw <= -3 ? 32 : 0);
        return [p.id, Math.round(seasonEnd(v) * 10), fl];
      })
      .filter(Boolean) as number[][];
  });
  d.anProj = { ...(d.anProj || {}), [Y]: out };
}
// The draft: each analyst's board for the class (and your scouts'), kept to grade three seasons later.
export function anDraftBoard(g: Game, s: any) {
  const d: any = g.db,
    cls = s.dClass ?? g.Y;
  if ((d.anDraft || {})[cls]) return;
  const team = (s.managed || [s.me])[0],
    dept = deptOf(g, team);
  if (!dept.length) return;
  const ids = ((d.cls || {})[cls] || []).filter((id: number) => g.db.P[id] && !g.db.P[id].gone);
  const sd = scoutSd(s.budget?.Scouting ?? 4, !!s.easy?.scouting);
  const rec: any = { pids: [], sc: [], bpm: [], an: {} };
  ids.forEach((id: number) => {
    const p = g.db.P[id],
      n = numsOf(g, p);
    rec.pids.push(id);
    rec.sc.push(potView(p, { tid: s.me, sd }));
    rec.bpm.push(Math.round((n.xs.bpm ?? 0) * 10));
  });
  dept.forEach(a => (rec.an[a.id] = ids.map((id: number) => Math.round((analystView(g, a, g.db.P[id])?.peak ?? 0) * 10))));
  d.anDraft = { ...(d.anDraft || {}), [cls]: rec };
}
// The end of the season: grade last opening night's projections against where each player ended up, and draft
// boards three seasons on.
export function anSeasonEnd(g: Game, s: any) {
  const d: any = g.db,
    Y = g.Y,
    A = anDb(g);
  const proj = (d.anProj || {})[Y];
  if (proj) {
    Object.entries(proj).forEach(([aid, rows]: any) => {
      const a = A[+aid];
      if (!a) return;
      const r: AnRec = { y: Y, n: 0, mae: 0, all: 0, sh: [0, 0], df: [0, 0], old: [0, 0], sm: [0, 0], jm: [0, 0] };
      (rows as number[][]).forEach(([pid, e10, fl]) => {
        const p = g.db.P[pid];
        if (!p || p.retired) return;
        const err = e10 / 10 - p.ovr;
        r.n++;
        r.mae += Math.abs(err);
        r.all += err;
        if (fl & 1) ((r.sh[0] += err), r.sh[1]++);
        if (fl & 2) ((r.df[0] += err), r.df[1]++);
        if (fl & 4) ((r.old[0] += err), r.old[1]++);
        if (fl & 8) ((r.sm[0] += Math.abs(err)), r.sm[1]++);
        if (fl & 48) ((r.jm![0] += fl & 16 ? err : -err), r.jm![1]++);
      });
      if (!r.n) return;
      r.mae = +(r.mae / r.n).toFixed(2);
      r.all = +r.all.toFixed(1);
      (['sh', 'df', 'old', 'sm', 'jm'] as const).forEach(k => (r[k] = [+r[k]![0].toFixed(1), r[k]![1]]));
      a.rec = [...(a.rec || []).filter(x => x.y !== Y), r].slice(-12);
      a.rep = anRepOf(g, a);
    });
    delete d.anProj[Y];
  }
  // Draft classes three seasons on: how often each had two players in the right order.
  Object.keys(d.anDraft || {}).forEach(k => {
    const cls = +k;
    if (cls + 3 > Y) return;
    const rec = d.anDraft[cls],
      actual = rec.pids.map((id: number) => g.db.P[id]?.ovr ?? null);
    const conc = (pred: number[]) => {
      let ok = 0,
        n = 0;
      for (let i = 0; i < pred.length; i++)
        for (let j = i + 1; j < pred.length; j++) {
          if (actual[i] == null || actual[j] == null || actual[i] === actual[j] || pred[i] === pred[j]) continue;
          n++;
          if (pred[i] > pred[j] === actual[i] > actual[j]) ok++;
        }
      return n ? ok / n : 0.5;
    };
    const scouts = conc(rec.sc);
    Object.entries(rec.an).forEach(([aid, pred]: any) => {
      const a = A[+aid];
      if (!a) return;
      let bs = 0,
        bn = 0,
        al = 0,
        an = 0;
      rec.pids.forEach((_: number, i: number) => {
        if (actual[i] == null) return;
        const e = pred[i] / 10 - actual[i];
        al += e;
        an++;
        if (rec.bpm[i] >= 60) ((bs += e), bn++);
      });
      a.drec = [
        ...(a.drec || []).filter(x => x.cls !== cls),
        {
          cls,
          n: rec.pids.length,
          hit: +conc(pred).toFixed(3),
          scouts: +scouts.toFixed(3),
          bpm: [+bs.toFixed(1), bn] as [number, number],
          all: an ? +(al / an).toFixed(1) : 0,
        },
      ].slice(-8);
    });
    delete d.anDraft[cls];
  });
  bump(g);
}
// What his record shows (at least 25 players in a group, his errors there a point off his usual).
export function tendencies(a: Analyst): string[] {
  const rec = a.rec || [];
  if (!rec.length) return [];
  const tot = rec.reduce((t, r) => [t[0] + r.all, t[1] + r.n], [0, 0]),
    base = tot[1] ? tot[0] / tot[1] : 0,
    grp = (k: 'sh' | 'df' | 'old') => rec.reduce((t, r) => [t[0] + r[k][0], t[1] + r[k][1]], [0, 0]);
  const out: string[] = [];
  const say = (k: 'sh' | 'df' | 'old', up: string, down: string) => {
    const [sm, n] = grp(k);
    if (n < 25) return;
    const d = sm / n - base;
    if (d >= 1) out.push(up + ' (+' + d.toFixed(1) + ' on average)');
    else if (d <= -1) out.push(down + ' (' + d.toFixed(1) + ' on average)');
  };
  say('sh', 'Overrates shooters', 'Underrates shooters');
  say('df', 'Overrates defenders', 'Underrates defenders');
  say('old', 'Overrates veterans past 30', 'Underrates veterans past 30');
  const sm = rec.reduce((t, r) => [t[0] + r.sm[0], t[1] + r.sm[1]], [0, 0]),
    mae = rec.reduce((t, r) => t + r.mae * r.n, 0) / Math.max(1, tot[1]);
  const jm = rec.reduce((t, r) => [t[0] + (r.jm?.[0] || 0), t[1] + (r.jm?.[1] || 0)], [0, 0]);
  if (jm[1] >= 20 && jm[0] / jm[1] >= 1.8)
    out.push('Overreacts to one big season, up or down (+' + (jm[0] / jm[1]).toFixed(1) + ' in its direction)');
  else if (sm[1] >= 25 && sm[0] / sm[1] >= mae * 1.3) out.push('Misses badly on small samples (off by ' + (sm[0] / sm[1]).toFixed(1) + ')');
  const dr = a.drec || [],
    db2 = dr.reduce((t, r) => [t[0] + r.bpm[0], t[1] + r.bpm[1]], [0, 0]),
    dAll = dr.reduce((t, r) => t + r.all, 0) / Math.max(1, dr.length);
  if (db2[1] >= 8 && db2[0] / db2[1] - dAll >= 2) out.push('Overrates prospects with big college box plus/minus');
  return out;
}
export function recordLine(a: Analyst) {
  const rec = a.rec || [],
    dr = a.drec || [];
  const n = rec.reduce((t, r) => t + r.n, 0),
    mae = n ? rec.reduce((t, r) => t + r.mae * r.n, 0) / n : null,
    hit = dr.length ? dr.reduce((t, r) => t + r.hit, 0) / dr.length : null,
    sc = dr.length ? dr.reduce((t, r) => t + r.scouts, 0) / dr.length : null;
  return { seasons: rec.length, mae, classes: dr.length, hit, scouts: sc };
}

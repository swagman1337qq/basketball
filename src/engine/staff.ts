// Coaches as people (2026-11-15, phase 1): your assistant coaching staff. You are the head coach and GM; you hire
// a Lead Assistant, Assistant Coaches and a Head of Player Development (3 to 6 in all; God Mode: any number).
//  • A coach: name, face, age, nationality (5% are women), personality (ambition, money, loyalty, ego, temper),
//    a playing background (phase 1: a summary; stat lines come in phase 2), and hidden coaching ratings drawn
//    independently of how good a player he was. Reputation is what the league sees: his playing name and years
//    and results in coaching. His style (offense-, defense-minded or balanced) comes from his ratings.
//  • Growth: toward a hidden ceiling with experience (faster on a winning staff), then a plateau. No decline with
//    age; now and then burnout or losing touch costs him a little. He retires from coaching instead.
//  • Your read: before you hire him you see reputation and résumé; his ratings come into focus month by month
//    while he works for you (God Mode: exact).
//  • What a staff does (small by design, at most about 1–2 points per 100 possessions in all):
//    – the Lead Assistant's game management decides how often your staff makes the right in-game reads
//      (it replaces the Coaching budget's number in sim.ts `coach`);
//    – each assistant (the Lead too, at half weight) helps the end of the floor his style points to, with
//      diminishing returns (sim.ts `stO` / `stD`: shot quality for and against);
//    – the Head of Player Development (and everyone's teaching) speeds growth a little (+6% at best); a poor
//      staff slows it and lets skills slip a little each month;
//    – motivation: a small mood factor; eye for talent: how close your staff's read of your players' potential is.
//  • Contracts: 1–5 years, negotiated; paid from the Coaching line in Finances (salaries plus a fixed support
//    staff), with fired coaches paid out to the end of their deals.
// AI teams have staffs too (phase 3, carousel.ts): their coaches replace the owner's Coaching budget. An average
// staff equals the typical budget, so a staff gives no edge by itself.
import type { Game } from './Game';
import { randomName } from '../data/heritage';
import { pickCollege, natDefault } from '../data/world';
import { EUROLEAGUE } from '../data/leagues';
import { firstSeason } from './contracts';
import { addNotice } from './preFA';
import { fmtMoney as money } from './capModel';
import { preserveCoachCareer, storePast, type CoachRow, type Stint } from './coachCareer';
import { fillAiStaffs, payF, supportF } from './carousel';

export type CoachRole = 'lead' | 'asst' | 'dev' | 'hc';
export const ROLE_LABEL: Record<CoachRole, string> = {
  lead: 'Lead Assistant',
  asst: 'Assistant Coach',
  dev: 'Head of Player Development',
  hc: 'Head Coach', // an AI team's head coach (coachCareer.ts); you are your teams' head coach
};
export const ROLE_ORDER: CoachRole[] = ['hc', 'lead', 'asst', 'dev'];
export const STAFF_MIN = 3,
  STAFF_MAX = 6;
export const CR_KEYS = ['off', 'def', 'dev', 'game', 'mot', 'teach', 'eye'] as const;
export type CRKey = (typeof CR_KEYS)[number];
export const CR_LABEL: Record<CRKey, string> = {
  off: 'Offense',
  def: 'Defense',
  dev: 'Player development',
  game: 'Game management',
  mot: 'Motivation',
  teach: 'Teaching',
  eye: 'Eye for talent',
};
const CR_W: Record<CRKey, number> = { off: 0.18, def: 0.18, dev: 0.14, game: 0.16, mot: 0.12, teach: 0.12, eye: 0.1 };
export const CP_LABEL: Record<string, [string, string]> = {
  amb: ['Content', 'Ambitious'],
  money: ['Not about money', 'Money-driven'],
  loyal: ['Wanders', 'Loyal'],
  ego: ['Humble', 'Big ego'],
  temper: ['Even-tempered', 'Hot-tempered'],
};

export interface Coach {
  id: number;
  name: string;
  first: string;
  last: string;
  native?: string;
  fem: boolean;
  nat: string; // nationality (country code)
  race: string;
  born: number; // birth year
  pers: Record<string, number>; // amb, money, loyal, ego, temper (1–99)
  r: Record<CRKey, number>; // hidden coaching ratings (1–99)
  ceil: number; // hidden ceiling of his coaching overall
  rep: number; // reputation 0–100 (visible)
  play: { k: string; yrs: number; where?: string; tier?: number }; // playing background (phase 1 summary)
  since: number; // first season coaching
  coachExpAdj?: number; // former players: explicit God Mode experience offset from recorded coaching seasons
  bg: string; // where he coached before (his last job outside your staff)
  tid: number | null; // the team he coaches for (null: available)
  role: CoachRole | null;
  amt: number; // salary, $M a season
  exp: number; // last season of his contract
  next?: { start: number; amt: number; exp: number }; // signed extension; current terms stay in force until start
  past?: CoachRow[]; // immutable generated coaching seasons before he entered this league (older form; read with pastOf)
  pz?: Stint[]; // the same, kept as stints (coachCareer.ts storePast)
  careerOvr?: number; // ability when his generated career was established
  read: number; // your staff's read of his ratings, 0 (just met) to 1 (fully known)
  raise?: { ask: number; season: number }; // legacy: a mid-contract raise request (removed 2026-11-23; cleared on load)
  sour?: number; // legacy: soured by a refused raise (cleared on load)
  intY?: number; // the season he last interviewed for a step up elsewhere (carousel.ts interviewFor)
  ret?: number; // season he retired from coaching
  pid?: number; // a former player in this league (coachCareer.ts): his playing career is linked
  made?: number; // season he came into view (before it: a generated career, coachCareer.ts)
  h?: number[][]; // a row a season he worked here: [season, team, role code, under you 1/0] (coachCareer.ts); a season
  // split by a mid-season firing adds his own W–L and 1 if he was fired: [..., w, l, fired?] (carousel.ts)
  coy?: number[]; // seasons he was Coach of the Year (head coaches)
  godHeadCoach?: boolean; // explicit God Mode appointment may remain head coach of a managed team
}

// Staff copy follows the coach's saved gender; unrelated player messages are untouched.
export function coachWording(c: Pick<Coach, 'fem'>, text: string): string {
  if (!c.fem) return text;
  const words: Record<string, string> = { he: 'she', his: 'her', him: 'her', himself: 'herself' };
  return text.replace(/\b(he|his|him|himself)\b/gi, word => {
    const replacement = words[word.toLowerCase()];
    return word[0] === word[0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
  });
}
// Older saves stored raise notices as finished sentences. Repair only unambiguous staff notices.
function repairStaffMessages(g: Game, s: any) {
  const coaches = Object.values(coachDb(g));
  for (const m of [...(s.mail || []), ...(s.notices || [])]) {
    const matches = coaches.filter(c => m.title === c.name + ' asks for a raise');
    if (matches.length !== 1 || !matches[0].fem || !Array.isArray(m.lines)) continue;
    m.lines = m.lines.map((line: unknown) =>
      typeof line === 'string' && (line.startsWith('Your ') || line.startsWith('Answer on the Staff screen:'))
        ? coachWording(matches[0], line)
        : line,
    );
  }
}

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const bell = () => Math.random() + Math.random() + Math.random() - 1.5; // about −1.5..1.5, sd 0.5
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const lfOf = (g: Game) => g.CAP / 165; // salaries grow with the cap
export const coachAge = (g: Game, c: Coach) => g.Y - c.born;
// A retired player's years in the available-coach pool are not coaching experience. Use the stored coaching
// seasons (including a completed current season), counting a split season only once. Generated coaches keep
// their existing outside-league careers; their experience model is unchanged.
export function coachedSeasons(g: Game, c: Coach): number {
  const seasons = new Set<number>(),
    last = Math.min(g.Y, c.ret ?? g.Y);
  const add = (y: number) => {
    if (Number.isInteger(y) && y <= last) seasons.add(y);
  };
  c.h?.forEach(r => add(r[0]));
  c.past?.forEach(r => add(r.season));
  c.pz?.forEach(stint => stint[6].forEach((_, i) => add(stint[0] + i)));
  return seasons.size;
}
export function coachYears(g: Game, c: Coach): number {
  if (c.pid == null) return Math.max(0, g.Y - c.since);
  const earned = coachedSeasons(g, c);
  // Before this fix only the God Mode biography editor changed a linked player's starting year. Retain those
  // old explicit edits at migration; afterwards only actual coaching seasons can add to the saved offset.
  const adj = c.coachExpAdj ?? (c.made != null && c.since !== c.made ? Math.max(0, g.Y - c.since) - earned : 0);
  return Math.max(0, earned + adj);
}
export const coachOvr = (c: Coach) => CR_KEYS.reduce((a, k) => a + c.r[k] * CR_W[k], 0);

// ── Store ───────────────────────────────────────────────────────────────────────────
export function coachDb(g: Game): Record<number, Coach> {
  const d: any = g.db;
  if (!d.coaches) d.coaches = {};
  if (!d.coachSeq) d.coachSeq = 1;
  return d.coaches;
}
const bump = (g: Game) => ((g.db as any).staffRev = ((g.db as any).staffRev || 0) + 1);
export const staffRev = (g: Game) => (g.db as any).staffRev || 0;

// ── A new coach ─────────────────────────────────────────────────────────────────────
// Ratings: a coaching talent level, each skill around it; his playing career has nothing to do with it.
// Younger coaches have more room above them. Rarely, a raw coach with an extreme ceiling.
export function mkCoach(g: Game, o: { age?: number; fem?: boolean; play?: string; lvl?: number } = {}): Coach {
  const C = coachDb(g),
    d: any = g.db,
    id = d.coachSeq++;
  const fem = o.fem ?? Math.random() < 0.05;
  const natW = (g.state as any)?.natW || natDefault(),
    tot = Object.values(natW).reduce((a: number, b: any) => a + +b, 0) as number;
  let x = Math.random() * tot,
    nat = 'US';
  for (const [k, w] of Object.entries(natW))
    if ((x -= +(w as number)) <= 0) {
      nat = k;
      break;
    }
  const nm: any = randomName(nat, Math.random, undefined, fem);
  const age = Math.round(o.age ?? cl(44 + bell() * 16, 27, 72));
  const talent = cl(46 + bell() * 18 + (o.lvl ?? 0), 15, 85);
  const r = {} as Record<CRKey, number>;
  CR_KEYS.forEach(k => (r[k] = Math.round(cl(talent + bell() * 18, 8, 96))));
  const years = Math.max(0, Math.min(age - 24, Math.round((age - 26) * (0.5 + Math.random() * 0.5))));
  const ov = CR_KEYS.reduce((a, k) => a + r[k] * CR_W[k], 0);
  const room = Math.max(
    0,
    (Math.random() < 0.04 ? 25 + Math.random() * 20 : Math.random() * 14) * (years < 6 ? 1.3 : years < 15 ? 0.8 : 0.4),
  );
  const play = mkPlay(o.play, fem, nat);
  const c: Coach = {
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
      amb: Math.round(cl(50 + bell() * 40, 1, 99)),
      money: Math.round(cl(50 + bell() * 40, 1, 99)),
      loyal: Math.round(cl(50 + bell() * 40, 1, 99)),
      ego: Math.round(cl(45 + bell() * 40, 1, 99)),
      temper: Math.round(cl(40 + bell() * 40, 1, 99)),
    },
    r,
    ceil: Math.round(Math.min(97, ov + room)),
    rep: 0,
    play,
    since: g.Y - years,
    bg: bgOf(years, nat),
    tid: null,
    role: null,
    amt: 0,
    exp: 0,
    read: 0,
    made: g.Y,
  };
  c.rep = repOf(g, c);
  C[id] = c;
  return c;
}
// His playing days (a summary; phase 2 adds the seasons themselves). Women who played did so in the women's league.
function mkPlay(k0: string | undefined, fem: boolean, nat: string): Coach['play'] {
  const x = Math.random();
  const k =
    k0 ??
    (fem
      ? x < 0.55
        ? 'women'
        : x < 0.85
          ? 'college'
          : 'none'
      : nat !== 'US'
        ? x < 0.5
          ? 'overseas'
          : x < 0.62
            ? 'pro'
            : x < 0.8
              ? 'college'
              : 'none'
        : x < 0.15
          ? 'pro'
          : x < 0.27
            ? 'overseas'
            : x < 0.6
              ? 'college'
              : x < 0.66
                ? 'ccp'
                : x < 0.75
                  ? 'hs'
                  : 'none');
  if (k === 'pro') {
    const t = Math.random();
    return { k, yrs: 2 + Math.floor(Math.random() * 13), tier: t < 0.06 ? 3 : t < 0.3 ? 2 : 1 }; // 3 All-Star, 2 starter, 1 role player
  }
  if (k === 'overseas') return { k, yrs: 2 + Math.floor(Math.random() * 12), where: pick(EUROLEAGUE) };
  if (k === 'college') return { k, yrs: 1 + Math.floor(Math.random() * 4), where: pickCollege() };
  if (k === 'women') return { k, yrs: 2 + Math.floor(Math.random() * 12), tier: Math.random() < 0.1 ? 2 : 1 };
  if (k === 'ccp') return { k, yrs: 1 + Math.floor(Math.random() * 4) };
  if (k === 'hs') return { k, yrs: 4 };
  return { k: 'none', yrs: 0 };
}
function bgOf(years: number, nat: string) {
  if (years <= 0) return 'New to coaching';
  const x = Math.random();
  if (nat !== 'US' && x < 0.6) return 'Coached in Europe (' + pick(EUROLEAGUE) + ')';
  if (years >= 10 && x < 0.35) return 'NBA assistant';
  if (x < 0.55) return 'College assistant (' + pickCollege() + ')';
  if (x < 0.7) return 'CCP league coach';
  if (x < 0.85) return 'High school head coach';
  return 'Coached abroad (' + pick(EUROLEAGUE) + ')';
}
// His playing days in words (phase 1).
export function playLine(c: Coach) {
  const p = c.play,
    s = (n: number) => n + ' season' + (n === 1 ? '' : 's');
  switch (p.k) {
    case 'league':
      return 'Played ' + s(p.yrs) + ' in this league' + (p.tier === 3 ? ' (a star)' : p.tier === 2 ? ' (a starter)' : ' (a role player)');
    case 'pro':
      return (
        'Played ' + s(p.yrs) + ' in the league' + (p.tier === 3 ? ' (an All-Star)' : p.tier === 2 ? ' (a starter)' : ' (a role player)')
      );
    case 'overseas':
      return 'Played ' + s(p.yrs) + ' abroad (' + p.where + ')';
    case 'college':
      return 'Played ' + p.yrs + ' year' + (p.yrs === 1 ? '' : 's') + ' at ' + p.where;
    case 'women':
      return 'Played ' + s(p.yrs) + ' in the women’s league' + (p.tier === 2 ? ' (an All-Star)' : '');
    case 'ccp':
      return 'Played ' + s(p.yrs) + ' in the CCP league';
    case 'hs':
      return 'Played in high school';
    default:
      return 'Never played organized basketball';
  }
}
const PLAY_REP: Record<string, number> = { pro: 10, league: 10, overseas: 6, women: 5, college: 4, ccp: 3, hs: 1, none: 0 };
// Reputation: his playing name (an All-Star's goes a long way at first) and his coaching years and results.
export function repOf(g: Game, c: Coach) {
  const y = coachYears(g, c),
    playR =
      (PLAY_REP[c.play.k] ?? 0) + (c.play.k === 'pro' || c.play.k === 'league' ? ((c.play.tier ?? 1) - 1) * 12 : c.play.tier === 2 ? 6 : 0);
  const known = Math.min(1, y / 8); // the league learns how good a coach he is over the years
  return Math.round(cl(12 + playR + y * 1.3 + (coachOvr(c) - 45) * 0.9 * known + ((c as any).repAdj || 0), 0, 100));
}

// ── Style and your read ─────────────────────────────────────────────────────────────
export function styleOf(c: Coach, r: Record<string, number> = c.r): 'Offense-minded' | 'Defense-minded' | 'Balanced' {
  const d = r.off - r.def;
  return d >= 6 ? 'Offense-minded' : d <= -6 ? 'Defense-minded' : 'Balanced';
}
// A head coach's own way (2026-11-22): the pace he likes, how deep he plays his bench, and the end he puts first (his
// style). About a quarter of coaches each way on pace and depth, seeded by coach, nudged by his ratings: offense-minded
// coaches lean fast, development-minded ones play the bench more. AI teams play it (Game.coachWayFor, coach.ts withWay).
export interface Way {
  pace: number; // −1 slows it down, 0, +1 pushes it
  depth: number; // −1 a tight rotation, 0, +1 a deep bench
  focus: 'Offense first' | 'Defense first' | null;
}
export function coachWay(c: Coach): Way {
  const h = (salt: number) => ((((c.id + 11) * 2654435761) ^ (salt * 40503)) >>> 0) / 4294967296;
  const pv = h(1) + (c.r.off - c.r.def) / 200,
    dv = h(2) + (c.r.dev - 50) / 200,
    st = styleOf(c);
  return {
    pace: pv >= 0.75 ? 1 : pv < 0.25 ? -1 : 0,
    depth: dv >= 0.75 ? 1 : dv < 0.25 ? -1 : 0,
    focus: st === 'Offense-minded' ? 'Offense first' : st === 'Defense-minded' ? 'Defense first' : null,
  };
}
export const wayLabel = (w: Way) =>
  (w.pace > 0 ? 'Pushes the pace' : w.pace < 0 ? 'Slows it down' : 'Average pace') +
  ' · ' +
  (w.depth > 0 ? 'plays a deep bench' : w.depth < 0 ? 'tight rotation' : 'normal rotation');
// Your read of one rating: his true value plus a fixed miss (seeded by coach and rating) that shrinks as you get to know him.
export function readOf(c: Coach, k: CRKey, exact = false): number {
  if (exact) return c.r[k];
  const h = (((c.id * 2654435761) ^ (CR_KEYS.indexOf(k) * 40503)) >>> 0) / 4294967296 - 0.5;
  return Math.round(cl(c.r[k] + h * 36 * (1 - c.read), 1, 99));
}
export const readRatings = (c: Coach, exact = false) =>
  Object.fromEntries(CR_KEYS.map(k => [k, readOf(c, k, exact)])) as Record<CRKey, number>;
export const grade = (v: number) =>
  v >= 85
    ? 'A+'
    : v >= 78
      ? 'A'
      : v >= 71
        ? 'A−'
        : v >= 65
          ? 'B+'
          : v >= 59
            ? 'B'
            : v >= 53
              ? 'B−'
              : v >= 47
                ? 'C+'
                : v >= 41
                  ? 'C'
                  : v >= 35
                    ? 'C−'
                    : v >= 28
                      ? 'D'
                      : 'F';
export const readLabel = (c: Coach) =>
  c.read >= 0.95 ? 'Fully known' : c.read >= 0.6 ? 'Known well' : c.read >= 0.25 ? coachWording(c, 'Getting to know him') : 'Just met';

// ── Your staff ──────────────────────────────────────────────────────────────────────
export function staffOf(g: Game, tid: number): Coach[] {
  return (Object.values(coachDb(g)) as Coach[])
    .filter(c => c.tid === tid && !c.ret)
    .sort((a, b) => ROLE_ORDER.indexOf(a.role!) - ROLE_ORDER.indexOf(b.role!) || b.rep - a.rep);
}
export const freeCoaches = (g: Game) => (Object.values(coachDb(g)) as Coach[]).filter(c => c.tid == null && !c.ret);
// A team runs a staff of people: yours, and from phase 3 (db.staffV 3, carousel.ts) every AI team too.
export const hasStaff = (g: Game, s: any, tid: number) => {
  const v = (g.db as any).staffV;
  return !!v && (v >= 3 || !!g.clubOf(s, tid));
};

export interface StaffFx {
  stO: number; // shot-quality edge on offense (sim.ts)
  stD: number; // shot-quality edge on defense
  q: number; // in-game reads, 0.35–0.95 (sim.ts coach)
  devQ: number; // development, −1 (poor) to 1 (the best)
  mot: number; // mood factor
  eye: number; // read on potential, 0 (poor) to 1
  ptsO: number; // ≈ points per 100 possessions, for the screen
  ptsD: number;
  growth: number; // growth speed, ±share
}
const FX_CACHE = new WeakMap<Game['db'], Map<string, StaffFx>>();
const NEUTRAL: StaffFx = { stO: 0, stD: 0, q: 0.573, devQ: 0, mot: 0, eye: 0.5, ptsO: 0, ptsD: 0, growth: 0 };
// One percentage point of shot quality on every shot is about 1.5 points per 100 possessions at that end
// (measured 2026-11-15: +0.6% → +0.9 on offense, +0.9 on defense, 2,500 games each).
export const PTS_PER_PCT = 150;
export function staffFx(g: Game, s: any, tid: number): StaffFx {
  if (!hasStaff(g, s, tid)) return NEUTRAL;
  const key = tid + '|' + staffRev(g) + '|' + g.Y;
  let cache = FX_CACHE.get(g.db);
  if (!cache) FX_CACHE.set(g.db, (cache = new Map()));
  const hit = cache.get(key);
  if (hit) return hit;
  const fx = fxOf(staffOf(g, tid));
  if (cache.size > 200) cache.clear();
  cache.set(key, fx);
  return fx;
}
// The same from what you know of them (the Staff screen; God Mode: exact).
export const staffFxRead = (g: Game, tid: number, exact: boolean) => fxOf(staffOf(g, tid).map(c => ({ ...c, r: readRatings(c, exact) })));
export function fxOf(st: Coach[]): StaffFx {
  // An AI team's head coach makes the in-game calls (your Lead Assistant does for you), and its Lead Assistant
  // then works like any assistant: the same weights as your staff, where you are the head coach.
  const hc = st.find(c => c.role === 'hc'),
    callRole: CoachRole = hc ? 'hc' : 'lead',
    lead = hc || st.find(c => c.role === 'lead'),
    devH = st.find(c => c.role === 'dev'),
    side: Record<'O' | 'D', number[]> = { O: [], D: [] };
  // Each coach's value at his end of the floor (assistants in full, the one making the calls at half): (rating − 50) / 40.
  st.forEach(c => {
    if (c.role === 'dev') return;
    const w = c.role === callRole ? 0.5 : 1,
      sty = styleOf(c);
    if (sty !== 'Defense-minded') side.O.push(((c.r.off - 50) / 40) * w * (sty === 'Balanced' ? 0.6 : 1));
    if (sty !== 'Offense-minded') side.D.push(((c.r.def - 50) / 40) * w * (sty === 'Balanced' ? 0.6 : 1));
  });
  const DIM = [1, 0.55, 0.3, 0.2, 0.12, 0.08];
  const sum = (a: number[]) => a.sort((x, y) => y - x).reduce((t, v, i) => t + v * (v > 0 ? (DIM[i] ?? 0.05) : 1), 0);
  let stO = cl(0.0035 * sum(side.O), -0.004, 0.007),
    stD = cl(0.0035 * sum(side.D), -0.004, 0.007);
  const pos = Math.max(0, stO) + Math.max(0, stD);
  if (pos > 0.011) {
    const k = 0.011 / pos;
    if (stO > 0) stO *= k;
    if (stD > 0) stD *= k;
  } // all told, at most about 1.6 points per 100 (one end alone about 1)
  const q = lead ? cl(0.573 + (lead.r.game - 50) * 0.012, 0.35, 0.95) : 0.4;
  const teachers = st.filter(c => c.role !== 'dev'),
    teach = teachers.length ? teachers.reduce((a, c) => a + c.r.teach, 0) / teachers.length : 35;
  const head = devH ? devH.r.dev * 0.6 + devH.r.teach * 0.4 : 30;
  const devQ = cl((head * 0.65 + teach * 0.35 - 50) / 25, -1, 1);
  const mot = st.length ? cl((st.reduce((a, c) => a + c.r.mot, 0) / st.length - 50) / 8, -3, 3) : -2;
  const eyes = st.map(c => c.r.eye).sort((a, b) => b - a);
  const eye = cl(((eyes[0] ?? 30) * 0.6 + (eyes[1] ?? eyes[0] ?? 30) * 0.4 - 30) / 50, 0, 1);
  const fx: StaffFx = {
    stO: +stO.toFixed(5),
    stD: +stD.toFixed(5),
    q: +q.toFixed(3),
    devQ: +devQ.toFixed(3),
    mot: Math.round(mot),
    eye: +eye.toFixed(3),
    ptsO: +(stO * PTS_PER_PCT).toFixed(1),
    ptsD: +(stD * PTS_PER_PCT).toFixed(1),
    growth: 0,
  };
  fx.growth = devGrowth(fx.devQ);
  return fx;
}
// The Coaching budget a staff is worth for development (development.ts coachMult): the best staff ≈ $24M (+6%),
// an average one the typical $18M, a poor one down to $5M (−9%, and skills slip: devSlip).
export const devBudgetOf = (devQ: number) => (devQ >= 0 ? 18 + devQ * 6 : 18 + devQ * 13);
const devGrowth = (devQ: number) => (devQ >= 0 ? 0.064 * devQ : 0.09 * devQ);
// The Coaching level for development: your staff's, else the owner's budget.
export function coachingOf(g: Game, s: any, tid: number, budget: number) {
  return hasStaff(g, s, tid) ? devBudgetOf(staffFx(g, s, tid).devQ) : budget;
}
// A poor staff lets skills slip: rating points a player loses a month (0 for a staff at or above −0.3).
export const devSlip = (devQ: number) => (devQ < -0.3 ? ((-devQ - 0.3) / 0.7) * 0.3 : 0);

// ── Money ───────────────────────────────────────────────────────────────────────────
export const SUPPORT = 8; // video, strength and medical support staff, $M at today's cap
export function coachAsk(g: Game, c: Coach, role: CoachRole) {
  const base = 0.35 + 3.0 * Math.pow(c.rep / 100, 1.5),
    rf = role === 'lead' ? 1.35 : role === 'dev' ? 1.1 : 1,
    mf = 0.85 + (c.pers.money / 99) * 0.4;
  return +(base * rf * mf * lfOf(g)).toFixed(2);
}
export const coachPrefYears = (c: Coach) => (c.pers.amb >= 70 ? 2 : c.pers.loyal >= 65 ? 4 : 3);
// Does he take it? His asking price, a little less for a winner if he's ambitious, years far from what he wants cost.
export function coachAccept(g: Game, s: any, tid: number, c: Coach, t: { amt: number; years: number; role: CoachRole }) {
  const wp = teamWp(g, s, tid) ?? 0.5,
    ask = coachAsk(g, c, t.role) * (c.pers.amb >= 65 && wp >= 0.6 ? 0.9 : 1) * (c.tid === tid ? 0.95 - (c.pers.loyal - 50) / 500 : 1);
  const gap = Math.max(0, Math.abs(t.years - coachPrefYears(c)) - 1),
    value = t.amt * (1 - gap * 0.06);
  if (c.role !== 'lead' && t.role === 'asst' && c.tid !== tid && c.rep >= 75 && c.pers.ego >= 70)
    return { ok: false, ask, why: coachWording(c, 'He sees himself as more than an assistant: he wants to be your Lead Assistant.') };
  return {
    ok: value >= ask - 0.005,
    ask: +ask.toFixed(2),
    why:
      value >= ask - 0.005
        ? ''
        : coachWording(c, 'He’s looking for about ') + money(ask) + ' a year' + (gap ? ' over ' + coachPrefYears(c) + ' years' : '') + '.',
  };
}
// The Coaching line in Finances for a team with a staff ($M this season): support staff, salaries, fired coaches still owed.
const COST_CACHE = new WeakMap<Game['db'], Map<string, number>>();
export function staffCost(g: Game, s: any, tid: number) {
  const key = tid + '|' + staffRev(g) + '|' + g.Y + '|' + (g.isUser(s, tid) ? 1 : 0) + '|' + (s.teams[tid]?.arch || '');
  let cache = COST_CACHE.get(g.db);
  if (!cache) COST_CACHE.set(g.db, (cache = new Map()));
  const hit = cache.get(key);
  if (hit != null) return hit;
  const v = staffCostNow(g, s, tid);
  if (cache.size > 300) cache.clear();
  cache.set(key, v);
  return v;
}
function staffCostNow(g: Game, s: any, tid: number) {
  const pay = staffOf(g, tid).reduce((a, c) => a + c.amt, 0),
    dead = ((g.db as any).coachDead?.[tid] || [])
      .filter((x: any) => (x.from ?? -Infinity) <= g.Y && x.thru >= g.Y)
      .reduce((a: number, x: any) => a + x.amt, 0);
  return +(SUPPORT * (g.isUser(s, tid) ? 1 : supportF(s, tid)) * lfOf(g) + pay + dead).toFixed(2); // an AI owner's support staff by his type (carousel.ts)
}
// For the budget scale (Finances multiplies by the cap factor).
export const staffBudget = (g: Game, s: any, tid: number) => +(staffCost(g, s, tid) / lfOf(g)).toFixed(2);

// ── Hiring, roles, firing ───────────────────────────────────────────────────────────
export function staffCheck(g: Game, s: any, tid: number, add: number, god: boolean) {
  const n = staffOf(g, tid).length + add;
  if (god) return '';
  if (n > STAFF_MAX) return 'Your staff is full (' + STAFF_MAX + ' coaches).';
  if (n < STAFF_MIN) return 'You need at least ' + STAFF_MIN + ' coaches.';
  return '';
}
const roleTaken = (g: Game, tid: number, role: CoachRole, except?: number) =>
  role !== 'asst' && staffOf(g, tid).some(c => c.role === role && c.id !== except);
export function hireCoach(
  g: Game,
  s: any,
  tid: number,
  id: number,
  t: { amt: number; years: number; role: CoachRole },
  force = false,
): string {
  const c = coachDb(g)[id];
  if (!c || c.ret) return c ? coachWording(c, 'He isn’t available.') : 'That coach isn’t available.';
  const resign = c.tid === tid;
  if (resign && c.next) return coachWording(c, 'He already has a signed extension.');
  if (roleTaken(g, tid, t.role, id) && !force) return 'You already have a ' + ROLE_LABEL[t.role] + '. Move that coach first.';
  if (resign && t.role !== c.role) return coachWording(c, 'Change his role on your staff before renewing his contract.');
  if (!resign) {
    if (c.tid != null && !force) return coachWording(c, 'He’s under contract with another team.');
    const err = staffCheck(g, s, tid, 1, force);
    if (err) return err;
  }
  if (!force) {
    if (t.years < 1 || t.years > 5) return 'Coaching contracts run 1 to 5 years.';
    const a = coachAccept(g, s, tid, c, t);
    if (!a.ok) return a.why;
  }
  const Y1 = resign ? c.exp + 1 : firstSeason(g, s);
  preserveCoachCareer(g, s, c);
  if (!resign && c.tid != null && c.tid !== tid) detach(g, c);
  if (!resign) c.read = Math.max(c.read, 0.15); // what you saw before hiring him
  const deal = { amt: +t.amt.toFixed(2), exp: Y1 + Math.max(1, Math.round(t.years)) - 1 };
  if (resign) c.next = { start: Y1, ...deal };
  else Object.assign(c, { tid, role: t.role, ...deal });
  delete c.raise;
  if (!resign) c.bg = c.bg || 'New to coaching';
  bump(g);
  return '';
}
// Re-sign: a new deal from the end of the current one.
export const resignCoach = (g: Game, s: any, tid: number, id: number, t: { amt: number; years: number; role: CoachRole }) =>
  hireCoach(g, s, tid, id, t);
function detach(g: Game, c: Coach) {
  c.tid = null;
  c.role = null;
  c.amt = 0;
  c.exp = 0;
  c.read = Math.min(c.read, 0.15);
  delete c.raise;
  delete c.sour;
  delete c.next;
}
// The league year turns at training camp. June renewals leave this year's pay untouched.
function activateExtension(c: Coach, year: number) {
  if (!c.next || c.next.start > year) return;
  Object.assign(c, { amt: c.next.amt, exp: c.next.exp });
  delete c.next;
}
// Fire him: he's paid to the end of his deal (Coaching line in Finances).
export function fireCoach(g: Game, s: any, tid: number, id: number, god = false): string {
  const c = coachDb(g)[id];
  if (!c || c.tid !== tid) return c ? coachWording(c, 'He isn’t on your staff.') : 'That coach isn’t on your staff.';
  const err = staffCheck(g, s, tid, -1, god);
  if (err) return err;
  preserveCoachCareer(g, s, c);
  if (!god && c.exp >= g.Y) {
    const d: any = g.db;
    d.coachDead = d.coachDead || {};
    d.coachDead[tid] = [
      ...(d.coachDead[tid] || []).filter((x: any) => x.thru >= g.Y),
      { name: c.name, amt: c.amt, thru: c.exp },
      ...(c.next ? [{ name: c.name, amt: c.next.amt, from: c.next.start, thru: c.next.exp }] : []),
    ];
  }
  c.bg = 'Assistant, ' + (s.teams[tid]?.region || '') + ' ' + (s.teams[tid]?.name || '');
  detach(g, c);
  bump(g);
  return '';
}
export function setRole(g: Game, s: any, tid: number, id: number, role: CoachRole, god = false): string {
  const c = coachDb(g)[id];
  if (!c || c.tid !== tid) return c ? coachWording(c, 'He isn’t on your staff.') : 'That coach isn’t on your staff.';
  if (roleTaken(g, tid, role, id)) {
    if (!god) return 'Someone already holds that job: move that coach first.';
    staffOf(g, tid)
      .filter(x => x.role === role && x.id !== id)
      .forEach(x => (x.role = 'asst'));
  }
  c.role = role;
  bump(g);
  return '';
}
// God Mode: put any coach on a team (no contract talk; he keeps his salary or takes his asking price).
export function godAppoint(g: Game, s: any, tid: number, id: number, role: CoachRole) {
  const c = coachDb(g)[id];
  if (!c || c.ret) return c ? coachWording(c, 'He isn’t available.') : 'That coach isn’t available.';
  preserveCoachCareer(g, s, c);
  if (c.tid != null && c.tid !== tid) detach(g, c);
  if (role !== 'asst')
    staffOf(g, tid)
      .filter(x => x.role === role && x.id !== id)
      .forEach(x => (x.role = 'asst'));
  Object.assign(c, {
    tid,
    role,
    amt: c.amt || coachAsk(g, c, role),
    exp: c.exp >= g.Y ? c.exp : firstSeason(g, s) + coachPrefYears(c) - 1,
  });
  bump(g);
  return '';
}
export function godNewCoach(g: Game) {
  const c = mkCoach(g);
  preserveCoachCareer(g, g.state, c);
  bump(g);
  return c;
}
export function godEditCoach(g: Game, id: number, patch: Partial<Record<CRKey | 'ceil' | 'rep', number>>) {
  const c = coachDb(g)[id];
  if (!c) return;
  preserveCoachCareer(g, g.state, c);
  Object.entries(patch).forEach(([k, v]) => {
    if (k === 'ceil') c.ceil = cl(Math.round(v as number), 1, 99);
    else if (k === 'rep') (c as any).repAdj = ((c as any).repAdj || 0) + (cl(Math.round(v as number), 0, 100) - c.rep);
    else (c.r as any)[k] = cl(Math.round(v as number), 1, 99);
  });
  c.rep = repOf(g, c);
  bump(g);
}

// ── A new league, or an older save: a pool of coaches and a staff for each of your teams ─────
export const POOL = 120;
export function ensureStaff(g: Game) {
  const d: any = g.db,
    s: any = g.state;
  coachDb(g);
  if (!d.staffV) {
    for (let i = 0; i < POOL; i++) mkCoach(g);
    d.staffV = 1;
    (s.managed || [s.me]).forEach((tid: number) => starterStaff(g, s, tid));
  }
  repairStaffMessages(g, s);
  if (!d.raiseV) {
    clearRaises(g);
    d.raiseV = 1;
  }
  // Phase 2 (2026-11-15): careers. Coaches made before it came into view this season; retirements count from now.
  if (d.staffV < 2) {
    d.coachY0 = d.coachY0 ?? g.Y;
    d.coachPipeY = d.coachPipeY ?? g.Y;
    d.staffV = 2;
  }
  // Phase 3 (2026-11-20, carousel.ts): every AI team gets a staff, made to its owner's money.
  if (d.staffV < 3) {
    d.staffV = 3;
    fillAiStaffs(g, s, { fresh: true });
  }
  Object.values(coachDb(g)).forEach(c => {
    preserveCoachCareer(g, s, c);
    if (c.past) storePast(c, c.past); // older saves: the rows become stints
    if (c.pid != null && c.coachExpAdj == null) {
      c.coachExpAdj = coachYears(g, c) - coachedSeasons(g, c);
      c.rep = repOf(g, c); // discard unearned years, keep playing fame and the existing results / God Mode offset
    }
    activateExtension(c, g.Y);
  });
  bump(g);
}
// The staff a team starts with: ordinary coaches on short deals (an average staff, like the typical budget).
export function starterStaff(g: Game, s: any, tid: number) {
  if (s.spectator || staffOf(g, tid).length) return;
  const roles: CoachRole[] = ['lead', 'asst', 'asst', 'asst', 'dev'];
  roles.forEach((role, i) => {
    let c: Coach | null = null;
    for (let k = 0; k < 40 && !c; k++) {
      const x = mkCoach(g, { age: 34 + Math.floor(Math.random() * 26) });
      const ov = coachOvr(x);
      if (ov >= 44 && ov <= 56) c = x;
      else {
        delete coachDb(g)[x.id];
      }
    }
    c = c || mkCoach(g);
    // the starting staff is matched to the typical budget: its key skill near average
    if (role === 'dev') c.r.dev = Math.round(cl(c.r.dev, 44, 58));
    if (role === 'lead') c.r.game = Math.round(cl(c.r.game, 44, 58));
    c.rep = repOf(g, c);
    Object.assign(c, {
      tid,
      role,
      amt: coachAsk(g, c, role),
      exp: firstSeason(g, s) + 1 + (i % 2),
      read: 0.35,
      bg: c.bg,
    });
    preserveCoachCareer(g, s, c);
  });
}

// ── Monthly and yearly ──────────────────────────────────────────────────────────────
// Every month: you get to know the coaches who work for you.
export function staffMonth(g: Game, s: any) {
  let n = 0;
  (Object.values(coachDb(g)) as Coach[]).forEach(c => {
    if (c.tid != null && !c.ret && g.isUser(s, c.tid) && c.read < 1) {
      c.read = Math.min(1, c.read + 0.09);
      n++;
    }
  });
  if (n) bump(g);
}
// Keeping saves small (2026-11-22): a coach retired five seasons or more who never worked in this league (no
// seasons here, no Coach of the Year, not a former player here) can't be reached from anything in the game, so he's
// let go. Those who did work here stay, with their careers stored as stints (coachCareer.ts storePast); what only
// mattered while they worked (raise requests, extensions, a soured relationship) goes.
export const FORGET_AFTER = 5;
export function forgetRetired(g: Game) {
  const C = coachDb(g);
  (Object.values(C) as Coach[]).forEach(c => {
    if (c.ret == null || g.Y - c.ret < FORGET_AFTER) return;
    if (!(c.h || []).length && !(c.coy || []).length && c.pid == null) {
      delete C[c.id];
      return;
    }
    delete c.raise;
    delete c.next;
    delete c.sour;
    delete (c as any).firedFrom;
  });
}
// A team's league history line for a season (history[].teams, written when the playoffs end).
const histLine = (s: any, Y: number, tid: number) => {
  const lbl = Y - 1 + '–' + String(Y).slice(2);
  return (s.history || []).find((h: any) => h.year === Y || (h.year == null && h.season === lbl))?.teams?.[tid] || null;
};
const pctOf = (w: number, l: number) => (w + l > 0 ? w / (w + l) : null);
// A team's winning percentage: this season once it has played, else last season's from league history (training camp
// and opening night come after every record is reset to 0–0). null when there's none.
export function teamWp(g: Game, s: any, tid: number): number | null {
  const T = s.teams?.[tid];
  if (T && T.w + T.l > 0) return T.w / (T.w + T.l);
  const h = histLine(s, g.Y - 1, tid);
  return h ? pctOf(h.w ?? 0, h.l ?? 0) : null;
}
// How a coach's last season went (2026-11-23): staffYear runs at training camp, after the records are reset, so it read
// every team as 0–0 and a winning staff never grew faster or gained reputation. His own row for that season (coachCareer.ts
// staffSeason: the team he worked for; his part of a season split by a mid-season firing), else his team's history line.
// null if he didn't coach here last season.
export function lastSeasonWp(g: Game, s: any, c: Coach): number | null {
  const Y = g.Y - 1,
    row = (c.h || []).find(r => r[0] === Y);
  if (!row) return null;
  if (row.length > 5) {
    const own = pctOf(row[4], row[5]);
    if (own != null) return own;
  }
  const h = histLine(s, Y, row[1]);
  return h ? pctOf(h.w ?? 0, h.l ?? 0) : null;
}
// Training camp: a year older and wiser (toward his ceiling, faster on a winning staff), now and then burnout,
// retirements, the pool topped up, reputation updated, raise requests. Returns notices for your staff.
export function staffYear(g: Game, s: any): { notices: any[] } {
  const C = coachDb(g),
    notices: any[] = [];
  (Object.values(C) as Coach[]).forEach(c => {
    if (c.ret) return;
    preserveCoachCareer(g, s, c);
    activateExtension(c, g.Y);
    const lastWp = lastSeasonWp(g, s, c), // last season's record, not this camp's 0–0
      wp = lastWp ?? 0.5,
      ov = coachOvr(c);
    // Growth: a share of the room left, more on a winning staff and early in his career.
    const room = c.ceil - ov;
    if (room > 0.5) {
      const rate = (c.tid != null ? 0.16 : 0.1) * (1 + (wp - 0.5)) * (coachYears(g, c) < 8 ? 1.2 : 0.9);
      const add = room * rate * (0.6 + Math.random() * 0.8);
      CR_KEYS.forEach(k => (c.r[k] = Math.round(cl(c.r[k] + add * (0.5 + Math.random()), 1, 99))));
    }
    // Burnout or losing touch: rare, at any age.
    if (Math.random() < 0.02) {
      const ks = [pick([...CR_KEYS]), pick([...CR_KEYS])];
      ks.forEach(k => (c.r[k] = Math.round(cl(c.r[k] - (3 + Math.random() * 5), 1, 99))));
      c.ceil = Math.max(1, c.ceil - 3);
    }
    // Reputation follows his years and how good he is (and a winner gets noticed).
    (c as any).repAdj = ((c as any).repAdj || 0) * 0.9 + (lastWp != null ? (wp - 0.5) * 6 : 0);
    c.rep = repOf(g, c);
    // Retiring from coaching: rarely before 60, more often after, and out of work for years.
    const age = coachAge(g, c),
      idle = c.tid == null ? 1 : 0;
    const pr = 0.01 + Math.max(0, age - 60) * 0.02 + Math.max(0, age - 70) * 0.05 + idle * 0.02;
    if (Math.random() < pr) {
      if (c.tid != null && g.isUser(s, c.tid))
        notices.push({
          tone: 'info',
          title: 'Coach retiring: ' + c.name,
          lines: [c.name + ' (' + ROLE_LABEL[c.role!] + ', ' + age + ') is retiring from coaching.'],
        });
      c.ret = g.Y;
      c.tid = null;
      c.role = null;
      return;
    }
    // No raises in the middle of a contract (2026-11-23): a coach whose reputation has outgrown his salary waits for his
    // deal to end and asks his market price then (coachAccept), or interviews for a step up elsewhere (carousel.ts
    // fillAiStaffs → interviewFor).
  });
  // Keep the pool full: new coaches come in.
  const free = freeCoaches(g).length;
  for (let i = free; i < POOL; i++) mkCoach(g, { age: 27 + Math.floor(Math.random() * 25) });
  fillAiStaffs(g, s, { notices }); // AI staffs whose coaches retired hire again (carousel.ts); your underpaid assistants may interview
  // Retired people remain available to career trees, awards and profile links.
  Object.values(C).forEach(c => preserveCoachCareer(g, s, c));
  forgetRetired(g);
  bump(g);
  return { notices };
}
// Underpaid (2026-11-23): his market price (coachAsk in his role) is at least UNDERPAID × what he makes. He doesn't ask for a
// raise mid-contract; he waits for the deal to end, or interviews for a step up elsewhere (carousel.ts interviewFor).
export const UNDERPAID = 1.3;
export const underpaid = (g: Game, c: Coach) =>
  c.tid != null && !c.ret && !!c.role && c.amt > 0 && coachAsk(g, c, c.role) >= c.amt * UNDERPAID;
// Older saves (2026-11-23): raise requests are gone, and so is the grudge a refused one left (it blocked re-signing).
function clearRaises(g: Game) {
  Object.values(coachDb(g)).forEach(c => {
    delete c.raise;
    delete c.sour;
  });
}
// Pre-Free Agency: whose deals end June 30.
export function staffExpiring(g: Game, s: any): any[] {
  const out: any[] = [];
  (s.managed || [s.me]).forEach((tid: number) => {
    const ex = staffOf(g, tid).filter(c => c.exp <= g.Y && !c.next);
    if (ex.length)
      out.push({
        tone: 'warn',
        title: 'Coaches’ contracts ending',
        lines: [
          ex.map(c => c.name + ' (' + ROLE_LABEL[c.role!] + ')').join(', ') +
            (ex.length === 1 ? '’s contract ends' : '’s contracts end') +
            ' June 30. Re-sign on the Staff screen, or ' +
            (ex.length === 1 ? coachWording(ex[0], 'he leaves') : 'they leave') +
            ' when free agency opens.',
          // What they'll want to stay: their market price now, which can be well above the old deal (2026-11-23).
          ...ex
            .filter(c => coachAsk(g, c, c.role!) > c.amt * 1.1)
            .map(
              c =>
                c.name +
                coachWording(c, ' will want about ') +
                money(coachAsk(g, c, c.role!)) +
                ' a year to stay (paid ' +
                money(c.amt) +
                ' now).',
            ),
        ],
      });
  });
  return out;
}
// Free agency opens: coaches whose deals ran out leave (God Mode: a staff can run short).
export function staffContractsEnd(g: Game, s: any): any[] {
  const out: any[] = [];
  (Object.values(coachDb(g)) as Coach[]).forEach(c => {
    activateExtension(c, g.Y);
    if (c.tid == null || c.ret || c.exp > g.Y) return;
    if (c.next) return; // renewed through the following seasons; activation waits for the year to turn
    preserveCoachCareer(g, s, c);
    const tid = c.tid;
    // An AI team's head coach: renewed or let go after the season (carousel.ts); a deal still open here renews.
    if (c.role === 'hc' && !g.isUser(s, tid)) {
      c.exp = g.Y + 2 + Math.floor(Math.random() * 3);
      return;
    }
    // An AI team's assistant: kept on a new deal more often than not, else he's on the market.
    if (!g.isUser(s, tid) && Math.random() < 0.55 + (c.pers.loyal - 50) / 200) {
      c.amt = +Math.max(c.amt, coachAsk(g, c, c.role!) * payF(s, tid)).toFixed(2);
      c.exp = g.Y + 1 + Math.floor(Math.random() * 3);
      return;
    }
    if (g.isUser(s, tid))
      out.push({
        tone: 'info',
        title: 'Coach gone: ' + c.name,
        lines: [
          c.name + ' (' + ROLE_LABEL[c.role!] + coachWording(c, ') left when his contract ended. Hire a replacement on the Staff screen.'),
        ],
      });
    c.bg = 'Assistant, ' + (s.teams[tid]?.region || '') + ' ' + (s.teams[tid]?.name || '');
    detach(g, c);
  });
  const d: any = g.db;
  if (d.coachDead) Object.keys(d.coachDead).forEach(k => (d.coachDead[k] = d.coachDead[k].filter((x: any) => x.thru > g.Y)));
  if ((d.staffV || 0) >= 3) fillAiStaffs(g, s, { notices: out }); // AI teams replace the assistants who left (carousel.ts)
  bump(g);
  return out;
}
export const notify = (s: any, list: any[]) => list.reduce((n, x) => ({ ...n, notices: addNotice(n, x) }), s).notices;

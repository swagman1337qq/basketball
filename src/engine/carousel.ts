// Coaches, phase 3 (2026-11-20): AI staffs and the coaching carousel.
//  • Every AI team runs a staff of people: a head coach, a Lead Assistant, two Assistant Coaches and a Head of
//    Player Development. Their ratings drive the team the way your staff drives yours (staff.ts fxOf: the head
//    coach makes the in-game calls, as your Lead Assistant does for you), replacing the owner's Coaching budget.
//    Owners pay by type: a win-now spender buys a better-known staff than a frugal owner.
//  • The owner's target, each season: the media's preseason win total for his team (db.preds), with a tolerance by
//    owner type; a win-now owner also wants the playoffs. A head coach is fired only after missing it two seasons
//    in a row (three for a rebuilding team), never sooner, not even when his contract ends. A frugal owner won't pay
//    two head coaches: he lets the contract run out instead.
//  • Hiring: a promoted assistant, a big-name former player hired on his name (sometimes a mistake: teams see
//    reputation, not ratings), a proven veteran, a rising assistant from another staff (your assistants too: a
//    team can't be blocked from offering a head coaching job), or a cheap unknown, weighted by owner type.
//    Assistants under contract can't be hired away as assistants.
//  • A fired head coach may take an assistant's job on a top team (the less ambitious he is, the likelier).
//  • Every AI head coach firing and hiring goes to the Mailbox (one notice per team) and the league log.
import type { Game } from './Game';
import { firstSeason } from './contracts';
import { fmtMoney as money } from './capModel';
import { coachAsk, coachDb, coachWording, mkCoach, repOf, ROLE_LABEL, staffOf, type Coach, type CoachRole } from './staff';
import { headCoachAsk, pastOf, preserveCoachCareer } from './coachCareer';

const bump = (g: Game) => ((g.db as any).staffRev = ((g.db as any).staffRev || 0) + 1);

// The staff an AI team keeps besides its head coach.
export const AI_ROLES: CoachRole[] = ['lead', 'asst', 'asst', 'dev'];
// Owner types: what they pay (× a coach's asking price is what they reach for), how well-known a coach they go
// after, how many missed seasons they sit through, and how they like to hire.
interface OwnerWay {
  pay: number; // reputation they buy: a staff's average reputation centres near 30 + 40 × pay
  tol: number; // wins below the preseason projection that still meet the target
  playoffs: boolean; // a contender has to make the playoffs
  twoCoaches: boolean; // pays a fired head coach and a new one at once
  routes: Record<Route, number>;
}
type Route = 'promote' | 'name' | 'veteran' | 'rising' | 'unknown';
const WAYS: Record<string, OwnerWay> = {
  'Win-Now Spender': {
    pay: 1,
    tol: 3,
    playoffs: true,
    twoCoaches: true,
    routes: { veteran: 0.45, name: 0.2, rising: 0.25, promote: 0.1, unknown: 0 },
  },
  'Hype Focus': {
    pay: 0.75,
    tol: 4,
    playoffs: false,
    twoCoaches: true,
    routes: { name: 0.5, veteran: 0.25, rising: 0.15, promote: 0.1, unknown: 0 },
  },
  'Asset Hoarder': {
    pay: 0.8,
    tol: 5,
    playoffs: false,
    twoCoaches: true,
    routes: { rising: 0.35, promote: 0.3, veteran: 0.2, unknown: 0.15, name: 0 },
  },
  'Meddling Micromanager': {
    pay: 0.55,
    tol: 3,
    playoffs: false,
    twoCoaches: true,
    routes: { promote: 0.3, name: 0.25, veteran: 0.25, unknown: 0.2, rising: 0 },
  },
  'Frugal Profit-Seeker': {
    pay: 0.2,
    tol: 5,
    playoffs: false,
    twoCoaches: false,
    routes: { unknown: 0.45, promote: 0.35, rising: 0.2, veteran: 0, name: 0 },
  },
};
export const ownerWay = (arch?: string): OwnerWay => WAYS[arch || ''] || WAYS['Meddling Micromanager'];
// What an AI owner pays his coaches against their asking prices, and his support staff against yours (staff.ts
// staffCost): a frugal owner's coaching line runs about $15M, a win-now spender's about $25M (the budgets they had).
export const payF = (s: any, tid: number) => 0.7 + 0.6 * ownerWay(s.teams[tid]?.arch).pay;
export const supportF = (s: any, tid: number) => 0.55 + 0.9 * ownerWay(s.teams[tid]?.arch).pay;
const ROUTE_LABEL: Record<Route, string> = {
  promote: 'promoted from his own bench',
  name: 'a big name from his playing days',
  veteran: 'a proven head coach',
  rising: 'a rising assistant',
  unknown: 'a little-known coach',
};

const isAi = (g: Game, s: any, tid: number) => !g.isUser(s, tid);
const aiTeams = (g: Game, s: any) => (s.teams || []).map((t: any) => t.tid).filter((t: number) => isAi(g, s, t));
const free = (g: Game) => (Object.values(coachDb(g)) as Coach[]).filter(c => c.tid == null && !c.ret);
const wasHc = (c: Coach) =>
  (c.h || []).some(r => r[2] === 3) || pastOf(c).some(r => r.role === 'Head Coach' && (r.level === 'NBA' || r.level === 'CCP league'));
const bigName = (c: Coach) => (c.play.k === 'league' || c.play.k === 'pro') && (c.play.tier ?? 1) >= 2;
function pickRoute(w: OwnerWay): Route {
  const es = Object.entries(w.routes) as [Route, number][],
    tot = es.reduce((a, [, v]) => a + v, 0);
  let x = Math.random() * tot;
  for (const [k, v] of es) if ((x -= v) <= 0) return k;
  return es[0][0];
}

// ── Assistants: an AI team fills its staff from coaches without a job ─────────────────
// The owner's money buys reputation (what teams can see); the target sits between 25 and 70, with some luck.
function pickAssistant(g: Game, s: any, tid: number, role: CoachRole): Coach | null {
  const w = ownerWay(s.teams[tid]?.arch),
    want = 25 + 45 * w.pay + (role === 'lead' ? 6 : 0),
    pool = free(g).filter(c => g.Y - c.born >= 27);
  if (!pool.length) return null;
  let best: Coach | null = null,
    bv = -Infinity;
  for (const c of pool) {
    const v = -Math.abs(c.rep - want) + Math.random() * 18;
    if (v > bv) {
      bv = v;
      best = c;
    }
  }
  return best;
}
function sign(g: Game, s: any, c: Coach, tid: number, role: CoachRole, amt: number, years: number) {
  preserveCoachCareer(g, s, c);
  Object.assign(c, { tid, role, amt: +amt.toFixed(2), exp: firstSeason(g, s) + Math.max(1, years) - 1 });
  delete c.next;
  delete c.raise;
  delete c.sour;
}
// Every AI team's staff filled to a Lead Assistant, two assistants and a development head (and at most six).
// `fresh`: a new league's (or an older save's) staffs are made to measure (better coaches for the big spenders).
export function fillAiStaffs(g: Game, s: any, o: { fresh?: boolean } = {}) {
  let n = 0;
  aiTeams(g, s).forEach((tid: number) => {
    const st = staffOf(g, tid).filter(c => c.role !== 'hc');
    const need: CoachRole[] = [];
    const has = (r: CoachRole) => st.filter(c => c.role === r).length;
    if (!has('lead')) need.push('lead');
    for (let i = has('asst'); i < 2; i++) need.push('asst');
    if (!has('dev')) need.push('dev');
    need.forEach(role => {
      if (staffOf(g, tid).length >= 6) return;
      let c: Coach | null = null;
      if (o.fresh) {
        const w = ownerWay(s.teams[tid]?.arch);
        c = mkCoach(g, { age: 32 + Math.floor(Math.random() * 28), lvl: (w.pay - 0.6) * 20 });
        c.rep = repOf(g, c);
      } else c = pickAssistant(g, s, tid, role);
      if (!c) c = mkCoach(g, { age: 30 + Math.floor(Math.random() * 25) });
      sign(g, s, c, tid, role, coachAsk(g, c, role) * payF(s, tid), 1 + Math.floor(Math.random() * 3));
      if (o.fresh) c.exp = firstSeason(g, s) + Math.floor(Math.random() * 3);
      n++;
    });
  });
  if (n) bump(g);
  return n;
}

// ── The owner's target ───────────────────────────────────────────────────────────────
// Projected wins: the media panel's average preseason total (db.preds, locked on opening night).
export function projectedWins(g: Game, tid: number, Y = g.Y): number | null {
  const sp = (g.db as any).preds?.[Y];
  if (!sp?.outlets) return null;
  const ws = Object.values(sp.outlets as Record<string, any>)
    .map((o: any) => o?.wins?.[tid])
    .filter((x: any) => typeof x === 'number') as number[];
  return ws.length ? ws.reduce((a, x) => a + x, 0) / ws.length : null;
}
// Did this season meet his owner's target? With the reason when it didn't.
export function targetMet(g: Game, s: any, tid: number, fin: string): { met: boolean; why: string; proj: number | null } {
  const T = s.teams[tid],
    w = ownerWay(T?.arch),
    proj = projectedWins(g, tid),
    G = T.w + T.l || 82,
    wins = T.w * (82 / G);
  const missedPo = /Missed|play-in/i.test(fin || '');
  if (proj == null) {
    const met = wins >= 30;
    return { met, why: met ? '' : 'won only ' + T.w + ' games', proj };
  }
  if (wins < proj - w.tol) return { met: false, why: 'won ' + T.w + ' games against a preseason projection of ' + Math.round(proj), proj };
  if (w.playoffs && proj >= 44 && missedPo)
    return { met: false, why: 'missed the playoffs with a team projected to win ' + Math.round(proj), proj };
  if (proj >= 52 && /first round/i.test(fin || '') && w.playoffs)
    return { met: false, why: 'went out in the first round with a ' + Math.round(proj) + '-win roster', proj };
  return { met: true, why: '', proj };
}
// How many missed seasons in a row his owner sits through.
export function patience(g: Game, s: any, tid: number, strat?: string) {
  return 2 + (strat === 'rebuild' ? 1 : 0);
}
export const hotSeat = (g: Game, tid: number): number => (g.db as any).hcMiss?.[tid] || 0;

// ── Head coaches: hiring ─────────────────────────────────────────────────────────────
// Candidates for a head coaching job by route. Teams see reputation and résumé, not ratings.
function candidates(g: Game, s: any, tid: number, route: Route, skip: Set<number>): Coach[] {
  const all = (Object.values(coachDb(g)) as Coach[]).filter(c => !c.ret && !skip.has(c.id) && g.Y - c.born >= 30 && g.Y - c.born <= 72);
  const assistantElsewhere = (c: Coach) => c.tid != null && c.tid !== tid && c.role != null && c.role !== 'hc';
  switch (route) {
    case 'promote':
      return all.filter(c => c.tid === tid && (c.role === 'lead' || c.role === 'asst')).sort((a, b) => b.rep - a.rep);
    case 'name':
      return all.filter(c => bigName(c) && (c.tid == null || assistantElsewhere(c))).sort((a, b) => b.rep - a.rep);
    case 'veteran':
      return all.filter(c => wasHc(c) && c.tid == null && c.rep >= 40).sort((a, b) => b.rep - a.rep);
    case 'rising':
      return all.filter(c => assistantElsewhere(c) && c.rep >= 40 && g.Y - c.born <= 58).sort((a, b) => b.rep - a.rep);
    case 'unknown':
      return all.filter(c => c.tid == null && c.rep < 40 && g.Y - c.born <= 55).sort(() => Math.random() - 0.5);
  }
}
// Does he take it? A head coaching job is the one most coaches want: an assistant under contract elsewhere says no
// only if he's very loyal and content where he is.
const takesJob = (c: Coach) => (c.tid == null ? true : Math.random() < 0.85 - (c.pers.loyal >= 80 ? 0.35 : 0) + (c.pers.amb - 50) / 300);
export interface CarouselOut {
  notices: any[];
  log: any[];
}
// Hire a head coach for an AI team. Returns him and how he was found.
export function hireHeadCoach(
  g: Game,
  s: any,
  tid: number,
  out: CarouselOut,
  skip = new Set<number>(),
): { c: Coach; route: Route; from?: number } {
  const w = ownerWay(s.teams[tid]?.arch);
  let route: Route = pickRoute(w),
    c: Coach | undefined;
  for (let tries = 0; tries < 3 && !c; tries++) {
    const list = candidates(g, s, tid, route, skip).slice(0, 8);
    // The owner reaches as far as his money goes: the best-known he can afford, with some luck.
    const cap = 30 + 60 * w.pay;
    c = list
      .filter(x => x.rep <= cap + 10 || route === 'promote')
      .sort((a, b) => b.rep - a.rep + (Math.random() - 0.5) * 20)
      .find(x => takesJob(x));
    if (!c) route = tries === 0 ? (w.routes.veteran ? 'veteran' : 'promote') : 'unknown';
  }
  if (!c) {
    c = mkCoach(g, { age: 38 + Math.floor(Math.random() * 20) });
    route = 'unknown';
  }
  const from = c.tid != null && c.tid !== tid ? c.tid : undefined;
  if (from != null && g.isUser(s, from)) {
    const T = s.teams[tid];
    out.notices.push({
      tone: 'warn',
      title: c.name + ' leaves to be head coach',
      lines: [
        'The ' +
          T.region +
          ' ' +
          T.name +
          ' hired your ' +
          ROLE_LABEL[c.role!] +
          ', ' +
          c.name +
          ', as their head coach. A team can’t be stopped from offering a head coaching job.',
        staffOf(g, from).length - 1 < 3
          ? 'Your staff is down to ' + (staffOf(g, from).length - 1) + ': hire a replacement on the Staff screen.'
          : 'Hire a replacement on the Staff screen if you want one.',
      ],
    });
  }
  preserveCoachCareer(g, s, c);
  sign(g, s, c, tid, 'hc', headCoachAsk(g, c) * (0.85 + 0.3 * w.pay), 2 + Math.floor(Math.random() * 4));
  (g.db as any).hcMiss = { ...((g.db as any).hcMiss || {}), [tid]: 0 };
  bump(g);
  return { c, route, ...(from != null ? { from } : {}) };
}

// A head coach leaves his job (fired, or not renewed): the owner pays out the rest of his deal.
function letGo(g: Game, s: any, c: Coach, tid: number, payOut: boolean) {
  preserveCoachCareer(g, s, c);
  if (payOut && c.exp > g.Y) {
    const d: any = g.db;
    d.coachDead = d.coachDead || {};
    d.coachDead[tid] = [...(d.coachDead[tid] || []).filter((x: any) => x.thru >= g.Y), { name: c.name, amt: c.amt, thru: c.exp }];
  }
  c.bg = 'Head coach, ' + (s.teams[tid]?.region || '') + ' ' + (s.teams[tid]?.name || '');
  (c as any).firedY = g.Y;
  (c as any).firedFrom = tid;
  Object.assign(c, { tid: null, role: null, amt: 0, exp: 0 });
  delete c.next;
}

// ── The carousel: after the season ──────────────────────────────────────────────────────
// Every AI team's season against its owner's target; firings, coaches let go when their deals end, hires, fired
// head coaches joining top staffs as assistants, then the assistants' places filled. Returns Mailbox notices
// (one per team that changed coaches) and league-log lines.
export function carousel(g: Game, s: any, finOf: (tid: number) => string): CarouselOut {
  const out: CarouselOut = { notices: [], log: [] },
    d: any = g.db,
    Y = g.Y;
  if (!d.staffV || d.staffV < 3 || d.carouselY === Y) return out;
  d.carouselY = Y;
  const strat = g.strategies(s.teams, s),
    miss: Record<number, number> = { ...(d.hcMiss || {}) },
    vacant: { tid: number; gone?: Coach; why: string; fired: boolean }[] = [];
  const all = Object.values(coachDb(g)) as Coach[];
  aiTeams(g, s).forEach((tid: number) => {
    const hc = all.find(c => c.tid === tid && c.role === 'hc' && !c.ret);
    if (!hc) {
      vacant.push({ tid, why: '', fired: false });
      return;
    }
    const t = targetMet(g, s, tid, finOf(tid));
    miss[tid] = t.met ? 0 : (miss[tid] || 0) + 1;
    (hc as any).lastMiss = t.met ? undefined : t.why;
    const w = ownerWay(s.teams[tid]?.arch),
      ends = hc.exp <= Y,
      due = miss[tid] >= patience(g, s, tid, strat[tid]);
    // Fired: two missed seasons in a row (three rebuilding). A frugal owner waits for the contract to end.
    if (due && (w.twoCoaches || ends || miss[tid] >= 4)) {
      vacant.push({
        tid,
        gone: hc,
        fired: !ends,
        why:
          (ends ? ' not renewed' : ' fired') +
          ' after missing the owner’s target ' +
          miss[tid] +
          ' seasons running (this year: ' +
          t.why +
          ')',
      });
      letGo(g, s, hc, tid, !ends);
      return;
    }
    // His contract runs out: renewed (one missed season never costs a head coach his job).
    if (ends) {
      hc.amt = +Math.max(hc.amt, headCoachAsk(g, hc) * (0.85 + 0.3 * w.pay)).toFixed(2);
      hc.exp = Y + 2 + Math.floor(Math.random() * 3);
    }
  });
  d.hcMiss = miss;
  // Hires, in random order (the busiest summers see teams compete for the same names).
  const skipOf = (tid: number) => new Set(all.filter(c => (c as any).firedY === Y && (c as any).firedFrom === tid).map(c => c.id));
  vacant
    .sort(() => Math.random() - 0.5)
    .forEach(v => {
      const T = s.teams[v.tid],
        tn = T.region + ' ' + T.name;
      const h = hireHeadCoach(g, s, v.tid, out, skipOf(v.tid));
      const fromT = h.from != null ? s.teams[h.from] : null,
        how =
          h.route === 'promote'
            ? 'promoted from their own bench'
            : fromT
              ? 'hired away from the ' + fromT.region + ' ' + fromT.name + ' bench'
              : ROUTE_LABEL[h.route];
      if (v.gone)
        out.log.push({
          day: s.day,
          type: 'Staff',
          teams: T.abbr,
          text: tn + (v.fired ? ' fired' : ' parted ways with') + ' head coach ' + v.gone.name,
        });
      out.log.push({ day: s.day, type: 'Staff', teams: T.abbr, text: tn + ' hired ' + h.c.name + ' as head coach (' + how + ')' });
      out.notices.push({
        tone: 'info',
        title: 'Coaching change: ' + tn,
        lines: [
          ...(v.gone ? [v.gone.name + coachWording(v.gone, v.why) + '.'] : []),
          'New head coach: ' +
            h.c.name +
            ', ' +
            how +
            ' (reputation ' +
            h.c.rep +
            ', ' +
            money(h.c.amt) +
            ' a year through ' +
            h.c.exp +
            ').',
        ],
      });
    });
  // Fired head coaches who'd rather work than wait: an assistant's job on a top team, the less ambitious the likelier.
  const top = aiTeams(g, s)
    .slice()
    .sort((a: number, b: number) => g.pct(s.teams[b]) - g.pct(s.teams[a]))
    .slice(0, 8);
  all
    .filter(c => (c as any).firedY === Y && c.tid == null && !c.ret)
    .forEach(c => {
      if (Math.random() >= 0.55 - c.pers.amb / 220) return;
      const tid = top.find((t: number) => staffOf(g, t).length < 6 && (c as any).firedFrom !== t);
      if (tid == null) return;
      const lead = staffOf(g, tid).find(x => x.role === 'lead'),
        role: CoachRole = lead && lead.rep < c.rep ? 'lead' : 'asst';
      if (role === 'lead' && lead) lead.role = 'asst';
      sign(g, s, c, tid, role, coachAsk(g, c, role) * payF(s, tid), 1 + Math.floor(Math.random() * 2));
      out.log.push({
        day: s.day,
        type: 'Staff',
        teams: s.teams[tid].abbr,
        text: s.teams[tid].region + ' ' + s.teams[tid].name + ' added former head coach ' + c.name + ' as ' + ROLE_LABEL[role],
      });
    });
  fillAiStaffs(g, s);
  bump(g);
  return out;
}

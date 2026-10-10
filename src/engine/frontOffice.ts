// Front office: finances, owner expectations and firing, the job market, press quotes,
// contract incentives (with likely/unlikely cap accounting), stat-padding dilemmas and
// owner-mandated fire sales. Everything the owner judges you on is computed here and
// shown in full on the Owner, Finances and Career screens: no hidden rules.
import type { Game } from './Game';
import { fmtMoney } from './capModel';
import { capState, rosterMin, seasonMax, stdIds, taxBill as cbaTax, teamSalary } from './cba';
import { contractDecision, gmSalary } from './gmCareer';
import { addTx, recordTrade } from './txlog';
import { namePools, OWNER_ARCHETYPES, OWNER_SURNAMES } from '../data/world';
import { bgByKey, kindOf, saleBg } from './owners';
import { teamBudget } from './environment';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
export const DEFAULT_BUDGET = { Coaching: 18, Health: 10, Facilities: 14, Scouting: 4, Tickets: 118 };
export const money = fmtMoney;

// ── Finances ─────────────────────────────────────────────────────────────────────
// Local revenue (tickets, local media, sponsorship, merchandise): what revenue sharing is based on.
function localOf(g: Game, s: any, tid: number) {
  const T = s.teams[tid], club = g.clubOf(s, tid), b = club ? club.budget : aiBudget(g, s, tid);
  const mk = T.mkt, wp = demandWp(g, T), cap = T.arenaCap || 18800, lf = g.CAP / 165; // league revenue grows with the cap
  const att = attendanceAt(g, T, b);
  const tix = (b.Tickets * att * 41) / 1e6;
  const parts: [string, number][] = [['Ticket sales', tix * lf], ['Local media', 34.0 * Math.pow(mk, 1.5) * lf], ['Sponsorship & naming', 48.0 * mk * lf], ['Merchandise', 22 * mk * (0.8 + wp * 0.4) * lf]];
  return { b, att, cap, tix, lf, parts, total: parts.reduce((a, p) => a + p[1], 0) };
}

// An AI club's budget: its owner's staff and building budgets (environment.ts) and the ticket price
// he sets (aiTicketPrice).
export function aiBudget(g: Game, s: any, tid: number) {
  const b = teamBudget(g, s, tid), fac = b.Facilities ?? DEFAULT_BUDGET.Facilities;
  return { ...DEFAULT_BUDGET, ...b, Tickets: aiTicketPrice(g, s, tid, fac) };
}

// How each owner type prices tickets: the share of seats he wants filled. A frugal owner charges what
// brings in the most ticket money and lives with empty seats; a hype-focused owner prices to pack the
// building; a meddler goes with his gut. Prices follow demand: market size and how good the team is
// (in season its record, weighed more as games pile up, like dynamic pricing).
const FILL: Record<string, number> = { 'Frugal Profit-Seeker': 0.88, 'Win-Now Spender': 0.94, 'Asset Hoarder': 0.94, 'Meddling Micromanager': 0.93, 'Hype Focus': 0.99 }; // NBA arenas run about 95% full
export function aiTicketPrice(g: Game, s: any, tid: number, fac = DEFAULT_BUDGET.Facilities) {
  const T = s.teams[tid], mk = T.mkt || 1, h = (x: number) => ((((tid + 1) * 2654435761) ^ (x * 40503)) >>> 0) % 1000 / 1000 - 0.5;
  const wp = demandWp(g, T);
  const fill = (FILL[T.arch] ?? 0.9) + (T.arch === 'Meddling Micromanager' ? h(7) * 0.08 : 0);
  // Attendance (attendanceAt) = demand − 55 × (price − 110) / market. Price that fills `fill` of the seats,
  // and the price that brings in the most ticket money; he charges the lower of the two.
  const demand = 18800 + (wp - 0.5) * 9000 + (fac - 14) * 80 + (mk - 1) * 3000;
  const atFill = 110 + (demand - fill * 18800) * mk / 55, best = (demand + 110 * 55 / mk) * mk / 110;
  return Math.round(cl(Math.min(atFill, best) * (1 + h(3) * 0.12), 35, 300)); // plus his own pricing quirks (±6%)
}

// How good fans think the team is: .500 before the season, then its record, weighed fully from game 30
// (a 0–0 team used to count as winless, so every preseason projection read as an empty arena).
export const demandWp = (g: Game, T: any) => { const gp = (T.w || 0) + (T.l || 0); return 0.5 + (g.pct(T) - 0.5) * Math.min(1, gp / 30); };

// Fans per game at a given ticket price and facilities budget.
function attendanceAt(g: Game, T: any, b: any) {
  const mk = T.mkt, wp = demandWp(g, T), cap = T.arenaCap || 18800;
  return cl(Math.round((cap / 18800) * (18800 - ((b.Tickets - 110) * 55) / mk + (wp - 0.5) * 9000 + (b.Facilities - 14) * 80 + (mk - 1) * 3000)), 9000 * (cap / 18800), cap);
}

// Auto budget: what a sensible front office would set. Spending scales with the club's local
// revenue against the rest of the league (the richest clubs spend about 1.45x the default, the
// poorest 0.55x, the same spread as the AI teams), then the owner and the roster nudge it: a
// frugal owner spends 20% less and a win-now owner 15% more, a hype-focused owner puts more in
// facilities, a rebuilding team scouts more and a contender less, a young roster gets more
// coaching. The ticket price is the one that brings in the most ticket money while keeping the
// arena at least 80% full (below that the owner calls the empty seats a message; a hype-focused
// owner wants 90%). If no price fills it that much, the one that makes the most money.
export const BUDGET_KEYS = ['Tickets', 'Coaching', 'Health', 'Facilities', 'Scouting'];
export function autoBudget(g: Game, s: any, tid: number, k: string, b: any = g.clubOf(s, tid)?.budget || aiBudget(g, s, tid)): number {
  const [mn, mx, df, stp] = g.db.BUD[k], T = s.teams[tid], arch = T.arch;
  const snap = (v: number) => +cl(Math.round(v / stp) * stp, mn, mx).toFixed(2);
  if (k === 'Tickets') {
    const cap = T.arenaCap || 18800, floors = arch === 'Hype Focus' ? [0.9, 0.7, 0] : [0.8, 0];
    for (const f of floors) {
      let best = -1, bestRev = -1;
      for (let p = mn; p <= mx; p += stp) { const att = attendanceAt(g, T, { ...b, Tickets: p }); if (att / cap >= f && p * att > bestRev) { bestRev = p * att; best = p; } }
      if (best >= 0) return snap(best);
    }
    return mn;
  }
  const loc = s.teams.map((t: any) => localOf(g, s, t.tid).total), mine = loc[s.teams.findIndex((t: any) => t.tid === tid)];
  const rank = loc.filter((v: number) => v > mine).length, n = Math.max(2, loc.length);
  let f = 1.45 - 0.9 * rank / (n - 1);
  if (arch === 'Frugal Profit-Seeker') f *= 0.8; else if (arch === 'Win-Now Spender') f *= 1.15;
  if (k === 'Facilities' && arch === 'Hype Focus') f *= 1.2;
  if (k === 'Scouting' || k === 'Coaching') {
    const sc = (t: any) => g.pct(t) * 0.65 + (t.str - 45) / 12 * 0.35, place = s.teams.slice().sort((a: any, c: any) => sc(c) - sc(a)).findIndex((t: any) => t.tid === tid);
    if (k === 'Scouting') f *= place >= 20 ? 1.3 : place < 9 ? 0.85 : 1;
    const ids = s.rosters?.[tid] || [], age = ids.length ? ids.reduce((a: number, id: number) => a + (g.db.P[id]?.age || 27), 0) / ids.length : 27;
    if (k === 'Coaching' && age < 25.5) f *= 1.1;
  }
  return snap(df * f);
}
// The club's budget with every category on auto set to its recommended value.
export function applyAutoBudget(g: Game, s: any, tid: number, b: any, auto: Record<string, boolean> = {}) {
  const out = { ...b };
  [...BUDGET_KEYS.slice(1), 'Tickets'].forEach(k => { if (auto[k]) out[k] = autoBudget(g, s, tid, k, out); }); // tickets last: the price depends on facilities
  return out;
}

// Revenue sharing, modeled on the NBA's: about $400M a year (at today's cap) goes to teams
// below the league's average local revenue, most to the smallest markets (the top recipients
// get about $40–45M, around 20 teams receive something). Half of the league's luxury-tax
// payments fund it; teams well above average local revenue pay the rest, the biggest markets
// the most. A recipient that doesn't fill its arena has its payment cut (up to 25%), like the
// CBA's revenue-generation requirements. Positive = received, negative = paid.
export function revenueSharing(g: Game, s: any, tid: number) {
  const L = s.teams.map((t: any) => localOf(g, s, t.tid)), tot = L.map((x: any) => x.total), avg = tot.reduce((a: number, v: number) => a + v, 0) / tot.length, lf = g.CAP / 165;
  const need = tot.map((v: number) => Math.max(0, avg * 1.02 - v)), over = tot.map((v: number) => Math.pow(Math.max(0, v - avg * 1.05), 0.6));
  const needSum = need.reduce((a: number, v: number) => a + v, 0) || 1, overSum = over.reduce((a: number, v: number) => a + v, 0) || 1;
  const fill = (x: any) => cl(1 - Math.max(0, 0.85 - x.att / x.cap) * 1.25, 0.75, 1);
  const pool = 400 * lf, got = need.map((v: number, i: number) => Math.min(45 * lf, pool * v / needSum) * fill(L[i])), paid = got.reduce((a: number, v: number) => a + v, 0);
  const taxHalf = 0.5 * s.teams.reduce((a: number, t: any) => { const h = (s.cap?.[t.tid]?.taxHist) || []; return a + cbaTax(g, teamSalary(g, s, t.tid), h.slice(-4).filter(Boolean).length >= 3); }, 0);
  const fromTeams = Math.max(0.3 * paid, paid - taxHalf), i = s.teams.findIndex((t: any) => t.tid === tid);
  return got[i] > 0 ? got[i] : -fromTeams * over[i] / overSum;
}

// ── Finances ─────────────────────────────────────────────────────────────────────
export function financesOf(g: Game, s: any, tid: number) {
  const T = s.teams[tid], { b, att, cap, tix, lf, parts } = localOf(g, s, tid);
  const payroll = teamSalary(g, s, tid);
  // Repeater: a taxpayer in at least three of the previous four seasons.
  const club = g.clubOf(s, tid), taxHist = (s.cap?.[tid]?.taxHist) || club?.taxHist || [];
  const repeater = taxHist.slice(-4).filter(Boolean).length >= 3;
  const taxBill = Math.max(0, cbaTax(g, payroll, repeater) + (T.taxAdj || 0));
  void capState;
  const share = revenueSharing(g, s, tid);
  const rev: [string, number][] = [parts[0], ['National media rights', 152.0 * lf], ...parts.slice(1)];
  if (share > 0.05) rev.push(['Revenue sharing received', share]);
  if (payroll <= g.TAX) rev.push(['Tax distribution (est.)', 11.5 * lf]);
  const dead = s.cap?.[tid]?.dead?.reduce((a, d) => a + (d.amts?.[g.Y] || 0), 0) || 0;
  const exp: [string, number][] = [...(share < -0.05 ? [['Revenue sharing paid', -share] as [string, number]] : []), ['Player payroll', payroll - dead - (T.capAdj || 0)], ...(dead ? [['Dead money (waived players)', dead] as [string, number]] : []), ...(T.capAdj ? [['Payroll adjustment (God Mode)', T.capAdj] as [string, number]] : []), ...(payroll < g.MINP ? [['Salary-floor shortfall (paid to players)', g.MINP - payroll] as [string, number]] : []), ...(taxBill ? [[repeater ? 'Luxury tax (repeater rates)' : 'Luxury tax', taxBill] as [string, number]] : []), ['Arena & game operations', 55.0 * lf], ['Front office & staff', 25.0 * lf], ['Team travel', 9.0 * lf], ...(share > 0 ? [['Revenue sharing paid', share] as [string, number]] : []), ...(club?.buyoutCash ? [['Overseas buyouts', club.buyoutCash] as [string, number]] : []), ...(club?.bonusPaid ? [['Incentive bonuses paid', club.bonusPaid] as [string, number]] : []), ['Coaching', b.Coaching * lf], ['Health', b.Health * lf], ['Facilities', b.Facilities * lf], ['Scouting', b.Scouting * lf]];
  const net = rev.reduce((a, r) => a + r[1], 0) - exp.reduce((a, r) => a + r[1], 0);
  return { payroll, att, cap, full: att / cap, tix, taxBill, repeater, rev, exp, net, budget: b };
}

// ── Owner expectations ───────────────────────────────────────────────────────────
export const OWNER_DESC: Record<string, string> = {
  'Win-Now Spender': 'Wants a contender now and will pay for it, up to the 2nd apron.',
  'Frugal Profit-Seeker': 'Expects a profit every season and will not pay the luxury tax.',
  'Asset Hoarder': 'Protects draft picks and young talent; hates giving up firsts.',
  'Hype Focus': 'Cares about buzz: a full arena and a marquee star.',
  'Meddling Micromanager': 'Second-guesses moves and insists his favorite player starts.',
};
// Firing conditions: real, but not hair-trigger. Nobody is fired after their first season with a club.
export const OWNER_FIRE: Record<string, string[]> = {
  'Win-Now Spender': ['Missing the playoffs three seasons in a row', 'Job security below 10'],
  'Frugal Profit-Seeker': ['Losing more than $5M three seasons in a row', 'Paying the luxury tax two seasons in a row, or a tax bill over $25M', 'Job security below 10'],
  'Asset Hoarder': ['Holding no first-round picks at all at season’s end', 'Job security below 10'],
  'Hype Focus': ['Attendance under 70% for a full season', 'Job security below 10'],
  'Meddling Micromanager': ['Benching his favorite player for 35+ games', 'Job security below 10'],
};

export function ownerFavorite(g: Game, s: any, tid: number) {
  const P = g.db.P;
  return s.rosters[tid].slice().sort((x, y) => P[y].pot - P[x].pot)[0];
}

export function ownerReview(g: Game, s: any, tid: number) {
  const T = s.teams, me = T[tid], P = g.db.P, ids = s.rosters[tid];
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  const fin = financesOf(g, s, tid), payroll = fin.payroll;
  const confT = T.filter(t => t.conf === me.conf).sort((a, b) => g.pct(b) - g.pct(a) || b.w - a.w), seed = confT.indexOf(me) + 1;
  const usedPick = a => a.yr === g.Y && s.picks.some(x => x.orig === a.orig && (x.rd || 1) === a.rd && x.pid);
  const firsts = s.assets.filter(a => a.owner === tid && a.rd === 1 && !usedPick(a)).length;
  const avgAge = ids.reduce((a, id) => a + P[id].age, 0) / Math.max(1, ids.length), bestOvr = Math.max(...ids.map(id => P[id].ovr));
  const fav = ownerFavorite(g, s, tid), favBench = (s.favBench || {})[tid] || 0;
  const pctS = t => g.pct(t).toFixed(3).replace(/^0/, '');
  const st3 = (ok, risk) => (ok ? 'Met' : risk ? 'At risk' : 'Failing');
  const DEM: Record<string, [string, string, string][]> = {
    'Win-Now Spender': [['Make the playoffs (top 6, or through the play-in)', ord(seed) + ' in the ' + me.conf, st3(seed <= 6, seed <= 10)], ['Keep payroll under the 2nd apron', money(payroll), st3(payroll <= g.AP2, false)]],
    'Frugal Profit-Seeker': [['Turn a profit of at least $10M', money(fin.net), st3(fin.net >= 10, fin.net >= 0)], ['Stay under the luxury tax', money(payroll), st3(payroll <= g.TAX, false)], ['Win at least 40% of games', pctS(me), st3(g.pct(me) >= 0.4, g.pct(me) >= 0.35)]],
    'Asset Hoarder': [['Hold 4+ first-round picks across the next 3 drafts', String(firsts), st3(firsts >= 4, firsts === 3)], ['Keep the roster’s average age at 27 or under', avgAge.toFixed(1), st3(avgAge <= 27, avgAge <= 28)]],
    'Hype Focus': [['Fill 90% of the arena', Math.round(fin.full * 100) + '%', st3(fin.full >= 0.9, fin.full >= 0.8)], ['Roster a star rated 65+', String(bestOvr), st3(bestOvr >= 65, bestOvr >= 62)]],
    'Meddling Micromanager': [['Start ' + (P[fav]?.name || 'his favorite'), (ids.indexOf(fav) < 5 ? 'Starting' : 'Bench') + ' · benched ' + favBench + ' games', st3(ids.indexOf(fav) < 5 && favBench < 10, favBench < 20)], ['Win at least half your games', pctS(me), st3(g.pct(me) >= 0.5, g.pct(me) >= 0.45)]],
  };
  const ceiling = g.teamCeiling(me), god = !!s.god;
  const demands = DEM[me.arch].slice();
  const mandate = (g.clubOf(s, tid)?.inbox || []).find(x => x.kind === 'mandate' && !x.resolved);
  if (payroll > ceiling && !god) demands.push(['Owner mandate: get payroll under ' + money(ceiling) + (mandate ? ' by ' + g.fmtS(mandate.deadline) : ''), money(payroll), 'Failing']);
  const fails = (s.mandateFails || {})[tid] || 0;
  const LIM: Record<string, string[]> = {
    'Win-Now Spender': ['Payroll ceiling: ' + money(ceiling) + ' (2nd apron)', 'No profit requirement'],
    'Frugal Profit-Seeker': ['Payroll ceiling: ' + money(ceiling) + ' (tax line)', 'Minimum profit: $10.0M'],
    'Asset Hoarder': ['Payroll ceiling: ' + money(ceiling) + ' (1st apron)', 'Needs approval to trade any first-round pick'],
    'Hype Focus': ['Payroll ceiling: ' + money(ceiling), 'Ticket price may not drop below $90'],
    'Meddling Micromanager': ['Payroll ceiling: ' + money(ceiling), 'Signs off on every trade'],
  };
  // God Mode: the owner has no power over you. Your job is never in question, whatever the record or the books say.
  const sec = god ? 100 : Math.round(cl(62 + (g.pct(me) - 0.5) * 80 + demands.reduce((a, d) => a + (d[2] === 'Met' ? 6 : d[2] === 'At risk' ? -4 : -10), 0) - fails * 8, 0, 100));
  return { owner: me.owner, arch: me.arch, desc: OWNER_DESC[me.arch], sec, demands, limits: LIM[me.arch], fire: OWNER_FIRE[me.arch], fin, firsts, favBench, ceiling, god, label: god ? 'God Mode' : sec >= 70 ? 'Secure' : sec >= 40 ? 'Stable' : sec >= 20 ? 'Warm seat' : 'Hot seat' };
}

// End-of-season firing check against the owner's written conditions.
export function fireReasons(g: Game, s: any, tid: number, rv: ReturnType<typeof ownerReview>, finThis: string) {
  const out: string[] = [], hist = (s.teamHist || {})[tid] || [], last = hist[hist.length - 1], prev2 = hist.slice(-2);
  // A honeymoon: your first season running this club never ends in a firing.
  if (!(s.career?.seasons || []).some((x: any) => x.tid === tid)) return out;
  // ...and a new owner gives you his first full season before judging you.
  if (s.teams[tid].ownerSince === g.Y) return out;
  const missed = f => f === 'Missed the playoffs' || f === 'Lost in the play-in';
  if (rv.sec < 10) out.push('Job security fell to ' + rv.sec);
  if (rv.arch === 'Win-Now Spender' && missed(finThis) && prev2.length === 2 && prev2.every(x => missed(x.fin))) out.push('Missed the playoffs three seasons in a row');
  if (rv.arch === 'Frugal Profit-Seeker') {
    if (rv.fin.net < -5 && prev2.length === 2 && prev2.every(x => x.net < -5)) out.push('Lost money three seasons in a row');
    if (rv.fin.taxBill > 25) out.push('Paid a luxury tax bill of ' + money(rv.fin.taxBill)); else if (rv.fin.taxBill > 0 && (last?.tax || 0) > 0) out.push('Paid the luxury tax two seasons in a row');
  }
  if (rv.arch === 'Asset Hoarder' && rv.firsts < 1) out.push('Held no first-round picks');
  if (rv.arch === 'Hype Focus' && rv.fin.full < 0.7) out.push('Attendance under 70% for the season');
  if (rv.arch === 'Meddling Micromanager' && rv.favBench >= 35) out.push('Benched the owner’s favorite for ' + rv.favBench + ' games');
  return out;
}

// ── Career & job market ──────────────────────────────────────────────────────────
export function reputation(s: any) {
  // Starts from your experience (set when you create your GM); your record here takes over as the seasons pile up.
  const c = s.career || { seasons: [] }, ss = c.seasons || [], base = c.repBase ?? 50;
  if (!ss.length) return base;
  const wp = ss.reduce((a, x) => a + x.w / Math.max(1, x.w + x.l), 0) / ss.length;
  const titles = ss.filter(x => x.fin === 'Won the title').length, apps = ss.filter(x => !/Missed|play-in/.test(x.fin)).length;
  const perf = 50 + (wp - 0.5) * 120 + titles * 8 + apps * 2 + (c.coy || 0) * 4 - (c.fired || 0) * 12, n = ss.length;
  return Math.round(cl((base * 3 + perf * n) / (3 + n) + (perf > 50 ? titles * 2 : 0), 0, 100));
}
const teamNeed = (g: Game, s: any, tid: number) => { const P = g.db.P, o = s.rosters[tid].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); const top8 = o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); return 35 + (top8 - 50) * 1.8 + (s.teams[tid].mkt - 1) * 20; };
// What a hiring owner offers ($M a year): set by your reputation and by what kind of owner he is.
function contractOptions(s: any, tid: number, rep: number) {
  const base = gmSalary(rep, s.teams[tid].arch, 65);
  return [{ years: 2, salary: +(base * 1.1).toFixed(2) }, { years: 3, salary: +base.toFixed(2) }, { years: 5, salary: +(base * 0.9).toFixed(2) }].map(o => ({ ...o, tid }));
}

// ── Season-end review: incentives, owner verdicts, career record, job market ───────
export function seasonReview(g: Game) {
  if (g.mailWaiting()) return;
  g.setState(s => {
    if (s.phase !== 'playoffs' || !s.po || s.po.champ == null || s.reviewed === g.Y) return null;
    const P = g.db.P, T = s.teams, Y = g.Y, news = (s.news || []).slice(), lgLog = s.lgLog.slice();
    const finOf = tid => { const h = s.history[0]; return h?.teams?.[tid]?.fin || (s.po.rounds[0].some(x => x.a === tid || x.b === tid) ? 'Made the playoffs' : 'Missed the playoffs'); };
    let clubs = { ...(s.clubs || {}) }, top: any = {};
    const setClub = (tid, f) => { const st = { ...s, ...top, clubs }; const pt = g.clubPatch(st, tid, f(g.clubOf(st, tid) || {}), clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; };

    // 1. Incentives: pay what was earned, re-classify likely/unlikely for next season.
    const made = new Set<number>(s.po.rounds[0].flatMap(x => [x.a, x.b]));
    const aw = (s.awards || {})[Y] || {};
    Object.keys(s.rosters).forEach(k => s.rosters[k].forEach(id => {
      const p = P[id]; if (!p.inc?.length) return;
      const t = g.seasonTotals(p, Y);
      let paid = 0;
      p.inc.forEach(x => { const ok = incentiveMet(x, p, t, +k, made, aw, T); x.lastMet = ok; x.likely = ok; if (ok) { paid += x.amt; x.paid = (x.paid || 0) + x.amt; } });
      if (paid && g.isUser(s, +k)) setClub(+k, c => ({ bonusPaid: (c.bonusPaid || 0) + paid, log: [{ date: g.fmtS(s.day), day: s.day, text: p.name + ' earned ' + money(paid) + ' in incentive bonuses' }, ...(c.log || [])] }));
    }));

    // 2. Owner verdicts for every franchise you run.
    const teamHist = { ...(s.teamHist || {}) }, career = { ...(s.career || { seasons: [] }), seasons: (s.career?.seasons || []).slice() };
    if ((aw.coy || [])[0] && g.isUser(s, aw.coy[0].tid)) career.coy = (career.coy || 0) + 1;
    const fired: number[] = [];
    s.managed.forEach(tid => {
      const rv = ownerReview(g, s, tid), fin = finOf(tid), reasons = s.ownerFiring === false || s.god || s.easy?.fire || s.graceY === Y ? [] : fireReasons(g, s, tid, rv, fin); // graceY: you took the team over from Spectator Mode this season
      career.seasons.push({ season: Y, tid, w: T[tid].w, l: T[tid].l, fin, sec: rv.sec, fired: reasons.length > 0 });
      if (reasons.length) {
        fired.push(tid); career.fired = (career.fired || 0) + 1;
        news.unshift({ day: s.day, season: Y, kind: 'fired', tid, who: T[tid].owner, role: 'Owner, ' + T[tid].abbr, quote: 'We set clear expectations and they weren’t met. ' + reasons[0] + '. It’s time for a new direction.' });
        lgLog.unshift({ day: s.day, type: 'Career', teams: T[tid].abbr, text: T[tid].owner + ' fired you as GM & head coach of the ' + T[tid].region + ' ' + T[tid].name + ': ' + reasons.join('; ') });
      } else {
        news.unshift({ day: s.day, season: Y, kind: 'review', tid, who: T[tid].owner, role: 'Owner, ' + T[tid].abbr, quote: rv.sec >= 70 ? 'I couldn’t be happier with the direction. We’re building something here.' : rv.sec >= 40 ? 'Some good, some to fix. I expect progress next season.' : 'I’m not satisfied. The conditions are on the table and they haven’t changed.' });
      }
    });
    // Your contract: extended, offered, or allowed to run out (same decision as the owner's letter).
    // Spectator Mode: you aren't anyone's GM, so none of this (and no job offers below).
    let gmOffer = s.spectator ? null : s.gmOffer || null;
    if (!s.spectator && !fired.includes(s.me)) {
      const d = contractDecision(g, s, s.me);
      // God Mode: your contract renews itself on the owner's best terms; nothing to answer.
      if (d.offer && d.offer.kind === 'expiring' && s.god) {
        const o = d.offer, start = Y + 1;
        career.contract = { tid: o.tid, years: o.years, salary: o.salary, from: start, thru: start + o.years - 1, signed: Y };
        lgLog.unshift({ day: s.day, type: 'Career', teams: T[o.tid].abbr, text: 'God Mode: your contract with the ' + T[o.tid].region + ' ' + T[o.tid].name + ' renewed for ' + o.years + ' year' + (o.years === 1 ? '' : 's') + ' ($' + o.salary.toFixed(2) + 'M a season)' });
      }
      else if (d.offer) gmOffer = d.offer;
      else if (d.expiring) {
        fired.push(s.me); const last = career.seasons[career.seasons.length - 1]; if (last) { last.expired = true; }
        news.unshift({ day: s.day, season: Y, kind: 'fired', tid: s.me, who: T[s.me].owner, role: 'Owner, ' + T[s.me].abbr, quote: 'The contract is up and we’ve decided not to renew it. We thank them for their work.' });
        lgLog.unshift({ day: s.day, type: 'Career', teams: T[s.me].abbr, text: T[s.me].owner + ' let your contract with the ' + T[s.me].region + ' ' + T[s.me].name + ' expire' });
      }
    }
    T.forEach(t => { const rv = financesOf(g, s, t.tid); teamHist[t.tid] = [...(teamHist[t.tid] || []), { season: Y, w: t.w, l: t.l, fin: finOf(t.tid), net: +rv.net.toFixed(1), payroll: +rv.payroll.toFixed(1), att: rv.att, tax: +(rv.taxBill || 0).toFixed(1) }]; });

    // 3. Job market: AI owners fire their GMs; good reputations draw offers.
    const rep = reputation({ career });
    const aiT = T.filter(t => !g.isUser(s, t.tid));
    const vac = aiT.filter(t => g.pct(t) < 0.36 && Math.random() < 0.4).map(t => t.tid);
    aiT.slice().sort((a, b) => g.pct(a) - g.pct(b)).slice(0, fired.length && fired.length >= s.managed.length ? 3 : 1).forEach(t => { if (!vac.includes(t.tid)) vac.push(t.tid); });
    const vacancies = vac.map(tid => ({ tid, reason: T[tid].owner + ' fired GM ' + T[tid].gm + ' after a ' + T[tid].w + '–' + T[tid].l + ' season' }));
    vacancies.forEach(v => lgLog.unshift({ day: s.day, type: 'Career', teams: T[v.tid].abbr, text: v.reason }));
    const offers = [], allFired0 = fired.length > 0 && fired.length >= s.managed.length;
    if (!s.spectator) vacancies.slice().sort((a, b) => teamNeed(g, s, a.tid) - teamNeed(g, s, b.tid)).forEach(v => { if (offers.length < 3 && (rep >= teamNeed(g, s, v.tid) - 5 || (allFired0 && offers.length < 2))) offers.push({ id: 'o' + v.tid + Y, tid: v.tid, from: 'vacancy', note: T[v.tid].owner + ' wants you to rebuild the ' + T[v.tid].name + '.', options: contractOptions(s, v.tid, rep) }); });
    if (rep >= 65 && !s.spectator) aiT.filter(t => g.pct(t) >= 0.55 && !vac.includes(t.tid)).slice(0, 3).forEach(t => { if (Math.random() < (rep - 55) / 100) offers.push({ id: 'o' + t.tid + Y, tid: t.tid, from: 'poach', note: t.owner + ' (' + t.arch + ') would replace ' + t.gm + ' to bring you in.', options: contractOptions(s, t.tid, rep + 10) }); });
    const OQ = ['We’ve reached out. The job is theirs if they want it.', 'I want a builder, and I think we’ve found one. We’ve made our pitch.', 'Their record speaks for itself. We’d love to have them here.', 'We’ve made an offer. Now it’s their call.'];
    offers.forEach((o, i) => news.unshift({ day: s.day, season: Y, kind: 'offer', tid: o.tid, who: T[o.tid].owner, role: 'Owner, ' + T[o.tid].abbr, quote: OQ[(i + o.tid) % OQ.length] }));
    // Fired from every club you run: you stay in charge until you accept a new job.
    const allFired = fired.length && fired.length >= s.managed.length;
    fired.filter(t => !allFired || t !== s.me).forEach(t => { if (s.managed.length > 1) { /* handed over after the updater */ } });
    return { ...top, clubs, news, lgLog, teamHist, career: { ...career, rep }, reviewed: Y, gmOffer, gmAsk: null, jobs: { season: Y, vacancies, offers, applied: {} }, firedFrom: fired, unemployed: !!allFired, phase: 'lottery', screen: s.spectator ? s.screen : fired.length ? 'career' : 'playoffs' };
  });
  // Hand every club you were fired from to the AI (unless it was your last one).
  const s = g.state;
  (s.firedFrom || []).forEach(t => { if (g.state.managed.length > 1) g.handToAI(t, 'Fired from'); });
}

// ── Team sales: owners sell the club (or most of it) ──────────────────────────────
// How often, from the real NBA: RotoWire counts 20 change-of-control sales from 2010 to 2023
// (4.8% of teams a season) and Front Office Sports 25 through 2026 (about 5.1%), so each club
// has about a 5% chance a year, one or two sales a league-year. Sold teams were usually losing
// ones (.452 the season before, on average), so bad teams sell more often; and 60% improved the
// next season (+.039 on average), so a new owner spends a little more his first year.
// Sales close when free agency opens (the new league year).
export const SALE_RATES: Record<string, number> = { off: 0, real: 0.05, often: 0.15 };
// A new owner starts with a clean slate: no hand-set bio, fortune or type left over from the last one.
const NEW_OWNER = { ownerKey: undefined, ownerBio: undefined, ownerWorth: undefined, ownerKind: undefined, ownerYear: undefined, ownerPrice: undefined };
const NEW_ARCH: [string, number][] = [['Win-Now Spender', 30], ['Hype Focus', 20], ['Asset Hoarder', 20], ['Meddling Micromanager', 16], ['Frugal Profit-Seeker', 14]];
// What a club is worth ($M): about $3B for the smallest market up to $10B+ for the biggest (2025
// prices: Blazers $4.25B, Celtics $6.1B, Lakers $10B), growing with league revenue (the cap).
export function teamValue(g: Game, s: any, tid: number) {
  const t = s.teams[tid], mk = t.mkt || 1, lf = g.CAP / 165;
  return Math.round((3000 + 12000 * Math.pow(Math.max(0, mk - 0.75), 2)) * lf * (0.92 + 0.16 * g.pct(t)));
}
export const fmtBillions = (m: number) => m >= 1000 ? '$' + (m / 1000).toFixed(2).replace(/0$/, '') + 'B' : '$' + Math.round(m) + 'M';
// God Mode: sell any club right now, to a buyer you name (or a new one, as in a normal sale), of the
// owner type and background you pick (or ones that fit). The whole club changes hands at about its value.
export function forceTeamSale(g: Game, tid: number, opts: { owner?: string; arch?: string; bg?: string } = {}) {
  g.setState(s => {
    const t = s.teams[tid]; if (!s.god || !t) return null;
    const NP = namePools(), pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const wpick = (o: [string, number][]) => { let r = Math.random() * o.reduce((a, x) => a + x[1], 0); for (const [k, w] of o) if ((r -= w) < 0) return k; return o[0][0]; };
    const used = new Set(s.teams.map((x: any) => String(x.owner).split(' ').slice(-1)[0]));
    const owner = (opts.owner || '').trim() || pick(NP.us.f) + ' ' + (pick(OWNER_SURNAMES.filter(x => !used.has(x))) || pick(OWNER_SURNAMES));
    if (owner === t.owner) return null;
    const arch = opts.arch && OWNER_ARCHETYPES.includes(opts.arch) ? opts.arch : wpick(NEW_ARCH);
    const bg = (opts.bg && bgByKey(opts.bg)) || saleBg(s, tid, kindOf({ owner, abbr: t.abbr, arch }));
    const Y = g.Y, inSeason = ['regular', 'playin', 'playoffs'].includes(s.phase), season = inSeason ? Y : Y + 1;
    const value = teamValue(g, s, tid), price = Math.round(value * (0.95 + Math.random() * 0.25));
    const sale = { season, from: t.owner, fromArch: t.arch, to: owner, arch, stake: 100, price, value, who: bg.who, gm: null, forced: true, during: inSeason };
    const teams = s.teams.map((x: any) => x.tid !== tid ? x : { ...x, ...NEW_OWNER, owner, arch, ownerBg: bg.key, ownerSince: season, splash: { thru: season, amt: arch === 'Frugal Profit-Seeker' ? 6 : arch === 'Win-Now Spender' || arch === 'Hype Focus' ? 20 : 12 }, sales: [...(x.sales || []), sale] });
    const text = 'God Mode: ' + t.owner + ' sold the ' + t.region + ' ' + t.name + ' to ' + owner + ', ' + bg.who + ', for ' + fmtBillions(price) + '. New owner type: ' + arch + '.';
    return { teams, lgLog: [{ day: s.day, type: 'Ownership', teams: t.abbr, text }, ...s.lgLog],
      news: [{ day: s.day, season: Y, kind: 'sale', tid, who: owner, role: 'New owner, ' + t.abbr, quote: pick(['This franchise has a proud history and a big future. We’re going to invest to win.', 'I didn’t buy this team to stand still. Expect us to be aggressive.', 'Our fans deserve a winner, and they’re going to get an owner who shows up.']) }, ...(s.news || [])],
      ...(s.gmOffer?.tid === tid && s.gmOffer.kind === 'early' ? { gmOffer: null } : {}) };
  });
}
export function teamSales(g: Game) {
  g.setState(s => {
    const rate = SALE_RATES[s.teamSales ?? 'real'] ?? 0.05, Y = g.Y;
    if (!rate || s.salesDone === Y) return null;
    const NP = namePools(), pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const wpick = (o: [string, number][]) => { let r = Math.random() * o.reduce((a, x) => a + x[1], 0); for (const [k, w] of o) if ((r -= w) < 0) return k; return o[0][0]; };
    const used = new Set(s.teams.map((t: any) => String(t.owner).split(' ').slice(-1)[0]));
    const teams = s.teams.slice(), news = (s.news || []).slice(), lgLog = s.lgLog.slice(), label = (Y) + '–' + String(Y + 1).slice(2);
    let clubs = { ...(s.clubs || {}) }, top: any = {};
    teams.forEach((t: any, i: number) => {
      let p = rate * Math.max(0.3, 1 + 1.5 * (0.5 - g.pct(t)));
      if (t.ownerSince != null && t.ownerSince > Y - 4) p *= 0.2; // a new owner rarely flips the team right away
      if (Math.random() >= p) return;
      const sur = pick(OWNER_SURNAMES.filter(x => !used.has(x))) || pick(OWNER_SURNAMES); used.add(sur);
      const owner = pick(NP.us.f) + ' ' + sur, arch = wpick(NEW_ARCH), stake = Math.random() < 0.55 ? 100 : 5 * Math.floor(11 + Math.random() * 8);
      const bg = saleBg({ ...s, teams }, i, kindOf({ owner, abbr: t.abbr, arch })), who = bg.who; // the buyer's background matches the announcement
      const value = Math.round(teamValue(g, s, i) * (0.95 + Math.random() * 0.25)), price = Math.round(value * stake / 100);
      const mine = g.isUser(s, i), newGm = !mine && Math.random() < 0.5 ? pick(NP.us.f) + ' ' + pick(NP.us.l) : null;
      const sale = { season: Y + 1, from: t.owner, fromArch: t.arch, to: owner, arch, stake, price, value, who, gm: newGm ? { out: t.gm, in: newGm } : null };
      teams[i] = { ...t, ...NEW_OWNER, owner, arch, ownerBg: bg.key, ownerSince: Y + 1, splash: { thru: Y + 1, amt: arch === 'Frugal Profit-Seeker' ? 6 : arch === 'Win-Now Spender' || arch === 'Hype Focus' ? 20 : 12 }, sales: [...(t.sales || []), sale], ...(newGm ? { gm: newGm } : {}) };
      const what = stake === 100 ? 'the ' + t.region + ' ' + t.name : 'a ' + stake + '% controlling stake in the ' + t.region + ' ' + t.name;
      const text = t.owner + ' sold ' + what + ' to ' + owner + ', ' + who + ', for ' + fmtBillions(price) + (stake < 100 ? ' (valuing the club at ' + fmtBillions(value) + '; ' + t.owner + ' keeps ' + (100 - stake) + '% as a minority partner)' : '') + '. New owner type: ' + arch + '.';
      lgLog.unshift({ day: s.day, type: 'Ownership', teams: t.abbr, text });
      if (newGm) lgLog.unshift({ day: s.day, type: 'Ownership', teams: t.abbr, text: owner + ' replaced GM ' + t.gm + ' with ' + newGm });
      news.unshift({ day: s.day, season: Y, kind: 'sale', tid: i, who: owner, role: 'New owner, ' + t.abbr, quote: mine
        ? 'I’ve watched what this front office has built. They keep the job, and they’ll get a full season to show me where this is going. The expectations are mine now.'
        : newGm ? 'New ownership, new direction. We’re bringing in ' + newGm + ' to run basketball operations. This city is going to be proud of this team.' : pick(['This franchise has a proud history and a big future. We’re going to invest to win.', 'I didn’t buy this team to stand still. Expect us to be aggressive.', 'Our fans deserve a winner, and they’re going to get an owner who shows up.']) });
      if (mine) {
        const club = g.clubOf({ ...s, ...top, clubs }, i) || {};
        const item = { id: 'sale' + Y + '-' + i, tid: i, day: s.day, season: Y, kind: 'sale', done: false, title: 'The ' + t.name + ' have been sold', text: text + ' Your contract stands and ' + owner + ' won’t judge you until the end of his first full season. His demands, budget and firing conditions are on the Owner screen.', options: [{ k: 'ok', label: 'Meet the new owner' }] };
        const pt = g.clubPatch({ ...s, ...top, clubs }, i, { inbox: [item, ...(club.inbox || [])], log: [{ date: g.fmtS(s.day), day: s.day, text: 'Team sold to ' + owner + ' (' + arch + ')' }, ...(club.log || [])] }, clubs);
        if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt };
        // The old owner's pending extension offer goes with him.
        if (s.gmOffer?.tid === i && s.gmOffer.kind === 'early') top.gmOffer = null;
      }
    });
    return { ...top, clubs, teams, news, lgLog, salesDone: Y };
  });
}

function incentiveMet(x: any, p: any, t: any, tid: number, made: Set<number>, aw: any, T: any[]) {
  const gp = t?.gp || 0;
  if (x.k === 'avail') return gp >= x.target;
  if (x.k === 'pts') return gp >= 50 && t.pts / gp >= x.target;
  if (x.k === 'reb') return gp >= 50 && (t.orb + t.drb) / gp >= x.target;
  if (x.k === 'ast') return gp >= 50 && t.ast / gp >= x.target;
  if (x.k === 'tp') return t && t.tpa >= 200 && t.tpm / t.tpa >= x.target;
  if (x.k === 'playoffs') return made.has(tid);
  if (x.k === 'wins') return T[tid].w >= x.target;
  if (x.k === 'allLeague') return (aw.allLeague || []).some(team => team.includes(p.id));
  if (x.k === 'allDef') return (aw.allDef || []).some(team => team.includes(p.id));
  return false;
}

// ── Job market actions ───────────────────────────────────────────────────────────
export function applyForJob(g: Game, tid: number) {
  g.setState(s => {
    const j = s.jobs; if (!j || j.applied?.[tid]) return null;
    const rep = reputation(s), need = teamNeed(g, s, tid), chance = 1 / (1 + Math.exp(-(rep - need) / 8));
    const ok = Math.random() < chance, T = s.teams[tid];
    const offers = ok ? [...j.offers, { id: 'o' + tid + g.Y + 'a', tid, from: 'applied', note: T.owner + ' was impressed in the interview.', options: contractOptions(s, tid, rep) }] : j.offers;
    return { jobs: { ...j, offers, applied: { ...(j.applied || {}), [tid]: ok ? 'offer' : 'declined' } }, news: [{ day: s.day, season: g.Y, kind: 'interview', tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: ok ? 'We had a great conversation. We’ve made an offer.' : 'We’ve decided to go in another direction.' }, ...(s.news || [])] };
  });
}
export function acceptJob(g: Game, offerId: string, optIdx: number, leave: boolean) {
  const s = g.state, o = s.jobs?.offers.find(x => x.id === offerId); if (!o) return;
  const opt = o.options[optIdx], old = s.me, T = s.teams[o.tid];
  g.takeOver(o.tid, 'Hired as GM & head coach of');
  g.setState(st => ({ jobs: { ...st.jobs, offers: st.jobs.offers.filter(x => x.id !== offerId) }, unemployed: false, career: { ...(st.career || {}), contract: { tid: o.tid, years: opt.years, salary: opt.salary, from: g.Y + 1, thru: g.Y + opt.years, signed: g.Y } }, gmOffer: null, news: [{ day: st.day, season: g.Y, kind: 'hired', tid: o.tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: 'We got our number one choice. ' + opt.years + ' years, and full control of basketball operations.' }, ...(st.news || [])] }));
  const firedFrom = g.state.firedFrom || [];
  if (leave || g.state.unemployed) { [old, ...firedFrom].forEach(t => { if (t !== o.tid && g.isUser(g.state, t) && g.state.managed.length > 1) g.handToAI(t, firedFrom.includes(t) ? 'Fired from' : 'Left for another job:'); }); }
  g.setState({ firedFrom: [], unemployed: false });
}

// ── Contract incentives ──────────────────────────────────────────────────────────
// Offerable bonuses for a player. `likely` if he hit it last season (it then counts
// against the cap); unlikely incentives don't, which is why cap-strapped teams use them.
export function incentiveOptions(g: Game, s: any, p: any, tid: number, salary: number) {
  const last = g.seasonTotals(p, g.Y - (s.phase === 'regular' || s.phase === 'playin' || s.phase === 'playoffs' ? 1 : 0)) || null;
  const lastPo = new Set<number>((s.history?.[0] ? [] : []) as number[]);
  const pg = (k: string) => (last && last.gp ? (k === 'reb' ? (last.orb + last.drb) / last.gp : last[k] / last.gp) : null);
  const out: any[] = [];
  const amt = (f: number) => +Math.max(0.1, salary * f).toFixed(1);
  out.push({ k: 'avail', label: 'Plays 65+ games', target: 65, amt: amt(0.05), likely: last ? last.gp >= 65 : !p.pers.prone });
  const ptsNow = pg('pts') ?? p.pts ?? 0;
  if (ptsNow >= 12 || p.ovr >= 58) { const tg = Math.max(12, Math.round(ptsNow + 2)); out.push({ k: 'pts', label: 'Averages ' + tg + '+ points', target: tg, amt: amt(0.08), likely: ptsNow >= tg }); }
  if (p.r.tp >= 62) out.push({ k: 'tp', label: 'Shoots 38%+ from three (200+ attempts)', target: 0.38, amt: amt(0.07), likely: !!(last && last.tpa >= 200 && last.tpm / last.tpa >= 0.38) });
  if (p.grp === 'B') { const tg = Math.max(8, Math.round((pg('reb') ?? 6) + 1)); out.push({ k: 'reb', label: 'Averages ' + tg + '+ rebounds', target: tg, amt: amt(0.06), likely: (pg('reb') ?? 0) >= tg }); }
  if (p.r.pss >= 64) { const tg = Math.max(5, Math.round((pg('ast') ?? 4) + 1)); out.push({ k: 'ast', label: 'Averages ' + tg + '+ assists', target: tg, amt: amt(0.06), likely: (pg('ast') ?? 0) >= tg }); }
  const lastFin = s.history?.[0]?.teams?.[tid]?.fin;
  out.push({ k: 'playoffs', label: 'Team makes the playoffs', amt: amt(0.05), likely: !!lastFin && !/Missed|play-in/.test(lastFin) });
  out.push({ k: 'wins', label: 'Team wins 50 games', target: 50, amt: amt(0.05), likely: s.teams[tid].w >= 50 && s.phase !== 'regular' });
  if (p.ovr >= 62) out.push({ k: 'allLeague', label: 'Named to an All-League team', amt: amt(0.1), likely: false });
  if (p.r.diq >= 66) out.push({ k: 'allDef', label: 'Named to an All-Defensive team', amt: amt(0.07), likely: false });
  void lastPo;
  return out;
}
// Base salary after moving value into incentives: likely bonuses count in full,
// unlikely ones at 60% (the player discounts the risk).
export const baseAfterIncentives = (ask: number, inc: any[]) => +Math.max(1.1, ask - inc.reduce((a, x) => a + x.amt * (x.likely ? 1 : 0.6), 0)).toFixed(1);

// Progress on each incentive this season, for the contract checklist.
export function incentiveProgress(g: Game, s: any, p: any, tid: number, x: any) {
  const t = g.seasonTotals(p, g.Y), gp = t?.gp || 0, T = s.teams[tid];
  const f = (v: number, d = 1) => v.toFixed(d);
  switch (x.k) {
    case 'avail': return { now: gp + ' games', frac: gp / x.target };
    case 'pts': return { now: gp ? f(t.pts / gp) + ' ppg' : '—', frac: gp ? t.pts / gp / x.target : 0 };
    case 'reb': return { now: gp ? f((t.orb + t.drb) / gp) + ' rpg' : '—', frac: gp ? (t.orb + t.drb) / gp / x.target : 0 };
    case 'ast': return { now: gp ? f(t.ast / gp) + ' apg' : '—', frac: gp ? t.ast / gp / x.target : 0 };
    case 'tp': return { now: t && t.tpa ? f((t.tpm / t.tpa) * 100) + '% on ' + t.tpa : '—', frac: t && t.tpa ? Math.min(t.tpa / 200, t.tpm / t.tpa / x.target) : 0 };
    case 'wins': return { now: T ? T.w + ' wins' : '—', frac: T ? T.w / 50 : 0 };
    case 'playoffs': return { now: T ? T.w + '–' + T.l : '—', frac: T ? g.pct(T) / 0.55 : 0 };
    default: return { now: 'Voted after the season', frac: 0 };
  }
}

// ── Inbox: stat-padding dilemmas and owner mandates ───────────────────────────────
export function inboxTick(g: Game, s: any, day: number, rosters: any) {
  const P = g.db.P, out: Record<number, any[]> = {}, left = 82 - day;
  const push = (tid, x) => (out[tid] = out[tid] || []).push({ id: 'i' + g.Y + '-' + day + '-' + x.pid + '-' + x.kind, tid, day, season: g.Y, done: false, ...x });
  s.managed.forEach(tid => {
    rosters[tid].forEach(id => {
      const p = P[id]; if (p.dilemma === g.Y) return;
      const t = g.seasonTotals(p, g.Y), gp = t?.gp || 0;
      for (const x of p.inc || []) {
        if (x.k === 'avail' && day >= 55 && gp < x.target && gp + left >= x.target && x.target - gp >= left - 4 && (p.last5?.[0]?.min || 0) < 4) {
          push(tid, { pid: id, kind: 'avail', title: p.name + '’s agent wants minutes', text: 'He has ' + gp + ' games; his bonus needs ' + x.target + '. The agent asks for garbage-time minutes in the remaining ' + left + ' games so he reaches the ' + money(x.amt) + ' availability bonus.', options: [{ k: 'yes', label: 'Give him minutes' }, { k: 'no', label: 'Stick to the rotation' }] });
          p.dilemma = g.Y; return;
        }
        if (x.k === 'tp' && t && t.tpa >= 200 && left <= 12 && t.tpm / t.tpa >= x.target && t.tpm / t.tpa < x.target + 0.012) {
          push(tid, { pid: id, kind: 'protect', title: p.name + ' wants to protect his percentage', text: 'He’s at ' + ((t.tpm / t.tpa) * 100).toFixed(1) + '% from three, just over the 38% line in his ' + money(x.amt) + ' bonus. He asks to take fewer threes the rest of the way.', options: [{ k: 'yes', label: 'Let him limit his threes' }, { k: 'no', label: 'Keep him shooting' }] });
          p.dilemma = g.Y; return;
        }
        if (x.k === 'pts' && gp >= 30 && left >= 6 && t.pts / gp < x.target && t.pts / gp >= x.target - 1.2) {
          push(tid, { pid: id, kind: 'feature', title: p.name + ' wants more shots', text: 'He’s averaging ' + (t.pts / gp).toFixed(1) + ' points, just under the ' + x.target + ' in his ' + money(x.amt) + ' bonus. His camp wants the offense run through him.', options: [{ k: 'yes', label: 'Feature him more' }, { k: 'no', label: 'Keep the offense balanced' }] });
          p.dilemma = g.Y; return;
        }
      }
      if (p.pers.padder && gp >= 20 && Math.random() < 0.004) {
        push(tid, { pid: id, kind: 'padder', title: p.name + ' is hunting stats', text: 'Teammates say he’s forcing shots to pad his numbers. Rein him in or let him cook?', options: [{ k: 'no', label: 'Rein him in' }, { k: 'yes', label: 'Let him cook' }] });
        p.dilemma = g.Y;
      }
    });
    // Owner mandate: over the payroll ceiling → get under it by the trade deadline (day 50).
    const T = s.teams[tid], ceil = g.teamCeiling(T), pay = teamSalary(g, { ...s, rosters }, tid);
    const club = g.clubOf(s, tid), open = (club?.inbox || []).find(x => x.kind === 'mandate' && !x.resolved);
    void pay; void ceil; void open; // payroll orders are offseason-only now (offseasonMandates)
  });
  return out;
}

export function resolveInbox(g: Game, id: string, choice: string) {
  g.setState(s => {
    const c = g.clubOf(s, s.me), x = (c?.inbox || []).find(y => y.id === id); if (!x || x.done) return null;
    const p = x.pid != null ? g.db.P[x.pid] : null;
    if (p) {
      if (x.kind === 'avail') { if (choice === 'yes') p.minMin = 6; else p.moodAdj = (p.moodAdj || 0) - 8; }
      if (x.kind === 'protect') { if (choice === 'yes') p.protect = true; else p.moodAdj = (p.moodAdj || 0) - 6; }
      if (x.kind === 'feature') { if (choice === 'yes') p.padding = true; else p.moodAdj = (p.moodAdj || 0) - 6; }
      if (x.kind === 'padder') { if (choice === 'yes') p.padding = true; else { p.padding = false; p.moodAdj = (p.moodAdj || 0) - 5; } }
    }
    const inbox = c.inbox.map(y => (y.id === id ? { ...y, done: true, choice } : y));
    return { inbox, ...(x.kind === 'sale' ? { screen: 'owner' } : {}), log: [{ date: g.fmtS(s.day), day: s.day, text: x.title + ': ' + (x.options.find(o => o.k === choice)?.label || choice) }, ...(s.log || [])] };
  });
}

// At the trade deadline: an unmet mandate becomes a fire sale of the worst contracts.
export function fireSale(g: Game, s: any, tid: number, rosters: any, lgLog: any[], fa: number[] = []) {
  const P = g.db.P, T = s.teams[tid], ceil = g.teamCeiling(T), sold: string[] = [];
  let guard = 0;
  // Salary dumps are trades to teams with room (never a player cut into nowhere). Rookie-scale
  // players and the team's two best players are never dumped; the worst-value contracts go first.
  const best2 = rosters[tid].slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 2);
  const cands = rosters[tid].filter(id => !best2.includes(id) && !P[id].rookieScale && P[id].ctype !== 'rookie').sort((a, b) => (P[b].amt - g.fair(P[b].ovr)) - (P[a].amt - g.fair(P[a].ovr)));
  for (const worst of cands) {
    if (teamSalary(g, { ...s, rosters }, tid) <= ceil || rosters[tid].length <= rosterMin(s) - 1 || guard++ >= 6) break; // never more than one under the roster minimum
    // A team with the salary room takes him; if its roster is full it waives its last minimum-salary player.
    const spare = (t: number) => stdIds(g, rosters[t]).filter((id: number) => ['min', 'ex10'].includes(P[id].ctype) || P[id].amt <= g.MINP / 60).sort((a: number, b: number) => P[a].ovr - P[b].ovr)[0];
    const to = s.teams.filter(t => !g.isUser(s, t.tid) && (stdIds(g, rosters[t.tid]).length < seasonMax(s) || spare(t.tid) != null) && teamSalary(g, { ...s, rosters }, t.tid) + P[worst].amt <= Math.max(g.CAP, g.teamCeiling(t))).sort((a, b) => g.payrollOf(rosters[a.tid]) - g.payrollOf(rosters[b.tid]))[0];
    if (!to) continue; // nobody can take him: he stays
    if (stdIds(g, rosters[to.tid]).length >= 15) { const cut = spare(to.tid); rosters[to.tid] = rosters[to.tid].filter(x => x !== cut); fa.unshift(cut); addTx(g, s, P[cut], { k: 'waive', tid: to.tid, text: 'Waived to make room for ' + P[worst].name }); lgLog.unshift({ day: s.day, type: 'Release', teams: to.abbr, pids: [cut], text: 'Released ' + P[cut].name + ' (the ' + to.name + ' needed the roster spot)' }); }
    rosters[tid] = rosters[tid].filter(x => x !== worst); rosters[to.tid] = [...rosters[to.tid], worst];
    recordTrade(g, s, tid, to.tid, [worst], [], [], [], 'Fire sale on the owner’s orders');
    sold.push(P[worst].name + ' to ' + to.abbr);
    lgLog.unshift({ day: s.day, type: 'Trade', teams: T.abbr + ' · ' + to.abbr, pids: [worst], text: 'Traded ' + P[worst].name + ' to the ' + to.region + ' ' + to.name + ' for nothing: a fire sale on the ' + T.name + ' owner’s orders' });
  }
  return sold;
}

export { pick };

// ── Payroll orders (offseason only) ───────────────────────────────────────────────
// When free agency opens (and on every offseason day after), an owner whose team is over his
// payroll ceiling tells you by how much and gives you until opening night to fix it: trade or
// waive players (waived salary still counts as dead money). Still over when the season starts,
// he orders a fire sale before the first game. Never during the season.
export function offseasonMandates(g: Game) {
  g.setState(s => {
    if (!['fa', 'preseason'].includes(s.phase)) return null;
    let clubs = { ...(s.clubs || {}) }, top: any = {}, changed = false;
    s.managed.forEach((tid: number) => {
      const T = s.teams[tid], ceil = g.teamCeiling(T), pay = teamSalary(g, s, tid), st = { ...s, ...top, clubs }, c = g.clubOf(st, tid) || {};
      const inbox = c.inbox || [], open = inbox.find((x: any) => x.kind === 'mandate' && !x.resolved);
      let next = inbox;
      // An old in-season order lapses; in God Mode every payroll order is void.
      if (open && (open.deadline !== 'opening' || s.god)) next = inbox.map((x: any) => x === open ? { ...x, resolved: s.god ? 'void' : 'expired', done: true } : x);
      const cur = next.find((x: any) => x.kind === 'mandate' && !x.resolved);
      if (pay > ceil + 0.05 && !cur && !s.god) next = [{ id: 'm' + g.Y + '-' + tid, tid, day: s.day, season: g.Y, kind: 'mandate', deadline: 'opening', target: ceil, pid: null, done: true, options: [],
        title: T.owner + ': cut payroll before opening night', text: 'Owner ' + T.owner + ' (' + T.arch + ') wants payroll under ' + money(ceil) + ' by opening night. You’re at ' + money(pay) + ', ' + money(pay - ceil) + ' over. Trade or waive players (waived salary still counts as dead money). If you’re still over when the season starts, he’ll order a fire sale of your worst contracts.' }, ...next];
      else if (cur && pay <= ceil + 0.05) next = next.map((x: any) => x === cur ? { ...x, resolved: 'met', done: true } : x);
      if (next !== inbox) { changed = true; const pt = g.clubPatch(st, tid, { inbox: next.slice(0, 40) }, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; }
    });
    return changed ? { ...top, clubs } : null;
  });
}
// Opening night: an order still open and payroll still over → the fire sale (trades only).
export function openingNightFireSales(g: Game, s: any, rosters: any, lgLog: any[], fa: number[] = []) {
  let clubs = { ...(s.clubs || {}) }, top: any = {}; const fails = { ...(s.mandateFails || {}) };
  s.managed.forEach((tid: number) => {
    const st = { ...s, ...top, clubs, rosters }, c = g.clubOf(st, tid) || {}, inbox = c.inbox || [], open = inbox.find((x: any) => x.kind === 'mandate' && !x.resolved);
    if (!open) return;
    const T = s.teams[tid], ceil = g.teamCeiling(T);
    let next;
    if (s.god) next = inbox.map((x: any) => x === open ? { ...x, resolved: 'void', done: true } : x); // God Mode: no fire sale, ever
    else if (teamSalary(g, st, tid) <= ceil + 0.05) next = inbox.map((x: any) => x === open ? { ...x, resolved: 'met', done: true } : x);
    else { const sold = fireSale(g, st, tid, rosters, lgLog, fa); fails[tid] = (fails[tid] || 0) + 1;
      next = [{ id: 'fs' + g.Y + '-' + tid, tid, day: s.day, season: g.Y, kind: 'firesale', done: true, options: [], title: T.owner + ' ordered a fire sale', text: 'Payroll was still over ' + money(ceil) + ' on opening night. Traded away for nothing: ' + (sold.join(', ') || 'nobody (no team could take the contracts)') + '.' }, ...inbox.map((x: any) => x === open ? { ...x, resolved: 'failed', done: true } : x)]; }
    const pt = g.clubPatch(st, tid, { inbox: next.slice(0, 40) }, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt };
  });
  return { ...top, clubs, mandateFails: fails };
}

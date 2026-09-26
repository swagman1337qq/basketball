// Front office: finances, owner expectations and firing, the job market, press quotes,
// contract incentives (with likely/unlikely cap accounting), stat-padding dilemmas and
// owner-mandated fire sales. Everything the owner judges you on is computed here and
// shown in full on the Owner, Finances and Career screens: no hidden rules.
import type { Game } from './Game';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
export const DEFAULT_BUDGET = { Coaching: 18, Health: 10, Facilities: 14, Scouting: 4, Tickets: 118 };
export const money = (v: number) => (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(1) + 'M';

// ── Finances ─────────────────────────────────────────────────────────────────────
export function financesOf(g: Game, s: any, tid: number) {
  const T = s.teams[tid], club = g.clubOf(s, tid), b = club ? club.budget : DEFAULT_BUDGET;
  const mk = T.mkt, wp = g.pct(T), cap = T.arenaCap || 18800;
  const att = cl(Math.round((cap / 18800) * (18800 - ((b.Tickets - 110) * 55) / mk + (wp - 0.5) * 9000 + (b.Facilities - 14) * 80 + (mk - 1) * 3000)), 9000 * (cap / 18800), cap);
  const tix = (b.Tickets * att * 41) / 1e6;
  const payroll = g.payrollOf(s.rosters[tid]) + (T.capAdj || 0);
  const taxHist = club?.taxHist || [];
  const repeater = taxHist.slice(-4).filter(Boolean).length >= 3;
  let taxBill = 0;
  { let over = payroll - g.TAX, rate = 1.5 + (repeater ? 1 : 0); while (over > 0) { taxBill += Math.min(5, over) * rate; over -= 5; rate += rate < 1.75 ? 0.25 : rate < 2.5 ? 0.75 : 0.5; } }
  taxBill = Math.max(0, taxBill + (T.taxAdj || 0));
  const share = 25 * (mk - 0.95);
  const rev: [string, number][] = [['Ticket sales', tix], ['National media rights', 152.0], ['Local media', 34.0 * Math.pow(mk, 1.5)], ['Sponsorship & naming', 48.0 * mk], ['Merchandise', 22 * mk * (0.8 + wp * 0.4)]];
  if (share < 0) rev.push(['Revenue sharing received', -share]);
  if (payroll <= g.TAX) rev.push(['Tax distribution (est.)', 11.5]);
  const exp: [string, number][] = [['Player payroll', payroll], ...(payroll < g.MINP ? [['Salary-floor shortfall (paid to players)', g.MINP - payroll] as [string, number]] : []), ...(taxBill ? [[repeater ? 'Luxury tax (repeater rates)' : 'Luxury tax', taxBill] as [string, number]] : []), ['Arena & game operations', 55.0], ['Front office & staff', 25.0], ['Team travel', 9.0], ...(share > 0 ? [['Revenue sharing paid', share] as [string, number]] : []), ...(club?.buyoutCash ? [['Overseas buyouts', club.buyoutCash] as [string, number]] : []), ...(club?.bonusPaid ? [['Incentive bonuses paid', club.bonusPaid] as [string, number]] : []), ['Coaching', b.Coaching], ['Health', b.Health], ['Facilities', b.Facilities], ['Scouting', b.Scouting]];
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
export const OWNER_FIRE: Record<string, string[]> = {
  'Win-Now Spender': ['Missing the playoffs two seasons in a row', 'Job security below 15'],
  'Frugal Profit-Seeker': ['Losing money two seasons in a row', 'Paying the luxury tax', 'Job security below 15'],
  'Asset Hoarder': ['Holding fewer than 2 first-round picks at season’s end', 'Job security below 15'],
  'Hype Focus': ['Attendance under 80% for a full season', 'Job security below 15'],
  'Meddling Micromanager': ['Benching his favorite player for 20+ games', 'Job security below 15'],
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
  const usedPick = a => a.yr === g.Y && a.rd === 1 && s.picks.some(x => x.orig === a.orig && x.pid);
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
  const ceiling = g.ownerCeiling(me.arch) + (me.ceilAdj || 0);
  const demands = DEM[me.arch].slice();
  const mandate = (g.clubOf(s, tid)?.inbox || []).find(x => x.kind === 'mandate' && !x.resolved);
  if (payroll > ceiling) demands.push(['Owner mandate: get payroll under ' + money(ceiling) + (mandate ? ' by ' + g.fmtS(mandate.deadline) : ''), money(payroll), 'Failing']);
  const fails = (s.mandateFails || {})[tid] || 0;
  const LIM: Record<string, string[]> = {
    'Win-Now Spender': ['Payroll ceiling: ' + money(ceiling) + ' (2nd apron)', 'No profit requirement'],
    'Frugal Profit-Seeker': ['Payroll ceiling: ' + money(ceiling) + ' (tax line)', 'Minimum profit: $10.0M'],
    'Asset Hoarder': ['Payroll ceiling: ' + money(ceiling) + ' (1st apron)', 'Needs approval to trade any first-round pick'],
    'Hype Focus': ['Payroll ceiling: ' + money(ceiling), 'Ticket price may not drop below $90'],
    'Meddling Micromanager': ['Payroll ceiling: ' + money(ceiling), 'Signs off on every trade'],
  };
  const sec = Math.round(cl(60 + (g.pct(me) - 0.5) * 80 + demands.reduce((a, d) => a + (d[2] === 'Met' ? 6 : d[2] === 'At risk' ? -6 : -15), 0) - fails * 10, 0, 100));
  return { owner: me.owner, arch: me.arch, desc: OWNER_DESC[me.arch], sec, demands, limits: LIM[me.arch], fire: OWNER_FIRE[me.arch], fin, firsts, favBench, ceiling, label: sec >= 70 ? 'Secure' : sec >= 40 ? 'Stable' : sec >= 20 ? 'Warm seat' : 'Hot seat' };
}

// End-of-season firing check against the owner's written conditions.
export function fireReasons(g: Game, s: any, tid: number, rv: ReturnType<typeof ownerReview>, finThis: string) {
  const out: string[] = [], hist = (s.teamHist || {})[tid] || [], last = hist[hist.length - 1];
  const missed = f => f === 'Missed the playoffs' || f === 'Lost in the play-in';
  if (rv.sec < 15) out.push('Job security fell to ' + rv.sec);
  if (rv.arch === 'Win-Now Spender' && missed(finThis) && last && missed(last.fin)) out.push('Missed the playoffs two seasons in a row');
  if (rv.arch === 'Frugal Profit-Seeker') { if (rv.fin.net < 0 && last && last.net < 0) out.push('Lost money two seasons in a row'); if (rv.fin.taxBill > 0) out.push('Paid the luxury tax'); }
  if (rv.arch === 'Asset Hoarder' && rv.firsts < 2) out.push('Held fewer than 2 first-round picks');
  if (rv.arch === 'Hype Focus' && rv.fin.full < 0.8) out.push('Attendance under 80% for the season');
  if (rv.arch === 'Meddling Micromanager' && rv.favBench >= 20) out.push('Benched the owner’s favorite for ' + rv.favBench + ' games');
  return out;
}

// ── Career & job market ──────────────────────────────────────────────────────────
export function reputation(s: any) {
  const c = s.career || { seasons: [] }, ss = c.seasons || [];
  if (!ss.length) return 50;
  const wp = ss.reduce((a, x) => a + x.w / Math.max(1, x.w + x.l), 0) / ss.length;
  const titles = ss.filter(x => x.fin === 'Won the title').length, apps = ss.filter(x => !/Missed|play-in/.test(x.fin)).length;
  return Math.round(cl(50 + (wp - 0.5) * 120 + titles * 8 + apps * 2 + (c.coy || 0) * 4 - (c.fired || 0) * 12, 0, 100));
}
const teamNeed = (g: Game, s: any, tid: number) => { const P = g.db.P, o = s.rosters[tid].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); const top8 = o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); return 35 + (top8 - 50) * 1.8 + (s.teams[tid].mkt - 1) * 20; };
function contractOptions(tid: number, rep: number) {
  const base = 3 + rep / 25;
  return [{ years: 2, salary: +(base * 1.2).toFixed(1) }, { years: 3, salary: +base.toFixed(1) }, { years: 5, salary: +(base * 0.85).toFixed(1) }].map(o => ({ ...o, tid }));
}

// ── Season-end review: incentives, owner verdicts, career record, job market ───────
export function seasonReview(g: Game) {
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
      const rv = ownerReview(g, s, tid), fin = finOf(tid), reasons = s.ownerFiring === false || s.god ? [] : fireReasons(g, s, tid, rv, fin);
      career.seasons.push({ season: Y, tid, w: T[tid].w, l: T[tid].l, fin, sec: rv.sec, fired: reasons.length > 0 });
      if (reasons.length) {
        fired.push(tid); career.fired = (career.fired || 0) + 1;
        news.unshift({ day: s.day, season: Y, kind: 'fired', tid, who: T[tid].owner, role: 'Owner, ' + T[tid].abbr, quote: 'We set clear expectations and they weren’t met. ' + reasons[0] + '. It’s time for a new direction.' });
        lgLog.unshift({ day: s.day, type: 'Career', teams: T[tid].abbr, text: T[tid].owner + ' fired you as GM & head coach of the ' + T[tid].region + ' ' + T[tid].name + ': ' + reasons.join('; ') });
      } else {
        news.unshift({ day: s.day, season: Y, kind: 'review', tid, who: T[tid].owner, role: 'Owner, ' + T[tid].abbr, quote: rv.sec >= 70 ? 'I couldn’t be happier with the direction. We’re building something here.' : rv.sec >= 40 ? 'Some good, some to fix. I expect progress next season.' : 'I’m not satisfied. The conditions are on the table and they haven’t changed.' });
      }
    });
    T.forEach(t => { const rv = financesOf(g, s, t.tid); teamHist[t.tid] = [...(teamHist[t.tid] || []), { season: Y, w: t.w, l: t.l, fin: finOf(t.tid), net: +rv.net.toFixed(1), payroll: +rv.payroll.toFixed(1), att: rv.att }]; });

    // 3. Job market: AI owners fire their GMs; good reputations draw offers.
    const rep = reputation({ career });
    const aiT = T.filter(t => !g.isUser(s, t.tid));
    const vac = aiT.filter(t => g.pct(t) < 0.36 && Math.random() < 0.4).map(t => t.tid);
    aiT.slice().sort((a, b) => g.pct(a) - g.pct(b)).slice(0, fired.length && fired.length >= s.managed.length ? 3 : 1).forEach(t => { if (!vac.includes(t.tid)) vac.push(t.tid); });
    const vacancies = vac.map(tid => ({ tid, reason: T[tid].owner + ' fired GM ' + T[tid].gm + ' after a ' + T[tid].w + '–' + T[tid].l + ' season' }));
    vacancies.forEach(v => lgLog.unshift({ day: s.day, type: 'Career', teams: T[v.tid].abbr, text: v.reason }));
    const offers = [], allFired0 = fired.length > 0 && fired.length >= s.managed.length;
    vacancies.slice().sort((a, b) => teamNeed(g, s, a.tid) - teamNeed(g, s, b.tid)).forEach(v => { if (offers.length < 3 && (rep >= teamNeed(g, s, v.tid) - 5 || (allFired0 && offers.length < 2))) offers.push({ id: 'o' + v.tid + Y, tid: v.tid, from: 'vacancy', note: T[v.tid].owner + ' wants you to rebuild the ' + T[v.tid].name + '.', options: contractOptions(v.tid, rep) }); });
    if (rep >= 65) aiT.filter(t => g.pct(t) >= 0.55 && !vac.includes(t.tid)).slice(0, 3).forEach(t => { if (Math.random() < (rep - 55) / 100) offers.push({ id: 'o' + t.tid + Y, tid: t.tid, from: 'poach', note: t.owner + ' (' + t.arch + ') would replace ' + t.gm + ' to bring you in.', options: contractOptions(t.tid, rep + 10) }); });
    const OQ = ['We’ve reached out. The job is theirs if they want it.', 'I want a builder, and I think we’ve found one. We’ve made our pitch.', 'Their record speaks for itself. We’d love to have them here.', 'We’ve made an offer. Now it’s their call.'];
    offers.forEach((o, i) => news.unshift({ day: s.day, season: Y, kind: 'offer', tid: o.tid, who: T[o.tid].owner, role: 'Owner, ' + T[o.tid].abbr, quote: OQ[(i + o.tid) % OQ.length] }));
    // Fired from every club you run: you stay in charge until you accept a new job.
    const allFired = fired.length && fired.length >= s.managed.length;
    fired.filter(t => !allFired || t !== s.me).forEach(t => { if (s.managed.length > 1) { /* handed over after the updater */ } });
    return { ...top, clubs, news, lgLog, teamHist, career: { ...career, rep }, reviewed: Y, jobs: { season: Y, vacancies, offers, applied: {} }, firedFrom: fired, unemployed: !!allFired, phase: 'lottery', screen: fired.length ? 'career' : 'playoffs' };
  });
  // Hand every club you were fired from to the AI (unless it was your last one).
  const s = g.state;
  (s.firedFrom || []).forEach(t => { if (g.state.managed.length > 1) g.handToAI(t, 'Fired from'); });
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
    const offers = ok ? [...j.offers, { id: 'o' + tid + g.Y + 'a', tid, from: 'applied', note: T.owner + ' was impressed in the interview.', options: contractOptions(tid, rep) }] : j.offers;
    return { jobs: { ...j, offers, applied: { ...(j.applied || {}), [tid]: ok ? 'offer' : 'declined' } }, news: [{ day: s.day, season: g.Y, kind: 'interview', tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: ok ? 'We had a great conversation. We’ve made an offer.' : 'We’ve decided to go in another direction.' }, ...(s.news || [])] };
  });
}
export function acceptJob(g: Game, offerId: string, optIdx: number, leave: boolean) {
  const s = g.state, o = s.jobs?.offers.find(x => x.id === offerId); if (!o) return;
  const opt = o.options[optIdx], old = s.me, T = s.teams[o.tid];
  g.takeOver(o.tid, 'Hired as GM & head coach of');
  g.setState(st => ({ jobs: { ...st.jobs, offers: st.jobs.offers.filter(x => x.id !== offerId) }, unemployed: false, career: { ...(st.career || {}), contract: { tid: o.tid, years: opt.years, salary: opt.salary, from: g.Y } }, news: [{ day: st.day, season: g.Y, kind: 'hired', tid: o.tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: 'We got our number one choice. ' + opt.years + ' years, and full control of basketball operations.' }, ...(st.news || [])] }));
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
    const T = s.teams[tid], ceil = g.ownerCeiling(T.arch) + (T.ceilAdj || 0), pay = g.payrollOf(rosters[tid]) + (T.capAdj || 0);
    const club = g.clubOf(s, tid), open = (club?.inbox || []).find(x => x.kind === 'mandate' && !x.resolved);
    if (pay > ceil && !open && day < 45 && day % 5 === 0) push(tid, { pid: null, kind: 'mandate', deadline: 50, target: ceil, title: T.owner + ': cut payroll', text: 'Owner ' + T.owner + ' (' + T.arch + ') orders payroll under ' + money(ceil) + ' by the trade deadline (' + g.fmtS(50) + '). Otherwise he will order a fire sale of your worst contracts.', options: [{ k: 'ok', label: 'Understood' }] });
  });
  return out;
}

export function resolveInbox(g: Game, id: string, choice: string) {
  g.setState(s => {
    const c = g.clubOf(s, s.me), x = (c.inbox || []).find(y => y.id === id); if (!x || x.done) return null;
    const p = x.pid != null ? g.db.P[x.pid] : null;
    if (p) {
      if (x.kind === 'avail') { if (choice === 'yes') p.minMin = 6; else p.moodAdj = (p.moodAdj || 0) - 8; }
      if (x.kind === 'protect') { if (choice === 'yes') p.protect = true; else p.moodAdj = (p.moodAdj || 0) - 6; }
      if (x.kind === 'feature') { if (choice === 'yes') p.padding = true; else p.moodAdj = (p.moodAdj || 0) - 6; }
      if (x.kind === 'padder') { if (choice === 'yes') p.padding = true; else { p.padding = false; p.moodAdj = (p.moodAdj || 0) - 5; } }
    }
    const inbox = c.inbox.map(y => (y.id === id ? { ...y, done: true, choice } : y));
    return { inbox, log: [{ date: g.fmtS(s.day), day: s.day, text: x.title + ': ' + (x.options.find(o => o.k === choice)?.label || choice) }, ...(s.log || [])] };
  });
}

// At the trade deadline: an unmet mandate becomes a fire sale of the worst contracts.
export function fireSale(g: Game, s: any, tid: number, rosters: any, lgLog: any[]) {
  const P = g.db.P, T = s.teams[tid], ceil = g.ownerCeiling(T.arch) + (T.ceilAdj || 0), sold: string[] = [];
  let guard = 0;
  while (g.payrollOf(rosters[tid]) + (T.capAdj || 0) > ceil && rosters[tid].length > 8 && guard++ < 6) {
    const worst = rosters[tid].slice().sort((a, b) => (P[b].amt - g.fair(P[b].ovr)) - (P[a].amt - g.fair(P[a].ovr)))[0];
    const to = s.teams.filter(t => !g.isUser(s, t.tid) && rosters[t.tid].length < 15).sort((a, b) => g.payrollOf(rosters[a.tid]) - g.payrollOf(rosters[b.tid]))[0];
    rosters[tid] = rosters[tid].filter(x => x !== worst);
    if (to) rosters[to.tid] = [...rosters[to.tid], worst];
    sold.push(P[worst].name + (to ? ' to ' + to.abbr : ' (waived)'));
    lgLog.unshift({ day: s.day, type: 'Trade', teams: T.abbr + (to ? ' · ' + to.abbr : ''), pids: [worst], text: 'Fire sale: the ' + T.region + ' ' + T.name + ' dumped ' + P[worst].name + (to ? ' to ' + to.region + ' for nothing' : '') + ' on the owner’s orders' });
  }
  return sold;
}

export { pick };

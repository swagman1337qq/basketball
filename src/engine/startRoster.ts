// Start-screen option "Give me the most hopeless roster": not just a bad team, but a franchise stuck in
// a hole with no obvious way out. The roster with the worst overall situation (hopelessScore: little
// talent, old, overpaid for years, no young upside) is swapped in, then made worse the ways real
// stuck teams are:
//  - no prospects: young players with real upside go out for veterans about as good today;
//  - old: young rotation players go for veterans past 30;
//  - bad money: three or four mediocre veterans on big contracts with years left, so the payroll sits
//    over the luxury tax with no cap room;
//  - a hole: its best guard goes for a weaker big or wing, so role players start at guard;
//  - bottom five in team rating, but not necessarily last;
//  - picks: this season's first-rounder and another first belong to other teams (hopelessPicks), so
//    losing doesn't even buy a top pick.
import type { Game } from './Game';
import { teamRating } from './ratings';
import { nums } from './cba';

const tp = (p: any) => p.tpot ?? p.pot;
// How stuck a roster is: weak top eight, old, paid far over its worth for years, no young upside.
export function hopelessScore(g: Game, ids: number[]) {
  const P = g.db.P, ps = ids.map(id => P[id]).filter(Boolean), top = ps.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 8);
  const over = ps.reduce((a, p) => a + Math.max(0, p.amt - g.fair(p.ovr)) * Math.max(1, (p.exp || 2027) - 2026), 0);
  const upside = ps.filter(p => p.age <= 24).reduce((a, p) => a + Math.max(0, tp(p) - 56), 0);
  const age = top.reduce((a, p) => a + p.age, 0) / Math.max(1, top.length);
  return (56 - teamRating(P, ids)) * 1.2 + over / 12 + (age - 27) * 1.5 - upside * 0.8;
}
// The most stuck of the ten weakest rosters (a mid-table team with bad money isn't hopeless yet).
export const hopelessTid = (g: Game, exclude: number[] = []) => { const P = g.db.P, R = g.db.rosters;
  return g.db.teams.map((t: any) => t.tid as number).filter(t => !exclude.includes(t)).sort((a, b) => teamRating(P, R[a]) - teamRating(P, R[b])).slice(0, 10).sort((a, b) => hopelessScore(g, R[b]) - hopelessScore(g, R[a]))[0]; };

export function makeHopeless(g: Game, tids: number[]) {
  const d = g.db, P = d.P, done: number[] = [], N = nums(g);
  tids.forEach(mine => {
    const pick = hopelessTid(g, done);
    if (pick != null && pick !== mine) { [d.rosters[mine], d.rosters[pick]] = [d.rosters[pick], d.rosters[mine]]; const a = d.teams[mine], b = d.teams[pick]; [a.str, b.str] = [b.str, a.str]; }
    done.push(mine);
    const keepOut = [...new Set([...tids, ...done])], others = () => d.teams.map((t: any) => t.tid as number).filter(t => !keepOut.includes(t));
    const R = () => d.rosters[mine].map((id: number) => P[id]), tr = (t: number) => teamRating(P, d.rosters[t]);
    const put = (t: number | 'fa', out: number, inn: number) => { const L = t === 'fa' ? d.fa : d.rosters[t]; L[L.indexOf(out)] = inn; };
    const swap = (p: any, q: any, t: number | 'fa') => { put(mine, p.id, q.id); put(t, q.id, p.id); p.yrsWith = 0; q.yrsWith = 0; };
    const pool = () => [...others().flatMap(t => d.rosters[t].map((id: number) => ({ q: P[id], t: t as number | 'fa' }))), ...d.fa.map((id: number) => ({ q: P[id], t: 'fa' as number | 'fa' }))].filter(({ q }) => q && q.r && !q.ntc && !q.rookie);
    // Trade p for the closest match among the players `ok` accepts (same position group first, a team
    // before free agency, similar level and salary so payrolls hold).
    const swapFor = (p: any, ok: (q: any) => boolean) => {
      const m = pool().filter(({ q }) => ok(q)).sort((a, b) => (a.q.grp === p.grp ? 0 : 1) - (b.q.grp === p.grp ? 0 : 1) || (a.t === 'fa' ? 1 : 0) - (b.t === 'fa' ? 1 : 0) || (Math.abs(p.ovr - a.q.ovr) + Math.abs(a.q.amt - p.amt) * 0.4) - (Math.abs(p.ovr - b.q.ovr) + Math.abs(b.q.amt - p.amt) * 0.4))[0];
      if (m) swap(p, m.q, m.t); return !!m;
    };
    // 1. No prospects: young players with real upside leave; at most one modest one stays.
    const young = R().filter(p => p.age <= 24 && tp(p) >= 55).sort((a, b) => tp(a) - tp(b));
    const stay = young.length && tp(young[0]) < 59 ? young[0].id : null;
    young.filter(p => p.id !== stay).forEach(p => swapFor(p, q => q.age >= 28 && tp(q) - q.ovr <= 2 && q.ovr <= p.ovr + 1 && q.ovr >= p.ovr - 7));
    // 2. Old: the rotation's young players go for veterans past 30 until the top nine averages 29+.
    for (let i = 0; i < 4; i++) {
      const rot = R().sort((a, b) => b.ovr - a.ovr).slice(0, 9), avg = rot.reduce((a, p) => a + p.age, 0) / rot.length;
      const kid = rot.filter(p => p.age <= 26).sort((a, b) => a.age - b.age)[0]; if (avg >= 29 || !kid) break;
      if (!swapFor(kid, q => q.age >= 30 && q.ovr <= kid.ovr + 1 && q.ovr >= kid.ovr - 4)) break;
    }
    // 3. A hole: the best guard goes for a weaker big or wing, so role players start at guard.
    const g1 = R().filter(p => p.grp === 'G').sort((a, b) => b.ovr - a.ovr)[0];
    if (g1 && g1.ovr >= 50) swapFor(g1, q => q.grp !== 'G' && q.age >= 27 && q.ovr <= g1.ovr - 3 && q.ovr >= g1.ovr - 9);
    // 4. Bottom five, but not necessarily last: the best player goes for a weaker veteran from the
    // weakest of the rest until it fits.
    for (let i = 0; i < 12; i++) {
      const fifth = others().map(tr).sort((a, b) => a - b)[4]; if (fifth == null || tr(mine) <= fifth) break;
      const top = R().sort((a, b) => b.ovr - a.ovr), best = top[i % 3] || top[0]; // the best three take turns
      if (!swapFor(best, q => q.age >= 27 && tp(q) - q.ovr <= 3 && q.ovr < best.ovr - 1 && q.ovr >= best.ovr - 9) && !swapFor(best, q => q.ovr < best.ovr - 1 && q.ovr >= best.ovr - 10 && tp(q) - q.ovr <= 5)) break;
    }
    // 5. Bad money: mediocre veterans in the rotation on big deals with years left (one with a player
    // option at the end), until the payroll is over the luxury tax.
    const pay = () => R().reduce((a, p) => a + p.amt, 0);
    const mids = R().filter(p => p.age >= 26 && p.ovr >= 44 && p.ovr <= 58 && p.ctype !== 'rookie').sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    mids.forEach((p, i) => {
      if (i >= 3 && pay() > N.TAX + 4) return;
      const amt = Math.min(g.MAXC * 0.6, Math.max(g.fair(p.ovr) * 2.3, N.CAP * (0.11 + 0.02 * (3 - Math.min(3, i))) + (p.ovr - 45) * 0.5));
      p.amt = +amt.toFixed(2); p.exp = 2027 + (i === 0 ? 4 : 3); p.ctype = 'standard'; p.raise = 0.05; p.badDeal = 1;
      p.opt = i === 1 ? { kind: 'player', season: p.exp } : undefined;
    });
    for (let i = 0; i < 8 && pay() < N.TAX + 2; i++) { const p = mids[i % Math.max(1, mids.length)]; if (!p) break; p.amt = +Math.min(g.MAXC * 0.6, p.amt + (N.TAX + 3 - pay()) / 2).toFixed(2); }
    for (let i = 0; i < 6 && pay() > N.AP2 - 2; i++) { const p = R().filter(x => !x.badDeal).sort((a, b) => b.amt - a.amt)[0]; if (!p) break; p.amt = +Math.max(g.fair(p.ovr), p.amt - (pay() - (N.AP2 - 4))).toFixed(2); }
    const top8 = R().map(p => p.ovr).sort((a, b) => b - a).slice(0, 8); d.teams[mine].str = top8.reduce((a, b) => a + b, 0) / Math.max(1, top8.length);
  });
}

// This season's first-round pick and the one two years out belong to contenders (traded away in the
// years before you arrived), and next year's second-rounder to someone else.
export function hopelessPicks(g: Game, s: any, tids: number[]) {
  const Y = g.Y, P = g.db.P, rate = (t: number) => teamRating(P, s.rosters[t]);
  const buyers = s.teams.map((t: any) => t.tid).filter((t: number) => !tids.includes(t)).sort((a: number, b: number) => rate(b) - rate(a));
  let i = 0;
  const give = (a: any) => { if (a && buyers.length) { a.owner = buyers[i % Math.min(6, buyers.length)]; i += 2; } };
  tids.forEach(mine => {
    give(s.assets.find((a: any) => a.orig === mine && a.owner === mine && a.rd === 1 && a.yr === Y));
    give(s.assets.find((a: any) => a.orig === mine && a.owner === mine && a.rd === 1 && a.yr === Y + 2));
    give(s.assets.find((a: any) => a.orig === mine && a.owner === mine && a.rd === 2 && a.yr === Y + 1));
  });
}

const ordinal = (n: number) => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
// What you inherited, for the welcome notice.
export function hopelessReport(g: Game, s: any, tid: number): string[] {
  const P = g.db.P, N = nums(g), ids = s.rosters[tid] || [], ps = ids.map((id: number) => P[id]), T = s.teams;
  const pay = ps.reduce((a: number, p: any) => a + p.amt, 0), top9 = ps.slice().sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 9);
  const bad = ps.filter((p: any) => p.badDeal || (p.amt > g.fair(p.ovr) * 1.6 && p.exp > g.Y)).sort((a: any, b: any) => b.amt - a.amt);
  const owed = (s.assets || []).filter((a: any) => a.orig === tid && a.owner !== tid && a.rd === 1).map((a: any) => a.yr + ' first (to ' + T[a.owner].abbr + ')');
  const kid = ps.filter((p: any) => p.age <= 24).sort((a: any, b: any) => tp(b) - tp(a))[0];
  const rank = 1 + T.filter((t: any) => teamRating(P, s.rosters[t.tid]) < teamRating(P, ids)).length;
  return [
    pay >= N.TAX ? 'Payroll $' + pay.toFixed(1) + 'M: $' + (pay - N.TAX).toFixed(1) + 'M over the luxury tax, so no cap room and only the taxpayer exceptions.' : 'Payroll $' + pay.toFixed(1) + 'M: $' + (pay - N.CAP).toFixed(1) + 'M over the cap and just under the luxury tax, so no cap room.',
    'Bad contracts: ' + bad.slice(0, 4).map((p: any) => p.name + ' (' + p.ovr + ' ovr, $' + p.amt.toFixed(1) + 'M through ' + p.exp + ')').join(', ') + '.',
    'Draft picks owed: ' + (owed.length ? owed.join(', ') : 'none') + '. Losing won’t bring a top pick this year.',
    'An old rotation: the top nine average ' + (top9.reduce((a: number, p: any) => a + p.age, 0) / Math.max(1, top9.length)).toFixed(1) + ' years old. The team rating is the ' + (rank === 1 ? 'lowest' : ordinal(rank) + '-lowest') + ' of ' + T.length + '.',
    kid ? 'Best young player: ' + kid.name + ' (' + kid.age + ', potential ' + kid.pot + ').' : 'No young players to speak of.',
  ];
}

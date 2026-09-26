// The collective bargaining agreement: salary cap, tax and aprons, every contract type
// and signing mechanism, extensions, trades, waivers and the calendar that governs them.
// Rules follow the 2023 NBA CBA. Dollar figures are the CBA's real ratios to the salary
// cap (so everything scales when the cap grows, which it does by up to 10% a year).
import type { Game } from './Game';

// ── League calendar (82 game days spread from late October to mid-April) ────────────
export const DAY = { PLAYOFF_WAIVE: 61, TRADE_DEADLINE: 50, TEN_DAY_START: 36, DPE_DEADLINE: 66, SIGNEE_TRADE: 26, INSEASON_SIGNEE_WAIT: 42, TEN_DAY_LEN: 5, TWO_WAY_GAMES: 50 };

// Roster limits: 15 standard contracts in season (21 in the offseason and training camp),
// plus up to 3 two-way players who don't count against the 15 or the cap. Minimum 14.
export const isTwoWay = (p: any) => p?.ctype === 'twoWay';
export const stdIds = (g: Game, ids: number[]) => (ids || []).filter(id => !isTwoWay(g.db.P[id]));
export const twoWayIds = (g: Game, ids: number[]) => (ids || []).filter(id => isTwoWay(g.db.P[id]));
export const rosterMax = (s: any) => (s.phase === 'regular' || s.phase === 'playin' || s.phase === 'playoffs' ? 15 : 21);
export const ROSTER_MIN = 14, TWO_WAY_MAX = 3;
// A point on the league calendar, for exceptions that last a year (traded player exceptions).
export const stamp = (g: Game, s: any) => g.Y * 1000 + (s.phase === 'preseason' ? 50 : s.phase === 'regular' ? 100 + s.day : 300);

// ── Numbers as a share of the cap (2025–26 figures ÷ that season's cap) ─────────────
const PCT = {
  NTMLE: 0.0912, TPMLE: 0.0368, ROOM: 0.0568, BAE: 0.0332, E10_BONUS: 0.0005,
  TRADE_SMALL: 0.0551, TRADE_BIG: 0.2132, TRADE_BUF: 0.00184, TAX_STEP: 0.0368,
};
// Minimum salary by years of service (0 … 10+).
const MIN_PCT = [0.00823, 0.01325, 0.01485, 0.01538, 0.01592, 0.01725, 0.01859, 0.01992, 0.02126, 0.02136, 0.0235];
// Rookie scale, year 1 at 100% of scale, by pick (share of cap). Teams sign at 120%.
const ROOKIE_PCT = [7.45, 6.66, 5.98, 5.39, 4.88, 4.43, 4.04, 3.69, 3.37, 3.21, 3.04, 2.89, 2.75, 2.61, 2.48, 2.35, 2.26, 2.16, 2.07, 1.99, 1.91, 1.83, 1.76, 1.69, 1.63, 1.58, 1.54, 1.49, 1.47, 1.45].map(x => x / 100);

export function nums(g: Game) {
  const C = g.db.caps, CAP = C.CAP;
  return {
    CAP, TAX: C.TAX, AP1: C.AP1, AP2: C.AP2, FLOOR: C.MINP,
    NTMLE: +(CAP * PCT.NTMLE).toFixed(2), TPMLE: +(CAP * PCT.TPMLE).toFixed(2), ROOM: +(CAP * PCT.ROOM).toFixed(2), BAE: +(CAP * PCT.BAE).toFixed(2),
    TRADE_SMALL: CAP * PCT.TRADE_SMALL, TRADE_BIG: CAP * PCT.TRADE_BIG, TRADE_BUF: CAP * PCT.TRADE_BUF, TAX_STEP: CAP * PCT.TAX_STEP,
    E10_BONUS: CAP * PCT.E10_BONUS, TWO_WAY: +(CAP * MIN_PCT[0] * 0.5).toFixed(2),
    min: (yos: number) => +(CAP * MIN_PCT[Math.max(0, Math.min(10, yos))]).toFixed(2),
    max: (yos: number, tier: 'rose' | 'super' | null = null) => +(CAP * (tier === 'super' ? 0.35 : tier === 'rose' ? 0.3 : yos >= 10 ? 0.35 : yos >= 7 ? 0.3 : 0.25)).toFixed(2),
    rookie: (pick: number) => +(CAP * ROOKIE_PCT[Math.max(0, Math.min(29, pick - 1))] * 1.2).toFixed(2),
  };
}

// Years of service: seasons in the league before this one.
export function yosOf(g: Game, p: any) {
  if (p.yos0 == null) p.yos0 = p.cls ? 0 : Math.max(0, 2026 - (p.draft || 2026));
  const played = new Set((p.stats || []).filter(r => !r.po && r.season < g.Y && r.season >= 2027).map(r => r.season)).size;
  return p.yos0 + played;
}

// Honors that unlock the higher maximums (Rose Rule and Designated Veteran "supermax"):
// MVP in any of the last three seasons, or All-League / Defensive Player of the Year in
// the last season or in two of the last three.
export function honorsQualify(s: any, pid: number, Y: number) {
  const A = s.awards || {}, seasons = [Y, Y - 1, Y - 2].map(y => A[y]).filter(Boolean);
  const mvp = seasons.some(a => (a.list?.MVP?.[0]?.pid ?? a.mvp?.[0]?.pid) === pid);
  const hon = (a: any) => (a.allLeague || []).some(t => t.includes(pid)) || (a.list?.DPOY?.[0]?.pid ?? a.dpoy?.[0]?.pid) === pid;
  const last = A[Y] || A[Y - 1];
  return mvp || (last && hon(last)) || seasons.filter(hon).length >= 2;
}

// Maximum first-year salary for a new contract or extension with this team.
export function maxFor(g: Game, s: any, p: any, tid: number, kind: 'rookieExt' | 'vetExt' | 'fa' = 'fa') {
  const N = nums(g), yos = yosOf(g, p);
  if (kind === 'rookieExt' && honorsQualify(s, p.id, g.Y)) return { amt: N.max(yos, 'rose'), tier: 'Rose Rule (30%)' };
  const withTeam = (p.draftTid === tid || p.rookieTid === tid) && !p.leftAsFA;
  if (yos >= 7 && yos <= 9 && withTeam && honorsQualify(s, p.id, g.Y) && (kind === 'vetExt' || p.birdTid === tid)) return { amt: N.max(yos, 'super'), tier: 'Designated veteran "supermax" (35%)' };
  return { amt: N.max(yos), tier: (yos >= 10 ? '35%' : yos >= 7 ? '30%' : '25%') + ' max for ' + yos + ' years of service' };
}

// Bird rights of a team over a player (on its roster, or its own free agent).
export function birdOf(p: any, tid: number): 'full' | 'early' | 'non' | null {
  const own = p.birdTid === tid;
  if (!own) return null;
  const y = p.yrsWith || 0;
  return y >= 3 ? 'full' : y >= 2 ? 'early' : 'non';
}
export const BIRD_LABEL = { full: 'Full Bird', early: 'Early Bird', non: 'Non-Bird' };

export function avgSalary(g: Game, s: any) {
  const P = g.db.P, all = Object.values(s.rosters).flat() as number[];
  return all.reduce((a, id) => a + (P[id].amt || 0), 0) / Math.max(1, all.length);
}

// Cap hold of an unsigned free agent the team still has rights to.
export function capHold(g: Game, s: any, p: any) {
  const N = nums(g), prev = p.prevAmt || p.amt || N.min(0), lvl = birdOf(p, p.birdTid);
  if (p.rfa) return Math.max(p.rfa.qo, p.rookieScale ? prev * 2.5 : prev * 1.2);
  const r = lvl === 'full' ? (prev >= avgSalary(g, s) ? 1.9 : 1.5) : lvl === 'early' ? 1.3 : 1.2;
  return +Math.min(maxFor(g, s, p, p.birdTid).amt, Math.max(N.min(yosOf(g, p)), prev * r)).toFixed(2);
}

// ── Team cap state (kept for every team in s.cap[tid]) ────────────────────────────
export function capState(s: any, tid: number) {
  const c = (s.cap || {})[tid] || {};
  return { dead: c.dead || [], tpe: c.tpe || [], twoWay: c.twoWay || [], exc: c.exc || null, hardCap: c.hardCap ?? null, baeLast: c.baeLast ?? null, renounced: c.renounced || [], frozen: !!c.frozen };
}
export function setCap(s: any, tid: number, patch: any) { return { ...(s.cap || {}), [tid]: { ...((s.cap || {})[tid] || {}), ...patch } }; }

export function deadThis(g: Game, s: any, tid: number, season = g.Y) { return capState(s, tid).dead.reduce((a, d) => a + (d.amts?.[season] || 0), 0); }

// Team salary for cap, tax and apron purposes (plus holds/incomplete-roster charges when asked).
export function teamSalary(g: Game, s: any, tid: number, opts: { holds?: boolean } = {}) {
  const P = g.db.P, N = nums(g), T = s.teams[tid], ids = s.rosters[tid] || [];
  let sal = ids.reduce((a, id) => a + g.capHit(P[id]), 0) + deadThis(g, s, tid) + (T?.capAdj || 0);
  if (opts.holds) {
    const cs = capState(s, tid), holds = (s.fa || []).filter(id => P[id].birdTid === tid && !cs.renounced.includes(id)).map(id => capHold(g, s, P[id]));
    sal += holds.reduce((a, b) => a + b, 0);
    const n = ids.length + holds.length; if (n < 12) sal += (12 - n) * N.min(0); // incomplete-roster charge
  }
  return +sal.toFixed(2);
}
export function capRoom(g: Game, s: any, tid: number) { return +(nums(g).CAP - teamSalary(g, s, tid, { holds: s.phase === 'fa' || s.phase === 'draft' })).toFixed(2); }

// Exceptions available this season. Reset when free agency opens.
export function freshExceptions(g: Game) { const N = nums(g); return { ntmle: N.NTMLE, tpmle: N.TPMLE, room: N.ROOM, bae: N.BAE, used: [] as string[] }; }
export function exceptionsOf(g: Game, s: any, tid: number) { return capState(s, tid).exc || freshExceptions(g); }

// ── Signing: every way a team can sign a player, with its limits ───────────────────
export interface Method { key: string; label: string; maxFirst: number; maxYears: number; raise: number; hardCap?: 'AP1' | 'AP2'; note: string; ok: boolean; why?: string; minFirst?: number }

export function signingMethods(g: Game, s: any, tid: number, p: any): Method[] {
  const N = nums(g), yos = yosOf(g, p), minS = N.min(yos), max = maxFor(g, s, p, tid).amt;
  const sal = teamSalary(g, s, tid), room = capRoom(g, s, tid), exc = exceptionsOf(g, s, tid), cs = capState(s, tid), Y = g.Y;
  const phase = s.phase, inSeason = phase === 'regular', pre = phase === 'preseason', off = phase === 'fa' || phase === 'draft' || pre;
  const stdCount = stdIds(g, s.rosters[tid] || []).length, twCount = twoWayIds(g, s.rosters[tid] || []).length, lim = rosterMax(s);
  const hard = cs.hardCap === 'AP1' ? N.AP1 : cs.hardCap === 'AP2' ? N.AP2 : Infinity;
  const lvl = birdOf(p, tid), prev = p.prevAmt || p.amt || minS, age = p.age;
  const yearsCap = (n: number) => (n >= 4 && age + n - 1 > 38 ? Math.max(1, 38 - age + 1, 3) : n); // over-38 rule
  // A hard cap (the team's, or the one this method triggers) also limits the first-year salary.
  const m = (key, label, maxFirst, maxYears, raise, note, ok = true, why?, hardCap?, minFirst?): Method => {
    const lim = Math.min(hard, hardCap === 'AP1' ? N.AP1 : hardCap === 'AP2' ? N.AP2 : Infinity), fit = key === 'twoWay' ? Infinity : lim - sal;
    const mf = +Math.min(max, maxFirst, fit).toFixed(2);
    if (ok && fit < Math.min(maxFirst, minS) - 0.005) { ok = false; why = why || 'Would put you over the ' + (lim === N.AP1 ? '1st' : '2nd') + ' apron'; }
    return { key, label, maxFirst: Math.max(0, mf), maxYears: yearsCap(maxYears), raise, note, ok, why, hardCap, minFirst };
  };
  const out: Method[] = [];
  if (p.rfa && p.rfa.tid !== tid) {
    const arenas = yos <= 2; // Gilbert Arenas provision
    out.push(m('offer', 'Offer sheet (restricted FA)', arenas ? Math.max(room, N.NTMLE) : Math.max(room, 0) || N.NTMLE, 4, 0.05, (arenas ? 'Arenas provision: first-year salary limited to the mid-level (' + N.NTMLE + 'M). ' : '') + 'His team has 2 days to match.', room > 0 || arenas || !exc.used.includes('ntmle'), room <= 0 && !arenas && exc.used.includes('ntmle') ? 'No cap room or mid-level left' : undefined));
  }
  if (lvl) {
    const lim = lvl === 'full' ? max : lvl === 'early' ? Math.max(prev * 1.75, avgSalary(g, s) * 1.05) : Math.max(prev * 1.2, minS * 1.2);
    out.push(m('bird', BIRD_LABEL[lvl] + ' rights', lim, lvl === 'early' ? 4 : 5, 0.08, lvl === 'full' ? 'Exceed the cap up to his max.' : lvl === 'early' ? 'Up to 175% of his last salary or 105% of the average salary; at least 2 years.' : 'Up to 120% of his last salary.', sal + minS <= hard, sal + minS > hard ? 'Hard-capped' : undefined, undefined, lvl === 'early' ? undefined : undefined));
  }
  if (room > 0) out.push(m('cap', 'Cap space', room, 4, 0.05, 'Fits under the cap (' + room.toFixed(1) + 'M of room, counting cap holds).'));
  // The room exception: for teams that used their cap room and are now below it (or at it).
  if (exc.used.includes('cap') && !exc.used.includes('room') && sal <= N.CAP + exc.room) out.push(m('room', 'Room exception', exc.room, 2, 0.05, 'For teams that used cap space: up to ' + exc.room + 'M, 2 years.'));
  if (!exc.used.includes('cap')) {
    const ntOk = exc.ntmle > 0.1 && sal + minS <= N.AP1 && hard >= N.AP1;
    out.push(m('ntmle', 'Non-taxpayer mid-level', exc.ntmle, 4, 0.05, 'Up to ' + exc.ntmle.toFixed(2) + 'M left, 4 years; hard-caps you at the 1st apron.', ntOk, ntOk ? undefined : exc.ntmle <= 0.1 ? 'Already used' : 'Would put you over the 1st apron', 'AP1'));
    const tpOk = exc.tpmle > 0.1 && sal + minS <= N.AP2 && !exc.used.includes('ntmle');
    out.push(m('tpmle', 'Taxpayer mid-level', exc.tpmle, 2, 0.05, 'Up to ' + exc.tpmle.toFixed(2) + 'M, 2 years; hard-caps you at the 2nd apron.', tpOk, tpOk ? undefined : exc.used.includes('ntmle') ? 'You used the non-taxpayer mid-level' : 'Not available above the 2nd apron', 'AP2'));
    const baeOk = exc.bae > 0.1 && cs.baeLast !== Y - 1 && sal + minS <= N.AP1;
    out.push(m('bae', 'Bi-annual exception', exc.bae, 2, 0.05, 'Up to ' + exc.bae.toFixed(2) + 'M, 2 years; not in back-to-back seasons; hard-caps you at the 1st apron.', baeOk, baeOk ? undefined : cs.baeLast === Y - 1 ? 'Used last season' : exc.bae <= 0.1 ? 'Already used' : 'Would put you over the 1st apron', 'AP1'));
  }
  const dpe = (s.cap?.[tid]?.dpe);
  if (dpe && inSeason && s.day <= DAY.DPE_DEADLINE) out.push(m('dpe', 'Disabled player exception', dpe.amt, 1, 0, 'Replaces ' + (g.db.P[dpe.pid]?.name || 'an injured player') + ': one season, up to ' + dpe.amt.toFixed(2) + 'M.'));
  const minOk = sal + minS <= hard;
  out.push(m('min', 'Minimum exception', minS, 2, 0.05, 'The ' + yos + '-year minimum (' + minS.toFixed(2) + 'M); over the cap is fine.' + (yos >= 2 ? ' One-year deals count as the 2-year minimum on your cap; the league pays the rest.' : ''), minOk, minOk ? undefined : 'Hard-capped', undefined, minS));
  if (yos <= 3) out.push(m('twoWay', 'Two-way contract', N.TWO_WAY, 2, 0, 'Up to 3 per team, for players with under 4 years of service; off the 15-man roster and the cap; up to 50 NBA games a season.', twCount < TWO_WAY_MAX, twCount >= TWO_WAY_MAX ? 'You already have 3 two-way players' : undefined));
  if (pre || phase === 'fa') out.push(m('ex10', 'Exhibit 10 (training camp)', minS, 1, 0, 'One-year, non-guaranteed minimum deal for camp. Convert him to a two-way before opening night, keep him (he becomes a standard contract) or waive him for nothing; if waived and he joins your G League team he earns a bonus of up to ' + N.E10_BONUS.toFixed(2) + 'M.', stdCount < 21, stdCount >= 21 ? 'Camp roster full (21)' : undefined));
  if (inSeason && s.day >= DAY.TEN_DAY_START) { const n = (p.tenDayWith || {})[tid] || 0; out.push(m('tenDay', '10-day contract', +(minS * 10 / 174).toFixed(3), 0, 0, 'Prorated minimum for 10 days; at most two with the same team, then rest of season.', n < 2, n >= 2 ? 'Two 10-days used: sign him for the rest of the season' : undefined)); }
  const injured = (s.rosters[tid] || []).filter(id => g.db.P[id].inj && !g.db.P[id].inj.dtd).length;
  if (inSeason && injured >= 4 && stdCount >= 15) out.push(m('hardship', 'Hardship exception', minS, 0, 0, injured + ' players out: a 16th player on a non-guaranteed minimum deal until the roster is healthy.'));
  // Roster room.
  void off;
  return out.map(x => {
    if (['twoWay', 'ex10', 'hardship'].includes(x.key)) return x;
    if (stdCount >= lim) return { ...x, ok: false, why: 'Roster full (' + lim + (lim === 15 ? ' in season' : ' in the offseason') + ')' };
    return x;
  });
}

// ── Trades: salary matching and apron rules, checked for both teams ────────────────
export function matchLimit(g: Game, out: number, after: number) {
  const N = nums(g);
  if (after > N.AP1) return out; // above the 1st apron: 100%
  if (out <= N.TRADE_SMALL) return out * 2 + N.TRADE_BUF;
  if (out <= N.TRADE_BIG) return out + N.TRADE_SMALL;
  return out * 1.25 + N.TRADE_BUF;
}
export function checkTrade(g: Game, s: any, a: number, b: number, fromA: number[], fromB: number[], picksA: string[], picksB: string[]) {
  const P = g.db.P, N = nums(g), errs: string[] = [], notes: string[] = [];
  const hit = (ids: number[]) => ids.reduce((x, id) => x + tradeHit(g, P[id]), 0);
  const side = (tid: number, out: number[], inn: number[]) => {
    const T = s.teams[tid], before = teamSalary(g, s, tid), o = hit(out), i = hit(inn), after = +(before - o + i).toFixed(2), cs = capState(s, tid);
    const nm = T.abbr;
    if (after > N.CAP && i > 0) {
      const tpe = cs.tpe.filter(t => t.until > stamp(g, s) && t.amt + N.TRADE_BUF >= i && out.length === 0 && inn.length === 1)[0];
      if (tpe && after <= N.AP1) notes.push(nm + ' absorbs ' + P[inn[0]].name + ' into its ' + tpe.amt.toFixed(2) + 'M traded player exception.');
      else if (i > matchLimit(g, o, after) + 1e-6) errs.push(nm + ' takes back ' + i.toFixed(2) + 'M for ' + o.toFixed(2) + 'M out; over the cap it may take back at most ' + matchLimit(g, o, after).toFixed(2) + 'M' + (after > N.AP1 ? ' (100% above the 1st apron)' : '') + '.');
    }
    if (after > N.AP2 && out.length > 1 && i > 0) errs.push(nm + ' would be above the 2nd apron: it can’t aggregate salaries (' + out.length + ' players out).');
    if (cs.hardCap === 'AP1' && after > N.AP1) errs.push(nm + ' is hard-capped at the 1st apron (' + N.AP1 + 'M) this season.');
    if (cs.hardCap === 'AP2' && after > N.AP2) errs.push(nm + ' is hard-capped at the 2nd apron (' + N.AP2 + 'M) this season.');
    const std = stdIds(g, s.rosters[tid] || []).length - stdIds(g, out).length + stdIds(g, inn).length, lim = rosterMax(s); if (std > lim && std > stdIds(g, s.rosters[tid] || []).length) errs.push(nm + ' would have ' + std + ' players (' + lim + ' max).');
    // Newly signed players can't be traded yet.
    out.forEach(id => { const q = P[id], sg = q.signed; if (!sg) return;
      const wait = sg.season === g.Y && (sg.phase === 'fa' || sg.phase === 'draft' || sg.phase === 'preseason') ? (s.phase === 'regular' ? s.day < DAY.SIGNEE_TRADE : true) : sg.season === g.Y && sg.phase === 'regular' ? s.day - sg.day < DAY.INSEASON_SIGNEE_WAIT : false;
      if (wait && !s.god) errs.push(q.name + ' signed recently and can’t be traded until ' + (sg.phase === 'regular' ? g.fmtS(sg.day + DAY.INSEASON_SIGNEE_WAIT) : g.fmtS(DAY.SIGNEE_TRADE)) + '.'); });
    out.forEach(id => { if (P[id].ntc && !s.god) errs.push(P[id].name + ' has a no-trade clause and won’t waive it.'); });
    if (s.phase === 'regular' && s.day > DAY.TRADE_DEADLINE) errs.push('The trade deadline (' + g.fmtS(DAY.TRADE_DEADLINE) + ') has passed.');
    // TPE created when sending out more than taking back (over the cap, single-player out).
    if (after > N.CAP && o > i && out.length === 1) notes.push(nm + ' creates a ' + (o - i).toFixed(2) + 'M traded player exception (one year).');
    return { after };
  };
  side(a, fromA, fromB); side(b, fromB, fromA);
  // Stepien rule: a team can't be without a first-round pick in consecutive future drafts.
  [[a, picksA], [b, picksB]].forEach(([tid, give]: any) => { const own = s.assets.filter(k => k.owner === tid && k.rd === 1 && !give.includes(k.id)); const yrs = [...new Set(s.assets.filter(k => k.rd === 1).map(k => k.yr))].sort() as number[];
    for (let i = 1; i < yrs.length; i++) if (!own.some(k => k.yr === yrs[i]) && !own.some(k => k.yr === yrs[i - 1])) { errs.push(s.teams[tid].abbr + ' would have no first-round pick in both ' + yrs[i - 1] + ' and ' + yrs[i] + ' (Stepien rule).'); break; } });
  // 2nd apron: a team above it can't trade its first-round pick furthest in the future.
  [[a, picksA], [b, picksB]].forEach(([tid, give]: any) => { if (teamSalary(g, s, tid) <= N.AP2) return; const far = Math.max(...s.assets.filter(k => k.rd === 1).map(k => k.yr));
    if (give.some(id => { const k = s.assets.find(x => x.id === id); return k && k.rd === 1 && k.yr === far; })) errs.push(s.teams[tid].abbr + ' is above the 2nd apron, so its ' + far + ' first-round pick is frozen.'); });
  return { ok: errs.length === 0, errs: [...new Set(errs)], notes };
}
// Salary a player counts for in a trade (trade kickers add their bonus, up to the max).
export function tradeHit(g: Game, p: any) { const base = g.capHit(p); return p.kicker ? Math.min(base * (1 + p.kicker), base + (p.amt * p.kicker)) : base; }

// ── Luxury tax (incremental brackets; repeaters pay a point more per bracket) ────────
export function taxBill(g: Game, payroll: number, repeater: boolean) {
  // Brackets of about $5.7M: 1.50, 1.75, 2.50, 3.25, then +0.50 each; repeaters +1.00.
  const N = nums(g), RATES = [1.5, 1.75, 2.5, 3.25]; let over = payroll - N.TAX, bill = 0, k = 0;
  while (over > 0) { const rate = (k < 4 ? RATES[k] : 3.25 + 0.5 * (k - 3)) + (repeater ? 1 : 0); bill += Math.min(N.TAX_STEP, over) * rate; over -= N.TAX_STEP; k++; }
  return +bill.toFixed(2);
}

// ── Waivers: dead money, the stretch provision, buyouts ────────────────────────────
export function remainingGuaranteed(g: Game, s: any, p: any) {
  const out: Record<number, number> = {}; if (['ex10', 'tenDay', 'hardship', 'twoWay'].includes(p.ctype)) return out; // non-guaranteed
  const frac = s.phase === 'regular' ? Math.max(0, 1 - s.day / 82) : s.phase === 'playin' || s.phase === 'playoffs' ? 0 : 1;
  for (let y = g.Y; y <= p.exp; y++) { if (p.opt?.kind === 'team' && y === p.opt.season) break; const sal = g.salAt(p, y); out[y] = +(y === g.Y ? sal * frac : sal).toFixed(2); }
  if (s.phase === 'fa' || s.phase === 'draft' || s.phase === 'lottery') delete out[g.Y];
  return out;
}
export function deadSchedule(g: Game, s: any, p: any, stretch: boolean, giveBack = 0) {
  const rem = remainingGuaranteed(g, s, p), yrs = Object.keys(rem).map(Number).sort();
  const total = yrs.reduce((a, y) => a + rem[y], 0) * (1 - giveBack);
  if (!stretch || !yrs.length) { const o: Record<number, number> = {}; yrs.forEach(y => (o[y] = +(rem[y] * (1 - giveBack)).toFixed(2))); return o; }
  // Stretch: spread over twice the remaining years plus one.
  const first = yrs[0], n = yrs.length * 2 + 1, o: Record<number, number> = {};
  for (let i = 0; i < n; i++) o[first + i] = +(total / n).toFixed(2);
  return o;
}

// ── Rookie contracts and qualifying offers ─────────────────────────────────────────
export function rookieDeal(g: Game, pick: number, rd: number) {
  const N = nums(g);
  if (rd === 1) return { amt: N.rookie(pick), years: 4, raise: 0.05, ctype: 'rookie', opts: [g.Y + 3, g.Y + 4] };
  return { amt: N.min(0), years: 2, raise: 0.05, ctype: 'standard', opts: [] as number[] };
}
export function qoFor(g: Game, p: any) {
  const N = nums(g), yos = yosOf(g, p);
  if (p.rookieScale) { const pk = p.rookieScale.pick; return +(p.amt * (1.3 + (Math.min(30, pk) - 1) / 29 * 0.2)).toFixed(2); }
  return +Math.max(p.amt * 1.25, N.min(yos) + N.CAP * 0.0013).toFixed(2);
}
export const qoEligible = (g: Game, p: any) => !!p.rookieScale || yosOf(g, p) <= 3;

// Years with the team and Bird rights carry through trades; they reset when he signs elsewhere.
export function describeContract(g: Game, p: any) {
  const t = p.ctype === 'rookie' ? 'Rookie scale' : p.ctype === 'twoWay' ? 'Two-way' : p.ctype === 'ex10' ? 'Exhibit 10' : p.ctype === 'tenDay' ? '10-day' : p.ctype === 'hardship' ? 'Hardship' : p.ctype === 'max' ? 'Max' : p.ctype === 'min' ? 'Minimum' : 'Veteran';
  return t + (p.opt ? ' · ' + (p.opt.kind === 'player' ? 'player' : 'team') + ' option ' + (p.opt.season - 1) + '–' + String(p.opt.season).slice(2) : '') + (p.kicker ? ' · ' + Math.round(p.kicker * 100) + '% trade kicker' : '') + (p.ntc ? ' · no-trade clause' : '');
}

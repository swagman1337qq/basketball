// The CBA through the league year: signings and releases for the user, the offseason
// (options, qualifying offers, restricted free agency and offer sheets, re-signings),
// AI free agency, draftee contracts, the in-season tick (10-days, hardship, two-way games,
// disabled player exceptions) and the cap side of trades (TPEs, trade kickers).
import type { Game } from './Game';
import { birdOf, capState, checkTrade, DAY, freshExceptions, maxFor, nums, qoEligible, qoFor, ROSTER_MIN, rookieDeal, rosterMax, stamp, stdIds, teamSalary, tradeHit, TWO_WAY_MAX, twoWayIds, yosOf } from './cba';
import { acceptance, aiTerms, applySigning, buyoutBlocked, prefYears, validateSigning, waivePlayer, type Terms } from './contracts';
import { adjustGames } from './overseas';

type Box = { rosters: any; fa: number[]; overseas: number[]; cap: any };
const boxOf = (s: any): Box => ({ rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } });
const shuffle = (a: any[]): any[] => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

// Per-team log lines for managed clubs, folded into one state patch.
export function clubLogs(g: Game, s: any, by: Record<number, string[]>, day = s.day) {
  let clubs = { ...(s.clubs || {}) }, top: any = {};
  Object.keys(by).forEach(k => { const t = +k, lines = by[t]; if (!lines?.length || !g.isUser(s, t)) return;
    const st = { ...s, ...top, clubs }, c = g.clubOf(st, t), pt = g.clubPatch(st, t, { log: [...lines.slice().reverse().map(text => ({ date: g.fmtS(day), day, text })), ...((c && c.log) || [])] }, clubs);
    if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; });
  return { ...top, clubs };
}

// What a free agent asks for: market value, his motivation, and never below his minimum.
export function askOf(g: Game, p: any) {
  const minS = nums(g).min(yosOf(g, p));
  return +Math.max(minS, g.fair(p.ovr) * (p.mood === 'Eager' ? 0.9 : p.mood === 'Reluctant' ? 1.2 : 1)).toFixed(2);
}

// Default terms for the signing dialog: the first method that works, his asking price (within
// the method's limit) and the years he prefers.
export function defaultTerms(g: Game, s: any, tid: number, p: any, methods: any[]): Terms {
  const m = methods.find(x => x.ok) || methods[0], ask = s.me === tid ? g.askFor(p, s) : p.ask;
  if (!m) return { method: 'min', amt: nums(g).min(yosOf(g, p)), years: 1 };
  const amt = m.key === 'twoWay' || m.key === 'tenDay' || m.key === 'hardship' || m.key === 'ex10' || m.key === 'min' ? m.maxFirst : +Math.max(m.minFirst || 0, Math.min(m.maxFirst, ask)).toFixed(2);
  const years = m.maxYears <= 0 ? 0 : Math.max(m.key === 'bird' && birdOf(p, tid) === 'early' ? 2 : 1, Math.min(m.maxYears, prefYears(p)));
  return { method: m.key, amt, years };
}

// ── The user signs a player (from the signing dialog in s.dialog) ────────────────────
export function userSign(g: Game) {
  g.setState(s => {
    const dg = s.dialog; if (!dg || dg.type !== 'sign') return null;
    const P = g.db.P, p = P[dg.pid], tid = s.me, T = s.teams, N = nums(g);
    const t: Terms = { method: dg.method, amt: +dg.amt, years: +dg.years, opt: dg.opt || null, kicker: +(dg.kicker || 0) / 100, ntc: !!dg.ntc, inc: (dg.inc || []).map(x => ({ ...x })) };
    const err = (why: string) => ({ dialog: { ...dg, err: why } });
    if (!s.god) {
      if (p.abroad && p.abroad.clause === 'Buyout') return err('His club holds a buyout clause: agree a buyout on the Overseas screen first.');
      if (buyoutBlocked(g, s, tid, p)) return err('Above the 1st apron you can’t sign a player waived this season whose salary was over the mid-level (' + N.NTMLE + 'M).');
      const likely = t.inc!.filter(x => x.likely).reduce((a, x) => a + x.amt, 0);
      const v = validateSigning(g, s, tid, p, { ...t, amt: t.amt + likely }); if (!v.ok) return err(v.why!);
      const val = t.amt + t.inc!.reduce((a, x) => a + x.amt * (x.likely ? 1 : 0.6), 0);
      const acc = acceptance(g, s, tid, p, { ...t, amt: val }); if (!acc.ok) return err(p.name + ' turned it down. ' + acc.why);
    }
    const box = boxOf(s); let lgLog = s.lgLog, log = s.log, offerSheets = s.offerSheets || [];
    // Offer sheet to another team's restricted free agent: they decide right away.
    if (t.method === 'offer' && p.rfa) {
      const orig = p.rfa.tid;
      if (!g.isUser(s, orig) && aiMatches(g, s, orig, p, t)) {
        const line = applySigning(g, s, box, orig, p, { ...t, method: 'bird' });
        return { dialog: null, ...unbox(box), lgLog: [{ day: s.day, type: 'Signing', teams: T[orig].abbr, pids: [p.id], text: line + ' (matched ' + T[tid].abbr + '’s offer sheet)' }, ...lgLog], log: g.logEntry(s, T[orig].region + ' matched your offer sheet for ' + p.name + '. He stays there.') };
      }
      if (g.isUser(s, orig)) { offerSheets = [...offerSheets, { id: 'os' + p.id + '-' + s.day, pid: p.id, from: tid, to: orig, terms: t, day: s.day }]; box.fa = box.fa.filter(x => x !== p.id);
        return { dialog: null, fa: box.fa, offerSheets, log: g.logEntry(s, 'Signed ' + p.name + ' to an offer sheet; ' + T[orig].abbr + ' (also yours) must match or decline') }; }
    }
    let cash = 0;
    if (p.abroad) { // NBA out clause: the fee is cash, and anything above $0.85M counts on the cap this season
      cash = p.abroad.fee; const over = Math.max(0, p.abroad.fee - 0.85);
      if (over > 0) { const c = { ...(box.cap[tid] || {}) }; c.dead = [...(c.dead || []), { pid: p.id, name: p.name + ' (buyout above the allowance)', amts: { [g.Y + (['fa', 'draft', 'lottery'].includes(s.phase) ? 1 : 0)]: +over.toFixed(2) }, mode: 'buyout', season: g.Y }]; box.cap[tid] = c; }
      p.adjust = adjustGames(p); p.overseasArc = { ...(p.overseasArc || {}), back: g.Y, club: p.abroad.club, lg: p.abroad.lg, line: p.abroad.pts + ' pts · ' + p.abroad.reb + ' reb · ' + p.abroad.ast + ' ast', conf: Math.round(p.conf ?? 50) }; delete p.abroad;
    }
    const line = applySigning(g, s, box, tid, p, t);
    lgLog = [{ day: s.day, type: 'Signing', teams: T[tid].abbr, pids: [p.id], text: line }, ...lgLog];
    log = g.logEntry(s, line.replace(T[tid].region + ' ' + T[tid].name + ' signed', 'Signed') + (t.inc!.length ? ' + ' + t.inc!.reduce((a, x) => a + x.amt, 0).toFixed(2) + 'M in incentives' : ''));
    return { dialog: null, ...unbox(box), buyoutCash: (s.buyoutCash || 0) + cash, lgLog, log, news: [g.pressSign(s, p, t.amt, t.inc), ...(s.news || [])] };
  });
}
const unbox = (b: Box) => ({ rosters: b.rosters, fa: b.fa, overseas: b.overseas, cap: b.cap });

// Would an AI team match an offer sheet for its restricted free agent?
function aiMatches(g: Game, s: any, tid: number, p: any, t: Terms) {
  const N = nums(g), after = teamSalary(g, s, tid) + t.amt, ceil = g.ownerCeiling(s.teams[tid].arch);
  const worth = g.fair(p.ovr) * (p.age <= 24 ? 1.25 : 1) >= t.amt * 0.9;
  return worth && after <= Math.max(ceil, N.TAX) + (p.ovr >= 60 ? 15 : 0) && after <= N.AP2 && Math.random() < 0.85;
}

// The user answers an offer sheet another team gave one of their restricted free agents.
export function answerOfferSheet(g: Game, id: string, match: boolean) {
  g.setState(s => {
    const os = (s.offerSheets || []).find(x => x.id === id); if (!os) return null;
    const P = g.db.P, p = P[os.pid], T = s.teams, box = boxOf(s), N = nums(g);
    if (match && !s.god && teamSalary(g, s, os.to) + os.terms.amt > N.AP2 && capState(s, os.to).hardCap) return { tMsg: null, offerMsg: 'Matching would break your hard cap.' };
    const tid = match ? os.to : os.from, line = applySigning(g, s, box, tid, p, match ? { ...os.terms, method: 'bird' } : os.terms);
    const text = match ? T[os.to].region + ' matched ' + T[os.from].abbr + '’s offer sheet for ' + p.name + ': ' + line.split(' · ')[1] : line + ' (' + T[os.to].abbr + ' declined to match)';
    return { ...unbox(box), offerSheets: s.offerSheets.filter(x => x.id !== id), offerMsg: null, lgLog: [{ day: s.day, type: 'Signing', teams: T[tid].abbr, pids: [p.id], text }, ...s.lgLog], ...clubLogs(g, s, { [os.to]: [match ? 'Matched the offer sheet for ' + p.name : 'Let ' + p.name + ' go to ' + T[os.from].abbr + ' (declined to match)'] }) };
  });
}

// ── Releases ────────────────────────────────────────────────────────────────────
// How much of what he's owed a player will give back in a buyout: veterans who want to
// join a contender give more; young players and stars give little.
export function buyoutWilling(g: Game, p: any) { return Math.max(0, Math.min(0.3, 0.04 + Math.max(0, p.age - 28) * 0.025 + (p.ovr < 55 ? 0.06 : 0) - (p.ovr >= 65 ? 0.05 : 0))); }

export function userRelease(g: Game) {
  g.setState(s => {
    const dg = s.dialog; if (!dg || dg.type !== 'release') return null;
    const p = g.db.P[dg.pid], tid = s.me, mode = dg.mode || 'waive', give = +(dg.giveBack || 0) / 100;
    if (mode === 'buyout' && give > buyoutWilling(g, p) + 1e-6 && !s.god) return { dialog: { ...dg, err: p.name + '’s agent says he’ll give back at most ' + Math.round(buyoutWilling(g, p) * 100) + '%.' } };
    const box = boxOf(s), lines = waivePlayer(g, s, box, tid, p, mode, give);
    return { dialog: null, ...unbox(box), tMine: s.tMine.filter(x => x !== p.id), lgLog: [...lines.map(text => ({ day: s.day, type: 'Release', teams: s.teams[tid].abbr, pids: [p.id], text })), ...s.lgLog], log: g.logEntry(s, lines[0].replace(s.teams[tid].region + ' ' + s.teams[tid].name + ' ', '')) };
  });
}

// Convert an Exhibit 10 or two-way player: 'twoWay' (Exhibit 10 → two-way) or 'standard'.
export function convertContract(g: Game, pid: number, to: 'twoWay' | 'standard') {
  g.setState(s => {
    const P = g.db.P, p = P[pid], tid = s.me, N = nums(g), ids = s.rosters[tid] || [];
    if (!ids.includes(pid)) return null;
    if (to === 'twoWay') {
      if (yosOf(g, p) > 3) return { convMsg: p.name + ' has 4+ years of service: not two-way eligible.' };
      if (twoWayIds(g, ids).length >= TWO_WAY_MAX) return { convMsg: 'You already have ' + TWO_WAY_MAX + ' two-way players.' };
      Object.assign(p, { ctype: 'twoWay', amt: N.TWO_WAY, capOverride: 0, twoWay: { tid, games: 0 }, raise: 0 }); if (p.exp < g.Y) p.exp = g.Y;
    } else {
      if (!s.god && stdIds(g, ids).length >= rosterMax(s) && p.ctype === 'twoWay') return { convMsg: 'No standard roster spot open (' + rosterMax(s) + ').' };
      const minS = N.min(yosOf(g, p));
      if (!s.god && p.ctype === 'twoWay' && teamSalary(g, s, tid) + minS > (capState(s, tid).hardCap === 'AP1' ? N.AP1 : capState(s, tid).hardCap === 'AP2' ? N.AP2 : Infinity)) return { convMsg: 'Converting would break your hard cap.' };
      Object.assign(p, { ctype: 'min', amt: Math.max(p.amt, minS), raise: 0 }); delete p.capOverride; delete p.twoWay;
    }
    return { convMsg: null, gv: (s.gv || 0) + 1, log: g.logEntry(s, 'Converted ' + p.name + ' to a ' + (to === 'twoWay' ? 'two-way contract' : 'standard contract')) };
  });
}

// ── Draftees ────────────────────────────────────────────────────────────────────
// First-rounders sign the rookie scale (4 years; team options on years 3 and 4).
// Second-rounders sign a two-way deal if there's a slot, else a 2-year minimum, or go unsigned.
export function signDraftee(g: Game, s: any, box: { rosters: any; fa: number[] }, tid: number, p: any, pk: { n: number; rd?: number }, user: boolean) {
  const rd = pk.rd || 1, n = rd === 1 ? pk.n : pk.n - 30, Y = g.Y, deal = rookieDeal(g, n, rd), N = nums(g);
  Object.assign(p, { dr: { rd, pick: n }, draft: Y, yrsWith: 0, yos0: 0, draftTid: tid, rookieTid: tid, birdTid: null, inc: [], kicker: 0, ntc: false, signed: { season: Y + 1, day: s.day, phase: 'draft', tid, method: 'rookie' } });
  delete p.capOverride; delete p.opt; delete p.leftAsFA;
  if (rd === 1) {
    Object.assign(p, { amt: deal.amt, exp: Y + 4, raise: 0.05, ctype: 'rookie', rookie: true, rookieScale: { pick: n, tid }, opt: { kind: 'team', season: Y + 3 } });
    box.rosters[tid] = [...box.rosters[tid], p.id]; return 'rookie';
  }
  const ids = box.rosters[tid], tw = twoWayIds(g, ids).length, std = stdIds(g, ids).length;
  p.rookie = false; delete p.rookieScale;
  if (tw < TWO_WAY_MAX && (user || p.ovr < 46 || std >= 15)) { Object.assign(p, { amt: N.TWO_WAY, capOverride: 0, exp: Y + 2, raise: 0, ctype: 'twoWay', twoWay: { tid, games: 0 } }); box.rosters[tid] = [...ids, p.id]; return 'twoWay'; }
  if (user || std < 15) { Object.assign(p, { amt: N.min(0), exp: Y + 2, raise: 0.05, ctype: 'min' }); box.rosters[tid] = [...ids, p.id]; return 'min'; }
  Object.assign(p, { amt: N.min(0), ask: N.min(0), exp: Y + 1, ctype: 'standard' }); box.fa.push(p.id); return 'unsigned';
}

// ── Offseason: decisions that come due when free agency opens ───────────────────────
export interface Decision { pid: number; kind: 'teamOpt' | 'qo'; label: string; amt: number; def: boolean; note: string }
// The user's pending decisions for a team (team options for next season, qualifying offers).
export function decisionsFor(g: Game, s: any, tid: number): Decision[] {
  const P = g.db.P, Y = g.Y, out: Decision[] = [];
  (s.rosters[tid] || []).forEach(id => { const p = P[id];
    if (p.opt?.kind === 'team' && p.opt.season === Y + 1 && !p.ext) { const sal = g.salAt(p, Y + 1); out.push({ pid: id, kind: 'teamOpt', label: (p.rookieScale ? 'Rookie-scale ' : '') + 'team option for ' + Y + '–' + String(Y + 1).slice(2), amt: sal, def: aiExercise(g, p, sal), note: 'Decline and he becomes an unrestricted free agent' + (p.rookieScale ? ' (and you can’t pay him more than the option amount to re-sign him)' : '') + '.' }); }
    else if (p.exp === Y && !p.ext && qoEligible(g, p)) { const qo = qoFor(g, p); out.push({ pid: id, kind: 'qo', label: 'Qualifying offer', amt: qo, def: g.fair(p.ovr) >= qo * 0.8, note: 'Extend it and he’s a restricted free agent: you can match any offer sheet. If nobody signs him he can accept the one-year QO.' }); }
  });
  return out;
}
const aiExercise = (g: Game, p: any, sal: number) => g.fair(p.ovr) * (p.age <= 24 ? 1.3 : 1) >= sal * 0.85;

// Free agency opens: draftees sign, extensions start, options are decided, qualifying offers
// go out, AI teams re-sign some of their own free agents with Bird rights, everyone else hits
// the market with Bird rights and cap holds, and each team's exceptions reset.
export function openFreeAgency(g: Game, s: any) {
  const P = g.db.P, Y = g.Y, N = nums(g), box = boxOf(s), by: Record<number, string[]> = {}, dec = s.decide || {};
  let lgLog = s.lgLog.slice();
  const note = (tid: number, text: string) => { if (g.isUser(s, tid)) (by[tid] = by[tid] || []).push(text); };
  const lg = (tid: number, text: string, pids: number[] = []) => lgLog.unshift({ day: s.day, type: 'Signing', teams: s.teams[tid].abbr, pids, text });
  // Draft picks by AI teams join (or boycott, or go unsigned).
  s.picks.forEach(pk => { const ow = g.owner2027(pk.orig, s.assets, pk.rd); if (!pk.pid || g.isUser(s, ow)) return; const p = P[pk.pid];
    if (p.boycott) { p.abroad = { club: p.from.team, lg: p.from.lg, country: p.from.country || p.raised, pts: 12, reb: 5, ast: 2, clause: 'Buyout', fee: 2.5 }; Object.assign(p, { cls: 0, dr: { rd: pk.rd || 1, pick: pk.rd === 2 ? pk.n - 30 : pk.n }, draft: Y }); box.overseas.push(pk.pid); return; }
    signDraftee(g, s, box, ow, p, pk, false); });
  Object.keys(box.rosters).forEach(k => { const t = +k, user = g.isUser(s, t);
    box.rosters[t] = box.rosters[t].filter(id => { const p = P[id];
      // Extensions signed earlier take over when the old deal ends.
      if (p.ext && p.exp <= Y) { Object.assign(p, { prevAmt: p.amt, amt: p.ext.amt, exp: p.exp + p.ext.yrs, raise: p.ext.raise ?? 0.08, ctype: p.ext.amt >= N.max(yosOf(g, p) + 1) - 0.05 ? 'max' : 'standard', signed: { season: Y + 1, day: s.day, phase: 'fa', tid: t, method: 'extension' } }); delete p.ext; delete p.rookieScale; p.rookie = false; delete p.opt; delete p.capOverride; return true; }
      // Player options: he opts out if he can beat the option salary on the market.
      if (p.opt?.kind === 'player' && p.opt.season === Y + 1) { const sal = g.salAt(p, Y + 1), stay = g.fair(p.ovr) * 1.05 <= sal || p.age >= 33 && g.fair(p.ovr) <= sal * 1.2;
        delete p.opt; if (stay) { note(t, p.name + ' exercised his player option (' + sal.toFixed(2) + 'M)'); } else { p.exp = Y; note(t, p.name + ' declined his player option and is a free agent'); lg(t, p.name + ' declined his player option with the ' + s.teams[t].region + ' ' + s.teams[t].name, [id]); } }
      // Team options.
      if (p.opt?.kind === 'team' && p.opt.season === Y + 1) { const sal = g.salAt(p, Y + 1), yes = user ? (dec['opt' + id] ?? aiExercise(g, p, sal)) : aiExercise(g, p, sal);
        if (yes) { p.opt = p.rookieScale && p.exp > Y + 1 ? { kind: 'team', season: Y + 2 } : undefined; if (!p.opt) delete p.opt; note(t, 'Exercised the team option on ' + p.name + ' (' + sal.toFixed(2) + 'M)'); }
        else { delete p.opt; p.exp = Y; p.optDeclined = true; note(t, 'Declined the team option on ' + p.name); lg(t, 'The ' + s.teams[t].region + ' ' + s.teams[t].name + ' declined their option on ' + p.name, [id]); } }
      if (p.exp > Y) return true;
      // Contract up. Restricted free agency for rookie-scale players and young veterans.
      const qo = qoEligible(g, p) && !p.optDeclined ? qoFor(g, p) : 0, wantQo = qo > 0 && (user ? (dec['qo' + id] ?? g.fair(p.ovr) >= qo * 0.8) : g.fair(p.ovr) >= qo * 0.85);
      p.prevAmt = p.amt; p.birdTid = t; p.ask = askOf(g, p); p.exp = Y + prefYears(p); delete p.optDeclined; delete p.capOverride;
      if (['tenDay', 'hardship', 'ex10'].includes(p.ctype)) p.birdTid = null;
      if (wantQo) { p.rfa = { tid: t, qo }; note(t, 'Extended a ' + qo.toFixed(2) + 'M qualifying offer to ' + p.name + ' (restricted free agent)'); }
      // AI teams keep some of their own free agents before the market opens (Bird rights).
      if (!user && p.birdTid === t) { const ids = box.rosters[t].map(x => P[x]).sort((a, b) => b.ovr - a.ovr), rank = ids.findIndex(x => x.id === id);
        const keep = (rank < 9 || p.age <= 24 && p.pot >= 60) && Math.random() < (p.rfa ? 0.75 : 0.5) && teamSalary(g, { ...s, rosters: box.rosters }, t) - p.prevAmt + p.ask <= Math.max(g.ownerCeiling(s.teams[t].arch), N.CAP);
        if (keep) { const amt = +Math.min(maxFor(g, s, p, t).amt, p.ask).toFixed(2), years = Math.max(birdOf(p, t) === 'early' ? 2 : 1, Math.min(5, prefYears(p) + 1)); lg(t, applySigning(g, { ...s, phase: 'fa' }, box, t, p, { method: 'bird', amt, years }) + ' (re-signed)', [id]); return true; } }
      p.rookie = false; box.fa.push(id); return false; }); });
  // A new league year: fresh exceptions, no hard cap until one is triggered, holds restored,
  // expired traded player exceptions and dead money cleared.
  const now = stamp(g, s);
  s.teams.forEach(t => { const c = { ...(box.cap[t.tid] || {}) };
    box.cap[t.tid] = { ...c, exc: { ...freshExceptions(g), used: [] }, hardCap: null, renounced: [], dpe: null, tpe: (c.tpe || []).filter(x => x.until > now), dead: (c.dead || []).filter(d => Object.keys(d.amts || {}).some(y => +y > Y)) }; });
  // Nobody may start free agency with more than 21 under contract: AI teams trim.
  s.teams.forEach(t => { if (g.isUser(s, t.tid)) return; while (stdIds(g, box.rosters[t.tid]).length > 21) { const w = stdIds(g, box.rosters[t.tid]).map(id => P[id]).sort((a, b) => a.ovr - b.ovr)[0]; waivePlayer(g, s, box, t.tid, w, 'waive'); } });
  const nFA = box.fa.length, nR = box.fa.filter(id => P[id].rfa).length;
  lgLog = [{ day: s.day, type: 'Signing', teams: 'League', text: 'Free agency opened with ' + nFA + ' players available (' + nR + ' restricted). The ' + Y + '–' + String(Y + 1).slice(2) + ' mid-level is ' + N.NTMLE + 'M (non-taxpayer), ' + N.TPMLE + 'M (taxpayer), bi-annual ' + N.BAE + 'M, room ' + N.ROOM + 'M.' }, ...lgLog];
  const logs = clubLogs(g, s, by);
  return { ...logs, ...unbox(box), lgLog, decide: {}, offerSheets: [] };
}

// ── AI free agency, one day at a time ─────────────────────────────────────────────
export function aiFreeAgencyDay(g: Game, s: any, box: Box, lgLog: any[], offerSheets: any[], moves = 12) {
  const P = g.db.P, N = nums(g), T = s.teams;
  // Unsigned players lower their asks as the market dries up.
  box.fa.forEach(id => { const p = P[id], minS = N.min(yosOf(g, p)); p.ask = +Math.max(p.rfa ? Math.min(p.ask, p.rfa.qo) : minS, (p.ask || minS) * 0.97).toFixed(2); });
  for (let k = 0; k < moves; k++) {
    const pool = box.fa.filter(id => !P[id].retired).sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 10); if (!pool.length) break;
    const id = pool[Math.floor(Math.random() * Math.min(pool.length, 6))], p = P[id], st = { ...s, rosters: box.rosters, cap: box.cap, fa: box.fa };
    // His own team (Bird rights) first, then the teams with the most cap room, then everyone else.
    const room = (t: number) => N.CAP - teamSalary(g, st, t, { holds: true });
    const teams = shuffle(T.map(t => t.tid).filter(t => !g.isUser(s, t))).sort((a, b) => (b === p.birdTid ? 1 : 0) - (a === p.birdTid ? 1 : 0) || Math.max(0, room(b)) - Math.max(0, room(a)));
    for (const t of teams) {
      const ids = box.rosters[t], std = stdIds(g, ids).length, depth = ids.map(x => P[x].ovr).sort((a, b) => b - a), spare = room(t) > p.ask;
      if (std >= 15 || (std >= 13 && !spare && p.ovr <= (depth[12] ?? 0) + 1 && p.birdTid !== t)) continue;
      const terms = aiTerms(g, st, t, p); if (!terms) continue;
      if (terms.method !== 'min' && teamSalary(g, st, t) + terms.amt > Math.max(g.ownerCeiling(T[t].arch) + (terms.method === 'bird' && p.ovr >= 62 ? 8 : 0), N.CAP)) continue;
      if (p.rfa && p.rfa.tid !== t) { // offer sheet
        const orig = p.rfa.tid, sheet = { ...terms, method: terms.method };
        if (g.isUser(s, orig)) { offerSheets.push({ id: 'os' + id + '-' + s.day + '-' + k, pid: id, from: t, to: orig, terms: sheet, day: s.day }); box.fa.splice(box.fa.indexOf(id), 1); lgLog.unshift({ day: s.day, type: 'Signing', teams: T[t].abbr + ' · ' + T[orig].abbr, pids: [id], text: T[t].region + ' ' + T[t].name + ' signed restricted free agent ' + p.name + ' to an offer sheet ($' + terms.amt.toFixed(2) + 'M × ' + terms.years + '). ' + T[orig].abbr + ' can match.' }); break; }
        if (aiMatches(g, st, orig, p, sheet)) { lgLog.unshift({ day: s.day, type: 'Signing', teams: T[orig].abbr, pids: [id], text: applySigning(g, st, box, orig, p, { ...sheet, method: 'bird' }) + ' (matched ' + T[t].abbr + '’s offer sheet)' }); break; }
      }
      lgLog.unshift({ day: s.day, type: 'Signing', teams: T[t].abbr, pids: [id], text: applySigning(g, st, box, t, p, terms) });
      break;
    }
  }
}

// Restricted free agents nobody signed take their one-year qualifying offer.
export function acceptQualifyingOffers(g: Game, s: any, box: Box, lgLog: any[], by: Record<number, string[]>) {
  const P = g.db.P;
  box.fa.slice().forEach(id => { const p = P[id]; if (!p.rfa) return; const t = p.rfa.tid;
    const line = applySigning(g, s, box, t, p, { method: 'bird', amt: p.rfa.qo, years: 1 });
    lgLog.unshift({ day: s.day, type: 'Signing', teams: s.teams[t].abbr, pids: [id], text: line.replace('(Bird rights)', '(accepted his qualifying offer)') });
    if (g.isUser(s, t)) (by[t] = by[t] || []).push(p.name + ' accepted his ' + p.amt.toFixed(2) + 'M qualifying offer'); });
}

// Opening-night rosters: at least 14; AI clubs fill with minimum deals and trim to 15.
export function fillRoster(g: Game, s: any, box: Box, tid: number, lgLog: any[], to = ROSTER_MIN) {
  const P = g.db.P, N = nums(g), signed: string[] = [];
  while (stdIds(g, box.rosters[tid]).length < to && box.fa.length) {
    const id = box.fa.slice().filter(x => !P[x].rfa).sort((a, b) => P[b].ovr - P[a].ovr)[0]; if (id == null) break; const p = P[id];
    lgLog.unshift({ day: s.day, type: 'Signing', teams: s.teams[tid].abbr, pids: [id], text: applySigning(g, s, box, tid, p, { method: 'min', amt: N.min(yosOf(g, p)), years: 1 }) }); signed.push(p.name);
  }
  return signed;
}
export function trimRoster(g: Game, s: any, box: Box, tid: number, lgLog: any[], max = 15) {
  const P = g.db.P;
  while (stdIds(g, box.rosters[tid]).length > max) { const w = stdIds(g, box.rosters[tid]).map(id => P[id]).sort((a, b) => (a.ovr - (a.ctype === 'ex10' ? 5 : 0)) - (b.ovr - (b.ctype === 'ex10' ? 5 : 0)))[0];
    waivePlayer(g, s, box, tid, w, 'waive').forEach(text => lgLog.unshift({ day: s.day, type: 'Release', teams: s.teams[tid].abbr, pids: [w.id], text })); }
  // Too many two-ways (after trades): release the extras.
  while (twoWayIds(g, box.rosters[tid]).length > TWO_WAY_MAX) { const w = P[twoWayIds(g, box.rosters[tid])[0]]; waivePlayer(g, s, box, tid, w, 'waive'); }
}

// ── In season ───────────────────────────────────────────────────────────────────
// 10-day and hardship contracts run out, two-way players count NBA games, season-ending
// injuries before the deadline grant a disabled player exception, TPEs expire.
export function seasonTick(g: Game, s: any, day: number, box: Box, lgLog: any[], by: Record<number, string[]>, played: number[], injuries: any[]) {
  const P = g.db.P, N = nums(g), now = stamp(g, { ...s, day });
  played.forEach(id => { const p = P[id]; if (p.ctype === 'twoWay' && p.twoWay) p.twoWay.games = (p.twoWay.games || 0) + 1; });
  // Nobody signed him: in season, a free agent's price falls toward his minimum.
  box.fa.forEach(id => { const p = P[id], minS = N.min(yosOf(g, p)); if ((p.ask || 0) > minS) p.ask = +Math.max(minS, p.ask * 0.97).toFixed(2); });
  Object.keys(box.rosters).forEach(k => { const t = +k;
    const out = box.rosters[t].filter(id => { const p = P[id]; if (!p.tenDay) return false;
      if (p.ctype === 'hardship') { const hurt = box.rosters[t].filter(x => P[x].inj && !P[x].inj.dtd).length; return hurt < 4 || day - p.tenDay.start >= 10; }
      return day - p.tenDay.start >= DAY.TEN_DAY_LEN; });
    out.forEach(id => { const p = P[id], n = (p.tenDayWith || {})[t] || 0; box.rosters[t] = box.rosters[t].filter(x => x !== id); box.fa.push(id); const kind = p.ctype === 'hardship' ? 'hardship' : '10-day';
      delete p.tenDay; p.ctype = 'standard'; p.ask = N.min(yosOf(g, p)); p.birdTid = null;
      if (g.isUser(s, t)) (by[t] = by[t] || []).push(p.name + '’s ' + kind + ' contract expired' + (kind === '10-day' ? (n >= 2 ? ' (his second with you: next time it has to be for the rest of the season)' : ' (you can sign him to a second 10-day)') : ' (roster healthy again)'));
      lgLog.unshift({ day, type: 'Release', teams: s.teams[t].abbr, pids: [id], text: p.name + '’s ' + kind + ' contract with ' + s.teams[t].abbr + ' expired' }); });
    const c = box.cap[t]; if (c?.tpe?.some(x => x.until <= now)) box.cap[t] = { ...c, tpe: c.tpe.filter(x => x.until > now) };
    if (c?.dpe && day > DAY.DPE_DEADLINE) box.cap[t] = { ...box.cap[t], dpe: null };
  });
  injuries.filter(x => x.major && x.pid != null && day <= DAY.DPE_DEADLINE).forEach(x => { const p = P[x.pid], left = 82 - day; if (!p.inj || p.inj.games < left) return;
    const amt = +Math.min(N.NTMLE, g.capHit(p) * 0.5).toFixed(2); box.cap[x.tid] = { ...(box.cap[x.tid] || {}), dpe: { pid: p.id, amt, day } };
    if (g.isUser(s, x.tid)) (by[x.tid] = by[x.tid] || []).push('The league granted a ' + amt.toFixed(2) + 'M disabled player exception for ' + p.name + ' (out for the season). Use it to sign or trade for a player by ' + g.fmtS(DAY.DPE_DEADLINE) + '.'); });
}

// ── Trades: the cap side ─────────────────────────────────────────────────────────
// After a trade: a team over the cap that sent out more salary than it took back gets a
// traded player exception (good for a year); one that absorbed a player into an exception
// uses it up; trade kickers pay out (raising the player's salary, up to the max).
export function tradeCap(g: Game, s: any, cap: any, a: number, b: number, fromA: number[], fromB: number[]) {
  const P = g.db.P, N = nums(g), notes: string[] = [], now = stamp(g, s);
  const hit = (ids: number[]) => ids.reduce((x, id) => x + tradeHit(g, P[id]), 0);
  [[a, fromA, fromB], [b, fromB, fromA]].forEach(([t, out, inn]: any) => {
    const o = hit(out), i = hit(inn), c = { ...(cap[t] || {}) }, before = teamSalary(g, s, t), after = before - o + i;
    let tpe = (c.tpe || []).slice();
    if (after > N.CAP && out.length === 0 && inn.length === 1) { const k = tpe.findIndex(x => x.until > now && x.amt + N.TRADE_BUF >= i); if (k >= 0) { tpe[k] = { ...tpe[k], amt: +(tpe[k].amt - i).toFixed(2) }; if (tpe[k].amt < 0.1) tpe.splice(k, 1); notes.push(s.teams[t].abbr + ' used a traded player exception.'); } }
    if (before > N.CAP - 1e-6 && o > i + 0.1 && out.length >= 1) { tpe = [...tpe, { amt: +(o - i).toFixed(2), until: now + 1000, from: out.map(id => P[id].name).join(', '), created: g.fmtS(s.day) + ' ' + g.Y }]; notes.push(s.teams[t].abbr + ' created a ' + (o - i).toFixed(2) + 'M traded player exception.'); }
    c.tpe = tpe; cap[t] = c;
  });
  [...fromA, ...fromB].forEach(id => { const p = P[id]; if (!p.kicker) return; const bump = Math.min(p.amt * p.kicker, Math.max(0, N.max(yosOf(g, p)) - p.amt));
    if (bump > 0.01) { p.amt = +(p.amt + bump).toFixed(2); notes.push(p.name + '’s trade kicker added ' + bump.toFixed(2) + 'M.'); } p.kicker = 0; });
  return notes;
}
export { checkTrade };

// Renounce a free agent: his cap hold comes off your books and you lose his Bird rights.
export function renounce(g: Game, pid: number) {
  g.setState(s => {
    const p = g.db.P[pid], tid = s.me; if (p.birdTid !== tid) return null;
    const c = { ...((s.cap || {})[tid] || {}) }; c.renounced = [...(c.renounced || []), pid]; p.birdTid = null; delete p.rfa;
    return { cap: { ...(s.cap || {}), [tid]: c }, log: g.logEntry(s, 'Renounced ' + p.name + ' (cap hold cleared, Bird rights gone)') };
  });
}

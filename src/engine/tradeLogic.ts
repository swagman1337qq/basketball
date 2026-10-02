// Trade logic: what picks, swaps and contracts are worth, and why AI teams trade.
//  • Team outlook: every team's projected strength this season and the next few. Young players
//    grow toward the league's read of their potential, veterans age, contracts run out (good players
//    usually re-sign, others often leave), the gaps fill with replacement-level players; this season
//    also counts the record so far. A future pick's slot comes from that projection, pulled toward the
//    middle the further out it is, with more uncertainty each year. Worse teams' picks are worth more.
//  • A pick is worth its expected value over that uncertainty (a likely top-5 pick is worth far more
//    than a likely #19). A swap is worth the chance the other team's pick lands higher, times how much
//    higher: two swaps with a 3-win team are worth much more than a 50-win team's #19.
//  • Contracts: a bad contract costs the team taking it on, more for a team near the tax or aprons,
//    less for one with room; shedding one is worth more to a team over the tax. So a contender dumping
//    salary has to attach picks or young players, and a team with room demands them.
//  • AI-to-AI trades happen for a reason: a contender with a hole buys from a seller, an over-the-tax
//    team pays a team with room to take a contract, two teams swap surplus for need. Each side has to
//    come out ahead by its own read (its own scouts, its timeline, its needs), and the league office
//    has to approve. AI teams also bring you offers that fit their plans.
import type { Game } from './Game';
import { checkTrade, nums, teamSalary } from './cba';
import { expectedByRank } from './lottery';
import { protFactor } from './pickRules';
import { teamRating } from './ratings';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const PICK_YEARS = 4; // default: picks tradable up to four drafts after this one (God Mode setting)
export const pickHorizon = (s: any) => cl(Math.round(s?.pickYears ?? PICK_YEARS), 1, 7);

// ── Team outlook ─────────────────────────────────────────────────────────────────────
const OUT = new WeakMap<object, Map<number, number[]>>(); // state → years ahead → expected slot by team
// A team's projected strength n seasons ahead (a team-rating number, ~40–70).
export function projStrength(g: Game, s: any, tid: number, n: number) {
  const P = g.db.P, Y = g.Y, ids: number[] = s.rosters[tid] || [], REPL = 44;
  const vals = ids.map(id => { const p = P[id]; if (!p) return REPL; let o = p.ovr;
    for (let i = 0; i < n; i++) { const a = p.age + i; o += a <= 26 ? Math.min(Math.max(0, (p.pot ?? o) - o), a <= 22 ? 3 : a <= 24 ? 2 : 1) : a >= 29 ? (g.constructor as any).ageDecline(a + 1) : 0; }
    const stays = n === 0 || p.exp >= Y + n ? 1 : (o >= 62 ? 0.75 : o >= 54 ? 0.55 : 0.35) * (p.age + n >= 34 ? 0.5 : 1);
    return stays * o + (1 - stays) * REPL; });
  const fake: Record<number, any> = {}; vals.forEach((o, i) => (fake[i] = { ovr: o }));
  let r = teamRating(fake, vals.map((_, i) => i));
  // The record counts too: all of it for this season, some for next (how a team plays outlasts its ratings).
  { const t = s.teams[tid], gp = t.w + t.l; if (gp && n <= 2) { const w = (n === 0 ? Math.min(0.85, gp / 82 * 1.2) : n === 1 ? 0.35 * gp / 82 : 0.15 * gp / 82); r = r * (1 - w) + (45 + (t.w / gp - 0.5) * 32) * w; } }
  return r;
}
// Expected first-round slot for every team, n drafts from now (0 = this June).
export function expectedSlots(g: Game, s: any, n: number): number[] {
  let m = OUT.get(s); if (!m) { m = new Map(); OUT.set(s, m); } const hit = m.get(n); if (hit) return hit;
  const T = s.teams, ex = expectedByRank(T.length), str = T.map((t: any) => projStrength(g, s, t.tid, n));
  const order = T.map((t: any) => t.tid).sort((a: number, b: number) => str[a] - str[b]); // worst first
  const shrink = n === 0 ? 1 : n === 1 ? 0.7 : n === 2 ? 0.5 : n === 3 ? 0.4 : 0.35, mid = (T.length + 1) / 2, out: number[] = [];
  order.forEach((tid: number, i: number) => { const e = ex[i + 1] ?? i + 1; out[tid] = mid + (e - mid) * shrink; });
  m.set(n, out); return out;
}
// How sure that slot is (standard deviation, in slots).
const slotSd = (g: Game, s: any, n: number) => n === 0 ? 1.5 + 4.5 * (1 - Math.min(1, g.gamesPlayed(s) / 82)) : n === 1 ? 6 : n === 2 ? 7.5 : 8.5;
const Z: [number, number][] = [[-1.5, 0.1], [-0.75, 0.24], [0, 0.32], [0.75, 0.24], [1.5, 0.1]];
// A first-round slot's worth (the same scale as player values).
export const slotValue = (slot: number) => 4 + 34 * Math.pow(cl(31 - slot, 0, 30) / 30, 1.6);
// The slot distribution of team orig's first, `yr`'s draft: [slot, weight][]. Exact once the order is set.
export function slotDist(g: Game, s: any, orig: number, yr: number): [number, number][] {
  const n = yr - g.Y, sd = slotSd(g, s, n), T = s.teams.length;
  if (n === 0) { const x = g.boardOrder(s).find((p: any) => (p.rd || 1) === 1 && p.orig === orig); if (x && (s.phase === 'draft' || s.phase === 'lottery' && s.lotto)) return [[x.n, 1]]; }
  const e = expectedSlots(g, s, Math.max(0, n))[orig] ?? (T + 1) / 2;
  return Z.map(([z, w]) => [cl(Math.round(e + z * sd), 1, T), w] as [number, number]);
}
// A pick's worth: expected over its slot distribution (protections included), discounted for years.
export function pickWorth(g: Game, s: any, k: any) {
  if (k.rd !== 1) return 2.5;
  const n = k.yr - g.Y, d = slotDist(g, s, k.orig, k.yr);
  return d.reduce((a, [slot, w]) => a + w * slotValue(slot) * protFactor(slot, k.prot), 0) * (n <= 0 ? 1 : n === 1 ? 0.92 : n === 2 ? 0.86 : 0.82);
}
// A swap right: the holder may take the grantor's first instead of its own. Worth the expected gain.
export function swapWorth(g: Game, s: any, yr: number, holder: number, grantor: number) {
  const a = slotDist(g, s, holder, yr), b = slotDist(g, s, grantor, yr), n = yr - g.Y;
  let e = 0; a.forEach(([sa, wa]) => b.forEach(([sb, wb]) => { e += wa * wb * Math.max(0, slotValue(sb) - slotValue(sa)); }));
  return 0.5 + e * (n <= 0 ? 1 : n === 1 ? 0.92 : n === 2 ? 0.86 : 0.82);
}

// ── Contracts ────────────────────────────────────────────────────────────────────────
const CK = new WeakMap<object, Map<number, number>>();
// How much a team minds paying more than a player is worth: a team with room least, one over the tax
// or the aprons most (it pays tax on every dollar); a contender a little more than a rebuilding team.
export function contractK(g: Game, s: any, tid: number, st: string) {
  let m = CK.get(s); if (!m) { m = new Map(); CK.set(s, m); } const hit = m.get(tid); if (hit != null) return hit;
  const N = nums(g), pay = teamSalary(g, s, tid), room = pay < N.CAP - 5 ? 0.75 : pay < N.TAX ? 0.9 : pay < N.AP1 ? 1.2 : 1.55;
  const k = 0.5 * room * (st === 'rebuild' ? 0.85 : st === 'contend' ? 1.1 : 1); m.set(tid, k); return k;
}
// What a contract adds to or takes from a player's worth: years × (pay − worth), growing for an
// aging player (his later years are worse).
export function contractValue(g: Game, p: any, k: number) {
  const yrs = Math.max(1, p.exp - (g.Y - 1)), over = p.amt - g.fair(p.ovr);
  return over > 0 ? -over * yrs * k * (1 + 0.08 * Math.max(0, p.age - 29) * (yrs - 1)) : -over * yrs * 0.3;
}

// ── Needs and fit ────────────────────────────────────────────────────────────────────
const IDEAL: Record<string, number> = { G: 3, W: 3, B: 2 }; // a top eight's balance
// The position group a team is shortest at in its top eight (null if balanced).
export function needOf(g: Game, s: any, tid: number): string | null {
  const P = g.db.P, top = (s.rosters[tid] || []).map((id: number) => P[id]).filter(Boolean).sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 8);
  const c: Record<string, number> = { G: 0, W: 0, B: 0 }; top.forEach((p: any) => (c[p.grp] = (c[p.grp] || 0) + 1));
  const short = Object.keys(IDEAL).map(g2 => [g2, c[g2] - IDEAL[g2]] as [string, number]).sort((a, b) => a[1] - b[1])[0];
  return short && short[1] < 0 ? short[0] : null;
}
const GRP_WORD: Record<string, string> = { G: 'guard', W: 'wing', B: 'big' };
// Extra worth of incoming players to this team: filling its need (a starter-level player at its
// thinnest position), and for a rebuilding team, youth.
function fitBonus(g: Game, s: any, tid: number, st: string, ids: number[]) {
  const P = g.db.P, need = needOf(g, s, tid), fifth = (s.rosters[tid] || []).map((id: number) => P[id]?.ovr || 0).sort((a: number, b: number) => b - a)[4] ?? 45;
  return ids.reduce((a, id) => { const p = P[id]; if (!p) return a; let b = 0;
    if (need && p.grp === need && p.ovr >= fifth - 2) b += st === 'contend' ? 4 : st === 'middle' ? 2.5 : 1;
    if (st === 'rebuild' && p.age <= 23) b += 2; return a + b; }, 0);
}

// ── One team's judgement of a trade ────────────────────────────────────────────────────
let AI_M = 0.06; // the margin each side needs (smaller between two AI teams)
const usedPick = (g: Game, s: any, a: any) => a.yr === g.Y && (s.picks || []).some((x: any) => x.orig === a.orig && (x.rd || 1) === a.rd && x.pid) && !g.draftRights(a, s);
export const tradablePicks = (g: Game, s: any, tid: number) => (s.assets || []).filter((a: any) => a.owner === tid && a.yr >= g.Y && a.yr <= g.Y + pickHorizon(s) && !usedPick(g, s, a) && !g.draftRights(a, s));
// Net gain for team tid: what it gets minus what it gives (its read of potential, its timeline, its
// cap situation, its needs), less a small margin. ≥ 0 means it would say yes.
export function teamGain(g: Game, s: any, tid: number, getP: number[], giveP: number[], getK: string[], giveK: string[], margin = 0.06) {
  const P = g.db.P, st = (g.strategies(s.teams, s) as any)[tid] || 'middle', T = s.teams, asset = (id: string) => (s.assets || []).find((a: any) => a.id === id);
  const pv = (id: number) => g.pVal(P[id], st, tid);
  const recv = getP.reduce((a, id) => a + pv(id), 0) + fitBonus(g, s, tid, st, getP) + getK.reduce((a, id) => a + g.kVal(asset(id), st, false, T), 0);
  const give = giveP.reduce((a, id) => a + pv(id), 0) + giveK.reduce((a, id) => a + g.kVal(asset(id), st, true, T), 0);
  return recv - give - Math.max(1, Math.abs(give) * margin);
}
// Subsets of up to `k` items (small lists only).
function subsets(xs: any[], k: number): any[][] { const out: any[][] = [[]]; const go = (i: number, cur: any[]) => { for (let j = i; j < xs.length; j++) { const n = [...cur, xs[j]]; out.push(n); if (n.length < k) go(j + 1, n); } }; go(0, []); return out; }

export interface TradeIdea { a: number; b: number; aP: number[]; bP: number[]; aK: string[]; bK: string[]; why: string }
// The best package team `buyer` can send `seller` for `want` (players) that both accept: the buyer
// keeps its best players (top `keep`), and gives as little as it can. Null if nothing works.
function buildPackage(g: Game, s: any, buyer: number, seller: number, want: number[], wantK: string[], keep: number, why: string, rnd: () => number): TradeIdea | null {
  const P = g.db.P, gd = { ...s, god: false }, top = (s.rosters[buyer] || []).slice().sort((a: number, b: number) => P[b].ovr - P[a].ovr).slice(0, keep);
  const outP = (s.rosters[buyer] || []).filter((id: number) => !top.includes(id) && !want.includes(id)).sort((a: number, b: number) => P[b].amt - P[a].amt).slice(0, 6);
  const outK = tradablePicks(g, s, buyer).sort(() => rnd() - 0.5).slice(0, 4).map((a: any) => a.id);
  let best: TradeIdea | null = null, bestG = -Infinity;
  for (const ps of subsets(outP, 2)) for (const ks of subsets(outK, 2)) {
    if (!ps.length && !ks.length) continue;
    if (teamGain(g, s, seller, ps, want, ks, wantK, AI_M) < 0) continue;
    const gb = teamGain(g, s, buyer, want, ps, wantK, ks, AI_M); if (gb < 0 || gb <= bestG) continue;
    if (!checkTrade(g, gd, buyer, seller, ps, want, ks, wantK).ok) continue;
    bestG = gb; best = { a: buyer, b: seller, aP: ps, bP: want, aK: ks, bK: wantK, why };
  }
  return best;
}

// ── AI-to-AI trades with a reason ─────────────────────────────────────────────────────
export function aiTradeIdea(g: Game, s: any, rnd: () => number = Math.random): TradeIdea | null { AI_M = 0.03; try { return aiTradeIdea0(g, s, rnd); } finally { AI_M = 0.06; } }
function aiTradeIdea0(g: Game, s: any, rnd: () => number): TradeIdea | null {
  const P = g.db.P, T = s.teams, strat = g.strategies(T, s) as any, N = nums(g), ai: number[] = T.map((t: any) => t.tid).filter((t: number) => !g.isUser(s, t));
  const pick = <X,>(xs: X[]) => xs[Math.floor(rnd() * xs.length)], r = rnd();
  if (ai.length < 2) return null;
  if (r < 0.55) { // A contender (or a team on the rise) fills a hole from a seller.
    const buyer = pick(ai.filter(t => strat[t] === 'contend' || strat[t] === 'middle' && rnd() < 0.3)); if (buyer == null) return null;
    const need = needOf(g, s, buyer), fifth = (s.rosters[buyer] || []).map((id: number) => P[id].ovr).sort((a: number, b: number) => b - a)[4] ?? 45;
    const seller = pick(ai.filter(t => t !== buyer && (strat[t] === 'rebuild' || strat[t] === 'middle' && rnd() < 0.4))); if (seller == null) return null;
    const targets = (s.rosters[seller] || []).map((id: number) => P[id]).filter((p: any) => p.age >= 24 && p.ovr >= fifth + 2 && (!need || p.grp === need)).sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 3);
    for (const t of targets) { const idea = buildPackage(g, s, buyer, seller, [t.id], [], 4, T[buyer].abbr + ' (' + (strat[buyer] === 'contend' ? 'contending' : 'on the rise') + (need ? ', needed a ' + GRP_WORD[need] : '') + ') bought from ' + T[seller].abbr + ' (' + (strat[seller] === 'rebuild' ? 'rebuilding' : 'selling') + ')', rnd); if (idea) return idea; }
    return null;
  }
  if (r < 0.8) { // Salary dump: a team over the tax pays a team with room to take a contract.
    const dumper = pick(ai.filter(t => teamSalary(g, s, t) > N.TAX)); if (dumper == null) return null;
    const st = strat[dumper] || 'middle', k = (id: number) => g.pVal(P[id], st, dumper);
    const bad = (s.rosters[dumper] || []).map((id: number) => P[id]).filter((p: any) => p.amt >= 8 && p.exp > g.Y && p.amt > g.fair(p.ovr) * 1.4).sort((a: any, b: any) => k(a.id) - k(b.id))[0]; if (!bad) return null;
    const recv = pick(ai.filter(t => t !== dumper && strat[t] !== 'contend' && teamSalary(g, s, t) + bad.amt <= N.TAX - 2)); if (recv == null) return null;
    const gd = { ...s, god: false }, sweet = tradablePicks(g, s, dumper).map((a: any) => a.id).sort(() => rnd() - 0.5).slice(0, 4), young = (s.rosters[dumper] || []).filter((id: number) => P[id].age <= 22 && id !== bad.id).slice(0, 2);
    const backs = [[], ...(s.rosters[recv] || []).filter((id: number) => P[id].amt <= 4 && P[id].exp <= g.Y + 1).slice(0, 3).map((id: number) => [id])];
    for (const ks of subsets(sweet, 2)) for (const ys of subsets(young, 1)) for (const back of backs) {
      const aP = [bad.id, ...ys]; if (teamGain(g, s, recv, aP, back, ks, [], AI_M) < 0 || teamGain(g, s, dumper, back, aP, [], ks, AI_M) < 0) continue;
      if (!checkTrade(g, gd, dumper, recv, aP, back, ks, []).ok) continue;
      return { a: dumper, b: recv, aP, bP: back, aK: ks, bK: [], why: 'a salary dump: ' + T[dumper].abbr + ' paid ' + T[recv].abbr + ' to take ' + bad.name + '’s contract' };
    }
    return null;
  }
  // Need for need: two teams swap surplus at one position for help at another.
  const a = pick(ai), na = needOf(g, s, a); if (!na) return null;
  const b = pick(ai.filter(t => t !== a && needOf(g, s, t) && needOf(g, s, t) !== na)), nb = b != null ? needOf(g, s, b) : null; if (b == null || !nb) return null;
  const pa = (s.rosters[a] || []).map((id: number) => P[id]).filter((p: any) => p.grp === nb).sort((x: any, y: any) => y.ovr - x.ovr).slice(1, 4), pb = (s.rosters[b] || []).map((id: number) => P[id]).filter((p: any) => p.grp === na).sort((x: any, y: any) => y.ovr - x.ovr).slice(1, 4);
  const gd = { ...s, god: false };
  for (const x of pa) for (const y of pb) { if (Math.abs(x.ovr - y.ovr) > 4) continue;
    if (teamGain(g, s, a, [y.id], [x.id], [], [], AI_M) < 0 || teamGain(g, s, b, [x.id], [y.id], [], [], AI_M) < 0) continue;
    if (!checkTrade(g, gd, a, b, [x.id], [y.id], [], []).ok) continue;
    return { a, b, aP: [x.id], bP: [y.id], aK: [], bK: [], why: 'need for need: ' + T[a].abbr + ' wanted a ' + GRP_WORD[na] + ', ' + T[b].abbr + ' a ' + GRP_WORD[nb] };
  }
  return null;
}

// ── Offers to you ──────────────────────────────────────────────────────────────────────
// An AI team brings you a trade that fits its plans (or null): a contender after one of your players
// at the position it needs, a rebuilding team selling a veteran for your young players or picks, or
// a team over the tax paying you to take a contract when you have room. You have to get fair value
// too (by your own read), or it doesn't bother calling.
export function offerToUser(g: Game, s: any, myGain: (getP: number[], giveP: number[], getK: string[], giveK: string[]) => number, rnd: () => number = Math.random): TradeIdea | null {
  const P = g.db.P, T = s.teams, me = s.me, strat = g.strategies(T, s) as any, N = nums(g), ai: number[] = T.map((t: any) => t.tid).filter((t: number) => !g.isUser(s, t));
  const pick = <X,>(xs: X[]) => xs[Math.floor(rnd() * xs.length)], r = rnd(), mine: number[] = s.rosters[me] || [], gd = { ...s, god: false };
  const ok = (x: TradeIdea | null) => x && myGain(x.aP, x.bP, x.aK, x.bK) > -3 ? x : null; // fair enough for you (a = the AI team, giving aP/aK; b = you)
  if (r < 0.5) { // A contender (or a team on the rise) wants one of your players at its need.
    for (const t of ai.filter(x => strat[x] === 'contend' || strat[x] === 'middle').sort(() => rnd() - 0.5).slice(0, 5)) {
      const need = needOf(g, s, t), fifth = (s.rosters[t] || []).map((id: number) => P[id].ovr).sort((a: number, b: number) => b - a)[4] ?? 45;
      const target = mine.map(id => P[id]).filter((p: any) => p.age >= 23 && p.ovr >= fifth + 1 && (!need || p.grp === need)).sort((a: any, b: any) => b.ovr - a.ovr)[0]; if (!target) continue;
      const x = ok(buildPackage(g, s, t, me, [target.id], [], 4, T[t].region + ' are ' + (strat[t] === 'contend' ? 'contending' : 'on the rise') + (need ? ' and need a ' + GRP_WORD[need] : '') + ': they want ' + target.name + '.', rnd)); if (x) return x;
    }
    return null;
  }
  if (r < 0.8) { // A rebuilding team sells a veteran for youth or picks.
    const t = pick(ai.filter(x => strat[x] === 'rebuild')); if (t == null) return null;
    const vet = (s.rosters[t] || []).map((id: number) => P[id]).filter((p: any) => p.age >= 27 && p.ovr >= 54).sort((a: any, b: any) => b.ovr - a.ovr)[0]; if (!vet) return null;
    const youth = mine.filter(id => P[id].age <= 23).sort((a, b) => g.potRead(P[b], t, s) - g.potRead(P[a], t, s)).slice(0, 4), picks = tradablePicks(g, s, me).map((a: any) => a.id).slice(0, 4), filler = mine.filter(id => P[id].age > 23).sort((a, b) => P[b].amt - P[a].amt).slice(0, 4);
    let best: TradeIdea | null = null, bestMine = -Infinity;
    for (const ys of subsets(youth, 1)) for (const ks of subsets(picks, 2)) for (const fs of subsets(filler, 1)) {
      const myP = [...ys, ...fs]; if (!myP.length && !ks.length) continue;
      if (teamGain(g, s, t, myP, [vet.id], ks, []) < 0) continue;
      const mg = myGain([vet.id], myP, [], ks); if (mg <= bestMine) continue;
      if (!checkTrade(g, gd, t, me, [vet.id], myP, [], ks).ok) continue;
      bestMine = mg; best = { a: t, b: me, aP: [vet.id], bP: myP, aK: [], bK: ks, why: T[t].region + ' are rebuilding: they’d move ' + vet.name + ' for young talent or picks.' };
    }
    return ok(best);
  }
  // A team over the tax pays you to take a contract, if you have the room.
  for (const t of ai.filter(x => teamSalary(g, s, x) > N.TAX).sort(() => rnd() - 0.5).slice(0, 3)) {
    const bad = (s.rosters[t] || []).map((id: number) => P[id]).filter((p: any) => p.amt >= 8 && p.exp > g.Y && p.amt > g.fair(p.ovr) * 1.4)[0]; if (!bad || teamSalary(g, s, me) + bad.amt > N.TAX - 2) continue;
    const sweet = tradablePicks(g, s, t).map((a: any) => a.id).slice(0, 4);
    for (const ks of subsets(sweet, 2)) { if (!ks.length) continue;
      if (teamGain(g, s, t, [], [bad.id], [], ks) < 0) continue;
      if (!checkTrade(g, gd, t, me, [bad.id], [], ks, []).ok) continue;
      const x = ok({ a: t, b: me, aP: [bad.id], bP: [], aK: ks, bK: [], why: T[t].region + ' are over the tax and want to clear ' + bad.name + '’s contract: they’ll pay you to take it.' }); if (x) return x;
    }
  }
  return null;
}

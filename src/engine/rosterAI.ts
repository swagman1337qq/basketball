// Roster decisions: who a team keeps when it has to let someone go (AI teams' cuts and waivers, and
// yours when the staff makes free agency and roster decisions for you). Not one number sorted: each
// player's worth to this team, from
//  • what he gives now (overall) and what he can become (the team's own read of his potential, more
//    the younger he is) and which way he's heading (this year's change);
//  • the team's timeline: a contender leans on today, a rebuilding team on tomorrow and away from age;
//  • his role and the roster around him: a rotation player, the last of his position group, a skill
//    nobody else on the team has;
//  • his contract: guaranteed money is paid either way, so cutting a big guaranteed deal saves nothing
//    (a camp deal or a non-guaranteed contract is cheap to cut);
//  • the team's draft investment: a high pick gets years of patience from the team that drafted him
//    (a #1 pick is almost never cut in his first seasons), fading as his rookie deal runs out. His
//    potential isn't touched: if he doesn't develop, his ratings and play make the case over time.
import type { Game } from './Game';
import { remainingGuaranteed, stdIds } from './cba';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const MIN_GRP: Record<string, number> = { G: 4, W: 4, B: 3 }; // a roster needs this many at each position group

// A team's timeline: an AI team's strategy, or for a team you run, where it stands in the league.
export function timelineOf(g: Game, s: any, tid: number): 'contend' | 'middle' | 'rebuild' {
  const st = (g.strategies(s.teams, s) as any)[tid]; if (st) return st;
  const sc = (t: any) => g.pct(t) * 0.65 + ((t.str ?? 45) - 45) / 12 * 0.35, rank = s.teams.slice().sort((a: any, b: any) => sc(b) - sc(a)).findIndex((t: any) => t.tid === tid);
  return rank < 9 ? 'contend' : rank >= s.teams.length - 10 ? 'rebuild' : 'middle';
}
// The team's draft investment in him: by where he was picked, fading over his rookie deal (half as
// much for a team that traded for him).
export function draftInvestment(g: Game, p: any, tid: number) {
  if (!p?.dr || p.draft == null) return 0;
  const n = (p.dr.rd - 1) * 30 + p.dr.pick, yrs = g.Y - p.draft;
  const base = n <= 3 ? 26 : n <= 5 ? 18 : n <= 10 ? 12 : n <= 14 ? 8 : n <= 20 ? 5 : n <= 30 ? 3 : 1;
  const fade = yrs <= 1 ? 1 : yrs === 2 ? 0.75 : yrs === 3 ? 0.45 : yrs === 4 ? 0.2 : 0;
  return base * fade * (p.draftTid === tid ? 1 : 0.5);
}
// His worth to team tid, out of the players `ids` (the roster he'd be cut from).
export function rosterValue(g: Game, s: any, tid: number, p: any, ids: number[], tl = timelineOf(g, s, tid)) {
  const P = g.db.P, Y = g.Y, age = p.age;
  const wNow = tl === 'contend' ? 1.15 : tl === 'rebuild' ? 0.8 : 1, wFut = tl === 'contend' ? 0.5 : tl === 'rebuild' ? 1.3 : 0.9;
  const pot = g.potRead(p, tid, s), youth = age <= 21 ? 0.75 : age <= 23 ? 0.6 : age <= 25 ? 0.35 : age <= 27 ? 0.12 : 0;
  let v = p.ovr * wNow + Math.max(0, pot - p.ovr) * youth * wFut;
  // Which way he's heading: this year's change, for players still growing.
  const ref = p.rh?.[Y]?.o?.ovrI ?? p.rh?.[Y - 1]?.o?.ovrI; if (ref != null && age <= 26) v += cl(p.ovr - ref, -4, 6) * 0.5;
  // Age against the timeline.
  if (age >= 33) v -= (age - 32) * 1.5 * (tl === 'rebuild' ? 1.5 : 1); else if (tl === 'rebuild' && age >= 29) v -= (age - 28) * 0.8;
  // His contract: guaranteed money is paid anyway; camp deals are cheap to cut.
  const guar = Object.values(remainingGuaranteed(g, s, p)).reduce((a: number, x: any) => a + x, 0);
  v += Math.min(7, Math.sqrt(guar) * 1.2) - (p.ctype === 'ex10' ? 4 : 0);
  // The team's draft investment.
  v += draftInvestment(g, p, tid);
  // His role and the roster around him.
  const others = ids.filter(id => id !== p.id && P[id]), rank = others.filter(id => P[id].ovr > p.ovr).length; // players better than him
  if (rank < 8) v += 3; else if (rank < 10) v += 1.5; // a rotation player
  const sameGrp = others.filter(id => P[id].grp === p.grp).length; if (sameGrp < (MIN_GRP[p.grp] ?? 3)) v += 6; // the last of his position group
  const mine = g.rolesOf(p), theirs = new Set(others.filter(id => others.filter(x => P[x].ovr > P[id].ovr).length < 10).flatMap(id => g.rolesOf(P[id])));
  v += Math.min(4, mine.filter(r => !theirs.has(r)).length * 2); // a skill the rotation doesn't have
  return v;
}
// Who goes: the standard-contract player with the least worth to the team (two-ways aside).
export function pickCut(g: Game, s: any, tid: number, ids: number[]) {
  const P = g.db.P, std = stdIds(g, ids), tl = timelineOf(g, s, tid);
  let best: any = null, low = Infinity;
  std.forEach(id => { const p = P[id]; if (!p) return; const v = rosterValue(g, s, tid, p, std, tl); if (v < low) { low = v; best = p; } });
  return best ? { p: best, v: low } : null;
}
// A team option: worth keeping if he's worth the salary, counting what a young player is becoming (the
// team's own read) and, for a draft pick, the investment (a lottery pick's third year is nearly always
// picked up).
export function exerciseOption(g: Game, s: any, tid: number, p: any, sal: number) {
  const proj = p.age <= 24 ? p.ovr + 0.5 * Math.max(0, g.potRead(p, tid, s) - p.ovr) : p.ovr;
  return g.fair(proj) * (p.age <= 24 ? 1.15 : 1) + draftInvestment(g, p, tid) * 0.4 >= sal * 0.85;
}
// The extra minutes a team gives a young high pick to develop (its rotation order), by its timeline.
export function devMinutes(g: Game, s: any, tid: number, p: any) {
  const inv = draftInvestment(g, p, tid); if (!inv || p.age > 24) return 0;
  const tl = timelineOf(g, s, tid); return inv * (tl === 'rebuild' ? 0.2 : tl === 'middle' ? 0.12 : 0.05);
}

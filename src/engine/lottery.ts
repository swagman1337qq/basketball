// The NBA's "3-2-1" draft lottery, in force from the 2027 draft (approved 29–1 by the Board
// of Governors; set for 2027–29, and kept here for every later draft too).
//   · 16 teams, 37 balls: every team except seeds 1–6 and the two 7-v-8 play-in winners.
//   · The three worst records get 2 balls each (the "relegation zone"), the other teams that
//     missed the play-in get 3 each, the 9 and 10 play-in seeds get 2 each and the losers of
//     the 7-v-8 games get 1 each. So the worst teams no longer have the best odds.
//   · Every lottery pick is drawn, 1 through 16. A team's balls leave the drum once it's drawn.
//   · Floor: the three worst teams pick no lower than 12th. If they're still in the drum when
//     only enough slots remain to fit them by 12th, they take those slots.
//   · Streaks, by the team whose own pick it is (not whoever holds it now): no No. 1 pick in
//     consecutive drafts, and no top-5 pick in three straight drafts. A drawn team that can't
//     take the slot is skipped and the draw is repeated.
// The rest of the first round follows, worst record first.
import type { Game } from './Game';

export type Tier = 'bottom' | 'out' | 'playin' | 'loser78';
export const BALLS: Record<Tier, number> = { bottom: 2, out: 3, playin: 2, loser78: 1 };
export const TIER_LABEL: Record<Tier, string> = { bottom: 'Bottom three (relegation zone)', out: 'Missed the play-in', playin: 'Play-in 9 / 10 seed', loser78: 'Lost the 7 v 8 play-in game' };
export const FLOOR = 12;

export interface LotTeam {
  tid: number | null;     // null: the 7-v-8 loser isn't known yet (see cand)
  cand?: number[];        // the two teams who could be that loser
  conf: string; seed: number; tier: Tier; balls: number;
  noOne: boolean; noTop5: boolean; why: string[];
}
export interface Field { teams: LotTeam[]; projected: boolean }

const worstFirst = (g: Game, s: any) => (a: number, b: number) => g.pct(s.teams[a]) - g.pct(s.teams[b]) || s.teams[a].w - s.teams[b].w || a - b;

// Which slot each team's own first-rounder landed in, by draft year.
export function ownSlot(s: any, yr: number, tid: number): number | null { const h = s.lotHist?.[yr]; return h && h[tid] != null ? h[tid] : null; }

function streaks(g: Game, s: any, tid: number) {
  const Y = g.Y, a = ownSlot(s, Y - 1, tid), b = ownSlot(s, Y - 2, tid), why: string[] = [];
  const noOne = a === 1, noTop5 = a != null && b != null && a <= 5 && b <= 5;
  if (noOne) why.push('Can’t land No. 1: their own pick was No. 1 in ' + (Y - 1));
  if (noTop5) why.push('Can’t land in the top 5: their own pick was top-5 in ' + (Y - 2) + ' and ' + (Y - 1));
  return { noOne, noTop5, why };
}

// The lottery field: from the real play-in once the 7-v-8 games are done, otherwise
// "if the season ended today" from the current standings.
export function lotteryField(g: Game, s: any): Field {
  const teams: LotTeam[] = [], confs = ['East', 'West'], cmp = worstFirst(g, s);
  const seedsOf = (c: string): number[] => (s.seeds?.[c] && s.playin ? s.seeds[c] : g.seeds(s, c));
  let projected = false; const out: { tid: number; conf: string; seed: number }[] = [];
  confs.forEach(c => {
    const sd = seedsOf(c), A = s.playin?.[c]?.[0];
    sd.slice(10).forEach((t, i) => out.push({ tid: t, conf: c, seed: 11 + i }));
    [8, 9].forEach(i => sd[i] != null && teams.push({ tid: sd[i], conf: c, seed: i + 1, tier: 'playin', balls: BALLS.playin, noOne: false, noTop5: false, why: [] }));
    if (sd[6] == null || sd[7] == null) return;
    if (A?.done) { teams.push({ tid: A.l, conf: c, seed: A.l === A.a ? 7 : 8, tier: 'loser78', balls: BALLS.loser78, noOne: false, noTop5: false, why: [] }); }
    else { projected = true; teams.push({ tid: null, cand: [sd[6], sd[7]], conf: c, seed: 7, tier: 'loser78', balls: BALLS.loser78, noOne: false, noTop5: false, why: [] }); }
  });
  if (!s.playin) projected = true;
  out.sort((a, b) => cmp(a.tid, b.tid)).forEach((x, i) => teams.push({ ...x, tier: i < 3 ? 'bottom' : 'out', balls: i < 3 ? BALLS.bottom : BALLS.out, noOne: false, noTop5: false, why: [] }));
  teams.forEach(x => { if (x.tid != null) Object.assign(x, streaks(g, s, x.tid)); });
  // Display order: bottom three, then the rest of the non-play-in teams, then the play-in teams, each worst record first.
  const rank: Record<Tier, number> = { bottom: 0, out: 1, playin: 2, loser78: 3 };
  const rec = (x: LotTeam) => x.tid != null ? x.tid : x.cand![1];
  teams.sort((a, b) => rank[a.tier] - rank[b.tier] || cmp(rec(a), rec(b)));
  return { teams, projected };
}

// Which field entries may be drawn for slot k (1-based), given who's still in the drum.
function eligible(f: LotTeam[], left: number[], k: number) {
  let c = left;
  const bot = left.filter(i => f[i].tier === 'bottom'), floor = Math.min(FLOOR, f.length);
  if (bot.length && floor - k + 1 <= bot.length) c = bot;
  const ok = c.filter(i => !(k === 1 && f[i].noOne) && !(k <= 5 && f[i].noTop5));
  return ok.length ? ok : c;
}

// One drawing: field indices in pick order.
export function drawLottery(f: LotTeam[], rnd: () => number = Math.random): number[] {
  const left = f.map((_, i) => i), order: number[] = [];
  for (let k = 1; left.length; k++) {
    const c = eligible(f, left, k), tot = c.reduce((a, i) => a + f[i].balls, 0);
    let r = rnd() * tot, pick = c[c.length - 1];
    for (const i of c) { r -= f[i].balls; if (r <= 0) { pick = i; break; } }
    order.push(pick); left.splice(left.indexOf(pick), 1);
  }
  return order;
}

// Exact odds: odds[i][k] = chance field entry i gets pick k+1. Walks every possible drum
// state (2^n) for fields up to 18 teams; bigger (expanded) leagues use 60,000 simulated draws.
const cache = new Map<string, number[][]>();
export function lotteryOdds(f: LotTeam[]): number[][] {
  const key = f.map(x => x.tier + x.balls + (x.noOne ? 'a' : '') + (x.noTop5 ? 'b' : '')).join(',');
  const hit = cache.get(key); if (hit) return hit;
  const n = f.length, odds = f.map(() => new Array(n).fill(0));
  if (n <= 18) {
    const P = new Float64Array(1 << n); P[0] = 1;
    const pop = (m: number) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
    for (let m = 0; m < (1 << n) - 1; m++) {
      const p = P[m]; if (!p) continue;
      const k = pop(m) + 1, left: number[] = []; for (let i = 0; i < n; i++) if (!(m & (1 << i))) left.push(i);
      const c = eligible(f, left, k), tot = c.reduce((a, i) => a + f[i].balls, 0);
      c.forEach(i => { const q = p * f[i].balls / tot; odds[i][k - 1] += q; P[m | (1 << i)] += q; });
    }
  } else {
    let a = 0x9e3779b9; const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const N = 60000; for (let r = 0; r < N; r++) drawLottery(f, rnd).forEach((i, k) => (odds[i][k] += 1 / N));
  }
  cache.set(key, odds); if (cache.size > 50) cache.delete(cache.keys().next().value!);
  return odds;
}
export const expectedPick = (row: number[]) => row.reduce((a, p, k) => a + p * (k + 1), 0);

// Expected first-round slot by league rank (1 = worst record), for valuing future picks.
const rankCache = new Map<number, number[]>();
export function expectedByRank(nTeams: number): number[] {
  const hit = rankCache.get(nTeams); if (hit) return hit;
  const nOut = Math.max(0, nTeams - 20), f: LotTeam[] = [];
  const add = (tier: Tier, k: number) => { for (let i = 0; i < k; i++) f.push({ tid: f.length, conf: '', seed: 0, tier, balls: BALLS[tier], noOne: false, noTop5: false, why: [] }); };
  add('bottom', Math.min(3, nOut)); add('out', Math.max(0, nOut - 3)); add('playin', 4); add('loser78', 2);
  const ex = lotteryOdds(f).map(expectedPick), out = [0, ...ex];
  for (let r = f.length + 1; r <= nTeams; r++) out.push(r);
  rankCache.set(nTeams, out); return out;
}

// The first round in order: the lottery (drawn, or ranked by expected pick for a projection),
// then everyone else worst record first.
export function firstRoundOrder(g: Game, s: any, drawn?: number[]) {
  const f = lotteryField(g, s), cmp = worstFirst(g, s);
  const lotIdx = drawn || f.teams.map((_, i) => i).map(i => ({ i, e: expectedPick(lotteryOdds(f.teams)[i]) })).sort((a, b) => a.e - b.e).map(x => x.i);
  const lotT = lotIdx.map(i => f.teams[i].tid ?? f.teams[i].cand![1]);
  const rest = s.teams.map((t: any) => t.tid).filter((t: number) => !lotT.includes(t)).sort(cmp);
  return { field: f, lot: lotIdx, order: [...lotT, ...rest] };
}

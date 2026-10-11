// Auto set lineup (Roster screen): three ways to set a team's order and minutes, each choosing
// lineups that make sense on the floor. The starting five is the best group that covers PG, SG, SF,
// PF and C (a center at point guard is worth almost nothing), and the next five are picked the same way
// as a second unit, so five centers never start together however good they are. Positions are fluid
// (see FIT); a roster that can't make a sensible five at all gets the engine's best-players order.
//  - best: the strongest positional five by overall, then the strongest second unit; automatic minutes.
//  - young: players under 26 start and play (the five picked by a mix of overall and potential); everyone
//    26 or older goes to the bottom, oldest last, on a few minutes each (fewer the older he is).
//  - bench: the bench becomes the starting five (positional), the starters go to the bottom of the rotation.
// Two-way and Exhibit 10 players and anyone who can't play keep to the end.
import type { Game } from './Game';

export type AutoMode = 'best' | 'young' | 'bench';
export const AUTO_MODES: [AutoMode, string][] = [['best', 'Best lineup'], ['young', 'Play young prospects'], ['bench', 'Play bench players']];
const SLOTS = ['PG', 'SG', 'SF', 'PF', 'C'];
// How well each listed position plays each spot. Fluid on purpose: a G is either guard, a GF either wing,
// an F either forward, an FC either big, and neighbors overlap (combo guards, stretch fours), so 2 G +
// 2 F + C, G + 2 GF + PF + FC and PG + SG + 2 F + C all read as sound lineups.
const FIT: Record<string, number[]> = { PG: [1, .85, .35, .1, 0], SG: [.8, 1, .8, .25, 0], G: [.95, .95, .45, .1, 0], SF: [.25, .8, 1, .85, .3], GF: [.35, .95, .95, .5, .1], F: [.1, .45, .95, .95, .5], PF: [0, .15, .75, 1, .75], FC: [0, .05, .35, .95, .95], C: [0, 0, .15, .7, 1] };
const fitOf = (pos: string, slot: number) => (FIT[pos] || FIT.F)[slot];

// The five (from `pool`) with the highest sum of score × fit at their slot, returned in slot order
// (PG, SG, SF, PF, C): every way to fill the five slots from the whole pool (a roster is small enough).
// A player out of position counts for little (a center at point guard for almost nothing).
const worth = (P: Record<number, any>, id: number, slot: number, score: (id: number) => number) => score(id) * (0.05 + 0.95 * fitOf(P[id].pos, slot));
export function positionalFive(P: Record<number, any>, pool: number[], score: (id: number) => number): number[] {
  const n = Math.min(5, pool.length), cur: number[] = [], used = new Set<number>(); let best: number[] = [], bestV = -1;
  const W = new Map<number, number[]>(pool.map(id => [id, [0, 1, 2, 3, 4].map(j => worth(P, id, j, score))]));
  const top = [0, 1, 2, 3, 4].map(j => Math.max(0, ...pool.map(id => W.get(id)![j]))); // upper bound per slot, for pruning
  const go = (j: number, v: number) => {
    if (j === n) { if (v > bestV) { bestV = v; best = cur.slice(); } return; }
    let bound = v; for (let k = j; k < n; k++) bound += top[k]; if (bound <= bestV) return;
    for (const id of pool) { if (used.has(id)) continue; used.add(id); cur.push(id); go(j + 1, v + W.get(id)![j]); cur.pop(); used.delete(id); }
  };
  go(0, 0);
  // No sensible five to be had (no guards at all, say): the engine's own call, the best players first.
  const avgFit = best.reduce((a, id, j) => a + fitOf(P[id].pos, j), 0) / Math.max(1, best.length);
  if (best.length === 5 && avgFit < 0.55) return pool.slice().sort((a, b) => score(b) - score(a)).slice(0, 5);
  return best;
}

// The new order for the team's roster and the minutes targets to set (null: back to automatic).
export function autoLineup(g: Game, s: any, tid: number, mode: AutoMode): { order: number[]; rot: Record<number, number | null>; starters: number[] } {
  const P = g.db.P, roster: number[] = (s.rosters[tid] || []).slice();
  const main = roster.filter(id => P[id].ctype !== 'twoWay' && P[id].ctype !== 'ex10');
  const can = (id: number) => g.canPlay1(s, P[id]);
  const fit = main.filter(can), out = main.filter(id => !can(id)), extra = roster.filter(id => !main.includes(id));
  const ovr = (id: number) => P[id].ovr, rot: Record<number, number | null> = {};
  let order: number[] = [];
  if (mode === 'best') {
    const st = positionalFive(P, fit, ovr), rest = fit.filter(id => !st.includes(id)), second = positionalFive(P, rest, ovr);
    order = [...st, ...second, ...rest.filter(id => !second.includes(id)).sort((a, b) => ovr(b) - ovr(a))];
    main.forEach(id => (rot[id] = null));
  } else if (mode === 'bench') {
    const now = fit.slice(0, 5), bench = fit.slice(5);
    const st = positionalFive(P, bench.length >= 5 ? bench : [...bench, ...now.slice().sort((a, b) => ovr(a) - ovr(b))], ovr);
    const rest = bench.filter(id => !st.includes(id)).sort((a, b) => ovr(b) - ovr(a));
    order = [...st, ...rest, ...now.filter(id => !st.includes(id)).sort((a, b) => ovr(b) - ovr(a))];
    main.forEach(id => (rot[id] = null));
  } else {
    const age = (id: number) => P[id].age, young = fit.filter(id => age(id) < 26), old = fit.filter(id => age(id) >= 26).sort((a, b) => age(a) - age(b) || ovr(b) - ovr(a));
    // A prospect's worth: half now, half ceiling; a veteran counts for less the older he is, so the young
    // start wherever they fit and the youngest veterans fill a position nobody young can play.
    const prospect = (id: number) => (0.5 * P[id].ovr + 0.5 * (P[id].pot ?? P[id].ovr)) * (age(id) < 26 ? 1 : Math.max(0.15, 0.6 - 0.06 * (age(id) - 26)));
    const st = positionalFive(P, fit, prospect), yRest = young.filter(id => !st.includes(id)), second = positionalFive(P, yRest, prospect);
    const youngOrder = [...st, ...second, ...yRest.filter(id => !second.includes(id)).sort((a, b) => prospect(b) - prospect(a))];
    const vets = old.filter(id => !st.includes(id));
    order = [...youngOrder, ...vets];
    // Veterans: a few minutes, fewer the older (8 at 26, none from 34). The young share what's left of 240.
    vets.forEach(id => (rot[id] = Math.max(0, 8 - (age(id) - 26))));
    const vetMin = vets.reduce((a, id) => a + (rot[id] as number), 0), playing = youngOrder.slice(0, 10);
    const base = playing.map((_, i) => [34, 33, 32, 30, 28, 24, 20, 17, 14, 8][i]), sum = base.reduce((a, b) => a + b, 0) || 1, k = Math.max(0, 240 - vetMin) / sum;
    playing.forEach((id, i) => (rot[id] = Math.min(38, Math.round(base[i] * k))));
    youngOrder.slice(10).forEach(id => (rot[id] = 2));
  }
  return { order: [...order, ...out, ...extra], rot, starters: order.slice(0, 5) };
}
export const slotName = (i: number) => SLOTS[i];

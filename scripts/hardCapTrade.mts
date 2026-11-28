// A hard-capped team's trade must leave room to fill its roster to the minimum with minimum deals (cba.ts checkTrade,
// 2026-11-28: a trade took the room a mid-level signing had kept for the 14th player and opening night's fill went
// over the apron). Run: npx tsx scripts/hardCapTrade.mts
import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { checkTrade, nums, rosterMin, setCap, stdIds, teamSalary, tradeHit } from '../src/engine/cba';

const g: any = newLeague(3),
  P = g.db.P,
  N = nums(g);
const A = 4,
  B = 5;
const ids = (t: number) => stdIds(g, g.state.rosters[t]).sort((x: number, y: number) => tradeHit(g, P[x]) - tradeHit(g, P[y]));
// A one-for-one swap: A sends a cheap player and takes back one paid a little more.
const a1 = ids(A)[1],
  b1 = ids(B).find((id: number) => tradeHit(g, P[id]) > tradeHit(g, P[a1]) + 0.1 && tradeHit(g, P[id]) < tradeHit(g, P[a1]) + 1)!;
assert.ok(b1 != null, 'a matching player');
const plus = tradeHit(g, P[b1]) - tradeHit(g, P[a1]);
function setUp(std: number) {
  // Roster at `std` standard players (the rest to free agency), hard-capped at the 1st apron, payroll set so the
  // trade lands just under it.
  const keep = ids(A).filter((id: number) => id === a1 || ids(A).indexOf(id) < 999),
    drop = keep.filter((id: number) => id !== a1).slice(0, Math.max(0, keep.length - std));
  g.setState((st: any) => ({
    rosters: { ...st.rosters, [A]: st.rosters[A].filter((id: number) => !drop.includes(id)) },
    fa: [...st.fa, ...drop],
    cap: setCap(st, A, { hardCap: 'AP1' }),
  }));
  const s = g.state;
  s.teams[A].capAdj = 0;
  s.teams[A].capAdj = +(N.AP1 - 0.2 - plus - teamSalary(g, s, A)).toFixed(2);
}
setUp(rosterMin(g.state) - 1);
assert.equal(stdIds(g, g.state.rosters[A]).length, rosterMin(g.state) - 1);
const short = checkTrade(g, g.state, A, B, [a1], [b1], [], []);
assert.ok(!short.ok && short.errs.some((e: string) => /needs room to fill its roster/.test(e)), JSON.stringify(short.errs));
// A full roster: the same trade under the apron is fine for the cap.
g.setState((st: any) => ({ rosters: { ...st.rosters, [A]: [...st.rosters[A], st.fa[st.fa.length - 1]] }, fa: st.fa.slice(0, -1) }));
g.state.teams[A].capAdj = 0;
g.state.teams[A].capAdj = +(N.AP1 - 0.2 - plus - teamSalary(g, g.state, A)).toFixed(2);
const full = checkTrade(g, g.state, A, B, [a1], [b1], [], []);
assert.ok(!full.errs.some((e: string) => /hard-capped/.test(e)), JSON.stringify(full.errs));
console.log('hard cap trade ok');

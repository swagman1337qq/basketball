// How a player will age, as the league can see it (2026-10-28). Every decision that looks ahead at a veteran (trade
// value, the outlook that prices draft picks, asking prices, roster spots, re-signing, how long a deal he wants) runs his
// coming seasons through the same code that ages him (development.ts skillAging and bodyChange), so the two can't drift
// apart. The league sees his skills and age, not his hidden athletic peak or how long his shot holds: it uses the typical
// ones (29 and 32). So an old shooter is worth more than an old athlete of the same overall, as in real basketball.
import type { Game } from './Game';
import { applyChange, BODY, bodyChange, skillAging } from './development';
import { ovrExact } from './ratings';

const SEEN = { pk: 29, hold: 32 };
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// His exact overall each season ahead from aging alone (growth isn't in it), for `years` seasons (up to 7 from his age
// now are remembered for the season, recomputed when his overall moves).
const PATHS = new WeakMap<object, Map<number, { o: number; a: number; path: number[] }>>();
export function agingPath(p: any, years: number, age = p.age): number[] {
  if (age === p.age && years <= 7 && p.id != null) {
    let m = PATHS.get(p.r); if (!m) { m = new Map(); PATHS.set(p.r, m); }
    const hit = m.get(0); if (hit && hit.o === p.ovr && hit.a === age) return hit.path.slice(0, years);
    const path = pathOf(p, 7, age); m.set(0, { o: p.ovr, a: age, path }); return path.slice(0, years);
  }
  return pathOf(p, years, age);
}
function pathOf(p: any, years: number, age: number): number[] {
  const q: any = { ...p, age, r: { ...p.r }, rx: { ...(p.rx || {}) }, ph: p.ph ? { ...p.ph, g: { ...p.ph.g } } : undefined }, out: number[] = [];
  for (let i = 1; i <= years; i++) {
    q.age = age + i;
    const ag = skillAging(q, 1, 1, SEEN), body = bodyChange(q, 1, { work: p.pers?.work ?? 50, slow: 1, rnd: () => 0.5, dry: true, pk: SEEN.pk });
    BODY.forEach(k => { if (body[k] > 0) body[k] = 0; }); // the body's growth isn't aging
    applyChange(q, { ...body, ...ag }); out.push(ovrExact(q));
  }
  return out;
}

// What aging costs him over the next n seasons (overall points; negative = he gains), remembered for the season.
// (Cached by player, seasons ahead and age; recomputed when his overall moves.)
const MEMO = new WeakMap<object, { Y: number; m: Map<number, { o: number; v: number }> }>();
export function agingLoss(g: Game, p: any, n = 3, age = p.age): number {
  if (!p?.r) return 0;
  let c = MEMO.get(g.db); if (!c || c.Y !== g.Y) { c = { Y: g.Y, m: new Map() }; MEMO.set(g.db, c); }
  const key = p.id * 1000 + n * 100 + age, hit = c.m.get(key); if (hit && hit.o === p.ovr) return hit.v;
  const path = agingPath(p, n, age), v = ovrExact(p) - path[n - 1]; c.m.set(key, { o: p.ovr, v }); return v;
}

// A typical player's loss at each age: the league's rostered players, each run at that age (once a season).
const TYP = new WeakMap<object, { Y: number; t: Record<number, number> }>();
export function typicalLoss(g: Game, age: number, n = 3): number {
  let c = TYP.get(g.db); if (!c || c.Y !== g.Y) { c = { Y: g.Y, t: {} }; TYP.set(g.db, c); }
  const key = age * 10 + n, t0 = c.t[key]; if (t0 != null) return t0;
  const ids = (Object.values(g.state?.rosters || {}).flat() as number[]).slice(0, 600), ps = ids.map(id => g.db.P[id]).filter((p: any) => p?.r);
  const v = ps.length ? ps.reduce((a: number, p: any) => a + agingLoss(g, p, n, age), 0) / ps.length : 0;
  c.t[key] = v; return v;
}

// How he ages against a typical player his age: above 1 if he'll hold up better (a shooter), below 1 if worse (an
// athlete). 1 under 28. `k`: how much each overall point of difference over three seasons counts.
export function agingEdge(g: Game, p: any, k = 0.05, lo = 0.8, hi = 1.2): number {
  if (!p?.r || p.age < 28) return 1;
  return cl(1 + k * (typicalLoss(g, p.age) - agingLoss(g, p)), lo, hi);
}

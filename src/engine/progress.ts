// Year-over-year progress: every player's ratings are snapshotted on opening night and again at
// the end of the season (before offseason development), so the game can show how a player
// changed over the past year, during the season, and over the summer.
// Stored on the player as p.rh[season] = { o: opening night, e: end of season }.
import type { Game } from './Game';

export interface Snap { ovr: number; pot: number; r: Record<string, number>; ovrI?: number }
// Exact values: the displayed rating plus its hidden decimal progress (so changes read like ▲6.9).
export const exactOvr = (p: any) => +(p.ovr + (p.ox || 0)).toFixed(2);
export const exactR = (p: any, k: string) => +(p.r[k] + ((p.rx || {})[k] || 0)).toFixed(2);
const snap = (p: any): Snap => ({ ovr: exactOvr(p), ovrI: p.ovr, pot: p.pot, r: Object.fromEntries(Object.keys(p.r).map(k => [k, exactR(p, k)])) });
const d1 = (x: number) => Math.round(x * 10) / 10;
// ▲6.9 / ▼1.1 / – (one decimal).
export const fmtChange = (x: number | null | undefined, dec = 1) => x == null ? '' : Math.abs(x) < 0.05 ? '–' : (x > 0 ? '▲' : '▼') + Math.abs(x).toFixed(dec);
const everyone = (s: any): number[] => [...(Object.values(s.rosters).flat() as number[]), ...(s.fa || []), ...(s.overseas || [])];

// Opening night of `season` (also used when a league starts, or an older save first loads).
export function snapOpening(g: Game, s: any, season = g.Y) {
  const P = g.db.P; everyone(s).forEach(id => { const p = P[id]; if (!p) return; const h = (p.rh = p.rh || {}); if (!h[season]?.o) h[season] = { ...(h[season] || {}), o: snap(p) }; });
}
// End of `season`, just before offseason development.
export function snapEnd(g: Game, s: any, season = g.Y) {
  const P = g.db.P; everyone(s).forEach(id => { const p = P[id]; if (!p) return; const h = (p.rh = p.rh || {}); h[season] = { ...(h[season] || {}), e: snap(p) }; });
}

// What to compare a player against: opening night of last season (the past year), or of this
// season if he has no earlier snapshot. null when there's no history yet.
export function baseline(g: Game, p: any): { snap: Snap; label: string } | null {
  const h = p.rh || {}, Y = g.Y, lbl = (y: number) => 'opening night ' + (y - 1) + '–' + String(y).slice(2);
  if (h[Y - 1]?.o) return { snap: h[Y - 1].o, label: lbl(Y - 1) };
  if (h[Y]?.o) return { snap: h[Y].o, label: lbl(Y) };
  return null;
}
export function deltas(p: any, b: Snap) {
  const r: Record<string, number> = {}; Object.keys(p.r).forEach(k => { if (b.r[k] != null) r[k] = d1(exactR(p, k) - b.r[k]); });
  return { ovr: d1(exactOvr(p) - b.ovr), pot: p.pot - b.pot, r };
}

// Season by season: opening-night overall, the change during the season, over the summer, and
// the biggest rating moves across the whole year (opening night to the next opening night).
export function yearByYear(g: Game, p: any) {
  const h = p.rh || {}, years = Object.keys(h).map(Number).sort((a, b) => b - a), out: any[] = [];
  years.forEach(y => { const o = h[y]?.o; if (!o) return;
    const e = h[y].e, next = h[y + 1]?.o ?? (y === g.Y ? snap(p) : e), live = !h[y + 1]?.o && y === g.Y;
    const moves = next ? Object.keys(o.r).map(k => [k, d1((next.r[k] ?? o.r[k]) - o.r[k])] as [string, number]).filter(([, d]) => Math.abs(d) >= 0.05).sort((a, b) => b[1] - a[1]) : [];
    out.push({ season: y, open: o.ovrI ?? Math.round(o.ovr), pot: o.pot, inSeason: e ? d1(e.ovr - o.ovr) : live ? d1(exactOvr(p) - o.ovr) : null, summer: e && h[y + 1]?.o ? d1(h[y + 1].o.ovr - e.ovr) : null,
      total: next ? d1(next.ovr - o.ovr) : null, potD: next ? next.pot - o.pot : null, up: moves.filter(m => m[1] > 0).slice(0, 3), down: moves.filter(m => m[1] < 0).slice(-3).reverse(), live });
  });
  return out;
}
export const RNAME: Record<string, string> = { hgt: 'Height', stre: 'Strength', spd: 'Speed', acc: 'Acceleration', jmp: 'Jumping', endu: 'Endurance', ins: 'Inside', dnk: 'Dunks', lay: 'Layups', ft: 'Free throws', fg: 'Mid-range', tp: 'Three-pointers', oiq: 'Offensive IQ', diq: 'Defensive IQ', drb: 'Dribbling', pss: 'Passing', reb: 'Rebounding', box: 'Boxing out' };

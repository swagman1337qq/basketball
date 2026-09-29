// Where a rating stands in the league: the share of NBA players he rates above (a percentile),
// so "Elite" means top 3% at that skill in this league, not just a number over 80. Percentiles
// rather than the mean: ratings like dunks or blocking are skewed, and a rank says it straight.
import type { Game } from './Game';

let cache: { key: string; d: Record<string, number[]> } = { key: '', d: {} };
const valOf = (p: any, k: string) => (k === 'feel' || k === 'poise' ? p.intg?.[k] : p.r?.[k]);

function dist(g: Game, s: any, k: string): number[] {
  const key = s.day + '|' + s.phase + '|' + (s.gv || 0) + '|' + g.Y;
  if (cache.key !== key) cache = { key, d: {} };
  if (!cache.d[k]) { const P = g.db.P; cache.d[k] = (Object.values(s.rosters).flat() as number[]).map(id => valOf(P[id], k)).filter((v: any) => typeof v === 'number').sort((a, b) => a - b); }
  return cache.d[k];
}
// 0–100: share of NBA players below him (ties count half).
export function ratingPct(g: Game, s: any, k: string, v: number): number | null {
  const d = dist(g, s, k); if (d.length < 20) return null;
  let lo = 0, eq = 0; for (const x of d) { if (x < v) lo++; else if (x === v) eq++; }
  return (100 * (lo + eq / 2)) / d.length;
}
export function ratingMedian(g: Game, s: any, k: string): number | null { const d = dist(g, s, k); return d.length ? d[Math.floor(d.length / 2)] : null; }

export const PCT_TIERS: [string, string, number, string][] = [['Elite', 'var(--gm-elite)', 97, 'top 3%'], ['Great', 'var(--gm-good)', 88, 'top 12%'], ['Good', '#4a9fd8', 70, 'top 30%'], ['Average', 'var(--color-text)', 30, 'middle 40%'], ['Below avg', '#d98a2b', 10, 'next 20%'], ['Poor', 'var(--gm-bad)', 0, 'bottom 10%']];
export const pctTier = (pc: number) => PCT_TIERS.find(t => pc >= t[2]) || PCT_TIERS[PCT_TIERS.length - 1];

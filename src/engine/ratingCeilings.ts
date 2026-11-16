// Development limits never depend on whether God Mode is switched on. Editors write ratings
// directly; ordinary growth (including a manually edited player) still respects these limits.
import { skillTop } from './ratings';

export const PHYSICAL = ['spd', 'acc', 'jmp', 'stre', 'endu'];
export const MENTAL = ['feel', 'poise'];
export const BASKETBALL = ['tp', 'fg', 'ft', 'ins', 'lay', 'dnk', 'pss', 'drb', 'oiq', 'diq', 'stl', 'blk', 'reb', 'box'];
export const TRAINABLE = [...BASKETBALL, ...PHYSICAL, ...MENTAL];
const ixKey = (k: string) => (k === 'feel' ? 'f' : 'p');
export const ratingValue = (p: any, k: string): number =>
  MENTAL.includes(k) ? (p.intg?.[k] ?? 50) + (p.ix?.[ixKey(k)] || 0) : (p.r?.[k] ?? 0) + (p.rx?.[k] || 0);

// A missing ceiling fails closed, rather than silently granting room to 99.
export function ratingLimit(p: any, k: string): number {
  const ceiling = p.ceil?.[k];
  return Math.min(Number.isFinite(ceiling) ? ceiling : ratingValue(p, k), skillTop(p, k));
}
export const limitGrowth = (p: any, k: string, change: number): number =>
  change > 0 ? Math.min(change, Math.max(0, ratingLimit(p, k) - ratingValue(p, k))) : change;
export const limitWholeRating = (p: any, k: string, target: number): number =>
  target > p.r[k] ? Math.min(target, Math.max(p.r[k], Math.floor(ratingLimit(p, k) - (p.rx?.[k] || 0) + 1e-9))) : target;

// An edited/legacy 98 above a lower personal ceiling cannot turn into a natural exception.
export const breakthroughEligible = (p: any, k: string): boolean =>
  (MENTAL.includes(k) ? p.intg?.[k] : p.r?.[k]) === 98 && ratingLimit(p, k) >= 98 && !p.brk?.[k] && p.gen !== k;

export function growIntangible(p: any, k: string, change: number) {
  const key = ixKey(k);
  p.ix = p.ix || { f: 0, p: 0 };
  const value = ratingValue(p, k) + limitGrowth(p, k, change),
    whole = Math.trunc(value + 1e-9);
  p.intg[k] = Math.max(1, Math.min(99, whole));
  p.ix[key] = +(value - whole).toFixed(4);
}

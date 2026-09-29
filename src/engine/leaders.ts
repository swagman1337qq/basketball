// League leaders for a regular season, for Basketball-Reference-style bold numbers: the best
// per-game average (among players with 70% of the games) or the best total, and the best
// percentages among qualified shooters (300 made field goals, 82 threes, 125 free throws over a
// full season, scaled to games played so far).
import type { Game } from './Game';

export type LeadMode = 'pg' | 'tot';
const CACHE = new Map<string, Record<string, number>>();

// Display value for a stat key from season totals (the same rounding the tables show).
export function statVal(t: any, k: string, mode: LeadMode | 'p36'): number {
  const n = (x: number) => (mode === 'tot' ? x : mode === 'p36' ? (t.min ? (x / t.min) * 36 : 0) : t.gp ? x / t.gp : 0);
  const two = (t.fgm || 0) - (t.tpm || 0), twoA = (t.fga || 0) - (t.tpa || 0);
  switch (k) {
    case 'gp': return t.gp; case 'gs': return t.gs || 0;
    case 'min': return mode === 'tot' ? t.min : t.gp ? t.min / t.gp : 0;
    case 'fgp': return t.fga ? t.fgm / t.fga : NaN; case 'tpp': return t.tpa ? t.tpm / t.tpa : NaN; case 'ftp': return t.fta ? t.ftm / t.fta : NaN;
    case 'twp': return twoA ? two / twoA : NaN; case 'efg': return t.fga ? (t.fgm + 0.5 * t.tpm) / t.fga : NaN;
    case 'twm': return n(two); case 'twa': return n(twoA); case 'trb': return n((t.orb || 0) + (t.drb || 0));
    default: return n(t[k] || 0);
  }
}
const PCT = new Set(['fgp', 'tpp', 'ftp', 'twp', 'efg']);
export const roundStat = (k: string, v: number, mode: LeadMode | 'p36') => (PCT.has(k) ? Math.round(v * 1000) : mode === 'tot' || k === 'gp' || k === 'gs' ? Math.round(v) : Math.round(v * 10));
export const LEAD_KEYS = ['gp', 'gs', 'min', 'fgm', 'fga', 'fgp', 'tpm', 'tpa', 'tpp', 'twm', 'twa', 'twp', 'efg', 'ftm', 'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'stl', 'blk', 'tov', 'pf', 'pts'];

export function seasonLeaders(g: Game, s: any, y: number, mode: LeadMode): Record<string, number> {
  const cur = y === g.Y, key = y + '|' + mode + (cur ? '|' + s.day + '|' + s.phase : '');
  const hit = CACHE.get(key); if (hit) return hit;
  const maxGp = cur ? Math.max(1, ...s.teams.map((t: any) => t.w + t.l)) : 82, f = maxGp / 82;
  const need: Record<string, [string, number]> = { fgp: ['fgm', 300], efg: ['fgm', 300], twp: ['fgm', 300], tpp: ['tpm', 82], ftp: ['ftm', 125] };
  const best: Record<string, number> = {};
  (Object.values(g.db.P) as any[]).forEach(q => {
    if (!(q.stats || []).some((r: any) => r.season === y && !r.po)) return;
    const t = g.seasonTotals(q, y); if (!t || !t.gp) return;
    const qual = mode === 'tot' || t.gp >= 0.7 * maxGp;
    LEAD_KEYS.forEach(k => {
      if (PCT.has(k)) { const [m, n] = need[k]; if ((t[m] || 0) < n * f) return; } else if (!qual && k !== 'gp' && k !== 'gs') return;
      const v = roundStat(k, statVal(t, k, mode), mode); if (isFinite(v) && (best[k] == null || v > best[k])) best[k] = v;
    });
  });
  if (CACHE.size > 60) CACHE.clear();
  CACHE.set(key, best); return best;
}

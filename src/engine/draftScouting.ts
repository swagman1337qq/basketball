// Automatic draft research follows owned picks, while leaving room to know the
// head of the class. Uses the draft board and existing pick projections only.
import type { Game } from './Game';
import { projStrength, slotDist } from './tradeLogic';

export interface ScoutPick {
  year: number;
  slot: number;
  round: number;
  exact: boolean;
}
export interface DraftResearch {
  picks: ScoutPick[];
  ranks: Map<number, { year: number; rank: number }>;
  available: Set<number>;
}
export function draftResearch(g: Game, s: any, tid: number): DraftResearch {
  const assigned = new Set<number>([...Object.values(s.rosters || {}).flat(), ...(s.fa || [])] as number[]);
  const taken = new Set<number>((s.picks || []).map((p: any) => p.pid).filter((id: any) => id != null));
  const ranks = new Map<number, { year: number; rank: number }>(),
    available = new Set<number>();
  const years = Object.keys(g.db.cls || {})
    .map(Number)
    .filter(y => y >= g.Y && y <= g.Y + 3)
    .sort((a, b) => a - b);
  for (const year of years) {
    // Keep original class ranks during the draft: #36 is not the 36th player
    // left after the first 35 selections.
    const ids = [...new Set<number>(g.db.cls[year] || [])].filter(id => g.db.P[id]?.r);
    ids.sort((a, b) => ((g.db as any).rank?.[a] ?? 9999) - ((g.db as any).rank?.[b] ?? 9999) || a - b);
    ids.forEach((id, i) => {
      const p = g.db.P[id];
      ranks.set(id, { year, rank: i + 1 });
      if (!p.gone && !p.retired && !assigned.has(id) && !(year === g.Y && taken.has(id))) available.add(id);
    });
  }
  const activeYears = new Set([...available].map(id => ranks.get(id)!.year));
  const order = g.boardOrder(s),
    picks: ScoutPick[] = [],
    n = s.teams.length;
  const exact = s.phase === 'draft' || (s.phase === 'lottery' && !!s.lotto);
  for (const a of s.assets || []) {
    if (a.owner !== tid || a.pid != null || !activeYears.has(a.yr) || ![1, 2].includes(a.rd || 1)) continue;
    const rd = a.rd || 1,
      current = a.yr === g.Y ? order.find((p: any) => p.orig === a.orig && (p.rd || 1) === rd) : null;
    if (current?.pid != null) continue;
    let slot: number;
    if (current) slot = current.n;
    else if (rd === 1) slot = slotDist(g, s, a.orig, a.yr).reduce((sum, [v, w]) => sum + v * w, 0);
    else {
      const yearsAhead = a.yr - g.Y;
      const strength = new Map<number, number>(s.teams.map((t: any) => [t.tid, projStrength(g, s, t.tid, yearsAhead)]));
      const teams = s.teams.slice().sort((a: any, b: any) => strength.get(a.tid)! - strength.get(b.tid)! || a.tid - b.tid);
      slot = n + teams.findIndex((t: any) => t.tid === a.orig) + 1;
    }
    if (slot > 0 && Number.isFinite(slot))
      picks.push({ year: a.yr, slot: Math.round(slot), round: rd, exact: a.yr === g.Y && !!current && exact });
  }
  picks.sort((a, b) => a.year - b.year || a.slot - b.slot);
  return { picks, ranks, available };
}
export const inPickRange = (research: DraftResearch, id: number, pick: ScoutPick) => {
  const p = research.ranks.get(id);
  return !!p && research.available.has(id) && p.year === pick.year && Math.abs(p.rank - pick.slot) <= (pick.round === 1 ? 6 : 8);
};

// scored is already in the scout's own preferred order. Most slots go around
// each owned selection, with two of eight reserved for the top of the class.
export function prioritizeDraft<T extends { id: number }>(
  scored: T[],
  research: DraftResearch,
  limit: number,
): { item: T; pick?: ScoutPick }[] {
  const out: { item: T; pick?: ScoutPick }[] = [],
    chosen = new Set<number>();
  const add = (item: T | undefined, pick?: ScoutPick) => {
    if (!item || chosen.has(item.id) || out.length >= limit) return false;
    chosen.add(item.id);
    out.push({ item, pick });
    return true;
  };
  const relevant = research.picks.filter(pick => scored.some(x => inPickRange(research, x.id, pick)));
  if (!relevant.length) return scored.slice(0, limit).map(item => ({ item }));
  const near = Math.max(1, limit - Math.max(1, Math.round(limit / 4)));
  let advanced = true;
  while (out.length < near && advanced) {
    advanced = false;
    for (const pick of relevant) {
      const item = scored.find(x => !chosen.has(x.id) && inPickRange(research, x.id, pick));
      if (out.length < near && add(item, pick)) advanced = true;
    }
  }
  for (const item of scored) if ((research.ranks.get(item.id)?.rank ?? 9999) <= 5) add(item);
  for (const item of scored) add(item);
  return out;
}

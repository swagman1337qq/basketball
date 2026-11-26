import type { Game } from './Game';

export const draftYearOf = (p: any): number => (p.dr ? p.draft || p.cls : p.undrafted || p.cls || p.draft);

// Class membership survives the original prospect index being pruned or a
// retained `cls` disagreeing with the year in the player's actual draft record.
export function draftClassRecords(g: Game, year: number) {
  const used = new Map<number, { n: number; rd: number; tid: number }>();
  for (const [key, value] of Object.entries(g.db.pickUsed || {}) as [string, any][])
    if (key.startsWith(year + '-') && value?.pid != null) used.set(value.pid, { n: value.n, rd: +key.split('-')[1], tid: value.tid });
  const indexed = new Set<number>(g.db.cls?.[year] || []);
  const teamsThen = (Object.values(g.state.teamHist || {}) as any[][]).filter(rows => rows.some(row => row.season === year)).length;
  const roundSize = teamsThen || (year < (g.db.firstSeason || 2027) ? 30 : g.state.teams.length);
  return (Object.values(g.db.P) as any[])
    .filter(p => used.has(p.id) || draftYearOf(p) === year || (indexed.has(p.id) && !p.dr))
    .map(p => {
      const recorded = used.get(p.id);
      const pick = recorded?.n ?? (p.dr?.pick > 0 ? (p.dr.rd - 1) * roundSize + p.dr.pick : null);
      return { p, pick, round: recorded?.rd ?? p.dr?.rd ?? null, tid: recorded?.tid ?? p.draftTid ?? null };
    })
    .sort((a, b) => (a.pick ?? Infinity) - (b.pick ?? Infinity) || a.p.id - b.p.id);
}

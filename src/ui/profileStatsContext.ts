import type { Game } from '../engine/Game';
import type { StatsContext } from './profileStatsProtocol';

// Only statistical inputs cross the worker boundary: no ratings, faces, contracts,
// coaches, world data, box scores, play-by-play or UI objects.
export function profileStatsSnapshot(g: Game): StatsContext {
  const s = g.state;
  const players: Record<number, any> = {};
  for (const [id, p] of Object.entries(g.db.P) as [string, any][]) {
    if (!p.stats?.length && !Object.keys(p.ccpS || {}).length) continue;
    players[+id] = {
      id: p.id,
      age: p.age,
      pos: p.pos,
      gone: p.gone,
      retired: p.retired ? { season: p.retired.season } : undefined,
      stats: p.stats,
      ccpS: p.ccpS,
      dkS: p.dkS,
    };
  }
  return {
    year: g.Y,
    revision: g.statsVersion,
    firstSeason: g.db.firstSeason,
    players,
    // Preserve the engine's running-list order for exactly matching floating-point sums.
    currentIds: g.playersIn(g.Y).map(p => p.id),
    rapm: g.db.rapm,
    state: {
      season: g.Y,
      day: s.day,
      phase: s.phase,
      gv: s.gv || 0,
      teams: s.teams.map(t => ({ tid: t.tid, w: t.w, l: t.l })),
      tstats: s.tstats,
      tstatsHist: s.tstatsHist,
      teamHist: Object.fromEntries(
        Object.entries(s.teamHist || {}).map(([id, history]: [string, any]) => [
          id,
          history.map((x: any) => ({ season: x.season, w: x.w, l: x.l })),
        ]),
      ),
    },
  };
}

// Read-only equivalents of Game's statistics helpers. The actual advanced-stat and
// leader formulas are imported unchanged; tests compare these helpers and every result.
export function statsReader(context: StatsContext): Game {
  const P = context.players;
  const index = new Map<number, any[]>();
  const reader = {
    Y: context.year,
    statsVersion: context.revision,
    state: context.state,
    db: { P, firstSeason: context.firstSeason, rapm: context.rapm },
    ageIn: (p: any, y: number) => p.age - (context.year - y),
    playersIn(y: number) {
      let found = index.get(y);
      if (!found) {
        found =
          y === context.year
            ? context.currentIds.map(id => P[id]).filter(Boolean)
            : Object.values(P).filter(p => (p.stats || []).some((r: any) => r.season === y));
        if (y >= context.year) found = found.filter(p => !p.gone && (!p.retired || (p.retired.season ?? 0) >= y));
        index.set(y, found);
      }
      return found;
    },
    seasonTotals(p: any, y: number, po = false) {
      const rows = (p.stats || []).filter((r: any) => r.season === y && !!r.po === po);
      if (!rows.length) return null;
      const total: any = {};
      rows.forEach((r: any) =>
        Object.keys(r).forEach(k => {
          if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') total[k] = (total[k] || 0) + r[k];
        }),
      );
      Object.defineProperty(total, '_tid', {
        value: rows.slice().sort((a: any, b: any) => (b.min || 0) - (a.min || 0))[0].tid,
        enumerable: false,
      });
      return total;
    },
    possOf(t: any) {
      const one = (fga: number, fta: number, orb: number, oDrb: number, fgm: number, tov: number) =>
        fga + 0.4 * fta - 1.07 * (orb / Math.max(1, orb + oDrb)) * (fga - fgm) + tov;
      return 0.5 * (one(t.fga, t.fta, t.orb, t.oDrb, t.fgm, t.tov) + one(t.oFga, t.oFta, t.oOrb, t.drb, t.oFgm, t.oTov));
    },
  };
  return reader as unknown as Game;
}

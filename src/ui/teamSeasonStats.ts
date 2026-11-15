import type { Game } from '../engine/Game';

// Team totals don't store minutes in older saves. Recover the actual clock from
// the complete season game log (including OT), or from all players' team stints.
// Never use the current roster alone: traded/released players' minutes count too.
export function teamSeasonStats(gm: Game, state: any, season: number): Record<number, any> {
  const source = (season === gm.Y ? state.tstats : state.tstatsHist?.[season]) || {};
  const clocks: Record<number, { games: number; minutes: number }> = {};
  if (season === gm.Y)
    for (const game of state.games || []) {
      if (game.po) continue;
      for (const tid of [game.h, game.a]) {
        const clock = (clocks[tid] ||= { games: 0, minutes: 0 });
        clock.games++;
        clock.minutes += (48 + 5 * (game.ot || 0)) * 5;
      }
    }
  const missing = Object.entries(source).some(([tid, st]: [string, any]) => st.gp && !st.min && clocks[+tid]?.games !== st.gp);
  const playerMinutes: Record<number, number> = {};
  if (missing)
    for (const player of gm.playersIn(season))
      for (const line of player.stats || []) {
        if (line.season === season && !line.po && Number.isFinite(line.min))
          playerMinutes[line.tid] = (playerMinutes[line.tid] || 0) + line.min;
      }
  return Object.fromEntries(
    Object.entries(source).map(([tid, st]: [string, any]) => {
      const clock = clocks[+tid];
      const minutes = clock && clock.games === st.gp ? clock.minutes : st.min || playerMinutes[+tid];
      return [tid, { ...st, min: Number.isFinite(minutes) && minutes >= st.gp * 240 - 0.1 ? minutes : NaN }];
    }),
  );
}

export function teamSeasonValue(gm: Game, stats: any, key: string): number {
  if (!stats?.gp) return NaN;
  if (key === 'pts' || key === 'oPts') return stats[key] / stats.gp;
  const possessions = gm.possOf(stats);
  if (!(possessions > 0)) return NaN;
  return key === 'pace'
    ? (possessions * 48 * 5) / stats.min
    : key === 'off'
      ? (100 * stats.pts) / possessions
      : key === 'def'
        ? (100 * stats.oPts) / possessions
        : (100 * (stats.pts - stats.oPts)) / possessions;
}

import { Game } from '../engine/Game';
import { computeAdvanced, seasonAdvanced } from '../engine/advanced';
import { teamSeasonStats } from './teamSeasonStats';

const total = (target: any, line: any) => {
  target.gp = (target.gp || 0) + (line.gp || 0);
  for (const [key, value] of Object.entries(line))
    if (!['season', 'tid', 'gp'].includes(key) && typeof value === 'number') target[key] = (target[key] || 0) + value;
};
export interface RosterSeasonStats {
  teams: Record<number, any>;
  players: Record<number, any>;
  teamPlayers: Record<string, any>;
  games: any[];
  legacy: boolean;
}
export function rosterSeasonStats(gm: Game, state: any, season: number, playoffs = false): RosterSeasonStats {
  const games = season === gm.Y ? (state.games || []).filter(g => (playoffs ? g.po === 'po' : !g.po)) : [];
  if (!playoffs) return { teams: teamSeasonStats(gm, state, season), players: {}, teamPlayers: {}, games, legacy: false };
  const boxes: any[] = Object.values(gm.db.boxes || {}).filter((box: any) => box.season === season && box.kind === 'po');
  const teams: Record<number, any> = {},
    players: Record<number, any> = {},
    teamPlayers: Record<string, any> = {};
  const exact = season === gm.Y && boxes.length === games.length;
  if (exact) {
    for (const box of boxes)
      for (const side of ['home', 'away']) {
        const sd = box[side],
          op = box[side === 'home' ? 'away' : 'home'];
        const st = (teams[sd.tid] ||= { gp: 0, min: 0, w: 0, l: 0, pts: 0, oPts: 0 });
        st.gp++;
        st.min += (48 + 5 * (box.ot || 0)) * 5;
        st.w += sd.pts > op.pts ? 1 : 0;
        st.l += sd.pts < op.pts ? 1 : 0;
        st.pts += sd.pts;
        st.oPts += op.pts;
        for (const row of sd.lines) {
          const line = { gp: 1, ...Object.fromEntries(Game.BOX_F.map((key, i) => [key, row[i + 1] || 0])) };
          total((players[row[0]] ||= {}), line);
          total((teamPlayers[sd.tid + ':' + row[0]] ||= {}), line);
        }
        for (const key of ['fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'tov', 'ast', 'stl', 'blk', 'pf']) {
          const i = 1 + Game.BOX_F.indexOf(key);
          st[key] = (st[key] || 0) + sd.lines.reduce((n, row) => n + (row[i] || 0), 0);
          const oppKey = 'o' + key[0].toUpperCase() + key.slice(1);
          st[oppKey] = (st[oppKey] || 0) + op.lines.reduce((n, row) => n + (row[i] || 0), 0);
        }
      }
    // Preserve the richer tracked on/off stats when this player's saved line has
    // exactly these playoff appearances (no extra play-in appearances).
    for (const pid of Object.keys(players)) {
      const saved = gm.seasonTotals(gm.db.P[pid], season, true);
      if (saved?.gp === players[pid].gp) players[pid] = { ...saved, ...players[pid] };
    }
  } else {
    // Older seasons retain player postseason lines, not their individual game boxes.
    // Keep those real totals and expose unavailable opponent/record fields as missing.
    for (const p of gm.playersIn(season))
      for (const line of p.stats || []) {
        if (line.season !== season || !line.po) continue;
        total((players[p.id] ||= {}), line);
        total((teamPlayers[line.tid + ':' + p.id] ||= {}), line);
        total((teams[line.tid] ||= {}), line);
      }
    for (const st of Object.values(teams)) {
      st.gp = st.gs > 0 && st.gs % 5 === 0 ? st.gs / 5 : 0;
      st.oPts = st.onA > 0 ? st.onA / 5 : NaN;
      st.poss = st.onPO > 0 && st.onPD > 0 ? (st.onPO + st.onPD) / 10 : NaN;
    }
  }
  return { teams, players, teamPlayers, games, legacy: !exact && Object.keys(players).length > 0 };
}

export function rosterPlayoffAdvanced(gm: Game, state: any, season: number, data: RosterSeasonStats) {
  if (data.legacy) return seasonAdvanced(gm, state, season, true).byPid;
  const teams = Object.fromEntries(Object.entries(data.teams).map(([tid, st]) => [tid, { ...st }]));
  const tids = Object.keys(teams).map(Number);
  if (!tids.length) return {};
  const rows = Object.entries(data.players)
    .filter(([pid, t]) => gm.db.P[pid] && t.min > 0)
    .map(([pid, t]) => {
      const primary = tids
        .slice()
        .sort((a, b) => (data.teamPlayers[b + ':' + pid]?.min || 0) - (data.teamPlayers[a + ':' + pid]?.min || 0))[0];
      return { p: gm.db.P[pid], t: { ...t }, tid: primary };
    });
  return computeAdvanced(
    gm,
    season,
    teams,
    rows,
    tid => teams[tid].w / teams[tid].gp,
    tids,
    tids.reduce((n, tid) => n + teams[tid].w, 0),
    true,
  ).byPid;
}

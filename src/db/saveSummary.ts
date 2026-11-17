import type { SaveData } from '../engine/Game';

export interface SaveSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  summary: string;
  preview: {
    team?: any;
    spectator: boolean;
    teamName: string;
    season: string;
    phase: string;
    managed: number;
  };
}
const PHASE: Record<string, string> = {
  regular: 'Regular season',
  playin: 'Play-in',
  playoffs: 'Playoffs',
  lottery: 'Lottery',
  draft: 'Draft',
  preFA: 'Pre-free agency',
  fa: 'Free agency',
  preseason: 'Preseason',
};
// Never retain players, game history or a full state object in the league-list index.
export function saveSummary(row: Omit<SaveSummary, 'preview'> & { data: SaveData }): SaveSummary {
  const s = row.data?.state;
  const spectator = !!s?.spectator;
  const source = spectator ? undefined : s?.teams?.[s.me ?? 0] || s?.teams?.[0];
  const team =
    source && Object.fromEntries(['tid', 'region', 'name', 'abbr', 'colors', 'logoImg', 'logoStyle', 'icon'].map(k => [k, source[k]]));
  const year = Number(s?.season);
  const pick = s?.phase === 'draft' ? s.picks?.[s.pi ?? 0] : undefined;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    summary: row.summary,
    preview: {
      team,
      spectator,
      teamName: spectator ? 'Spectator league' : team ? team.region + ' ' + team.name : 'Saved league',
      season: Number.isFinite(year) ? year - 1 + '–' + String(year).slice(2) : 'League',
      phase: pick ? 'Draft · Pick ' + pick.n : PHASE[s?.phase] || s?.phase || 'Saved league',
      managed: s?.managed?.length || (spectator ? 0 : 1),
    },
  };
}

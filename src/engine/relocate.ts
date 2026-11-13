// God Mode: relocate a club or replace it with another franchise (League editor → Relocate or replace). The club
// keeps its team ID, players, contracts, draft picks, owner, front office and records; it takes the new city,
// nickname, abbreviation, colors, crest and market. Past seasons keep the old name (league history stores each
// season's names). Its conference and division follow the new city at the next season rollover (geo.ts realign in
// startPreseason), so this season's standings and playoff races aren't reshuffled.
import type { Game } from './Game';

export interface NewIdentity {
  region: string;
  name: string;
  abbr: string;
  conf?: string;
  div?: string;
  mkt?: number;
  colors?: [string, string];
  icon?: string;
  logoStyle?: string;
}

export function relocateTeam(g: Game, tid: number, n: NewIdentity): string {
  const s: any = g.state,
    T = s.teams[tid];
  if (!T) return 'No such team.';
  const region = n.region.trim(),
    name = n.name.trim(),
    abbr = n.abbr.trim().toUpperCase();
  if (!region || !name || !/^[A-Z]{2,4}$/.test(abbr)) return 'A city, a nickname and a 2–4 letter abbreviation are needed.';
  if (s.teams.some((x: any) => x.tid !== tid && x.abbr === abbr)) return abbr + ' is already used by another team.';
  if (s.teams.some((x: any) => x.tid !== tid && x.region + '|' + x.name === region + '|' + name))
    return 'Another team already has that name.';
  const was = T.region + ' ' + T.name;
  const patch: Record<string, any> = {
    region,
    name,
    abbr,
    mkt: n.mkt ?? T.mkt,
    colors: n.colors || T.colors,
    icon: n.icon || T.icon,
    logoStyle: n.logoStyle || undefined, // the new franchise's own logo (a hand-drawn mark where it has one)
    logoImg: undefined, // an uploaded logo was the old club's
    arena: undefined, // named after the new city until you rename it
  };
  // Same conference: take the new city's division now; a move across the line waits for the season rollover.
  if (n.div && (!n.conf || n.conf === T.conf) && divsOf(T.conf).includes(n.div)) patch.div = n.div;
  g.setState((st: any) => {
    Object.assign(g.db.teams?.[tid] || {}, patch);
    return {
      teams: st.teams.map((x: any) => (x.tid === tid ? { ...x, ...patch } : x)),
      lgLog: [
        {
          day: st.day,
          type: 'Team',
          teams: abbr,
          text:
            was === region + ' ' + name
              ? was + ' changed its look (God Mode).'
              : 'The ' + was + ' became the ' + region + ' ' + name + ' (God Mode): same players, picks and records.',
        },
        ...st.lgLog,
      ],
    };
  });
  return '';
}

const divsOf = (conf: string) => (conf === 'West' ? ['Northwest', 'Pacific', 'Southwest'] : ['Atlantic', 'Central', 'Southeast']);

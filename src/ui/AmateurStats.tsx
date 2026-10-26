// College and club stats for draft prospects (engine/amateurStats.ts): worked out when shown, never saved.
// The profile tab (every amateur season) and the draft board's Stats / Advanced views (his latest season).
import { useMemo, useState, type ReactNode } from 'react';
import type { VM } from './vm';
import { classStats } from '../engine/amateurStats';
import { muted, PN } from './kit';

const f = (x: number, d = 1) => (x == null || !isFinite(x) ? '—' : x.toFixed(d));
const pc = (m: number, a: number) => (a ? ((100 * m) / a).toFixed(1) : '—');
const sl = (y: number) => (y - 1) + '–' + String(y).slice(2);
const TH = ({ children, l, t, onClick, on, pin }: { children: ReactNode; l?: boolean; t?: string; onClick?: () => void; on?: boolean; pin?: boolean }) => <th title={t} onClick={onClick} style={{ padding: '5px 7px', textAlign: l ? 'left' : 'right', whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : undefined, color: on ? 'var(--color-accent-700)' : undefined, ...(pin ? { position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 1 } as const : {}) }}>{children}</th>;
const PIN = { position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 1 } as const; // the name stays on screen while the columns scroll
const TD = ({ children, l, pin }: { children: ReactNode; l?: boolean; pin?: boolean }) => <td style={{ padding: '4px 7px', textAlign: l ? 'left' : 'right', whiteSpace: 'nowrap', ...(pin ? PIN : {}) }}>{children}</td>;

// [key, label, tooltip, value from the line, digits]
type Col = [string, string, string, (x: any) => number, number];
const BOX: Col[] = [
  ['gp', 'G', 'Games', x => x.disp.gp, 0], ['mpg', 'MP', 'Minutes per game (40-minute games)', x => x.mpg, 1], ['pts', 'PTS', 'Points per game', x => x.disp.pts / x.disp.gp, 1],
  ['trb', 'TRB', 'Rebounds per game', x => (x.disp.orb + x.disp.drb) / x.disp.gp, 1], ['ast', 'AST', 'Assists per game', x => x.disp.ast / x.disp.gp, 1], ['stl', 'STL', 'Steals per game', x => x.disp.stl / x.disp.gp, 1],
  ['blk', 'BLK', 'Blocks per game', x => x.disp.blk / x.disp.gp, 1], ['tov', 'TOV', 'Turnovers per game', x => x.disp.tov / x.disp.gp, 1], ['fgp', 'FG%', 'Field goal %', x => (100 * x.disp.fgm) / Math.max(1, x.disp.fga), 1],
  ['tpp', '3P%', 'Three-point %', x => (x.disp.tpa ? (100 * x.disp.tpm) / x.disp.tpa : NaN), 1], ['tpa', '3PA', 'Three-point attempts per game', x => x.disp.tpa / x.disp.gp, 1], ['ftp', 'FT%', 'Free-throw %', x => (x.disp.fta ? (100 * x.disp.ftm) / x.disp.fta : NaN), 1],
];
const ADV: Col[] = [
  ['per', 'PER', 'Player efficiency rating', x => x.adv.per, 1], ['tsp', 'TS%', 'True shooting %', x => x.adv.tsp, 1], ['efg', 'eFG%', 'Effective field goal %', x => x.adv.efg, 1],
  ['tpar', '3PAr', 'Share of shots from three', x => x.adv.tpar, 3], ['ftr', 'FTr', 'Free throws per shot', x => x.adv.ftr, 3], ['usgp', 'USG%', 'Usage: share of his team’s plays he finishes while on the floor', x => x.adv.usgp, 1],
  ['astp', 'AST%', 'Share of teammates’ baskets he assisted while on the floor', x => x.adv.astp, 1], ['tovp', 'TOV%', 'Turnovers per 100 plays', x => x.adv.tovp, 1],
  ['orbp', 'ORB%', 'Offensive rebound %', x => x.adv.orbp, 1], ['drbp', 'DRB%', 'Defensive rebound %', x => x.adv.drbp, 1], ['trbp', 'TRB%', 'Total rebound %', x => x.adv.trbp, 1],
  ['stlp', 'STL%', 'Steals per 100 opponent possessions', x => x.adv.stlp, 1], ['blkp', 'BLK%', 'Share of opponents’ twos he blocked', x => x.adv.blkp, 1],
  ['ortg', 'ORtg', 'Offensive rating: points produced per 100 possessions', x => x.adv.ortg, 0], ['drtg', 'DRtg', 'Defensive rating', x => x.adv.drtg, 0],
  ['ows', 'OWS', 'Offensive win shares', x => x.adv.ows, 1], ['dws', 'DWS', 'Defensive win shares', x => x.adv.dws, 1], ['ws', 'WS', 'Win shares', x => x.adv.ws, 1], ['ws40', 'WS/40', 'Win shares per 40 minutes', x => x.adv.ws40, 3],
  ['obpm', 'OBPM', 'Offensive box plus-minus (the class average is 0)', x => x.adv.obpm, 1], ['dbpm', 'DBPM', 'Defensive box plus-minus', x => x.adv.dbpm, 1], ['bpm', 'BPM', 'Box plus-minus', x => x.adv.bpm, 1],
  ['ewa', 'EWA', 'Estimated wins added', x => x.adv.ewa, 1], ['epm', 'EPM', 'EPM estimate (from the box score: no lineup data for amateurs)', x => x.adv.epm, 1], ['lebron', 'LEBRON', 'LEBRON estimate (box score)', x => x.adv.lebron, 1], ['darko', 'DARKO', 'DARKO estimate (box score)', x => x.adv.darko, 1],
];
const note = 'Worked out from how he really played (not your scouts’ read) against his level of competition: college, high school, junior or pro leagues abroad. A year of luck is in every line. BPM, EPM, LEBRON and DARKO compare him with this draft class; amateurs have no lineup data.';

function useClass(vm: VM, cls: number, ids: number[]) { const { gm, s } = vm.ctx; return useMemo(() => classStats(gm, cls, ids, s.gv || 0), [gm, cls, ids.join(','), s.gv, gm.Y]); }

// Profile tab: every season before the draft.
export function AmateurTab({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid], ids: number[] = (p && gm.db.cls?.[p.cls]) || [];
  const all = useClass(vm, p?.cls, ids), lines = (p && all[p.id]) || [];
  if (!lines.length) return <p style={muted}>No college or club seasons to show.</p>;
  return (<>
    <p style={{ ...muted, fontSize: '12px', margin: '0 0 10px' }}>{note}</p>
    {[['Per game', BOX], ['Advanced', ADV]].map(([title, cols]: any) => (
      <div key={title} style={{ overflowX: 'auto', marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{title}</h4>
        <table className="table" style={{ fontSize: '12.5px', minWidth: '100%' }}>
          <thead><tr><TH l pin>Season</TH><TH l>Team</TH><TH l>Level</TH><TH>Age</TH>{(cols as Col[]).map(c => <TH key={c[0]} t={c[2]}>{c[1]}</TH>)}</tr></thead>
          <tbody>{lines.map(x => <tr key={x.season}><TD l pin>{sl(x.season)}</TD><TD l>{x.team}</TD><TD l><span style={muted}>{x.level}</span></TD><TD>{x.age}</TD>{(cols as Col[]).map(c => <TD key={c[0]}>{f(c[3](x), c[4])}</TD>)}</tr>)}</tbody>
        </table>
      </div>))}
  </>);
}

// Draft board: the class's latest season, sortable, in the board's order and filters.
export function AmateurBoard({ vm, rows, adv }: { vm: VM; rows: any[]; adv: boolean }) {
  const { gm, s } = vm.ctx, cls = s.dClass ?? gm.Y, ids: number[] = gm.db.cls?.[cls] || [];
  const all = useClass(vm, cls, ids), cols = adv ? ADV : BOX, [sort, setSort] = useState<{ k: string; d: number } | null>(null);
  const list = rows.map(r => ({ r, x: (all[r.id] || [])[(all[r.id] || []).length - 1] })).filter(o => o.x);
  const col = sort && cols.find(c => c[0] === sort.k);
  if (col) list.sort((a, b) => { const va = col[3](a.x), vb = col[3](b.x); return (isFinite(vb) ? vb : -1e9) * sort!.d - (isFinite(va) ? va : -1e9) * sort!.d; });
  return (<>
    <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>{note} Latest season shown; the full history is on each prospect{'’'}s College / Club tab. Click a column to sort.</p>
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ fontSize: '12.5px', minWidth: '100%' }}>
        <thead><tr><TH>Rk</TH><TH l pin>Prospect</TH><TH l>Pos</TH><TH>Age</TH><TH l>Level</TH>{cols.map(c => <TH key={c[0]} t={c[2]} on={sort?.k === c[0]} onClick={() => setSort(sort?.k === c[0] ? { k: c[0], d: -sort.d } : { k: c[0], d: 1 })}>{c[1]}{sort?.k === c[0] ? (sort.d > 0 ? ' ▾' : ' ▴') : ''}</TH>)}</tr></thead>
        <tbody>{list.map(({ r, x }) => (
          <tr key={r.id}><TD>{r.rank}</TD><TD l pin><button onClick={r.open} className="hv6" style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', ...PN }}>{r.name}</button></TD><TD l>{r.pos}</TD><TD>{x.age}</TD><TD l><span style={muted}>{x.team} · {x.level}</span></TD>
            {cols.map(c => <TD key={c[0]}>{f(c[3](x), c[4])}</TD>)}</tr>))}</tbody>
      </table>
    </div>
  </>);
}

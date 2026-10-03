// League leaders: the top 10 in every stat for any regular season, per game or totals, then
// shooting and advanced stats, by the same qualifying rules as the bold numbers (leaders.ts).
// Your players are highlighted: this season, the ones on your roster; earlier seasons, the ones
// who played for you that year.
import { useMemo, useState } from 'react';
import type { VM } from '../vm';
import { HL, hlRow, Kicker, Link, muted, Seg } from '../kit';
import { leaderBoards, type Board, type LeadMode } from '../../engine/leaders';

type Def = [string, string, Partial<Board>?];
const BOX: Def[] = [['pts', 'Points'], ['trb', 'Rebounds'], ['ast', 'Assists'], ['stl', 'Steals'], ['blk', 'Blocks'], ['min', 'Minutes'], ['tpm', '3-pointers made'], ['ftm', 'Free throws made'], ['fgm', 'Field goals made'], ['orb', 'Offensive rebounds'], ['drb', 'Defensive rebounds'], ['tov', 'Turnovers']];
const SHOOT: Def[] = [['fgp', 'Field goal %'], ['tpp', '3-point %'], ['ftp', 'Free throw %'], ['efg', 'Effective FG %'], ['twp', '2-point %']];
const ADV: Def[] = [['per', 'Player efficiency rating'], ['tsp', 'True shooting %', { shots: true }], ['usgp', 'Usage %'], ['astp', 'Assist %'], ['trbp', 'Rebound %'], ['stlp', 'Steal %'], ['blkp', 'Block %'],
  ['ws', 'Win shares', { sum: true }], ['ws48', 'Win shares per 48'], ['bpm', 'Box plus-minus'], ['vorp', 'Value over replacement', { sum: true }], ['ewa', 'Estimated wins added', { sum: true }]];
const BOARDS: Board[] = [...BOX, ...SHOOT].map(([k]) => ({ id: k, k })).concat(ADV.map(([k, , o]) => ({ id: 'a' + k, k, adv: true, ...o })));
const THREE = new Set(['fgp', 'tpp', 'ftp', 'efg', 'twp', 'aws48']);
const lbl = (y: number) => (y - 1) + '–' + String(y).slice(2);

export function LeagueLeadersScreen({ vm }: { vm: VM }) {
  const { gm, s, T, open, isMine } = vm.ctx, P = gm.db.P;
  const first = gm.db.firstSeason || 2027, started = s.teams.some((t: any) => t.w + t.l > 0);
  const seasons = Array.from({ length: gm.Y - first + 1 }, (_, i) => gm.Y - i).filter(y => y < gm.Y || started);
  const [y0, setY] = useState<number | null>(null), [mode, setMode] = useState<LeadMode>('pg');
  const y = y0 != null && seasons.includes(y0) ? y0 : seasons[0];
  const boards = useMemo(() => (y ? leaderBoards(gm, s, y, mode, BOARDS) : {}), [y, mode, s.day, s.phase, s.season]); // stats only move as games are played
  if (!y) return <p style={{ ...muted, fontStyle: 'italic' }}>Leaders appear once the season’s first games are played.</p>;
  const mineNow = new Set<number>(s.managed.flatMap((t: number) => s.rosters[t] || []));
  const mine = (pid: number) => (y === gm.Y ? mineNow.has(pid) : (P[pid]?.stats || []).some((r: any) => r.season === y && !r.po && isMine(r.tid)));
  const fmt = (b: Board, v: number) => THREE.has(b.id) ? v.toFixed(3).replace(/^(-?)0\./, '$1.') : !b.adv && mode === 'tot' ? Math.round(v).toLocaleString() : b.k === 'bpm' ? (v > 0 ? '+' : '') + v.toFixed(1) : v.toFixed(1);
  const card = ([, title]: Def, b: Board) => (
    <section key={b.id} className="card" style={{ padding: '10px 12px', gap: 4 }}>
      <Kicker accent>{title}{!b.adv && !THREE.has(b.id) && mode !== 'tot' ? ' per game' : ''}</Kicker>
      {(boards[b.id] || []).length === 0 ? <p style={{ ...muted, fontSize: '12px', fontStyle: 'italic', margin: 0 }}>No one qualifies yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}><tbody>
          {boards[b.id].map((e, i) => { const lit = mine(e.pid); return (
            <tr key={e.pid} style={hlRow(lit ? HL.mine : null)}>
              <td style={{ width: 18, padding: '2px 4px', opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
              <td style={{ padding: '2px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0, width: '100%' }}>
                <Link onClick={() => open(e.pid)} style={{ color: lit ? 'inherit' : 'var(--color-accent-700)', fontWeight: lit ? 600 : 400 }}>{P[e.pid]?.name}</Link> <span style={{ fontSize: '11px', opacity: 0.65 }}>{T[e.tid]?.abbr}</span>
              </td>
              <td style={{ padding: '2px 4px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: i === 0 ? 700 : 400 }}>{fmt(b, e.v)}</td>
            </tr>); })}
        </tbody></table>
      )}
    </section>
  );
  const grid = (defs: Def[], adv = false) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14, marginBottom: 22 }}>{defs.map(d => card(d, BOARDS.find(b => b.id === (adv ? 'a' : '') + d[0])!))}</div>;
  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <select className="input" value={y} onChange={e => setY(+e.target.value)} style={{ width: 'auto' }} aria-label="Season">{seasons.map(x => <option key={x} value={x}>{lbl(x)}{x === gm.Y ? ' (this season)' : ''}</option>)}</select>
        <Seg<LeadMode> value={mode} options={[['pg', 'Per game'], ['tot', 'Totals']]} onChange={setMode} />
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '12px' }}><span style={{ width: 14, height: 14, borderRadius: 3, background: HL.mine, flex: 'none' }} />Your players{y === gm.Y ? '' : ' (played for you that season)'}</span>
      </div>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 14px' }}>Regular season. Per game and rate stats need 70% of the team’s games; percentages need 300 field goals, 82 threes or 125 free throws over a full season (scaled to the games so far); totals, win shares, VORP and EWA need nothing.</p>
      <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>{mode === 'tot' ? 'Totals' : 'Per game'}</h4>
      {grid(BOX)}
      <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>Shooting</h4>
      {grid(SHOOT)}
      <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>Advanced</h4>
      {grid(ADV, true)}
    </>
  );
}

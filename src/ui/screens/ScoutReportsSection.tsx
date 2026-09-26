// Scouting reports on the Scouting screen: every player your staff has a file on (draft
// prospects, players abroad, your roster, the rest of the league), filterable, with a
// search to put anyone on the scouting list, and the full report for the one selected.
import { useState } from 'react';
import type { VM } from '../vm';
import { kindOf, scoutedIds, scoutReport, type ReportKind } from '../../engine/scoutReport';
import { ScoutReportView } from '../ScoutReportView';
import { muted, ruleH4, Seg } from '../kit';

export function ScoutReportsSection({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, P = gm.db.P;
  const [f, setF] = useState<'all' | ReportKind>('all'), [sel, setSel] = useState<number | null>(null), [q, setQ] = useState('');
  const ids = scoutedIds(gm, s), reps = ids.filter(id => f === 'all' || kindOf(gm, s, P[id]) === f).map(id => scoutReport(gm, s, id)).sort((a, b) => b.overall - a.overall);
  const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hits = q.trim().length >= 2 ? (Object.values(P) as any[]).filter(p => !p.retired && fold(p.name).includes(fold(q.trim()))).slice(0, 8) : [];
  const add = (id: number) => { gm.setState(st => ({ scoutList: [...new Set([...(st.scoutList || []), id])].slice(-20) })); setSel(id); setQ(''); };
  const kinds = ids.map(id => kindOf(gm, s, P[id])), counts = (k: string) => kinds.filter(x => x === k).length;
  return (
    <section style={{ marginBottom: 26 }}>
      <h4 style={ruleH4}>Scouting reports</h4>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Seg<any> value={f} options={[['all', 'All ' + ids.length], ['prospect', 'Draft prospects ' + counts('prospect')], ['overseas', 'Overseas ' + counts('overseas')], ['mine', 'My team ' + counts('mine')], ['league', 'League ' + counts('league')], ['fa', 'Free agents ' + counts('fa')]]} onChange={setF} />
        <span style={{ position: 'relative' }}>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Scout any player…" style={{ width: 220, fontSize: '13px' }} />
          {hits.length > 0 && <div style={{ position: 'absolute', zIndex: 30, top: 34, left: 0, width: 300, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)' }}>
            {hits.map(p => <button key={p.id} className="hv3" onClick={() => add(p.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 8, width: '100%', boxSizing: 'border-box', padding: '5px 10px', fontSize: '12.5px' }}><img src={gm.flag(p.rep)} alt="" style={{ width: 16, height: 11 }} /><span style={{ flex: 1 }}>{p.name}</span><span style={muted}>{p.pos} · {p.age}</span></button>)}
          </div>}
        </span>
      </div>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Reports cover draft prospects and players abroad in regions your scouts cover, everyone on your roster and anyone you put on the scouting list (up to 20). Scouts add intel every month: the longer they watch, the tighter the read.</p>
      <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr>{['Player', 'Type', 'Pos', 'Age', 'Overall', 'Projection', 'Confidence', 'Plays like'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Age' || h === 'Overall' ? 'right' : 'left', position: 'sticky', top: 0, background: 'var(--color-bg)' }}>{h}</th>)}</tr></thead>
          <tbody>{reps.map(r => { const p = P[r.pid]; return (
            <tr key={r.pid} onClick={() => setSel(r.pid)} style={{ cursor: 'pointer', background: sel === r.pid ? 'var(--color-accent-100)' : undefined }}>
              <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}><img src={gm.flag(p.rep)} alt="" style={{ width: 16, height: 11, marginRight: 6, verticalAlign: 'middle' }} />{p.name}{(s.scoutList || []).includes(r.pid) ? ' ★' : ''}</td>
              <td style={{ padding: '4px 8px' }}>{r.kindLabel}</td><td style={{ padding: '4px 8px' }}>{p.pos}</td><td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{p.age}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>{r.overall}</td><td style={{ padding: '4px 8px' }}>{r.projection}</td><td style={{ padding: '4px 8px' }}>{r.confidence}</td><td style={{ padding: '4px 8px' }}>{r.comp?.name || '—'}</td>
            </tr>); })}
            {reps.length === 0 && <tr><td colSpan={8} style={{ padding: 10, ...muted }}>No reports in this group yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {sel != null && P[sel] && <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)' }}><ScoutReportView vm={vm} pid={sel} /></div>}
    </section>
  );
}

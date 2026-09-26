// A full scouting report (see engine/scoutReport.ts), laid out like a draft-site profile:
// measurements and grades up top, then overview, strengths, weaknesses, comparisons,
// outlook, notes and the stat line.
import type { VM } from './vm';
import { scoutReport } from '../engine/scoutReport';
import { Link, muted, ruleH4 } from './kit';

const gradeColor = (v: number) => (v >= 8.5 ? 'var(--gm-elite)' : v >= 7 ? 'var(--gm-good)' : v >= 5 ? 'var(--color-text)' : v >= 3.5 ? 'var(--color-accent-800)' : 'var(--gm-bad)');

export function ScoutReportView({ vm, pid, compact }: { vm: VM; pid: number; compact?: boolean }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, p = P[pid], r = scoutReport(gm, s, pid);
  const listed = (s.scoutList || []).includes(pid);
  const toggle = () => gm.setState(st => ({ scoutList: listed ? (st.scoutList || []).filter((x: number) => x !== pid) : [...(st.scoutList || []), pid].slice(-20) }));
  const pl = (x: { id: number; name: string } | null) => (x ? <Link onClick={() => open(x.id)}>{x.name}</Link> : '—');
  return (
    <div style={{ fontSize: '13px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
        {!compact && <div className="gm-face" style={{ width: 72, height: 108, overflow: 'hidden', flex: 'none', borderRadius: 'var(--radius-sm)' }}>{gm.faceEl(pid, -1)}</div>}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: compact ? '20px' : '24px' }}><Link onClick={() => open(pid)}>{p.name}</Link></span>
            <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: 999, border: '1px solid var(--color-divider)' }}>{r.kindLabel}</span>
          </div>
          <div style={{ ...muted, fontSize: '12px', margin: '2px 0 6px' }}>Filed {r.filed} · {/^No scout/.test(r.scout) ? r.scout : 'Scouted by ' + r.scout.replace(/^Your/, 'your')} · Confidence: <b>{r.confidence}</b>{r.margin > 0 ? ' (±' + r.margin.toFixed(1) + ')' : ''}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '2px 16px', fontSize: '12.5px' }}>{r.measure.map(([k, v]) => <div key={k}><span style={muted}>{k}: </span>{v}</div>)}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 110 }}>
          <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase' }}>Overall</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', lineHeight: 1, color: gradeColor(r.overall / 10) }}>{r.overall}</div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>{r.projection}</div>
          <div style={{ ...muted, fontSize: '11.5px' }}>{r.ceiling}</div>
          <button className="btn btn-ghost" onClick={toggle} style={{ fontSize: '11.5px', marginTop: 6 }}>{listed ? '✓ On scouting list' : '+ Add to scouting list'}</button>
        </div>
      </div>
      <h4 style={ruleH4}>Grades</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '4px 18px', marginBottom: 14 }}>
        {r.grades.map(([k, v, , st, why]) => (
          <div key={k} title={why} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 30px', gap: 6, alignItems: 'center' }}>
            <span>{k}{st != null ? ' ◆' : ''}</span>
            <span style={{ height: 6, background: 'var(--color-neutral-100)', borderRadius: 3, position: 'relative' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: v * 10 + '%', background: gradeColor(v), borderRadius: 3 }} /></span>
            <b style={{ textAlign: 'right', color: gradeColor(v) }}>{v}</b>
          </div>
        ))}
      </div>
      <p style={{ ...muted, fontSize: '11.5px', margin: '-8px 0 12px' }}>1–10 scale. ◆ blends what the scouts see with his game production (hover for the split).</p>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(0,1.2fr) minmax(0,1fr)', gap: 24 }}>
        <div>
          <h4 style={ruleH4}>Overview</h4><p style={{ margin: '0 0 12px', lineHeight: 1.55 }}>{r.overview}</p>
          <h4 style={ruleH4}>Strengths</h4><ul style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.55 }}>{r.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4 style={ruleH4}>Weaknesses</h4><ul style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.55 }}>{r.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4 style={ruleH4}>Outlook</h4><p style={{ margin: '0 0 12px', lineHeight: 1.55 }}>{r.outlook}</p>
        </div>
        <div>
          <h4 style={ruleH4}>NBA comparison</h4>
          <div style={{ lineHeight: 1.8 }}>
            <div><span style={muted}>Plays like: </span>{pl(r.comp)} {r.compNote && <span style={muted}>({r.compNote})</span>}</div>
            {r.best && <div><span style={muted}>Best case: </span>{pl(r.best)}</div>}
            {r.worst && <div><span style={muted}>Worst case: </span>{pl(r.worst)}</div>}
          </div>
          <h4 style={{ ...ruleH4, marginTop: 12 }}>Notes</h4>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.55 }}>{r.notes.map((x, i) => <li key={i}>{x}</li>)}</ul>
          {r.statRows.length > 0 && <>
            <h4 style={{ ...ruleH4, marginTop: 12 }}>Stats</h4>
            <table className="table" style={{ fontSize: '12px' }}><thead><tr>{['Season', 'G', 'Min', 'Pts', 'Reb', 'Ast', 'Stl', 'Blk', 'FG%', '3P%', 'FT%', 'PER'].map(h => <th key={h} style={{ padding: '3px 5px', textAlign: h === 'Season' ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
              <tbody>{r.statRows.map((x: any) => <tr key={x.season}>{[x.season, x.gp, x.min, x.pts, x.reb, x.ast, x.stl, x.blk, x.fg, x.tp, x.ft, x.per].map((v, i) => <td key={i} style={{ padding: '3px 5px', textAlign: i ? 'right' : 'left' }}>{v}</td>)}</tr>)}</tbody></table>
          </>}
        </div>
      </div>
    </div>
  );
}

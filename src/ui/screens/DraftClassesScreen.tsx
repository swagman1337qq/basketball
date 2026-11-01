// God Mode → Draft classes (2026-11-01): the draft-class library, shared by all your leagues like the player cards.
// Browse a class (every prospect: position, age, height, school or club, overall, the scouts' read, true potential and
// his last real season), add your own from a file (docs/DRAFT_CLASS_FORMAT.md), delete your own, and load one into a
// class of this league that hasn't been drafted: its prospects replace that class's and are edited like any player.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { VM } from '../vm';
import { addDraftClass, deleteDraftClass, draftClassesVersion, draftClassLib, loadDraftClasses, subscribeDraftClasses } from '../../db/draftClasses';
import { exportDraftClass, loadableYears, loadDraftClass, parseDraftClass } from '../../engine/historical';
import { GOD_PINK, muted } from '../kit';

const f1 = (v: number | null | undefined) => (v == null || !isFinite(v) ? '—' : v.toFixed(1));

export function DraftClassesScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx;
  useSyncExternalStore(subscribeDraftClasses, draftClassesVersion);
  const [ready, setReady] = useState(false), [sel, setSel] = useState(''), [msg, setMsg] = useState(''), years = loadableYears(gm);
  const [year, setYear] = useState<number>(years.includes(s.dcYear) ? s.dcYear : years[0]);
  useEffect(() => { loadDraftClasses().then(() => setReady(true)); }, []);
  const lib = draftClassLib(), cur = lib.find(c => c.id === sel) || lib[0];
  const onFile = (f?: File) => { if (!f) return; f.text().then(async t => { const r = parseDraftClass(t); if (typeof r === 'string') { setMsg(r); return; } const row = await addDraftClass(r.label, r.players); setSel(row.id); setMsg('Added ' + r.label + ' (' + r.players.length + ' prospects) to your library.'); }); };
  const save = () => { const c = exportDraftClass(gm, year), url = URL.createObjectURL(new Blob([JSON.stringify(c, null, 1)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = year + '-draft-class.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const load = () => {
    if (!cur || year == null) return;
    const n = (gm.db.cls[year] || []).filter((id: number) => !gm.db.P[id]?.gone).length;
    if (!window.confirm('Replace the ' + year + ' class (' + n + ' prospects) with ' + cur.label + ' (' + cur.players.length + ')? The current prospects leave the league for good.')) return;
    setMsg(loadDraftClass(gm, cur as any, year));
  };
  const rows = (cur?.players || []).slice().sort((a: any, b: any) => (b.read ?? b.tpot) * 0.7 + b.ovr * 0.3 - ((a.read ?? a.tpot) * 0.7 + a.ovr * 0.3));
  const last = (h: any) => (h.real || []).filter((l: any) => l.gp).slice(-1)[0];
  const th = (t: string, r = false) => <th style={{ padding: '5px 7px', textAlign: r ? 'right' : 'left', whiteSpace: 'nowrap' }}>{t}</th>;
  const td = (v: any, r = false) => <td style={{ padding: '4px 7px', textAlign: r ? 'right' : 'left', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{v}</td>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <label className="btn btn-secondary" style={{ borderColor: GOD_PINK, color: GOD_PINK, fontSize: '12.5px', cursor: 'pointer' }}>Add from a file…<input type="file" accept=".json,application/json" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} style={{ display: 'none' }} /></label>
        <button className="btn btn-ghost" style={{ fontSize: '12.5px' }} onClick={save} disabled={year == null} title="Download one of this league's classes as a file in the same format, to edit into your own">Save the {year ?? ''} class as a file</button>
        <span style={{ ...muted, fontSize: '12px' }}>Ready-made classes are real drafts with every name made up and every school swapped for a rival. Your own: a .json file (format in the game's docs: save a class as a file to see it).</span>
        {msg && <span style={{ color: GOD_PINK, fontSize: '12.5px', flexBasis: '100%' }}>{msg}</span>}
      </div>
      {!ready ? <p style={muted}>Loading the library…</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 230px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lib.map(c => (
              <button key={c.id} onClick={() => { setSel(c.id); setMsg(''); }} style={{ all: 'unset', cursor: 'pointer', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (cur?.id === c.id ? GOD_PINK : 'var(--color-divider)'), fontSize: '13px' }}>
                <b>{c.label}</b><div style={{ ...muted, fontSize: '11.5px' }}>{c.players.length} prospects · {c.builtIn ? 'ready-made' : 'yours'}</div>
              </button>))}
          </div>
          {cur && <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '18px' }}>{cur.label}</h4>
              {years.length ? <>
                <span style={{ ...muted, fontSize: '12.5px' }}>Load it as this league's</span>
                <select className="input" value={year} onChange={e => setYear(+e.target.value)} style={{ width: 'auto', fontSize: '12.5px', padding: '3px 8px' }}>{years.map(y => <option key={y} value={y}>{y} class</option>)}</select>
                <button className="btn btn-primary" onClick={load} style={{ fontSize: '12.5px', background: GOD_PINK, borderColor: GOD_PINK }}>Load</button>
              </> : <span style={muted}>No class in this league can take it right now (the draft has started).</span>}
              {!cur.builtIn && <button className="btn btn-ghost" onClick={() => { if (window.confirm('Delete ' + cur.label + ' from your library? Leagues that loaded it keep their players.')) { deleteDraftClass(cur.id); setSel(''); } }} style={{ fontSize: '12px' }}>Delete</button>}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '12.5px', minWidth: '100%' }}>
                <thead><tr>{th('#')}{th('Prospect')}{th('Pos')}{th('Age', true)}{th('Hgt', true)}{th('School / club')}{th('Ovr', true)}{th('Pot (scouts)', true)}{th('True pot', true)}{th('Last season')}{th('PPG', true)}{th('RPG', true)}{th('APG', true)}</tr></thead>
                <tbody>{rows.map((h: any, i: number) => { const l = last(h); return (
                  <tr key={i}>{td(i + 1, true)}{td(<b>{h.first} {h.last}</b>)}{td(h.pos)}{td(h.age, true)}{td(h.hgt ? h.hgt[0] + '′' + h.hgt[1] + '″' : '—', true)}{td(h.from?.team || '—')}{td(Math.round(h.ovr), true)}{td(Math.round(h.read ?? h.tpot), true)}{td(<span style={{ color: GOD_PINK }}>{Math.round(h.tpot)}</span>, true)}
                    {td(l ? l.team + (l.cls ? ' · ' + l.cls : '') : <span style={muted}>generated</span>)}{td(l ? f1(l.pts) : '', true)}{td(l ? f1(l.trb ?? (l.orb || 0) + (l.drb || 0)) : '', true)}{td(l ? f1(l.ast) : '', true)}</tr>); })}</tbody>
              </table>
            </div>
          </div>}
        </div>)}
    </div>);
}

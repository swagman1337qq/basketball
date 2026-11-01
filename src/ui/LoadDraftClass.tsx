// God Mode: load a draft class (2026-11-01). A ready-made class (a real draft, renamed: data/historicalClasses.ts) or
// your own from a file (docs/DRAFT_CLASS_FORMAT.md) replaces the class shown on the board, if it isn't drafted yet.
// "Save this class as a file" downloads the shown class in the same format, to edit into your own.
import { useState } from 'react';
import type { Game } from '../engine/Game';
import { builtInClass, builtInClasses, exportDraftClass, loadDraftClass, parseDraftClass } from '../engine/historical';
import { GOD_PINK, muted } from './kit';

export function LoadDraftClass({ gm, year, canLoad }: { gm: Game; year: number; canLoad: boolean }) {
  const [open, setOpen] = useState(false), [pick, setPick] = useState(''), [file, setFile] = useState<{ label: string; players: any[] } | null>(null), [msg, setMsg] = useState('');
  const n = (gm.db.cls[year] || []).filter((id: number) => !gm.db.P[id]?.gone).length;
  const chosen = pick === 'file' ? file : pick ? builtInClass(+pick) : null;
  const save = () => { const c = exportDraftClass(gm, year), url = URL.createObjectURL(new Blob([JSON.stringify(c, null, 1)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = year + '-draft-class.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const onFile = (f?: File) => { if (!f) return; f.text().then(t => { const r = parseDraftClass(t); if (typeof r === 'string') { setFile(null); setMsg(r); } else { setFile(r); setMsg(''); } }); };
  const load = () => { if (!chosen) return; if (!window.confirm('Replace the ' + year + ' class (' + n + ' prospects) with ' + chosen.label + ' (' + chosen.players.length + ')? The current prospects leave the league for good.')) return; setMsg(loadDraftClass(gm, chosen as any, year, pick === 'file' ? 0 : +pick)); setOpen(false); setPick(''); setFile(null); };
  const pink = { borderColor: GOD_PINK, color: GOD_PINK, fontSize: '12.5px' };
  if (!open) return <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><button className="btn btn-secondary" style={pink} onClick={() => { setOpen(true); setMsg(''); }} title="God Mode: replace this class with a ready-made one or your own from a file">Load draft class…</button>{msg && <span style={{ fontSize: '12px', color: GOD_PINK }}>{msg}</span>}</span>;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 10px', border: '1px solid ' + GOD_PINK, borderRadius: 'var(--radius-md)', fontSize: '12.5px', width: '100%' }}>
      <b style={{ color: GOD_PINK }}>Load draft class</b>
      {canLoad ? <>
        <select className="input" value={pick} onChange={e => { setPick(e.target.value); setMsg(''); }} style={{ width: 'auto', fontSize: '12.5px', padding: '3px 8px' }}>
          <option value="">Choose a class…</option>
          {builtInClasses().map(c => <option key={c.year} value={c.year}>{c.label} ({c.n} prospects)</option>)}
          <option value="file">From a file…</option>
        </select>
        {pick === 'file' && <input type="file" accept=".json,application/json" onChange={e => onFile(e.target.files?.[0])} style={{ fontSize: '12px' }} />}
        <button className="btn btn-primary" disabled={!chosen} onClick={load} style={{ fontSize: '12px', padding: '3px 10px', background: chosen ? GOD_PINK : undefined, borderColor: GOD_PINK }}>Replace the {year} class</button>
      </> : <span style={muted}>The {year} draft has already started or happened; pick a class still to come.</span>}
      <button className="btn btn-ghost" onClick={save} style={{ fontSize: '12px' }} title="Download this class as a file in the same format, to edit into your own class">Save this class as a file</button>
      <button className="btn btn-ghost" onClick={() => { setOpen(false); setMsg(''); }} style={{ fontSize: '12px' }}>Close</button>
      {msg && <span style={{ color: GOD_PINK, flexBasis: '100%' }}>{msg}</span>}
      <span style={{ ...muted, flexBasis: '100%', fontSize: '11.5px' }}>Ready-made classes are real drafts with every name made up and every school swapped for a rival; seasons on record are real, the rest are generated like any prospect's. Your own class: a .json file in the same format (save a class as a file to see it).</span>
    </div>);
}

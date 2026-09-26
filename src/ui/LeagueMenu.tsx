// The league menu: which league you're in and whether it's saved, with a way back to the main
// menu, a new league, or straight into another saved league (this one is saved first).
import { useEffect, useRef, useState } from 'react';
import type { VM } from './vm';
import { listSaves, type SaveRow } from '../db/saves';

export function LeagueMenu({ vm, compact, bar }: { vm: VM; compact?: boolean; bar?: boolean }) {
  const [open, setOpen] = useState(false), [pos, setPos] = useState<{ top: number; left: number } | null>(null), [saves, setSaves] = useState<SaveRow[] | null>(null), ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; listSaves().then(setSaves).catch(() => setSaves([]));
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, [open]);
  const sv = vm.save, others = (saves || []).filter(r => r.id !== sv.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const item = { all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'block', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '13px' } as const;
  return (
    <div ref={ref} style={{ position: 'relative', width: compact || bar ? undefined : '100%' }}>
      <button className="btn btn-secondary" onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(window.innerWidth - 268, bar ? r.right - 260 : r.left)) }); setOpen(o => !o); }} title={'League: ' + sv.name + ' · ' + sv.status} aria-expanded={open}
        style={bar ? { fontSize: '13px', whiteSpace: 'nowrap' } : compact ? { fontSize: '10px', padding: '4px 6px', width: '66px' } : { width: '100%', fontSize: '12.5px', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {bar ? 'Leagues ▾' : compact ? 'Leagues' : <><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sv.name}</span><span style={{ flex: 'none' }}>Leagues ▾</span></>}
      </button>
      {open && pos && (
        <div style={{ position: 'fixed', zIndex: 60, top: pos.top, left: pos.left, width: 260, maxHeight: 'calc(100vh - ' + (pos.top + 10) + 'px)', overflowY: 'auto', background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6 }}>
          <div style={{ padding: '4px 10px 8px', borderBottom: '1px solid var(--color-divider)', marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{sv.name}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-neutral-700)' }}>{sv.status} · saved automatically in this browser</div>
          </div>
          <button className="hv2" style={item} onClick={() => { setOpen(false); sv.onExit(); }}>← Main menu (all leagues)</button>
          <button className="hv2" style={item} onClick={() => { setOpen(false); sv.onExit(); }}>+ Start a new league</button>
          <button className="hv2" style={item} onClick={() => { setOpen(false); sv.onExport(); }}>⤓ Export this league</button>
          {saves === null ? <div style={{ ...item, cursor: 'default', color: 'var(--color-neutral-600)' }}>Loading leagues…</div> : others.length > 0 && (<>
            <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', padding: '8px 10px 2px', borderTop: '1px solid var(--color-divider)', marginTop: 4 }}>Switch to</div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {others.map(r => (
                <button key={r.id} className="hv2" style={item} onClick={() => { setOpen(false); sv.onSwitch(r.id); }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-700)', whiteSpace: 'normal' }}>{r.summary}</div>
                </button>))}
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}

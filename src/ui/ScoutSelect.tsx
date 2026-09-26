// Pick players in any list (checkboxes, select all, shift-click a range), then right-click (or use
// the bar above the table) to have one of your scouts follow them personally. Used on the Draft
// board, Free agency, Overseas and the Shortlist.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { VM } from './vm';
import { assignScout, PERSONAL_MAX, unassignScout } from '../engine/overseas';
import { regions } from '../data/world';
import { muted } from './kit';

export function useScoutSelect(vm: VM, ids: number[]) {
  const { gm, s } = vm.ctx;
  const [sel, setSel] = useState<Set<number>>(new Set()), [menu, setMenu] = useState<{ x: number; y: number } | null>(null), [msg, setMsg] = useState(''), last = useRef<number | null>(null);
  const visible = new Set(ids), chosen = [...sel].filter(id => visible.has(id));
  const asg: Record<number, string> = s.scoutAssign || {};
  const toggle = (id: number, shift: boolean) => {
    const from = last.current, a = from == null ? -1 : ids.indexOf(from), b = ids.indexOf(id), range = shift && a >= 0 && b >= 0 ? ids.slice(Math.min(a, b), Math.max(a, b) + 1) : null;
    last.current = id;
    setSel(prev => { const n = new Set(prev); if (range) range.forEach(x => n.add(x)); else if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const all = ids.length > 0 && ids.every(id => sel.has(id));
  const toggleAll = () => setSel(all ? new Set() : new Set(ids));
  useEffect(() => { if (!menu) return; const close = () => setMenu(null); window.addEventListener('click', close); window.addEventListener('scroll', close, true); return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); }; }, [menu]);
  const onContext = (id: number) => (e: React.MouseEvent) => { e.preventDefault(); if (!sel.has(id)) { setSel(new Set([id])); last.current = id; } setMenu({ x: Math.min(e.clientX, window.innerWidth - 300), y: Math.min(e.clientY, window.innerHeight - 340) }); };
  const target = () => (chosen.length ? chosen : []);
  const R = regions(), load = (n: string) => Object.values(asg).filter(x => x === n).length;
  const act = (f: () => void) => { f(); setMenu(null); };
  const Menu = () => menu && (
    <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 70, width: 290, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, fontSize: '13px' }}>
      <div style={{ padding: '4px 8px 6px', fontWeight: 600, borderBottom: '1px solid var(--color-divider)' }}>{target().length} player{target().length === 1 ? '' : 's'} selected</div>
      <div style={{ ...muted, fontSize: '11px', padding: '6px 8px 2px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Have a scout follow them</div>
      {(s.scouts || []).map((x: any) => (
        <button key={x.name} className="hv2" onClick={() => act(() => setMsg(assignScout(gm, x.name, target())))} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 8px', borderRadius: 4 }}>
          <span><b>{x.name}</b> <span style={{ ...muted, fontSize: '11.5px' }}>{'★'.repeat(x.skill)} · {R[x.spec]?.name}</span></span><span style={{ ...muted, fontSize: '11.5px', whiteSpace: 'nowrap' }}>{load(x.name)}/{PERSONAL_MAX}</span>
        </button>))}
      {!(s.scouts || []).length && <div style={{ ...muted, padding: '4px 8px' }}>You have no scouts. Hire them on the Scouting screen.</div>}
      <div style={{ borderTop: '1px solid var(--color-divider)', marginTop: 4, paddingTop: 4 }}>
        {target().some(id => asg[id]) && <button className="hv2" onClick={() => act(() => { unassignScout(gm, target()); setMsg('Personal scouting stopped for ' + target().length + ' player' + (target().length === 1 ? '' : 's') + '.'); })} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '5px 8px', borderRadius: 4 }}>Stop personal scouting</button>}
        <button className="hv2" onClick={() => act(() => setSel(new Set()))} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '5px 8px', borderRadius: 4, ...muted }}>Clear selection</button>
      </div>
      <div style={{ ...muted, fontSize: '11px', padding: '4px 8px' }}>A scout following a player sharpens your read on him every month, fastest in the scout's own region. Each scout can follow {PERSONAL_MAX} at a time.</div>
    </div>);
  // The checkbox column.
  const head = () => <th style={{ padding: '4px 6px', width: 24 }}><input type="checkbox" checked={all} onChange={toggleAll} title="Select all" aria-label="Select all" /></th>;
  const cell = (id: number) => <td style={{ padding: '4px 6px', width: 24 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.has(id)} onClick={e => toggle(id, (e as any).shiftKey)} onChange={() => {}} aria-label="Select" /></td>;
  const tag = (id: number): ReactNode => asg[id] ? <span title={asg[id] + ' follows him personally'} style={{ fontSize: '10.5px', padding: '0 5px', borderRadius: 3, border: '1px solid var(--color-accent)', color: 'var(--color-accent-700)', whiteSpace: 'nowrap' }}>👁 {asg[id].split(' ')[0]}</span> : null;
  // A bar above the table once something is selected (for people who don't right-click).
  const bar = () => (chosen.length > 0 || msg) ? (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 8px', padding: '6px 10px', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
      {chosen.length > 0 && <><b>{chosen.length} selected</b><button className="btn btn-primary" style={{ fontSize: '12px', padding: '3px 10px' }} onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left, y: r.bottom + 4 }); }}>Assign a scout ▾</button><button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setSel(new Set())}>Clear</button><span style={{ ...muted, fontSize: '12px' }}>Tip: right-click a row. Shift-click checkboxes to select a range.</span></>}
      {msg && <span style={{ color: 'var(--color-accent-700)' }}>{msg}</span>}
    </div>) : null;
  return { head, cell, tag, bar, Menu, onContext, isSel: (id: number) => sel.has(id) };
}

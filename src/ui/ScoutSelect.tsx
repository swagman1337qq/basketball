// Pick players in any list, then right-click (or use the bar above the table) to act on them: have one of
// your scouts follow them personally, or put them on a shortlist. Picking (2026-10-30): click a row, drag
// across rows, shift-click to take in a range, ctrl/cmd-click to add or drop one; or the checkboxes. Clicks
// on a name, button or box inside a row keep doing what they did. Used on the Draft board, Free agency,
// Overseas and the Shortlist.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { VM } from './vm';
import { assignScout, PERSONAL_MAX, unassignScout } from '../engine/overseas';
import { regions } from '../data/world';
import { muted } from './kit';

export function useScoutSelect(vm: VM, ids: number[]) {
  const { gm, s } = vm.ctx;
  const [sel, setSel] = useState<Set<number>>(new Set()), [menu, setMenu] = useState<{ x: number; y: number } | null>(null), [msg, setMsg] = useState(''), last = useRef<number | null>(null);
  const [sub, setSub] = useState<'' | 'scout' | 'list'>(''), [newList, setNewList] = useState<string | null>(null), drag = useRef<{ from: number; base: Set<number> } | null>(null);
  const visible = new Set(ids), chosen = [...sel].filter(id => visible.has(id));
  const asg: Record<number, string> = s.scoutAssign || {};
  const span = (a: number, b: number) => { const i = ids.indexOf(a), j = ids.indexOf(b); return i < 0 || j < 0 ? [b] : ids.slice(Math.min(i, j), Math.max(i, j) + 1); };
  const toggle = (id: number, shift: boolean) => {
    const range = shift && last.current != null ? span(last.current, id) : null;
    last.current = id;
    setSel(prev => { const n = new Set(prev); if (range) range.forEach(x => n.add(x)); else if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const all = ids.length > 0 && ids.every(id => sel.has(id));
  const toggleAll = () => setSel(all ? new Set() : new Set(ids));
  const closeMenu = () => { setMenu(null); setSub(''); setNewList(null); };
  useEffect(() => { if (!menu) return; window.addEventListener('click', closeMenu); window.addEventListener('scroll', closeMenu, true); return () => { window.removeEventListener('click', closeMenu); window.removeEventListener('scroll', closeMenu, true); }; }, [menu]);
  useEffect(() => { const up = () => (drag.current = null); window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up); }, []);
  const openMenu = (x: number, y: number) => { setSub(''); setNewList(null); setMenu({ x: Math.min(x, window.innerWidth - 230), y: Math.min(y, window.innerHeight - 200) }); };
  const onContext = (id: number) => (e: React.MouseEvent) => { e.preventDefault(); if (!sel.has(id)) { setSel(new Set([id])); last.current = id; } openMenu(e.clientX, e.clientY); };
  // Row picking: press on a row (not on a link, button or box in it) to pick it, drag to pick the rows you pass,
  // shift to take in everything from the last pick, ctrl/cmd to add or drop one.
  const live = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('a, button, input, select, textarea, label, [data-pid]');
  const row = (id: number) => ({
    onContextMenu: onContext(id),
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button !== 0 || live(e.target)) return;
      e.preventDefault(); // no text highlighting while dragging
      if (e.shiftKey && last.current != null) { const r = span(last.current, id); setSel(prev => new Set([...prev, ...r])); return; }
      if (e.ctrlKey || e.metaKey) { toggle(id, false); return; }
      const base = new Set<number>(), only = sel.size === 1 && sel.has(id);
      last.current = id; drag.current = { from: id, base }; setSel(only ? base : new Set([id]));
    },
    onMouseEnter: () => { const d = drag.current; if (d) setSel(new Set([...d.base, ...span(d.from, id)])); },
    style: { userSelect: 'none' as const },
  });
  const target = () => (chosen.length ? chosen : []);
  const R = regions(), load = (n: string) => Object.values(asg).filter(x => x === n).length;
  const act = (f: () => void) => { f(); closeMenu(); };
  const plural = (n: number) => n + ' player' + (n === 1 ? '' : 's');
  // Shortlists: each player is on one at a time, so putting them on a list moves them off any other.
  const toList = (lid: string, name: string) => { const t = new Set(target()); gm.setState(st => ({ lists: st.lists.map((l: any) => ({ ...l, ids: l.id === lid ? [...l.ids.filter((x: number) => !t.has(x)), ...t] : l.ids.filter((x: number) => !t.has(x)) })) })); setMsg(plural(t.size) + ' on ' + name + '.'); };
  const mkList = (name: string) => { const nm = name.trim(); if (!nm) return; const t = new Set(target()), lid = 'l' + Date.now(); gm.setState(st => ({ lists: [...st.lists.map((l: any) => ({ ...l, ids: l.ids.filter((x: number) => !t.has(x)) })), { id: lid, name: nm, ids: [...t] }] })); setMsg(plural(t.size) + ' on ' + nm + '.'); };
  const offLists = () => { const t = new Set(target()); gm.setState(st => ({ lists: st.lists.map((l: any) => ({ ...l, ids: l.ids.filter((x: number) => !t.has(x)) })) })); setMsg(plural(t.size) + ' taken off your shortlists.'); };
  const item: React.CSSProperties = { all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 4 };
  const box: React.CSSProperties = { background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, fontSize: '13px' };
  const SUB_W = 290, flip = menu ? menu.x + 220 + SUB_W > window.innerWidth : false;
  const Menu = () => menu && (
    <div onClick={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()} style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 70 }}>
      <div style={{ ...box, width: 220 }}>
        <div style={{ padding: '4px 8px 6px', fontWeight: 600, borderBottom: '1px solid var(--color-divider)', marginBottom: 4 }}>{plural(target().length)} selected</div>
        {([['scout', 'Scouting'], ['list', 'Add to shortlist']] as const).map(([k, label]) => (
          <button key={k} className="hv2" onMouseEnter={() => setSub(k)} onClick={() => setSub(k)} style={{ ...item, background: sub === k ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined }}><span>{label}</span><span style={muted}>›</span></button>))}
        <div style={{ borderTop: '1px solid var(--color-divider)', marginTop: 4, paddingTop: 4 }}>
          <button className="hv2" onMouseEnter={() => setSub('')} onClick={() => act(() => setSel(new Set()))} style={{ ...item, ...muted }}>Clear selection</button>
        </div>
      </div>
      {sub && <div style={{ ...box, width: SUB_W, position: 'absolute', top: 0, ...(flip ? { right: 224 } : { left: 224 }), maxHeight: '70vh', overflowY: 'auto' }}>
        {sub === 'scout' ? <>
          <div style={{ ...muted, fontSize: '11px', padding: '4px 8px 2px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Assign a scout to follow them</div>
          {(s.scouts || []).map((x: any) => (
            <button key={x.name} className="hv2" onClick={() => act(() => setMsg(assignScout(gm, x.name, target())))} style={item}>
              <span><b>{x.name}</b> <span style={{ ...muted, fontSize: '11.5px' }}>{'★'.repeat(x.skill)} · {R[x.spec]?.name}</span></span><span style={{ ...muted, fontSize: '11.5px', whiteSpace: 'nowrap' }}>{load(x.name)}/{PERSONAL_MAX}</span>
            </button>))}
          {!(s.scouts || []).length && <div style={{ ...muted, padding: '4px 8px' }}>You have no scouts. Hire them on the Scouting screen.</div>}
          {target().some(id => asg[id]) && <button className="hv2" onClick={() => act(() => { unassignScout(gm, target()); setMsg('Personal scouting stopped for ' + plural(target().length) + '.'); })} style={{ ...item, borderTop: '1px solid var(--color-divider)', marginTop: 4 }}>Stop personal scouting</button>}
          <div style={{ ...muted, fontSize: '11px', padding: '4px 8px' }}>A scout following a player sharpens your read on him every month, fastest in the scout's own region. Each scout can follow {PERSONAL_MAX} at a time.</div>
        </> : <>
          <div style={{ ...muted, fontSize: '11px', padding: '4px 8px 2px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Put them on a shortlist</div>
          {(s.lists || []).map((l: any) => { const n = target().filter(id => l.ids.includes(id)).length; return (
            <button key={l.id} className="hv2" onClick={() => act(() => toList(l.id, l.name))} style={item}><span>{l.name}</span><span style={{ ...muted, fontSize: '11.5px' }}>{n ? (n === target().length ? '✓ all on it' : n + ' on it') : l.ids.length + ' players'}</span></button>); })}
          {newList == null
            ? <button className="hv2" onClick={() => setNewList('')} style={item}>+ New shortlist…</button>
            : <div style={{ display: 'flex', gap: 6, padding: '4px 8px' }}>
                <input className="input" autoFocus value={newList} placeholder="Name the shortlist" onChange={e => setNewList(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newList.trim()) act(() => mkList(newList)); else if (e.key === 'Escape') { e.stopPropagation(); setNewList(null); } }} style={{ flex: 1, minWidth: 0, fontSize: '12.5px', padding: '3px 8px' }} />
                <button className="btn btn-primary" disabled={!newList.trim()} onClick={() => act(() => mkList(newList))} style={{ fontSize: '12px', padding: '2px 10px' }}>Create</button>
              </div>}
          {target().some(id => (s.lists || []).some((l: any) => l.ids.includes(id))) && <button className="hv2" onClick={() => act(offLists)} style={{ ...item, borderTop: '1px solid var(--color-divider)', marginTop: 4 }}>Take them off your shortlists</button>}
          <div style={{ ...muted, fontSize: '11px', padding: '4px 8px' }}>A player is on one shortlist at a time: putting him on this one moves him off any other.</div>
        </>}
      </div>}
    </div>);
  // The checkbox column.
  const head = () => <th style={{ padding: '4px 6px', width: 24 }}><input type="checkbox" checked={all} onChange={toggleAll} title="Select all" aria-label="Select all" /></th>;
  const cell = (id: number) => <td style={{ padding: '4px 6px', width: 24 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.has(id)} onClick={e => toggle(id, (e as any).shiftKey)} onChange={() => {}} aria-label="Select" /></td>;
  const tag = (id: number): ReactNode => asg[id] ? <span title={asg[id] + ' follows him personally'} style={{ fontSize: '10.5px', padding: '0 5px', borderRadius: 3, border: '1px solid var(--color-accent)', color: 'var(--color-accent-700)', whiteSpace: 'nowrap' }}>👁 {asg[id].split(' ')[0]}</span> : null;
  // A bar above the table (for people who don't right-click). Always there, so the table doesn't jump when the first
  // row is picked mid-drag; with nothing picked it says how to pick.
  const bar = () => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', minHeight: 46, boxSizing: 'border-box', margin: '0 0 8px', padding: '4px 10px', border: '1px solid ' + (chosen.length ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
      {!chosen.length && !msg && <span style={{ ...muted, fontSize: '12px' }}>Click a row to pick a player, drag across rows or shift-click to pick several, then right-click to scout them or put them on a shortlist.</span>}
      {chosen.length > 0 && <><b>{chosen.length} selected</b><button className="btn btn-primary" style={{ fontSize: '12px', padding: '3px 10px' }} onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); openMenu(r.left, r.bottom + 4); }}>Scouting / shortlist ▾</button><button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setSel(new Set())}>Clear</button><span style={{ ...muted, fontSize: '12px' }}>Tip: drag across rows or shift-click to pick several, then right-click.</span></>}
      {msg && <span style={{ color: 'var(--color-accent-700)' }}>{msg}</span>}
    </div>);
  return { head, cell, tag, bar, Menu, onContext, row, isSel: (id: number) => sel.has(id) };
}

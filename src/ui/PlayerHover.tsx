// Hovering a player's name anywhere shows a snapshot of his stats (2026-10-30): this season's (or his last one's) for a
// player in the league, the latest college or club season for a prospect, his line abroad for a player overseas.
// One listener for the whole game: a name is anything whose click opens a player (viewModel `open` tags its handler
// with the player's id, `__pid`), so every screen gets it without its own code. In a table row that opens a player, only
// his name counts (the text that is his name), not the whole row.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Game } from '../engine/Game';
import { amClass, classStats, hasAmateur } from '../engine/amateurStats';

const propsOf = (el: any) => { const k = Object.keys(el).find(x => x.startsWith('__reactProps$')); return k ? el[k] : null; };
// A name: an element whose click opens a player, or, in a row that opens one, the text that is his name.
function pidAt(target: EventTarget | null, nameOf: (pid: number) => string | undefined): { el: HTMLElement; pid: number } | null {
  const first = target as HTMLElement | null; let el = first;
  for (let i = 0; el && i < 6; i++, el = el.parentElement) {
    const tag = propsOf(el)?.onClick?.__pid, dp = el.dataset?.pid, pid = tag ?? (dp != null && dp !== '' ? +dp : undefined);
    if (el.tagName === 'TR') { const nm = pid != null ? nameOf(pid) : undefined; return nm && first && first !== el && (first.textContent || '').trim() === nm ? { el: first, pid } : null; }
    if (el.tagName === 'TBODY' || el.tagName === 'TABLE') return null;
    if (pid != null) return { el, pid };
  }
  return null;
}
const sl = (y: number) => (y - 1) + '–' + String(y).slice(2);
type Snap = { title: string; sub: string; cells: [string, string][] } | { title: string; sub: string; none: string };

export function snapshot(g: Game, p: any): Snap {
  const title = p.name + (p.pos ? ' · ' + p.pos : '') + (p.age ? ' · age ' + p.age : '');
  const pg = (v: number, n: number) => (n ? (v / n).toFixed(1) : '—'), pc = (m: number, a: number) => (a ? ((100 * m) / a).toFixed(1) : '—');
  const line = (t: any, mpg?: number): [string, string][] => [['G', String(t.gp)], ['MPG', mpg != null ? mpg.toFixed(1) : pg(t.min, t.gp)], ['PTS', pg(t.pts, t.gp)], ['REB', pg((t.orb || 0) + (t.drb || 0), t.gp)], ['AST', pg(t.ast, t.gp)],
    ['STL', pg(t.stl, t.gp)], ['BLK', pg(t.blk, t.gp)], ['TOV', pg(t.tov, t.gp)], ['FG%', pc(t.fgm, t.fga)], ['3P%', pc(t.tpm, t.tpa)], ['FT%', pc(t.ftm, t.fta)]];
  // In the league: this season's regular season, or his last season with games (all his teams that season).
  const rs = (p.stats || []).filter((r: any) => !r.po && r.gp > 0);
  if (rs.length) {
    const yr = rs.some((r: any) => r.season === g.Y) ? g.Y : Math.max(...rs.map((r: any) => r.season)), rows = rs.filter((r: any) => r.season === yr), t: any = {};
    rows.forEach((r: any) => ['gp', 'min', 'pts', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta'].forEach(k => (t[k] = (t[k] || 0) + (r[k] || 0))));
    const teams = [...new Set(rows.map((r: any) => g.state.teams[r.tid]?.abbr).filter(Boolean))].join(', ');
    return { title, sub: sl(yr) + (yr === g.Y ? ' (this season)' : '') + (teams ? ' · ' + teams : ''), cells: line(t) };
  }
  // A prospect (or a player not yet in the league): his latest college or club season.
  if (hasAmateur(g, p)) {
    const c = amClass(p), x = (classStats(g, c, g.db.cls?.[c] || [], g.state.gv || 0)[p.id] || []).filter((l: any) => l.gp > 0).slice(-1)[0];
    if (x) return { title, sub: sl(x.season) + ' · ' + x.team + ' · ' + x.level, cells: line(x.disp, x.mpg) };
  }
  // Abroad: the line his club reports.
  if (p.abroad) return { title, sub: p.abroad.club + ' · ' + p.abroad.lg, cells: [['PTS', String(p.abroad.pts)], ['REB', String(p.abroad.reb)], ['AST', String(p.abroad.ast)]] };
  return { title, sub: '', none: 'No games yet.' };
}

export function PlayerHover({ gm }: { gm: Game }) {
  const [hit, setHit] = useState<{ pid: number; rect: DOMRect } | null>(null), card = useRef<HTMLDivElement>(null), [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    let cur: HTMLElement | null = null, timer: any = null;
    const over = (e: MouseEvent) => { const h = pidAt(e.target, pid => gm.db.P[pid]?.name); if (h?.el === cur) return; cur = h?.el || null; clearTimeout(timer); setHit(null); setPos(null);
      if (h) timer = setTimeout(() => { if (cur === h.el && document.body.contains(h.el)) setHit({ pid: h.pid, rect: h.el.getBoundingClientRect() }); }, 250); };
    const off = () => { cur = null; clearTimeout(timer); setHit(null); setPos(null); };
    document.addEventListener('mouseover', over); document.addEventListener('mousedown', off); window.addEventListener('scroll', off, true);
    return () => { document.removeEventListener('mouseover', over); document.removeEventListener('mousedown', off); window.removeEventListener('scroll', off, true); clearTimeout(timer); };
  }, [gm]);
  useLayoutEffect(() => {
    if (!hit || !card.current) return;
    const h = card.current.offsetHeight, w = card.current.offsetWidth, vw = window.innerWidth, vh = window.innerHeight, m = 8, r = hit.rect;
    const below = r.bottom + 6 + h <= vh - m || r.top - 6 - h < m;
    setPos({ left: Math.max(m, Math.min(r.left, vw - m - w)), top: below ? Math.min(r.bottom + 6, vh - m - h) : Math.max(m, r.top - 6 - h) });
  }, [hit]);
  const p = hit ? gm.db.P[hit.pid] : null; if (!hit || !p || p.gone) return null;
  const sn = snapshot(gm, p), cells = 'cells' in sn ? sn.cells : null;
  const body: ReactNode = <>
    <b>{sn.title}</b>
    {sn.sub && <div style={{ color: 'var(--color-neutral-600)', margin: '1px 0 6px' }}>{sn.sub}</div>}
    {cells ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gap: '2px 10px' }}>{cells.map(([k, v]) => <div key={k}><div style={{ color: 'var(--color-neutral-600)', fontSize: '10.5px' }}>{k}</div><div style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</div></div>)}</div>
      : <div style={{ color: 'var(--color-neutral-600)' }}>{'none' in sn ? sn.none : ''}</div>}
  </>;
  return createPortal(<div ref={card} role="tooltip" style={{ position: 'fixed', zIndex: 1000, left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: 300, padding: '8px 10px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 22px rgba(0,0,0,.35)', fontSize: '12px', lineHeight: 1.45, pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>{body}</div>, document.body);
}

// Hovering an advanced stat's column header anywhere in the game (2026-10-30): a one-line description of what it
// measures. One listener for the whole game (like PlayerHover): any table header whose text is an advanced stat
// gets it, over the whole header cell, without each screen adding its own.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Short and to the point: what the number tells you.
export const ADV_DESC: Record<string, string> = {
  'PER': 'All his box-score production per minute in one number. 15 is average.',
  'TS%': 'Scoring efficiency, counting threes and free throws.',
  'EFG%': 'Field goal percentage with a three worth one and a half makes.',
  '3PAR': 'Share of his shots that are threes.',
  'FTR': 'Free throw trips per shot: how often he gets to the line.',
  'FT/FGA': 'Free throws made per shot: points earned at the line.',
  'USG%': 'Share of his team’s plays he finishes (shot, free throws or turnover) while on the floor.',
  'AST%': 'Share of his teammates’ baskets he assisted while on the floor.',
  'TOV%': 'Turnovers per 100 plays he finishes.',
  'ORB%': 'Share of his team’s missed shots he rebounds.',
  'DRB%': 'Share of opponents’ missed shots he rebounds.',
  'TRB%': 'Share of all missed shots he rebounds.',
  'STL%': 'Share of opponent possessions he ends with a steal.',
  'BLK%': 'Share of opponents’ two-point shots he blocks.',
  'ORTG': 'Points he produces per 100 possessions he uses.',
  'DRTG': 'Points opponents score per 100 possessions with him on defense. Lower is better.',
  'OWS': 'Wins his offense added.',
  'DWS': 'Wins his defense added.',
  'WS': 'Wins he added, offense and defense together.',
  'WS/40': 'Wins added per 40 minutes. About .100 is average.',
  'WS/48': 'Wins added per 48 minutes. About .100 is average.',
  'OBPM': 'Offensive points per 100 possessions above an average player, from the box score.',
  'DBPM': 'Defensive points per 100 possessions above an average player, from the box score.',
  'BPM': 'Points per 100 possessions above an average player, from the box score. 0 is average.',
  'VORP': 'Value over a replacement-level player across the season.',
  'EWA': 'Wins added over a replacement-level player.',
  'EPM': 'Impact per 100 possessions, from the box score and how his team does with him on the floor.',
  'LEBRON': 'Impact per 100 possessions, blending box score, role and on/off, with luck smoothed out.',
  'DARKO': 'Projected impact per 100 possessions, weighted toward his recent form.',
  'ON/OFF': 'How much better his team is with him on the floor than off it, per 100 possessions.',
  'NET': 'Points scored minus allowed per 100 possessions.',
  'PACE': 'Possessions per 48 minutes.',
  '+/-': 'Points his team outscored opponents by while he was on the floor.',
};
const nameOf = (th: HTMLElement) => (th.textContent || '').replace(/[↑↓▲▼↕]/g, '').trim(), keyOf = (th: HTMLElement) => nameOf(th).toUpperCase();

export function StatHover() {
  const [hit, setHit] = useState<{ text: string; label: string; rect: DOMRect } | null>(null), card = useRef<HTMLDivElement>(null), [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    let cur: HTMLElement | null = null, timer: any = null;
    const restore = () => { if (cur?.dataset.advTitle != null) { cur.setAttribute('title', cur.dataset.advTitle); delete cur.dataset.advTitle; } };
    const over = (e: MouseEvent) => {
      const th = (e.target as HTMLElement | null)?.closest?.('th') as HTMLElement | null, k = th ? keyOf(th) : '', text = ADV_DESC[k];
      if (th === cur) return;
      restore(); clearTimeout(timer); setHit(null); setPos(null); cur = text ? th : null;
      if (!th || !text) return;
      if (th.hasAttribute('title')) { th.dataset.advTitle = th.getAttribute('title') || ''; th.removeAttribute('title'); } // ours replaces the browser's slower one
      timer = setTimeout(() => { if (cur === th && document.body.contains(th)) setHit({ text, label: nameOf(th), rect: th.getBoundingClientRect() }); }, 120);
    };
    const off = () => { restore(); cur = null; clearTimeout(timer); setHit(null); setPos(null); };
    document.addEventListener('mouseover', over); window.addEventListener('scroll', off, true);
    return () => { document.removeEventListener('mouseover', over); window.removeEventListener('scroll', off, true); restore(); clearTimeout(timer); };
  }, []);
  useLayoutEffect(() => {
    if (!hit || !card.current) return;
    const h = card.current.offsetHeight, w = card.current.offsetWidth, vw = window.innerWidth, vh = window.innerHeight, m = 8, r = hit.rect;
    const below = r.bottom + 6 + h <= vh - m;
    setPos({ left: Math.max(m, Math.min(r.left + r.width / 2 - w / 2, vw - m - w)), top: below ? r.bottom + 6 : Math.max(m, r.top - 6 - h) });
  }, [hit]);
  if (!hit) return null;
  return createPortal(<div ref={card} role="tooltip" style={{ position: 'fixed', zIndex: 1000, left: pos?.left ?? -9999, top: pos?.top ?? -9999, maxWidth: 250, padding: '6px 9px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 22px rgba(0,0,0,.35)', fontSize: '12px', lineHeight: 1.4, pointerEvents: 'none', fontFamily: 'var(--font-body)', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, textAlign: 'left' }}><b>{hit.label}</b> · {hit.text}</div>, document.body);
}

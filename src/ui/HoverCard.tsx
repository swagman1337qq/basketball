// A hover card that floats above everything (rendered into <body>, fixed position), opens
// below or above its anchor depending on room, and stays inside the window: never clipped
// by a scrolling table and never makes the page scroll.
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function HoverCard({ anchor, children, width = 260, style }: { anchor: ReactNode; children: ReactNode; width?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null), card = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null), [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!rect || !card.current) return;
    const h = card.current.offsetHeight, w = card.current.offsetWidth, vw = window.innerWidth, vh = window.innerHeight, m = 8;
    const below = rect.bottom + 6 + h <= vh - m || rect.top - 6 - h < m;
    const top = below ? Math.min(rect.bottom + 6, vh - m - h) : Math.max(m, rect.top - 6 - h);
    const left = Math.max(m, Math.min(rect.left, vw - m - w));
    setPos({ left, top });
  }, [rect]);
  return (
    <span ref={ref} style={{ display: 'inline-flex' }} onMouseEnter={() => { setPos(null); setRect(ref.current!.getBoundingClientRect()); }} onMouseLeave={() => { setRect(null); setPos(null); }}>
      {anchor}
      {rect && createPortal(
        <div ref={card} role="tooltip" style={{ position: 'fixed', zIndex: 1000, left: pos?.left ?? -9999, top: pos?.top ?? -9999, width, maxHeight: 'calc(100vh - 16px)', overflowY: 'auto', padding: '8px 10px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 22px rgba(0,0,0,.35)', fontSize: '12px', lineHeight: 1.45, textAlign: 'left', pointerEvents: 'none', fontWeight: 400, fontFamily: 'var(--font-body)', ...style }}>
          {children}
        </div>, document.body)}
    </span>
  );
}

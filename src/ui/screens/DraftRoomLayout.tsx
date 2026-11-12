import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronsRight, GripVertical } from 'lucide-react';
import type { VM } from '../vm';
import { DraftPickOrder } from './DraftPickOrder';

const STORAGE_KEY = 'front-office:draft-panel';
const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 240;
const MAX_WIDTH = 640;
const COLLAPSE_AT = 140;
const readSize = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return {
      width:
        typeof saved?.width === 'number' && Number.isFinite(saved.width)
          ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, saved.width))
          : DEFAULT_WIDTH,
      collapsed: saved?.collapsed === true,
    };
  } catch {
    return { width: DEFAULT_WIDTH, collapsed: false };
  }
};

export function DraftRoomLayout({ vm, children }: { vm: VM; children: ReactNode }) {
  const [size, setSize] = useState(readSize);
  const [roomWidth, setRoomWidth] = useState(1160);
  const [dragging, setDragging] = useState(false);
  const room = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; x: number; width: number } | null>(null);
  const stacked = roomWidth < 760;
  const maxWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, roomWidth - 460 - 14));
  const width = Math.min(size.width, maxWidth);
  const toggle = () => setSize(previous => ({ ...previous, collapsed: !previous.collapsed }));

  useEffect(() => {
    const element = room.current;
    if (!element) return;
    const measure = () => {
      const measured = element.getBoundingClientRect().width;
      if (measured > 0) setRoomWidth(measured);
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
      } catch {
        /* Sizing still works when storage is unavailable. */
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [size]);

  return (
    <div
      ref={room}
      className="draft-room-layout"
      data-order-collapsed={size.collapsed}
      data-stacked={stacked}
      data-resizing={dragging}
      style={{ '--draft-pick-width': (size.collapsed ? 36 : width) + 'px' } as CSSProperties}
    >
      <div id="draft-pick-panel" className="draft-order-pane" hidden={size.collapsed}>
        {!size.collapsed && <DraftPickOrder vm={vm} onCollapse={toggle} />}
      </div>
      {size.collapsed && (
        <div className="draft-order-rail">
          <button
            type="button"
            className="btn btn-ghost draft-order-expand"
            onClick={toggle}
            aria-label="Expand pick order"
            aria-expanded={false}
            aria-controls="draft-pick-panel"
          >
            <ChevronsRight size={18} aria-hidden="true" />
            <span>Pick order</span>
          </button>
        </div>
      )}
      <div
        className="draft-panel-resizer"
        role="separator"
        aria-label="Resize pick order"
        aria-orientation="vertical"
        aria-controls="draft-pick-panel"
        aria-valuemin={0}
        aria-valuemax={maxWidth}
        aria-valuenow={size.collapsed ? 0 : width}
        aria-valuetext={size.collapsed ? 'Pick order collapsed' : 'Pick order ' + Math.round(width) + ' pixels wide'}
        tabIndex={stacked ? -1 : 0}
        onDoubleClick={toggle}
        onPointerDown={event => {
          if (event.button !== 0 || stacked || drag.current) return;
          event.preventDefault();
          drag.current = { pointer: event.pointerId, x: event.clientX, width: size.collapsed ? 36 : width };
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start || start.pointer !== event.pointerId) return;
          const next = start.width + event.clientX - start.x;
          setSize(previous =>
            next < COLLAPSE_AT
              ? { ...previous, collapsed: true }
              : { width: Math.max(MIN_WIDTH, Math.min(maxWidth, next)), collapsed: false },
          );
        }}
        onPointerUp={event => {
          if (drag.current?.pointer !== event.pointerId) return;
          drag.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
          event.preventDefault();
          if (event.key === 'Enter' || event.key === ' ') toggle();
          else if (event.key === 'Home') setSize(previous => ({ ...previous, collapsed: true }));
          else if (event.key === 'End') setSize({ width: maxWidth, collapsed: false });
          else {
            const next = (size.collapsed ? 36 : width) + (event.key === 'ArrowRight' ? 20 : -20);
            setSize(previous =>
              (next < COLLAPSE_AT || width === MIN_WIDTH) && event.key === 'ArrowLeft'
                ? { ...previous, collapsed: true }
                : { width: Math.max(MIN_WIDTH, Math.min(maxWidth, next)), collapsed: false },
            );
          }
        }}
      >
        <GripVertical size={16} aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

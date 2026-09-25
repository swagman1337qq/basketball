// Small building blocks for hand-written screens, matching the Classical styling
// used by the generated ones (inline styles, hairline rules, heading font).
import type { CSSProperties, ReactNode } from 'react';

export const kickerStyle: CSSProperties = { fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' };
export const accentKicker: CSSProperties = { ...kickerStyle, color: 'var(--color-accent-700)' };
export const h4Style: CSSProperties = { margin: '0 0 4px', fontSize: '19px' };
export const ruleH4: CSSProperties = { margin: '0 0 6px', fontSize: '18px', borderBottom: '1px solid var(--color-text)', paddingBottom: '4px' };
export const muted: CSSProperties = { color: 'var(--color-neutral-700)' };
export const th = (align: 'left' | 'right' = 'left'): CSSProperties => ({ padding: '6px 8px', textAlign: align });
export const td = (align: 'left' | 'right' = 'left', extra?: CSSProperties): CSSProperties => ({ padding: '5px 8px', textAlign: align, ...extra });
export const linkBtn: CSSProperties = { all: 'unset', cursor: 'pointer' };

export function Kicker({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <div style={accent ? accentKicker : kickerStyle}>{children}</div>;
}

// A clickable name (player or team) with the prototype's hover treatment.
export function Link({ onClick, children, style }: { onClick?: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button className="hv4" onClick={e => { e.stopPropagation(); onClick?.(); }} style={{ ...linkBtn, ...style }}>
      {children}
    </button>
  );
}

export function Stat({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--color-text)', paddingTop: '8px' }}>
      <div style={kickerStyle}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', lineHeight: 1.05 }}>{value}</div>
      {sub != null && <div style={{ ...muted, fontSize: '12px' }}>{sub}</div>}
    </div>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {options.map(([k, label]) => (
        <button key={String(k)} onClick={() => onChange(k)} style={{ all: 'unset', cursor: 'pointer', padding: '6px 14px', fontSize: '13px', whiteSpace: 'nowrap', color: value === k ? 'var(--color-accent-700)' : 'var(--color-text)', boxShadow: value === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}>{label}</button>
      ))}
    </div>
  );
}

export function Bar({ value, max = 100, color = 'var(--color-accent)', height = 4 }: { value: number; max?: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--color-neutral-300)' }}>
      <div style={{ height, width: Math.max(0, Math.min(100, (value / max) * 100)) + '%', background: color }} />
    </div>
  );
}

export const pctS = (m: number, a: number, d = 1) => (a ? ((m / a) * 100).toFixed(d) + '%' : '—');
export const tone = (v: number) => (v >= 65 ? 'var(--gm-elite)' : v < 45 ? 'var(--color-neutral-500)' : 'var(--color-text)');

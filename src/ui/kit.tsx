// Small building blocks for hand-written screens, matching the Classical styling
// used by the generated ones (inline styles, hairline rules, heading font).
import { useState, type CSSProperties, type ReactNode } from 'react';

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

// Turn player names inside a sentence into profile links. `people` limits the search
// (e.g. an event's player ids); without it every player in the league is matched.
let idxCache: { n: number; P: any; re: RegExp | null; byName: Record<string, number> } | null = null;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function nameIndex(P: Record<number, any>) {
  const list = Object.values(P) as any[];
  if (idxCache && idxCache.P === P && idxCache.n === list.length) return idxCache;
  const byName: Record<string, number> = {};
  list.forEach(p => { if (p.name && p.name.length > 4) byName[p.name] = p.id; });
  const names = Object.keys(byName).sort((a, b) => b.length - a.length);
  return (idxCache = { n: list.length, P, byName, re: names.length ? new RegExp('(' + names.map(esc).join('|') + ')', 'g') : null });
}
export function linkNames(text: string, open: (id: number) => void, opts: { P?: Record<number, any>; people?: { id: number; name: string }[] }): ReactNode {
  if (!text) return text;
  let re: RegExp | null, byName: Record<string, number>;
  if (opts.people) { byName = {}; opts.people.forEach(p => { if (p && p.name) byName[p.name] = p.id; }); const ns = Object.keys(byName).sort((a, b) => b.length - a.length); re = ns.length ? new RegExp('(' + ns.map(esc).join('|') + ')', 'g') : null; }
  else { const ix = nameIndex(opts.P || {}); re = ix.re; byName = ix.byName; }
  if (!re) return text;
  const parts = text.split(re);
  if (parts.length === 1) return text;
  return parts.map((x, i) => (i % 2 === 1 && byName[x] != null ? <Link key={i} onClick={() => open(byName[x])} style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-divider)', textUnderlineOffset: '2px' }}>{x}</Link> : x));
}

// A typed number field (instead of a slider). The value applies on Enter or when the
// field loses focus, clamped to [min, max] and rounded to `step`; the spinner arrows
// apply at once. Partial typing ("7" on the way to "72") is never applied.
export function NumInput({ value, min, max, step = 1, onValue, disabled, width = 76, suffix, title }: { value: number; min?: number; max?: number; step?: number; onValue: (v: number) => void; disabled?: boolean; width?: number; suffix?: ReactNode; title?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const dec = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const norm = (n: number) => { let v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); v = Math.round(v / step) * step; return +v.toFixed(dec); };
  const commit = (txt: string) => { const n = parseFloat(txt); if (isFinite(n)) { const v = norm(n); if (v !== value) onValue(v); } setDraft(null); };
  const shown = draft ?? (isFinite(value) ? (+value).toFixed(dec) : '');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <input className="input num-input" type="number" inputMode="decimal" min={min} max={max} step={step} value={shown} disabled={disabled} title={title}
        onChange={e => { const t = e.target.value, n = parseFloat(t); setDraft(t); if (isFinite(n) && Math.abs(n - value) <= step + 1e-9 && n >= (min ?? -Infinity) && n <= (max ?? Infinity)) { onValue(norm(n)); setDraft(null); } }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
        style={{ width, minHeight: '30px', padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} />
      {suffix != null && <span style={{ ...muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{suffix}</span>}
    </span>
  );
}

// Type-to-search country picker (every country and territory), with flags.
export function CountryPicker({ C, value, onPick, placeholder = 'Type a country…', exclude = [], width = 220 }: { C: Record<string, any>; value?: string; onPick: (code: string) => void; placeholder?: string; exclude?: string[]; width?: number | string }) {
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), [hi, setHi] = useState(0);
  const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const all = Object.keys(C).filter(c => !exclude.includes(c)).sort((a, b) => C[a].n.localeCompare(C[b].n));
  const nq = norm(q.trim()), list = (nq ? all.filter(c => norm(C[c].n).includes(nq) || c.toLowerCase() === nq).sort((a, b) => (norm(C[a].n).startsWith(nq) ? 0 : 1) - (norm(C[b].n).startsWith(nq) ? 0 : 1)) : all).slice(0, 60);
  const pick = (c: string) => { onPick(c); setQ(''); setOpen(false); };
  return (
    <span style={{ position: 'relative', display: 'inline-block', width }}>
      <input className="input" value={open ? q : value && C[value] ? C[value].n : q} placeholder={placeholder} style={{ width: '100%', paddingLeft: value && !open ? '28px' : undefined }}
        onFocus={() => { setOpen(true); setQ(''); setHi(0); }} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={e => { setQ(e.target.value); setHi(0); setOpen(true); }}
        onKeyDown={e => { if (e.key === 'ArrowDown') { setHi(h => Math.min(list.length - 1, h + 1)); e.preventDefault(); } else if (e.key === 'ArrowUp') { setHi(h => Math.max(0, h - 1)); e.preventDefault(); } else if (e.key === 'Enter' && list[hi]) { pick(list[hi]); e.preventDefault(); } else if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } }} />
      {value && !open && C[value] && <img src={'flags/' + C[value].iso + '.svg'} alt="" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 11, objectFit: 'cover' }} />}
      {open && (
        <div style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 2px)', left: 0, right: 0, maxHeight: 260, overflowY: 'auto', background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: '0 6px 18px rgba(0,0,0,.25)' }}>
          {list.length === 0 && <div style={{ padding: '6px 10px', fontSize: '12.5px', color: 'var(--color-neutral-600)' }}>No match</div>}
          {list.map((c, i) => (
            <div key={c} onMouseDown={e => { e.preventDefault(); pick(c); }} onMouseEnter={() => setHi(i)} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 10px', fontSize: '12.5px', cursor: 'pointer', background: i === hi ? 'var(--color-accent-100)' : undefined, color: i === hi ? 'var(--color-accent-800)' : undefined }}>
              <img src={'flags/' + C[c].iso + '.svg'} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />{C[c].n}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

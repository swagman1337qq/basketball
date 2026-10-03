// Small building blocks for hand-written screens, matching the Classical styling
// used by the generated ones (inline styles, hairline rules, heading font).
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

export const kickerStyle: CSSProperties = { fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' };
export const accentKicker: CSSProperties = { ...kickerStyle, color: 'var(--color-accent-700)' };
export const h4Style: CSSProperties = { margin: '0 0 4px', fontSize: '19px' };
export const ruleH4: CSSProperties = { margin: '0 0 6px', fontSize: '18px', borderBottom: '1px solid var(--color-text)', paddingBottom: '4px' };
export const muted: CSSProperties = { color: 'var(--color-neutral-700)' };
export const GOD_PINK = '#ff3fa4'; // God Mode's own color: its tools stand out, and you always know you're in it
// God Mode styling, shared by every God-Mode-only control (they aren't rendered at all when it's off).
export const godBtn: CSSProperties = { color: GOD_PINK, borderColor: GOD_PINK };
export const godFill: CSSProperties = { color: '#fff', background: GOD_PINK, borderColor: GOD_PINK };
export const godBox: CSSProperties = { border: '1px dashed ' + GOD_PINK, background: 'color-mix(in srgb, ' + GOD_PINK + ' 7%, transparent)', borderRadius: 'var(--radius-md)' };
export const godText: CSSProperties = { color: GOD_PINK };
// Highlights. The team you're running now (and its players) gets its own primary color (vm.ctx
// `meColor`); the other Pantone TCX colors (as sRGB): a team's current players on another team's
// history (14-3209 Pastel Lavender), active players with another team or unsigned (14-0115 Foam
// Green), Hall of Famers (15-0927 Pale Gold). Text on a highlight is dark or white, whichever reads
// better on it (`inkOn`).
export const HL = { mine: '#D8A1C4', active: '#B4C79C', hof: '#BD9865', ink: '#1d1b19' };
const lum = (hex: string) => { const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((hex || '').trim()); if (!m) return 1; const h = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1], n = parseInt(h, 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const inkOn = (bg: string) => (lum(bg) > 0.2 ? HL.ink : '#ffffff'); // the better contrast of the two (WCAG luminance)
export const hlRow = (bg?: string | null): CSSProperties | undefined => (bg ? { background: bg, color: inkOn(bg) } : undefined);
// A secondary button sitting on a highlighted row.
export const onHL = (bg: string): CSSProperties => (inkOn(bg) === HL.ink ? { color: HL.ink, borderColor: 'rgba(29,27,25,.4)', background: 'rgba(255,255,255,.35)' } : { color: '#fff', borderColor: 'rgba(255,255,255,.55)', background: 'rgba(255,255,255,.12)' });
// A color swatch for a highlight key.
export const Swatch = ({ c }: { c: string | null }) => <span style={{ width: 14, height: 14, borderRadius: 3, background: c || 'transparent', border: '1px solid ' + (c ? 'color-mix(in srgb, var(--color-text) 25%, transparent)' : 'var(--color-neutral-500)'), flex: 'none' }} />;
// A championship ring, as Basketball-Reference marks titles.
export function Ring({ size = 13, title = 'Championship' }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title} style={{ verticalAlign: '-2px', flex: 'none' }}>
      <title>{title}</title>
      <circle cx="12" cy="15" r="6.5" fill="none" stroke="#d4a017" strokeWidth="3" />
      <path d="M12 2.5 15.5 6 12 9 8.5 6z" fill="#d4a017" stroke="#8a6508" strokeWidth="0.8" />
    </svg>
  );
}
// Right-aligned cells hold numbers and records (60–22): never wrap them.
export const th = (align: 'left' | 'right' = 'left'): CSSProperties => ({ padding: '6px 8px', textAlign: align, ...(align === 'right' ? { whiteSpace: 'nowrap' } : {}) });
export const td = (align: 'left' | 'right' = 'left', extra?: CSSProperties): CSSProperties => ({ padding: '5px 8px', textAlign: align, ...(align === 'right' ? { whiteSpace: 'nowrap' } : {}), ...extra });
export const linkBtn: CSSProperties = { all: 'unset', cursor: 'pointer' };
// A name in a list, card or table: one line, and an unusually long one ends in an ellipsis (the full name
// is in the tooltip), so a long name never wraps a row or pushes the page down.
export const PN: CSSProperties = { display: 'inline-block', maxWidth: '26ch', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' };
const textOf = (c: ReactNode): string | null => (typeof c === 'string' || typeof c === 'number' ? String(c) : Array.isArray(c) && c.every(x => typeof x === 'string' || typeof x === 'number') ? c.join('') : null);

export function Kicker({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <div style={accent ? accentKicker : kickerStyle}>{children}</div>;
}

// A clickable name (player or team) with the prototype's hover treatment.
export function Link({ onClick, children, style }: { onClick?: () => void; children: ReactNode; style?: CSSProperties }) {
  const txt = textOf(children), long = !!txt && txt.length > 24; // a long name: one line with an ellipsis (PN)
  return (
    <button className="hv4" onClick={e => { e.stopPropagation(); onClick?.(); }} title={long ? txt! : undefined} style={{ ...linkBtn, ...(long ? PN : {}), ...style }}>
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
  const list = (Object.values(P) as any[]).filter(p => !p.gone);
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

// Where a rating sits in this league (same cut-offs as the scouting reports) and its colour.
export const RATING_TIERS: [number, string][] = [[75, 'Superstar'], [66, 'All-Star'], [56, 'Starter'], [48, 'Rotation'], [41, 'Bench'], [0, 'Fringe']];
export const ratingTier = (v: number) => { const i = RATING_TIERS.findIndex(([t]) => v >= t); return { i, name: RATING_TIERS[i][1], color: 'var(--rt-' + i + ')' }; };

// A length in feet and inches (two typed fields). Inches past 11 or below 0 carry into the feet.
export function FtInInput({ inches, min, max, onValue, disabled }: { inches: number; min: number; max: number; onValue: (inches: number) => void; disabled?: boolean }) {
  const ft = Math.floor(inches / 12), inch = inches % 12, set = (n: number) => { const v = Math.min(max, Math.max(min, n)); if (v !== inches) onValue(v); };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Feet and inches">
      <NumInput value={ft} min={Math.floor(min / 12)} max={Math.floor(max / 12)} width={52} disabled={disabled} onValue={v => set(v * 12 + inch)} /><span style={muted}>′</span>
      <NumInput value={inch} min={-1} max={12} width={56} disabled={disabled} onValue={v => set(ft * 12 + v)} /><span style={muted}>″</span>
    </span>
  );
}

// A typed number field (instead of a slider). The value applies on Enter or when the
// field loses focus, clamped to [min, max] and rounded to `step`; the spinner arrows
// apply at once. Partial typing ("7" on the way to "72") is never applied.
const stepBtn: CSSProperties = { minWidth: 30, minHeight: 32, padding: '0 6px', fontSize: '17px', fontWeight: 700, lineHeight: 1 };
export function NumInput({ value, min, max, step = 1, onValue, disabled, width = 76, suffix, title, stepper }: { value: number; min?: number; max?: number; step?: number; onValue: (v: number) => void; disabled?: boolean; width?: number; suffix?: ReactNode; title?: string ; stepper?: boolean}) {
  const [draft, setDraft] = useState<string | null>(null);
  const dec = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const norm = (n: number) => { let v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); v = Math.round(v / step) * step; return +v.toFixed(dec); };
  const commit = (txt: string) => { const n = parseFloat(txt); if (isFinite(n)) { const v = norm(n); if (v !== value) onValue(v); } setDraft(null); };
  const shown = draft ?? (isFinite(value) ? (+value).toFixed(dec) : '');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: stepper ? '3px' : '6px' }}>
      {stepper && <button type="button" className="btn btn-ghost" disabled={disabled || value <= (min ?? -Infinity)} onClick={() => onValue(norm(value - step))} aria-label="Decrease" style={stepBtn}>−</button>}
      <input className={'input num-input' + (stepper ? ' no-spin' : '')} type="number" inputMode="decimal" min={min} max={max} step={step} value={shown} disabled={disabled} title={title}
        onChange={e => { const t = e.target.value, n = parseFloat(t); setDraft(t); if (isFinite(n) && Math.abs(n - value) <= step + 1e-9 && n >= (min ?? -Infinity) && n <= (max ?? Infinity)) { onValue(norm(n)); setDraft(null); } }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
        style={{ width, minHeight: stepper ? '32px' : '30px', padding: '4px 8px', textAlign: stepper ? 'center' : 'right', fontSize: stepper ? '15px' : undefined, fontVariantNumeric: 'tabular-nums' }} />
      {stepper && <button type="button" className="btn btn-ghost" disabled={disabled || value >= (max ?? Infinity)} onClick={() => onValue(norm(value + step))} aria-label="Increase" style={stepBtn}>+</button>}
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

// A text box with a drop-down of suggestions: pick one, or type anything. The list shows
// everything when opened and narrows as you type. Options can carry a small note (sub).
export function Combo({ value, options, onChange, onPick, onCommit, placeholder, width = 180 }: { value: string; options: { v: string; sub?: string }[]; onChange: (v: string) => void; onPick?: (o: { v: string; sub?: string }) => void; onCommit?: () => void; placeholder?: string; width?: number | string }) {
  const [open, setOpen] = useState(false), [typed, setTyped] = useState(false), [hi, setHi] = useState(0);
  const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nq = typed ? norm(value.trim()) : '';
  const list = (nq ? options.filter(o => norm(o.v).includes(nq)).sort((a, b) => (norm(a.v).startsWith(nq) ? 0 : 1) - (norm(b.v).startsWith(nq) ? 0 : 1)) : options).slice(0, 80);
  const pick = (o: { v: string; sub?: string }) => { (onPick || ((x: { v: string }) => onChange(x.v)))(o); setOpen(false); setTyped(false); };
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width }}>
      <input className="input" value={value} placeholder={placeholder} style={{ width: '100%', paddingRight: options.length ? 22 : undefined }}
        onFocus={() => { setOpen(true); setTyped(false); setHi(-1); }} onBlur={() => { setTimeout(() => setOpen(false), 150); if (typed) onCommit?.(); setTyped(false); }} onChange={e => { onChange(e.target.value); setTyped(true); setOpen(true); setHi(0); }}
        onKeyDown={e => { if (e.key === 'ArrowDown') { setOpen(true); setHi(h => Math.min(list.length - 1, h + 1)); e.preventDefault(); } else if (e.key === 'ArrowUp') { setHi(h => Math.max(0, h - 1)); e.preventDefault(); } else if (e.key === 'Enter') { if (open && list[hi]) pick(list[hi]); else setOpen(false); e.preventDefault(); } else if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } }} />
      {options.length > 0 && <span aria-hidden style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-neutral-600)', pointerEvents: 'none' }}>▾</span>}
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 2px)', left: 0, minWidth: '100%', maxHeight: 260, overflowY: 'auto', background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', boxShadow: '0 6px 18px rgba(0,0,0,.25)' }}>
          {list.length === 0 && <div style={{ padding: '6px 10px', fontSize: '12.5px', color: 'var(--color-neutral-600)' }}>No match: keeps what you typed</div>}
          {list.map((o, i) => (
            <div key={o.v + (o.sub || '')} onMouseDown={e => { e.preventDefault(); pick(o); }} onMouseEnter={() => setHi(i)} style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', padding: '4px 10px', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', background: i === hi ? 'var(--color-accent-100)' : o.v === value ? 'var(--color-neutral-100)' : undefined, color: i === hi ? 'var(--color-accent-800)' : undefined }}>
              <span>{o.v}</span>{o.sub && <span style={{ color: 'var(--color-neutral-600)', fontSize: '11.5px' }}>{o.sub}</span>}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

// A small "randomize this field" button (God Mode editor).
export function Dice({ onClick, title = 'Randomize' }: { onClick: () => void; title?: string }) {
  return <button type="button" className="btn btn-ghost" onClick={onClick} title={title} aria-label={title} style={{ fontSize: '13px', padding: '2px 7px', flex: 'none' }}>🎲</button>;
}

// Long lists show a page at a time: page numbers, "Show more", and a total ("Showing 1–25 of
// 300 players"). The view resets to the first page when the list's length or `resetKey` changes.
export function usePaged<T>(rows: T[], noun = 'players', size = 25, resetKey?: unknown) {
  const [v, setV] = useState({ start: 0, count: size });
  useEffect(() => { setV({ start: 0, count: size }); }, [rows.length, resetKey, size]);
  const total = rows.length, start = Math.min(v.start, Math.max(0, total - 1)), end = Math.min(total, start + v.count);
  const pages = Math.ceil(total / size), cur = Math.floor(start / size);
  // Every control keeps its place: the arrows sit first, page buttons have one width, and the
  // list always has the same number of slots, so fast clicking never lands on the wrong button.
  const W = 34, pageBtn = (i: number) => <button key={i} className={'btn ' + (i === cur && v.count === size ? 'btn-primary' : 'btn-ghost')} onClick={() => setV({ start: i * size, count: size })} style={{ width: W, padding: '2px 0', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }} aria-label={'Page ' + (i + 1)}>{i + 1}</button>;
  const nums: (number | '…')[] = pages <= 9 ? Array.from({ length: pages }, (_, i) => i)
    : cur <= 4 ? [0, 1, 2, 3, 4, 5, 6, '…', pages - 1]
    : cur >= pages - 5 ? [0, '…', ...Array.from({ length: 7 }, (_, k) => pages - 7 + k)]
    : [0, '…', cur - 2, cur - 1, cur, cur + 1, cur + 2, '…', pages - 1];
  const arrow = (dir: -1 | 1) => <button className="btn btn-ghost" disabled={dir < 0 ? cur === 0 : end >= total} onClick={() => setV({ start: (cur + dir) * size, count: size })} style={{ width: W, padding: '2px 0', fontSize: '13px' }} aria-label={dir < 0 ? 'Previous page' : 'Next page'}>{dir < 0 ? '‹' : '›'}</button>;
  const pager = total === 0 ? null : (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', margin: '8px 0 4px', fontSize: '12.5px' }}>
      {pages > 1 && <>{arrow(-1)}{arrow(1)}</>}
      <span style={{ ...muted, margin: '0 6px', minWidth: (16 + noun.length + 3 * String(total).length) + 'ch', fontVariantNumeric: 'tabular-nums' }}>Showing {start + 1}–{end} of {total} {noun}</span>
      {pages > 1 && (<>
        {nums.map((n, i) => n === '…' ? <span key={'e' + i} style={{ ...muted, width: W, textAlign: 'center' }}>…</span> : pageBtn(n))}
        {end < total && <button className="btn btn-secondary" onClick={() => setV(x => ({ ...x, count: x.count + size }))} style={{ padding: '2px 10px', fontSize: '12px', marginLeft: 6 }}>Show {Math.min(size, total - end)} more</button>}
      </>)}
    </div>);
  return { rows: rows.slice(start, end), pager, total, start };
}

// Teams in alphabetical order (city, then nickname) for menus and ‹ › arrows.
export const alphaTeams = (ts: any[]): any[] => [...ts].sort((a, b) => (a.region + ' ' + a.name).localeCompare(b.region + ' ' + b.name));

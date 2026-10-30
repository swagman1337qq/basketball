// A typed search over a player list (2026-10-30), on the Draft board and Free agency: name (any part of it, accents
// ignored), position (G finds G, PG, SG and GF; several with commas), and current ability, potential and age as
// numbers or comparisons: <30, <=19, >60, >=70, =20, 20, a range 20-25, or two at once (>=19 <=21).
import { useState } from 'react';
import { muted } from './kit';

type Row = { name: string; pos: string; ovr: number; pot: number; age: number };
const KEYS = ['name', 'pos', 'ovr', 'pot', 'age'] as const;
type Q = Record<(typeof KEYS)[number], string>;
const EMPTY: Q = { name: '', pos: '', ovr: '', pot: '', age: '' };
const plain = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// A number test from what was typed, or null for nothing typed, or 'bad' if it can't be read.
export function parseCmp(q: string): ((v: number) => boolean) | null | 'bad' {
  const t = q.trim(); if (!t) return null;
  const parts = t.replace(/\s*(<=|>=|<|>|=)\s*/g, ' $1').split(/[\s,]+/).filter(Boolean), tests: ((v: number) => boolean)[] = [];
  for (const x of parts) {
    let m = x.match(/^(<=|>=|<|>|=)?(\d+(?:\.\d+)?)$/);
    if (m) { const n = +m[2], op = m[1] || '='; tests.push(op === '<' ? v => v < n : op === '<=' ? v => v <= n : op === '>' ? v => v > n : op === '>=' ? v => v >= n : v => Math.round(v) === n); continue; }
    m = x.match(/^(\d+(?:\.\d+)?)(?:-|to)(\d+(?:\.\d+)?)$/);
    if (m) { const a = Math.min(+m[1], +m[2]), b = Math.max(+m[1], +m[2]); tests.push(v => v >= a && v <= b); continue; }
    return 'bad';
  }
  return v => tests.every(f => f(v));
}

export function useSearchFilter() {
  const [q, setQ] = useState<Q>(EMPTY);
  const name = plain(q.name.trim()), pos = q.pos.toUpperCase().split(/[\s,]+/).filter(Boolean);
  const cmp = { ovr: parseCmp(q.ovr), pot: parseCmp(q.pot), age: parseCmp(q.age) };
  const active = KEYS.some(k => q[k].trim());
  const test = (r: Row) => (!name || plain(r.name || '').includes(name)) && (!pos.length || pos.some(x => (r.pos || '').toUpperCase().includes(x)))
    && (['ovr', 'pot', 'age'] as const).every(k => { const f = cmp[k]; return f == null || f === 'bad' || f(r[k]); });
  const box = (k: (typeof KEYS)[number], label: string, w: number, ph: string, tip: string) => {
    const bad = k !== 'name' && k !== 'pos' && cmp[k] === 'bad';
    return <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12.5px' }} title={bad ? 'Couldn’t read that. Try 25, <30, <=19, >=60 or 20-25.' : tip}>
      <span style={muted}>{label}</span>
      <input className="input" value={q[k]} placeholder={ph} onChange={e => setQ(o => ({ ...o, [k]: e.target.value }))} style={{ width: w, padding: '3px 7px', fontSize: '12.5px', ...(bad ? { borderColor: 'var(--color-danger, #d33)' } : {}) }} />
    </label>;
  };
  const bar = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 8px' }}>
      {box('name', 'Name', 150, 'e.g. John', 'Any part of his name')}
      {box('pos', 'Pos', 60, 'e.g. G', 'G finds G, PG, SG and GF; F finds the forwards; several with commas (PG, C)')}
      {box('ovr', 'Ovr', 70, 'e.g. >=50', 'Current ability: 50, >50, >=50, <45, 45-55')}
      {box('pot', 'Pot', 70, 'e.g. >=70', 'Potential: 70, >70, >=70, <60, 60-75')}
      {box('age', 'Age', 70, 'e.g. <=19', 'Age: 19, <20, <=19, >25, 19-21')}
      {active && <button className="btn btn-ghost" onClick={() => setQ(EMPTY)} style={{ fontSize: '12px' }}>Clear search</button>}
    </div>);
  return { bar, test, active, clear: () => setQ(EMPTY) };
}

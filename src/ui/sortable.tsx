// Click-to-sort table headers. `useSort(rows, keys)` returns the sorted rows and a `head()`
// that renders a clickable <th>. Text columns sort A→Z first, numbers high→low; click again
// to reverse. Player names sort by last name.
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type Val = number | string | null | undefined;
export type Keys<T> = Record<string, (r: T) => Val>;

// Last name for sorting ("Nguyen Van Hung" → Nguyen when the family name comes first).
export const lastOf = (p: any) => String(p?.last ?? (p?.familyFirst ? String(p?.name || '').split(' ')[0] : String(p?.name || '').split(' ').slice(-1)[0]) ?? '');
export const byLast = (p: any) => (lastOf(p) + ' ' + (p?.name || '')).toLowerCase();

export function useSort<T>(rows: T[], keys: Keys<T>, init: [string, 1 | -1] | null = null) {
  const [st, setSt] = useState<[string, 1 | -1] | null>(init);
  const sorted = useMemo(() => {
    if (!st || !keys[st[0]]) return rows;
    const [k, dir] = st, get = keys[k];
    return rows.slice().sort((a, b) => {
      const x = get(a), y = get(b);
      if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * dir;
    });
  }, [rows, st, keys]);
  const click = (k: string) => setSt(cur => {
    if (cur && cur[0] === k) return [k, (cur[1] === 1 ? -1 : 1)];
    const sample = rows.map(r => keys[k](r)).find(v => v != null);
    return [k, typeof sample === 'number' ? -1 : 1];
  });
  const head = (k: string, label: ReactNode, align: 'left' | 'right' = 'left', style?: CSSProperties) => {
    const on = st?.[0] === k;
    return (
      <th key={k} onClick={() => click(k)} title="Sort" style={{ padding: '6px 8px', textAlign: align, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', color: on ? 'var(--color-accent-700)' : undefined, ...style }}>
        {label}{on ? (st![1] === 1 ? ' ↑' : ' ↓') : ''}
      </th>
    );
  };
  return { rows: sorted, head, sortKey: st?.[0] ?? null, reset: () => setSt(null) };
}

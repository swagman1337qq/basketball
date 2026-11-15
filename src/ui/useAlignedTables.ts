import { useLayoutEffect, type RefObject, type DependencyList } from 'react';

// Fit the full contents first, then share the widest natural column across each table.
// This keeps separate roster/box-score sections aligned without stretching into empty space.
export function useAlignedTables(ref: RefObject<HTMLElement | null>, dependencies: DependencyList) {
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const fit = () => {
      const tables = [...host.querySelectorAll<HTMLTableElement>('table[data-align-columns]')];
      const widths: number[] = [];
      for (const table of tables) {
        table.style.tableLayout = 'auto';
        table.style.width = 'max-content';
        table.querySelectorAll('col').forEach(col => (col.style.width = ''));
        const cells = [...(table.tHead?.rows[0]?.cells || [])];
        cells.forEach(cell => (cell.style.width = ''));
        cells.forEach((cell, i) => (widths[i] = Math.max(widths[i] || 0, Math.ceil(cell.getBoundingClientRect().width))));
      }
      if (!widths.some(Boolean)) return;
      for (const table of tables) {
        table.style.tableLayout = 'fixed';
        table.style.width = widths.reduce((n, w) => n + w, 0) + 'px';
        [...(table.tHead?.rows[0]?.cells || [])].forEach((cell, i) => (cell.style.width = widths[i] + 'px'));
      }
    };
    fit();
    let active = true;
    document.fonts?.ready.then(() => {
      if (active) fit();
    });
    window.addEventListener('resize', fit);
    return () => {
      active = false;
      window.removeEventListener('resize', fit);
    };
  }, dependencies);
}

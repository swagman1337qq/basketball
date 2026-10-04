// Drag-and-drop for the menu tabs (navLayout.ts): drop a tab on another to put it just above that one
// (in that tab's section); drop it on a section title to move it to the end of that section.
import { useState, type CSSProperties, type DragEvent } from 'react';
import type { VM } from '../vm';

export function useNavDnd(vm: VM) {
  const [drag, setDrag] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  const end = () => { setDrag(null); setOver(null); };
  const item = (n: any) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => { e.dataTransfer.setData('text/plain', n.key); e.dataTransfer.effectAllowed = 'move'; setDrag(n.key); },
    onDragEnd: end,
    onDragOver: (e: DragEvent) => { if (!drag) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== n.key) setOver(n.key); },
    onDrop: (e: DragEvent) => { e.preventDefault(); if (drag && drag !== n.key) vm.navEdit.move(drag, n.grp, n.key); end(); },
  });
  const group = (grp: string) => ({
    onDragOver: (e: DragEvent) => { if (!drag) return; e.preventDefault(); if (over !== '@' + grp) setOver('@' + grp); },
    onDrop: (e: DragEvent) => { e.preventDefault(); if (drag) vm.navEdit.move(drag, grp, null); end(); },
  });
  // A line above the tab it would land in front of; the dragged tab fades.
  const mark = (n: any): CSSProperties => ({ ...(over === n.key && drag && drag !== n.key ? { boxShadow: 'inset 0 2px 0 var(--color-accent)' } : {}), ...(drag === n.key ? { opacity: 0.4 } : {}) }); // only what's set, so the tab's own ring stays
  const gmark = (grp: string): CSSProperties => (over === '@' + grp && drag ? { boxShadow: 'inset 0 -2px 0 var(--color-accent)' } : {});
  return { item, group, mark, gmark, dragging: !!drag };
}

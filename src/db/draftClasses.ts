// The draft-class library (God Mode → Draft classes), shared by every league in this browser, like the player cards.
// Ready-made classes come with the game (data/historicalClasses.ts, fetched only when the library opens, so it costs
// nothing at startup); your own, added from a file, are kept in IndexedDB next to the saves (meta row 'draftClasses').
// A league's save holds only the class you load into it, like any draft class.
import { db } from './saves';

export interface ClassRow { id: string; label: string; players: any[]; added: number; builtIn?: boolean }
let own: ClassRow[] | null = null, built: ClassRow[] | null = null, version = 0;
const subs = new Set<() => void>();
const bump = () => { version++; subs.forEach(f => f()); };
const persist = async () => { if (own) await db.meta.put({ key: 'draftClasses', value: own }); };

// Load the library (the ready-made classes and yours).
export async function loadDraftClasses(): Promise<void> {
  if (!built) { const m = await import('../data/historicalClasses'); built = Object.entries(m.HISTORICAL_CLASSES).map(([y, c]) => ({ id: 'preset' + y, label: c.label, players: c.players, added: 0, builtIn: true })); }
  if (!own) { try { own = (await db.meta.get('draftClasses'))?.value ?? []; } catch { own = []; } }
  bump();
}
export const draftClassLib = (): ClassRow[] => [...(built || []), ...(own || [])];
export async function addDraftClass(label: string, players: any[]): Promise<ClassRow> {
  const row: ClassRow = { id: 'c' + Date.now(), label, players, added: Date.now() };
  own = [...(own || []), row]; bump(); try { await persist(); } catch { /* in memory */ }
  return row;
}
export async function deleteDraftClass(id: string) { own = (own || []).filter(r => r.id !== id); bump(); try { await persist(); } catch { /* in memory */ } }
// For React: re-render when the library changes.
export const subscribeDraftClasses = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const draftClassesVersion = () => version;

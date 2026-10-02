// The player-card library (God Mode → Player cards), shared by every league in this browser. A card is
// a template: applying it copies the build onto one player in one league, so creating, editing or
// deleting a card never changes a player anywhere. Each league keeps its own players (and its undo).
// Stored in IndexedDB next to the saves (meta row 'cards'); the ready-made cards seed it once each.
import { db } from './saves';
import { PRESET_CARDS } from '../engine/playerCard';

export interface CardRow { id: string; card: any }
interface Stored { cards: CardRow[]; presets: string[] } // presets: ready-made card ids already offered (a deleted one stays deleted)

const clone = (x: any) => JSON.parse(JSON.stringify(x));
const presetRows = () => PRESET_CARDS.map((x, i) => ({ id: 'preset' + i, card: { ...clone(x.card), label: x.label } }));
let lib: Stored | null = null, version = 0, ready: Promise<void> | null = null;
const subs = new Set<() => void>();
const bump = () => { version++; subs.forEach(f => f()); };
const persist = async () => { if (lib) await db.meta.put({ key: 'cards', value: lib }); };

// Load the library once (and add ready-made cards it hasn't offered yet).
export function loadCards(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    let got: Stored | null = null;
    try { got = (await db.meta.get('cards'))?.value ?? null; } catch { /* no storage: the presets, in memory */ }
    lib = got || { cards: [], presets: [] };
    const fresh = presetRows().filter(r => !lib!.presets.includes(r.id));
    if (fresh.length || !got) { lib = { cards: [...lib.cards, ...fresh.filter(r => !lib!.cards.some(c => c.id === r.id))], presets: [...lib.presets, ...fresh.map(r => r.id)] }; try { await persist(); } catch { /* in memory */ } }
    bump();
  })();
  return ready;
}
// The library now (the ready-made cards until it has loaded).
export function cardLib(): CardRow[] { return lib ? lib.cards : presetRows(); }
// Replace the library (save, delete, duplicate): every league sees it.
export async function setCardLib(cards: CardRow[]) { lib = { cards, presets: lib?.presets ?? presetRows().map(r => r.id) }; bump(); try { await persist(); } catch { /* in memory */ } }
// For React: re-render when the library changes.
export const subscribeCards = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const cardsVersion = () => version;

// A league that kept its own library (before cards were shared): its cards join the shared one. Same
// id and same card: already there. A card the shared library doesn't have joins it; a different card
// under an id the library already uses joins as a copy marked with the league's name. Returns how many joined.
export async function adoptLeagueCards(cards: CardRow[] | undefined, league: string): Promise<number> {
  await loadCards();
  if (!cards?.length) return 0;
  const cur = cardLib(), byId = new Map(cur.map(c => [c.id, JSON.stringify(c.card)])), all = new Set(byId.values()), next = cur.slice();
  let added = 0;
  for (const c of cards) {
    const j = JSON.stringify(c.card);
    if (byId.get(c.id) === j || all.has(j)) continue;
    if (!byId.has(c.id)) next.push(c);
    else next.push({ id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), card: { ...c.card, label: (c.card.label || c.card.name || 'Card') + ' (' + league + ')' } });
    all.add(j); added++;
  }
  if (added) await setCardLib(next);
  return added;
}

import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { db } from '../src/db/saves';
import { PRESET_CARDS } from '../src/engine/playerCard';
import type { CardRow } from '../src/db/cards';

type CardLibrary = typeof import('../src/db/cards');
const originalPresetCount = 33,
  mkgId = 'preset33',
  mkg = JSON.parse(readFileSync(new URL('../public/cards/michael-kidd-gilchrist-2012-13.json', import.meta.url), 'utf8')),
  clone = <T,>(value: T): T => structuredClone(value),
  presetRows: CardRow[] = PRESET_CARDS.map(({ label, card }, i) => ({ id: 'preset' + i, card: { ...clone(card), label } })),
  presetIds = presetRows.map(row => row.id),
  mkgRow = { id: mkgId, card: clone(mkg) };

assert.equal(PRESET_CARDS.length, originalPresetCount + 1, 'MKG appends to the original 33 presets');
assert.deepEqual(PRESET_CARDS[originalPresetCount], { label: mkg.label, card: mkg }, 'The library offers the exact reviewed MKG card');

// Keep both legacy inline players and archived players in storage. Merely opening
// the shared library must never apply a card or rewrite either kind of league.
const player = {
  ...clone(mkg),
  id: 17,
  name: 'My league player',
  tid: 4,
  r: { ...mkg.r, spd: 41 },
  cardName: mkg.name,
  cardPreset: 33,
  contract: { amt: 8, exp: 2031 },
  stats: [{ season: 2029, gp: 5, pts: 73 }],
  hist: [{ season: 2029, text: 'User history' }],
};
await db.saves.put({
  id: 'catalog-league',
  name: 'Existing league',
  createdAt: 1,
  updatedAt: 2,
  summary: 'Keep this league unchanged',
  data: {
    db: { P: { 17: clone(player) }, boxes: {}, cards: [{ id: 'league-custom', card: clone(mkg) }] },
    state: { rosters: { 4: [17] } },
  } as any,
});
await db.players.put({ saveId: 'archived-league', pid: '17', raw: clone(player) });
await db.meta.put({ key: 'unrelated-setting', value: { enabled: true } });
const leagueSnapshot = async () => ({
  saves: await db.saves.toArray(),
  players: await db.players.toArray(),
  boxes: await db.boxes.toArray(),
  index: await db.saveIndex.toArray(),
  otherMeta: (await db.meta.toArray()).filter(row => row.key !== 'cards'),
});
const originalLeagues = await leagueSnapshot();
const unchangedLeagues = async () =>
  assert.deepEqual(
    await leagueSnapshot(),
    originalLeagues,
    'Loading the catalogue leaves all league/player data and other settings unchanged',
  );

let session = 0,
  previous: CardLibrary | undefined;
async function reopenLibrary() {
  db.close();
  await db.open();
  // A new module instance resets cards.ts's in-memory cache, just like reopening
  // the app, while fake-indexeddb retains the database written by the last session.
  const url = new URL('../src/db/cards.ts', import.meta.url);
  url.searchParams.set('catalog-session', String(session++));
  const library: CardLibrary = await import(url.href);
  assert.notEqual(library, previous, 'Each reopen starts with a fresh library module');
  previous = library;
  return library;
}
const storedLibrary = async () => (await db.meta.get('cards'))!.value as { cards: CardRow[]; presets: string[] };
const once = (rows: CardRow[]) => assert.equal(rows.filter(row => row.id === mkgId).length, 1, 'MKG is offered exactly once');

try {
  const fresh = await reopenLibrary();
  assert.deepEqual(fresh.cardLib(), presetRows, 'A fresh library exposes every preset before its storage load');
  await Promise.all([fresh.loadCards(), fresh.loadCards()]);
  assert.deepEqual(fresh.cardLib(), presetRows, 'A fresh library includes the MKG preset');
  once(fresh.cardLib());
  assert.deepEqual(await storedLibrary(), { cards: presetRows, presets: presetIds }, 'All fresh presets are persisted');
  await unchangedLeagues();

  const freshAgain = await reopenLibrary();
  await freshAgain.loadCards();
  assert.deepEqual(freshAgain.cardLib(), presetRows, 'Reopening a fresh library preserves the exact catalogue');
  once(freshAgain.cardLib());
  await unchangedLeagues();

  // Simulate an existing browser that has seen the old catalogue, edited one
  // preset, created its own card and deliberately deleted another old preset.
  const deletedId = 'preset4',
    editedId = 'preset7',
    oldRows = clone(presetRows.slice(0, originalPresetCount)).filter(row => row.id !== deletedId),
    edited = oldRows.find(row => row.id === editedId)!;
  edited.card.r.spd = edited.card.r.spd === 41 ? 42 : 41;
  edited.card.notes = 'My saved preset edit';
  oldRows.push({
    id: 'custom-card',
    card: { ...clone(mkg), name: 'Custom wing', label: 'My own card', notes: 'Keep every custom field', custom: { values: [1, 2] } },
  });
  const originalRows = clone(oldRows),
    oldIds = presetIds.slice(0, originalPresetCount),
    upgradedRows = [...originalRows, mkgRow];
  await db.meta.put({ key: 'cards', value: { cards: oldRows, presets: oldIds } });

  const saved = await reopenLibrary();
  await Promise.all([saved.loadCards(), saved.loadCards()]);
  assert.deepEqual(saved.cardLib(), upgradedRows, 'An existing library only appends MKG and preserves all existing/custom cards');
  assert(!saved.cardLib().some(row => row.id === deletedId), 'An intentionally deleted earlier preset stays deleted');
  once(saved.cardLib());
  assert.deepEqual(await storedLibrary(), { cards: upgradedRows, presets: presetIds }, 'MKG and its offered marker persist together');
  await unchangedLeagues();

  const savedAgain = await reopenLibrary();
  await savedAgain.loadCards();
  assert.deepEqual(savedAgain.cardLib(), upgradedRows, 'A later session preserves the addition and existing edits');
  once(savedAgain.cardLib());
  assert.deepEqual(await storedLibrary(), { cards: upgradedRows, presets: presetIds });
  await unchangedLeagues();

  await savedAgain.setCardLib(savedAgain.cardLib().filter(row => row.id !== mkgId));
  assert.deepEqual(await storedLibrary(), { cards: originalRows, presets: presetIds }, 'Deleting MKG retains its offered marker');
  const afterDeletion = await reopenLibrary();
  await afterDeletion.loadCards();
  assert.deepEqual(afterDeletion.cardLib(), originalRows, 'An intentionally deleted MKG stays deleted after reopening');
  assert(!afterDeletion.cardLib().some(row => row.id === mkgId));
  assert.deepEqual(await storedLibrary(), { cards: originalRows, presets: presetIds });
  await unchangedLeagues();
} finally {
  await db.delete();
}

console.log(
  'Card catalogue passed: fresh/saved MKG visibility, one-time persistence, intentional deletion, preserved edits/custom cards and unchanged leagues.',
);

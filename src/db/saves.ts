import { saveSummary, type SaveSummary } from './saveSummary';
import { rememberRowRevision, type PlayerBatch } from './playerArchive';
import { hydratePlayers, preparePlayers, revisionOf, writePlayers, type PlayerRecord } from './playerRecords';
export type { SaveSummary } from './saveSummary';
import {
  boxSummary,
  boxVersion,
  rememberBoxVersion,
  isBoxReference,
  validBoxReference,
  rememberBoxArchive,
  type BoxBatch,
} from './boxArchive';
// Save files live in the browser's IndexedDB (via Dexie): free, offline, no server.
// League state and immutable box-score records are stored separately; exports remain self-contained.
import Dexie, { type Table } from 'dexie';
import type { SaveData } from '../engine/Game';

export interface SaveRow {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  summary: string;
  data: SaveData;
}

class SaveDB extends Dexie {
  saves!: Table<SaveRow, string>;
  saveIndex!: Table<SaveSummary, string>;
  boxes!: Table<{ saveId: string; bid: string; box: any; version?: string | null }, [string, string]>;
  players!: Table<PlayerRecord, [string, string]>;
  meta!: Table<{ key: string; value: any }, string>; // shared across leagues: the player-card library (cards.ts)
  constructor() {
    super('front-office');
    this.version(1).stores({ saves: 'id, updatedAt' });
    this.version(2).stores({ saves: 'id, updatedAt', meta: 'key' });
    this.version(3).stores({ saves: 'id, updatedAt', meta: 'key', boxes: '[saveId+bid], saveId' });
    this.version(4)
      .stores({ saves: 'id, updatedAt', meta: 'key', boxes: '[saveId+bid], saveId', saveIndex: 'id, updatedAt' })
      .upgrade(async tx => {
        const pending: Promise<unknown>[] = [];
        await tx.table('saves').each(row => {
          pending.push(tx.table('saveIndex').put(saveSummary(row)));
        });
        await Promise.all(pending);
      });
    // No eager rewriting: old leagues remain complete until their next successful save.
    this.version(5).stores({
      saves: 'id, updatedAt',
      meta: 'key',
      boxes: '[saveId+bid], saveId',
      saveIndex: 'id, updatedAt',
      players: '[saveId+pid], saveId',
    });
  }
}

export const db = new SaveDB();

export const newSaveId = () => 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function listSaves() {
  return db.saveIndex.orderBy('updatedAt').reverse().toArray();
}

async function hydrateSave(row: SaveRow): Promise<SaveRow> {
  const input = row.data.db.boxes || {};
  const manifest: string[] = row.data.db.$boxKeys || [];
  const keys = [...new Set([...manifest, ...Object.keys(input)])];
  const boxes: Record<string, any> = { ...input };
  const needed = keys.filter(bid => !input[bid] || isBoxReference(input[bid]));
  for (const bid of Object.keys(input))
    if (isBoxReference(input[bid]) && !validBoxReference(input[bid], row.id, bid))
      throw new Error('Game details belong to another saved league.');
  const stored = await db.boxes.bulkGet(needed.map(bid => [row.id, bid] as [string, string]));
  if (stored.some(x => !x || isBoxReference(x.box)))
    throw new Error('The saved game archive is incomplete. No partial export was created.');
  for (const item of stored) {
    const ref = input[item!.bid];
    if (isBoxReference(ref) && (ref.$detailRef.version ?? null) !== (item!.version ?? null))
      throw new Error('Saved game details changed in another session. Reload the league before exporting.');
    rememberBoxVersion(item!.box, item!.version ?? null);
    boxes[item!.bid] = item!.box;
  }
  const { $boxKeys, $boxHeads, ...rest } = row.data.db;
  rememberBoxArchive(row.id, boxes);
  return { ...row, data: { ...row.data, db: { ...rest, boxes } } };
}
function hasBoxSummaries(row: SaveRow) {
  const keys: string[] | undefined = row.data.db.$boxKeys;
  const boxes = row.data.db.boxes || {};
  return (
    row.data.db.$boxHeads === 1 &&
    !!keys &&
    keys.length === Object.keys(boxes).length &&
    keys.every(bid => validBoxReference(boxes[bid], row.id, bid))
  );
}
async function prepareLazySave(id: string) {
  return db.transaction('rw', db.saves, db.boxes, db.saveIndex, db.players, async () => {
    let row = await db.saves.get(id);
    if (!row || hasBoxSummaries(row)) return row;
    if (!row.data.db.$boxKeys) {
      // The existing inline save is replaced only after the archive and summaries commit together.
      await putSave(await hydratePlayers(row, db.players));
      return db.saves.get(id);
    }
    const keys: string[] = row.data.db.$boxKeys;
    const wanted = new Set(keys);
    const summaries: Record<string, any> = {};
    // One-time conversion of older split saves. Cursor records are discarded after
    // their summary is copied; do not hydrate the whole detailed season into memory.
    await db.boxes
      .where('saveId')
      .equals(id)
      .each(item => {
        if (wanted.has(item.bid)) {
          if (isBoxReference(item.box)) throw new Error('The saved game archive is incomplete.');
          summaries[item.bid] = boxSummary(item.box, id, item.bid, item.version ?? null);
        }
      });
    if (Object.keys(summaries).length !== keys.length) throw new Error('The saved game archive is incomplete.');
    row = { ...row, data: { ...row.data, db: { ...row.data.db, boxes: summaries, $boxHeads: 1 } } };
    await db.saves.put(row);
    return row;
  });
}
export async function getSave(id: string, options: { lazyBoxes?: boolean } = {}) {
  let row = await db.saves.get(id);
  if (!row) return row;
  if (options.lazyBoxes) {
    if (!hasBoxSummaries(row)) {
      try {
        row = await prepareLazySave(id);
      } catch {
        // A failed optimization must not prevent opening an intact older save.
        /* The original archive will be read in the consistent transaction below. */
      }
    }
  } else if (!row.data.db.$boxKeys && Object.keys(row.data.db.boxes || {}).length) {
    try {
      await prepareLazySave(id);
    } catch {
      /* the original inline save stays readable */
    }
  }
  // Full readers/exports keep the save and its archive in one read transaction.
  return db.transaction('r', db.saves, db.boxes, db.players, async () => {
    const current = await db.saves.get(id);
    if (!current) return current;
    let full = await hydratePlayers(current, db.players);
    if (options.lazyBoxes && hasBoxSummaries(full)) {
      const { $boxKeys, $boxHeads, ...rest } = full.data.db;
      full = { ...full, data: { ...full.data, db: rest } };
      rememberBoxArchive(id, rest.boxes || {});
    } else full = await hydrateSave(full);
    rememberRowRevision(full, revisionOf(current));
    return full;
  });
}
export async function savedPlayerRevision(id: string) {
  return revisionOf(await db.saves.get(id));
}
export async function readSavedBox(saveId: string, bid: string) {
  const item = await db.boxes.get([saveId, bid]);
  if (!item || isBoxReference(item.box)) throw new Error('This game’s details could not be loaded. Please try again.');
  rememberBoxVersion(item.box, item.version ?? null);
  return item.box;
}
export async function putSave(row: SaveRow, batch?: BoxBatch, playerBatch?: PlayerBatch) {
  const prepared = preparePlayers(row, playerBatch);
  const boxes = row.data.db.boxes || {};
  const archive = batch ?? {
    keys: Object.keys(boxes),
    records: Object.entries(boxes)
      .filter(([, box]) => !isBoxReference(box))
      .map(([bid, box]) => ({ bid, box, version: boxVersion(box) })),
  };
  for (const [bid, box] of Object.entries(boxes))
    if (isBoxReference(box) && !validBoxReference(box, row.id, bid)) throw new Error('Game details belong to another saved league.');
  if (archive.records.some(item => isBoxReference(item.box))) throw new Error('A game summary cannot replace saved game details.');
  const summaries: Record<string, any> = {};
  const stored = { ...row, data: { ...row.data, db: { ...prepared.db, boxes: summaries, $boxKeys: archive.keys, $boxHeads: 1 } } };
  await db.transaction('rw', db.saves, db.boxes, db.saveIndex, db.players, async () => {
    const previous = await db.saves.get(row.id);
    // A worker may commit and then lose its acknowledgement. Retrying the same
    // immutable job is harmless; a different/newer revision is never overwritten.
    if (playerBatch && revisionOf(previous) === playerBatch.revision) return;
    await writePlayers(db.players, row.id, previous, prepared, playerBatch);
    const expected =
      archive.references ||
      Object.entries(boxes)
        .filter(([, box]) => isBoxReference(box))
        .map(([bid, box]: [string, any]) => ({ bid, version: box.$detailRef.version ?? null }));
    const oldReferences = expected.filter(ref => !validBoxReference(previous?.data.db.boxes?.[ref.bid], row.id, ref.bid));
    for (const ref of expected) {
      const header = previous?.data.db.boxes?.[ref.bid];
      if (validBoxReference(header, row.id, ref.bid) && (header.$detailRef.version ?? null) !== ref.version)
        throw new Error('Saved game details changed in another session. Reload the league before saving.');
    }
    for (let i = 0; i < oldReferences.length; i += 8) {
      const refs = oldReferences.slice(i, i + 8);
      const found = await db.boxes.bulkGet(refs.map(ref => [row.id, ref.bid] as [string, string]));
      for (let j = 0; j < refs.length; j++)
        if (!found[j] || (found[j]!.version ?? null) !== refs[j].version)
          throw new Error('Saved game details changed or are unavailable. Reload the league before saving.');
    }
    if (archive.records.length)
      await db.boxes.bulkPut(
        archive.records.map(x => ({ saveId: row.id, ...x, version: x.version === undefined ? boxVersion(x.box) : x.version })),
      );
    const keep = new Set(archive.keys);
    const old = await db.boxes.where('saveId').equals(row.id).primaryKeys();
    const available = new Set([...old.map(key => key[1]), ...archive.records.map(x => x.bid)]);
    if (archive.keys.some(bid => !available.has(bid))) throw new Error('A full box-score snapshot is required.');
    const removed = old.filter(key => !keep.has(key[1]));
    if (removed.length) await db.boxes.bulkDelete(removed);
    const written = new Map(archive.records.map(item => [item.bid, item]));
    for (const bid of archive.keys) {
      const item = written.get(bid),
        box = item?.box || boxes[bid];
      if (box)
        summaries[bid] = boxSummary(
          box,
          row.id,
          bid,
          item ? (item.version === undefined ? boxVersion(box) : item.version) : boxVersion(box),
        );
    }
    // A worker sends only changed games. Reuse the previous immutable summaries
    // for unchanged games rather than reading their detailed records.
    const prior = Object.keys(summaries).length < archive.keys.length ? previous || (await db.saves.get(row.id)) : undefined;
    for (const bid of archive.keys)
      if (!summaries[bid] && validBoxReference(prior?.data.db.boxes?.[bid], row.id, bid)) summaries[bid] = prior!.data.db.boxes[bid];
    // Compatibility with the first save made from an older v3/v4 archive.
    const missing = archive.keys.filter(bid => !summaries[bid]);
    for (let i = 0; i < missing.length; i += 8) {
      const items = await db.boxes.bulkGet(missing.slice(i, i + 8).map(bid => [row.id, bid] as [string, string]));
      for (const item of items) {
        if (!item || isBoxReference(item.box)) throw new Error('The saved game archive is incomplete.');
        summaries[item.bid] = boxSummary(item.box, row.id, item.bid, item.version ?? null);
      }
    }

    await db.saves.put(stored);
    await db.saveIndex.put(saveSummary(row));
  });
  rememberRowRevision(row, prepared.manifest.revision);
  if (!batch) rememberBoxArchive(row.id, boxes);
}
export async function deleteSave(id: string) {
  await db.transaction('rw', db.saves, db.boxes, db.saveIndex, db.players, async () => {
    await db.players.where('saveId').equals(id).delete();
    await db.boxes.where('saveId').equals(id).delete();
    await db.saves.delete(id);
    await db.saveIndex.delete(id);
  });
}

export function summarize(data: SaveData) {
  const s = data.state,
    me = s.teams[s.me ?? 0] || s.teams[0];
  const PH = {
    regular: 'Regular season',
    playin: 'Play-in',
    playoffs: 'Playoffs',
    lottery: 'Lottery',
    draft: 'Draft',
    fa: 'Free agency',
    preseason: 'Preseason',
  };
  return (
    me.region +
    ' ' +
    me.name +
    ' · ' +
    (s.season - 1) +
    '–' +
    String(s.season).slice(2) +
    ' · ' +
    me.w +
    '–' +
    me.l +
    ' · ' +
    (PH[s.phase] || s.phase)
  );
}

const FILE_KIND = 'front-office-save';

export async function exportSave(row: SaveRow | SaveSummary) {
  if (!('data' in row)) {
    const full = await getSave(row.id);
    if (!full) throw new Error('This saved league is no longer available.');
    row = full;
  }
  // Capture live unsaved games before yielding: a concurrent save may compact
  // the live map, but this export must retain its own complete snapshot.
  const snapshot = { ...row, data: structuredClone(row.data) };
  row = await db.transaction('r', db.boxes, db.players, async () => hydrateSave(await hydratePlayers(snapshot, db.players)));
  const body = JSON.stringify({ kind: FILE_KIND, version: 1, name: row.name, createdAt: row.createdAt, data: row.data });
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download =
    row.name
      .replace(/[^\w\- ]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File): Promise<SaveRow> {
  const json = JSON.parse(await file.text());
  if (json?.kind !== FILE_KIND || !json.data?.db || !json.data?.state) throw new Error('That file is not a Basketball Manager save.');
  if (json.data.db.$playersArchive) throw new Error('This file is missing player records. Export the complete league before importing it.');
  const importedBoxes = json.data.db.boxes || {};
  if (Object.values(importedBoxes).some(isBoxReference) || (json.data.db.$boxKeys || []).some((bid: string) => !importedBoxes[bid]))
    throw new Error('This file is missing game details. Export the complete league again before importing it.');
  const now = Date.now();
  const row: SaveRow = {
    id: newSaveId(),
    name: json.name || 'Imported league',
    createdAt: json.createdAt || now,
    updatedAt: now,
    summary: summarize(json.data),
    data: json.data,
  };
  await putSave(row);
  return row;
}

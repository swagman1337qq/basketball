import { saveSummary, type SaveSummary } from './saveSummary';
export type { SaveSummary } from './saveSummary';
import { rememberBoxArchive, type BoxBatch } from './boxArchive';
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
  boxes!: Table<{ saveId: string; bid: string; box: any }, [string, string]>;
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
  }
}

export const db = new SaveDB();

export const newSaveId = () => 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function listSaves() {
  return db.saveIndex.orderBy('updatedAt').reverse().toArray();
}

async function hydrateSave(row: SaveRow): Promise<SaveRow> {
  const keys: string[] | undefined = row.data.db.$boxKeys;
  if (!keys) return row;
  const stored = await db.boxes.bulkGet(keys.map(bid => [row.id, bid] as [string, string]));
  if (stored.some(x => !x)) throw new Error('The saved box-score archive is incomplete.');
  const boxes = Object.fromEntries(stored.map(x => [x!.bid, x!.box]));
  const { $boxKeys, ...rest } = row.data.db;
  rememberBoxArchive(row.id, boxes);
  return { ...row, data: { ...row.data, db: { ...rest, boxes } } };
}
export async function getSave(id: string) {
  const row = await db.saves.get(id);
  if (!row) return row;
  if (!row.data.db.$boxKeys && Object.keys(row.data.db.boxes || {}).length) {
    // One-time, transactional migration when an old league is opened. No records are removed.
    try {
      await putSave(row);
    } catch {
      /* the original inline save remains intact */
    }
    return row;
  }
  return hydrateSave(row);
}
export async function putSave(row: SaveRow, batch?: BoxBatch) {
  const boxes = row.data.db.boxes || {};
  const archive = batch ?? { keys: Object.keys(boxes), records: Object.entries(boxes).map(([bid, box]) => ({ bid, box })) };
  const stored = { ...row, data: { ...row.data, db: { ...row.data.db, boxes: {}, $boxKeys: archive.keys } } };
  await db.transaction('rw', db.saves, db.boxes, db.saveIndex, async () => {
    if (archive.records.length) await db.boxes.bulkPut(archive.records.map(x => ({ saveId: row.id, ...x })));
    const keep = new Set(archive.keys);
    const old = await db.boxes.where('saveId').equals(row.id).primaryKeys();
    const available = new Set([...old.map(key => key[1]), ...archive.records.map(x => x.bid)]);
    if (archive.keys.some(bid => !available.has(bid))) throw new Error('A full box-score snapshot is required.');
    const removed = old.filter(key => !keep.has(key[1]));
    if (removed.length) await db.boxes.bulkDelete(removed);
    await db.saves.put(stored);
    await db.saveIndex.put(saveSummary(row));
  });
  if (!batch) rememberBoxArchive(row.id, boxes);
}
export async function deleteSave(id: string) {
  await db.transaction('rw', db.saves, db.boxes, db.saveIndex, async () => {
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
  row = await hydrateSave(row);
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

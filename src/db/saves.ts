// Save files live in the browser's IndexedDB (via Dexie): free, offline, no server.
// Each league is one row holding the whole serialized game.
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
  constructor() {
    super('front-office');
    this.version(1).stores({ saves: 'id, updatedAt' });
  }
}

export const db = new SaveDB();

export const newSaveId = () => 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function listSaves() {
  return db.saves.orderBy('updatedAt').reverse().toArray();
}

export async function getSave(id: string) {
  return db.saves.get(id);
}

export async function putSave(row: SaveRow) {
  await db.saves.put(row);
}

export async function deleteSave(id: string) {
  await db.saves.delete(id);
}

export function summarize(data: SaveData) {
  const s = data.state, me = s.teams[0];
  const PH = { regular: 'Regular season', playoffs: 'Playoffs', lottery: 'Lottery', draft: 'Draft', fa: 'Free agency', preseason: 'Preseason' };
  return (s.season - 1) + '–' + String(s.season).slice(2) + ' · ' + me.w + '–' + me.l + ' · ' + (PH[s.phase] || s.phase);
}

const FILE_KIND = 'front-office-save';

export function exportSave(row: SaveRow) {
  const body = JSON.stringify({ kind: FILE_KIND, version: 1, name: row.name, createdAt: row.createdAt, data: row.data });
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = row.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File): Promise<SaveRow> {
  const json = JSON.parse(await file.text());
  if (json?.kind !== FILE_KIND || !json.data?.db || !json.data?.state) throw new Error('That file is not a Basketball Manager save.');
  const now = Date.now();
  const row: SaveRow = { id: newSaveId(), name: json.name || 'Imported league', createdAt: json.createdAt || now, updatedAt: now, summary: summarize(json.data), data: json.data };
  await putSave(row);
  return row;
}

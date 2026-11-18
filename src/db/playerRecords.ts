import { decodeDb, encodeDb, attachSavedPlayers } from '../engine/saveCodec';
import { StaleSaveError, storageRevision, type PlayerBatch, type PlayerManifest } from './playerArchive';
import type { SaveRow } from './saves';
import type { Table } from 'dexie';

export interface PlayerRecord {
  saveId: string;
  pid: string;
  payload?: any;
  raw?: any;
}
export const playerManifest = (row: SaveRow | undefined): PlayerManifest | undefined => row?.data.db.$playersArchive;
export const revisionOf = (row: SaveRow | undefined) => playerManifest(row)?.revision ?? null;
function validManifest(manifest: any): manifest is PlayerManifest {
  return (
    manifest?.version === 1 &&
    typeof manifest.revision === 'string' &&
    typeof manifest.encoded === 'boolean' &&
    Array.isArray(manifest.ratingKeys) &&
    manifest.ratingKeys.every((key: any) => typeof key === 'string') &&
    Array.isArray(manifest.keys) &&
    manifest.keys.every((key: any) => typeof key === 'string') &&
    new Set(manifest.keys).size === manifest.keys.length
  );
}
export function preparePlayers(row: SaveRow, batch?: PlayerBatch) {
  const source = row.data.db;
  if (source.$playersArchive) throw Error('A partial player archive cannot replace a complete saved league.');
  const records = batch?.records ?? Object.entries(decodeDb(source).P || {}).map(([pid, player]) => ({ pid, player }));
  const keys = batch?.keys ?? records.map(item => item.pid),
    ratingKeys = source.$rk || [];
  const wanted = new Set(keys);
  if (wanted.size !== keys.length || keys.some(key => typeof key !== 'string')) throw Error('Invalid player list.');
  const written = new Set<string>();
  for (const item of records) {
    if (!wanted.has(item.pid) || written.has(item.pid)) throw Error('Invalid player snapshot.');
    written.add(item.pid);
  }
  const manifest: PlayerManifest = { version: 1, keys, revision: batch?.revision ?? storageRevision(), encoded: !!source.$c, ratingKeys };
  const { $ret, $gone, ...rest } = source;
  const db = { ...rest, P: {}, $playersArchive: manifest };
  const rows: PlayerRecord[] = records.map(({ pid, player }) =>
    manifest.encoded
      ? { saveId: row.id, pid, payload: encodeDb({ P: { [pid]: player } }, ratingKeys) }
      : { saveId: row.id, pid, raw: player },
  );
  return { manifest, db, rows };
}
export async function writePlayers(
  table: Table<PlayerRecord, [string, string]>,
  saveId: string,
  previous: SaveRow | undefined,
  prepared: ReturnType<typeof preparePlayers>,
  batch?: PlayerBatch,
) {
  if (batch && revisionOf(previous) !== batch.expectedRevision) throw new StaleSaveError();
  const existing = await table.where('saveId').equals(saveId).primaryKeys();
  const available = new Set([...existing.map(key => key[1]), ...prepared.rows.map(item => item.pid)]);
  if (prepared.manifest.keys.some(pid => !available.has(pid))) throw Error('A complete player snapshot is required.');
  if (prepared.rows.length) await table.bulkPut(prepared.rows);
  const wanted = new Set(prepared.manifest.keys),
    removed = existing.filter(key => !wanted.has(key[1]));
  if (removed.length) await table.bulkDelete(removed);
}
export async function hydratePlayers(row: SaveRow, table: Table<PlayerRecord, [string, string]>): Promise<SaveRow> {
  const manifest = playerManifest(row);
  if (!manifest) return row;
  if (!validManifest(manifest)) throw Error('The saved player archive is invalid.');
  const stored = await table.bulkGet(manifest.keys.map(pid => [row.id, pid] as [string, string]));
  if (stored.some(item => !item)) throw Error('The saved player archive is incomplete. No partial league was opened or exported.');
  const entries = stored.map((item, i) => {
    const pid = manifest.keys[i],
      decoded = Object.hasOwn(item!, 'raw') ? { [pid]: item!.raw } : decodeDb(item!.payload)?.P;
    if (item!.saveId !== row.id || item!.pid !== pid || !decoded || !Object.hasOwn(decoded, pid) || Object.keys(decoded).length !== 1)
      throw Error('The saved player archive does not match this league.');
    return [pid, decoded[pid]];
  });
  const { $playersArchive, ...main } = row.data.db;
  const players = Object.fromEntries(entries);
  return {
    ...row,
    data: { ...row.data, db: manifest.encoded ? attachSavedPlayers(main, players, manifest.ratingKeys) : { ...main, P: players } },
  };
}

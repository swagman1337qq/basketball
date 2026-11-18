import type { BoxBatch } from './boxArchive';
import type { PlayerBatch } from './playerArchive';
// Messages shared by the autosave worker and its client. The raw snapshot is cloned by
// postMessage before the game can change it; compression and IndexedDB work stay off the UI thread.
export interface SaveJob {
  id: number;
  meta: { id: string; name: string; createdAt: number; updatedAt: number; summary: string };
  snapshot: { db: any; state: any };
  ratingKeys: string[];
  archive: BoxBatch;
  players?: PlayerBatch;
}
export type SaveResult = { id: number; ok: true } | { id: number; ok: false; error: string; stale?: boolean };

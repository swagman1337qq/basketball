import { planBoxArchive } from './boxArchive';
import type { Game } from '../engine/Game';
import { RATING_KEYS } from '../data/world';
import { putSave, summarize, type SaveRow } from './saves';
import type { SaveJob, SaveResult } from './saveProtocol';

export type SaveMeta = Pick<SaveRow, 'id' | 'name' | 'createdAt'>;
// One writer per open league. No save can overtake an older write, including fallback writes.
export function createSaveWriter() {
  let worker: Worker | undefined;
  let unavailable = typeof Worker === 'undefined';
  let seq = 0;
  let tail: Promise<void> = Promise.resolve();
  const stopWorker = () => {
    worker?.terminate();
    worker = undefined;
    unavailable = true;
  };
  const write = async (game: Game, meta: SaveMeta): Promise<number> => {
    const version = game.saveVersion;
    const header = { id: meta.id, name: meta.name, createdAt: meta.createdAt };
    if (!unavailable) {
      try {
        worker ??= new Worker(new URL('./saveWorker.ts', import.meta.url), { type: 'module' });
        const active = worker;
        const snapshot = game.saveSnapshot();
        const archive = planBoxArchive(meta.id, snapshot.db.boxes || {});
        snapshot.db = { ...snapshot.db, boxes: {} };
        const job: SaveJob = {
          id: ++seq,
          meta: { ...header, updatedAt: Date.now(), summary: summarize(snapshot) },
          snapshot,
          ratingKeys: RATING_KEYS,
          archive: { keys: archive.keys, records: archive.records },
        };
        await new Promise<void>((resolve, reject) => {
          active.onmessage = ({ data: result }: MessageEvent<SaveResult>) => {
            if (result.id !== job.id) return;
            if (result.ok) resolve();
            else reject(new Error(result.error));
          };
          active.onerror = () => reject(new Error('Background save worker unavailable'));
          active.onmessageerror = () => reject(new Error('Background save transfer failed'));
          active.postMessage(job);
        });
        archive.acknowledge();
        return version;
      } catch {
        // Older browsers, startup failures and storage errors get the original save path.
        // Terminate the worker before retrying so it cannot later overwrite a newer save.
        stopWorker();
      }
    }
    const fallbackVersion = game.saveVersion;
    const data = game.toSave();
    await putSave({ ...header, updatedAt: Date.now(), summary: summarize(data), data });
    return fallbackVersion;
  };
  return {
    save(game: Game, meta: SaveMeta): Promise<number> {
      const job = tail.then(() => write(game, meta));
      tail = job.then(
        () => {},
        () => {},
      );
      return job;
    },
    async dispose() {
      await tail;
      worker?.terminate();
      worker = undefined;
    },
  };
}

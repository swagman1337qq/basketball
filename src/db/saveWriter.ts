import { planBoxArchive } from './boxArchive';
import type { Game } from '../engine/Game';
import { RATING_KEYS } from '../data/world';
import { putSave, summarize, savedPlayerRevision, type SaveRow } from './saves';
import { encodeDb, encodeState } from '../engine/saveCodec';
import { yieldToBrowser } from '../engine/cooperative';
import {
  capturePlayers,
  gameSaveRevision,
  setGameSaveRevision,
  SnapshotChanged,
  storageRevision,
  StaleSaveError,
  isStaleSave,
  type PlayerBaseline,
} from './playerArchive';
import type { SaveJob, SaveResult } from './saveProtocol';

export type SaveMeta = Pick<SaveRow, 'id' | 'name' | 'createdAt'>;
// One writer per open league. No save can overtake an older write, including fallback writes.
export function createSaveWriter() {
  let worker: Worker | undefined;
  let unavailable = typeof Worker === 'undefined';
  let seq = 0;
  let tail: Promise<void> = Promise.resolve();
  const baselines = new WeakMap<Game, Map<string, PlayerBaseline>>();
  let urgent = false,
    pendingJobs = 0,
    releaseUrgent: () => void;
  let urgentSignal = new Promise<void>(resolve => {
    releaseUrgent = resolve;
  });
  const expedite = () => {
    if (pendingJobs) {
      urgent = true;
      releaseUrgent();
    }
  };
  const pauseCapture = () => (urgent ? Promise.resolve() : Promise.race([yieldToBrowser(), urgentSignal]));
  const stopWorker = () => {
    worker?.terminate();
    worker = undefined;
    unavailable = true;
  };
  const write = async (game: Game, meta: SaveMeta): Promise<number> => {
    let bySave = baselines.get(game);
    if (!bySave) baselines.set(game, (bySave = new Map()));
    let expectedRevision = gameSaveRevision(game, meta.id);
    if (expectedRevision === undefined) expectedRevision = await savedPlayerRevision(meta.id);
    let captured: Awaited<ReturnType<typeof capturePlayers>>;
    for (;;) {
      while (game.busy) await game.whenSimulationIdle();
      try {
        captured = await capturePlayers(game, bySave.get(meta.id), pauseCapture, urgent ? Infinity : 6);
        if (game.version !== captured.viewVersion || game.busy) continue;
        break;
      } catch (error) {
        if (error instanceof SnapshotChanged) continue;
        throw error;
      }
    }
    const archive = planBoxArchive(meta.id, game.db.boxes || {});
    const job: SaveJob = {
      id: ++seq,
      meta: { id: meta.id, name: meta.name, createdAt: meta.createdAt, updatedAt: Date.now(), summary: summarize(captured.snapshot) },
      snapshot: captured.snapshot,
      ratingKeys: RATING_KEYS,
      archive: { keys: archive.keys, records: archive.records, references: archive.references },
      players: { keys: captured.keys, records: captured.records, expectedRevision, revision: storageRevision() },
    };
    let committed = false;
    if (!unavailable) {
      try {
        worker ??= new Worker(new URL('./saveWorker.ts', import.meta.url), { type: 'module' });
        const active = worker;
        await new Promise<void>((resolve, reject) => {
          active.onmessage = ({ data: result }: MessageEvent<SaveResult>) => {
            if (result.id !== job.id) return;
            if (result.ok) resolve();
            else reject(result.stale ? new StaleSaveError() : new Error(result.error));
          };
          active.onerror = () => reject(new Error('Background save worker unavailable'));
          active.onmessageerror = () => reject(new Error('Background save transfer failed'));
          active.postMessage(job);
        });
        committed = true;
      } catch (error) {
        // Older browsers, startup failures and storage errors get the original save path.
        // Terminate the worker before retrying so it cannot later overwrite a newer save.
        stopWorker();
        if (isStaleSave(error)) throw error;
      }
    }
    if (!committed) {
      // Retry the same immutable player/state snapshot. A lost acknowledgement is
      // idempotent; edits after capture belong to the next save, never this ack.
      const data = { db: encodeDb(job.snapshot.db, job.ratingKeys), state: encodeState(job.snapshot.state) };
      await putSave({ ...job.meta, data }, job.archive, job.players);
    }
    archive.acknowledge(true);
    bySave.set(meta.id, { signatures: captured.signatures });
    setGameSaveRevision(game, meta.id, job.players!.revision);
    return captured.version;
  };
  return {
    save(game: Game, meta: SaveMeta, options?: { urgent?: boolean }): Promise<number> {
      pendingJobs++;
      if (options?.urgent) expedite();
      const job = tail.then(() => write(game, meta));
      const done = () => {
        if (--pendingJobs === 0) {
          urgent = false;
          urgentSignal = new Promise<void>(resolve => {
            releaseUrgent = resolve;
          });
        }
      };
      tail = job.then(done, done);
      return job;
    },
    expedite,
    async dispose() {
      await tail;
      worker?.terminate();
      worker = undefined;
    },
  };
}

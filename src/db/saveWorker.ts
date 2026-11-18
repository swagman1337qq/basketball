import { encodeDb, encodeState } from '../engine/saveCodec';
import { putSave } from './saves';
import type { SaveJob, SaveResult } from './saveProtocol';
import { isStaleSave } from './playerArchive';

const scope = self as unknown as { onmessage: (e: MessageEvent<SaveJob>) => void; postMessage: (r: SaveResult) => void };
scope.onmessage = async ({ data: job }) => {
  try {
    const data = { db: encodeDb(job.snapshot.db, job.ratingKeys), state: encodeState(job.snapshot.state) };
    await putSave({ ...job.meta, data }, job.archive, job.players);
    scope.postMessage({ id: job.id, ok: true });
  } catch (error) {
    scope.postMessage({ id: job.id, ok: false, error: error instanceof Error ? error.message : String(error), stale: isStaleSave(error) });
  }
};

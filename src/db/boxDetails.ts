import type { Game } from '../engine/Game';
import { boxMatchesSummary, isBoxReference, validBoxReference } from './boxArchive';
import { readSavedBox } from './saves';

type Options = { signal?: AbortSignal; isCurrent?: () => boolean };
const aborted = () => new DOMException('Game detail request cancelled.', 'AbortError');
function waitFor<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(aborted());
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(aborted());
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      value => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      error => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}
// Completed game details never enter the live summary map. A tiny cache makes
// back/forward navigation quick without retaining the whole detailed season.
export function createBoxDetailLoader(read = readSavedBox, limit = 3) {
  const states = new WeakMap<
    object,
    {
      cache: Map<string, { source: any; box: any }>;
      pending: Map<string, { source: any; promise: Promise<any> }>;
    }
  >();
  const stateFor = (boxes: object) => {
    let state = states.get(boxes);
    if (!state) states.set(boxes, (state = { cache: new Map(), pending: new Map() }));
    return state;
  };
  return {
    async load(g: Game, saveId: string, bid: string, options: Options = {}) {
      const db = g.db,
        boxes = db.boxes,
        source = boxes?.[bid];
      const valid = () =>
        !options.signal?.aborted && (options.isCurrent?.() ?? true) && g.db === db && g.db.boxes === boxes && boxes?.[bid] === source;
      if (!valid()) throw aborted();
      if (!source) throw new Error('This game is no longer available.');
      if (!isBoxReference(source)) return source; // New/unsaved games are already complete.
      if (!validBoxReference(source, saveId, bid)) throw new Error('These game details belong to another league.');
      const state = stateFor(boxes),
        key = saveId + ':' + bid;
      const hit = state.cache.get(key);
      if (hit && hit.source === source) {
        state.cache.delete(key);
        state.cache.set(key, hit);
        return hit.box;
      }
      let request = state.pending.get(key);
      if (!request || request.source !== source) {
        const promise = read(saveId, bid);
        request = { source, promise };
        state.pending.set(key, request);
        const current = request;
        const cleanup = () => {
          if (state.pending.get(key) === current) state.pending.delete(key);
        };
        void promise.then(cleanup, cleanup);
      }
      const box = await waitFor(request.promise, options.signal);
      if (!valid()) throw aborted();
      if (!boxMatchesSummary(box, source, saveId, bid))
        throw new Error('These game details no longer match the selected game. Please reload the league.');
      state.cache.delete(key);
      state.cache.set(key, { source, box });
      while (state.cache.size > limit) state.cache.delete(state.cache.keys().next().value!);
      return box;
    },
    cacheSize(boxes: object) {
      return states.get(boxes)?.cache.size || 0;
    },
  };
}
export const boxDetailLoader = createBoxDetailLoader();

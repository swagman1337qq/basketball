import type { Game } from '../engine/Game';
import {
  acceptProfileSeason,
  cachedProfileSeason,
  computeProfileSeason,
  profileStatsEpoch,
  type ProfileSeasonData,
} from './profileStatsData';
import { profileStatsSnapshot } from './profileStatsContext';
import type { StatsReply, StatsRequest } from './profileStatsProtocol';

type Result = Record<number, ProfileSeasonData>;
type Options = { signal?: AbortSignal; isCurrent?: () => boolean; onSeason?: (year: number, value: ProfileSeasonData) => void };
type WorkerLike = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;
type Pending = {
  id: number;
  epoch: string;
  db: object;
  pid: number;
  po: boolean;
  ccp: boolean;
  years: Set<number>;
  rows: Result;
  valid: () => boolean;
  options: Options;
  finish: (error?: Error) => void;
};
class WorkerUnavailable extends Error {}
const aborted = () => new DOMException('Statistics request cancelled.', 'AbortError');
const defer = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const makeWorker = (): WorkerLike => {
  if (typeof Worker === 'undefined') throw new WorkerUnavailable('Background statistics unavailable.');
  return new Worker(new URL('./profileStatsWorker.ts', import.meta.url), { type: 'module' });
};

// One worker per open Game. New jobs supersede old jobs; cancellation terminates a
// busy worker instead of letting obsolete work delay the next player or tab.
export function createProfileStatsClient(g: Game, factory: () => WorkerLike = makeWorker) {
  let worker: WorkerLike | undefined;
  let contextEpoch = '';
  let seq = 0;
  let generation = 0;
  let pending: Pending | undefined;
  let unavailable = false;
  let disposed = false;
  const stop = () => {
    worker?.terminate();
    worker = undefined;
    contextEpoch = '';
  };
  const cancel = () => {
    if (pending) {
      stop();
      pending.finish(aborted());
    }
  };
  const startWorker = () => {
    if (worker) return worker;
    try {
      worker = factory();
    } catch {
      throw new WorkerUnavailable('Background statistics unavailable.');
    }
    const active = worker;
    active.onmessage = ({ data: message }: MessageEvent<StatsReply>) => {
      const job = pending;
      if (!job || worker !== active) return;
      if (!message || typeof message !== 'object' || !Number.isInteger(message.id)) {
        stop();
        job.finish(new Error('The statistics response was invalid.'));
        return;
      }
      if (message.id !== job.id) return;
      if (!['season', 'done', 'error'].includes(message.type)) {
        stop();
        job.finish(new Error('The statistics response was invalid.'));
        return;
      }
      if (!job.valid()) {
        cancel();
        return;
      }
      if (message.epoch !== job.epoch || message.pid !== job.pid || message.po !== job.po || message.ccp !== job.ccp) {
        stop();
        job.finish(new Error('The statistics response did not match its request.'));
        return;
      }
      if (message.type === 'error') {
        stop();
        job.finish(new Error(message.error));
        return;
      }
      if (message.type === 'season') {
        if (
          !job.years.has(message.year) ||
          !message.value ||
          typeof message.value !== 'object' ||
          !('advanced' in message.value) ||
          !('pg' in message.value) ||
          !('tot' in message.value)
        ) {
          stop();
          job.finish(new Error('The statistics response was incomplete.'));
          return;
        }
        // Validate before either caching or notifying React, not just before drawing.
        if (!job.valid() || !acceptProfileSeason(g, job.db, job.epoch, job.pid, message.year, job.po, job.ccp, message.value)) {
          cancel();
          return;
        }
        job.rows[message.year] = message.value;
        job.options.onSeason?.(message.year, message.value);
      } else if (message.type === 'done') {
        if ([...job.years].some(year => !job.rows[year])) {
          stop();
          job.finish(new Error('The statistics response was incomplete.'));
          return;
        }
        job.finish();
      }
    };
    const failed = () => {
      if (worker !== active) return;
      const job = pending;
      stop();
      unavailable = true;
      job?.finish(new WorkerUnavailable('Background statistics unavailable.'));
    };
    active.onerror = failed;
    active.onmessageerror = failed;
    return active;
  };
  return {
    async load(pid: number, requestedYears: number[], po: boolean, ccp: boolean, options: Options = {}): Promise<Result> {
      const ticket = ++generation;
      const db = g.db,
        epoch = profileStatsEpoch(g, g.state);
      const valid = () =>
        ticket === generation &&
        !disposed &&
        !options.signal?.aborted &&
        (options.isCurrent?.() ?? true) &&
        g.db === db &&
        profileStatsEpoch(g, g.state) === epoch;
      if (!valid()) throw aborted();
      cancel();
      const rows: Result = {};
      const years = [...new Set(requestedYears)];
      for (const year of years) {
        const hit = cachedProfileSeason(g, g.state, pid, year, po, ccp);
        if (hit) rows[year] = hit;
      }
      const missing = years.filter(year => !rows[year]);
      if (!missing.length) return rows;
      // Allow the traditional table to paint before cloning the compact context.
      await defer();
      if (!valid()) throw aborted();
      if (!unavailable) {
        try {
          return await new Promise<Result>((resolve, reject) => {
            const id = ++seq;
            const signal = options.signal;
            let timer: ReturnType<typeof setTimeout>;
            let unsubscribe = () => {};
            const abort = () => {
              if (pending?.id === id) cancel();
            };
            const finish = (error?: Error) => {
              if (pending?.id !== id) return;
              pending = undefined;
              clearTimeout(timer);
              unsubscribe();
              signal?.removeEventListener('abort', abort);
              if (error) reject(error);
              else if (!valid()) reject(aborted());
              else resolve(rows);
            };
            pending = { id, db, epoch, pid, po, ccp, years: new Set(missing), rows, valid, options, finish };
            unsubscribe = g.subscribe(() => {
              if (!valid()) abort();
            });
            signal?.addEventListener('abort', abort, { once: true });
            timer = setTimeout(() => {
              if (pending?.id === id) {
                stop();
                finish(new Error('Advanced stats took too long. Please try again.'));
              }
            }, 120000);
            try {
              const active = startWorker();
              const request: StatsRequest = { id, epoch, pid, years: missing, po, ccp };
              if (contextEpoch !== epoch) request.context = profileStatsSnapshot(g);
              if (!valid()) {
                cancel();
                return;
              }
              contextEpoch = epoch;
              active.postMessage(request); // Synchronous clone: later game changes cannot alter this input.
            } catch (error) {
              stop();
              finish(error instanceof WorkerUnavailable ? error : new WorkerUnavailable('Background statistics unavailable.'));
            }
          });
        } catch (error) {
          if (!(error instanceof WorkerUnavailable)) throw error;
          unavailable = true;
        }
      }
      // Preserve the existing calculation on browsers without workers. It still
      // yields per season and applies the same cancellation/revision checks.
      for (const year of missing) {
        await defer();
        if (!valid()) throw aborted();
        const value = computeProfileSeason(g, g.state, pid, year, po, ccp);
        if (!valid()) throw aborted();
        options.onSeason?.(year, value);
        rows[year] = value;
      }
      if (!valid()) throw aborted();
      return rows;
    },
    dispose() {
      disposed = true;
      cancel();
      stop();
    },
  };
}
const CLIENTS = new WeakMap<object, ReturnType<typeof createProfileStatsClient>>();
export function loadProfileStats(g: Game, pid: number, years: number[], po: boolean, ccp: boolean, options: Options) {
  let client = CLIENTS.get(g);
  if (!client) CLIENTS.set(g, (client = createProfileStatsClient(g)));
  return client.load(pid, years, po, ccp, options);
}
export function disposeProfileStats(g: Game) {
  CLIENTS.get(g)?.dispose();
  CLIENTS.delete(g);
}

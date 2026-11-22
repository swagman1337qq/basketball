import { copyIdleBrowseDb } from './simulationBrowseIdleCopy';

export type BrowseIdleScheduler = (run: () => void) => (() => void) | undefined;

// No timeout: this work is optional and must wait for actual idle time. Hosts
// without idle callbacks retain normal on-demand preparation.
export const scheduleBrowseIdle: BrowseIdleScheduler = run => {
  if (typeof globalThis.requestIdleCallback !== 'function') return undefined;
  let cancelled = false,
    handle = 0;
  const next = (deadline: IdleDeadline) => {
    if (cancelled) return;
    if (deadline.timeRemaining() < 4) handle = globalThis.requestIdleCallback(next);
    else run();
  };
  handle = globalThis.requestIdleCallback(next);
  return () => {
    cancelled = true;
    globalThis.cancelIdleCallback(handle);
  };
};

export class BrowseCopyWarmup {
  private job?: { source: object; revision: number; cancelled: boolean; wake?: () => void };
  constructor(private schedule: BrowseIdleScheduler = scheduleBrowseIdle) {}
  stop() {
    const job = this.job;
    this.job = undefined;
    if (job) {
      job.cancelled = true;
      job.wake?.();
    }
  }
  start(source: any, revision: number, previous: any, valid: () => boolean, ready: (db: any) => void) {
    if (this.job && this.job.source === source && this.job.revision === revision) return;
    this.stop();
    const job: NonNullable<BrowseCopyWarmup['job']> = { source, revision, cancelled: false };
    this.job = job;
    const stopped = () => job.cancelled || this.job !== job || !valid();
    const pause = () =>
      new Promise<void>(resolve => {
        let cancel: (() => void) | undefined;
        const wake = () => {
          try {
            cancel?.();
          } catch {
            /* A host cancellation failure cannot hold simulation. */
          }
          job.wake = undefined;
          resolve();
        };
        job.wake = wake;
        cancel = this.schedule(() => {
          job.wake = undefined;
          resolve();
        });
        if (!cancel) {
          job.cancelled = true;
          wake();
        }
      });
    void (async () => {
      await pause();
      if (stopped()) return;
      const db = await copyIdleBrowseDb(source, previous, pause, stopped);
      if (db && !stopped()) ready(db);
    })()
      .catch(() => {
        // A speculative copy is never required to run or save the game.
      })
      .finally(() => {
        if (this.job === job) this.job = undefined;
      });
  }
}

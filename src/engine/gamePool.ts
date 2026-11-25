// Background game players (2026-11-25). While you sim several days, each day's games are played by a few web workers
// on other CPU cores (gameWorker.ts) instead of on the page, so the page has time to redraw after every simulated day
// without slowing the sim. The page still prepares each team (Game.simTeam) and records every result with the same
// code as before (Game.simDaySteps), so stats are exactly as complete.
//  • Size: one worker per core but one, at most four, and only with 3+ cores (measured 2026-11-25 on 4 cores: with
//    one worker a sim day took 20% longer than on the page; with two or three, the same or a little less).
//  • A worker that fails is let go and its game is played on the page instead (Game.playPooled's fallback).
//  • localStorage 'simWorkers' = 'off' turns it off (the page plays every game, as before).
import type { GameResult, Norms, SimTeam } from './sim';
import type { GameJob, GameReply } from './gameWorker';

// A played game: its result and, from a real worker, when it finished (epoch ms), to see if it waited for the page.
export interface Played {
  res: GameResult;
  at?: number;
}
export interface GamePool {
  size: number;
  play(home: SimTeam, away: SimTeam, norms: Norms): Promise<Played>;
  dispose(): void;
}

export const POOL_MIN_CORES = 3,
  POOL_MAX = 4;
export function poolSize(cores: number) {
  return cores >= POOL_MIN_CORES ? Math.min(POOL_MAX, cores - 1) : 0;
}

let pool: GamePool | null | undefined;
const off = () => {
  try {
    return globalThis.localStorage?.getItem('simWorkers') === 'off';
  } catch {
    return false;
  }
};
// The shared pool, made on first use (null where workers aren't available or worth it).
export function gamePool(): GamePool | null {
  if (pool !== undefined) return pool;
  const n = typeof Worker === 'undefined' || typeof navigator === 'undefined' || off() ? 0 : poolSize(navigator.hardwareConcurrency || 0);
  pool = n ? createPool(n, () => new Worker(new URL('./gameWorker.ts', import.meta.url), { type: 'module' })) : null;
  return pool;
}
// Start the workers early (when a league opens), so the first sim doesn't wait for them to load.
export function prewarmGamePool() {
  gamePool();
}

interface Slot {
  w: Worker | null;
  busy: number;
}
export function createPool(n: number, make: () => Worker): GamePool {
  const slots: Slot[] = [];
  const waiting = new Map<number, { slot: Slot; resolve: (r: Played) => void; reject: (e: Error) => void }>();
  let seq = 0;
  const fail = (slot: Slot, why: string) => {
    slot.w?.terminate();
    slot.w = null;
    waiting.forEach((x, id) => {
      if (x.slot === slot) {
        waiting.delete(id);
        x.reject(new Error(why));
      }
    });
  };
  for (let i = 0; i < n; i++) {
    const slot: Slot = { w: null, busy: 0 };
    try {
      const w = make();
      slot.w = w;
      w.onmessage = (e: MessageEvent<GameReply>) => {
        const x = waiting.get(e.data.id);
        if (!x) return;
        waiting.delete(e.data.id);
        slot.busy--;
        if ('res' in e.data) x.resolve({ res: e.data.res, at: e.data.at });
        else x.reject(new Error(e.data.error));
      };
      w.onerror = () => fail(slot, 'Game worker failed');
      w.onmessageerror = () => fail(slot, 'Game worker transfer failed');
    } catch {
      slot.w = null;
    }
    slots.push(slot);
  }
  return {
    size: n,
    play(home, away, norms) {
      // The least busy worker that still works.
      const live = slots.filter(s => s.w);
      if (!live.length) return Promise.reject(new Error('No game workers'));
      const slot = live.reduce((a, b) => (b.busy < a.busy ? b : a));
      const id = ++seq;
      return new Promise<Played>((resolve, reject) => {
        waiting.set(id, { slot, resolve, reject });
        slot.busy++;
        try {
          slot.w!.postMessage({ id, home, away, norms } as GameJob);
        } catch (error) {
          waiting.delete(id);
          slot.busy--;
          reject(error as Error);
        }
      });
    },
    dispose() {
      slots.forEach(s => fail(s, 'Game workers stopped'));
    },
  };
}
// Tests: replace the shared pool (null: none).
export function setGamePool(p: GamePool | null | undefined) {
  pool = p;
}

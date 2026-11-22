import { yieldToBrowser } from '../engine/cooperative';

// Compare every enumerable value with the last detached record. Object identity
// alone cannot detect in-place edits. Pair both sides to preserve cycles/aliases;
// unusual objects simply use structuredClone again. Never share a live object.
export function sameBrowseRecord(a: any, b: any): boolean {
  const forward = new WeakMap<object, object>(),
    backward = new WeakMap<object, object>();
  function equal(x: any, y: any): boolean {
    if (Object.is(x, y)) return x === null || typeof x !== 'object';
    if (!x || !y || typeof x !== 'object' || typeof y !== 'object') return false;
    if (forward.has(x) || backward.has(y)) return forward.get(x) === y && backward.get(y) === x;
    const arrays = Array.isArray(x);
    if (arrays !== Array.isArray(y) || (arrays && x.length !== y.length)) return false;
    if (!arrays && (Object.getPrototypeOf(x) !== Object.prototype || Object.getPrototypeOf(y) !== Object.prototype)) return false;
    const xKeys = Object.keys(x),
      yKeys = Object.keys(y);
    if (xKeys.length !== yKeys.length) return false;
    forward.set(x, y);
    backward.set(y, x);
    for (let i = 0; i < xKeys.length; i++) {
      const key = xKeys[i];
      if (key !== yKeys[i] || !equal(x[key], y[key])) return false;
    }
    return true;
  }
  return equal(a, b);
}

// Completed box bodies are append-only during regular-season simulation. Own the
// index and reuse those immutable bodies. Other records are reused only after a
// complete content comparison, never after checking just their id/game count.
export async function copyBrowseDb(db: any, previous?: any, pause = yieldToBrowser, stopped = () => false): Promise<any> {
  if (!previous) return firstBrowseCopy(db, pause, stopped);
  const result: any = {};
  let started = performance.now();
  for (const [key, value] of Object.entries(db)) {
    if (stopped()) return null;
    if (key === 'boxes') result[key] = { ...(value as any) };
    else if (key === 'P' || key === 'rapm') {
      const entries = Object.entries(value as any),
        out: any = (result[key] = {});
      for (let i = 0; i < entries.length; i += 12) {
        if (stopped()) return null;
        {
          const changed: [string, any][] = [];
          for (const [id, record] of entries.slice(i, i + 12)) {
            const old = previous[key]?.[id];
            if (old && sameBrowseRecord(record, old)) out[id] = old;
            else changed.push([id, record]);
          }
          if (changed.length) Object.assign(out, structuredClone(Object.fromEntries(changed)));
        }
        if (performance.now() - started >= 8) {
          await pause();
          started = performance.now();
        }
      }
    } else result[key] = previous && sameBrowseRecord(value, previous[key]) ? previous[key] : structuredClone(value);
    if (performance.now() - started >= 8) {
      await pause();
      started = performance.now();
    }
  }
  return stopped() ? null : result;
}

// Keep the first-copy path identical to the original preparation loop. It has no
// previous data to compare and must not pay for incremental bookkeeping.
async function firstBrowseCopy(db: any, pause: () => Promise<void>, stopped: () => boolean): Promise<any> {
  const result: any = {};
  let started = performance.now();
  for (const [key, value] of Object.entries(db)) {
    if (stopped()) return null;
    if (key === 'boxes') result[key] = { ...(value as any) };
    else if (key === 'P' || key === 'rapm') {
      const entries = Object.entries(value as any),
        out: any = (result[key] = {});
      for (let i = 0; i < entries.length; i += 12) {
        if (stopped()) return null;
        Object.assign(out, structuredClone(Object.fromEntries(entries.slice(i, i + 12))));
        if (performance.now() - started >= 8) {
          await pause();
          started = performance.now();
        }
      }
    } else result[key] = structuredClone(value);
    if (performance.now() - started >= 8) {
      await pause();
      started = performance.now();
    }
  }
  return stopped() ? null : result;
}

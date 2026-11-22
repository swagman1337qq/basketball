import { sameBrowseRecord } from './simulationBrowseCopy';

// Idle preparation must also split large metadata fields, not just player lists.
// A plain-data graph walk preserves aliases, cycles, key order and sparse arrays.
// Exotic values skip this optional warmup and retain native on-demand copying.
async function copyPlain(value: any, pause: () => Promise<void>, stopped: () => boolean) {
  const seen = new WeakMap<object, any>();
  const frames: { from: any; to: any; keys: string[]; at: number }[] = [];
  const enter = (item: any): any => {
    if (item === null || typeof item !== 'object') {
      if (typeof item === 'function' || typeof item === 'symbol') throw Error('Unsupported idle-copy value');
      return item;
    }
    if (seen.has(item)) return seen.get(item);
    const array = Array.isArray(item),
      prototype = Object.getPrototypeOf(item);
    if (prototype !== (array ? Array.prototype : Object.prototype) && prototype !== null) throw Error('Unsupported idle-copy object');
    const to = array ? new Array(item.length) : {};
    seen.set(item, to);
    frames.push({ from: item, to, keys: Object.keys(item), at: 0 });
    return to;
  };
  const result = enter(value);
  let started = performance.now(),
    visits = 0;
  while (frames.length) {
    if (stopped()) return null;
    const frame = frames[frames.length - 1];
    if (frame.at >= frame.keys.length) {
      frames.pop();
      continue;
    }
    const key = frame.keys[frame.at++],
      descriptor = Object.getOwnPropertyDescriptor(frame.from, key)!;
    if (!('value' in descriptor)) throw Error('Unsupported idle-copy accessor');
    const next = enter(descriptor.value);
    if (key === '__proto__') Object.defineProperty(frame.to, key, { value: next, writable: true, enumerable: true, configurable: true });
    else frame.to[key] = next;
    if (++visits % 32 === 0 && performance.now() - started >= 3) {
      await pause();
      if (stopped()) return null;
      started = performance.now();
    }
  }
  return result;
}

export async function copyIdleBrowseDb(db: any, previous: any, pause: () => Promise<void>, stopped: () => boolean): Promise<any> {
  const result: any = {};
  let started = performance.now();
  for (const [key, value] of Object.entries(db)) {
    if (stopped()) return null;
    if (key === 'boxes') result[key] = { ...(value as any) };
    else if (key === 'P') {
      const entries = Object.entries(value as any),
        out: any = (result[key] = {});
      for (let i = 0; i < entries.length; i += 12) {
        if (stopped()) return null;
        const changed: [string, any][] = [];
        for (const [id, record] of entries.slice(i, i + 12)) {
          const old = previous?.P?.[id];
          if (old && sameBrowseRecord(record, old)) out[id] = old;
          else changed.push([id, record]);
        }
        if (changed.length) Object.assign(out, structuredClone(Object.fromEntries(changed)));
        if (performance.now() - started >= 3) {
          await pause();
          started = performance.now();
        }
      }
    } else {
      result[key] = await copyPlain(value, pause, stopped);
      if (stopped()) return null;
    }
    if (performance.now() - started >= 3) {
      await pause();
      started = performance.now();
    }
  }
  return stopped() ? null : result;
}

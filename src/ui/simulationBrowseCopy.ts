// Deep equality for cached records (profileHistoryCache.ts). Compare every enumerable value with the last record. Object identity
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

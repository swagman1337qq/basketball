// mulberry32: small, fast, seedable PRNG. The world is generated from a seed so
// a new league is reproducible; the running state is saved with the league.
export function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same generator, but the state lives on a holder object so it can be persisted.
export function nextRandom(holder: { rs: number }) {
  const s = (holder.rs = (holder.rs + 0x6D2B79F5) | 0);
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Trade-builder exclusions are hard constraints, independent of roster filters and selections.
export const playerExcluded = (s: any, id: number): boolean => (s.tExcludeP || []).includes(id);
const pickKey = (tid: number, id: string) => tid + '|' + id;
export const pickExcluded = (s: any, tid: number, id: string): boolean => (s.tExcludeK || []).includes(pickKey(tid, id));

export function excludesTrade(s: any, tid: number, mine: number[], theirs: number[], kMine: string[], kTheirs: string[]) {
  return (
    mine.some(id => playerExcluded(s, id)) ||
    theirs.some(id => playerExcluded(s, id)) ||
    kMine.some(id => pickExcluded(s, s.me, id)) ||
    kTheirs.some(id => pickExcluded(s, tid, id))
  );
}

export function excludePlayers(s: any, ids: number[], exclude: boolean) {
  const changed = new Set(ids),
    previous: number[] = s.tExcludeP || [];
  return {
    tExcludeP: exclude ? [...new Set([...previous, ...ids])] : previous.filter(id => !changed.has(id)),
    tMine: exclude ? s.tMine.filter(id => !changed.has(id)) : s.tMine,
    tTheirs: exclude ? s.tTheirs.filter(id => !changed.has(id)) : s.tTheirs,
    offers: null,
    tMsg: null,
  };
}

export function excludePicks(s: any, tid: number, ids: string[], exclude: boolean) {
  const keys = ids.map(id => pickKey(tid, id)),
    changed = new Set(keys),
    previous: string[] = s.tExcludeK || [];
  return {
    tExcludeK: exclude ? [...new Set([...previous, ...keys])] : previous.filter(key => !changed.has(key)),
    ...(tid === s.me
      ? { tkMine: exclude ? s.tkMine.filter(id => !changed.has(pickKey(tid, id))) : s.tkMine }
      : tid === s.tTid
        ? { tkTheirs: exclude ? s.tkTheirs.filter(id => !changed.has(pickKey(tid, id))) : s.tkTheirs }
        : {}),
    offers: null,
    tMsg: null,
  };
}

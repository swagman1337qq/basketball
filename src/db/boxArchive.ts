// Box scores are immutable after keepBox creates them. Persist each record once and
// send only appended/replaced records on later saves; the snapshot manifest stays atomic.
export interface BoxBatch {
  keys: string[];
  records: { bid: string; box: any }[];
}
const STORED = new WeakMap<object, { saveId: string; refs: Map<string, any> }>();
export function rememberBoxArchive(saveId: string, boxes: Record<string, any>) {
  STORED.set(boxes, { saveId, refs: new Map(Object.entries(boxes)) });
}
export function planBoxArchive(saveId: string, boxes: Record<string, any>) {
  const old = STORED.get(boxes);
  const entries = Object.entries(boxes);
  const refs = new Map(entries);
  return {
    keys: entries.map(([bid]) => bid),
    records: entries.filter(([bid, box]) => old?.saveId !== saveId || old.refs.get(bid) !== box).map(([bid, box]) => ({ bid, box })),
    acknowledge: () => STORED.set(boxes, { saveId, refs }),
  };
}

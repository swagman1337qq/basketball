const VERSIONS = new WeakMap<object, string | null>();
export function rememberBoxVersion(box: object, version: string | null) {
  VERSIONS.set(box, version);
}
export function boxVersion(box: any): string | null {
  if (isBoxReference(box)) return box.$detailRef.version ?? null;
  if (!VERSIONS.has(box)) {
    // Storage identifiers must never consume the simulation's Math.random stream.
    const bytes = new Uint32Array(4);
    globalThis.crypto.getRandomValues(bytes);
    VERSIONS.set(box, Array.from(bytes, n => n.toString(16).padStart(8, '0')).join(''));
  }
  return VERSIONS.get(box)!;
}
// Only these internal references may omit saved game details. They are never exported.
export const isBoxReference = (box: any): boolean => !!box && Object.prototype.hasOwnProperty.call(box, '$detailRef');
export function boxSummary(
  box: any,
  saveId: string,
  bid: string,
  version: string | null = isBoxReference(box) ? (box.$detailRef.version ?? null) : boxVersion(box),
) {
  const { details, $detailRef, ...summary } = box;
  return { ...summary, $detailRef: { saveId, bid, version } };
}
export function validBoxReference(box: any, saveId: string, bid: string) {
  return (
    isBoxReference(box) &&
    !!box.$detailRef &&
    typeof box.$detailRef === 'object' &&
    box.$detailRef.saveId === saveId &&
    box.$detailRef.bid === bid &&
    (box.$detailRef.version == null || typeof box.$detailRef.version === 'string') &&
    !('details' in box)
  );
}
export function boxMatchesSummary(box: any, summary: any, saveId: string, bid: string) {
  return (
    !!box &&
    !isBoxReference(box) &&
    validBoxReference(summary, saveId, bid) &&
    JSON.stringify(boxSummary(box, saveId, bid)) === JSON.stringify(summary)
  );
}
// Box scores are immutable after keepBox creates them. Persist each record once and
// send only appended/replaced records on later saves; the snapshot manifest stays atomic.
export interface BoxBatch {
  keys: string[];
  records: { bid: string; box: any; version?: string | null }[];
  references?: { bid: string; version: string | null }[];
}
const STORED = new WeakMap<object, { saveId: string; refs: Map<string, any> }>();
export function rememberBoxArchive(saveId: string, boxes: Record<string, any>) {
  STORED.set(boxes, { saveId, refs: new Map(Object.entries(boxes)) });
}
export function planBoxArchive(saveId: string, boxes: Record<string, any>) {
  const old = STORED.get(boxes);
  const entries = Object.entries(boxes);
  for (const [bid, box] of entries)
    if (isBoxReference(box) && !validBoxReference(box, saveId, bid)) throw new Error('Game details belong to another saved league.');
  const refs = new Map(entries);
  const records = entries
    .filter(([bid, box]) => !isBoxReference(box) && (old?.saveId !== saveId || old.refs.get(bid) !== box))
    .map(([bid, box]) => ({ bid, box, version: boxVersion(box) }));
  const changed = new Set(records.map(item => item.bid));
  return {
    keys: entries.map(([bid]) => bid),
    records,
    references: entries.filter(([bid]) => !changed.has(bid)).map(([bid, box]) => ({ bid, version: boxVersion(box) })),
    acknowledge: (compact = false) => {
      // Evict only exact objects included in the committed snapshot. Games appended or
      // replaced while saving stay complete in memory until their own successful save.
      if (compact)
        for (const [bid, box] of entries) {
          if (boxes[bid] !== box || isBoxReference(box)) continue;
          const summary = boxSummary(box, saveId, bid);
          boxes[bid] = summary;
          refs.set(bid, summary);
        }
      STORED.set(boxes, { saveId, refs });
    },
  };
}

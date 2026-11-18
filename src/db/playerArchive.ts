import { yieldToBrowser } from '../engine/cooperative';
import type { Game } from '../engine/Game';

const TAG = '$exactPlayerSignature';
// Exact content comparisons, not probabilistic hashes or object identity. Special
// values cannot collide with user data: a reserved tag/exotic object uses a full
// record every time instead. JSON save imports never create the exotic cases.
export function playerSignature(value: any): string | undefined {
  try {
    const seen = new WeakMap<object, number>();
    let objectId = 0;
    return JSON.stringify(value, function (key, item) {
      const original = this?.[key];
      if (original && typeof original === 'object' && original !== item) throw Error('Custom serialization');
      if (item === undefined) return { [TAG]: Array.isArray(this) && !(key in this) ? 'hole' : 'undefined' };
      if (typeof item === 'number' && (!Number.isFinite(item) || Object.is(item, -0)))
        return { [TAG]: Object.is(item, -0) ? '-0' : String(item) };
      if (typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') throw Error('Unsupported value');
      if (item && typeof item === 'object') {
        if (seen.has(item)) return { [TAG]: 'reference', id: seen.get(item) };
        seen.set(item, objectId++);
        if (Object.hasOwn(item, TAG)) throw Error('Reserved key');
        if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype) throw Error('Custom object');
        const keys = Reflect.ownKeys(item);
        if (keys.some(k => typeof k === 'symbol')) throw Error('Symbol key');
        if (Array.isArray(item) && keys.some(k => k !== 'length' && (!/^(0|[1-9]\d*)$/.test(String(k)) || +String(k) >= item.length)))
          throw Error('Custom array property');
        if (
          keys.some(k => {
            const d = Object.getOwnPropertyDescriptor(item, k)!;
            return !!d.get || !!d.set;
          })
        )
          throw Error('Accessor');
      }
      return item;
    });
  } catch {
    return undefined; // Conservative: always copy/write this player.
  }
}

export interface PlayerBatch {
  keys: string[];
  records: { pid: string; player: any }[];
  expectedRevision: string | null;
  revision: string;
}
export interface PlayerManifest {
  version: 1;
  keys: string[];
  revision: string;
  encoded: boolean;
  ratingKeys: string[];
}
export class StaleSaveError extends Error {
  constructor() {
    super('This league was saved in another session. Reload the league before saving again.');
    this.name = 'StaleSaveError';
  }
}
export const isStaleSave = (error: any) => error?.name === 'StaleSaveError';
export function storageRevision() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, '0')).join('');
}
const SOURCES = new WeakMap<object, Map<string, string | null>>();
const ROW_REVISIONS = new WeakMap<object, string | null>();
export function rememberRowRevision(row: object, revision: string | null) {
  ROW_REVISIONS.set(row, revision);
}
export function bindGameSave(game: Game, row: { id: string }) {
  if (!ROW_REVISIONS.has(row)) throw Error('The saved league source is unavailable.');
  setGameSaveRevision(game, row.id, ROW_REVISIONS.get(row)!);
}
export function setGameSaveRevision(game: object, id: string, revision: string | null) {
  let source = SOURCES.get(game);
  if (!source) SOURCES.set(game, (source = new Map()));
  source.set(id, revision);
}
export function gameSaveRevision(game: object, id: string) {
  return SOURCES.get(game)?.get(id);
}

export class SnapshotChanged extends Error {}
export interface PlayerBaseline {
  signatures: Map<string, string | undefined>;
}
export async function capturePlayers(game: Game, baseline?: PlayerBaseline, pause = yieldToBrowser, budgetMS = 6) {
  const version = game.version,
    data = game.saveSnapshot(),
    sourceDb = game.db,
    players = sourceDb.P,
    keys = Object.keys(players);
  const references = new Map(keys.map(pid => [pid, players[pid]]));
  const current = () => game.version === version && game.db === sourceDb && game.db.P === players && !game.busy && !game.dayInProgress;
  const check = () => {
    if (!current()) throw new SnapshotChanged();
  };
  check();
  const signatures = new Map<string, string | undefined>(),
    records: PlayerBatch['records'] = [];
  let started = performance.now(),
    maxSliceMS = 0;
  for (const pid of keys) {
    const player = players[pid],
      signature = playerSignature(player);
    signatures.set(pid, signature);
    if (signature === undefined || !baseline?.signatures.has(pid) || baseline.signatures.get(pid) !== signature)
      records.push({ pid, player: structuredClone(player) });
    if (performance.now() - started >= budgetMS) {
      maxSliceMS = Math.max(maxSliceMS, performance.now() - started);
      await pause();
      check();
      started = performance.now();
    }
  }
  check();
  if (Object.keys(players).length !== keys.length || keys.some(pid => !Object.hasOwn(players, pid) || players[pid] !== references.get(pid)))
    throw new SnapshotChanged();
  // No event can interleave this final metadata clone and validation. Player
  // copies above belong to the same observed revision; no live pointers leave it.
  const snapshot = structuredClone({ db: { ...data.db, P: {}, boxes: {} }, state: data.state });
  check();
  maxSliceMS = Math.max(maxSliceMS, performance.now() - started);
  return { snapshot, records, keys, signatures, version: game.saveVersion, viewVersion: version, maxSliceMS };
}

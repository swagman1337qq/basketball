import type { Game } from '../engine/Game';
import { ccpAdvanced, seasonAdvanced } from '../engine/advanced';
import { seasonLeaders } from '../engine/leaders';

export interface ProfileSeasonData {
  advanced: any;
  pg: Record<string, number> | null;
  tot: Record<string, number> | null;
}
// Store only this player's display values, not a full league result per season.
// Navigation leaves saveVersion alone; games, edits and other data changes invalidate the cache.
const CACHE = new WeakMap<object, { epoch: string; rows: Map<string, ProfileSeasonData> }>();
export const profileStatsEpoch = (g: Game, s: any) => [g.saveVersion, g.Y, s.day, s.gv || 0].join(':');
const keyOf = (pid: number, y: number, po: boolean, ccp: boolean) => [pid, y, +po, +ccp].join(':');
function rows(g: Game, s: any) {
  const epoch = profileStatsEpoch(g, s);
  let c = CACHE.get(g.db);
  if (!c || c.epoch !== epoch) CACHE.set(g.db, (c = { epoch, rows: new Map() }));
  return c.rows;
}
export function cachedProfileSeason(g: Game, s: any, pid: number, y: number, po: boolean, ccp: boolean) {
  return rows(g, s).get(keyOf(pid, y, po, ccp));
}
export function computeProfileSeason(g: Game, s: any, pid: number, y: number, po: boolean, ccp: boolean): ProfileSeasonData {
  const cache = rows(g, s),
    key = keyOf(pid, y, po, ccp),
    hit = cache.get(key);
  if (hit) return hit;
  const value = {
    advanced: (ccp ? ccpAdvanced(g, s, y, po) : seasonAdvanced(g, s, y, po)).byPid[pid],
    pg: !ccp && !po ? seasonLeaders(g, s, y, 'pg') : null,
    tot: !ccp && !po ? seasonLeaders(g, s, y, 'tot') : null,
  };
  if (cache.size >= 512) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
}

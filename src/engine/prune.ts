// Keeping saves small: retired players don't need the working data of an active career.
// Every retired player drops his monthly development feed, hidden rating decimals and recent
// game log; one who never played an NBA game also drops his rating snapshots and development-
// league stat lines. Names, ratings, bio, transactions and NBA career stats stay.
import type { Game } from './Game';

export function slimRetired(g: Game) {
  let n = 0;
  (Object.values(g.db.P) as any[]).forEach(p => {
    if (!p.retired || p.slim) return;
    ['feed', 'rx', 'ox', 'glx', 'last5', 'dy', 'dyS', 'padding'].forEach(k => delete p[k]);
    if (!(p.stats || []).length) { delete p.rh; delete p.ccpS; }
    p.slim = 1; n++;
  });
  return n;
}

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

// Retired players who never played a game in the league (CCP-only players, undrafted prospects,
// overseas lifers) are removed. A name-only record stays so old draft results, mock drafts, news
// and transactions still read correctly; they're hidden from every list, search and profile.
export function removeUnplayed(g: Game, s: any) {
  const P = g.db.P, gone = new Set<number>();
  (Object.values(P) as any[]).forEach(p => {
    if (!p.retired || p.gone || (p.stats || []).length) return;
    P[p.id] = { id: p.id, name: p.name, native: p.native, pos: p.pos, grp: p.grp, age: p.age, ovr: p.ovr, pot: p.pot, rep: p.rep, retired: p.retired, gone: 1, stats: [] };
    gone.add(p.id);
  });
  if (!gone.size) return 0;
  const keep = (ids: any) => (Array.isArray(ids) ? ids.filter((id: number) => !gone.has(id)) : ids);
  const dropKeys = (o: any) => { if (!o) return o; const x = { ...o }; gone.forEach(id => delete x[id]); return x; };
  const clean = (c: any) => { if (!c) return; c.scoutList = keep(c.scoutList); c.scoutFocus = keep(c.scoutFocus); c.intel = dropKeys(c.intel); c.scoutAssign = dropKeys(c.scoutAssign); c.coachAuto = dropKeys(c.coachAuto); };
  s.fa = keep(s.fa); s.overseas = keep(s.overseas); clean(s); Object.values(s.clubs || {}).forEach(clean);
  return gone.size;
}

// Keeping saves small: retired players don't need the working data of an active career.
// Every retired player drops his monthly development feed, hidden rating decimals, recent game log
// and everything that only drives development (skill ceilings, plan, last summer's tendencies); his
// ratings history keeps one snapshot a season (opening night, whole numbers), which is all his
// year-by-year table needs. One who never played an NBA game also drops his rating snapshots and
// development-league stat lines. Names, ratings, bio, transactions and NBA career stats stay.
import type { Game } from './Game';

const DEV_ONLY = ['feed', 'rx', 'ox', 'glx', 'last5', 'dy', 'dyS', 'padding', 'ceil', 'tenPrev', 'ph', 'dv0', 'dx', 'dxDone', 'devK', 'dyT', 'minorCount', 'protect', 'minMin', 'moodAdj', 'hot', 'fat', 'rot', 'dev', 'gem'];
const SLIM = 2;
export function slimRetired(g: Game) {
  let n = 0;
  (Object.values(g.db.P) as any[]).forEach(p => {
    if (!p.retired || (p.slim || 0) >= SLIM) return;
    DEV_ONLY.forEach(k => delete p[k]);
    (p.stats || []).forEach((r: any) => { delete r.h; delete r.a; });
    if (!(p.stats || []).length) { delete p.rh; delete p.ccpS; }
    else if (p.rh) Object.values(p.rh).forEach((h: any) => { delete h.e; if (h.o) h.o = { ovr: Math.round(h.o.ovr * 10) / 10, ovrI: h.o.ovrI, pot: h.o.pot, r: Object.fromEntries(Object.entries(h.o.r || {}).map(([k, v]: any) => [k, Math.round(v)])) }; });
    p.slim = SLIM; n++;
  });
  return n;
}

// Home and away splits are only shown for the current season: older seasons' stat lines drop them
// (about half of every stat line). Runs once a season (db.splitY).
export function dropOldSplits(g: Game) {
  const Y = g.Y; if ((g.db.splitY ?? 0) >= Y) return;
  (Object.values(g.db.P) as any[]).forEach(p => (p.stats || []).forEach((r: any) => { if (r.season < Y && (r.h || r.a)) { delete r.h; delete r.a; } }));
  g.db.splitY = Y;
}

// Retired players who never played a game in the league (CCP-only players, undrafted prospects,
// overseas lifers) are removed. A name-only record stays so old draft results, mock drafts, news
// and transactions still read correctly; they're hidden from every list, search and profile.
export function removeUnplayed(g: Game, s: any) {
  const P = g.db.P, gone = new Set<number>();
  (Object.values(P) as any[]).forEach(p => {
    if (!p.retired || p.gone || (p.stats || []).length) return;
    if (p.legacy || p.retired.legacy || (p.family || []).length) return; // fathers and brothers stay whole: their families' pages show them
    P[p.id] = { id: p.id, name: p.name, native: p.native, pos: p.pos, grp: p.grp, age: p.age, ovr: p.ovr, pot: p.pot, rep: p.rep, her: p.her, heritage: p.heritage, race: p.race, retired: p.retired, gone: 1, stats: [] };
    gone.add(p.id);
  });
  if (!gone.size) return 0;
  const keep = (ids: any) => (Array.isArray(ids) ? ids.filter((id: number) => !gone.has(id)) : ids);
  const dropKeys = (o: any) => { if (!o) return o; const x = { ...o }; gone.forEach(id => delete x[id]); return x; };
  const clean = (c: any) => { if (!c) return; c.scoutList = keep(c.scoutList); c.scoutFocus = keep(c.scoutFocus); c.intel = dropKeys(c.intel); c.scoutAssign = dropKeys(c.scoutAssign); c.briefPicks = dropKeys(c.briefPicks); c.coachAuto = dropKeys(c.coachAuto); };
  s.fa = keep(s.fa); s.overseas = keep(s.overseas); clean(s); Object.values(s.clubs || {}).forEach(clean);
  return gone.size;
}

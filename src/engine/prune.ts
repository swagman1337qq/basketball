// Keeping saves small: retired players don't need the working data of an active career.
// Every retired player drops his monthly development feed, hidden rating decimals, recent game log
// and everything that only drives development (skill ceilings, plan, last summer's tendencies,
// tendency quirks, scouting noise). What's left is compacted (2026-10-22, SLIM 3):
// - stat lines keep the box score and the on/off counts (past seasons' advanced stats) but lose the
//   shot-zone and shot-type splits; minutes and expected points are rounded;
// - injury history keeps the injuries that cost 10+ games (and every major one); the career totals
//   (injuries, games missed, longest) are kept in p.injSum first, so his History tab still adds up;
// - ratings history keeps each season's opening-night overall and potential plus that year's biggest
//   rating moves (h.mv, what the year-by-year table shows), not every rating.
// One who never played an NBA game also drops his rating snapshots and development-league stat
// lines. Names, ratings, bio, transactions and NBA career stats stay.
import type { Game } from './Game';

const DEV_ONLY = ['feed', 'rx', 'ox', 'glx', 'last5', 'dy', 'dyS', 'padding', 'ceil', 'tenPrev', 'ph', 'dv0', 'dx', 'dxDone', 'devK', 'dyT', 'minorCount', 'protect', 'minMin', 'moodAdj', 'hot', 'fat', 'rot', 'dev', 'gem', 'tenQ', 'nz', 'ix', 'pth', 'ovrF', 'signed'];
// Shot-zone and shot-type splits on a stat line (sim.ts): the live season's shooting chart and playing style.
export const ZONE_KEYS = ['rm', 'ra', 'mm', 'ma', 'cm', 'ca', 'bm', 'ba', 'km', 'ka', 'qm', 'qa', 'um', 'ua', 'sm', 'sa', 'dm', 'da'];
const SLIM = 3;
const r1 = (x: number) => Math.round(x * 10) / 10;
// A finished season's stat line: minutes to a tenth, expected points whole (they carry 13 decimals).
export function roundRow(r: any) { if (typeof r.min === 'number') r.min = r1(r.min); ['xF', 'xA', 'xP'].forEach(k => { if (typeof r[k] === 'number') r[k] = Math.round(r[k]); }); }
// An injury worth keeping in a retired player's history.
const bigInj = (x: any) => !!x.major || (!x.dtd && (x.missed ?? x.games ?? 0) >= 10);
// The year-by-year table's biggest moves for a season: opening night to the next opening night.
function movesOf(o: any, next: any): [string, number][] {
  if (!o?.r || !next?.r) return [];
  const m = Object.keys(o.r).map(k => [k, r1((next.r[k] ?? o.r[k]) - o.r[k])] as [string, number]).filter(([, d]) => Math.abs(d) >= 0.05).sort((a, b) => b[1] - a[1]);
  return [...m.filter(x => x[1] > 0).slice(0, 3), ...m.filter(x => x[1] < 0).slice(-3)];
}
export function slimRetired(g: Game) {
  let n = 0;
  (Object.values(g.db.P) as any[]).forEach(p => {
    if (!p.retired || (p.slim || 0) >= SLIM) return;
    DEV_ONLY.forEach(k => delete p[k]);
    (p.stats || []).forEach((r: any) => { delete r.h; delete r.a; ZONE_KEYS.forEach(k => delete r[k]); roundRow(r); });
    const H: any[] = p.injHist || [];
    if (H.length && !p.injSum) { const out = H.filter(x => !x.dtd), long = out.slice().sort((a, b) => (b.days ?? b.games * 2.14) - (a.days ?? a.games * 2.14))[0];
      p.injSum = { n: H.length, sat: out.length, missed: H.reduce((a, x) => a + (x.missed ?? (x.dtd ? 0 : x.games || 0)), 0), ...(long ? { long: { name: long.name, season: long.season } } : {}) }; }
    if (H.length) { const keep = H.filter(bigInj); if (keep.length) p.injHist = keep; else delete p.injHist; }
    if (!(p.stats || []).length) { delete p.rh; delete p.ccpS; }
    else if (p.rh) { const ys = Object.keys(p.rh).map(Number).sort((a, b) => a - b);
      ys.forEach((y, i) => { const h = p.rh[y], nx = p.rh[ys[i + 1]], next = (ys[i + 1] === y + 1 ? nx?.o : null) ?? h.e;
        if (h.o?.r && !h.mv) { const mv = movesOf(h.o, next); if (mv.length) h.mv = mv; }
      });
      // (every season's moves are worked out before any season's ratings are dropped)
      ys.forEach(y => { const h = p.rh[y]; delete h.e; if (h.o) h.o = { ovr: r1(h.o.ovr), ovrI: h.o.ovrI, pot: h.o.pot }; }); }
    p.slim = SLIM; n++;
  });
  return n;
}

// Home and away splits are only shown for the current season: older seasons' stat lines drop them
// (about half of every stat line), and their minutes and expected points are rounded. Runs once a season (db.splitY).
export function dropOldSplits(g: Game) {
  const Y = g.Y; if ((g.db.splitY ?? 0) >= Y && g.db.rowV) return;
  (Object.values(g.db.P) as any[]).forEach(p => (p.stats || []).forEach((r: any) => { if (r.season < Y) { delete r.h; delete r.a; roundRow(r); } }));
  g.db.splitY = Y; g.db.rowV = 1; // rowV: older saves round their past seasons' lines once
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

// The league's transaction log keeps its last LOG_SEASONS seasons. Its seasons run from one summer's
// salary-cap line (written when free agency opens; the Transactions page splits the log there) to the
// next; older entries go. Every player's own transaction list (p.tx) keeps his whole history.
export const LOG_SEASONS = 10;
const isCapLine = (e: any) => e?.teams === 'League' && /salary cap is/.test(e.text || '');
export function trimLeagueLog(log: any[], keep = LOG_SEASONS) {
  let n = 0;
  for (let i = 0; i < log.length; i++) if (isCapLine(log[i]) && ++n === keep) return i + 1 < log.length ? log.slice(0, i + 1) : log;
  return log;
}

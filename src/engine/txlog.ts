// Transaction history: every player's moves (drafted, signed, re-signed, waived, traded,
// taken in an expansion draft, retired), a league-wide record of every trade (who gave
// what), and what each traded draft pick became, so a trade can be followed all the way
// through ("traded for a 2028 1st, which became the No. 1 pick: …").
// Lives in the database (with the players), so it's saved with the league.
import type { Game } from './Game';

export interface Tx { k: 'draft' | 'sign' | 'waive' | 'trade' | 'expansion' | 'retire' | 'abroad' | 'extend'; season: number; date: string; tid?: number; from?: number; to?: number; trade?: number; n?: number; rd?: number; orig?: number; text?: string }
export interface Trade { id: number; season: number; date: string; a: number; b: number; aP: number[]; bP: number[]; aK: string[]; bK: string[]; note?: string }

const dateOf = (g: Game, s: any) => {
  const ph = s.phase, Y = g.Y;
  if (ph === 'regular' || ph === 'preseason') return g.dateOf(s.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (ph === 'fa' && s.faStart != null) return g.faDate(s, Math.max(0, s.day - s.faStart)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return { playin: 'Apr ' + Y, playoffs: 'May ' + Y, lottery: 'May ' + Y, draft: 'Jun ' + Y, fa: 'Jul ' + Y } [ph as string] || String(Y);
};
export function addTx(g: Game, s: any, p: any, e: Omit<Tx, 'season' | 'date'>) {
  if (!p) return;
  (p.tx = p.tx || []).push({ season: g.Y, date: dateOf(g, s), ...e });
}
export function recordTrade(g: Game, s: any, a: number, b: number, aP: number[], bP: number[], aK: string[] = [], bK: string[] = [], note?: string) {
  const d: any = g.db, P = d.P, list: Trade[] = (d.trades = d.trades || []), id = list.length;
  list.push({ id, season: g.Y, date: dateOf(g, s), a, b, aP: aP.slice(), bP: bP.slice(), aK: aK.slice(), bK: bK.slice(), note });
  aP.forEach(pid => addTx(g, s, P[pid], { k: 'trade', from: a, to: b, trade: id }));
  bP.forEach(pid => addTx(g, s, P[pid], { k: 'trade', from: b, to: a, trade: id }));
  return id;
}
// A draft pick was used: remember which player it became.
export function recordPick(g: Game, s: any, p: any, pk: { n: number; rd?: number; orig?: number }, tid: number) {
  const rd = pk.rd || 1, orig = pk.orig ?? tid, d: any = g.db;
  (d.pickUsed = d.pickUsed || {})[g.Y + '-' + rd + '-' + orig] = { n: pk.n, pid: p.id, tid };
  addTx(g, s, p, { k: 'draft', tid, n: pk.n, rd, orig });
}
export const tradesOf = (g: Game): Trade[] => (g.db as any).trades || [];
export const pickUsed = (g: Game, assetId: string) => ((g.db as any).pickUsed || {})[assetId] || null;
// Every trade a pick changed hands in.
export const pickTrades = (g: Game, assetId: string) => tradesOf(g).filter(t => t.aK.includes(assetId) || t.bK.includes(assetId));

// A short note on how a player came to this team, for roster rows: "#2 pick in 2027",
// "Signed as a free agent in 2027", "Traded from NSH in 2028", plus a later extension or
// re-signing ("extended 2028"). Players from before the league began show their draft slot.
export function howAcquired(g: Game, s: any, p: any, tid: number): string {
  const tx: Tx[] = p.tx || [], T = s.teams, yr = (e: Tx) => { const m = String(e.date || '').match(/(\d{4})$/); return m ? m[1] : String(e.season); };
  let arrive = -1;
  tx.forEach((e, i) => { if ((e.k === 'draft' && e.tid === tid) || (e.k === 'trade' && e.to === tid) || (e.k === 'expansion' && e.to === tid) || (e.k === 'sign' && e.tid === tid && !/^Re-signed/.test(e.text || ''))) arrive = i; });
  let head = '';
  if (arrive >= 0) {
    const e = tx[arrive];
    head = e.k === 'draft' ? '#' + e.n + ' pick in ' + e.season
      : e.k === 'trade' ? 'Traded from ' + (T[e.from!]?.abbr || '?') + ' in ' + yr(e)
      : e.k === 'expansion' ? 'Expansion draft, ' + yr(e)
      : /two-way/i.test(e.text || '') ? 'Signed to a two-way in ' + yr(e) : /10-day/i.test(e.text || '') ? 'Signed to a 10-day in ' + yr(e) : 'Signed as a free agent in ' + yr(e);
  } else if (p.dr && p.draft) {
    const n = (p.dr.rd - 1) * 30 + p.dr.pick;
    head = '#' + n + ' pick in ' + p.draft + (p.draftTid != null && p.draftTid !== tid && T[p.draftTid] ? ' by ' + T[p.draftTid].abbr : '');
  } else if (p.draft) head = 'Undrafted in ' + p.draft;
  // The latest extension or re-signing since he arrived.
  const later = tx.slice(arrive + 1).reverse().find(e => (e.k === 'extend' && e.tid === tid) || (e.k === 'sign' && e.tid === tid && /^Re-signed/.test(e.text || '')));
  const tail = later ? (later.k === 'extend' ? 'extended ' : 're-signed ') + yr(later) : '';
  return [head, tail].filter(Boolean).join(' · ');
}

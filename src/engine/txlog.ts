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

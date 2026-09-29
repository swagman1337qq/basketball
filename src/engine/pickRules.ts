// Pick protections and pick swaps, settled on lottery night once the draft order is known.
//
// A protected first (asset.prot = N, "top-N protected") stays with the team that traded it if
// it lands in the top N. The debt rolls over to the next year's first with the same protection;
// after two rollovers it conveys unprotected. If next year's first isn't his to give, the team
// that was owed gets his next-year second-rounder instead.
//
// A swap right (s.swaps: { yr, from, to }) lets team `to` trade its own first for team `from`'s
// that year if `from`'s lands higher. Protections settle first, then swaps.
import type { Game } from './Game';

export const PROT_OPTIONS: [number, string][] = [[0, 'Unprotected'], [1, 'Top-1 protected'], [3, 'Top-3 protected'], [5, 'Top-5 protected'], [8, 'Top-8 protected'], [10, 'Top-10 protected'], [14, 'Lottery protected (top-14)'], [20, 'Top-20 protected']];
export const protLabel = (n?: number) => (n ? (n === 14 ? 'lottery-protected' : 'top-' + n + ' protected') : '');
export const MAX_ROLLS = 2;

export interface SwapRight { id: string; yr: number; from: number; to: number }

export function settlePickRules(g: Game, s: any, picks: { n: number; rd: number; orig: number }[]) {
  const Y = g.Y, T = s.teams, assets = s.assets.map((a: any) => ({ ...a })), log: any[] = [], line = (abbr: string, text: string) => log.push({ day: s.day, type: 'Draft', teams: abbr, text });
  const kept = new Set<number>(); // picks that stayed home under their protection: no swap can touch them
  const first = (yr: number, orig: number) => assets.find((a: any) => a.yr === yr && a.rd === 1 && a.orig === orig);
  picks.filter(p => p.rd === 1).forEach(p => {
    const a = first(Y, p.orig); if (!a || !a.prot) return;
    const prot = a.prot, holder = a.owner; delete a.prot;
    if (holder === a.orig) return;
    const who = T[a.orig].region + '’s', to = T[holder].region;
    if (p.n > prot) { line(T[holder].abbr, who + ' first-round pick (' + protLabel(prot) + ') landed at No. ' + p.n + ' and conveys to ' + to); return; }
    a.owner = a.orig; kept.add(a.orig); // protected: he keeps it
    const nx = first(Y + 1, a.orig), rolls = (a.rolls || 0) + 1;
    if (nx && nx.owner === a.orig && !nx.prot) {
      nx.owner = holder; if (rolls <= MAX_ROLLS) { nx.prot = prot; nx.rolls = rolls; }
      line(T[a.orig].abbr, who + ' pick landed at No. ' + p.n + ', inside its ' + protLabel(prot) + ', so ' + T[a.orig].region + ' keeps it. ' + to + ' gets their ' + (Y + 1) + ' first instead' + (rolls <= MAX_ROLLS ? ' (' + protLabel(prot) + ')' : ', unprotected') + '.');
    } else {
      const sec = assets.find((x: any) => x.yr === Y + 1 && x.rd === 2 && x.orig === a.orig && x.owner === a.orig); if (sec) sec.owner = holder;
      line(T[a.orig].abbr, who + ' pick landed at No. ' + p.n + ', inside its ' + protLabel(prot) + ': ' + T[a.orig].region + ' keeps it' + (sec ? ' and ' + to + ' gets their ' + (Y + 1) + ' second-round pick instead.' : '; the obligation is extinguished.'));
    }
  });
  const swaps: SwapRight[] = s.swaps || [];
  swaps.filter(w => w.yr === Y).forEach(w => {
    const pa = picks.find(p => p.rd === 1 && p.orig === w.to), pb = picks.find(p => p.rd === 1 && p.orig === w.from), A = first(Y, w.to), B = first(Y, w.from);
    if (!pa || !pb || !A || !B) return;
    if (kept.has(w.from) || kept.has(w.to)) { line(T[w.to].abbr, T[w.to].region + '’s ' + Y + ' swap with ' + T[w.from].region + ' is void: one of the picks stayed home under its protection'); return; }
    if (pb.n < pa.n) { const o = A.owner; A.owner = B.owner; B.owner = o; line(T[w.to].abbr, T[w.to].region + ' swapped firsts with ' + T[w.from].region + ': No. ' + pa.n + ' for No. ' + pb.n); }
    else line(T[w.to].abbr, T[w.to].region + ' kept its own first (No. ' + pa.n + '); swapping with ' + T[w.from].region + '’s No. ' + pb.n + ' wouldn’t help');
  });
  return { assets, swaps: swaps.filter(w => w.yr !== Y), log };
}

// How much a protection takes off a pick's value to the team receiving it (the chance it lands
// inside the protection, from its projected slot, times what's lost when it rolls over).
export function protFactor(slot: number, prot?: number) {
  if (!prot) return 1;
  const p = 1 / (1 + Math.exp((slot - prot - 0.5) / 2.2)); // chance it lands inside
  return 1 - p * 0.55;
}

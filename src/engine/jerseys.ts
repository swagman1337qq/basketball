// Jersey numbers. Every player has a favorite (guards lean to low numbers, bigs to the
// 20s–50s), keeps his number when he changes teams if it's free, and otherwise picks the
// next one he likes. Longest-tenured players keep theirs when two teammates collide.
import { mulberry32 } from './rng';

const GUARD = ['0', '1', '2', '3', '4', '5', '7', '8', '9', '10', '11', '12', '13', '14', '15', '17', '20', '22', '23', '24', '25', '30', '31', '33', '35', '6', '19', '21', '00', '18'];
const WING = ['1', '2', '3', '4', '5', '7', '8', '9', '10', '11', '12', '13', '14', '20', '21', '22', '23', '24', '25', '30', '31', '32', '33', '34', '35', '40', '41', '44', '6', '16'];
const BIG = ['4', '8', '10', '11', '12', '13', '14', '15', '20', '21', '22', '24', '25', '30', '31', '32', '33', '34', '35', '40', '41', '42', '43', '44', '45', '50', '51', '52', '54', '55', '77', '99', '6', '9'];
const ALL = Array.from({ length: 100 }, (_, i) => String(i)).concat(['00']);

// A player's order of preference (stable per player).
export function numberPrefs(p: any): string[] {
  const rnd = mulberry32((p.id || 1) * 2654435761 % 4294967291 + 17), base = p.grp === 'G' ? GUARD : p.grp === 'B' ? BIG : WING;
  const lead = base.map(n => [rnd() * (1 + base.indexOf(n) / base.length), n] as [number, string]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return [...new Set([...(p.numFav ? [p.numFav] : []), ...lead, ...ALL])];
}

// Give everyone on each roster a unique number. Mutates players (num, numTid).
export function assignNumbers(P: Record<number, any>, rosters: Record<number, number[]>, only?: number[]) {
  (only || Object.keys(rosters).map(Number)).forEach(tid => {
    const ids = rosters[tid] || [], taken = new Set<string>();
    const order = ids.map(id => P[id]).filter(Boolean).sort((a, b) => (b.numTid === tid ? 1 : 0) - (a.numTid === tid ? 1 : 0) || (b.yrsWith || 0) - (a.yrsWith || 0) || b.ovr - a.ovr);
    order.forEach(p => {
      if (p.num != null && !taken.has(p.num) && (p.numTid === tid || p.numTid == null || !p.numLocked)) { taken.add(p.num); p.numTid = tid; if (!p.numFav) p.numFav = p.num; return; }
      const pick = numberPrefs(p).find(n => !taken.has(n)) || '99';
      p.num = pick; p.numTid = tid; if (!p.numFav) p.numFav = pick; taken.add(pick);
    });
  });
}

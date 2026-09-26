// Salary-cap outlook: the real cap history and a year-by-year projection for the next
// 500 seasons, which the game follows exactly (every league sees the same schedule).
//
// History (season-end year → cap, $M): 3.6 in 1984-85 to 154.6 in 2025-26. That's about
// 9.8% a year since 1985 and 6.2% since 2000, with flat or falling years in recessions
// (2002-03, 2009-10, the 2020-21 freeze) and jumps when national media deals began
// (+44% in 1995-96, +34% in 2016-17, which is why the 2023 CBA caps growth at 10%).
//
// Projection, each season:
//   growth = inflation (2.3%)
//          + real revenue growth, fading as the league matures (0.9% + 3.2%·e^(−years/40))
//          + a new national media deal every 11 years (next: 2036-37), spread over three
//            seasons by the 10% smoothing rule, slightly smaller each cycle
//          − a soft final season before each new deal
//          + economic shocks from a fixed seed: recessions (−3% to −7% then a weak
//            recovery year) about once a decade, and the odd boom year
//   clamped to between −4% and +10% (the CBA's maximum yearly increase).
// 2026-27 is fixed at the league's projection of $165.0M.

export const CAP_HISTORY: [number, number][] = [
  [1985, 3.6], [1986, 4.233], [1987, 4.945], [1988, 6.164], [1989, 7.232], [1990, 9.802], [1991, 11.871], [1992, 12.5], [1993, 14.0], [1994, 15.175],
  [1995, 15.964], [1996, 23.0], [1997, 24.363], [1998, 26.9], [1999, 30.0], [2000, 34.0], [2001, 35.5], [2002, 42.5], [2003, 40.271], [2004, 43.84],
  [2005, 43.87], [2006, 49.5], [2007, 53.135], [2008, 55.63], [2009, 58.68], [2010, 57.7], [2011, 58.044], [2012, 58.044], [2013, 58.044], [2014, 58.679],
  [2015, 63.065], [2016, 70.0], [2017, 94.143], [2018, 99.093], [2019, 101.869], [2020, 109.14], [2021, 109.14], [2022, 112.414], [2023, 123.655], [2024, 136.021],
  [2025, 140.588], [2026, 154.647],
];

export const FIRST_SEASON = 2027, LAST_SEASON = 2526, MEDIA_START = 2037, MEDIA_CYCLE = 11;
export interface CapYear { season: number; growth: number; cap: number; note: string }

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let cache: CapYear[] | null = null;
export function capProjection(): CapYear[] {
  if (cache) return cache;
  const r = rng(19460606), out: CapYear[] = [];
  let cap = 165.0, pendingRecovery = false;
  out.push({ season: FIRST_SEASON, growth: +((165.0 / 154.647 - 1) * 100).toFixed(2), cap, note: 'League projection' });
  for (let y = FIRST_SEASON + 1; y <= LAST_SEASON; y++) {
    const t = y - FIRST_SEASON, notes: string[] = [];
    let g = 2.3 + 0.9 + 3.2 * Math.exp(-t / 40);
    const since = y - MEDIA_START, cycle = Math.floor(since / MEDIA_CYCLE), inCycle = ((since % MEDIA_CYCLE) + MEDIA_CYCLE) % MEDIA_CYCLE;
    if (since >= 0) { const size = Math.pow(0.985, cycle); if (inCycle === 0) { g += 4.5 * size; notes.push('New national media deal'); } else if (inCycle === 1) g += 3.0 * size; else if (inCycle === 2) g += 1.5 * size; else if (inCycle === MEDIA_CYCLE - 1) { g -= 1.0; notes.push('Final year of the media deal'); } }
    else if (y === MEDIA_START - 1) { g -= 1.0; notes.push('Final year of the media deal'); }
    const x = r();
    if (pendingRecovery) { g -= 1.5; notes.push('Slow recovery'); pendingRecovery = false; }
    else if (x < 0.085) { g -= 3 + r() * 4 + 3; notes.push('Recession'); pendingRecovery = true; }
    else if (x > 0.97) { g += 2; notes.push('Boom year'); }
    g = Math.max(-4, Math.min(10, g));
    if (g >= 10 && notes.length === 0) notes.push('Capped at +10%');
    cap = cap * (1 + g / 100);
    out.push({ season: y, growth: +g.toFixed(2), cap: +cap.toFixed(3), note: notes.join(' · ') });
  }
  return (cache = out);
}

// Growth (as a multiplier) from season y−1 to season y.
export function capGrowthFor(y: number) {
  const p = capProjection().find(x => x.season === y);
  return p ? 1 + p.growth / 100 : 1.035;
}

// Money in millions, shown as $M, $B or $T as the cap grows over the decades.
export function fmtMoney(v: number) {
  const a = Math.abs(v), sgn = v < 0 ? '−' : '';
  if (a >= 1e6) return sgn + '$' + (a / 1e6).toFixed(a >= 1e8 ? 0 : 2) + 'T';
  if (a >= 1e3) return sgn + '$' + (a / 1e3).toFixed(a >= 1e5 ? 0 : 2) + 'B';
  return sgn + '$' + a.toFixed(1) + 'M';
}

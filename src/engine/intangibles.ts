// Intangibles and hidden gems.
//
// Two ratings the overall doesn't count, because scouts can't measure them well:
//   Feel   vision, processing speed, anticipation, spatial awareness, passing feel: the game
//          slows down for him (think Jokić, Draymond Green, Manu Ginóbili).
//   Poise  composure, patience, emotional rhythm: not rattled by pressure, crowds or traps.
// Basketball IQ (OIQ/DIQ) and leadership (personality) stay where they are. Feel and Poise play
// in every game (sim.ts): high-Feel players make their teammates' shots better and turn it over
// less; high-Poise players shoot better in the clutch and on the road and handle pressure.
//
// Hidden gems: some players are better than anyone projects. A gem carries a hidden extra
// ceiling that shows up over two to four seasons as his potential rises (Jae Crowder, Draymond
// Green, Ben Wallace, Manu Ginóbili, Jimmy Butler, Jalen Brunson; rarely a Jokić). Most become
// solid rotation players, some starters, a very few stars. Feel, Poise and work ethic make a gem
// more likely: the traits the draft misses.
import { mulberry32 } from './rng';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const bell = (r: () => number) => (r() + r() + r() - 1.5) * 2; // about −3…+3, sd ≈ 1

// Feel and Poise for a player who doesn't have them yet (new players and older saves), seeded
// by his id so every load agrees. Feel follows his feel for the game (IQ, passing) plus a large
// share nobody can see on film; Poise grows with experience.
export function ensureIntg(p: any, rnd?: () => number) {
  if (p.intg) return p.intg;
  const r = rnd || mulberry32(p.id * 7919 + 13), oiq = p.r?.oiq ?? 50, pss = p.r?.pss ?? 50;
  const feel = cl(Math.round(0.35 * oiq + 0.15 * pss + 30 + bell(r) * 11), 15, 99); // league average ≈ 50
  const poise = cl(Math.round(52 + ((p.age ?? 24) - 24) * 1.2 + bell(r) * 11 + (p.pers?.clutch ? 10 : 0) - (p.pers?.volatile ? 12 : 0) + (p.pers?.pro ? 4 : 0)), 10, 99);
  p.intg = { feel, poise };
  return p.intg;
}

// A hidden gem: extra ceiling nobody sees yet. Young players only (under 25); the chance rises
// with Feel, Poise and work ethic. Tiers: role player (most), starter, star (rare).
export function rollGem(p: any, rnd: () => number = Math.random, base = 0.06) {
  if (p.gem !== undefined || (p.age ?? 30) > 24) return;
  const it = ensureIntg(p), work = p.pers?.work ?? 50;
  const chance = base * (1 + Math.max(0, it.feel - 60) / 20 + Math.max(0, it.poise - 60) / 30 + Math.max(0, work - 60) / 40);
  if (rnd() >= chance) { p.gem = 0; return; }
  const t = rnd(), add = t < 0.62 ? 5 + Math.floor(rnd() * 5) : t < 0.93 ? 10 + Math.floor(rnd() * 6) : 16 + Math.floor(rnd() * 9);
  p.gem = { add, left: add, tier: t < 0.62 ? 'role' : t < 0.93 ? 'starter' : 'star' };
  if (p.tpot != null) p.tpot = Math.min(99, p.tpot + add); // part of his true potential from the start; the scouts see it surface over the years
}

// Monthly: a gem's hidden ceiling surfaces a little at a time (over about three seasons; faster
// with minutes and work ethic, until he's 29). Returns the potential gained this month.
export function gemTick(p: any): number {
  const g = p.gem;
  if (!g || !g.left || (p.age ?? 30) > 29) return 0;
  const pace = (g.add / 30) * (0.6 + Math.min(1, (p.min || 0) / 24) * 0.5) * (0.8 + (p.pers?.work ?? 50) / 250);
  const x = Math.min(g.left, pace);
  g.left = +(g.left - x).toFixed(3);
  return x;
}

export const feelWord = (v: number) => (v >= 85 ? 'Elite' : v >= 72 ? 'Great' : v >= 60 ? 'Good' : v >= 45 ? 'Average' : v >= 32 ? 'Limited' : 'Poor');

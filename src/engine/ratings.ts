// Team rating and player badges.
//
// Team rating (0–100): the whole roster's overall ratings, weighted by how many minutes
// each slot plays in a normal rotation (best player 34 minutes … 10th man 6), so stars
// count most but depth still matters.
//
// Badges describe what a player does best. Each is earned at a rating threshold and
// upgrades Bronze → Silver → Gold → Hall of Fame every 6 points above it. They're drawn
// from the same ratings the game engine uses, so a badge always shows up in his play.

const W = [34, 33, 32, 30, 28, 24, 20, 17, 14, 6, 2, 1, 1, 1, 1];

export function teamRating(P: Record<number, any>, ids: number[]) {
  const o = ids.map(id => P[id]?.ovr ?? 0).sort((a, b) => b - a);
  let a = 0, w = 0; o.forEach((v, i) => { const k = W[i] ?? 0; a += v * k; w += k; });
  return w ? +(a / w).toFixed(1) : 0;
}

export interface Badge { key: string; name: string; desc: string; tier: number; tierName: string; color: string }
export const TIERS: [string, string][] = [['Bronze', '#c08a55'], ['Silver', '#b9c3cf'], ['Gold', 'oklch(0.86 0.14 85)'], ['Hall of Fame', '#b99cff']];

type Def = [string, string, string, (p: any) => number | null, number?];
// [key, name, what it means, value (null = not eligible), threshold]
const DEFS: Def[] = [
  ['sniper', 'Sniper', 'Knocks down threes at a high clip', p => p.r.tp, 64],
  ['stretch', 'Stretch Big', 'A big who pulls centers out to the three-point line', p => (p.grp === 'B' ? p.r.tp + 10 : null), 64],
  ['midrange', 'Mid-Range Maestro', 'Lethal pull-ups and turnarounds from 10–20 feet', p => p.r.fg, 64],
  ['tough', 'Tough Shot Maker', 'Contested, off-balance, off-the-glass: makes the shots nobody else can', p => (p.r.drb >= 70 ? (p.r.drb + p.r.fg + p.r.ins) / 3 + 4 : null), 64],
  ['handles', 'Ankle Breaker', 'Elite handle that shakes defenders loose', p => p.r.drb, 68],
  ['flyer', 'High Flyer', 'Finishes above the rim', p => (p.r.jmp + p.r.dnk) / 2, 66],
  ['fast', 'Speed Demon', 'The fastest end-to-end players in the league', p => p.r.spd, 70],
  ['general', 'Floor General', 'Runs the offense and finds the open man', p => (p.r.pss + p.r.oiq) / 2, 64],
  ['lockdown', 'Perimeter Lockdown', 'Smothers ball handlers and wings', p => (p.grp !== 'B' ? p.r.diq * 0.6 + p.r.spd * 0.4 : null), 62],
  ['rim', 'Rim Protector', 'Walls off the paint and blocks shots', p => (p.grp !== 'G' ? p.r.hgt * 0.5 + p.r.diq * 0.3 + p.r.jmp * 0.2 : null), 62],
  ['pickpocket', 'Pickpocket', 'Jumps passing lanes and strips ball handlers', p => (p.grp !== 'B' ? (p.r.diq + p.r.spd) / 2 : null), 64],
  ['wall', 'Brick Wall', 'Bone-rattling screens and an immovable post', p => p.r.stre, 70],
  ['glass', 'Glass Cleaner', 'Owns the boards at both ends', p => p.r.reb, 66],
  ['post', 'Post Scorer', 'Scores with his back to the basket', p => p.r.ins, 66],
  ['ft', 'Free Throw Ace', 'Automatic at the line', p => p.r.ft, 74],
  ['iron', 'Iron Man', 'Never tires; plays heavy minutes night after night', p => p.r.endu, 72],
  ['iq', 'Basketball Genius', 'Always in the right spot on both ends', p => (p.r.oiq + p.r.diq) / 2, 66],
  ['clutch', 'Clutch Gene', 'Wants the last shot, and makes it', p => (p.pers?.clutch ? 64 + Math.max(0, p.ovr - 50) * 0.6 : null), 64],
];

export function badgesOf(p: any): Badge[] {
  if (!p?.r) return [];
  const out: (Badge & { m: number })[] = [];
  DEFS.forEach(([key, name, desc, f, th = 72]) => { const v = f(p); if (v == null || v < th) return; const m = v - th, tier = Math.min(3, Math.floor(m / 6)); out.push({ key, name, desc, tier, tierName: TIERS[tier][0], color: TIERS[tier][1], m }); });
  return out.sort((a, b) => b.tier - a.tier || b.m - a.m).map(({ m, ...b }) => { void m; return b; });
}
export const BADGE_LIST = DEFS.map(d => ({ key: d[0], name: d[1], desc: d[2] }));

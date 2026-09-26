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
  ['firststep', 'Blow-By', 'An explosive first step that beats defenders off the dribble', p => p.r.acc ?? null, 70],
  ['finisher', 'Crafty Finisher', 'Scoops, floaters and reverses: finishes around the rim without dunking', p => p.r.lay ?? null, 68],
  ['general', 'Floor General', 'Runs the offense and finds the open man', p => (p.r.pss + p.r.oiq) / 2, 64],
  ['lockdown', 'Perimeter Lockdown', 'Smothers ball handlers and wings', p => (p.grp !== 'B' ? p.r.diq * 0.6 + p.r.spd * 0.4 : null), 62],
  ['rim', 'Rim Protector', 'Walls off the paint and blocks shots', p => (p.grp !== 'G' ? p.r.hgt * 0.5 + p.r.diq * 0.3 + p.r.jmp * 0.2 : null), 62],
  ['pickpocket', 'Pickpocket', 'Jumps passing lanes and strips ball handlers', p => (p.grp !== 'B' ? (p.r.diq + p.r.spd) / 2 : null), 64],
  ['wall', 'Brick Wall', 'Bone-rattling screens and an immovable post', p => p.r.stre, 70],
  ['glass', 'Glass Cleaner', 'Owns the boards at both ends', p => p.r.reb, 66],
  ['boxout', 'Box-Out Beast', 'Seals his man every possession so teammates grab the rebound', p => p.r.box ?? null, 70],
  ['length', 'Condor', 'Freakish wingspan: contests shots and passing lanes other players can’t reach', p => { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/), h = m ? +m[1] * 12 + +m[2] : 0; return p.wing && h ? 58 + (p.wing - h) * 2 : null; }, 72],
  ['post', 'Post Scorer', 'Scores with his back to the basket', p => p.r.ins, 66],
  ['ft', 'Free Throw Ace', 'Automatic at the line', p => p.r.ft, 74],
  ['iron', 'Iron Man', 'Never tires; plays heavy minutes night after night', p => p.r.endu, 72],
  ['iq', 'Basketball Genius', 'Always in the right spot on both ends', p => (p.r.oiq + p.r.diq) / 2, 66],
  ['clutch', 'Clutch Gene', 'Wants the last shot, and makes it', p => (p.pers?.clutch ? 64 + Math.max(0, p.ovr - 50) * 0.6 : null), 64],
];

// A line of flavor for each badge: what it looks like on the floor.
export const BADGE_FLAVOR: Record<string, string> = {
  sniper: 'Give him a sliver of daylight and it’s already in the air. Defenses close out a step early and still get burned.',
  stretch: 'Drags the other team’s center out to the arc and leaves the paint wide open for everyone else.',
  midrange: 'The lost art. Two dribbles, elbow, rise, splash. Nobody wants to guard the pull-up.',
  tough: 'Fadeaways over two hands, reverses off the glass, one-legged floaters: the shot clock is never a problem.',
  handles: 'Crossovers that put defenders on the floor. Highlight reels follow him around.',
  flyer: 'Lobs thrown anywhere near the rim become dunks. Posters are a nightly risk for anyone in the way.',
  fast: 'Grab the rebound, blink, and he’s already at the other rim. Transition terror.',
  general: 'Directs traffic, sees passes before they open and makes four teammates better.',
  lockdown: 'Picks up full court, fights through every screen and makes stars work for every touch.',
  rim: 'Anything at the rim is contested. Drivers change their minds halfway through the lane.',
  pickpocket: 'Quick hands in the passing lanes; careless dribblers get stripped and he’s off the other way.',
  wall: 'Screens that stop guards cold and a post nobody can move. Contact is his friend.',
  firststep: 'One hard dribble and he’s past you. Help defense has to rotate before the play even starts.',
  finisher: 'Doesn’t need to jump over anyone: touch off the glass, soft floaters and reverses on the other side of the rim.',
  boxout: 'Rarely leads the team in rebounds, but every one of his teammates does: his man never touches the ball.',
  length: 'Arms that go on forever. Shots that look open aren’t, and passing lanes close in a blink.',
  glass: 'Every miss is his. Second chances for his team, one-and-done for the other.',
  post: 'Back to the basket, drop steps and hook shots. Double-team him or pay for it.',
  ft: 'Money from the line. Foul him late and you’re just giving away points.',
  iron: 'Never seems to get tired. Heavy minutes, back-to-backs, overtime: same player every night.',
  iq: 'Always a step ahead: right rotation, right cut, right pass. Coaches love him.',
  clutch: 'Wants the ball with the game on the line, and the last shot tends to fall.',
};

export function badgesOf(p: any): Badge[] {
  if (!p?.r) return [];
  const out: (Badge & { m: number })[] = [];
  DEFS.forEach(([key, name, desc, f, th = 72]) => { const v = f(p); if (v == null || v < th) return; const m = v - th, tier = Math.min(3, Math.floor(m / 6)); out.push({ key, name, desc, tier, tierName: TIERS[tier][0], color: TIERS[tier][1], m }); });
  return out.sort((a, b) => b.tier - a.tier || b.m - a.m).map(({ m, ...b }) => { void m; return b; });
}
export const BADGE_LIST = DEFS.map(d => ({ key: d[0], name: d[1], desc: d[2] }));

// How much each rating counts toward a player's overall, by position group (G guards, W wings,
// B bigs): guards live on handle, passing and shooting; bigs on size, rebounding and rim
// protection. Used when a rating is edited in God Mode, so the overall moves with it.
export const OVR_W: Record<string, Record<string, number>> = {
  G: { hgt: 1, stre: .5, spd: 1.5, acc: 1.5, jmp: .8, endu: .6, ins: .4, dnk: .5, lay: 1.2, ft: .6, fg: 1.2, tp: 1.6, oiq: 1.6, diq: 1.1, drb: 1.8, pss: 1.8, reb: .4, box: .3 },
  W: { hgt: 1.1, stre: .8, spd: 1.2, acc: 1.1, jmp: 1, endu: .6, ins: .7, dnk: .8, lay: 1, ft: .6, fg: 1.2, tp: 1.5, oiq: 1.4, diq: 1.5, drb: 1.1, pss: 1, reb: .8, box: .6 },
  B: { hgt: 1.8, stre: 1.4, spd: .6, acc: .5, jmp: 1.1, endu: .6, ins: 1.6, dnk: 1.1, lay: .8, ft: .5, fg: .7, tp: .6, oiq: 1.1, diq: 1.6, drb: .4, pss: .7, reb: 1.7, box: 1.3 },
};
export const ovrShare = (grp: string, k: string) => { const W = OVR_W[grp] || OVR_W.W, tot = Object.values(W).reduce((a, x) => a + x, 0); return (W[k] ?? 0) / tot; };
// Move the overall by a change in its ratings (fractions carry over), and potential with it:
// better skills today mean a higher ceiling too.
export function nudgeOvr(p: any, d: number) {
  if (p.ovrF == null || Math.round(p.ovrF) !== p.ovr) p.ovrF = p.ovr; // overall was set directly since
  p.ovrF += d; const to = Math.max(1, Math.min(100, Math.round(p.ovrF))), dO = to - p.ovr;
  if (dO) { p.ovr = to; p.pot = Math.max(p.ovr, Math.min(100, p.pot + dO)); }
}
export function setRating(p: any, k: string, v: number) { const d = v - p.r[k]; p.r[k] = v; if (d) nudgeOvr(p, d * ovrShare(p.grp, k)); }

// Wingspan as a rating: arm length for his height. 50 is the league norm (+4″ longer than he is
// tall); every inch longer or shorter is 6 points. It counts toward the overall at a set rate per
// position: a great wingspan (+12″, about 98) is worth up to ~+4 for a big, +3 for a wing, +2 for
// a guard, and a short one costs the same.
export const inchesOf = (h: any) => { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; };
export const WNG_W: Record<string, number> = { G: .04, W: .06, B: .08 };
export const wngOf = (wing: number, hIn: number) => Math.round(Math.max(1, Math.min(100, 50 + (wing - hIn - 4) * 6)));
export const wngRating = (p: any) => wngOf(p.wing ?? inchesOf(p.hgt) + 4, inchesOf(p.hgt));
export const wngBonus = (p: any) => (wngRating(p) - 50) * (WNG_W[p.grp] ?? .06);
export function setWing(p: any, inches: number) { const a = wngRating(p); p.wing = inches; nudgeOvr(p, (wngRating(p) - a) * (WNG_W[p.grp] ?? .06)); }

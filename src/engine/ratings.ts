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
// [key, name, what it means, value (null = not eligible), threshold]. Every badge comes from ratings (or
// wingspan): cosmetic, it never changes a game, and a player only shows it if his ratings earn it.
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
  ['rim', 'Rim Protector', 'Walls off the paint and blocks shots', p => (p.grp !== 'G' ? (p.r.blk ?? p.r.hgt) * 0.5 + p.r.diq * 0.3 + p.r.hgt * 0.2 : null), 62],
  ['swat', 'Shot Swatter', 'Sends shots into the stands', p => p.r.blk ?? null, 72],
  ['pickpocket', 'Pickpocket', 'Jumps passing lanes and strips ball handlers', p => p.r.stl ?? null, 68],
  ['anchor', 'Defensive Anchor', 'Always in the right spot: rotates on time, walls off drives, never gets caught out of position', p => p.r.diq, 70],
  ['wall', 'Brick Wall', 'Bone-rattling screens and an immovable post', p => p.r.stre, 70],
  ['glass', 'Glass Cleaner', 'Owns the boards at both ends', p => p.r.reb, 66],
  ['boxout', 'Box-Out Beast', 'Seals his man every possession so teammates grab the rebound', p => p.r.box ?? null, 70],
  ['length', 'Condor', 'Freakish wingspan: contests shots and passing lanes other players can’t reach', p => { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/), h = m ? +m[1] * 12 + +m[2] : 0; return p.wing && h ? 58 + (p.wing - h) * 2 : null; }, 72],
  ['post', 'Post Scorer', 'Scores with his back to the basket', p => p.r.ins, 66],
  ['ft', 'Free Throw Ace', 'Automatic at the line', p => p.r.ft, 74],
  ['iron', 'Iron Man', 'Never tires; plays heavy minutes night after night', p => p.r.endu, 72],
  ['iq', 'Basketball Genius', 'Always in the right spot on both ends', p => (p.r.oiq + p.r.diq) / 2, 66],
  ['clutch', 'Clutch Gene', 'Wants the last shot, and has the poise and touch to make it', p => (p.pers?.clutch ? (p.intg?.poise ?? 50) * 0.45 + ((p.r.fg + p.r.ft) / 2) * 0.35 + p.r.oiq * 0.2 : null), 64],
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
  swat: 'Times his jump perfectly. Drivers who see him coming float it early, and miss.',
  anchor: 'Talks, points and rotates before the pass is even thrown. The defense around him just works.',
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

// Every badge's bar sits this much above its listed threshold, so badges mark real standouts: bench
// players have none, starters one or two, All-Stars about five.
export const BADGE_SHIFT = 4;
export function badgesOf(p: any): Badge[] {
  if (!p?.r) return [];
  const out: (Badge & { m: number })[] = [];
    DEFS.forEach(([key, name, desc, f, th0 = 72]) => { const th = th0 + BADGE_SHIFT, v = f(p); if (v == null || v < th) return; const m = v - th, tier = Math.min(3, Math.floor(m / 6)); out.push({ key, name, desc, tier, tierName: TIERS[tier][0], color: TIERS[tier][1], m }); });
  return out.sort((a, b) => b.tier - a.tier || b.m - a.m).map(({ m, ...b }) => { void m; return b; });
}
export const BADGE_LIST = DEFS.map(d => ({ key: d[0], name: d[1], desc: d[2] }));

// How much each rating counts toward a player's overall, by position group (G guards, W wings,
// B bigs): guards live on handle, passing and shooting; bigs on size, rebounding and rim
// protection. Used when a rating is edited in God Mode, so the overall moves with it.
export const OVR_W: Record<string, Record<string, number>> = {
  G: { hgt: 1, stre: .5, spd: 1.5, acc: 1.5, jmp: .8, endu: .6, ins: .4, dnk: .5, lay: 1.2, ft: .6, fg: 1.2, tp: 1.6, oiq: 1.6, diq: 1.1, blk: .2, stl: .6, drb: 1.8, pss: 1.8, reb: .4, box: .3 },
  W: { hgt: 1.1, stre: .8, spd: 1.2, acc: 1.1, jmp: 1, endu: .6, ins: .7, dnk: .8, lay: 1, ft: .6, fg: 1.2, tp: 1.5, oiq: 1.4, diq: 1.5, blk: .4, stl: .6, drb: 1.1, pss: 1, reb: .8, box: .6 },
  B: { hgt: 1.8, stre: 1.4, spd: .6, acc: .5, jmp: 1.1, endu: .6, ins: 1.6, dnk: 1.1, lay: .8, ft: .5, fg: .7, tp: .6, oiq: 1.1, diq: 1.6, blk: 1, stl: .3, drb: .4, pss: .7, reb: 1.7, box: 1.3 },
};
export const ovrShare = (grp: string, k: string) => { const W = OVR_W[grp] || OVR_W.W, tot = Object.values(W).reduce((a, x) => a + x, 0); return (W[k] ?? 0) / tot; };
// The overall IS the skills: a position-weighted average of every rating (a guard's handle counts
// far more than a center's), plus his wingspan, on a scale shared by all positions. Bigs naturally
// rate high in size skills and guards in speed and handle, so each position has a set adjustment
// that keeps a typical 60 guard, wing and big all at 60. Hidden decimal progress (p.rx) counts.
export const OVR_ADJ: Record<string, number> = { G: 2.7, W: 1.6, B: 4.1 };
export function ovrExact(p: any): number {
  const W = OVR_W[p.grp] || OVR_W.W; let a = 0, t = 0;
  for (const k in W) { const v = p.r?.[k]; if (v == null) continue; a += W[k] * (v + ((p.rx || {})[k] || 0)); t += W[k]; }
  return Math.max(1, Math.min(100, (t ? a / t : 50) + wngBonus(p) - (OVR_ADJ[p.grp] ?? 2.5)));
}
// Recompute the overall from the ratings (after any rating change). movePot: the ceiling moves by the
// same amount (edits); growth toward the ceiling leaves it alone.
export function syncOvr(p: any, movePot = false) {
  if (!p?.r) return 0;
  const e = ovrExact(p), o = Math.round(e), d = o - p.ovr;
  p.ovr = o; p.ox = +(e - o).toFixed(3); p.ovrF = e;
  if (movePot && d) p.pot = Math.min(100, p.pot + d);
  if (p.pot < p.ovr) p.pot = p.ovr;
  return d;
}
// Kept for older callers: the overall now follows the ratings exactly.
export function nudgeOvr(p: any, _d: number) { syncOvr(p, true); }
export function setRating(p: any, k: string, v: number) { p.r[k] = v; syncOvr(p, true); }
// Set the overall directly (God Mode): every skill but height moves by the same amount until the
// overall lands there (a few passes, since ratings stop at 1 and 100).
export function setOverall(p: any, v: number) {
  const f = 1 / Math.max(0.5, 1 - ovrShare(p.grp, 'hgt'));
  for (let i = 0; i < 6; i++) { const d = v - ovrExact(p); if (Math.abs(d) < 0.5) break; Object.keys(p.r).forEach(k => { if (k !== 'hgt') p.r[k] = Math.max(1, Math.min(RMAX, Math.round(p.r[k] + d * f))); }); }
  syncOvr(p, true);
}

// Blocks and Steals are their own skills, apart from Defensive IQ (positioning, rotations, reading
// the play). Shot-blocking leans on leaping, size and arm length; steals on quick hands and feet.
// Both only partly follow Defensive IQ, so a leaper can swat everything and still be lost in
// rotations (a Hassan Whiteside), and a guard can pile up steals without being a stopper (Luka).
// `noise` is −0.5…0.5 (random for new players, a fixed hash for older saves).
// The top of the skill scale (potential.ts): past 85 every point is harder to come by, leveling off below 98.
// Every rating stops at 99, and a 99 is improbable (potential.ts breakthroughs, generational skills).
export const RMAX = 99;
export const SOFT_K = 85, TOP = 98;
// The most growth can carry a rating: 98 (a generational skill, or one that broke through, p.brk, 99). The
// ceiling alone isn't enough: growth may land half a point past it, and a ceiling refit lifts the
// ceiling to the rating, which would ratchet a skill up to 99 over the seasons.
export const skillTop = (p: any, k: string) => Math.min(p.gen === k || p.brk?.[k] ? RMAX + 0.4 : TOP + 0.4, (p.ceil?.[k] ?? 99.5) + 0.5);
// The approach is slow (SOFT_SCALE): a raw 110 lands about 93, 130 about 96, and only an enormous target gets near 98.
export const SOFT_SCALE = 22;
export function softTop(v: number, top = TOP) { if (v <= SOFT_K) return v; const room = top - SOFT_K; return SOFT_K + room * (1 - Math.exp(-(v - SOFT_K) / ((room * SOFT_SCALE) / (TOP - SOFT_K)))); }
export function deriveDefense(p: any, noise: (k: number) => number) {
  const r = p.r, hIn = inchesOf(p.hgt), ape = (p.wing ?? hIn + 4) - hIn - 4, base = p.ovr ?? 50, g = p.grp;
  const c = (v: number) => Math.round(softTop(Math.max(4, Math.min(RMAX, v))));
  r.blk = c(r.jmp * 0.3 + r.hgt * 0.3 + base * 0.3 + r.diq * 0.1 + ape * 2.2 + (g === 'B' ? 4 : g === 'G' ? -9 : -2) + noise(1) * 24);
  r.stl = c((r.acc ?? r.spd) * 0.25 + r.spd * 0.15 + base * 0.4 + r.diq * 0.1 + (r.pss ?? 50) * 0.1 + ape * 1.2 + (g === 'G' ? 4 : g === 'B' ? -6 : 1) + noise(2) * 24);
}

// For players who existed before Blocks and Steals: shift both by the same amount so his overall
// stays exactly where it was (the shape, a shot-blocker vs a pickpocket, is kept).
export function deriveDefenseKeepOvr(p: any, noise: (k: number) => number) {
  const before = ovrExact(p); deriveDefense(p, noise);
  const W = OVR_W[p.grp] || OVR_W.W, tot = Object.values(W).reduce((a, x) => a + x, 0), k = tot / ((W.blk ?? 0) + (W.stl ?? 0) || 1);
  for (let i = 0; i < 4; i++) { const d = before - ovrExact(p); if (Math.abs(d) < 0.05) break; p.r.blk = Math.max(4, Math.min(RMAX, Math.round(p.r.blk + d * k))); p.r.stl = Math.max(4, Math.min(RMAX, Math.round(p.r.stl + d * k))); }
}

// Wingspan as a rating: arm length for his height. 50 is the league norm (+4″ longer than he is
// tall); every inch longer or shorter is 6 points. It counts toward the overall at a set rate per
// position: a great wingspan (+12″, about 98) is worth up to ~+4 for a big, +3 for a wing, +2 for
// a guard, and a short one costs the same.
// The height rating: mostly his size (about 4 points an inch: a 6′3″ guard ≈ 34, a 6′7″ wing ≈ 50, a
// 6′11″ big ≈ 66), partly how he plays to it, kept from his old rating and a fixed lean of his own:
// some players use their length and strength like a bigger man, some play small.
export const hgtFromInches = (inches: number) => 34 + (inches - 75) * 4;
export function blendHeight(p: any, old: number) { const lean = ((((p.id * 2654435761) ^ 0x4e1) >>> 0) % 1000 / 1000 - 0.5) * 10; return Math.round(Math.max(4, Math.min(RMAX, 0.6 * (hgtFromInches(inchesOf(p.hgt)) + lean) + 0.4 * old))); }
// Set the height rating and move his other ratings the other way so his overall stays put.
export function setHgtKeepOvr(p: any, v: number) {
  const before = ovrExact(p), W = OVR_W[p.grp] || OVR_W.W, T = Object.values(W).reduce((a, x) => a + x, 0), k = T / (T - (W.hgt ?? 0)); p.r.hgt = v;
  for (let i = 0; i < 5; i++) { const d = before - ovrExact(p); if (Math.abs(d) < 0.08) break; p.rx = p.rx || {}; Object.keys(p.r).forEach(x => { if (x === 'hgt') return; const t = (p.rx[x] || 0) + d * k, w = Math.trunc(t); p.r[x] = Math.max(4, Math.min(RMAX, p.r[x] + w)); p.rx[x] = +(t - w).toFixed(4); }); }
}
export const inchesOf = (h: any) => { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; };
export const WNG_W: Record<string, number> = { G: .04, W: .06, B: .08 };
export const wngOf = (wing: number, hIn: number) => Math.round(Math.max(1, Math.min(RMAX, 50 + (wing - hIn - 4) * 6)));
export const wngRating = (p: any) => wngOf(p.wing ?? inchesOf(p.hgt) + 4, inchesOf(p.hgt));
export const wngBonus = (p: any) => (wngRating(p) - 50) * (WNG_W[p.grp] ?? .06);
export function setWing(p: any, inches: number) { p.wing = inches; syncOvr(p, true); }

// The position his body and skills point to: mostly height, nudged by wingspan (long arms play
// bigger) and by whether his skills are a guard's (handling, passing, speed) or a big's
// (rebounding, inside scoring, strength). A 7-footer is a center; a 6′9″ playmaker is a wing.
export function recommendPos(p: any): { pos: string; why: string } {
  const r = p.r || {}, h = inchesOf(p.hgt), ape = (p.wing ?? h + 4) - h;
  const gs = ((r.drb ?? 50) + (r.pss ?? 50) + (r.spd ?? 50)) / 3, bs = ((r.reb ?? 50) + (r.ins ?? 50) + (r.box ?? r.reb ?? 50) + (r.stre ?? 50)) / 4;
  const eff = h + (ape - 4) * 0.25 + (bs - gs) / 10;
  const creator = (r.pss ?? 50) * 0.6 + (r.drb ?? 50) * 0.4, shooter = ((r.tp ?? 50) + (r.fg ?? 50)) / 2;
  const pos = eff < 75 ? (creator >= shooter + 3 ? 'PG' : creator <= shooter - 3 ? 'SG' : 'G') : eff < 77 ? (creator >= shooter + 6 ? 'G' : 'SG') : eff < 78.5 ? 'GF' : eff < 80 ? 'SF' : eff < 81 ? 'F' : eff < 82.5 ? 'PF' : eff < 83.5 ? 'FC' : 'C';
  const ft = (n: number) => Math.floor(n / 12) + '′' + (n % 12) + '″';
  const lean = bs - gs >= 6 ? 'big-man skills (rebounding ' + (r.reb ?? 50) + ', inside ' + (r.ins ?? 50) + ')' : gs - bs >= 6 ? 'guard skills (handling ' + (r.drb ?? 50) + ', passing ' + (r.pss ?? 50) + ')' : 'a balanced skill set';
  return { pos, why: ft(h) + ' with a ' + ft(h + ape) + ' wingspan and ' + lean + '.' };
}

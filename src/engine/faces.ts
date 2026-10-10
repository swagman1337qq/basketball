// Faces: Basketball Manager's own generator and renderer (not facesjs).
//
// makeFace(p, salt, kin) describes a face as plain JSON. It is deterministic from the player's face seed
// (his id until he gets a new face) mixed with the league's seed, so player #57 doesn't look the same in
// every league. Nothing is stored: the face follows the player's age (grey hair, a receding hairline,
// lines) and his father's or older brother's face (family resemblance). What you change in the face
// editor is stored on the player (p.faceX) and laid over the generated face.
// Looks are drawn independently of each other: hair style follows hair texture rather than race, and dyed
// hair, beards, accessories and expressions can show up on anyone.
// faceSvg(face, jersey) draws it in layers, lit softly from the upper left. Shading uses translucent
// shapes, never gradients or clip paths, so one face can appear many times on a page without id clashes.
import { createElement } from 'react';
import { mulberry32 } from './rng';

type Pt = [number, number];
type Rnd = () => number;
const n2 = (v: number) => Math.round(v * 100) / 100;
const r2 = n2;
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const hx = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = (a: number[]) => '#' + a.map(v => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mixC = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const dk = (c: string, t: number) => mixC(c, '#000000', t);
const lumOf = (c: string) => { const [r, g, b] = hx(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const wpick = (rnd: Rnd, o: Record<string, number>) => { let t = 0; for (const k in o) t += o[k]; let r = rnd() * t; for (const k in o) if ((r -= o[k]) < 0) return k; return Object.keys(o)[0]; };
const bell = (rnd: Rnd) => (rnd() + rnd() + rnd() - 1.5) * 2; // mean 0, sd 1, never past ±3
// Catmull-Rom through pts[1..n-2] (the first and last points only steer the ends), k samples a segment.
function cr(pts: Pt[], k = 6): Pt[] {
  const o: Pt[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(d => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3)) as Pt);
    }
  }
  o.push(pts[pts.length - 2]);
  return o;
}
const crc = (p: Pt[], k = 6) => cr([p[p.length - 1], ...p, p[0], p[1]], k); // closed loop
const poly = (a: Pt[], close = true) => 'M' + a.map(p => n2(p[0]) + ' ' + n2(p[1])).join('L') + (close ? 'Z' : '');
const pt = (x: number, y: number) => n2(x) + ' ' + n2(y);

// ── What a face can have (the editor offers the same lists) ──
const SKIN_RAMP = ['#f8e2d0', '#f1cfb6', '#e7bd9e', '#dbaa87', '#cc9772', '#b9825e', '#a26c4a', '#895a3b', '#71462d', '#5a3622', '#43281a'];
const UNDERTONES: Record<string, string | null> = { neutral: null, warm: '#e3a35c', olive: '#9c9a5a', rosy: '#e3958a' };
export const skinColor = (tone: number, under = 'neutral') => {
  const x = cl(tone) * (SKIN_RAMP.length - 1), i = Math.min(SKIN_RAMP.length - 2, Math.floor(x)), c = mixC(SKIN_RAMP[i], SKIN_RAMP[i + 1], x - i), u = UNDERTONES[under];
  return u ? mixC(c, u, 0.09) : c;
};
export const HAIR_COLORS: Record<string, [string, string]> = {
  black: ['Black', '#121010'], softBlack: ['Soft black', '#1e1814'], darkBrown: ['Dark brown', '#2d2119'], brown: ['Brown', '#4a3421'], lightBrown: ['Light brown', '#6c4b2d'],
  darkBlonde: ['Dark blond', '#8e6b41'], blonde: ['Blond', '#b89159'], lightBlonde: ['Light blond', '#d3b47c'], auburn: ['Auburn', '#5f2d1b'], red: ['Red', '#8b3b1f'], ginger: ['Ginger', '#a9562c'],
};
export const DYES: Record<string, [string, string]> = {
  bleach: ['Bleached blond', '#dcc089'], platinum: ['Platinum', '#ebe3cc'], honey: ['Honey blond', '#bc8c4f'], copper: ['Copper', '#a8552b'],
  burgundy: ['Burgundy', '#5f1f2c'], ash: ['Ash brown', '#7b6e63'], silver: ['Silver', '#c2c6ca'], jet: ['Jet black', '#0c0c0e'],
};
export const DYE_KINDS = [['full', 'All over'], ['highlights', 'Highlights'], ['tips', 'Frosted tips']];
export const EYE_COLORS: Record<string, [string, string]> = {
  dark: ['Dark brown', '#2a1b11'], brown: ['Brown', '#3f2817'], amber: ['Amber', '#6e4c22'], hazel: ['Hazel', '#6f6b3b'], green: ['Green', '#58714b'], grey: ['Grey', '#7b8890'], blue: ['Blue', '#4e7ba6'], lightBlue: ['Light blue', '#7ba2c5'],
};
// Hair styles. ear/side/top: how far the hair stands off the head at ear level, at the temples and at the
// crown; op: a cut so short the scalp shows through; fade: faded sides (skin, low, mid, high); fringe:
// what the front edge does instead of following the hairline; back: hair behind the head.
export const HAIR_STYLES: Record<string, any> = {
  bald: { label: 'Shaved bald', bald: 1 },
  shaved: { label: 'Shaved (stubble)', op: 0.3, ear: 0, side: 0.2, top: 0.3 },
  buzz: { label: 'Buzz cut', op: 0.64, ear: 0.1, side: 0.4, top: 0.7 },
  crew: { label: 'Crew cut', fade: 'taper', side: 1.2, top: 2.6 },
  fade: { label: 'Fade', fade: 'mid', side: 1.6, top: 2.8 },
  caesar: { label: 'Caesar', fade: 'low', side: 1, top: 1.8, fringe: 'line' },
  waves: { label: 'Waves', ear: 0.3, side: 0.8, top: 1.4, waves: 1 },
  shortAfro: { label: 'Short afro', ear: 1.4, side: 3.4, top: 6, bump: 1 },
  afro: { label: 'Afro', ear: 4, side: 9, top: 12, bump: 1.2, back: 'afro' },
  twists: { label: 'Twists', fade: 'low', side: 3, top: 6.5, twists: 1, bump: 1.1 },
  frohawk: { label: 'Frohawk', fade: 'high', strip: 0.5, top: 9, bump: 1.1 },
  mohawk: { label: 'Mohawk', fade: 'skin', strip: 0.3, top: 7, spikes: 7 },
  locsShort: { label: 'Short locs', ear: 2, side: 3, top: 4.5, locs: 0.3, back: 'locs' },
  locsLong: { label: 'Long locs', ear: 2, side: 3, top: 4.5, locs: 1, back: 'locs' },
  locsUp: { label: 'Locs, tied up', fade: 'low', side: 2, top: 3, locs: 0, back: 'knot' },
  cornrows: { label: 'Cornrows', ear: 0.2, side: 0.6, top: 1.2, rows: 7 },
  braids: { label: 'Box braids', ear: 0.6, side: 1, top: 1.6, rows: 9, back: 'braids' },
  curlyTop: { label: 'Curly top, faded', fade: 'mid', side: 2.6, top: 7.5, bump: 1, curls: 3 },
  curlyMop: { label: 'Curly mop', ear: 2.4, side: 4, top: 8, bump: 1.1, fringe: 'curls' },
  sidepart: { label: 'Side part', ear: 0.6, side: 1.8, top: 4, part: 1, sweep: 1 },
  slick: { label: 'Slicked back', ear: 0.5, side: 1.4, top: 3.6, flow: 'back', shine: 1.6 },
  quiff: { label: 'Quiff', fade: 'mid', side: 2.4, top: 5, quiff: 6 },
  crop: { label: 'Textured crop', fade: 'mid', side: 1.6, top: 3.2, fringe: 'crop' },
  fringe: { label: 'Fringe', ear: 1.4, side: 2.4, top: 4.2, fringe: 'long' },
  curtains: { label: 'Middle part', ear: 1.6, side: 2.6, top: 4.4, fringe: 'curtains' },
  messy: { label: 'Messy', ear: 1.2, side: 2.6, top: 5, tufts: 7, fringe: 'messy' },
  spiky: { label: 'Spiky', ear: 0.5, side: 1.6, top: 3.6, spikes: 10 },
  undercut: { label: 'Undercut', fade: 'skin', side: 2.8, top: 6, sweep: 1.4, part: 1 },
  manbun: { label: 'Man bun', ear: 0.5, side: 1.2, top: 2.6, flow: 'back', back: 'bun' },
  long: { label: 'Long', ear: 2.6, side: 3, top: 4.6, back: 'long', curtain: 1 },
  mullet: { label: 'Mullet', ear: 0.8, side: 1.6, top: 3.4, fringe: 'crop', back: 'mullet' },
  shag: { label: 'Shag', ear: 2.4, side: 3.4, top: 5.2, fringe: 'messy', back: 'shag', curtain: 0.5 },
  hightop: { label: 'High-top fade', fade: 'high', box: 14 },
  flattop: { label: 'Flat-top', fade: 'mid', box: 7.5 },
  // Mostly women's styles (a female face, makeFace's fem).
  bob: { label: 'Bob', ear: 2.8, side: 3.2, top: 4.8, fringe: 'long', back: 'shag' },
  longPart: { label: 'Long, middle part', ear: 2.6, side: 3, top: 4.6, fringe: 'curtains', back: 'long', curtain: 1 },
  longCurls: { label: 'Long curls', ear: 3.2, side: 4.4, top: 7, bump: 1.1, fringe: 'curls', back: 'long', curtain: 1 },
  bun: { label: 'Bun', ear: 0.4, side: 1.1, top: 2.4, flow: 'back', back: 'bun' },
  pixie: { label: 'Pixie cut', ear: 0.8, side: 1.8, top: 3.8, fringe: 'crop', sweep: 1, part: 1 },
};
export const FACE_OPTS = {
  expr: [['serious', 'Serious'], ['slight', 'Slight smile'], ['smile', 'Smile'], ['relaxed', 'Relaxed'], ['mean', 'Mean mug'], ['smirk', 'Smirk']],
  eyes: [['almond', 'Almond'], ['round', 'Round'], ['hooded', 'Hooded'], ['monolid', 'Monolid'], ['deepset', 'Deep-set'], ['downturned', 'Downturned'], ['upturned', 'Upturned']],
  brows: [['straight', 'Straight'], ['soft', 'Soft arch'], ['arched', 'Arched'], ['angled', 'Angled'], ['flat', 'Low and flat'], ['bushy', 'Bushy']],
  hairline: [['natural', 'Natural'], ['shapeup', 'Shape-up'], ['straight', 'Straight'], ['peak', 'Widow’s peak'], ['round', 'Rounded']],
  under: [['neutral', 'Neutral'], ['warm', 'Warm'], ['olive', 'Olive'], ['rosy', 'Rosy']],
  facial: [['none', 'Clean-shaven'], ['stubble', 'Stubble'], ['heavyStubble', 'Heavy stubble'], ['patchy', 'Patchy'], ['mustache', 'Mustache'], ['soulpatch', 'Soul patch'], ['chinpuff', 'Chin puff'], ['goatee', 'Goatee'], ['circle', 'Circle beard'], ['vandyke', 'Van Dyke'], ['chinstrap', 'Chinstrap'], ['chinstrapMustache', 'Chinstrap and mustache'], ['shortBeard', 'Short beard'], ['fullBeard', 'Full beard'], ['thickBeard', 'Thick beard']],
  headband: [['team', 'Team color'], ['team2', 'Team trim'], ['white', 'White'], ['black', 'Black'], ['red', 'Red'], ['navy', 'Navy'], ['grey', 'Grey']],
  headbandKind: [['standard', 'Standard'], ['thin', 'Thin'], ['wide', 'Wide'], ['tied', 'Tied']],
  metal: [['diamond', 'Diamond'], ['gold', 'Gold'], ['silver', 'Silver'], ['black', 'Black']],
  glasses: [['rect', 'Rectangular'], ['round', 'Round'], ['browline', 'Browline'], ['rimless', 'Rimless'], ['goggles', 'Sports goggles']],
  frame: [['black', 'Black'], ['tortoise', 'Tortoiseshell'], ['metal', 'Metal'], ['clear', 'Clear']],
  undershirt: [['white', 'White'], ['black', 'Black'], ['team', 'Team color']],
};
const HAIR_LABELS = Object.keys(HAIR_STYLES).map(k => [k, HAIR_STYLES[k].label]);
export const hairStyleOpts = () => HAIR_LABELS;

// ── Generation ──
const RACES = ['white', 'black', 'asian', 'brown'];
// Skin tone (0 lightest … 1 darkest): mean, spread and limits by look; the ranges overlap.
const TONE: Record<string, number[]> = { white: [0.13, 0.085, 0, 0.37], asian: [0.21, 0.085, 0.04, 0.43], brown: [0.43, 0.125, 0.18, 0.72], black: [0.72, 0.135, 0.42, 1] };
const UNDER_W: Record<string, Record<string, number>> = { white: { neutral: 35, rosy: 33, warm: 17, olive: 15 }, asian: { warm: 45, neutral: 30, olive: 25 }, brown: { warm: 40, olive: 34, neutral: 26 }, black: { neutral: 45, warm: 40, rosy: 15 } };
const NAT_W: Record<string, Record<string, number>> = {
  white: { black: 6, softBlack: 8, darkBrown: 26, brown: 22, lightBrown: 12, darkBlonde: 9, blonde: 7, lightBlonde: 3, auburn: 3, red: 2, ginger: 2 },
  black: { black: 55, softBlack: 35, darkBrown: 10 }, asian: { black: 50, softBlack: 38, darkBrown: 12 }, brown: { black: 38, softBlack: 34, darkBrown: 22, brown: 6 },
};
const TEX_W: Record<string, Record<string, number>> = { black: { coily: 74, curly: 20, wavy: 6 }, white: { straight: 48, wavy: 36, curly: 16 }, asian: { straight: 76, wavy: 18, curly: 6 }, brown: { straight: 28, wavy: 38, curly: 28, coily: 6 } };
// Hair styles by texture (what the hair can do), not by who wears it.
const STYLE_W: Record<string, Record<string, number>> = {
  coily: { fade: 13, waves: 9, buzz: 9, caesar: 5, crew: 4, shortAfro: 7, twists: 7, locsShort: 5, locsLong: 4, locsUp: 3, cornrows: 5, braids: 3, afro: 3, curlyTop: 4, frohawk: 2, hightop: 1.5, flattop: 2, shaved: 5, bald: 4, mohawk: 0.5, manbun: 0.5 },
  curly: { curlyTop: 10, curlyMop: 8, fade: 8, crop: 6, shortAfro: 4, buzz: 7, crew: 6, locsShort: 2, twists: 2, long: 3, manbun: 3, mullet: 1, undercut: 3, sidepart: 2, messy: 3, shag: 2, shaved: 4, bald: 3, braids: 1, cornrows: 1, frohawk: 1 },
  wavy: { crop: 8, sidepart: 7, messy: 7, quiff: 6, slick: 5, fringe: 5, curtains: 5, crew: 7, fade: 7, buzz: 6, undercut: 5, long: 3, manbun: 3, mullet: 1.5, shag: 3, shaved: 4, bald: 3, curlyTop: 2, spiky: 1, braids: 0.5, cornrows: 0.5, locsShort: 0.5 },
  straight: { crop: 9, sidepart: 8, fringe: 7, spiky: 5, messy: 6, quiff: 6, slick: 5, curtains: 5, crew: 7, fade: 7, buzz: 7, undercut: 6, long: 2.5, manbun: 2.5, mullet: 1.5, shaved: 4, bald: 3, mohawk: 0.6, cornrows: 0.5, braids: 0.5, shag: 1.5 },
};
const FEM_STYLE_W: Record<string, Record<string, number>> = {
  coily: { afro: 12, shortAfro: 8, braids: 16, locsLong: 10, locsUp: 8, twists: 8, bun: 8, longCurls: 6, cornrows: 3, buzz: 2, bob: 4, pixie: 3 },
  curly: { longCurls: 22, curlyMop: 8, bun: 10, bob: 8, long: 10, shag: 6, pixie: 4, braids: 3 },
  wavy: { long: 20, longPart: 14, bob: 12, bun: 10, shag: 8, pixie: 5, slick: 4, longCurls: 4, sidepart: 3 },
  straight: { long: 22, longPart: 16, bob: 14, bun: 10, shag: 6, pixie: 5, fringe: 5, slick: 3 },
};
const SHAPEUP_STYLES = new Set(['fade', 'caesar', 'waves', 'buzz', 'crew', 'twists', 'flattop', 'hightop', 'frohawk', 'curlyTop', 'crop', 'cornrows', 'shortAfro']);
const TIPS_OK = new Set(['fade', 'crew', 'crop', 'spiky', 'twists', 'flattop', 'hightop', 'curlyTop', 'shortAfro', 'messy', 'frohawk', 'mohawk', 'quiff']);

export function makeFace(p: any, salt = 0, kin?: any) {
  const base = Math.floor(p.faceSeed ?? p.id ?? 0) | 0, seed = (Math.imul(base, 7919) + 13 + Math.imul(salt | 0, 104729)) | 0;
  const rnd = mulberry32(seed), race = RACES.includes(p.race) ? p.race : 'white', age = p.age ?? 25, fem = !!p.fem; // a missing look never breaks a page
  const k = kin && kin.v === 3 ? kin : null, same = !!k && k.race === race;
  // Build: heavier for his height → a fuller face and neck.
  const hm = /(\d+)\D+(\d+)/.exec(p.hgt || ''), hIn = hm ? +hm[1] * 12 + +hm[2] : 0;
  const build = r2(cl((hIn && p.wt ? (p.wt - (hIn * 2.9 + 7.5)) / 14 : 0) + bell(rnd) * 0.18, -1, 1));
  const [tm, ts, tlo, thi] = TONE[race];
  let tone = cl(tm + ts * bell(rnd), tlo, thi), under = wpick(rnd, UNDER_W[race]);
  if (k) { tone = cl(same ? k.skin.tone + 0.03 * bell(rnd) : (tone + k.skin.tone) / 2); if (rnd() < 0.8) under = k.skin.under; }
  const blend = (a: any, b: any, keys: string[], t: number) => { if (b) keys.forEach(x => { if (typeof b[x] === 'number') a[x] = r2(a[x] * (1 - t) + b[x] * t); }); };
  const head: any = { w: r2(0.9 + 0.2 * rnd() + build * 0.03), h: r2(0.94 + 0.13 * rnd()), sq: r2(rnd()), cheek: r2(0.97 + 0.07 * rnd()), jaw: r2(cl(0.78 + 0.19 * rnd() + build * 0.04, 0.74, 0.99)), jawY: r2(0.62 + 0.2 * rnd()), chin: r2(rnd()), chinW: r2(cl(0.3 + 0.2 * rnd() + build * 0.04, 0.26, 0.54)), cleft: rnd() < 0.07 };
  if (fem) { head.jaw = r2(Math.min(head.jaw, 0.74 + 0.1 * rnd())); head.chinW = r2(Math.min(head.chinW, 0.26 + 0.08 * rnd())); head.sq = r2(head.sq * 0.4); head.cleft = false; } // a softer, narrower jaw
  const ears: any = { size: r2(0.85 + 0.3 * rnd()), out: r2(rnd()) };
  const eShape = wpick(rnd, race === 'asian' ? { almond: 26, round: 10, hooded: 14, monolid: 32, deepset: 4, downturned: 6, upturned: 8 } : { almond: 30, round: 16, hooded: 16, monolid: 3, deepset: 13, downturned: 10, upturned: 12 });
  const lightEyes = rnd() < ({ white: 0.55, brown: 0.07, asian: 0.015, black: 0.02 } as any)[race];
  const eyes: any = { shape: eShape, size: r2(0.9 + 0.22 * rnd()), spacing: r2(0.93 + 0.14 * rnd()), tilt: r2(eShape === 'upturned' ? 0.12 + 0.06 * rnd() : eShape === 'downturned' ? -0.07 - 0.05 * rnd() : (rnd() - 0.45) * 0.14), lid: r2(rnd()), color: lightEyes ? wpick(rnd, { amber: 12, hazel: 22, green: 20, grey: 10, blue: 26, lightBlue: 10 }) : wpick(rnd, { dark: 55, brown: 45 }) };
  const bShape = wpick(rnd, { straight: 24, soft: 26, arched: 14, angled: 12, flat: 12, bushy: 12 });
  const brows: any = { shape: fem && bShape === 'bushy' ? 'arched' : bShape, thick: r2(fem ? 0.6 + 0.35 * rnd() : 0.85 + 0.7 * rnd() + (bShape === 'bushy' ? 0.4 : 0)), len: r2(rnd()), gap: r2(rnd()), tilt: r2((rnd() - 0.5) * 0.4), slit: rnd() < 0.035 ? (rnd() < 0.7 ? 1 : 2) : 0 };
  const nb = ({ black: 0.2, brown: 0.08, asian: 0.05 } as any)[race] || 0, lb = race === 'black' ? 0.22 : race === 'brown' ? 0.08 : 0;
  const nose: any = { w: r2(cl(rnd() * 0.85 + nb + build * 0.08)), len: r2(rnd()), bridge: r2(rnd()), tip: r2(rnd()), flare: r2(rnd()), crook: rnd() < 0.03 ? (rnd() < 0.5 ? -1 : 1) : 0 };
  const mouth: any = { w: r2(rnd()), upper: r2(cl(rnd() * 0.8 + lb + (fem ? 0.2 : 0))), lower: r2(cl(rnd() * 0.8 + lb + 0.05 + (fem ? 0.2 : 0))), bow: r2(rnd()) };
  if (k) {
    blend(head, k.head, ['w', 'h', 'sq', 'cheek', 'jaw', 'jawY', 'chin', 'chinW'], 0.5); blend(nose, k.nose, ['w', 'len', 'bridge', 'tip', 'flare'], 0.6);
    blend(mouth, k.mouth, ['w', 'upper', 'lower', 'bow'], 0.5); blend(ears, k.ears, ['size', 'out'], 0.6); blend(eyes, k.eyes, ['size', 'spacing', 'tilt'], 0.5);
    if (rnd() < 0.6) eyes.color = k.eyes.color; if (rnd() < 0.5) eyes.shape = k.eyes.shape; if (rnd() < 0.5) brows.shape = k.brows.shape;
  }
  const expr = wpick(rnd, { serious: 28, slight: 24, relaxed: 16, smile: 13, mean: 12, smirk: 7 });
  // Age: lines, grey and a receding hairline arrive at different ages for different people.
  const lines = r2(cl((age - 27) / 14) * (0.6 + 0.4 * rnd())), greyAt = 27 + 26 * rnd() + (fem ? 12 : 0), /* many women color theirs */ grey = r2(cl((age - greyAt) / 12, 0, 0.9));
  const beardGrey = r2(cl((age - greyAt + 3 - 4 * rnd()) / 10, 0, 0.9)), recAt = 22 + 32 * rnd(), recede = fem ? 0 : r2(cl((age - recAt) / 12) * (rnd() < 0.55 ? 1 : 0.35));
  const bags = r2(cl(lines * 0.7 + rnd() * 0.15));
  let tex = wpick(rnd, TEX_W[race]), natural = wpick(rnd, NAT_W[race]);
  if (k) { if (rnd() < 0.8) tex = k.hair.tex; if (rnd() < 0.75) natural = k.hair.natural; }
  const sw = fem ? { ...FEM_STYLE_W[tex] || FEM_STYLE_W.straight } : { ...STYLE_W[tex] || STYLE_W.straight };
  if (fem && age > 50) ['long', 'longPart', 'longCurls', 'braids', 'locsLong'].forEach(x => { if (sw[x]) sw[x] *= 0.45; }); // shorter styles later in life
  if (!fem) sw.bald = (sw.bald || 0) * (1 + Math.max(0, age - 29) * 0.25) * (1 + recede * 3); sw.shaved = (sw.shaved || 0) * (1 + recede * 2);
  if (age > 32) ['long', 'manbun', 'mullet', 'locsLong'].forEach(x => { if (sw[x]) sw[x] *= 0.6; });
  const style = wpick(rnd, sw);
  const hairline = wpick(rnd, SHAPEUP_STYLES.has(style) ? { shapeup: 45, natural: 30, straight: 13, peak: 6, round: 6 } : { natural: 50, straight: 16, peak: 10, round: 18, shapeup: 6 });
  const dr = rnd(), dyeKind = dr < 0.07 ? 'full' : dr < 0.1 ? 'highlights' : dr < 0.118 && TIPS_OK.has(style) ? 'tips' : null;
  const lightNat = lumOf(HAIR_COLORS[natural][1]) > 0.25, dyePick = wpick(rnd, { bleach: 34, platinum: 14, honey: 16, copper: 9, burgundy: 7, ash: 6, silver: 6, ...(lightNat ? { jet: 10 } : {}) });
  const dye = dyeKind && style !== 'bald' && style !== 'shaved' ? dyePick : null;
  const hair: any = { style, tex, natural, dye, dyeKind: dye ? dyeKind : null, hairline, high: r2(rnd()), recede, grey, part: rnd() < 0.5 ? -1 : 1, len: r2(rnd()), sb: r2(rnd()) };
  const fw = age < 20 ? { none: 50, patchy: 18, stubble: 18, mustache: 4, soulpatch: 4, chinpuff: 6 }
    : age < 23 ? { none: 34, stubble: 18, patchy: 8, heavyStubble: 6, goatee: 6, circle: 6, mustache: 4, shortBeard: 8, chinstrap: 3, soulpatch: 3, chinpuff: 3, fullBeard: 1 }
    : { none: 26, stubble: 14, heavyStubble: 9, mustache: 4, goatee: 6, circle: 8, vandyke: 2, chinstrap: 3, chinstrapMustache: 3, shortBeard: 10, fullBeard: 8, thickBeard: 3, soulpatch: 2, chinpuff: 2, patchy: 2 };
  const fStyle = fem ? 'none' : wpick(rnd, fw), fDen = rnd();
  const facial: any = { style: fStyle, density: r2(fStyle === 'patchy' ? 0.45 : 0.65 + 0.35 * fDen), grey: beardGrey };
  // Accessories, each drawn on its own: headbands are common, earrings fairly common, nose studs
  // uncommon, lip and eyebrow rings rare, glasses and face shields exceptionally rare.
  const metal = () => wpick(rnd, { diamond: 45, gold: 22, silver: 18, black: 15 }), side = () => (rnd() < 0.5 ? -1 : 1);
  const a = Array.from({ length: 9 }, () => rnd());
  const acc: any = {
    headband: !fem && a[0] < 0.13 ? { color: wpick(rnd, { team: 30, team2: 18, white: 22, black: 20, red: 4, navy: 3, grey: 3 }), kind: wpick(rnd, { standard: 60, thin: 25, wide: 12, tied: 3 }) } : null,
    earrings: a[1] < (fem ? 0.75 : 0.19) ? { kind: wpick(rnd, { stud: 80, hoop: 20 }), metal: metal(), both: rnd() < 0.62 } : null,
    nose: a[2] < 0.035 ? { kind: 'stud', metal: metal(), side: side() } : a[2] < 0.047 ? { kind: wpick(rnd, { ring: 60, septum: 40 }), metal: metal(), side: side() } : null,
    lip: a[3] < 0.007 ? { kind: wpick(rnd, { ring: 70, labret: 30 }), metal: metal(), side: side() } : null,
    brow: a[4] < 0.007 ? { metal: metal(), side: side() } : null,
    glasses: a[5] < 0.004 ? { kind: wpick(rnd, { rect: 30, round: 20, goggles: 30, rimless: 10, browline: 10 }), color: wpick(rnd, { black: 40, tortoise: 20, metal: 20, clear: 20 }) } : null,
    shield: a[5] >= 0.004 && a[6] < 0.003 ? { kind: wpick(rnd, { clear: 60, black: 40 }) } : null,
    undershirt: !fem && a[7] < 0.05 ? wpick(rnd, { white: 40, black: 40, team: 20 }) : null,
  };
  const marks: any = { freckles: a[8] < (tone < 0.35 ? 0.075 : 0.025) ? r2(0.4 + 0.6 * rnd()) : 0, mole: rnd() < 0.1 ? [r2(rnd() * 2 - 1), r2(rnd())] : null, tattoo: rnd() < 0.06 ? { side: side(), kind: rnd() < 0.5 ? 'script' : 'design' } : null, dimples: rnd() < 0.14 };
  const face: any = { v: 3, generator: 'Basketball Manager faces', seed: seed >>> 0, race, ...(fem ? { fem: true } : {}), skin: { tone: r2(tone), under }, build, head, ears, eyes, brows, nose, mouth, expr, hair, facial, acc, marks, age: { years: age, lines, bags } };
  if (p.faceX) applyFaceX(face, p.faceX);
  return finishFace(face);
}

// Edits from the face editor: { 'hair.style': 'afro', 'acc.glasses': {...}, ... } laid over the face.
export function applyFaceX(face: any, x: Record<string, any>) {
  Object.entries(x || {}).forEach(([path, v]) => { const ks = path.split('.'); let o = face; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = v; });
  return face;
}
// The colors a face is drawn in, from its genes (natural hair, dye, grey; skin tone and undertone).
export function finishFace(f: any) {
  f.skin.color = skinColor(f.skin.tone, f.skin.under);
  const H = f.hair, nat = (HAIR_COLORS[H.natural] || HAIR_COLORS.black)[1], greyC = H.grey > 0.6 ? '#d4d1cb' : '#a9a6a0';
  H.natHex = mixC(nat, greyC, H.grey * 0.85);
  H.dyeHex = H.dye ? (DYES[H.dye] || DYES.bleach)[1] : null;
  H.color = H.dyeHex && H.dyeKind === 'full' ? H.dyeHex : H.natHex;
  f.eyes.hex = (EYE_COLORS[f.eyes.color] || EYE_COLORS.dark)[1];
  f.facial.color = mixC(nat, '#c9c5bd', (f.facial.grey || 0) * 0.85);
  return f;
}

// ── Drawing ──
// Expressions: mouth corners (negative = up), mouth open (teeth), eyelids, lower lids (cheeks pushing
// up), inner brows (positive = drawn down), cheeks raised.
const EXPR: Record<string, any> = {
  serious: { cL: 0.15, cR: 0.15, open: 0, lid: 1, low: 1, brIn: 0.5, cheek: 0 },
  slight: { cL: -0.85, cR: -0.85, open: 0, lid: 0.97, low: 0.92, brIn: 0, cheek: 0.35 },
  smile: { cL: -1.9, cR: -1.9, open: 1, lid: 0.86, low: 0.72, brIn: -0.2, cheek: 1 },
  relaxed: { cL: -0.35, cR: -0.35, open: 0, part: 0.45, lid: 0.86, low: 1, brIn: 0, cheek: 0.1 },
  mean: { cL: 0.55, cR: 0.55, open: 0, lid: 0.74, low: 0.88, brIn: 1.5, cheek: 0, press: 0.82 },
  smirk: { cL: -1.3, cR: 0.05, open: 0, lid: 0.95, low: 0.9, brIn: 0.2, cheek: 0.45, raise: 0.7 },
};
const EYE_SHAPES: Record<string, number[]> = { almond: [2.25, 1.25], round: [2.7, 1.7], hooded: [2.1, 1.3], monolid: [1.75, 1.05], deepset: [2.2, 1.3], downturned: [2.2, 1.35], upturned: [2.3, 1.2] };
const BROW_SHAPES: Record<string, number[]> = { straight: [0.35, 0.7], soft: [1.0, 1.3], arched: [1.6, 1.8], angled: [1.45, 2.1], flat: [0.15, 0.35], bushy: [0.6, 1.0] };
const HAIRLINES: Record<string, number[]> = { natural: [0.5, 0, 0], shapeup: [-0.1, 0, 1], straight: [0.1, 0, 0.6], peak: [0.5, 1, 0], round: [1.4, 0, 0] }; // curve, peak, sharp corners
const METALS: Record<string, string> = { diamond: '#eef4f9', gold: '#d6a92e', silver: '#c8ccd1', black: '#1c1c1e' };
const BAND: Record<string, string> = { white: '#f4f4f2', black: '#1b1b1d', red: '#c8202f', navy: '#1d2f5e', grey: '#8d9196' };
const FRAME: Record<string, string> = { black: '#161616', tortoise: '#5b3a20', metal: '#a9adb2', clear: '#cfd6dc' };

export function faceSvg(f: any, jersey: [string, string] = ['#605d5d', '#bab6b6']) {
  const out: any[] = []; let kk = 0;
  const add = (t: string, a: Record<string, any>) => { out.push(createElement(t, { key: kk++, ...a })); };
  const opa = (op?: number) => (op != null && op < 1 ? { opacity: n2(Math.max(0, op)) } : null);
  const P = (d: string, fill: string, op?: number, ex?: Record<string, any>) => add('path', { d, fill, ...opa(op), ...ex });
  const S = (d: string, c: string, w: number, op?: number) => add('path', { d, fill: 'none', stroke: c, strokeWidth: n2(w), strokeLinecap: 'round', strokeLinejoin: 'round', ...opa(op) });
  const E = (x: number, y: number, rx: number, ry: number, fill: string, op?: number, rot?: number) => add('ellipse', { cx: n2(x), cy: n2(y), rx: n2(rx), ry: n2(ry), fill, ...opa(op), ...(rot ? { transform: `rotate(${n2(rot)} ${n2(x)} ${n2(y)})` } : null) });
  const C = (x: number, y: number, r: number, fill: string, op?: number) => add('circle', { cx: n2(x), cy: n2(y), r: n2(r), fill, ...opa(op) });
  const R = mulberry32((f.seed || 1) ^ 0x2c1b3c6d); // placement of curls, strands and freckles
  // Soft light and shade: the same shape three times, smaller and fainter each time, so it fades out at
  // its edges the way a gradient would.
  const SE = (x: number, y: number, rx: number, ry: number, fill: string, op: number, rot?: number) => [1, 0.7, 0.42].forEach((k, i) => E(x, y, rx * k, ry * k, fill, op * (i ? 0.36 : 0.42), rot));
  const inside = (a: Pt[], x: number, y: number) => { let c = false; for (let i = 0, j = a.length - 1; i < a.length; j = i++) if ((a[i][1] > y) !== (a[j][1] > y) && x < ((a[j][0] - a[i][0]) * (y - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) c = !c; return c; };
  // Many small dots in one color as a single path.
  const dots = (a: Pt[], r: number, fill: string, op: number) => { if (a.length) P(a.map(([x, y]) => `M${pt(x - r, y)}a${n2(r)} ${n2(r)} 0 1 0 ${n2(2 * r)} 0a${n2(r)} ${n2(r)} 0 1 0 ${n2(-2 * r)} 0`).join(''), fill, op); };
  const stipple = (a: Pt[], n: number, color: string, op: number, r = 0.22) => { let x0 = 99, x1 = 0, y0 = 999, y1 = 0; a.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); const o: Pt[] = []; for (let i = 0; i < n * 4 && o.length < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (inside(a, x, y)) o.push([x, y]); } dots(o, r, color, op); };
  const J = jersey, X = EXPR[f.expr] || EXPR.serious;

  // ── Geometry: a superellipse cranium, then cheeks, jaw and chin ──
  const Hd = f.head, cx = 50, cy = 59, rw = 23.4 * Hd.w, rh = 29.2 * Hd.h, sq = 2 + 0.9 * Hd.sq, build = f.build || 0;
  const chinY = cy + rh * (0.97 + 0.12 * Hd.chin), crown = cy - rh;
  const cran = (th: number, off = 0): Pt => { const c = Math.cos(th), s = Math.sin(th); return [cx + (rw + off) * Math.sign(c) * Math.pow(Math.abs(c), 2 / sq), cy - (rh + off) * Math.pow(Math.abs(s), 2 / sq)]; };
  const halfW = (y: number) => { const t = Math.abs(cy - y) / rh; return t >= 1 ? 0 : rw * Math.pow(1 - Math.pow(t, sq), 1 / sq); };
  const upR: Pt[] = []; for (let i = 0; i <= 16; i++) upR.push(cran((Math.PI / 2) * (1 - i / 16)));
  const jawX = rw * Hd.jaw, jawY = cy + rh * Hd.jawY, chinX = rw * Hd.chinW;
  const lowR = cr([[cx + rw, cy - 8], [cx + rw, cy], [cx + rw * Hd.cheek, cy + rh * 0.17], [cx + jawX, jawY], [cx + chinX, chinY - rh * 0.075], [cx, chinY], [cx - chinX, chinY - rh * 0.075]], 7);
  const mir = (a: Pt[]) => a.map(([x, y]) => [2 * cx - x, y] as Pt);
  const rightHalf = [...upR, ...lowR.slice(1)], outline = [...rightHalf, ...mir(rightHalf).reverse().slice(1, -1)];
  const ey = cy + rh * 0.03, nl = (chinY - ey) * (0.42 + 0.08 * f.nose.len), noseY = ey + nl, my = noseY + (chinY - noseY) * 0.35;
  const ex = rw * 0.415 * f.eyes.spacing, ea = 3.9 * f.eyes.size;
  const nW = rw * (0.52 + 0.07 * build) * (f.fem ? 0.84 : 1), shY = chinY + 10.5;
  const sk = f.skin.color, tone = f.skin.tone, shd = mixC(sk, '#2a120a', 0.45), hil = mixC(sk, '#fff6ee', 0.5);
  const so = 0.15 + 0.07 * tone, ho = 0.1 + 0.16 * tone; // shading and highlight strength (sheen shows more on darker skin)
  const N = f.nose, nhw = 3.3 + 1.8 * N.w + build * 0.2, crook = (N.crook || 0) * 0.8;
  const mhw = rw * (0.36 + 0.1 * f.mouth.w) * (f.expr === 'smile' ? 1.06 : f.expr === 'mean' ? 0.96 : 1);
  const ut = (0.95 + 1.05 * f.mouth.upper) * (X.press || 1), lt = (1.7 + 1.6 * f.mouth.lower) * (X.press || 1), cL = X.cL, cR = X.cR;
  const by = ey - 5.6 - 1.2 * f.brows.gap;

  // ── Hair geometry ──
  const HR = f.hair, spec = HAIR_STYLES[HR.style] || HAIR_STYLES.crew, hc = HR.color, hn = HR.natHex;
  const hcD = dk(hc, 0.34), hcL = mixC(hc, '#ffffff', lumOf(hc) < 0.12 ? 0.2 : 0.24);
  const lenF = 0.85 + 0.3 * (HR.len ?? 0.5), vol = { ear: spec.ear ?? 0.3, side: spec.side ?? 1, top: (spec.top ?? 2) * lenF };
  const xT = rw * 0.8, HLs = HAIRLINES[HR.hairline] || HAIRLINES.natural, rec = HR.recede || 0;
  const hy0 = cy - rh * (0.6 + 0.08 * (HR.high ?? 0.5));
  const hlY = (x: number) => { const u = (x - cx) / xT, au = Math.min(1.2, Math.abs(u)); return hy0 - rec * rh * 0.07 + HLs[0] * 2.2 * u * u - rec * rh * 0.24 * Math.exp(-(((au - 0.72) / 0.24) ** 2)) + HLs[1] * 2.4 * Math.max(0, 1 - au / 0.26); };
  const zig = (x: number, amp: number, per: number) => amp * Math.abs((((x / per) % 2) + 2) % 2 - 1);
  const edgeY = (x: number): number => {
    const u = (x - cx) / xT, au = Math.abs(u);
    switch (spec.fringe) {
      case 'line': return hy0 + 1.4 + 1.2 * u * u;
      case 'crop': return hy0 + 3.4 + 1.4 * u * u - zig(x, 0.9, 1.6);
      case 'long': return by - 2.4 + 1.2 * au * au - zig(x + 0.7, 1.4, 2.2) + (HR.part || 1) * u * 1.1;
      case 'curtains': { const t = cl((au - 0.06) / 0.62); return hy0 - 0.8 + (by - 2.6 - hy0) * (t * t * (3 - 2 * t)); }
      case 'messy': return hy0 + 3.6 + 1.4 * u * u - zig(x * 1.3 + 2, 2.1, 2.6) - Math.sin(x * 1.7) * 0.6;
      case 'curls': return hy0 + 3.8 + 1.6 * u * u - 1.1 * Math.abs(Math.sin((x - cx) * 0.9));
      default: return hlY(x);
    }
  };
  const sbY = ey - 1.5 + (HR.sb ?? 0.5) * (noseY - ey) * 0.5, xS = rw * 0.85;
  const F: Pt[] = [[cx - rw * 0.995, sbY], [cx - xS, sbY]];
  { const yL = edgeY(cx - xT), yR = edgeY(cx + xT), round = HLs[2] < 0.5;
    F.push([cx - xS, (sbY + yL) / 2 + 0.5]); if (round) F.push([cx - xS + 0.4, yL + 1.4]);
    for (let i = 0; i <= 26; i++) { const x = cx - xT + (2 * xT * i) / 26; F.push([x, edgeY(x)]); }
    if (round) F.push([cx + xS - 0.4, yR + 1.4]); F.push([cx + xS, (sbY + yR) / 2 + 0.5], [cx + xS, sbY], [cx + rw * 0.995, sbY]); }
  const offF = (o: { ear: number; side: number; top: number }, bump = 0, bumpN = 16) => (th: number) => {
    const s = Math.sin(th);
    let v = s < 0.45 ? o.ear + (o.side - o.ear) * (s / 0.45) : o.side + (o.top - o.side) * Math.pow((s - 0.45) / 0.55, 1.6);
    if (bump) v += bump * (0.5 + 0.5 * Math.cos(th * bumpN + (f.seed % 7)));
    else if (o.top > 1.5 && (tex === 'straight' || tex === 'wavy')) v += 0.22 * Math.sin(th * 23 + (f.seed % 11)) + 0.16 * Math.sin(th * 41 + (f.seed % 13)); // hair, not a helmet
    if (spec.quiff) v += spec.quiff * lenF * Math.exp(-(((th - Math.PI / 2) / 0.33) ** 2));
    if (spec.sweep) v += spec.sweep * Math.max(0, -Math.cos(th) * (HR.part || 1)) * 1.6;
    return v;
  };
  const outer = (off: (th: number) => number, flat?: number): Pt[] => { const a: Pt[] = [[cx + rw * 0.995, sbY]]; for (let i = 0; i <= 60; i++) { const th = (Math.PI * i) / 60, q = cran(th, off(th)); if (flat != null) q[1] = Math.max(q[1], flat); a.push(q); } a.push([cx - rw * 0.995, sbY]); return a; };
  // The part of a polyline above y = yc (it rises, then falls), with the crossing points.
  const above = (a: Pt[], yc: number): Pt[] => { const o: Pt[] = []; for (let i = 0; i < a.length; i++) { const p = a[i], q = a[i - 1]; if (q && (q[1] - yc) * (p[1] - yc) < 0) { const t = (yc - q[1]) / (p[1] - q[1]); o.push([q[0] + (p[0] - q[0]) * t, yc]); } if (p[1] <= yc) o.push(p); } return o; };
  const cap = (B: Pt[], yc = 999) => poly([...above(B, yc), ...above(F, yc)]);
  const tex = HR.tex, bumpA = spec.bump ? spec.bump * (tex === 'coily' ? 0.8 : tex === 'curly' ? 1.2 : 0.6) : 0, bumpN = tex === 'coily' ? 26 : 16;
  const Bt = outer(offF({ ear: 0.15, side: 0.5, top: 0.9 })), Bv = outer(offF(vol, bumpA, bumpN));
  const topAt = (B: Pt[], x: number) => { let y = 999; for (let i = 1; i < B.length; i++) { const p = B[i - 1], q = B[i]; if ((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]) y = Math.min(y, p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0])); } return y; };
  const inHair = (B: Pt[], n: number, pad = 0.8, w = 0.8) => { const o: Pt[] = []; for (let i = 0; i < n * 3 && o.length < n; i++) { const x = cx + (R() * 2 - 1) * rw * w, t = topAt(B, x), e = Math.abs(x - cx) < xT ? edgeY(x) : sbY; if (t > 900 || e - t < 2 * pad) continue; o.push([x, t + pad + R() * (e - t - 2 * pad)]); } return o; };
  // Fades: how dense the sides are at the ear and just under the top, and where the top begins.
  const FADE: Record<string, any> = { skin: { from: 0.04, to: 0.4, top: cy - rh * 0.46 }, low: { from: 0.42, to: 0.85, top: cy - rh * 0.22 }, mid: { from: 0.16, to: 0.72, top: cy - rh * 0.42 }, high: { from: 0.1, to: 0.55, top: cy - rh * 0.6 }, taper: { from: 0.55, to: 0.9, top: cy - rh * 0.3 } };
  const afroPts = (): Pt[] => { const o: Pt[] = [], ax = rw + 8.5 * lenF, ay = rh + 6.5 * lenF, acy = cy - rh * 0.1; for (let i = 0; i <= 80; i++) { const a2 = -0.35 + ((Math.PI + 0.7) * i) / 80, b = bumpA * (0.5 + 0.5 * Math.cos(a2 * 24 + f.seed)); o.push([cx + (ax + b) * Math.cos(a2), acy - (ay + b) * Math.sin(a2)]); } return o; };

  // Hair behind the head (drawn first).
  const strand = (pts: Pt[], w: number, ticks: boolean) => {
    const d = 'M' + cr([pts[0], ...pts, pts[pts.length - 1]], 4).map(p => pt(p[0], p[1])).join('L');
    S(d, hcD, w + 0.7); S(d, hc, w);
    if (ticks) { let tk = ''; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L; for (let t = 0.3; t < L; t += 1.9) { const x = x0 + ((x1 - x0) * t) / L, y = y0 + ((y1 - y0) * t) / L; tk += `M${pt(x - (nx * w) / 2, y - (ny * w) / 2)}L${pt(x + (nx * w) / 2, y + (ny * w) / 2)}`; } } S(tk, hcD, 0.32, 0.55); }
  };
  const back = spec.back;
  if (back === 'afro') { const ae = afroPts(); P(poly([...ae, [cx - rw * 0.5, cy + rh * 0.62], [cx + rw * 0.5, cy + rh * 0.62]]), dk(hc, 0.1)); }
  if (back === 'locs' || back === 'braids') {
    const n = back === 'braids' ? 16 : 11, endY = cy + rh * (0.45 + 1.5 * (spec.locs ?? 0.8) * (0.8 + 0.4 * (HR.len ?? 0.5))), w = back === 'braids' ? 1.7 : 2.7;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x0 = cx + (t * 2 - 1) * (rw + vol.side * 0.6), sway = (R() - 0.5) * 2.4; strand([[x0, cy - rh * 0.3], [x0 + (t * 2 - 1) * 2 + sway * 0.4, (cy + endY) / 2], [x0 + (t * 2 - 1) * 3 + sway, endY - R() * 4]], w, true); }
  }
  if (back === 'long' || back === 'shag') {
    const end = back === 'long' ? cy + rh * (0.95 + 0.7 * (HR.len ?? 0.5)) : cy + rh * 0.62, wv = tex === 'straight' ? 0.4 : tex === 'wavy' ? 1.2 : 1.8, bot: Pt[] = [];
    for (let i = 0; i <= 14; i++) { const x = cx - rw - vol.side - 1.5 + ((2 * (rw + vol.side + 1.5)) * i) / 14; bot.push([x, end + Math.sin(i * 1.9 + (f.seed % 5)) * wv + Math.abs(i - 7) * 0.25]); }
    P(poly([[cx - rw - vol.side, cy - rh * 0.4], [cx - rw - vol.side - 1.6, cy + rh * 0.4], ...bot, [cx + rw + vol.side + 1.6, cy + rh * 0.4], [cx + rw + vol.side, cy - rh * 0.4]]), dk(hc, 0.14));
  }
  if (back === 'mullet') { const wv: Pt[] = []; for (let i = 0; i <= 10; i++) wv.push([cx + rw * 0.9 + 2 - (i / 10) * (rw * 1.8 + 4), shY - 3 + Math.sin(i * 2.1) * 1.2]); P(poly([[cx - rw * 0.86, cy + rh * 0.2], [cx - rw * 0.84 - 2, shY - 6], ...wv.reverse(), [cx + rw * 0.84 + 2, shY - 6], [cx + rw * 0.86, cy + rh * 0.2]]), dk(hc, 0.1)); }
  if (back === 'bun') { const bx = cx + (HR.part || 1) * 1.2, byy = crown - 3.2 - vol.top * 0.4, r = 4.8 + 1.4 * (HR.len ?? 0.5); C(bx, byy, r, hc); E(bx - r * 0.3, byy - r * 0.35, r * 0.45, r * 0.25, hcL, 0.25, -20); S(`M${pt(bx - r * 0.75, byy + r * 0.62)}Q${pt(bx, byy + r * 0.95)} ${pt(bx + r * 0.75, byy + r * 0.62)}`, dk(hc, 0.5), 1.1); }
  if (back === 'knot') { const kx = cx, ky = crown - 4.5; for (let i = 0; i < 7; i++) { const a2 = (i / 7) * Math.PI * 2; C(kx + Math.cos(a2) * 3.2, ky + Math.sin(a2) * 2.4, 2.3, hcD); C(kx + Math.cos(a2) * 3.2, ky + Math.sin(a2) * 2.4 - 0.3, 1.9, hc); } C(kx, ky, 2.6, hc); }

  // ── Neck, shoulders and jersey ──
  P(`M${pt(cx - nW, cy + rh * 0.5)}L${pt(cx - nW - 1.2, shY + 2)}L${pt(cx + nW + 1.2, shY + 2)}L${pt(cx + nW, cy + rh * 0.5)}Z`, sk);
  { const jaw = lowR.filter(p => p[1] > jawY - 2 && Math.abs(p[0] - cx) <= nW + 0.5), jw = [...jaw, ...mir(jaw).reverse().slice(1)].filter(p => Math.abs(p[0] - cx) <= nW + 0.5);
    if (jw.length > 2) P(poly([...jw.map(([x, y]) => [x, y + 4.8] as Pt), ...jw.slice().reverse()]), shd, 0.42);
    [0.5, 0.72, 0.88].forEach(k => P(`M${pt(cx + nW * k, cy + rh * 0.55)}L${pt(cx + nW + 0.4, cy + rh * 0.55)}L${pt(cx + nW + 1.2, shY + 2)}L${pt(cx + nW * k + 0.3, shY + 2)}Z`, shd, so * 0.32)); }
  const shW = 43 + 3 * build, under = f.acc?.undershirt, shirt = under ? (under === 'team' ? dk(J[0], 0.18) : under === 'black' ? '#1c1c1e' : '#f1f1ef') : null;
  P(`M${pt(cx - nW, shY - 6)}C${pt(cx - nW - 4, shY + 1)} ${pt(cx - shW + 8, shY + 3)} ${pt(cx - shW + 2, shY + 14)}L${pt(cx - shW - 2, 150)}L${pt(cx + shW + 2, 150)}L${pt(cx + shW - 2, shY + 14)}C${pt(cx + shW - 8, shY + 3)} ${pt(cx + nW + 4, shY + 1)} ${pt(cx + nW, shY - 6)}Z`, shirt || sk);
  if (!shirt) { SE(cx + shW - 13, shY + 18, 6, 11, shd, so * 0.9); SE(cx - shW + 12, shY + 12, 4.5, 6, hil, ho * 0.5); }
  else S(`M${pt(cx - nW - 1.5, shY - 3)}Q${pt(cx, shY + 4)} ${pt(cx + nW + 1.5, shY - 3)}`, dk(shirt, 0.25), 1.2);
  if (f.marks?.tattoo) { const t = f.marks.tattoo, x = cx + t.side * nW * 0.5, y0 = chinY + 4, ink = '#24313b';
    if (t.kind === 'script') { S(`M${pt(x - 2.2, y0 + 2)}c1 -1.4 1.6 1.2 2.4 0s1.4 1 2.2 -0.2`, ink, 0.45, 0.55); S(`M${pt(x - 1.8, y0 + 4.4)}c0.9 -1 1.5 0.9 2.2 0s1.2 0.8 1.8 0`, ink, 0.45, 0.5); }
    else { S(`M${pt(x, y0 + 1)}l0.9 2.4l2.5 0.1l-2 1.5l0.8 2.4l-2.2 -1.4l-2.2 1.4l0.8 -2.4l-2 -1.5l2.5 -0.1Z`, ink, 0.45, 0.55); } }
  { const sw2 = nW + 8; const jd = `M${pt(cx - nW - 1.5, shY - 2.5)}L${pt(cx - sw2, shY - 1)}C${pt(cx - 29, shY + 6)} ${pt(cx - 30, shY + 18)} ${pt(cx - 33, 150)}L${pt(cx + 33, 150)}C${pt(cx + 30, shY + 18)} ${pt(cx + 29, shY + 6)} ${pt(cx + sw2, shY - 1)}L${pt(cx + nW + 1.5, shY - 2.5)}Q${pt(cx, shY + 13)} ${pt(cx - nW - 1.5, shY - 2.5)}Z`;
    P(jd, J[0]); [12, 18].forEach(x0 => P(`M${pt(cx + x0 - 4, shY + 8)}L${pt(cx + 29, shY + 6)}C${pt(cx + 30, shY + 18)} ${pt(cx + 33, 150)} ${pt(cx + 33, 150)}L${pt(cx + x0, 150)}Z`, '#000000', 0.06)); P(`M${pt(cx - nW - 1, shY - 1.5)}Q${pt(cx, shY + 15)} ${pt(cx + nW + 1, shY - 1.5)}Q${pt(cx, shY + 19)} ${pt(cx - nW - 1, shY - 1.5)}Z`, '#000000', 0.12);
    S(`M${pt(cx - nW - 1.5, shY - 2.5)}Q${pt(cx, shY + 13)} ${pt(cx + nW + 1.5, shY - 2.5)}`, J[1], 2.2);
    [-1, 1].forEach(s => S(`M${pt(cx + s * sw2, shY - 1)}C${pt(cx + s * 29, shY + 6)} ${pt(cx + s * 30, shY + 18)} ${pt(cx + s * 33, 150)}`, J[1], 1.8)); }

  // ── Ears (and earrings) ──
  const Er = f.ears, eo = 2.4 + 2 * Er.out, earTop = ey - 1 - 2.2 * Er.size, earBot = noseY - 1 + 2 * Er.size, earC = mixC(sk, '#c46a5a', 0.07);
  [-1, 1].forEach(s => {
    const x0 = cx + s * rw * 0.96, xe = cx + s * (rw * Hd.cheek + eo), m = (earTop + earBot) / 2;
    P(`M${pt(x0, earTop + 1)}C${pt(x0 + s * 1.5, earTop - 2)} ${pt(xe + s * 0.8, earTop - 1.2)} ${pt(xe + s * 0.6, earTop + 3)}C${pt(xe + s * 0.4, m + 1)} ${pt(xe - s * 0.4, earBot - 2)} ${pt(xe - s * 1.6, earBot)}C${pt(xe - s * 2.6, earBot + 1)} ${pt(x0 + s * 0.4, earBot)} ${pt(x0, earBot - 1.5)}Z`, earC);
    S(`M${pt(xe - s * 0.9, earTop + 2)}C${pt(xe - s * 0.2, earTop + 4)} ${pt(xe - s * 0.6, earBot - 4)} ${pt(xe - s * 1.9, earBot - 2.5)}`, shd, 0.6, 0.45);
    E(x0 + s * (eo * 0.45 + 0.6), m + 0.5, eo * 0.28, (earBot - earTop) * 0.2, shd, 0.3 + (s > 0 ? 0.08 : 0));
    const er = f.acc?.earrings; if (er && (er.both || s > 0)) { const mc = METALS[er.metal] || METALS.silver, lx = xe - s * 1.7, ly = earBot - 0.6;
      if (er.kind === 'hoop') add('circle', { cx: n2(lx), cy: n2(ly + 1.5), r: 1.5, fill: 'none', stroke: mc, strokeWidth: 0.5 });
      else { C(lx, ly, 0.85, mc); C(lx - 0.25, ly - 0.25, 0.3, '#ffffff', er.metal === 'black' ? 0.3 : 0.85); } }
  });

  // ── Head ──
  P(poly(outline), sk);

  // ── Eyes: whites and irises, then lids of skin over them ──
  const Ey = f.eyes, SH = EYE_SHAPES[Ey.shape] || EYE_SHAPES.almond, U = SH[0] * X.lid * (1 - 0.12 * (Ey.lid ?? 0.5)), Lw = SH[1] * X.low;
  const eyeG = (s: number) => { const ecx = cx + s * ex, xi = ecx - s * ea, xo = ecx + s * ea, yi = ey + 0.35, yo = ey + 0.1 - Ey.tilt * ea;
    return { ecx, xi, xo, yi, yo, up: `M${pt(xi, yi)}C${pt(xi + s * ea * 0.35, ey - U * 1.28)} ${pt(xo - s * ea * 0.5, ey - U * 1.2)} ${pt(xo, yo)}`, lo: `C${pt(xo - s * ea * 0.3, ey + Lw * 1.15)} ${pt(xi + s * ea * 0.45, ey + Lw * 1.1)} ${pt(xi, yi)}` }; };
  const sclera = mixC('#f3eee6', sk, 0.14 + 0.1 * tone);
  [-1, 1].forEach(s => { const g = eyeG(s), ri = 1.95 * Ey.size, ix = g.ecx + s * 0.1, iy = ey + 0.15;
    P(g.up + g.lo + 'Z', sclera); C(ix, iy, ri, Ey.hex); add('circle', { cx: n2(ix), cy: n2(iy), r: n2(ri - 0.18), fill: 'none', stroke: dk(Ey.hex, 0.45), strokeWidth: 0.35 });
    C(ix, iy, ri * 0.44, '#0b0908'); C(ix - 0.65, iy - 0.75, 0.5, '#ffffff', 0.9); C(ix + 0.55, iy + 0.5, 0.22, '#ffffff', 0.5);
    P(`${g.up}L${pt(g.xo, ey - 7)}L${pt(g.xi, ey - 7)}Z`, sk); P(`M${pt(g.xo, g.yo)}${g.lo}L${pt(g.xi, ey + 6)}L${pt(g.xo, ey + 6)}Z`, sk); });

  // ── Light and shade on the face ──
  const band = (s: number, w0: number): Pt[] => { const side = s > 0 ? rightHalf : mir(rightHalf), y0 = crown + rh * 0.3, a2 = side.filter(p => p[1] > y0); const inner = a2.map(([x, y]) => [x - s * w0 * Math.sin(Math.PI * Math.min(1, ((y - y0) / (chinY - y0)) * 1.04)), y] as Pt); return [...a2, ...inner.reverse()]; };
  [1, 0.64, 0.34].forEach(k => { P(poly(band(1, rw * 0.26 * k)), shd, so * 0.42); P(poly(band(-1, rw * 0.12 * k)), shd, so * 0.2); });
  [-1, 1].forEach(s => { SE(cx + s * rw * 0.86, cy - rh * 0.25, rw * 0.14, rh * 0.22, shd, so * 0.5); SE(cx + s * rw * 0.55, ey + nl * 0.42, rw * 0.22, nl * 0.18, hil, ho * (s < 0 ? 0.9 : 0.45), s * -12);
    if (build < 0.15) SE(cx + s * rw * 0.6, ey + nl * 0.82, rw * 0.18, nl * 0.34, shd, (0.15 - build) * 0.1 * (s > 0 ? 1.3 : 0.8), s * -20);
    const g = eyeG(s); SE(g.ecx, ey - 2.7, ea * 1.35, 2.7, shd, 0.12 + (Ey.shape === 'deepset' ? 0.14 : 0)); S(`M${pt(g.xi + s * 0.6, ey + Lw + 1.5)}Q${pt(g.ecx, ey + Lw + 2.6)} ${pt(g.xo, ey + Lw + 0.9)}`, shd, 0.8, 0.08 + (f.age?.bags || 0) * 0.16);
    if (X.cheek) SE(g.ecx + s * 0.6, ey + Lw + 2.9, ea * 0.95, 1.4, hil, 0.12 * X.cheek); });
  SE(cx - rw * 0.14, cy - rh * 0.42, rw * 0.46, rh * 0.17, hil, ho * 0.8);
  SE(cx - 0.6, chinY - 3.2, chinX * 0.55 + 1.2, 1.8, hil, ho * 0.9);
  if (Hd.cleft) S(`M${pt(cx, chinY - 3.6)}L${pt(cx, chinY - 1.4)}`, shd, 0.55, 0.3);
  // Freckles and a mole.
  if (f.marks?.freckles) { const fr = mulberry32((f.seed ^ 0x5bd1e995) | 0), n = Math.round(14 + 22 * f.marks.freckles), fcol = mixC(sk, '#7a3a1a', 0.3 + 0.14 * (1 - tone));
    const a2: Pt[][] = [[], []]; for (let i = 0; i < n; i++) { const s = fr() < 0.5 ? -1 : 1, t = fr(); a2[i % 2].push([cx + s * (1 + t * rw * 0.62), ey + 1.8 + fr() * nl * 0.6 + t * 2]); } dots(a2[0], 0.42, fcol, 0.42); dots(a2[1], 0.3, fcol, 0.55); }
  if (f.marks?.mole) { const [u, v] = f.marks.mole; C(cx + u * rw * 0.62, ey + 3 + v * (chinY - ey - 7), 0.5, dk(sk, 0.5), 0.8); }

  // ── Eye lines: lashes, crease, lower lid, crow's feet ──
  const lash = mixC('#170f0b', sk, 0.12);
  [-1, 1].forEach(s => { const g = eyeG(s), cg = 1.1 + 0.6 * (1 - (Ey.lid ?? 0.5));
    S(g.up, lash, 0.8 + 0.15 * Ey.size + (f.fem ? 0.45 : 0));
    if (f.fem) [0.55, 0.75, 0.95].forEach((t, i) => { const x = g.xi + (g.xo - g.xi) * t, y = ey - U * (1.05 - 0.5 * t * t); S(`M${pt(x, y)}l${n2(s * (0.5 + 0.3 * i))} ${n2(-0.9 - 0.2 * i)}`, lash, 0.45); }); // lashes S(`M${pt(g.ecx + s * ea * 0.3, ey - U * 1.12)}Q${pt(g.xo - s * ea * 0.15, ey - U * 0.9)} ${pt(g.xo + s * 0.35, g.yo - 0.2)}`, lash, 1.1);
    if (Ey.shape === 'monolid') S(`M${pt(g.xi + s * 0.4, g.yi - 0.5)}C${pt(g.xi + s * ea * 0.4, ey - U * 1.3)} ${pt(g.xo - s * ea * 0.5, ey - U * 1.25)} ${pt(g.xo, g.yo - 0.3)}`, shd, 0.5, 0.3);
    else S(`M${pt(g.xi + s * ea * 0.25, g.yi - 1.3)}C${pt(g.xi + s * ea * 0.45, ey - U * 1.28 - cg)} ${pt(g.xo - s * ea * 0.5, ey - U * 1.2 - cg)} ${pt(g.xo + s * 0.2, g.yo - 1)}`, shd, 0.55, Ey.shape === 'hooded' ? 0.3 : 0.5);
    if (Ey.shape === 'hooded') P(`M${pt(g.ecx, ey - U * 1.25 - 0.4)}Q${pt(g.xo - s * ea * 0.2, ey - U * 1.1 - 0.8)} ${pt(g.xo + s * 0.6, g.yo - 0.4)}Q${pt(g.xo - s * ea * 0.3, ey - U * 1.05)} ${pt(g.ecx, ey - U * 1.25 - 0.4)}Z`, mixC(sk, shd, 0.3));
    S(`M${pt(g.xo, g.yo)}${g.lo}`, shd, 0.45, 0.4);
    const al = f.age?.lines || 0; if (al > 0.15) S(`M${pt(g.xo + s * 0.9, ey - 0.7)}l${n2(s * 1.8)} -0.9M${pt(g.xo + s * 0.9, ey + 0.4)}l${n2(s * 1.9)} 0.5`, shd, 0.4, 0.35 * al); });

  // ── Brows ──
  const Br = f.brows, BS = BROW_SHAPES[Br.shape] || BROW_SHAPES.soft, bc0 = lumOf(hn) > 0.3 ? dk(hn, 0.32) : hn, bc = mixC(bc0, '#9d9a95', (HR.grey || 0) * 0.35);
  [-1, 1].forEach(s => { const ecx = cx + s * ex, raise = X.raise && s > 0 ? X.raise : 0;
    const xi = ecx - s * (ea * 0.95 + (X.brIn > 1 ? 0.45 : 0)), xo = ecx + s * ea * (1.15 + 0.22 * Br.len), xp = ecx + s * ea * 0.42;
    const yi = by + X.brIn * 0.9 + Br.tilt * 1.5 - raise, yp = by - BS[0] - raise * 0.8, yo = by + BS[1] - Br.tilt * 1.5 - raise * 0.5, t = 1.25 * Br.thick, tp = t * 0.85;
    const d = `M${pt(xi, yi)}Q${pt((xi + xp) / 2, yp + 0.25)} ${pt(xp, yp)}Q${pt((xp + xo) / 2, yp - 0.1)} ${pt(xo, yo)}Q${pt((xp + xo) / 2, yp - tp * 0.92)} ${pt(xp, yp - tp)}Q${pt((xi + xp) / 2, yp - tp * 0.85 + 0.2)} ${pt(xi, yi - t)}Z`;
    P(d, bc, 0.93); P(`M${pt(xi, yi)}L${pt(xi + s * 1.6, yi - 0.2)}L${pt(xi + s * 1.6, yi - t)}L${pt(xi, yi - t)}Z`, sk, 0.3);
    if (Br.shape === 'bushy') for (let i = 0; i < 5; i++) { const x = xi + ((xo - xi) * (i + 0.5)) / 5; S(`M${pt(x, yp - tp * 0.6)}l${n2(s * 0.9)} -0.9`, bc, 0.35, 0.7); }
    const slit = Br.slit || 0; if (slit && s > 0) for (let i = 0; i < slit; i++) { const x = xp + s * (1.2 + i * 1.1); S(`M${pt(x, yp - tp - 0.4)}L${pt(x + s * 0.35, yo + 0.6)}`, sk, 0.55); }
    const brw = f.acc?.brow; if (brw && brw.side === s) { const mc = METALS[brw.metal] || METALS.silver, x = xo - s * 1.1; C(x, yo - t * 0.4 - 1.1, 0.42, mc); C(x, yo + 0.8, 0.42, mc); S(`M${pt(x, yo - t * 0.4 - 1.1)}L${pt(x, yo + 0.8)}`, mc, 0.25, 0.8); }
  });

  // ── Nose ──
  { const bw = 0.8 + 0.7 * N.bridge, tipR = 1 + 0.7 * N.tip;
    P(`M${pt(cx + bw, ey - 0.5)}C${pt(cx + bw + 0.6, ey + nl * 0.4)} ${pt(cx + nhw * 0.85 + crook, noseY - 4)} ${pt(cx + nhw * 0.7 + crook, noseY - 2)}L${pt(cx + 1 + crook, noseY - 3.2)}C${pt(cx + 0.8 + crook * 0.6, ey + nl * 0.5)} ${pt(cx + 0.5, ey + 2)} ${pt(cx + 0.4, ey - 0.5)}Z`, shd, so * 1.05);
    P(`M${pt(cx - bw, ey - 0.5)}C${pt(cx - bw - 0.4, ey + nl * 0.4)} ${pt(cx - nhw * 0.8 + crook, noseY - 4)} ${pt(cx - nhw * 0.65 + crook, noseY - 2.2)}L${pt(cx - 1 + crook, noseY - 3.2)}C${pt(cx - 0.8 + crook * 0.6, ey + nl * 0.5)} ${pt(cx - 0.5, ey + 2)} ${pt(cx - 0.4, ey - 0.5)}Z`, shd, so * 0.45);
    SE(cx - 0.5 + crook * 0.4, ey + nl * 0.45, 0.9 + 0.3 * bw, nl * 0.3, hil, ho * 1.1);
    SE(cx - 0.3 + crook, noseY - 2.3, tipR * 1.2, tipR * 1.1, hil, ho * 1.3); SE(cx + crook, noseY - 0.3, 2 + nhw * 0.2, 0.95, shd, 0.24);
    [-1, 1].forEach(s => { SE(cx + s * nhw * 0.8 + crook, noseY - 1.6, 1.5, 2, shd, s > 0 ? 0.13 : 0.08);
      S(`M${pt(cx + s * nhw * 0.5 + crook, noseY - 3.6)}C${pt(cx + s * (nhw + 0.5) + crook, noseY - 3.2)} ${pt(cx + s * (nhw + 0.4) + crook, noseY - 0.2)} ${pt(cx + s * nhw * 0.55 + crook, noseY + 0.2)}`, shd, 0.75, 0.55);
      E(cx + s * nhw * 0.42 + crook, noseY - 0.5, (0.9 + 0.4 * N.flare) * (f.expr === 'mean' ? 1.12 : 1), 0.55, dk(sk, 0.55), 0.75, s * 18); });
    const ns = f.acc?.nose; if (ns) { const mc = METALS[ns.metal] || METALS.silver, s = ns.side || 1;
      if (ns.kind === 'stud') { C(cx + s * nhw * 0.72 + crook, noseY - 1.7, 0.5, mc); C(cx + s * nhw * 0.72 + crook - 0.15, noseY - 1.85, 0.18, '#ffffff', 0.8); }
      else if (ns.kind === 'septum') S(`M${pt(cx - 1.1 + crook, noseY + 0.1)}Q${pt(cx + crook, noseY + 1.9)} ${pt(cx + 1.1 + crook, noseY + 0.1)}`, mc, 0.5);
      else S(`M${pt(cx + s * nhw * 0.5 + crook, noseY - 0.1)}A1.2 1.2 0 1 ${s > 0 ? 0 : 1} ${pt(cx + s * nhw * 0.88 + crook, noseY - 1.3)}`, mc, 0.45); } }

  // ── Folds, philtrum and the shadow under the lower lip (under any beard) ──
  const gap = X.open ? 2.3 : 0, part = X.part || 0;
  { const nlo = 0.06 + 0.22 * (f.age?.lines || 0) + 0.16 * X.cheek;
    [-1, 1].forEach(s => S(`M${pt(cx + s * (nhw + 1.4), noseY - 2.2)}Q${pt(cx + s * (nhw + 3.6), my - 1.5)} ${pt(cx + s * (mhw + 1.8), my + 2.5 + (s < 0 ? cL : cR) * 0.4)}`, shd, 0.7, nlo));
    E(cx, (noseY + my - ut) / 2 + 0.4, 1.5, (my - ut - noseY) * 0.36, shd, 0.07);
    P(`M${pt(cx - mhw * 0.6, my + lt + gap + 1.3)}Q${pt(cx, my + lt + gap + 3.1 + (X.press ? 0.6 : 0))} ${pt(cx + mhw * 0.6, my + lt + gap + 1.3)}Q${pt(cx, my + lt + gap + 1.9)} ${pt(cx - mhw * 0.6, my + lt + gap + 1.3)}Z`, shd, 0.16);
    if (f.marks?.dimples && X.cheek > 0.2) [-1, 1].forEach(s => S(`M${pt(cx + s * (mhw + 2.2), my - 1.2 + (s < 0 ? cL : cR))}q${n2(s * 0.7)} 1.2 0 2.4`, shd, 0.5, 0.35)); }

  // ── Facial hair ──
  const FH = f.facial, fc = FH.color, den = FH.density ?? 0.85, fs = FH.style;
  const sbB = cy + rh * 0.06, jawPts = lowR.filter(p => p[1] >= sbB);
  const contour = (e0: number, e1: number): Pt[] => { const r = jawPts.map(([x, y]) => { const dx = x - cx, dy = y - (cy - 4), d = Math.hypot(dx, dy), e = e0 + (e1 - e0) * cl((y - jawY + 4) / (chinY - jawY + 4)); return [x + (dx / d) * e, y + (dy / d) * e] as Pt; }); return [...r, ...mir(r).reverse().slice(1)]; };
  const inner = (low: number, gp: number) => cr([[cx - rw * 0.98, sbB - 3], [cx - rw * 0.95, sbB], [cx - rw * (0.74 - 0.08 * low), ey + nl * (0.55 + 0.25 * low)], [cx - mhw - 3.2, my - 2 + cL], [cx - mhw - 1.6, my + 1.6 + cL * 0.5], [cx, my + lt + gap + gp], [cx + mhw + 1.6, my + 1.6 + cR * 0.5], [cx + mhw + 3.2, my - 2 + cR], [cx + rw * (0.74 - 0.08 * low), ey + nl * (0.55 + 0.25 * low)], [cx + rw * 0.95, sbB], [cx + rw * 0.98, sbB - 3]], 5);
  const beard = (e0: number, e1: number, low: number, gp = 1.3) => poly([...contour(e0, e1), ...inner(low, gp)]);
  const must = (thick: number, wide: number) => { const t = noseY + 1.3 + (1 - thick) * 1.2;
    return `M${pt(cx - mhw - wide, my + cL * 0.7 + 0.4)}C${pt(cx - mhw * 0.7, t + 1.2)} ${pt(cx - 2.5, t)} ${pt(cx, t + 0.3)}C${pt(cx + 2.5, t)} ${pt(cx + mhw * 0.7, t + 1.2)} ${pt(cx + mhw + wide, my + cR * 0.7 + 0.4)}C${pt(cx + mhw * 0.6, my - ut * 0.6 + cR * 0.3)} ${pt(cx + 2, my - ut - 0.2)} ${pt(cx, my - ut * 0.8 - 0.2)}C${pt(cx - 2, my - ut - 0.2)} ${pt(cx - mhw * 0.6, my - ut * 0.6 + cL * 0.3)} ${pt(cx - mhw - wide, my + cL * 0.7 + 0.4)}Z`; };
  const goatee = (w: number, drop: number) => poly(crc([[cx - 1.8, my + lt + gap + 1], [cx - w, my + lt + gap + 0.4], [cx - w * 0.9, chinY - 2.5], [cx, chinY + drop], [cx + w * 0.9, chinY - 2.5], [cx + w, my + lt + gap + 0.4], [cx + 1.8, my + lt + gap + 1], [cx, my + lt + gap + 1.5]], 5));
  // Beards fade in toward the cheeks (three cheek lines, one over another) and get a stippled texture.
  const stub = mixC(fc, sk, 0.25), region = (e0: number, e1: number, low: number) => [...contour(e0, e1), ...inner(low, 1.3)];
  const soft = (e0: number, e1: number, lows: number[], color: string, op: number) => lows.forEach(lw2 => P(beard(e0, e1, lw2), color, op / lows.length * 1.25));
  if (fs === 'stubble' || fs === 'heavyStubble' || fs === 'patchy') { const op = (fs === 'heavyStubble' ? 0.42 : fs === 'patchy' ? 0.16 : 0.27) * den;
    soft(0.1, 0.25, [0.15, 0.45, 0.8], stub, op); [0.5, 0.75].forEach(k => P(must(0.8 * k + 0.2, 0.4), stub, op * 0.6));
    stipple(region(0, 0.2, 0.5), fs === 'heavyStubble' ? 170 : 120, fc, (fs === 'patchy' ? 0.2 : 0.26) * den, 0.16);
    if (fs === 'patchy') { SE(cx, chinY - 3, 3.6, 2.4, fc, 0.3); [-1, 1].forEach(s => { SE(cx + s * (mhw + 0.5), my - 1.6, 1.8, 1.1, fc, 0.24); SE(cx + s * jawX * 0.8, jawY + 1, 2.2, 3.2, fc, 0.16); }); } }
  if (fs === 'chinstrap' || fs === 'chinstrapMustache') { const band2 = [...contour(0.4, 0.9), ...contour(-2.6, -2.4).reverse()]; P(poly(band2), fc, 0.88 * den); P(poly([...contour(0.9, 1.4), ...contour(-3.2, -3).reverse()]), fc, 0.14 * den); }
  if (fs === 'shortBeard') { soft(0.6, 1.5, [0.25, 0.4, 0.55], fc, 0.8 * den); P(beard(0.95, 1.9, 0.4), fc, 0.3 * den); stipple(region(0.4, 1.2, 0.5), 60, dk(fc, 0.3), 0.3, 0.2); }
  if (fs === 'fullBeard') { soft(1.3, 3.4, [0.1, 0.22, 0.34], fc, 0.9 * den); P(beard(1.75, 4, 0.25), fc, 0.32 * den); stipple(region(1, 3, 0.3), 70, dk(fc, 0.3), 0.35, 0.22); }
  if (fs === 'thickBeard') { soft(2.5, 6.6, [0, 0.1, 0.2], fc, 0.97); P(beard(3, 7.3, 0.1, 1.1), fc, 0.35); const c = contour(2.2, 6.2); for (let i = 2; i < c.length - 2; i += 2) { const [x, y] = c[i]; S(`M${pt(x, y - 2.6)}l${n2((x - cx) * 0.05)} 2.4`, dk(fc, 0.3), 0.45, 0.45); } stipple(region(2, 6, 0.2), 70, mixC(fc, '#ffffff', 0.15), 0.25, 0.3); }
  if (['goatee', 'circle', 'vandyke'].includes(fs)) { const w = fs === 'vandyke' ? 3.2 : 4.4, dr = fs === 'vandyke' ? 2.4 : 1; P(goatee(w + 0.35, dr + 0.35), fc, 0.3 * den); P(goatee(w, dr), fc, 0.86 * den); stipple([...crc([[cx - w, my + lt + gap + 0.6], [cx - w * 0.9, chinY - 2.5], [cx, chinY + dr], [cx + w * 0.9, chinY - 2.5], [cx + w, my + lt + gap + 0.6]], 3)], 18, dk(fc, 0.3), 0.3, 0.2); }
  if (fs === 'circle') [-1, 1].forEach(s => { const d = `M${pt(cx + s * (mhw + 0.5), my + (s < 0 ? cL : cR) * 0.7 + 0.2)}Q${pt(cx + s * (mhw + 1.4), my + lt * 0.6)} ${pt(cx + s * 4.2, my + lt + gap + 0.9)}`; S(d, fc, 2.8, 0.15 * den); S(d, fc, 2, 0.88 * den); });
  if (fs === 'soulpatch') P(poly(crc([[cx - 1.4, my + lt + gap + 0.8], [cx + 1.4, my + lt + gap + 0.8], [cx + 0.6, my + lt + gap + 3.6], [cx - 0.6, my + lt + gap + 3.6]], 4)), fc, 0.86 * den);
  if (fs === 'chinpuff') { const d = poly(crc([[cx - 2.6, chinY - 3.4], [cx + 2.6, chinY - 3.4], [cx + 2.2, chinY - 0.6], [cx, chinY + 1.2], [cx - 2.2, chinY - 0.6]], 4)); P(d, fc, 0.3 * den); P(poly(crc([[cx - 2.2, chinY - 3.1], [cx + 2.2, chinY - 3.1], [cx + 1.8, chinY - 0.8], [cx, chinY + 0.8], [cx - 1.8, chinY - 0.8]], 4)), fc, 0.82 * den); }

  // ── Mouth ──
  { const lip = mixC(dk(sk, 0.1 + 0.14 * tone), f.fem ? '#b04a5a' : '#a14a48', (f.fem ? 0.4 : 0.24) - 0.12 * tone), lipU = dk(lip, 0.08 + 0.08 * tone), lipL = mixC(lip, '#b0625c', 0.06 + 0.06 * tone);
    const mid = (g: number) => `C${pt(cx + mhw * 0.5, my + 0.35 + cR * 0.35 + g)} ${pt(cx - mhw * 0.5, my + 0.35 + cL * 0.35 + g)} ${pt(cx - mhw, my + cL)}`;
    const upper = `M${pt(cx - mhw, my + cL)}C${pt(cx - mhw * 0.62, my - ut * 0.55 + cL * 0.5)} ${pt(cx - 2.6, my - ut * 1.05)} ${pt(cx - 1.15, my - ut)}Q${pt(cx, my - ut * (0.62 + 0.18 * (1 - f.mouth.bow)))} ${pt(cx + 1.15, my - ut)}C${pt(cx + 2.6, my - ut * 1.05)} ${pt(cx + mhw * 0.62, my - ut * 0.55 + cR * 0.5)} ${pt(cx + mhw, my + cR)}${mid(0)}Z`;
    const g2 = gap || part, lower = `M${pt(cx - mhw, my + cL)}C${pt(cx - mhw * 0.5, my + 0.35 + cL * 0.35 + g2)} ${pt(cx + mhw * 0.5, my + 0.35 + cR * 0.35 + g2)} ${pt(cx + mhw, my + cR)}C${pt(cx + mhw * 0.72, my + lt * 0.95 + g2 + cR * 0.3)} ${pt(cx + 2.4, my + lt * 1.12 + g2)} ${pt(cx, my + lt * 1.12 + g2)}C${pt(cx - 2.4, my + lt * 1.12 + g2)} ${pt(cx - mhw * 0.72, my + lt * 0.95 + g2 + cL * 0.3)} ${pt(cx - mhw, my + cL)}Z`;
    if (g2) { const inn = `M${pt(cx - mhw + 0.5, my + cL * 0.92)}C${pt(cx - mhw * 0.5, my + 0.35 + cL * 0.35)} ${pt(cx + mhw * 0.5, my + 0.35 + cR * 0.35)} ${pt(cx + mhw - 0.5, my + cR * 0.92)}`;
      P(`${inn}C${pt(cx + mhw * 0.5, my + 0.35 + cR * 0.35 + g2)} ${pt(cx - mhw * 0.5, my + 0.35 + cL * 0.35 + g2)} ${pt(cx - mhw + 0.5, my + cL * 0.92)}Z`, '#3a1a18');
      if (gap) { P(`${inn}C${pt(cx + mhw * 0.45, my + 0.35 + cR * 0.35 + gap * 0.7)} ${pt(cx - mhw * 0.45, my + 0.35 + cL * 0.35 + gap * 0.7)} ${pt(cx - mhw + 0.5, my + cL * 0.92)}Z`, '#f0ebe1'); [-1, 1].forEach(s => E(cx + s * mhw * 0.78, my + (s < 0 ? cL : cR) * 0.7 + 0.6, mhw * 0.18, 0.9, '#3a1a18', 0.45)); } }
    P(lower, lipL); P(upper, lipU);
    E(cx - 0.8, my + lt * 0.55 + g2, mhw * 0.33, lt * 0.2, hil, 0.16 + 0.1 * tone);
    S(`M${pt(cx + mhw, my + cR)}${mid(0)}`, dk(lip, 0.5), 0.55, 0.85);
    C(cx - mhw, my + cL, 0.5, dk(lip, 0.4), 0.35); C(cx + mhw, my + cR, 0.5, dk(lip, 0.4), 0.35);
    const lr = f.acc?.lip; if (lr) { const mc = METALS[lr.metal] || METALS.silver; if (lr.kind === 'labret') C(cx, my + lt * 1.12 + g2 + 1.2, 0.45, mc); else { const x = cx + (lr.side || 1) * mhw * 0.45; S(`M${pt(x, my + lt * 0.55 + g2)}A1.1 1.1 0 1 ${lr.side > 0 ? 1 : 0} ${pt(x + (lr.side || 1) * 0.5, my + lt * 1.15 + g2 + 0.8)}`, mc, 0.45); } } }

  // Mustaches go over the upper lip.
  if (['mustache', 'circle', 'vandyke', 'chinstrapMustache', 'shortBeard', 'fullBeard', 'thickBeard'].includes(fs)) {
    const [th, wd] = fs === 'thickBeard' ? [1.1, 1.2] : fs === 'fullBeard' ? [1, 0.9] : fs === 'vandyke' ? [0.9, 1.4] : fs === 'shortBeard' ? [0.85, 0.6] : [0.95, 0.7];
    P(must(th, wd), fc, (fs === 'shortBeard' ? 0.82 : 0.93) * den); }
  // Forehead lines.
  { const al = f.age?.lines || 0; if (al > 0.05) for (let i = 0; i < (al > 0.5 ? 3 : 2); i++) S(`M${pt(cx - rw * 0.42, by - 4.4 - i * 2.2)}Q${pt(cx, by - 5.6 - i * 2.2)} ${pt(cx + rw * 0.42, by - 4.4 - i * 2.2)}`, shd, 0.45, 0.22 * al); }

  // ── Hair on the head ──
  const st = HR.style;
  if (spec.bald) { P(cap(Bt, cy - rh * 0.05), hc, 0.07); SE(cx - rw * 0.28, crown + rh * 0.2, rw * 0.34, rh * 0.11, hil, ho * 1.6, -12); SE(cx + rw * 0.45, crown + rh * 0.35, rw * 0.22, rh * 0.2, shd, so * 0.6); }
  else {
    let Btop = Bv, hTop = crown - vol.top;
    const fd = spec.fade ? FADE[spec.fade] : null, op = spec.op || 1;
    // Faded sides: a smooth run from the ear up to where the top begins.
    if (fd) { const n = 9, s1 = 1 - Math.pow((1 - fd.to) / (1 - fd.from), 1 / (n - 1)); P(cap(Bt), hc, fd.from); for (let i = 1; i < n; i++) P(cap(Bt, sbY - ((sbY - fd.top) * i) / (n - 1) + 1), hc, s1); }
    if (spec.box) { const yb = fd.top + 2, bw = rw * 0.86, top = crown - spec.box * lenF, hl2 = F.filter(p => Math.abs(p[0] - cx) <= bw && p[1] <= yb + 3);
      P(poly([[cx + bw, yb], [cx + bw * 0.98, top + 2.6], [cx + bw * 0.9, top], [cx - bw * 0.9, top], [cx - bw * 0.98, top + 2.6], [cx - bw, yb], ...hl2]), hc);
      const a2: Pt[][] = [[], []]; for (let i = 0; i < 60; i++) { const x = cx + (R() * 2 - 1) * bw * 0.92, y = top + 0.8 + R() * (yb - top - 1.6); if (y < edgeY(x) - 0.6) a2[i % 3 ? 0 : 1].push([x, y]); } dots(a2[0], 0.34, hcL, 0.25); dots(a2[1], 0.34, hcD, 0.25);
      S(`M${pt(cx - bw * 0.9, top + 0.4)}L${pt(cx + bw * 0.9, top + 0.4)}`, hcL, 0.7, 0.25); Btop = []; hTop = top;
    } else if (spec.strip) { // a crest from the forehead back over the crown
      const w = rw * spec.strip, crest: Pt[] = [], ct = (x: number) => crown - 0.6 - vol.top * (0.12 + 0.88 * Math.sqrt(Math.max(0, 1 - ((x - cx) / w) ** 2)));
      for (let i = 0; i <= 24; i++) { const x = cx + (1 - (2 * i) / 24) * w, b = bumpA ? bumpA * 0.6 * (0.5 + 0.5 * Math.cos(i * 2.3 + f.seed)) : 0; crest.push([x, ct(x) - b]); }
      P(poly([[cx + w, edgeY(cx + w)], ...crest, [cx - w, edgeY(cx - w)], ...F.filter(p => Math.abs(p[0] - cx) < w)]), hc);
      if (spec.spikes) for (let i = 0; i < spec.spikes; i++) { const x = cx - w * 0.75 + (1.5 * w * i) / (spec.spikes - 1), t = ct(x); P(`M${pt(x - 1.5, t + 1.6)}L${pt(x + 0.5, t - 2.4 - R() * 2.6)}L${pt(x + 1.5, t + 1.6)}Z`, hc); }
      if (bumpA) { const a2: Pt[][] = [[], []]; for (let i = 0; i < 26; i++) { const x = cx + (R() * 2 - 1) * w * 0.85, t = ct(x); a2[i % 2].push([x, t + 1 + R() * Math.max(0, edgeY(x) - t - 2)]); } dots(a2[0], 0.36, hcL, 0.25); dots(a2[1], 0.36, hcD, 0.25); }
      Btop = []; hTop = crown - vol.top;
    } else if (back === 'afro') { const ae = afroPts(); P(poly([...above(ae, sbY), ...above(F, sbY)]), hc); hTop = Math.min(...ae.map(p => p[1])); }
    else if (fd) { P(cap(Bv, fd.top + 1.6), hc, 0.5); P(cap(Bv, fd.top), hc); }
    else P(cap(Bv), hc, op);
    // A soft hairline, light from the upper left, shade on the right.
    if (!spec.box && !spec.strip) S(poly(F.filter(p => Math.abs(p[0] - cx) <= xT + 0.5).map(([x, y]) => [x, y + 0.55] as Pt), false), hc, 1.3, op * 0.3);
    if (!spec.strip) { const mid2 = (hTop + hy0) / 2, ht = hy0 - hTop; SE(cx - rw * 0.26, mid2 - 1, rw * 0.36, ht * 0.3, hcL, (tex === 'coily' ? 0.18 : 0.28) * op, -14); SE(cx + rw * 0.5, mid2 + 2.5, rw * 0.24, ht * 0.34, '#000000', 0.14 * op * (1 - lumOf(hc) * 0.7)); }
    // Texture.
    const region = Btop.length ? Btop : Bv;
    if (!spec.box && !spec.strip) {
      if (vol.top < 3.4 && !spec.rows && !spec.locs) { const g = inHair(region, 70, 0.4, 0.78); dots(g.filter((_, i) => i % 5 < 3), 0.24, hcL, 0.3 * op); dots(g.filter((_, i) => i % 5 >= 3), 0.24, hcD, 0.3 * op); }
      else if (tex === 'coily') { const g = inHair(region, 50, 0.6, 0.95); dots(g, 0.38, hcL, 0.24); dots(g.map(([x, y]) => [x + 0.45, y + 0.45] as Pt), 0.32, hcD, 0.22); }
      else if (spec.bump && tex !== 'straight') { const g = inHair(region, 30, 0.6, 0.95), arc = (a: Pt[]) => a.map(([x, y]) => `M${pt(x - 1.1, y)}a1.1 1.1 0 1 1 2.2 0`).join(''); S(arc(g.filter((_, i) => i % 2)), hcD, 0.45, 0.45); S(arc(g.filter((_, i) => !(i % 2))), hcL, 0.45, 0.45); }
      if (vol.top >= 3.4 && !spec.bump && tex !== 'coily' && !spec.rows && !spec.locs && !spec.waves) { const back2 = spec.flow === 'back', n = 11;
        for (let i = 0; i < n; i++) { const x0 = cx + (((i + 0.5) / n) * 2 - 1) * xT * 0.95, y0 = edgeY(x0) - 0.6, x1 = back2 ? cx + (x0 - cx) * 0.45 : x0 + (spec.sweep ? -(HR.part || 1) * 4 : (R() - 0.5) * 2), t1 = topAt(region, x1); if (t1 > 900) continue;
          const y1 = Math.max(t1 + 1.6, y0 - (back2 ? 18 : 8)), w2 = tex === 'wavy' ? 1.6 : 0.5; S(`M${pt(x0, y0)}C${pt(x0 + w2, (2 * y0 + y1) / 3)} ${pt(x1 - w2, (y0 + 2 * y1) / 3)} ${pt(x1, y1)}`, i % 2 ? hcL : hcD, 0.45, i % 2 ? 0.3 : 0.38); } }
      if (tex !== 'coily' && back !== 'afro') { const o = offF(vol), pts: Pt[] = []; for (let i = 0; i <= 8; i++) { const th = Math.PI * (0.56 + 0.24 * (i / 8)); pts.push(cran(th, o(th) * 0.5)); } S(poly(pts, false), mixC(hc, '#ffffff', 0.45), Math.min(1.6, 0.4 + vol.top * 0.28), (spec.shine ? 0.32 : tex === 'curly' ? 0.1 : 0.18) * op); }
    }
    if (spec.waves) for (let k = 1; k <= 5; k++) { const y = crown - vol.top + 1.2 + k * 2.1; if (y > hy0 - 1) break; const hw = halfW(y) * 0.92; S(`M${pt(cx - hw, y + 1.2)}Q${pt(cx, y - 1.6)} ${pt(cx + hw, y + 1.2)}`, hcL, 0.7, 0.22); S(`M${pt(cx - hw, y + 2)}Q${pt(cx, y - 0.8)} ${pt(cx + hw, y + 2)}`, hcD, 0.5, 0.2); }
    if (spec.twists) for (let y = crown - vol.top + 2; y < hy0 - 0.5; y += 2.2) { const hw = (halfW(Math.max(y, crown + 1)) + vol.side) * 0.95, off = ((y * 7) % 2) * 1.1; for (let x = cx - hw + off; x <= cx + hw; x += 2.2) { if (y > edgeY(x) - 0.8 || y < topAt(Bv, x) + 0.6) continue; E(x, y, 0.85, 1.5, hcD, 0.45, (x - cx) * 0.8); E(x - 0.3, y - 0.4, 0.45, 0.9, hcL, 0.28, (x - cx) * 0.8); } }
    if (spec.rows) { const n = spec.rows, sp = (2 * xT) / n;
      for (let i = 0; i < n; i++) { const x0 = cx - xT + sp * (i + 0.5), y0 = edgeY(x0) - 0.3, x1 = cx + (x0 - cx) * 0.35, y1 = crown + 0.8, xm = (x0 + x1) / 2 + (x0 - cx) * 0.18;
        if (i) S(`M${pt(x0 - sp / 2, edgeY(x0 - sp / 2) - 0.2)}Q${pt(xm - sp / 2 * 0.8, (y0 + y1) / 2)} ${pt(x1 - sp * 0.18, y1)}`, mixC(sk, hc, 0.35), 0.45, 0.7);
        let ch = ''; for (let t = 0.06; t < 0.95; t += 0.12) { const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xm + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2) + t * t * y1, w = sp * 0.32 * (1 - t * 0.5); ch += `M${pt(x - w, y - 0.5)}L${pt(x, y + 0.35)}L${pt(x + w, y - 0.5)}`; } S(ch, hcL, 0.35, 0.42); } }
    if (spec.locs != null) { const n = 8; for (let i = 0; i < n; i++) { const x0 = cx - xT + ((2 * xT) * (i + 0.5)) / n, y0 = edgeY(x0) - 0.4, x1 = cx + (x0 - cx) * 0.4, y1 = crown - vol.top * 0.5 + 1; strand([[x0, y0], [(x0 + x1) / 2 + (x0 - cx) * 0.15, (y0 + y1) / 2], [x1, y1]], 2.3, true); }
      if (spec.locs > 0) { const endY = cy + rh * (0.15 + 1.1 * spec.locs); [-1, 1].forEach(s => { for (let j = 0; j < 3; j++) { const x0 = cx + s * (rw * (0.8 + j * 0.09)), y0 = hlY(x0) + 1 + j; strand([[x0, y0], [x0 + s * (1.2 + j * 0.6), (y0 + endY) / 2], [x0 + s * (1.8 + j), endY - j * 2 - R() * 3]], 2.4, true); } }); } }
    if (spec.curls || spec.fringe === 'curls') { const n = spec.curls || 6; for (let i = 0; i < n; i++) { const x = cx + ((i + 0.5) / n * 2 - 1) * xT * 0.7, y = edgeY(x) + 0.4; S(`M${pt(x - 1.2, y - 0.6)}a1.3 1.3 0 1 0 2.4 0.2`, hc, 1.1); S(`M${pt(x - 1.2, y - 0.6)}a1.3 1.3 0 1 0 2.4 0.2`, hcD, 0.4, 0.5); } }
    if (spec.part) { const px = cx + (HR.part || 1) * rw * 0.36; S(`M${pt(px, edgeY(px) - 0.3)}L${pt(px - (HR.part || 1) * 1.2, crown - vol.top * 0.35 + 2.5)}`, mixC(sk, hc, 0.4), 0.55, 0.9); }
    if (spec.fringe === 'curtains') S(`M${pt(cx, hy0 - 0.8)}L${pt(cx, hy0 - 4.5)}`, mixC(sk, hc, 0.4), 0.55, 0.85);
    if (spec.spikes && !spec.strip) for (let i = 0; i < spec.spikes; i++) { const th = Math.PI * (0.2 + (0.6 * i) / (spec.spikes - 1)), [x, y] = cran(th, vol.top * 0.7), [tx, ty] = cran(th + (R() - 0.5) * 0.12, vol.top + 2.2 + R() * 2.6); P(`M${pt(x - 2 * Math.sin(th), y - 2 * Math.cos(th) * 0.3)}L${pt(tx, ty)}L${pt(x + 2 * Math.sin(th), y + 2 * Math.cos(th) * 0.3)}Z`, hc); }
    if (spec.tufts) for (let i = 0; i < spec.tufts; i++) { const th = Math.PI * (0.22 + (0.56 * i) / (spec.tufts - 1)) + (R() - 0.5) * 0.08, [x, y] = cran(th, vol.top * 0.6), lean = (R() - 0.5) * 0.4, [tx, ty] = cran(th + lean, vol.top + 1 + R() * 2.4); P(`M${pt(x - 1.8, y + 0.4)}Q${pt((x + tx) / 2 - 0.6, (y + ty) / 2)} ${pt(tx, ty)}Q${pt((x + tx) / 2 + 0.8, (y + ty) / 2 + 0.3)} ${pt(x + 1.8, y + 0.5)}Z`, hc); }
    if (spec.curtain) { const endY = spec.curtain >= 1 ? cy + rh * (0.75 + 0.5 * (HR.len ?? 0.5)) : cy + rh * 0.42;
      [-1, 1].forEach(s => { const o = rw + vol.side; P(poly(crc([[cx + s * 1.2, hy0 - 1.2], [cx + s * rw * 0.45, hy0 + 2.6], [cx + s * rw * 0.78, ey - 6.5], [cx + s * rw * 0.87, ey + 2], [cx + s * rw * 0.9, endY - 2.5], [cx + s * rw * 0.98, endY], [cx + s * (o + 1.2), endY - 2.2], [cx + s * (o + 0.8), cy], [cx + s * (o - 0.4), cy - rh * 0.5], [cx + s * rw * 0.5, crown - vol.top * 0.6]], 5)), hc);
        for (let j = 0; j < 4; j++) { const x0 = cx + s * rw * (0.55 + j * 0.12); S(`M${pt(x0, hy0 + 1 + j * 2)}Q${pt(x0 + s * 2.4, cy - 4)} ${pt(cx + s * (rw * 0.92 + j * 0.8), endY - 3)}`, j % 2 ? hcL : hcD, 0.45, 0.3); } }); }
    // Dye: roots on curly and coily hair dyed light, highlights, frosted tips.
    if (HR.dyeHex && HR.dyeKind === 'full' && (tex === 'coily' || tex === 'curly') && !spec.locs && lumOf(HR.dyeHex) > lumOf(hn) + 0.25) S(poly(F.filter(p => Math.abs(p[0] - cx) <= xT), false), hn, 1.1, 0.45);
    if (HR.dyeHex && HR.dyeKind === 'highlights') { if (tex === 'coily' || spec.bump) dots(inHair(region, 18, 0.7, 0.9), 0.65, HR.dyeHex, 0.75); else for (let i = 0; i < 6; i++) { const x0 = cx + ((i + 0.5) / 6 * 2 - 1) * xT * 0.85, y0 = edgeY(x0) - 0.8, x1 = x0 + (spec.flow === 'back' ? (cx - x0) * 0.5 : spec.sweep ? -(HR.part || 1) * 3 : 0); S(`M${pt(x0, y0)}Q${pt((x0 + x1) / 2 + 0.6, y0 - 4)} ${pt(x1, Math.max(topAt(region, x1) + 1.4, y0 - 9))}`, HR.dyeHex, 1, 0.7); } }
    if (HR.dyeHex && HR.dyeKind === 'tips') { const yTip = (spec.box ? crown - spec.box * lenF : crown - vol.top) + Math.max(2.2, (spec.box ? spec.box * lenF : vol.top) * 0.45); const t2 = spec.box ? null : above(region, yTip); if (t2 && t2.length > 2) P(poly(t2), HR.dyeHex, 0.88); else if (spec.box) { const bw = rw * 0.86, top = crown - spec.box * lenF; P(poly([[cx - bw * 0.9, top], [cx + bw * 0.9, top], [cx + bw * 0.98, top + 2.6], [cx + bw * 0.985, yTip], [cx - bw * 0.985, yTip], [cx - bw * 0.98, top + 2.6]]), HR.dyeHex, 0.88); } }
    // Salt and pepper.
    if ((HR.grey || 0) > 0.12 && (HR.grey || 0) < 0.8 && HR.dyeKind !== 'full') S(inHair(region, 22, 0.5, 0.9).map(([x, y]) => `M${pt(x, y)}l${n2((R() - 0.5) * 1.2)} -1`).join(''), '#dcdad6', 0.35, 0.45);
  }

  // ── Headband ──
  const hb = f.acc?.headband;
  if (hb) { const col = hb.color === 'team' ? J[0] : hb.color === 'team2' ? J[1] : BAND[hb.color] || BAND.white, th = hb.kind === 'thin' ? 2.4 : hb.kind === 'wide' ? 6 : 4;
    const yb = Math.min(hy0 - th * 0.35, by - 3 - th), half = halfW(yb + th / 2) + Math.max(0.6, vol.side * (spec.bald ? 0 : 0.85)) + 0.4;
    const d = `M${pt(cx - half, yb + 1.2)}Q${pt(cx, yb - 1.1)} ${pt(cx + half, yb + 1.2)}L${pt(cx + half, yb + 1.2 + th)}Q${pt(cx, yb - 1.1 + th)} ${pt(cx - half, yb + 1.2 + th)}Z`;
    P(d, col); P(`M${pt(cx + half * 0.45, yb + 0.4)}Q${pt(cx + half * 0.8, yb + 0.6)} ${pt(cx + half, yb + 1.2)}L${pt(cx + half, yb + 1.2 + th)}Q${pt(cx + half * 0.8, yb + 0.6 + th)} ${pt(cx + half * 0.45, yb + 0.4 + th)}Z`, '#000000', 0.12);
    S(`M${pt(cx - half, yb + 1.2 + th)}Q${pt(cx, yb - 1.1 + th)} ${pt(cx + half, yb + 1.2 + th)}`, dk(col, 0.35), 0.5, 0.55);
    if (hb.kind === 'tied') { const tx = cx + half - 0.6, ty = yb + th / 2 + 1; P(`M${pt(tx, ty)}l4.2 3.4l1.3 -0.8l-3.4 -4Z`, col); P(`M${pt(tx, ty + 0.6)}l2.6 5.2l1.4 -0.4l-2.4 -5.4Z`, dk(col, 0.1)); } }

  // ── Glasses or a face shield ──
  const gl = f.acc?.glasses;
  if (gl) { const fcol = FRAME[gl.color] || FRAME.black, thin = gl.kind === 'rimless' || gl.color === 'metal', w = thin ? 0.45 : 0.95, lw = ea * 1.42, lh = 3.6;
    if (gl.kind === 'goggles') { const L = cx - ex - lw - 1.2, Rr = cx + ex + lw + 1.2, t = ey - 4.4, b = ey + 3.8, d = `M${pt(L, t + 1.6)}Q${pt(cx, t - 1.2)} ${pt(Rr, t + 1.6)}L${pt(Rr - 0.6, b - 1.2)}Q${pt(cx + ex, b + 1)} ${pt(cx + 2.2, b - 0.6)}Q${pt(cx, b - 2.6)} ${pt(cx - 2.2, b - 0.6)}Q${pt(cx - ex, b + 1)} ${pt(L + 0.6, b - 1.2)}Z`;
      [-1, 1].forEach(s => P(`M${pt(cx + s * (ex + lw + 0.8), ey - 2)}L${pt(cx + s * (rw + 1.2), ey - 2.6)}L${pt(cx + s * (rw + 1.2), ey + 0.4)}L${pt(cx + s * (ex + lw + 0.8), ey + 0.8)}Z`, gl.color === 'clear' ? '#2b2b2b' : fcol));
      P(d, '#d9e7f4', 0.22); S(d, gl.color === 'clear' ? '#9aa3ab' : fcol, 1.6); S(`M${pt(cx - ex - 1.5, ey - 2.4)}l2.4 -1.2M${pt(cx + ex - 1.5, ey - 2.4)}l2.4 -1.2`, '#ffffff', 0.6, 0.5); }
    else { [-1, 1].forEach(s => { const lx = cx + s * ex, ly = ey + 0.3;
        const lens = gl.kind === 'round' ? `M${pt(lx - lw * 0.88, ly)}A${n2(lw * 0.88)} ${n2(lw * 0.88)} 0 1 0 ${pt(lx + lw * 0.88, ly)}A${n2(lw * 0.88)} ${n2(lw * 0.88)} 0 1 0 ${pt(lx - lw * 0.88, ly)}Z`
          : `M${pt(lx - lw + 1.5, ly - lh)}L${pt(lx + lw - 1.5, ly - lh)}Q${pt(lx + lw, ly - lh)} ${pt(lx + lw, ly - lh + 1.5)}L${pt(lx + lw - 0.3, ly + lh * 0.75 - 1.2)}Q${pt(lx + lw - 0.5, ly + lh * 0.8)} ${pt(lx + lw - 2, ly + lh * 0.8)}L${pt(lx - lw + 2, ly + lh * 0.8)}Q${pt(lx - lw + 0.5, ly + lh * 0.8)} ${pt(lx - lw + 0.3, ly + lh * 0.75 - 1.2)}L${pt(lx - lw, ly - lh + 1.5)}Q${pt(lx - lw, ly - lh)} ${pt(lx - lw + 1.5, ly - lh)}Z`;
        P(lens, '#dbe8f5', 0.16); S(lens, gl.kind === 'rimless' ? mixC(fcol, '#ffffff', 0.4) : fcol, gl.kind === 'rimless' ? 0.3 : w);
        if (gl.kind === 'browline') S(`M${pt(lx - lw + 0.4, ly - lh + 0.3)}L${pt(lx + lw - 0.4, ly - lh + 0.3)}`, gl.color === 'metal' ? '#161616' : fcol, 1.7);
        S(`M${pt(lx - lw * 0.45, ly - 1.4)}l1.8 -1.6`, '#ffffff', 0.5, 0.5);
        S(`M${pt(lx + s * lw, ly - lh * 0.5)}L${pt(cx + s * (rw + 0.6), ey - 0.8)}`, fcol, w); });
      S(`M${pt(cx - ex + lw * 0.86, ey - 0.6)}Q${pt(cx, ey - 2.2)} ${pt(cx + ex - lw * 0.86, ey - 0.6)}`, fcol, w); } }
  const shl = f.acc?.shield;
  if (shl && !gl) { const top = by - 1.6, bot = noseY + 1.2, w0 = rw * 0.9;
    const od = `M${pt(cx - w0, top + 2)}Q${pt(cx, top - 2.2)} ${pt(cx + w0, top + 2)}L${pt(cx + w0 * 0.9, bot - 1)}Q${pt(cx + w0 * 0.55, bot + 1.5)} ${pt(cx + nhw + 1.8, bot)}Q${pt(cx, bot + 2.6)} ${pt(cx - nhw - 1.8, bot)}Q${pt(cx - w0 * 0.55, bot + 1.5)} ${pt(cx - w0 * 0.9, bot - 1)}Z`;
    const hole = (s: number) => { const lx = cx + s * ex, rx = ea * 1.35, ry = 3.1; return `M${pt(lx - rx, ey)}A${n2(rx)} ${n2(ry)} 0 1 0 ${pt(lx + rx, ey)}A${n2(rx)} ${n2(ry)} 0 1 0 ${pt(lx - rx, ey)}Z`; };
    const d = od + hole(-1) + hole(1), clear = shl.kind !== 'black';
    [-1, 1].forEach(s => { S(`M${pt(cx + s * w0, top + 3)}L${pt(cx + s * (rw + 1.4), top + 1.5)}`, '#161616', 1.4); S(`M${pt(cx + s * w0 * 0.92, bot - 2)}L${pt(cx + s * (rw + 1.2), bot - 3)}`, '#161616', 1.2); });
    if (clear) { P(d, '#e3edf6', 0.26, { fillRule: 'evenodd' }); S(od, '#ffffff', 0.5, 0.6); S(`M${pt(cx - w0 * 0.6, top + 2.5)}L${pt(cx - w0 * 0.3, bot - 2)}`, '#ffffff', 1, 0.3); }
    else { P(d, '#151515', 0.93, { fillRule: 'evenodd' }); S(`M${pt(cx - w0 * 0.55, top + 2)}Q${pt(cx - w0 * 0.2, top)} ${pt(cx + w0 * 0.1, top + 1)}`, '#ffffff', 0.6, 0.2); } }

  return createElement('svg', { viewBox: '0 0 100 150', width: '100%', height: '100%', style: { display: 'block' } }, ...out);
}

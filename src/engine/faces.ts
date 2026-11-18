// Faces: Basketball Manager's own generator and renderer (not facesjs).
//
// makeFace(p, salt, kin) describes a face as plain JSON. It is deterministic from the player's face seed
// (his id until he gets a new face) mixed with the league's seed, so player #57 doesn't look the same in
// every league. Nothing is stored: the face follows the player's age (grey hair, a receding hairline,
// lines) and his father's or older brother's face (family resemblance). What you change in the face
// editor is stored on the player (p.faceX) and laid over the generated face.
// Looks are drawn independently of each other: hair style follows hair texture rather than race, and dyed
// hair, beards, accessories and expressions can show up on anyone.
// faceSvg(face, jersey, label) combines painted portrait parts with editable proportions and colors.
// Bundled artwork, tints and masks live in illustratedFaces.ts; generation and saved descriptions stay here.
import { illustratedFaceSvg } from './illustratedFaces';
import { mulberry32 } from './rng';
import { FACE_LOOK_KEYS, ancestryValue, ancestryWeights, beardWeights, faceAncestry } from './faceAncestry';

type Rnd = () => number;
const n2 = (v: number) => Math.round(v * 100) / 100;
const r2 = n2;
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const hx = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = (a: number[]) =>
  '#' +
  a
    .map(v =>
      Math.round(cl(v, 0, 255))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
export const mixC = (a: string, b: string, t: number) => {
  const A = hx(a),
    B = hx(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const dk = (c: string, t: number) => mixC(c, '#000000', t);
const lumOf = (c: string) => {
  const [r, g, b] = hx(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const wpick = (rnd: Rnd, o: Record<string, number>) => {
  let t = 0;
  for (const k in o) t += o[k];
  let r = rnd() * t;
  for (const k in o) if ((r -= o[k]) < 0) return k;
  return Object.keys(o)[0];
};
const bell = (rnd: Rnd) => (rnd() + rnd() + rnd() - 1.5) * 2; // mean 0, sd 1, never past ±3
// ── What a face can have (the editor offers the same lists) ──
const SKIN_RAMP = ['#f8e2d0', '#f1cfb6', '#e7bd9e', '#dbaa87', '#cc9772', '#b9825e', '#a26c4a', '#895a3b', '#71462d', '#5a3622', '#43281a'];
const UNDERTONES: Record<string, string | null> = { neutral: null, warm: '#e3a35c', olive: '#9c9a5a', rosy: '#e3958a' };
export const skinColor = (tone: number, under = 'neutral') => {
  const x = cl(tone) * (SKIN_RAMP.length - 1),
    i = Math.min(SKIN_RAMP.length - 2, Math.floor(x)),
    c = mixC(SKIN_RAMP[i], SKIN_RAMP[i + 1], x - i),
    u = UNDERTONES[under];
  // The darkest tones (very dark skin) deepen past the ramp's end toward a deep brown-black.
  const d = tone > 0.88 ? mixC(c, '#24150d', Math.min(1, (tone - 0.88) / 0.12) * 0.65) : c;
  return u ? mixC(d, u, 0.09) : d;
};
export const HAIR_COLORS: Record<string, [string, string]> = {
  black: ['Black', '#121010'],
  softBlack: ['Soft black', '#1e1814'],
  darkBrown: ['Dark brown', '#2d2119'],
  brown: ['Brown', '#4a3421'],
  lightBrown: ['Light brown', '#6c4b2d'],
  darkBlonde: ['Dark blond', '#8e6b41'],
  blonde: ['Blond', '#b89159'],
  lightBlonde: ['Light blond', '#d3b47c'],
  auburn: ['Auburn', '#5f2d1b'],
  red: ['Red', '#8b3b1f'],
  ginger: ['Ginger', '#a9562c'],
};
export const DYES: Record<string, [string, string]> = {
  bleach: ['Bleached blond', '#dcc089'],
  platinum: ['Platinum', '#ebe3cc'],
  honey: ['Honey blond', '#bc8c4f'],
  copper: ['Copper', '#a8552b'],
  burgundy: ['Burgundy', '#5f1f2c'],
  ash: ['Ash brown', '#7b6e63'],
  silver: ['Silver', '#c2c6ca'],
  jet: ['Jet black', '#0c0c0e'],
};
export const DYE_KINDS = [
  ['full', 'All over'],
  ['highlights', 'Highlights'],
  ['tips', 'Frosted tips'],
];
export const EYE_COLORS: Record<string, [string, string]> = {
  dark: ['Dark brown', '#2a1b11'],
  brown: ['Brown', '#3f2817'],
  amber: ['Amber', '#6e4c22'],
  hazel: ['Hazel', '#6f6b3b'],
  green: ['Green', '#58714b'],
  grey: ['Grey', '#7b8890'],
  blue: ['Blue', '#4e7ba6'],
  lightBlue: ['Light blue', '#7ba2c5'],
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
  expr: [
    ['serious', 'Serious'],
    ['slight', 'Slight smile'],
    ['smile', 'Smile'],
    ['relaxed', 'Relaxed'],
    ['mean', 'Mean mug'],
    ['smirk', 'Smirk'],
  ],
  eyes: [
    ['almond', 'Almond'],
    ['round', 'Round'],
    ['hooded', 'Hooded'],
    ['monolid', 'Monolid'],
    ['deepset', 'Deep-set'],
    ['downturned', 'Downturned'],
    ['upturned', 'Upturned'],
  ],
  brows: [
    ['straight', 'Straight'],
    ['soft', 'Soft arch'],
    ['arched', 'Arched'],
    ['angled', 'Angled'],
    ['flat', 'Low and flat'],
    ['bushy', 'Bushy'],
  ],
  hairline: [
    ['natural', 'Natural'],
    ['shapeup', 'Shape-up'],
    ['straight', 'Straight'],
    ['peak', 'Widow’s peak'],
    ['round', 'Rounded'],
  ],
  under: [
    ['neutral', 'Neutral'],
    ['warm', 'Warm'],
    ['olive', 'Olive'],
    ['rosy', 'Rosy'],
  ],
  facial: [
    ['none', 'Clean-shaven'],
    ['stubble', 'Stubble'],
    ['heavyStubble', 'Heavy stubble'],
    ['patchy', 'Patchy'],
    ['mustache', 'Mustache'],
    ['soulpatch', 'Soul patch'],
    ['chinpuff', 'Chin puff'],
    ['goatee', 'Goatee'],
    ['circle', 'Circle beard'],
    ['vandyke', 'Van Dyke'],
    ['chinstrap', 'Chinstrap'],
    ['chinstrapMustache', 'Chinstrap and mustache'],
    ['shortBeard', 'Short beard'],
    ['fullBeard', 'Full beard'],
    ['thickBeard', 'Thick beard'],
  ],
  headband: [
    ['team', 'Team color'],
    ['team2', 'Team trim'],
    ['white', 'White'],
    ['black', 'Black'],
    ['red', 'Red'],
    ['navy', 'Navy'],
    ['grey', 'Grey'],
  ],
  headbandKind: [
    ['standard', 'Standard'],
    ['thin', 'Thin'],
    ['wide', 'Wide'],
    ['tied', 'Tied'],
  ],
  metal: [
    ['diamond', 'Diamond'],
    ['gold', 'Gold'],
    ['silver', 'Silver'],
    ['black', 'Black'],
  ],
  glasses: [
    ['rect', 'Rectangular'],
    ['round', 'Round'],
    ['browline', 'Browline'],
    ['rimless', 'Rimless'],
    ['goggles', 'Sports goggles'],
  ],
  frame: [
    ['black', 'Black'],
    ['tortoise', 'Tortoiseshell'],
    ['metal', 'Metal'],
    ['clear', 'Clear'],
  ],
  undershirt: [
    ['white', 'White'],
    ['black', 'Black'],
    ['team', 'Team color'],
  ],
};
const HAIR_LABELS = Object.keys(HAIR_STYLES).map(k => [k, HAIR_STYLES[k].label]);
export const hairStyleOpts = () => HAIR_LABELS;

// ── Generation ──
const RACES: readonly string[] = FACE_LOOK_KEYS;
// The looks the editors offer (p.race). 'dark' is very dark skin, as in much of Africa; 'black' is the
// range of most Black Americans, many of whom also have European ancestry. Both share features and hair.
export const FACE_LOOKS: [string, string][] = [
  ['dark', 'Very dark skin'],
  ['black', 'Darker skin'],
  ['brown', 'Medium skin'],
  ['white', 'Lighter skin'],
  ['asian', 'East Asian features'],
];
// Skin tone (0 lightest … 1 darkest): mean, spread and limits by look; the ranges overlap.
const TONE: Record<string, number[]> = {
  white: [0.13, 0.085, 0, 0.37],
  asian: [0.21, 0.085, 0.04, 0.43],
  brown: [0.43, 0.125, 0.18, 0.72],
  black: [0.67, 0.12, 0.42, 0.88],
  dark: [0.94, 0.045, 0.84, 1],
};
const UNDER_W: Record<string, Record<string, number>> = {
  white: { neutral: 35, rosy: 33, warm: 17, olive: 15 },
  asian: { warm: 45, neutral: 30, olive: 25 },
  brown: { warm: 40, olive: 34, neutral: 26 },
  black: { neutral: 45, warm: 40, rosy: 15 },
};
const NAT_W: Record<string, Record<string, number>> = {
  white: {
    black: 6,
    softBlack: 8,
    darkBrown: 26,
    brown: 22,
    lightBrown: 12,
    darkBlonde: 9,
    blonde: 7,
    lightBlonde: 3,
    auburn: 3,
    red: 2,
    ginger: 2,
  },
  black: { black: 55, softBlack: 35, darkBrown: 10 },
  asian: { black: 50, softBlack: 38, darkBrown: 12 },
  brown: { black: 38, softBlack: 34, darkBrown: 22, brown: 6 },
};
const TEX_W: Record<string, Record<string, number>> = {
  black: { coily: 74, curly: 20, wavy: 6 },
  white: { straight: 48, wavy: 36, curly: 16 },
  asian: { straight: 76, wavy: 18, curly: 6 },
  brown: { straight: 28, wavy: 38, curly: 28, coily: 6 },
};
// Hair styles by texture (what the hair can do), not by who wears it.
const STYLE_W: Record<string, Record<string, number>> = {
  coily: {
    fade: 13,
    waves: 9,
    buzz: 9,
    caesar: 5,
    crew: 4,
    shortAfro: 7,
    twists: 7,
    locsShort: 5,
    locsLong: 4,
    locsUp: 3,
    cornrows: 5,
    braids: 3,
    afro: 3,
    curlyTop: 4,
    frohawk: 2,
    hightop: 1.5,
    flattop: 2,
    shaved: 5,
    bald: 4,
    mohawk: 0.5,
    manbun: 0.5,
  },
  curly: {
    curlyTop: 10,
    curlyMop: 8,
    fade: 8,
    crop: 6,
    shortAfro: 4,
    buzz: 7,
    crew: 6,
    locsShort: 2,
    twists: 2,
    long: 3,
    manbun: 3,
    mullet: 1,
    undercut: 3,
    sidepart: 2,
    messy: 3,
    shag: 2,
    shaved: 4,
    bald: 3,
    braids: 1,
    cornrows: 1,
    frohawk: 1,
  },
  wavy: {
    crop: 8,
    sidepart: 7,
    messy: 7,
    quiff: 6,
    slick: 5,
    fringe: 5,
    curtains: 5,
    crew: 7,
    fade: 7,
    buzz: 6,
    undercut: 5,
    long: 3,
    manbun: 3,
    mullet: 1.5,
    shag: 3,
    shaved: 4,
    bald: 3,
    curlyTop: 2,
    spiky: 1,
    braids: 0.5,
    cornrows: 0.5,
    locsShort: 0.5,
  },
  straight: {
    crop: 9,
    sidepart: 8,
    fringe: 7,
    spiky: 5,
    messy: 6,
    quiff: 6,
    slick: 5,
    curtains: 5,
    crew: 7,
    fade: 7,
    buzz: 7,
    undercut: 6,
    long: 2.5,
    manbun: 2.5,
    mullet: 1.5,
    shaved: 4,
    bald: 3,
    mohawk: 0.6,
    cornrows: 0.5,
    braids: 0.5,
    shag: 1.5,
  },
};
const FEM_STYLE_W: Record<string, Record<string, number>> = {
  coily: {
    afro: 12,
    shortAfro: 8,
    braids: 16,
    locsLong: 10,
    locsUp: 8,
    twists: 8,
    bun: 8,
    longCurls: 6,
    cornrows: 3,
    buzz: 2,
    bob: 4,
    pixie: 3,
  },
  curly: { longCurls: 22, curlyMop: 8, bun: 10, bob: 8, long: 10, shag: 6, pixie: 4, braids: 3 },
  wavy: { long: 20, longPart: 14, bob: 12, bun: 10, shag: 8, pixie: 5, slick: 4, longCurls: 4, sidepart: 3 },
  straight: { long: 22, longPart: 16, bob: 14, bun: 10, shag: 6, pixie: 5, fringe: 5, slick: 3 },
};
const SHAPEUP_STYLES = new Set([
  'fade',
  'caesar',
  'waves',
  'buzz',
  'crew',
  'twists',
  'flattop',
  'hightop',
  'frohawk',
  'curlyTop',
  'crop',
  'cornrows',
  'shortAfro',
]);
const TIPS_OK = new Set([
  'fade',
  'crew',
  'crop',
  'spiky',
  'twists',
  'flattop',
  'hightop',
  'curlyTop',
  'shortAfro',
  'messy',
  'frohawk',
  'mohawk',
  'quiff',
]);

export function makeFace(p: any, salt = 0, kin?: any) {
  const base = Math.floor(p.faceSeed ?? p.id ?? 0) | 0,
    seed = (Math.imul(base, 7919) + 13 + Math.imul(salt | 0, 104729)) | 0;
  const rnd = mulberry32(seed),
    race = RACES.includes(p.race) ? p.race : 'white',
    age = p.age ?? 25,
    fem = !!p.fem; // a missing look never breaks a page
  const ancestry = faceAncestry(p),
    sources = Object.keys(ancestry),
    mixed = sources.length > 1;
  const source = mixed ? race : sources[0];
  const fr = source === 'dark' ? 'black' : source; // the deepest skin tone shares the feature tables
  const weights = (tables: Record<string, Record<string, number>>) => (mixed ? ancestryWeights(ancestry, tables) : tables[fr]);
  const k = kin && kin.v === 3 ? kin : null;
  const kinAncestry = k ? faceAncestry({ race: k.race, faceAncestry: k.ancestry }) : null;
  const same = !!k && k.race === race && FACE_LOOK_KEYS.every(key => Math.abs((ancestry[key] || 0) - (kinAncestry?.[key] || 0)) < 1e-9);
  // Build: heavier for his height → a fuller face and neck.
  const hm = /(\d+)\D+(\d+)/.exec(p.hgt || ''),
    hIn = hm ? +hm[1] * 12 + +hm[2] : 0;
  const build = r2(cl((hIn && p.wt ? (p.wt - (hIn * 2.9 + 7.5)) / 14 : 0) + bell(rnd) * 0.18, -1, 1));
  const [tm, ts, tlo, thi] = mixed
    ? [0, 1]
        .map(i => ancestryValue(ancestry, Object.fromEntries(Object.entries(TONE).map(([key, value]) => [key, value[i]]))))
        .concat(Math.min(...sources.map(key => TONE[key][2])), Math.max(...sources.map(key => TONE[key][3])))
    : TONE[source];
  let tone = cl(tm + ts * bell(rnd), tlo, thi),
    under = wpick(rnd, weights(UNDER_W));
  if (k) {
    tone = cl(same ? k.skin.tone + 0.03 * bell(rnd) : (tone + k.skin.tone) / 2);
    if (rnd() < 0.8) under = k.skin.under;
  }
  const blend = (a: any, b: any, keys: string[], t: number) => {
    if (b)
      keys.forEach(x => {
        if (typeof b[x] === 'number') a[x] = r2(a[x] * (1 - t) + b[x] * t);
      });
  };
  const head: any = {
    w: r2(0.9 + 0.2 * rnd() + build * 0.03),
    h: r2(0.94 + 0.13 * rnd()),
    sq: r2(rnd()),
    cheek: r2(0.97 + 0.07 * rnd()),
    jaw: r2(cl(0.78 + 0.19 * rnd() + build * 0.04, 0.74, 0.99)),
    jawY: r2(0.62 + 0.2 * rnd()),
    chin: r2(rnd()),
    chinW: r2(cl(0.3 + 0.2 * rnd() + build * 0.04, 0.26, 0.54)),
    cleft: rnd() < 0.07,
  };
  if (fem) {
    head.jaw = r2(Math.min(head.jaw, 0.74 + 0.1 * rnd()));
    head.chinW = r2(Math.min(head.chinW, 0.26 + 0.08 * rnd()));
    head.sq = r2(head.sq * 0.4);
    head.cleft = false;
  } // a softer, narrower jaw
  const ears: any = { size: r2(0.85 + 0.3 * rnd()), out: r2(rnd()) };
  const eShape = wpick(
    rnd,
    mixed
      ? ancestryWeights(ancestry, {
          asian: { almond: 26, round: 10, hooded: 14, monolid: 32, deepset: 4, downturned: 6, upturned: 8 },
          black: { almond: 30, round: 16, hooded: 16, monolid: 3, deepset: 13, downturned: 10, upturned: 12 },
        })
      : fr === 'asian'
        ? { almond: 26, round: 10, hooded: 14, monolid: 32, deepset: 4, downturned: 6, upturned: 8 }
        : { almond: 30, round: 16, hooded: 16, monolid: 3, deepset: 13, downturned: 10, upturned: 12 },
  );
  const lightChance = { white: 0.55, brown: 0.07, asian: 0.015, black: 0.02 };
  const lightEyes = rnd() < (mixed ? ancestryValue(ancestry, lightChance) : lightChance[fr]);
  const eyes: any = {
    shape: eShape,
    size: r2(0.9 + 0.22 * rnd()),
    spacing: r2(0.93 + 0.14 * rnd()),
    tilt: r2(eShape === 'upturned' ? 0.12 + 0.06 * rnd() : eShape === 'downturned' ? -0.07 - 0.05 * rnd() : (rnd() - 0.45) * 0.14),
    lid: r2(rnd()),
    color: lightEyes
      ? wpick(rnd, { amber: 12, hazel: 22, green: 20, grey: 10, blue: 26, lightBlue: 10 })
      : wpick(rnd, { dark: 55, brown: 45 }),
  };
  const bShape = wpick(rnd, { straight: 24, soft: 26, arched: 14, angled: 12, flat: 12, bushy: 12 });
  const brows: any = {
    shape: fem && bShape === 'bushy' ? 'arched' : bShape,
    thick: r2(fem ? 0.6 + 0.35 * rnd() : 0.85 + 0.7 * rnd() + (bShape === 'bushy' ? 0.4 : 0)),
    len: r2(rnd()),
    gap: r2(rnd()),
    tilt: r2((rnd() - 0.5) * 0.4),
    slit: rnd() < 0.035 ? (rnd() < 0.7 ? 1 : 2) : 0,
  };
  const nb = mixed
      ? ancestryValue(ancestry, { black: 0.2, dark: 0.2, brown: 0.08, asian: 0.05, white: 0 })
      : ({ black: 0.2, brown: 0.08, asian: 0.05 } as any)[fr] || 0,
    lb = mixed
      ? ancestryValue(ancestry, { black: 0.22, dark: 0.22, brown: 0.08, white: 0, asian: 0 })
      : fr === 'black'
        ? 0.22
        : fr === 'brown'
          ? 0.08
          : 0;
  const nose: any = {
    w: r2(cl(rnd() * 0.85 + nb + build * 0.08)),
    len: r2(rnd()),
    bridge: r2(rnd()),
    tip: r2(rnd()),
    flare: r2(rnd()),
    crook: rnd() < 0.03 ? (rnd() < 0.5 ? -1 : 1) : 0,
  };
  const mouth: any = {
    w: r2(rnd()),
    upper: r2(cl(rnd() * 0.8 + lb + (fem ? 0.2 : 0))),
    lower: r2(cl(rnd() * 0.8 + lb + 0.05 + (fem ? 0.2 : 0))),
    bow: r2(rnd()),
  };
  if (k) {
    blend(head, k.head, ['w', 'h', 'sq', 'cheek', 'jaw', 'jawY', 'chin', 'chinW'], 0.5);
    blend(nose, k.nose, ['w', 'len', 'bridge', 'tip', 'flare'], 0.6);
    blend(mouth, k.mouth, ['w', 'upper', 'lower', 'bow'], 0.5);
    blend(ears, k.ears, ['size', 'out'], 0.6);
    blend(eyes, k.eyes, ['size', 'spacing', 'tilt'], 0.5);
    if (rnd() < 0.6) eyes.color = k.eyes.color;
    if (rnd() < 0.5) eyes.shape = k.eyes.shape;
    if (rnd() < 0.5) brows.shape = k.brows.shape;
  }
  const expr = wpick(rnd, { serious: 28, slight: 24, relaxed: 16, smile: 13, mean: 12, smirk: 7 });
  // Age: lines, grey and a receding hairline arrive at different ages for different people.
  const lines = r2(cl((age - 27) / 14) * (0.6 + 0.4 * rnd())),
    greyAt = 27 + 26 * rnd() + (fem ? 12 : 0),
    /* many women color theirs */ grey = r2(cl((age - greyAt) / 12, 0, 0.9));
  const beardGrey = r2(cl((age - greyAt + 3 - 4 * rnd()) / 10, 0, 0.9)),
    recAt = 22 + 32 * rnd(),
    recede = fem ? 0 : r2(cl((age - recAt) / 12) * (rnd() < 0.55 ? 1 : 0.35));
  const bags = r2(cl(lines * 0.7 + rnd() * 0.15));
  let tex = wpick(rnd, weights(TEX_W)),
    natural = wpick(rnd, weights(NAT_W));
  if (k) {
    if (rnd() < 0.8) tex = k.hair.tex;
    if (rnd() < 0.75) natural = k.hair.natural;
  }
  const sw = fem ? { ...(FEM_STYLE_W[tex] || FEM_STYLE_W.straight) } : { ...(STYLE_W[tex] || STYLE_W.straight) };
  if (fem && age > 50)
    ['long', 'longPart', 'longCurls', 'braids', 'locsLong'].forEach(x => {
      if (sw[x]) sw[x] *= 0.45;
    }); // shorter styles later in life
  if (!fem) sw.bald = (sw.bald || 0) * (1 + Math.max(0, age - 29) * 0.25) * (1 + recede * 3);
  sw.shaved = (sw.shaved || 0) * (1 + recede * 2);
  if (age > 32)
    ['long', 'manbun', 'mullet', 'locsLong'].forEach(x => {
      if (sw[x]) sw[x] *= 0.6;
    });
  const style = wpick(rnd, sw);
  const hairline = wpick(
    rnd,
    SHAPEUP_STYLES.has(style)
      ? { shapeup: 45, natural: 30, straight: 13, peak: 6, round: 6 }
      : { natural: 50, straight: 16, peak: 10, round: 18, shapeup: 6 },
  );
  const dr = rnd(),
    dyeKind = dr < 0.07 ? 'full' : dr < 0.1 ? 'highlights' : dr < 0.118 && TIPS_OK.has(style) ? 'tips' : null;
  const lightNat = lumOf(HAIR_COLORS[natural][1]) > 0.25,
    dyePick = wpick(rnd, {
      bleach: 34,
      platinum: 14,
      honey: 16,
      copper: 9,
      burgundy: 7,
      ash: 6,
      silver: 6,
      ...(lightNat ? { jet: 10 } : {}),
    });
  const dye = dyeKind && style !== 'bald' && style !== 'shaved' ? dyePick : null;
  const hair: any = {
    style,
    tex,
    natural,
    dye,
    dyeKind: dye ? dyeKind : null,
    hairline,
    high: r2(rnd()),
    recede,
    grey,
    part: rnd() < 0.5 ? -1 : 1,
    len: r2(rnd()),
    sb: r2(rnd()),
  };
  const fw =
    age < 20
      ? { none: 50, patchy: 18, stubble: 18, mustache: 4, soulpatch: 4, chinpuff: 6 }
      : age < 23
        ? {
            none: 34,
            stubble: 18,
            patchy: 8,
            heavyStubble: 6,
            goatee: 6,
            circle: 6,
            mustache: 4,
            shortBeard: 8,
            chinstrap: 3,
            soulpatch: 3,
            chinpuff: 3,
            fullBeard: 1,
          }
        : {
            none: 26,
            stubble: 14,
            heavyStubble: 9,
            mustache: 4,
            goatee: 6,
            circle: 8,
            vandyke: 2,
            chinstrap: 3,
            chinstrapMustache: 3,
            shortBeard: 10,
            fullBeard: 8,
            thickBeard: 3,
            soulpatch: 2,
            chinpuff: 2,
            patchy: 2,
          };
  const beard = beardWeights(fw as Record<string, number>, ancestry, seed);
  const fStyle = fem ? 'none' : wpick(rnd, beard.weights),
    fDen = rnd();
  const facial: any = {
    style: fStyle,
    density: r2(fStyle === 'patchy' ? Math.min(0.55, beard.density) : Math.min(1, beard.density + fDen * 0.03)),
    grey: beardGrey,
  };
  // Accessories, each drawn on its own: headbands are common, earrings fairly common, nose studs
  // uncommon, lip and eyebrow rings rare, glasses and face shields exceptionally rare.
  const metal = () => wpick(rnd, { diamond: 45, gold: 22, silver: 18, black: 15 }),
    side = () => (rnd() < 0.5 ? -1 : 1);
  const a = Array.from({ length: 9 }, () => rnd());
  const acc: any = {
    headband:
      !fem && a[0] < 0.13
        ? {
            color: wpick(rnd, { team: 30, team2: 18, white: 22, black: 20, red: 4, navy: 3, grey: 3 }),
            kind: wpick(rnd, { standard: 60, thin: 25, wide: 12, tied: 3 }),
          }
        : null,
    earrings: a[1] < (fem ? 0.75 : 0.19) ? { kind: wpick(rnd, { stud: 80, hoop: 20 }), metal: metal(), both: rnd() < 0.62 } : null,
    nose:
      a[2] < 0.035
        ? { kind: 'stud', metal: metal(), side: side() }
        : a[2] < 0.047
          ? { kind: wpick(rnd, { ring: 60, septum: 40 }), metal: metal(), side: side() }
          : null,
    lip: a[3] < 0.007 ? { kind: wpick(rnd, { ring: 70, labret: 30 }), metal: metal(), side: side() } : null,
    brow: a[4] < 0.007 ? { metal: metal(), side: side() } : null,
    glasses:
      a[5] < 0.004
        ? {
            kind: wpick(rnd, { rect: 30, round: 20, goggles: 30, rimless: 10, browline: 10 }),
            color: wpick(rnd, { black: 40, tortoise: 20, metal: 20, clear: 20 }),
          }
        : null,
    shield: a[5] >= 0.004 && a[6] < 0.003 ? { kind: wpick(rnd, { clear: 60, black: 40 }) } : null,
    undershirt: !fem && a[7] < 0.05 ? wpick(rnd, { white: 40, black: 40, team: 20 }) : null,
  };
  const marks: any = {
    freckles: a[8] < (tone < 0.35 ? 0.075 : 0.025) ? r2(0.4 + 0.6 * rnd()) : 0,
    mole: rnd() < 0.1 ? [r2(rnd() * 2 - 1), r2(rnd())] : null,
    tattoo: rnd() < 0.06 ? { side: side(), kind: rnd() < 0.5 ? 'script' : 'design' } : null,
    dimples: rnd() < 0.14,
  };
  const face: any = {
    v: 3,
    generator: 'Basketball Manager faces',
    seed: seed >>> 0,
    race,
    ancestry,
    ...(fem ? { fem: true } : {}),
    skin: { tone: r2(tone), under },
    build,
    head,
    ears,
    eyes,
    brows,
    nose,
    mouth,
    expr,
    hair,
    facial,
    acc,
    marks,
    age: { years: age, lines, bags },
  };
  if (p.faceX) applyFaceX(face, p.faceX);
  face.ancestry = ancestry; // derived metadata stays normalized after applying editable feature overrides
  return finishFace(face);
}

// Edits from the face editor: { 'hair.style': 'afro', 'acc.glasses': {...}, ... } laid over the face.
export function applyFaceX(face: any, x: Record<string, any>) {
  Object.entries(x || {}).forEach(([path, v]) => {
    const ks = path.split('.');
    let o = face;
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = v;
  });
  return face;
}
// The colors a face is drawn in, from its genes (natural hair, dye, grey; skin tone and undertone).
export function finishFace(f: any) {
  f.skin.color = skinColor(f.skin.tone, f.skin.under);
  const H = f.hair,
    nat = (HAIR_COLORS[H.natural] || HAIR_COLORS.black)[1],
    greyC = H.grey > 0.6 ? '#d4d1cb' : '#a9a6a0';
  H.natHex = mixC(nat, greyC, H.grey * 0.85);
  H.dyeHex = H.dye ? (DYES[H.dye] || DYES.bleach)[1] : null;
  H.color = H.dyeHex && H.dyeKind === 'full' ? H.dyeHex : H.natHex;
  f.eyes.hex = (EYE_COLORS[f.eyes.color] || EYE_COLORS.dark)[1];
  f.facial.color = mixC(nat, '#c9c5bd', (f.facial.grey || 0) * 0.85);
  return f;
}

// Paint composable illustration assets; generation and saved feature data remain unchanged.
export function faceSvg(f: any, jersey: [string, string] = ['#605d5d', '#bab6b6'], label?: { name?: string; num?: string }) {
  return illustratedFaceSvg(f, jersey, label);
}

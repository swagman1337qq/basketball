// Version 2 is a separate painted-parts catalogue. Version 1 paintings keep their
// original decoder and controls; no saved person's face is upgraded implicitly.
import { mulberry32 } from './rng';

export const FULL_SIZE = 320;
export const FULL_SHEETS = {
  heads: { url: new URL('../assets/illustrated/full/heads.webp', import.meta.url).href, cols: 4, rows: 4 },
  hair1: { url: new URL('../assets/illustrated/full/hair1.webp', import.meta.url).href, cols: 4, rows: 4 },
  hair2: { url: new URL('../assets/illustrated/full/hair2.webp', import.meta.url).href, cols: 4, rows: 4 },
  hair3: { url: new URL('../assets/illustrated/full/hair3.webp', import.meta.url).href, cols: 4, rows: 3 },
  beards: { url: new URL('../assets/illustrated/full/beards.webp', import.meta.url).href, cols: 4, rows: 4 },
  clothes: { url: new URL('../assets/illustrated/full/clothes.webp', import.meta.url).href, cols: 2, rows: 2 },
};
export type FullSheet = keyof typeof FULL_SHEETS;
const headLooks = [
  { asian: 1 },
  { black: 1 },
  { white: 1 },
  { brown: 1 },
  { brown: 1 },
  { black: 0.5, asian: 0.5 },
  { brown: 1 },
  { brown: 1 },
  { dark: 1 },
  { white: 1 },
  { asian: 0.5, white: 0.5 },
  { brown: 1 },
  { asian: 1 },
  { black: 1 },
  { white: 1 },
  { brown: 0.5, white: 0.5 },
];
export const FULL_HEADS = headLooks.map((looks, index) => ({
  id: 'full-' + String(index + 1).padStart(2, '0'),
  label: 'Head ' + String(index + 1).padStart(2, '0'),
  index,
  gender: index < 12 ? 'man' : 'woman',
  looks: looks as Record<string, number | undefined>,
}));
const partList = (sheet: FullSheet, entries: string[][]) => entries.map(([id, label], index) => ({ id, label, sheet, index }));
export const FULL_HAIR = [
  { id: 'bald', label: 'Shaved bald', sheet: null, index: -1 },
  ...partList('hair1', [
    ['sidepart', 'Side part'],
    ['crop', 'Textured crop'],
    ['buzz', 'Buzz cut'],
    ['crew', 'Crew cut'],
    ['fade', 'Fade'],
    ['caesar', 'Caesar'],
    ['waves', 'Waves'],
    ['shortAfro', 'Short afro'],
    ['afro', 'Afro'],
    ['twists', 'Twists'],
    ['frohawk', 'Frohawk'],
    ['mohawk', 'Mohawk'],
    ['locsShort', 'Short locs'],
    ['locsLong', 'Long locs'],
    ['locsUp', 'Locs, tied up'],
    ['cornrows', 'Cornrows'],
  ]),
  ...partList('hair2', [
    ['braids', 'Box braids'],
    ['curlyTop', 'Curly top, faded'],
    ['curlyMop', 'Curly mop'],
    ['slick', 'Slicked back'],
    ['quiff', 'Quiff'],
    ['fringe', 'Fringe'],
    ['curtains', 'Middle part'],
    ['messy', 'Messy'],
    ['spiky', 'Spiky'],
    ['undercut', 'Undercut'],
    ['manbun', 'Man bun'],
    ['long', 'Long'],
    ['mullet', 'Mullet'],
    ['shag', 'Shag'],
    ['hightop', 'High-top fade'],
    ['flattop', 'Flat-top'],
  ]),
  ...partList('hair3', [
    ['bob', 'Bob'],
    ['longPart', 'Long, middle part'],
    ['longCurls', 'Long curls'],
    ['bun', 'Bun'],
    ['pixie', 'Pixie cut'],
    ['wolf', 'Wolf cut'],
    ['kpop', 'K-pop two-block'],
    ['ponytail', 'Small ponytail'],
    ['baldingBuzz', 'Balding buzz cut'],
    ['shaved', 'Shaved (stubble)'],
    ['balding', 'Balding horseshoe'],
    ['longPonytail', 'Long ponytail'],
  ]),
];
export const FULL_BEARDS = [
  { id: 'none', label: 'Clean-shaven', sheet: null, index: -1 },
  ...partList('beards', [
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
    ['pencil', 'Pencil mustache'],
    ['longGoatee', 'Long goatee'],
  ]),
];
export const FULL_HAIR_COLORS: Record<string, [string, string]> = {
  black: ['Black', '#201a18'],
  softBlack: ['Soft black', '#29221d'],
  darkBrown: ['Dark brown', '#39281f'],
  brown: ['Brown', '#59402c'],
  lightBrown: ['Light brown', '#7e593b'],
  darkBlonde: ['Dark blond', '#927047'],
  blonde: ['Blond', '#ba955f'],
  lightBlonde: ['Light blond', '#d5b982'],
  auburn: ['Auburn', '#743b28'],
  red: ['Red', '#9b472d'],
  ginger: ['Ginger', '#b66334'],
};
export const FULL_DYES: Record<string, [string, string]> = {
  none: ['Not dyed', ''],
  bleach: ['Bleached blond', '#d8bd84'],
  platinum: ['Platinum', '#e2ded1'],
  honey: ['Honey blond', '#be945a'],
  copper: ['Copper', '#a75635'],
  burgundy: ['Burgundy', '#742e40'],
  ash: ['Ash brown', '#83766d'],
  silver: ['Silver', '#bac1c5'],
  jet: ['Jet black', '#151317'],
};
export const FULL_EYE_COLORS: Record<string, [string, string]> = {
  original: ['Original', ''],
  dark: ['Dark brown', '#302017'],
  brown: ['Brown', '#503622'],
  amber: ['Amber', '#956832'],
  hazel: ['Hazel', '#7b7848'],
  green: ['Green', '#5d7652'],
  grey: ['Grey', '#879299'],
  blue: ['Blue', '#5d87ad'],
  lightBlue: ['Light blue', '#87b4ce'],
};
export const FULL_OPTIONS = {
  hair: FULL_HAIR.map(p => [p.id, p.label]),
  facial: FULL_BEARDS.map(p => [p.id, p.label]),
  texture: [
    ['straight', 'Straight'],
    ['wavy', 'Wavy'],
    ['curly', 'Curly'],
    ['coily', 'Coily'],
  ],
  natural: Object.entries(FULL_HAIR_COLORS).map(([k, v]) => [k, v[0]]),
  dye: Object.entries(FULL_DYES).map(([k, v]) => [k, v[0]]),
  dyeKind: [
    ['full', 'All over'],
    ['highlights', 'Highlights'],
    ['tips', 'Frosted tips'],
  ],
  hairline: [
    ['natural', 'Natural'],
    ['shapeup', 'Shape-up'],
    ['straight', 'Straight'],
    ['peak', 'Widow’s peak'],
    ['round', 'Rounded'],
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
  eyeColor: Object.entries(FULL_EYE_COLORS).map(([k, v]) => [k, v[0]]),
  brows: [
    ['straight', 'Straight'],
    ['soft', 'Soft arch'],
    ['arched', 'Arched'],
    ['angled', 'Angled'],
    ['flat', 'Low and flat'],
    ['bushy', 'Bushy'],
  ],
  expr: [
    ['serious', 'Serious'],
    ['slight', 'Slight smile'],
    ['smile', 'Smile'],
    ['relaxed', 'Relaxed'],
    ['mean', 'Mean mug'],
    ['smirk', 'Smirk'],
  ],
  under: [
    ['neutral', 'Neutral'],
    ['warm', 'Warm'],
    ['olive', 'Olive'],
    ['rosy', 'Rosy'],
  ],
  glasses: [
    ['none', 'None'],
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
  headband: [
    ['none', 'None'],
    ['team', 'Team color'],
    ['team2', 'Team trim'],
    ['white', 'White'],
    ['black', 'Black'],
    ['red', 'Red'],
    ['navy', 'Navy'],
    ['grey', 'Grey'],
  ],
  bandKind: [
    ['standard', 'Standard'],
    ['thin', 'Thin'],
    ['wide', 'Wide'],
    ['tied', 'Tied'],
  ],
  earrings: [
    ['none', 'None'],
    ['stud1', 'One stud'],
    ['stud2', 'Studs'],
    ['hoop1', 'One hoop'],
    ['hoop2', 'Hoops'],
  ],
  metal: [
    ['diamond', 'Diamond'],
    ['gold', 'Gold'],
    ['silver', 'Silver'],
    ['black', 'Black'],
  ],
  noseRing: [
    ['none', 'None'],
    ['stud', 'Stud'],
    ['ring', 'Ring'],
    ['septum', 'Septum ring'],
  ],
  lipRing: [
    ['none', 'None'],
    ['ring', 'Ring'],
    ['labret', 'Stud'],
  ],
  shield: [
    ['none', 'None'],
    ['clear', 'Clear'],
    ['black', 'Black'],
  ],
  tattoo: [
    ['none', 'None'],
    ['script', 'Script'],
    ['design', 'Star'],
  ],
  undershirt: [
    ['none', 'None'],
    ['white', 'White'],
    ['black', 'Black'],
    ['team', 'Team color'],
  ],
  outfit: [
    ['jersey', 'Team jersey'],
    ['polo', 'Staff polo'],
    ['suit', 'Suit'],
    ['blouse', 'Staff blouse'],
    ['tie', 'Suit and tie'],
  ],
} satisfies Record<string, string[][]>;
export type FullChoiceKey = keyof typeof FULL_OPTIONS;
// All proportions are centred at zero; bounded together again in the warp.
export const FULL_PROPORTIONS = [
  'headWidth',
  'headLength',
  'cheek',
  'jaw',
  'chinWidth',
  'chinLength',
  'eyeSize',
  'spacing',
  'tilt',
  'browWeight',
  'noseWidth',
  'noseLength',
  'noseBridge',
  'noseTip',
  'mouthWidth',
  'upperLip',
  'lowerLip',
  'earSize',
  'earsOut',
  'build',
  'skinTone',
  'hairLength',
  'sideburns',
] as const;
export const FULL_UNIT = ['recede', 'grey', 'beardGrey', 'freckles'] as const;
export type FullNumberKey = (typeof FULL_PROPORTIONS)[number] | (typeof FULL_UNIT)[number] | 'beardDensity';
export const FULL_FLAGS = ['cleft', 'mole', 'browRing', 'ageAuto', 'greyManual', 'recedeManual', 'beardGreyManual'] as const;
export type FullPortraitSettings = { v: 2; enabled: boolean; base: string; browSlit: number; seed: number } & Record<
  FullChoiceKey,
  string
> &
  Record<FullNumberKey, number> &
  Record<(typeof FULL_FLAGS)[number], boolean>;
export const fullHead = (id: string) => FULL_HEADS.find(h => h.id === id);
export const fullHair = (id: string) => FULL_HAIR.find(h => h.id === id)!;
export const fullBeard = (id: string) => FULL_BEARDS.find(h => h.id === id)!;
export function fullDefaults(base = 'full-01'): FullPortraitSettings {
  const p: any = { v: 2, enabled: true, base, browSlit: 0, seed: 1, beardDensity: 0.8 };
  for (const [k, options] of Object.entries(FULL_OPTIONS)) p[k] = options[0][0];
  for (const k of [...FULL_PROPORTIONS, ...FULL_UNIT]) p[k] = 0;
  for (const k of FULL_FLAGS) p[k] = k === 'ageAuto';
  p.hair = 'sidepart';
  p.outfit = 'jersey';
  return p;
}
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export function readFullPortrait(value: any): FullPortraitSettings | null {
  if (!value || value.v !== 2 || !fullHead(value.base)) return null;
  const p = fullDefaults(value.base);
  p.enabled = value.enabled === true;
  for (const [k, options] of Object.entries(FULL_OPTIONS)) if (options.some(([id]) => id === value[k])) p[k] = value[k];
  for (const k of FULL_PROPORTIONS) if (Number.isFinite(value[k])) p[k] = clamp(value[k], -1, 1);
  for (const k of FULL_UNIT) if (Number.isFinite(value[k])) p[k] = clamp(value[k], 0, 1);
  if (Number.isFinite(value.beardDensity)) p.beardDensity = clamp(value.beardDensity, 0.15, 1);
  p.browSlit = Number.isInteger(value.browSlit) ? clamp(value.browSlit, 0, 2) : 0;
  p.seed = Number.isInteger(value.seed) ? value.seed | 0 : 1;
  for (const k of FULL_FLAGS) if (typeof value[k] === 'boolean') p[k] = value[k];
  return p;
}
export function chooseFullHead(f: any, seed: number, exclude?: string): string {
  const rnd = mulberry32(seed ^ 0x732e596a),
    gender = f.fem ? 'woman' : 'man',
    look: Record<string, number> = f.appearanceMix || { [f.race || 'white']: 1 };
  const pool = FULL_HEADS.filter(h => h.gender === gender);
  const d = (h: (typeof FULL_HEADS)[number]) =>
    ['asian', 'black', 'dark', 'brown', 'white'].reduce((n, k) => n + ((look[k] || 0) - (h.looks[k] || 0)) ** 2, 0);
  const min = Math.min(...pool.map(d));
  let near = pool.filter(h => d(h) <= min + 0.65);
  if (near.length > 1) near = near.filter(h => h.id !== exclude);
  let n = rnd() * near.reduce((a, h) => a + Math.exp(-2 * d(h)), 0);
  return near.find(h => (n -= Math.exp(-2 * d(h))) < 0)?.id || pool[0].id;
}
export function newFullPortrait(f: any, seed: number, context: 'player' | 'staff' = 'player', exclude?: string): FullPortraitSettings {
  const rnd = mulberry32(seed ^ 0x2c6a138f),
    p = fullDefaults(chooseFullHead(f, seed, exclude));
  p.seed = seed | 0;
  const texture = f.hair?.tex || (['black', 'dark'].includes(f.race) ? 'coily' : f.race === 'asian' ? 'straight' : 'wavy');
  const hairPool: Record<string, string[]> = {
    coily: [
      'buzz',
      'fade',
      'waves',
      'shortAfro',
      'afro',
      'twists',
      'locsShort',
      'locsLong',
      'cornrows',
      'crew',
      'braids',
      'curlyTop',
      'hightop',
    ],
    curly: ['buzz', 'crew', 'curlyTop', 'curlyMop', 'crop', 'fade', 'longCurls', 'manbun', 'wolf'],
    wavy: ['buzz', 'crew', 'crop', 'sidepart', 'messy', 'quiff', 'curtains', 'wolf', 'ponytail', 'long', 'shag'],
    straight: ['buzz', 'crew', 'crop', 'sidepart', 'curtains', 'kpop', 'wolf', 'fringe', 'pixie', 'slick', 'shaved'],
  };
  const candidates = hairPool[texture] || hairPool.straight;
  p.hair = candidates[Math.floor(rnd() * candidates.length)];
  if (!f.fem && rnd() > (f.race === 'asian' ? 0.88 : 0.48))
    p.facial = ['stubble', 'heavyStubble', 'mustache', 'goatee', 'shortBeard', 'fullBeard'][Math.floor(rnd() * 6)];
  if (FULL_HAIR.some(h => h.id === f.hair?.style)) p.hair = f.hair.style;
  if (FULL_BEARDS.some(h => h.id === f.facial?.style)) p.facial = f.facial.style;
  p.natural = FULL_HAIR_COLORS[f.hair?.natural] ? f.hair.natural : 'black';
  p.texture = texture;
  p.outfit = context === 'staff' ? (f.fem ? 'blouse' : 'polo') : 'jersey';
  for (const k of [
    'headWidth',
    'headLength',
    'cheek',
    'jaw',
    'chinWidth',
    'chinLength',
    'eyeSize',
    'spacing',
    'noseWidth',
    'noseLength',
    'mouthWidth',
    'earSize',
  ] as const)
    p[k] = Math.round((rnd() - 0.5) * 0.8 * 100) / 100 || 0;
  if (f.fem) p.facial = 'none';
  return p;
}
export function randomFullFeatures(current: FullPortraitSettings, seed: number): FullPortraitSettings {
  const p = { ...current, seed: seed | 0 },
    rnd = mulberry32(seed ^ 0x19b6ad43);
  for (const k of FULL_PROPORTIONS)
    if (!['skinTone', 'hairLength', 'sideburns'].includes(k)) p[k] = Math.round((rnd() - 0.5) * 1.25 * 100) / 100 || 0;
  for (const k of ['hair', 'eyes', 'brows', 'expr'] as const) {
    const options = FULL_OPTIONS[k];
    p[k] = options[Math.floor(rnd() * options.length)][0];
  }
  // This button changes features, not the person's authored background or skin.
  return p;
}

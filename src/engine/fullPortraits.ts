// Version 2 is a separate painted-parts catalogue. Version 1 paintings keep their
// original decoder and controls; no saved person's face is upgraded implicitly.
import { mulberry32 } from './rng';

export const FULL_SIZE = 320;
export const FULL_SHEETS = {
  heads: { url: new URL('../assets/illustrated/full/heads.webp', import.meta.url).href, cols: 4, rows: 4 },
  heads2: { url: new URL('../assets/illustrated/full/heads2.webp', import.meta.url).href, cols: 4, rows: 4 },
  heads3: { url: new URL('../assets/illustrated/full/heads3.webp', import.meta.url).href, cols: 4, rows: 4 },
  heads4: { url: new URL('../assets/illustrated/full/heads4.webp', import.meta.url).href, cols: 4, rows: 4 },
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
// Keep the original IDs, artwork and authored registrations intact. A head's
// global index is its identity; its sheet/cell identify the lazily loaded artwork.
const originalAnchors = [
  [201, 248],
  [198, 249],
  [198, 249],
  [198, 247],
  [200, 248],
  [198, 249],
  [197, 246],
  [198, 250],
  [202, 250],
  [200, 248],
  [200, 250],
  [199, 248],
  [205, 251],
  [204, 253],
  [205, 251],
  [204, 252],
];
const originalNeckRadii = [43, 47, 44, 45, 44, 46, 45, 48, 45, 42, 46, 44, 40, 43, 40, 42];
const originalFaceRadii = [65, 69, 66, 68, 66, 69, 68, 70, 67, 64, 68, 66, 63, 66, 63, 65];
export interface FullHead {
  id: string;
  label: string;
  index: number;
  sheet: FullSheet;
  cell: number;
  gender: 'man' | 'woman';
  looks: Record<string, number | undefined>;
  lip: number;
  chin: number;
  neckRadius: number;
  faceRadius: number;
}
const additionalLooks: Record<string, number>[][] = [
  [
    { black: 1 },
    { dark: 1 },
    { black: 0.5, dark: 0.5 },
    { white: 1 },
    { white: 1 },
    { asian: 1 },
    { asian: 1 },
    { brown: 1 },
    { brown: 1 },
    { brown: 1 },
    { black: 0.5, asian: 0.5 },
    { brown: 1 },
    { asian: 1 },
    { black: 1 },
    { dark: 1 },
    { white: 1 },
  ],
  [
    { black: 1 },
    { dark: 1 },
    { black: 0.5, dark: 0.5 },
    { white: 1 },
    { white: 1 },
    { asian: 1 },
    { asian: 1 },
    { brown: 1 },
    { brown: 1 },
    { brown: 1 },
    { black: 0.5, white: 0.5 },
    { asian: 0.5, white: 0.5 },
    { white: 1 },
    { brown: 1 },
    { asian: 1 },
    { black: 0.5, asian: 0.5 },
  ],
  [
    { black: 1 },
    { dark: 1 },
    { black: 0.5, dark: 0.5 },
    { white: 1 },
    { white: 1 },
    { asian: 1 },
    { asian: 1 },
    { brown: 1 },
    { brown: 1 },
    { brown: 1 },
    { black: 0.5, brown: 0.5 },
    { asian: 0.5, brown: 0.5 },
    { black: 1 },
    { dark: 1 },
    { brown: 1 },
    { asian: 0.5, white: 0.5 },
  ],
];
export const FULL_HEADS: FullHead[] = [
  ...headLooks.map((looks, index): FullHead => ({
    id: 'full-' + String(index + 1).padStart(2, '0'),
    label: 'Head ' + String(index + 1).padStart(2, '0'),
    index,
    sheet: 'heads',
    cell: index,
    gender: index < 12 ? 'man' : 'woman',
    looks,
    lip: originalAnchors[index][0],
    chin: originalAnchors[index][1],
    neckRadius: originalNeckRadii[index],
    faceRadius: originalFaceRadii[index],
  })),
  ...additionalLooks.flatMap((bank, b) =>
    bank.map((looks, cell): FullHead => {
      const index = 16 + b * 16 + cell;
      return {
        id: 'full-' + String(index + 1).padStart(2, '0'),
        label: 'Head ' + String(index + 1).padStart(2, '0'),
        index,
        sheet: (['heads2', 'heads3', 'heads4'] as const)[b],
        cell,
        gender: cell < 12 ? 'man' : 'woman',
        looks,
        lip: cell < 12 ? 200 : 204,
        chin: cell < 12 ? 250 : 252,
        neckRadius: cell < 12 ? 45 : 42,
        faceRadius: cell < 12 ? 68 : 65,
      };
    }),
  ),
];
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
    ['huggie1', 'One huggie'],
    ['huggie2', 'Huggies'],
    ['bar1', 'One bar'],
    ['bar2', 'Bars'],
    ['drop1', 'One drop'],
    ['drop2', 'Drops'],
    ['stack1', 'One stacked set'],
    ['stack2', 'Stacked sets'],
    ['cuff1', 'One ear cuff'],
    ['cuff2', 'Ear cuffs'],
  ],
  earSide: [
    ['left', 'Left'],
    ['right', 'Right'],
  ],
  cartilage: [
    ['none', 'None'],
    ['stud', 'Cartilage stud'],
    ['hoop', 'Cartilage hoop'],
    ['industrial', 'Industrial bar'],
    ['double', 'Double studs'],
  ],
  metal: [
    ['diamond', 'Diamond'],
    ['gold', 'Gold'],
    ['silver', 'Silver'],
    ['black', 'Black'],
    ['roseGold', 'Rose gold'],
  ],
  noseRing: [
    ['none', 'None'],
    ['stud', 'Stud'],
    ['ring', 'Ring'],
    ['septum', 'Septum ring'],
    ['doubleStud', 'Double studs'],
    ['doubleRing', 'Double rings'],
    ['horseshoe', 'Septum horseshoe'],
  ],
  noseSide: [
    ['right', 'Right'],
    ['left', 'Left'],
  ],
  lipRing: [
    ['none', 'None'],
    ['ring', 'Ring'],
    ['labret', 'Stud'],
    ['snakeBites', 'Snake bites'],
    ['vertical', 'Vertical labret'],
    ['medusa', 'Medusa stud'],
  ],
  lipSide: [
    ['right', 'Right'],
    ['left', 'Left'],
  ],
  browPiercing: [
    ['none', 'None'],
    ['barbell', 'Barbell'],
    ['hoop', 'Hoop'],
    ['double', 'Double barbell'],
  ],
  browSide: [
    ['right', 'Right'],
    ['left', 'Left'],
  ],
  necklace: [
    ['none', 'None'],
    ['chain', 'Fine chain'],
    ['rope', 'Rope chain'],
    ['beads', 'Beaded necklace'],
    ['double', 'Double chain'],
    ['pendant', 'Round pendant'],
    ['tags', 'Dog tags'],
    ['cross', 'Cross pendant'],
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
    ['rose', 'Rose'],
    ['wings', 'Wings'],
    ['geometric', 'Geometric'],
    ['numerals', 'Roman numerals'],
    ['crown', 'Crown'],
    ['flower', 'Flower'],
    ['wave', 'Wave'],
    ['music', 'Music notes'],
    ['cross', 'Cross'],
    ['bolt', 'Lightning'],
    ['swallow', 'Swallow'],
    ['bands', 'Bands'],
  ],
  tattooPlace: [
    ['right', 'Right side'],
    ['left', 'Left side'],
    ['front', 'Front'],
    ['wrap', 'Both sides'],
  ],
  faceTattoo: [
    ['none', 'None'],
    ['star', 'Star'],
    ['cross', 'Cross'],
    ['bolt', 'Lightning'],
    ['heart', 'Heart'],
    ['diamond', 'Diamond'],
    ['dots', 'Three dots'],
    ['tear', 'Teardrop'],
    ['numerals', 'Roman numerals'],
    ['script', 'Small script'],
    ['rose', 'Small rose'],
    ['spark', 'Spark'],
    ['crescent', 'Crescent'],
  ],
  faceTattooPlace: [
    ['leftCheek', 'Left cheek'],
    ['rightCheek', 'Right cheek'],
    ['leftEye', 'Below left eye'],
    ['rightEye', 'Below right eye'],
    ['leftTemple', 'Left temple'],
    ['rightTemple', 'Right temple'],
    ['forehead', 'Forehead'],
  ],
  tattooInk: [
    ['black', 'Black'],
    ['blue', 'Blue-black'],
    ['red', 'Muted red'],
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
export const FULL_UNIT = ['recede', 'grey', 'beardGrey', 'freckles', 'faceTattooSize', 'neckTattooSize', 'tattooOpacity'] as const;
export type FullNumberKey = (typeof FULL_PROPORTIONS)[number] | (typeof FULL_UNIT)[number] | 'beardDensity';
export const FULL_FLAGS = ['cleft', 'mole', 'browRing', 'ageAuto', 'greyManual', 'recedeManual', 'beardGreyManual'] as const;
export type FullPortraitSettings = {
  v: 2;
  enabled: boolean;
  base: string;
  browSlit: number;
  seed: number;
  faceTattooText: string;
  neckTattooText: string;
} & Record<FullChoiceKey, string> &
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
  p.faceTattooSize = p.neckTattooSize = 0.5;
  p.tattooOpacity = 0.65;
  p.faceTattooText = 'VII';
  p.neckTattooText = 'RISE';
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
  for (const key of ['faceTattooText', 'neckTattooText'] as const)
    if (typeof value[key] === 'string')
      p[key] = value[key].replace(/[\u0000-\u001f\u007f]/g, '').slice(0, key === 'faceTattooText' ? 12 : 20);
  return p;
}
export function chooseFullHead(f: any, seed: number, exclude?: string): string {
  const rnd = mulberry32(seed ^ 0x732e596a),
    gender = f.fem ? 'woman' : 'man',
    look = appearanceWeights(f);
  const pool = FULL_HEADS.filter(h => h.gender === gender);
  const d = (h: (typeof FULL_HEADS)[number]) =>
    ['asian', 'black', 'dark', 'brown', 'white'].reduce((n, k) => n + ((look[k] || 0) - (h.looks[k] || 0)) ** 2, 0);
  const min = Math.min(...pool.map(d));
  let near = pool.filter(h => d(h) <= min + 0.65);
  if (near.length > 1) near = near.filter(h => h.id !== exclude);
  let n = rnd() * near.reduce((a, h) => a + Math.exp(-2 * d(h)), 0);
  return near.find(h => (n -= Math.exp(-2 * d(h))) < 0)?.id || pool[0].id;
}
// These are authored game defaults, not restrictions on what a real person can wear.
// Manual editor choices and already-saved portraits are deliberately unrestricted.
const TEXTURE_WEIGHTS: Record<string, Record<string, number>> = {
  black: { coily: 74, curly: 20, wavy: 6 },
  dark: { coily: 74, curly: 20, wavy: 6 },
  asian: { straight: 76, wavy: 18, curly: 6 },
  white: { straight: 48, wavy: 36, curly: 16 },
  brown: { straight: 28, wavy: 38, curly: 28, coily: 6 },
};
const HAIR_BY_TEXTURE: Record<string, string[]> = {
  coily: [
    'buzz',
    'fade',
    'waves',
    'shortAfro',
    'afro',
    'twists',
    'locsShort',
    'locsLong',
    'locsUp',
    'cornrows',
    'crew',
    'braids',
    'curlyTop',
    'hightop',
    'flattop',
    'caesar',
    'frohawk',
    'mohawk',
    'manbun',
    'ponytail',
    'longPonytail',
  ],
  curly: [
    'buzz',
    'crew',
    'curlyTop',
    'curlyMop',
    'crop',
    'fade',
    'longCurls',
    'manbun',
    'wolf',
    'messy',
    'shag',
    'mullet',
    'undercut',
    'long',
    'ponytail',
    'longPonytail',
  ],
  wavy: [
    'buzz',
    'crew',
    'crop',
    'sidepart',
    'messy',
    'quiff',
    'curtains',
    'wolf',
    'ponytail',
    'long',
    'shag',
    'slick',
    'fringe',
    'undercut',
    'mullet',
    'manbun',
    'longPonytail',
  ],
  straight: [
    'buzz',
    'crew',
    'crop',
    'sidepart',
    'curtains',
    'kpop',
    'wolf',
    'fringe',
    'pixie',
    'slick',
    'messy',
    'spiky',
    'quiff',
    'undercut',
    'long',
    'manbun',
    'ponytail',
    'longPonytail',
    'mullet',
    'shag',
    'caesar',
    'mohawk',
  ],
};
const FEMALE_HAIR: Record<string, string[]> = {
  coily: ['afro', 'shortAfro', 'braids', 'locsLong', 'locsUp', 'twists', 'cornrows', 'bun', 'longCurls', 'buzz', 'pixie'],
  curly: ['longCurls', 'curlyMop', 'bun', 'bob', 'long', 'shag', 'pixie', 'wolf', 'ponytail', 'longPonytail', 'buzz'],
  wavy: ['long', 'longPart', 'bob', 'bun', 'shag', 'pixie', 'slick', 'longCurls', 'sidepart', 'wolf', 'ponytail', 'longPonytail', 'buzz'],
  straight: ['long', 'longPart', 'bob', 'bun', 'shag', 'pixie', 'fringe', 'slick', 'wolf', 'kpop', 'ponytail', 'longPonytail', 'buzz'],
};
function weightedChoice(rnd: () => number, weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => Number.isFinite(w) && w > 0);
  let n = rnd() * entries.reduce((sum, [, w]) => sum + w, 0);
  return entries.find(([, w]) => (n -= w) < 0)?.[0] || entries[0][0];
}
function appearanceWeights(f: any): Record<string, number> {
  const mix = Object.fromEntries(
    Object.keys(TEXTURE_WEIGHTS)
      .map(k => [k, f.appearanceMix?.[k]])
      .filter(([, w]) => Number.isFinite(w) && w > 0),
  ) as Record<string, number>;
  const total = Object.values(mix).reduce((sum, weight) => sum + weight, 0);
  return total > 0
    ? Object.fromEntries(Object.entries(mix).map(([key, weight]) => [key, weight / total]))
    : { [TEXTURE_WEIGHTS[f.race] ? f.race : 'white']: 1 };
}
function portraitHair(f: any, rnd: () => number, preferredTexture?: string) {
  const look = weightedChoice(rnd, appearanceWeights(f)),
    weights = TEXTURE_WEIGHTS[look],
    texture = preferredTexture && weights[preferredTexture] ? preferredTexture : weightedChoice(rnd, weights),
    age = f.age?.years ?? f.age ?? 25;
  let candidates = [...(f.fem ? FEMALE_HAIR[texture] : HAIR_BY_TEXTURE[texture]), 'bald', 'shaved'];
  // Select the actual textured drawings, not a straight-hair drawing with a
  // coily texture setting applied to its colour. Several long/parted drawings
  // were visually unsuitable even though their IDs did not say "middle part".
  if (look === 'black' || look === 'dark')
    candidates = [
      ...(f.fem
        ? ['afro', 'shortAfro', 'twists', 'braids', 'cornrows', 'locsLong', 'locsUp', 'curlyMop', 'buzz']
        : [
            'buzz',
            'crew',
            'fade',
            'caesar',
            'waves',
            'shortAfro',
            'afro',
            'twists',
            'frohawk',
            'locsShort',
            'locsLong',
            'locsUp',
            'cornrows',
            'braids',
            'curlyTop',
            'curlyMop',
            'hightop',
            'flattop',
          ]),
      'bald',
      'shaved',
    ];
  if (!f.fem && age >= 32) candidates.push('baldingBuzz', 'balding');
  // A wavy/curly texture must not accidentally put a middle part on the darker-skin
  // game presets. East Asian presets never draw locs/coily styles automatically.
  if (look === 'black' || look === 'dark') candidates = candidates.filter(id => !['curtains', 'longPart', 'kpop'].includes(id));
  if (look === 'asian')
    candidates = candidates.filter(
      id => !['locsShort', 'locsLong', 'locsUp', 'cornrows', 'braids', 'afro', 'shortAfro', 'twists'].includes(id),
    );
  return { texture, candidates, look };
}
function choosePortraitHair(hair: ReturnType<typeof portraitHair>, rnd: () => number, f: any): string {
  return weightedChoice(
    rnd,
    Object.fromEntries(
      hair.candidates.map(id => [
        id,
        id === 'bald' ? (f.fem ? 0.1 : 3) : id === 'shaved' ? (f.fem ? 0.3 : 5) : id === 'balding' ? 1 : id === 'baldingBuzz' ? 2 : 10,
      ]),
    ),
  );
}
function portraitFacial(f: any, look: string, rnd: () => number): string {
  const age = f.age?.years ?? f.age ?? 25;
  if (f.fem) return 'none';
  if (age < 20) return weightedChoice(rnd, { none: 60, stubble: 19, patchy: 14, mustache: 4, soulpatch: 1, chinpuff: 2 });
  // Sparse/clean-shaven defaults are common here; substantial beards remain a rare
  // automatic exception and every beard stays selectable by hand.
  if (look === 'asian')
    return weightedChoice(rnd, {
      none: 78,
      stubble: 10,
      patchy: 6,
      mustache: 3,
      soulpatch: 1,
      chinpuff: 1,
      goatee: 0.5,
      heavyStubble: 0.3,
      shortBeard: 0.18,
      fullBeard: 0.02,
    });
  return weightedChoice(rnd, {
    none: 30,
    stubble: 18,
    patchy: 7,
    heavyStubble: 8,
    mustache: 5,
    soulpatch: 3,
    chinpuff: 3,
    goatee: 6,
    circle: 5,
    vandyke: 2,
    chinstrap: 3,
    chinstrapMustache: 2,
    shortBeard: age < 23 ? 5 : 10,
    fullBeard: age < 23 ? 1 : 6,
    thickBeard: age < 23 ? 0.2 : 2,
    pencil: 1,
    longGoatee: 1,
  });
}
export function newFullPortrait(f: any, seed: number, context: 'player' | 'staff' = 'player', exclude?: string): FullPortraitSettings {
  const rnd = mulberry32(seed ^ 0x2c6a138f),
    p = fullDefaults(chooseFullHead(f, seed, exclude)),
    hair = portraitHair(f, rnd, f.hair?.tex);
  p.seed = seed | 0;
  p.hair = choosePortraitHair(hair, rnd, f);
  // Only inherit a source style when it also passes the automatic appearance pool.
  if (hair.candidates.includes(f.hair?.style)) p.hair = f.hair.style;
  p.facial = portraitFacial(f, hair.look, rnd);
  p.natural = FULL_HAIR_COLORS[f.hair?.natural] ? f.hair.natural : 'black';
  p.texture = hair.texture;
  p.outfit = context === 'staff' ? (f.fem ? 'blouse' : 'polo') : 'jersey';
  const pick = (key: FullChoiceKey) => {
    const options = FULL_OPTIONS[key].filter(([id]) => id !== 'none');
    return options[Math.floor(rnd() * options.length)][0];
  };
  p.metal = pick('metal');
  if (f.acc?.earrings) {
    p.earrings = (f.acc.earrings.kind === 'hoop' ? 'hoop' : 'stud') + (f.acc.earrings.both ? '2' : '1');
    if (FULL_OPTIONS.metal.some(([id]) => id === f.acc.earrings.metal)) p.metal = f.acc.earrings.metal;
  } else if (rnd() < (f.fem ? 0.55 : 0.18)) p.earrings = pick('earrings');
  p.earSide = rnd() < 0.5 ? 'left' : 'right';
  p.noseSide = rnd() < 0.5 ? 'left' : 'right';
  p.lipSide = rnd() < 0.5 ? 'left' : 'right';
  if (rnd() < 0.045) p.cartilage = pick('cartilage');
  if (f.acc?.nose?.kind && FULL_OPTIONS.noseRing.some(([id]) => id === f.acc.nose.kind)) p.noseRing = f.acc.nose.kind;
  else if (rnd() < 0.035) p.noseRing = pick('noseRing');
  if (f.acc?.lip?.kind && FULL_OPTIONS.lipRing.some(([id]) => id === f.acc.lip.kind)) p.lipRing = f.acc.lip.kind;
  else if (rnd() < 0.012) p.lipRing = pick('lipRing');
  if (f.acc?.brow || rnd() < 0.012) p.browPiercing = pick('browPiercing');
  if (rnd() < (context === 'staff' ? 0.06 : 0.12)) p.necklace = pick('necklace');
  if (f.marks?.tattoo?.kind && FULL_OPTIONS.tattoo.some(([id]) => id === f.marks.tattoo.kind)) p.tattoo = f.marks.tattoo.kind;
  else if (rnd() < (context === 'staff' ? 0.025 : 0.09)) p.tattoo = pick('tattoo');
  if (rnd() < (context === 'staff' ? 0.003 : 0.015)) p.faceTattoo = pick('faceTattoo');
  p.faceTattooPlace = ['leftCheek', 'rightCheek', 'leftEye', 'rightEye', 'leftTemple', 'rightTemple'][Math.floor(rnd() * 6)];
  p.tattooPlace = ['left', 'right', 'front', 'wrap'][Math.floor(rnd() * 4)];
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
  // Automatic portraits used to leave every person with the same eye, brow and
  // expression presets and unvaried lips/bridge/tip. Honour the person's seeded
  // face description where available, with local-RNG fallbacks for raw rerolls.
  const choice = (key: 'eyes' | 'brows' | 'expr', source: unknown, weights: Record<string, number>) =>
    FULL_OPTIONS[key].some(([id]) => id === source) ? String(source) : weightedChoice(rnd, weights);
  p.eyes = choice(
    'eyes',
    f.eyes?.shape,
    hair.look === 'asian'
      ? { almond: 26, round: 10, hooded: 14, monolid: 32, deepset: 4, downturned: 6, upturned: 8 }
      : { almond: 30, round: 16, hooded: 16, monolid: 3, deepset: 13, downturned: 10, upturned: 12 },
  );
  p.brows = choice('brows', f.brows?.shape, { straight: 24, soft: 26, arched: 14, angled: 12, flat: 12, bushy: 12 });
  p.expr = choice('expr', f.expr, { serious: 32, slight: 25, relaxed: 24, smile: 8, mean: 4, smirk: 7 });
  const detail = (source: unknown) =>
    Math.round((Number.isFinite(source) ? (clamp(Number(source), 0, 1) - 0.5) * 0.8 : (rnd() - 0.5) * 0.7) * 100) / 100 || 0;
  p.noseBridge = detail(f.nose?.bridge);
  p.noseTip = detail(f.nose?.tip);
  p.upperLip = detail(f.mouth?.upper);
  p.lowerLip = detail(f.mouth?.lower);
  p.earsOut = detail(f.ears?.out);
  p.browWeight = Math.round((rnd() - 0.5) * 0.6 * 100) / 100 || 0;
  p.tilt = Math.round((rnd() - 0.5) * 0.5 * 100) / 100 || 0;
  p.skinTone = Math.round((rnd() - 0.5) * 0.16 * 100) / 100 || 0;
  p.hairLength = Math.round((rnd() - 0.5) * 0.6 * 100) / 100 || 0;
  p.cleft = typeof f.head?.cleft === 'boolean' ? f.head.cleft : rnd() < 0.07;
  return p;
}
export function randomFullFeatures(current: FullPortraitSettings, seed: number, face?: any): FullPortraitSettings {
  const p = { ...current, seed: seed | 0 },
    rnd = mulberry32(seed ^ 0x19b6ad43),
    head = fullHead(current.base)!,
    source = face || { appearanceMix: head.looks, fem: head.gender === 'woman' },
    hair = portraitHair(source, rnd, current.texture);
  p.hair = choosePortraitHair(hair, rnd, source);
  p.texture = hair.texture;
  for (const k of FULL_PROPORTIONS)
    if (!['skinTone', 'hairLength', 'sideburns'].includes(k)) p[k] = Math.round((rnd() - 0.5) * 1.25 * 100) / 100 || 0;
  for (const k of ['eyes', 'brows', 'expr'] as const) {
    const options = FULL_OPTIONS[k];
    p[k] = options[Math.floor(rnd() * options.length)][0];
  }
  // This button changes features, not the person's authored background or skin.
  return p;
}

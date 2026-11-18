// Appearance sources are drawing presets, not nationality, eligibility or a genetics model.
// All feature distributions overlap; weights below are art tuning, not population estimates.
import { mulberry32 } from './rng';

export const FACE_LOOK_KEYS = ['white', 'black', 'dark', 'asian', 'brown'] as const;
export type FaceLook = (typeof FACE_LOOK_KEYS)[number];
export type FaceAncestry = Partial<Record<FaceLook, number>>;
const validLook = (value: any): value is FaceLook => FACE_LOOK_KEYS.includes(value);
export const faceLook = (value: any): FaceLook => (validLook(value) ? value : 'white');

export function normalizeFaceAncestry(value: any): FaceAncestry | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = FACE_LOOK_KEYS.flatMap(key => {
    const weight = Object.hasOwn(value, key) ? value[key] : undefined;
    return typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? [[key, weight] as const] : [];
  });
  // Scale first to avoid overflow on imported weights.
  const max = Math.max(0, ...entries.map(([, weight]) => weight));
  if (!max) return undefined;
  const sum = entries.reduce((n, [, weight]) => n + weight / max, 0);
  return Object.fromEntries(entries.map(([key, weight]) => [key, weight / max / sum]));
}

const ALIASES: Record<string, FaceLook> = {
  white: 'white',
  european: 'white',
  black: 'black',
  'african american': 'black',
  dark: 'dark',
  asian: 'asian',
  'east asian': 'asian',
  brown: 'brown',
};
const alias = (value: any) => {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return Object.hasOwn(ALIASES, key) ? ALIASES[key] : undefined;
};

export function faceAncestry(p: any): FaceAncestry {
  const primary = faceLook(p.race);
  const edited = normalizeFaceAncestry(p.faceX?.ancestry);
  if (edited) return edited;
  const stored = normalizeFaceAncestry(p.faceAncestry);
  if (stored) return stored;
  // Existing tribal mixed-background records predate a general appearance blend.
  if (p.her === 'XN' && p.mix) {
    if (p.mix === 'African American') return { brown: 0.5, black: 0.5 };
    if (p.mix === 'White') return { brown: 0.5, white: 0.5 };
  }
  // Read explicit mixed descriptions only. Do not infer ancestry from a name or passport.
  const secondary = alias(p.mix);
  if (secondary && secondary !== primary) return { [primary]: 0.5, [secondary]: 0.5 };
  for (const label of [p.mix, p.heritage]) {
    if (typeof label !== 'string') continue;
    const parts = label.split(/\s*(?:\/|&|\+)\s*/).map(alias);
    if (parts.length > 1 && parts.every(Boolean)) {
      const weights: FaceAncestry = {};
      parts.forEach(key => {
        weights[key!] = (weights[key!] || 0) + 1;
      });
      return normalizeFaceAncestry(weights)!;
    }
  }
  return { [primary]: 1 };
}

// New fictional players can have multiple appearance sources. Use an isolated stream:
// adding portrait variety must never change player ratings, names or simulation randomness.
export function generatedFaceAncestry(p: any, salt: number): FaceAncestry | undefined {
  const known = faceAncestry(p);
  if (Object.keys(known).length > 1) return undefined; // existing mixed metadata is read live
  const rnd = mulberry32((Math.imul(p.id | 0, 15485863) ^ salt ^ 0x46a9d3b1) | 0);
  if (rnd() >= 0.1) return undefined;
  const primary = faceLook(p.race);
  const other = FACE_LOOK_KEYS.filter(key => key !== primary && !(['black', 'dark'].includes(primary) && ['black', 'dark'].includes(key)));
  const secondary = other[Math.floor(rnd() * other.length)];
  const share = Math.round((0.25 + rnd() * 0.5) * 100) / 100;
  return { [primary]: 1 - share, [secondary]: share };
}

export function rerollFace(p: any, seed: number) {
  p.faceSeed = seed;
  p.faceX = p.faceX?.ancestry ? { ancestry: structuredClone(p.faceX.ancestry) } : undefined;
  delete p.faceImg;
}

export function ancestryValue(ancestry: FaceAncestry, values: Record<string, number>): number {
  return Object.entries(ancestry).reduce((n, [key, weight]) => n + weight! * (values[key] ?? values.black ?? 0), 0);
}

export function ancestryWeights(ancestry: FaceAncestry, tables: Record<string, Record<string, number>>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [look, share] of Object.entries(ancestry)) {
    const table = tables[look] || tables.black;
    const total = Object.values(table).reduce((n, value) => n + value, 0);
    for (const [key, weight] of Object.entries(table)) result[key] = (result[key] || 0) + (share! * weight) / total;
  }
  return result;
}

export function beardWeights(base: Record<string, number>, ancestry: FaceAncestry, seed: number) {
  const rnd = mulberry32(seed ^ 0x53bf19a7);
  const eastAsian = ancestry.asian || 0;
  // A person's stable growth tendency varies widely inside every background. Dense beards
  // remain possible for all looks; age is applied separately by the caller's style table.
  const growth = Math.max(0.1, Math.min(1, 0.7 - 0.42 * eastAsian + (rnd() + rnd() + rnd() - 1.5) * 0.36));
  const weights = { ...base };
  for (const key of ['shortBeard', 'fullBeard', 'thickBeard', 'heavyStubble', 'circle', 'chinstrap', 'chinstrapMustache']) {
    if (weights[key]) weights[key] *= (0.12 + 1.8 * growth * growth) * (1 - 0.82 * eastAsian);
  }
  for (const key of ['none', 'patchy', 'mustache', 'soulpatch', 'chinpuff']) {
    if (weights[key]) weights[key] *= 1 + (1 - growth) * 0.7;
  }
  return { weights, density: Math.max(0.4, Math.min(1, 0.36 + growth * 0.55 + rnd() * 0.15)) };
}

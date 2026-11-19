// Optional illustrated portraits. Art tags guide an initial choice; they are
// authored fictional drawing presets, not a demographic or genetics model.
import catalog from '../assets/illustrated/catalog.json';
import { mulberry32 } from './rng';
import { newFullPortrait, readFullPortrait, type FullPortraitSettings } from './fullPortraits';

export type PortraitContext = 'player' | 'staff';
export type IllustratedChoice = {
  id: string;
  label: string;
  sheet: string;
  role: PortraitContext;
  gender: string;
  looks: Record<string, number | undefined>;
  age: string;
  width: number;
  height: number;
  crop: number[];
  editable: boolean;
  url: string;
};
const urls: Record<string, string> = {
  editable: new URL('../assets/illustrated/editable.webp', import.meta.url).href,
  players: new URL('../assets/illustrated/players.webp', import.meta.url).href,
  staffMen: new URL('../assets/illustrated/staffMen.webp', import.meta.url).href,
  staffWomen: new URL('../assets/illustrated/staffWomen.webp', import.meta.url).href,
};
export const ILLUSTRATED_CHOICES = (catalog as Omit<IllustratedChoice, 'url'>[]).map(p => ({ ...p, url: urls[p.sheet] }));
const byId = new Map(ILLUSTRATED_CHOICES.map(p => [p.id, p]));
export const ILLUSTRATED_HAIR = ['Swept', 'Textured crop', 'Buzz cut', 'Wolf cut', 'Crew cut', 'Middle part', 'K-pop two-block'];
export type IllustrationSettings = {
  v: 1;
  enabled: boolean;
  base: string;
  hair: number;
  eyes: number;
  nose: number;
  brows: number;
  beard: number;
  smile: number;
  jaw: number;
  spacing: number;
  mouth: number;
};
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
export const illustratedChoice = (id: string) => byId.get(id);
export const illustrationDefaults = (base = 'editable-01'): IllustrationSettings => ({
  v: 1,
  enabled: true,
  base,
  hair: 0,
  eyes: 0,
  nose: 0,
  brows: 0,
  beard: 0,
  smile: 0,
  jaw: 0,
  spacing: 0,
  mouth: 0,
});
export type AnyIllustration = IllustrationSettings | FullPortraitSettings;
export function readIllustration(value: any): AnyIllustration | null {
  if (value?.v === 2) return readFullPortrait(value);
  if (!value || value.v !== 1 || typeof value.base !== 'string' || !byId.has(value.base)) return null;
  const p = illustrationDefaults(value.base);
  p.enabled = value.enabled === true;
  if (!byId.get(p.base)!.editable) return p;
  p.hair = Number.isInteger(value.hair) && value.hair >= 0 && value.hair < ILLUSTRATED_HAIR.length ? value.hair : 0;
  for (const k of ['eyes', 'nose', 'brows', 'beard', 'smile'] as const) p[k] = value[k] === 1 ? 1 : 0;
  for (const k of ['jaw', 'spacing', 'mouth'] as const)
    if (typeof value[k] === 'number' && Number.isFinite(value[k])) p[k] = clamp(value[k]);
  return p;
}
const distance = (a: Record<string, number | undefined>, b: Record<string, number | undefined>) =>
  ['black', 'dark', 'asian', 'brown', 'white'].reduce((n, k) => n + ((a[k] || 0) - (b[k] || 0)) ** 2, 0);
export function chooseIllustration(f: any, context: PortraitContext = 'player', exclude?: string): string {
  const gender = f.fem ? 'woman' : 'man',
    age = f.age?.years ?? f.age ?? 25;
  const eligible = ILLUSTRATED_CHOICES.filter(p => p.gender === gender && p.id !== exclude);
  const role = eligible.filter(p => p.role === context),
    pool = role.length ? role : eligible;
  const a = { [f.race || 'white']: 1 },
    min = Math.min(...pool.map(p => distance(a, p.looks)));
  const near = pool.filter(p => distance(a, p.looks) <= min + 0.7);
  const band = age < 35 ? 'young' : age < 55 ? 'middle' : 'older';
  const rnd = mulberry32((f.seed ?? f.faceSeed ?? f.id ?? 1) ^ 0x47a198cf);
  let n = rnd() * near.reduce((sum, p) => sum + Math.exp(-distance(a, p.looks) * 2) * (p.age === band ? 1.8 : 1), 0);
  return near.find(p => (n -= Math.exp(-distance(a, p.looks) * 2) * (p.age === band ? 1.8 : 1)) < 0)?.id || near[0]?.id || 'editable-01';
}
export function setIllustration(person: any, config: AnyIllustration) {
  const value = readIllustration(config);
  if (!value) return false;
  person.faceX = { ...(person.faceX || {}), illustration: value };
  if (value.enabled) delete person.faceImg;
  return true;
}
export function randomIllustratedFeatures(config: IllustrationSettings, seed: number): IllustrationSettings {
  const p = illustrationDefaults(config.base),
    rnd = mulberry32(seed | 0);
  if (!byId.get(p.base)?.editable) return p;
  p.hair = Math.floor(rnd() * ILLUSTRATED_HAIR.length);
  for (const k of ['eyes', 'nose', 'brows', 'beard', 'smile'] as const) p[k] = rnd() < 0.5 ? 0 : 1;
  for (const k of ['jaw', 'spacing', 'mouth'] as const) p[k] = Math.round((rnd() * 1.4 - 0.7) * 100) / 100;
  return p;
}
export function rerollPersonFace(person: any, seed: number, context: PortraitContext = 'player') {
  const current = readIllustration(person.faceX?.illustration);
  person.faceSeed = seed;
  delete person.faceImg;
  if (current?.enabled && current.v === 2) setIllustration(person, newFullPortrait(person, seed, context, current.base));
  else if (current?.enabled) setIllustration(person, illustrationDefaults(chooseIllustration({ ...person, seed }, context, current.base)));
  else delete person.faceX;
}

export const PORTRAIT_SIZE = 320;
const hairSources = [0, 3, 6, 7, 8, 9, 10];
const frameFor = { brows: 5, beard: 4, eyes: 1, nose: 2 };
type Part = 'hair' | 'eyes' | 'nose' | 'brows' | 'beard';
export function createIllustrationPainter(frames: Uint8ClampedArray[]) {
  const W = PORTRAIT_SIZE,
    H = W,
    N = W * H;
  if (frames.length !== 11 || frames.some(f => f.length !== N * 4)) throw Error('Invalid illustrated portrait source');
  const smooth = (a: number, b: number, v: number) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const oval = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, core = 0.65) =>
    1 - smooth(core, 1, Math.hypot((x - cx) / rx, (y - cy) / ry));
  const masks = Object.fromEntries(['hair', 'eyes', 'nose', 'brows', 'beard', 'wolfBeard'].map(k => [k, new Float32Array(N)])) as Record<
    string,
    Float32Array
  >;
  const hairMasks = ILLUSTRATED_HAIR.map(() => new Float32Array(N));
  const fields = Object.fromEntries(['jaw', 'spacing', 'mouth', 'smile'].map(k => [k, new Float32Array(N)])) as Record<
    string,
    Float32Array
  >;
  for (let py = 0, i = 0; py < H; py++)
    for (let px = 0; px < W; px++, i++) {
      const x = px / W,
        y = py / H,
        el = oval(x, y, 0.405, 0.373, 0.08, 0.04),
        er = oval(x, y, 0.595, 0.373, 0.08, 0.04);
      masks.eyes[i] = Math.max(el, er);
      masks.brows[i] = Math.max(oval(x, y, 0.405, 0.31, 0.105, 0.034), oval(x, y, 0.595, 0.31, 0.105, 0.034)) * (1 - masks.eyes[i]);
      masks.nose[i] = oval(x, y, 0.507, 0.478, 0.088, 0.086, 0.57) * (1 - masks.eyes[i]);
      const end = 0.305 + 0.14 * Math.min(1.3, Math.abs((x - 0.5) / 0.25) ** 1.5);
      masks.hair[i] =
        smooth(0.17, 0.23, x) *
        (1 - smooth(0.77, 0.83, x)) *
        (1 - smooth(end - 0.015, end + 0.028, y)) *
        (1 - masks.eyes[i]) *
        (1 - masks.brows[i]);
      hairMasks.forEach(m => (m[i] = masks.hair[i]));
      const top = smooth(0.1, 0.16, x) * (1 - smooth(0.84, 0.9, x)) * (1 - smooth(end + 0.005, end + 0.05, y));
      hairMasks[3][i] =
        Math.max(top, oval(x, y, 0.285, 0.49, 0.112, 0.225, 0.72), oval(x, y, 0.73, 0.49, 0.112, 0.225, 0.72)) *
        (1 - masks.eyes[i]) *
        (1 - masks.brows[i]);
      masks.beard[i] =
        Math.max(oval(x, y, 0.507, 0.654, 0.235, 0.145, 0.74), oval(x, y, 0.507, 0.556, 0.125, 0.039, 0.65)) * smooth(0.521, 0.548, y);
      const half = y < 0.58 ? 0.18 : y < 0.68 ? 0.18 - (y - 0.58) * 0.7 : Math.max(0.025, 0.11 - (y - 0.68));
      masks.wolfBeard[i] = masks.beard[i] * (1 - smooth(half + 0.006, half + 0.025, Math.abs(x - 0.507)));
      fields.jaw[i] = -0.13 * (px - W * 0.507) * oval(x, y, 0.507, 0.687, 0.29, 0.12, 0.55);
      fields.spacing[i] = W * 0.014 * (el - er);
      fields.mouth[i] = -0.15 * (px - W * 0.507) * oval(x, y, 0.507, 0.577, 0.125, 0.046, 0.6);
      fields.smile[i] = H * 0.01 * (oval(x, y, 0.444, 0.582, 0.059, 0.052, 0.45) + oval(x, y, 0.57, 0.582, 0.059, 0.052, 0.45));
    }
  const maskFor = (part: Part, p: IllustrationSettings) =>
    part === 'hair' ? hairMasks[p.hair] : part === 'beard' && p.hair === 3 ? masks.wolfBeard : masks[part];
  function render(config: IllustrationSettings) {
    const p = readIllustration(config);
    if (!p || p.v !== 1 || !byId.get(p.base)?.editable) throw Error('This portrait does not have editable feature sources');
    const combined = new Uint8ClampedArray(frames[0]);
    for (const part of ['hair', 'brows', 'beard', 'eyes', 'nose'] as Part[])
      if (p[part]) {
        const mask = maskFor(part, p),
          src = frames[part === 'hair' ? hairSources[p.hair] : frameFor[part]];
        for (let i = 0; i < N; i++)
          if (mask[i]) {
            const a = i * 4,
              t = mask[i];
            for (let c = 0; c < 3; c++) combined[a + c] = combined[a + c] * (1 - t) + src[a + c] * t;
          }
      }
    if (!p.jaw && !p.spacing && !p.mouth && !p.smile) return combined;
    const out = new Uint8ClampedArray(combined);
    for (let y = 0, i = 0; y < H; y++)
      for (let x = 0; x < W; x++, i++) {
        const dx = p.jaw * fields.jaw[i] + p.spacing * fields.spacing[i] + p.mouth * fields.mouth[i],
          dy = p.smile * fields.smile[i];
        if (!dx && !dy) continue;
        const sx = clamp(x + dx, 0, W - 1),
          sy = clamp(y + dy, 0, H - 1),
          ix = Math.floor(sx),
          iy = Math.floor(sy),
          fx = sx - ix,
          fy = sy - iy;
        const a = (iy * W + ix) * 4,
          b = (iy * W + Math.min(W - 1, ix + 1)) * 4,
          c = (Math.min(H - 1, iy + 1) * W + ix) * 4,
          d = (Math.min(H - 1, iy + 1) * W + Math.min(W - 1, ix + 1)) * 4;
        for (let k = 0; k < 4; k++)
          out[i * 4 + k] =
            (combined[a + k] * (1 - fx) + combined[b + k] * fx) * (1 - fy) + (combined[c + k] * (1 - fx) + combined[d + k] * fx) * fy;
      }
    return out;
  }
  return { render, masks, maskFor, fields };
}

// Complete finished illustrations. Nothing inside a portrait is stretched, tinted,
// assembled or changed by the old feature description. Catalog tags are authored
// fictional artwork presets, not a classifier or a claim about real populations.
import { createElement } from 'react';
import manifest from '../assets/complete-portraits/manifest.json';

export type PortraitContext = 'player' | 'staff';
export type Portrait = {
  id: string;
  label: string;
  sheet: string;
  collection: string;
  role: PortraitContext;
  gender: 'man' | 'woman';
  age: string;
  looks: Record<string, number>;
  beard: string;
  url: string;
  width: number;
  height: number;
  crop: number[];
};
const sheetUrls: Record<string, string> = {
  approved: new URL('../assets/complete-portraits/approved.png', import.meta.url).href,
  playersA: new URL('../assets/complete-portraits/playersA.jpg', import.meta.url).href,
  playersB: new URL('../assets/complete-portraits/playersB.jpg', import.meta.url).href,
  playersC: new URL('../assets/complete-portraits/playersC.jpg', import.meta.url).href,
  staffMen: new URL('../assets/complete-portraits/staffMen.jpg', import.meta.url).href,
  staffWomen: new URL('../assets/complete-portraits/staffWomen.jpg', import.meta.url).href,
};
export const PORTRAITS: Portrait[] = Object.entries(manifest).flatMap(([sheet, m]: [string, any]) =>
  m.looks.map((looks: Record<string, number>, i: number) => ({
    id: sheet + '-' + String(i + 1).padStart(2, '0'),
    label: m.label + ' ' + String(i + 1).padStart(2, '0'),
    sheet,
    collection: m.label,
    role: m.role,
    gender: m.gender,
    age: m.age[i],
    looks,
    beard: m.beard[i],
    url: sheetUrls[sheet],
    width: m.width,
    height: m.height,
    crop: m.crops?.[i] || [((i % 4) * m.width) / 4, (Math.floor(i / 4) * m.height) / 4, m.width / 4, m.height / 4],
  })),
);
const byId = new Map(PORTRAITS.map(p => [p.id, p]));
const hash = (seed: number, s: string) => {
  let v = (seed ^ 2166136261) >>> 0;
  for (const c of s) v = Math.imul(v ^ c.charCodeAt(0), 16777619) >>> 0;
  return v;
};
const sources = (f: any): Record<string, number> => f.ancestry || { [f.race || 'white']: 1 };
const distance = (a: Record<string, number>, b: Record<string, number>) =>
  ['black', 'dark', 'asian', 'white', 'brown'].reduce((n, k) => n + ((a[k] || 0) - (b[k] || 0)) ** 2, 0);
export function portraitChoices(f: any, context: PortraitContext = 'player') {
  const gender = f.fem ? 'woman' : 'man';
  const eligible = PORTRAITS.filter(p => p.gender === gender),
    role = eligible.filter(p => p.role === context);
  const entries = role.length ? role : eligible.length ? eligible : PORTRAITS;
  const a = sources(f),
    min = Math.min(...entries.map(p => distance(a, p.looks)));
  return entries.filter(p => distance(a, p.looks) <= min + 0.65);
}
function weight(f: any, p: Portrait) {
  const a = sources(f),
    asian = a.asian || 0;
  return Math.exp(-3 * distance(a, p.looks)) * (p.beard === 'full' ? 1 - 0.86 * asian : 1);
}
export function portraitForFace(f: any, context: PortraitContext = 'player'): Portrait {
  const manual = byId.get(f.portrait?.id);
  if (manual) return manual;
  const eligible = portraitChoices(f, context);
  // Only the stable seed and appearance metadata select the default. Birthdays,
  // team changes and old individual-feature edits cannot swap someone's identity.
  return eligible.reduce((best, p) => {
    const score = (x: Portrait) => -Math.log((hash(f.seed || 1, x.id) + 1) / 4294967297) / weight(f, x);
    return score(p) < score(best) ? p : best;
  });
}
export function anotherPortrait(
  f: any,
  context: PortraitContext = 'player',
  current = portraitForFace(f, context).id,
  rnd: () => number = Math.random,
): Portrait {
  const entries = portraitChoices(f, context).filter(p => p.id !== current);
  const pool = entries.length ? entries : PORTRAITS.filter(p => p.id !== current);
  let n = rnd() * pool.reduce((v, p) => v + weight(f, p), 0);
  return pool.find(p => (n -= weight(f, p)) < 0) || pool[pool.length - 1] || portraitForFace(f, context);
}
export function selectPortrait(p: any, id: string): boolean {
  if (!byId.has(id)) return false;
  p.faceX = { ...(p.faceX || {}), 'portrait.id': id };
  delete p.faceImg;
  return true;
}
export function clearPortrait(p: any) {
  const edits = { ...(p.faceX || {}) };
  delete edits['portrait.id'];
  if (edits.portrait) {
    const nested = { ...edits.portrait };
    delete nested.id;
    if (Object.keys(nested).length) edits.portrait = nested;
    else delete edits.portrait;
  }
  if (Object.keys(edits).length) p.faceX = edits;
  else delete p.faceX;
  delete p.faceImg;
}
export function portraitEditSnapshot(p: any) {
  return { faceSeed: p.faceSeed, faceX: p.faceX ? structuredClone(p.faceX) : undefined, faceImg: p.faceImg, race: p.race };
}
export function restorePortraitEdit(p: any, snapshot: ReturnType<typeof portraitEditSnapshot>) {
  for (const key of ['faceSeed', 'faceX', 'faceImg', 'race'] as const) {
    if (snapshot[key] === undefined) delete p[key];
    else p[key] = key === 'faceX' ? structuredClone(snapshot[key]) : snapshot[key];
  }
}
export function portraitElement(portrait: Portrait) {
  const [x, y, width, height] = portrait.crop,
    clip = 'complete-portrait-' + portrait.id;
  return createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: portrait.crop.join(' '),
      width: '100%',
      height: '100%',
      preserveAspectRatio: 'xMidYMid meet',
      style: { display: 'block' },
      'data-face-art': 'complete-illustration',
      'data-portrait-id': portrait.id,
    },
    createElement(
      'defs',
      {},
      createElement('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' }, createElement('rect', { x, y, width, height })),
    ),
    createElement('image', { href: portrait.url, width: portrait.width, height: portrait.height, clipPath: 'url(#' + clip + ')' }),
  );
}
export const completePortraitSvg = (f: any, context: PortraitContext = 'player') => portraitElement(portraitForFace(f, context));

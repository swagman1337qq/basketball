// Painted pixels remain the artwork. Geometry uses a smooth, bounded inverse
// map: no cut-and-paste eyes, no procedural replacement head.
import { FULL_SIZE as W, FULL_HAIR_COLORS, FULL_DYES, FULL_EYE_COLORS, fullHead, type FullPortraitSettings } from './fullPortraits';
import { mulberry32 } from './rng';
const N = W * W,
  G = 160,
  GN = G * G,
  STEP = W / G;
export const fullClamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const smooth = (a: number, b: number, v: number) => {
  const t = fullClamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const oval = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  1 - smooth(0.48, 1, Math.hypot((x - cx) / rx, (y - cy) / ry));
const rgb = (s: string) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
type Field = { key: string; x?: Float32Array; y?: Float32Array };
let fields: Field[] | null = null;
function geometryFields() {
  if (fields) return fields;
  const specs: [string, boolean, boolean, (x: number, y: number) => [number, number]][] = [
    ['headWidth', true, false, (x, y) => [-W * (x - 0.5) * 0.075 * oval(x, y, 0.5, 0.49, 0.34, 0.35), 0]],
    ['headLength', false, true, (x, y) => [0, -W * (y - 0.48) * 0.055 * oval(x, y, 0.5, 0.49, 0.33, 0.36)]],
    ['cheek', true, false, (x, y) => [-W * (x - 0.5) * 0.085 * oval(x, y, 0.5, 0.59, 0.29, 0.11), 0]],
    ['jaw', true, false, (x, y) => [-W * (x - 0.5) * 0.11 * oval(x, y, 0.5, 0.71, 0.25, 0.11), 0]],
    ['chinWidth', true, false, (x, y) => [-W * (x - 0.5) * 0.17 * oval(x, y, 0.5, 0.755, 0.12, 0.055), 0]],
    ['chinLength', false, true, (x, y) => [0, -W * 0.021 * oval(x, y, 0.5, 0.755, 0.16, 0.055)]],
    [
      'eyeSize',
      true,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.419 : 0.583,
          m = oval(x, y, cx, 0.466, 0.072, 0.036);
        return [-W * (x - cx) * 0.14 * m, -W * (y - 0.466) * 0.15 * m];
      },
    ],
    [
      'eyeOpen',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.419 : 0.583;
        return [0, -W * (y - 0.466) * 0.38 * oval(x, y, cx, 0.466, 0.072, 0.034)];
      },
    ],
    ['spacing', true, false, (x, y) => [W * 0.009 * (oval(x, y, 0.419, 0.466, 0.072, 0.046) - oval(x, y, 0.583, 0.466, 0.072, 0.046)), 0]],
    [
      'tilt',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.419 : 0.583;
        return [0, W * (x - cx) * (x < 0.5 ? 1 : -1) * 0.11 * oval(x, y, cx, 0.466, 0.073, 0.042)];
      },
    ],
    [
      'browWeight',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.415 : 0.587;
        return [0, -W * (y - 0.424) * 0.25 * oval(x, y, cx, 0.424, 0.09, 0.03)];
      },
    ],
    [
      'browArch',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.415 : 0.587;
        return [0, W * 0.007 * oval(x, y, cx, 0.42, 0.072, 0.033)];
      },
    ],
    [
      'browAngle',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.415 : 0.587;
        return [0, W * (x - cx) * (x < 0.5 ? 1 : -1) * 0.14 * oval(x, y, cx, 0.425, 0.09, 0.03)];
      },
    ],
    [
      'browFlat',
      false,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.415 : 0.587;
        return [0, W * 0.006 * ((Math.abs(x - cx) / 0.07) ** 2 - 0.4) * oval(x, y, cx, 0.424, 0.09, 0.03)];
      },
    ],
    ['noseWidth', true, false, (x, y) => [-W * (x - 0.5) * 0.18 * oval(x, y, 0.5, 0.557, 0.075, 0.075), 0]],
    ['noseLength', false, true, (x, y) => [0, -W * (y - 0.53) * 0.15 * oval(x, y, 0.5, 0.55, 0.067, 0.09)]],
    ['noseBridge', true, false, (x, y) => [-W * (x - 0.5) * 0.3 * oval(x, y, 0.5, 0.51, 0.04, 0.065), 0]],
    ['noseTip', false, true, (x, y) => [0, W * 0.009 * oval(x, y, 0.5, 0.565, 0.045, 0.029)]],
    ['mouthWidth', true, false, (x, y) => [-W * (x - 0.5) * 0.17 * oval(x, y, 0.5, 0.652, 0.11, 0.037), 0]],
    ['upperLip', false, true, (x, y) => [0, -W * (y - 0.645) * 0.24 * oval(x, y, 0.5, 0.639, 0.083, 0.022)]],
    ['lowerLip', false, true, (x, y) => [0, -W * (y - 0.654) * 0.3 * oval(x, y, 0.5, 0.666, 0.08, 0.022)]],
    ['smileL', false, true, (x, y) => [0, W * 0.012 * oval(x, y, 0.445, 0.653, 0.041, 0.043)]],
    ['smileR', false, true, (x, y) => [0, W * 0.012 * oval(x, y, 0.558, 0.653, 0.041, 0.043)]],
    [
      'earSize',
      true,
      true,
      (x, y) => {
        const cx = x < 0.5 ? 0.298 : 0.706,
          m = oval(x, y, cx, 0.535, 0.055, 0.083);
        return [-W * (x - cx) * 0.11 * m, -W * (y - 0.535) * 0.11 * m];
      },
    ],
    ['earsOut', true, false, (x, y) => [W * 0.009 * (oval(x, y, 0.298, 0.535, 0.053, 0.08) - oval(x, y, 0.706, 0.535, 0.053, 0.08)), 0]],
    ['build', true, false, (x, y) => [-W * (x - 0.5) * 0.075 * smooth(0.78, 0.94, y), 0]],
  ];
  fields = specs.map(([key, hasX, hasY, fn]) => {
    const f: Field = { key, ...(hasX ? { x: new Float32Array(GN) } : {}), ...(hasY ? { y: new Float32Array(GN) } : {}) };
    for (let y = 0, i = 0; y < G; y++)
      for (let x = 0; x < G; x++, i++) {
        const v = fn(x / G, y / G);
        if (f.x) f.x[i] = v[0];
        if (f.y) f.y[i] = v[1];
      }
    return f;
  });
  return fields;
}
function coefficients(p: FullPortraitSettings) {
  const v: Record<string, number> = { ...(p as any), eyeOpen: 0, browArch: 0, browAngle: 0, browFlat: 0, smileL: 0, smileR: 0 };
  const eye: Record<string, [number, number, number]> = {
    almond: [0, 0, 0],
    round: [0.7, 0.1, 0],
    hooded: [-0.45, 0, 0],
    monolid: [-0.65, -0.08, 0.08],
    deepset: [-0.12, -0.35, 0],
    downturned: [0, 0, -0.7],
    upturned: [0, 0, 0.7],
  };
  const e = eye[p.eyes];
  v.eyeOpen += e[0];
  v.eyeSize += e[1];
  v.tilt += e[2];
  const brow: Record<string, [number, number, number, number]> = {
    straight: [0, 0, 0.4, 0],
    soft: [0.25, 0, -0.2, -0.1],
    arched: [0.75, 0, -0.35, 0],
    angled: [0.1, 0.7, 0, 0],
    flat: [-0.25, 0, 0.8, -0.1],
    bushy: [0.15, 0, 0, 0.65],
  };
  const b = brow[p.brows];
  v.browArch = b[0];
  v.browAngle = b[1];
  v.browFlat = b[2];
  v.browWeight += b[3];
  const expr: Record<string, [number, number, number, number]> = {
    serious: [0, 0, 0, 0],
    slight: [0.45, 0.45, 0, 0],
    smile: [1, 1, 0.05, 0.12],
    relaxed: [0.1, 0.1, 0.15, -0.08],
    mean: [-0.12, -0.12, -0.3, -0.15],
    smirk: [0.9, 0.1, 0, 0],
  };
  const ex = expr[p.expr];
  v.smileL = ex[0];
  v.smileR = ex[1];
  v.eyeOpen += ex[2];
  v.browAngle += ex[3];
  return v;
}
const interpolate = (a: Float32Array, x: number, y: number) => {
  const ix = Math.min(G - 1, Math.max(0, x / STEP)),
    iy = Math.min(G - 1, Math.max(0, y / STEP)),
    x0 = Math.floor(ix),
    y0 = Math.floor(iy),
    fx = ix - x0,
    fy = iy - y0,
    x1 = Math.min(G - 1, x0 + 1),
    y1 = Math.min(G - 1, y0 + 1);
  return (a[y0 * G + x0] * (1 - fx) + a[y0 * G + x1] * fx) * (1 - fy) + (a[y1 * G + x0] * (1 - fx) + a[y1 * G + x1] * fx) * fy;
};
export function fullWarp(p: FullPortraitSettings) {
  const dx = new Float32Array(GN),
    dy = new Float32Array(GN),
    v = coefficients(p);
  for (const f of geometryFields()) {
    const n = v[f.key] || 0;
    if (!n) continue;
    for (let i = 0; i < GN; i++) {
      if (f.x) dx[i] += n * f.x[i];
      if (f.y) dy[i] += n * f.y[i];
    }
  }
  let max = 0;
  for (let y = 0; y < G - 1; y++)
    for (let x = 0; x < G - 1; x++) {
      const i = y * G + x;
      max = Math.max(
        max,
        (Math.max(Math.abs(dx[i + 1] - dx[i]), Math.abs(dx[i + G + 1] - dx[i + G])) +
          Math.max(Math.abs(dx[i + G] - dx[i]), Math.abs(dx[i + G + 1] - dx[i + 1]))) /
          STEP,
        (Math.max(Math.abs(dy[i + 1] - dy[i]), Math.abs(dy[i + G + 1] - dy[i + G])) +
          Math.max(Math.abs(dy[i + G] - dy[i]), Math.abs(dy[i + G + 1] - dy[i + 1]))) /
          STEP,
      );
    }
  const scale = Math.min(1, 0.42 / Math.max(max, 1e-9));
  if (scale < 1)
    for (let i = 0; i < GN; i++) {
      dx[i] *= scale;
      dy[i] *= scale;
    }
  let minJacobian = 1;
  for (let y = 0; y < G - 1; y++)
    for (let x = 0; x < G - 1; x++) {
      const i = y * G + x,
        a0 = (dx[i + 1] - dx[i]) / STEP,
        a1 = (dx[i + G + 1] - dx[i + G]) / STEP,
        b0 = (dx[i + G] - dx[i]) / STEP,
        b1 = (dx[i + G + 1] - dx[i + 1]) / STEP,
        c0 = (dy[i + 1] - dy[i]) / STEP,
        c1 = (dy[i + G + 1] - dy[i + G]) / STEP,
        d0 = (dy[i + G] - dy[i]) / STEP,
        d1 = (dy[i + G + 1] - dy[i + 1]) / STEP;
      minJacobian = Math.min(
        minJacobian,
        (1 + a0) * (1 + d0) - b0 * c0,
        (1 + a0) * (1 + d1) - b1 * c0,
        (1 + a1) * (1 + d0) - b0 * c1,
        (1 + a1) * (1 + d1) - b1 * c1,
      );
    }
  const offset = (x: number, y: number) => [interpolate(dx, x, y), interpolate(dy, x, y)];
  const point = (sx: number, sy: number) => {
    let x = sx,
      y = sy;
    for (let i = 0; i < 8; i++) {
      const d = offset(x, y);
      x = sx - d[0];
      y = sy - d[1];
    }
    return [x, y];
  };
  return { dx, dy, scale, minJacobian, maxSlope: max * scale, offset, point };
}
export type FullPixels = { head: Uint8ClampedArray; hair?: Uint8ClampedArray; beard?: Uint8ClampedArray; clothes?: Uint8ClampedArray };
const clothingMasks = new WeakMap<Uint8ClampedArray, Float32Array>();
function clothingMask(head: Uint8ClampedArray) {
  const cached = clothingMasks.get(head);
  if (cached) return cached;
  const mask = new Float32Array(N).fill(-1),
    left = new Int16Array(W),
    right = new Int16Array(W);
  for (let y = Math.floor(0.79 * W); y < W; y++) {
    const isPurple = (x: number) => {
      const i = (y * W + x) * 4,
        r = head[i],
        g = head[i + 1],
        b = head[i + 2];
      return b > g * 1.15 && b > r * 0.94;
    };
    let nearest = -1000;
    for (let x = 0; x < W; x++) {
      if (isPurple(x)) nearest = x;
      left[x] = x - nearest;
    }
    nearest = 1000;
    for (let x = W - 1; x >= 0; x--) {
      if (isPurple(x)) nearest = x;
      right[x] = nearest - x;
    }
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4,
        r = head[i],
        g = head[i + 1],
        b = head[i + 2],
        trim = r >= g && r - g < 45 && g - b < 45 && g > b;
      if (isPurple(x) || (Math.min(left[x], right[x]) <= 11 && trim)) mask[y * W + x] = smooth(-8, 35, b - g - 0.35 * (r - g));
    }
  }
  clothingMasks.set(head, mask);
  return mask;
}
const bounds = new WeakMap<Uint8ClampedArray, { min: number; max: number; front: Float32Array; level: number }>();
const crownFits = new WeakMap<Uint8ClampedArray, WeakMap<Uint8ClampedArray, { scale: number; offset: number }>>();
// Fit the painted cap to this head once. Different hair sheets have slightly
// different crown heights; their front hairline remains anchored in place.
function crownFit(head: Uint8ClampedArray, hair: Uint8ClampedArray) {
  let heads = crownFits.get(hair);
  if (!heads) crownFits.set(hair, (heads = new WeakMap()));
  const old = heads.get(head);
  if (old !== undefined) return old;
  const anchor = W * 0.38,
    ratios: number[] = [];
  for (let x = Math.round(W * 0.4); x <= W * 0.6; x += 3) {
    let scalp = -1,
      top = -1;
    for (let y = Math.floor(W * 0.16); y < anchor; y++) {
      const i = (y * W + x) * 4,
        r = head[i],
        g = head[i + 1],
        b = head[i + 2];
      if (r > g * 1.13 && g > b * 1.16 && r - b > 24 && g > 24) {
        scalp = y;
        break;
      }
    }
    for (let y = Math.floor(W * 0.1); y < anchor - 8; y++) {
      if (hair[(y * W + x) * 4 + 3] > 180) {
        top = y;
        break;
      }
    }
    if (scalp >= 0 && top >= 0) ratios.push((anchor - scalp + 4) / (anchor - top));
  }
  ratios.sort((a, b) => a - b);
  const scale = fullClamp(ratios[Math.floor(ratios.length * 0.9)] || 1, 1, 1.4),
    centres: number[] = [],
    hairCentres: number[] = [];
  for (let y = Math.round(W * 0.32); y <= W * 0.39; y += 3) {
    let left = W,
      right = 0,
      hleft = W,
      hright = 0;
    for (let x = Math.round(W * 0.16); x < W * 0.84; x++) {
      const i = (y * W + x) * 4,
        r = head[i],
        g = head[i + 1],
        b = head[i + 2];
      if (r > g * 1.13 && g > b * 1.16 && r - b > 24 && g > 24) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
      if (hair[i + 3] > 180) {
        hleft = Math.min(hleft, x);
        hright = Math.max(hright, x);
      }
    }
    if (right - left > 60) centres.push((left + right) / 2);
    if (hright - hleft > 15) hairCentres.push((hleft + hright) / 2);
  }
  centres.sort((a, b) => a - b);
  hairCentres.sort((a, b) => a - b);
  const offset = fullClamp(
      (centres[Math.floor(centres.length / 2)] ?? 160) - (hairCentres[Math.floor(hairCentres.length / 2)] ?? 160),
      -10,
      10,
    ),
    fit = { scale, offset };
  heads.set(head, fit);
  return fit;
}
function verticalBounds(a: Uint8ClampedArray) {
  let b = bounds.get(a);
  if (!b) {
    let min = W,
      max = 0;
    const front = new Float32Array(W).fill(0.38),
      edges: number[] = [];
    for (let y = 0, i = 0; y < W; y++)
      for (let x = 0; x < W; x++, i++)
        if (a[i * 4 + 3] > 48) {
          min = Math.min(min, y);
          max = Math.max(max, y);
          if (y / W > 0.27 && y / W < 0.47) front[x] = y / W;
        }
    for (let x = Math.round(0.36 * W); x < 0.64 * W; x++) edges.push(front[x]);
    edges.sort((a, b) => a - b);
    b = { min, max, front, level: edges[Math.floor(edges.length * 0.25)] || 0.38 };
    bounds.set(a, b);
  }
  return b;
}
// The source beard cells have different mouth/chin registrations. Align each
// drawing to the selected head before the shared facial-feature warp runs.
const BEARD_ANCHORS: Record<string, [number, number, number]> = {
  stubble: [204, 263, 0],
  heavyStubble: [205, 264, 0],
  patchy: [204, 264, 0],
  mustache: [207, 0, 0],
  soulpatch: [228, 0, 0],
  chinpuff: [247, 0, 0],
  goatee: [190, 256, 3],
  circle: [189, 256, 2],
  vandyke: [172, 242, 6],
  chinstrap: [173, 237, 0],
  chinstrapMustache: [172, 236, 0],
  shortBeard: [173, 237, 3],
  fullBeard: [173, 240, 8],
  thickBeard: [173, 246, 15],
  pencil: [172, 0, 0],
  longGoatee: [171, 257, 20],
};
// Mustache centre just above the upper lip, and bottom of the chin, in the base art.
const FACE_ANCHORS = [
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
const faceFits = new WeakMap<Uint8ClampedArray, Map<number, { centre: number; half: number; lip: number; chin: number }>>();
function faceFit(head: Uint8ClampedArray, index: number) {
  let fits = faceFits.get(head);
  if (!fits) faceFits.set(head, (fits = new Map()));
  const old = fits.get(index);
  if (old) return old;
  const [lip, chin] = FACE_ANCHORS[index],
    lefts: number[] = [],
    rights: number[] = [];
  for (let y = lip + 3; y <= lip + 13; y += 2) {
    let left = W,
      right = 0;
    for (let x = Math.floor(W * 0.27); x < W * 0.73; x++) {
      const i = (y * W + x) * 4,
        r = head[i],
        g = head[i + 1],
        b = head[i + 2];
      if (r > g * 1.13 && g > b * 1.16 && r - b > 24 && g > 24) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    if (right - left > 60) {
      lefts.push(left);
      rights.push(right);
    }
  }
  lefts.sort((a, b) => a - b);
  rights.sort((a, b) => a - b);
  const left = lefts[Math.floor(lefts.length / 2)] ?? 106,
    right = rights[Math.floor(rights.length / 2)] ?? 214,
    fit = { centre: (left + right) / 2, half: (right - left) / 2, lip, chin };
  fits.set(index, fit);
  return fit;
}
function beardFit(head: Uint8ClampedArray, p: FullPortraitSettings) {
  const f = faceFit(head, fullHead(p.base)!.index),
    a = BEARD_ANCHORS[p.facial] || BEARD_ANCHORS.stubble,
    target = p.facial === 'soulpatch' ? f.lip + 24 : p.facial === 'chinpuff' ? f.chin - 5 : f.lip,
    scaleY = a[1] ? (f.chin + a[2] - target) / (a[1] - a[0]) : p.facial === 'chinpuff' ? 0.8 : 0.85,
    scaleX = fullClamp(f.half / 61, 0.76, 1.05),
    clipped = ['stubble', 'heavyStubble', 'patchy', 'chinstrap', 'chinstrapMustache'].includes(p.facial);
  return { ...f, sourceY: a[0], target, scaleY, scaleX, clipped };
}
function overlay(
  out: Uint8ClampedArray,
  src: Uint8ClampedArray,
  p: FullPortraitSettings,
  part: 'hair' | 'beard',
  age: number,
  skin: Uint8Array,
  cap = { scale: 1, offset: 0 },
  beard?: ReturnType<typeof beardFit>,
) {
  const isHair = part === 'hair',
    grey = isHair
      ? Math.max(p.grey, p.ageAuto && !p.greyManual ? fullClamp((age - 34) / 65) * 0.65 : 0)
      : Math.max(p.beardGrey, p.ageAuto && !p.beardGreyManual ? fullClamp((age - 37) / 65) * 0.65 : 0);
  const natural = mix(rgb(FULL_HAIR_COLORS[p.natural][1]), [185, 183, 178], grey),
    dye = p.dye === 'none' ? null : rgb(FULL_DYES[p.dye][1]),
    b = verticalBounds(src);
  const recede = Math.max(p.recede, p.ageAuto && !p.recedeManual ? fullClamp((age - 36) / 85) * 0.55 : 0);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      let sy = y,
        sx = x;
      if (!isHair && beard) {
        sy = beard.sourceY + (y - beard.target) / beard.scaleY;
        sx = 160.5 + (x - beard.centre) / beard.scaleX;
      }
      if (isHair) {
        sx = x - cap.offset;
        // Length changes the free ends below the roots, never the cap above them.
        // The cap's registration stays the same at every length setting.
        const anchor = 0.38 * W;
        sy = anchor + (y - anchor) / (y < anchor ? cap.scale : 1 + p.hairLength * 0.15);
        sy -= p.sideburns * W * 0.024 * smooth(0.44, 0.56, y / W) * smooth(0.08, 0.17, Math.abs(x / W - 0.5));
      }
      if (sy < 0 || sy >= W || sx < 0 || sx >= W) continue;
      const si = (Math.round(fullClamp(sy, 0, W - 1)) * W + Math.round(fullClamp(sx, 0, W - 1))) * 4,
        i = (y * W + x) * 4;
      let a = src[si + 3] / 255;
      if (!a) continue;
      if (!isHair && beard) {
        // Discard faint source fragments over the nose; cheek/sideburn coverage
        // remains independent of the upper-lip registration.
        const nose = 1 - smooth(22, 34, Math.abs(x - beard.centre));
        a *= 1 - nose * (1 - smooth(beard.lip - 11, beard.lip - 8, y));
      }
      if (isHair && p.hair === 'mohawk') a *= 1 - smooth(W * 0.065, W * 0.105, Math.abs(sx - W * 0.5));
      if (!isHair && beard?.clipped) {
        const t = fullClamp((y - (beard.lip - 10)) / (beard.chin - (beard.lip - 10))),
          width = 12 + (beard.half - 12) * Math.sqrt(Math.max(0, 1 - t ** 1.3));
        a *= (1 - smooth(width - 1, width + 1, Math.abs(x - beard.centre))) * (1 - smooth(beard.chin - 1, beard.chin + 1, y));
      }
      if (isHair && (recede > 0 || p.hairline !== 'natural')) {
        const u = x / W - 0.5,
          v = y / W,
          centre = 1 - smooth(0.13, 0.24, Math.abs(u));
        let edge = b.front[Math.round(fullClamp(sx, 0, W - 1))] - recede * 0.07;
        if (p.hairline === 'peak') edge -= 0.04 * fullClamp(Math.abs(u) / 0.16);
        if (p.hairline === 'round') edge -= 0.045 * fullClamp(Math.abs(u) / 0.21) ** 2;
        if (p.hairline === 'shapeup') edge = b.level - 0.012 - recede * 0.07;
        if (p.hairline === 'straight') edge = b.level - 0.004 - recede * 0.07;
        a *= 1 - centre * smooth(edge, edge + 0.012, sy / W);
      }
      if (!isHair) a *= p.beardDensity;
      if (a > 0.2) skin[y * W + x] = 0;
      let target = natural;
      if (isHair && dye) {
        const strand = 0.5 + 0.5 * Math.sin(x * 0.23 + Math.sin(y * 0.08) * 2 + Math.sin(y * 0.025 + x * 0.03) * 1.8),
          lit = (src[si] * 0.2126 + src[si + 1] * 0.7152 + src[si + 2] * 0.0722) / 165;
        const t =
          p.dyeKind === 'full'
            ? 1
            : p.dyeKind === 'tips'
              ? smooth(0.58, 0.9, (sy - b.min) / Math.max(1, b.max - b.min))
              : smooth(0.72, 0.96, strand) * smooth(0.1, 0.6, lit) * 0.85;
        target = mix(natural, dye, t);
      }
      let light = fullClamp((src[si] * 0.2126 + src[si + 1] * 0.7152 + src[si + 2] * 0.0722) / 165);
      if (isHair) {
        const tx =
          p.texture === 'straight'
            ? Math.sin(x * 0.7) * 0.025
            : p.texture === 'wavy'
              ? Math.sin(x * 0.34 + Math.sin(y * 0.12) * 2) * 0.035
              : p.texture === 'curly'
                ? Math.sin(Math.hypot((x % 15) - 7, (y % 15) - 7)) * 0.045
                : Math.sin(x * 0.82) * Math.sin(y * 0.9) * 0.05;
        light = fullClamp(light + tx);
      }
      for (let k = 0; k < 3; k++) {
        const color = target[k] * 0.32 * (1 - light) + (target[k] * 1.35 + 35) * light;
        out[i + k] = out[i + k] * (1 - a) + color * a;
      }
    }
}
export function paintFullPixels(assets: FullPixels, p: FullPortraitSettings, age = 25, jersey: [string, string] = ['#764191', '#f5e9d3']) {
  for (const a of Object.values(assets)) if (a && a.length !== N * 4) throw Error('Invalid full-portrait pixels');
  const out = new Uint8ClampedArray(assets.head),
    primary = rgb(jersey[0]),
    trim = rgb(jersey[1]),
    garment = clothingMask(assets.head);
  const under: Record<string, number[]> = { neutral: [0, 0, 0], warm: [4, 1, -3], olive: [-1, 2, -3], rosy: [4, -2, 1] };
  const skin = new Uint8Array(N);
  for (let y = 0, i = 0; y < W; y++)
    for (let x = 0; x < W; x++, i++) {
      const j = i * 4,
        r = out[j],
        g = out[j + 1],
        b = out[j + 2],
        v = y / W;
      const skinLike = v > 0.2 && r > g * 1.13 && g > b * 1.16 && r - b > 24 && g > 29;
      if (skinLike) {
        skin[i] = 1;
        const d = under[p.under];
        const pale = [247, 222, 202],
          t = Math.max(0, p.skinTone) * 0.26;
        for (let k = 0; k < 3; k++)
          out[j + k] = p.skinTone >= 0 ? out[j + k] * (1 - t) + pale[k] * t + d[k] : out[j + k] * (1 + p.skinTone * 0.32) + d[k];
      }
      if (garment[i] >= 0) {
        skin[i] = 0;
        const t = garment[i],
          target = p.outfit === 'jersey' ? mix(trim, primary, t) : [65, 62, 61],
          l = (r * 0.2126 + g * 0.7152 + b * 0.0722) / (72 * t + 222 * (1 - t));
        for (let k = 0; k < 3; k++) out[j + k] = target[k] * fullClamp(l, 0.45, 1.45);
      }
      if (p.eyeColor !== 'original')
        for (const cx of [0.419, 0.583]) {
          const d = ((x / W - cx) / 0.014) ** 2 + ((v - 0.466) / 0.012) ** 2;
          if (d < 1 && d > 0.12 && (r + g + b) / 3 < 100) {
            const target = rgb(FULL_EYE_COLORS[p.eyeColor][1]),
              t = 0.74 * (1 - smooth(0.7, 1, d));
            for (let k = 0; k < 3; k++) out[j + k] = out[j + k] * (1 - t) + target[k] * t;
          }
        }
    }
  if (p.freckles) {
    const rnd = mulberry32(p.seed ^ 0x7f8b160d);
    for (let t = 0; t < Math.round(100 * p.freckles); t++) {
      const x = Math.round((0.33 + rnd() * 0.34) * W),
        y = Math.round((0.51 + rnd() * 0.1) * W),
        a = (y * W + x) * 4;
      if (skin[y * W + x]) for (let k = 0; k < 3; k++) out[a + k] *= 0.64;
    }
  }
  if (assets.clothes)
    for (let i = 0; i < N; i++) {
      const j = i * 4,
        a = assets.clothes[j + 3] / 255;
      if (a > 0.2) skin[i] = 0;
      for (let k = 0; k < 3; k++) out[j + k] = out[j + k] * (1 - a) + assets.clothes[j + k] * a;
    }
  if (assets.beard) overlay(out, assets.beard, p, 'beard', age, skin, undefined, beardFit(assets.head, p));
  if (assets.hair) {
    const fit = crownFit(assets.head, assets.hair);
    overlay(out, assets.hair, p, 'hair', age, skin, ['balding', 'baldingBuzz'].includes(p.hair) ? { ...fit, scale: 1 } : fit);
  }
  const warp = fullWarp(p),
    pixels = new Uint8ClampedArray(out);
  for (let y = 0, i = 0; y < W; y++)
    for (let x = 0; x < W; x++, i++) {
      const [dX, dY] = warp.offset(x, y);
      if (!dX && !dY) continue;
      const sx = fullClamp(x + dX, 0, W - 1),
        sy = fullClamp(y + dY, 0, H - 1),
        ix = Math.floor(sx),
        iy = Math.floor(sy),
        fx = sx - ix,
        fy = sy - iy,
        x1 = Math.min(W - 1, ix + 1),
        y1 = Math.min(W - 1, iy + 1),
        a = (iy * W + ix) * 4,
        b = (iy * W + x1) * 4,
        c = (y1 * W + ix) * 4,
        d = (y1 * W + x1) * 4;
      for (let k = 0; k < 4; k++)
        pixels[i * 4 + k] = (out[a + k] * (1 - fx) + out[b + k] * fx) * (1 - fy) + (out[c + k] * (1 - fx) + out[d + k] * fx) * fy;
    }
  return { pixels, warp, garment, skin };
}
const H = W;

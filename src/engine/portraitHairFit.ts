// Register painted hair to the bare head's actual silhouette. All measurements
// use immutable source pixels; changing skin/hair colours cannot move the fit.
import { FULL_SIZE as W } from './fullPortraits';
const smooth = (a: number, b: number, n: number) => {
  const t = Math.max(0, Math.min(1, (n - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const median = (a: number[], fallback: number) => (a.length ? a.sort((a, b) => a - b)[a.length >> 1] : fallback);
export type ScalpSurface = {
  mask: Uint8Array;
  left: Float32Array;
  right: Float32Array;
  cx: number;
  half: number;
  top: number;
};
const surfaces = new WeakMap<Uint8ClampedArray, ScalpSurface>();
export function portraitScalp(head: Uint8ClampedArray): ScalpSurface {
  const old = surfaces.get(head);
  if (old) return old;
  const mask = new Uint8Array(W * W),
    left = new Float32Array(W).fill(W),
    right = new Float32Array(W).fill(-1);
  const centres: number[] = [],
    widths: number[] = [];
  let top = W;
  for (let y = 32; y <= 208; y++) {
    for (let x = 70; x <= 250; x++) {
      const i = (y * W + x) * 4,
        t = (x - 24) / 272;
      let contrast = 0;
      for (let k = 0; k < 3; k++) {
        const bg = head[(y * W + 24) * 4 + k] * (1 - t) + head[(y * W + 296) * 4 + k] * t;
        contrast = Math.max(contrast, Math.abs(head[i + k] - bg));
      }
      if (contrast > 20) {
        left[y] = Math.min(left[y], x);
        right[y] = Math.max(right[y], x);
      }
    }
    if (right[y] - left[y] >= 3) {
      top = Math.min(top, y);
      for (let x = left[y]; x <= right[y]; x++) mask[y * W + x] = 1;
      if (y >= 118 && y <= 137 && right[y] - left[y] > 55) {
        centres.push((left[y] + right[y]) / 2);
        widths.push((right[y] - left[y]) / 2);
      }
    }
  }
  const value = { mask, left, right, cx: clamp(median(centres, 160), 152, 168), half: clamp(median(widths, 61), 36, 80), top };
  surfaces.set(head, value);
  return value;
}
export type HairRootFit = {
  sourceCx: number;
  targetCx: number;
  scaleX: number;
  scalp: ScalpSurface;
  sourceLeft: Float32Array;
  sourceRight: Float32Array;
};
const rootFits = new WeakMap<Uint8ClampedArray, WeakMap<Uint8ClampedArray, HairRootFit>>();
export function hairRootFit(head: Uint8ClampedArray, hair: Uint8ClampedArray): HairRootFit {
  let heads = rootFits.get(hair);
  if (!heads) rootFits.set(hair, (heads = new WeakMap()));
  const old = heads.get(head);
  if (old) return old;
  const scalp = portraitScalp(head),
    centres: number[] = [],
    widths: number[] = [];
  for (let y = 103; y <= 124; y += 3) {
    let left = W,
      right = -1;
    for (let x = 50; x < 270; x++)
      if (hair[(y * W + x) * 4 + 3] > 180) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    if (right - left > 55) {
      centres.push((left + right) / 2);
      widths.push((right - left) / 2);
    }
  }
  const sourceCx = median(centres, 160),
    half = median(widths, scalp.half);
  const sourceLeft = new Float32Array(W).fill(W),
    sourceRight = new Float32Array(W).fill(-1);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++)
      if (hair[(y * W + x) * 4 + 3] > 20) {
        sourceLeft[y] = Math.min(sourceLeft[y], x);
        sourceRight[y] = Math.max(sourceRight[y], x);
      }
  const fit = { sourceCx, targetCx: scalp.cx, scaleX: clamp((scalp.half + 2) / half, 0.78, 1.18), scalp, sourceLeft, sourceRight };
  heads.set(head, fit);
  return fit;
}
// Keep the cap, temples, ears and ponytail attachment fixed. Only the free
// ends below the ears respond to the length control.
export function hairLengthSourceY(y: number, length: number, eye: number) {
  const rootEnd = eye + 38;
  return y <= rootEnd ? y : rootEnd + (y - rootEnd) / (1 + clamp(length, -1, 1) * 0.22);
}
export function hairRootSourceX(x: number, y: number, fit: HairRootFit, eye: number) {
  const weight = smooth(eye - 55, eye - 19, y) * (1 - smooth(eye + 36, eye + 78, y));
  const scale = 1 + (fit.scaleX - 1) * weight;
  return fit.sourceCx + (x - fit.targetCx) / scale;
}
export function visibleEar(x: number, y: number, fit: HairRootFit, eye: number) {
  if (!fit.scalp.mask[y * W + x]) return 0;
  const side = smooth(fit.scalp.half - 5, fit.scalp.half + 1, Math.abs(x - fit.targetCx));
  return side * smooth(eye - 9, eye + 3, y) * (1 - smooth(eye + 34, eye + 47, y));
}
export function scalpHairSourceX(x: number, y: number, sy: number, fit: HairRootFit) {
  const row = Math.max(0, Math.min(W - 1, Math.round(sy))),
    a = fit.sourceLeft[row],
    b = fit.sourceRight[row];
  const l = fit.scalp.left[y],
    r = fit.scalp.right[y];
  return b - a < 55 || r <= l ? -1 : a + ((x - l) * (b - a)) / (r - l);
}
type HairRootRaster = { sourceScale: Float32Array; earX: Float32Array; earY: Float32Array; templeX: Float32Array; templeY: Float32Array };
const rasterMaps = new WeakMap<HairRootFit, Map<number, HairRootRaster>>();
export function hairRootRaster(fit: HairRootFit, eye: number): HairRootRaster {
  let cache = rasterMaps.get(fit);
  if (!cache) rasterMaps.set(fit, (cache = new Map()));
  const old = cache.get(eye);
  if (old) return old;
  const sourceScale = new Float32Array(W),
    earX = new Float32Array(W),
    earY = new Float32Array(W),
    templeX = new Float32Array(W),
    templeY = new Float32Array(W);
  for (let i = 0; i < W; i++) {
    const weight = smooth(eye - 55, eye - 19, i) * (1 - smooth(eye + 36, eye + 78, i));
    sourceScale[i] = 1 / (1 + (fit.scaleX - 1) * weight);
    earX[i] = smooth(fit.scalp.half - 5, fit.scalp.half + 1, Math.abs(i - fit.targetCx));
    earY[i] = smooth(eye - 9, eye + 3, i) * (1 - smooth(eye + 34, eye + 47, i));
    templeX[i] = smooth(fit.scalp.half + 2, fit.scalp.half + 5, Math.abs(i - fit.targetCx));
    templeY[i] = smooth(eye - 23, eye - 8, i) * (1 - smooth(eye + 28, eye + 47, i));
  }
  const value = { sourceScale, earX, earY, templeX, templeY };
  cache.set(eye, value);
  return value;
}

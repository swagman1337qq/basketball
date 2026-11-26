import type { FullPortraitSettings } from './fullPortraits';
import { fullHead } from './fullPortraits';
import { portraitLandmarks } from './fullPortraitPainter';

// Reference-art surfaces, before the person's editable feature warp. Tattoos
// occupy arc length on the skin, rather than a rectangle in the picture plane.
export type TattooSurface = {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  curve: number;
  taper: number;
};
const LIMIT = 1.48;
const SIN_LIMIT = Math.sin(LIMIT),
  COS_LIMIT = Math.cos(LIMIT);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function tattooSurface(p: FullPortraitSettings, neck = false, side = 0): TattooSurface {
  const f = portraitLandmarks(p.base),
    head = fullHead(p.base)!;
  if (neck)
    return {
      cx: f.cx,
      cy: f.chin + 25,
      radius: head.neckRadius,
      angle: Math.asin((side * 27) / head.neckRadius),
      curve: 14,
      taper: 0.003,
    };
  const place = p.faceTattooPlace,
    s = place.startsWith('left') ? -1 : 1,
    temple = place.endsWith('Temple'),
    eye = place.endsWith('Eye'),
    forehead = place === 'forehead',
    x = forehead ? 0 : s * (temple ? 53 : eye ? 34 : 40),
    radius = head.faceRadius + (forehead ? 10 : 0);
  return {
    cx: f.cx,
    cy: forehead ? f.brow - 25 : temple ? f.eye - 8 : eye ? f.eye + 17 : f.nose + 8,
    radius,
    angle: Math.asin(x / radius),
    curve: temple ? 9 : forehead ? 7 : 6,
    taper: forehead ? 0.0005 : -0.001,
  };
}
export function tattooSurfacePoint(s: TattooSurface, u: number, v: number) {
  const theta = s.angle + u / s.radius,
    radius = s.radius * (1 + s.taper * v);
  return [s.cx + radius * Math.sin(theta), s.cy + v + s.curve * (Math.cos(theta) - Math.cos(s.angle))];
}
export function tattooSurfaceSample(s: TattooSurface, x: number, y: number) {
  const dx = x - s.cx,
    dy = y - s.cy,
    cosA = Math.cos(s.angle);
  let theta = Math.asin(clamp(dx / (s.radius * (1 + s.taper * dy)), -SIN_LIMIT, SIN_LIMIT)),
    v = dy,
    error = Infinity;
  // Solve on the visible hemisphere. A bounded Newton step also handles ink
  // near the silhouette, where a provisional untapered lookup may lie outside.
  for (let i = 0; i < 5; i++) {
    const sin = Math.sin(theta),
      cos = Math.cos(theta);
    v = dy - s.curve * (cos - cosA);
    const radius = s.radius * (1 + s.taper * v);
    error = radius * sin - dx;
    if (Math.abs(error) < 0.0001) break;
    const slope = radius * cos + s.radius * s.taper * s.curve * sin * sin;
    theta = clamp(theta - error / slope, -LIMIT, LIMIT);
  }
  if (Math.abs(error) > 0.001) return null;
  const normal = Math.cos(theta),
    edge = Math.min(1, Math.max(0, (normal - COS_LIMIT) / 0.18));
  return { u: s.radius * (theta - s.angle), v, coverage: edge * edge * (3 - 2 * edge) * (0.78 + 0.22 * normal) };
}
// Preserve reflected highlights and skin detail above the pigment. Working in
// multiply also keeps the original painted folds/shadows and underlying tone.
export function tattooInkTransmission(light: number, surrounding: number) {
  const highlight = Math.max(0, Math.min(1, (light - surrounding) / 48));
  return (0.82 + 0.12 * Math.sqrt(Math.max(0, Math.min(1, light / 255)))) * (1 - 0.32 * highlight);
}

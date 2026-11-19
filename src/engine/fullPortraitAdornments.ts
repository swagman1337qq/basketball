import { FULL_SIZE as W, type FullPortraitSettings } from './fullPortraits';
import { portraitLandmarks, fullClamp, type fullWarp } from './fullPortraitPainter';
import { tattooSurface, tattooSurfacePoint, tattooSurfaceSample, tattooInkTransmission, type TattooSurface } from './portraitTattooSurface';
type Warp = ReturnType<typeof fullWarp>;
let scratch: HTMLCanvasElement | null = null,
  output: HTMLCanvasElement | null = null,
  inkScratch: HTMLCanvasElement | null = null,
  inkOutput: HTMLCanvasElement | null = null;
function layer(
  ctx: CanvasRenderingContext2D,
  warp: Warp,
  draw: (c: CanvasRenderingContext2D) => void,
  skin?: Uint8Array,
  multiply = false,
) {
  const doc = ctx.canvas.ownerDocument;
  if (!doc) return;
  // Ink uses filtered bitmap stamps; keep its raster context separate from
  // the small vector metal details so one cannot change the other's raster state.
  let sourceCanvas = multiply ? inkScratch : scratch,
    targetCanvas = multiply ? inkOutput : output;
  if (!sourceCanvas) {
    sourceCanvas = doc.createElement('canvas');
    targetCanvas = doc.createElement('canvas');
    sourceCanvas.width = sourceCanvas.height = targetCanvas.width = targetCanvas.height = W;
    if (multiply) {
      inkScratch = sourceCanvas;
      inkOutput = targetCanvas;
    } else {
      scratch = sourceCanvas;
      output = targetCanvas;
    }
  }
  const c = sourceCanvas.getContext('2d', { willReadFrequently: true })!,
    o = targetCanvas!.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, W);
  c.save();
  draw(c);
  c.restore();
  const src = c.getImageData(0, 0, W, W).data,
    img = o.createImageData(W, W),
    dst = img.data,
    skinPixels = multiply ? ctx.getImageData(0, 0, W, W).data : null;
  const light = (x: number, y: number) => {
    const i = (Math.max(0, Math.min(W - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 4;
    return skinPixels![i] * 0.2126 + skinPixels![i + 1] * 0.7152 + skinPixels![i + 2] * 0.0722;
  };
  let left = W,
    right = -1,
    top = W,
    bottom = -1;
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++)
      if (src[(y * W + x) * 4 + 3]) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  let mx = 0,
    my = 0;
  for (let i = 0; i < warp.dx.length; i++) {
    mx = Math.max(mx, Math.abs(warp.dx[i]));
    my = Math.max(my, Math.abs(warp.dy[i]));
  }
  left = Math.max(0, Math.floor(left - mx - 2));
  right = Math.min(W - 1, Math.ceil(right + mx + 2));
  top = Math.max(0, Math.floor(top - my - 2));
  bottom = Math.min(W - 1, Math.ceil(bottom + my + 2));
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++) {
      const [dX, dY] = warp.offset(x, y),
        sx = x + dX,
        sy = y + dY;
      if (sx < 0 || sx > W - 1 || sy < 0 || sy > W - 1) continue;
      const ix = Math.floor(sx),
        iy = Math.floor(sy),
        fx = sx - ix,
        fy = sy - iy,
        x1 = Math.min(W - 1, ix + 1),
        y1 = Math.min(W - 1, iy + 1),
        a = iy * W + ix,
        b = iy * W + x1,
        c = y1 * W + ix,
        d = y1 * W + x1,
        wa = (1 - fx) * (1 - fy) * (skin ? skin[a] : 1),
        wb = fx * (1 - fy) * (skin ? skin[b] : 1),
        wc = (1 - fx) * fy * (skin ? skin[c] : 1),
        wd = fx * fy * (skin ? skin[d] : 1),
        aa = src[a * 4 + 3] * wa,
        ab = src[b * 4 + 3] * wb,
        ac = src[c * 4 + 3] * wc,
        ad = src[d * 4 + 3] * wd,
        alpha = aa + ab + ac + ad,
        di = (y * W + x) * 4;
      if (alpha <= 0) continue;
      for (let k = 0; k < 3; k++)
        dst[di + k] = (src[a * 4 + k] * aa + src[b * 4 + k] * ab + src[c * 4 + k] * ac + src[d * 4 + k] * ad) / alpha;
      dst[di + 3] =
        alpha *
        (skinPixels ? tattooInkTransmission(light(x, y), (light(x - 2, y) + light(x + 2, y) + light(x, y - 2) + light(x, y + 2)) / 4) : 1);
    }
  o.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = multiply ? 'multiply' : 'source-over';
  ctx.drawImage(targetCanvas!, 0, 0);
  ctx.restore();
}
function shape(c: CanvasRenderingContext2D, id: string, x: number, y: number, size: number, text: string) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  c.lineWidth = 0.12;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const line = (points: number[][], close = false, fill = false) => {
    c.beginPath();
    points.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b)));
    if (close) c.closePath();
    if (fill) c.fill();
    else c.stroke();
  };
  const circle = (a: number, b: number, r: number, fill = false) => {
    c.beginPath();
    c.arc(a, b, r, 0, Math.PI * 2);
    if (fill) c.fill();
    else c.stroke();
  };
  if (id === 'star' || id === 'design' || id === 'spark') {
    const n = id === 'spark' ? 4 : 5;
    line(
      Array.from({ length: n * 2 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / n,
          r = i % 2 ? 0.38 : 1;
        return [Math.cos(a) * r, Math.sin(a) * r];
      }),
      true,
      true,
    );
  } else if (id === 'cross') {
    line([
      [0, -1],
      [0, 1],
    ]);
    line([
      [-0.65, -0.35],
      [0.65, -0.35],
    ]);
  } else if (id === 'bolt')
    line(
      [
        [0.15, -1],
        [-0.6, 0.15],
        [-0.05, 0.12],
        [-0.2, 1],
        [0.65, -0.25],
        [0.05, -0.2],
      ],
      true,
      true,
    );
  else if (id === 'heart') {
    c.beginPath();
    c.moveTo(0, 0.95);
    c.bezierCurveTo(-1.5, -0.1, -0.8, -1.4, 0, -0.6);
    c.bezierCurveTo(0.8, -1.4, 1.5, -0.1, 0, 0.95);
    c.fill();
  } else if (id === 'diamond')
    line(
      [
        [0, -1],
        [0.7, 0],
        [0, 1],
        [-0.7, 0],
      ],
      true,
    );
  else if (id === 'dots') {
    for (let i = -1; i <= 1; i++) circle(i * 0.65, 0, 0.16, true);
  } else if (id === 'tear') {
    c.beginPath();
    c.moveTo(0, -1);
    c.bezierCurveTo(-0.35, -0.3, -0.8, 0.8, 0, 1);
    c.bezierCurveTo(0.8, 0.8, 0.35, -0.3, 0, -1);
    c.fill();
  } else if (id === 'crescent') {
    c.beginPath();
    c.arc(0, 0, 0.9, Math.PI * 0.25, Math.PI * 1.75);
    c.bezierCurveTo(-0.1, -0.35, -0.1, 0.35, 0.64, 0.64);
    c.closePath();
    c.fill();
  } else if (id === 'script' || id === 'numerals') {
    c.font = (id === 'script' ? 'italic ' : '') + 'bold .75px serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text || 'VII', 0, 0, 2.7);
  } else if (id === 'rose' || id === 'flower') {
    for (let i = 0; i < (id === 'rose' ? 5 : 6); i++) {
      const a = (i * Math.PI * 2) / (id === 'rose' ? 5 : 6);
      circle(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.43);
    }
    circle(0, 0, 0.22);
    line([
      [0, 0.7],
      [0, 1.35],
      [0.5, 1.05],
    ]);
    if (id === 'rose')
      line([
        [0, 0.85],
        [-0.5, 0.62],
        [-0.2, 1.05],
      ]);
  } else if (id === 'wings' || id === 'swallow') {
    for (const s of [-1, 1]) {
      line([
        [0, 0.2],
        [s * 0.45, -0.65],
        [s * 1.3, -1],
        [s * 1.05, -0.3],
        [s * 0.7, 0.2],
        [0, 0.35],
      ]);
      line([
        [s * 0.4, -0.05],
        [s * 1.1, -0.6],
      ]);
    }
    if (id === 'swallow')
      line([
        [0, 0.1],
        [0, 0.65],
        [-0.3, 1],
        [0, 0.8],
        [0.3, 1],
      ]);
  } else if (id === 'geometric') {
    line(
      [
        [0, -1],
        [0.95, 0.7],
        [-0.95, 0.7],
      ],
      true,
    );
    line(
      [
        [0, 1],
        [-0.95, -0.7],
        [0.95, -0.7],
      ],
      true,
    );
    circle(0, 0, 0.38);
  } else if (id === 'crown')
    line(
      [
        [-1, 0.6],
        [-1, -0.5],
        [-0.4, 0],
        [0, -1],
        [0.4, 0],
        [1, -0.5],
        [1, 0.6],
      ],
      true,
    );
  else if (id === 'wave') {
    for (let j = -1; j <= 1; j++)
      line(
        Array.from({ length: 15 }, (_, i) => {
          const x = -1 + i / 7;
          return [x, Math.sin(x * 3) * 0.18 + j * 0.4];
        }),
      );
  } else if (id === 'music') {
    line([
      [-0.45, 0.7],
      [-0.45, -0.6],
      [0.6, -0.85],
      [0.6, 0.4],
    ]);
    circle(-0.65, 0.7, 0.24, true);
    circle(0.4, 0.4, 0.24, true);
    line([
      [-0.45, -0.3],
      [0.6, -0.55],
    ]);
  } else if (id === 'bands') {
    for (let i = -1; i <= 1; i++)
      line([
        [-1, i * 0.35],
        [1, i * 0.35],
      ]);
  }
  c.restore();
}
let stamp: HTMLCanvasElement | null = null,
  curved: HTMLCanvasElement | null = null;
function surfaceTattoo(ctx: CanvasRenderingContext2D, s: TattooSurface, id: string, size: number, text: string, ink: number[]) {
  const D = 128,
    C = D / 2;
  if (!stamp) {
    stamp = ctx.canvas.ownerDocument.createElement('canvas');
    stamp.width = stamp.height = D;
    curved = ctx.canvas.ownerDocument.createElement('canvas');
    curved.width = curved.height = W;
  }
  const c = stamp.getContext('2d', { willReadFrequently: true })!,
    out = curved!.getContext('2d')!;
  c.clearRect(0, 0, D, D);
  c.fillStyle = c.strokeStyle = '#000';
  // A tiny diffusion in source-skin coordinates, not a screen-space glow.
  c.filter = 'blur(0.35px)';
  shape(c, id, C, C, size, text);
  const source = c.getImageData(0, 0, D, D).data;
  let u0 = D,
    u1 = -1,
    v0 = D,
    v1 = -1;
  for (let y = 0; y < D; y++)
    for (let x = 0; x < D; x++)
      if (source[(y * D + x) * 4 + 3]) {
        u0 = Math.min(u0, x);
        u1 = Math.max(u1, x);
        v0 = Math.min(v0, y);
        v1 = Math.max(v1, y);
      }
  if (u1 < u0) return;
  u0 -= C + 1;
  u1 -= C - 1;
  v0 -= C + 1;
  v1 -= C - 1;
  // Include the frontmost point of the cylinder as well as its corners.
  const points = [u0, u1, Math.max(u0, Math.min(u1, -s.angle * s.radius))].flatMap(u => [v0, v1].map(v => tattooSurfacePoint(s, u, v))),
    left = Math.max(0, Math.floor(Math.min(...points.map(q => q[0])) - 2)),
    top = Math.max(0, Math.floor(Math.min(...points.map(q => q[1])) - 2)),
    width = Math.min(W - left, Math.ceil(Math.max(...points.map(q => q[0])) + 2) - left),
    height = Math.min(W - top, Math.ceil(Math.max(...points.map(q => q[1])) + 2) - top);
  if (width <= 0 || height <= 0) return;
  const image = out.createImageData(width, height),
    dst = image.data;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const q = tattooSurfaceSample(s, x + left, y + top);
      if (!q) continue;
      const sx = q.u + C,
        sy = q.v + C;
      if (sx < 0 || sx >= D - 1 || sy < 0 || sy >= D - 1) continue;
      const ix = Math.floor(sx),
        iy = Math.floor(sy),
        fx = sx - ix,
        fy = sy - iy,
        a = (iy * D + ix) * 4 + 3,
        alpha = (source[a] * (1 - fx) + source[a + 4] * fx) * (1 - fy) + (source[a + D * 4] * (1 - fx) + source[a + D * 4 + 4] * fx) * fy,
        i = (y * width + x) * 4;
      dst[i] = ink[0];
      dst[i + 1] = ink[1];
      dst[i + 2] = ink[2];
      dst[i + 3] = alpha * q.coverage;
    }
  out.putImageData(image, left, top);
  ctx.drawImage(curved!, left, top, width, height, left, top, width, height);
}
export function fullPortraitTattoos(ctx: CanvasRenderingContext2D, p: FullPortraitSettings, warp: Warp, skin?: Uint8Array) {
  if (p.faceTattoo === 'none' && p.tattoo === 'none') return;
  const ink = { black: [38, 35, 31], blue: [35, 56, 70], red: [112, 55, 53] }[p.tattooInk] || [38, 35, 31];
  layer(
    ctx,
    warp,
    c => {
      c.globalAlpha = p.tattooOpacity;
      if (p.faceTattoo !== 'none') {
        surfaceTattoo(c, tattooSurface(p), p.faceTattoo, 6 + p.faceTattooSize * 6, p.faceTattooText, ink);
      }
      if (p.tattoo !== 'none')
        for (const side of p.tattooPlace === 'wrap' ? [-1, 1] : [p.tattooPlace === 'left' ? -1 : p.tattooPlace === 'front' ? 0 : 1]) {
          surfaceTattoo(
            c,
            tattooSurface(p, true, side),
            p.tattoo,
            10 + p.neckTattooSize * 12,
            p.tattoo === 'numerals' ? 'XIII' : p.neckTattooText,
            ink,
          );
        }
    },
    skin,
    true,
  );
}
const COLORS: Record<string, string> = { diamond: '#e8e8e1', gold: '#d3ae61', silver: '#c5cccf', black: '#292521', roseGold: '#cd9d8c' };
export function necklaceDrape(p: FullPortraitSettings, skin?: Uint8Array, lower = 0) {
  const f = portraitLandmarks(p.base),
    lefts: number[] = [],
    rights: number[] = [];
  if (skin)
    for (let y = f.chin + 2; y <= f.chin + 14; y += 3) {
      let left = W,
        right = -1;
      for (let x = f.cx - 65; x <= f.cx + 65; x++)
        if (skin[y * W + x]) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      if (right - left > 55) {
        lefts.push(left);
        rights.push(right);
      }
    }
  lefts.sort((a, b) => a - b);
  rights.sort((a, b) => a - b);
  const cx = fullClamp(lefts.length ? (lefts[lefts.length >> 1] + rights[rights.length >> 1]) / 2 : f.cx, f.cx - 5, f.cx + 5),
    half = fullClamp(lefts.length ? (rights[rights.length >> 1] - lefts[lefts.length >> 1]) / 2 + 4 : 55, 48, 62),
    bottom = f.chin + 46 + lower,
    sag = 55 + lower;
  return Array.from({ length: 49 }, (_, i) => {
    const u = i / 24 - 1;
    return [cx + half * u, bottom - (sag * (Math.cosh(1.2 * u) - 1)) / (Math.cosh(1.2) - 1)];
  });
}
export function fullPortraitJewelry(ctx: CanvasRenderingContext2D, p: FullPortraitSettings, warp: Warp, skin?: Uint8Array) {
  const f = portraitLandmarks(p.base),
    metal = COLORS[p.metal] || COLORS.silver;
  const dot = (c: CanvasRenderingContext2D, x: number, y: number, r = 1.5) => {
    c.fillStyle = '#3c3027';
    c.beginPath();
    c.arc(x, y, r + 0.55, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = metal;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff8df';
    c.beginPath();
    c.arc(x - 0.4, y - 0.5, 0.45, 0, Math.PI * 2);
    c.fill();
  };
  const line = (c: CanvasRenderingContext2D, pts: number[][], width = 1.25) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#3c3027';
    c.lineWidth = width + 0.8;
    c.stroke();
    c.strokeStyle = metal;
    c.lineWidth = width;
    c.stroke();
  };
  const ring = (c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, horseshoe = false) => {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, horseshoe ? 0.15 : 0, horseshoe ? Math.PI - 0.15 : Math.PI * 2);
    c.strokeStyle = '#3c3027';
    c.lineWidth = 2.1;
    c.stroke();
    c.strokeStyle = metal;
    c.lineWidth = 1.2;
    c.stroke();
  };
  const on = (x: number, y: number) => !skin || !!skin[Math.round(y) * W + Math.round(x)];
  const nearby = (x: number, y: number, r = 4): number[] | null => {
    if (on(x, y)) return [x, y];
    let best: number[] | null = null,
      d = Infinity;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy < d && on(x + dx, y + dy)) {
          best = [x + dx, y + dy];
          d = dx * dx + dy * dy;
        }
    return best;
  };
  if (p.necklace !== 'none')
    layer(
      ctx,
      warp,
      c => {
        const pts = necklaceDrape(p, skin);
        line(c, pts, p.necklace === 'rope' ? 2.5 : 1.3);
        if (p.necklace === 'beads') for (let i = 0; i < pts.length; i += 2) dot(c, pts[i][0], pts[i][1], 1.8);
        if (p.necklace === 'double') line(c, necklaceDrape(p, skin, 6), 1.2);
        const [x, bottom] = pts[24],
          y = bottom + 7;
        if (['pendant', 'cross', 'tags'].includes(p.necklace)) ring(c, x, bottom + 2, 1.3, 2);
        if (p.necklace === 'pendant') {
          ring(c, x, y, 4, 5);
          dot(c, x, y, 2.3);
        }
        if (p.necklace === 'cross') {
          line(
            c,
            [
              [x, y - 4],
              [x, y + 8],
            ],
            2,
          );
          line(
            c,
            [
              [x - 4, y + 1],
              [x + 4, y + 1],
            ],
            2,
          );
        }
        if (p.necklace === 'tags')
          for (const dx of [-2, 2]) {
            c.fillStyle = metal;
            c.strokeStyle = '#3c3027';
            c.lineWidth = 0.8;
            c.beginPath();
            c.rect(x + dx - 2, y - 2, 4, 9);
            c.fill();
            c.stroke();
          }
      },
      skin,
    );
  if (
    p.earrings === 'none' &&
    p.cartilage === 'none' &&
    p.noseRing === 'none' &&
    p.lipRing === 'none' &&
    p.browPiercing === 'none' &&
    !p.browRing
  )
    return;
  layer(ctx, warp, c => {
    const sides = p.earrings.endsWith('2') ? [-1, 1] : [p.earSide === 'right' ? 1 : -1];
    for (const s of sides) {
      const ear = nearby(f.cx + s * 61, f.nose + 4, 5);
      if (!ear) continue;
      const [x, y] = ear;
      if (p.earrings.startsWith('hoop')) ring(c, x, y + 4, 3.4, 5);
      else if (p.earrings.startsWith('huggie')) ring(c, x, y + 1.4, 2, 3);
      else if (p.earrings.startsWith('bar')) {
        line(
          c,
          [
            [x - 2.5, y],
            [x + 2.5, y],
          ],
          1.6,
        );
      } else if (p.earrings.startsWith('drop')) {
        dot(c, x, y);
        line(
          c,
          [
            [x, y + 1],
            [x, y + 9],
          ],
          0.8,
        );
        dot(c, x, y + 11, 2.2);
      } else if (p.earrings.startsWith('stack')) {
        dot(c, x, y);
        dot(c, x + s * 2, y - 4, 1.25);
        ring(c, x, y + 4, 2.5, 3.6);
      } else if (p.earrings.startsWith('cuff')) {
        ring(c, x + s * 1.5, y - 7, 2, 3.2);
      } else if (p.earrings !== 'none') dot(c, x, y, 1.6);
    }
    if (p.cartilage !== 'none') {
      const s = p.earSide === 'right' ? 1 : -1,
        q = nearby(f.cx + s * 65, f.eye + 12, 5);
      if (q) {
        const [x, y] = q;
        if (p.cartilage === 'hoop') ring(c, x, y, 2, 3);
        else if (p.cartilage === 'industrial') {
          line(
            c,
            [
              [x - s * 2, y - 5],
              [x + s * 2, y + 4],
            ],
            1,
          );
          dot(c, x - s * 2, y - 5, 1);
          dot(c, x + s * 2, y + 4, 1);
        } else {
          dot(c, x, y, 1.1);
          if (p.cartilage === 'double') dot(c, x + s * 1.5, y + 4, 1.1);
        }
      }
    }
    if (p.noseRing !== 'none') {
      const s = p.noseSide === 'left' ? -1 : 1,
        nostril = nearby(f.cx + s * 12, f.nose, 3);
      if (p.noseRing === 'septum' || p.noseRing === 'horseshoe') ring(c, f.cx, f.nose + 4, 3.4, 2.8, p.noseRing === 'horseshoe');
      else if (nostril) {
        const [x, y] = nostril;
        if (p.noseRing === 'stud' || p.noseRing === 'doubleStud') {
          dot(c, x, y, 1.3);
          if (p.noseRing === 'doubleStud') dot(c, x + s * 3, y - 1.8, 1);
        } else {
          ring(c, x, y + 1, 2.4, 3.3);
          if (p.noseRing === 'doubleRing') ring(c, x + s * 3, y + 0.4, 2.3, 3.1);
        }
      }
    }
    if (p.lipRing !== 'none') {
      const s = p.lipSide === 'left' ? -1 : 1,
        x = f.cx + s * 12,
        y = f.mouth + 3;
      if (p.lipRing === 'labret') dot(c, f.cx, f.mouth + 10, 1.3);
      else if (p.lipRing === 'medusa') dot(c, f.cx, f.mouth - 6, 1.25);
      else if (p.lipRing === 'vertical') {
        dot(c, f.cx, f.mouth + 2, 1.2);
        dot(c, f.cx, f.mouth + 10, 1.2);
      } else if (p.lipRing === 'snakeBites') {
        ring(c, f.cx - 12, y, 2, 3.2);
        ring(c, f.cx + 12, y, 2, 3.2);
      } else ring(c, x, y, 2.1, 3.4);
    }
    const brow = p.browPiercing === 'none' && p.browRing ? 'hoop' : p.browPiercing;
    if (brow !== 'none') {
      const s = p.browSide === 'left' ? -1 : 1,
        x = f.cx + s * 35,
        y = f.brow + 1;
      if (brow === 'hoop') ring(c, x, y, 2.3, 3.3);
      else
        for (let j = 0; j < (brow === 'double' ? 2 : 1); j++) {
          line(
            c,
            [
              [x + s * j * 5, y - 3],
              [x + s * j * 5, y + 3],
            ],
            0.8,
          );
          dot(c, x + s * j * 5, y - 3, 1.1);
          dot(c, x + s * j * 5, y + 3, 1.1);
        }
    }
  });
}

import { FULL_SIZE as W, type FullPortraitSettings } from './fullPortraits';
import { portraitLandmarks, type fullWarp } from './fullPortraitPainter';
type Warp = ReturnType<typeof fullWarp>;
let scratch: HTMLCanvasElement | null = null,
  output: HTMLCanvasElement | null = null;
function layer(
  ctx: CanvasRenderingContext2D,
  warp: Warp,
  draw: (c: CanvasRenderingContext2D) => void,
  skin?: Uint8Array,
  multiply = false,
) {
  const doc = ctx.canvas.ownerDocument;
  if (!doc) return;
  if (!scratch) {
    scratch = doc.createElement('canvas');
    output = doc.createElement('canvas');
    scratch.width = scratch.height = output.width = output.height = W;
  }
  const c = scratch.getContext('2d', { willReadFrequently: true })!,
    o = output!.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, W);
  c.save();
  draw(c);
  c.restore();
  const src = c.getImageData(0, 0, W, W).data,
    img = o.createImageData(W, W),
    dst = img.data;
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
      dst[di + 3] = alpha;
    }
  o.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = multiply ? 'multiply' : 'source-over';
  ctx.drawImage(output!, 0, 0);
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
export function fullPortraitTattoos(ctx: CanvasRenderingContext2D, p: FullPortraitSettings, warp: Warp, skin?: Uint8Array) {
  if (p.faceTattoo === 'none' && p.tattoo === 'none') return;
  const f = portraitLandmarks(p.base),
    ink = { black: '#26231f', blue: '#233846', red: '#703735' }[p.tattooInk] || '#26231f';
  layer(
    ctx,
    warp,
    c => {
      c.fillStyle = c.strokeStyle = ink;
      c.globalAlpha = p.tattooOpacity;
      if (p.faceTattoo !== 'none') {
        const places: Record<string, number[]> = {
            leftCheek: [f.cx - 40, f.nose + 8],
            rightCheek: [f.cx + 40, f.nose + 8],
            leftEye: [f.cx - 34, f.eye + 17],
            rightEye: [f.cx + 34, f.eye + 17],
            leftTemple: [f.cx - 53, f.eye - 8],
            rightTemple: [f.cx + 53, f.eye - 8],
            forehead: [f.cx, f.brow - 25],
          },
          [x, y] = places[p.faceTattooPlace] || places.leftCheek;
        shape(c, p.faceTattoo, x, y, 6 + p.faceTattooSize * 6, p.faceTattooText);
      }
      if (p.tattoo !== 'none')
        for (const side of p.tattooPlace === 'wrap' ? [-1, 1] : [p.tattooPlace === 'left' ? -1 : p.tattooPlace === 'front' ? 0 : 1]) {
          shape(
            c,
            p.tattoo,
            f.cx + side * 27,
            f.chin + 25,
            10 + p.neckTattooSize * 12,
            p.tattoo === 'numerals' ? 'XIII' : p.neckTattooText,
          );
        }
    },
    skin,
    true,
  );
}
const COLORS: Record<string, string> = { diamond: '#e8e8e1', gold: '#d3ae61', silver: '#c5cccf', black: '#292521', roseGold: '#cd9d8c' };
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
        const chain = (dy = 0) =>
          Array.from({ length: 33 }, (_, i) => {
            const t = i / 32;
            return [f.cx - 39 + t * 78, f.chin + 8 + Math.sin(t * Math.PI) * (42 + dy)];
          });
        const pts = chain();
        line(c, pts, p.necklace === 'rope' ? 2.5 : 1.3);
        if (p.necklace === 'beads') for (let i = 0; i < pts.length; i += 2) dot(c, pts[i][0], pts[i][1], 1.8);
        if (p.necklace === 'double') line(c, chain(7), 1.2);
        const x = f.cx,
          y = f.chin + 54;
        if (p.necklace === 'pendant') {
          ring(c, x, y, 4, 5);
          dot(c, x, y, 2.3);
        }
        if (p.necklace === 'cross') {
          line(
            c,
            [
              [x, y - 3],
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

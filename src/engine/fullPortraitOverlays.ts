import { type FullPortraitSettings, FULL_SIZE as W } from './fullPortraits';
import { fullClamp, fullWarp } from './fullPortraitPainter';

// Small accessories are inked over the painting at landmarks transformed by
// exactly the same bounded map as the face beneath them.
export function fullPortraitOverlays(
  ctx: CanvasRenderingContext2D,
  p: FullPortraitSettings,
  warp: ReturnType<typeof fullWarp>,
  age = 25,
  jersey: [string, string] = ['#764191', '#f5e9d3'],
  label?: { name?: string; num?: string },
  garment?: Float32Array,
  skin?: Uint8Array,
) {
  const at = (x: number, y: number) => warp.point(x * W, y * W);
  const path = (pts: number[][], close = false) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const v = at(x, y);
      if (i) ctx.lineTo(v[0], v[1]);
      else ctx.moveTo(v[0], v[1]);
    });
    if (close) ctx.closePath();
  };
  const stroke = (pts: number[][], color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    path(pts);
    ctx.stroke();
  };
  const onSkin = (x: number, y: number) => !skin || !!skin[Math.round(y * W) * W + Math.round(x * W)];
  const skinStroke = (pts: number[][], color: string, width: number) => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i];
      if ([0, 0.25, 0.5, 0.75, 1].every(t => onSkin(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))) stroke([a, b], color, width);
    }
  };
  const dot = (x: number, y: number, r: number, color: string) => {
    const v = at(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(v[0], v[1], r, 0, Math.PI * 2);
    ctx.fill();
  };
  const ring = (x: number, y: number, rx: number, ry: number, color: string, width = 1.4) => {
    const v = at(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(v[0], v[1], rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  };
  const metal = { diamond: '#e5e4dc', gold: '#d3ae61', silver: '#c5cccf', black: '#211e1b' }[p.metal] ?? '#c5cccf';
  ctx.save();
  if (p.ageAuto && age > 37) {
    const alpha = fullClamp((age - 37) / 65, 0, 0.65);
    for (let i = 0; i < 3; i++)
      skinStroke(
        [
          [0.407, 0.345 + i * 0.023],
          [0.453, 0.338 + i * 0.023],
          [0.5, 0.336 + i * 0.023],
          [0.548, 0.34 + i * 0.023],
          [0.589, 0.348 + i * 0.023],
        ],
        'rgba(61,35,24,' + alpha * 0.27 + ')',
        0.7,
      );
    for (const x of [0.344, 0.656])
      for (let j = 0; j < 2; j++)
        skinStroke(
          [
            [x, 0.476 + j * 0.012],
            [x + (x < 0.5 ? -0.024 : 0.024), 0.48 + j * 0.018],
          ],
          'rgba(61,35,24,' + alpha * 0.32 + ')',
          0.65,
        );
  }
  if (p.cleft)
    skinStroke(
      [
        [0.5, 0.742],
        [0.497, 0.752],
        [0.5, 0.761],
      ],
      'rgba(73,39,27,.25)',
      1,
    );
  if (p.mole && onSkin(0.572, 0.596)) dot(0.572, 0.596, 1.35, 'rgba(67,39,26,.78)');
  if (p.browSlit) {
    const sample = at(0.5, 0.512),
      pixel = ctx.getImageData(Math.round(sample[0]), Math.round(sample[1]), 1, 1).data,
      color = 'rgb(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ')';
    for (let i = 0; i < p.browSlit; i++)
      stroke(
        [
          [0.382 + i * 0.015, 0.408],
          [0.388 + i * 0.015, 0.437],
        ],
        color,
        1.8,
      );
  }
  if (p.eyes === 'deepset')
    for (const x of [0.419, 0.583])
      stroke(
        [
          [x - 0.034, 0.453],
          [x, 0.444],
          [x + 0.033, 0.454],
        ],
        'rgba(52,32,25,.12)',
        2,
      );
  if (p.headband !== 'none') {
    const colors: Record<string, string> = {
        team: jersey[0],
        team2: jersey[1],
        white: '#f0ece2',
        black: '#23201e',
        red: '#b8393a',
        navy: '#26354d',
        grey: '#9a9690',
      },
      color = colors[p.headband],
      h = p.bandKind === 'thin' ? 0.018 : p.bandKind === 'wide' ? 0.054 : 0.033;
    path(
      [
        [0.299, 0.384],
        [0.36, 0.374],
        [0.5, 0.368],
        [0.64, 0.374],
        [0.701, 0.384],
        [0.698, 0.384 + h],
        [0.64, 0.374 + h],
        [0.5, 0.368 + h],
        [0.36, 0.374 + h],
        [0.302, 0.384 + h],
      ],
      true,
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(29,24,20,.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    stroke(
      [
        [0.315, 0.388],
        [0.5, 0.376],
        [0.685, 0.388],
      ],
      'rgba(255,255,255,.18)',
      1,
    );
    if (p.bandKind === 'tied') {
      path(
        [
          [0.69, 0.399],
          [0.76, 0.416],
          [0.79, 0.459],
          [0.75, 0.445],
        ],
        true,
      );
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  if (p.glasses !== 'none') {
    const frame = { black: '#292421', tortoise: '#785331', metal: '#a6afb1', clear: 'rgba(218,231,232,.72)' }[p.frame] ?? '#292421',
      goggles = p.glasses === 'goggles',
      width = p.glasses === 'rimless' ? 0.7 : goggles ? 3.3 : 1.8;
    for (const x of [0.417, 0.585]) {
      const loc = at(x, 0.468),
        radius = p.glasses === 'round' ? 13 : 14.5;
      ctx.beginPath();
      if (p.glasses === 'round') ctx.ellipse(loc[0], loc[1], radius, 11.5, 0, 0, Math.PI * 2);
      else if (ctx.roundRect) ctx.roundRect(loc[0] - radius, loc[1] - 9.5, radius * 2, 19, goggles ? 7 : p.glasses === 'browline' ? 5 : 3);
      else ctx.rect(loc[0] - radius, loc[1] - 9.5, radius * 2, 19);
      ctx.fillStyle = goggles ? 'rgba(180,202,209,.13)' : 'rgba(190,210,215,.045)';
      ctx.fill();
      ctx.strokeStyle = frame;
      ctx.lineWidth = width;
      ctx.stroke();
      if (p.glasses === 'browline')
        stroke(
          [
            [x - 0.041, 0.442],
            [x + 0.041, 0.442],
          ],
          frame,
          2.8,
        );
    }
    stroke(
      [
        [0.462, 0.46],
        [0.5, 0.453],
        [0.54, 0.46],
      ],
      frame,
      width,
    );
    stroke(
      [
        [0.371, 0.455],
        [0.303, 0.442],
      ],
      frame,
      width,
    );
    stroke(
      [
        [0.63, 0.455],
        [0.699, 0.442],
      ],
      frame,
      width,
    );
  }
  if (p.earrings !== 'none') {
    for (const x of p.earrings.endsWith('2') ? [0.29, 0.711] : [0.29]) {
      if (p.earrings.startsWith('hoop')) ring(x, 0.592, 3.5, 5.4, metal);
      else {
        dot(x, 0.58, 2.3, '#392c23');
        dot(x, 0.58, 1.6, metal);
        dot(x - 0.002, 0.577, 0.6, '#fff9df');
      }
    }
  }
  if (p.noseRing === 'stud') dot(0.539, 0.571, 1.55, metal);
  if (p.noseRing === 'ring') ring(0.539, 0.575, 2.5, 3.4, metal, 1.1);
  if (p.noseRing === 'septum') ring(0.5, 0.579, 3.2, 2.8, metal, 1);
  if (p.lipRing === 'labret') dot(0.5, 0.686, 1.5, metal);
  if (p.lipRing === 'ring') ring(0.541, 0.665, 2.2, 3.4, metal, 1.1);
  if (p.browRing) ring(0.615, 0.421, 2.3, 3.2, metal, 1.2);
  if (p.tattoo === 'design') {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.008 : 0.018;
      return [0.565 + Math.cos(a) * r, 0.838 + Math.sin(a) * r];
    });
    path(pts, true);
    ctx.fillStyle = 'rgba(44,37,29,.66)';
    ctx.fill();
  } else if (p.tattoo === 'script') {
    stroke(
      [
        [0.557, 0.819],
        [0.548, 0.846],
        [0.559, 0.834],
        [0.566, 0.847],
        [0.572, 0.827],
        [0.576, 0.845],
        [0.588, 0.834],
      ],
      'rgba(44,37,29,.65)',
      0.85,
    );
  }
  if (p.undershirt !== 'none' && p.outfit === 'jersey') {
    const color = p.undershirt === 'team' ? jersey[0] : p.undershirt === 'white' ? '#e7e4dc' : '#2a2522';
    for (const side of [0, 1]) {
      const a = side ? 0.9 : 0.1,
        sgn = side ? -1 : 1;
      path(
        [
          [a, 0.924],
          [a + sgn * 0.045, 0.9],
          [a + sgn * 0.026, 1],
          [a - sgn * 0.035, 1],
        ],
        true,
      );
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(29,25,22,.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  if (p.shield !== 'none') {
    path(
      [
        [0.332, 0.48],
        [0.365, 0.454],
        [0.635, 0.454],
        [0.668, 0.48],
        [0.634, 0.746],
        [0.5, 0.773],
        [0.366, 0.746],
      ],
      true,
    );
    ctx.fillStyle = p.shield === 'clear' ? 'rgba(203,225,231,.12)' : 'rgba(26,28,31,.25)';
    ctx.fill();
    ctx.strokeStyle = p.shield === 'clear' ? 'rgba(216,233,235,.7)' : '#272b2e';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  if (p.outfit === 'jersey' && label?.num && garment && garment[Math.round(0.965 * W) * W + Math.round(0.5 * W)] > 0.7) {
    const pos = at(0.5, 0.965);
    ctx.font = '600 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = jersey[1];
    ctx.strokeStyle = 'rgba(24,21,19,.65)';
    ctx.lineWidth = 1.5;
    ctx.strokeText(label.num, pos[0], pos[1]);
    ctx.fillText(label.num, pos[0], pos[1]);
  }
  ctx.restore();
}

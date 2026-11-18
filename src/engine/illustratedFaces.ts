// Layered, generated illustration assets. Feature controls transform or select the
// actual painted parts; painting never changes a player or consumes gameplay RNG.
import { createElement as h } from 'react';
import { PORTRAIT_PARTS as ART } from './portraitParts';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rgb = (s: string) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
const hex = (a: number[]) =>
  '#' +
  a
    .map(v =>
      Math.round(clamp(v, 0, 1) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const mix = (a: string, b: string, t: number) => hex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i] * t));
const dark = (c: string, n: number) => mix(c, '#000000', n);
export const HEAD_ART = [
  ['auto', 'Generated'],
  ['oval', 'Oval'],
  ['round', 'Round'],
  ['long', 'Long'],
  ['square', 'Soft square'],
];
export const NOSE_ART = [
  ['auto', 'Generated'],
  ['narrow', 'Narrow bridge'],
  ['broad', 'Broad rounded'],
  ['straight', 'Straight'],
  ['low', 'Low bridge'],
  ['long', 'Long'],
  ['button', 'Rounded tip'],
];
export const MOUTH_ART = [
  ['auto', 'Generated'],
  ['medium', 'Medium'],
  ['full', 'Full'],
  ['thin', 'Thin'],
  ['slight', 'Slight smile'],
  ['smile', 'Open smile'],
  ['parted', 'Relaxed'],
];
const hairMap: Record<string, string> = {
  shaved: 'hairA0',
  crew: 'hairA1',
  buzz: 'hairA2',
  crop: 'hairA3',
  spiky: 'hairA4',
  shortAfro: 'hairA5',
  afro: 'hairA6',
  twists: 'hairA7',
  frohawk: 'hairA8',
  flattop: 'hairA9',
  hightop: 'hairA10',
  curlyTop: 'hairA11',
  curlyMop: 'hairA12',
  sidepart: 'hairA13',
  slick: 'hairA14',
  messy: 'hairA15',
  mohawk: 'hairB0',
  locsShort: 'hairB1',
  locsLong: 'hairB2',
  locsUp: 'hairB3',
  cornrows: 'hairB4',
  braids: 'hairB5',
  quiff: 'hairB6',
  undercut: 'hairB7',
  fringe: 'hairB8',
  curtains: 'hairB9',
  manbun: 'hairB10',
  long: 'hairB11',
  mullet: 'hairB12',
  shag: 'hairB13',
  bob: 'hairB14',
  longPart: 'hairB15',
  longCurls: 'hairB16',
  bun: 'hairB17',
  pixie: 'hairB18',
  waves: 'hairB19',
  fade: 'hairB20',
  caesar: 'hairB21',
};
const eyeMap = ['almond', 'round', 'hooded', 'monolid', 'deepset', 'downturned', 'upturned'];
const browMap = ['straight', 'soft', 'arched', 'angled', 'flat', 'bushy'];
const beardMap = [
  'stubble',
  'heavyStubble',
  'patchy',
  'mustache',
  'soulpatch',
  'chinpuff',
  'goatee',
  'circle',
  'vandyke',
  'chinstrap',
  'chinstrapMustache',
  'shortBeard',
  'fullBeard',
  'thickBeard',
];
const longHair = new Set(['locsLong', 'braids', 'long', 'longPart', 'longCurls', 'mullet', 'shag', 'bob']);
export const PAINTED_TEXTURE_CUTS = new Set(['crew', 'crop', 'fade', 'caesar', 'sidepart', 'messy', 'quiff', 'curlyTop', 'curlyMop']);

export function illustratedFaceSvg(f: any, jersey: [string, string], label?: { name?: string; num?: string }) {
  let serial = 0;
  const e = (tag: string, props: any, ...children: any[]) => h(tag, { key: serial++, ...props }, ...children);
  const nodes: any[] = [];
  const path = (d: string, fill: string, extra: any = {}) => e('path', { d, fill, ...extra });
  const line = (d: string, stroke: string, width = 0.45, opacity = 1) =>
    path(d, 'none', { stroke, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round', opacity });
  const dot = (cx: number, cy: number, r: number, fill: string, extra: any = {}) => e('circle', { cx, cy, r, fill, ...extra });
  const skin = mix(f.skin.color, '#ed9e63', 0.12 * (1 - f.skin.tone)),
    shadow = dark(skin, 0.29),
    light = mix(skin, '#ffddb5', 0.24);
  const lip = mix(skin, '#a24c48', f.fem ? 0.38 : 0.23);
  const filterId = (kind: string, c: string) => 'portrait-' + kind + '-' + c.slice(1);
  const skinId = filterId('skin', skin),
    eyeId = filterId('iris', f.eyes.hex),
    lipId = filterId('lip', lip),
    hairId = filterId('hair', f.hair.color),
    beardId = filterId('beard', f.facial.color),
    browId = filterId('brow', f.hair.natHex),
    dyeId = filterId('dye', f.hair.dyeHex || f.hair.color);
  const tint = (id: string, c: string, mode = 'skin') => {
    const values = rgb(c);
    return e(
      'filter',
      { id, x: '-5%', y: '-5%', width: '110%', height: '110%', colorInterpolationFilters: 'sRGB' },
      e(
        'feComponentTransfer',
        {},
        ...values.map((v, i) =>
          e(['feFuncR', 'feFuncG', 'feFuncB'][i], {
            type: 'table',
            tableValues: (mode === 'hair'
              ? [v * 0.28, v * 0.7, Math.min(1, v * 1.5 + 0.12), Math.min(1, v * 1.8 + 0.22), Math.min(1, v * 2 + 0.35)]
              : mode === 'eye'
                ? [0.025, v * 0.3, v * 0.6, v * 0.84, v, 0.82 + v * 0.15, 0.99]
                : [0.035 + v * 0.06, v * 0.34, v * 0.73, v, mode === 'lip' ? 0.97 : Math.min(1, v * 0.65 + 0.35)]
            ).join(' '),
          }),
        ),
      ),
    );
  };
  const hairlines: Record<string, string> = {
    straight: 'M31 34H69V150H31Z',
    shapeup: 'M29 34H71V150H29Z',
    peak: 'M31 32L46 32L50 38L54 32H69V150H31Z',
    round: 'M31 36Q50 29 69 36V150H31Z',
  };
  const hairline = hairlines[f.hair.hairline],
    hairlineId = 'portrait-line-' + f.hair.hairline;
  const defs = e(
    'defs',
    {},
    tint(skinId, skin),
    tint(lipId, lip, 'lip'),
    tint(eyeId, f.eyes.hex, 'iris'),
    tint(hairId, f.hair.color, 'hair'),
    tint(beardId, f.facial.color, 'hair'),
    tint(browId, f.hair.natHex, 'hair'),
    tint(dyeId, f.hair.dyeHex || f.hair.color, 'hair'),
    ...(hairline
      ? [e('clipPath', { id: hairlineId }, path('M-20 -40H120V150H-20Z ' + hairline, '#fff', { clipRule: 'evenodd', fillRule: 'evenodd' }))]
      : []),
  );
  const sprite = (key: string, x: number, y: number, w: number, ht: number, filter?: string, extra: any = {}, rect?: number[]) => {
    const art = ART[key];
    if (!art) throw Error('Missing portrait art ' + key);
    return e(
      'svg',
      {
        x,
        y,
        width: w,
        height: ht,
        viewBox: (rect || [0, 0, art.width, art.height]).join(' '),
        preserveAspectRatio: 'none',
        overflow: 'hidden',
        ...extra,
      },
      e('image', { href: art.url, width: art.width, height: art.height, ...(filter ? { filter: 'url(#' + filter + ')' } : {}) }),
    );
  };
  const H = f.head,
    n = f.nose,
    m = f.mouth,
    a = f.acc || {},
    marks = f.marks || {};
  const chin = 90 + (H.chin - 0.5) * 3,
    eyeY = 49,
    noseY = 66 + (n.len - 0.5) * 3,
    mouthY = 77 + (H.chin - 0.5) * 0.7;
  const neckW = 12 + (f.build || 0) * 1.5;
  // The jersey stays team-colored and editable separately from the facial artwork.
  nodes.push(path(`M${50 - neckW} 77L${50 - neckW - 1} 102L${51 + neckW} 102L${50 + neckW} 77Z`, skin));
  nodes.push(path(`M${50 + neckW - 2} 83L${50 + neckW} 101L49 103L54 89Z`, shadow));
  const shirt = a.undershirt ? (a.undershirt === 'team' ? dark(jersey[0], 0.2) : a.undershirt === 'black' ? '#242125' : '#efeae3') : skin;
  nodes.push(path('M37 94Q33 99 20 104Q7 110 2 140H98Q93 110 80 104Q67 99 63 94Z', shirt));
  nodes.push(path('M29 101L34 98Q50 119 66 98L72 101L81 140H19Z', jersey[0]));
  nodes.push(path('M35 99L50 111L65 99L64 103L50 116L36 103Z', jersey[1]));
  nodes.push(line('M29 101L22 140M72 101L79 140', jersey[1], 2));
  nodes.push(path('M31 105L36 109L32 134L27 140Z', dark(jersey[0], 0.23)), path('M68 106L66 120L74 140L76 140Z', dark(jersey[0], 0.2)));
  const inner: any[] = [];
  const style = f.hair.style,
    isLong = longHair.has(style);
  let hairKey = hairMap[style];
  // Closely related cuts use the painted texture variants. Structured braids and
  // locs keep their selected structure instead of becoming a different haircut.
  if (['crew', 'crop', 'fade', 'caesar'].includes(style))
    hairKey = f.hair.tex === 'coily' ? 'hairA11' : f.hair.tex === 'curly' ? 'hairA3' : f.hair.tex === 'wavy' ? 'hairB22' : hairMap[style];
  if (['sidepart', 'messy', 'quiff', 'curlyTop', 'curlyMop'].includes(style))
    hairKey = f.hair.tex === 'coily' ? 'hairA5' : f.hair.tex === 'curly' ? 'hairA12' : f.hair.tex === 'wavy' ? 'hairB23' : hairMap[style];
  // The cap's forehead opening is aligned independently of its crown/length.
  const hairW = (style === 'afro' ? 68 : style === 'mohawk' ? 48 : isLong ? 65 : 57) * (1 + (f.hair.len - 0.5) * 0.1);
  const hairH =
    style === 'afro'
      ? 54
      : isLong
        ? 87
        : ['bun', 'manbun', 'locsUp'].includes(style)
          ? 49
          : ['hightop', 'flattop', 'quiff', 'mohawk'].includes(style)
            ? 51
            : 43;
  const hairY = (isLong ? 9 : style === 'afro' ? 2 : 8) - (f.hair.recede || 0) * 5;
  const hairDraw = () => {
    const base = () =>
      sprite(hairKey, 50 - hairW / 2, hairY, hairW, hairH, hairId, {
        opacity: style === 'shaved' ? 0.3 : 1,
        transform: f.hair.part === -1 ? 'translate(100 0) scale(-1 1)' : undefined,
      });
    const parts = [base()];
    if (f.hair.dyeHex && f.hair.dyeKind !== 'full') {
      const x = f.hair.dyeKind === 'tips' ? 0 : 43,
        y = f.hair.dyeKind === 'tips' ? hairY + hairH * (isLong ? 0.7 : 0.05) : -30,
        w = f.hair.dyeKind === 'tips' ? 100 : 10,
        ht = f.hair.dyeKind === 'tips' ? hairH * 0.28 : 180;
      parts.push(
        e(
          'svg',
          { x, y, width: w, height: ht, viewBox: `${x} ${y} ${w} ${ht}`, overflow: 'hidden' },
          sprite(hairKey, 50 - hairW / 2, hairY, hairW, hairH, dyeId, {
            transform: f.hair.part === -1 ? 'translate(100 0) scale(-1 1)' : undefined,
          }),
        ),
      );
    }
    return e('g', hairline ? { clipPath: 'url(#' + hairlineId + ')' } : {}, ...parts);
  };
  if (hairKey && isLong) inner.push(hairDraw());
  const headChoice =
    H.style && H.style !== 'auto'
      ? ['oval', 'round', 'long', 'square'].indexOf(H.style)
      : H.w > 1.065 && H.h < 1.01
        ? 1
        : H.h > 1.035 && H.w < 1.015
          ? 2
          : H.sq > 0.67
            ? 3
            : 0;
  const headKey = 'head' + (Math.max(0, headChoice) + (f.fem ? 4 : 0));
  const baseW = [51, 57, 47, 54][Math.max(0, headChoice)],
    baseX = 50 - baseW / 2;
  const headArt = ART[headKey],
    top = 16,
    headHeight = chin - top;
  // Seven short strips preserve painted shading while the cheek/jaw/chin sliders
  // reshape the lower face. Slight overlap prevents seams at fractional zoom.
  for (let i = 0; i < 7; i++) {
    const t = i / 7,
      bottom = (i + 1) / 7,
      jaw = Math.max(0, (t - 0.43) / 0.57),
      tip = Math.max(0, (t - 0.78) / 0.22);
    const sx = 1 + (H.cheek - 1) * 1.4 * (1 - jaw) + (H.jaw - 0.87) * 0.7 * jaw + (H.chinW - 0.4) * 0.5 * tip;
    const sourceHeight = headArt.height / 7 + 3;
    inner.push(
      sprite(headKey, 50 - (baseW * sx) / 2, top + headHeight * t, baseW * sx, (headHeight * sourceHeight) / headArt.height, skinId, {}, [
        0,
        headArt.height * t,
        headArt.width,
        sourceHeight,
      ]),
    );
  }
  const earKey = 'featuresB' + (f.ears.out > 0.7 ? 14 : f.fem ? 15 : f.ears.size > 1.05 ? 13 : 12);
  const earW = baseW + 7 + f.ears.out * 2,
    earHt = 14 * f.ears.size;
  const earArt = ART[earKey];
  for (const s of [-1, 1])
    inner.push(
      sprite(earKey, 50 + s * (baseW / 2 + f.ears.out * 1.5) - (s < 0 ? 3.8 : 1), 47, 5.4 * f.ears.size, earHt, skinId, {}, [
        s < 0 ? 0 : earArt.width * 0.63,
        0,
        earArt.width * 0.37,
        earArt.height,
      ]),
    );
  const eyeIndex = f.fem && f.eyes.shape === 'almond' ? 7 : Math.max(0, eyeMap.indexOf(f.eyes.shape)),
    eyeKey = 'eyes' + eyeIndex;
  const eyeW = 39 * f.eyes.size,
    eyeH = (f.eyes.shape === 'round' ? 9 : f.eyes.shape === 'monolid' ? 6.3 : 8.2) * f.eyes.size * (f.expr === 'mean' ? 0.9 : 1);
  const eyeArt = ART[eyeKey],
    eyeHalf = eyeArt.width / 2;
  for (const s of [-1, 1]) {
    const x = 50 + s * 10.2 * f.eyes.spacing;
    for (const [part, filter] of [
      ['eyeSkin', skinId],
      ['eyeIris', eyeId],
      ['eyeInk', undefined],
    ] as const)
      inner.push(
        sprite(
          part + eyeIndex,
          x - eyeW / 4,
          eyeY - eyeH / 2,
          eyeW / 2,
          eyeH,
          filter,
          { transform: `rotate(${-s * f.eyes.tilt * 18} ${x} ${eyeY})` },
          [s < 0 ? 0 : eyeHalf, 0, eyeHalf, eyeArt.height],
        ),
      );
  }
  const browKey = 'features' + Math.max(0, browMap.indexOf(f.brows.shape)),
    bw = 39,
    bh = 2.5 * f.brows.thick;
  inner.push(sprite(browKey, 50 - bw / 2, eyeY - 5.3 - f.brows.gap, bw, bh, browId));
  for (let i = 0; i < (f.brows.slit || 0); i++) inner.push(line(`M65 ${eyeY - 7 - i * 0.2}l.3 3`, skin, 0.6));
  const noseNames = ['narrow', 'broad', 'straight', 'low', 'long', 'button'];
  const noseIndex =
    n.style && n.style !== 'auto'
      ? Math.max(0, noseNames.indexOf(n.style))
      : n.w > 0.68
        ? n.bridge < 0.4
          ? 3
          : 1
        : n.bridge > 0.7
          ? 0
          : n.len > 0.75
            ? 4
            : n.tip > 0.72
              ? 5
              : 2;
  const nw = 7.2 + 5 * n.w,
    nh = 13.5 + 4 * n.len;
  inner.push(
    sprite('featuresB' + noseIndex, 50 - nw / 2 + (n.crook || 0) * 0.6, noseY - nh + 1, nw, nh, skinId, {
      transform: `translate(${(n.bridge - 0.5) * 0.25} ${(n.tip - 0.5) * 0.5})`,
    }),
  );
  const mouthNames = ['medium', 'full', 'thin', 'slight', 'smile', 'parted'];
  const mouthIndex =
    m.style && m.style !== 'auto'
      ? Math.max(0, mouthNames.indexOf(m.style))
      : f.expr === 'smile'
        ? 4
        : ['slight', 'smirk'].includes(f.expr)
          ? 3
          : f.expr === 'relaxed'
            ? 5
            : m.upper + m.lower > 1.1
              ? 1
              : f.expr === 'mean'
                ? 2
                : 0;
  const mk = 'featuresB' + (mouthIndex + 6),
    ma = ART[mk],
    mw = 15 + 5 * m.w,
    upper = 2.1 + 2.2 * m.upper,
    lower = 2.7 + 2.5 * m.lower;
  inner.push(sprite(mk, 50 - mw / 2, mouthY - upper, mw, upper, lipId, {}, [0, 0, ma.width, ma.height * 0.43]));
  inner.push(sprite(mk, 50 - mw / 2, mouthY, mw, lower, lipId, {}, [0, ma.height * 0.43, ma.width, ma.height * 0.57]));
  const bi = beardMap.indexOf(f.facial.style);
  if (bi >= 0) {
    const small = bi === 3 || bi === 4 || bi === 5 || bi === 6 || bi === 8;
    const sizes: Record<number, number[]> = {
      3: [19, 5, mouthY - 7],
      4: [3, 2.4, mouthY + 6],
      5: [6, 3, chin - 4],
      6: [17, 10, mouthY + 5],
      8: [22, 19, mouthY - 5],
    };
    const [w, ht, y] = small ? sizes[bi] : [baseW * (0.9 + (H.jaw - 0.87) * 0.4), bi === 13 ? 38 : 33, mouthY - 16];
    inner.push(sprite('beard' + bi, 50 - w / 2, y, w, ht, beardId, { opacity: f.facial.density ?? 0.85 }));
  }
  if (hairKey) {
    if (isLong) inner.push(e('svg', { x: 0, y: 0, width: 100, height: 45, viewBox: '0 0 100 45', overflow: 'hidden' }, hairDraw()));
    else inner.push(hairDraw());
    const sideburn = 1.5 + (f.hair.sb || 0) * 7;
    for (const s of [-1, 1]) inner.push(sprite('hairA0', 50 + s * (baseW / 2 - 1.7) - 0.6, 49, 1.2, sideburn, hairId));
  }
  // Aging and marks are light accents over the illustration, not replacements for it.
  if (f.age.lines > 0.15) {
    for (let i = 0; i < 2; i++) inner.push(line(`M39 ${38 + i * 2}Q50 ${37.2 + i * 2} 61 ${38 + i * 2}`, shadow, 0.35, f.age.lines * 0.25));
    for (const s of [-1, 1]) {
      inner.push(line(`M${50 + s * 16.5} 50l${s * 2} 1M${50 + s * 16.5} 49l${s * 2} -.8`, shadow, 0.3, f.age.lines * 0.4));
      inner.push(line(`M${50 + s * 6} 53Q${50 + s * 11} 56 ${50 + s * 15} 53.5`, shadow, 0.35, (f.age.bags || 0) * 0.25));
    }
  }
  if (H.cleft) inner.push(line(`M50 ${chin - 4}v1.8`, shadow, 0.45, 0.7));
  if (marks.freckles) {
    for (let i = 0; i < 18; i++) {
      const s = i % 2 ? 1 : -1;
      inner.push(dot(50 + s * (7 + ((i * 7) % 10)), 56 + ((i * 11) % 7), 0.2 + marks.freckles * 0.08, shadow, { opacity: 0.45 }));
    }
  }
  if (marks.mole) inner.push(dot(50 + marks.mole[0] * 16, 55 + marks.mole[1] * 23, 0.42, dark(skin, 0.6)));
  if (marks.dimples && ['smile', 'slight'].includes(f.expr)) {
    for (const s of [-1, 1]) inner.push(line(`M${50 + s * (mw / 2 + 1)} ${mouthY}q${s * 0.5} 1 0 2`, shadow, 0.35, 0.6));
  }
  if (a.headband) {
    const c =
      a.headband.color === 'team'
        ? jersey[0]
        : a.headband.color === 'team2'
          ? jersey[1]
          : ({ white: '#f3ede4', black: '#1e1b21', red: '#bc2e32', navy: '#233b57', grey: '#8e9092' } as any)[a.headband.color] ||
            jersey[0];
    const ht = a.headband.kind === 'thin' ? 1.5 : a.headband.kind === 'wide' ? 4.5 : 3;
    inner.push(path(`M24 36Q50 33 76 36L76 ${36 + ht}Q50 ${34 + ht} 24 ${36 + ht}Z`, c));
    if (a.headband.kind === 'tied') inner.push(path('M74 37q7 0 9 9l-6 -3l-3 4Z', c));
  }
  const metal = (m: string) => (({ gold: '#d8ae57', silver: '#c3c6cc', diamond: '#e9f5ff', black: '#232023' }) as any)[m] || '#c3c6cc';
  if (a.earrings)
    for (const s of a.earrings.both ? [-1, 1] : [1]) {
      const x = 50 + s * (earW / 2 - 1.4),
        y = 60;
      if (a.earrings.kind === 'hoop') inner.push(dot(x, y + 1.2, 1.4, 'none', { stroke: metal(a.earrings.metal), strokeWidth: 0.5 }));
      else inner.push(dot(x, y, 0.65, metal(a.earrings.metal)));
    }
  if (a.glasses) {
    const col = ({ black: '#252023', tortoise: '#64412c', metal: '#b2a697', clear: '#d5d0c6' } as any)[a.glasses.color] || '#252023';
    for (const s of [-1, 1]) {
      const x = 50 + s * 10.2;
      inner.push(
        e(
          a.glasses.kind === 'round' ? 'ellipse' : 'rect',
          a.glasses.kind === 'round'
            ? {
                cx: x,
                cy: eyeY,
                rx: 8.4,
                ry: 6.1,
                fill: '#bed4df',
                fillOpacity: 0.1,
                stroke: col,
                strokeWidth: a.glasses.kind === 'rimless' ? 0.25 : 0.7,
              }
            : {
                x: x - 8.4,
                y: eyeY - 5,
                width: 16.8,
                height: 10,
                rx: a.glasses.kind === 'goggles' ? 3 : 1,
                fill: '#bed4df',
                fillOpacity: 0.1,
                stroke: col,
                strokeWidth: 0.7,
              },
        ),
      );
    }
    inner.push(line('M48 48Q50 47 52 48', col, 0.7));
  }
  if (a.shield)
    inner.push(
      path('M32 46Q50 39 68 46L64 66Q50 72 36 66Z', a.shield.kind === 'black' ? '#1c1920' : '#d7e8ed', {
        opacity: a.shield.kind === 'black' ? 0.85 : 0.32,
        stroke: '#7e8a91',
        strokeWidth: 0.6,
      }),
    );
  if (a.nose) {
    const x = a.nose.kind === 'septum' ? 50 : 50 + (a.nose.side || 1) * nw * 0.33;
    if (a.nose.kind === 'stud') inner.push(dot(x, noseY - 0.8, 0.4, metal(a.nose.metal)));
    else inner.push(line(`M${x - 1} ${noseY}q1 2 2 0`, metal(a.nose.metal), 0.5));
  }
  if (a.lip)
    inner.push(
      a.lip.kind === 'labret'
        ? dot(50 + (a.lip.side || 1) * 4, mouthY + lower + 0.7, 0.45, metal(a.lip.metal))
        : line(`M${50 + (a.lip.side || 1) * 5} ${mouthY + 1}q-1 3 1 3`, metal(a.lip.metal), 0.5),
    );
  if (a.brow) inner.push(line(`M${50 + a.brow.side * 16} 40v3`, metal(a.brow.metal), 0.55));
  nodes.push(e('g', { transform: `translate(50 ${eyeY}) scale(${H.w * 1.12} ${H.h * 1.12}) translate(-50 ${-eyeY})` }, ...inner));
  if (marks.tattoo)
    nodes.push(
      line(
        marks.tattoo.kind === 'script' ? 'M43 96q2 -2 3 0t4 0' : 'M43 94l1 2l2 0l-1.5 1.5l.5 2l-2 -1l-2 1l.5 -2l-1.5 -1.5l2 0Z',
        '#3b3939',
        0.45,
        0.7,
      ),
    );
  if (label?.name)
    nodes.push(
      e(
        'text',
        {
          x: 50,
          y: 125,
          textAnchor: 'middle',
          fontSize: 5,
          fontWeight: 700,
          fontFamily: 'Arial,sans-serif',
          fill: jersey[1],
          textLength: label.name.length > 12 ? 34 : undefined,
          lengthAdjust: 'spacingAndGlyphs',
        },
        label.name.toUpperCase(),
      ),
    );
  if (label?.num)
    nodes.push(
      e(
        'text',
        { x: 50, y: 133, textAnchor: 'middle', fontSize: 8, fontWeight: 700, fontFamily: 'Arial,sans-serif', fill: jersey[1] },
        String(label.num),
      ),
    );
  const frameTop = hairKey ? Math.min(-12, Math.floor(eyeY + (hairY - eyeY) * H.h * 1.12 - 3)) : -12;
  return e(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 ${frameTop} 100 ${138 - frameTop}`,
      width: '100%',
      height: '100%',
      style: { display: 'block' },
      'data-face-art': 'layered-illustration',
    },
    defs,
    ...nodes,
  );
}

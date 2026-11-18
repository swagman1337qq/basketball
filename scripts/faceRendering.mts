import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeFace, faceSvg, HAIR_STYLES, FACE_OPTS } from '../src/engine/faces';

const draw = (face: any, label?: { name?: string; num?: string }) => renderToStaticMarkup(faceSvg(face, ['#613487', '#f4e9ce'], label));
const base = { id: 310, race: 'black', age: 25, hgt: '6′5″', wt: 205, faceAncestry: { black: 0.5, asian: 0.5 } };
const freeze = (value: any) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
let count = 0,
  maxElements = 0,
  maxBytes = 0;
for (const [index, hair] of Object.keys(HAIR_STYLES).entries()) {
  for (const texture of ['straight', 'wavy', 'curly', 'coily']) {
    for (const [expr] of FACE_OPTS.expr) {
      const facial = FACE_OPTS.facial[(index + count) % FACE_OPTS.facial.length][0];
      const p = {
        ...base,
        id: 410 + index,
        age: index % 3 ? 23 : 65,
        fem: index % 4 === 0,
        faceX: {
          'hair.style': hair,
          'hair.tex': texture,
          'facial.style': facial,
          expr,
          'eyes.shape': FACE_OPTS.eyes[index % 7][0],
          'brows.shape': FACE_OPTS.brows[index % 6][0],
          'skin.tone': (index % 11) / 10,
        },
      };
      const face = freeze(makeFace(p, 79)),
        before = JSON.stringify(face);
      const svg = draw(face, { name: 'STARS', num: '88' });
      assert(svg.startsWith('<svg') && svg.includes('data-face-art="illustrated"'));
      assert(!/(?:NaN|Infinity|undefined)/.test(svg), hair + '/' + texture + '/' + expr);
      assert(!/<(?:image|filter|linearGradient|radialGradient|clipPath)\b/.test(svg), 'No image assets or per-instance SVG resources');
      assert(!/\bid=/.test(svg), 'Repeated faces cannot collide through shared SVG ids');
      for (const [, value] of svg.matchAll(/\b(?:r|rx|ry)="([^"]+)"/g)) assert(Number(value) > 0);
      assert(svg.includes('STARS') && svg.includes('>88</text>'), 'Branding and multi-digit numbers remain complete');
      assert.equal(JSON.stringify(face), before, 'Painting a cached face must not mutate its data');
      assert.equal(svg, draw(face, { name: 'STARS', num: '88' }), 'Painting is deterministic');
      const elements = (svg.match(/<(?:path|circle|ellipse|text)\b/g) || []).length;
      maxElements = Math.max(maxElements, elements);
      maxBytes = Math.max(maxBytes, svg.length);
      assert(elements < 650, 'Bound portrait DOM size even for intricate hairstyles');
      assert(svg.length < 160000, 'Bound vector size for dense hair styles');
      count++;
    }
  }
}

// A controlled change to any offered feature must still alter the actual painting.
const changes: Record<string, any[]> = {
  'head.w': [0.86, 1.14],
  'head.h': [0.92, 1.1],
  'head.cheek': [0.94, 1.06],
  'head.jaw': [0.7, 1],
  'head.chinW': [0.2, 0.56],
  'head.chin': [0, 1],
  'head.cleft': [false, true],
  'eyes.shape': ['monolid', 'round'],
  'eyes.color': ['blue', 'brown'],
  'eyes.size': [0.86, 1.14],
  'eyes.spacing': [0.9, 1.1],
  'eyes.tilt': [-0.14, 0.2],
  'brows.shape': ['flat', 'arched'],
  'brows.thick': [0.7, 2.1],
  'brows.slit': [0, 2],
  'nose.w': [0, 1],
  'nose.len': [0, 1],
  'nose.bridge': [0, 1],
  'nose.tip': [0, 1],
  'mouth.w': [0, 1],
  'mouth.upper': [0, 1],
  'mouth.lower': [0, 1],
  'ears.size': [0.82, 1.18],
  'ears.out': [0, 1],
  'skin.tone': [0, 1],
  'skin.under': ['olive', 'rosy'],
  build: [-1, 1],
  'hair.len': [0, 1],
  'hair.recede': [0, 1],
  'hair.sb': [0, 1],
  'hair.part': [-1, 1],
  'hair.grey': [0, 0.9],
  'hair.natural': ['black', 'red'],
  'facial.grey': [0, 0.9],
  'marks.freckles': [0, 1],
  'marks.mole': [null, [0.4, 0.5]],
  'marks.tattoo': [null, { kind: 'script', side: 1 }],
};
for (const [path, values] of Object.entries(changes)) {
  const images = values.map(value =>
    draw(
      makeFace(
        {
          ...base,
          faceX: {
            'hair.style': 'sidepart',
            'hair.hairline': 'natural',
            'hair.dye': null,
            'facial.style': 'shortBeard',
            'facial.density': 1,
            [path]: value,
          },
        },
        79,
      ),
    ),
  );
  assert.notEqual(images[0], images[1], 'Editor control remains visible: ' + path);
}
for (const [style] of FACE_OPTS.facial) {
  if (style === 'none') continue;
  const images = [0.4, 1].map(density => draw(makeFace({ ...base, faceX: { 'facial.style': style, 'facial.density': density } }, 79)));
  assert.notEqual(images[0], images[1], 'Thickness still affects ' + style);
}
const accessories = [
  { 'acc.headband': { color: 'team', kind: 'tied' } },
  { 'acc.earrings': { kind: 'hoop', both: true, metal: 'gold' } },
  { 'acc.glasses': { kind: 'browline', color: 'black' } },
  { 'acc.shield': { kind: 'clear' } },
  { 'acc.nose': { kind: 'septum', metal: 'silver' } },
  { 'acc.lip': { kind: 'ring', metal: 'gold', side: 1 } },
  { 'acc.brow': { metal: 'silver', side: -1 } },
  { 'acc.undershirt': 'black' },
];
const plain = draw(makeFace({ ...base, faceX: { 'acc.glasses': null, 'acc.shield': null } }, 79));
for (const edit of accessories)
  assert.notEqual(plain, draw(makeFace({ ...base, faceX: { 'acc.glasses': null, 'acc.shield': null, ...edit } }, 79)));
const specialName = draw(makeFace(base, 79), { name: 'A&B <Stars>', num: '00' });
assert(specialName.includes('A&amp;B &lt;STARS&gt;') && !specialName.includes('<Stars>'), 'Team labels remain escaped');
const f = makeFace(base, 79),
  data = JSON.stringify(f);
const random = Math.random;
Math.random = () => {
  throw new Error('Painting must not consume gameplay randomness');
};
draw(f);
Math.random = random;
assert.equal(JSON.stringify(f), data);
const row = renderToStaticMarkup(
  createElement('div', null, ...Array.from({ length: 12 }, (_, key) => createElement('span', { key }, faceSvg(f)))),
);
assert.equal((row.match(/data-face-art="illustrated"/g) || []).length, 12);
console.log(
  JSON.stringify({
    combinations: count,
    editorControls: Object.keys(changes).length,
    maxElements,
    maxBytes,
    faceDataHash: createHash('sha256').update(data).digest('hex'),
  }),
);
console.log(
  'PASS: illustrated portraits, feature controls, beard density, accessories, safe repeated SVGs, immutable data and rendering budget',
);

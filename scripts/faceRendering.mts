import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeFace, faceSvg } from '../src/engine/faces';
import {
  PORTRAITS,
  anotherPortrait,
  clearPortrait,
  portraitEditSnapshot,
  restorePortraitEdit,
  portraitElement,
  portraitForFace,
  selectPortrait,
} from '../src/engine/portraitCatalog';
import { FaceEditor } from '../src/ui/modals/FaceEditor';
import { mulberry32 } from '../src/engine/rng';

assert.equal(PORTRAITS.length, 96);
assert.equal(new Set(PORTRAITS.map(p => p.id)).size, 96);
assert.equal(PORTRAITS.filter(p => p.role === 'staff').length, 32);
assert.equal(PORTRAITS.filter(p => p.gender === 'woman').length, 16);
const files = new Map<string, Buffer>();
let bytes = 0;
function dimensions(b: Buffer): number[] {
  if (b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  assert(b[0] === 255 && b[1] === 216, 'Artwork must be a supported image');
  let at = 2;
  while (at < b.length) {
    while (b[at] === 255) at++;
    const marker = b[at++],
      size = b.readUInt16BE(at);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return [b.readUInt16BE(at + 5), b.readUInt16BE(at + 3)];
    at += size;
  }
  throw Error('JPEG dimensions missing');
}
for (const p of PORTRAITS) {
  if (!files.has(p.url)) {
    const b = readFileSync(fileURLToPath(p.url));
    files.set(p.url, b);
    bytes += b.length;
  }
  assert.deepEqual(dimensions(files.get(p.url)!), [p.width, p.height]);
  const [x, y, w, h] = p.crop;
  assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= p.width + 0.001 && y + h <= p.height + 0.001, p.id);
  const html = renderToStaticMarkup(portraitElement(p));
  assert.equal((html.match(/<image\b/g) || []).length, 1, 'Exactly one finished picture per portrait');
  assert(!/<(?:filter|path|circle|ellipse)\b|\btransform=/.test(html), 'No facial assembly, recoloring or distortion');
  assert.equal((html.match(/<clipPath\b/g) || []).length, 1, 'Only a rectangular atlas-cell crop is allowed');
  assert.equal((html.match(/<rect\b/g) || []).length, 1, 'No individual face regions are masked');
  assert(html.includes(p.url) && html.includes('viewBox="' + p.crop.join(' ') + '"'));
  assert(html.includes('preserveAspectRatio="xMidYMid meet"'), 'Keep the illustration proportions');
}
assert.equal(files.size, 6);
assert(bytes < 8 * 1024 * 1024);
const approved = PORTRAITS.find(p => p.id === 'approved-01')!;
assert.equal(
  createHash('sha256').update(files.get(approved.url)!).digest('hex'),
  '6ca3e609bd5db7f6042b492b20b3c6d6c8790b17e534e8f6555afa46527a1e2a',
  'The exact supplied artwork must remain unchanged',
);
const base: any = { id: 310, race: 'black', age: 25, hgt: "6'5", wt: 205, faceAncestry: { black: 0.5, asian: 0.5 } };
const f = makeFace(base, 79),
  before = JSON.stringify(f),
  first = portraitForFace(f);
const rng = Math.random;
Math.random = () => {
  throw Error('Portrait rendering cannot consume simulation randomness');
};
const draw = renderToStaticMarkup(faceSvg(f));
assert.equal(draw, renderToStaticMarkup(faceSvg(f)));
Math.random = rng;
assert.equal(JSON.stringify(f), before);
assert.equal(draw, renderToStaticMarkup(faceSvg(makeFace({ ...base, age: 89 }, 79))), 'Birthdays retain the same person');
assert.equal(
  draw,
  renderToStaticMarkup(
    faceSvg(makeFace({ ...base, faceX: { 'head.w': 1.14, 'eyes.size': 0.86, 'nose.w': 0, 'hair.style': 'bald', 'skin.tone': 0.9 } }, 79)),
  ),
  'Removed individual edits cannot deform a complete portrait',
);
assert.equal(
  draw,
  renderToStaticMarkup(faceSvg(f, ['#ff0000', '#00ff00'], { name: 'OTHER TEAM', num: '99' })),
  'Team changes cannot recolor or rebuild the portrait',
);
let samples = 0;
const seen = new Set<string>();
for (const race of ['black', 'dark', 'asian', 'white', 'brown'])
  for (const fem of [false, true])
    for (let id = 1; id <= 200; id++) {
      const face = makeFace({ id, race, fem, age: 30 }, 79);
      for (const context of ['player', 'staff'] as const) {
        const p = portraitForFace(face, context);
        assert.equal(p.gender, fem ? 'woman' : 'man');
        assert.equal(p.id, portraitForFace(face, context).id);
        if (context === 'staff') assert.equal(p.role, 'staff');
        seen.add(p.id);
        samples++;
      }
    }
assert(seen.size > 70, 'Defaults use a broad range of complete pictures');
const rnd = mulberry32(123);
for (const p of PORTRAITS) {
  const next = anotherPortrait(f, 'player', p.id, rnd);
  assert.notEqual(next.id, p.id);
}
const person: any = { ...base, faceImg: 'data:image/jpeg;base64,old', faceX: { ancestry: { black: 0.5, asian: 0.5 }, 'nose.w': 0.9 } };
const original = structuredClone(person),
  snapshot = portraitEditSnapshot(person);
assert(selectPortrait(person, 'approved-08'));
assert.equal(person.faceImg, undefined);
assert.equal(portraitForFace(makeFace(person, 79)).id, 'approved-08');
for (const key of ['id', 'race', 'age', 'faceAncestry'])
  assert.deepEqual(person[key], original[key], 'Portrait choice must not edit biography');
assert(!selectPortrait(person, 'missing-id'));
assert.equal(portraitForFace(makeFace(person, 79)).id, 'approved-08');
restorePortraitEdit(person, snapshot);
assert.deepEqual(person, original, 'Cancel restores uploaded art and all saved edits');
selectPortrait(person, 'approved-01');
clearPortrait(person);
assert.equal(person.faceImg, undefined);
assert.deepEqual(person.faceX, original.faceX);
assert.equal(portraitForFace(makeFace(person, 79)).id, first.id);
const vm: any = { face: () => f, faceEl: () => faceSvg(f), resetFace() {}, setState() {} };
const picker = renderToStaticMarkup(createElement(FaceEditor, { gm: vm, p: { ...base }, onClose() {} }));
assert(picker.includes('Choose portrait') && picker.includes('Upload JPG/PNG') && picker.includes('Approved portraits'));
assert(
  !picker.includes('type="range"') && !picker.includes('Eye size') && !picker.includes('Nose shape'),
  'Individual-feature controls are removed',
);
assert(picker.includes('Previous portrait page') && picker.includes('Next portrait page'));
console.log(
  JSON.stringify({
    portraits: PORTRAITS.length,
    sheets: files.size,
    artworkBytes: bytes,
    defaultSamples: samples,
    distinctDefaults: seen.size,
  }),
);
console.log(
  'PASS: exact supplied artwork, whole-image rendering, staff/player consistency, stable identities, selection/reroll/cancel, upload retention and complete portrait picker',
);

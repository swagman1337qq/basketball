import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import { makeFace, faceSvg } from '../src/engine/faces';
import { FACE_LOOK_KEYS, faceAncestry, generatedFaceAncestry, normalizeFaceAncestry, rerollFace } from '../src/engine/faceAncestry';
import { FaceEditor } from '../src/ui/modals/FaceEditor';
import { clonePlayer } from '../src/engine/godPlayer';
import { coachFaceData, CoachFace } from '../src/ui/CoachFace';
import { coachBioDraft, saveCoachBio } from '../src/ui/coachEditing';
import { staffOf } from '../src/engine/staff';
import { mulberry32 } from '../src/engine/rng';

const player = (id: number, race = 'black', age = 27) => ({ id, race, age, hgt: "6'5", wt: 205 });
const inherited = { black: 0.5, asian: 0.5 };
assert.deepEqual(faceAncestry({ race: 'black', mix: 'Asian' }), inherited);
assert.deepEqual(faceAncestry({ race: 'black', heritage: 'Black / East Asian' }), inherited);
assert.deepEqual(faceAncestry({ race: 'white', her: 'XN', mix: 'White' }), { brown: 0.5, white: 0.5 });
assert.deepEqual(faceAncestry({ race: 'black', her: 'XN', mix: 'African American' }), { brown: 0.5, black: 0.5 });
assert.deepEqual(
  faceAncestry({ race: 'brown', rep: 'JP', name: 'Unknown Person' }),
  { brown: 1 },
  'Names and passports do not determine ancestry',
);
assert.deepEqual(faceAncestry({ race: 'brown', mix: 'constructor' }), { brown: 1 });
assert.deepEqual(normalizeFaceAncestry({ black: 1e308, asian: 1e308, bogus: 100 }), inherited);
for (const bad of [null, [], {}, { asian: NaN, black: -1 }, { white: Infinity }, { asian: '50' }])
  assert.equal(normalizeFaceAncestry(bad), undefined);
assert.deepEqual(faceAncestry({ race: 'brown', faceAncestry: { black: 1, asian: 1 }, faceX: { ancestry: { white: 1 } } }), { white: 1 });

// Before-change fingerprints: the fix must not reroll unedited legacy heads, eyes, noses,
// hair, expressions or accessories. Only facial hair and new ancestry metadata may change.
const legacy = {
  white: 'cda3d031da8c083d28e144177f1c0692ecd7f10c346b8278970ff6d5c3274a06',
  black: 'bc0ec4975c96bb867bda087e29683e716e430a25d53e230dac716ec8bbacbc0c',
  dark: '57047152a6b4240d4f949878718f4da946934e5d79d26ab04f22b1922f0ca348',
  asian: 'd8d1508138a2f9b3b38e34c8120026fc92533bc14b90bb941d2b77d7e9fb2afb',
  brown: 'bae04b7a545b400cd851b6f184fe9d738654300a3a50e5e03b6141c9acf87835',
};
for (const race of FACE_LOOK_KEYS) {
  const faces = Array.from({ length: 100 }, (_, i) => {
    const f = makeFace(player(i + 1, race), 79);
    delete f.facial;
    delete f.ancestry;
    return f;
  });
  assert.equal(createHash('sha256').update(JSON.stringify(faces)).digest('hex'), legacy[race], race + ': legacy face stability');
}

const summary: any[] = [];
for (const asian of [0, 0.5, 1]) {
  let full = 0,
    density = 0;
  const heads = new Set(),
    eyes = new Set(),
    brows = new Set(),
    textures = new Set(),
    unique = new Set();
  for (let id = 1; id <= 2000; id++) {
    const p = { ...player(id), faceAncestry: { black: 1 - asian, asian } };
    const f = makeFace(p, 79);
    assert.deepEqual(f, makeFace(p, 79), 'Same player and league produce the same face');
    assert.deepEqual(f, makeFace(JSON.parse(JSON.stringify(p)), 79), 'JSON roundtrip keeps the face');
    if (['fullBeard', 'thickBeard'].includes(f.facial.style)) full++;
    density += f.facial.density;
    heads.add(JSON.stringify(f.head));
    eyes.add(f.eyes.shape);
    brows.add(f.brows.shape);
    textures.add(f.hair.tex);
    unique.add(JSON.stringify([f.head, f.eyes, f.brows, f.nose, f.mouth]));
    if (id % 40 === 0) {
      const svg = renderToStaticMarkup(faceSvg(f, ['#613487', '#f4e9ce']));
      assert(svg.startsWith('<svg'));
      assert(!/(?:NaN|Infinity|undefined)/.test(svg));
    }
  }
  assert.equal(unique.size, 2000, 'Features vary within each ancestry blend');
  assert(heads.size > 1900 && eyes.size === 7 && brows.size === 6 && textures.size >= 3);
  if (asian === 0.5) assert.equal(textures.size, 4, 'Mixed sources combine the available hair textures');
  assert(full > 0, 'No ancestry has a full-beard prohibition');
  summary.push({ eastAsianShare: asian, fullBeards: full, meanDensity: +(density / 2000).toFixed(3) });
}
assert(summary[0].fullBeards > summary[1].fullBeards && summary[1].fullBeards > summary[2].fullBeards);
assert(summary[2].fullBeards < summary[0].fullBeards * 0.3);
assert(summary[0].meanDensity > summary[1].meanDensity && summary[1].meanDensity > summary[2].meanDensity);

let beyondSkin = 0;
const mixture = { black: 0.45, asian: 0.35, white: 0.2 };
for (let id = 1; id <= 300; id++) {
  const a = makeFace(player(id), 79),
    b = makeFace({ ...player(id), faceAncestry: mixture }, 79);
  if (a.hair.tex !== b.hair.tex || a.eyes.shape !== b.eyes.shape || a.nose.w !== b.nose.w || a.mouth.upper !== b.mouth.upper) beyondSkin++;
  assert.deepEqual(b.ancestry, normalizeFaceAncestry(mixture), 'Three-way blends remain supported');
  const young = makeFace({ ...player(id, 'asian', 18), faceAncestry: mixture }, 79);
  assert(!['shortBeard', 'fullBeard', 'thickBeard'].includes(young.facial.style), 'Age still limits generated beard styles');
}
assert(beyondSkin > 250, 'Mixed appearance changes actual feature and hair distributions, not just skin');
const dad = makeFace(player(830), 79);
const child = player(831);
const singleChild = makeFace(child, 79, dad);
const mixedChild = makeFace({ ...child, faceAncestry: inherited }, 79, dad);
assert.notEqual(mixedChild.skin.tone, singleChild.skin.tone, "A same-primary-look parent cannot erase the child's different blend");

// Every manual feature wins, including a dense beard on an East Asian or female portrait.
const edits = {
  ancestry: { black: 0.5, asian: 0.5 },
  'head.style': 'round',
  'nose.style': 'broad',
  'mouth.style': 'full',
  'portrait.id': 'approved-08',
  'head.w': 1.12,
  'head.h': 0.95,
  'head.jaw': 0.72,
  'head.cheek': 1.04,
  'head.chinW': 0.54,
  'eyes.shape': 'round',
  'eyes.size': 1.08,
  'eyes.spacing': 1.06,
  'eyes.tilt': -0.1,
  'brows.shape': 'soft',
  'brows.thick': 0.75,
  'nose.w': 0.78,
  'nose.len': 0.3,
  'nose.bridge': 0.6,
  'mouth.w': 0.8,
  'mouth.upper': 0.7,
  'mouth.lower': 0.4,
  'skin.tone': 0.4,
  'hair.style': 'long',
  'hair.tex': 'wavy',
  'facial.style': 'fullBeard',
  'facial.density': 1,
};
let overrides = 0;
for (const race of FACE_LOOK_KEYS)
  for (const fem of [false, true])
    for (let id = 1; id <= 20; id++) {
      const f = makeFace({ ...player(id, race), fem, faceX: edits }, 79);
      for (const [path, value] of Object.entries(edits)) {
        assert.deepEqual(
          path.split('.').reduce((o: any, key) => o[key], f),
          value,
        );
        overrides++;
      }
    }
const rerolled: any = { ...player(51), faceAncestry: inherited, faceImg: 'custom', faceX: structuredClone(edits) };
rerollFace(rerolled, 190);
assert.deepEqual(rerolled.faceX, { ancestry: inherited });
assert.deepEqual(faceAncestry(rerolled), inherited);
assert.equal(rerolled.faceImg, undefined);

// New generated mixed appearances use their own RNG and are persistent data, not an
// accidental consequence of entering God Mode or regenerating a portrait on a birthday.
let mixed = 0,
  blackAsian = 0;
for (let id = 1; id <= 2000; id++) {
  const p = player(id),
    a = generatedFaceAncestry(p, 79);
  assert.deepEqual(a, generatedFaceAncestry(p, 79));
  if (a) {
    mixed++;
    if (a.black && a.asian) blackAsian++;
  }
}
assert(mixed > 120 && mixed < 300 && blackAsian > 20);
assert.equal(generatedFaceAncestry({ ...player(1), her: 'XN', mix: 'African American' }, 79), undefined);
const randomBefore = Math.random;
Math.random = () => {
  throw new Error('Portrait generation must not consume gameplay randomness');
};
makeFace({ ...player(33), faceAncestry: inherited }, 71);
generatedFaceAncestry(player(33), 71);
Math.random = randomBefore;

Math.random = mulberry32(8431);
const g = Game.create(8431, [0]);
const actualMixed = Object.values(g.db.P).filter((p: any) => p.faceAncestry && Object.keys(p.faceAncestry).length > 1);
assert(actualMixed.length > 20, 'World generation actually uses mixed appearances');
const p: any = Object.values(g.db.P).find((p: any) => !p.gone && p.r)!;
p.faceAncestry = mixture;
p.faceX = structuredClone(edits);
g.resetFace(p.id);
const face = g.face(p.id);
const html = renderToStaticMarkup(createElement(FaceEditor, { gm: g, p, onClose() {} }));
assert(html.includes('Choose portrait') && html.includes('Upload JPG/PNG') && !html.includes('type="range"'));
const copy = clonePlayer(g, p.id)!;
assert.deepEqual(g.db.P[copy].faceAncestry, p.faceAncestry);
assert.deepEqual(g.db.P[copy].faceX, p.faceX);
g.state.god = true;
const coach = staffOf(g, 0)[0];
const draft = coachBioDraft(g, coach);
draft.faceX = structuredClone(edits);
draft.faceImg = 'data:image/jpeg;base64,cG9ydHJhaXQ=';
assert.equal(saveCoachBio(g, coach.id, draft), '');
const coachFace = coachFaceData(g, g.db.coaches[coach.id], g.Y - coach.born);
assert.deepEqual(coachFace.ancestry, inherited);
assert.equal(coachFace.facial.style, 'fullBeard');
const reopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(reopened.db.P[p.id].faceAncestry, mixture);
assert.deepEqual(reopened.face(p.id), face, 'Save/load retains editable mixed faces exactly');
assert.deepEqual(reopened.db.coaches[coach.id].faceX, edits, 'Staff ancestry edits survive save/load');
assert.equal(reopened.db.coaches[coach.id].faceImg, draft.faceImg, 'Staff portrait uploads survive save/load');
const staffUpload = renderToStaticMarkup(
  createElement(CoachFace, { gm: reopened, c: reopened.db.coaches[coach.id], age: reopened.Y - coach.born }),
);
assert(staffUpload.includes(draft.faceImg!) && !staffUpload.includes('data-face-art'), 'A custom staff photo overrides the default');
const staffClear = coachBioDraft(reopened, reopened.db.coaches[coach.id]);
delete staffClear.faceImg;
assert.equal(saveCoachBio(reopened, coach.id, staffClear), '');
const staffPicture = renderToStaticMarkup(
  createElement(CoachFace, { gm: reopened, c: reopened.db.coaches[coach.id], age: reopened.Y - coach.born }),
);
assert(
  staffPicture.includes('data-face-art="complete-illustration"') && staffPicture.includes('data-portrait-id="approved-08"'),
  'Removing an upload restores the selected finished portrait',
);
console.log(
  JSON.stringify({
    beardSamples: summary,
    manualOverridesChecked: overrides,
    generatedMixed: mixed,
    blackAsian,
    worldMixed: actualMixed.length,
  }),
);
console.log('PASS: face variety, beard distributions, mixed sources, legacy portraits, editor overrides, staff, clone and save/load');

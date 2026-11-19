// Save compatibility and graphics boundaries for the optional painted portrait library.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import { makeFace, faceSvg } from '../src/engine/faces';
import {
  chooseIllustration,
  ILLUSTRATED_CHOICES,
  illustrationDefaults,
  randomIllustratedFeatures,
  readIllustration,
  rerollPersonFace,
  setIllustration,
} from '../src/engine/illustratedPortraits';
import { clonePlayer } from '../src/engine/godPlayer';
import { staffOf } from '../src/engine/staff';
import { coachBioDraft, saveCoachBio } from '../src/ui/coachEditing';
import { coachFaceData, CoachFace } from '../src/ui/CoachFace';

const html = (p: any) => renderToStaticMarkup(faceSvg(makeFace(p, 2027), ['#e11344', '#eeeddc'], { name: 'STARS', num: '12' }));
const baseline = JSON.parse(readFileSync(new URL('./fixtures/classicFaces.json', import.meta.url), 'utf8'));
for (const { p, hash } of baseline) {
  assert.equal(createHash('sha256').update(html(p)).digest('hex'), hash, 'Classic drawing stays exactly unchanged');
  assert.equal(
    html({ ...p, faceX: { illustration: { v: 1, enabled: true, base: 'missing' } } }),
    html(p),
    'Unknown artwork safely uses Classic',
  );
}
assert.equal(ILLUSTRATED_CHOICES.length, 57);
assert.equal(new Set(ILLUSTRATED_CHOICES.map(p => p.id)).size, 57);
for (const p of ILLUSTRATED_CHOICES) {
  const [x, y, w, h] = p.crop;
  assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= p.width && y + h <= p.height);
  assert(p.url && (p.role === 'player' || p.role === 'staff'));
  assert.match(html({ id: 7, faceX: { illustration: illustrationDefaults(p.id) } }), /data-portrait-style="illustrated"/);
}
assert.equal(readIllustration({ ...illustrationDefaults(), v: 2 }), null);
const invalid = readIllustration({ ...illustrationDefaults(), hair: 999, eyes: -1, jaw: Infinity, spacing: -99, mouth: 77 })!;
assert.equal(invalid.hair, 0);
assert.equal(invalid.eyes, 0);
assert.equal(invalid.jaw, 0);
assert.equal(invalid.spacing, -1);
assert.equal(invalid.mouth, 1);
assert.equal(readIllustration({ ...illustrationDefaults(), enabled: 'true' })!.enabled, false);
assert.equal(readIllustration({ ...illustrationDefaults('players-01'), hair: 6 })!.hair, 0);
const oldRandom = Math.random;
try {
  Math.random = () => {
    throw Error('Portrait defaults must not consume gameplay randomness');
  };
  for (const race of ['white', 'black', 'dark', 'asian', 'brown'])
    for (const fem of [false, true]) {
      const f = makeFace({ id: 27, faceSeed: 817, race, fem, age: 50 }, 2027);
      for (const context of ['player', 'staff'] as const) {
        const id = chooseIllustration(f, context),
          choice = ILLUSTRATED_CHOICES.find(p => p.id === id)!;
        assert.equal(id, chooseIllustration(f, context));
        assert.equal(choice.gender, fem ? 'woman' : 'man');
        if (context === 'staff') assert.equal(choice.role, 'staff');
        assert.notEqual(chooseIllustration(f, context, id), id);
      }
    }
} finally {
  Math.random = oldRandom;
}
const hairs = new Set<number>();
for (let seed = 0; seed < 100; seed++) hairs.add(randomIllustratedFeatures(illustrationDefaults(), seed).hair);
assert.equal(hairs.size, 7);

const g = Game.create(117, [0]),
  pid = g.state.rosters[0][0],
  p = g.db.P[pid];
const original = structuredClone(p),
  oldFace = renderToStaticMarkup(g.faceEl(pid, 0));
assert(!oldFace.includes('data-portrait-style'));
assert(!Object.values(g.db.P).some((q: any) => q.faceX?.illustration), 'No automatic replacement of existing/generated faces');
p.faceX = { 'hair.style': 'afro', 'head.jaw': 0.82 };
g.resetFace(pid);
const editedClassic = renderToStaticMarkup(g.faceEl(pid, 0));
const config = { ...illustrationDefaults(), hair: 6, eyes: 1, beard: 1, jaw: 0.65 };
setIllustration(p, config);
g.resetFace(pid);
assert.match(renderToStaticMarkup(g.faceEl(pid, 0)), /data-portrait-style="illustrated"/);
const bio = {
  race: p.race,
  fem: p.fem,
  r: structuredClone(p.r),
  from: structuredClone(p.from),
  ten: structuredClone(p.ten),
  ceil: structuredClone(p.ceil),
};
const reloaded = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(reloaded.db.P[pid].faceX, p.faceX);
assert.deepEqual(reloaded.db.P[pid].r, original.r);
const again = Game.load(JSON.parse(JSON.stringify(reloaded.toSave())));
assert.deepEqual(again.db.P[pid].faceX, p.faceX);
assert.match(renderToStaticMarkup(again.faceEl(pid, -1)), /data-portrait-style="illustrated"/);
const cloneId = clonePlayer(g, pid)!;
assert.deepEqual(g.db.P[cloneId].faceX, p.faceX);
assert.notEqual(g.db.P[cloneId].faceX, p.faceX, 'Cloned edits are independent');
setIllustration(p, { ...config, enabled: false });
g.resetFace(pid);
assert.equal(renderToStaticMarkup(g.faceEl(pid, 0)), editedClassic, 'Classic edits and team jersey return exactly');
setIllustration(p, config);
rerollPersonFace(p, 191);
assert(readIllustration(p.faceX.illustration)?.enabled);
assert.notEqual(p.faceX.illustration.base, config.base);
assert.deepEqual({ race: p.race, fem: p.fem, r: p.r, from: p.from, ten: p.ten, ceil: p.ceil }, bio);
p.faceImg = 'data:image/png;base64,custom-upload';
g.resetFace(pid);
assert.match(renderToStaticMarkup(g.faceEl(pid, 0)), /custom-upload/);
delete p.faceImg;
const coach = staffOf(g, 0)[0],
  draft = coachBioDraft(g, coach);
draft.faceX = { illustration: illustrationDefaults(coach.fem ? 'staffWomen-01' : 'staffMen-01') };
g.setState({ god: false });
assert.match(saveCoachBio(g, coach.id, draft), /God Mode/);
g.setState({ god: true });
assert.equal(saveCoachBio(g, coach.id, draft), '');
assert.match(renderToStaticMarkup(faceSvg(coachFaceData(g, coach, g.Y - coach.born))), /data-portrait-style="illustrated"/);
const loadedCoach = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(loadedCoach.db.coaches[coach.id].faceX, draft.faceX);
const linked: any = { ...coach, id: 94838, pid, bioFace: false, faceX: undefined, faceSeed: undefined, race: p.race, fem: !!p.fem };
const first = renderToStaticMarkup(createElement(CoachFace, { c: linked, age: p.age, gm: g }));
setIllustration(p, illustrationDefaults('players-24'));
g.resetFace(pid);
const second = renderToStaticMarkup(createElement(CoachFace, { c: linked, age: p.age, gm: g }));
assert.notEqual(second, first, 'Former-player staff portraits refresh with their linked player');
const classicPerson: any = { id: 3, race: 'black', faceX: { 'hair.style': 'buzz' }, faceImg: 'upload' };
rerollPersonFace(classicPerson, 19);
assert.equal(classicPerson.faceX, undefined);
assert.equal(classicPerson.faceImg, undefined);
console.log(
  'PASS: 30 exact Classic baselines; 57 valid portraits; isolated defaults; normalized edits; player/staff saves, cloning, rerolls, uploads and God Mode.',
);

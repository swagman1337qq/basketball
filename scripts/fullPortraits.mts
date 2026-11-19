import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { renderToStaticMarkup } from 'react-dom/server';
import { HAIR_STYLES, FACE_OPTS, makeFace } from '../src/engine/faces';
import {
  FULL_HEADS,
  FULL_HAIR,
  FULL_BEARDS,
  FULL_OPTIONS,
  FULL_PROPORTIONS,
  FULL_UNIT,
  fullDefaults,
  readFullPortrait,
  newFullPortrait,
  randomFullFeatures,
} from '../src/engine/fullPortraits';
import { fullWarp } from '../src/engine/fullPortraitPainter';
import { Game } from '../src/engine/Game';
import { clonePlayer } from '../src/engine/godPlayer';
import { readIllustration, setIllustration, rerollPersonFace } from '../src/engine/illustratedPortraits';
import { staffOf } from '../src/engine/staff';
import { coachBioDraft, saveCoachBio } from '../src/ui/coachEditing';
import { coachFaceData } from '../src/ui/CoachFace';
import { faceSvg } from '../src/engine/faces';
assert.equal(FULL_HEADS.length, 16);
assert.equal(FULL_HAIR.length, 45);
assert.equal(FULL_BEARDS.length, 17);
for (const id of Object.keys(HAIR_STYLES))
  assert(
    FULL_HAIR.some(p => p.id === id),
    'Missing original hairstyle ' + id,
  );
for (const [id] of FACE_OPTS.facial)
  assert(
    FULL_BEARDS.some(p => p.id === id),
    'Missing original facial hair ' + id,
  );
for (const group of ['eyes', 'brows', 'expr'] as const)
  assert.deepEqual(new Set(FULL_OPTIONS[group].map(x => x[0])), new Set(FACE_OPTS[group].map(x => x[0])));
for (const items of [FULL_HEADS, FULL_HAIR, FULL_BEARDS]) assert.equal(new Set(items.map(p => p.id)).size, items.length);
const defaults = fullDefaults();
assert.equal(readFullPortrait({ ...defaults, base: 'missing' }), null);
assert.equal(readFullPortrait({ ...defaults, v: 3 }), null);
const malformed: any = { ...defaults, headWidth: Infinity, hair: 'not-real', facial: 'bad', browSlit: 99, grey: 8, enabled: 'true' };
const safe = readFullPortrait(malformed)!;
assert.equal(safe.enabled, false);
assert.equal(safe.headWidth, 0);
assert.equal(safe.hair, 'sidepart');
assert.equal(safe.facial, 'none');
assert.equal(safe.grey, 1);
assert.equal(safe.browSlit, 2);
for (const base of FULL_HEADS)
  for (const hair of FULL_HAIR)
    for (const beard of FULL_BEARDS) {
      const p = readFullPortrait({ ...defaults, base: base.id, hair: hair.id, facial: beard.id })!;
      assert.equal(p.hair, hair.id);
      assert.equal(p.facial, beard.id);
      assert.equal(p.base, base.id);
    }
const old = Math.random;
try {
  Math.random = () => {
    throw Error('Portrait code consumed gameplay RNG');
  };
  for (const race of ['white', 'black', 'dark', 'asian', 'brown'])
    for (const fem of [false, true])
      for (let seed = 1; seed <= 30; seed++) {
        const f = makeFace({ id: seed, race, fem, age: 26 }, 21),
          p = newFullPortrait(f, seed, 'staff');
        assert.equal(FULL_HEADS.find(h => h.id === p.base)!.gender, fem ? 'woman' : 'man');
        assert.equal(p.outfit, fem ? 'blouse' : 'polo');
        assert.deepEqual(p, newFullPortrait(f, seed, 'staff'));
        assert.equal(p.texture, f.hair.tex);
      }
} finally {
  Math.random = old;
}
const hairSet = new Set<string>(),
  sigs = new Set<string>();
for (let seed = 0; seed < 2000; seed++) {
  const head = FULL_HEADS[seed % FULL_HEADS.length],
    current = { ...defaults, base: head.id },
    p = randomFullFeatures(current, seed, { appearanceMix: head.looks, fem: head.gender === 'woman', age: 40 });
  hairSet.add(p.hair);
  assert.equal(p.base, current.base);
  assert.equal(p.skinTone, defaults.skinTone);
  sigs.add(JSON.stringify(p));
  for (const k of FULL_PROPORTIONS) assert(Number.isFinite(p[k]) && Math.abs(p[k]) <= 1);
  const roundtrip = JSON.parse(JSON.stringify(p));
  assert.deepEqual(readFullPortrait(roundtrip), p);
}
assert.equal(hairSet.size, FULL_HAIR.length);
assert.equal(sigs.size, 2000);
// Appearance rules apply to initial conversion, editor shuffle and raw-player rerolls.
// They never alter stored/manual choices, which were exhaustively roundtripped above.
const appearanceStats: Record<string, { count: number; beards: number; styles: Set<string> }> = {};
try {
  Math.random = () => {
    throw Error('Appearance choices consumed gameplay RNG');
  };
  for (const race of ['white', 'black', 'dark', 'asian', 'brown']) {
    const stats = (appearanceStats[race] = { count: 0, beards: 0, styles: new Set<string>() });
    for (const fem of [false, true])
      for (const age of [18, 26, 50])
        for (let seed = 0; seed < 500; seed++) {
          // Deliberately supply an unsuitable Classic/source style: it cannot bypass the pool.
          const face = {
              race,
              fem,
              age,
              hair: { style: race === 'asian' ? 'locsLong' : 'curtains', tex: race === 'asian' ? 'coily' : 'wavy' },
              facial: { style: 'fullBeard' },
            },
            generated = newFullPortrait(face, seed),
            shuffled = randomFullFeatures({ ...generated, hair: 'curtains', texture: 'coily' }, seed, face),
            person: any = { race, fem, age, faceX: { illustration: generated } };
          rerollPersonFace(person, seed);
          for (const p of [generated, shuffled, person.faceX.illustration]) {
            if (race === 'black' || race === 'dark')
              assert(!['curtains', 'longPart', 'kpop'].includes(p.hair), 'No automatic middle-part/K-pop preset for ' + race);
            if (race === 'asian') {
              assert(
                !['locsShort', 'locsLong', 'locsUp', 'cornrows', 'braids', 'afro', 'shortAfro', 'twists'].includes(p.hair),
                'No automatic locs/coily style for East Asian preset',
              );
              assert.notEqual(p.texture, 'coily');
            }
            if (fem) assert.equal(p.facial, 'none');
            if (age < 20) assert(!['shortBeard', 'fullBeard', 'thickBeard'].includes(p.facial));
            stats.styles.add(p.hair);
          }
          if (!fem && age === 26) {
            stats.count++;
            if (['shortBeard', 'fullBeard', 'thickBeard'].includes(generated.facial)) stats.beards++;
          }
        }
    assert(stats.styles.has('buzz'), 'Buzz cuts remain available automatically for every appearance');
    assert(stats.styles.size >= 10, 'Automatic choices retain variety for ' + race);
  }
  assert(appearanceStats.asian.beards / appearanceStats.asian.count < 0.02, 'Substantial beards are rare East Asian defaults');
  assert(appearanceStats.white.beards > appearanceStats.asian.beards, 'Facial-hair defaults vary with appearance');
  const textures = new Set<string>(),
    mixedStyles = new Set<string>();
  for (let seed = 0; seed < 1000; seed++) {
    const p = newFullPortrait({ race: 'asian', appearanceMix: { asian: 0.5, black: 0.5 }, age: 26 }, seed);
    textures.add(p.texture);
    mixedStyles.add(p.hair);
  }
  assert(textures.has('straight') && textures.has('coily'), 'Explicit mixed appearance uses both contributing profiles');
  assert(mixedStyles.has('kpop') && mixedStyles.has('locsLong'));
  assert.deepEqual(
    newFullPortrait({ appearanceMix: { asian: 0.5, black: 0.5 } }, 14),
    newFullPortrait({ appearanceMix: { asian: 50, black: 50 } }, 14),
    'Mixed appearance weights are normalized',
  );
  assert.deepEqual(
    newFullPortrait({ race: 'black', nat: 'Japan' }, 31),
    newFullPortrait({ race: 'black', nat: 'USA' }, 31),
    'Nationality does not replace in-game appearance',
  );
  assert.doesNotThrow(() => newFullPortrait({ race: 'unknown', appearanceMix: { asian: NaN, black: -1 } }, 31));
} finally {
  Math.random = old;
}
for (const k of FULL_UNIT) assert.equal(readFullPortrait({ ...defaults, [k]: -100 })![k], 0);
// Combined extremes cannot fold the image, and accessories follow the same map.
for (let seed = 0; seed < 120; seed++) {
  const p = randomFullFeatures(defaults, seed);
  if (seed < 4) for (const k of FULL_PROPORTIONS) p[k] = seed & 1 ? 1 : -1;
  const warp = fullWarp(p);
  assert(warp.minJacobian > 0.3);
  assert(warp.maxSlope <= 0.42001, 'The bound includes every corner of each interpolated cell');
  for (const [x, y] of [
    [134, 149],
    [187, 149],
    [95, 171],
    [160, 209],
  ]) {
    const display = warp.point(x, y),
      offset = warp.offset(display[0], display[1]);
    assert(Math.abs(display[0] + offset[0] - x) < 0.15 && Math.abs(display[1] + offset[1] - y) < 0.15);
  }
}
const g = Game.create(1131, [0]),
  pid = g.state.rosters[0][0],
  player = g.db.P[pid];
const original = structuredClone(player);
player.faceX = { 'hair.style': 'afro', 'head.jaw': 0.82 };
g.resetFace(pid);
const classic = renderToStaticMarkup(g.faceEl(pid, 0));
const config = {
  ...newFullPortrait(makeFace(player, g.db.seed), 715),
  hair: 'wolf',
  facial: 'shortBeard',
  dye: 'platinum',
  dyeKind: 'highlights',
  jaw: 0.45,
  glasses: 'round',
  browSlit: 2,
  mole: true,
};
setIllustration(player, config);
g.resetFace(pid);
assert.equal(readIllustration(player.faceX.illustration)!.v, 2);
assert.match(renderToStaticMarkup(g.faceEl(pid, 0)), /data-portrait-catalogue="full"/);
const loaded = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(loaded.db.P[pid].faceX, player.faceX, 'Every painted setting survives save/load');
assert.deepEqual(loaded.db.P[pid].r, original.r);
const clone = clonePlayer(g, pid)!;
assert.deepEqual(g.db.P[clone].faceX, player.faceX);
g.db.P[clone].faceX.illustration.jaw = -0.75;
assert.equal(player.faceX.illustration.jaw, 0.45, 'Clones do not share nested edits');
setIllustration(player, { ...config, enabled: false });
g.resetFace(pid);
assert.equal(renderToStaticMarkup(g.faceEl(pid, 0)), classic, 'Classic edits restore exactly');
setIllustration(player, config);
rerollPersonFace(player, 721);
assert.equal(player.faceX.illustration.v, 2);
assert(player.faceX.illustration.enabled);
for (const k of ['r', 'age', 'nat', 'race', 'fem', 'from', 'ten', 'ceil'])
  assert.deepEqual(player[k], original[k], 'Portrait edits leave ' + k + ' unchanged');
player.faceImg = 'data:image/png;base64,retained-upload';
g.resetFace(pid);
assert.match(renderToStaticMarkup(g.faceEl(pid, 0)), /retained-upload/);
delete player.faceImg;
const coach = staffOf(g, 0)[0],
  draft = coachBioDraft(g, coach);
draft.faceX = { illustration: newFullPortrait(coachFaceData(g, coach, draft.age), 891, 'staff') };
g.setState({ god: false });
assert.match(saveCoachBio(g, coach.id, draft), /God Mode/);
g.setState({ god: true });
assert.equal(saveCoachBio(g, coach.id, draft), '');
assert.equal(Game.load(JSON.parse(JSON.stringify(g.toSave()))).db.coaches[coach.id].faceX.illustration.v, 2);

// Exercise the real incremental autosave, not just the full JSON codec.
const { db, getSave, exportSave, importSave, deleteSave } = await import('../src/db/saves');
const { createSaveWriter } = await import('../src/db/saveWriter');
const writer = createSaveWriter(),
  meta = { id: 'full-portrait-test', name: 'Full portrait test', createdAt: 1 };
await writer.save(g, meta);
const before = (await getSave(meta.id))!,
  expected = structuredClone(player.faceX);
assert.deepEqual(Game.load(structuredClone(before.data)).db.P[pid].faceX, expected);
const writes: string[] = [];
db.players.hook('updating', (_mods, _key, row) => {
  writes.push(row.pid);
});
player.faceX.illustration.eyeSize = -0.35;
g.setState(s => ({ gv: (s.gv || 0) + 1 }));
await writer.save(g, meta);
assert.deepEqual(writes, [String(pid)], 'One face edit only rewrites the affected archived player');
const saved = (await getSave(meta.id))!;
assert.equal(Game.load(structuredClone(saved.data)).db.P[pid].faceX.illustration.eyeSize, -0.35);
const documentBefore = globalThis.document,
  createURL = URL.createObjectURL,
  revokeURL = URL.revokeObjectURL;
let download: Blob;
(globalThis as any).document = { createElement: () => ({ click() {} }) };
URL.createObjectURL = value => {
  download = value as Blob;
  return 'blob:test';
};
URL.revokeObjectURL = () => {};
try {
  await exportSave(saved);
  const exported = JSON.parse(await download!.text()),
    imported = await importSave(new File([JSON.stringify(exported)], 'painted.json'));
  assert(isDeepStrictEqual((await getSave(imported.id))!.data, exported.data), 'The complete exported save reimports exactly');
  assert.equal(Game.load(exported.data).db.P[pid].faceX.illustration.eyeSize, -0.35);
  await deleteSave(imported.id);
} finally {
  (globalThis as any).document = documentBefore;
  URL.createObjectURL = createURL;
  URL.revokeObjectURL = revokeURL;
}
await writer.dispose();
await deleteSave(meta.id);
db.close();
console.log(
  'PASS: full option coverage; 12,240 independent selections; 2,000 stable settings; bounded geometry; exact player/staff saves, cloning, one-player autosave, export/import, uploads, Classic restore and isolated randomness.',
);

import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { ovrExact, ovrExactV7, OVR_W } from '../src/engine/ratings';
import { draftValue, rotationValue } from '../src/engine/rosterAI';
import { newLeague } from './lib/headless.mts';

for (const weights of Object.values(OVR_W)) {
  assert.equal(Object.keys(weights).length, 20);
  assert.ok(Math.abs(Object.values(weights).reduce((sum, w) => sum + w, 0) - 100) < 1e-8);
}

const game = newLeague(4837);
const oldSave = structuredClone(game.toSave());
oldSave.db.iqV = 7;
const [id, cardId] = oldSave.state.rosters[0];
const player = oldSave.db.P[id],
  cardPlayer = oldSave.db.P[cardId];
for (const p of [player, cardPlayer]) {
  p.posLock = true;
  p.ovr = Math.round(ovrExactV7(p));
  p.ox = +(ovrExactV7(p) - p.ovr).toFixed(3);
  p.tpot = p.ovr + 8;
}
cardPlayer.godPot = 87;
const delta = Math.round(ovrExact(player)) - player.ovr;
const loaded = Game.load(structuredClone(oldSave));
const updated = loaded.db.P[id];
assert.equal(loaded.db.iqV, 8);
assert.equal(updated.ovr, Math.round(ovrExact(player)));
assert.equal(updated.tpot, player.tpot + delta);
assert.deepEqual(updated.r, player.r);
assert.deepEqual(updated.stats, player.stats);
assert.equal(updated.amt, player.amt);
assert.equal(updated.exp, player.exp);
assert.equal(loaded.db.P[cardId].godPot, 87);
if (player.dv0) assert.equal(updated.dv0.o, +(player.dv0.o + ovrExact(player) - ovrExactV7(player)).toFixed(2));

const reloaded = Game.load(structuredClone(loaded.toSave()));
for (const key of ['r', 'ovr', 'ox', 'tpot', 'dv0', 'stats', 'amt', 'exp']) {
  assert.deepEqual(reloaded.db.P[id][key], updated[key]);
}

const ready = { ovr: 60, ox: 0.25 },
  project = { ovr: 44 };
assert.ok(draftValue(ready, 66, 'contend') > draftValue(project, 74, 'contend'));
assert.ok(draftValue(ready, 66, 'rebuild') < draftValue(project, 74, 'rebuild'));
assert.equal(rotationValue({ ...ready, gp: 19, per: 38 }), 60.25);
assert.ok(rotationValue({ ...ready, gp: 60, per: 38 }) > 60.25);
assert.ok(rotationValue({ ...ready, gp: 60, per: 38 }) < 62.25);
console.log('Player value weights, legacy migration, draft timelines and rotation sample guard passed.');

// Explicit frequency survives authoring, AI adaptation, freezes, old defaults and undo.
// Run: npx tsx scripts/finishingPreferences.mts
import assert from 'node:assert/strict';
import { OLD_CARD_BUILDS } from '../src/data/cardBuilds';
import { applyCard, cardUndoSnapshot, exportCard, PRESET_CARDS, restoreCardUndo, retuneCarriers } from '../src/engine/playerCard';
import { autoTen, CRE_TEN, effTend, ensureTen, ZONE_TEN } from '../src/engine/tendencies';

const source = PRESET_CARDS[25].card;
const recipient = () => ({ ...structuredClone(source), id: 943, name: 'Recipient', age: 25, grp: 'G', tid: 0, stats: [], amt: 4, exp: 2028 });
const zero = structuredClone(source); zero.ten.dunk = 0;
const p: any = recipient();
assert.equal(applyCard(p, zero, {}), '');
assert.equal(p.ten.dunk, 0); assert.equal(effTend(p)!.dunk, 0);
assert.equal(p.tenBase.dunkAuthored, true);
const groups = () => [ZONE_TEN, CRE_TEN].map(keys => Object.fromEntries(keys.map(k => [k, p.ten[k]])));
const originalGroups = groups();
for (let i = 0; i < 3; i++) {
  assert.equal(autoTen(p, { rank: 3 }), true);
  assert.equal(p.ten.dunk, 0); assert.equal(effTend(p)!.dunk, 0);
}
assert.deepEqual(groups(), originalGroups, 'dunk choice does not renormalize shot-location/creation groups');
p.r.dnk += 10; p.r.jmp += 5;
autoTen(p, { rank: 0 }); assert.equal(p.ten.dunk, 0, 'authored zero survives changing ability and role');
const exported = exportCard(p);
const q: any = recipient(); applyCard(q, JSON.parse(JSON.stringify(exported)), {});
assert.equal(q.ten.dunk, 0); assert.equal(q.tenBase.dunkAuthored, true);
const undo = cardUndoSnapshot(p), positive = structuredClone(source); positive.ten.dunk = 35;
applyCard(p, positive, {}); assert.equal(p.ten.dunk, 35);
assert.equal(restoreCardUndo(p, undo, {}), ''); assert.equal(p.ten.dunk, 0);
autoTen(p); assert.equal(p.ten.dunk, 0);

p.ten.dunk = 100; p.tenLock = true;
assert.equal(autoTen(p), false); assert.equal(p.ten.dunk, 100); assert.equal(effTend(p)!.dunk, 1);
const frozen = JSON.parse(JSON.stringify(p));
delete frozen.ten.dunk; delete frozen.tenBase.ten.dunk; delete frozen.tenBase.natural.dunk; delete frozen.tenBase.dunkAuthored;
const oldZones = Object.fromEntries(ZONE_TEN.map(k => [k, frozen.ten[k]]));
ensureTen(frozen);
assert.ok(Number.isFinite(frozen.ten.dunk) && frozen.ten.dunk >= 0 && frozen.ten.dunk <= 100);
assert.equal(frozen.tenBase.dunkAuthored, false);
assert.deepEqual(Object.fromEntries(ZONE_TEN.map(k => [k, frozen.ten[k]])), oldZones);
assert.equal(autoTen(frozen), false, 'adding an old-save default does not unfreeze the style');

// Older card formats still recognize the explicit independent preference.
const legacy = structuredClone(zero); delete legacy.ten.step; delete legacy.ten.fade;
applyCard(q, legacy, {}); assert.equal(q.ten.dunk, 0); autoTen(q); assert.equal(q.ten.dunk, 0);
const withoutPreference = structuredClone(source); delete withoutPreference.ten.dunk;
applyCard(q, withoutPreference, {});
assert.ok(Number.isFinite(q.ten.dunk)); assert.equal(q.tenBase.dunkAuthored, false);

// A known older carrier may take its new abilities, while an explicit zero
// preference remains a user-authored choice after the AI refreshes it.
const preset = PRESET_CARDS[0].card;
const previous = (OLD_CARD_BUILDS[preset.name] || []).find(o => o.ten && JSON.stringify(o.r) !== JSON.stringify(preset.r));
assert.ok(previous);
const edited = { ...structuredClone(preset), r: structuredClone(previous.r), pot: previous.pot, ten: { ...previous.ten, dunk: 0 } };
const carrier: any = recipient(); applyCard(carrier, edited, {}); carrier.cardPreset = 0;
retuneCarriers({ [carrier.id]: carrier });
assert.equal(carrier.ten.dunk, 0); autoTen(carrier); assert.equal(carrier.ten.dunk, 0);
console.log('Dunk preference: zero/100, AI anchors, role/ability changes, freeze, defaults, import/export, undo and carrier edits passed.');

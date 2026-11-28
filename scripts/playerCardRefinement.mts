import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyCard, cardUndoSnapshot, PRESET_CARDS, restoreCardUndo, upgradePresetCard } from '../src/engine/playerCard';
import { Game } from '../src/engine/Game';
import { mulberry32 } from '../src/engine/rng';
import { seasonLine } from '../src/engine/amateurStats';

const audit = JSON.parse(fs.readFileSync(new URL('../docs/PLAYER_CARD_REFINEMENT_2026-11-27.json', import.meta.url), 'utf8'));
const realism = JSON.parse(fs.readFileSync(new URL('../docs/PLAYER_CARD_REALISM_2026-11-27.json', import.meta.url), 'utf8'));
const clone = (value: any) => structuredClone(value);
assert.equal(audit.cards.length, 37);
assert.ok(PRESET_CARDS.length >= 33);
Math.random = mulberry32(92737);
const game = Game.create(92737, [0]);
const carrier = game.db.P[game.state.rosters[0][0]];
let upgraded = 0;
for (const record of audit.cards) {
  const latest = realism.cards.find((x: any) => x.index === record.index);
  assert.ok(latest, record.label + ' overall review');
  const card = latest.revised;
  assert.deepEqual(
    JSON.parse(fs.readFileSync(new URL('../public/cards/' + latest.file, import.meta.url), 'utf8')),
    card,
    record.label + ' downloadable build matches shipped template',
  );
  assert.deepEqual(card.historical, record.revised.historical, record.label + ' exact references preserved');
  assert.equal(Object.keys(card.r).length, 20, record.label + ' all ratings');
  assert.ok(Object.values(card.r).every(v => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 99));
  assert.ok(
    Object.values(card.ten).every(v => typeof v === 'number' && Number.isFinite(v)),
    record.label + ' finite tendencies',
  );
  for (const keys of [
    ['ra', 'paint', 'mid', 'c3', 'atb'],
    ['cns', 'pullup', 'step', 'fade'],
  ])
    assert.ok(Math.abs(keys.reduce((sum, key) => sum + card.ten[key], 0) - 100) < 0.02, record.label + ' complete shares');
  const source = record.reference.totals;
  assert.equal(source.pts, 2 * source.fgm + source.tpm + source.ftm, record.label + ' source scoring identity');
  assert.equal(source.reb, source.orb + source.drb, record.label + ' source rebounding identity');
  const p = clone(carrier),
    before = clone(p),
    undo = cardUndoSnapshot(p);
  assert.equal(applyCard(p, card, game.db.C), '');
  for (const key of ['id', 'name', 'first', 'last', 'age', 'dob', 'rep', 'born', 'raised', 'race', 'face', 'hist', 'contract', 'tid'])
    assert.deepEqual(p[key], before[key], record.label + ' identity/history ' + key);
  assert.deepEqual(p.r, card.r);
  assert.ok(p.tpot >= p.ovr);
  assert.equal(restoreCardUndo(p, undo, game.db.C), '');
  assert.deepEqual(p.r, before.r, record.label + ' undo');
  assert.deepEqual(p.am, before.am, record.label + ' undo restores college build');
  assert.deepEqual(p.dx, before.dx, record.label + ' undo restores pending translation');
  const customCollege = clone(carrier);
  customCollege.am = { r: { ...carrier.r, pss: 23 }, habits: { usage: 29 }, zones: { ra: 50, paint: 20, mid: 20, c3: 2, atb: 8 } };
  customCollege.dx = { o: 4, c: -3, sh: { tp: 2 }, tier: 'different' };
  const collegeBefore = clone(customCollege),
    collegeUndo = cardUndoSnapshot(customCollege);
  assert.equal(applyCard(customCollege, card, game.db.C), '');
  assert.equal(restoreCardUndo(customCollege, JSON.parse(JSON.stringify(collegeUndo)), game.db.C), '');
  assert.deepEqual(customCollege.am, collegeBefore.am, record.label + ' persisted undo restores existing college edits');
  assert.deepEqual(customCollege.dx, collegeBefore.dx, record.label + ' persisted undo restores existing translation');
  if (record.collegeCheck) {
    const source = record.collegeCheck;
    for (const id of [85001, 85002, 85501, 86200]) {
      const make = () => ({
        id,
        age: card.age,
        r: {},
        intg: { feel: 50, poise: 50 },
        pers: {},
        pot: card.pot,
        from: { lg: 'NCAA', team: source.entry.school },
      });
      const actual: any = make(),
        expected: any = make();
      assert.equal(applyCard(actual, card, {}), '');
      assert.equal(applyCard(expected, source.card, {}), '');
      assert.deepEqual(
        seasonLine(actual, source.entry.year, 0).disp,
        seasonLine(expected, source.entry.year, 0).disp,
        record.label + ' installed college build matches its tested build',
      );
    }
  }
  if (record.index >= 33) continue;
  assert.equal(PRESET_CARDS[record.index].label, record.label, 'preset positions stay stable');
  assert.deepEqual(PRESET_CARDS[record.index].card, card);
  const published = { id: 'preset' + record.index, card: clone(record.revised) };
  upgradePresetCard(published);
  for (const key of ['r', 'pot', 'intg', 'ten', 'am', 'validation'])
    assert.deepEqual(published.card[key], card[key], record.label + ' prior published template updates ' + key);
  const old = record.previous;
  const row = { id: 'preset' + record.index, card: clone(old) };
  if (upgradePresetCard(row)) upgraded++;
  assert.deepEqual(row.card.r, card.r, record.label + ' untouched copy gets revised ratings');
  assert.deepEqual(row.card.ten, card.ten, record.label + ' untouched copy gets revised style');
  assert.deepEqual(row.card.am, card.am, record.label + ' untouched college build updates');
  assert.deepEqual(row.card.pot, card.pot, record.label + ' potential-only update is recognized');
  assert.equal(upgradePresetCard(row), false, record.label + ' upgrade is idempotent');
  const edits: Array<(c: any) => void> = [
    c => {
      c.r.pss = c.r.pss >= 98 ? c.r.pss - 1 : c.r.pss + 1;
    },
    c => {
      c.ten.usage = c.ten.usage === 50 ? 51 : 50;
    },
    c => {
      c.pot += 1;
    },
    c => {
      c.intg.feel = c.intg.feel === 50 ? 51 : 50;
    },
    c => {
      c.pers.work = c.pers.work === 50 ? 51 : 50;
    },
    c => {
      c.am = { ...(c.am || {}), r: { ...(c.am?.r || c.r), pss: 13 } };
    },
  ];
  for (const edit of edits) {
    const custom = { id: 'preset' + record.index, card: clone(old) };
    edit(custom.card);
    const expected = clone(custom.card);
    assert.equal(upgradePresetCard(custom), false, record.label + ' explicit edits are protected');
    assert.deepEqual(custom.card, expected);
  }
  const notes = { id: 'preset' + record.index, card: { ...clone(old), notes: 'My custom scouting notes', sources: ['my-source'] } };
  upgradePresetCard(notes);
  assert.equal(notes.card.notes, 'My custom scouting notes');
  assert.deepEqual(notes.card.sources, ['my-source']);
}
for (const candidate of realism.candidates.filter((x: any) => x.accepted)) {
  assert.ok(candidate.errorAfter <= candidate.errorBefore * 0.98);
  assert.ok(candidate.fullErrorAfter <= candidate.fullErrorBefore * 0.98);
  assert.deepEqual(candidate.issues, []);
}
console.log(
  `Checked ${audit.cards.length} cards: source identities, finite complete builds, import/apply/undo, ${upgraded} untouched preset updates, stable IDs and protected rating/style/potential/feel/work/college/reference edits.`,
);

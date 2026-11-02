
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { cards, evaluateLin } from './lin-card-eval.mjs';
const read = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const source = await read('./jeremy-lin-targets.json'), card = await read('../public/cards/jeremy-lin-2011-12.json');
const { PRESET_CARDS, applyCard, upgradePresetCard, cardUndoSnapshot, restoreCardUndo } = cards;
assert.deepEqual(PRESET_CARDS[25].card, card);
assert.equal(PRESET_CARDS.length, 26);
assert.match(PRESET_CARDS[11].label, /Jeremy Lin.*Rookie/);
for (const keys of [['ra','paint','mid','c3','atb'],['cns','pullup','step','fade']]) {
  assert.ok(Math.abs(keys.reduce((s,k) => s + card.ten[k], 0) - 100) < 1e-9);
}
for (const rating of Object.values(card.r)) assert.ok(Number.isInteger(rating) && rating >= 1 && rating <= 99);
// Reconcile the shot chart with the complete 35-game season.
const zones = Object.values(source.zones);
assert.equal(zones.reduce((s,z) => s + z.fga, 0), source.fga);
assert.equal(zones.reduce((s,z) => s + z.fg, 0), source.fgm);
for (const z of zones) {
  assert.equal(Object.values(z.types).reduce((s,t) => s + t.fga, 0), z.fga);
  assert.equal(Object.values(z.types).reduce((s,t) => s + t.fg, 0), z.fg);
}
const actionTotals = pattern => zones.flatMap(z => Object.entries(z.types)).filter(([name]) => pattern.test(name))
  .reduce((a,[,t]) => ({made:a.made+t.fg, attempts:a.attempts+t.fga}), {made:0,attempts:0});
assert.deepEqual(actionTotals(/layup/i), source.actions.layups);
assert.deepEqual(actionTotals(/dunk/i), source.actions.dunks);
const z = name => source.zones[name];
const corner = {fg:z('Left Corner 3').fg+z('Right Corner 3').fg, fga:z('Left Corner 3').fga+z('Right Corner 3').fga};
assert.equal(corner.fga + z('Above the Break 3').fga, source.tpa);
assert.equal(corner.fg + z('Above the Break 3').fg, source.tpm);
for (const [key,attempts] of [['ra',152],['paint',77],['mid',79],['c3',13],['atb',62]]) {
  assert.ok(Math.abs(card.ten[key]/100-attempts/source.fga)<.0005, key+': match official attempts to rounding');
}
const old = source.previousCard, untouched = {id:'preset25',card:structuredClone(old)};
assert.equal(upgradePresetCard(untouched), true);
for (const key of ['r','ten','pot','notes','sources']) assert.deepEqual(untouched.card[key], card[key]);
assert.equal(upgradePresetCard(untouched), false);
for (const edit of [c=>{c.r.lay++;},c=>{c.ten.ra++;},c=>{c.pot++;},c=>{c.intg.feel++;},c=>{c.pers.work++;}]) {
  const row={id:'preset25',card:structuredClone(old)};edit(row.card);
  const before=structuredClone(row);assert.equal(upgradePresetCard(row),false);assert.deepEqual(row,before);
}
const customNotes={id:'preset25',card:{...structuredClone(old),notes:'My own notes',sources:['https://example.com/my-source']}};
assert.equal(upgradePresetCard(customNotes),true);
assert.equal(customNotes.card.notes,'My own notes');
assert.deepEqual(customNotes.card.sources,['https://example.com/my-source']);
const p={...structuredClone(old),id:4242,name:'Original Player',age:28,tid:3,stats:[{year:2025}],con:{salary:4.2,years:2}};
assert.equal(applyCard(p,old,{}),'');
const identity=structuredClone(Object.fromEntries(['id','name','age','tid','stats','con'].map(k=>[k,p[k]])));
const undo=cardUndoSnapshot(p), beforeRatings=structuredClone(p.r);
assert.equal(applyCard(p,card,{}),'');
for(const[key,value]of Object.entries(identity))assert.deepEqual(p[key],value);
assert.ok(p.tenBase);assert.equal(p.cardPreset,25);
const overall=p.ovr,potential=p.pot;
assert.equal(restoreCardUndo(p,undo,{}),'');assert.deepEqual(p.r,beforeRatings);
const target={};
for(const k of ['pts','fga','tpa','fta','orb','drb','ast','stl','blk','tov','pf'])target[k]=(k==='pts'?source.points:source[k])/source.games;
Object.assign(target,{
  fg:source.fgm/source.fga,tp:source.tpm/source.tpa,ft:source.ftm/source.fta,
  rimPct:z('Restricted Area').fg/z('Restricted Area').fga,
  paintPct:z('In The Paint (Non-RA)').fg/z('In The Paint (Non-RA)').fga,
  outsideMidPct:z('Mid-Range').fg/z('Mid-Range').fga,
  rimShare:152/383,paintShare:77/383,midShare:79/383,cornerShare:13/383,aboveBreakShare:62/383
});
// Diagnostic bands: 77–152 historical attempts cannot identify exact zone skill.
// Three dunks and 13 corner attempts do not support precise separate skill fits.
const tolerances={pts:1.5,fga:1.2,tpa:.5,fta:.8,orb:.3,drb:.6,ast:.8,stl:.35,blk:.25,tov:.6,pf:.5,
  fg:.035,tp:.04,ft:.035,rimPct:.05,paintPct:.06,outsideMidPct:.05,
  rimShare:.025,paintShare:.025,midShare:.025,cornerShare:.012,aboveBreakShare:.025};
const before=evaluateLin(old),after=evaluateLin(card);
for(const[k,tolerance]of Object.entries(tolerances))assert.ok(Math.abs(after.measured[k]-target[k])<=tolerance,k+': '+after.measured[k]+' vs '+target[k]);
for(const[style,measured]of Object.entries(after.byStyle))for(const[k,tolerance]of Object.entries(tolerances)) {
  assert.ok(Math.abs(measured[k]-target[k])<=tolerance*1.5,style+' '+k+': '+measured[k]+' vs '+target[k]);
}
const zoneError=a=>Math.sqrt(['rimPct','paintPct','outsideMidPct'].reduce((s,k)=>s+(a[k]-target[k])**2,0)/3);
assert.ok(zoneError(after.measured)<zoneError(before.measured)*.8,'Zone accuracy must improve materially against the previous build');
const report={target,tolerances,before,after,zoneRmse:{before:zoneError(before.measured),after:zoneError(after.measured)},overall,potential,source:source.source,card};
await writeFile(new URL('./jeremy-lin-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({measured:after.measured,zoneRmse:report.zoneRmse,gamesPerBuild:after.games,overall,potential},null,2));
console.log('Lin source, card parity, library upgrade/custom edits, identity/contracts, undo and held-out zone/box checks passed.');

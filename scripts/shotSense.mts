// Shot sense: offensive IQ decides which shots a player picks among those his game allows, never his range.
// The same players' AI targets at OIQ 30 and 70 (everything else their own), in a fresh league.
// Run: npx tsx scripts/shotSense.mts
import assert from 'node:assert/strict';
import { newLeague, rostered } from './lib/headless.mts';
import { applyCard, PRESET_CARDS } from '../src/engine/playerCard';
import { OIQ_MID, senseLine, shotSense, targetTen, ZONE_TEN } from '../src/engine/tendencies';

const P = rostered(newLeague(7));
const at = (p: any, oiq: number) => targetTen({ ...p, r: { ...p.r, oiq }, tenLock: false }, null);
const mean = (S: any[], oiq: number, f: (t: any) => number) => S.reduce((a, p) => a + f(at(p, oiq)), 0) / S.length;
const hard = (t: any) => t.pullup + t.step + t.fade;

// A league-typical decision-maker is untouched.
const s0 = shotSense({ r: { oiq: OIQ_MID }, pers: {} });
assert.equal(s0.sharp, 1);
assert.ok(s0.bad === 0);
assert.equal(s0.b3, 0);

// Guards and wings: a poor decision-maker takes more tough jumpers and fewer catch-and-shoot and rim shots.
const perim = P.filter(p => p.grp !== 'B');
assert.ok(perim.length > 150);
const [h30, h70] = [mean(perim, 30, hard), mean(perim, 70, hard)];
assert.ok(h30 - h70 > 12, `tough jumpers ${h30.toFixed(1)} vs ${h70.toFixed(1)}`);
assert.ok(mean(perim, 30, t => t.cns) < mean(perim, 70, t => t.cns) - 12);
assert.ok(mean(perim, 30, t => t.mid) > mean(perim, 70, t => t.mid) + 2);
assert.ok(mean(perim, 30, t => t.ra) < mean(perim, 70, t => t.ra) - 3);

// A center who can't shoot still doesn't take threes or mid-range jumpers, however low his IQ; he forces paint shots instead.
const bigs = P.filter(p => p.grp === 'B' && p.r.tp < 35 && p.r.fg < 45);
assert.ok(bigs.length >= 15, `${bigs.length} non-shooting bigs`);
const three = (t: any) => t.c3 + t.atb;
assert.ok(mean(bigs, 30, three) < 3, `threes ${mean(bigs, 30, three).toFixed(1)}`);
assert.ok(Math.abs(mean(bigs, 30, three) - mean(bigs, 70, three)) < 0.6);
assert.ok(mean(bigs, 30, t => t.mid) < 6);
assert.ok(mean(bigs, 30, t => t.mid) - mean(bigs, 70, t => t.mid) < 1.5);
assert.ok(mean(bigs, 30, t => t.paint) > mean(bigs, 70, t => t.paint) + 4);
// Nobody under 35 from three gets the gunner's three-point belief.
for (const p of P.filter(q => q.r.tp < 35))
  assert.equal(shotSense({ ...p, r: { ...p.r, oiq: 20 }, pers: { alpha: true, heat: true } }).b3, 0);

// A low-IQ gunner with a shaky three (40–50) takes more threes above the break than a team-first one.
const shaky = P.filter(p => p.grp !== 'B' && p.r.tp >= 40 && p.r.tp < 50).slice(0, 40);
assert.ok(shaky.length >= 10);
const atbWith = (pers: any) =>
  shaky.reduce((a, p) => a + targetTen({ ...p, r: { ...p.r, oiq: 28 }, pers: { ...pers }, tenLock: false }, null).atb, 0) / shaky.length;
assert.ok(atbWith({ alpha: true }) > atbWith({ team: true }) + 3);

// The profile's phrase.
const g = P.find(p => p.grp !== 'B')!;
assert.match(senseLine({ ...g, r: { ...g.r, oiq: 30 } }), /Poor shot selection/);
assert.match(senseLine({ ...g, r: { ...g.r, oiq: 75 } }), /Picks his spots/);
assert.equal(senseLine({ ...g, r: { ...g.r, oiq: OIQ_MID } }), '');
assert.equal(senseLine({ ...g, r: { ...g.r, oiq: 30 }, tenLock: true }), '');
// A ready-made card keeps its authored shot mix: applied now, the AI's refresh lands on it; anchored before shot sense
// (no tenBase.sense), a lower IQ doesn't move it either.
const card = PRESET_CARDS[25].card;
const holder: any = { ...structuredClone(card), id: 951, name: 'Holder', age: 25, grp: 'G', tid: 0, stats: [], amt: 4, exp: 2028 };
assert.equal(applyCard(holder, structuredClone(card), {}), '');
assert.equal(holder.tenBase.sense, 1);
const zonesOf = (t: any) => ZONE_TEN.map(k => t[k]);
zonesOf(targetTen(holder, null)).forEach((v, i) => assert.ok(Math.abs(v - zonesOf(holder.tenBase.ten)[i]) < 0.6, `zone ${ZONE_TEN[i]}`));
delete holder.tenBase.sense;
const before = zonesOf(targetTen(holder, null)),
  lowIq = zonesOf(targetTen({ ...holder, r: { ...holder.r, oiq: 20 } }, null));
before.forEach((v, i) => assert.ok(Math.abs(v - lowIq[i]) < 1.5, `old anchor ${ZONE_TEN[i]} ${v} → ${lowIq[i]}`));
console.log('shot sense ok');

// Overall-weight migration (2026-11-08): a save records the weights its overalls were computed with (db.ovrW). When
// ratings.ts OVR_W / FEEL_W / OVR_ADJ change, loading recomputes every overall and moves potential with it, so a new
// measurement needs no hand-written migration. Checks: a new league records today's weights; a save at today's
// weights loads unchanged; a save made with other weights is recomputed (overall = today's formula, growth room kept);
// an older save without db.ovrW is taken as today's weights.
//
//   npx tsx scripts/ovrMigration.mts
import { Game } from '../src/engine/Game';
import { ovrExact, ovrWeights, sameOvrWeights, overallWith } from '../src/engine/ratings';
import { newLeague } from './lib/headless.mts';

const fail: string[] = [],
  ok = (c: boolean, m: string) => {
    if (!c) fail.push(m);
  };
const g: any = newLeague(5);
ok(!!g.db.ovrW && sameOvrWeights(g.db.ovrW, ovrWeights()), "a new league records today's overall weights");
const save = () => JSON.parse(JSON.stringify({ db: { ...g.db, C: undefined }, state: g.state }));
const live = (x: any) => (Object.values(x.db.P) as any[]).filter(p => p?.r && !p.gone);

// 1. Today's weights: the weights step moves nothing (other load steps may: the same with or without it).
const ref = new Map<number, number>(),
  touched = new Set<number>(); // touched: changed by other load steps (some prospects)
{
  const d = save(),
    was = new Map(live(d).map(p => [p.id, [p.ovr, p.tpot]]));
  delete d.db.ovrW;
  const h0: any = Game.load(d);
  live(h0).forEach(p => {
    ref.set(p.id, p.ovr);
    const x = was.get(p.id);
    if (!x || x[0] !== p.ovr || x[1] !== p.tpot) touched.add(p.id);
  });
}
{
  const h: any = Game.load(save());
  ok(
    live(h).every(p => p.ovr === ref.get(p.id)) && h.migrateOverallWeights() === 0,
    "a save at today's weights loads with the same overalls",
  );
}

// 2. Made with other weights (a guard's Defensive IQ worth half as much, bigs' height more): recomputed on load.
{
  const d = save(),
    w = ovrWeights();
  w.W.G.diq *= 0.5;
  w.W.B.hgt *= 1.3;
  w.A.G += 0.5;
  d.db.ovrW = w;
  // The save's overalls as those weights would have made them (and potential the same distance above).
  const room = new Map<number, number>(),
    was = new Map<number, number>();
  live(d).forEach(p => {
    const o = Math.round(overallWith(p, w));
    was.set(p.id, o);
    if (p.tpot != null && p.tpot > 5 && p.tpot < 95 && !p.retired && !touched.has(p.id)) room.set(p.id, p.tpot - o);
  });
  const h: any = Game.load(d),
    ps = live(h);
  ok(
    ps.every(p => p.ovr === Math.round(ovrExact(p)) || p.ovr === Math.max(1, Math.min(100, Math.round(ovrExact(p))))),
    "every overall is today's formula after loading",
  );
  ok(sameOvrWeights(h.db.ovrW, ovrWeights()), "the save now records today's weights");
  const guards = ps.filter(p => p.grp === 'G' && p.r.diq >= 60);
  ok(
    guards.length > 20 && guards.filter(p => p.ovr > was.get(p.id)!).length > guards.length * 0.5,
    'good defensive guards gain overall when Defensive IQ counts for more again',
  );
  const kept = ps.filter(p => room.has(p.id) && p.tpot != null && p.tpot - p.ovr === Math.max(0, room.get(p.id)!)).length; // (a declining veteran already past his true potential is held at it: refreshPot)
  ok(kept === room.size, 'true potential moves with the overall (growth room kept): ' + kept + ' of ' + room.size);
}

// 3. An older save without recorded weights is taken as today's.
{
  const d = save();
  delete d.db.ovrW;
  const h: any = Game.load(d);
  ok(
    sameOvrWeights(h.db.ovrW, ovrWeights()) && live(h).every(p => p.ovr === ref.get(p.id)),
    "a save without recorded weights keeps its overalls and records today's",
  );
}

if (fail.length) {
  console.log('FAIL\n  ' + fail.join('\n  '));
  process.exit(1);
}
console.log('Overall-weight migration passed: new leagues, unchanged saves, re-weighted saves (overall and potential), older saves.');

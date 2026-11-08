// Overall-weight migration (2026-11-08): a save records the weights its overalls were computed with (db.ovrW). When
// ratings.ts OVR_W / FEEL_W / OVR_ADJ change, loading recomputes every overall and moves potential with it, so a new
// measurement needs no hand-written migration. Checks: a new league records today's weights; a save at today's weights
// loads unchanged; a save made with other weights is recomputed (overall = today's formula, growth room kept); a save
// from before db.ovrW is taken as made with the 2026-11-05 weights (ovrWeightsV8) and recomputed the same way.
//
//   npx tsx scripts/ovrMigration.mts
import { Game } from '../src/engine/Game';
import { ovrExact, ovrWeights, ovrWeightsV8, sameOvrWeights, overallWith, type OvrWeights } from '../src/engine/ratings';
import { newLeague } from './lib/headless.mts';

const fail: string[] = [],
  ok = (c: boolean, m: string) => {
    if (!c) fail.push(m);
  };
const g: any = newLeague(5);
ok(!!g.db.ovrW && sameOvrWeights(g.db.ovrW, ovrWeights()), "a new league records today's overall weights");
const save = () => JSON.parse(JSON.stringify({ db: { ...g.db, C: undefined }, state: g.state }));
const live = (x: any) => (Object.values(x.db.P) as any[]).filter(p => p?.r && !p.gone);

// 1. Today's weights: the weights step moves nothing (other load steps may; `touched` marks who they change).
const ref = new Map<number, number>(),
  touched = new Set<number>();
{
  const d = save(),
    was = new Map(live(d).map(p => [p.id, [p.ovr, p.tpot]]));
  const h: any = Game.load(d);
  live(h).forEach(p => {
    ref.set(p.id, p.ovr);
    const x = was.get(p.id);
    if (!x || x[0] !== p.ovr || x[1] !== p.tpot) touched.add(p.id);
  });
  ok(h.migrateOverallWeights() === 0 && sameOvrWeights(h.db.ovrW, ovrWeights()), "a save at today's weights loads unchanged");
}

// 2 and 3: a save made with other weights, recorded or (before db.ovrW) not, is recomputed on load.
function migrates(label: string, w: OvrWeights, recorded: boolean) {
  const d = save();
  if (recorded) d.db.ovrW = w;
  else delete d.db.ovrW;
  const room = new Map<number, number>();
  live(d).forEach(p => {
    if (p.tpot != null && p.tpot > 5 && p.tpot < 95 && !p.retired && !touched.has(p.id))
      room.set(p.id, p.tpot - Math.round(overallWith(p, w)));
  });
  const h: any = Game.load(d),
    ps = live(h);
  ok(
    ps.every(p => p.ovr === Math.max(1, Math.min(100, Math.round(ovrExact(p))))),
    label + ": every overall is today's formula after loading",
  );
  ok(sameOvrWeights(h.db.ovrW, ovrWeights()), label + ": the save now records today's weights");
  const kept = ps.filter(p => room.has(p.id) && p.tpot != null && p.tpot - p.ovr === Math.max(0, room.get(p.id)!)).length; // a declining veteran past his true potential is held at it (refreshPot)
  ok(kept === room.size, label + ': true potential moves with the overall (growth room kept): ' + kept + ' of ' + room.size);
  return ps;
}
{
  const w = ovrWeights();
  w.W.G.diq *= 0.5;
  w.W.B.hgt *= 1.3;
  w.A.G += 0.5;
  const ps = migrates('recorded other weights', w, true);
  const guards = ps.filter(p => p.grp === 'G' && p.r.diq >= 60);
  ok(
    guards.length > 20 && guards.filter(p => ovrExact(p) > overallWith(p, w)).length > guards.length * 0.5,
    'good defensive guards gain overall when Defensive IQ counts for more again',
  );
}
migrates('a save from before db.ovrW', ovrWeightsV8(), false);

if (fail.length) {
  console.log('FAIL\n  ' + fail.join('\n  '));
  process.exit(1);
}
console.log(
  'Overall-weight migration passed: new leagues, unchanged saves, re-weighted saves (overall and potential), saves from before db.ovrW.',
);

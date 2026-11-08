import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { GameSim } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
const g = newLeague(101);
const home = g.simTeam(g.state, 0),
  away = g.simTeam(g.state, 1);
for (const team of [home, away]) {
  team.players = team.players.slice(0, 5);
  for (const p of team.players) {
    for (const k of ['hgt', 'reb', 'box', 'jmp']) p.r[k] = 55;
    p.r.ape = 4;
    p.fat = 0;
    p.rr = {};
    p.roles = [];
  }
}
function rebounds(offBox: number, defBox: number, offReb = 55, defReb = 55) {
  const a = structuredClone(home),
    b = structuredClone(away);
  a.players.forEach(p => {
    p.r.box = offBox;
    p.r.reb = offReb;
  });
  b.players.forEach(p => {
    p.r.box = defBox;
    p.r.reb = defReb;
  });
  Math.random = mulberry32(71717);
  const sim: any = new GameSim(a, b, { norms: g.db.norms });
  let total = 0;
  for (let i = 0; i < 40000; i++) total += +sim.rebound(sim.home, sim.away, sim.on.home, sim.on.away, 0, () => {});
  for (const side of [sim.home, sim.away]) for (const p of Object.values(side.box) as any[]) assert.ok(p.orb >= 0 && p.drb >= 0);
  return total / 40000;
}
const neutral = rebounds(55, 55),
  offensiveBox = rebounds(85, 55),
  defensiveBox = rebounds(55, 85),
  offensiveSkill = rebounds(55, 55, 85, 55),
  defensiveSkill = rebounds(55, 55, 55, 85);
assert.ok(neutral > 0.24 && neutral < 0.28, 'matched glass skill stays near league baseline');
assert.ok(offensiveBox > neutral && defensiveBox < neutral, 'box-outs affect team rebound control');
assert.ok(offensiveSkill > neutral && defensiveSkill < neutral, 'rebounding skill still changes possession control');
console.log(JSON.stringify({ neutral, offensiveBox, defensiveBox, offensiveSkill, defensiveSkill }));

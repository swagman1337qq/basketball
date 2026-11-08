// Check the actual possession model's response to rim protection at different openings.
import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { closeDefenseAdjustment } from '../src/engine/finishing';
import { GameSim } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
const g = newLeague(101),
  off = g.simTeam(g.state, 0),
  def = g.simTeam(g.state, 1);
for (const team of [off, def]) {
  team.players = team.players.slice(0, 5);
  team.tactics = {};
  team.aiKeys = [];
  for (const p of team.players) {
    for (const key of Object.keys(p.r)) if (key !== 'ape') p.r[key] = 55;
    p.r.endu = 99;
    p.target = 48;
    p.roles = [];
    p.rr = {};
    p.feel = 50;
    p.dtd = false;
    p.adj = false;
    p.conf = 50;
    p.fat = 0;
    p.tend = { ...p.tend, dunk: 0 };
  }
}
const bins: any = {};
for (const level of [35, 75])
  for (let k = 0; k < 160; k++) {
    const defense = structuredClone(def);
    for (const p of defense.players) p.r.blk = level;
    Math.random = mulberry32(17821 + k * 313);
    new GameSim(off, defense, {
      norms: g.db.norms,
      onShot: e => {
        if (!off.players.some(p => p.id === e.shooterId) || e.fouled || e.zone !== 'rim' || e.technique !== 'layup') return;
        const key = level + '/' + e.contest,
          z = (bins[key] ||= { n: 0, p: 0 });
        z.n++;
        z.p += e.probability;
      },
    }).run();
  }
const chance = (level: number, c: string) => {
  const z = bins[level + '/' + c];
  assert.ok(z.n > 100);
  return z.p / z.n;
};
const openPenalty = chance(35, 'open') - chance(75, 'open'),
  contestedPenalty = chance(35, 'contested') - chance(75, 'contested');
assert.ok(contestedPenalty > 0.04, 'strong rim protection must still matter on a contested finish');
assert.ok(openPenalty >= -0.01 && openPenalty < contestedPenalty * 0.65, 'getting open must reduce the rim protector’s execution effect');
assert.ok(chance(75, 'open') > chance(75, 'contested'), 'an open layup must remain easier against the same defense');
console.log(JSON.stringify({ openPenalty, contestedPenalty, bins }));

// Across weak and strong defenses, an otherwise identical opening never hurts.
for (const paint of [false, true])
  for (let d = -0.5; d <= 0.5; d += 0.001) {
    const open = closeDefenseAdjustment(d, 'open', paint),
      pressure = closeDefenseAdjustment(d, 'pressured', paint),
      contest = closeDefenseAdjustment(d, 'contested', paint);
    assert.ok(open <= pressure + 1e-12 && pressure <= contest + 1e-12);
  }
assert.ok(chance(35, 'open') >= chance(35, 'contested') - 0.01, 'weak rim protection must not reverse the opening advantage');

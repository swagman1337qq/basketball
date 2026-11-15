// Recording must preserve gameplay and reconcile every view to the saved box.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
import { periodBox } from '../src/ui/modals/BoxScoreDetails';

const random = Math.random;
try {
  Math.random = mulberry32(349);
  const g = Game.create(349, [0]);
  const teams = [g.simTeam(g.state, 0), g.simTeam(g.state, 1)];
  let overtime = 0;
  for (let seed = 0; seed < 20; seed++) {
    Math.random = mulberry32(seed);
    const plain = new GameSim(structuredClone(teams[0]), structuredClone(teams[1]), { norms: g.db.norms }).run();
    const next = Math.random();
    Math.random = mulberry32(seed);
    const recorded = new GameSim(structuredClone(teams[0]), structuredClone(teams[1]), { norms: g.db.norms, record: true }).run();
    const { details, ...result } = recorded;
    assert.deepEqual(result, plain, 'Recording must preserve the game result');
    assert.equal(Math.random(), next, 'Recording must consume no extra randomness');
    assert(details);
    const id = g.keepBox(recorded, seed);
    const box = JSON.parse(JSON.stringify(g.db.boxes[id]));
    overtime += recorded.ot;
    for (const side of ['home', 'away'] as const) {
      const lineTotal = (field: string) => box[side].lines.reduce((n: number, l: number[]) => n + l[1 + Game.BOX_F.indexOf(field)], 0);
      assert.equal(
        details.timeline.reduce((n, x) => n + x[side === 'home' ? 4 : 5], 0),
        box[side].pts,
      );
      const shots = details.shots.filter(x => x.side === side);
      assert.equal(shots.length, lineTotal('fga'));
      assert.equal(shots.filter(x => x.made).length, lineTotal('fgm'));
      for (let q = 0; q < box[side].qs.length; q++) {
        const split = periodBox(box, q < 4 ? 'Q' + (q + 1) : 'OT' + (q - 3));
        assert.equal(split[side].pts, box[side].qs[q]);
        assert.equal(
          split[side].lines.reduce((n: number, l: number[]) => n + l[2], 0),
          box[side].qs[q],
        );
        assert(
          details.pbp.some(e => e.q === q + 1),
          'Retain play-by-play from every period',
        );
      }
      for (const line of box[side].lines) {
        const pm = details.timeline.reduce(
          (n, x) => n + (x[side === 'home' ? 2 : 3].includes(line[0]) ? (side === 'home' ? 1 : -1) * (x[4] - x[5]) : 0),
          0,
        );
        assert.equal(pm, line[1 + Game.BOX_F.indexOf('pm')], 'Every rotation timeline matches the player plus/minus');
      }
    }
    for (const event of details.pbp) {
      if (event.ids?.length)
        assert.equal(event.side, recorded.away.box[event.ids[0]] ? 'away' : 'home', "Events belong to the acting player's team");
    }
    for (const half of ['H1', 'H2']) {
      const split = periodBox(box, half),
        offset = half === 'H1' ? 0 : 2;
      for (const side of ['home', 'away']) assert.equal(split[side].pts, box[side].qs[offset] + box[side].qs[offset + 1]);
    }
  }
  assert(overtime > 0, 'Include overtime in the recorded-game sample');
  console.log(
    'PASS: 20 identical games, unchanged RNG, shots, quarters/halves/OT, full play-by-play, save round-trip and every player rotation reconcile.',
  );
} finally {
  Math.random = random;
}

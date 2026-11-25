// Games played in the background (2026-11-25, engine/gamePool.ts, Game.runPooledDay): the same league as playing them
// on the page. A stand-in pool plays each game in-process when it's sent, so with the same random numbers both paths
// must give identical saves; a pool whose workers fail still records every game (played on the page instead); the
// redraw control backs off when redraws cost the sim time and comes back when they don't.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
import { createPool, poolSize, setGamePool, type GamePool } from '../src/engine/gamePool';

const base = Game.create(91, [0]);
base.setState({ gmSetup: false, easy: { lineup: true, tactics: true, cap: true, fa: true, draft: true, fire: true, scouting: true } });
const snap = JSON.stringify(base.toSave());
const fresh = () => {
  const g: any = Game.load(JSON.parse(snap));
  g.mailWaiting = () => 0;
  return g;
};
// Mailbox message ids carry the clock time (preFA.ts addNotice): left out of the comparison.
const hash = (g: any) =>
  createHash('sha256')
    .update(JSON.stringify(g.toSave(), (k, v) => (k === 'id' && typeof v === 'string' && /^n\d+-\d+$/.test(v) ? 'n' : v)))
    .digest('hex');
const DAYS = 12;

// On the page (no pool: node has no workers).
setGamePool(null);
const a = fresh();
Math.random = mulberry32(5);
await a.sim(DAYS);

// In the background (a stand-in pool that plays each game when it's sent).
let played = 0;
const inline: GamePool = {
  size: 3,
  play: (home, away, norms) => {
    played++;
    return Promise.resolve({ res: new GameSim(home, away, { record: true, norms }).run() });
  },
  dispose() {},
};
setGamePool(inline);
const b = fresh();
Math.random = mulberry32(5);
await b.sim(DAYS);
assert.equal(b.state.day, a.state.day, 'same days played');
assert.ok(played > 0, 'games went to the pool');
assert.equal(hash(b), hash(a), 'identical league: every stat, record and box score');
console.log('same league after', DAYS, 'days,', played, 'games played by the pool');

// Workers that fail: the page plays those games instead; every scheduled game is recorded.
let n = 0;
const flaky: GamePool = {
  size: 2,
  play: (home, away, norms) =>
    ++n % 3 === 0
      ? Promise.reject(new Error('worker lost'))
      : Promise.resolve({ res: new GameSim(home, away, { record: true, norms }).run() }),
  dispose() {},
};
setGamePool(flaky);
const c = fresh();
await c.sim(DAYS);
const scheduled = c.db.days.slice(0, c.state.day).reduce((t: number, d: any[]) => t + d.length, 0);
assert.equal(c.state.games.length, scheduled, 'every scheduled game recorded');
assert.equal(
  c.state.teams.reduce((t: number, x: any) => t + x.w + x.l, 0),
  scheduled * 2,
);
console.log('with failing workers:', scheduled, 'games recorded');

// Pool size: none below 3 cores, one per core but one, at most four.
assert.deepEqual([1, 2, 3, 4, 8, 16].map(poolSize), [0, 0, 2, 3, 4, 4]);
// A pool whose workers can't be made plays nothing (the page takes over).
const broken = createPool(2, () => {
  throw new Error('no workers here');
});
await assert.rejects(broken.play({} as any, {} as any, {} as any));

// The redraw control: when the day's last result waits on the page because of a redraw, redraws space out; when they
// don't hold anything up, they come back to every day.
const g: any = fresh();
const L = g.live;
const day = (late: number, drew: boolean) => {
  L.drew = drew;
  g.notePooledDay(100, late);
};
for (let i = 0; i < 6; i++) day(0, false);
for (let i = 0; i < 6; i++) day(30, true); // a redraw holds the day up 30 ms out of 100
assert.ok(L.k >= Math.ceil(25 / (Game.LIVE_COST * 100)), 'expensive redraws: every few days (k ' + L.k + ')'); // held up ~30 ms of 100
for (let i = 0; i < 30; i++) day(0.5, true); // nothing held up
assert.equal(L.k, 1, 'free redraws: every day');
setGamePool(undefined);
console.log('ok gamePool');

// The game's rules when games are played in the background (2026-11-26, engine/gamePool.ts): God Mode's forced wins,
// your Live Game's result, Stop, the mail stop, changes made mid-sim and the season's bookkeeping all hold. A stand-in
// pool plays each game in-process (node has no workers), at the moment it's sent, as a real pool would.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { GameSim } from '../src/engine/sim';
import { setGamePool, type GamePool } from '../src/engine/gamePool';

let sent = 0;
const inline: GamePool = {
  size: 3,
  play: (home, away, norms) => {
    sent++;
    return Promise.resolve({ res: new GameSim(home, away, { record: true, norms }).run() });
  },
  dispose() {},
};
setGamePool(inline);
const base = Game.create(93, [0]);
base.setState({ gmSetup: false, easy: { lineup: true, tactics: true, cap: true, fa: true, draft: true, fire: true, scouting: true } });
const snap = JSON.stringify(base.toSave());
const fresh = () => {
  const g: any = Game.load(JSON.parse(snap));
  g.mailWaiting = () => 0;
  return g;
};

// God Mode forced wins: every picked winner wins, the rest of the day is played in the background.
{
  const g = fresh(),
    godWin: Record<string, number> = {};
  const picks: [number, number, number, number][] = [];
  for (let d = 0; d < 6; d++)
    for (const [h, a] of g.db.days[d] || []) {
      if ((h + a + d) % 3) continue;
      const w = (h + d) % 2 ? h : a;
      godWin[g.Y + ':' + d + ':' + h + ':' + a] = w;
      picks.push([d, h, a, w]);
    }
  g.setState({ god: true, godWin });
  sent = 0;
  await g.sim(6);
  for (const [d, h, a, w] of picks) {
    const x = g.state.games.find((r: any) => r.day === d && r.h === h && r.a === a);
    assert.ok(x, 'forced game played');
    assert.equal(x.hp > x.ap ? h : a, w, 'the picked team won');
  }
  assert.ok(sent > 0, 'the other games went to the pool');
  console.log('forced wins:', picks.length, 'held; ', sent, 'other games in the background');
}
// Your Live Game: its finished result is the one recorded; the day's other games are played in the background.
{
  const g = fresh(),
    me = g.state.me,
    d = g.db.days.findIndex((games: any[]) => games.some(([h, a]: number[]) => h === me || a === me)),
    [h, a] = g.db.days[d].find(([x, y]: number[]) => x === me || y === me);
  if (d > 0) await g.sim(d);
  const live = g.playGame(g.state, h, a);
  sent = 0;
  await g.sim(1, live);
  const x = g.state.games.find((r: any) => r.day === d && r.h === h && r.a === a);
  assert.equal(x.hp, live.home.pts);
  assert.equal(x.ap, live.away.pts);
  assert.equal(sent, g.db.days[d].length - 1, 'every other game that day in the background');
  console.log('live game recorded as played:', x.hp + '-' + x.ap);
}
// Stop finishes the day in progress; nothing after it is played.
{
  const g = fresh();
  const p = g.sim(20);
  for (let i = 0; i < 1000 && !g.dayInProgress; i++) await new Promise(r => setTimeout(r, 0));
  assert.ok(g.dayInProgress, 'a day is being played');
  const d0 = g.state.day;
  g.stopSim();
  await p;
  assert.equal(g.state.day, d0 + 1, 'stopped after the day in progress');
  assert.equal(g.busy, false);
  const played = g.db.days.slice(0, g.state.day).reduce((t: number, x: any[]) => t + x.length, 0);
  assert.equal(g.state.games.length, played, 'every game of the finished days recorded, nothing half-done');
  console.log('stop: finished day', g.state.day);
}
// New mail stops the sim after the day it arrives.
{
  const g = fresh();
  let n = 0;
  g.mailWaiting = () => (n++ > 2 ? 1 : 0);
  await g.sim(20);
  assert.ok(g.state.day < 20 && g.state.day >= 1, 'held for mail (day ' + g.state.day + ')');
  console.log('mail stop at day', g.state.day);
}
// A change made while a day is being played waits for that day, then applies; navigation applies at once.
{
  const g = fresh();
  const p = g.sim(4);
  for (let i = 0; i < 1000 && !g.dayInProgress; i++) await new Promise(r => setTimeout(r, 0));
  let seen = -1;
  if (g.dayInProgress) {
    g.setState({ screen: 'leaders' });
    assert.equal(g.state.screen, 'leaders', 'navigation at once');
    const d0 = g.state.day;
    g.setState((st: any) => {
      seen = st.day;
      return null;
    });
    assert.equal(seen, -1, 'the change waits for the day');
    await p;
    assert.ok(seen > d0, 'and then sees the finished day');
  } else assert.fail('no day in progress to test');
  console.log('queued change saw day', seen);
}
// 120 days in the background, through the trade deadline and All-Star Weekend: the same league as on the page. The two
// leagues are played a day at a time side by side, each with its own random numbers (run one after the other in one
// process, a cache shared by both could tell them apart: coach.ts BASE_CACHE did until 2026-11-26).
{
  const { mulberry32 } = await import('../src/engine/rng');
  const a = fresh(),
    b = fresh(),
    ra = mulberry32(17),
    rb = mulberry32(17);
  const norm = (g: any) => JSON.stringify(g.toSave(), (k, v) => (k === 'id' && typeof v === 'string' && /^n\d+-\d+$/.test(v) ? 'n' : v)); // mail ids carry the clock
  for (let d = 0; d < 120; d++) {
    setGamePool(null);
    Math.random = ra;
    await a.sim(1);
    setGamePool(inline);
    Math.random = rb;
    await b.sim(1);
  }
  assert.ok(b.state.allStars?.[b.Y], 'All-Star Weekend held');
  assert.ok(norm(a) === norm(b), 'the same league as on the page after 120 days');
  const T = b.state.teams;
  assert.equal(
    T.reduce((t: number, x: any) => t + x.w, 0),
    T.reduce((t: number, x: any) => t + x.l, 0),
  );
  assert.equal(
    b.state.games.length,
    b.db.days.slice(0, b.state.day).reduce((t: number, x: any[]) => t + x.length, 0),
  );
  console.log('120 days: identical league,', b.state.games.length, 'games');
}
setGamePool(undefined);
console.log('ok gamePoolRules');

import { computeNorms } from '../src/engine/norms';
// Production NBA/CCP/amateur finishing integration, without forced makes or boxes.
// Run: npx tsx scripts/finishingIntegration.mts
import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { Game } from '../src/engine/Game';
import { GameSim, type ShotEvent } from '../src/engine/sim';
import { mulberry32 } from '../src/engine/rng';
import { ccpQuickGame } from '../src/engine/ccp';
import { seasonLine } from '../src/engine/amateurStats';
import { shapeFromStats } from '../src/engine/historical';
import { applyCard, PRESET_CARDS } from '../src/engine/playerCard';

const TYPES = ['dunk', 'layup', 'floater', 'hook', 'tip', 'paintJump'];
const sum = (rows: any[], key: string) => rows.reduce((s, b) => s + (b[key] || 0), 0);
function boxChecks(result: any, label: string) {
  for (const side of [result.home, result.away]) {
    const rows = Object.values(side.box) as any[];
    assert.equal(sum(rows, 'pts'), side.pts, label + ' player/team points');
    for (const b of rows) {
      for (const [key, value] of Object.entries(b)) if (typeof value === 'number') assert.ok(Number.isFinite(value), label + ' finite ' + key);
      assert.equal(b.pts, 2 * (b.fgm - b.tpm) + 3 * b.tpm + b.ftm, label + ' scoring identity');
      assert.equal(b.fga, b.ra + b.ma + b.ca + b.ba, label + ' zone attempts');
      assert.equal(b.fgm, b.rm + b.mm + b.cm + b.bm, label + ' zone makes');
      assert.equal(b.tpa, b.ca + b.ba, label + ' three attempts');
      assert.equal(b.tpm, b.cm + b.bm, label + ' three makes');
      assert.ok(b.ka <= b.ma && b.km <= b.mm && b.km <= b.ka, label + ' paint is a mid-tier subset');
      for (const type of TYPES) assert.ok(b[type + 'M'] <= b[type + 'A'], label + ' ' + type + ' makes/attempts');
      assert.equal(TYPES.reduce((s, t) => s + b[t + 'A'], 0), b.finishRaA + b.finishPaintA, label + ' technique attempts');
      assert.equal(TYPES.reduce((s, t) => s + b[t + 'M'], 0), b.rm + b.km, label + ' technique makes');
      assert.equal(b.finishRaA, b.ra, label + ' RA tracking');
      assert.equal(b.finishPaintA, b.ka, label + ' paint tracking');
      assert.ok(b.closeFoulA <= b.shotFoulA, label + ' close foul subset');
    }
  }
}

const g: any = newLeague(101), s = g.state;
const home = g.simTeam(s, 0), away = g.simTeam(s, 1);
const observed: ShotEvent[] = [];
for (let seed = 21000; seed < 21020; seed++) {
  const run = (pbp: boolean, observer?: (e: Readonly<ShotEvent>) => void) => {
    Math.random = mulberry32(seed);
    return new GameSim(structuredClone(home), structuredClone(away), { norms: g.db.norms, pbp, onShot: observer }).run();
  };
  const events: ShotEvent[] = [], quick = run(false, e => events.push(structuredClone(e))), live = run(true);
  assert.deepEqual(quick, live, 'same-seed watched and quick games must agree');
  boxChecks(quick, 'NBA seed ' + seed);
  const allRows = { ...quick.home.box, ...quick.away.box } as Record<number, any>;
  for (const [pid, b] of Object.entries(allRows)) {
    const shots = events.filter(e => e.shooterId === +pid);
    assert.equal(shots.filter(e => e.attempt).length, b.fga, 'event/FGA reconciliation');
    assert.equal(shots.filter(e => e.made).length, b.fgm, 'event/FGM reconciliation');
    assert.equal(shots.filter(e => e.fouled).length, b.shotFoulA, 'event/foul reconciliation');
  }
  for (const event of events) {
    assert.ok(event.probability >= 0 && event.probability <= 1);
    if (!event.attempt) assert.ok(event.fouled && !event.made, 'only a missed shooting foul removes the FGA');
    if (event.blocked) assert.ok(event.attempt && !event.made && !event.fouled, 'a block is an ordinary missed attempt');
    if (event.fouled && event.made) assert.ok(event.attempt, 'an and-one remains a field goal');
    if (event.technique === 'dunk') assert.equal(event.zone, 'rim', 'no long-range dunk');
  }
  observed.push(...events);
}
assert.ok(observed.some(e => e.fouled && !e.made), 'missed-foul branch exercised');
assert.ok(observed.some(e => e.fouled && e.made), 'and-one branch exercised');
assert.ok(observed.some(e => e.blocked), 'blocked branch exercised');
assert.ok(observed.some(e => e.origin === 'putback'), 'immediate putback branch exercised');
const rim = observed.filter(e => e.zone === 'rim' && e.technique === 'layup' && !e.fouled);
const averageChance = (contest: ShotEvent['contest']) => {
  const shots = rim.filter(e => e.contest === contest);
  assert.ok(shots.length >= 20, contest + ' layups exercised');
  return shots.reduce((sum, shot) => sum + shot.probability, 0) / shots.length;
};
assert.ok(averageChance('open') > averageChance('contested'), 'open layups are easier than contested ones');
assert.ok(observed.some(e => e.action === 'roll' && e.help === 'at-rim' && e.helperId != null));
assert.ok(observed.some(e => e.action === 'cut' && e.help === 'stays-home'));
for (const e of observed) {
  assert.equal(e.helperId == null, e.help === 'stays-home');
  if (e.technique === 'dunk') assert.equal(e.contest, 'open', 'a dunk requires a clear gather');
}

// A zero frequency remains zero in both engines, even for capable dunkers.
const noDunkHome = structuredClone(home), noDunkAway = structuredClone(away);
for (const team of [noDunkHome, noDunkAway]) for (const p of team.players) p.tend = { ...p.tend, dunk: 0 };
for (let seed = 22000; seed < 22020; seed++) {
  Math.random = mulberry32(seed);
  const nba = new GameSim(structuredClone(noDunkHome), structuredClone(noDunkAway), { norms: g.db.norms }).run();
  boxChecks(nba, 'NBA zero preference');
  assert.equal(sum([...Object.values(nba.home.box), ...Object.values(nba.away.box)], 'dunkA'), 0);
  Math.random = mulberry32(seed);
  const ccp = ccpQuickGame(g, structuredClone(noDunkHome), structuredClone(noDunkAway));
  boxChecks(ccp, 'CCP zero preference');
  assert.equal(sum([...Object.values(ccp.home.box), ...Object.values(ccp.away.box)], 'dunkA'), 0);
}
for (let seed = 23000; seed < 23020; seed++) {
  Math.random = mulberry32(seed);
  boxChecks(ccpQuickGame(g, structuredClone(home), structuredClone(away)), 'CCP ordinary');
}

// Generated amateur histories use the same technique semantics and record zeros.
const p = structuredClone(g.db.P[s.rosters[0][0]]);
assert.equal(applyCard(p, PRESET_CARDS[25].card, g.db.C), '');
p.from = { team: 'Harvard', lg: 'NCAA' }; p.ten.dunk = 0; p.tenLock = true;
p.tenBase.ten.dunk = 0;
const amateur = seasonLine(p, g.Y, 0);
assert.equal(amateur.disp.dunkA, 0);
assert.equal(amateur.disp.dunkM, 0);
assert.ok((amateur.disp.layupA || 0) > 0);
for (const line of [amateur.disp, amateur.t] as any[]) {
  assert.ok(Math.abs(line.fgm - line.rm - line.mm - line.tpm) < 1e-8);
  assert.ok(Math.abs(line.fga - line.ra - line.ma - line.tpa) < 1e-8);
  assert.ok(Math.abs(TYPES.reduce((n, type) => n + line[type + 'A'], 0) - line.ra - line.ka) < 1e-8);
}

// A high college 2P% does not fabricate three independently measured abilities.
const prospect = structuredClone(p), insideBefore = prospect.r.ins, dunkBefore = prospect.r.dnk;
shapeFromStats(prospect, { pos: 'PG', real: [{ gp: 30, mp: 30, fg: 9, fga: 12, tp: 0.5, tpa: 1.5, ft: 8, fta: 10, ast: 4, trb: 4, blk: 0.2, stl: 1 }] } as any);
assert.equal(prospect.r.ins, insideBefore);
assert.equal(prospect.r.dnk, dunkBefore);
assert.ok(prospect.r.lay >= p.r.lay);

// Existing history has unknown technique counts; saving/reopening must not invent them.
const savedPlayer = g.db.P[s.rosters[0][0]];
savedPlayer.ten.dunk = 0; savedPlayer.tenLock = true;
savedPlayer.stats = [{ season: g.Y - 1, tid: 0, gp: 1, min: 30, pts: 12, fgm: 5, fga: 10, tpm: 0, tpa: 1, ftm: 2, fta: 3, rm: 3, ra: 6, mm: 2, ma: 3, cm: 0, ca: 0, bm: 0, ba: 1 }];
const reopened: any = Game.load(g.toSave()), restored = reopened.db.P[savedPlayer.id];
assert.equal(restored.ten.dunk, 0);
assert.equal(restored.tenLock, true);
assert.equal(restored.stats[0].dunkA, undefined);
assert.equal(restored.stats[0].layupA, undefined);
assert.equal(restored.stats[0].ra, 6);

console.log('Finishing integration passed: 20 watched/quick pairs, 40 zero-preference NBA/CCP games, 20 ordinary CCP games, event/stat/foul identities, amateur types, weak historical evidence and old-history save round trip.');

// Paint-only accuracy must not recenter unrelated outside-paint jumpers.
const nPlayers=home.players.slice(0,2).map((_,i)=>structuredClone(g.db.P[g.state.rosters[0][i]]));
for(let i=0;i<2;i++){delete nPlayers[i].tenBase;Object.assign(nPlayers[i].ten,{ra:0,paint:i?100:0,mid:i?0:100,c3:0,atb:0});}
const normsAt=(fg:number)=>{nPlayers[1].r.fg=fg;return computeNorms(nPlayers.map(p=>({p,min:30,tid:0,roles:[]})),2027);};
assert.ok(Math.abs(normsAt(5).offset.mid-normsAt(95).offset.mid)<1e-10,'paint-only skill must not shift jumper execution');
const boundary:any=new GameSim(structuredClone(home),structuredClone(away),{norms:g.db.norms});
boundary.t=0;boundary.afterOrb=true;boundary.orbOwner=boundary.on[boundary.pos][0];boundary.fastBreak=true;boundary.step();
assert.equal(boundary.afterOrb,false);assert.equal(boundary.orbOwner,null);assert.equal(boundary.fastBreak,false);
console.log('Paint/jumper normalization isolation and quarter-end continuation checks passed.');

const aggregateSample=new GameSim(structuredClone(home),structuredClone(away),{norms:g.db.norms}).run();
g.addBox(aggregateSample,false,undefined,undefined,g.state);
for(const side of [aggregateSample.home,aggregateSample.away])for(const k of ['dunkA','layupA','finishRaA','finishPaintA'])assert.equal(g.state.tstats[side.tid][k],sum(Object.values(side.box) as any[],k));
console.log('Team finishing aggregates reconcile with player counters.');

{
  const play = (overallDelta: number) => {
    const h = structuredClone(home), a = structuredClone(away);
    h.aiKeys = [];
    a.aiKeys = [];
    for (const p of h.players) p.ovr += overallDelta;
    Math.random = mulberry32(99111);
    return new GameSim(h, a, { norms: g.db.norms }).run();
  };
  assert.deepEqual(play(0), play(10), 'a uniform overall-only edit must not change a game with fixed lineups and tactics');
}

// The analytics department (analytics.ts): your department and the pool, hiring limits and negotiation, payouts in
// Finances, numbers-only views and what each bias does to them, the track record and the tendencies it shows,
// contracts ending, and save/reopen.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as AN from '../src/engine/analytics';
import { financesOf } from '../src/engine/frontOffice';

const g = Game.create(51, [0]),
  s: any = g.state,
  me = s.me,
  Y = g.Y;

// A department of three for your team, a pool to hire from, none for AI teams.
const dept = AN.deptOf(g, me);
assert.equal(dept.length, 3);
assert.equal(dept.filter(a => a.role === 'head').length, 1);
assert.equal(dept.filter(a => a.role === 'analyst').length, 2);
assert.ok(AN.freeAnalysts(g).length >= AN.AN_POOL);
assert.equal(AN.deptOf(g, s.teams.find((t: any) => !g.isUser(s, t.tid)).tid).length, 0);

// Limits: one head, two analysts; an offer under the ask is turned down.
const cand = AN.freeAnalysts(g).sort((a, b) => b.rep - a.rep)[0];
assert.match(AN.hireAnalyst(g, s, me, cand.id, { amt: AN.anAsk(g, cand, 'analyst'), years: 3, role: 'analyst' }), /two analysts/);
assert.match(AN.hireAnalyst(g, s, me, cand.id, { amt: AN.anAsk(g, cand, 'head'), years: 3, role: 'head' }), /Head of Analytics/);
const gone = dept.find(a => a.role === 'analyst')!;
gone.exp = Y + 1;
const before = AN.analyticsCost(g, s, me);
assert.equal(AN.fireAnalyst(g, s, me, gone.id), '');
assert.equal(AN.deptOf(g, me).length, 2);
assert.ok(Math.abs(AN.analyticsCost(g, s, me) - before) < 0.011, 'a let-go analyst is paid out: the cost stays');
assert.ok(
  financesOf(g, s, me).exp.some(([k]: any) => k === 'Analytics department'),
  'Finances show the line',
);
const low = AN.hireAnalyst(g, s, me, cand.id, {
  amt: Math.max(0.05, AN.anAsk(g, cand, 'analyst') * 0.5),
  years: AN.anPrefYears(cand),
  role: 'analyst',
});
assert.match(low, /looking for/);
assert.equal(AN.hireAnalyst(g, s, me, cand.id, { amt: AN.anAsk(g, cand, 'analyst'), years: AN.anPrefYears(cand), role: 'analyst' }), '');
assert.equal(cand.tid, me);
assert.equal(AN.deptOf(g, me).length, 3);

// Numbers only: a prospect has his college or club numbers; an NBA player with no minutes yet has nothing.
const pros = (g.db as any).cls[Y].map((id: number) => g.db.P[id]).filter(Boolean);
assert.ok(pros.filter((p: any) => AN.deptView(g, s, me, p)).length >= pros.length * 0.8, 'prospects have views');
const vet = (Object.values(s.rosters) as number[][])
  .flat()
  .map(id => g.db.P[id])
  .find((p: any) => !(p.stats || []).length)!;
assert.equal(AN.deptView(g, s, me, vet), null, 'no numbers, no view');

// Give two players a season: a shooter and a defender, then see each bias move its analyst.
const season = (p: any, o: Record<string, number>) => {
  p.stats = [
    {
      season: Y,
      tid: 0,
      po: false,
      gp: 70,
      gs: 70,
      min: 2200,
      pts: 1100,
      fgm: 400,
      fga: 880,
      tpm: 120,
      tpa: 320,
      ftm: 180,
      fta: 220,
      orb: 70,
      drb: 250,
      ast: 250,
      stl: 70,
      blk: 30,
      tov: 140,
      pf: 150,
      ...o,
    },
  ];
};
const ps = (Object.values(s.rosters) as number[][]).flat().map(id => g.db.P[id]);
const shooter = ps[1],
  defender = ps[2],
  old = ps[3];
season(shooter, { tpm: 230, tpa: 560 });
season(defender, { stl: 150, blk: 130, tpm: 10, tpa: 30 });
season(old, {});
old.age = 34;
const mk = (bias: Partial<Record<AN.BiasKey, number>>) => {
  const a = AN.mkAnalyst(g);
  a.skill = 80;
  a.bias = bias;
  return a;
};
const clean = mk({}),
  threes = mk({ threes: 1 }),
  noD = mk({ noD: 1 }),
  skeptic = mk({ old: 1 });
const view = (a: AN.Analyst, p: any) => AN.analystView(g, a, p)!;
const noiseFree = (a: AN.Analyst, b: AN.Analyst, p: any, k: 'now' | 'next') => view(a, p)[k] - view(b, p)[k];
// (different analysts carry different seeded noise, so compare each against a clean twin with his own id: shift ids)
const twin = (a: AN.Analyst) => ({ ...a, bias: {} }) as AN.Analyst;
assert.ok(noiseFree(threes, twin(threes), shooter, 'now') >= 2, 'loves threes: a shooter rates higher');
assert.ok(noiseFree(noD, twin(noD), defender, 'now') <= -3, 'blind to defense: a defender rates lower');
assert.ok(noiseFree(skeptic, twin(skeptic), old, 'next') <= -3, 'skeptical of older players: a 34-year-old projects lower');
void clean;

// What his contract is worth to them, and fit with your team (needs come from team stats; none yet is fine).
const v = AN.deptView(g, s, me, shooter)!;
const cv = AN.contractValue(g, v, 5);
assert.ok(cv.worth >= 0 && Number.isFinite(cv.surplus));
assert.ok(AN.fitWith(g, s, me, shooter));

// A trade's verdict, shaped like the assistant GM's advice.
{
  const tv = AN.tradeView(g, s, me, [shooter.id], [defender.id])!;
  assert.ok(['good', 'ok', 'bad'].includes(tv.tone) && tv.head && tv.lines.length === 2, 'trade verdict with a line per player');
  assert.equal(AN.tradeView(g, s, me, [], []), null);
}

// Track record: opening-night projections graded at season's end; a planted tendency shows.
AN.anOpening(g, s);
const proj = (g.db as any).anProj[Y];
assert.ok(proj && Object.keys(proj).length === AN.deptOf(g, me).length);
AN.anSeasonEnd(g, s);
const graded = AN.deptOf(g, me).filter(a => (a.rec || []).length);
assert.equal(graded.length, AN.deptOf(g, me).length, 'every analyst graded');
assert.equal((g.db as any).anProj[Y], undefined, 'raw rows dropped once graded');
const t = AN.mkAnalyst(g);
t.rec = [{ y: Y, n: 150, mae: 3, all: 0, sh: [120, 60], df: [-90, 40], old: [0, 40], sm: [0, 0] }];
const tend = AN.tendencies(t);
assert.ok(tend.some(x => x.startsWith('Overrates shooters')));
assert.ok(tend.some(x => x.startsWith('Underrates defenders')));

// Contracts ending: a notice, and he's gone when free agency opens.
const end = AN.deptOf(g, me)[0];
end.exp = Y;
delete end.next;
assert.ok(AN.anExpiring(g, s).length);
const n = AN.anContractsEnd(g, s);
assert.ok(n.some(x => x.title === 'Analyst gone: ' + end.name));
assert.equal(end.tid, null);

// Growth: toward a hidden ceiling, faster while working for a team; never past it (a rare slump aside).
{
  const young = AN.mkAnalyst(g, { age: 26 });
  assert.ok(young.ceil != null && young.ceil >= young.skill, 'a new analyst has a ceiling');
  Object.assign(young, { skill: 50, ceil: 80, since: g.Y - 1, tid: me });
  const idle = { ...young, id: -1, tid: null } as AN.Analyst;
  let up = 0;
  for (let i = 0; i < 40; i++) {
    const a = { ...young } as AN.Analyst,
      b = { ...idle } as AN.Analyst;
    AN.grow(g, a);
    AN.grow(g, b);
    assert.ok(a.skill <= 80 && b.skill <= 80);
    up += a.skill - 50 - (b.skill - 50);
  }
  assert.ok(up > 0, 'working for a team, he grows faster');
  const five = { ...young } as AN.Analyst;
  for (let i = 0; i < 5; i++) AN.grow(g, five);
  assert.ok(five.skill > 55, 'five years on, clearly better (' + five.skill + ')');
  const top = { ...young, skill: 80 } as AN.Analyst;
  AN.grow(g, top);
  assert.ok(top.skill <= 80, 'at his ceiling, no more growth');
  AN.godEditAnalyst(g, young.id, { ceil: 90, skill: 60 });
  assert.equal(young.ceil, 90);
  assert.equal(young.skill, 60);
  delete young.ceil; // an older save: a ceiling on load
}

// Save and reopen.
const re = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.equal(AN.deptOf(re, me).length, AN.deptOf(g, me).length);
assert.ok(((re.db as any).analysts[cand.id] as AN.Analyst).tid === me);
assert.ok(
  (Object.values((re.db as any).analysts) as AN.Analyst[]).every(a => a.ceil != null && a.ceil >= 1),
  'every analyst has a ceiling after reopening',
);
console.log('analytics: ok');

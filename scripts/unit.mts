// Unit tests (2026-11-08): small, fast checks of pure engine functions (a few seconds, no league simulation).
// Run alone with `npx tsx scripts/unit.mts`, or with everything fast via `npm test`.
import assert from 'node:assert/strict';
import { compressT, squeezeTop, unsqueezeTop, TOP_KNEE } from '../src/engine/potential';
import { curve, possessionKind, interiorD, glassSkill, USG_KNEE, USG_K } from '../src/engine/sim';
import { finishCurve, finishingPct, finishMix, FINISH_TYPES, dunkAble, dunkOpening, naturalDunkShare } from '../src/engine/finishing';
import { ovrWeights, sameOvrWeights, overallWith, ovrExact, OVR_W, FEEL_W } from '../src/engine/ratings';
import { stayChance, pricedLevel } from '../src/engine/cbaFlow';
import { CONTEND_PREM, CONTEND_PREM_BIRD, applySigning, validateSigning } from '../src/engine/contracts';
import { Game } from '../src/engine/Game';
import { taxBill, nums, signingMethods, extWindow, checkTrade, qoEligible, teamSalary } from '../src/engine/cba';
import { newLeague } from './lib/headless.mts';
import { defaultTeamSpecs, teamListError } from '../src/data/world';
import { relocateTeam } from '../src/engine/relocate';
import { applyCard, PRESET_CARDS } from '../src/engine/playerCard';
import { seasonLine } from '../src/engine/amateurStats';
import * as ST from '../src/engine/staff';
import * as CC from '../src/engine/coachCareer';

let n = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    n++;
  } catch (e: any) {
    console.log('FAIL ' + name + ': ' + (e?.message || e));
    process.exitCode = 1;
  }
};

// The rating scale.
test('squeezeTop leaves the scale below the knee alone and inverts', () => {
  for (const x of [40, 55, TOP_KNEE]) assert.equal(squeezeTop(x), x);
  for (const x of [63, 70, 83, 99]) {
    assert.ok(squeezeTop(x) < x);
    assert.ok(Math.abs(unsqueezeTop(squeezeTop(x)) - x) < 1e-9);
  }
});
test('compressT only compresses past 70 and keeps order', () => {
  assert.equal(compressT(65), 65);
  assert.ok(compressT(80) < 80 && compressT(80) > compressT(75));
});

// Shooting curves and possession outcomes.
test('shooting curves rise with the rating', () => {
  for (const k of ['three', 'rim', 'jumper', 'ft'])
    for (let r = 2; r < 99; r += 3) assert.ok(curve(k, r + 3) > curve(k, r), k + ' at ' + r);
});
test('finishing curves rise with skill and stay in bounds', () => {
  for (const t of FINISH_TYPES) {
    for (let s = 5; s < 95; s += 5) assert.ok(finishCurve(t, s + 5) > finishCurve(t, s));
    const lo = finishingPct({ r: {} as any }, t),
      hi = finishingPct({ r: { lay: 99, dnk: 99, ins: 99, fg: 99, jmp: 99, stre: 99 } }, t);
    assert.ok(lo >= 0.03 && hi <= 0.99 && hi >= lo);
  }
});
test('a finish mix adds up to 1', () => {
  const p = { r: { hgt: 70, jmp: 60, dnk: 60, lay: 55, ins: 50, fg: 50, stre: 55 }, grp: 'B' };
  for (const zone of ['rim', 'paint'] as const)
    assert.ok(Math.abs(Object.values(finishMix(p, zone)).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});
test('possessionKind partitions the roll in order', () => {
  assert.equal(possessionKind(0.01, 0.05, 0.1, 0.1), 'nsf');
  assert.equal(possessionKind(0.1, 0.05, 0.1, 0.1), 'tov');
  assert.equal(possessionKind(0.2, 0.05, 0.1, 0.1), 'trip');
  assert.equal(possessionKind(0.9, 0.05, 0.1, 0.1), 'fga');
  assert.equal(possessionKind(0.17, 0.05, 0.1, 0.1, 0.05), 'tov'); // extra turnover risk comes out of shots, not fouls
});
test('strength helps post defense and the glass (2026-11-08)', () => {
  const r = { hgt: 70, diq: 60, blk: 60, jmp: 60, reb: 60, box: 60, ape: 4 };
  assert.ok(interiorD({ ...r, stre: 70 }) > interiorD({ ...r, stre: 40 }));
  assert.ok(glassSkill({ ...r, stre: 70 }) > glassSkill({ ...r, stre: 40 }));
});
test('the usage penalty starts past its knee', () => {
  assert.ok(USG_KNEE > 0.2 && USG_KNEE < 0.3 && USG_K > 0 && USG_K < 1);
});

// The overall.
test("overall weights: copies compare equal and recompute today's overall", () => {
  const w = ovrWeights();
  assert.ok(sameOvrWeights(w, ovrWeights()));
  w.W.G.diq += 1;
  assert.ok(!sameOvrWeights(w, ovrWeights()));
  const p = { grp: 'G', r: Object.fromEntries(Object.keys(OVR_W.G).map(k => [k, 60])), intg: { feel: 60 }, wing: 0, hgt: '6\' 3"' };
  assert.ok(Math.abs(overallWith(p, ovrWeights()) - ovrExact(p)) < 1e-9);
  for (const G of ['G', 'W', 'B']) assert.ok(FEEL_W[G] > 0 && Object.values(OVR_W[G]).every(v => v > 0));
});

// Contracts and the cap.
const g: any = newLeague(3);
test('the luxury tax grows with payroll, more for repeaters', () => {
  const N = nums(g);
  assert.equal(taxBill(g, N.TAX - 1, false), 0);
  const a = taxBill(g, N.TAX + 5, false),
    b = taxBill(g, N.TAX + 15, false);
  assert.ok(a > 0 && b > a && taxBill(g, N.TAX + 15, true) > b);
});
test('minimum and maximum salaries are ordered', () => {
  const N = nums(g);
  assert.ok(N.min(0) <= N.min(5) && N.min(5) <= N.min(10) && N.max(0) < N.max(7) && N.max(7) < N.max(10) && N.min(10) < N.max(0));
});
test("a star's chance to stay is bounded and loyalty helps", () => {
  const s = g.state,
    tid = s.teams[0].tid,
    id = s.rosters[tid][0],
    p = g.db.P[id];
  const base = { ...p, pers: { ...p.pers, mot: 'Money' } },
    loyal = { ...p, pers: { ...p.pers, mot: 'Loyalty' } };
  const a = stayChance(g, s, tid, base),
    b = stayChance(g, s, tid, loyal);
  assert.ok(a >= 0.15 && a <= 0.95 && b >= 0.15 && b <= 0.95 && b > a);
});

// Payroll (2026-11-08).
test('young players are priced toward their potential, veterans on what they are', () => {
  assert.equal(pricedLevel({ age: 28, ovr: 55, pot: 65 }), 55);
  const a = pricedLevel({ age: 21, ovr: 50, pot: 62 }),
    b = pricedLevel({ age: 24, ovr: 50, pot: 62 }),
    c = pricedLevel({ age: 21, ovr: 50, pot: 50 });
  assert.ok(a > b && b > 50 && c === 50 && a <= 50 + 3); // halfway to at most 6 points of growth
});
// Finishing (2026-11-08): the skills, not size alone, decide close shots.
test('touch decides layups and hooks: a 40 and an 80 are far apart', () => {
  const at = (k: string, v: number, t: any) =>
    finishingPct({ r: { hgt: 60, jmp: 60, stre: 60, lay: 55, ins: 55, dnk: 55, fg: 55, [k]: v } }, t);
  assert.ok(at('lay', 80, 'layup') - at('lay', 40, 'layup') > 0.13);
  assert.ok(at('ins', 80, 'hook') - at('ins', 40, 'hook') > 0.13);
  assert.ok(at('dnk', 80, 'dunk') - at('dnk', 40, 'dunk') > 0.08 && at('dnk', 40, 'dunk') < 0.85);
});
test("a tall, bouncy player who can't dunk lays it up; a real dunker dunks through contact", () => {
  const big = { hgt: 85, jmp: 85, stre: 60 };
  assert.ok(dunkAble({ ...big, dnk: 25 }) < 0.2 && dunkAble({ ...big, dnk: 75 }) > 0.9);
  assert.ok(naturalDunkShare({ ...big, dnk: 25 }) < 0.2 && naturalDunkShare({ ...big, dnk: 80 }) > 0.65);
  assert.equal(dunkOpening('open', { dnk: 20 }), 1);
  assert.ok(dunkOpening('contested', { dnk: 40 }) < 0.05 && dunkOpening('contested', { dnk: 85 }) > 0.25);
});
test('contenders pay a premium, more for free agents than their own', () => {
  assert.ok(CONTEND_PREM > CONTEND_PREM_BIRD && CONTEND_PREM_BIRD > 1 && CONTEND_PREM < 1.5);
});
test('the middle of the market is priced at or above the curve, stars and the bench at it', () => {
  assert.equal(Game.midTierF(45), 1);
  assert.equal(Game.midTierF(70), 1);
  assert.ok(Game.midTierF(57) >= 1);
});

// League size (2026-11-13): the start screen's Teams editor builds any even league from 20 to 40 teams.
test('a 20-team league builds with valid conferences, picks and schedule', () => {
  const specs = defaultTeamSpecs().slice(0, 20);
  assert.equal(teamListError(specs), '');
  assert.ok(teamListError(specs.slice(0, 19)) !== '' && teamListError(defaultTeamSpecs().slice(0, 18)) !== '');
  const g: any = Game.create(31, [0], { teams: specs }),
    T = g.state.teams;
  assert.equal(T.length, 20);
  assert.ok(T.filter((t: any) => t.conf === 'East').length >= 10 && T.filter((t: any) => t.conf === 'West').length >= 10);
  assert.ok(g.state.assets.every((a: any) => T[a.owner] && T[a.orig]));
  assert.ok(g.db.days.flat().every((gm: any) => gm.every((t: number) => t < 20)));
});
test('the default league is built exactly as before', () => {
  const a: any = Game.create(31, [0]),
    b: any = Game.create(31, [0], { teams: defaultTeamSpecs() });
  assert.equal(a.state.teams.length, 30);
  assert.deepEqual(
    a.state.teams.map((t: any) => t.abbr + t.str),
    b.state.teams.map((t: any) => t.abbr + t.str),
  );
});
test('relocating a club keeps its roster and picks and takes the new identity', () => {
  const g: any = Game.create(31, [0]),
    ids = g.state.rosters[5].slice(),
    picks = g.state.assets.filter((x: any) => x.owner === 5).length;
  assert.equal(relocateTeam(g, 5, { region: 'Louisville', name: 'Thoroughbreds', abbr: 'LOU' }), '');
  assert.equal(g.state.teams[5].abbr, 'LOU');
  assert.deepEqual(g.state.rosters[5], ids);
  assert.equal(g.state.assets.filter((x: any) => x.owner === 5).length, picks);
  assert.ok(relocateTeam(g, 6, { region: 'X', name: 'Y', abbr: 'LOU' }) !== ''); // the abbreviation is taken
});

test("a card's college game drives his college stats, its ratings his NBA game (2026-11-14)", () => {
  // Test the separate-build capability with a deliberate shooting contrast.
  // A live preset's college 3P% need not exceed its NBA-only NCAA projection.
  const c: any = structuredClone(PRESET_CARDS.find((x: any) => x.card.name === 'KJ Simpson')!.card);
  c.r.tp = 10;
  c.am.r.tp = 90;
  const mk = (card: any) => {
      const p: any = {
        id: 4242,
        age: card.age,
        r: {},
        intg: { feel: 50, poise: 50 },
        pers: {},
        pot: card.pot,
        from: { lg: 'NCAA', team: 'Colorado' },
        dx: { o: 5, c: 3, sh: {}, tier: 'better' },
      };
      assert.equal(applyCard(p, card, {}), '');
      return p;
    },
    a = mk(c),
    b = mk({ ...c, am: undefined });
  assert.equal(a.r.tp, c.r.tp); // NBA ratings as written
  assert.equal(a.am.r.tp, c.am.r.tp); // college game kept apart
  assert.equal(a.dx.o, 0); // no camp surprise on top of the card's own translation
  assert.ok(
    seasonLine(a, 2024, 0).disp.tpm / seasonLine(a, 2024, 0).disp.tpa > seasonLine(b, 2024, 0).disp.tpm / seasonLine(b, 2024, 0).disp.tpa,
  );
});

test('easy contracts: one plain deal under the ceiling, flat, extendable with a year left (2026-11-15)', () => {
  const g: any = Game.create(31, [0]);
  g.setState({ easyContracts: true });
  const s = g.state,
    P = g.db.P,
    N = nums(g),
    fa = s.fa.map((id: number) => P[id]).sort((a: any, b: any) => b.ovr - a.ovr)[0];
  // Exercise the salary exception with a real open roster slot; initial AI
  // signings can legitimately fill this club before the test starts.
  s.rosters[3] = s.rosters[3].slice(0, 14);
  assert.equal(N.AP1, N.AP2); // one ceiling
  const keys = signingMethods(g, s, 3, fa).map(m => m.key);
  assert.ok(keys.includes('std') && keys.includes('min'));
  assert.ok(!['bird', 'cap', 'room', 'ntmle', 'tpmle', 'bae', 'dpe'].some(k => keys.includes(k)));
  assert.equal(signingMethods(g, s, 3, fa).find(m => m.key === 'min')!.ok, true); // the minimum always fits
  // A signing: flat salary, no bonuses or clauses, at most 5 years.
  const box = { rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } };
  applySigning(g, s, box, 3, fa, {
    method: 'std',
    amt: 10,
    years: 7,
    kicker: 0.1,
    ntc: true,
    inc: [{ k: 'x', amt: 1, likely: true }],
    opt: 'player',
  });
  assert.equal(fa.raise, 0);
  assert.equal(fa.kicker, 0);
  assert.equal(fa.ntc, false);
  assert.equal(fa.inc.length, 0);
  assert.equal(fa.opt?.kind, 'player');
  assert.equal(g.salAt(fa, fa.exp), g.salAt(fa, fa.exp - 2)); // the same every year
  // The ceiling limits the first-year salary.
  const q = P[s.fa[1]],
    std = signingMethods(g, s, 4, q).find(m => m.key === 'std')!;
  assert.ok(std.maxFirst <= Math.max(0, N.AP2 - teamSalary(g, s, 4)) + 0.01);
  assert.equal(validateSigning(g, s, 4, q, { method: 'std', amt: std.maxFirst + 1, years: 2 }).ok, false);
  // No qualifying offers; an extension any time with one season left.
  const vet = (s.rosters[5] as number[]).map(id => P[id]).find((p: any) => p.exp === g.Y && !['twoWay', 'ex10'].includes(p.ctype));
  if (vet) {
    assert.equal(qoEligible(g, vet), false);
    assert.equal(extWindow(g, s, vet).ok, true);
  }
  // Trades: no salary matching under the ceiling.
  const a = 6,
    b = 7,
    lo = (s.rosters[a] as number[]).map(id => P[id]).sort((x: any, y: any) => x.amt - y.amt)[0],
    hi = (s.rosters[b] as number[]).map(id => P[id]).sort((x: any, y: any) => y.amt - x.amt)[0];
  const r = checkTrade(g, s, a, b, [lo.id], [hi.id], [], []);
  const overA = teamSalary(g, s, a) - g.capHit(lo) + g.capHit(hi) > N.AP2;
  assert.equal(
    r.errs.some(e => /matching|takes back/.test(e)),
    false,
  );
  assert.equal(
    r.errs.some(e => /ceiling/.test(e)),
    overA,
  );
});

test('coaches: a staff for your team, small capped effects, contracts and limits (2026-11-15)', () => {
  const g: any = Game.create(31, [0]),
    s = g.state,
    me = s.me;
  const st = ST.staffOf(g, me);
  assert.equal(st.length, 5);
  assert.deepEqual(
    st.map(c => c.role),
    ['lead', 'asst', 'asst', 'asst', 'dev'],
  );
  assert.ok(ST.freeCoaches(g).length >= ST.POOL);
  const women = (Object.values(g.db.coaches) as any[]).filter(c => c.fem).length / Object.keys(g.db.coaches).length;
  assert.ok(women < 0.15); // about 5%
  // A starting staff is about average: no free edge over AI teams on the owner's budget.
  const fx = ST.staffFx(g, s, me);
  assert.ok(Math.abs(fx.ptsO) + Math.abs(fx.ptsD) < 1.2 && Math.abs(fx.q - 0.573) < 0.12, JSON.stringify(fx));
  // The best possible staff tops out near 1.6 points per 100 in all; the worst costs a little and lets skills slip.
  const best = ST.fxOf(
    st
      .map(c => ({ ...c, r: { off: 99, def: 30, dev: 99, game: 99, mot: 99, teach: 99, eye: 99 } }))
      .concat(st.map(c => ({ ...c, role: 'asst' as const, r: { off: 30, def: 99, dev: 99, game: 99, mot: 99, teach: 99, eye: 99 } }))),
  );
  assert.ok(best.ptsO + best.ptsD <= 1.7 && best.ptsO + best.ptsD > 1.2, JSON.stringify(best));
  assert.ok(best.growth <= 0.065);
  const worst = ST.fxOf(st.map(c => ({ ...c, r: { off: 10, def: 10, dev: 10, game: 10, mot: 10, teach: 10, eye: 10 } })));
  assert.ok(worst.ptsO < 0 && worst.ptsD < 0 && worst.ptsO + worst.ptsD >= -1.3);
  assert.ok(ST.devSlip(worst.devQ) > 0 && ST.devSlip(0) === 0);
  // Limits: 3 to 6 (God Mode: any number); contracts 1–5 years; a fired coach is paid out.
  const c0 = ST.freeCoaches(g)[0];
  assert.equal(ST.hireCoach(g, s, me, c0.id, { amt: 50, years: 6, role: 'asst' }), 'Coaching contracts run 1 to 5 years.');
  assert.equal(ST.hireCoach(g, s, me, c0.id, { amt: 50, years: 3, role: 'asst' }), '');
  const c1 = ST.freeCoaches(g)[0];
  assert.match(ST.hireCoach(g, s, me, c1.id, { amt: 50, years: 3, role: 'asst' }), /full/);
  assert.equal(ST.hireCoach(g, s, me, c1.id, { amt: 1, years: 3, role: 'asst' }, true), ''); // God Mode
  const cost0 = ST.staffCost(g, s, me),
    gone = ST.staffOf(g, me).find(c => c.role === 'asst')!;
  assert.equal(ST.fireCoach(g, s, me, gone.id), '');
  assert.ok(Math.abs(ST.staffCost(g, s, me) - cost0) < 0.01); // still paid
  // His read firms up while he works for you.
  const lead = ST.staffOf(g, me).find(c => c.role === 'lead')!,
    r0 = lead.read;
  ST.staffMonth(g, s);
  assert.ok(lead.read > r0);
  // A year: coaches grow toward their ceiling (not past it), never decline with age alone.
  const young = ST.mkCoach(g, { age: 30 });
  young.ceil = Math.round(ST.coachOvr(young) + 20);
  const o0 = ST.coachOvr(young);
  ST.staffYear(g, s);
  if (!young.ret) assert.ok(ST.coachOvr(young) >= o0 - 8);
});

test('coach careers: retiring players, AI head coaches, history that stays put (2026-11-15)', () => {
  const g: any = Game.create(31, [0]),
    s = g.state;
  // Every AI team has one head coach; you are your team's.
  s.teams.forEach((t: any) => {
    const hc = CC.headCoachOf(g, t.tid);
    if (g.isUser(s, t.tid)) assert.equal(hc, null);
    else assert.ok(hc && hc.role === 'hc');
  });
  // A quarter of retiring players, at random, become coaches with their own playing career.
  const ps = (Object.values(g.db.P) as any[]).filter(p => p.r && !p.retired).slice(0, 400);
  ps.forEach(p => (p.retired = { season: g.Y, age: p.age, tid: -1, why: 'Retired' }));
  const n0 = Object.keys(g.db.coaches).length,
    n = CC.coachPipeline(g, s);
  assert.ok(n >= 70 && n <= 130, String(n));
  assert.equal(Object.keys(g.db.coaches).length - n0, n);
  assert.equal(CC.coachPipeline(g, s), 0); // each player is considered once
  const ex = (Object.values(g.db.coaches) as any[]).find(c => c.pid != null)!;
  assert.equal(ex.name, g.db.P[ex.pid].name);
  // Generated careers are the same every time they're shown.
  const vet = CC.headCoachOf(g, 3)!;
  assert.deepEqual(CC.coachRows(g, s, vet), CC.coachRows(g, s, vet));
  assert.deepEqual(CC.playRows(g, s, vet), CC.playRows(g, s, vet));
  assert.ok(CC.coachRows(g, s, vet).length >= 8);
  // The season's row is stored once.
  CC.staffSeason(g, s);
  CC.staffSeason(g, s);
  assert.equal((vet.h || []).filter((r: number[]) => r[0] === g.Y).length, 1);
  const mine = ST.staffOf(g, s.me)[0];
  assert.equal(mine.h!.find((r: number[]) => r[0] === g.Y)![3], 1); // under you
});

console.log((process.exitCode ? 'FAIL' : 'PASS') + ': ' + n + ' unit tests passed');

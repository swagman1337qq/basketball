// Summer League (summerLeague.ts): invites (undrafted free agents only, at most SL_INV), every team plays SL_GAMES
// games once a summer, lines on profiles, intel for your scouts, standouts' two-way deals with AI teams; quick.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import * as SL from '../src/engine/summerLeague';

const g = Game.create(61, [0]),
  me = (g.state as any).me,
  Y = g.Y,
  P: any = g.db.P;
g.setState({ phase: 'fa', faStart: (g.state as any).day });
const s = () => g.state as any;

// Invites: undrafted free agents only, five at most.
const eligible = (s().fa as number[]).filter(id => SL.slEligible(g, s(), P[id]));
assert.ok(eligible.length >= 6, 'undrafted free agents to invite: ' + eligible.length);
const vet = (Object.values(s().rosters) as number[][]).flat().find(id => P[id].age >= 28)!;
assert.match(SL.slInvite(g, s(), vet, true), /undrafted/);
for (const id of eligible.slice(0, SL.SL_INV)) assert.equal(SL.slInvite(g, s(), id, true), '');
assert.match(SL.slInvite(g, s(), eligible[SL.SL_INV], true), /invite 5/);
assert.equal(SL.slInvites(g, s()).length, SL.SL_INV);
const mine = SL.slInvites(g, s());

// Rosters: your invites play for you; nobody plays for two teams.
const ros = SL.slRosters(g, s());
mine.forEach(id => assert.ok(ros[me].includes(id), 'your invite plays for you'));
const all = Object.values(ros).flat();
assert.equal(new Set(all).size, all.length, 'one team each');
Object.values(ros).forEach(r => assert.ok(r.length >= 5 && r.length <= 12));

// The games: once a summer, quick.
const t0 = performance.now();
g.runSummerLeague();
const ms = performance.now() - t0;
console.log('Summer League:', ms.toFixed(0), 'ms for', Object.keys(s().sl.rec).length, 'teams');
assert.ok(ms < 3000, 'quick');
assert.equal(s().sl.y, Y);
Object.values(s().sl.rec as Record<number, number[]>).forEach(r => assert.equal(r[0] + r[1], SL.SL_GAMES, 'five games each'));
const played = Object.values(P).filter((p: any) => SL.slOf(p, Y));
assert.ok(played.length >= 180, 'lines kept: ' + played.length); // about 30 teams of 6–12
played.forEach((p: any) => assert.ok(SL.slOf(p, Y)!.gp >= 1 && SL.slOf(p, Y)!.gp <= SL.SL_GAMES));
mine.forEach(id => assert.equal(SL.slOf(P[id], Y)?.tid, me));
assert.ok((s().intel?.[(played[0] as any).id] || 0) >= 3, 'your scouts watched');
assert.ok(s().sl.champ != null && (s().lgLog || []).some((x: any) => x.type === 'Summer League'), 'a champion in the log');
// Standouts signed by AI teams are two-way players on their rosters.
(s().lgLog || [])
  .filter((x: any) => /strong Summer League/.test(x.text || ''))
  .forEach((x: any) => {
    const p = P[x.pids[0]];
    assert.equal(p.ctype, 'twoWay');
    assert.ok((Object.values(s().rosters) as number[][]).some(r => r.includes(p.id)) && !s().fa.includes(p.id));
  });
// Once a summer.
const before = JSON.stringify(s().sl.rec);
g.runSummerLeague();
assert.equal(JSON.stringify(s().sl.rec), before);
// Save and reopen.
const re = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(SL.slOf(re.db.P[(played[0] as any).id], Y), SL.slOf(played[0], Y));

// The panel renders.
{
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  const { SummerLeaguePanel } = await import('../src/ui/screens/SummerLeaguePanel');
  const html = renderToStaticMarkup(createElement(SummerLeaguePanel, { vm: { ctx: { gm: g, s: g.state, open() {} } } as any }));
  assert.ok(html.includes('Summer League') && html.includes('Champions'), 'results panel');
}
console.log('summerLeague: ok');

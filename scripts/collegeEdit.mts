// God Mode: a new school or club in the editor carries into his college stats (amateurStats.ts moveSchool), also for a
// player whose age was edited (his college path is kept then) and a loaded class's real seasons; earlier stops stay.
// Run: npx tsx scripts/collegeEdit.mts
import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { amClass, classStats, moveSchool, setGodPlayerAge } from '../src/engine/amateurStats';

const g: any = newLeague(5),
  P = g.db.P;
const bump = () => g.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
const teams = (p: any) => {
  const c = amClass(p);
  return (classStats(g, c, g.db.cls[c], g.state.gv || 0)[p.id] || []).map((l: any) => l.team);
};
const edit = (p: any, from: any) => {
  const old = { ...p.from };
  p.from = { ...p.from, ...from };
  moveSchool(p, old);
  bump();
};
const pros = (Object.values(P) as any[]).filter(p => p.from?.lg === 'NCAA' && p.cls >= g.Y && g.db.cls[p.cls]?.includes(p.id));
// A generated prospect: every season at his school.
const a = pros.find(p => new Set(teams(p)).size === 1 && teams(p).length >= 2)!;
edit(a, { team: 'Gonzaga' });
assert.ok(
  teams(a).every(t => t === 'Gonzaga'),
  teams(a).join(','),
);
// After an age edit (the path is kept): the seasons at the old school follow.
const b = pros.find(p => p !== a && new Set(teams(p)).size === 1)!;
setGodPlayerAge(g, b, b.age + 1);
bump();
const before = teams(b);
assert.ok(before.length >= 1 && before.every(t => t === b.from.team));
edit(b, { team: 'Villanova' });
assert.ok(teams(b).length === before.length && teams(b).every(t => t === 'Villanova'), teams(b).join(','));
// A transfer: only the seasons at his last school move.
const c = pros.find(p => new Set(teams(p)).size > 1);
if (c) {
  setGodPlayerAge(g, c, c.age);
  const t0 = teams(c),
    last = c.from.team,
    keep = t0.filter(t => t !== last);
  c.amAgeEdit = { ratingAge: c.dAge ?? c.age, years: t0.length, path: t0.map((team: string) => ({ team, lg: 'NCAA' })) };
  edit(c, { team: 'Butler' });
  assert.deepEqual(
    teams(c).filter(t => t !== 'Butler'),
    keep,
  );
}
// A loaded class's real seasons, and a league change.
const d: any = {
  from: { team: 'Kentucky', lg: 'NCAA' },
  real: [
    { season: 2019, team: 'Northern Kentucky', gp: 30 },
    { season: 2020, team: 'Kentucky', gp: 32 },
    { season: 2021, team: 'Kentucky', gp: 35 },
  ],
};
const d0 = { ...d.from };
d.from = { team: 'Memphis', lg: 'NCAA' };
moveSchool(d, d0);
assert.deepEqual(
  d.real.map((r: any) => r.team),
  ['Northern Kentucky', 'Memphis', 'Memphis'],
);
const e: any = { from: { team: 'U. of Somewhere', lg: 'NCAA' }, real: [{ season: 2020, team: 'Somewhere', gp: 30 }] };
const e0 = { ...e.from };
e.from = { team: 'ALBA Berlin', lg: 'BBL' };
moveSchool(e, e0);
assert.equal(e.real[0].team, 'ALBA Berlin'); // spelled differently in the record: his last school moves
assert.equal(e.real[0].lg, 'BBL');
console.log('college edit ok');

import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { draftClassRecords, draftYearOf } from '../src/engine/draftRecords';
const g = Game.create(8220, [0]),
  year = g.Y - 1;
const [pid, pid2, pid3] = g.state.rosters[0],
  p = g.db.P[pid];
Object.assign(p, { name: 'Guilherme Cavalcanti', num: '14', draft: year, cls: year + 1, dr: { rd: 1, pick: 18 } });
Object.assign(g.db.P[pid2], { draft: year, cls: year, dr: { rd: 2, pick: 2 } });
Object.assign(g.db.P[pid3], { draft: year, cls: 0, undrafted: year, dr: null });
g.db.cls[year] = [];
g.db.pickUsed = { [year + '-1-3']: { n: 18, pid, tid: 0 }, [year + '-2-4']: { n: 34, pid: pid2, tid: 0 } };
assert.equal(draftYearOf(p), year, 'the profile opens the actual drafted year rather than a retained prospect class');
const rows = draftClassRecords(g, year),
  record = rows.find(r => r.p.id === pid)!;
assert.equal(record.pick, 18);
assert.equal(record.p.name, 'Guilherme Cavalcanti');
assert.equal(rows.find(r => r.p.id === pid2)!.pick, 34, 'use the recorded overall pick after expansion');
assert.equal(rows.find(r => r.p.id === pid3)!.pick, null);
assert.equal(new Set(rows.map(r => r.p.id)).size, rows.length);
assert(rows.findIndex(r => r.p.id === pid) < rows.findIndex(r => r.p.id === pid2));
assert(!draftClassRecords(g, year + 1).some(r => r.p.id === pid), 'a stale cls does not place a drafted player in the wrong year');
g.db.P[pid].gone = 1;
assert(
  draftClassRecords(g, year).some(r => r.p.id === pid),
  'archived picks remain part of a draft’s history',
);
const loaded = Game.load(g.toSave());
assert.equal(draftClassRecords(loaded, year).find(r => r.p.id === pid)!.pick, 18);
const currentTeams = g.state.teams;
g.state.teams = [...currentTeams, { ...currentTeams[0], tid: 30 }, { ...currentTeams[0], tid: 31 }];
g.state.teamHist = Object.fromEntries(currentTeams.map(t => [t.tid, [{ season: g.Y }]]));
Object.assign(g.db.P[pid2], { draft: g.Y, cls: 0, dr: { rd: 2, pick: 2 } });
assert.equal(
  draftClassRecords(g, g.Y).find(r => r.p.id === pid2)!.pick,
  32,
  'legacy second-round fallback uses the league size in that season',
);
console.log(
  'PASS: actual numeric picks, missing class index, retained class mismatch, expansion, undrafted and archived players, save/load',
);

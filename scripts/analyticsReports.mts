// Analytics reports: who the department is asked to look at (you, your scouts, your assistant GM), its capacity
// (the Head of Analytics 12 players, each analyst 8), the queue, sharper reads for covered players, and the report.
// Run: npx tsx scripts/analyticsReports.mts
import assert from 'node:assert/strict';
import { clr, newLeague } from './lib/headless.mts';
import {
  AN_CAP,
  AN_LIST_MAX,
  anCapacity,
  anCovered,
  anKind,
  analystView,
  anRequests,
  askAnalytics,
  deptOf,
  dropAnalytics,
  fireAnalyst,
} from '../src/engine/analytics';
import { anReport, anRows } from '../src/engine/analyticsReports';

const g: any = newLeague(31);
for (let i = 0; i < 3; i++) {
  clr(g);
  await g.sim(10);
}
const s = () => g.state,
  P = g.db.P,
  me = s().me;
const dept = deptOf(g, me);
assert.ok(dept.length >= 1, 'a starting department');
assert.equal(
  anCapacity(g, me),
  dept.reduce((t, a) => t + AN_CAP[a.role || 'analyst'], 0),
);

// Who can be asked about: NBA players (rosters, free agents) and draft prospects; nobody abroad.
const nba = (Object.values(s().rosters).flat() as number[]).filter(id => !s().rosters[me].includes(id)),
  prospect = (Object.values(g.db.cls || {}).flat() as number[]).find(id => anKind(g, s(), P[id]) === 'prospect')!,
  abroad = (s().overseas || [])[0];
assert.equal(anKind(g, s(), P[nba[0]]), 'league');
assert.equal(anKind(g, s(), P[s().rosters[me][0]]), 'mine');
assert.ok(prospect != null);
if (abroad != null) {
  assert.equal(anKind(g, s(), P[abroad]), null);
  assert.match(askAnalytics(g, abroad), /NBA and draft prospects/);
}

// Your list: add, no duplicates, a cap, take off.
assert.match(askAnalytics(g, nba[0]), /on your analytics list/);
assert.match(askAnalytics(g, nba[0]), /already/);
assert.match(askAnalytics(g, prospect), /on your analytics list/);
for (const id of nba.slice(1, AN_LIST_MAX + 3)) askAnalytics(g, id);
assert.equal(s().anList.length, AN_LIST_MAX);
assert.match(askAnalytics(g, nba[AN_LIST_MAX + 5]), /full/);

// Order: your requests first (in the order you asked), then the scouts', then the assistant GM's.
g.setState({ scoutList: [nba[40]], lists: [{ id: 'l1', name: 'Watchlist', ids: [nba[41], nba[0]] }] });
const req = anRequests(g, s());
assert.deepEqual(
  req.slice(0, 3).map(r => r.pid),
  [nba[0], prospect, nba[1]],
);
assert.deepEqual(req.find(r => r.pid === nba[0])!.by.sort(), ['agm', 'you']);
const iS = req.findIndex(r => r.pid === nba[40]),
  iA = req.findIndex(r => r.pid === nba[41]);
assert.ok(iS > req.findIndex(r => r.pid === s().anList.at(-1)) && iA > iS, 'scouts after you, assistant GM after scouts');
assert.ok(req.find(r => r.pid === nba[40])!.by.includes('scouts'));
// Trade offers to you go on the assistant GM's list.
g.setState({
  inOffers: [{ id: 'oT', a: s().teams.find((t: any) => t.tid !== me).tid, b: me, aP: [nba[60]], bP: [], aK: [], bK: [], day: s().day }],
});
assert.ok(
  anRequests(g, s())
    .find(r => r.pid === nba[60])
    ?.by.includes('agm'),
);
// The draft range: prospects around your projected pick.
assert.ok(anRequests(g, s()).some(r => r.by.includes('agm') && anKind(g, s(), P[r.pid]) === 'prospect'));

// Capacity: the first players with numbers, your requests first; the rest wait in line.
const cov = anCovered(g, s()),
  rows = anRows(g, s());
assert.ok(cov.size <= anCapacity(g, me));
assert.equal(rows.filter(r => r.status === 'covered').length, cov.size);
assert.ok(cov.has(nba[0]));
const q = rows.filter(r => r.status === 'queued');
assert.ok(q.length > 0, 'a full list leaves players waiting');
assert.deepEqual(
  q.map(r => r.queue),
  q.map((_, i) => i + 1),
);
assert.ok(rows.findIndex(r => r.status === 'queued') > rows.findIndex(r => r.status === 'covered'));

// A covered player's report: the department's read, the numbers behind it, calls.
const rep = anReport(g, s(), nba[0], P[nba[0]].pot)!;
assert.ok(rep && rep.v.by.length === dept.length);
assert.ok(rep.sample.line.length >= 9 && rep.calls.length >= 1);
const pr = [...cov].find(id => anKind(g, s(), P[id]) === 'prospect');
if (pr != null) {
  const r2 = anReport(g, s(), pr, P[pr].pot)!;
  assert.equal(r2.sample.kind, 'am');
  assert.equal(r2.cv, null);
}

// A full report reads closer: same analyst, same players, less noise.
const a = dept[0],
  pool = (Object.values(P) as any[]).filter(p => anKind(g, s(), p) === 'league' || anKind(g, s(), p) === 'mine'),
  err = (deep: boolean) => {
    let t = 0,
      n = 0;
    for (const p of pool) {
      const v = analystView(g, a, p, deep);
      if (v?.kind === 'nba') {
        t += Math.abs(v.now - p.ovr);
        n++;
      }
    }
    return t / n;
  };
assert.ok(err(true) < err(false), `deep ${err(true).toFixed(2)} vs ${err(false).toFixed(2)}`);

// Off your list, and no department: no reports.
dropAnalytics(g, nba[0]);
assert.ok(!s().anList.includes(nba[0]));
for (const x of deptOf(g, me)) fireAnalyst(g, s(), me, x.id, true);
assert.equal(anCapacity(g, me), 0);
assert.equal(anCovered(g, s()).size, 0);
console.log('analytics reports ok');

import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { draftResearch, inPickRange, prioritizeDraft } from '../src/engine/draftScouting';
import { runBriefs, briefFit, DEFAULT_BRIEF } from '../src/engine/scoutBrief';
import { anCovered, anRequests } from '../src/engine/analytics';
import { mulberry32 } from '../src/engine/rng';

const g: any = newLeague(7331),
  original = structuredClone(g.state),
  Y = g.Y;
const ids: number[] = g.db.cls[Y].slice();
ids.forEach((id, i) => (g.db.rank[id] = i + 1));
const n = original.teams.length;
const picks = [1, 2].flatMap(rd => original.teams.map((t: any, i: number) => ({ n: (rd - 1) * n + i + 1, rd, orig: t.tid, pid: null })));
const make = (slots = [8, 27, n + 20]) => ({
  ...structuredClone(original),
  phase: 'draft',
  me: 0,
  picks: structuredClone(picks),
  assets: picks.map((p: any) => ({ id: 't' + p.n, yr: Y, rd: p.rd, orig: p.orig, owner: slots.includes(p.n) ? 0 : -1 })),
  scoutAssign: {},
  briefPicks: {},
  scoutList: [],
  scoutFocus: [],
  anList: [],
  lists: [],
  inOffers: [],
});
const scout = { ...original.scouts[0], brief: { ...DEFAULT_BRIEF, on: true } };
const s: any = make();
s.scouts = [scout];
const research = draftResearch(g, s, 0);
assert.deepEqual(
  research.picks.map(p => p.slot),
  [8, 27, n + 20],
);
assert.ok(!research.picks.some(p => p.slot === 1), 'traded-away franchise pick is not an owned pick');
const scored = ids.map(id => ({ id, score: 1000 - research.ranks.get(id)!.rank }));
const prioritized = prioritizeDraft(scored, research, 8);
assert.equal(prioritized.length, 8);
assert.ok(prioritized.filter(x => x.pick).length >= 6, 'most assignments stay around owned selections');
for (const pick of research.picks)
  assert.ok(
    prioritized.some(x => inPickRange(research, x.item.id, pick)),
    'each owned selection gets a look',
  );
assert.ok(prioritized.filter(x => research.ranks.get(x.item.id)!.rank <= 5).length >= 2, 'top prospects remain covered');

const before = JSON.stringify({ state: s, P: g.db.P });
const rng = mulberry32(7171);
Math.random = mulberry32(7171);
const assignments = runBriefs(g, s);
assert.equal(Math.random(), rng(), 'automatic selection consumes no simulation randomness');
assert.equal(JSON.stringify({ state: s, P: g.db.P }), before, 'selection does not edit players or league state');
const automatic = Object.keys(assignments.briefPicks).map(Number);
assert.equal(automatic.length, 8);
assert.ok(automatic.filter(id => research.picks.some(p => inPickRange(research, id, p))).length >= 6);
assert.ok(
  Object.values(assignments.briefPicks).some((p: any) => /near pick No/.test(p.why)),
  'range is explained in the existing assignment reason',
);

const manual = { ...s, scoutAssign: { [ids[80]]: scout.name } };
const withManual = runBriefs(g, manual);
assert.equal(withManual.scoutAssign[ids[80]], scout.name);
assert.equal(withManual.briefPicks[ids[80]], undefined);
assert.equal(Object.keys(withManual.scoutAssign).length, 8, 'personal capacity includes manual assignments');

const noPicks = make([]);
noPicks.scouts = [scout];
const fallback = runBriefs(g, noPicks);
const oldBest = ids
  .map(id => ({ id, ...briefFit(g, noPicks, g.db.P[id], scout, 'best') }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)
  .map(x => x.id)
  .sort((a, b) => a - b);
assert.deepEqual(
  Object.keys(fallback.scoutAssign)
    .map(Number)
    .sort((a, b) => a - b),
  oldBest,
  'no picks retains best-available coverage',
);

const filtered = make();
filtered.scouts = [{ ...scout, brief: { ...scout.brief, pos: 'G', age: '20' } }];
const filteredResult = runBriefs(g, filtered);
assert.ok(
  Object.keys(filteredResult.scoutAssign).every(id => g.db.P[+id].grp === 'G' && g.db.P[+id].age <= 20),
  'pick coverage respects the scout position and age brief',
);
const anywhere = make();
anywhere.scouts = [{ ...scout, brief: { ...scout.brief, pool: 'any' } }];
const anywhereResult = runBriefs(g, anywhere);
assert.ok(Object.keys(anywhereResult.scoutAssign).length <= 8, 'mixed prospect and pro pools keep the same capacity');
assert.ok(
  Object.keys(anywhereResult.scoutAssign).every(id => !Object.values(anywhere.rosters).flat().includes(+id) || !research.ranks.has(+id)),
  'already-drafted players are not targeted through a draft pool',
);

const partial = make([27, n + 20]);
partial.scouts = [scout];
partial.picks[26].pid = ids[26];
partial.rosters[1].push(ids[9]);
const remaining = draftResearch(g, partial, 0);
assert.ok(!remaining.picks.some(p => p.slot === 27), 'a used selection no longer draws automatic work');
assert.ok(!remaining.available.has(ids[26]) && !remaining.available.has(ids[9]), 'drafted players are not draft targets');
assert.equal(remaining.ranks.get(ids[49])!.rank, 50, 'class ranks stay absolute during a partial draft');

const other: any = make([n + 20]);
other.scouts = [scout];
other.assets.find((a: any) => a.rd === 1 && a.orig === picks[19].orig).owner = 1;
const club = { ...other, me: undefined, scouts: [scout], scoutAssign: {}, briefPicks: {} };
const clubResult = runBriefs(g, other, club, 1),
  clubResearch = draftResearch(g, other, 1);
assert.deepEqual(
  clubResearch.picks.map(p => p.slot),
  [20],
);
assert.ok(
  Object.keys(clubResult.briefPicks)
    .map(Number)
    .filter(id => clubResearch.picks.some(p => inPickRange(clubResearch, id, p))).length >= 6,
  'monthly other-club calls use the originating team',
);

const small: any = make([]);
small.teams = small.teams.slice(0, 8);
small.assets = [{ yr: Y, rd: 2, orig: small.teams[5].tid, owner: 0 }];
small.picks = [1, 2].flatMap(rd => small.teams.map((t: any, i: number) => ({ n: (rd - 1) * 8 + i + 1, rd, orig: t.tid, pid: null })));
assert.equal(draftResearch(g, small, 0).picks[0].slot, 14, 'second-round overall slots follow league size');

const future: any = make([]);
future.scouts = [{ ...scout, brief: { ...scout.brief, pool: 'future' } }];
future.assets = [
  { yr: Y + 1, rd: 1, orig: 2, owner: 0 },
  { yr: Y + 2, rd: 2, orig: 3, owner: 0 },
];
const lookahead = draftResearch(g, future, 0);
assert.deepEqual(
  lookahead.picks.map(p => p.year),
  [Y + 1, Y + 2],
);
const futureAssignments = runBriefs(g, future);
assert.ok(
  Object.keys(futureAssignments.briefPicks)
    .map(Number)
    .some(id => lookahead.ranks.get(id)?.year === Y + 1),
);

const afterDraft: any = make([]);
afterDraft.scouts = [scout];
afterDraft.fa = [...afterDraft.fa, ...ids];
afterDraft.assets = [{ yr: Y + 1, rd: 1, orig: 2, owner: 0 }];
const nextAssignments = runBriefs(g, afterDraft);
assert.ok(Object.keys(nextAssignments.briefPicks).length > 0, 'next-draft briefs roll forward after the current class is assigned');
assert.ok(
  Object.keys(nextAssignments.briefPicks).every(id => g.db.P[+id].cls === Y + 1),
  'completed classes do not leave automatic briefs empty',
);

const agm = anRequests(g, s)
  .filter(x => x.by.includes('agm'))
  .map(x => x.pid);
assert.ok(agm.filter(id => research.picks.some(p => inPickRange(research, id, p))).length >= 6, 'assistant GM uses owned selections too');
assert.ok(agm.filter(id => research.ranks.get(id)!.rank <= 5).length >= 2);
const coveredBefore = anCovered(g, s);
s.assets.forEach((a: any) => (a.owner = -1));
s.assets.find((a: any) => a.rd === 1 && a.orig === picks[18].orig).owner = 0;
const coveredAfter = anCovered(g, s);
assert.notDeepEqual([...coveredBefore], [...coveredAfter], 'a pick trade invalidates cached analytics coverage');

console.log(
  'PASS: projected/acquired/second-round picks, top prospects, manual capacity, partial drafts, multi-team calls, future classes, no-pick fallback, analytics cache and unchanged data/RNG.',
);

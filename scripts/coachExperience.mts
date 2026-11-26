// Former players must earn coaching experience in actual jobs, not by waiting for a job. Salary inflation stays.
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { coachFromPlayer, coachRows, headCoachAsk, pastOf, staffSeason } from '../src/engine/coachCareer';
import { hireHeadCoach, ownerWay } from '../src/engine/carousel';
import { coachedSeasons, coachYears, coachAsk, ensureStaff, repOf, type Coach } from '../src/engine/staff';
import { coachBioDraft, saveCoachBio } from '../src/ui/coachEditing';

const g = Game.create(606, [0]),
  start = g.Y,
  p = g.db.P[g.state.rosters[0][0]],
  c = coachFromPlayer(g, p);
Object.assign(c, {
  play: { k: 'league', yrs: 15, tier: 3 },
  r: { off: 63, def: 53, dev: 72, game: 83, mot: 45, teach: 70, eye: 66 },
  repAdj: 0,
});
c.rep = repOf(g, c);
const rookieRep = c.rep;
assert.equal(coachYears(g, c), 0);
assert.equal(rookieRep, 46, 'Playing fame counts, but playing seasons are not coaching experience');
g.state.season += 14;
g.db.caps.CAP = 450.5;
assert.equal(coachYears(g, c), 0, 'Fourteen unemployed years do not create experience');
assert.equal(repOf(g, c), rookieRep, 'Waiting does not turn a famous ex-player into a proven coach');

// Reproduce the supplied save: one actual bench season but fourteen years since retiring as a player.
delete c.coachExpAdj;
c.h = [[g.Y, 19, 0, 0]];
c.rep = repOf(g, { ...c, pid: undefined }); // the old calendar-years formula
assert.equal(c.rep, 82);
const oldAsk = headCoachAsk(g, c),
  playing = JSON.stringify(p),
  history = JSON.stringify({ h: c.h, pz: c.pz, r: c.r }),
  caps = JSON.stringify(g.db.caps),
  mail = JSON.stringify(g.state.mail);
Object.assign(c, { tid: 1, role: 'hc', amt: 29.26, exp: g.Y + 5, next: { start: g.Y + 6, amt: 31.5, exp: g.Y + 8 } });
const contract = JSON.stringify({ amt: c.amt, exp: c.exp, next: c.next });
ensureStaff(g);
assert.equal(coachYears(g, c), 1, 'The completed season in the save counts immediately');
assert.equal(c.rep, 50);
assert(headCoachAsk(g, c) < oldAsk, 'New salary demands use earned experience');
assert.equal(JSON.stringify({ amt: c.amt, exp: c.exp, next: c.next }), contract, 'Signed guarantees are not rewritten');
assert.equal(JSON.stringify(p), playing, 'Player stats, salary and archive are untouched');
assert.equal(JSON.stringify({ h: c.h, pz: c.pz, r: c.r }), history, 'Recorded jobs and actual coaching abilities stay intact');
assert.equal(JSON.stringify(g.db.caps), caps, 'League inflation stays intact');
assert.equal(JSON.stringify(g.state.mail), mail, 'Existing mailbox entries stay historical');
const migrated = JSON.stringify(c);
ensureStaff(g);
assert.equal(JSON.stringify(c), migrated, 'Migration is idempotent');

// Counting is by unique coached seasons, not employers, role changes, or future rows.
const split: Coach = {
  ...c,
  h: [
    [g.Y - 2, 1, 1, 0],
    [g.Y - 2, 2, 3, 0, 20, 15, 1],
    [g.Y - 1, 2, 3, 0],
    [g.Y + 1, 2, 3, 0],
  ],
  past: [{ season: g.Y - 3, team: 'Earlier College', level: 'College', role: 'Assistant' }],
  pz: [[g.Y - 3, 'Earlier College', -1, 1, 0, '', [0]]],
};
assert.equal(coachedSeasons(g, split), 3, 'Jobs and compact/generated history cannot double-count a year');
assert.equal(coachYears(g, { ...split, ret: g.Y - 2 }), 2, 'Retirement stops the experience count');
const rep = repOf(g, c);
g.state.season++;
assert.equal(coachYears(g, c), 1, 'A calendar rollover alone adds no experience');
assert.equal(repOf(g, c), rep);
c.tid = 1;
c.role = 'asst';
staffSeason(g, g.state);
assert.equal(coachYears(g, c), 2, 'A newly recorded coached season adds one year');
assert.equal(c.rep, repOf(g, c), 'This summer’s hiring sees the newly earned experience without reopening the save');
staffSeason(g, g.state);
assert.equal(coachYears(g, c), 2, 'Recording a season twice does not add two years');

// A linked player without the newer creation marker still gets the safe earned-history rule.
const older = { ...c, coachExpAdj: undefined, made: undefined, h: [] } as Coach;
assert.equal(coachYears(g, older), 0);
// Generated coaches retain their existing legitimate outside-league careers and salary formula.
const veteran = Object.values(g.db.coaches).find(x => x.pid == null && pastOf(x).length)!;
assert.equal(coachYears(g, veteran), g.Y - veteran.since);
assert(coachRows(g, g.state, veteran).length > 0);
const scale = g.CAP / 165,
  highHead = headCoachAsk(g, c),
  highAsst = coachAsk(g, c, 'asst');
g.db.caps.CAP = 165;
assert(Math.abs(highHead - headCoachAsk(g, c) * scale) < 0.03, 'Head-coach asks still track cap inflation');
assert(Math.abs(highAsst - coachAsk(g, c, 'asst') * scale) < 0.03, 'Assistant asks still track cap inflation');
g.db.caps.CAP = 450.5;

// God Mode is only an editor: toggling it creates no experience. Explicit experience/pay/rep edits still work.
const e = Game.create(607, [0]),
  ec = coachFromPlayer(e, e.db.P[e.state.rosters[0][0]]);
e.state.season += 10;
ec.h = [
  [e.Y - 2, 1, 1, 0],
  [e.Y - 1, 1, 1, 0],
];
ec.rep = repOf(e, ec);
const originalJobs = JSON.stringify(ec.h),
  denied = JSON.stringify(ec),
  draft = { ...coachBioDraft(e, ec), years: 12, rep: 87, tid: 1, role: 'asst' as const, amt: 28, exp: e.Y + 3 };
assert.match(saveCoachBio(e, ec.id, draft), /God Mode/);
assert.equal(JSON.stringify(ec), denied);
e.setState({ god: true });
assert.equal(coachYears(e, ec), 2);
assert.equal(saveCoachBio(e, ec.id, draft), '');
assert.equal(coachYears(e, ec), 12);
assert.equal(coachBioDraft(e, ec).years, 12);
assert.equal(ec.rep, 87);
assert.equal(ec.amt, 28, 'An explicit God Mode salary is not capped');
assert.equal(ec.since, ec.made, 'Explicit experience does not move a former player’s actual starting year');
assert.equal(JSON.stringify(ec.h), originalJobs, 'Experience edits preserve recorded jobs');
const reopened = Game.load(JSON.parse(JSON.stringify(e.toSave()))),
  rc = reopened.db.coaches[ec.id];
assert.equal(coachYears(reopened, rc), 12);
assert.equal(rc.rep, 87);
assert.equal(rc.amt, 28);
reopened.setState({ god: false });
reopened.state.season++;
assert.equal(coachYears(reopened, rc), 12, 'God Mode experience does not keep growing while idle');
rc.h!.push([reopened.Y, 1, 1, 0]);
assert.equal(coachYears(reopened, rc), 13, 'Actual jobs add to explicitly edited experience');
reopened.setState({ god: true });
assert.equal(saveCoachBio(reopened, rc.id, { ...coachBioDraft(reopened, rc), years: 0, rep: 100 }), '');
assert.equal(coachYears(reopened, rc), 0, 'God Mode can lower experience without deleting history');
assert.equal(rc.rep, 100);
for (const row of rc.h!)
  assert(
    coachRows(reopened, reopened.state, rc).some(r => r.season === row[0]),
    'Recorded jobs remain visible at zero edited experience',
  );
rc.since = reopened.Y;
for (const row of rc.h!)
  assert(
    coachRows(reopened, reopened.state, rc).some(r => r.season === row[0]),
    'An older explicit start-year edit cannot hide recorded jobs',
  );

// Older explicit God Mode starting-year edits survive migration, then stop accumulating idle years.
delete rc.coachExpAdj;
rc.since = reopened.Y - 8;
rc.rep = repOf(reopened, rc);
const legacyRep = rc.rep;
ensureStaff(reopened);
assert.equal(coachYears(reopened, rc), 8);
assert.equal(rc.rep, legacyRep);
reopened.state.season++;
assert.equal(coachYears(reopened, rc), 8);

// Exercise the actual AI hiring path, not just the asking-price formula.
const h = Game.create(608, [0]),
  hc = coachFromPlayer(h, h.db.P[h.state.rosters[0][0]]);
Object.assign(hc, { play: { k: 'league', yrs: 15, tier: 3 }, repAdj: 0 });
h.state.season += 14;
h.db.caps.CAP = 450.5;
hc.rep = repOf(h, hc);
h.db.coaches = { [hc.id]: hc };
h.state.teams[1].arch = 'Hype Focus';
const expectedPay = +(headCoachAsk(h, hc) * (0.85 + 0.3 * ownerWay('Hype Focus').pay)).toFixed(2),
  random = Math.random;
try {
  Math.random = () => 0.1; // name-hire route, with exactly one available candidate
  const hired = hireHeadCoach(h, h.state, 1, { notices: [], log: [] });
  assert.equal(hired.c.id, hc.id);
  assert.equal(hired.route, 'name');
  assert.equal(hc.amt, expectedPay);
  assert.equal(coachYears(h, hc), 0);
} finally {
  Math.random = random;
}
assert.equal(c.made, start);
console.log(
  'PASS: earned former-player coaching experience, inflation, migration, history, actual hiring, guarantees and God Mode/save compatibility.',
);

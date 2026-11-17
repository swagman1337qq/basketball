import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import * as ST from '../src/engine/staff';
import { coachRows, coachFromPlayer } from '../src/engine/coachCareer';
import { coachBioDraft, coachPlayRows, saveCoachBio, randomCoachName, randomCoachCountry } from '../src/ui/coachEditing';
import { coachFaceData } from '../src/ui/CoachFace';
import { WOMENS_LEAGUE } from '../src/engine/coachCareer';
import { randomName } from '../src/data/heritage';
import { mulberry32 } from '../src/engine/rng';
import { RosterReports } from '../src/ui/screens/RosterTeamDetails';

const a = Game.create(31, [0]),
  b = Game.create(32, [0]);
for (const [g, rating] of [
  [a, 99],
  [b, 1],
] as const) {
  g.db.staffRev = 71251;
  ST.staffOf(g, 0).forEach(c => ST.CR_KEYS.forEach(k => (c.r[k] = rating)));
}
assert.equal(ST.staffFx(a, a.state, 0).q, 0.95);
assert.deepEqual(ST.staffFx(b, b.state, 0), ST.fxOf(ST.staffOf(b, 0)), 'Each save has its own effects cache');
assert.equal(ST.staffFx(a, a.state, 0).q, 0.95, 'Switching back keeps the first save intact');
// Replacing a loaded db on the same Game object also isolates the cache.
const original = a.db;
a.db = b.db;
assert.equal(ST.staffFx(a, a.state, 0).q, 0.35);
a.db = original;

const g = Game.create(33, [0]),
  s = g.state,
  year = g.Y;
const c = ST.staffOf(g, 0).find(x => x.role === 'asst')!;
c.amt = 1;
c.exp = year;
const before = ST.staffCost(g, s, 0);
const oldRole = c.role;
assert.match(ST.resignCoach(g, s, 0, c.id, { amt: 9, years: 3, role: 'lead' }), /already have/);
assert.equal(c.role, oldRole);
assert.equal(ST.staffOf(g, 0).filter(x => x.role === 'lead').length, 1);
assert.equal(ST.resignCoach(g, s, 0, c.id, { amt: 9, years: 3, role: 'asst' }), '');
assert.equal(c.amt, 1);
assert.equal(c.exp, year);
assert.deepEqual(c.next, { start: year + 1, amt: 9, exp: year + 3 });
assert.equal(ST.staffCost(g, s, 0), before, 'Signing next season cannot change this season payroll');
assert.match(ST.resignCoach(g, s, 0, c.id, { amt: 12, years: 3, role: 'asst' }), /already/);
assert.equal(c.next!.amt, 9, 'A second renewal cannot overwrite a signed extension');
assert(!ST.staffExpiring(g, s).some(n => n.lines.some((l: string) => l.includes(c.name))));
ST.staffContractsEnd(g, s);
assert.equal(c.tid, 0, 'A renewed coach stays when free agency opens');
assert.equal(c.amt, 1, 'June rollover does not charge next year salary early');
// Saving/loading keeps the future deal and does not activate it early.
const savedCoach = JSON.parse(JSON.stringify(c));
const reopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(reopened.db.coaches[c.id].next, c.next, 'The real save codec preserves signed extensions');
assert.equal(reopened.db.coaches[c.id].amt, 1);
g.db.coaches[c.id] = savedCoach;
ST.ensureStaff(g);
assert.equal(savedCoach.amt, 1);
s.season++;
ST.ensureStaff(g);
assert.equal(savedCoach.amt, 9);
assert.equal(savedCoach.exp, year + 3);
assert.equal(savedCoach.next, undefined);
const activatedCost = ST.staffCost(g, s, 0);
ST.ensureStaff(g);
assert.equal(ST.staffCost(g, s, 0), activatedCost, 'Activation is idempotent');

// A firing owes each guaranteed contract only in the seasons it covers.
const f = Game.create(34, [0]),
  fs = f.state,
  fy = f.Y;
const fired = ST.staffOf(f, 0).find(x => x.role === 'asst')!;
fired.amt = 1;
fired.exp = fy;
assert.equal(ST.resignCoach(f, fs, 0, fired.id, { amt: 9, years: 2, role: 'asst' }), '');
const fc = ST.staffCost(f, fs, 0);
assert.equal(ST.fireCoach(f, fs, 0, fired.id), '');
assert.equal(ST.staffCost(f, fs, 0), fc);
assert.equal(fired.next, undefined, 'Leaving cannot carry an old employer extension into a new job');
ST.staffContractsEnd(f, fs);
assert.equal(f.db.coachDead[0].length, 1, 'Only the future guarantee remains after June');
fs.season++;
const pay = ST.staffOf(f, 0).reduce((sum, x) => sum + x.amt, 0);
assert.equal(ST.staffCost(f, fs, 0), +((ST.SUPPORT * f.CAP) / 165 + pay + 9).toFixed(2));
fs.season += 2;
assert.equal(ST.staffCost(f, fs, 0), +((ST.SUPPORT * f.CAP) / 165 + pay).toFixed(2));

// Older coaches acquire a persistent generated career before an unseen profile can be rewritten.
const vet = ST.staffOf(g, 0).find(x => x.role === 'asst')!;
delete vet.past;
vet.bg = 'NBA assistant';
vet.since = g.Y - 15;
vet.made = g.Y;
const expected = JSON.parse(JSON.stringify(coachRows(g, s, vet).filter(r => r.season < g.Y)));
delete vet.past;
assert.equal(ST.fireCoach(g, s, 0, vet.id), '');
assert.deepEqual(JSON.parse(JSON.stringify(coachRows(g, s, vet).filter(r => r.season < g.Y))), expected);
const persisted = JSON.parse(JSON.stringify(vet));
const careerReopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
assert.deepEqual(careerReopened.db.coaches[vet.id].past, JSON.parse(JSON.stringify(vet.past)));
g.db.coaches[vet.id] = persisted;
ST.godEditCoach(g, vet.id, { off: 99, def: 99, game: 99 });
assert.deepEqual(JSON.parse(JSON.stringify(coachRows(g, s, persisted).filter(r => r.season < g.Y))), expected);
persisted.ret = g.Y - 5;
persisted.h = [[g.Y - 6, 0, 1, 1]];
persisted.coy = [g.Y - 7];
ST.staffYear(g, s);
assert.equal(g.db.coaches[vet.id], persisted, 'Retired coaches and award links remain resolvable');
assert.deepEqual(persisted.h, [[g.Y - 6, 0, 1, 1]]);
assert.deepEqual(persisted.coy, [g.Y - 7]);
assert(!ST.freeCoaches(g).includes(persisted));
assert(!ST.staffOf(g, 0).includes(persisted));

// Roster reports render actual staff, including new hires, and remove people who left.
const vm: any = { ctx: { gm: f, s: fs, T: fs.teams, open() {}, openTeamPage() {} } };
const render = () => renderToStaticMarkup(createElement(RosterReports, { vm, tid: 0, season: f.Y, ids: [] }));
const incoming = ST.freeCoaches(f).find(x => x.id !== fired.id)!;
assert.equal(ST.hireCoach(f, fs, 0, incoming.id, { amt: 20, years: 2, role: 'asst' }), '');
const html = render();
for (const coach of ST.staffOf(f, 0)) {
  assert(html.includes(coach.name), coach.name);
  assert(html.includes(ST.ROLE_LABEL[coach.role!]));
}
assert(html.includes(incoming.name));
assert(!html.includes(fired.name));
assert.equal(ST.fireCoach(f, fs, 0, incoming.id), '');
assert(!render().includes(incoming.name));
console.log(
  'PASS: save-isolated staff effects; deferred, unique-role renewals; activation and firing guarantees; immutable careers; retired archives; actual roster staff.',
);

// God Mode biography edits persist while keeping the employer and recorded performance intact.
const editGame = Game.create(35, [0]);
const editedCoach = ST.staffOf(editGame, 0)[0];
editedCoach.play = { k: 'college', yrs: 4, where: 'Old College' };
const oldPlaying = coachPlayRows(editGame, editedCoach).map(r => ({ ...r }));
const oldCoaching = structuredClone(coachRows(editGame, editGame.state, editedCoach));
const jobBefore = { tid: editedCoach.tid, role: editedCoach.role, amt: editedCoach.amt, exp: editedCoach.exp };
const draft = {
  ...coachBioDraft(editGame, editedCoach),
  name: 'Morgan Ellis',
  age: 29,
  race: 'dark',
  nat: 'GB',
  where: 'Harbor College',
  rep: 87,
  years: 6,
};
const beforeDenied = JSON.stringify(editedCoach);
assert.match(saveCoachBio(editGame, editedCoach.id, draft), /God Mode/);
assert.equal(JSON.stringify(editedCoach), beforeDenied, 'Normal mode cannot mutate staff identity');
editGame.setState({ god: true });
assert.equal(saveCoachBio(editGame, editedCoach.id, draft), '');
assert.deepEqual(coachBioDraft(editGame, editedCoach), draft);
assert.equal(editedCoach.first, 'Morgan');
assert.equal(editedCoach.last, 'Ellis');
assert.deepEqual({ tid: editedCoach.tid, role: editedCoach.role, amt: editedCoach.amt, exp: editedCoach.exp }, jobBefore);
assert.deepEqual(
  editedCoach.past,
  oldCoaching.filter(r => r.season < editGame.Y),
  'Existing coaching history is preserved',
);
assert(coachPlayRows(editGame, editedCoach).every(r => r.team === 'Harbor College'));
assert.deepEqual(
  coachPlayRows(editGame, editedCoach).map(({ team, ...r }) => r),
  oldPlaying.map(({ team, ...r }) => r),
  'School edits do not reroll playing stats',
);
const savedEdit = Game.load(JSON.parse(JSON.stringify(editGame.toSave())));
assert.deepEqual(coachBioDraft(savedEdit, savedEdit.db.coaches[editedCoach.id]), draft);
assert.deepEqual(coachPlayRows(savedEdit, savedEdit.db.coaches[editedCoach.id]), coachPlayRows(editGame, editedCoach));
// Reputation edits must hit their target even when experience puts the natural formula above 100.
for (const [years, rep] of [
  [100, 1],
  [0, 99],
  [100, 0],
  [0, 100],
]) {
  assert.equal(saveCoachBio(editGame, editedCoach.id, { ...draft, years, rep }), '');
  assert.equal(editedCoach.rep, rep);
}
const beforeInvalid = JSON.stringify(editedCoach);
assert(saveCoachBio(editGame, editedCoach.id, { ...draft, nat: 'invalid' }));
assert.equal(JSON.stringify(editedCoach), beforeInvalid, 'Invalid edits are atomic');
const former = editGame.db.P[editGame.state.rosters[0][0]];
const linked = coachFromPlayer(editGame, former);
const archivedPlayer = JSON.stringify(former);
const linkedPlaying = structuredClone(coachPlayRows(editGame, linked));
assert.equal(
  saveCoachBio(editGame, linked.id, {
    ...coachBioDraft(editGame, linked),
    name: 'Jordan Mercer',
    race: 'asian',
    age: 48,
    nat: 'CA',
    where: 'Lakeside College',
    years: 12,
    rep: 64,
  }),
  '',
);
assert.equal(JSON.stringify(former), archivedPlayer, 'Staff edits leave the linked player archive untouched');
assert.deepEqual(coachPlayRows(editGame, linked), linkedPlaying, 'Recorded league playing teams and stats stay authoritative');
editGame.setState({ god: false });
const afterGod = JSON.stringify(linked);
assert(saveCoachBio(editGame, linked.id, coachBioDraft(editGame, linked)));
assert.equal(JSON.stringify(linked), afterGod);
console.log('PASS: staff biography edits require God Mode, persist, retain history and leave player archives and coaching jobs intact.');

// God Mode can rewrite employment and both current/future contracts, in every role.
const jobGame = Game.create(36, [0]);
const jobCoach = ST.staffOf(jobGame, 0)[0];
const jobBeforeDenied = JSON.stringify(jobCoach);
assert(saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), tid: 1, role: 'hc', amt: 9.75, exp: jobGame.Y + 5 }));
assert.equal(JSON.stringify(jobCoach), jobBeforeDenied);
jobGame.setState({ god: true });
const priorHead = Object.values(jobGame.db.coaches).find(x => x.tid === 1 && x.role === 'hc')!;
const jobPast = structuredClone(jobCoach.past);
const jobDeal = {
  ...coachBioDraft(jobGame, jobCoach),
  tid: 1,
  role: 'hc' as const,
  amt: 9.75,
  exp: jobGame.Y + 5,
  next: { start: jobGame.Y + 6, exp: jobGame.Y + 8, amt: 12.25 },
};
assert.equal(saveCoachBio(jobGame, jobCoach.id, jobDeal), '');
assert.equal(jobCoach.tid, 1);
assert.equal(jobCoach.role, 'hc');
assert.equal(priorHead.role, 'asst', 'The occupied head coach job is replaced without duplicating head coaches');
assert.equal(jobCoach.amt, 9.75);
assert.equal(jobCoach.exp, jobGame.Y + 5);
assert.deepEqual(jobCoach.next, jobDeal.next);
assert.deepEqual(jobCoach.past, jobPast);
assert(!(jobGame.db as any).coachDead?.[0]?.length, 'God moves do not create a firing payout');
// Own-team head coach assignments remain after toggling God Mode off and reopening.
assert.equal(saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), tid: 0, role: 'hc' }), '');
jobGame.setState({ god: false });
let jobReopen = Game.load(JSON.parse(JSON.stringify(jobGame.toSave())));
assert.equal(jobReopen.db.coaches[jobCoach.id].tid, 0);
assert.equal(jobReopen.db.coaches[jobCoach.id].role, 'hc');
assert.deepEqual(jobReopen.db.coaches[jobCoach.id].next, jobDeal.next);
assert.equal(
  Object.values(jobReopen.db.coaches).filter(c => c.tid === 1 && c.role === 'hc').length,
  1,
  'The vacated AI head-coach job receives a replacement',
);
jobGame.setState({ god: true });
for (const role of ST.ROLE_ORDER) {
  assert.equal(
    saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), tid: 2, role, amt: 7.5, exp: jobGame.Y + 4, next: null }),
    '',
  );
  jobReopen = Game.load(JSON.parse(JSON.stringify(jobGame.toSave())));
  assert.equal(jobReopen.db.coaches[jobCoach.id].tid, 2);
  assert.equal(jobReopen.db.coaches[jobCoach.id].role, role);
  assert.equal(jobReopen.db.coaches[jobCoach.id].amt, 7.5);
}
const jobAtomic = JSON.stringify(jobCoach);
assert(saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), tid: 99999 }));
assert(saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), next: { start: jobGame.Y, exp: jobGame.Y + 1, amt: 5 } }));
assert.equal(JSON.stringify(jobCoach), jobAtomic, 'Invalid jobs and overlapping extensions are rejected before changing any field');
// Editing the contract changes current payroll; a future extension activates only when due.
assert.equal(
  saveCoachBio(jobGame, jobCoach.id, {
    ...coachBioDraft(jobGame, jobCoach),
    tid: 0,
    role: 'asst',
    amt: 3.25,
    exp: jobGame.Y,
    next: { start: jobGame.Y + 1, exp: jobGame.Y + 3, amt: 8.5 },
  }),
  '',
);
const payrollBeforeExtension = ST.staffCost(jobGame, jobGame.state, 0);
ST.ensureStaff(jobGame);
assert.equal(jobCoach.amt, 3.25);
assert.equal(ST.staffCost(jobGame, jobGame.state, 0), payrollBeforeExtension);
jobGame.state.season++;
ST.ensureStaff(jobGame);
assert.equal(jobCoach.amt, 8.5);
assert.equal(jobCoach.next, undefined);
assert.equal(saveCoachBio(jobGame, jobCoach.id, { ...coachBioDraft(jobGame, jobCoach), tid: null }), '');
assert.equal(jobCoach.tid, null);
assert.equal(jobCoach.role, null);
assert.equal(jobCoach.amt, 0);
assert.equal(jobCoach.exp, 0);
assert.equal(jobCoach.next, undefined);
console.log(
  'PASS: God-only contracts, extensions, all-team/all-role moves, own-team head-coach persistence, replacement heads and payroll activation.',
);

// Staff gender/portraits edit independently of player archives, and playing leagues follow gender.
const genderGame = Game.create(37, [0]);
genderGame.setState({ god: true });
const genderCoach = ST.staffOf(genderGame, 0)[0];
genderCoach.fem = false;
genderCoach.play = { k: 'pro', yrs: 6, tier: 2 };
const malePlaying = structuredClone(coachPlayRows(genderGame, genderCoach));
const genderCareer = structuredClone(coachRows(genderGame, genderGame.state, genderCoach));
const femaleDraft = {
  ...coachBioDraft(genderGame, genderCoach),
  fem: true,
  faceSeed: 123456,
  faceX: { 'skin.tone': 0.47, 'marks.freckles': 0.2 },
};
assert.equal(saveCoachBio(genderGame, genderCoach.id, femaleDraft), '');
assert.equal(genderCoach.fem, true);
assert.equal(genderCoach.play.k, 'women');
assert(coachPlayRows(genderGame, genderCoach).every(r => r.lg === WOMENS_LEAGUE));
assert.deepEqual(
  coachPlayRows(genderGame, genderCoach).map(({ lg, ...r }) => r),
  malePlaying.map(({ lg, ...r }) => r),
);
assert.deepEqual(coachRows(genderGame, genderGame.state, genderCoach), genderCareer, 'Gender edits do not rewrite coaching jobs');
const faceEdited = coachFaceData(genderGame, genderCoach, ST.coachAge(genderGame, genderCoach));
assert.equal(faceEdited.fem, true);
assert.equal(faceEdited.skin.tone, 0.47);
const genderSave = Game.load(JSON.parse(JSON.stringify(genderGame.toSave())));
assert.equal(genderSave.db.coaches[genderCoach.id].fem, true);
assert.deepEqual(
  coachFaceData(genderSave, genderSave.db.coaches[genderCoach.id], ST.coachAge(genderSave, genderSave.db.coaches[genderCoach.id])),
  faceEdited,
);
assert.equal(
  saveCoachBio(genderGame, genderCoach.id, { ...coachBioDraft(genderGame, genderCoach), faceSeed: 654321, faceX: undefined }),
  '',
);
assert.notEqual(coachFaceData(genderGame, genderCoach, ST.coachAge(genderGame, genderCoach)).seed, faceEdited.seed);
assert.equal(saveCoachBio(genderGame, genderCoach.id, { ...coachBioDraft(genderGame, genderCoach), fem: false }), '');
assert.equal(genderCoach.play.k, 'pro');
assert.deepEqual(coachPlayRows(genderGame, genderCoach), malePlaying);
const collegeCoach = ST.mkCoach(genderGame, { fem: true, play: 'college' });
assert.equal(saveCoachBio(genderGame, collegeCoach.id, { ...coachBioDraft(genderGame, collegeCoach), fem: false }), '');
assert(coachPlayRows(genderGame, collegeCoach).every(r => r.lg === 'NCAA'));
assert.equal(saveCoachBio(genderGame, collegeCoach.id, { ...coachBioDraft(genderGame, collegeCoach), fem: true }), '');
assert(coachPlayRows(genderGame, collegeCoach).every(r => r.lg === 'Women’s NCAA'));
const linkedGender = coachFromPlayer(genderGame, genderGame.db.P[genderGame.state.rosters[0][0]]);
const playerUnchanged = JSON.stringify(genderGame.db.P[linkedGender.pid!]);
assert.equal(saveCoachBio(genderGame, linkedGender.id, { ...coachBioDraft(genderGame, linkedGender), fem: true, faceSeed: 78901 }), '');
assert.equal(JSON.stringify(genderGame.db.P[linkedGender.pid!]), playerUnchanged);
assert.equal(coachFaceData(genderGame, linkedGender, ST.coachAge(genderGame, linkedGender)).fem, true);
genderGame.setState({ god: false });
const genderBeforeDenied = JSON.stringify(genderCoach);
assert(saveCoachBio(genderGame, genderCoach.id, { ...coachBioDraft(genderGame, genderCoach), fem: true, faceSeed: 999 }));
assert.equal(JSON.stringify(genderCoach), genderBeforeDenied);
console.log(
  'PASS: God-only gender changes, matching playing leagues, reversible histories, custom/random faces, save persistence and isolated player archives.',
);

for (const fem of [false, true]) {
  assert.equal(
    randomCoachName('FI', fem, '', mulberry32(123)),
    randomName('FI', mulberry32(123), undefined, fem).name,
    'Name randomizer follows selected country and gender',
  );
}
let randomCountry = 'US';
const staffRandom = mulberry32(9981),
  countriesSeen = new Set<string>();
for (let i = 0; i < 100; i++) {
  const nextCountry = randomCoachCountry(genderGame.db.C, randomCountry, staffRandom);
  assert(genderGame.db.C[nextCountry]?.iso);
  assert.notEqual(nextCountry, randomCountry);
  countriesSeen.add(nextCountry);
  randomCountry = nextCountry;
}
assert(countriesSeen.size > 20);
assert.equal(randomCoachCountry({ US: { n: 'United States', iso: 'us' } }, 'US', staffRandom), 'US');
console.log('PASS: staff identity randomizers use country/gender, draw valid flags, and avoid repeating the current country.');
// Gender-aware staff copy, including finished notices already present in an older save.
const pronounGame = Game.create(942, [0]);
const pc = ST.staffOf(pronounGame, 0).find(x => x.role === 'asst')!;
Object.assign(pc, { name: 'Claire Walker', fem: true, born: pronounGame.Y - 35, amt: 0.01, exp: pronounGame.Y + 3 });
// Guarantee the raise branch under the fixed 0.5 roll; generated personalities vary.
pc.pers.money = 99;
delete pc.raise;
delete pc.next;
assert.equal(
  ST.coachWording(pc, 'He thinks he’s worth more; turn him down when his deal ends.'),
  'She thinks she’s worth more; turn her down when her deal ends.',
);
assert.equal(ST.coachWording({ fem: false }, 'He sees himself as a lead.'), 'He sees himself as a lead.');
assert.equal(ST.coachWording(pc, 'He sees himself as a lead.'), 'She sees herself as a lead.');
const savedRandom = Math.random;
let raiseNotice: any;
try {
  Math.random = () => 0.5;
  raiseNotice = ST.staffYear(pronounGame, pronounGame.state).notices.find(n => n.title === 'Claire Walker asks for a raise');
} finally {
  Math.random = savedRandom;
}
assert(raiseNotice);
assert.match(raiseNotice.lines[0], /thinks she’s worth/);
assert.match(raiseNotice.lines[1], /turn her down and she won’t re-sign when her deal ends/);
pc.sour = pronounGame.Y;
assert.match(ST.coachAccept(pronounGame, pronounGame.state, 0, pc, { role: 'asst', amt: 0.01, years: 3 }).why, /^She.*she won’t re-sign/);
const oldLine = 'Your Assistant Coach makes $2.2M a year and thinks he’s worth $2.9M.';
pronounGame.state.mail = [
  {
    id: 'old-raise',
    title: 'Claire Walker asks for a raise',
    lines: [oldLine, 'Answer on the Staff screen: turn him down and he won’t re-sign when his deal ends.'],
    season: pronounGame.Y,
    date: 'Jul 14, 2040',
    seq: 1,
  },
  { id: 'player-copy', title: 'Player update', lines: [oldLine] },
];
const pronounReopen = Game.load(JSON.parse(JSON.stringify(pronounGame.toSave())));
assert.match(pronounReopen.state.mail[0].lines[0], /thinks she’s worth \$2.9M/);
assert.match(pronounReopen.state.mail[0].lines[1], /turn her down and she won’t re-sign when her deal ends/);
assert.equal(pronounReopen.state.mail[1].lines[0], oldLine, 'Non-staff messages are untouched');
const repairedCopy = JSON.stringify(pronounReopen.state.mail);
ST.ensureStaff(pronounReopen);
assert.equal(JSON.stringify(pronounReopen.state.mail), repairedCopy, 'Legacy repair is idempotent');
console.log('PASS: female staff notices and contract wording, male wording, existing save repair and unrelated-message isolation.');

// Search and shortlist (2026-11-28): coaches and analytics people in the global search, the staff shortlist, and the
// Mailbox search's text of a message. Run: npx tsx scripts/staffSearch.mts
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { newLeague } from './lib/headless.mts';
import { searchAll } from '../src/ui/search';
import { staffSearchRows } from '../src/ui/staffSearch';
import { onStaffList, staffList, toggleStaffList } from '../src/engine/staffShortlist';
import { textOfItem } from '../src/ui/screens/MailboxScreen';
import { anDb } from '../src/engine/analytics';

const g: any = newLeague(12),
  s = g.state,
  T = s.teams;
const coaches = Object.values(g.db.coaches || {}) as any[],
  analysts = Object.values(anDb(g)) as any[];
const rows = staffSearchRows(g, T);
assert.equal(rows.length, coaches.length + analysts.length);
const find = (q: string) =>
  searchAll({
    q,
    P: g.db.P,
    C: g.db.C,
    T,
    tidOf: {},
    nav: [],
    flag: () => '',
    open: () => () => {},
    openTeam: () => () => {},
    openList: () => () => {},
    teamLogo: () => null,
    Y: g.Y,
    staff: rows,
  });
// A coach on a team, by part of his last name in lower case, opens his profile.
const hc = coaches.find(c => c.tid != null && !c.ret && c.name.split(' ').pop().length >= 5)!,
  part = hc.name.split(' ').pop().slice(1, 5).toLowerCase();
const hit = find(part).find((x: any) => x.sec === 'Coaches' && x.name === hc.name);
assert.ok(hit, 'coach found by "' + part + '"');
assert.match(hit.meta, new RegExp(T[hc.tid].abbr));
hit.open();
assert.equal(g.state.coachPid, hc.id);
// An analyst, by full name.
const an = analysts.find(a => !a.ret)!;
const ah = find(an.name).find((x: any) => x.sec === 'Analytics staff' && x.name === an.name);
assert.ok(ah, 'analyst found');
ah.open();
assert.equal(g.state.anPid, an.id);
// Accents don't matter.
const rowsX = [{ sec: 'Coaches' as const, name: 'Andrés Núñez', nat: 'ES', meta: 'Coach · available', active: true, open: () => {} }];
assert.ok(
  searchAll({
    q: 'nunez',
    P: {},
    C: g.db.C,
    T,
    tidOf: {},
    nav: [],
    flag: () => '',
    open: () => () => {},
    openTeam: () => () => {},
    openList: () => () => {},
    teamLogo: () => null,
    Y: g.Y,
    staff: rowsX,
  }).some((x: any) => x.name === 'Andrés Núñez'),
);

// The staff shortlist: star and unstar, coaches and analysts kept apart.
toggleStaffList(g, 'c', hc.id);
toggleStaffList(g, 'a', an.id);
assert.ok(onStaffList(g.state, 'c', hc.id) && onStaffList(g.state, 'a', an.id));
assert.ok(!onStaffList(g.state, 'a', hc.id) || hc.id === an.id);
toggleStaffList(g, 'c', hc.id);
assert.deepEqual(staffList(g.state), { c: [], a: [an.id] });

// Mail search text: plain words from the title, the lines (links included), the kind and the players in it.
const P = { 7: { name: 'Zoltán Varga' } };
const item = {
  kind: 'update' as const,
  date: 'Jun 30, 2028',
  title: 'Coach gone: Marcus Whitfield',
  lines: [createElement('span', null, 'He left for ', createElement('b', null, 'the Lakers'), '.'), 'Hire a replacement.'],
  pids: [7],
};
const txt = textOfItem(item, P);
for (const w of ['Update', 'Whitfield', 'the Lakers', 'replacement', 'Zoltán Varga', '2028']) assert.ok(txt.includes(w), w);
console.log('staff search ok');

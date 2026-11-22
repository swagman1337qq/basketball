import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import { resolveInbox } from '../src/engine/frontOffice';
import { archiveDashboardMail } from '../src/engine/dashboardMail';
import { mulberry32 } from '../src/engine/rng';
import { MailboxScreen } from '../src/ui/screens/MailboxScreen';
import { newLeague, clr } from './lib/headless.mts';

const originalRandom = Math.random;
const hash = (x: any) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
try {
  const g: any = newLeague(88231),
    tid = g.state.me,
    pid = g.state.rosters[tid][0];
  const item = (kind: string, extra: any = {}) => ({
    id: 'test-' + kind,
    tid,
    season: g.Y,
    day: g.state.day,
    kind,
    done: false,
    pid,
    title: kind + ' dashboard news',
    text: kind + ' message body',
    options: [
      { k: 'yes', label: 'Choose yes' },
      { k: 'no', label: 'Choose no' },
    ],
    ...extra,
  });
  clr(g);
  const startSeq = g.state.mailSeq || 0;
  const news = ['sale', 'avail', 'protect', 'feature', 'padder', 'mandate', 'firesale'].map(k =>
    item(
      k,
      k === 'mandate' ? { done: true, options: [], target: 100, deadline: 'opening' } : k === 'firesale' ? { done: true, options: [] } : {},
    ),
  );
  g.setState({ inbox: news });
  assert.equal(g.state.mailSeq, startSeq + news.length, 'Every kind of dashboard notice is unread mail, including informational items');
  assert.equal(g.mailWaiting(), news.length);
  assert(
    news.every(x => !x.mailId),
    'Archiving does not mutate the producer records',
  );
  assert(g.state.inbox.every((x: any) => x.mailId));
  assert.deepEqual(
    g.state.mail.filter((m: any) => m.inboxItem).map((m: any) => m.title),
    news.map(x => x.title),
  );
  for (const dense of [true, false]) {
    g.state.screen = 'mail';
    g.state.design = dense ? 'hadrian' : 'classic';
    const vm: any = { dense, ctx: { gm: g, s: g.state, T: g.state.teams, open: () => {} }, inOffersV: { has: () => false } };
    const html = renderToStaticMarkup(createElement(MailboxScreen, { vm }));
    assert.match(html, /sale dashboard news/);
    assert.match(html, /sale message body/);
    assert.match(html, /Choose yes/);
    assert.match(html, /Choose no/);
    assert.match(html, /Waiting on you/);
    assert.match(html, /Active mandate/);
  }
  const seq = g.state.mailSeq,
    count = g.state.mail.length;
  g.setState({ screen: 'roster' });
  g.setState({ inbox: g.state.inbox.slice(), clubs: { ...g.state.clubs } });
  assert.equal(g.state.mailSeq, seq, 'Navigation and new array identities do not redeliver mail');
  assert.equal(g.state.mail.length, count);
  assert.equal(archiveDashboardMail(g, g.state), g.state, 'Unchanged input preserves state identity');

  g.setState({ mailRead: seq });
  assert.equal(g.mailWaiting(), 0, 'Reading the mailbox releases the existing simulation hold');
  const beforeBadChoice = hash(g.toSave());
  resolveInbox(g, 'test-protect', 'invalid');
  assert.equal(hash(g.toSave()), beforeBadChoice, 'Invalid/stale response buttons cannot change a player');
  resolveInbox(g, 'test-protect', 'yes');
  assert.equal(g.db.P[pid].protect, true);
  assert.equal(g.state.mail.find((m: any) => m.inboxItem?.kind === 'protect').inboxItem.choice, 'yes');
  assert.equal(g.state.mailSeq, seq, 'Answering does not generate a second interruption');
  const afterAnswer = hash(g.toSave());
  resolveInbox(g, 'test-protect', 'no');
  assert.equal(hash(g.toSave()), afterAnswer, 'A decision can only be applied once');
  resolveInbox(g, 'test-avail', 'yes');
  assert.equal(g.db.P[pid].minMin, 6);
  resolveInbox(g, 'test-feature', 'yes');
  assert.equal(g.db.P[pid].padding, true);
  resolveInbox(g, 'test-padder', 'no');
  assert.equal(g.db.P[pid].padding, false);

  // Archived decisions retain their outcome after the dashboard's 40-item list drops them.
  const delivered = g.state.inbox;
  g.setState({ inbox: [] });
  assert.equal(g.state.mail.find((m: any) => m.inboxItem?.kind === 'protect').inboxItem.choice, 'yes');
  g.setState({ inbox: delivered, mail: [], mailRead: seq });
  assert.equal(g.state.mail.length, 0, 'A rolled-over mailbox must not cause old dashboard items to be delivered again');

  // Multiple managed clubs: a decision belongs to its originating club, not whichever roster is on screen.
  g.setState({
    managed: [0, 1],
    me: 0,
    clubs: { 1: { ...g.defaultClub(1), inbox: [item('padder', { id: 'other-padder', tid: 1, pid: g.state.rosters[1][0] })] } },
  });
  const otherPid = g.state.rosters[1][0],
    firstLog = hash(g.state.log);
  resolveInbox(g, 'other-padder', 'yes', 1);
  assert.equal(g.state.me, 0);
  assert.equal(g.db.P[otherPid].padding, true);
  assert.equal(hash(g.state.log), firstLog, 'Another club response cannot write into the on-screen club log');
  assert(g.state.clubs[1].log[0].text.includes('Choose yes'));
  assert.equal(g.state.clubs[1].inbox[0].done, true);
  g.setState({
    clubs: {
      ...g.state.clubs,
      1: { ...g.state.clubs[1], inbox: [item('sale', { id: 'other-sale', tid: 1, options: [{ k: 'ok', label: 'Meet the new owner' }] })] },
    },
  });
  resolveInbox(g, 'other-sale', 'ok', 1);
  assert.equal(g.state.me, 1);
  assert.equal(g.state.screen, 'owner');
  assert.equal(g.state.inbox[0].done, true);
  g.setState({ mailRead: g.state.mailSeq });
  const reopened: any = Game.load(structuredClone(g.toSave()));
  assert.equal(reopened.mailWaiting(), 0);
  assert.equal(reopened.state.mailSeq, g.state.mailSeq);
  assert.equal(reopened.state.mail.find((m: any) => m.inboxItem?.id === 'other-sale').inboxItem.done, true);
  assert.deepEqual(
    reopened.state.mail.map((m: any) => m.id),
    g.state.mail.map((m: any) => m.id),
  );

  const order = item('mandate', { id: 'repeated-order', tid: 1, done: true, options: [], target: 100, deadline: 'opening' });
  reopened.setState({ inbox: [order, ...reopened.state.inbox] });
  const firstOrder = reopened.state.inbox[0],
    firstOrderSeq = reopened.state.mailSeq;
  reopened.setState({ mailRead: firstOrderSeq });
  reopened.setState({
    inbox: [{ ...order, target: 150 }, ...reopened.state.inbox.map((x: any) => (x === firstOrder ? { ...x, resolved: 'met' } : x))],
  });
  const orders = reopened.state.mail.filter((m: any) => m.inboxItem?.id === order.id);
  assert.equal(orders.length, 2, 'A repeated payroll order is a new event even when it reuses the old domain ID');
  assert.notEqual(orders[0].id, orders[1].id);
  assert.equal(reopened.state.mailSeq, firstOrderSeq + 1);
  assert.equal(reopened.mailWaiting(), 1);
  assert.equal(orders[0].inboxItem.target, 150);
  assert.equal(orders[1].inboxItem.target, 100);
  assert.equal(orders[1].inboxItem.resolved, 'met');
  const earlierChoice = item('feature', { id: 'repeated-choice', tid: 1, title: 'Earlier choice' });
  reopened.setState({ inbox: [{ ...earlierChoice, title: 'New choice' }, earlierChoice, ...reopened.state.inbox] });
  const exactChoice = reopened.state.inbox[1].mailId;
  resolveInbox(reopened, earlierChoice.id, 'yes', 1, exactChoice);
  assert.equal(reopened.state.inbox[1].done, true);
  assert.equal(reopened.state.inbox[0].done, false, 'Answering an archived item never answers another item with the same domain ID');
  const cappedMail = Array.from({ length: 250 }, (_, i) => ({ id: 'other-mail-' + i, seq: i + 1 }));
  reopened.setState({ mail: cappedMail, mailSeq: 250, mailRead: 250 });
  reopened.setState({ inbox: [item('sale', { id: 'new-after-cap', tid: 1 }), ...reopened.state.inbox] });
  assert.equal(reopened.state.mail.length, 250);
  assert.equal(reopened.state.mailSeq, 251);
  assert.equal(reopened.mailWaiting(), 1);
  reopened.setState({ inbox: reopened.state.inbox.slice() });
  assert.equal(reopened.state.mailSeq, 251, 'Trimmed archive entries cannot bounce back into unread mail');

  // Existing saves backfill pending items as unread, and old answered items as read history.
  const legacy = structuredClone(reopened.toSave());
  legacy.state.inbox = [
    item('sale', { id: 'legacy-sale', tid: 1 }),
    item('feature', { done: true, choice: 'yes' }),
    item('mandate', { done: true, options: [], deadline: 'opening', target: 100 }),
  ];
  legacy.state.mail = [];
  legacy.state.mailSeq = legacy.state.mailRead = 0;
  const migrated: any = Game.load(legacy);
  assert.equal(migrated.mailWaiting(), 2);
  assert.equal(migrated.state.mail.length, 3);
  assert.equal(migrated.state.mail.find((m: any) => m.inboxItem.kind === 'feature').seq, 0);
  migrated.setState({ mailRead: migrated.state.mailSeq });
  const secondLoad: any = Game.load(structuredClone(migrated.toSave()));
  assert.equal(secondLoad.mailWaiting(), 0);
  assert.equal(secondLoad.state.mail.length, 3);
  const spectator = { ...secondLoad.state, spectator: true };
  assert.equal(archiveDashboardMail(secondLoad, spectator), spectator);
  assert.equal(secondLoad.mailWaiting(spectator), 0);

  // Real daily engine: keep the entire completed day's stats/results, but do not start another day.
  const base: any = newLeague(55192);
  clr(base);
  const save = structuredClone(base.toSave());
  const a: any = Game.load(structuredClone(save)),
    b: any = Game.load(structuredClone(save));
  const day = a.state.day,
    normal = a.simDaySteps.bind(a);
  a.simDaySteps = function* (s: any, forced: any, left: number) {
    const patch = yield* normal(s, forced, left);
    return { ...patch, inbox: [item('sale', { id: 'during-sim', season: a.Y, day: s.day }), ...(patch.inbox || s.inbox || [])] };
  };
  const reset = () => {
    const r = mulberry32(4451);
    let n = 0;
    Math.random = () => {
      n++;
      return r();
    };
    return () => n;
  };
  const drawsA = reset();
  await a.sim(10);
  const usedA = drawsA();
  const drawsB = reset();
  await b.sim(1);
  assert.equal(a.state.day, day + 1, 'New dashboard news stops a multi-day simulation after the completed day');
  assert.equal(usedA, drawsB(), 'Mail delivery consumes no simulation randomness');
  assert.equal(hash(a.db), hash(b.db), 'Every player, box score and database record matches a normal one-day simulation');
  for (const key of ['teams', 'rosters', 'tstats', 'games', 'assets', 'fa'])
    assert.equal(hash(a.state[key]), hash(b.state[key]), key + ' remains identical');
  assert.equal(a.busy, false);
  assert.equal(a.dayInProgress, false);
  const blockedDay = a.state.day;
  await a.sim(10);
  assert.equal(a.state.day, blockedDay, 'Unread dashboard mail prevents restarting the simulation');
  a.setState({ mailRead: a.state.mailSeq });
  a.simDaySteps = normal;
  await a.sim(1);
  assert.equal(a.state.day, blockedDay + 1, 'Reading mail allows simulation to resume without repeating the old news');

  // Also catch news arriving while the detached browsing copy is being prepared.
  const prep: any = Game.load(structuredClone(save));
  const prepDay = prep.state.day;
  prep.prepareSimulation = async () => prep.setState({ inbox: [item('sale', { id: 'during-preparation' })] });
  await prep.sim(5);
  assert.equal(prep.state.day, prepDay, 'News during preparation holds the sim before its first game');
  assert(prep.mailWaiting() > 0);
  console.log(
    'PASS: dashboard news delivery, both mailbox layouts, correct-club actions, save/load, backfill, deduplication, simulation stop/resume and identical game stats/RNG',
  );
} finally {
  Math.random = originalRandom;
}

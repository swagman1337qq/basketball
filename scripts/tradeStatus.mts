import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Game } from '../src/engine/Game';
import {
  protectedOfferNotice,
  playerTradeStatus,
  setPlayerTradeStatus,
  rejectAllTradeOffers,
  setRejectAllTradeOffers,
} from '../src/engine/tradeStatus';
import { offerToUser } from '../src/engine/tradeLogic';
import { mulberry32 } from '../src/engine/rng';
import { StaffScreen } from '../src/ui/screens/StaffScreen';

Math.random = mulberry32(8211);
const g: any = Game.create(8211, [0]),
  [pid, other] = g.state.rosters[0],
  target = g.state.rosters[1][0];
g.setState({ gmSetup: false, notices: [], inOffers: [], god: false });
const p = g.db.P[pid],
  initialRoster = structuredClone(g.state.rosters);
const offer = { id: 'status-test', a: 1, b: 0, aP: [target], bP: [pid], aK: [], bK: [], day: g.state.day, why: 'Test offer' };
const statsVersion = g.statsVersion,
  saveVersion = g.saveVersion;
setPlayerTradeStatus(g, pid, 'untouchable');
assert.equal(playerTradeStatus(p, 0), 'untouchable');
assert.equal(playerTradeStatus(p, 1), null, 'preferences belong to the team that set them');
assert.equal(g.statsVersion, statsVersion, 'a preference alone does not invalidate player statistics');
assert(g.saveVersion > saveVersion, 'preferences are persisted');
const notice = protectedOfferNotice(g, g.state, offer)!;
assert.match(notice.title, /automatically rejected/);
assert(notice.lines.join(' ').includes(p.name) && notice.lines.join(' ').includes(g.db.P[target].name));
assert.equal((notice as any).offerId, undefined, 'rejected mail has no accept action');
assert.equal(protectedOfferNotice(g, g.state, { ...offer, bP: [other] }), null, 'ordinary offers remain available');
assert.equal(protectedOfferNotice(g, g.state, { ...offer, b: 1, bP: [target] }), null, 'other teams retain control of their own players');

g.setState({ inOffers: [offer], tTid: 1, tMine: [pid], tTheirs: [target], tkMine: [], tkTheirs: [] });
g.propose(false, offer.id);
assert.deepEqual(g.state.rosters, initialRoster, 'accepting a protected offer never moves anybody');
assert.equal(g.state.inOffers.length, 0);
assert.match(g.state.mail[0].title, /automatically rejected/);
assert(g.state.mailSeq > (g.state.mailRead || 0), 'the rejected offer is unread mailbox history');
const mailCount = g.state.mail.length;
g.propose(false, offer.id);
assert.equal(g.state.mail.length, mailCount, 'a stale Accept click cannot duplicate rejected mail or execute the offer');
assert.match(g.state.tMsg, /no longer available/);

setPlayerTradeStatus(g, pid, null);
g.setState({
  inOffers: [
    { ...offer, id: 'pending-a' },
    { ...offer, id: 'pending-b', bP: [other] },
  ],
});
setPlayerTradeStatus(g, pid, 'untouchable');
assert.deepEqual(
  g.state.inOffers.map(o => o.id),
  ['pending-b'],
  'marking him immediately rejects matching pending offers only',
);
assert.equal(g.state.mail.length, mailCount + 1);
setPlayerTradeStatus(g, pid, 'block');
assert.equal(playerTradeStatus(p, 0), 'block', 'block and untouchable are mutually exclusive');
setPlayerTradeStatus(g, target, 'untouchable');
assert.equal(g.db.P[target].tradeStatus, undefined, 'you cannot change another team’s preferences');
setPlayerTradeStatus(g, pid, 'invalid' as any);
assert.equal(playerTradeStatus(p, 0), 'block');
const loaded = Game.load(g.toSave());
assert.equal(playerTradeStatus(loaded.db.P[pid], 0), 'block');
assert(loaded.state.mail.some(m => m.title === 'Trade offer automatically rejected'));

g.setState({ rosters: { ...g.state.rosters, 0: g.state.rosters[0].filter(id => id !== pid), 1: [...g.state.rosters[1], pid] } });
assert.equal(p.tradeStatus, undefined, 'trade preferences clear when he leaves the team');

// A young player normally outside a contender's target filter is considered
// when put on the block. Actual package-building and salary checks still run.
const market: any = Game.create(8200, [0]);
market.setState({ gmSetup: false, assets: [] });
for (const player of Object.values(market.db.P) as any[]) {
  player.age = 19;
  player.amt = 1.1;
  player.exp = market.Y + 2;
  player.ctype = 'standard';
  delete player.inc;
  delete player.signed;
  delete player.ntc;
  delete player.extNoTrade;
}
const blocked = market.state.rosters[0][0];
market.strategies = () => Object.fromEntries(market.state.teams.map(t => [t.tid, 'contend']));
market.tradeP = (q: any, _st: any, tid: number) => (q.id === blocked ? (tid === 0 ? 5 : 20) : tid === 0 ? 10 : 4);
market.pVal = market.tradeP;
market.kVal = () => 0;
const before = offerToUser(market, market.state, () => 10, mulberry32(944));
assert.equal(before, null, 'no 19-year-old is targeted through the normal contender path');
setPlayerTradeStatus(market, blocked, 'block');
let found: any;
for (let seed = 1; seed <= 20 && !found; seed++) found = offerToUser(market, market.state, () => 10, mulberry32(seed));
assert(found?.bP.includes(blocked), 'the marked player is now considered for a legal AI offer');
// Assistant GM instructions reject every incoming asset mix, without changing individual player preferences.
const delegate: any = Game.create(8231, [0, 2]),
  ds = delegate.state,
  owned = ds.rosters[0][0],
  otherOwned = ds.rosters[2][0],
  theirs = ds.rosters[1][0],
  ourPick = ds.assets.find((a: any) => a.owner === 0 && a.rd === 1),
  theirPick = ds.assets.find((a: any) => a.owner === 1 && a.rd === 1);
assert(ourPick && theirPick);
delegate.setState({ gmSetup: false, god: false, notices: [], inOffers: [], mail: [] });
assert.equal(rejectAllTradeOffers(delegate, delegate.state, 0), false, 'Existing leagues default to normal offers');
const offerPlayer = { id: 'delegate-player', a: 1, b: 0, aP: [theirs], bP: [owned], aK: [], bK: [], day: ds.day },
  offerPick = { ...offerPlayer, id: 'delegate-picks', aP: [], bP: [], aK: [theirPick.id], bK: [ourPick.id] },
  offerMixed = { ...offerPlayer, id: 'delegate-mixed', aK: [theirPick.id], bK: [ourPick.id] },
  otherTeamOffer = { ...offerPlayer, id: 'delegate-other-team', b: 2, bP: [otherOwned] };
const protectedStats = JSON.stringify(Object.values(delegate.db.P).map((q: any) => [q.id, q.stats, q.tradeStatus])),
  rosterRef = delegate.state.rosters,
  assetRef = delegate.state.assets,
  statRev = delegate.statsVersion,
  saveRev = delegate.saveVersion;
setRejectAllTradeOffers(delegate, 0, true);
assert.equal(rejectAllTradeOffers(delegate, delegate.state, 0), true, 'Available in normal mode');
assert.equal(delegate.statsVersion, statRev, 'Changing an instruction alone does not recalculate player statistics');
assert(delegate.saveVersion > saveRev, 'The setting is saved');
for (const incoming of [offerPlayer, offerPick, offerMixed]) {
  const declined = protectedOfferNotice(delegate, delegate.state, incoming)!;
  assert.match(declined.lines[1], /assistant GM/);
  assert.equal((declined as any).offerId, undefined);
  assert.match(declined.lines[0], /offered/);
}
assert.match(protectedOfferNotice(delegate, delegate.state, offerPick)!.lines[0], new RegExp(String(ourPick.yr)));
assert.equal(protectedOfferNotice(delegate, delegate.state, otherTeamOffer), null, 'The other managed team retains its own instruction');
assert.equal(protectedOfferNotice(delegate, delegate.state, { ...offerPlayer, b: 1 }), null, 'AI-to-AI trade policy is untouched');

// Turning it on also clears every pending offer for this team and archives its full details.
setRejectAllTradeOffers(delegate, 0, false);
delegate.setState({ inOffers: [offerPlayer, offerPick, offerMixed, otherTeamOffer] });
const mailBefore = delegate.state.mail.length;
setRejectAllTradeOffers(delegate, 0, true);
assert.deepEqual(
  delegate.state.inOffers.map((o: any) => o.id),
  [otherTeamOffer.id],
);
assert.equal(delegate.state.mail.length, mailBefore + 3);
assert(delegate.state.mail.slice(0, 3).every((m: any) => /assistant GM/.test(m.lines[1]) && !m.offerId));
assert.equal(delegate.state.rosters, rosterRef);
assert.equal(delegate.state.assets, assetRef);
assert.equal(JSON.stringify(Object.values(delegate.db.P).map((q: any) => [q.id, q.stats, q.tradeStatus])), protectedStats);
const afterReject = delegate.state.mail.length;
setRejectAllTradeOffers(delegate, 0, true);
assert.equal(delegate.state.mail.length, afterReject, 'Repeating the instruction creates no duplicate rejection mail');

// An old Accept button cannot bypass delegation, even before the offer has been cleared by the setting handler.
delegate.setState({ inOffers: [offerPick], tTid: 1, tMine: [], tTheirs: [], tkMine: [ourPick.id], tkTheirs: [theirPick.id] });
delegate.propose(false, offerPick.id);
assert.match(delegate.state.tMsg, /assistant GM/);
assert.equal(delegate.state.inOffers.length, 0);
assert.equal(delegate.state.assets, assetRef);
const staleMail = delegate.state.mail.length;
delegate.propose(false, offerPick.id);
assert.equal(delegate.state.mail.length, staleMail);

// Persistence and team switches, including clubs from old saves with no instruction yet.
const delegateReload: any = Game.load(JSON.parse(JSON.stringify(delegate.toSave())));
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 0), true);
delegateReload.switchTeam(2);
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 2), false);
setRejectAllTradeOffers(delegateReload, 2, true);
delegateReload.switchTeam(0);
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 0), true);
setRejectAllTradeOffers(delegateReload, 0, false);
assert.equal(
  protectedOfferNotice(delegateReload, delegateReload.state, offerPlayer),
  null,
  'Switching it off restores ordinary incoming offers',
);
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 2), true);
const invalidBefore = JSON.stringify(delegateReload.state.rejectTradeOffers);
setRejectAllTradeOffers(delegateReload, 1, true);
setRejectAllTradeOffers(delegateReload, 0, 'yes' as any);
assert.equal(JSON.stringify(delegateReload.state.rejectTradeOffers), invalidBefore, 'Cannot set AI-team instructions or invalid values');
assert.equal(rejectAllTradeOffers(delegateReload, { ...delegateReload.state, spectator: true }, 2), false);

// A mid-game click waits for the day boundary, retaining the team chosen when clicked.
delegateReload.dayInProgress = true;
setRejectAllTradeOffers(delegateReload, 0, true);
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 0), false);
delegateReload.setState({ screen: 'staff' });
assert.equal(delegateReload.state.screen, 'staff', 'Navigation still works during the simulated day');
delegateReload.dayInProgress = false;
delegateReload.flushAfterDay();
assert.equal(rejectAllTradeOffers(delegateReload, delegateReload.state, 0), true);

// Outgoing proposals still take their normal validation path: delegation only handles incoming offers.
delegateReload.setState({ tTid: 1, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [] });
delegateReload.propose(false);
assert(!/assistant GM|automatically rejected/.test(delegateReload.state.tMsg || ''));

const instructionHtml = (game: Game) => {
  const html = renderToStaticMarkup(createElement(StaffScreen, { vm: { ctx: { gm: game, s: game.state, logo: () => null } } }));
  return html.match(/<section aria-label="Assistant GM instructions"[\s\S]*?<\/section>/)?.[0] || '';
};
assert.match(instructionHtml(delegateReload), /Reject all trade offers/);
assert.match(instructionHtml(delegateReload), /checked=""/);
setRejectAllTradeOffers(delegateReload, 0, false);
assert(!instructionHtml(delegateReload).includes('checked=""'));
console.log(
  'PASS: roster trade statuses and assistant GM rejection of every incoming asset mix; mailbox, pending/stale offers, persistence, normal-mode UI, team isolation and safe sim-day changes.',
);

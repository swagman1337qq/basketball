import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { protectedOfferNotice, playerTradeStatus, setPlayerTradeStatus } from '../src/engine/tradeStatus';
import { offerToUser } from '../src/engine/tradeLogic';
import { mulberry32 } from '../src/engine/rng';

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
console.log(
  'PASS: owned trade statuses, automatic rejection/mail, stale Accept safety, persistence, movement and trading-block AI consideration',
);

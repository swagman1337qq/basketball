import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { askOffers, shopOffers } from '../src/engine/tradeOffers';
import { excludePlayers, excludePicks, excludesTrade, pickExcluded } from '../src/engine/tradeExclusions';
import { checkTrade } from '../src/engine/cba';

const g = Game.create(3841, [0]),
  s = g.state;
const [send, essential, other] = s.rosters[0],
  [target, filler] = s.rosters[1];
g.setState({
  phase: 'regular',
  day: 10,
  screen: 'trade',
  gmSetup: false,
  tTid: 1,
  tMine: [send],
  tTheirs: [target],
  tkMine: [],
  tkTheirs: [],
  tExcludeP: [],
  tExcludeK: [],
  rosters: { ...s.rosters, 0: [send, essential, other], 1: [target, filler] },
});
for (const id of [send, essential, other, target, filler]) {
  Object.assign(g.db.P[id], { amt: 1, exp: g.Y + 2, ctype: 'standard' });
  delete g.db.P[id].signed;
  delete g.db.P[id].ntc;
  delete g.db.P[id].extNoTrade;
}
// Isolate bargaining value while exercising the actual package builder and league-office rules.
const values = new Map([
  [send, 1],
  [essential, 30],
  [other, 0],
  [target, 20],
  [filler, 0],
]);
g.tradeP = (p: any) => values.get(p?.id) ?? 0;
g.pVal = (p: any) => values.get(p?.id) ?? 0;
g.kVal = () => 0;
g.setState(excludePlayers(g.state, [essential], true));
const before = JSON.stringify([g.state.tMine, g.state.tTheirs, g.state.tkMine, g.state.tkTheirs]);
g.balance();
assert.match(g.state.tMsg, /No deal/i);
assert.equal(
  JSON.stringify([g.state.tMine, g.state.tTheirs, g.state.tkMine, g.state.tkTheirs]),
  before,
  'failure leaves the selected deal intact',
);
assert.deepEqual(askOffers(g, g.state, 1, [target], []), [], 'asking cannot use the excluded essential player');
g.setState(excludePlayers(g.state, [essential], false));
g.balance();
assert(g.state.tMine.includes(essential), 'including the essential player allows a counteroffer');
assert(g.state.tMine.includes(send) && g.state.tTheirs.includes(target), 'selected assets remain in the package');
assert(checkTrade(g, { ...g.state, god: false }, 0, 1, g.state.tMine, g.state.tTheirs, g.state.tkMine, g.state.tkTheirs).ok);
assert(g.evalTrade(g.state, g.state.tMine, g.state.tTheirs, g.state.tkMine, g.state.tkTheirs).ok);
values.set(essential, 8);
values.set(other, 8);
values.set(target, 14);
g.setState({ tMine: [send], tTheirs: [target], tkMine: [], tkTheirs: [] });
g.balance();
assert(g.state.tMine.includes(essential) && g.state.tMine.includes(other), 'the search can find a package needing two additions');
const neededPick = g.state.assets.find(a => a.owner === 0 && a.rd === 2 && a.yr === g.Y + 1).id;
values.set(essential, 0);
values.set(other, 0);
values.set(target, 20);
g.kVal = a => (a?.id === neededPick ? 30 : 0);
g.setState({ tMine: [send], tTheirs: [target], tkMine: [], tkTheirs: [] });
g.setState(excludePicks(g.state, 0, [neededPick], true));
g.balance();
assert.match(g.state.tMsg, /No deal/i, 'excluded picks cannot be used as compensation');
g.setState(excludePicks(g.state, 0, [neededPick], false));
g.balance();
assert(g.state.tkMine.includes(neededPick), 'allowing the needed pick restores a valid deal');
g.kVal = () => 0;
values.set(essential, 30);
g.setState({ tMine: [send, essential], tTheirs: [target], tkMine: [], tkTheirs: [] });
g.setState(excludePlayers(g.state, [essential], true));
assert(!g.state.tMine.includes(essential), 'excluding an asset deselects it');
g.setState({ tMine: [essential], god: true });
g.propose(true);
assert.match(g.state.tMsg, /No deal/i, 'force cannot accidentally trade an excluded asset');
const swap = 'swap:' + (g.Y + 1);
g.setState({ tMine: [], tTheirs: [target], tkMine: [swap], tkTheirs: [] });
g.setState(excludePicks(g.state, 0, [swap], true));
assert.deepEqual(g.state.tkMine, []);
assert(pickExcluded(g.state, 0, swap));
assert(!pickExcluded(g.state, 1, swap), 'same-year swaps on different teams have separate exclusions');
assert(excludesTrade(g.state, 1, [], [], [swap], []));
g.setState(excludePlayers(g.state, [filler], true));
for (const offer of shopOffers(g, g.state, [send], []))
  assert(!excludesTrade(g.state, offer.tid, offer.mine, offer.theirs, offer.kMine, offer.kTheirs));
assert.deepEqual(shopOffers(g, g.state, [essential], []), [], 'shopping an explicitly excluded player is rejected');
// Value alone is insufficient: recently signed assets remain unavailable even when they clear the price.
g.setState(excludePlayers(g.state, [essential], false));
g.db.P[essential].signed = { season: g.Y, phase: 'regular', day: 9 };
g.setState({ tMine: [send], tTheirs: [target], tkMine: [], tkTheirs: [], god: true });
g.balance();
assert.match(g.state.tMsg, /No deal/i, 'the solver checks trade restrictions even in God Mode');
assert(!g.state.tMine.includes(essential));
delete g.db.P[essential].signed;
const saved = Game.load(g.toSave());
assert(pickExcluded(saved.state, 0, swap), 'exclusions survive saving and loading');
console.log(
  'PASS: hard player/pick exclusions, essential-player no-deal, preserved selections, allowed counteroffers, real trade rules, proposal guard, bulk deselection, scoped swaps and save compatibility.',
);

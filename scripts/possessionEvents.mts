import assert from 'node:assert/strict';
import { possessionKind } from '../src/engine/sim';

// A road/adjustment penalty must not erase a player's foul-drawing opportunities.
const count = (extra: number) => {
  const totals = { nsf: 0, tov: 0, trip: 0, fga: 0 };
  for (let i = 0; i < 100_000; i++) totals[possessionKind((i + 0.5) / 100_000, 0.066, 0.118, 0.088, extra)]++;
  return totals;
};
assert.deepEqual(count(0), { nsf: 6600, tov: 11800, trip: 8800, fga: 72800 });
assert.deepEqual(count(0.028), { nsf: 6600, tov: 14600, trip: 8800, fga: 70000 });
assert.equal(possessionKind(0.065999, 0.066, 0.118, 0.088, 0.028), 'nsf');
assert.equal(possessionKind(0.212, 0.066, 0.118, 0.088, 0.028), 'trip');
assert.equal(possessionKind(0.300001, 0.066, 0.118, 0.088, 0.028), 'fga');
console.log('Possession-event audit passed: added turnovers preserve shooting-foul probability.');

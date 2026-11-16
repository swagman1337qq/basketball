import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game';
import { mulberry32 } from '../src/engine/rng';
import { collegeRouteChance, youthBackground } from '../src/engine/prospectPathways';
import { clubs } from '../src/data/world';

Math.random = mulberry32(416);
const g = Game.create(416, [0]);
const originalBio = g.bio.bind(g);
const countries = g.db.C;
for (const home of ['FI', 'DE', 'CN', 'NG', 'CA', 'BS']) {
  const youth = youthBackground(home, countries, [], mulberry32(61));
  assert.equal(youth.country, home, 'No listed club does not imply a U.S. childhood');
  assert(youth.team.includes(countries[home].cities.find(city => youth.team.startsWith(city))!));
}
assert.equal(collegeRouteChance('US', countries), 1);
assert(collegeRouteChance('FI', countries) > 0.25 && collegeRouteChance('FI', countries) < 0.6);

for (const home of ['FI', 'DE', 'CN', 'NG']) {
  const identity = originalBio({ [home]: 1 });
  Object.assign(identity, { born: home, raised: home, rep: home, elig: [{ c: home, why: 'citizen by birth' }] });
  g.bio = () => structuredClone(identity);
  let direct = 0,
    club = 0;
  for (let i = 0; i < 300; i++) {
    const p = g.mkProspect(35, g.Y + 2, 2, { [home]: 1 });
    for (const key of ['born', 'raised', 'her', 'name', 'native', 'rep', 'race']) assert.equal(p[key], identity[key]);
    assert.deepEqual(p.elig, identity.elig, 'College attendance does not grant U.S. eligibility');
    assert.equal(p.pth.youth.country, home);
    if (p.pth.k === 'col') {
      direct++;
      assert.equal(p.pth.to.country, 'US');
      assert.equal(p.pth.to.lg, 'NCAA');
      p.age = 19;
      assert.deepEqual(g.prospectFrom(p), p.pth.to);
      assert.equal(p.born, home);
    } else if (p.pth.k === 'club') {
      club++;
      assert.equal(p.pth.to.country, home);
    }
    delete g.db.P[p.id];
  }
  assert(direct > 80, home + ': direct college arrivals remain common');
  if (clubs()[home]?.length) assert(club > 60, home + ': local club careers also remain common');
}

// Keep both North-American-born heritage players and foreign-born early arrivals.
for (const [born, raised] of [
  ['US', 'US'],
  ['DE', 'US'],
  ['DE', 'DE'],
]) {
  const identity = originalBio({ DE: 1 });
  Object.assign(identity, { born, raised });
  g.bio = () => structuredClone(identity);
  let found: any;
  for (let i = 0; i < 100 && !found; i++) {
    const p = g.mkProspect(35, g.Y, 0, { DE: 1 });
    if (p.pth.k === 'col') found = p;
    else delete g.db.P[p.id];
  }
  assert(found);
  assert.equal(found.born, born);
  assert.equal(found.raised, raised);
  assert.equal(found.pth.youth.country, raised);
  g.db.cls[g.Y].push(found.id);
  const reopened = Game.load(JSON.parse(JSON.stringify(g.toSave())));
  assert.equal(reopened.db.P[found.id].born, born);
  assert.deepEqual(reopened.db.P[found.id].pth, found.pth);
}
g.bio = originalBio;
console.log(
  'PASS: overseas-born/raised NCAA arrivals, U.S.-born diaspora, early immigrants, domestic youth backgrounds, club alternatives, identity and save persistence.',
);

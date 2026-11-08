// Run: node --import tsx scripts/historicalClass.mts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newLeague } from './lib/headless.mts';
import { Game } from '../src/engine/Game';
import { HISTORICAL_CLASSES } from '../src/data/historicalClasses';
import { parseDraftClass, loadDraftClass, exportDraftClass } from '../src/engine/historical';
import { inchesOf } from '../src/engine/ratings';
const H = HISTORICAL_CLASSES[2013];
assert.equal(H.players.length, 100);
assert.deepEqual(JSON.parse(readFileSync('public/draft-classes/2013.json', 'utf8')), H);
assert.equal(new Set(H.players.map(p => p.first + ' ' + p.last)).size, 100);
assert.equal(H.players.filter(p => p.real?.some(r => r.gp)).length, 95);
assert.equal(H.players.filter(p => !p.real).length, 4);
for (const p of H.players) {
  assert(p.ovr <= p.tpot && p.age >= 17 && p.age <= 30);
  assert(p.hgt && p.hgt[0] * 12 + p.hgt[1] >= 65 && p.hgt[0] * 12 + p.hgt[1] <= 90);
  const keys = new Set<string>();
  for (const r of p.real || []) {
    assert(!keys.has(r.y + '|' + r.team));
    keys.add(r.y + '|' + r.team);
    assert(r.y <= 0);
    if (r.note === 'sitout') {
      assert(!r.gp);
      continue;
    }
    assert(r.gp! > 0 && r.mp! > 0);
    for (const k of ['fg', 'fga', 'tp', 'tpa', 'ft', 'fta', 'pts', 'orb', 'drb', 'trb', 'ast', 'stl', 'blk', 'tov', 'pf'])
      assert(Number.isFinite(r[k]) && r[k] >= 0, p.first + ' ' + k);
    assert(r.fg! <= r.fga! && r.tp! <= r.tpa! && r.ft! <= r.fta!);
    assert(Math.abs(r.pts! - (2 * r.fg! + r.tp! + r.ft!)) <= 0.26);
    assert(Math.abs(r.trb! - r.orb! - r.drb!) <= 0.151);
  }
}
// Source-backed regression cases: senior/reserve identity, separate transfer stints and the approved exception.
const byName = (name: string) => H.players.find(p => p.first + ' ' + p.last === name)!;
const spanish = byName('Axel Arbines').real!.filter(r => r.y === -1);
assert(spanish.some(r => r.team === 'Cajasol Sevilla'));
assert(spanish.some(r => r.team === 'CB Granada'));
assert(!JSON.stringify(H).includes('Granada B'));
assert.deepEqual(byName('Boris Dubrović').from, { team: 'Lucentum Alicante', lg: 'LEB Oro', country: 'ES' });
assert.deepEqual(byName('Lóránt Dobay').from, { team: 'Peñas Huesca', lg: 'LEB Oro', country: 'ES' });
assert.equal(byName('Alexandro Parados').from.team, 'Brasília');
assert.equal(byName('Stanimir Stojičić').from.team, 'Sloga Kraljevo (opponent fallback)');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
for (const seed of [11, 44, 2027]) {
  const g: any = newLeague(seed),
    year = g.Y + (seed === 44 ? 2 : 0),
    generated = new Map();
  const mk = g.mkPlayer.bind(g);
  g.mkPlayer = (...args: any[]) => {
    const p = mk(...args);
    generated.set(p.id, { inch: inchesOf(p.hgt), rating: p.r.hgt, wing: p.wing });
    return p;
  };
  const parsed = parseDraftClass(JSON.stringify(H));
  assert.notEqual(typeof parsed, 'string');
  assert.match(loadDraftClass(g, parsed as any, year), /100 prospects/);
  assert.equal(g.db.cls[year].length, 100);
  for (let i = 0; i < 100; i++) {
    const h = H.players[i],
      p = g.db.P[g.db.cls[year][i]],
      before = generated.get(p.id),
      inch = h.hgt![0] * 12 + h.hgt![1];
    assert.equal(p.name, h.first + ' ' + h.last);
    assert.equal(p.rep, h.rep);
    assert.equal(p.wt, h.wt);
    assert.equal(p.dAge, h.age);
    assert.equal(inchesOf(p.hgt), inch);
    assert.equal(p.r.hgt, Math.max(4, Math.min(99, before.rating + 4 * (inch - before.inch))));
    if (before.wing != null) assert.equal(p.wing, before.wing + inch - before.inch);
    assert(Math.abs(p.ovr - h.ovr) <= 1.01, p.name + ' overall ' + p.ovr + ' vs ' + h.ovr);
    assert(Math.abs(p.tpot - Math.round(h.tpot)) < 0.01, p.name + ' ceiling');
    assert(Math.abs(p.perr + p.tpot - h.read) < 0.011, p.name + ' scouting read');
    assert.deepEqual(p.real?.map(({ season, ...r }: any) => r) ?? null, h.real);
    for (const v of Object.values(p.r)) assert(Number.isFinite(v));
  }
  const exported = exportDraftClass(g, year);
  assert.notEqual(typeof parseDraftClass(JSON.stringify(exported)), 'string');
  const reopened: any = Game.load(clone(g.toSave()));
  assert.equal(reopened.db.cls[year].length, 100);
  assert.deepEqual(
    reopened.db.cls[year].map((id: number) => reopened.db.P[id].name),
    H.players.map(p => p.first + ' ' + p.last),
  );
  for (const id of reopened.db.cls[year]) assert.deepEqual(reopened.db.P[id].real, g.db.P[id].real);
  if (year === g.Y) {
    const ids = [...g.db.cls[year]];
    g.setState({
      phase: 'draft',
      pi: 0,
      picks: Array.from({ length: 60 }, (_, i) => ({ n: i + 1, rd: i < 30 ? 1 : 2, orig: i % 30, pid: null })),
    });
    for (let i = 0; i < 200 && g.state.pi < 60; i++) {
      const before = g.state.pi;
      g.aiDraft(false);
      if (g.state.pi === before) {
        const taken = new Set(g.state.picks.map((p: any) => p.pid));
        g.draftPick(ids.find((id: number) => !taken.has(id)));
      }
      assert(g.state.pi > before);
    }
    assert.equal(g.state.pi, 60);
    assert.equal(new Set(g.state.picks.map((p: any) => p.pid)).size, 60);
    assert(g.state.picks.every((p: any) => ids.includes(p.pid)));
  }
  console.log('PASS seed', seed, 'year', year, ': import, body, stats, ceilings, save/reopen, export and draft');
}
console.log('PASS: 100 prospects and 95 historical records; generated fallback and sitout coverage checked.');

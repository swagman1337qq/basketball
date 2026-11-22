import assert from 'node:assert/strict';
import { Worker as ThreadWorker } from 'node:worker_threads';
import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/engine/Game';
import { newLeague, clr } from './lib/headless.mts';
import { profileStatsSnapshot, statsReader } from '../src/ui/profileStatsContext';
import { computeProfileSeason } from '../src/ui/profileStatsData';
import { ProfileHistoryCache } from '../src/ui/profileHistoryCache';
import {
  createProfileStatsClient,
  loadProfileStats,
  shareProfileStats,
  pauseProfileStats,
  disposeProfileStats,
} from '../src/ui/profileStatsClient';
import type { StatsCommand, StatsReply } from '../src/ui/profileStatsProtocol';

await mkdir('.review', { recursive: true });
const dir = await mkdtemp(resolve('.review/profile-history-'));
assert(dir.startsWith(resolve('.review') + sep));
const oldRandom = Math.random,
  oldNow = Date.now,
  oldWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
const live = new Set<ThreadWorker>(),
  replies: StatsReply[] = [];
let assertions = 0,
  starts = 0;
const eq = (a: any, b: any, label: string) => {
  assert.deepEqual(a, b, label);
  assertions++;
};
const oracle = (g: Game, pid: number, years: number[], po = false, ccp = false) => {
  const fresh = statsReader(structuredClone(profileStatsSnapshot(g)));
  return Object.fromEntries(years.map(y => [y, computeProfileSeason(fresh, fresh.state, pid, y, po, ccp)]));
};
try {
  Date.now = () => 1800000000000;
  await build({
    entryPoints: ['src/ui/profileStatsWorker.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    outfile: dir + '/worker.mjs',
  });
  await writeFile(
    dir + '/runner.mjs',
    `import{parentPort}from'node:worker_threads';const waiting=[];globalThis.self={postMessage:m=>parentPort.postMessage(m)};parentPort.on('message',data=>{if(self.onmessage)self.onmessage({data});else waiting.push(data)});await import('./worker.mjs');for(const data of waiting)self.onmessage({data});`,
  );
  class RealWorker {
    onmessage: any;
    onerror: any;
    onmessageerror: any;
    thread = new ThreadWorker(pathToFileURL(dir + '/runner.mjs'), { execArgv: [] });
    constructor() {
      starts++;
      live.add(this.thread);
      this.thread.on('message', data => {
        replies.push(data);
        this.onmessage?.({ data });
      });
      this.thread.on('error', error => this.onerror?.(error));
      this.thread.on('messageerror', error => this.onmessageerror?.(error));
    }
    postMessage(job: StatsCommand) {
      this.thread.postMessage(job);
    }
    terminate() {
      this.thread.removeAllListeners();
      live.delete(this.thread);
      void this.thread.terminate();
    }
  }
  Object.defineProperty(globalThis, 'Worker', { configurable: true, value: RealWorker });
  const g: any = newLeague(771);
  clr(g);
  await g.sim(2);
  clr(g);
  const year = g.Y,
    past = year - 1,
    pid = g.state.rosters[0][0];
  g.db.firstSeason = year - 3;
  const scale = (r: any, factor: number) =>
    Object.fromEntries(
      Object.entries(structuredClone(r)).map(([k, v]) => [k, typeof v === 'number' && !['season', 'tid'].includes(k) ? v * factor : v]),
    );
  for (const p of Object.values(g.db.P) as any[]) {
    const current = (p.stats || []).filter((r: any) => r.season === year && !r.po);
    if (!current.length) continue;
    for (const y of [year - 3, year - 2, past]) {
      for (const r of current) p.stats.push({ ...scale(r, 20), season: y }, { ...scale(r, 5), season: y, po: true });
      p.ccpS = {
        ...p.ccpS,
        [y]: { ...scale(current[0], 8), team: 'Test club' },
        [y + 'p']: { ...scale(current[0], 3), team: 'Test club' },
      };
      if (p.dkS?.[year]) (p.dkS ||= {})[y] = p.dkS[year].slice();
    }
  }
  for (const y of [year - 3, year - 2, past]) {
    (g.state.tstatsHist ||= {})[y] = Object.fromEntries(Object.entries(g.state.tstats).map(([id, r]) => [id, scale(r, 20)]));
    for (const t of g.state.teams) (g.state.teamHist ||= {})[t.tid] = [...(g.state.teamHist[t.tid] || []), { season: y, w: 41, l: 41 }];
    if (y === past && g.db.rapm?.[year]) g.db.rapm[y] = structuredClone(g.db.rapm[year]);
  }
  g.setState({ god: true, gv: (g.state.gv || 0) + 1 });
  const client = createProfileStatsClient(g, () => new RealWorker() as any),
    modes = [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ] as const;
  const checkAll = async (label: string) => {
    client.attach(g);
    for (const [po, ccp] of modes) eq(await client.load(pid, [past, year], po, ccp), oracle(g, pid, [past, year], po, ccp), label);
  };
  await checkAll('Initial NBA, playoff and CCP values exactly match fresh formulas');
  const saved = JSON.stringify(g.toSave()),
    threads = starts;
  g.db.P[pid].stats.find((r: any) => r.season === year && !r.po).pts += 7;
  g.setState({ currentStatsEdit: 1 });
  const before = replies.length;
  await checkAll('Current changes refresh current values and preserve valid historical values');
  const freshReplies = replies.slice(before).filter(r => r.type === 'season');
  assert(freshReplies.filter(r => r.year === past).every(r => r.cached));
  assertions++;
  assert(freshReplies.filter(r => r.year === year).every(r => !r.cached));
  assertions++;
  await g.sim(1);
  clr(g);
  await checkAll('A completed real game refreshes current stats without changing history');

  const view: any = new Game();
  view.db = structuredClone(g.db);
  view.state = structuredClone(g.state);
  view.statsVersion = g.statsVersion;
  view.busy = true;
  client.pause(g);
  client.attach(view);
  const viewBefore = replies.length;
  eq(
    await client.load(pid, [past, year], false, false),
    oracle(view, pid, [past, year]),
    'An idle worker survives the detached reader transition',
  );
  assert.equal(starts, threads);
  assertions++;
  assert(replies.slice(viewBefore).some(r => r.type === 'season' && r.year === past && r.cached));
  assertions++;
  client.pause(view);
  client.attach(g);

  const edit = async (label: string, change: () => void) => {
    change();
    g.setState({ historicalCheck: (g.state.historicalCheck || 0) + 1 });
    await checkAll(label);
  };
  await edit('Old in-place points edits with unchanged GP refresh all affected displays', () => {
    g.db.P[pid].stats.find((r: any) => r.season === past && !r.po).pts += 11;
  });
  await edit('God Mode age and position edits refresh historical values', () => {
    g.db.P[pid].age += 2;
    g.db.P[pid].pos = 'C';
  });
  await edit('Historical team totals refresh advanced results', () => {
    g.state.tstatsHist[past][0].pts += 19;
  });
  await edit('Historical team records refresh win-based metrics', () => {
    g.state.teamHist[0].find((r: any) => r.season === past).w += 4;
  });
  await edit('Older seasons refresh dependent DARKO values', () => {
    g.db.P[pid].stats.find((r: any) => r.season === past - 1 && !r.po).ast += 8;
  });
  await edit('Pruning past lineup context refreshes RAPM', () => {
    delete g.db.rapm[past];
  });
  await edit('CCP changes remain separate from NBA and playoff results', () => {
    g.db.P[pid].ccpS[past].pts += 6;
  });
  const other = (Object.values(g.db.P) as any[]).find(p => p.id !== pid && p.stats?.some((r: any) => r.season === past && !r.po));
  await edit('Another old player changing refreshes this profile’s leader highlights', () => {
    other.stats.find((r: any) => r.season === past && !r.po).pts += 10000;
  });
  await edit('Playoff edits stay distinct from regular-season data', () => {
    g.db.P[pid].stats.find((r: any) => r.season === past && r.po).pts += 13;
  });
  await edit('Past DARKO input edits invalidate dependent results', () => {
    if (g.db.P[pid].dkS?.[past]) g.db.P[pid].dkS[past][0] += 0.7;
  });
  await edit('Missing historical team totals use the original fallback', () => {
    delete g.state.tstatsHist[past];
  });
  await edit('Missing historical team records use the original fallback', () => {
    delete g.state.teamHist[0];
  });
  g.db = structuredClone(g.db);
  g.db.P[pid].stats.find((r: any) => r.season === past && !r.po).pts += 9;
  g.seasonDirty();
  await checkAll('A replaced database cannot return stale values');
  g.state.tstatsHist[year] = structuredClone(g.state.tstats);
  g.setState({ season: year + 1, day: 0, tstats: {} });
  eq(
    await client.load(pid, [year, year + 1], false, false),
    oracle(g, pid, [year, year + 1]),
    'Closing a season never promotes a stale current result',
  );
  g.setState({ season: past, tstats: g.state.tstatsHist[past] || {} });
  const backwardBefore = replies.length;
  eq(
    await client.load(pid, [past], false, false),
    oracle(g, pid, [past]),
    'Changing the year backwards cannot reuse a historical entry as current',
  );
  assert(
    replies
      .slice(backwardBefore)
      .filter(r => r.type === 'season')
      .every(r => !r.cached),
  );
  assertions++;
  const readBefore = JSON.stringify(g.toSave());
  await client.load(pid, [past], true, true);
  eq(JSON.stringify(g.toSave()), readBefore, 'Statistics reads change no saved player or league data');
  assert.notEqual(saved, readBefore, 'Fixture edits actually changed the inputs');
  client.dispose();

  // Exercise the actual shared registry, including a stale live-screen effect.
  g.busy = false;
  shareProfileStats(g, view);
  view.statsVersion++;
  await loadProfileStats(g, pid, [past - 1, past], false, false, {});
  pauseProfileStats(g);
  g.busy = true;
  const during = loadProfileStats(view, other.id, [past - 1, year], false, false, {});
  await assert.rejects(loadProfileStats(g, pid, [past], false, false, {}), { name: 'AbortError' });
  assertions++;
  eq(await during, oracle(view, other.id, [past - 1, year]), 'A late live-screen effect cannot steal the reader’s worker');
  const closing = loadProfileStats(view, pid, [past - 2], true, false, {});
  disposeProfileStats(g);
  await assert.rejects(closing, { name: 'AbortError' });
  assertions++;
  g.busy = false;
  g.db = structuredClone(g.db);
  g.seasonDirty();
  const replacementBefore = replies.length;
  eq(
    await loadProfileStats(g, pid, [past - 1], false, false, {}),
    oracle(g, pid, [past - 1]),
    'The registry starts fresh after league database replacement',
  );
  assert(
    replies
      .slice(replacementBefore)
      .filter(r => r.type === 'season')
      .every(r => !r.cached),
  );
  assertions++;
  disposeProfileStats(g);

  const context = structuredClone(profileStatsSnapshot(view)),
    cache = new ProfileHistoryCache();
  cache.prepare(context);
  for (let n = 0; n < 530; n++) cache.remember(n, past, false, false, { advanced: { n }, pg: null, tot: null });
  eq(
    Array.from({ length: 530 }, (_, n) => cache.get(n, past, false, false)).filter(Boolean).length,
    512,
    'The historical display cache is bounded',
  );
  cache.remember(1, context.year, false, false, { advanced: { bad: true }, pg: null, tot: null });
  eq(cache.get(1, context.year, false, false), undefined, 'Current seasons never enter historical storage');
  cache.releaseContext();
  eq(cache.get(529, past, false, false), undefined, 'Paused data cannot be used without input validation');
  cache.prepare(structuredClone(context));
  assert(cache.get(529, past, false, false));
  assertions++;
  const changed = structuredClone(context);
  changed.players[pid].age++;
  cache.prepare(changed);
  eq(cache.get(529, past, false, false), undefined, 'A changed historical dependency clears previous display values');
  const fallback = createProfileStatsClient(view, () => {
    throw Error('Workers unavailable');
  });
  eq(
    await fallback.load(pid, [past, year], false, false),
    oracle(view, pid, [past, year]),
    'Browsers without workers keep the original calculations',
  );
  fallback.dispose();
  console.log(
    `PASS: ${assertions} historical-cache accuracy and lifecycle checks, real worker reuse, fresh current stats, edits, fallback context, year changes, database replacement and cancellation`,
  );
} finally {
  Math.random = oldRandom;
  Date.now = oldNow;
  if (oldWorker) Object.defineProperty(globalThis, 'Worker', oldWorker);
  else delete (globalThis as any).Worker;
  await Promise.all([...live].map(w => w.terminate()));
  await rm(dir, { recursive: true, force: true });
}

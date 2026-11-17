import assert from 'node:assert/strict';
import { Worker as ThreadWorker } from 'node:worker_threads';
import { build } from 'esbuild';
import { mkdir, mkdtemp, readFile, writeFile, rm, rmdir, readdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/engine/Game';
import { seasonAdvanced, ccpAdvanced } from '../src/engine/advanced';
import { seasonLeaders } from '../src/engine/leaders';
import { createProfileStatsClient } from '../src/ui/profileStatsClient';
import { profileStatsSnapshot, statsReader } from '../src/ui/profileStatsContext';
import { cachedProfileSeason, profileStatsEpoch } from '../src/ui/profileStatsData';
import type { StatsRequest, StatsReply } from '../src/ui/profileStatsProtocol';

await mkdir('.review', { recursive: true });
const dir = await mkdtemp(resolve('.review/profile-worker-'));
const pause = () => new Promise<void>(r => setTimeout(r, 5));
const reference = (g: Game, pid: number, year: number, po: boolean, ccp: boolean) => ({
  advanced: (ccp ? ccpAdvanced(g, g.state, year, po) : seasonAdvanced(g, g.state, year, po)).byPid[pid],
  pg: !po && !ccp ? seasonLeaders(g, g.state, year, 'pg') : null,
  tot: !po && !ccp ? seasonLeaders(g, g.state, year, 'tot') : null,
});
try {
  if (process.argv.includes('--production')) {
    const artifact = (await readdir('dist/assets')).find(name => /^profileStatsWorker-.*\.js$/.test(name));
    assert(artifact, 'Production statistics worker exists');
    await copyFile('dist/assets/' + artifact, dir + '/worker.mjs');
  } else {
    await build({
      entryPoints: ['src/ui/profileStatsWorker.ts'],
      bundle: true,
      format: 'esm',
      platform: 'node',
      packages: 'external',
      outfile: dir + '/worker.mjs',
    });
  }
  await writeFile(
    dir + '/runner.mjs',
    `
    import {parentPort} from 'node:worker_threads';
    const waiting=[];
    globalThis.self={postMessage:message=>parentPort.postMessage(message)};
    parentPort.on('message',data=>{if(self.onmessage)self.onmessage({data});else waiting.push(data);});
    await import('./worker.mjs');
    for(const data of waiting)self.onmessage({data});
  `,
  );
  let transfers = 0,
    requests = 0,
    contextBytes = 0;
  class RealWorker {
    onmessage: any;
    onerror: any;
    onmessageerror: any;
    thread = new ThreadWorker(pathToFileURL(dir + '/runner.mjs'), { execArgv: [] });
    constructor() {
      this.thread.on('message', data => this.onmessage?.({ data }));
      this.thread.on('error', error => this.onerror?.(error));
      this.thread.on('messageerror', error => this.onmessageerror?.(error));
    }
    postMessage(job: StatsRequest) {
      requests++;
      if (job.context) {
        transfers++;
        contextBytes = JSON.stringify(job.context).length;
        assert(!('boxes' in job.context));
        assert(!('rosters' in job.context.state));
        for (const p of Object.values(job.context.players)) {
          assert(!('r' in p));
          assert(!('rh' in p));
          assert(!('faceImg' in p));
          assert(!('contract' in p));
        }
      }
      this.thread.postMessage(job);
    }
    terminate() {
      void this.thread.terminate();
    }
  }
  const source = process.argv[2];
  const g = source ? Game.load(JSON.parse(await readFile(source, 'utf8')).data) : Game.create(741, [0]);
  const pid = g.state.rosters[g.state.me][0],
    other = g.state.rosters[g.state.me][1],
    year = g.Y;
  if (!source) {
    g.addBox(g.playGame(g.state, 0, 1), false, undefined, undefined, g.state);
    g.addBox(g.playGame(g.state, 0, 1), true, undefined, undefined, g.state);
    for (const p of Object.values(g.db.P) as any[]) {
      if (p.stats?.length) {
        p.stats.push(...p.stats.map((r: any) => ({ ...r, season: year - 1 })));
        const line = p.stats.find((r: any) => !r.po);
        p.ccpS = {
          [year]: { ...line, team: 'Test club' },
          [year - 1]: { ...line, team: 'Test club' },
          [year + 'p']: { ...line, team: 'Test club' },
        };
      }
    }
    g.state.tstatsHist = { ...(g.state.tstatsHist || {}), [year - 1]: structuredClone(g.state.tstats) };
    g.setState({ gv: (g.state.gv || 0) + 1 });
  }
  const snapshot = structuredClone(profileStatsSnapshot(g)),
    reader = statsReader(snapshot);
  for (const y of [year - 1, year]) {
    assert.deepEqual(
      reader.playersIn(y).map(p => p.id),
      g.playersIn(y).map(p => p.id),
      'Player iteration order matches',
    );
    assert.equal(reader.ageIn(g.db.P[pid], y), g.ageIn(g.db.P[pid], y));
    assert.deepEqual(reader.seasonTotals(reader.db.P[pid], y), g.seasonTotals(g.db.P[pid], y));
  }
  assert.equal(reader.possOf(g.state.tstats[0]), g.possOf(g.state.tstats[0]));
  const client = createProfileStatsClient(g, () => new RealWorker() as any);
  try {
    const seasons = source
      ? ([...new Set(g.db.P[pid].stats.filter((r: any) => !r.po).map((r: any) => r.season))] as number[])
      : [year - 1, year];
    for (const [po, ccp] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      const years =
        source && ccp
          ? Object.keys(g.db.P[pid].ccpS || {})
              .filter(k => k.endsWith('p') === po)
              .map(k => parseInt(k))
          : seasons;
      if (!years.length) continue;
      const expected = Object.fromEntries(years.map(y => [y, reference(g, pid, y, po, ccp)]));
      assert.deepEqual(
        await client.load(pid, years, po, ccp),
        expected,
        'Worker results exactly match every existing advanced metric and leader value',
      );
    }
    assert.deepEqual((await client.load(other, [year], false, false))[year], reference(g, other, year, false, false));
    assert.equal(transfers, 1, 'Different players and stat tabs share one compact context per revision');
    const sent = requests;
    await client.load(pid, seasons, false, false);
    assert.equal(requests, sent, 'Repeated profiles use the main-thread cache without a message');
    console.log(
      'PASS: actual worker thread, exact NBA/playoff/CCP/history/leader results, helper order, context reuse, cache reuse; context bytes=' +
        contextBytes,
    );
  } finally {
    client.dispose();
  }
  if (source) process.exitCode = 0;
  else {
    const race = Game.load(g.toSave());
    const fakes: FakeWorker[] = [];
    class FakeWorker {
      onmessage: any;
      onerror: any;
      onmessageerror: any;
      job?: StatsRequest;
      terminated = false;
      postMessage(job: StatsRequest) {
        this.job = structuredClone(job);
      }
      terminate() {
        this.terminated = true;
      }
      reply(type: 'season' | 'done', extra: any = {}) {
        const job = this.job!;
        this.onmessage?.({
          data: {
            id: job.id,
            epoch: job.epoch,
            pid: job.pid,
            po: job.po,
            ccp: job.ccp,
            type,
            ...(type === 'season' ? { year: job.years[0], value: { advanced: { marker: 7 }, pg: null, tot: null } } : {}),
            ...extra,
          },
        } as { data: StatsReply });
      }
    }
    const fakeClient = createProfileStatsClient(race, () => {
      const w = new FakeWorker();
      fakes.push(w);
      return w as any;
    });
    const fresh = () => race.setState({ gv: (race.state.gv || 0) + 1 });
    const queued = async () => {
      await pause();
      for (let i = 0; i < 100 && !fakes.at(-1)?.job; i++) await pause();
      assert(fakes.at(-1)?.job);
      return fakes.at(-1)!;
    };
    let shown = 0;
    const begin = (options: any = {}, p = pid, po = false) =>
      fakeClient.load(p, [year], po, false, { ...options, onSeason: () => shown++ }).then(
        value => ({ value, error: undefined as any }),
        error => ({ value: undefined, error }),
      );
    // Both requests begin before the first defer finishes: only the latest may start.
    const early = begin();
    const latest = begin({}, other);
    const active = await queued();
    active.reply('season');
    active.reply('done');
    assert.equal((await early).error.name, 'AbortError');
    assert((await latest).value);
    assert.equal(fakes.length, 1);
    fresh();
    shown = 0;
    const edited = begin();
    const old = await queued();
    fresh();
    old.reply('season');
    old.reply('done');
    assert.equal((await edited).error.name, 'AbortError');
    assert.equal(shown, 0);
    assert.equal(cachedProfileSeason(race, race.state, pid, year, false, false), undefined);
    fresh();
    shown = 0;
    let visible = true;
    const switched = begin({ isCurrent: () => visible });
    const switchedWorker = await queued();
    visible = false;
    switchedWorker.reply('season');
    switchedWorker.reply('done');
    assert.equal((await switched).error.name, 'AbortError');
    assert.equal(shown, 0);
    fresh();
    shown = 0;
    const played = begin();
    const dayWorker = await queued();
    race.setState({ day: race.state.day + 1 });
    dayWorker.reply('season');
    dayWorker.reply('done');
    assert.equal((await played).error.name, 'AbortError');
    assert.equal(shown, 0);
    fresh();
    const controller = new AbortController();
    const cancelled = begin({ signal: controller.signal });
    const cancelledWorker = await queued();
    controller.abort();
    const replacement = begin();
    const replacementWorker = await queued();
    cancelledWorker.reply('season', { value: { advanced: { wrong: true }, pg: null, tot: null } });
    replacementWorker.reply('season');
    replacementWorker.reply('done');
    assert.equal((await cancelled).error.name, 'AbortError');
    assert.equal(
      (await replacement).value![year].advanced.marker,
      7,
      'Late messages from terminated workers cannot overwrite replacement results',
    );
    fresh();
    shown = 0;
    const mismatch = begin();
    const bad = await queued();
    bad.reply('season', { po: true });
    assert.match((await mismatch).error.message, /did not match/);
    assert.equal(shown, 0);
    fresh();
    shown = 0;
    const wrongYear = begin();
    const yearWorker = await queued();
    yearWorker.reply('season', { year: year + 99 });
    assert.match((await wrongYear).error.message, /incomplete/);
    assert.equal(shown, 0);
    fresh();
    shown = 0;
    const incomplete = begin();
    const missing = await queued();
    missing.reply('done');
    assert.match((await incomplete).error.message, /incomplete/);
    assert.equal(shown, 0);
    fresh();
    shown = 0;
    const invalidType = begin();
    const invalidWorker = await queued();
    invalidWorker.reply('done', { type: 'invalid' });
    assert.match((await invalidType).error.message, /invalid/);
    assert.equal(shown, 0);
    fresh();
    shown = 0;
    const epoch = profileStatsEpoch(race, race.state),
      oldDb = race.db;
    const leagueSwap = begin();
    const swapWorker = await queued();
    race.db = Game.load(g.toSave()).db;
    assert.notEqual(
      profileStatsEpoch(race, race.state),
      epoch,
      'Identical season/player IDs in another db still have a different identity',
    );
    swapWorker.reply('season');
    swapWorker.reply('done');
    assert.equal((await leagueSwap).error.name, 'AbortError');
    assert.equal(shown, 0);
    race.db = oldDb;
    fresh();
    const dispose = begin();
    const disposedWorker = await queued();
    fakeClient.dispose();
    disposedWorker.reply('season');
    assert.equal((await dispose).error.name, 'AbortError');

    fresh();
    const crashingClient = createProfileStatsClient(race, () => {
      const w = new FakeWorker();
      fakes.push(w);
      return w as any;
    });
    const crashed = crashingClient.load(pid, [year], false, false);
    await pause();
    fakes.at(-1)!.onerror();
    assert.deepEqual(
      (await crashed)[year],
      reference(race, pid, year, false, false),
      'A failed worker falls back to the original calculation',
    );
    crashingClient.dispose();
    fresh();
    const fallback = createProfileStatsClient(race, () => {
      throw Error('Worker unavailable fixture');
    });
    assert.deepEqual((await fallback.load(pid, [year], false, false))[year], reference(race, pid, year, false, false));
    fallback.dispose();
    console.log(
      'PASS: delayed replies, overlapping starts, edits mid-flight, player/tab changes, cancellation/replacement, bad metadata, incomplete results, league replacement, disposal and worker-unavailable fallback.',
    );
  }
} finally {
  await rm(dir + '/worker.mjs', { force: true });
  await rm(dir + '/runner.mjs', { force: true });
  await rmdir(dir);
}

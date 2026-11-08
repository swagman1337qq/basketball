// `npm test` (2026-11-08): every fast check, four at a time, in about two minutes: the unit tests and each regression
// script. Exits 1 if any fails. The slow guards stay separate: `npm run test:league` (3 seasons with offseasons,
// about 3 minutes) and `npm run test:ratings` (100,000 games, about 8 minutes).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = [
  'unit',
  'ovrMigration',
  'aiRosterUpgrade',
  'calendar',
  'playerValue',
  'amateurAge',
  'possessionEvents',
  'shotContext',
  'reboundResponse',
  'finishingKernel',
  'finishingPreferences',
  'finishingIntegration',
  'historicalClass',
];
const run = (name: string) =>
  new Promise<{ name: string; ok: boolean; s: number; tail: string }>(done => {
    const t0 = Date.now(),
      c = spawn(process.execPath, [...process.execArgv, join(here, name + '.mts')], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    c.stdout.on('data', d => (out += d));
    c.stderr.on('data', d => (out += d));
    c.on('exit', code =>
      done({ name, ok: code === 0, s: (Date.now() - t0) / 1000, tail: out.trim().split('\n').slice(-3).join('\n    ') }),
    );
  });
const t0 = Date.now(),
  results: Awaited<ReturnType<typeof run>>[] = [],
  queue = SCRIPTS.slice();
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const r = await run(queue.shift()!);
      results.push(r);
      console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name.padEnd(22) + r.s.toFixed(0).padStart(4) + 's' + (r.ok ? '' : '\n    ' + r.tail));
    }
  }),
);
const bad = results.filter(r => !r.ok);
console.log(
  (bad.length ? 'FAIL: ' + bad.map(r => r.name).join(', ') : 'PASS: all ' + results.length + ' checks') +
    ' in ' +
    ((Date.now() - t0) / 1000).toFixed(0) +
    's',
);
process.exit(bad.length ? 1 : 0);

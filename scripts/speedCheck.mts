// Speed check (2026-11-22): times a regular season and an offseason in headless leagues (the AI runs every team),
// each league run twice and the faster run kept (the machine's own noise is about ±10%), so a new feature can be
// checked against the build before it. Run it on both and compare:
//   npx tsx scripts/speedCheck.mts [seeds, default 7,8] [runs, default 2]
import { newLeague, playRegular, offseason } from './lib/headless.mts';

const seeds = (process.argv[2] || '7,8').split(',').map(Number),
  runs = +(process.argv[3] || 2);
let reg = 0,
  off = 0;
for (const seed of seeds) {
  let bestR = Infinity,
    bestO = Infinity;
  for (let r = 0; r < runs; r++) {
    const g: any = newLeague(seed);
    let t = performance.now();
    await playRegular(g);
    const rs = (performance.now() - t) / 1000;
    t = performance.now();
    offseason(g);
    const os = (performance.now() - t) / 1000;
    // A fingerprint of what happened (every team's record, every player's overall): two builds that play the same
    // games print the same one, so a time difference between them is the machine, not the code.
    let fp = 0;
    g.state.teams.forEach((t: any) => (fp = (fp * 31 + t.w * 7 + t.tid) % 1e9));
    Object.values(g.db.P).forEach((q: any) => (fp = (fp * 31 + Math.round((q.ovr || 0) * 10)) % 1e9));
    if (r === 0) console.log(`seed ${seed} fingerprint ${fp}`);
    bestR = Math.min(bestR, rs);
    bestO = Math.min(bestO, os);
    console.log(`seed ${seed} run ${r + 1}: regular ${rs.toFixed(1)}s · offseason ${os.toFixed(1)}s`);
  }
  reg += bestR;
  off += bestO;
}
const n = seeds.length;
console.log(
  `best of ${runs}, average per season: regular ${(reg / n).toFixed(1)}s · offseason ${(off / n).toFixed(1)}s · total ${((reg + off) / n).toFixed(1)}s`,
);

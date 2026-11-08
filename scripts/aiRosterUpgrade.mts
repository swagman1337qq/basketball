import assert from 'node:assert/strict';
import { newLeague } from './lib/headless.mts';
import { deadSchedule, nums, stdIds, teamSalary, yosOf } from '../src/engine/cba';
import { pickCut } from '../src/engine/rosterAI';
function fixture(mode: string) {
  const g: any = newLeague(101);
  g.setState({ managed: Array.from({ length: 29 }, (_, i) => i + 1), me: 1, spectator: false });
  const s = g.state,
    tid = 0,
    N = nums(g);
  const incoming = s.rosters[2].map((id: number) => g.db.P[id]).sort((a: any, b: any) => b.ovr - a.ovr)[0];
  s.rosters[2] = s.rosters[2].filter((id: number) => id !== incoming.id);
  const ids = stdIds(g, s.rosters[tid]);
  while (ids.length < 15) ids.push(s.fa.shift());
  s.rosters[tid] = ids.slice(0, 15);
  for (const k of ['inj', 'rfa', 'abroad', 'rookieScale', 'noResign', 'waived']) delete incoming[k];
  incoming.birdTid = null;
  incoming.age = 27;
  incoming.ask = mode === 'expensive' ? 100000 : N.min(yosOf(g, incoming));
  const box = { rosters: structuredClone(s.rosters), fa: [incoming.id], overseas: [], cap: structuredClone(s.cap) };
  if (mode === 'hardCap' || mode === 'buyout') {
    const cap = (box.cap[tid] ||= {});
    cap.dead = [
      ...(cap.dead || []),
      { pid: -1, amts: { [g.Y]: Math.max(0, N.AP1 - teamSalary(g, { ...s, ...box }, tid) + (mode === 'buyout' ? 1 : 0)) } },
    ];
    if (mode === 'hardCap') cap.hardCap = 'AP1';
    else incoming.waived = { season: g.Y, prevAmt: N.NTMLE + 1, tid: 2 };
  }
  const st = { ...s, ...box },
    cut = pickCut(g, st, tid, box.rosters[tid])!;
  const guaranteed = deadSchedule(g, st, cut.p, false);
  const before = structuredClone(box);
  Math.random = () => 0.99;
  const event = g.aiMove(box, s.day, s);
  return { g, box, incoming, cut, before, event, guaranteed };
}
for (const mode of ['affordable', 'expensive', 'hardCap', 'buyout']) {
  const r = fixture(mode);
  if (process.argv.includes('--baseline')) {
    console.log(
      JSON.stringify({ mode, event: r.event?.type, roster: r.box.rosters[0].length, signed: r.box.rosters[0].includes(r.incoming.id) }),
    );
    continue;
  }
  if (mode === 'affordable') {
    assert.equal(r.event?.type, 'Signing', 'upgrade completes in the same AI decision');
    assert.equal(stdIds(r.g, r.box.rosters[0]).length, 15);
    assert.ok(r.box.rosters[0].includes(r.incoming.id));
    assert.ok(!r.box.rosters[0].includes(r.cut.p.id));
    assert.ok(!r.box.fa.includes(r.incoming.id));
    assert.equal(new Set(Object.values(r.box.rosters).flat()).size, Object.values(r.box.rosters).flat().length);
    const debt = r.box.cap[0].dead.find((x: any) => x.pid === r.cut.p.id);
    assert.deepEqual(debt.amts, r.guaranteed, 'waived guaranteed money is retained');
  } else {
    assert.equal(r.event, null, mode + ' cannot justify a speculative waiver');
    assert.deepEqual(r.box, r.before, mode + ' leaves roster, free agents and cap unchanged');
  }
  console.log(mode + ' upgrade checks passed');
}

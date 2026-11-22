// Pre-draft workouts and the combine (2026-11-22).
//  • The combine: after the season review (seasonReview → runCombine), the top COMBINE_N prospects on the league's
//    board are measured once, and the numbers stay on their profile for good: height without and with shoes,
//    wingspan, standing reach, weight, max and standing vertical, lane agility, three-quarter sprint, bench press
//    (185 lb). They come from his body and athletic ratings at that moment, with a measuring error. One in seven
//    prospects from abroad skips it.
//  • Workouts: from the lottery until the first pick, you can bring in WO_MAX prospects. A workout halves the error
//    in your read of his ceiling (potential.ts potView `wo`, Game.potRead), adds a lot of scouting intel (sharper
//    skill reads and badges, overseas.ts intelF), and gives a report: shooting drills, the doctors' look and the
//    interview. A prospect projected far above your first pick (or anyone in the first round when you have no
//    pick) usually won't come: his agent wants him seen by the teams at the top.
// Nothing here runs during games: the combine is one pass over a class once a year, a workout one click.
import type { Game } from './Game';
import { mulberry32 } from './rng';
import { firstRoundOrder } from './lottery';

export const WO_MAX = 12;
export const COMBINE_N = 70;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seeded = (a: number, b: number) => mulberry32((((a + 7) * 2654435761) ^ (b * 40503)) >>> 0);
const norm = (r: () => number) => (r() + r() + r() + r() - 2) * 1.73; // about sd 1

// ── The combine ─────────────────────────────────────────────────────────────────────
// Stored as p.cmb: [barefoot ×4, in shoes ×4, wingspan ×4, standing reach ×4, weight, max vertical ×2,
// standing vertical ×2, lane agility ×100, sprint ×100, bench reps]. A skipped combine: p.cmb = 0.
export interface Combine {
  bare: number;
  shoes: number;
  wing: number;
  reach: number;
  wt: number;
  maxV: number;
  stdV: number;
  lane: number;
  sprint: number;
  bench: number;
}
export function measure(g: Game, p: any): number[] {
  const r = seeded(p.id, 11),
    n = (sd: number) => norm(r) * sd,
    q = (v: number, k: number) => Math.round(v * k);
  const h = g.inches(p.hgt),
    R = p.r || {};
  const bare = h - 0.5 + n(0.3),
    shoes = bare + 1.25 + n(0.15),
    wing = (p.wing ?? h + 4) + n(0.3),
    reach = bare * 1.32 + (wing - bare) * 0.45 + n(0.6);
  const maxV = cl(24 + (R.jmp ?? 50) * 0.21 + n(1.2), 22, 46),
    stdV = cl(maxV - 6.5 + n(1), 18, 38),
    lane = cl(12.6 - (((R.spd ?? 50) + (R.acc ?? 50)) / 2) * 0.028 + n(0.15), 9.9, 13.4),
    sprint = cl(3.62 - (R.spd ?? 50) * 0.0062 + n(0.04), 2.95, 3.8),
    bench = Math.max(0, Math.round(((R.stre ?? 50) - 22) * 0.27 + n(1.5)));
  return [
    q(bare, 4),
    q(shoes, 4),
    q(wing, 4),
    q(reach, 4),
    Math.round(p.wt || 0),
    q(maxV, 2),
    q(stdV, 2),
    q(lane, 100),
    q(sprint, 100),
    bench,
  ];
}
export function combineOf(p: any): Combine | null {
  const c = p?.cmb;
  if (!Array.isArray(c) || c.length < 10) return null;
  return {
    bare: c[0] / 4,
    shoes: c[1] / 4,
    wing: c[2] / 4,
    reach: c[3] / 4,
    wt: c[4],
    maxV: c[5] / 2,
    stdV: c[6] / 2,
    lane: c[7] / 100,
    sprint: c[8] / 100,
    bench: c[9],
  };
}
// Who was invited: the league's board (db.rank), top COMBINE_N of the class.
export function runCombine(g: Game, s: any) {
  const d: any = g.db,
    P = d.P,
    Y = g.Y;
  const ids: number[] = (d.cls?.[Y] || []).filter((id: number) => P[id] && !P[id].retired && !P[id].gone);
  if (!ids.length || ids.some((id: number) => P[id].cmb != null)) return; // once a class
  ids
    .slice()
    .sort((a, b) => (d.rank?.[a] ?? 999) - (d.rank?.[b] ?? 999))
    .forEach((id, i) => {
      const p = P[id];
      if (i >= COMBINE_N) return;
      const abroad = p.from?.country && p.from.country !== 'US';
      p.cmb = abroad && seeded(id, 12)() < 1 / 7 ? 0 : measure(g, p);
    });
  void s;
}
// 6′7¼″ from inches.
export function ftIn(x: number) {
  const ft = Math.floor(x / 12),
    inch = x - ft * 12,
    whole = Math.floor(inch),
    fr = Math.round((inch - whole) * 4);
  return ft + '′' + (fr === 4 ? whole + 1 : whole) + (fr === 1 ? '¼' : fr === 2 ? '½' : fr === 3 ? '¾' : '') + '″';
}

// ── Workouts ────────────────────────────────────────────────────────────────────────
// s.wo = { y: draft year, by: { [tid]: pid[] } }.
export const woOpen = (s: any) => s.phase === 'lottery' || (s.phase === 'draft' && !(s.picks || []).some((x: any) => x.pid));
export const worked = (s: any, Y: number, tid: number, pid: number) => s.wo?.y === Y && !!s.wo.by?.[tid]?.includes(pid);
export const woUsed = (s: any, Y: number, tid: number) => (s.wo?.y === Y ? s.wo.by?.[tid]?.length || 0 : 0);
// Your first pick in this draft: the real order once the lottery is drawn, else the projection.
export function bestSlot(g: Game, s: any, tid: number): number | null {
  if (s.phase === 'draft' && (s.picks || []).length) {
    const mine = s.picks.filter((x: any) => g.owner2027(x.orig, s.assets, x.rd) === tid).map((x: any) => x.n);
    return mine.length ? Math.min(...mine) : null;
  }
  const r1: number[] = firstRoundOrder(g, s).order;
  const i = r1.findIndex(orig => g.owner2027(orig, s.assets, 1) === tid);
  if (i >= 0) return i + 1;
  const r2 = s.teams.map((t: any) => t.tid).sort((a: number, b: number) => g.pct(s.teams[a]) - g.pct(s.teams[b]) || a - b);
  const j = r2.findIndex((orig: number) => g.owner2027(orig, s.assets, 2) === tid);
  return j >= 0 ? r1.length + j + 1 : null;
}
// A workout halves the miss in your read of his ceiling: your read v moved halfway to the truth.
export const woPot = (p: any, v: number) => {
  const t = p.tpot ?? p.pot;
  return Math.max(p.ovr, Math.round(t + (v - t) * 0.5));
};
// Will he come? His place on the league's board against your first pick.
export function woAnswer(g: Game, s: any, tid: number, p: any): { ok: boolean; why: string } {
  const rank = (g.db as any).rank?.[p.id] ?? 99,
    slot = bestSlot(g, s, tid),
    anyway = seeded(p.id, tid + 31)() < 0.15;
  if (slot == null && rank <= 45 && !anyway) return { ok: false, why: 'His agent only sends him to teams with a pick where he’ll go.' };
  if (slot != null && rank < slot * 0.6 && !anyway)
    return {
      ok: false,
      why: 'His agent says he’ll be gone long before your pick (No. ' + slot + '): he’s only working out for teams near the top.',
    };
  return { ok: true, why: '' };
}
export function doWorkout(g: Game, s: any, tid: number, pid: number, god = false): string {
  const p = g.db.P[pid],
    Y = g.Y;
  if (!p || p.cls !== Y) return 'Only this year’s draft prospects work out.';
  if (!woOpen(s)) return 'Workouts run from the lottery until the first pick.';
  if (worked(s, Y, tid, pid)) return p.name + ' already worked out for you.';
  if (!god && woUsed(s, Y, tid) >= WO_MAX) return 'You’ve used all ' + WO_MAX + ' workouts.';
  const a = woAnswer(g, s, tid, p);
  if (!god && !a.ok) return p.name + ' won’t come in. ' + a.why;
  g.setState((st: any) => {
    const wo = st.wo?.y === Y ? st.wo : { y: Y, by: {} };
    return {
      wo: { y: Y, by: { ...wo.by, [tid]: [...(wo.by[tid] || []), pid] } },
      intel: { ...(st.intel || {}), [pid]: +Math.min(12, ((st.intel || {})[pid] || 0) + 6).toFixed(2) },
    };
  });
  return '';
}
// The workout report: shooting drills, the doctors, the interview. Seeded, so it reads the same every time.
export function woReport(p: any) {
  const r = seeded(p.id, 13),
    n = (sd: number) => norm(r) * sd,
    R = p.r || {},
    made = (att: number, pct: number) => Math.round(att * cl(pct, 0.05, 0.98));
  const drills: [string, number, number][] = [
    ['Threes', made(50, 0.22 + (R.tp ?? 40) * 0.0055 + n(0.04)), 50],
    ['Mid-range', made(40, 0.3 + (R.fg ?? 45) * 0.005 + n(0.04)), 40],
    ['Free throws', made(20, 0.45 + (R.ft ?? 60) * 0.0055 + n(0.03)), 20],
  ];
  const pers = p.pers || {},
    flagged = pers.prone ? r() < 0.8 : r() < 0.03;
  const medical = flagged ? 'Flagged: the doctors don’t like his injury history.' : 'Clean.';
  const MOT: Record<string, string> = {
    Winning: 'All he talks about is winning.',
    Money: 'Asked about his second contract before his first.',
    Fame: 'Wants to be a star and says so.',
    Loyalty: 'Wants to find a home and stay there.',
    'Playing time': 'Wants minutes right away.',
  };
  const bits = [MOT[pers.mot] || ''];
  if (pers.pro) bits.push('Prepared and serious: a pro already.');
  if (pers.volatile) bits.push('Got prickly when pushed on his weaknesses.');
  if (pers.alpha) bits.push('Wants the ball when it matters.');
  return { drills, medical, flagged, interview: bits.filter(Boolean).join(' ') || 'Polite, quiet, gave little away.' };
}

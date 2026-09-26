// The media: preseason predictions (standings, win totals, title and award picks, a top 100
// players list) and mock drafts, from outlets that each see the league their own way. All
// just for fun; nothing here affects the game.
//
// Predictions update through the preseason and lock on opening night (saved with the league,
// so after the season you can see who got it right). Every outlet's noise is seeded by season,
// outlet and team/player, so the same inputs always give the same picks.
import type { Game } from './Game';
import { teamRating, wngRating } from './ratings';

export interface Outlet { k: string; name: string; parody: string; color: string; analyst: string; draftAnalyst: string; style: string; listName: string; book?: boolean }
export const OUTLETS: Outlet[] = [
  { k: 'peen', name: 'PEEN', parody: 'ESPN', color: '#c8102e', analyst: 'the PEEN Analytics desk', draftAnalyst: 'Jonah Givens', style: 'Model-driven. The PEEN Basketball Projection Index trusts roster strength and little else.', listName: 'PEENrank' },
  { k: 'donger', name: 'The Donger', parody: 'The Ringer', color: '#7b3fe4', analyst: 'Zach Harlowe', draftAnalyst: 'Kevin O’Callahan', style: 'Loves young teams, upside, shooting and anyone fun to watch. Swings big on potential.', listName: 'The Donger’s Top 100' },
  { k: 'bleacher', name: 'Bleacher Retort', parody: 'Bleacher Report', color: '#3d3d3d', analyst: 'Dex Morrow', draftAnalyst: 'Jon Waterman', style: 'Star power first, big markets second. Every take is a headline.', listName: 'B/R 100' },
  { k: 'athleisure', name: 'The Athleisure', parody: 'The Athletic', color: '#1f6f5c', analyst: 'Priya Okafor', draftAnalyst: 'Sam Venetti', style: 'Insider-driven. Trusts depth, defense and continuity; the best-sourced mock draft.', listName: 'The Athleisure 100' },
  { k: 'illiterated', name: 'Sports Illiterated', parody: 'Sports Illustrated', color: '#b3001b', analyst: 'Colin Mayhew', draftAnalyst: 'Colin Mayhew', style: 'Old school. Proven veterans, last year’s results and résumés.', listName: 'SI Top 100' },
  { k: 'fox', name: 'Fox Spurts', parody: 'FOX Sports', color: '#0a3d91', analyst: 'Chip Hollister', draftAnalyst: 'Chip Hollister', style: 'Hot takes. Somebody is always a fraud, and a long shot is always winning it all.', listName: 'Chip’s Top 100' },
  { k: 'dq', name: 'DraftQueens', parody: 'DraftKings', color: '#2e7d32', analyst: 'the DraftQueens sportsbook', draftAnalyst: '', style: 'Win totals and title odds, shaded toward where the public bets: big markets and stars.', listName: '', book: true },
];
export const PANEL = OUTLETS.filter(o => !o.book); // the six that rank players and mock the draft

// Seeded randomness.
const hash = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
const unit = (str: string) => { let a = hash(str) | 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = (str: string) => (unit(str + 'a') + unit(str + 'b') + unit(str + 'c') + unit(str + 'd') - 2) * 1.73;
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const zs = (vals: Record<number, number>) => { const v = Object.values(vals), m = mean(v), sd = Math.sqrt(mean(v.map(x => (x - m) ** 2))) || 1; const o: Record<number, number> = {}; Object.entries(vals).forEach(([k, x]) => (o[+k] = (x - m) / sd)); return o; };

export interface OutletPred { wins: Record<number, number>; champ: number; runner: number; mvp: number[]; dpoy: number[]; roy: number[]; top100: number[]; odds?: Record<number, number>; mvpOdds?: Record<number, number>; frauds?: number; line: string }
export interface SeasonPreds { season: number; locked: boolean; outlets: Record<string, OutletPred> }

const scoring = (p: any) => (p.r.ins + p.r.dnk + (p.r.lay ?? p.r.dnk) + p.r.fg + p.r.tp + p.r.drb) / 6;
const athletic = (p: any) => (p.r.spd + (p.r.acc ?? p.r.spd) + p.r.jmp) / 3;
const defense = (p: any) => p.r.diq * 0.5 + (p.r.hgt + p.r.jmp + p.r.spd) / 3 * 0.3 + wngRating(p) * 0.2;
const american = (pr: number) => { const p = Math.min(0.95, Math.max(0.002, pr)); const v = p >= 0.5 ? -100 * p / (1 - p) : 100 * (1 - p) / p; const r = Math.abs(v) >= 1000 ? 500 : Math.abs(v) >= 300 ? 50 : 10; return Math.round(v / r) * r; };
export const fmtOdds = (v: number) => (v > 0 ? '+' : '') + v;

function build(g: Game, s: any): SeasonPreds {
  const P = g.db.P, T = s.teams, Y = g.Y, tids = T.map((t: any) => t.tid);
  const roster = (tid: number) => (s.rosters[tid] || []).map((id: number) => P[id]).filter(Boolean).sort((a: any, b: any) => b.ovr - a.ovr);
  // Team features, as z-scores across the league.
  const f = { tr: {}, star: {}, depth: {}, youth: {}, vets: {}, last: {}, mkt: {}, def: {}, shoot: {} } as Record<string, Record<number, number>>;
  const hist = (s.history || []).find((h: any) => h.year === Y - 1);
  tids.forEach((t: number) => { const r = roster(t), top8 = r.slice(0, 8);
    f.tr[t] = teamRating(P, s.rosters[t] || []); f.star[t] = mean(r.slice(0, 2).map((p: any) => p.ovr)); f.depth[t] = mean(r.slice(5, 10).map((p: any) => p.ovr));
    f.youth[t] = r.slice(0, 10).reduce((a: number, p: any) => a + (p.age <= 24 ? Math.max(0, p.pot - p.ovr) : 0), 0);
    f.vets[t] = mean(top8.map((p: any) => p.age)); f.mkt[t] = T[t].mkt ?? 1; f.def[t] = mean(top8.map(defense)); f.shoot[t] = mean(top8.map((p: any) => p.r.tp));
    const hr = hist?.teams?.[t]; f.last[t] = hr && hr.w + hr.l ? hr.w / (hr.w + hr.l) : NaN; });
  if (Object.values(f.last).some(v => isNaN(v))) tids.forEach((t: number) => (f.last[t] = f.tr[t])); // no last season yet: fall back to roster strength
  const z: Record<string, Record<number, number>> = {}; Object.keys(f).forEach(k => (z[k] = zs(f[k])));
  const W: Record<string, [Record<string, number>, number]> = {
    peen: [{ tr: 1 }, .25], donger: [{ tr: .8, youth: .45, shoot: .2 }, .45], bleacher: [{ tr: .6, star: .6, mkt: .25 }, .55],
    athleisure: [{ tr: .85, depth: .35, def: .25 }, .35], illiterated: [{ tr: .6, last: .5, vets: .2 }, .4], fox: [{ tr: .8 }, 1.0], dq: [{ tr: 1, mkt: .12, star: .1 }, .15],
  };
  const act = (Object.values(s.rosters).flat() as number[]).map(id => P[id]).filter(Boolean);
  const tidOf: Record<number, number> = {}; Object.keys(s.rosters).forEach(k => s.rosters[k].forEach((id: number) => (tidOf[id] = +k)));
  const accol: Record<number, number> = {}; Object.values(s.awards || {}).forEach((a: any) => { (a.mvp || []).slice(0, 1).forEach((x: any) => (accol[x.pid] = (accol[x.pid] || 0) + 3)); (a.allLeague || []).forEach((tm: number[], i: number) => tm.forEach(pid => (accol[pid] = (accol[pid] || 0) + (3 - i) * 0.6))); });
  const rookie = (p: any) => p.draft === Y - 1 && !(p.stats || []).some((r: any) => r.season < Y);
  const bestTr = tids.slice().sort((a: number, b: number) => z.tr[b] - z.tr[a])[0];
  const outlets: Record<string, OutletPred> = {};
  OUTLETS.forEach(o => {
    const [w, nz] = W[o.k], key = Y + o.k;
    const sc: Record<number, number> = {};
    tids.forEach((t: number) => { sc[t] = Object.entries(w).reduce((a, [k, x]) => a + x * z[k][t], 0) + nz * gauss(key + 't' + t); });
    let frauds: number | undefined;
    if (o.k === 'fox') { frauds = bestTr; sc[bestTr] -= 1.4; }
    const sz = zs(sc), wins: Record<number, number> = {};
    tids.forEach((t: number) => (wins[t] = Math.max(12, Math.min(70, 41 + sz[t] * 12))));
    const shift = 41 - mean(Object.values(wins)); tids.forEach((t: number) => (wins[t] = o.book ? Math.floor(wins[t] + shift) + 0.5 : Math.round(wins[t] + shift)));
    const ranked = tids.slice().sort((a: number, b: number) => sc[b] - sc[a]);
    let champ = ranked[0];
    if (o.k === 'fox') { champ = ranked[3 + Math.floor(unit(key + 'champ') * 5)]; if (champ === frauds) champ = ranked[2]; } // the long shot
    const runner = ranked.find((t: number) => T[t].conf !== T[champ].conf)!;
    // Players: award picks and the top 100.
    const projW = (p: any) => wins[tidOf[p.id]] ?? 41;
    const pscore = (p: any, bias: number, sd: number, tag: string) => bias + sd * gauss(key + tag + p.id);
    const top = (xs: any[], fn: (p: any) => number, n = 3) => xs.map(p => ({ p, v: fn(p) })).sort((a, b) => b.v - a.v).slice(0, n).map(x => x.p.id);
    const mvpB = (p: any) => o.k === 'bleacher' ? (scoring(p) - p.ovr) * 0.2 : o.k === 'donger' ? (p.age <= 25 ? 1.5 : 0) : o.k === 'athleisure' ? (defense(p) - p.ovr) * 0.08 : o.k === 'illiterated' ? (accol[p.id] || 0) * 0.5 : 0;
    const mvp = top(act, p => p.ovr + projW(p) * 0.12 + pscore(p, mvpB(p), o.k === 'fox' ? 2.5 : 1.3, 'mvp'));
    const dpB = (p: any) => o.k === 'peen' ? (p.r.diq - 50) * 0.03 : o.k === 'donger' ? (athletic(p) - 50) * 0.06 : o.k === 'bleacher' ? ((p.r.hgt + p.r.jmp) / 2 - 50) * 0.07 : o.k === 'athleisure' ? (p.r.diq - 50) * 0.1 : o.k === 'illiterated' ? (p.age >= 28 ? 1.5 : 0) : 0;
    // Voters lean to defensive specialists over stars who also defend.
    const dpoy = top(act, p => defense(p) + (defense(p) - scoring(p)) * 0.25 + pscore(p, dpB(p), o.k === 'fox' ? 3 : 2, 'dpoy'));
    const roy = top(act.filter(rookie), p => p.ovr - (z.tr[tidOf[p.id]] ?? 0) * 1.5 + pscore(p, o.k === 'donger' ? (p.pot - p.ovr) * 0.1 : 0, o.k === 'fox' ? 2.5 : 1, 'roy'));
    let top100: number[] = [];
    if (!o.book) {
      const bias = (p: any) => o.k === 'donger' ? (p.age <= 24 ? Math.max(0, p.pot - p.ovr) * 0.25 : 0) + (p.age <= 23 ? 1 : 0) - (p.age >= 33 ? 1.5 : 0)
        : o.k === 'bleacher' ? (scoring(p) - p.ovr) * 0.15 + (athletic(p) - p.ovr) * 0.1
        : o.k === 'athleisure' ? (defense(p) - p.ovr) * 0.15 + (p.r.oiq - p.ovr) * 0.05
        : o.k === 'illiterated' ? (accol[p.id] || 0) * 0.8 + (p.age >= 30 ? 0.8 : 0)
        : o.k === 'fox' ? (p.age >= 31 ? 2 : p.age <= 23 ? -1.5 : 0) : 0;
      const sd = { peen: 0.8, donger: 1, bleacher: 1.2, athleisure: 0.8, illiterated: 0.8, fox: 2 }[o.k] ?? 1;
      top100 = top(act.filter(p => p.ovr >= 45), p => p.ovr + pscore(p, bias(p), sd, 'rk'), 100);
    }
    // Sportsbook: title odds from a softmax of its scores, with the house's cut.
    let odds: Record<number, number> | undefined, mvpOdds: Record<number, number> | undefined;
    if (o.book) {
      const ex = tids.map((t: number) => Math.exp(sz[t] * 2.2)), tot = ex.reduce((a: number, x: number) => a + x, 0); odds = {};
      tids.forEach((t: number, i: number) => (odds![t] = american(ex[i] / tot * 1.25)));
      mvpOdds = {}; mvp.forEach((pid, i) => (mvpOdds![pid] = american([0.3, 0.18, 0.1][i])));
    }
    const tn = (t: number) => T[t].region + ' ' + T[t].name, poss = (x: string) => x + (x.endsWith('s') ? '’' : '’s'), star = P[roster(champ)[0]?.id];
    const line = ({
      peen: () => 'PEEN PBI projects the ' + tn(champ) + ' for ' + wins[champ] + ' wins, the most in the league, and the best title odds.',
      donger: () => roster(champ).slice(0, 8).some((p: any) => p.age <= 24 && p.ovr >= 58) ? 'The kids are ready. The ' + tn(champ) + ' are the most fun team in the league, and they win it all.' : 'The ' + tn(champ) + ' are the most fun team in the league, and it isn’t close. Title.',
      bleacher: () => (star ? star.name + ' and the ' : 'The ') + tn(champ) + ': the league runs through ' + T[champ].region + ' this year.',
      athleisure: () => 'League sources rave about the ' + poss(tn(champ)) + ' depth and defense. They’re our pick to win it all.',
      illiterated: () => 'Experience wins in June. The ' + tn(champ) + ' have it.',
      fox: () => 'The ' + tn(champ) + ' win the title. Book it. And the ' + tn(frauds!) + '? FRAUDS.',
      dq: () => 'The ' + tn(champ) + ' open as title favorites at ' + fmtOdds(odds?.[champ] ?? 0) + '.',
    }[o.k] as () => string)();
    outlets[o.k] = { wins, champ, runner, mvp, dpoy, roy, top100, odds, mvpOdds, frauds, line };
  });
  return { season: Y, locked: s.phase !== 'preseason', outlets };
}

// This season's predictions: live through the preseason, locked (and saved) from opening night.
const cache = new WeakMap<object, SeasonPreds>();
export function mediaPreds(g: Game, s: any): SeasonPreds {
  const d: any = g.db, saved = d.preds?.[g.Y]; if (saved) return saved;
  const hit = cache.get(s); if (hit) return hit;
  const out = build(g, s);
  if (out.locked) (d.preds = d.preds || {})[g.Y] = out; else cache.set(s, out);
  return out;
}
export const pastPreds = (g: Game): Record<number, SeasonPreds> => (g.db as any).preds || {};

// Consensus of the six panel outlets' top 100s: average rank (101 when left off).
export function consensus(sp: SeasonPreds) {
  const ranks: Record<number, number[]> = {};
  PANEL.forEach(o => (sp.outlets[o.k]?.top100 || []).forEach((pid, i) => (ranks[pid] = ranks[pid] || []).push(i + 1)));
  return Object.entries(ranks).map(([pid, rs]) => ({ pid: +pid, avg: (rs.reduce((a, x) => a + x, 0) + (PANEL.length - rs.length) * 101) / PANEL.length, hi: Math.min(...rs), lo: rs.length < PANEL.length ? 101 : Math.max(...rs), n: rs.length }))
    .sort((a, b) => a.avg - b.avg).slice(0, 100);
}

// Mock drafts: who each outlet has every team taking in the first round. Each outlet sees the
// prospects through its own scouting (noise) and biases, and weighs team needs its own way.
export interface MockPick { n: number; orig: number; owner: number; pid: number; why: string }
export function mockDraft(g: Game, s: any, k: string): MockPick[] {
  const P = g.db.P, Y = g.Y, pool0: number[] = (g.db as any).cls?.[Y] || [], rankOf: Record<number, number> = (g.db as any).rank || {};
  const order = g.boardOrder(s).filter((x: any) => (x.rd || 1) === 1);
  const key = Y + 'mock' + k, sd = { peen: 3, donger: 4, bleacher: 5, athleisure: 2, illiterated: 3.5, fox: 6 }[k] ?? 4;
  const needW = { peen: .8, donger: .3, bleacher: .5, athleisure: 1.2, illiterated: 1, fox: .5 }[k] ?? .6;
  const val = (p: any) => {
    const n = sd * gauss(key + p.id);
    if (k === 'athleisure') return 100 - (rankOf[p.id] ?? 60) * 0.9 + n; // mirrors how teams actually rank them
    const base = k === 'donger' ? p.pot * .8 + p.ovr * .2 : k === 'illiterated' ? p.pot * .45 + p.ovr * .55 : p.pot * .6 + p.ovr * .4;
    const b = k === 'donger' ? (p.age <= 19 ? 1.5 : p.age >= 22 ? -1.5 : 0) : k === 'bleacher' ? (athletic(p) - 50) * .08 : k === 'illiterated' ? (p.from?.lg === 'NCAA' && p.age >= 21 ? 1.5 : 0) : k === 'fox' ? (p.grp === 'B' ? 2 : 0) : 0;
    return base + b + n;
  };
  const V: Record<number, number> = {}; pool0.forEach(id => P[id] && (V[id] = val(P[id])));
  const pool = new Set(pool0.filter(id => P[id]));
  const needOf = (tid: number) => { const r = (s.rosters[tid] || []).map((id: number) => P[id]).filter(Boolean).sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 10); const c: Record<string, number> = { G: 0, W: 0, B: 0 }; r.forEach((p: any) => (c[p.grp] = (c[p.grp] || 0) + 1)); return (['G', 'W', 'B'] as const).slice().sort((a, b) => c[a] - c[b])[0]; };
  const cons = [...pool].sort((a, b) => (rankOf[a] ?? 99) - (rankOf[b] ?? 99));
  const out: MockPick[] = [];
  order.forEach((x: any, i: number) => {
    const owner = g.owner2027(x.orig, s.assets, 1), need = needOf(owner);
    let best = -1, bv = -1e9, bpa = -1, bpv = -1e9;
    pool.forEach(id => { const v = V[id], vn = v + (P[id].grp === need ? needW * 2 : 0); if (vn > bv) { bv = vn; best = id; } if (v > bpv) { bpv = v; bpa = id; } });
    if (best < 0) return;
    pool.delete(best);
    const p = P[best], cr = cons.indexOf(best) + 1, ups = p.pot - p.ovr;
    const say = (xs: string[]) => xs[Math.floor(unit(key + 'say' + best) * xs.length)];
    const why = k === 'fox' && cr - (i + 1) > 8 ? say(['Trust me on this one.', 'Everybody’s sleeping on him. Not me.', 'Mark it down: best player in this draft in five years.'])
      : k === 'donger' && p.age <= 19 && ups >= 18 && cr > i + 1 ? say(['Upside swing: the ceiling is enormous.', 'Bet on the tools. He’s 19.', 'The most fun pick on the board.'])
      : k === 'bleacher' && athletic(p) >= 64 ? say(['Freak athlete. The highlights write themselves.', 'Nobody in this class moves like him.', 'Pure bounce and burst.'])
      : k === 'athleisure' && unit(key + 'src' + best) < .35 ? say(['Sources say they love him.', 'He had a strong workout here, per league sources.', 'Intel points this way.'])
      : k === 'illiterated' && p.from?.lg === 'NCAA' && p.age >= 21 ? say(['A proven college producer.', 'Ready to help on day one.', 'Three years of tape. He can play.'])
      : best !== bpa ? 'Fills a need at ' + ({ G: 'guard', W: 'wing', B: 'big' } as any)[p.grp] + '.'
      : i < 3 ? say(['The best player in the class on our board.', 'No overthinking it.', 'Top of our board.'])
      : say(['Best player available.', 'Value pick at this spot.', 'Too good to pass up here.', 'Highest on our board still available.']);
    out.push({ n: x.n, orig: x.orig, owner, pid: best, why });
  });
  return out;
}

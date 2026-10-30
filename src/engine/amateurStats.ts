// College and club stats for draft prospects (2026-10-26). Nothing is stored: each season line is worked out when
// it's shown, from the prospect's true amateur game (p.r before the hidden NBA translation, translation.ts; p.am, kept as the summer after his draft began, from then on), the
// level he plays at, his age and role, his team situation (situation(): role, minutes, pace, system, position) and a season's luck, seeded by his id and the season, so the same player
// always shows the same numbers. Earlier seasons step his game back by the growth he had left at each age.
// The numbers never hint at the translation; where they disagree with the board (your scouts' read, with its
// errors), the scouts may have misread him. Advanced stats come from the game's own formulas (advanced.ts),
// computed over the whole class per season (so BPM is relative to the class).
import type { Game } from './Game';
import { mulberry32 } from './rng';
import { ovrExact } from './ratings';
import { blockSkill, offAbility, rebSkill, stealSkill, zoneSkill } from './sim';
import { SKILLS } from './development';
import { amateurAdvanced, type StatLine } from './advanced';
import { COLLEGES, D2, D3, IVY_LEAGUE, JUCO, LOW_MAJORS, MID_MAJORS, MORE_COLLEGES, NAIA } from '../data/world';
import { tierOf } from '../data/leagues';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// How good his opponents are, on the ratings scale (an NBA rotation player is about 50).
export function compLevel(from: any): { c: number; label: string; college: boolean } {
  const lg = from?.lg || '', team = from?.team || '';
  // Below Division I (2026-10-30): junior college about like a low-major's bench, Division II and the NAIA a step below, Division III lowest.
  if (lg === 'JUCO') return { c: 13, label: 'Junior college', college: true };
  if (lg === 'NAIA') return { c: 11, label: 'NAIA', college: true };
  if (lg === 'NCAA' && D2.includes(team)) return { c: 12, label: 'NCAA Division II', college: true };
  if (lg === 'NCAA' && D3.includes(team)) return { c: 9, label: 'NCAA Division III', college: true };
  if (lg === 'NCAA') return COLLEGES.includes(team) ? { c: 24, label: 'NCAA, power program', college: true } : MORE_COLLEGES.includes(team) ? { c: 22, label: 'NCAA, power conference', college: true } : IVY_LEAGUE.includes(team) ? { c: 16, label: 'NCAA, Ivy League', college: true } : MID_MAJORS.includes(team) ? { c: 18, label: 'NCAA, mid-major', college: true } : LOW_MAJORS.includes(team) ? { c: 15, label: 'NCAA, small conference', college: true } : { c: 17, label: 'NCAA', college: true };
  if (lg === 'EuroLeague') return { c: 38, label: 'EuroLeague', college: false };
  if (lg === 'Overtime Elite') return { c: 15, label: 'Overtime Elite', college: false };
  const t = tierOf(lg);
  return t >= 4 ? { c: 9, label: 'Junior', college: false } : t === 3 ? { c: 12, label: 'High school', college: true } : t === 2 ? { c: 24, label: lg + ' (second division)', college: false } : { c: 32, label: lg, college: false };
}

// His game in an earlier season: the skills he had yet to add by the draft (about 3 a year in his teens, 2 at
// 20–21, 1 after), his body a little less grown.
function snapshot(p: any, yearsBack: number) {
  const r = { ...(p.am?.r || p.r) }; let age = p.dAge ?? p.age;
  for (let k = 0; k < yearsBack; k++) { age--; const d = age < 20 ? 3 : age < 22 ? 2.2 : 1.2; SKILLS.forEach(s => (r[s] = Math.max(4, r[s] - d))); ['spd', 'acc', 'jmp', 'stre'].forEach(s => (r[s] = Math.max(4, r[s] - d * 0.4))); }
  return { r, age };
}

// His team situation in a season (2026-10-27), drawn by chance and never shown: part of it stays with him for
// his whole amateur career (the program's system, the role it gave him), part changes year to year. It moves
// what he did without changing who he is, so his numbers are a weaker clue than they look: a system player
// can put up big numbers, and a player stuck behind veterans or sharing the ball with stars looks quiet.
//   role: go-to option ↔ sharing the ball (his usage) · minutes: trusted ↔ buried behind veterans
//   pace: a fast or slow team (his counting stats) · system: spacing and good looks (his shooting)
//   position: played on the ball (more assists, fewer rebounds) or inside (the other way round)
//   team: how good his team was (box plus-minus credits players on winning teams, as the real one does)
function situation(id: number, season: number) {
  const a = mulberry32(((id * 2246822519) ^ 0x51a7) >>> 0), b = mulberry32(((id * 3266489917) ^ (season * 668265263) ^ 0x51a8) >>> 0);
  const z = (r: () => number) => (r() + r() + r() - 1.5) * 2, mix = () => (0.75 * z(a) + 0.55 * z(b)) / 0.93; // about one standard deviation, mostly his own
  const role = mix(), mins = mix(), pace = mix(), sys = mix(), pos = mix(), team = mix(), buried = b() < 0.08;
  return { usg: Math.exp(0.22 * role), min: Math.exp(0.12 * mins) * (buried ? 0.65 : 1), pace, eff: 0.02 * sys, ast: Math.exp(0.2 * pos), reb: Math.exp(-0.15 * pos), team };
}

export interface AmLine { season: number; team: string; lg: string; level: string; age: number; gp: number; mpg: number; disp: StatLine; t: StatLine; tq: number; note?: string }
// One season of his college path (schoolPath): where, and whether he played. redshirt: practiced, didn't play; medical:
// hurt early, the season didn't count; sitout: a transfer sitting out under the rules then; short: an injury cut it short.
export interface Stint { team: string; lg: string; kind?: 'redshirt' | 'medical' | 'sitout' | 'short' }
const NOTE: Record<string, string> = { redshirt: 'Redshirt (practiced, didn’t play)', medical: 'Medical redshirt (hurt early)', sitout: 'Sat out after transferring', short: 'Injury-shortened season' };
// One season: per-possession rates from his game against the level, then a season's luck on the attempts.
export function seasonLine(p: any, season: number, yearsBack: number, st?: Stint): AmLine {
  const rnd = mulberry32(((p.id * 2654435761) ^ (season * 40503) ^ 0xa11) >>> 0), nz = (s: number) => Math.exp(s * (rnd() + rnd() + rnd() - 1.5) * 2);
  const from = st ? { team: st.team, lg: st.lg } : p.from, kind = st?.kind;
  const { r, age } = snapshot(p, yearsBack), lv = compLevel(from), o = ovrExact(p.am ? { ...p, r, grp: p.am.grp, intg: { ...p.intg, feel: p.am.feel }, rx: p.am.rx } : { ...p, r }), dom = o - lv.c, zs = zoneSkill(r), off = offAbility(r);
  const sit = situation(p.id, season);
  const C = Math.max(lv.c, o - 22); // far above his competition, the edge levels off (a high-school star's numbers stay believable)
  const gp0 = lv.college ? 29 + Math.floor(rnd() * 7) : 22 + Math.floor(rnd() * 13), gp = kind === 'redshirt' || kind === 'sitout' ? 0 : kind === 'medical' ? 2 + Math.floor(rnd() * 7) : kind === 'short' ? 8 + Math.floor(rnd() * 11) : gp0;
  // Capped at what a game allows (2026-10-30: a big role could reach 45 a game): college and high school 38 (the real college leaders play about 37), clubs 36.
  const mpg = +Math.min(lv.college ? 38 : 36, (lv.college ? cl(24 + 0.5 * dom, 8, 35) : cl(16 + 0.6 * dom, 5, 32)) * cl(nz(0.06) * sit.min, 0.55, 1.3)).toFixed(1);
  // Rates per possession on the floor.
  const usg = cl(0.2 * Math.exp(0.025 * (off - C - 4)) * nz(0.05) * sit.usg, 0.08, 0.38);
  const tovR = cl(0.14 * Math.exp(-((r.drb * 0.5 + r.pss * 0.3 + r.oiq * 0.2) - C - 8) / 70) * (1 + (usg - 0.2)) * nz(0.08), 0.06, 0.26);
  const ftr = cl(0.3 * Math.exp((r.ins * 0.4 + ((r.dnk + (r.lay ?? r.dnk)) / 2) * 0.3 + r.stre * 0.15 + (r.acc ?? r.spd) * 0.15 - C - 12) / 40) * nz(0.1), 0.08, 0.75);
  const w = { rim: Math.exp((zs.rim - 55) / 15), mid: 0.6 * Math.exp((zs.mid - 55) / 15), three: 1.1 * Math.exp((r.tp - 55) / 12) }, wt = w.rim + w.mid + w.three;
  const pct = { rim: cl(0.62 + 0.0035 * (zs.rim - C - 12) + sit.eff, 0.4, 0.8), mid: cl(0.41 + 0.003 * (zs.mid - C - 12) + sit.eff, 0.25, 0.56), three: cl(0.355 + 0.003 * (zs.atb - C - 12) + sit.eff, 0.18, 0.47), ft: cl(0.7 + 0.005 * (r.ft - 45), 0.4, 0.93) };
  const astR = cl(0.2 * Math.exp((r.pss * 0.6 + r.oiq * 0.2 + r.drb * 0.2 - C - 18) / 22) * nz(0.08) * sit.ast, 0.03, 0.48);
  const rb = rebSkill(r), orbR = cl(0.05 * Math.exp((rb - C - 16) / 18) * nz(0.08) * sit.reb, 0.01, 0.15), drbR = cl(0.14 * Math.exp((rb - C - 16) / 22) * nz(0.06) * sit.reb, 0.05, 0.28);
  const stlR = cl(0.016 * Math.exp((stealSkill(r) - C - 12) / 20) * nz(0.1), 0.005, 0.045), blkR = cl(0.03 * Math.exp((blockSkill(r) - C - 16) / 14) * nz(0.12), 0.002, 0.15);
  const pf40 = 2.6 * (1 + (50 - r.diq) / 150);
  // A season at a given pace: possessions on the floor → attempts → makes (with their luck).
  const binom = (n: number, q: number) => Math.max(0, Math.min(n, Math.round(n * q + Math.sqrt(n * q * (1 - q)) * (rnd() + rnd() + rnd() - 1.5) * 2)));
  const build = (pace40: number, minFrame: number) => {
    const poss = (pace40 * mpg / 40) * gp, used = usg * poss, tov = Math.round(tovR * used), fta = Math.round(ftr * Math.max(0, used - tov) * 0.6), fga = Math.max(0, Math.round(used - tov - 0.44 * fta));
    const tpa = Math.round(fga * w.three / wt), rimA = Math.round(fga * w.rim / wt), midA = fga - tpa - rimA;
    const tpm = binom(tpa, pct.three), rimM = binom(rimA, pct.rim), midM = binom(midA, pct.mid), ftm = binom(fta, pct.ft), fgm = tpm + rimM + midM;
    const ast = Math.round(astR * Math.max(0, poss * 0.42 - fgm)), orb = Math.round(orbR * poss * 0.52), drb = Math.round(drbR * poss * 0.52);
    return { gp, gs: gp, min: mpg * gp * minFrame, pts: 2 * (rimM + midM) + 3 * tpm + ftm, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl: Math.round(stlR * poss), blk: Math.round(blkR * poss * 0.55), tov, pf: Math.round(pf40 * mpg / 40 * gp) } as StatLine;
  };
  // What he did (his level's pace in 40-minute games) and the same rates at an NBA pace in 48-minute terms for the formulas.
  const pace = Math.round(lv.college ? cl(68 + 4 * sit.pace, 61, 76) : cl(72 + 3 * sit.pace, 66, 78)), disp = build(pace, 1);
  return { season, team: from?.team || '—', lg: from?.lg || '', level: lv.label, age, gp, mpg: gp ? mpg : 0, tq: sit.team, disp, t: { ...disp, min: disp.min * 48 / 40, ...scale(disp, 100 / pace) }, ...(kind ? { note: NOTE[kind] } : {}) };
}
// Counting stats at another pace (the formulas' 48-minute, NBA-pace frame).
function scale(t: StatLine, f: number): StatLine { const o: StatLine = {}; ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'].forEach(k => (o[k] = t[k] * f)); return o; }

// The seasons he played before the draft: up to four in college (from 18), four abroad (from 16), one in high
// school or a junior team; shown through the league's current season.
export const amClass = (p: any): number => (p?.cls || p?.undrafted || 0); // his draft class (undrafted players keep theirs)
// Is there a true amateur game to show? Before his first NBA summer it's p.r; after it, the copy kept then (older
// saves didn't keep one).
export const hasAmateur = (g: Game, p: any) => !!(p?.r && amClass(p) && (p.am || amClass(p) >= g.Y) && g.db.cls?.[amClass(p)]?.includes(p.id));
export function amateurSeasons(g: Game, p: any): { season: number; back: number; st?: Stint }[] {
  if (!hasAmateur(g, p)) return [];
  const lv = compLevel(p.from), path = lv.college && lv.label !== 'High school' ? schoolPath(p) : null, dAge = p.dAge ?? p.age;
  const n = path ? path.length : lv.label === 'High school' || lv.label === 'Junior' ? 1 : cl(dAge - 16, 1, 4);
  const out: { season: number; back: number; st?: Stint }[] = []; const c = amClass(p); for (let y = c - n + 1; y <= Math.min(c, g.Y); y++) out.push({ season: y, back: c - y, ...(path ? { st: path[n - 1 - (c - y)] } : {}) });
  return out;
}

// His college path (2026-10-30), one entry a season, worked out from his id (never stored, the same every time). Years in
// college: his draft-night age minus 18 (a 22-year-old senior has four, a 24-year-old six). Most stay at one school; some
// transfer (more often the longer they stay: the portal), some start at a junior college (Jimmy Butler, Jae Crowder) or
// below Division I (Derrick White, Duncan Robinson, Max Strus) and move up; a few finish below Division I (Ben Wallace).
// Years past the four (or, now and then, five) he can play are a redshirt, a medical redshirt or a transfer sitting out;
// once in a while an injury cuts a season short.
export function schoolPath(p: any): Stint[] {
  const fin = p.from || {}, dAge = p.dAge ?? p.age, Y = cl(dAge - 18, 1, 6), r = mulberry32(((p.id * 1597334677) ^ 0x5c4001) >>> 0);
  const pick = <T,>(L: T[]) => L[Math.floor(r() * L.length)], small = fin.lg === 'NAIA' || D2.includes(fin.team) || D3.includes(fin.team);
  const out: Stint[] = Array.from({ length: Y }, () => ({ team: fin.team, lg: fin.lg }));
  const smallSchool = (): Stint => { const x = r(); return x < 0.6 ? { team: pick(D2), lg: 'NCAA' } : x < 0.85 ? { team: pick(D3), lg: 'NCAA' } : { team: pick(NAIA), lg: 'NAIA' }; };
  // Where he started.
  let start = 0; const u = r(), pJ = Y >= 3 ? (Y >= 5 ? 0.08 : 0.03) : 0, pL = small ? 0 : Y >= 3 ? (Y >= 5 ? 0.04 : 0.015) : 0; // conservative estimates
  if (u < pJ) { start = Y >= 4 && r() < 0.5 ? 2 : 1; const jc = { team: pick(JUCO), lg: 'JUCO' }; for (let i = 0; i < start; i++) out[i] = { ...jc }; }
  else if (u < pJ + pL) { start = Math.min(Y - 1, 1 + Math.floor(r() * 3)); const sc = smallSchool(); for (let i = 0; i < start; i++) out[i] = { ...sc }; }
  // A transfer before his last school (a D1 player moving up or down; a small-college player between small colleges).
  const rest = Y - start, pT = small ? 0.15 : Y >= 5 ? 0.45 : Y >= 3 ? 0.25 : Y === 2 ? 0.08 : 0; let moved = -1;
  if (rest >= 2 && r() < pT) {
    const atLast = rest >= 4 ? 1 + Math.floor(r() * 2) : 1, top = COLLEGES.includes(fin.team) || MORE_COLLEGES.includes(fin.team);
    let prev: Stint; do { prev = small ? smallSchool() : top ? (r() < 0.7 ? { team: pick(r() < 0.6 ? MID_MAJORS : LOW_MAJORS), lg: 'NCAA' } : { team: pick(r() < 0.5 ? COLLEGES : MORE_COLLEGES), lg: 'NCAA' }) : (r() < 0.4 ? { team: pick(r() < 0.5 ? COLLEGES : MORE_COLLEGES), lg: 'NCAA' } : { team: pick(r() < 0.6 ? MID_MAJORS : LOW_MAJORS), lg: 'NCAA' }); } while (prev.team === fin.team);
    for (let i = start; i < Y - atLast; i++) out[i] = { ...prev };
    moved = Y - atLast;
  }
  // Seasons he couldn't play: past four (five for some, the extra year) a redshirt, a medical redshirt or sitting out a transfer.
  const maxPlay = r() < 0.35 ? 5 : 4, free = (i: number) => i < Y - 1 && !out[i].kind && out[i].lg !== 'JUCO'; // (never his last season: that's the one he declared off)
  for (let extra = Y - maxPlay; extra > 0; extra--) {
    const x = r(), first = out.findIndex((s, i) => free(i) && i >= start);
    if (x < 0.2 && moved >= 0 && free(moved)) out[moved].kind = 'sitout';
    else if (x < 0.6 && first >= 0) out[first].kind = 'redshirt';
    else { const opts = out.map((_, i) => i).filter(free); if (opts.length) out[pick(opts)].kind = 'medical'; }
  }
  if (r() < 0.06) { const opts = out.map((_, i) => i).filter(i => !out[i].kind); if (opts.length) out[pick(opts)].kind = 'short'; }
  return out;
}

// A whole class's lines with their advanced stats (memoized per class, season and edit counter).
const MEMO = new WeakMap<object, { key: string; v: Record<number, (AmLine & { adv: StatLine })[]> }>();
export function classStats(g: Game, cls: number, ids: number[], gv = 0): Record<number, (AmLine & { adv: StatLine })[]> {
  const key = cls + '|' + g.Y + '|' + gv + '|' + ids.length;
  const memo = MEMO.get(g.db); if (memo?.key === key) return memo.v;
  const P = g.db.P, bySeason: Record<number, { p: any; line: AmLine }[]> = {};
  ids.forEach(id => { const p = P[id]; amateurSeasons(g, p).forEach(({ season, back, st }) => (bySeason[season] = bySeason[season] || []).push({ p, line: seasonLine(p, season, back, st) })); });
  const out: Record<number, (AmLine & { adv: StatLine })[]> = {};
  Object.keys(bySeason).forEach(y => {
    const list = bySeason[+y], adv = amateurAdvanced(g, list.filter(x => x.line.gp > 0).map(x => ({ p: x.p, t: x.line.t, tq: x.line.tq }))); // (a season he didn't play has no advanced stats)
    list.forEach(({ p, line }) => (out[p.id] = out[p.id] || []).push({ ...line, adv: adv[p.id] || {} }));
  });
  Object.values(out).forEach(a => a.sort((x, y) => x.season - y.season));
  MEMO.set(g.db, { key, v: out });
  return out;
}

// Hall of Fame. A player becomes eligible three seasons after he retires and is inducted
// when his career score reaches the bar (and he played at least five seasons); everything counted is listed on the Hall of Fame
// screen. At most five are inducted a year (the best first); the rest wait.
import type { Game } from './Game';

export const HOF_BAR = 55, FIRST_BALLOT = 75, WAIT = 3, CLASS_MAX = 5, MIN_SEASONS = 5;

export function careerOf(g: Game, s: any, p: any) {
  const rs = (p.stats || []).filter(r => !r.po), t: any = { gp: 0, min: 0, pts: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0 };
  rs.forEach(r => Object.keys(t).forEach(k => (t[k] += r[k] || 0)));
  const seasons = new Set(rs.map(r => r.season)).size;
  let peakPer = 0;
  [...new Set(rs.map(r => r.season))].forEach((y: any) => { const x = g.seasonTotals(p, y); if (x && x.gp >= 40) peakPer = Math.max(peakPer, g.perOf(x, y)); });
  const A = { MVP: 0, FMVP: 0, DPOY: 0, ROY: 0, SMOY: 0, MIP: 0, ALL1: 0, ALL2: 0, ALL3: 0, DEF1: 0, DEF2: 0 };
  Object.values(s.awards || {}).forEach((a: any) => {
    const won = (k: string, classic: string) => (a.list?.[k]?.[0]?.pid ?? a[classic]?.[0]?.pid) === p.id;
    if (won('MVP', 'mvp')) A.MVP++; if (won('DPOY', 'dpoy')) A.DPOY++; if (won('ROY', 'roy')) A.ROY++; if (won('SMOY', 'smoy')) A.SMOY++; if (won('MIP', 'mip')) A.MIP++;
    if (a.fmvp?.pid === p.id) A.FMVP++;
    (a.allLeague || []).forEach((tm, i) => { if (tm.includes(p.id)) A[['ALL1', 'ALL2', 'ALL3'][i]]++; });
    (a.allDef || []).forEach((tm, i) => { if (tm.includes(p.id)) A[['DEF1', 'DEF2'][i]]++; });
  });
  const titles = (s.history || []).filter(h => (p.stats || []).some(r => r.po && r.season === h.year && r.tid === h.champ)).length;
  const L = p.legacy;
  if (L) { const gp = L.seasons * 70; Object.assign(t, { gp, pts: L.pts * gp, orb: L.reb * gp * 0.25, drb: L.reb * gp * 0.75, ast: L.ast * gp, stl: gp * 0.9, blk: gp * 0.5 }); }
  return { t, seasons: L ? L.seasons : seasons, peakPer, A, titles, allStar: L?.allStar || 0, tids: [...new Set<number>(rs.map(r => r.tid))] };
}

export function hofScore(g: Game, s: any, p: any) {
  const c = careerOf(g, s, p), t = c.t, A = c.A;
  const parts: [string, number][] = [
    ['Points', (t.pts / 1000) * 2], ['Rebounds', ((t.orb + t.drb) / 1000) * 1.2], ['Assists', (t.ast / 1000) * 1.6], ['Steals & blocks', (t.stl + t.blk) / 250],
    ['MVPs', A.MVP * 20], ['Finals MVPs', A.FMVP * 10], ['Defensive POY', A.DPOY * 8], ['ROY, 6MOY, MIP', A.ROY * 2 + A.SMOY * 2 + A.MIP],
    ['All-League teams', A.ALL1 * 7 + A.ALL2 * 4 + A.ALL3 * 2.5], ['All-Defensive teams', A.DEF1 * 2.5 + A.DEF2 * 1.2], ['Championships', c.titles * 3],
    ['Peak level (PER over 18)', Math.min(10, Math.max(0, c.peakPer - 18) * 0.6)], ['Longevity', c.seasons * 0.5], ['All-Star selections (pre-league)', c.allStar * 5],
  ];
  const score = parts.reduce((a, x) => a + x[1], 0);
  return { score, parts: parts.filter(x => x[1] > 0.05), c };
}

export function careerLine(c: ReturnType<typeof careerOf>) {
  const t = c.t, gp = Math.max(1, t.gp), f = (v: number) => v.toFixed(1);
  return c.seasons + ' seasons · ' + f(t.pts / gp) + ' pts · ' + f((t.orb + t.drb) / gp) + ' reb · ' + f(t.ast / gp) + ' ast · ' + Math.round(t.pts).toLocaleString() + ' points';
}

export function honorsLine(c: ReturnType<typeof careerOf>) {
  const A = c.A, out: string[] = [], n = (k: number, one: string, many?: string) => k > 0 && out.push(k + '× ' + (k > 1 && many ? many : one));
  n(A.MVP, 'MVP'); n(A.FMVP, 'Finals MVP'); n(c.titles, 'champion'); n(A.DPOY, 'DPOY'); n(A.ALL1 + A.ALL2 + A.ALL3, 'All-League'); n(A.DEF1 + A.DEF2, 'All-Defensive'); n(A.ROY, 'ROY'); n(c.allStar, 'All-Star');
  return out.join(' · ');
}

// Vote in a class at the end of a season. Returns the inductees (added to s.hof by the caller).
export function voteHof(g: Game, s: any) {
  const P = g.db.P, Y = g.Y, inHof = new Set((s.hof || []).map(h => h.pid));
  const elig = (Object.values(P) as any[]).filter(p => p.retired && !inHof.has(p.id) && p.retired.season + WAIT <= Y);
  const scored = elig.map(p => ({ p, ...hofScore(g, s, p) })).filter(x => x.score >= HOF_BAR && x.c.seasons >= MIN_SEASONS).sort((a, b) => b.score - a.score).slice(0, CLASS_MAX);
  return scored.map(x => ({ pid: x.p.id, year: Y, score: +x.score.toFixed(1), firstBallot: x.p.retired.season + WAIT === Y && x.score >= FIRST_BALLOT, line: careerLine(x.c), honors: honorsLine(x.c), tids: x.c.tids, legacy: !!x.p.legacy }));
}

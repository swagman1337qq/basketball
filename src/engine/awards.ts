// Season awards, voted at the end of the regular season (Finals MVP after the Finals).
// Eligibility follows the league's games-played rule: 58 of 82 games (70%) for the
// individual awards and All-League teams.
import type { Game } from './Game';

export interface AwardEntry { pid: number; tid: number; line: string; score: number }
export interface SeasonAwards {
  season: number;
  mvp: AwardEntry[]; dpoy: AwardEntry[]; roy: AwardEntry[]; smoy: AwardEntry[]; mip: AwardEntry[];
  coy: { tid: number; name: string; line: string }[];
  allLeague: number[][]; allDef: number[][]; allRookie: number[];
  fmvp?: AwardEntry | null;
}

const MIN_GP = 58;
const f1 = (v: number) => v.toFixed(1);

export function computeAwards(g: Game, s: any): SeasonAwards {
  const P = g.db.P, Y = g.Y, T = s.teams;
  const tidOf: Record<number, number> = {};
  Object.keys(s.rosters).forEach(k => s.rosters[k].forEach(id => (tidOf[id] = +k)));
  const wp = tid => g.pct(T[tid]);
  const rows = (Object.values(P) as any[]).map(p => ({ p, t: g.seasonTotals(p, Y), prev: g.seasonTotals(p, Y - 1) })).filter(x => x.t && x.t.gp > 0);
  const tid = (x: any) => tidOf[x.p.id] ?? (x.p.stats || []).filter(r => r.season === Y && !r.po).slice(-1)[0]?.tid ?? -1;
  const pg = (t, k) => t[k] / t.gp;
  const line = t => f1(pg(t, 'pts')) + ' pts · ' + f1((t.orb + t.drb) / t.gp) + ' reb · ' + f1(pg(t, 'ast')) + ' ast';
  const dline = t => f1(pg(t, 'stl')) + ' stl · ' + f1(pg(t, 'blk')) + ' blk · ' + f1(t.drb / t.gp) + ' dreb';
  const eff = t => g.eff(t) / t.gp;
  // Team defensive rating (points allowed per 100 possessions) for the defense award.
  const drtg = tid2 => { const ts = s.tstats?.[tid2]; return ts && ts.gp ? (100 * ts.oPts) / Math.max(1, g.possOf(ts)) : 114.5; };
  const lgDrtg = T.reduce((a, t) => a + drtg(t.tid), 0) / T.length;

  const elig = rows.filter(x => x.t.gp >= MIN_GP);
  const mvpScore = x => eff(x.t) * Math.pow(Math.min(1, pg(x.t, 'min') / 34), 0.3) + 18 * wp(tid(x)) + 0.25 * g.perOf(x.t, Y);
  const dpScore = x => (x.t.stl * 1.8 + x.t.blk * 1.6 + x.t.drb * 0.3) / x.t.gp + (x.p.r.diq - 50) * 0.08 + (lgDrtg - drtg(tid(x))) * 0.15 + Math.min(1, pg(x.t, 'min') / 30) * 2;
  const rookie = x => x.p.draft === Y - 1 && !(x.p.stats || []).some(r => r.season < Y);
  const top = (xs, score, n, lineF = line) => xs.map(x => ({ x, v: score(x) })).sort((a, b) => b.v - a.v).slice(0, n).map(({ x, v }) => ({ pid: x.p.id, tid: tid(x), line: lineF(x.t), score: +v.toFixed(2) }));

  const mvp = top(elig, mvpScore, 5);
  const dpoy = top(elig, dpScore, 5, dline);
  const roy = top(rows.filter(x => rookie(x) && x.t.gp >= 40), x => mvpScore(x) - 18 * wp(tid(x)), 5);
  const smoy = top(elig.filter(x => x.t.gs / x.t.gp < 0.4), x => pg(x.t, 'pts') + 0.5 * eff(x.t), 5);
  const mip = top(elig.filter(x => x.prev && x.prev.gp >= 20 && !rookie(x)), x => eff(x.t) - g.eff(x.prev) / x.prev.gp, 5, t => line(t));

  // Coach of the Year: most wins above what the roster's strength projected.
  const avgStr = T.reduce((a, t) => a + (t.str || 50), 0) / T.length;
  const coy = T.map(t => ({ t, v: wp(t.tid) - Math.max(0.15, Math.min(0.85, 0.5 + ((t.str || 50) - avgStr) * 0.035)) }))
    .sort((a, b) => b.v - a.v).slice(0, 3)
    .map(({ t, v }) => ({ tid: t.tid, name: g.isUser(s, t.tid) ? 'You (GM & head coach)' : t.gm, line: t.w + '–' + t.l + ' · ' + (v >= 0 ? '+' : '') + Math.round(v * 82) + ' wins over projection' }));

  // All-League and All-Defensive teams: two guards, two wings, one big each.
  const teamsOf = (ranked: any[], nTeams: number) => {
    const used = new Set<number>(), out: number[][] = [];
    for (let k = 0; k < nTeams; k++) {
      const team: number[] = [];
      for (const [grp, n] of [['G', 2], ['W', 2], ['B', 1]] as [string, number][]) {
        ranked.filter(x => x.p.grp === grp && !used.has(x.p.id)).slice(0, n).forEach(x => { team.push(x.p.id); used.add(x.p.id); });
      }
      ranked.filter(x => !used.has(x.p.id)).slice(0, 5 - team.length).forEach(x => { team.push(x.p.id); used.add(x.p.id); });
      out.push(team);
    }
    return out;
  };
  const byMvp = elig.slice().sort((a, b) => mvpScore(b) - mvpScore(a)), byDp = elig.slice().sort((a, b) => dpScore(b) - dpScore(a));
  const allRookie = rows.filter(x => rookie(x) && x.t.gp >= 30).sort((a, b) => mvpScore(b) - mvpScore(a)).slice(0, 5).map(x => x.p.id);
  return { season: Y, mvp, dpoy, roy, smoy, mip, coy, allLeague: teamsOf(byMvp, 3), allDef: teamsOf(byDp, 2), allRookie, fmvp: null };
}

// Finals MVP: best Finals performer on the champion.
export function finalsMvp(g: Game, finals: Record<number, any>, champ: number, s: any): AwardEntry | null {
  const ids = Object.keys(finals).map(Number).filter(id => s.rosters[champ]?.includes(id));
  if (!ids.length) return null;
  const best = ids.sort((a, b) => g.eff(finals[b]) - g.eff(finals[a]))[0], t = finals[best];
  return { pid: best, tid: champ, line: f1(t.pts / t.gp) + ' pts · ' + f1((t.orb + t.drb) / t.gp) + ' reb · ' + f1(t.ast / t.gp) + ' ast in the Finals', score: g.eff(t) / t.gp };
}

// Every award a player has won, for his profile.
export function awardsOf(s: any, pid: number) {
  const out: { season: number; label: string }[] = [];
  const LB: Record<string, string> = { mvp: 'MVP', dpoy: 'Defensive Player of the Year', roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player' };
  Object.values(s.awards || {}).forEach((a: any) => {
    Object.keys(LB).forEach(k => { if (a[k]?.[0]?.pid === pid) out.push({ season: a.season, label: LB[k] }); });
    if (a.fmvp?.pid === pid) out.push({ season: a.season, label: 'Finals MVP' });
    a.allLeague?.forEach((t, i) => { if (t.includes(pid)) out.push({ season: a.season, label: ['First', 'Second', 'Third'][i] + ' Team All-League' }); });
    a.allDef?.forEach((t, i) => { if (t.includes(pid)) out.push({ season: a.season, label: ['First', 'Second'][i] + ' Team All-Defensive' }); });
    if (a.allRookie?.includes(pid)) out.push({ season: a.season, label: 'All-Rookie Team' });
  });
  return out.sort((a, b) => b.season - a.season);
}

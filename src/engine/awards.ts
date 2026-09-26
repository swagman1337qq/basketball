// Season awards from formulas (Basketball GM custom-award format; defaults in
// data/awardDefs.ts, editable in Settings). Regular-season awards are voted when the
// regular season ends; series MVPs (Finals, conference finals) when those series end.
// Coach of the Year stays a front-office award: wins above the roster's projection.
import type { Game } from './Game';
import { DEFAULT_AWARDS, type AwardDef } from '../data/awardDefs';
import { seasonAdvanced, seriesLine, type StatLine } from './advanced';
import { compileFormula } from './formula';

export interface AwardEntry { pid: number; tid: number; line: string; score: number; pts?: number; first?: number; share?: number }

// The media vote: 100 voters rank the top candidates (MVP 10-7-5-3-1, other awards 5-3-1, as
// in the NBA). Each voter sees the formula score with his own noise, so blowouts come out
// unanimous and close races split. Deterministic per season and award.
export const VOTERS = 100;
export const POINTS: Record<string, number[]> = { MVP: [10, 7, 5, 3, 1] };
export function runVote<T extends { score: number }>(cands: T[], key: string, season: number, pts = POINTS[key] || [5, 3, 1]): (T & { pts: number; first: number; share: number })[] {
  if (!cands.length) return [];
  let a = 0; for (const ch of key + season) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const sc = cands.map(c => c.score), spread = Math.max(1e-6, sc[0] - sc[Math.min(sc.length - 1, 5)]), sd = spread / 4 + Math.abs(sc[0]) * 0.01;
  const tally = cands.map(c => ({ ...c, pts: 0, first: 0, share: 0 }));
  for (let v = 0; v < VOTERS; v++) {
    const order = tally.map((c, i) => ({ i, x: c.score + gauss() * sd })).sort((p, q) => q.x - p.x);
    order.slice(0, pts.length).forEach((o, r) => { tally[o.i].pts += pts[r]; if (r === 0) tally[o.i].first++; });
  }
  tally.forEach(c => (c.share = +(c.pts / (VOTERS * pts[0])).toFixed(3)));
  return tally.filter(c => c.pts > 0).sort((p, q) => q.pts - p.pts || q.score - p.score);
}
export interface SeasonAwards {
  season: number;
  mvp: AwardEntry[]; dpoy: AwardEntry[]; roy: AwardEntry[]; smoy: AwardEntry[]; mip: AwardEntry[];
  coy: { tid: number; name: string; line: string; pts?: number; first?: number; share?: number }[];
  allLeague: number[][]; allDef: number[][]; allRookie: number[];
  fmvp?: AwardEntry | null;
  // Formula era: every single-winner award by short name, multi-team awards, and the definitions used.
  list?: Record<string, AwardEntry[]>; teams?: Record<string, number[][]>; sfmvp?: Record<string, AwardEntry | null>; defs?: { shortName: string; name: string; showStats?: string; numTeams?: number; statRange?: number }[];
}

// Where the classic keys come from (so incentives, history and old saves keep working).
const CLASSIC: Record<string, string> = { MVP: 'mvp', DPOY: 'dpoy', ROY: 'roy', SMOY: 'smoy', MIP: 'mip' };
const TEAM_KEY: Record<string, string> = { ALL: 'allLeague', DEF: 'allDef', ALR: 'allRookie' };
const INELIGIBLE = -1000;
const f1 = (v: number) => (isFinite(v) ? v.toFixed(1) : '—');

export function awardDefs(s: any): AwardDef[] { return s.awardDefs && s.awardDefs.length ? s.awardDefs : DEFAULT_AWARDS; }

export function statLine(x: StatLine, kind?: string) {
  return kind === 'defense'
    ? f1(x.stl) + ' stl · ' + f1(x.blk) + ' blk · ' + f1(x.drb) + ' dreb · DRtg ' + f1(x.drtg) + ' · DWS ' + f1(x.dws)
    : f1(x.pts) + ' pts · ' + f1(x.trb) + ' reb · ' + f1(x.ast) + ' ast · PER ' + f1(x.per) + ' · WS ' + f1(x.ws);
}

// numWon.X and numWonConsecutive.X for a player, from earlier seasons' awards.
function wonVars(s: any, season: number, pid: number, defs: AwardDef[]) {
  const v: Record<string, number> = {}, past = Object.values(s.awards || {}).filter((a: any) => a.season < season).sort((a: any, b: any) => b.season - a.season) as any[];
  const winner = (a: any, sn: string) => a.list?.[sn]?.[0]?.pid ?? (CLASSIC[sn] ? a[CLASSIC[sn]]?.[0]?.pid : sn === 'FMVP' ? a.fmvp?.pid : undefined);
  defs.forEach(d => {
    const sn = d.shortName; let n = 0, c = 0, run = true, y = season - 1;
    past.forEach(a => { const w = winner(a, sn) === pid; if (w) n++; if (run && a.season === y && w) { c++; y--; } else if (a.season <= y) run = false; });
    v['numWon.' + sn] = n; v['numWonConsecutive.' + sn] = c;
  });
  return v;
}

export function computeAwards(g: Game, s: any): SeasonAwards {
  const P = g.db.P, Y = g.Y, T = s.teams, defs = awardDefs(s);
  const adv = seasonAdvanced(g, s, Y).byPid, prevAdv = seasonAdvanced(g, s, Y - 1).byPid;
  const rookie = (p: any) => p.draft === Y - 1 && !(p.stats || []).some(r => r.season < Y && !r.po);
  const cands = Object.keys(adv).map(Number);
  const list: Record<string, AwardEntry[]> = {}, teams: Record<string, number[][]> = {};
  const out: SeasonAwards = { season: Y, mvp: [], dpoy: [], roy: [], smoy: [], mip: [], coy: [], allLeague: [], allDef: [], allRookie: [], fmvp: null, list, teams, sfmvp: {}, defs: defs.map(d => ({ shortName: d.shortName, name: d.name, showStats: d.showStats, numTeams: d.numTeams, statRange: d.statRange })) };

  defs.filter(d => !d.statRange).forEach(d => {
    let fn; try { fn = compileFormula(d.formula); } catch { return; }
    const scored = cands.map(pid => {
      const p = P[pid], x = adv[pid];
      if (d.rookie && !rookie(p)) return null;
      if (d.bench && x.gs * 2 > x.gp) return null;
      let vars: Record<string, number> = { ...x };
      if (d.mip) {
        const pr = prevAdv[pid]; if (!pr || pr.gp < 20 || rookie(p)) return null;
        // Most Improved: this season's stats minus last season's (games, minutes and team context stay current).
        Object.keys(x).forEach(k => { if (!['gp', 'gs', 'min', 'minTot', 'seasonFraction', 'winp', 'teamWs', 'tid', 'age', 'won'].includes(k) && typeof pr[k] === 'number') vars[k] = x[k] - pr[k]; });
      }
      vars = { ...vars, ...wonVars(s, Y, pid, defs) };
      const v = fn.run(vars);
      return v <= INELIGIBLE ? null : { pid, v, x, tid: x.tid };
    }).filter(Boolean).sort((a, b) => b.v - a.v);
    const lineOf = (e: any) => d.mip && prevAdv[e.pid] ? statLine(e.x, d.showStats) + ' · ' + (e.x.pts - prevAdv[e.pid].pts >= 0 ? '+' : '') + f1(e.x.pts - prevAdv[e.pid].pts) + ' pts vs last year' : statLine(e.x, d.showStats);
    if (d.numTeams) {
      const tms = teamsOf(scored, d.numTeams, P, d.shortName !== 'ALR');
      teams[d.shortName] = tms;
      if (TEAM_KEY[d.shortName] === 'allRookie') out.allRookie = tms.flat(); else if (TEAM_KEY[d.shortName]) out[TEAM_KEY[d.shortName]] = tms;
      return;
    }
    list[d.shortName] = runVote(scored.slice(0, 12).map(e => ({ pid: e.pid, tid: e.tid, line: lineOf(e), score: +e.v.toFixed(2) })), d.shortName, Y);
    const ck = CLASSIC[d.shortName] || (d.actAs && CLASSIC[d.actAs.toUpperCase()]);
    if (ck) out[ck] = list[d.shortName];
  });

  // Coach of the Year: most wins above what the roster's strength projected.
  const avgStr = T.reduce((a, t) => a + (t.str || 50), 0) / T.length;
  out.coy = runVote<any>(T.map(t => ({ t, score: g.pct(t) - Math.max(0.15, Math.min(0.85, 0.5 + ((t.str || 50) - avgStr) * 0.035)) }))
    .sort((a, b) => b.score - a.score).slice(0, 10), 'COY', Y)
    .map(({ t, score: v, pts, first, share }) => ({ tid: t.tid, name: g.isUser(s, t.tid) ? 'You (GM & head coach)' : t.gm, line: t.w + '–' + t.l + ' · ' + (v >= 0 ? '+' : '') + Math.round(v * 82) + ' wins over projection', pts, first, share }));
  return out;
}

// All-League style teams: two guards, two forwards, one center each (positional), or the top five.
function teamsOf(ranked: any[], nTeams: number, P: any, positional: boolean) {
  const used = new Set<number>(), out: number[][] = [];
  for (let k = 0; k < nTeams; k++) {
    const team: number[] = [];
    if (positional) for (const [grp, n] of [['G', 2], ['W', 2], ['B', 1]] as [string, number][]) ranked.filter(x => P[x.pid].grp === grp && !used.has(x.pid)).slice(0, n).forEach(x => { team.push(x.pid); used.add(x.pid); });
    ranked.filter(x => !used.has(x.pid)).slice(0, 5 - team.length).forEach(x => { team.push(x.pid); used.add(x.pid); });
    out.push(team);
  }
  return out;
}

// Series MVP (Finals: statRange -1; conference finals: -2) from series totals.
export function seriesMvp(g: Game, s: any, def: AwardDef, box: Record<number, any>, series: { a: number; b: number; winner: number }): AwardEntry | null {
  let fn; try { fn = compileFormula(def.formula); } catch { return null; }
  const inTeam = (id: number, t: number) => (s.rosters[t] || []).includes(id);
  const best = Object.keys(box).map(Number).filter(id => inTeam(id, series.a) || inTeam(id, series.b)).map(id => {
    const x = seriesLine(box[id]), tid = inTeam(id, series.a) ? series.a : series.b;
    const v = fn.run({ ...x, won: tid === series.winner ? 1 : 0, ...wonVars(s, g.Y, id, awardDefs(s)) });
    return { pid: id, tid, v, x };
  }).sort((a, b) => b.v - a.v)[0];
  if (!best) return null;
  return { pid: best.pid, tid: best.tid, line: f1(best.x.pts) + ' pts · ' + f1(best.x.trb) + ' reb · ' + f1(best.x.ast) + ' ast · Game Score ' + f1(best.x.gmsc), score: +best.v.toFixed(2) };
}

// Every award a player has won, for his profile.
export function awardsOf(s: any, pid: number) {
  const out: { season: number; label: string }[] = [];
  const LB: Record<string, string> = { mvp: 'MVP', dpoy: 'Defensive Player of the Year', roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player' };
  Object.values(s.awards || {}).forEach((a: any) => {
    if (a.list) (a.defs || []).forEach(d => { if (!d.numTeams && !d.statRange && a.list[d.shortName]?.[0]?.pid === pid) out.push({ season: a.season, label: d.name }); });
    else Object.keys(LB).forEach(k => { if (a[k]?.[0]?.pid === pid) out.push({ season: a.season, label: LB[k] }); });
    if (a.fmvp?.pid === pid) out.push({ season: a.season, label: 'Finals MVP' });
    Object.entries(a.sfmvp || {}).forEach(([c, e]: any) => { if (e?.pid === pid) out.push({ season: a.season, label: c + ' Finals MVP' }); });
    a.allLeague?.forEach((t, i) => { if (t.includes(pid)) out.push({ season: a.season, label: ['First', 'Second', 'Third'][i] + ' Team All-League' }); });
    a.allDef?.forEach((t, i) => { if (t.includes(pid)) out.push({ season: a.season, label: ['First', 'Second'][i] + ' Team All-Defensive' }); });
    if (a.allRookie?.includes(pid)) out.push({ season: a.season, label: 'All-Rookie Team' });
  });
  return out.sort((a, b) => b.season - a.season);
}

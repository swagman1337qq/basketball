// Advanced stats for a season, in Basketball-Reference style, from season totals and
// team totals: shooting and rate stats (TS%, eFG%, USG%, AST%, ORB/DRB/TRB%, STL%, BLK%,
// TOV%), individual offensive/defensive ratings, win shares (OWS/DWS/WS/WS48), box
// plus-minus (OBPM/DBPM/BPM, team-adjusted), VORP, PER, EWA, on/off per 100, and estimates of EPM,
// LEBRON and DARKO (offense, defense and total).
// Award formulas read these by name; per-game stats (pts, trb, ast, …) are averages.
import type { Game } from './Game';
import { BASE } from './sim';

export type StatLine = Record<string, number>;
const TEAM_FIELDS = ['gp', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'oPts', 'oFgm', 'oFga', 'oTpm', 'oTpa', 'oFtm', 'oFta', 'oOrb', 'oDrb', 'oTov'];

// A league-average team season (used when a past season's team totals weren't kept).
function avgTeam(gp = 82): StatLine {
  const fga = 89.1, tpa = BASE.tpa, fta = 23.5, fgm = fga * BASE.fg, tpm = tpa * BASE.tp, ftm = fta * BASE.ft;
  const t: StatLine = { gp, pts: BASE.pts, fgm, fga, tpm, tpa, ftm, fta, orb: BASE.orb, drb: BASE.drb, ast: BASE.ast, stl: BASE.stl, blk: BASE.blk, tov: BASE.tov, pf: 19.5 };
  Object.keys(t).forEach(k => { if (k !== 'gp') t[k] *= gp; });
  ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'tov'].forEach(k => (t['o' + k[0].toUpperCase() + k.slice(1)] = t[k]));
  return t;
}

export interface SeasonAdvanced { byPid: Record<number, StatLine>; teams: Record<number, StatLine> }

// po: playoff advanced stats. Team playoff totals aren't kept, so each team's context is its regular
// season scaled to the playoff games it played (its rates hold; its volume matches the playoffs).
export function seasonAdvanced(g: Game, s: any, season: number, po = false): SeasonAdvanced {
  const P = g.db.P, cur = season === g.Y;
  const tsrc: Record<number, StatLine> = cur ? s.tstats || {} : (s.tstatsHist || {})[season] || {};
  const teams: Record<number, StatLine> = {};
  s.teams.forEach(t => { const x = tsrc[t.tid]; teams[t.tid] = x && x.gp ? { ...x } : avgTeam(); });
  if (po) {
    const poGp: Record<number, number> = {};
    g.playersIn(season).forEach(p => (p.stats || []).forEach((r: any) => { if (r.season === season && r.po) poGp[r.tid] = Math.max(poGp[r.tid] || 0, r.gp); }));
    Object.keys(teams).forEach(k => { const t = teams[+k], n = poGp[+k] || 0, f = t.gp ? n / t.gp : 0; Object.keys(t).forEach(f2 => { if (f2 !== 'gp') t[f2] *= f; }); t.gp = n; if (!n) Object.assign(t, avgTeam(1)); });
  }
  // Team records for win%.
  const recOf = (tid: number) => { if (cur) { const t = s.teams[tid]; return t.w + t.l ? t.w / (t.w + t.l) : 0.5; } const h = ((s.teamHist || {})[tid] || []).find(x => x.season === season); return h ? h.w / Math.max(1, h.w + h.l) : 0.5; };

  // Player season totals (regular season), attributed to the team he played most minutes for.
  const rows: { p: any; t: StatLine; tid: number }[] = [];
  g.playersIn(season).forEach(p => {
    const rs = (p.stats || []).filter(r => r.season === season && !!r.po === po); if (!rs.length) return;
    const t: StatLine = {}; rs.forEach(r => Object.keys(r).forEach(k => { if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + r[k]; }));
    if (!t.gp || !t.min) return;
    const tid = rs.slice().sort((a, b) => b.min - a.min)[0].tid;
    rows.push({ p, t, tid });
  });
  const wins = cur ? s.teams.reduce((a, t) => a + t.w, 0) : s.teams.reduce((a, t) => a + (((s.teamHist || {})[t.tid] || []).find(h => h.season === season)?.w ?? 41), 0);
  return computeAdvanced(g, season, teams, rows, recOf, s.teams.map((t: any) => t.tid), wins, po);
}

type Row = { p: any; t: StatLine; tid: number };
function computeAdvanced(g: Game, season: number, teams: Record<number, StatLine>, rows: Row[], recOf: (tid: number) => number, tids: number[], wins: number, po = true): SeasonAdvanced {
  // League context.
  const lg: StatLine = {}; Object.values(teams).forEach(t => TEAM_FIELDS.forEach(k => (lg[k] = (lg[k] || 0) + (t[k] || 0))));
  const possT = (t: StatLine) => g.possOf(t);
  const lgPoss = possT(lg), lgPPP = lg.pts / lgPoss, lgPPG = lg.pts / lg.gp, lgPace = lgPoss / lg.gp, lgORtg = 100 * lgPPP;
  Object.values(teams).forEach(t => { t.poss = possT(t); t.min = t.gp * 240; t.ortg = (100 * t.pts) / t.poss; t.drtg = (100 * t.oPts) / t.poss; t.pace = t.poss / t.gp; t.orbPct = t.orb / Math.max(1, t.orb + t.oDrb); });


  const out: Record<number, StatLine> = {};
  // Each team's on-floor totals (tracked seasons): the sums of its players' / 5, for on/off with him off the floor.
  rows.forEach(({ t, tid }) => { const T = teams[tid]; if (!T || !(t.onPO > 0)) return; ['onPO', 'onPD', 'onF', 'onA', 'xF', 'xA'].forEach(k => (T[k] = (T[k] || 0) + (t[k] || 0) / 5)); });
  // Pass 1: rate stats, points produced and raw box scores.
  rows.forEach(({ p, t, tid }) => {
    const T = teams[tid] || avgTeam(), m5 = T.min / 5, share = t.min / m5, possOn = T.poss * share;
    const x: StatLine = {};
    const per100 = (v: number) => (possOn ? (v * 100) / possOn : 0);
    x.tsp = t.fga + t.fta ? (100 * t.pts) / (2 * (t.fga + 0.44 * t.fta)) : 0;
    x.efg = t.fga ? (100 * (t.fgm + 0.5 * t.tpm)) / t.fga : 0;
    x.usgp = (100 * (t.fga + 0.44 * t.fta + t.tov) * m5) / (t.min * (T.fga + 0.44 * T.fta + T.tov));
    x.astp = (100 * t.ast) / Math.max(1, share * T.fgm - t.fgm);
    x.orbp = (100 * t.orb * m5) / (t.min * (T.orb + T.oDrb));
    x.drbp = (100 * t.drb * m5) / (t.min * (T.drb + T.oOrb));
    x.trbp = (100 * (t.orb + t.drb) * m5) / (t.min * (T.orb + T.drb + T.oOrb + T.oDrb));
    x.stlp = (100 * t.stl * m5) / (t.min * T.poss);
    x.blkp = (100 * t.blk * m5) / (t.min * Math.max(1, T.oFga - T.oTpa));
    x.tovp = t.fga + t.fta + t.tov ? (100 * t.tov) / (t.fga + 0.44 * t.fta + t.tov) : 0;
    x.ftr = t.fga ? t.fta / t.fga : 0;
    x.tpar = t.fga ? t.tpa / t.fga : 0;
    // Points produced and possessions used (a simplified Dean Oliver method; scaled below).
    const ftp = t.fta ? t.ftm / t.fta : 0;
    const scPoss = t.fgm + (1 - Math.pow(1 - ftp, 2)) * 0.44 * t.fta + 0.3 * t.ast + 0.15 * t.orb;
    x._totPoss = scPoss + (t.fga - t.fgm) * (1 - 1.07 * T.orbPct) + Math.pow(1 - ftp, 2) * 0.44 * t.fta + t.tov;
    x._pprod = t.pts * 0.86 + t.ast * 0.62 * ((T.pts - T.ftm) / Math.max(1, T.fgm)) * 0.5 + t.orb * 0.5;
    // Defensive stops per 100 possessions on the floor.
    x._stops = per100(t.stl + 0.6 * t.blk + 0.3 * t.drb - 0.1 * t.pf);
    // Box plus-minus, raw (per 100 possessions on the floor).
    x._obpm = 0.8 * per100(0.86 * t.pts - 0.56 * t.fga - 0.246 * t.fta + 0.389 * t.tpm + 0.807 * t.ast - 0.964 * t.tov + 0.397 * t.orb);
    x._dbpm = per100(0.25 * t.drb + 1.6 * t.stl + 1.2 * t.blk - 0.3 * t.pf);
    x._share = share; x._possOn = possOn;
    out[p.id] = x;
  });
  // League min-weighted means to centre the raw numbers.
  const wmean = (k: string) => { let a = 0, w = 0; rows.forEach(({ p, t }) => { a += out[p.id][k] * t.min; w += t.min; }); return w ? a / w : 0; };
  const ortgRaw = (x: StatLine) => (x._totPoss ? (100 * x._pprod) / x._totPoss : lgORtg);
  let a0 = 0, w0 = 0; rows.forEach(({ p }) => { const x = out[p.id]; a0 += x._pprod; w0 += x._totPoss; });
  const k = w0 ? lgPPP / (a0 / w0) : 1; // points produced sum to league scoring
  const stopMean = wmean('_stops');
  const boxO = wmean('_obpm'), boxD = wmean('_dbpm'); // raw box per 100, league means (to centre past seasons for DARKO)
  const gAge = (p: any, y: number) => (typeof (g as any).ageIn === 'function' ? (g as any).ageIn(p, y) : p.age);
  // Team BPM adjustments so each team's minute-weighted BPM matches its ratings.
  const adj: Record<number, { o: number; d: number }> = {};
  tids.forEach(tm0 => { const tm = { tid: tm0 }, T = teams[tm.tid]; let o = 0, d = 0, w = 0; rows.forEach(({ p, t, tid }) => { if (tid !== tm.tid) return; o += out[p.id]._obpm * t.min; d += out[p.id]._dbpm * t.min; w += t.min; });
    adj[tm.tid] = { o: (T.ortg - lgORtg) / 5 - (w ? o / w : 0), d: (lgORtg - T.drtg) / 5 - (w ? d / w : 0) }; });

  rows.forEach(({ p, t, tid }) => {
    const x = out[p.id], T = teams[tid] || avgTeam(), gp = t.gp, mppw = 0.32 * lgPPG * (T.pace / lgPace);
    x.ortg = Math.max(40, Math.min(180, ortgRaw(x) * k));
    x.drtg = Math.max(85, Math.min(140, T.drtg - 0.5 * (x._stops - stopMean)));
    const margOff = x._pprod * k - 0.92 * lgPPP * x._totPoss;
    x.ows = margOff / mppw;
    x.dws = ((t.min / T.min) * T.poss * (1.08 * lgPPP - x.drtg / 100)) / mppw;
    x.ws = x.ows + x.dws; x.ws48 = (x.ws * 48) / t.min;
    x.obpm = x._obpm + (adj[tid]?.o ?? 0); x.dbpm = x._dbpm + (adj[tid]?.d ?? 0);
    // Shrink small-sample BPM toward replacement level (-2).
    const rel = Math.min(1, t.min / 500); x.obpm = x.obpm * rel + -1.5 * (1 - rel); x.dbpm = x.dbpm * rel + -0.5 * (1 - rel);
    x.bpm = x.obpm + x.dbpm;
    x.vorp = (x.bpm + 2) * x._share * (T.gp / 82);
    x.per = g.perOf(t, season);
    x.ewa = ((x.per - 11) * t.min / 67) / 30;
    const teamDiff = T.pts - T.oPts, possOff = Math.max(1, T.poss - x._possOn);
    x.pm = t.pm || 0; x.pm100 = x._possOn ? (100 * x.pm) / x._possOn : 0;
    x.onOff100 = x.pm100 - (100 * (teamDiff - x.pm)) / possOff;
    // EPM, LEBRON and DARKO (2026-10-17 rework, docs/ADVANCED_ESTIMATES.md). Kept here: the unshrunk, team-adjusted
    // box score (obpmU/dbpmU), his possessions on the floor, and the box-score luck LEBRON removes. The metrics are
    // finished after this loop: RAPM per team where lineup data exists (current tracked seasons), else on/off.
    x.obpmU = x._obpm + (adj[tid]?.o ?? 0); x.dbpmU = x._dbpm + (adj[tid]?.d ?? 0);
    x.possO = t.onPO > 0 ? t.onPO : x._possOn; x.possD = t.onPD > 0 ? t.onPD : x._possOn;
    // His own shooting luck on offense: actual minus expected points on his shots (tracked seasons), else his
    // threes regressed toward the league's (750 attempts), turned into box-score points.
    const lg3 = lg.tpa ? lg.tpm / lg.tpa : 0.36, exp3 = t.tpa ? (t.tpm + 750 * lg3) / (t.tpa + 750) : lg3;
    x.luckBox = t.xP > 0 ? (0.8 * 0.86 * 100 * (t.pts - t.xP)) / Math.max(1, x.possO) : (2.375 * 100 * (t.tpm - t.tpa * exp3)) / Math.max(1, x.possO);
    // On/off per 100, offense and defense apart where tracked (points for and against while on and off), with
    // expected points for the luck-adjusted version; older seasons split the plus-minus on/off evenly.
    if (t.onPO > 0 && t.onPD > 0 && T.onPO > 0) {
      const offO = Math.max(1, T.onPO - t.onPO), offD = Math.max(1, T.onPD - t.onPD);
      x.ooff = (100 * t.onF) / t.onPO - (100 * (T.onF - t.onF)) / offO; x.doff = (100 * (T.onA - t.onA)) / offD - (100 * t.onA) / t.onPD;
      x.ooffX = (100 * t.xF) / t.onPO - (100 * (T.xF - t.xF)) / offO; x.doffX = (100 * (T.xA - t.xA)) / offD - (100 * t.xA) / t.onPD;
      x.nOff = 1 / (1 / t.onPO + 1 / offO); x.nDef = 1 / (1 / t.onPD + 1 / offD);
    } else { x.ooff = x.doff = x.ooffX = x.doffX = x.onOff100 * 0.5; const offP = Math.max(1, T.poss - x._possOn); x.nOff = x.nDef = x._possOn > 0 ? 1 / (1 / x._possOn + 1 / offP) : 0; }
    // Per-game and totals the formulas use.
    x.gp = gp; x.gs = t.gs || 0; x.min = t.min / gp; x.minTot = t.min;
    ['pts', 'ast', 'stl', 'blk', 'tov', 'pf', 'orb', 'drb', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta'].forEach(f => (x[f] = (t[f] || 0) / gp));
    x.trb = (t.orb + t.drb) / gp;
    x.fgp = t.fga ? (100 * t.fgm) / t.fga : 0; x.tpp = t.tpa ? (100 * t.tpm) / t.tpa : 0; x.ftp = t.fta ? (100 * t.ftm) / t.fta : 0;
    x.winp = recOf(tid); x.won = 0; x.tid = tid; x.age = p.age;
    x.seasonFraction = Math.min(1, (T.gp || 82) / 82);
    Object.keys(x).forEach(f => { if (f.startsWith('_')) delete x[f]; });
  });
  finishImpact(g, season, rows, out, teams, lg, po);
  // Win shares sum to the league's wins (as on Basketball-Reference).
  const wsSum = rows.reduce((a, { p }) => a + out[p.id].ws, 0);
  if (wsSum > 0 && wins > 0) { const f = wins / wsSum; rows.forEach(({ p, t }) => { const x = out[p.id]; x.ows *= f; x.dws *= f; x.ws = x.ows + x.dws; x.ws48 = (x.ws * 48) / t.min; }); }
  // Team win shares, for "share of the team's WS".
  const teamWs: Record<number, number> = {};
  rows.forEach(({ p, tid }) => (teamWs[tid] = (teamWs[tid] || 0) + out[p.id].ws));
  rows.forEach(({ p, tid }) => (out[p.id].teamWs = teamWs[tid] || 0));
  return { byPid: out, teams };
}

// CCP (development league) advanced stats, from players' CCP lines (p.ccpS). Team totals are the
// sum of their players; opponents are taken as a league-average team (CCP box scores keep no
// opponent totals), and records as .500 for win shares.
export function ccpAdvanced(g: Game, s: any, season: number, po = false): SeasonAdvanced {
  const P = g.db.P, key = season + (po ? 'p' : ''), ab: Record<string, number> = {}, rows: Row[] = [];
  (Object.values(P) as any[]).forEach(p => { const t = p.ccpS?.[key]; if (!t || !t.gp || !t.min) return; if (ab[t.team] == null) ab[t.team] = Object.keys(ab).length; rows.push({ p, t: { ...t }, tid: ab[t.team] }); });
  const teams: Record<number, StatLine> = {};
  rows.forEach(({ t, tid }) => { const T = (teams[tid] = teams[tid] || { gp: 0 }); ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'].forEach(k => (T[k] = (T[k] || 0) + (t[k] || 0))); T.gp = Math.max(T.gp, t.gp); });
  const tids = Object.keys(teams).map(Number), n = tids.length || 1, avgPg: StatLine = {};
  ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'tov'].forEach(k => (avgPg[k] = tids.reduce((a, id) => a + teams[id][k] / Math.max(1, teams[id].gp), 0) / n));
  tids.forEach(id => { const T = teams[id]; ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'tov'].forEach(k => (T['o' + k[0].toUpperCase() + k.slice(1)] = avgPg[k] * T.gp)); });
  const wins = tids.reduce((a, id) => a + teams[id].gp / 2, 0);
  return computeAdvanced(g, season, teams, rows, () => 0.5, tids, wins, true);
}

// Draft prospects' college and club seasons (amateurStats.ts): each line in its own average-team context at an NBA
// pace (no team adjustment, no lineup data), the box plus-minus centred on the class (minute-weighted 0), win shares
// per 40 minutes. `season` 1 keeps the league's past seasons out of it (DARKO, the aging curve).
export function amateurAdvanced(g: Game, list: { p: any; t: StatLine }[]): Record<number, StatLine> {
  const teams: Record<number, StatLine> = {}, rows: Row[] = list.map((x, i) => { teams[i] = avgTeam(x.t.gp || 30); return { p: x.p, t: { ...x.t }, tid: i }; });
  if (!rows.length) return {};
  const { byPid } = computeAdvanced(g, 1, teams, rows, () => 0.5, [], 0, true);
  let w = 0, mo = 0, md = 0; rows.forEach(({ p, t }) => { const x = byPid[p.id]; mo += x.obpm * t.min; md += x.dbpm * t.min; w += t.min; });
  mo = w ? mo / w : 0; md = w ? md / w : 0;
  rows.forEach(({ p, t }) => { const x = byPid[p.id]; x.obpm -= mo; x.dbpm -= md; x.bpm = x.obpm + x.dbpm; x.ws40 = (x.ws48 * 40) / 48; void t; ['vorp', 'pm', 'pm100', 'onOff100', 'winp', 'won', 'teamWs'].forEach(f => delete x[f]); }); // no lineups or standings for amateurs
  return byPid;
}

// Playoff series stats (Finals / conference finals) for series-MVP formulas.
export function seriesLine(t: any): StatLine {
  const gp = t.gp || 1;
  const gmsc = t.pts + 0.4 * t.fgm - 0.7 * t.fga - 0.4 * (t.fta - t.ftm) + 0.7 * t.orb + 0.3 * t.drb + t.stl + 0.7 * t.ast + 0.7 * t.blk - 0.4 * t.pf - t.tov;
  const x: StatLine = { gp: t.gp || 0, min: (t.min || 0) / gp, gmsc: gmsc / gp, pm: (t.pm || 0) / gp };
  ['pts', 'ast', 'stl', 'blk', 'tov', 'pf', 'orb', 'drb', 'fgm', 'fga'].forEach(f => (x[f] = (t[f] || 0) / gp));
  x.trb = ((t.orb || 0) + (t.drb || 0)) / gp;
  x.tsp = t.fga + t.fta ? (100 * t.pts) / (2 * (t.fga + 0.44 * t.fta)) : 0;
  return x;
}

// ── EPM, LEBRON and DARKO (finished after the box score) ─────────────────────────────────────────────
// Past seasons are fixed once played, so their results are kept (per league) for DARKO's history. A season's
// results need the seasons before it (which need theirs), so whatever a page asks for stays until the league
// moves on to a new season; then only the last six are kept (a long session used to keep every season it played,
// about 2 MB each).
const PAST = new WeakMap<object, { y: number; m: Map<number, SeasonAdvanced> }>();
function pastSeason(g: Game, y: number): SeasonAdvanced | null {
  if (y >= g.Y || y < (g.db.firstSeason ?? 2027) - 1) return null;
  let c = PAST.get(g.db); if (!c) PAST.set(g.db, (c = { y: g.Y, m: new Map() }));
  if (c.y !== g.Y) { for (const k of c.m.keys()) if (k < g.Y - 6) c.m.delete(k); c.y = g.Y; }
  const m = c.m;
  if (!m.has(y)) { m.set(y, { byPid: {}, teams: {} }); m.set(y, seasonAdvanced(g, g.state, y)); }
  return m.get(y)!;
}
// Solve a small dense system (Gaussian elimination with partial pivoting).
function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-9; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / (r[i] || 1e-9));
}
// Ridge RAPM per team from the season's lineup stints (Game.addStints): (X'X + λI)β = X'y + λ·prior, points per
// possession above the league's, his box score (per possession) as the prior. Offense from points scored with
// him on, defense from points allowed (sign flipped). y = actual points (EPM) or expected points (LEBRON: every
// shot's and free throw's luck removed, both teams). Teammates are adjusted for; opponents count as average.
export const RAPM = { lambda: 10000 }; // ridge strength, in possessions of the box-score prior (picked by the prediction test, docs/ADVANCED_ESTIMATES.md)
function rapm(R: any, prior: (pid: number) => { o: number; d: number; oL: number } | null) {
  let sp = 0, sx = 0, sn = 0; Object.values(R).forEach((T: any) => { for (const k in T.O.yp) { const n = T.O.xx[k + ',' + k] || 0; sp += T.O.yp[k]; sx += T.O.yx[k]; sn += n; } });
  if (sn < 5000) return null;
  const lgP = sp / sn, lgX = sx / sn, acc: Record<number, { w: number; o: number; d: number; oX: number; dX: number }> = {};
  const block = (M: any, def: boolean) => {
    const ids = Object.keys(M.yp).map(Number), m = ids.length; if (!m) return null;
    const A = ids.map(a => ids.map(b => M.xx[Math.min(a, b) + ',' + Math.max(a, b)] || 0)), pr = ids.map(id => prior(id));
    const L = RAPM.lambda, Ar = A.map((r, i) => r.map((v, j) => v + (i === j ? L : 0)));
    const pO = (i: number) => (pr[i] ? (def ? -pr[i]!.d : pr[i]!.o) / 100 : def ? 0.005 : -0.015), pX = (i: number) => (pr[i] ? (def ? -pr[i]!.d : pr[i]!.oL) / 100 : def ? 0.005 : -0.015);
    const bP = ids.map((id, i) => M.yp[id] - lgP * A[i][i] + L * pO(i)), bX = ids.map((id, i) => M.yx[id] - lgX * A[i][i] + L * pX(i));
    return { ids, n: ids.map((_, i) => A[i][i]), P: solve(Ar, bP), X: solve(Ar, bX) };
  };
  Object.values(R).forEach((T: any) => {
    const O = block(T.O, false), D = block(T.D, true);
    O?.ids.forEach((id, i) => { const a = (acc[id] ||= { w: 0, o: 0, d: 0, oX: 0, dX: 0 }); a.o += O.P[i] * 100 * O.n[i]; a.oX += O.X[i] * 100 * O.n[i]; a.w += O.n[i]; });
    D?.ids.forEach((id, i) => { const a = (acc[id] ||= { w: 0, o: 0, d: 0, oX: 0, dX: 0 }); a.d += -D.P[i] * 100 * D.n[i]; a.dX += -D.X[i] * 100 * D.n[i]; (a as any).wd = ((a as any).wd || 0) + D.n[i]; });
  });
  const out: Record<number, { o: number; d: number; oX: number; dX: number }> = {};
  for (const id in acc) { const a: any = acc[id]; if (!a.w || !a.wd) continue; out[+id] = { o: a.o / a.w, oX: a.oX / a.w, d: a.d / a.wd, dX: a.dX / a.wd }; }
  return out;
}
// The expected yearly change in BPM at each age, fitted from this league's own players (1,000+ possessions in two
// straight completed seasons): Δ = a + b·(age − 27). Few pairs (a young league): an NBA-like default.
function agingCurve(g: Game, season: number): (age: number) => number {
  const def = (a: number) => Math.max(-1.5, Math.min(1.5, -0.17 * (a - 26.5)));
  const gAge = (p: any, y: number) => (typeof (g as any).ageIn === 'function' ? (g as any).ageIn(p, y) : p.age);
  const pairs: [number, number][] = [], top = Math.min(season, g.Y - 1);
  for (let y = top; y > top - 4; y--) { const A = pastSeason(g, y - 1), B = pastSeason(g, y); if (!A || !B) continue;
    for (const id in B.byPid) { const b = B.byPid[id], a = A.byPid[id]; if (!a || !(a.possO >= 1000) || !(b.possO >= 1000)) continue; const p = g.db.P[+id]; if (!p) continue;
      pairs.push([gAge(p, y - 1) - 27, b.obpmU + b.dbpmU - a.obpmU - a.dbpmU]); } }
  if (pairs.length < 40) return def;
  const n = pairs.length, mx = pairs.reduce((s, [x]) => s + x, 0) / n, my = pairs.reduce((s, [, y]) => s + y, 0) / n;
  const sxx = pairs.reduce((s, [x]) => s + (x - mx) ** 2, 0), sxy = pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0), b = sxx ? sxy / sxx : 0, a = my - b * mx;
  return (age: number) => Math.max(-2, Math.min(2, a + b * (age - 27)));
}
export const IMPACT_SD = 2.7; // each metric's spread among the season's regulars, refit every season (2026-10-17)
function finishImpact(g: Game, season: number, rows: Row[], out: Record<number, StatLine>, teams: Record<number, StatLine>, lg: StatLine, po: boolean) {
  const gAge = (p: any, y: number) => (typeof (g as any).ageIn === 'function' ? (g as any).ageIn(p, y) : p.age);
  // EPM and LEBRON: RAPM where the season's lineups were tracked (regular season), else the box score blended
  // with on/off; the on/off weight counts how few possessions he had OFF the floor too (n = 1/(1/on + 1/off)).
  const R = !po ? (g.db.rapm || {})[season] : null;
  const RP = R ? rapm(R, id => { const x = out[id]; return x ? { o: x.obpm, d: x.dbpm, oL: x.obpm - x.luckBox * Math.min(1, (x.minTot ?? 0) / 500) } : null; }) : null;
  rows.forEach(({ p }) => { const x = out[p.id], r = RP?.[p.id];
    if (r) { x.oepm = r.o; x.depm = r.d; x.olebron = r.oX; x.dlebron = r.dX; return; }
    const wO = x.nOff / (x.nOff + 6000), wD = x.nDef / (x.nDef + 6000), lO = x.nOff / (x.nOff + 5000), lD = x.nDef / (x.nDef + 5000);
    x.oepm = x.obpm * (1 - wO) + x.ooff * wO; x.depm = x.dbpm * (1 - wD) + x.doff * wD;
    x.olebron = (x.obpm - x.luckBox) * (1 - lO) + x.ooffX * lO; x.dlebron = x.dbpm * (1 - lD) + x.doffX * lD; });
  // DARKO: his current level. This season's unshrunk box score and his last three (each in its own season's
  // pace, league means and team context), older ones weighted less (×0.55 a year), each aged forward to now
  // along the league's own aging curve, regressed toward a slightly-below-average prior worth 1,500 possessions.
  const dA = agingCurve(g, season);
  rows.forEach(({ p }) => { const x = out[p.id], now = gAge(p, season);
    let so = x.obpmU * x.possO, sd = x.dbpmU * x.possD, wo = x.possO, wd = x.possD;
    for (let k = 1; k <= 3; k++) { const y = season - k, r = pastSeason(g, y)?.byPid[p.id]; if (!r || !(r.possO >= 50)) continue;
      const d = 0.55 ** k; let sh = 0; for (let a = gAge(p, y); a < now; a++) sh += dA(a);
      so += (r.obpmU + 0.6 * sh) * r.possO * d; sd += (r.dbpmU + 0.4 * sh) * r.possD * d; wo += r.possO * d; wd += r.possD * d; }
    const K = 1500; x.odarko = (so + K * -0.9) / (wo + K); x.ddarko = (sd + K * -0.6) / (wd + K); });
  // Centre each on the league (minute-weighted 0) and scale it to a spread of IMPACT_SD among the season's regulars
  // (at least a quarter of the most minutes anyone played, 100+), refit every season.
  const maxMin = Math.max(1, ...rows.map(({ t }) => t.min)), reg = rows.filter(({ t }) => t.min >= Math.max(100, 0.25 * maxMin));
  ([['epm', 'oepm', 'depm', 0.6], ['lebron', 'olebron', 'dlebron', 0.55], ['darko', 'odarko', 'ddarko', 0.65]] as [string, string, string, number][]).forEach(([k, ko, kd, sc0]) => {
    let mo = 0, md = 0, w = 0; rows.forEach(({ p, t }) => { const x = out[p.id]; mo += x[ko] * t.min; md += x[kd] * t.min; w += t.min; });
    mo = w ? mo / w : 0; md = w ? md / w : 0;
    const v = reg.map(({ p }) => out[p.id][ko] - mo + out[p.id][kd] - md), mv = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, sdv = v.length ? Math.sqrt(v.reduce((a, b) => a + (b - mv) ** 2, 0) / v.length) : 0;
    const sc = v.length >= 30 && sdv > 0.1 ? IMPACT_SD / sdv : sc0;
    rows.forEach(({ p }) => { const x = out[p.id]; x[ko] = (x[ko] - mo) * sc; x[kd] = (x[kd] - md) * sc; x[k] = x[ko] + x[kd]; });
  });
  rows.forEach(({ p }) => { const x = out[p.id]; ['ooff', 'doff', 'ooffX', 'doffX', 'nOff', 'nDef', 'luckBox'].forEach(f => delete x[f]); });
}

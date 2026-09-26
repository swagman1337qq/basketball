// Advanced stats for a season, in Basketball-Reference style, from season totals and
// team totals: shooting and rate stats (TS%, eFG%, USG%, AST%, ORB/DRB/TRB%, STL%, BLK%,
// TOV%), individual offensive/defensive ratings, win shares (OWS/DWS/WS/WS48), box
// plus-minus (OBPM/DBPM/BPM, team-adjusted), VORP, PER, EWA and on/off per 100.
// Award formulas read these by name; per-game stats (pts, trb, ast, …) are averages.
import type { Game } from './Game';
import { BASE } from './sim';

export type StatLine = Record<string, number>;
const TEAM_FIELDS = ['gp', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'oPts', 'oFgm', 'oFga', 'oTpm', 'oTpa', 'oFtm', 'oFta', 'oOrb', 'oDrb', 'oTov'];

// A league-average team season (used when a past season's team totals weren't kept).
function avgTeam(gp = 82): StatLine {
  const fga = 89.3, tpa = BASE.tpa, fta = 21.6, fgm = fga * BASE.fg, tpm = tpa * BASE.tp, ftm = fta * BASE.ft;
  const t: StatLine = { gp, pts: BASE.pts, fgm, fga, tpm, tpa, ftm, fta, orb: BASE.orb, drb: BASE.drb, ast: BASE.ast, stl: BASE.stl, blk: BASE.blk, tov: BASE.tov, pf: 19.5 };
  Object.keys(t).forEach(k => { if (k !== 'gp') t[k] *= gp; });
  ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'tov'].forEach(k => (t['o' + k[0].toUpperCase() + k.slice(1)] = t[k]));
  return t;
}

export interface SeasonAdvanced { byPid: Record<number, StatLine>; teams: Record<number, StatLine> }

export function seasonAdvanced(g: Game, s: any, season: number): SeasonAdvanced {
  const P = g.db.P, cur = season === g.Y;
  const tsrc: Record<number, StatLine> = cur ? s.tstats || {} : (s.tstatsHist || {})[season] || {};
  const teams: Record<number, StatLine> = {};
  s.teams.forEach(t => { const x = tsrc[t.tid]; teams[t.tid] = x && x.gp ? { ...x } : avgTeam(); });
  // Team records for win%.
  const recOf = (tid: number) => { if (cur) { const t = s.teams[tid]; return t.w + t.l ? t.w / (t.w + t.l) : 0.5; } const h = ((s.teamHist || {})[tid] || []).find(x => x.season === season); return h ? h.w / Math.max(1, h.w + h.l) : 0.5; };

  // League context.
  const lg: StatLine = {}; Object.values(teams).forEach(t => TEAM_FIELDS.forEach(k => (lg[k] = (lg[k] || 0) + (t[k] || 0))));
  const possT = (t: StatLine) => g.possOf(t);
  const lgPoss = possT(lg), lgPPP = lg.pts / lgPoss, lgPPG = lg.pts / lg.gp, lgPace = lgPoss / lg.gp, lgORtg = 100 * lgPPP;
  Object.values(teams).forEach(t => { t.poss = possT(t); t.min = t.gp * 240; t.ortg = (100 * t.pts) / t.poss; t.drtg = (100 * t.oPts) / t.poss; t.pace = t.poss / t.gp; t.orbPct = t.orb / Math.max(1, t.orb + t.oDrb); });

  // Player season totals (regular season), attributed to the team he played most minutes for.
  const rows: { p: any; t: StatLine; tid: number }[] = [];
  (Object.values(P) as any[]).forEach(p => {
    const rs = (p.stats || []).filter(r => r.season === season && !r.po); if (!rs.length) return;
    const t: StatLine = {}; rs.forEach(r => Object.keys(r).forEach(k => { if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + r[k]; }));
    if (!t.gp || !t.min) return;
    const tid = rs.slice().sort((a, b) => b.min - a.min)[0].tid;
    rows.push({ p, t, tid });
  });

  const out: Record<number, StatLine> = {};
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
  // Team BPM adjustments so each team's minute-weighted BPM matches its ratings.
  const adj: Record<number, { o: number; d: number }> = {};
  s.teams.forEach(tm => { const T = teams[tm.tid]; let o = 0, d = 0, w = 0; rows.forEach(({ p, t, tid }) => { if (tid !== tm.tid) return; o += out[p.id]._obpm * t.min; d += out[p.id]._dbpm * t.min; w += t.min; });
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
    // Per-game and totals the formulas use.
    x.gp = gp; x.gs = t.gs || 0; x.min = t.min / gp; x.minTot = t.min;
    ['pts', 'ast', 'stl', 'blk', 'tov', 'pf', 'orb', 'drb', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta'].forEach(f => (x[f] = (t[f] || 0) / gp));
    x.trb = (t.orb + t.drb) / gp;
    x.fgp = t.fga ? (100 * t.fgm) / t.fga : 0; x.tpp = t.tpa ? (100 * t.tpm) / t.tpa : 0; x.ftp = t.fta ? (100 * t.ftm) / t.fta : 0;
    x.winp = recOf(tid); x.won = 0; x.tid = tid; x.age = p.age;
    x.seasonFraction = Math.min(1, (T.gp || 82) / 82);
    Object.keys(x).forEach(f => { if (f.startsWith('_')) delete x[f]; });
  });
  // Win shares sum to the league's wins (as on Basketball-Reference).
  const wins = cur ? s.teams.reduce((a, t) => a + t.w, 0) : s.teams.reduce((a, t) => a + (((s.teamHist || {})[t.tid] || []).find(h => h.season === season)?.w ?? 41), 0);
  const wsSum = rows.reduce((a, { p }) => a + out[p.id].ws, 0);
  if (wsSum > 0 && wins > 0) { const f = wins / wsSum; rows.forEach(({ p, t }) => { const x = out[p.id]; x.ows *= f; x.dws *= f; x.ws = x.ows + x.dws; x.ws48 = (x.ws * 48) / t.min; }); }
  // Team win shares, for "share of the team's WS".
  const teamWs: Record<number, number> = {};
  rows.forEach(({ p, tid }) => (teamWs[tid] = (teamWs[tid] || 0) + out[p.id].ws));
  rows.forEach(({ p, tid }) => (out[p.id].teamWs = teamWs[tid] || 0));
  return { byPid: out, teams };
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

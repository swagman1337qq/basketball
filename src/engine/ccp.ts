// The Continental Championship Pathway (CCP): the development league, run like the NBA G League
// (2025-26 format). Each NBA club has an affiliate, plus one independent club. The season:
//  - Tip-Off Tournament (Nov 7 – Dec 16): 14 games inside four regions. The best team in each
//    region and the next four best records go to the Winter Showcase for a single-elimination
//    title (Dec 19–22).
//  - Records reset for a 36-game regular season (Dec 27 – Mar 28).
//  - Playoffs: the top eight in each conference, single games through the conference finals, then
//    a best-of-three Finals (Apr 1–12).
// Games are played by the same engine as the NBA. Rosters are players on CCP contracts (free agents
// any NBA team can sign), plus each parent club's two-way players and anyone it sends down.
// There are no owners, coaches or finances: just teams, players and games.
import type { Game } from './Game';
import { GameSim, blankLine } from './sim';
import { CCP_AFFIL, CCP_CLUBS, CCP_INDEPENDENT, CCP_SPARES, ccpClub } from '../data/ccp';
import { natDefault } from '../data/world';
import { nums } from './cba';

export interface CcpTeam { id: number; key: string; aff: number | null; conf: string; region: string; city: string; where: string; name: string; abbr: string; icon: string; colors: [string, string]; note: string }
export interface CcpGame { dn: number; st: 'tip' | 'show' | 'reg' | 'po'; h: number; a: number; hs?: number; as?: number; rd?: number; ot?: number; top?: [number, number, number, number] }
export const IND = -1; // p.gl.tid of the independent club's players
export const CCP_MIN = 10, CCP_MAX = 12; // CCP-contract players per club
const REGIONS: Record<string, [string, string]> = { East: ['Permafrost', 'Backcountry'], West: ['Frontier', 'Outpost'] };

// Days since Oct 1 of the season's first year (the season is named for its second year).
export const dnOf = (Y: number, d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(Y - 1, 9, 1).getTime()) / 864e5);
export const dateOfDn = (Y: number, dn: number) => new Date(Y - 1, 9, 1 + dn);
const D = (Y: number, m: number, d: number) => dnOf(Y, new Date(m >= 9 ? Y - 1 : Y, m, d)); // m: 0-based month
export const fmtDn = (Y: number, dn: number) => dateOfDn(Y, dn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// The clubs this season: one affiliate per NBA team (its usual club, else a spare) and the independent.
function buildTeams(s: any): CcpTeam[] {
  const used = new Set<string>([CCP_INDEPENDENT]), spares = CCP_SPARES.slice(), out: CcpTeam[] = [];
  const mk = (key: string | null, aff: number | null, conf: string): CcpTeam => {
    const c = key ? ccpClub(key)! : null, t = aff != null ? s.teams[aff] : null;
    return { id: out.length, key: key || 'gen' + aff, aff, conf, region: '', city: c ? c.city : t.region + ' Hills', where: c ? c.where : '', name: c ? c.name : 'Outriders', abbr: c ? c.abbr : (t.abbr + 'X').slice(0, 4), icon: c ? c.icon : 'Mountain', colors: c ? c.colors : [t.colors?.[1] || '#333', t.colors?.[0] || '#ccc'], note: c ? c.note : 'A remote outpost.' };
  };
  s.teams.forEach((t: any) => { let k: string | null = CCP_AFFIL[t.abbr]; if (!k || used.has(k)) k = spares.shift() || null; if (k) used.add(k); out.push(mk(k, t.tid, t.conf)); });
  const east = out.filter(t => t.conf === 'East').length, west = out.length - east;
  out.push(mk(CCP_INDEPENDENT, null, east <= west ? 'East' : 'West'));
  // Four tip-off regions: each conference split in two.
  ['East', 'West'].forEach(c => { const ts = out.filter(t => t.conf === c); ts.forEach((t, i) => (t.region = REGIONS[c][i < Math.ceil(ts.length / 2) ? 0 : 1])); });
  return out;
}

// Pair teams game-day by game-day: the teams with the fewest games play first, opponents from
// the preferred group when possible.
function pairDays(ids: number[], quota: number, days: number[], group: (id: number) => string, sameShare: number, rnd: () => number): CcpGame[] {
  const n: Record<number, number> = {}, games: CcpGame[] = []; ids.forEach(i => (n[i] = 0));
  let di = 0;
  while (ids.some(i => n[i] < quota) && di < days.length * 3) {
    const dn = days[Math.min(di, days.length - 1)] + (di >= days.length ? di - days.length + 1 : 0); di++;
    const pool = ids.filter(i => n[i] < quota).sort((a, b) => n[a] - n[b] || rnd() - 0.5), done = new Set<number>();
    for (const a of pool) {
      if (done.has(a)) continue;
      const rest = pool.filter(b => b !== a && !done.has(b)), same = rest.filter(b => group(b) === group(a));
      const b = (same.length && rnd() < sameShare ? same : rest.length ? rest : same)[0]; if (b == null) continue;
      done.add(a); done.add(b); n[a]++; n[b]++;
      games.push(rnd() < 0.5 ? { dn, st: 'tip', h: a, a: b } : { dn, st: 'tip', h: b, a: a });
    }
  }
  return games;
}
const spread = (from: number, to: number, count: number) => Array.from({ length: count }, (_, i) => Math.round(from + (to - from) * i / Math.max(1, count - 1)));

export function ccpNewSeason(g: Game, s: any, Y = g.Y) {
  const teams = buildTeams(s), rnd = g.rng(Y * 31 + teams.length), ids = teams.map(t => t.id);
  const tip: CcpGame[] = [];
  ['East', 'West'].forEach(c => REGIONS[c].forEach(r => { const rid = teams.filter(t => t.region === r).map(t => t.id); tip.push(...pairDays(rid, 14, spread(D(Y, 10, 7), D(Y, 11, 16), 16), () => r, 1, rnd)); }));
  const reg = pairDays(ids, 36, spread(D(Y, 11, 27), D(Y, 2, 28), 44), i => teams[i].conf, 0.75, rnd).map(x => ({ ...x, st: 'reg' as const }));
  const prev = s.ccp;
  s.ccp = { season: Y, teams, games: [...tip, ...reg].sort((a, b) => a.dn - b.dn), showcase: null, po: null, hist: (prev?.hist || []).slice(0, 30) };
  return s.ccp;
}

// This club's players today: its CCP-contract players, and (for an affiliate) the parent club's
// two-way players and anyone sent down.
export function ccpRoster(g: Game, s: any, t: CcpTeam): number[] {
  const P = g.db.P, tid = t.aff == null ? IND : t.aff;
  const own = (s.fa || []).filter((id: number) => P[id]?.gl?.tid === tid);
  const nba = t.aff != null ? (s.rosters[t.aff] || []).filter((id: number) => P[id].ctype === 'twoWay' || P[id].dev) : [];
  return [...own, ...nba];
}
export const ccpTeamOf = (s: any, nbaTid: number) => (s.ccp?.teams || []).find((t: CcpTeam) => (nbaTid === IND ? t.aff == null : t.aff === nbaTid));

// Standings of one stage.
export function ccpStandings(s: any, st: 'tip' | 'reg') {
  const c = s.ccp, rec = c.teams.map((t: CcpTeam) => ({ id: t.id, w: 0, l: 0, pf: 0, pa: 0 }));
  c.games.forEach((x: CcpGame) => { if (x.st !== st || x.hs == null) return; const h = rec[x.h], a = rec[x.a]; h.pf += x.hs; h.pa += x.as!; a.pf += x.as!; a.pa += x.hs;
    if (x.hs > x.as!) { h.w++; a.l++; } else { a.w++; h.l++; } });
  const pct = (r: any) => (r.w + r.l ? r.w / (r.w + r.l) : 0);
  return rec.sort((a: any, b: any) => pct(b) - pct(a) || (b.pf - b.pa) - (a.pf - a.pa)).map((r: any) => ({ ...r, pct: pct(r) }));
}

function simTeamOf(g: Game, s: any, t: CcpTeam) {
  const P = g.db.P, ids = ccpRoster(g, s, t).filter(id => !P[id].inj).sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 12);
  const ROT = [34, 33, 32, 30, 28, 24, 20, 17, 14, 6, 2, 0];
  return { tid: t.id, name: t.city + ' ' + t.name, abbr: t.abbr, rec: '', players: ids.map((id, i) => { const p = P[id]; return { id, name: p.name, pos: p.pos, grp: p.grp, ovr: p.ovr, r: { ...p.r, ape: (p.wing ?? 0) ? p.wing - g.inches(p.hgt) : 4 }, roles: g.rolesOf(p), alpha: p.pers?.alpha, touches: p.pers?.touches, tend: p.tend, flashy: !!p.pers?.flashy, heat: !!p.pers?.heat, volatile: !!p.pers?.volatile, target: ROT[i] ?? 0 }; }) };
}

// Quick results (the default): a score from each club's strength and plausible box-score lines
// from each player's ratings and minutes, about 20x cheaper than the full engine. Settings can
// switch CCP games to the full engine.
function quickGame(g: Game, hT: any, aT: any) {
  const R = Math.random, gauss = () => (R() + R() + R() + R() - 2) * 1.2;
  const str = (t: any) => { const ps = t.players.filter((p: any) => p.target > 0); const m = ps.reduce((a: number, p: any) => a + p.target, 0) || 1; return ps.reduce((a: number, p: any) => a + p.ovr * p.target, 0) / m; };
  const margin = (str(hT) - str(aT)) * 1.3 + 2.2 + gauss() * 10, total = 222 + gauss() * 16;
  let hs = Math.round((total + margin) / 2), as = Math.round((total - margin) / 2), ot = 0; if (hs === as) { ot = 1; hs += R() < 0.5 ? 3 : 0; as += hs === as ? 3 : 0; }
  const side = (t: any, pts: number) => {
    const ps = t.players.filter((p: any) => p.target > 0), tot = ps.reduce((a: number, p: any) => a + p.target, 0) || 1, box: Record<number, any> = {};
    const use = ps.map((p: any) => Math.pow(Math.max(5, p.ovr - 28), 1.6) * p.target), U = use.reduce((a: number, v: number) => a + v, 0) || 1;
    ps.forEach((p: any, i: number) => { const r = p.r, min = +(p.target * 240 / tot * (0.85 + R() * 0.3)).toFixed(1), share = use[i] / U, pp = Math.max(0, Math.round(pts * share * (0.75 + R() * 0.5)));
      const tpa = Math.round(pp * (r.tp / 100) * 0.55 * (0.6 + R() * 0.8)), tpm = Math.round(tpa * (0.26 + r.tp / 900)), fta = Math.round(pp * 0.22 * (0.5 + R())), ftm = Math.round(fta * (0.55 + r.ft / 400));
      const fgm = Math.max(tpm, Math.round((pp - ftm - tpm) / 2)), fga = Math.max(fgm, Math.round(fgm / (0.38 + (r.fg + r.ins) / 1000)) );
      const reb = Math.round(min / 48 * (4 + (r.reb - 40) / 6 + (p.grp === 'B' ? 4 : p.grp === 'W' ? 1.5 : 0)) * (0.6 + R() * 0.8)), orb = Math.round(reb * 0.25);
      box[p.id] = { min, pts: fgm * 2 + tpm + ftm, fgm, fga, tpm, tpa, ftm, fta, orb, drb: reb - orb, ast: Math.round(min / 48 * (2 + (r.pss - 40) / 7 + (p.grp === 'G' ? 3 : 0)) * (0.6 + R() * 0.8)), stl: Math.round(min / 48 * (0.8 + r.diq / 80) * R() * 2), blk: Math.round(min / 48 * (p.grp === 'B' ? 1.6 : 0.4) * R() * 2), tov: Math.round(min / 48 * 2.2 * R() * 2), pf: Math.round(min / 48 * 3.5 * R() * 1.5), pm: 0, gs: i < 5 ? 1 : 0 };
    });
    return box;
  };
  const hb = side(hT, hs), ab = side(aT, as), sum = (b: any) => Object.values(b).reduce((a: number, l: any) => a + l.pts, 0) as number;
  return { home: { pts: sum(hb), box: hb }, away: { pts: sum(ab) === sum(hb) ? sum(ab) + 1 : sum(ab), box: ab }, ot };
}

function play(g: Game, s: any, x: CcpGame) {
  const c = s.ccp, P = g.db.P, H = c.teams[x.h], A = c.teams[x.a], hT = simTeamOf(g, s, H), aT = simTeamOf(g, s, A);
  if (hT.players.length < 5 || aT.players.length < 5) { x.hs = hT.players.length >= aT.players.length ? 1 : 0; x.as = 1 - x.hs; return; } // forfeit (shouldn't happen)
  const r: any = s.ccpFull ? new GameSim(hT as any, aT as any, { norms: g.db.norms }).run() : quickGame(g, hT, aT);
  x.hs = r.home.pts; x.as = r.away.pts; if (r.ot) x.ot = r.ot;
  const topOf = (box: any) => { let best = 0, bp = -1; Object.entries(box).forEach(([id, b]: any) => { if (b.pts > bp) { bp = b.pts; best = +id; } }); return [best, bp]; };
  const th = topOf(r.home.box), ta = topOf(r.away.box); x.top = [th[0], th[1], ta[0], ta[1]];
  [[r.home.box, H], [r.away.box, A]].forEach(([box, t]: any) => Object.entries(box).forEach(([id, b]: any) => {
    if (!b.min) return; const p = P[+id], S = (p.ccpS = p.ccpS || {}), k = c.season + (x.st === 'po' ? 'p' : '');
    const line = (S[k] = S[k] || { team: t.abbr, gp: 0, ...blankLine() }); line.team = t.abbr; line.gp++;
    Object.keys(b).forEach(f => { if (typeof b[f] === 'number' && f in line) line[f] += b[f]; });
    if (p.gl && p.gl.tid != null && x.st !== 'po') { const g1 = line.gp; p.gl.gp = g1; p.gl.pts = +(line.pts / g1).toFixed(1); p.gl.reb = +((line.orb + line.drb) / g1).toFixed(1); p.gl.ast = +(line.ast / g1).toFixed(1); }
  }));
}

// After the tip-off: the Winter Showcase bracket (four region winners + four best records left).
function seedShowcase(s: any) {
  const c = s.ccp, st = ccpStandings(s, 'tip'), Y = c.season, byId = (id: number) => c.teams[id];
  const winners = Object.values(REGIONS).flat().map(r => st.find((x: any) => byId(x.id).region === r)?.id).filter((x: any) => x != null);
  const rest = st.map((x: any) => x.id).filter((id: number) => !winners.includes(id)).slice(0, 8 - winners.length);
  const seeds = [...st.map((x: any) => x.id).filter((id: number) => winners.includes(id) || rest.includes(id))];
  c.showcase = { seeds, champ: null };
  [[0, 7], [3, 4], [1, 6], [2, 5]].forEach(([a, b]) => c.games.push({ dn: D(Y, 11, 19), st: 'show', rd: 1, h: seeds[a], a: seeds[b] }));
}
function seedPlayoffs(s: any) {
  const c = s.ccp, st = ccpStandings(s, 'reg'), Y = c.season, seeds: Record<string, number[]> = {};
  ['East', 'West'].forEach(cf => { seeds[cf] = st.filter((x: any) => c.teams[x.id].conf === cf).slice(0, 8).map((x: any) => x.id); });
  c.po = { seeds, champ: null, finals: null };
  ['East', 'West'].forEach(cf => [[0, 7], [3, 4], [1, 6], [2, 5]].forEach(([a, b]) => { const h = seeds[cf][a], aw = seeds[cf][b]; if (h != null && aw != null) c.games.push({ dn: D(Y, 3, 1), st: 'po', rd: 1, h, a: aw }); }));
}
const winner = (x: CcpGame) => (x.hs! > x.as! ? x.h : x.a);
const seedIdx = (list: number[], id: number) => list.indexOf(id);
// Next round once a round is complete.
function advance(s: any) {
  const c = s.ccp, Y = c.season;
  const sh = c.games.filter((x: CcpGame) => x.st === 'show');
  if (c.showcase && !c.showcase.champ) {
    const last = Math.max(...sh.map((x: CcpGame) => x.rd || 1)), cur = sh.filter((x: CcpGame) => x.rd === last);
    if (cur.length && cur.every((x: CcpGame) => x.hs != null)) {
      if (cur.length === 1) c.showcase.champ = winner(cur[0]);
      else { const w = cur.map(winner); for (let i = 0; i < w.length; i += 2) { const [a, b] = [w[i], w[i + 1]].sort((p, q) => seedIdx(c.showcase.seeds, p) - seedIdx(c.showcase.seeds, q)); c.games.push({ dn: D(Y, 11, last === 1 ? 20 : 22), st: 'show', rd: last + 1, h: a, a: b }); } }
    }
  }
  if (c.po && !c.po.champ) {
    const po = c.games.filter((x: CcpGame) => x.st === 'po'), last = Math.max(...po.map((x: CcpGame) => x.rd || 1)), cur = po.filter((x: CcpGame) => x.rd === last);
    if (cur.length && cur.every((x: CcpGame) => x.hs != null)) {
      if (last <= 2) ['East', 'West'].forEach(cf => { const w = cur.filter((x: CcpGame) => c.teams[x.h].conf === cf).map(winner); for (let i = 0; i + 1 < w.length; i += 2) { const [a, b] = [w[i], w[i + 1]].sort((p, q) => seedIdx(c.po.seeds[cf], p) - seedIdx(c.po.seeds[cf], q)); c.games.push({ dn: D(Y, 3, last === 1 ? 3 : 5), st: 'po', rd: last + 1, h: a, a: b }); } });
      else if (last === 3) { const w = cur.map(winner); const st = ccpStandings(s, 'reg'), rk = (id: number) => st.findIndex((x: any) => x.id === id); const [a, b] = w.sort((p, q) => rk(p) - rk(q)); c.po.finals = { a, b }; c.games.push({ dn: D(Y, 3, 8), st: 'po', rd: 4, h: a, a: b }, { dn: D(Y, 3, 10), st: 'po', rd: 4, h: b, a: a }); }
      else if (last === 4) { const f = c.po.finals, wins = (id: number) => cur.filter((x: CcpGame) => winner(x) === id).length;
        if (wins(f.a) >= 2 || wins(f.b) >= 2) c.po.champ = wins(f.a) >= 2 ? f.a : f.b;
        else if (cur.length === 2) c.games.push({ dn: D(Y, 3, 12), st: 'po', rd: 4, h: f.a, a: f.b });
        else c.po.champ = wins(f.a) > wins(f.b) ? f.a : f.b; }
    }
  }
}

// Play every CCP game scheduled up to day `upto` (days since Oct 1), in date order.
export function ccpPlay(g: Game, s: any, upto: number) {
  const c = s.ccp; if (!c) return 0;
  let played = 0;
  for (let guard = 0; guard < 40; guard++) {
    const due = c.games.filter((x: CcpGame) => x.hs == null && x.dn <= upto).sort((a: CcpGame, b: CcpGame) => a.dn - b.dn);
    if (!due.length) {
      if (!c.showcase && c.games.filter((x: CcpGame) => x.st === 'tip').every((x: CcpGame) => x.hs != null)) { seedShowcase(s); continue; }
      if (!c.po && c.games.filter((x: CcpGame) => x.st === 'reg').every((x: CcpGame) => x.hs != null)) { seedPlayoffs(s); continue; }
      const before = c.games.length; advance(s); if (c.games.length === before) break; continue;
    }
    due.forEach((x: CcpGame) => { play(g, s, x); played++; });
    advance(s);
  }
  if (c.po?.champ != null && !c.hist.some((h: any) => h.season === c.season)) {
    const T = (id: number | null) => (id == null ? '' : c.teams[id].city + ' ' + c.teams[id].name);
    c.hist.unshift({ season: c.season, champ: T(c.po.champ), showcase: T(c.showcase?.champ ?? null) });
  }
  return played;
}

// Keep every club at 10–12 players on CCP contracts: sign unsigned free agents first, then new
// players from the player pool (undrafted players, local tryouts, the CCP draft).
export function ccpTopUp(g: Game, s: any, fa: number[]) {
  const c = s.ccp; if (!c) return;
  const P = g.db.P, N = nums(g), Y = c.season, count: Record<number, number> = {};
  fa.forEach(id => { const t = P[id]?.gl?.tid; if (t != null) count[t] = (count[t] || 0) + 1; });
  c.teams.forEach((t: CcpTeam) => {
    const tid = t.aff == null ? IND : t.aff;
    while ((count[tid] || 0) < CCP_MIN) {
      const r = Math.random(), kind = r < 0.45 ? 'draft' : r < 0.7 ? 'tryout' : 'pool', age = kind === 'draft' ? 21 + Math.floor(Math.random() * 3) : 22 + Math.floor(Math.random() * 6);
      const p = g.mkPlayer(33 + Math.random() * 15, age, s.natW || natDefault(), 0);
      Object.assign(p, { amt: N.min(0), ask: N.min(0), exp: Y, dr: null, draft: Y - 1, undrafted: Y - 1, yos0: 0, yrsWith: 0, rookie: false, pot: Math.max(p.ovr, Math.min(p.pot, p.ovr + 12)) });
      p.gl = { tid, kind, since: Y, gp: 0, pts: 0, reb: 0, ast: 0 };
      fa.push(p.id); count[tid] = (count[tid] || 0) + 1;
    }
  });
}
export const CCP_KIND: Record<string, string> = { standard: 'CCP contract', pool: 'CCP contract (player pool)', draft: 'CCP draft pick', tryout: 'Local tryout', affiliate: 'Affiliate player', returning: 'Returning rights' };
export const allCcpClubs = CCP_CLUBS;

// Club identities follow the current club list (saves made before a change pick up the new towns;
// ids, records and games stay the same).
export function ccpRefreshClubs(s: any) {
  if (!s.ccp) return;
  const fresh = buildTeams(s);
  s.ccp.teams.forEach((t: CcpTeam) => { const f = fresh.find(x => x.aff === t.aff); if (f) Object.assign(t, { key: f.key, city: f.city, where: f.where, name: f.name, abbr: f.abbr, icon: f.icon, colors: f.colors, note: f.note }); });
}

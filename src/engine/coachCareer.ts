// Coach careers (2026-11-15, phase 2): where coaches come from and what they've done.
//  • Retiring players: a quarter of everyone who retires from playing (at random: stars, role players, an injury
//    retirement at 27, a career spent abroad) becomes a coach. His playing career is his own, linked.
//  • Generated careers, seeded by the coach's id: the seasons he played
//    (college, abroad, the CCP league, the women's league, or the league before this one began) with stat lines,
//    and the jobs he held before he came into view (high school, college, abroad, the CCP, an NBA bench), with
//    records as a head coach, titles and the head coach he worked under. Generated coaching seasons are saved
//    when established, so later jobs, ratings and team changes cannot rewrite them.
//  • Stored in the league: one short row a season for every coach with a job here ([season, team, role, under you]);
//    the record, playoff finish and ring come from the team's own season (s.teamHist).
//  • Every AI team has a head coach as a person (a record and a history; who he is doesn't change its games, and
//    teams don't hire or fire them yet: phase 3). You're the head coach of your teams.
import type { Game } from './Game';
import { mulberry32 } from './rng';
import { randomName } from '../data/heritage';
import { pickCollege } from '../data/world';
import { EUROLEAGUE, leaguesIn } from '../data/leagues';
import { firstSeason } from './contracts';
import { coachDb, coachOvr, mkCoach, repOf, starterStaff, staffOf, type Coach, type CoachRole } from './staff';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const ROLE_CODE: Record<string, number> = { lead: 0, asst: 1, dev: 2, hc: 3 };
const CODE_ROLE: CoachRole[] = ['lead', 'asst', 'dev', 'hc'];
export const WOMENS_LEAGUE = 'Women’s Professional League';
const lfOf = (g: Game) => g.CAP / 165;
const seeded = (c: Coach, salt: number) => mulberry32(((c.id * 2654435761) ^ (salt * 40503) ^ 0x5eed) >>> 0);

// ── Retiring players ────────────────────────────────────────────────────────────────
export const PLAYER_TO_COACH = 0.25;
const LEFT_PLAYING = (why: string) => !/signed abroad|Stayed abroad|Deleted/.test(why || '');
// Once a summer: everyone who retired since the last look, a quarter of them into coaching.
export function coachPipeline(g: Game, s: any): number {
  const d: any = g.db,
    from = d.coachPipeY ?? g.Y;
  let n = 0;
  (Object.values(g.db.P) as any[]).forEach(p => {
    if (!p?.retired || p.coachRoll || p.retired.season < from) return;
    p.coachRoll = 1;
    if (!LEFT_PLAYING(p.retired.why) || Math.random() >= PLAYER_TO_COACH) return;
    coachFromPlayer(g, p);
    n++;
  });
  return n;
}
export function coachFromPlayer(g: Game, p: any): Coach {
  const c = mkCoach(g, { age: p.age, fem: false });
  const seasons = new Set((p.stats || []).filter((x: any) => !x.po && x.gp > 0).map((x: any) => x.season)).size + (p.yos0 || 0);
  let best = 0,
    mpg = 0;
  (p.stats || []).forEach((x: any) => {
    if (x.po || !x.gp) return;
    best = Math.max(best, x.pts / x.gp);
    mpg = Math.max(mpg, x.min / x.gp);
  });
  const tier = best >= 20 || (p.peakOvr ?? p.ovr) >= 64 ? 3 : seasons >= 4 && mpg >= 25 ? 2 : 1;
  Object.assign(c, {
    name: p.name,
    first: p.first,
    last: p.last,
    ...(p.native ? { native: p.native } : {}),
    nat: p.rep || p.born || 'US',
    race: p.race,
    born: g.Y - p.age,
    pid: p.id,
    since: g.Y,
    bg: 'Just retired as a player',
    play:
      seasons > 0
        ? { k: 'league', yrs: seasons, tier }
        : { k: 'overseas', yrs: Math.max(2, p.age - 21), where: p.abroad?.club || p.from?.team || EUROLEAGUE[0] },
  });
  c.rep = repOf(g, c);
  preserveCoachCareer(g, g.state, c);
  return c;
}

// ── AI head coaches ─────────────────────────────────────────────────────────────────
export function headCoachAsk(g: Game, c: Coach) {
  return +((2.5 + 9 * Math.pow(c.rep / 100, 1.4)) * lfOf(g)).toFixed(2);
}
export function mkHeadCoach(g: Game, s: any, tid: number): Coach {
  const c = mkCoach(g, { age: 40 + Math.floor(Math.random() * 24), lvl: 6 });
  c.since = Math.min(c.since, g.Y - 8 - Math.floor(Math.random() * 12));
  c.bg = 'NBA assistant';
  c.rep = repOf(g, c);
  Object.assign(c, { tid, role: 'hc', amt: headCoachAsk(g, c), exp: firstSeason(g, s) + 1 + Math.floor(Math.random() * 3) });
  preserveCoachCareer(g, s, c);
  return c;
}
// Every AI team has one head coach; your teams have you (a head coach there goes back on the market). Returns log lines.
export function syncHeadCoaches(g: Game, s: any): any[] {
  const C = coachDb(g),
    log: any[] = [],
    all = Object.values(C) as Coach[];
  s.teams.forEach((T: any) => {
    const tid = T.tid,
      hcs = all.filter(c => c.tid === tid && c.role === 'hc' && !c.ret);
    if (g.isUser(s, tid) && !s.spectator && !hcs.some(c => c.godHeadCoach)) {
      hcs.forEach(c => preserveCoachCareer(g, s, c));
      hcs.forEach(c => Object.assign(c, { tid: null, role: null, amt: 0, exp: 0, bg: 'Head coach, ' + T.region + ' ' + T.name }));
      if (!staffOf(g, tid).length) starterStaff(g, s, tid); // a team you just took over comes with a staff
      return;
    }
    hcs.slice(1).forEach(c => (c.role = 'asst'));
    if (!hcs.length) {
      const c = mkHeadCoach(g, s, tid);
      if ((g.db as any).hcV)
        log.push({ day: s.day, type: 'Staff', teams: T.abbr, text: T.region + ' ' + T.name + ' named ' + c.name + ' head coach' });
    }
  });
  (g.db as any).hcV = 1;
  return log;
}
export const headCoachOf = (g: Game, tid: number): Coach | null =>
  (Object.values(coachDb(g)) as Coach[]).find(c => c.tid === tid && c.role === 'hc' && !c.ret) || null;

// ── Stored history: a row a season ──────────────────────────────────────────────────
// End of the season (the owner review): everyone with a job here.
export function staffSeason(g: Game, s: any) {
  const Y = g.Y;
  (Object.values(coachDb(g)) as Coach[]).forEach(c => {
    if (c.tid == null || c.ret || !c.role) return;
    c.h = c.h || [];
    if (c.h.some(r => r[0] === Y)) return;
    c.h.push([Y, c.tid, ROLE_CODE[c.role], g.isUser(s, c.tid) ? 1 : 0]);
  });
  // Coach of the Year (head coaches only; you on your teams).
  const top = s.awards?.[Y]?.coy?.[0];
  if (top && !g.isUser(s, top.tid)) {
    const hc = headCoachOf(g, top.tid);
    if (hc) hc.coy = [...(hc.coy || []).filter(y => y !== Y), Y];
  }
}

// ── Generated playing career ────────────────────────────────────────────────────────
export interface PlayRow {
  season: number;
  team: string;
  lg: string;
  gp: number;
  mpg: number;
  pts: number;
  reb: number;
  ast: number;
  fg: number;
  tp: number;
  ft: number;
}
// His seasons as a player: linked (his real league career) or generated from his id.
export function playRows(g: Game, s: any, c: Coach): PlayRow[] {
  if (c.pid != null && c.play.k === 'league') {
    const p: any = g.db.P[c.pid];
    if (!p) return [];
    const seasons = [...new Set((p.stats || []).filter((x: any) => !x.po).map((x: any) => x.season))].sort() as number[];
    // His seasons before this league began (yos0): generated, ending the season before his first one here.
    const pre = p.yos0 || 0,
      first = seasons[0] ?? (p.retired?.season ?? g.Y) + 1;
    const early = pre > 0 ? genPlay(g, s, c, 'league', pre, first - pre) : [];
    return early.concat(
      seasons
        .map(y => {
          const t: any = g.seasonTotals(p, y);
          if (!t?.gp) return null;
          return {
            season: y,
            team: s.teams[t._tid]?.abbr || '—',
            lg: 'League',
            gp: t.gp,
            mpg: t.min / t.gp,
            pts: t.pts / t.gp,
            reb: (t.orb + t.drb) / t.gp,
            ast: t.ast / t.gp,
            fg: t.fga ? t.fgm / t.fga : 0,
            tp: t.tpa ? t.tpm / t.tpa : 0,
            ft: t.fta ? t.ftm / t.fta : 0,
          };
        })
        .filter(Boolean) as PlayRow[],
    );
  }
  const k = c.play.k;
  if (k === 'none' || k === 'hs' || !c.play.yrs) return [];
  const r0 = seeded(c, 3),
    n = c.play.yrs,
    start0 = c.born + (k === 'college' ? 18 : k === 'women' ? 22 : 20 + Math.floor(r0() * 3));
  return genPlay(g, s, c, k, n, Math.min(start0, c.since - n)); // his playing days end before his coaching starts
}
function genPlay(g: Game, s: any, c: Coach, k: string, n: number, start: number): PlayRow[] {
  const rnd = seeded(c, 1);
  const pos = rnd(),
    rebF = pos < 0.35 ? 0.55 : pos < 0.7 ? 0.85 : 1.45,
    astF = pos < 0.35 ? 1.7 : pos < 0.7 ? 0.85 : 0.5,
    big = pos >= 0.7;
  const base: Record<string, [number, number, number, number]> = {
    // [points, minutes, games low, games range]
    pro: [
      [7, 17],
      [14, 29],
      [22, 35],
    ][Math.max(0, (c.play.tier ?? 1) - 1)].concat([58, 24]) as any,
    league: [
      [7, 17],
      [14, 29],
      [22, 35],
    ][Math.max(0, (c.play.tier ?? 1) - 1)].concat([58, 24]) as any,
    overseas: [12, 26, 28, 10],
    college: [11, 27, 28, 8],
    women: (c.play.tier === 2 ? [17, 31] : [9, 22]).concat([30, 10]) as any,
    ccp: [11, 25, 38, 12],
  };
  const [p0, m0, g0, gr] = base[k] || base.overseas;
  const teams = teamsFor(g, s, c, k, n, rnd);
  const out: PlayRow[] = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5,
      arc = k === 'college' ? 0.7 + 0.45 * t : 0.72 + 0.5 * Math.sin(Math.PI * (0.12 + t * 0.8)),
      nz = () => 0.88 + rnd() * 0.24,
      pts = p0 * arc * nz(),
      mpg = cl(m0 * (0.85 + 0.25 * arc) * nz(), 6, 38);
    out.push({
      season: start + i,
      team: teams[i],
      lg:
        k === 'pro' || k === 'league'
          ? 'League'
          : k === 'overseas'
            ? 'Abroad'
            : k === 'college'
              ? 'NCAA'
              : k === 'women'
                ? WOMENS_LEAGUE
                : 'CCP league',
      gp: Math.round(g0 + rnd() * gr),
      mpg,
      pts,
      reb: (pts * 0.3 + 1.6) * rebF * nz(),
      ast: (pts * 0.16 + 0.7) * astF * nz(),
      fg: cl(0.43 + (big ? 0.06 : 0) + (rnd() - 0.5) * 0.06, 0.36, 0.6),
      tp: big && rnd() < 0.6 ? 0 : cl(0.34 + (rnd() - 0.5) * 0.08, 0.25, 0.44),
      ft: cl(0.74 + (big ? -0.06 : 0.03) + (rnd() - 0.5) * 0.1, 0.5, 0.92),
    });
  }
  return out;
}
function teamsFor(g: Game, s: any, c: Coach, k: string, n: number, rnd: () => number): string[] {
  const pool =
    k === 'college'
      ? [c.play.where || pickCollege(rnd)]
      : k === 'overseas'
        ? [c.play.where || EUROLEAGUE[0], ...EUROLEAGUE, ...leaguesIn(c.nat).flatMap(l => l.teams)]
        : k === 'women'
          ? s.teams.map((t: any) => t.region)
          : k === 'ccp'
            ? s.teams.map((t: any) => 'CCP ' + t.region)
            : s.teams.map((t: any) => t.abbr);
  const out: string[] = [];
  let cur = pool[Math.floor(rnd() * pool.length)],
    left = 2 + Math.floor(rnd() * 4);
  if (k === 'overseas' && c.play.where) cur = c.play.where;
  for (let i = 0; i < n; i++) {
    if (left-- <= 0 && k !== 'college') {
      cur = pool[Math.floor(rnd() * pool.length)];
      left = 1 + Math.floor(rnd() * 4);
    }
    out.push(cur);
  }
  return out;
}

// ── Coaching career ─────────────────────────────────────────────────────────────────
export interface CoachRow {
  season: number;
  team: string;
  tid?: number; // a team in this league
  level: string; // High school, College, Abroad, CCP league, NBA
  role: string;
  w?: number;
  l?: number;
  fin?: string;
  ring?: boolean;
  under?: string;
  cur?: boolean; // this season, under way
}
const LV = ['High school', 'College', 'Abroad', 'CCP league', 'NBA'];
const GAMES = [26, 31, 34, 40, 82];
const HC_P = [0.55, 0.3, 0.35, 0.4, 0];
// His last job before he came into view (staff.ts bg), as a level.
function lastLevel(c: Coach): number | null {
  const b = c.bg || '';
  if (/NBA assistant/.test(b)) return 4;
  if (/College/.test(b)) return 1;
  if (/High school/.test(b)) return 0;
  if (/CCP/.test(b)) return 3;
  if (/Europe|abroad/i.test(b)) return 2;
  return null; // new, just retired, or he worked here
}
// Seasons of generated jobs from `from` to `to` (inclusive), climbing toward his last level.
function genJobs(g: Game, s: any, c: Coach, from: number, to: number): CoachRow[] {
  if (to < from) return [];
  const rnd = seeded(c, 2),
    fin = lastLevel(c) ?? 0,
    yrs = to - from + 1,
    ov = c.careerOvr ?? coachOvr(c),
    out: CoachRow[] = [];
  // Stints: the last one at his final level, earlier ones lower down.
  const stints: { lv: number; len: number }[] = [];
  let left = yrs,
    lv = fin;
  while (left > 0) {
    const len = Math.min(left, 2 + Math.floor(rnd() * 5));
    stints.unshift({ lv, len });
    left -= len;
    lv = Math.max(0, lv - 1 - (rnd() < 0.3 ? 1 : 0));
    if (c.nat !== 'US' && lv < 2 && rnd() < 0.7) lv = 2;
  }
  let y = from;
  stints.forEach(st => {
    const hc = rnd() < HC_P[st.lv],
      team =
        st.lv === 0
          ? randomName('US', rnd).last + ' High'
          : st.lv === 1
            ? pickCollege(rnd)
            : st.lv === 2
              ? (c.nat !== 'US' ? leaguesIn(c.nat).flatMap(l => l.teams) : []).concat(EUROLEAGUE)[Math.floor(rnd() * 12)] || EUROLEAGUE[0]
              : st.lv === 3
                ? 'CCP ' + s.teams[Math.floor(rnd() * s.teams.length)].region
                : s.teams[Math.floor(rnd() * s.teams.length)].abbr,
      tid = st.lv === 4 ? s.teams.find((t: any) => t.abbr === team)?.tid : undefined,
      under = hc ? undefined : randomName(st.lv === 2 && c.nat !== 'US' ? c.nat : 'US', rnd).name;
    for (let i = 0; i < st.len; i++, y++) {
      const row: CoachRow = { season: y, team, tid, level: LV[st.lv], role: hc ? 'Head Coach' : 'Assistant', under };
      if (hc) {
        const G = GAMES[st.lv],
          wp = cl(0.5 + (ov - 50) / 100 + (rnd() - 0.5) * 0.24, 0.15, 0.85);
        row.w = Math.round(G * wp);
        row.l = G - row.w;
        row.ring = rnd() < 0.03 + Math.max(0, wp - 0.65) * 0.3;
        row.fin = row.ring ? 'Won the title' : undefined;
      } else if (st.lv === 4) row.ring = rnd() < 0.05;
      out.push(row);
    }
  });
  return out;
}
const ROLE_NAME: Record<string, string> = {
  lead: 'Lead Assistant',
  asst: 'Assistant Coach',
  dev: 'Head of Player Development',
  hc: 'Head Coach',
};
// Establish generated seasons once, before job/background/rating changes can rewrite them.
// Persisting the rows also keeps them stable across expansion, rebrands and save/reopen.
export function preserveCoachCareer(g: Game, s: any, c: Coach) {
  if (c.past) return;
  const made = c.made ?? (g.db as any).coachY0 ?? g.Y;
  c.made = made;
  c.careerOvr = coachOvr(c);
  const last = Math.max(c.since - 1, Math.min(made - 1, (c.ret ?? g.Y) - 1));
  c.past = genJobs(g, s, c, c.since, last);
}
// Every season he's coached, oldest first: generated before he came into view, his jobs here after.
export function coachRows(g: Game, s: any, c: Coach): CoachRow[] {
  preserveCoachCareer(g, s, c);
  const made = c.made ?? (g.db as any).coachY0 ?? g.Y,
    stored = new Map<number, number[]>((c.h || []).map(r => [r[0], r]));
  const rows: CoachRow[] = c.past!.map(r => ({ ...r }));
  const gm = s.gm?.name || 'you';
  const lastGen = rows[rows.length - 1],
    everHere = (c.h || []).length > 0;
  for (let y = Math.max(made, c.since); y <= (c.ret ?? g.Y); y++) {
    const r = stored.get(y),
      cur = y === g.Y && c.tid != null && !c.ret && !r;
    if (!r && !cur) {
      // Not working here: he stays in the job he had before he came into view (never hired here), seeded by season.
      if (lastGen && !everHere && y < g.Y) {
        const rr = mulberry32(((c.id * 2654435761) ^ (y * 7919)) >>> 0),
          row: CoachRow = { ...lastGen, season: y };
        if (row.w != null) {
          const G = (row.w || 0) + (row.l || 0),
            wp = cl(0.5 + ((c.careerOvr ?? coachOvr(c)) - 50) / 100 + (rr() - 0.5) * 0.24, 0.15, 0.85);
          row.w = Math.round(G * wp);
          row.l = G - row.w;
          row.ring = rr() < 0.03 + Math.max(0, wp - 0.65) * 0.3;
          row.fin = row.ring ? 'Won the title' : undefined;
        } else row.ring = row.level === 'NBA' ? rr() < 0.05 : false;
        rows.push(row);
      }
      continue;
    }
    {
      const tid = r ? r[1] : (c.tid as number),
        role = r ? CODE_ROLE[r[2]] : (c.role as CoachRole),
        T = s.teams[tid],
        h = ((s.teamHist || {})[tid] || []).find((x: any) => x.season === y);
      const hc = r ? (r[3] ? null : headCoachName(g, s, tid)) : g.isUser(s, tid) ? null : headCoachName(g, s, tid);
      rows.push({
        season: y,
        team: T?.abbr || '—',
        tid,
        level: 'NBA',
        role: ROLE_NAME[role] || role,
        w: h ? h.w : cur ? T?.w : undefined,
        l: h ? h.l : cur ? T?.l : undefined,
        fin: h?.fin,
        ring: h?.fin === 'Won the title',
        under: role === 'hc' ? undefined : (r ? r[3] : g.isUser(s, tid)) ? gm + ' (you)' : hc || undefined,
        cur: y === g.Y && !h, // still under way (no season record yet)
      });
    }
  }
  return rows;
}
function headCoachName(g: Game, s: any, tid: number) {
  const hc = (Object.values(coachDb(g)) as Coach[]).find(c => c.tid === tid && c.role === 'hc' && !c.ret);
  return hc?.name || null;
}
export function careerSummary(rows: CoachRow[]) {
  const hcRows = rows.filter(r => r.role === 'Head Coach' && r.w != null);
  const nba = hcRows.filter(r => r.level === 'NBA' && !r.cur);
  return {
    seasons: rows.length,
    nbaW: nba.reduce((a, r) => a + (r.w || 0), 0),
    nbaL: nba.reduce((a, r) => a + (r.l || 0), 0),
    hcW: hcRows.reduce((a, r) => a + (r.w || 0), 0),
    hcL: hcRows.reduce((a, r) => a + (r.l || 0), 0),
    hcRings: rows.filter(r => r.ring && r.role === 'Head Coach').length,
    asstRings: rows.filter(r => r.ring && r.role !== 'Head Coach').length,
    nbaSeasons: rows.filter(r => r.level === 'NBA').length,
  };
}

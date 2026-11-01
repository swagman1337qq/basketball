// Realism test (2026-11-01): `npm run realism` plays whole seasons in fresh, seeded leagues with the AI running
// every team and checks the league against real-NBA bands: team box scores, the leaders, how spread out the
// standings are, and that nothing is broken (a player on two rosters, a NaN rating or salary, a roster over the
// limit). With --seasons N it also plays the playoffs, draft and free agency between seasons and checks that the
// league's talent doesn't drift. Exits 1 if any check fails, so it can guard an engine change.
//
//   npm run realism                       3 leagues (seeds 11, 12, 13), one regular season each
//   npm run realism -- --seeds 11,12 --seasons 3
//
// A band is where real seasons sit with some room for a game league's spread; a failure means "look at this",
// not always "this is wrong". Bands live in BANDS below.
import { Game } from '../src/engine/Game';
import { seasonMax, stdIds, twoWayIds, TWO_WAY_MAX } from '../src/engine/cba';
import { seasonReview } from '../src/engine/frontOffice';
import { mulberry32 } from '../src/engine/rng';

const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const seeds = arg('seeds', '11,12,13').split(',').map(Number), seasons = Math.max(1, +arg('seasons', '1'));

// [low, high] for each check. Team numbers are per team per game.
const BANDS: Record<string, [number, number]> = {
  'team points': [106, 120], 'team assists': [22, 28.5], 'team turnovers': [12, 16], 'team FGA': [84, 92], 'team 3PA': [28, 42],
  'team FTA': [18, 26], 'team rebounds': [40, 46], 'FG%': [45, 49.5], '3P%': [34, 38.5], 'FT%': [74, 81],
  'scoring leader (ppg)': [26, 37], 'players at 25+ ppg': [4, 20], 'players at 20+ ppg': [18, 50],
  'assist leader (apg)': [8.5, 13.5], 'players at 10+ apg': [0, 5], 'rebound leader (rpg)': [10.5, 16.5], 'highest usage %': [30, 40],
  'best record (win%)': [0.65, 0.86], 'worst record (win%)': [0.12, 0.36],
  'mean overall drift': [-2.5, 2.5], 'players 60+ (change)': [-25, 25],
};

type Row = { name: string; v: number; band: [number, number]; ok: boolean };
const results: { seed: number; season: number; rows: Row[]; broken: string[] }[] = [];

function check(rows: Row[], name: string, v: number) { const band = BANDS[name]; rows.push({ name, v, band, ok: isFinite(v) && v >= band[0] && v <= band[1] }); }

// Nothing broken: every roster id is a live player on one roster only, ratings and salaries are numbers, rosters fit.
function invariants(g: any): string[] {
  const out: string[] = [], seen = new Map<number, number>(), P = g.db.P, max = seasonMax(g.state);
  Object.entries(g.state.rosters as Record<string, number[]>).forEach(([tid, ids]) => {
    const std = stdIds(g, ids).length, tw = twoWayIds(g, ids).length; // two-way contracts don't count against the 15
    if (g.state.phase === 'regular' && (std > max || tw > TWO_WAY_MAX)) out.push('team ' + tid + ' has ' + std + ' standard and ' + tw + ' two-way players (max ' + max + ' and ' + TWO_WAY_MAX + ')');
    ids.forEach(id => {
      const p = P[id];
      if (!p || p.gone) { out.push('team ' + tid + ' lists a missing player ' + id); return; }
      if (seen.has(id)) out.push(p.name + ' is on two rosters (' + seen.get(id) + ', ' + tid + ')'); seen.set(id, +tid);
      if (!isFinite(p.ovr) || !isFinite(p.pot)) out.push(p.name + ' has a broken overall or potential');
      if (p.amt != null && !isFinite(p.amt)) out.push(p.name + ' has a broken salary');
      if (Object.values(p.r || {}).some((x: any) => typeof x === 'number' && !isFinite(x))) out.push(p.name + ' has a broken rating');
    });
  });
  return out.slice(0, 10);
}

const clr = (g: any) => g.setState({ mailRead: g.state.mailSeq || 0, letterUnread: null, letterOpen: null, notices: [], dialog: null });
const rostered = (g: any) => (Object.values(g.state.rosters).flat() as number[]).map(id => g.db.P[id]).filter(Boolean);

async function playRegular(g: any) { for (let i = 0; i < 400; i++) { clr(g); const d0 = g.state.day; await g.sim(200); if (g.state.day === d0 || g.state.phase !== 'regular') break; } }

// From the end of the regular season to the next opening night, every decision left to the AI.
function offseason(g: any) {
  const P = g.db.P;
  clr(g); g.startPlayin(); clr(g); g.simPlayin(); clr(g); g.simPlayin(); clr(g); g.startPlayoffs();
  for (let i = 0; i < 60 && g.state.phase === 'playoffs'; i++) { clr(g); g.simPo('all'); }
  g.setState({ letterOpen: null }); if (g.state.phase === 'playoffs' || g.state.phase === 'review') { clr(g); try { seasonReview(g); } catch { /* the review needs a GM; spectating leagues skip it */ } }
  clr(g); g.runLottery();
  for (let i = 0; i < 200 && g.state.phase === 'draft' && g.state.pi < g.state.picks.length; i++) {
    clr(g); const pi0 = g.state.pi; g.aiDraft(false);
    if (g.state.pi === pi0) { const taken = new Set(g.state.picks.map((x: any) => x.pid)); const best = g.db.cls[g.Y].filter((id: number) => !taken.has(id)).sort((a: number, b: number) => (g.db.rank[a] ?? 999) - (g.db.rank[b] ?? 999))[0]; g.draftPick(best); if (g.state.pi === pi0) break; }
  }
  clr(g); g.startPreFA(); clr(g); g.startFA(); for (let d = 0; d < 6; d++) { clr(g); g.advanceFA(5); }
  for (let i = 0; i < 6 && g.state.phase === 'fa'; i++) { g.setState({ offerSheets: [], agentCalls: [] }); clr(g); g.startPreseason(); }
  clr(g); g.startSeason();
  if (g.state.phase !== 'regular') { const me = g.state.me; g.setState((st: any) => ({ rosters: { ...st.rosters, [me]: st.rosters[me].slice().sort((a: number, b: number) => P[b].ovr - P[a].ovr).slice(0, seasonMax(st)) } })); clr(g); g.startSeason(); }
}

function measure(g: any, rows: Row[]) {
  const Y = g.Y, P = g.db.P, tot: Record<string, number> = {}, players: { t: Record<string, number> }[] = [];
  Object.values(P).forEach((p: any) => {
    const rs = (p.stats || []).filter((r: any) => r.season === Y && !r.po); if (!rs.length) return;
    const t: Record<string, number> = {}; rs.forEach((r: any) => Object.keys(r).forEach(k => { if (typeof r[k] === 'number' && k !== 'season') t[k] = (t[k] || 0) + r[k]; }));
    Object.entries(t).forEach(([k, v]) => (tot[k] = (tot[k] || 0) + v));
    if (t.gp >= 50 && t.min / t.gp >= 15) players.push({ t });
  });
  const teams: any[] = Object.values(g.state.teams), games = teams.reduce((a, t) => a + t.w + t.l, 0) / 2, per = (k: string) => tot[k] / games / 2;
  check(rows, 'team points', per('pts')); check(rows, 'team assists', per('ast')); check(rows, 'team turnovers', per('tov'));
  check(rows, 'team FGA', per('fga')); check(rows, 'team 3PA', per('tpa')); check(rows, 'team FTA', per('fta')); check(rows, 'team rebounds', per('orb') + per('drb'));
  check(rows, 'FG%', (100 * tot.fgm) / tot.fga); check(rows, '3P%', (100 * tot.tpm) / tot.tpa); check(rows, 'FT%', (100 * tot.ftm) / tot.fta);
  const pg = (k: string) => players.map(x => (k === 'reb' ? x.t.orb + x.t.drb : x.t[k]) / x.t.gp), ppg = pg('pts'), apg = pg('ast');
  check(rows, 'scoring leader (ppg)', Math.max(...ppg)); check(rows, 'players at 25+ ppg', ppg.filter(x => x >= 25).length); check(rows, 'players at 20+ ppg', ppg.filter(x => x >= 20).length);
  check(rows, 'assist leader (apg)', Math.max(...apg)); check(rows, 'players at 10+ apg', apg.filter(x => x >= 10).length);
  check(rows, 'rebound leader (rpg)', Math.max(...pg('reb'))); check(rows, 'highest usage %', Math.max(...players.map(x => g.usgOf(x.t))));
  const wp = teams.map(t => t.w / Math.max(1, t.w + t.l)); check(rows, 'best record (win%)', Math.max(...wp)); check(rows, 'worst record (win%)', Math.min(...wp));
}

const t0 = Date.now();
for (const seed of seeds) {
  Math.random = mulberry32(seed);
  const g: any = Game.create(seed, [0]);
  g.setState({ easy: { lineup: true, tactics: true, cap: true, fa: true, draft: true, fire: true, scouting: true, injuries: true }, ownerFiring: false, gmSetup: false });
  const start = rostered(g), mean0 = start.reduce((a, p) => a + p.ovr, 0) / start.length, top0 = start.filter(p => p.ovr >= 60).length;
  for (let s = 0; s < seasons; s++) {
    if (s > 0) offseason(g);
    const rows: Row[] = [], broken = invariants(g);
    await playRegular(g); broken.push(...invariants(g));
    measure(g, rows);
    if (s > 0) { const ps = rostered(g); check(rows, 'mean overall drift', ps.reduce((a, p) => a + p.ovr, 0) / ps.length - mean0); check(rows, 'players 60+ (change)', ps.filter(p => p.ovr >= 60).length - top0); }
    results.push({ seed, season: g.Y, rows, broken });
    const bad = rows.filter(r => !r.ok).length + broken.length;
    console.log(`seed ${seed} · season ${g.Y}: ${bad ? bad + ' outside the bands or broken' : 'all checks pass'} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
}

// One table: each check, its band, every league-season's value; a ✗ marks one outside its band.
const names = Object.keys(BANDS).filter(n => results.some(r => r.rows.some(x => x.name === n)));
const fmt = (v: number) => (Math.abs(v) < 1 && v !== 0 ? v.toFixed(3) : Number.isInteger(v) ? String(v) : v.toFixed(1));
console.log('\n' + 'check'.padEnd(24) + 'band'.padEnd(15) + results.map(r => (r.seed + '/' + r.season).padStart(11)).join(''));
names.forEach(n => {
  const b = BANDS[n];
  console.log(n.padEnd(24) + (fmt(b[0]) + '–' + fmt(b[1])).padEnd(15) + results.map(r => { const x = r.rows.find(y => y.name === n); return (x ? fmt(x.v) + (x.ok ? '  ' : ' ✗') : '').padStart(11); }).join(''));
});
const broken = results.flatMap(r => r.broken.map(b => r.seed + '/' + r.season + ': ' + b)), fails = results.reduce((a, r) => a + r.rows.filter(x => !x.ok).length, 0);
if (broken.length) console.log('\nBroken:\n  ' + broken.join('\n  '));
console.log(`\n${fails || broken.length ? 'FAIL' : 'PASS'}: ${fails} outside the bands, ${broken.length} broken · ${results.length} league-seasons in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(fails || broken.length ? 1 : 0);

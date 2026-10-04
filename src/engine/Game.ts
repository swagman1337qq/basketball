// The league: world generation, the season engine, and a tiny observable store.
// Rules follow HANDOFF.md and the Claude Design prototype; the UI reads a view
// model built from this state (see ui/viewModel.ts).
import { PRESET_CARDS } from './playerCard';
import { allStarDay, runAllStar } from './allStar';
import { placeNamedOwners, stampOwnerBgs } from './owners';
import { protFactor, protLabel, settlePickRules } from './pickRules';
import { LOUD_COLORS, PALETTE_V } from '../data/palette';
import { CLASSIC_COLORS } from '../data/franchises';
import { applyCoachPlans, coachFocus } from './coaches';
import { createElement } from 'react';
import { migrateTactics, TAC_DEFAULT, tacticFit, repAffinity, tacticReps, tacticUnlocks } from './tactics';
import { americanFirst, applyNativeMix, MIXED_NATIVE_SHARE, NATIVE_MIX, nameFromGroup, pickGroup, randomName, scriptOk, TRIBE_CITIES, TRIBE_TOWNS, TWO_TRIBES_SHARE } from '../data/heritage';
import { voteHof } from './hof';
import { effTend, ensureTen, evolveTendencies, initTendencies, optionRanks, quirkOf, tenTargets } from './tendencies';
import { blendHeight, deriveDefense, deriveDefenseKeepOvr, ovrExact, ovrShare, setHgtKeepOvr, setRating, syncOvr, teamRating, wngBonus } from './ratings';
import { ensureIntg, gemTick, rollGem } from './intangibles';
import { runBriefs } from './scoutBrief';
import { mulberry32 as seeded } from './rng';
import { mediaPreds } from './media';
import { snapEnd, snapOpening } from './progress';
import { capState, checkTrade, inSeasonPhase, nums, rosterMax, rosterMin, seasonMax, setCap, stdIds, teamSalary, TWO_WAY_MAX, twoWayIds, yosOf, DAY } from './cba';
import { askOf, acceptQualifyingOffers, aiFreeAgencyDay, clubLogs, fillRoster, openFreeAgency, seasonTick, signDraftee, tradeCap, trimRoster, userRelease, userSign, aiExtensions } from './cbaFlow';
import { aiTerms, applySigning, waivePlayer } from './contracts';
import { capGrowthFor, fmtMoney } from './capModel';
import { assignNumbers, retiredNums } from './jerseys';
import { gLeagueTick, placeInGLeague } from './gleague';
import { removeUnplayed, slimRetired } from './prune';
import { ccpNewSeason, ccpPlay, ccpRefreshClubs, ccpTopUp, dnOf } from './ccp';
import { bestTactics, easyCuts, easyFreeAgency, easyLineups, easyMatch } from './easy';
import { FRANCHISES, marketOf } from '../data/franchises';
import { yearEndLetter } from './ownerLetter';
import { answerOffer } from './gmCareer';
import { applyTranslation, ensureTranslation, translationLine } from './translation';
import { applyChange, bodyAhead, coachAging, coachMult, develop, skillChange, SKILLS, skillWeights, workEthicOf } from './development';
import { fullCeil, initCeil, moveTruePot, paceOf, planRate, planStatus, potView, refreshPot, rollPerr, scoutSd, sharpen, teamRead } from './potential';
import { envOf, envWhy, roleLead, ROLE_NOUN, roleReps, teamBudget } from './environment';
import { devMinutes, pickCut, rosterValue } from './rosterAI';
import { aiTradeIdea, contractK, contractValue, offerToUser, pickHorizon, pickWorth, slotDist, swapWorth, teamGain } from './tradeLogic';
import { BROTHER_RATE, legacyCareer, maybeBrother, maybeSon, familyTag } from './family';
import { regionOfCountry } from '../data/world';
import { clubs, COLLEGES, countries, cyr, EXPANSION, MARKETS, namePools, natDefault, nativeMaps, OWNER_ARCHETYPES, OWNER_SURNAMES, OLD_NICKNAMES, RATING_KEYS, regions, roleDefs, TEAM_STYLE, TEAMS, teamStyle } from '../data/world';
import { faceSvg, makeFace } from './faces';
import { hopelessPicks, hopelessReport, hopelessTid, makeHopeless } from './startRoster';
import { mulberry32, nextRandom } from './rng';
import { drawLottery, expectedByRank, expectedPick, firstRoundOrder, lotteryField, lotteryOdds } from './lottery';
import { awardDefs, computeAwards, seriesMvp } from './awards';
import { computeNorms } from './norms';
import { addNotice, contractLine, preFAPending, startPreFA } from './preFA';
import { enterSpectator, manageTeam, spectate, type SpecGoal } from './spectator';
import { applyAutoBudget, inboxTick, offseasonMandates, openingNightFireSales, ownerFavorite, teamSales } from './frontOffice';
import { adjustGames, confidenceTick, scoutTick } from './overseas';
import { lockerRoom, mentorTick } from './lockerRoom';
import { addTx, recordTrade } from './txlog';
import { BASE, blankLine, GameSim, zoneSkill, type FourFactors, type GameResult, type SimTeam } from './sim';

// 2026–27 cap figures ($M). They rise 2% when the league expands, so they live on the save.
export const CAPS0 = { CAP: 165.0, MINP: 148.5, TAX: 201.0, AP1: 209.0, AP2: 221.7, VMIN: 3.87, MLE: 15.0, MAXC: 57.7 };

const POS = [['PG', 'G'], ['SG', 'G'], ['G', 'G'], ['SF', 'W'], ['GF', 'W'], ['F', 'W'], ['PF', 'B'], ['FC', 'B'], ['C', 'B']];
const BIAS = { G: { spd: 8, acc: 9, drb: 10, pss: 10, tp: 8, lay: 4, hgt: -14, ins: -10, reb: -10, box: -12, stre: -6 }, W: { tp: 5, fg: 4, spd: 3, acc: 3, jmp: 4, diq: 3, lay: 2 }, B: { hgt: 14, ins: 12, reb: 12, box: 12, stre: 10, dnk: 6, drb: -12, pss: -8, tp: -12, spd: -6, acc: -9 } };
const DIAS = ['BR', 'NG', 'SN', 'CM', 'CD', 'DO', 'GR', 'IT', 'PH', 'ML', 'JP', 'HR', 'RS', 'BS'];

// UI-only keys that should not survive a reload.
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }), MONTH_YR = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });
const TRANSIENT = { navArrange: false, tour: null, tourMode: null, modal: false, dialog: null, teamModal: null, listModal: null, q: '', dragId: null, overId: null, showJson: false, tMsg: null, extMsg: null, rosterAt: null };

export interface SaveData { db: any; state: any }

export class Game {
  db: any;
  state: any;
  version = 0;
  private listeners = new Set<() => void>();
  private faceCache: Record<number, any> = {};

  // A new league. `tids` are the franchises the user will run (1 to all of them);
  // the first is the one on screen.
  static create(seed = 2027, tids: number | number[] = 0, opts: { worst?: boolean; hopeless?: boolean; spectate?: boolean } = {}) {
    const g = new Game();
    g.makeDB(seed);
    if (opts.worst) g.swapToWorst(Array.isArray(tids) ? tids : [tids]);
    else if (opts.hopeless) makeHopeless(g, Array.isArray(tids) ? tids : [tids]); // startRoster.ts
    g.state = g.initState(Array.isArray(tids) ? tids : [tids]);
    g.state.teams = stampOwnerBgs(g.state.teams); g.db.ownerBgV = 1; // every owner's background (owners.ts)
    g.db.bodyV = 1; // its prospects were made with a body ahead of their game already (development.ts)
    g.db.ceilV = 1; // and every player with his own ceilings (potential.ts)
    g.db.hgtV = 1; // and height ratings that follow listed height (ratings.ts blendHeight)
    g.state = { ...g.state, assets: g.ensureAssets(g.state) }; // picks through the trading horizon (tradeLogic.ts)
    if (opts.hopeless) { const T = Array.isArray(tids) ? tids : [tids]; hopelessPicks(g, g.state, T); g.state.notices = addNotice(g.state, { tone: 'info', title: 'What you inherited: the most hopeless situation in the league', lines: hopelessReport(g, g.state, T[0]) }); }
    { const rk = optionRanks(g.db.P, g.state.rosters), md = g.strategies(g.state.teams, g.state, true); Object.keys(g.state.rosters).forEach(k => g.state.rosters[k].forEach((id: number) => { if (rk.has(id)) initTendencies(g.db.P[id], { rank: rk.get(id), mode: md[k] }); })); } // playing styles that fit each player's role on his team (tendencies.ts)
    g.db.usgV = 1; g.db.ten3 = 1; // shot volume follows the offensive game and role; tendencies are the NBA's shot categories (tendencies.ts)
    g.refreshNorms(g.state);
    g.state.intel = scoutTick(g, g.state, g.state.overseas);
    placeInGLeague(g, g.state, g.state.fa, g.rng(seed + 77)); // unsigned players start the season in the CCP
    ccpNewSeason(g, g.state); ccpTopUp(g, g.state, g.state.fa); // the CCP (development league) season
    assignNumbers(g.db.P, g.state.rosters, undefined, retiredNums(g.state.teams)); g._rosterRef = g.state.rosters;
    snapOpening(g, g.state); // opening-night ratings, for year-over-year progress
    g.rollDevYear(g.state);
    if (opts.spectate) g.enterSpectator(); // spectator.ts: no team, the AI runs all of them
    return g;
  }

  // Contract details for the starting league: type, 5% raises, rookie-scale slots and
  // options, service-based minimums, a few player/team options, trade kickers and no-trade
  // clauses (only for 8+ year veterans with 4+ years on their team, as the CBA requires).
  initContracts(rosters, rnd) {
    const P = this.db.P, N = nums(this);
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => {
      const p = P[id], yos = yosOf(this, p), minS = N.min(yos);
      p.raise = 0.05; if (p.amt < minS) p.amt = minS;
      if (p.yrsWith >= yos) p.draftTid = +k;
      if (p.rookie && p.dr) { p.ctype = 'rookie'; p.rookieScale = { pick: p.dr.pick, tid: +k }; p.draftTid = +k; const y3 = p.draft + 3, y4 = p.draft + 4; p.opt = y3 > 2027 ? { kind: 'team', season: y3 } : y4 > 2027 ? { kind: 'team', season: y4 } : undefined; }
      else p.ctype = p.amt <= minS * 1.05 ? 'min' : p.amt >= N.CAP * 0.245 ? 'max' : 'standard';
      if (!p.opt && p.ctype !== 'rookie' && p.exp > 2027 && rnd() < 0.2) p.opt = { kind: rnd() < 0.75 ? 'player' : 'team', season: p.exp };
      if (p.amt >= N.CAP * 0.15 && rnd() < 0.12) p.kicker = 0.15;
      if (yos >= 8 && p.yrsWith >= 4 && p.ovr >= 66 && rnd() < 0.5) p.ntc = true;
    }));
    [...(this.db.fa || []), ...(this.db.os || [])].forEach(id => { const p = P[id]; p.raise = 0.05; p.ctype = 'standard'; });
  }
  // Start-screen option: the teams you picked take the league's worst rosters (the first
  // pick gets the very worst), swapping with whoever had them: the weakest on the floor today,
  // without a stash of prospects (the weakest roster is usually a rebuilder's, full of raw kids
  // with real ceilings). Its young players with real upside go to other teams, one for one, for
  // veterans about as good today with little upside left; one modest prospect may stay.
  swapToWorst(tids: number[]) {
    const d = this.db, P = d.P, done: number[] = [];
    tids.forEach(mine => {
      const worst = d.teams.map(t => t.tid).filter(t => !done.includes(t)).sort((a, b) => teamRating(P, d.rosters[a]) - teamRating(P, d.rosters[b]))[0];
      if (worst != null && worst !== mine) { [d.rosters[mine], d.rosters[worst]] = [d.rosters[worst], d.rosters[mine]]; const a = d.teams[mine], b = d.teams[worst]; [a.str, b.str] = [b.str, a.str]; }
      done.push(mine);
      this.thinProspects(mine, [...new Set([...tids, ...done])]);
    });
    // The first pick still gets the very worst of them.
    const built = tids.map(t => ({ ids: d.rosters[t], str: d.teams[t].str })).sort((a, b) => teamRating(P, a.ids) - teamRating(P, b.ids));
    tids.forEach((t, i) => { d.rosters[t] = built[i].ids; d.teams[t].str = built[i].str; });
  }
  private thinProspects(mine: number, keepOut: number[]) {
    const d = this.db, P = d.P, tp = (p: any) => p.tpot ?? p.pot, tr = (t: number) => teamRating(P, d.rosters[t]);
    const others = () => d.teams.map(t => t.tid).filter(t => !keepOut.includes(t));
    const put = (t: number | 'fa', out: number, inn: number) => { const L = t === 'fa' ? d.fa : d.rosters[t]; L[L.indexOf(out)] = inn; };
    const trade = (p: any, q: any, t: number | 'fa') => { put(mine, p.id, q.id); put(t, q.id, p.id); p.yrsWith = 0; q.yrsWith = 0; };
    const vet = (q: any) => q.age >= 24 && tp(q) - q.ovr <= 3 && !q.ntc && !q.rookie, grp = (q: any, p: any) => (q.grp === p.grp ? 0 : 1); // a veteran with little upside left; same position group first
    const young = d.rosters[mine].map(id => P[id]).filter(p => p.age <= 23 && tp(p) >= 56).sort((a, b) => tp(a) - tp(b));
    const stay = young.length && tp(young[0]) < 64 ? young[0].id : null;
    young.filter(p => p.id !== stay).forEach(p => {
      const deep = d.rosters[mine].map(id => P[id].ovr).sort((a, b) => b - a).indexOf(p.ovr) >= 10; // past the top ten: barely counts in the team rating
      const pool = (cap: number) => [...others().flatMap(t => d.rosters[t].map(id => ({ q: P[id], t: t as number | 'fa' }))), ...d.fa.map(id => ({ q: P[id], t: 'fa' as number | 'fa' }))]
        .filter(({ q }) => q && q.r && vet(q) && q.ovr <= p.ovr + cap && q.ovr >= p.ovr - 8)
        .sort((a, b) => grp(a.q, p) - grp(b.q, p) || (a.t === 'fa' ? 1 : 0) - (b.t === 'fa' ? 1 : 0) || (Math.abs(p.ovr - a.q.ovr) + Math.abs(a.q.amt - p.amt) * 0.6) - (Math.abs(p.ovr - b.q.ovr) + Math.abs(b.q.amt - p.amt) * 0.6)); // closest in level and salary (payrolls hold)
      const m = pool(0)[0] || (deep ? pool(6)[0] : null);
      if (m) trade(p, m.q, m.t);
    });
    // Still the weakest roster: if not, his best player goes for a slightly weaker veteran from the
    // weakest of the rest, until it is.
    for (let i = 0; i < 6; i++) {
      const rest = others(), low = rest.sort((a, b) => tr(a) - tr(b))[0];
      if (low == null || tr(mine) <= tr(low)) break;
      const best = d.rosters[mine].map(id => P[id]).sort((a, b) => b.ovr - a.ovr)[0];
      const q = d.rosters[low].map(id => P[id]).filter(x => x.ovr < best.ovr && x.age >= 24 && tp(x) - x.ovr <= 3 && !x.ntc).sort((a, b) => b.ovr - a.ovr)[0];
      if (!q) break; trade(best, q, low);
    }
  }
  // Team cards for the start screen, from the same seeded world create() would build.
  static preview(seed = 2027) {
    const g = new Game();
    const d = g.makeDB(seed), P = d.P;
    const top8 = t => teamRating(P, d.rosters[t.tid]);
    const out = d.teams.map(t => { const ids = d.rosters[t.tid], star = ids.map(id => P[id]).sort((a, b) => b.ovr - a.ovr)[0];
      return { tid: t.tid, region: t.region, name: t.name, abbr: t.abbr, conf: t.conf, div: t.div, colors: t.colors, icon: t.icon, mkt: t.mkt, arch: t.arch, owner: t.owner, top8: top8(t), payroll: ids.reduce((a, id) => a + P[id].amt, 0), star: { name: star.name, pos: star.pos, ovr: star.ovr, age: star.age } }; });
    const rk = out.slice().sort((a, b) => b.top8 - a.top8).map(t => t.tid);
    const hop = hopelessTid(g); // the roster "Give me the most hopeless roster" starts from (startRoster.ts)
    out.forEach(t => { const r = rk.indexOf(t.tid) + 1; t.rank = r; t.outlook = r <= 8 ? 'Contender' : r <= 20 ? 'In the mix' : 'Rebuilding'; t.hopeless = t.tid === hop; });
    return out;
  }

  static load(data: SaveData) {
    const g = new Game();
    g.db = { ...data.db, C: countries() };
    g.state = { ...data.state, ...TRANSIENT, simming: null, screen: data.state.screen === 'game' ? 'dash' : data.state.screen };
    if ((g.db.v || 1) < 2) g.migrateV1();
    if (!g.state.tstats) g.state.tstats = {};
    // Teams renamed in 2026 to fit their cities: saves that kept the old default nicknames update.
    const fix = (t: any) => { if (t && (OLD_NICKNAMES[t.abbr] || []).includes(t.name)) { const nt = TEAMS.find(x => x[2] === t.abbr), fr = FRANCHISES.find(x => x.abbr === t.abbr), nm = nt ? nt[1] : fr?.name; if (nm) { t.name = nm; Object.assign(t, { icon: nt ? teamStyle(t.abbr).icon : fr!.icon }); } } };
    g.db.teams.forEach(fix); g.state.teams = g.state.teams.map((t: any) => { const c = { ...t }; fix(c); return c; });
    if (!g.state.managed) g.migrateV2();
    // Relatives trimmed to a name-only record before families were exempt: they take their look
    // and heritage back from a son or brother.
    (Object.values(g.db.P) as any[]).forEach((q: any) => (q.family || []).forEach((f: any) => { const r = g.db.P[f.pid]; if (r && r.gone && !r.race && q.race) Object.assign(r, { race: q.race, her: r.her || q.her, heritage: r.heritage || q.heritage }); }));
    // Players an old fire sale "waived" into nowhere (off every roster, not in free agency): back to free agency.
    { const st = g.state, on = new Set<number>([...(Object.values(st.rosters || {}).flat() as number[]), ...(st.fa || []), ...(st.overseas || []), ...Object.values(g.db.cls || {}).flat() as number[], ...((st.picks || []).map((x: any) => x.pid).filter((x: any) => x != null))]);
      const lost = (Object.values(g.db.P) as any[]).filter(p => p.r && !p.retired && !p.gone && p.cls == null && !on.has(p.id) && (p.tx || []).some((t: any) => /fire sale/i.test(t.text || '')));
      if (lost.length) g.state = { ...g.state, fa: [...lost.map(p => p.id), ...(st.fa || [])] }; }
    // Kared Jushner was renamed Tanner Matthews.
    if (g.state.teams.some((t: any) => t.owner === 'Kared Jushner')) g.state = { ...g.state, teams: g.state.teams.map((t: any) => t.owner === 'Kared Jushner' || (t.sales || []).some((x: any) => x.to === 'Kared Jushner' || x.from === 'Kared Jushner') ? { ...t, owner: t.owner === 'Kared Jushner' ? 'Tanner Matthews' : t.owner, sales: (t.sales || []).map((x: any) => ({ ...x, to: x.to === 'Kared Jushner' ? 'Tanner Matthews' : x.to, from: x.from === 'Kared Jushner' ? 'Tanner Matthews' : x.from })) } : t) };
    // 2026-09: the hand-written owners join older leagues (never on a team you run).
    if (!g.db.ownersV) { const st = { ...g.state, teams: g.state.teams.map((t: any) => ({ ...t })) }; placeNamedOwners(st.teams, tid => g.isUser(g.state, tid)); g.state = { ...g.state, teams: st.teams }; g.db.ownersV = 1; }
    // 2026-10: owners get a background each (how the money was made, how they got the team), stored so it never changes.
    // 2026-10: draft surprises. Prospects (and this June's draftees who haven't been to camp yet) get their hidden translation.
    // 2026-10: prospects not yet in the league get a body ahead of their game, like new ones (development.ts).
    if (!g.db.bodyV) { Object.keys(g.db.cls || {}).forEach(y => { if (+y >= g.Y) (g.db.cls[y] || []).forEach((id: number) => { const p = g.db.P[id]; if (p && !p.retired && !p.gone && !(p.stats || []).length) { bodyAhead(p, p.pot - p.ovr); syncOvr(p); } }); }); g.db.bodyV = 1; }
    // 2026-10: potential becomes a ceiling (potential.ts). The old potential was his expected peak: his
    // ceilings are set so a typical career reaches it, and the league's read of it starts a little off.
    // 2026-10: the height rating mostly follows his listed height now (ratings.ts); his overall doesn't move.
    // 2026-10: training camp used to add every pick two years out a second time. One copy of each stays:
    // the first, the one trades, protections and swaps found and updated.
    { const seen = new Set<string>(); g.state = { ...g.state, assets: (g.state.assets || []).filter((a: any) => !seen.has(a.id) && !!seen.add(a.id)) }; }
    g.state = { ...g.state, assets: g.ensureAssets(g.state) }; // picks through the trading horizon
    if (!g.db.hgtV) { Object.values(g.db.P).forEach((p: any) => { if (!p?.r || p.gone || p.retired || !p.hgt) return; setHgtKeepOvr(p, blendHeight(p, p.r.hgt)); syncOvr(p); }); g.db.hgtV = 1; }
    if (!g.db.ceilV) { Object.values(g.db.P).forEach((p: any) => { if (!p?.r || p.gone || p.retired) return; initCeil(p, Math.max(p.ovr, p.pot ?? p.ovr)); rollPerr(p, p.age <= 22 ? (p.cls ? 3.5 : 2.5) : p.age <= 26 ? 1.2 : 0); refreshPot(p); }); g.db.ceilV = 1; }
    if (!g.db.dxV) { Object.keys(g.db.cls || {}).forEach(y => { if (+y >= g.Y) (g.db.cls[y] || []).forEach((id: number) => { const p = g.db.P[id]; if (p && !p.retired && !p.gone && !(p.stats || []).length) ensureTranslation(p); }); }); g.db.dxV = 1; }
    if (!g.db.ownerBgV) { g.state = { ...g.state, teams: stampOwnerBgs(g.state.teams) }; g.db.ownerBgV = 1; }
    // 2026-09 repaint: teams still in their original default colors get the new, louder ones.
    if ((g.db.paletteV || 1) < PALETTE_V) { const same = (a: any, b: any) => a && b && a[0]?.toLowerCase() === b[0]?.toLowerCase() && a[1]?.toLowerCase() === b[1]?.toLowerCase();
      const repaint = (t: any) => { const nw = LOUD_COLORS[t?.abbr]; if (nw && (same(t.colors, CLASSIC_COLORS[t.abbr]) || same(t.colors, TEAM_STYLE[t.abbr]?.colors))) t.colors = nw; };
      g.db.teams.forEach(repaint); g.state.teams = g.state.teams.map((t: any) => { const c = { ...t }; repaint(c); return c; }); g.db.paletteV = PALETTE_V; }
    // Older saves: the overall becomes the ratings (position-weighted; ratings.ts), the ceiling moving with it.
    if (!g.db.ovrV) { (Object.values(g.db.P) as any[]).forEach(p => { if (p.r) syncOvr(p, true); }); g.db.ovrV = 1; }
    // Older saves: free agents' asks above their max, or not discounted for age (askOf).
    // Luka's ready-made card: a road villain and fearless, not crowd-fed (saved libraries included).
    (g.state.cards || []).forEach((c: any) => { const p = c.card?.pers; if (c.id === 'preset0' && p && p.crowd && p.villain === undefined) Object.assign(p, { crowd: false, villain: true, fearless: true }); });
    // ...and retuned to his real 2018–19 shooting splits: an unedited saved copy takes the new build.
    (g.state.cards || []).forEach((c: any) => { if (c.id === 'preset0' && c.card?.r?.fg === 45 && c.card?.r?.tp === 56 && c.card?.r?.oiq === 82) { const nw = PRESET_CARDS[0].card; c.card = { ...c.card, r: { ...nw.r }, tend: { ...nw.tend }, intg: { ...nw.intg } }; } });
    // 2026-10: seven more ready-made rookie cards (Knecht, Simmons, Horford, Paul, Thompson, Leonard, Howard) join saved card libraries, once.
    if (g.state.cards && !g.state.cardsV) { const have = new Set(g.state.cards.map((c: any) => c.id)); g.state = { ...g.state, cardsV: 2, cards: [...g.state.cards, ...PRESET_CARDS.map((x, i) => ({ id: 'preset' + i, card: { ...JSON.parse(JSON.stringify(x.card)), label: x.label } })).filter(c => c.id !== 'preset0' && !have.has(c.id))] }; }
    if (!g.db.askV) { (g.state.fa || []).forEach((id: number) => { const p = g.db.P[id]; if (p && !p.rfa) p.ask = Math.min(p.ask || 0, askOf(g, p)); }); g.db.askV = 1; }
    // Older saves: give everyone Feel and Poise, and young players their chance at being a hidden gem.
    (Object.values(g.db.P) as any[]).forEach(p => { if (!p.intg) { ensureIntg(p); rollGem(p, seeded(p.id * 31 + 5), 0.05); } });
    // Tactics renamed in 2026 (Inside → Post-up, Perimeter → Five-out).
    [g.state, ...Object.values(g.state.clubs || {})].forEach((c: any) => { migrateTactics(c?.tactics); migrateTactics(c?.situ?.lead); migrateTactics(c?.situ?.trail); });
    if (!g.db.norms || g.db.norms.season !== g.state.season) g.refreshNorms(g.state);
    ccpRefreshClubs(g.state);     removeUnplayed(g, g.state); slimRetired(g); // older saves: remove retirees who never played here, trim the rest
    // Saves from before the CCP: set up this season's (played to date) unless it's the summer.
    if (!g.state.ccp && !['fa', 'preseason'].includes(g.state.phase)) { const st = g.state, fa = st.fa.slice(); ccpNewSeason(g, st); ccpTopUp(g, st, fa); st.fa = fa; ccpPlay(g, st, st.phase === 'regular' ? dnOf(g.Y, g.dateOf(st.day)) : 999); }
    // Saves from before layups / acceleration / box out / measured wingspans: derive them.
    Object.values(g.db.P).forEach((p: any) => { if (!p.r) return; const h = (x: number) => (((p.id * x + 7) >>> 0) % 1000 / 1000 - 0.5), c = (v: number) => Math.round(Math.max(4, Math.min(100, v)));
      if (p.r.lay == null) p.r.lay = c((p.r.dnk + p.r.ins) / 2 + (p.grp === 'G' ? 4 : 0) + h(97) * 16);
      if (p.r.acc == null) p.r.acc = c(p.r.spd + (p.grp === 'G' ? 2 : p.grp === 'B' ? -3 : 0) + h(131) * 14);
      if (p.r.box == null) p.r.box = c(p.r.reb * 0.45 + p.r.stre * 0.35 + p.r.hgt * 0.2 + h(173) * 20);
      // Saves from before Blocks and Steals: derived from his body, quickness and length (the overall is re-synced below).
      if (p.r.blk == null || p.r.stl == null) deriveDefenseKeepOvr(p, k => h(k === 1 ? 241 : 251));
      if (p.wing == null) { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/), hIn = m ? +m[1] * 12 + +m[2] : 78; p.wing = hIn + Math.round(Math.max(-6, Math.min(12, (h(211) + h(223) + h(227)) * 6 + 3.8))); } });
    // Saves from before evolving tendencies: each player's style starts where his game and role point.
    { const rk = optionRanks(g.db.P, g.state.rosters || {}); Object.values(g.db.P).forEach((p: any) => { if (p.r && !p.retired && !p.ten) initTendencies(p, rk.get(p.id) ?? null); }); }
    // 2026-10: shot volume follows the offensive game, role and personality, not the overall (sim.ts usageRaw,
    // tendencies.ts): saved usage tendencies start over from the new target plus each player's quirk (the
    // change-since-summer arrow kept), and the league's usage mean moves to the new scale.
    // 2026-10: tendencies become the NBA's tracked shot categories (tendencies.ts: zones, catch & shoot,
    // pull-ups, free throw rate, usage): every player moves over (hand-set multipliers too), and the
    // league's shot-mix norms are recomputed for the new mix.
    if (!g.db.ten3) { (Object.values(g.db.P) as any[]).forEach(p => { if (p.r && (p.ten || !p.retired)) ensureTen(p); }); g.refreshNorms(g.state); g.db.ten3 = 1; }
    if (!g.db.usgV) { const st = g.state, R = st.rosters || {}, rk = optionRanks(g.db.P, R), md = g.strategies(st.teams, st, true), tOf = new Map<number, number>(); Object.keys(R).forEach(k => R[k].forEach((id: number) => tOf.set(id, +k)));
      Object.values(g.db.P).forEach((p: any) => { if (!p.r || p.retired || !p.ten || p.tenLock) return; const nx = Math.round(Math.max(2, Math.min(98, tenTargets(p, { rank: rk.get(p.id) ?? null, mode: md[tOf.get(p.id) as number] }).usage + quirkOf(p, 'usage')))); if (p.tenPrev?.usage != null) p.tenPrev.usage += nx - p.ten.usage; p.ten.usage = nx; });
      const old = g.db.norms; g.refreshNorms(st); if (old) g.db.norms = { ...old, usage: g.db.norms.usage }; g.db.usgV = 1; }
    // Monthly reports written before Acceleration had a short name read "undefined +0.2": fix the text.
    { const fixR = (x: any) => x && JSON.parse(JSON.stringify(x).replace(/undefined ([+-]\d)/g, 'Acc $1')); if (g.state.reports) g.state.reports = fixR(g.state.reports); if (g.state.clubs) Object.values(g.state.clubs).forEach((c: any) => { if (c?.reports) c.reports = fixR(c.reports); }); }
    // Saves from before wingspan counted toward the overall.
    Object.values(g.db.P).forEach((p: any) => { if (p.r && !p.wOvr) { const w = Math.round(wngBonus(p)); p.ovr = Math.max(1, Math.min(100, p.ovr + w)); p.pot = Math.max(p.ovr, Math.min(100, p.pot + w)); p.wOvr = 1; } });
    // Saves from before the Team player trait: hand it out the same way new players get it.
    Object.values(g.db.P).forEach((p: any) => { if (p.pers && p.pers.streaky === undefined) p.pers.streaky = ((p.id * 2246822519) >>> 0) % 100 < 12; }); // 2026-10: the Streaky trait
    Object.values(g.db.P).forEach((p: any) => { if (p.pers && p.pers.work == null) p.pers.work = workEthicOf(p.id); }); // 2026-10: every player has a work ethic (it was missing)
    Object.values(g.db.P).forEach((p: any) => { if (p.pers && p.pers.team === undefined) p.pers.team = !p.pers.alpha && !p.pers.padder && !p.pers.touches && ((p.id * 2654435761) >>> 0) % 100 < 30; if (p.pers && p.pers.legacy === undefined) p.pers.legacy = ((p.id * 40503 + 7) >>> 0) % 100 < 12; if (p.pers && p.pers.mal === undefined) { const h = (x: number) => ((p.id * x + 11) >>> 0) % 1000 / 1000; p.pers.mal = Math.round(Math.max(3, Math.min(97, 50 + (h(2654435761) + h(40503) + h(97) - 1.5) * 45))); } });
    assignNumbers(g.db.P, g.state.rosters, undefined, retiredNums(g.state.teams)); g._rosterRef = g.state.rosters;
    snapOpening(g, g.state); // a baseline for year-over-year progress (older saves start it now)
    return g;
  }

  // Saves from the first version: estimated stats, the user's schedule only, a January start.
  private migrateV1() {
    const d = this.db, s = this.state;
    d.v = 2; d.firstSeason = 2027; d.lgRate = {}; d.midStart = true;
    d.days = this.buildSchedule(s.teams.length);
    delete d.sched;
    const style = t => { if (!t.colors) Object.assign(t, teamStyle(t.abbr)); };
    d.teams.forEach(style); s.teams.forEach(style);
    (Object.values(d.P) as any[]).forEach(p => { p.stats = []; Object.assign(p, { gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0 }); });
  }

  // Saves from before multi-team control: the user ran tid 0 and results were user-only.
  private migrateV2() {
    const s = this.state;
    s.managed = [0]; s.me = 0; s.clubs = {}; s.situ = s.situ || null; s.inbox = s.inbox || [];
    s.games = (s.results || []).map(r => ({ day: r.day, h: r.home ? 0 : r.opp, a: r.home ? r.opp : 0, hp: r.home ? r.us : r.them, ap: r.home ? r.them : r.us }));
    delete s.results;
  }

  toSave(): SaveData {
    const { C, ...db } = this.db;
    return { db, state: { ...this.state, ...TRANSIENT } };
  }

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getVersion = () => this.version;

  // Same contract as React's class setState: an object patch or an updater returning one (or null for no change).
  setState(u: any, cb?: () => void) {
    const patch = typeof u === 'function' ? u(this.state) : u;
    if (patch) {
      this.state = { ...this.state, ...patch };
      if (patch.rosters && this.db?.P) { const prev = this._rosterRef || {}, ch = Object.keys(patch.rosters).map(Number).filter(t => patch.rosters[t] !== prev[t]); assignNumbers(this.db.P, patch.rosters, ch, retiredNums(this.state.teams)); this._rosterRef = patch.rosters; }
      this.version++;
      // During a multi-day sim the screen redraws at most every 250 ms (the rest is caught up at the end).
      const now = Date.now();
      if (this.quiet && now - this.lastEmit < 250) this.pendingEmit = true;
      else { this.lastEmit = now; this.pendingEmit = false; this.listeners.forEach(l => l()); }
    }
    if (cb) cb();
  }
  private quiet = false; private lastEmit = 0; private pendingEmit = false;
  private stopReq = false;
  stopSim() { this.stopReq = true; this.specStop = true; }
  // Spectator Mode (spectator.ts): the AI runs every team; the driver runs the season toward a goal.
  spectating = false; specStop = false; specLabel = '';
  enterSpectator() { enterSpectator(this); }
  manageTeam(tid: number) { manageTeam(this, tid); }
  spectate(goal: SpecGoal) { return spectate(this, goal); }
  private flushEmit() { this.quiet = false; if (this.pendingEmit) { this.pendingEmit = false; this.lastEmit = Date.now(); this.listeners.forEach(l => l()); } }

  get CAP() { return this.db.caps.CAP; }
  get MINP() { return this.db.caps.MINP; }
  get TAX() { return this.db.caps.TAX; }
  get AP1() { return this.state?.capEasy ? this.db.caps.AP2 : this.db.caps.AP1; } // cap easy mode: no 1st apron
  get AP2() { return this.db.caps.AP2; }
  get VMIN() { return this.db.caps.VMIN; }
  get MLE() { return this.db.caps.MLE; }
  get MAXC() { return this.db.caps.MAXC; }

  // World-generation randomness comes from the saved seed stream; game results use Math.random.
  rnd() { return nextRandom(this.db); }
  wpick(o) { const e: [string, any][] = (Object.entries(o) as [string, any][]); let t = e.reduce((a, x) => a + x[1], 0) * this.rnd(); for (const [k, w] of e) { t -= w; if (t <= 0) return k; } return e[0][0]; }

  // Faces mix in the league's seed (the same id looks different in every league) and resemble a
  // relative: his father, or without one in the league, his eldest brother. A birthday redraws him
  // (grey, hairline, lines).
  face(pid) { const c = this.faceCache[pid], p = this.db.P[pid]; if (c && c.age?.years === (p?.age ?? 25)) return c; return (this.faceCache[pid] = makeFace(p || { id: pid }, this.db.seed | 0, p ? this.kinFace(p, 0) : undefined)); }
  private kinFace(p, depth) {
    const P = this.db.P, fam = p.family || []; if (depth > 3 || !fam.length) return undefined;
    const k = fam.find(x => x.rel === 'father' && P[x.pid]) || fam.filter(x => x.rel === 'brother' && P[x.pid] && x.pid < p.id).sort((a, b) => a.pid - b.pid)[0];
    return k ? makeFace(P[k.pid], this.db.seed | 0, this.kinFace(P[k.pid], depth + 1)) : undefined;
  }
  resetFace(pid) { delete this.faceCache[pid]; (this.db.P[pid]?.family || []).forEach(x => delete this.faceCache[x.pid]); }
  // God Mode: a fresh set of ratings around his overall, shaped by his position (height stays).
  randomRatings(p) { const o = p.ovr; RATING_KEYS.forEach(k => { if (k !== 'hgt') p.r[k] = Math.round(this.cl(o + (BIAS[p.grp]?.[k] || 0) + (Math.random() - .5) * 22, 4, 100)); }); deriveDefense(p, () => Math.random() - .5); syncOvr(p); }
  // God Mode: a player now represents another country. Heritage, look and name follow it.
  renationalize(p, code, withName = true) {
    const C = this.db.C; if (!C[code]) return null;
    const undo = { pid: p.id, rep: p.rep, her: p.her, race: p.race, heritage: p.heritage, mix: p.mix, tribe2: p.tribe2, familyFirst: p.familyFirst, name: p.name, native: p.native, first: p.first, last: p.last, nativeFirst: p.nativeFirst, nativeLast: p.nativeLast };
    // Eligibility isn't touched: you manage it yourself on the player's profile.
    p.rep = C[code].repAs || code; // tribal nations: heritage and name change, he still represents the U.S.
    p.her = code; const nm = randomName(code); p.race = nm.race; p.heritage = nm.heritage; delete p.mix; delete p.tribe2; this.resetFace(p.id);
    if (withName) { const { race, heritage, ...name } = nm; void race; void heritage; Object.assign(p, name); }
    return undo;
  }
  // Jersey in the team's colors; free agents and prospects wear grey.
  // Faces are drawn once per look (face + team colors) and reused: drawing them is slow.
  private faceElCache = new WeakMap<object, Map<string, any>>(); // per face (replaced when the face changes) and team colors
  faceEl(pid, tid) { const p = this.db.P[pid]; if (p?.faceImg) return createElement('img', { src: p.faceImg, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }); const t = tid >= 0 && this.state?.teams[tid], f = this.face(pid), cols = t && t.colors ? t.colors : undefined, key = cols ? cols.join() : '';
    let m = this.faceElCache.get(f); if (!m) { m = new Map(); this.faceElCache.set(f, m); } let el = m.get(key); if (!el) { el = faceSvg(f, cols); m.set(key, el); } return el; }
  downloadFaces() {
    const out = (Object.values(this.db.P) as any[]).map((p: any) => ({ id: p.id, name: p.name, heritage: this.db.C[p.her].n, face: this.face(p.id) }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'faces.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  makeDB(seed: number) {
    const db: any = this.db = { v: 2, ovrV: 1, askV: 1, seed, rs: seed, nid: 1, P: {}, C: countries(), caps: { ...CAPS0 }, firstSeason: 2027, lgRate: {} };
    const rnd = () => this.rnd(), cl = this.cl, pick = a => a[Math.floor(rnd() * a.length)];
    const P = db.P, NP = namePools(), CLUBS = clubs(), W_NBA = natDefault();
    const mk = (base, age, Wt, cls, forceGrp?) => this.mkPlayer(base, age, Wt, cls, forceGrp);
    const teams: any[] = TEAMS.map((t, i) => ({ tid: i, region: t[0], name: t[1], abbr: t[2], conf: t[3], div: t[4], str: 45 + rnd() * 12, mkt: MARKETS[i], ...teamStyle(t[2]), seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 }));
    teams.forEach((t, i) => { t.owner = pick(NP.us.f) + ' ' + pick(OWNER_SURNAMES); t.arch = pick(OWNER_ARCHETYPES); t.gm = pick(NP.us.f) + ' ' + pick(NP.us.l); });
    placeNamedOwners(teams); // Panny Macquiao, Mao Ying, Tanner Matthews and the Aurelian fund (owners.ts)
    const rosters = {};
    // Team situations, like the real league: contenders built on veteran stars, good teams, capped-out
    // teams paying above-average starters with no young stars and no room (think Sacramento), the
    // middle, rebuilders with young high-ceiling prospects, and hopeless teams: bad, no young talent,
    // bad contracts. Ages follow ratings: young stars are rare, most 20–22-year-olds are still raw.
    const KIND: [string, number, number, number][] = [['contender', 5, 54, 56.5], ['good', 6, 51.5, 54], ['capped', 4, 50, 52.5], ['middling', 4, 48, 51], ['rebuild', 6, 45, 48], ['hopeless', 5, 45, 47.5]];
    const kinds = KIND.flatMap(([k, n]) => Array(n).fill(k)); for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const ageFor = (kind: string, k: number, base: number) => {
      const x = rnd(), star = base >= 58;
      const pYoung = (kind === 'rebuild' ? (k < 5 ? 0.6 : 0.35) : kind === 'contender' ? 0.08 : kind === 'capped' ? 0.04 : kind === 'hopeless' ? 0.1 : kind === 'good' ? 0.15 : 0.2) * (star && kind !== 'rebuild' ? 0.3 : 1);
      const pOld = kind === 'contender' || kind === 'capped' || kind === 'hopeless' ? (k < 6 ? 0.3 : 0.35) : 0.15;
      if (x < pYoung) return 20 + Math.floor(rnd() * 3);
      if (x < pYoung + pOld) return 31 + Math.floor(rnd() * 5);
      return star ? 25 + Math.floor(rnd() * 6) : 23 + Math.floor(rnd() * 8);
    };
    teams.forEach((t, ti) => {
      const kind = kinds[ti % kinds.length], K = KIND.find(x => x[0] === kind)!; t.kind = kind; t.str = K[2] + rnd() * (K[3] - K[2]);
      const slots = ['G', 'G', 'G', 'G', 'G', 'W', 'W', 'W', 'W', 'B', 'B', 'B', 'B', 'B'];
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      const ps = []; for (let k = 0; k < 14; k++) {
        let base = t.str + 12 - k * 2.2 + (rnd() - .5) * 6;
        // Real superstars (75+): contenders and good teams build around one; capped-out and hopeless teams don't have one.
        if (k === 0) base += ({ contender: 9, good: 7, middling: 5, rebuild: 3, capped: 2, hopeless: 0 } as any)[kind] + rnd() * 5;
        if (k === 1 && (kind === 'contender' || kind === 'good')) base += 2 + rnd() * 3;
        const age = ageFor(kind, k, base);
        if (age <= 22) base -= (23 - age) * 2.5; // still raw at 20–22
        const p = mk(base, age, W_NBA, 0, slots[k]);
        // Rebuilders' kids have real ceilings; the hopeless team's don't.
        if (age <= 22) { p.pot = Math.max(p.ovr, Math.round(kind === 'rebuild' ? p.ovr + 10 + rnd() * 16 : kind === 'hopeless' ? p.ovr + 3 + rnd() * 6 : p.pot)); initCeil(p, p.pot); refreshPot(p); }
        // Capped-out teams overpaid their starters on long deals; hopeless teams carry a couple of bad contracts.
        if ((kind === 'capped' && k < 6 && age >= 25) || (kind === 'hopeless' && age >= 28 && rnd() < 0.35)) { p.amt = Math.min(this.MAXC, p.amt * (1.35 + rnd() * 0.25) + 4); p.exp = Math.max(p.exp, 2029 + Math.floor(rnd() * 2)); }
        ps.push(p);
      }
      ps.sort((a, b) => b.ovr - a.ovr);
      rosters[t.tid] = ps.map(p => p.id);
    });
    // About 90 unsigned players at any time in season, like the NBA's pool of veterans, CCP
    // call-up candidates and undrafted players: a few useful vets, the rest end-of-bench types.
    const fa = []; for (let k = 0; k < 90; k++) fa.push(mk(k < 5 ? 54 + rnd() * 6 : k < 25 ? 47 + rnd() * 8 : 38 + rnd() * 12, 22 + Math.floor(rnd() * 13), W_NBA, 0).id);
    const os = []; for (let k = 0; k < 22; k++) { const p = mk(44 + rnd() * 12, 22 + Math.floor(rnd() * 8), W_NBA, 0); const cc0 = CLUBS[p.raised] ? p.raised : pick(['ES', 'FR', 'TR', 'GR', 'IT', 'DE', 'CN', 'AU', 'IL', 'LT']), k2 = pick(CLUBS[cc0]), out = rnd() < .45;
      p.abroad = { club: k2[0], lg: k2[1], country: cc0, pts: +(8 + (p.ovr - 44) * 1.1 + rnd() * 4).toFixed(1), reb: +(2 + p.r.reb / 14 + rnd() * 2).toFixed(1), ast: +(1 + p.r.pss / 18 + rnd() * 2).toFixed(1), clause: out ? 'NBA out clause' : 'Buyout', fee: +(out ? .3 + rnd() * .7 : 1.5 + rnd() * 3.5).toFixed(1) }; os.push(p.id); }
    const cls = { 2027: [], 2028: [], 2029: [] };
    for (let k = 0; k < 105; k++) { const p = mk(29 + rnd() * 14, 19 + Math.floor(rnd() * 3), W_NBA, 2027); p.pot = this.prospectPot(p, rnd); cls[2027].push(p.id); }
    for (let k = 0; k < 100; k++) { const p = mk(24 + rnd() * 11, 17 + Math.floor(rnd() * 2), W_NBA, 2028); p.pot = this.prospectPot(p, rnd); cls[2028].push(p.id); }
    for (let k = 0; k < 100; k++) { const p = mk(21 + rnd() * 10, 16 + Math.floor(rnd() * 2), W_NBA, 2029); p.pot = this.prospectPot(p, rnd); cls[2029].push(p.id); }
    (Object.values(P) as any[]).filter(p => p.cls).forEach(p => { p.exp = p.cls + 3; });
    // Real draft slots for today's players: each past class gets unique picks 1–60
    // (best prospects first, with some noise); the rest went undrafted.
    const byYear: Record<number, any[]> = {};
    (Object.values(P) as any[]).filter(p => !p.cls && p.dr).forEach(p => (byYear[p.draft] = byYear[p.draft] || []).push(p));
    Object.values(byYear).forEach(ps => ps.map(p => ({ p, k: p.pot + rnd() * 14 })).sort((a, b) => b.k - a.k).forEach(({ p }, i) => {
      p.dr = i < 60 ? { rd: i < 30 ? 1 : 2, pick: (i % 30) + 1 } : null;
      p.rookie = !!p.dr && p.dr.rd === 1 && 2026 - p.draft <= 3; if (p.rookie) p.exp = Math.max(2027, p.draft + 4);
    }));
    // Scale contracts so the average payroll sits near $172M, then pull every team
    // between the salary floor and the 2nd apron (real payrolls cluster there).
    const tot = Object.values(rosters).reduce((a: number, ids: any) => a + ids.reduce((x, id) => x + P[id].amt, 0), 0) as number;
    const sf = 172 * teams.length / tot;
    Object.values(P).forEach((p: any) => { p.amt *= sf; });
    // First-round picks still on their rookie deals are paid on the rookie scale, not by rating.
    Object.values(P).forEach((p: any) => { if (p.rookie && p.dr) p.amt = this.rookieAmt(Math.min(30, p.dr.pick)) * CAPS0.CAP / 165; });
    Object.values(rosters).forEach((ids: any) => { const vet = ids.filter(id => !P[id].rookie), fixed = ids.filter(id => P[id].rookie).reduce((x, id) => x + P[id].amt, 0), pay = vet.reduce((x, id) => x + P[id].amt, 0) + fixed, tgt = pay < CAPS0.MINP + 2 ? CAPS0.MINP + 2 + rnd() * 14 : pay > CAPS0.AP2 ? CAPS0.AP2 - 2 - rnd() * 10 : pay; if (tgt !== pay && pay > fixed) vet.forEach(id => (P[id].amt *= (tgt - fixed) / (pay - fixed))); });
    (Object.values(P) as any[]).forEach(p => { p.amt = +cl(p.amt, p.age <= 22 ? 1.35 : 2.44, this.MAXC).toFixed(1); p.ask = +Math.max(2.44, p.amt * (p.mood === 'Eager' ? 0.9 : p.mood === 'Reluctant' ? 1.25 : 1)).toFixed(1); });
    // Families. Former players from before the league's records (fathers for future sons),
    // then brothers and sons among today's players and prospects at real NBA rates.
    for (let k = 0; k < 60; k++) { const p = mk(44 + rnd() * 26, 40 + Math.floor(rnd() * 22), W_NBA, 0); p.retired = { season: 2026 - Math.floor(rnd() * Math.max(1, p.age - 35)), age: 34 + Math.floor(rnd() * 5), tid: -1, why: 'Retired', legacy: true }; p.draft = 2026 - (p.age - 21); legacyCareer(p, rnd); }
    { const used = new Set((Object.values(P) as any[]).filter(p => p.dr && !p.legacy).map(p => p.draft + '-' + p.dr.rd + '-' + p.dr.pick));
      (Object.values(P) as any[]).filter(p => p.legacy).forEach(p => { if (!p.dr) return; let n = 1 + Math.floor(rnd() * 40); for (let k = 0; k < 60 && used.has(p.draft + '-' + (n <= 30 ? 1 : 2) + '-' + (((n - 1) % 30) + 1)); k++) n = (n % 60) + 1; p.dr = { rd: n <= 30 ? 1 : 2, pick: ((n - 1) % 30) + 1 }; used.add(p.draft + '-' + p.dr.rd + '-' + p.dr.pick); }); }
    const st0 = { rosters, fa, overseas: os }; db.cls = cls;
    const everyone = [...Object.values(rosters).flat(), ...fa, ...os, ...cls[2027], ...cls[2028], ...cls[2029]] as number[];
    everyone.forEach(id => { const p = P[id]; if (p.family) return; if (!maybeSon(this, p, rnd) && rnd() < BROTHER_RATE / 2) maybeBrother(this, { ...st0, rosters }, p, rnd, true); });
    const rank = {};
    Object.keys(cls).forEach(y => { cls[y].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)); cls[y].forEach((id, i) => rank[id] = i + 1); });
    const order = teams.slice().sort((a, b) => a.w - b.w || b.l - a.l).map(t => t.tid);
    const assets = [];
    [2027, 2028, 2029].forEach(yr => [1, 2].forEach(rd => teams.forEach(t => assets.push({ id: yr + '-' + rd + '-' + t.tid, yr, rd, orig: t.tid, owner: t.tid }))));
    for (let k = 0; k < 10; k++) { const a = pick(assets.filter(x => x.owner === x.orig && x.orig !== 0)); a.owner = 1 + Math.floor(rnd() * 29); }
    assets.find(a => a.yr === 2028 && a.rd === 2 && a.orig === 1).owner = 0;
    const days = this.buildSchedule(teams.length, rnd);
    const results = [];
    const BUD = { Coaching: [5, 40, 18, .5], Health: [3, 25, 10, .5], Facilities: [3, 30, 14, .5], Scouting: [1, 12, 4, .25], Tickets: [35, 300, 118, 1] };
    const lg = {}; (Object.entries(BUD) as [string, any][]).forEach(([k, [mn, mx, df]]) => { lg[k] = []; for (let i = 0; i < 29; i++) lg[k].push(+cl(df * (0.55 + rnd() * 0.9), mn, mx).toFixed(1)); });
    Object.assign(db, { os, teams, rosters, fa, cls, rank, order, assets, days, results, lg, BUD, sf });
    this.initContracts(rosters, rnd);
    return db;
  }


  bio(Wt) {
    const rnd = () => this.rnd(), pick = a => a[Math.floor(rnd() * a.length)], wpick = o => this.wpick(o);
    const C = this.db.C, NP = namePools();
    const her = wpick(Wt); let born = her, raised = her; const x = rnd();
    if (her === 'SS') { if (x < .65) { born = 'KE'; raised = pick(['AU', 'AU', 'US', 'CA']); } else if (x < .8) { born = 'US'; raised = 'US'; } }
    else if (DIAS.includes(her) && x < .3) { born = pick(['US', 'US', 'CA']); raised = born; }
    else if (['NG', 'SN', 'CM', 'ML', 'CD'].includes(her) && x < .8) { raised = x < .55 ? 'US' : pick(['FR', 'ES']); }
    else if (her === 'US' && x < .04) { born = pick(['DE', 'IT', 'JP']); }
    else if (C[her].eu && x < .1) { raised = 'US'; }
    else if (her === 'CA' && x < .15) { raised = 'US'; }
    // Heritage group by the country's population shares: it sets the name and the look.
    const grp = pickGroup(her, rnd), nm = grp ? nameFromGroup(her, grp, rnd) : null;
    let race = nm ? nm.race : wpick(C[her].race);
    const amer = (born === 'US' || born === 'CA') && born !== her && rnd() < .35, pk = amer ? 'us' : C[her].pool, np = NP[pk] || NP.us;
    const f = pick(np.f), l = pick(np.l);
    const elig = [], add = (c, why) => { if (!elig.find(e => e.c === c)) elig.push({ c, why }); };
    if (born === her) add(born, 'citizen by birth'); else if (C[born].soli) add(born, 'born there');
    if (her !== born) add(her, 'through parents');
    if (raised !== born && raised !== her) add(raised, 'naturalized');
    // Native American: born in a tribal nation, a U.S. citizen, and eligible only for the United States.
    if (her === 'XN') { elig.length = 0; add('US', 'U.S. citizen (tribal nation)'); }
    let rep = elig[0].c;
    if (elig.length > 1) rep = her === 'SS' ? 'SS' : (born === 'US' || born === 'CA') ? (rnd() < .6 ? her : born) : pick(elig).c;
    const NM = nativeMaps(); let native = '', disp = np.lf ? l + ' ' + f : f + ' ' + l;
    if (pk === 'cn') { native = NM.cn[l] + NM.cn[f]; disp = NM.cnT[l] + ' ' + NM.cnT[f]; }
    else if (pk === 'kr') native = NM.kr[l] + NM.kr[f];
    else if (pk === 'jp') native = NM.jp[l] + ' ' + NM.jp[f];
    else if (pk === 'gr' || pk === 'ge' || pk === 'il') native = NM[pk][f] + ' ' + NM[pk][l];
    else if (pk === 'rs' && ['RS', 'ME', 'BA'].includes(her)) native = cyr(f) + ' ' + cyr(l);
    // Born in North America to immigrant parents: about a third get an American first name
    // and keep the family surname (the way Okafor or Achiuwa did).
    let amerFirst = '';
    // Born outside his heritage country, in one that writes names another way (an American of Lebanese
    // descent): his name is written the local way, without the native script.
    if (nm && nm.native && born !== her && !scriptOk(born, nm.script)) Object.assign(nm, { native: '', nativeFirst: '', nativeLast: '' });
    if (nm && amer) { amerFirst = americanFirst(race, rnd); disp = amerFirst + ' ' + nm.last; native = ''; }
    else if (nm) { disp = nm.name; native = nm.native; }
    const nmx = nm && amer ? { first: amerFirst, last: nm.last, nativeFirst: '', nativeLast: '', familyFirst: false, nOrder: 'fl', nSep: ' ' } : nm ? { first: nm.first, last: nm.last, nativeFirst: nm.nativeFirst, nativeLast: nm.nativeLast, familyFirst: nm.familyFirst, nOrder: nm.nOrder, nSep: nm.nSep } : { first: f, last: l, nativeFirst: '', nativeLast: '', familyFirst: false, nOrder: 'fl', nSep: ' ' };
    // Native American: some belong to two tribal nations (like Kiowa and Cherokee), and many are
    // mixed race, often born and raised off the reservation anywhere in the U.S.
    const extra: any = {}; let who: any = { disp, native, nmx };
    if (her === 'XN' && nm) {
      if (rnd() < TWO_TRIBES_SHARE) { const t = pickGroup('XN', rnd); if (t && t.k !== nm.heritage) extra.tribe2 = t.k; }
      if (rnd() < MIXED_NATIVE_SHARE) {
        const q: any = { ...nmx }; applyNativeMix(q, wpick(Object.fromEntries(Object.entries(NATIVE_MIX).map(([k, v]) => [k, v.w]))), rnd);
        extra.mix = q.mix; race = q.race; if (rnd() < .7) { born = 'US'; raised = 'US'; }
        who = { disp: q.name, native: '', nmx: { first: q.first, last: q.last, nativeFirst: '', nativeLast: '', familyFirst: false, nOrder: 'fl', nSep: ' ' } };
      }
    }
    const towns = born === 'XN' && nm?.heritage ? [...(TRIBE_TOWNS[nm.heritage] || []), ...(extra.tribe2 ? TRIBE_TOWNS[extra.tribe2] || [] : [])] : null;
    const near = extra.mix && born === 'US' && nm && rnd() < .6 ? [...(TRIBE_CITIES[nm.heritage] || []), ...(extra.tribe2 ? TRIBE_CITIES[extra.tribe2] || [] : [])] : null;
    return { her, born, raised, race, name: who.disp, native: who.native, heritage: nm?.heritage, ...extra, ...who.nmx, elig, rep, city: pick(towns && towns.length ? towns : near && near.length ? near : C[born].cities) };
  }
  pipe(raised, cls) {
    const rnd = () => this.rnd(), pick = a => a[Math.floor(rnd() * a.length)];
    const C = this.db.C, CLUBS = clubs();
    const cc = CLUBS[raised];
    if (cls > 2027) {
      if (cc && rnd() < .8) return { team: pick(cc)[0] + ' U18', lg: 'Junior', country: raised };
      return { team: pick(C.US.cities) + ' ' + pick(['Prep', 'Academy', 'Christian']), lg: 'High school', country: 'US' };
    }
    const cp = ['US', 'CA', 'BS'].includes(raised) ? 1 : C[raised].eu ? .15 : ['AU', 'NZ'].includes(raised) ? .5 : .3;
    if (!cc || rnd() < cp) return { team: pick(COLLEGES), lg: 'NCAA', country: 'US' };
    const k = pick(cc); return { team: k[0], lg: k[1], country: raised };
  }
  mkPlayer(base, age, Wt, cls, forceGrp?) {
    const rnd = () => this.rnd(), cl = this.cl, pick = a => a[Math.floor(rnd() * a.length)], wpick = o => this.wpick(o);
    const P = this.db.P, b = this.bio(Wt);
    const [pos, grp] = forceGrp ? pick(POS.filter(x => x[1] === forceGrp)) : pick(POS);
    const ovr = Math.round(cl(base, 22, 92));
    const pot = Math.round(age < 23 ? ovr + 4 + (23 - age) * 3 * (0.5 + rnd()) : age < 27 ? ovr + rnd() * 5 : ovr);
    const r: any = {}; RATING_KEYS.forEach(k => r[k] = Math.round(cl(ovr + (BIAS[grp][k] || 0) + (rnd() - .5) * 22, 4, 100)));
    const hIn = grp === 'G' ? 73 + Math.floor(rnd() * 5) : grp === 'W' ? 77 + Math.floor(rnd() * 4) : 81 + Math.floor(rnd() * 5);
    // Wingspan: NBA players average about 4 inches longer than their height, from −6 to +12.
    const wing = hIn + Math.round(cl((rnd() + rnd() + rnd() - 1.5) * 6 + 3.8, -6, 12));
    const p: any = { id: this.db.nid++, pos, grp, age, ovr, pot: Math.min(pot, 95), r, wing, hgt: Math.floor(hIn / 12) + '′' + (hIn % 12) + '″', wt: Math.round(hIn * 2.9 - 5 + rnd() * 25),
      amt: Math.min(this.MAXC, 2.4 + Math.pow(Math.max(0, ovr - 42) / 28, 2.1) * 52), exp: 2027 + Math.floor(rnd() * 4), draft: Math.min(2026, 2026 - (age - 21)), mood: pick(['Eager', 'Open', 'Open', 'Reluctant']),
      from: this.pipe(b.raised, cls), cls, dr: (() => { if (cls) return null; const x = rnd(); return x < .7 ? { rd: 1, pick: 1 + Math.floor(rnd() * 30) } : x < .92 ? { rd: 2, pick: 1 + Math.floor(rnd() * 30) } : null; })(), nz: [rnd() - .5, rnd() - .5], gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0, stats: [], ...b };
    p.pers = { mot: wpick({ Winning: 3, Money: 3, Fame: 1.5, Loyalty: 1.5, 'Playing time': 2 }), alpha: rnd() < .2, touches: rnd() < .3, pro: rnd() < .35, volatile: rnd() < .15, crowd: rnd() < .15, clutch: rnd() < .1, prone: rnd() < .08, padder: rnd() < .08, flashy: rnd() < .08, heat: rnd() < .1, villain: rnd() < .05, fearless: rnd() < .07 };
    p.pers.team = !p.pers.alpha && !p.pers.padder && !p.pers.touches && rnd() < .3; // team player
    p.pers.legacy = rnd() < .12; // legacy-driven
    p.pers.streaky = ((p.id * 2246822519) >>> 0) % 100 < 12; // streaky shooter (from his id, so world generation is unchanged)
    p.pers.work = workEthicOf(p.id); // work ethic, 0–100 (development.ts), also from his id
    p.pers.mal = Math.round(Math.max(3, Math.min(97, 50 + (rnd() + rnd() + rnd() - 1.5) * 45))); // hidden: how open he is to change
    p.fat = 0;
    p.yrsWith = cls ? 0 : 1 + Math.floor(rnd() * Math.min(6, Math.max(1, 2026 - p.draft)));
    p.rookie = !cls && !!p.dr && p.dr.rd === 1 && 2026 - p.draft <= 3; if (p.rookie) p.exp = Math.max(2027, p.draft + 4);
    setHgtKeepOvr(p, blendHeight(p, p.r.hgt)); // his height rating mostly follows his listed height (ratings.ts)
    deriveDefense(p, () => rnd() - .5); // blocks and steals come from his body and quickness, only partly from Defensive IQ
    syncOvr(p, true); p.wOvr = 1; // the overall is his ratings (position-weighted, wingspan included); the ceiling moves with it
    initTendencies(p); // his playing style: where his game points, plus his own quirks (tendencies.ts)
    if (!cls && age <= 23) { bodyAhead(p, p.pot - p.ovr); syncOvr(p); } // a young body is ahead of his game (development.ts); prospects: prospectPot
    initCeil(p, p.pot); rollPerr(p, age <= 22 ? 2.5 : age <= 26 ? 1.2 : 0); refreshPot(p); // potential is a ceiling (potential.ts); p.pot is the league's read
    ensureIntg(p, rnd); rollGem(p, rnd, age <= 19 ? 0.07 : 0.05); // intangibles, and maybe a hidden gem (intangibles.ts)
    if (cls) ensureTranslation(p); // how his game will translate to the NBA: hidden until his first camp (translation.ts)
    P[p.id] = p; return p;
  }
  // A draft prospect's ceiling: his likely career peak, drawn like the real league's. Per class of about
  // 100: roughly 15–20 future starters (56+), 3–4 All-Stars (63+) and about one franchise player (70+),
  // plus a rare generational talent; hidden gems add to it later. (Ceilings set as "today plus a big
  // gap" made a third of every class a future star, and the league inflated for a decade.)
  prospectPot(p, rnd: () => number = Math.random) {
    const z = (rnd() + rnd() + rnd() + rnd() - 2) * 1.732, gen = rnd() < 0.01 ? 7 : 0;
    // The top of the scale stretches: a one-in-a-hundred prospect becomes a 75+ superstar.
    const pot = Math.round(this.cl(Math.max(47 + 8 * z + (z > 1.2 ? (z - 1.2) * 9 : 0) + gen, p.ovr + 6), 40, 95));
    bodyAhead(p, pot - p.ovr); syncOvr(p); // his body arrives ahead of his game (development.ts)
    // `pot` is his expected career peak; his ceilings sit above it (potential.ts) and the league's read
    // of them is a few points off either way. Returns that read.
    initCeil(p, pot); rollPerr(p, 3.5); refreshPot(p);
    return p.pot;
  }
  rng(seed) { return mulberry32(seed); }
  cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  regionKey(code) { return regionOfCountry(code); }
  regFactorK(k, s) { const sc = (s.scouts || []).filter(x => x.assign === k); return sc.length ? Math.min(...sc.map(x => (x.spec === k ? .45 : .75) * (1.2 - x.skill * .08))) : 1.25; }
  regFactor(p, s) { return this.regFactorK(this.regionKey((p.from && p.from.country) || p.raised), s); }
  tacFit(ids, t) { const P = this.db.P; return tacticFit(ids.slice(0, 8).map(id => P[id]).filter(Boolean), t); }
  initState(tids: number[] = [0]) {
    const d = this.db, rosters0 = { ...d.rosters }, fa0 = d.fa.slice(), lg0 = [], me = tids[0];
    const base: any = { managed: tids.slice(), me, clubs: {} };
    tids.slice(1).forEach((t, i) => (base.clubs[t] = this.defaultClub(i + 1)));
    const box0 = { rosters: rosters0, fa: fa0, overseas: [], cap: {} }, st0 = { ...base, teams: d.teams, phase: 'preseason', day: 0, rosters: rosters0, fa: fa0, cap: box0.cap, assets: d.assets, god: false };
    for (let k = 0; k < 14; k++) { const e = this.aiMove(box0, -14 + k, st0); if (e) lg0.unshift(e); }
    return { ...base, ...this.defaultClub(0), screen: 'dash', pid: d.rosters[me][0], teams: d.teams.map(t => ({ ...t, seq: t.seq.slice() })), rosters: box0.rosters, fa: box0.fa, cap: box0.cap, lgLog: lg0, natW: natDefault(), overseas: d.os.slice(), listModal: null, god: false, phase: 'regular', season: 2027, po: null, playin: null, playinRes: [], history: [], expansion: false, expanded: false, lotto: null, gmSetup: true, lists: [{ id: 'l1', name: 'Watchlist', ids: [] }], newList: '', txFilter: 'All', day: 0, games: [],
      sort: { roster: ['rk', 1], fa: ['ovr', -1], draft: ['rank', 1] }, stand: 'conf', tTid: d.teams.find(t => !tids.includes(t.tid)).tid, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null,
      assets: d.assets.map(a => ({ ...a })), picks: [...d.order.map((orig, i) => ({ n: i + 1, rd: 1, orig, pid: null })), ...d.order.map((orig, i) => ({ n: d.order.length + i + 1, rd: 2, orig, pid: null }))], pi: 0, dClass: 2027, adv: {},
      q: '', dialog: null, showJson: false, tstats: {}, awards: {}, news: [], career: { seasons: [], hires: [] } };
  }
  get Y() { return (this.state && this.state.season) || 2027; }
  seasonLbl() { return (this.Y - 1) + '–' + String(this.Y).slice(2); }
  // Game days are spread over the real calendar: opening night Oct 21, game 82 in mid-April.
  dateOf(off) { return this.db.midStart && this.Y === 2027 ? new Date(2027, 0, 14 + Math.round(off * 1.1)) : new Date(this.Y - 1, 9, 21 + Math.round(off * 2.14)); }
  // Play-in and playoff games are simulated in full; their stats go on the playoff line.
  gameWin(s, a, b, homeA) {
    const r = this.playGame(s, homeA ? a : b, homeA ? b : a);
    this.addBox(r, true);
    return (r.home.pts > r.away.pts ? r.home.tid : r.away.tid) === a;
  }

  // Default minutes per 48 by rotation slot (sums to 240). The user can override per player on Tactics.
  static ROTATION = [34, 33, 32, 30, 28, 24, 20, 17, 14, 6, 2, 0, 0, 0, 0];
  // The playoffs: coaches shorten the bench to about eight and ride their starters (38–41 minutes,
  // as NBA stars do in the postseason); in an elimination game, seven (and a spot-up cameo).
  static PO_ROTATION = [39, 38, 37, 35, 32, 24, 18, 12, 5, 0, 0, 0, 0, 0, 0];
  static PO_ELIM_ROTATION = [41, 40, 38, 36, 34, 27, 21, 3, 0, 0, 0, 0, 0, 0, 0];
  rotationFor(s, tid) {
    if (s.phase !== 'playoffs' || !s.po) return Game.ROTATION;
    const ser = (s.po.rounds || []).flat().find((x: any) => (x.a === tid || x.b === tid) && x.wa < 4 && x.wb < 4);
    return ser && (ser.wa === 3 || ser.wb === 3) ? Game.PO_ELIM_ROTATION : Game.PO_ROTATION;
  }

  // ── Multi-team control ─────────────────────────────────────────────────────────
  // `managed` are the franchises a human runs; `me` is the one on screen. Per-club settings
  // (CLUB_KEYS) live at the top level of state for `me` and in `clubs[tid]` for the others.
  static CLUB_KEYS = ['tactics', 'situ', 'budget', 'train', 'scouts', 'promises', 'agentRep', 'mleUsed', 'buyoutCash', 'taxHist', 'reports', 'log', 'prog', 'inbox', 'intel', 'scoutFocus', 'scoutAssign', 'briefPicks', 'coachAuto', 'ptInj', 'keepSorted', 'teamNote', 'scoutReports', 'scoutList', 'mentors', 'budgetAuto'];
  isUser(s, tid) { return (s.managed || [0]).includes(tid); }
  clubOf(s, tid) { return s.spectator ? null : tid === s.me ? s : this.isUser(s, tid) ? s.clubs?.[tid] || null : null; } // Spectator Mode: no club is yours
  defaultClub(i = 0) {
    const SC = [['Dale Whitcombe', 'NA', 4], ['Inés Morales', 'WEU', 3], ['Goran Vuković', 'BAL', 4], ['Kwame Asante', 'AFR', 2]];
    const NP = namePools(), R = Object.keys(regions()), pick = a => a[Math.floor(Math.random() * a.length)];
    const scouts = i === 0 ? SC.map(([name, spec, skill]) => ({ name, spec, skill, assign: spec })) : R.slice(0, 4).map(k => { const k2 = pick(R); return { name: pick(NP.us.f) + ' ' + pick(NP.us.l), spec: k2, skill: 2 + Math.floor(Math.random() * 3), assign: k2 }; });
    return { tactics: { ...TAC_DEFAULT }, situ: null, budget: { Coaching: 18, Health: 10, Facilities: 14, Scouting: 4, Tickets: 118 }, train: {}, scouts, promises: {}, agentRep: 50, mleUsed: false, buyoutCash: 0, taxHist: [], reports: [], log: [], prog: null, inbox: [] };
  }
  // A patch that writes club fields for any managed team (top level if it's on screen).
  clubPatch(s, tid, fields, clubs?) {
    if (s.spectator) return {};
    if (tid === s.me) return fields;
    const c = clubs || { ...(s.clubs || {}) };
    c[tid] = { ...(c[tid] || this.defaultClub(1)), ...fields };
    return { clubs: c };
  }
  logFor(s, tid, text, day = s.day) {
    const c = this.clubOf(s, tid);
    return this.clubPatch(s, tid, { log: [{ date: this.fmtS(day), day, text }, ...((c && c.log) || [])] });
  }
  switchTeam(tid) {
    this.setState(s => {
      if (!this.isUser(s, tid) || tid === s.me) return null;
      const clubs = { ...(s.clubs || {}) }, cur: any = {};
      Game.CLUB_KEYS.forEach(k => (cur[k] = s[k]));
      clubs[s.me] = cur;
      const nxt = clubs[tid] || this.defaultClub(1);
      delete clubs[tid];
      return { ...nxt, clubs, me: tid, pid: s.rosters[tid][0], tTid: s.teams.find(t => t.tid !== tid)?.tid ?? 0, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null, teamModal: null, modal: false, screen: s.screen === 'game' ? 'dash' : s.screen };
    });
  }
  // God Mode or a new job: add a franchise to the ones you run and switch to it.
  takeOver(tid, why = 'God Mode: took over') {
    if (this.state.spectator) { this.manageTeam(tid); return; } // Spectator Mode ends: you run this team
    this.setState(s => {
      if (this.isUser(s, tid)) return null;
      const T = s.teams[tid];
      return { managed: [...s.managed, tid], clubs: { ...(s.clubs || {}), [tid]: this.defaultClub(1) }, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: why + ' the ' + T.region + ' ' + T.name }, ...s.lgLog] };
    });
    this.switchTeam(tid);
  }
  // Resign / hand a franchise to the AI, which then runs it by its owner's archetype.
  handToAI(tid, why = 'Handed to the AI:') {
    const s0 = this.state;
    if (!this.isUser(s0, tid) || s0.managed.length < 2) return;
    if (tid === s0.me) this.switchTeam(s0.managed.find(t => t !== tid));
    this.setState(s => {
      const clubs = { ...(s.clubs || {}) }; delete clubs[tid];
      const T = s.teams[tid], rosters = { ...s.rosters, [tid]: s.rosters[tid].slice().sort((a, b) => this.db.P[b].ovr - this.db.P[a].ovr) };
      return { managed: s.managed.filter(t => t !== tid), clubs, rosters, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: why + ' the ' + T.region + ' ' + T.name }, ...s.lgLog] };
    });
  }
  // This season's results for a team, newest first: { day, win, us, them, opp, home, po }.
  resultsOf(s, tid) {
    return (s.games || []).filter(g => g.h === tid || g.a === tid).map(g => { const home = g.h === tid; return { day: g.day, win: home ? g.hp > g.ap : g.ap > g.hp, us: home ? g.hp : g.ap, them: home ? g.ap : g.hp, opp: home ? g.a : g.h, home, po: g.po, bid: g.bid }; }).reverse();
  }
  gamesPlayed(s) { return Math.max(0, ...s.teams.map(t => t.w + t.l)); }

  // A team as the engine sees it: healthy (or playing-through) players in rotation order,
  // each with roles, traits and condition; the club's tactics if a human runs it.
  simTeam(s, tid): SimTeam {
    const P = this.db.P, T = s.teams[tid], user = this.isUser(s, tid), club = this.clubOf(s, tid);
    // Two-way players: 50 regular-season games, none in the postseason; players waived after
    // March 1 who signed elsewhere can't play in the postseason either.
    const post = s.phase === 'playoffs' || s.phase === 'playin';
    // Play through injuries: a managed club's setting (days of injury he'll play through,
    // regular season and postseason); he plays at reduced strength.
    const thr = user && !s.easy?.injuries ? ((club?.ptInj || { reg: 0, po: 4 })[post ? 'po' : 'reg'] ?? 0) : 0, hurt = (p: any) => !!p.inj && !p.inj.dtd && p.inj.games <= thr;
    let ids = s.rosters[tid].filter(id => { const p = P[id]; return (!p.inj || p.inj.dtd || hurt(p)) && !p.dev && !(p.ctype === 'twoWay' && (post || (p.twoWay?.games || 0) >= DAY.TWO_WAY_GAMES)) && !(post && p.poIneligible === this.Y); });
    if (!user) { const k = (id: number) => P[id].ovr + devMinutes(this, s, tid, P[id]); ids = ids.slice().sort((a, b) => k(b) - k(a)); } // AI: best first, and real minutes for a young high pick (rosterAI)
    if (ids.length < 5) ids = [...ids, ...s.rosters[tid].filter(id => !ids.includes(id))].slice(0, 5);
    const ROT = this.rotationFor(s, tid);
    return { tid, name: T.region + ' ' + T.name, abbr: T.abbr, rec: T.w + '–' + T.l, ff: this.teamFF(s, tid), chem: lockerRoom(this, s, tid).score,
      tactics: club ? club.tactics : null, situ: club ? club.situ || null : null, tempo: club ? undefined : this.tempoOf(s, tid),
      players: ids.map((id, i) => { const p = P[id]; return { id, name: p.name, pos: p.pos, grp: p.grp, ovr: p.ovr, r: { ...p.r, ape: (p.wing ?? 0) ? p.wing - this.inches(p.hgt) : 4 }, roles: this.rolesOf(p), crowd: p.pers.crowd, clutch: p.pers.clutch, padder: p.pers.padder || !!p.padding, selfish: !!p.pers.padder, conf: p.conf, alpha: p.pers.alpha, touches: p.pers.touches, adj: p.adjust > 0, dtd: !!(p.inj && (p.inj.dtd || hurt(p))), fat: p.fat || 0, protect: !!p.protect, feel: p.intg?.feel ?? 50, poise: p.intg?.poise ?? 50, tend: effTend(p), flashy: !!p.pers.flashy, heat: !!p.pers.heat, volatile: !!p.pers.volatile, hot: p.pers.streaky ? p.hot || 0 : 0, villain: !!p.pers.villain, fearless: !!p.pers.fearless, team: !!p.pers.team, pro: !!p.pers.pro, flag: this.flag(p.rep), target: user && p.rot != null ? p.rot : (p.minMin ? Math.max(p.minMin, ROT[i] ?? 0) : ROT[i] ?? 0) }; }) };
  }

  // An AI team's pace (a multiplier on the length of its trips): its coach's taste, new each season, plus
  // its roster: quick, young teams run, veteran teams grind. About 95 to 104 possessions a game, as in the
  // NBA (2025-26: Boston 94.8, Miami 103.4). Teams you run set theirs in Tactics.
  tempoOf(s, tid) {
    const P = this.db.P, top = (s.rosters[tid] || []).map(id => P[id]).filter(Boolean).sort((a, b) => b.ovr - a.ovr).slice(0, 8); if (!top.length) return 1;
    const quick = top.reduce((a, p) => a + (p.r.spd + (p.r.acc ?? p.r.spd)) / 2 - p.r.stre * 0.3, 0) / top.length, age = top.reduce((a, p) => a + p.age, 0) / top.length;
    const coach = ((((tid + 1) * 2654435761) ^ (this.Y * 40503)) >>> 0) % 1000 / 1000 - 0.5;
    return this.cl(1 - coach * 0.075 - (quick - 42) * 0.0012 + (age - 27) * 0.004, 0.945, 1.055);
  }
  playGame(s, home, away): GameResult {
    return new GameSim(this.simTeam(s, home), this.simTeam(s, away), { norms: this.db.norms }).run();
  }
  // God Mode: a game whose winner you picked. Played for real until that team wins (a few tries);
  // if it keeps losing, its best scorer gets the free throws that swing it, in the last quarter.
  playFixed(s, home, away, winner: number): GameResult {
    let res: GameResult = this.playGame(s, home, away);
    for (let i = 0; i < 30 && (res.home.pts > res.away.pts ? home : away) !== winner; i++) res = this.playGame(s, home, away);
    const W = res.home.tid === winner ? res.home : res.away, L = W === res.home ? res.away : res.home;
    if (W.pts <= L.pts) {
      const d = L.pts - W.pts + 1 + Math.floor(Math.random() * 4), top = Object.entries(W.box).sort((x: any, y: any) => y[1].pts - x[1].pts)[0];
      if (top) { const b: any = top[1]; b.pts += d; b.ftm += d; b.fta += d; }
      W.pts += d; W.qs[W.qs.length - 1] += d;
    }
    return res;
  }

  // League normalization from the current rosters (expected minutes by rotation slot).
  refreshNorms(s) {
    const P = this.db.P, entries = [];
    Object.keys(s.rosters).forEach(k => {
      const ids = s.rosters[k].slice().sort((a, b) => P[b].ovr - P[a].ovr);
      ids.forEach((id, i) => entries.push({ p: P[id], roles: this.rolesOf(P[id]), min: Game.ROTATION[i] ?? 0, tid: +k }));
    });
    this.db.norms = computeNorms(entries, s.season || this.Y);
  }

  // Team Four Factors for the clutch tiebreaker: season stats, regressed toward a
  // ratings-based expectation early in the season.
  teamFF(s, tid): FourFactors {
    const P = this.db.P, n = this.db.norms, ids = s.rosters[tid].slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 8).map(id => P[id]);
    const av = f => ids.reduce((a, p) => a + f(p), 0) / Math.max(1, ids.length);
    const prior: FourFactors = n ? {
      efg: BASE.efg + 0.0015 * (av(p => { const z = zoneSkill(p.r); return (z.rim + z.mid + z.atb * 1.5) / 3.5; }) - (n.skill.rim + n.skill.mid + n.skill.atb * 1.5) / 3.5),
      tov: BASE.tovPct - 0.0008 * (av(p => (p.r.drb + p.r.pss) / 2) - n.handle),
      orb: BASE.orbPct + 0.002 * (av(p => p.r.reb * 0.6 + p.r.hgt * 0.25 + p.r.jmp * 0.15) - n.reb),
      ftr: BASE.ftr + 0.002 * (av(p => (p.r.ins + p.r.dnk) / 2) - 55),
    } : { efg: BASE.efg, tov: BASE.tovPct, orb: BASE.orbPct, ftr: BASE.ftr };
    const t = (s.tstats || {})[tid];
    if (!t || !t.gp) return prior;
    const act = this.fourFactors(t), w = t.gp / (t.gp + 10);
    return { efg: w * act.efg + (1 - w) * prior.efg, tov: w * act.tov + (1 - w) * prior.tov, orb: w * act.orb + (1 - w) * prior.orb, ftr: w * act.ftr + (1 - w) * prior.ftr };
  }
  fourFactors(t) {
    return { efg: t.fga ? (t.fgm + 0.5 * t.tpm) / t.fga : BASE.efg, tov: t.tov / Math.max(1, t.fga + 0.44 * t.fta + t.tov), orb: t.orb / Math.max(1, t.orb + t.oDrb), ftr: t.fga ? t.ftm / t.fga : BASE.ftr };
  }
  // Basketball-Reference possession estimate, averaged over both sides.
  possOf(t) {
    const one = (fga, fta, orb, oDrb, fgm, tov) => fga + 0.4 * fta - 1.07 * (orb / Math.max(1, orb + oDrb)) * (fga - fgm) + tov;
    return 0.5 * (one(t.fga, t.fta, t.orb, t.oDrb, t.fgm, t.tov) + one(t.oFga, t.oFta, t.oOrb, t.drb, t.oFgm, t.oTov));
  }

  // Box score → season totals. One stat row per player, season, team and regular/playoffs,
  // with home/road splits and the four shot tiers; team totals feed the Four Factors.
  // Box scores for this season's games, compact: quarter scores and one line per player who
  // played ([pid, min, pts, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl, blk, tov, pf, +/-,
  // started]). Kept for the current season only so saves stay small.
  static BOX_F = ['min', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'pm', 'gs'];
  keepBox(res: GameResult, day: number, kind?: string) {
    const d: any = this.db, id = this.Y + '-' + (d.boxSeq = (d.boxSeq || 0) + 1), boxes = (d.boxes = d.boxes || {});
    const side = (sd: any) => ({ tid: sd.tid, pts: sd.pts, qs: sd.qs, lines: Object.entries(sd.box).filter(([, b]: any) => b.min > 0).map(([pid, b]: any) => [+pid, ...Game.BOX_F.map(f => f === 'min' ? +(b.min || 0).toFixed(1) : b[f] || 0)]) });
    boxes[id] = { season: this.Y, day, kind: kind || 'reg', ot: res.ot, home: side(res.home), away: side(res.away) };
    return id;
  }
  addBox(res: GameResult, po: boolean, touched?: number[], mins?: Record<number, number>, s?: any) {
    const P = this.db.P, Y = this.Y, SPLIT = ['gp', 'min', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk'];
    const sum = side => { const t: any = blankLine(); Object.values(side.box).forEach((b: any) => Object.keys(t).forEach(k => (t[k] += b[k] || 0))); return t; };
    const tot = { home: sum(res.home), away: sum(res.away) };
    (['home', 'away'] as const).forEach(k => {
      const side = res[k];
      Object.entries(side.box).forEach(([key, b]) => {
        const id = +key, p = P[id];
        if (!p || b.min <= 0) return;
        p.stats = p.stats || [];
        let row = p.stats.find(x => x.season === Y && x.tid === side.tid && !!x.po === po);
        if (!row) { row = { season: Y, tid: side.tid, po, gp: 0, ...blankLine(), h: {}, a: {} }; row.gs = 0; p.stats.push(row); }
        row.gp++;
        if (p.numTid === side.tid && p.num != null) row.num = p.num; // the number he wore for them (Team history)
        Object.keys(b).forEach(f => { if (typeof row[f] === 'number' && f !== 'gp') row[f] += b[f]; });
        const sp = k === 'home' ? (row.h = row.h || {}) : (row.a = row.a || {});
        SPLIT.forEach(f => (sp[f] = (sp[f] || 0) + (f === 'gp' ? 1 : b[f] || 0)));
        if (!po) {
          const gmsc = b.pts + 0.4 * b.fgm - 0.7 * b.fga - 0.4 * (b.fta - b.ftm) + 0.7 * b.orb + 0.3 * b.drb + b.stl + 0.7 * b.ast + 0.7 * b.blk - 0.4 * b.pf - b.tov;
          p.last5 = [{ pts: b.pts, reb: b.orb + b.drb, ast: b.ast, min: +b.min.toFixed(1), gmsc: +gmsc.toFixed(1), home: k === 'home' }, ...(p.last5 || [])].slice(0, 5);
        }
        if (touched) touched.push(id);
        if (mins) mins[id] = b.min;
      });
      if (!po && s) {
        const me = tot[k], op = tot[k === 'home' ? 'away' : 'home'], T = (s.tstats[side.tid] = s.tstats[side.tid] || { gp: 0 });
        T.gp++;
        [['pts', 'pts'], ['fgm', 'fgm'], ['fga', 'fga'], ['tpm', 'tpm'], ['tpa', 'tpa'], ['ftm', 'ftm'], ['fta', 'fta'], ['orb', 'orb'], ['drb', 'drb'], ['ast', 'ast'], ['stl', 'stl'], ['blk', 'blk'], ['tov', 'tov'], ['pf', 'pf'], ['rm', 'rm'], ['ra', 'ra'], ['mm', 'mm'], ['ma', 'ma'], ['cm', 'cm'], ['ca', 'ca'], ['bm', 'bm'], ['ba', 'ba']].forEach(([f]) => (T[f] = (T[f] || 0) + me[f]));
        [['oPts', 'pts'], ['oFgm', 'fgm'], ['oFga', 'fga'], ['oTpm', 'tpm'], ['oTpa', 'tpa'], ['oFtm', 'ftm'], ['oFta', 'fta'], ['oOrb', 'orb'], ['oDrb', 'drb'], ['oTov', 'tov']].forEach(([f, g]) => (T[f] = (T[f] || 0) + op[g]));
      }
    });
  }

  // Totals for a season (all teams), or null if he didn't play.
  seasonTotals(p, season, po = false) {
    const rows = (p.stats || []).filter(x => x.season === season && !!x.po === po);
    if (!rows.length) return null;
    const t: any = {};
    rows.forEach(r => Object.keys(r).forEach(k => { if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + r[k]; }));
    return t;
  }
  tsOf(t) { return t.fga + t.fta ? t.pts / (2 * (t.fga + 0.44 * t.fta)) : 0; }
  // USG%: share of team plays used while on the floor (team plays per minute from the baselines).
  usgOf(t) { const teamPlaysPer48 = 89.1 + 0.44 * 23.5 + BASE.tov; return t.min ? (100 * (t.fga + 0.44 * t.fta + t.tov) * 48) / (t.min * teamPlaysPer48) : 0; }
  eff(t) { return t.pts + t.orb + t.drb + t.ast + t.stl + t.blk - (t.fga - t.fgm) - (t.fta - t.ftm) - t.tov; }
  // A simple PER: efficiency per minute, scaled so the league average is 15.
  perOf(t, season) { const lg = this.db.lgRate?.[season] || 0.55; return t.min ? 15 * (this.eff(t) / t.min) / lg : 0; }

  // Per-game averages shown across the app = season totals ÷ games played.
  refreshAverages(ids: number[]) {
    const P = this.db.P, Y = this.Y;
    let e = 0, m = 0;
    (Object.values(P) as any[]).forEach(p => { const t = p.stats && p.stats.length ? this.seasonTotals(p, Y) : null; if (t) { e += this.eff(t); m += t.min; } });
    if (m) (this.db.lgRate = this.db.lgRate || {})[Y] = e / m;
    new Set(ids).forEach(id => {
      const p = P[id], t = this.seasonTotals(p, Y);
      if (!t) { Object.assign(p, { gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0 }); return; }
      const r1 = v => +(v / t.gp).toFixed(1);
      Object.assign(p, { gp: t.gp, min: r1(t.min), pts: r1(t.pts), reb: r1(t.orb + t.drb), ast: r1(t.ast), per: +this.perOf(t, Y).toFixed(1), ts: +this.tsOf(t).toFixed(3), usg: +this.usgOf(t).toFixed(1) });
    });
  }

  // Round-robin (circle method), repeated until every team has 82 games; everyone plays every day.
  buildSchedule(n, rnd: () => number = Math.random) {
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const ids = shuffle(Array.from({ length: n }, (_, i) => i)), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) { const a = ids[i], b = ids[n - 1 - i]; pairs.push((r + i) % 2 ? [a, b] : [b, a]); }
      rounds.push(pairs);
      ids.splice(1, 0, ids.pop());
    }
    // Home court goes to whichever side has hosted less so far, so everyone ends near 41/41.
    const days = [], home = new Array(n).fill(0), away = new Array(n).fill(0);
    while (days.length < 82) {
      for (const i of shuffle(rounds.map((_, k) => k))) {
        if (days.length >= 82) break;
        days.push(rounds[i].map(([x, y]) => {
          const xHome = home[x] - away[x] < home[y] - away[y] || (home[x] - away[x] === home[y] - away[y] && rnd() < .5);
          const [h, a] = xHome ? [x, y] : [y, x];
          home[h]++; away[a]++;
          return [h, a];
        }));
      }
    }
    return days;
  }

  // The user's game on a schedule day: { opp, home }.
  userGame(day, tid = this.state.me) {
    const days = this.db.days, g = (days[day] || days[days.length - 1]).find(x => x[0] === tid || x[1] === tid);
    return g ? { opp: g[0] === tid ? g[1] : g[0], home: g[0] === tid } : { opp: tid === 0 ? 1 : 0, home: true };
  }
  seeds(s, conf) { return s.teams.filter(t => t.conf === conf).sort((a, b) => this.pct(b) - this.pct(a) || b.w - a.w).map(t => t.tid); }
  // ── Postseason ──────────────────────────────────────────────────────────────────
  // Play-in per conference: A = 7 v 8 (winner is the 7 seed), B = 9 v 10, C = loser A v
  // winner B for the 8 seed. Then four best-of-7 rounds, East and West separately, with
  // the conference champions meeting in the Finals. Home court: 2-2-1-1-1 to the higher seed.
  startPlayin() {
    this.setState(s => {
      if (s.phase !== 'regular' || this.gamesPlayed(s) < 82) return null;
      ccpPlay(this, s, 999); // the CCP finishes its season (playoffs in early April)
      const seeds: any = {}, playin: any = {};
      ['East', 'West'].forEach(c => {
        const sd = this.seeds(s, c); seeds[c] = sd;
        playin[c] = [{ id: 'A', label: '7 vs 8', a: sd[6], sa: 7, b: sd[7], sb: 8 }, { id: 'B', label: '9 vs 10', a: sd[8], sa: 9, b: sd[9], sb: 10 }, { id: 'C', label: 'For the 8 seed', a: null, sa: null, b: null, sb: null }];
      });
      const aw = computeAwards(this, s), P = this.db.P, T = s.teams, lgLog = s.lgLog.slice(), news = (s.news || []).slice();
      const LB = { mvp: 'Most Valuable Player', dpoy: 'Defensive Player of the Year', roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player' };
      Object.keys(LB).forEach(k => { const w = aw[k][0]; if (!w) return; lgLog.unshift({ day: s.day, type: 'Award', teams: T[w.tid]?.abbr || 'League', pids: [w.pid], text: P[w.pid].name + ' (' + (T[w.tid]?.abbr || 'FA') + ') is the ' + LB[k] + ': ' + w.line });
        if (k === 'mvp' && T[w.tid]) news.unshift({ day: s.day, season: this.Y, kind: 'award', tid: w.tid, who: T[w.tid].owner, role: 'Owner, ' + T[w.tid].abbr, pids: [w.pid], quote: P[w.pid].name + ' carried this franchise all year. Nobody in this league was more valuable, and nobody worked harder.' }); });
      (aw.defs || []).filter(d => !d.numTeams && !d.statRange && !['MVP', 'DPOY', 'ROY', 'SMOY', 'MIP'].includes(d.shortName)).forEach(d => { const w = aw.list?.[d.shortName]?.[0]; if (w) lgLog.unshift({ day: s.day, type: 'Award', teams: T[w.tid]?.abbr || 'League', pids: [w.pid], text: P[w.pid].name + ' (' + (T[w.tid]?.abbr || 'FA') + ') wins the ' + d.name + ': ' + w.line }); });
      if (aw.coy[0]) lgLog.unshift({ day: s.day, type: 'Award', teams: T[aw.coy[0].tid].abbr, text: aw.coy[0].name + ' (' + T[aw.coy[0].tid].abbr + ') is the Coach of the Year: ' + aw.coy[0].line });
      // The luxury tax is assessed on the last day of the regular season.
      const cap = { ...(s.cap || {}) };
      T.forEach(t => { const pay = teamSalary(this, s, t.tid), c = { ...(cap[t.tid] || {}) }; c.taxHist = [...(c.taxHist || []), pay > this.TAX]; c.ap2Hist = [...(c.ap2Hist || []), pay > this.AP2]; cap[t.tid] = c; });
      return { phase: 'playin', seeds, playin, cap, awards: { ...(s.awards || {}), [this.Y]: aw }, lgLog, news };
    });
  }
  playinPending(pi) {
    const out = [];
    ['East', 'West'].forEach(c => { const [A, B] = pi[c]; [A, B].forEach(x => { if (!x.done) out.push({ c, x }); }); });
    if (out.length) return out;
    ['East', 'West'].forEach(c => { const C = pi[c][2]; if (!C.done) out.push({ c, x: C }); });
    return out;
  }
  // One postseason game: simulated (or the finished Live Game), logged, stats on the playoff line.
  private postGame(s, home, away, forced, kind, finals?) {
    const res = forced && forced.home.tid === home && forced.away.tid === away ? forced : this.playGame(s, home, away);
    this.addBox(res, true); const bid = this.keepBox(res, s.day, kind);
    if (finals) [res.home, res.away].forEach(sd => Object.entries(sd.box).forEach(([k, b]: any) => { if (b.min <= 0) return; const t = (finals[k] = finals[k] || { gp: 0, min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pm: 0 }); t.gp++; Object.keys(t).forEach(f => { if (f !== 'gp') t[f] += b[f] || 0; }); }));
    return { res, log: { day: s.day, h: home, a: away, hp: res.home.pts, ap: res.away.pts, ot: res.ot, po: kind, bid } };
  }
  simPlayin(forced?: GameResult) {
    if (this.state.phase === 'playin' && !this.canPlay()) return;
    this.setState(s => {
      if (s.phase !== 'playin') return null;
      const pi = JSON.parse(JSON.stringify(s.playin)), todo = this.playinPending(pi);
      if (!todo.length) return null;
      const games = (s.games || []).slice(), rosters = { ...s.rosters }; let st: any = { ...s }, clubs = { ...(s.clubs || {}) };
      const note = (t, text) => { const pt = this.clubPatch({ ...st, clubs }, t, { log: [{ date: this.fmtS(s.day), day: s.day, text }, ...((this.clubOf({ ...st, clubs }, t) || {}).log || [])] }, clubs); if (pt.clubs) clubs = pt.clubs; else st = { ...st, ...pt }; };
      todo.forEach(({ c, x }) => {
        const { res, log } = this.postGame(s, x.a, x.b, forced, 'playin'); this.injGame(s, rosters, x.a); this.injGame(s, rosters, x.b);
        Object.assign(x, { hp: res.home.pts, ap: res.away.pts, bid: log.bid, done: true, w: res.home.pts > res.away.pts ? x.a : x.b, l: res.home.pts > res.away.pts ? x.b : x.a });
        games.push(log);
        [x.a, x.b].forEach(t => { if (this.isUser(s, t)) note(t, (x.w === t ? 'Won' : 'Lost') + ' the play-in (' + x.label + ') vs ' + s.teams[x.w === t ? x.l : x.w].abbr + ', ' + Math.max(x.hp, x.ap) + '–' + Math.min(x.hp, x.ap)); });
        if (x.id === 'B' || x.id === 'A') { const [A, B, C] = pi[c]; if (A.done && B.done) Object.assign(C, { a: A.l, sa: A.l === A.a ? 7 : 8, b: B.w, sb: B.w === B.a ? 9 : 10 }); }
      });
      return { ...st, clubs, playin: pi, games, rosters, day: s.day + 1 };
    });
  }
  startPlayoffs() {
    this.setState(s => {
      if (s.phase !== 'playin' || this.playinPending(s.playin).length) return null;
      const rounds = [[]];
      ['East', 'West'].forEach(c => {
        const sd = s.seeds[c], [A, , C] = s.playin[c], top = [...sd.slice(0, 6), A.w, C.w];
        [[0, 7], [3, 4], [2, 5], [1, 6]].forEach(([i, j]) => rounds[0].push({ a: top[i], sa: i + 1, b: top[j], sb: j + 1, wa: 0, wb: 0, conf: c, g: [] }));
      });
      return { phase: 'playoffs', po: { rounds, champ: null, finals: {} } };
    });
  }
  simPo(mode, forced?: GameResult) {
    if (this.state.phase === 'playoffs' && !this.canPlay()) return;
    this.setState(s => {
      if (s.phase !== 'playoffs' || !s.po || s.po.champ != null) return null;
      const po = { ...s.po, finals: { ...(s.po.finals || {}) }, cf: { ...(s.po.cf || {}) }, rounds: s.po.rounds.map(r => r.map(x => ({ ...x, g: (x.g || []).slice() }))) };
      const RN = ['first round', 'conference semifinals', 'conference finals', 'Finals'];
      const W = x => x.wa === 4 ? { t: x.a, sd: x.sa } : { t: x.b, sd: x.sb }, L = x => x.wa === 4 ? x.b : x.a, done = x => x.wa === 4 || x.wb === 4;
      const games = (s.games || []).slice(), poRosters = { ...s.rosters }; let day = s.day, st: any = { ...s }, clubs = { ...(s.clubs || {}) }, used = false;
      const note = (t, text) => { const pt = this.clubPatch({ ...st, clubs }, t, { log: [{ date: this.fmtS(day), day, text }, ...((this.clubOf({ ...st, clubs }, t) || {}).log || [])] }, clubs); if (pt.clubs) clubs = pt.clubs; else st = { ...st, ...pt }; };
      const advance = () => {
        const r = po.rounds[po.rounds.length - 1];
        if (r.length === 1) { po.champ = W(r[0]).t; po.runner = L(r[0]); return; }
        let nr = [];
        if (r.length === 2) { let e = W(r[0]), w = W(r[1]); if (this.pct(s.teams[w.t]) > this.pct(s.teams[e.t])) [e, w] = [w, e]; nr = [{ a: e.t, sa: e.sd, b: w.t, sb: w.sd, wa: 0, wb: 0, conf: 'Finals', g: [] }]; }
        else ['East', 'West'].forEach(c => { const cs = r.filter(x => x.conf === c); for (let i = 0; i < cs.length; i += 2) { const x = W(cs[i]), y = W(cs[i + 1]); const [hi, lo] = x.sd <= y.sd ? [x, y] : [y, x]; nr.push({ a: hi.t, sa: hi.sd, b: lo.t, sb: lo.sd, wa: 0, wb: 0, conf: c, g: [] }); } });
        po.rounds.push(nr);
      };
      const playDay = () => {
        const ri = po.rounds.length - 1, r = po.rounds[ri];
        r.forEach(x => {
          if (done(x)) return;
          const n = x.wa + x.wb, aHome = [0, 1, 4, 6].includes(n), home = aHome ? x.a : x.b, away = aHome ? x.b : x.a;
          const f = !used && forced && forced.home.tid === home && forced.away.tid === away ? forced : undefined;
          if (f) used = true;
          const { res, log } = this.postGame({ ...s, day }, home, away, f, 'po', ri === 3 ? po.finals : ri === 2 ? po.cf : null); this.injGame(s, poRosters, home); this.injGame(s, poRosters, away);
          games.push(log);
          const aWon = (res.home.pts > res.away.pts) === aHome;
          if (aWon) x.wa++; else x.wb++;
          x.g.push({ h: home, hp: res.home.pts, ap: res.away.pts, bid: log.bid });
          if (done(x)) [x.a, x.b].forEach(t => { if (this.isUser(s, t)) note(t, (W(x).t === t ? 'Won ' : 'Lost ') + (ri === 3 ? 'the Finals' : 'the ' + RN[ri]) + ' vs ' + s.teams[t === x.a ? x.b : x.a].abbr + ', ' + Math.max(x.wa, x.wb) + '–' + Math.min(x.wa, x.wb)); });
        });
        day++;
        if (r.every(done)) advance();
      };
      let g = 0;
      if (mode === 'game') playDay(); else if (mode === 'round') { const n0 = po.rounds.length; while (po.rounds.length === n0 && po.champ == null && g++ < 10) playDay(); } else while (po.champ == null && g++ < 40) playDay();
      const out: any = { ...st, clubs, po, games, day, rosters: poRosters };
      if (po.champ != null) {
        const T = s.teams, defs = awardDefs(s), fd = defs.find(d => d.statRange === -1), sd = defs.find(d => d.statRange === -2);
        const fin = po.rounds[3][0], fm = fd ? seriesMvp(this, s, fd, po.finals, { a: fin.a, b: fin.b, winner: po.champ }) : null;
        const sfmvp: Record<string, any> = {}; if (sd && po.rounds[2]) po.rounds[2].forEach(x => { sfmvp[x.conf] = seriesMvp(this, s, sd, po.cf, { a: x.a, b: x.b, winner: W(x).t }); });
        const aw = { ...((s.awards || {})[this.Y] || {}), fmvp: fm, sfmvp };
        const finOf = tid => { let fin = 'Missed the playoffs'; po.rounds.forEach((r, i) => r.forEach(x => { if (x.a === tid || x.b === tid) fin = W(x).t === tid ? (i === 3 ? 'Won the title' : fin) : 'Lost in the ' + RN[i]; })); if (fin === 'Missed the playoffs' && ['East', 'West'].some(c => s.playin?.[c]?.some(x => x.a === tid || x.b === tid))) fin = 'Lost in the play-in'; return fin; };
        const teams = {}; T.forEach(t => (teams[t.tid] = { rec: t.w + '–' + t.l, w: t.w, l: t.l, fin: finOf(t.tid), conf: t.conf, name: t.region + ' ' + t.name, abbr: t.abbr })); // every team, for league history
        out.history = [{ season: this.seasonLbl(), year: this.Y, champ: po.champ, runner: po.runner, rec: T[s.me].w + '–' + T[s.me].l, fin: finOf(s.me), teams, fmvp: fm?.pid, ring: (poRosters[po.champ] || []).slice() }, ...s.history]; // ring: the champion's roster at the final buzzer
        out.awards = { ...(s.awards || {}), [this.Y]: aw };
        out.lgLog = [{ day, type: 'Award', teams: T[po.champ].abbr, text: T[po.champ].region + ' ' + T[po.champ].name + ' won the ' + this.seasonLbl() + ' championship' }, ...(fm ? [{ day, type: 'Award', teams: T[po.champ].abbr, pids: [fm.pid], text: this.db.P[fm.pid].name + ' is the Finals MVP: ' + fm.line }] : []), ...s.lgLog];
        out.news = [{ day, season: this.Y, kind: 'title', tid: po.champ, who: T[po.champ].owner, role: 'Owner, ' + T[po.champ].abbr, quote: 'This city deserved this. I promised a champion and ' + T[po.champ].gm + ' and this group delivered one.' }, ...(s.news || [])];
        // The owner's year-end letter for each franchise you run.
        out.letters = { ...(s.letters || {}), [this.Y]: s.managed.map(t => yearEndLetter(this, { ...s, ...out }, t, finOf(t))) };
        out.letterUnread = s.spectator ? null : this.Y; // not opened on its own: the sim button offers "Next: Owner letter" (none in Spectator Mode)
        // Hall of Fame class of this year.
        const hofClass = voteHof(this, { ...s, awards: out.awards, history: out.history });
        if (hofClass.length) {
          out.hof = [...(s.hof || []), ...hofClass];
          out.lgLog = [{ day, type: 'Award', teams: 'Hall of Fame', pids: hofClass.map(h => h.pid), text: 'Hall of Fame class of ' + this.Y + ': ' + hofClass.map(h => this.db.P[h.pid].name + (h.firstBallot ? ' (first ballot)' : '')).join(', ') }, ...out.lgLog];
          const top = hofClass[0], tp = this.db.P[top.pid], lt = top.tids.slice(-1)[0];
          if (T[lt]) out.news = [{ day, season: this.Y, kind: 'hof', tid: lt, who: T[lt].owner, role: 'Owner, ' + T[lt].abbr, pids: [top.pid], quote: tp.name + ' belongs in the Hall. What he gave this game will outlast all of us.' }, ...out.news];
        }
      }
      return out;
    });
  }
  // The next postseason game involving a team, if any: { home, away, label }.
  nextPostGame(s, tid) {
    if (s.phase === 'playin' && s.playin) { const g = this.playinPending(s.playin).find(({ x }) => x.a === tid || x.b === tid); return g ? { home: g.x.a, away: g.x.b, label: 'Play-in · ' + g.c + ' ' + g.x.label } : null; }
    if (s.phase === 'playoffs' && s.po && s.po.champ == null) {
      const ri = s.po.rounds.length - 1, x = s.po.rounds[ri].find(y => (y.a === tid || y.b === tid) && y.wa < 4 && y.wb < 4);
      if (!x) return null;
      const n = x.wa + x.wb, aHome = [0, 1, 4, 6].includes(n);
      return { home: aHome ? x.a : x.b, away: aHome ? x.b : x.a, label: ['First round', 'Conference semifinals', 'Conference finals', 'Finals'][ri] + ' · Game ' + (n + 1) };
    }
    return null;
  }
  runLottery() {
    this.setState(s => {
      if (s.unemployed) return null;
      if (s.phase !== 'lottery') return null;
      // The 3-2-1 lottery (lottery.ts): all 16 lottery picks are drawn.
      const lgLog0: any[] = [], byW = (a, b) => this.pct(s.teams[a]) - this.pct(s.teams[b]);
      const f = lotteryField(this, s), drawn = drawLottery(f.teams), { order: r1 } = firstRoundOrder(this, s, drawn);
      const lotto = drawn.map((i, k) => { const x = f.teams[i], odds = lotteryOdds(f.teams)[i]; return { n: k + 1, t: x.tid, from: i + 1, tier: x.tier, balls: x.balls, noOne: x.noOne, noTop5: x.noTop5, odds1: odds[0], exp: +expectedPick(odds).toFixed(1) }; });
      // Teams above the 2nd apron in 3 of the last 5 seasons pick last in the first round.
      const demoted = r1.filter(t => ((s.cap?.[t]?.ap2Hist) || []).slice(-5).filter(Boolean).length >= 3);
      const first = [...r1.filter(t => !demoted.includes(t)), ...demoted], second = s.teams.map(t => t.tid).sort((a, b) => byW(a, b) || a - b);
      const picks = [...first.map((orig, i) => ({ n: i + 1, rd: 1, orig, pid: null })), ...second.map((orig, i) => ({ n: first.length + i + 1, rd: 2, orig, pid: null }))];
      if (demoted.length) lgLog0.push(...demoted.map(t => ({ day: s.day, type: 'Draft', teams: s.teams[t].abbr, text: s.teams[t].region + '’s first-round pick moved to the end of the round: above the 2nd apron in 3 of the last 5 seasons' })));
      const pr = settlePickRules(this, s, picks); lgLog0.push(...pr.log); // pick protections and swaps
      const jump = lotto.filter(x => x.n < x.exp - 0.5), lotHist = { ...(s.lotHist || {}), [this.Y]: Object.fromEntries(first.map((t, i) => [t, i + 1])) };
      return { phase: 'draft', picks, pi: 0, lotto, lotHist, assets: pr.assets, swaps: pr.swaps, lotReveal: 0, dClass: this.Y, lgLog: [...lgLog0, { day: s.day, type: 'Draft', teams: s.teams[lotto[0].t].abbr, text: s.teams[lotto[0].t].region + ' won the draft lottery with ' + lotto[0].balls + ' ball' + (lotto[0].balls === 1 ? '' : 's') + ' in the drum (' + (lotto[0].odds1 * 100).toFixed(1) + '% odds)' + (jump.length > 1 ? '. ' + jump.length + ' teams beat their expected slot.' : '') }, ...s.lgLog] };
    });
  }
  startPreFA() { startPreFA(this); }
  startFA() {
    if (this.state.god && this.state.gmOffer?.kind === 'expiring' && !this.state.unemployed) answerOffer(this, true); // God Mode: your contract renews itself
    this.setState(s => {
      if (s.phase !== 'draft' || s.pi < s.picks.length) return null;
      if (s.gmOffer?.kind === 'expiring' && !s.unemployed) return null; // answer the owner's contract offer first
      if (!s.preFA || (!s.easy?.cap && !s.spectator && preFAPending(this, s, s.me) > 0)) return null; // Pre-Free Agency first, with every decision made (the AI's, in Spectator Mode)
      // A new league year starts when free agency opens: the cap follows the projected cap
      // outlook (at most +10% a year, as the CBA allows), and every number tied to it (tax,
      // aprons, exceptions, max and min salaries) moves with it.
      const d = this.db, Y = this.Y + 1, growth = capGrowthFor(Y), capsBefore = { ...d.caps };
      ['CAP', 'MINP', 'TAX', 'AP1', 'AP2', 'VMIN', 'MLE', 'MAXC'].forEach(k => (d.caps[k] = +(d.caps[k] * growth).toFixed(1)));
      const capLine = { day: s.day, type: 'Signing', teams: 'League', text: 'The ' + (Y - 1) + '–' + String(Y).slice(2) + ' salary cap is $' + d.caps.CAP + 'M (' + (growth >= 1 ? 'up ' : 'down ') + Math.abs((growth - 1) * 100).toFixed(1) + '% from $' + capsBefore.CAP + 'M); tax line $' + d.caps.TAX + 'M, aprons $' + d.caps.AP1 + 'M and $' + d.caps.AP2 + 'M.' };
      const extPlan = Object.keys(s.decide || {}).filter(k => k.startsWith('ext') && s.decide[k]).map(k => +k.slice(3)), rePlan = Object.keys(s.decide || {}).filter(k => k.startsWith('re') && s.decide[k]).map(k => +k.slice(2));
      const { faNotes, ...out } = openFreeAgency(this, s), Pp = this.db.P;
      const reLine = rePlan.filter(id => out.fa.includes(id)).map(id => Pp[id].name);
      const notices = addNotice(s, { tone: 'info', title: 'Free agency is open', lines: [...faNotes, ...(reLine.length ? ['You planned to re-sign ' + reLine.join(', ') + ': make your offer' + (reLine.length > 1 ? 's' : '') + ' on the Free agency screen. Other teams can bid now too.'] : [])].filter(Boolean), pids: [] });
      const faTop = (out.fa || s.fa).slice().sort((a, b) => this.db.P[b].ovr - this.db.P[a].ovr).slice(0, 50);
      return { ...out, notices: faNotes.length || reLine.length ? notices : s.notices, preFA: null, extPlan, faStart: s.day, faTop, lgLog: this.stampFA({ ...s, faStart: s.day }, [...out.lgLog.slice(0, 1), capLine, ...out.lgLog.slice(1)], s.lgLog.length), phase: 'fa', log: s.spectator ? s.log : this.logEntry(s, 'Free agency opened. Your free agents keep their Bird rights and cap holds until they sign or you renounce them.') };
    });
    if (this.state.phase === 'fa') { teamSales(this); offseasonMandates(this); } // team sales close with the new league year; owners' payroll orders
  }
  // Free agency runs on the NBA calendar: negotiations open June 30 (day 0), the moratorium ends
  // July 6, Summer League is mid-July, then the market thins out until training camps open
  // September 30. Most of the big names agree in the first days; the rest trickle in.
  static FA_END = 92;
  faDayOf(s = this.state) { return s.phase === 'fa' ? Math.max(0, s.day - (s.faStart ?? s.day)) : 0; }
  faDate(s = this.state, fd = this.faDayOf(s)) { return new Date(this.Y, 5, 30 + fd); }
  faStage(fd: number) { return fd === 0 ? 'Negotiations open at 6 p.m. ET' : fd < 6 ? 'Moratorium: deals are agreed now and become official July 6' : fd < 10 ? 'Deals are official' : fd <= 20 ? 'Summer League in Las Vegas' : fd <= 60 ? 'The quiet stretch: the market thins out' : fd < Game.FA_END ? 'Camp invites and last-minute deals' : 'Training camps open'; }
  // How many moves AI teams try each day: a frenzy the first night, tapering to a trickle.
  static faPace(fd: number) { return fd === 0 ? 30 : fd === 1 ? 20 : fd === 2 ? 12 : fd < 6 ? 6 : fd < 10 ? 4 : fd <= 20 ? 2.5 : fd <= 45 ? 1 : fd <= 80 ? 0.6 : 1.5; }
  // Log entries made during free agency carry their real calendar date.
  stampFA(s, lgLog: any[], oldLen: number) { const n = lgLog.length - oldLen; if (n <= 0 || s.faStart == null) return lgLog; return lgLog.map((e, i) => i < n && !e.date && e.day >= s.faStart ? { ...e, date: new Date(this.Y, 5, 30 + e.day - s.faStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } : e); }
  advanceFA(days) {
    this.setState(s => {
      if (s.phase !== 'fa') return null;
      const fd0 = this.faDayOf(s), n = Math.max(0, Math.min(days, Game.FA_END - fd0)); if (!n) return null;
      const box = { rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } }, lgLog = s.lgLog.slice(), offerSheets = (s.offerSheets || []).slice(), sheets0 = offerSheets.length;
      let done = 0;
      // Players you're watching: ones who turned down your offer, and your own free agents.
      const P = this.db.P, watch = box.fa.filter(id => s.offered?.[id] || (P[id].birdTid != null && this.isUser(s, P[id].birdTid)));
      for (let d = 0; d < n; d++) { const fd = fd0 + d, pace = Game.faPace(fd), moves = Math.floor(pace) + (Math.random() < pace % 1 ? 1 : 0), st = { ...s, day: s.day + d };
        aiFreeAgencyDay(this, st, box, lgLog, offerSheets, moves, fd < 3 ? .94 : fd < 7 ? .96 : fd <= 20 ? .98 : .99); easyFreeAgency(this, st, box, lgLog); done++;
        // The summer trade market (tradeLogic.ts): AI teams deal for a reason here too.
        if (Math.random() < 0.3) { const bx: any = box; bx.assets = bx.assets || s.assets; const st3 = { ...st, rosters: box.rosters, cap: box.cap, assets: bx.assets }; for (let i = 0; i < 4; i++) { const x = aiTradeIdea(this, st3); if (x) { lgLog.unshift(this.execTrade(st3, bx, x, st.day)); break; } } }
        if (fd === 10) lgLog.unshift(...aiExtensions(this, { ...st, rosters: box.rosters, cap: box.cap }, 0.45)); // July: the first extension window
        if (offerSheets.length > sheets0 && !s.easy?.cap) break; } // stop the clock: one of your restricted free agents got an offer sheet
      // Easy mode answers offer sheets for your restricted free agents.
      const easyLines: string[] = [];
      if (s.easy?.cap) for (const o of offerSheets.slice()) { if (!this.isUser(s, o.to)) continue; const m = easyMatch(this, { ...s, rosters: box.rosters, cap: box.cap }, o), p = this.db.P[o.pid];
        lgLog.unshift({ day: s.day, type: 'Signing', teams: s.teams[m ? o.to : o.from].abbr, pids: [o.pid], text: applySigning(this, { ...s, rosters: box.rosters }, box, m ? o.to : o.from, p, m ? { ...o.terms, method: 'bird' } : o.terms) + (m ? ' (matched the offer sheet, easy mode)' : ' (' + s.teams[o.to].abbr + ' declined to match, easy mode)') }); offerSheets.splice(offerSheets.indexOf(o), 1);
        if (o.to === s.me) easyLines.push(m ? 'Your assistant matched the ' + s.teams[o.from].abbr + ' offer sheet for ' + p.name + ' (' + fmtMoney(o.terms.amt) + ' × ' + o.terms.years + '): he stays.' : 'Your assistant declined to match the ' + s.teams[o.from].abbr + ' offer sheet for ' + p.name + ': he signed there (' + fmtMoney(o.terms.amt) + ' × ' + o.terms.years + ').'); }
      let notices = s.notices; const T = s.teams, lines: string[] = [], pids: number[] = [];
      watch.forEach(id => { if (box.fa.includes(id)) return; const t = this.tidOf(box.rosters, id); if (t < 0 || this.isUser(s, t)) return; const p = P[id], o = s.offered?.[id];
        lines.push(p.name + (o ? ', who turned down your offer (' + fmtMoney(o.amt) + ' × ' + o.years + '),' : ', your free agent,') + ' signed with the ' + T[t].region + ' ' + T[t].name + ': ' + contractLine(this, p) + '.'); pids.push(id); });
      if (easyLines.length) notices = addNotice({ notices }, { tone: 'info', title: 'Offer sheets answered (easy mode)', lines: easyLines });
      if (lines.length) notices = addNotice({ notices }, { tone: 'bad', title: lines.length === 1 ? 'Signed elsewhere' : lines.length + ' players signed elsewhere', lines, pids });
      offerSheets.slice(sheets0).forEach(o => { if (o.to !== s.me) return; const p = P[o.pid]; notices = addNotice({ notices }, { tone: 'info', title: 'Offer sheet for ' + p.name, lines: ['The ' + T[o.from].region + ' ' + T[o.from].name + ' signed your restricted free agent ' + p.name + ' to an offer sheet: ' + fmtMoney(o.terms.amt) + ' × ' + o.terms.years + '.', 'Match it to keep him, or decline and he goes there. Answer on the Cap sheet; free agency is paused until you do.'], pids: [o.pid] }); });
      if (fd0 < 6 && fd0 + done >= 6 && (s.extPlan || []).length) { const xs = s.extPlan.filter(id => (box.rosters[s.me] || []).includes(id)).map(id => P[id]); if (xs.length) notices = addNotice({ notices }, { tone: 'info', title: 'The extension window is open', lines: ['It’s July 6: you planned to extend ' + xs.map(p => p.name).join(', ') + '. Open each player’s Contract tab to make an offer.'], pids: xs.map(p => p.id) }); }
      this.healIdle({ ...s, ...box, day: s.day + done }); // unsigned players heal over the summer
      return { ...box, notices, lgLog: this.stampFA(s, lgLog, s.lgLog.length), offerSheets, day: s.day + done, faPrev: s.day };
    });
    offseasonMandates(this); // the owner's payroll order follows your payroll through the summer
  }
  startPreseason() {
    // Training camp: play out what's left of free agency first (stops if one of your restricted
    // free agents gets an offer sheet you need to answer).
    if (this.state.phase === 'fa' && !(this.state.offerSheets || []).length) { const left = Game.FA_END - this.faDayOf(); if (left > 0) this.advanceFA(left); }
    this.setState(s => {
      if (s.phase !== 'fa' || (s.offerSheets || []).length) return null;
      snapEnd(this, s); // ratings at the end of the season, before summer development
      const P = this.db.P, d = this.db, Y = this.Y + 1, focusOf = (k, id) => { const c = this.clubOf(s, +k); return c ? ((c.coachAuto || {})[id] ? coachFocus(P[id]).focus : c.train?.[id] || 'Balanced') : 'Balanced'; }, progBy: Record<number, any[]> = {};
      let rosters = { ...s.rosters }, fa = s.fa.slice(), teams = s.teams.map(t => ({ ...t, seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 })), assets = s.assets.filter(a => a.yr > this.Y), log = s.log, lgLog = s.lgLog, prog = [];
      // Annual raises on contracts that began before this season.
      Object.values(rosters).flat().forEach((id: any) => { const p = P[id]; if (p.exp >= Y && p.signed?.season !== Y && p.raise) p.amt = +(p.amt * (1 + p.raise)).toFixed(2); });
      const grow = (p, tid = -1, focus = 'Balanced') => { const env = envOf(this, s, p, tid, rosters), cm = tid >= 0 ? coachMult(teamBudget(this, s, tid).Coaching) : 1; let pen = 0; if (p.age < 24 && (p.minorCount || 0) >= 4) { pen = -2; moveTruePot(p, -(1 + Math.floor(Math.random() * 3))); } p.minorCount = 0; p.age++; if (p.frozen) return p.ovr; const a = p.age, rate = this.devRate(p, a), form = this.seasonForm(p), wk = p.pers?.work ?? 50, nz = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
        // The offseason: his rate, shaped by personality and the hidden factor, a bit of confidence
        // from the season he just had, and luck. Now and then a young player breaks out or stalls.
        let x = rate * this.devMult(p, rate) * (rate > 0 ? env.mult : coachAging(cm)) * (rate > 0 && p.dyS === this.Y ? Math.max(p.godPot != null ? 0 : -.5, p.dy ?? 1) : 1) * (0.25 + Math.random() * .5) + (a <= 25 ? form * .8 : form * .3) + nz() * (a <= 24 ? 1.3 : .8) + pen;
        // Luck can carry him past his ceiling, but only partly: most of an overshoot is given back
        // (otherwise good luck raises the ceiling for good while bad luck is grown back: a ratchet).
        { const over = p.ovr + x - (fullCeil(p) + 1); if (over > 0) x -= over * 0.65; }
        let potD = 0; if (a <= 24 && (p.tpot ?? p.pot) - p.ovr >= 5) { const r = Math.random(); if (r < .04) { x += 2 + Math.random() * 2; potD += 3; } else if (r < .07) { x -= 1 + Math.random(); potD -= 4; } }
        // The year's change goes into his ratings his own way (development.ts): his body on its own
        // track, the rest into his skills by his development profile and focus, with a little noise.
        const from = p.ovr, dl = develop(p, x, 0.5, { year: this.Y, focus, keys: Game.FOCUS[focus], role: roleReps(this.seasonTotals(p, this.Y)), work: wk, slow: this.devMult(p, -1), rnd: Math.random });
        SKILLS.forEach(k => { const room = (p.ceil?.[k] ?? 99.5) + 0.5 - (p.r[k] + (p.rx?.[k] || 0)); dl[k] = Math.min((dl[k] || 0) + (Math.random() - .5) * 3, Math.max(dl[k] || 0, room)); }); // a little noise, never past a ceiling
        applyChange(p, dl); syncOvr(p);
        // His true ceiling moves only with real events: a breakout or a bust (above), a serious injury, a
        // rookie who couldn't adapt. A young player who stalls loses nothing up front, but the clock runs:
        // his potential (what he can still reach) shrinks with every lost year (potential.ts).
        if (a < 27) {
          const why: string[] = [], o0 = p.rh?.[this.Y]?.o?.ovrI ?? from, gain = p.ovr - o0, expG = Math.max(0, rate * this.devMult(p, rate));
          let pd = potD;
          const inj = (p.injHist || []).find((h: any) => h.season === this.seasonLbl() && h.games >= 40);
          if (inj) { pd -= 2 + Math.random() * 3; why.push('Setback: ' + inj.name); }
          if (p.draft === this.Y - 1 && form < -0.25) { pd -= 1 + Math.random() * 2; why.push('Couldn’t adapt to the NBA’s ' + (p.r.stre <= p.r.spd ? 'strength' : 'speed and pace')); }
          if (a <= 24 && gain <= 0 && !inj) why.push('Stalled');
          if (gain >= 0.7 * expG + 3) why.push('Breakout year');
          else if (!why.length && p.dyS === this.Y && (p.dy ?? 1) < 0.2) why.push(p.draft === this.Y - 2 ? 'Sophomore slump' : 'A lost year');
          if (env.mult <= 0.88) why.push('Held back by his situation (' + (env.parts.slice().sort((x2, y2) => x2[1] - y2[1])[0]?.[0] || 'environment').toLowerCase() + ')'); else if (env.mult >= 1.12) why.push('A good place to grow');
          { const rl = roleLead(roleReps(this.seasonTotals(p, this.Y)), 1.3); if (rl && gain > 0) why.push('His role made him more of a ' + ROLE_NOUN[rl]); }
          if (planStatus(p) === 'behind' && a >= 22) why.push('Behind his development plan');
          moveTruePot(p, pd);
          if (why.length && p.rh?.[this.Y]) p.rh[this.Y].why = why;
        }
        // A hidden gem's ceiling surfaces each summer too (intangibles.ts), prospects included.
        if (p.gem && p.gem.left > 0 && a <= 29) { const gx = Math.min(p.gem.left, p.gem.add * 0.3); p.gem.left = +(p.gem.left - gx).toFixed(3); moveTruePot(p, gx); if (gx >= 1 && p.rh?.[this.Y]) p.rh[this.Y].why = [...(p.rh[this.Y].why || []), 'Outgrowing his projection']; }
        sharpen(p); refreshPot(p); // the league's read of his potential gets closer every year
        // A late growth spurt: extremely rare, only for teenagers and 20–21-year-olds, one inch
        // (4 height points). Wingspan never changes.
        const spurt = a <= 19 ? .003 : a <= 21 ? .001 : 0; // about one player every two or three seasons, league-wide
        if (Math.random() < spurt) { const inch = 1, hIn = this.inches(p.hgt), nIn = Math.min(91, hIn + inch); if (nIn > hIn) { p.hgt = Math.floor(nIn / 12) + '′' + (nIn % 12) + '″'; setRating(p, 'hgt', Math.min(100, p.r.hgt + 4 * (nIn - hIn))); lgLog = [{ day: s.day, type: 'Team', teams: s.teams[Object.keys(rosters).find(k2 => rosters[k2].includes(p.id)) as any]?.abbr || 'FA', pids: [p.id], text: p.name + ' grew ' + (nIn - hIn === 1 ? 'an inch' : 'two inches') + ' over the summer (now ' + p.hgt + ')' }, ...lgLog]; } }
        return from; };
      // First NBA training camp: how each rookie's game translates (translation.ts). The scouts couldn't see it.
      const camp: Record<number, string[]> = {}, campIds: number[] = [];
      Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id]; if (!p?.dx || p.frozen) return; const b0 = Object.fromEntries(SKILLS.map(k2 => [k2, p.r[k2]])), e0 = ovrExact(p), tc = p.dx.c || 0, x = applyTranslation(p); if (!x) return;
        if (p.dv0) p.dv0.o = +(p.dv0.o + ovrExact(p) - e0).toFixed(2); // camp moved his level, not his growth: the plan moves with it (or a steal grows as if the jump were still ahead of him)
        if (p.ceil) SKILLS.forEach(k2 => { p.ceil[k2] = Math.min(99, Math.max(p.r[k2], p.ceil[k2] + p.r[k2] - b0[k2])); }); // his ceilings move with what camp showed (potential.ts)
        moveTruePot(p, tc); p.perr = +((p.perr || 0) * 0.75).toFixed(2); refreshPot(p); x.pot = p.pot;
        if (this.isUser(s, +k)) { (camp[+k] = camp[+k] || []).push((s.managed.length > 1 ? teams[k].abbr + ': ' : '') + translationLine(p, x)); campIds.push(id); }
        if (Math.abs(x.to - x.from) >= 7) lgLog = [{ day: s.day, type: 'Team', teams: teams[k].abbr, pids: [id], text: 'Training camp: ' + p.name + ' looks ' + (x.to > x.from ? 'far better' : 'far worse') + ' than the scouts saw (' + x.from + ' → ' + x.to + ')' }, ...lgLog]; }));
      Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const from = grow(P[id], +k, focusOf(k, id)); P[id].yrsWith = (P[id].yrsWith || 0) + 1; if (this.isUser(s, +k)) (progBy[+k] = progBy[+k] || []).push({ id, from, to: P[id].ovr }); }));
      fa.forEach(id => grow(P[id])); (s.overseas || []).forEach(id => { if (P[id]?.r && !P[id].retired) grow(P[id]); }); // free agents and players abroad: their summer too
      // His playing style catches up with his game: a summer's step toward what his new skills and role
      // point to (not every tendency moves every year), and hand-set tendencies fade (tendencies.ts).
      { const rk = optionRanks(P, rosters), md = this.strategies(s.teams, s, true), tOf = new Map<number, number>(); Object.keys(rosters).forEach(k => rosters[k].forEach((id: number) => tOf.set(id, +k)));
        [...Object.values(rosters).flat(), ...fa, ...(s.overseas || [])].forEach((id: any) => { const p = P[id]; if (!p?.r || p.retired) return; ensureTen(p); p.tenPrev = { ...p.ten }; evolveTendencies(p, { rank: rk.get(id) ?? null, mode: md[tOf.get(id) as number] }, 1, 0.8); }); }
      // Natural retirement: old and declining players call it a career (your own stars only when clearly done).
      const retire = id => P[id].age >= 35 && (P[id].ovr < 52 || Math.random() < .35);
      fa = fa.filter(id => { if (!retire(id)) return true; P[id].retired = { season: this.Y, age: P[id].age, tid: -1, why: 'Retired' }; addTx(this, s, P[id], { k: 'retire', text: 'Retired at ' + P[id].age }); return false; });
      Object.keys(rosters).forEach(k => { const user = this.isUser(s, +k), out = rosters[k].filter(id => retire(id) && (!user || P[id].ovr < 55 || P[id].age >= 38)); out.forEach(id => { P[id].retired = { season: this.Y, age: P[id].age, tid: +k, why: 'Retired' }; addTx(this, s, P[id], { k: 'retire', tid: +k, text: 'Retired at ' + P[id].age }); }); if (out.length) { rosters[k] = rosters[k].filter(id => !out.includes(id)); out.forEach(id => lgLog = [{ day: s.day, type: 'Release', teams: teams[k].abbr, text: P[id].name + ' retired at ' + P[id].age }, ...lgLog]); } });
      // About 100 prospects declare each year and 60 are drafted; the best ~45 undrafted players
      // sign as free agents (Exhibit 10s, two-ways, the CCP). The rest go overseas or back to school.
      const left = d.cls[this.Y].filter(id => !s.picks.some(x => x.pid === id)).slice(0, 45);
      left.forEach(id => { Object.assign(P[id], { undrafted: this.Y, cls: 0, dr: null, draft: this.Y, amt: nums(this).min(0), ask: nums(this).min(0), exp: Y + 1, yrsWith: 0, yos0: 0 }); fa.push(id); });
      [Y, Y + 1].forEach(yr => (d.cls[yr] || []).forEach(id => { const p = P[id]; p.age++; if (yr === Y) { if (p.from.lg === 'High school') p.from = { team: ['Kentucky', 'Duke', 'Kansas', 'UCLA', 'Gonzaga', 'Arizona', 'UConn', 'Houston'][id % 8], lg: 'NCAA', country: 'US' }; else if (p.from.lg === 'Junior') p.from = { ...p.from, team: p.from.team.replace(' U18', ''), lg: 'Senior club' }; } }));
      d.cls[Y + 2] = []; for (let k = 0; k < 100 + 3 * (teams.length - 30); k++) { const p = this.mkPlayer(22 + Math.random() * 12, 16 + Math.floor(Math.random() * 2), s.natW || natDefault(), Y + 2); if (!maybeSon(this, p, Math.random)) maybeBrother(this, { rosters, fa }, p, Math.random); p.pot = this.prospectPot(p, Math.random); p.exp = Y + 5; d.cls[Y + 2].push(p.id); }
      d.cls[Y + 2].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      // Picks two years out, unless the trading horizon already made them (it usually has: adding them
      // again duplicated every one of them).
      { const have = new Set(assets.map(a => a.id)); teams.forEach(t => [1, 2].forEach(rd => { const id = (Y + 2) + '-' + rd + '-' + t.tid; if (!have.has(id)) assets.push({ id, yr: Y + 2, rd, orig: t.tid, owner: t.tid }); })); }
      // Expansion: any even number of new franchises (chosen from the franchise database or
      // designed in Settings) join now; the league can expand again later.
      let expanded = s.expanded, expansion = s.expansion, expTeams = s.expTeams;
      if (s.expansion) {
        const picks = (s.expTeams || []).filter(Boolean).filter(n => !teams.some(t => t.abbr === n.abbr || t.region + t.name === n.region + n.name));
        const dflt = ['East', 'West'].map(c => FRANCHISES.find(f => f.conf === c && f.pop >= 1 && !teams.some(t => t.region === f.region || t.abbr === f.abbr))).filter(Boolean).map((f: any) => ({ region: f.region, name: f.name, abbr: f.abbr, conf: f.conf, div: f.div, mkt: marketOf(f), colors: f.colors, icon: f.icon }));
        const NEW = picks.length >= 2 && picks.length % 2 === 0 ? picks : dflt;
        NEW.forEach(n => { const tid = teams.length; const t = { tid, ...n, str: 46, owner: namePools().us.f[(tid * 7) % 20] + ' ' + OWNER_SURNAMES[(tid * 3) % OWNER_SURNAMES.length], arch: OWNER_ARCHETYPES[tid % OWNER_ARCHETYPES.length], gm: namePools().us.f[(tid * 5) % 20] + ' ' + namePools().us.l[(tid * 11) % 20], seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 }; teams.push(t); d.teams.push({ ...t }); rosters[tid] = []; [Y, Y + 1, Y + 2].forEach(yr => [1, 2].forEach(rd => assets.push({ id: yr + '-' + rd + '-' + tid, yr, rd, orig: tid, owner: tid }))); });
        const first = teams.length - NEW.length, newT = NEW.map((_, j) => first + j);
        // Expansion draft: each existing AI club loses one player outside its top eight.
        for (let t = 0; t < first; t++) { if (this.isUser(s, t)) continue; const ids = rosters[t].slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(8); if (!ids.length) continue; const id = ids[Math.floor(Math.random() * ids.length)]; rosters[t] = rosters[t].filter(x => x !== id); const nt = newT[t % newT.length]; rosters[nt] = [...rosters[nt], id]; addTx(this, s, P[id], { k: 'expansion', from: t, to: nt }); }
        newT.forEach(nt => { while (rosters[nt].length < rosterMin(s) && fa.length) { const id = fa.sort((a, b) => P[b].ovr - P[a].ovr).shift(); P[id].amt = P[id].ask; rosters[nt] = [...rosters[nt], id]; } });
        for (let k = 0; k < NEW.length; k++) { const p = this.mkPlayer(30 + Math.random() * 10, 18, s.natW || natDefault(), Y + 1); p.pot = this.prospectPot(p, Math.random); d.cls[Y + 1].push(p.id); }
        expanded = (typeof s.expanded === 'number' ? s.expanded : s.expanded ? 2 : 0) + NEW.length; expansion = false; expTeams = [];
        lgLog = [{ day: s.day, type: 'Signing', teams: NEW.map(n => n.abbr).join(' · '), text: 'The league expanded to ' + teams.length + ' teams: ' + NEW.map(n => n.region + ' ' + n.name).join(', ') + '.' }, ...lgLog];
      }
      // Restricted free agents nobody signed take their qualifying offers; AI clubs fill to the minimum
      // (14) with minimum deals and cut to the limit (15; guaranteed money they waive stays on their cap).
      const box = { rosters, fa, overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } }, byClub: Record<number, string[]> = {};
      const lgA: any[] = [], sT = { ...s, teams }; acceptQualifyingOffers(this, sT, box, lgA, byClub);
      Object.keys(box.rosters).forEach(k => { if (this.isUser(s, +k)) return; fillRoster(this, sT, box, +k, lgA); trimRoster(this, sT, box, +k, lgA); });
      // Free agents with no NBA future leave the league.
      // Unsigned free agents with no NBA future leave the league (or retire when they're old).
      box.fa = box.fa.filter(id => { const p = P[id]; if (p.rfa || p.age < 24 || (p.ovr >= 43 && p.age < 31) || (p.ovr >= 48 && p.age < 34) || p.ovr >= 55) return true; p.retired = { season: this.Y, age: p.age, tid: -1, why: p.age >= 33 ? 'Retired' : 'Left the league' }; return false; });
      // The market holds about 90 players into the season (the NBA's in-season pool of unsigned
      // veterans and CCP hopefuls); the rest sign abroad or move on.
      if (box.fa.length > 90) { const val = id => P[id].ovr + (P[id].age < 25 ? Math.max(0, P[id].pot - P[id].ovr) * 0.5 : 0) + (P[id].rfa ? 50 : 0); const keep = new Set(box.fa.slice().sort((a, b) => val(b) - val(a)).slice(0, 90));
        box.fa.filter(id => P[id].undrafted === this.Y && P[id].cls === 0).sort((a, b) => P[b].pot - P[a].pot).slice(0, 20).forEach(id => keep.add(id)); // the draft's best undrafted rookies stay (the CCP), as camp invites and two-ways do
        box.fa = box.fa.filter(id => { if (keep.has(id)) return true; P[id].retired = { season: this.Y, age: P[id].age, tid: -1, why: P[id].age >= 32 ? 'Retired' : 'Left the league (signed abroad)' }; addTx(this, s, P[id], { k: 'retire', text: P[id].retired.why + ' at ' + P[id].age }); return false; }); }
      rosters = box.rosters; fa = box.fa; lgLog = [...lgA, ...lgLog];
      [...Object.values(rosters).flat(), ...fa].forEach((id: any) => Object.assign(P[id], { gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0 }));
      Object.keys(rosters).forEach(k => { if (!this.isUser(s, +k)) { const o = rosters[k].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); teams[k].str = o.reduce((a, b) => a + b, 0) / o.length - 4.3; } });
      d.days = this.buildSchedule(teams.length);
      const order = teams.slice().sort((a, b) => a.str - b.str).map(t => t.tid);
      d.rank = { ...d.rank }; d.cls[Y].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      Object.values(progBy).forEach(x => x.sort((a, b) => (b.to - b.from) - (a.to - a.from)));
      [...Object.values(rosters).flat(), ...fa].forEach((id: any) => { if (P[id].twoWay) P[id].twoWay.games = 0; delete P[id].poIneligible; P[id].fat = 0; P[id].last5 = []; P[id].protect = false; P[id].minMin = 0; P[id].padding = false; P[id].moodAdj = Math.round((P[id].moodAdj || 0) / 2); });
      this.refreshNorms({ rosters, season: Y });
      let clubs = { ...(s.clubs || {}) }, top: any = {};
      s.managed.forEach(t => { const f: any = { prog: progBy[t] || [] }; if (byClub[t]) { const c = this.clubOf(s, t); f.log = [...byClub[t].map(text => ({ date: this.fmtS(s.day), day: s.day, text })), ...((c && c.log) || [])]; }
        const pt = this.clubPatch(s, t, f, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; });
      (this.db as any).boxes = {}; // last season's box scores go with its game log
      const qoMine = (byClub[s.me] || []).filter(x => /qualifying offer/.test(x)), campLines = s.managed.flatMap((t: number) => camp[t] || []);
      const campNotes = campLines.length ? addNotice(s, { tone: 'info', title: 'Training camp: your rookies', lines: [...campLines, 'Draft boards show how a player looked as an amateur; camp shows how his game carries over to the NBA.'], pids: campIds }) : s.notices;
      return { ...top, notices: campNotes, ...(qoMine.length ? { notices: addNotice({ notices: campNotes }, { tone: 'info', title: 'Qualifying offers accepted', lines: qoMine.map(x => x + ' (one year; he’s under contract with you this season).') }) } : {}), clubs, offered: {}, extPlan: [], cap: box.cap, overseas: box.overseas, tstats: {}, tstatsHist: { ...(s.tstatsHist || {}), [this.Y]: s.tstats || {} }, favBench: {}, mandateFails: {}, season: Y, phase: 'preseason', rosters, fa, teams, assets, day: 0, expansion, expTeams, games: [], po: null, playin: null, playinRes: [], lotto: null, picks: [...order.map((orig, i) => ({ n: i + 1, rd: 1, orig, pid: null })), ...order.map((orig, i) => ({ n: order.length + i + 1, rd: 2, orig, pid: null }))], pi: 0, dClass: Y, adv: {}, expanded, lgLog, screen: s.spectator ? s.screen : 'dash', tTid: s.teams.find(t => !this.isUser(s, t.tid)).tid, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [] };
    });
    this.enforceRetirement();
    offseasonMandates(this);
  }
  // Opening night: every club needs 13 players. Short-handed managed clubs sign the best
  // remaining free agents to minimum deals (logged), as the league would require.
  // Mandatory retirement age (Settings): anyone at or past it retires on the spot,
  // from a roster, free agency or a club abroad.
  enforceRetirement() {
    this.setState(s => {
      const lim = s.retireAge; if (!lim) return null;
      const P = this.db.P, gone: [number, number][] = [], rosters = { ...s.rosters };
      Object.keys(rosters).forEach(k => { const out = rosters[k].filter(id => P[id].age >= lim); if (out.length) { rosters[k] = rosters[k].filter(id => !out.includes(id)); out.forEach(id => gone.push([id, +k])); } });
      const fa = s.fa.filter(id => { if (P[id].age < lim) return true; gone.push([id, -1]); return false; });
      const overseas = (s.overseas || []).filter(id => { if (P[id].age < lim) return true; gone.push([id, -2]); return false; });
      if (!gone.length) return null;
      let clubs = { ...(s.clubs || {}) }, top: any = {};
      const lgLog = [...gone.map(([id, t]) => { const p = P[id]; p.retired = { season: this.Y, age: p.age, tid: t >= 0 ? t : -1, why: 'Reached the retirement age (' + lim + ')' }; delete p.abroad;
        return { day: s.day, type: 'Release', teams: t >= 0 ? s.teams[t].abbr : t === -2 ? 'Abroad' : 'FA', pids: [id], text: p.name + ' retired at ' + p.age + ': the league’s mandatory retirement age is ' + lim }; }), ...s.lgLog];
      s.managed.forEach(t => { const mine = gone.filter(x => x[1] === t); if (!mine.length) return; const c = this.clubOf({ ...s, ...top, clubs }, t), pt = this.clubPatch({ ...s, ...top, clubs }, t, { log: [...mine.map(([id]) => ({ date: this.fmtS(s.day), day: s.day, text: P[id].name + ' retired (reached the retirement age of ' + lim + ')' })), ...(c.log || [])] }, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; });
      return { ...top, clubs, rosters, fa, overseas, lgLog, tMine: s.tMine.filter(id => !P[id].retired), tTheirs: s.tTheirs.filter(id => !P[id].retired) };
    });
  }
  // Opening night: at most 15 standard contracts (the season limit) and 3 two-ways, at least 14. Exhibit 10
  // players still on the roster become standard contracts; short clubs sign minimum deals.
  startSeason() {
    this.healIdle(this.state);
    this.setState(st => ({ assets: this.ensureAssets(st) })); // a new year of picks joins the trading horizon
    // Safety net: every overall matches its ratings on opening night (ratings.ts).
    (Object.values(this.db.P) as any[]).forEach(p => { if (p.r && !p.retired && !p.gone) syncOvr(p); });
    this.setState(s => {
      if (s.phase !== 'preseason' || s.unemployed) return null;
      const P = this.db.P, box = { rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } }, lgLog = s.lgLog.slice(), by: Record<number, string[]> = {};
      easyCuts(this, s, box, lgLog);
      if (!s.managed.every(t => stdIds(this, box.rosters[t]).length <= seasonMax(s) && twoWayIds(this, box.rosters[t]).length <= TWO_WAY_MAX)) return null;
      Object.keys(box.rosters).forEach(k => { const t = +k; box.rosters[t].forEach(id => { if (P[id].ctype === 'ex10') P[id].ctype = 'min'; });
        if (!this.isUser(s, t)) trimRoster(this, s, box, t, lgLog);
        const signed = fillRoster(this, s, box, t, lgLog); if (signed.length && this.isUser(s, t)) by[t] = ['League minimum of ' + rosterMin(s) + ' players: signed ' + signed.join(', ') + ' to minimum deals']; });
      // Opening night: an owner's payroll order still unmet → his fire sale, before the first game
      // (after AI teams cut to 15, so the teams taking the contracts have room).
      const fsPatch = openingNightFireSales(this, s, box.rosters, lgLog, box.fa); s = { ...s, ...fsPatch };
      // The league always has about 90 unsigned players on opening night: journeymen back from
      // overseas, CCP veterans and late bloomers join the pool if it has run low.
      for (let k = 0; box.fa.length < 90 && k < 200; k++) { const age = 23 + Math.floor(Math.random() * 9), p = this.mkPlayer(38 + Math.random() * 13, age, s.natW || natDefault(), 0);
        Object.assign(p, { yos0: Math.max(0, age - 23), exp: this.Y + 1, inc: [], draft: this.Y - (age - 21), dr: null }); p.amt = nums(this).min(p.yos0); p.ask = askOf(this, p); box.fa.push(p.id); }
      placeInGLeague(this, s, box.fa);
      ccpNewSeason(this, s, this.Y); ccpTopUp(this, s, box.fa); // a new CCP season (tips off in November)
      removeUnplayed(this, s); slimRetired(this); // this summer's retirees: remove those who never played here, trim the rest
      return { ...fsPatch, ...clubLogs(this, s, by), ...box, lgLog, phase: 'regular', prog: null, jobs: null };
    });
    if (this.state.phase === 'regular') {
      // Opening night: the extension deadline (AI teams finish their deals), and the media's
      // preseason predictions are locked in.
      const ext = aiExtensions(this, this.state, 0.5); if (ext.length) this.setState(st => ({ lgLog: [...ext, ...st.lgLog] }));
      mediaPreds(this, this.state);
      snapOpening(this, this.state); // opening-night ratings for year-over-year progress
      this.rollDevYear(this.state);
    }
  }
  // "Oct 21": one shared formatter and a per-season cache (formatting dates is slow).
  private fmtCache: { k: string; m: Map<number, string> } = { k: '', m: new Map() };
  fmtS(off) { const k = this.Y + '|' + (this.db.midStart ? 1 : 0); if (this.fmtCache.k !== k) this.fmtCache = { k, m: new Map() }; let v = this.fmtCache.m.get(off); if (v == null) { v = SHORT_DATE.format(this.dateOf(off)); this.fmtCache.m.set(off, v); } return v; }
  logEntry(st, text) { return [{ date: this.fmtS(st.day), day: st.day, text }, ...st.log]; }
  flag(code) { return 'flags/' + this.db.C[code].iso + '.svg'; }
  pct(t) { return t.w + t.l ? t.w / (t.w + t.l) : 0; }
  inches(h) { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; }
  owner2027(orig, assets, rd = 1) { return (assets.find(a => a.yr === this.Y && a.rd === (rd || 1) && a.orig === orig) || { owner: orig }).owner; }
  fair(ovr) { return Math.min(this.MAXC, (2.4 + Math.pow(Math.max(0, ovr - 42) / 28, 2.1) * 52) * this.db.sf * this.CAP / CAPS0.CAP); }
  // Where each AI team is headed (`all`: the teams you run too): contending, the middle, rebuilding.
  strategies(T, s = this.state, all = false) {
    const sc = t => this.pct(t) * 0.65 + (t.str - 45) / 12 * 0.35;
    const srt = T.filter(t => all || !this.isUser(s, t.tid)).sort((a, b) => sc(b) - sc(a)), out = {};
    srt.forEach((t, i) => out[t.tid] = i < 9 ? 'contend' : i >= 20 ? 'rebuild' : 'middle');
    return out;
  }
  // Where a team ranks, worst first: by record, or before any games by roster strength (the
  // order this season's picks were set in).
  slotOf(orig, T) {
    if (!this.gamesPlayed(this.state)) { const i = this.state.picks.filter(x => (x.rd || 1) === 1).findIndex(x => x.orig === orig); if (i >= 0) return i + 1; }
    const srt = T.slice().sort((a, b) => this.pct(a) - this.pct(b)); return srt.findIndex(t => t.tid === orig) + 1;
  }
  // This year's draft order, as the draft board shows it and trades value it: the real order
  // once it's set; before that a projection, the lottery teams by expected pick under the
  // 3-2-1 lottery and everyone else worst first (by record, or by roster strength before any
  // games are played).
  private boardCache = new WeakMap<object, any[]>();
  boardOrder(s = this.state) {
    const hit = this.boardCache.get(s); if (hit) return hit;
    const T = s.teams, pct = t => this.pct(t), gp = this.gamesPlayed(s);
    const list = (r1: number[], r2: number[]) => [...r1.map((orig, i) => ({ n: i + 1, rd: 1, orig, pid: null })), ...r2.map((orig, i) => ({ n: r1.length + i + 1, rd: 2, orig, pid: null }))];
    let out = s.picks;
    if (['regular', 'playin', 'playoffs', 'lottery'].includes(s.phase) && gp > 0) out = list(firstRoundOrder(this, s).order, T.map(t => t.tid).sort((a, b) => pct(T[a]) - pct(T[b]) || a - b));
    else if (['preseason', 'regular'].includes(s.phase) && !gp) {
      const r1 = s.picks.filter(x => (x.rd || 1) === 1).map(x => x.orig), ex = expectedByRank(T.length), L = Math.min(r1.length, ex.length - 1);
      const lot = r1.slice(0, L).map((orig, i) => ({ orig, e: ex[i + 1] })).sort((a, b) => a.e - b.e).map(x => x.orig);
      out = list([...lot, ...r1.slice(L)], s.picks.filter(x => x.rd === 2).map(x => x.orig));
    }
    this.boardCache.set(s, out); return out;
  }
  // Expected slot under the 3-2-1 lottery (the worst records no longer mean the best odds).
  // This year's firsts use the draft board's order, so the two always agree.
  // For future years: the team outlook (tradeLogic.ts): projected strength from the roster, ages and
  // contracts, pulled toward the middle the further out it is.
  projSlot(k, T) { if (k.yr === this.Y && (k.rd || 1) === 1) { const x = this.boardOrder().find(p => (p.rd || 1) === 1 && p.orig === k.orig); if (x && this.gamesPlayed(this.state) > 0) return x.n; }
    void T; return slotDist(this, this.state, k.orig, k.yr).reduce((a, [sl, w]) => a + sl * w, 0); }
  // Team tid's read of a player's potential (potential.ts): its own staff's for its own players, its
  // scouts' (the league's read plus their miss; the budget buys accuracy) for everyone else. God Mode:
  // you see the truth.
  potRead(p, tid, s = this.state) {
    if (tid == null || tid < 0 || !p) return p?.pot ?? 0;
    if (s.god && this.isUser(s, tid)) return p.tpot ?? p.pot;
    if ((s.rosters[tid] || []).includes(p.id)) return potView(p, { own: true });
    return teamRead(p, tid, scoutSd(teamBudget(this, s, tid).Scouting, !!s.easy?.scouting && this.isUser(s, tid)));
  }
  // A player's worth to a team with strategy st; tid: whose eyes (its read of his potential).
  pVal(p, st, tid?: number) {
    const pot = tid == null ? p.pot : this.potRead(p, tid), base = Math.pow(Math.max(0, p.ovr - 38), 1.9) / 10;
    const gap = Math.max(0, pot - p.ovr), youth = p.age <= 22 ? gap * 1.2 : p.age <= 25 ? gap * 0.6 : 0;
    const agePen = p.age >= 31 ? 0.65 : p.age >= 29 ? 0.85 : 1;
    const M = { rebuild: [p.age >= 29 ? 0.55 : 0.9, 1.7, 0.35], middle: [0.9, 1.4, 1.0], contend: [1.35, 0.5, 0.75] }[st];
    let v = base * agePen * M[0] + youth * M[1];
    if (st === 'middle' && p.age <= 24 && pot >= 60) v += 8;
    return v + contractValue(this, p, tid == null ? 0.35 * M[2] : contractK(this, this.state, tid, st)); // tradeLogic: a bad contract costs more near the tax, less with room
  }
  kVal(k, st, giving, T) {
    // Draft rights are worth the player (on his rookie deal), not the slot.
    const r = this.draftRights(k); if (r) { const p = this.db.P[r.pid]; return Math.max(2, this.pVal({ ...p, amt: (r.rd || 1) === 1 ? this.rookieAmt(r.n) : nums(this).min(0), exp: this.Y + 4 }, st)); }
    // Expected value over where it could land (tradeLogic.ts: the team outlook, uncertainty growing by year).
    void T; const v = pickWorth(this, this.state, k);
    return v * ({ rebuild: [1.6, 1.6], middle: [1.05, 1.45], contend: [0.7, 0.75] }[st][giving ? 1 : 0]);
  }
  // A pick in a trade, with any protection you're attaching to it (s.tProt).
  tradeAsset(s, id) { const a = s.assets.find(x => x.id === id); if (!a) return null; const pr = (s.tProt || {})[id]; return pr && !a.prot && a.rd === 1 ? { ...a, prot: pr } : a; }
  // Swap rights ("swap:2028"): the holder may trade its own first for the grantor's that year if the
  // grantor's lands higher. Worth the expected gain (bigger when the grantor looks worse) plus a little.
  swapVal(yr, holder, grantor, st, T, giving = false) { void T; return swapWorth(this, this.state, yr, holder, grantor) * ({ rebuild: [1.6, 1.6], middle: [1.05, 1.45], contend: [0.7, 0.75] } as any)[st || 'middle'][giving ? 1 : 0]; } // tradeLogic: expected gain under uncertainty
  static isSwap = (id: any) => typeof id === 'string' && id.startsWith('swap:');
  tradeItemVal(s, id, st, giving, holder, grantor) { if (Game.isSwap(id)) return this.swapVal(+id.slice(5), holder, grantor, st, s.teams, giving); const a = this.tradeAsset(s, id); return a ? this.kVal(a, st, giving, s.teams) : 0; }
  tradeItemLabel(s, id, T) { if (Game.isSwap(id)) return id.slice(5) + ' first-round swap rights'; const a = this.tradeAsset(s, id); return a ? this.pickLabel(a, T) : ''; }
  evalTrade(s, mine, theirs, kMine, kTheirs) {
    const P = this.db.P, st = this.strategies(s.teams)[s.tTid];
    const recv = mine.reduce((a, id) => a + this.pVal(P[id], st, s.tTid), 0) + kMine.reduce((a, id) => a + this.tradeItemVal(s, id, st, false, s.tTid, s.me), 0);
    const give = theirs.reduce((a, id) => a + this.pVal(P[id], st, s.tTid), 0) + kTheirs.reduce((a, id) => a + this.tradeItemVal(s, id, st, true, s.me, s.tTid), 0);
    const thr = Math.max(1, Math.abs(give) * 0.06);
    return { st, recv, give, diff: recv - give - thr, ok: recv - give >= thr };
  }
  // ── Injury countdowns: games and days ──────────────────────────────────────────────
  // An injury is the games he'll miss (inj.games, one fewer each game his team plays) and the day he's
  // back (inj.until, a calendar day: the date of his first game back, on this season's schedule and then
  // next season's). Days run on the calendar, summer included; games only when there are games.
  // A player without a team heals on the calendar alone.
  // Today, as a day number: game days spread over the real calendar (dateOf), fixed dates in the summer.
  calNow(s = this.state) {
    const dn = (d: Date) => Math.floor(d.getTime() / 864e5), Y = s.season || this.Y, ph = s.phase;
    if (ph === 'lottery') return dn(new Date(Y, 5, 20));
    if (ph === 'draft') return dn(new Date(Y, 5, s.preFA ? 28 : 25));
    if (ph === 'fa') return dn(new Date(Y, 6, 1 + this.faDayOf(s)));
    if (ph === 'preseason') return dn(new Date(Y - 1, 8, 29));
    return dn(this.dateOf(s.day));
  }
  // The day he's back after `games` more of his team's games. last: the last game day played; gp: games
  // played through it (between game days: the defaults; inside a day's injury tick: that day).
  injUntil(s, games, last = s.day - 1, gp = this.gamesPlayed(s)) {
    const dn = (d: Date) => Math.floor(d.getTime() / 864e5), Y = s.season || this.Y;
    if (s.phase === 'regular') { const left = Math.max(0, 82 - gp); if (games < left) return dn(this.dateOf(last + games + 1)); games -= left; } // the day of his first game back
    const open = s.phase === 'preseason' ? Y - 1 : Y; // next opening night: Oct 21
    return dn(new Date(open, 9, 21 + Math.round(Math.max(0, games) * 2.14)));
  }
  // Games and days left (null if healthy).
  injLeft(p, s = this.state) { const i = p?.inj; if (!i) return null; if (i.until == null) i.until = this.injUntil(s, i.games); return { games: Math.max(0, i.games), days: Math.max(0, i.until - this.calNow(s)) }; }
  // "5 games / 12 days" (short: "5g / 12d").
  injText(p, short = false, s = this.state) { const l = this.injLeft(p, s); if (!l) return ''; return short ? l.games + 'g / ' + l.days + 'd' : l.games + ' game' + (l.games === 1 ? '' : 's') + ' / ' + l.days + ' day' + (l.days === 1 ? '' : 's'); }
  // Free agents and players abroad heal on the calendar; in season their games left follow the days.
  healIdle(s) { const now = this.calNow(s), P = this.db.P; [...(s.fa || []), ...(s.overseas || [])].forEach((id: number) => { const p = P[id]; if (!p?.inj) return; if (p.inj.until == null) p.inj.until = this.injUntil(s, p.inj.games); const left = p.inj.until - now; if (left <= 0) { delete p.inj; delete p.preInj; } else if (s.phase === 'regular') p.inj.games = this.injGamesTo(s, p.inj.until); }); }
  // In season: how many of a team's games fall before that day (this season's, then next season's).
  injGamesTo(s, until) { const dn = (d: Date) => Math.floor(d.getTime() / 864e5), gp = this.gamesPlayed(s), left = Math.max(0, 82 - gp), now = this.calNow(s), end = dn(this.dateOf(s.day - 1 + left)); if (until <= end) return Math.max(1, Math.round((until - now) / 2.14)); return left + Math.max(0, Math.round((until - dn(new Date(s.season || this.Y, 9, 21))) / 2.14)); }
  // A team you run: an injured player who won't play through it drops to the end of the roster (out of
  // the rotation), and when he's healthy he goes back to his old spot and minutes. (Without a record of
  // his spot: back among the healthy players by rating.)
  injAway(rosters, tid, p) { const i = (rosters[tid] || []).indexOf(p.id); if (i < 0) return; p.preInj = { tid, i, rot: p.rot ?? null }; rosters[tid] = [...rosters[tid].filter(x => x !== p.id), p.id]; }
  injBack(s, rosters, tid, p) {
    const b = p.preInj; delete p.preInj; if (!this.isUser(s, tid) || !rosters[tid]?.includes(p.id)) return;
    // He goes back to his old spot unless you moved him yourself while he was out (moving him on the
    // roster forgets his spot: he stays where you put him). A player parked before spots were
    // remembered (older saves) is placed by his overall, if he's still at the end.
    const P = this.db.P, at0 = rosters[tid].indexOf(p.id);
    if (!b && rosters[tid].slice(at0 + 1).some(x => !P[x].inj || P[x].inj.dtd)) return;
    const rest = rosters[tid].filter(x => x !== p.id), at = b && b.tid === tid ? b.i : rest.filter(x => (!P[x].inj || P[x].inj.dtd) && P[x].ovr > p.ovr).length;
    rest.splice(Math.min(at, rest.length), 0, p.id); rosters[tid] = rest;
    if (b && b.tid === tid) { if (b.rot == null) delete p.rot; else p.rot = b.rot; } else if (p.rot === 0) delete p.rot;
  }
  // A postseason game: his team played one, so his injury is one game shorter.
  injGame(s, rosters, tid) { (rosters[tid] || []).forEach((id: number) => { const p = this.db.P[id]; if (!p?.inj) return; p.inj.games--; if (p.inj.games <= 0) { delete p.inj; this.injBack(s, rosters, tid, p); } }); }
  injTick(rosters, day, s, out, mins: Record<number, number> = {}) {
    const P = this.db.P, pk = a => a[Math.floor(Math.random() * a.length)];
    const hbOf = k => 1 - (teamBudget(this, s, +k).Health - 10) / 40; // the medical staff: yours from Finances, an AI team's from its owner
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id];
      if (p.inj) { p.inj.games--; if (p.inj.games <= 0) { let lost = '';
          // A major injury can also cost skill once he's back (rust, lost feel).
          if (p.inj.major && !p.frozen && Math.random() < .5) { const k2 = pk(['drb', 'fg', 'tp', 'ins', 'pss']), d2 = 1 + Math.floor(Math.random() * 3); p.r[k2] = Math.max(4, p.r[k2] - d2); lost = ' (lost ' + d2 + ' ' + ({ drb: 'dribbling', fg: 'mid-range', tp: 'three-point', ins: 'inside', pss: 'passing' }[k2]) + ')'; (p.injHist[p.injHist.length - 1] || {}).lost = lost; }
          if (this.isUser(s, +k)) out.push({ mine: true, tid: +k, text: p.name + ' returned from ' + p.inj.name.toLowerCase() + lost }); delete p.inj; this.injBack(s, rosters, +k, p); }
        if (!p.inj || !p.inj.dtd || !mins[id]) return; }
      // Injury rates from the NBA's own injury database (Mack et al., Sports Health 2024, seasons
      // 2013-14 to 2018-19): 34.7 injuries per 1,000 player-games, 6.2 game-loss injuries per 10,000
      // player-minutes, and just over a third of injuries costing games. A team: ~30 injuries a
      // season, ~12 that cost games. Risk rises with minutes, age, fatigue, low endurance/strength.
      const risk = .05 * (1 + Math.max(0, p.age - 27) * .05) * (1.45 - p.r.endu / 100) * (1.25 - p.r.stre / 200) * ((mins[id] || 0) / 30) * (p.pers.prone ? 1.8 : 1) * (1 + (p.fat || 0) / 80) * (p.inj ? 1.5 : 1);
      if (Math.random() >= risk) return;
      const x = Math.random(); let inj;
      // ~0.7% career-altering tears (about six a season league-wide), ~7% multi-week injuries,
      // ~28% short absences, and the rest (~64%) day-to-day knocks he plays through.
      if (x < .007) { inj = { name: Math.random() < .5 ? 'Torn ACL' : 'Ruptured Achilles', games: 70 + Math.floor(Math.random() * 60), major: true }; if (!p.frozen) { ['spd', 'acc', 'jmp', 'stre', 'endu'].forEach(r => p.r[r] = Math.max(4, p.r[r] - 3 - Math.floor(Math.random() * 5))); syncOvr(p); } }
      else if (x < .077) inj = { name: pk(['Sprained MCL', 'Stress fracture', 'High ankle sprain', 'Fractured hand', 'Torn meniscus', 'Calf strain', 'Patellar tendinopathy']), games: 8 + Math.floor(Math.random() * 18) };
      else if (x < .36) { inj = { name: pk(['Ankle sprain', 'Hamstring strain', 'Knee soreness', 'Back spasms', 'Groin strain', 'Hip contusion', 'Concussion protocol', 'Sprained wrist']), games: 1 + Math.floor(Math.random() * 8) }; p.minorCount = (p.minorCount || 0) + 1; }
      else inj = { name: pk(['Ankle sprain', 'Sore knee', 'Bruised thigh', 'Jammed finger', 'Back tightness', 'Sore wrist', 'Hip soreness', 'Tweaked hamstring']), games: 1 + Math.floor(Math.random() * 5), dtd: true }; // plays through it, at reduced strength
      inj.games = Math.max(1, Math.round(inj.games * hbOf(k)));
      inj.until = this.injUntil(s, inj.games, day, this.gamesPlayed(s) + 1);
      if (this.isUser(s, +k) && !inj.dtd && !p.preInj) { const c = this.clubOf(s, +k), thr = s.easy?.injuries ? 0 : ((c?.ptInj || { reg: 0 }).reg ?? 0); if (inj.games > thr) this.injAway(rosters, +k, p); }
      p.inj = inj; (p.injHist = p.injHist || []).push({ name: inj.name, games: inj.games, season: this.seasonLbl(), ...(inj.dtd ? { dtd: true } : {}) });
      out.push({ mine: this.isUser(s, +k), major: !!inj.major, tid: +k, pid: id, text: p.name + ' (' + s.teams[k].abbr + '): ' + inj.name.toLowerCase() + (inj.dtd ? ', day-to-day for about ' : ', out ') + inj.games + ' game' + (inj.games === 1 ? '' : 's') + ' (about ' + Math.max(1, inj.until - this.calNow(s)) + ' days)' });
    }));
  }
  static FOCUS: Record<string, string[]> = { Balanced: [], Shooting: ['tp', 'fg', 'ft'], Finishing: ['ins', 'dnk', 'lay'], Playmaking: ['drb', 'pss', 'oiq'], Defense: ['diq', 'blk', 'stl'], Rebounding: ['reb', 'box', 'stre'], Athleticism: ['spd', 'acc', 'jmp', 'stre'], Conditioning: ['endu'] };
  // Expected monthly change per attribute for a player under a training focus (devTick without the dice).
  growthPreview(s, tid, p, focus) {
    const a = p.age, club = this.clubOf(s, tid), coach = coachMult(teamBudget(this, s, tid).Coaching), wk = p.pers?.work ?? 50, annual = this.devRate(p), env = envOf(this, s, p, tid);
    const stunt = a < 24 && (p.minorCount || 0) >= 2 ? Math.max(.4, 1 - .12 * p.minorCount) : 1;
    const monthly = annual / 12 * (annual > 0 ? env.mult * stunt * (0.85 + wk / 333) : coachAging(coach)), keys = Game.FOCUS[focus] || [];
    const tReps = monthly > 0 ? tacticReps(club?.tactics) : null, repF = p.dev ? 0 : (p.min || 0) >= 12 ? 1 : .4;
    const dl = develop(p, monthly * (1 - ovrShare(p.grp, 'hgt')), 1 / 12, { year: this.Y, focus, keys, reps: tReps, repF, role: roleReps(this.seasonTotals(p, this.Y)), work: wk, slow: this.devMult(p, -1), rnd: () => .5, dry: true });
    const out: Record<string, number> = {}; Object.keys(p.r).forEach(r => { if (r !== 'hgt') out[r] = dl[r] || 0; }); // height only changes in a rare growth spurt
    return { monthly, per: out };
  }
  // Tactics a roster can run: some options need players with the right roles.
  tacticUnlocks(ids) { const R = ids.map(id => this.rolesOf(this.db.P[id])); return tacticUnlocks(role => R.filter(r => r.includes(role)).length); }
  // Development: how a player's overall moves is an accumulation of things, not just his age.
  //  - Potential: young players grow toward their ceiling, faster the further below it they are
  //    (on course to reach it around 27); one already at his ceiling barely moves.
  //  - Work ethic: hard workers grow faster and age slower, and keep improving without minutes
  //    (the rookie buried on the bench who lives in the gym).
  //  - Playing time, the CCP, the coaching budget, training focus, the locker room, mentors.
  //  - Traits: legacy-driven and professional players push themselves; volatile ones don't.
  //  - A hidden development factor, fixed for each player: some keep getting better for years,
  //    some peak early and never improve (the great rookie season that turns out to be his best).
  //  - The season he had: a breakout year builds confidence and raises his ceiling a little.
  //  - Luck: every year has some.
  // That decides how much his overall moves; where it lands (which ratings, his body apart from his
  // skills) is his own development profile: development.ts.
  devK(p) { if (p.devK == null) { const h = (x: number) => (((p.id * x + 11) >>> 0) % 1000) / 1000; p.devK = +Math.exp((h(7919) + h(104729) + h(15485863) - 1.5) * 2 * 0.28).toFixed(2); } return p.devK; }
  // This season's development form, rolled on opening night: progress isn't linear. Most years
  // are normal (about 1), some are breakouts (2+), and some go nowhere or backwards (0 or below:
  // a player who can't adapt, loses confidence, or just has a lost year). Hard workers lean up.
  rollDevYear(s = this.state) {
    const P = this.db.P, g3 = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
    // Timing too: growth that comes early (a breakout) is partly given back the next year, and a down
    // year is partly made up (a sophomore slump, then a bounce): bigger swings, same careers on average.
    [...(Object.values(s.rosters).flat() as number[]), ...(s.fa || [])].forEach(id => { const p = P[id]; if (!p) return; const t = 0.5 * g3(); p.dy = +Math.max(-1, Math.min(3, 1 + 0.85 * g3() + t - 0.7 * (p.dyT || 0) + ((p.pers?.work ?? 50) - 50) / 200)).toFixed(2); p.dyT = +t.toFixed(2); p.dyS = this.Y; });
  }
  // Expected yearly change in overall before personality, minutes and luck.
  // His development plan (potential.ts): this age's share of the way from where he came into the league
  // to his full ceiling, at his own hidden pace. Nothing makes up a lost year, and a typical player gets
  // about four fifths of the way; work ethic, the hidden factor, minutes, coaching and luck decide the rest.
  devRate(p, age = p.age) {
    if (age >= 29) return Game.ageDecline(age) + (p.dv0?.n ? planRate(p, age) * paceOf(p) : 0); // a God Mode plan (potential.ts) grows on top of aging
    return planRate(p, age) * paceOf(p);
  }
  // Aging: the decline speeds up every year after 29 (about −0.5 a year at 30, −2 at 33, −3 at
  // 35, −5 at 38, −7 at 40, −11 at 44 for a typical player; work ethic and the hidden factor
  // move it). Athleticism goes first; shooting and feel for the game hold on longer.
  static ageDecline(age) { const t = age - 29; return (-0.4 - 0.25 * t - 0.03 * t * t) / 0.83; }
  // Personality, traits and the hidden factor: speeds growth (rate > 0) or slows decline (rate < 0).
  devMult(p, rate) {
    const w = p.pers?.work ?? 50, k = this.devK(p);
    if (rate > 0) return (0.7 + w / 167) * (p.pers?.legacy ? 1.08 : 1) * (p.pers?.pro ? 1.06 : 1) * (p.pers?.volatile ? .94 : 1) * k;
    return (1.2 - w / 250) * (p.pers?.pro ? .9 : 1) / Math.sqrt(k);
  }
  // How his season went against what his overall predicted (−1 … +1; 0 with under 20 games).
  seasonForm(p, season = this.Y) {
    const r = (p.stats || []).find(x => x.season === season && !x.po); if (!r || r.gp < 20) return 0;
    return this.cl((this.perOf(r, season) - (15 + (p.ovr - 50) * 0.75)) / 8, -1, 1);
  }
  devTick(s, rosters, day) {
    const P = this.db.P, cl = this.cl, reps: Record<number, any[]> = {};
    const FOC = Game.FOCUS;
    const LB = { hgt: 'Hgt', stre: 'Str', spd: 'Spd', acc: 'Acc', jmp: 'Jmp', endu: 'End', ins: 'Ins', dnk: 'Dnk', lay: 'Lay', ft: 'FT', fg: 'Mid', tp: '3PT', oiq: 'OIQ', diq: 'DIQ', blk: 'Blk', stl: 'Stl', drb: 'Drb', pss: 'Pss', reb: 'Reb', box: 'Box' };
    // Assistant coaches re-check the CCP assignments they're in charge of.
    Object.keys(rosters).forEach(k => { const club = this.clubOf(s, +k); if (club?.coachAuto) applyCoachPlans(this, s, club, rosters[k]); });
    const rk = optionRanks(P, rosters), md = this.strategies(s.teams, s, true);
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id], a = p.age, club = this.clubOf(s, +k), mine = !!club;
      evolveTendencies(p, { rank: rk.get(id) ?? null, mode: md[k] }, 0.12, 0.35); // a small monthly step: a new role (a trade, an injury to the star) shows up gradually
      if (p.frozen) return; // God Mode's Freeze attributes: no growth or decline (he still ages, gets hurt, heals and has moods)
      const annual0 = this.devRate(p), annual = annual0 > 0 ? annual0 * (p.dyS === this.Y ? (p.godPot != null ? Math.max(0, p.dy ?? 1) : p.dy ?? 1) : 1) : annual0, wk = p.pers?.work ?? 50; // God Mode's potential (potential.ts): a down year is no growth, not a slide as big as the plan
      const injF = p.inj ? (p.inj.major ? .2 : .7) : 1;
      // Cumulative youth stunting: frequent minor knocks slow a young player's growth and can cost potential.
      const stunt = a < 24 && (p.minorCount || 0) >= 2 ? Math.max(.4, 1 - .12 * p.minorCount) : 1;
      if (a < 24 && (p.minorCount || 0) >= 3 && Math.random() < .2) moveTruePot(p, -1);
      // His environment (environment.ts): coaching, facilities, playing time, the locker room and a
      // mentor, together capped at ±25% and weighted toward fringe players. Good coaching also slows aging.
      const work = this.devMult(p, annual), env = envOf(this, s, p, +k, rosters), cm = coachMult(teamBudget(this, s, +k).Coaching);
      const monthly = annual / 12 * (annual > 0 ? env.mult : coachAging(cm)) * injF * work * (annual > 0 ? stunt : 1) * (0.6 + Math.random() * .8);
      const focus = mine ? ((club.coachAuto || {})[id] ? coachFocus(p).focus : club.train[id] || 'Balanced') : 'Balanced', keys = FOC[focus], rolesB = mine ? this.rolesOf(p) : null, dl = {};
      p.rx = p.rx || {};
      // Practice reps in your system (tactics.ts) steer some growth into the skills it uses, if he has a
      // feel for them (a center with no touch shooting a thousand threes won't become a shooter). The
      // month's change lands his own way (development.ts): his body on its own track, the rest into his
      // skills by his development profile and training focus.
      const tReps = mine && monthly > 0 ? tacticReps(club.tactics) : null, repF = p.dev ? 0 : (p.min || 0) >= 12 ? 1 : .4, role = roleReps(this.seasonTotals(p, this.Y));
      Object.assign(dl, develop(p, monthly * (1 - ovrShare(p.grp, 'hgt')), 1 / 12, { year: this.Y, focus, keys, reps: tReps, repF, role, work: wk, slow: this.devMult(p, -1), rnd: Math.random })); applyChange(p, dl);
      // A hidden gem's extra ceiling surfaces (intangibles.ts), and his potential is re-read (potential.ts).
      const gemUp = gemTick(p), pot0 = p.pot;
      if (gemUp > 0) moveTruePot(p, gemUp);
      syncOvr(p); refreshPot(p); const wp = p.pot - pot0;
      // Intangibles grow slowly: composure with experience (to about 31), feel a little while young.
      { const it = ensureIntg(p); p.ix = p.ix || { f: 0, p: 0 }; if (a <= 31) p.ix.p += 0.1; if (a <= 27) p.ix.f += 0.03 * (0.7 + wk / 167);
        const wf = Math.trunc(p.ix.f), wq = Math.trunc(p.ix.p); if (wf) { it.feel = cl(it.feel + wf, 1, 99); p.ix.f -= wf; } if (wq) { it.poise = cl(it.poise + wq, 1, 99); p.ix.p -= wq; } }
      syncOvr(p); // the overall is the (new) ratings
      p.feed = [{ m: MONTH_YR.format(this.dateOf(day - 1)), o: +monthly.toFixed(2), dev: !!p.dev, f: focus, r: Object.fromEntries((Object.entries(dl) as [string, number][]).filter(([r]) => r !== 'hgt').sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4).map(([r, v]) => [r, +v.toFixed(2)])) }, ...(p.feed || [])].slice(0, 12);
      if (mine) { const top = (Object.entries(dl) as [string, any][]).filter(([r]) => r !== 'hgt').sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3).map(([r, v]) => LB[r] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(1)).join(' · ');
        const unlocked = this.rolesOf(p).filter(r => !rolesB.includes(r));
        const note = gemUp > 0 && wp > 0 ? 'Outgrowing his scouting report: the staff sees more in him every month (potential ' + p.pot + ')' : unlocked.length ? 'Unlocked: ' + unlocked.join(', ') : stunt < 1 && annual > 0 ? 'Growth stunted by repeated minor injuries (' + p.minorCount + ' this season)' : p.inj ? 'Growth slowed by injury' : monthly < 0 ? 'Age-related decline: athleticism goes first' : (p.tpot ?? p.pot) - p.ovr <= 1 && a <= 26 ? 'Close to his ceiling: not much growth left'
          : (() => { const ew = envWhy(env), ps = planStatus(p), rl = roleLead(role); return env.mult <= 0.92 && ew ? ew : ps === 'behind' ? 'Falling behind his development plan' : rl ? 'His role is making him a ' + ROLE_NOUN[rl] : ew ? ew : ps === 'ahead' ? 'Ahead of schedule' : p.dev ? 'CCP reps are accelerating his growth' : focus !== 'Balanced' ? focus + ' focus is paying off' : 'Steady progress'; })();
        (reps[+k] = reps[+k] || []).push({ id, name: p.name, focus, dev: !!p.dev, d: (monthly >= 0 ? '+' : '') + monthly.toFixed(2), up: monthly >= 0, changes: top, note, ovr: p.ovr }); }
    }));
    const label = this.dateOf(day - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), out: Record<number, any> = {};
    Object.keys(reps).forEach(k => (out[k] = { label, rows: reps[k] }));
    return out;
  }
  // Payroll ceiling each owner archetype tolerates (shown on the Owner screen, used by the AI).
  // The payroll an owner allows: his type's line, any God Mode adjustment, and a new owner's first-year splash.
  teamCeiling(t) { return this.ownerCeiling(t.arch) + (t.ceilAdj || 0) + (t.splash && this.Y <= t.splash.thru ? t.splash.amt : 0); }
  ownerCeiling(arch) { const AP1 = this.db.caps.AP1; return ({ 'Win-Now Spender': this.AP2, 'Frugal Profit-Seeker': this.TAX, 'Asset Hoarder': AP1, 'Hype Focus': AP1, 'Meddling Micromanager': this.TAX } as any)[arch] ?? this.TAX; }
  payrollOf(ids) { return ids.reduce((a, id) => a + this.capHit(this.db.P[id]), 0); }
  // Cap hit: salary (or the 2-year minimum for a one-year veteran minimum deal) plus likely bonuses.
  // In free agency (the new league year) a continuing contract counts at next season's salary.
  capHit(p) { const next = this.state?.phase === 'fa' && p.capOverride == null && p.exp > this.Y && p.signed?.season !== this.Y + 1 && p.raise ? p.amt * (1 + p.raise) : p.amt;
    return (p.capOverride ?? next) + (p.inc || []).filter(x => x.likely).reduce((a, x) => a + x.amt, 0); }

  // One random move by an AI-run team: a signing (through a CBA method, within its owner's
  // budget), a like-for-like trade that passes the league office, or a waiver to open a spot.
  // A month of development for a player without an NBA team (the CCP, abroad): his plan at his pace in
  // his environment, like everyone else (no shortcut to his ceiling).
  devIdle(s, p) {
    if (!p?.r || p.frozen || p.retired || p.gone) return;
    const annual0 = this.devRate(p), annual = annual0 > 0 ? annual0 * (p.dyS === this.Y ? p.dy ?? 1 : 1) : annual0, env = envOf(this, s, p, -1);
    const monthly = annual / 12 * (annual > 0 ? env.mult : 1) * this.devMult(p, annual) * (0.6 + Math.random() * .8);
    applyChange(p, develop(p, monthly * (1 - ovrShare(p.grp, 'hgt')), 1 / 12, { year: this.Y, work: p.pers?.work ?? 50, slow: this.devMult(p, -1), rnd: Math.random }));
    syncOvr(p); refreshPot(p);
  }
  // Carry out an AI-to-AI trade (tradeLogic.ts) and log it with its reason.
  execTrade(st, box, x, day) {
    const P = this.db.P, T = st.teams;
    tradeCap(this, st, box.cap, x.a, x.b, x.aP, x.bP); recordTrade(this, st, x.a, x.b, x.aP, x.bP, x.aK, x.bK);
    box.rosters[x.a] = [...box.rosters[x.a].filter(id => !x.aP.includes(id)), ...x.bP]; box.rosters[x.b] = [...box.rosters[x.b].filter(id => !x.bP.includes(id)), ...x.aP];
    const nm = (ps, ks) => [...ps.map(id => P[id].name), ...ks.map(id => 'a ' + this.pickLabel(box.assets.find(k => k.id === id), T) + ' pick')].join(' and ') || 'nothing';
    const text = T[x.a].region + ' traded ' + nm(x.aP, x.aK) + ' to ' + T[x.b].region + ' for ' + nm(x.bP, x.bK) + ' (' + x.why + ')';
    box.assets = box.assets.map(k => x.aK.includes(k.id) ? { ...k, owner: x.b } : x.bK.includes(k.id) ? { ...k, owner: x.a } : k);
    return { day, type: 'Trade', teams: T[x.a].abbr + ' · ' + T[x.b].abbr, pids: [...x.aP, ...x.bP], got: x.bP[0] ?? null, text }; // got: the main player the first team took in (press story)
  }
  // Every team's picks exist through the trading horizon (God Mode setting; default four drafts ahead).
  ensureAssets(s = this.state) { const H = pickHorizon(s), have = new Set((s.assets || []).map(a => a.id)), add: any[] = [];
    for (let yr = this.Y + 1; yr <= this.Y + H; yr++) s.teams.forEach(t => [1, 2].forEach(rd => { const id = yr + '-' + rd + '-' + t.tid; if (!have.has(id)) add.push({ id, yr, rd, orig: t.tid, owner: t.tid }); }));
    return add.length ? [...(s.assets || []), ...add] : s.assets; }
  aiMove(box, day, s) {
    const P = this.db.P, T = s.teams, ai = T.map(t => t.tid).filter(t => !this.isUser(s, t)), r = Math.random(), tid = () => ai[Math.floor(Math.random() * ai.length)];
    if (!ai.length) return null;
    const st = { ...s, day, rosters: box.rosters, fa: box.fa, cap: box.cap };
    if (r < .4) { const t = tid(); if (stdIds(this, box.rosters[t]).length >= seasonMax(st) || !box.fa.length) return null; const c = box.fa.slice().filter(x => !P[x].rfa).sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 5); const id = c[Math.floor(Math.random() * c.length)]; if (id == null) return null;
      const p = P[id], terms = aiTerms(this, st, t, p); if (!terms || (s.day >= DAY.TEN_DAY_START && p.ovr < 45)) return null;
      if (terms.method !== 'min' && teamSalary(this, st, t) + terms.amt > this.teamCeiling(T[t])) return null;
      if (p.waived?.season === this.Y && p.waived.prevAmt > nums(this).NTMLE && teamSalary(this, st, t) > this.AP1) return null;
      return { day, type: 'Signing', teams: T[t].abbr, pids: [id], text: applySigning(this, st, box, t, p, terms) }; }
    // Trades for a reason (tradeLogic.ts): a contender fills a hole from a seller, a team over the tax
    // pays one with room to take a contract, two teams swap surplus for need. Both sides must come out
    // ahead by their own read, and the league office must approve; no deal, no trade.
    if (r < .85 && box.assets && day < DAY.TRADE_DEADLINE) { const st2 = { ...st, assets: box.assets };
      for (let i = 0; i < 6; i++) { const x = aiTradeIdea(this, st2); if (x) return this.execTrade(st2, box, x, day); }
      return null; }
    // A waiver: the least valuable player (rosterAI: worth to this team, the draft investment included),
    // only for a free agent clearly worth more to the team.
    const t = tid(), std = stdIds(this, box.rosters[t]); if (std.length < seasonMax(st)) return null; const st2 = { ...st, rosters: box.rosters }, cut = pickCut(this, st2, t, box.rosters[t]); if (!cut) return null; const w = cut.p;
    const cand = box.fa.map(id => P[id]).filter(q => q && !q.inj && q.ovr >= w.ovr - 2).sort((a, b) => b.ovr - a.ovr).slice(0, 6), best = Math.max(-Infinity, ...cand.map(q => rosterValue(this, st2, t, q, std.filter(x => x !== w.id).concat(q.id)))); if (best < cut.v + 4) return null;
    const lines = waivePlayer(this, st, box, t, w, 'waive'); return { day, type: 'Release', teams: T[t].abbr, pids: [w.id], text: lines[0] };
  }
  busy = false;
  _rosterRef: any = null;

  // Your teams over the roster limit (God Mode can sign and move players past it).
  rosterOver(s = this.state): { tid: number; std: number; tw: number }[] {
    const lim = rosterMax(s);
    return (s.managed || []).map(t => ({ tid: t, std: stdIds(this, s.rosters[t] || []).length, tw: twoWayIds(this, s.rosters[t] || []).length })).filter(x => x.std > lim || x.tw > TWO_WAY_MAX);
  }
  // No games while one of your teams is over the limit: a notice says who to cut, and false.
  canPlay() {
    const s = this.state, o = inSeasonPhase(s) ? this.rosterOver(s) : []; if (!o.length) return true;
    const lim = rosterMax(s), T = s.teams;
    this.setState(st => ({ notices: addNotice(st, { tone: 'bad', title: 'Over the roster limit', lines: [...o.map(x => T[x.tid].region + ' ' + T[x.tid].name + ': ' + x.std + ' standard contracts (the limit is ' + lim + ')' + (x.tw > TWO_WAY_MAX ? ' and ' + x.tw + ' two-ways (the limit is ' + TWO_WAY_MAX + ')' : '') + '.'), 'Waive or trade players before the next game. God Mode lets you sign past the limit, not play past it.'] }) }));
    return false;
  }
  // God Mode: the league's roster size (the season maximum and the opening-night minimum; the offseason
  // limit stays six above the maximum). AI teams over the new limit waive their least valuable players
  // now, and in season short ones sign minimum deals; your teams get until their next game.
  setRosterLimits(max: number, min: number) {
    this.setState(s => {
      if (!s.god) return null;
      const mx = Math.max(10, Math.min(20, Math.round(max))), lim = { max: mx, min: Math.max(8, Math.min(mx, Math.round(min))) }, s2 = { ...s, rosterLim: lim };
      const box = { rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } }, lgLog = s.lgLog.slice();
      s.teams.forEach(t => { if (this.isUser(s, t.tid)) return; trimRoster(this, s2, box, t.tid, lgLog, rosterMax(s2)); if (s.phase === 'regular') fillRoster(this, s2, box, t.tid, lgLog); });
      return { rosterLim: lim, ...box, lgLog };
    });
  }

  // Play n days. Every game is simulated in full; `forced` is the finished Live Game
  // for the user's game on the first day. Yields between days so the page stays responsive.
  async sim(n, forced?: GameResult) {
    if (this.busy || this.state.phase !== 'regular' || !this.canPlay()) return;
    if (this.state.inbox?.some(x => x.block)) return;
    this.busy = true; this.quiet = n > 1; this.stopReq = false;
    try {
      for (let i = 0; i < n; i++) {
        if (this.stopReq) break; // Stop pressed: finish the day in progress and halt
        const v = this.version;
        this.setState(s => this.simDay(s, i === 0 ? forced : undefined, n - i - 1));
        if (this.version === v) break;
        if (!(this.state.allStars || {})[this.Y] && this.state.day >= allStarDay(this)) runAllStar(this); // All-Star Weekend
        if (i < n - 1) await new Promise(r => setTimeout(r, 0));
      }
    } finally {
      this.busy = false; this.flushEmit();
      if (this.state.simming) this.setState({ simming: null });
    }
  }

  simDay(s, forced: GameResult | undefined, left: number) {
    if (s.phase !== 'regular' || this.gamesPlayed(s) >= 82) return null;
    const day = s.day, games = this.db.days[day % this.db.days.length];
    const rosters = { ...s.rosters };
    s.managed.forEach(t => { if (this.clubOf(s, t)?.keepSorted) rosters[t] = this.autoSorted(rosters[t]); });
    easyLineups(this, s, rosters, day);
    // Streaky shooters' runs drift from game to game: hot and cold stretches that last a few weeks.
    Object.values(rosters).forEach((ids: any) => ids.forEach((id: number) => { const q = this.db.P[id]; if (q?.pers?.streaky) q.hot = +Math.max(-1, Math.min(1, 0.85 * (q.hot || 0) + (Math.random() + Math.random() + Math.random() - 1.5) * 0.56)).toFixed(3); }));
    const fa = s.fa.slice(), lgLog = s.lgLog.slice(), inj = [], box: any = { rosters, fa, overseas: s.overseas || [], cap: { ...(s.cap || {}) }, assets: s.assets };
    const teams = s.teams.map(t => ({ ...t, seq: t.seq.slice() })), gameLog = (s.games || []).slice();
    const rec = (t, win, home) => { if (win) { t.w++; home ? t.hw++ : t.rw++; } else { t.l++; home ? t.hl++ : t.rl++; } t.seq.push(win); };
    let news = s.news || [];
    if (Math.random() < .35) { const e = this.aiMove(box, day, s); if (e) { lgLog.unshift(e); if (e.type === 'Trade' && Math.random() < .6) { const ab = e.teams.split(' · '), tid = s.teams.find(t => t.abbr === ab[0])?.tid; const got = (e as any).got ?? e.pids[1]; if (tid != null && got != null && this.db.P[got]) news = [this.pressTrade(s, tid, this.db.P[got].name, [got]), ...news].slice(0, 80); } } }
    const tstats = { ...(s.tstats || {}) };
    Object.keys(tstats).forEach(k => (tstats[k] = { ...tstats[k] }));
    const cur = { ...s, rosters, tstats }, touched: number[] = [], mins: Record<number, number> = {};
    for (const [h, a] of games) {
      const pick = (s.godWin || {})[this.Y + ':' + day + ':' + h + ':' + a];
      const res = forced && forced.home.tid === h && forced.away.tid === a ? forced : pick != null ? this.playFixed(cur, h, a, pick) : this.playGame(cur, h, a);
      this.addBox(res, false, touched, mins, cur); const bid = this.keepBox(res, day);
      const homeWon = res.home.pts > res.away.pts;
      rec(teams[h], homeWon, true); rec(teams[a], !homeWon, false);
      gameLog.push({ day, h, a, hp: res.home.pts, ap: res.away.pts, ot: res.ot, bid });
    }
    this.refreshAverages(touched);
    touched.forEach(id => { const q = this.db.P[id]; if (q.adjust > 0) { const c = this.clubOf(s, this.tidOf(rosters, id)); q.adjust = Math.max(0, q.adjust - 1 - (mins[id] >= 24 ? 0.5 : 0) - (c && c.budget.Coaching >= 25 ? 0.25 : 0)); } });
    this.fatigueTick(rosters, mins);
    this.injTick(rosters, day, s, inj, mins); this.healIdle(s); // free agents heal on the calendar
    const cbaLog: Record<number, string[]> = {};
    seasonTick(this, s, day, box, lgLog, cbaLog, touched, inj);
    let clubs = { ...(s.clubs || {}) }, patch: any = {};
    // Monthly club upkeep: scouting intel, scouts with a brief picking their own players (scoutBrief.ts), dev reports, mentoring.
    const addClub = (tid, f) => { const pt = this.clubPatch({ ...s, clubs }, tid, f(this.clubOf({ ...s, ...patch, clubs }, tid)), clubs); if (pt.clubs) clubs = pt.clubs; else patch = { ...patch, ...pt }; };
    if (this.dateOf(day).getMonth() !== this.dateOf(day - 1).getMonth()) {
      const reps = this.devTick(s, rosters, day), mnt = mentorTick(this, s, rosters);
      s.managed.forEach(t => addClub(t, c => ({ intel: scoutTick(this, c, s.overseas), ...runBriefs(this, s, c), ...(reps[t] ? { reports: [reps[t], ...(c.reports || [])].slice(0, 6) } : {}), ...(mnt[t] ? { log: [...mnt[t].map(text => ({ date: this.fmtS(day), day, text: 'Mentoring: ' + text })), ...(c.log || [])] } : {}) })));
      Object.entries(mnt).forEach(([t, xs]) => xs.forEach(text => lgLog.unshift({ day, type: 'Team', teams: s.teams[+t].abbr, text })));
      confidenceTick(this, s, rosters);
      placeInGLeague(this, s, box.fa); ccpTopUp(this, s, box.fa); gLeagueTick(this, box.fa, this.gamesPlayed(s));
      if (s.easy?.tactics) s.managed.forEach(t => addClub(t, c => ({ tactics: bestTactics(this, rosters[t], c.tactics) })));
      (s.overseas || []).forEach(id => { const q = this.db.P[id]; if (q?.abroad) { this.devIdle(s, q); q.abroad.pts = +(8 + (q.ovr - 44) * 1.1 + 2).toFixed(1); } }); // players abroad develop on their plan (devIdle)
    }
    // Budget categories on Auto follow the recommendation as the record and revenue move.
    s.managed.forEach(t => { const c = this.clubOf({ ...s, ...patch, clubs }, t), a = c?.budgetAuto; if (a && Object.values(a).some(Boolean)) addClub(t, c1 => ({ budget: applyAutoBudget(this, { ...s, rosters }, t, c1.budget, a) })); });
    // Front office: incentive dilemmas, the owner's favorite on the bench, payroll mandates.
    const ib = inboxTick(this, s, day, rosters), favBench = { ...(s.favBench || {}) }, mandateFails = { ...(s.mandateFails || {}) };
    s.managed.forEach(t => {
      const Tm = s.teams[t], c0 = this.clubOf({ ...s, ...patch, clubs }, t);
      if (Tm.arch === 'Meddling Micromanager' && rosters[t].indexOf(ownerFavorite(this, { ...s, rosters }, t)) >= 5) favBench[t] = (favBench[t] || 0) + 1;
      let inbox = (c0?.inbox || []), changed = false;
      // Payroll orders and fire sales happen only in the offseason (offseasonMandates / openingNightFireSales).
      const open = inbox.find(x => x.kind === 'mandate' && !x.resolved && x.deadline !== 'opening');
      if (open) { inbox = inbox.map(x => x === open ? { ...x, resolved: 'expired', done: true } : x); changed = true; } // an old in-season order lapses
      if (ib[t] || changed) { const add = ib[t] || []; addClub(t, () => ({ inbox: [...add, ...inbox].slice(0, 40) })); }
    });
    s.managed.forEach(t => { const mine = [...inj.filter(x => x.mine && x.tid === t).reverse().map(x => x.text), ...(cbaLog[t] || [])]; if (mine.length) addClub(t, c => ({ log: [...mine.map(text => ({ date: this.fmtS(day), day, text })), ...(c.log || [])] })); });
    inj.filter(x => x.major).forEach(x => lgLog.unshift({ day: day + 1, type: 'Injury', teams: s.teams[x.tid].abbr, text: x.text }));
    ccpPlay(this, { ...s, fa: box.fa, rosters: box.rosters }, dnOf(this.Y, this.dateOf(day))); // today's CCP games
    // AI teams call you with trades that fit their plans (tradeLogic.ts offerToUser); an offer lasts about
    // ten days, and goes away if the players in it move.
    let inOffers = (s.inOffers || []).filter((o: any) => day - o.day <= 10 && day < DAY.TRADE_DEADLINE && o.aP.every((id: number) => box.rosters[o.a]?.includes(id)) && o.bP.every((id: number) => box.rosters[o.b]?.includes(id)));
    let notices = patch.notices ?? s.notices;
    let offerPast: string[] = s.offerPast || []; const okey = (o: any) => o.a + ':' + [...o.aP, ...o.bP].sort().join(','); // an offer you've seen isn't made again
    if (!s.spectator && day < DAY.TRADE_DEADLINE && inOffers.length < 2 && Math.random() < 0.15) {
      const st2 = { ...s, rosters: box.rosters, cap: box.cap, assets: box.assets }; let x: any = null;
      for (let i = 0; i < 4 && !x; i++) { x = offerToUser(this, st2, (gp, gv, gk, gvk) => teamGain(this, st2, s.me, gp, gv, gk, gvk)); if (x && offerPast.includes(okey(x))) x = null; }
      if (x) offerPast = [...offerPast, okey(x)].slice(-80);
      if (x && !inOffers.some((o: any) => o.a === x.a)) { const T = s.teams, nm = (ps, ks) => [...ps.map(id => this.db.P[id].name), ...ks.map(id => this.pickLabel(box.assets.find(k => k.id === id), T) + ' pick')].join(', ') || 'nothing';
        const oid = 'o' + this.Y + '-' + day + '-' + x.a;
        inOffers = [...inOffers, { ...x, id: oid, day }];
        notices = addNotice({ notices }, { tone: 'info', title: 'Trade offer from ' + T[x.a].region + ' ' + T[x.a].name, lines: [x.why, 'They offer ' + nm(x.aP, x.aK) + ' for ' + nm(x.bP, x.bK) + '.', 'Accept, negotiate or decline it from the offer (also under Trade → Offers to you). It stands for about ten days.'], pids: [...x.aP, ...x.bP], offerId: oid }); }
    }
    return { ...patch, clubs, news, tstats, teams, favBench, mandateFails, games: gameLog, day: day + 1, rosters: box.rosters, fa: box.fa, cap: box.cap, assets: box.assets, lgLog, inOffers, offerPast, notices, simming: left > 0 ? { left } : null, tTheirs: s.tTheirs.filter(id => rosters[s.tTid].includes(id)) };
  }

  // Rotation order by rating: healthy players first, two-way players after the standard contracts.
  autoSorted(ids) { const P = this.db.P, ok = id => !P[id].inj || P[id].inj.dtd; return ids.slice().sort((a, b) => (ok(b) ? 1 : 0) - (ok(a) ? 1 : 0) || (P[a].ctype === 'twoWay' ? 1 : 0) - (P[b].ctype === 'twoWay' ? 1 : 0) || P[b].ovr - P[a].ovr); }
  tidOf(rosters, id) { for (const k of Object.keys(rosters)) if (rosters[k].includes(id)) return +k; return -1; }
  // Game-to-game fatigue: heavy minutes build it, a day off (and endurance) clears it.
  fatigueTick(rosters, mins: Record<number, number>) {
    const P = this.db.P;
    Object.values(rosters).flat().forEach((id: any) => { const p = P[id], m = mins[id] || 0;
      p.fat = Math.max(0, Math.min(100, (p.fat || 0) - (8 + p.r.endu / 10) + Math.max(0, m - 20) * 1.1 + (m && p.age > 30 ? (p.age - 30) * 0.3 : 0))); });
  }
  rookieAmt(n) { return +(2.9 + Math.pow((30 - n) / 29, 1.6) * 10.9).toFixed(1); }
  // Draft picks by the AI. Stops at a managed team's pick when untilMine; otherwise auto-picks for them too.
  // AI picks until it's a managed team's turn (untilMine), for everyone, or for `limit` picks.
  aiDraft(untilMine, limit = Infinity) {
    this.setState(s => {
      if (s.phase !== 'draft') return null;
      const picks = s.picks.map(p => ({ ...p })); let pi = s.pi; const taken = new Set(picks.filter(p => p.pid).map(p => p.pid));
      const rosters = { ...s.rosters }, lgLog = s.lgLog.slice(), news = (s.news || []).slice();
      let st = s, clubs = { ...(s.clubs || {}) }, top: any = {};
      const setClub = (t, f) => { const pt = this.clubPatch({ ...st, clubs }, t, f, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; st = { ...s, ...top, clubs }; };
      const promiseOwner = id => s.managed.find(t => (this.clubOf(st, t)?.promises || {})[id]);
      let made = 0;
      while (pi < picks.length && made < limit && !(untilMine && !s.easy?.draft && this.isUser(s, this.owner2027(picks[pi].orig, s.assets, picks[pi].rd)))) {
        const ow = this.owner2027(picks[pi].orig, s.assets, picks[pi].rd), ai = !this.isUser(s, ow);
        const avail0 = this.db.cls[this.Y].filter(id => !taken.has(id));
        const skip = x => promiseOwner(x) != null && Math.random() >= .4 && this.db.rank[x] > 3;
        const avail = ai && avail0.some(x => !skip(x)) ? avail0.filter(x => !skip(x)) : avail0;
        if (!avail.length) { pi = picks.length; break; } // class exhausted: the remaining picks are forfeited
        // An AI team drafts on its own read: the league's read of each prospect plus its own scouts' miss
        // (a frugal owner's thin staff misses more). Your auto-draft uses the board as shown.
        const ranked = ai ? (() => { const val = (x: number) => { const q = this.db.P[x]; return this.potRead(q, ow, s) * 0.7 + q.ovr * 0.3; }; const v = new Map<number, number>(avail.map((x: number) => [x, val(x)] as [number, number])); return avail.slice().sort((a2, b2) => v.get(b2)! - v.get(a2)!); })() : avail;
        const id = ranked[Math.min(ranked.length - 1, Math.floor(Math.random() * Math.random() * 3))];
        picks[pi].pid = id; taken.add(id);
        const p = this.db.P[id], T = s.teams[ow];
        const pt = promiseOwner(id);
        if (pt != null && ai) {
          // Draft-night heist: a rival took a player you promised.
          const c = this.clubOf(st, pt), pr = c.promises[id], loyal = this.heistLoyal(p, pr);
          const pr2 = { ...c.promises }; delete pr2[id];
          const text = loyal ? p.name + ' refused to report to ' + T.abbr + ' and will return to ' + p.from.team + ', honoring his commitment to ' + s.teams[pt].region : p.name + ' signed with ' + T.abbr + ' despite his promise to ' + s.teams[pt].region + '. Agent reputation fell.';
          if (loyal) p.boycott = true;
          setClub(pt, { promises: pr2, agentRep: this.cl(c.agentRep + (loyal ? 3 : -10), 0, 100), log: [{ date: this.fmtS(s.day), day: s.day, text }, ...(c.log || [])] });
        }
        if (!ai) {
          signDraftee(this, s, { rosters, fa: [] }, ow, p, picks[pi], true);
          const c = this.clubOf(st, ow); setClub(ow, { log: [{ date: this.fmtS(s.day), day: s.day, text: 'Auto-drafted ' + p.name + ' at #' + picks[pi].n }, ...(c.log || [])] });
        } else if (picks[pi].n <= 10) news.unshift(this.pressDraft(s, ow, p, picks[pi].n));
        lgLog.unshift({ day: s.day, type: 'Draft', teams: T.abbr, pids: [id], text: '#' + picks[pi].n + ' ' + T.region + ' ' + T.name + ' selected ' + p.name + ' (' + p.pos + ', ' + p.from.team + familyTag(this, p) + ')' });
        pi++; made++;
      }
      return { ...top, clubs, picks, pi, rosters, adv: {}, lgLog, news };
    });
  }
  // Hidden loyalty vs ambition decides whether a promised player boycotts a rival.
  heistLoyal(p, pr) { const loy = p.pers.loyalty ?? (p.pers.mot === 'Loyalty' ? 75 : 45), amb = p.pers.ambition ?? (p.pers.mot === 'Money' || p.pers.mot === 'Fame' ? 75 : 45); return loy + (pr.str - 50) * 0.6 + (p.pers.pro ? 10 : 0) > amb + 5; }
  pressDraft(s, tid, p, n) { const T = s.teams[tid]; return { day: s.day, season: this.Y, kind: 'draft', tid, who: T.gm, role: 'GM & head coach, ' + T.abbr, pids: [p.id], quote: ['We had ' + p.name + ' at the top of our board. That\u2019s a franchise kind of talent.', p.name + ' fits exactly what we want to be. We didn\u2019t hesitate.', 'You don\u2019t pass on a ' + p.pos + ' with his tools at No. ' + n + '.'][n % 3] }; }
  // Press room quotes from the fictional owners and GMs around the league.
  pressTrade(s, tid, got, pids) { const T = s.teams[tid], sp = Math.random() < .5; return { day: s.day, season: this.Y, kind: 'trade', tid, who: sp ? T.gm : T.owner, role: (sp ? 'GM & head coach, ' : 'Owner, ') + T.abbr, pids, quote: sp ? ['We love what ' + got + ' brings. Toughness, and he fits how we play.', 'This makes us better today and gives us flexibility tomorrow.', 'We\u2019ve had our eye on ' + got + ' for a while.'][Math.floor(Math.random() * 3)] : ['I signed off on it. ' + T.gm + ' made a strong case.', 'Our fans deserve a winner. This is a step.', 'I\u2019ll judge it in April.'][Math.floor(Math.random() * 3)] }; }
  pressSign(s, p, amt, inc) { const T = s.teams[s.me], ai = s.teams.filter(t => !this.isUser(s, t.tid)), R = ai[Math.floor(Math.random() * ai.length)] || T; const rival = Math.random() < .35 && amt > 12; return rival ? { day: s.day, season: this.Y, kind: 'sign', tid: R.tid, who: R.gm, role: 'GM & head coach, ' + R.abbr, pids: [p.id], quote: amt.toFixed(0) + ' million for ' + p.name + '? Good for him. We had a number and we stuck to it.' } : { day: s.day, season: this.Y, kind: 'sign', tid: s.me, who: T.owner, role: 'Owner, ' + T.abbr, pids: [p.id], quote: inc.length ? 'Structured the right way: he earns the bonuses by producing.' : p.name + ' wanted to be here. That matters to me.' }; }
  draftPick(id) {
    this.setState(s => {
      const cur = s.phase === 'draft' ? s.picks[s.pi] : null, ow = cur ? this.owner2027(cur.orig, s.assets, cur.rd) : -1; if (!cur || !this.isUser(s, ow)) return null;
      const picks = s.picks.map((p, i) => i === s.pi ? { ...p, pid: id } : p), p = this.db.P[id];
      const rosters = { ...s.rosters }, how = signDraftee(this, s, { rosters, fa: [] }, ow, p, cur, true);
      const c = this.clubOf(s, ow), promises = { ...c.promises }; let rep = c.agentRep; const mineP = Object.keys(promises).find(k => promises[k].n === cur.n); if (mineP) { rep += +mineP === id ? 5 : -15; delete promises[mineP]; }
      if (promises[id]) { rep += 5; delete promises[id]; }
      const T = s.teams[ow];
      return { ...this.clubPatch(s, ow, { promises, agentRep: this.cl(rep, 0, 100), log: [{ date: this.fmtS(s.day), day: s.day, text: 'Drafted ' + p.name + ' at #' + cur.n + (how === 'rookie' ? ' (rookie scale: ' + p.amt.toFixed(2) + 'M, 4 years, team options on years 3 and 4)' : how === 'twoWay' ? ' (two-way contract)' : ' (2-year minimum deal)') }, ...(c.log || [])] }), picks, pi: s.pi + 1, adv: {}, rosters, lgLog: [{ day: s.day, type: 'Draft', teams: T.abbr, pids: [id], text: '#' + cur.n + ' ' + T.region + ' ' + T.name + ' selected ' + p.name + ' (' + p.pos + ', ' + p.from.team + familyTag(this, p) + ')' }, ...s.lgLog] };
    });
  }
  askFor(p, s) {
    const me = s.teams[s.me], conf = s.teams.filter(t => t.conf === me.conf).sort((a, b) => this.pct(b) - this.pct(a)), top = conf.indexOf(me) < 6, m = p.pers.mot;
    let x = p.ask;
    if (m === 'Money') x *= p.age >= 30 ? 1.2 : 1.1;
    if (m === 'Winning') x *= top ? (p.age >= 30 ? .8 : .9) : (p.age >= 30 ? 1.15 : 1);
    if (m === 'Fame') x *= 1 - (me.mkt - 1) * .4;
    const N = nums(this), yos = yosOf(this, p);
    return +Math.max(N.min(yos), Math.min(N.max(yos), x || 0)).toFixed(2); // never above his max
  }
  moodOf(p, idx, s, tid = s.me, noRoom = false) {
    const me = s.teams[tid], wp = this.pct(me), m = p.pers.mot, w = k => m === k ? 2 : 1, P = this.db.P;
    const rank = s.rosters[tid].map(id => P[id]).sort((a, b) => b.ovr - a.ovr).findIndex(x => x.id === p.id);
    const f: any[] = [['Team success', (wp - .5) * 50 * (m === 'Winning' ? 2 : .6)]];
    if (idx >= 5 && rank < 5) f.push(['Coming off the bench', -10 * w('Playing time')]); else if (idx < 5) f.push(['Starting role', 5 * w('Playing time')]); else if (idx >= 10 && p.age >= 24) f.push(['Barely playing', -6 * w('Playing time')]);
    if (p.pers.alpha) f.push(rank === 0 ? ['Leading his own team', 8] : ['Wants to be the No. 1 option', -7]);
    if (p.pers.touches && p.gp >= 5 && p.pts < 12 && p.ovr >= 52) f.push(['Wants the ball more', -6]);
    if (p.pers.team) { f.forEach(x => { if (x[0] === 'Coming off the bench' || x[0] === 'Barely playing') x[1] /= 2; }); if (wp >= .5) f.push(['Team-first', 3]); }
    if (!p.pers.pro && !p.pers.padder && s.rosters[tid].some(id => id !== p.id && P[id].pers?.padder && (P[id].min || 0) >= 15)) f.push(['Selfish teammate', -3]);
    if (p.pers.legacy) { if (wp >= .55 && rank <= 1) f.push(['Chasing a legacy', 5]); else if (wp < .4 && (s.games || []).length > 20) f.push(['Chasing a legacy', -5]); }
    const fair = this.fair(p.ovr); if (!p.rookie && p.amt < fair * .75) f.push(['Feels underpaid', -8 * w('Money')]); else if (p.amt > fair * 1.1) f.push(['Well paid', 4 * w('Money')]);
    if (p.exp === this.Y && !p.ext && p.ovr >= 52) f.push(['No extension offered', -6 * (m === 'Money' || m === 'Loyalty' ? 1.5 : 1)]);
    if (m === 'Fame') f.push(['Market size', (me.mkt - 1) * 40]);
    if (m === 'Loyalty') f.push(['Years with the team', p.yrsWith * 3]);
    { const c = this.clubOf(s, tid), fac = c?.budget?.Facilities; if (fac != null && Math.abs(fac - 14) >= 3) f.push(['Team facilities', Math.round((fac - 14) / 3)]); }
    if (me.mkt >= 1.1 && wp >= .55) f.push(['Fan energy', 2]); else if (wp < .3 && (s.games || []).length > 60) f.push(['Fan energy', -2]);
    if (p.ext) f.push(['Recently extended', 8]);
    if (p.moodAdj) f.push([p.moodAdj < 0 ? 'Incentive dispute with the front office' : 'Front office backed him', p.moodAdj]);
    if (!noRoom) { const rm = lockerRoom(this, s, tid); const v = Math.round((rm.score - 50) / 10); if (v) f.push(['Locker room', v]); }
    const k = p.pers.volatile ? 1.4 : p.pers.pro ? .7 : 1;
    const fs = f.map(([n, v]) => [n, Math.round(v * k)]); if (p.pers.pro) fs.push(['Consummate professional', 5]);
    const out = fs.filter(x => x[1] !== 0); let hap = Math.round(this.cl(55 + out.reduce((a, x) => a + x[1], 0), 0, 100));
    if (p.hapGod != null) { out.push(['Set in God Mode (' + p.hapGod + ')', p.hapGod - hap]); hap = p.hapGod; } // God Mode: happiness fixed at a value
    return { hap, hapLabel: hap >= 80 ? 'Thrilled' : hap >= 62 ? 'Content' : hap >= 45 ? 'Neutral' : hap >= 30 ? 'Frustrated' : 'Wants out', hapColor: hap >= 62 ? 'var(--gm-good)' : hap < 45 ? 'var(--gm-bad)' : 'var(--color-text)', factors: out };
  }
  // Salary in a future season: this season's salary with the contract's annual raises.
  salAt(p, y) { const r = 1 + (p.raise || 0); if (y <= p.exp) return +(p.amt * Math.pow(r, Math.max(0, y - this.Y))).toFixed(2); if (p.ext && y <= p.exp + p.ext.yrs) return +(p.ext.amt * Math.pow(1 + (p.ext.raise ?? p.raise ?? 0), y - p.exp - 1)).toFixed(2); return 0; }
  // God Mode's Force Sign on the signing dialog: past the salary cap (cbaFlow.userSign).
  forceSign() { if (this.state.dialog?.type === 'sign' && this.state.god) userSign(this, true); }
  confirmDialog() {
    const dg0 = this.state.dialog;
    if (dg0?.type === 'sign') return userSign(this);
    if (dg0?.type === 'release') return userRelease(this);
    this.setState(s => {
      const dg = s.dialog; if (!dg) return null; const p = this.db.P[dg.pid];
      if (dg.type === 'abroad') { const CL = clubs(), cc0 = ['ES', 'TR', 'GR', 'IT', 'FR', 'DE', 'CN', 'AU'][Math.floor(Math.random() * 8)], k2 = CL[cc0][Math.floor(Math.random() * CL[cc0].length)]; p.abroad = { club: k2[0], lg: k2[1], country: cc0, pts: 0, reb: 0, ast: 0, clause: 'NBA out clause', fee: .5 }; p.redeem = true; addTx(this, s, p, { k: 'abroad', tid: s.me, text: 'Released to play overseas for ' + k2[0] + ' (' + k2[1] + ')' }); p.overseasArc = { left: this.Y, from: s.teams[s.me].abbr, ovr: p.ovr, club: k2[0], lg: k2[1] }; p.ask = Math.max(2.44, p.amt * .7); return { dialog: null, overseas: [p.id, ...(s.overseas || [])], rosters: { ...s.rosters, [s.me]: s.rosters[s.me].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name + ' to play for ' + k2[0] + ' (' + k2[1] + ')') }; }
      if (dg.type === 'release') { p.ask = Math.max(2.44, p.amt); return { dialog: null, fa: [p.id, ...s.fa], rosters: { ...s.rosters, [s.me]: s.rosters[s.me].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name) }; }
      return { dialog: null };
    });
  }
  // Draft rights: on draft night, a pick that's been used on a player who hasn't signed yet (AI
  // teams' picks sign when free agency opens). Trading the pick trades the player.
  draftRights(k, s = this.state) {
    if (!k || s.phase !== 'draft' || k.yr !== this.Y) return null;
    const pk = s.picks.find(x => x.orig === k.orig && (x.rd || 1) === k.rd && x.pid); if (!pk) return null;
    const onRoster = Object.values(s.rosters).some((ids: any) => ids.includes(pk.pid)); return onRoster ? null : pk;
  }
  pickLabel(k, T) { const r = this.draftRights(k); if (r) { const p = this.db.P[r.pid]; return 'Draft rights: ' + p.name + ' (#' + r.n + ', ' + p.pos + ')'; }
    return k.yr + ' ' + (k.rd === 1 ? '1st' : '2nd') + (k.orig === k.owner ? '' : ' (via ' + T[k.orig].abbr + ')') + (k.prot ? ' · ' + protLabel(k.prot) : ''); }
  // force (God Mode only): the other team accepts and the league office approves no matter what.
  propose(force = false) {
    this.setState(s => {
      force = force && !!s.god;
      const P = this.db.P, T = s.teams, t = T[s.tTid], ev = this.evalTrade(s, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs);
      // What the other GM says, in his own words (a few ways to say it).
      const WANT: Record<string, string[]> = {
        rebuild: ['We’re building through the draft. Bring me picks and young talent and I’ll take on salary to get them.', 'Draft capital and young players are what we need right now. I can absorb a contract if that’s what it takes.', 'We’re rebuilding. Picks and kids move the needle for me; veterans don’t.'],
        middle: ['I want young, high-upside players, and I’m not giving up our picks easily.', 'Show me young guys with a real ceiling. Our picks stay put unless the return is right.', 'We like upside. Give me a young player who can grow and we can talk, but I’m holding on to our picks.'],
        contend: ['We’re trying to win now. I need proven players who can help us tonight.', 'Picks don’t help us this season. Give me someone who can play real minutes for a contender.', 'We’re in win-now mode: bring me a contributor, not a project.'] };
      const say = (st: string) => { const a = WANT[st] || WANT.middle; return a[(s.tTid * 7 + s.day + (s.tTheirs.length + s.tMine.length) * 3) % a.length]; };
      if (!force) { const chk = checkTrade(this, { ...s, god: false }, s.me, s.tTid, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs); if (!chk.ok) return { tMsg: 'League office: ' + chk.errs.join(' ') }; }
      if (!ev.ok && !force && !this.isUser(s, s.tTid)) return { tMsg: t.gm + ', ' + t.abbr + ' GM: \u201c' + (ev.diff < -Math.max(10, ev.give) * 0.4 ? 'We\u2019re not close. ' : 'We\u2019re close, but not there. ') + say(ev.st) + '\u201d' };
      // Picks change hands (with any protection you attached); swap rights are recorded.
      const withProt = a => { const pr = (s.tProt || {})[a.id]; return pr && !a.prot && a.rd === 1 ? { ...a, prot: pr, rolls: 0 } : a; };
      const assets = s.assets.map(a => s.tkMine.includes(a.id) ? withProt({ ...a, owner: s.tTid }) : s.tkTheirs.includes(a.id) ? withProt({ ...a, owner: s.me }) : a);
      const swaps = [...(s.swaps || []), ...s.tkMine.filter(Game.isSwap).map(id => ({ id: id + ':' + s.me + '>' + s.tTid, yr: +id.slice(5), from: s.me, to: s.tTid })), ...s.tkTheirs.filter(Game.isSwap).map(id => ({ id: id + ':' + s.tTid + '>' + s.me, yr: +id.slice(5), from: s.tTid, to: s.me }))];
      const rosters = { ...s.rosters, [s.me]: [...s.rosters[s.me].filter(id => !s.tMine.includes(id)), ...s.tTheirs], [s.tTid]: [...s.rosters[s.tTid].filter(id => !s.tTheirs.includes(id)), ...s.tMine] };
      // Draft rights you receive: he signs his rookie deal with you right away (like your own picks).
      const signed: string[] = [];
      // As in the NBA: the team on the clock made the pick on your behalf and traded you his rights,
      // so his draft record shows them; he signs his rookie deal with you.
      const rightsIn: number[] = [];
      s.tkTheirs.forEach(kid => { const r = this.draftRights(s.assets.find(a => a.id === kid), s); if (!r) return; const p = P[r.pid];
        signDraftee(this, s, { rosters, fa: [] }, s.me, p, r, true); signed.push(p.name); rightsIn.push(p.id);
        p.draftTid = s.tTid; const dt = (p.tx || []).slice().reverse().find((e: any) => e.k === 'draft'); if (dt) dt.tid = s.tTid;
        const pu = (this.db as any).pickUsed?.[kid]; if (pu) pu.tid = s.tTid; });
      const cap = { ...(s.cap || {}) }, capNotes = tradeCap(this, s, cap, s.me, s.tTid, s.tMine, s.tTheirs);
      const tradeId = recordTrade(this, s, s.me, s.tTid, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs);
      rightsIn.forEach(id => addTx(this, s, P[id], { k: 'trade', from: s.tTid, to: s.me, trade: tradeId, text: 'Draft rights traded' }));
      const A = id => this.tradeItemLabel(s, id, T);
      const names = (ps, ks) => { const x = [...ps.map(id => P[id].name), ...ks.map(A)]; return x.length ? x.join(', ') : 'nothing'; };
      return { rosters, assets, swaps, tProt: {}, cap, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: t.gm + ', ' + t.abbr + ' GM: \u201cWe have a deal.\u201d ' + T[s.me].region + ' receives ' + names(s.tTheirs, s.tkTheirs) + '.' + (capNotes.length ? ' ' + capNotes.join(' ') : '') + (signed.length ? ' ' + T[s.tTid].abbr + ' made the pick on your behalf; ' + signed.join(' and ') + (signed.length === 1 ? ' signs his' : ' sign their') + ' rookie deal with you.' : ''), news: [this.pressTrade(s, s.tTid, names(s.tMine, s.tkMine), s.tMine), ...(s.news || [])], lgLog: [{ day: s.day, type: 'Trade', teams: T[s.me].abbr + ' · ' + t.abbr, pids: [...s.tMine, ...s.tTheirs], text: T[s.me].region + ' traded ' + names(s.tMine, s.tkMine) + ' to ' + t.region + ' for ' + names(s.tTheirs, s.tkTheirs) }, ...s.lgLog], log: this.logEntry(s, 'Traded ' + names(s.tMine, s.tkMine) + ' to ' + t.abbr + ' for ' + names(s.tTheirs, s.tkTheirs)) };
    });
  }
  // Draft board shortcuts. Someone else's pick: trade with the team that owns it ("Trade for
  // pick" puts the pick on their side of the table). Your pick: trade with the partner you had
  // up ("Trade pick" puts it on yours). "Propose trade" opens the same screen with nothing selected.
  // A player of yours (his profile's Trade button): the trade screen with him on your side, facing the
  // partner you had up (or the first AI team). Another team's player goes on their side.
  playerToTrade(pid: number) {
    const s0 = this.state; let own = -1; Object.keys(s0.rosters).forEach(k => { if (s0.rosters[k].includes(pid)) own = +k; });
    if (own < 0) return; if (this.isUser(s0, own) && own !== s0.me) this.switchTeam(own);
    this.setState(s => {
      const base = { modal: false, teamModal: null, listModal: null, screen: 'trade', tkMine: [], tkTheirs: [], tMsg: null };
      if (own !== s.me) return { ...base, tTid: own, tMine: [], tTheirs: [pid] };
      const tTid = s.tTid == null || this.isUser(s, s.tTid) ? s.teams.find(t => !this.isUser(s, t.tid))?.tid ?? 0 : s.tTid;
      return { ...base, tTid, tMine: [pid], tTheirs: [] };
    });
  }
  pickToTrade(assetId: string, select: boolean) {
    const a0 = this.state.assets.find(a => a.id === assetId); if (!a0) return;
    if (this.isUser(this.state, a0.owner) && a0.owner !== this.state.me) this.switchTeam(a0.owner);
    this.setState(s => {
      const a = s.assets.find(x => x.id === assetId); if (!a) return null;
      const mine = a.owner === s.me, tTid = mine ? (this.isUser(s, s.tTid) ? s.teams.find(t => !this.isUser(s, t.tid))?.tid ?? s.tTid : s.tTid) : a.owner;
      return { modal: false, teamModal: null, listModal: null, screen: 'trade', tTid, tMine: [], tTheirs: [], tkMine: select && mine ? [assetId] : [], tkTheirs: select && !mine ? [assetId] : [], tMsg: null };
    });
  }
  balance() {
    this.setState(s => {
      const P = this.db.P;
      const cands = [...s.rosters[s.me].filter(id => !s.tMine.includes(id)).map(id => ({ p: id })), ...s.assets.filter(a => a.owner === s.me && !s.tkMine.includes(a.id) && !(a.yr === this.Y && a.rd === 1 && s.picks.find(x => x.orig === a.orig && x.pid))).map(a => ({ k: a.id }))];
      let best = null;
      cands.forEach(c => { const ev = this.evalTrade(s, c.p ? [...s.tMine, c.p] : s.tMine, s.tTheirs, c.k ? [...s.tkMine, c.k] : s.tkMine, s.tTheirs.length ? s.tkTheirs : s.tkTheirs); if (ev.ok && (!best || ev.diff < best.diff)) best = { ...c, diff: ev.diff }; });
      if (!best) return { tMsg: 'No single addition gets this done. Try asking for less.' };
      const what = best.p ? P[best.p].name : this.pickLabel(s.assets.find(a => a.id === best.k), s.teams);
      return { tMine: best.p ? [...s.tMine, best.p] : s.tMine, tkMine: best.k ? [...s.tkMine, best.k] : s.tkMine, tMsg: 'They would do it if you add ' + what + '.' };
    });
  }
  // Roles he fills now, or (proj) the ones he projects into at his ceiling: every skill grows by
  // 60% of the gap between his overall and his potential (a number = the scouts' estimate of it:
  // most players don't hit their full ceiling in every skill); height
  // doesn't grow. A raw 19-year-old only "projects as a shooter" if his shot gets there.
  rolesOf(p, proj?: boolean | number) { const up = proj ? 0.6 * Math.max(0, (typeof proj === 'number' ? proj : p.pot) - p.ovr) * 1.3 : 0, v = k => ['hgt', 'spd', 'acc', 'jmp', 'stre', 'endu'].includes(k) ? p.r[k] : p.r[k] + up; /* projected: his skills grow, his body mostly doesn't */ return roleDefs().filter(r => r[4](v, p)).map(r => r[0]); }
}

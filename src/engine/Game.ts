// The league: world generation, the season engine, and a tiny observable store.
// Rules follow HANDOFF.md and the Claude Design prototype; the UI reads a view
// model built from this state (see ui/viewModel.ts).
import { createElement } from 'react';
import { clubs, COLLEGES, countries, cyr, EXPANSION, MARKETS, namePools, natDefault, nativeMaps, OWNER_ARCHETYPES, OWNER_SURNAMES, RATING_KEYS, regions, roleDefs, TEAMS, teamStyle } from '../data/world';
import { faceSvg, makeFace } from './faces';
import { mulberry32, nextRandom } from './rng';
import { computeAwards, finalsMvp } from './awards';
import { computeNorms } from './norms';
import { baseAfterIncentives, fireSale, inboxTick, ownerFavorite } from './frontOffice';
import { adjustGames, confidenceTick, scoutTick } from './overseas';
import { BASE, blankLine, GameSim, zoneSkill, type FourFactors, type GameResult, type SimTeam } from './sim';

// 2026–27 cap figures ($M). They rise 2% when the league expands, so they live on the save.
export const CAPS0 = { CAP: 165.0, MINP: 148.5, TAX: 201.0, AP1: 209.0, AP2: 221.7, VMIN: 3.87, MLE: 15.0, MAXC: 57.7 };

const POS = [['PG', 'G'], ['SG', 'G'], ['G', 'G'], ['SF', 'W'], ['GF', 'W'], ['F', 'W'], ['PF', 'B'], ['FC', 'B'], ['C', 'B']];
const BIAS = { G: { spd: 8, drb: 10, pss: 10, tp: 8, hgt: -14, ins: -10, reb: -10, stre: -6 }, W: { tp: 5, fg: 4, spd: 3, jmp: 4, diq: 3 }, B: { hgt: 14, ins: 12, reb: 12, stre: 10, dnk: 6, drb: -12, pss: -8, tp: -12, spd: -6 } };
const DIAS = ['BR', 'NG', 'SN', 'CM', 'CD', 'DO', 'GR', 'IT', 'PH', 'ML', 'JP', 'HR', 'RS', 'BS'];

// UI-only keys that should not survive a reload.
const TRANSIENT = { modal: false, dialog: null, teamModal: null, listModal: null, q: '', dragId: null, overId: null, showJson: false, tMsg: null, extMsg: null };

export interface SaveData { db: any; state: any }

export class Game {
  db: any;
  state: any;
  version = 0;
  private listeners = new Set<() => void>();
  private faceCache: Record<number, any> = {};

  // A new league. `tids` are the franchises the user will run (1 to all of them);
  // the first is the one on screen.
  static create(seed = 2027, tids: number | number[] = 0) {
    const g = new Game();
    g.makeDB(seed);
    g.state = g.initState(Array.isArray(tids) ? tids : [tids]);
    g.refreshNorms(g.state);
    return g;
  }

  // Team cards for the start screen, from the same seeded world create() would build.
  static preview(seed = 2027) {
    const g = new Game();
    const d = g.makeDB(seed), P = d.P;
    const top8 = t => { const o = d.rosters[t.tid].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); return o.reduce((a, b) => a + b, 0) / o.length; };
    const out = d.teams.map(t => { const ids = d.rosters[t.tid], star = ids.map(id => P[id]).sort((a, b) => b.ovr - a.ovr)[0];
      return { tid: t.tid, region: t.region, name: t.name, abbr: t.abbr, conf: t.conf, div: t.div, colors: t.colors, icon: t.icon, mkt: t.mkt, arch: t.arch, owner: t.owner, top8: top8(t), payroll: ids.reduce((a, id) => a + P[id].amt, 0), star: { name: star.name, pos: star.pos, ovr: star.ovr, age: star.age } }; });
    const rk = out.slice().sort((a, b) => b.top8 - a.top8).map(t => t.tid);
    out.forEach(t => { const r = rk.indexOf(t.tid) + 1; t.rank = r; t.outlook = r <= 8 ? 'Contender' : r <= 20 ? 'In the mix' : 'Rebuilding'; });
    return out;
  }

  static load(data: SaveData) {
    const g = new Game();
    g.db = { ...data.db, C: countries() };
    g.state = { ...data.state, ...TRANSIENT, simming: null, screen: data.state.screen === 'game' ? 'dash' : data.state.screen };
    if ((g.db.v || 1) < 2) g.migrateV1();
    if (!g.state.tstats) g.state.tstats = {};
    if (!g.state.managed) g.migrateV2();
    if (!g.db.norms || g.db.norms.season !== g.state.season) g.refreshNorms(g.state);
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
      this.version++;
      this.listeners.forEach(l => l());
    }
    if (cb) cb();
  }

  get CAP() { return this.db.caps.CAP; }
  get MINP() { return this.db.caps.MINP; }
  get TAX() { return this.db.caps.TAX; }
  get AP1() { return this.db.caps.AP1; }
  get AP2() { return this.db.caps.AP2; }
  get VMIN() { return this.db.caps.VMIN; }
  get MLE() { return this.db.caps.MLE; }
  get MAXC() { return this.db.caps.MAXC; }

  // World-generation randomness comes from the saved seed stream; game results use Math.random.
  rnd() { return nextRandom(this.db); }
  wpick(o) { const e: [string, any][] = (Object.entries(o) as [string, any][]); let t = e.reduce((a, x) => a + x[1], 0) * this.rnd(); for (const [k, w] of e) { t -= w; if (t <= 0) return k; } return e[0][0]; }

  face(pid) { return this.faceCache[pid] || (this.faceCache[pid] = makeFace(this.db.P[pid])); }
  // Jersey in the team's colors; free agents and prospects wear grey.
  faceEl(pid, tid) { const p = this.db.P[pid]; if (p?.faceImg) return createElement('img', { src: p.faceImg, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }); const t = tid >= 0 && this.state?.teams[tid]; return faceSvg(this.face(pid), t && t.colors ? t.colors : undefined); }
  downloadFaces() {
    const out = (Object.values(this.db.P) as any[]).map((p: any) => ({ id: p.id, name: p.name, heritage: this.db.C[p.her].n, face: this.face(p.id) }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'faces.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  makeDB(seed: number) {
    const db: any = this.db = { v: 2, seed, rs: seed, nid: 1, P: {}, C: countries(), caps: { ...CAPS0 }, firstSeason: 2027, lgRate: {} };
    const rnd = () => this.rnd(), cl = this.cl, pick = a => a[Math.floor(rnd() * a.length)];
    const P = db.P, NP = namePools(), CLUBS = clubs(), W_NBA = natDefault();
    const mk = (base, age, Wt, cls, forceGrp?) => this.mkPlayer(base, age, Wt, cls, forceGrp);
    const teams: any[] = TEAMS.map((t, i) => ({ tid: i, region: t[0], name: t[1], abbr: t[2], conf: t[3], div: t[4], str: i === 0 ? 56 : 45 + rnd() * 12, mkt: MARKETS[i], ...teamStyle(t[2]), seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 }));
    teams.forEach((t, i) => { t.owner = pick(NP.us.f) + ' ' + pick(OWNER_SURNAMES); t.arch = i === 0 ? 'Win-Now Spender' : pick(OWNER_ARCHETYPES); t.gm = pick(NP.us.f) + ' ' + pick(NP.us.l); });
    const rosters = {};
    teams.forEach(t => {
      const young = t.str < 50 ? 3 : 0;
      const slots = ['G', 'G', 'G', 'G', 'G', 'W', 'W', 'W', 'W', 'B', 'B', 'B', 'B', 'B'];
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      const ps = []; for (let k = 0; k < 14; k++) ps.push(mk(t.str + 12 - k * 2.2 + (rnd() - .5) * 6, 20 + Math.floor(rnd() * (14 - young)), W_NBA, 0, slots[k]));
      ps.sort((a, b) => b.ovr - a.ovr);
      rosters[t.tid] = ps.map(p => p.id);
    });
    const fa = []; for (let k = 0; k < 18; k++) fa.push(mk(k < 3 ? 55 + rnd() * 5 : 38 + rnd() * 15, 23 + Math.floor(rnd() * 12), W_NBA, 0).id);
    const os = []; for (let k = 0; k < 22; k++) { const p = mk(44 + rnd() * 12, 22 + Math.floor(rnd() * 8), W_NBA, 0); const cc0 = CLUBS[p.raised] ? p.raised : pick(['ES', 'FR', 'TR', 'GR', 'IT', 'DE', 'CN', 'AU', 'IL', 'LT']), k2 = pick(CLUBS[cc0]), out = rnd() < .45;
      p.abroad = { club: k2[0], lg: k2[1], country: cc0, pts: +(8 + (p.ovr - 44) * 1.1 + rnd() * 4).toFixed(1), reb: +(2 + p.r.reb / 14 + rnd() * 2).toFixed(1), ast: +(1 + p.r.pss / 18 + rnd() * 2).toFixed(1), clause: out ? 'NBA out clause' : 'Buyout', fee: +(out ? .3 + rnd() * .7 : 1.5 + rnd() * 3.5).toFixed(1) }; os.push(p.id); }
    const cls = { 2027: [], 2028: [], 2029: [] };
    for (let k = 0; k < 40; k++) { const p = mk(34 + rnd() * 14, 19 + Math.floor(rnd() * 3), W_NBA, 2027); p.pot = Math.round(cl(p.ovr + 8 + rnd() * 22, 45, 79)); cls[2027].push(p.id); }
    for (let k = 0; k < 30; k++) { const p = mk(28 + rnd() * 11, 17 + Math.floor(rnd() * 2), W_NBA, 2028); p.pot = Math.round(cl(p.ovr + 16 + rnd() * 26, 45, 82)); cls[2028].push(p.id); }
    for (let k = 0; k < 25; k++) { const p = mk(24 + rnd() * 10, 16 + Math.floor(rnd() * 2), W_NBA, 2029); p.pot = Math.round(cl(p.ovr + 20 + rnd() * 28, 45, 84)); cls[2029].push(p.id); }
    (Object.values(P) as any[]).filter(p => p.cls).forEach(p => { p.exp = p.cls + 3; });
    // Scale contracts so the average payroll sits near $172M, then pull every team
    // between the salary floor and the 2nd apron (real payrolls cluster there).
    const tot = Object.values(rosters).reduce((a: number, ids: any) => a + ids.reduce((x, id) => x + P[id].amt, 0), 0) as number;
    const sf = 172 * teams.length / tot;
    Object.values(P).forEach((p: any) => { p.amt *= sf; });
    // First-round picks still on their rookie deals are paid on the rookie scale, not by rating.
    Object.values(P).forEach((p: any) => { if (p.rookie && p.dr) p.amt = this.rookieAmt(Math.min(30, p.dr.pick)) * CAPS0.CAP / 165; });
    Object.values(rosters).forEach((ids: any) => { const vet = ids.filter(id => !P[id].rookie), fixed = ids.filter(id => P[id].rookie).reduce((x, id) => x + P[id].amt, 0), pay = vet.reduce((x, id) => x + P[id].amt, 0) + fixed, tgt = pay < CAPS0.MINP + 2 ? CAPS0.MINP + 2 + rnd() * 14 : pay > CAPS0.AP2 ? CAPS0.AP2 - 2 - rnd() * 10 : pay; if (tgt !== pay && pay > fixed) vet.forEach(id => (P[id].amt *= (tgt - fixed) / (pay - fixed))); });
    (Object.values(P) as any[]).forEach(p => { p.amt = +cl(p.amt, p.age <= 22 ? 1.35 : 2.44, this.MAXC).toFixed(1); p.ask = +Math.max(2.44, p.amt * (p.mood === 'Eager' ? 0.9 : p.mood === 'Reluctant' ? 1.25 : 1)).toFixed(1); });
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
    return Object.assign(db, { os, teams, rosters, fa, cls, rank, order, assets, days, results, lg, BUD, sf });
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
    const race = wpick(C[her].race);
    const pk = (born === 'US' || born === 'CA') && born !== her && rnd() < .35 ? 'us' : C[her].pool, np = NP[pk];
    const f = pick(np.f), l = pick(np.l);
    const elig = [], add = (c, why) => { if (!elig.find(e => e.c === c)) elig.push({ c, why }); };
    if (born === her) add(born, 'citizen by birth'); else if (C[born].soli) add(born, 'born there');
    if (her !== born) add(her, 'through parents');
    if (raised !== born && raised !== her) add(raised, 'naturalized');
    let rep = elig[0].c;
    if (elig.length > 1) rep = her === 'SS' ? 'SS' : (born === 'US' || born === 'CA') ? (rnd() < .6 ? her : born) : pick(elig).c;
    const NM = nativeMaps(); let native = '', disp = np.lf ? l + ' ' + f : f + ' ' + l;
    if (pk === 'cn') { native = NM.cn[l] + NM.cn[f]; disp = NM.cnT[l] + ' ' + NM.cnT[f]; }
    else if (pk === 'kr') native = NM.kr[l] + NM.kr[f];
    else if (pk === 'jp') native = NM.jp[l] + ' ' + NM.jp[f];
    else if (pk === 'gr' || pk === 'ge' || pk === 'il') native = NM[pk][f] + ' ' + NM[pk][l];
    else if (pk === 'rs' && ['RS', 'ME', 'BA'].includes(her)) native = cyr(f) + ' ' + cyr(l);
    return { her, born, raised, race, name: disp, native, elig, rep, city: pick(C[born].cities) };
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
    const ovr = Math.round(cl(base, 22, 76));
    const pot = Math.round(age < 23 ? ovr + 4 + (23 - age) * 3 * (0.5 + rnd()) : age < 27 ? ovr + rnd() * 5 : ovr);
    const r: any = {}; RATING_KEYS.forEach(k => r[k] = Math.round(cl(ovr + (BIAS[grp][k] || 0) + (rnd() - .5) * 22, 4, 99)));
    const hIn = grp === 'G' ? 73 + Math.floor(rnd() * 5) : grp === 'W' ? 77 + Math.floor(rnd() * 4) : 81 + Math.floor(rnd() * 5);
    const p: any = { id: this.db.nid++, pos, grp, age, ovr, pot: Math.min(pot, 84), r, hgt: Math.floor(hIn / 12) + '′' + (hIn % 12) + '″', wt: Math.round(hIn * 2.9 - 5 + rnd() * 25),
      amt: Math.min(this.MAXC, 2.4 + Math.pow(Math.max(0, ovr - 42) / 28, 2.1) * 52), exp: 2027 + Math.floor(rnd() * 4), draft: Math.min(2026, 2026 - (age - 21)), mood: pick(['Eager', 'Open', 'Open', 'Reluctant']),
      from: this.pipe(b.raised, cls), cls, dr: (() => { if (cls) return null; const x = rnd(); return x < .7 ? { rd: 1, pick: 1 + Math.floor(rnd() * 30) } : x < .92 ? { rd: 2, pick: 1 + Math.floor(rnd() * 30) } : null; })(), nz: [rnd() - .5, rnd() - .5], gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0, stats: [], ...b };
    p.pers = { mot: wpick({ Winning: 3, Money: 3, Fame: 1.5, Loyalty: 1.5, 'Playing time': 2 }), alpha: rnd() < .2, touches: rnd() < .3, pro: rnd() < .35, volatile: rnd() < .15, crowd: rnd() < .15, clutch: rnd() < .1, prone: rnd() < .08, padder: rnd() < .08 };
    p.fat = 0;
    p.yrsWith = cls ? 0 : 1 + Math.floor(rnd() * Math.min(6, Math.max(1, 2026 - p.draft)));
    p.rookie = !cls && !!p.dr && p.dr.rd === 1 && 2026 - p.draft <= 3; if (p.rookie) p.exp = Math.max(2027, p.draft + 4);
    P[p.id] = p; return p;
  }
  rng(seed) { return mulberry32(seed); }
  cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  regionKey(code) { const R0 = regions(); return Object.keys(R0).find(k => R0[k].c.includes(code)) || 'NA'; }
  regFactorK(k, s) { const sc = (s.scouts || []).filter(x => x.assign === k); return sc.length ? Math.min(...sc.map(x => (x.spec === k ? .45 : .75) * (1.2 - x.skill * .08))) : 1.25; }
  regFactor(p, s) { return this.regFactorK(this.regionKey((p.from && p.from.country) || p.raised), s); }
  tacFit(ids, t) {
    const P = this.db.P, top = ids.slice(0, 8).map(id => P[id]); if (!top.length || !t) return 0;
    const av = k => top.reduce((a, p) => a + p.r[k], 0) / top.length; let f = 0;
    if (t.off === 'Perimeter' || t.off === 'Pace and space') f += (av('tp') - 55) / 10 * (t.off === 'Pace and space' ? .8 : .6);
    if (t.off === 'Inside') f += ((av('ins') + av('dnk')) / 2 - 55) / 10 * .6;
    if (t.pace === 'Fast') f += ((av('spd') + av('endu')) / 2 - 55) / 10 * .4; if (t.pace === 'Slow') f += (55 - av('spd')) / 10 * .3;
    if (t.def === 'Aggressive') f += (av('diq') - 55) / 10 * .5; if (t.def === 'Switch') f += (av('spd') - 55) / 10 * .3; if (t.def === 'Drop') f += (av('hgt') - 58) / 10 * .3;
    return this.cl(f, -1.5, 1.5);
  }
  initState(tids: number[] = [0]) {
    const d = this.db, rosters0 = { ...d.rosters }, fa0 = d.fa.slice(), lg0 = [], me = tids[0];
    const base: any = { managed: tids.slice(), me, clubs: {} };
    tids.slice(1).forEach((t, i) => (base.clubs[t] = this.defaultClub(i + 1)));
    for (let k = 0; k < 14; k++) { const e = this.aiMove(rosters0, fa0, -14 + k, base); if (e) lg0.unshift(e); }
    return { ...base, ...this.defaultClub(0), screen: 'dash', pid: d.rosters[me][0], teams: d.teams.map(t => ({ ...t, seq: t.seq.slice() })), rosters: rosters0, fa: fa0, lgLog: lg0, natW: natDefault(), overseas: d.os.slice(), listModal: null, god: false, phase: 'regular', season: 2027, po: null, playin: null, playinRes: [], history: [], expansion: false, expanded: false, lotto: null, lists: [{ id: 'l1', name: 'Watchlist', ids: [] }], newList: '', txFilter: 'All', day: 0, games: [],
      sort: { roster: ['rk', 1], fa: ['ovr', -1], draft: ['rank', 1] }, stand: 'conf', tTid: d.teams.find(t => !tids.includes(t.tid)).tid, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null,
      assets: d.assets.map(a => ({ ...a })), picks: d.order.map((orig, i) => ({ n: i + 1, orig, pid: null })), pi: 0, dClass: 2027, adv: {},
      q: '', dialog: null, showJson: false, tstats: {}, awards: {}, news: [], career: { seasons: [], hires: [] } };
  }
  get Y() { return (this.state && this.state.season) || 2027; }
  seasonLbl() { return (this.Y - 1) + '–' + String(this.Y).slice(2); }
  dateOf(off) { return this.db.midStart && this.Y === 2027 ? new Date(2027, 0, 14 + off) : new Date(this.Y - 1, 9, 21 + off); }
  // Play-in and playoff games are simulated in full; their stats go on the playoff line.
  gameWin(s, a, b, homeA) {
    const r = this.playGame(s, homeA ? a : b, homeA ? b : a);
    this.addBox(r, true);
    return (r.home.pts > r.away.pts ? r.home.tid : r.away.tid) === a;
  }

  // Default minutes per 48 by rotation slot (sums to 240). The user can override per player on Tactics.
  static ROTATION = [34, 33, 32, 30, 28, 24, 20, 17, 14, 6, 2, 0, 0, 0, 0];

  // ── Multi-team control ─────────────────────────────────────────────────────────
  // `managed` are the franchises a human runs; `me` is the one on screen. Per-club settings
  // (CLUB_KEYS) live at the top level of state for `me` and in `clubs[tid]` for the others.
  static CLUB_KEYS = ['tactics', 'situ', 'budget', 'train', 'scouts', 'promises', 'agentRep', 'mleUsed', 'buyoutCash', 'taxHist', 'reports', 'log', 'prog', 'inbox', 'intel', 'scoutFocus'];
  isUser(s, tid) { return (s.managed || [0]).includes(tid); }
  clubOf(s, tid) { return tid === s.me ? s : this.isUser(s, tid) ? s.clubs?.[tid] || null : null; }
  defaultClub(i = 0) {
    const SC = [['Dale Whitcombe', 'NA', 4], ['Inés Morales', 'WEU', 3], ['Goran Vuković', 'BAL', 4], ['Kwame Asante', 'AFR', 2]];
    const NP = namePools(), R = Object.keys(regions()), pick = a => a[Math.floor(Math.random() * a.length)];
    const scouts = i === 0 ? SC.map(([name, spec, skill]) => ({ name, spec, skill, assign: spec })) : R.slice(0, 4).map(k => { const k2 = pick(R); return { name: pick(NP.us.f) + ' ' + pick(NP.us.l), spec: k2, skill: 2 + Math.floor(Math.random() * 3), assign: k2 }; });
    return { tactics: { pace: 'Balanced', off: 'Balanced', def: 'Switch', clutch: 'Motion' }, situ: null, budget: { Coaching: 18, Health: 10, Facilities: 14, Scouting: 4, Tickets: 118 }, train: {}, scouts, promises: {}, agentRep: 50, mleUsed: false, buyoutCash: 0, taxHist: [], reports: [], log: [], prog: null, inbox: [] };
  }
  // A patch that writes club fields for any managed team (top level if it's on screen).
  clubPatch(s, tid, fields, clubs?) {
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
    return (s.games || []).filter(g => g.h === tid || g.a === tid).map(g => { const home = g.h === tid; return { day: g.day, win: home ? g.hp > g.ap : g.ap > g.hp, us: home ? g.hp : g.ap, them: home ? g.ap : g.hp, opp: home ? g.a : g.h, home, po: g.po }; }).reverse();
  }
  gamesPlayed(s) { return Math.max(0, ...s.teams.map(t => t.w + t.l)); }

  // A team as the engine sees it: healthy (or playing-through) players in rotation order,
  // each with roles, traits and condition; the club's tactics if a human runs it.
  simTeam(s, tid): SimTeam {
    const P = this.db.P, T = s.teams[tid], user = this.isUser(s, tid), club = this.clubOf(s, tid);
    let ids = s.rosters[tid].filter(id => (!P[id].inj || P[id].inj.dtd) && !P[id].dev);
    if (!user) ids = ids.slice().sort((a, b) => P[b].ovr - P[a].ovr);
    if (ids.length < 5) ids = [...ids, ...s.rosters[tid].filter(id => !ids.includes(id))].slice(0, 5);
    return { tid, name: T.region + ' ' + T.name, abbr: T.abbr, rec: T.w + '–' + T.l, ff: this.teamFF(s, tid),
      tactics: club ? club.tactics : null, situ: club ? club.situ || null : null,
      players: ids.map((id, i) => { const p = P[id]; return { id, name: p.name, pos: p.pos, grp: p.grp, ovr: p.ovr, r: p.r, roles: this.rolesOf(p), crowd: p.pers.crowd, clutch: p.pers.clutch, padder: p.pers.padder || !!p.padding, conf: p.conf, alpha: p.pers.alpha, touches: p.pers.touches, adj: p.adjust > 0, dtd: !!(p.inj && p.inj.dtd), fat: p.fat || 0, protect: !!p.protect, flag: this.flag(p.rep), target: user && p.rot != null ? p.rot : (p.minMin ? Math.max(p.minMin, Game.ROTATION[i] ?? 0) : Game.ROTATION[i] ?? 0) }; }) };
  }

  playGame(s, home, away): GameResult {
    return new GameSim(this.simTeam(s, home), this.simTeam(s, away), { norms: this.db.norms }).run();
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
  usgOf(t) { const teamPlaysPer48 = 89.3 + 0.44 * 21.6 + BASE.tov; return t.min ? (100 * (t.fga + 0.44 * t.fta + t.tov) * 48) / (t.min * teamPlaysPer48) : 0; }
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
      const seeds: any = {}, playin: any = {};
      ['East', 'West'].forEach(c => {
        const sd = this.seeds(s, c); seeds[c] = sd;
        playin[c] = [{ id: 'A', label: '7 vs 8', a: sd[6], sa: 7, b: sd[7], sb: 8 }, { id: 'B', label: '9 vs 10', a: sd[8], sa: 9, b: sd[9], sb: 10 }, { id: 'C', label: 'For the 8 seed', a: null, sa: null, b: null, sb: null }];
      });
      const aw = computeAwards(this, s), P = this.db.P, T = s.teams, lgLog = s.lgLog.slice(), news = (s.news || []).slice();
      const LB = { mvp: 'Most Valuable Player', dpoy: 'Defensive Player of the Year', roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player' };
      Object.keys(LB).forEach(k => { const w = aw[k][0]; if (!w) return; lgLog.unshift({ day: s.day, type: 'Award', teams: T[w.tid]?.abbr || 'League', pids: [w.pid], text: P[w.pid].name + ' (' + (T[w.tid]?.abbr || 'FA') + ') is the ' + LB[k] + ': ' + w.line });
        if (k === 'mvp' && T[w.tid]) news.unshift({ day: s.day, season: this.Y, kind: 'award', tid: w.tid, who: T[w.tid].owner, role: 'Owner, ' + T[w.tid].abbr, pids: [w.pid], quote: P[w.pid].name + ' carried this franchise all year. Nobody in this league was more valuable, and nobody worked harder.' }); });
      if (aw.coy[0]) lgLog.unshift({ day: s.day, type: 'Award', teams: T[aw.coy[0].tid].abbr, text: aw.coy[0].name + ' (' + T[aw.coy[0].tid].abbr + ') is the Coach of the Year: ' + aw.coy[0].line });
      return { phase: 'playin', seeds, playin, awards: { ...(s.awards || {}), [this.Y]: aw }, screen: 'playoffs', lgLog, news };
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
    this.addBox(res, true);
    if (finals) [res.home, res.away].forEach(sd => Object.entries(sd.box).forEach(([k, b]: any) => { if (b.min <= 0) return; const t = (finals[k] = finals[k] || { gp: 0, min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 }); t.gp++; Object.keys(t).forEach(f => { if (f !== 'gp') t[f] += b[f] || 0; }); }));
    return { res, log: { day: s.day, h: home, a: away, hp: res.home.pts, ap: res.away.pts, ot: res.ot, po: kind } };
  }
  simPlayin(forced?: GameResult) {
    this.setState(s => {
      if (s.phase !== 'playin') return null;
      const pi = JSON.parse(JSON.stringify(s.playin)), todo = this.playinPending(pi);
      if (!todo.length) return null;
      const games = (s.games || []).slice(); let st: any = { ...s }, clubs = { ...(s.clubs || {}) };
      const note = (t, text) => { const pt = this.clubPatch({ ...st, clubs }, t, { log: [{ date: this.fmtS(s.day), day: s.day, text }, ...((this.clubOf({ ...st, clubs }, t) || {}).log || [])] }, clubs); if (pt.clubs) clubs = pt.clubs; else st = { ...st, ...pt }; };
      todo.forEach(({ c, x }) => {
        const { res, log } = this.postGame(s, x.a, x.b, forced, 'playin');
        Object.assign(x, { hp: res.home.pts, ap: res.away.pts, done: true, w: res.home.pts > res.away.pts ? x.a : x.b, l: res.home.pts > res.away.pts ? x.b : x.a });
        games.push(log);
        [x.a, x.b].forEach(t => { if (this.isUser(s, t)) note(t, (x.w === t ? 'Won' : 'Lost') + ' the play-in (' + x.label + ') vs ' + s.teams[x.w === t ? x.l : x.w].abbr + ', ' + Math.max(x.hp, x.ap) + '–' + Math.min(x.hp, x.ap)); });
        if (x.id === 'B' || x.id === 'A') { const [A, B, C] = pi[c]; if (A.done && B.done) Object.assign(C, { a: A.l, sa: A.l === A.a ? 7 : 8, b: B.w, sb: B.w === B.a ? 9 : 10 }); }
      });
      return { ...st, clubs, playin: pi, games, day: s.day + 1 };
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
      return { phase: 'playoffs', po: { rounds, champ: null, finals: {} }, screen: 'playoffs' };
    });
  }
  simPo(mode, forced?: GameResult) {
    this.setState(s => {
      if (s.phase !== 'playoffs' || !s.po || s.po.champ != null) return null;
      const po = { ...s.po, finals: { ...(s.po.finals || {}) }, rounds: s.po.rounds.map(r => r.map(x => ({ ...x, g: (x.g || []).slice() }))) };
      const RN = ['first round', 'conference semifinals', 'conference finals', 'Finals'];
      const W = x => x.wa === 4 ? { t: x.a, sd: x.sa } : { t: x.b, sd: x.sb }, L = x => x.wa === 4 ? x.b : x.a, done = x => x.wa === 4 || x.wb === 4;
      const games = (s.games || []).slice(); let day = s.day, st: any = { ...s }, clubs = { ...(s.clubs || {}) }, used = false;
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
          const { res, log } = this.postGame({ ...s, day }, home, away, f, 'po', ri === 3 ? po.finals : null);
          games.push(log);
          const aWon = (res.home.pts > res.away.pts) === aHome;
          if (aWon) x.wa++; else x.wb++;
          x.g.push({ h: home, hp: res.home.pts, ap: res.away.pts });
          if (done(x)) [x.a, x.b].forEach(t => { if (this.isUser(s, t)) note(t, (W(x).t === t ? 'Won ' : 'Lost ') + (ri === 3 ? 'the Finals' : 'the ' + RN[ri]) + ' vs ' + s.teams[t === x.a ? x.b : x.a].abbr + ', ' + Math.max(x.wa, x.wb) + '–' + Math.min(x.wa, x.wb)); });
        });
        day++;
        if (r.every(done)) advance();
      };
      let g = 0;
      if (mode === 'game') playDay(); else if (mode === 'round') { const n0 = po.rounds.length; while (po.rounds.length === n0 && po.champ == null && g++ < 10) playDay(); } else while (po.champ == null && g++ < 40) playDay();
      const out: any = { ...st, clubs, po, games, day };
      if (po.champ != null) {
        const T = s.teams, fm = finalsMvp(this, po.finals, po.champ, s), aw = { ...((s.awards || {})[this.Y] || {}), fmvp: fm };
        const finOf = tid => { let fin = 'Missed the playoffs'; po.rounds.forEach((r, i) => r.forEach(x => { if (x.a === tid || x.b === tid) fin = W(x).t === tid ? (i === 3 ? 'Won the title' : fin) : 'Lost in the ' + RN[i]; })); if (fin === 'Missed the playoffs' && ['East', 'West'].some(c => s.playin?.[c]?.some(x => x.a === tid || x.b === tid))) fin = 'Lost in the play-in'; return fin; };
        const teams = {}; s.managed.forEach(t => (teams[t] = { rec: T[t].w + '–' + T[t].l, fin: finOf(t) }));
        out.history = [{ season: this.seasonLbl(), year: this.Y, champ: po.champ, runner: po.runner, rec: T[s.me].w + '–' + T[s.me].l, fin: finOf(s.me), teams, fmvp: fm?.pid }, ...s.history];
        out.awards = { ...(s.awards || {}), [this.Y]: aw };
        out.lgLog = [{ day, type: 'Award', teams: T[po.champ].abbr, text: T[po.champ].region + ' ' + T[po.champ].name + ' won the ' + this.seasonLbl() + ' championship' }, ...(fm ? [{ day, type: 'Award', teams: T[po.champ].abbr, pids: [fm.pid], text: this.db.P[fm.pid].name + ' is the Finals MVP: ' + fm.line }] : []), ...s.lgLog];
        out.news = [{ day, season: this.Y, kind: 'title', tid: po.champ, who: T[po.champ].owner, role: 'Owner, ' + T[po.champ].abbr, quote: 'This city deserved this. I promised a champion and ' + T[po.champ].gm + ' and this group delivered one.' }, ...(s.news || [])];
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
      const inPO = new Set(s.po.rounds[0].flatMap(x => [x.a, x.b]));
      const byW = (a, b) => this.pct(s.teams[a]) - this.pct(s.teams[b]);
      const lot = s.teams.map(t => t.tid).filter(t => !inPO.has(t)).sort(byW), rest = [...inPO].sort(byW);
      const ODDS = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5], pool = lot.map((t, i) => ({ t, w: ODDS[i] ?? 5, slot: i + 1 })), top = [];
      for (let k = 0; k < 4 && pool.length; k++) { let r = Math.random() * pool.reduce((a, x) => a + x.w, 0); const i = pool.findIndex(x => (r -= x.w) <= 0); top.push(pool.splice(i < 0 ? 0 : i, 1)[0]); }
      const order = [...top, ...pool.sort((a, b) => a.slot - b.slot)], lotto = order.map((x, i) => ({ n: i + 1, t: x.t, from: x.slot }));
      const picks = [...order.map(x => x.t), ...rest].map((orig, i) => ({ n: i + 1, orig, pid: null }));
      const jump = lotto.filter(x => x.from > x.n);
      return { phase: 'draft', picks, pi: 0, lotto, screen: 'draft', dClass: this.Y, lgLog: [{ day: s.day, type: 'Draft', teams: s.teams[lotto[0].t].abbr, text: s.teams[lotto[0].t].region + ' won the draft lottery' + (lotto[0].from > 1 ? ', jumping from the No. ' + lotto[0].from + ' slot' : '') + (jump.length > 1 ? '. ' + jump.length + ' teams moved up.' : '') }, ...s.lgLog] };
    });
  }
  startFA() {
    this.setState(s => {
      if (s.phase !== 'draft' || s.pi < s.picks.length) return null;
      const P = this.db.P, Y = this.Y, rosters = { ...s.rosters }, fa = s.fa.slice(), ovs = (s.overseas || []).slice(); let lgLog = s.lgLog;
      s.picks.forEach(pk => { const ow = this.owner2027(pk.orig, s.assets); if (!this.isUser(s, ow) && pk.pid && this.db.P[pk.pid].boycott) { const p = this.db.P[pk.pid]; p.abroad = { club: p.from.team, lg: p.from.lg, country: p.from.country || p.raised, pts: 12, reb: 5, ast: 2, clause: 'Buyout', fee: 2.5 }; Object.assign(p, { cls: 0, dr: { rd: 1, pick: pk.n }, draft: Y }); ovs.push(pk.pid); }
      else if (!this.isUser(s, ow) && pk.pid) { const p = P[pk.pid]; Object.assign(p, { amt: this.rookieAmt(pk.n), dr: { rd: 1, pick: pk.n }, draft: Y, rookie: true, exp: Y + 4, yrsWith: 0 }); rosters[ow] = [...rosters[ow], pk.pid]; } });
      Object.keys(rosters).forEach(k => { const t = +k; rosters[t] = rosters[t].filter(id => { const p = P[id];
        if (p.ext) { p.exp += p.ext.yrs; p.amt = p.ext.amt; delete p.ext; return true; }
        if (p.exp > Y) return true;
        if (!this.isUser(s, t) && Math.random() < .55) { p.exp = Y + 1 + Math.floor(Math.random() * 4); p.amt = +this.fair(p.ovr).toFixed(1); p.rookie = false; return true; }
        p.prevAmt = p.amt; p.ask = +Math.max(p.age <= 22 ? 1.35 : 2.44, this.fair(p.ovr) * (p.mood === 'Eager' ? .9 : p.mood === 'Reluctant' ? 1.2 : 1)).toFixed(1); p.exp = Y + 1 + Math.floor(Math.random() * 4); p.birdTid = t; p.rookie = false; fa.push(id); return false; }); });
      let clubs = { ...(s.clubs || {}) };
      s.managed.filter(t => t !== s.me).forEach(t => (clubs = this.clubPatch(s, t, { mleUsed: false }, clubs).clubs));
      return { clubs, overseas: ovs, phase: 'fa', rosters, fa, mleUsed: false, screen: 'fa', lgLog: [{ day: s.day, type: 'Signing', teams: 'League', text: 'Free agency opened with ' + fa.length + ' players available' }, ...lgLog], log: this.logEntry(s, 'Free agency opened. Your expiring players are listed with Bird rights.') };
    });
  }
  advanceFA(days) {
    this.setState(s => {
      if (s.phase !== 'fa') return null;
      const P = this.db.P, T = this.db.teams, rosters = { ...s.rosters }, fa = s.fa.slice(); let lgLog = s.lgLog;
      for (let d = 0; d < days * 8; d++) {
        const need = T.map(t => t.tid).filter(t => !this.isUser(s, t) && rosters[t].length < 15).sort((a, b) => rosters[a].length - rosters[b].length);
        if (!need.length || !fa.length) break;
        const t = need[Math.floor(Math.random() * Math.min(need.length, 6))], c = fa.slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 6), id = c[Math.floor(Math.random() * c.length)];
        fa.splice(fa.indexOf(id), 1); rosters[t] = [...rosters[t], id]; P[id].amt = P[id].ask; if (P[id].birdTid !== t) P[id].yrsWith = 0; P[id].birdTid = null;
        lgLog = [{ day: s.day, type: 'Signing', teams: T[t].abbr, text: T[t].region + ' ' + T[t].name + ' signed ' + P[id].name + ' ($' + P[id].amt.toFixed(1) + 'M through ' + P[id].exp + ')' }, ...lgLog];
      }
      return { rosters, fa, lgLog, day: s.day + days };
    });
  }
  startPreseason() {
    this.setState(s => {
      if (s.phase !== 'fa') return null;
      const P = this.db.P, d = this.db, Y = this.Y + 1, coachOf = k => { const c = this.clubOf(s, +k); return c ? (c.budget.Coaching - 18) / 12 : 0; }, progBy: Record<number, any[]> = {};
      let rosters = { ...s.rosters }, fa = s.fa.slice(), teams = s.teams.map(t => ({ ...t, seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 })), assets = s.assets.filter(a => a.yr > this.Y), log = s.log, lgLog = s.lgLog, prog = [];
      const grow = (p, bonus) => { if (p.age < 24 && (p.minorCount || 0) >= 3) { bonus -= 2; p.pot = Math.max(p.ovr, p.pot - 1 - Math.floor(Math.random() * 3)); } p.minorCount = 0; p.age++; const a = p.age, base = a <= 22 ? 2 + Math.random() * 4 : a <= 25 ? 1 + Math.random() * 3 : a <= 28 ? -1 + Math.random() * 3 : a <= 31 ? -3 + Math.random() * 3 : -5 + Math.random() * 4; const dlt = Math.round(base * .5 + bonus); const from = p.ovr; p.ovr = this.cl(p.ovr + dlt, 25, 85); if (p.pot < p.ovr) p.pot = p.ovr; if (a >= 28) p.pot = Math.max(p.ovr, p.pot - 2); Object.keys(p.r).forEach(k => p.r[k] = Math.round(this.cl(p.r[k] + dlt + (Math.random() - .5) * 4, 4, 99))); return from; };
      Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const from = grow(P[id], coachOf(k)); P[id].yrsWith = (P[id].yrsWith || 0) + 1; if (this.isUser(s, +k)) (progBy[+k] = progBy[+k] || []).push({ id, from, to: P[id].ovr }); }));
      fa.forEach(id => grow(P[id], 0));
      const retire = id => P[id].age >= 35 && (P[id].ovr < 52 || Math.random() < .35);
      fa = fa.filter(id => !retire(id));
      Object.keys(rosters).forEach(k => { if (this.isUser(s, +k)) return; const out = rosters[k].filter(retire); if (out.length) { rosters[k] = rosters[k].filter(id => !out.includes(id)); out.forEach(id => lgLog = [{ day: s.day, type: 'Release', teams: teams[k].abbr, text: P[id].name + ' retired at ' + P[id].age }, ...lgLog]); } });
      const left = d.cls[this.Y].filter(id => !s.picks.some(x => x.pid === id)).slice(0, 10);
      left.forEach(id => { Object.assign(P[id], { cls: 0, dr: null, draft: this.Y, amt: 1.35, ask: 1.35, exp: Y + 1, yrsWith: 0 }); fa.push(id); });
      [Y, Y + 1].forEach(yr => (d.cls[yr] || []).forEach(id => { const p = P[id]; p.age++; if (yr === Y) { if (p.from.lg === 'High school') p.from = { team: ['Kentucky', 'Duke', 'Kansas', 'UCLA', 'Gonzaga', 'Arizona', 'UConn', 'Houston'][id % 8], lg: 'NCAA', country: 'US' }; else if (p.from.lg === 'Junior') p.from = { ...p.from, team: p.from.team.replace(' U18', ''), lg: 'Senior club' }; } }));
      d.cls[Y + 2] = []; for (let k = 0; k < 25 + (teams.length - 30); k++) { const p = this.mkPlayer(24 + Math.random() * 10, 16 + Math.floor(Math.random() * 2), s.natW || natDefault(), Y + 2); p.pot = Math.round(this.cl(p.ovr + 20 + Math.random() * 28, 45, 84)); p.exp = Y + 5; d.cls[Y + 2].push(p.id); }
      d.cls[Y + 2].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      teams.forEach(t => [1, 2].forEach(rd => assets.push({ id: (Y + 2) + '-' + rd + '-' + t.tid, yr: Y + 2, rd, orig: t.tid, owner: t.tid })));
      let expanded = s.expanded;
      if (s.expansion && !s.expanded) {
        const NEW = s.expTeams && s.expTeams.length === 2 ? s.expTeams : EXPANSION.map(n => ({ region: n[0], name: n[1], abbr: n[2], conf: n[3], div: n[4], mkt: n[5], ...teamStyle(n[2]) }));
        NEW.forEach((n, j) => { const tid = teams.length; const t = { tid, ...n, str: 46, owner: namePools().us.f[(tid * 7) % 20] + ' ' + OWNER_SURNAMES[(tid * 3) % OWNER_SURNAMES.length], arch: OWNER_ARCHETYPES[tid % OWNER_ARCHETYPES.length], gm: namePools().us.f[(tid * 5) % 20] + ' ' + namePools().us.l[(tid * 11) % 20], seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 }; teams.push(t); d.teams.push({ ...t }); rosters[tid] = []; [Y, Y + 1, Y + 2].forEach(yr => [1, 2].forEach(rd => assets.push({ id: yr + '-' + rd + '-' + tid, yr, rd, orig: tid, owner: tid }))); });
        const base = teams.length - 2;
        for (let t = 0; t < base; t++) { if (this.isUser(s, t)) continue; const ids = rosters[t].slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(8); if (!ids.length) continue; const id = ids[Math.floor(Math.random() * ids.length)]; rosters[t] = rosters[t].filter(x => x !== id); const nt = base + (t % 2); rosters[nt] = [...rosters[nt], id]; }
        [base, base + 1].forEach(nt => { while (rosters[nt].length < 14 && fa.length) { const id = fa.sort((a, b) => P[b].ovr - P[a].ovr).shift(); P[id].amt = P[id].ask; rosters[nt] = [...rosters[nt], id]; } });
        ['CAP', 'MINP', 'TAX', 'AP1', 'AP2', 'MLE', 'MAXC'].forEach(k => d.caps[k] = +(d.caps[k] * 1.02).toFixed(1));
        for (let k = 0; k < 2; k++) { const p = this.mkPlayer(30 + Math.random() * 10, 18, s.natW || natDefault(), Y + 1); p.pot = Math.round(this.cl(p.ovr + 14 + Math.random() * 24, 45, 80)); d.cls[Y + 1].push(p.id); }
        expanded = true; lgLog = [{ day: s.day, type: 'Signing', teams: NEW.map(n => n.abbr).join(' · '), text: 'The league expanded to 32 teams: ' + NEW.map(n => n.region + ' ' + n.name).join(' and ') + '. Salary cap rises to $' + this.CAP + 'M.' }, ...lgLog];
      }
      Object.keys(rosters).forEach(k => { if (this.isUser(s, +k)) return; while (rosters[k].length < 13 && fa.length) { const id = fa.sort((a, b) => P[b].ovr - P[a].ovr).shift(); P[id].amt = P[id].ask; rosters[k] = [...rosters[k], id]; } while (rosters[k].length > 15) { const w = rosters[k].slice().sort((a, b) => P[a].ovr - P[b].ovr)[0]; rosters[k] = rosters[k].filter(x => x !== w); fa.push(w); } });
      [...Object.values(rosters).flat(), ...fa].forEach((id: any) => Object.assign(P[id], { gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0 }));
      Object.keys(rosters).forEach(k => { if (!this.isUser(s, +k)) { const o = rosters[k].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); teams[k].str = o.reduce((a, b) => a + b, 0) / o.length - 4.3; } });
      d.days = this.buildSchedule(teams.length);
      const order = teams.slice().sort((a, b) => a.str - b.str).map(t => t.tid);
      d.rank = { ...d.rank }; d.cls[Y].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      Object.values(progBy).forEach(x => x.sort((a, b) => (b.to - b.from) - (a.to - a.from)));
      [...Object.values(rosters).flat(), ...fa].forEach((id: any) => { P[id].fat = 0; P[id].last5 = []; P[id].protect = false; P[id].minMin = 0; P[id].padding = false; P[id].moodAdj = Math.round((P[id].moodAdj || 0) / 2); });
      this.refreshNorms({ rosters, season: Y });
      let clubs = { ...(s.clubs || {}) }, top: any = {};
      s.managed.forEach(t => { const c = this.clubOf(s, t), f = { taxHist: [...(c.taxHist || []), this.payrollOf(s.rosters[t]) > this.TAX], prog: progBy[t] || [] };
        const pt = this.clubPatch(s, t, f, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; });
      return { ...top, clubs, tstats: {}, favBench: {}, mandateFails: {}, season: Y, phase: 'preseason', rosters, fa, teams, assets, day: 0, games: [], po: null, playin: null, playinRes: [], lotto: null, picks: order.map((orig, i) => ({ n: i + 1, orig, pid: null })), pi: 0, dClass: Y, adv: {}, expanded, lgLog, screen: 'dash', tTid: s.teams.find(t => !this.isUser(s, t.tid)).tid, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [] };
    });
  }
  // Opening night: every club needs 13 players. Short-handed managed clubs sign the best
  // remaining free agents to minimum deals (logged), as the league would require.
  startSeason() {
    this.setState(s => {
      if (s.phase !== 'preseason' || s.unemployed || !s.managed.every(t => s.rosters[t].length <= 15)) return null;
      const P = this.db.P, rosters = { ...s.rosters }; let fa = s.fa.slice(), clubs = { ...(s.clubs || {}) }, top: any = {};
      s.managed.forEach(t => { const signed: string[] = [];
        while (rosters[t].length < 13 && fa.length) { const id = fa.slice().sort((a, b) => P[b].ovr - P[a].ovr)[0]; fa = fa.filter(x => x !== id); Object.assign(P[id], { amt: this.VMIN, exp: this.Y + 1, yrsWith: 0, inc: [] }); rosters[t] = [...rosters[t], id]; signed.push(P[id].name); }
        if (signed.length) { const c = this.clubOf({ ...s, ...top, clubs }, t), pt = this.clubPatch({ ...s, ...top, clubs }, t, { log: [{ date: this.fmtS(s.day), day: s.day, text: 'League minimum of 13 players: signed ' + signed.join(', ') + ' to minimum deals' }, ...(c.log || [])] }, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; } });
      return { ...top, clubs, rosters, fa, phase: 'regular', prog: null, jobs: null };
    });
  }
  fmtS(off) { return this.dateOf(off).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  logEntry(st, text) { return [{ date: this.fmtS(st.day), day: st.day, text }, ...st.log]; }
  flag(code) { return 'flags/' + this.db.C[code].iso + '.svg'; }
  pct(t) { return t.w + t.l ? t.w / (t.w + t.l) : 0; }
  owner2027(orig, assets) { return assets.find(a => a.yr === this.Y && a.rd === 1 && a.orig === orig).owner; }
  fair(ovr) { return Math.min(this.MAXC, (2.4 + Math.pow(Math.max(0, ovr - 42) / 28, 2.1) * 52) * this.db.sf); }
  strategies(T, s = this.state) {
    const sc = t => this.pct(t) * 0.65 + (t.str - 45) / 12 * 0.35;
    const srt = T.filter(t => !this.isUser(s, t.tid)).sort((a, b) => sc(b) - sc(a)), out = {};
    srt.forEach((t, i) => out[t.tid] = i < 9 ? 'contend' : i >= 20 ? 'rebuild' : 'middle');
    return out;
  }
  slotOf(orig, T) { const srt = T.slice().sort((a, b) => this.pct(a) - this.pct(b)); return srt.findIndex(t => t.tid === orig) + 1; }
  projSlot(k, T) { const s = this.slotOf(k.orig, T); return 15.5 + (s - 15.5) * (k.yr === this.Y ? 1 : k.yr === (this.Y + 1) ? 0.6 : 0.35); }
  pVal(p, st) {
    const base = Math.pow(Math.max(0, p.ovr - 38), 1.9) / 10;
    const gap = Math.max(0, p.pot - p.ovr), youth = p.age <= 22 ? gap * 1.2 : p.age <= 25 ? gap * 0.6 : 0;
    const agePen = p.age >= 31 ? 0.65 : p.age >= 29 ? 0.85 : 1;
    const M = { rebuild: [p.age >= 29 ? 0.55 : 0.9, 1.7, 0.35], middle: [0.9, 1.4, 1.0], contend: [1.35, 0.5, 0.75] }[st];
    let v = base * agePen * M[0] + youth * M[1];
    if (st === 'middle' && p.age <= 24 && p.pot >= 60) v += 8;
    return v - (p.amt - this.fair(p.ovr)) * Math.max(1, p.exp - (this.Y - 1)) * 0.35 * M[2];
  }
  kVal(k, st, giving, T) {
    const slot = this.projSlot(k, T);
    let v = k.rd === 1 ? 4 + 34 * Math.pow((31 - slot) / 30, 1.6) : 2.5;
    v *= k.yr === this.Y ? 1 : k.yr === (this.Y + 1) ? 0.92 : 0.85;
    return v * ({ rebuild: [1.6, 1.6], middle: [1.05, 1.45], contend: [0.7, 0.75] }[st][giving ? 1 : 0]);
  }
  evalTrade(s, mine, theirs, kMine, kTheirs) {
    const P = this.db.P, st = this.strategies(s.teams)[s.tTid], A = id => s.assets.find(a => a.id === id);
    const recv = mine.reduce((a, id) => a + this.pVal(P[id], st), 0) + kMine.reduce((a, id) => a + this.kVal(A(id), st, false, s.teams), 0);
    const give = theirs.reduce((a, id) => a + this.pVal(P[id], st), 0) + kTheirs.reduce((a, id) => a + this.kVal(A(id), st, true, s.teams), 0);
    const thr = Math.max(1, Math.abs(give) * 0.06);
    return { st, recv, give, diff: recv - give - thr, ok: recv - give >= thr };
  }
  injTick(rosters, day, s, out, mins: Record<number, number> = {}) {
    const P = this.db.P, pk = a => a[Math.floor(Math.random() * a.length)];
    const hbOf = k => { const c = this.clubOf(s, +k); return c ? 1 - (c.budget.Health - 10) / 40 : 1; };
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id];
      if (p.inj) { p.inj.games--; if (p.inj.games <= 0) { let lost = '';
          // A major injury can also cost skill once he's back (rust, lost feel).
          if (p.inj.major && Math.random() < .5) { const k2 = pk(['drb', 'fg', 'tp', 'ins', 'pss']), d2 = 1 + Math.floor(Math.random() * 3); p.r[k2] = Math.max(4, p.r[k2] - d2); lost = ' (lost ' + d2 + ' ' + ({ drb: 'dribbling', fg: 'mid-range', tp: 'three-point', ins: 'inside', pss: 'passing' }[k2]) + ')'; (p.injHist[p.injHist.length - 1] || {}).lost = lost; }
          if (this.isUser(s, +k)) out.push({ mine: true, tid: +k, text: p.name + ' returned from ' + p.inj.name.toLowerCase() + lost }); delete p.inj; }
        if (!p.inj || !p.inj.dtd || !mins[id]) return; }
      const risk = .0045 * (1 + Math.max(0, p.age - 27) * .05) * (1.45 - p.r.endu / 100) * (1.25 - p.r.stre / 200) * ((mins[id] || 0) / 30) * (p.pers.prone ? 1.8 : 1) * (1 + (p.fat || 0) / 80) * (p.inj ? 1.5 : 1);
      if (Math.random() >= risk) return;
      const x = Math.random(); let inj;
      if (x < .03) { inj = { name: Math.random() < .5 ? 'Torn ACL' : 'Ruptured Achilles', games: 70 + Math.floor(Math.random() * 60), major: true }; ['spd', 'jmp', 'stre'].forEach(r => p.r[r] = Math.max(4, p.r[r] - 3 - Math.floor(Math.random() * 4))); p.ovr = Math.max(25, p.ovr - 2); }
      else if (x < .15) inj = { name: pk(['Sprained MCL', 'Stress fracture', 'High ankle sprain']), games: 8 + Math.floor(Math.random() * 14) };
      else { inj = { name: pk(['Ankle sprain', 'Hamstring strain', 'Bruised knee', 'Back spasms', 'Sprained finger']), games: 1 + Math.floor(Math.random() * 6) }; p.minorCount = (p.minorCount || 0) + 1;
        // About a third of minor knocks are day-to-day: he plays through them at reduced effectiveness.
        if (Math.random() < .35) inj.dtd = true; }
      if (this.isUser(s, +k)) inj.games = Math.max(1, Math.round(inj.games * hbOf(k)));
      p.inj = inj; (p.injHist = p.injHist || []).push({ name: inj.name, games: inj.games, season: this.seasonLbl() });
      out.push({ mine: this.isUser(s, +k), major: !!inj.major, tid: +k, text: p.name + ' (' + s.teams[k].abbr + '): ' + inj.name.toLowerCase() + (inj.dtd ? ', day-to-day for about ' : ', out about ') + inj.games + ' game' + (inj.games === 1 ? '' : 's') });
    }));
  }
  static FOCUS: Record<string, string[]> = { Balanced: [], Shooting: ['tp', 'fg', 'ft'], Finishing: ['ins', 'dnk'], Playmaking: ['drb', 'pss', 'oiq'], Defense: ['diq', 'spd', 'stre'], Rebounding: ['reb', 'stre'], Athleticism: ['spd', 'jmp', 'stre'], Conditioning: ['endu'] };
  // Expected monthly change per attribute for a player under a training focus (devTick without the dice).
  growthPreview(s, tid, p, focus) {
    const a = p.age, club = this.clubOf(s, tid), coach = club ? 1 + (club.budget.Coaching - 18) / 60 : 1;
    const annual = a <= 22 ? 4 : a <= 25 ? 2.5 : a <= 28 ? .8 : a <= 31 ? -1.2 : -3;
    const minF = p.dev ? 1.4 : a <= 24 ? ((p.min || 0) < 10 ? .55 : (p.min || 0) < 20 ? .85 : 1.1) : 1, stunt = a < 24 && (p.minorCount || 0) >= 2 ? Math.max(.4, 1 - .12 * p.minorCount) : 1;
    const monthly = annual / 12 * coach * minF * (annual > 0 ? stunt * (0.85 + (p.pers.work ?? 50) / 333) : 1), keys = Game.FOCUS[focus] || [], out: Record<string, number> = {};
    Object.keys(p.r).forEach(r => { let w = keys.length ? (keys.includes(r) ? 2.2 : .45) : 1; if (r === 'hgt') w = a <= 20 ? .3 : 0; if (['spd', 'jmp', 'endu'].includes(r) && a >= 29) w *= 1.4; out[r] = monthly * w; });
    return { monthly, per: out };
  }
  // Tactics a roster can run: some options need players with the right roles.
  tacticUnlocks(ids) {
    const R = ids.map(id => this.rolesOf(this.db.P[id])), n = (role) => R.filter(r => r.includes(role)).length;
    return {
      'Pace and space': [n('Floor spacer') + n('Stretch big') >= 3, '3+ floor spacers or stretch bigs'],
      'Isolate the star': [n('Primary creator') >= 1, 'a primary creator'],
      Aggressive: [n('Point-of-attack defender') >= 2, '2+ point-of-attack defenders'],
      Fast: [n('Slasher') + n('Primary creator') >= 2, '2+ slashers or creators'],
      Drop: [n('Rim protector') >= 1, 'a rim protector'],
    } as Record<string, [boolean, string]>;
  }
  devTick(s, rosters, day) {
    const P = this.db.P, cl = this.cl, reps: Record<number, any[]> = {};
    const FOC = Game.FOCUS;
    const LB = { hgt: 'Hgt', stre: 'Str', spd: 'Spd', jmp: 'Jmp', endu: 'End', ins: 'Ins', dnk: 'Dnk', ft: 'FT', fg: 'Mid', tp: '3PT', oiq: 'OIQ', diq: 'DIQ', drb: 'Drb', pss: 'Pss', reb: 'Reb' };
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id], a = p.age, club = this.clubOf(s, +k), mine = !!club, coach = club ? 1 + (club.budget.Coaching - 18) / 60 : 1;
      const annual = a <= 22 ? 4 : a <= 25 ? 2.5 : a <= 28 ? .8 : a <= 31 ? -1.2 : -3;
      const minF = p.dev ? 1.4 : a <= 24 ? (p.min < 10 ? .55 : p.min < 20 ? .85 : 1.1) : 1, injF = p.inj ? (p.inj.major ? .2 : .7) : 1;
      // Cumulative youth stunting: frequent minor knocks slow a young player's growth and can cost potential.
      const stunt = a < 24 && (p.minorCount || 0) >= 2 ? Math.max(.4, 1 - .12 * p.minorCount) : 1;
      if (a < 24 && (p.minorCount || 0) >= 3 && Math.random() < .2) p.pot = Math.max(p.ovr, p.pot - 1);
      const work = annual > 0 ? 0.85 + (p.pers.work ?? 50) / 333 : 1;
      const monthly = annual / 12 * (mine ? coach : 1) * minF * injF * work * (annual > 0 ? stunt : 1) * (0.6 + Math.random() * .8);
      const focus = mine ? (club.train[id] || 'Balanced') : 'Balanced', keys = FOC[focus], rolesB = mine ? this.rolesOf(p) : null, dl = {};
      p.rx = p.rx || {};
      Object.keys(p.r).forEach(r => { let w = keys.length ? (keys.includes(r) ? 2.2 : .45) : 1; if (r === 'hgt') w = a <= 20 ? .3 : 0; if (['spd', 'jmp', 'endu'].includes(r) && a >= 29) w *= 1.4;
        const d = monthly * w; dl[r] = d; p.rx[r] = (p.rx[r] || 0) + d; const whole = Math.trunc(p.rx[r]); if (whole) { p.r[r] = cl(p.r[r] + whole, 4, 99); p.rx[r] -= whole; } });
      p.ox = (p.ox || 0) + monthly; const wo = Math.trunc(p.ox); if (wo) { p.ovr = cl(p.ovr + wo, 25, 85); p.ox -= wo; if (p.pot < p.ovr) p.pot = p.ovr; }
      p.feed = [{ m: this.dateOf(day - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), o: +monthly.toFixed(2), dev: !!p.dev, f: focus, r: Object.fromEntries((Object.entries(dl) as [string, number][]).filter(([r]) => r !== 'hgt').sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4).map(([r, v]) => [r, +v.toFixed(2)])) }, ...(p.feed || [])].slice(0, 12);
      if (mine) { const top = (Object.entries(dl) as [string, any][]).filter(([r]) => r !== 'hgt').sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3).map(([r, v]) => LB[r] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(1)).join(' · ');
        const unlocked = this.rolesOf(p).filter(r => !rolesB.includes(r));
        const note = unlocked.length ? 'Unlocked: ' + unlocked.join(', ') : stunt < 1 && annual > 0 ? 'Growth stunted by repeated minor injuries (' + p.minorCount + ' this season)' : p.dev ? 'Dev league reps are accelerating his growth' : a <= 24 && p.min < 10 ? 'Stalled without minutes; consider the dev league' : p.inj ? 'Growth slowed by injury' : monthly < 0 ? 'Age-related decline' : focus !== 'Balanced' ? focus + ' focus is paying off' : 'Steady progress';
        (reps[+k] = reps[+k] || []).push({ id, name: p.name, focus, dev: !!p.dev, d: (monthly >= 0 ? '+' : '') + monthly.toFixed(2), up: monthly >= 0, changes: top, note, ovr: p.ovr }); }
    }));
    const label = this.dateOf(day - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), out: Record<number, any> = {};
    Object.keys(reps).forEach(k => (out[k] = { label, rows: reps[k] }));
    return out;
  }
  // Payroll ceiling each owner archetype tolerates (shown on the Owner screen, used by the AI).
  ownerCeiling(arch) { return ({ 'Win-Now Spender': this.AP2, 'Frugal Profit-Seeker': this.TAX, 'Asset Hoarder': this.AP1, 'Hype Focus': this.AP1, 'Meddling Micromanager': this.TAX } as any)[arch] ?? this.TAX; }
  payrollOf(ids) { return ids.reduce((a, id) => a + this.capHit(this.db.P[id]), 0); }
  capHit(p) { return p.amt + (p.inc || []).filter(x => x.likely).reduce((a, x) => a + x.amt, 0); }

  // One random move by an AI-run team: a signing within its owner's budget, a like-for-like trade, or a waiver.
  aiMove(R, fa, day, s) {
    const P = this.db.P, T = this.db.teams, ai = T.map(t => t.tid).filter(t => !this.isUser(s, t)), r = Math.random(), tid = () => ai[Math.floor(Math.random() * ai.length)];
    if (!ai.length) return null;
    if (r < .4) { const t = tid(); if (R[t].length >= 15 || !fa.length) return null; const c = fa.slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 5); const id = c[Math.floor(Math.random() * c.length)];
      if (P[id].ask > this.VMIN && this.payrollOf(R[t]) + P[id].ask > this.ownerCeiling(T[t].arch)) return null;
      fa.splice(fa.indexOf(id), 1); R[t] = [...R[t], id]; P[id].amt = P[id].ask; return { day, type: 'Signing', teams: T[t].abbr, pids: [id], text: T[t].region + ' ' + T[t].name + ' signed ' + P[id].name + ' ($' + P[id].ask.toFixed(1) + 'M through ' + P[id].exp + ')' }; }
    if (r < .75) { const a = tid(), b = tid(); if (a === b) return null; const pa = R[a][3 + Math.floor(Math.random() * 9)]; if (!pa) return null; const c = R[b].filter(id => Math.abs(P[id].ovr - P[pa].ovr) <= 3 && Math.abs(P[id].amt - P[pa].amt) <= P[pa].amt * .3 + 2); if (!c.length) return null; const pb = c[Math.floor(Math.random() * c.length)]; R[a] = R[a].map(x => x === pa ? pb : x); R[b] = R[b].map(x => x === pb ? pa : x); return { day, type: 'Trade', teams: T[a].abbr + ' · ' + T[b].abbr, pids: [pa, pb], text: T[a].region + ' traded ' + P[pa].name + ' to ' + T[b].region + ' for ' + P[pb].name }; }
    const t = tid(); if (R[t].length < 14) return null; const id = R[t][R[t].length - 1]; R[t] = R[t].slice(0, -1); fa.push(id); P[id].ask = Math.max(2.44, +(P[id].amt * .8).toFixed(1)); return { day, type: 'Release', teams: T[t].abbr, pids: [id], text: T[t].region + ' ' + T[t].name + ' waived ' + P[id].name };
  }
  private busy = false;

  // Play n days. Every game is simulated in full; `forced` is the finished Live Game
  // for the user's game on the first day. Yields between days so the page stays responsive.
  async sim(n, forced?: GameResult) {
    if (this.busy || this.state.phase !== 'regular') return;
    if (this.state.inbox?.some(x => x.block)) return;
    this.busy = true;
    try {
      for (let i = 0; i < n; i++) {
        const v = this.version;
        this.setState(s => this.simDay(s, i === 0 ? forced : undefined, n - i - 1));
        if (this.version === v) break;
        if (i < n - 1) await new Promise(r => setTimeout(r, 0));
      }
    } finally {
      this.busy = false;
      if (this.state.simming) this.setState({ simming: null });
    }
  }

  simDay(s, forced: GameResult | undefined, left: number) {
    if (s.phase !== 'regular' || this.gamesPlayed(s) >= 82) return null;
    const day = s.day, games = this.db.days[day % this.db.days.length];
    const rosters = { ...s.rosters }, fa = s.fa.slice(), lgLog = s.lgLog.slice(), inj = [];
    const teams = s.teams.map(t => ({ ...t, seq: t.seq.slice() })), gameLog = (s.games || []).slice();
    const rec = (t, win, home) => { if (win) { t.w++; home ? t.hw++ : t.rw++; } else { t.l++; home ? t.hl++ : t.rl++; } t.seq.push(win); };
    let news = s.news || [];
    if (Math.random() < .35) { const e = this.aiMove(rosters, fa, day, s); if (e) { lgLog.unshift(e); if (e.type === 'Trade' && Math.random() < .6) { const ab = e.teams.split(' · '), tid = s.teams.find(t => t.abbr === ab[0])?.tid; if (tid != null) news = [this.pressTrade(s, tid, this.db.P[e.pids[1]].name, [e.pids[1]]), ...news].slice(0, 80); } } }
    const tstats = { ...(s.tstats || {}) };
    Object.keys(tstats).forEach(k => (tstats[k] = { ...tstats[k] }));
    const cur = { ...s, rosters, tstats }, touched: number[] = [], mins: Record<number, number> = {};
    for (const [h, a] of games) {
      const res = forced && forced.home.tid === h && forced.away.tid === a ? forced : this.playGame(cur, h, a);
      this.addBox(res, false, touched, mins, cur);
      const homeWon = res.home.pts > res.away.pts;
      rec(teams[h], homeWon, true); rec(teams[a], !homeWon, false);
      gameLog.push({ day, h, a, hp: res.home.pts, ap: res.away.pts, ot: res.ot });
    }
    this.refreshAverages(touched);
    touched.forEach(id => { const q = this.db.P[id]; if (q.adjust > 0) { const c = this.clubOf(s, this.tidOf(rosters, id)); q.adjust = Math.max(0, q.adjust - 1 - (mins[id] >= 24 ? 0.5 : 0) - (c && c.budget.Coaching >= 25 ? 0.25 : 0)); } });
    this.fatigueTick(rosters, mins);
    this.injTick(rosters, day, s, inj, mins);
    let clubs = { ...(s.clubs || {}) }, patch: any = {};
    const addClub = (tid, f) => { const pt = this.clubPatch({ ...s, clubs }, tid, f(this.clubOf({ ...s, ...patch, clubs }, tid)), clubs); if (pt.clubs) clubs = pt.clubs; else patch = { ...patch, ...pt }; };
    if (this.dateOf(day).getMonth() !== this.dateOf(day - 1).getMonth()) {
      const reps = this.devTick(s, rosters, day);
      s.managed.forEach(t => addClub(t, c => ({ intel: scoutTick(this, c, s.overseas), ...(reps[t] ? { reports: [reps[t], ...(c.reports || [])].slice(0, 6) } : {}) })));
      confidenceTick(this, s, rosters);
      (s.overseas || []).forEach(id => { const q = this.db.P[id]; if (q.age <= 29 && q.abroad) { q.ox = (q.ox || 0) + (q.age <= 25 ? .35 : .2) * (q.redeem ? 1.3 : 1); const w = Math.trunc(q.ox); if (w) { q.ovr = Math.min(q.pot + 2, q.ovr + w); q.ox -= w; Object.keys(q.r).forEach(k => q.r[k] = Math.min(99, q.r[k] + w)); } q.abroad.pts = +(8 + (q.ovr - 44) * 1.1 + 2).toFixed(1); } });
    }
    // Front office: incentive dilemmas, the owner's favorite on the bench, payroll mandates.
    const ib = inboxTick(this, s, day, rosters), favBench = { ...(s.favBench || {}) }, mandateFails = { ...(s.mandateFails || {}) };
    s.managed.forEach(t => {
      const Tm = s.teams[t], c0 = this.clubOf({ ...s, ...patch, clubs }, t);
      if (Tm.arch === 'Meddling Micromanager' && rosters[t].indexOf(ownerFavorite(this, { ...s, rosters }, t)) >= 5) favBench[t] = (favBench[t] || 0) + 1;
      let inbox = (c0?.inbox || []), changed = false;
      const open = inbox.find(x => x.kind === 'mandate' && !x.resolved);
      if (open) {
        const ceil = this.ownerCeiling(Tm.arch) + (Tm.ceilAdj || 0), pay = this.payrollOf(rosters[t]) + (Tm.capAdj || 0);
        if (pay <= ceil) { inbox = inbox.map(x => x === open ? { ...x, resolved: 'met', done: true } : x); changed = true; }
        else if (day >= open.deadline) {
          const sold = fireSale(this, s, t, rosters, lgLog);
          mandateFails[t] = (mandateFails[t] || 0) + 1;
          inbox = [{ id: 'fs' + this.Y + '-' + day + '-' + t, tid: t, day, season: this.Y, kind: 'firesale', done: true, title: Tm.owner + ' ordered a fire sale', text: 'You missed the payroll deadline. Gone: ' + (sold.join(', ') || 'nobody (roster too thin)') + '.', options: [] }, ...inbox.map(x => x === open ? { ...x, resolved: 'failed', done: true } : x)];
          changed = true;
        }
      }
      if (ib[t] || changed) { const add = ib[t] || []; addClub(t, () => ({ inbox: [...add, ...inbox].slice(0, 40) })); }
    });
    s.managed.forEach(t => { const mine = inj.filter(x => x.mine && x.tid === t); if (mine.length) addClub(t, c => ({ log: [...mine.reverse().map(x => ({ date: this.fmtS(day), day, text: x.text })), ...(c.log || [])] })); });
    inj.filter(x => x.major).forEach(x => lgLog.unshift({ day: day + 1, type: 'Injury', teams: s.teams[x.tid].abbr, text: x.text }));
    return { ...patch, clubs, news, tstats, teams, favBench, mandateFails, games: gameLog, day: day + 1, rosters, fa, lgLog, simming: left > 0 ? { left } : null, tTheirs: s.tTheirs.filter(id => rosters[s.tTid].includes(id)) };
  }

  tidOf(rosters, id) { for (const k of Object.keys(rosters)) if (rosters[k].includes(id)) return +k; return -1; }
  // Game-to-game fatigue: heavy minutes build it, a day off (and endurance) clears it.
  fatigueTick(rosters, mins: Record<number, number>) {
    const P = this.db.P;
    Object.values(rosters).flat().forEach((id: any) => { const p = P[id], m = mins[id] || 0;
      p.fat = Math.max(0, Math.min(100, (p.fat || 0) - (8 + p.r.endu / 10) + Math.max(0, m - 20) * 1.1 + (m && p.age > 30 ? (p.age - 30) * 0.3 : 0))); });
  }
  rookieAmt(n) { return +(2.9 + Math.pow((30 - n) / 29, 1.6) * 10.9).toFixed(1); }
  // Draft picks by the AI. Stops at a managed team's pick when untilMine; otherwise auto-picks for them too.
  aiDraft(untilMine) {
    this.setState(s => {
      if (s.phase !== 'draft') return null;
      const picks = s.picks.map(p => ({ ...p })); let pi = s.pi; const taken = new Set(picks.filter(p => p.pid).map(p => p.pid));
      const rosters = { ...s.rosters }, lgLog = s.lgLog.slice(), news = (s.news || []).slice();
      let st = s, clubs = { ...(s.clubs || {}) }, top: any = {};
      const setClub = (t, f) => { const pt = this.clubPatch({ ...st, clubs }, t, f, clubs); if (pt.clubs) clubs = pt.clubs; else top = { ...top, ...pt }; st = { ...s, ...top, clubs }; };
      const promiseOwner = id => s.managed.find(t => (this.clubOf(st, t)?.promises || {})[id]);
      while (pi < picks.length && !(untilMine && this.isUser(s, this.owner2027(picks[pi].orig, s.assets)))) {
        const ow = this.owner2027(picks[pi].orig, s.assets), ai = !this.isUser(s, ow);
        const avail0 = this.db.cls[this.Y].filter(id => !taken.has(id));
        const skip = x => promiseOwner(x) != null && Math.random() >= .4 && this.db.rank[x] > 3;
        const avail = ai && avail0.some(x => !skip(x)) ? avail0.filter(x => !skip(x)) : avail0;
        const id = avail[Math.min(avail.length - 1, Math.floor(Math.random() * Math.random() * 3))];
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
          Object.assign(p, { amt: this.rookieAmt(picks[pi].n), dr: { rd: 1, pick: picks[pi].n }, draft: this.Y, rookie: true, exp: this.Y + 4, yrsWith: 0 });
          rosters[ow] = [...rosters[ow], id];
          const c = this.clubOf(st, ow); setClub(ow, { log: [{ date: this.fmtS(s.day), day: s.day, text: 'Auto-drafted ' + p.name + ' at #' + picks[pi].n }, ...(c.log || [])] });
        } else if (picks[pi].n <= 10) news.unshift(this.pressDraft(s, ow, p, picks[pi].n));
        lgLog.unshift({ day: s.day, type: 'Draft', teams: T.abbr, pids: [id], text: '#' + picks[pi].n + ' ' + T.region + ' ' + T.name + ' selected ' + p.name + ' (' + p.pos + ', ' + p.from.team + ')' });
        pi++;
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
      const cur = s.phase === 'draft' ? s.picks[s.pi] : null, ow = cur ? this.owner2027(cur.orig, s.assets) : -1; if (!cur || !this.isUser(s, ow)) return null;
      const picks = s.picks.map((p, i) => i === s.pi ? { ...p, pid: id } : p), p = this.db.P[id];
      Object.assign(p, { amt: this.rookieAmt(cur.n), dr: { rd: 1, pick: cur.n }, draft: this.Y, rookie: true, exp: this.Y + 4, yrsWith: 0 });
      const c = this.clubOf(s, ow), promises = { ...c.promises }; let rep = c.agentRep; const mineP = Object.keys(promises).find(k => promises[k].n === cur.n); if (mineP) { rep += +mineP === id ? 5 : -15; delete promises[mineP]; }
      if (promises[id]) { rep += 5; delete promises[id]; }
      const T = s.teams[ow];
      return { ...this.clubPatch(s, ow, { promises, agentRep: this.cl(rep, 0, 100), log: [{ date: this.fmtS(s.day), day: s.day, text: 'Drafted ' + p.name + ' at #' + cur.n }, ...(c.log || [])] }), picks, pi: s.pi + 1, adv: {}, rosters: { ...s.rosters, [ow]: [...s.rosters[ow], id] }, lgLog: [{ day: s.day, type: 'Draft', teams: T.abbr, pids: [id], text: '#' + cur.n + ' ' + T.region + ' ' + T.name + ' selected ' + p.name + ' (' + p.pos + ', ' + p.from.team + ')' }, ...s.lgLog] };
    });
  }
  askFor(p, s) {
    const me = s.teams[s.me], conf = s.teams.filter(t => t.conf === me.conf).sort((a, b) => this.pct(b) - this.pct(a)), top = conf.indexOf(me) < 6, m = p.pers.mot;
    let x = p.ask;
    if (m === 'Money') x *= p.age >= 30 ? 1.2 : 1.1;
    if (m === 'Winning') x *= top ? (p.age >= 30 ? .8 : .9) : (p.age >= 30 ? 1.15 : 1);
    if (m === 'Fame') x *= 1 - (me.mkt - 1) * .4;
    return +Math.max(p.age <= 22 ? 1.35 : 2.44, x).toFixed(1);
  }
  moodOf(p, idx, s, tid = s.me) {
    const me = s.teams[tid], wp = this.pct(me), m = p.pers.mot, w = k => m === k ? 2 : 1, P = this.db.P;
    const rank = s.rosters[tid].map(id => P[id]).sort((a, b) => b.ovr - a.ovr).findIndex(x => x.id === p.id);
    const f: any[] = [['Team success', (wp - .5) * 50 * (m === 'Winning' ? 2 : .6)]];
    if (idx >= 5 && rank < 5) f.push(['Coming off the bench', -10 * w('Playing time')]); else if (idx < 5) f.push(['Starting role', 5 * w('Playing time')]); else if (idx >= 10 && p.age >= 24) f.push(['Barely playing', -6 * w('Playing time')]);
    if (p.pers.alpha) f.push(rank === 0 ? ['Leading his own team', 8] : ['Wants to be the No. 1 option', -7]);
    if (p.pers.touches && p.gp >= 5 && p.pts < 12 && p.ovr >= 52) f.push(['Wants the ball more', -6]);
    const fair = this.fair(p.ovr); if (!p.rookie && p.amt < fair * .75) f.push(['Feels underpaid', -8 * w('Money')]); else if (p.amt > fair * 1.1) f.push(['Well paid', 4 * w('Money')]);
    if (p.exp === this.Y && !p.ext && p.ovr >= 52) f.push(['No extension offered', -6 * (m === 'Money' || m === 'Loyalty' ? 1.5 : 1)]);
    if (m === 'Fame') f.push(['Market size', (me.mkt - 1) * 40]);
    if (m === 'Loyalty') f.push(['Years with the team', p.yrsWith * 3]);
    if (p.ext) f.push(['Recently extended', 8]);
    if (p.moodAdj) f.push([p.moodAdj < 0 ? 'Incentive dispute with the front office' : 'Front office backed him', p.moodAdj]);
    const k = p.pers.volatile ? 1.4 : p.pers.pro ? .7 : 1;
    const fs = f.map(([n, v]) => [n, Math.round(v * k)]); if (p.pers.pro) fs.push(['Consummate professional', 5]);
    const out = fs.filter(x => x[1] !== 0), hap = Math.round(this.cl(55 + out.reduce((a, x) => a + x[1], 0), 0, 100));
    return { hap, hapLabel: hap >= 80 ? 'Thrilled' : hap >= 62 ? 'Content' : hap >= 45 ? 'Neutral' : hap >= 30 ? 'Frustrated' : 'Wants out', hapColor: hap >= 62 ? 'var(--gm-good)' : hap < 45 ? 'var(--gm-bad)' : 'var(--color-text)', factors: out };
  }
  salAt(p, y) { return y <= p.exp ? p.amt : p.ext && y <= p.exp + p.ext.yrs ? p.ext.amt : 0; }
  signHow(p, s) {
    const mine = s.rosters[s.me], payroll = this.payrollOf(mine);
    if (s.god) return 'God Mode';
    if (p.abroad && p.abroad.clause === 'Buyout') return null;
    if (mine.length >= 15 && s.phase === 'regular') return null;
    if (p.birdTid === s.me) return 'Bird rights';
    if (mine.length >= 15) return null;
    const ask = this.askFor(p, s);
    if (payroll + ask <= this.CAP) return 'Cap space';
    if (ask <= this.VMIN) return 'Minimum';
    if (!s.mleUsed && ask <= this.MLE && payroll + ask <= this.AP1) return 'Mid-level';
    // Taxpayer mid-level: smaller, and gone entirely above the 2nd apron.
    if (!s.mleUsed && ask <= +(this.MLE * 0.39).toFixed(1) && payroll + ask <= this.AP2) return 'Taxpayer mid-level';
    return null;
  }
  confirmDialog() {
    this.setState(s => {
      const dg = s.dialog; if (!dg) return null; const p = this.db.P[dg.pid];
      if (dg.type === 'sign') { const how = this.signHow(p, s); if (!how) return { dialog: null }; const ask0 = this.askFor(p, s), inc = (dg.inc || []).map(x => ({ ...x })), ask = inc.length ? baseAfterIncentives(ask0, inc) : ask0; p.amt = ask; p.inc = inc; if (how !== 'Bird rights') p.yrsWith = 0; p.birdTid = null; let cash = 0; if (p.abroad) { cash = p.abroad.fee; p.amt = +(p.amt + Math.max(0, p.abroad.fee - .85)).toFixed(1); p.adjust = adjustGames(p); p.overseasArc = { ...(p.overseasArc || {}), back: this.Y, club: p.abroad.club, lg: p.abroad.lg, line: p.abroad.pts + ' pts · ' + p.abroad.reb + ' reb · ' + p.abroad.ast + ' ast', conf: Math.round(p.conf ?? 50) }; delete p.abroad; } return { dialog: null, buyoutCash: (s.buyoutCash || 0) + cash, overseas: (s.overseas || []).filter(x => x !== p.id), mleUsed: s.mleUsed || how === 'Mid-level' || how === 'Taxpayer mid-level', fa: s.fa.filter(x => x !== p.id), rosters: { ...s.rosters, [s.me]: [...s.rosters[s.me], p.id] }, log: this.logEntry(s, 'Signed ' + p.name + ' · $' + ask.toFixed(1) + 'M through ' + p.exp + (inc.length ? ' + $' + inc.reduce((a, x) => a + x.amt, 0).toFixed(1) + 'M in incentives' : '') + ' (' + how.toLowerCase() + ')'), news: [this.pressSign(s, p, ask, inc), ...(s.news || [])] }; }
      if (dg.type === 'abroad') { const CL = clubs(), cc0 = ['ES', 'TR', 'GR', 'IT', 'FR', 'DE', 'CN', 'AU'][Math.floor(Math.random() * 8)], k2 = CL[cc0][Math.floor(Math.random() * CL[cc0].length)]; p.abroad = { club: k2[0], lg: k2[1], country: cc0, pts: 0, reb: 0, ast: 0, clause: 'NBA out clause', fee: .5 }; p.redeem = true; p.overseasArc = { left: this.Y, from: s.teams[s.me].abbr, ovr: p.ovr, club: k2[0], lg: k2[1] }; p.ask = Math.max(2.44, p.amt * .7); return { dialog: null, overseas: [p.id, ...(s.overseas || [])], rosters: { ...s.rosters, [s.me]: s.rosters[s.me].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name + ' to play for ' + k2[0] + ' (' + k2[1] + ')') }; }
      if (dg.type === 'release') { p.ask = Math.max(2.44, p.amt); return { dialog: null, fa: [p.id, ...s.fa], rosters: { ...s.rosters, [s.me]: s.rosters[s.me].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name) }; }
      return { dialog: null };
    });
  }
  pickLabel(k, T) { return k.yr + ' ' + (k.rd === 1 ? '1st' : '2nd') + (k.orig === k.owner ? '' : ' (via ' + T[k.orig].abbr + ')'); }
  propose() {
    this.setState(s => {
      const P = this.db.P, T = s.teams, t = T[s.tTid], ev = this.evalTrade(s, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs);
      const WANT = { rebuild: 'Their priority is draft capital and young talent; they will take on salary to acquire it.', middle: 'They are looking for young, high-upside players and prefer to hold on to their picks.', contend: 'They are looking for proven contributors who can help immediately.' };
      if (!s.god) { const out = s.tMine.reduce((a, id) => a + this.capHit(P[id]), 0), inn = s.tTheirs.reduce((a, id) => a + this.capHit(P[id]), 0), after = this.payrollOf(s.rosters[s.me]) - out + inn;
        if (after > this.AP2 && inn > out) return { tMsg: 'League office: teams above the 2nd apron ($' + this.AP2 + 'M) can’t take back more salary than they send out. This deal would put you at $' + after.toFixed(1) + 'M.' };
        if (after > this.AP1 && s.tMine.length > 1 && inn > out * 1.0) return { tMsg: 'League office: above the 1st apron you can’t aggregate salaries to take back more money. Send out at least $' + inn.toFixed(1) + 'M or trade one-for-one.' }; }
      if (!ev.ok && !s.god && !this.isUser(s, s.tTid)) return { tMsg: t.gm + ', ' + t.abbr + ' GM: \u201c' + (ev.diff < -Math.max(10, ev.give) * 0.4 ? 'We\u2019re not close. ' : 'We\u2019re close, but not there. ') + WANT[ev.st] + '\u201d' };
      const assets = s.assets.map(a => s.tkMine.includes(a.id) ? { ...a, owner: s.tTid } : s.tkTheirs.includes(a.id) ? { ...a, owner: s.me } : a);
      const rosters = { ...s.rosters, [s.me]: [...s.rosters[s.me].filter(id => !s.tMine.includes(id)), ...s.tTheirs], [s.tTid]: [...s.rosters[s.tTid].filter(id => !s.tTheirs.includes(id)), ...s.tMine] };
      const A = id => this.pickLabel(s.assets.find(a => a.id === id), T);
      const names = (ps, ks) => { const x = [...ps.map(id => P[id].name), ...ks.map(A)]; return x.length ? x.join(', ') : 'nothing'; };
      return { rosters, assets, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: t.gm + ', ' + t.abbr + ' GM: \u201cWe have a deal.\u201d ' + T[s.me].region + ' receives ' + names(s.tTheirs, s.tkTheirs) + '.', news: [this.pressTrade(s, s.tTid, names(s.tMine, s.tkMine), s.tMine), ...(s.news || [])], lgLog: [{ day: s.day, type: 'Trade', teams: T[s.me].abbr + ' · ' + t.abbr, pids: [...s.tMine, ...s.tTheirs], text: T[s.me].region + ' traded ' + names(s.tMine, s.tkMine) + ' to ' + t.region + ' for ' + names(s.tTheirs, s.tkTheirs) }, ...s.lgLog], log: this.logEntry(s, 'Traded ' + names(s.tMine, s.tkMine) + ' to ' + t.abbr + ' for ' + names(s.tTheirs, s.tkTheirs)) };
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
  rolesOf(p, rel?) { const v = k => rel ? p.r[k] - p.ovr + 58 : p.r[k]; return roleDefs().filter(r => r[4](v, p)).map(r => r[0]); }
}

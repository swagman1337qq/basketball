// The league: world generation, the season engine, and a tiny observable store.
// Rules follow HANDOFF.md and the Claude Design prototype; the UI reads a view
// model built from this state (see ui/viewModel.ts).
import { clubs, COLLEGES, countries, cyr, MARKETS, namePools, natDefault, nativeMaps, OWNER_ARCHETYPES, OWNER_SURNAMES, RATING_KEYS, regions, roleDefs, TEAMS } from '../data/world';
import { faceSvg, makeFace } from './faces';
import { mulberry32, nextRandom } from './rng';

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

  static create(seed = 2027) {
    const g = new Game();
    g.makeDB(seed);
    g.state = g.initState();
    return g;
  }

  static load(data: SaveData) {
    const g = new Game();
    g.db = { ...data.db, C: countries() };
    g.state = { ...data.state, ...TRANSIENT, screen: data.state.screen === 'game' ? 'dash' : data.state.screen };
    return g;
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
  faceEl(pid, tid) { return faceSvg(this.face(pid), tid); }
  downloadFaces() {
    const out = (Object.values(this.db.P) as any[]).map((p: any) => ({ id: p.id, name: p.name, heritage: this.db.C[p.her].n, face: this.face(p.id) }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'faces.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  makeDB(seed: number) {
    const db: any = this.db = { v: 1, seed, rs: seed, nid: 1, P: {}, C: countries(), caps: { ...CAPS0 } };
    const rnd = () => this.rnd(), cl = this.cl, pick = a => a[Math.floor(rnd() * a.length)];
    const P = db.P, NP = namePools(), CLUBS = clubs(), W_NBA = natDefault();
    const mk = (base, age, Wt, cls, forceGrp?) => this.mkPlayer(base, age, Wt, cls, forceGrp);
    const teams: any[] = TEAMS.map((t, i) => ({ tid: i, region: t[0], name: t[1], abbr: t[2], conf: t[3], div: t[4], str: i === 0 ? 56 : 45 + rnd() * 12, mkt: MARKETS[i] }));
    const MIN = [34, 33, 32, 30, 28, 24, 20, 17, 14, 10, 7, 5, 3, 2];
    teams.forEach((t, i) => { t.owner = pick(NP.us.f) + ' ' + pick(OWNER_SURNAMES); t.arch = i === 0 ? 'Win-Now Spender' : pick(OWNER_ARCHETYPES); t.gm = pick(NP.us.f) + ' ' + pick(NP.us.l); });
    const rosters = {};
    teams.forEach(t => {
      const young = t.str < 50 ? 3 : 0;
      const slots = ['G', 'G', 'G', 'G', 'G', 'W', 'W', 'W', 'W', 'B', 'B', 'B', 'B', 'B'];
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      const ps = []; for (let k = 0; k < 14; k++) ps.push(mk(t.str + 12 - k * 2.2 + (rnd() - .5) * 6, 20 + Math.floor(rnd() * (14 - young)), W_NBA, 0, slots[k]));
      ps.sort((a, b) => b.ovr - a.ovr);
      ps.forEach((p, k) => {
        const m = MIN[k], f = m / 36, n = () => 0.85 + rnd() * 0.3;
        p.gp = 37 - Math.floor(rnd() * (k > 10 ? 25 : 5)); p.min = +(m * n()).toFixed(1);
        p.pts = +this.ppg(p, m).toFixed(1);
        p.reb = +(f * p.r.reb / 7.5 * n()).toFixed(1); p.ast = +(f * p.r.pss / 9 * n()).toFixed(1);
        p.per = +cl(15 + (p.ovr - 50) * 0.75 + (rnd() - .5) * 5, 3, 32).toFixed(1);
      });
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
    const sf = 178.4 / rosters[0].reduce((a, id) => a + P[id].amt, 0);
    (Object.values(P) as any[]).forEach(p => { p.amt = +cl(p.amt * sf, p.age <= 22 ? 1.35 : 2.44, this.MAXC).toFixed(1); p.ask = +Math.max(2.44, p.amt * (p.mood === 'Eager' ? 0.9 : p.mood === 'Reluctant' ? 1.25 : 1)).toFixed(1); });
    const rank = {};
    Object.keys(cls).forEach(y => { cls[y].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)); cls[y].forEach((id, i) => rank[id] = i + 1); });
    teams.forEach(t => {
      const pr = t.tid === 0 ? 0.64 : cl(0.5 + (t.str - 51) * 0.045 + (rnd() - .5) * 0.14, .18, .82);
      let seq;
      do { seq = []; for (let g = 0; g < 37; g++) seq.push(rnd() < pr); } while (t.tid === 0 && seq.filter(Boolean).length !== 24);
      const w = seq.filter(Boolean).length;
      t.seq = seq; t.w = w; t.l = 37 - w;
      t.hw = cl(Math.round(w * 0.56), Math.max(0, w - 18), Math.min(19, w)); t.hl = 19 - t.hw; t.rw = w - t.hw; t.rl = 18 - t.rw;
    });
    const order = teams.slice().sort((a, b) => a.w - b.w || b.l - a.l).map(t => t.tid);
    const assets = [];
    [2027, 2028, 2029].forEach(yr => [1, 2].forEach(rd => teams.forEach(t => assets.push({ id: yr + '-' + rd + '-' + t.tid, yr, rd, orig: t.tid, owner: t.tid }))));
    for (let k = 0; k < 10; k++) { const a = pick(assets.filter(x => x.owner === x.orig && x.orig !== 0)); a.owner = 1 + Math.floor(rnd() * 29); }
    assets.find(a => a.yr === 2028 && a.rd === 2 && a.orig === 1).owner = 0;
    const sched = []; for (let k = 0; k < 60; k++) sched.push({ opp: 1 + Math.floor(rnd() * 29), home: rnd() < 0.5 });
    const results = [];
    teams[0].seq.slice(-5).forEach((win, i) => { const a = 98 + Math.floor(rnd() * 22), b = a - (win ? 1 : -1) * (1 + Math.floor(rnd() * 15)); results.unshift({ day: i - 5, win, us: a, them: b, opp: 1 + Math.floor(rnd() * 29), home: rnd() < .5 }); });
    const BUD = { Coaching: [5, 40, 18, .5], Health: [3, 25, 10, .5], Facilities: [3, 30, 14, .5], Scouting: [1, 12, 4, .25], Tickets: [35, 300, 118, 1] };
    const lg = {}; (Object.entries(BUD) as [string, any][]).forEach(([k, [mn, mx, df]]) => { lg[k] = []; for (let i = 0; i < 29; i++) lg[k].push(+cl(df * (0.55 + rnd() * 0.9), mn, mx).toFixed(1)); });
    return Object.assign(db, { os, teams, rosters, fa, cls, rank, order, assets, sched, results, lg, BUD, sf });
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
      from: this.pipe(b.raised, cls), cls, dr: (() => { if (cls) return null; const x = rnd(); return x < .7 ? { rd: 1, pick: 1 + Math.floor(rnd() * 30) } : x < .92 ? { rd: 2, pick: 1 + Math.floor(rnd() * 30) } : null; })(), nz: [rnd() - .5, rnd() - .5], gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0, ...b };
    p.pers = { mot: wpick({ Winning: 3, Money: 3, Fame: 1.5, Loyalty: 1.5, 'Playing time': 2 }), alpha: rnd() < .2, touches: rnd() < .3, pro: rnd() < .35, volatile: rnd() < .15, crowd: rnd() < .15, clutch: rnd() < .1, prone: rnd() < .08 };
    p.yrsWith = cls ? 0 : 1 + Math.floor(rnd() * Math.min(6, Math.max(1, 2026 - p.draft)));
    p.rookie = !cls && !!p.dr && p.dr.rd === 1 && 2026 - p.draft <= 3; if (p.rookie) p.exp = Math.max(2027, p.draft + 4);
    P[p.id] = p; return p;
  }
  rng(seed) { return mulberry32(seed); }
  cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  ppg(p, min) { const usg = this.cl(.12 + (p.ovr - 40) * .0045 + (p.pers && p.pers.touches ? .02 : 0), .1, .32), ts = this.cl(.5 + ((p.r.tp + p.r.fg + p.r.ins + p.r.dnk + p.r.ft) / 5 - 50) * .003, .46, .66); return 98.8 * (min / 48) * usg * ts * 2 * (.9 + Math.random() * .2); }
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
  initState() {
    const d = this.db, rosters0 = { ...d.rosters }, fa0 = d.fa.slice(), lg0 = [];
    for (let k = 0; k < 14; k++) { const e = this.aiMove(rosters0, fa0, -14 + k); if (e) lg0.unshift(e); }
    return { screen: 'dash', pid: d.rosters[0][0], teams: d.teams.map(t => ({ ...t, seq: t.seq.slice() })), rosters: rosters0, fa: fa0, lgLog: lg0, natW: natDefault(), overseas: d.os.slice(), buyoutCash: 0, tactics: { pace: 'Balanced', off: 'Balanced', def: 'Switch', clutch: 'Motion' }, scouts: [{ name: 'Dale Whitcombe', spec: 'NA', skill: 4, assign: 'NA' }, { name: 'Inés Morales', spec: 'WEU', skill: 3, assign: 'WEU' }, { name: 'Goran Vuković', spec: 'BAL', skill: 4, assign: 'BAL' }, { name: 'Kwame Asante', spec: 'AFR', skill: 2, assign: 'AFR' }], promises: {}, agentRep: 50, listModal: null, train: {}, reports: [], taxHist: [], god: false, phase: 'regular', season: 2027, po: null, playinRes: [], history: [], expansion: false, expanded: false, prog: null, lotto: null, lists: [{ id: 'l1', name: 'Watchlist', ids: [] }], newList: '', txFilter: 'All', day: 0, results: d.results.slice(), log: [],
      sort: { roster: ['rk', 1], fa: ['ovr', -1], draft: ['rank', 1] }, stand: 'conf', tTid: 5, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null,
      assets: d.assets.map(a => ({ ...a })), picks: d.order.map((orig, i) => ({ n: i + 1, orig, pid: null })), pi: 0, dClass: 2027, adv: {}, mleUsed: false,
      budget: { Coaching: 18, Health: 10, Facilities: 14, Scouting: 4, Tickets: 118 }, q: '', dialog: null, showJson: false };
  }
  get Y() { return (this.state && this.state.season) || 2027; }
  seasonLbl() { return (this.Y - 1) + '–' + String(this.Y).slice(2); }
  dateOf(off) { return this.Y > 2027 ? new Date(this.Y - 1, 9, 21 + off) : new Date(2027, 0, 14 + off); }
  gameWin(s, a, b, homeA) { const st = t => t === 0 ? this.userStr(s.rosters[0], s.budget.Coaching) : s.teams[t].str; return Math.random() < this.cl(0.5 + (st(a) - st(b)) * 0.035 + (homeA ? 0.04 : -0.04), .1, .9); }
  seeds(s, conf) { return s.teams.filter(t => t.conf === conf).sort((a, b) => this.pct(b) - this.pct(a) || b.w - a.w).map(t => t.tid); }
  startPlayin() {
    this.setState(s => {
      const me = s.teams[0]; if (s.phase !== 'regular' || me.w + me.l < 82) return null;
      const res = [], rounds = [[]]; let log = s.log; const A = t => s.teams[t].abbr;
      ['East', 'West'].forEach(c => {
        const sd = this.seeds(s, c), [t7, t8, t9, t10] = sd.slice(6, 10);
        const w78 = this.gameWin(s, t7, t8, true) ? t7 : t8, l78 = w78 === t7 ? t8 : t7, w910 = this.gameWin(s, t9, t10, true) ? t9 : t10, l910 = w910 === t9 ? t10 : t9;
        const e8 = this.gameWin(s, l78, w910, true) ? l78 : w910;
        res.push(c + ': ' + A(w78) + ' beat ' + A(l78) + ' for the 7 seed · ' + A(w910) + ' eliminated ' + A(l910) + ' · ' + A(e8) + ' took the 8 seed');
        const top = [...sd.slice(0, 6), w78, e8];
        [[0, 7], [3, 4], [2, 5], [1, 6]].forEach(([i, j]) => rounds[0].push({ a: top[i], sa: i + 1, b: top[j], sb: j + 1, wa: 0, wb: 0, conf: c }));
        if ([t7, t8, t9, t10].includes(0)) log = this.logEntry(s, top.includes(0) ? 'Advanced through the play-in' : 'Eliminated in the play-in');
      });
      return { phase: 'playoffs', playinRes: res, po: { rounds, champ: null }, log, screen: 'playoffs' };
    });
  }
  simPo(mode) {
    this.setState(s => {
      if (s.phase !== 'playoffs' || !s.po || s.po.champ != null) return null;
      const po = { ...s.po, rounds: s.po.rounds.map(r => r.map(x => ({ ...x }))) }; let log = s.log;
      const RN = ['first round', 'conference semifinals', 'conference finals', 'Finals'];
      const W = x => x.wa === 4 ? { t: x.a, sd: x.sa } : { t: x.b, sd: x.sb }, L = x => x.wa === 4 ? x.b : x.a, done = x => x.wa === 4 || x.wb === 4;
      const advance = () => {
        const r = po.rounds[po.rounds.length - 1];
        if (r.length === 1) { po.champ = W(r[0]).t; po.runner = L(r[0]); return; }
        let nr = [];
        if (r.length === 2) { let e = W(r[0]), w = W(r[1]); if (this.pct(s.teams[w.t]) > this.pct(s.teams[e.t])) [e, w] = [w, e]; nr = [{ a: e.t, sa: e.sd, b: w.t, sb: w.sd, wa: 0, wb: 0, conf: 'Finals' }]; }
        else ['East', 'West'].forEach(c => { const cs = r.filter(x => x.conf === c); for (let i = 0; i < cs.length; i += 2) { const x = W(cs[i]), y = W(cs[i + 1]); const [hi, lo] = x.sd <= y.sd ? [x, y] : [y, x]; nr.push({ a: hi.t, sa: hi.sd, b: lo.t, sb: lo.sd, wa: 0, wb: 0, conf: c }); } });
        po.rounds.push(nr);
      };
      const playGame = () => {
        const ri = po.rounds.length - 1, r = po.rounds[ri];
        r.forEach(x => { if (done(x)) return; const g = x.wa + x.wb; if (this.gameWin(s, x.a, x.b, [0, 1, 4, 6].includes(g))) x.wa++; else x.wb++;
          if (done(x) && (x.a === 0 || x.b === 0)) { const won = W(x).t === 0, o = s.teams[x.a === 0 ? x.b : x.a]; log = [{ date: this.fmtS(s.day), day: s.day, text: (won ? 'Won ' : 'Lost ') + (ri === 3 ? 'the Finals' : 'the ' + RN[ri]) + ' vs ' + o.abbr + ', ' + Math.max(x.wa, x.wb) + '–' + Math.min(x.wa, x.wb) }, ...log]; } });
        if (r.every(done)) advance();
      };
      let g = 0;
      if (mode === 'game') playGame(); else if (mode === 'round') { const n0 = po.rounds.length; while (po.rounds.length === n0 && po.champ == null && g++ < 10) playGame(); } else while (po.champ == null && g++ < 60) playGame();
      const out: any = { po, log };
      if (po.champ != null) {
        const me = s.teams[0]; let fin = 'Missed the playoffs';
        po.rounds.forEach((r, i) => r.forEach(x => { if (x.a === 0 || x.b === 0) fin = W(x).t === 0 ? (i === 3 ? 'Won the title' : fin) : 'Lost in the ' + RN[i]; }));
        if (fin === 'Missed the playoffs' && this.seeds(s, me.conf).indexOf(0) < 10) fin = 'Lost in the play-in';
        out.history = [{ season: this.seasonLbl(), champ: po.champ, runner: po.runner, rec: me.w + '–' + me.l, fin }, ...s.history];
        out.lgLog = [{ day: s.day, type: 'Draft', teams: s.teams[po.champ].abbr, text: s.teams[po.champ].region + ' ' + s.teams[po.champ].name + ' won the ' + this.seasonLbl() + ' championship' }, ...s.lgLog].map(e => e.type === 'Draft' && /championship$/.test(e.text) ? { ...e, type: 'Award' } : e);
      }
      return out;
    });
  }
  runLottery() {
    this.setState(s => {
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
  statsFor(ids) { const MIN = [34, 33, 32, 30, 28, 24, 20, 17, 14, 10, 7, 5, 3, 2, 1]; ids.slice().sort((a, b) => this.db.P[b].ovr - this.db.P[a].ovr).forEach((id, k) => { const p = this.db.P[id], m = MIN[k] ?? 1, f = m / 36, n = () => .85 + Math.random() * .3; p.gp = 0; p.min = +(m * n()).toFixed(1); p.pts = +this.ppg(p, m).toFixed(1); p.reb = +(f * p.r.reb / 7.5 * n()).toFixed(1); p.ast = +(f * p.r.pss / 9 * n()).toFixed(1); p.per = +this.cl(15 + (p.ovr - 50) * .75 + (Math.random() - .5) * 5, 3, 32).toFixed(1); }); }
  startFA() {
    this.setState(s => {
      if (s.phase !== 'draft' || s.pi < s.picks.length) return null;
      const P = this.db.P, Y = this.Y, rosters = { ...s.rosters }, fa = s.fa.slice(), ovs = (s.overseas || []).slice(); let lgLog = s.lgLog;
      s.picks.forEach(pk => { const ow = this.owner2027(pk.orig, s.assets); if (ow !== 0 && pk.pid && this.db.P[pk.pid].boycott) { const p = this.db.P[pk.pid]; p.abroad = { club: p.from.team, lg: p.from.lg, country: p.from.country || p.raised, pts: 12, reb: 5, ast: 2, clause: 'Buyout', fee: 2.5 }; Object.assign(p, { cls: 0, dr: { rd: 1, pick: pk.n }, draft: Y }); ovs.push(pk.pid); }
      else if (ow !== 0 && pk.pid) { const p = P[pk.pid]; Object.assign(p, { amt: this.rookieAmt(pk.n), dr: { rd: 1, pick: pk.n }, draft: Y, rookie: true, exp: Y + 4, yrsWith: 0 }); rosters[ow] = [...rosters[ow], pk.pid]; } });
      Object.keys(rosters).forEach(k => { const t = +k; rosters[t] = rosters[t].filter(id => { const p = P[id];
        if (p.ext) { p.exp += p.ext.yrs; p.amt = p.ext.amt; delete p.ext; return true; }
        if (p.exp > Y) return true;
        if (t !== 0 && Math.random() < .55) { p.exp = Y + 1 + Math.floor(Math.random() * 4); p.amt = +this.fair(p.ovr).toFixed(1); p.rookie = false; return true; }
        p.prevAmt = p.amt; p.ask = +Math.max(p.age <= 22 ? 1.35 : 2.44, this.fair(p.ovr) * (p.mood === 'Eager' ? .9 : p.mood === 'Reluctant' ? 1.2 : 1)).toFixed(1); p.exp = Y + 1 + Math.floor(Math.random() * 4); p.birdTid = t; p.rookie = false; fa.push(id); return false; }); });
      const mine = s.log;
      return { overseas: ovs, phase: 'fa', rosters, fa, mleUsed: false, screen: 'fa', lgLog: [{ day: s.day, type: 'Signing', teams: 'League', text: 'Free agency opened with ' + fa.length + ' players available' }, ...lgLog], log: this.logEntry(s, 'Free agency opened. Your expiring players are listed with Bird rights.') };
    });
  }
  advanceFA(days) {
    this.setState(s => {
      if (s.phase !== 'fa') return null;
      const P = this.db.P, T = this.db.teams, rosters = { ...s.rosters }, fa = s.fa.slice(); let lgLog = s.lgLog;
      for (let d = 0; d < days * 8; d++) {
        const need = T.map(t => t.tid).filter(t => t !== 0 && rosters[t].length < 15).sort((a, b) => rosters[a].length - rosters[b].length);
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
      const P = this.db.P, d = this.db, Y = this.Y + 1, coach = (s.budget.Coaching - 18) / 12;
      let rosters = { ...s.rosters }, fa = s.fa.slice(), teams = s.teams.map(t => ({ ...t, seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 })), assets = s.assets.filter(a => a.yr > this.Y), log = s.log, lgLog = s.lgLog, prog = [];
      const grow = (p, bonus) => { if (p.age < 24 && (p.minorCount || 0) >= 3) { bonus -= 2; p.pot = Math.max(p.ovr, p.pot - 1 - Math.floor(Math.random() * 3)); } p.minorCount = 0; p.age++; const a = p.age, base = a <= 22 ? 2 + Math.random() * 4 : a <= 25 ? 1 + Math.random() * 3 : a <= 28 ? -1 + Math.random() * 3 : a <= 31 ? -3 + Math.random() * 3 : -5 + Math.random() * 4; const dlt = Math.round(base * .5 + bonus); const from = p.ovr; p.ovr = this.cl(p.ovr + dlt, 25, 85); if (p.pot < p.ovr) p.pot = p.ovr; if (a >= 28) p.pot = Math.max(p.ovr, p.pot - 2); Object.keys(p.r).forEach(k => p.r[k] = Math.round(this.cl(p.r[k] + dlt + (Math.random() - .5) * 4, 4, 99))); return from; };
      Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const from = grow(P[id], +k === 0 ? coach : 0); P[id].yrsWith = (P[id].yrsWith || 0) + 1; if (+k === 0) prog.push({ id, from, to: P[id].ovr }); }));
      fa.forEach(id => grow(P[id], 0));
      const retire = id => P[id].age >= 35 && (P[id].ovr < 52 || Math.random() < .35);
      fa = fa.filter(id => !retire(id));
      Object.keys(rosters).forEach(k => { if (+k === 0) return; const out = rosters[k].filter(retire); if (out.length) { rosters[k] = rosters[k].filter(id => !out.includes(id)); out.forEach(id => lgLog = [{ day: s.day, type: 'Release', teams: teams[k].abbr, text: P[id].name + ' retired at ' + P[id].age }, ...lgLog]); } });
      const left = d.cls[this.Y].filter(id => !s.picks.some(x => x.pid === id)).slice(0, 10);
      left.forEach(id => { Object.assign(P[id], { cls: 0, dr: null, draft: this.Y, amt: 1.35, ask: 1.35, exp: Y + 1, yrsWith: 0 }); fa.push(id); });
      [Y, Y + 1].forEach(yr => (d.cls[yr] || []).forEach(id => { const p = P[id]; p.age++; if (yr === Y) { if (p.from.lg === 'High school') p.from = { team: ['Kentucky', 'Duke', 'Kansas', 'UCLA', 'Gonzaga', 'Arizona', 'UConn', 'Houston'][id % 8], lg: 'NCAA', country: 'US' }; else if (p.from.lg === 'Junior') p.from = { ...p.from, team: p.from.team.replace(' U18', ''), lg: 'Senior club' }; } }));
      d.cls[Y + 2] = []; for (let k = 0; k < 25 + (teams.length - 30); k++) { const p = this.mkPlayer(24 + Math.random() * 10, 16 + Math.floor(Math.random() * 2), s.natW || natDefault(), Y + 2); p.pot = Math.round(this.cl(p.ovr + 20 + Math.random() * 28, 45, 84)); p.exp = Y + 5; d.cls[Y + 2].push(p.id); }
      d.cls[Y + 2].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      teams.forEach(t => [1, 2].forEach(rd => assets.push({ id: (Y + 2) + '-' + rd + '-' + t.tid, yr: Y + 2, rd, orig: t.tid, owner: t.tid })));
      let expanded = s.expanded;
      if (s.expansion && !s.expanded) {
        const NEW = [['Louisville', 'Thoroughbreds', 'LOU', 'East', 'Central', .75], ['Mexico City', 'Águilas', 'MEX', 'West', 'Southwest', 1.3]];
        NEW.forEach((n, j) => { const tid = teams.length; const t = { tid, region: n[0], name: n[1], abbr: n[2], conf: n[3], div: n[4], mkt: n[5], str: 46, seq: [], w: 0, l: 0, hw: 0, hl: 0, rw: 0, rl: 0 }; teams.push(t); d.teams.push({ ...t }); rosters[tid] = []; [Y, Y + 1, Y + 2].forEach(yr => [1, 2].forEach(rd => assets.push({ id: yr + '-' + rd + '-' + tid, yr, rd, orig: tid, owner: tid }))); });
        const base = teams.length - 2;
        for (let t = 1; t < base; t++) { const ids = rosters[t].slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(8); if (!ids.length) continue; const id = ids[Math.floor(Math.random() * ids.length)]; rosters[t] = rosters[t].filter(x => x !== id); const nt = base + (t % 2); rosters[nt] = [...rosters[nt], id]; }
        [base, base + 1].forEach(nt => { while (rosters[nt].length < 14 && fa.length) { const id = fa.sort((a, b) => P[b].ovr - P[a].ovr).shift(); P[id].amt = P[id].ask; rosters[nt] = [...rosters[nt], id]; } });
        ['CAP', 'MINP', 'TAX', 'AP1', 'AP2', 'MLE', 'MAXC'].forEach(k => d.caps[k] = +(d.caps[k] * 1.02).toFixed(1));
        for (let k = 0; k < 2; k++) { const p = this.mkPlayer(30 + Math.random() * 10, 18, s.natW || natDefault(), Y + 1); p.pot = Math.round(this.cl(p.ovr + 14 + Math.random() * 24, 45, 80)); d.cls[Y + 1].push(p.id); }
        expanded = true; lgLog = [{ day: s.day, type: 'Signing', teams: 'LOU · MEX', text: 'The league expanded to 32 teams: Louisville Thoroughbreds and Mexico City Águilas. Salary cap rises to $' + this.CAP + 'M.' }, ...lgLog];
      }
      Object.keys(rosters).forEach(k => { if (+k === 0) return; while (rosters[k].length < 13 && fa.length) { const id = fa.sort((a, b) => P[b].ovr - P[a].ovr).shift(); P[id].amt = P[id].ask; rosters[k] = [...rosters[k], id]; } while (rosters[k].length > 15) { const w = rosters[k].slice().sort((a, b) => P[a].ovr - P[b].ovr)[0]; rosters[k] = rosters[k].filter(x => x !== w); fa.push(w); } });
      Object.keys(rosters).forEach(k => { this.statsFor(rosters[k]); if (+k !== 0) { const o = rosters[k].map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); teams[k].str = o.reduce((a, b) => a + b, 0) / o.length - 4.3; } });
      d.sched = Array.from({ length: 82 }, (_, i) => ({ opp: 1 + Math.floor(Math.random() * (teams.length - 1)), home: i % 2 === 0 }));
      const order = teams.slice().sort((a, b) => a.str - b.str).map(t => t.tid);
      d.rank = { ...d.rank }; d.cls[Y].sort((a, b) => (P[b].pot * .7 + P[b].ovr * .3) - (P[a].pot * .7 + P[a].ovr * .3)).forEach((id, i) => d.rank[id] = i + 1);
      prog.sort((a, b) => (b.to - b.from) - (a.to - a.from));
      const pay0 = s.rosters[0].reduce((a, id) => a + P[id].amt, 0);
      return { taxHist: [...(s.taxHist || []), pay0 > this.TAX], season: Y, phase: 'preseason', rosters, fa, teams, assets, day: 0, results: [], po: null, playinRes: [], lotto: null, picks: order.map((orig, i) => ({ n: i + 1, orig, pid: null })), pi: 0, dClass: Y, adv: {}, prog, expanded, lgLog, log, screen: 'dash', tTid: 1, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [] };
    });
  }
  startSeason() { this.setState(s => s.phase === 'preseason' && s.rosters[0].length <= 15 ? { phase: 'regular', prog: null } : null); }
  dateOf0(off) { return new Date(this.Y, 0, 14 + off); }
  fmtS(off) { return this.dateOf(off).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  logEntry(st, text) { return [{ date: this.fmtS(st.day), day: st.day, text }, ...st.log]; }
  userStr(ids, coach) { const o = ids.filter(id => !this.db.P[id].inj && !this.db.P[id].dev).map(id => this.db.P[id].ovr).sort((a, b) => b - a).slice(0, 8); return o.reduce((a, b) => a + b, 0) / o.length - 4.3 + ((coach || 18) - 18) / 30 + (this.state ? this.tacFit(ids, this.state.tactics) : 0) - ids.slice(0, 8).filter(id => this.db.P[id].adjust > 0).length * .3; }
  flag(code) { return 'flags/' + this.db.C[code].iso + '.svg'; }
  pct(t) { return t.w + t.l ? t.w / (t.w + t.l) : 0; }
  owner2027(orig, assets) { return assets.find(a => a.yr === this.Y && a.rd === 1 && a.orig === orig).owner; }
  fair(ovr) { return Math.min(this.MAXC, (2.4 + Math.pow(Math.max(0, ovr - 42) / 28, 2.1) * 52) * this.db.sf); }
  strategies(T) {
    const sc = t => this.pct(t) * 0.65 + (t.str - 45) / 12 * 0.35;
    const srt = T.filter(t => t.tid !== 0).sort((a, b) => sc(b) - sc(a)), out = {};
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
  injTick(rosters, day, s, out) {
    const P = this.db.P, hb = 1 - (s.budget.Health - 10) / 40, pk = a => a[Math.floor(Math.random() * a.length)];
    Object.keys(rosters).forEach(k => rosters[k].slice(0, 12).forEach(id => { const p = P[id];
      if (p.inj) { p.inj.games--; if (p.inj.games <= 0) { if (+k === 0) out.push({ mine: true, text: p.name + ' returned from ' + p.inj.name.toLowerCase() }); delete p.inj; } return; }
      const risk = .0045 * (1 + Math.max(0, p.age - 27) * .05) * (1.45 - p.r.endu / 100) * (1.25 - p.r.stre / 200) * (p.min / 30) * (p.pers.prone ? 1.8 : 1);
      if (Math.random() >= risk) return;
      const x = Math.random(); let inj;
      if (x < .03) { inj = { name: Math.random() < .5 ? 'Torn ACL' : 'Ruptured Achilles', games: 70 + Math.floor(Math.random() * 60), major: true }; ['spd', 'jmp', 'stre'].forEach(r => p.r[r] = Math.max(4, p.r[r] - 3 - Math.floor(Math.random() * 4))); p.ovr = Math.max(25, p.ovr - 2); }
      else if (x < .15) inj = { name: pk(['Sprained MCL', 'Stress fracture', 'High ankle sprain']), games: 8 + Math.floor(Math.random() * 14) };
      else { inj = { name: pk(['Ankle sprain', 'Hamstring strain', 'Bruised knee', 'Back spasms', 'Sprained finger']), games: 1 + Math.floor(Math.random() * 6) }; p.minorCount = (p.minorCount || 0) + 1; }
      if (+k === 0) inj.games = Math.max(1, Math.round(inj.games * hb));
      p.inj = inj; (p.injHist = p.injHist || []).push({ name: inj.name, games: inj.games, season: this.seasonLbl() });
      out.push({ mine: +k === 0, major: !!inj.major, tid: +k, text: p.name + ' (' + s.teams[k].abbr + '): ' + inj.name.toLowerCase() + ', out about ' + inj.games + ' game' + (inj.games === 1 ? '' : 's') });
    }));
  }
  devTick(s, rosters, day) {
    const P = this.db.P, cl = this.cl, coach = 1 + (s.budget.Coaching - 18) / 60;
    const FOC = { Balanced: [], Shooting: ['tp', 'fg', 'ft'], Finishing: ['ins', 'dnk'], Playmaking: ['drb', 'pss', 'oiq'], Defense: ['diq', 'spd', 'stre'], Rebounding: ['reb', 'stre'], Athleticism: ['spd', 'jmp', 'stre'], Conditioning: ['endu'] };
    const LB = { hgt: 'Hgt', stre: 'Str', spd: 'Spd', jmp: 'Jmp', endu: 'End', ins: 'Ins', dnk: 'Dnk', ft: 'FT', fg: 'Mid', tp: '3PT', oiq: 'OIQ', diq: 'DIQ', drb: 'Drb', pss: 'Pss', reb: 'Reb' };
    const rows = [];
    Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id], a = p.age, mine = +k === 0;
      const annual = a <= 22 ? 4 : a <= 25 ? 2.5 : a <= 28 ? .8 : a <= 31 ? -1.2 : -3;
      const minF = p.dev ? 1.4 : a <= 24 ? (p.min < 10 ? .55 : p.min < 20 ? .85 : 1.1) : 1, injF = p.inj ? (p.inj.major ? .2 : .7) : 1;
      const monthly = annual / 12 * (mine ? coach : 1) * minF * injF * (0.6 + Math.random() * .8);
      const focus = mine ? (s.train[id] || 'Balanced') : 'Balanced', keys = FOC[focus], rolesB = mine ? this.rolesOf(p) : null, dl = {};
      p.rx = p.rx || {};
      Object.keys(p.r).forEach(r => { let w = keys.length ? (keys.includes(r) ? 2.2 : .45) : 1; if (r === 'hgt') w = a <= 20 ? .3 : 0; if (['spd', 'jmp', 'endu'].includes(r) && a >= 29) w *= 1.4;
        const d = monthly * w; dl[r] = d; p.rx[r] = (p.rx[r] || 0) + d; const whole = Math.trunc(p.rx[r]); if (whole) { p.r[r] = cl(p.r[r] + whole, 4, 99); p.rx[r] -= whole; } });
      p.ox = (p.ox || 0) + monthly; const wo = Math.trunc(p.ox); if (wo) { p.ovr = cl(p.ovr + wo, 25, 85); p.ox -= wo; if (p.pot < p.ovr) p.pot = p.ovr; }
      if (mine) { const top = (Object.entries(dl) as [string, any][]).filter(([r]) => r !== 'hgt').sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3).map(([r, v]) => LB[r] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(1)).join(' · ');
        const unlocked = this.rolesOf(p).filter(r => !rolesB.includes(r));
        const note = unlocked.length ? 'Unlocked: ' + unlocked.join(', ') : p.dev ? 'Dev league reps are accelerating his growth' : a <= 24 && p.min < 10 ? 'Stalled without minutes; consider the dev league' : p.inj ? 'Growth slowed by injury' : monthly < 0 ? 'Age-related decline' : focus !== 'Balanced' ? focus + ' focus is paying off' : 'Steady progress';
        rows.push({ id, name: p.name, focus, d: (monthly >= 0 ? '+' : '') + monthly.toFixed(2), up: monthly >= 0, changes: top, note, ovr: p.ovr }); }
    }));
    return { label: this.dateOf(day - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), rows };
  }
  aiMove(R, fa, day) {
    const P = this.db.P, T = this.db.teams, r = Math.random(), tid = () => 1 + Math.floor(Math.random() * (T.length - 1));
    if (r < .4) { const t = tid(); if (R[t].length >= 15 || !fa.length) return null; const c = fa.slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 5); const id = c[Math.floor(Math.random() * c.length)]; fa.splice(fa.indexOf(id), 1); R[t] = [...R[t], id]; P[id].amt = P[id].ask; return { day, type: 'Signing', teams: T[t].abbr, text: T[t].region + ' ' + T[t].name + ' signed ' + P[id].name + ' ($' + P[id].ask.toFixed(1) + 'M through ' + P[id].exp + ')' }; }
    if (r < .75) { const a = tid(), b = tid(); if (a === b) return null; const pa = R[a][3 + Math.floor(Math.random() * 9)]; if (!pa) return null; const c = R[b].filter(id => Math.abs(P[id].ovr - P[pa].ovr) <= 3 && Math.abs(P[id].amt - P[pa].amt) <= P[pa].amt * .3 + 2); if (!c.length) return null; const pb = c[Math.floor(Math.random() * c.length)]; R[a] = R[a].map(x => x === pa ? pb : x); R[b] = R[b].map(x => x === pb ? pa : x); return { day, type: 'Trade', teams: T[a].abbr + ' · ' + T[b].abbr, text: T[a].region + ' traded ' + P[pa].name + ' to ' + T[b].region + ' for ' + P[pb].name }; }
    const t = tid(); if (R[t].length < 14) return null; const id = R[t][R[t].length - 1]; R[t] = R[t].slice(0, -1); fa.push(id); P[id].ask = Math.max(2.44, +(P[id].amt * .8).toFixed(1)); return { day, type: 'Release', teams: T[t].abbr, text: T[t].region + ' ' + T[t].name + ' waived ' + P[id].name };
  }
  sim(n, forced?) {
    this.setState(s => {
      if (s.phase !== 'regular') return null; n = Math.min(n, 82 - (s.teams[0].w + s.teams[0].l)); if (n <= 0) return null;
      const rosters = { ...s.rosters }, fa = s.fa.slice(), lgLog = s.lgLog.slice(), inj = []; let reports = s.reports;
      const teams = s.teams.map(t => ({ ...t, seq: t.seq.slice() })), results = s.results.slice(); let day = s.day;
      const ustr = this.userStr(s.rosters[0], s.budget.Coaching);
      const rec = (t, win, home) => { if (win) { t.w++; home ? t.hw++ : t.rw++; } else { t.l++; home ? t.hl++ : t.rl++; } t.seq.push(win); };
      for (let i = 0; i < n; i++) {
        const g = this.db.sched[day % this.db.sched.length], o = teams[g.opp];
        const F = forced && i === 0 ? forced : null;
        const win = F ? F.win : Math.random() < this.cl(0.5 + (ustr - o.str) * 0.035 + (g.home ? 0.04 : -0.04), 0.1, 0.9);
        const a = F ? F.us : 104 + Math.floor(Math.random() * 20), b = F ? F.them : a - (win ? 1 : -1) * (1 + Math.floor(Math.random() * 16));
        if (Math.random() < .35) { const e = this.aiMove(rosters, fa, day); if (e) lgLog.unshift(e); }
        rec(teams[0], win, g.home); rec(o, !win, !g.home);
        teams.forEach(t => { if (t.tid !== 0 && t.tid !== g.opp) rec(t, Math.random() < this.cl(0.5 + (t.str - 51) * 0.045, .2, .8), Math.random() < .5); });
        results.unshift({ day, win, us: a, them: b, opp: g.opp, home: g.home });
        Object.keys(rosters).forEach(t => rosters[t].slice(0, 12).forEach(id => { const q = this.db.P[id]; if (!q.inj) { q.gp++; if (q.adjust > 0) q.adjust--; } }));
        this.injTick(rosters, day, s, inj);
        if (this.dateOf(day).getMonth() !== this.dateOf(day - 1).getMonth()) { reports = [this.devTick(s, rosters, day), ...reports].slice(0, 6); (s.overseas || []).forEach(id => { const q = this.db.P[id]; if (q.age <= 29 && q.abroad) { q.ox = (q.ox || 0) + (q.age <= 25 ? .35 : .2) * (q.redeem ? 1.3 : 1); const w = Math.trunc(q.ox); if (w) { q.ovr = Math.min(q.pot + 2, q.ovr + w); q.ox -= w; Object.keys(q.r).forEach(k => q.r[k] = Math.min(99, q.r[k] + w)); } q.abroad.pts = +(8 + (q.ovr - 44) * 1.1 + 2).toFixed(1); } }); }
        day++;
      }
      inj.filter(x => x.major).forEach(x => lgLog.unshift({ day, type: 'Injury', teams: s.teams[x.tid].abbr, text: x.text }));
      return { teams, results, day, rosters, fa, lgLog, reports, log: [...inj.filter(x => x.mine).reverse().map(x => ({ date: this.fmtS(day - 1), day: day - 1, text: x.text })), ...s.log], tTheirs: s.tTheirs.filter(id => rosters[s.tTid].includes(id)) };
    });
  }
  rookieAmt(n) { return +(2.9 + Math.pow((30 - n) / 29, 1.6) * 10.9).toFixed(1); }
  aiDraft(untilMine) {
    this.setState(s => {
      if (s.phase !== 'draft') return null;
      const picks = s.picks.map(p => ({ ...p })); let pi = s.pi; const taken = new Set(picks.filter(p => p.pid).map(p => p.pid));
      const rosters = { ...s.rosters }; let log = s.log, rep = s.agentRep; const promises = { ...s.promises };
      while (pi < picks.length && !(untilMine && this.owner2027(picks[pi].orig, s.assets) === 0)) {
        const avail0 = this.db.cls[this.Y].filter(id => !taken.has(id)), ai = this.owner2027(picks[pi].orig, s.assets) !== 0;
        const avail = ai ? (avail0.filter(x => !promises[x] || Math.random() < .4 || this.db.rank[x] <= 3).length ? avail0.filter(x => !promises[x] || Math.random() < .4 || this.db.rank[x] <= 3) : avail0) : avail0;
        const id = avail[Math.min(avail.length - 1, Math.floor(Math.random() * Math.random() * 3))];
        picks[pi].pid = id; taken.add(id);
        if (ai && promises[id]) { const p = this.db.P[id], pr = promises[id], ow = s.teams[this.owner2027(picks[pi].orig, s.assets)]; const loyal = (p.pers.mot === 'Loyalty' || p.pers.pro || pr.str > 65) && p.pers.mot !== 'Money' && p.pers.mot !== 'Fame';
          if (loyal) { p.boycott = true; rep += 3; log = [{ date: this.fmtS(s.day), day: s.day, text: p.name + ' refused to report to ' + ow.abbr + ' and will return to ' + p.from.team + ', honoring his commitment to Baltimore' }, ...log]; }
          else { rep -= 10; log = [{ date: this.fmtS(s.day), day: s.day, text: p.name + ' signed with ' + ow.abbr + ' despite his promise to Baltimore. Agent reputation fell.' }, ...log]; }
          delete promises[id]; }
        if (this.owner2027(picks[pi].orig, s.assets) === 0) { const p = this.db.P[id]; p.amt = this.rookieAmt(picks[pi].n); p.dr = { rd: 1, pick: picks[pi].n }; p.draft = this.Y; Object.assign(p, { rookie: true, exp: (this.Y + 4), yrsWith: 0 }); rosters[0] = [...rosters[0], id]; log = [{ date: this.fmtS(s.day), text: 'Auto-drafted ' + p.name + ' at #' + picks[pi].n }, ...log]; }
        pi++;
      }
      return { picks, pi, rosters, log, adv: {}, promises, agentRep: this.cl(rep, 0, 100) };
    });
  }
  draftPick(id) {
    this.setState(s => {
      const cur = s.phase === 'draft' ? s.picks[s.pi] : null; if (!cur || this.owner2027(cur.orig, s.assets) !== 0) return null;
      const picks = s.picks.map((p, i) => i === s.pi ? { ...p, pid: id } : p);
      this.db.P[id].amt = this.rookieAmt(cur.n); this.db.P[id].dr = { rd: 1, pick: cur.n }; this.db.P[id].draft = this.Y; Object.assign(this.db.P[id], { rookie: true, exp: (this.Y + 4), yrsWith: 0 });
      const promises = { ...s.promises }; let rep = s.agentRep; const mineP = Object.keys(promises).find(k => promises[k].n === cur.n); if (mineP) { rep += +mineP === id ? 5 : -15; delete promises[mineP]; }
      return { promises, agentRep: this.cl(rep, 0, 100), picks, pi: s.pi + 1, adv: {}, rosters: { ...s.rosters, 0: [...s.rosters[0], id] }, log: this.logEntry(s, 'Drafted ' + this.db.P[id].name + ' at #' + cur.n) };
    });
  }
  askFor(p, s) {
    const me = s.teams[0], conf = s.teams.filter(t => t.conf === me.conf).sort((a, b) => this.pct(b) - this.pct(a)), top = conf.indexOf(me) < 6, m = p.pers.mot;
    let x = p.ask;
    if (m === 'Money') x *= p.age >= 30 ? 1.2 : 1.1;
    if (m === 'Winning') x *= top ? (p.age >= 30 ? .8 : .9) : (p.age >= 30 ? 1.15 : 1);
    if (m === 'Fame') x *= 1 - (me.mkt - 1) * .4;
    return +Math.max(p.age <= 22 ? 1.35 : 2.44, x).toFixed(1);
  }
  moodOf(p, idx, s) {
    const me = s.teams[0], wp = this.pct(me), m = p.pers.mot, w = k => m === k ? 2 : 1, P = this.db.P;
    const rank = s.rosters[0].map(id => P[id]).sort((a, b) => b.ovr - a.ovr).findIndex(x => x.id === p.id);
    const f: any[] = [['Team success', (wp - .5) * 50 * (m === 'Winning' ? 2 : .6)]];
    if (idx >= 5 && rank < 5) f.push(['Coming off the bench', -10 * w('Playing time')]); else if (idx < 5) f.push(['Starting role', 5 * w('Playing time')]); else if (idx >= 10 && p.age >= 24) f.push(['Barely playing', -6 * w('Playing time')]);
    if (p.pers.alpha) f.push(rank === 0 ? ['Leading his own team', 8] : ['Wants to be the No. 1 option', -7]);
    if (p.pers.touches && p.pts < 12 && p.ovr >= 52) f.push(['Wants the ball more', -6]);
    const fair = this.fair(p.ovr); if (!p.rookie && p.amt < fair * .75) f.push(['Feels underpaid', -8 * w('Money')]); else if (p.amt > fair * 1.1) f.push(['Well paid', 4 * w('Money')]);
    if (p.exp === this.Y && !p.ext && p.ovr >= 52) f.push(['No extension offered', -6 * (m === 'Money' || m === 'Loyalty' ? 1.5 : 1)]);
    if (m === 'Fame') f.push(['Market size', (me.mkt - 1) * 40]);
    if (m === 'Loyalty') f.push(['Years with the team', p.yrsWith * 3]);
    if (p.ext) f.push(['Recently extended', 8]);
    const k = p.pers.volatile ? 1.4 : p.pers.pro ? .7 : 1;
    const fs = f.map(([n, v]) => [n, Math.round(v * k)]); if (p.pers.pro) fs.push(['Consummate professional', 5]);
    const out = fs.filter(x => x[1] !== 0), hap = Math.round(this.cl(55 + out.reduce((a, x) => a + x[1], 0), 0, 100));
    return { hap, hapLabel: hap >= 80 ? 'Thrilled' : hap >= 62 ? 'Content' : hap >= 45 ? 'Neutral' : hap >= 30 ? 'Frustrated' : 'Wants out', hapColor: hap >= 62 ? 'var(--gm-good)' : hap < 45 ? 'var(--gm-bad)' : 'var(--color-text)', factors: out };
  }
  salAt(p, y) { return y <= p.exp ? p.amt : p.ext && y <= p.exp + p.ext.yrs ? p.ext.amt : 0; }
  signHow(p, s) {
    const mine = s.rosters[0], payroll = mine.reduce((a, id) => a + this.db.P[id].amt, 0);
    if (s.god) return 'God Mode';
    if (mine.length >= 15 && s.phase === 'regular') return null;
    if (p.birdTid === 0) return 'Bird rights';
    if (mine.length >= 15) return null;
    const ask = this.askFor(p, s);
    if (payroll + ask <= this.CAP) return 'Cap space';
    if (ask <= this.VMIN) return 'Minimum';
    if (!s.mleUsed && ask <= this.MLE && payroll + ask <= this.AP1) return 'Mid-level';
    return null;
  }
  confirmDialog() {
    this.setState(s => {
      const dg = s.dialog; if (!dg) return null; const p = this.db.P[dg.pid];
      if (dg.type === 'sign') { const how = this.signHow(p, s); if (!how) return { dialog: null }; const ask = this.askFor(p, s); p.amt = ask; if (how !== 'Bird rights') p.yrsWith = 0; p.birdTid = null; let cash = 0; if (p.abroad) { cash = p.abroad.fee; p.amt = +(p.amt + Math.max(0, p.abroad.fee - .85)).toFixed(1); p.adjust = 15; delete p.abroad; } return { dialog: null, buyoutCash: (s.buyoutCash || 0) + cash, overseas: (s.overseas || []).filter(x => x !== p.id), mleUsed: s.mleUsed || how === 'Mid-level', fa: s.fa.filter(x => x !== p.id), rosters: { ...s.rosters, 0: [...s.rosters[0], p.id] }, log: this.logEntry(s, 'Signed ' + p.name + ' · $' + ask.toFixed(1) + 'M through ' + p.exp + ' (' + how.toLowerCase() + ')') }; }
      if (dg.type === 'abroad') { const CL = clubs(), cc0 = ['ES', 'TR', 'GR', 'IT', 'FR', 'DE', 'CN', 'AU'][Math.floor(Math.random() * 8)], k2 = CL[cc0][Math.floor(Math.random() * CL[cc0].length)]; p.abroad = { club: k2[0], lg: k2[1], country: cc0, pts: 0, reb: 0, ast: 0, clause: 'NBA out clause', fee: .5 }; p.redeem = true; p.ask = Math.max(2.44, p.amt * .7); return { dialog: null, overseas: [p.id, ...(s.overseas || [])], rosters: { ...s.rosters, 0: s.rosters[0].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name + ' to play for ' + k2[0] + ' (' + k2[1] + ')') }; }
      if (dg.type === 'release') { p.ask = Math.max(2.44, p.amt); return { dialog: null, fa: [p.id, ...s.fa], rosters: { ...s.rosters, 0: s.rosters[0].filter(x => x !== p.id) }, log: this.logEntry(s, 'Released ' + p.name) }; }
      return { dialog: null };
    });
  }
  pickLabel(k, T) { return k.yr + ' ' + (k.rd === 1 ? '1st' : '2nd') + (k.orig === k.owner ? '' : ' (via ' + T[k.orig].abbr + ')'); }
  propose() {
    this.setState(s => {
      const P = this.db.P, T = s.teams, t = T[s.tTid], ev = this.evalTrade(s, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs);
      const WANT = { rebuild: 'Their priority is draft capital and young talent; they will take on salary to acquire it.', middle: 'They are looking for young, high-upside players and prefer to hold on to their picks.', contend: 'They are looking for proven contributors who can help immediately.' };
      if (!ev.ok && !s.god) return { tMsg: t.gm + ', ' + t.abbr + ' GM: \u201c' + (ev.diff < -Math.max(10, ev.give) * 0.4 ? 'We\u2019re not close. ' : 'We\u2019re close, but not there. ') + WANT[ev.st] + '\u201d' };
      const assets = s.assets.map(a => s.tkMine.includes(a.id) ? { ...a, owner: s.tTid } : s.tkTheirs.includes(a.id) ? { ...a, owner: 0 } : a);
      const rosters = { ...s.rosters, 0: [...s.rosters[0].filter(id => !s.tMine.includes(id)), ...s.tTheirs], [s.tTid]: [...s.rosters[s.tTid].filter(id => !s.tTheirs.includes(id)), ...s.tMine] };
      const A = id => this.pickLabel(s.assets.find(a => a.id === id), T);
      const names = (ps, ks) => { const x = [...ps.map(id => P[id].name), ...ks.map(A)]; return x.length ? x.join(', ') : 'nothing'; };
      return { rosters, assets, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: t.gm + ', ' + t.abbr + ' GM: \u201cWe have a deal.\u201d Baltimore receives ' + names(s.tTheirs, s.tkTheirs) + '.', log: this.logEntry(s, 'Traded ' + names(s.tMine, s.tkMine) + ' to ' + t.abbr + ' for ' + names(s.tTheirs, s.tkTheirs)) };
    });
  }
  balance() {
    this.setState(s => {
      const P = this.db.P;
      const cands = [...s.rosters[0].filter(id => !s.tMine.includes(id)).map(id => ({ p: id })), ...s.assets.filter(a => a.owner === 0 && !s.tkMine.includes(a.id) && !(a.yr === this.Y && a.rd === 1 && s.picks.find(x => x.orig === a.orig && x.pid))).map(a => ({ k: a.id }))];
      let best = null;
      cands.forEach(c => { const ev = this.evalTrade(s, c.p ? [...s.tMine, c.p] : s.tMine, s.tTheirs, c.k ? [...s.tkMine, c.k] : s.tkMine, s.tTheirs.length ? s.tkTheirs : s.tkTheirs); if (ev.ok && (!best || ev.diff < best.diff)) best = { ...c, diff: ev.diff }; });
      if (!best) return { tMsg: 'No single addition gets this done. Try asking for less.' };
      const what = best.p ? P[best.p].name : this.pickLabel(s.assets.find(a => a.id === best.k), s.teams);
      return { tMine: best.p ? [...s.tMine, best.p] : s.tMine, tkMine: best.k ? [...s.tkMine, best.k] : s.tkMine, tMsg: 'They would do it if you add ' + what + '.' };
    });
  }
  rolesOf(p, rel?) { const v = k => rel ? p.r[k] - p.ovr + 58 : p.r[k]; return roleDefs().filter(r => r[4](v, p)).map(r => r[0]); }
}

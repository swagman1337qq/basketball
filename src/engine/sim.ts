// Possession-by-possession game engine (HANDOFF.md, "Live Game"). One engine plays
// every game: the Live Game screen steps it on a timer, quick sims run it to the end.
// Possession rules are the prototype's; substitutions follow each player's target minutes.

export type Side = 'home' | 'away';

export interface SimPlayer {
  id: number; name: string; pos: string; grp: string; ovr: number; r: any;
  crowd?: boolean; clutch?: boolean; adj?: boolean; flag?: string;
  target: number; // minutes per 48 the coach wants him to play
}
export interface SimTeam { tid: number; name: string; abbr: string; rec: string; players: SimPlayer[] }
export interface SimOpts { userSide?: Side | null; tactics?: any; pbp?: boolean }

export interface BoxLine { min: number; fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number; orb: number; drb: number; ast: number; tov: number; stl: number; blk: number; pf: number; pts: number; pm: number; gs: number }
export interface SideState { pts: number; qs: number[]; box: Record<number, BoxLine>; tiers: Record<string, [number, number]> }
export interface GameResult { home: { tid: number; pts: number; qs: number[]; box: Record<number, BoxLine> }; away: { tid: number; pts: number; qs: number[]; box: Record<number, BoxLine> }; ot: number }
export interface PbpEvent { side: Side; time: string; text: string; sub: string; score: string }

const blank = (): BoxLine => ({ min: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, pm: 0, gs: 0 });
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');
// Shot and assist weights are softer than the prototype's (usage ^1.7, shooting ^2–2.4, passing ^2):
// with every game now simulated, those gave ten 30-point scorers a season and 6-assist leaders.
// These keep the team totals on the HANDOFF targets and give NBA-like leaderboards.
const usg = (p: SimPlayer) => Math.pow(Math.max(5, p.ovr - 30), 1.2) * (1 + (p.r.oiq - 50) / 200);
function wpick<T>(arr: T[], w: (x: T) => number): T {
  const tot = arr.reduce((a, x) => a + w(x), 0);
  let r = Math.random() * tot;
  for (const x of arr) { r -= w(x); if (r <= 0) return x; }
  return arr[0];
}
export const fmtClock = (t: number) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
export const qName = (q: number) => (q <= 4 ? 'Q' + q : 'OT' + (q > 5 ? q - 4 : ''));

// How far ahead of his minutes target a bench player must be before he replaces
// someone on the floor. Keeps stints realistic (starters open with ~6–8 minutes).
const SUB_MARGIN = 285;

export class GameSim {
  q = 1;
  t = 720;
  pos: Side = Math.random() < 0.5 ? 'home' : 'away';
  done = false;
  pbp: PbpEvent[] = [];
  home: SideState;
  away: SideState;
  on: Record<Side, SimPlayer[]> = { home: [], away: [] };
  teams: Record<Side, SimTeam>;

  constructor(home: SimTeam, away: SimTeam, public opts: SimOpts = {}) {
    this.teams = { home, away };
    const side = (t: SimTeam): SideState => ({ pts: 0, qs: [0, 0, 0, 0], box: Object.fromEntries(t.players.map(p => [p.id, blank()])), tiers: {} });
    this.home = side(home);
    this.away = side(away);
    (['home', 'away'] as Side[]).forEach(k => {
      this.on[k] = this.starters(k);
      this.on[k].forEach(p => (this[k].box[p.id].gs = 1));
    });
  }

  private elapsed() { return this.q <= 4 ? (this.q - 1) * 720 + (720 - this.t) : 2880 + (this.q - 5) * 300 + (300 - this.t); }
  private avail(k: Side) {
    const ps = this.teams[k].players.filter(p => this[k].box[p.id].pf < 6);
    return ps.length >= 5 ? ps : this.teams[k].players.slice(0, 5);
  }
  private starters(k: Side) { return this.avail(k).slice(0, 5); }

  // Pick who is on the floor for the coming possession.
  private rotate(k: Side) {
    const S = this[k], ps = this.avail(k), diff = Math.abs(this.home.pts - this.away.pts);
    if (ps.length <= 5) { this.on[k] = ps; return; }
    const late = this.q >= 4 && this.t < 300;
    if (late && diff > 20) { // garbage time: empty the bench
      const deep = ps.slice(5).sort((a, b) => a.target - b.target);
      this.on[k] = (deep.length >= 5 ? deep : [...deep, ...ps.slice(0, 5)]).slice(0, 5);
      return;
    }
    if (late && diff <= 8) { this.on[k] = ps.slice().sort((a, b) => b.target - a.target).slice(0, 5); return; }
    if (this.q === 3 && this.t === 720) { this.on[k] = ps.slice(0, 5); return; }
    const el = this.elapsed();
    const deficit = (p: SimPlayer) => (p.target * 60 * el) / 2880 - S.box[p.id].min * 60;
    let on = this.on[k].filter(p => ps.includes(p));
    for (const p of ps) if (on.length < 5 && !on.includes(p)) on.push(p);
    for (let guard = 0; guard < 5; guard++) {
      const bench = ps.filter(p => !on.includes(p));
      if (!bench.length) break;
      const inP = bench.reduce((a, b) => (deficit(b) > deficit(a) ? b : a));
      const outP = on.reduce((a, b) => (deficit(b) < deficit(a) ? b : a));
      if (deficit(inP) <= deficit(outP) + SUB_MARGIN) break;
      on = on.map(p => (p === outP ? inP : p));
    }
    this.on[k] = on;
  }

  step() {
    if (this.done) return;
    this.rotate('home');
    this.rotate('away');
    const offK = this.pos, defK = other(offK), O = this[offK], D = this[defK];
    const onO = this.on[offK], onD = this.on[defK];
    const U = this.opts.userSide, tac = this.opts.tactics || {}, uOff = !!U && offK === U, uDef = !!U && defK === U;
    const pbp = !!this.opts.pbp;
    const dt = Math.min(this.t, (6.5 + Math.random() * 12) * (uOff ? (tac.pace === 'Fast' ? 0.92 : tac.pace === 'Slow' ? 1.08 : 1) : 1));
    onO.forEach(p => (O.box[p.id].min += dt / 60));
    onD.forEach(p => (D.box[p.id].min += dt / 60));
    this.t -= dt;
    const qi = Math.min(this.q, 5) - 1;
    const addQ = (S: SideState, n: number) => { while (S.qs.length <= qi) S.qs.push(0); S.qs[qi] += n; };
    const time = pbp ? qName(this.q) + ' ' + fmtClock(this.t) : '';
    const ev = (text: () => string, sub?: () => string, scoring?: boolean) => {
      if (pbp) this.pbp.unshift({ side: offK, time, text: text(), sub: sub ? sub() : '', score: scoring ? this.away.pts + '–' + this.home.pts : '' });
    };
    const score = (p: SimPlayer, n: number) => { O.pts += n; addQ(O, n); O.box[p.id].pts += n; onO.forEach(x => (O.box[x.id].pm += n)); onD.forEach(x => (D.box[x.id].pm -= n)); };
    const avg = (arr: SimPlayer[], k: string) => arr.reduce((s, p) => s + p.r[k], 0) / arr.length;
    const ff = (x: SimPlayer[]) => ({ sh: avg(x, 'tp') + avg(x, 'fg'), to: avg(x, 'drb') + avg(x, 'pss'), orb: avg(x, 'reb'), ft: avg(x, 'ins') + avg(x, 'dnk') });
    const clutch = this.q >= 4 && this.t < 300 && Math.abs(this.home.pts - this.away.pts) <= 6;
    let cAdv = 0;
    if (clutch) { const u = ff(onO), v = ff(onD); cAdv = (((u.sh - v.sh) * 0.4 + (u.to - v.to) * 0.25 + (u.orb - v.orb) * 0.4 + (u.ft - v.ft) * 0.15) / 100) * 0.5; }
    const rankU = onO.slice().sort((x, y) => usg(y) - usg(x));
    const awayPen = (p: SimPlayer) => (offK === 'away' && rankU.indexOf(p) >= 2 ? (p.crowd ? 0.05 : 0.025) : 0);
    let keep = false;
    const r = Math.random();
    const h0 = wpick(onO, p => usg(p) * (p.r.drb + p.r.pss));
    if (r < 0.112 - cAdv * 0.5 + awayPen(h0) * 0.5 + (uDef && tac.def === 'Aggressive' ? 0.02 : 0)) {
      O.box[h0.id].tov++;
      if (Math.random() < 0.57) { const s2 = wpick(onD, p => p.r.diq + p.r.spd); D.box[s2.id].stl++; ev(() => s2.name + ' steals the ball from ' + h0.name, () => '(' + D.box[s2.id].stl + ' STL)'); }
      else ev(() => h0.name + (Math.random() < 0.5 ? ' loses the ball out of bounds' : ' throws it away'), () => '(' + O.box[h0.id].tov + ' TOV)');
    } else if (r < 0.2 + (clutch ? cAdv * 0.3 : 0) + (uDef && tac.def === 'Aggressive' ? 0.035 : 0)) {
      const sh = wpick(onO, p => usg(p) * (p.r.ins + p.r.dnk)), f = wpick(onD, p => 110 - p.r.diq);
      D.box[f.id].pf++;
      let made = 0;
      for (let i = 0; i < 2; i++) { O.box[sh.id].fta++; if (Math.random() < cl(0.76 + (sh.r.ft - 50) * 0.003, 0.5, 0.94)) { made++; O.box[sh.id].ftm++; } }
      if (made) score(sh, made);
      ev(() => f.name + ' fouls ' + sh.name + ' on the shot', () => sh.name + ' makes ' + made + ' of 2 free throws', made > 0);
    } else {
      const lr = (k: string) => (avg(onO, k) - 52) * 0.01;
      const W: Record<string, number> = { rim: 0.28 * (1 + (lr('dnk') + lr('ins')) / 2), mid: 0.29 * (1 + lr('fg')), c3: 0.09 * (1 + lr('tp') * 1.2), atb: 0.34 * (1 + lr('tp') * 1.2) };
      if (uOff) { const A = { Inside: { rim: 0.06, atb: -0.04, mid: -0.02 }, Perimeter: { atb: 0.06, c3: 0.02, mid: -0.05, rim: -0.03 }, 'Pace and space': { atb: 0.08, c3: 0.03, mid: -0.08, rim: -0.03 } }[tac.off] || {}; Object.keys(A).forEach(k => (W[k] += A[k])); }
      const ty = wpick(Object.keys(W), k => Math.max(0.02, W[k]));
      const aff = { rim: (p: SimPlayer) => Math.pow((p.r.dnk + p.r.ins) / 2, 1.3) * (p.grp === 'B' ? 1.3 : 1), mid: (p: SimPlayer) => Math.pow(p.r.fg, 1.3), c3: (p: SimPlayer) => Math.pow(p.r.tp, 1.6), atb: (p: SimPlayer) => Math.pow(p.r.tp, 1.6) }[ty];
      const sh = wpick(onO, p => usg(p) * aff(p) * (clutch && uOff && tac.clutch === 'Isolate the star' && p === rankU[0] ? 2.5 : 1));
      const dAdj = (avg(onD, 'diq') - 50) * 0.0015, tp = 0.28 + (sh.r.tp - 40) * 0.0025;
      const tacD = uDef ? (({ Switch: { c3: -0.01, atb: -0.01, rim: 0.01 }, Drop: { mid: 0.02, rim: -0.02 } } as any)[tac.def] || {})[ty] || 0 : 0;
      const base = { rim: 0.7 + ((sh.r.dnk + sh.r.ins) / 2 - 50) * 0.004, mid: 0.445 + (sh.r.fg - 50) * 0.003, c3: tp + 0.045, atb: tp + 0.012 }[ty] - dAdj + cAdv + (clutch && sh.clutch ? 0.03 : 0) - awayPen(sh) - (sh.adj ? 0.03 : 0) + tacD;
      const label = { rim: sh.r.dnk > 62 ? 'a dunk' : 'a layup', mid: 'a mid-range jumper', c3: 'a corner three', atb: 'a three pointer' }[ty];
      const three = ty === 'c3' || ty === 'atb', b = O.box[sh.id];
      b.fga++; if (three) b.tpa++;
      const T0 = O.tiers[ty] || [0, 0]; O.tiers[ty] = [T0[0], T0[1] + 1];
      const big = onD.reduce((x, y) => (y.r.hgt > x.r.hgt ? y : x));
      if ((ty === 'rim' && Math.random() < 0.07 + (big.r.hgt - 50) * 0.0012) || (ty === 'mid' && Math.random() < 0.02)) {
        D.box[big.id].blk++;
        ev(() => big.name + ' blocks ' + sh.name, () => '(' + D.box[big.id].blk + ' BLK)');
        keep = Math.random() < 0.35;
      } else if (Math.random() < cl(base, 0.12, 0.85)) {
        b.fgm++; if (three) b.tpm++;
        O.tiers[ty] = [O.tiers[ty][0] + 1, O.tiers[ty][1]];
        score(sh, three ? 3 : 2);
        let passer: SimPlayer | null = null;
        if (Math.random() < (three ? 0.82 : ty === 'rim' ? 0.55 : 0.45)) { passer = wpick(onO.filter(p => p.id !== sh.id), p => Math.pow(p.r.pss, 5)); O.box[passer.id].ast++; }
        ev(() => sh.name + ' makes ' + label + ' (' + O.box[sh.id].pts + ' PTS)', () => (passer ? 'Assisted by ' + passer.name + ' (' + O.box[passer.id].ast + ' AST)' : ''), true);
      } else {
        const orb = Math.random() < 0.252 + (avg(onO, 'reb') - avg(onD, 'reb')) * 0.003 + cAdv * 0.3;
        const rb = orb ? wpick(onO, p => p.r.reb * p.r.reb) : wpick(onD, p => p.r.reb * p.r.reb);
        const S = orb ? O : D;
        if (orb) { O.box[rb.id].orb++; keep = true; } else D.box[rb.id].drb++;
        ev(() => sh.name + ' misses ' + label, () => rb.name + ' grabs the ' + (orb ? 'offensive' : 'defensive') + ' rebound (' + (S.box[rb.id].orb + S.box[rb.id].drb) + ' REB)');
      }
    }
    if (!keep) this.pos = defK;
    if (this.t <= 0) {
      if (this.q >= 4 && this.home.pts !== this.away.pts) {
        this.done = true;
        if (pbp) this.pbp.unshift({ side: this.home.pts > this.away.pts ? 'home' : 'away', time: 'Final', text: 'Final: ' + this.teams.away.abbr + ' ' + this.away.pts + ', ' + this.teams.home.abbr + ' ' + this.home.pts, sub: '', score: '' });
      } else {
        if (pbp) this.pbp.unshift({ side: offK, time: qName(this.q) + ' 0:00', text: 'End of ' + (this.q <= 4 ? 'quarter ' + this.q : 'overtime'), sub: '', score: '' });
        this.q++;
        this.t = this.q > 4 ? 300 : 720;
      }
    }
    if (this.pbp.length > 220) this.pbp.length = 220;
  }

  run() { let guard = 0; while (!this.done && guard++ < 5000) this.step(); return this.result(); }

  result(): GameResult {
    const pack = (k: Side) => ({ tid: this.teams[k].tid, pts: this[k].pts, qs: this[k].qs.slice(), box: this[k].box });
    return { home: pack('home'), away: pack('away'), ot: Math.max(0, this.q - 4) };
  }
}

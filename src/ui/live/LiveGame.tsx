// Possession-by-possession game viewer and engine (HANDOFF.md, "Live Game").
// Ported from the prototype's Live Game.dc.html.
import { Component } from 'react';
import { LiveGameView } from './LiveGameView';

export interface LiveTeam { tid: number; name: string; abbr: string; rec: string; players: any[] }
export interface LiveGameProps {
  home: LiveTeam;
  away: LiveTeam;
  userSide: 'home' | 'away';
  tactics: any;
  onFinish: (r: { us: number; them: number; win: boolean }) => void;
  onPlayer: (id: number) => void;
  onTeam: (tid: number) => void;
}

export class LiveGame extends Component<LiveGameProps, any> {
  tm: ReturnType<typeof setTimeout> | undefined;
  state = this.init();
  init() {
    const blank = () => ({ min: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, pm: 0 });
    const side = t => ({ pts: 0, qs: [0, 0, 0, 0], box: Object.fromEntries((t?.players || []).map(p => [p.id, blank()])) });
    return { q: 1, t: 720, home: side(this.props.home), away: side(this.props.away), pos: Math.random() < .5 ? 'home' : 'away', pbp: [], running: true, speed: 3, done: false };
  }
  componentDidMount() { this.loop(); }
  componentWillUnmount() { clearTimeout(this.tm); }
  loop() { clearTimeout(this.tm); if (!this.state.running || this.state.done) return; this.tm = setTimeout(() => { this.step(); this.loop(); }, [1400, 800, 420, 160, 40][this.state.speed - 1]); }
  lineup(sd, st) {
    const ps = this.props[sd].players, S = ps.slice(0, 5), B = ps.slice(5, 10);
    const diff = Math.abs(st.home.pts - st.away.pts), q = st.q, t = st.t;
    if (q >= 4 && t < 300 && diff > 20) return B.length >= 5 ? B : S;
    const mix = [S[0], S[1], B[0], B[1], B[2]].filter(Boolean);
    const benchTime = (q === 1 || q === 3) ? t < 240 : q === 2 ? t > 480 : q === 4 ? t > 540 : false;
    return benchTime && mix.length === 5 ? mix : S;
  }
  wpick(arr, w) { const tot = arr.reduce((a, x) => a + w(x), 0); let r = Math.random() * tot; for (const x of arr) { r -= w(x); if (r <= 0) return x; } return arr[0]; }
  fmt(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
  qName(q) { return q <= 4 ? 'Q' + q : 'OT' + (q > 5 ? q - 4 : ''); }
  cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  step() {
    this.setState(st0 => {
      if (st0.done) return null;
      const cp = S => ({ ...S, qs: S.qs.slice(), box: { ...S.box }, tiers: { ...(S.tiers || {}) } });
      const st = { ...st0, home: cp(st0.home), away: cp(st0.away), pbp: st0.pbp.slice() };
      const offK = st.pos, defK = offK === 'home' ? 'away' : 'home', O = st[offK], D = st[defK];
      const onO = this.lineup(offK, st), onD = this.lineup(defK, st);
      const U = this.props.userSide || 'home', tac = this.props.tactics || {}, uOff = offK === U;
      const dt = Math.min(st.t, (6.5 + Math.random() * 12) * (uOff ? (tac.pace === 'Fast' ? .92 : tac.pace === 'Slow' ? 1.08 : 1) : 1));
      const bx = (S, id) => (S.box[id] = { ...S.box[id] });
      onO.forEach(p => bx(O, p.id).min += dt / 60); onD.forEach(p => bx(D, p.id).min += dt / 60);
      st.t -= dt;
      const qi = Math.min(st.q, 5) - 1;
      const addQ = (S, n) => { while (S.qs.length <= qi) S.qs.push(0); S.qs[qi] += n; };
      const time = this.qName(st.q) + ' ' + this.fmt(st.t);
      const ev = (text, sub?, scoring?) => st.pbp.unshift({ side: offK, time, text, sub: sub || '', score: scoring ? st.away.pts + '–' + st.home.pts : '' });
      const score = (p, n) => { O.pts += n; addQ(O, n); bx(O, p.id).pts += n; onO.forEach(x => bx(O, x.id).pm += n); onD.forEach(x => bx(D, x.id).pm -= n); };
      const avg = (arr, k) => arr.reduce((s, p) => s + p.r[k], 0) / arr.length;
      const usg = p => Math.pow(Math.max(5, p.ovr - 30), 1.7) * (1 + (p.r.oiq - 50) / 200);
      const ff = x => ({ sh: avg(x, 'tp') + avg(x, 'fg'), to: avg(x, 'drb') + avg(x, 'pss'), orb: avg(x, 'reb'), ft: avg(x, 'ins') + avg(x, 'dnk') });
      const clutch = st.q >= 4 && st.t < 300 && Math.abs(st.home.pts - st.away.pts) <= 6;
      let cAdv = 0; if (clutch) { const u = ff(onO), v = ff(onD); cAdv = ((u.sh - v.sh) * .4 + (u.to - v.to) * .25 + (u.orb - v.orb) * .4 + (u.ft - v.ft) * .15) / 100 * .5; }
      const rankU = onO.slice().sort((x, y) => usg(y) - usg(x));
      const awayPen = p => offK === 'away' && rankU.indexOf(p) >= 2 ? (p.crowd ? .05 : .025) : 0;
      let keep = false; const r = Math.random();
      const h0 = this.wpick(onO, p => usg(p) * (p.r.drb + p.r.pss));
      if (r < .112 - cAdv * .5 + awayPen(h0) * .5 + (!uOff && tac.def === 'Aggressive' ? .02 : 0)) {
        bx(O, h0.id).tov++;
        if (Math.random() < .57) { const s2 = this.wpick(onD, p => p.r.diq + p.r.spd); bx(D, s2.id).stl++; ev(s2.name + ' steals the ball from ' + h0.name, '(' + D.box[s2.id].stl + ' STL)'); }
        else ev(h0.name + (Math.random() < .5 ? ' loses the ball out of bounds' : ' throws it away'), '(' + O.box[h0.id].tov + ' TOV)');
      } else if (r < .2 + (clutch ? cAdv * .3 : 0) + (!uOff && tac.def === 'Aggressive' ? .035 : 0)) {
        const sh = this.wpick(onO, p => usg(p) * (p.r.ins + p.r.dnk)), f = this.wpick(onD, p => 110 - p.r.diq); bx(D, f.id).pf++;
        let made = 0; for (let i = 0; i < 2; i++) { bx(O, sh.id).fta++; if (Math.random() < this.cl(.76 + (sh.r.ft - 50) * .003, .5, .94)) { made++; bx(O, sh.id).ftm++; } }
        if (made) score(sh, made);
        ev(f.name + ' fouls ' + sh.name + ' on the shot', sh.name + ' makes ' + made + ' of 2 free throws', made > 0);
      } else {
        const lr = k => (avg(onO, k) - 52) * .01;
        const W = { rim: .28 * (1 + (lr('dnk') + lr('ins')) / 2), mid: .29 * (1 + lr('fg')), c3: .09 * (1 + lr('tp') * 1.2), atb: .34 * (1 + lr('tp') * 1.2) };
        if (uOff) { const A = { Inside: { rim: .06, atb: -.04, mid: -.02 }, Perimeter: { atb: .06, c3: .02, mid: -.05, rim: -.03 }, 'Pace and space': { atb: .08, c3: .03, mid: -.08, rim: -.03 } }[tac.off] || {}; Object.keys(A).forEach(k => W[k] += A[k]); }
        const ty = this.wpick(Object.keys(W), k => Math.max(.02, W[k]));
        const aff = { rim: p => Math.pow((p.r.dnk + p.r.ins) / 2, 2) * (p.grp === 'B' ? 1.3 : 1), mid: p => Math.pow(p.r.fg, 2), c3: p => Math.pow(p.r.tp, 2.4), atb: p => Math.pow(p.r.tp, 2.4) }[ty];
        const sh = this.wpick(onO, p => usg(p) * aff(p) * (clutch && uOff && tac.clutch === 'Isolate the star' && p === rankU[0] ? 2.5 : 1));
        const dAdj = (avg(onD, 'diq') - 50) * .0015, tp = .28 + (sh.r.tp - 40) * .0025;
        const base = { rim: .70 + ((sh.r.dnk + sh.r.ins) / 2 - 50) * .004, mid: .445 + (sh.r.fg - 50) * .003, c3: tp + .045, atb: tp + .012 }[ty] - dAdj + cAdv + (clutch && sh.clutch ? .03 : 0) - awayPen(sh) - (sh.adj ? .03 : 0) + (!uOff ? (((({ Switch: { c3: -.01, atb: -.01, rim: .01 }, Drop: { mid: .02, rim: -.02 } })[tac.def] || {})[ty]) || 0) : 0);
        const label = { rim: sh.r.dnk > 62 ? 'a dunk' : 'a layup', mid: 'a mid-range jumper', c3: 'a corner three', atb: 'a three pointer' }[ty];
        const three = ty === 'c3' || ty === 'atb', b = bx(O, sh.id); b.fga++; if (three) b.tpa++;
        const T0 = O.tiers[ty] || [0, 0]; O.tiers[ty] = [T0[0], T0[1] + 1];
        const big = onD.slice().sort((x, y) => y.r.hgt - x.r.hgt)[0];
        if ((ty === 'rim' && Math.random() < .07 + (big.r.hgt - 50) * .0012) || (ty === 'mid' && Math.random() < .02)) {
          bx(D, big.id).blk++; ev(big.name + ' blocks ' + sh.name, '(' + D.box[big.id].blk + ' BLK)'); keep = Math.random() < .35;
        } else if (Math.random() < this.cl(base, .12, .85)) {
          b.fgm++; if (three) b.tpm++; O.tiers[ty] = [O.tiers[ty][0] + 1, O.tiers[ty][1]];
          score(sh, three ? 3 : 2);
          let sub = '';
          if (Math.random() < (three ? .82 : ty === 'rim' ? .55 : .45)) { const mates = onO.filter(p => p.id !== sh.id); const x = this.wpick(mates, p => p.r.pss * p.r.pss); bx(O, x.id).ast++; sub = 'Assisted by ' + x.name + ' (' + O.box[x.id].ast + ' AST)'; }
          ev(sh.name + ' makes ' + label + ' (' + O.box[sh.id].pts + ' PTS)', sub, true);
        } else {
          const orb = Math.random() < .252 + (avg(onO, 'reb') - avg(onD, 'reb')) * .003 + cAdv * .3;
          const rb = orb ? this.wpick(onO, p => p.r.reb * p.r.reb) : this.wpick(onD, p => p.r.reb * p.r.reb);
          if (orb) { bx(O, rb.id).orb++; keep = true; } else bx(D, rb.id).drb++;
          const S = orb ? O : D;
          ev(sh.name + ' misses ' + label, rb.name + ' grabs the ' + (orb ? 'offensive' : 'defensive') + ' rebound (' + (S.box[rb.id].orb + S.box[rb.id].drb) + ' REB)');
        }
      }
      if (!keep) st.pos = defK;
      if (st.t <= 0) {
        if (st.q >= 4 && st.home.pts !== st.away.pts) { st.done = true; st.running = false; st.pbp.unshift({ side: st.home.pts > st.away.pts ? 'home' : 'away', time: 'Final', text: 'Final: ' + this.props.away.abbr + ' ' + st.away.pts + ', ' + this.props.home.abbr + ' ' + st.home.pts, sub: '', score: '' }); }
        else { st.pbp.unshift({ side: offK, time: this.qName(st.q) + ' 0:00', text: 'End of ' + (st.q <= 4 ? 'quarter ' + st.q : 'overtime'), sub: '', score: '' }); st.q++; st.t = st.q > 4 ? 300 : 720; }
      }
      if (st.pbp.length > 220) st.pbp.length = 220;
      return st;
    });
  }
  toEnd() { clearTimeout(this.tm); let guard = 0; const run = () => { for (let i = 0; i < 30 && !this.state.done && guard < 2000; i++, guard++) this.step(); if (!this.state.done && guard < 2000) setTimeout(run, 0); }; this.setState({ running: false }, run); }
  render() {
    return <LiveGameView vm={this.view()} />;
  }
  view() {
    const s = this.state, H: any = this.props.home || { players: [] }, A: any = this.props.away || { players: [] };
    const pctS = (m, a) => a ? (m / a * 100).toFixed(1) + '%' : '—';
    const side = (k, T) => {
      const on = new Set(s.done ? [] : this.lineup(k, s).map(p => p.id)), S = s[k];
      const rows = T.players.map((p, i) => { const b = S.box[p.id] || {}; return { open: () => this.props.onPlayer && this.props.onPlayer(p.id), name: p.name, pos: p.pos, flag: p.flag, min: b.min ? this.fmt(b.min * 60) : '—', fg: b.fgm + '-' + b.fga, tp: b.tpm + '-' + b.tpa, ft: b.ftm + '-' + b.fta, orb: b.orb, trb: b.orb + b.drb, ast: b.ast, tov: b.tov, stl: b.stl, blk: b.blk, pf: b.pf, pts: b.pts, pm: (b.pm > 0 ? '+' : '') + b.pm, bg: on.has(p.id) ? 'var(--color-accent-100)' : 'transparent', line: i === 4 ? '1px solid var(--color-text)' : '1px solid var(--color-divider)' }; });
      const sum = key => (Object.values(S.box) as any[]).reduce((a, b) => a + b[key], 0);
      const tr = S.tiers || {}, tf = k => (tr[k] || [0, 0]).join('-');
      return { open: () => this.props.onTeam && this.props.onTeam(T.tid), name: T.name, rows, zones: 'Rim ' + tf('rim') + ' · Mid-range ' + tf('mid') + ' · Corner 3 ' + tf('c3') + ' · Above-the-break 3 ' + tf('atb'), tot: { fg: sum('fgm') + '-' + sum('fga'), tp: sum('tpm') + '-' + sum('tpa'), ft: sum('ftm') + '-' + sum('fta'), orb: sum('orb'), trb: sum('orb') + sum('drb'), ast: sum('ast'), tov: sum('tov'), stl: sum('stl'), blk: sum('blk'), pf: sum('pf'), pts: S.pts, fgp: pctS(sum('fgm'), sum('fga')), tpp: pctS(sum('tpm'), sum('tpa')), ftp: pctS(sum('ftm'), sum('fta')) } };
    };
    const nq = Math.max(4, s.home.qs.length, s.away.qs.length);
    const pad = a => { const x = a.slice(); while (x.length < nq) x.push(''); return x.map((v, i) => (i < Math.min(s.q, 5) || s.done) ? v : ''); };
    const userSide = this.props.userSide || 'home';
    const win = s.home.pts > s.away.pts ? 'home' : 'away';
    return {
      home: { open: () => this.props.onTeam && this.props.onTeam(H.tid), name: H.name, abbr: H.abbr, rec: H.rec, pts: s.home.pts, qs: pad(s.home.qs) }, away: { open: () => this.props.onTeam && this.props.onTeam(A.tid), name: A.name, abbr: A.abbr, rec: A.rec, pts: s.away.pts, qs: pad(s.away.qs) },
      qLabels: Array.from({ length: nq }, (_, i) => i < 4 ? String(i + 1) : 'OT'),
      clock: s.done ? 'Final' + (s.q > 5 ? ' / OT' : '') : this.qName(s.q) + ' · ' + this.fmt(s.t),
      sides: [side('away', A), side('home', H)],
      pbp: s.pbp.map(e => ({ ...e, abbr: e.side === 'home' ? H.abbr : A.abbr, color: e.side === userSide ? 'var(--color-accent-700)' : 'var(--color-neutral-700)', fw: e.time === 'Final' ? 600 : 400 })),
      notDone: !s.done, done: s.done, runLabel: s.running ? 'Pause' : 'Play', speed: s.speed,
      finalLine: (win === userSide ? 'Win' : 'Loss') + ', ' + Math.max(s.home.pts, s.away.pts) + '–' + Math.min(s.home.pts, s.away.pts),
      toggle: () => this.setState(x => ({ running: !x.running }), () => this.loop()),
      stepOne: () => { clearTimeout(this.tm); this.setState({ running: false }, () => this.step()); },
      toEnd: () => this.toEnd(),
      setSpeed: e => { const v = +e.target.value; this.setState({ speed: v }, () => this.loop()); },
      finish: () => { const us = s[userSide].pts, them = s[userSide === 'home' ? 'away' : 'home'].pts; this.props.onFinish && this.props.onFinish({ us, them, win: us > them }); }
    };
  }
}

// Live Game viewer (HANDOFF.md, "Live Game"). Steps the shared engine on a timer;
// the finished game is handed back whole, so its box score counts like any other.
import { Component, type ReactNode } from 'react';
import { fmtClock, GameSim, qName, type GameResult, type Norms, type Side, type SimTeam } from '../../engine/sim';
import { LiveGameView } from './LiveGameView';

export interface LiveGameProps {
  home: SimTeam;
  away: SimTeam;
  userSide: Side;
  norms?: Norms;
  logos?: { home: ReactNode; away: ReactNode; homeSm: ReactNode; awaySm: ReactNode };
  onFinish: (r: GameResult) => void;
  onPlayer: (id: number) => void;
  onTeam: (tid: number) => void;
}

const DELAY = [1400, 800, 420, 160, 40];

export class LiveGame extends Component<LiveGameProps, { running: boolean; speed: number; tick: number }> {
  sim = new GameSim(this.props.home, this.props.away, { pbp: true, norms: this.props.norms });
  tm: ReturnType<typeof setTimeout> | undefined;
  state = { running: true, speed: 3, tick: 0 };

  componentDidMount() { this.loop(); }
  componentWillUnmount() { clearTimeout(this.tm); }

  loop() {
    clearTimeout(this.tm);
    if (!this.state.running || this.sim.done) return;
    this.tm = setTimeout(() => { this.step(); this.loop(); }, DELAY[this.state.speed - 1]);
  }
  step() {
    if (this.sim.done) return;
    this.sim.step();
    this.setState(x => ({ tick: x.tick + 1, running: x.running && !this.sim.done }));
  }
  toEnd() {
    clearTimeout(this.tm);
    this.sim.run();
    this.setState(x => ({ running: false, tick: x.tick + 1 }));
  }

  render() {
    return <LiveGameView vm={this.view()} />;
  }

  view() {
    const s = this.sim, H = this.props.home, A = this.props.away, lg = this.props.logos;
    const pctS = (m, a) => (a ? ((m / a) * 100).toFixed(1) + '%' : '—');
    const side = (k: Side, T: SimTeam) => {
      const on = new Set(s.done ? [] : s.on[k].map(p => p.id)), S = s[k];
      const rows = T.players.map((p, i) => { const b = S.box[p.id]; return { open: () => this.props.onPlayer(p.id), name: p.name, pos: p.pos, flag: p.flag, min: b.min ? fmtClock(b.min * 60) : '—', fg: b.fgm + '-' + b.fga, tp: b.tpm + '-' + b.tpa, ft: b.ftm + '-' + b.fta, orb: b.orb, trb: b.orb + b.drb, ast: b.ast, tov: b.tov, stl: b.stl, blk: b.blk, pf: b.pf, pts: b.pts, pm: (b.pm > 0 ? '+' : '') + b.pm, bg: on.has(p.id) ? 'var(--color-accent-100)' : 'transparent', line: i === 4 ? '1px solid var(--color-text)' : '1px solid var(--color-divider)' }; });
      const sum = key => Object.values(S.box).reduce((a, b) => a + b[key], 0);
      const tf = k => (S.tiers[k] || [0, 0]).join('-');
      return { open: () => this.props.onTeam(T.tid), name: T.name, small: lg?.[k === 'home' ? 'homeSm' : 'awaySm'], rows, zones: 'Rim ' + tf('rim') + ' · Mid-range ' + tf('mid') + ' · Corner 3 ' + tf('c3') + ' · Above-the-break 3 ' + tf('atb'), tot: { fg: sum('fgm') + '-' + sum('fga'), tp: sum('tpm') + '-' + sum('tpa'), ft: sum('ftm') + '-' + sum('fta'), orb: sum('orb'), trb: sum('orb') + sum('drb'), ast: sum('ast'), tov: sum('tov'), stl: sum('stl'), blk: sum('blk'), pf: sum('pf'), pts: S.pts, fgp: pctS(sum('fgm'), sum('fga')), tpp: pctS(sum('tpm'), sum('tpa')), ftp: pctS(sum('ftm'), sum('fta')) } };
    };
    const nq = Math.max(4, s.home.qs.length, s.away.qs.length);
    const pad = (a: number[]) => { const x: (number | string)[] = a.slice(); while (x.length < nq) x.push(''); return x.map((v, i) => (i < Math.min(s.q, 5) || s.done ? v : '')); };
    const userSide = this.props.userSide;
    const win = s.home.pts > s.away.pts ? 'home' : 'away';
    const team = (k: Side, T: SimTeam) => ({ open: () => this.props.onTeam(T.tid), name: T.name, abbr: T.abbr, rec: T.rec, logo: lg?.[k], pts: s[k].pts, qs: pad(s[k].qs) });
    return {
      home: team('home', H), away: team('away', A),
      qLabels: Array.from({ length: nq }, (_, i) => (i < 4 ? String(i + 1) : 'OT')),
      clock: s.done ? 'Final' + (s.q > 4 ? ' / OT' : '') : qName(s.q) + ' · ' + fmtClock(s.t),
      sides: [side('away', A), side('home', H)],
      pbp: s.pbp.map(e => ({ ...e, abbr: e.side === 'home' ? H.abbr : A.abbr, color: e.side === userSide ? 'var(--color-accent-700)' : 'var(--color-neutral-700)', fw: e.time === 'Final' ? 600 : 400 })),
      notDone: !s.done, done: s.done, runLabel: this.state.running ? 'Pause' : 'Play', speed: this.state.speed,
      finalLine: (win === userSide ? 'Win' : 'Loss') + ', ' + Math.max(s.home.pts, s.away.pts) + '–' + Math.min(s.home.pts, s.away.pts),
      toggle: () => this.setState(x => ({ running: !x.running }), () => this.loop()),
      stepOne: () => { clearTimeout(this.tm); this.setState({ running: false }, () => this.step()); },
      toEnd: () => this.toEnd(),
      setSpeed: e => { const v = +e.target.value; this.setState({ speed: v }, () => this.loop()); },
      finish: () => this.props.onFinish(s.result()),
    };
  }
}

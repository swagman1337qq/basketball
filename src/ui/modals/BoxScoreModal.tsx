import { useBoxScore } from '../useBoxScore';
// A game's box score, as a full page: the score by quarter and every player's line for both teams.
// Opened by clicking a result (Dashboard, Schedule, Playoffs). ← Back returns to where you were;
// the arrows (or ← → keys) step through the same team's games in order: regular season, play-in,
// playoffs. Kept for the current season.
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { VM } from '../vm';
import { Game } from '../../engine/Game';
import { Link, muted, Seg } from '../kit';
import { BoxScoreDetails, FourFactors, periodBox, periodNumbers } from './BoxScoreDetails';
import './BoxScore.css';
import { useAlignedTables } from '../useAlignedTables';

const F = Game.BOX_F; // min, pts, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl, blk, tov, pf, pm, gs
const at = (l: number[], k: string) => l[1 + F.indexOf(k)];
let backScroll = 0;
const KIND: Record<string, string> = { reg: 'Regular season', playin: 'Play-in', po: 'Playoffs' };

export function BoxScoreModal({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx,
    P = gm.db.P;
  const { box: bx, loading: detailsLoading, error: detailsError, retry: retryDetails } = useBoxScore(gm, vm.save.id, s.boxId);
  const main = () => document.querySelector('main');
  // Remember where you were on the page underneath, and put you back there on ← Back.
  useLayoutEffect(() => {
    backScroll = main()?.scrollTop || 0;
    main()?.scrollTo(0, 0);
  }, []);
  const close = () => {
    const y = backScroll;
    gm.setState({ boxId: null, boxTeam: null });
    setTimeout(() => main()?.scrollTo(0, y), 0);
  };
  // Whose games the arrows follow: the team you came in with, else yours if you played, else the home team.
  const all = (gm.db as any).boxes || {},
    inGame = (tid: number) => bx && (bx.home.tid === tid || bx.away.tid === tid);
  const focus: number | null = !bx
    ? null
    : s.boxTeam != null && inGame(s.boxTeam)
      ? s.boxTeam
      : vm.ctx.isMine(bx.home.tid)
        ? bx.home.tid
        : vm.ctx.isMine(bx.away.tid)
          ? bx.away.tid
          : bx.home.tid;
  const seq = (id: string) => +String(id).split('-')[1] || 0;
  const games =
    focus == null
      ? []
      : Object.keys(all)
          .filter(id => all[id].season === bx.season && (all[id].home.tid === focus || all[id].away.tid === focus))
          .sort((a, b) => seq(a) - seq(b));
  const idx = games.indexOf(s.boxId),
    prev = idx > 0 ? games[idx - 1] : null,
    next = idx >= 0 && idx < games.length - 1 ? games[idx + 1] : null;
  const go = (id: string | null) => {
    if (id) {
      gm.setState({ boxId: id, boxTeam: focus });
      document.querySelector('main')?.scrollTo(0, 0);
    }
  };
  const nOf = (id: string) => {
    const k = all[id].kind;
    return games.filter(g => all[g].kind === k && seq(g) <= seq(id)).length;
  };
  const label = (id: string | null) =>
    id ? (all[id].kind === 'po' ? 'Playoff game ' : all[id].kind === 'playin' ? 'Play-in game ' : 'Game ') + nOf(id) : '';
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') go(prev);
      if (e.key === 'ArrowRight') go(next);
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const [mode, setModeS] = useState<'trad' | 'adv' | 'both'>(() => {
    try {
      return (localStorage.getItem('boxMode') as any) || 'trad';
    } catch {
      return 'trad';
    }
  });
  const setMode = (m: 'trad' | 'adv' | 'both') => {
    setModeS(m);
    try {
      localStorage.setItem('boxMode', m);
    } catch {
      /* private mode */
    }
  };
  const [tab, setTab] = useState('box');
  const [period, setPeriod] = useState('Game');
  const tablesRef = useRef<HTMLDivElement>(null);
  useAlignedTables(tablesRef, [bx, mode, period, tab]);
  useEffect(() => {
    setPeriod('Game');
  }, [s.boxId]);
  if (!bx) return null;
  const periodUnavailable = period !== 'Game' && !bx.details?.periods?.length;
  const selected = periodBox(bx, period);
  const visitTeam = (tid: number) => {
    close();
    openTeam(tid);
  };
  const visitPlayer = (pid: number) => {
    close();
    open(pid);
  };
  const sides = [bx.away, bx.home],
    per = Math.max(bx.home.qs?.length || 0, bx.away.qs?.length || 0);
  const date = gm.fmtS(bx.day);
  const th = (t: string, left?: boolean) => (
    <th key={t} style={{ padding: '4px 6px', textAlign: left ? 'left' : 'right', whiteSpace: 'nowrap' }}>
      {t}
    </th>
  );
  const td = (v: any, extra?: any) => (
    <td style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...extra }}>{v}</td>
  );
  // Traditional, advanced (worked out from this game's box: Basketball-Reference formulas) or both.
  const team = (sd: any) => {
    const op = sd.tid === selected.home.tid ? selected.away : selected.home;
    const lines = sd.lines.slice().sort((a: number[], b: number[]) => at(b, 'gs') - at(a, 'gs') || at(b, 'min') - at(a, 'min'));
    const sumOf = (ls: number[][], k: string) => ls.reduce((a: number, l: number[]) => a + at(l, k), 0);
    const sum = (k: string) => sumOf(lines, k),
      osum = (k: string) => sumOf(op.lines, k);
    const pct = (m: number, a: number) => (a ? ((m / a) * 100).toFixed(0) + '%' : '—');
    const T5 = Math.max(1, sum('min')) / 5,
      oPoss = osum('fga') + 0.44 * osum('fta') - osum('orb') + osum('tov');
    const p1 = (x: number) => (isFinite(x) ? x.toFixed(1) : '—'),
      pc = (x: number) => (isFinite(x) ? (x * 100).toFixed(1) : '—');
    // One player's (or the team's, with min = team minutes) advanced line.
    const adv = (g: (k: string) => number) => {
      const min = g('min'),
        share = g === TEAM ? 1 : min ? T5 / min : 0; // the team row is the whole team: no per-player scaling
      return {
        ts: g('fga') + g('fta') ? g('pts') / (2 * (g('fga') + 0.44 * g('fta'))) : NaN,
        efg: g('fga') ? (g('fgm') + 0.5 * g('tpm')) / g('fga') : NaN,
        tpar: g('fga') ? g('tpa') / g('fga') : NaN,
        ftr: g('fga') ? g('fta') / g('fga') : NaN,
        orb: min ? (g('orb') * share) / (sum('orb') + osum('drb')) : NaN,
        drb: min ? (g('drb') * share) / (sum('drb') + osum('orb')) : NaN,
        trb: min ? ((g('orb') + g('drb')) * share) / (sum('orb') + sum('drb') + osum('orb') + osum('drb')) : NaN,
        ast: min && g !== TEAM ? g('ast') / ((min / T5) * sum('fgm') - g('fgm')) : sum('ast') / Math.max(1, sum('fgm')),
        stl: min ? (g('stl') * share) / Math.max(1, oPoss) : NaN,
        blk: min ? (g('blk') * share) / Math.max(1, osum('fga') - osum('tpa')) : NaN,
        tov: g('fga') + g('fta') + g('tov') ? g('tov') / (g('fga') + 0.44 * g('fta') + g('tov')) : NaN,
        usg: min && g !== TEAM ? ((g('fga') + 0.44 * g('fta') + g('tov')) * share) / (sum('fga') + 0.44 * sum('fta') + sum('tov')) : 1,
        gmsc:
          g('pts') +
          0.4 * g('fgm') -
          0.7 * g('fga') -
          0.4 * (g('fta') - g('ftm')) +
          0.7 * g('orb') +
          0.3 * g('drb') +
          g('stl') +
          0.7 * g('ast') +
          0.7 * g('blk') -
          0.4 * g('pf') -
          g('tov'),
      };
    };
    const TEAM = (k: string) => sum(k);
    type Col = [string, (g: (k: string) => number, a: any, isTeam: boolean) => any, any?];
    const TRAD: Col[] = [
      ['PTS', g => g('pts')],
      ['REB', g => g('orb') + g('drb')],
      ['AST', g => g('ast')],
      ['STL', g => g('stl')],
      ['BLK', g => g('blk')],
      ['TO', g => g('tov')],
      ['FG', g => g('fgm') + '-' + g('fga')],
      ['3P', g => g('tpm') + '-' + g('tpa')],
      ['FT', g => g('ftm') + '-' + g('fta')],
      ['OREB', g => g('orb')],
      ['PF', g => g('pf')],
    ];
    const ADV: Col[] = [
      ['TS%', (g, a) => pc(a.ts)],
      ['eFG%', (g, a) => pc(a.efg)],
      ['3PAr', (g, a) => pc(a.tpar)],
      ['FTr', (g, a) => pc(a.ftr)],
      ['ORB%', (g, a) => pc(a.orb)],
      ['DRB%', (g, a) => pc(a.drb)],
      ['TRB%', (g, a) => pc(a.trb)],
      ['AST%', (g, a) => pc(a.ast)],
      ['STL%', (g, a) => pc(a.stl)],
      ['BLK%', (g, a) => pc(a.blk)],
      ['TOV%', (g, a) => pc(a.tov)],
      ['USG%', (g, a, tm) => (tm ? '' : pc(a.usg))],
      ['GmSc', (g, a) => p1(a.gmsc), { fontWeight: 600 }],
    ];
    const cols: Col[] = [
      [
        'MIN',
        (g, a, tm) => {
          const seconds = Math.round(g('min') * 60);
          return tm ? '' : Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
        },
      ],
      ...(mode !== 'adv' ? TRAD : [['PTS', (g: any) => g('pts')] as Col]),
      ...(mode !== 'trad' ? ADV : []),
      ['+/−', (g, a, tm) => (tm ? '' : (g('pm') > 0 ? '+' : '') + g('pm')), undefined],
    ];
    const pmColor = (v: number) => ({ color: v > 0 ? 'var(--gm-good)' : v < 0 ? 'var(--gm-bad)' : undefined });
    // The game leader in each stat (both teams) is in bold: the number, not the player.
    const LEADK: Record<string, (g: (k: string) => number) => number> = {
      MIN: g => g('min'),
      PTS: g => g('pts'),
      REB: g => g('orb') + g('drb'),
      AST: g => g('ast'),
      STL: g => g('stl'),
      BLK: g => g('blk'),
      TO: g => g('tov'),
      PF: g => g('pf'),
      OREB: g => g('orb'),
      FG: g => g('fgm'),
      '3P': g => g('tpm'),
      FT: g => g('ftm'),
      '+/−': g => g('pm'),
    };
    const allLines = [...selected.home.lines, ...selected.away.lines],
      gameMax: Record<string, number> = {};
    Object.entries(LEADK).forEach(([k, f]) => (gameMax[k] = Math.max(...allLines.map((l: number[]) => f(x => at(l, x))))));
    const isLead = (c: string, g: (k: string) => number) => !!LEADK[c] && gameMax[c] > 0 && LEADK[c](g) === gameMax[c];
    return (
      <section key={sd.tid} className="box-team-table">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0 6px' }}>
          {logo(sd.tid, 24)}
          <Link
            onClick={() => {
              close();
              openTeam(sd.tid);
            }}
            style={{ fontWeight: 600, fontSize: '23px' }}
          >
            {T[sd.tid].region} {T[sd.tid].name}
          </Link>
          <span style={{ ...muted }}>{sd.pts}</span>
        </div>
        <table className="table box-stat-table" data-align-columns style={{ fontSize: '12.5px' }}>
          <thead>
            <tr>
              {th('Player', true)}
              {cols.map(c => th(c[0]))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l: number[], i: number) => {
              const p = P[l[0]],
                starter = at(l, 'gs') > 0,
                g = (k: string) => at(l, k),
                a = adv(g);
              return (
                <Fragment key={l[0]}>
                  {i > 0 && !starter && at(lines[i - 1], 'gs') > 0 && (
                    <tr aria-hidden>
                      <td colSpan={cols.length + 1} style={{ padding: 0, height: 0, borderTop: '3px solid var(--color-accent-700)' }} />
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                      {p && (
                        <img
                          src={gm.flag(p.rep)}
                          alt=""
                          title={gm.db.C[p.rep]?.n}
                          style={{
                            width: 16,
                            height: 11,
                            objectFit: 'cover',
                            outline: '1px solid var(--color-divider)',
                            marginRight: 6,
                            verticalAlign: 'middle',
                          }}
                        />
                      )}
                      {p ? (
                        <Link
                          onClick={() => {
                            close();
                            open(l[0]);
                          }}
                          style={{ fontWeight: starter ? 700 : 400 }}
                        >
                          {p.name}
                        </Link>
                      ) : (
                        'Unknown'
                      )}{' '}
                      <span style={{ ...muted, fontSize: '11px' }}>{p?.pos}</span>
                    </td>
                    {cols.map(c => (
                      <td
                        key={c[0]}
                        title={isLead(c[0], g) ? 'Game high' : undefined}
                        style={{
                          padding: '4px 6px',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                          ...(c[2] || {}),
                          ...(c[0] === '+/−' ? pmColor(g('pm')) : {}),
                          ...(isLead(c[0], g) ? { fontWeight: 800 } : {}),
                        }}
                      >
                        {c[1](g, a, false)}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
            {(() => {
              const a = adv(TEAM);
              return (
                <>
                  <tr style={{ borderTop: '2px solid var(--color-text)', fontWeight: 600 }}>
                    <td style={{ padding: '4px 6px' }}>Team</td>
                    {cols.map(c => (
                      <td
                        key={c[0]}
                        style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {c[1](TEAM, a, true)}
                      </td>
                    ))}
                  </tr>
                  {mode !== 'adv' && (
                    <tr style={{ ...muted, fontSize: '11.5px' }}>
                      {cols.concat([]).reduce(
                        (acc: any[], c, i) => {
                          acc.push(
                            <td key={i} style={{ padding: '2px 6px', textAlign: 'right' }}>
                              {c[0] === 'FG'
                                ? pct(sum('fgm'), sum('fga'))
                                : c[0] === '3P'
                                  ? pct(sum('tpm'), sum('tpa'))
                                  : c[0] === 'FT'
                                    ? pct(sum('ftm'), sum('fta'))
                                    : ''}
                            </td>,
                          );
                          return acc;
                        },
                        [<td key="n" />],
                      )}
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </section>
    );
  };
  return (
    <div data-simulation-read-region className="box-score-page">
      <div className="box-page-nav">
        <button className="btn btn-ghost" onClick={close}>
          ← Back
        </button>
        <span>{focus != null ? T[focus].abbr + ' · ' + label(s.boxId) : ''}</span>
        <button className="btn btn-secondary" disabled={!prev} onClick={() => go(prev)}>
          ‹ Previous game
        </button>
        <button className="btn btn-secondary" disabled={!next} onClick={() => go(next)}>
          Next game ›
        </button>
      </div>
      <header className="box-score-header">
        {sides.map((sd: any, i: number) => (
          <div className="box-score-team" key={sd.tid}>
            <button className="box-team-link" onClick={() => visitTeam(sd.tid)}>
              {logo(sd.tid, 72)}
              <span>
                {T[sd.tid].region} {T[sd.tid].name}
              </span>
            </button>
            <strong className="box-final-score" style={{ fontWeight: sd.pts > sides[1 - i].pts ? 800 : 400 }}>
              {sd.pts}
            </strong>
            <span className="box-muted">
              {sd.record ? sd.record + ' · ' : ''}
              {i === 0 ? 'Away' : 'Home'}
            </span>
            <div className="box-view-tabs">
              {[-1, 1].map(direction => {
                const ids = Object.keys(all)
                    .filter(id => all[id].season === bx.season && (all[id].home.tid === sd.tid || all[id].away.tid === sd.tid))
                    .sort((a, b) => seq(a) - seq(b)),
                  target = ids[ids.indexOf(s.boxId) + direction];
                return (
                  <button
                    key={direction}
                    className="btn btn-secondary"
                    disabled={!target}
                    onClick={() => {
                      gm.setState({ boxId: target, boxTeam: sd.tid });
                      main()?.scrollTo(0, 0);
                    }}
                  >
                    {direction < 0 ? '‹ Prev Game' : 'Next Game ›'}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </header>
      <div className="box-game-meta">
        {KIND[bx.kind] || 'Game'} · {date}
        {bx.ot ? ' · ' + bx.ot + 'OT' : ''}
        <div>
          {typeof T[bx.home.tid].arena === 'string' ? T[bx.home.tid].arena + ' · ' : ''}
          {T[bx.home.tid].region}
        </div>
      </div>
      <nav className="box-view-tabs" aria-label="Game views">
        {[
          ['box', 'Box Score'],
          ['pbp', 'Play-by-Play'],
          ['shots', 'Shot Charts'],
          ['pm', 'Plus/Minus'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'btn btn-primary' : 'btn btn-secondary'}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'box' && (
        <div className="box-game-summary">
          <section>
            <h3>Line Score</h3>
            <table className="box-summary-table" aria-label="Line score">
              <thead>
                <tr>
                  <th>Team</th>
                  {Array.from({ length: per }, (_, i) => (
                    <th key={i}>{i < 4 ? 'Q' + (i + 1) : 'OT' + (i - 3)}</th>
                  ))}
                  <th>T</th>
                </tr>
              </thead>
              <tbody>
                {sides.map((sd: any, j: number) => (
                  <tr key={sd.tid}>
                    <th>
                      <Link onClick={() => visitTeam(sd.tid)}>{T[sd.tid].abbr}</Link>
                    </th>
                    {Array.from({ length: per }, (_, i) => (
                      <td key={i} style={{ fontWeight: (sd.qs?.[i] ?? -1) > (sides[1 - j].qs?.[i] ?? -1) ? 800 : 400 }}>
                        {sd.qs?.[i] ?? '—'}
                      </td>
                    ))}
                    <td style={{ fontWeight: sd.pts > sides[1 - j].pts ? 800 : 400 }}>{sd.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {!periodUnavailable && <FourFactors box={selected} T={T} onTeam={visitTeam} />}
        </div>
      )}
      {(detailsLoading || detailsError) && (
        <p role="status" style={muted}>
          {detailsError || 'Loading game details…'}
          {detailsError && (
            <>
              {' '}
              <button className="btn btn-secondary" onClick={retryDetails}>
                Retry
              </button>
            </>
          )}
        </p>
      )}
      <div className="box-period-tabs" aria-label="Game period">
        {['Game', 'Q1', 'Q2', 'H1', 'Q3', 'Q4', 'H2', ...Array.from({ length: Math.max(0, per - 4) }, (_, i) => 'OT' + (i + 1))].map(p => (
          <button
            key={p}
            className={period === p ? 'btn btn-primary' : 'btn btn-secondary'}
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      {periodUnavailable && !detailsLoading && !detailsError && (
        <div className="box-period-unavailable" role="status">
          <b>
            {period}:{' '}
            {sides
              .map((sd: any) => T[sd.tid].abbr + ' ' + periodNumbers(period, per).reduce((n, q) => n + (sd.qs[q - 1] || 0), 0))
              .join(' · ')}
          </b>
          <p>
            Individual period stats were not recorded for this saved game. Choose Game for the full box score. Newly played games include
            quarter and half stats.
          </p>
        </div>
      )}
      {tab === 'box' ? (
        <>
          <div className="box-mode-switch">
            <Seg<'trad' | 'adv' | 'both'>
              value={mode}
              options={[
                ['trad', 'Traditional'],
                ['adv', 'Advanced'],
                ['both', 'Both'],
              ]}
              onChange={setMode}
            />
          </div>
          {!periodUnavailable && (
            <div ref={tablesRef} className="box-team-sections box-player-tables">
              {[selected.away, selected.home].map(team)}
            </div>
          )}
          {bx.coach && (
            <section>
              <h3>Coaching</h3>
              {['away', 'home'].map(k => (
                <p key={k}>
                  <b>{T[bx[k].tid].abbr}</b> {(bx.coach[k] || []).join(' · ')}
                </p>
              ))}
            </section>
          )}
        </>
      ) : (
        !detailsLoading &&
        !detailsError && <BoxScoreDetails key={s.boxId} box={bx} vm={vm} tab={tab} period={period} onPlayer={visitPlayer} />
      )}
    </div>
  );
}

// A game's box score, as a full page: the score by quarter and every player's line for both teams.
// Opened by clicking a result (Dashboard, Schedule, Playoffs). ← Back returns to where you were;
// the arrows (or ← → keys) step through the same team's games in order: regular season, play-in,
// playoffs. Kept for the current season.
import { Fragment, useEffect, useLayoutEffect, useState } from 'react';
import type { VM } from '../vm';
import { Game } from '../../engine/Game';
import { Kicker, Link, muted, Seg } from '../kit';

const F = Game.BOX_F; // min, pts, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl, blk, tov, pf, pm, gs
const at = (l: number[], k: string) => l[1 + F.indexOf(k)];
let backScroll = 0;
const KIND: Record<string, string> = { reg: 'Regular season', playin: 'Play-in', po: 'Playoffs' };

export function BoxScoreModal({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P, bx = (gm.db as any).boxes?.[s.boxId];
  const main = () => document.querySelector('main');
  // Remember where you were on the page underneath, and put you back there on ← Back.
  useLayoutEffect(() => { backScroll = main()?.scrollTop || 0; main()?.scrollTo(0, 0); }, []);
  const close = () => { const y = backScroll; gm.setState({ boxId: null, boxTeam: null }); setTimeout(() => main()?.scrollTo(0, y), 0); };
  // Whose games the arrows follow: the team you came in with, else yours if you played, else the home team.
  const all = (gm.db as any).boxes || {}, inGame = (tid: number) => bx && (bx.home.tid === tid || bx.away.tid === tid);
  const focus: number | null = !bx ? null : s.boxTeam != null && inGame(s.boxTeam) ? s.boxTeam : vm.ctx.isMine(bx.home.tid) ? bx.home.tid : vm.ctx.isMine(bx.away.tid) ? bx.away.tid : bx.home.tid;
  const seq = (id: string) => +String(id).split('-')[1] || 0;
  const games = focus == null ? [] : Object.keys(all).filter(id => all[id].season === bx.season && (all[id].home.tid === focus || all[id].away.tid === focus)).sort((a, b) => seq(a) - seq(b));
  const idx = games.indexOf(s.boxId), prev = idx > 0 ? games[idx - 1] : null, next = idx >= 0 && idx < games.length - 1 ? games[idx + 1] : null;
  const go = (id: string | null) => { if (id) { gm.setState({ boxId: id, boxTeam: focus }); document.querySelector('main')?.scrollTo(0, 0); } };
  const nOf = (id: string) => { const k = all[id].kind; return games.filter(g => all[g].kind === k && seq(g) <= seq(id)).length; };
  const label = (id: string | null) => (id ? (all[id].kind === 'po' ? 'Playoff game ' : all[id].kind === 'playin' ? 'Play-in game ' : 'Game ') + nOf(id) : '');
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') go(prev); if (e.key === 'ArrowRight') go(next); if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });
  const [mode, setModeS] = useState<'trad' | 'adv' | 'both'>(() => { try { return (localStorage.getItem('boxMode') as any) || 'trad'; } catch { return 'trad'; } });
  const setMode = (m: 'trad' | 'adv' | 'both') => { setModeS(m); try { localStorage.setItem('boxMode', m); } catch { /* private mode */ } };
  if (!bx) return null;
  const sides = [bx.away, bx.home], per = Math.max(bx.home.qs?.length || 0, bx.away.qs?.length || 0);
  const date = bx.kind === 'reg' ? gm.fmtS(bx.day) : KIND[bx.kind] || '';
  const th = (t: string, left?: boolean) => <th key={t} style={{ padding: '4px 6px', textAlign: left ? 'left' : 'right', whiteSpace: 'nowrap' }}>{t}</th>;
  const td = (v: any, extra?: any) => <td style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...extra }}>{v}</td>;
  // Traditional, advanced (worked out from this game's box: Basketball-Reference formulas) or both.
  const team = (sd: any) => {
    const op = sd === bx.home ? bx.away : bx.home;
    const lines = sd.lines.slice().sort((a: number[], b: number[]) => (at(b, 'gs') - at(a, 'gs')) || (at(b, 'min') - at(a, 'min')));
    const sumOf = (ls: number[][], k: string) => ls.reduce((a: number, l: number[]) => a + at(l, k), 0);
    const sum = (k: string) => sumOf(lines, k), osum = (k: string) => sumOf(op.lines, k);
    const pct = (m: number, a: number) => (a ? (m / a * 100).toFixed(0) + '%' : '—');
    const T5 = Math.max(1, sum('min')) / 5, oPoss = osum('fga') + 0.44 * osum('fta') - osum('orb') + osum('tov');
    const p1 = (x: number) => (isFinite(x) ? x.toFixed(1) : '—'), pc = (x: number) => (isFinite(x) ? (x * 100).toFixed(1) : '—');
    // One player's (or the team's, with min = team minutes) advanced line.
    const adv = (g: (k: string) => number) => { const min = g('min'), share = g === TEAM ? 1 : min ? T5 / min : 0; // the team row is the whole team: no per-player scaling
      return {
        ts: g('fga') + g('fta') ? g('pts') / (2 * (g('fga') + 0.44 * g('fta'))) : NaN, efg: g('fga') ? (g('fgm') + 0.5 * g('tpm')) / g('fga') : NaN,
        tpar: g('fga') ? g('tpa') / g('fga') : NaN, ftr: g('fga') ? g('fta') / g('fga') : NaN,
        orb: min ? g('orb') * share / (sum('orb') + osum('drb')) : NaN, drb: min ? g('drb') * share / (sum('drb') + osum('orb')) : NaN,
        trb: min ? (g('orb') + g('drb')) * share / (sum('orb') + sum('drb') + osum('orb') + osum('drb')) : NaN,
        ast: min && g !== TEAM ? g('ast') / ((min / T5) * sum('fgm') - g('fgm')) : sum('ast') / Math.max(1, sum('fgm')),
        stl: min ? g('stl') * share / Math.max(1, oPoss) : NaN, blk: min ? g('blk') * share / Math.max(1, osum('fga') - osum('tpa')) : NaN,
        tov: g('fga') + g('fta') + g('tov') ? g('tov') / (g('fga') + 0.44 * g('fta') + g('tov')) : NaN,
        usg: min && g !== TEAM ? (g('fga') + 0.44 * g('fta') + g('tov')) * share / (sum('fga') + 0.44 * sum('fta') + sum('tov')) : 1,
        gmsc: g('pts') + 0.4 * g('fgm') - 0.7 * g('fga') - 0.4 * (g('fta') - g('ftm')) + 0.7 * g('orb') + 0.3 * g('drb') + g('stl') + 0.7 * g('ast') + 0.7 * g('blk') - 0.4 * g('pf') - g('tov'),
      }; };
    const TEAM = (k: string) => sum(k);
    type Col = [string, (g: (k: string) => number, a: any, isTeam: boolean) => any, any?];
    const TRAD: Col[] = [['PTS', g => g('pts')], ['REB', g => g('orb') + g('drb')], ['AST', g => g('ast')], ['STL', g => g('stl')], ['BLK', g => g('blk')], ['TO', g => g('tov')],
      ['FG', g => g('fgm') + '-' + g('fga')], ['3P', g => g('tpm') + '-' + g('tpa')], ['FT', g => g('ftm') + '-' + g('fta')], ['OREB', g => g('orb')], ['PF', g => g('pf')]];
    const ADV: Col[] = [['TS%', (g, a) => pc(a.ts)], ['eFG%', (g, a) => pc(a.efg)], ['3PAr', (g, a) => pc(a.tpar)], ['FTr', (g, a) => pc(a.ftr)], ['ORB%', (g, a) => pc(a.orb)], ['DRB%', (g, a) => pc(a.drb)], ['TRB%', (g, a) => pc(a.trb)],
      ['AST%', (g, a) => pc(a.ast)], ['STL%', (g, a) => pc(a.stl)], ['BLK%', (g, a) => pc(a.blk)], ['TOV%', (g, a) => pc(a.tov)], ['USG%', (g, a, tm) => (tm ? '' : pc(a.usg))], ['GmSc', (g, a) => p1(a.gmsc), { fontWeight: 600 }]];
    const cols: Col[] = [['MIN', (g, a, tm) => (tm ? '' : g('min').toFixed(0))], ...(mode !== 'adv' ? TRAD : [['PTS', (g: any) => g('pts')] as Col]), ...(mode !== 'trad' ? ADV : []),
      ['+/−', (g, a, tm) => (tm ? '' : (g('pm') > 0 ? '+' : '') + g('pm')), undefined]];
    const pmColor = (v: number) => ({ color: v > 0 ? 'var(--gm-good)' : v < 0 ? 'var(--gm-bad)' : undefined });
    // The game leader in each stat (both teams) is in bold: the number, not the player.
    const LEADK: Record<string, (g: (k: string) => number) => number> = { MIN: g => g('min'), PTS: g => g('pts'), REB: g => g('orb') + g('drb'), AST: g => g('ast'), STL: g => g('stl'), BLK: g => g('blk'), TO: g => g('tov'), PF: g => g('pf'), OREB: g => g('orb'), FG: g => g('fgm'), '3P': g => g('tpm'), FT: g => g('ftm'), '+/−': g => g('pm') };
    const allLines = [...bx.home.lines, ...bx.away.lines], gameMax: Record<string, number> = {};
    Object.entries(LEADK).forEach(([k, f]) => (gameMax[k] = Math.max(...allLines.map((l: number[]) => f(x => at(l, x))))));
    const isLead = (c: string, g: (k: string) => number) => !!LEADK[c] && gameMax[c] > 0 && LEADK[c](g) === gameMax[c];
    return (
      <section key={sd.tid} style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0 6px' }}>{logo(sd.tid, 24)}<Link onClick={() => { close(); openTeam(sd.tid); }} style={{ fontWeight: 600, fontSize: '15px' }}>{T[sd.tid].region} {T[sd.tid].name}</Link><span style={{ ...muted }}>{sd.pts}</span></div>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr>{th('Player', true)}{cols.map(c => th(c[0]))}</tr></thead>
          <tbody>
            {lines.map((l: number[], i: number) => { const p = P[l[0]], starter = at(l, 'gs') > 0, g = (k: string) => at(l, k), a = adv(g); return (
              <Fragment key={l[0]}>
              {i > 0 && !starter && at(lines[i - 1], 'gs') > 0 && <tr aria-hidden><td colSpan={100} style={{ padding: 0, height: 0, borderTop: '3px solid var(--color-accent-700)' }} /></tr>}
              <tr>
                <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{p && <img src={gm.flag(p.rep)} alt="" title={gm.db.C[p.rep]?.n} style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)', marginRight: 6, verticalAlign: 'middle' }} />}{p ? <Link onClick={() => { close(); open(l[0]); }} style={{ fontWeight: starter ? 700 : 400 }}>{p.name}</Link> : 'Unknown'} <span style={{ ...muted, fontSize: '11px' }}>{p?.pos}</span></td>
                {cols.map(c => <td key={c[0]} title={isLead(c[0], g) ? 'Game high' : undefined} style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...(c[2] || {}), ...(c[0] === '+/−' ? pmColor(g('pm')) : {}), ...(isLead(c[0], g) ? { fontWeight: 800 } : {}) }}>{c[1](g, a, false)}</td>)}
              </tr></Fragment>); })}
            {(() => { const a = adv(TEAM); return (<>
              <tr style={{ borderTop: '2px solid var(--color-text)', fontWeight: 600 }}>
                <td style={{ padding: '4px 6px' }}>Team</td>{cols.map(c => <td key={c[0]} style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{c[1](TEAM, a, true)}</td>)}
              </tr>
              {mode !== 'adv' && <tr style={{ ...muted, fontSize: '11.5px' }}>{cols.concat([]).reduce((acc: any[], c, i) => { acc.push(<td key={i} style={{ padding: '2px 6px', textAlign: 'right' }}>{c[0] === 'FG' ? pct(sum('fgm'), sum('fga')) : c[0] === '3P' ? pct(sum('tpm'), sum('tpa')) : c[0] === 'FT' ? pct(sum('ftm'), sum('fta')) : ''}</td>); return acc; }, [<td key="n" />])}</tr>}
            </>); })()}
          </tbody>
        </table>
      </section>);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="hv4" onClick={close} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', fontSize: '13px' }}>← Back</button>
        <span style={{ flex: 1 }} />
        {focus != null && <span style={{ ...muted, fontSize: '12.5px' }}>{T[focus].abbr} · {label(s.boxId)} · {idx + 1} of {games.length} box scores</span>}
        <button className="btn btn-secondary" disabled={!prev} onClick={() => go(prev)} title="Previous game (← key)" style={{ fontSize: '12.5px' }}>‹ {prev ? label(prev) : 'Previous'}</button>
        <button className="btn btn-secondary" disabled={!next} onClick={() => go(next)} title="Next game (→ key)" style={{ fontSize: '12.5px' }}>{next ? label(next) : 'Next'} ›</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <Kicker accent>Box score · {date}{bx.ot ? ' · ' + (bx.ot > 1 ? bx.ot : '') + 'OT' : ''}</Kicker>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 6 }}>
              {sides.map((sd: any, i: number) => (
                <span key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  {i === 1 && <span style={{ ...muted, fontSize: '13px' }}>at</span>}
                  <button className="hv4" title={'Open the ' + T[sd.tid].region + ' ' + T[sd.tid].name + ' page'} onClick={() => { close(); openTeam(sd.tid); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center' }}>{logo(sd.tid, 32)}<span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>{T[sd.tid].abbr}</span></button>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: sd.pts > sides[1 - i].pts ? 700 : 400, color: sd.pts > sides[1 - i].pts ? 'var(--color-text)' : 'var(--color-neutral-600)' }}>{sd.pts}</span>
                </span>))}
            </div>
          </div>
        </div>
        {per > 0 && (
          <table className="table" style={{ fontSize: '12.5px', width: 'auto' }}>
            <thead><tr>{th('', true)}{Array.from({ length: per }, (_, i) => th(i < 4 ? 'Q' + (i + 1) : 'OT' + (per > 5 ? i - 3 : '')))}{th('Final')}</tr></thead>
            <tbody>{sides.map((sd: any) => <tr key={sd.tid}><td style={{ padding: '4px 6px', fontWeight: 600 }}><Link onClick={() => { close(); openTeam(sd.tid); }}>{T[sd.tid].abbr}</Link></td>{Array.from({ length: per }, (_, i) => <Fragment key={i}>{td(sd.qs?.[i] ?? '')}</Fragment>)}{td(sd.pts, { fontWeight: 700 })}</tr>)}</tbody>
          </table>)}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Seg<'trad' | 'adv' | 'both'> value={mode} options={[['trad', 'Traditional'], ['adv', 'Advanced'], ['both', 'Both']]} onChange={setMode} />{mode !== 'trad' && <span style={{ ...muted, fontSize: '11.5px' }}>Advanced stats from this game alone (Basketball-Reference formulas). GmSc = Hollinger’s Game Score.</span>}</div>
        {sides.map(team)}
      </div>
    </div>
  );
}

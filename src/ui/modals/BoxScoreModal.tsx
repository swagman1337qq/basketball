// A game's box score: the score by quarter and every player's line for both teams. Opened by
// clicking a result (Dashboard, Schedule, Playoffs). Kept for the current season.
import type { VM } from '../vm';
import { Game } from '../../engine/Game';
import { Kicker, Link, muted } from '../kit';

const F = Game.BOX_F; // min, pts, fgm, fga, tpm, tpa, ftm, fta, orb, drb, ast, stl, blk, tov, pf, pm, gs
const at = (l: number[], k: string) => l[1 + F.indexOf(k)];
const KIND: Record<string, string> = { reg: 'Regular season', playin: 'Play-in', po: 'Playoffs' };

export function BoxScoreModal({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P, bx = (gm.db as any).boxes?.[s.boxId];
  const close = () => gm.setState({ boxId: null });
  if (!bx) return null;
  const sides = [bx.away, bx.home], per = Math.max(bx.home.qs?.length || 0, bx.away.qs?.length || 0);
  const date = bx.kind === 'reg' ? gm.fmtS(bx.day) : KIND[bx.kind] || '';
  const th = (t: string, left?: boolean) => <th key={t} style={{ padding: '4px 6px', textAlign: left ? 'left' : 'right', whiteSpace: 'nowrap' }}>{t}</th>;
  const td = (v: any, extra?: any) => <td style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...extra }}>{v}</td>;
  const team = (sd: any) => {
    const lines = sd.lines.slice().sort((a: number[], b: number[]) => (at(b, 'gs') - at(a, 'gs')) || (at(b, 'min') - at(a, 'min')));
    const sum = (k: string) => lines.reduce((a: number, l: number[]) => a + at(l, k), 0);
    const pct = (m: number, a: number) => (a ? (m / a * 100).toFixed(0) + '%' : '—');
    return (
      <section key={sd.tid} style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0 6px' }}>{logo(sd.tid, 24)}<Link onClick={() => { close(); openTeam(sd.tid); }} style={{ fontWeight: 600, fontSize: '15px' }}>{T[sd.tid].region} {T[sd.tid].name}</Link><span style={{ ...muted }}>{sd.pts}</span></div>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr>{th('Player', true)}{['MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'FG', '3P', 'FT', 'OREB', 'PF', '+/−'].map(x => th(x))}</tr></thead>
          <tbody>
            {lines.map((l: number[], i: number) => { const p = P[l[0]], starter = at(l, 'gs') > 0; return (
              <tr key={l[0]} style={{ borderTop: i > 0 && starter !== (at(lines[i - 1], 'gs') > 0) ? '2px solid var(--color-divider)' : undefined }}>
                <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{p ? <Link onClick={() => { close(); open(l[0]); }}>{p.name}</Link> : 'Unknown'} <span style={{ ...muted, fontSize: '11px' }}>{p?.pos}{starter ? '' : ''}</span></td>
                {td(at(l, 'min').toFixed(0))}{td(at(l, 'pts'), { fontWeight: 700 })}{td(at(l, 'orb') + at(l, 'drb'))}{td(at(l, 'ast'))}{td(at(l, 'stl'))}{td(at(l, 'blk'))}{td(at(l, 'tov'))}
                {td(at(l, 'fgm') + '-' + at(l, 'fga'))}{td(at(l, 'tpm') + '-' + at(l, 'tpa'))}{td(at(l, 'ftm') + '-' + at(l, 'fta'))}{td(at(l, 'orb'))}{td(at(l, 'pf'))}
                {td((at(l, 'pm') > 0 ? '+' : '') + at(l, 'pm'), { color: at(l, 'pm') > 0 ? 'var(--gm-good)' : at(l, 'pm') < 0 ? 'var(--gm-bad)' : undefined })}
              </tr>); })}
            <tr style={{ borderTop: '2px solid var(--color-text)', fontWeight: 600 }}>
              <td style={{ padding: '4px 6px' }}>Team</td>{td('')}{td(sum('pts'))}{td(sum('orb') + sum('drb'))}{td(sum('ast'))}{td(sum('stl'))}{td(sum('blk'))}{td(sum('tov'))}
              {td(sum('fgm') + '-' + sum('fga'))}{td(sum('tpm') + '-' + sum('tpa'))}{td(sum('ftm') + '-' + sum('fta'))}{td(sum('orb'))}{td(sum('pf'))}{td('')}
            </tr>
            <tr style={{ ...muted, fontSize: '11.5px' }}><td style={{ padding: '2px 6px' }} colSpan={8}></td>{td(pct(sum('fgm'), sum('fga')))}{td(pct(sum('tpm'), sum('tpa')))}{td(pct(sum('ftm'), sum('fta')))}<td colSpan={3} /></tr>
          </tbody>
        </table>
      </section>);
  };
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 55%, transparent)', zIndex: 30, padding: '20px' }} onClick={close}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 'min(1000px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: '20px 24px', gap: '14px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <Kicker accent>Box score · {date}{bx.ot ? ' · ' + (bx.ot > 1 ? bx.ot : '') + 'OT' : ''}</Kicker>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 6 }}>
              {sides.map((sd: any, i: number) => (
                <span key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  {i === 1 && <span style={{ ...muted, fontSize: '13px' }}>at</span>}
                  {logo(sd.tid, 32)}<span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>{T[sd.tid].abbr}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: sd.pts > sides[1 - i].pts ? 700 : 400, color: sd.pts > sides[1 - i].pts ? 'var(--color-text)' : 'var(--color-neutral-600)' }}>{sd.pts}</span>
                </span>))}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={close}>Close</button>
        </div>
        {per > 0 && (
          <table className="table" style={{ fontSize: '12.5px', width: 'auto' }}>
            <thead><tr>{th('', true)}{Array.from({ length: per }, (_, i) => th(i < 4 ? 'Q' + (i + 1) : 'OT' + (per > 5 ? i - 3 : '')))}{th('Final')}</tr></thead>
            <tbody>{sides.map((sd: any) => <tr key={sd.tid}><td style={{ padding: '4px 6px', fontWeight: 600 }}>{T[sd.tid].abbr}</td>{Array.from({ length: per }, (_, i) => td(sd.qs?.[i] ?? ''))}{td(sd.pts, { fontWeight: 700 })}</tr>)}</tbody>
          </table>)}
        {sides.map(team)}
      </div>
    </div>
  );
}

// Summer League on the Free agency screen (summerLeague.ts): before it, your invites (undrafted free agents) and
// who's playing for you; after it, the standings and champion, your team's lines and the league's top scorers.
import { useState } from 'react';
import type { VM } from '../vm';
import { Link, muted, td, th } from '../kit';
import { SL_DAY, SL_INV, slEligible, slGmSc, slInvite, slInvites, slOf, slOpen, slRosters, type SlLine } from '../../engine/summerLeague';

const f1 = (v: number) => (isFinite(v) ? v.toFixed(1) : '—');
const pct = (m: number, a: number) => (a ? ((100 * m) / a).toFixed(0) + '%' : '—');
export function SummerLeaguePanel({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    [msg, setMsg] = useState(''),
    [more, setMore] = useState(false);
  const P = gm.db.P,
    Y = gm.Y,
    T = s.teams,
    open = (id: number) => vm.ctx.open?.(id);
  const done = s.sl?.y === Y;
  if (!done && !slOpen(gm, s)) return null;
  const box: React.CSSProperties = {
    border: '1px solid var(--color-divider)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 12px',
    margin: '0 0 12px',
    fontSize: '12.5px',
  };
  if (done) {
    const rec: Record<number, number[]> = s.sl.rec || {},
      order = Object.keys(rec)
        .map(Number)
        .sort((a, b) => rec[b][0] - rec[a][0] || rec[b][2] - rec[b][3] - (rec[a][2] - rec[a][3]));
    const mineIds: number[] = s.sl.ros?.[s.me] || [];
    const mine = mineIds.map(id => ({ p: P[id], L: slOf(P[id], Y) })).filter(x => x.p && x.L?.gp) as { p: any; L: SlLine }[];
    const leaders = (Object.values(P) as any[])
      .map(p => ({ p, L: slOf(p, Y) }))
      .filter(x => x.L && x.L.gp >= 3)
      .sort((a, b) => b.L!.pts / b.L!.gp - a.L!.pts / a.L!.gp)
      .slice(0, 8) as { p: any; L: SlLine }[];
    const row = ({ p, L }: { p: any; L: SlLine }) => (
      <tr key={p.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
        <td style={td()}>
          <Link pid={p.id} onClick={() => open(p.id)}>
            {p.name}
          </Link>{' '}
          <span style={muted}>
            {p.pos} · {p.age}
          </span>
        </td>
        <td style={td('right')}>{T[L.tid]?.abbr}</td>
        <td style={td('right')}>{L.gp}</td>
        <td style={td('right')}>{f1(L.pts / L.gp)}</td>
        <td style={td('right')}>{f1((L.orb + L.drb) / L.gp)}</td>
        <td style={td('right')}>{f1(L.ast / L.gp)}</td>
        <td style={td('right')}>{pct(L.fgm, L.fga)}</td>
        <td style={td('right')}>{pct(L.tpm, L.tpa)}</td>
        <td style={td('right')} title="Game Score a game">
          {f1(slGmSc(L))}
        </td>
      </tr>
    );
    const head = (
      <tr>
        {['Player', 'Team', 'GP', 'PTS', 'REB', 'AST', 'FG%', '3P%', 'GmSc'].map((h, i) => (
          <th key={h} style={th(i ? 'right' : 'left')}>
            {h}
          </th>
        ))}
      </tr>
    );
    const R = rec[s.me];
    return (
      <details style={box} open={more} onToggle={e => setMore((e.target as HTMLDetailsElement).open)}>
        <summary style={{ cursor: 'pointer' }}>
          <b>Summer League</b> · Champions: {T[s.sl.champ]?.region} {T[s.sl.champ]?.name} ({rec[s.sl.champ]?.[0]}–{rec[s.sl.champ]?.[1]})
          {R ? ' · you went ' + R[0] + '–' + R[1] : ''}
        </summary>
        <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
          <div style={muted}>
            Standings:{' '}
            {order
              .slice(0, 8)
              .map(t => T[t].abbr + ' ' + rec[t][0] + '–' + rec[t][1])
              .join(' · ')}
          </div>
          {mine.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Your team</div>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>{head}</thead>
                <tbody>{mine.sort((a, b) => slGmSc(b.L) - slGmSc(a.L)).map(row)}</tbody>
              </table>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Top scorers</div>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>{head}</thead>
              <tbody>{leaders.map(row)}</tbody>
            </table>
          </div>
        </div>
      </details>
    );
  }
  // Before it: your roster and your invites.
  const inv = slInvites(gm, s),
    ros = slRosters(gm, s)[s.me] || [],
    cands = (s.fa || [])
      .filter((id: number) => slEligible(gm, s, P[id]) && !inv.includes(id))
      .map((id: number) => P[id])
      .sort((a: any, b: any) => vm.ctx.potOf?.(b) * 0.4 + b.ovr * 0.6 - (vm.ctx.potOf?.(a) * 0.4 + a.ovr * 0.6))
      .slice(0, more ? 30 : 8);
  const days = s.phase === 'fa' ? Math.max(0, SL_DAY - gm.faDayOf(s)) : null;
  const act = (id: number, on: boolean) => {
    setMsg(slInvite(gm, s, id, on));
    gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  };
  return (
    <div style={box}>
      <div>
        <b>Summer League</b>
        <span style={muted}>
          {' '}
          · mid-July{days != null ? ' (in ' + days + ' day' + (days === 1 ? '' : 's') + ')' : ''} · your young players plus up to {SL_INV}{' '}
          undrafted free agents you invite; five games each, on the CCP&rsquo;s quick game model
        </span>
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={muted}>Playing for you: </span>
        {ros.length
          ? ros.map((id: number, i: number) => (
              <span key={id}>
                {i > 0 && ', '}
                <Link pid={id} onClick={() => open(id)}>
                  {P[id].name}
                </Link>
                {inv.includes(id) && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '0 4px' }}
                    title="Withdraw the invite"
                    onClick={() => act(id, false)}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))
          : 'nobody yet'}
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={muted}>
          Invite ({inv.length} of {SL_INV}):
        </span>
        {cands.map((p: any) => (
          <button
            key={p.id}
            className="btn btn-secondary"
            style={{ fontSize: '11.5px', padding: '2px 8px' }}
            disabled={inv.length >= SL_INV}
            onClick={() => act(p.id, true)}
            title={p.name + ', ' + p.age + ': ' + p.ovr + ' now, ceiling ' + (vm.ctx.potOf?.(p) ?? p.pot) + ' (your read)'}
          >
            + {p.name} ({p.pos}, {p.ovr}/{vm.ctx.potOf?.(p) ?? p.pot})
          </button>
        ))}
        <button className="btn btn-ghost" style={{ fontSize: '11.5px' }} onClick={() => setMore(!more)}>
          {more ? 'Fewer' : 'More'}
        </button>
      </div>
      {msg && <div style={{ marginTop: 4, color: 'var(--color-accent-800)' }}>{msg}</div>}
    </div>
  );
}

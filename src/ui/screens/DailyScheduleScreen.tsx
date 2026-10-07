// The league's schedule day by day: every game on a day, with the final score and box score once
// it's played, or both teams' records before. Your team's game is highlighted. In God Mode each game
// still to come has two small tick boxes (ForceWin): tick a team and it wins when that day is simmed.
import { useState } from 'react';
import type { VM } from '../vm';
import { GOD_PINK, muted } from '../kit';
import { ForceWin } from '../ForceWin';

export function DailyScheduleScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, isMine } = vm.ctx;
  const days: [number, number][][] = gm.db.days || [], n = days.length;
  const results = (s.games || []).filter((g: any) => !g.po);
  // The next day to be played: the current day in the regular season, the first before it, none after.
  const next = s.phase === 'regular' ? s.day : s.phase === 'preseason' || !results.length ? 0 : n;
  const [d0, setD] = useState<number>(Math.min(Math.max(0, n - 1), next));
  if (!n) return <p style={{ ...muted, fontStyle: 'italic' }}>There’s no schedule yet.</p>;
  const d = Math.max(0, Math.min(n - 1, d0)), games = days[d] || [];
  const resOf = (h: number, a: number) => results.find((g: any) => g.day === d && g.h === h && g.a === a);
  const played = games.filter(([h, a]) => resOf(h, a)).length;
  const picks = s.godWin || {}, nPicked = s.god ? games.filter(([h, a]) => picks[gm.Y + ':' + d + ':' + h + ':' + a] != null).length : 0;
  const fmt = (x: number) => gm.dateOf(x).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--color-divider)', whiteSpace: 'nowrap' };
  const team = (tid: number, won: boolean | null) => (
    <button className="hv4" onClick={() => openTeam(tid)} title={T[tid].region + ' ' + T[tid].name} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: won ? 700 : 500, opacity: won === false ? 0.75 : 1 }}>
      {logo(tid, 22)}<span>{T[tid].region} {T[tid].name}</span>
    </button>);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="btn btn-secondary" disabled={d <= 0} onClick={() => setD(d - 1)} style={{ width: 34, padding: '2px 0' }} aria-label="Previous day">‹</button>
        <select className="input" value={d} onChange={e => setD(+e.target.value)} style={{ width: 'auto', fontWeight: 600 }}>
          {days.map((_, i) => <option key={i} value={i}>{fmt(i)}{i === next && s.phase === 'regular' ? ' (next)' : ''}</option>)}
        </select>
        <button className="btn btn-secondary" disabled={d >= n - 1} onClick={() => setD(d + 1)} style={{ width: 34, padding: '2px 0' }} aria-label="Next day">›</button>
        {s.phase === 'regular' && d !== next && next < n && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setD(next)}>Today</button>}
        <span style={{ ...muted, fontSize: '12.5px' }}>Day {d + 1} of {n} · {games.length} games{played ? played === games.length ? ' · final' : ' · ' + played + ' played' : ''}{nPicked ? ' · ' : ''}{nPicked > 0 && <b style={{ color: GOD_PINK }}>{nPicked} forced</b>}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {nPicked > 0 && <button className="btn btn-ghost" style={{ fontSize: '12.5px', color: GOD_PINK }} onClick={() => gm.setState((st: any) => { const g = { ...(st.godWin || {}) }; games.forEach(([h, a]) => delete g[gm.Y + ':' + d + ':' + h + ':' + a]); return { godWin: g }; })}>Clear this day’s picks</button>}
          {s.phase === 'regular' && d === next && <button className="btn btn-primary" style={{ fontSize: '12.5px' }} onClick={() => gm.sim(1)}>Sim this day</button>}
        </span>
      </div>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr>
          <th style={td}>Away</th><th style={{ ...td, textAlign: 'right' }} /><th style={td} /><th style={td}>Home</th><th style={{ ...td, textAlign: 'right' }} /><th style={{ ...td, textAlign: 'right' }}>{s.god && d >= next && s.phase === 'regular' ? <span style={{ color: GOD_PINK }}>Force a win</span> : ''}</th>
        </tr></thead>
        <tbody>
          {games.map(([h, a]) => {
            const r = resOf(h, a), hw = r ? r.hp > r.ap : null, mine = isMine(h) || isMine(a), box = r?.bid && (gm.db as any).boxes?.[r.bid];
            const num = (v: string, b: boolean) => <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: b ? 700 : 400, color: r ? undefined : 'var(--color-neutral-700)' }}>{v}</td>;
            return (
              <tr key={h + '-' + a} style={{ background: mine ? 'var(--color-accent-100)' : undefined }}>
                <td style={td}>{team(a, hw == null ? null : !hw)}</td>
                {num(r ? String(r.ap) : T[a].w + '–' + T[a].l, hw === false)}
                <td style={{ ...td, ...muted, fontSize: '12px' }}>at</td>
                <td style={td}>{team(h, hw)}</td>
                {num(r ? String(r.hp) + (r.ot ? ' (' + (r.ot > 1 ? r.ot : '') + 'OT)' : '') : T[h].w + '–' + T[h].l, hw === true)}
                <td style={{ ...td, textAlign: 'right' }}>
                  {box ? <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={() => gm.setState({ boxId: r.bid, boxTeam: isMine(a) ? a : h })}>Box score</button>
                    : <ForceWin vm={vm} day={d} h={h} a={a} />}
                </td>
              </tr>);
          })}
        </tbody>
      </table>
      <p style={{ ...muted, fontSize: '12px', marginTop: 10 }}>
        Records before the game are each team’s current record. Click a team for its roster.
        {s.god ? ' God Mode: tick a team’s box to make it win that game when the day is simmed (untick to let the game decide). The game is still played out with a real box score. Your own games too, and you can tick them on your Team schedule as well.' : ''}
      </p>
    </>
  );
}

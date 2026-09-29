// God Mode: the league's schedule day by day, with the power to pick who wins any game.
// A picked game is still played out (real box score); the picked team just ends up winning.
import { useState } from 'react';
import type { VM } from '../vm';
import { GOD_PINK, godBox, muted } from '../kit';

export function DailyScheduleScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam } = vm.ctx;
  const [off, setOff] = useState(0);
  if (!s.god) return null;
  const regular = s.phase === 'regular', played = gm.gamesPlayed(s), left = Math.max(0, 82 - played);
  if (!regular || !left) return <p style={{ ...muted, fontStyle: 'italic' }}>The daily schedule is for the regular season{regular ? ', and it’s over' : ''}. Picks for the play-in and playoffs aren’t supported yet.</p>;
  const day = s.day + Math.min(off, left - 1), days = gm.db.days, games: [number, number][] = days[day % days.length] || [];
  const key = (h: number, a: number) => gm.Y + ':' + day + ':' + h + ':' + a, picks = s.godWin || {};
  const setPick = (h: number, a: number, w: number | null) => gm.setState(st => { const g = { ...(st.godWin || {}) }; if (w == null) delete g[key(h, a)]; else g[key(h, a)] = w; return { godWin: g }; });
  const nPicked = games.filter(([h, a]) => picks[key(h, a)] != null).length;
  const rec = (tid: number) => T[tid].w + '–' + T[tid].l;
  const side = (tid: number, h: number, a: number) => { const on = picks[key(h, a)] === tid; return (
    <button onClick={() => setPick(h, a, on ? null : tid)} title={on ? 'Picked to win (click to undo)' : 'Pick ' + T[tid].name + ' to win'} className="hv4"
      style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (on ? GOD_PINK : 'var(--color-divider)'), background: on ? 'color-mix(in srgb, ' + GOD_PINK + ' 14%, transparent)' : 'transparent', minWidth: 0, flex: 1 }}>
      {logo(tid, 22)}<span style={{ fontWeight: on ? 700 : 500, color: on ? GOD_PINK : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{T[tid].region} {T[tid].name}</span><span style={{ ...muted, fontSize: '12px' }}>{rec(tid)}</span>{on && <b style={{ marginLeft: 'auto', color: GOD_PINK, fontSize: '11px' }}>WINS</b>}
    </button>); };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="btn btn-ghost" disabled={off <= 0} onClick={() => setOff(off - 1)} style={{ fontSize: 18, padding: '2px 10px' }}>‹</button>
        <b style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>{gm.dateOf(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</b>
        <button className="btn btn-ghost" disabled={off >= left - 1} onClick={() => setOff(off + 1)} style={{ fontSize: 18, padding: '2px 10px' }}>›</button>
        <span style={muted}>{off === 0 ? 'Next up' : 'In ' + off + ' day' + (off === 1 ? '' : 's')} · {games.length} game{games.length === 1 ? '' : 's'} · {nPicked} picked</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {nPicked > 0 && <button className="btn btn-ghost" style={{ fontSize: '12.5px', color: GOD_PINK }} onClick={() => gm.setState(st => { const g = { ...(st.godWin || {}) }; games.forEach(([h, a]) => delete g[key(h, a)]); return { godWin: g }; })}>Clear this day’s picks</button>}
          {off === 0 && <button className="btn btn-primary" style={{ fontSize: '12.5px', background: GOD_PINK, borderColor: GOD_PINK }} onClick={() => gm.sim(1)}>Sim this day</button>}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {games.map(([h, a]) => (
          <div key={h + '-' + a} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, ...godBox }}>
            {side(a, h, a)}<span style={{ ...muted, fontSize: '12px' }}>at</span>{side(h, h, a)}
            <button className="btn btn-ghost" onClick={() => openTeam(h)} style={{ fontSize: '11.5px', display: 'none' }}>·</button>
          </div>))}
      </div>
      <p style={{ ...muted, fontSize: '12px', marginTop: 12 }}>Click a team to make it win (click again to let the game decide). Picked games are still played out with a real box score; the picked team just ends up on top. Your own team’s games included. Picks work for any day ahead, however you sim.</p>
    </>
  );
}

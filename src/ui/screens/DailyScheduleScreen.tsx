// The league's schedule day by day: every game on a day, with the final score and box score once
// it's played, or both teams' records before. Your team's game is highlighted. After the regular
// season come the play-in and playoff days (Game.postSchedule): every game played, labeled with its
// round and the series score, and the next day's games once they're known. In God Mode each game
// still to come has two small tick boxes (ForceWin): tick a team and it wins when that day is simmed.
import { useState } from 'react';
import type { VM } from '../vm';
import { GOD_PINK, muted } from '../kit';
import { ForceWin } from '../ForceWin';

export function DailyScheduleScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, isMine } = vm.ctx;
  const days: [number, number][][] = gm.db.days || [], n = days.length;
  const results = (s.games || []).filter((g: any) => !g.po);
  const post: any[] = n ? gm.postSchedule(s) : [], postBy = new Map<number, any>(post.map(p => [p.day, p]));
  const slots = [...days.map((_, i) => i), ...post.map(p => p.day).filter(x => x >= n)];
  const inPost = s.phase === 'playin' || (s.phase === 'playoffs' && s.po?.champ == null);
  // The next day to be played: the current day in the regular season or the postseason, the first before it, the last after.
  const next = s.phase === 'regular' || (inPost && postBy.has(s.day)) ? s.day : s.phase === 'preseason' || !results.length ? 0 : slots[slots.length - 1];
  const [d0, setD] = useState<number>(next);
  if (!n) return <p style={{ ...muted, fontStyle: 'italic' }}>There’s no schedule yet.</p>;
  const d = slots.includes(d0) ? d0 : slots.reduce((b, x) => (Math.abs(x - d0) < Math.abs(b - d0) ? x : b), slots[0]), si = slots.indexOf(d), pd = d >= n ? postBy.get(d) : null;
  const games: [number, number][] = pd ? pd.games.filter((g: any) => g.h != null).map((g: any) => [g.h, g.a]) : days[d] || [];
  const tbd = pd ? pd.games.filter((g: any) => g.h == null) : [];
  const resOf = (h: number, a: number) => pd ? pd.games.find((g: any) => g.h === h && g.a === a)?.r : results.find((g: any) => g.day === d && g.h === h && g.a === a);
  const labelOf = (h: number, a: number) => pd?.games.find((g: any) => g.h === h && g.a === a)?.label || '';
  const played = games.filter(([h, a]) => resOf(h, a)).length;
  const isNext = d === next && (s.phase === 'regular' || inPost) && played < games.length;
  const simDay = () => (s.phase === 'playin' ? gm.simPlayin() : s.phase === 'playoffs' ? gm.simPo('game') : gm.sim(1));
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
        <button className="btn btn-secondary" disabled={si <= 0} onClick={() => setD(slots[si - 1])} style={{ width: 34, padding: '2px 0' }} aria-label="Previous day">‹</button>
        <select className="input" value={d} onChange={e => setD(+e.target.value)} style={{ width: 'auto', fontWeight: 600 }}>
          {slots.map(i => <option key={i} value={i}>{fmt(i)}{i >= n ? ' · ' + (postBy.get(i)?.stage || 'Playoffs') : ''}{i === next && (s.phase === 'regular' || inPost) ? ' (next)' : ''}</option>)}
        </select>
        <button className="btn btn-secondary" disabled={si >= slots.length - 1} onClick={() => setD(slots[si + 1])} style={{ width: 34, padding: '2px 0' }} aria-label="Next day">›</button>
        {(s.phase === 'regular' || inPost) && d !== next && slots.includes(next) && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setD(next)}>Today</button>}
        {pd && <b style={{ fontSize: '13px', color: 'var(--color-accent-700)' }}>{pd.stage}</b>}
        <span style={{ ...muted, fontSize: '12.5px' }}>{pd ? 'Postseason' : 'Day ' + (d + 1) + ' of ' + n} · {games.length + tbd.length} game{games.length + tbd.length === 1 ? '' : 's'}{played ? played === games.length ? ' · final' : ' · ' + played + ' played' : ''}{nPicked ? ' · ' : ''}{nPicked > 0 && <b style={{ color: GOD_PINK }}>{nPicked} forced</b>}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {nPicked > 0 && <button className="btn btn-ghost" style={{ fontSize: '12.5px', color: GOD_PINK }} onClick={() => gm.setState((st: any) => { const g = { ...(st.godWin || {}) }; games.forEach(([h, a]) => delete g[gm.Y + ':' + d + ':' + h + ':' + a]); return { godWin: g }; })}>Clear this day’s picks</button>}
          {isNext && <button className="btn btn-primary" style={{ fontSize: '12.5px' }} onClick={simDay}>Sim this day</button>}
        </span>
      </div>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr>
          <th style={td}>Away</th><th style={{ ...td, textAlign: 'right' }} /><th style={td} /><th style={td}>Home</th><th style={{ ...td, textAlign: 'right' }} />{pd && <th style={td}>Round</th>}<th style={{ ...td, textAlign: 'right' }}>{s.god && d >= next && (s.phase === 'regular' || inPost) ? <span style={{ color: GOD_PINK }}>Force a win</span> : ''}</th>
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
                {pd && <td style={{ ...td, ...muted, fontSize: '12px' }}>{labelOf(h, a)}</td>}
                <td style={{ ...td, textAlign: 'right' }}>
                  {box ? <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={() => gm.setState({ boxId: r.bid, boxTeam: isMine(a) ? a : h })}>Box score</button>
                    : <ForceWin vm={vm} day={d} h={h} a={a} />}
                </td>
              </tr>);
          })}
          {tbd.map((g: any, i: number) => (
            <tr key={'tbd' + i}><td style={{ ...td, ...muted, fontStyle: 'italic' }} colSpan={5}>{g.tbd}</td><td style={{ ...td, ...muted, fontSize: '12px' }}>{g.label}</td><td style={td} /></tr>))}
        </tbody>
      </table>
      <p style={{ ...muted, fontSize: '12px', marginTop: 10 }}>
        {pd ? 'Records are each team’s regular-season record. ' : 'Records before the game are each team’s current record. '}Click a team for its roster.
        {s.god ? ' God Mode: tick a team’s box to make it win that game when the day is simmed (untick to let the game decide). The game is still played out with a real box score. Your own games too, and you can tick them on your Team schedule as well.' : ''}
      </p>
    </>
  );
}

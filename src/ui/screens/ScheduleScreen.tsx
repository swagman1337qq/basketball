// Your schedule as a calendar, a month at a time: every game day with the opponent, and the score
// (green win, red loss; click it for the box score) or, for games still to come, their record.
// Your next game is highlighted with Watch and Quick sim. Play-in and playoff games follow on the
// calendar in April, May and June (Game.postSchedule), tagged with the round and game number; the
// plain list view is one click away. God Mode: games still to come have two small tick boxes
// (ForceWin) to make either team win.
import { useEffect, useState } from 'react';
import type { VM } from '../vm';
import { muted, Seg } from '../kit';
import { ForceWin } from '../ForceWin';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const key = (d: Date) => d.getFullYear() * 100 + d.getMonth();

export function ScheduleScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam } = vm.ctx, me = s.me;
  const [view, setView] = useState<'cal' | 'list'>(() => { try { return (localStorage.getItem('schedView') as any) || 'cal'; } catch { return 'cal'; } });
  const setV = (v: 'cal' | 'list') => { setView(v); try { localStorage.setItem('schedView', v); } catch { /* private mode */ } };
  // Every regular-season game day: the date, the opponent, and the result if it's been played; then
  // your play-in and playoff games, played or next up.
  const res = new Map<number, any>(gm.resultsOf(s, me).filter((r: any) => !r.po).map((r: any) => [r.day, r]));
  const inPost = s.phase === 'playin' || (s.phase === 'playoffs' && s.po?.champ == null);
  const played = T[me].w + T[me].l, today = s.phase === 'regular' ? played : inPost ? s.day : 999;
  const reg = Array.from({ length: 82 }, (_, d) => ({ d, date: gm.dateOf(d), g: gm.userGame(d, me), r: res.get(d), stage: '', label: '' }));
  const postDays = (gm.postSchedule(s) as any[]).flatMap(p => p.games.filter((x: any) => x.h === me || x.a === me).map((x: any) => {
    const home = x.h === me, r = x.r && { win: home ? x.r.hp > x.r.ap : x.r.ap > x.r.hp, us: home ? x.r.hp : x.r.ap, them: home ? x.r.ap : x.r.hp, bid: x.r.bid };
    return { d: p.day, date: gm.dateOf(p.day), g: { opp: home ? x.a : x.h, home }, r, stage: x.stage, label: x.label };
  }));
  const days = [...reg, ...postDays];
  const months = [...new Set(days.map(x => key(x.date)))];
  const curKey = key((days.find(x => x.d >= today) || days[days.length - 1]).date);
  const [mk, setMk] = useState<number>(months.includes(curKey) ? curKey : months[0]);
  // The calendar follows the season: when a sim carries your next game into a new month, turn the page.
  useEffect(() => { if (months.includes(curKey)) setMk(curKey); }, [curKey]);
  const mi = months.indexOf(mk), y = Math.floor(mk / 100), m = mk % 100;
  const first = new Date(y, m, 1), nDays = new Date(y, m + 1, 0).getDate(), lead = first.getDay();
  const byDate = new Map<number, typeof days[number]>(days.filter(x => key(x.date) === mk).map(x => [x.date.getDate(), x]));
  const monthGames = [...byDate.values()], w = monthGames.filter(x => x.r?.win).length, l = monthGames.filter(x => x.r && !x.r.win).length;
  const openBox = (r: any) => (r?.bid && (gm.db as any).boxes?.[r.bid] ? () => gm.setState({ boxId: r.bid, boxTeam: me }) : null);
  const SHORT: Record<string, string> = { 'Play-in': 'Play-in', 'First round': 'Round 1', 'Conference semifinals': 'Conf. semis', 'Conference finals': 'Conf. finals', Finals: 'Finals' };
  const simNext = () => (s.phase === 'playin' ? gm.simPlayin() : s.phase === 'playoffs' ? gm.simPo('game') : vm.quick1());

  const cell = (dn: number) => {
    const x = byDate.get(dn), isNext = !!x && x.d === today && !x.r && (s.phase === 'regular' || inPost), r = x?.r, ob = openBox(r);
    return (
      <div key={dn} style={{ minHeight: 92, border: '1px solid ' + (isNext ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 6, padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 4,
        background: isNext ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : r ? 'color-mix(in srgb, ' + (r.win ? 'var(--gm-good)' : 'var(--gm-bad)') + ' 7%, transparent)' : undefined }}>
        <div style={{ fontSize: '11px', ...muted, display: 'flex', justifyContent: 'space-between', gap: 4 }}><span>{dn}</span>{isNext ? <b style={{ color: 'var(--color-accent-700)' }}>NEXT</b> : x?.stage ? <b title={x.stage + (x.label ? ' · ' + x.label : '')} style={{ color: 'var(--color-accent-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SHORT[x.stage] || x.stage}{/Game (\d+)/.exec(x.label) ? ' G' + /Game (\d+)/.exec(x.label)![1] : ''}</b> : null}</div>
        {x && <>
          <button className="hv4" onClick={() => openTeam(x.g.opp)} title={T[x.g.opp].region + ' ' + T[x.g.opp].name} style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center', fontSize: '12.5px', fontWeight: 600 }}>
            <span style={{ ...muted, fontWeight: 400, fontSize: '11px' }}>{x.g.home ? 'vs' : '@'}</span>{logo(x.g.opp, 18)}{T[x.g.opp].abbr}
          </button>
          {r ? (ob ? <button className="hv4" onClick={ob} title="Box score" style={{ all: 'unset', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, color: r.win ? 'var(--gm-good)' : 'var(--gm-bad)', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{r.win ? 'W' : 'L'} {r.us}–{r.them}</button>
              : <span style={{ fontSize: '12.5px', fontWeight: 700, color: r.win ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{r.win ? 'W' : 'L'} {r.us}–{r.them}</span>)
            : isNext ? <span style={{ display: 'flex', gap: 4 }}><button className="btn btn-primary" onClick={vm.watch1} style={{ fontSize: '11px', padding: '1px 6px' }}>Watch</button><button className="btn btn-secondary" onClick={simNext} style={{ fontSize: '11px', padding: '1px 6px' }}>Sim</button></span>
            : <span style={{ ...muted, fontSize: '11.5px' }}>{x.stage && isNext ? '' : T[x.g.opp].w + '–' + T[x.g.opp].l}</span>}
          {x.stage && isNext && <span style={{ ...muted, fontSize: '10.5px' }}>{SHORT[x.stage] || x.stage}{/Game (\d+)/.exec(x.label) ? ' · Game ' + /Game (\d+)/.exec(x.label)![1] : ''}</span>}
          {!r && (!x.stage || isNext) && <ForceWin vm={vm} day={x.d} h={x.g.home ? me : x.g.opp} a={x.g.home ? x.g.opp : me} small />}
        </>}
      </div>);
  };

  return (<>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <Seg<'cal' | 'list'> value={view} options={[['cal', 'Calendar'], ['list', 'List']]} onChange={setV} />
      {view === 'cal' && <>
        <button className="btn btn-secondary" disabled={mi <= 0} onClick={() => setMk(months[mi - 1])} style={{ width: 34, padding: '2px 0' }} aria-label="Previous month">‹</button>
        <b style={{ fontSize: '17px', minWidth: 170, textAlign: 'center' }}>{MONTHS[m]} {y}</b>
        <button className="btn btn-secondary" disabled={mi >= months.length - 1} onClick={() => setMk(months[mi + 1])} style={{ width: 34, padding: '2px 0' }} aria-label="Next month">›</button>
        <span style={{ ...muted, fontSize: '12.5px' }}>{monthGames.length} game{monthGames.length === 1 ? '' : 's'}{w + l ? ' · ' + w + '–' + l + ' this month' : ''}{monthGames.some(x => x.stage) ? ' · postseason included' : ''}</span>
        {mk !== curKey && months.includes(curKey) && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setMk(curKey)}>Today</button>}
      </>}
    </div>
    {view === 'cal' ? <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 5 }}>
        {DOW.map(d => <div key={d} style={{ fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', ...muted, textAlign: 'center', paddingBottom: 2 }}>{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={'b' + i} />)}
        {Array.from({ length: nDays }, (_, i) => cell(i + 1))}
      </div>
    </> : <ListView vm={vm} />}
  </>);
}

// The plain list: results first (newest on top), then the next 15 games.
function ListView({ vm }: { vm: VM }) {
  return (
    <table className="table" style={{ fontSize: "13px" }}>
      <thead>
        <tr>
          <th style={{ padding: "6px 8px" }}>Date</th>
          <th style={{ padding: "6px 8px" }}>Opponent</th>
          <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>Their record</th>
          <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>Result</th>
        </tr>
      </thead>
      <tbody>
        {(vm.schedRows || []).map((r: any, i: number) => (
          <tr key={i} style={{ background: r.bg }}>
            <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)" }}>{r.date}</td>
            <td style={{ padding: "5px 8px" }}>
              <button className="hv4" onClick={r.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>{r.logo}{r.opp}</button>
            </td>
            <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>{r.rec}</td>
            <td style={{ padding: "3px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              {!!r.notNext && (r.openBox ? <button className="hv4" onClick={r.openBox} title="Box score" style={{ all: "unset", cursor: "pointer", color: r.resColor, fontWeight: 600, textDecoration: "underline dotted", textUnderlineOffset: 3 }}>{r.res}</button> : <span style={{ color: r.resColor, fontWeight: 600 }}>{r.res}</span>)}
              {r.day != null && <span style={{ marginRight: 10 }}><ForceWin vm={vm} day={r.day} h={r.h} a={r.a} /></span>}
              {!!r.isNext && <span style={{ display: "inline-flex", gap: "6px" }}>
                <button className="btn btn-primary" onClick={vm.watch1} style={{ fontSize: "12px", padding: "3px 12px" }}>Watch</button>
                <button className="btn btn-secondary" onClick={vm.quick1} style={{ fontSize: "12px", padding: "3px 12px" }}>Quick sim</button>
              </span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Preseason predictions from the (parody) media: every outlet's projected standings, title and
// award picks, and its top 100 players, with the results next to them once they're in.
import { useMemo, useState } from 'react';
import type { VM } from '../vm';
import { Kicker, Link, muted, ruleH4, Seg } from '../kit';
import { byLast, useSort } from '../sortable';
import { consensus, fmtOdds, mediaPreds, OUTLETS, PANEL, pastPreds, type SeasonPreds } from '../../engine/media';

const Badge = ({ k }: { k: string }) => { const o = OUTLETS.find(x => x.k === k)!; return <span title={o.style} style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 4, background: o.color, color: '#fff', fontSize: '11.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>{o.name}</span>; };

export function PredictionsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P;
  const past = pastPreds(gm), seasons = [...new Set([gm.Y, ...Object.keys(past).map(Number)])].sort((a, b) => b - a);
  const [yr, setYr] = useState(gm.Y), [tab, setTab] = useState<'picks' | 'top'>('picks'), [ok, setOk] = useState('cons'), [tk, setTk] = useState('cons');
  const sp: SeasonPreds | undefined = yr === gm.Y ? mediaPreds(gm, s) : past[yr];
  if (!sp) return null;
  const hist = (s.history || []).find((h: any) => h.year === yr), aw = (s.awards || {})[yr];
  const gp = gm.gamesPlayed(s), live = yr === gm.Y && !hist && gp > 0 && ['regular', 'playin', 'playoffs', 'lottery', 'draft', 'fa'].includes(s.phase);
  const actualW = (t: number): [number, number] | null => hist?.teams?.[t] ? [hist.teams[t].w, hist.teams[t].l] : live ? [T[t].w, T[t].l] : null;
  const pname = (pid?: number) => (pid != null && P[pid] ? <Link onClick={() => open(pid)}>{P[pid].name}</Link> : <span style={muted}>—</span>);
  const tname = (t?: number) => (t != null && T[t] ? <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', whiteSpace: 'nowrap' }}>{logo(t, 16)}<Link onClick={() => openTeam(t)}>{T[t].abbr}</Link></span> : <span style={muted}>—</span>);
  const conf = ['West', 'East'];
  // Consensus projected wins: the average of every outlet.
  const consW: Record<number, number> = {}; T.forEach((t: any) => (consW[t.tid] = Math.round(OUTLETS.reduce((a, o) => a + (sp.outlets[o.k]?.wins[t.tid] ?? 41), 0) / OUTLETS.length)));
  const winsOf = (k: string) => (k === 'cons' ? consW : sp.outlets[k].wins);
  // How each outlet did, once the season is over.
  const mae = (k: string) => { if (!hist) return null; const e = T.map((t: any) => { const a = actualW(t.tid); return a ? Math.abs(sp.outlets[k].wins[t.tid] - a[0] / Math.max(1, a[0] + a[1]) * 82) : 0; }); return e.reduce((a: number, x: number) => a + x, 0) / e.length; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Seg<'picks' | 'top'> value={tab} options={[['picks', 'Standings & awards'], ['top', 'Top 100 players']]} onChange={setTab} />
        {seasons.length > 1 && <Seg value={yr} options={seasons.map(y => [y, (y - 1) + '–' + String(y).slice(2)] as [number, string])} onChange={setYr} />}
        <span style={{ ...muted, fontSize: '12.5px' }}>{sp.locked ? 'Published before opening night' + (yr === gm.Y && !hist ? '; results fill in as the season goes.' : '.') : 'Updated through the preseason; the final predictions lock on opening night.'} All in fun: none of this affects the game.</span>
      </div>

      {tab === 'picks' && (<>
        <section>
          <h4 style={ruleH4}>The takes</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 10 }}>
            {OUTLETS.map(o => { const x = sp.outlets[o.k], m = mae(o.k); return (
              <div key={o.k} className="card" style={{ padding: '10px 12px', gap: 6, borderTop: '3px solid ' + o.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}><Badge k={o.k} />{hist && <span style={{ fontSize: '11.5px', ...muted }}>{hist.champ === x.champ ? '✓ called the champion · ' : ''}off by {m!.toFixed(1)} wins a team</span>}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{logo(x.champ, 30)}<div style={{ fontSize: '13px', lineHeight: 1.35 }}>“{x.line}”</div></div>
                <div style={{ fontSize: '11.5px', ...muted }}>{o.analyst.charAt(0).toUpperCase() + o.analyst.slice(1)} · {o.style}</div>
              </div>); })}
          </div>
        </section>

        <section style={{ overflowX: 'auto' }}>
          <h4 style={ruleH4}>The picks</h4>
          <table className="table" style={{ fontSize: '13px' }}>
            <thead><tr><th style={{ padding: '6px 8px' }}></th>{OUTLETS.map(o => <th key={o.k} style={{ padding: '6px 8px' }}><Badge k={o.k} /></th>)}{(hist || aw) && <th style={{ padding: '6px 8px' }}>Actual</th>}</tr></thead>
            <tbody>
              {([['Champion', (x: any) => tname(x.champ), hist?.champ != null ? tname(hist.champ) : null],
                ['Finals opponent', (x: any) => tname(x.runner), hist?.runner != null ? tname(hist.runner) : null],
                ['MVP', (x: any, k: string) => <>{pname(x.mvp[0])}{x.mvpOdds && <span style={{ ...muted, fontSize: '11.5px' }}> {fmtOdds(x.mvpOdds[x.mvp[0]])}</span>}</>, aw?.mvp?.[0] ? pname(aw.mvp[0].pid) : null],
                ['Defensive Player', (x: any) => pname(x.dpoy[0]), aw?.dpoy?.[0] ? pname(aw.dpoy[0].pid) : null],
                ['Rookie of the Year', (x: any) => pname(x.roy[0]), aw?.roy?.[0] ? pname(aw.roy[0].pid) : null]] as [string, (x: any, k: string) => any, any][]).map(([lab, f, act]) => (
                <tr key={lab}><td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{lab}</td>{OUTLETS.map(o => <td key={o.k} style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{f(sp.outlets[o.k], o.k)}</td>)}{(hist || aw) && <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', fontWeight: 600 }}>{act ?? <span style={muted}>—</span>}</td>}</tr>))}
            </tbody>
          </table>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <h4 style={{ ...ruleH4, margin: 0, border: 'none' }}>Projected standings</h4>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[['cons', 'Consensus'] as [string, string], ...OUTLETS.map(o => [o.k, o.name] as [string, string])].map(([k, n]) => <button key={k} className={'btn ' + (ok === k ? 'btn-primary' : 'btn-ghost')} onClick={() => setOk(k)} style={{ fontSize: '12px', padding: '3px 10px' }}>{n}</button>)}
            </div>
          </div>
          {ok !== 'cons' && <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 8px' }}>{OUTLETS.find(o => o.k === ok)!.style}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 18 }}>
            {conf.map(c => { const W = winsOf(ok), rows = T.filter((t: any) => t.conf === c).sort((a: any, b: any) => W[b.tid] - W[a.tid]); const act = rows.map((t: any) => actualW(t.tid)), arank = rows.map((t: any) => t.tid).sort((a: number, b: number) => { const x = actualW(a), y = actualW(b); return x && y ? y[0] / Math.max(1, y[0] + y[1]) - x[0] / Math.max(1, x[0] + x[1]) : 0; }); return (
              <div key={c}>
                <Kicker>{c}ern Conference</Kicker>
                <table className="table" style={{ fontSize: '13px' }}>
                  <thead><tr><th style={{ padding: '5px 8px', width: 26 }}>#</th><th style={{ padding: '5px 8px' }}>Team</th><th style={{ padding: '5px 8px', textAlign: 'right' }}>{ok === 'dq' ? 'Win total' : 'Proj.'}</th>{ok === 'dq' && <th style={{ padding: '5px 8px', textAlign: 'right' }}>Title</th>}{act.some(Boolean) && <th style={{ padding: '5px 8px', textAlign: 'right' }}>{hist ? 'Final' : 'Now'}</th>}</tr></thead>
                  <tbody>{rows.map((t: any, i: number) => { const a = act[i], ar = arank.indexOf(t.tid) + 1, d = ar - (i + 1); return (
                    <tr key={t.tid} style={{ borderTop: i === 6 || i === 10 ? '2px solid var(--color-divider)' : undefined, background: vm.ctx.isMine(t.tid) ? 'color-mix(in srgb, var(--color-accent) 7%, transparent)' : undefined }}>
                      <td style={{ padding: '4px 8px', ...muted }}>{i + 1}</td>
                      <td style={{ padding: '4px 8px' }}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{logo(t.tid, 18)}<Link onClick={() => openTeam(t.tid)}>{t.region} {t.name}</Link>{ok === 'fox' && sp.outlets.fox.frauds === t.tid && <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#fff', background: '#b3001b', padding: '0 5px', borderRadius: 3 }}>FRAUDS</span>}</span></td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{ok === 'dq' ? 'O/U ' + W[t.tid] : W[t.tid] + '–' + (82 - W[t.tid])}</td>
                      {ok === 'dq' && <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtOdds(sp.outlets.dq.odds![t.tid])}</td>}
                      {a && <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{a[0]}–{a[1]} <span style={{ fontSize: '11px', color: d < 0 ? 'var(--gm-good)' : d > 0 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{d === 0 ? '·' : d < 0 ? '▲' + -d : '▼' + d}</span></td>}
                    </tr>); })}</tbody>
                </table>
              </div>); })}
          </div>
          {live && <p style={{ ...muted, fontSize: '12px', marginTop: 6 }}>▲/▼: where the team stands now in its conference compared with the projection.</p>}
        </section>
      </>)}

      {tab === 'top' && <Top100 vm={vm} sp={sp} tk={tk} setTk={setTk} />}
    </div>
  );
}

function Top100({ vm, sp, tk, setTk }: { vm: VM; sp: SeasonPreds; tk: string; setTk: (k: string) => void }) {
  const { gm, s, T, logo, open } = vm.ctx, P = gm.db.P;
  const cons = useMemo(() => consensus(sp), [sp]), crank: Record<number, number> = {}; cons.forEach((c, i) => (crank[c.pid] = i + 1));
  const tidOf: Record<number, number> = {}; Object.keys(s.rosters).forEach(k => s.rosters[k].forEach((id: number) => (tidOf[id] = +k)));
  const prev = pastPreds(gm)[sp.season - 1], prevRank: Record<number, number> = {}; if (prev) consensus(prev).forEach((c, i) => (prevRank[c.pid] = i + 1));
  const ids = tk === 'cons' ? cons.map(c => c.pid) : sp.outlets[tk].top100;
  const rows = ids.filter(id => P[id]).map((id, i) => { const p = P[id], c = cons.find(x => x.pid === id); return { id, rk: i + 1, name: p.name, p, tid: tidOf[id], team: T[tidOf[id]]?.abbr || 'FA', pos: p.pos, age: p.age, ovr: p.ovr, cr: crank[id] ?? 101, range: c ? c.hi + (c.hi !== c.lo ? '–' + (c.lo > 100 ? 'NR' : c.lo) : '') : '—', ly: prevRank[id] ?? null }; });
  const srt = useSort<any>(rows, { rk: r => r.rk, name: r => byLast(r.p), team: r => r.team, pos: r => r.pos, age: r => r.age, ovr: r => r.ovr, cr: r => r.cr, ly: r => r.ly });
  return (
    <section>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cons', 'Consensus'] as [string, string], ...PANEL.map(o => [o.k, o.listName] as [string, string])].map(([k, n]) => <button key={k} className={'btn ' + (tk === k ? 'btn-primary' : 'btn-ghost')} onClick={() => setTk(k)} style={{ fontSize: '12px', padding: '3px 10px' }}>{n}</button>)}
      </div>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 8px' }}>{tk === 'cons' ? 'Average rank across the six outlets’ lists (left off a list counts as 101). Range: best and worst rank he got.' : PANEL.find(o => o.k === tk)!.style}</p>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr>{srt.head('rk', 'Rank', 'right')}{srt.head('name', 'Player')}{srt.head('team', 'Team')}{srt.head('pos', 'Pos')}{srt.head('age', 'Age', 'right')}{srt.head('ovr', 'Ovr', 'right')}{tk === 'cons' ? <th style={{ padding: '6px 8px', textAlign: 'right' }}>Range</th> : srt.head('cr', 'Consensus', 'right')}{prev && srt.head('ly', 'Last year', 'right')}</tr></thead>
        <tbody>{srt.rows.map((r: any) => { const d = tk === 'cons' ? 0 : r.cr - r.rk; return (
          <tr key={r.id}>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.rk}</td>
            <td style={{ padding: '4px 8px' }}><Link onClick={() => open(r.id)}>{r.name}</Link></td>
            <td style={{ padding: '4px 8px' }}><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>{r.tid != null && logo(r.tid, 16)}{r.team}</span></td>
            <td style={{ padding: '4px 8px' }}>{r.pos}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{r.age}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', color: vm.ctx.tone(r.ovr) }}>{r.ovr}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{tk === 'cons' ? r.range : <>{r.cr > 100 ? 'NR' : r.cr} {d !== 0 && <span style={{ fontSize: '11px', color: d > 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }} title={d > 0 ? 'Higher than consensus' : 'Lower than consensus'}>{d > 0 ? '▲' + d : '▼' + -d}</span>}</>}</td>
            {prev && <td style={{ padding: '4px 8px', textAlign: 'right' }}>{r.ly ?? 'NR'}</td>}
          </tr>); })}</tbody>
      </table>
    </section>
  );
}

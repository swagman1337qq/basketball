// The Continental Championship Pathway (CCP): the development league. Scroll through its clubs,
// every player with his CCP stats (and whether you can sign him, and how), the standings for the
// Tip-Off Tournament, Winter Showcase, regular season and playoffs, the schedule and the rules.
import { useState } from 'react';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { Link, muted, ruleH4, Seg, usePaged } from '../kit';
import { TeamLogo } from '../TeamLogo';
import { signingMethods } from '../../engine/cba';
import { CCP_KIND, ccpRoster, ccpStandings, fmtDn, type CcpGame, type CcpTeam } from '../../engine/ccp';

// The CCP mark: hammer and sickle.
export const CCP_PATHS = ['M14.6 4.4a7.6 7.6 0 1 1-9.4 10.5', 'M5.4 14.6 3 18.6', 'M7.8 7.8 18.4 18.4', 'M4.6 10 10 4.6'];
export function CcpMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="CCP">
      <circle cx="12" cy="12" r="11.5" fill="#b3141b" />
      <g transform="translate(1.6 1.2) scale(0.87)" fill="none" stroke="#f4c430" strokeWidth="2.3" strokeLinecap="round">{CCP_PATHS.map(d => <path key={d} d={d} />)}</g>
    </svg>
  );
}

const td: React.CSSProperties = { padding: '4px 8px' }, tr: React.CSSProperties = { padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' };
const pct = (m: number, a: number) => (a ? (100 * m / a).toFixed(1) : '—');

export function CcpScreen({ vm }: { vm: VM }) {
  const c = vm.ctx.s.ccp;
  if (!c) return <p style={muted}>The CCP season tips off in November. Rosters form when the NBA regular season starts.</p>;
  return <CcpInner vm={vm} c={c} />;
}

function CcpInner({ vm, c }: { vm: VM; c: any }) {
  const { gm, s, T, open } = vm.ctx, P = gm.db.P;
  const [tab, setTab] = useState<'teams' | 'players' | 'standings' | 'schedule' | 'rules'>('teams'), [ti, setTi] = useState(() => (c?.teams || []).findIndex((t: CcpTeam) => t.aff === s.me)), [onlySign, setOnlySign] = useState(false), [q, setQ] = useState('');
  const Y = c.season, teams: CcpTeam[] = c.teams, crest = (t: CcpTeam) => ({ region: t.city, name: t.name, abbr: t.abbr, colors: t.colors, icon: t.icon });
  const tName = (t: CcpTeam) => t.city + ' ' + t.name;
  const st = (p: any) => { const x = p.ccpS?.[Y]; return x ? { gp: x.gp, min: x.min / x.gp, pts: x.pts / x.gp, reb: (x.orb + x.drb) / x.gp, ast: x.ast / x.gp, stl: x.stl / x.gp, blk: x.blk / x.gp, fg: pct(x.fgm, x.fga), tp: pct(x.tpm, x.tpa) } : null; };
  // Who he belongs to and whether you can sign him.
  const status = (p: any) => {
    const nba = Object.keys(s.rosters).find(k => s.rosters[k].includes(p.id));
    if (nba != null) return { how: p.ctype === 'twoWay' ? 'Two-way · ' + T[+nba].abbr : 'Assigned by ' + T[+nba].abbr, sign: null as string[] | null, mine: +nba === s.me };
    // The deals that matter for a call-up, most likely first.
    const ORDER: [string, string][] = [['twoWay', 'Two-way'], ['min', 'Minimum'], ['tenDay', '10-day'], ['ex10', 'Exhibit 10'], ['hardship', 'Hardship'], ['cap', 'Cap space'], ['room', 'Room exception'], ['ntmle', 'Mid-level'], ['tpmle', 'Mid-level'], ['bae', 'Bi-annual']];
    const ok = new Set(signingMethods(gm, s, s.me, p).filter(m => m.ok).map(m => m.key));
    const ms = [...new Set(ORDER.filter(([k]) => ok.has(k)).map(([, l]) => l))];
    return { how: CCP_KIND[p.gl?.kind] || 'CCP contract', sign: ms, mine: false };
  };
  const signBtn = (p: any, x: any) => x.sign == null ? <span style={{ ...muted, fontSize: '11.5px' }}>{x.mine ? 'Yours' : 'Not available'}</span>
    : x.sign.length ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><button className="btn btn-primary" style={{ fontSize: '11.5px', padding: '2px 9px' }} onClick={() => gm.setState({ dialog: { type: 'sign', pid: p.id } })}>Sign…</button><span style={{ ...muted, fontSize: '11px' }}>{x.sign.slice(0, 3).join(' · ')}</span></span>
      : <span style={{ ...muted, fontSize: '11.5px' }} title="No contract type fits your roster and cap right now">No room</span>;

  const games: CcpGame[] = c.games, played = games.filter(x => x.hs != null).length;
  const stage = !games.some(x => x.st === 'tip' && x.hs != null) ? 'Tip-Off Tournament starts ' + fmtDn(Y, games[0]?.dn ?? 37) : !c.showcase ? 'Tip-Off Tournament' : !c.showcase.champ ? 'Winter Showcase' : !c.po ? 'Regular season' : !c.po.champ ? 'Playoffs' : 'Season over · champion ' + tName(teams[c.po.champ]);
  const tipSt = ccpStandings(s, 'tip'), regSt = ccpStandings(s, 'reg'), recOf = (arr: any[], id: number) => { const r = arr.find(x => x.id === id); return r ? r.w + '–' + r.l : '0–0'; };

  // ── Players (every club) ──
  const allRows = teams.flatMap(t => ccpRoster(gm, s, t).map(id => ({ id, t, p: P[id], x: status(P[id]), s: st(P[id]) })))
    .filter(r => (!onlySign || (r.x.sign && r.x.sign.length)) && (!q || r.p.name.toLowerCase().includes(q.toLowerCase())));
  const srt = useSort<any>(allRows, { name: r => byLast(r.p), team: r => r.t.abbr, pos: r => r.p.pos, age: r => r.p.age, ovr: r => r.p.ovr, pot: r => r.p.pot, gp: r => r.s?.gp ?? 0, pts: r => r.s?.pts ?? 0, reb: r => r.s?.reb ?? 0, ast: r => r.s?.ast ?? 0 }, ['pts', -1]);
  const cur = teams[Math.max(0, ti)] || teams[0], roster = cur ? ccpRoster(gm, s, cur).map(id => P[id]).sort((a, b) => (st(b)?.pts ?? 0) - (st(a)?.pts ?? 0) || b.ovr - a.ovr) : [];
  const cycle = (d: number) => setTi(i => ((Math.max(0, i) + d) % teams.length + teams.length) % teams.length);
  const gRow = (x: CcpGame, i: number) => { const H = teams[x.h], A = teams[x.a], done = x.hs != null; return (
    <tr key={i}><td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtDn(Y, x.dn)}</td><td style={td}>{{ tip: 'Tip-Off', show: 'Showcase', reg: 'Season', po: x.rd === 4 ? 'Finals' : 'Playoffs' }[x.st]}</td>
      <td style={td}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><TeamLogo team={crest(A) as any} size={16} />{A.city}</span> <span style={muted}>at</span> <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><TeamLogo team={crest(H) as any} size={16} />{H.city}</span></td>
      <td style={tr}>{done ? <b>{x.as}–{x.hs}{x.ot ? ' OT' : ''}</b> : '—'}</td>
      <td style={{ ...td, ...muted, fontSize: '11.5px' }}>{done && x.top ? [[x.top[2], x.top[3]], [x.top[0], x.top[1]]].map(([id, pts]) => P[id] ? P[id].name.split(' ').slice(-1)[0] + ' ' + pts : '').join(' · ') : ''}</td></tr>); };

  const pg = usePaged(srt.rows, 'players', 30, srt.sortKey);
  return (
    <>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
        <CcpMark size={52} />
        <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>The CCP · {Y - 1}–{String(Y).slice(2)}</div>
          <div style={{ ...muted, fontSize: '13px' }}>{teams.length} clubs · {stage} · {played} of {games.length} games played</div></div>
      </div>
      <div style={{ marginBottom: 12 }}><Seg<any> value={tab} options={[['teams', 'Teams'], ['players', 'Players'], ['standings', 'Standings'], ['schedule', 'Schedule'], ['rules', 'How it works']]} onChange={setTab} /></div>

      {tab === 'teams' && cur && (<>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button className="btn btn-ghost" onClick={() => cycle(-1)} aria-label="Previous club" style={{ fontSize: 20, padding: '2px 10px' }}>‹</button>
          <select className="input" value={cur.id} onChange={e => setTi(+e.target.value)} style={{ minWidth: 0, flex: '0 1 380px', fontFamily: 'var(--font-heading)', fontSize: 16 }}>
            {teams.map(t => <option key={t.id} value={t.id}>{tName(t)} · {t.where || 'Independent'}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => cycle(1)} aria-label="Next club" style={{ fontSize: 20, padding: '2px 10px' }}>›</button>
          <span style={{ ...muted, fontSize: '12.5px' }}>{cur.id + 1} of {teams.length}</span>
        </div>
        <section style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 14px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', marginBottom: 14, borderLeft: '4px solid ' + cur.colors[0] }}>
          <TeamLogo team={crest(cur) as any} size={64} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>{tName(cur)} <span style={{ ...muted, fontSize: '13px' }}>{cur.abbr}</span></div>
            <div style={{ fontSize: '13px' }}>{cur.city}{cur.where ? ', ' + cur.where : ''} · {cur.conf}ern Conference · {cur.region} region</div>
            <div style={{ ...muted, fontSize: '12.5px', marginTop: 2 }}>{cur.note}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div>{cur.aff != null ? <Link onClick={() => vm.ctx.openTeam(cur.aff!)}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>Affiliate of {T[cur.aff].region} {T[cur.aff].name}</span></Link> : <b>Independent club</b>}</div>
            <div style={muted}>Tip-Off {recOf(tipSt, cur.id)} · Season {recOf(regSt, cur.id)}</div>
          </div>
        </section>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr><th style={td}>Player</th><th style={td}>Pos</th><th style={tr}>Age</th><th style={tr}>Ovr</th><th style={tr}>Pot</th><th style={td}>Contract</th><th style={tr}>GP</th><th style={tr}>MIN</th><th style={tr}>PTS</th><th style={tr}>REB</th><th style={tr}>AST</th><th style={tr}>STL</th><th style={tr}>BLK</th><th style={tr}>FG%</th><th style={tr}>3P%</th><th style={td}>Sign him</th></tr></thead>
          <tbody>{roster.map(p => { const x = status(p), a = st(p); return (
            <tr key={p.id}><td style={td}><Link onClick={() => open(p.id)}>{p.name}</Link></td><td style={td}>{p.pos}</td><td style={tr}>{p.age}</td><td style={{ ...tr, fontWeight: 600 }}>{p.ovr}</td><td style={tr}>{p.pot}</td><td style={{ ...td, fontSize: '11.5px' }}>{x.how}</td>
              <td style={tr}>{a?.gp ?? 0}</td><td style={tr}>{a ? a.min.toFixed(1) : '—'}</td><td style={{ ...tr, fontWeight: 600 }}>{a ? a.pts.toFixed(1) : '—'}</td><td style={tr}>{a ? a.reb.toFixed(1) : '—'}</td><td style={tr}>{a ? a.ast.toFixed(1) : '—'}</td><td style={tr}>{a ? a.stl.toFixed(1) : '—'}</td><td style={tr}>{a ? a.blk.toFixed(1) : '—'}</td><td style={tr}>{a?.fg ?? '—'}</td><td style={tr}>{a?.tp ?? '—'}</td>
              <td style={td}>{signBtn(p, x)}</td></tr>); })}</tbody>
        </table>
        <h4 style={{ ...ruleH4, marginTop: 16 }}>{cur.city} schedule</h4>
        <table className="table" style={{ fontSize: '12.5px' }}><tbody>
          {(() => { const mine = games.filter(x => x.h === cur.id || x.a === cur.id), past = mine.filter(x => x.hs != null).slice(-5), next = mine.filter(x => x.hs == null).slice(0, 5); return [...past, ...next].map(gRow); })()}
        </tbody></table>
      </>)}

      {tab === 'players' && (<>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search CCP players…" style={{ width: 220, fontSize: 13 }} />
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={onlySign} onChange={e => setOnlySign(e.target.checked)} />Only players you can sign now</label>
          <span style={{ ...muted, fontSize: '12.5px' }}>{allRows.length} players</span>
        </div>
        <div style={{ maxHeight: 640, overflowY: 'auto', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
          <table className="table" style={{ fontSize: '12.5px' }}>
            <thead><tr>{[['name', 'Player', 'left'], ['team', 'Club', 'left'], ['pos', 'Pos', 'left'], ['age', 'Age', 'right'], ['ovr', 'Ovr', 'right'], ['pot', 'Pot', 'right'], ['gp', 'GP', 'right'], ['pts', 'PTS', 'right'], ['reb', 'REB', 'right'], ['ast', 'AST', 'right']].map(([k, l, al]) => srt.head(k, l, al as any, { position: 'sticky', top: 0, background: 'var(--color-bg)' }))}<th style={{ ...td, position: 'sticky', top: 0, background: 'var(--color-bg)' }}>Contract</th><th style={{ ...td, position: 'sticky', top: 0, background: 'var(--color-bg)' }}>Sign him</th></tr></thead>
            <tbody>{pg.rows.map((r: any) => (
              <tr key={r.id}><td style={td}><Link onClick={() => open(r.id)}>{r.p.name}</Link></td><td style={td}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }} onClick={() => { setTi(r.t.id); setTab('teams'); }}><TeamLogo team={crest(r.t) as any} size={16} />{r.t.abbr}</span></td><td style={td}>{r.p.pos}</td><td style={tr}>{r.p.age}</td><td style={{ ...tr, fontWeight: 600 }}>{r.p.ovr}</td><td style={tr}>{r.p.pot}</td>
                <td style={tr}>{r.s?.gp ?? 0}</td><td style={{ ...tr, fontWeight: 600 }}>{r.s ? r.s.pts.toFixed(1) : '—'}</td><td style={tr}>{r.s ? r.s.reb.toFixed(1) : '—'}</td><td style={tr}>{r.s ? r.s.ast.toFixed(1) : '—'}</td>
                <td style={{ ...td, fontSize: '11.5px' }}>{r.x.how}</td><td style={td}>{signBtn(r.p, r.x)}</td></tr>))}</tbody>
          </table>
        </div>
        {pg.pager}
      </>)}

      {tab === 'standings' && (<>
        <h4 style={ruleH4}>Tip-Off Tournament</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 14 }}>
          {Array.from(new Set(teams.map(t => t.region))).map(rg => (
            <div key={rg}><div style={{ fontWeight: 600, marginBottom: 4 }}>{rg} region</div>
              <table className="table" style={{ fontSize: '12.5px' }}><tbody>{tipSt.filter((r: any) => teams[r.id].region === rg).map((r: any) => (
                <tr key={r.id} style={{ background: c.showcase?.seeds?.includes(r.id) ? 'var(--color-accent-100)' : undefined }}><td style={td}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }} onClick={() => { setTi(r.id); setTab('teams'); }}><TeamLogo team={crest(teams[r.id]) as any} size={16} />{teams[r.id].city}</span></td><td style={tr}>{r.w}–{r.l}</td></tr>))}</tbody></table></div>))}
        </div>
        {c.showcase && <p style={{ fontSize: 13 }}><b>Winter Showcase:</b> {c.showcase.champ != null ? 'won by the ' + tName(teams[c.showcase.champ]) : 'in progress'} (qualifiers highlighted).</p>}
        <h4 style={{ ...ruleH4, marginTop: 14 }}>Regular season</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
          {['West', 'East'].map(cf => (
            <div key={cf}><div style={{ fontWeight: 600, marginBottom: 4 }}>{cf}ern Conference</div>
              <table className="table" style={{ fontSize: '12.5px' }}><tbody>{regSt.filter((r: any) => teams[r.id].conf === cf).map((r: any, i: number) => (
                <tr key={r.id} style={{ borderBottom: i === 7 ? '1px solid var(--color-accent)' : undefined }}><td style={{ ...td, ...muted, width: 24 }}>{i + 1}</td><td style={td}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }} onClick={() => { setTi(r.id); setTab('teams'); }}><TeamLogo team={crest(teams[r.id]) as any} size={16} />{tName(teams[r.id])}</span></td><td style={tr}>{r.w}–{r.l}</td><td style={{ ...tr, ...muted }}>{r.pf - r.pa > 0 ? '+' : ''}{r.pf - r.pa}</td></tr>))}</tbody></table></div>))}
        </div>
        {c.po && <p style={{ fontSize: 13, marginTop: 12 }}><b>Playoffs:</b> {c.po.champ != null ? 'the ' + tName(teams[c.po.champ]) + ' won the CCP championship' : 'in progress'}.</p>}
        {(c.hist || []).length > 0 && (<><h4 style={{ ...ruleH4, marginTop: 14 }}>Past champions</h4>
          <table className="table" style={{ fontSize: '12.5px' }}><tbody>{c.hist.map((h: any) => <tr key={h.season}><td style={td}>{h.season - 1}–{String(h.season).slice(2)}</td><td style={td}>🏆 {h.champ}</td><td style={{ ...td, ...muted }}>Showcase: {h.showcase || '—'}</td></tr>)}</tbody></table></>)}
      </>)}

      {tab === 'schedule' && (() => { const done = games.filter(x => x.hs != null).slice(-20).reverse(), next = games.filter(x => x.hs == null).slice(0, 20); return (<>
        <h4 style={ruleH4}>Latest results</h4>
        {done.length ? <table className="table" style={{ fontSize: '12.5px' }}><tbody>{done.map(gRow)}</tbody></table> : <p style={muted}>No games yet.</p>}
        <h4 style={{ ...ruleH4, marginTop: 14 }}>Coming up</h4>
        {next.length ? <table className="table" style={{ fontSize: '12.5px' }}><tbody>{next.map(gRow)}</tbody></table> : <p style={muted}>The season is over.</p>}
      </>); })()}

      {tab === 'rules' && (
        <div style={{ fontSize: 13.5, maxWidth: 760, lineHeight: 1.55 }}>
          <p>The CCP is the league’s development league, run like the NBA G League. Every NBA club has an affiliate in a fading steel or coal town, a ghost town, a reservation town or one of the most isolated places in the U.S. (a few are in the Canadian north), and one club (the {teams.find(t => t.aff == null) ? tName(teams.find(t => t.aff == null)!) : 'independent'}) has no NBA parent.</p>
          <p><b>Season.</b> A 14-game Tip-Off Tournament (Nov 7 – Dec 16) in four regions. The best team in each region and the next four best records play the single-elimination Winter Showcase (Dec 19–22). Records reset for a 36-game regular season (Dec 27 – Mar 28). The top eight in each conference make the playoffs: single games through the conference finals, then a best-of-three Finals (Apr 8–12).</p>
          <p><b>Rosters.</b> Each club carries 10–12 players on CCP contracts, plus its parent club’s two-way players and anyone it sends down for game reps. CCP contracts come from the player pool, local tryouts, the CCP draft, returning rights (last season’s players) and affiliate players (up to 5 players the parent club waived from training camp).</p>
          <p><b>Signing.</b> A player on a CCP contract is a free agent to the NBA: any team can sign him at any time (a call-up) on a standard deal, a two-way (3 per team, 50% of the rookie minimum, up to 50 NBA games), a 10-day or an Exhibit 10 in the offseason. Two-way and assigned players belong to their NBA team and can’t be signed. Playing time here helps young players develop.</p>
        </div>
      )}
    </>
  );
}

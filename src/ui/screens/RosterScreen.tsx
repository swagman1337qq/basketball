// Roster: any team, any season. The header has the team's record, conference rank, team
// rating, margin of victory, average age, roster spots, payroll, cap and profit, the cap
// indicator, play-through-injury settings, sorting, a team note and the assistant coaches'
// lineup advice. The table has jersey numbers, a starter/bench color block, badges with
// hover cards, a minutes control and moods that explain themselves. Players are grouped
// by NBA roster rules: 15 standard contracts (10-days and hardship included), up to 3
// two-way players and, in the offseason, Exhibit 10 camp deals.
import { useState } from 'react';
import type { VM } from '../vm';
import { LockerRoomChip } from '../LockerRoom';
import { BadgeChip } from '../BadgeChip';
import { CapBar } from '../CapBar';
import { MoodChip } from '../MoodChip';
import { badgesOf, teamRating } from '../../engine/ratings';
import { nums, rosterMax, stdIds, TWO_WAY_MAX, twoWayIds } from '../../engine/cba';
import { financesOf } from '../../engine/frontOffice';
import { fmtMoney } from '../../engine/capModel';
import { applyAdvice, lineupAdvice, type Advice } from '../../engine/assistants';
import { Game } from '../../engine/Game';
import { Link, muted, NumInput } from '../kit';

const PTI: [number, string][] = [[0, 'Only fully healthy players'], [1, '1 day'], [2, '2 days'], [3, '3 days'], [4, '4 days'], [7, '1 week'], [14, '2 weeks'], [99, 'Any injury']];
const perfOf = (d: number) => (d === 0 ? '' : ' (' + Math.max(80, 100 - Math.min(d, 8) * 2.5) + '% performance)');
const td: React.CSSProperties = { padding: '4px 7px', borderBottom: '1px solid var(--color-divider)' }, tdr: React.CSSProperties = { ...td, textAlign: 'right' };

export function RosterScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam, isMine } = vm.ctx, P = gm.db.P;
  const [view, setView] = useState<{ tid: number; season: number }>({ tid: s.me, season: gm.Y });
  const [advice, setAdvice] = useState<Advice | null>(null);
  const tid = T[view.tid] ? view.tid : s.me, season = view.season, cur = season === gm.Y, mine = isMine(tid) && cur;
  const t = T[tid], first = gm.db.firstSeason || 2027, seasons = Array.from({ length: gm.Y - first + 1 }, (_, i) => gm.Y - i);
  const setTid = (x: number) => { setView({ tid: (x + T.length) % T.length, season }); setAdvice(null); };
  const club = gm.clubOf(s, tid), pti = club?.ptInj || { reg: 0, po: 4 };
  const setClub = (f: any) => gm.setState(st => gm.clubPatch(st, tid, f));
  // ── Header numbers ──
  const hist = (s.history || []).find((h: any) => h.year === season)?.teams?.[tid];
  const rec = cur ? t.w + '–' + t.l : hist?.rec || '—';
  const conf = T.filter(x => x.conf === t.conf).sort((a, b) => gm.pct(b) - gm.pct(a) || b.w - a.w), rank = conf.indexOf(t) + 1, lead = conf[0];
  const gb = cur && rank > 1 ? ((lead.w - t.w + t.l - lead.l) / 2).toFixed(1).replace('.0', '') + ' GB' : '';
  const games = (s.games || []).filter((x: any) => !x.po && (x.h === tid || x.a === tid)), mov = cur && games.length ? games.reduce((a: number, x: any) => a + (x.h === tid ? x.hp - x.ap : x.ap - x.hp), 0) / games.length : null;
  const ids: number[] = cur ? s.rosters[tid] || [] : (Object.values(P) as any[]).filter(p => (p.stats || []).some((r: any) => r.season === season && r.tid === tid && !r.po)).map(p => p.id);
  const ageOf = (p: any) => (cur ? p.age : p.age - (gm.Y - season));
  const avgAge = ids.length ? ids.reduce((a, id) => a + ageOf(P[id]), 0) / ids.length : 0;
  const tr = teamRating(P, cur ? ids : []), trRank = cur ? 1 + T.filter(x => teamRating(P, s.rosters[x.tid] || []) > tr).length : 0;
  const N = nums(gm), std = stdIds(gm, ids), tw = twoWayIds(gm, ids), lim = rosterMax(s), fin = cur ? financesOf(gm, s, tid) : null;
  // ── Rows ──
  const line = (p: any) => { if (cur) return { gp: p.gp || 0, min: p.min || 0, pts: p.pts || 0, reb: p.reb || 0, ast: p.ast || 0, per: p.per || 0 };
    const rs = (p.stats || []).filter((r: any) => r.season === season && r.tid === tid && !r.po), tot: any = rs.reduce((a: any, r: any) => { Object.keys(r).forEach(k => { if (typeof r[k] === 'number') a[k] = (a[k] || 0) + r[k]; }); return a; }, {});
    const g = tot.gp || 1; return { gp: tot.gp || 0, min: tot.min / g, pts: tot.pts / g, reb: ((tot.orb || 0) + (tot.drb || 0)) / g, ast: tot.ast / g, per: gm.perOf(tot, season) }; };
  const healthy = ids.filter(id => !P[id].inj && !P[id].dev), rotOf = (id: number) => Math.round(P[id].rot ?? Game.ROTATION[healthy.indexOf(id)] ?? 0);
  const move = (id: number, targetId: number | null, after = false) => gm.setState(st => { const o = st.rosters[tid].filter((x: number) => x !== id); let at = targetId == null ? o.length : o.indexOf(targetId) + (after ? 1 : 0); if (at < 0) at = o.length; o.splice(at, 0, id); return { rosters: { ...st.rosters, [tid]: o }, dragId: null, overId: null }; });
  const [drag, setDrag] = useState<number | null>(null);
  const mainIds = ids.filter(id => P[id].ctype !== 'twoWay' && P[id].ctype !== 'ex10'), ex10 = ids.filter(id => P[id].ctype === 'ex10');
  const startersSet = new Set(cur ? mainIds.slice(0, 5) : []);
  const tag = (p: any) => ({ tenDay: '10-day', hardship: 'Hardship', ex10: 'Exhibit 10', twoWay: 'Two-way' } as any)[p.ctype];
  const Row = ({ id, i, list }: { id: number; i: number; list: number[] }) => {
    const p = P[id], ln = line(p), md = cur && isMine(tid) ? gm.moodOf(p, ids.indexOf(id), s, tid) : null, start = startersSet.has(id), bs = badgesOf(p).slice(0, 3);
    const block = start ? 'var(--gm-good)' : p.ctype === 'twoWay' ? '#6b8fd6' : p.ctype === 'ex10' ? 'var(--color-accent)' : 'var(--color-neutral-400)';
    return (
      <tr key={id} onClick={() => open(id)} draggable={mine} onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag(id); }} onDragOver={e => { if (mine) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (drag != null && drag !== id) move(drag, id); setDrag(null); }}
        style={{ cursor: 'pointer', background: drag === id ? 'var(--color-accent-100)' : undefined, borderBottom: i === 4 && list === mainIds && cur ? '2px solid var(--color-text)' : undefined }}>
        <td style={{ ...td, padding: 0, width: 6, background: block, opacity: p.inj && !p.inj.dtd ? 0.4 : 1 }} title={start ? 'Starter' : p.ctype === 'twoWay' ? 'Two-way' : 'Bench'} />
        {mine && <td style={{ ...td, whiteSpace: 'nowrap', padding: '2px 3px' }} onClick={e => e.stopPropagation()}>
          <span style={{ cursor: 'grab', color: 'var(--color-neutral-500)', padding: '0 3px' }}>⋮⋮</span>
          <button className="hv5" title="Move up" onClick={() => i > 0 && move(id, list[i - 1])} style={{ all: 'unset', cursor: 'pointer', padding: '0 3px', color: 'var(--color-neutral-600)' }}>↑</button>
          <button className="hv5" title="Move down" onClick={() => i < list.length - 1 && move(id, list[i + 1], true)} style={{ all: 'unset', cursor: 'pointer', padding: '0 3px', color: 'var(--color-neutral-600)' }}>↓</button>
        </td>}
        <td style={{ ...tdr, fontFamily: 'var(--font-heading)', fontSize: '15px', width: 34 }} title="Jersey number">{p.numTid === tid || cur ? p.num : ''}</td>
        <td style={{ ...td }}>
          <span style={{ display: 'inline-flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img src={gm.flag(p.rep)} alt="" title={gm.db.C[p.rep]?.n} style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />
            <span style={{ color: 'var(--color-accent-700)', fontWeight: start ? 600 : 400 }}>{p.name}</span>
            {p.native && <span style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>({p.native})</span>}
            {cur && bs.map(b => <BadgeChip key={b.key} b={b} small />)}
            {tag(p) && <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: 999, border: '1px solid var(--color-divider)', color: 'var(--color-neutral-700)' }}>{tag(p)}{p.ctype === 'twoWay' ? ' · ' + (p.twoWay?.games || 0) + '/50 g' : ''}</span>}
            {cur && p.inj && <span style={{ fontSize: '11px', color: 'var(--gm-bad)' }}>{p.inj.dtd ? 'Day-to-day' : 'Out ' + p.inj.games + 'g'} · {p.inj.name}</span>}
          </span>
        </td>
        <td style={td}>{p.pos}</td>
        <td style={tdr}>{ageOf(p)}</td>
        <td style={{ ...tdr, color: vm.ctx.tone(p.ovr), fontWeight: 600 }}>{p.ovr}</td>
        <td style={{ ...tdr, color: vm.ctx.tone(p.pot) }}>{p.pot}</td>
        {cur && <td style={tdr}>{fmtMoney(p.amt)}</td>}
        {cur && <td style={tdr}>{p.exp}</td>}
        {mine && <td style={{ ...tdr, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()} title="Target minutes per game (blank = automatic by rotation slot)">
          <NumInput value={rotOf(id)} min={0} max={48} step={1} width={52} onValue={v => { P[id].rot = v; gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }} />
          {P[id].rot != null && <button className="btn btn-ghost" title="Back to automatic" onClick={() => { delete P[id].rot; gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }} style={{ fontSize: '10px', padding: '0 4px' }}>auto</button>}
        </td>}
        <td style={tdr}>{ln.gp}</td>
        <td style={tdr}>{ln.min.toFixed(1)}</td>
        <td style={tdr}>{ln.pts.toFixed(1)}</td>
        <td style={tdr}>{ln.reb.toFixed(1)}</td>
        <td style={tdr}>{ln.ast.toFixed(1)}</td>
        <td style={tdr}>{ln.per.toFixed(1)}</td>
        {md && <td style={{ ...td, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}><MoodChip label={md.hapLabel} color={md.hapColor} factors={md.factors} name={p.name} p={p} /></td>}
      </tr>
    );
  };
  const Head = () => (
    <thead><tr>
      <th style={{ width: 6, padding: 0 }} />{mine && <th />}<th style={{ ...tdr, fontWeight: 600 }}>#</th><th style={{ ...td, fontWeight: 600, textAlign: 'left' }}>Player</th><th style={{ ...td, textAlign: 'left' }}>Pos</th><th style={tdr}>Age</th><th style={tdr}>Ovr</th><th style={tdr}>Pot</th>
      {cur && <th style={tdr}>Contract</th>}{cur && <th style={tdr}>Exp</th>}{mine && <th style={tdr} title="Target minutes per game">Min target</th>}
      <th style={tdr}>GP</th><th style={tdr}>Min</th><th style={tdr}>Pts</th><th style={tdr}>Reb</th><th style={tdr}>Ast</th><th style={tdr}>PER</th>{cur && isMine(tid) && <th style={{ ...td, textAlign: 'left' }}>Mood</th>}
    </tr></thead>
  );
  const note = (s.teamNotes || {})[tid] || '';
  const [noteOpen, setNoteOpen] = useState(false);
  const pastIds = cur ? [] : ids.slice().sort((a, b) => line(P[b]).min * line(P[b]).gp - line(P[a]).min * line(P[a]).gp);
  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button className="btn btn-secondary" onClick={() => setTid(tid - 1)} style={{ padding: '3px 9px' }} aria-label="Previous team">‹</button>
        <button className="btn btn-secondary" onClick={() => setTid(tid + 1)} style={{ padding: '3px 9px' }} aria-label="Next team">›</button>
        <select className="input" value={tid} onChange={e => { setView({ tid: +e.target.value, season }); setAdvice(null); }} style={{ width: 'auto', minWidth: 220 }}>{T.map(x => <option key={x.tid} value={x.tid}>{x.region} {x.name}{isMine(x.tid) ? ' (yours)' : ''}</option>)}</select>
        <button className="btn btn-secondary" onClick={() => setView({ tid, season: Math.max(first, season - 1) })} style={{ padding: '3px 9px' }} aria-label="Previous season">‹</button>
        <button className="btn btn-secondary" onClick={() => setView({ tid, season: Math.min(gm.Y, season + 1) })} style={{ padding: '3px 9px' }} aria-label="Next season">›</button>
        <select className="input" value={season} onChange={e => setView({ tid, season: +e.target.value })} style={{ width: 'auto' }}>{seasons.map(y => <option key={y} value={y}>{y - 1}–{String(y).slice(2)}</option>)}</select>
        {tid !== s.me && <Link onClick={() => setView({ tid: s.me, season: gm.Y })} style={{ marginLeft: 6, fontSize: '12.5px' }}>Back to my team</Link>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: '22px', alignItems: 'start', marginBottom: '14px' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => openTeam(tid)}>{logo(tid, 110)}</div>
        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>{t.region} {t.name}</div>
          <div>Record: <b style={{ color: cur && t.w >= t.l ? 'var(--gm-good)' : undefined }}>{rec}</b>{hist?.fin ? ' · ' + hist.fin : ''}</div>
          {cur && <div>{rank}{['st', 'nd', 'rd'][rank - 1] || 'th'} in the {t.conf}{gb ? ', ' + gb : ''}</div>}
          {cur && <div>Team rating: <b>{tr}</b>/100 <span style={muted}>({trRank}{['st', 'nd', 'rd'][trRank - 1] || 'th'} of {T.length})</span></div>}
          <div>{mov != null && <>MOV: <b style={{ color: mov >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{mov >= 0 ? '+' : ''}{mov.toFixed(1)}</b> · </>}Average age {avgAge.toFixed(1)}</div>
          <div>Locker room: <LockerRoomChip vm={vm} tid={tid} /></div>
          {cur && <div style={{ marginTop: 6 }}>{Math.max(0, lim - std.length)} open roster spot{lim - std.length === 1 ? '' : 's'} ({std.length}/{lim}) · two-way {tw.length}/{TWO_WAY_MAX}{ex10.length ? ' · Exhibit 10 ' + ex10.length : ''}</div>}
          {fin && <div>Payroll {fmtMoney(fin.payroll)} · Salary cap {fmtMoney(N.CAP)} · Profit <b style={{ color: fin.net >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{fmtMoney(fin.net)}</b></div>}
        </div>
        {mine && <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }} title="How long an injury has to be before a player sits. Players who play through an injury perform worse.">Play through injuries</div>
          {(['reg', 'po'] as const).map(k => <div key={k} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={muted}>{k === 'reg' ? 'Regular season' : 'Playoffs'}</span>
            <span><select className="input" value={pti[k]} onChange={e => setClub({ ptInj: { ...pti, [k]: +e.target.value } })} style={{ fontSize: '12.5px', width: 'auto' }}>{PTI.map(([d, l]) => <option key={d} value={d}>{l}</option>)}</select><span style={{ ...muted, fontSize: '11.5px' }}>{perfOf(pti[k])}</span></span>
          </div>)}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: '12.5px' }} onClick={() => gm.setState(st => ({ rosters: { ...st.rosters, [tid]: gm.autoSorted(st.rosters[tid]) } }))}>Auto sort roster</button>
            <button className="btn btn-secondary" style={{ fontSize: '12.5px' }} onClick={() => { ids.forEach(id => delete P[id].rot); gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }}>Reset playing time</button>
            <button data-tour="advice" className="btn btn-primary" style={{ fontSize: '12.5px' }} onClick={() => setAdvice(lineupAdvice(gm, s, tid))}>Ask the assistant coaches</button>
          </div>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, fontSize: '12.5px', cursor: 'pointer' }}><input type="checkbox" checked={!!club?.keepSorted} onChange={e => setClub({ keepSorted: e.target.checked })} /> Keep auto sorted (re-sorts before every game)</label>
        </div>}
      </div>
      {cur && <CapBar gm={gm} s={s} tid={tid} />}
      <div style={{ marginBottom: 12 }}>
        {!noteOpen && <button className="btn btn-ghost" style={{ fontSize: '12.5px' }} onClick={() => setNoteOpen(true)}>{note ? '✎ Team note: ' + (note.length > 80 ? note.slice(0, 80) + '…' : note) : '+ Add team note'}</button>}
        {noteOpen && <div><textarea className="input" defaultValue={note} rows={3} style={{ width: '100%', maxWidth: 640, fontSize: '13px' }} placeholder="Notes about this team: targets, plans, who to watch…" onBlur={e => { const v = e.target.value; gm.setState(st => ({ teamNotes: { ...(st.teamNotes || {}), [tid]: v } })); setNoteOpen(false); }} autoFocus /></div>}
      </div>
      {advice && <AdvicePanel vm={vm} advice={advice} onApply={() => { applyAdvice(gm, tid, advice); setAdvice(null); }} onClose={() => setAdvice(null)} />}
      {cur ? (
        <>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{mine ? 'Drag rows or use the arrows to set the rotation; the green block marks the starting five, grey the bench. Min target overrides the automatic minutes for his slot.' : 'Green marks the starting five.'}</p>
          <div style={{ fontWeight: 600, fontSize: '13px', margin: '4px 0' }}>Standard contracts · {std.length - ex10.length} of 15{s.phase !== 'regular' && s.phase !== 'playoffs' && s.phase !== 'playin' ? ' (21 allowed in the offseason, 15 by opening night)' : ''}</div>
          <div data-tour="roster-table" style={{ overflowX: 'auto' }}><table className="table" style={{ fontSize: '13px', minWidth: 900 }}>{Head()}<tbody>{mainIds.map((id, i) => Row({ id, i, list: mainIds }))}</tbody></table></div>
          <div style={{ fontWeight: 600, fontSize: '13px', margin: '16px 0 4px' }}>Two-way contracts · {tw.length} of {TWO_WAY_MAX} <span style={{ ...muted, fontWeight: 400, fontSize: '12px' }}>Off the 15-man roster and the cap; up to 50 NBA games; not playoff-eligible.</span></div>
          {tw.length ? <div style={{ overflowX: 'auto' }}><table className="table" style={{ fontSize: '13px', minWidth: 900 }}>{Head()}<tbody>{tw.map((id, i) => Row({ id, i, list: tw }))}</tbody></table></div> : <p style={{ ...muted, fontSize: '12.5px', margin: 0 }}>No two-way players. Sign players with under 4 years of service from Free agency.</p>}
          {ex10.length > 0 && <>
            <div style={{ fontWeight: 600, fontSize: '13px', margin: '16px 0 4px' }}>Exhibit 10 (training camp) · {ex10.length} <span style={{ ...muted, fontWeight: 400, fontSize: '12px' }}>Convert to two-way on the Cap sheet, keep, or waive by opening night.</span></div>
            <div style={{ overflowX: 'auto' }}><table className="table" style={{ fontSize: '13px', minWidth: 900 }}>{Head()}<tbody>{ex10.map((id, i) => Row({ id, i, list: ex10 }))}</tbody></table></div>
          </>}
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, fontSize: '13px', margin: '4px 0' }}>{season - 1}–{String(season).slice(2)} roster: everyone who played for {t.abbr} that season</div>
          {pastIds.length ? <div style={{ overflowX: 'auto' }}><table className="table" style={{ fontSize: '13px', minWidth: 760 }}>{Head()}<tbody>{pastIds.map((id, i) => Row({ id, i, list: pastIds }))}</tbody></table></div> : <p style={muted}>No games recorded for this team that season.</p>}
        </>
      )}
    </>
  );
}

function AdvicePanel({ vm, advice, onApply, onClose }: { vm: VM; advice: Advice; onApply: () => void; onClose: () => void }) {
  const { gm, open } = vm.ctx, P = gm.db.P;
  const icon = { start: '▲ Start', bench: '▼ Bench', more: '+ Minutes', less: '− Minutes', rest: '◐ Rest', dev: '★ Develop', hurt: '✚ Injury' } as any;
  const color = { start: 'var(--gm-good)', more: 'var(--gm-good)', dev: 'var(--color-accent-700)', bench: 'var(--color-accent-800)', less: 'var(--color-accent-800)', rest: 'var(--color-accent-800)', hurt: 'var(--gm-bad)' } as any;
  return (
    <div style={{ border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', flex: 1 }}>From the coaching staff</div>
        <span style={{ ...muted, fontSize: '12px' }}>{advice.staff.map(x => x.name + ' (' + x.role + ')').join(' · ')}</span>
      </div>
      <p style={{ margin: '4px 0 8px', fontSize: '13px' }}>{advice.summary} Suggested starters: {advice.order.slice(0, 5).map(id => P[id].name).join(', ')}.</p>
      {advice.lines.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr)', gap: 8, padding: '3px 0', borderTop: '1px solid var(--color-divider)', fontSize: '12.5px' }}>
          <span style={{ color: color[l.kind], fontWeight: 600 }}>{icon[l.kind]}</span>
          <span><Link onClick={() => open(l.pid)}>{P[l.pid].name}</Link>: {l.text} <span style={muted}>— {l.by}</span></span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn btn-primary" style={{ fontSize: '12.5px' }} onClick={onApply}>Apply their lineup and minutes</button>
        <button className="btn btn-secondary" style={{ fontSize: '12.5px' }} onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

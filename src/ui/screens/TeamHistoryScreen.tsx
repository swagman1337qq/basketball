// Team history: a franchise since the league began. Its retired numbers, and every player who
// has played for it (his regular-season career with the team), colored by where he is now. You
// retire a former player's number from his row (teams you run; any team in God Mode). Every
// section folds away, and the league remembers which are folded.
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { alphaTeams, GOD_PINK, godBtn, HL, hlRow, Link, muted, Ring, usePaged } from '../kit';
import { JERSEY_RE, numsWith, retireJersey, unretireJersey } from '../../engine/jerseys';

const td: CSSProperties = { padding: '4px 8px', borderBottom: '1px solid var(--color-divider)' }, tdr: CSSProperties = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
const btnS: CSSProperties = { fontSize: '11.5px', padding: '1px 8px', whiteSpace: 'nowrap' };
// Buttons on a highlighted (light) row: dark text in either theme; God Mode's pink, darkened to read.
const litBtn: CSSProperties = { color: HL.ink, borderColor: 'rgba(29,27,25,.4)', background: 'rgba(255,255,255,.35)' };
const godLit: CSSProperties = { ...litBtn, color: '#a3105f', borderColor: GOD_PINK };
const lbl = (y: number) => (y - 1) + '–' + String(y).slice(2);
const numKey = (n: string) => (n === '00' ? -1 : +n);
const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const f1 = (v: number) => v.toFixed(1);
// Where a player is now: on the team, still playing elsewhere (another team, unsigned, abroad,
// the CCP), retired, or retired into the Hall of Fame.
const ROW_BG: Record<string, string> = { now: HL.mine, away: HL.active, hof: HL.hof };
const LEGEND: [string | null, string][] = [[HL.mine, 'On the team now'], [HL.active, 'Still playing, for another team or unsigned'], [HL.hof, 'Hall of Fame'], [null, 'Retired']];

function Fold({ vm, k, title, note, children }: { vm: VM; k: string; title: ReactNode; note?: ReactNode; children: ReactNode }) {
  const { gm, s } = vm.ctx, shut = !!(s.thFold || {})[k];
  return (
    <section style={{ marginBottom: 26 }}>
      <button onClick={() => gm.setState((st: any) => ({ thFold: { ...(st.thFold || {}), [k]: !shut } }))} aria-expanded={!shut} title={shut ? 'Show' : 'Hide'}
        style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 8, width: '100%', boxSizing: 'border-box', borderBottom: '1px solid var(--color-text)', paddingBottom: 4, marginBottom: shut ? 0 : 10 }}>
        <span style={{ width: 12, fontSize: 11, color: 'var(--color-neutral-600)' }}>{shut ? '▸' : '▾'}</span>
        <span style={{ fontSize: 18 }}>{title}</span>
        {note != null && <span style={{ ...muted, fontSize: 12, marginLeft: 'auto' }}>{note}</span>}
      </button>
      {!shut && children}
    </section>
  );
}

export function TeamHistoryScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, isMine } = vm.ctx, P = gm.db.P;
  const [view, setView] = useState<number>(s.me);
  const [ask, setAsk] = useState<{ pid: number; num: string } | null>(null);
  const [q, setQ] = useState(''), [size, setSize] = useState(25);
  const tid = T[view] ? view : s.me, t = T[tid], AT = alphaTeams(T);
  const pick = (x: number) => { setView(x); setAsk(null); };
  const step = (d: number) => { const i = AT.findIndex(x => x.tid === tid); pick(AT[(i + d + AT.length) % AT.length].tid); };
  const canEdit = isMine(tid) || !!s.god, godOnly = !isMine(tid) && !!s.god, retired: any[] = t.retired || [];

  // Everyone who has played for the team: his regular-season line with it, the titles he won
  // there (a playoff line for that season's champion), his last season there and where he is now.
  const rows = useMemo(() => {
    const champ = new Set((s.history || []).filter((h: any) => h.champ === tid).map((h: any) => h.year));
    const hof = new Set((s.hof || []).map((h: any) => h.pid)), here = new Set<number>(s.rosters[tid] || []);
    const out: any[] = [];
    (Object.values(P) as any[]).forEach(p => {
      const lines = (p.stats || []).filter((r: any) => r.tid === tid);
      if (!lines.length || p.gone) return;
      const c = { gp: 0, min: 0, pts: 0, trb: 0, ast: 0, perMin: 0, ewa: 0 };
      lines.forEach((r: any) => {
        if (r.po) return;
        const per = gm.perOf(r, r.season);
        c.gp += r.gp; c.min += r.min; c.pts += r.pts; c.trb += (r.orb || 0) + (r.drb || 0); c.ast += r.ast;
        c.perMin += per * r.min; c.ewa += ((per - 11) * r.min / 67) / 30; // EWA as advanced.ts counts it
      });
      const g = c.gp || 1, nums = numsWith(p, tid);
      out.push({ p, id: p.id, nums, num: nums[0] ?? '', pos: p.pos, gp: c.gp, min: c.min / g, pts: c.pts / g, trb: c.trb / g, ast: c.ast / g, per: c.min ? c.perMin / c.min : 0, ewa: c.ewa,
        titles: lines.filter((r: any) => r.po && champ.has(r.season)).length, last: Math.max(...lines.map((r: any) => r.season)),
        st: p.retired ? (hof.has(p.id) ? 'hof' : 'ret') : here.has(p.id) ? 'now' : 'away' });
    });
    return out;
  }, [tid, gm.version]); // gm.version moves with every change to the league

  const shown = useMemo(() => { const f = fold(q.trim()); return f ? rows.filter(r => fold(r.p.name).includes(f) || (!!r.p.native && fold(r.p.native).includes(f))) : rows; }, [rows, q]);
  const keys = useMemo(() => ({ num: (r: any) => (r.num === '' ? null : numKey(r.num)), name: (r: any) => byLast(r.p), pos: (r: any) => r.pos, gp: (r: any) => r.gp, min: (r: any) => r.min, pts: (r: any) => r.pts, trb: (r: any) => r.trb, ast: (r: any) => r.ast, per: (r: any) => r.per, ewa: (r: any) => r.ewa, titles: (r: any) => r.titles, last: (r: any) => r.last }), []);
  const sort = useSort(shown, keys, ['gp', -1]);
  const pg = usePaged(sort.rows, 'players', size, sort.sortKey);
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  const flag = (p: any) => <img src={gm.flag(p.rep)} alt="" title={gm.db.C[p.rep]?.n} style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)', flex: 'none' }} />;
  const nameCell = (p: any, lit: boolean) => (
    <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
      {flag(p)}
      <Link onClick={() => open(p.id)} style={{ color: lit ? 'inherit' : 'var(--color-accent-700)', fontWeight: lit ? 600 : 400 }}>{p.name}</Link>
    </span>
  );
  const titlesCell = (n: number) => (n ? <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Ring />{n > 1 ? '×' + n : ''}</span> : <span style={{ opacity: 0.5 }}>—</span>);

  // Retiring a number: the one he wore here (pick one if he wore several, or type it if the
  // league never recorded it). Not while he's still on the team.
  const action = (r: any) => {
    const done = retired.filter(x => x.pid === r.id), lit = !!ROW_BG[r.st], look = { ...btnS, ...(lit ? (godOnly ? godLit : litBtn) : godOnly ? godBtn : {}) };
    if (done.length) return <span style={{ fontSize: '12px' }}>No. {done.map(x => x.num).join(', ')} retired</span>;
    if (r.st === 'now') return <button className="btn btn-secondary" disabled title="He’s on the team: retire his number after he leaves or retires" style={{ ...btnS, ...(lit ? litBtn : {}) }}>Retire jersey</button>;
    if (ask?.pid === r.id) {
      const ok = JERSEY_RE.test(ask.num), set = (num: string) => setAsk({ pid: r.id, num });
      return (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
          No.{' '}
          {r.nums.length > 1 ? <select className="input" value={ask.num} onChange={e => set(e.target.value)} style={{ width: 'auto', padding: '1px 4px', fontSize: '12px' }}>{r.nums.map((n: string) => <option key={n} value={n}>{n}</option>)}</select>
            : r.nums.length === 1 ? <b>{ask.num}</b>
            : <input className="input" autoFocus value={ask.num} onChange={e => set(e.target.value.replace(/\D/g, '').slice(0, 2))} onKeyDown={e => { if (e.key === 'Enter' && ok) { retireJersey(gm, tid, r.id, ask.num); setAsk(null); } }} placeholder="#" title="The number he wore here (0–99 or 00)" style={{ width: 44, padding: '1px 6px', fontSize: '12px' }} />}
          <button className="btn btn-primary" disabled={!ok} onClick={() => { retireJersey(gm, tid, r.id, ask.num); setAsk(null); }} style={btnS}>Retire</button>
          <button className="btn btn-ghost" onClick={() => setAsk(null)} style={{ ...btnS, ...(lit ? litBtn : {}) }}>Cancel</button>
        </span>
      );
    }
    const many = r.nums.length !== 1;
    return <button className="btn btn-secondary" onClick={() => setAsk({ pid: r.id, num: r.nums[0] ?? '' })} title={(godOnly ? 'God Mode: ' : '') + (r.nums.length > 1 ? 'He wore ' + r.nums.join(' and ') + ' here: pick the number to retire' : r.nums.length ? 'Retire No. ' + r.nums[0] + ' for ' + r.p.name : 'The league didn’t record his number here: enter it')} style={look}>{many ? 'Retire jersey…' : 'Retire jersey'}</button>;
  };

  const ret = retired.slice().sort((a, b) => numKey(a.num) - numKey(b.num) || a.season - b.season);
  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button className="btn btn-secondary" onClick={() => step(-1)} style={{ padding: '3px 9px' }} aria-label="Previous team">‹</button>
        <button className="btn btn-secondary" onClick={() => step(1)} style={{ padding: '3px 9px' }} aria-label="Next team">›</button>
        <select className="input" value={tid} onChange={e => pick(+e.target.value)} style={{ width: 'auto', minWidth: 220 }}>{AT.map(x => <option key={x.tid} value={x.tid}>{x.region} {x.name}{isMine(x.tid) ? ' (yours)' : ''}</option>)}</select>
        {tid !== s.me && <Link onClick={() => pick(s.me)} style={{ marginLeft: 6, fontSize: '12.5px' }}>Back to my team</Link>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {logo(tid, 44)}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: 1.1 }}>{t.region} {t.name}</div>
      </div>

      <Fold vm={vm} k="retired" title="Retired jerseys" note={ret.length ? ret.length + ' number' + (ret.length === 1 ? '' : 's') : undefined}>
        {ret.length === 0 ? <p style={{ ...muted, fontStyle: 'italic', margin: 0 }}>No numbers retired yet.{canEdit ? ' Retire a former player’s number from his row under Players.' : ''}</p> : (
          <table style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ fontSize: '11.5px', color: 'var(--color-neutral-700)' }}><th style={{ ...tdr, borderBottom: 'none' }}>No.</th><th style={{ ...td, textAlign: 'left', borderBottom: 'none' }}>Pos</th><th style={{ ...td, textAlign: 'left', borderBottom: 'none' }}>Player</th><th style={{ ...td, textAlign: 'left', borderBottom: 'none' }} title="Championships with this team">Titles</th>{canEdit && <th style={{ ...td, borderBottom: 'none' }} />}</tr></thead>
            <tbody>{ret.map(x => { const p = P[x.pid]; if (!p) return null; return (
              <tr key={x.num + ':' + x.pid}>
                <td style={{ ...tdr, fontFamily: 'var(--font-heading)', fontSize: '20px', minWidth: 44 }} title={'Retired in ' + lbl(x.season)}>{x.num}</td>
                <td style={td}>{p.pos}</td>
                <td style={td}>{nameCell(p, false)}</td>
                <td style={td}>{titlesCell(byId.get(p.id)?.titles || 0)}</td>
                {canEdit && <td style={td}><button className="btn btn-ghost" onClick={() => unretireJersey(gm, tid, x.pid, x.num)} title={(godOnly ? 'God Mode: ' : '') + 'Put No. ' + x.num + ' back in circulation'} style={{ ...btnS, ...(godOnly ? godBtn : {}) }}>Unretire</button></td>}
              </tr>); })}</tbody>
          </table>
        )}
      </Fold>

      <Fold vm={vm} k="players" title="Players" note={rows.length ? rows.length + ' players since ' + lbl(gm.db.firstSeason || 2027) : undefined}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: '12px', margin: '0 0 10px' }}>
          {LEGEND.map(([c, l]) => <span key={l} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span style={{ width: 14, height: 14, borderRadius: 3, background: c || 'transparent', border: '1px solid ' + (c ? 'transparent' : 'var(--color-neutral-500)'), flex: 'none' }} />{l}</span>)}
        </div>
        {rows.length === 0 ? <p style={{ ...muted, fontStyle: 'italic', margin: 0 }}>No one has played a game for the team yet.</p> : (<>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: '12.5px' }}>
            <select className="input" value={size} onChange={e => setSize(+e.target.value)} style={{ width: 'auto', padding: '2px 6px' }} aria-label="Players per page">{[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={muted}>per page</span>
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search players" style={{ width: 200, marginLeft: 'auto' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ fontSize: '11.5px', color: 'var(--color-neutral-700)' }}>
                {sort.head('num', '#', 'right')}{sort.head('name', 'Player')}{sort.head('pos', 'Pos')}{sort.head('gp', <span title="Games played for this team">G</span>, 'right')}{sort.head('min', <span title="Minutes per game">MP</span>, 'right')}
                {sort.head('pts', 'PTS', 'right')}{sort.head('trb', 'TRB', 'right')}{sort.head('ast', 'AST', 'right')}{sort.head('per', <span title="Player efficiency rating with this team (15 is average)">PER</span>, 'right')}{sort.head('ewa', <span title="Estimated wins added for this team">EWA</span>, 'right')}
                {sort.head('titles', <Ring title="Championships with this team" />, 'right')}{sort.head('last', 'Last season', 'right')}{canEdit && <th style={{ padding: '6px 8px', textAlign: 'left' }}>Actions</th>}
              </tr></thead>
              <tbody>{pg.rows.map(r => { const bg = ROW_BG[r.st], p = r.p, has = r.gp > 0; return (
                <tr key={r.id} style={hlRow(bg)}>
                  <td style={{ ...tdr, fontFamily: 'var(--font-heading)', fontSize: '14px', width: 30 }} title={r.nums.length > 1 ? 'Wore ' + r.nums.join(', ') + ' here' : undefined}>{r.num}</td>
                  <td style={td}>{nameCell(p, !!bg)}</td>
                  <td style={td}>{r.pos}</td>
                  <td style={tdr}>{r.gp}</td>
                  <td style={tdr}>{has ? f1(r.min) : '—'}</td>
                  <td style={tdr}>{has ? f1(r.pts) : '—'}</td>
                  <td style={tdr}>{has ? f1(r.trb) : '—'}</td>
                  <td style={tdr}>{has ? f1(r.ast) : '—'}</td>
                  <td style={tdr}>{has ? f1(r.per) : '—'}</td>
                  <td style={tdr}>{has ? f1(r.ewa) : '—'}</td>
                  <td style={tdr}>{r.titles || ''}</td>
                  <td style={tdr}>{lbl(r.last)}</td>
                  {canEdit && <td style={td}>{action(r)}</td>}
                </tr>); })}</tbody>
            </table>
          </div>
          {pg.pager}
          <p style={{ ...muted, fontSize: '11.5px', margin: '4px 0 0' }}>Regular-season career with the team. Titles count the seasons he played in the playoffs for a champion here.{canEdit ? ' Retiring a number takes it out of circulation: no one new can wear it, though a current player who already does keeps it.' : ''}</p>
        </>)}
      </Fold>
    </>
  );
}

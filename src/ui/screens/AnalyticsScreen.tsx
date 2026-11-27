// Analytics reports (2026-11-27; engine: analytics.ts anRequests/anCovered, analyticsReports.ts): the players your
// analytics department is asked to look at, by you (search, or Ask analytics on a profile), your scouts and your
// assistant GM, NBA players and draft prospects only. Each analyst covers a number of players; covered players get
// the full report (and the sharper read everywhere), the rest wait in line. The department itself is on Staff.
import { useEffect, useState } from 'react';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { Link, muted, ruleH4, Seg, usePaged } from '../kit';
import { CoachFace } from '../CoachFace';
import {
  AN_CAP,
  AN_LIST_MAX,
  AN_ROLE_LABEL,
  anAge,
  anCapacity,
  anKind,
  askAnalytics,
  deptOf,
  deptView,
  dropAnalytics,
  REQ_LABEL,
  tendencies,
  type AnKind,
  type ReqBy,
} from '../../engine/analytics';
import { anReport, anRows, type AnRow } from '../../engine/analyticsReports';

const KIND_LABEL: Record<AnKind, string> = { prospect: 'Draft prospect', mine: 'Your team', league: 'NBA', fa: 'Free agent' };
const good = 'var(--gm-good)',
  bad = 'var(--gm-bad)';

export function AnalyticsScreen({ vm }: { vm: VM }) {
  const { gm, s, money } = vm.ctx,
    P = gm.db.P;
  void s.gv;
  const [f, setF] = useState<'all' | AnKind>('all'),
    [byF, setByF] = useState<'any' | ReqBy>('any'),
    [sel, setSel] = useState<number | null>(s.anSel ?? null),
    [q, setQ] = useState(''),
    [msg, setMsg] = useState('');
  useEffect(() => {
    if (s.anSel != null) setSel(s.anSel); // Full report on a profile opens his
  }, [s.anSel]);
  const dept = deptOf(gm, s.me),
    cap = anCapacity(gm, s.me);
  const rows = dept.length ? anRows(gm, s) : [],
    covered = rows.filter(r => r.status === 'covered').length,
    waiting = rows.filter(r => r.status === 'queued').length;
  const pot = (id: number) => vm.ctx.potOf(P[id], id);
  const view = (r: AnRow) => (r.status === 'covered' ? deptView(gm, s, s.me, P[r.pid]) : null);
  const shown = rows.filter(r => (f === 'all' || r.kind === f) && (byF === 'any' || r.by.includes(byF)));
  const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hits =
    q.trim().length >= 2
      ? (Object.values(P) as any[]).filter(p => anKind(gm, s, p) && fold(p.name).includes(fold(q.trim()))).slice(0, 8)
      : [];
  const add = (id: number) => {
    setMsg(askAnalytics(gm, id));
    setSel(id);
    setQ('');
  };
  const srt = useSort<AnRow>(shown, {
    name: r => byLast(P[r.pid]),
    type: r => KIND_LABEL[r.kind],
    pos: r => P[r.pid].pos,
    age: r => P[r.pid].age,
    now: r => view(r)?.now ?? null,
    next: r => (view(r)?.kind === 'nba' ? view(r)!.next : null),
    peak: r => view(r)?.peak ?? null,
    scouts: r => pot(r.pid),
    gap: r => (view(r) ? view(r)!.peak - pot(r.pid) : null),
    by: r => r.by.map(b => REQ_LABEL[b]).join(', '),
    status: r => (r.status === 'covered' ? 0 : r.status === 'queued' ? r.queue : 999),
  });
  const pg = usePaged(srt.rows, 'players', 25, srt.sortKey);
  const count = (k: AnKind) => rows.filter(r => r.kind === k).length,
    countBy = (k: ReqBy) => rows.filter(r => r.by.includes(k)).length;
  const cell = { padding: '4px 8px', whiteSpace: 'nowrap' as const },
    num = { ...cell, textAlign: 'right' as const };
  if (!dept.length)
    return (
      <section>
        <h4 style={ruleH4}>Analytics reports</h4>
        <p style={{ ...muted, fontSize: '13px' }}>
          You have no analytics department, so nobody to run the numbers. Hire a Head of Analytics and analysts on the{' '}
          <Link onClick={() => gm.setState({ screen: 'staff' })}>Staff</Link> screen.
        </p>
      </section>
    );
  const H: [string, string, 'left' | 'right', string?][] = [
    ['name', 'Player', 'left'],
    ['type', 'Type', 'left'],
    ['pos', 'Pos', 'left'],
    ['age', 'Age', 'right'],
    ['now', 'Now', 'right', 'His level today by the numbers (on the overall scale)'],
    ['next', 'Next', 'right', 'Projected level next season (NBA players)'],
    ['peak', 'Ceiling', 'right', 'Where the numbers say he tops out'],
    ['scouts', 'Scouts', 'right', 'Your scouts’ read of his potential (your coaches’ for your own players)'],
    ['gap', '±', 'right', 'The numbers’ ceiling against your scouts’ read'],
    ['by', 'Requested by', 'left'],
    ['status', 'Status', 'left'],
  ];
  return (
    <section>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 8px' }}>
        Your department runs the numbers on players in the NBA and draft prospects: the ones you ask for, the ones your scouts are following
        and the ones your assistant GM flags (trade offers to you, your shortlists, the prospects around your pick). The Head of Analytics
        covers {AN_CAP.head} players and each analyst {AN_CAP.analyst}; your requests come first, then the scouts&rsquo;, then the assistant
        GM&rsquo;s, and the rest wait their turn. A covered player gets the full report and a sharper read everywhere (draft board, profile,
        free agency, trades). The department is on <Link onClick={() => gm.setState({ screen: 'staff' })}>Staff</Link>.
      </p>
      <div style={{ fontSize: '12.5px', marginBottom: 8 }}>
        Covering <b>{covered}</b> of {cap} · {waiting} waiting · your list {(s.anList || []).length} of {AN_LIST_MAX}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <Seg<any>
          value={f}
          options={[
            ['all', 'All ' + rows.length],
            ['prospect', 'Draft prospects ' + count('prospect')],
            ['league', 'NBA ' + count('league')],
            ['mine', 'My team ' + count('mine')],
            ['fa', 'Free agents ' + count('fa')],
          ]}
          onChange={setF}
        />
        <Seg<any>
          value={byF}
          options={[
            ['any', 'Anyone'],
            ['you', 'You ' + countBy('you')],
            ['scouts', 'Scouts ' + countBy('scouts')],
            ['agm', 'Assistant GM ' + countBy('agm')],
          ]}
          onChange={setByF}
        />
        <span style={{ position: 'relative' }}>
          <input
            className="input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask analytics about…"
            style={{ width: 220, fontSize: '13px' }}
            data-analytics-search
          />
          {hits.length > 0 && (
            <div
              style={{
                position: 'absolute',
                zIndex: 30,
                top: 34,
                left: 0,
                width: 300,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {hits.map(p => (
                <button
                  key={p.id}
                  className="hv3"
                  onClick={() => add(p.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '5px 10px',
                    fontSize: '12.5px',
                  }}
                >
                  <span style={{ flex: 1 }}>{p.name}</span>
                  <span style={muted}>
                    {KIND_LABEL[anKind(gm, s, p)!]} · {p.pos} · {p.age}
                  </span>
                </button>
              ))}
            </div>
          )}
        </span>
      </div>
      {msg && <div style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-accent-800)' }}>{msg}</div>}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
        <table className="table" style={{ fontSize: '12.5px', width: '100%' }} data-analytics-reports>
          <thead>
            <tr>{H.map(([k, h, al, tip]) => srt.head(k, <span title={tip}>{h}</span>, al, { padding: '5px 8px' }))}</tr>
          </thead>
          <tbody>
            {pg.rows.map(r => {
              const p = P[r.pid],
                v = view(r),
                sp = pot(r.pid),
                gap = v ? Math.round(v.peak - sp) : null;
              return (
                <tr
                  key={r.pid}
                  onClick={() => setSel(r.pid)}
                  style={{ cursor: 'pointer', background: sel === r.pid ? 'var(--color-accent-100)' : undefined }}
                >
                  <td style={cell}>
                    <Link pid={r.pid} onClick={() => vm.ctx.open(r.pid)}>
                      {p.name}
                    </Link>
                  </td>
                  <td style={cell}>{KIND_LABEL[r.kind]}</td>
                  <td style={cell}>{p.pos}</td>
                  <td style={num}>{p.age}</td>
                  <td style={{ ...num, fontWeight: 600 }}>{v ? Math.round(v.now) : ''}</td>
                  <td style={num}>{v && v.kind === 'nba' ? Math.round(v.next) : ''}</td>
                  <td style={num}>{v ? Math.round(v.peak) : ''}</td>
                  <td style={num}>{sp}</td>
                  <td style={{ ...num, color: gap != null && gap >= 4 ? good : gap != null && gap <= -4 ? bad : undefined }}>
                    {gap == null ? '' : gap > 0 ? '+' + gap : gap}
                  </td>
                  <td style={cell}>{r.by.map(b => REQ_LABEL[b]).join(', ')}</td>
                  <td style={cell}>
                    {r.status === 'covered' ? (
                      'Report'
                    ) : r.status === 'queued' ? (
                      <span style={muted}>Waiting (#{r.queue})</span>
                    ) : (
                      <span style={muted}>No numbers yet</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={H.length} style={{ padding: 10, ...muted }}>
                  Nobody here yet. Search above, or use Ask analytics on a player&rsquo;s profile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pg.pager}
      {sel != null && P[sel] && (
        <ReportView
          vm={vm}
          pid={sel}
          row={rows.find(r => r.pid === sel)}
          onDrop={() => {
            dropAnalytics(gm, sel);
            setMsg(P[sel].name + ' is off your analytics list.');
          }}
          onAsk={() => setMsg(askAnalytics(gm, sel))}
          money={money}
        />
      )}
    </section>
  );
}

function ReportView({
  vm,
  pid,
  row,
  onDrop,
  onAsk,
  money,
}: {
  vm: VM;
  pid: number;
  row?: AnRow;
  onDrop: () => void;
  onAsk: () => void;
  money: (v: number) => string;
}) {
  const { gm, s } = vm.ctx,
    p = gm.db.P[pid],
    mineList = (s.anList || []).includes(pid);
  const box = { marginTop: 14, padding: '12px 14px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)' };
  const head = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600 }}>
        <Link pid={pid} onClick={() => vm.ctx.open(pid)}>
          {p.name}
        </Link>
        <span style={{ ...muted, fontSize: '13px', fontWeight: 400 }}>
          {' '}
          · {p.pos} · {p.age} · {row ? KIND_LABEL[row.kind] : ''}
          {row ? ' · requested by ' + row.by.map(b => REQ_LABEL[b]).join(', ') : ''}
        </span>
      </div>
      {mineList ? (
        <button className="btn btn-secondary" onClick={onDrop}>
          Take off my list
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={onAsk}>
          Add to my list
        </button>
      )}
    </div>
  );
  if (!row || row.status !== 'covered')
    return (
      <div style={box}>
        {head}
        <p style={{ ...muted, fontSize: '13px', margin: '8px 0 0' }}>
          {!row
            ? 'Not on anyone’s list.'
            : row.status === 'queued'
              ? 'Waiting: #' +
                row.queue +
                ' in line. Your department is covering as many players as it can; add analysts on Staff, or take others off your list, to get to him sooner.'
              : 'No numbers to go on yet: no NBA minutes, college or club season.'}
        </p>
      </div>
    );
  const sp = vm.ctx.potOf(p, pid),
    rep = anReport(gm, s, pid, sp);
  if (!rep) return <div style={box}>{head}</div>;
  const { v } = rep,
    tc = (t: string) => (t === 'good' ? good : t === 'bad' ? bad : undefined);
  const stat = (label: string, val: string | number, sub?: string) => (
    <div style={{ minWidth: 86 }}>
      <div style={{ ...muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 600 }}>{val}</div>
      {sub && <div style={{ ...muted, fontSize: '11.5px' }}>{sub}</div>}
    </div>
  );
  return (
    <div style={box} data-analytics-report>
      {head}
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '10px 0' }}>
        {stat('Now', Math.round(v.now), v.kind === 'nba' ? 'rated ' + p.ovr : undefined)}
        {v.kind === 'nba' && stat('Next season', Math.round(v.next))}
        {stat('Ceiling', Math.round(v.peak), (row.kind === 'mine' ? 'coaches ' : 'scouts ') + sp)}
        {stat('Confidence', v.conf)}
        {rep.cv &&
          stat(
            rep.asks ? 'Worth (asks)' : 'Worth (paid)',
            money(Math.max(0, rep.cv.worth)),
            (rep.asks ? 'asks ' : 'paid ') + money(rep.sal!),
          )}
      </div>
      <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
        {rep.calls.map((c, i) => (
          <div key={i} style={{ fontSize: '13px', color: tc(c.tone) }}>
            {c.text}
          </div>
        ))}
        {rep.warn.map((w, i) => (
          <div key={'w' + i} style={{ fontSize: '12.5px', ...muted }}>
            ⚠ {w}
          </div>
        ))}
        {rep.fit && !rep.fit.fills.length && rep.fit.needs.length > 0 && (
          <div style={{ fontSize: '12.5px', ...muted }}>
            Your needs by the numbers ({rep.fit.needs.map(n => n.label).join(', ')}): he doesn&rsquo;t stand out in them.
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 18 }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>
            The numbers behind it · per {rep.sample.per} minutes · {rep.sample.min} minutes
            {rep.sample.kind === 'nba' ? ' (this season, last at half weight)' : ' (last two college or club seasons)'}
          </div>
          <table className="table" style={{ fontSize: '12.5px' }}>
            <thead>
              <tr>
                {rep.sample.line.map(x => (
                  <th key={x.k} style={{ padding: '3px 6px', textAlign: 'right' }}>
                    {x.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {rep.sample.line.map(x => (
                  <td key={x.k} style={{ padding: '3px 6px', textAlign: 'right' }}>
                    {x.v}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Each analyst</div>
          {v.by.map(({ a, v: av }) => {
            const known = tendencies(a);
            return (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontSize: '12.5px' }}>
                <button
                  style={{ all: 'unset', cursor: 'pointer' }}
                  onClick={() => gm.setState({ anPid: a.id, anTab: 'ov' })}
                  title="Open profile"
                >
                  <CoachFace gm={gm} c={{ ...(a as any), id: 500000 + a.id }} age={anAge(gm, a)} size={26} />
                </button>
                <div style={{ flex: 1 }}>
                  <b>{a.name}</b> <span style={muted}>({AN_ROLE_LABEL[a.role || 'analyst']})</span>: now {Math.round(av.now)}
                  {av.kind === 'nba' ? ', next ' + Math.round(av.next) : ''}, ceiling {Math.round(av.peak)}
                  {known.length > 0 && <div style={{ ...muted, fontSize: '11.5px' }}>Record: {known.join(' · ')}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

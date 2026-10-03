// League finances: every team's market, attendance, ticket price, revenue, profit, payroll, cap
// space, open roster spots, strategy and budgets, sortable, with the teams you run highlighted.
// Revenue, profit and attendance are this season's projection (frontOffice.ts financesOf); the
// budgets are the ones each club develops players with (environment.ts teamBudget).
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { VM } from '../vm';
import { useSort } from '../sortable';
import { HL, hlRow, Link, muted } from '../kit';
import { financesOf } from '../../engine/frontOffice';
import { teamBudget } from '../../engine/environment';
import { rosterMax, stdIds } from '../../engine/cba';
import { fmtMoney } from '../../engine/capModel';

const td: CSSProperties = { padding: '4px 8px', borderBottom: '1px solid var(--color-divider)', whiteSpace: 'nowrap' }, tdr: CSSProperties = { ...td, textAlign: 'right' };
const STRAT: Record<string, string> = { contend: 'Contending', middle: 'On the rise', rebuild: 'Rebuilding' };
const mktLabel = (m: number) => (m >= 1.15 ? 'Large' : m >= 0.95 ? 'Mid-large' : m >= 0.85 ? 'Mid' : 'Small');

export function LeagueFinancesScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, isMine } = vm.ctx;
  const rows = useMemo(() => {
    const strat = gm.strategies(T, s), lim = rosterMax(s);
    return T.map((t: any) => {
      const f = financesOf(gm, s, t.tid);
      return { t, tid: t.tid, mkt: t.mkt, att: f.att, full: f.full, tix: f.budget.Tickets, rev: f.rev.reduce((a: number, r: [string, number]) => a + r[1], 0), profit: f.net, payroll: f.payroll,
        space: gm.CAP - f.payroll, spots: lim - stdIds(gm, s.rosters[t.tid] || []).length, strat: isMine(t.tid) ? null : STRAT[strat[t.tid]], b: teamBudget(gm, s, t.tid) };
    });
  }, [gm.version]); // gm.version moves with every change to the league
  const keys = useMemo(() => ({ name: (r: any) => r.t.region + ' ' + r.t.name, mkt: (r: any) => r.mkt, att: (r: any) => r.att, tix: (r: any) => r.tix, rev: (r: any) => r.rev, profit: (r: any) => r.profit, payroll: (r: any) => r.payroll,
    space: (r: any) => r.space, spots: (r: any) => r.spots, strat: (r: any) => r.strat, sc: (r: any) => r.b.Scouting, co: (r: any) => r.b.Coaching, he: (r: any) => r.b.Health, fa: (r: any) => r.b.Facilities }), []);
  const sort = useSort(rows, keys, ['profit', -1]);
  const mRank = (m: number) => 1 + rows.filter((r: any) => r.mkt > m).length;
  const tip = (label: string, t: string) => <span title={t}>{label}</span>;
  return (
    <>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span style={{ width: 14, height: 14, borderRadius: 3, background: HL.mine, flex: 'none' }} />{s.managed.length > 1 ? 'Your teams' : 'Your team'}</span>
        <span style={muted}>Revenue, profit and attendance are this season’s projection at today’s ticket prices and records. Budgets are what each club spends a season on its staff and building.</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ fontSize: '11.5px', color: 'var(--color-neutral-700)' }}>
            {sort.head('name', 'Team')}{sort.head('mkt', tip('Market', 'Market size: it drives local media, sponsorship and merchandise money'), 'right')}{sort.head('att', tip('Attendance', 'Fans per home game'), 'right')}{sort.head('tix', 'Ticket price', 'right')}
            {sort.head('rev', 'Revenue', 'right')}{sort.head('profit', 'Profit', 'right')}{sort.head('payroll', 'Payroll', 'right')}{sort.head('space', 'Cap space', 'right')}{sort.head('spots', tip('Roster spots', 'Open standard contracts (15 a team)'), 'right')}
            {sort.head('strat', 'Strategy')}<th style={{ padding: '6px 8px', textAlign: 'left' }}>Trade</th>
            {sort.head('sc', 'Scouting', 'right')}{sort.head('co', 'Coaching', 'right')}{sort.head('he', 'Health', 'right')}{sort.head('fa', 'Facilities', 'right')}
          </tr></thead>
          <tbody>{sort.rows.map((r: any) => { const mine = isMine(r.tid); return (
            <tr key={r.tid} style={hlRow(mine ? HL.mine : null)}>
              <td style={td}><span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>{logo(r.tid, 18)}<Link onClick={() => openTeam(r.tid)} style={{ color: mine ? 'inherit' : 'var(--color-accent-700)', fontWeight: mine ? 600 : 400 }}>{r.t.region} {r.t.name}</Link></span></td>
              <td style={tdr} title={'Market size ' + r.mkt + ' (' + mRank(r.mkt) + ' of ' + rows.length + ')'}>{mktLabel(r.mkt)}</td>
              <td style={tdr} title={Math.round(r.full * 100) + '% full'}>{Math.round(r.att).toLocaleString()}</td>
              <td style={tdr}>${Math.round(r.tix)}</td>
              <td style={tdr}>{fmtMoney(r.rev)}</td>
              <td style={{ ...tdr, color: mine ? undefined : r.profit < 0 ? 'var(--gm-bad)' : undefined }}>{fmtMoney(r.profit)}</td>
              <td style={tdr}>{fmtMoney(r.payroll)}</td>
              <td style={tdr}>{fmtMoney(r.space)}</td>
              <td style={tdr}>{r.spots}</td>
              <td style={td}>{r.strat ?? <span style={{ opacity: 0.6 }}>You</span>}</td>
              <td style={td}>{mine ? null : <button className="btn btn-secondary" onClick={() => gm.setState({ teamModal: null, modal: false, screen: 'trade', tTid: r.tid, tTheirs: [], tkTheirs: [], tMsg: null })} style={{ fontSize: '11.5px', padding: '1px 8px' }}>Trade with</button>}</td>
              <td style={tdr}>{fmtMoney(r.b.Scouting)}</td>
              <td style={tdr}>{fmtMoney(r.b.Coaching)}</td>
              <td style={tdr}>{fmtMoney(r.b.Health)}</td>
              <td style={tdr}>{fmtMoney(r.b.Facilities)}</td>
            </tr>); })}</tbody>
        </table>
      </div>
    </>
  );
}

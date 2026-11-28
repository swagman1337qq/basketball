// Your staff shortlist (2026-11-28, engine/staffShortlist.ts), on the Staff screen: the coaches and analytics people
// you starred, what each does now (role and team, available or retired), age, reputation, and his contract or asking
// price. Click a name for the profile; the star takes him off.
import type { VM } from '../vm';
import { h4Style, muted, td, th } from '../kit';
import { CoachFace } from '../CoachFace';
import { StaffStar } from '../StaffStar';
import { fmtMoney as money } from '../../engine/capModel';
import { coachAge, coachAsk, ROLE_LABEL, type CoachRole } from '../../engine/staff';
import { AN_ROLE_LABEL, anAge, anAsk, anDb, type AnRole } from '../../engine/analytics';
import { staffList } from '../../engine/staffShortlist';

export function StaffShortlist({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    T = s.teams,
    L = staffList(s),
    coaches = (gm.db as any).coaches || {},
    analysts = anDb(gm);
  const thru = (exp: number) => exp - 1 + '–' + String(exp).slice(2);
  const rows = [
    ...L.c
      .map(id => coaches[id])
      .filter(Boolean)
      .map((c: any) => ({
        k: 'c' as const,
        id: c.id,
        name: c.name,
        face: <CoachFace gm={gm} c={c} age={coachAge(gm, c)} size={28} />,
        kind: 'Coach',
        now: c.ret
          ? 'Retired (' + c.ret + ')'
          : c.tid != null && T[c.tid]
            ? ROLE_LABEL[c.role as CoachRole] + ', ' + T[c.tid].abbr
            : 'Available',
        age: coachAge(gm, c),
        rep: c.rep,
        deal: c.ret ? '' : c.tid != null ? money(c.amt) + ' thru ' + thru(c.exp) : 'Asks ' + money(coachAsk(gm, c, 'asst')),
        mine: c.tid === s.me,
        open: () => gm.setState({ coachPid: c.id }),
      })),
    ...L.a
      .map(id => analysts[id])
      .filter(Boolean)
      .map((a: any) => ({
        k: 'a' as const,
        id: a.id,
        name: a.name,
        face: <CoachFace gm={gm} c={{ ...a, id: 500000 + a.id }} age={anAge(gm, a)} size={28} />,
        kind: 'Analytics',
        now: a.ret
          ? 'Retired (' + a.ret + ')'
          : a.tid != null && T[a.tid]
            ? AN_ROLE_LABEL[(a.role || 'analyst') as AnRole] + ', ' + T[a.tid].abbr
            : 'Available',
        age: anAge(gm, a),
        rep: a.rep,
        deal: a.ret ? '' : a.tid != null ? money(a.amt) + ' thru ' + thru(a.exp) : 'Asks ' + money(anAsk(gm, a, 'analyst')),
        mine: a.tid === s.me,
        open: () => gm.setState({ anPid: a.id, anTab: 'ov' }),
      })),
  ];
  return (
    <section aria-label="Staff shortlist" style={{ marginBottom: 16 }}>
      <h4 id="staff-shortlist" style={h4Style}>
        Staff shortlist
      </h4>
      {!rows.length ? (
        <p style={{ margin: 0, fontSize: '13px', ...muted }}>
          Star a coach or an analytics person (☆ next to the name here, or on the profile) to keep an eye on them here.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }} data-staff-shortlist>
            <thead>
              <tr>
                <th style={th()}>Name</th>
                <th style={th()}>Type</th>
                <th style={th()}>Now</th>
                <th style={th('right')}>Age</th>
                <th style={th('right')}>Rep</th>
                <th style={th('right')}>Contract or asking</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.k + r.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                  <td style={td()}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button style={{ all: 'unset', cursor: 'pointer' }} onClick={r.open} title="Open profile">
                        {r.face}
                      </button>
                      <button className="hv4" onClick={r.open} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                        {r.name}
                      </button>
                      <StaffStar gm={gm} k={r.k} id={r.id} />
                    </div>
                  </td>
                  <td style={td()}>{r.kind}</td>
                  <td style={td()}>
                    {r.now}
                    {r.mine ? <span style={muted}> (yours)</span> : null}
                  </td>
                  <td style={td('right')}>{r.age}</td>
                  <td style={td('right')}>{r.rep}</td>
                  <td style={td('right')}>{r.deal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

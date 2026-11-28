// A coach's profile (staff.ts): face, who he is, his playing days, his coaching, his contract and his ratings
// as you read them (God Mode: exact, with his ceiling, and editable). Opened with gm.setState({ coachPid }).
import { StaffStar } from '../StaffStar';
import type { VM } from '../vm';
import { godBtn, godText, muted, NumInput } from '../kit';
import { CoachFace } from '../CoachFace';
import { fmtMoney as money } from '../../engine/capModel';
import {
  coachAge,
  coachOvr,
  coachYears,
  coachWording,
  CP_LABEL,
  CR_KEYS,
  CR_LABEL,
  godAppoint,
  godEditCoach,
  grade,
  playLine,
  readLabel,
  readOf,
  readRatings,
  ROLE_LABEL,
  styleOf,
  coachWay,
  wayLabel,
} from '../../engine/staff';
import { careerSummary, coachRows, WOMENS_LEAGUE } from '../../engine/coachCareer';
import { coachPlayRows } from '../coachEditing';
import { CoachBioEditor } from './CoachBioEditor';
import { th, td } from '../kit';
import { isInterim } from '../../engine/carousel';

export function CoachProfile({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    c = gm.db.coaches?.[s.coachPid];
  if (!c) return null;
  const god = !!s.god,
    age = coachAge(gm, c),
    close = () => gm.setState({ coachPid: null }),
    refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const T = c.tid != null ? s.teams[c.tid] : null,
    tab: 'ov' | 'play' | 'coach' = s.coachTab || 'ov',
    setTab = (k: string) => gm.setState({ coachTab: k });
  const rows = coachRows(gm, s, c),
    sum = careerSummary(rows),
    plays = coachPlayRows(gm, c);
  const f1 = (v: number) => v.toFixed(1),
    f3 = (v: number) => (v ? v.toFixed(3).replace(/^0/, '') : '—');
  const trait = (k: string) => {
    const v = c.pers[k],
      [lo, hi] = CP_LABEL[k];
    return v >= 65 ? hi : v <= 35 ? lo : null;
  };
  const traits = Object.keys(CP_LABEL).map(trait).filter(Boolean) as string[];
  const row = (k: string, v: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, padding: '3px 0', fontSize: '13px' }}>
      <span style={muted}>{k}</span>
      <span>{v}</span>
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'color-mix(in srgb, var(--color-neutral-900) 45%, transparent)',
        zIndex: 21,
      }}
      onClick={close}
    >
      <div
        className="dialog"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(960px, calc(100vw - 32px))', height: 'min(720px, calc(100vh - 40px))', overflow: 'hidden' }}
      >
        <div className="dialog-title" style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          <CoachFace gm={gm} c={c} age={age} size={84} />
          <div>
            <div>
              {c.name}
              <StaffStar gm={gm} k="c" id={c.id} label />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 400, ...muted }}>
              {c.ret
                ? 'Retired from coaching (' + c.ret + ')'
                : T
                  ? (isInterim(gm, c) ? 'Interim head coach' : ROLE_LABEL[c.role!]) + ', ' + T.region + ' ' + T.name
                  : 'Available'}
              {' · '}
              {styleOf(c, readRatings(c, god))}
              {c.role === 'hc' && !c.ret ? ' · ' + wayLabel(coachWay(c)) : ''}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '0 20px',
            borderBottom: '1px solid var(--color-divider)',
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {(
            [
              ['ov', 'Overview'],
              ['play', 'Playing career'],
              ['coach', 'Coaching career'],
            ] as [string, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '6px 0',
                color: tab === k ? 'var(--color-accent-700)' : 'var(--color-text)',
                borderBottom: '2px solid ' + (tab === k ? 'var(--color-accent)' : 'transparent'),
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div key={tab} style={{ flex: 1, minHeight: 0, overflow: 'auto', scrollbarGutter: 'stable' }}>
          {tab === 'play' && (
            <div className="dialog-body" style={{ fontSize: '13px' }}>
              <div style={{ marginBottom: 8 }}>
                {playLine(c)}
                {c.pid != null && gm.db.P[c.pid] && (
                  <>
                    {' · '}
                    <button
                      className="hv4"
                      style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => vm.ctx.open(c.pid!)}
                    >
                      {coachWording(c, 'his player profile')}
                    </button>
                  </>
                )}
              </div>
              {plays.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    className="table"
                    style={{
                      width: '100%',
                      minWidth: 780,
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={th()}>Season</th>
                        <th style={th()}>Team</th>
                        <th style={th()}>League</th>
                        <th style={th('right')}>G</th>
                        <th style={th('right')}>MPG</th>
                        <th style={th('right')}>PTS</th>
                        <th style={th('right')}>REB</th>
                        <th style={th('right')}>AST</th>
                        <th style={th('right')}>FG%</th>
                        <th style={th('right')}>3P%</th>
                        <th style={th('right')}>FT%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plays.map(r => (
                        <tr key={r.season} style={{ borderTop: '1px solid var(--color-divider)' }}>
                          <td style={td()}>
                            {r.season - 1}–{String(r.season).slice(2)}
                          </td>
                          <td style={td()} title={r.lg}>
                            {r.team}
                          </td>
                          <td style={td()} title={r.lg}>
                            {r.lg === WOMENS_LEAGUE ? 'WPL' : r.lg}
                          </td>
                          <td style={td('right')}>{r.gp}</td>
                          <td style={td('right')}>{f1(r.mpg)}</td>
                          <td style={td('right')}>{f1(r.pts)}</td>
                          <td style={td('right')}>{f1(r.reb)}</td>
                          <td style={td('right')}>{f1(r.ast)}</td>
                          <td style={td('right')}>{f3(r.fg)}</td>
                          <td style={td('right')}>{f3(r.tp)}</td>
                          <td style={td('right')}>{f3(r.ft)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={muted}>No stats to show.</p>
              )}
            </div>
          )}
          {tab === 'coach' && (
            <div className="dialog-body" style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 8 }}>
                <span>
                  <b>{coachYears(gm, c)}</b> years coaching
                </span>
                <span>
                  NBA head coach: <b>{sum.nbaW + sum.nbaL ? sum.nbaW + '–' + sum.nbaL : '—'}</b>
                </span>
                <span>
                  Head coach, all levels:{' '}
                  <b>
                    {sum.hcW}–{sum.hcL}
                  </b>
                  {sum.hcW + sum.hcL ? ' (' + (sum.hcW / (sum.hcW + sum.hcL)).toFixed(3).replace(/^0/, '') + ')' : ''}
                </span>
                <span>
                  Titles: <b>{sum.hcRings}</b> as head coach, <b>{sum.asstRings}</b> as an assistant
                </span>
                {!!c.coy?.length && (
                  <span>
                    Coach of the Year: <b>{c.coy.join(', ')}</b>
                  </span>
                )}
              </div>
              {rows.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    className="table"
                    style={{
                      width: '100%',
                      minWidth: 900,
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={th()}>Season</th>
                        <th style={th()}>Team</th>
                        <th style={th()}>Level</th>
                        <th style={th()}>Role</th>
                        <th style={th('right')}>W–L</th>
                        <th style={th()}>Finish</th>
                        <th style={th()}>Under</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .slice()
                        .reverse()
                        .map(r => (
                          <tr key={r.season} style={{ borderTop: '1px solid var(--color-divider)' }}>
                            <td style={td()}>
                              {r.season - 1}–{String(r.season).slice(2)}
                              {r.cur ? ' (now)' : ''}
                            </td>
                            <td style={td()}>
                              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                {r.tid != null && vm.ctx.logo(r.tid, 14)}
                                {r.team}
                              </span>
                            </td>
                            <td style={td()}>{r.level}</td>
                            <td style={td()}>{r.role}</td>
                            <td style={td('right')}>{r.w != null ? r.w + '–' + r.l : ''}</td>
                            <td style={td()}>
                              {r.fin || (r.ring ? 'Won the title' : '')}
                              {c.coy?.includes(r.season) ? ' · Coach of the Year' : ''}
                            </td>
                            <td style={td('left', { fontSize: '12px' })}>{r.under || ''}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={muted}>New to coaching.</p>
              )}
            </div>
          )}
          {tab === 'ov' && (
            <div className="dialog-body" style={{ fontSize: '13px' }}>
              {row('Age', age + (c.fem ? ' · woman' : ''))}
              {row('Nationality', gm.db.C?.[c.nat]?.n || c.nat)}
              {row('Reputation', c.rep + ' / 100')}
              {row('Personality', traits.length ? traits.join(' · ') : 'Nothing stands out')}
              {row('Played', playLine(c))}
              {c.play.where && c.play.k !== 'none' && row('Playing college/team', c.play.where)}
              {row('Coaching', (coachYears(gm, c) ? coachYears(gm, c) + ' years · since ' + c.since + ' · ' : 'New · ') + c.bg)}
              {T && !c.ret && row('Contract', money(c.amt) + ' a year through ' + (c.exp - 1) + '–' + String(c.exp).slice(2))}
              {T &&
                !c.ret &&
                c.next &&
                row(
                  'Signed extension',
                  money(c.next.amt) +
                    ' a year from ' +
                    (c.next.start - 1) +
                    '–' +
                    String(c.next.start).slice(2) +
                    ' through ' +
                    (c.next.exp - 1) +
                    '–' +
                    String(c.next.exp).slice(2),
                )}
              {god && <CoachBioEditor key={c.id} gm={gm} coach={c} onSave={refresh} />}
              <div style={{ margin: '12px 0 4px', fontWeight: 600 }}>
                Coaching ratings{' '}
                <span style={{ fontWeight: 400, fontSize: '12px', ...(god ? godText : muted) }}>
                  {god ? '(God Mode: exact)' : '(your read: ' + readLabel(c).toLowerCase() + ')'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 16px' }}>
                {CR_KEYS.map(k => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <span style={muted}>{CR_LABEL[k]}</span>
                    {god ? (
                      <NumInput
                        god
                        value={c.r[k]}
                        min={1}
                        max={99}
                        width={60}
                        onValue={v => {
                          godEditCoach(gm, c.id, { [k]: v });
                          refresh();
                        }}
                      />
                    ) : (
                      <b>{grade(readOf(c, k))}</b>
                    )}
                  </div>
                ))}
              </div>
              {god && (
                <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', ...godText }}>
                  <span>
                    Overall <b>{coachOvr(c).toFixed(1)}</b>
                  </span>
                  <span>
                    Ceiling{' '}
                    <NumInput
                      god
                      value={c.ceil}
                      min={1}
                      max={99}
                      width={60}
                      onValue={v => {
                        godEditCoach(gm, c.id, { ceil: v });
                        refresh();
                      }}
                    />
                  </span>
                  <span>
                    Personality:{' '}
                    {Object.keys(CP_LABEL)
                      .map(k => CP_LABEL[k][1].split(' ').slice(-1)[0] + ' ' + c.pers[k])
                      .join(' · ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="dialog-actions" style={{ flexShrink: 0 }}>
          {god && !c.ret && c.tid !== s.me && (
            <button
              className="btn btn-secondary"
              style={godBtn}
              onClick={() => {
                godAppoint(gm, s, s.me, c.id, 'asst');
                refresh();
              }}
            >
              Appoint to your staff
            </button>
          )}
          <button className="btn btn-secondary" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

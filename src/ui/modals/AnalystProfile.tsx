// An analyst's profile (analytics.ts): face, who they are, their job and contract, your read of their skill, what their
// track record shows, and each graded season and draft class (God Mode: exact skill and biases, editable).
// Opened with gm.setState({ anPid }).
import type { VM } from '../vm';
import { godBox, godText, muted, NumInput, td, th } from '../kit';
import { CoachFace } from '../CoachFace';
import { AnalystBioEditor } from './AnalystBioEditor';
import { fmtMoney as money } from '../../engine/capModel';
import { grade } from '../../engine/staff';
import {
  AN_ROLE_LABEL,
  anAge,
  anAsk,
  anPrefYears,
  anReadLabel,
  anYears,
  BIAS_KEYS,
  BIAS_LABEL,
  godEditAnalyst,
  readSkill,
  recordLine,
  tendencies,
  type Analyst,
  type BiasKey,
} from '../../engine/analytics';

const PERS: Record<'money' | 'loyal' | 'amb', [string, string]> = {
  money: ['Not in it for the money', 'Wants to be paid'],
  loyal: ['Restless', 'Loyal'],
  amb: ['Content', 'Ambitious'],
};
const seasonLabel = (y: number) => y - 1 + '–' + String(y).slice(2);
const signed = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1);
const mean = ([sum, n]: [number, number]) => (n ? signed(sum / n) : '—');

export function AnalystProfile({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx;
  void s.gv;
  const a: Analyst | undefined = (gm.db as any).analysts?.[s.anPid];
  if (!a) return null;
  const god = !!s.god,
    age = anAge(gm, a),
    close = () => gm.setState({ anPid: null }),
    refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const T = a.tid != null ? s.teams[a.tid] : null,
    tab: 'ov' | 'rec' = s.anTab || 'ov',
    setTab = (k: string) => gm.setState({ anTab: k });
  const traits = (Object.keys(PERS) as (keyof typeof PERS)[])
    .map(k => (a.pers[k] >= 65 ? PERS[k][1] : a.pers[k] <= 35 ? PERS[k][0] : null))
    .filter(Boolean) as string[];
  const r = recordLine(a),
    seen = tendencies(a),
    rec = (a.rec || []).slice().reverse(),
    drec = (a.drec || []).slice().reverse();
  const row = (k: string, v: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, padding: '3px 0', fontSize: '13px' }}>
      <span style={muted}>{k}</span>
      <span>{v}</span>
    </div>
  );
  const nat = gm.db.C?.[a.nat]?.n || a.nat;
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
        style={{ width: 'min(900px, calc(100vw - 32px))', height: 'min(640px, calc(100vh - 40px))', overflow: 'hidden' }}
      >
        <div className="dialog-title" style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          <CoachFace gm={gm} c={{ ...(a as any), id: 500000 + a.id }} age={age} size={84} />
          <div>
            <div>{a.name}</div>
            <div style={{ fontSize: '13px', fontWeight: 400, ...muted }}>
              {a.ret
                ? 'Left analytics (' + a.ret + ')'
                : T
                  ? AN_ROLE_LABEL[a.role || 'analyst'] + ', ' + T.region + ' ' + T.name
                  : 'Available'}
              {' · '}
              {a.bg}
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
              ['rec', 'Track record'],
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
          {tab === 'ov' && (
            <div className="dialog-body" style={{ fontSize: '13px' }}>
              {row('Age', age + (a.fem ? ' · woman' : ''))}
              {row('Nationality', nat)}
              {row('Background', a.bg)}
              {row('In analytics', anYears(gm, a) ? anYears(gm, a) + ' years · since ' + a.since : 'New')}
              {row('Reputation', a.rep + ' / 100')}
              {row(
                'Skill',
                god ? (
                  <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', ...godText }}>
                    <NumInput
                      god
                      value={a.skill}
                      min={1}
                      max={99}
                      width={60}
                      onValue={v => {
                        godEditAnalyst(gm, a.id, { skill: v });
                        refresh();
                      }}
                    />
                    <span>
                      Ceiling{' '}
                      <NumInput
                        god
                        value={a.ceil ?? a.skill}
                        min={1}
                        max={99}
                        width={60}
                        onValue={v => {
                          godEditAnalyst(gm, a.id, { ceil: v });
                          refresh();
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '12px' }}>(God Mode: exact)</span>
                  </span>
                ) : (
                  <>
                    <b>{a.read > 0.05 ? grade(readSkill(a)) : '?'}</b>{' '}
                    <span style={muted}>(your read: {anReadLabel(a).toLowerCase()})</span>
                  </>
                ),
              )}
              {row('Personality', traits.length ? traits.join(' · ') : 'Nothing stands out')}
              {T && !a.ret && row('Contract', money(a.amt) + ' a year through ' + seasonLabel(a.exp))}
              {T &&
                !a.ret &&
                a.next &&
                row(
                  'Signed extension',
                  money(a.next.amt) + ' a year from ' + seasonLabel(a.next.start) + ' through ' + seasonLabel(a.next.exp),
                )}
              {!T &&
                !a.ret &&
                row(
                  'Asking',
                  money(anAsk(gm, a, 'analyst')) +
                    ' a year as an analyst, ' +
                    money(anAsk(gm, a, 'head')) +
                    ' as Head of Analytics · prefers ' +
                    anPrefYears(a) +
                    ' years',
                )}
              {row(
                'Projections',
                r.mae != null
                  ? 'Off by ' + r.mae.toFixed(1) + ' on average (' + r.seasons + ' season' + (r.seasons === 1 ? '' : 's') + ')'
                  : 'Graded after a season with you',
              )}
              {row(
                'Draft boards',
                r.hit != null
                  ? Math.round(r.hit * 100) + '% of pairs in the right order (your scouts ' + Math.round((r.scouts ?? 0.5) * 100) + '%)'
                  : 'Graded three seasons after the draft',
              )}
              {row(
                'Tendencies',
                seen.length ? seen.join(' · ') : (a.rec || []).length ? 'Nothing stands out yet' : 'No record with you yet',
              )}
              {god && (
                <div style={{ ...godBox, padding: '8px 12px', marginTop: 12 }}>
                  <div style={{ margin: '0 0 4px', fontWeight: 600, ...godText }}>
                    Biases <span style={{ fontWeight: 400, fontSize: '12px' }}>(God Mode: strength in %, 0 for none)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '4px 16px' }}>
                    {BIAS_KEYS.map((k: BiasKey) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span style={godText}>{BIAS_LABEL[k]}</span>
                        <NumInput
                          god
                          value={Math.round((a.bias[k] || 0) * 100)}
                          min={0}
                          max={100}
                          width={60}
                          onValue={v => {
                            godEditAnalyst(gm, a.id, { bias: { [k]: v / 100 } });
                            refresh();
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, ...godText }}>
                    Personality: money {a.pers.money} · loyalty {a.pers.loyal} · ambition {a.pers.amb} · read {Math.round(a.read * 100)}%
                  </div>
                </div>
              )}
              {god && <AnalystBioEditor key={a.id} gm={gm} analyst={a} onSave={refresh} />}
            </div>
          )}
          {tab === 'rec' && (
            <div className="dialog-body" style={{ fontSize: '13px' }}>
              <p style={{ margin: '0 0 8px', ...muted }}>
                Every opening night the department projects the league&rsquo;s regulars; at season&rsquo;s end each projection is checked
                against where the player ended up (overall points; + means too high). Groups show the average miss on shooters, defenders,
                players past 30, and players whose numbers jumped or fell a lot the season before (in the swing&rsquo;s direction).
              </p>
              {rec.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={th()}>Season</th>
                        <th style={th('right')}>Players</th>
                        <th style={th('right')}>Average miss</th>
                        <th style={th('right')}>Leaned</th>
                        <th style={th('right')}>Shooters</th>
                        <th style={th('right')}>Defenders</th>
                        <th style={th('right')}>Past 30</th>
                        <th style={th('right')}>After a big swing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.map(x => (
                        <tr key={x.y} style={{ borderTop: '1px solid var(--color-divider)' }}>
                          <td style={td()}>{seasonLabel(x.y)}</td>
                          <td style={td('right')}>{x.n}</td>
                          <td style={td('right')}>{x.mae.toFixed(1)}</td>
                          <td style={td('right')}>{mean([x.all, x.n])}</td>
                          <td style={td('right')} title={x.sh[1] + ' players'}>
                            {mean(x.sh)}
                          </td>
                          <td style={td('right')} title={x.df[1] + ' players'}>
                            {mean(x.df)}
                          </td>
                          <td style={td('right')} title={x.old[1] + ' players'}>
                            {mean(x.old)}
                          </td>
                          <td style={td('right')} title={(x.jm?.[1] || 0) + ' players'}>
                            {x.jm ? mean(x.jm) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={muted}>No graded seasons yet.</p>
              )}
              <div style={{ margin: '16px 0 4px', fontWeight: 600 }}>Draft boards</div>
              <p style={{ margin: '0 0 8px', ...muted }}>
                Graded three seasons on: how often the board had two players in the right order, against your scouts&rsquo; board, and the
                average miss on prospects with a big college box plus/minus against the class as a whole.
              </p>
              {drec.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={th()}>Draft</th>
                        <th style={th('right')}>Prospects</th>
                        <th style={th('right')}>Right order</th>
                        <th style={th('right')}>Scouts</th>
                        <th style={th('right')}>Big college BPM</th>
                        <th style={th('right')}>Whole class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drec.map(x => (
                        <tr key={x.cls} style={{ borderTop: '1px solid var(--color-divider)' }}>
                          <td style={td()}>{x.cls}</td>
                          <td style={td('right')}>{x.n}</td>
                          <td style={td('right')}>{Math.round(x.hit * 100)}%</td>
                          <td style={td('right')}>{Math.round(x.scouts * 100)}%</td>
                          <td style={td('right')} title={x.bpm[1] + ' prospects'}>
                            {mean(x.bpm)}
                          </td>
                          <td style={td('right')}>{signed(x.all)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={muted}>No graded draft boards yet.</p>
              )}
            </div>
          )}
        </div>
        <div className="dialog-actions" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

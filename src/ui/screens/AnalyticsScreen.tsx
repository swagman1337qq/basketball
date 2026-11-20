// The analytics department (2026-11-20, analytics.ts): a Head of Analytics and two analysts, what they've got right
// and wrong (their track record and the tendencies it shows), and the analytics people you can hire. Their skill is
// your read (a grade that firms up month by month); their biases you learn from their record. God Mode: exact.
import { useState } from 'react';
import type { VM } from '../vm';
import { godBtn, h4Style, muted, NumInput, Seg, td, th } from '../kit';
import { CoachFace } from '../CoachFace';
import { fmtMoney as money } from '../../engine/capModel';
import { grade } from '../../engine/staff';
import {
  AN_ROLE_LABEL,
  anAccept,
  anAge,
  anAsk,
  analyticsCost,
  anPrefYears,
  anReadLabel,
  anYears,
  BIAS_LABEL,
  deptOf,
  fireAnalyst,
  freeAnalysts,
  hireAnalyst,
  readSkill,
  recordLine,
  setAnRole,
  tendencies,
  type Analyst,
  type AnRole,
  type BiasKey,
} from '../../engine/analytics';

export function AnalyticsScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    tid = s.me,
    god = !!s.god;
  void s.gv;
  const [offer, setOffer] = useState<{ id: number; role: AnRole; amt: number; years: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [firing, setFiring] = useState<number | null>(null);
  const [more, setMore] = useState(15);
  const refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const act = (f: () => string, ok?: string) => {
    const e = f();
    setMsg(e || ok || '');
    refresh();
  };
  const dept = deptOf(gm, tid),
    cost = analyticsCost(gm, s, tid);
  const nat = (a: Analyst) => gm.db.C?.[a.nat]?.n || a.nat;
  const face = (a: Analyst, size: number) => <CoachFace gm={gm} c={{ ...(a as any), id: 500000 + a.id }} age={anAge(gm, a)} size={size} />;
  const flag = (a: Analyst) => (
    <img
      src={gm.flag(a.nat)}
      alt={nat(a)}
      title={nat(a)}
      style={{ width: 18, height: 12, objectFit: 'contain', verticalAlign: 'middle', marginLeft: 6 }}
    />
  );
  const skill = (a: Analyst) => {
    const v = readSkill(a, god);
    return (
      <span title={god ? 'Skill ' + a.skill : 'Your read of his skill: ' + anReadLabel(a)}>
        {god ? a.skill : a.read > 0.05 ? grade(v) : '?'}
      </span>
    );
  };
  const biasCell = (a: Analyst) => {
    const seen = tendencies(a);
    const exact = Object.entries(a.bias) as [BiasKey, number][];
    return (
      <div style={{ fontSize: '12px' }}>
        {god && (
          <div style={{ color: 'var(--color-accent-700)' }}>
            {exact.length ? exact.map(([k, v]) => BIAS_LABEL[k] + ' (' + Math.round(v * 100) + '%)').join(' · ') : 'No biases'}
          </div>
        )}
        {seen.length ? (
          seen.join(' · ')
        ) : (
          <span style={muted}>{(a.rec || []).length ? 'Nothing stands out yet' : 'No record with you yet'}</span>
        )}
      </div>
    );
  };
  const record = (a: Analyst) => {
    const r = recordLine(a);
    return (
      <div style={{ fontSize: '12px' }}>
        {r.mae != null ? (
          <div title="His opening-night projections against where each player ended the season (average miss, overall points)">
            Projections: off by {r.mae.toFixed(1)} ({r.seasons} season{r.seasons === 1 ? '' : 's'})
          </div>
        ) : (
          <div style={muted}>Projections: graded after a season</div>
        )}
        {r.hit != null ? (
          <div title="How often his draft board had two players in the right order three seasons on, against your scouts'">
            Draft: {Math.round(r.hit * 100)}% right (scouts {Math.round((r.scouts ?? 0.5) * 100)}%)
          </div>
        ) : (
          <div style={muted}>Draft: graded three seasons on</div>
        )}
      </div>
    );
  };
  const startOffer = (a: Analyst, role: AnRole = a.role || (dept.some(x => x.role === 'head') ? 'analyst' : 'head')) =>
    setOffer({ id: a.id, role, amt: anAsk(gm, a, role), years: anPrefYears(a) });
  const oa = offer ? (gm.db as any).analysts?.[offer.id] : null;
  const acc = oa && offer ? anAccept(gm, s, tid, oa, offer) : null;
  const pool = freeAnalysts(gm)
    .slice()
    .sort((a, b) => b.rep - a.rep);
  return (
    <>
      <h4 style={h4Style}>Your department</h4>
      <p style={{ margin: '0 0 10px', fontSize: '13px', ...muted }}>
        A Head of Analytics and two analysts. They never see ratings: everything they say comes from the numbers (box scores, college and
        club stats, age), so they catch what the box score shows and miss what it doesn&rsquo;t. Each has a skill and may have biases
        (loving threes, trusting college box plus/minus too much, blindness to defense, chasing small samples, skepticism about older
        players). You learn their skill working with them, and their biases from their track record: every opening night they project the
        league&rsquo;s regulars, graded at season&rsquo;s end; every draft board is graded three seasons on. Their views appear on the draft
        board, player profiles, free agency and trades.
      </p>
      <div style={{ fontSize: '12px', ...muted, marginBottom: 8 }}>
        {dept.length} of 3 · {money(cost)} a season (Finances: Analytics department)
        {!dept.length ? ' · no department: no analytics advice' : ''}
      </div>
      {msg && <div style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-accent-800)' }}>{msg}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={th()}>Analyst</th>
              <th style={th('right')}>Age</th>
              <th style={th()}>Job</th>
              <th style={th('right')} title="Reputation (0–100)">
                Rep
              </th>
              <th style={th('right')} title="How good his numbers are (your read; God Mode: exact)">
                Skill
              </th>
              <th style={th()}>Track record</th>
              <th style={th()}>Tendencies in the record</th>
              <th style={th('right')}>Contract</th>
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {dept.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {face(a, 34)}
                    <div>
                      <b>{a.name}</b>
                      {flag(a)}
                      <div style={{ fontSize: '11px', ...muted }}>
                        {a.bg} · {anYears(gm, a)} yrs in analytics
                      </div>
                    </div>
                  </div>
                </td>
                <td style={td('right')}>{anAge(gm, a)}</td>
                <td style={td()}>
                  <select
                    value={a.role || 'analyst'}
                    onChange={e => act(() => setAnRole(gm, s, tid, a.id, e.target.value as AnRole, god))}
                    style={{ fontSize: '12.5px' }}
                  >
                    {(['head', 'analyst'] as AnRole[]).map(r => (
                      <option key={r} value={r}>
                        {AN_ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={td('right')}>{a.rep}</td>
                <td style={td('right')}>{skill(a)}</td>
                <td style={td()}>{record(a)}</td>
                <td style={td()}>{biasCell(a)}</td>
                <td style={td('right')}>
                  {money(a.amt)}
                  <div style={{ fontSize: '11px', ...muted }}>
                    thru {a.exp - 1}–{String(a.exp).slice(2)}
                    {a.next ? ' · extended thru ' + (a.next.exp - 1) + '–' + String(a.next.exp).slice(2) : ''}
                  </div>
                </td>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {!a.next && (
                      <button className="btn btn-secondary" onClick={() => startOffer(a)}>
                        Re-sign
                      </button>
                    )}
                    {firing === a.id ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ color: 'var(--gm-bad)', borderColor: 'var(--gm-bad)' }}
                          onClick={() => {
                            setFiring(null);
                            act(() => fireAnalyst(gm, s, tid, a.id, god), a.name + ' is gone.');
                          }}
                        >
                          {god
                            ? 'Confirm'
                            : 'Confirm (' + money(a.amt) + ' a year through ' + (a.exp - 1) + '–' + String(a.exp).slice(2) + ')'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setFiring(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => setFiring(a.id)} title="Let go: paid to the end of the contract">
                        Let go
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!dept.length && (
              <tr>
                <td colSpan={9} style={{ ...td(), ...muted, fontStyle: 'italic' }}>
                  Nobody yet. Hire from the analysts below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {offer && oa && (
        <div
          style={{
            margin: '14px 0',
            padding: '12px 14px',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {face(oa, 44)}
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>
                {oa.tid === tid ? 'Re-sign ' : 'Offer: '}
                {oa.name}
              </div>
              <div style={{ fontSize: '12px', ...muted }}>
                Reputation {oa.rep} · asks about {money(anAsk(gm, oa, offer.role))} a year as {AN_ROLE_LABEL[offer.role]} · prefers{' '}
                {anPrefYears(oa)} years
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Seg<AnRole>
              value={offer.role}
              options={
                oa.tid === tid
                  ? [[oa.role!, AN_ROLE_LABEL[oa.role! as AnRole]]]
                  : [
                      ['head', 'Head of Analytics'],
                      ['analyst', 'Analyst'],
                    ]
              }
              onChange={r => setOffer({ ...offer, role: r, amt: Math.max(offer.amt, anAsk(gm, oa, r)) })}
            />
            <span>
              Salary{' '}
              <NumInput
                value={offer.amt}
                min={0.05}
                max={10}
                step={0.05}
                width={80}
                onValue={v => setOffer({ ...offer, amt: v })}
                suffix="$M a year"
              />
            </span>
            <span>
              Years <NumInput value={offer.years} min={1} max={5} step={1} width={56} onValue={v => setOffer({ ...offer, years: v })} />
            </span>
          </div>
          <div style={{ fontSize: '13px', color: acc?.ok ? 'var(--gm-good)' : 'var(--color-accent-800)' }}>
            {acc?.ok ? oa.name + ': “Let’s do it.”' : oa.name + ': “' + (acc?.why || '') + '”'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              disabled={!acc?.ok}
              onClick={() => {
                const e = hireAnalyst(gm, s, tid, oa.id, offer);
                setMsg(e || oa.name + ' signed: ' + money(offer.amt) + ' × ' + offer.years + ' as ' + AN_ROLE_LABEL[offer.role] + '.');
                if (!e) setOffer(null);
                refresh();
              }}
            >
              {oa.tid === tid ? 'Re-sign' : 'Sign'}
            </button>
            {god && (
              <button
                className="btn btn-secondary"
                style={godBtn}
                onClick={() => {
                  const e = hireAnalyst(gm, s, tid, oa.id, offer, true);
                  setMsg(e || oa.name + ' signed (God Mode).');
                  if (!e) setOffer(null);
                  refresh();
                }}
              >
                Force sign
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setOffer(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <h4 style={{ ...h4Style, marginTop: 18 }}>Analytics people available</h4>
      <p style={{ margin: '0 0 8px', fontSize: '13px', ...muted }}>
        Background, years in the field and reputation are what you can see. Their skill is a guess until they work for you
        {god ? ' (God Mode: exact, with their biases)' : ''}.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={th()}>Analyst</th>
              <th style={th('right')}>Age</th>
              <th style={th()}>Background</th>
              <th style={th('right')}>Years</th>
              <th style={th('right')}>Rep</th>
              {god && <th style={th('right')}>Skill</th>}
              {god && <th style={th()}>Biases</th>}
              <th style={th('right')}>Asking</th>
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {pool.slice(0, more).map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {face(a, 28)}
                    <b>{a.name}</b>
                    {flag(a)}
                  </div>
                </td>
                <td style={td('right')}>{anAge(gm, a)}</td>
                <td style={td('left', { fontSize: '12px' })}>{a.bg}</td>
                <td style={td('right')}>{anYears(gm, a)}</td>
                <td style={td('right')}>{a.rep}</td>
                {god && <td style={td('right')}>{a.skill}</td>}
                {god && (
                  <td style={td('left', { fontSize: '12px' })}>
                    {(Object.entries(a.bias) as [BiasKey, number][]).map(([k]) => BIAS_LABEL[k]).join(' · ') || '—'}
                  </td>
                )}
                <td style={td('right')}>{money(anAsk(gm, a, dept.some(x => x.role === 'head') ? 'analyst' : 'head'))}</td>
                <td style={td('right')}>
                  <button className="btn btn-secondary" onClick={() => startOffer(a)}>
                    Make an offer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pool.length > more && (
        <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setMore(more + 15)}>
          Show more
        </button>
      )}
    </>
  );
}

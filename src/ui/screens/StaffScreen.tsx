// Coaching staff (2026-11-15, staff.ts): your assistants (you are the head coach), what they add, their contracts,
// and the coaches you can hire. Hidden ratings show as your read (grades that firm up month by month); God Mode
// shows them exactly and adds any coach to your staff on the spot.
import { useState } from 'react';
import type { VM } from '../vm';
import { godBtn, h4Style, muted, NumInput, Seg, td, th } from '../kit';
import { CoachFace } from '../CoachFace';
import { fmtMoney as money } from '../../engine/capModel';
import {
  answerRaise,
  coachAccept,
  coachAge,
  coachAsk,
  coachPrefYears,
  coachYears,
  CR_KEYS,
  fireCoach,
  freeCoaches,
  godAppoint,
  godNewCoach,
  grade,
  hireCoach,
  playLine,
  readLabel,
  readOf,
  readRatings,
  ROLE_LABEL,
  setRole,
  staffCost,
  staffFxRead,
  staffOf,
  STAFF_MAX,
  STAFF_MIN,
  styleOf,
  type Coach,
  type CoachRole,
} from '../../engine/staff';

const SHORT: Record<string, string> = { off: 'OFF', def: 'DEF', dev: 'DEV', game: 'GM', mot: 'MOT', teach: 'TCH', eye: 'EYE' };
const LONG: Record<string, string> = {
  off: 'Offense',
  def: 'Defense',
  dev: 'Player development',
  game: 'Game management (in-game reads)',
  mot: 'Motivation',
  teach: 'Teaching',
  eye: 'Eye for talent',
};
const sgn = (v: number, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);

export function StaffScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    tid = s.me,
    god = !!s.god,
    T = s.teams[tid];
  void s.gv; // re-render when the staff changes
  const [offer, setOffer] = useState<{ id: number; role: CoachRole; amt: number; years: number } | null>(null);
  const [sortK, setSortK] = useState<'rep' | 'age' | 'ask'>('rep');
  const [styleF, setStyleF] = useState<string>('all');
  const [q, setQ] = useState('');
  const [more, setMore] = useState(30);
  const [msg, setMsg] = useState('');
  const [firing, setFiring] = useState<number | null>(null);
  const refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const openC = (id: number) => gm.setState({ coachPid: id });
  const st = staffOf(gm, tid),
    fx = staffFxRead(gm, tid, god),
    cost = staffCost(gm, s, tid);
  const nat = (c: Coach) => gm.db.C?.[c.nat]?.n || c.nat;
  const styleRead = (c: Coach) => styleOf(c, readRatings(c, god));
  const act = (f: () => string, ok?: string) => {
    const e = f();
    setMsg(e || ok || '');
    refresh();
  };
  const startOffer = (c: Coach, role: CoachRole = c.role || 'asst') =>
    setOffer({ id: c.id, role, amt: coachAsk(gm, c, role), years: c.tid === tid ? coachPrefYears(c) : coachPrefYears(c) });
  const rating = (c: Coach, k: (typeof CR_KEYS)[number]) => {
    const v = readOf(c, k, god);
    return (
      <span title={LONG[k] + (god ? ': ' + c.r[k] : ' · your read: ' + readLabel(c))} style={{ display: 'inline-block', minWidth: 24 }}>
        {god ? c.r[k] : grade(v)}
      </span>
    );
  };
  const chip = (label: string, v: string, tip: string, tone = 0) => (
    <div
      title={tip}
      style={{
        padding: '6px 10px',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-sm)',
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: '11px', ...muted }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          color: tone > 0 ? 'var(--gm-good)' : tone < 0 ? 'var(--gm-bad)' : 'var(--color-text)',
        }}
      >
        {v}
      </div>
    </div>
  );
  // ── The market ──
  const pool = freeCoaches(gm)
    .filter(c => (styleF === 'all' ? true : styleRead(c) === styleF))
    .filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sortK === 'age'
        ? coachAge(gm, a) - coachAge(gm, b)
        : sortK === 'ask'
          ? coachAsk(gm, a, 'asst') - coachAsk(gm, b, 'asst')
          : b.rep - a.rep,
    );
  const oc = offer ? gm.db.coaches?.[offer.id] : null;
  const acc = oc && offer ? coachAccept(gm, s, tid, oc, offer) : null;
  return (
    <>
      <h4 style={h4Style}>Coaching staff</h4>
      <p style={{ margin: '0 0 10px', fontSize: '13px', ...muted }}>
        You are the head coach of the {T.region} {T.name}. Your assistants: a Lead Assistant (your in-game reads), Assistant Coaches (each
        helps the end of the floor his style points to) and a Head of Player Development. {STAFF_MIN} to {STAFF_MAX} coaches
        {god ? ' (God Mode: any number)' : ''}. Their effect is small next to the players&rsquo;: at most about 1.5 points per 100
        possessions in all.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        {chip(
          'Offense',
          sgn(fx.ptsO) + ' pts/100',
          'Shot quality your offensive-minded coaches add (points per 100 possessions)',
          Math.sign(+fx.ptsO.toFixed(1)),
        )}
        {chip(
          'Defense',
          sgn(fx.ptsD) + ' pts/100',
          'Points per 100 possessions your defensive-minded coaches take away',
          Math.sign(+fx.ptsD.toFixed(1)),
        )}
        {chip(
          'In-game reads',
          Math.round(fx.q * 100) + '%',
          'How often your staff makes the right in-game adjustment (your Lead Assistant’s game management). A typical staff: 57%.',
          Math.abs(fx.q - 0.573) < 0.02 ? 0 : Math.sign(fx.q - 0.573),
        )}
        {chip(
          'Player growth',
          sgn(fx.growth * 100, 0) + '%',
          'Your Head of Player Development and the staff’s teaching. A poor staff also lets skills slip a little each month.',
          Math.sign(Math.round(fx.growth * 100)),
        )}
        {chip('Morale', sgn(fx.mot, 0), 'Your coaches’ motivation: a factor in every player’s mood', Math.sign(fx.mot))}
        {chip('Cost', money(cost), 'Salaries plus support staff (video, strength, medical), paid each season (Finances: Coaching staff)')}
      </div>
      <div style={{ fontSize: '12px', ...muted, marginBottom: 10 }}>
        {god
          ? 'God Mode: exact ratings.'
          : 'From what you know of your coaches: your read firms up month by month while they work for you.'}{' '}
        {st.length} coach{st.length === 1 ? '' : 'es'}
        {!god && st.length < STAFF_MIN ? ' · fewer than ' + STAFF_MIN + ': hire someone' : ''}
        {!st.some(c => c.role === 'lead') ? ' · no Lead Assistant: your in-game reads suffer' : ''}
        {!st.some(c => c.role === 'dev') ? ' · no Head of Player Development: growth suffers' : ''}
      </div>
      {msg && <div style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-accent-800)' }}>{msg}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={th()}>Coach</th>
              <th style={th()}>Role</th>
              <th style={th()}>Style</th>
              <th style={th('right')} title="Reputation (0–100)">
                Rep
              </th>
              {CR_KEYS.map(k => (
                <th key={k} style={th('right')} title={LONG[k]}>
                  {SHORT[k]}
                </th>
              ))}
              <th style={th('right')}>Contract</th>
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {st.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CoachFace c={c} age={coachAge(gm, c)} size={34} />
                    <div>
                      <button className="hv4" onClick={() => openC(c.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                        {c.name}
                      </button>
                      <div style={{ fontSize: '11px', ...muted }}>
                        {coachAge(gm, c)} · {nat(c)} · {coachYears(gm, c)} yrs coaching · {readLabel(c)}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={td()}>
                  <select
                    value={c.role || 'asst'}
                    onChange={e => act(() => setRole(gm, s, tid, c.id, e.target.value as CoachRole, god))}
                    style={{ fontSize: '12.5px' }}
                  >
                    {(['lead', 'asst', 'dev'] as CoachRole[]).map(r => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={td()}>{styleRead(c)}</td>
                <td style={td('right')}>{c.rep}</td>
                {CR_KEYS.map(k => (
                  <td key={k} style={td('right')}>
                    {rating(c, k)}
                  </td>
                ))}
                <td style={td('right')}>
                  {money(c.amt)}
                  <div style={{ fontSize: '11px', ...muted }}>
                    through {c.exp - 1}–{String(c.exp).slice(2)}
                  </div>
                </td>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {c.raise && (
                      <>
                        <button
                          className="btn btn-secondary"
                          title={'He asks for ' + money(c.raise.ask) + ' a year'}
                          onClick={() => {
                            answerRaise(gm, s, c.id, true);
                            setMsg(c.name + ' got his raise.');
                            refresh();
                          }}
                        >
                          Raise to {money(c.raise.ask)}
                        </button>
                        <button
                          className="btn btn-secondary"
                          title="Turn him down: he won’t re-sign when his deal ends"
                          onClick={() => {
                            answerRaise(gm, s, c.id, false);
                            setMsg('You turned ' + c.name + ' down.');
                            refresh();
                          }}
                        >
                          Refuse
                        </button>
                      </>
                    )}
                    {c.exp <= gm.Y && (
                      <button className="btn btn-secondary" onClick={() => startOffer(c)} title="His contract ends this summer">
                        Re-sign
                      </button>
                    )}
                    {firing === c.id ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ color: 'var(--gm-bad)', borderColor: 'var(--gm-bad)' }}
                          onClick={() => {
                            setFiring(null);
                            act(() => fireCoach(gm, s, tid, c.id, god), c.name + ' is gone.');
                          }}
                        >
                          {god
                            ? 'Confirm'
                            : 'Confirm (' + money(c.amt) + ' a year through ' + (c.exp - 1) + '–' + String(c.exp).slice(2) + ')'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setFiring(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setFiring(c.id)}
                        title="Fire him: he’s paid to the end of his deal"
                      >
                        Fire
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {offer && oc && (
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
            <CoachFace c={oc} age={coachAge(gm, oc)} size={44} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>
                {oc.tid === tid ? 'Re-sign ' : 'Offer: '}
                {oc.name}
              </div>
              <div style={{ fontSize: '12px', ...muted }}>
                Reputation {oc.rep} · asks about {money(coachAsk(gm, oc, offer.role))} a year as {ROLE_LABEL[offer.role]} · prefers{' '}
                {coachPrefYears(oc)} years
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Seg<CoachRole>
              value={offer.role}
              options={[
                ['lead', 'Lead Assistant'],
                ['asst', 'Assistant Coach'],
                ['dev', 'Player Development'],
              ]}
              onChange={r => setOffer({ ...offer, role: r, amt: Math.max(offer.amt, coachAsk(gm, oc, r)) })}
            />
            <span>
              Salary{' '}
              <NumInput
                value={offer.amt}
                min={0.1}
                max={20}
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
            {acc?.ok ? oc.name + ': “Let’s do it.”' : oc.name + ': “' + (acc?.why || '') + '”'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              disabled={!acc?.ok}
              onClick={() => {
                const e = hireCoach(gm, s, tid, oc.id, offer);
                setMsg(e || oc.name + ' signed: ' + money(offer.amt) + ' × ' + offer.years + ' as ' + ROLE_LABEL[offer.role] + '.');
                if (!e) setOffer(null);
                refresh();
              }}
            >
              {oc.tid === tid ? 'Re-sign' : 'Sign'}
            </button>
            {god && (
              <button
                className="btn btn-secondary"
                style={godBtn}
                onClick={() => {
                  const e = hireCoach(gm, s, tid, oc.id, offer, true);
                  setMsg(e || oc.name + ' signed (God Mode).');
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

      <h4 style={{ ...h4Style, marginTop: 18 }}>Coaches available</h4>
      <p style={{ margin: '0 0 8px', fontSize: '13px', ...muted }}>
        What you can see before you hire someone: reputation, playing days and where he&rsquo;s coached. His style is what he&rsquo;s known
        for; his real ratings come into focus once he works for you.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <input placeholder="Search name" value={q} onChange={e => setQ(e.target.value)} style={{ width: 160 }} />
        <select value={styleF} onChange={e => setStyleF(e.target.value)}>
          <option value="all">All styles</option>
          <option value="Offense-minded">Offense-minded</option>
          <option value="Defense-minded">Defense-minded</option>
          <option value="Balanced">Balanced</option>
        </select>
        <select value={sortK} onChange={e => setSortK(e.target.value as any)}>
          <option value="rep">Sort: reputation</option>
          <option value="age">Sort: age</option>
          <option value="ask">Sort: asking price</option>
        </select>
        {god && (
          <button
            className="btn btn-secondary"
            style={godBtn}
            onClick={() => {
              const c = godNewCoach(gm);
              setMsg('New coach: ' + c.name + '.');
              refresh();
            }}
          >
            New coach
          </button>
        )}
        <span style={{ fontSize: '12px', ...muted }}>{pool.length} available</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={th()}>Coach</th>
              <th style={th()}>Known for</th>
              <th style={th('right')}>Rep</th>
              <th style={th()}>Played</th>
              <th style={th()}>Coaching</th>
              <th style={th('right')} title="His asking price as an Assistant Coach">
                Asks
              </th>
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {pool.slice(0, more).map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CoachFace c={c} age={coachAge(gm, c)} size={30} />
                    <div>
                      <button className="hv4" onClick={() => openC(c.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                        {c.name}
                      </button>
                      <div style={{ fontSize: '11px', ...muted }}>
                        {coachAge(gm, c)} · {nat(c)}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={td()}>{styleRead(c)}</td>
                <td style={td('right')}>{c.rep}</td>
                <td style={td('left', { fontSize: '12px' })}>{playLine(c)}</td>
                <td style={td('left', { fontSize: '12px' })}>
                  {coachYears(gm, c) ? coachYears(gm, c) + ' yrs · ' : ''}
                  {c.bg}
                </td>
                <td style={td('right')}>{money(coachAsk(gm, c, 'asst'))}</td>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => startOffer(c, 'asst')}>
                      Make an offer
                    </button>
                    {god && (
                      <button
                        className="btn btn-secondary"
                        style={godBtn}
                        title="God Mode: put him on your staff now (his asking price, the years he wants)"
                        onClick={() => act(() => godAppoint(gm, s, tid, c.id, 'asst'), c.name + ' joined your staff (God Mode).')}
                      >
                        Appoint
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pool.length > more && (
        <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setMore(more + 30)}>
          Show more
        </button>
      )}
    </>
  );
}

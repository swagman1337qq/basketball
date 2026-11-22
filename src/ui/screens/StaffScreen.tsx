// Coaching staff (2026-11-15, staff.ts): your assistants (you are the head coach), what they add, their contracts,
// and the coaches you can hire. Hidden ratings show as your read (grades that firm up month by month); God Mode
// shows them exactly and adds any coach to your staff on the spot.
import { Fragment, useState } from 'react';
import type { VM } from '../vm';
import { Link, godBtn, h4Style, muted, NumInput, Seg, td, th } from '../kit';
import { CoachFace } from '../CoachFace';
import { fmtMoney as money } from '../../engine/capModel';
import {
  answerRaise,
  coachAccept,
  coachAge,
  coachAsk,
  coachPrefYears,
  coachYears,
  coachWording,
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
  coachWay,
  wayLabel,
  type Coach,
  type CoachRole,
} from '../../engine/staff';
import { careerSummary, coachRows, headCoachOf, ROLE_CODE } from '../../engine/coachCareer';
import { hotSeat, projectedWins } from '../../engine/carousel';

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
type StaffTable = 'staff' | 'market' | 'league';
type StaffSort = { key: string; dir: 1 | -1 };

export function StaffScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    tid = s.me,
    god = !!s.god,
    T = s.teams[tid];
  void s.gv; // re-render when the staff changes
  const [offer, setOffer] = useState<{ id: number; role: CoachRole; amt: number; years: number } | null>(null);
  const [sorts, setSorts] = useState<Record<StaffTable, StaffSort | null>>({ staff: null, market: { key: 'rep', dir: -1 }, league: null });
  const [styleF, setStyleF] = useState<string>('all');
  const [q, setQ] = useState('');
  const [more, setMore] = useState(30);
  const [msg, setMsg] = useState('');
  const [firing, setFiring] = useState<number | null>(null);
  const [openT, setOpenT] = useState<number | null>(null);
  const refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const openC = (id: number) => gm.setState({ coachPid: id });
  const st = staffOf(gm, tid),
    fx = staffFxRead(gm, tid, god),
    cost = staffCost(gm, s, tid);
  const nat = (c: Coach) => gm.db.C?.[c.nat]?.n || c.nat;
  const flag = (c: Coach) => (
    <img
      src={gm.flag(c.nat)}
      alt={nat(c)}
      title={nat(c)}
      style={{ width: 18, height: 12, objectFit: 'contain', verticalAlign: 'middle', marginLeft: 6 }}
    />
  );
  const styleRead = (c: Coach) => styleOf(c, readRatings(c, god));
  const sortHead = (table: StaffTable, key: string, label: string, align: 'left' | 'right' = 'left', title?: string) => {
    const sort = sorts[table],
      active = sort?.key === key;
    return (
      <th key={key} style={th(align)} title={title} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          onClick={() =>
            setSorts(prev => ({
              ...prev,
              [table]: {
                key,
                dir:
                  prev[table]?.key === key
                    ? prev[table]!.dir === 1
                      ? -1
                      : 1
                    : align === 'left' || key === 'age' || key === 'ask'
                      ? 1
                      : -1,
              },
            }))
          }
          style={{ all: 'unset', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {label}{' '}
          <span aria-hidden="true" style={{ opacity: active ? 1 : 0.45 }}>
            {active ? (sort.dir === 1 ? '↑' : '↓') : '↕'}
          </span>
        </button>
      </th>
    );
  };
  const ordered = <R,>(rows: R[], table: StaffTable, value: (row: R, key: string) => number | string) => {
    const sort = sorts[table];
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = value(a, sort.key),
        bv = value(b, sort.key);
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
    });
  };
  const coachValue = (c: Coach, key: string): number | string => {
    if (CR_KEYS.includes(key as any)) return readOf(c, key as (typeof CR_KEYS)[number], god);
    switch (key) {
      case 'name':
        return c.name;
      case 'age':
        return coachAge(gm, c);
      case 'role':
        return ROLE_LABEL[c.role || 'asst'];
      case 'style':
        return styleRead(c);
      case 'rep':
        return c.rep;
      case 'contract':
        return c.amt;
      case 'ask':
        return coachAsk(gm, c, 'asst');
      case 'played':
        return playLine(c);
      case 'coaching':
        return coachYears(gm, c);
      default:
        return '';
    }
  };
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
  const pool = ordered(
    freeCoaches(gm)
      .filter(c => (styleF === 'all' ? true : styleRead(c) === styleF))
      .filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase())),
    'market',
    coachValue,
  );
  // The season he took this job: his unbroken run as this team's head coach (coachCareer.ts rows), else this one.
  const sinceOf = (c: Coach, t: number) => {
    let y = gm.Y;
    const rows = new Map((c.h || []).map(r => [r[0], r]));
    while (rows.get(y - 1)?.[1] === t && rows.get(y - 1)?.[2] === ROLE_CODE.hc) y--;
    return y;
  };
  const seasonLbl = (y: number) => y - 1 + '–' + String(y).slice(2);
  const heads = ordered(
    s.teams
      .filter((t: any) => !gm.isUser(s, t.tid))
      .map((t: any) => ({ t, c: headCoachOf(gm, t.tid) }))
      .filter((x: any) => x.c)
      .map(({ t, c }: any) => ({ t, c, sm: careerSummary(coachRows(gm, s, c)) })),
    'league',
    ({ t, c, sm }: any, key) => {
      if (key === 'team') return t.abbr;
      if (key === 'nba') return sm.nbaW + sm.nbaL ? sm.nbaW / (sm.nbaW + sm.nbaL) : -1;
      if (key === 'other') {
        const w = sm.hcW - sm.nbaW,
          l = sm.hcL - sm.nbaL;
        return w + l ? w / (w + l) : -1;
      }
      if (key === 'titles') return sm.hcRings;
      if (key === 'coy') return c.coy?.length || 0;
      if (key === 'since') return sinceOf(c, t.tid);
      if (key === 'exp') return c.exp;
      if (key === 'seat') return hotSeat(gm, t.tid);
      if (key === 'owner') return t.arch || '';
      return coachValue(c, key);
    },
  );
  const oc = offer ? gm.db.coaches?.[offer.id] : null;
  const acc = oc && offer ? coachAccept(gm, s, tid, oc, offer) : null;
  return (
    <>
      <h4 style={h4Style}>Coaching staff</h4>
      <p style={{ margin: '0 0 10px', fontSize: '13px', ...muted }}>
        You are the head coach of the {T.region} {T.name}. Your assistants: a Lead Assistant (your in-game reads), Assistant Coaches (each
        helps the end of the floor their style points to) and a Head of Player Development. {STAFF_MIN} to {STAFF_MAX} coaches
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
              {sortHead('staff', 'name', 'Coach')}
              {sortHead('staff', 'age', 'Age', 'right')}
              {sortHead('staff', 'role', 'Role')}
              {sortHead('staff', 'style', 'Style')}
              {sortHead('staff', 'rep', 'Rep', 'right', 'Reputation (0–100)')}
              {CR_KEYS.map(k => sortHead('staff', k, SHORT[k], 'right', LONG[k]))}
              {sortHead('staff', 'contract', 'Contract', 'right', 'Annual salary')}
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {ordered(st, 'staff', coachValue).map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CoachFace gm={gm} c={c} age={coachAge(gm, c)} size={34} />
                    <div>
                      <button className="hv4" onClick={() => openC(c.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                        {c.name}
                      </button>
                      {flag(c)}
                      <div style={{ fontSize: '11px', ...muted }}>
                        {nat(c)} · {coachYears(gm, c)} yrs coaching · {readLabel(c)}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={td('right')}>{coachAge(gm, c)}</td>
                <td style={td()}>
                  <select
                    value={c.role || 'asst'}
                    onChange={e => act(() => setRole(gm, s, tid, c.id, e.target.value as CoachRole, god))}
                    style={{ fontSize: '12.5px' }}
                  >
                    {([...(c.role === 'hc' ? ['hc'] : []), 'lead', 'asst', 'dev'] as CoachRole[]).map(r => (
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
                  {c.next && (
                    <div style={{ fontSize: '11px', ...muted }}>
                      Extension: {money(c.next.amt)} · {c.next.start - 1}–{String(c.next.start).slice(2)} through {c.next.exp - 1}–
                      {String(c.next.exp).slice(2)}
                    </div>
                  )}
                </td>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {c.raise && (
                      <>
                        <button
                          className="btn btn-secondary"
                          title={coachWording(c, 'He asks for ') + money(c.raise.ask) + ' a year'}
                          onClick={() => {
                            answerRaise(gm, s, c.id, true);
                            setMsg(c.name + coachWording(c, ' got his raise.'));
                            refresh();
                          }}
                        >
                          Raise to {money(c.raise.ask)}
                        </button>
                        <button
                          className="btn btn-secondary"
                          title={coachWording(c, 'Turn him down: he won’t re-sign when his deal ends')}
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
                    {c.exp <= gm.Y && !c.next && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => startOffer(c)}
                        title={coachWording(c, 'His contract ends this summer')}
                      >
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
                            : 'Confirm (' +
                              money(c.amt) +
                              ' a year through ' +
                              (c.exp - 1) +
                              '–' +
                              String(c.exp).slice(2) +
                              (c.next
                                ? '; plus signed extension: ' +
                                  money(c.next.amt) +
                                  ' a year through ' +
                                  (c.next.exp - 1) +
                                  '–' +
                                  String(c.next.exp).slice(2)
                                : '') +
                              ')'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setFiring(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setFiring(c.id)}
                        title={coachWording(c, 'Fire him: he’s paid to the end of his deal')}
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
            <CoachFace gm={gm} c={oc} age={coachAge(gm, oc)} size={44} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>
                {oc.tid === tid ? 'Re-sign ' : 'Offer: '}
                <Link onClick={() => openC(oc.id)}>{oc.name}</Link>
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
              options={
                oc.tid === tid
                  ? [[oc.role!, ROLE_LABEL[oc.role!]]]
                  : [
                      ['lead', 'Lead Assistant'],
                      ['asst', 'Assistant Coach'],
                      ['dev', 'Player Development'],
                    ]
              }
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
          {oc.tid === tid && (
            <div style={{ fontSize: '12px', ...muted }}>
              {coachWording(
                oc,
                'Renewal starts after his current deal ends. To change his job, use the role selector on your staff first.',
              )}
            </div>
          )}
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
        What you can see before you hire someone: reputation, playing days and where they&rsquo;ve coached. Their style is what
        they&rsquo;re known for; their real ratings come into focus once they work for you.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <input placeholder="Search name" value={q} onChange={e => setQ(e.target.value)} style={{ width: 160 }} />
        <select value={styleF} onChange={e => setStyleF(e.target.value)}>
          <option value="all">All styles</option>
          <option value="Offense-minded">Offense-minded</option>
          <option value="Defense-minded">Defense-minded</option>
          <option value="Balanced">Balanced</option>
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
              {sortHead('market', 'name', 'Coach')}
              {sortHead('market', 'age', 'Age', 'right')}
              {sortHead('market', 'style', 'Known for')}
              {sortHead('market', 'rep', 'Rep', 'right')}
              {sortHead('market', 'played', 'Played')}
              {sortHead('market', 'coaching', 'Coaching', 'left', 'Years coaching')}
              {sortHead('market', 'ask', 'Asks', 'right', 'His asking price as an Assistant Coach')}
              <th style={th()} />
            </tr>
          </thead>
          <tbody>
            {pool.slice(0, more).map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                <td style={td()}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CoachFace gm={gm} c={c} age={coachAge(gm, c)} size={30} />
                    <div>
                      <button className="hv4" onClick={() => openC(c.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                        {c.name}
                      </button>
                      {flag(c)}
                      <div style={{ fontSize: '11px', ...muted }}>{nat(c)}</div>
                    </div>
                  </div>
                </td>
                <td style={td('right')}>{coachAge(gm, c)}</td>
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
                        title={coachWording(c, 'God Mode: put him on your staff now (his asking price, the years he wants)')}
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

      <h4 style={{ ...h4Style, marginTop: 22 }}>Head coaches around the league</h4>
      <p style={{ margin: '0 0 8px', fontSize: '13px', ...muted }}>
        Every other team&rsquo;s head coach, with their record as a head coach (everywhere they&rsquo;ve been one). Each owner judges his
        coach against the media&rsquo;s preseason win projection (a win-now owner also wants the playoffs): a coach is fired only after
        missing it two seasons in a row (three on a rebuilding team), and a frugal owner waits for the contract to end rather than pay two
        coaches. Teams hire after the playoffs, and can offer any assistant a head coaching job, yours too. Click a team for its staff.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {sortHead('league', 'team', 'Team')}
              {sortHead('league', 'name', 'Head coach')}
              {sortHead('league', 'age', 'Age', 'right')}
              {sortHead('league', 'rep', 'Rep', 'right')}
              {sortHead('league', 'since', 'Since', 'right', 'The season he took this job')}
              {sortHead('league', 'exp', 'Contract', 'right', 'Last season of his contract')}
              {sortHead('league', 'owner', 'Owner')}
              {sortHead(
                'league',
                'seat',
                'Target',
                'left',
                'Seasons in a row his team has missed the owner’s target (the media’s preseason win projection; a win-now owner also wants the playoffs). Two in a row and he’s fired (three on a rebuilding team).',
              )}
              {sortHead(
                'league',
                'nba',
                'NBA W–L',
                'right',
                'Head coach record in this league (finished seasons); sorted by winning percentage',
              )}
              {sortHead('league', 'other', 'Other levels', 'right', 'Head coach record at other levels; sorted by winning percentage')}
              {sortHead('league', 'titles', 'Titles', 'right')}
              {sortHead('league', 'coy', 'COY', 'right', 'Coach of the Year')}
              {sortHead('league', 'played', 'Played')}
            </tr>
          </thead>
          <tbody>
            {heads.map(({ t, c, sm }: any) => {
              const seat = hotSeat(gm, t.tid),
                proj = projectedWins(gm, t.tid),
                staff = openT === t.tid ? staffOf(gm, t.tid).filter(x => x.role !== 'hc') : [];
              return (
                <Fragment key={t.tid}>
                  <tr style={{ borderTop: '1px solid var(--color-divider)' }}>
                    <td style={td()}>
                      <button
                        onClick={() => setOpenT(openT === t.tid ? null : t.tid)}
                        title={openT === t.tid ? 'Hide this team’s staff' : 'Show this team’s staff'}
                        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}
                      >
                        <span aria-hidden="true" style={{ fontSize: 10, width: 8 }}>
                          {openT === t.tid ? '▾' : '▸'}
                        </span>
                        {vm.ctx.logo(t.tid, 16)}
                        {t.abbr}
                      </button>
                    </td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <CoachFace gm={gm} c={c} age={coachAge(gm, c)} size={26} />
                        <div>
                          <button className="hv4" onClick={() => openC(c.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                            {c.name}
                          </button>
                          {flag(c)}
                          <div
                            style={{ fontSize: '11px', ...muted }}
                            title="How his team plays: his pace and rotation (and his style sets offense or defense first)"
                          >
                            {wayLabel(coachWay(c))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td('right')}>{coachAge(gm, c)}</td>
                    <td style={td('right')}>{c.rep}</td>
                    <td style={td('right')}>{seasonLbl(sinceOf(c, t.tid))}</td>
                    <td style={td('right')}>{c.exp}</td>
                    <td style={td('left', { fontSize: '12px', whiteSpace: 'nowrap' })}>{t.arch || '—'}</td>
                    <td
                      style={td('left', {
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        color: seat >= 2 ? 'var(--gm-bad)' : seat === 1 ? 'var(--color-accent-700)' : undefined,
                      })}
                      title={(c as any).lastMiss ? 'Last season he ' + (c as any).lastMiss + '.' : undefined}
                    >
                      {seat >= 2 ? 'Hot seat (' + seat + ' missed)' : seat === 1 ? 'Missed last season' : 'On target'}
                      {proj != null && <span style={muted}> · proj. {Math.round(proj)} W</span>}
                    </td>
                    <td style={td('right')}>{sm.nbaW + sm.nbaL ? sm.nbaW + '–' + sm.nbaL : '—'}</td>
                    <td style={td('right')}>{sm.hcW - sm.nbaW + sm.hcL - sm.nbaL ? sm.hcW - sm.nbaW + '–' + (sm.hcL - sm.nbaL) : '—'}</td>
                    <td style={td('right')}>{sm.hcRings || ''}</td>
                    <td style={td('right')}>{c.coy?.length || ''}</td>
                    <td style={td('left', { fontSize: '12px' })}>{playLine(c)}</td>
                  </tr>
                  {staff.map(x => (
                    <tr key={'s' + x.id} style={{ background: 'var(--color-neutral-100)' }}>
                      <td style={td('left', { fontSize: '12px', ...muted })}>{ROLE_LABEL[x.role!]}</td>
                      <td style={td()}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <CoachFace gm={gm} c={x} age={coachAge(gm, x)} size={22} />
                          <button className="hv4" onClick={() => openC(x.id)} style={{ all: 'unset', cursor: 'pointer' }}>
                            {x.name}
                          </button>
                          {flag(x)}
                        </div>
                      </td>
                      <td style={td('right')}>{coachAge(gm, x)}</td>
                      <td style={td('right')}>{x.rep}</td>
                      <td />
                      <td style={td('right')}>{x.exp}</td>
                      <td colSpan={7} style={td('left', { fontSize: '12px' })}>
                        {god ? styleOf(x) + ' · ' : ''}
                        {playLine(x)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

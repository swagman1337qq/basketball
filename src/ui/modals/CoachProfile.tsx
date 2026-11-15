// A coach's profile (staff.ts): face, who he is, his playing days, his coaching, his contract and his ratings
// as you read them (God Mode: exact, with his ceiling, and editable). Opened with gm.setState({ coachPid }).
import type { VM } from '../vm';
import { godBtn, muted, NumInput } from '../kit';
import { CoachFace } from '../CoachFace';
import { fmtMoney as money } from '../../engine/capModel';
import {
  coachAge,
  coachOvr,
  coachYears,
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
} from '../../engine/staff';

export function CoachProfile({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    c = gm.db.coaches?.[s.coachPid];
  if (!c) return null;
  const god = !!s.god,
    age = coachAge(gm, c),
    close = () => gm.setState({ coachPid: null }),
    refresh = () => gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  const T = c.tid != null ? s.teams[c.tid] : null;
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
        style={{ width: 'min(620px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}
      >
        <div className="dialog-title" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <CoachFace c={c} age={age} size={84} />
          <div>
            <div>{c.name}</div>
            <div style={{ fontSize: '13px', fontWeight: 400, ...muted }}>
              {c.ret ? 'Retired from coaching (' + c.ret + ')' : T ? ROLE_LABEL[c.role!] + ', ' + T.region + ' ' + T.name : 'Available'}
              {' · '}
              {styleOf(c, readRatings(c, god))}
            </div>
          </div>
        </div>
        <div className="dialog-body" style={{ fontSize: '13px' }}>
          {row('Age', age + (c.fem ? ' · woman' : ''))}
          {row('Nationality', gm.db.C?.[c.nat]?.n || c.nat)}
          {row('Reputation', c.rep + ' / 100')}
          {row('Personality', traits.length ? traits.join(' · ') : 'Nothing stands out')}
          {row('Played', playLine(c))}
          {row('Coaching', (coachYears(gm, c) ? coachYears(gm, c) + ' years · since ' + c.since + ' · ' : 'New · ') + c.bg)}
          {T && !c.ret && row('Contract', money(c.amt) + ' a year through ' + (c.exp - 1) + '–' + String(c.exp).slice(2))}
          <div style={{ margin: '12px 0 4px', fontWeight: 600 }}>
            Coaching ratings{' '}
            <span style={{ fontWeight: 400, fontSize: '12px', ...muted }}>
              {god ? '(God Mode: exact)' : '(your read: ' + readLabel(c).toLowerCase() + ')'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 16px' }}>
            {CR_KEYS.map(k => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={muted}>{CR_LABEL[k]}</span>
                {god ? (
                  <NumInput
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
            <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                Overall <b>{coachOvr(c).toFixed(1)}</b>
              </span>
              <span>
                Ceiling{' '}
                <NumInput
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
        <div className="dialog-actions">
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

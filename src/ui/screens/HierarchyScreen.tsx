// Hierarchy (2026-11-13): who leads a team's locker room and whom the young players follow. Every player's
// standing (lockerRoom.ts `stature`: how good he is, his place among his teammates, years in the league, age),
// his role, his personality, and whether he pulls the young players (25 and under) toward good habits or bad ones.
// Monthly odds in lockerRoom.ts `mentorTick`; pairings on the Development screen.
import { useState } from 'react';
import type { VM } from '../vm';
import { h4Style, Link, muted, td, th } from '../kit';
import { BAD_SPREAD, hierarchy, isMentee, mentorOf } from '../../engine/lockerRoom';
import { LockerRoomChip } from '../LockerRoom';
import { TRAIT } from '../../engine/traits';
import { yosOf } from '../../engine/cba';

const SHOWN = ['pro', 'team', 'alpha', 'padder', 'touches', 'volatile'];
const GOODK = new Set(['pro', 'team']);

export function HierarchyScreen({ vm }: { vm: VM }) {
  const { gm, s, T, open, logo } = vm.ctx,
    P = gm.db.P;
  const [tid, setTid] = useState<number>(s.me);
  const H = hierarchy(gm, s, tid),
    maxSt = Math.max(1, ...H.map(x => x.st)),
    bad = H.find(x => x.influence === 'bad');
  // Who pulls each young player: his mentor (paired or informal) and the biggest bad influence in the room
  const pulls = new Map<number, { good: number[]; bad: number[] }>();
  H.forEach(x => pulls.set(x.id, { good: [], bad: [] }));
  H.filter(x => isMentee(P[x.id])).forEach(x => {
    const m = mentorOf(gm, s, tid, x.id);
    if (m.mentor != null) pulls.get(m.mentor)?.good.push(x.id);
    if (bad && bad.id !== x.id && !P[x.id].pers.pro && BAD_SPREAD.some(k => P[bad.id].pers[k] && !P[x.id].pers[k]))
      pulls.get(bad.id)?.bad.push(x.id);
  });
  const lead = H[0] && H[0].role === 'Team leader' ? H[0] : null;
  const chip = (k: string) => (
    <span
      key={k}
      title={TRAIT[k]?.desc}
      style={{
        fontSize: '11px',
        padding: '0 6px',
        borderRadius: 999,
        border: '1px solid ' + (GOODK.has(k) ? 'var(--gm-good)' : 'var(--gm-bad)'),
        color: GOODK.has(k) ? 'var(--gm-good)' : 'var(--gm-bad)',
        whiteSpace: 'nowrap',
      }}
    >
      {TRAIT[k]?.label || k}
    </span>
  );
  const names = (ids: number[]) =>
    ids.map((id, i) => (
      <span key={id}>
        {i ? ', ' : ''}
        <Link pid={id} onClick={() => open(id)}>
          {P[id].name.split(' ').slice(-1)[0]}
        </Link>
      </span>
    ));
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {logo(tid, 32)}
        <select className="input" value={tid} onChange={e => setTid(+e.target.value)} style={{ width: 'auto', minWidth: 220 }}>
          {T.slice()
            .sort((a: any, b: any) => (a.region + a.name).localeCompare(b.region + b.name))
            .map((t: any) => (
              <option key={t.tid} value={t.tid}>
                {t.region} {t.name}
                {t.tid === s.me ? ' (yours)' : ''}
              </option>
            ))}
        </select>
        <span style={{ fontSize: '13px' }}>
          Locker room: <LockerRoomChip vm={vm} tid={tid} />
        </span>
        <span style={{ fontSize: '13px' }}>
          {lead ? (
            <>
              Team leader:{' '}
              <Link pid={lead.id} onClick={() => open(lead.id)}>
                {P[lead.id].name}
              </Link>{' '}
              <span
                style={{ color: lead.influence === 'bad' ? 'var(--gm-bad)' : lead.influence === 'good' ? 'var(--gm-good)' : undefined }}
              >
                ({lead.influence === 'bad' ? 'a bad example' : lead.influence === 'good' ? 'a good example' : 'neither'})
              </span>
            </>
          ) : (
            <span style={muted}>No clear leader: nobody stands out yet.</span>
          )}
        </span>
      </div>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 10px', maxWidth: 900 }}>
        Standing comes from how good a player is, his place among his teammates, his years in the league and his age: a star veteran
        outweighs a bench veteran, and a young star carries less until he’s been around. Players 25 and under pick up habits from the people
        above them, a little each month and more if they’re impressionable: good ones from Professionals and Team players (a mentor you pair
        on the Development screen works best), bad ones (Egotistic, Selfish, Ball-dominant) from a star who has them. A paired mentor holds
        the bad influence back, and a better locker room helps.
      </p>
      <table className="table" style={{ fontSize: '13px', width: 'auto' }}>
        <thead>
          <tr>
            <th style={th('right')}>#</th>
            <th style={th()}>Player</th>
            <th style={th('right')}>Age</th>
            <th style={th('right')}>Ovr</th>
            <th style={th('right')} title="Years in the league">
              Yrs
            </th>
            <th style={th()}>Standing</th>
            <th style={th()}>Role</th>
            <th style={th()}>Personality</th>
            <th style={th()}>Influence</th>
            {s.god && (
              <th style={th('right')} title="God Mode: how open he is to change (0–100)">
                Malleability
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {H.map((x, i) => {
            const p = P[x.id],
              pl = pulls.get(x.id)!,
              tr = SHOWN.filter(k => p.pers?.[k]);
            return (
              <tr key={x.id}>
                <td style={td('right')}>{i + 1}</td>
                <td style={td('left', { whiteSpace: 'nowrap' })}>
                  <Link pid={x.id} onClick={() => open(x.id)}>
                    {p.name}
                  </Link>
                </td>
                <td style={td('right')}>{p.age}</td>
                <td style={td('right', { color: vm.ctx.tone(p.ovr), fontWeight: 600 })}>{p.ovr}</td>
                <td style={td('right')}>{yosOf(gm, p)}</td>
                <td style={td()}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 70, height: 6, borderRadius: 3, background: 'var(--color-divider)', position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: Math.round((x.st / maxSt) * 100) + '%',
                          borderRadius: 3,
                          background: 'var(--color-accent)',
                        }}
                      />
                    </span>
                    <span style={{ ...muted, fontSize: '11.5px' }}>{x.st.toFixed(1)}</span>
                  </span>
                </td>
                <td
                  style={td('left', {
                    whiteSpace: 'nowrap',
                    fontWeight: x.role === 'Team leader' ? 700 : x.role === 'Voice in the room' ? 600 : 400,
                  })}
                >
                  {x.role}
                </td>
                <td style={td()}>
                  <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                    {tr.length ? tr.map(chip) : <span style={muted}>—</span>}
                  </span>
                </td>
                <td style={td('left', { fontSize: '12px' })}>
                  {x.influence === 'good' ? (
                    <span style={{ color: 'var(--gm-good)' }}>
                      Good influence{pl.good.length ? ' on ' : ''}
                      {names(pl.good)}
                    </span>
                  ) : x.influence === 'bad' ? (
                    <span style={{ color: 'var(--gm-bad)' }}>
                      Bad influence{pl.bad.length && bad?.id === x.id ? ' on ' : ''}
                      {bad?.id === x.id ? names(pl.bad) : ''}
                    </span>
                  ) : (
                    <span style={muted}>—</span>
                  )}
                </td>
                {s.god && <td style={td('right')}>{p.pers?.mal ?? 50}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

// Locker room chip (with what's driving it on hover) and the mentoring pairings.
import type { VM } from './vm';
import { HoverCard } from './HoverCard';
import { h4Style, Link, muted, td, th } from './kit';
import { isLeader, isMentee, lockerRoom, mentorOf, MENTOR_MAX, NEGATIVE, POSITIVE } from '../engine/lockerRoom';
import { TRAIT } from '../engine/traits';

export function LockerRoomChip({ vm, tid }: { vm: VM; tid: number }) {
  const { gm, s } = vm.ctx, r = lockerRoom(gm, s, tid);
  return (
    <HoverCard width={300} anchor={<span style={{ cursor: 'help', borderBottom: '1px dotted currentColor', color: r.color, fontWeight: 600 }}>{r.label} ({r.score})</span>}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Locker room: {r.label} ({r.score}/100)</div>
      {r.factors.map(([k, v], i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}><span style={{ width: 28, textAlign: 'right', color: v > 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{v > 0 ? '+' : ''}{v}</span><span>{k}</span></div>)}
      <div style={{ ...muted, fontSize: '11.5px', marginTop: 6 }}>A good room lifts morale, shooting and young players’ growth. Veterans who are Professionals or Team players are the leaders.</div>
    </HoverCard>
  );
}

export function MentoringSection({ vm, tid }: { vm: VM; tid: number }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, ids: number[] = s.rosters[tid] || [], club = gm.clubOf(s, tid), set = club?.mentors || {};
  const young = ids.filter(id => isMentee(P[id])), vets = ids.filter(id => isLeader(P[id]));
  const load = (m: number) => Object.entries(set).filter(([pid, v]) => v === m && ids.includes(+pid)).length;
  const assign = (pid: number, m: string) => gm.setState(st => { const cur = { ...(gm.clubOf(st, tid)?.mentors || {}) }; if (m === '') delete cur[pid]; else cur[pid] = +m; return gm.clubPatch(st, tid, { mentors: cur }); });
  const tl = (k: string) => TRAIT[k]?.label || k;
  return (
    <section style={{ marginTop: 26 }}>
      <h4 style={h4Style}>Mentoring</h4>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 8px' }}>Pair a young player (25 or under) with a veteran leader (29+, a Professional or Team player). Personalities rarely change: over time he may shed a bad habit or pick up the veteran’s good ones, if he’s open to it. Pairings work far better than informal leadership, and a better locker room helps. The room itself rubs off too: a bad one breeds egos, a great one team players. Each veteran can mentor {MENTOR_MAX} players. Locker room: <LockerRoomChip vm={vm} tid={tid} /></p>
      {!vets.length && <p style={{ fontSize: '13px', fontStyle: 'italic' }}>You have no veteran leaders. Sign or trade for a veteran Professional or Team player.</p>}
      {young.length > 0 && (
        <table className="table" style={{ fontSize: '13px' }}>
          <thead><tr><th style={th()}>Young player</th><th style={th('right')}>Age</th><th style={th()}>Habits to break</th><th style={th()}>Mentor</th><th style={th()}>Working on</th></tr></thead>
          <tbody>{young.map(id => {
            const p = P[id], bad = NEGATIVE.filter(k => p.pers[k]), mo = mentorOf(gm, s, tid, id), M = mo.mentor != null ? P[mo.mentor] : null;
            const gain = M ? POSITIVE.filter(k => M.pers[k] && !p.pers[k] && !(k === 'team' && (p.pers.alpha || p.pers.padder))) : [];
            const work = !M ? 'Nobody to learn from' : [bad.length ? 'Breaking: ' + bad.map(tl).join(', ') : '', gain.length ? 'Learning: ' + gain.map(tl).join(', ') : ''].filter(Boolean).join(' · ') || 'Nothing to fix: good habits already';
            return (
              <tr key={id}>
                <td style={td()}><Link onClick={() => open(id)}>{p.name}</Link></td>
                <td style={td('right')}>{p.age}</td>
                <td style={td()}>{bad.length ? bad.map(tl).join(', ') : <span style={muted}>None</span>}</td>
                <td style={td()}>
                  <select className="input" value={set[id] != null && ids.includes(set[id]) ? String(set[id]) : ''} onChange={e => assign(id, e.target.value)} style={{ width: 'auto', minHeight: 28, fontSize: '12.5px', padding: '2px 6px' }}>
                    <option value="">{M && !mo.paired ? 'Informal: ' + M.name : 'No mentor'}</option>
                    {vets.filter(v => v !== id).map(v => <option key={v} value={v} disabled={set[id] !== v && load(v) >= MENTOR_MAX}>{P[v].name} ({P[v].age}, {POSITIVE.filter(k => P[v].pers[k]).map(tl).join(' & ')}){set[id] !== v && load(v) >= MENTOR_MAX ? ' · full' : ''}</option>)}
                  </select>
                </td>
                <td style={td(undefined, { fontSize: '12.5px' })}>{work}</td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </section>
  );
}

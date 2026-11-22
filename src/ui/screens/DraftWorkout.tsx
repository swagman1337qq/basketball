// The combine and pre-draft workouts on screen (workouts.ts): a prospect's measurements, your workout invite and
// its report. Used in the draft board's prospect card and on the player profile.
import { useState } from 'react';
import type { VM } from '../vm';
import { godBtn, muted } from '../kit';
import { combineOf, doWorkout, ftIn, WO_MAX, woAnswer, woOpen, woReport, woUsed, worked } from '../../engine/workouts';

const cell = (k: string, v: string, title?: string) => (
  <div key={k} title={title} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
    <span style={muted}>{k}</span>
    <b style={{ fontWeight: 600 }}>{v}</b>
  </div>
);
export function CombineGrid({ p }: { p: any }) {
  const c = combineOf(p);
  if (!c)
    return <div style={{ ...muted, fontSize: '12.5px' }}>{p?.cmb === 0 ? 'Skipped the combine.' : 'Not invited to the combine.'}</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '3px 18px', fontSize: '12.5px' }}>
      {cell('Height (no shoes)', ftIn(c.bare))}
      {cell('Height (shoes)', ftIn(c.shoes))}
      {cell('Wingspan', ftIn(c.wing), (c.wing - c.bare >= 0 ? '+' : '') + (c.wing - c.bare).toFixed(2) + '″ over his height')}
      {cell('Standing reach', ftIn(c.reach))}
      {cell('Weight', c.wt + ' lb')}
      {cell('Max vertical', c.maxV.toFixed(1) + '″')}
      {cell('Standing vertical', c.stdV.toFixed(1) + '″')}
      {cell('Lane agility', c.lane.toFixed(2) + ' s', 'Lower is quicker (the league’s prospects average about 11.2 s)')}
      {cell('¾-court sprint', c.sprint.toFixed(2) + ' s', 'Lower is faster (about 3.30 s on average)')}
      {cell('Bench (185 lb)', c.bench + ' reps')}
    </div>
  );
}
// Your workout: the invite (from the lottery until the first pick), or the report once he's been in.
export function WorkoutBlock({ vm, p }: { vm: VM; p: any }) {
  const { gm, s } = vm.ctx,
    [msg, setMsg] = useState('');
  if (!p) return null;
  const Y = gm.Y,
    done = worked(s, Y, s.me, p.id);
  if (done) {
    const r = woReport(p);
    return (
      <div style={{ fontSize: '12.5px', display: 'grid', gap: 3 }}>
        <div>
          <b>Worked out for you.</b> <span style={muted}>Your read of his ceiling is twice as sharp.</span>
        </div>
        <div>
          <span style={muted}>Shooting drills: </span>
          {r.drills.map(([k, m, a]) => k + ' ' + m + '/' + a).join(' · ')}
        </div>
        <div style={{ color: r.flagged ? 'var(--gm-bad)' : undefined }}>
          <span style={muted}>Medical: </span>
          {r.medical}
        </div>
        <div>
          <span style={muted}>Interview: </span>
          {r.interview}
        </div>
      </div>
    );
  }
  if (p.cls !== Y || !woOpen(s) || s.spectator) return null;
  const used = woUsed(s, Y, s.me),
    ans = woAnswer(gm, s, s.me, p),
    god = !!s.god;
  const go = (force: boolean) => {
    const e = doWorkout(gm, s, s.me, p.id, force);
    setMsg(e);
    gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: '12.5px' }}>
      <button className="btn btn-secondary" disabled={used >= WO_MAX || !ans.ok} onClick={() => go(false)}>
        Bring him in for a workout
      </button>
      {god && (!ans.ok || used >= WO_MAX) && (
        <button className="btn btn-secondary" style={godBtn} onClick={() => go(true)}>
          Work him out anyway
        </button>
      )}
      <span style={muted}>
        {used} of {WO_MAX} workouts used{!ans.ok ? ' · ' + ans.why : ''}
      </span>
      {msg && <span style={{ color: 'var(--color-accent-800)' }}>{msg}</span>}
    </div>
  );
}

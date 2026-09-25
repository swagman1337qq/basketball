// Tactics & rotation hub: tactical identity (options unlock with the roles on your
// roster), situational presets for late-game leads and deficits, a drag-and-drop
// rotation with minute targets, and a preview of what each training focus does.
import { useState } from 'react';
import type { VM } from '../vm';
import { Game } from '../../engine/Game';
import { Kicker, muted, ruleH4 } from '../kit';

const TAC: [string, string, string[], string][] = [
  ['pace', 'Pace', ['Slow', 'Balanced', 'Fast'], 'Faster pace means more possessions and rewards speed and endurance.'],
  ['off', 'Offense', ['Inside', 'Balanced', 'Perimeter', 'Pace and space'], 'Shifts your shot mix between the rim, mid-range and threes.'],
  ['def', 'Defense', ['Drop', 'Switch', 'Aggressive'], 'Aggressive forces turnovers but fouls more; Switch takes away threes; Drop protects the rim.'],
  ['clutch', 'Clutch play', ['Motion', 'Isolate the star'], 'In the last 5 minutes of a close game, who takes the shots.'],
];
const PRESETS: Record<string, any> = {
  None: null,
  'Milk the clock': { pace: 'Slow', off: 'Inside' },
  'Protect the paint': { pace: 'Slow', def: 'Drop' },
  'Press and push': { pace: 'Fast', def: 'Aggressive' },
  'Bombs away': { pace: 'Fast', off: 'Pace and space' },
  'Feed the star': { clutch: 'Isolate the star', off: 'Balanced' },
};
const nameOf = (x: any) => Object.keys(PRESETS).find(k => JSON.stringify(PRESETS[k]) === JSON.stringify(x || null)) || 'Custom';
const LB: Record<string, string> = { hgt: 'Hgt', stre: 'Str', spd: 'Spd', jmp: 'Jmp', endu: 'End', ins: 'Ins', dnk: 'Dnk', ft: 'FT', fg: 'Mid', tp: '3PT', oiq: 'OIQ', diq: 'DIQ', drb: 'Drb', pss: 'Pss', reb: 'Reb' };

export function TacticsScreen({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, ids: number[] = s.rosters[s.me];
  const unl = gm.tacticUnlocks(ids), tac = s.tactics;
  const [drag, setDrag] = useState<number | null>(null), [over, setOver] = useState<number | null>(null);
  const [tp, setTp] = useState<number | null>(null);
  const trainee = P[tp != null && ids.includes(tp) ? tp : ids.slice().sort((a, b) => P[a].age - P[b].age)[0]];
  const move = (from: number, to: number) => { if (from === to) return; gm.setState(st => { const r = st.rosters[st.me].slice(), i = r.indexOf(from), j = r.indexOf(to); r.splice(i, 1); r.splice(j, 0, from); return { rosters: { ...st.rosters, [st.me]: r } }; }); };
  const healthy = ids.filter(id => !P[id].inj && !P[id].dev), rotOf = id => Math.round(P[id].rot ?? Game.ROTATION[healthy.indexOf(id)] ?? 0);
  const total = ids.reduce((a, id) => a + (P[id].inj || P[id].dev ? 0 : rotOf(id)), 0);
  const fit = gm.tacFit(ids, tac);
  const setSitu = (k: 'lead' | 'trail', name: string) => gm.setState(st => ({ situ: { ...(st.situ || {}), [k]: PRESETS[name] } }));
  const focus = (s.train || {})[trainee?.id] || 'Balanced';
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.05fr)', gap: '36px', alignItems: 'start' }}>
        <section>
          <h4 style={ruleH4}>Tactical identity</h4>
          {TAC.map(([k, label, opts, desc]) => (
            <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ width: '90px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600 }}>{label}</span>
                <div style={{ display: 'inline-flex', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {opts.map(o => { const u = unl[o], locked = u && !u[0] && !s.god, on = tac[k] === o; return (
                    <button key={o} disabled={locked && !on} title={u ? (u[0] ? 'Unlocked by ' + u[1] : 'Needs ' + u[1]) : ''} onClick={() => gm.setState(st => ({ tactics: { ...st.tactics, [k]: o } }))} style={{ all: 'unset', cursor: locked ? 'not-allowed' : 'pointer', padding: '5px 12px', fontSize: '13px', whiteSpace: 'nowrap', opacity: locked && !on ? 0.4 : 1, color: on ? 'var(--color-accent-700)' : 'var(--color-text)', boxShadow: on ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}>{locked ? '🔒 ' : ''}{o}</button>
                  ); })}
                </div>
              </div>
              <div style={{ fontSize: '12px', ...muted, marginTop: '4px' }}>{desc}</div>
              {opts.filter(o => unl[o]).map(o => <div key={o} style={{ fontSize: '11.5px', color: unl[o][0] ? 'var(--gm-good)' : 'var(--color-neutral-600)' }}>{o}: {unl[o][0] ? 'unlocked by ' : 'needs '}{unl[o][1]}{!unl[o][0] && tac[k] === o ? ' (running it anyway costs fit)' : ''}</div>)}
            </div>
          ))}
          <p style={{ margin: '12px 0 0', fontWeight: 600, color: fit >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{(fit >= 0 ? '+' : '−') + Math.abs(fit).toFixed(1)} roster fit: how well these settings suit your players</p>

          <h4 style={{ ...ruleH4, marginTop: '24px' }}>Situational presets</h4>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>Take over automatically in the last 5 minutes of the 4th quarter and overtime.</p>
          {([['lead', 'Leading by 6+'], ['trail', 'Trailing by 6+']] as const).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ width: '120px' }}>{label}</span>
              <select className="input" value={nameOf(s.situ?.[k])} onChange={e => setSitu(k, e.target.value)} style={{ flex: 1 }}>
                {Object.keys(PRESETS).map(n => <option key={n} value={n}>{n}</option>)}
                {nameOf(s.situ?.[k]) === 'Custom' && <option value="Custom">Custom</option>}
              </select>
              <span style={{ fontSize: '11.5px', ...muted, width: '150px' }}>{s.situ?.[k] ? Object.values(s.situ[k]).join(' · ') : 'Base tactics'}</span>
            </div>
          ))}

          <h4 style={{ ...ruleH4, marginTop: '24px' }}>Training focus preview</h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <select className="input" value={trainee?.id} onChange={e => setTp(+e.target.value)} style={{ flex: 1 }}>{ids.map(id => <option key={id} value={id}>{P[id].name} · {P[id].age} · {P[id].ovr}</option>)}</select>
            <select className="input" value={focus} onChange={e => { const v = e.target.value; gm.setState(st => ({ train: { ...st.train, [trainee.id]: v } })); }}>{Object.keys(Game.FOCUS).map(f => <option key={f}>{f}</option>)}</select>
          </div>
          {trainee && (() => { const pv = gm.growthPreview(s, s.me, trainee, focus) as { monthly: number; per: Record<string, number> }, mx = Math.max(0.05, ...Object.values(pv.per).map(v => Math.abs(v))); return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15,minmax(0,1fr))', gap: '3px', alignItems: 'end', height: '90px', borderBottom: '1px solid var(--color-divider)' }}>
                {Object.entries(pv.per).map(([k, v]) => <div key={k} title={LB[k] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(2) + ' per month'} style={{ height: Math.max(2, (Math.abs(v) / mx) * 86) + 'px', background: v >= 0 ? (Game.FOCUS[focus].includes(k) ? 'var(--gm-elite)' : 'var(--gm-good)') : 'var(--gm-bad)', opacity: 0.85 }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15,minmax(0,1fr))', gap: '3px', fontSize: '9.5px', textAlign: 'center', ...muted }}>{Object.keys(pv.per).map(k => <span key={k}>{LB[k]}</span>)}</div>
              <p style={{ fontSize: '12px', ...muted, margin: '6px 0 0' }}>Expected {pv.monthly >= 0 ? '+' : ''}{pv.monthly.toFixed(2)} overall per month before the random swing (±40%). Focus attributes grow 2.2× and the rest 0.45×; the Coaching budget, minutes, the dev league and injuries scale it.</p>
            </>
          ); })()}
        </section>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--color-text)', paddingBottom: '4px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '18px' }}>Rotation</h4>
            <span style={{ color: Math.abs(total - 240) > 6 ? 'var(--gm-bad)' : undefined }}>{total} of 240 minutes</span>
          </div>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>Drag players to reorder: the top five start. Minute targets drive stats, development and happiness.</p>
          {ids.map((id, i) => { const p = P[id], dis = !!(p.inj || p.dev); return (
            <div key={id} draggable onDragStart={() => setDrag(id)} onDragOver={e => { e.preventDefault(); setOver(id); }} onDragLeave={() => setOver(null)} onDrop={e => { e.preventDefault(); if (drag != null) move(drag, id); setDrag(null); setOver(null); }} onDragEnd={() => { setDrag(null); setOver(null); }}
              style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) 64px minmax(0,1fr) 44px', gap: '10px', alignItems: 'center', padding: '4px 0', borderBottom: i === 4 ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)', borderTop: over === id && drag !== id ? '2px solid var(--color-accent)' : '2px solid transparent', opacity: drag === id ? 0.5 : 1, cursor: 'grab' }}>
              <span style={{ ...muted, fontSize: '12px' }} aria-hidden>⋮⋮</span>
              <span><button className="hv4" onClick={() => open(id)} style={{ all: 'unset', cursor: 'pointer' }}>{p.name}</button> <span style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>{p.pos} · {p.ovr}</span></span>
              <span style={{ fontSize: '11px', color: p.inj ? 'var(--gm-bad)' : 'var(--color-accent-700)' }}>{p.inj ? (p.inj.dtd ? 'Day-to-day' : 'Injured') : p.dev ? 'Dev league' : i < 5 ? 'Starter' : ''}</span>
              <input type="range" min={0} max={42} step={1} value={rotOf(id)} disabled={dis} onChange={e => { p.rot = +e.target.value; gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              <span style={{ textAlign: 'right' }}>{rotOf(id)}′</span>
            </div>
          ); })}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => { ids.forEach(id => delete P[id].rot); gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }}>Reset to default minutes</button>
            <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => gm.setState(st => ({ rosters: { ...st.rosters, [st.me]: st.rosters[st.me].slice().sort((a, b) => P[b].ovr - P[a].ovr) } }))}>Sort by rating</button>
          </div>
          <Kicker>&nbsp;</Kicker>
        </section>
      </div>
    </>
  );
}

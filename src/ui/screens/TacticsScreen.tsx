// Tactics & rotation hub: tactical identity (options unlock with the roles on your
// roster), situational presets for late-game leads and deficits, a drag-and-drop
// rotation with minute targets, and a preview of what each training focus does.
import { useState } from 'react';
import type { VM } from '../vm';
import { Game } from '../../engine/Game';
import { Kicker, muted, NumInput, ruleH4 } from '../kit';
import { BadgeChip } from '../BadgeChip';
import { HoverCard } from '../HoverCard';
import { badgesOf } from '../../engine/ratings';
import { bestTacticsFor, optLabel, PLAYBOOKS, repAffinity, TAC_DEFAULT, TACTIC_GROUPS, tacticFitParts, tacticReps, type Tactics } from '../../engine/tactics';

const PRESETS: Record<string, any> = {
  None: null,
  'Milk the clock': { pace: 'Slow', off: 'Post-up', reb: 'Get back' },
  'Protect the paint': { pace: 'Slow', def: 'Drop' },
  'Press and push': { pace: 'Fast', def: 'Aggressive', press: 'Full-court man' },
  'Bombs away': { pace: 'Seven seconds or less', off: 'Moreyball' },
  'Feed the star': { clutch: 'Isolate the star', off: 'Isolation' },
  'Zone change-up': { def: '2-3 zone' },
  'Hack-a-Shaq': { foul: 'Hack-a-Shaq' },
};
const nameOf = (x: any) => Object.keys(PRESETS).find(k => JSON.stringify(PRESETS[k]) === JSON.stringify(x || null)) || 'Custom';
const LB: Record<string, string> = { hgt: 'Hgt', stre: 'Str', spd: 'Spd', acc: 'Acc', jmp: 'Jmp', endu: 'End', ins: 'Ins', dnk: 'Dnk', lay: 'Lay', ft: 'FT', fg: 'Mid', tp: '3PT', oiq: 'OIQ', diq: 'DIQ', blk: 'Blk', stl: 'Stl', drb: 'Drb', pss: 'Pss', reb: 'Reb', box: 'Box' };

export function TacticsScreen({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, ids: number[] = s.rosters[s.me];
  const unl = gm.tacticUnlocks(ids), tac = s.tactics;
  const [drag, setDrag] = useState<number | null>(null), [over, setOver] = useState<number | null>(null);
  const [tp, setTp] = useState<number | null>(null);
  const trainee = P[tp != null && ids.includes(tp) ? tp : ids.slice().sort((a, b) => P[a].age - P[b].age)[0]];
  const move = (from: number, to: number) => { if (from === to) return; gm.setState(st => { const r = st.rosters[st.me].slice(), i = r.indexOf(from), j = r.indexOf(to); r.splice(i, 1); r.splice(j, 0, from); return { rosters: { ...st.rosters, [st.me]: r } }; }); };
  const healthy = ids.filter(id => !P[id].inj && !P[id].dev), rotOf = id => Math.round(P[id].rot ?? Game.ROTATION[healthy.indexOf(id)] ?? 0);
  const total = ids.reduce((a, id) => a + (P[id].inj || P[id].dev ? 0 : rotOf(id)), 0);
  const fit = gm.tacFit(ids, tac), top8 = ids.slice(0, 8).map(id => P[id]).filter(Boolean), parts = tacticFitParts(top8, tac);
  const setTac = (t: Tactics) => gm.setState({ tactics: { ...t } });
  const sameAs = (t: Tactics) => Object.entries(t).every(([k, v]) => (tac as any)[k] === v);
  const setSitu = (k: 'lead' | 'trail', name: string) => gm.setState(st => ({ situ: { ...(st.situ || {}), [k]: PRESETS[name] } }));
  const focus = (s.train || {})[trainee?.id] || 'Balanced';
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.05fr)', gap: '36px', alignItems: 'start' }}>
        <section>
          <h4 style={ruleH4}>Playbooks</h4>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>One click sets a famous team's style; change anything after. Or let your staff pick what suits your roster.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => setTac(bestTacticsFor(top8, tac))} title="The staff picks the option in each setting that best fits your top eight players">Let the staff choose</button>
            {PLAYBOOKS.map(b => <button key={b.name} className="btn btn-secondary" style={{ fontSize: '12px', boxShadow: sameAs(b.t) ? 'inset 0 0 0 1px var(--color-accent)' : undefined }} onClick={() => setTac({ ...tac, ...b.t })} title={b.era + ': ' + Object.values(b.t).join(' · ')}>{b.name} <span style={{ ...muted, fontSize: '11px' }}>{b.era}</span></button>)}
          </div>

          <h4 style={{ ...ruleH4, marginTop: '18px' }}>Tactical identity</h4>
          {TACTIC_GROUPS.map(gr => { const cur = (tac as any)[gr.k] ?? (TAC_DEFAULT as any)[gr.k], o = gr.opts.find(x => x.v === cur) || gr.opts[0], f = parts[gr.k], u = unl[cur], hows = [...new Set(gr.opts.map(x => x.how).filter(Boolean))] as string[];
            const reps = Object.entries(tacticReps({ [gr.k]: cur } as Tactics)).sort((a, b) => b[1] - a[1]);
            return (
            <div key={gr.k} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ width: '120px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600 }} title={gr.desc}>{gr.label}</span>
                <select className="input" value={cur} onChange={e => setTac({ ...tac, [gr.k]: e.target.value })} style={{ flex: 1, minWidth: 180, maxWidth: 280 }}>
                  {hows.length ? hows.map(h => <optgroup key={h} label={h}>{gr.opts.filter(x => x.how === h).map(x => <option key={x.v} value={x.v}>{x.label || x.v}</option>)}</optgroup>) : gr.opts.map(x => <option key={x.v} value={x.v}>{x.label || x.v}</option>)}
                </select>
                {f != null && Math.abs(f) >= 0.05 && <span style={{ fontSize: '12px', fontWeight: 600, color: f >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }} title="How well this suits your top eight players">{f >= 0 ? 'Suits your roster' : 'Poor fit'} ({(f >= 0 ? '+' : '−') + Math.abs(f).toFixed(1)})</span>}
              </div>
              <div style={{ fontSize: '12.5px', marginTop: '5px' }}>{o.desc}</div>
              {u && <div style={{ fontSize: '11.5px', marginTop: '3px', color: u[0] && !(f != null && f < -0.05) ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{u[0] ? (f != null && f < -0.05 ? 'You have ' + u[1] + ', but the rest of your top eight doesn\u2019t suit it.' : 'You have what it needs: ' + u[1] + '.') : 'Works best with ' + u[1] + ', which you don\u2019t have: expect it to cost you games.'}</div>}
              {reps.length > 0 && <div style={{ fontSize: '11.5px', ...muted, marginTop: '3px' }}>Practice reps: {reps.map(([k, v]) => { const who = top8.filter(p => repAffinity(p, k) >= 0.6).length; return LB[k] + ' +' + Math.round(v * 100) + '%' + (who < 3 ? ' (few players have the feel for it)' : ''); }).join(' · ')}</div>}
            </div>
          ); })}
          <p style={{ margin: '12px 0 0', fontWeight: 600, color: fit >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{(fit >= 0 ? '+' : '−') + Math.abs(fit).toFixed(1)} roster fit: how well these settings suit your players</p>
          <p style={{ ...muted, fontSize: '12px', margin: '4px 0 0' }}>Nothing is locked: run anything you like. A poor fit loses games, but your players still get the reps: young players who play in a system grow a little faster in the skills it uses, as far as their natural feel for them allows.</p>

          <details style={{ marginTop: '18px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600 }}>📖 Tactics guide: what every option means</summary>
            <p style={{ ...muted, fontSize: '12px', margin: '6px 0 10px' }}>Basketball terms in plain words. "Works best with" is what a roster needs to make it pay off; "Practice reps" is what players who play in it get better at.</p>
            {TACTIC_GROUPS.map(gr => (
              <div key={gr.k} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', borderBottom: '1px solid var(--color-divider)', paddingBottom: 2 }}>{gr.label} <span style={{ ...muted, fontWeight: 400, fontSize: '12px' }}>{gr.desc}</span></div>
                {gr.opts.map(o => { const u = unl[o.v], rp = Object.entries(tacticReps({ [gr.k]: o.v } as Tactics)); return (
                  <div key={o.v} style={{ padding: '5px 0 5px 10px', fontSize: '12.5px', borderBottom: '1px dashed color-mix(in srgb, var(--color-divider) 60%, transparent)' }}>
                    <b>{o.label || o.v}</b>{o.how ? <span style={{ ...muted, fontSize: '11px' }}> · {o.how}</span> : null}: {o.desc}
                    {(u || rp.length > 0) && <div style={{ ...muted, fontSize: '11.5px', marginTop: 2 }}>{u ? 'Works best with ' + u[1] + '. ' : ''}{rp.length ? 'Practice reps: ' + rp.map(([k, v]) => LB[k] + ' +' + Math.round(v * 100) + '%').join(', ') + '.' : ''}</div>}
                  </div>
                ); })}
              </div>
            ))}
            <div style={{ fontWeight: 700, fontSize: '14px', borderBottom: '1px solid var(--color-divider)', paddingBottom: 2 }}>Playbooks</div>
            {PLAYBOOKS.map(b => <div key={b.name} style={{ padding: '4px 0 4px 10px', fontSize: '12.5px' }}><b>{b.name}</b> <span style={{ ...muted }}>({b.era})</span>: {Object.entries(b.t).map(([k, v]) => optLabel(k as keyof Tactics, v as string)).join(' · ')}</div>)}
          </details>

          <h4 style={{ ...ruleH4, marginTop: '24px' }}>Situational presets</h4>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>Take over automatically in the last 5 minutes of the 4th quarter and overtime.</p>
          {([['lead', 'Leading by 6+'], ['trail', 'Trailing by 6+']] as const).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ width: '120px' }}>{label}</span>
              <select className="input" value={nameOf(s.situ?.[k])} onChange={e => setSitu(k, e.target.value)} style={{ flex: 1 }}>
                {Object.keys(PRESETS).map(n => <option key={n} value={n}>{n}</option>)}
                {nameOf(s.situ?.[k]) === 'Custom' && <option value="Custom">Custom</option>}
              </select>
              <span style={{ fontSize: '11.5px', ...muted, width: '150px' }}>{s.situ?.[k] ? Object.values(s.situ[k]).join(' · ') : 'Your normal tactics'}</span>
            </div>
          ))}

          <h4 style={{ ...ruleH4, marginTop: '24px' }}>Training focus preview</h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <select className="input" value={trainee?.id} onChange={e => setTp(+e.target.value)} style={{ flex: 1 }}>{ids.map(id => <option key={id} value={id}>{P[id].name} · {P[id].age} · {P[id].ovr}</option>)}</select>
            <select className="input" value={focus} onChange={e => { const v = e.target.value; gm.setState(st => ({ train: { ...st.train, [trainee.id]: v } })); }}>{Object.keys(Game.FOCUS).map(f => <option key={f}>{f}</option>)}</select>
          </div>
          {trainee && (() => { const pv = gm.growthPreview(s, s.me, trainee, focus) as { monthly: number; per: Record<string, number> }, mx = Math.max(0.05, ...Object.values(pv.per).map(v => Math.abs(v))); return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Object.keys(pv.per).length + ',minmax(0,1fr))', gap: '3px', alignItems: 'end', height: '90px', borderBottom: '1px solid var(--color-divider)' }}>
                {Object.entries(pv.per).map(([k, v]) => <div key={k} title={LB[k] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(2) + ' per month'} style={{ height: Math.max(2, (Math.abs(v) / mx) * 86) + 'px', background: v >= 0 ? (Game.FOCUS[focus].includes(k) ? 'var(--gm-elite)' : 'var(--gm-good)') : 'var(--gm-bad)', opacity: 0.85 }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Object.keys(pv.per).length + ',minmax(0,1fr))', gap: '3px', fontSize: '9.5px', textAlign: 'center', ...muted }}>{Object.keys(pv.per).map(k => <span key={k}>{LB[k]}</span>)}</div>
              <p style={{ fontSize: '12px', ...muted, margin: '6px 0 0' }}>Expected {pv.monthly >= 0 ? '+' : ''}{pv.monthly.toFixed(2)} overall per month before the random swing (±40%). The focus decides where growth goes, not how much: his focus skills take a much bigger share and the rest stall. His own development profile shapes it too, and his body (speed, strength, stamina) follows its own schedule; Athleticism and Conditioning only help while he’s still filling out. How much he grows comes from his environment (coaching, facilities, minutes, the locker room, a mentor: capped at ±25%, see his Development tab), his work ethic and injuries; his role in games leans it too.</p>
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
              style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) 72px 118px', gap: '10px', alignItems: 'center', padding: '4px 0', borderBottom: i === 4 ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)', borderTop: over === id && drag !== id ? '2px solid var(--color-accent)' : '2px solid transparent', opacity: drag === id ? 0.5 : 1, cursor: 'grab' }}>
              <span style={{ ...muted, fontSize: '12px' }} aria-hidden>⋮⋮</span>
              <span style={{ minWidth: 0 }}><button className="hv4" onClick={() => open(id)} style={{ all: 'unset', cursor: 'pointer' }}>{p.name}</button> <span style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>{p.pos} · {p.ovr}</span>
                {(() => { const bs = badgesOf(p); return bs.length > 0 && <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>{bs.slice(0, 4).map(b => <BadgeChip key={b.key} b={b} small />)}{bs.length > 4 && <HoverCard width={260} anchor={<span style={{ fontSize: '10.5px', color: 'var(--color-neutral-600)', cursor: 'help' }}>+{bs.length - 4}</span>}><span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{bs.slice(4).map(b => <BadgeChip key={b.key} b={b} small />)}</span></HoverCard>}</span>; })()}
              </span>
              <span style={{ fontSize: '11px', color: p.inj ? 'var(--gm-bad)' : 'var(--color-accent-700)' }}>{p.inj ? (p.inj.dtd ? 'Day-to-day' : 'Injured') : p.dev ? 'CCP' : i < 5 ? 'Starter' : ''}</span>
              <span style={{ justifySelf: 'end' }}><NumInput value={rotOf(id)} min={0} max={48} step={1} width={64} disabled={dis} onValue={v => { p.rot = v; gm.setState(st => ({ gv: (st.gv || 0) + 1 })); }} suffix="min" /></span>
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

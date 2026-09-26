// God Mode team & league editor: identity (names, colors, crest or uploaded logo,
// arena), finances (cap, tax and owner-budget adjustments, owner and GM), and roster
// moves (sign free agents, release, force trades with no salary matching).
// Team IDs, engine formulas and past-season stats stay locked.
import { useState } from 'react';
import type { VM } from '../vm';
import { OWNER_ARCHETYPES } from '../../data/world';
import { processImage } from '../upload';
import { Link, muted, NumInput, ruleH4 } from '../kit';

const GLYPHS = ['Anchor', 'Anvil', 'Award', 'Axe', 'Bird', 'Castle', 'Circle', 'CloudRainWind', 'Cog', 'Compass', 'Crown', 'Feather', 'Fish', 'Flame', 'Gem', 'Guitar', 'Hammer', 'Moon', 'Mountain', 'MountainSnow', 'Origami', 'Rainbow', 'Ship', 'Spade', 'Sparkles', 'Star', 'Sun', 'Sunset', 'TreeDeciduous', 'TreePalm', 'TreePine', 'Waves', 'Wind'];

export function LeagueEditorScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, money } = vm.ctx, P = gm.db.P;
  const [tid, setTid] = useState<number>(s.me), [other, setOther] = useState<number>(T.find(t => t.tid !== s.me)?.tid ?? 0);
  const [pa, setPa] = useState<number | ''>(''), [pb, setPb] = useState<number | ''>(''), [err, setErr] = useState(''), [msg, setMsg] = useState('');
  if (!s.god) return <p style={{ ...muted, fontStyle: 'italic' }}>Turn on God Mode in Settings to edit teams and the league.</p>;
  const t = T[tid];
  const setT = (f: Record<string, any>) => gm.setState(st => { Object.assign(gm.db.teams[tid] || {}, f); return { teams: st.teams.map(x => (x.tid === tid ? { ...x, ...f } : x)) }; });
  const log = (text: string) => gm.setState(st => ({ lgLog: [{ day: st.day, type: 'Trade', teams: 'God Mode', text }, ...st.lgLog] }));
  const release = (id: number) => { gm.setState(st => ({ rosters: { ...st.rosters, [tid]: st.rosters[tid].filter(x => x !== id) }, fa: [id, ...st.fa] })); log('God Mode: ' + P[id].name + ' released by ' + t.abbr); };
  const sign = (id: number) => { gm.setState(st => ({ fa: st.fa.filter(x => x !== id), rosters: { ...st.rosters, [tid]: [...st.rosters[tid], id] } })); P[id].amt = P[id].ask; log('God Mode: ' + t.abbr + ' signed ' + P[id].name); };
  const trade = () => { if (pa === '' || pb === '') return; const a = pa as number, b = pb as number; gm.setState(st => ({ rosters: { ...st.rosters, [tid]: st.rosters[tid].map(x => (x === a ? b : x)), [other]: st.rosters[other].map(x => (x === b ? a : x)) } })); log('God Mode: forced trade, ' + P[a].name + ' (' + t.abbr + ') for ' + P[b].name + ' (' + T[other].abbr + ')'); setPa(''); setPb(''); setMsg('Trade done. Salary matching was skipped.'); };
  const upload = async (f?: File) => { if (!f) return; setErr(''); try { setT({ logoImg: await processImage(f, 256, 256, 'image/png') }); } catch (e: any) { setErr(e.message); } };
  const setAbbr = (v: string) => { const a = v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); if (a.length >= 2 && !T.some(x => x.tid !== tid && x.abbr === a)) setT({ abbr: a }); };
  const grid = { display: 'grid', gridTemplateColumns: '130px minmax(0,1fr)', gap: '8px 12px', alignItems: 'center' } as const;
  const adj = (label: string, k: string, mn: number, mx: number, help: string) => (
    <>
      <span style={muted}>{label}</span>
      <span><span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><NumInput value={t[k] || 0} min={mn} max={mx} step={0.5} width={84} onValue={v => setT({ [k]: v })} suffix="$M" /></span><span style={{ ...muted, fontSize: '11px' }}>{help}</span></span>
    </>
  );
  const pay = gm.payrollOf(s.rosters[tid]) + (t.capAdj || 0);
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        {logo(tid, 36)}
        <select className="input" value={tid} onChange={e => { setTid(+e.target.value); setPa(''); setPb(''); setMsg(''); }} style={{ minWidth: '240px' }}>{T.map(x => <option key={x.tid} value={x.tid}>{x.region} {x.name}{gm.isUser(s, x.tid) ? ' (yours)' : ''}</option>)}</select>
        <span style={{ ...muted, fontSize: '12px' }}>Team ID #{tid} is permanent. Past seasons’ standings and stats are read-only.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '30px', alignItems: 'start' }}>
        <section>
          <h4 style={ruleH4}>Identity</h4>
          <div style={grid}>
            <span style={muted}>City</span><input className="input" value={t.region} onChange={e => setT({ region: e.target.value })} />
            <span style={muted}>Nickname</span><input className="input" value={t.name} onChange={e => setT({ name: e.target.value })} />
            <span style={muted}>Abbreviation</span><input className="input" defaultValue={t.abbr} key={'ab' + tid} onBlur={e => setAbbr(e.target.value)} />
            <span style={muted}>Colors</span>
            <span style={{ display: 'flex', gap: '8px' }}>{[0, 1].map(i => <input key={i} type="color" value={(t.colors || ['#444444', '#eeeeee'])[i]} onChange={e => { const c = [...(t.colors || ['#444444', '#eeeeee'])]; c[i] = e.target.value; setT({ colors: c }); }} style={{ width: 48, height: 30, border: 'none', background: 'none' }} />)}</span>
            <span style={muted}>Crest</span><select className="input" value={t.icon || 'Circle'} onChange={e => setT({ icon: e.target.value })}>{GLYPHS.map(g => <option key={g}>{g}</option>)}</select>
            <span style={muted}>Logo image</span>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="btn btn-secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>Upload<input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0])} /></label>
              {t.logoImg && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setT({ logoImg: undefined })}>Use crest</button>}
              <span style={{ ...muted, fontSize: '11px' }}>Cropped square, 256 px</span>
            </span>
            <span style={muted}>Arena</span><input className="input" value={t.arena ?? t.region + ' Arena'} onChange={e => setT({ arena: e.target.value })} />
            <span style={muted}>Capacity</span>
            <NumInput value={t.arenaCap || 18800} min={8000} max={25000} step={100} width={96} onValue={v => setT({ arenaCap: v })} suffix="seats (8,000–25,000)" />
          </div>
          {err && <p style={{ color: 'var(--gm-bad)', fontSize: '12px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' }}>{logo(tid, 64)}{logo(tid, 32)}{logo(tid, 18)}</div>
        </section>
        <section>
          <h4 style={ruleH4}>Finances & ownership</h4>
          <div style={grid}>
            {adj('Payroll adjustment', 'capAdj', -60, 60, 'Negative adds cap space; positive uses it up. Payroll now ' + money(pay) + '.')}
            {adj('Tax bill adjustment', 'taxAdj', -50, 50, 'Added to (or taken off) this season’s luxury tax bill.')}
            {adj('Owner budget', 'ceilAdj', -40, 40, 'Moves the owner’s payroll ceiling: ' + money(gm.ownerCeiling(t.arch) + (t.ceilAdj || 0)) + '.')}
            <span style={muted}>Owner</span><input className="input" value={t.owner} onChange={e => setT({ owner: e.target.value })} />
            <span style={muted}>Archetype</span><select className="input" value={t.arch} onChange={e => setT({ arch: e.target.value })}>{OWNER_ARCHETYPES.map(a => <option key={a}>{a}</option>)}</select>
            <span style={muted}>GM & head coach</span><input className="input" value={t.gm} disabled={gm.isUser(s, tid)} title={gm.isUser(s, tid) ? 'You run this team' : ''} onChange={e => setT({ gm: e.target.value })} />
          </div>
        </section>
        <section>
          <h4 style={ruleH4}>Roster · {s.rosters[tid].length} players</h4>
          {s.rosters[tid].map(id => (
            <div key={id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--color-divider)', fontSize: '12.5px' }}>
              <Link onClick={() => open(id)}>{P[id].name}</Link><span style={muted}>{P[id].pos} · {P[id].ovr} · {money(P[id].amt)}</span>
              <button className="btn btn-ghost" onClick={() => release(id)} style={{ marginLeft: 'auto', fontSize: '11.5px', padding: '1px 8px' }}>Remove</button>
            </div>
          ))}
          <select className="input" value="" onChange={e => e.target.value && sign(+e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
            <option value="">Add a free agent…</option>{s.fa.slice().sort((a, b) => P[b].ovr - P[a].ovr).map(id => <option key={id} value={id}>{P[id].name} · {P[id].pos} · {P[id].ovr}</option>)}
          </select>
        </section>
      </div>
      <section style={{ marginTop: '26px' }}>
        <h4 style={ruleH4}>Force a trade</h4>
        <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Swap any two players between any two teams, AI-run or yours, with no salary matching or apron rules.</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>{logo(tid, 20)}<select className="input" value={pa} onChange={e => setPa(e.target.value === '' ? '' : +e.target.value)}><option value="">{t.abbr} player…</option>{s.rosters[tid].map(id => <option key={id} value={id}>{P[id].name} ({P[id].ovr})</option>)}</select></span>
          <span>for</span>
          <select className="input" value={other} onChange={e => { setOther(+e.target.value); setPb(''); }}>{T.filter(x => x.tid !== tid).map(x => <option key={x.tid} value={x.tid}>{x.abbr}</option>)}</select>
          <select className="input" value={pb} onChange={e => setPb(e.target.value === '' ? '' : +e.target.value)}><option value="">{T[other]?.abbr} player…</option>{(s.rosters[other] || []).map(id => <option key={id} value={id}>{P[id].name} ({P[id].ovr})</option>)}</select>
          <button className="btn btn-primary" disabled={pa === '' || pb === '' || other === tid} onClick={trade}>Force trade</button>
          {msg && <span style={{ color: 'var(--gm-good)', fontSize: '12px' }}>{msg}</span>}
        </div>
      </section>
    </>
  );
}

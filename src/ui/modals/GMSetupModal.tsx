// "Create your GM": shown once, right after you start a league as a team. Name,
// nationality, experience, race and a generated headshot (make a new one, or upload a
// photo). Experience sets your reputation, which decides your first contract.
import { useState } from 'react';
import type { VM } from '../vm';
import { CountryPicker, Kicker, muted } from '../kit';
import { randomName } from '../../data/heritage';
import { makeFace, faceSvg } from '../../engine/faces';
import { EXPERIENCE, GENEROSITY, RACES, finishGMSetup, gmFaceInput, startingContract, type GMProfile } from '../../engine/gmCareer';
import { processImage } from '../upload';

export function Headshot({ gm, team, size = 96 }: { gm: GMProfile; team?: any; size?: number }) {
  return (
    <div style={{ width: size, height: size * 1.15, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-neutral-100)', flex: 'none' }}>
      {gm.img ? <img src={gm.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : faceSvg(makeFace(gmFaceInput(gm)), ['#2f3136', '#d8d4cc'])}
    </div>
  );
}

export function GMSetupModal({ vm }: { vm: VM }) {
  const { gm, s, T } = vm.ctx, C = gm.db.C, team = T[s.me];
  const fresh = (nat: string, race?: string): GMProfile => { const r = randomName(nat); return { name: r.name, nat, exp: 2, race: race || (['black', 'white', 'asian', 'brown'].includes(r.race) ? r.race : 'white'), seed: Math.floor(Math.random() * 1e6) }; };
  const [p, setP] = useState<GMProfile>(() => fresh('US'));
  const [err, setErr] = useState('');
  const E = EXPERIENCE[p.exp], k = startingContract(gm, s, s.me, p.exp), G = GENEROSITY[team.arch];
  const set = (x: Partial<GMProfile>) => setP(o => ({ ...o, ...x }));
  const done = (tour: boolean) => { finishGMSetup(gm, { ...p, name: p.name.trim() || 'The GM' }); if (tour) gm.setState({ tour: 0, tourMode: null }); };
  const lab = { fontSize: '12px', fontWeight: 600, marginBottom: 3, display: 'block' } as const;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 60%, transparent)', zIndex: 40, padding: '16px', overflowY: 'auto' }}>
      <div className="card" style={{ width: 'min(760px, 100%)', padding: '22px 26px', gap: '14px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <Kicker accent>New career · {team.region} {team.name}</Kicker>
          <div style={{ fontSize: '26px', fontWeight: 600 }}>Create your GM</div>
          <div style={{ ...muted, fontSize: '13px' }}>Who’s running the {team.name}? You can keep everything below as is.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '22px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <Headshot gm={p} team={team} size={120} />
            <button className="btn btn-secondary" style={{ fontSize: '12px', width: '100%' }} onClick={() => set({ seed: Math.floor(Math.random() * 1e6), img: undefined })}>New face</button>
            <label className="btn btn-ghost" style={{ fontSize: '12px', width: '100%', cursor: 'pointer', textAlign: 'center' }}>Upload a photo
              <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { set({ img: await processImage(f, 240, 276, 'image/jpeg') }); setErr(''); } catch (x: any) { setErr(x.message); } }} />
            </label>
            {err && <span style={{ fontSize: '11px', color: 'var(--gm-bad)' }}>{err}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px 16px' }}>
            <div>
              <span style={lab}>Name</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" value={p.name} maxLength={40} onChange={e => set({ name: e.target.value })} style={{ flex: 1, minWidth: 0 }} />
                <button className="btn btn-ghost" title="A random name from your nationality" onClick={() => set({ name: randomName(p.nat).name })} style={{ fontSize: '12px' }}>Random</button>
              </div>
            </div>
            <div>
              <span style={lab}>Nationality</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={gm.flag(p.nat)} alt="" style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                <span style={{ fontSize: '13px' }}>{C[p.nat].n}</span>
              </div>
              <div style={{ marginTop: 4 }}><CountryPicker C={C} onPick={c => { const r = randomName(c); set({ nat: c, name: r.name, race: ['black', 'white', 'asian', 'brown'].includes(r.race) ? r.race : p.race, img: undefined }); }} placeholder="Type to change…" width="100%" /></div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={lab}>Experience</span>
              <select className="input" value={p.exp} onChange={e => set({ exp: +e.target.value })} style={{ width: '100%' }}>
                {EXPERIENCE.map(x => <option key={x.k} value={x.k}>{x.label} (starting reputation {x.rep})</option>)}
              </select>
              <div style={{ ...muted, fontSize: '12px', marginTop: 3 }}>{E.desc}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={lab}>Race (for your headshot)</span>
              <select className="input" value={p.race} onChange={e => set({ race: e.target.value, img: undefined })} style={{ width: '100%' }}>
                {RACES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '13px' }}>
          <b>{team.owner}’s offer:</b> {k.years} years at ${k.salary.toFixed(2)}M a season, through {k.thru - 1}–{String(k.thru).slice(2)}.
          <span style={muted}> {team.owner} is a {team.arch} and {G.note}. When the deal runs low, the owner offers an extension if happy with you, or lets it expire if not.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => done(true)}>Start and show me the tutorial</button>
          <button className="btn btn-primary" onClick={() => done(false)}>Start my career</button>
        </div>
      </div>
    </div>
  );
}

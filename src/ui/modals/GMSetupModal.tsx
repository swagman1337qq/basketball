// "Create your GM": shown once, right after you start a league as a team. Name,
// nationality, experience, race and a generated headshot (make a new one, or upload a
// photo). Experience sets your reputation, which decides your first contract.
import { useState } from 'react';
import type { VM } from '../vm';
import { CountryPicker, Kicker, muted, NumInput } from '../kit';
import { randomName } from '../../data/heritage';
import { makeFace, faceSvg } from '../../engine/faces';
import { FAMILY_FIRST_NATS, FRONT_OFFICE, GENEROSITY, GM_AGE, GM_BACKDROPS, PLAYING, RACES, finishGMSetup, givenName, gmAge, gmFaceInput, resumeOf, startingContract, type GMProfile } from '../../engine/gmCareer';
import { processImage } from '../upload';

// The backdrop behind your headshot (GM_BACKDROPS), drawn in CSS; team ones use your team's colors.
function backdropImg(bg: string | undefined, team?: any): string {
  const c0 = team?.colors?.[0] || '#3b4a6b', c1 = team?.colors?.[1] || '#c9a227', ab = String(team?.abbr || 'GM').replace(/[^A-Za-z0-9]/g, '');
  switch (bg) {
    case 'team': return `linear-gradient(160deg, ${c0} 0%, ${c0} 55%, ${c1} 100%)`;
    case 'arena': return 'radial-gradient(ellipse 60% 40% at 30% 0%, rgba(255,244,214,.75), transparent 70%), radial-gradient(ellipse 60% 40% at 75% 0%, rgba(255,244,214,.6), transparent 70%), radial-gradient(circle at 50% 120%, #3a2f25 0%, #1a1714 60%, #0d0c0b 100%)';
    case 'press': { const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='36'><rect width='56' height='36' fill='#f4f2ee'/><text x='4' y='15' font-family='Arial' font-weight='700' font-size='11' fill='${c0}'>${ab}</text><text x='30' y='32' font-family='Arial' font-weight='700' font-size='11' fill='${c0}' opacity='.55'>${ab}</text></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`; }
    case 'office': return 'linear-gradient(180deg, rgba(0,0,0,0) 0 64%, #6e4f33 64% 100%), repeating-linear-gradient(90deg, #cfd8e3 0 22px, #9aa8b8 22px 24px), linear-gradient(180deg, #b9c7d6, #e8ecef)';
    case 'court': return 'linear-gradient(180deg, rgba(255,255,255,0) 0 70%, rgba(255,255,255,.85) 70% 72%, rgba(255,255,255,0) 72%), repeating-linear-gradient(90deg, #c99a5f 0 10px, #b88748 10px 20px, #d3a66b 20px 30px)';
    case 'dusk': return 'linear-gradient(180deg, rgba(0,0,0,0) 0 62%, #2a2340 62% 100%), linear-gradient(180deg, #ffb26b 0%, #f07a6a 40%, #7a4c8a 75%, #2a2340 100%)';
    default: return 'none';
  }
}

const backdrop = (bg: string | undefined, team?: any) => ({ backgroundColor: 'var(--color-neutral-100)', backgroundImage: backdropImg(bg, team), backgroundSize: bg === 'press' ? '56px 36px' : 'cover' });

// year: the season to show you in (you age each season); leave it out for the age you chose.
export function Headshot({ gm, team, size = 96, year }: { gm: GMProfile; team?: any; size?: number; year?: number }) {
  return (
    <div style={{ width: size, height: size * 1.15, borderRadius: 'var(--radius-md)', overflow: 'hidden', ...backdrop(gm.bg, team), flex: 'none' }}>
      {gm.img ? <img src={gm.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : faceSvg(makeFace(gmFaceInput(gm, year)), ['#2f3136', '#d8d4cc'])}
    </div>
  );
}

export function GMSetupModal({ vm }: { vm: VM }) {
  const { gm, s, T } = vm.ctx, C = gm.db.C, team = T[s.me];
  const look = (race?: string) => (['black', 'white', 'asian', 'brown'].includes(race || '') ? race! : 'white');
  const fresh = (nat: string, fem = false): GMProfile => { const r = randomName(nat, Math.random, undefined, fem); return { name: r.name, familyFirst: !!r.familyFirst || FAMILY_FIRST_NATS.includes(nat), nat, race: look(r.race), seed: Math.floor(Math.random() * 1e6), fem, age: 45, fo: 3, play: 0, bg: 'team' }; };
  const [p, setP] = useState<GMProfile>(() => fresh('US'));
  const [err, setErr] = useState('');
  const R = resumeOf(p), k = startingContract(gm, s, s.me, p), G = GENEROSITY[team.arch];
  const set = (x: Partial<GMProfile>) => setP(o => ({ ...o, ...x }));
  const rename = (nat: string, fem: boolean) => { const r = randomName(nat, Math.random, undefined, fem); return { name: r.name, familyFirst: !!r.familyFirst || FAMILY_FIRST_NATS.includes(nat) }; };
  const done = (tour: boolean) => { finishGMSetup(gm, { ...p, name: p.name.trim() || 'The GM' }); if (tour) gm.setState({ tour: 0, tourMode: null }); };
  const lab = { fontSize: '12px', fontWeight: 600, marginBottom: 3, display: 'block' } as const;
  const seg = (_on: boolean) => ({ fontSize: '12.5px', padding: '4px 12px' });
  // Each name-order option spelled out with the name you entered: which part is the family name,
  // and what the owner will call you.
  const order = (ff: boolean) => { const parts = p.name.trim().split(/\s+/).filter(Boolean), g = givenName({ ...p, familyFirst: ff });
    if (parts.length < 2) return ff ? 'Family name first' : 'Given name first';
    const fam = ff ? parts[0] : parts.slice(1).join(' ');
    return (ff ? 'Family name first' : 'Given name first') + ': ' + fam + ' is the family name, you’re called ' + g; };
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
                <button className="btn btn-ghost" title="A random name from your nationality" onClick={() => set(rename(p.nat, !!p.fem))} style={{ fontSize: '12px' }}>Random</button>
              </div>
            </div>
            <div>
              <span style={lab}>Nationality</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={gm.flag(p.nat)} alt="" style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                <span style={{ fontSize: '13px' }}>{C[p.nat].n}</span>
              </div>
              <div style={{ marginTop: 4 }}><CountryPicker C={C} onPick={c => { const r = randomName(c, Math.random, undefined, !!p.fem); set({ nat: c, name: r.name, familyFirst: !!r.familyFirst || FAMILY_FIRST_NATS.includes(c), race: ['black', 'white', 'asian', 'brown'].includes(r.race) ? r.race : p.race, img: undefined }); }} placeholder="Type to change…" width="100%" /></div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={lab}>Name order</span>
              <select className="input" value={p.familyFirst ? 'f' : 'g'} onChange={e => set({ familyFirst: e.target.value === 'f' })} style={{ width: '100%' }}>
                <option value="g">{order(false)}</option>
                <option value="f">{order(true)}</option>
              </select>
              <div style={{ ...muted, fontSize: '12px', marginTop: 3 }}>The owner will call you <b>{givenName(p)}</b>.</div>
            </div>
            <div>
              <span style={lab}>Sex</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {([[false, 'Man'], [true, 'Woman']] as [boolean, string][]).map(([f, l]) => <button key={l} className={!!p.fem === f ? 'btn btn-primary' : 'btn btn-secondary'} style={seg(!!p.fem === f)} onClick={() => { if (!!p.fem !== f) set({ fem: f, ...rename(p.nat, f), img: undefined }); }}>{l}</button>)}
              </div>
            </div>
            <div>
              <span style={lab}>Age</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="range" min={GM_AGE.min} max={GM_AGE.max} value={gmAge(p)} onChange={e => set({ age: +e.target.value })} style={{ flex: 1, minWidth: 0 }} />
                <NumInput value={gmAge(p)} min={GM_AGE.min} max={GM_AGE.max} onValue={v => set({ age: v })} width={60} />
              </div>
              <div style={{ ...muted, fontSize: '11.5px', marginTop: 2 }}>{GM_AGE.min} to {GM_AGE.max}. You age a year each season; at {GM_AGE.cap} you stay {GM_AGE.cap}. Your headshot follows your age.</div>
            </div>
            <div style={{ gridColumn: '1 / -1', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: '13px' }}>Experience</span><span style={{ ...muted, fontSize: '12px' }}>Starting reputation <b style={{ color: 'var(--color-text)' }}>{R.rep}</b> · any experience at any age</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '10px 16px' }}>
                <div>
                  <span style={lab}>Front-office experience</span>
                  <select className="input" value={R.fo} onChange={e => set({ fo: +e.target.value })} style={{ width: '100%' }}>
                    {FRONT_OFFICE.map(x => <option key={x.k} value={x.k}>{x.label} (+{x.rep})</option>)}
                  </select>
                  <div style={{ ...muted, fontSize: '12px', marginTop: 3 }}>{FRONT_OFFICE[R.fo].desc}</div>
                </div>
                <div>
                  <span style={lab}>Playing experience</span>
                  <select className="input" value={R.play} onChange={e => set({ play: +e.target.value })} style={{ width: '100%' }}>
                    {PLAYING.map(x => <option key={x.k} value={x.k}>{x.label}{x.rep ? ' (+' + x.rep + ')' : ''}</option>)}
                  </select>
                  <div style={{ ...muted, fontSize: '12px', marginTop: 3 }}>{PLAYING[R.play].desc}</div>
                </div>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={lab}>Race (for your headshot)</span>
              <select className="input" value={p.race} onChange={e => set({ race: e.target.value, img: undefined })} style={{ width: '100%' }}>
                {RACES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={lab}>Headshot background</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GM_BACKDROPS.map(([v, l]) => <button key={v} onClick={() => set({ bg: v })} title={l} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px 3px 3px', borderRadius: 'var(--radius-sm)', fontSize: '12px', border: '1px solid ' + ((p.bg || 'plain') === v ? 'var(--color-accent)' : 'var(--color-divider)') }}>
                  <span style={{ width: 22, height: 22, borderRadius: 4, ...backdrop(v, team), border: '1px solid var(--color-divider)' }} />{l}</button>)}
              </div>
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

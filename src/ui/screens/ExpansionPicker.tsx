// Expansion setup (Settings): choose new franchises from the database (ready-made teams
// for cities of 1 million+, plus a few smaller ones, flagged) or design your own (city,
// nickname, abbreviation, conference, division, market, colors, crest, logo style). Any
// even number join at the next preseason.
import { useState } from 'react';
import type { VM } from '../vm';
import { FRANCHISES, marketOf, type Franchise } from '../../data/franchises';
import { genExpansionTeam } from '../../data/world';
import { GLYPH_NAMES, LOGO_STYLES, TeamLogo } from '../TeamLogo';
import { muted, NumInput, Seg } from '../kit';

const DIVS: Record<string, string[]> = { East: ['Atlantic', 'Central', 'Southeast'], West: ['Northwest', 'Pacific', 'Southwest'] };
const toTeam = (f: Franchise) => ({ region: f.region, name: f.name, abbr: f.abbr, conf: f.conf, div: f.div, mkt: marketOf(f), colors: f.colors, icon: f.icon, pop: f.pop });

export function ExpansionPicker({ vm }: { vm: VM }) {
  const { gm, s, T } = vm.ctx;
  const [q, setQ] = useState(''), [conf, setConf] = useState<'all' | 'East' | 'West'>('all'), [big, setBig] = useState(true), [mode, setMode] = useState<'db' | 'custom'>('db');
  const [draft, setDraft] = useState<any>(() => ({ ...genExpansionTeam('Your City', Math.random, T.map(t => t.abbr)), region: '', name: '', abbr: '', conf: 'East', div: 'Atlantic', mkt: 1, logoStyle: 'shield' }));
  if (!s.expansion) return null;
  const pend: any[] = s.expTeams || [], taken = new Set([...T.map(t => t.abbr), ...pend.map(t => t.abbr)]), inLeague = new Set(T.map(t => t.region + '|' + t.name));
  const setPend = (list: any[]) => gm.setState({ expTeams: list });
  const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const list = FRANCHISES.filter(f => (conf === 'all' || f.conf === conf) && (!big || f.pop >= 1) && (!q || fold(f.region + ' ' + f.name + ' ' + f.known).includes(fold(q)))).sort((a, b) => b.pop - a.pop);
  const eastN = pend.filter(t => t.conf === 'East').length, westN = pend.length - eastN;
  const errs = [pend.length === 1 || pend.length % 2 ? 'Pick an even number of teams (the schedule needs an even league).' : '', pend.length && eastN !== westN ? 'Tip: an equal number per conference keeps the playoff races fair (' + eastN + ' East, ' + westN + ' West).' : ''].filter(Boolean);
  const dOk = draft.region.trim() && draft.name.trim() && /^[A-Z]{2,4}$/.test(draft.abbr) && !taken.has(draft.abbr);
  const set = (p: any) => setDraft((d: any) => ({ ...d, ...p }));
  return (
    <div style={{ padding: '10px 0 16px', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Joining next preseason ({pend.length || 'none picked: two default teams'})</div>
      {pend.length > 0 ? <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>{pend.map(t => (
        <div key={t.abbr} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
          <TeamLogo team={t} size={34} />
          <div style={{ fontSize: '12.5px' }}><b>{t.region} {t.name}</b><div style={muted}>{t.abbr} · {t.conf} · {t.div} · market ×{t.mkt}</div></div>
          <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '0 6px', color: 'var(--gm-bad)' }} title="Remove" onClick={() => setPend(pend.filter(x => x.abbr !== t.abbr))}>✕</button>
        </div>))}</div> : <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>If you don’t pick any, the two largest markets left in the database join (one per conference).</p>}
      {errs.map(e => <div key={e} style={{ fontSize: '12px', color: e.startsWith('Tip') ? 'var(--color-accent-800)' : 'var(--gm-bad)' }}>{e}</div>)}
      <div style={{ margin: '10px 0 8px' }}><Seg<'db' | 'custom'> value={mode} options={[['db', 'Franchise database'], ['custom', 'Create your own']]} onChange={setMode} /></div>
      {mode === 'db' ? (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: '12.5px' }}>
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search city, nickname or what it’s known for…" style={{ width: 280 }} />
            <Seg<any> value={conf} options={[['all', 'Both'], ['West', 'West'], ['East', 'East']]} onChange={setConf} />
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={big} onChange={e => setBig(e.target.checked)} /> Only metros of 1 million+</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {list.map(f => { const used = taken.has(f.abbr) || inLeague.has(f.region + '|' + f.name); return (
              <div key={f.abbr} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 8px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', opacity: used ? 0.5 : 1 }}>
                <TeamLogo team={toTeam(f) as any} size={40} />
                <div style={{ flex: 1, minWidth: 0, fontSize: '12.5px' }}>
                  <b>{f.region} {f.name}</b> <span style={muted}>{f.abbr}</span>
                  <div style={muted}>{f.conf} · {f.div} · {f.pop >= 1 ? f.pop.toFixed(1) + 'M' : Math.round(f.pop * 1000) + 'K'} metro{f.pop < 1 ? ' (under 1M)' : ''}</div>
                  <div style={{ ...muted, fontStyle: 'italic' }}>{f.known}</div>
                </div>
                <button className="btn btn-secondary" disabled={used} style={{ fontSize: '12px', padding: '3px 10px' }} onClick={() => setPend([...pend, toTeam(f)])}>{used ? (pend.some(p => p.abbr === f.abbr) ? 'Added' : 'In league') : 'Add'}</button>
              </div>); })}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
          <TeamLogo team={{ ...draft, region: draft.region || 'City', name: draft.name || 'Team', abbr: draft.abbr || 'NEW' }} size={96} />
          <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', gap: '6px 10px', alignItems: 'center', fontSize: '12.5px', maxWidth: 560 }}>
            <span style={muted}>City</span><input className="input" value={draft.region} onChange={e => set({ region: e.target.value })} placeholder="e.g. Seoul" />
            <span style={muted}>Nickname</span><input className="input" value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Tigers" />
            <span style={muted}>Abbreviation</span><input className="input" value={draft.abbr} onChange={e => set({ abbr: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) })} placeholder="2–4 letters" style={{ width: 90 }} />
            <span style={muted}>Conference</span><Seg<string> value={draft.conf} options={[['West', 'West'], ['East', 'East']]} onChange={c => set({ conf: c, div: DIVS[c][0] })} />
            <span style={muted}>Division</span><select className="input" value={draft.div} onChange={e => set({ div: e.target.value })} style={{ width: 'auto' }}>{DIVS[draft.conf].map(d => <option key={d}>{d}</option>)}</select>
            <span style={muted}>Market size</span><NumInput value={draft.mkt} min={0.6} max={1.6} step={0.05} onValue={v => set({ mkt: v })} suffix="× (1 = average; 1.5 = New York)" />
            <span style={muted}>Colors</span><span style={{ display: 'flex', gap: 8 }}><input type="color" value={draft.colors[0]} onChange={e => set({ colors: [e.target.value, draft.colors[1]] })} /><input type="color" value={draft.colors[1]} onChange={e => set({ colors: [draft.colors[0], e.target.value] })} /></span>
            <span style={muted}>Crest</span><select className="input" value={draft.icon} onChange={e => set({ icon: e.target.value })} style={{ width: 'auto' }}>{GLYPH_NAMES.map(n => <option key={n}>{n}</option>)}</select>
            <span style={muted}>Logo style</span><Seg<string> value={draft.logoStyle} options={LOGO_STYLES.map(x => [x, x[0].toUpperCase() + x.slice(1)] as [string, string])} onChange={v => set({ logoStyle: v })} />
            <span />
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-primary" disabled={!dOk} onClick={() => { setPend([...pend, { ...draft, region: draft.region.trim(), name: draft.name.trim() }]); set({ region: '', name: '', abbr: '' }); }}>Add this team</button>
              <button className="btn btn-ghost" onClick={() => { const g = genExpansionTeam(draft.region || 'Your City', Math.random, [...taken]); set({ colors: g.colors, icon: g.icon, name: draft.name || g.name, abbr: draft.abbr || (draft.region ? g.abbr : '') }); }}>🎲 Suggest look</button>
              {!dOk && (draft.region || draft.abbr) && <span style={{ ...muted, fontSize: '11.5px' }}>{taken.has(draft.abbr) ? 'That abbreviation is taken.' : 'City, nickname and a 2–4 letter abbreviation needed.'}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

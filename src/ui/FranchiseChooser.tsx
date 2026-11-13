// Choosing a franchise: from the ready-made database (cities of 1 million+, plus smaller ones, flagged) or your own
// design (city, nickname, abbreviation, conference, division, market, colors, crest, logo style). Used by Expansion
// (Settings), the start screen's Teams editor and God Mode's Relocate / replace (League editor).
import { useState } from 'react';
import { FRANCHISES, marketOf, type Franchise } from '../data/franchises';
import { genExpansionTeam } from '../data/world';
import { GLYPH_NAMES, LOGO_STYLES, LOGO_STYLE_LABELS, TeamLogo } from './TeamLogo';
import { muted, NumInput, Seg, usePaged } from './kit';

export const DIVS: Record<string, string[]> = { East: ['Atlantic', 'Central', 'Southeast'], West: ['Northwest', 'Pacific', 'Southwest'] };
export const toTeam = (f: Franchise) => ({
  region: f.region,
  name: f.name,
  abbr: f.abbr,
  conf: f.conf,
  div: f.div,
  mkt: marketOf(f),
  colors: f.colors,
  icon: f.icon,
  pop: f.pop,
});

export function FranchiseChooser({
  taken,
  inLeague,
  picked = new Set<string>(),
  onPick,
  pickLabel = 'Add',
  pickedLabel = 'Added',
  customLabel = 'Add this team',
  customInit,
  clearAfter = true,
}: {
  taken: Set<string>; // abbreviations in use (league + already picked)
  inLeague: Set<string>; // 'region|name' of clubs in the league
  picked?: Set<string>; // abbreviations already picked here
  onPick: (team: any) => void;
  pickLabel?: string;
  pickedLabel?: string;
  customLabel?: string;
  customInit?: Record<string, any>; // Create your own starts from this (God Mode: the club's own nickname and look)
  clearAfter?: boolean;
}) {
  const [q, setQ] = useState(''),
    [conf, setConf] = useState<'all' | 'East' | 'West'>('all'),
    [big, setBig] = useState(true),
    [mode, setMode] = useState<'db' | 'custom'>('db');
  const [draft, setDraft] = useState<any>(() => ({
    ...genExpansionTeam('Your City', Math.random, [...taken]),
    region: '',
    name: '',
    abbr: '',
    conf: 'East',
    div: 'Atlantic',
    mkt: 1,
    logoStyle: 'shield',
    ...(customInit || {}),
  }));
  const fold = (x: string) =>
    x
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const list = FRANCHISES.filter(
    f =>
      (conf === 'all' || f.conf === conf) &&
      (!big || f.pop >= 1) &&
      (!q || fold(f.region + ' ' + f.name + ' ' + f.known).includes(fold(q))),
  ).sort((a, b) => b.pop - a.pop);
  const dOk = draft.region.trim() && draft.name.trim() && /^[A-Z]{2,4}$/.test(draft.abbr) && !taken.has(draft.abbr);
  const set = (p: any) => setDraft((d: any) => ({ ...d, ...p }));
  const pg = usePaged(list, 'cities', 24, conf + '|' + big + '|' + q);
  return (
    <>
      <div style={{ margin: '10px 0 8px' }}>
        <Seg<'db' | 'custom'>
          value={mode}
          options={[
            ['db', 'Franchise database'],
            ['custom', 'Create your own'],
          ]}
          onChange={setMode}
        />
      </div>
      {mode === 'db' ? (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: '12.5px' }}>
            <input
              className="input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search city, nickname or what it’s known for…"
              style={{ width: 280 }}
            />
            <Seg<any>
              value={conf}
              options={[
                ['all', 'Both'],
                ['West', 'West'],
                ['East', 'East'],
              ]}
              onChange={setConf}
            />
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={big} onChange={e => setBig(e.target.checked)} /> Only metros of 1 million+
            </label>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
              gap: 8,
              maxHeight: 420,
              overflowY: 'auto',
            }}
          >
            {pg.rows.map(f => {
              const used = taken.has(f.abbr) || inLeague.has(f.region + '|' + f.name);
              return (
                <div
                  key={f.abbr}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    padding: '6px 8px',
                    border: '1px solid var(--color-divider)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: used ? 0.5 : 1,
                  }}
                >
                  <TeamLogo team={toTeam(f) as any} size={40} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: '12.5px' }}>
                    <b>
                      {f.region} {f.name}
                    </b>{' '}
                    <span style={muted}>{f.abbr}</span>
                    <div style={muted}>
                      {f.conf} · {f.div} · {f.pop >= 1 ? f.pop.toFixed(1) + 'M' : Math.round(f.pop * 1000) + 'K'} metro
                      {f.pop < 1 ? ' (under 1M)' : ''}
                    </div>
                    <div style={{ ...muted, fontStyle: 'italic' }}>{f.known}</div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    disabled={used}
                    style={{ fontSize: '12px', padding: '3px 10px' }}
                    onClick={() => onPick(toTeam(f))}
                  >
                    {used ? (picked.has(f.abbr) ? pickedLabel : 'In league') : pickLabel}
                  </button>
                </div>
              );
            })}
          </div>
          {pg.pager}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
          <TeamLogo team={{ ...draft, region: draft.region || 'City', name: draft.name || 'Team', abbr: draft.abbr || 'NEW' }} size={96} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px minmax(0,1fr)',
              gap: '6px 10px',
              alignItems: 'center',
              fontSize: '12.5px',
              maxWidth: 560,
            }}
          >
            <span style={muted}>City</span>
            <input className="input" value={draft.region} onChange={e => set({ region: e.target.value })} placeholder="e.g. Seoul" />
            <span style={muted}>Nickname</span>
            <input className="input" value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Tigers" />
            <span style={muted}>Abbreviation</span>
            <input
              className="input"
              value={draft.abbr}
              onChange={e =>
                set({
                  abbr: e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, '')
                    .slice(0, 4),
                })
              }
              placeholder="2–4 letters"
              style={{ width: 90 }}
            />
            <span style={muted}>Conference</span>
            <Seg<string>
              value={draft.conf}
              options={[
                ['West', 'West'],
                ['East', 'East'],
              ]}
              onChange={c => set({ conf: c, div: DIVS[c][0] })}
            />
            <span style={muted}>Division</span>
            <select className="input" value={draft.div} onChange={e => set({ div: e.target.value })} style={{ width: 'auto' }}>
              {DIVS[draft.conf].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <span style={muted}>Market size</span>
            <NumInput
              value={draft.mkt}
              min={0.6}
              max={1.6}
              step={0.05}
              onValue={v => set({ mkt: v })}
              suffix="× (1 = average; 1.5 = New York)"
            />
            <span style={muted}>Colors</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={draft.colors[0]} onChange={e => set({ colors: [e.target.value, draft.colors[1]] })} />
              <input type="color" value={draft.colors[1]} onChange={e => set({ colors: [draft.colors[0], e.target.value] })} />
            </span>
            <span style={muted}>Crest</span>
            <select className="input" value={draft.icon} onChange={e => set({ icon: e.target.value })} style={{ width: 'auto' }}>
              {GLYPH_NAMES.map(n => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <span style={muted}>Logo style</span>
            <select className="input" value={draft.logoStyle} onChange={e => set({ logoStyle: e.target.value })} style={{ width: 'auto' }}>
              {LOGO_STYLES.map(x => (
                <option key={x} value={x}>
                  {LOGO_STYLE_LABELS[x]}
                </option>
              ))}
            </select>
            <span />
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                disabled={!dOk}
                onClick={() => {
                  onPick({ ...draft, region: draft.region.trim(), name: draft.name.trim() });
                  if (clearAfter) set({ region: '', name: '', abbr: '' });
                }}
              >
                {customLabel}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const g = genExpansionTeam(draft.region || 'Your City', Math.random, [...taken]);
                  set({ colors: g.colors, icon: g.icon, name: draft.name || g.name, abbr: draft.abbr || (draft.region ? g.abbr : '') });
                }}
              >
                🎲 Suggest look
              </button>
              {!dOk && (draft.region || draft.abbr) && (
                <span style={{ ...muted, fontSize: '11.5px' }}>
                  {taken.has(draft.abbr) ? 'That abbreviation is taken.' : 'City, nickname and a 2–4 letter abbreviation needed.'}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

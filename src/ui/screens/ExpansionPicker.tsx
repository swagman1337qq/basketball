// Expansion setup (Settings): pick the two new markets, one per conference; each gets
// a procedurally generated nickname, palette and crest you can reroll before it joins.
import type { VM } from '../vm';
import { EXPANSION_CITIES, genExpansionTeam } from '../../data/world';
import { TeamLogo } from '../TeamLogo';
import { muted } from '../kit';

export function ExpansionPicker({ vm }: { vm: VM }) {
  const { gm, s, T } = vm.ctx;
  if (!s.expansion || s.expanded) return null;
  const used = new Set(T.map(t => t.region)), abbrs = T.map(t => t.abbr);
  const cur = s.expTeams && s.expTeams.length === 2 ? s.expTeams : null;
  const make = (east: string, west: string) => { const a = genExpansionTeam(east, Math.random, abbrs), b = genExpansionTeam(west, Math.random, [...abbrs, a.abbr]); gm.setState({ expTeams: [{ ...a, conf: 'East' }, { ...b, conf: 'West' }] }); };
  const east = cur ? cur[0].region : 'Louisville', west = cur ? cur[1].region : 'Mexico City';
  const opts = (conf: string) => EXPANSION_CITIES.filter(c => c[1] === conf && !used.has(c[0]));
  return (
    <div style={{ padding: '10px 0 14px', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={muted}>East city</span>
        <select className="input" value={east} onChange={e => make(e.target.value, west)}>{opts('East').map(c => <option key={c[0]}>{c[0]}</option>)}</select>
        <span style={muted}>West city</span>
        <select className="input" value={west} onChange={e => make(east, e.target.value)}>{opts('West').map(c => <option key={c[0]}>{c[0]}</option>)}</select>
        <button className="btn btn-secondary" onClick={() => make(east, west)} style={{ fontSize: '12px' }}>{cur ? 'Reroll identities' : 'Generate identities'}</button>
      </div>
      {cur ? (
        <div style={{ display: 'flex', gap: '26px', marginTop: '10px' }}>
          {cur.map(t => (
            <div key={t.abbr} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <TeamLogo team={t} size={44} />
              <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>{t.region} {t.name}</div><div style={{ ...muted, fontSize: '12px' }}>{t.abbr} · {t.conf}ern Conference · {t.div} · market ×{t.mkt}</div></div>
            </div>
          ))}
        </div>
      ) : <p style={{ ...muted, fontSize: '12px', margin: '6px 0 0' }}>Without a choice, Louisville and Mexico City join with their default identities.</p>}
    </div>
  );
}

// Search anything: players by name (accents optional), countries and nationalities, heritage and
// tribes, positions, teams, colleges and screens.
import type { VM } from './vm';

export function PlayerSearch({ vm, width = 260 }: { vm: VM; width?: number }) {
  return (
    <div style={{ position: 'relative', width }}>
      <div style={{ position: 'absolute', left: 9, top: 8, color: 'var(--color-neutral-600)' }}>{vm.searchIcon}</div>
      <input className="input" value={vm.q} onChange={vm.onSearch} onKeyDown={e => { if (e.key === 'Enter' && vm.matches?.[0]) vm.matches[0].open(); if (e.key === 'Escape') vm.onSearch({ target: { value: '' } }); }} placeholder="Search anything…" aria-label="Search players, countries, teams…" title="Players, countries (china, chinese), heritage (native, navajo), positions, teams, colleges, screens" style={{ paddingLeft: 32, minHeight: 32, fontSize: '13px', width: '100%' }} />
      {!vm.hasMatches && String(vm.q || '').trim().length >= 2 && <div style={{ position: 'absolute', zIndex: 30, top: 36, right: 0, width: 360, minWidth: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '8px 12px', fontSize: '13px', color: 'var(--color-neutral-700)' }}>Nothing found. Try a name, country, nationality, tribe, team, college or position.</div>}
      {!!vm.hasMatches && (
        <div style={{ position: 'absolute', zIndex: 30, top: 36, right: 0, minWidth: '100%', width: 360, maxHeight: '70vh', overflowY: 'auto', background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '4px 0' }}>
          {(vm.matches || []).map((m: any, i: number, a: any[]) => (<div key={i}>
            {(i === 0 || a[i - 1].sec !== m.sec) && <div style={{ padding: i ? '8px 12px 2px' : '2px 12px 2px', fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{m.sec}</div>}
            <button className="hv3" onClick={m.open} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', padding: '6px 12px', fontSize: '13px' }}>
              {m.logo ? <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}>{m.logo}</span> : m.flag ? <img src={m.flag} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} /> : <span style={{ width: 16 }} />}
              <span style={{ flex: 1, fontWeight: m.strong ? 600 : undefined, color: m.strong ? 'var(--color-accent-700)' : undefined }}>{m.name}</span><span style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{m.meta}</span>
            </button>
          </div>))}
        </div>
      )}
    </div>
  );
}

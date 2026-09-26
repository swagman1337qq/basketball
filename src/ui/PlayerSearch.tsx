// Jump to any player: type part of a name (accents optional).
import type { VM } from './vm';

export function PlayerSearch({ vm, width = 260 }: { vm: VM; width?: number }) {
  return (
    <div style={{ position: 'relative', width }}>
      <div style={{ position: 'absolute', left: 9, top: 8, color: 'var(--color-neutral-600)' }}>{vm.searchIcon}</div>
      <input className="input" value={vm.q} onChange={vm.onSearch} onKeyDown={e => { if (e.key === 'Enter' && vm.matches?.[0]) vm.matches[0].open(); if (e.key === 'Escape') vm.onSearch({ target: { value: '' } }); }} placeholder="Search players…" aria-label="Search players" style={{ paddingLeft: 32, minHeight: 32, fontSize: '13px', width: '100%' }} />
      {!!vm.hasMatches && (
        <div style={{ position: 'absolute', zIndex: 30, top: 36, left: 0, right: 0, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '4px 0' }}>
          {(vm.matches || []).map((m: any, i: number) => (
            <button key={i} className="hv3" onClick={m.open} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', padding: '6px 12px', fontSize: '13px' }}>
              <img src={m.flag} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />
              <span style={{ flex: 1 }}>{m.name}</span><span style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{m.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

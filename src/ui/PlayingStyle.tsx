// A player's playing style (tendencies.ts): ten tendencies, 0–100, with the change since last summer.
// Behavior, not ability: his ratings decide whether the shots go in.
import { ensureTen, styleLine, TEN_DESC, TEN_KEYS, TEN_LABEL } from '../engine/tendencies';
import { muted, ruleH4 } from './kit';

export function PlayingStyle({ p }: { p: any }) {
  const t = ensureTen(p); if (!t) return null;
  const prev = p.tenPrev || null;
  return (
    <div>
      <h4 style={{ ...ruleH4, marginTop: '14px' }}>Playing style</h4>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{styleLine(p)} Tendencies drift toward what his skills, role and team ask of him, a bit each month and more each summer.{p.tenLock ? ' Locked in God Mode: they don’t change.' : ''}</p>
      {TEN_KEYS.map(k => { const v = t[k], d = prev ? v - prev[k] : 0, c = v >= 65 ? 'var(--color-accent-700)' : v <= 35 ? 'var(--color-neutral-600)' : 'var(--color-text)';
        return (
          <div key={k} title={TEN_DESC[k] + ' (50 = typical for his type)'} style={{ display: 'grid', gridTemplateColumns: '118px minmax(0,1fr) 30px 38px', gap: '8px', alignItems: 'center', padding: '2px 0', fontSize: '12.5px' }}>
            <span style={k === 'usage' ? { fontWeight: 600 } : undefined}>{TEN_LABEL[k]}</span>
            <div style={{ position: 'relative', height: 7, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)', borderRadius: 4 }}>
              <div style={{ height: 7, width: Math.round(v) + '%', background: c, borderRadius: 4, opacity: 0.8 }} />
              <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'color-mix(in srgb, var(--color-text) 40%, transparent)' }} />
            </div>
            <span style={{ textAlign: 'right', fontWeight: 700, color: c }}>{Math.round(v)}</span>
            <span title={prev ? 'Since last summer' : ''} style={{ fontSize: '11px', fontWeight: 700, color: d >= 1 ? 'var(--gm-good)' : d <= -1 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{prev && Math.abs(d) >= 1 ? (d > 0 ? '▲' : '▼') + Math.round(Math.abs(d)) : ''}</span>
          </div>); })}
    </div>
  );
}

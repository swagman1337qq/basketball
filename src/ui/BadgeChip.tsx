// A badge pill with a hover card: what the badge is, its tier and how it plays.
import { useState } from 'react';
import { BADGE_FLAVOR, TIERS } from '../engine/ratings';

export function BadgeChip({ b, small }: { b: any; small?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ fontSize: small ? '10.5px' : '12px', color: b.color, border: '1px solid ' + b.color, borderRadius: '999px', padding: small ? '0 6px' : '2px 9px', whiteSpace: 'nowrap', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{!small && <span>◆</span>}{b.name}</span>
      {hover && (
        <span role="tooltip" style={{ position: 'absolute', zIndex: 50, bottom: 'calc(100% + 6px)', left: 0, width: 240, padding: '8px 10px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid ' + b.color, borderRadius: 'var(--radius-sm)', boxShadow: '0 6px 18px rgba(0,0,0,.3)', fontSize: '12px', lineHeight: 1.4, whiteSpace: 'normal', textAlign: 'left', pointerEvents: 'none' }}>
          <span style={{ display: 'block', fontWeight: 600 }}>{b.name} <span style={{ color: b.color, fontWeight: 400 }}>· {b.tierName}</span></span>
          <span style={{ display: 'block', margin: '2px 0 4px' }}>{b.desc}.</span>
          <span style={{ display: 'block', color: 'var(--color-neutral-700)', fontStyle: 'italic' }}>{BADGE_FLAVOR[b.key]}</span>
          <span style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10.5px' }}>{TIERS.map(([n, c], i) => <span key={n} style={{ color: c, opacity: i <= b.tier ? 1 : 0.35 }}>{i <= b.tier ? '●' : '○'} {n}</span>)}</span>
        </span>
      )}
    </span>
  );
}

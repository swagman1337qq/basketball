// A badge pill with a hover card: what the badge is, its tier and how it plays.
import { BADGE_FLAVOR, TIERS } from '../engine/ratings';
import { HoverCard } from './HoverCard';

export function BadgeChip({ b, small }: { b: any; small?: boolean }) {
  return (
    <HoverCard width={250} style={{ borderColor: b.color }} anchor={<span style={{ fontSize: small ? '10.5px' : '12px', color: b.color, border: '1px solid ' + b.color, borderRadius: '999px', padding: small ? '0 6px' : '2px 9px', whiteSpace: 'nowrap', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{!small && <span>◆</span>}{b.name}</span>}>
      <span style={{ display: 'block', fontWeight: 600 }}>{b.name} <span style={{ color: b.color, fontWeight: 400 }}>· {b.tierName}</span></span>
      <span style={{ display: 'block', margin: '2px 0 4px' }}>{b.desc}.</span>
      <span style={{ display: 'block', color: 'var(--color-neutral-700)', fontStyle: 'italic' }}>{BADGE_FLAVOR[b.key]}</span>
      <span style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10.5px', flexWrap: 'wrap' }}>{TIERS.map(([n, c], i) => <span key={n} style={{ color: c, opacity: i <= b.tier ? 1 : 0.35 }}>{i <= b.tier ? '●' : '○'} {n}</span>)}</span>
    </HoverCard>
  );
}

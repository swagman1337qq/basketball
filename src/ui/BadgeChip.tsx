// A badge pill with a hover card: what the badge is, its tier and how it plays.
import { BADGE_FLAVOR, TIERS } from '../engine/ratings';
import { HoverCard } from './HoverCard';

export function BadgeChip({ b, small }: { b: any; small?: boolean }) {
  return (
    <HoverCard
      width={250}
      style={{ borderColor: b.color }}
      anchor={
        <span
          style={{
            fontSize: small ? '10.5px' : '12px',
            color: b.color,
            border: '1px solid ' + b.color,
            borderRadius: '999px',
            padding: small ? '0 6px' : '2px 9px',
            whiteSpace: 'nowrap',
            cursor: 'help',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {!small && <span>◆</span>}
          {b.name}
        </span>
      }
    >
      <span style={{ display: 'block', fontWeight: 600 }}>
        {b.name} <span style={{ color: b.color, fontWeight: 400 }}>· {b.tierName}</span>
      </span>
      <span style={{ display: 'block', margin: '2px 0 4px' }}>{b.desc}.</span>
      <span style={{ display: 'block', color: 'var(--color-neutral-700)', fontStyle: 'italic' }}>{BADGE_FLAVOR[b.key]}</span>
      <span style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10.5px', flexWrap: 'wrap' }}>
        {TIERS.map(([n, c], i) => (
          <span key={n} style={{ color: c, opacity: i <= b.tier ? 1 : 0.35 }}>
            {i <= b.tier ? '●' : '○'} {n}
          </span>
        ))}
      </span>
    </HoverCard>
  );
}

// Three-letter badge codes for tight tables (Hadrian's Lover Free agency): a chip in the tier's color.
export const BADGE_CODE: Record<string, string> = {
  sniper: 'SNP',
  stretch: 'STR',
  midrange: 'MID',
  handles: 'ANK',
  flyer: 'FLY',
  fast: 'SPD',
  firststep: 'BLW',
  finisher: 'FIN',
  general: 'GEN',
  lockdown: 'LCK',
  swat: 'SWT',
  pickpocket: 'PKP',
  wall: 'WAL',
  glass: 'GLS',
  boxout: 'BOX',
  post: 'PST',
  ft: 'FT',
  iron: 'IRN',
  iq: 'IQ',
  tough: 'TSM',
  rim: 'RIM',
  anchor: 'ANC',
  length: 'CND',
  clutch: 'CLT',
};
const codeOf = (b: any) =>
  BADGE_CODE[b.key] ||
  String(b.name || '?')
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
// Up to `max` chips, then +N; hover lists every badge with its tier.
export function MiniBadges({ list, max = 3 }: { list: any[]; max?: number }) {
  if (!list.length) return null;
  return (
    <span
      title={list.map(b => b.tierName + ' ' + b.name + ': ' + b.desc).join('\n')}
      style={{ display: 'inline-flex', gap: 3, alignItems: 'center', cursor: 'help', whiteSpace: 'nowrap' }}
    >
      {list.slice(0, max).map(b => (
        <span
          key={b.key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            height: 15,
            padding: '0 4px',
            borderRadius: 3,
            fontSize: '9.5px',
            fontWeight: 700,
            letterSpacing: '.04em',
            color: b.color,
            border: '1px solid color-mix(in srgb, ' + b.color + ' 40%, transparent)',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: b.color }} />
          {codeOf(b)}
        </span>
      ))}
      {list.length > max && <span style={{ fontSize: '10px', color: 'var(--color-neutral-600)' }}>+{list.length - max}</span>}
    </span>
  );
}

// A championship banner as it hangs in the rafters: a pennant in the club's main color on a rod,
// the year it won, its crest and "League Champions". Used by Team history and the Playoffs screen.
import { TeamLogo, type CrestTeam } from './TeamLogo';

const lum = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0.2;
  const n = parseInt(m[1], 16), ch = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
};
const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

export function ChampBanner({ team, year, width = 132, label = 'League Champions' }: { team: CrestTeam; year: number | string; width?: number; label?: string }) {
  const [c1, c2] = team.colors || ['#605d5d', '#eae7e7'];
  const ink = contrast(c1, c2) >= 3 ? c2 : lum(c1) > 0.35 ? '#141414' : '#ffffff'; // the second color, if it reads on the first
  const h = Math.round(width * 1.42), edge = '#8d8d8d';
  return (
    <div role="img" aria-label={year + ' ' + label + ': ' + (team.region ? team.region + ' ' + team.name : team.name)} style={{ position: 'relative', width, height: h, flex: 'none' }}>
      <svg viewBox="0 0 120 170" width={width} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden="true">
        <line x1="16" y1="-6" x2="16" y2="9" stroke={edge} strokeWidth="2" />
        <line x1="104" y1="-6" x2="104" y2="9" stroke={edge} strokeWidth="2" />
        <path d="M13 16 H107 V139 L60 165 L13 139 Z" fill={c1} stroke={edge} strokeWidth="3" strokeLinejoin="round" />
        <rect x="6" y="7" width="108" height="12" rx="6" fill={c1} stroke={edge} strokeWidth="3" />
      </svg>
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '15%', bottom: '19%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', color: ink, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: Math.round(width * 0.2), lineHeight: 1 }}>{year}</div>
        <TeamLogo team={team} size={Math.round(width * 0.46)} />
        <div style={{ fontSize: Math.max(10, Math.round(width * 0.085)), lineHeight: 1.1, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

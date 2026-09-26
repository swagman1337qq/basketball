// Team logos. Original crests for the league's fictional clubs, drawn in SVG in four
// classic styles: a soccer-style shield (banner, stripes, ribbon), an old-school roundel
// with the name wrapped around the ring, a 70s script wordmark over a basketball, and a
// varsity octagon badge with a sunburst. Each uses the club's colors and emblem (glyphs
// from Lucide, ISC license); small sizes drop the lettering so the mark stays legible.
import { useId } from 'react';
import { BrickWall, CableCar, Coffee, Dice5, Flag, Pickaxe, Sailboat, Shell, Skull, Speaker, TramFront, Umbrella, Anchor, Anvil, Award, Axe, Bird, Castle, Circle, CloudRainWind, Cog, Compass, Crown, Feather, Fish, Flame, Gem, Guitar, Hammer, Moon, Mountain, MountainSnow, Origami, Rainbow, Ship, Spade, Sparkles, Star, Sun, Sunset, TreeDeciduous, TreePalm, TreePine, Waves, Wind, type LucideIcon } from 'lucide-react';

const GLYPHS: Record<string, LucideIcon> = { BrickWall, CableCar, Coffee, Dice5, Flag, Pickaxe, Sailboat, Shell, Skull, Speaker, TramFront, Umbrella, Anchor, Anvil, Award, Axe, Bird, Castle, Circle, CloudRainWind, Cog, Compass, Crown, Feather, Fish, Flame, Gem, Guitar, Hammer, Moon, Mountain, MountainSnow, Origami, Rainbow, Ship, Spade, Sparkles, Star, Sun, Sunset, TreeDeciduous, TreePalm, TreePine, Waves, Wind };
export const LOGO_STYLES = ['shield', 'roundel', 'script', 'badge'] as const;
const BY_TEAM: Record<string, (typeof LOGO_STYLES)[number]> = {
  BAL: 'shield', HFD: 'shield', PRV: 'shield', CIN: 'shield', RAL: 'shield', CBS: 'shield', POR: 'shield', OAK: 'shield', TPA: 'shield', LOU: 'shield',
  BKN: 'roundel', NWK: 'roundel', DET: 'roundel', PIT: 'roundel', SEA: 'roundel', VAN: 'roundel', SAC: 'roundel', KC: 'roundel', STL: 'roundel', MEX: 'roundel',
  ATL: 'script', NSH: 'script', LV: 'script', SD: 'script', HNL: 'script', PHX: 'script', AUS: 'script', CHA: 'script',
  CLE: 'badge', SLC: 'badge', DEN: 'badge', ABQ: 'badge',
};

export interface CrestTeam { region?: string; name?: string; abbr?: string; colors?: [string, string]; icon?: string; logoImg?: string; logoStyle?: string }

const hash = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function shade(hex: string, f: number) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#161616'; const n = parseInt(m[1], 16); const c = (v: number) => Math.round(Math.max(0, Math.min(255, v * f))); return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }
const HEAD = "'Oswald', 'Arial Narrow', Impact, sans-serif", VARSITY = "'Graduate', 'Rockwell', serif", SCRIPT = "'Yellowtail', 'Brush Script MT', cursive";
const fit = (txt: string, per: number, max: number) => Math.min(max, txt.length * per);

function Ball({ cx, cy, r, color, op = 0.5, w = 1.6 }: { cx: number; cy: number; r: number; color: string; op?: number; w?: number }) {
  return (
    <g fill="none" stroke={color} strokeWidth={w} opacity={op} strokeLinecap="round">
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} /><line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
      <path d={`M${cx - r * 0.72} ${cy - r * 0.7} Q${cx - r * 0.28} ${cy} ${cx - r * 0.72} ${cy + r * 0.7}`} />
      <path d={`M${cx + r * 0.72} ${cy - r * 0.7} Q${cx + r * 0.28} ${cy} ${cx + r * 0.72} ${cy + r * 0.7}`} />
    </g>
  );
}
function StarShape({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; return (x + Math.cos(a) * rr).toFixed(2) + ',' + (y + Math.sin(a) * rr).toFixed(2); }).join(' ');
  return <polygon points={pts} fill={fill} />;
}

export function TeamLogo({ team, size = 20 }: { team: CrestTeam | undefined; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!team) return null;
  const label = (team.region ? team.region + ' ' + team.name : team.abbr) + ' logo';
  if (team.logoImg) return <img src={team.logoImg} alt={label} width={size} height={size} style={{ display: 'block', flex: 'none', borderRadius: '50%', objectFit: 'cover', background: (team.colors || ['#333'])[0] }} />;
  const Glyph = GLYPHS[team.icon || ''] || Circle;
  const [c1, c2] = team.colors || ['#605d5d', '#eae7e7'];
  const dk = shade(c1, 0.42), lt = shade(c2, 1.08);
  const key = team.abbr || team.name || 'X', h = hash(key);
  const style = (team.logoStyle as any) || BY_TEAM[key] || LOGO_STYLES[h % 4];
  const sm = size < 46, city = (team.region || '').toUpperCase(), nick = team.name || '', est = 1946 + (h % 58);
  const svg = (children: any) => <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label} style={{ display: 'block', flex: 'none', overflow: 'visible' }}>{children}</svg>;

  if (style === 'shield') {
    const shield = 'M50 3 L93 13 V48 C93 73 74 88 50 97 C26 88 7 73 7 48 V13 Z';
    const stripes = h % 3;
    return svg(<>
      <defs><clipPath id={'cs' + uid}><path d={shield} /></clipPath></defs>
      <path d={shield} fill={c1} stroke={dk} strokeWidth={sm ? 5 : 3.5} strokeLinejoin="round" />
      <g clipPath={`url(#cs${uid})`} opacity="0.22">
        {stripes === 0 && [20, 44, 68].map(x => <rect key={x} x={x} y="0" width="12" height="100" fill={c2} />)}
        {stripes === 1 && <path d="M0 42 L50 70 L100 42 V58 L50 86 L0 58 Z" fill={c2} />}
        {stripes === 2 && <path d="M-10 20 L110 100 V80 L-10 0 Z" fill={c2} />}
      </g>
      <path d="M50 10 L86 18.5 V48 C86 68 70 81 50 89 C30 81 14 68 14 48 V18.5 Z" fill="none" stroke={c2} strokeWidth={sm ? 2.5 : 1.4} />
      {!sm && <><path d="M14 18.5 L50 10 L86 18.5 V30 H14 Z" fill={c2} /><text x="50" y="27" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="8.5" fill={c1} textLength={fit(city, 5.4, 64)} lengthAdjust="spacingAndGlyphs" letterSpacing="1">{city}</text></>}
      <circle cx="50" cy={sm ? 50 : 50} r={sm ? 24 : 17} fill={dk} opacity="0.45" />
      <Ball cx={50} cy={50} r={sm ? 22 : 16} color={c2} op={0.35} w={sm ? 2.5 : 1.3} />
      <Glyph x={sm ? 27 : 33} y={sm ? 27 : 33} width={sm ? 46 : 34} height={sm ? 46 : 34} color={lt} strokeWidth={sm ? 2.8 : 2.2} />
      {!sm && <>
        <path d="M2 69 L16 65 H84 L98 69 L92 75.5 L98 82 L84 79 H16 L2 82 L8 75.5 Z" fill={c2} stroke={dk} strokeWidth="1.5" strokeLinejoin="round" />
        <text x="50" y="76.6" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="9.5" fill={c1} textLength={fit(nick.toUpperCase(), 6.2, 62)} lengthAdjust="spacingAndGlyphs" letterSpacing="0.8">{nick.toUpperCase()}</text>
        {[40, 50, 60].map((x, i) => <StarShape key={x} x={x} y={i === 1 ? 87 : 86} r={i === 1 ? 3 : 2.3} fill={c2} />)}
      </>}
    </>);
  }

  if (style === 'roundel') {
    return svg(<>
      <defs>
        <path id={'rt' + uid} d="M 15 50 A 35 35 0 0 1 85 50" />
        <path id={'rb' + uid} d="M 15.5 50 A 34.5 34.5 0 0 0 84.5 50" />
      </defs>
      <circle cx="50" cy="50" r="48" fill={dk} />
      <circle cx="50" cy="50" r="45" fill={c1} stroke={c2} strokeWidth={sm ? 3 : 1.6} />
      {!sm && <>
        <text fontFamily={HEAD} fontWeight="700" fontSize="11" fill={lt} letterSpacing="1.5"><textPath href={`#rt${uid}`} startOffset="50%" textAnchor="middle" textLength={fit(city, 6.5, 100)} lengthAdjust="spacingAndGlyphs">{city}</textPath></text>
        <text fontFamily={HEAD} fontWeight="700" fontSize="11" fill={lt} letterSpacing="1.5"><textPath href={`#rb${uid}`} startOffset="50%" textAnchor="middle" textLength={fit(nick.toUpperCase(), 6.5, 96)} lengthAdjust="spacingAndGlyphs" dominantBaseline="hanging">{nick.toUpperCase()}</textPath></text>
        <StarShape x={9.5} y={50} r={3.4} fill={c2} /><StarShape x={90.5} y={50} r={3.4} fill={c2} />
      </>}
      <circle cx="50" cy="50" r={sm ? 36 : 27} fill={c2} stroke={dk} strokeWidth={sm ? 3 : 2} />
      <Ball cx={50} cy={50} r={sm ? 34 : 25} color={c1} op={0.28} w={sm ? 2.6 : 1.6} />
      <Glyph x={sm ? 24 : 32} y={sm ? 24 : 32} width={sm ? 52 : 36} height={sm ? 52 : 36} color={dk} strokeWidth={sm ? 2.8 : 2.4} />
    </>);
  }

  if (style === 'script') {
    const w = nick.length;
    return svg(<>
      <circle cx="50" cy="48" r="44" fill={c1} stroke={dk} strokeWidth={sm ? 5 : 3} />
      <Ball cx={50} cy={48} r={42} color={c2} op={0.55} w={sm ? 3 : 2} />
      {sm ? (
        <text x="50" y="66" textAnchor="middle" fontFamily={SCRIPT} fontSize="58" fill={lt} stroke={dk} strokeWidth="5" style={{ paintOrder: 'stroke' }}>{nick[0]}</text>
      ) : <>
        <text x="50" y="21" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="8" fill={lt} letterSpacing="2" textLength={fit(city, 5.5, 52)} lengthAdjust="spacingAndGlyphs">{city}</text>
        <g transform="rotate(-9 50 56)">
          <text x="52.5" y="62.5" textAnchor="middle" fontFamily={SCRIPT} fontSize={w > 9 ? 22 : 29} fill={dk} textLength={fit(nick, w > 9 ? 9 : 11.5, 94)} lengthAdjust="spacingAndGlyphs">{nick}</text>
          <text x="50" y="60" textAnchor="middle" fontFamily={SCRIPT} fontSize={w > 9 ? 22 : 29} fill={lt} stroke={dk} strokeWidth="3.2" style={{ paintOrder: 'stroke' }} textLength={fit(nick, w > 9 ? 9 : 11.5, 94)} lengthAdjust="spacingAndGlyphs">{nick}</text>
          <path d="M14 70 Q48 62 88 67" fill="none" stroke={dk} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M14 70 Q48 62 88 67" fill="none" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <Glyph x={42} y={76} width={16} height={16} color={lt} strokeWidth={2.4} />
      </>}
    </>);
  }

  // Varsity badge: octagon, sunburst, emblem and plaque.
  const oct = (r: number) => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + (i * Math.PI) / 4; return (50 + Math.cos(a) * r).toFixed(2) + ',' + (50 + Math.sin(a) * r).toFixed(2); }).join(' ');
  return svg(<>
    <defs><clipPath id={'cb' + uid}><polygon points={oct(42)} /></clipPath></defs>
    <polygon points={oct(49)} fill={dk} />
    <polygon points={oct(45)} fill={c2} />
    <polygon points={oct(42)} fill={c1} />
    <g clipPath={`url(#cb${uid})`} opacity="0.2">
      {Array.from({ length: 16 }, (_, i) => { const a1 = (i * Math.PI) / 8, a2 = a1 + Math.PI / 16; return <polygon key={i} points={`50,${sm ? 50 : 44} ${50 + Math.cos(a1) * 80},${44 + Math.sin(a1) * 80} ${50 + Math.cos(a2) * 80},${44 + Math.sin(a2) * 80}`} fill={c2} />; })}
    </g>
    {!sm && <text x="50" y="19" textAnchor="middle" fontFamily={HEAD} fontWeight="600" fontSize="6.5" fill={c2} letterSpacing="1.5">EST · {est}</text>}
    <Glyph x={sm ? 24 : 32} y={sm ? 24 : 21} width={sm ? 52 : 36} height={sm ? 52 : 36} color={lt} strokeWidth={sm ? 3 : 2.4} />
    {!sm && <>
      <rect x="14" y="58" width="72" height="19" rx="3" fill={c2} stroke={dk} strokeWidth="2" />
      <text x="50" y="72.5" textAnchor="middle" fontFamily={VARSITY} fontSize="13" fill={c1} textLength={fit(nick.toUpperCase(), 8, 64)} lengthAdjust="spacingAndGlyphs">{nick.toUpperCase()}</text>
      <text x="50" y="85.5" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="6.5" fill={c2} letterSpacing="1.2" textLength={fit(city, 4.6, 44)} lengthAdjust="spacingAndGlyphs">{city}</text>
    </>}
  </>);
}

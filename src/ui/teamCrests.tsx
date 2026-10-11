// Hand-drawn crests for clubs with their own story (TeamLogo.tsx draws everyone else from templates).
//  - Iŋaliq Ivories (INL): Iŋaliq is the Iñupiaq name of Little Diomede, Alaska, in the Bering Strait,
//    known for its walrus-ivory carving. A walrus head carved in ivory, with the fine incised lines and
//    dots of Iñupiat engraving, on an Arctic night sky with the aurora; the two Diomede islands sit on
//    the horizon either side of the strait. Navy, ivory and aurora teal.
//  - Wazíbló Dragoons (WAZ): Wazíbló is Pine Ridge, home of the Oglala Lakota. A dragoon (a mounted
//    rider) at full gallop over the eight-pointed morning star of the Lakota star quilt, above a ridge
//    of pines. Red, gold, black and white, the colors of the four directions. No headdress, weapon or
//    caricature: the horse culture and the star quilt carry it.
//  - Portland Pines (POR): three snow-dusted Douglas firs (Oregon's state tree) in front of Mount Hood,
//    lit on one face, on a cool Pacific Northwest sky with a passing cloud. In the club's colors.
// Small sizes drop the lettering and the scenery so the mark stays legible.
import type { ReactNode } from 'react';
import { MARKS } from './teamMarks';
import { EAST_MARKS } from './expansionMarksEast';
import { WEST_MARKS } from './expansionMarksWest';
import type { Pal } from './markKit';
import { LOUD_COLORS as DEFAULT_PAL } from '../data/palette';

const IV = { navy: '#0b2545', ivory: '#f1e9d2', teal: '#2ec4b6', green: '#7be495', line: '#9c8a63', deep: '#081b33', sea: '#0d3157' };
const DR = { red: '#c8102e', gold: '#ffc72c', black: '#141414', white: '#fbf7ee' };
const PN = { green: '#1f9d55', deep: '#0b4a2a', snow: '#f2e8cf', sky: '#8fd0ea', sky2: '#d9f0f7', rock: '#4f6d7a' };
const mix = (a: string, b: string, t: number) => { const h = (x: string) => { const n = parseInt(x.replace('#', ''), 16) || 0; return [n >> 16, (n >> 8) & 255, n & 255]; }, A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const HEAD = "'Oswald', 'Arial Narrow', Impact, sans-serif";

// A fir: four stacked tiers, each drooping at the edges, `h` tall, standing at (x, y).
const fir = (x: number, y: number, h: number) => {
  const w = h * 0.52, tiers: [number, number, number][] = [[1, 0.7, 0.46], [0.84, 0.5, 0.66], [0.66, 0.28, 0.84], [0.46, 0.08, 1]];
  return tiers.map(([top, bot, k]) => `M${x} ${(y - h * top).toFixed(2)} L${(x + w * k).toFixed(2)} ${(y - h * bot).toFixed(2)} Q${x} ${(y - h * bot - h * 0.1).toFixed(2)} ${(x - w * k).toFixed(2)} ${(y - h * bot).toFixed(2)} Z`).join(' ') + ` M${(x - h * 0.05).toFixed(2)} ${(y - h * 0.1).toFixed(2)} H${(x + h * 0.05).toFixed(2)} V${y} H${(x - h * 0.05).toFixed(2)} Z`;
};
// Snow along the drooping edge of each tier.
const firSnow = (x: number, y: number, h: number) => {
  const w = h * 0.52, tiers: [number, number][] = [[0.7, 0.46], [0.5, 0.66], [0.28, 0.84], [0.08, 1]];
  return tiers.map(([bot, k]) => `M${(x + w * k * 0.94).toFixed(2)} ${(y - h * bot - h * 0.02).toFixed(2)} Q${x} ${(y - h * bot - h * 0.12).toFixed(2)} ${(x - w * k * 0.94).toFixed(2)} ${(y - h * bot - h * 0.02).toFixed(2)}`).join(' ');
};

function pines(uid: string, sm: boolean, c?: Pal) {
  const green = c?.[0] || PN.green, snow = c?.[1] || PN.snow, deep = mix(green, '#000000', 0.55), { sky, sky2, rock } = PN, rockD = mix(rock, '#000000', 0.3), rockL = mix(rock, '#ffffff', 0.2);
  if (sm) return (<>
    <circle cx="50" cy="50" r="48.5" fill={green} stroke={deep} strokeWidth="3" />
    <path d="M14 70 L38 36 L48 48 L62 26 L88 70 Z" fill={rockL} opacity=".7" />
    <path d="M55 37 L62 26 L69.4 38 L65 36 L61.6 40.6 L58.6 36.4 Z" fill={snow} />
    <path d={fir(50, 88, 66)} fill={snow} stroke={deep} strokeWidth="2.6" strokeLinejoin="round" />
  </>);
  return (<>
    <defs>
      <linearGradient id={'pns' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sky} /><stop offset="1" stopColor={sky2} /></linearGradient>
      <clipPath id={'pnc' + uid}><circle cx="50" cy="50" r="33.6" /></clipPath>
      <path id={'pnu' + uid} d="M12.2 50 A37.8 37.8 0 0 1 87.8 50" fill="none" />
      <path id={'pnd' + uid} d="M6.4 50 A43.6 43.6 0 0 0 93.6 50" fill="none" />
    </defs>
    <circle cx="50" cy="50" r="49.3" fill="#1b1a21" />
    <circle cx="50" cy="50" r="47.3" fill={green} />
    <circle cx="50" cy="50" r="45.6" fill="none" stroke={snow} strokeWidth=".7" opacity=".55" />
    <text fontFamily={HEAD} fontWeight="700" fontSize="8.2" fill={snow} letterSpacing="1.3"><textPath href={`#pnu${uid}`} startOffset="50%" textAnchor="middle">PORTLAND</textPath></text>
    <text fontFamily={HEAD} fontWeight="700" fontSize="8.2" fill={snow} letterSpacing="1.3"><textPath href={`#pnd${uid}`} startOffset="50%" textAnchor="middle">PINES</textPath></text>
    {[8.4, 91.6].map(x => <circle key={x} cx={x} cy="50" r="1.6" fill={snow} />)}
    <circle cx="50" cy="50" r="35.3" fill="#1b1a21" />
    <g clipPath={`url(#pnc${uid})`}>
      <circle cx="50" cy="50" r="33.6" fill={`url(#pns${uid})`} />
      <path d="M22 34 C22 30 26 28 29 30 C30 26 36 25 38 29 C41 28 44 30 43 33 Z" fill="#ffffff" opacity=".8" />
      {/* Mount Hood: the lit face, the shadowed face and its snowfield. */}
      <path d="M8 72 L30 54 L38 59 L56 30 L74 55 L82 51 L96 72 Z" fill={rock} />
      <path d="M56 30 L74 55 L82 51 L96 72 L62 72 L60 56 Z" fill={rockD} />
      <path d="M49.6 40.4 L56 30 L63.4 40.6 L59.4 38.6 L56.6 42.4 L53.2 38.4 Z" fill={snow} />
      <path d="M38 59 L42 52.6 L45 56 Z" fill={rockL} opacity=".7" />
      <path d="M0 73 Q25 65 50 71 T100 69 V100 H0 Z" fill={deep} />
      <path d={fir(30, 81, 28)} fill={green} stroke={deep} strokeWidth=".8" strokeLinejoin="round" />
      <path d={fir(70, 81, 28)} fill={green} stroke={deep} strokeWidth=".8" strokeLinejoin="round" />
      <path d={fir(50, 84, 42)} fill={green} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
      <path d={firSnow(30, 81, 28) + ' ' + firSnow(70, 81, 28) + ' ' + firSnow(50, 84, 42)} fill="none" stroke={snow} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </>);
}

function ivories(uid: string, sm: boolean) {
  const { navy, ivory, teal, green, line, deep, sea } = IV, r = sm ? 47 : 39;
  const pores: [number, number][] = [[39, 51.4], [42, 50.4], [45, 51.4], [38.6, 54.6], [41.6, 54], [44.6, 54.6], [40, 57.6], [43, 57.6], [61, 51.4], [58, 50.4], [55, 51.4], [61.4, 54.6], [58.4, 54], [55.4, 54.6], [60, 57.6], [57, 57.6]];
  return (<>
    <defs>
      <radialGradient id={'ivs' + uid} cx="50%" cy="30%" r="75%"><stop offset="0" stopColor="#16406e" /><stop offset="1" stopColor={navy} /></radialGradient>
      <linearGradient id={'iva' + uid} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={teal} stopOpacity="0" /><stop offset=".3" stopColor={teal} stopOpacity=".75" /><stop offset=".65" stopColor={green} stopOpacity=".6" /><stop offset="1" stopColor={green} stopOpacity="0" /></linearGradient>
      <linearGradient id={'ivt' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fffaf0" /><stop offset="1" stopColor="#e6dbc0" /></linearGradient>
      <clipPath id={'ivc' + uid}><circle cx="50" cy="50" r={r} /></clipPath>
      <path id={'ivu' + uid} d="M19 50 A31 31 0 0 1 81 50" fill="none" />
      <path id={'ivd' + uid} d="M16 52 A34 34 0 0 0 84 52" fill="none" />
    </defs>
    <circle cx="50" cy="50" r="49" fill={navy} stroke={ivory} strokeWidth={sm ? 2.5 : 1.6} />
    {!sm && <circle cx="50" cy="50" r="40.5" fill="none" stroke={teal} strokeWidth="1" />}
    <g clipPath={`url(#ivc${uid})`}>
      <circle cx="50" cy="50" r="48" fill={`url(#ivs${uid})`} />
      <path d="M2 34 C20 22 34 30 50 24 C66 18 80 26 98 18 L98 26 C80 34 66 26 50 32 C34 38 20 30 2 42 Z" fill={`url(#iva${uid})`} />
      {!sm && <><path d="M6 67 C10 58 16 56 22 61 L25 67 Z" fill={deep} /><path d="M74 67 C79 55 89 54 96 62 L98 67 Z" fill={deep} /></>}
      <rect x="0" y="66" width="100" height="40" fill={sea} />
      <path d="M0 72 Q12 69 24 72 T48 72 T72 72 T100 72" fill="none" stroke={ivory} strokeOpacity=".45" strokeWidth="1.2" />
      {!sm && <path d="M0 79 Q12 76 24 79 T48 79 T72 79 T100 79" fill="none" stroke={ivory} strokeOpacity=".3" strokeWidth="1.2" />}
      {/* The walrus, carved in ivory: head, incised brow line with dots, eyes, tusks, whisker pads. */}
      <path d="M30.5 47 C30.5 33 39.5 26 50 26 C60.5 26 69.5 33 69.5 47 C69.5 53 66.5 57 61 59 L39 59 C33.5 57 30.5 53 30.5 47 Z" fill={ivory} stroke={navy} strokeWidth="1.2" />
      {!sm && <><path d="M37 34.6 Q50 28.6 63 34.6" fill="none" stroke={line} strokeWidth=".9" />
        {[38.5, 42, 45.8, 50, 54.2, 58, 61.5].map((x, i) => <circle key={x} cx={x} cy={36.9 - Math.sin((i / 6) * Math.PI) * 4.2} r=".8" fill={line} />)}
        <path d="M33.6 44 Q35 49 38 52" fill="none" stroke={line} strokeWidth=".8" /><path d="M66.4 44 Q65 49 62 52" fill="none" stroke={line} strokeWidth=".8" /></>}
      <circle cx="42" cy="41.2" r={sm ? 2.6 : 2.1} fill={navy} /><circle cx="58" cy="41.2" r={sm ? 2.6 : 2.1} fill={navy} />
      <path d="M58.5 59.5 C59.5 70 60.5 79 62 89 C57.8 85 55 74 53.4 60.5 Z" fill={`url(#ivt${uid})`} stroke={navy} strokeWidth={sm ? 1.6 : 1.1} strokeLinejoin="round" />
      <path d="M41.5 59.5 C40.5 70 39.5 79 38 89 C42.2 85 45 74 46.6 60.5 Z" fill={`url(#ivt${uid})`} stroke={navy} strokeWidth={sm ? 1.6 : 1.1} strokeLinejoin="round" />
      <circle cx="43.2" cy="53.5" r="8.4" fill="#f7f1e1" stroke={navy} strokeWidth={sm ? 1.5 : 1.1} />
      <circle cx="56.8" cy="53.5" r="8.4" fill="#f7f1e1" stroke={navy} strokeWidth={sm ? 1.5 : 1.1} />
      <path d="M50 47.5 L50 55" stroke={navy} strokeWidth="1.1" />
      {!sm && pores.map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r=".75" fill={line} />)}
    </g>
    {!sm && <>
      <text fontFamily={HEAD} fontWeight="700" fontSize="8.6" fill={ivory} letterSpacing="2.2" textAnchor="middle"><textPath href={'#ivu' + uid} startOffset="50%">IŊALIQ</textPath></text>
      <text fontFamily={HEAD} fontWeight="700" fontSize="8.6" fill={ivory} letterSpacing="2.2" textAnchor="middle"><textPath href={'#ivd' + uid} startOffset="50%">IVORIES</textPath></text>
    </>}
  </>);
}

// The eight points of the morning star, each a long diamond in bands of color (the star quilt).
function starQuilt(sm: boolean) {
  const { red, gold, black, white } = DR, band = [white, gold, red, black, red, gold], out: ReactNode[] = [];
  const L = sm ? 46 : 40, W = sm ? 8.6 : 7.4, n = band.length, w = (t: number) => (t < 0.5 ? t * 2 : (1 - t) * 2) * W;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a);
    const p = (t: number, s: number) => (50 + dx * L * t - dy * s * w(t)).toFixed(2) + ',' + (50 + dy * L * t + dx * s * w(t)).toFixed(2);
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; out.push(<polygon key={k + '-' + i} points={[p(t0, -1), p(t1, -1), p(t1, 1), p(t0, 1)].join(' ')} fill={band[i]} stroke={black} strokeWidth=".35" />); }
  }
  return out;
}
const HORSE = 'M27 52 C31 46 41 44.5 50 45 C56 45.3 61 43 64.5 38.5 C67 35 69.5 30.5 72.5 27.5 L73.6 23.6 L75.8 26.6 C79 27 82.4 30.2 85 34.2 C85.8 35.6 85.2 37 83.6 36.9 C81.4 36.7 79.3 36 77.4 36.6 C75.6 39.6 73.8 43.6 72.6 47.4 C74.8 50.4 78.6 53.6 83.2 55.6 L85.6 55.2 L85.2 58.4 C79.6 58.2 74.6 56.2 70.4 53.2 C70.8 56.6 72.6 61 75.4 64.6 L77.6 65.4 L75.4 67.8 C71 64.6 67.6 60 66 55.6 C59 58 49 58.4 41.6 56.6 C38.6 59.6 33.6 62.6 27.2 64.4 L25.2 66.6 L24 63.8 C29 61.4 33 58.6 35.4 55.4 C33.6 58.8 31.4 63.6 30.6 68.6 L28.4 70.4 L27.8 67.2 C28.2 62 29.6 57.4 31.6 54.2 C26.4 55 20.6 54.4 15.2 51.2 C20.4 50.6 24.2 50.8 27 52 Z';
const RIDER = 'M52.6 45.4 C53.4 40.6 55.6 36.2 59 33.2 C60.2 32.2 61.8 31.6 63.2 32 C64.4 32.6 64.6 34 63.8 35 C65.6 35.4 67.8 35.8 70 36.2 L70.2 38.4 C67.2 38.6 64.4 38.6 61.8 38.8 C60.4 40.8 59.6 43 59.4 45.6 Z';
function dragoons(uid: string, sm: boolean) {
  const { red, gold, black, white } = DR, shield = 'M50 3 L92 14 V46 C92 72 74 88 50 97 C26 88 8 72 8 46 V14 Z', sw = sm ? 2.4 : 1.6;
  return (<>
    <defs><clipPath id={'drc' + uid}><path d={shield} /></clipPath></defs>
    {sm ? <circle cx="50" cy="50" r="49" fill={red} stroke={black} strokeWidth="2.5" /> : <path d={shield} fill={red} stroke={black} strokeWidth="2.6" strokeLinejoin="round" />}
    <g clipPath={sm ? undefined : `url(#drc${uid})`}>
      <g transform={sm ? undefined : 'translate(0 -1)'}>{starQuilt(sm)}</g>
      <circle cx="50" cy={sm ? 50 : 49} r={sm ? 6 : 5} fill={gold} stroke={black} strokeWidth=".6" />
      {!sm && <path d="M8 82 L14 74 L16 77 L20 70 L24 76 L27 72 L31 78 L36 73 L41 80 L47 76 L52 81 L58 75 L62 79 L67 72 L71 78 L75 74 L80 80 L84 75 L88 79 L92 76 L92 100 L8 100 Z" fill={black} />}
    </g>
    <g transform={sm ? 'translate(-1 1)' : 'translate(-0.5 -2)'}>
      <path d={HORSE} fill={black} stroke={white} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke" />
      <path d={RIDER} fill={black} stroke={white} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke" />
      <circle cx="61.4" cy="28.6" r="3.2" fill={black} stroke={white} strokeWidth={sm ? 2 : 1.4} paintOrder="stroke" />
    </g>
    {!sm && <>
      <path d="M10 84 L22 80 H78 L90 84 L84 90 L90 96 L78 92 H22 L10 96 L16 90 Z" fill={gold} stroke={black} strokeWidth="1.4" strokeLinejoin="round" />
      <text x="50" y="89.4" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="8.6" fill={black} letterSpacing="1.4">DRAGOONS</text>
      <rect x="26" y="8.5" width="48" height="10" rx="2" fill={black} />
      <text x="50" y="16.3" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="7.2" fill={gold} letterSpacing="1.6">WAZÍBLÓ</text>
    </>}
  </>);
}

// abbr → crest contents for a 100×100 viewBox (uid keeps gradient ids unique on a page; the club's
// colors for the logos drawn in them, teamMarks.tsx).
// League clubs (teamMarks.tsx) and the expansion franchises (expansionMarksEast/West.tsx).
const ALL_MARKS = { ...MARKS, ...EAST_MARKS, ...WEST_MARKS };
export const CRESTS: Record<string, (uid: string, sm: boolean, c?: Pal) => ReactNode> = {
  INL: ivories, WAZ: dragoons, POR: (uid: string, sm: boolean, c?: Pal) => pines(uid, sm, c && c.length >= 2 ? c : DEFAULT_PAL.POR),
  ...Object.fromEntries(Object.entries(ALL_MARKS).map(([k, m]) => [k, (uid: string, sm: boolean, c?: Pal) => m.draw(uid, sm, c && c.length >= 2 ? c : DEFAULT_PAL[k])])),
};
// The nickname each crest belongs to: a club renamed in the League editor falls back to the templates.
export const CREST_NAMES: Record<string, string> = { INL: 'Ivories', WAZ: 'Dragoons', POR: 'Pines', ...Object.fromEntries(Object.entries(ALL_MARKS).map(([k, m]) => [k, m.name])) };

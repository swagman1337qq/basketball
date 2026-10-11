// Hand-drawn logos for the expansion franchises in the West (data/franchises.ts): a mascot for each
// nickname, set in a layout of its own with the city and nickname (markKit.tsx).
//  - Phoenix Chill: an ice pop in sunglasses against the desert sun.     - Sacramento Wombats: a wombat in a Gold Rush miner's helmet.
//  - Kansas City Sailors: a sailboat on the river.                       - Inland Empire Groves: an orange tree over the groves.
//  - San Francisco Fog: a Golden Gate tower over a sleepy fog bank.      - Salt Lake Gulls: a California gull over the lake.
//  - Oklahoma City Twisters: a tornado and its lightning.                - Tulsa Gushers: an oil derrick blowing a gusher.
//  - Tucson Stargazers: a telescope under the desert stars.              - Fresno Harvesters: a grape bunch and its vine leaf.
//  - Calgary Stampede: a white cowboy hat on a rodeo belt buckle.        - Edmonton Roughnecks: a hard hat over crossed wrenches.
//  - Mexico City Águilas: a golden eagle's head.                         - Guadalajara Mariachis: a charro sombrero, guitar and trumpet.
//  - Monterrey Montañeses: Cerro de la Silla with the sun in its saddle. - Tijuana Fronterizos: the city's arch and its clock.
//  - Omaha Stockyards: a Hereford bull with a nose ring, snorting.       - Honolulu Waves: a curling wave and a surfboard.
//  - Albuquerque Roadrunners: a roadrunner at full tilt.
import type { ReactNode } from 'react';
import { Arch, Diamond, Disc, dk, f2, fluff, Hexagon, INK, Line2, lt, mirror, mix, Octagon, PAPER, Patch, Pennant, place, Ribbon, Ring, Script, Seal, Shield, sparkle, star5, STEEL, STEEL_D, STEEL_L, Sunburst, Tag, Txt, Varsity, WOOD, Wordmark, type Pal } from './markKit';

const LEAF = '#2f7d43', BARK = '#5b3d26', SAGUARO = '#2d6a4f';
const saguaro = (x: number, y: number, h: number, k: string | number) => <g key={k}>
  <Line2 d={`M${x} ${y} V${y - h}`} c={SAGUARO} w={h * 0.2} o={1.4} />
  <Line2 d={`M${x} ${f2(y - h * 0.42)} H${f2(x - h * 0.28)} V${f2(y - h * 0.72)}`} c={SAGUARO} w={h * 0.14} o={1.2} />
  <Line2 d={`M${x} ${f2(y - h * 0.56)} H${f2(x + h * 0.26)} V${f2(y - h * 0.84)}`} c={SAGUARO} w={h * 0.14} o={1.2} />
</g>;

// ── Phoenix Chill
function popArt(c: Pal, sm: boolean) {
  const ice = c[1], sw = sm ? 2.6 : 1.8;
  const BODY = 'M30 72 V30 C30 18 38 12 50 12 C52 16 56 18 60 17 C61 21 64 24 68 24 C69.4 26 70 28 70 30 V72 C70 75 68 77 65 77 H35 C32 77 30 75 30 72 Z';
  return (<>
    <rect x="45.6" y="68" width="8.8" height="27" rx="4" fill="#e9c48a" stroke={INK} strokeWidth={sw} />
    {!sm && <path d="M48 76 V90" stroke="#c9a46a" strokeWidth="1.2" />}
    <path d={BODY} fill={ice} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30.9 56 C40 52 60 60 69.1 55 V72 C69.1 74.6 67.6 76.1 65 76.1 H35 C32.4 76.1 30.9 74.6 30.9 72 Z" fill={lt(ice, 0.45)} />
    <path d="M35.6 26 V64" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity=".55" />
    <path d="M33 76 C33 82 34.6 85 36.4 85 C38.2 85 39.4 82 39.4 76 Z M60 76 C60 84 61.6 88 63.4 88 C65.2 88 66.6 84 66.6 76 Z" fill={ice} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M63.4 92 C61.8 94.6 61.6 96.4 63.4 97 C65.2 96.4 65 94.6 63.4 92 Z" fill={ice} stroke={INK} strokeWidth="1" />
    <path d="M32 36 H68" stroke={INK} strokeWidth={sm ? 2.6 : 2} />
    <path d="M33 36 H48 V41 C48 45 45 47 40.6 47 C36 47 33 45 33 41 Z M52 36 H67 V41 C67 45 64 47 59.4 47 C55 47 52 45 52 41 Z" fill={INK} />
    {!sm && <path d="M36 38.6 L40 38.6 M55 38.6 L59 38.6" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />}
    <path d="M42 53 Q50 59 58 53" fill="none" stroke={INK} strokeWidth={sm ? 2.4 : 1.8} strokeLinecap="round" />
    {!sm && [[24, 20], [76, 40], [22, 52]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 2.6)} fill="#ffffff" stroke={INK} strokeWidth=".5" />)}
  </>);
}
function chill(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(popArt(c, true), 50, 50, 0.94));
  return Wordmark({ uid, k: 'px', c: [c[0], c[1]], city: 'PHOENIX', nick: 'CHILL', bg: lt(c[0], 0.42) }, popArt(c, false), <>
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, w = Math.PI / 12; return <path key={i} d={`M50 40 L${f2(50 + Math.cos(a - w / 2) * 50)} ${f2(40 + Math.sin(a - w / 2) * 50)} L${f2(50 + Math.cos(a + w / 2) * 50)} ${f2(40 + Math.sin(a + w / 2) * 50)} Z`} fill={lt(c[0], 0.62)} />; })}
    <circle cx="50" cy="40" r="17" fill="#ffd166" />
    <path d="M0 54 C30 49 70 49 100 54 V100 H0 Z" fill={dk(c[0], 0.08)} />
    {saguaro(28, 60, 18, 'a')}{saguaro(76, 62, 15, 'b')}
  </>, { artY: 38, artS: 0.56, size: 22 });
}

// ── Sacramento Wombats
function wombatArt(c: Pal, sm: boolean) {
  const fur = '#8a6a4f', furD = '#6b4f3a', muz = '#b89474', sw = sm ? 2.6 : 1.8, hat = c[1];
  return (<>
    {!sm && <><Line2 d="M14 92 L84 24" c={WOOD} w={3} o={2} /><path d="M74 16 C82 18 90 26 92 34 L86 30 C84 26 80 23 76 22 Z" fill={STEEL} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" /><path d="M78 20 C72 14 64 12 58 14 L64 18 C68 18 72 20 74 22 Z" fill={STEEL} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" /></>}
    <ellipse cx="22" cy="46" rx="7" ry="8.4" transform="rotate(-24 22 46)" fill={fur} stroke={INK} strokeWidth={sw} />
    <ellipse cx="78" cy="46" rx="7" ry="8.4" transform="rotate(24 78 46)" fill={fur} stroke={INK} strokeWidth={sw} />
    <path d="M18 58 C18 44 30 38 50 38 C70 38 82 44 82 58 C82 76 68 88 50 88 C32 88 18 76 18 58 Z" fill={fur} stroke={INK} strokeWidth={sw} />
    {!sm && <path d="M24 62 C24 72 30 80 38 84 M76 62 C76 72 70 80 62 84" fill="none" stroke={furD} strokeWidth="1.4" />}
    <ellipse cx="50" cy="70" rx="17" ry="13" fill={muz} />
    <circle cx="38" cy="56" r={sm ? 3 : 2.6} fill={INK} /><circle cx="62" cy="56" r={sm ? 3 : 2.6} fill={INK} />
    {!sm && <><circle cx="38.9" cy="55.1" r=".8" fill="#ffffff" /><circle cx="62.9" cy="55.1" r=".8" fill="#ffffff" /></>}
    <path d="M39 65 C39 59.6 61 59.6 61 65 C61 71 56 73.6 50 73.6 C44 73.6 39 71 39 65 Z" fill={INK} />
    <path d="M43 63 C45 61.6 48 61.4 50 61.6" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
    <path d="M44 79 Q50 82.4 56 79" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M22 42 C22 22 34 14 50 14 C66 14 78 22 78 42 Z" fill={hat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M47 14.6 C46 24 46 34 47 42 M53 14.6 C54 24 54 34 53 42" fill="none" stroke={dk(hat, 0.25)} strokeWidth="1.2" />
    <path d="M30 24 C33 19 38 17 43 16.6" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity=".5" />
    <path d="M14 43 C14 38 86 38 86 43 C86 47.6 14 47.6 14 43 Z" fill={dk(hat, 0.15)} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="50" cy="28" r="7" fill={STEEL_L} stroke={INK} strokeWidth="1.4" />
    <circle cx="50" cy="28" r="4.6" fill="#fff3b0" stroke={INK} strokeWidth=".9" />
    {!sm && [-150, -120, -90, -60, -30].map(a => { const r = (a * Math.PI) / 180; return <path key={a} d={`M${f2(50 + Math.cos(r) * 9.4)} ${f2(28 + Math.sin(r) * 9.4)} L${f2(50 + Math.cos(r) * 14)} ${f2(28 + Math.sin(r) * 14)}`} stroke="#fff3b0" strokeWidth="1.6" strokeLinecap="round" />; })}
  </>);
}
function wombats(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(wombatArt(c, true), 50, 50, 0.98));
  return Varsity({ uid, k: 'sc', c: [c[0], c[1]], city: 'SACRAMENTO', nick: 'WOMBATS' }, wombatArt(c, false), <>
    <path d="M0 76 L16 66 L28 72 L44 60 L58 70 L72 62 L100 74 V100 H0 Z" fill={lt(c[0], 0.14)} />
    {[[18, 80], [30, 84], [70, 82], [82, 78]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l2.4 -2 l2.6 1 l.6 2.6 l-2.6 1.4 l-2.6 -.8 Z`} fill={c[1]} stroke={INK} strokeWidth=".6" />)}
  </>, { artY: 59, artS: 0.46 });
}

// ── Kansas City Sailors
function sailboatArt(c: Pal, sm: boolean) {
  const sail = PAPER, sw = sm ? 2.6 : 1.8, hull = c[1];
  return (<>
    <rect x="48.8" y="8" width="2.6" height="64" fill={WOOD} stroke={INK} strokeWidth="1" />
    <path d="M51 10.4 L61 13.2 L51 16 Z" fill={hull} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    <path d="M53 16 C64 28 72 46 76 68 L53 68 Z" fill={sail} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M53.8 55 L73.4 55 L75 67.2 L53.8 67.2 Z" fill={hull} />
    <path d="M53 16 C64 28 72 46 76 68 L53 68 Z" fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M54 34 C60 36 64 40 66 46 M54 44 C61 46 66 50 69 56" fill="none" stroke="#d9d2c3" strokeWidth="1" />}
    <path d="M47 20 C40 32 32 50 26 66 L47 66 Z" fill={sail} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M46.2 54 L31 54 L27.2 65.2 L46.2 65.2 Z" fill={c[0]} />
    <path d="M47 20 C40 32 32 50 26 66 L47 66 Z" fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M12 71 L88 71 C84 81 76 86 66 86 L32 86 C23 86 16 81 12 71 Z" fill={hull} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M16 76 H84" stroke={PAPER} strokeWidth="1.8" />
    {!sm && [34, 44, 54, 64].map(x => <circle key={x} cx={x} cy="80.6" r="1.8" fill={PAPER} stroke={INK} strokeWidth=".7" />)}
    {!sm && <path d="M2 92 Q12 88 22 92 T42 92 T62 92 T82 92 T102 92" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />}
  </>);
}
function sailors(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(sailboatArt(c, true), 50, 50, 0.94));
  return Diamond({ uid, k: 'kc', c: [c[0], c[1]], city: 'KANSAS CITY', nick: 'SAILORS', bg: lt(c[0], 0.6) }, sailboatArt(c, false), <>
    <circle cx="72" cy="36" r="6" fill="#ffd166" />
    <path d="M0 62 Q12 59 25 62 T50 62 T75 62 T100 62 V100 H0 Z" fill={c[0]} />
  </>, { artY: 47, artS: 0.5 });
}

// ── Inland Empire Groves
function orangeTreeArt(c: Pal, sm: boolean) {
  const leaf = LEAF, sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && <ellipse cx="50" cy="93" rx="22" ry="3.4" fill={dk(leaf, 0.3)} opacity=".6" />}
    <path d="M45.6 93 L47 68 C44 62 38 59 33 57 L35 54.6 C40.6 56.6 44.6 59 47.6 62 L48.6 50 L51.4 50 L52.4 62 C55.4 59 59.4 56.6 65 54.6 L67 57 C62 59 56 62 53 68 L54.4 93 Z" fill={BARK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <path d={fluff(50, 36, 33, 14, 0.12)} fill={leaf} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d={fluff(44, 30, 18, 9, 0.16)} fill={lt(leaf, 0.18)} />}
    {[[34, 30], [50, 18], [64, 26], [42, 46], [60, 46], [72, 40], [28, 44], [52, 34]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={sm ? 5.2 : 4.4} fill={c[1]} stroke={INK} strokeWidth="1.1" />{!sm && <circle cx={x - 1.3} cy={y - 1.3} r="1.2" fill="#ffffff" opacity=".6" />}</g>)}
  </>);
}
function groves(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(lt(c[1], 0.55), place(orangeTreeArt(c, true), 50, 48, 0.96));
  return Patch({ uid, k: 'ie', c: [c[0], c[1]], city: 'INLAND EMPIRE', nick: 'Groves' }, orangeTreeArt(c, false), <>
    <path d="M0 52 L18 40 L30 46 L46 34 L62 44 L76 36 L100 48 V60 H0 Z" fill={lt(c[0], 0.3)} />
    {[8, 22, 36, 64, 78, 92].map((x, i) => <circle key={x} cx={x} cy={58 + (i % 2) * 2} r="4.4" fill={dk(c[0], 0.2)} />)}
  </>, { artY: 33, artS: 0.56 });
}

// ── San Francisco Fog
function fogArt(c: Pal, sm: boolean) {
  const steel = c[0], steelD = dk(c[0], 0.3), fog = '#f4f6f8', sw = sm ? 2.4 : 1.6;
  return (<>
    <path d="M0 40 Q24 52 40.6 13 M100 40 Q76 52 59.4 13" fill="none" stroke={INK} strokeWidth={sm ? 3.4 : 2.6} />
    <path d="M0 40 Q24 52 40.6 13 M100 40 Q76 52 59.4 13" fill="none" stroke={steel} strokeWidth={sm ? 1.8 : 1.3} />
    {!sm && [8, 16, 24, 32, 68, 76, 84, 92].map(x => { const t = x < 50 ? x / 40.6 : (100 - x) / 40.6, y = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 52 + t * t * 13; return <path key={x} d={`M${x} ${f2(y)} V58`} stroke={steel} strokeWidth=".8" />; })}
    <rect x="0" y="57" width="100" height="4.4" fill={steelD} stroke={INK} strokeWidth="1.2" />
    {[38.6, 55.4].map(x => <g key={x}><path d={`M${x} 92 L${x + 0.6} 12 H${x + 5.4} L${x + 6} 92 Z`} fill={steel} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={`M${x + 4} 14 V90`} stroke={steelD} strokeWidth="1.4" /></g>)}
    {[16, 30, 44].map(y => <rect key={y} x="39.6" y={y} width="20.8" height="4" fill={steel} stroke={INK} strokeWidth="1.2" />)}
    <path d="M44.6 34 V44 C44.6 41 55.4 41 55.4 44 V34 Z" fill={steelD} opacity=".7" />
    <path d="M39 12 H45 M55 12 H61" stroke={INK} strokeWidth="2" />
    {[[18, 74, 12], [34, 68, 13], [52, 66, 14], [70, 68, 13], [86, 74, 11], [28, 82, 11], [50, 82, 13], [72, 82, 11]].map(([x, y, r], i) => <circle key={'o' + i} cx={x} cy={y} r={r + 1.6} fill={INK} />)}
    {[[18, 74, 12], [34, 68, 13], [52, 66, 14], [70, 68, 13], [86, 74, 11], [28, 82, 11], [50, 82, 13], [72, 82, 11]].map(([x, y, r], i) => <circle key={'f' + i} cx={x} cy={y} r={r} fill={fog} />)}
    {!sm && <path d="M24 70 C30 64 40 62 46 64 M60 64 C66 62 74 64 78 68" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />}
    <path d="M38 74 Q42 77 46 74 M54 74 Q58 77 62 74" fill="none" stroke={INK} strokeWidth={sm ? 2.4 : 1.7} strokeLinecap="round" />
    <path d="M45 82 Q50 85 55 82" fill="none" stroke={INK} strokeWidth={sm ? 2.2 : 1.5} strokeLinecap="round" />
    {!sm && <><ellipse cx="35" cy="80" rx="3" ry="1.8" fill="#f4a6b4" opacity=".7" /><ellipse cx="65" cy="80" rx="3" ry="1.8" fill="#f4a6b4" opacity=".7" /></>}
  </>);
}
function fog(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc('#9fd3ec', place(fogArt(c, true), 50, 50, 0.94));
  return Script({ uid, k: 'sf', c: [c[1], c[0]], city: 'SAN FRANCISCO', nick: 'Fog', bg: '#9fd3ec' }, fogArt(c, false), <>
    <path d="M0 62 H100 V100 H0 Z" fill="#2b6f9e" />
  </>, { artY: 42, artS: 0.6, swash: c[0] });
}

// ── Salt Lake Gulls
function gullArt(c: Pal, sm: boolean) {
  const white = '#fbfbf8', grey = '#b7bfc8', sw = sm ? 2.6 : 1.8;
  const WING = 'M46 50 C38 40 30 32 23 32 C15 32 8 36 2 43 C11 42.4 19 44 25 48 C32 52 38 57 46 58 Z';
  const TIP = 'M2 43 C7 37.6 12 34.6 17 33.4 C15.6 37.6 14.8 40.6 14.4 43.6 C10.4 42.6 6 42.4 2 43 Z';
  const TOP = 'M46 50 C38 40 30 32 23 32 C19 32 17.4 33 17 33.4 C16 38 15 41 14.6 43.6 C20 44.6 24 46 27 48.4 C32 46 38 47 46 52 Z';
  return (<>
    <path d={WING} fill={white} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={TOP} fill={grey} /><path d={TIP} fill={INK} />
    <path d={mirror(WING)} fill={white} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={mirror(TOP)} fill={grey} /><path d={mirror(TIP)} fill={INK} />
    <path d={WING} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(WING)} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && [[9, 40], [12, 38.6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#ffffff" />)}
    {!sm && [[91, 40], [88, 38.6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#ffffff" />)}
    <path d="M45 68 L44 74 L47.6 70.6 Z M55 68 L56 74 L52.4 70.6 Z" fill="#f2a541" stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
    <ellipse cx="50" cy="56" rx="8.4" ry="13" fill={white} stroke={INK} strokeWidth={sw} />
    <circle cx="50" cy="39" r="8.6" fill={white} stroke={INK} strokeWidth={sw} />
    <circle cx="46.4" cy="37.6" r={sm ? 1.7 : 1.4} fill={INK} /><circle cx="53.6" cy="37.6" r={sm ? 1.7 : 1.4} fill={INK} />
    <path d="M44.4 34.6 L48 35.6 M55.6 34.6 L52 35.6" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
    <path d="M47.4 42 L52.6 42 L50 50.4 Z" fill="#ffd166" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <circle cx="50.9" cy="46" r="1.1" fill="#e63946" />
  </>);
}
function gulls(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(gullArt(c, true), 50, 50, 1.0));
  return Tag({ uid, k: 'sl', c: [c[0], c[1]], city: 'SALT LAKE', nick: 'GULLS', bg: lt(c[0], 0.5) }, gullArt(c, false), <>
    <path d="M0 62 L14 50 L22 54 L34 42 L46 52 L58 44 L70 50 L84 40 L100 52 V70 H0 Z" fill={lt(c[0], 0.25)} />
    <path d="M34 42 L38 45 L36 46 L40 49 L46 52 L42 50 L38 48 Z M84 40 L88 44 L86 44.6 L92 47 L100 52 L92 49 Z" fill="#ffffff" opacity=".8" />
    <rect x="0" y="62" width="100" height="40" fill={c[0]} />
    <path d="M0 64 H100" stroke="#ffffff" strokeWidth="1.6" opacity=".7" />
  </>, { artY: 44, artS: 0.66 });
}

// ── Oklahoma City Twisters
function twisterArt(c: Pal, sm: boolean) {
  const cloud = '#5b6170', funnel = lt(c[0], 0.62), funnelD = lt(c[0], 0.3), sw = sm ? 2.6 : 1.8;
  const FUNNEL = 'M14 24 C30 28 70 28 86 24 C80 36 67 42 62 50 C58 57 60 65 55 74 C53 80 51 86 50 93 C47.4 86 45 80 44 74 C42 66 40 58 36 50 C32 42 20 34 14 24 Z';
  return (<>
    <path d={FUNNEL} fill={funnel} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {[[20, 31, 80, 31, 50, 39], [26, 40, 74, 40, 50, 47.6], [34, 50, 64, 50, 49, 56.6], [40, 61, 59, 61, 49.6, 66], [44.6, 72, 56, 72, 50, 76], [47, 82, 53, 82, 50, 85]].map(([x1, y1, x2, y2, cx, cy], i) =>
      <path key={i} d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} fill="none" stroke={funnelD} strokeWidth={sm ? 2.6 : 2} strokeLinecap="round" />)}
    {!sm && <path d="M30 36 Q36 42 44 44 M40 54 Q44 58 48 59" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />}
    {[[22, 18, 12], [40, 12, 14], [60, 12, 14], [78, 18, 12]].map(([x, y, r], i) => <circle key={'o' + i} cx={x} cy={y} r={r + 1.6} fill={INK} />)}
    {[[22, 18, 12], [40, 12, 14], [60, 12, 14], [78, 18, 12]].map(([x, y, r], i) => <circle key={'f' + i} cx={x} cy={y} r={r} fill={cloud} />)}
    {!sm && <path d="M14 22 C30 26 70 26 86 22" fill="none" stroke={dk(cloud, 0.3)} strokeWidth="2" />}
    <path d="M24 24 L17 38 L23 38 L14 54 L31 34 L25 34 L31 24 Z" fill={c[1]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    {!sm && [[72, 50, 30], [76, 64, -20], [30, 70, 50]].map(([x, y, r], i) => <rect key={i} x={x - 4} y={y - 1.4} width="8" height="2.8" rx=".6" fill={WOOD} stroke={INK} strokeWidth=".8" transform={`rotate(${r} ${x} ${y})`} />)}
    <path d={fluff(50, 92, 12, 8, 0.2)} fill="#b08a5a" stroke={INK} strokeWidth="1.2" />
  </>);
}
function twisters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(twisterArt(c, true), 50, 50, 0.96));
  return Octagon({ uid, k: 'ok', c: [c[0], c[1]], city: 'OKLAHOMA CITY', nick: 'TWISTERS', bg: dk(c[0], 0.1) }, twisterArt(c, false), <>
    <path d="M0 64 C30 60 70 60 100 64 V100 H0 Z" fill={mix(c[1], '#a07040', 0.5)} />
    {[66, 70, 74].map(y => <path key={y} d={`M0 ${y} Q50 ${y - 3} 100 ${y}`} fill="none" stroke={dk(mix(c[1], '#a07040', 0.5), 0.2)} strokeWidth=".9" />)}
  </>, { artY: 47, artS: 0.54 });
}

// ── Tulsa Gushers
function gusherArt(c: Pal, sm: boolean) {
  const oil = '#16151b', frame = '#3a3946', sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M47 24 C46 18 44.4 14 45 10 L55 10 C55.6 14 54 18 53 24 Z" fill={oil} />
    <path d={fluff(50, 14, 16, 12, 0.22)} fill={oil} stroke={INK} strokeWidth="1.2" />
    {!sm && <><path d="M40 10 C42 7 46 5 50 5" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".55" /><path d="M58 16 C60 14 62 12 63 9" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity=".45" /></>}
    {[[26, 26, 3.4], [74, 24, 3.4], [20, 40, 2.6], [80, 40, 2.6], [30, 46, 2], [70, 50, 2]].map(([x, y, r], i) => <path key={i} d={`M${x} ${y - r * 1.8} C${x + r} ${y - r * 0.4} ${x + r} ${y + r} ${x} ${y + r} C${x - r} ${y + r} ${x - r} ${y - r * 0.4} ${x} ${y - r * 1.8} Z`} fill={oil} stroke={INK} strokeWidth=".6" />)}
    <Line2 d="M28 92 L45.6 24" c={frame} w={sm ? 4.2 : 3.4} o={1.6} />
    <Line2 d="M72 92 L54.4 24" c={frame} w={sm ? 4.2 : 3.4} o={1.6} />
    {!sm && [[34, 70, 66, 70], [38, 54, 62, 54], [42, 40, 58, 40], [34, 70, 62, 54], [66, 70, 38, 54], [38, 54, 58, 40], [62, 54, 42, 40]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={frame} strokeWidth={i < 3 ? 2 : 1.3} />)}
    {sm && [[36, 64, 64, 64], [41, 46, 59, 46]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={frame} strokeWidth="3" />)}
    <rect x="41" y="21" width="18" height="4.6" fill={frame} stroke={INK} strokeWidth="1.2" />
    <path d="M14 92 C24 86 76 86 86 92 C76 96 24 96 14 92 Z" fill={oil} stroke={INK} strokeWidth="1.2" />
    {!sm && <path d="M26 90 C34 88.4 44 88 52 88.6" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />}
  </>);
}
function gushers(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(gusherArt(c, true), 50, 52, 0.96));
  return Shield({ uid, k: 'tu', field: c[0], band: c[1], city: 'TULSA', nick: 'GUSHERS', ribbon: c[1] }, <>
    {Array.from({ length: 8 }, (_, i) => { const a = Math.PI * (1.08 + (i / 7) * 0.84); return <path key={i} d={`M50 40 L${f2(50 + Math.cos(a - 0.08) * 60)} ${f2(40 + Math.sin(a - 0.08) * 60)} L${f2(50 + Math.cos(a + 0.08) * 60)} ${f2(40 + Math.sin(a + 0.08) * 60)} Z`} fill={lt(c[0], 0.4)} />; })}
    {place(gusherArt(c, false), 50, 55, 0.58)}
  </>);
}

// ── Tucson Stargazers
function telescopeArt(c: Pal, sm: boolean) {
  const tube = c[1], tubeD = dk(c[1], 0.28), sw = sm ? 2.6 : 1.8;
  return (<>
    <Line2 d="M48 60 L30 93" c={STEEL_D} w={sm ? 3.6 : 2.8} o={1.6} />
    <Line2 d="M48 60 L66 93" c={STEEL_D} w={sm ? 3.6 : 2.8} o={1.6} />
    <Line2 d="M48 60 L49 95" c={STEEL_D} w={sm ? 3.6 : 2.8} o={1.6} />
    <g transform="rotate(-34 50 52)">
      <rect x="34" y="37.6" width="20" height="4.4" rx="1.2" fill={STEEL_L} stroke={INK} strokeWidth="1.1" />
      <rect x="10" y="45" width="10" height="7" rx="1.4" fill={STEEL} stroke={INK} strokeWidth="1.2" />
      <rect x="18" y="42.6" width="56" height="12" rx="2" fill={tube} stroke={INK} strokeWidth={sw} />
      <rect x="72" y="39.4" width="13" height="18.4" rx="2" fill={tubeD} stroke={INK} strokeWidth={sw} />
      {[30, 42, 54].map(x => <rect key={x} x={x} y="42.6" width="2.6" height="12" fill={tubeD} />)}
      <rect x="18" y="42.6" width="56" height="12" rx="2" fill="none" stroke={INK} strokeWidth={sw} />
      {!sm && <path d="M22 45.6 H68" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />}
    </g>
    <circle cx="48" cy="58" r="4.4" fill={STEEL} stroke={INK} strokeWidth="1.3" />
    <polygon points={star5(84, 14, sm ? 9 : 7, sm ? 3.8 : 3)} fill="#ffe28a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
  </>);
}
function stargazers(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(telescopeArt(c, true), 50, 50, 0.94));
  return Arch({ uid, k: 'tc', c: [c[0], c[1]], city: 'TUCSON', nick: 'STARGAZERS' }, telescopeArt(c, false), <>
    <path d="M10 70 C30 46 60 30 96 14 L100 28 C66 40 38 56 18 80 Z" fill="#ffffff" opacity=".1" />
    {[[24, 26, 1.6], [36, 16, 1.2], [70, 40, 1.4], [78, 54, 1], [28, 48, 1.2], [62, 22, 1], [20, 62, 1], [82, 66, 1.4]].map(([x, y, r], i) => <path key={i} d={sparkle(x, y, r * 1.6)} fill="#fff6d6" />)}
    <path d="M13 80 L26 68 L36 72 L50 62 L62 70 L74 64 L87 72 V100 H13 Z" fill={dk(c[0], 0.45)} />
    <path d="M28 69.4 C28 65 34 65 34 69.4 Z" fill={STEEL_L} stroke={INK} strokeWidth=".7" />
    {saguaro(78, 82, 12, 's')}
  </>, { artY: 46, artS: 0.6, plate: dk(c[0], 0.5) });
}

// ── Fresno Harvesters
function grapeArt(c: Pal, sm: boolean) {
  const grape = c[0], leaf = c[1], sw = sm ? 2 : 1.3;
  const LEAFP = 'M58 22 C60 14 66 8 74 8 C74 12 78 12 82 10 C84 16 82 20 86 22 C90 26 88 32 84 34 C80 34 78 36 78 40 C72 40 66 36 64 30 C62 28 60 26 58 22 Z';
  const rows: number[][] = [[5, 30], [4, 41], [4, 52], [3, 63], [2, 74], [1, 84]];
  return (<>
    <Line2 d="M50 26 C50 18 52 12 58 8" c={WOOD} w={sm ? 3 : 2.4} o={1.6} />
    {!sm && <path d="M38 22 C32 20 28 14 32 10 C35 8 37 12 34 14" fill="none" stroke={dk(leaf, 0.2)} strokeWidth="1.4" strokeLinecap="round" />}
    <path d={LEAFP} fill={leaf} stroke={INK} strokeWidth={sm ? 2 : 1.5} strokeLinejoin="round" />
    {!sm && <path d="M60 24 L74 20 M66 22 L72 12 M68 21 L82 26 M70 24 L76 36" fill="none" stroke={dk(leaf, 0.3)} strokeWidth="1" />}
    {rows.map(([n, y], r) => Array.from({ length: n }, (_, i) => { const x = 50 + (i - (n - 1) / 2) * 11; return <g key={r + '-' + i}><circle cx={x} cy={y} r="6.2" fill={grape} stroke={INK} strokeWidth={sw} />{!sm && <circle cx={x - 2} cy={y - 2} r="1.6" fill="#ffffff" opacity=".55" />}</g>; }))}
  </>);
}
function harvesters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(lt(c[1], 0.45), place(grapeArt(c, true), 50, 50, 0.92));
  return Seal({ uid, k: 'fr', c: [c[0], c[1]], city: 'FRESNO', nick: 'HARVESTERS', bg: lt(c[1], 0.62) }, grapeArt(c, false), <>
    {[18, 30, 42].map(y => <path key={y} d={`M0 ${y + 50} Q50 ${y + 44} 100 ${y + 50}`} fill="none" stroke={lt(c[1], 0.3)} strokeWidth="3" />)}
  </>, { artY: 50, artS: 0.5 });
}

// ── Calgary Stampede
function hatArt(c: Pal, sm: boolean) {
  const felt = '#fbf8f1', shade = '#e2dccd', sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M6 56 C10 48 18 46 26 52 C34 56 66 56 74 52 C82 46 90 48 94 56 C88 65 72 69 50 69 C28 69 12 65 6 56 Z" fill={felt} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M14 60 C24 65 40 66 50 66 C60 66 76 65 86 60" fill="none" stroke={shade} strokeWidth="2.2" />
    <path d="M28 54 C26 38 30 24 36 20 C42 22 46 21 50 18.6 C54 21 58 22 64 20 C70 24 74 38 72 54 C62 58 38 58 28 54 Z" fill={felt} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M42 24 C46 29 54 29 58 24" fill="none" stroke={shade} strokeWidth="1.8" strokeLinecap="round" />
    {!sm && <path d="M34 28 C33 34 32 40 32.6 46" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />}
    <path d="M28.8 47.6 C40 51.6 60 51.6 71.2 47.6 L71.8 54 C62 58 38 58 28.2 54 Z" fill={c[0]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <polygon points={star5(50, 52.6, sm ? 4 : 3.2, sm ? 1.7 : 1.35)} fill={c[1]} stroke={INK} strokeWidth=".7" />
  </>);
}
function stampede(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(hatArt(c, true), 50, 54, 1.04));
  const cid = 'cg' + uid, gold = c[1];
  return (<>
    <defs><clipPath id={cid}><ellipse cx="50" cy="50" rx="31" ry="23" /></clipPath></defs>
    <ellipse cx="50" cy="50" rx="49" ry="41" fill={INK} />
    <ellipse cx="50" cy="50" rx="46.6" ry="38.6" fill={gold} />
    <ellipse cx="50" cy="50" rx="43.4" ry="35.4" fill="none" stroke={dk(gold, 0.35)} strokeWidth="3.4" strokeDasharray="2.6 1.6" />
    <ellipse cx="50" cy="50" rx="40" ry="32" fill={STEEL_L} stroke={INK} strokeWidth="1.6" />
    {[[-1, 1], [1, 1]].map(([s], i) => <path key={i} d={`M${50 + s * 36} 50 C${50 + s * 34} 40 ${50 + s * 28} 36 ${50 + s * 24} 40 C${50 + s * 28} 42 ${50 + s * 30} 46 ${50 + s * 32} 50 C${50 + s * 30} 54 ${50 + s * 28} 58 ${50 + s * 24} 60 C${50 + s * 28} 64 ${50 + s * 34} 60 ${50 + s * 36} 50 Z`} fill="none" stroke={STEEL_D} strokeWidth="1" />)}
    <ellipse cx="50" cy="50" rx="31" ry="23" fill={c[0]} stroke={INK} strokeWidth="1.6" />
    <g clipPath={`url(#${cid})`}>
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <path key={i} d={`M50 50 L${f2(50 + Math.cos(a) * 40)} ${f2(50 + Math.sin(a) * 40)} L${f2(50 + Math.cos(a + 0.3) * 40)} ${f2(50 + Math.sin(a + 0.3) * 40)} Z`} fill={lt(c[0], 0.12)} />; })}
      {place(hatArt(c, false), 50, 49, 0.56)}
    </g>
    <rect x="30" y="12.6" width="40" height="10" rx="2" fill={INK} />
    <Txt y={20.2} text="CALGARY" size={6.6} fill={gold} max={34} ls={2} />
    {[12, 88].map(x => <polygon key={x} points={star5(x, 50, 3.6, 1.5)} fill={c[0]} stroke={INK} strokeWidth=".8" />)}
    <Ribbon id={'cgr' + uid} y={76} w={74} fill={c[0]} text="STAMPEDE" size={9.4} />
  </>);
}

// ── Edmonton Roughnecks
function hardhatArt(c: Pal, sm: boolean) {
  const hat = c[0], sw = sm ? 2.6 : 1.8;
  const WRENCH = 'M10 47 H62 C64 41 70 37 77 37.4 L72 45 L76 52 L85 51 C85 58 79 63 72 63 C67 63 63 59.6 62 55 H10 C7 55 6 53 6 51 C6 49 7 47 10 47 Z';
  return (<>
    <g transform="rotate(38 50 50)"><path d={WRENCH} fill={STEEL} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />{!sm && <path d="M12 49.4 H60" stroke={STEEL_L} strokeWidth="1.4" />}</g>
    <g transform="rotate(-38 50 50)"><path d={mirror(WRENCH)} fill={STEEL} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />{!sm && <path d="M88 49.4 H40" stroke={STEEL_L} strokeWidth="1.4" />}</g>
    <path d="M22 58 C22 34 34 22 50 22 C66 22 78 34 78 58 Z" fill={hat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M45 22.6 C44 34 44 46 45 58 L55 58 C56 46 56 34 55 22.6 C52 22 48 22 45 22.6 Z" fill={lt(hat, 0.22)} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    {!sm && <path d="M30 40 C32 33 36 29 41 27" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />}
    <path d="M10 58 C10 54 90 54 90 58 C90 64.6 10 64.6 10 58 Z" fill={dk(hat, 0.12)} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="65" cy="42" r={sm ? 5 : 4.2} fill={c[1]} stroke={INK} strokeWidth="1.1" />
    {!sm && <path d="M50 74 C45 81 44 85 44 87 C44 90.4 46.8 93 50 93 C53.2 93 56 90.4 56 87 C56 85 55 81 50 74 Z" fill="#16151b" stroke={INK} strokeWidth="1" />}
  </>);
}
function roughnecks(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(hardhatArt(c, true), 50, 50, 0.96));
  return Shield({ uid, k: 'ed', field: c[1], band: c[0], city: 'EDMONTON', nick: 'ROUGHNECKS', ribbon: c[0] }, <>
    {[30, 44, 58, 72, 86].map((y, i) => <path key={y} d={`M0 ${y} L100 ${y - 16}`} stroke={lt(c[1], 0.1)} strokeWidth="6" opacity={i % 2 ? 1 : 0.6} />)}
    {place(hardhatArt(c, false), 50, 50, 0.62)}
  </>);
}

// ── Mexico City Águilas
function eagleArt(c: Pal, sm: boolean) {
  const brown = '#5e3a20', nape = '#c9913a', beak = '#ffc300', sw = sm ? 2.6 : 1.8;
  const HEAD = 'M90 98 C84 80 84 62 78 48 C73 35 63 25 49 23 C37 22 29 26 25 32 L15 36 C11 38 10 42 13 45 C17 48 21 50 23 54 C25 60 31 64 37 66 C40 76 38 88 32 98 Z';
  return (<>
    {!sm && <><path d="M8 98 C6 88 10 80 16 78 C20 82 20 90 18 98 Z M18 98 C20 86 26 80 32 80 C34 86 30 94 26 98 Z" fill={LEAF} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />{[[12, 86], [26, 88]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#e63946" stroke={INK} strokeWidth=".5" />)}</>}
    <path d={HEAD} fill={brown} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M49 23 C63 25 73 35 78 48 C84 62 84 80 90 98 L80 98 C76 84 74 70 68 60 C62 50 56 42 52 32 Z" fill={nape} />
    {!sm && <path d="M84 98 L80 90 L86 88 L80 80 L86 78 L80 70 M66 98 L62 88 L68 86 L62 76" fill="none" stroke={dk(brown, 0.3)} strokeWidth="1.2" strokeLinejoin="round" />}
    {!sm && <path d="M60 30 C66 34 70 40 72 46 M56 36 C62 42 64 48 66 54" fill="none" stroke={lt(nape, 0.3)} strokeWidth="1.2" />}
    <path d={HEAD} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M27 30 C19 30 11 34 9 42 C9 48 13 52 15 55 C15 51 16 48 19 47 L29 45 C33 43 33 35 27 30 Z" fill={beak} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M9 42 C9 48 13 52 15 55 C15 51 16 48 18 47 C14 47 11 45.6 9 42 Z" fill="#3d3a36" />
    <path d="M19 47 C23 46.6 29 45 33 42.6" fill="none" stroke={INK} strokeWidth="1.3" />
    <ellipse cx="22" cy="36.6" rx="1.4" ry="1" fill={INK} />
    <path d="M28 31 C34 27 42 28 47 32 L41 34.4 C37 32.4 33 32.4 29 33.6 Z" fill={dk(brown, 0.35)} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    <circle cx="37" cy="36" r={sm ? 3.4 : 3} fill="#f2a33a" stroke={INK} strokeWidth="1" />
    <circle cx="37.4" cy="36" r={sm ? 1.7 : 1.5} fill={INK} />
    {!sm && <circle cx="36.4" cy="35" r=".6" fill="#ffffff" />}
  </>);
}
function aguilas(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(eagleArt(c, true), 50, 50, 0.96));
  return Ring({ uid, k: 'mx', band: c[0], inner: lt(c[1], 0.5), city: 'MEXICO CITY', nick: 'ÁGUILAS', text: PAPER, trim: c[1] }, <>
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, w = Math.PI / 12; return <path key={i} d={`M30 30 L${f2(30 + Math.cos(a - w / 2) * 70)} ${f2(30 + Math.sin(a - w / 2) * 70)} L${f2(30 + Math.cos(a + w / 2) * 70)} ${f2(30 + Math.sin(a + w / 2) * 70)} Z`} fill={lt(c[1], 0.3)} />; })}
    {place(eagleArt(c, false), 52, 54, 0.66)}
  </>);
}

// ── Guadalajara Mariachis
function sombreroArt(c: Pal, sm: boolean) {
  const felt = '#1f1d24', trim = c[1], sw = sm ? 2.6 : 1.8, brass = '#f2c14e';
  return (<>
    <ellipse cx="50" cy="64" rx="47" ry="13" fill={felt} stroke={INK} strokeWidth={sw} />
    <ellipse cx="50" cy="62.4" rx="41" ry="9.4" fill="none" stroke={trim} strokeWidth={sm ? 2.2 : 1.6} strokeDasharray={sm ? undefined : '2.4 1.4'} />
    <path d="M32 62 C30 46 34 30 50 27 C66 30 70 46 68 62 C60 66 40 66 32 62 Z" fill={felt} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M44 30 C46 34 54 34 56 30" fill="none" stroke="#3a3744" strokeWidth="1.6" />
    <path d="M33.4 54 C42 57.6 58 57.6 66.6 54 L67.6 61 C60 65 40 65 32.4 61 Z" fill={trim} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    {!sm && [38, 44, 50, 56, 62].map(x => <circle key={x} cx={x} cy="58.6" r="1.1" fill={INK} />)}
    {!sm && <path d="M12 66 C18 72 30 74 36 72 M88 66 C82 72 70 74 64 72" fill="none" stroke={trim} strokeWidth="1.2" />}
    {!sm && <path d="M38 36 C37 42 36 48 36.4 54" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".3" />}
    {!sm && <g transform="translate(19 70) rotate(-16) scale(.78) translate(-50 -45)">
      <rect x="47.6" y="-2" width="4.8" height="36" fill="#6b4226" stroke={INK} strokeWidth="1.3" />
      {[4, 10, 16, 22].map(y => <path key={y} d={`M47.8 ${y} H52.2`} stroke={STEEL_L} strokeWidth=".8" />)}
      <path d="M45 -10 L55 -10 L54 -1 L46 -1 Z" fill="#3a2a1c" stroke={INK} strokeWidth="1.3" />
      <path d="M50 28 C58 28 61 34 59.6 40 C66 44 66 58 50 60 C34 58 34 44 40.4 40 C39 34 42 28 50 28 Z" fill="#e0913f" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="50" cy="41" r="4" fill={INK} /><rect x="44" y="50" width="12" height="3" rx="1" fill="#6b4226" stroke={INK} strokeWidth=".8" />
      {[48.4, 49.5, 50.6, 51.7].map(x => <path key={x} d={`M${x} -1 V51`} stroke="#f1f1f1" strokeWidth=".35" />)}
    </g>}
    {!sm && <g transform="translate(62 74) rotate(-28) scale(.82)">
      <path d="M8 1.6 C4 8 8 11 14 11 L26 11 C30 11 31 8 29 3" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M8 1.6 C4 8 8 11 14 11 L26 11 C30 11 31 8 29 3" fill="none" stroke={brass} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="0" y="-1.6" width="28" height="3.2" fill={brass} stroke={INK} strokeWidth="1" />
      {[12, 16.4, 20.8].map(x => <g key={x}><rect x={x} y="-8" width="3.4" height="9" rx=".8" fill={brass} stroke={INK} strokeWidth=".9" /><rect x={x - 0.4} y="-10.4" width="4.2" height="2.6" rx=".8" fill={PAPER} stroke={INK} strokeWidth=".7" /></g>)}
      <path d="M26 -2 L34 -2 C38 -3 41 -7 44 -11 L44 11 C41 7 38 3 34 2 L26 2 Z" fill={brass} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <ellipse cx="44" cy="0" rx="2.2" ry="11" fill={dk(brass, 0.3)} stroke={INK} strokeWidth="1.2" />
    </g>}
  </>);
}
function mariachis(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(sombreroArt(c, true), 50, 46, 0.98));
  const stripes = [c[1], '#2ec4b6', '#ffffff', '#ff6b6b', '#ffd23f', c[1]];
  return Script({ uid, k: 'gd', c: [c[0], c[1]], city: 'GUADALAJARA', nick: 'Mariachis' }, sombreroArt(c, false), <>
    {stripes.map((s, i) => <rect key={i} x="0" y={66 + i * 5.6} width="100" height="5.6" fill={s} opacity={s === '#ffffff' ? 0.75 : 1} />)}
    {[66, 77.2, 88.4].map(y => <path key={y} d={'M0 ' + y + ' ' + Array.from({ length: 13 }, (_, i) => `L${i * 8 + 4} ${y + (i % 2 ? 0 : 2.2)}`).join(' ')} fill="none" stroke={INK} strokeWidth=".7" opacity=".5" />)}
  </>, { artY: 40, artS: 0.6, swash: c[1] });
}

// ── Monterrey Montañeses
function sillaArt(c: Pal, sm: boolean) {
  const rock = '#2e4466', face = '#4c6890', sw = sm ? 2.6 : 1.8;
  const MTN = 'M2 88 L16 66 L26 44 L34 32 L42 46 L50 54 L58 46 L66 28 L73 14 L80 30 L90 56 L98 88 Z';
  return (<>
    <circle cx="50" cy="44" r="15" fill="#ffd166" stroke={INK} strokeWidth="1.4" />
    {!sm && Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.1 + (i / 8) * 0.8); return <path key={i} d={`M${f2(50 + Math.cos(a) * 18)} ${f2(44 + Math.sin(a) * 18)} L${f2(50 + Math.cos(a) * 25)} ${f2(44 + Math.sin(a) * 25)}`} stroke="#ffd166" strokeWidth="2.4" strokeLinecap="round" />; })}
    <path d={MTN} fill={rock} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M34 32 L42 46 L36 52 L30 70 L22 76 L26 56 Z M73 14 L80 30 L90 56 L80 52 L76 66 L70 50 L68 34 Z" fill={face} />
    {!sm && <path d="M50 54 L48 66 M34 32 L32 48 M73 14 L72 34 L66 48" fill="none" stroke={dk(rock, 0.3)} strokeWidth="1.1" />}
    <path d={MTN} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={'M2 88 ' + Array.from({ length: 12 }, (_, i) => `Q${f2(6 + i * 8)} ${i % 2 ? 76 : 79} ${f2(10 + i * 8)} 82`).join(' ') + ' L98 88 Z'} fill={LEAF} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
  </>);
}
function montaneses(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(sillaArt(c, true), 50, 50, 0.96));
  return Hexagon({ uid, k: 'my', c: [c[0], c[1]], city: 'MONTERREY', nick: 'MONTAÑESES' }, sillaArt(c, false), <>
    <rect x="0" y="34" width="100" height="18" fill={lt(c[1], 0.45)} />
    <rect x="0" y="50" width="100" height="30" fill={lt(c[1], 0.15)} />
  </>, { artY: 50, artS: 0.64 });
}

// ── Tijuana Fronterizos
function tjArchArt(c: Pal, sm: boolean) {
  const sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && <path d="M4 93 H96" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
    <path d="M10 92 C14 50 30 10 50 8 C70 10 86 50 90 92 L79 92 C76 56 66 22 50 20 C34 22 24 56 21 92 Z" fill={STEEL_L} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M15.6 92 C19 52 32 15 50 14 C68 15 81 52 84.4 92" fill="none" stroke={STEEL} strokeWidth={sm ? 2 : 1.4} />
    {!sm && [24, 36, 50, 64, 76].map((x, i) => { const y = [52, 28, 17, 28, 52][i]; return <path key={x} d={`M${x - 2} ${y} L${x + 2} ${y + 3}`} stroke={STEEL_D} strokeWidth="1" />; })}
    <rect x="6" y="88" width="18" height="5" rx="1" fill={STEEL} stroke={INK} strokeWidth="1.3" />
    <rect x="76" y="88" width="18" height="5" rx="1" fill={STEEL} stroke={INK} strokeWidth="1.3" />
    <path d="M50 20 V29" stroke={INK} strokeWidth="1.6" />
    <circle cx="50" cy="38" r={sm ? 10 : 9} fill={c[0]} stroke={INK} strokeWidth="1.6" />
    <circle cx="50" cy="38" r={sm ? 7.2 : 6.6} fill={PAPER} stroke={INK} strokeWidth="1" />
    {!sm && [0, 1, 2, 3].map(i => { const a = (i * Math.PI) / 2; return <circle key={i} cx={f2(50 + Math.cos(a) * 5.2)} cy={f2(38 + Math.sin(a) * 5.2)} r=".6" fill={INK} />; })}
    <path d="M50 38 V33.6 M50 38 L53.4 39.6" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
  </>);
}
function fronterizos(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(tjArchArt(c, true), 50, 50, 0.96));
  return Wordmark({ uid, k: 'tj', c: [c[0], c[1]], city: 'TIJUANA', nick: 'FRONTERIZOS', bg: lt(c[1], 0.5) }, tjArchArt(c, false), <>
    <circle cx="50" cy="52" r="20" fill="#ffd166" />
    {[48, 54, 60].map((y, i) => <rect key={y} x="0" y={y} width="100" height="2.4" fill={lt(c[1], 0.5)} opacity={0.9 - i * 0.2} />)}
    <path d="M0 58 H100 V100 H0 Z" fill={c[1]} />
    {[[14, 52, 6, 6], [22, 48, 5, 10], [74, 50, 6, 8], [82, 46, 6, 12]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={dk(c[1], 0.25)} />)}
  </>, { artY: 37, artS: 0.56, size: 14 });
}

// ── Omaha Stockyards
function bullArt(c: Pal, sm: boolean) {
  const coat = '#8a3b1c', coatD = '#5e2410', horn = '#f1e3c4', sw = sm ? 2.6 : 1.8, ring = '#f2c14e';
  const HORN = 'M32 30 C22 30 12 24 6 12 C14 18 23 20 34 22 Z', EAR = 'M31 36 C23 35 16 38 13 43 C19 46 26 44 32 41 Z';
  return (<>
    {!sm && <>{[[22, 88, 6], [14, 84, 4.6], [10, 92, 3.6]].map(([x, y, r], i) => <path key={'l' + i} d={fluff(x, y, r, 7, 0.22)} fill="#ffffff" stroke={INK} strokeWidth=".8" />)}{[[78, 88, 6], [86, 84, 4.6], [90, 92, 3.6]].map(([x, y, r], i) => <path key={'r' + i} d={fluff(x, y, r, 7, 0.22)} fill="#ffffff" stroke={INK} strokeWidth=".8" />)}</>}
    <path d={HORN} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(HORN)} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={EAR} fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(EAR)} fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M32 22 C40 17 60 17 68 22 C72 32 70 44 66 54 C64 62 64 70 62 77 C60 85 40 85 38 77 C36 70 36 62 34 54 C30 44 28 32 32 22 Z" fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M42 20.6 C46 19 54 19 58 20.6 C60 30 57 38 55 46 C54 54 56 62 58 70 L42 70 C44 62 46 54 45 46 C43 38 40 30 42 20.6 Z" fill="#fbf7ef" />
    <path d={fluff(50, 22, 7.6, 8, 0.24)} fill={coatD} stroke={INK} strokeWidth="1" />
    <path d="M34 40 L44 44 M66 40 L56 44" stroke={INK} strokeWidth={sm ? 2.6 : 2} strokeLinecap="round" />
    <circle cx="40" cy="47" r={sm ? 3 : 2.6} fill={INK} /><circle cx="60" cy="47" r={sm ? 3 : 2.6} fill={INK} />
    <path d="M36 74 C36 66 64 66 64 74 C64 81 57 84 50 84 C43 84 36 81 36 74 Z" fill="#e8a598" stroke={INK} strokeWidth={sw} />
    <ellipse cx="43.6" cy="73.6" rx="2.6" ry="3.4" fill={dk('#e8a598', 0.5)} /><ellipse cx="56.4" cy="73.6" rx="2.6" ry="3.4" fill={dk('#e8a598', 0.5)} />
    <circle cx="50" cy="84" r={sm ? 7 : 6} fill="none" stroke={INK} strokeWidth={sm ? 4.4 : 3.6} />
    <circle cx="50" cy="84" r={sm ? 7 : 6} fill="none" stroke={ring} strokeWidth={sm ? 2.2 : 1.8} />
  </>);
}
function stockyards(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(bullArt(c, true), 50, 50, 0.96));
  return Tag({ uid, k: 'om', c: [c[1], c[0]], city: 'OMAHA', nick: 'STOCKYARDS', bg: lt(c[1], 0.35) }, bullArt(c, false), <>
    {[18, 50, 82].map(x => <rect key={x} x={x - 2.4} y="44" width="4.8" height="30" fill={WOOD} stroke={INK} strokeWidth=".9" />)}
    {[50, 60].map(y => <rect key={y} x="0" y={y} width="100" height="4.6" fill={mix(WOOD, '#ffffff', 0.15)} stroke={INK} strokeWidth=".9" />)}
    <rect x="0" y="68" width="100" height="30" fill={mix(c[1], '#8a5a2b', 0.35)} />
  </>, { artY: 45, artS: 0.56 });
}

// ── Honolulu Waves
function waveArt(c: Pal, sm: boolean) {
  const deep = dk(c[0], 0.3), mid = c[0], sw = sm ? 2.6 : 1.8;
  const WAVE = 'M4 88 C4 60 16 36 38 25 C56 17 77 21 88 34 C93 40 92 49 86 50.6 C81.4 51.6 78 48 80 43 C74 36.6 64 36.6 58 42 C50 50 52 62 60 70 C66 76 76 78 88 76 L96 88 Z';
  return (<>
    <path d={WAVE} fill={deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M12 86 C12 62 22 44 40 34 C54 27 70 28 78 36 C70 32 60 33 54 38 C44 46 44 62 52 72 C58 80 70 84 84 84 Z" fill={mid} />
    {!sm && <path d="M18 80 C20 64 28 52 40 44 M26 84 C28 70 34 60 44 54" fill="none" stroke={lt(mid, 0.4)} strokeWidth="1.6" strokeLinecap="round" />}
    {[[40, 25, 5], [50, 21, 5.4], [61, 20, 5.4], [72, 22, 5], [82, 27, 4.6], [88, 35, 4], [87, 44, 3.4], [31, 30, 4.4]].map(([x, y, r], i) => <circle key={'o' + i} cx={x} cy={y} r={r + 1.4} fill={INK} />)}
    {[[40, 25, 5], [50, 21, 5.4], [61, 20, 5.4], [72, 22, 5], [82, 27, 4.6], [88, 35, 4], [87, 44, 3.4], [31, 30, 4.4]].map(([x, y, r], i) => <circle key={'f' + i} cx={x} cy={y} r={r} fill="#ffffff" />)}
    {!sm && [[94, 26, 1.6], [96, 40, 1.2], [26, 22, 1.4], [92, 18, 1]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" stroke={INK} strokeWidth=".5" />)}
    <g transform="rotate(-62 66 62)">
      <path d="M44 62 C44 57.6 54 55.6 66 55.6 C78 55.6 90 58 90 62 C90 66 78 68.4 66 68.4 C54 68.4 44 66.4 44 62 Z" fill={c[1]} stroke={INK} strokeWidth={sw} />
      <path d="M46 62 H88" stroke={PAPER} strokeWidth="1.8" />
      <path d="M48 62 L44.6 66 L51 64 Z" fill={INK} />
    </g>
  </>);
}
function waves(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(lt(c[0], 0.55), place(waveArt(c, true), 50, 50, 0.96));
  return Sunburst({ uid, k: 'hn', c: [c[0], c[1]], city: 'HONOLULU', nick: 'WAVES' }, waveArt(c, false), { artY: 46, artS: 0.58, ray: lt(c[0], 0.2), core: '#ffe8a3' });
}

// ── Albuquerque Roadrunners
function roadrunnerArt(c: Pal, sm: boolean) {
  const body = '#6f5f4e', dark = '#2f2c3a', leg = '#5c6b8a', sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && <><path d={fluff(14, 82, 8, 8, 0.24)} fill="#e9d7b0" stroke={INK} strokeWidth=".9" /><path d={fluff(6, 74, 5, 7, 0.24)} fill="#e9d7b0" stroke={INK} strokeWidth=".8" /></>}
    {!sm && <path d="M2 46 H18 M0 54 H14 M4 62 H20" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}
    <path d="M42 50 L6 24 L9 19 L13 21 L12 17 L16 18 L46 42 Z" fill={dark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M14 24 L18 21 M22 30 L26 27 M30 36 L34 33" stroke="#ffffff" strokeWidth="1.4" />}
    <Line2 d="M48 58 L40 74 L30 86" c={leg} w={sm ? 3.4 : 2.6} o={1.6} />
    <Line2 d="M30 86 L24 84 M30 86 L28 92" c={leg} w={sm ? 2.6 : 2} o={1.4} />
    <Line2 d="M56 58 L68 72 L82 74" c={leg} w={sm ? 3.4 : 2.6} o={1.6} />
    <Line2 d="M82 74 L88 70 M82 74 L88 78" c={leg} w={sm ? 2.6 : 2} o={1.4} />
    <ellipse cx="50" cy="50" rx="19" ry="11.6" transform="rotate(-18 50 50)" fill={body} stroke={INK} strokeWidth={sw} />
    {!sm && [[42, 50], [48, 46], [54, 44], [46, 54], [56, 50], [38, 54]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l3 -1.6`} stroke="#f0e6d6" strokeWidth="1.2" strokeLinecap="round" />)}
    <path d="M60 46 C62 38 64 32 68 26 L76 28 C72 34 70 40 68 48 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M62 24 C62 16 70 13 76 16 C80 18 81 22 80 26 C78 30 72 31 67 30 C63 29 62 27 62 24 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M64 18 L58 8 L66 14 L64 4 L70 13 L72 4 L74 15 Z" fill={dark} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M78 21 L98 23.6 L78 26.6 Z" fill="#3a3a3a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M74 21 C77 21 79 23 78 26 C76 25 74 24 72 24 Z" fill="#4dabf7" />
    <path d="M77 24.6 C79 26 79 28 77 29.4" fill="none" stroke="#f77f00" strokeWidth="1.4" />
    <circle cx="72.6" cy="20.6" r={sm ? 2 : 1.7} fill="#ffd166" stroke={INK} strokeWidth=".7" />
    <circle cx="72.8" cy="20.6" r={sm ? 1 : 0.8} fill={INK} />
  </>);
}
function roadrunners(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(roadrunnerArt(c, true), 50, 50, 0.96));
  return Pennant({ uid, k: 'ab', c: [c[0], c[1]], city: 'ALBUQUERQUE', nick: 'ROADRUNNERS' }, roadrunnerArt(c, false), { artS: 0.38 });
}

export const WEST_MARKS: Record<string, { name: string; draw: (uid: string, sm: boolean, c: Pal) => ReactNode }> = {
  PHX: { name: 'Chill', draw: chill }, SAC: { name: 'Wombats', draw: wombats }, KC: { name: 'Sailors', draw: sailors },
  IE: { name: 'Groves', draw: groves }, SF: { name: 'Fog', draw: fog }, SLC: { name: 'Gulls', draw: gulls },
  OKC: { name: 'Twisters', draw: twisters }, TUL: { name: 'Gushers', draw: gushers }, TUC: { name: 'Stargazers', draw: stargazers },
  FRE: { name: 'Harvesters', draw: harvesters }, CGY: { name: 'Stampede', draw: stampede }, EDM: { name: 'Roughnecks', draw: roughnecks },
  MEX: { name: 'Águilas', draw: aguilas }, GDL: { name: 'Mariachis', draw: mariachis }, MTY: { name: 'Montañeses', draw: montaneses },
  TIJ: { name: 'Fronterizos', draw: fronterizos }, OMA: { name: 'Stockyards', draw: stockyards }, HNL: { name: 'Waves', draw: waves },
  ABQ: { name: 'Roadrunners', draw: roadrunners },
};

// Hand-drawn logos for the league's clubs (the Ivories, Dragoons and Pines are in teamCrests.tsx).
// Each club has a mascot drawn on a 100×100 grid and a frame with its city and nickname; small sizes
// (lists, standings) show the mascot alone on a disc in the club's colors. The colors come from the
// club, so League editor changes follow; nature keeps a few of its own (a puffin's beak, a koala's
// nose, steel, wood, snow).
//  - Baltimore Camels: a dromedary in a teal saddle blanket crossing the dunes to an oasis.
//  - New York Hermits: the hermit of the old tarot card, hooded, lantern raised, under a night sky.
//  - Minneapolis Marauders: a bearded Norse raider in a spectacle helmet over crossed axes, on a round shield.
//  - Newark Monocles: the invisible gentleman: top hat, raised brow, monocle on its chain, handlebar mustache.
//  - Philadelphia Koalas: a koala holding on to a eucalyptus branch.
//  - Cleveland Parasols: a striped beach parasol, tilted into the sun.
//  - Detroit Oxcarts: an ox in front of a cart wheel, the wheel's rim carrying the name.
//  - Chicago Sloths: a three-toed sloth hanging from a mossy branch, smiling.
//  - Birmingham Vulcans: the forge of Vulcan: hammer on anvil, sparks and fire (Birmingham's Vulcan statue).
//  - Cincinnati Narwhals: a narwhal leaping out of an Arctic sea, its tusk breaking out of the frame.
//  - Charlotte Bohemians: a painter's palette and brush.
//  - Atlanta Snowplows: a plow truck, beacon on, throwing snow.
//  - Richmond Samurai: a lacquered kabuto with its golden crest over crossed swords (the armor, no face).
//  - Nashville Librarians: an owl in reading glasses on a stack of books.
//  - Seattle Scorpions: a black scorpion, stinger raised.
//  - Vancouver Drought: a sun in sunglasses over cracked earth (in famously rainy Vancouver).
//  - St. Louis Puffins: an Atlantic puffin, striped beak and all.
//  - Denver Deep: an anglerfish and its glowing lure, seen through a porthole (in the mile-high city).
//  - San Diego Mittens: a knitted mitten with a snowflake (in sunny San Diego).
//  - Oakland Barons: a baron's coronet over a golden oak.
//  - Las Vegas Monks: a monk meditating on a lotus, a halo behind him.
//  - Los Angeles Strollers: a vintage pram rolling past the palms at sunset.
//  - San Jose Typewriters: a vintage typewriter with a sheet in it.
//  - Austin Hush: a crescent moon with a finger to its lips.
//  - San Antonio Frost: a frost crystal with icicles (in hot San Antonio).
//  - Dallas Axolotls: a smiling axolotl with its feathery gills.
//  - Houston Caribou: a caribou with its great antlers and white mane.
import type { ReactNode } from 'react';

export type Pal = [string, string];
const INK = '#1b1a21', PAPER = '#fffaf0', SKIN = '#e2b18a', WOOD = '#7a5230', STEEL = '#a7b0ba', STEEL_D = '#68727d', STEEL_L = '#dfe5ea';
const HEAD = "'Oswald', 'Arial Narrow', Impact, sans-serif", SCRIPT = "'Yellowtail', 'Brush Script MT', cursive";

// ── Colors ──
const rgb = (h: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x808080; return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const dk = (c: string, t = 0.4) => mix(c, '#000000', t), lt = (c: string, t = 0.45) => mix(c, '#ffffff', t);
const lum = (c: string) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const on = (c: string) => (lum(c) > 0.6 ? INK : PAPER); // text on a color

// ── Drawing helpers ──
const f2 = (n: number) => +n.toFixed(2);
// A line drawn twice, ink under color, so it reads as an outlined shape (legs, handles, antlers).
const Line2 = ({ d, c, w, o = 2.6 }: { d: string; c: string; w: number; o?: number }) => (<>
  <path d={d} fill="none" stroke={INK} strokeWidth={w + o} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
</>);
// A fluffy circle: n bumps around (cx, cy).
const fluff = (cx: number, cy: number, r: number, n: number, bump = 0.16) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, x = f2(cx + Math.cos(a) * r), y = f2(cy + Math.sin(a) * r);
    if (!i) { d += `M${x} ${y}`; continue; }
    const am = ((i - 0.5) / n) * Math.PI * 2, rr = r * (1 + bump);
    d += `Q${f2(cx + Math.cos(am) * rr)} ${f2(cy + Math.sin(am) * rr)} ${x} ${y}`;
  }
  return d + 'Z';
};
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f2(100 - +x)} ${y}`); // flip a path of absolute M/L/C/Q/Z commands left↔right
// A 4-point sparkle.
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`;
const star5 = (x: number, y: number, R: number, r: number) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r : R; return f2(x + Math.cos(a) * q) + ',' + f2(y + Math.sin(a) * q); }).join(' ');
// Place a mascot (drawn on 0–100) centered at (x, y), scaled by s.
const place = (art: ReactNode, x: number, y: number, s: number, rot = 0) => <g transform={`translate(${x} ${y}) scale(${s})${rot ? ` rotate(${rot})` : ''} translate(-50 -50)`}>{art}</g>;

// Text along an arc of radius r around the center: over the top, or under the bottom (reading left to right).
// Oswald capitals run about half an em wide; long names are squeezed to fit.
function Arc({ id, text, r, top, size, fill, ls = 1.3, room }: { id: string; text: string; r: number; top: boolean; size: number; fill: string; ls?: number; room?: number }) {
  const d = top ? `M${50 - r} 50 A${r} ${r} 0 0 1 ${50 + r} 50` : `M${50 - r} 50 A${r} ${r} 0 0 0 ${50 + r} 50`;
  const max = room ?? Math.PI * r * (top ? 0.72 : 0.6), est = text.length * (size * 0.5 + ls);
  return (<>
    <path id={id} d={d} fill="none" />
    <text fontFamily={HEAD} fontWeight="700" fontSize={size} fill={fill} letterSpacing={ls}>
      <textPath href={'#' + id} startOffset="50%" textAnchor="middle" {...(est > max ? { textLength: f2(max), lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{text}</textPath>
    </text>
  </>);
}
// A banner with folded tails, gently arched, the text following the arch.
function Ribbon({ id, y, w, h = 12, fill, text, tfill, size = 8.4, ls = 1.4, arch = 2.4, font = HEAD }: { id: string; y: number; w: number; h?: number; fill: string; text: string; tfill?: string; size?: number; ls?: number; arch?: number; font?: string }) {
  const x0 = 50 - w / 2, x1 = 50 + w / 2, y0 = y - h / 2, y1 = y + h / 2, t = 8.5, back = dk(fill, 0.3);
  const tail = (s: number) => { const xa = s < 0 ? x0 : x1, xo = xa + s * t; return `M${f2(xa - s * 3)} ${f2(y0 + 3.6)} L${f2(xo)} ${f2(y0 + 3.6)} L${f2(xo - s * 3.4)} ${f2(y + 3.6)} L${f2(xo)} ${f2(y1 + 3.6)} L${f2(xa - s * 3)} ${f2(y1 + 3.6)} Z`; };
  const mid = y + size * 0.36, est = text.length * (size * (font === HEAD ? 0.5 : 0.42) + ls), max = w - 7;
  return (<>
    <path d={tail(-1)} fill={back} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <path d={tail(1)} fill={back} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <path d={`M${f2(x0)} ${f2(y0)} Q50 ${f2(y0 - arch * 2)} ${f2(x1)} ${f2(y0)} L${f2(x1)} ${f2(y1)} Q50 ${f2(y1 - arch * 2)} ${f2(x0)} ${f2(y1)} Z`} fill={fill} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <path id={id} d={`M${f2(x0 + 3)} ${f2(mid)} Q50 ${f2(mid - arch * 2)} ${f2(x1 - 3)} ${f2(mid)}`} fill="none" />
    <text fontFamily={font} fontWeight={font === HEAD ? 700 : 400} fontSize={size} fill={tfill ?? on(fill)} letterSpacing={ls}>
      <textPath href={'#' + id} startOffset="50%" textAnchor="middle" {...(est > max ? { textLength: f2(max), lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{text}</textPath>
    </text>
  </>);
}

// ── Frames ──
// A roundel: ink rim, a band in `band` with the city over the top and the nickname under the bottom,
// stars at 3 and 9 o'clock, and an inner disc (clipped) for the scene and the mascot. `over` draws on
// top of everything, unclipped (a tusk or sword breaking out of the frame).
interface RingO { uid: string; k: string; band: string; inner: string; city: string; nick: string; text?: string; trim?: string; R?: number }
function Ring(o: RingO, inside: ReactNode, over?: ReactNode) {
  const R = o.R ?? 33.6, cid = o.k + 'c' + o.uid, tx = o.text ?? on(o.band), trim = o.trim ?? tx;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r={R} /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={o.band} />
    <circle cx="50" cy="50" r="45.6" fill="none" stroke={trim} strokeWidth=".7" opacity=".55" />
    <Arc id={o.k + 't' + o.uid} text={o.city} r={R + 4.2} top size={8.2} fill={tx} />
    <Arc id={o.k + 'b' + o.uid} text={o.nick} r={R + 10.4} top={false} size={8.2} fill={tx} />
    <polygon points={star5(R + 8.3 > 45 ? 8.6 : 50 - R - 8.3, 50, 2.7, 1.15)} fill={trim} />
    <polygon points={star5(R + 8.3 > 45 ? 91.4 : 50 + R + 8.3, 50, 2.7, 1.15)} fill={trim} />
    <circle cx="50" cy="50" r={R + 1.7} fill={INK} />
    <g clipPath={`url(#${cid})`}><circle cx="50" cy="50" r={R} fill={o.inner} />{inside}</g>
    {over}
  </>);
}
// A heraldic shield with a top band for the city and a ribbon for the nickname.
const SHIELD = 'M50 3.5 L91 13 V46 C91 71.5 73.5 86.5 50 96.5 C26.5 86.5 9 71.5 9 46 V13 Z';
function Shield(o: { uid: string; k: string; field: string; band: string; city: string; nick: string; ribbon: string; ribbonY?: number }, inside: ReactNode, over?: ReactNode) {
  const cid = o.k + 'c' + o.uid;
  return (<>
    <defs><clipPath id={cid}><path d={SHIELD} /></clipPath></defs>
    <path d={SHIELD} fill={o.field} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <g clipPath={`url(#${cid})`}>
      {inside}
      <path d="M9 13 L50 3.5 L91 13 V25 H9 Z" fill={o.band} />
      <path d="M9 25 H91" stroke={INK} strokeWidth="1.4" />
    </g>
    <text x="50" y="21.4" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="8.2" fill={on(o.band)} letterSpacing="1.4" {...(o.city.length * 5.5 > 62 ? { textLength: 62, lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{o.city}</text>
    <path d={SHIELD} fill="none" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <path d="M50 7.4 L87.2 16 V46 C87.2 69 71.5 82.6 50 92.4 C28.5 82.6 12.8 69 12.8 46 V16 Z" fill="none" stroke={lt(o.band, 0.15)} strokeWidth="1" opacity=".75" />
    {over}
    <Ribbon id={o.k + 'r' + o.uid} y={o.ribbonY ?? 80} w={70} fill={o.ribbon} text={o.nick} />
  </>);
}
// Small sizes: the mascot alone on a disc.
const Disc = (bg: string, art: ReactNode, ring = INK) => (<><circle cx="50" cy="50" r="48.5" fill={bg} stroke={ring} strokeWidth="3" />{art}</>);

// ═════════════════════════════════════════════ Mascots ═════════════════════════════════════════════

// Baltimore Camels
const CAMEL = 'M21 48 C24 40 30 26 40 25 C50 24 54 36 58 42 C62 46.5 68 46.5 72 40 C75 35 76 28 79 25 L86 25 C90 26 93 28 93 31 C93 33 91 34.4 89 34.4 C85 34.4 82.5 34.6 80.5 36.5 C78.5 42 76.5 52 70 58 C64 62 40 63 30 61 C24 60 20 55 21 48 Z';
function camelArt(c: Pal, sm: boolean) {
  const fur = c[0], far = dk(fur, 0.24), hi = lt(fur, 0.32), sw = sm ? 2.6 : 1.8, w = sm ? 5.4 : 4.4;
  const leg = (d: string, col: string, x: number) => (<><Line2 d={d} c={col} w={w} o={2.8} /><ellipse cx={x} cy="88" rx="3.6" ry="1.7" fill={INK} /></>);
  return (<>
    {leg('M57 58 L58.5 73 L56.2 87', far, 56.5)}
    {leg('M27 56 L23 71 L26.2 87', far, 26.5)}
    {leg('M64.5 58 L67 73 L64.4 87', fur, 64.6)}
    {leg('M33.5 58 L30 72 L33.4 87', fur, 33.6)}
    <path d="M22 47 C18.4 50 16.6 55.5 17.4 61" fill="none" stroke={INK} strokeWidth={sm ? 3.2 : 2.4} strokeLinecap="round" />
    <path d={CAMEL} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30 34 C33.5 28 40 26.6 46.5 28.6" fill="none" stroke={hi} strokeWidth="2.6" strokeLinecap="round" />
    {!sm && <>
      <path d="M28.5 35.2 C33 27.6 44 25.9 51.4 31.6 L55.4 46.4 C46 48.6 36 48.6 26.6 46 Z" fill={c[1]} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M29.6 41.6 l2.9 -3.1 l2.9 3.1 l2.9 -3.1 l2.9 3.1 l2.9 -3.1 l2.9 3.1 l2.9 -3.1 l2.9 3.1" fill="none" stroke={PAPER} strokeWidth="1.3" strokeLinejoin="round" />
      {[29, 33, 37, 41, 45, 49, 53].map(x => <path key={x} d={`M${x} ${x < 41 ? 46.8 : 47.6} v2.6`} stroke={lt(c[1], 0.45)} strokeWidth="1.3" strokeLinecap="round" />)}
    </>}
    <path d="M79.4 26 L78.6 21.4 L81.8 24.2 Z" fill={fur} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M83.2 29 Q85 27.3 87 28.7" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="85.1" cy="29.6" r=".95" fill={INK} />
    <path d="M91 29.8 q.9 -.7 1.6 0" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" />
    <path d="M88.6 33.1 Q90.8 32.4 92.7 32.9" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" />
  </>);
}
function camels(uid: string, sm: boolean, c: Pal) {
  const fur = c[0], sand = lt(fur, 0.42), sand2 = lt(fur, 0.24), sky1 = lt(fur, 0.8), sky2 = lt(fur, 0.55);
  if (sm) return Disc(c[1], place(camelArt(c, true), 50, 51, 0.82));
  return Ring({ uid, k: 'cm', band: c[1], inner: sky2, city: 'BALTIMORE', nick: 'CAMELS', text: PAPER }, <>
    <defs><linearGradient id={'cms' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sky1} /><stop offset="1" stopColor={sky2} /></linearGradient></defs>
    <rect x="0" y="0" width="100" height="100" fill={`url(#cms${uid})`} />
    <circle cx="63" cy="43" r="13" fill={mix(fur, '#ffd23f', 0.62)} />
    <circle cx="63" cy="43" r="17" fill="none" stroke={mix(fur, '#ffd23f', 0.62)} strokeWidth="1.2" opacity=".5" />
    <path d="M10 66 C26 57 42 59 54 64 C66 58 80 58 92 62 V100 H10 Z" fill={sand} />
    <path d="M18 60 C19 53 24 47 30 44" fill="none" stroke={WOOD} strokeWidth="2.2" strokeLinecap="round" />
    {[[-1.2, -0.6], [-0.5, -1.2], [0.5, -1.1], [1.2, -0.4], [0.9, 0.5], [-1, 0.4]].map(([dx, dy], i) => <path key={i} d={`M30 44 Q${30 + dx * 6} ${44 + dy * 6 - 2} ${30 + dx * 10} ${44 + dy * 9}`} fill="none" stroke={dk(c[1], 0.1)} strokeWidth="2.6" strokeLinecap="round" />)}
    <ellipse cx="25" cy="66.5" rx="11" ry="2.6" fill={c[1]} opacity=".9" />
    <path d="M4 78 C26 71 48 73 64 79 C76 75 86 73 96 75 V100 H4 Z" fill={sand2} />
    {place(camelArt(c, false), 51, 56, 0.66)}
  </>);
}

// New York Hermits
function hermitArt(u: string, c: Pal, sm: boolean) {
  const robe = c[0], deep = dk(robe, 0.5), hi = lt(robe, 0.22), gold = c[1], sw = sm ? 2.6 : 1.8, beard = '#f3eee4';
  return (<>
    <defs><radialGradient id={'hg' + u}><stop offset="0" stopColor="#fffbea" /><stop offset=".3" stopColor={gold} stopOpacity=".85" /><stop offset="1" stopColor={gold} stopOpacity="0" /></radialGradient></defs>
    <circle cx="76" cy="48" r={sm ? 17 : 21} fill={`url(#hg${u})`} />
    <Line2 d="M24 94 L29.4 15" c={WOOD} w={sm ? 3.8 : 3.2} />
    <path d="M50 7 C62 9 71 25 72 42 C73 54 77 70 84 94 L16 94 C23 70 27 54 28 42 C29 25 38 9 50 7 Z" fill={robe} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M40 68 C38 77 37 86 36.4 94 M60 68 C62 77 63 86 63.6 94" stroke={deep} strokeWidth="1.3" fill="none" opacity=".7" />}
    <path d="M28.5 59 C30.5 56.5 34 56.6 35 59.4 L34.2 63.4 L28.6 62.6 Z" fill={robe} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <circle cx="28.2" cy="58.6" r="3" fill={SKIN} stroke={INK} strokeWidth="1.1" />
    <path d="M34.8 46 C34.8 30.5 42 22 50 22 C58 22 65.2 30.5 65.2 46 C65.2 60 58 70 50 70 C42 70 34.8 60 34.8 46 Z" fill={hi} stroke={INK} strokeWidth={sw} />
    <path d="M38 46.4 C38 32.6 44 25.6 50 25.6 C56 25.6 62 32.6 62 46.4 C62 58 57 66 50 66 C43 66 38 58 38 46.4 Z" fill={deep} />
    <path d="M41.6 44.6 C43.6 39.8 56.4 39.8 58.4 44.6 C58.4 50.6 55 54.6 50 54.6 C45 54.6 41.6 50.6 41.6 44.6 Z" fill={SKIN} />
    <path d="M41.5 43.2 Q45 40 48.6 42.6 M51.4 42.6 Q55 40 58.5 43.2" fill="none" stroke={beard} strokeWidth={sm ? 3 : 2.5} strokeLinecap="round" />
    <circle cx="45.3" cy="45.8" r="1.25" fill={INK} /><circle cx="54.7" cy="45.8" r="1.25" fill={INK} />
    <path d="M50 44.4 L52.3 50.6 Q50 51.7 47.7 50.6 Z" fill={dk(SKIN, 0.12)} />
    <path d="M40 50.4 C39 60.5 43 72.5 50 88 C57 72.5 61 60.5 60 50.4 C57 55.4 54 57.4 50 57.4 C46 57.4 43 55.4 40 50.4 Z" fill={beard} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
    {!sm && <path d="M46 62 C47 70 48 76 50 84 M54 62 C53 70 52 76 50 84" stroke="#cfc6b6" strokeWidth="1" fill="none" />}
    <path d="M42.8 52.6 C45.8 50.6 48.8 51.1 50 53.1 C51.2 51.1 54.2 50.6 57.2 52.6 C55 56.2 52.5 55.6 50 54.7 C47.5 55.6 45 56.2 42.8 52.6 Z" fill="#fffaf3" stroke={INK} strokeWidth=".9" />
    <path d="M62.6 62.4 C66 54 70 48 72 42 L80.2 44.4 C78.2 52.4 74.2 60.4 69 68 Z" fill={robe} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="76" cy="40.4" r="3.4" fill={SKIN} stroke={INK} strokeWidth="1.2" />
    <path d="M76 42.6 V44.6" stroke={INK} strokeWidth="1.4" />
    <path d="M71.2 45 L80.8 45 L79 42.6 L73 42.6 Z" fill={dk(gold, 0.35)} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    <rect x="71.6" y="45" width="8.8" height="10.6" rx="1.5" fill={gold} stroke={INK} strokeWidth="1.2" />
    <path d="M76 47 C78 50 77.6 53 76 54 C74.4 53 74 50 76 47 Z" fill="#fff6d6" />
    <path d="M74.4 45 V55.6 M77.6 45 V55.6" stroke={INK} strokeWidth=".7" opacity=".55" />
    <rect x="70.6" y="55.4" width="10.8" height="2.4" rx="1" fill={dk(gold, 0.35)} stroke={INK} strokeWidth="1" />
  </>);
}
const ARCH = 'M50 3 C70 11.5 87 29 87 55 V95.5 H13 V55 C13 29 30 11.5 50 3 Z';
function hermits(uid: string, sm: boolean, c: Pal) {
  const night = dk(c[0], 0.58), night2 = dk(c[0], 0.3);
  if (sm) return Disc(night, place(hermitArt(uid, c, true), 50, 52, 0.86));
  const cid = 'hmc' + uid;
  return (<>
    <defs>
      <clipPath id={cid}><path d={ARCH} /></clipPath>
      <linearGradient id={'hms' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={night} /><stop offset="1" stopColor={night2} /></linearGradient>
    </defs>
    <path d={ARCH} fill={`url(#hms${uid})`} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <g clipPath={`url(#${cid})`}>
      {[[24, 26], [33, 15], [70, 20], [79, 34], [22, 44], [62, 12], [84, 50]].map(([x, y], i) => <path key={i} d={sparkle(x, y, i % 3 ? 1.3 : 2)} fill={lt(c[1], 0.5)} />)}
      <path d="M26 22 A7 7 0 1 0 34 31 A5.6 5.6 0 1 1 26 22 Z" fill={lt(c[1], 0.55)} />
      <path d="M0 76 C22 66 40 70 52 74 C66 68 82 66 100 72 V100 H0 Z" fill={dk(c[0], 0.66)} />
      {place(hermitArt(uid, c, false), 50, 52, 0.7)}
    </g>
    <path d="M17 87 V55 C17 30.6 32.4 14.6 50 7 C67.6 14.6 83 30.6 83 55 V87" fill="none" stroke={c[1]} strokeWidth="1" opacity=".7" />
    <path d="M13 87.6 H87 V95.5 H13 Z" fill={INK} />
    <text x="50" y="93.9" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="6.4" fill={c[1]} letterSpacing="2">NEW YORK</text>
    <Ribbon id={'hmr' + uid} y={78.6} w={72} fill={c[1]} text="HERMITS" />
  </>);
}

// Minneapolis Marauders
function vikingArt(c: Pal, sm: boolean, axes = true) {
  const hair = c[1], hairD = dk(c[1], 0.24), sw = sm ? 2.6 : 1.8;
  const axe = (s: number) => (
    <g transform={`translate(${s < 0 ? 22 : 78} 21) rotate(${s < 0 ? -41.4 : 41.4})`}>
      <rect x="-2.1" y="-4" width="4.2" height="92" rx="2" fill={WOOD} stroke={INK} strokeWidth="1.5" />
      <path d={s < 0 ? 'M-1.6 -6 L-12.5 -12 C-17.8 -5.5 -18.2 6 -13 13.6 L-1.6 5.4 Z' : 'M1.6 -6 L12.5 -12 C17.8 -5.5 18.2 6 13 13.6 L1.6 5.4 Z'} fill={STEEL} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d={s < 0 ? 'M-12.2 -10.6 C-16.4 -4.6 -16.6 5.4 -12.4 12' : 'M12.2 -10.6 C16.4 -4.6 16.6 5.4 12.4 12'} fill="none" stroke={STEEL_L} strokeWidth="1.4" />
    </g>);
  return (<>
    {axes && <>{axe(-1)}{axe(1)}</>}
    <path d="M27 46 C27 26 37 15 50 15 C63 15 73 26 73 46 Z" fill={STEEL} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 15.6 V43" stroke={STEEL_D} strokeWidth="2.2" />
    <path d="M33.4 39 C33.4 29 39 21.6 45.6 19.4" fill="none" stroke={STEEL_L} strokeWidth="2.8" strokeLinecap="round" opacity=".85" />
    <path d="M31 50 C31 58.5 34 64.5 38 67 L62 67 C66 64.5 69 58.5 69 50 Z" fill={SKIN} stroke={INK} strokeWidth="1.2" />
    <path d="M29 56 C27 72 33 84 42 92 L46 88 L50 95 L54 88 L58 92 C67 84 73 72 71 56 C67 64.5 61 68.5 50 68.5 C39 68.5 33 64.5 29 56 Z" fill={hair} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M38 72 C40 78 42 83 45 87 M50 72 V90 M62 72 C60 78 58 83 55 87 M44 70 C45 76 46.5 80 48 84 M56 70 C55 76 53.5 80 52 84" fill="none" stroke={hairD} strokeWidth="1" />}
    <path d="M41.6 87 l3.6 -1.6 l1.2 2.6 l-3.6 1.6 Z M58.4 87 l-3.6 -1.6 l-1.2 2.6 l3.6 1.6 Z" fill={c[0]} stroke={INK} strokeWidth=".8" />
    <path d="M30 49.6 C30 58 36 62.4 43 60.4 C46 59.4 48 56.4 48.5 52 L50 66 L51.5 52 C52 56.4 54 59.4 57 60.4 C64 62.4 70 58 70 49.6 Z" fill={STEEL} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <ellipse cx="39.6" cy="54" rx="5.6" ry="3.7" fill={INK} /><ellipse cx="60.4" cy="54" rx="5.6" ry="3.7" fill={INK} />
    <ellipse cx="40" cy="54.3" rx="2.6" ry="1.5" fill={PAPER} /><ellipse cx="60" cy="54.3" rx="2.6" ry="1.5" fill={PAPER} />
    <circle cx="40.6" cy="54.3" r=".95" fill={INK} /><circle cx="59.4" cy="54.3" r=".95" fill={INK} />
    <rect x="25" y="41.4" width="50" height="8.6" rx="2" fill={STEEL_D} stroke={INK} strokeWidth="1.4" />
    {[30.5, 40, 60, 69.5].map(x => <circle key={x} cx={x} cy="45.7" r="1.3" fill={STEEL_L} />)}
    <path d="M35.6 64.4 C39.6 59.8 46 59.8 50 62.8 C54 59.8 60.4 59.8 64.4 64.4 C61 70.4 55 68.8 50 66.6 C45 68.8 39 70.4 35.6 64.4 Z" fill={hairD} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
  </>);
}
function marauders(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(vikingArt(c, true, false), 50, 49, 0.92));
  const cid = 'mrc' + uid, planks = dk(c[0], 0.18);
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="39.6" /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={STEEL_D} />
    <circle cx="50" cy="50" r="45.8" fill="none" stroke={STEEL_L} strokeWidth=".7" opacity=".6" />
    {[-14, 0, 14, 166, 180, 194].map(d => { const a = (d * Math.PI) / 180; return <circle key={d} cx={f2(50 + Math.cos(a) * 43.5)} cy={f2(50 + Math.sin(a) * 43.5)} r="1.3" fill={STEEL_L} stroke={INK} strokeWidth=".5" />; })}
    <circle cx="50" cy="50" r="39.6" fill={c[0]} stroke={INK} strokeWidth="1.6" />
    <g clipPath={`url(#${cid})`}>
      {[-30, -18, -6, 6, 18, 30].map(x => <path key={x} d={`M${50 + x} 0 V100`} stroke={planks} strokeWidth="1.2" />)}
      <path d="M6 50 H94 M50 6 V94" stroke={c[1]} strokeWidth="5" opacity=".22" />
      {place(vikingArt(c, false), 50, 47.6, 0.68)}
    </g>
    <Ribbon id={'mrr' + uid} y={80} w={74} fill={c[1]} text="MARAUDERS" />
    <Arc id={'mrt' + uid} text="MINNEAPOLIS" r={41.6} top size={6.6} fill={PAPER} ls={1.5} />
  </>);
}

// Newark Monocles
function monocleArt(c: Pal, sm: boolean) {
  const gold = c[0], night = c[1], sw = sm ? 2.4 : 1.6;
  return (<>
    <path d="M33 9.6 L67 9.6 L65.2 37.4 L34.8 37.4 Z" fill={night} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38.4 12.6 L41.4 12.6 L40.2 29.6 L37.4 29.6 Z" fill={lt(night, 0.3)} />
    <path d="M35.1 30.2 L64.9 30.2 L64.6 36.4 L35.4 36.4 Z" fill={gold} stroke={INK} strokeWidth="1" />
    <path d="M18.6 40.2 C23 34.4 77 34.4 81.4 40.2 C77 45.6 23 45.6 18.6 40.2 Z" fill={night} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M29 52.4 Q36 45.6 44.2 50.6" fill="none" stroke={night} strokeWidth={sm ? 3.6 : 3} strokeLinecap="round" />
    <circle cx="37" cy="56.6" r={sm ? 3.2 : 2.7} fill={night} />
    <path d="M51.6 46 Q60 43.4 69.8 47.2" fill="none" stroke={night} strokeWidth={sm ? 3.6 : 3} strokeLinecap="round" />
    <path d="M61 66.8 C60.6 74.6 55 80.4 50.6 84.2" fill="none" stroke={gold} strokeWidth="1.5" strokeDasharray="1.7 1.2" />
    <circle cx="61" cy="57.2" r="9.6" fill="#eef4f6" stroke={gold} strokeWidth={sm ? 3.8 : 3.2} />
    <circle cx="61" cy="57.2" r="11.3" fill="none" stroke={INK} strokeWidth=".9" />
    <circle cx="61" cy="57.6" r={sm ? 3.2 : 2.8} fill={night} />
    <path d="M55.4 52.6 Q57.8 50.4 61 50.3" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50 66.2 C46 63 38 63 33 67 C29.4 69.8 25.4 70 23 67 C24 73.4 31 75.4 37 73.4 C42 71.8 46 70.2 50 70.2 C54 70.2 58 71.8 63 73.4 C69 75.4 76 73.4 77 67 C74.6 70 70.6 69.8 67 67 C62 63 54 63 50 66.2 Z" fill={night} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M50 86 L39.6 79.6 L39.6 92.4 Z M50 86 L60.4 79.6 L60.4 92.4 Z" fill={gold} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="47.4" y="83.2" width="5.2" height="5.6" rx="1.2" fill={dk(gold, 0.2)} stroke={INK} strokeWidth="1" />
  </>);
}
function monocles(uid: string, sm: boolean, c: Pal) {
  const cream = '#f7efdc';
  if (sm) return Disc(cream, place(monocleArt(c, true), 50, 50, 0.9), c[1]);
  return Ring({ uid, k: 'mn', band: c[1], inner: cream, city: 'NEWARK', nick: 'MONOCLES', text: c[0], trim: c[0] }, <>
    <circle cx="50" cy="50" r="30.4" fill="none" stroke={c[0]} strokeWidth=".8" opacity=".6" />
    {place(monocleArt(c, false), 50, 50.5, 0.66)}
  </>);
}

// Philadelphia Koalas
function koalaArt(c: Pal, sm: boolean, branch = true) {
  const fur = c[0], inner = lt(fur, 0.78), muz = lt(fur, 0.35), leaf = c[1], sw = sm ? 2.6 : 1.8;
  const leaves: [number, number, number][] = [[14, 84.6, -30], [22, 89, 30], [78, 81, -40], [88, 85.6, 20], [70, 87.6, 35]];
  return (<>
    <path d={fluff(25, 34, 14.6, 10, 0.1)} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={fluff(75, 34, 14.6, 10, 0.1)} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={fluff(26.4, 35.4, 8.8, 9, 0.16)} fill={inner} />
    <path d={fluff(73.6, 35.4, 8.8, 9, 0.16)} fill={inner} />
    {branch && <><Line2 d="M5 89 C30 84.6 70 86.6 95 80.4" c={WOOD} w={sm ? 5 : 4.4} />
      {!sm && leaves.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><ellipse rx="7.4" ry="2.9" fill={leaf} stroke={INK} strokeWidth=".9" /><path d="M-6 0 H6" stroke={dk(leaf, 0.3)} strokeWidth=".7" /></g>)}</>}
    <ellipse cx="50" cy="54.4" rx="27.2" ry="24.6" fill={fur} stroke={INK} strokeWidth={sw} />
    <ellipse cx="50" cy="68.4" rx="13.4" ry="7.8" fill={muz} />
    <circle cx="37.6" cy="51" r={sm ? 3.6 : 3.2} fill={INK} /><circle cx="62.4" cy="51" r={sm ? 3.6 : 3.2} fill={INK} />
    <circle cx="38.7" cy="49.9" r="1" fill="#ffffff" /><circle cx="63.5" cy="49.9" r="1" fill="#ffffff" />
    <path d="M43.5 53.2 C43.5 48.6 56.5 48.6 56.5 53.2 L57.4 64.6 C57.4 70.6 42.6 70.6 42.6 64.6 Z" fill="#2b2830" stroke={INK} strokeWidth="1" />
    <path d="M46.4 53.4 C46.4 51.8 48.2 51.2 48.8 52.2 L48.4 60.4" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity=".38" />
    <path d="M45.6 72.4 Q50 75 54.4 72.4" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    {branch && <>
      <ellipse cx="34.4" cy="84.4" rx="8.4" ry="5.6" fill={fur} stroke={INK} strokeWidth={sw} />
      <ellipse cx="65.6" cy="83.2" rx="8.4" ry="5.6" fill={fur} stroke={INK} strokeWidth={sw} />
      {!sm && <path d="M30 87.6 v2.4 M34 88.4 v2.6 M38 87.6 v2.4 M61.2 86.4 v2.4 M65.2 87.2 v2.6 M69.2 86.4 v2.4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />}
    </>}
  </>);
}
function koalas(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(koalaArt(c, true, false), 50, 47, 0.98));
  const field = lt(c[1], 0.12);
  return Shield({ uid, k: 'ko', field, band: c[0], city: 'PHILADELPHIA', nick: 'KOALAS', ribbon: c[0] }, <>
    {[[18, 38, -40], [84, 44, 40], [20, 62, 20], [82, 66, -25]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="3.4" transform={`rotate(${r} ${x} ${y})`} fill={dk(c[1], 0.12)} opacity=".55" />)}
    {place(koalaArt(c, false), 50, 48, 0.58)}
  </>);
}

// Cleveland Parasols
function parasolArt(c: Pal, sm: boolean) {
  const a = c[0], b = PAPER, sw = sm ? 2.6 : 1.8, n = 6;
  const rim = Array.from({ length: n + 1 }, (_, i) => { const th = (i / n) * Math.PI; return [f2(50 - 38 * Math.cos(th)), f2(53 + 9 * Math.sin(th))]; });
  const panels = Array.from({ length: n }, (_, i) => {
    const [x0, y0] = rim[i], [x1, y1] = rim[i + 1], mx = f2((x0 + x1) / 2), my = f2((y0 + y1) / 2 + 6.4);
    return <path key={i} d={`M50 15 Q${x0} ${f2(15 + (y0 - 15) * 0.06)} ${x0} ${y0} Q${mx} ${my} ${x1} ${y1} Q${x1} ${f2(15 + (y1 - 15) * 0.06)} 50 15 Z`} fill={i % 2 ? b : a} stroke={INK} strokeWidth={sw * 0.75} strokeLinejoin="round" />;
  });
  return (<g transform="rotate(-16 50 50)">
    <Line2 d="M50 40 V84 C50 92.6 60.6 93.4 61.4 86" c={dk(WOOD, 0.1)} w={sm ? 3.6 : 3} />
    <path d={`M50 15 Q12 16.2 12 53 Q50 72 88 53 Q88 16.2 50 15 Z`} fill={a} stroke={INK} strokeWidth={sw + 0.6} strokeLinejoin="round" />
    {panels}
    {!sm && rim.slice(1, -1).map(([x, y], i) => <circle key={i} cx={x} cy={y + 1.6} r="1.7" fill={c[1]} stroke={INK} strokeWidth=".8" />)}
    <path d="M24 30 Q34 20.4 46 18.8" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    <circle cx="50" cy="12.4" r="3" fill={c[1]} stroke={INK} strokeWidth="1.3" />
  </g>);
}
function parasols(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(parasolArt(c, true), 50, 50, 0.9));
  return Ring({ uid, k: 'pa', band: c[0], inner: lt(c[1], 0.6), city: 'CLEVELAND', nick: 'PARASOLS', text: PAPER }, <>
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M50 44 L${f2(50 + Math.cos(a - 0.12) * 50)} ${f2(44 + Math.sin(a - 0.12) * 50)} L${f2(50 + Math.cos(a + 0.12) * 50)} ${f2(44 + Math.sin(a + 0.12) * 50)} Z`} fill="#ffffff" opacity=".35" />; })}
    <path d="M0 74 Q12 70 25 74 T50 74 T75 74 T100 74 V100 H0 Z" fill={c[1]} />
    <path d="M0 80 Q12 76 25 80 T50 80 T75 80 T100 80" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity=".6" />
    {place(parasolArt(c, false), 50, 50, 0.7)}
  </>);
}

// Detroit Oxcarts
function oxArt(c: Pal, sm: boolean) {
  const hide = c[0], hideD = dk(hide, 0.3), horn = '#f3e3bf', hornD = '#c9a86a', muz = mix(hide, '#f2caa6', 0.58), sw = sm ? 2.6 : 1.8;
  const HORN = 'M37 34.4 C27 35.4 17 31.4 11 18 C11 25 15 31 21 35.4 C26 38.4 32 39.4 37 39.4 Z', TIP = 'M11 18 C11 22 12.6 25.4 15.2 28.4 L17.8 26.4 C15.2 24 12.6 21 11 18 Z';
  const EAR = 'M34.4 43 C27 41 20 42 15 46.6 C20 51 28 51.6 35.4 48 Z', EARIN = 'M31.4 44.6 C26 44.2 21.6 45.2 18.6 46.8 C22 49 27 49.2 31.6 47.4 Z';
  return (<>
    <path d={HORN} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(HORN)} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={TIP} fill={hornD} /><path d={mirror(TIP)} fill={hornD} />
    <path d={EAR} fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(EAR)} fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={EARIN} fill={lt(hide, 0.4)} /><path d={mirror(EARIN)} fill={lt(hide, 0.4)} />
    <path d="M34 32 C40 27 60 27 66 32 C68.6 42 66.6 53 62.6 62 C60 69 60 77 58 83 C56 88 44 88 42 83 C40 77 40 69 37.4 62 C33.4 53 31.4 42 34 32 Z" fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M47 33 L53 33 L51.8 60 L48.2 60 Z" fill={lt(hide, 0.14)} />}
    <path d="M37.4 32.4 C41.6 25 47 28.4 50 23 C53 28.4 58.4 25 62.6 32.4 C57.6 30.6 54 32.4 50 30.2 C46 32.4 42.4 30.6 37.4 32.4 Z" fill={hideD} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
    <path d="M37.6 45.6 L45 47.8 M62.4 45.6 L55 47.8" stroke={hideD} strokeWidth={sm ? 3 : 2.4} strokeLinecap="round" />
    <circle cx="42" cy="50.4" r={sm ? 3 : 2.6} fill={INK} /><circle cx="58" cy="50.4" r={sm ? 3 : 2.6} fill={INK} />
    <circle cx="42.9" cy="49.5" r=".8" fill="#ffffff" /><circle cx="58.9" cy="49.5" r=".8" fill="#ffffff" />
    <ellipse cx="50" cy="77.6" rx="12.6" ry="9.2" fill={muz} stroke={INK} strokeWidth={sw} />
    <ellipse cx="45.2" cy="77.4" rx="2" ry="3" transform="rotate(-18 45.2 77.4)" fill={dk(muz, 0.55)} />
    <ellipse cx="54.8" cy="77.4" rx="2" ry="3" transform="rotate(18 54.8 77.4)" fill={dk(muz, 0.55)} />
    <path d="M44.6 83.6 Q50 85.6 55.4 83.6" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
  </>);
}
function oxcarts(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(oxArt(c, true), 50, 52, 0.9));
  const wood = mix(c[0], c[1], 0.32), spoke = mix(c[0], c[1], 0.55);
  return Ring({ uid, k: 'ox', band: wood, inner: lt(c[1], 0.45), city: 'DETROIT', nick: 'OXCARTS', text: PAPER, trim: c[1] }, <>
    {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.31; return <Line2 key={i} d={`M50 50 L${f2(50 + Math.cos(a) * 36)} ${f2(50 + Math.sin(a) * 36)}`} c={spoke} w={4.2} o={2} />; })}
    <circle cx="50" cy="50" r="9" fill={wood} stroke={INK} strokeWidth="1.4" />
    {place(oxArt(c, false), 50, 52, 0.62)}
  </>);
}

// Chicago Sloths
function slothArt(c: Pal, sm: boolean, arms = true) {
  const fur = '#8a7860', furD = '#5f5142', mask = c[1], stripe = '#3f3227', moss = c[0], sw = sm ? 2.6 : 1.8;
  const ARM = 'M31.6 60 C24 50 21.6 36 27.6 23 L36.2 23 C33.6 35 35.6 46 41.2 55 Z';
  return (<>
    {arms && <>
      <Line2 d="M3 22 C30 18.6 68 19.4 97 17" c={WOOD} w={sm ? 6.4 : 5.6} />
      {!sm && <><path d="M14 19.2 C18 15.6 24 15.8 27 19 M60 17.6 C64 14.2 72 14.4 76 17.4" fill={moss} stroke={INK} strokeWidth="1" />
        {[[10, 24, 30], [86, 22, -30], [70, 23, 40]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="2.2" transform={`rotate(${r} ${x} ${y})`} fill={moss} stroke={INK} strokeWidth=".8" />)}</>}
      <path d={ARM} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(ARM)} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M28 23 C28 17 31 15.4 32.6 17.4 M31.6 23 C31.8 17 35 15.6 36.4 17.8 M72 23 C72 17 69 15.4 67.4 17.4 M68.4 23 C68.2 17 65 15.6 63.6 17.8" fill="none" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" />
    </>}
    <path d={fluff(50, 62, 22.6, 16, 0.08)} fill={fur} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38.4 45.4 C44 41.6 56 41.6 61.6 45.4 C57.6 44 54 45.6 50 43.8 C46 45.6 42.4 44 38.4 45.4 Z" fill={furD} />
    <path d="M30.6 62 C30.6 50.6 40 45 50 45 C60 45 69.4 50.6 69.4 62 C69.4 73.6 60 79.6 50 79.6 C40 79.6 30.6 73.6 30.6 62 Z" fill={mask} stroke={INK} strokeWidth="1" />
    <path d="M44.4 56.4 C40.4 52.4 32.6 54.2 30.8 60.4 C34.6 62.6 40.6 62.4 44.6 60.4 Z" fill={stripe} /><path d={mirror('M44.4 56.4 C40.4 52.4 32.6 54.2 30.8 60.4 C34.6 62.6 40.6 62.4 44.6 60.4 Z')} fill={stripe} />
    <circle cx="40.2" cy="57.8" r={sm ? 2.6 : 2.2} fill="#0f0c0a" /><circle cx="59.8" cy="57.8" r={sm ? 2.6 : 2.2} fill="#0f0c0a" />
    <circle cx="40.9" cy="57.1" r=".75" fill="#ffffff" /><circle cx="60.5" cy="57.1" r=".75" fill="#ffffff" />
    <ellipse cx="50" cy="64.4" rx="3.6" ry="2.5" fill={stripe} />
    <path d="M43 69.4 Q50 74.6 57 69.4" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
  </>);
}
function sloths(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(slothArt(c, true, false), 50, 41, 1.1));
  return Ring({ uid, k: 'sl', band: dk(c[0], 0.2), inner: lt(c[0], 0.55), city: 'CHICAGO', nick: 'SLOTHS', text: PAPER, trim: c[1] }, <>
    {[[22, 70, 30], [78, 72, -30], [30, 82, 10], [70, 84, -10], [50, 88, 0]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="3.6" transform={`rotate(${r} ${x} ${y})`} fill={c[0]} stroke={INK} strokeWidth=".8" opacity=".9" />)}
    {place(slothArt(c, false), 50, 50, 0.7)}
  </>);
}

// Birmingham Vulcans
function forgeArt(c: Pal, sm: boolean) {
  const fire = c[0], iron = c[1], ironL = lt(iron, 0.32), sw = sm ? 2.6 : 1.8, spark = '#ffd23f', hot = '#fff3c4';
  const FLAME = 'M50 4 C57 15 68 19 65.6 34 C71.6 30 73.6 23.6 72.4 17 C82 25.6 86 40 82 52 C80 58 76 62 72 64 L28 64 C24 62 20 58 18 52 C14 40 18 25.6 27.6 17 C26.4 23.6 28.4 30 34.4 34 C32 19 43 15 50 4 Z';
  return (<>
    <path d={FLAME} fill={fire} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 18 C55 26 62 29 60.6 40 C64.6 37.6 66 33.6 65.4 29.6 C71 36 73 46 70 54 L30 54 C27 46 29 36 34.6 29.6 C34 33.6 35.4 37.6 39.4 40 C38 29 45 26 50 18 Z" fill={spark} />
    <path d="M50 30 C53 35 57 38 56 45 L44 45 C43 38 47 35 50 30 Z" fill={hot} />
    <path d="M6 44 C12 42 20 40 30 40 L84 40 L84 48 L72 50 C66.4 52 64 56 64 62 C66 68 72 70 76 72 L76 82 L24 82 L24 72 C28 70 34 68 36 62 C36 56 34 52 28 50 C20 49 12 47 6 44 Z" fill={iron} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30.6 41.8 H82.6 M10 43.6 C16 42.4 22 41.8 30 41.8" fill="none" stroke={ironL} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M27 76.4 H73" stroke={ironL} strokeWidth="1.4" opacity=".7" />
    <g transform="translate(70 30) rotate(48)">
      <rect x="-2.3" y="-42" width="4.6" height="40" rx="2.2" fill={WOOD} stroke={INK} strokeWidth="1.4" />
      <rect x="-12.4" y="-6.6" width="24.8" height="11.8" rx="1.6" fill={dk(iron, 0.1)} stroke={INK} strokeWidth="1.6" />
      <rect x="-12.4" y="-6.6" width="4.6" height="11.8" rx="1" fill={ironL} stroke={INK} strokeWidth="1" />
    </g>
    {[[52, 34, 3.8], [44, 29, 2.6], [56, 25, 2.2], [40, 36, 2], [61, 33, 1.8]].map(([x, y, r], i) => <path key={i} d={sparkle(x, y, r)} fill={hot} stroke={INK} strokeWidth=".5" />)}
  </>);
}
function vulcans(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(forgeArt(c, true), 50, 50, 0.86));
  return Shield({ uid, k: 'vu', field: c[1], band: c[0], city: 'BIRMINGHAM', nick: 'VULCANS', ribbon: c[0] }, <>
    <path d="M9 70 H91 V100 H9 Z" fill={dk(c[1], 0.3)} />
    {place(forgeArt(c, false), 50, 54, 0.6)}
  </>);
}

// Cincinnati Narwhals
function narwhalArt(c: Pal, sm: boolean, tusk = true) {
  const body = '#c9dce6', bodyD = '#8fb0c2', belly = '#eef6f9', sw = sm ? 2.6 : 1.8;
  const spots: [number, number][] = [[46, 35], [54, 32.4], [40, 41], [61, 35.4], [50, 39.6], [36, 49], [44, 45.6]];
  return (<>
    {tusk && <>
      <path d="M73.4 37 L80.2 30.4 L97.6 8.2 Z" fill="#f4ead2" stroke={INK} strokeWidth={sm ? 1.8 : 1.4} strokeLinejoin="round" />
      {[0.16, 0.3, 0.44, 0.58, 0.72].map(t => { const x = 76.8 + (97.6 - 76.8) * t, y = 33.7 + (8.2 - 33.7) * t, s = 1 - t * 0.75; return <path key={t} d={`M${f2(x - 2.6 * s)} ${f2(y + 0.4 * s)} L${f2(x + 1.2 * s)} ${f2(y - 2.6 * s)}`} stroke="#b9a986" strokeWidth="1" />; })}
    </>}
    <path d="M74 31 C62 24 44 30 34 44 C28 52 24 60 22 66 C16 64 10 66 8 72 C14 72 18 73 21 74 C20 78 22 84 27 88 C28 82 28 76 27 72 C34 66 44 58 56 54 C66 51 76 48 80 42 C81 39 80 35 74 31 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30 66 C42 58 58 53 78 44.4 C70 52 54 58 40 64.4 Z" fill={belly} />
    {!sm && spots.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.2" ry="1.4" fill={bodyD} opacity=".85" />)}
    <path d="M54 52.4 C52 58 48 62 44 63.2 C47 59 49 55 50 51.4 Z" fill={bodyD} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <circle cx="71" cy="37.2" r={sm ? 2 : 1.6} fill={INK} />
    <path d="M77.4 42.4 Q74.6 44 72 43.4" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" />
  </>);
}
function narwhals(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(narwhalArt(c, true), 49, 52, 0.84));
  const sea = c[1];
  return Ring({ uid, k: 'nw', band: sea, inner: dk(sea, 0.25), city: 'CINCINNATI', nick: 'NARWHALS', text: PAPER, trim: c[0] }, <>
    {[[28, 30, 1.6], [70, 22, 1.2], [40, 18, 1], [80, 40, 1.4]].map(([x, y, r], i) => <path key={i} d={sparkle(x, y, r * 1.4)} fill={lt(c[0], 0.5)} />)}
    <path d="M0 70 Q12 64 25 70 T50 70 T75 70 T100 70 V100 H0 Z" fill={c[0]} />
    <path d="M0 78 Q12 72 25 78 T50 78 T75 78 T100 78 V100 H0 Z" fill={dk(c[0], 0.2)} />
  </>, place(narwhalArt(c, false, true), 48, 52, 0.62));
}

// Charlotte Bohemians
function paletteArt(c: Pal, sm: boolean, hole: string) {
  const wood = '#e9c9a0', woodD = '#c9a274', sw = sm ? 2.6 : 1.8;
  const blobs: [number, number, number, string][] = [[33, 45, 7, c[1]], [49.6, 35.6, 7, '#ffd166'], [67, 39.4, 7, PAPER], [75.6, 55.6, 6.4, dk(c[0], 0.15)], [60, 60, 6, '#8c6bc8']];
  return (<g transform="rotate(-10 50 54)">
    <path d="M20 40 C28 22 60 16 78 28 C92 38 92 60 80 70 C70 78 60 72 54 76 C48 80 50 88 42 90 C26 92 12 78 14 60 C15 52 17 46 20 40 Z" fill={wood} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M24 44 C30 30 56 24 72 32" fill="none" stroke="#fff3e2" strokeWidth="2" strokeLinecap="round" opacity=".8" />}
    <ellipse cx="31" cy="71" rx="6.2" ry="5.2" fill={hole} stroke={INK} strokeWidth={sw * 0.8} />
    {!sm && <path d="M38 86 C34 87 28 86 24 82" fill="none" stroke={woodD} strokeWidth="1.6" />}
    {blobs.map(([x, y, r, col], i) => <g key={i}><path d={fluff(x, y, r, 7, 0.12)} fill={col} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />{!sm && <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.24} fill="#ffffff" opacity=".55" />}</g>)}
    <g transform="rotate(38 56 52)">
      <rect x="54" y="30" width="4.4" height="46" rx="2.2" fill={dk(c[0], 0.35)} stroke={INK} strokeWidth="1.3" />
      <rect x="53.4" y="22" width="5.6" height="9" rx=".8" fill={STEEL} stroke={INK} strokeWidth="1.1" />
      <path d="M53.6 22.4 C53 18 54.6 13.6 56.2 10.8 C57.8 13.6 59.4 18 58.8 22.4 Z" fill={c[1]} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    </g>
  </g>);
}
function bohemians(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(paletteArt(c, true, c[0]), 50, 50, 0.86));
  const cid = 'bhc' + uid;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="45" /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={c[1]} />
    <circle cx="50" cy="50" r="45" fill={c[0]} />
    <g clipPath={`url(#${cid})`}>
      {[[18, 30, 3], [84, 36, 2.4], [22, 58, 2], [80, 64, 3.2], [70, 18, 1.8], [30, 16, 1.6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#ffd166' : c[1]} opacity=".8" />)}
      {place(paletteArt(c, false, c[0]), 50, 46, 0.58)}
    </g>
    <Arc id={'bht' + uid} text="CHARLOTTE" r={37.6} top size={7.6} fill={PAPER} ls={2} />
    <g transform="rotate(-7 50 72)">
      <text x="51.6" y="77.6" textAnchor="middle" fontFamily={SCRIPT} fontSize="24" fill={INK} textLength="78" lengthAdjust="spacingAndGlyphs">Bohemians</text>
      <text x="50" y="75.6" textAnchor="middle" fontFamily={SCRIPT} fontSize="24" fill={PAPER} stroke={INK} strokeWidth="2.6" paintOrder="stroke" textLength="78" lengthAdjust="spacingAndGlyphs">Bohemians</text>
      <path d="M16 81 Q48 75 86 79" fill="none" stroke={INK} strokeWidth="4.6" strokeLinecap="round" />
      <path d="M16 81 Q48 75 86 79" fill="none" stroke={c[1]} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  </>);
}

// Atlanta Snowplows
function plowArt(u: string, c: Pal, sm: boolean) {
  const truck = c[0], truckD = dk(c[0], 0.16), dark = c[1], sw = sm ? 2.6 : 1.8, beacon = '#ff9f1c';
  return (<>
    {!sm && [[-62, 9], [-30, 11], [0, 12], [30, 11], [62, 9]].map(([a, l], i) => { const r = (a * Math.PI) / 180; return <path key={i} d={`M${f2(50 + Math.sin(r) * 8)} ${f2(13 - Math.cos(r) * 8)} L${f2(50 + Math.sin(r) * (8 + l))} ${f2(13 - Math.cos(r) * (8 + l))}`} stroke={beacon} strokeWidth="2" strokeLinecap="round" />; })}
    <path d="M44.6 18 C44.6 11.4 55.4 11.4 55.4 18 Z" fill={beacon} stroke={INK} strokeWidth="1.3" />
    <rect x="29.6" y="17.6" width="40.8" height="31" rx="5" fill={truck} stroke={INK} strokeWidth={sw} />
    <rect x="34" y="22" width="32" height="14.6" rx="2" fill="#a8d8f0" stroke={INK} strokeWidth="1.3" />
    <path d="M38 34 L46 23.6 M44 34.4 L51 25" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
    <rect x="24.4" y="25" width="5.2" height="8" rx="1.2" fill={dark} stroke={INK} strokeWidth="1" /><rect x="70.4" y="25" width="5.2" height="8" rx="1.2" fill={dark} stroke={INK} strokeWidth="1" />
    <rect x="31.6" y="47" width="36.8" height="17" rx="2" fill={truckD} stroke={INK} strokeWidth={sw} />
    {[40, 44, 48, 52, 56, 60].map(x => <path key={x} d={`M${x} 50.6 V60.4`} stroke={dark} strokeWidth="1.6" />)}
    <circle cx="36.4" cy="55.4" r="3.4" fill="#fff8d6" stroke={INK} strokeWidth="1.1" /><circle cx="63.6" cy="55.4" r="3.4" fill="#fff8d6" stroke={INK} strokeWidth="1.1" />
    <defs><clipPath id={'pb' + u}><path d="M5 63 L95 63 L91 83.4 C70 79 30 79 9 83.4 Z" /></clipPath></defs>
    <path d="M5 63 L95 63 L91 83.4 C70 79 30 79 9 83.4 Z" fill={dark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <g clipPath={`url(#pb${u})`}>{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${2 + i * 9} 86 L${10 + i * 9} 74 L${14.4 + i * 9} 74 L${6.4 + i * 9} 86 Z`} fill={truck} />)}</g>
    <path d="M5 63 L95 63" stroke={lt(dark, 0.35)} strokeWidth="1.4" />
    {[[6, 57, 4.6], [2, 50, 3.4], [10, 50, 2.6], [94, 57, 4.6], [98, 50, 3.4], [90, 50, 2.6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" stroke={INK} strokeWidth="1" />)}
  </>);
}
function snowplows(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(plowArt(uid + 's', c, true), 50, 51, 0.84));
  return Ring({ uid, k: 'sp', band: c[0], inner: lt(c[1], 0.2), city: 'ATLANTA', nick: 'SNOWPLOWS', text: INK, trim: c[1] }, <>
    {[[22, 28], [78, 26], [30, 46], [70, 44], [50, 22], [16, 60], [84, 58]].map(([x, y], i) => <path key={i} d={`M${x - 2.4} ${y} H${x + 2.4} M${x} ${y - 2.4} V${y + 2.4} M${x - 1.7} ${y - 1.7} L${x + 1.7} ${y + 1.7} M${x - 1.7} ${y + 1.7} L${x + 1.7} ${y - 1.7}`} stroke="#ffffff" strokeWidth=".9" opacity=".8" />)}
    <path d="M0 76 Q25 70 50 74 T100 72 V100 H0 Z" fill="#f4f7fa" />
    {place(plowArt(uid, c, false), 50, 50, 0.66)}
  </>);
}

// Richmond Samurai
function kabutoArt(c: Pal, sm: boolean) {
  const red = c[0], lac = c[1], lacL = lt(lac, 0.22), gold = '#e8b931', goldD = '#a47a12', sw = sm ? 2.6 : 1.8;
  const tier = (y: number, w0: number, w1: number) => `M${50 - w0} ${y} L${50 + w0} ${y} L${50 + w1} ${y + 10} L${50 - w1} ${y + 10} Z`;
  const HORN = 'M48 40 C44 30 36 18 23 5 C29 18 35.4 30 41.4 42 Z', WING = 'M28.4 40 C22 35.6 15.6 37.6 13.6 44 L21.6 50 L30 46.4 Z';
  return (<>
    {[[44, 26, 32], [53, 30, 37], [62, 35, 42]].map(([y, a, b], i) => <g key={i}><path d={tier(y, a, b)} fill={lac} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
      {!sm && Array.from({ length: 9 }, (_, j) => { const x = 50 - a + 4 + j * ((a * 2 - 8) / 8); return <path key={j} d={`M${f2(x)} ${y + 1.6} L${f2(x + (x - 50) * 0.12)} ${y + 8.4}`} stroke={red} strokeWidth="1.3" />; })}</g>)}
    <path d="M28 46 C28 26 38 15.6 50 15.6 C62 15.6 72 26 72 46 Z" fill={lac} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M39 18.6 C36.4 26 35.6 36 36 45 M50 15.6 V45 M61 18.6 C63.6 26 64.4 36 64 45" fill="none" stroke={lacL} strokeWidth="1" />}
    <path d="M34 34 C34.6 26 39 20.4 44.6 18.4" fill="none" stroke={lacL} strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
    <path d={WING} fill={red} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" /><path d={mirror(WING)} fill={red} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M26 44 C36 40 64 40 74 44 L72.4 48.4 C62 45.4 38 45.4 27.6 48.4 Z" fill={lac} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M27 44.6 C37 41 63 41 73 44.6" fill="none" stroke={gold} strokeWidth="1" />
    <path d={HORN} fill={gold} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" /><path d={mirror(HORN)} fill={gold} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="50" cy="36.4" r="5.2" fill={gold} stroke={INK} strokeWidth="1.3" /><circle cx="50" cy="36.4" r="2.6" fill={red} />
    <path d="M34 49 C34 66 42 76.4 50 78.4 C58 76.4 66 66 66 49 Z" fill={red} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M34.6 49.6 L65.4 49.6 L64 55.6 L36 55.6 Z" fill={INK} />
    <path d="M38.6 53 L46 51.6 M61.4 53 L54 51.6" stroke={goldD} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M50 55.6 L52.4 63.4 L47.6 63.4 Z" fill={dk(red, 0.25)} />
    <path d="M40 66.4 C44 63.4 48 64.4 50 66.4 C52 64.4 56 63.4 60 66.4 C56 70.4 52 68.4 50 68.4 C48 68.4 44 70.4 40 66.4 Z" fill="#f2efe6" stroke={INK} strokeWidth=".9" />
    <path d="M44 72.4 Q50 74.6 56 72.4" fill="none" stroke={INK} strokeWidth="1.2" />
    <path d="M38.4 77 L61.6 77 L65.6 88.6 L34.4 88.6 Z" fill={lac} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
    {!sm && <path d="M40 80.6 H60 M39 84.6 H61" stroke={red} strokeWidth="1.2" />}
  </>);
}
function samurai(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(kabutoArt(c, true), 50, 50, 0.92));
  const sword = (s: number) => (
    <g transform={`rotate(${s * 38} 50 50)`}>
      <path d="M48.6 -2 L51.4 -2 L51.4 58 L48.6 58 Z" fill={STEEL_L} stroke={INK} strokeWidth="1.1" />
      <path d="M50 -6 L51.4 -2 L48.6 -2 Z" fill={STEEL_L} stroke={INK} strokeWidth="1" />
      <ellipse cx="50" cy="59.4" rx="5.4" ry="1.8" fill="#e8b931" stroke={INK} strokeWidth="1" />
      <rect x="48.2" y="61" width="3.6" height="17" rx="1.4" fill={c[1]} stroke={INK} strokeWidth="1" />
      <path d="M48.4 64 L51.6 66.4 M48.4 68 L51.6 70.4 M48.4 72 L51.6 74.4" stroke="#f2efe6" strokeWidth=".8" />
    </g>);
  return Ring({ uid, k: 'sa', band: c[1], inner: c[0], city: 'RICHMOND', nick: 'SAMURAI', text: PAPER, trim: '#e8b931' }, <>
    <circle cx="50" cy="44" r="21" fill={lt(c[0], 0.18)} />
    {sword(-1)}{sword(1)}
    {place(kabutoArt(c, false), 50, 50, 0.66)}
  </>);
}

// Nashville Librarians
function owlArt(c: Pal, sm: boolean, books = true) {
  const feath = '#8b5e3c', feathD = '#5f3e26', disc = '#f3e3c3', brass = c[1], sw = sm ? 2.6 : 1.8, red = '#9b2335';
  return (<>
    {books && <>
      <rect x="13" y="80" width="74" height="12" rx="1.6" fill={red} stroke={INK} strokeWidth={sw} />
      <rect x="19" y="70.4" width="64" height="10" rx="1.6" fill={brass} stroke={INK} strokeWidth={sw} />
      <rect x="25" y="62" width="52" height="8.8" rx="1.6" fill={lt(c[0], 0.25)} stroke={INK} strokeWidth={sw} />
      {!sm && <><path d="M79 82 V90 M73 72 V79 M70 63.6 V69.4" stroke={PAPER} strokeWidth="2.2" /><path d="M20 86 H70 M26 75.4 H66 M31 66.4 H62" stroke={PAPER} strokeWidth=".9" opacity=".7" /></>}
    </>}
    <path d="M28 26 L31 11 L40 20 C46 18 54 18 60 20 L69 11 L72 26 C78 36 78 52 72 61 C66 68 58 70 50 70 C42 70 34 68 28 61 C22 52 22 36 28 26 Z" fill={feath} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M28 40 C22.4 50 24 61 31.4 67 C29.6 57 29.6 48 34 40 Z" fill={feathD} /><path d={mirror('M28 40 C22.4 50 24 61 31.4 67 C29.6 57 29.6 48 34 40 Z')} fill={feathD} />
    <ellipse cx="50" cy="57.4" rx="13" ry="10.4" fill={lt(feath, 0.4)} />
    {!sm && [[44, 54], [50, 52.6], [56, 54], [47, 59], [53, 59], [50, 63.6]].map(([x, y], i) => <path key={i} d={`M${x - 2} ${y} L${x} ${y + 2} L${x + 2} ${y}`} fill="none" stroke={feathD} strokeWidth="1" />)}
    <circle cx="40" cy="37" r="12" fill={disc} stroke={INK} strokeWidth="1.2" /><circle cx="60" cy="37" r="12" fill={disc} stroke={INK} strokeWidth="1.2" />
    <circle cx="40" cy="37.4" r="6.8" fill={mix(brass, '#e8a33d', 0.4)} /><circle cx="60" cy="37.4" r="6.8" fill={mix(brass, '#e8a33d', 0.4)} />
    <circle cx="40" cy="37.4" r="3.6" fill={INK} /><circle cx="60" cy="37.4" r="3.6" fill={INK} />
    <circle cx="41.4" cy="36" r="1.2" fill="#ffffff" /><circle cx="61.4" cy="36" r="1.2" fill="#ffffff" />
    <circle cx="40" cy="37.4" r="10" fill="none" stroke={dk(brass, 0.2)} strokeWidth={sm ? 3 : 2.4} /><circle cx="60" cy="37.4" r="10" fill="none" stroke={dk(brass, 0.2)} strokeWidth={sm ? 3 : 2.4} />
    <path d="M48.6 36.4 Q50 34.6 51.4 36.4" fill="none" stroke={dk(brass, 0.2)} strokeWidth="2" />
    <path d="M47.4 44 L52.6 44 L50 51.4 Z" fill="#e8a33d" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    {books && <path d="M43 70 l-1.6 2.6 M45.4 70.4 v2.6 M54.6 70.4 v2.6 M57 70 l1.6 2.6" stroke="#e8a33d" strokeWidth="1.8" strokeLinecap="round" />}
  </>);
}
function librarians(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(owlArt(c, true, false), 50, 52, 1.02));
  return Ring({ uid, k: 'li', band: c[0], inner: lt(c[0], 0.14), city: 'NASHVILLE', nick: 'LIBRARIANS', text: c[1], trim: c[1] }, <>
    <circle cx="50" cy="40" r="22" fill={c[1]} opacity=".18" />
    {place(owlArt(c, false), 50, 51, 0.66)}
  </>);
}

// Seattle Scorpions
function scorpionArt(c: Pal, sm: boolean) {
  const body = '#1c1d20', gloss = lt(c[0], 0.3), sw = sm ? 2.2 : 1.6, w = sm ? 3.6 : 3;
  const LEGS = ['M41 47 L29.6 42.6 L23.4 49', 'M41 52.6 L28.6 51.4 L22.4 58.4', 'M41.6 58 L30 60 L25 68', 'M43 63 L33.4 68.4 L29.6 76'];
  const CLAW = 'M42.4 33 L33 25.4 C27.6 25.4 20.6 23 17.6 16.4 C15.6 11.4 19 6.6 24 7.6 C22.4 10.6 22.6 13.8 25.4 15.8 C27 12.4 30.4 10.8 33.6 11.8 C34 16.4 33.4 20 36.6 23.4 L45 30.6 Z';
  const TAIL: [string, number][] = [['M50 70 C50 81 54 87.4 62 89.4', sm ? 9.4 : 8.6], ['M62 89.4 C72 91 82 84.4 84.4 72', sm ? 8.2 : 7.4], ['M84.4 72 C85.6 62 83 53.6 79.2 47.6', sm ? 7 : 6.2]];
  const joints: [number, number, number][] = [[54.6, 84.4, 30], [65.6, 90.2, 80], [76.6, 87.4, 125], [83.2, 78, 160], [85.2, 65.4, 180], [82.6, 56, 200]];
  return (<>
    {LEGS.map((d, i) => <g key={i}><Line2 d={d} c={body} w={w} o={1.6} /><Line2 d={mirror(d)} c={body} w={w} o={1.6} /></g>)}
    <path d={CLAW} fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(CLAW)} fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {TAIL.map(([d, tw], i) => <path key={'o' + i} d={d} fill="none" stroke={gloss} strokeWidth={tw + 1.6} strokeLinecap="round" />)}
    {TAIL.map(([d, tw], i) => <path key={'f' + i} d={d} fill="none" stroke={body} strokeWidth={tw} strokeLinecap="round" />)}
    {!sm && joints.map(([x, y, a], i) => <path key={i} d={`M${x} ${y - 3} L${x} ${y + 3}`} transform={`rotate(${a} ${x} ${y})`} stroke={gloss} strokeWidth=".9" opacity=".75" />)}
    <ellipse cx="78.6" cy="45.4" rx="5.4" ry="4.6" transform="rotate(-30 78.6 45.4)" fill={body} stroke={gloss} strokeWidth=".9" />
    <path d="M76.4 41.4 C74.6 35.4 70.6 32.4 65.6 32.6 C69.4 35.8 71.4 39 72.8 43.8 Z" fill={body} stroke={gloss} strokeWidth=".9" strokeLinejoin="round" />
    <path d="M65.4 32.6 C64.4 34 64.6 35.6 65.8 36.4 C67 35.6 67.2 34 66.2 32.6 Z" fill={c[0]} />
    <path d="M40 34 C40 28 60 28 60 34 L60 44 C60 47 40 47 40 44 Z" fill={body} stroke={gloss} strokeWidth=".9" />
    <ellipse cx="50" cy="50.4" rx="11" ry="5.6" fill={body} stroke={gloss} strokeWidth=".8" />
    <ellipse cx="50" cy="57.4" rx="10.4" ry="5.2" fill={body} stroke={gloss} strokeWidth=".8" />
    <ellipse cx="50" cy="64" rx="9.4" ry="4.8" fill={body} stroke={gloss} strokeWidth=".8" />
    <ellipse cx="50" cy="69.6" rx="7.4" ry="4" fill={body} stroke={gloss} strokeWidth=".8" />
    <circle cx="46.6" cy="34.4" r="1.3" fill={c[0]} /><circle cx="53.4" cy="34.4" r="1.3" fill={c[0]} />
    {!sm && <path d="M44 31.6 C46 30.4 54 30.4 56 31.6 M43 48.4 Q50 46.4 57 48.4" fill="none" stroke={gloss} strokeWidth="1.2" strokeLinecap="round" opacity=".7" />}
  </>);
}
function scorpions(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(scorpionArt(c, true), 50, 50, 0.92));
  return Shield({ uid, k: 'sc', field: c[0], band: c[1], city: 'SEATTLE', nick: 'SCORPIONS', ribbon: c[1] }, <>
    <path d="M50 25 L90 46 L90 25 Z M50 25 L10 46 L10 25 Z" fill={dk(c[0], 0.12)} />
    {place(scorpionArt(c, false), 50, 54, 0.54)}
  </>);
}

// Vancouver Drought
function sunArt(c: Pal, sm: boolean) {
  const sun = c[1], ray = mix(c[1], '#f3722c', 0.45), sw = sm ? 2.6 : 1.8;
  const rays = Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2 - Math.PI / 2, L = k % 2 ? 37 : 44, w = 0.16;
    return `M${f2(50 + Math.cos(a - w) * 25)} ${f2(48 + Math.sin(a - w) * 25)} L${f2(50 + Math.cos(a) * L)} ${f2(48 + Math.sin(a) * L)} L${f2(50 + Math.cos(a + w) * 25)} ${f2(48 + Math.sin(a + w) * 25)} Z`; }).join(' ');
  return (<>
    <path d={rays} fill={ray} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <circle cx="50" cy="48" r="26" fill={sun} stroke={INK} strokeWidth={sw} />
    {!sm && <path d="M34 36 C37 30 43 26.6 49 26" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity=".6" />}
    <ellipse cx="35.6" cy="58" rx="4.2" ry="2.4" fill={ray} opacity=".7" /><ellipse cx="64.4" cy="58" rx="4.2" ry="2.4" fill={ray} opacity=".7" />
    <path d="M31.6 42 C31.6 37.6 47 37.6 47 42 C47 49 43 52.4 39.4 52.4 C35.6 52.4 31.6 48.6 31.6 42 Z" fill={INK} />
    <path d="M53 42 C53 37.6 68.4 37.6 68.4 42 C68.4 48.6 64.4 52.4 60.6 52.4 C57 52.4 53 49 53 42 Z" fill={INK} />
    <path d="M47 41.6 Q50 39.6 53 41.6 M31.8 41 L26.4 38.6 M68.2 41 L73.6 38.6" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <path d="M35 41.6 L39 47.6 M56.4 41.6 L60.4 47.6" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity=".55" />
    <path d="M39.6 60 Q50 67.4 61.4 57.6" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
  </>);
}
function drought(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(sunArt(c, true), 50, 51.4, 0.92));
  const earth = '#c98a55';
  return Ring({ uid, k: 'dr', band: dk(c[0], 0.25), inner: lt(c[0], 0.2), city: 'VANCOUVER', nick: 'DROUGHT', text: PAPER, trim: c[1] }, <>
    <path d="M0 70 C20 66 34 68 50 67 C66 66 80 66 100 69 V100 H0 Z" fill={earth} />
    <path d="M14 74 L22 78 L20 84 M22 78 L30 76 M40 72 L44 79 L52 80 L56 88 M44 79 L40 86 M64 72 L70 78 L80 76 M70 78 L68 86 M84 78 L90 84" fill="none" stroke={dk(earth, 0.45)} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    {place(sunArt(c, false), 50, 46, 0.66)}
  </>);
}

// St. Louis Puffins
function puffinArt(c: Pal, sm: boolean) {
  const black = '#22232c', white = '#f7f6f1', beak = mix(c[0], '#ff6a00', 0.35), yel = '#ffd23f', slate = '#6a7a90', sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M30 52 C23 64 21 80 23 94 L52 94 C50 82 50 68 52 58 Z" fill={black} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M52 58 C50 68 50 82 52 94 L78 94 C76 80 71 66 63 56 Z" fill={white} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="47.6" cy="40" r="19.6" fill={black} stroke={INK} strokeWidth={sw} />
    <path d="M45 56 C53 60.4 61 60 66.6 55.6 L63 53.2 C57 57.4 51 57 46.6 53.4 Z" fill={black} />
    <path d="M47.6 30.6 C55.6 28.6 63.6 32.4 66.6 40.4 C68.6 48 64.6 54 58.6 55.6 C52.6 57.2 45.6 55.6 42.2 50 C39 44 40.6 33 47.6 30.6 Z" fill={white} stroke={INK} strokeWidth="1" />
    <path d="M64 32 C72 32 82 38.4 87.6 44.4 C82 47.4 72 52.4 64 52.4 Z" fill={beak} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M64 32 C66 32 67.6 32.4 69 33 L69 51.8 C67.6 52.2 66 52.4 64 52.4 Z" fill={slate} stroke={INK} strokeWidth="1" />
    <path d="M69 33 C70.6 33.6 72 34.4 73.4 35.2 L73.4 50.2 C72 50.8 70.6 51.4 69 51.8 Z" fill={yel} stroke={INK} strokeWidth=".9" />
    {!sm && <path d="M77 38 C78.4 41 78.4 47 77 50 M81 40.4 C82 42.6 82 46.6 81 48.4" fill="none" stroke={dk(beak, 0.3)} strokeWidth="1" />}
    <path d="M64.4 44.6 L87.4 44.4" stroke={INK} strokeWidth="1" />
    <circle cx="64.2" cy="47.4" r="1.9" fill="#ff9f1c" stroke={INK} strokeWidth=".7" />
    <circle cx="55.6" cy="38.6" r="3.2" fill="#e85d04" /><circle cx="55.6" cy="38.6" r="2" fill={INK} /><circle cx="56.2" cy="38" r=".6" fill="#ffffff" />
    <path d="M53.6 35.4 L57.4 35.2 L55.6 31.8 Z" fill={slate} /><path d="M52.6 40.2 L46.4 41.4" stroke={slate} strokeWidth="1.3" strokeLinecap="round" />
  </>);
}
function puffins(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(puffinArt(c, true), 47, 52, 0.94));
  return Ring({ uid, k: 'pu', band: c[1], inner: '#cfe7f2', city: 'ST. LOUIS', nick: 'PUFFINS', text: c[0], trim: c[0] }, <>
    <path d="M0 72 C16 68 30 70 44 72 L44 100 H0 Z" fill="#7b8794" />
    <path d="M0 80 Q20 76 40 80 T100 80 V100 H0 Z" fill={lt(c[1], 0.3)} />
    {place(puffinArt(c, false), 48, 50, 0.7)}
  </>);
}

// Denver Deep
function anglerArt(u: string, c: Pal, sm: boolean) {
  const body = dk(c[0], 0.5), bodyL = mix(c[0], '#ffffff', 0.1), glow = c[1], sw = sm ? 2.6 : 1.8;
  const teethU = [62, 67, 72, 77, 82], teethL = [65, 70, 75, 80];
  return (<>
    <defs><radialGradient id={'ag' + u}><stop offset="0" stopColor="#fffbe8" /><stop offset=".35" stopColor={glow} stopOpacity=".8" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient></defs>
    <circle cx="80" cy="17" r={sm ? 14 : 16} fill={`url(#ag${u})`} />
    <path d="M46 30 C45 10 70 4 79.4 15" fill="none" stroke={INK} strokeWidth={sm ? 3.6 : 3} strokeLinecap="round" />
    <path d="M46 30 C45 10 70 4 79.4 15" fill="none" stroke={bodyL} strokeWidth={sm ? 1.6 : 1.2} strokeLinecap="round" />
    <circle cx="80" cy="17.6" r="4.6" fill={glow} stroke={INK} strokeWidth="1.2" />
    <circle cx="78.8" cy="16.4" r="1.4" fill="#ffffff" />
    <path d="M18 54 L4 41 L7 54 L4 67 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30 28 L34 20 L38 27 L42 19 L46 26 Z" fill={body} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M14 54 C14 36 28 24 46 24 C64 24 80 34 85 48 C84 64 76 80 58 84 C50 86 38 86 30 80 C20 74 14 64 14 54 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M22 64 C26 74 36 80 48 81 C40 76 32 70 28 60 Z" fill={bodyL} opacity=".5" />
    <path d="M58 50 C68 45 79 45 86.4 49 C85.4 61 78.4 71.4 65.4 74.4 C61 68 58.4 58.4 58 50 Z" fill="#0a0d17" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    {teethU.map(x => <path key={x} d={`M${x} ${47.6 + (x - 60) * 0.04} L${x + 2} ${54} L${x + 3.6} ${47.4}`} fill={PAPER} stroke={INK} strokeWidth=".6" strokeLinejoin="round" />)}
    {teethL.map((x, i) => <path key={x} d={`M${x} ${72.6 - i * 2.4} L${x + 2} ${65.4 - i * 2.4} L${x + 3.8} ${71.6 - i * 2.6}`} fill={PAPER} stroke={INK} strokeWidth=".6" strokeLinejoin="round" />)}
    <circle cx="52" cy="40" r={sm ? 5 : 4.4} fill={PAPER} stroke={INK} strokeWidth="1.1" /><circle cx="53" cy="40.4" r={sm ? 2.4 : 2.1} fill={INK} />
    <path d="M28 46 C26 52 26 58 29 62" fill="none" stroke={bodyL} strokeWidth="1.4" opacity=".55" />
  </>);
}
function deep(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(anglerArt(uid, c, true), 50, 52, 0.9));
  const cid = 'dpc' + uid, water = dk(c[0], 0.35);
  return (<>
    <defs>
      <clipPath id={cid}><circle cx="50" cy="50" r="33.6" /></clipPath>
      <radialGradient id={'dpw' + uid} cx="50%" cy="25%" r="80%"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={dk(c[0], 0.62)} /></radialGradient>
    </defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill="#b7922d" />
    <circle cx="50" cy="50" r="47.3" fill="none" stroke="#e7c35a" strokeWidth="1" opacity=".8" />
    {[-38, -12, 12, 38, 142, 168, 192, 218].map((d, i) => { const a = (d * Math.PI) / 180; return <g key={i}><circle cx={f2(50 + Math.cos(a) * 40.6)} cy={f2(50 + Math.sin(a) * 40.6)} r="2.3" fill="#8a6c1c" stroke={INK} strokeWidth=".7" /><circle cx={f2(50 + Math.cos(a) * 40.6 - 0.5)} cy={f2(50 + Math.sin(a) * 40.6 - 0.5)} r=".8" fill="#f2d98a" /></g>; })}
    <Arc id={'dpt' + uid} text="DENVER" r={37.6} top size={7.4} fill={INK} ls={2.6} room={30} />
    <Arc id={'dpb' + uid} text="DEEP" r={43.4} top={false} size={8.2} fill={INK} ls={3.4} room={26} />
    <circle cx="50" cy="50" r="35.3" fill={INK} />
    <g clipPath={`url(#${cid})`}>
      <circle cx="50" cy="50" r="33.6" fill={`url(#dpw${uid})`} />
      {[[24, 34, 2], [30, 26, 1.3], [74, 66, 1.6], [70, 74, 1], [22, 70, 1.4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={lt(c[0], 0.5)} strokeWidth=".8" />)}
      <path d="M0 86 C20 78 34 82 50 84 C66 80 80 80 100 84 V100 H0 Z" fill={water} />
      {place(anglerArt(uid, c, false), 50, 52, 0.62)}
    </g>
    <path d="M30 24 A30 30 0 0 1 58 21" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity=".28" />
  </>);
}

// San Diego Mittens
function mittenArt(c: Pal, sm: boolean) {
  const knit = c[0], knitD = dk(c[0], 0.18), cream = c[1], sw = sm ? 2.6 : 1.8;
  const flake = (x: number, y: number, r: number) => [0, 60, 120].map(a => { const t = (a * Math.PI) / 180; return `M${f2(x - Math.cos(t) * r)} ${f2(y - Math.sin(t) * r)} L${f2(x + Math.cos(t) * r)} ${f2(y + Math.sin(t) * r)}`; }).join(' ');
  return (<g transform="rotate(-12 50 52)">
    <path d="M35 68 L35 58 C29 58.6 23 55 20.6 49 C18.6 44 21 38.6 26 38.6 C30 38.6 32.6 42 34 46 L35 46 L35 31 C35 18 42 11.6 50.6 11.6 C59.6 11.6 66 18 66 30 L66 68 Z" fill={knit} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, k) => { const x = 38.4 + k * 5, y = 22 + r * 7.6; return y > 26 || (x > 41 && x < 61) ? <path key={r + '-' + k} d={`M${x - 1.4} ${y} L${x} ${y + 1.8} L${x + 1.4} ${y}`} fill="none" stroke={knitD} strokeWidth=".8" /> : null; }))}
    <path d={flake(50.6, 34, 8.4)} stroke={cream} strokeWidth={sm ? 2.8 : 2.2} strokeLinecap="round" />
    {!sm && [0, 60, 120, 180, 240, 300].map(a => { const t = (a * Math.PI) / 180, x = 50.6 + Math.cos(t) * 6, y = 34 + Math.sin(t) * 6; return <circle key={a} cx={f2(x)} cy={f2(y)} r=".9" fill={cream} />; })}
    <path d="M36.6 59.6 L40.6 55.4 L44.6 59.6 L48.6 55.4 L52.6 59.6 L56.6 55.4 L60.6 59.6 L64.6 55.4" fill="none" stroke={cream} strokeWidth={sm ? 2.6 : 2.1} strokeLinejoin="round" strokeLinecap="round" />
    <path d="M32 67 H69 V86 C69 89 67 91 64 91 H37 C34 91 32 89 32 86 Z" fill={cream} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && [36, 39.6, 43.2, 46.8, 50.4, 54, 57.6, 61.2, 64.8].map(x => <path key={x} d={`M${x} 69.6 V88.6`} stroke={dk(cream, 0.14)} strokeWidth="1.1" />)}
  </g>);
}
function mittens(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(mittenArt(c, true), 50, 50, 0.92), c[0]);
  return Ring({ uid, k: 'mi', band: c[0], inner: lt(c[1], 0.3), city: 'SAN DIEGO', nick: 'MITTENS', text: c[1], trim: c[1] }, <>
    <circle cx="70" cy="30" r="10" fill="#ffd166" opacity=".8" />
    <path d="M0 76 Q25 70 50 76 T100 74 V100 H0 Z" fill={lt(c[0], 0.65)} />
    {place(mittenArt(c, false), 50, 50, 0.7)}
  </>);
}

// Oakland Barons
function coronetArt(c: Pal, sm: boolean) {
  const velvet = c[0], gold = c[1], goldD = dk(c[1], 0.32), sw = sm ? 2.6 : 1.8;
  const pearls = [26, 38, 50, 62, 74];
  return (<>
    <path d="M28.6 47 C28.6 29 38 19 50 19 C62 19 71.4 29 71.4 47 Z" fill={velvet} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M36 38 C36.6 30 41 24.6 46.6 23" fill="none" stroke={lt(velvet, 0.3)} strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
    <circle cx="50" cy="17" r="3.6" fill={gold} stroke={INK} strokeWidth="1.2" />
    {pearls.map((x, i) => { const y = 44.6 - Math.sin((i / 4) * Math.PI) * 2.6; return <g key={x}><rect x={x - 1.2} y={y - 2} width="2.4" height="5" fill={goldD} stroke={INK} strokeWidth=".8" /><circle cx={x} cy={y - 3.6} r={sm ? 4.2 : 3.6} fill="#fbfaf4" stroke={INK} strokeWidth="1.1" /><circle cx={x - 1.1} cy={y - 4.7} r="1" fill="#ffffff" /></g>; })}
    <path d="M23.6 46 C36 42.6 64 42.6 76.4 46 L76.4 56.4 C64 53 36 53 23.6 56.4 Z" fill={gold} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M25 48.4 C37 45.4 63 45.4 75 48.4" fill="none" stroke={lt(gold, 0.45)} strokeWidth="1" />
    {[[32, '#c1121f'], [50, '#1b998b'], [68, '#c1121f']].map(([x, col]) => <ellipse key={x as number} cx={x as number} cy="50.4" rx="2.8" ry="2.3" fill={col as string} stroke={INK} strokeWidth=".9" />)}
    <path d="M23 56 C36 52.6 64 52.6 77 56 L77 63.4 C64 60 36 60 23 63.4 Z" fill="#fbfaf4" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {[29, 39.5, 50, 60.5, 71].map(x => <path key={x} d={`M${x} 56.6 L${x - 1.2} 60.4 M${x} 56.6 L${x} 60.8 M${x} 56.6 L${x + 1.2} 60.4`} stroke={INK} strokeWidth="1" strokeLinecap="round" />)}
  </>);
}
function oakArt(c: Pal) {
  const gold = c[1], goldD = dk(c[1], 0.3), goldL = lt(c[1], 0.3);
  const lobes: [number, number, number][] = [[50, 34, 15], [34, 44, 13], [66, 44, 13], [40, 58, 13], [60, 58, 13], [50, 50, 14]];
  return (<>
    <path d="M45 92 C46.4 84 46.4 74 45 64 L55 64 C53.6 74 53.6 84 55 92 Z" fill={goldD} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M34 94 C40 92 44 90 46.4 86 M66 94 C60 92 56 90 53.6 86 M50 72 L42 64 M50 76 L59 66" fill="none" stroke={goldD} strokeWidth="2.6" strokeLinecap="round" />
    {lobes.map(([x, y, r], i) => <path key={'o' + i} d={fluff(x, y, r + 1.4, 9, 0.14)} fill={INK} />)}
    {lobes.map(([x, y, r], i) => <path key={'f' + i} d={fluff(x, y, r, 9, 0.14)} fill={gold} />)}
    <path d="M30 42 C32 36 38 32 44 31 M46 26 C48 24 52 23 56 24" fill="none" stroke={goldL} strokeWidth="2.4" strokeLinecap="round" />
    {[[40, 52], [60, 50], [50, 62], [33, 58], [67, 58]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y + 1.6} rx="2.4" ry="2.8" fill={goldD} stroke={INK} strokeWidth=".8" /><path d={`M${x - 2.8} ${y} Q${x} ${y - 2.6} ${x + 2.8} ${y} Z`} fill={dk(c[1], 0.5)} /></g>)}
  </>);
}
const OAK_LEAF = 'M0 -9 C2 -8 3 -6 2.4 -5 C4 -5 5 -3 3.6 -2 C5.4 -1.4 5.6 1 3.8 1.6 C5 3 4 5 2 4.6 C2 6.6 1 8 0 9.6 C-1 8 -2 6.6 -2 4.6 C-4 5 -5 3 -3.8 1.6 C-5.6 1 -5.4 -1.4 -3.6 -2 C-5 -3 -4 -5 -2.4 -5 C-3 -6 -2 -8 0 -9 Z';
function barons(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(coronetArt(c, true), 50, 52, 1.02));
  const cid = 'bac' + uid, SH = 'M17 30 H83 V56 C83 76 69 88.6 50 95.6 C31 88.6 17 76 17 56 Z';
  return (<>
    <defs><clipPath id={cid}><path d={SH} /></clipPath></defs>
    {[-1, 1].map(s => <g key={s}><path d={s < 0 ? 'M14 74 C7 62 8 46 16 36' : 'M86 74 C93 62 92 46 84 36'} fill="none" stroke={dk(c[1], 0.25)} strokeWidth="2.4" strokeLinecap="round" />
      {[[s < 0 ? 10 : 90, 64, s * -120], [s < 0 ? 10.2 : 89.8, 51, s * -95], [s < 0 ? 13.6 : 86.4, 39.6, s * -70]].map(([x, y, r], i) => <path key={i} d={OAK_LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(.8)`} fill={c[1]} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />)}</g>)}
    <path d={SH} fill={c[0]} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <g clipPath={`url(#${cid})`}>
      <path d="M17 30 L83 96 M83 30 L17 96" stroke={lt(c[0], 0.1)} strokeWidth="7" />
      {place(oakArt(c), 50, 61, 0.5)}
    </g>
    <path d="M20.6 33.6 H79.4 V56 C79.4 74 67 85.2 50 91.8 C33 85.2 20.6 74 20.6 56 Z" fill="none" stroke={c[1]} strokeWidth="1" opacity=".8" />
    <text x="50" y="41.4" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="6.6" fill={c[1]} letterSpacing="1.8">OAKLAND</text>
    {place(coronetArt(c, false), 50, 18.6, 0.56)}
    <Ribbon id={'bar' + uid} y={84} w={68} fill={c[1]} text="BARONS" />
  </>);
}

// Las Vegas Monks
function monkArt(c: Pal, sm: boolean) {
  const robe = c[1], robeD = dk(c[1], 0.24), sw = sm ? 2.6 : 1.8, petal = '#f6c1cf', petalD = '#e58fa6';
  const PETAL = (x: number, s: number, h: number) => `M${x} 92 C${x + s * 4} 88 ${x + s * 10} 84 ${x + s * 14} ${92 - h} C${x + s * 10} ${93 - h * 0.3} ${x + s * 4} 94 ${x} 92 Z`;
  return (<>
    <circle cx="50" cy="34" r="25" fill={lt(c[1], 0.55)} opacity=".4" />
    <circle cx="50" cy="34" r="25" fill="none" stroke={lt(c[1], 0.4)} strokeWidth="1.4" />
    {!sm && [[-1, 12], [1, 12], [-1, 4], [1, 4]].map(([s, h], i) => <path key={i} d={PETAL(50 + s * (h > 8 ? 14 : 4), s, h)} fill={h > 8 ? petalD : petal} stroke={INK} strokeWidth="1" strokeLinejoin="round" />)}
    <path d="M13.6 80 C13.6 71.6 29.6 68.6 50 70 C70.4 68.6 86.4 71.6 86.4 80 C86.4 88 70.4 90.6 50 90.6 C29.6 90.6 13.6 88 13.6 80 Z" fill={robeD} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 35.4 C43 35.4 37 37.4 33.6 41.4 C29 46.4 27 54 25.6 61 C24.6 66 22.6 70 20.6 73.6 C30 77 40 78 50 78 C60 78 70 77 79.4 73.6 C77.4 70 75.4 66 74.4 61 C73 54 71 46.4 66.4 41.4 C63 37.4 57 35.4 50 35.4 Z" fill={robe} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M33.4 49 C34 59 38 67.6 45.6 71.4 M66.6 49 C66 59 62 67.6 54.4 71.4" fill="none" stroke={robeD} strokeWidth={sm ? 2.4 : 1.8} strokeLinecap="round" />
    <path d="M37.4 41 C46 50 55 58 61.6 68" fill="none" stroke={robeD} strokeWidth={sm ? 2.4 : 1.8} strokeLinecap="round" />
    <ellipse cx="50" cy="71.6" rx="7" ry="3.6" fill={robeD} stroke={INK} strokeWidth="1.1" />
    <path d="M45 35.6 C46 38 54 38 55 35.6 L54 32 L46 32 Z" fill={robeD} />
    <circle cx="50" cy="24.6" r="10.4" fill={robe} stroke={INK} strokeWidth={sw} />
    {!sm && <path d="M40.6 23.4 C41 19.4 44 16 48 15.4" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />}
  </>);
}
function monks(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(monkArt(c, true), 50, 50, 0.96));
  return Ring({ uid, k: 'mo', band: c[1], inner: c[0], city: 'LAS VEGAS', nick: 'MONKS', text: c[0], trim: c[0] }, <>
    {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <circle key={i} cx={f2(50 + Math.cos(a) * 30.6)} cy={f2(50 + Math.sin(a) * 30.6)} r=".9" fill={c[1]} opacity=".7" />; })}
    {place(monkArt(c, false), 50, 51, 0.68)}
  </>);
}

// Los Angeles Strollers
function pramArt(c: Pal, sm: boolean) {
  const body = c[0], hood = dk(c[0], 0.22), trim = c[1], sw = sm ? 2.6 : 1.8;
  const wheel = (x: number) => (<g>
    <circle cx={x} cy="80" r="11" fill={INK} />
    <circle cx={x} cy="80" r="8.6" fill={sm ? dk(c[0], 0.5) : lt(trim, 0.6)} stroke={trim} strokeWidth="2.4" />
    {[0, 30, 60, 90, 120, 150].map(a => { const t = (a * Math.PI) / 180; return <path key={a} d={`M${f2(x - Math.cos(t) * 7.4)} ${f2(80 - Math.sin(t) * 7.4)} L${f2(x + Math.cos(t) * 7.4)} ${f2(80 + Math.sin(t) * 7.4)}`} stroke={trim} strokeWidth="1.1" />; })}
    <circle cx={x} cy="80" r="2.4" fill={trim} stroke={INK} strokeWidth="1" />
  </g>);
  return (<>
    <path d="M32 68 C32 74 36 74 34 80 M68 68 C68 74 64 74 66 80" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    <Line2 d="M80 50 L91 27" c={STEEL} w={2.4} o={1.8} />
    <Line2 d="M86 25 L96 29.6" c={dk(WOOD, 0.1)} w={3.2} o={1.8} />
    <path d="M14 46 L84 46 C84 62 73 70 57 70 L41 70 C25 70 14 61 14 46 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M14.6 46 H83.4 V50.4 H15.4 Z" fill={trim} stroke={INK} strokeWidth="1.1" />
    {!sm && <path d="M22 58 C30 64 48 66 66 63" fill="none" stroke={lt(body, 0.35)} strokeWidth="1.6" strokeLinecap="round" />}
    <path d="M14 46 C14 26 28 13 48 12 L50 46 Z" fill={hood} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && [[18, 30], [25, 20], [35, 14.4]].map(([x, y], i) => <path key={i} d={`M50 46 L${x} ${y}`} stroke={dk(hood, 0.25)} strokeWidth="1.2" />)}
    <path d="M47 12.4 C50 9 54 9.6 55 12.6" fill="none" stroke={INK} strokeWidth="1.4" />
    <circle cx="55.6" cy="12.6" r="2.6" fill={trim} stroke={INK} strokeWidth="1" />
    {wheel(30)}{wheel(70)}
  </>);
}
function strollers(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(dk(c[0], 0.45), place(pramArt(c, true), 50, 48, 0.86));
  const cid = 'stc' + uid, sun1 = '#ffd166', sun2 = '#f28482', palm = dk(c[0], 0.55);
  const tree = (x: number, s: number) => (<g>
    <path d={`M${x} 98 C${x + s * 2} 82 ${x + s * 3} 66 ${x + s * 1} 50`} fill="none" stroke={palm} strokeWidth="2.6" strokeLinecap="round" />
    {[-150, -115, -80, -45, -10].map(a => { const r = (a * Math.PI) / 180, X = x + s * 1; return <path key={a} d={`M${X} 50 Q${f2(X + Math.cos(r) * 8)} ${f2(50 + Math.sin(r) * 8 - 3)} ${f2(X + Math.cos(r) * 14)} ${f2(50 + Math.sin(r) * 14 + 3)}`} fill="none" stroke={palm} strokeWidth="2.4" strokeLinecap="round" />; })}
  </g>);
  return (<>
    <defs>
      <clipPath id={cid}><circle cx="50" cy="50" r="45" /></clipPath>
      <linearGradient id={'sts' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={lt(c[0], 0.55)} /></linearGradient>
      <linearGradient id={'stu' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sun1} /><stop offset="1" stopColor={sun2} /></linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={c[1]} />
    <g clipPath={`url(#${cid})`}>
      <rect x="0" y="0" width="100" height="100" fill={`url(#sts${uid})`} />
      <circle cx="50" cy="52" r="26" fill={`url(#stu${uid})`} />
      {[56, 62, 67, 71].map((y, i) => <rect key={y} x="18" y={y} width="64" height={1.4 + i * 0.5} fill={lt(c[0], 0.55)} />)}
      {tree(18, -1)}{tree(82, 1)}
      <path d="M0 64 H100 V100 H0 Z" fill={dk(c[0], 0.25)} />
      <polygon points={star5(83, 31, 4.6, 1.9)} fill={c[1]} stroke={INK} strokeWidth=".8" />
      {place(pramArt(c, false), 50, 41, 0.5)}
    </g>
    <text x="50" y="13.4" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="6.4" fill={INK} letterSpacing="1.6" opacity=".85">LOS ANGELES</text>
    <g transform="rotate(-7 50 76)">
      <text x="51.6" y="82" textAnchor="middle" fontFamily={SCRIPT} fontSize="24" fill={INK} textLength="76" lengthAdjust="spacingAndGlyphs">Strollers</text>
      <text x="50" y="80" textAnchor="middle" fontFamily={SCRIPT} fontSize="24" fill={c[1]} stroke={INK} strokeWidth="2.6" paintOrder="stroke" textLength="76" lengthAdjust="spacingAndGlyphs">Strollers</text>
    </g>
  </>);
}

// San Jose Typewriters
function typewriterArt(c: Pal, sm: boolean) {
  const body = c[0], bodyD = dk(c[0], 0.2), ink = c[1], sw = sm ? 2.6 : 1.8;
  const rows: [number, number, number][] = [[56.6, 27.6, 7], [63.4, 25.4, 8], [70.2, 24.4, 8]];
  return (<>
    <rect x="33" y="6" width="34" height="34" fill={PAPER} stroke={INK} strokeWidth={sw * 0.8} />
    {!sm && [13, 18, 23, 28].map((y, i) => <rect key={y} x="37" y={y} width={[20, 26, 16, 22][i]} height="1.6" fill={INK} opacity=".35" />)}
    {sm && <text x="50" y="27" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="13" fill={INK}>SJ</text>}
    <rect x="16" y="34" width="68" height="10" rx="5" fill={ink} stroke={INK} strokeWidth="1.2" />
    <circle cx="14.4" cy="39" r="4.6" fill={lt(ink, 0.3)} stroke={INK} strokeWidth="1.2" /><circle cx="85.6" cy="39" r="4.6" fill={lt(ink, 0.3)} stroke={INK} strokeWidth="1.2" />
    <Line2 d="M17 36 C10 33 7 27.6 8 22.4" c={STEEL} w={2.2} o={1.6} />
    <circle cx="8" cy="22" r="2.4" fill={STEEL_L} stroke={INK} strokeWidth="1" />
    <path d="M14 82 L20 45 H80 L86 82 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38 45 A12 6.4 0 0 0 62 45 Z" fill={ink} />
    <circle cx="30.4" cy="48.6" r="3.6" fill={lt(ink, 0.25)} stroke={INK} strokeWidth="1" /><circle cx="69.6" cy="48.6" r="3.6" fill={lt(ink, 0.25)} stroke={INK} strokeWidth="1" />
    <path d="M15.4 76 H84.6 L86 82 H14 Z" fill={bodyD} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    {rows.map(([y, x0, n]) => Array.from({ length: n }, (_, i) => <circle key={y + '-' + i} cx={f2(x0 + i * ((100 - 2 * x0) / (n - 1)))} cy={y} r={sm ? 2.9 : 2.6} fill={PAPER} stroke={INK} strokeWidth="1" />))}
    <rect x="35.6" y="73.4" width="28.8" height="3.6" rx="1.8" fill={PAPER} stroke={INK} strokeWidth="1" />
  </>);
}
function typewriters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(typewriterArt(c, true), 50, 51.4, 0.88), c[0]);
  return Ring({ uid, k: 'ty', band: c[1], inner: lt(c[0], 0.55), city: 'SAN JOSE', nick: 'TYPEWRITERS', text: c[0], trim: c[0] }, <>
    {[22, 34, 46, 58, 70, 82].map(y => <path key={y} d={`M0 ${y} H100`} stroke={c[0]} strokeWidth=".6" opacity=".5" />)}
    {place(typewriterArt(c, false), 50, 51, 0.7)}
  </>);
}

// Austin Hush
function moonArt(c: Pal, sm: boolean) {
  const moon = c[1], moonD = dk(c[1], 0.12), finger = lt(c[1], 0.35), sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M60 13 A38 38 0 1 0 62 87 C52 86 46 80 46 76 C46 73 49.6 72.6 52.4 72 C55 71.4 56 69.6 53.6 68.8 L50.4 68.4 C53.6 67.8 55.6 65.8 53.2 64.6 C52 64 51.4 63.4 52 62.8 C57.6 62 60.4 58.6 56 55 C51.6 51.6 48 49 47 46 C46.6 43 47.6 40.6 49 39 C52 32 56 22 60 13 Z" fill={moon} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <><circle cx="26" cy="36" r="3.4" fill={moonD} /><circle cx="22" cy="60" r="4.6" fill={moonD} /><circle cx="33" cy="76" r="2.6" fill={moonD} /></>}
    <path d="M36.6 47.4 Q40.6 50.6 44.6 47.4" fill="none" stroke={INK} strokeWidth={sm ? 2.2 : 1.7} strokeLinecap="round" />
    {!sm && <path d="M38 48.8 L37.2 51 M40.6 49.8 V52.2 M43.2 48.8 L44 51" stroke={INK} strokeWidth="1" strokeLinecap="round" />}
    <ellipse cx="39.4" cy="58.4" rx="4.2" ry="2.6" fill={dk(c[1], 0.18)} opacity=".6" />
    <path d="M48.6 78 C48.6 74 58.6 74 59.4 78 L59.8 86.4 C59.8 90.6 49 90.6 48.6 86.4 Z" fill={finger} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M51.2 79.4 L51.2 61.4 C51.2 58.4 56 58.4 56 61.4 L56 79.4 Z" fill={finger} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    {!sm && <path d="M52.2 61.8 C52.2 60.2 55 60.2 55 61.8 L55 64 L52.2 64 Z M49.6 82 H59 M49.6 85.4 H59.2" fill="none" stroke={dk(c[1], 0.25)} strokeWidth=".9" />}
  </>);
}
function hush(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(moonArt(c, true), 52, 50, 0.92));
  return Ring({ uid, k: 'hu', band: dk(c[0], 0.3), inner: c[0], city: 'AUSTIN', nick: 'HUSH', text: c[1], trim: c[1] }, <>
    {[[76, 26, 3.2], [82, 46, 2], [72, 66, 2.6], [64, 18, 1.6], [84, 62, 1.4]].map(([x, y, r], i) => <path key={i} d={sparkle(x, y, r * 1.4)} fill={lt(c[1], 0.4)} />)}
    {place(moonArt(c, false), 46, 50, 0.7)}
  </>);
}

// San Antonio Frost
function flakeArt(c: Pal, sm: boolean) {
  const arm = 'M50 50 V12 M50 25 L41.6 17.4 M50 25 L58.4 17.4 M50 36 L44 30.4 M50 36 L56 30.4 M50 13 L46.6 9.6 M50 13 L53.4 9.6';
  return (<>
    {[0, 1, 2, 3, 4, 5].map(k => <path key={'i' + k} d={arm} transform={`rotate(${k * 60} 50 50)`} stroke={INK} strokeWidth={sm ? 9.6 : 7.8} strokeLinecap="round" fill="none" />)}
    {[0, 1, 2, 3, 4, 5].map(k => <path key={'w' + k} d={arm} transform={`rotate(${k * 60} 50 50)`} stroke="#ffffff" strokeWidth={sm ? 5.4 : 4.4} strokeLinecap="round" fill="none" />)}
    {!sm && [0, 1, 2, 3, 4, 5].map(k => <path key={'g' + k} d="M50 48 V16" transform={`rotate(${k * 60} 50 50)`} stroke={lt(c[0], 0.3)} strokeWidth="1.2" strokeLinecap="round" />)}
    <polygon points={Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; return f2(50 + Math.cos(a) * 8.4) + ',' + f2(50 + Math.sin(a) * 8.4); }).join(' ')} fill={c[0]} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="2.6" fill="#ffffff" />
  </>);
}
function frost(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(flakeArt(c, true), 50, 50, 0.92));
  const hex = (r: number) => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return f2(50 + Math.cos(a) * r) + ',' + f2(50 + Math.sin(a) * r); }).join(' ');
  const cid = 'frc' + uid;
  return (<>
    <defs>
      <clipPath id={cid}><polygon points={hex(44.6)} /></clipPath>
      <linearGradient id={'frg' + uid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={lt(c[0], 0.55)} /><stop offset="1" stopColor={c[0]} /></linearGradient>
    </defs>
    <polygon points={hex(50)} fill={INK} />
    <polygon points={hex(47.6)} fill={c[1]} />
    <polygon points={hex(44.6)} fill={`url(#frg${uid})`} />
    <g clipPath={`url(#${cid})`}>
      {[[18, 40], [82, 40], [22, 62], [78, 62], [30, 30], [70, 30]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 2.2)} fill="#ffffff" opacity=".8" />)}
      {place(flakeArt(c, false), 50, 50, 0.6)}
      <rect x="0" y="0" width="100" height="21" fill={c[1]} />
      <path d="M0 21 H100" stroke={INK} strokeWidth="1.4" />
    </g>
    <text x="50" y="17.2" textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize="7.4" fill={lt(c[0], 0.4)} letterSpacing="1.8">SAN ANTONIO</text>
    <Ribbon id={'frr' + uid} y={80} w={62} fill={c[1]} text="FROST" size={9.4} ls={3} />
    {[30, 37, 44, 56, 63, 70].map((x, i) => <path key={x} d={`M${x - 1.8} ${85.6 + (Math.abs(50 - x) > 15 ? 0.5 : -0.4)} L${x} ${91 + (i % 2) * 2.6} L${x + 1.8} ${85.6 + (Math.abs(50 - x) > 15 ? 0.5 : -0.4)} Z`} fill="#ffffff" stroke={INK} strokeWidth=".8" strokeLinejoin="round" />)}
  </>);
}

// Dallas Axolotls
function axolotlArt(c: Pal, sm: boolean) {
  const skin = c[0], gill = mix(c[0], '#d6336c', 0.55), sw = sm ? 2.6 : 1.8;
  const frond = (x0: number, y0: number, deg: number, len: number) => {
    const a = (deg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, dots: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) { const t = i / 7, off = (i % 2 ? 1.8 : -1.8) * (1 - t * 0.3); dots.push([x0 + dx * len * t + px * off, y0 + dy * len * t + py * off, (sm ? 4.6 : 3.8) - t * 1.4]); }
    return dots;
  };
  const fr = [frond(28, 40, -150, 18), frond(24.6, 47.4, 180, 18), frond(26, 55, 150, 17), frond(72, 40, -30, 18), frond(75.4, 47.4, 0, 18), frond(74, 55, 30, 17)].flat();
  return (<>
    {fr.map(([x, y, r], i) => <circle key={'o' + i} cx={f2(x)} cy={f2(y)} r={f2(r + 1)} fill={INK} />)}
    {fr.map(([x, y, r], i) => <circle key={'f' + i} cx={f2(x)} cy={f2(y)} r={f2(r)} fill={gill} />)}
    <path d="M30 72 C26 78 26 82 30 84 M70 72 C74 78 74 82 70 84" fill="none" stroke={INK} strokeWidth={sm ? 6.6 : 5.6} strokeLinecap="round" />
    <path d="M30 72 C26 78 26 82 30 84 M70 72 C74 78 74 82 70 84" fill="none" stroke={skin} strokeWidth={sm ? 3.8 : 3.2} strokeLinecap="round" />
    <path d="M17.6 52 C17.6 36 32 29.6 50 29.6 C68 29.6 82.4 36 82.4 52 C82.4 66 68 74.4 50 74.4 C32 74.4 17.6 66 17.6 52 Z" fill={skin} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M28 40 C34 34.4 42 32.6 50 32.6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".55" />}
    <circle cx="34" cy="48" r={sm ? 3.8 : 3.4} fill={INK} /><circle cx="66" cy="48" r={sm ? 3.8 : 3.4} fill={INK} />
    <circle cx="35.1" cy="46.9" r="1.1" fill="#ffffff" /><circle cx="67.1" cy="46.9" r="1.1" fill="#ffffff" />
    <path d="M33.6 57.6 C40 66 60 66 66.4 57.6" fill="none" stroke={INK} strokeWidth={sm ? 2.6 : 2.1} strokeLinecap="round" />
    <ellipse cx="27.6" cy="60" rx="4.8" ry="2.8" fill={gill} opacity=".45" /><ellipse cx="72.4" cy="60" rx="4.8" ry="2.8" fill={gill} opacity=".45" />
    {!sm && [[44, 40], [56, 40], [50, 38]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill={gill} opacity=".7" />)}
  </>);
}
function axolotls(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(axolotlArt(c, true), 50, 50, 0.92));
  return Ring({ uid, k: 'ax', band: c[1], inner: lt(c[1], 0.3), city: 'DALLAS', nick: 'AXOLOTLS', text: c[0], trim: c[0] }, <>
    {[[20, 30, 2.2], [26, 22, 1.4], [80, 70, 2], [76, 78, 1.2], [84, 30, 1.6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={lt(c[1], 0.7)} strokeWidth=".8" />)}
    <path d="M0 84 C14 78 22 80 30 86 M100 82 C88 76 80 78 72 86" fill="none" stroke={dk(c[1], 0.2)} strokeWidth="3" strokeLinecap="round" />
    {place(axolotlArt(c, false), 50, 50, 0.7)}
  </>);
}

// Houston Caribou
function caribouArt(c: Pal, sm: boolean) {
  const hide = '#7a5a43', hideD = '#4e392b', antler = c[1], mane = '#f3f0e8', sw = sm ? 2.6 : 1.8, w = sm ? 4 : 3.2;
  const ANT = 'M56.4 32 C61.6 25 70 22 75.6 14 C79.6 8.6 79.6 4 75.6 1 M66 23.6 C66 18 64 13 62 10 M74.4 16.4 C77.6 12.6 82 12 86 12 M78.4 8.6 C82.4 6.6 86 3.6 88 1 M57.4 31 C55.6 27 54.4 24 55.6 20 L59.4 18.6';
  const EAR = 'M37.6 44 C31.6 41 25.6 41 21.6 44 C25.6 48 31.6 49 37.6 47 Z';
  return (<>
    <Line2 d={ANT} c={antler} w={w} o={2.4} /><Line2 d={mirror(ANT)} c={antler} w={w} o={2.4} />
    <path d="M30 70 C34 66 40 72 42 78 C44 86 56 86 58 78 C60 72 66 66 70 70 C72 80 68 90 60 96 L57 92 L54 97 L50 93 L46 97 L43 92 L40 96 C32 90 28 80 30 70 Z" fill={mane} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={EAR} fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(EAR)} fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38 34 C42 30 58 30 62 34 C66 42 64 52 60 60 C58 68 58 76 56 82 C54 86 46 86 44 82 C42 76 42 68 40 60 C36 52 34 42 38 34 Z" fill={hide} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M46.6 38 L53.4 38 L54.4 68 L45.6 68 Z" fill={hideD} opacity=".55" />
    <ellipse cx="42.6" cy="49" rx="4.2" ry="3.4" fill={lt(hide, 0.25)} /><ellipse cx="57.4" cy="49" rx="4.2" ry="3.4" fill={lt(hide, 0.25)} />
    <circle cx="42.6" cy="49.2" r={sm ? 2.6 : 2.3} fill={INK} /><circle cx="57.4" cy="49.2" r={sm ? 2.6 : 2.3} fill={INK} />
    <circle cx="43.4" cy="48.4" r=".7" fill="#ffffff" /><circle cx="58.2" cy="48.4" r=".7" fill="#ffffff" />
    <path d="M43 76 C43 72 57 72 57 76 C57 82 53 86 50 86 C47 86 43 82 43 76 Z" fill="#4a3a30" stroke={INK} strokeWidth="1.2" />
    <ellipse cx="46.6" cy="77.6" rx="1.6" ry="2.2" fill="#1f1712" /><ellipse cx="53.4" cy="77.6" rx="1.6" ry="2.2" fill="#1f1712" />
  </>);
}
function caribou(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(caribouArt(c, true), 50, 50, 0.94));
  return Ring({ uid, k: 'ca', band: c[0], inner: lt(c[0], 0.5), city: 'HOUSTON', nick: 'CARIBOU', text: PAPER, trim: c[1] }, <>
    {[[22, 30], [78, 28], [30, 18], [70, 16]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 1.8)} fill="#ffffff" />)}
    <path d="M0 74 L18 60 L30 70 L44 56 L58 70 L72 58 L84 68 L100 60 V100 H0 Z" fill={lt(c[0], 0.2)} />
    <path d="M14 63 L18 60 L22 63.4 M40.4 59.6 L44 56 L48 60 M68.6 61 L72 58 L76 61.4" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round" />
    {place(caribouArt(c, false), 50, 52, 0.68)}
  </>);
}

// ── The league's logos: abbreviation → nickname (a renamed club falls back to the templates) and drawing.
export const MARKS: Record<string, { name: string; draw: (uid: string, sm: boolean, c: Pal) => ReactNode }> = {
  BAL: { name: 'Camels', draw: camels }, NY: { name: 'Hermits', draw: hermits }, MIN: { name: 'Marauders', draw: marauders },
  NWK: { name: 'Monocles', draw: monocles }, PHI: { name: 'Koalas', draw: koalas }, CLE: { name: 'Parasols', draw: parasols },
  DET: { name: 'Oxcarts', draw: oxcarts }, CHI: { name: 'Sloths', draw: sloths }, BHM: { name: 'Vulcans', draw: vulcans },
  CIN: { name: 'Narwhals', draw: narwhals }, CHA: { name: 'Bohemians', draw: bohemians }, ATL: { name: 'Snowplows', draw: snowplows },
  RIC: { name: 'Samurai', draw: samurai }, NSH: { name: 'Librarians', draw: librarians }, SEA: { name: 'Scorpions', draw: scorpions },
  VAN: { name: 'Drought', draw: drought }, STL: { name: 'Puffins', draw: puffins }, DEN: { name: 'Deep', draw: deep },
  SD: { name: 'Mittens', draw: mittens }, OAK: { name: 'Barons', draw: barons }, LV: { name: 'Monks', draw: monks },
  LA: { name: 'Strollers', draw: strollers }, SJ: { name: 'Typewriters', draw: typewriters }, AUS: { name: 'Hush', draw: hush },
  SA: { name: 'Frost', draw: frost }, DAL: { name: 'Axolotls', draw: axolotls }, HOU: { name: 'Caribou', draw: caribou },
};

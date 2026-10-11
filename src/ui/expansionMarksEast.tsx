// Hand-drawn logos for the expansion franchises in the East (data/franchises.ts): a mascot for each
// nickname, set in a layout of its own with the city and nickname (markKit.tsx).
//  - Washington Blossoms: a cherry blossom branch by the Monument.           - Boston Colonials: a tricorn hat.
//  - Miami Flamingos: a flamingo on one leg at an Art Deco sunset.            - Orlando Citrus: an orange with leaves and a blossom.
//  - Jacksonville Navigators: a compass rose.                                  - Indianapolis Crossroads: crossed checkered flags.
//  - Milwaukee Brewmasters: a foaming stein and barley, on a bottle cap.       - Louisville Thoroughbreds: a racehorse in Derby roses, in a horseshoe.
//  - Buffalo Falls: a barrel going over the falls.                             - Rochester Shutters: a flash camera.
//  - Raleigh Gondolas: a gondolier and his gondola.                            - Norfolk Shipwrights: a ship's wheel.
//  - Pittsburgh Ballerinas: pointe shoes hanging by their ribbons.             - Memphis Blues: a guitar on a vinyl record.
//  - Toronto Towers: the CN Tower over the skyline.                            - Montreal Voyageurs: a birchbark canoe and paddles.
//  - Ottawa Skaters: a skate on the Rideau Canal ice.                          - Grand Rapids Craftsmen: a Mission chair over saw and hammer.
//  - London Beefeaters: a Yeoman Warder in his Tudor bonnet.                   - Paris Lumières: the Eiffel Tower lit at night.
//  - Madrid Osos: the bear and the strawberry tree of Madrid's arms.           - Berlin Gatekeepers: the Brandenburg Gate and its quadriga.
//  - New Orleans Second Liners: a trumpet over a fleur-de-lis.                 - Hartford Jesters: a jester in his belled cap.
//  - Providence Emus: an emu in a pearl necklace (the city's jewelry trade).   - Columbus Ibex: an ibex and its ridged horns.
//  - Tampa Sleds: a sled racing down a sand dune.                              - Brooklyn Squares: a square in horn-rimmed glasses, in a square.
import type { ReactNode } from 'react';
import { Arc, Arch, Diamond, Disc, dk, f2, fluff, HEAD, Hexagon, INK, Line2, lite, lt, mirror, mix, Octagon, on, PAPER, Patch, Pennant, place, Ribbon, Ring, Script, Seal, Shield, SKIN, sparkle, star5, STEEL, STEEL_D, STEEL_L, Sunburst, Tag, Txt, Varsity, WOOD, Word, Wordmark, type Pal } from './markKit';

const BARK = '#5b3d26', LEAF = '#3c8d4f', STONE = '#ece6d8', STONE_D = '#c9c1af';
const blossom = (x: number, y: number, r: number, k: string | number) => <g key={k}><path d={fluff(x, y, r, 5, 0.45)} fill="#f7b6cf" stroke={INK} strokeWidth=".7" /><circle cx={x} cy={y} r={r * 0.32} fill="#e05780" /></g>;

// ── Washington Blossoms
const PETAL = 'M0 0 C-6.4 -3.6 -7.4 -11.6 -3.2 -15 L0 -12.6 L3.2 -15 C7.4 -11.6 6.4 -3.6 0 0 Z';
const flower = (x: number, y: number, s: number, rot: number, petal: string, k: string | number, sw = 1.1) => (
  <g key={k} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map(a => <path key={a} d={PETAL} transform={`rotate(${a})`} fill={petal} stroke={INK} strokeWidth={sw / s} strokeLinejoin="round" />)}
    {[0, 72, 144, 216, 288].map(a => <path key={'v' + a} d="M0 -2 L0 -9" transform={`rotate(${a})`} stroke={dk(petal, 0.18)} strokeWidth={0.9 / s} />)}
    <circle r="3.4" fill="#d6336c" stroke={INK} strokeWidth={0.8 / s} />
    {[36, 108, 180, 252, 324].map(a => <circle key={'s' + a} cx="0" cy="-5.4" r="1.1" fill="#ffd43b" transform={`rotate(${a})`} />)}
  </g>);
function blossomArt(c: Pal, sm: boolean) {
  const petal = lt(c[0], 0.55), petalD = lt(c[0], 0.3);
  return (<>
    <Line2 d="M4 86 C22 76 34 70 46 60 C56 52 66 40 92 30" c={BARK} w={sm ? 5.4 : 4.6} o={2.2} />
    <Line2 d="M46 60 C44 50 46 40 52 30" c={BARK} w={sm ? 3.4 : 2.8} o={2} />
    {!sm && <Line2 d="M66 42 C72 46 78 54 80 62" c={BARK} w={2.4} o={1.8} />}
    {!sm && [[20, 76, 30], [86, 28, 0], [80, 62, 20]].map(([x, y, r], i) => <g key={'b' + i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 0 C-3 -3 -3 -7 0 -9 C3 -7 3 -3 0 0 Z" fill={petalD} stroke={INK} strokeWidth="1" /></g>)}
    {!sm && [[60, 20, 0.5, 20], [30, 60, 0.55, -15]].map(([x, y, s, r], i) => flower(x, y, s, r, petalD, 'm' + i))}
    {flower(52, 30, sm ? 1.25 : 1, 10, petal, 'big', sm ? 1.6 : 1.2)}
    {flower(sm ? 26 : 30, sm ? 74 : 72, sm ? 0.85 : 0.72, -20, petal, 'lo', sm ? 1.6 : 1.1)}
    {!sm && flower(76, 46, 0.66, 30, petal, 'r')}
  </>);
}
function blossoms(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(blossomArt(c, true), 50, 50, 0.92));
  return Tag({ uid, k: 'wa', c: [lt(c[1], 0.7), c[1]], city: 'WASHINGTON', nick: 'BLOSSOMS', bg: lt(c[1], 0.72) }, blossomArt(c, false), <>
    <path d={`M${50 - 3.4} 64 L${50 + 3.4} 64 L${50 + 2.2} 30 L50 25 L${50 - 2.2} 30 Z`} fill="#ffffff" opacity=".8" />
    <path d="M0 60 C30 56 70 56 100 60 V100 H0 Z" fill={lt(c[1], 0.45)} />
    <path d="M10 64 H34 M60 66 H88" stroke="#ffffff" strokeWidth="1.2" opacity=".6" />
    {[[16, 30, 20], [86, 52, -30], [24, 52, 60], [82, 26, 10]].map(([x, y, r], i) => <path key={i} d="M0 0 C-2 -1.6 -2 -4 0 -5 C2 -4 2 -1.6 0 0 Z" fill={lt(c[0], 0.45)} stroke={INK} strokeWidth=".4" transform={`translate(${x} ${y}) rotate(${r})`} />)}
  </>, { artY: 45, artS: 0.56, plate: c[0] });
}

// ── Boston Colonials
function tricornArt(c: Pal, sm: boolean) {
  const felt = '#1f2235', feltL = '#3a3f5c', trim = c[1], sw = sm ? 2.6 : 1.8;
  const FRONT = 'M8 52 C16 40 30 36 50 38 C70 36 84 40 92 52 C82 50 70 52 62 58 C58 62 54 65 50 65 C46 65 42 62 38 58 C30 52 18 50 8 52 Z';
  return (<>
    <path d="M17 46 C23 25 39 17 50 17 C61 17 77 25 83 46 C70 40 30 40 17 46 Z" fill={feltL} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M32 44 C32 30 40 23 50 23 C60 23 68 30 68 44 Z" fill={felt} stroke={INK} strokeWidth={sw} />
    <path d="M38 30 C40 26 44 25 47 25" fill="none" stroke={feltL} strokeWidth="2" strokeLinecap="round" />
    <path d={FRONT} fill={felt} stroke={INK} strokeWidth={sw + 0.6} strokeLinejoin="round" />
    <path d="M10.6 51 C18 42 31 38.6 50 40.4 C69 38.6 82 42 89.4 51" fill="none" stroke={trim} strokeWidth={sm ? 3 : 2.4} strokeLinecap="round" />
    <path d={fluff(31, 46.6, 6, 12, 0.14)} fill={INK} />
    <circle cx="31" cy="46.6" r="3" fill={PAPER} /><circle cx="31" cy="46.6" r="1.3" fill={trim} />
    <path d="M50 64 C52 60 56 57 60 56" fill="none" stroke={feltL} strokeWidth="1.4" opacity=".8" />
  </>);
}
function colonials(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(tricornArt(c, true), 50, 54, 1.0));
  return Shield({ uid, k: 'bo', field: c[0], band: c[1], city: 'BOSTON', nick: 'COLONIALS', ribbon: c[1] }, <>
    {Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.92 + (i / 12) * 1.16); return <polygon key={i} points={star5(f2(50 + Math.cos(a) * 30), f2(58 + Math.sin(a) * 28), 2.4, 1)} fill={PAPER} />; })}
    {place(tricornArt(c, false), 50, 54, 0.64)}
  </>);
}

// ── Miami Flamingos
function flamingoArt(c: Pal, sm: boolean) {
  const pink = c[0], deep = mix(c[0], '#c9184a', 0.45), leg = mix(c[0], '#b5174a', 0.35), sw = sm ? 2.6 : 1.8;
  return (<>
    <Line2 d="M46.6 60 L47 76 L46 92" c={leg} w={sm ? 3.2 : 2.4} o={2} />
    <Line2 d="M51 60 L58 70 L48 74" c={leg} w={sm ? 3 : 2.2} o={2} />
    <path d="M44 92 L50 92" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M30 44 L18 40 L23 48 L16 53 L28 53 Z" fill={deep} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <ellipse cx="44" cy="50" rx="17" ry="11" transform="rotate(-12 44 50)" fill={pink} stroke={INK} strokeWidth={sw} />
    <path d="M33 46.4 C40 40 52 40 58 46 C52 50.4 44 54 36 54 Z" fill={deep} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    {!sm && <path d="M38 49 C44 47 50 46 54 46.6 M40 52 C45 50.6 50 50 53 50" fill="none" stroke={pink} strokeWidth=".9" />}
    <Line2 d="M56 44 C64 38 64 30 58 24 C52 18 54 10 62 9" c={pink} w={sm ? 6 : 5.2} o={2.4} />
    <ellipse cx="63.4" cy="9.6" rx="5.2" ry="4.2" fill={pink} stroke={INK} strokeWidth="1.2" />
    <path d="M67 8.6 C70.4 8.6 72.6 11 73.2 14.4 L71.4 19 C70.6 15.4 69 13.2 66.4 12.8 Z" fill={PAPER} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    <path d="M73 15 L71.4 19 L70.4 16.6 Z" fill={INK} />
    <circle cx="63.8" cy="8.6" r=".95" fill={INK} />
  </>);
}
function flamingos(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(flamingoArt(c, true), 50, 50, 0.92));
  return Script({ uid, k: 'mi', c: [lt(c[1], 0.5), c[0]], city: 'MIAMI', nick: 'Flamingos' }, flamingoArt(c, false), <>
    {Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return <path key={i} d={`M50 62 L${f2(50 + Math.cos(a - 0.1) * 60)} ${f2(62 + Math.sin(a - 0.1) * 60)} L${f2(50 + Math.cos(a + 0.1) * 60)} ${f2(62 + Math.sin(a + 0.1) * 60)} Z`} fill={i % 2 ? '#ffd6a5' : lt(c[0], 0.55)} />; })}
    <circle cx="50" cy="62" r="14" fill="#ffb4a2" />
    <path d="M0 62 H100 V100 H0 Z" fill={c[1]} />
    <path d="M10 68 H40 M58 70 H90 M24 75 H76" stroke="#ffffff" strokeWidth="1.2" opacity=".6" />
  </>, { artY: 44, artS: 0.56, swash: c[1] });
}

// ── Orlando Citrus
function orangeArt(c: Pal, sm: boolean) {
  const o = c[0], sw = sm ? 2.6 : 1.8, leaf = c[1];
  return (<>
    <circle cx="50" cy="57" r="30" fill={o} stroke={INK} strokeWidth={sw} />
    {!sm && [[36, 50], [44, 64], [58, 70], [64, 52], [52, 46], [40, 74], [68, 66], [30, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill={dk(o, 0.18)} />)}
    <path d="M30 48 C32 39 38 33 46 31" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity=".45" />
    <path d="M49 28 L50 21 L51.6 28 Z" fill={WOOD} stroke={INK} strokeWidth="1" />
    <path d="M50 26 C42 14 30 14 24 18 C30 26 40 28 50 26 Z" fill={leaf} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M50 26 C56 12 68 10 74 14 C70 22 60 28 50 26 Z" fill={leaf} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    {!sm && <path d="M48 25.4 C40 21 32 19 26 18.6 M52 25.4 C58 19 66 15 72 14.4" fill="none" stroke={dk(leaf, 0.3)} strokeWidth=".9" />}
    <path d={fluff(64, 23, 4.6, 5, 0.42)} fill={PAPER} stroke={INK} strokeWidth=".9" />
    <circle cx="64" cy="23" r="1.5" fill="#ffd23f" />
  </>);
}
function citrus(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(orangeArt(c, true), 50, 48, 0.92));
  return Sunburst({ uid, k: 'or', c: [lt(c[0], 0.35), c[1]], city: 'ORLANDO', nick: 'CITRUS' }, orangeArt(c, false), { artY: 44, artS: 0.56, ray: lt(c[0], 0.55), core: lt(c[1], 0.55) });
}

// ── Jacksonville Navigators
function compassArt(c: Pal, sm: boolean) {
  const pts: ReactNode[] = [];
  [1, 0].forEach(longPass => {
    for (let k = 0; k < 8; k++) {
      const long = k % 2 === 0; if (long !== !!longPass) continue;
      const a = (k * Math.PI) / 4 - Math.PI / 2, L = long ? 44 : 28, w = long ? 8.4 : 6.4, tx = 50 + Math.cos(a) * L, ty = 50 + Math.sin(a) * L;
      const px = -Math.sin(a), py = Math.cos(a), bx = 50 + Math.cos(a) * L * 0.24, by = 50 + Math.sin(a) * L * 0.24;
      const lightC = k === 0 ? c[1] : PAPER, darkC = k === 0 ? dk(c[1], 0.3) : c[0];
      pts.push(<path key={k + 'a'} d={`M50 50 L${f2(bx + px * w)} ${f2(by + py * w)} L${f2(tx)} ${f2(ty)} Z`} fill={lightC} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />);
      pts.push(<path key={k + 'b'} d={`M50 50 L${f2(bx - px * w)} ${f2(by - py * w)} L${f2(tx)} ${f2(ty)} Z`} fill={darkC} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />);
    }
  });
  return (<>
    <circle cx="50" cy="50" r="30" fill="none" stroke={INK} strokeWidth={sm ? 3 : 2} />
    {!sm && Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2, r1 = i % 3 ? 31.4 : 30.2; return <path key={i} d={`M${f2(50 + Math.cos(a) * r1)} ${f2(50 + Math.sin(a) * r1)} L${f2(50 + Math.cos(a) * 33)} ${f2(50 + Math.sin(a) * 33)}`} stroke={INK} strokeWidth=".7" />; })}
    {pts}
    <circle cx="50" cy="50" r="5.2" fill={c[1]} stroke={INK} strokeWidth="1.3" /><circle cx="50" cy="50" r="1.8" fill={INK} />
  </>);
}
function navigators(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(compassArt(c, true), 50, 50, 0.96));
  return Ring({ uid, k: 'ja', band: c[0], inner: lt(c[0], 0.7), city: 'JACKSONVILLE', nick: 'NAVIGATORS', text: PAPER, trim: c[1] }, <>
    <path d="M0 50 H100 M50 0 V100" stroke={c[0]} strokeWidth=".6" opacity=".4" />
    {place(compassArt(c, false), 50, 50, 0.7)}
  </>);
}

// ── Indianapolis Crossroads
function flagsArt(u: string, c: Pal, sm: boolean) {
  const FLAG = 'M0 0 C8 -3 18 3 28 0 L28 19 C18 22 8 16 0 19 Z';
  const flag = (x: number, y: number, s: number, key: string) => (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      <defs><clipPath id={u + key}><path d={FLAG} /></clipPath></defs>
      <path d={FLAG} fill={PAPER} />
      <g clipPath={`url(#${u + key})`}>{Array.from({ length: 24 }, (_, i) => { const col = i % 6, row = Math.floor(i / 6); return (col + row) % 2 ? null : <rect key={i} x={col * 4.7} y={row * 5 - 2} width="4.7" height="5" fill={INK} transform={`skewY(${col < 3 ? -4 : 4})`} />; })}</g>
      <path d={FLAG} fill="none" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </g>);
  return (<>
    <Line2 d="M26 92 L70 12" c={STEEL_L} w={sm ? 3.4 : 2.6} o={2} />
    <Line2 d="M74 92 L30 12" c={STEEL_L} w={sm ? 3.4 : 2.6} o={2} />
    {flag(31, 13, -1, 'l')}{flag(69, 13, 1, 'r')}
    <circle cx="70" cy="12" r="2.4" fill={c[1]} stroke={INK} strokeWidth=".9" /><circle cx="30" cy="12" r="2.4" fill={c[1]} stroke={INK} strokeWidth=".9" />
    <polygon points={star5(50, 70, sm ? 11 : 9, sm ? 4.6 : 3.8)} fill={c[1]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
  </>);
}
function crossroads(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(flagsArt(uid + 's', c, true), 50, 52, 0.94));
  return Shield({ uid, k: 'in', field: c[0], band: c[1], city: 'INDIANAPOLIS', nick: 'CROSSROADS', ribbon: c[1] }, <>
    <path d="M50 25 V100 M9 58 H91" stroke={lt(c[0], 0.14)} strokeWidth="12" />
    {place(flagsArt(uid, c, false), 50, 51, 0.62)}
  </>);
}

// ── Milwaukee Brewmasters
function steinArt(c: Pal, sm: boolean) {
  const beer = mix(c[0], '#f2a516', 0.4), sw = sm ? 2.6 : 1.8, gold = mix(c[0], '#e9c46a', 0.5);
  const barley = (s: number) => (<g>
    <path d={s < 0 ? 'M30 90 C24 70 20 48 16 26' : 'M70 90 C76 70 80 48 84 26'} fill="none" stroke={gold} strokeWidth="1.8" />
    {[30, 37, 44, 51, 58].map((y, i) => { const x = s < 0 ? 16 + (y - 26) * 0.12 + 2 : 84 - (y - 26) * 0.12 - 2; return <g key={i}><ellipse cx={x - 2.4} cy={y} rx="1.9" ry="3.2" transform={`rotate(-25 ${x - 2.4} ${y})`} fill={gold} stroke={INK} strokeWidth=".6" /><ellipse cx={x + 2.4} cy={y} rx="1.9" ry="3.2" transform={`rotate(25 ${x + 2.4} ${y})`} fill={gold} stroke={INK} strokeWidth=".6" /></g>; })}
  </g>);
  return (<>
    {!sm && <>{barley(-1)}{barley(1)}</>}
    <path d="M62 44 C78 43 80 50 80 61 C80 73 76 79 62 79" fill="none" stroke={INK} strokeWidth={sm ? 9.6 : 8.6} strokeLinecap="round" />
    <path d="M62 44 C78 43 80 50 80 61 C80 73 76 79 62 79" fill="none" stroke={lt(beer, 0.2)} strokeWidth={sm ? 5.6 : 5} strokeLinecap="round" />
    <path d="M28 34 L65 34 L63 88 C63 90.6 61 92 58.6 92 L34.4 92 C32 92 30 90.6 30 88 Z" fill={beer} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M35 42 L36 86 M41 42 L41.6 86" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    {!sm && [[48, 76, 1.4], [54, 62, 1], [50, 50, 1.2], [57, 82, 1]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff3c4" opacity=".8" />)}
    <path d="M24 36 C22 28 30 22 36 25 C38 18 48 16 52 22 C56 16 66 18 67 25 C73 25 75 32 71 36 C71 40 66 41 63 39 L63 46 C63 49 59 49 59 46 L59 40 L34 40 C30 42 24 41 24 36 Z" fill={PAPER} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
  </>);
}
function brewmasters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(steinArt(c, true), 52, 52, 0.92));
  return Seal({ uid, k: 'mk', c: [c[1], c[0]], city: 'MILWAUKEE', nick: 'BREWMASTERS', bg: lt(c[0], 0.6) }, steinArt(c, false), undefined, { artS: 0.5, artY: 51 });
}

// ── Louisville Thoroughbreds
function horseArt(c: Pal, sm: boolean, roses = true) {
  const coat = '#7a4a2a', mane = '#2e1d12', sw = sm ? 2.6 : 1.8, strap = c[1] === '#ffffff' ? INK : dk(c[1], 0.35);
  return (<>
    <path d="M57 10 L61 2 L63.4 11 C71 17 77 29 81 45 C85 61 87 79 89 96 L46 96 C46 86 44 78 40 72 C34 74 26 76 20 74 C14 72 12 66 14 62 C16 56 22 50 28 44 C36 34 44 22 50 14 L52.4 5 Z" fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M63.4 11 C70 18 76 28 80 42 C83 54 84 66 85 78 C78 66 74 52 72 40 C70 30 67 20 63.4 11 Z" fill={mane} />
    {!sm && <path d="M70 26 C73 36 75 46 76 56 M74 30 C77 40 79 52 80 62" fill="none" stroke="#5a3a24" strokeWidth="1" />}
    <path d="M48 20 C42 30 34 42 26 52 C22 57 18 62 18 66 C24 60 32 50 40 40 C44 34 48 28 50 22 Z" fill="#f2ebe0" opacity=".95" />
    <path d="M22 58 C26 62 32 66 38 66 M30 46 C36 46 42 44 46 40 M46 40 L50 16" fill="none" stroke={strap} strokeWidth={sm ? 2.4 : 1.8} strokeLinecap="round" />
    <circle cx="38" cy="66" r="1.8" fill={STEEL_L} stroke={INK} strokeWidth=".7" />
    <circle cx="44" cy="32" r={sm ? 2.4 : 2} fill={INK} /><circle cx="44.7" cy="31.3" r=".6" fill="#ffffff" />
    <ellipse cx="19" cy="65" rx="1.6" ry="2.2" fill={INK} />
    {roses && !sm && <>
      <path d="M44 88 C54 84 70 84 88 88" fill="none" stroke={LEAF} strokeWidth="3.4" strokeLinecap="round" />
      {[46, 53, 60, 67, 74, 81].map((x, i) => <g key={x}><circle cx={x} cy={86 - Math.sin((i / 5) * Math.PI) * 2.6} r="3.6" fill="#c1121f" stroke={INK} strokeWidth=".8" /><path d={`M${x - 1.6} ${86 - Math.sin((i / 5) * Math.PI) * 2.6} q1.6 -1.6 3 0`} fill="none" stroke="#7a0a12" strokeWidth=".8" /></g>)}
    </>}
  </>);
}
const HSHOE = 'M14 8 C6 30 6 62 22 80 C32 92 68 92 78 80 C94 62 94 30 86 8 L72 10 C78 30 78 58 68 69 C60 77 40 77 32 69 C22 58 22 30 28 10 Z';
function thoroughbreds(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(horseArt(c, true, false), 50, 52, 0.92));
  const cid = 'lou' + uid;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="46" r="27" /></clipPath></defs>
    <circle cx="50" cy="46" r="29.4" fill={INK} />
    <circle cx="50" cy="46" r="27" fill={lt(c[1], 0.6)} />
    <g clipPath={`url(#${cid})`}><path d="M10 64 C30 58 70 58 90 64 V100 H10 Z" fill={c[1]} />{place(horseArt(c, false), 50, 50, 0.52)}</g>
    <path d={HSHOE} fill={STEEL} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 12 C11 32 11 60 25 77 C34 87 66 87 75 77 C89 60 89 32 82 12" fill="none" stroke={STEEL_L} strokeWidth="1" />
    {[[17, 26], [14.6, 42], [16, 58], [83, 26], [85.4, 42], [84, 58]].map(([x, y], i) => <rect key={i} x={x - 1.3} y={y - 2} width="2.6" height="4" rx=".6" fill={INK} />)}
    <rect x="26" y="4" width="48" height="10" rx="2" fill={c[0]} stroke={INK} strokeWidth="1.3" />
    <Txt y={11.6} text="LOUISVILLE" size={6.6} fill={on(c[0])} max={42} ls={1.6} />
    <Ribbon id={'lor' + uid} y={86} w={80} fill={c[0]} text="THOROUGHBREDS" size={8.4} ls={1} />
  </>);
}

// ── Buffalo Falls
function fallsArt(c: Pal, sm: boolean) {
  const rock = '#7d6a58', rockD = '#5a4a3c', water = c[1], sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M10 40 C14 32 22 29 31 29 L31 84 C22 86 14 82 10 76 Z" fill={rock} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M90 40 C86 32 78 29 69 29 L69 84 C78 86 86 82 90 76 Z" fill={rock} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M16 46 L26 44 M14 60 L24 58 M84 46 L74 44 M86 60 L76 58" stroke={rockD} strokeWidth="1.4" />}
    <path d="M13 34 C18 30 25 29 31 29 M87 34 C82 30 75 29 69 29" fill="none" stroke={LEAF} strokeWidth="3" strokeLinecap="round" />
    <path d="M30 30 Q50 26 70 30 L70 80 L30 80 Z" fill={water} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {[34, 39, 44, 49, 54, 59, 64].map((x, i) => <path key={x} d={`M${x} ${31 + (i % 2)} V78`} stroke={i % 2 ? '#ffffff' : dk(water, 0.15)} strokeWidth={i % 2 ? 1.6 : 1.1} opacity=".75" />)}
    {!sm && <path d="M36 72 A22 18 0 0 1 64 72" fill="none" stroke="#ff595e" strokeWidth="1.4" opacity=".8" />}
    {!sm && <path d="M38 73 A20 16 0 0 1 62 73" fill="none" stroke="#ffca3a" strokeWidth="1.4" opacity=".8" />}
    <path d="M18 84 C18 76 26 74 30 78 C32 72 40 72 42 76 C44 70 54 70 56 76 C58 72 66 72 68 78 C72 74 82 76 82 84 C82 90 18 90 18 84 Z" fill="#ffffff" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <g transform="rotate(28 54 30)">
      <rect x="45" y="22" width="18" height="15" rx="4.4" fill="#a0642e" stroke={INK} strokeWidth={sw} />
      <path d="M49 22.6 V36.4 M59 22.6 V36.4" stroke={INK} strokeWidth="1.4" />
      <path d="M46.6 26 Q54 24.6 61.4 26 M46.6 33 Q54 34.4 61.4 33" fill="none" stroke="#6b3f1a" strokeWidth=".9" />
    </g>
    {!sm && <path d="M40 22 L44 20 M38 27 L43 26" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />}
  </>);
}
function falls(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(fallsArt(c, true), 50, 52, 0.96));
  return Wordmark({ uid, k: 'bu', c: [c[1], c[0]], city: 'BUFFALO', nick: 'FALLS', bg: lt(c[1], 0.55) }, fallsArt(c, false), undefined, { artY: 38, artS: 0.58, size: 21 });
}

// ── Rochester Shutters
function cameraArt(c: Pal, sm: boolean) {
  const body = '#2a2a30', plate = c[0], sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && [[-150, 10], [-120, 12], [-90, 12], [-60, 10]].map(([a, l], i) => { const r = (a * Math.PI) / 180; return <path key={i} d={`M${f2(24 + Math.cos(r) * 11)} ${f2(22 + Math.sin(r) * 11)} L${f2(24 + Math.cos(r) * (11 + l))} ${f2(22 + Math.sin(r) * (11 + l))}`} stroke={plate} strokeWidth="2.2" strokeLinecap="round" />; })}
    <path d="M14 30 C14 20 20 14 30 14 L32 30 Z" fill={STEEL_L} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="24" cy="23" r="4" fill="#fffbe6" stroke={INK} strokeWidth="1.1" />
    <rect x="36" y="25" width="28" height="13" rx="3" fill={plate} stroke={INK} strokeWidth={sw} />
    <rect x="43" y="28" width="14" height="6" rx="1.4" fill="#a8d8f0" stroke={INK} strokeWidth="1" />
    <rect x="70" y="29" width="8" height="5" rx="1.2" fill={c[1]} stroke={INK} strokeWidth="1" />
    <rect x="12" y="35" width="76" height="47" rx="6" fill={body} stroke={INK} strokeWidth={sw} />
    <rect x="12" y="35" width="76" height="10" rx="4" fill={plate} stroke={INK} strokeWidth="1.3" />
    {!sm && <path d="M16 52 H30 M16 58 H30 M16 64 H30 M70 52 H84 M70 58 H84 M70 64 H84" stroke="#3e3e46" strokeWidth="1.6" />}
    <circle cx="50" cy="61" r="18" fill={STEEL} stroke={INK} strokeWidth={sw} />
    <circle cx="50" cy="61" r="13.4" fill="#16161a" stroke={INK} strokeWidth="1" />
    <circle cx="50" cy="61" r="9" fill="#1d3557" />
    <circle cx="50" cy="61" r="9" fill="none" stroke="#457b9d" strokeWidth="1.2" />
    <circle cx="46.4" cy="57.4" r="3" fill="#ffffff" opacity=".7" /><circle cx="53.6" cy="64.6" r="1.2" fill="#ffffff" opacity=".5" />
  </>);
}
function shutters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(cameraArt(c, true), 50, 51, 0.92));
  return Ring({ uid, k: 'ro', band: '#2a2a30', inner: lt(c[0], 0.5), city: 'ROCHESTER', nick: 'SHUTTERS', text: c[0], trim: c[0] }, <>
    {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <path key={i} d={`M50 50 L${f2(50 + Math.cos(a) * 40)} ${f2(50 + Math.sin(a) * 40)} L${f2(50 + Math.cos(a + 0.7) * 40)} ${f2(50 + Math.sin(a + 0.7) * 40)} Z`} fill={i % 2 ? lt(c[0], 0.35) : lt(c[0], 0.6)} />; })}
    {place(cameraArt(c, false), 50, 52, 0.64)}
  </>);
}

// ── Raleigh Gondolas
function gondolaArt(c: Pal, sm: boolean) {
  const hull = '#1a1a1d', sw = sm ? 2.6 : 1.8, stripe = c[0];
  return (<>
    <Line2 d="M36 22 L56 84" c={WOOD} w={sm ? 2.6 : 2} o={1.8} />
    <path d="M53.6 78 L58.6 92 L61.4 90.4 L57 77 Z" fill={WOOD} stroke={INK} strokeWidth="1" />
    <path d="M6 64 C18 74 70 76 90 62 C92 58 94 52 92 46 L88 48 C86 56 80 61 66 63.4 C50 65.6 30 65.6 14 61.6 C10 60.4 7 61 6 64 Z" fill={hull} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M12 64.6 C30 69 66 69 86 60" fill="none" stroke="#e8b931" strokeWidth="1.2" />
    <path d="M90 48 L94 36 L97 37 L95 40 L98.4 41 L96.4 44 L99.4 45.4 L95.4 50.4 Z" fill={STEEL_L} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    <rect x="46" y="58" width="14" height="5" rx="1.6" fill={c[1]} stroke={INK} strokeWidth="1" />
    <path d="M21 62 L22 47 L28 47 L29 62 Z" fill={hull} stroke={INK} strokeWidth="1.2" />
    <path d="M20 47 L20.4 33 C20.4 30.6 29.6 30.6 29.6 33 L30 47 Z" fill={PAPER} stroke={INK} strokeWidth="1.3" />
    {[35, 38.4, 41.8, 45.2].map(y => <path key={y} d={`M20.6 ${y} H29.6`} stroke={stripe} strokeWidth="1.8" />)}
    <path d="M29 35 L37 25" stroke={INK} strokeWidth="3.6" strokeLinecap="round" /><path d="M29 35 L37 25" stroke={PAPER} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="25" cy="26.4" r="4.2" fill={SKIN} stroke={INK} strokeWidth="1.1" />
    <ellipse cx="25" cy="22.6" rx="7.4" ry="1.9" fill="#f2d98a" stroke={INK} strokeWidth="1" />
    <path d="M20.6 22.4 L21 18.6 L29 18.6 L29.4 22.4 Z" fill="#f2d98a" stroke={INK} strokeWidth="1" />
    <path d="M21 20.6 H29" stroke={stripe} strokeWidth="1.6" />
  </>);
}
function gondolas(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(gondolaArt(c, true), 50, 50, 0.92));
  return Patch({ uid, k: 'ra', c: [c[1], c[0]], city: 'RALEIGH', nick: 'Gondolas', bg: lt(c[1], 0.2) }, gondolaArt(c, false), <>
    {[44, 52, 60].map(y => <path key={y} d={`M10 ${y} Q20 ${y - 2} 30 ${y} T50 ${y} T70 ${y} T90 ${y}`} fill="none" stroke="#ffffff" strokeWidth="1" opacity=".45" />)}
  </>, { artY: 40, artS: 0.56 });
}

// ── Norfolk Shipwrights
function wheelArt(c: Pal, sm: boolean) {
  const wood = '#9c6b3c', woodD = '#6e4524', sw = sm ? 2.6 : 1.8;
  return (<>
    {Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4, x1 = 50 + Math.cos(a) * 36, y1 = 50 + Math.sin(a) * 36, x2 = 50 + Math.cos(a) * 46, y2 = 50 + Math.sin(a) * 46;
      return <g key={k}><Line2 d={`M50 50 L${f2(x1)} ${f2(y1)}`} c={wood} w={sm ? 4.4 : 3.6} o={2.2} /><Line2 d={`M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}`} c={woodD} w={sm ? 6.6 : 5.6} o={2.2} /></g>; })}
    <circle cx="50" cy="50" r="30" fill="none" stroke={INK} strokeWidth={sm ? 11 : 10} />
    <circle cx="50" cy="50" r="30" fill="none" stroke={wood} strokeWidth={sm ? 7.4 : 6.6} />
    {!sm && <circle cx="50" cy="50" r="30" fill="none" stroke={woodD} strokeWidth=".8" strokeDasharray="3 2.4" />}
    <circle cx="50" cy="50" r="10" fill={wood} stroke={INK} strokeWidth={sw} />
    <circle cx="50" cy="50" r="5" fill={c[1]} stroke={INK} strokeWidth="1.2" />
    {!sm && <path d="M46.4 46.4 Q48 45.2 50 45" fill="none" stroke="#ffffff" strokeWidth="1" opacity=".7" />}
  </>);
}
function shipwrights(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(wheelArt(c, true), 50, 50, 0.96));
  return Hexagon({ uid, k: 'no', c: [c[0], c[1]], city: 'NORFOLK', nick: 'SHIPWRIGHTS' }, wheelArt(c, false), <>
    <path d="M0 70 Q12 66 25 70 T50 70 T75 70 T100 70 V100 H0 Z" fill={dk(c[0], 0.2)} />
  </>, { artY: 50, artS: 0.54 });
}

// ── Pittsburgh Ballerinas
function pointeArt(c: Pal, sm: boolean) {
  const satin = '#f6b8c8', shade = '#e48da6', sw = sm ? 2.4 : 1.6;
  const SHOE = 'M-8 1 C-10 12 -9.4 24 -6.6 33 C-5.4 38 -4.2 41.4 -2.4 43 L3.6 43 C5.6 41 6.6 37 7.2 31 C8.8 23 10.6 15 10.4 7 C10.2 3 8.8 0 6.4 -1.4 Z';
  const shoe = (x: number, y: number, r: number, flip: number) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip} 1)`}>
      <path d={SHOE} fill={satin} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M7 30 C8.6 22 10 15 9.8 8" fill="none" stroke={shade} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M-5.6 8 C-6.6 16 -6 24 -4 31" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
      <path d="M-2.4 43 L3.6 43 C4.6 42 5.4 40.6 5.8 39" fill="none" stroke="#a8754a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-4 35 C-1 37.4 3 37 6.4 34" fill="none" stroke={shade} strokeWidth="1.1" />
      <path d="M-8 1 C-5 4.6 3 3.6 6.4 -1.4 C3 -3.4 -4.6 -2.6 -8 1 Z" fill="#e48da6" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M-6.4 1.4 C-3 3.4 2.6 2.6 5.2 -0.6" fill="none" stroke="#fbe3ea" strokeWidth=".9" />
    </g>);
  return (<>
    <Line2 d="M50 9 C42 14 36 22 34 30" c={satin} w={sm ? 2.8 : 2.2} o={1.6} />
    <Line2 d="M50 9 C58 14 64 22 66 30" c={satin} w={sm ? 2.8 : 2.2} o={1.6} />
    {!sm && <><Line2 d="M33 34 C26 44 30 56 22 66" c={satin} w={1.8} o={1.4} /><Line2 d="M67 34 C74 44 70 56 78 66" c={satin} w={1.8} o={1.4} /></>}
    {shoe(39, 31, 12, -1)}{shoe(61, 31, -12, 1)}
    <path d="M44 8 C40 4 40 12 44 10 Z M56 8 C60 4 60 12 56 10 Z" fill={satin} stroke={INK} strokeWidth="1" />
    <circle cx="50" cy="9" r="2.6" fill={c[0]} stroke={INK} strokeWidth="1.1" />
  </>);
}
function ballerinas(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(pointeArt(c, true), 50, 46, 1.0), c[0]);
  return Script({ uid, k: 'pi', c: [c[1], c[0]], city: 'PITTSBURGH', nick: 'Ballerinas', bg: '#2a2a2e' }, pointeArt(c, false), <>
    {[[22, 24], [78, 22], [18, 50], [82, 48], [30, 12], [70, 12]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 2)} fill={c[0]} opacity=".8" />)}
  </>, { artY: 40, artS: 0.6, swash: c[0] });
}

// ── Memphis Blues
function guitarArt(c: Pal, sm: boolean) {
  const body = c[0], bodyD = dk(c[0], 0.3), sw = sm ? 2.6 : 1.8;
  return (<g transform="rotate(-32 50 52)">
    <rect x="47.4" y="-4" width="5.2" height="36" fill="#6b4226" stroke={INK} strokeWidth="1.2" />
    {!sm && [2, 8, 14, 20, 26].map(y => <path key={y} d={`M47.6 ${y} H52.4`} stroke={STEEL_L} strokeWidth=".8" />)}
    <path d="M45 -14 L55 -14 L54 -3 L46 -3 Z" fill="#2a1d14" stroke={INK} strokeWidth="1.2" />
    {[-12, -8.6, -5.2].map(y => <g key={y}><circle cx="43.4" cy={y} r="1.3" fill={STEEL_L} stroke={INK} strokeWidth=".5" /><circle cx="56.6" cy={y} r="1.3" fill={STEEL_L} stroke={INK} strokeWidth=".5" /></g>)}
    <path d="M50 30 C60 30 64 38 62 46 C61 50 62 52 66 56 C72 62 70 86 50 88 C30 86 28 62 34 56 C38 52 39 50 38 46 C36 38 40 30 50 30 Z" fill={body} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 34 C56 34 58 40 57 46 C56.4 50 57.4 53 60.4 56.6 C65 62 63.4 81 50 83 C36.6 81 35 62 39.6 56.6 C42.6 53 43.6 50 43 46 C42 40 44 34 50 34 Z" fill={lt(body, 0.25)} opacity=".55" />
    <path d="M38.6 58 C37 62 37.4 66 39.4 68 M61.4 58 C63 62 62.6 66 60.6 68" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    <rect x="43" y="72" width="14" height="3.4" rx="1" fill={bodyD} stroke={INK} strokeWidth="1" />
    <rect x="44" y="58" width="12" height="5" rx="1" fill={INK} /><rect x="44" y="64.6" width="12" height="5" rx="1" fill={INK} />
    {!sm && [48, 49.4, 50.8, 52.2].map(x => <path key={x} d={`M${x} -3 V73`} stroke="#f1f1f1" strokeWidth=".35" />)}
  </g>);
}
function blues(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(guitarArt(c, true), 50, 52, 0.84));
  return (<>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    {[46, 43, 40, 37, 34, 31].map(r => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#3a3a42" strokeWidth=".7" />)}
    <path d="M22 22 A40 40 0 0 1 50 10" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".18" />
    <path d="M78 78 A40 40 0 0 1 50 90" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".14" />
    <circle cx="50" cy="50" r="20" fill={c[1]} stroke={INK} strokeWidth="1.4" />
    <circle cx="50" cy="50" r="2.4" fill={INK} />
    <Arc id={'meb' + uid} text="MEMPHIS" r={40.6} top size={7.4} fill={c[1]} ls={3} />
    {[[20, 40], [80, 30], [76, 60]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y + 6} rx="2.6" ry="2" fill={PAPER} transform={`rotate(-20 ${x} ${y + 6})`} /><path d={`M${x + 2.4} ${y + 6} V${y - 2} L${x + 6} ${y}`} fill="none" stroke={PAPER} strokeWidth="1.2" /></g>)}
    {place(guitarArt(c, false), 50, 47, 0.6)}
    <Word id={'men' + uid} text="BLUES" y={88} size={18} fill={c[1]} max={56} arch={-2} sw={2.4} />
  </>);
}

// ── Toronto Towers
function towerArt(c: Pal, sm: boolean) {
  const con = '#e9ecef', conD = '#b8bec6', sw = sm ? 2.4 : 1.6;
  return (<>
    {!sm && [[8, 72, 14, 20], [20, 78, 10, 14], [64, 74, 12, 18], [76, 68, 14, 24], [30, 80, 8, 12]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={dk(c[1], 0.15)} stroke={INK} strokeWidth=".8" />)}
    <path d="M43 92 L46 70 L54 70 L57 92 Z" fill={con} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M46.4 71 L48.4 40 L51.6 40 L53.6 71 Z" fill={con} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 40 L51.6 40 L53.6 71 L50 71 Z" fill={conD} />
    <path d="M39 40.4 C39 35.4 61 35.4 61 40.4 L58.6 44.6 C58.6 46.8 41.4 46.8 41.4 44.6 Z" fill={con} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M40.6 40.6 H59.4" stroke={c[0]} strokeWidth="1.6" />
    <path d="M48.6 36 L49.3 22 L50.7 22 L51.4 36 Z" fill={con} stroke={INK} strokeWidth="1" />
    <ellipse cx="50" cy="22" rx="3.6" ry="2.4" fill={con} stroke={INK} strokeWidth="1" />
    <path d="M50 20 V4" stroke={INK} strokeWidth="2.2" /><path d="M50 20 V5" stroke={STEEL_L} strokeWidth=".9" />
    <circle cx="50" cy="4" r="1.8" fill={c[0]} stroke={INK} strokeWidth=".6" />
  </>);
}
function towers(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(towerArt(c, true), 50, 50, 0.96));
  return Arch({ uid, k: 'to', c: [dk(c[1], 0.2), c[0]], city: 'TORONTO', nick: 'TOWERS' }, towerArt(c, false), <>
    {[[24, 22], [74, 26], [30, 40], [70, 46], [62, 14]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 1.6)} fill="#ffffff" opacity=".85" />)}
    <path d="M0 88 H100" stroke={c[0]} strokeWidth="4" />
  </>, { artY: 46, artS: 0.66, plate: dk(c[1], 0.5) });
}

// ── Montreal Voyageurs
function canoeArt(c: Pal, sm: boolean) {
  const birch = '#efe6d2', sw = sm ? 2.6 : 1.8;
  const paddle = (d: string, bx: number, by: number, r: number) => (<g>
    <Line2 d={d} c={WOOD} w={sm ? 2.6 : 2} o={1.8} />
    <ellipse cx={bx} cy={by} rx="4.6" ry="11" transform={`rotate(${r} ${bx} ${by})`} fill={c[1]} stroke={INK} strokeWidth="1.3" />
  </g>);
  return (<>
    {paddle('M24 82 L66 22', 70, 15, 35)}{paddle('M76 82 L34 22', 30, 15, -35)}
    <path d="M5 56 C10 64 30 72 50 72 C70 72 90 64 95 56 C90 58 88 52 92 46 C84 52 70 57 50 57 C30 57 16 52 8 46 C12 52 10 58 5 56 Z" fill={birch} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M10 56 C24 62 76 62 90 56" fill="none" stroke={INK} strokeWidth="1.2" />
    {!sm && [[20, 64], [30, 66.6], [42, 68], [56, 68], [68, 66.4], [79, 63.6], [26, 60.4], [62, 61.6]].map(([x, y], i) => <path key={i} d={`M${x} ${y} h${i % 2 ? 4 : 6}`} stroke="#3a3027" strokeWidth="1.1" strokeLinecap="round" />)}
    <path d="M6.6 55.4 C9 53 9.6 50 8 46.6 M93.4 55.4 C91 53 90.4 50 92 46.6" fill="none" stroke={c[1]} strokeWidth="1.8" />
    {!sm && <path d="M16 80 Q30 76 44 80 T72 80 T90 80" fill="none" stroke={lt(c[0], 0.4)} strokeWidth="1.6" strokeLinecap="round" />}
  </>);
}
function voyageurs(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(canoeArt(c, true), 50, 52, 0.94));
  return Pennant({ uid, k: 'mt', c: [c[0], c[1]], city: 'MONTREAL', nick: 'VOYAGEURS' }, canoeArt(c, false), { artS: 0.4 });
}

// ── Ottawa Skaters
function skateArt(c: Pal, sm: boolean) {
  const boot = c[0], sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && <path d="M8 90 C30 84 60 92 92 84 M14 96 C36 90 64 96 88 92" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".8" />}
    <path d="M36 70 V77 M70 70 V77" stroke={STEEL} strokeWidth="3.4" />
    <path d="M18 78 L84 78 C89 78 92 80 90 83 L22 83 C15 83 14 78 18 78 Z" fill={STEEL_L} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M87 78 L90.4 74.6 L91.6 78.4 Z" fill={STEEL_L} stroke={INK} strokeWidth=".9" />
    <path d="M28 14 L50 14 C52 28 54 40 61 46 C71 52 81 54 85 60 C87 66 83 70 77 70 L30 70 C26 70 24 66 24 62 L26 28 C26 21 26 16 28 14 Z" fill={boot} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M24.6 60 H86" stroke={dk(boot, 0.3)} strokeWidth="1.6" />
    <path d="M26.4 14 H51.4 V20 H26.2 Z" fill={PAPER} stroke={INK} strokeWidth="1.2" />
    {[24, 30, 36, 42].map((y, i) => <g key={y}><circle cx={47 + i * 1.6} cy={y} r="1" fill={INK} /><path d={`M${47 + i * 1.6} ${y} L${53 + i * 2} ${y + 6}`} stroke={PAPER} strokeWidth={sm ? 1.8 : 1.3} /></g>)}
    {!sm && <path d="M32 26 C32 40 33 52 36 60" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".35" />}
  </>);
}
function skaters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(skateArt(c, true), 50, 50, 0.92), c[0]);
  return Octagon({ uid, k: 'ot', c: [c[1], c[0]], city: 'OTTAWA', nick: 'SKATERS', bg: lt(c[1], 0.35) }, skateArt(c, false), <>
    {[[22, 32], [78, 36], [70, 26], [28, 52]].map(([x, y], i) => <path key={i} d={sparkle(x, y, 2)} fill="#ffffff" />)}
  </>, { artY: 46, artS: 0.54 });
}

// ── Grand Rapids Craftsmen
function chairArt(c: Pal, sm: boolean) {
  const wood = mix(c[0], '#9c6b3c', 0.4), woodD = dk(wood, 0.3), sw = sm ? 2.6 : 1.8;
  return (<>
    {!sm && <>
      <g transform="rotate(-38 50 50)"><rect x="6" y="46" width="62" height="10" fill={STEEL_L} stroke={INK} strokeWidth="1.2" /><path d={'M6 56 ' + Array.from({ length: 15 }, (_, i) => `l2.1 2.6 l2.1 -2.6`).join(' ')} fill="none" stroke={INK} strokeWidth=".9" /><path d="M68 44 C80 44 88 46 88 51 C88 56 80 58 68 58 Z" fill={WOOD} stroke={INK} strokeWidth="1.2" /></g>
      <g transform="rotate(40 50 50)"><rect x="16" y="47.6" width="56" height="5" rx="2" fill={WOOD} stroke={INK} strokeWidth="1.2" /><path d="M72 40 L84 40 L86 46 L84 60 L72 60 Z" fill={STEEL} stroke={INK} strokeWidth="1.2" /></g>
    </>}
    <rect x="30" y="16" width="5" height="76" rx="1.4" fill={woodD} stroke={INK} strokeWidth="1.2" />
    <rect x="65" y="16" width="5" height="76" rx="1.4" fill={woodD} stroke={INK} strokeWidth="1.2" />
    <rect x="30" y="14" width="40" height="8" rx="2" fill={wood} stroke={INK} strokeWidth={sw} />
    {[40, 47.6, 55.2].map(x => <rect key={x} x={x} y="22" width="4.4" height="30" fill={wood} stroke={INK} strokeWidth="1.1" />)}
    <path d="M22 52 L78 52 L82 61 L18 61 Z" fill={wood} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M24 53.6 L76 53.6" stroke={c[1]} strokeWidth="2.6" />
    <rect x="19" y="61" width="6" height="31" rx="1.4" fill={wood} stroke={INK} strokeWidth="1.3" />
    <rect x="75" y="61" width="6" height="31" rx="1.4" fill={wood} stroke={INK} strokeWidth="1.3" />
    <path d="M25 80 H75" stroke={INK} strokeWidth="3.6" /><path d="M25 80 H75" stroke={wood} strokeWidth="1.8" />
  </>);
}
function craftsmen(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(chairArt(c, true), 50, 52, 0.94));
  return Varsity({ uid, k: 'gr', c: [c[1], c[0]], city: 'GRAND RAPIDS', nick: 'CRAFTSMEN' }, chairArt(c, false), <>
    {[22, 34, 46, 58, 70, 82].map(y => <path key={y} d={`M0 ${y} Q50 ${y - 3} 100 ${y}`} fill="none" stroke={lt(c[1], 0.12)} strokeWidth="2.4" />)}
  </>, { artY: 60, artS: 0.5 });
}

// ── London Beefeaters
function beefeaterArt(c: Pal, sm: boolean) {
  const red = c[0], gold = c[1], hat = '#17171c', sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M22 74 C30 70 70 70 78 74 L86 98 L14 98 Z" fill={red} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M50 74 V98 M30 74 L24 98 M70 74 L76 98" stroke={gold} strokeWidth="1.6" />
    <path d="M44 84 L46 80 L48 83 L50 79 L52 83 L54 80 L56 84 Z" fill={gold} stroke={INK} strokeWidth=".7" />
    <path d={fluff(50, 70, 16, 18, 0.12)} fill={PAPER} stroke={INK} strokeWidth="1.2" />
    <ellipse cx="50" cy="44" rx="13" ry="15" fill={SKIN} stroke={INK} strokeWidth={sw} />
    <circle cx="44.6" cy="42" r={sm ? 1.8 : 1.5} fill={INK} /><circle cx="55.4" cy="42" r={sm ? 1.8 : 1.5} fill={INK} />
    <path d="M41.6 38.6 L47.4 38 M52.6 38 L58.4 38.6" stroke="#cfcac0" strokeWidth="2" strokeLinecap="round" />
    <path d="M38 47 C38 59 44 66 50 67.6 C56 66 62 59 62 47 C58 53 54 55 50 55 C46 55 42 53 38 47 Z" fill="#eeeae2" stroke={INK} strokeWidth="1.2" />
    <path d="M40 52 C44 48.4 48 49 50 51 C52 49 56 48.4 60 52 C57 55 53 54 50 53 C47 54 43 55 40 52 Z" fill="#ffffff" stroke={INK} strokeWidth="1" />
    <path d="M49 44 L51 48.6 L48.6 48.6 Z" fill={dk(SKIN, 0.15)} />
    <ellipse cx="50" cy="26.6" rx="24" ry="5" fill={hat} stroke={INK} strokeWidth={sw} />
    <path d="M33 26 C33 12 67 12 67 26 Z" fill={hat} stroke={INK} strokeWidth={sw} />
    <path d="M33.4 24 C40 21.4 60 21.4 66.6 24" fill="none" stroke={red} strokeWidth="2.6" />
    {[37, 44, 50, 56, 63].map((x, i) => <circle key={x} cx={x} cy={23.4 - (i === 2 ? 0.8 : 0)} r="2" fill={i % 2 ? PAPER : '#1d4ed8'} stroke={INK} strokeWidth=".6" />)}
  </>);
}
function beefeaters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(beefeaterArt(c, true), 50, 52, 0.92));
  return Seal({ uid, k: 'ld', c: [c[0], c[1]], city: 'LONDON', nick: 'BEEFEATERS', bg: lt(c[1], 0.55) }, beefeaterArt(c, false), undefined, { artY: 54, artS: 0.52 });
}

// ── Paris Lumières
function eiffelArt(c: Pal, sm: boolean) {
  const iron = c[1], ironD = dk(c[1], 0.3), sw = sm ? 2.4 : 1.5;
  return (<>
    <path d="M50 5 L51.6 18 L53.6 30 L56 44 L60 56 L66 70 L77 92 L63 92 C61 84 56 79 50 79 C44 79 39 84 37 92 L23 92 L34 70 L40 56 L44 44 L46.4 30 L48.4 18 Z" fill={iron} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && <path d="M46.6 30 L53.4 30 M45.4 37 L54.6 37 M48.4 18 L51.6 18 M47 22 L53 30 M53 22 L47 30 M44.6 37 L55.4 44 M55.4 37 L44.6 44 M41 56 L59 70 M59 56 L41 70 M36 70 L64 70 M38 76 L44 70 M62 76 L56 70" fill="none" stroke={ironD} strokeWidth=".9" />}
    <rect x="40" y="43" width="20" height="3.6" fill={ironD} stroke={INK} strokeWidth="1" />
    <rect x="35" y="55" width="30" height="4" fill={ironD} stroke={INK} strokeWidth="1" />
    <circle cx="50" cy="6" r="2.2" fill="#fffbe6" stroke={INK} strokeWidth=".7" />
  </>);
}
function lumieres(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(eiffelArt(c, true), 50, 50, 0.96));
  return Ring({ uid, k: 'pa', band: c[0], inner: dk(c[0], 0.35), city: 'PARIS', nick: 'LUMIÈRES', text: c[1], trim: c[1] }, <>
    <path d="M50 26 L0 6 L0 22 Z M50 26 L100 6 L100 22 Z" fill={c[1]} opacity=".22" />
    {[[22, 40], [78, 44], [30, 60], [72, 64], [20, 52], [82, 30]].map(([x, y], i) => <path key={i} d={sparkle(x, y, i % 2 ? 1.6 : 2.4)} fill={c[1]} />)}
    <path d="M0 80 C30 76 70 76 100 80 V100 H0 Z" fill={dk(c[0], 0.55)} />
    {place(eiffelArt(c, false), 50, 52, 0.62)}
  </>);
}

// ── Madrid Osos
function bearTreeArt(c: Pal) {
  const fur = '#7a4a2a', furL = '#a8754a';
  return (<>
    <Line2 d="M76 94 C75 80 76 64 78 50" c={BARK} w={5} o={2.4} />
    {[[72, 34, 15], [85, 40, 10.4], [61, 42, 9.4], [78, 22, 9]].map(([x, y, r], i) => <path key={'o' + i} d={fluff(x, y, r + 1.4, 9, 0.14)} fill={INK} />)}
    {[[72, 34, 15], [85, 40, 10.4], [61, 42, 9.4], [78, 22, 9]].map(([x, y, r], i) => <path key={'f' + i} d={fluff(x, y, r, 9, 0.14)} fill={LEAF} />)}
    {[[66, 30], [74, 38], [82, 34], [70, 44], [86, 44], [78, 20], [62, 40], [76, 28]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#e63946" stroke={INK} strokeWidth=".6" />)}
    <path d="M30 94 L32 78 C26 72 24 62 26 52 C28 42 34 36 42 33 C42 27 46 22 52 22 C56 22 59 24 60 27 L66 29 C68 30 68 33 66 34 L61 35 C60 38 58 40 56 41 C58 46 59 52 59 58 L69 50 C71.4 48.4 74 51 71.6 53.4 L60 64 C60 72 57 82 55 94 L47 94 L46 86 L40 86 L38 94 Z" fill={fur} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M60 27 L66 29 C68 30 68 33 66 34 L61 35 C59 34 58 30 60 27 Z" fill={furL} />
    <circle cx="49" cy="23.6" r="3.4" fill={fur} stroke={INK} strokeWidth="1.3" />
    <circle cx="57" cy="28" r="1.4" fill={INK} /><ellipse cx="66.6" cy="31" rx="1.6" ry="1.3" fill={INK} />
    <path d="M36 50 C34 58 34 66 38 72" fill="none" stroke={furL} strokeWidth="2" strokeLinecap="round" opacity=".7" />
  </>);
}
function bearHeadArt(c: Pal) {
  const fur = '#7a4a2a', muz = '#d6a77a';
  return (<>
    <circle cx="28" cy="34" r="10" fill={fur} stroke={INK} strokeWidth="2.6" /><circle cx="72" cy="34" r="10" fill={fur} stroke={INK} strokeWidth="2.6" />
    <circle cx="28" cy="34" r="5" fill={muz} /><circle cx="72" cy="34" r="5" fill={muz} />
    <circle cx="50" cy="56" r="27" fill={fur} stroke={INK} strokeWidth="2.6" />
    <ellipse cx="50" cy="66" rx="13" ry="10" fill={muz} stroke={INK} strokeWidth="1.4" />
    <ellipse cx="50" cy="60.6" rx="5" ry="3.6" fill={INK} />
    <circle cx="40" cy="49" r="3.2" fill={INK} /><circle cx="60" cy="49" r="3.2" fill={INK} />
    <path d="M45 70 Q50 73.6 55 70" fill="none" stroke={INK} strokeWidth="1.6" />
    <path d="M72 22 C78 18 84 20 86 24" fill="none" stroke={LEAF} strokeWidth="3" />
    {[[76, 20], [82, 22], [79, 26]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#e63946" stroke={INK} strokeWidth="1" />)}
  </>);
}
function osos(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(bearHeadArt(c), 50, 52, 0.94));
  return Shield({ uid, k: 'ma', field: lt(c[1], 0.55), band: c[0], city: 'MADRID', nick: 'OSOS', ribbon: c[0] }, <>
    <path d="M9 74 H91 V100 H9 Z" fill={lt(c[1], 0.2)} />
    {Array.from({ length: 7 }, (_, i) => <polygon key={i} points={star5(f2(16 + (i % 2 ? 3 : 0)), f2(32 + i * 6.6), 1.8, 0.75)} fill={c[0]} />)}
    {place(bearTreeArt(c), 50, 50, 0.6)}
  </>);
}

// ── Berlin Gatekeepers
function gateArt(c: Pal, sm: boolean) {
  const stone = '#efe2c4', stoneD = '#cdb98e', bronze = '#4f9d8a', sw = sm ? 2.4 : 1.6;
  const cols = [16, 28, 40, 54, 66, 78];
  return (<>
    <path d="M38 30 C40 24 44 22 46 24 L48 20 L50 24 C52 22 56 24 58 30 L60 26 C62 28 62 32 60 34 L40 34 C38 32 38 28 40 26 Z" fill={bronze} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M49 20 V10 M46 12 C48 10 52 10 54 12" fill="none" stroke={bronze} strokeWidth="1.6" />
    <circle cx="50" cy="10" r="2" fill={bronze} stroke={INK} strokeWidth=".7" />
    <path d="M22 34 H78 L80 42 H20 Z" fill={stone} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <rect x="12" y="42" width="76" height="9" fill={stone} stroke={INK} strokeWidth={sw} />
    {!sm && Array.from({ length: 12 }, (_, i) => <rect key={i} x={15 + i * 6.2} y="44" width="2.2" height="5" fill={stoneD} />)}
    {cols.map(x => <g key={x}><rect x={x} y="51" width="6.4" height="33" fill={stone} stroke={INK} strokeWidth="1.2" />{!sm && <path d={`M${x + 2.1} 53 V82 M${x + 4.3} 53 V82`} stroke={stoneD} strokeWidth=".7" />}</g>)}
    <rect x="10" y="84" width="80" height="7" fill={stoneD} stroke={INK} strokeWidth={sw} />
  </>);
}
function gatekeepers(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(gateArt(c, true), 50, 50, 0.96));
  return Wordmark({ uid, k: 'be', c: [c[1], c[0]], city: 'BERLIN', nick: 'GATEKEEPERS', bg: lt(c[0], 0.55) }, gateArt(c, false), <>
    <rect x="0" y="0" width="100" height="40" fill={lt(c[1], 0.45)} />
  </>, { artY: 38, artS: 0.56, size: 14.6 });
}

// ── New Orleans Second Liners
function trumpetArt(c: Pal, sm: boolean) {
  const brass = c[1], brassD = dk(c[1], 0.3), purple = c[0], sw = sm ? 2.4 : 1.6;
  const FLEUR = 'M50 6 C58 16 58 32 50 44 C42 32 42 16 50 6 Z M48 42 C36 42 22 34 24 20 C28 28 36 30 44 32 C42 36 44 40 48 42 Z M52 42 C64 42 78 34 76 20 C72 28 64 30 56 32 C58 36 56 40 52 42 Z M36 44 H64 V50 H36 Z M44 50 C40 58 36 62 30 64 M56 50 C60 58 64 62 70 64';
  return (<>
    {!sm && <path d={FLEUR} fill={lt(purple, 0.25)} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />}
    <g transform="rotate(-22 50 56)">
      <path d="M8 54.4 L16 52.6 L16 57.4 Z" fill={brassD} stroke={INK} strokeWidth="1" />
      <rect x="16" y="53" width="24" height="3.6" fill={brass} stroke={INK} strokeWidth="1" />
      <path d="M36 58 C30 66 34 71 42 71 L58 71 C64 71 66 67 62 61" fill="none" stroke={INK} strokeWidth="5.4" />
      <path d="M36 58 C30 66 34 71 42 71 L58 71 C64 71 66 67 62 61" fill="none" stroke={brass} strokeWidth="2.8" />
      {[39, 45, 51].map(x => <g key={x}><rect x={x} y="45" width="4.6" height="15" rx="1" fill={brass} stroke={INK} strokeWidth="1" /><rect x={x + 0.6} y="40.6" width="3.4" height="4.4" rx="1" fill={PAPER} stroke={INK} strokeWidth=".8" /></g>)}
      <path d="M55 52 L74 51 C80 50.4 84 44.6 89 38 L89 71 C84 64.4 80 58.6 74 58 L55 57 Z" fill={brass} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx="89" cy="54.5" rx="3" ry="16.6" fill={brassD} stroke={INK} strokeWidth={sw} />
      <path d="M58 53.4 L74 52.6" stroke="#ffffff" strokeWidth="1.2" opacity=".6" />
    </g>
    {[[86, 16, c[1]], [74, 8, '#1b9e77'], [94, 30, PAPER]].map(([x, y, col], i) => <g key={i}><ellipse cx={(x as number)} cy={(y as number) + 7} rx="2.6" ry="2" fill={col as string} stroke={INK} strokeWidth=".6" transform={`rotate(-20 ${x} ${(y as number) + 7})`} /><path d={`M${(x as number) + 2.4} ${(y as number) + 7} V${(y as number) - 1}`} stroke={INK} strokeWidth="1.1" /></g>)}
  </>);
}
function secondLiners(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(trumpetArt(c, true), 50, 54, 0.9));
  return Sunburst({ uid, k: 'nl', c: [c[0], c[1]], city: 'NEW ORLEANS', nick: 'SECOND LINERS' }, trumpetArt(c, false), { artY: 44, artS: 0.56, ray: lt(c[0], 0.18), core: '#1b9e77' });
}

// ── Hartford Jesters
function jesterArt(c: Pal, sm: boolean) {
  const a = c[0], b = c[1], gold = '#f2c14e', sw = sm ? 2.4 : 1.6;
  const CONE = 'M28 42 Q14 34 7 20 Q22 23 41 37 Z';
  return (<>
    {[16, 28, 40, 52, 64, 76].map((x, i) => <path key={x} d={`M${x} 74 L${x + 6} 88 L${x + 12} 74 Z`} fill={i % 2 ? a : b} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />)}
    <path d="M14 74 H88" stroke={INK} strokeWidth="1.4" />
    {[22, 34, 46, 58, 70, 82].map(x => <circle key={x} cx={x} cy="89" r="1.8" fill={gold} stroke={INK} strokeWidth=".6" />)}
    <ellipse cx="50" cy="59" rx="15" ry="14.4" fill="#fbf6ee" stroke={INK} strokeWidth={sw} />
    <path d="M40.4 54.4 Q43.6 51.4 46.8 54.4 M53.2 54.4 Q56.4 51.4 59.6 54.4" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M43.6 58 L45 61 L43.6 64 L42.2 61 Z" fill={a} /><path d="M56.4 58 L57.8 61 L56.4 64 L55 61 Z" fill={b} />
    <path d="M42 64.6 C45 70.4 55 70.4 58 64.6 Q50 67 42 64.6 Z" fill="#c1121f" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
    <circle cx="50" cy="60.6" r="1.8" fill="#e63946" />
    <path d={CONE} fill={a} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d={mirror(CONE)} fill={a} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38 40 Q43 18 50 5 Q57 18 62 40 Z" fill={b} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M30 40 C40 36 60 36 70 40 L70 47.4 C60 43.4 40 43.4 30 47.4 Z" fill={gold} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {[36, 43, 50, 57, 64].map(x => <path key={x} d={`M${x} 39.4 L${x + 2.2} 42.6 L${x} 45.8 L${x - 2.2} 42.6 Z`} fill={x % 2 ? a : b} />)}
    {[[7, 20], [50, 5], [93, 20]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={sm ? 4.2 : 3.6} fill={gold} stroke={INK} strokeWidth="1.1" /><path d={`M${x - 1.6} ${y + 0.8} H${x + 1.6}`} stroke={INK} strokeWidth=".8" /></g>)}
  </>);
}
function jesters(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[1], place(jesterArt(c, true), 50, 50, 0.94));
  return Diamond({ uid, k: 'hf', c: [c[0], c[1]], city: 'HARTFORD', nick: 'JESTERS', bg: lt(c[0], 0.55) }, jesterArt(c, false), <>
    {Array.from({ length: 16 }, (_, i) => { const x = (i % 4) * 25 + (Math.floor(i / 4) % 2 ? 12.5 : 0), y = Math.floor(i / 4) * 25; return <path key={i} d={`M${x} ${y} L${x + 12.5} ${y + 12.5} L${x} ${y + 25} L${x - 12.5} ${y + 12.5} Z`} fill={i % 2 ? lt(c[1], 0.5) : lt(c[0], 0.4)} opacity=".6" />; })}
  </>, { artY: 48, artS: 0.46 });
}

// ── Providence Emus
function emuArt(c: Pal, sm: boolean) {
  const feath = '#7d6d5e', feathD = '#5c4f43', sw = sm ? 2.6 : 1.8;
  return (<>
    <path d="M55 28 C50 40 46 54 44 70 C42 80 40 88 38 98 L68 98 C66 88 64 78 63 66 C62 54 66 42 71 31 Z" fill={feath} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {!sm && [[48, 56], [52, 66], [46, 76], [56, 80], [58, 52], [50, 88], [60, 90]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l2 4 l2 -4`} fill="none" stroke={feathD} strokeWidth="1" />)}
    <path d="M58 17 C62 13 70 13 74 17 L85 23.4 C86.4 25 85.6 27 83.6 27.4 L74 29.6 C70 33.6 62 33.6 58 29.6 C55 26 55 21 58 17 Z" fill={feath} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M74 21 L85 23.4 C86.4 25 85.6 27 83.6 27.4 L74 29 Z" fill="#3a3530" />
    <circle cx="66.4" cy="22" r="4.6" fill="#7fb7d6" />
    <circle cx="66.4" cy="22" r="2.6" fill="#e85d04" /><circle cx="66.4" cy="22" r="1.3" fill={INK} />
    <path d="M46 60 C52 64.4 60 64.4 66 60" fill="none" stroke={STEEL} strokeWidth=".8" />
    {[46.4, 49.4, 52.4, 55.4, 58.4, 61.4, 64.4].map((x, i) => <circle key={x} cx={x} cy={60.4 + Math.sin((i / 6) * Math.PI) * 3.4} r={sm ? 2.2 : 1.8} fill="#fbfaf4" stroke={INK} strokeWidth=".7" />)}
    <path d="M55.4 64 L52.6 69.4 L55.4 74 L58.2 69.4 Z" fill={c[0]} stroke={INK} strokeWidth=".9" />
  </>);
}
function emus(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(emuArt(c, true), 46, 50, 0.96));
  return Ring({ uid, k: 'pr', band: c[0], inner: lt(c[1], 0.3), city: 'PROVIDENCE', nick: 'EMUS', text: c[1], trim: c[1] }, <>
    <circle cx="50" cy="50" r="30.4" fill="none" stroke={c[0]} strokeWidth="1" opacity=".4" />
    {place(emuArt(c, false), 46, 52, 0.7)}
  </>);
}

// ── Columbus Ibex
function ibexArt(c: Pal, sm: boolean) {
  const coat = '#a07a52', coatD = '#6e5236', horn = '#c9a66b', hornD = '#8f7240', sw = sm ? 2.6 : 1.8;
  const HORN = 'M44 33 C34 25 24 16 21 3 C29 9 37 13 45 18 C49 22 51 27 50 32 Z';
  const EAR = 'M37 42 C31 39 25 39 21 42 C25 46 31 47 37 45 Z';
  return (<>
    <path d={HORN} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(HORN)} fill={horn} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    {[[40, 24], [36, 20], [32, 16], [28, 12], [25, 8]].map(([x, y], i) => <g key={i}><path d={`M${x - 3} ${y + 2} L${x + 3} ${y - 2}`} stroke={hornD} strokeWidth="1.4" /><path d={`M${100 - x + 3} ${y + 2} L${100 - x - 3} ${y - 2}`} stroke={hornD} strokeWidth="1.4" /></g>)}
    <path d={EAR} fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" /><path d={mirror(EAR)} fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M38 32 C42 28 58 28 62 32 C66 42 64 52 60 60 C58 68 58 74 56 80 C54 84 46 84 44 80 C42 74 42 68 40 60 C36 52 34 42 38 32 Z" fill={coat} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M46.6 36 L53.4 36 L54 66 L46 66 Z" fill={coatD} opacity=".55" />
    <path d="M45 80 C46 88 48 94 50 97 C52 94 54 88 55 80 Z" fill={coatD} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    <ellipse cx="43" cy="48" rx={sm ? 3.4 : 3} ry={sm ? 2.6 : 2.2} fill="#e8b931" stroke={INK} strokeWidth=".8" /><ellipse cx="57" cy="48" rx={sm ? 3.4 : 3} ry={sm ? 2.6 : 2.2} fill="#e8b931" stroke={INK} strokeWidth=".8" />
    <rect x="41" y="47.4" width="4" height="1.3" fill={INK} /><rect x="55" y="47.4" width="4" height="1.3" fill={INK} />
    <ellipse cx="47" cy="76" rx="1.4" ry="2" fill={INK} /><ellipse cx="53" cy="76" rx="1.4" ry="2" fill={INK} />
  </>);
}
function ibex(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(ibexArt(c, true), 50, 50, 0.96));
  return Octagon({ uid, k: 'cb', c: [c[0], c[1]], city: 'COLUMBUS', nick: 'IBEX', bg: lt(c[0], 0.4) }, ibexArt(c, false), <>
    <path d="M0 62 L20 46 L32 56 L48 40 L64 56 L78 44 L100 60 V100 H0 Z" fill={lt(c[0], 0.15)} />
  </>, { artY: 47, artS: 0.5 });
}

// ── Tampa Sleds
function sledArt(c: Pal, sm: boolean) {
  const wood = '#c8935a', runner = '#e63946', sw = sm ? 2.6 : 1.8;
  return (<g transform="rotate(10 50 60)">
    {!sm && [[10, 70], [6, 62], [14, 64], [4, 72], [12, 58]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6 - i * 0.15} fill="#e9c46a" stroke={INK} strokeWidth=".5" />)}
    {!sm && <path d="M18 50 H6 M20 56 H2 M18 62 H8" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />}
    <path d="M14 70 L80 70 C88 70 92 64 90 56" fill="none" stroke={INK} strokeWidth={sm ? 7 : 6} strokeLinecap="round" />
    <path d="M14 70 L80 70 C88 70 92 64 90 56" fill="none" stroke={runner} strokeWidth={sm ? 3.6 : 3.2} strokeLinecap="round" />
    {[26, 44, 62, 76].map(x => <rect key={x} x={x} y="60" width="3" height="10" fill={STEEL} stroke={INK} strokeWidth=".8" />)}
    <rect x="16" y="52" width="66" height="9" rx="2" fill={wood} stroke={INK} strokeWidth={sw} />
    {[30, 44, 58, 72].map(x => <path key={x} d={`M${x} 53 V60`} stroke={dk(wood, 0.3)} strokeWidth="1" />)}
    <path d="M78 50 L88 50" stroke={INK} strokeWidth="4" strokeLinecap="round" /><path d="M78 50 L88 50" stroke={runner} strokeWidth="2" strokeLinecap="round" />
  </g>);
}
function sleds(uid: string, sm: boolean, c: Pal) {
  if (sm) return Disc(c[0], place(sledArt(c, true), 50, 46, 0.96));
  return Pennant({ uid, k: 'tp', c: [c[0], c[1]], city: 'TAMPA', nick: 'SLEDS' }, sledArt(c, false), { artS: 0.4 });
}

// ── Brooklyn Squares
function squareArt(c: Pal, sm: boolean) {
  const sw = sm ? 2.6 : 1.8;
  return (<>
    <rect x="20" y="18" width="60" height="60" rx="6" fill={c[0]} stroke={INK} strokeWidth={sw + 0.6} />
    <rect x="34" y="12" width="32" height="8" rx="1.6" fill={INK} />
    <path d="M26 40 L44 38 M56 38 L74 40" stroke={INK} strokeWidth={sm ? 3.6 : 3} strokeLinecap="round" />
    <rect x="25" y="42" width="21" height="15" rx="3" fill="#ffffff" stroke={INK} strokeWidth={sm ? 4 : 3.4} />
    <rect x="54" y="42" width="21" height="15" rx="3" fill="#ffffff" stroke={INK} strokeWidth={sm ? 4 : 3.4} />
    <path d="M46 47 H54" stroke={INK} strokeWidth="3" />
    <circle cx="38" cy="50" r="2.4" fill={INK} /><circle cx="62" cy="50" r="2.4" fill={INK} />
    <path d="M42 67 H58" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M50 84 L38 78 L38 90 Z M50 84 L62 78 L62 90 Z" fill={c[1] === '#2b2b2b' ? '#e63946' : c[1]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    <rect x="47.6" y="81.6" width="4.8" height="4.8" rx="1" fill={INK} />
  </>);
}
function squares(uid: string, sm: boolean, c: Pal) {
  if (sm) return (<><rect x="3" y="3" width="94" height="94" rx="14" fill={c[1]} stroke={INK} strokeWidth="3" />{place(squareArt(c, true), 50, 50, 0.92)}</>);
  return (<>
    <rect x="2.4" y="2.4" width="95.2" height="95.2" rx="8" fill={INK} />
    <rect x="5.6" y="5.6" width="88.8" height="88.8" rx="6" fill={c[1]} />
    {[24, 38, 52, 66].map(v => <g key={v}><path d={`M${v} 22 V78`} stroke={lt(c[1], 0.12)} strokeWidth="1" /><path d={`M8 ${v} H92`} stroke={lt(c[1], 0.12)} strokeWidth="1" /></g>)}
    <rect x="5.6" y="5.6" width="88.8" height="15" rx="6" fill={c[0]} /><path d="M5.6 20.6 H94.4" stroke={INK} strokeWidth="1.4" />
    <rect x="5.6" y="79.4" width="88.8" height="15" rx="6" fill={c[0]} /><path d="M5.6 79.4 H94.4" stroke={INK} strokeWidth="1.4" />
    <Txt y={16.6} text="BROOKLYN" size={8} fill={INK} max={70} ls={3} />
    <Txt y={91.6} text="SQUARES" size={9.6} fill={INK} max={72} ls={3.4} />
    {place(squareArt(c, false), 50, 50, 0.58)}
  </>);
}

export const EAST_MARKS: Record<string, { name: string; draw: (uid: string, sm: boolean, c: Pal) => ReactNode }> = {
  WAS: { name: 'Blossoms', draw: blossoms }, BOS: { name: 'Colonials', draw: colonials }, MIA: { name: 'Flamingos', draw: flamingos },
  ORL: { name: 'Citrus', draw: citrus }, JAX: { name: 'Navigators', draw: navigators }, IND: { name: 'Crossroads', draw: crossroads },
  MKE: { name: 'Brewmasters', draw: brewmasters }, LOU: { name: 'Thoroughbreds', draw: thoroughbreds }, BUF: { name: 'Falls', draw: falls },
  ROC: { name: 'Shutters', draw: shutters }, RAL: { name: 'Gondolas', draw: gondolas }, NOR: { name: 'Shipwrights', draw: shipwrights },
  PIT: { name: 'Ballerinas', draw: ballerinas }, MEM: { name: 'Blues', draw: blues }, TOR: { name: 'Towers', draw: towers },
  MTL: { name: 'Voyageurs', draw: voyageurs }, OTT: { name: 'Skaters', draw: skaters }, GRR: { name: 'Craftsmen', draw: craftsmen },
  LDN: { name: 'Beefeaters', draw: beefeaters }, PAR: { name: 'Lumières', draw: lumieres }, MAD: { name: 'Osos', draw: osos },
  BER: { name: 'Gatekeepers', draw: gatekeepers }, NOL: { name: 'Second Liners', draw: secondLiners }, HFD: { name: 'Jesters', draw: jesters },
  PRV: { name: 'Emus', draw: emus }, CBS: { name: 'Ibex', draw: ibex }, TPA: { name: 'Sleds', draw: sleds }, BKN: { name: 'Squares', draw: squares },
};

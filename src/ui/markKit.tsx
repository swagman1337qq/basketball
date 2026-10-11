// Shared drawing kit for the hand-drawn team logos (teamMarks.tsx, expansionMarksEast/West.tsx):
// colors, outlined lines, fluffy edges, sparkles and stars, placing a mascot, lettering on arcs and
// ribbons, and the frames (roundel, shield, arch, disc).
import type { ReactNode } from 'react';

export type Pal = [string, string];
export const INK = '#1b1a21', PAPER = '#fffaf0', SKIN = '#e2b18a', WOOD = '#7a5230', STEEL = '#a7b0ba', STEEL_D = '#68727d', STEEL_L = '#dfe5ea';
export const HEAD = "'Oswald', 'Arial Narrow', Impact, sans-serif", SCRIPT = "'Yellowtail', 'Brush Script MT', cursive", VARSITY = "'Graduate', 'Rockwell', serif";
// About how wide a capital (script: a letter) runs in each face, in ems: to squeeze long names to fit.
export const em = (font: string) => (font === VARSITY ? 0.72 : font === SCRIPT ? 0.42 : 0.5);

// ── Colors ──
export const rgb = (h: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x808080; return [n >> 16, (n >> 8) & 255, n & 255]; };
export const mix = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const dk = (c: string, t = 0.4) => mix(c, '#000000', t), lt = (c: string, t = 0.45) => mix(c, '#ffffff', t);
export const lum = (c: string) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
export const on = (c: string) => (lum(c) > 0.6 ? INK : PAPER); // text on a color
export const lite = (c: Pal) => (lum(c[0]) >= lum(c[1]) ? c[0] : c[1]); // the lighter club color (text on ink)

// ── Drawing helpers ──
export const f2 = (n: number) => +n.toFixed(2);
// A line drawn twice, ink under color, so it reads as an outlined shape (legs, handles, antlers).
export const Line2 = ({ d, c, w, o = 2.6 }: { d: string; c: string; w: number; o?: number }) => (<>
  <path d={d} fill="none" stroke={INK} strokeWidth={w + o} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
</>);
// A fluffy circle: n bumps around (cx, cy).
export const fluff = (cx: number, cy: number, r: number, n: number, bump = 0.16) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, x = f2(cx + Math.cos(a) * r), y = f2(cy + Math.sin(a) * r);
    if (!i) { d += `M${x} ${y}`; continue; }
    const am = ((i - 0.5) / n) * Math.PI * 2, rr = r * (1 + bump);
    d += `Q${f2(cx + Math.cos(am) * rr)} ${f2(cy + Math.sin(am) * rr)} ${x} ${y}`;
  }
  return d + 'Z';
};
export const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f2(100 - +x)} ${y}`); // flip a path of absolute M/L/C/Q/Z commands left↔right
// A 4-point sparkle.
export const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`;
export const star5 = (x: number, y: number, R: number, r: number) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r : R; return f2(x + Math.cos(a) * q) + ',' + f2(y + Math.sin(a) * q); }).join(' ');
// Place a mascot (drawn on 0–100) centered at (x, y), scaled by s.
export const place = (art: ReactNode, x: number, y: number, s: number, rot = 0) => <g transform={`translate(${x} ${y}) scale(${s})${rot ? ` rotate(${rot})` : ''} translate(-50 -50)`}>{art}</g>;

// Text along an arc of radius r around the center: over the top, or under the bottom (reading left to right).
// Oswald capitals run about half an em wide; long names are squeezed to fit.
export function Arc({ id, text, r, top, size, fill, ls = 1.3, room, font = HEAD, stroke, sw = 1.6 }: { id: string; text: string; r: number; top: boolean; size: number; fill: string; ls?: number; room?: number; font?: string; stroke?: string; sw?: number }) {
  const d = top ? `M${50 - r} 50 A${r} ${r} 0 0 1 ${50 + r} 50` : `M${50 - r} 50 A${r} ${r} 0 0 0 ${50 + r} 50`;
  const max = room ?? Math.PI * r * (top ? 0.72 : 0.6), est = text.length * (size * em(font) + ls);
  return (<>
    <path id={id} d={d} fill="none" />
    <text fontFamily={font} fontWeight={font === HEAD ? 700 : 400} fontSize={size} fill={fill} letterSpacing={ls} {...(stroke ? { stroke, strokeWidth: sw, paintOrder: 'stroke', strokeLinejoin: 'round' as const } : {})}>
      <textPath href={'#' + id} startOffset="50%" textAnchor="middle" {...(est > max ? { textLength: f2(max), lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{text}</textPath>
    </text>
  </>);
}
// A banner with folded tails, gently arched, the text following the arch.
export function Ribbon({ id, y, w, h = 12, fill, text, tfill, size = 8.4, ls = 1.4, arch = 2.4, font = HEAD }: { id: string; y: number; w: number; h?: number; fill: string; text: string; tfill?: string; size?: number; ls?: number; arch?: number; font?: string }) {
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
export interface RingO { uid: string; k: string; band: string; inner: string; city: string; nick: string; text?: string; trim?: string; R?: number }
export function Ring(o: RingO, inside: ReactNode, over?: ReactNode) {
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
export const SHIELD = 'M50 3.5 L91 13 V46 C91 71.5 73.5 86.5 50 96.5 C26.5 86.5 9 71.5 9 46 V13 Z';
export function Shield(o: { uid: string; k: string; field: string; band: string; city: string; nick: string; ribbon: string; ribbonY?: number }, inside: ReactNode, over?: ReactNode) {
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
export const Disc = (bg: string, art: ReactNode, ring = INK) => (<><circle cx="50" cy="50" r="48.5" fill={bg} stroke={ring} strokeWidth="3" />{art}</>);


// ═══════════════════════════════ Layouts: mascot + city + nickname ═══════════════════════════════
// Every club's logo carries its mascot, its city and its nickname; the layouts below set them
// differently (a wordmark, a pennant, a diamond, a varsity arch, a patch, a tag, an octagon, a
// sunburst, a script swash, a seal, an arch, a hexagon), so no two neighbors look alike.
export interface LayO { uid: string; k: string; c: Pal; city: string; nick: string; font?: string; bg?: string; ink?: string }

// A big outlined word with an ink drop shadow, straight or gently arched, squeezed to `max` if long.
export function Word({ id, text, y, size, fill, max, arch = 0, font = HEAD, ls = 0.8, sw = 2.4, x = 50 }: { id: string; text: string; y: number; size: number; fill: string; max: number; arch?: number; font?: string; ls?: number; sw?: number; x?: number }) {
  const est = text.length * (size * em(font) + ls), fit = est > max * 0.96 ? { textLength: f2(max * 0.96), lengthAdjust: 'spacingAndGlyphs' as const } : {};
  const d = `M${f2(x - max / 2)} ${y} Q${x} ${f2(y - arch * 2)} ${f2(x + max / 2)} ${y}`, w = font === HEAD ? 700 : 400;
  return (<>
    <path id={id} d={d} fill="none" />
    <text fontFamily={font} fontWeight={w} fontSize={size} fill={INK} letterSpacing={ls} transform="translate(1.1 1.3)"><textPath href={'#' + id} startOffset="50%" textAnchor="middle" {...fit}>{text}</textPath></text>
    <text fontFamily={font} fontWeight={w} fontSize={size} fill={fill} letterSpacing={ls} stroke={INK} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke"><textPath href={'#' + id} startOffset="50%" textAnchor="middle" {...fit}>{text}</textPath></text>
  </>);
}
// A pill-shaped label (the city under a wordmark).
export function Pill({ y, text, fill, tfill, size = 6.2, ls = 1.8, x = 50 }: { y: number; text: string; fill: string; tfill: string; size?: number; ls?: number; x?: number }) {
  const w = Math.min(84, text.length * (size * 0.5 + ls) + 10);
  return (<>
    <rect x={f2(x - w / 2)} y={f2(y - size * 0.95)} width={f2(w)} height={f2(size * 1.55)} rx={f2(size * 0.77)} fill={fill} stroke={INK} strokeWidth="1.1" />
    <text x={x} y={f2(y + size * 0.05)} textAnchor="middle" fontFamily={HEAD} fontWeight="700" fontSize={size} fill={tfill} letterSpacing={ls} {...(w >= 84 ? { textLength: 76, lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{text}</text>
  </>);
}
// Straight text fitted to a width.
export function Txt({ x = 50, y, text, size, fill, ls = 1.5, max = 80, font = HEAD, anchor = 'middle' }: { x?: number; y: number; text: string; size: number; fill: string; ls?: number; max?: number; font?: string; anchor?: 'middle' | 'start' }) {
  const est = text.length * (size * em(font) + ls);
  return <text x={x} y={y} textAnchor={anchor} fontFamily={font} fontWeight={font === HEAD ? 700 : 400} fontSize={size} fill={fill} letterSpacing={ls} {...(est > max ? { textLength: f2(max), lengthAdjust: 'spacingAndGlyphs' as const } : {})}>{text}</text>;
}

// Wordmark: the mascot over a disc, the nickname big and outlined beneath, the city on a pill.
export function Wordmark(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number; size?: number } = {}) {
  const cid = o.k + 'w' + o.uid, disc = o.bg ?? o.c[1];
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="37" r="30" /></clipPath></defs>
    <circle cx="50" cy="37" r="32.4" fill={INK} />
    <circle cx="50" cy="37" r="30" fill={disc} />
    {scene && <g clipPath={`url(#${cid})`}>{scene}</g>}
    <circle cx="50" cy="37" r="27.6" fill="none" stroke={o.c[0]} strokeWidth="1" opacity=".6" />
    {place(art, 50, opts.artY ?? 37, opts.artS ?? 0.56)}
    <Word id={o.k + 'n' + o.uid} text={o.nick} y={84} size={opts.size ?? 17} fill={o.c[0]} max={94} arch={2.6} font={o.font ?? HEAD} />
    <Pill y={94.4} text={o.city} fill={INK} tfill={lum(lite(o.c)) < 0.25 ? PAPER : lite(o.c)} />
  </>);
}
// Pennant: a felt pennant with a striped sleeve, the mascot on a medallion at the wide end.
export function Pennant(o: LayO, art: ReactNode, opts: { tilt?: number; artS?: number } = {}) {
  const P = 'M10 20 L97 45 L97 55 L10 80 Z', tx = on(o.c[0]) === INK ? INK : PAPER;
  return (<g transform={`rotate(${opts.tilt ?? -7} 50 50)`}>
    <path d={P} fill={o.c[0]} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M15 26 L92 48 M15 74 L92 52" stroke={o.c[1]} strokeWidth="1.2" opacity=".7" />
    <rect x="3" y="17" width="10" height="66" rx="2" fill={o.c[1]} stroke={INK} strokeWidth="2" />
    {[24, 34, 44, 54, 64, 74].map(y => <circle key={y} cx="8" cy={y} r="1" fill={INK} opacity=".55" />)}
    <circle cx="31" cy="50" r="20" fill={o.c[1]} stroke={INK} strokeWidth="2.2" />
    {place(art, 31, 50, opts.artS ?? 0.36)}
    <Txt x={67} y={43.6} text={o.city} size={6.2} fill={tx} max={30} ls={1.6} />
    <Word id={o.k + 'n' + o.uid} text={o.nick} x={67} y={58.6} size={12} fill={o.c[1]} max={42} sw={2} font={o.font ?? HEAD} />
  </g>);
}
// Diamond: a diamond badge, the city in its top corner, the nickname on a ribbon across.
const dia = (r: number) => `M50 ${f2(50 - r)} L${f2(50 + r)} 50 L50 ${f2(50 + r)} L${f2(50 - r)} 50 Z`;
export function Diamond(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'd' + o.uid;
  return (<>
    <defs><clipPath id={cid}><path d={dia(43.6)} /></clipPath></defs>
    <path d={dia(49.4)} fill={INK} />
    <path d={dia(47)} fill={o.c[1]} />
    <path d={dia(43.6)} fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 46, opts.artS ?? 0.5)}</g>
    <Txt y={23.6} text={o.city} size={5.8} fill={on(o.bg ?? o.c[0])} max={26} ls={1.2} />
    <Ribbon id={o.k + 'r' + o.uid} y={71} w={74} fill={o.c[1]} text={o.nick} size={9} />
  </>);
}
// Varsity: the nickname arched over the top in collegiate letters, the city on a bar below.
export function Varsity(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'v' + o.uid;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="44.6" /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.2" fill={o.c[1]} />
    <circle cx="50" cy="50" r="44.6" fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}</g>
    <Arc id={o.k + 'n' + o.uid} text={o.nick} r={32.6} top size={11.6} fill={o.c[1]} font={VARSITY} ls={0.6} stroke={INK} sw={2} room={78} />
    {place(art, 50, opts.artY ?? 58, opts.artS ?? 0.48)}
    <rect x="25" y="82.6" width="50" height="10.4" rx="2" fill={INK} />
    <Txt y={90.2} text={o.city} size={6.6} fill={lite(o.c)} max={44} ls={1.8} />
  </>);
}
// Patch: an embroidered oval patch with stitching, the mascot breaking out of the top, the
// nickname in script across it and the city underneath.
export function Patch(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'p' + o.uid;
  return (<>
    <defs><clipPath id={cid}><ellipse cx="50" cy="62" rx="45" ry="29" /></clipPath></defs>
    <ellipse cx="50" cy="62" rx="47.4" ry="31.4" fill={INK} />
    <ellipse cx="50" cy="62" rx="45" ry="29" fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}</g>
    <ellipse cx="50" cy="62" rx="41.6" ry="25.6" fill="none" stroke={o.c[1]} strokeWidth="1.1" strokeDasharray="2.2 1.6" />
    {place(art, 50, opts.artY ?? 34, opts.artS ?? 0.54)}
    <Word id={o.k + 'n' + o.uid} text={o.nick} y={75} size={21} fill={o.c[1]} max={76} arch={1} font={SCRIPT} ls={0.2} sw={2.6} />
    <Txt y={86.4} text={o.city} size={5.8} fill={on(o.bg ?? o.c[0])} max={40} ls={2} />
  </>);
}
// Tag: a tall tag-shaped badge, the city in its top band and the nickname on a plate.
export const TAG = 'M16 5 H84 C89 5 92 8 92 13 V76 C92 83 88 87 81 89.6 L50 97 L19 89.6 C12 87 8 83 8 76 V13 C8 8 11 5 16 5 Z';
export function Tag(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number; plate?: string } = {}) {
  const cid = o.k + 't' + o.uid, plate = opts.plate ?? o.c[1];
  return (<>
    <defs><clipPath id={cid}><path d={TAG} /></clipPath></defs>
    <path d={TAG} fill={o.bg ?? o.c[0]} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <g clipPath={`url(#${cid})`}>{scene}
      <rect x="0" y="0" width="100" height="21" fill={o.c[1]} /><path d="M0 21 H100" stroke={INK} strokeWidth="1.4" />
      {place(art, 50, opts.artY ?? 49, opts.artS ?? 0.5)}
    </g>
    <path d={TAG} fill="none" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <Txt y={16.8} text={o.city} size={7.6} fill={on(o.c[1])} max={70} ls={1.8} />
    <rect x="13" y="70" width="74" height="14" rx="2.4" fill={plate} stroke={INK} strokeWidth="1.6" />
    <Txt y={80.6} text={o.nick} size={10.6} fill={on(plate)} max={66} ls={1.6} />
  </>);
}
// Octagon: an eight-sided badge (a road-sign shape), the city on its top band, the nickname on a plaque.
const oct = (r: number) => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + (i * Math.PI) / 4; return f2(50 + Math.cos(a) * r) + ',' + f2(50 + Math.sin(a) * r); }).join(' ');
export function Octagon(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'o' + o.uid;
  return (<>
    <defs><clipPath id={cid}><polygon points={oct(44.6)} /></clipPath></defs>
    <polygon points={oct(50)} fill={INK} />
    <polygon points={oct(47.6)} fill={o.c[1]} />
    <polygon points={oct(44.6)} fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 49, opts.artS ?? 0.52)}<rect x="0" y="0" width="100" height="20.4" fill={INK} /></g>
    <Txt y={17} text={o.city} size={7.2} fill={lite(o.c)} max={44} ls={1.8} />
    <rect x="15" y="69" width="70" height="14.4" rx="3" fill={o.c[1]} stroke={INK} strokeWidth="1.6" />
    <Txt y={80} text={o.nick} size={10.4} fill={on(o.c[1])} max={62} ls={1.6} />
  </>);
}
// Sunburst: rays behind the mascot, the city on a small banner up top, the nickname on a big ribbon.
export function Sunburst(o: LayO, art: ReactNode, opts: { artY?: number; artS?: number; ray?: string; core?: string } = {}) {
  const cid = o.k + 's' + o.uid, ray = opts.ray ?? lt(o.c[0], 0.22);
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="45" /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={o.c[1]} />
    <circle cx="50" cy="50" r="45" fill={o.c[0]} />
    <g clipPath={`url(#${cid})`}>
      {Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, w = Math.PI / 18; return <path key={i} d={`M50 46 L${f2(50 + Math.cos(a - w / 2) * 70)} ${f2(46 + Math.sin(a - w / 2) * 70)} L${f2(50 + Math.cos(a + w / 2) * 70)} ${f2(46 + Math.sin(a + w / 2) * 70)} Z`} fill={ray} />; })}
      <circle cx="50" cy="46" r="24" fill={opts.core ?? lt(o.c[1], 0.3)} stroke={INK} strokeWidth="1.6" />
    </g>
    {place(art, 50, opts.artY ?? 46, opts.artS ?? 0.54)}
    <rect x="30" y="7.6" width="40" height="10" rx="2" fill={INK} />
    <Txt y={15} text={o.city} size={6.4} fill={lite(o.c)} max={34} ls={1.6} />
    <Ribbon id={o.k + 'r' + o.uid} y={79} w={76} fill={o.c[1]} text={o.nick} size={9.4} />
  </>);
}
// Script: a scene in a ring, the city arched over the top, the nickname in a script swash.
export function Script(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number; swash?: string } = {}) {
  const cid = o.k + 'c' + o.uid;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="45" /></clipPath></defs>
    <circle cx="50" cy="50" r="49.3" fill={INK} />
    <circle cx="50" cy="50" r="47.3" fill={o.c[1]} />
    <circle cx="50" cy="50" r="45" fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 43, opts.artS ?? 0.56)}</g>
    <Arc id={o.k + 't' + o.uid} text={o.city} r={38.2} top size={7} fill={PAPER} ls={1.8} stroke={INK} sw={1.6} />
    <g transform="rotate(-7 50 74)">
      <Word id={o.k + 'n' + o.uid} text={o.nick} y={79} size={23} fill={o.c[1]} max={80} font={SCRIPT} ls={0.2} sw={2.8} />
      <path d="M17 84 Q48 78 86 82" fill="none" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M17 84 Q48 78 86 82" fill="none" stroke={opts.swash ?? o.c[1]} strokeWidth="2" strokeLinecap="round" />
    </g>
  </>);
}
// Seal: a scalloped edge (a bottle cap, a wax seal), the city and nickname in a band around the mascot.
export function Seal(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'e' + o.uid;
  return (<>
    <defs><clipPath id={cid}><circle cx="50" cy="50" r="28.6" /></clipPath></defs>
    <path d={fluff(50, 50, 46.4, 30, 0.055)} fill={o.c[1]} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="42.4" fill={o.c[0]} stroke={INK} strokeWidth="1.6" />
    <circle cx="50" cy="50" r="40.4" fill="none" stroke={o.c[1]} strokeWidth=".8" strokeDasharray="1.4 1.4" />
    <Arc id={o.k + 't' + o.uid} text={o.city} r={32.8} top size={7.4} fill={on(o.c[0])} ls={1.6} />
    <Arc id={o.k + 'b' + o.uid} text={o.nick} r={38.4} top={false} size={7.6} fill={on(o.c[0])} ls={1.6} />
    <circle cx="50" cy="50" r="30.4" fill={INK} />
    <circle cx="50" cy="50" r="28.6" fill={o.bg ?? lt(o.c[1], 0.4)} />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 50, opts.artS ?? 0.46)}</g>
  </>);
}
// Arch: a tall arched window (a doorway, a tower), the nickname on a ribbon and the city on a plate.
export const ARCH = 'M50 3 C70 11.5 87 29 87 55 V95.5 H13 V55 C13 29 30 11.5 50 3 Z';
export function Arch(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number; plate?: string } = {}) {
  const cid = o.k + 'a' + o.uid;
  return (<>
    <defs><clipPath id={cid}><path d={ARCH} /></clipPath></defs>
    <path d={ARCH} fill={o.bg ?? o.c[0]} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 50, opts.artS ?? 0.62)}</g>
    <path d="M17 87 V55 C17 30.6 32.4 14.6 50 7 C67.6 14.6 83 30.6 83 55 V87" fill="none" stroke={o.c[1]} strokeWidth="1" opacity=".75" />
    <path d={ARCH} fill="none" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <path d="M13 87.6 H87 V95.5 H13 Z" fill={opts.plate ?? INK} />
    <Txt y={93.9} text={o.city} size={6.4} fill={lite(o.c)} max={66} ls={2} />
    <Ribbon id={o.k + 'r' + o.uid} y={78.6} w={72} fill={o.c[1]} text={o.nick} />
  </>);
}
// Hexagon: a flat-topped hexagon with a band for the city and a ribbon for the nickname.
const hex = (r: number) => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return f2(50 + Math.cos(a) * r) + ',' + f2(50 + Math.sin(a) * r); }).join(' ');
export function Hexagon(o: LayO, art: ReactNode, scene?: ReactNode, opts: { artY?: number; artS?: number } = {}) {
  const cid = o.k + 'h' + o.uid;
  return (<>
    <defs><clipPath id={cid}><polygon points={hex(44.6)} /></clipPath></defs>
    <polygon points={hex(50)} fill={INK} />
    <polygon points={hex(47.6)} fill={o.c[1]} />
    <polygon points={hex(44.6)} fill={o.bg ?? o.c[0]} />
    <g clipPath={`url(#${cid})`}>{scene}{place(art, 50, opts.artY ?? 50, opts.artS ?? 0.56)}<rect x="0" y="0" width="100" height="21" fill={o.c[1]} /><path d="M0 21 H100" stroke={INK} strokeWidth="1.4" /></g>
    <Txt y={17.2} text={o.city} size={7.2} fill={on(o.c[1])} max={46} ls={1.8} />
    <Ribbon id={o.k + 'r' + o.uid} y={79} w={66} fill={o.c[1]} text={o.nick} size={9} />
  </>);
}

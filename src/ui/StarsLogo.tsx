import { INK, PAPER, dk, lt, star5, type Pal } from './markKit';

export type StarsLogoConcept = 'mascot' | 'comet' | 'roundel';
const STAR = 'M49 17 59 34 80 36 65 50 69 72 49 61 29 72 34 50 18 35 39 33Z';
const LETTERS = [
  'M18 0H2L0 3V10L3 12H12V16H0V22H16L19 19V10L16 8H7V6H18Z',
  'M0 0H20V6H13V22H6V6H0Z',
  'M5 0H15L21 22H14L12.5 16H7.5L6 22H0Z M9 6 8 11H12L11 6Z',
  'M0 0H15L19 4V11L15 14 21 22H13L7 14V22H0Z M7 6V9H12V6Z',
  'M18 0H2L0 3V10L3 12H12V16H0V22H16L19 19V10L16 8H7V6H18Z',
];

export function StarsBasketball({ x, y, radius, color = '#ef8a29' }: { x: number; y: number; radius: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${radius / 12})`}>
      <circle r="12" fill={color} stroke={INK} strokeWidth="2.2" />
      <path d="M-11-4Q0 2 11 5 M-3-11Q3 0 2 11 M-9-8Q2-7 8 9 M-9 8Q-1-3 9-8" fill="none" stroke={INK} strokeWidth="1.1" />
      <path d="M-8-6Q-5-10 0-10" fill="none" stroke={PAPER} strokeWidth="1.3" strokeLinecap="round" opacity=".55" />
    </g>
  );
}

function StarsWordmark({ c, y = 74, scale = 0.82 }: { c: Pal; y?: number; scale?: number }) {
  const glyphs = (fill: string, stroke: string, width: number) =>
    LETTERS.map((d, i) => (
      <path
        key={i}
        d={d}
        transform={`translate(${i * 21} 0)`}
        fill={fill}
        stroke={stroke}
        strokeWidth={width}
        strokeLinejoin="round"
        fillRule="evenodd"
      />
    ));
  return (
    <g aria-hidden="true" transform={`translate(9 ${y}) scale(${scale} .78) skewX(-12)`}>
      <g transform="translate(1.7 2.6)">{glyphs(INK, INK, 6)}</g>
      {glyphs(c[1], PAPER, 9)}
      {glyphs(c[1], INK, 5.5)}
      {glyphs(c[1], c[0], 2)}
      {glyphs(c[1], INK, 0.55)}
    </g>
  );
}

export function StarsMascot({ c }: { c: Pal }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M36 58 32 74 42 78 48 60 M54 59 58 76 69 73 64 55" fill={c[0]} stroke={INK} strokeWidth="2.8" />
      <path
        d="M30 72 25 78Q24 82 29 83H46L45 78 40 74Z M59 72 57 80Q65 85 78 81L79 76 69 74 66 70Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path d="M28 80H44 M60 79 76 78 M34 74 32 78 M38 75 36 79 M65 73 64 77 M69 74 68 78" fill="none" stroke={c[0]} strokeWidth="1.5" />
      <path d="M26 43Q17 40 14 47L12 54 20 57Q23 52 33 54 M66 43Q73 35 82 40L80 51 66 55" fill={c[0]} stroke={INK} strokeWidth="3" />
      <path d="M11 47Q6 45 5 50L7 55 6 59Q11 64 19 58L23 51 19 48 15 51Z" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <path d="M8 51 11 55 M11 49 14 53 M9 58 15 56" fill="none" stroke={INK} strokeWidth="1" />
      <path d={STAR} fill={c[1]} stroke={PAPER} strokeWidth="7" />
      <path d={STAR} fill={c[1]} stroke={INK} strokeWidth="3" />
      <path d="M49 19 48 42 21 36 40 34Z" fill={lt(c[1], 0.35)} />
      <path d="M50 58 65 51 67 67 54 60 31 69 36 52Z" fill={dk(c[1], 0.14)} />
      <path d="M36 49Q49 54 64 48L62 61 51 67 35 59Z" fill={c[0]} stroke={INK} strokeWidth="2" />
      <path d="M39 51Q49 56 60 51 M38 58 48 62" fill="none" stroke={PAPER} strokeWidth="1.1" />
      <text x="49" y="61" textAnchor="middle" fontFamily="Impact, Arial Black, sans-serif" fontStyle="italic" fontSize="8" fill={PAPER}>
        LA
      </text>
      <path d="M37 36 47 38 45 43H38Z M52 38 63 33 62 41 53 43Z" fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <path d="M42 38V42 M57 37V41" stroke={INK} strokeWidth="2.5" />
      <path d="M35 33 47 36 M52 35 64 30" fill="none" stroke={INK} strokeWidth="2.4" />
      <path d="M43 46Q51 53 60 44 53 47 43 46Z" fill={PAPER} stroke={INK} strokeWidth="1.5" />
      <StarsBasketball x={82} y={43} radius={12} />
      <path d="M72 49Q76 45 80 50L78 53Q75 56 70 55L67 52Z" fill={PAPER} stroke={INK} strokeWidth="1.8" />
      <path d="M72 50 76 52 M71 52 74 54" stroke={INK} strokeWidth=".9" />
    </g>
  );
}

/** Three original 1990s directions; the mascot version is the Stars' in-game identity. */
export function starsLogo(uid: string, small: boolean, c: Pal, concept: StarsLogoConcept = 'mascot') {
  if (small)
    return (
      <g data-stars-version="compact">
        <polygon points={star5(48, 49, 43, 20)} fill={c[1]} stroke={PAPER} strokeWidth="7" strokeLinejoin="round" />
        <polygon points={star5(48, 49, 43, 20)} fill={c[1]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M31 40 43 44 M52 43 65 37 M39 57Q49 65 60 53" fill="none" stroke={c[0]} strokeWidth="5" strokeLinecap="round" />
        <StarsBasketball x={74} y={70} radius={20} color={c[0]} />
      </g>
    );
  if (concept === 'comet')
    return (
      <g data-stars-version="comet" transform="translate(3 3) scale(.94)">
        <path d="M4 64 42 16 38 47 83 10 66 50 97 36 72 75 38 88Z" fill={c[0]} stroke={PAPER} strokeWidth="7" strokeLinejoin="round" />
        <path d="M4 64 42 16 38 47 83 10 66 50 97 36 72 75 38 88Z" fill={c[0]} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M9 70 72 17 M19 79 88 32" stroke={c[1]} strokeWidth="3" />
        <polygon points={star5(61, 42, 28, 11)} fill={c[1]} stroke={INK} strokeWidth="2.5" />
        <StarsBasketball x={25} y={57} radius={15} />
        <text
          x="46"
          y="12"
          textAnchor="middle"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="7"
          letterSpacing="1"
          fill={INK}
          stroke={PAPER}
          strokeWidth="2.8"
          paintOrder="stroke"
        >
          LOS ANGELES
        </text>
        <g transform="rotate(-9 50 70)">
          <StarsWordmark c={c} y={68} />
        </g>
      </g>
    );
  if (concept === 'roundel')
    return (
      <g data-stars-version="roundel">
        <circle cx="50" cy="49" r="45" fill={c[0]} stroke={PAPER} strokeWidth="7" />
        <circle cx="50" cy="49" r="45" fill="none" stroke={INK} strokeWidth="3" />
        <circle cx="50" cy="49" r="31" fill={c[1]} stroke={INK} strokeWidth="2" />
        <text x="50" y="19" textAnchor="middle" fontFamily="Impact, Arial Black, sans-serif" fontSize="7.5" fill={PAPER} letterSpacing=".7">
          LOS ANGELES
        </text>
        <g transform="translate(14 12) scale(.72)">
          <StarsMascot c={c} />
        </g>
        <StarsWordmark c={c} />
      </g>
    );
  return (
    <g data-stars-version="mascot">
      <path d="M17 69 10 26 42 12 87 26 92 68 70 83 35 83Z" fill={c[0]} stroke={PAPER} strokeWidth="6" strokeLinejoin="round" />
      <path d="M17 69 10 26 42 12 87 26 92 68 70 83 35 83Z" fill={c[0]} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 63 30 27 51 21 78 31 86 63 66 77 36 77Z" fill={lt(c[0], 0.3)} />
      <StarsMascot c={c} />
      <text
        x="49"
        y="11"
        textAnchor="middle"
        fontFamily="Impact, Arial Black, sans-serif"
        fontSize="7.5"
        letterSpacing=".7"
        fill={INK}
        stroke={PAPER}
        strokeWidth="2.8"
        paintOrder="stroke"
      >
        LOS ANGELES
      </text>
      <StarsWordmark c={c} />
    </g>
  );
}

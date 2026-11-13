import { INK, PAPER, type Pal } from './markKit';
import approvedStarsArt from '../assets/los-angeles-stars-vintage.png';

export type StarsLogoConcept = 'mascot' | 'comet' | 'roundel';

export function StarsBasketball({ x, y, radius, color = '#ef8a29' }: { x: number; y: number; radius: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${radius / 12})`}>
      <circle r="12" fill={color} stroke={INK} strokeWidth="2.2" />
      <path
        d="M-12 0H12 M0-12V12 M-8.485-8.485C-2.4-4.2-2.4 4.2-8.485 8.485 M8.485-8.485C2.4-4.2 2.4 4.2 8.485 8.485"
        transform="rotate(-18)"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
      />
      <path d="M-8-6Q-5-10 0-10" fill="none" stroke={PAPER} strokeWidth="1.3" strokeLinecap="round" opacity=".55" />
    </g>
  );
}

/** The exact vintage illustration selected by the user, at every logo placement. */
export function starsLogo(_uid: string, _small: boolean, _c: Pal, _concept: StarsLogoConcept = 'mascot') {
  return (
    <g data-stars-version="approved-vintage">
      <image href={approvedStarsArt} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

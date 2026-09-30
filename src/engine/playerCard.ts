// Player cards: a player's whole build (bio, ratings, potential, intangibles, personality, shot
// tendencies) as JSON, to copy from one player and load onto another in God Mode. Loading keeps
// who he is in this league: his ID, team, contract, stats and history.
import { syncOvr } from './ratings';
import { groupsOf } from '../data/heritage';
import { refreshElig } from './eligibility';

const KEEP = ['name', 'first', 'last', 'native', 'nativeFirst', 'nativeLast', 'pos', 'age', 'dob', 'hgt', 'wt', 'wing', 'rep', 'born', 'raised', 'city', 'state', 'her', 'heritage', 'race', 'r', 'pot', 'intg', 'pers', 'tend'] as const;

export function exportCard(p: any) {
  const c: any = { card: 1 };
  KEEP.forEach(k => { if (p[k] !== undefined && p[k] !== '') c[k] = JSON.parse(JSON.stringify(p[k])); });
  c.ovr = p.ovr; // for reference: the overall comes from the ratings when loaded
  return c;
}

const GRP: Record<string, string> = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };

// Load a card onto a player. Returns an error message, or '' when it worked.
export function applyCard(p: any, card: any, C: Record<string, any>): string {
  if (!card || typeof card !== 'object' || !card.r || typeof card.r !== 'object') return 'That isn’t a player card (it needs at least his ratings, "r").';
  for (const [k, v] of Object.entries(card.r)) if (typeof v !== 'number' || !isFinite(v as number)) return 'Rating "' + k + '" isn’t a number.';
  if (card.pos && !GRP[card.pos]) return 'Unknown position "' + card.pos + '".';
  for (const k of ['rep', 'born', 'raised', 'her']) if (card[k] && !C[card[k]]) return 'Unknown country code "' + card[k] + '" in "' + k + '".';
  const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(v)));
  // A new name replaces the whole name (no leftover native-script name); a new birthplace outside the
  // U.S. drops a U.S. state; a new age without a birthday drops the old birthday.
  if (card.name) for (const k of ['native', 'nativeFirst', 'nativeLast', 'first', 'last']) if (card[k] === undefined) delete p[k];
  if (card.born && card.born !== 'US' && card.state === undefined) delete p.state;
  if (card.age != null && !card.dob) delete p.dob;
  KEEP.forEach(k => { if (card[k] !== undefined && k !== 'r' && k !== 'pers' && k !== 'intg' && k !== 'tend') p[k] = JSON.parse(JSON.stringify(card[k])); });
  p.r = { ...p.r }; Object.entries(card.r).forEach(([k, v]) => (p.r[k] = cl(v as number, 1, 100)));
  if (card.pers) p.pers = { ...p.pers, ...card.pers };
  if (card.intg) p.intg = { feel: cl(card.intg.feel ?? p.intg?.feel ?? 50, 1, 99), poise: cl(card.intg.poise ?? p.intg?.poise ?? 50, 1, 99) };
  if (card.tend) p.tend = { ...card.tend }; else delete p.tend;
  if (card.her && !card.heritage) { const gs = groupsOf(card.her); p.heritage = gs.length ? [...gs].sort((a, b) => b.w - a.w)[0].k : C[card.her]?.n; }
  if (card.rep || card.born || card.raised || card.her) { refreshElig(p, C); if (card.rep && C[card.rep]) { if (!p.elig.some((e: any) => e.c === card.rep)) p.elig = [{ c: card.rep, why: 'citizen by birth' }, ...p.elig]; p.rep = card.rep; } } // eligibility follows the card's countries
  if (card.pos) p.grp = GRP[card.pos];
  if (card.age != null) p.age = cl(card.age, 15, 45);
  p.rx = card._rx ?? {}; p.px = card._px ?? 0; if (card._gem !== undefined) p.gem = card._gem; else delete p.gem; // a fresh build: no leftover hidden growth (undo restores it)
  syncOvr(p);
  p.pot = cl(card.pot ?? p.pot, p.ovr, 100);
  return '';
}

// A blank template: an average 19-year-old wing, every rating 50. Fill it in yourself.
export const BLANK_CARD = {
  card: 1, label: 'Blank card', name: 'New Player', first: 'New', last: 'Player', pos: 'SF', age: 19, hgt: '6′6″', wt: 210, wing: 82, rep: 'US', born: 'US', raised: 'US', her: 'US', city: '',
  r: { hgt: 50, stre: 50, spd: 50, acc: 50, jmp: 50, endu: 50, ins: 50, dnk: 50, lay: 50, ft: 50, fg: 50, tp: 50, oiq: 50, diq: 50, drb: 50, pss: 50, reb: 50, box: 50 },
  pot: 60, intg: { feel: 50, poise: 50 },
  pers: { mot: 'Winning', alpha: false, touches: false, pro: false, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: false, legacy: false, work: 50 },
  tend: {},
};

// Ready-made cards (the starting library; every one is editable).
export const PRESET_CARDS: { label: string; card: any }[] = [
  { label: 'Luka Dončić – Rookie year (2018–19)', card: {
    card: 1, name: 'Luka Dončić', first: 'Luka', last: 'Dončić', pos: 'PG', age: 19, dob: '1999-02-28', hgt: '6′7″', wt: 230, wing: 82,
    rep: 'SI', born: 'SI', raised: 'SI', city: 'Ljubljana', her: 'SI', race: 'white',
    // Tuned by simming his rookie season in 8 leagues against his real 2018–19 line and shooting splits
    // (Basketball-Reference): 21.6 pts on 17 FGA, 42.9% FG, 3.4 FGA at the rim (64.7%), 6.6 from 3 ft to
    // the arc (41.6%), 7.0 threes (33.5%), 6.5 FTA (72%), 7.3 reb, 6.2 ast, 3.5 tov, PER 19.2, TS 54.4%.
    r: { hgt: 73, stre: 78, spd: 52, acc: 62, jmp: 42, endu: 58, ins: 48, dnk: 30, lay: 42, ft: 42, fg: 95, tp: 51, oiq: 70, diq: 44, drb: 85, pss: 58, reb: 61, box: 56 },
    pot: 83, intg: { feel: 90, poise: 85 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: true, flashy: true, heat: true, crowd: false, villain: true, fearless: true, clutch: true, prone: false, padder: false, team: false, legacy: true, work: 58, loyalty: 60, ambition: 80 },
    tend: { rim: 1.05, mid: 0.23, c3: 0.9, atb: 1.02, draw: 2.8, tov: 1.2, ast: 0.4 },
  } },
];

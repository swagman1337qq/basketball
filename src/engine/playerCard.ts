// Player cards: a player's whole build (bio, ratings, potential, intangibles, personality, shot
// tendencies in the NBA's categories) as JSON, to copy from one player and load onto another in God Mode. Loading keeps
// who he is in this league: his ID, team, contract, stats and history.
import { syncOvr } from './ratings';
import { setTruePot } from './potential';
import { CRE_TEN, ensureTen, initTendencies, quirkOf, round100, tenTargets, ZONE_TEN } from './tendencies';
import { groupsOf } from '../data/heritage';
import { refreshElig } from './eligibility';

const KEEP = ['name', 'first', 'last', 'native', 'nativeFirst', 'nativeLast', 'pos', 'age', 'dob', 'hgt', 'wt', 'wing', 'rep', 'born', 'raised', 'city', 'state', 'her', 'heritage', 'race', 'r', 'pot', 'intg', 'pers', 'ten', 'tenLock'] as const;

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
  KEEP.forEach(k => { if (card[k] !== undefined && k !== 'r' && k !== 'pers' && k !== 'intg' && k !== 'ten') p[k] = JSON.parse(JSON.stringify(card[k])); });
  p.r = { ...p.r }; Object.entries(card.r).forEach(([k, v]) => (p.r[k] = cl(v as number, 1, 99)));
  if (card.pers) p.pers = { ...p.pers, ...card.pers };
  if (card.intg) p.intg = { feel: cl(card.intg.feel ?? p.intg?.feel ?? 50, 1, 99), poise: cl(card.intg.poise ?? p.intg?.poise ?? 50, 1, 99) };
  delete p.tend; delete p.ten; // his playing style starts over from the new build (below; his quirks stay)
  if (card.her && !card.heritage) { const gs = groupsOf(card.her); p.heritage = gs.length ? [...gs].sort((a, b) => b.w - a.w)[0].k : C[card.her]?.n; }
  if (card.rep || card.born || card.raised || card.her) { refreshElig(p, C); if (card.rep && C[card.rep]) { if (!p.elig.some((e: any) => e.c === card.rep)) p.elig = [{ c: card.rep, why: 'citizen by birth' }, ...p.elig]; p.rep = card.rep; } } // eligibility follows the card's countries
  if (card.pos) p.grp = GRP[card.pos];
  if (card.age != null) p.age = cl(card.age, 15, 45);
  p.rx = card._rx ?? {}; p.px = card._px ?? 0; if (card._gem !== undefined) p.gem = card._gem; else delete p.gem; // a fresh build: no leftover hidden growth (undo restores it)
  syncOvr(p);
  delete p.ceil; delete p.ph; p.perr = 0; // a fresh build: his potential is the card's, exactly (potential.ts)
  setTruePot(p, cl(card.pot ?? p.pot, p.ovr, 100), true); // exactly the card's, up to 100, whatever his ratings can show
  // His shot tendencies: the card's, or from his game. A card's zones and creation are shares (each group
  // is scaled to add up to 100); usage and free throw rate are 0–100 scores. Cards from before 2026-10-08
  // (every tendency a 0–100 score, or older multipliers) play the shot mix they played then (fromLegacy).
  initTendencies(p);
  const ct = card.ten && typeof card.ten === 'object' ? card.ten : null, num = (v: any) => typeof v === 'number' && isFinite(v);
  if (ct && (num(ct.step) || num(ct.fade))) {
    (['usage', 'ftr'] as const).forEach(k => { if (num(ct[k])) p.ten[k] = Math.max(2, Math.min(98, ct[k])); });
    for (const keys of [ZONE_TEN, CRE_TEN] as readonly (readonly string[])[]) { const g = Object.fromEntries(keys.map(k => [k, num(ct[k]) ? Math.max(0, ct[k]) : p.ten[k]])); if (keys.some(k => num(ct[k]))) Object.assign(p.ten, round100(g)); }
  } else if (ct || card.tend) {
    const tg = tenTargets(p, null), v3 = ['usage', 'ra', 'paint', 'mid', 'c3', 'atb', 'cns', 'pullup', 'ftr'] as const;
    p.ten = Object.fromEntries(v3.map(k => [k, num(ct?.[k]) ? Math.max(2, Math.min(98, ct[k])) : Math.round(Math.max(2, Math.min(98, tg[k] + quirkOf(p, k))))])); p.tenV = 3;
    if (!ct && card.tend) p.tend = card.tend;
    ensureTen(p);
  }
  if (card.tenLock) p.tenLock = true; else delete p.tenLock; // a card can lock its playing style
  return '';
}

// A blank template: an average 19-year-old wing, every rating 50. Fill it in yourself.
export const BLANK_CARD = {
  card: 1, label: 'Blank card', name: 'New Player', first: 'New', last: 'Player', pos: 'SF', age: 19, hgt: '6′6″', wt: 210, wing: 82, rep: 'US', born: 'US', raised: 'US', her: 'US', city: '',
  r: { hgt: 50, stre: 50, spd: 50, acc: 50, jmp: 50, endu: 50, ins: 50, dnk: 50, lay: 50, ft: 50, fg: 50, tp: 50, oiq: 50, diq: 50, blk: 50, stl: 50, drb: 50, pss: 50, reb: 50, box: 50 },
  pot: 60, intg: { feel: 50, poise: 50 },
  pers: { mot: 'Winning', alpha: false, touches: false, pro: false, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: false, legacy: false, streaky: false, work: 50 },
};

// The ready-made cards' playing style before 2026-10-08, as the old multipliers: a saved copy that still has
// exactly these was never edited and takes the new tendencies (upgradePresetCard). The multipliers were
// tuned against the old engine and, read by today's tendency system, gave Klay Thompson 39% usage.
const OLD_PRESET_TEND = [{ rim: 1.05, mid: 0.23, c3: 0.9, atb: 1.02, draw: 2.8, tov: 1.2, ast: 0.4 }, { rim: 0.69, mid: 1.34, c3: 2.51, atb: 1.3, draw: 0.27, tov: 0.31, ast: 1.35, usg: 0.97 }, { rim: 0.9, mid: 4.92, c3: 0.02, atb: 0.46, draw: 0.74, tov: 1.31, ast: 0.62, usg: 0.63 }, { rim: 0.94, mid: 1.51, c3: 0.02, atb: 0.15, draw: 0.72, tov: 1.11, ast: 1.15, usg: 0.72 }, { rim: 1.54, mid: 1.26, c3: 0.64, atb: 1.38, draw: 2.2, tov: 1.55, ast: 0.38, usg: 0.53 }, { rim: 1.74, mid: 4.38, c3: 0.62, atb: 0.42, draw: 0.12, tov: 0.48, ast: 1.2, usg: 1.25 }, { rim: 1.17, mid: 2.35, c3: 2.13, atb: 0.8, draw: 0.34, tov: 0.61, ast: 1.05, usg: 0.66 }, { rim: 0.95, mid: 3.39, c3: 0.02, atb: 0.18, draw: 1.39, tov: 0.64, ast: 0.95, usg: 0.73 }];
// Their 0–100 scores of 2026-10-08 (version 3), before tendencies became shares.
const OLD_PRESET_TEN3 = [{ usage: 52, ra: 62, paint: 48, mid: 66, c3: 43, atb: 84, cns: 28, pullup: 72, ftr: 67 }, { usage: 51, ra: 46, paint: 45, mid: 44, c3: 69, atb: 66, cns: 64, pullup: 36, ftr: 25 }, { usage: 43, ra: 24, paint: 52, mid: 43, c3: 2, atb: 2, cns: 27, pullup: 73, ftr: 62 }, { usage: 48, ra: 48, paint: 62, mid: 71, c3: 2, atb: 2, cns: 53, pullup: 47, ftr: 67 }, { usage: 45, ra: 16, paint: 25, mid: 44, c3: 11, atb: 18, cns: 21, pullup: 79, ftr: 70 }, { usage: 53, ra: 42, paint: 58, mid: 94, c3: 43, atb: 43, cns: 61, pullup: 39, ftr: 22 }, { usage: 32, ra: 62, paint: 65, mid: 79, c3: 79, atb: 39, cns: 64, pullup: 36, ftr: 53 }, { usage: 51, ra: 56, paint: 79, mid: 48, c3: 2, atb: 2, cns: 49, pullup: 51, ftr: 90 }];
// A saved copy of a ready-made card (id 'presetN') that still has an old playing style gets the new one.
export function upgradePresetCard(row: { id: string; card: any }): boolean {
  const m = /^preset(\d+)$/.exec(row.id || ''), i = m ? +m[1] : -1, c = row.card, same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  if (i < 0 || !PRESET_CARDS[i] || !c) return false;
  if (!(c.ten ? same(c.ten, OLD_PRESET_TEN3[i]) : c.tend && same(c.tend, OLD_PRESET_TEND[i]))) return false;
  delete c.tend; c.ten = { ...PRESET_CARDS[i].card.ten }; return true;
}

// Ready-made cards (the starting library; every one is editable).
export const PRESET_CARDS: { label: string; card: any }[] = [
  { label: 'Luka Dončić – Rookie year (2018–19)', card: {
    card: 1, name: 'Luka Dončić', first: 'Luka', last: 'Dončić', pos: 'PG', age: 19, dob: '1999-02-28', hgt: '6′7″', wt: 230, wing: 82,
    rep: 'SI', born: 'SI', raised: 'SI', city: 'Ljubljana', her: 'SI', race: 'white',
    // Tuned by simming his rookie season in 8 leagues against his real 2018–19 line and shooting splits
    // (Basketball-Reference): 21.6 pts on 17 FGA, 42.9% FG, 3.4 FGA at the rim (64.7%), 6.6 from 3 ft to
    // the arc (41.6%), 7.0 threes (33.5%), 6.5 FTA (72%), 7.3 reb, 6.2 ast, 3.5 tov, PER 19.2, TS 54.4%.
    r: { hgt: 73, stre: 78, spd: 52, acc: 62, jmp: 42, endu: 58, ins: 48, dnk: 30, lay: 42, ft: 42, fg: 95, tp: 51, oiq: 70, diq: 44, blk: 30, stl: 62, drb: 85, pss: 58, reb: 61, box: 56 },
    pot: 83, intg: { feel: 90, poise: 85 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: true, flashy: true, heat: true, crowd: false, villain: true, fearless: true, clutch: true, prone: false, padder: false, team: false, legacy: true, work: 58, loyalty: 60, ambition: 80 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 30.5%: 20% of his shots at the rim, 14% in the paint, 25% mid-range, 41% threes (3% corner); pull-ups over catch-and-shoot about 5 to 1; .38 FTA per FGA.
    ten: { usage: 52, ftr: 67, ra: 20, paint: 14, mid: 25, c3: 3, atb: 38, cns: 10, pullup: 50, step: 30, fade: 10 },
  } },
  // The rookie cards below were tuned the same way, against each player's real rookie season (Basketball-
  // Reference: per game, advanced, shooting by distance, splits) translated to today's league: volume per
  // 36 minutes adjusted for pace (and the era's assist, steal, block, turnover and free-throw rates);
  // shooting by zone relative to that season's league average for his position, small samples regressed
  // toward it; the shot diet halfway between his real one and its era-relative equivalent. Tuning played
  // each card at his real minutes and role for 330 to 980 games a pass. Body, defense and personality
  // come from the combine, scouting reports and how he carried himself; potential from how his career went.
  { label: 'Dalton Knecht – Rookie year (2024–25)', card: {
    card: 1, name: 'Dalton Knecht', first: 'Dalton', last: 'Knecht', pos: 'SF', age: 23, dob: '2001-04-19', hgt: '6′6″', wt: 215, wing: 81,
    rep: 'US', born: 'US', raised: 'US', city: 'Thornton', state: 'CO', her: 'US', race: 'white',
    // Real: 78 G (16 starts), 19.2 min, 9.1 pts on 7.1 FGA, .461 FG, .376 on 4.4 threes (61% of his shots, 27% from
    // the corners at .407), 18.1-ft average shot, .789 at the rim, .762 FT, 2.8 reb, 0.8 ast, TS .594, BPM −1.8.
    // Streaky: 13.6 ppg and .460 from three in November (37 and nine threes vs Utah), then .156 from three in
    // December; a median game of 6 points. Elite combine athlete (39-inch leap, 2nd in lane agility) who
    // defended poorly (upright, lost on the ball): fearless, a gym rat, unlimited green light.
    r: { hgt: 47, stre: 46, spd: 66, acc: 80, jmp: 86, endu: 56, ins: 48, dnk: 66, lay: 81, ft: 49, fg: 59, tp: 62, oiq: 43, diq: 25, blk: 20, stl: 15, drb: 46, pss: 41, reb: 40, box: 46 },
    pot: 51, intg: { feel: 57, poise: 62 },
    pers: { mot: 'Playing time', alpha: false, touches: false, pro: false, volatile: false, flashy: false, heat: true, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: false, streaky: true, work: 74, loyalty: 50, ambition: 62 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 21%: 22% at the rim, 9% paint, 8% mid-range, 61% threes (27% of them corners); mostly catch-and-shoot; .14 FTA per FGA.
    ten: { usage: 51, ftr: 25, ra: 22, paint: 9, mid: 8, c3: 16.5, atb: 44.5, cns: 75, pullup: 18, step: 5, fade: 2 },
  } },
  { label: 'Ben Simmons – Rookie year (2017–18)', card: {
    card: 1, name: 'Ben Simmons', first: 'Ben', last: 'Simmons', pos: 'PG', age: 21, dob: '1996-07-20', hgt: '6′10″', wt: 240, wing: 84,
    rep: 'AU', born: 'AU', raised: 'AU', city: 'Melbourne', her: 'US', race: 'black',
    // Real (Rookie of the Year, after missing 2016–17 with a broken foot): 81 starts, 33.7 min, 15.8 pts, 8.1 reb,
    // 8.2 ast, 1.7 stl, 0.9 blk, 3.4 tov, .545 FG, 0 for 11 from three, .560 FT, 12 triple-doubles, PER 20.0,
    // BPM +4.5. A 5.5-ft average shot: 46% at the rim (.744, 148 dunks), 33% from 3–10 ft (.417), jumpers .310.
    // A 6-10 point guard in transition, a switchable defender; shoots left but is naturally right-handed.
    r: { hgt: 64, stre: 72, spd: 86, acc: 78, jmp: 70, endu: 72, ins: 91, dnk: 91, lay: 91, ft: 16, fg: 42, tp: 8, oiq: 62, diq: 66, blk: 70, stl: 60, drb: 74, pss: 78, reb: 59, box: 58 },
    pot: 69, intg: { feel: 70, poise: 40 },
    pers: { mot: 'Fame', alpha: true, touches: true, pro: false, volatile: false, flashy: true, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: true, padder: false, team: false, legacy: false, streaky: false, work: 45, loyalty: 30, ambition: 72 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 22.5%: 46% at the rim, 33% from 3–10 ft, 21% jumpers, no threes; .34 FTA per FGA.
    ten: { usage: 43, ftr: 62, ra: 46, paint: 33, mid: 20.5, c3: 0.2, atb: 0.3, cns: 20, pullup: 50, step: 5, fade: 25 },
  } },
  { label: 'Al Horford – Rookie year (2007–08)', card: {
    card: 1, name: 'Al Horford', first: 'Al', last: 'Horford', pos: 'C', age: 21, dob: '1986-06-03', hgt: '6′10″', wt: 245, wing: 85,
    rep: 'DO', born: 'DO', raised: 'US', city: 'Puerto Plata', her: 'DO', race: 'black',
    // Real (Rookie of the Year runner-up, unanimous All-Rookie): 81 games, 31.4 min, 10.1 pts, 9.7 reb, 1.5 ast,
    // 0.9 blk, .499 FG, .731 FT, no threes, PER 14.7, 25 double-doubles. A 7.3-ft average shot: 41% at the rim
    // (.640), the jump hook, a reliable 12–15 footer (.429). Strongest player at the combine (20 reps), one of the
    // slowest in the lane drill. Calm, coachable, a high basketball IQ; foul-prone (3.8 per 36).
    r: { hgt: 62, stre: 86, spd: 40, acc: 38, jmp: 62, endu: 66, ins: 79, dnk: 60, lay: 75, ft: 46, fg: 58, tp: 12, oiq: 60, diq: 62, blk: 65, stl: 53, drb: 36, pss: 45, reb: 82, box: 70 },
    pot: 68, intg: { feel: 64, poise: 76 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 75, ambition: 45 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 17.5%: 41% at the rim, 26% hooks and short shots, 33% from 10 ft out, no threes; .38 FTA per FGA.
    ten: { usage: 48, ftr: 67, ra: 41, paint: 26, mid: 33, c3: 0, atb: 0, cns: 45, pullup: 25, step: 2, fade: 28 },
  } },
  { label: 'Chris Paul – Rookie year (2005–06)', card: {
    card: 1, name: 'Chris Paul', first: 'Chris', last: 'Paul', pos: 'PG', age: 20, dob: '1985-05-06', hgt: '6′0″', wt: 175, wing: 76,
    rep: 'US', born: 'US', raised: 'US', city: 'Winston-Salem', state: 'NC', her: 'US', race: 'black',
    // Real (Rookie of the Year): 78 starts, 36.0 min, 16.1 pts, 7.8 ast, 5.1 reb, 2.2 stl (most steals in the
    // league), 2.3 tov, .430 FG, .282 from three, .847 FT on 6.0 attempts, PER 22.1, BPM +5.2. An 11.3-ft average
    // shot: 34% at the rim (.531), 23% long twos (.438); 79% of his baskets unassisted. Elite hands and quickness
    // (38.5-inch leap, 3.22 sprint), a fierce competitor and a road villain; the jumper came later.
    r: { hgt: 24, stre: 52, spd: 82, acc: 88, jmp: 70, endu: 88, ins: 39, dnk: 25, lay: 57, ft: 76, fg: 47, tp: 26, oiq: 84, diq: 66, blk: 10, stl: 83, drb: 88, pss: 70, reb: 53, box: 34 },
    pot: 85, intg: { feel: 79, poise: 86 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: false, flashy: false, heat: false, crowd: false, villain: true, fearless: true, clutch: true, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 92, loyalty: 45, ambition: 86 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 23.5%: 25% at the rim, 20% paint, 43% mid-range, 12% threes; mostly pull-ups; .41 FTA per FGA.
    ten: { usage: 45, ftr: 70, ra: 25, paint: 20, mid: 43, c3: 2, atb: 10, cns: 12, pullup: 70, step: 8, fade: 10 },
  } },
  { label: 'Klay Thompson – Rookie year (2011–12)', card: {
    card: 1, name: 'Klay Thompson', first: 'Klay', last: 'Thompson', pos: 'SG', age: 21, dob: '1990-02-08', hgt: '6′7″', wt: 205, wing: 81,
    rep: 'US', born: 'US', raised: 'US', city: 'Los Angeles', state: 'CA', her: 'BS', race: 'black',
    // Real (All-Rookie First Team): 66 games, 24.4 min (18.1 pts as a starter after the Monta Ellis trade), 12.5 pts on
    // 10.9 FGA, .443 FG, .414 on 4.1 threes (.474 from the corners), .868 FT on 1.4 attempts, USG 24.7, PER 14.9.
    // A 17.2-ft average shot, 32% of it long twos (.414); 93% of his threes assisted. "Ice-cold killer": calm,
    // fearless, a heat checker; son of former No. 1 pick Mychal Thompson.
    r: { hgt: 48, stre: 46, spd: 62, acc: 58, jmp: 46, endu: 76, ins: 49, dnk: 56, lay: 72, ft: 88, fg: 51, tp: 93, oiq: 52, diq: 42, blk: 57, stl: 47, drb: 46, pss: 58, reb: 42, box: 30 },
    pot: 71, intg: { feel: 58, poise: 82 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: true, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 76, loyalty: 80, ambition: 60 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 24.7%: 14% at the rim, 11% paint, 37% mid-range (32% long twos), 38% threes (a quarter from the corners); mostly catch-and-shoot; .13 FTA per FGA.
    ten: { usage: 53, ftr: 22, ra: 14, paint: 11, mid: 37, c3: 9, atb: 29, cns: 70, pullup: 24, step: 3, fade: 3 },
  } },
  { label: 'Kawhi Leonard – Rookie year (2011–12)', card: {
    card: 1, name: 'Kawhi Leonard', first: 'Kawhi', last: 'Leonard', pos: 'SF', age: 20, dob: '1991-06-29', hgt: '6′7″', wt: 227, wing: 87,
    rep: 'US', born: 'US', raised: 'US', city: 'Riverside', state: 'CA', her: 'US', race: 'black',
    // Real (All-Rookie First Team): 64 games (39 starts), 24.0 min, 7.9 pts, 5.1 reb, 1.3 stl, .493 FG, .376 from
    // three (45% of them from the corners, .469), .773 FT, PER 16.6, WS/48 .171, BPM +3.4, DRtg 101. A low-usage
    // finisher and corner shooter who guarded the other team's best wing: 7-3 wingspan, the biggest hands at the
    // combine. Quiet, humble, legendary work ethic.
    r: { hgt: 50, stre: 70, spd: 70, acc: 62, jmp: 56, endu: 72, ins: 62, dnk: 87, lay: 87, ft: 55, fg: 53, tp: 60, oiq: 54, diq: 70, blk: 38, stl: 73, drb: 44, pss: 43, reb: 61, box: 58 },
    pot: 86, intg: { feel: 71, poise: 86 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: true, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 99, loyalty: 40, ambition: 72 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 15.5%: 38% at the rim, 14% paint, 21% mid-range, 27% threes (most from the corners); mostly catch-and-shoot; .27 FTA per FGA.
    ten: { usage: 32, ftr: 53, ra: 38, paint: 14, mid: 21, c3: 17, atb: 10, cns: 75, pullup: 18, step: 2, fade: 5 },
  } },
  { label: 'Dwight Howard – Rookie year (2004–05)', card: {
    card: 1, name: 'Dwight Howard', first: 'Dwight', last: 'Howard', pos: 'C', age: 18, dob: '1985-12-08', hgt: '6′10″', wt: 240, wing: 88,
    rep: 'US', born: 'US', raised: 'US', city: 'Atlanta', state: 'GA', her: 'US', race: 'black',
    // Real (No. 1 pick straight from high school, every game a start at 18): 32.6 min, 12.0 pts, 10.0 reb (3.5
    // offensive), 1.7 blk, .520 FG, .671 FT on 5.0 attempts, PER 17.2, 32 double-doubles. A 3.7-ft average shot:
    // 59% at the rim (.623, 162 dunks), 30% from 3–10 ft (.407); nothing outside 16 ft. 7-4½ wingspan; playful,
    // a showman, better at home; 9.4 ppg in November, 16.7 in April.
    r: { hgt: 70, stre: 80, spd: 64, acc: 58, jmp: 86, endu: 72, ins: 95, dnk: 95, lay: 70, ft: 35, fg: 35, tp: 1, oiq: 38, diq: 55, blk: 67, stl: 54, drb: 26, pss: 45, reb: 67, box: 76 },
    pot: 82, intg: { feel: 47, poise: 45 },
    pers: { mot: 'Fame', alpha: false, touches: false, pro: false, volatile: false, flashy: true, heat: false, crowd: true, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: false, legacy: false, streaky: false, work: 62, loyalty: 50, ambition: 70 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 17.5%: 65% at the rim, 27% in the paint, 8% from 10 ft out, no threes; .66 FTA per FGA.
    ten: { usage: 51, ftr: 90, ra: 65, paint: 27, mid: 8, c3: 0, atb: 0, cns: 20, pullup: 20, step: 0, fade: 60 },
  } },
];

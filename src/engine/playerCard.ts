// Player cards: a player's whole build (bio, ratings, potential, intangibles, personality, shot
// tendencies in the NBA's categories) as JSON, to copy from one player and load onto another in God Mode. Loading keeps
// who he is in this league: his ID, team, contract, stats and history.
import { syncOvr } from './ratings';
import { setTruePot } from './potential';
import { CRE_TEN, ensureTen, initTendencies, quirkOf, round100, tenTargets, ZONE_TEN } from './tendencies';
import { groupsOf } from '../data/heritage';
import { refreshElig } from './eligibility';

const KEEP = ['name', 'first', 'last', 'familyFirst', 'native', 'nativeFirst', 'nativeLast', 'pos', 'age', 'dob', 'hgt', 'wt', 'wing', 'rep', 'born', 'raised', 'city', 'state', 'her', 'heritage', 'race', 'r', 'pot', 'intg', 'pers', 'ten', 'tenLock'] as const;

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
  const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(v)));
  // A card is a build, not a person: his ratings, playing style, body (height, weight, wingspan), position,
  // potential, personality and intangibles. Who he is stays his own: name, age and birthday, hometown, the
  // country he represents, where he was born and raised, heritage and look (the card may still carry the real
  // player's bio, shown in the card library, but it is never copied onto him).
  (['pos', 'hgt', 'wt', 'wing'] as const).forEach(k => { if (card[k] !== undefined && card[k] !== '') p[k] = JSON.parse(JSON.stringify(card[k])); });
  p.r = { ...p.r }; Object.entries(card.r).forEach(([k, v]) => (p.r[k] = cl(v as number, 1, 99)));
  if (card.pers) p.pers = { ...p.pers, ...card.pers };
  if (card.intg) p.intg = { feel: cl(card.intg.feel ?? p.intg?.feel ?? 50, 1, 99), poise: cl(card.intg.poise ?? p.intg?.poise ?? 50, 1, 99) };
  delete p.tend; delete p.ten; // his playing style starts over from the new build (below; his quirks stay)
  if (card.pos) p.grp = GRP[card.pos];
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
  // He starts with the card's playing style (or his ratings' if it has none); like every player's, the AI then
  // refreshes it every month unless you take it over with Edit tendencies in Edit player.
  delete p.tenLock;
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
// Ready-made cards retuned since (2026-10-11: Kawhi Leonard's rookie card was too strong for a 7.9-point
// rookie, 61 overall with 86 potential): a library copy still holding exactly the old ratings takes the new
// ratings, potential, intangibles and work ethic.
const RETUNED: Record<string, any> = {
  'Jeremy Lin': { hgt: 36, stre: 52, spd: 82, acc: 84, jmp: 66, endu: 70, ins: 34, dnk: 40, lay: 42, ft: 54, fg: 28, tp: 30, oiq: 34, diq: 50, blk: 44, stl: 96, drb: 50, pss: 58, reb: 36, box: 28 },
  'Kawhi Leonard': { hgt: 50, stre: 70, spd: 70, acc: 62, jmp: 56, endu: 72, ins: 62, dnk: 87, lay: 87, ft: 55, fg: 53, tp: 60, oiq: 54, diq: 70, blk: 38, stl: 73, drb: 44, pss: 43, reb: 61, box: 58 },
};
export function upgradePresetCard(row: { id: string; card: any }): boolean {
  const m = /^preset(\d+)$/.exec(row.id || ''), i = m ? +m[1] : -1, c = row.card, same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  if (i < 0 || !PRESET_CARDS[i] || !c) return false;
  let changed = false;
  const P0 = PRESET_CARDS[i].card, old = RETUNED[P0.name];
  if (old && c.name === P0.name && c.r && same(c.r, old)) { c.r = { ...P0.r }; c.pot = P0.pot; c.intg = { ...P0.intg }; c.pers = { ...(c.pers || {}), work: P0.pers.work }; if (P0.ten) { c.ten = { ...P0.ten }; delete c.tend; } changed = true; }
  if (!(c.ten ? same(c.ten, OLD_PRESET_TEN3[i]) : c.tend && same(c.tend, OLD_PRESET_TEND[i]))) return changed;
  delete c.tend; c.ten = { ...P0.ten }; return true;
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
    // combine. Quiet, humble, legendary work ethic. Retuned 2026-10-11 to a role player's ratings (he started at 61
    // overall, a rookie star's): 57 overall, 80 potential, the work ethic high but not maxed.
    r: { hgt: 50, stre: 64, spd: 64, acc: 58, jmp: 54, endu: 70, ins: 54, dnk: 72, lay: 70, ft: 55, fg: 50, tp: 58, oiq: 48, diq: 64, blk: 34, stl: 64, drb: 40, pss: 40, reb: 66, box: 62 },
    pot: 80, intg: { feel: 64, poise: 80 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: true, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 88, loyalty: 40, ambition: 72 },
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
  { label: 'John Wall – Rookie year (2010–11)', card: {
    card: 1, name: 'John Wall', first: 'John', last: 'Wall', pos: 'PG', age: 20, dob: '1990-09-06', hgt: '6′4″', wt: 195, wing: 81,
    rep: 'US', born: 'US', raised: 'US', city: 'Raleigh', state: 'NC', her: 'US', race: 'black',
    // Real (No. 1 pick, All-Rookie First Team, Rookie of the Year runner-up): 69 starts, 37.8 min, 16.4 pts on 14.6
    // FGA, 8.3 ast, 4.6 reb, 1.8 stl, 3.8 tov, .409 FG, .296 on 1.7 threes, .766 FT on 5.1 attempts, TS .487, PER
    // 15.8. The fastest end-to-end guard in the league: lived at the rim and in transition, pull-up jumpers he
    // hadn't found yet, loose with the ball. Played at 38 minutes, the card gives about 17 pts, 8.3 ast, 4.5 reb,
    // 2 stl, .417 FG and .28 from three. Became a five-time All-Star.
    r: { hgt: 40, stre: 50, spd: 97, acc: 95, jmp: 80, endu: 84, ins: 48, dnk: 72, lay: 68, ft: 54, fg: 36, tp: 39, oiq: 40, diq: 44, blk: 45, stl: 66, drb: 74, pss: 72, reb: 30, box: 24 },
    pot: 78, intg: { feel: 74, poise: 50 },
    pers: { mot: 'Fame', alpha: true, touches: true, pro: false, volatile: true, flashy: true, heat: false, crowd: true, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 55, loyalty: 70, ambition: 75 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): 32% at the rim, 16% paint, 40% mid-range, 12% threes; mostly pull-ups; .35 FTA per FGA.
    ten: { usage: 40, ftr: 61, ra: 32, paint: 16, mid: 40, c3: 2, atb: 10, cns: 12, pullup: 75, step: 5, fade: 8 },
  } },
  { label: 'Yi Jianlian – Rookie year (2007–08)', card: {
    card: 1, name: 'Yi Jianlian', first: 'Jianlian', last: 'Yi', familyFirst: true, native: '易建联', nativeFirst: '建联', nativeLast: '易', pos: 'PF', age: 20, dob: '1987-10-27', hgt: '7′0″', wt: 245, wing: 86,
    rep: 'CN', born: 'CN', raised: 'CN', city: 'Heshan', her: 'CN', race: 'asian',
    // Real (No. 6 pick, from the Guangdong Southern Tigers): 66 games (49 starts), 25.0 min, 8.6 pts, 5.2 reb
    // (1.6 offensive), 0.8 ast, 0.5 stl, 0.8 blk, 1.4 tov, .421 FG on 7.9 shots, .286 on 0.3 threes, .841 FT on
    // 2.2 attempts, TS .485. A 7-footer who played like a wing: a soft face-up jumper from 15–20 feet, quick off
    // the floor for dunks and putbacks, but light and pushed around inside, a thin passer, a step slow on rotations.
    // Tested over 300 games at about 26 minutes: 8.9 pts, 5.6 reb, 0.9 ast, 0.5 stl, 0.8 blk, 1.4 tov, .418 FG on 8.1
    // shots, .840 FT on 2.4, TS .485 (at his real 25 minutes, about 8.3 pts and 5.2 reb). 44 overall, 62 potential.
    r: { hgt: 68, stre: 42, spd: 70, acc: 58, jmp: 78, endu: 78, ins: 36, dnk: 60, lay: 42, ft: 70, fg: 46, tp: 30, oiq: 28, diq: 40, blk: 72, stl: 36, drb: 18, pss: 36, reb: 42, box: 32 },
    pot: 62, intg: { feel: 40, poise: 48 },
    pers: { mot: 'Fame', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: true, work: 70, loyalty: 70, ambition: 60 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): about half his shots long twos, a quarter at the rim; almost no threes; .28 FTA per FGA.
    ten: { usage: 60, ftr: 58, ra: 26, paint: 18, mid: 52, c3: 1, atb: 3, cns: 55, pullup: 20, step: 3, fade: 22 },
  } },
  { label: 'Andrei Kirilenko – Rookie year (2001–02)', card: {
    card: 1, name: 'Andrei Kirilenko', first: 'Andrei', last: 'Kirilenko', native: 'Андрей Кириленко', nativeFirst: 'Андрей', nativeLast: 'Кириленко', pos: 'SF', age: 20, dob: '1981-02-18', hgt: '6′9″', wt: 215, wing: 85,
    rep: 'RU', born: 'RU', raised: 'RU', city: 'Izhevsk', her: 'RU', race: 'white',
    // Real (No. 24 pick in 1999, from CSKA Moscow; All-Rookie First Team): all 82 games (40 starts), 26.2 min,
    // 10.7 pts, 4.9 reb (1.8 offensive), 1.1 ast, 1.4 stl, 1.9 blk, 1.3 tov, .450 FG on 7.7 shots, .250 on 1.2
    // threes, .768 FT on 4.5 attempts (a huge .58 per shot), TS .553. "AK-47": long, springy and everywhere on
    // defense, blocking shots from the weak side and jumping passing lanes; on offense he cut, ran the floor and got
    // fouled; the jumper came later. Became an All-Star (2004) and led the league in blocks (2005).
    // Tested over 300 games at about 28 minutes: 11.0 pts, 5.4 reb, 1.2 ast, 1.4 stl, 2.0 blk, 1.1 tov, .485 FG on
    // 7.5 shots, .282 on 1.1 threes, .780 FT on 4.4, TS .585 (at his real 26 minutes, about 10.2 pts and 5.0 reb).
    // 51 overall (his value was defense, which the box score undersells), 79 potential.
    r: { hgt: 60, stre: 54, spd: 84, acc: 80, jmp: 88, endu: 86, ins: 36, dnk: 40, lay: 40, ft: 52, fg: 34, tp: 22, oiq: 34, diq: 86, blk: 97, stl: 48, drb: 22, pss: 34, reb: 36, box: 38 },
    pot: 79, intg: { feel: 70, poise: 62 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 75, ambition: 55 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): about half his shots at the rim (cuts, transition, putbacks), 15% threes; .58 FTA per FGA.
    ten: { usage: 50, ftr: 90, ra: 42, paint: 14, mid: 29, c3: 9, atb: 6, cns: 70, pullup: 20, step: 2, fade: 8 },
  } },
  { label: 'Jeremy Lin – Rookie year (2010–11)', card: {
    card: 1, name: 'Jeremy Lin', first: 'Jeremy', last: 'Lin', native: '林書豪', nativeFirst: '書豪', nativeLast: '林', pos: 'PG', age: 22, dob: '1988-08-23', hgt: '6′3″', wt: 200, wing: 79,
    rep: 'US', born: 'US', raised: 'US', city: 'Torrance', state: 'CA', her: 'TW', race: 'asian',
    // Real (undrafted out of Harvard, signed by his hometown Warriors, three trips to the D-League): 29 games (no
    // starts), 9.8 min, 2.6 pts, 1.2 reb, 1.4 ast, 1.1 stl, 0.3 blk, 0.6 tov, .389 FG on 2.5 shots, .200 on 0.2 threes,
    // .760 FT on 0.9. Quick, smart and fearless, a jump shot still to build. Retuned 2026-10-14 so the AI's own tendencies (which
    // replace a card's every month) give him real threes and a rookie's efficiency: with them, at about 11 minutes,
    // 2.1 pts, 1.3 ast, .399 FG on 2.1 shots, .271 on 0.7 threes (a third of his shots); as a 27-minute starter,
    // 6.0 pts, 3.5 ast, .409 FG on 5.7, .278 on 2.0 threes (900 games each). 50 overall.
    // Potential: his prime, Linsanity (2011–12 Knicks: 35 games, 26.9 min, 14.6 pts, 6.2 ast, 3.1 reb, 1.6 stl, 3.6 tov,
    // .446 FG on 10.9, .320 on 2.1 threes, .798 FT on 5.2). The same player at that level, tested over 300 games and
    // scaled to 26.9 minutes, plays 15.3 pts, 6.4 ast, 3.2 reb, 1.4 stl, 2.9 tov, .457 FG on 11.0, .304 on 2.2 threes,
    // .823 FT on 5.5, and rates 56 overall (about the 40th-best guard in a league): that's his potential.
    r: { hgt: 36, stre: 52, spd: 82, acc: 84, jmp: 66, endu: 70, ins: 22, dnk: 22, lay: 26, ft: 54, fg: 46, tp: 41, oiq: 34, diq: 50, blk: 44, stl: 96, drb: 50, pss: 58, reb: 36, box: 28 },
    pot: 56, intg: { feel: 70, poise: 74 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: true, heat: false, crowd: true, villain: false, fearless: true, clutch: true, prone: false, padder: false, team: true, legacy: false, streaky: true, work: 90, loyalty: 60, ambition: 70 },
    // Playing style: what the AI sets for these ratings (it refreshes it every month), a slasher who pulls up from mid-range and takes about a third of his shots from three.
    ten: { usage: 33, ftr: 47, ra: 39, paint: 5, mid: 21, c3: 4, atb: 31, cns: 28, pullup: 33, step: 31, fade: 8 },
  } },
  { label: 'Toney Douglas – Rookie year (2009–10)', card: {
    card: 1, name: 'Toney Douglas', first: 'Toney', last: 'Douglas', pos: 'PG', age: 23, dob: '1986-03-16', hgt: '6′2″', wt: 190, wing: 78,
    rep: 'US', born: 'US', raised: 'US', city: 'Jonesboro', state: 'GA', her: 'US', race: 'black',
    // Real (No. 29 pick out of Florida State, ACC Defensive Player of the Year): 56 games (12 starts), 19.4 min, 8.6 pts,
    // 1.9 reb, 2.0 ast, 0.8 stl, 0.1 blk, 1.0 tov, .458 FG on 7.0 shots, .389 on 3.1 threes, .809 FT on 1.2. A
    // shoot-first combo guard and pesky on-ball defender. Tested over 300 games at about 20 minutes: 8.5 pts, 2.1 reb,
    // 1.8 ast, 1.1 stl, 0.1 blk, 1.2 tov, .431 FG on 7.2, .376 on 3.6 threes, .827 FT on 1.1.
    r: { hgt: 34, stre: 52, spd: 78, acc: 76, jmp: 62, endu: 74, ins: 40, dnk: 46, lay: 64, ft: 60, fg: 68, tp: 68, oiq: 46, diq: 62, blk: 22, stl: 62, drb: 56, pss: 58, reb: 30, box: 26 },
    pot: 58, intg: { feel: 50, poise: 60 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 62, ftr: 30, ra: 20, paint: 8, mid: 22, c3: 16, atb: 36, cns: 55, pullup: 38, step: 4, fade: 3 },
  } },
  { label: 'Jan Veselý – Rookie year (2011–12)', card: {
    card: 1, name: 'Jan Veselý', first: 'Jan', last: 'Veselý', pos: 'PF', age: 21, dob: '1990-04-24', hgt: '7′0″', wt: 240, wing: 85,
    rep: 'CZ', born: 'CZ', raised: 'CZ', city: 'Ostrava', her: 'CZ', race: 'white',
    // Real (No. 6 pick, from Partizan Belgrade): 57 games (20 starts), 18.9 min, 4.7 pts, 4.4 reb, 0.8 ast, 0.7 stl,
    // 0.6 blk, 1.1 tov, .537 FG on 3.8 shots (lobs, dunks, putbacks), 0 for 1 from three, .532 FT on 1.1. An explosive
    // leaper with no jumper and a broken free throw. Tested over 300 games at about 20 minutes: 4.2 pts, 4.7 reb,
    // 0.7 ast, 0.6 stl, 0.5 blk, 0.7 tov, .564 FG on 3.4, .502 FT on 0.8 (a little fewer turnovers than his real 1.1).
    r: { hgt: 66, stre: 50, spd: 74, acc: 66, jmp: 84, endu: 70, ins: 42, dnk: 50, lay: 44, ft: 12, fg: 28, tp: 12, oiq: 22, diq: 50, blk: 72, stl: 70, drb: 12, pss: 36, reb: 52, box: 46 },
    pot: 52, intg: { feel: 40, poise: 40 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: true, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 70, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 44, ftr: 50, ra: 70, paint: 16, mid: 13, c3: 0, atb: 1, cns: 60, pullup: 25, step: 0, fade: 15 },
  } },
  { label: 'Bismack Biyombo – Rookie year (2011–12)', card: {
    card: 1, name: 'Bismack Biyombo', first: 'Bismack', last: 'Biyombo', pos: 'C', age: 19, dob: '1992-08-28', hgt: '6′9″', wt: 255, wing: 90,
    rep: 'CD', born: 'CD', raised: 'CD', city: 'Lubumbashi', her: 'CD', race: 'dark',
    // Real (No. 7 pick, from Fuenlabrada in Spain): 63 games (41 starts), 23.1 min, 5.2 pts, 5.8 reb, 0.4 ast, 0.3 stl,
    // 1.8 blk, 1.1 tov, .464 FG on 4.4 shots, .483 FT on 2.3. A 7-6 wingspan, all defense and energy, almost no
    // offense beyond dunks. Tested over 300 games at about 24 minutes: 4.9 pts, 6.0 reb, 0.6 ast, 0.3 stl, 1.6 blk,
    // 0.4 tov, .501 FG on 4.0, .505 FT on 1.7 (fewer turnovers than his real 1.1, as for every low-usage big).
    r: { hgt: 60, stre: 72, spd: 62, acc: 56, jmp: 95, endu: 70, ins: 24, dnk: 30, lay: 16, ft: 8, fg: 16, tp: 1, oiq: 20, diq: 70, blk: 98, stl: 12, drb: 10, pss: 14, reb: 42, box: 50 },
    pot: 60, intg: { feel: 35, poise: 45 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 85, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 48, ftr: 80, ra: 58, paint: 26, mid: 16, c3: 0, atb: 0, cns: 50, pullup: 20, step: 0, fade: 30 },
  } },
  { label: 'Bronny James – Rookie year (2024–25)', card: {
    card: 1, name: 'Bronny James', first: 'Bronny', last: 'James', pos: 'SG', age: 20, dob: '2004-10-06', hgt: '6′2″', wt: 210, wing: 79,
    rep: 'US', born: 'US', raised: 'US', city: 'Cleveland', state: 'OH', her: 'US', race: 'black',
    // Real (No. 55 pick out of USC; most of the year with the G League's South Bay Lakers): 27 games (1 start), 6.7 min,
    // 2.3 pts, 0.7 reb, 0.8 ast, 0.3 stl, 0.5 tov, .313 FG on 2.5 shots, .281 on 1.2 threes, .786 FT. Strong, a willing
    // defender, the offense still raw. Tested over 500 games at about 7 minutes: 2.2 pts, 0.7 reb, 0.8 ast, 0.2 stl,
    // 0.5 tov, .329 FG on 2.4, .282 on 1.5 threes, .750 FT.
    r: { hgt: 34, stre: 60, spd: 66, acc: 64, jmp: 70, endu: 70, ins: 34, dnk: 30, lay: 14, ft: 56, fg: 10, tp: 36, oiq: 38, diq: 52, blk: 30, stl: 50, drb: 36, pss: 64, reb: 30, box: 30 },
    pot: 52, intg: { feel: 55, poise: 55 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: true, streaky: false, work: 80, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 90, ftr: 34, ra: 20, paint: 8, mid: 8, c3: 18, atb: 48, cns: 50, pullup: 40, step: 6, fade: 4 },
  } },
  { label: 'Jarrett Culver – Rookie year (2019–20)', card: {
    card: 1, name: 'Jarrett Culver', first: 'Jarrett', last: 'Culver', pos: 'GF', age: 20, dob: '1999-02-20', hgt: '6′6″', wt: 195, wing: 82,
    rep: 'US', born: 'US', raised: 'US', city: 'Lubbock', state: 'TX', her: 'US', race: 'black',
    // Real (No. 6 pick out of Texas Tech, the 2019 Big 12 Player of the Year): 63 games (35 starts), 23.9 min, 9.2 pts,
    // 3.4 reb, 1.7 ast, 0.9 stl, 0.6 blk, 1.3 tov, .404 FG on 9.0 shots, .299 on 3.5 threes, .462 FT on 1.9. A long,
    // willing wing defender whose shot never came: one of the worst free-throw shooters in the league. Tested over 800
    // games at about 23.5 minutes: 9.3 pts, 3.2 reb, 1.7 ast, 0.9 stl, 0.6 blk, 1.4 tov, .417 FG on 8.8, .309 on 3.6
    // threes, .458 FT on 1.8.
    r: { hgt: 46, stre: 46, spd: 70, acc: 70, jmp: 68, endu: 72, ins: 42, dnk: 48, lay: 30, ft: 8, fg: 30, tp: 36, oiq: 62, diq: 60, blk: 68, stl: 48, drb: 48, pss: 47, reb: 33, box: 30 },
    pot: 54, intg: { feel: 50, poise: 45 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 85, loyalty: 65, ambition: 60 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 82, ftr: 44, ra: 29, paint: 12, mid: 18, c3: 12, atb: 29, cns: 55, pullup: 35, step: 6, fade: 4 },
  } },
];

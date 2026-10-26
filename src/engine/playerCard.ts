// Player cards: a player's whole build (bio, ratings, potential, intangibles, personality, shot
// tendencies in the NBA's categories) as JSON, to copy from one player and load onto another in God Mode. Loading keeps
// who he is in this league: his ID, team, contract, stats and history.
import { syncOvr } from './ratings';
import { setTruePot } from './potential';
import { CRE_TEN, ensureTen, initTendencies, quirkOf, round100, tenTargets, ZONE_TEN } from './tendencies';
import { groupsOf } from '../data/heritage';
import { refreshElig } from './eligibility';
import { OLD_CARD_BUILDS, OLD_CARD_TENS } from '../data/cardBuilds';

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
  if (card.pos) { p.grp = GRP[card.pos]; p.posLock = true; } // a card's position stays (Game.autoPos)
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
  p.cardName = card.name || undefined; // which card he carries, so a retuned ready-made card can find him (retuneCarriers)
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
// A saved copy of a ready-made card (id 'presetN') that still has an old playing style gets the new one, and
// one that still holds an earlier build exactly (data/cardBuilds.ts: 2026-10-11 Kawhi Leonard toned down,
// 2026-10-14 Jeremy Lin's shot mix, 2026-10-18 every card retuned for today's engine) takes today's ratings,
// potential, intangibles, work ethic and playing style.
export function upgradePresetCard(row: { id: string; card: any }): boolean {
  const m = /^preset(\d+)$/.exec(row.id || ''), i = m ? +m[1] : -1, c = row.card, same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  if (i < 0 || !PRESET_CARDS[i] || !c) return false;
  let changed = false;
  const P0 = PRESET_CARDS[i].card, olds = OLD_CARD_BUILDS[P0.name] || [];
  if (c.name === P0.name && c.r && !same(c.r, P0.r) && olds.some(o => same(c.r, o.r))) { c.r = { ...P0.r }; c.pot = P0.pot; c.intg = { ...P0.intg }; c.pers = { ...(c.pers || {}), work: P0.pers.work }; if (P0.ten) { c.ten = { ...P0.ten }; delete c.tend; } return true; }
  if (c.ten && (OLD_CARD_TENS[P0.name] || []).some(t => same(c.ten, t)) && P0.ten && !same(c.ten, P0.ten)) { c.ten = { ...P0.ten }; delete c.tend; return true; }
  if (!(c.ten ? same(c.ten, OLD_PRESET_TEN3[i]) : c.tend && same(c.tend, OLD_PRESET_TEND[i]))) return changed;
  delete c.tend; c.ten = { ...P0.ten }; return true;
}

// A player who was given an earlier build of a ready-made card (his body is the card's and his ratings still
// match it up to his growth since, or the card is on record as his) takes today's build plus that growth. A
// potential still exactly the old card's (given after potentials were compressed, 2026-10-17) moves to the
// new one; one compressed since already sits there. Returns how many players changed.
export function retuneCarriers(P: Record<number, any>): number {
  let n = 0;
  Object.values(P).forEach((p: any) => {
    if (!p?.r || p.retired || p.gone) return;
    for (const { card: c } of PRESET_CARDS) {
      const tagged = p.cardName === c.name;
      if (!tagged && (p.cardName || p.hgt !== c.hgt || p.wing !== c.wing || p.wt !== c.wt)) continue;
      const fit = (OLD_CARD_BUILDS[c.name] || []).map(o => { const ks = Object.keys(c.r).filter(k => o.r[k] != null && p.r[k] != null), d = ks.map(k => p.r[k] - o.r[k]), sh = d.reduce((a, x) => a + x, 0) / Math.max(1, d.length);
        return { o, ks, sh, sp: d.reduce((a, x) => a + Math.abs(x - sh), 0) / Math.max(1, d.length) }; }).filter(f => f.ks.length >= 18 && f.sp <= (tagged ? 12 : 6) && Math.abs(f.sh) <= 15).sort((a, b) => a.sp - b.sp)[0];
      if (!fit || JSON.stringify(fit.o.r) === JSON.stringify(c.r)) continue;
      Object.keys(c.r).forEach(k => (p.r[k] = Math.max(1, Math.min(99, Math.round(c.r[k] + (fit.o.r[k] != null && p.r[k] != null ? p.r[k] - fit.o.r[k] : 0))))));
      const pot0 = p.tpot; syncOvr(p);
      if (pot0 === fit.o.pot && c.pot !== fit.o.pot) setTruePot(p, Math.max(c.pot, p.ovr), true);
      else if (p.tpot != null && p.tpot < p.ovr) p.tpot = p.ovr;
      p.cardName = c.name; n++; break;
    }
  });
  return n;
}

// Ready-made cards (the starting library; every one is editable).
export const PRESET_CARDS: { label: string; card: any }[] = [
  { label: 'Luka Dončić – Rookie year (2018–19)', card: {
    card: 1, name: 'Luka Dončić', first: 'Luka', last: 'Dončić', pos: 'PG', age: 19, dob: '1999-02-28', hgt: '6′7″', wt: 230, wing: 82,
    rep: 'SI', born: 'SI', raised: 'SI', city: 'Ljubljana', her: 'SI', race: 'white',
    // Tuned by simming his rookie season in 8 leagues against his real 2018–19 line and shooting splits
    // (Basketball-Reference): 21.6 pts on 17 FGA, 42.9% FG, 3.4 FGA at the rim (64.7%), 6.6 from 3 ft to
    // the arc (41.6%), 7.0 threes (33.5%), 6.5 FTA (72%), 7.3 reb, 6.2 ast, 3.5 tov, PER 19.2, TS 54.4%.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role, with his real shot zones as targets too (a 95 mid-range rating had the AI send him mostly
    // mid-range jumpers): 21.3 pts, 7.0 reb, 5.3 ast, 4.6 tov, .420 FG on 19.0, .713 at the rim on 4.4,
    // .289 on 7.2 threes, .712 FT on 4.5 in 30.9 min. 61 overall; potential 77 (83 before potentials above 70 were compressed).
    r: { hgt: 73, stre: 78, spd: 52, acc: 71, jmp: 42, endu: 58, ins: 59, dnk: 45, lay: 69, ft: 40, fg: 73, tp: 55, oiq: 52, diq: 44, blk: 27, stl: 47, drb: 92, pss: 58, reb: 70, box: 65 },
    pot: 77, intg: { feel: 90, poise: 85 },
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
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 9.3 pts, 2.6 reb, 0.6 ast, 0.3 stl, 0.1 blk, 1.2 tov, .474 FG on 6.8, .371 on 3.8 threes, .710 FT on 2.0 in 17.9 min.
    // 48 overall; potential 51.
    r: { hgt: 47, stre: 46, spd: 66, acc: 82, jmp: 86, endu: 56, ins: 44, dnk: 62, lay: 77, ft: 43, fg: 62, tp: 81, oiq: 51, diq: 25, blk: 24, stl: 13, drb: 34, pss: 41, reb: 54, box: 60 },
    pot: 51, intg: { feel: 57, poise: 62 },
    pers: { mot: 'Playing time', alpha: false, touches: false, pro: false, volatile: false, flashy: false, heat: true, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: false, streaky: true, work: 74, loyalty: 50, ambition: 62 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 21%: 22% at the rim, 9% paint, 8% mid-range, 61% threes (27% of them corners); mostly catch-and-shoot; .14 FTA per FGA.
    ten: { usage: 60.5, ftr: 53.6, ra: 27.3, paint: 8.1, mid: 8.1, c3: 14.7, atb: 41.8, cns: 72.8, pullup: 16.7, step: 8, fade: 2.5 },
  } },
  { label: 'Ben Simmons – Rookie year (2017–18)', card: {
    card: 1, name: 'Ben Simmons', first: 'Ben', last: 'Simmons', pos: 'PG', age: 21, dob: '1996-07-20', hgt: '6′10″', wt: 240, wing: 84,
    rep: 'AU', born: 'AU', raised: 'AU', city: 'Melbourne', her: 'US', race: 'black',
    // Real (Rookie of the Year, after missing 2016–17 with a broken foot): 81 starts, 33.7 min, 15.8 pts, 8.1 reb,
    // 8.2 ast, 1.7 stl, 0.9 blk, 3.4 tov, .545 FG, 0 for 11 from three, .560 FT, 12 triple-doubles, PER 20.0,
    // BPM +4.5. A 5.5-ft average shot: 46% at the rim (.744, 148 dunks), 33% from 3–10 ft (.417), jumpers .310.
    // A 6-10 point guard in transition, a switchable defender; shoots left but is naturally right-handed.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 16.1 pts, 7.3 reb, 8.4 ast, 1.6 stl, 1.0 blk, 3.0 tov, .564 FG on 12.3, .105 on 0.2 threes, .545 FT on 4.1 in 32.1 min.
    // 63 overall; potential 69.
    r: { hgt: 64, stre: 72, spd: 86, acc: 68, jmp: 70, endu: 72, ins: 81, dnk: 81, lay: 81, ft: 20, fg: 42, tp: 6, oiq: 42, diq: 66, blk: 74, stl: 59, drb: 63, pss: 82, reb: 79, box: 78 },
    pot: 69, intg: { feel: 70, poise: 40 },
    pers: { mot: 'Fame', alpha: true, touches: true, pro: false, volatile: false, flashy: true, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: true, padder: false, team: false, legacy: false, streaky: false, work: 45, loyalty: 30, ambition: 72 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 22.5%: 46% at the rim, 33% from 3–10 ft, 21% jumpers, no threes; .34 FTA per FGA.
    ten: { usage: 53.9, ftr: 61.3, ra: 81, paint: 12, mid: 6, c3: 0.2, atb: 0.8, cns: 12.6, pullup: 44, step: 28.5, fade: 14.9 },
  } },
  { label: 'Al Horford – Rookie year (2007–08)', card: {
    card: 1, name: 'Al Horford', first: 'Al', last: 'Horford', pos: 'C', age: 21, dob: '1986-06-03', hgt: '6′10″', wt: 245, wing: 85,
    rep: 'DO', born: 'DO', raised: 'US', city: 'Puerto Plata', her: 'DO', race: 'black',
    // Real (Rookie of the Year runner-up, unanimous All-Rookie): 81 games, 31.4 min, 10.1 pts, 9.7 reb, 1.5 ast,
    // 0.9 blk, .499 FG, .731 FT, no threes, PER 14.7, 25 double-doubles. A 7.3-ft average shot: 41% at the rim
    // (.640), the jump hook, a reliable 12–15 footer (.429). Strongest player at the combine (20 reps), one of the
    // slowest in the lane drill. Calm, coachable, a high basketball IQ; foul-prone (3.8 per 36).
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 11.9 pts, 9.4 reb, 1.8 ast, 0.7 stl, 0.9 blk, 0.9 tov, .628 FG on 7.5, .176 on 0.1 threes, .724 FT on 3.4 in 31.4 min.
    // 57 overall; potential 68.
    r: { hgt: 62, stre: 86, spd: 40, acc: 34, jmp: 62, endu: 66, ins: 82, dnk: 63, lay: 78, ft: 48, fg: 59, tp: 15, oiq: 60, diq: 62, blk: 63, stl: 53, drb: 42, pss: 45, reb: 83, box: 71 },
    pot: 68, intg: { feel: 64, poise: 76 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 75, ambition: 45 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 17.5%: 41% at the rim, 26% hooks and short shots, 33% from 10 ft out, no threes; .38 FTA per FGA.
    ten: { usage: 37, ftr: 70.4, ra: 62, paint: 26.3, mid: 10.8, c3: 0.2, atb: 0.7, cns: 18, pullup: 21.8, step: 3.1, fade: 57.1 },
  } },
  { label: 'Chris Paul – Rookie year (2005–06)', card: {
    card: 1, name: 'Chris Paul', first: 'Chris', last: 'Paul', pos: 'PG', age: 20, dob: '1985-05-06', hgt: '6′0″', wt: 175, wing: 76,
    rep: 'US', born: 'US', raised: 'US', city: 'Winston-Salem', state: 'NC', her: 'US', race: 'black',
    // Real (Rookie of the Year): 78 starts, 36.0 min, 16.1 pts, 7.8 ast, 5.1 reb, 2.2 stl (most steals in the
    // league), 2.3 tov, .430 FG, .282 from three, .847 FT on 6.0 attempts, PER 22.1, BPM +5.2. An 11.3-ft average
    // shot: 34% at the rim (.531), 23% long twos (.438); 79% of his baskets unassisted. Elite hands and quickness
    // (38.5-inch leap, 3.22 sprint), a fierce competitor and a road villain; the jumper came later.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 19.7 pts, 4.6 reb, 7.0 ast, 2.1 stl, 0.2 blk, 2.6 tov, .473 FG on 16.0, .291 on 2.3 threes, .918 FT on 4.2 in 33.4 min.
    // 62 overall; potential 78 (85 before potentials above 70 were compressed).
    r: { hgt: 24, stre: 52, spd: 82, acc: 85, jmp: 70, endu: 88, ins: 28, dnk: 14, lay: 46, ft: 90, fg: 34, tp: 32, oiq: 64, diq: 66, blk: 19, stl: 74, drb: 87, pss: 62, reb: 66, box: 47 },
    pot: 78, intg: { feel: 79, poise: 86 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: false, flashy: false, heat: false, crowd: false, villain: true, fearless: true, clutch: true, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 92, loyalty: 45, ambition: 86 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 23.5%: 25% at the rim, 20% paint, 43% mid-range, 12% threes; mostly pull-ups; .41 FTA per FGA.
    ten: { usage: 62.2, ftr: 64.9, ra: 65.8, paint: 13, mid: 8.5, c3: 0.5, atb: 12.2, cns: 6, pullup: 61.4, step: 31, fade: 1.6 },
  } },
  { label: 'Klay Thompson – Rookie year (2011–12)', card: {
    card: 1, name: 'Klay Thompson', first: 'Klay', last: 'Thompson', pos: 'SG', age: 21, dob: '1990-02-08', hgt: '6′7″', wt: 205, wing: 81,
    rep: 'US', born: 'US', raised: 'US', city: 'Los Angeles', state: 'CA', her: 'BS', race: 'black',
    // Real (All-Rookie First Team): 66 games, 24.4 min (18.1 pts as a starter after the Monta Ellis trade), 12.5 pts on
    // 10.9 FGA, .443 FG, .414 on 4.1 threes (.474 from the corners), .868 FT on 1.4 attempts, USG 24.7, PER 14.9.
    // A 17.2-ft average shot, 32% of it long twos (.414); 93% of his threes assisted. "Ice-cold killer": calm,
    // fearless, a heat checker; son of former No. 1 pick Mychal Thompson.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 11.7 pts, 2.4 reb, 2.0 ast, 0.5 stl, 0.3 blk, 1.5 tov, .423 FG on 8.9, .367 on 6.6 threes, .920 FT on 2.0 in 22.1 min.
    // 55 overall; potential 71.
    r: { hgt: 48, stre: 46, spd: 62, acc: 67, jmp: 46, endu: 76, ins: 37, dnk: 44, lay: 60, ft: 87, fg: 36, tp: 82, oiq: 47, diq: 42, blk: 44, stl: 39, drb: 42, pss: 61, reb: 52, box: 40 },
    pot: 71, intg: { feel: 58, poise: 82 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: true, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 76, loyalty: 80, ambition: 60 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 24.7%: 14% at the rim, 11% paint, 37% mid-range (32% long twos), 38% threes (a quarter from the corners); mostly catch-and-shoot; .13 FTA per FGA.
    ten: { usage: 62, ftr: 48.4, ra: 16.2, paint: 5.3, mid: 2.9, c3: 14.5, atb: 61.1, cns: 75.6, pullup: 14.3, step: 9.4, fade: 0.7 },
  } },
  { label: 'Kawhi Leonard – Rookie year (2011–12)', card: {
    card: 1, name: 'Kawhi Leonard', first: 'Kawhi', last: 'Leonard', pos: 'SF', age: 20, dob: '1991-06-29', hgt: '6′7″', wt: 227, wing: 87,
    rep: 'US', born: 'US', raised: 'US', city: 'Riverside', state: 'CA', her: 'US', race: 'black',
    // Real (All-Rookie First Team): 64 games (39 starts), 24.0 min, 7.9 pts, 5.1 reb, 1.3 stl, .493 FG, .376 from
    // three (45% of them from the corners, .469), .773 FT, PER 16.6, WS/48 .171, BPM +3.4, DRtg 101. A low-usage
    // finisher and corner shooter who guarded the other team's best wing: 7-3 wingspan, the biggest hands at the
    // combine. Quiet, humble, legendary work ethic. Retuned 2026-10-11 to a role player's ratings (he started at 61
    // overall, a rookie star's): 57 overall, 80 potential, the work ethic high but not maxed.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 8.1 pts, 5.8 reb, 1.2 ast, 1.3 stl, 0.5 blk, 0.7 tov, .475 FG on 6.4, .294 on 2.7 threes, .792 FT on 1.6 in 26.1 min.
    // 59 overall; potential 76 (80 before potentials above 70 were compressed).
    r: { hgt: 50, stre: 64, spd: 64, acc: 63, jmp: 54, endu: 70, ins: 52, dnk: 70, lay: 68, ft: 56, fg: 44, tp: 48, oiq: 50, diq: 64, blk: 38, stl: 66, drb: 42, pss: 43, reb: 71, box: 67 },
    pot: 76, intg: { feel: 64, poise: 80 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: true, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 88, loyalty: 40, ambition: 72 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 15.5%: 38% at the rim, 14% paint, 21% mid-range, 27% threes (most from the corners); mostly catch-and-shoot; .27 FTA per FGA.
    ten: { usage: 38.3, ftr: 50.7, ra: 41.1, paint: 11.6, mid: 6.8, c3: 10.5, atb: 30, cns: 64.5, pullup: 23.4, step: 6.4, fade: 5.7 },
  } },
  { label: 'Dwight Howard – Rookie year (2004–05)', card: {
    card: 1, name: 'Dwight Howard', first: 'Dwight', last: 'Howard', pos: 'C', age: 18, dob: '1985-12-08', hgt: '6′10″', wt: 240, wing: 88,
    rep: 'US', born: 'US', raised: 'US', city: 'Atlanta', state: 'GA', her: 'US', race: 'black',
    // Real (No. 1 pick straight from high school, every game a start at 18): 32.6 min, 12.0 pts, 10.0 reb (3.5
    // offensive), 1.7 blk, .520 FG, .671 FT on 5.0 attempts, PER 17.2, 32 double-doubles. A 3.7-ft average shot:
    // 59% at the rim (.623, 162 dunks), 30% from 3–10 ft (.407); nothing outside 16 ft. 7-4½ wingspan; playful,
    // a showman, better at home; 9.4 ppg in November, 16.7 in April.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 14.3 pts, 9.4 reb, 1.2 ast, 0.9 stl, 1.5 blk, 1.5 tov, .677 FG on 7.7, .100 on 0.0 threes, .725 FT on 5.4 in 31.3 min.
    // 57 overall; potential 77 (82 before potentials above 70 were compressed).
    r: { hgt: 70, stre: 80, spd: 64, acc: 59, jmp: 86, endu: 72, ins: 99, dnk: 99, lay: 83, ft: 44, fg: 24, tp: 1, oiq: 44, diq: 55, blk: 64, stl: 48, drb: 6, pss: 41, reb: 85, box: 94 },
    pot: 77, intg: { feel: 47, poise: 45 },
    pers: { mot: 'Fame', alpha: false, touches: false, pro: false, volatile: false, flashy: true, heat: false, crowd: true, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: false, legacy: false, streaky: false, work: 62, loyalty: 50, ambition: 70 },
    // Playing style from his real rookie numbers, as the NBA reports it (zones and how he created his jumpers add up to 100%; usage and free throws as scores): USG 17.5%: 65% at the rim, 27% in the paint, 8% from 10 ft out, no threes; .66 FTA per FGA.
    ten: { usage: 42, ftr: 90.2, ra: 77.6, paint: 21.2, mid: 0.8, c3: 0.1, atb: 0.3, cns: 32, pullup: 14.8, step: 3.2, fade: 50 },
  } },
  { label: 'John Wall – Rookie year (2010–11)', card: {
    card: 1, name: 'John Wall', first: 'John', last: 'Wall', pos: 'PG', age: 20, dob: '1990-09-06', hgt: '6′4″', wt: 195, wing: 81,
    rep: 'US', born: 'US', raised: 'US', city: 'Raleigh', state: 'NC', her: 'US', race: 'black',
    // Real (No. 1 pick, All-Rookie First Team, Rookie of the Year runner-up): 69 starts, 37.8 min, 16.4 pts on 14.6
    // FGA, 8.3 ast, 4.6 reb, 1.8 stl, 3.8 tov, .409 FG, .296 on 1.7 threes, .766 FT on 5.1 attempts, TS .487, PER
    // 15.8. The fastest end-to-end guard in the league: lived at the rim and in transition, pull-up jumpers he
    // hadn't found yet, loose with the ball. Played at 38 minutes, the card gives about 17 pts, 8.3 ast, 4.5 reb,
    // 2 stl, .417 FG and .28 from three. Became a five-time All-Star.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 18.5 pts, 3.8 reb, 8.1 ast, 1.5 stl, 0.6 blk, 4.3 tov, .455 FG on 15.4, .191 on 1.7 threes, .767 FT on 5.4 in 34.1 min.
    // 54 overall; potential 74 (78 before potentials above 70 were compressed).
    r: { hgt: 40, stre: 50, spd: 97, acc: 86, jmp: 80, endu: 84, ins: 28, dnk: 52, lay: 48, ft: 54, fg: 20, tp: 26, oiq: 22, diq: 44, blk: 53, stl: 67, drb: 87, pss: 80, reb: 50, box: 44 },
    pot: 74, intg: { feel: 74, poise: 50 },
    pers: { mot: 'Fame', alpha: true, touches: true, pro: false, volatile: true, flashy: true, heat: false, crowd: true, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: false, legacy: true, streaky: false, work: 55, loyalty: 70, ambition: 75 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): 32% at the rim, 16% paint, 40% mid-range, 12% threes; mostly pull-ups; .35 FTA per FGA.
    ten: { usage: 57.1, ftr: 74.2, ra: 84.4, paint: 8.4, mid: 3.5, c3: 0.3, atb: 3.4, cns: 5.1, pullup: 54, step: 39.8, fade: 1.1 },
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
    // Retuned 2026-10-18 (twice): a face-up shooter, not a rim runner. Against his real shot zones (about half his shots
    // from 10 feet out, a quarter at the rim, a few threes) under the AI's own tendencies: 9.1 pts, 5.2 reb, .484 FG on 8.1,
    // .595 at the rim on 3.4, 3.7 mid-range shots, .286 on 0.5 threes, .860 FT on 1.3. 47 overall; potential 62.
    r: { hgt: 68, stre: 42, spd: 70, acc: 68, jmp: 78, endu: 78, ins: 15, dnk: 42, lay: 20, ft: 84, fg: 95, tp: 40, oiq: 25, diq: 40, blk: 66, stl: 29, drb: 50, pss: 22, reb: 56, box: 46 },
    pot: 62, intg: { feel: 40, poise: 48 },
    pers: { mot: 'Fame', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: true, work: 70, loyalty: 70, ambition: 60 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): about half his shots long twos, a quarter at the rim; almost no threes; .28 FTA per FGA.
    ten: { usage: 45.8, ftr: 35.7, ra: 32.8, paint: 6.5, mid: 54.5, c3: 1.1, atb: 5.1, cns: 23.6, pullup: 34.1, step: 14.6, fade: 27.7 },
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
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 7.9 pts, 4.3 reb, 0.9 ast, 1.0 stl, 1.9 blk, 0.6 tov, .518 FG on 5.7, .289 on 1.7 threes, .800 FT on 1.8 in 27.9 min.
    // 62 overall; potential 75 (79 before potentials above 70 were compressed).
    r: { hgt: 60, stre: 54, spd: 84, acc: 70, jmp: 88, endu: 86, ins: 56, dnk: 60, lay: 60, ft: 64, fg: 17, tp: 41, oiq: 35, diq: 86, blk: 99, stl: 30, drb: 30, pss: 32, reb: 50, box: 52 },
    pot: 75, intg: { feel: 70, poise: 62 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 75, ambition: 55 },
    // Playing style from his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores): about half his shots at the rim (cuts, transition, putbacks), 15% threes; .58 FTA per FGA.
    ten: { usage: 31.5, ftr: 58.5, ra: 64.1, paint: 10, mid: 2.7, c3: 6.9, atb: 16.3, cns: 65.6, pullup: 19, step: 10.9, fade: 4.5 },
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
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 3.2 pts, 1.0 reb, 1.4 ast, 0.7 stl, 0.3 blk, 0.6 tov, .446 FG on 3.0, .246 on 0.6 threes, .716 FT on 0.6 in 12.3 min.
    // 50 overall; potential 56.
    r: { hgt: 36, stre: 52, spd: 82, acc: 85, jmp: 66, endu: 70, ins: 23, dnk: 23, lay: 27, ft: 44, fg: 42, tp: 35, oiq: 34, diq: 50, blk: 49, stl: 99, drb: 40, pss: 61, reb: 36, box: 28 },
    pot: 56, intg: { feel: 70, poise: 74 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: true, heat: false, crowd: true, villain: false, fearless: true, clutch: true, prone: false, padder: false, team: true, legacy: false, streaky: true, work: 90, loyalty: 60, ambition: 70 },
    // Playing style: what the AI sets for these ratings (it refreshes it every month), a slasher who pulls up from mid-range and takes about a third of his shots from three.
    ten: { usage: 30.6, ftr: 55.4, ra: 56.4, paint: 10.3, mid: 16.6, c3: 1.4, atb: 15.3, cns: 25.5, pullup: 35.4, step: 35.1, fade: 4 },
  } },
  { label: 'Toney Douglas – Rookie year (2009–10)', card: {
    card: 1, name: 'Toney Douglas', first: 'Toney', last: 'Douglas', pos: 'PG', age: 23, dob: '1986-03-16', hgt: '6′2″', wt: 190, wing: 78,
    rep: 'US', born: 'US', raised: 'US', city: 'Jonesboro', state: 'GA', her: 'US', race: 'black',
    // Real (No. 29 pick out of Florida State, ACC Defensive Player of the Year): 56 games (12 starts), 19.4 min, 8.6 pts,
    // 1.9 reb, 2.0 ast, 0.8 stl, 0.1 blk, 1.0 tov, .458 FG on 7.0 shots, .389 on 3.1 threes, .809 FT on 1.2. A
    // shoot-first combo guard and pesky on-ball defender. Tested over 300 games at about 20 minutes: 8.5 pts, 2.1 reb,
    // 1.8 ast, 1.1 stl, 0.1 blk, 1.2 tov, .431 FG on 7.2, .376 on 3.6 threes, .827 FT on 1.1.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 8.3 pts, 1.4 reb, 1.9 ast, 0.8 stl, 0.1 blk, 1.4 tov, .436 FG on 6.7, .375 on 3.5 threes, .771 FT on 1.5 in 17.1 min.
    // 55 overall; potential 58.
    r: { hgt: 34, stre: 52, spd: 78, acc: 66, jmp: 62, endu: 74, ins: 37, dnk: 43, lay: 61, ft: 56, fg: 80, tp: 70, oiq: 48, diq: 62, blk: 21, stl: 67, drb: 55, pss: 66, reb: 37, box: 33 },
    pot: 58, intg: { feel: 50, poise: 60 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 82, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 48.8, ftr: 47.8, ra: 20.6, paint: 8.9, mid: 19.5, c3: 11.4, atb: 39.6, cns: 66.4, pullup: 23.2, step: 7.4, fade: 3 },
  } },
  { label: 'Jan Veselý – Rookie year (2011–12)', card: {
    card: 1, name: 'Jan Veselý', first: 'Jan', last: 'Veselý', pos: 'PF', age: 21, dob: '1990-04-24', hgt: '7′0″', wt: 240, wing: 85,
    rep: 'CZ', born: 'CZ', raised: 'CZ', city: 'Ostrava', her: 'CZ', race: 'white',
    // Real (No. 6 pick, from Partizan Belgrade): 57 games (20 starts), 18.9 min, 4.7 pts, 4.4 reb, 0.8 ast, 0.7 stl,
    // 0.6 blk, 1.1 tov, .537 FG on 3.8 shots (lobs, dunks, putbacks), 0 for 1 from three, .532 FT on 1.1. An explosive
    // leaper with no jumper and a broken free throw. Tested over 300 games at about 20 minutes: 4.2 pts, 4.7 reb,
    // 0.7 ast, 0.6 stl, 0.5 blk, 0.7 tov, .564 FG on 3.4, .502 FT on 0.8 (a little fewer turnovers than his real 1.1).
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 4.0 pts, 4.0 reb, 0.5 ast, 0.7 stl, 0.6 blk, 0.3 tov, .668 FG on 2.6, .077 on 0.0 threes, .522 FT on 1.0 in 17.7 min.
    // 45 overall; potential 52.
    r: { hgt: 66, stre: 50, spd: 74, acc: 67, jmp: 84, endu: 70, ins: 49, dnk: 57, lay: 51, ft: 11, fg: 39, tp: 14, oiq: 29, diq: 50, blk: 78, stl: 85, drb: 15, pss: 32, reb: 59, box: 53 },
    pot: 52, intg: { feel: 40, poise: 40 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: true, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 70, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 23.9, ftr: 58.3, ra: 82.4, paint: 12.8, mid: 4, c3: 0.2, atb: 0.6, cns: 26.1, pullup: 23.6, step: 11.2, fade: 39.1 },
  } },
  { label: 'Bismack Biyombo – Rookie year (2011–12)', card: {
    card: 1, name: 'Bismack Biyombo', first: 'Bismack', last: 'Biyombo', pos: 'C', age: 19, dob: '1992-08-28', hgt: '6′9″', wt: 255, wing: 90,
    rep: 'CD', born: 'CD', raised: 'CD', city: 'Lubumbashi', her: 'CD', race: 'dark',
    // Real (No. 7 pick, from Fuenlabrada in Spain): 63 games (41 starts), 23.1 min, 5.2 pts, 5.8 reb, 0.4 ast, 0.3 stl,
    // 1.8 blk, 1.1 tov, .464 FG on 4.4 shots, .483 FT on 2.3. A 7-6 wingspan, all defense and energy, almost no
    // offense beyond dunks. Tested over 300 games at about 24 minutes: 4.9 pts, 6.0 reb, 0.6 ast, 0.3 stl, 1.6 blk,
    // 0.4 tov, .501 FG on 4.0, .505 FT on 1.7 (fewer turnovers than his real 1.1, as for every low-usage big).
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 4.6 pts, 3.4 reb, 0.8 ast, 0.3 stl, 2.2 blk, 0.3 tov, .657 FG on 3.1, .000 on 0.0 threes, .409 FT on 1.1 in 24.0 min.
    // 47 overall; potential 60.
    r: { hgt: 60, stre: 72, spd: 62, acc: 65, jmp: 95, endu: 70, ins: 44, dnk: 50, lay: 36, ft: 1, fg: 16, tp: 1, oiq: 30, diq: 70, blk: 99, stl: 5, drb: 15, pss: 22, reb: 29, box: 37 },
    pot: 60, intg: { feel: 35, poise: 45 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 85, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 16.5, ftr: 67.5, ra: 86.2, paint: 12.2, mid: 1.1, c3: 0.1, atb: 0.4, cns: 36.4, pullup: 22.1, step: 8.5, fade: 33 },
  } },
  { label: 'Bronny James – Rookie year (2024–25)', card: {
    card: 1, name: 'Bronny James', first: 'Bronny', last: 'James', pos: 'SG', age: 20, dob: '2004-10-06', hgt: '6′2″', wt: 210, wing: 79,
    rep: 'US', born: 'US', raised: 'US', city: 'Cleveland', state: 'OH', her: 'US', race: 'black',
    // Real (No. 55 pick out of USC; most of the year with the G League's South Bay Lakers): 27 games (1 start), 6.7 min,
    // 2.3 pts, 0.7 reb, 0.8 ast, 0.3 stl, 0.5 tov, .313 FG on 2.5 shots, .281 on 1.2 threes, .786 FT. Strong, a willing
    // defender, the offense still raw. Tested over 500 games at about 7 minutes: 2.2 pts, 0.7 reb, 0.8 ast, 0.2 stl,
    // 0.5 tov, .329 FG on 2.4, .282 on 1.5 threes, .750 FT.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 2.0 pts, 0.6 reb, 1.1 ast, 0.3 stl, 0.1 blk, 0.3 tov, .379 FG on 1.8, .285 on 1.1 threes, .739 FT on 0.4 in 9.3 min.
    // 48 overall; potential 52.
    r: { hgt: 34, stre: 60, spd: 66, acc: 60, jmp: 70, endu: 70, ins: 34, dnk: 30, lay: 14, ft: 53, fg: 15, tp: 43, oiq: 36, diq: 52, blk: 41, stl: 51, drb: 36, pss: 64, reb: 31, box: 31 },
    pot: 52, intg: { feel: 55, poise: 55 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: true, streaky: false, work: 80, loyalty: 60, ambition: 55 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 22.1, ftr: 44.2, ra: 31.8, paint: 5.1, mid: 3.9, c3: 8.3, atb: 50.9, cns: 65.5, pullup: 20.4, step: 12.3, fade: 1.8 },
  } },
  { label: 'Jarrett Culver – Rookie year (2019–20)', card: {
    card: 1, name: 'Jarrett Culver', first: 'Jarrett', last: 'Culver', pos: 'GF', age: 20, dob: '1999-02-20', hgt: '6′6″', wt: 195, wing: 82,
    rep: 'US', born: 'US', raised: 'US', city: 'Lubbock', state: 'TX', her: 'US', race: 'black',
    // Real (No. 6 pick out of Texas Tech, the 2019 Big 12 Player of the Year): 63 games (35 starts), 23.9 min, 9.2 pts,
    // 3.4 reb, 1.7 ast, 0.9 stl, 0.6 blk, 1.3 tov, .404 FG on 9.0 shots, .299 on 3.5 threes, .462 FT on 1.9. A long,
    // willing wing defender whose shot never came: one of the worst free-throw shooters in the league. Tested over 800
    // games at about 23.5 minutes: 9.3 pts, 3.2 reb, 1.7 ast, 0.9 stl, 0.6 blk, 1.4 tov, .417 FG on 8.8, .309 on 3.6
    // threes, .458 FT on 1.8.
    // Retuned 2026-10-18 for today's engine, playing the AI's own tendencies (which replace a card's every month) at his
    // real minutes and role on a mid-table team: 8.4 pts, 2.7 reb, 1.7 ast, 0.6 stl, 0.5 blk, 0.6 tov, .462 FG on 7.2, .353 on 3.4 threes, .418 FT on 1.3 in 24.1 min.
    // 53 overall; potential 54.
    r: { hgt: 46, stre: 46, spd: 70, acc: 80, jmp: 68, endu: 72, ins: 39, dnk: 45, lay: 27, ft: 5, fg: 48, tp: 56, oiq: 73, diq: 60, blk: 54, stl: 28, drb: 65, pss: 44, reb: 53, box: 50 },
    pot: 54, intg: { feel: 50, poise: 45 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 85, loyalty: 65, ambition: 60 },
    // Playing style tuned with the ratings to his real rookie numbers (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 42.9, ftr: 51.7, ra: 35, paint: 5.1, mid: 7, c3: 15.5, atb: 37.4, cns: 52.6, pullup: 32.2, step: 12.8, fade: 2.4 },
  } },
  { label: 'Jarred Vanderbilt – 2022–23', card: {
    card: 1, name: 'Jarred Vanderbilt', first: 'Jarred', last: 'Vanderbilt', pos: 'PF', age: 23, dob: '1999-04-03', hgt: '6′8″', wt: 214, wing: 85,
    rep: 'US', born: 'US', raised: 'US', city: 'Houston', state: 'TX', her: 'US', race: 'black',
    // Real (No. 41 pick in 2018 out of Kentucky; his fifth season, split between Utah and the Lakers): 78 games, 24.1 min,
    // 7.9 pts, 7.5 reb, 2.4 ast, 1.1 stl, 0.3 blk, 1.2 tov, .548 FG on 5.8 shots, .322 on 1.2 threes, .691 FT on 1.8.
    // A long, relentless rebounder and switchable defender who scores on putbacks, cuts and dunks.
    // Shots: 48% from 0–3 ft (.720), 28% from 3–10 ft (.449), 4% mid-range, 20% threes (88% of them from the corner).
    // Tested over 430 games at his real minutes and role on a mid-table team, playing the AI's own tendencies (which
    // replace a card's every month): 7.1 pts, 7.1 reb, 2.3 ast, 0.9 stl, 0.4 blk, 0.7 tov, .552 FG on 5.2, .306 on 1.3 threes,
    // .728 FT on 1.3 in 23.7 min (fewer turnovers than his real 1.2, as for every low-usage big).
    // 59 overall; potential 60.
    r: { hgt: 56, stre: 60, spd: 72, acc: 78, jmp: 80, endu: 78, ins: 50, dnk: 65, lay: 50, ft: 41, fg: 27, tp: 47, oiq: 55, diq: 72, blk: 24, stl: 70, drb: 42, pss: 59, reb: 77, box: 67 },
    pot: 60, intg: { feel: 55, poise: 55 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: true, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 90, loyalty: 60, ambition: 55 },
    // Playing style from his real 2022–23 shot chart (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 30, ftr: 53, ra: 48, paint: 28, mid: 4, c3: 18, atb: 2, cns: 85, pullup: 10, step: 0, fade: 5 },
  } },
  { label: 'Maxi Kleber – Prime (2019–20)', card: {
    card: 1, name: 'Maxi Kleber', first: 'Maxi', last: 'Kleber', pos: 'FC', age: 28, dob: '1992-01-29', hgt: '6′10″', wt: 240, wing: 87,
    rep: 'DE', born: 'DE', raised: 'DE', city: 'Würzburg', her: 'DE', race: 'white',
    // Real (undrafted in 2014, from Bayern Munich; his best season, with Dallas): 74 games (21 starts), 25.5 min, 9.1 pts,
    // 5.2 reb, 1.2 ast, 0.3 stl, 1.1 blk, 0.8 tov, .461 FG on 6.9 shots, .373 on 4.3 threes, .849 FT on 1.3.
    // A stretch big off the bench: spot-up threes, rim protection, switching onto guards.
    // Shots: 28% from 0–3 ft (.669), 7% from 3–10 ft, 4% mid-range, 62% threes (38% of them from the corner).
    // Tested over 420 games at his real minutes and bench role on a mid-table team, playing the AI's own tendencies
    // (which replace a card's every month): 9.0 pts, 5.3 reb, 1.1 ast, 0.4 stl, 1.2 blk, 0.9 tov, .444 FG on 6.7,
    // .392 on 4.5 threes, .855 FT on 1.5 in 23.8 min.
    // 59 overall; potential 59 (28: he is what he is).
    r: { hgt: 64, stre: 55, spd: 55, acc: 48, jmp: 65, endu: 65, ins: 35, dnk: 45, lay: 35, ft: 76, fg: 58, tp: 81, oiq: 54, diq: 70, blk: 65, stl: 22, drb: 30, pss: 45, reb: 61, box: 61 },
    pot: 59, intg: { feel: 60, poise: 60 },
    pers: { mot: 'Winning', alpha: false, touches: false, pro: true, volatile: false, flashy: false, heat: false, crowd: false, villain: false, fearless: false, clutch: false, prone: false, padder: false, team: true, legacy: false, streaky: false, work: 80, loyalty: 75, ambition: 45 },
    // Playing style from his real 2019–20 shot chart (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 30, ftr: 30, ra: 28, paint: 7, mid: 3, c3: 24, atb: 38, cns: 92, pullup: 5, step: 0, fade: 3 },
  } },
  { label: 'Joel Embiid – Draft night (2014, Kansas)', card: {
    card: 1, name: 'Joel Embiid', first: 'Joel', last: 'Embiid', pos: 'C', age: 20, dob: '1994-03-16', hgt: '7′0″', wt: 250, wing: 89,
    rep: 'CM', born: 'CM', raised: 'CM', city: 'Yaoundé', her: 'CM', race: 'black',
    // Real (No. 3 pick in 2014 after one season at Kansas, the Big 12 Defensive Player of the Year; a back injury ended
    // it after 28 games): 23.1 min, 11.2 pts, 8.1 reb, 1.4 ast, 0.9 stl, 2.6 blk, 2.4 tov, .626 FG on 5.6 shots, 1 of 5
    // threes, .685 FT on 5.4. Per 40: 19.4 pts, 14.0 reb, 4.5 blk. He'd played organized basketball for about 3½ years:
    // rare footwork and touch for a 7-footer, a shot-blocker and rebounder, raw handle and reads, limited stamina.
    // Fitted 2026-10-26 to his per-40 numbers with the game's college-stats model (engine/amateurStats.ts, Kansas as a
    // power program, his ratings held near a scouting prior): 19.6 pts, 14.1 reb, 2.3 ast, 1.5 stl, 4.2 blk, 3.3 tov,
    // .642 FG, .698 FT per 40 (his real free-throw rate, 9.4 a 40, is beyond the model's: 4.9).
    // 56 overall on draft night; potential 69, his MVP peak (2022–23), the top of today's scale.
    r: { hgt: 70, stre: 78, spd: 60, acc: 75, jmp: 68, endu: 50, ins: 82, dnk: 78, lay: 72, ft: 44, fg: 54, tp: 30, oiq: 39, diq: 65, blk: 87, stl: 52, drb: 29, pss: 41, reb: 64, box: 56 },
    pot: 69, intg: { feel: 58, poise: 58 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: false, flashy: false, heat: false, crowd: true, villain: true, fearless: true, clutch: false, prone: true, padder: false, team: false, legacy: true, streaky: false, work: 75, loyalty: 80, ambition: 85 },
    // Playing style from his Kansas season: post-ups, hooks and finishes inside, a few face-up jumpers, almost no threes; a huge free-throw rate.
    ten: { usage: 45, ftr: 80, ra: 52, paint: 30, mid: 14, c3: 1, atb: 3, cns: 30, pullup: 15, step: 5, fade: 50 },
  } },
  { label: 'Joel Embiid – Rookie year (2016–17)', card: {
    card: 1, name: 'Joel Embiid', first: 'Joel', last: 'Embiid', pos: 'C', age: 22, dob: '1994-03-16', hgt: '7′0″', wt: 250, wing: 89,
    rep: 'CM', born: 'CM', raised: 'CM', city: 'Yaoundé', her: 'CM', race: 'black',
    // Real (his first season, after two lost to foot injuries; Philadelphia, "The Process"): 31 games, 25.4 min, 20.2 pts,
    // 7.8 reb, 2.1 ast, 0.9 stl, 2.5 blk, 3.8 tov, .466 FG on 13.8 shots, .367 on 3.2 threes, .783 FT on 7.7.
    // Tuned 2026-10-26 over 240 games as a mid-table team's first option, playing the AI's own tendencies (which replace
    // a card's every month), at 23.7 min: 19.6 pts, 7.3 reb, 1.8 ast, 0.8 stl, 2.2 blk, 3.1 tov, .494 FG on 13.2, .352 on 4.3
    // threes, .810 FT on 6.2 (at his real 25.4 minutes: about 21 pts, 7.8 reb).
    // 63 overall; potential 69, his MVP peak.
    r: { hgt: 70, stre: 89, spd: 60, acc: 72, jmp: 66, endu: 45, ins: 89, dnk: 84, lay: 81, ft: 62, fg: 74, tp: 63, oiq: 48, diq: 71, blk: 90, stl: 55, drb: 50, pss: 54, reb: 72, box: 64 },
    pot: 69, intg: { feel: 58, poise: 60 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: false, flashy: false, heat: false, crowd: true, villain: true, fearless: true, clutch: false, prone: true, padder: false, team: false, legacy: true, streaky: false, work: 75, loyalty: 80, ambition: 85 },
    // Playing style: the AI's own for these ratings and a first option's role (zones and how he created his jumpers add up to 100%; usage and free throws as scores).
    ten: { usage: 59.4, ftr: 75.3, ra: 37.7, paint: 13, mid: 11.9, c3: 12.3, atb: 25.1, cns: 61.9, pullup: 22.2, step: 3.2, fade: 12.7 },
  } },
  { label: 'Joel Embiid – MVP season (2022–23)', card: {
    card: 1, name: 'Joel Embiid', first: 'Joel', last: 'Embiid', pos: 'C', age: 28, dob: '1994-03-16', hgt: '7′0″', wt: 280, wing: 89,
    rep: 'CM', born: 'CM', raised: 'CM', city: 'Yaoundé', her: 'CM', race: 'black',
    // Real (MVP and scoring champion, Philadelphia): 66 games, 34.6 min, 33.1 pts, 10.2 reb, 4.2 ast, 1.0 stl, 1.7 blk, 3.4 tov,
    // .548 FG on 20.1 shots, .330 on 3.0 threes, .857 FT on 11.7.
    // Tuned 2026-10-26 over 240 games as a mid-table team's first option, playing the AI's own tendencies, at 32.3 min:
    // 30.8 pts, 9.3 reb, 4.1 ast, 1.2 stl, 1.9 blk, 4.0 tov, .541 FG on 19.7, .329 on 3.6 threes, .892 FT on 9.2 (at his real
    // 34.6 minutes: about 33 pts, 9.9 reb; fewer free throws than his real 11.7, the engine's limit for a post scorer).
    // 69 overall (68.5): the top of today's scale, where MVP seasons sit.
    r: { hgt: 70, stre: 95, spd: 60, acc: 71, jmp: 62, endu: 65, ins: 88, dnk: 72, lay: 78, ft: 82, fg: 74, tp: 47, oiq: 80, diq: 73, blk: 66, stl: 53, drb: 60, pss: 60, reb: 72, box: 68 },
    pot: 69, intg: { feel: 70, poise: 75 },
    pers: { mot: 'Winning', alpha: true, touches: true, pro: false, volatile: false, flashy: false, heat: false, crowd: true, villain: true, fearless: true, clutch: false, prone: true, padder: false, team: false, legacy: true, streaky: false, work: 75, loyalty: 80, ambition: 85 },
    // Playing style: the AI's own for these ratings and a first option's role.
    ten: { usage: 69.1, ftr: 71.2, ra: 43.9, paint: 19, mid: 16.6, c3: 7.9, atb: 12.6, cns: 56.2, pullup: 25.6, step: 4.3, fade: 13.9 },
  } },
];

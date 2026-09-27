// Scouting reports for any player: draft prospects, players abroad, your own roster and
// everyone else in the league. What the scouts see is the truth plus noise: the margin
// shrinks with scout skill, specialty, the scouting budget and time spent watching (intel),
// and your own players are seen every day. Text is written from the observed ratings.
import { hometownOf } from '../data/hometown';
import { ensureIntg, feelWord } from './intangibles';
import type { Game } from './Game';
import { regions } from '../data/world';
import { intelF } from './overseas';
import { mulberry32 } from './rng';
import { badgesOf, type Badge } from './ratings';
import { yosOf } from './cba';

export type ReportKind = 'prospect' | 'overseas' | 'mine' | 'league' | 'fa';
export interface Report {
  pid: number; kind: ReportKind; kindLabel: string; scout: string; confidence: string; margin: number; filed: string;
  measure: [string, string][]; grades: [string, number, number, number | null, string][]; overall: number; seen: { ovr: number; pot: number }; projection: string; ceiling: string; comp: { id: number; name: string } | null; compNote: string; best: { id: number; name: string } | null; worst: { id: number; name: string } | null; outlook: string; outlookTitle?: string; statRows: any[];
  overview: string; strengths: string[]; weaknesses: string[]; notes: string[];
}

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const g10 = (v: number) => Math.round(cl((v - 22) / 7, 1, 10) * 2) / 2; // 25 → 1, 90 → 10 (half points)

export function kindOf(g: Game, s: any, p: any): ReportKind {
  if (s.overseas?.includes(p.id)) return 'overseas';
  if (p.cls && !Object.values(s.rosters).some((r: any) => r.includes(p.id))) return 'prospect';
  if (s.fa?.includes(p.id)) return 'fa';
  return (s.rosters[s.me] || []).includes(p.id) || s.managed.some((t: number) => (s.rosters[t] || []).includes(p.id)) ? 'mine' : 'league';
}

// How far off the scouts' read can be (in rating points), and who's reporting.
export function scoutRead(g: Game, s: any, p: any) {
  const kind = kindOf(g, s, p), REG = regions(), scouts = s.scouts || [], budget = s.budget?.Scouting ?? 4, bF = 1.2 - budget / 20;
  const regK = g.regionKey((p.from && p.from.country) || p.raised), inReg = scouts.filter((x: any) => x.assign === regK);
  const best = [...scouts].sort((a: any, b: any) => b.skill - a.skill)[0];
  const listed = (s.scoutList || []).includes(p.id) || (s.scoutFocus || []).includes(p.id);
  let margin: number, scout: string;
  if (kind === 'mine') { margin = 0.5; scout = 'Your coaching staff (sees him every day)'; }
  else if (kind === 'league' || kind === 'fa') { const gp = p.gp || 0; margin = cl((3.2 - Math.min(gp, 40) / 20) * bF / intelF(s, p.id) * (listed ? 0.7 : 1), 0.8, 4); scout = (best ? best.name : 'Pro scouting') + ' (pro personnel)'; }
  else { const yo = Math.max(0, (p.cls || g.Y) - g.Y); margin = cl((yo * 5 + 3) * bF * g.regFactor(p, s) / intelF(s, p.id), 1, 20); scout = inReg.length ? inReg.map((x: any) => x.name).join(' & ') + ' (' + REG[regK].name + ')' : 'No scout in ' + REG[regK].name + ': video and word of mouth only'; }
  if (s.easy?.scouting) margin *= 0.35; // easy mode: forgiving scouting
  if (s.god) margin = 0;
  const confidence = margin <= 1 ? 'Very high' : margin <= 2.5 ? 'High' : margin <= 5 ? 'Medium' : margin <= 9 ? 'Low' : 'Very low';
  return { kind, margin, scout, confidence };
}

// Observed ratings: consistent per player (seeded), scaled by the margin.
function observed(p: any, margin: number) {
  const r = mulberry32(p.id * 9973 + 7), out: Record<string, number> = {};
  Object.keys(p.r).forEach(k => (out[k] = cl(Math.round(p.r[k] + (r() * 2 - 1) * margin * 1.3), 1, 100)));
  return { r: out, ovr: cl(Math.round(p.ovr + (r() * 2 - 1) * margin), 1, 100), pot: cl(Math.round(p.pot + (p.nz?.[1] ?? r() * 2 - 1) * margin * 1.4), 1, 100) };
}

// Where a rating sits in this league: 75+ is a superstar, 66+ an All-Star, 56+ a starter
// (about the top five on an average team), 48+ a rotation player, 41+ end of the bench.
const TIER = [75, 66, 56, 48, 41];
const tierOf = (v: number) => { const i = TIER.findIndex(t => v >= t); return i < 0 ? 5 : i; };

const pickOf = (seed: number) => { const r = mulberry32(seed); return <T,>(a: T[]) => a[Math.floor(r() * a.length)]; };

const GOOD: Record<string, string[]> = {
  spd: ['Elite end-to-end speed; he beats everyone down the floor in transition.', 'Quick first step that gets him a shoulder past his man.', 'Changes speeds well and gets where he wants off the bounce.'],
  jmp: ['Explosive leaper who plays above the rim off one or two feet.', 'Second-jump quickness lets him tip in misses before bigs reload.', 'Vertical pop shows up on lobs, blocks and putbacks.'],
  endu: ['Relentless motor; still attacking in the fourth quarter.', 'Conditioning is a strength; handles heavy minutes without fading.'],
  stre: ['Strong frame that holds position in the post and finishes through contact.', 'Physical; comfortable absorbing bumps on drives and boxing out.'],
  hgt: ['Excellent size and length for his position.', 'Long arms let him contest and finish over defenders.'],
  tp: ['Deep, repeatable stroke from three; defenses have to chase him off the line.', 'Catch-and-shoot threat with quick release and good rotation.', 'Can shoot off movement and relocate for open threes.'],
  fg: ['Reliable pull-up game from the elbows and short corners.', 'Soft touch in the mid-range; turnaround jumper is a go-to.'],
  ft: ['Knocks down free throws, a good sign for his shooting touch.', 'Money at the line in late-game situations.'],
  ins: ['Polished around the basket with footwork and counters in the post.', 'Uses both hands to finish in traffic.'],
  dnk: ['Finishes with authority at the rim.', 'A threat as a roll man and lob target.'],
  lay: ['Soft touch around the rim: floaters, scoops and reverses off the glass.', 'Finishes through contact with either hand.'],
  acc: ['Explosive first step; gets a shoulder past his man from a standstill.', 'Gets to top speed in two dribbles.'],
  box: ['Elite box-out habits: his man rarely touches a rebound, even if he doesn’t grab it himself.', 'Seals and holds position on every shot.'],
  drb: ['Tight handle; creates separation with crossovers and hesitations.', 'Can bring the ball up against pressure and run pick-and-roll.'],
  pss: ['Sees the floor and delivers on time: skip passes, pocket passes, hit-aheads.', 'Unselfish playmaker who makes the easy play and the hard one.'],
  oiq: ['High basketball IQ; always in the right spot and rarely forces anything.', 'Reads defenses quickly and plays within the offense.'],
  diq: ['Smart team defender who rotates on time and talks.', 'Anticipates passing lanes and uses his hands well.'],
  reb: ['Excellent rebounder who pursues the ball out of his area.', 'Crashes the offensive glass and creates extra possessions.'],
};
const BAD: Record<string, string[]> = {
  spd: ['Lacks foot speed; struggles to stay in front of quicker guards.', 'Slow getting back in transition.'],
  jmp: ['Below-the-rim athlete; finishing over length is a question.', 'Not much lift; blocks and putbacks are rare.'],
  endu: ['Conditioning needs work; production drops as minutes pile up.'],
  stre: ['Thin frame; gets pushed off his spots and needs to add strength.', 'Struggles to finish through contact.'],
  hgt: ['Undersized for his position.', 'Short arms limit his contests.'],
  tp: ['Three-point shot is a work in progress; defenders go under screens.', 'Inconsistent mechanics beyond the arc.'],
  fg: ['Little in-between game; mid-range jumper isn’t reliable yet.'],
  ft: ['Poor free-throw shooter, which caps his value late in games.'],
  ins: ['Raw around the basket; needs a go-to move.'],
  dnk: ['Doesn’t finish strong at the rim.'],
  lay: ['Little touch around the basket; misses too many layups.'],
  acc: ['Slow first step; can’t turn the corner on drives.'],
  box: ['Ball-watches on the glass instead of finding a body to box out.'],
  drb: ['Loose handle; turnover-prone when pressured.', 'Needs to tighten his handle before he can create for himself.'],
  pss: ['Tunnel vision at times; misses open teammates.', 'Not a natural passer.'],
  oiq: ['Decision-making lags behind his tools; forces shots.', 'Still learning to read defenses.'],
  diq: ['Loses his man off the ball and is late on rotations.', 'Gambles too much on defense.'],
  reb: ['Rebounds below his size; needs to box out more consistently.'],
};

export function scoutReport(g: Game, s: any, pid: number): Report {
  const P = g.db.P, p = P[pid], C = g.db.C, rd = scoutRead(g, s, p), o = observed(p, rd.margin), pick = pickOf(pid * 31 + g.Y);
  const grp = p.grp as 'G' | 'W' | 'B', grow = p.age <= 23 ? Math.max(0, o.pot - o.ovr) * (p.age <= 20 ? 0.6 : 0.45) : 0;
  // Young players are graded on the tools they'll grow into (skills), not only today's level.
  const R: Record<string, number> = {}; Object.keys(o.r).forEach(k => (R[k] = o.r[k] + (k === 'hgt' ? 0 : grow)));
  const sizeAdj = grp === 'G' ? 12 : grp === 'W' ? 0 : -10;
  const hIn0 = (() => { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; })(), wing0 = p.wing ?? hIn0 + 3 + (p.id % 4);
  const sizeG = Math.round(cl(5.5 + (hIn0 - ({ G: 76, W: 79, B: 83 } as any)[grp]) * 0.9 + (wing0 - hIn0 - 3) * 0.5, 1, 10) * 2) / 2;
  // Game production (last two regular seasons), blended in by sample size.
  const rows = (p.stats || []).filter((x: any) => !x.po && x.season >= g.Y - 1), T: any = rows.reduce((a: any, x: any) => { Object.keys(x).forEach(k => { if (typeof x[k] === 'number') a[k] = (a[k] || 0) + x[k]; }); return a; }, {});
  const gp = T.gp || 0, per36 = (v: number) => (T.min ? (v / T.min) * 36 : 0), lin = (v: number, a: number, b: number) => cl(1 + ((v - a) / (b - a)) * 9, 1, 10);
  const perNow = gp ? g.perOf(T, g.Y) : 0, tp = T.tpa >= 30 ? T.tpm / T.tpa : null, ft = T.fta >= 20 ? T.ftm / T.fta : null, ato = T.tov ? T.ast / T.tov : T.ast ? 3 : null;
  const statG: Record<string, number | null> = gp < 8 ? {} : {
    'Jump shot': tp != null ? lin(tp * 0.7 + (ft ?? 0.75) * 0.3, 0.42, 0.58) : ft != null ? lin(ft, 0.55, 0.9) : null,
    'Passing': lin(per36(T.ast), 1, 10), 'Ball handling': ato != null ? lin(ato, 0.8, 3.6) : null, 'Defense': lin(per36((T.stl || 0) + (T.blk || 0)), 0.8, 4.2),
    'NBA ready': lin(perNow, 8, 26), 'Strength': lin(per36((T.orb || 0) + (T.drb || 0)) * (grp === 'G' ? 1.6 : grp === 'W' ? 1.2 : 1), 4, 13),
  };
  const w = Math.min(0.6, gp / 80);
  // Intangibles (Feel, Poise) are twice as hard to read as skills; the staff sees them daily.
  const itT = ensureIntg(p), ir = mulberry32(p.id * 131 + 7), im = rd.kind === 'mine' || s.god ? 0 : Math.max(3, rd.margin * 2);
  const intRead = { feel: cl(Math.round(itT.feel + (ir() * 2 - 1) * im), 1, 99), poise: cl(Math.round(itT.poise + (ir() * 2 - 1) * im), 1, 99) };
  const eye: [string, number][] = [
    ['Athleticism', g10((R.spd + R.jmp + R.endu) / 3 + 4)], ['Size', sizeG], ['Defense', g10(R.diq * 0.6 + (grp === 'B' ? R.hgt : R.spd) * 0.4)], ['Strength', g10(R.stre)],
    ['Quickness', g10((R.spd + (R.acc ?? R.spd)) / 2)], ['Leadership', g10(R.oiq * 0.6 + (p.age - 18) * 2 + (p.pers?.alpha ? 8 : 0) + (p.pers?.pro ? 8 : 0))], ['Jump shot', g10((R.tp + R.fg) / 2 + 3)], ['NBA ready', g10(o.ovr + 12)],
    ['Ball handling', g10(R.drb + (grp === 'B' ? 6 : 0))], ['Potential', g10(o.pot + 6)], ['Passing', g10(R.pss + (grp === 'B' ? 6 : 0))], ['Intangibles', g10(intRead.feel * 0.5 + intRead.poise * 0.3 + 12 + ((p.pers?.work ?? 50) - 50) / 4)],
  ];
  const grades: [string, number, number, number | null, string][] = eye.map(([k, e]) => { const st = statG[k] ?? null, v = st == null ? e : Math.round((e * (1 - w) + st * w) * 2) / 2; return [k, v, e, st == null ? null : Math.round(st * 2) / 2, st == null ? 'Scouts’ eye' : 'Eye ' + e + ' · production ' + (Math.round(st * 2) / 2) + ' (' + gp + ' games)']; });
  const overall = Math.round(cl(o.pot * 0.55 + o.ovr * 0.45 + 18, 40, 99));
  // Measurements.
  const hIn = (() => { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; })(), wing = p.wing ?? hIn + 3 + (p.id % 4);
  const team = (() => { for (const k of Object.keys(s.rosters)) if (s.rosters[k].includes(pid)) return s.teams[+k].region + ' ' + s.teams[+k].name; return p.abroad ? p.abroad.club + ' (' + p.abroad.lg + ')' : p.cls ? p.from.team + ' (' + p.from.lg + ')' : 'Free agent'; })();
  const measure: [string, string][] = [['Position', p.pos], ['Age', String(p.age)], ['Height', p.hgt], ['Weight', p.wt + ' lb'], ['Wingspan', Math.floor(wing / 12) + '′' + (wing % 12) + '″ (' + (wing - hIn >= 0 ? '+' : '') + (wing - hIn) + ')'], ['Hand', p.id % 9 === 0 ? 'Left' : 'Right'], ['Team', team], ['Hometown', hometownOf(p, C)], ['Represents', C[p.rep]?.n || '']];
  // Comparisons: active players whose rating profile is closest (shape), at his current level,
  // at his ceiling (best case) and below it (worst case).
  const near = (level: number, skip: number[] = []) => { let c: any = null, b = 1e9; Object.values(s.rosters).flat().forEach((id: any) => { if (id === pid || skip.includes(id)) return; const q = P[id]; let d = q.grp === grp ? 0 : 400; Object.keys(q.r).forEach(k => (d += Math.pow(q.r[k] - q.ovr - (R[k] - o.ovr), 2))); d += Math.pow(q.ovr - level, 2) * 12; if (d < b) { b = d; c = q; } }); return c; };
  const comp: any = near(Math.max(o.ovr, o.pot - 4)), bestC: any = o.pot - o.ovr >= 3 ? near(o.pot + 2, comp ? [comp.id] : []) : null, worstC: any = near(Math.max(40, (rd.kind === 'prospect' || rd.kind === 'overseas' ? o.ovr + 2 : o.ovr - 5)), [comp?.id, bestC?.id].filter(x => x != null));
  // Projection.
  const board = g.db.rank?.[pid], yo = Math.max(0, (p.cls || g.Y) - g.Y);
  const ceilOf = (v: number) => ['superstar', 'All-Star', 'quality starter', 'rotation player', 'end-of-bench / two-way player', 'G League player'][tierOf(v)], an = (w: string) => (/^[AEIOU]/i.test(w) ? 'an ' : 'a ') + w;
  const projection = rd.kind === 'prospect' ? (board ? (board <= 5 ? 'Top-5 pick' : board <= 14 ? 'Lottery pick' : board <= 30 ? 'First-round pick' : board <= 60 ? 'Second-round pick' : 'Undrafted free agent') : 'Unranked') + (yo ? ' in ' + p.cls + ' (' + yo + ' year' + (yo > 1 ? 's' : '') + ' away)' : ' this June')
    : rd.kind === 'overseas' ? (o.ovr >= TIER[3] ? 'Ready to contribute in the NBA now' : o.pot >= TIER[2] ? 'NBA prospect: one or two more seasons abroad' : 'Long shot for the NBA')
    : 'Currently ' + an(ceilOf(o.ovr));
  const ceiling = 'Ceiling: ' + ceilOf(o.pot) + (o.pot - o.ovr >= 8 ? '; plenty of room to grow' : o.pot - o.ovr <= 1 && p.age >= 28 ? '; what you see is what you get' : '');
  // Strengths and weaknesses from the observed profile (relative to his position).
  const posAdj: Record<string, number> = grp === 'G' ? { hgt: 14, reb: 10, ins: 8, stre: 6, drb: -6, pss: -6 } : grp === 'B' ? { spd: 8, drb: 10, pss: 6, tp: 6, hgt: -10, reb: -8, ins: -8 } : {};
  // Size is judged from his real height and wingspan for his position (not the height rating),
  // and it's never something he can "develop"; skills are ranked relative to his position.
  const keys = Object.keys(R).filter(k => GOOD[k] && k !== 'hgt').sort((a, b) => R[b] + (posAdj[b] || 0) - (R[a] + (posAdj[a] || 0)));
  const weakK = keys.slice(-4).reverse().filter(k => R[k] + (posAdj[k] || 0) < 62);
  const strengths = keys.slice(0, 4).filter(k => R[k] + (posAdj[k] || 0) >= 55).map(k => pick(GOOD[k]));
  const weaknesses = weakK.map(k => pick(BAD[k]));
  if (sizeG >= 7.5) strengths.unshift(GOOD.hgt[wing0 - hIn0 >= 6 ? 1 : 0]);
  if (sizeG <= 3.5) weaknesses.push(wing0 - hIn0 <= 1 ? BAD.hgt[1] : BAD.hgt[0]);
  if (!strengths.length) strengths.push('No standout skill yet; a jack of all trades who needs one thing to hang his hat on.');
  if (!weaknesses.length) weaknesses.push('Few holes in his game. Consistency night to night is the main thing to watch.');
  const roles = g.rolesOf(p, o.pot).slice(0, 2).map((x: string) => x.toLowerCase());
  const build = sizeG >= 7.5 ? 'big for his position' : sizeG <= 3.5 ? 'undersized' : 'solid size for his position';
  const ath = (R.spd + R.jmp) / 2 >= 68 ? 'a plus athlete' : (R.spd + R.jmp) / 2 <= 45 ? 'a below-average athlete' : 'an average athlete';
  const where = rd.kind === 'prospect' ? (p.from?.lg === 'NCAA' ? 'at ' + p.from.team : p.from?.lg === 'High school' ? 'in high school at ' + p.from.team : 'with ' + p.from?.team + ' in ' + (C[p.from?.country]?.n || 'his home country')) : rd.kind === 'overseas' ? 'for ' + p.abroad?.club + ' in ' + (C[p.abroad?.country]?.n || 'Europe') : 'in the NBA';
  const overview = p.name + ' is a ' + p.age + '-year-old ' + p.pos + ' from ' + (p.city ? p.city + ', ' : '') + (C[p.born]?.n || '') + ' playing ' + where + '. ' + p.hgt + ', ' + p.wt + ' lb with a ' + Math.floor(wing / 12) + '′' + (wing % 12) + '″ wingspan: ' + build + ' and ' + ath + '. ' +
    (roles.length ? 'Profiles as a ' + roles.join(' and ') + '. ' : '') + (rd.kind === 'prospect' || rd.kind === 'overseas' ? (o.pot - o.ovr >= 12 ? 'Raw, but the tools are there and the ceiling is high.' : o.pot - o.ovr >= 6 ? 'Still developing, with a clear path to an NBA role.' : 'Fairly polished; less projection left in his game.') : o.ovr >= TIER[1] ? 'One of the better players in the league at his position.' : o.ovr >= TIER[2] ? 'A starting-caliber player.' : o.ovr >= TIER[3] ? 'A reliable rotation piece.' : 'Fighting for minutes at this level.');
  // Outlook: where he fits and what it would take.
  // The take: what he does well, what he can become, what has to develop, and where he stands
  // (written like a draft analyst's paragraph).
  const NOUN: Record<string, string> = { tp: 'shooting', fg: 'mid-range game', ft: 'free-throw shooting', drb: 'ball handling', pss: 'playmaking', oiq: 'feel for the game', diq: 'defense', ins: 'post game', dnk: 'finishing', lay: 'touch around the rim', reb: 'rebounding', box: 'rebounding', stre: 'strength', spd: 'speed', acc: 'first step', jmp: 'explosiveness', endu: 'conditioning' };
  const CAT: Record<string, string> = { spd: 'the physical tools', acc: 'the physical tools', jmp: 'the physical tools', stre: 'the physical tools', endu: 'a relentless motor', tp: 'shooting touch', fg: 'shot-making', ft: 'shooting touch', ins: 'scoring punch', dnk: 'scoring punch', lay: 'scoring punch', diq: 'defensive impact', reb: 'rebounding instincts', box: 'rebounding instincts', pss: 'court vision', drb: 'shot creation', oiq: 'basketball IQ' };
  const topK = keys.slice(0, 4).filter(k => R[k] + (posAdj[k] || 0) >= 55), cats = [...new Set([...(sizeG >= 7.5 ? ['the size'] : []), ...topK.map(k => CAT[k])])].slice(0, 3);
  const list = (xs: string[]) => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  const twoWay = topK.includes('diq') && topK.some(k => ['tp', 'fg', 'ins', 'dnk', 'lay', 'pss', 'drb'].includes(k));
  const posWord = p.pos === 'PG' ? 'point guard' : p.pos === 'C' ? 'center' : grp === 'G' ? 'guard' : grp === 'B' ? 'big' : 'wing';
  // Several ways to say each part, picked per player so reports don't all read alike.
  const tk = pickOf(pid * 7919 + g.Y * 13 + 5), tier = tierOf;
  const lvl = (v: number) => tk([['a franchise-level', 'a cornerstone', 'a face-of-the-franchise'], ['a high-level', 'an All-Star-caliber', 'a top-tier'], ['a quality starting', 'a legitimate starting', 'a starting-caliber'], ['a solid rotation', 'a dependable rotation', 'a useful rotation'], ['a backup', 'an end-of-bench', 'a reserve'], ['a fringe', 'a fringe roster', 'a roster-bubble']][tier(v)]);
  const upside = tk([['franchise-player upside', 'the ceiling of a franchise player', 'No. 1 option upside'], ['legitimate star upside', 'All-Star upside', 'star potential'], ['real starter upside', 'the upside of a long-time starter', 'starting-caliber upside'], ['rotation-player upside', 'the upside of a solid rotation piece', 'a path to real rotation minutes'], ['a shot at sticking in the league', 'an outside shot at an NBA roster spot', 'a chance to stick in the league']][Math.min(4, tier(o.pot))]);
  const devG = new Set<string>(), devN = weakK.filter(k => { const c = CAT[k]; if (cats.includes(c) || devG.has(c)) return false; devG.add(c); return true; }).map(k => NOUN[k]).slice(0, 2), lastN = p.last || (p.familyFirst ? String(p.name).split(' ')[0] : String(p.name).split(' ').slice(-1)[0]);
  const yr = p.cls || g.Y, stand = rd.kind !== 'prospect' ? '' : tk(!board || board > 60 ? ['a long shot to hear his name called in ' + yr, 'a long shot to be drafted in ' + yr, 'likely to go undrafted in ' + yr]
    : board <= 3 ? ['one of the elite prospects in the ' + yr + ' NBA Draft', 'a top-three talent in the ' + yr + ' class', 'in the conversation for the No. 1 pick in ' + yr]
    : board <= 10 ? ['a top-10 talent in the ' + yr + ' class', 'a likely top-10 pick in ' + yr, 'firmly in the top 10 of the ' + yr + ' class']
    : board <= 20 ? ['a lottery-caliber prospect in the ' + yr + ' class', 'a likely lottery pick in ' + yr, 'squarely in the ' + yr + ' lottery mix']
    : board <= 30 ? ['a first-round prospect in ' + yr, 'a likely first-rounder in ' + yr, 'on track to go in the first round in ' + yr]
    : ['a second-round prospect in ' + yr, 'a likely second-rounder in ' + yr, 'on the second-round radar in ' + yr]);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1), one = devN.length === 1, vb = (a: string, b: string) => one ? a : b;
  const poss = lastN + (/s$/i.test(lastN) ? '’' : '’s'), S = list(cats), D = list(devN), role = lvl(o.pot) + ' ' + (twoWay && o.pot >= TIER[3] ? 'two-way ' : '') + 'NBA ' + posWord;
  const opener = cats.length ? tk([
    () => lastN + ' has ' + S + ' to become ' + role + '. ',
    () => 'With ' + S + ', ' + lastN + ' has a clear path to becoming ' + role + '. ',
    () => poss + ' calling card' + (cats.length === 1 ? ' is ' : 's are ') + S + ', the kind of foundation that projects to ' + role + '. ',
    () => 'The appeal starts with ' + S + '; ' + lastN + ' profiles as ' + role + ' down the line. ',
    () => lastN + ' brings ' + S + ' to the table, and the target is ' + role + '. ',
  ])() : tk([
    () => lastN + ' is a work in progress without a standout skill yet; the path is becoming ' + role + '. ',
    () => 'Nothing in ' + poss + ' game jumps off the page yet, but the target is ' + role + '. ',
  ])();
  const grows = o.pot - o.ovr >= 6 && devN.length > 0;
  const devLine = (withStand: boolean) => tk(withStand ? [
    () => 'If his ' + D + ' continue' + vb('s', '') + ' to develop, he has ' + upside + ' and is ' + stand + '.',
    () => 'The swing skill' + vb(' is his ', 's are his ') + D + ': if ' + vb('it comes', 'they come') + ' along, he has ' + upside + '. For now he is ' + stand + '.',
    () => 'How far he goes depends on his ' + D + '; get there and he has ' + upside + '. He is ' + stand + '.',
    () => cap(stand) + ', he has ' + upside + ' if his ' + D + ' catch' + vb('es', '') + ' up.',
    () => 'The work is in his ' + D + '. Should that click, there is ' + upside + ' here, and he is ' + stand + '.',
  ] : [
    () => 'If his ' + D + ' continue' + vb('s', '') + ' to develop, he has ' + upside + '.',
    () => 'How far he goes depends on his ' + D + '; get there and he has ' + upside + '.',
    () => 'The swing skill' + vb(' is his ', 's are his ') + D + ': if ' + vb('it comes', 'they come') + ' along, he has ' + upside + '.',
    () => 'With work on his ' + D + ', there is ' + upside + ' here.',
  ])();
  const outlook = rd.kind === 'prospect'
    ? opener + (grows ? devLine(true) : tk([
      'His game is largely formed: what you see is close to what you get, and he is ' + stand + '.',
      'There isn’t much projection left, so teams are buying the player he is now: ' + stand + '.',
      'A finished product more than a project, he is ' + stand + '.',
      'Don’t expect big jumps from here. He is ' + stand + '.']))
    : rd.kind === 'overseas'
      ? opener + tk(o.ovr >= TIER[3] ? ['He could step into an NBA rotation today.', 'He is ready to help an NBA rotation now.'] : ['He would start on a two-way or at the end of a bench if he came over.', 'Coming over now, he would be fighting for a two-way deal.', 'He would need time on a two-way or in the G League to adjust.']) + (grows ? ' ' + devLine(false) : '')
      : (cats.length ? tk([
          () => lastN + ' brings ' + S + ' as ' + an(ceilOf(o.ovr)) + '. ',
          () => cap(an(ceilOf(o.ovr))) + ' right now, ' + lastN + ' leans on ' + S + '. ',
          () => lastN + ' earns his minutes with ' + S + '; today he is ' + an(ceilOf(o.ovr)) + '. ',
        ])() : lastN + ' is ' + an(ceilOf(o.ovr)) + '. ')
        + (grows ? devLine(false) : p.age >= 28 ? tk(['At ' + p.age + ', what you see is what you get.', 'At ' + p.age + ', he is who he is.', 'At ' + p.age + ', don’t expect much more growth.']) : tk(['Close to the player he will be.', 'Not much projection left.', 'His development has mostly leveled off.']));
  const statRows = [...new Set((p.stats || []).filter((x: any) => !x.po).map((x: any) => x.season))].sort((a: any, b: any) => b - a).slice(0, 4).map((y: any) => { const t = g.seasonTotals(p, y); if (!t || !t.gp) return null; const q = (v: number) => (v / t.gp).toFixed(1); return { season: (y - 1) + '–' + String(y).slice(2), gp: t.gp, min: q(t.min), pts: q(t.pts), reb: q(t.orb + t.drb), ast: q(t.ast), stl: q(t.stl), blk: q(t.blk), fg: t.fga ? (t.fgm / t.fga * 100).toFixed(1) : '—', tp: t.tpa ? (t.tpm / t.tpa * 100).toFixed(1) : '—', ft: t.fta ? (t.ftm / t.fta * 100).toFixed(1) : '—', per: g.perOf(t, y).toFixed(1) }; }).filter(Boolean);
  // Notes.
  const notes: string[] = [];
  const persKnown = rd.margin <= 5;
  if (persKnown) { const tr = [p.pers?.pro && 'consummate professional', p.pers?.alpha && 'wants to be the guy', p.pers?.volatile && 'can be volatile', p.pers?.clutch && 'wants the ball late', p.pers?.padder && 'has been accused of chasing stats', (p.pers?.work ?? 50) >= 70 && 'gym rat', (p.pers?.work ?? 50) <= 30 && 'work ethic questioned'].filter(Boolean); notes.push('Character: ' + (tr.length ? tr.join(', ') : 'even-keeled, no red flags') + '. Motivated by ' + String(p.pers?.mot || 'winning').toLowerCase() + '.'); }
  else notes.push('Character: our scouts haven’t spent enough time around him to say.');
  notes.push('Intangibles: ' + feelWord(intRead.feel).toLowerCase() + ' feel for the game (' + intRead.feel + '), ' + feelWord(intRead.poise).toLowerCase() + ' poise (' + intRead.poise + ')' + (im ? ', a rough read.' : '.'));
  // A sharp scout who knows him well sometimes senses a hidden gem before his numbers show it.
  if (p.gem && p.gem.left > 2 && (rd.kind === 'mine' || rd.margin <= 3) && mulberry32(p.id * 17 + g.Y)() < (rd.kind === 'mine' ? 0.7 : 0.4)) notes.push('Gut feeling: ' + (rd.kind === 'mine' ? 'the staff' : 'our scout') + ' thinks he\u2019s better than his numbers say. Players like him tend to outgrow their projections.');
  const inj = p.injHist || []; if (inj.length) notes.push('Medical: ' + inj.slice(-3).map((x: any) => x.name + ' (' + x.season + ')').join(', ') + (p.pers?.prone && persKnown ? '. Durability is a concern.' : '.')); else notes.push('Medical: no significant injury history.');
  if (p.gp) notes.push('This season: ' + p.gp + ' games, ' + (p.min || 0).toFixed(1) + ' min, ' + (p.pts || 0).toFixed(1) + ' pts, ' + (p.reb || 0).toFixed(1) + ' reb, ' + (p.ast || 0).toFixed(1) + ' ast, ' + (p.per || 0).toFixed(1) + ' PER.');
  if (p.abroad) notes.push('Abroad: ' + p.abroad.pts + ' pts · ' + p.abroad.reb + ' reb · ' + p.abroad.ast + ' ast. Contract: ' + p.abroad.clause + (p.abroad.fee ? ' (' + p.abroad.fee.toFixed(2) + 'M)' : '') + '.');
  if (rd.kind === 'league' || rd.kind === 'fa') notes.push(rd.kind === 'fa' ? 'Free agent, asking about ' + (p.ask || 0).toFixed(2) + 'M a year.' : 'Contract: ' + p.amt.toFixed(2) + 'M through ' + p.exp + '.');
  if (rd.margin >= 6) notes.push('Our read is rough: assign a scout to his region, add him to the scouting list and give it a few months.');
  return { pid, kind: rd.kind, kindLabel: { prospect: 'Draft prospect', overseas: 'Overseas', mine: 'Your team', league: 'NBA', fa: 'Free agent' }[rd.kind], scout: rd.scout, confidence: rd.confidence, margin: rd.margin,
    filed: g.fmtS(s.day) + ', ' + g.seasonLbl(), measure, grades, overall, seen: { ovr: o.ovr, pot: o.pot }, projection, ceiling, comp: comp ? { id: comp.id, name: comp.name } : null,
    compNote: comp ? (o.pot >= Math.max(comp.pot, comp.ovr) + 8 ? 'with more upside' : o.pot <= comp.ovr - 5 ? 'a lesser version' : '') : '', overview, strengths, weaknesses, notes,
    best: bestC ? { id: bestC.id, name: bestC.name } : null, worst: worstC ? { id: worstC.id, name: worstC.name } : null, outlook, outlookTitle: 'The bottom line', statRows };
}

// Everyone the club has a file on: the scouting list, focused prospects, prospects and
// overseas players with intel, and the club's own roster.
export function scoutedIds(g: Game, s: any) {
  const set = new Set<number>([...(s.scoutList || []), ...(s.scoutFocus || []), ...(s.rosters[s.me] || [])]);
  Object.entries(s.intel || {}).forEach(([id, v]: any) => { if (v > 0 && g.db.P[+id] && !g.db.P[+id].retired) set.add(+id); });
  return [...set].filter(id => g.db.P[id] && !g.db.P[id].retired);
}

// Which of a player's badges you know. God Mode, your own players and established NBA players
// (you've seen them play): all of them. Everyone else depends on your scouts' read: a sharp read
// shows them all, a fair one his top two, a rough one his best, and a stranger shows none.
export function knownBadges(g: Game, s: any, p: any): { list: Badge[]; partial: boolean } {
  const all = badgesOf(p);
  if (s.god) return { list: all, partial: false };
  const kind = kindOf(g, s, p);
  if (kind === 'mine' || ((kind === 'league' || kind === 'fa') && ((p.stats || []).some((r: any) => !r.po) || yosOf(g, p) >= 1))) return { list: all, partial: false };
  const m = scoutRead(g, s, p).margin, n = m <= 2.5 ? all.length : m <= 5 ? 2 : m <= 9 ? 1 : 0;
  return { list: all.slice(0, n), partial: n < 99 && m > 2.5 };
}

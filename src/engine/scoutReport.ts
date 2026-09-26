// Scouting reports for any player: draft prospects, players abroad, your own roster and
// everyone else in the league. What the scouts see is the truth plus noise: the margin
// shrinks with scout skill, specialty, the scouting budget and time spent watching (intel),
// and your own players are seen every day. Text is written from the observed ratings.
import type { Game } from './Game';
import { regions } from '../data/world';
import { intelF } from './overseas';
import { mulberry32 } from './rng';

export type ReportKind = 'prospect' | 'overseas' | 'mine' | 'league' | 'fa';
export interface Report {
  pid: number; kind: ReportKind; kindLabel: string; scout: string; confidence: string; margin: number; filed: string;
  measure: [string, string][]; grades: [string, number, number, number | null, string][]; overall: number; projection: string; ceiling: string; comp: { id: number; name: string } | null; compNote: string; best: { id: number; name: string } | null; worst: { id: number; name: string } | null; outlook: string; statRows: any[];
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
  const eye: [string, number][] = [
    ['Athleticism', g10((R.spd + R.jmp + R.endu) / 3 + 4)], ['Size', sizeG], ['Defense', g10(R.diq * 0.6 + (grp === 'B' ? R.hgt : R.spd) * 0.4)], ['Strength', g10(R.stre)],
    ['Quickness', g10((R.spd + (R.acc ?? R.spd)) / 2)], ['Leadership', g10(R.oiq * 0.6 + (p.age - 18) * 2 + (p.pers?.alpha ? 8 : 0) + (p.pers?.pro ? 8 : 0))], ['Jump shot', g10((R.tp + R.fg) / 2 + 3)], ['NBA ready', g10(o.ovr + 12)],
    ['Ball handling', g10(R.drb + (grp === 'B' ? 6 : 0))], ['Potential', g10(o.pot + 6)], ['Passing', g10(R.pss + (grp === 'B' ? 6 : 0))], ['Intangibles', g10(55 + (p.pers?.pro ? 12 : 0) + (p.pers?.clutch ? 10 : 0) - (p.pers?.volatile ? 14 : 0) + ((p.pers?.work ?? 50) - 50) / 3)],
  ];
  const grades: [string, number, number, number | null, string][] = eye.map(([k, e]) => { const st = statG[k] ?? null, v = st == null ? e : Math.round((e * (1 - w) + st * w) * 2) / 2; return [k, v, e, st == null ? null : Math.round(st * 2) / 2, st == null ? 'Scouts’ eye' : 'Eye ' + e + ' · production ' + (Math.round(st * 2) / 2) + ' (' + gp + ' games)']; });
  const overall = Math.round(cl(o.pot * 0.55 + o.ovr * 0.45 + 18, 40, 99));
  // Measurements.
  const hIn = (() => { const m = String(p.hgt || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; })(), wing = p.wing ?? hIn + 3 + (p.id % 4);
  const team = (() => { for (const k of Object.keys(s.rosters)) if (s.rosters[k].includes(pid)) return s.teams[+k].region + ' ' + s.teams[+k].name; return p.abroad ? p.abroad.club + ' (' + p.abroad.lg + ')' : p.cls ? p.from.team + ' (' + p.from.lg + ')' : 'Free agent'; })();
  const measure: [string, string][] = [['Position', p.pos], ['Age', String(p.age)], ['Height', p.hgt], ['Weight', p.wt + ' lb'], ['Wingspan', Math.floor(wing / 12) + '′' + (wing % 12) + '″ (' + (wing - hIn >= 0 ? '+' : '') + (wing - hIn) + ')'], ['Hand', p.id % 9 === 0 ? 'Left' : 'Right'], ['Team', team], ['Hometown', (p.city ? p.city + ', ' : '') + (C[p.born]?.n || '')], ['Represents', C[p.rep]?.n || '']];
  // Comparisons: active players whose rating profile is closest (shape), at his current level,
  // at his ceiling (best case) and below it (worst case).
  const near = (level: number, skip: number[] = []) => { let c: any = null, b = 1e9; Object.values(s.rosters).flat().forEach((id: any) => { if (id === pid || skip.includes(id)) return; const q = P[id]; let d = q.grp === grp ? 0 : 400; Object.keys(q.r).forEach(k => (d += Math.pow(q.r[k] - q.ovr - (R[k] - o.ovr), 2))); d += Math.pow(q.ovr - level, 2) * 3; if (d < b) { b = d; c = q; } }); return c; };
  const comp: any = near(Math.max(o.ovr, o.pot - 4)), bestC: any = o.pot - o.ovr >= 3 ? near(o.pot + 2, comp ? [comp.id] : []) : null, worstC: any = near(Math.max(40, (rd.kind === 'prospect' || rd.kind === 'overseas' ? o.ovr + 2 : o.ovr - 5)), [comp?.id, bestC?.id].filter(x => x != null));
  // Projection.
  const board = g.db.rank?.[pid], yo = Math.max(0, (p.cls || g.Y) - g.Y);
  const ceilOf = (v: number) => (v >= 80 ? 'franchise player' : v >= 72 ? 'All-Star' : v >= 64 ? 'quality starter' : v >= 57 ? 'rotation player' : v >= 50 ? 'end-of-bench / two-way player' : 'G League player'), an = (w: string) => (/^[AEIOU]/i.test(w) ? 'an ' : 'a ') + w;
  const projection = rd.kind === 'prospect' ? (board ? (board <= 5 ? 'Top-5 pick' : board <= 14 ? 'Lottery pick' : board <= 30 ? 'First-round pick' : board <= 60 ? 'Second-round pick' : 'Undrafted free agent') : 'Unranked') + (yo ? ' in ' + p.cls + ' (' + yo + ' year' + (yo > 1 ? 's' : '') + ' away)' : ' this June')
    : rd.kind === 'overseas' ? (o.ovr >= 55 ? 'Ready to contribute in the NBA now' : o.pot >= 60 ? 'NBA prospect: one or two more seasons abroad' : 'Long shot for the NBA')
    : 'Currently ' + an(ceilOf(o.ovr));
  const ceiling = 'Ceiling: ' + ceilOf(o.pot) + (o.pot - o.ovr >= 8 ? '; plenty of room to grow' : o.pot - o.ovr <= 1 && p.age >= 28 ? '; what you see is what you get' : '');
  // Strengths and weaknesses from the observed profile (relative to his position).
  const posAdj: Record<string, number> = grp === 'G' ? { hgt: 14, reb: 10, ins: 8, stre: 6, drb: -6, pss: -6 } : grp === 'B' ? { spd: 8, drb: 10, pss: 6, tp: 6, hgt: -10, reb: -8, ins: -8 } : {};
  const keys = Object.keys(R).filter(k => GOOD[k]).sort((a, b) => R[b] + (posAdj[b] || 0) - (R[a] + (posAdj[a] || 0)));
  const strengths = keys.slice(0, 4).filter(k => R[k] + (posAdj[k] || 0) >= 55).map(k => pick(GOOD[k]));
  const weaknesses = keys.slice(-4).reverse().filter(k => R[k] + (posAdj[k] || 0) < 62).map(k => pick(BAD[k]));
  if (!strengths.length) strengths.push('No standout skill yet; a jack of all trades who needs one thing to hang his hat on.');
  if (!weaknesses.length) weaknesses.push('Few holes in his game. Consistency night to night is the main thing to watch.');
  const roles = g.rolesOf(p, true).slice(0, 2).map((x: string) => x.toLowerCase());
  const build = sizeG >= 7.5 ? 'big for his position' : sizeG <= 3.5 ? 'undersized' : 'solid size for his position';
  const ath = (R.spd + R.jmp) / 2 >= 68 ? 'a plus athlete' : (R.spd + R.jmp) / 2 <= 45 ? 'a below-average athlete' : 'an average athlete';
  const where = rd.kind === 'prospect' ? (p.from?.lg === 'NCAA' ? 'at ' + p.from.team : p.from?.lg === 'High school' ? 'in high school at ' + p.from.team : 'with ' + p.from?.team + ' in ' + (C[p.from?.country]?.n || 'his home country')) : rd.kind === 'overseas' ? 'for ' + p.abroad?.club + ' in ' + (C[p.abroad?.country]?.n || 'Europe') : 'in the NBA';
  const overview = p.name + ' is a ' + p.age + '-year-old ' + p.pos + ' from ' + (p.city ? p.city + ', ' : '') + (C[p.born]?.n || '') + ' playing ' + where + '. ' + p.hgt + ', ' + p.wt + ' lb with a ' + Math.floor(wing / 12) + '′' + (wing % 12) + '″ wingspan: ' + build + ' and ' + ath + '. ' +
    (roles.length ? 'Profiles as a ' + roles.join(' and ') + '. ' : '') + (rd.kind === 'prospect' || rd.kind === 'overseas' ? (o.pot - o.ovr >= 12 ? 'Raw, but the tools are there and the ceiling is high.' : o.pot - o.ovr >= 6 ? 'Still developing, with a clear path to an NBA role.' : 'Fairly polished; less projection left in his game.') : o.ovr >= 70 ? 'One of the better players in the league at his position.' : o.ovr >= 60 ? 'A reliable rotation piece.' : 'Fighting for minutes at this level.');
  // Outlook: where he fits and what it would take.
  const topW = weaknesses[0] ? weaknesses[0].replace(/\.$/, '').toLowerCase() : '';
  const outlook = (rd.kind === 'prospect' ? 'Projects as ' + an(ceilOf(Math.round((o.ovr + o.pot) / 2) + 3)) + ' early in his career. ' : rd.kind === 'overseas' ? 'Would ' + (o.ovr >= 55 ? 'step into an NBA rotation' : 'start on a two-way or at the end of a bench') + ' if he came over. ' : '') +
    (o.pot - o.ovr >= 6 ? 'Hitting his ceiling as ' + an(ceilOf(o.pot)) + ' depends on development' + (topW ? ': above all, ' + topW + '.' : '.') : 'His game is largely formed; the value is in what he does now' + (strengths[0] ? ': ' + strengths[0].replace(/\.$/, '').toLowerCase() + '.' : '.'));
  const statRows = [...new Set((p.stats || []).filter((x: any) => !x.po).map((x: any) => x.season))].sort((a: any, b: any) => b - a).slice(0, 4).map((y: any) => { const t = g.seasonTotals(p, y); if (!t || !t.gp) return null; const q = (v: number) => (v / t.gp).toFixed(1); return { season: (y - 1) + '–' + String(y).slice(2), gp: t.gp, min: q(t.min), pts: q(t.pts), reb: q(t.orb + t.drb), ast: q(t.ast), stl: q(t.stl), blk: q(t.blk), fg: t.fga ? (t.fgm / t.fga * 100).toFixed(1) : '—', tp: t.tpa ? (t.tpm / t.tpa * 100).toFixed(1) : '—', ft: t.fta ? (t.ftm / t.fta * 100).toFixed(1) : '—', per: g.perOf(t, y).toFixed(1) }; }).filter(Boolean);
  // Notes.
  const notes: string[] = [];
  const persKnown = rd.margin <= 5;
  if (persKnown) { const tr = [p.pers?.pro && 'consummate professional', p.pers?.alpha && 'wants to be the guy', p.pers?.volatile && 'can be volatile', p.pers?.clutch && 'wants the ball late', p.pers?.padder && 'has been accused of chasing stats', (p.pers?.work ?? 50) >= 70 && 'gym rat', (p.pers?.work ?? 50) <= 30 && 'work ethic questioned'].filter(Boolean); notes.push('Character: ' + (tr.length ? tr.join(', ') : 'even-keeled, no red flags') + '. Motivated by ' + String(p.pers?.mot || 'winning').toLowerCase() + '.'); }
  else notes.push('Character: our scouts haven’t spent enough time around him to say.');
  const inj = p.injHist || []; if (inj.length) notes.push('Medical: ' + inj.slice(-3).map((x: any) => x.name + ' (' + x.season + ')').join(', ') + (p.pers?.prone && persKnown ? '. Durability is a concern.' : '.')); else notes.push('Medical: no significant injury history.');
  if (p.gp) notes.push('This season: ' + p.gp + ' games, ' + (p.min || 0).toFixed(1) + ' min, ' + (p.pts || 0).toFixed(1) + ' pts, ' + (p.reb || 0).toFixed(1) + ' reb, ' + (p.ast || 0).toFixed(1) + ' ast, ' + (p.per || 0).toFixed(1) + ' PER.');
  if (p.abroad) notes.push('Abroad: ' + p.abroad.pts + ' pts · ' + p.abroad.reb + ' reb · ' + p.abroad.ast + ' ast. Contract: ' + p.abroad.clause + (p.abroad.fee ? ' (' + p.abroad.fee.toFixed(2) + 'M)' : '') + '.');
  if (rd.kind === 'league' || rd.kind === 'fa') notes.push(rd.kind === 'fa' ? 'Free agent, asking about ' + (p.ask || 0).toFixed(2) + 'M a year.' : 'Contract: ' + p.amt.toFixed(2) + 'M through ' + p.exp + '.');
  if (rd.margin >= 6) notes.push('Our read is rough: assign a scout to his region, add him to the scouting list and give it a few months.');
  return { pid, kind: rd.kind, kindLabel: { prospect: 'Draft prospect', overseas: 'Overseas', mine: 'Your team', league: 'NBA', fa: 'Free agent' }[rd.kind], scout: rd.scout, confidence: rd.confidence, margin: rd.margin,
    filed: g.fmtS(s.day) + ', ' + g.seasonLbl(), measure, grades, overall, projection, ceiling, comp: comp ? { id: comp.id, name: comp.name } : null,
    compNote: comp ? (o.pot >= comp.ovr + 4 ? 'with more upside' : o.pot <= comp.ovr - 6 ? 'a lesser version' : 'a similar player') : '', overview, strengths, weaknesses, notes,
    best: bestC ? { id: bestC.id, name: bestC.name } : null, worst: worstC ? { id: worstC.id, name: worstC.name } : null, outlook, statRows };
}

// Everyone the club has a file on: the scouting list, focused prospects, prospects and
// overseas players with intel, and the club's own roster.
export function scoutedIds(g: Game, s: any) {
  const set = new Set<number>([...(s.scoutList || []), ...(s.scoutFocus || []), ...(s.rosters[s.me] || [])]);
  Object.entries(s.intel || {}).forEach(([id, v]: any) => { if (v > 0 && g.db.P[+id] && !g.db.P[+id].retired) set.add(+id); });
  return [...set].filter(id => g.db.P[id] && !g.db.P[id].retired);
}

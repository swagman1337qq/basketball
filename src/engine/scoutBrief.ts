// Scouting briefs: tell a scout what to look for and he finds players himself. Every month he
// fills his personal slots (PERSONAL_MAX, minus players you assigned him by hand) with the players
// who best fit the brief, judged by HIS read: a better scout, more intel on the player, or a pro
// with a track record all make the read closer to the truth, so a poor scout can chase the wrong
// players. Intangibles are twice as hard to read as skills.
import type { Game } from './Game';
import { PERSONAL_MAX, intelF } from './overseas';
import { mulberry32 } from './rng';
import { ensureIntg } from './intangibles';

export interface Brief { on: boolean; focus: string; pool: string; pos: string; age: string }
export const DEFAULT_BRIEF: Brief = { on: false, focus: 'best', pool: 'draft', pos: 'any', age: 'any' };

export const BRIEF_FOCUS: [string, string, string][] = [
  ['best', 'Best available', 'The best player overall (prospects on their ceiling, pros on today).'],
  ['upside', 'Upside', 'The biggest gap between today and his ceiling.'],
  ['ready', 'Ready now', 'Who can help today.'],
  ['shooter', 'Shooters', '3PT first, then mid-range and free throws.'],
  ['creator', 'Playmakers', 'Handle, passing and feel for the offense.'],
  ['slasher', 'Slashers', 'Speed, first step, dunks and layups.'],
  ['rim', 'Rim protectors', 'Height, length, timing and defensive IQ.'],
  ['wing3d', '3-and-D wings', 'Shoots threes and guards the perimeter.'],
  ['defender', 'Perimeter defenders', 'Defensive IQ, quickness and length.'],
  ['rebounder', 'Rebounders', 'Rebounding, boxing out and size.'],
  ['stretch', 'Stretch bigs', 'Bigs who shoot threes.'],
  ['athlete', 'Athletes', 'Speed, acceleration, leaping and stamina.'],
  ['size', 'Size and length', 'Height and wingspan for his position.'],
  ['intangibles', 'Intangibles (hidden gems)', 'Feel and poise the numbers miss: the Draymond Greens and Manu Ginóbilis. Hard to read.'],
];
export const BRIEF_POOL: [string, string][] = [['draft', 'Next draft class'], ['future', 'All three draft classes'], ['overseas', 'Overseas'], ['fa', 'Free agents'], ['league', 'Other NBA teams'], ['any', 'Everywhere']];
export const BRIEF_POS: [string, string][] = [['any', 'Any position'], ['G', 'Guards'], ['W', 'Wings'], ['B', 'Bigs']];
export const BRIEF_AGE: [string, string][] = [['any', 'Any age'], ['20', '20 and under'], ['22', '22 and under'], ['25', '25 and under'], ['29', '29 and under']];

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (t: string) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); };
const LB: Record<string, string> = { tp: '3PT', fg: 'Mid', ft: 'FT', drb: 'Drb', pss: 'Pss', oiq: 'OIQ', diq: 'DIQ', blk: 'Blk', stl: 'Stl', spd: 'Spd', acc: 'Acc', jmp: 'Jmp', endu: 'End', dnk: 'Dnk', lay: 'Lay', hgt: 'Hgt', reb: 'Reb', box: 'Box', ins: 'Ins', wing: 'Wingspan', feel: 'Feel', poise: 'Poise' };

function poolOf(g: Game, s: any, c: any, pool: string): number[] {
  const Y = g.Y, cls = (ys: number[]) => ys.flatMap(y => g.db.cls[y] || []);
  const mine = new Set((s.managed || []).flatMap((t: number) => s.rosters[t] || []));
  const league = Object.keys(s.rosters).flatMap(t => s.rosters[t] as number[]).filter(id => !mine.has(id));
  const by: Record<string, () => number[]> = { draft: () => cls([Y]), future: () => cls([Y, Y + 1, Y + 2]), overseas: () => s.overseas || [], fa: () => s.fa || [], league: () => league };
  const ids = pool === 'any' ? [...by.future(), ...by.overseas(), ...by.fa(), ...league] : (by[pool] || by.draft)();
  return [...new Set(ids)].filter(id => { const p = g.db.P[id]; return p && !p.retired && !p.gone && !mine.has(id); });
}

// The scout's read of one player: every rating off by a steady amount (seeded per scout and
// player), shrinking with the scout's skill, your intel on him, and games he has played.
function readOf(g: Game, c: any, p: any, scout: any) {
  const r = mulberry32(p.id * 7919 + hash(scout.name)), prospect = !!p.cls && !p.stats?.length, games = (p.stats || []).reduce((a: number, x: any) => a + (x.gp || 0), 0);
  const m = (prospect ? 7 : cl(4 - games / 60, 1.2, 4)) * (1.4 - scout.skill * 0.18) / intelF(c, p.id); // ★1 reads about 2.4× as wide as ★5
  const it = ensureIntg(p), R: Record<string, number> = {};
  Object.keys(p.r).forEach(k => (R[k] = cl(p.r[k] + (r() * 2 - 1) * m * 1.3, 1, 99)));
  const hIn = (() => { const x = String(p.hgt || '').match(/(\d+)\D+(\d+)/); return x ? +x[1] * 12 + +x[2] : 78; })();
  R.wing = cl(50 + ((p.wing ?? hIn + 4) - hIn - 4) * 6, 1, 99);
  R.feel = cl(it.feel + (r() * 2 - 1) * m * 2.6, 1, 99); R.poise = cl(it.poise + (r() * 2 - 1) * m * 2.6, 1, 99);
  return { R, ovr: cl(p.ovr + (r() * 2 - 1) * m, 1, 100), pot: cl(p.pot + (r() * 2 - 1) * m * 1.4, 1, 100) };
}

// How well a player fits the brief (by the scout's read), and the ratings that made the case.
export function briefFit(g: Game, c: any, p: any, scout: any, focus: string): { score: number; why: string } {
  const { R, ovr, pot } = readOf(g, c, p, scout), young = p.age <= 22 ? Math.max(0, pot - ovr) * 0.25 : 0; // prospects: what he'll grow into, a little
  const v = (k: string) => (['hgt', 'wing', 'feel', 'poise'].includes(k) ? R[k] : R[k] + young);
  const W: Record<string, Record<string, number>> = {
    shooter: { tp: .6, fg: .2, ft: .2 }, creator: { drb: .35, pss: .4, oiq: .25 }, slasher: { spd: .25, acc: .25, dnk: .25, lay: .25 },
    rim: { blk: .35, hgt: .2, wing: .15, diq: .2, jmp: .1 }, wing3d: { tp: .45, diq: .35, spd: .2 }, defender: { diq: .5, wing: .15, spd: .2, acc: .15 },
    rebounder: { reb: .5, box: .3, hgt: .2 }, stretch: { tp: .6, hgt: .4 }, athlete: { spd: .25, acc: .25, jmp: .25, endu: .25 }, size: { hgt: .6, wing: .4 },
    intangibles: { feel: .6, poise: .4 },
  };
  let score: number, keys: string[];
  if (focus === 'upside') { score = pot - ovr + (p.age <= 21 ? 4 : 0); keys = []; }
  else if (focus === 'ready') { score = ovr; keys = []; }
  else if (focus === 'best' || !W[focus]) { score = p.age <= 23 ? pot * 0.7 + ovr * 0.3 : ovr; keys = []; }
  else { const w = W[focus]; score = Object.entries(w).reduce((a, [k, x]) => a + v(k) * x, 0); keys = Object.keys(w); }
  if (focus === 'wing3d' && p.grp !== 'W') score -= 6;
  if ((focus === 'rim' || focus === 'stretch') && p.grp !== 'B') score -= 12;
  if (focus === 'creator' && p.grp === 'B') score -= 4;
  const why = focus === 'upside' ? 'ceiling ~' + Math.round(pot) + ', now ~' + Math.round(ovr) : focus === 'ready' ? 'overall ~' + Math.round(ovr) : focus === 'best' ? (p.age <= 23 ? 'ceiling ~' + Math.round(pot) : 'overall ~' + Math.round(ovr))
    : keys.slice(0, 2).map(k => LB[k] + ' ~' + Math.round(R[k]) + (young >= 2 && v(k) !== R[k] ? ' → ~' + Math.round(v(k)) : '')).join(', ');
  return { score, why };
}

// Monthly (and whenever you change a brief): each scout with a brief refills his personal slots.
// Players you assigned by hand stay; his own earlier picks are replaced by today's best fits.
export function runBriefs(g: Game, s: any, c: any = s): { scoutAssign: Record<number, string>; briefPicks: Record<number, { by: string; why: string }> } {
  const asg: Record<number, string> = { ...(c.scoutAssign || {}) }, picks: Record<number, { by: string; why: string }> = { ...(c.briefPicks || {}) };
  (c.scouts || []).forEach((x: any) => {
    const b: Brief | undefined = x.brief;
    // Drop his earlier automatic picks (hand-assigned players stay).
    Object.keys(picks).forEach(k => { if (picks[+k].by === x.name) { if (asg[+k] === x.name) delete asg[+k]; delete picks[+k]; } });
    if (!b?.on) return;
    const manual = Object.values(asg).filter(n => n === x.name).length, room = Math.max(0, PERSONAL_MAX - manual);
    const maxAge = b.age === 'any' ? 99 : +b.age;
    const cands = poolOf(g, s, c, b.pool).filter(id => { const p = g.db.P[id]; return !asg[id] && (b.pos === 'any' || p.grp === b.pos) && p.age <= maxAge; });
    cands.map(id => ({ id, ...briefFit(g, c, g.db.P[id], x, b.focus) })).sort((a, z) => z.score - a.score).slice(0, room)
      .forEach(f => { asg[f.id] = x.name; picks[f.id] = { by: x.name, why: f.why }; });
  });
  return { scoutAssign: asg, briefPicks: picks };
}

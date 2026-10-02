// A player's development environment: what his team gives him to grow. It speeds or slows his growth
// toward his ceiling; it never raises the ceiling (potential.ts), and it's capped.
//  • Coaching and facilities: your budget, or for an AI team what its owner spends (a win-now
//    spender pays for the best staff and gym, a frugal owner doesn't).
//  • Playing time, for players 24 and under: real minutes help, the bench hurts, the CCP gives reps,
//    and a hard worker makes up most of what the bench costs.
//  • The locker room, and a veteran mentor or leaders for a young player.
// The factors add up with diminishing returns, to at most +25% or −25%, and they matter most for
// players with modest potential: a fringe player's career swings on where he lands, while a top
// prospect develops in a poor situation too.
// Where his growth goes in games: his role (roleReps): shots, drives, playmaking, defense and rebounds
// he's asked for get reps, and his growth leans that way (development.ts).
import type { Game } from './Game';
import { coachMult } from './development';
import { lockerRoom, mentorOf } from './lockerRoom';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// What each kind of owner spends (budget $M, as in Finances); each team varies a little around it.
const ARCH_BUD: Record<string, Record<string, number>> = {
  'Win-Now Spender': { Coaching: 30, Facilities: 22, Scouting: 6, Health: 16 },
  'Hype Focus': { Coaching: 20, Facilities: 26, Scouting: 4, Health: 11 },
  'Asset Hoarder': { Coaching: 26, Facilities: 16, Scouting: 9, Health: 12 },
  'Meddling Micromanager': { Coaching: 17, Facilities: 15, Scouting: 4, Health: 10 },
  'Frugal Profit-Seeker': { Coaching: 9, Facilities: 7, Scouting: 2, Health: 5 },
};
const LIMIT: Record<string, [number, number]> = { Coaching: [5, 40], Facilities: [3, 30], Scouting: [1, 12], Health: [3, 25] };
// A team's development budgets: yours from Finances, an AI team's from its owner.
export function teamBudget(g: Game, s: any, tid: number): Record<string, number> {
  const c = g.clubOf(s, tid); if (c?.budget) return c.budget;
  const b = ARCH_BUD[s.teams[tid]?.arch] || ARCH_BUD['Meddling Micromanager'], h = (x: number) => ((((tid + 1) * 2654435761) ^ (x * 40503)) >>> 0) % 1000 / 1000 - 0.5;
  const out: Record<string, number> = {}; Object.keys(LIMIT).forEach((k, i) => (out[k] = +cl(b[k] + h(i + 1) * (k === 'Scouting' ? 2 : k === 'Health' ? 5 : 8), LIMIT[k][0], LIMIT[k][1]).toFixed(1)));
  return out;
}
// Facilities' share: a modern gym and recovery center, at most +6% (−4% for a bare-bones one).
export const facEffect = (fac = 14) => { const f = cl((fac - 14) / 16, -0.7, 1); return f >= 0 ? 0.06 * Math.sqrt(f) : 0.06 * f; };
const fringe = (p: any) => cl(1.2 - ((p.tpot ?? p.pot ?? 50) - 50) / 40, 0.55, 1.3);

export interface Env { mult: number; parts: [string, number][]; fringe: number; total: number }
// His environment on team `tid` (−1: unsigned). mult multiplies his growth (see Game.devTick/startPreseason).
export function envOf(g: Game, s: any, p: any, tid: number, rosters = s.rosters): Env {
  const parts: [string, number][] = [], a = p.age, wk = p.pers?.work ?? 50;
  if (tid >= 0 && s.teams[tid]) {
    const b = teamBudget(g, s, tid);
    parts.push(['Coaching', coachMult(b.Coaching) - 1], ['Facilities', facEffect(b.Facilities)]);
    parts.push(['Locker room', ((lockerRoom(g, s, tid, rosters).score - 50) / 500) * 0.6]);
    if (a <= 24) { const m = mentorOf(g, s, tid, p.id, rosters); if (m.mentor != null) parts.push([m.paired ? 'Mentor' : 'Veteran leaders', m.paired ? 0.04 : 0.02]); }
  }
  if (a <= 24) {
    const mpg = p.min || 0; let x = p.dev ? 0.12 : mpg < 10 ? -0.25 : mpg < 20 ? -0.08 : mpg < 28 ? 0.04 : 0.08;
    if (x < 0) x *= 1 - cl((wk - 55) / 45, 0, 1) * 0.8; // a gym rat makes up most of it
    parts.push([p.dev ? 'CCP reps' : 'Playing time', x]);
  }
  const S = parts.reduce((t, [, v]) => t + v, 0), d = 0.25 * Math.tanh(S / 0.25), fr = fringe(p);
  return { mult: +cl(1 + d * fr, 0.75, 1.3).toFixed(3), parts, fringe: fr, total: S };
}

// The factor that matters most, in plain words (development reports): worst first when it's holding
// him back, best first when he's thriving. Null when nothing stands out.
export function envWhy(e: Env): string | null {
  const pct = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + '%';
  if (e.mult <= 0.92) { const [k, v] = e.parts.slice().sort((a, b) => a[1] - b[1])[0] || []; if (k == null || v >= 0) return null;
    return ({ 'Playing time': 'The bench is costing him growth (' + pct(v) + '); real minutes or the CCP would help', Coaching: 'A thin coaching staff is slowing him (' + pct(v) + ')', Facilities: 'Bare-bones facilities are slowing him (' + pct(v) + ')', 'Locker room': 'The locker room is dragging on him (' + pct(v) + ')' } as any)[k] || null; }
  if (e.mult >= 1.08) { const [k, v] = e.parts.slice().sort((a, b) => b[1] - a[1])[0] || []; if (k == null || v <= 0) return null;
    return ({ 'Playing time': 'Real minutes are speeding his growth (' + pct(v) + ')', 'CCP reps': 'CCP reps are speeding his growth (' + pct(v) + ')', Coaching: 'Thriving under a strong coaching staff (' + pct(v) + ')', Facilities: 'Top facilities are helping him grow (' + pct(v) + ')', 'Locker room': 'A great locker room is lifting him (' + pct(v) + ')', Mentor: 'His mentor is helping him grow (' + pct(v) + ')', 'Veteran leaders': 'Learning from the veterans (' + pct(v) + ')' } as any)[k] || null; }
  return null;
}
export const ROLE_NOUN: Record<string, string> = { shoot: 'shooter', finish: 'finisher', play: 'playmaker', def: 'defender', reb: 'rebounder' };
// The skill group his role leans on most (≥ min), or null.
export const roleLead = (r: Record<string, number> | null, min = 1.25) => { if (!r) return null; const [g, v] = Object.entries(r).sort((a, b) => b[1] - a[1])[0]; return v >= min ? g : null; };

// His role in games this season, as growth leanings by skill group (1 = neutral, 0.75–1.5): what he's
// asked to do gets the reps. Needs 10 games; counts more the more he plays. `t`: his season totals.
export function roleReps(t: any): Record<string, number> | null {
  if (!t || (t.gp || 0) < 10 || (t.min || 0) < 150) return null;
  const m36 = 36 / t.min, f = Math.min(1, t.min / t.gp / 24);
  const raw: Record<string, number> = {
    shoot: ((t.tpa || 0) + (t.ma || 0)) * m36 / 8, finish: ((t.ra || 0) + (t.fta || 0) * 0.4) * m36 / 7,
    play: ((t.ast || 0) * 1.4 + (t.tov || 0)) * m36 / 6, def: ((t.stl || 0) + (t.blk || 0)) * m36 / 2, reb: ((t.orb || 0) + (t.drb || 0)) * m36 / 7.5,
  };
  return Object.fromEntries(Object.entries(raw).map(([g, v]) => [g, +cl(1 + 0.35 * (cl(v, 0.3, 2.5) - 1) * f, 0.75, 1.5).toFixed(3)]));
}

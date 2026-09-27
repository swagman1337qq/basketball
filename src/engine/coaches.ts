// Assistant coaches: when you hand a player over to them, they pick his training focus and
// decide whether he plays in the CCP or stays with the team. They re-check
// both every month.
import type { Game } from './Game';
import { OVR_W } from './ratings';

const FOCUS: Record<string, string[]> = { Shooting: ['tp', 'fg', 'ft'], Finishing: ['ins', 'dnk', 'lay'], Playmaking: ['drb', 'pss', 'oiq'], Defense: ['diq', 'acc', 'stre'], Rebounding: ['reb', 'box', 'stre'], Athleticism: ['spd', 'acc', 'jmp', 'stre'] };
const NAME: Record<string, string> = { tp: '3PT', fg: 'Mid', ft: 'FT', ins: 'Ins', dnk: 'Dnk', lay: 'Lay', drb: 'Drb', pss: 'Pss', oiq: 'OIQ', diq: 'DIQ', acc: 'Acc', stre: 'Str', reb: 'Reb', box: 'Box', spd: 'Spd', jmp: 'Jmp' };
const GRP_NAME: Record<string, string> = { G: 'guard', W: 'wing', B: 'big' };

export const isCoached = (s: any, id: number) => !!(s.coachAuto || {})[id];

// The focus that closes his most costly gaps for his position. Veterans work on conditioning to
// hold off decline.
export function coachFocus(p: any): { focus: string; why: string } {
  if (p.age >= 31) return { focus: 'Conditioning', why: 'At ' + p.age + ', keeping his legs matters most.' };
  const W = OVR_W[p.grp] || OVR_W.W;
  let best = 'Balanced', score = 0, gaps: string[] = [];
  Object.entries(FOCUS).forEach(([f, ks]) => {
    const sc = ks.reduce((a, k) => a + W[k] * Math.max(0, 72 - p.r[k]), 0) / Math.sqrt(ks.length) * (f === 'Athleticism' ? (p.age >= 27 ? 0.55 : p.age >= 24 ? 0.8 : 1) : 1); // athleticism is hard to add once he's in his mid-20s
    if (sc > score) { score = sc; best = f; gaps = ks.filter(k => p.r[k] < 72).sort((a, b) => p.r[a] - p.r[b]).slice(0, 2).map(k => NAME[k] + ' ' + p.r[k]); }
  });
  if (best === 'Balanced' || score < 8) return { focus: 'Balanced', why: 'No big hole for a ' + GRP_NAME[p.grp] + '; keep everything moving.' };
  return { focus: best, why: 'Biggest gap for a ' + GRP_NAME[p.grp] + ': ' + gaps.join(', ') + '.' };
}

// Development league or main roster: young players outside the top ten go down for game reps;
// anyone who has worked his way into the rotation (or is hurt) stays up.
export function coachAssign(g: Game, ids: number[], p: any): { dev: boolean; why: string } {
  const P = g.db.P, eligible = p.age <= 25 && p.ovr < 58;
  if (!eligible) return { dev: false, why: 'Too established for the CCP.' };
  if (p.inj) return { dev: false, why: 'Rehabbing with the team.' };
  const rank = ids.filter(id => P[id].ovr > p.ovr).length + 1;
  if (rank > 10 && p.age <= 23) return { dev: true, why: 'Outside the rotation (' + rank + 'th on the roster): he needs game reps.' };
  return { dev: false, why: rank <= 10 ? 'Part of the rotation (' + rank + 'th on the roster).' : 'At ' + p.age + ', he develops with the team.' };
}

// Apply the coaches' assignments for one of your teams; returns log lines for any moves.
export function applyCoachPlans(g: Game, s: any, club: any, ids: number[]): string[] {
  const auto = club?.coachAuto || {}, P = g.db.P, out: string[] = [];
  ids.forEach(id => { if (!auto[id]) return; const p = P[id], a = coachAssign(g, ids, p);
    if (!!p.dev !== a.dev) { p.dev = a.dev; out.push('Coaches ' + (a.dev ? 'sent ' + p.name + ' to the CCP' : 'recalled ' + p.name + ' from the CCP') + ' (' + a.why.replace(/\.$/, '').toLowerCase() + ')'); } });
  return out;
}

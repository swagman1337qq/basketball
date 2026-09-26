// The assistant coaches' lineup advice: who should start (best five with a sensible mix
// of guards, wings and bigs), and whose minutes should go up or down (fatigue, form,
// age, development, injuries). Better-funded staffs read form more accurately.
import type { Game } from './Game';
import { mulberry32 } from './rng';

export interface AdviceLine { pid: number; kind: 'start' | 'bench' | 'more' | 'less' | 'rest' | 'dev' | 'hurt'; text: string; by: string }
export interface Advice { staff: { name: string; role: string }[]; lines: AdviceLine[]; order: number[]; minutes: Record<number, number>; summary: string }

const FIRST = ['Dale', 'Ray', 'Marcus', 'Tom', 'Luis', 'Kenji', 'Andre', 'Greg', 'Sam', 'Darnell', 'Pete', 'Nate', 'Victor', 'Hal', 'Omar', 'Chris'];
const LAST = ['Whitcombe', 'Okafor', 'Brandt', 'Ferris', 'Molina', 'Tanaka', 'Pruitt', 'Sorensen', 'Haddad', 'Keller', 'Duval', 'Ambrose', 'Lindqvist', 'Rourke', 'Castellano', 'Mbeki'];
export function staffOf(tid: number) {
  const r = mulberry32(tid * 7717 + 3), pick = (a: string[]) => a[Math.floor(r() * a.length)];
  return [{ name: pick(FIRST) + ' ' + pick(LAST), role: 'Associate head coach' }, { name: pick(FIRST) + ' ' + pick(LAST), role: 'Player development' }, { name: pick(FIRST) + ' ' + pick(LAST), role: 'Analytics & advance scouting' }];
}

export function lineupAdvice(g: Game, s: any, tid: number): Advice {
  const P = g.db.P, club = g.clubOf(s, tid), coach = club?.budget?.Coaching ?? 18, noise = Math.max(0, (26 - coach) * 0.18);
  const staff = staffOf(tid), [assoc, dev, ana] = staff;
  const r = mulberry32(tid * 131 + (s.day || 0) * 7 + g.Y);
  const ids: number[] = s.rosters[tid] || [];
  const out = (id: number) => { const p = P[id]; return (p.inj && !p.inj.dtd) || p.dev || (p.ctype === 'twoWay' && (p.twoWay?.games || 0) >= 50); };
  const avail = ids.filter(id => !out(id));
  const season = (p: any) => (p.stats || []).filter((x: any) => x.season === g.Y && !x.po).reduce((a: any, x: any) => ({ gp: a.gp + x.gp, min: a.min + x.min }), { gp: 0, min: 0 });
  // Value: rating, plus current form (PER vs league average) once there's a sample, plus staff noise.
  const val = (id: number) => { const p = P[id], sn = season(p), form = sn.gp >= 5 ? ((p.per || 15) - 15) * 0.35 : 0; return p.ovr + form - (p.fat || 0) * 0.04 - (p.inj?.dtd ? 2 : 0) + (r() - 0.5) * noise; };
  const V: Record<number, number> = {}; avail.forEach(id => (V[id] = val(id)));
  // Best five by value with a balanced mix (at least one guard and one big, at most three of either).
  const pool = avail.slice().sort((a, b) => V[b] - V[a]).slice(0, 9);
  let best: number[] = pool.slice(0, 5), bestScore = -1e9;
  const combos = (a: number[], k: number, start = 0, cur: number[] = []) => { if (cur.length === k) { const gN = cur.filter(id => P[id].grp === 'G').length, bN = cur.filter(id => P[id].grp === 'B').length;
      const sc = cur.reduce((t, id) => t + V[id], 0) - (gN < 1 ? 9 : 0) - (bN < 1 ? 9 : 0) - (gN > 3 ? 5 : 0) - (bN > 3 ? 5 : 0) - (gN + bN === 5 ? 3 : 0); if (sc > bestScore) { bestScore = sc; best = cur.slice(); } return; }
    for (let i = start; i < a.length; i++) { cur.push(a[i]); combos(a, k, i + 1, cur); cur.pop(); } };
  if (pool.length >= 5) combos(pool, 5);
  const starters = best.slice().sort((a, b) => ({ G: 0, W: 1, B: 2 } as any)[P[a].grp] - ({ G: 0, W: 1, B: 2 } as any)[P[b].grp] || V[b] - V[a]);
  const bench = avail.filter(id => !starters.includes(id)).sort((a, b) => V[b] - V[a]);
  const order = [...starters, ...bench, ...ids.filter(id => out(id))];
  const ROT = [34, 33, 32, 30, 28, 24, 20, 17, 14, 6, 2, 0, 0, 0, 0, 0, 0, 0];
  const minutes: Record<number, number> = {}; [...starters, ...bench].forEach((id, i) => (minutes[id] = ROT[i] ?? 0));
  const lines: AdviceLine[] = [], cur = ids.filter(id => !out(id)), curStart = ids.slice(0, 5);
  const say = (pid: number, kind: AdviceLine['kind'], text: string, by = assoc.name) => lines.push({ pid, kind, text, by });
  starters.filter(id => !curStart.includes(id)).forEach(id => { const p = P[id], sn = season(p); say(id, 'start', p.name + ' should start. ' + (sn.gp >= 5 && (p.per || 0) >= 17 ? 'He’s been our most efficient guy off the bench (' + (p.per || 0).toFixed(1) + ' PER).' : p.grp === 'B' ? 'We need his size with the first unit.' : p.grp === 'G' ? 'We need another ball handler out there to start games.' : 'He’s the best wing we have available.'), sn.gp >= 5 ? ana.name : assoc.name); });
  curStart.filter(id => !starters.includes(id) && !out(id)).forEach(id => { const p = P[id]; say(id, 'bench', 'Move ' + p.name + ' to the bench. ' + ((p.per || 15) < 12 && season(p).gp >= 5 ? 'His numbers have slipped (' + (p.per || 0).toFixed(1) + ' PER); a second-unit role might reset him.' : 'The balance is better with him leading the second unit.') + (p.pers?.alpha || p.pers?.mot === 'Playing time' ? ' Heads-up: he won’t like it.' : '')); });
  curStart.filter(id => out(id)).forEach(id => say(id, 'hurt', P[id].name + ' is out (' + (P[id].inj?.name || 'unavailable') + '). Don’t leave him in the starting five.', dev.name));
  avail.forEach(id => { const p = P[id], sn = season(p), mpg = sn.gp ? sn.min / sn.gp : 0;
    if ((p.fat || 0) >= 55) { minutes[id] = Math.max(0, (minutes[id] || 0) - 6); say(id, 'rest', p.name + ' is running on fumes (fatigue ' + Math.round(p.fat) + '). Trim his minutes for a few games.', dev.name); }
    else if (p.age >= 33 && (minutes[id] || 0) > 28) { minutes[id] = 28; say(id, 'rest', 'Keep ' + p.name + ' under 28 minutes. At ' + p.age + ' we want his legs in April.', dev.name); }
    if (p.age <= 22 && p.pot - p.ovr >= 10 && (minutes[id] || 0) < 14) { minutes[id] = 14; say(id, 'dev', p.name + ' needs real minutes to grow (' + p.ovr + ' now, ' + p.pot + ' ceiling). Give him 12–16 a night.', dev.name); }
    if (sn.gp >= 8 && mpg >= 24 && (p.per || 15) < 10 && !starters.slice(0, 2).includes(id)) { minutes[id] = Math.max(8, (minutes[id] || 0) - 6); say(id, 'less', p.name + ' is giving us ' + (p.per || 0).toFixed(1) + ' PER in ' + mpg.toFixed(0) + ' minutes. The numbers say cut that back.', ana.name); }
    if (sn.gp >= 8 && mpg < 14 && (p.per || 0) >= 18) { minutes[id] = Math.max(minutes[id] || 0, 18); say(id, 'more', p.name + ' has a ' + (p.per || 0).toFixed(1) + ' PER in limited minutes. He’s earned a bigger role.', ana.name); }
    if (p.minMin && (minutes[id] || 0) < p.minMin) say(id, 'more', 'Remember ' + p.name + '’s incentive promise: at least ' + p.minMin + ' minutes.', assoc.name);
  });
  // Scale the rotation to 240 minutes (five players × 48), keeping each player's share.
  let tot = Object.values(minutes).reduce((a, b) => a + b, 0);
  if (tot > 0 && Math.abs(tot - 240) > 2) { const k = 240 / tot; Object.keys(minutes).forEach(id => (minutes[+id] = Math.min(42, Math.round(minutes[+id] * k)))); tot = Object.values(minutes).reduce((a, b) => a + b, 0); }
  const summary = lines.length ? lines.length + ' suggestion' + (lines.length === 1 ? '' : 's') + '. Suggested rotation totals ' + Math.round(tot) + ' minutes (a game is 240).' : 'The staff likes the rotation as it is. No changes suggested.';
  void cur;
  return { staff, lines, order, minutes, summary };
}

// Apply the advice: the suggested order (starters first) and minute targets.
export function applyAdvice(g: Game, tid: number, a: Advice) {
  const P = g.db.P;
  Object.entries(a.minutes).forEach(([id, m]) => { P[+id].rot = m; });
  g.setState((st: any) => ({ rosters: { ...st.rosters, [tid]: a.order.filter(id => st.rosters[tid].includes(id)).concat(st.rosters[tid].filter((id: number) => !a.order.includes(id))) }, advice: null, gv: (st.gv || 0) + 1 }));
}

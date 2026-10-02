// Your assistant GM's read on a trade: is it good for us, and will they actually take it?
// "Good for us" values both sides the way a team in our position would (contender, middle or
// rebuilder, from the standings and roster strength); "will they take it" is the other team's
// own valuation, the same one that decides whether they accept.
import type { Game } from './Game';
import { teamSalary } from './cba';

export interface Advice { tone: 'good' | 'ok' | 'bad'; head: string; lines: string[] }

export function ourStrategy(g: Game, s: any): 'contend' | 'middle' | 'rebuild' {
  const sc = (t: any) => g.pct(t) * 0.65 + (t.str - 45) / 12 * 0.35;
  const rank = s.teams.slice().sort((a: any, b: any) => sc(b) - sc(a)).findIndex((t: any) => t.tid === s.me);
  return rank < 9 ? 'contend' : rank >= 20 ? 'rebuild' : 'middle';
}

// kind 'offer': they already said yes (an offer they made us). kind 'proposal': our own offer to them.
export function tradeAdvice(g: Game, s: any, tid: number, mine: number[], theirs: number[], kMine: string[], kTheirs: string[], kind: 'offer' | 'proposal'): Advice {
  const P = g.db.P, st = ourStrategy(g, s);
  const give = mine.reduce((a, id) => a + g.pVal(P[id], st, s.me), 0) + kMine.reduce((a, id) => a + g.tradeItemVal(s, id, st, true, tid, s.me), 0);
  const get = theirs.reduce((a, id) => a + g.pVal(P[id], st, s.me), 0) /* your staff's and scouts' read of potential */ + kTheirs.reduce((a, id) => a + g.tradeItemVal(s, id, st, false, s.me, tid), 0);
  const r = give <= 0.5 ? (get > 0.5 ? 9 : 1) : get / give;
  const ev = g.evalTrade({ ...s, tTid: tid }, mine, theirs, kMine, kTheirs), scale = Math.max(10, Math.abs(ev.give));
  const lines: string[] = [];
  // Why: the best player each way, the age swing, and what it does to our payroll.
  const best = (ids: number[]) => ids.map(id => P[id]).sort((a, b) => b.ovr - a.ovr)[0];
  const bIn = best(theirs), bOut = best(mine);
  if (bIn && bOut) lines.push('Best player: we get ' + bIn.name + ' (' + bIn.ovr + ' ovr, ' + bIn.age + ') for ' + bOut.name + ' (' + bOut.ovr + ', ' + bOut.age + ').');
  else if (bIn) lines.push('We add ' + bIn.name + ' (' + bIn.ovr + ' ovr, ' + bIn.age + ') without giving up a player.');
  else if (bOut) lines.push('We give up ' + bOut.name + ' (' + bOut.ovr + ' ovr) and get only picks back.');
  const avgAge = (ids: number[]) => ids.length ? ids.reduce((a, id) => a + P[id].age, 0) / ids.length : 0;
  if (mine.length && theirs.length) { const d = avgAge(theirs) - avgAge(mine); if (Math.abs(d) >= 3) lines.push(d > 0 ? 'Makes us older (' + d.toFixed(0) + ' years on average)' + (st === 'rebuild' ? ', the wrong direction for a rebuild.' : st === 'contend' ? ', fine for a contender.' : '.') : 'Makes us younger (' + (-d).toFixed(0) + ' years on average)' + (st === 'contend' ? ', which can cost us wins now.' : '.')); }
  const picksOut = kMine.length, picksIn = kTheirs.length;
  if (picksOut || picksIn) lines.push(picksOut && picksIn ? 'Picks both ways: ' + picksOut + ' out, ' + picksIn + ' in.' : picksOut ? picksOut + ' of our pick' + (picksOut === 1 ? '' : 's') + ' going out' + (st === 'rebuild' ? ', and we’re rebuilding.' : '.') : picksIn + ' pick' + (picksIn === 1 ? '' : 's') + ' coming back.');
  const out = mine.reduce((a, id) => a + g.capHit(P[id]), 0), inc = theirs.reduce((a, id) => a + g.capHit(P[id]), 0), after = teamSalary(g, s, s.me) - out + inc;
  if (Math.abs(inc - out) >= 1) lines.push('Payroll ' + (inc > out ? 'up' : 'down') + ' $' + Math.abs(inc - out).toFixed(1) + 'M' + (after > g.TAX && inc > out ? ', into the tax.' : after <= g.TAX && inc < out ? '.' : '.'));

  if (kind === 'offer') {
    if (r >= 1.25) return { tone: 'good', head: 'Take it. This is a steal, and I’d sign it before they sober up.', lines };
    if (r >= 1.08) return { tone: 'good', head: 'Good deal for us. We come out ahead.', lines };
    if (r >= 0.92) return { tone: 'ok', head: 'Fair deal. Nobody wins big; it comes down to fit.', lines };
    if (r >= 0.75) return { tone: 'bad', head: 'We’d be overpaying. I’d counter before saying yes.', lines };
    return { tone: 'bad', head: 'We’re getting ripped off. Hang up the phone.', lines };
  }
  // Our own proposal: first, would they even take it?
  const gap = ev.diff / scale;
  if (!ev.ok) {
    if (gap < -0.6) return { tone: 'bad', head: 'Way too unrealistic. They’ll ghost you.', lines: ['They value what they’d give up far more than what we’re sending.', ...lines] };
    if (gap < -0.25) return { tone: 'bad', head: 'Not close. They’ll laugh this one off.', lines: ['We need to add real value, or ask for less.', ...lines] };
    return { tone: 'ok', head: 'Close. Sweeten it a little and they’ll bite.', lines: ['“What would it take?” or “Balance for me” finds the missing piece.', ...lines] };
  }
  if (r >= 1.08) return { tone: 'good', head: 'They’d take it, and it’s good for us. Pull the trigger.', lines };
  if (r >= 0.92) return { tone: 'good', head: 'Fair deal. They’ll say yes.', lines };
  if (r >= 0.75) return { tone: 'ok', head: 'They’ll say yes fast, which should worry you. We’re paying a bit much.', lines };
  return { tone: 'bad', head: 'They’d accept in a heartbeat. We’re the ones getting ripped off.', lines };
}

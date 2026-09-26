// The owner's year-end letter, written when the playoffs end: what you did right, what
// you did wrong, how he feels about the job you're doing, and what he expects next.
// It uses the same conditions as the owner review, so its verdict is the real one.
import type { Game } from './Game';
import { fmtMoney } from './capModel';
import { fireReasons, ownerReview } from './frontOffice';
import { contractDecision, contractOf } from './gmCareer';

const money = fmtMoney;
const VOICE: Record<string, { open: string; care: string; next: string }> = {
  'Win-Now Spender': { open: 'I didn’t buy this team to be patient.', care: 'Banners are the only thing I measure. I’ll spend whatever it takes, but I expect to see it on the court.', next: 'Get us deeper into the playoffs. The checkbook is open.' },
  'Frugal Profit-Seeker': { open: 'I read the books before I read the box scores.', care: 'Every dollar matters to me. Win games, fine, but never by setting money on fire.', next: 'Stay under the tax and keep us in the black.' },
  'Asset Hoarder': { open: 'I care about where this franchise is in five years, not five weeks.', care: 'Picks and young talent are how dynasties are built. Don’t trade the future for a quick fix.', next: 'Protect our picks and keep growing the young core.' },
  'Hype Focus': { open: 'This city has to feel something when it watches us.', care: 'Full seats, a star people pay to see, a team they talk about. That’s the job.', next: 'Fill the building and give the fans a star.' },
  'Meddling Micromanager': { open: 'I watched every game this year. I have notes.', care: 'I trust you, but I’m going to keep asking questions. That’s how I run everything I own.', next: 'Play my guy, and win more than we lose.' },
};

export interface OwnerLetter { contract?: string; tid: number; season: number; owner: string; arch: string; sec: number; verdict: 'extend' | 'stay' | 'warning' | 'fired'; right: string[]; wrong: string[]; feel: string; next: string[]; fin: string; record: string }

export function yearEndLetter(g: Game, s: any, tid: number, fin: string): OwnerLetter {
  const T = s.teams, me = T[tid], P = g.db.P, Y = g.Y, ids = s.rosters[tid] || [];
  const rv = ownerReview(g, s, tid), F = rv.fin, v = VOICE[me.arch] || VOICE['Win-Now Spender'];
  const right: string[] = [], wrong: string[] = [], next: string[] = [];
  // Roster-strength projection (top-eight average vs the league).
  const str = (t: number) => { const o = (s.rosters[t] || []).map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 8); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); };
  const avg = T.reduce((a, t) => a + str(t.tid), 0) / T.length, proj = Math.round(82 * Math.max(0.15, Math.min(0.85, 0.5 + (str(tid) - avg) * 0.035)));
  const last = ((s.teamHist || {})[tid] || []).slice(-1)[0];
  // Results.
  if (fin === 'Won the title') right.push('You brought a championship to this city. Nothing else in this letter matters as much as that.');
  else if (/Finals/.test(fin) && !/conference/.test(fin)) right.push('We played in the Finals. We came up short, but we were one series away.');
  else if (/conference finals/.test(fin)) right.push('A conference finals run. We were one of the last four teams standing.');
  else if (!/Missed|play-in/.test(fin) && !last) right.push('You took this team to the playoffs.');
  else if (!/Missed|play-in/.test(fin) && /Missed|play-in/.test(last.fin)) right.push('You got us back into the playoffs.');
  if (me.w - proj >= 5) right.push('We won ' + me.w + ' games. On paper this roster was a ' + proj + '-win team; you got ' + (me.w - proj) + ' more out of it.');
  if (last && me.w - last.w >= 8) right.push('We improved by ' + (me.w - last.w) + ' wins over last season.');
  if (/Missed/.test(fin)) wrong.push('We missed the playoffs. ' + me.w + '–' + me.l + ' isn’t good enough.');
  else if (/play-in/.test(fin)) wrong.push('We went out in the play-in. That’s missing the playoffs with extra steps.');
  const seed = (s.seeds?.[me.conf] || []).indexOf(tid) + 1;
  if (seed > 0 && seed <= 3 && /first round/.test(fin)) wrong.push('We were the ' + seed + (seed === 1 ? 'st' : seed === 2 ? 'nd' : 'rd') + ' seed and lost in the first round. That’s an upset I won’t forget quickly.');
  if (proj - me.w >= 5) wrong.push('This roster should have won about ' + proj + ' games. We won ' + me.w + '.');
  // The owner's written demands.
  rv.demands.forEach(([d, cur, st]) => { if (st === 'Met') right.push('You met my demand: ' + d.toLowerCase() + ' (' + cur + ').'); else wrong.push((st === 'Failing' ? 'You failed my demand: ' : 'You’re at risk on my demand: ') + d.toLowerCase() + ' (' + cur + ').'); if (st !== 'Met') next.push(d); });
  // Money and the building.
  if (F.net >= 10) right.push('We turned a ' + money(F.net) + ' profit.'); else if (F.net < 0) wrong.push('We lost ' + money(-F.net) + ' this season.');
  if (F.taxBill > 0 && ['Frugal Profit-Seeker', 'Asset Hoarder'].includes(me.arch)) wrong.push('We paid ' + money(F.taxBill) + ' in luxury tax. You know how I feel about that.');
  if (F.full >= 0.9) right.push('The building was ' + Math.round(F.full * 100) + '% full. People want to watch this team.');
  else if (F.full < 0.8) wrong.push('Only ' + Math.round(F.full * 100) + '% of the seats were filled. Empty seats are a message.');
  if ((s.mandateFails || {})[tid]) wrong.push('You ignored my payroll deadline, and I had to order a fire sale myself.');
  if (me.arch === 'Meddling Micromanager' && rv.favBench >= 10) wrong.push('You benched ' + (P[ids.slice().sort((a, b) => P[b].pot - P[a].pot)[0]]?.name || 'my guy') + ' for ' + rv.favBench + ' games. I noticed every one.');
  // Players: awards and growth.
  const aw = (s.awards || {})[Y] || {};
  (aw.defs || [{ shortName: 'MVP', name: 'MVP' }, { shortName: 'DPOY', name: 'Defensive Player of the Year' }, { shortName: 'ROY', name: 'Rookie of the Year' }, { shortName: 'SMOY', name: 'Sixth Man of the Year' }, { shortName: 'MIP', name: 'Most Improved Player' }]).filter(d => ['MVP', 'DPOY', 'ROY', 'SMOY', 'MIP'].includes(d.shortName)).forEach(d => {
    const w = aw.list?.[d.shortName]?.[0] || aw[d.shortName.toLowerCase()]?.[0]; if (w && ids.includes(w.pid)) right.push(P[w.pid].name + ' won ' + d.name + '. That reflects on you.');
  });
  if (aw.fmvp && ids.includes(aw.fmvp.pid)) right.push(P[aw.fmvp.pid].name + ' was Finals MVP.');
  if ((aw.coy || [])[0]?.tid === tid) right.push('The league named you Coach of the Year.');
  const grew = ids.map(id => ({ p: P[id], d: (P[id].feed || []).slice(0, 9).reduce((a, x) => a + (x.o || 0), 0) })).sort((a, b) => b.d - a.d)[0];
  if (grew && grew.d >= 2.5) right.push(grew.p.name + ' grew by about ' + grew.d.toFixed(1) + ' overall this season under your staff.');
  const anchor = ids.map(id => ({ p: P[id], over: P[id].amt - g.fair(P[id].ovr) })).sort((a, b) => b.over - a.over)[0];
  if (anchor && anchor.over >= 8) wrong.push(anchor.p.name + '’s ' + money(anchor.p.amt) + ' contract is an anchor. Fix it or live with it.');
  if (!right.length) right.push('Honestly, I had to look hard. You kept the locker room together, and that counts for something.');
  if (!wrong.length) wrong.push('Not much. Keep doing what you’re doing.');
  // How he feels, and the decision.
  const reasons = s.ownerFiring === false || s.god || s.easy?.fire ? [] : fireReasons(g, s, tid, rv, fin);
  const verdict: OwnerLetter['verdict'] = reasons.length ? 'fired' : rv.sec >= 75 ? 'extend' : rv.sec >= 45 ? 'stay' : 'warning';
  const feel = v.open + ' ' + v.care + ' ' + ({
    extend: 'I’m thrilled with what you’re building here. You have my full confidence, and you’ll have it next year too.',
    stay: 'Overall I’m satisfied. There’s real work left, but I believe you’re the right person to do it.',
    warning: 'I’m not happy. My conditions haven’t changed and you know what they are. Consider this a warning.',
    fired: 'I’ve made a decision: I’m making a change. ' + (reasons[0] || '') + '. Thank you for your work.',
  } as Record<string, string>)[verdict];
  if (verdict !== 'fired') next.push(v.next);
  const contract = verdict !== 'fired' && contractOf(g, s).tid === tid ? contractDecision(g, s, tid).text : '';
  return { contract, tid, season: Y, owner: me.owner, arch: me.arch, sec: rv.sec, verdict, right, wrong, feel, next: [...new Set(next)].slice(0, 3), fin, record: me.w + '–' + me.l };
}

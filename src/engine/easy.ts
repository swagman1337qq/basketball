// Easy mode: the parts of the job you'd rather hand off. Every switch is off unless you turn
// it on (Settings → Easy mode, or the tutorial's first step).
//   lineup    starters and minutes follow the assistant coaches (re-checked every week)
//   tactics   the staff picks the tactics that fit your roster best (every month)
//   cap       contract chores: option and qualifying-offer decisions, answering offer sheets,
//             cutting to 15 before opening night
//   fa        in free agency, fill empty roster spots with the best player you can afford
//   draft     your picks are made for you (best player available)
//   fire      the owner can't fire you
//   scouting  scouting reports and draft boards are much more accurate
//   injuries  injured players always sit (no playing through pain)
import type { Game } from './Game';
import { lineupAdvice } from './assistants';
import { aiTerms, applySigning, waivePlayer } from './contracts';
import { nums, stdIds, teamSalary } from './cba';

export type EasyKey = 'lineup' | 'tactics' | 'cap' | 'fa' | 'draft' | 'fire' | 'scouting' | 'injuries';
export const EASY: [EasyKey, string, string][] = [
  ['lineup', 'Set my lineup and minutes', 'Your assistant coaches pick the starters and share out the minutes every week.'],
  ['tactics', 'Choose my tactics', 'The staff picks the pace, offense and defense that suit your players.'],
  ['cap', 'Handle contract paperwork', 'Options, qualifying offers, offer sheets and roster cuts are decided for you, sensibly.'],
  ['fa', 'Fill my roster in free agency', 'Empty roster spots get filled with the best player you can afford.'],
  ['draft', 'Make my draft picks', 'Your picks go to the best player available.'],
  ['fire', 'Never get fired', 'The owner still writes, but can’t fire you.'],
  ['scouting', 'Easier scouting', 'Scouting reports and draft rankings are much more accurate.'],
  ['injuries', 'Rest injured players', 'Hurt players always sit instead of playing through pain.'],
];
export const easyOn = (s: any, k: EasyKey) => !!s?.easy?.[k];

// Daily, before games: the staff's lineup for managed teams (full advice once a week).
export function easyLineups(g: Game, s: any, rosters: Record<number, number[]>, day: number) {
  if (!easyOn(s, 'lineup')) return;
  s.managed.forEach((t: number) => {
    if (day % 7 === 0) { const a = lineupAdvice(g, { ...s, rosters }, t); Object.entries(a.minutes).forEach(([id, m]) => (g.db.P[+id].rot = m)); rosters[t] = a.order.filter(id => rosters[t].includes(id)).concat(rosters[t].filter(id => !a.order.includes(id))); }
    else rosters[t] = g.autoSorted(rosters[t]);
  });
}

// The best-fitting tactics for a roster.
export function bestTactics(g: Game, ids: number[], cur: any) {
  let best = cur, top = -1e9;
  for (const pace of ['Slow', 'Balanced', 'Fast']) for (const off of ['Inside', 'Balanced', 'Perimeter', 'Pace and space']) for (const def of ['Drop', 'Switch', 'Aggressive']) {
    const t = { ...cur, pace, off, def }, f = g.tacFit(ids, t); if (f > top + 0.01) { top = f; best = t; } }
  return best;
}

// Free agency for a managed team on easy mode: fill to 14 with the best affordable players.
export function easyFreeAgency(g: Game, s: any, box: any, lgLog: any[]) {
  if (!easyOn(s, 'fa')) return;
  const P = g.db.P;
  s.managed.forEach((t: number) => {
    for (let k = 0; k < 3 && stdIds(g, box.rosters[t]).length < 14; k++) {
      const st = { ...s, rosters: box.rosters, cap: box.cap, fa: box.fa };
      const cands = box.fa.filter((id: number) => !P[id].rfa).sort((a: number, b: number) => P[b].ovr - P[a].ovr).slice(0, 25);
      let done = false;
      for (const id of cands) { const terms = aiTerms(g, st, t, P[id]); if (!terms) continue; lgLog.unshift({ day: s.day, type: 'Signing', teams: s.teams[t].abbr, pids: [id], text: applySigning(g, st, box, t, P[id], terms) + ' (easy mode)' }); done = true; break; }
      if (!done) break;
    }
  });
}

// Before opening night: cut managed rosters to 15 standard contracts (cheapest dead money first).
export function easyCuts(g: Game, s: any, box: any, lgLog: any[]) {
  if (!easyOn(s, 'cap')) return;
  const P = g.db.P;
  s.managed.forEach((t: number) => {
    while (stdIds(g, box.rosters[t]).length > 15) {
      const w = stdIds(g, box.rosters[t]).map(id => P[id]).sort((a, b) => (a.ovr + (a.ctype === 'ex10' ? -6 : 0) + a.amt * 0.3) - (b.ovr + (b.ctype === 'ex10' ? -6 : 0) + b.amt * 0.3))[0];
      waivePlayer(g, s, box, t, w, 'waive').forEach(text => lgLog.unshift({ day: s.day, type: 'Release', teams: s.teams[t].abbr, pids: [w.id], text: text + ' (easy mode)' }));
    }
  });
}

// Should the team match an offer sheet for its restricted free agent? (easy mode decides)
export function easyMatch(g: Game, s: any, os: any) {
  const p = g.db.P[os.pid], N = nums(g);
  return g.fair(p.ovr) * (p.age <= 24 ? 1.25 : 1) >= os.terms.amt * 0.9 && teamSalary(g, s, os.to) + os.terms.amt <= N.AP2;
}

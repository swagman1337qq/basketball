// God Mode: move any player to any team, right now. A player under contract keeps his deal (it
// travels with him, as in a trade, and goes on his record as a God Mode move); anyone without one
// (a free agent, a CCP player, a player abroad, a draft prospect) signs a fair contract for what
// he's worth: his overall, plus part of his upside if he's young, and the years a player his age
// wants. A full AI roster waives its last minimum-salary player to make room.
import { glLabel } from './gleague';
import type { Game } from './Game';
import { addTx, recordTrade } from './txlog';
import { applySigning, prefYears } from './contracts';
import { nums, rosterMax, stdIds, yosOf } from './cba';
import { adjustGames } from './overseas';
import { addNotice } from './preFA';
import { fmtMoney } from './capModel';

// What a fair new contract looks like (first-year salary in $M, and years).
export function godTerms(g: Game, p: any) {
  const N = nums(g), yos = yosOf(g, p), minS = N.min(yos);
  const worth = p.ovr + (p.age <= 24 ? 0.35 * Math.max(0, (p.pot || p.ovr) - p.ovr) : 0); // teams pay young players for some of what they'll become
  const ageF = p.age <= 30 ? 1 : Math.max(0.5, 1 - 0.07 * (p.age - 30));
  const amt = +Math.max(minS, Math.min(N.max(yos), g.fair(Math.round(worth)) * ageF)).toFixed(2);
  return { amt, years: Math.max(1, Math.min(5, prefYears(p))) };
}

// Where he is now, in words (for the button and the log).
export function whereIs(g: Game, s: any, pid: number) {
  const p = g.db.P[pid], tid = g.tidOf(s.rosters, pid);
  if (tid >= 0) return { tid, label: s.teams[tid].region + ' ' + s.teams[tid].name };
  if ((s.overseas || []).includes(pid)) return { tid: -1, label: p.abroad?.club ? p.abroad.club + ' (abroad)' : 'abroad' };
  if ((s.fa || []).includes(pid)) return { tid: -1, label: p.gl?.tid != null ? 'the CCP' : 'free agency' };
  if (p.cls) return { tid: -1, label: 'the ' + p.cls + ' draft class' };
  return { tid: -1, label: 'nowhere' };
}

// Where a player is now, for lists: his NBA team, Retired, Free agent, his CCP club, his club abroad,
// still a draft prospect, or out of the league (an undrafted player who went home, or one long gone).
export function nowLabel(g: Game, s: any, p: any): { label: string; tid: number } {
  if (!p) return { label: '—', tid: -1 };
  if (p.retired) return { label: p.gone ? 'Out of the league' : 'Retired' + (p.retired.season ? ' (' + p.retired.season + ')' : ''), tid: -1 };
  const tid = g.tidOf(s.rosters, p.id); if (tid >= 0) return { label: s.teams[tid].abbr, tid };
  if ((s.overseas || []).includes(p.id)) return { label: (p.abroad?.club || 'Abroad') + (p.abroad?.lg ? ' (' + p.abroad.lg + ')' : ' (abroad)'), tid: -1 };
  if ((s.fa || []).includes(p.id)) return { label: p.gl?.tid != null ? 'CCP: ' + glLabel(s, p) : 'Free agent', tid: -1 };
  if (p.cls && p.cls >= g.Y) return { label: 'Draft prospect (' + p.cls + ')', tid: -1 };
  return { label: 'Out of the league', tid: -1 };
}
// The team that drafted him (it used the pick), however he's moved since; null if undrafted or drafted
// before this league began.
let DT: { n: number; m: Map<number, number> } | null = null;
export function draftedBy(g: Game, p: any): number | null {
  if (p?.draftTid != null) return p.draftTid;
  const pu = g.db.pickUsed || {}, n = Object.keys(pu).length;
  if (!DT || DT.n !== n) { const m = new Map<number, number>(); Object.values(pu).forEach((u: any) => { if (u?.pid != null && u.tid != null) m.set(u.pid, u.tid); }); DT = { n, m }; }
  return DT.m.get(p?.id) ?? null;
}
export function draftedLabel(g: Game, s: any, p: any) { const t = draftedBy(g, p); return t != null && s.teams[t] ? s.teams[t].abbr : p.undrafted ? 'Undrafted' : p.cls && p.cls >= g.Y ? 'Not drafted yet' : p.dr ? 'Before this league' : 'Undrafted'; }

// Why he can't be moved (or '' if he can).
export function cantMove(g: Game, s: any, pid: number, to: number) {
  const p = g.db.P[pid];
  if (!s.god) return 'God Mode only.';
  if (!p || p.gone) return 'No such player.';
  if (p.retired) return p.name + ' is retired.';
  if (!s.teams[to]) return 'Pick a team.';
  if (g.tidOf(s.rosters, pid) === to) return p.name + ' already plays for the ' + s.teams[to].name + '.';
  const pk = (s.picks || []).find((x: any) => x.pid === pid);
  if (s.phase === 'draft' && pk && g.tidOf(s.rosters, pid) < 0) return 'His draft rights were just used: he signs with that team when free agency opens. Move him after that.';
  return '';
}

export function godMovePlayer(g: Game, pid: number, to: number) {
  const why = cantMove(g, g.state, pid, to); if (why) return why;
  g.setState(s => {
    const P = g.db.P, p = P[pid], T = s.teams, from = g.tidOf(s.rosters, pid), dest = T[to];
    const box = { rosters: { ...s.rosters }, fa: s.fa.slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } };
    let line = '';
    if (from >= 0) {
      // Under contract: he goes with his deal, like a trade for nothing.
      box.rosters[from] = box.rosters[from].filter((x: number) => x !== pid);
      box.rosters[to] = [...(box.rosters[to] || []), pid];
      recordTrade(g, s, from, to, [pid], [], [], [], 'God Mode move');
      line = 'God Mode: ' + p.name + ' moved from the ' + T[from].region + ' ' + T[from].name + ' to the ' + dest.region + ' ' + dest.name + ' (' + fmtMoney(p.amt) + ' through ' + (p.exp - 1) + '–' + String(p.exp).slice(2) + ')';
    } else {
      // Out of the league's rosters: out of his draft class or his club abroad, then a fair contract.
      Object.keys(g.db.cls || {}).forEach(y => { const c = g.db.cls[y]; if (c?.includes(pid)) g.db.cls[y] = c.filter((x: number) => x !== pid); });
      if (p.cls) { Object.assign(p, { undrafted: g.Y, cls: 0, dr: null, draft: g.Y, yrsWith: 0, yos0: 0 }); }
      if (p.abroad) { p.adjust = adjustGames(p); p.overseasArc = { ...(p.overseasArc || {}), back: g.Y, club: p.abroad.club, lg: p.abroad.lg, line: p.abroad.pts + ' pts · ' + p.abroad.reb + ' reb · ' + p.abroad.ast + ' ast', conf: Math.round(p.conf ?? 50) }; delete p.abroad; }
      delete p.rfa;
      const t = godTerms(g, p);
      line = applySigning(g, s, box, to, p, { method: 'god', amt: t.amt, years: t.years });
    }
    // An AI club over the roster limit waives its last minimum-salary player.
    if (!g.isUser(s, to) && stdIds(g, box.rosters[to]).length > rosterMax(s)) {
      const cut = stdIds(g, box.rosters[to]).filter((id: number) => id !== pid).sort((a: number, b: number) => (P[a].amt - P[b].amt) || (P[a].ovr - P[b].ovr))[0];
      if (cut != null) { box.rosters[to] = box.rosters[to].filter((x: number) => x !== cut); box.fa.unshift(cut); P[cut].ask = P[cut].ask || nums(g).min(yosOf(g, P[cut])); addTx(g, s, P[cut], { k: 'waive', tid: to, text: 'Waived to make room for ' + p.name }); }
    }
    const mine = g.isUser(s, to), over = mine && stdIds(g, box.rosters[to]).length > rosterMax(s);
    return { ...box, tMine: (s.tMine || []).filter((x: number) => x !== pid), tTheirs: (s.tTheirs || []).filter((x: number) => x !== pid),
      lgLog: [{ day: s.day, type: from >= 0 ? 'Trade' : 'Signing', teams: from >= 0 ? T[from].abbr + ' · ' + dest.abbr : dest.abbr, pids: [pid], text: line }, ...s.lgLog],
      log: mine ? g.logEntry(s, line) : s.log,
      notices: addNotice(s, { tone: 'good', title: p.name + ' joins the ' + dest.name, lines: [line + '.', ...(over ? ['That’s ' + stdIds(g, box.rosters[to]).length + ' standard contracts: waive or trade someone before the next game day (' + rosterMax(s) + ' max).'] : [])], pids: [pid] }) };
  });
  return '';
}

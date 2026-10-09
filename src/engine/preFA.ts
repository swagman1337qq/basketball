// Pre-Free Agency: the stretch between the draft and June 30, when free agency opens.
// Player options come due (the player decides) and the GM settles everything else before the
// market opens: team options, qualifying offers for restricted free agents, which expiring
// contracts to keep (re-sign now by extension, or with Bird rights once free agency opens) and
// which to let go (Bird rights renounced, so the cap hold comes off the books), and which
// players to extend once the July 6 window opens. Free agency can't open until every required
// decision is made. It is the draft phase with s.preFA set, so every draft-phase rule holds.
import type { Game } from './Game';
import { exerciseOption } from './rosterAI';
import { BIRD_LABEL, birdOf, capHold, extWindow, qoEligible, qoFor } from './cba';
import { fmtMoney as money } from './capModel';

// ── Notices: the popup that tells you how a move turned out ──────────────────────
export interface Notice { id: string; tone: 'good' | 'bad' | 'info'; title: string; lines: string[]; pids?: number[]; offerId?: string; callId?: string } // offerId: an AI team's trade offer (s.inOffers); callId: an agent's last call on your free agent (s.agentCalls)
let seq = 0;
// Spectator Mode: nothing stops to tell you anything (the notices would be about a team you don't run).
export function addNotice(s: any, n: Omit<Notice, 'id'>): Notice[] { if (s.spectator) return s.notices || []; return [...(s.notices || []), { ...n, id: 'n' + Date.now() + '-' + seq++ }].slice(-30); }
export const contractLine = (g: Game, p: any) => money(p.amt) + ' a year through ' + (p.exp - 1) + '–' + String(p.exp).slice(2);

const SKIP = ['tenDay', 'hardship'];
const aiExercise = (g: Game, p: any, sal: number, s: any = g.state) => exerciseOption(g, s, g.tidOf(s.rosters, p.id), p, sal); // rosterAI
export const playerOptionStays = (g: Game, p: any, sal: number) => g.fair(p.ovr) * 1.05 <= sal || (p.age >= 33 && g.fair(p.ovr) <= sal * 1.2);

// Pre-Free Agency opens: every player option for next season is decided now (NBA players
// answer by June 29), league-wide. Your players' answers are kept for the Pre-Free Agency screen.
export function startPreFA(g: Game) {
  g.setState(s => {
    if (s.phase !== 'draft' || s.pi < s.picks.length || s.preFA) return null;
    const P = g.db.P, Y = g.Y, opts: any[] = [], lgLog = s.lgLog.slice(), mine: string[] = [];
    Object.keys(s.rosters).forEach(k => { const t = +k, T = s.teams[t];
      s.rosters[t].forEach((id: number) => { const p = P[id]; if (!(p.opt?.kind === 'player' && p.opt.season === Y + 1)) return;
        const sal = g.salAt(p, Y + 1), stay = playerOptionStays(g, p, sal); delete p.opt; if (!stay) p.exp = Y;
        if (g.isUser(s, t)) { opts.push({ pid: id, tid: t, stay, amt: sal }); if (t === s.me) mine.push(stay ? p.name + ' exercised his player option: he stays for ' + money(sal) + ' in ' + Y + '–' + String(Y + 1).slice(2) + '.' : p.name + ' declined his ' + money(sal) + ' player option. His contract is up: re-sign him or let him go below.'); }
        if (!stay) lgLog.unshift({ day: s.day, type: 'Signing', teams: T.abbr, pids: [id], text: p.name + ' declined his player option with the ' + T.region + ' ' + T.name + ' and will be a free agent' });
        else if (p.ovr >= 60) lgLog.unshift({ day: s.day, type: 'Signing', teams: T.abbr, pids: [id], text: p.name + ' exercised his ' + money(sal) + ' player option with the ' + T.region + ' ' + T.name }); }); });
    const notices = mine.length ? addNotice(s, { tone: 'info', title: 'Player options are in', lines: mine, pids: opts.filter(o => o.tid === s.me).map(o => o.pid) }) : s.notices;
    return { preFA: { season: Y, opts }, lgLog, notices, log: s.spectator ? s.log : g.logEntry(s, 'Pre-Free Agency: player options are in. Decide your team options, qualifying offers and expiring contracts before free agency opens on June 30.') };
  });
}

export interface Choice { k: string; label: string; on: boolean; rec?: boolean; title?: string }
export interface PreRow { pid: number; kind: 'teamOpt' | 'expiring' | 'extend'; head: string; detail: string; status: string; choices: Choice[]; decided: boolean; required: boolean }

// Your decisions for a team's coming summer. In the season they're a preview (team options
// and qualifying offers can be set early); player options show once Pre-Free Agency opens.
export function preFARows(g: Game, s: any, tid: number): PreRow[] {
  const P = g.db.P, Y = g.Y, dec = s.decide || {}, out: PreRow[] = [], yl = (y: number) => (y - 1) + '–' + String(y).slice(2);
  (s.rosters[tid] || []).forEach((id: number) => { const p = P[id]; if (!p || SKIP.includes(p.ctype)) return;
    // Team options for next season.
    if (p.opt?.kind === 'team' && p.opt.season === Y + 1 && !p.ext) {
      const sal = g.salAt(p, Y + 1), rec = aiExercise(g, p, sal), v = dec['opt' + id];
      out.push({ pid: id, kind: 'teamOpt', head: (p.rookieScale ? 'Rookie-scale team option' : 'Team option') + ' for ' + yl(Y + 1) + ': ' + money(sal),
        detail: 'Exercise it and he’s under contract next season at ' + money(sal) + '. Decline it and he becomes an unrestricted free agent' + (p.rookieScale ? ', and you can’t pay him more than the option amount to re-sign him' : '') + '.',
        status: v === true ? 'Exercising' : v === false ? 'Declining' : 'Undecided',
        choices: [{ k: 'exercise', label: 'Exercise', on: v === true, rec }, { k: 'decline', label: 'Decline', on: v === false, rec: !rec }], decided: v != null, required: true });
      return;
    }
    if (p.exp === Y) { // contract up on June 30
      const ext = p.ext, xw = extWindow(g, s, p), qoOk = qoEligible(g, p) && !p.optDeclined, qo = qoOk ? qoFor(g, p) : 0;
      const bird = birdOf({ ...p, birdTid: tid }, tid), hold = capHold(g, s, { ...p, birdTid: tid, prevAmt: p.amt, ...(qoOk ? { rfa: { tid, qo } } : {}) });
      const two = p.ctype === 'twoWay', canNow = xw.ok && !two, worth = g.fair(p.ovr), keep = worth >= p.amt * 0.8 || p.ovr >= 55;
      if (ext) { out.push({ pid: id, kind: 'expiring', head: 'Re-signed', detail: ext.yrs + ' years from ' + money(ext.amt) + ' (8% raises), starting ' + yl(Y + 1) + '.', status: 'Re-signed', choices: [], decided: true, required: true }); return; }
      const q = dec['qo' + id], re = dec['re' + id], let_ = dec['let' + id];
      const choices: Choice[] = [];
      if (canNow) choices.push({ k: 'resignNow', label: 'Re-sign now', on: false, rec: keep && !qoOk, title: 'Open his Contract tab and negotiate an extension now (before he hits the market)' });
      if (qoOk) choices.push({ k: 'qo', label: 'Qualifying offer (' + money(qo) + ')', on: q === true, rec: keep, title: 'He becomes a restricted free agent: you can match any offer sheet, and re-sign him with Bird rights' });
      else choices.push({ k: 'resignFA', label: 'Re-sign in free agency', on: re === true, rec: keep && !canNow, title: 'Keep his Bird rights and cap hold; negotiate with him once free agency opens' });
      choices.push({ k: 'let', label: 'Don’t re-sign', on: let_ === true, rec: !keep, title: 'Renounce his rights: he’s an unrestricted free agent and his cap hold comes off your books' });
      out.push({ pid: id, kind: 'expiring', head: (p.ctype === 'twoWay' ? 'Two-way contract' : 'Contract') + ' expires June 30 · ' + money(p.amt) + ' this season',
        detail: (bird ? BIRD_LABEL[bird] + ' rights' : 'No Bird rights') + ' · cap hold ' + money(hold) + (qoOk ? ' · qualifying offer ' + money(qo) + ' makes him restricted' : '') + '. ' + (canNow ? 'He can be re-signed now (an extension) or in free agency.' : two ? 'Two-way deals can’t be extended: re-sign him in free agency.' : p.rookieScale ? 'His rookie-scale extension window has closed: re-sign him in free agency' + (qoOk ? ', ideally as a restricted free agent.' : '.') : 'Too soon since he signed for an extension: re-sign him in free agency.'),
        status: q === true ? 'Qualifying offer' : re === true ? 'Re-sign in free agency' : let_ === true ? 'Letting him go' : 'Undecided', choices, decided: q === true || re === true || let_ === true, required: true });
      return;
    }
    // Entering the final year: the extension window opens July 6.
    if (p.exp === Y + 1 && !p.ext && p.ctype !== 'twoWay' && p.ctype !== 'ex10') {
      const v = dec['ext' + id], xw = extWindow(g, s, p);
      out.push({ pid: id, kind: 'extend', head: 'Final season next year · ' + money(g.salAt(p, Y + 1)),
        detail: xw.ok ? 'Extension-eligible now.' : 'Extensions open July 6 (day 6 of free agency) if he’s eligible. Choose Extend and you’ll get a reminder then.',
        status: v === true ? 'Extend' : v === false ? 'Not extending' : 'No plan yet',
        choices: [{ k: 'extend', label: 'Extend', on: v === true, rec: p.ovr >= 58 && p.age <= 30 }, { k: 'noext', label: 'Don’t extend', on: v === false }], decided: v != null, required: false });
    }
  });
  const ord = { teamOpt: 0, expiring: 1, extend: 2 };
  return out.sort((a, b) => ord[a.kind] - ord[b.kind] || P[b.pid].ovr - P[a.pid].ovr);
}
export const preFAPending = (g: Game, s: any, tid: number) => preFARows(g, s, tid).filter(r => r.required && !r.decided).length;

// A choice from the Pre-Free Agency screen (re-signing now happens in the player's Contract tab).
export function preFAChoose(g: Game, pid: number, k: string) {
  g.setState(s => {
    const d = { ...(s.decide || {}) };
    const clear = () => { delete d['qo' + pid]; delete d['re' + pid]; delete d['let' + pid]; };
    if (k === 'exercise') d['opt' + pid] = true; else if (k === 'decline') d['opt' + pid] = false;
    else if (k === 'qo') { clear(); d['qo' + pid] = true; }
    else if (k === 'resignFA') { clear(); d['re' + pid] = true; }
    else if (k === 'let') { clear(); d['let' + pid] = true; d['qo' + pid] = false; }
    else if (k === 'extend') d['ext' + pid] = true; else if (k === 'noext') d['ext' + pid] = false;
    return { decide: d };
  });
}

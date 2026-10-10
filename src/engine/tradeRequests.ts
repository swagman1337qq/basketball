// Trade requests: a player on one of your teams who has had enough of one thing asks out. It only
// happens when his mood is low (moodOf) mostly because of that one thing, and the thing fits who he is:
//   win    — a Winning (or legacy-chasing) player after years of losing with you: he names the best teams;
//   ball   — a Playing time player (or an alpha, or one who wants touches) stuck in a small role: he
//            names teams where he'd start, or be the first or second option;
//   money  — a Money player who feels underpaid: he names the teams with the most cap room;
//   market — a Fame player in a small market: he names the biggest markets;
//   ext    — in the last year of his deal with no extension offered: extend him at his price, or he
//            walks in free agency.
// He only names AI teams that would actually want him (tradeLogic.teamGain). Trade him (or, for an
// extension ultimatum, extend him) by the deadline; if you don't, his mood drops hard for this season and
// the next, and if his contract is expiring he won't re-sign with you (p.noResign). One request a season.
import type { Game } from './Game';
import { DAY, extWindow, nums } from './cba';
import { fmtMoney as money } from './capModel';
import { addNotice } from './preFA';
import { teamGain } from './tradeLogic';
import { addTx } from './txlog';

export type ReqCause = 'win' | 'ball' | 'money' | 'market' | 'ext';
export interface TradeRequest { season: number; day: number; tid: number; cause: ReqCause; teams: number[]; ask?: { amt: number; years: number }; status: 'open' | 'traded' | 'extended' | 'ignored'; by?: number }

const GROUP: Record<ReqCause, string[]> = {
  win: ['Team success', 'Chasing a legacy', 'Years of losing'],
  ball: ['Coming off the bench', 'Barely playing', 'Wants to be the No. 1 option', 'Wants the ball more'],
  money: ['Feels underpaid'],
  market: ['Market size'],
  ext: ['No extension offered', 'Feels underpaid'],
};
const EXT_LAST_GAME = 70; // extension ultimatums come before the last dozen games

// Straight losing seasons he has spent with this team, counting this one once it's a losing season
// (25+ games in, under .450).
export function losingYears(g: Game, s: any, tid: number, p: any): number {
  const T = s.teams[tid]; if (!T) return 0;
  const inSeason = ['regular', 'playin', 'playoffs'].includes(s.phase), gp = T.w + T.l, now = inSeason && gp >= 25 && T.w / gp < 0.45;
  const before = Math.max(0, (p.yrsWith || 0) - (inSeason ? 1 : 0)); // seasons here before this one (yrsWith counts the current season)
  let n = 0;
  for (const h of s.history || []) {
    if (n >= before) break;
    const r = h.teams?.[tid]; if (!r) break;
    const [w, l] = r.w != null ? [r.w, r.l] : String(r.rec || '').split(/[–-]/).map(Number);
    if (!(w < l)) break; n++;
  }
  return inSeason ? (now ? n + 1 : 0) : n;
}
const winPct = (g: Game, s: any, tid: number) => { const T = s.teams[tid], gp = T.w + T.l; if (gp >= 20) return T.w / gp; const h = (s.history || [])[0]?.teams?.[tid]; if (!h) return 0.5; const [w, l] = h.w != null ? [h.w, h.l] : String(h.rec || '').split(/[–-]/).map(Number); return w + l ? w / (w + l) : 0.5; };

// What he'd ask to extend now: above his value, he's unhappy (the same ask the Contract tab uses, at its unhappy end).
export function extAsk(g: Game, p: any): { amt: number; years: number } {
  const m = p.pers?.mot, amt = +(g.fair(p.ovr) * (m === 'Money' ? 1.15 : 1.05) * 1.2).toFixed(2);
  return { amt, years: m === 'Money' && p.age >= 30 ? 4 : p.age >= 33 ? 2 : 3 };
}

// Which of his complaints, if any, is bad enough to ask out over, and fits who he is.
function causeOf(g: Game, s: any, tid: number, p: any, hap: number, factors: [string, number][]): ReqCause | null {
  if (hap >= 35) return null;
  const neg = factors.filter(f => f[1] < 0), total = neg.reduce((a, f) => a + f[1], 0); if (total > -10) return null;
  const sum = (c: ReqCause) => neg.filter(f => GROUP[c].includes(f[0])).reduce((a, f) => a + f[1], 0);
  const m = p.pers?.mot, Y = g.Y, gp = g.gamesPlayed(s), expiring = p.exp === Y;
  const fits: Record<ReqCause, boolean> = {
    win: (m === 'Winning' || !!p.pers?.legacy) && losingYears(g, s, tid, p) >= (p.pers?.legacy || p.age >= 30 ? 3 : 4),
    ball: m === 'Playing time' || !!p.pers?.alpha || !!p.pers?.touches,
    money: m === 'Money' && !expiring && !p.rookie,
    market: m === 'Fame',
    ext: expiring && !p.ext && !p.rookieScale && p.ovr >= 52 && gp < EXT_LAST_GAME && extWindow(g, s, p).ok,
  };
  let best: ReqCause | null = null, bv = 0;
  (Object.keys(GROUP) as ReqCause[]).forEach(c => { if (!fits[c]) return; const v = sum(c); if (v <= -10 && v <= total * 0.4 && v < bv) { best = c; bv = v; } });
  if (best !== 'ext' && s.day >= DAY.TRADE_DEADLINE - 5) return null; // too close to the deadline to get a trade done: only an extension can fix it
  return best;
}

// AI teams that fit what he wants and would take him (for nothing in return, at least), best first; up to three.
export function destinations(g: Game, s: any, tid: number, p: any, cause: ReqCause): number[] {
  const P = g.db.P, Y = g.Y, CAP = nums(g).CAP, my = s.teams[tid], myPct = winPct(g, s, tid);
  const ai = s.teams.filter((t: any) => t.tid !== tid && !g.isUser(s, t.tid) && (s.rosters[t.tid] || []).length);
  const want = (t: number) => teamGain(g, s, t, [p.id], [], [], [], 0) > 3;
  const rankThere = (t: number) => (s.rosters[t] || []).filter((id: number) => P[id] && P[id].ovr > p.ovr).length; // 0 = he'd be their best player
  const room = (t: number) => CAP - (s.rosters[t] || []).reduce((a: number, id: number) => a + g.salAt(P[id], Y + 1), 0);
  const score: Record<ReqCause, (t: any) => number | null> = {
    win: t => { const w = winPct(g, s, t.tid); return w >= Math.max(0.55, myPct + 0.1) ? w : null; },
    ball: t => { const r = rankThere(t.tid), need = p.pers?.alpha || p.pers?.touches ? 1 : 4; return r <= need ? -r : null; },
    money: t => { const r = room(t.tid); return r > 0 ? r : null; },
    ext: t => { const r = room(t.tid); return r > 0 ? r : null; },
    market: t => (t.mkt > my.mkt + 0.05 ? t.mkt : null),
  };
  return ai.map((t: any) => ({ t: t.tid, v: score[cause](t) })).filter((x: any) => x.v != null).sort((a: any, b: any) => b.v - a.v)
    .filter((x: any) => want(x.t)).slice(0, 3).map((x: any) => x.t);
}

const teamName = (s: any, t: number) => s.teams[t].region + ' ' + s.teams[t].name;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' or ' + xs[xs.length - 1]);

function reasonLine(g: Game, s: any, p: any, r: TradeRequest): string {
  const tm = 'the ' + teamName(s, r.tid);
  if (r.cause === 'win') { const n = losingYears(g, s, r.tid, p); return 'After ' + n + ' straight losing seasons with ' + tm + ', he’s had enough. He wants to win now.'; }
  if (r.cause === 'ball') return p.pers?.alpha || p.pers?.touches ? 'He wants to be a first option, with the ball in his hands, and he doesn’t get that here.' : 'He wants a starting role and real minutes, and he doesn’t get them here.';
  if (r.cause === 'money') return 'He feels underpaid at ' + money(p.amt) + ' a year and wants to go where he can get paid.';
  if (r.cause === 'market') return 'He wants a bigger stage than ' + s.teams[r.tid].region + '.';
  return 'He’s in the last year of his deal and you haven’t offered an extension. His price: ' + money(r.ask!.amt) + ' a year for ' + r.ask!.years + ' years. Pay it, or he walks in free agency.';
}

// Daily, in season, on your teams: new requests, and open ones resolved (traded, extended, or ignored
// past the deadline). Returns the notices and the open-request list.
export function tradeRequestTick(g: Game, s: any, day: number, notices: any[]): { notices: any[]; treqs: number[] } {
  if (s.spectator) return { notices, treqs: [] };
  const P = g.db.P, Y = g.Y, gp = g.gamesPlayed(s), deadlinePast = day + 1 >= DAY.TRADE_DEADLINE, seasonOver = gp >= 82;
  let treqs: number[] = (s.treqs || []).filter((id: number) => P[id]?.treq?.status === 'open');
  // Open requests: traded, extended, or out of time.
  treqs = treqs.filter(id => {
    const p = P[id], r: TradeRequest = p.treq, now = g.tidOf(s.rosters, id);
    if (now !== r.tid) { r.status = 'traded'; r.by = now; return false; }
    if (r.cause === 'ext' && p.ext) { r.status = 'extended'; return false; }
    if (r.cause === 'ext' ? !seasonOver : !deadlinePast) return true;
    r.status = 'ignored';
    const walk = p.exp === Y; if (walk) p.noResign = { tid: r.tid, season: Y };
    addTx(g, s, p, { k: 'request', tid: r.tid, text: r.cause === 'ext' ? 'Wasn’t extended: says he’ll leave in free agency' : 'Trade request ignored' + (walk ? ': says he won’t re-sign' : '') });
    notices = addNotice({ notices }, { tone: 'bad', title: r.cause === 'ext' ? p.name + ' is done negotiating' : p.name + ' is still here, and unhappy', pids: [id], reqPid: id,
      lines: [r.cause === 'ext' ? 'You never met his price for an extension. He’ll play out the season, then leave in free agency: he won’t re-sign with the ' + teamName(s, r.tid) + '.'
        : 'The trade deadline passed and you kept him after he asked out. His mood has taken a big hit' + (walk ? ', and he won’t re-sign with you this summer.' : ' for this season and next.')] });
    return false;
  });
  // New requests: a few players a day get looked at, so a grievance has to last a while before it boils over.
  if (s.phase === 'regular' && gp >= 15 && !seasonOver) s.managed.forEach((tid: number) => {
    (s.rosters[tid] || []).forEach((id: number, idx: number) => {
      const p = P[id]; if (!p || p.treq?.season === Y || p.ovr < 45 || p.hapGod != null || ['twoWay', 'tenDay', 'hardship', 'ex10'].includes(p.ctype) || Math.random() > 0.12) return;
      const md = g.moodOf(p, idx, s, tid), cause = causeOf(g, s, tid, p, md.hap, md.factors as [string, number][]); if (!cause) return;
      if (Math.random() > (p.pers?.mot === 'Loyalty' && cause !== 'ext' ? 0.2 : p.pers?.pro ? 0.3 : 0.6)) return;
      const teams = destinations(g, s, tid, p, cause); if (!teams.length) return; // nobody he'd go to would take him: he grumbles, but doesn't ask
      const r: TradeRequest = { season: Y, day, tid, cause, teams, status: 'open', ...(cause === 'ext' ? { ask: extAsk(g, p) } : {}) };
      p.treq = r; treqs.push(id);
      addTx(g, s, p, { k: 'request', tid, text: cause === 'ext' ? 'Demanded an extension at his price (' + money(r.ask!.amt) + ' × ' + r.ask!.years + ') or he leaves in free agency' : 'Asked for a trade (wants ' + teams.map(t => s.teams[t].abbr).join(', ') + ')' });
      const dl = 'the trade deadline (' + g.fmtS(DAY.TRADE_DEADLINE) + ')';
      notices = addNotice({ notices }, { tone: 'bad', title: cause === 'ext' ? p.name + ': extend me or I walk' : p.name + ' wants out', pids: [id], reqPid: id,
        lines: [reasonLine(g, s, p, r),
          ...(cause !== 'ext' || s.day < DAY.TRADE_DEADLINE ? [(cause === 'ext' ? 'If you’d rather trade him, his camp says he’d welcome a move to the ' : 'He’d like to go to the ') + list(teams.map(t => teamName(s, t))) + ', and they’d want him.'] : ['Other teams are ready to pay him: ' + list(teams.map(t => 'the ' + teamName(s, t))) + ' have the room.']),
          (cause === 'ext' ? 'Extend him at his price (his Contract tab) before the regular season ends' + (s.day < DAY.TRADE_DEADLINE ? ', or trade him by ' + dl : '') + '. If you don’t, he won’t re-sign with you, and his mood sinks.' : 'Trade him by ' + dl + '. If you don’t, his mood sinks for this season and next' + (p.exp === Y ? ', and he won’t re-sign with you.' : '.'))] });
    });
  });
  return { notices, treqs };
}

// A request still in play or recently ignored, as mood factors (Game.moodOf).
export function requestFactors(g: Game, p: any, tid: number): [string, number][] {
  const r: TradeRequest | undefined = p.treq; if (!r || r.tid !== tid) return [];
  if (r.status === 'open') return [[r.cause === 'ext' ? 'Waiting on an extension' : 'Asked for a trade', -6]];
  if (r.status === 'ignored' && g.Y - r.season <= 1) return [['Trade request ignored', -18]];
  return [];
}

// He asked out and you kept him: he won't re-sign with that team the summer his deal runs out.
export const refusesTeam = (g: Game, p: any, tid: number) => !!p?.noResign && p.noResign.tid === tid && g.Y === p.noResign.season;

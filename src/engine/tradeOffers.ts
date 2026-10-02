// Trade offers on request. "Shop" your players: every AI team that wants them makes its best
// offer (one it would accept, that passes the league office). "Ask" another team what it wants
// for one of its players: it names every package from your roster it would take.
import type { Game } from './Game';
import { checkTrade } from './cba';
import { mulberry32 } from './rng';

export interface Offer { tid: number; mine: number[]; theirs: number[]; kMine: string[]; kTheirs: string[]; value: number; note: string }

const usedPick = (g: Game, s: any, a: any) => a.yr === g.Y && s.picks.some((x: any) => x.orig === a.orig && (x.rd || 1) === a.rd && x.pid) && !g.draftRights(a, s);
const assetsOf = (g: Game, s: any, tid: number) => s.assets.filter((a: any) => a.owner === tid && !usedPick(g, s, a));

// Every single, pair and trio from a roster, each alone or with a pick or two (plus picks alone).
function combosOf(R: number[], picks: string[], seed: number) {
  const r = mulberry32(seed), combos: { p: number[]; k: string[] }[] = [];
  const addK = (p: number[]) => { combos.push({ p, k: [] }); if (picks.length) { combos.push({ p, k: [picks[Math.floor(r() * picks.length)]] }); if (picks.length > 1) { const a = Math.floor(r() * picks.length), b = (a + 1 + Math.floor(r() * (picks.length - 1))) % picks.length; combos.push({ p, k: [picks[a], picks[b]] }); } } };
  for (let i = 0; i < R.length; i++) { addK([R[i]]); for (let j = i + 1; j < R.length; j++) { addK([R[i], R[j]]); for (let k = j + 1; k < R.length; k++) addK([R[i], R[j], R[k]]); } }
  picks.forEach(k => combos.push({ p: [], k: [k] }));
  return combos;
}

// Same judgement as Game.evalTrade (the AI team's view), with values cached per player/pick
// because offers try thousands of packages.
function evaluator(g: Game, s: any, tid: number) {
  const st = g.strategies(s.teams)[tid] || 'middle', P = g.db.P, vp = new Map<number, number>(), vk = new Map<string, number>();
  const pv = (id: number) => { let v = vp.get(id); if (v == null) { v = g.pVal(P[id], st, tid); vp.set(id, v); } return v; }; // through this team's own scouts
  const kv = (id: string, giving: boolean) => { const key = id + (giving ? '+' : '-'); let v = vk.get(key); if (v == null) { v = g.kVal(s.assets.find((a: any) => a.id === id), st, giving, s.teams); vk.set(key, v); } return v; };
  return (mine: number[], theirs: number[], kMine: string[], kTheirs: string[]) => {
    const recv = mine.reduce((a, id) => a + pv(id), 0) + kMine.reduce((a, id) => a + kv(id, false), 0), give = theirs.reduce((a, id) => a + pv(id), 0) + kTheirs.reduce((a, id) => a + kv(id, true), 0);
    return recv - give >= Math.max(1, Math.abs(give) * 0.06);
  };
}
function myValuer(g: Game, s: any) {
  const st = g.strategies(s.teams)[s.me] || 'middle', P = g.db.P, cache = new Map<string, number>();
  const one = (key: string, f: () => number) => { let v = cache.get(key); if (v == null) { v = f(); cache.set(key, v); } return v; };
  return (ids: number[], kids: string[], giving: boolean) => ids.reduce((a, id) => a + one('p' + id, () => g.pVal(P[id], st, s.me)), 0) + kids.reduce((a, id) => a + one('k' + id + giving, () => g.kVal(s.assets.find((x: any) => x.id === id), st, giving, s.teams)), 0);
}

// Offers for your players/picks from every AI team that can make one it would accept (0 to 29),
// best for you first.
export function shopOffers(g: Game, s: any, mine: number[], kMine: string[]): Offer[] {
  const mvF = myValuer(g, s), out: Offer[] = [], giveV = mvF(mine, kMine, true), gd = { ...s, god: false };
  const myStrat = g.strategies(s.teams)[s.me] || 'middle';
  // Your least valuable players, for when the rules need you to add one (full roster, salary matching).
  const throwIns = (s.rosters[s.me] || []).filter((id: number) => !mine.includes(id)).sort((a: number, b: number) => g.pVal(g.db.P[a], myStrat) - g.pVal(g.db.P[b], myStrat)).slice(0, 4);
  s.teams.forEach((t: any) => {
    const tid = t.tid; if (tid === s.me || g.isUser(s, tid)) return;
    const ev = evaluator(g, s, tid), roster: number[] = s.rosters[tid] || [], picks = assetsOf(g, s, tid).map((a: any) => a.id);
    const combos = combosOf(roster, picks, tid * 7919 + s.day * 31 + mine.length);
    const tryWith = (send: number[]) => {
      const extra = mvF(send.filter(id => !mine.includes(id)), [], true);
      const cands = combos.filter(c => ev(send, c.p, kMine, c.k)).map(c => ({ ...c, mv: mvF(c.p, c.k, false) - extra }))
       .sort((a, b) => b.mv - a.mv);
      const best = cands.find(c => checkTrade(g, gd, s.me, tid, send, c.p, kMine, c.k).ok);
      return best ? { ...best, send } : null;
    };
    let best: any = tryWith(mine);
    for (let i = 0; !best && i < throwIns.length; i++) best = tryWith([...mine, throwIns[i]]);
    if (!best) return;
    out.push({ tid, mine: best.send, theirs: best.p, kMine, kTheirs: best.k, value: best.mv, note: (best.mv >= giveV * 0.95 ? 'Strong offer' : best.mv >= giveV * 0.75 ? 'Fair offer' : 'Lowball') + (best.send.length > mine.length ? ' · they need you to add ' + g.db.P[best.send[best.send.length - 1]].name : '') });
  });
  return out.sort((a, b) => b.value - a.value);
}

// What a team wants from your roster for its players/picks: every package it would take (each
// built around a different player of yours), cheapest for you first.
export function askOffers(g: Game, s: any, tid: number, theirs: number[], kTheirs: string[]): Offer[] {
  const ev = evaluator(g, s, tid), mvF = myValuer(g, s), gd = { ...s, god: false }, roster: number[] = s.rosters[s.me] || [], picks = assetsOf(g, s, s.me).map((a: any) => a.id);
  const combos = combosOf(roster, picks, tid * 104729 + s.day * 17 + theirs.length);
  // Over the apron they can't take back more salary than they send, so they may add a small
  // contract of their own to make the money work (their least valuable players).
  const fill = (s.rosters[tid] || []).filter((id: number) => !theirs.includes(id)).sort((a: number, b: number) => g.pVal(g.db.P[a], g.strategies(s.teams)[tid]) - g.pVal(g.db.P[b], g.strategies(s.teams)[tid])).slice(0, 5);
  const cands: any[] = [];
  combos.forEach(c => [[], ...fill.map((f: number) => [f])].forEach(extra => { const th = [...theirs, ...extra]; if (ev(c.p, th, c.k, kTheirs)) cands.push({ ...c, th, mv: mvF(c.p, c.k, true) - mvF(extra, [], false) }); }));
  cands.sort((a, b) => a.mv - b.mv);
  const out: Offer[] = [], used = new Set<string>();
  for (const c of cands) {
    const lead = c.p.length ? 'p' + c.p.slice().sort((a: number, b: number) => g.db.P[b].ovr - g.db.P[a].ovr)[0] : 'k' + c.k[0];
    if (used.has(lead)) continue; // a different centerpiece for each option
    if (!checkTrade(g, gd, s.me, tid, c.p, c.th, c.k, kTheirs).ok) continue;
    used.add(lead); out.push({ tid, mine: c.p, theirs: c.th, kMine: c.k, kTheirs, value: -c.mv, note: 'Option ' + (out.length + 1) });
  }
  return out;
}

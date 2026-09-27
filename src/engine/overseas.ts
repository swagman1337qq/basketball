// Overseas market and scouting investment: league-strength translation of stats
// abroad, buyout negotiations with foreign clubs, hidden confidence, and the
// scouting intel that narrows report margins the longer a scout watches a prospect.
import type { Game } from './Game';

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// How a point scored in each league translates to the NBA (1.0 = NBA).
export const LEAGUE_STR: Record<string, number> = {
  EuroLeague: 0.62, 'Liga ACB': 0.55, 'Basketbol Süper Ligi': 0.52, 'Greek Basket League': 0.48, 'ABA League': 0.5, LKL: 0.47, 'LNB Élite': 0.5, BBL: 0.48,
  'Lega Basket Serie A': 0.5, NBL: 0.5, CBA: 0.42, 'B.League': 0.44, 'KBL': 0.4, 'Israeli Premier League': 0.47,
  NBB: 0.42, 'Liga Nacional': 0.42, LNBP: 0.36, PBA: 0.36, Korisliiga: 0.4, 'Super League Basketball': 0.38, 'Latvian-Estonian League': 0.42, 'Georgian Superleague': 0.36,
  'Basketball Africa League': 0.38, 'Angolan Unitel League': 0.33, 'Superliga Venezuela': 0.34, 'Liga Uruguaya': 0.33,
};
export const leagueStr = (lg: string) => LEAGUE_STR[lg] ?? 0.45;

// Projected NBA line for a player abroad, in a ~20-minute role, plus a rating band
// whose width depends on how well you scout his region.
export function translation(g: Game, s: any, p: any) {
  const a = p.abroad || {}, f = leagueStr(a.lg), role = 0.62;
  const margin = s.god ? 0 : Math.round(3 * g.regFactor(p, s) / intelF(s, p.id));
  return {
    str: f, pts: +(a.pts * f * role * 1.35).toFixed(1), reb: +(a.reb * (0.55 + f * 0.5) * role).toFixed(1), ast: +(a.ast * (0.5 + f * 0.5) * role).toFixed(1),
    lo: Math.max(25, p.ovr - margin), hi: p.ovr + margin, margin,
    line: 'Projects to ' + (a.pts * f * role * 1.35).toFixed(1) + ' pts, ' + (a.reb * (0.55 + f * 0.5) * role).toFixed(1) + ' reb in ~20 NBA minutes',
  };
}

// ── Buyouts ──────────────────────────────────────────────────────────────────────
// The club's asking price is public (`fee`); its walk-away floor is hidden and set the
// first time you negotiate. Up to $0.85M of any buyout is exempt from the cap.
export const BUYOUT_EXEMPT = 0.85;
function floorOf(p: any) { const a = p.abroad; if (a.floor == null) a.floor = +(a.fee * (0.6 + Math.random() * 0.3)).toFixed(2); return a.floor; }
export function negotiateBuyout(g: Game, pid: number, offer: number, withPick: boolean) {
  const p = g.db.P[pid], a = p.abroad; if (!a || a.clause !== 'Buyout') return null;
  const s = g.state, Y = g.Y;
  if (a.walked === Y) return { ok: false, msg: a.club + ' have ended talks until next season.' };
  const pickVal = withPick ? 1.0 : 0, floor = floorOf(p);
  const second = withPick ? s.assets.find(k => k.owner === s.me && k.rd === 2 && k.yr > Y) || s.assets.find(k => k.owner === s.me && k.rd === 2) : null;
  if (withPick && !second) return { ok: false, msg: 'You have no second-round pick to include.' };
  a.tries = (a.tries || 0) + 1;
  if (offer + pickVal >= floor) {
    a.agreed = +offer.toFixed(2); a.fee = a.agreed; a.clause = 'Buyout agreed';
    const assets = second ? s.assets.map(k => (k.id === second.id ? { ...k, owner: -1 } : k)) : s.assets;
    g.setState(st => ({ assets, log: g.logEntry(st, 'Agreed a $' + a.agreed.toFixed(2) + 'M buyout with ' + a.club + ' for ' + p.name + (second ? ' (plus ' + g.pickLabel(second, st.teams) + ')' : '')) }));
    return { ok: true, msg: a.club + ' accept $' + a.agreed.toFixed(2) + 'M' + (second ? ' and the pick' : '') + '. ' + p.name + ' is free to sign.' };
  }
  if (a.tries >= 3) { a.walked = Y; g.setState({ gv: (s.gv || 0) + 1 }); return { ok: false, msg: a.club + ' walk away. Try again next season.' }; }
  const counter = +((floor + a.fee) / 2).toFixed(2);
  a.fee = counter; g.setState({ gv: (s.gv || 0) + 1 });
  return { ok: false, msg: a.club + ' counter at $' + counter.toFixed(2) + 'M. ' + (3 - a.tries) + ' offer' + (3 - a.tries === 1 ? '' : 's') + ' left before they walk away.' };
}

// ── Confidence ───────────────────────────────────────────────────────────────────
// Hidden 0–100. Heavy minutes and a big role grow it (abroad especially); sitting drains it.
export function confidenceTick(g: Game, s: any, rosters: any) {
  const P = g.db.P;
  Object.keys(rosters).forEach(k => rosters[k].forEach(id => { const p = P[id]; if (p.conf == null) p.conf = 50;
    const m = p.min || 0; p.conf = cl(p.conf + (m >= 28 ? 2 : m >= 20 ? 1 : m < 8 && p.age >= 22 ? -1.5 : 0) + (p.dev ? 1.5 : 0), 5, 95); }));
  (s.overseas || []).forEach(id => { const p = P[id]; if (p.conf == null) p.conf = 45; p.conf = cl(p.conf + (p.abroad && p.abroad.pts >= 14 ? 4 : 2.5), 5, 95); });
}
// Adjustment period on returning from abroad: 15 games, shorter for confident players.
export const adjustGames = (p: any) => Math.round(cl(15 - ((p.conf ?? 50) - 50) / 6, 9, 18));

// ── Scouting investment ──────────────────────────────────────────────────────────
// Each month an assigned scout adds intel on every prospect in his region (more with
// skill, specialty and budget); focused prospects get triple. Margins divide by intelF.
export function intelF(s: any, pid: number) { const v = (s.intel || {})[pid] || 0; return 1 + Math.min(v, 12) / 6; }
export function scoutTick(g: Game, s: any, overseas: number[]) {
  const P = g.db.P, intel = { ...(s.intel || {}) }, budget = s.budget?.Scouting ?? 4, bF = 0.6 + budget / 10;
  const pros = [g.Y, g.Y + 1, g.Y + 2].flatMap(y => g.db.cls[y] || []).concat(overseas || []);
  // Each prospect's region, and how many prospects share it (computed once, not per prospect).
  const regOf = new Map<number, string>(), perReg: Record<string, number> = {};
  pros.forEach(id => { const p = P[id], reg = g.regionKey((p.from && p.from.country) || p.raised); regOf.set(id, reg); perReg[reg] = (perReg[reg] || 0) + 1; });
  pros.forEach(id => { const reg = regOf.get(id)!;
    const sc = (s.scouts || []).filter(x => x.assign === reg); if (!sc.length) return;
    const gain = sc.reduce((a, x) => a + (x.spec === reg ? 1 : 0.6) * (0.5 + x.skill * 0.15), 0) * bF * ((s.scoutFocus || []).includes(id) ? 3 : 1) / Math.max(1, perReg[reg] / 8);
    intel[id] = +Math.min(12, (intel[id] || 0) + gain).toFixed(2); });
  // Players a scout follows personally (right-click → assign on the draft board): much faster than
  // regional coverage, split between everyone he follows, better in his own region.
  const asg: Record<number, string> = s.scoutAssign || {}, load: Record<string, number> = {};
  Object.values(asg).forEach(n => (load[n] = (load[n] || 0) + 1));
  Object.entries(asg).forEach(([k, n]) => { const id = +k, p = P[id], x = (s.scouts || []).find((y: any) => y.name === n); if (!p || !x || p.retired) return;
    const reg = g.regionKey((p.from && p.from.country) || p.raised), per = (x.spec === reg ? 1.3 : 0.9) * (0.5 + x.skill * 0.15) * bF * 2.4 / Math.sqrt(load[n]);
    intel[id] = +Math.min(12, (intel[id] || 0) + per).toFixed(2); });
  // Players on the scouting list outside the draft/overseas pools (NBA players, free agents):
  // the best pro scout adds intel every month.
  const best = Math.max(0, ...(s.scouts || []).map((x: any) => x.skill));
  (s.scoutList || []).filter((id: number) => !pros.includes(id) && P[id] && !P[id].retired).forEach((id: number) => { intel[id] = +Math.min(12, (intel[id] || 0) + (1 + best * 0.3) * bF).toFixed(2); });
  return intel;
}

// Personal scouting: which scout follows which players. Each scout can follow PERSONAL_MAX at once.
export const PERSONAL_MAX = 8;
export function assignScout(g: Game, name: string, ids: number[]): string {
  let msg = '';
  g.setState((st: any) => {
    // Players you assign by hand always win: they bump the scout's own brief picks (scoutBrief.ts)
    // and only your hand-picked players count against his limit.
    const asg = { ...(st.scoutAssign || {}) }, picks = { ...(st.briefPicks || {}) };
    const manual = () => Object.keys(asg).filter(k => asg[+k] === name && !picks[+k]).length;
    const add = ids.filter(id => asg[id] !== name || picks[id]), room = Math.max(0, PERSONAL_MAX - manual()), take = add.slice(0, room);
    take.forEach(id => { asg[id] = name; delete picks[id]; });
    const auto = Object.keys(picks).filter(k => picks[+k].by === name);
    while (Object.values(asg).filter(n => n === name).length > PERSONAL_MAX && auto.length) { const k = +auto.pop()!; delete picks[k]; delete asg[k]; }
    msg = take.length ? name + ' will follow ' + take.length + ' player' + (take.length === 1 ? '' : 's') + ' personally' + (add.length > take.length ? '; ' + (add.length - take.length) + ' not added (a scout can follow ' + PERSONAL_MAX + ' you picked at a time)' : '') + '.' : name + ' is already following ' + PERSONAL_MAX + ' players you picked. Free him up first.';
    return { scoutAssign: asg, briefPicks: picks }; });
  return msg;
}
export function unassignScout(g: Game, ids: number[]) {
  g.setState((st: any) => { const asg = { ...(st.scoutAssign || {}) }, picks = { ...(st.briefPicks || {}) }; ids.forEach(id => { delete asg[id]; delete picks[id]; }); return { scoutAssign: asg, briefPicks: picks }; });
}

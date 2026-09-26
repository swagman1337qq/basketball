// Contracts in practice: signing (every method in cba.ts), whether a player accepts,
// how AI teams sign, and waiving (dead money, the stretch provision, buyouts, claims).
import type { Game } from './Game';
import { birdOf, capRoom, capState, DAY, exceptionsOf, freshExceptions, nums, signingMethods, stdIds, teamSalary, yosOf, deadSchedule, type Method } from './cba';

export interface Terms { method: string; amt: number; years: number; opt?: 'player' | 'team' | null; inc?: any[]; kicker?: number; ntc?: boolean }

// First season a new contract covers: next season during the offseason, else this one.
export const firstSeason = (g: Game, s: any) => (['fa', 'draft', 'lottery', 'playoffs', 'playin'].includes(s.phase) && s.phase !== 'regular' && s.phase !== 'preseason' ? g.Y + 1 : g.Y);

export function prefYears(p: any) { return p.age <= 24 ? 4 : p.age <= 29 ? 3 : p.age <= 32 ? 2 : 1; }

// Does the player sign? He wants at least his asking price per year; options, kickers and
// no-trade clauses sweeten a deal, years far from what he wants sour it.
export function acceptance(g: Game, s: any, tid: number, p: any, t: Terms) {
  const N = nums(g), yos = yosOf(g, p), minS = N.min(yos);
  const askBase = s.me === tid ? g.askFor(p, s) : p.ask || minS;
  if (['twoWay', 'ex10', 'tenDay', 'hardship'].includes(t.method)) return { ok: p.ovr < 52 || askBase <= minS * 1.3, ask: minS, why: p.ovr >= 52 ? 'He expects a real NBA contract.' : '' };
  const pref = prefYears(p), yrGap = Math.abs(t.years - pref);
  const value = t.amt * (1 + (t.opt === 'player' ? 0.06 : t.opt === 'team' ? -0.06 : 0) + (t.kicker || 0) * 0.25 + (t.ntc ? 0.04 : 0)) * (1 - Math.max(0, yrGap - 1) * 0.04) * (t.method === 'bird' ? 1.03 : 1);
  const ask = +Math.max(minS, askBase).toFixed(2);
  return { ok: value >= ask - 0.01, ask, why: value >= ask - 0.01 ? '' : 'He’s looking for about ' + ask.toFixed(2) + 'M a year' + (yrGap > 1 ? ' over ' + pref + ' years' : '') + '.' };
}

// Apply a signing to mutable copies (rosters, fa, overseas, cap map). Returns a log line.
export function applySigning(g: Game, s: any, box: { rosters: any; fa: number[]; overseas: number[]; cap: any }, tid: number, p: any, t: Terms) {
  const N = nums(g), Y1 = firstSeason(g, s), yos = yosOf(g, p), minS = N.min(yos);
  const cap = { ...(box.cap[tid] || {}) }, exc = { ...(cap.exc || freshExceptions(g)), used: [...((cap.exc || {}).used || [])] };
  const prevTid = p.birdTid;
  // Contract terms.
  p.prevAmt = p.amt; p.amt = +t.amt.toFixed(2); p.inc = (t.inc || []).map(x => ({ ...x }));
  p.exp = Y1 + Math.max(1, t.years) - 1; p.raise = t.method === 'bird' ? 0.08 : ['min', 'twoWay', 'ex10', 'tenDay', 'hardship', 'dpe'].includes(t.method) ? 0 : 0.05;
  p.opt = t.opt && t.years >= 2 ? { kind: t.opt, season: p.exp } : undefined; p.kicker = t.kicker || 0; p.ntc = !!t.ntc;
  p.ctype = t.method === 'twoWay' ? 'twoWay' : t.method === 'ex10' ? 'ex10' : t.method === 'tenDay' ? 'tenDay' : t.method === 'hardship' ? 'hardship' : t.amt >= N.max(yos) - 0.05 ? 'max' : t.amt <= minS * 1.02 ? 'min' : 'standard';
  p.capOverride = t.method === 'twoWay' ? 0 : t.method === 'min' && t.years === 1 && yos >= 2 ? N.min(2) : undefined; // two-ways are off the cap; one-year veteran minimums count as the 2-year minimum
  if (s.phase === 'regular' && s.day > DAY.PLAYOFF_WAIVE && p.waived?.season === g.Y) p.poIneligible = g.Y; // waived after March 1: not playoff-eligible elsewhere
  delete p.waived;
  p.signed = { season: Y1, day: s.day, phase: s.phase, tid, method: t.method };
  if (t.method !== 'bird') { if (prevTid != null && prevTid !== tid) p.leftAsFA = true; p.yrsWith = 0; }
  p.birdTid = null; delete p.rfa; p.rookie = false; delete p.rookieScale;
  if (t.method === 'tenDay' || t.method === 'hardship') { p.tenDay = { tid, start: s.day }; p.tenDayWith = { ...(p.tenDayWith || {}), [tid]: ((p.tenDayWith || {})[tid] || 0) + (t.method === 'tenDay' ? 1 : 0) }; }
  // Where he goes.
  box.fa.splice(0, box.fa.length, ...box.fa.filter(x => x !== p.id));
  box.overseas.splice(0, box.overseas.length, ...box.overseas.filter(x => x !== p.id));
  if (t.method === 'twoWay') p.twoWay = { tid, games: 0 }; else delete p.twoWay;
  box.rosters[tid] = [...(box.rosters[tid] || []).filter(x => x !== p.id), p.id];
  // Exceptions and hard caps.
  if (['cap', 'room', 'ntmle', 'tpmle', 'bae'].includes(t.method)) { if (!exc.used.includes(t.method)) exc.used.push(t.method); if (exc[t.method] != null) exc[t.method] = Math.max(0, +(exc[t.method] - t.amt).toFixed(2)); }
  if (t.method === 'bae') cap.baeLast = Y1;
  if (t.method === 'ntmle' || t.method === 'bae') cap.hardCap = 'AP1';
  if (t.method === 'tpmle' && cap.hardCap !== 'AP1') cap.hardCap = 'AP2';
  if (t.method === 'dpe') cap.dpe = null;
  cap.exc = exc; box.cap[tid] = cap;
  const T = s.teams[tid];
  return T.region + ' ' + T.name + ' signed ' + p.name + ' · ' + describe(g, t, p) ;
}
function describe(g: Game, t: Terms, p: any) {
  const lab: Record<string, string> = { cap: 'cap space', bird: 'Bird rights', ntmle: 'non-taxpayer mid-level', tpmle: 'taxpayer mid-level', room: 'room exception', bae: 'bi-annual exception', min: 'minimum', twoWay: 'two-way contract', ex10: 'Exhibit 10', tenDay: '10-day contract', hardship: 'hardship exception', dpe: 'disabled player exception', offer: 'offer sheet', rookie: 'rookie scale' };
  return (t.method === 'twoWay' || t.method === 'tenDay' || t.method === 'ex10' ? '' : '$' + t.amt.toFixed(2) + 'M × ' + t.years + ' yr' + (t.years === 1 ? '' : 's') + ' through ' + p.exp + ' ') + '(' + (lab[t.method] || t.method) + ')' + (p.opt ? ', ' + p.opt.kind + ' option' : '');
}

// Can this signing go through? (Validates against the CBA methods.)
export function validateSigning(g: Game, s: any, tid: number, p: any, t: Terms): { ok: boolean; why?: string; m?: Method } {
  if (s.god) return { ok: true };
  const m = signingMethods(g, s, tid, p).find(x => x.key === t.method);
  if (!m) return { ok: false, why: 'That signing method isn’t available.' };
  if (!m.ok) return { ok: false, why: m.why || 'Not available', m };
  if (t.amt > m.maxFirst + 0.005) return { ok: false, why: m.label + ' allows at most ' + m.maxFirst.toFixed(2) + 'M in the first year.', m };
  const minS = nums(g).min(yosOf(g, p));
  if (!['twoWay', 'tenDay', 'hardship'].includes(t.method) && t.amt < minS - 0.005) return { ok: false, why: 'Below his minimum salary (' + minS.toFixed(2) + 'M for ' + yosOf(g, p) + ' years of service).', m };
  if (m.maxYears > 0 && (t.years < 1 || t.years > m.maxYears)) return { ok: false, why: m.label + ' allows 1–' + m.maxYears + ' years' + (m.maxYears < 4 && p.age >= 35 ? ' (over-38 rule)' : '') + '.', m };
  if (t.method === 'bird' && birdOf(p, tid) === 'early' && t.years < 2) return { ok: false, why: 'Early Bird contracts must be at least 2 years.', m };
  if (t.ntc && !(yosOf(g, p) >= 8 && t.method === 'bird' && (p.yrsWith || 0) >= 4)) return { ok: false, why: 'No-trade clauses need 8+ years of service and 4+ years with your team (re-signing with Bird rights).', m };
  if (t.kicker && (t.kicker < 0 || t.kicker > 0.15)) return { ok: false, why: 'Trade kickers are 0–15%.', m };
  // Hard cap after signing.
  const cs = capState(s, tid), N = nums(g), after = teamSalary(g, s, tid) + (t.method === 'twoWay' ? 0 : t.amt), hc = m.hardCap || cs.hardCap;
  if (hc === 'AP1' && after > N.AP1) return { ok: false, why: 'This would put you over the 1st apron, where you’re hard-capped.', m };
  if (hc === 'AP2' && after > N.AP2) return { ok: false, why: 'This would put you over the 2nd apron, where you’re hard-capped.', m };
  return { ok: true, m };
}

// How an AI team would sign a player now (or null).
export function aiTerms(g: Game, s: any, tid: number, p: any): Terms | null {
  const N = nums(g), yos = yosOf(g, p), minS = N.min(yos), ask = Math.max(minS, p.ask || minS), yrs = Math.min(prefYears(p), 4);
  const ms = signingMethods(g, s, tid, p).filter(m => m.ok && !['twoWay', 'ex10', 'tenDay', 'hardship', 'offer'].includes(m.key));
  const room = capRoom(g, s, tid);
  const pick = (k: string) => ms.find(m => m.key === k);
  if (pick('bird') && ask <= pick('bird')!.maxFirst) return { method: 'bird', amt: ask, years: Math.min(yrs + 1, pick('bird')!.maxYears) };
  if (room >= ask && pick('cap')) return { method: 'cap', amt: ask, years: Math.min(yrs, 4) };
  for (const k of ['ntmle', 'tpmle', 'bae', 'room']) { const m = pick(k); if (m && ask <= m.maxFirst) return { method: k, amt: ask, years: Math.min(yrs, m.maxYears) }; }
  if (ask <= minS * 1.25 && pick('min')) return { method: 'min', amt: minS, years: Math.min(2, yrs) };
  return null;
}

// Waive a player. 'waive': remaining guaranteed salary stays on the cap as dead money in the
// seasons it was due; 'stretch': spread over twice the remaining years plus one; 'buyout': he
// gives back part of what he's owed first. A team under the cap may claim him off waivers.
export function waivePlayer(g: Game, s: any, box: { rosters: any; fa: number[]; cap: any }, tid: number, p: any, mode: 'waive' | 'stretch' | 'buyout' = 'waive', giveBack = 0) {
  const T = s.teams[tid], lines: string[] = [];
  const amts = deadSchedule(g, s, p, mode === 'stretch', mode === 'buyout' ? giveBack : 0);
  box.rosters[tid] = (box.rosters[tid] || []).filter(x => x !== p.id);
  const cap = { ...(box.cap[tid] || {}) };
  // Waiver claim: an AI team with room for the whole contract takes it over (no dead money).
  const claimant = s.teams.filter(t => t.tid !== tid && !g.isUser(s, t.tid) && stdIds(g, box.rosters[t.tid] || []).length < 15 && capRoom(g, { ...s, rosters: box.rosters }, t.tid) >= p.amt && p.ovr >= 48 && mode !== 'buyout').sort(() => Math.random() - 0.5)[0];
  if (claimant && Math.random() < 0.5 && p.ctype !== 'tenDay') {
    box.rosters[claimant.tid] = [...box.rosters[claimant.tid], p.id]; p.yrsWith = 0;
    lines.push(claimant.region + ' ' + claimant.name + ' claimed ' + p.name + ' off waivers from ' + T.abbr + ' (contract and all).');
  } else {
    const total = Object.values(amts).reduce((a: number, b: any) => a + b, 0) as number;
    if (total > 0) cap.dead = [...(cap.dead || []), { pid: p.id, name: p.name, amts, mode, season: g.Y }];
    box.fa.push(p.id); p.waived = { season: g.Y, day: s.day, prevAmt: p.amt, tid };
    p.ask = Math.max(nums(g).min(yosOf(g, p)), +(g.fair(p.ovr) * 0.8).toFixed(2)); p.birdTid = null; p.yrsWith = 0; p.ctype = 'standard'; delete p.opt; delete p.tenDay; delete p.twoWay; delete p.capOverride; p.kicker = 0; p.ntc = false; p.inc = [];
    lines.push(T.region + ' ' + T.name + (mode === 'buyout' ? ' bought out ' : ' waived ') + p.name + (total > 0 ? ' · ' + total.toFixed(2) + 'M dead money' + (mode === 'stretch' ? ' stretched over ' + Object.keys(amts).length + ' seasons' : '') : ''));
  }
  box.cap[tid] = cap;
  return lines;
}

// Players waived during the season (buyout market): teams over the 1st apron can't sign
// anyone whose pre-waiver salary exceeded the non-taxpayer mid-level.
export function buyoutBlocked(g: Game, s: any, tid: number, p: any) {
  const N = nums(g);
  return s.phase === 'regular' && p.waived?.season === g.Y && p.waived.prevAmt > N.NTMLE && teamSalary(g, s, tid) > N.AP1;
}

export { DAY, exceptionsOf };

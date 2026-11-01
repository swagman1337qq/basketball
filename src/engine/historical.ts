// Load a historical draft class (God Mode, 2026-11-01): it replaces one upcoming draft class with the renamed players
// of a real draft (data/historicalClasses.ts). Each keeps his real draft-night age, birthday, body, jersey, position
// and personality; his real amateur seasons where they're on record (amateurStats.ts shows p.real instead of
// generated lines; with none on record the game generates them as for any prospect); and the overall, true potential
// and scouts' read set from his real career. His ratings are shaped by his real college numbers (shooting, passing,
// rebounding, blocks, steals) and then set to that overall. Nothing in the game says who he really was.
import type { Game } from './Game';
import type { HistProspect } from '../data/historicalClasses';
import { deletePlayer } from './godPlayer';
import { inchesOf, shiftOvr, syncOvr } from './ratings';
import { refreshPot, setTruePot } from './potential';
import { ensureTen, initTendencies } from './tendencies';

const GRP: Record<string, string> = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };
const TRAITS = ['alpha', 'touches', 'pro', 'volatile', 'flashy', 'heat', 'crowd', 'villain', 'fearless', 'clutch', 'prone', 'padder', 'team', 'legacy', 'streaky'];
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// His skills from his real college numbers (per 40 minutes over his last two playing seasons), blended half and half
// with the generated build, so a 40% three-point shooter shoots and a shot-blocker blocks; the overall is set after.
function shapeFromStats(p: any, h: HistProspect) {
  const played = (h.real || []).filter(l => l.gp && l.mp).slice(-2); if (!played.length) return;
  const min = played.reduce((a, l) => a + l.gp! * l.mp!, 0); if (min < 200) return;
  const per40 = (k: keyof typeof played[0]) => (played.reduce((a, l) => a + l.gp! * ((l[k] as number) || 0), 0) / min) * 40;
  const pct = (m: 'fg' | 'tp' | 'ft', a: 'fga' | 'tpa' | 'fta') => { const A = played.reduce((x, l) => x + l.gp! * ((l[a] as number) || 0), 0); return A > 0 ? played.reduce((x, l) => x + l.gp! * ((l[m] as number) || 0), 0) / A : null; };
  const tpa = per40('tpa'), tp = pct('tp', 'tpa'), ft = pct('ft', 'fta'), fg = pct('fg', 'fga'), two = (() => { const A = played.reduce((x, l) => x + l.gp! * ((l.fga || 0) - (l.tpa || 0)), 0); return A > 0 ? played.reduce((x, l) => x + l.gp! * ((l.fg || 0) - (l.tp || 0)), 0) / A : null; })();
  const want: Record<string, number> = {
    tp: tpa < 0.6 ? 25 : cl(42 + ((tp ?? 0.33) - 0.33) * 220 + Math.min(10, tpa * 1.2), 20, 90),
    ft: cl(32 + ((ft ?? 0.68) - 0.5) * 125, 15, 92),
    fg: cl(38 + ((ft ?? 0.68) - 0.62) * 70 + ((fg ?? 0.45) - 0.45) * 60, 20, 85),
    pss: cl(30 + per40('ast') * 6, 20, 90), drb: cl(32 + per40('ast') * 4.5 + (GRP[h.pos] === 'G' ? 12 : GRP[h.pos] === 'W' ? 5 : -5), 15, 90),
    reb: cl(24 + per40('trb') * 3.3, 15, 90), box: cl(26 + per40('trb') * 3, 15, 88),
    blk: cl(24 + per40('blk') * 11, 10, 92), stl: cl(28 + per40('stl') * 12, 15, 90),
    ins: cl(36 + ((two ?? 0.48) - 0.45) * 110 + per40('fta') * 1.8, 15, 88), lay: cl(38 + ((two ?? 0.48) - 0.45) * 100 + per40('fta') * 1.5, 15, 88), dnk: cl(34 + ((two ?? 0.48) - 0.45) * 90 + per40('fta') * 1.8, 10, 90),
  };
  Object.entries(want).forEach(([k, v]) => { if (p.r[k] != null) p.r[k] = Math.round((p.r[k] + v) / 2); });
  syncOvr(p);
}

// Which classes can take a loaded one: those still to come (the current one only before its draft starts).
export const canLoadYear = (g: Game, year: number) => year > g.Y || (year === g.Y && !(g.state.phase === 'draft' ? (g.state.pi || 0) > 0 : ['preFA', 'fa', 'preseason'].includes(g.state.phase)));
export const loadableYears = (g: Game) => Object.keys(g.db.cls || {}).map(Number).filter(y => canLoadYear(g, y)).sort((a, b) => a - b);

// A class from a file (your own, or one exported and edited): { label, players: [...] } in the same format
// (docs/DRAFT_CLASS_FORMAT.md). Returns the class, or an error message naming the first problem.
export function parseDraftClass(text: string): { label: string; players: HistProspect[] } | string {
  let o: any; try { o = JSON.parse(text); } catch { return 'That file isn’t a draft class (it isn’t valid JSON).'; }
  const list = Array.isArray(o) ? o : o?.players; if (!Array.isArray(list) || !list.length) return 'No players in that file (it needs a "players" list).';
  if (list.length > 200) return 'That class has ' + list.length + ' players; the most is 200.';
  for (let i = 0; i < list.length; i++) {
    const h = list[i], who = 'Player ' + (i + 1) + (h?.first ? ' (' + h.first + ' ' + (h.last || '') + ')' : '');
    if (!h || typeof h.first !== 'string' || typeof h.last !== 'string') return who + ': needs "first" and "last" names.';
    if (!GRP[h.pos]) return who + ': "pos" must be one of PG, SG, G, GF, SF, F, PF, FC, C.';
    for (const k of ['age', 'ovr', 'tpot']) if (typeof h[k] !== 'number' || !isFinite(h[k])) return who + ': "' + k + '" must be a number.';
    if (h.age < 17 || h.age > 30) return who + ': "age" (on draft night) must be 17 to 30.';
    if (!h.from || typeof h.from.team !== 'string') return who + ': needs "from": { "team", "lg" }.';
    if (h.real != null && !Array.isArray(h.real)) return who + ': "real" must be a list of seasons or null.';
  }
  const players: HistProspect[] = list.map((h: any) => ({ hgt: null, wt: null, born: null, rep: 'US', num: null, kind: h.from?.lg === 'High school' ? 'hs' : ['NCAA', 'JUCO', 'NAIA', 'NCAA Division II', 'NCAA Division III'].includes(h.from?.lg) ? 'col' : 'club', pers: {}, read: h.tpot, real: null, ...h, from: { country: 'US', lg: 'NCAA', ...h.from } }));
  return { label: typeof o?.label === 'string' && o.label.trim() ? o.label.trim() : 'Custom draft class', players };
}

export function loadDraftClass(g: Game, H: { label: string; players: HistProspect[] }, year: number, hist = 0): string {
  if (!H.players?.length) return 'That class has no players.';
  if (!canLoadYear(g, year)) return 'That draft has already started or happened.';
  const P = g.db.P, s: any = g.state, ahead = year - g.Y, natW = s.natW;
  // The old class leaves the league for good (the God Mode delete keeps every reference straight).
  [...(g.db.cls[year] || [])].forEach(id => deletePlayer(g, id));
  const ids: number[] = [];
  H.players.forEach(h => {
    const age0 = h.age - ahead, grp = GRP[h.pos] || 'W';
    const p: any = g.mkPlayer(h.ovr + (h.age - 19) * 3, Math.max(15, age0), natW, year, grp);
    p.dAge = h.age; p.pos = h.pos; p.grp = grp; p.posLock = true;
    p.first = h.first; p.last = h.last; p.name = h.first + ' ' + h.last; delete p.native; delete p.nativeFirst; delete p.nativeLast; delete p.familyFirst; delete p.nOrder; delete p.nSep;
    const rep = g.db.C[h.rep] ? h.rep : 'US'; p.rep = rep; p.born = rep; p.raised = rep; p.her = rep; p.elig = [{ c: rep, why: 'citizen by birth' }];
    if (h.hgt) {
      const delta = h.hgt[0] * 12 + h.hgt[1] - inchesOf(p.hgt);
      p.hgt = h.hgt[0] + '′' + h.hgt[1] + '″';
      p.r.hgt = cl(p.r.hgt + delta * 4, 4, 99);
      if (p.wing != null) p.wing += delta;
    }
    if (h.wt) p.wt = h.wt;
    if (h.born) { const by = year - h.age - (h.born > '06-28' ? 1 : 0); p.dob = by + '-' + h.born; }
    if (h.num != null) { p.num = String(h.num); p.numFav = String(h.num); }
    p.pers = { ...p.pers, mot: h.pers.mot || p.pers.mot, work: h.pers.work ?? p.pers.work, ...Object.fromEntries(TRAITS.map(k => [k, !!h.pers[k]])) };
    // Where he played: his (rival) school or club; a high schooler stays in high school until the draft.
    const youth = h.kind === 'hs' ? { ...h.from } : p.pth?.youth || { team: h.from.team, lg: 'High school', country: 'US' };
    p.pth = { k: h.kind, youth, to: h.kind === 'hs' ? null : { ...h.from } }; p.from = g.prospectFrom(p);
    if (h.real) p.real = h.real.map(l => ({ ...l, season: year + l.y }));
    shapeFromStats(p, h);
    // His level, ceiling and the scouts' read, from his real career and draft slot; no hidden draft-camp swing (his real
    // first seasons are already in his level).
    shiftOvr(p, h.ovr); delete p.ceil; delete p.ph; setTruePot(p, Math.max(h.tpot, p.ovr), false);
    p.perr = +(h.read - p.tpot).toFixed(2); p.dx = { o: 0, c: 0, sh: {}, tier: 'same' }; void hist;
    refreshPot(p); delete p.ten; delete p.tenQ; initTendencies(p); ensureTen(p);
    p.am = { r: { ...p.r }, rx: p.rx ? { ...p.rx } : null, grp: p.grp, feel: p.intg?.feel };
    ids.push(p.id);
  });
  g.db.cls[year] = ids;
  g.db.rank = { ...(g.db.rank || {}) };
  ids.slice().sort((a, b) => (P[b].pot * 0.7 + P[b].ovr * 0.3) - (P[a].pot * 0.7 + P[a].ovr * 0.3)).forEach((id, i) => (g.db.rank[id] = i + 1));
  g.setState((st: any) => ({ gv: (st.gv || 0) + 1 }));
  return 'The ' + H.label + ' is now the ' + year + ' class: ' + ids.length + ' prospects.';
}

// Save a class as a file in the same format (to edit it into your own class, or keep one you like). Seasons on record
// are kept; generated ones aren't (the game makes them again from his ratings).
export function exportDraftClass(g: Game, year: number): { label: string; players: HistProspect[] } {
  const P = g.db.P, inch = (h: string) => { const m = /(\d+)′(\d+)″/.exec(h || ''); return m ? ([+m[1], +m[2]] as [number, number]) : null; };
  const players = (g.db.cls[year] || []).map(id => P[id]).filter(p => p && !p.gone).sort((a, b) => (g.db.rank?.[a.id] ?? 999) - (g.db.rank?.[b.id] ?? 999)).map((p: any): HistProspect => ({
    first: p.first || p.name.split(' ')[0], last: p.last || p.name.split(' ').slice(1).join(' '), pos: p.pos, hgt: inch(p.hgt), wt: p.wt ?? null, born: p.dob ? String(p.dob).slice(5) : null,
    age: p.dAge ?? p.age, rep: p.rep, num: p.num != null && p.num !== '' ? +p.num : null, kind: p.pth?.k || 'col', from: { team: (p.pth?.to || p.from)?.team || '', lg: (p.pth?.to || p.from)?.lg || 'NCAA', country: (p.pth?.to || p.from)?.country || 'US' },
    pers: { mot: p.pers?.mot, work: p.pers?.work, ...Object.fromEntries(TRAITS.filter(k => p.pers?.[k]).map(k => [k, 1])) }, tpot: p.tpot ?? p.pot, ovr: p.ovr, read: p.pot,
    real: p.real ? p.real.map(({ season, ...l }: any) => ({ ...l, y: season - year })) : null }));
  return { label: year + ' draft class', players };
}

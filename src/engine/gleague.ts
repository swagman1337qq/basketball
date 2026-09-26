// The G League: every NBA club has an affiliate. Free agents who don't land NBA deals play
// there on standard G League contracts (the 2025-26 salary is $40,500), which leaves them
// free to sign with any NBA team at any time (a call-up). An NBA club holds "affiliate
// rights" to up to 5 players it waived from training camp (Exhibit 10 players who join
// the affiliate earn their bonus), and G League teams keep "returning rights" to their
// own players from last season. Two-way players split time between the club and its
// affiliate. Playing time there helps young players grow.
import type { Game } from './Game';

const AFFIL: Record<string, string> = {
  BAL: 'Chesapeake Watermen', HFD: 'Connecticut Ironsides', BKN: 'Coney Island Barkers', NWK: 'Jersey Shore Tides', PRV: 'Pawtucket Mill Cats', CLE: 'Lake Erie Riffs', DET: 'Motor City Spark Plugs', CBS: 'Scioto Valley Scouts',
  PIT: 'Allegheny Miners', CIN: 'Queen City Paddlers', CHA: 'Piedmont Pit Crew', ATL: 'Peachtree Embers', TPA: 'Ybor City Rollers', RAL: 'Triangle Techs', NSH: 'Music Row Pickers', SEA: 'Puget Sound Ferries',
  POR: 'Willamette Loggers', VAN: 'Fraser Valley Salmon', SLC: 'Wasatch Powder', DAL: 'Trinity River Roughnecks', DEN: 'Front Range Prospectors', SD: 'La Jolla Swells', OAK: 'East Bay Timber', LV: 'Henderson Dealers', SAC: 'Sierra Gold Panners',
  SJ: 'Santa Clara Coders', AUS: 'Hill Country Hounds', SA: 'Rio Grande Riders', PHX: 'Sonoran Scorpions', KC: 'Missouri River Smokers', STL: 'Gateway Ferrymen', HNL: 'Oahu Outriggers', ABQ: 'Sandia Sidewinders',
};
export const glSalary = (g: Game) => +(0.0405 * (g.CAP / 154.647)).toFixed(3); // $40,500 in 2025-26, growing with the cap
export const GL_ROSTER = 12, AFFIL_MAX = 5;
export function affiliateOf(s: any, tid: number) { const t = s.teams[tid]; return t ? AFFIL[t.abbr] || t.region + ' Select' : 'G League'; }

// A season line in the G League, from his rating (a lower level: stars put up big numbers).
function line(p: any, gp: number) {
  const r = (x: number) => +x.toFixed(1), o = p.ovr, grp = p.grp;
  return { gp, pts: r(Math.max(3, 8 + (o - 42) * 0.85 + (p.r.tp - 50) * 0.04)), reb: r(Math.max(1.5, (grp === 'B' ? 6 : grp === 'W' ? 4.2 : 3) + (p.r.reb - 50) * 0.08)), ast: r(Math.max(0.5, (grp === 'G' ? 4 : grp === 'W' ? 2.2 : 1.4) + (p.r.pss - 50) * 0.07)) };
}

// Put unsigned free agents on G League rosters (opening night, and when a club waives a camp
// invitee). Veterans who expect NBA money wait at home; everyone else goes where they have
// rights, or to a team with a roster spot.
export function placeInGLeague(g: Game, s: any, fa: number[], rnd: () => number = Math.random) {
  const P = g.db.P, T = s.teams, count: Record<number, number> = {}, aff: Record<number, number> = {};
  fa.forEach(id => { const x = P[id]?.gl; if (x && x.tid != null) { count[x.tid] = (count[x.tid] || 0) + 1; if (x.kind === 'affiliate') aff[x.tid] = (aff[x.tid] || 0) + 1; } });
  const room = (t: number) => (count[t] || 0) < GL_ROSTER;
  fa.forEach(id => {
    const p = P[id]; if (!p || p.retired || p.rfa || p.gl?.tid != null) return;
    if (p.age >= 32 && p.ovr >= 50) return; // established vets hold out for an NBA deal
    if (p.ovr >= 57 && p.age >= 26) return;
    if (rnd() > (p.age <= 25 ? 0.85 : 0.6)) return;
    let tid: number | null = null, kind = 'standard';
    const w = p.waived?.tid ?? p.lastTid;
    if (w != null && T[w] && room(w) && (aff[w] || 0) < AFFIL_MAX && p.age <= 28) { tid = w; kind = 'affiliate'; aff[w] = (aff[w] || 0) + 1; }
    else if (p.gl?.last != null && T[p.gl.last] && room(p.gl.last)) { tid = p.gl.last; kind = 'returning'; }
    else { const opts = T.map((t: any) => t.tid).filter(room); if (!opts.length) return; tid = opts[Math.floor(rnd() * opts.length)]; }
    count[tid!] = (count[tid!] || 0) + 1;
    p.gl = { tid, kind, since: g.Y, ...line(p, 0), e10: p.ctype === 'ex10' || p.wasEx10 ? true : undefined };
    p.ask = Math.min(p.ask || 99, g.fair(p.ovr));
  });
}

// Monthly: stat lines update, young players develop with the minutes.
export function gLeagueTick(g: Game, fa: number[], gamesSoFar: number) {
  const P = g.db.P;
  fa.forEach(id => { const p = P[id]; if (!p?.gl || p.gl.tid == null) return;
    if (p.age <= 25) { p.glx = (p.glx || 0) + (p.age <= 22 ? 0.3 : 0.18); const w = Math.trunc(p.glx); if (w && p.ovr < p.pot) { p.ovr = Math.min(p.pot, p.ovr + w); p.glx -= w; Object.keys(p.r).forEach(k => (p.r[k] = Math.min(100, p.r[k] + w))); } }
    Object.assign(p.gl, line(p, Math.round(gamesSoFar * 0.6))); });
}

// Called up (signed by an NBA team): the G League stint ends.
export function callUpNote(g: Game, s: any, p: any, tid: number) {
  if (!p.gl || p.gl.tid == null) return '';
  const from = affiliateOf(s, p.gl.tid), own = p.gl.tid === tid;
  const t = ' (called up from the ' + from + (own ? ', his own affiliate' : '') + ')';
  p.glHist = [...(p.glHist || []), { season: g.Y, team: from, pts: p.gl.pts, reb: p.gl.reb, ast: p.gl.ast }];
  p.gl = { last: p.gl.tid }; // returning rights if he comes back
  return t;
}
export function glLabel(s: any, p: any) { if (!p.gl || p.gl.tid == null) return ''; return affiliateOf(s, p.gl.tid) + (p.gl.kind === 'affiliate' ? ' (affiliate player)' : p.gl.kind === 'returning' ? ' (returning rights)' : ''); }

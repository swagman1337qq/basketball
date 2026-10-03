// Jersey numbers. Every player has a favorite (guards lean to low numbers, bigs to the
// 20s–50s), keeps his number when he changes teams if it's free, and otherwise picks the
// next one he likes. Longest-tenured players keep theirs when two teammates collide.
// Retired numbers (a team's `retired` list, set from Team history) go to nobody new.
import type { Game } from './Game';
import { mulberry32 } from './rng';

const GUARD = ['0', '1', '2', '3', '4', '5', '7', '8', '9', '10', '11', '12', '13', '14', '15', '17', '20', '22', '23', '24', '25', '30', '31', '33', '35', '6', '19', '21', '00', '18'];
const WING = ['1', '2', '3', '4', '5', '7', '8', '9', '10', '11', '12', '13', '14', '20', '21', '22', '23', '24', '25', '30', '31', '32', '33', '34', '35', '40', '41', '44', '6', '16'];
const BIG = ['4', '8', '10', '11', '12', '13', '14', '15', '20', '21', '22', '24', '25', '30', '31', '32', '33', '34', '35', '40', '41', '42', '43', '44', '45', '50', '51', '52', '54', '55', '77', '99', '6', '9'];
const ALL = Array.from({ length: 100 }, (_, i) => String(i)).concat(['00']);

// A player's order of preference (stable per player).
export function numberPrefs(p: any): string[] {
  const rnd = mulberry32((p.id || 1) * 2654435761 % 4294967291 + 17), base = p.grp === 'G' ? GUARD : p.grp === 'B' ? BIG : WING;
  const lead = base.map(n => [rnd() * (1 + base.indexOf(n) / base.length), n] as [number, string]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return [...new Set([...(p.numFav ? [p.numFav] : []), ...lead, ...ALL])];
}

// Give everyone on each roster a unique number. Mutates players (num, numTid). `retired` holds
// each team's retired numbers (retiredNums): a newcomer can't take one, but a player already
// wearing it for that team keeps it until he leaves, as the NBA did with Bill Russell's 6.
export function assignNumbers(P: Record<number, any>, rosters: Record<number, number[]>, only?: number[], retired: Record<number, string[]> = {}) {
  (only || Object.keys(rosters).map(Number)).forEach(tid => {
    const ids = rosters[tid] || [], taken = new Set<string>(), off = new Set(retired[tid] || []);
    const order = ids.map(id => P[id]).filter(Boolean).sort((a, b) => (b.numTid === tid ? 1 : 0) - (a.numTid === tid ? 1 : 0) || (b.yrsWith || 0) - (a.yrsWith || 0) || b.ovr - a.ovr);
    order.forEach(p => {
      if (p.num != null && !taken.has(p.num) && (p.numTid === tid || (!off.has(p.num) && (p.numTid == null || !p.numLocked)))) { taken.add(p.num); p.numTid = tid; if (!p.numFav) p.numFav = p.num; return; }
      const pick = numberPrefs(p).find(n => !taken.has(n) && !off.has(n)) || '99';
      p.num = pick; p.numTid = tid; if (!p.numFav) p.numFav = pick; taken.add(pick);
    });
  });
}

// Each team's retired numbers, by tid.
export const retiredNums = (teams: any[] = []): Record<number, string[]> => Object.fromEntries(teams.filter(t => t?.retired?.length).map(t => [t.tid, t.retired.map((r: any) => r.num)]));

// The numbers a player wore for a team, most recent first. Each season's stat line keeps the
// number he wore (lines from before that know only the one he wears now, if it's this team's).
export function numsWith(p: any, tid: number): string[] {
  const rows = (p.stats || []).filter((r: any) => r.tid === tid && r.num != null).sort((a: any, b: any) => b.season - a.season).map((r: any) => r.num);
  return [...new Set<string>([...(p.numTid === tid && p.num != null ? [p.num] : []), ...rows])];
}

export const JERSEY_RE = /^(00|\d|[1-9]\d)$/;

// Retire a number for a team (from Team history). It's listed with the player it honors;
// two players can share a retired number.
export function retireJersey(g: Game, tid: number, pid: number, num: string) {
  const p = g.db.P[pid], n = String(num).trim();
  if (!p || !JERSEY_RE.test(n)) return;
  g.setState((s: any) => {
    const t = s.teams[tid];
    if (!t || (t.retired || []).some((r: any) => r.pid === pid && r.num === n)) return null;
    return {
      teams: s.teams.map((x: any) => (x.tid === tid ? { ...x, retired: [...(x.retired || []), { num: n, pid, season: g.Y }] } : x)),
      lgLog: [{ day: s.day, type: 'Team', teams: t.abbr, pids: [pid], text: 'The ' + t.region + ' ' + t.name + ' retired No. ' + n + ' in honor of ' + p.name }, ...(s.lgLog || [])],
    };
  });
}

export function unretireJersey(g: Game, tid: number, pid: number, num: string) {
  g.setState((s: any) => {
    const t = s.teams[tid];
    if (!t?.retired?.some((r: any) => r.pid === pid && r.num === num)) return null;
    return { teams: s.teams.map((x: any) => (x.tid === tid ? { ...x, retired: x.retired.filter((r: any) => !(r.pid === pid && r.num === num)) } : x)) };
  });
}

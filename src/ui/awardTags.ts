// A season's honors as Basketball-Reference writes them in the Awards column: "MVP-4, AS, NBA1".
// Award names come from your award formulas; a finish in the voting is the award and his place
// (winners are "-1"); teams are NBA1–3 (All-League), DEF1–2, ROOK1–2; AS is an All-Star selection.
import { allStarsOf } from '../engine/allStar';

const DUBIOUS = new Set(['LVP', 'AVG', 'LIP', 'LEP', 'WDP']), dubious = (sn: string, name: string) => DUBIOUS.has(sn) || /least|worst|perfectly average/i.test(name);
const CLASSIC: Record<string, [string, string]> = { mvp: ['MVP', 'Most Valuable Player'], dpoy: ['DPOY', 'Defensive Player of the Year'], roy: ['ROY', 'Rookie of the Year'], smoy: ['SMOY', 'Sixth Man of the Year'], mip: ['MIP', 'Most Improved Player'] };
const TEAM_TAG: Record<string, string> = { ALL: 'NBA', DEF: 'DEF', ALR: 'ROOK' };

export interface AwardTag { tag: string; name: string; won: boolean }
export function awardTags(s: any, pid: number, y: number, po = false): AwardTag[] {
  const out: AwardTag[] = [], a = (s.awards || {})[y];
  if (po) { if (a?.fmvp?.pid === pid) out.push({ tag: 'FMVP', name: 'Finals MVP', won: true }); return out; }
  if (a) {
    const lists: [string, string, any[]][] = a.list ? (a.defs || []).filter((d: any) => !d.numTeams && !d.statRange).map((d: any) => [d.shortName, d.name, a.list[d.shortName] || []])
      : Object.entries(CLASSIC).map(([k, [sn, nm]]) => [sn, nm, a[k] || []]);
    lists.forEach(([sn, name, l]) => { if (dubious(sn, name)) return; const i = l.findIndex((e: any) => e.pid === pid); if (i < 0 || i >= 10) return; out.push({ tag: sn + '-' + (i + 1), name: (i === 0 ? '' : ordinal(i + 1) + ' in ') + name + (i === 0 ? '' : ' voting'), won: i === 0 }); });
  }
  if (allStarsOf(s, y).includes(pid)) out.push({ tag: 'AS', name: 'All-Star', won: false });
  if (a) {
    const tms: [string, string, number[][]][] = a.teams ? (a.defs || []).filter((d: any) => d.numTeams).map((d: any) => [d.shortName, d.name, a.teams[d.shortName] || []])
      : [['ALL', 'All-League', a.allLeague || []], ['DEF', 'All-Defensive', a.allDef || []], ['ALR', 'All-Rookie', a.allRookie?.length ? [a.allRookie] : []]];
    tms.forEach(([sn, name, t]) => t.forEach((tm, i) => { if (tm.includes(pid)) out.push({ tag: (TEAM_TAG[sn] || sn) + (i + 1), name: ordinal(i + 1) + ' Team ' + name, won: false }); }));
  }
  return out;
}
const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

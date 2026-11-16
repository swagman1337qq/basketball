// Explicit staff biography edits. Normal coaching and player development never call this editor.
import type { Game } from '../engine/Game';
import { FACE_LOOKS } from '../engine/faces';
import { playRows, preserveCoachCareer, syncHeadCoaches, WOMENS_LEAGUE, type PlayRow } from '../engine/coachCareer';
import { godAppoint, godEditCoach, fireCoach, repOf, ROLE_ORDER, type Coach, type CoachRole } from '../engine/staff';

export type EditableCoach = Coach & {
  bioFace?: boolean;
  bioPlayRows?: PlayRow[];
  bioMalePlay?: string;
  faceSeed?: number;
  faceX?: Record<string, any>;
};
export type CoachBioDraft = {
  name: string;
  age: number;
  race: string;
  nat: string;
  where: string;
  rep: number;
  years: number;
  fem: boolean;
  faceSeed?: number;
  faceX?: Record<string, any>;
  tid: number | null;
  role: CoachRole;
  amt: number;
  exp: number;
  next: Coach['next'] | null;
};

export const coachPlayRows = (g: Game, c: EditableCoach) => c.bioPlayRows ?? playRows(g, g.state, c);
export const coachBioDraft = (g: Game, c: EditableCoach): CoachBioDraft => ({
  name: c.name,
  age: g.Y - c.born,
  race: c.race,
  nat: c.nat,
  where: c.play.where || (c.pid != null ? g.db.P[c.pid]?.from?.team : '') || '',
  rep: c.rep,
  years: Math.max(0, g.Y - c.since),
  fem: c.fem,
  faceSeed: c.faceSeed,
  faceX: c.faceX ? structuredClone(c.faceX) : undefined,
  tid: c.tid,
  role: c.role || 'asst',
  amt: c.amt,
  exp: c.exp,
  next: c.next ? { ...c.next } : null,
});

export function saveCoachBio(g: Game, id: number, draft: CoachBioDraft): string {
  if (!g.state.god) return 'Turn on God Mode to edit staff.';
  const c = g.db.coaches?.[id] as EditableCoach | undefined;
  if (!c) return 'Coach not found.';
  const name = draft.name.trim().replace(/\s+/g, ' '),
    where = draft.where.trim();
  if (!name || name.length > 100) return 'Enter a name (up to 100 characters).';
  if (!g.db.C[draft.nat]) return 'Choose a nationality.';
  if (!FACE_LOOKS.some(([key]) => key === draft.race)) return 'Choose a race / appearance.';
  if (typeof draft.fem !== 'boolean') return 'Choose a gender.';
  if (draft.faceSeed != null && (!Number.isInteger(draft.faceSeed) || draft.faceSeed < 0 || draft.faceSeed > 1e9))
    return 'Invalid face seed.';
  if (Object.keys(draft.faceX || {}).some(k => k.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))))
    return 'Invalid face edit.';
  if (!Number.isFinite(draft.age) || draft.age < 18 || draft.age > 100) return 'Age must be between 18 and 100.';
  if (!Number.isFinite(draft.rep) || draft.rep < 0 || draft.rep > 100) return 'Reputation must be between 0 and 100.';
  if (!Number.isFinite(draft.years) || draft.years < 0 || draft.years > 100) return 'Coaching experience must be between 0 and 100 years.';
  if (where.length > 120) return 'Playing college/team must be at most 120 characters.';
  if (draft.tid != null && !g.state.teams.some(t => t.tid === draft.tid)) return 'Choose a coaching team.';
  if (!ROLE_ORDER.includes(draft.role)) return 'Choose a coaching role.';
  if (!Number.isFinite(draft.amt) || draft.amt < 0 || draft.amt > 1000) return 'Annual salary must be between $0M and $1,000M.';
  if (draft.tid != null && (!Number.isInteger(draft.exp) || draft.exp < g.Y || draft.exp > g.Y + 100))
    return 'Choose a contract end season from this season through 100 years ahead.';
  if (draft.next && draft.tid != null) {
    if (
      !Number.isFinite(draft.next.amt) ||
      draft.next.amt < 0 ||
      draft.next.amt > 1000 ||
      !Number.isInteger(draft.next.start) ||
      !Number.isInteger(draft.next.exp) ||
      draft.next.start <= draft.exp ||
      draft.next.exp < draft.next.start ||
      draft.next.exp > g.Y + 100
    )
      return 'An extension must start after the current contract, end on or after its start, and have a valid salary.';
  }
  preserveCoachCareer(g, g.state, c);
  // Keep generated stat lines stable when changing birth year, nationality or playing affiliation.
  const previousWhere = c.play.where;
  const genderChanged = draft.fem !== c.fem;
  if (genderChanged) {
    c.bioPlayRows = coachPlayRows(g, c).map(r => ({ ...r }));
    if (!c.fem) c.bioMalePlay = c.play.k;
    if (draft.fem && ['pro', 'league'].includes(c.play.k)) c.play.k = 'women';
    else if (!draft.fem && c.play.k === 'women') c.play.k = c.bioMalePlay || 'pro';
    const leagues = [
      ['League', WOMENS_LEAGUE],
      ['NCAA', 'Women’s NCAA'],
      ['Abroad', 'Women’s league abroad'],
      ['CCP league', 'Women’s development league'],
    ];
    c.bioPlayRows = c.bioPlayRows.map(r => ({
      ...r,
      lg: leagues.find(pair => pair[draft.fem ? 0 : 1] === r.lg)?.[draft.fem ? 1 : 0] || r.lg,
    }));
  }
  if (c.pid == null && !c.bioPlayRows) c.bioPlayRows = playRows(g, g.state, c).map(r => ({ ...r }));
  if (c.bioPlayRows && where !== (previousWhere || '')) {
    const oldTeam = previousWhere || c.bioPlayRows[0]?.team;
    c.bioPlayRows = c.bioPlayRows.map(r => (where && (c.play.k === 'college' || r.team === oldTeam) ? { ...r, team: where } : r));
  }
  if (
    genderChanged ||
    draft.race !== c.race ||
    Math.round(draft.age) !== g.Y - c.born ||
    draft.faceSeed !== c.faceSeed ||
    JSON.stringify(draft.faceX) !== JSON.stringify(c.faceX)
  )
    c.bioFace = true;
  c.fem = draft.fem;
  if (draft.faceSeed == null) delete c.faceSeed;
  else c.faceSeed = draft.faceSeed;
  if (draft.faceX == null) delete c.faceX;
  else c.faceX = structuredClone(draft.faceX);
  c.name = name;
  const parts = name.split(' ');
  c.first = parts.shift()!;
  c.last = parts.join(' ');
  delete c.native;
  c.born = g.Y - Math.round(draft.age);
  c.race = draft.race;
  c.nat = draft.nat;
  if (c.play.k !== 'none') c.play.where = where || undefined;
  c.since = g.Y - Math.round(draft.years);
  const previousRole = c.role;
  const jobChanged = c.tid !== draft.tid || (draft.tid != null && c.role !== draft.role);
  const contractChanged = c.amt !== draft.amt || c.exp !== draft.exp || JSON.stringify(c.next ?? null) !== JSON.stringify(draft.next);
  if (jobChanged) {
    if (draft.tid == null) {
      if (c.tid != null) fireCoach(g, g.state, c.tid, c.id, true);
    } else {
      delete c.ret;
      godAppoint(g, g.state, draft.tid, c.id, draft.role);
    }
  }
  if (draft.tid != null) {
    c.amt = +draft.amt.toFixed(2);
    c.exp = draft.exp;
    if (draft.next) c.next = { ...draft.next, amt: +draft.next.amt.toFixed(2) };
    else delete c.next;
    if (draft.role === 'hc') c.godHeadCoach = true;
    else delete c.godHeadCoach;
  } else {
    c.amt = 0;
    c.exp = 0;
    delete c.next;
    delete c.godHeadCoach;
  }
  if (jobChanged || contractChanged) {
    delete c.raise;
    delete c.sour;
  }
  if (jobChanged && (previousRole === 'hc' || draft.role === 'hc')) syncHeadCoaches(g, g.state);
  // Set the requested reputation exactly, even when its natural formula is clipped at 0/100.
  // Subsequent seasons still change reputation normally.
  (c as any).repAdj = 0;
  for (let n = 0; n < 16; n++) {
    c.rep = repOf(g, c);
    const gap = Math.round(draft.rep) - c.rep;
    if (!gap) break;
    (c as any).repAdj += gap;
  }
  c.rep = repOf(g, c);
  godEditCoach(g, id, {}); // invalidate staff reads/cost/advice caches using the normal editor path
  return '';
}

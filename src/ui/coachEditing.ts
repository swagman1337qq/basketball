// Explicit staff biography edits. Normal coaching and player development never call this editor.
import type { Game } from '../engine/Game';
import { FACE_LOOKS } from '../engine/faces';
import { playRows, preserveCoachCareer, type PlayRow } from '../engine/coachCareer';
import { godEditCoach, repOf, type Coach } from '../engine/staff';

export type EditableCoach = Coach & { bioFace?: boolean; bioPlayRows?: PlayRow[] };
export type CoachBioDraft = { name: string; age: number; race: string; nat: string; where: string; rep: number; years: number };

export const coachPlayRows = (g: Game, c: EditableCoach) => c.bioPlayRows ?? playRows(g, g.state, c);
export const coachBioDraft = (g: Game, c: Coach): CoachBioDraft => ({
  name: c.name,
  age: g.Y - c.born,
  race: c.race,
  nat: c.nat,
  where: c.play.where || (c.pid != null ? g.db.P[c.pid]?.from?.team : '') || '',
  rep: c.rep,
  years: Math.max(0, g.Y - c.since),
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
  if (!Number.isFinite(draft.age) || draft.age < 18 || draft.age > 100) return 'Age must be between 18 and 100.';
  if (!Number.isFinite(draft.rep) || draft.rep < 0 || draft.rep > 100) return 'Reputation must be between 0 and 100.';
  if (!Number.isFinite(draft.years) || draft.years < 0 || draft.years > 100) return 'Coaching experience must be between 0 and 100 years.';
  if (where.length > 120) return 'Playing college/team must be at most 120 characters.';
  preserveCoachCareer(g, g.state, c);
  // Keep generated stat lines stable when changing birth year, nationality or playing affiliation.
  const previousWhere = c.play.where;
  if (c.pid == null && !c.bioPlayRows) c.bioPlayRows = playRows(g, g.state, c).map(r => ({ ...r }));
  if (c.bioPlayRows && where !== (previousWhere || '')) {
    const oldTeam = previousWhere || c.bioPlayRows[0]?.team;
    c.bioPlayRows = c.bioPlayRows.map(r => (where && (c.play.k === 'college' || r.team === oldTeam) ? { ...r, team: where } : r));
  }
  if (draft.race !== c.race || Math.round(draft.age) !== g.Y - c.born) c.bioFace = true;
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

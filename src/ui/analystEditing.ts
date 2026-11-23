// God Mode analyst edits (2026-11-23): name, gender, nationality, age, years in analytics, face and portrait, and the
// contract (salary, end season with no upper limit, a signed extension). Normal analytics never calls this.
import type { Game } from '../engine/Game';
import { FACE_LOOKS } from '../engine/faces';
import { anRepOf, godEditAnalyst, type Analyst } from '../engine/analytics';
import { firstSeason } from '../engine/contracts';

// Faces are drawn by CoachFace (coach-style suit); analysts use their own id range so they never share a coach's face.
export const ANALYST_FACE_ID = 500000;
export type EditableAnalyst = Analyst & { faceX?: Record<string, any> };
export type AnalystBioDraft = {
  name: string;
  age: number;
  fem: boolean;
  race: string;
  nat: string;
  years: number;
  faceSeed?: number;
  faceX?: Record<string, any>;
  amt: number;
  exp: number;
  next: Analyst['next'] | null;
};

export const analystBioDraft = (g: Game, a: EditableAnalyst): AnalystBioDraft => ({
  name: a.name,
  age: g.Y - a.born,
  fem: a.fem,
  race: a.race,
  nat: a.nat,
  years: Math.max(0, g.Y - a.since),
  faceSeed: a.faceSeed,
  faceX: a.faceX ? structuredClone(a.faceX) : undefined,
  amt: a.amt,
  exp: a.exp,
  next: a.next ? { ...a.next } : null,
});
// The earliest season a contract can end: this one in season, next one once the league year has turned.
export const analystMinExp = (g: Game) => firstSeason(g, g.state);
const season = (v: number) => Number.isSafeInteger(v);

// Returns '' when saved, else why not (nothing is changed then).
export function saveAnalystBio(g: Game, id: number, draft: AnalystBioDraft): string {
  if (!g.state.god) return 'Turn on God Mode to edit analysts.';
  const a = (g.db as any).analysts?.[id] as EditableAnalyst | undefined;
  if (!a) return 'Analyst not found.';
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 100) return 'Enter a name (up to 100 characters).';
  if (!g.db.C[draft.nat]) return 'Choose a nationality.';
  if (!FACE_LOOKS.some(([key]) => key === draft.race)) return 'Choose a race / appearance.';
  if (typeof draft.fem !== 'boolean') return 'Choose a gender.';
  if (draft.faceSeed != null && (!Number.isInteger(draft.faceSeed) || draft.faceSeed < 0 || draft.faceSeed > 1e9))
    return 'Invalid face seed.';
  if (Object.keys(draft.faceX || {}).some(k => k.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))))
    return 'Invalid face edit.';
  if (!Number.isFinite(draft.age) || draft.age < 18 || draft.age > 100) return 'Age must be between 18 and 100.';
  if (!Number.isFinite(draft.years) || draft.years < 0 || draft.years > 100) return 'Years in analytics must be between 0 and 100.';
  const hired = a.tid != null && !a.ret;
  if (hired) {
    const min = analystMinExp(g);
    if (!Number.isFinite(draft.amt) || draft.amt < 0 || draft.amt > 1000) return 'Annual salary must be between $0M and $1,000M.';
    if (!season(draft.exp) || draft.exp < min) return 'The contract must end in ' + min + ' or later.';
    if (
      draft.next &&
      (!Number.isFinite(draft.next.amt) ||
        draft.next.amt < 0 ||
        draft.next.amt > 1000 ||
        !season(draft.next.start) ||
        !season(draft.next.exp) ||
        draft.next.start <= draft.exp ||
        draft.next.exp < draft.next.start)
    )
      return 'An extension must start after the current contract, end on or after its start, and have a valid salary.';
  }
  a.name = name;
  const parts = name.split(' ');
  a.first = parts.shift()!;
  a.last = parts.join(' ');
  delete a.native;
  a.fem = draft.fem;
  a.race = draft.race;
  a.nat = draft.nat;
  a.born = g.Y - Math.round(draft.age);
  a.since = g.Y - Math.round(draft.years);
  if (draft.faceSeed == null) delete a.faceSeed;
  else a.faceSeed = draft.faceSeed;
  if (draft.faceX == null) delete a.faceX;
  else a.faceX = structuredClone(draft.faceX);
  if (hired) {
    a.amt = +draft.amt.toFixed(2);
    a.exp = draft.exp;
    if (draft.next) a.next = { ...draft.next, amt: +draft.next.amt.toFixed(2) };
    else delete a.next;
  }
  a.rep = anRepOf(g, a); // years in the field count toward reputation
  godEditAnalyst(g, id, {}); // invalidate analytics caches the usual way
  return '';
}

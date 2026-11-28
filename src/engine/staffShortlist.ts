// Staff shortlist (2026-11-28): coaches and analytics people you want to keep an eye on, per club (s.staffList, a
// club key): c = coach ids (db.coaches), a = analyst ids (db.analysts). Shown on the Staff screen with what each is
// doing now; starred from their profile and the Staff tables.
import type { Game } from './Game';

export type StaffKind = 'c' | 'a';
export const staffList = (s: any): { c: number[]; a: number[] } => ({ c: s?.staffList?.c || [], a: s?.staffList?.a || [] });
export const onStaffList = (s: any, k: StaffKind, id: number) => staffList(s)[k].includes(id);
export function toggleStaffList(g: Game, k: StaffKind, id: number) {
  g.setState((st: any) => {
    const L = staffList(st),
      has = L[k].includes(id);
    return { staffList: { ...L, [k]: has ? L[k].filter(x => x !== id) : [...L[k], id] } };
  });
}

// Coaches and analytics people for the global search (search.ts searchAll, 2026-11-28): every one in the league's
// database, with what they do now; clicking opens their profile.
import { ROLE_LABEL, type CoachRole } from '../engine/staff';
import { AN_ROLE_LABEL, anDb, type AnRole } from '../engine/analytics';

export function staffSearchRows(gm: any, T: any[]) {
  const where = (tid: number | null | undefined) => (tid != null && T[tid] ? T[tid].abbr : null);
  const coaches = (Object.values(gm.db.coaches || {}) as any[]).map(c => {
    const at = where(c.tid);
    return {
      sec: 'Coaches' as const,
      name: c.name,
      native: c.native,
      nat: c.nat,
      active: !c.ret,
      meta: c.ret ? 'Retired coach' : at && c.role ? ROLE_LABEL[c.role as CoachRole] + ' · ' + at : 'Coach · available',
      open: () => gm.setState({ coachPid: c.id }),
    };
  });
  const analysts = (Object.values(anDb(gm)) as any[]).map(a => {
    const at = where(a.tid);
    return {
      sec: 'Analytics staff' as const,
      name: a.name,
      nat: a.nat,
      active: !a.ret,
      meta: a.ret ? 'Retired analyst' : at ? AN_ROLE_LABEL[(a.role || 'analyst') as AnRole] + ' · ' + at : 'Analyst · available',
      open: () => gm.setState({ anPid: a.id, anTab: 'ov' }),
    };
  });
  return [...coaches, ...analysts];
}

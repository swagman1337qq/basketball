// The staff shortlist star (engine/staffShortlist.ts): on a coach's or analyst's profile and in the Staff tables.
import { onStaffList, toggleStaffList, type StaffKind } from '../engine/staffShortlist';

export function StaffStar({ gm, k, id, label }: { gm: any; k: StaffKind; id: number; label?: boolean }) {
  const on = onStaffList(gm.state, k, id);
  return (
    <button
      type="button"
      aria-pressed={on}
      data-staff-star
      title={on ? 'On your staff shortlist (click to remove)' : 'Add to your staff shortlist'}
      onClick={e => {
        e.stopPropagation();
        toggleStaffList(gm, k, id);
      }}
      style={{
        all: 'unset',
        cursor: 'pointer',
        fontSize: label ? '13px' : '15px',
        lineHeight: 1,
        color: on ? 'var(--color-accent)' : 'var(--color-neutral-600)',
        marginLeft: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {on ? '★' : '☆'}
      {label && <span style={{ marginLeft: 4, fontWeight: 500 }}>{on ? 'Shortlisted' : 'Shortlist'}</span>}
    </button>
  );
}

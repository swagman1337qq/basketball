// A coach's face (staff.ts coaches: a suit, no jersey), drawn once per coach and age.
import { makeFace, faceSvg } from '../engine/faces';
import type { Coach } from '../engine/staff';
import type { Game } from '../engine/Game';
import type { EditableCoach } from './coachEditing';

const CACHE = new Map<string, any>();
export function coachFaceData(gm: Game | undefined, c: EditableCoach, age: number) {
  const pl = c.pid != null && gm ? gm.db.P[c.pid] : null;
  if (pl && !c.bioFace && c.faceSeed == null && !c.faceX && c.fem === !!pl.fem) return gm!.face(c.pid);
  const base = pl || { id: 700000 + c.id };
  return makeFace(
    {
      ...base,
      race: c.race,
      age,
      fem: c.fem,
      faceSeed: c.faceSeed ?? base.faceSeed,
      faceX: c.faceX ?? (pl && c.faceSeed == null && c.fem === !!pl.fem && c.race === pl.race ? pl.faceX : undefined),
    },
    pl ? gm!.db.seed | 0 : 0,
  );
}
// A former player in this league (c.pid) keeps his own face, as old as he is now.
export function CoachFace({ c, age, size = 40, gm }: { c: Coach; age: number; size?: number; gm?: Game }) {
  const editable = c as EditableCoach;
  const pl = c.pid != null && gm ? (gm.db.P as any)[c.pid] : null;
  const edited = !!(c as EditableCoach).bioFace;
  const key =
    (gm?.db.seed ?? '') +
    '|' +
    c.id +
    '|' +
    age +
    '|' +
    c.race +
    '|' +
    (c.fem ? 1 : 0) +
    '|' +
    (pl ? 'p' : '') +
    '|' +
    edited +
    '|' +
    editable.faceSeed +
    '|' +
    JSON.stringify(editable.faceX) +
    '|' +
    (pl?.faceSeed ?? '') +
    '|' +
    JSON.stringify(pl?.faceX);
  let el = CACHE.get(key);
  if (!el) {
    el = faceSvg(coachFaceData(gm, editable, age), ['#2f3136', '#d8d4cc'], undefined, 'staff');
    if (CACHE.size > 400) CACHE.clear();
    CACHE.set(key, el);
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: 'var(--color-neutral-100)',
        flex: 'none',
      }}
    >
      {el}
    </div>
  );
}

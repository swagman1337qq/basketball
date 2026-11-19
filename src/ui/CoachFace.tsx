// Coaches share the complete-illustration renderer and can keep a former player's portrait.
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
      faceAncestry: c.race === base.race ? base.faceAncestry : undefined,
      age,
      fem: c.fem,
      faceSeed: c.faceSeed ?? base.faceSeed,
      faceX: c.faceX ?? (pl && c.faceSeed == null && c.fem === !!pl.fem && c.race === pl.race ? pl.faceX : undefined),
    },
    pl ? gm!.db.seed | 0 : 0,
  );
}
// A former player in this league (c.pid) keeps the same finished portrait.
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
    JSON.stringify(editable.faceX);
  const inheritedImage =
    pl && !editable.bioFace && editable.faceSeed == null && !editable.faceX && c.fem === !!pl.fem ? pl.faceImg : undefined;
  const image = editable.faceImg || inheritedImage;
  let el = image ? (
    <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
  ) : (
    CACHE.get(key)
  );
  if (!el) {
    el = faceSvg(coachFaceData(gm, editable, age), ['#2f3136', '#d8d4cc'], undefined, pl ? 'player' : 'staff');
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

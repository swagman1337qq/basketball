// A coach's face (staff.ts coaches: a suit, no jersey), drawn once per coach and age.
import { makeFace, faceSvg } from '../engine/faces';
import type { Coach } from '../engine/staff';
import type { Game } from '../engine/Game';
import type { EditableCoach } from './coachEditing';

const CACHE = new Map<string, any>();
// A former player in this league (c.pid) keeps his own face, as old as he is now.
export function CoachFace({ c, age, size = 40, gm }: { c: Coach; age: number; size?: number; gm?: Game }) {
  const pl = c.pid != null && gm ? (gm.db.P as any)[c.pid] : null;
  const edited = !!(c as EditableCoach).bioFace;
  const key = (gm?.db.seed ?? '') + '|' + c.id + '|' + age + '|' + c.race + '|' + (c.fem ? 1 : 0) + '|' + (pl ? 'p' : '') + '|' + edited;
  let el = CACHE.get(key);
  if (!el) {
    el = faceSvg(
      pl
        ? edited
          ? makeFace({ ...pl, race: c.race, age, faceX: c.race === pl.race ? pl.faceX : undefined }, gm!.db.seed | 0)
          : gm!.face(c.pid)
        : makeFace({ id: 700000 + c.id, race: c.race, age, fem: c.fem }),
      ['#2f3136', '#d8d4cc'],
    );
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

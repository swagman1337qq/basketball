// A coach's face (staff.ts coaches: a suit, no jersey), drawn once per coach and age.
import { makeFace, faceSvg } from '../engine/faces';
import type { Coach } from '../engine/staff';

const CACHE = new Map<string, any>();
export function CoachFace({ c, age, size = 40 }: { c: Coach; age: number; size?: number }) {
  const key = c.id + '|' + age + '|' + c.race + '|' + (c.fem ? 1 : 0);
  let el = CACHE.get(key);
  if (!el) {
    el = faceSvg(makeFace({ id: 700000 + c.id, race: c.race, age, fem: c.fem }), ['#2f3136', '#d8d4cc']);
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

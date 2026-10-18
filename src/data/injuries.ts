// Injury types by tier (Game.injuryTick picks the tier: about 0.7% career-altering, 7% multi-week, 28% short
// absences, 64% day-to-day knocks). Each type has its own recovery range in games and a weight (how common it is
// within its tier), after the NBA's injury reports. `body`: a major injury also costs athleticism (points off
// speed, acceleration, jumping, strength and endurance, at least / random extra).
export interface InjType { name: string; min: number; max: number; w: number; body?: [number, number] }

export const INJ_MAJOR: InjType[] = [
  { name: 'Torn ACL', min: 126, max: 170, w: 40, body: [3, 5] },
  { name: 'Ruptured Achilles', min: 130, max: 175, w: 30, body: [4, 6] },
  { name: 'Torn patellar tendon', min: 110, max: 165, w: 12, body: [3, 5] },
  { name: 'Fractured tibia', min: 90, max: 130, w: 8, body: [2, 3] },
  { name: 'Herniated disc (back surgery)', min: 85, max: 125, w: 10, body: [2, 3] },
];

export const INJ_WEEKS: InjType[] = [
  { name: 'Sprained MCL', min: 10, max: 28, w: 14 },
  { name: 'High ankle sprain', min: 8, max: 22, w: 14 },
  { name: 'Calf strain', min: 8, max: 20, w: 12 },
  { name: 'Torn meniscus', min: 15, max: 35, w: 9 },
  { name: 'Fractured hand', min: 12, max: 26, w: 8 },
  { name: 'Stress fracture', min: 18, max: 40, w: 6 },
  { name: 'Patellar tendinopathy', min: 8, max: 24, w: 6 },
  { name: 'Grade 2 hamstring strain', min: 8, max: 20, w: 8 },
  { name: 'Sprained PCL', min: 10, max: 24, w: 3 },
  { name: 'Fractured wrist', min: 18, max: 35, w: 4 },
  { name: 'Broken finger (surgery)', min: 10, max: 22, w: 4 },
  { name: 'Partially torn plantar fascia', min: 14, max: 30, w: 3 },
  { name: 'Bone bruise (knee)', min: 8, max: 20, w: 4 },
  { name: 'Separated shoulder', min: 10, max: 25, w: 3 },
  { name: 'Fractured orbital bone', min: 8, max: 16, w: 2 },
  { name: 'Lisfranc injury', min: 35, max: 65, w: 1.5 },
  { name: 'Jones fracture', min: 35, max: 60, w: 1.5 },
  { name: 'Torn labrum (shoulder)', min: 40, max: 70, w: 1 },
];

export const INJ_SHORT: InjType[] = [
  { name: 'Ankle sprain', min: 2, max: 8, w: 20 },
  { name: 'Hamstring strain', min: 2, max: 9, w: 9 },
  { name: 'Knee soreness', min: 1, max: 6, w: 8 },
  { name: 'Back spasms', min: 1, max: 5, w: 7 },
  { name: 'Groin strain', min: 2, max: 8, w: 6 },
  { name: 'Concussion protocol', min: 1, max: 6, w: 5 },
  { name: 'Hip contusion', min: 1, max: 5, w: 4 },
  { name: 'Sprained wrist', min: 1, max: 6, w: 4 },
  { name: 'Quad contusion', min: 1, max: 5, w: 4 },
  { name: 'Shoulder sprain', min: 2, max: 7, w: 4 },
  { name: 'Calf tightness', min: 1, max: 5, w: 4 },
  { name: 'Hip flexor strain', min: 2, max: 7, w: 4 },
  { name: 'Illness', min: 1, max: 3, w: 6 },
  { name: 'Sprained thumb', min: 1, max: 5, w: 3 },
  { name: 'Plantar fasciitis', min: 2, max: 8, w: 3 },
  { name: 'Achilles soreness', min: 1, max: 6, w: 3 },
  { name: 'Rib contusion', min: 1, max: 5, w: 2 },
  { name: 'Broken nose', min: 1, max: 3, w: 2 },
  { name: 'Sprained toe', min: 1, max: 5, w: 2 },
  { name: 'Lower back strain', min: 2, max: 7, w: 3 },
  { name: 'Eye injury', min: 1, max: 3, w: 1 },
  { name: 'Elbow bursitis', min: 1, max: 4, w: 1 },
  { name: 'Dislocated finger', min: 1, max: 4, w: 2 },
];

export const INJ_DTD: InjType[] = [
  { name: 'Sore ankle', min: 1, max: 5, w: 14 },
  { name: 'Sore knee', min: 1, max: 5, w: 12 },
  { name: 'Bruised thigh', min: 1, max: 4, w: 6 },
  { name: 'Jammed finger', min: 1, max: 4, w: 8 },
  { name: 'Back tightness', min: 1, max: 5, w: 8 },
  { name: 'Sore wrist', min: 1, max: 4, w: 5 },
  { name: 'Hip soreness', min: 1, max: 4, w: 5 },
  { name: 'Tweaked hamstring', min: 1, max: 5, w: 6 },
  { name: 'Stiff neck', min: 1, max: 3, w: 3 },
  { name: 'Sore foot', min: 1, max: 4, w: 5 },
  { name: 'Bruised shin', min: 1, max: 3, w: 3 },
  { name: 'Sore Achilles', min: 1, max: 5, w: 3 },
  { name: 'Calf tightness', min: 1, max: 4, w: 4 },
  { name: 'Sprained finger', min: 1, max: 4, w: 4 },
  { name: 'Elbow contusion', min: 1, max: 3, w: 2 },
  { name: 'Migraine', min: 1, max: 2, w: 1 },
  { name: 'Sore shoulder', min: 1, max: 4, w: 3 },
  { name: 'Mouth laceration', min: 1, max: 2, w: 1 },
];

// A weighted pick and a recovery length in its range.
export function rollInjury(list: InjType[], rnd: () => number = Math.random): { name: string; games: number; body?: [number, number] } {
  const tot = list.reduce((a, x) => a + x.w, 0); let r = rnd() * tot;
  const t = list.find(x => (r -= x.w) < 0) || list[list.length - 1];
  return { name: t.name, games: t.min + Math.floor(rnd() * (t.max - t.min + 1)), ...(t.body ? { body: t.body } : {}) };
}

// Close-shot technique, preference and execution. These helpers have no random
// calls: the game chooses a technique once, then uses that same event for its
// result, statistics and description. Location alone never names the technique.
export const FINISH_TYPES = ['layup', 'dunk', 'floater', 'hook', 'tip', 'paintJumper'] as const;
export type FinishType = (typeof FINISH_TYPES)[number];
export interface FinishPlayer { r: any; grp?: string; tend?: { dunk?: number } }
export interface FinishContext { transition?: boolean; putback?: boolean }
export interface FinishNorms {
  offset: Record<FinishType, number>;
  skill: Record<FinishType, number>;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rating = (r: any, key: string, fallback = 55) => Number.isFinite(r?.[key]) ? clamp(r[key], 1, 99) : fallback;
const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));
const empty = (): Record<FinishType, number> => ({ layup: 0, dunk: 0, floater: 0, hook: 0, tip: 0, paintJumper: 0 });

// Baseline attempts by technique, before matchup, fatigue, venue and the other
// game-context terms in sim.ts. This is a population model, not a conversion of
// any one player's observed FG% directly into a skill rating.
export const FINISH_BASE: Record<FinishType, number> = {
  layup: 0.56, dunk: 0.94, floater: 0.43, hook: 0.445, tip: 0.53, paintJumper: 0.43,
};

// Natural preference is only a default. An authored frequency can be zero, and
// does not change the probability of executing an otherwise identical attempt.
export function naturalDunkShare(r: any, _grp?: string): number {
  const reach = 0.55 * rating(r, 'hgt') + 0.30 * rating(r, 'jmp') + 0.15 * rating(r, 'dnk');
  return 0.70 * sigmoid((reach - 60) / 12) * sigmoid((rating(r, 'dnk') - 35) / 15);
}

export function finishMix(p: FinishPlayer, zone: 'rim' | 'paint', context: FinishContext = {}): Record<FinishType, number> {
  const r = p.r, mix = empty(), big = p.grp === 'B', guard = p.grp === 'G';
  if (zone === 'paint') {
    // Non-RA paint contains short jumpers too. Floaters and hooks share a
    // location, but use different execution skills and can occur at every group.
    mix.layup = big ? 0.04 : guard ? 0.02 : 0.03;
    mix.floater = big ? 0.13 : guard ? 0.53 : 0.32;
    mix.hook = big ? 0.54 : guard ? 0.025 : 0.18;
    mix.paintJumper = 1 - mix.layup - mix.floater - mix.hook;
    return mix;
  }
  const authored = p.tend?.dunk;
  let preference = Number.isFinite(authored) ? clamp(authored!, 0, 1) : naturalDunkShare(r, p.grp);
  // Run-outs and rebound catches create different opportunities. The smooth
  // odds tilt leaves an explicit zero at zero and never introduces a threshold.
  const tilt = context.transition ? 1.4 : context.putback ? 1.15 : 1;
  preference = preference * tilt / (1 + preference * (tilt - 1));
  const access = 0.55 * rating(r, 'hgt') + 0.35 * rating(r, 'jmp') + 0.10 * rating(r, 'dnk');
  const availability = sigmoid((access - 30) / 7);
  mix.dunk = preference * availability;
  const rest = 1 - mix.dunk;
  const tip = context.putback ? 0.40 : big ? 0.025 : 0.003;
  const hook = context.putback ? (big ? 0.04 : 0.01) : big ? 0.08 : guard ? 0.005 : 0.025;
  const floater = context.putback ? 0 : big ? 0.015 : guard ? 0.055 : 0.035;
  mix.tip = rest * tip;
  mix.hook = rest * hook;
  mix.floater = rest * floater;
  mix.layup = rest * (1 - tip - hook - floater);
  return mix;
}

export function finishSkill(r: any, type: FinishType): number {
  const lay = rating(r, 'lay');
  switch (type) {
    // In particular, Dunks and Inside are not inputs to an existing layup's
    // accuracy. Jumping is a small physical execution component, not preference.
    case 'layup': return 0.90 * lay + 0.10 * rating(r, 'jmp');
    case 'dunk': return 0.80 * rating(r, 'dnk') + 0.12 * rating(r, 'jmp') + 0.08 * rating(r, 'stre');
    case 'floater': return 0.75 * lay + 0.25 * rating(r, 'fg');
    case 'hook': return 0.85 * rating(r, 'ins') + 0.15 * rating(r, 'stre');
    case 'tip': return 0.60 * lay + 0.25 * rating(r, 'ins') + 0.15 * rating(r, 'jmp');
    case 'paintJumper': return rating(r, 'fg');
  }
}

export function finishCurve(type: FinishType, skill: number): number {
  const d = skill - 55;
  const down = type === 'dunk' ? 0.0025 : type === 'layup' || type === 'tip' ? 0.0045 : 0.003;
  const up = type === 'dunk' ? 0.0018 : type === 'layup' || type === 'tip' ? 0.003 : 0.0028;
  return d < 0 ? d * down : d * up / (1 + d / 40);
}

export function finishingPct(p: FinishPlayer, type: FinishType, norms?: FinishNorms): number {
  const raw = FINISH_BASE[type] + finishCurve(type, finishSkill(p.r, type)) + (norms?.offset[type] ?? 0);
  // Dunks can exceed 90%; neither elite technique nor poor technique is forced
  // onto the old universal 10–90% bound. A later contest still changes the result.
  return clamp(raw, type === 'dunk' ? 0.15 : 0.03, type === 'dunk' ? 0.99 : type === 'layup' || type === 'tip' ? 0.96 : 0.85);
}

export function finishMean(p: FinishPlayer, zone: 'rim' | 'paint', norms?: FinishNorms, context: FinishContext = {}): number {
  const mix = finishMix(p, zone, context);
  return FINISH_TYPES.reduce((sum, type) => sum + mix[type] * finishingPct(p, type, norms), 0);
}

export function finishLabel(type: FinishType): string {
  return { layup: 'a layup', dunk: 'a dunk', floater: 'a floater', hook: 'a hook shot', tip: 'a tip-in', paintJumper: 'a short jumper' }[type];
}

export function computeFinishNorms(entries: { p: FinishPlayer; rimWeight: number; paintWeight: number }[]): FinishNorms {
  const mass = empty(), skill = empty(), curve = empty();
  for (const entry of entries) {
    const rim = finishMix(entry.p, 'rim'), paint = finishMix(entry.p, 'paint');
    for (const type of FINISH_TYPES) {
      const w = Math.max(0, entry.rimWeight) * rim[type] + Math.max(0, entry.paintWeight) * paint[type];
      const s = finishSkill(entry.p.r, type);
      mass[type] += w; skill[type] += w * s; curve[type] += w * finishCurve(type, s);
    }
  }
  const offset = empty();
  for (const type of FINISH_TYPES) {
    skill[type] = mass[type] ? skill[type] / mass[type] : 55;
    offset[type] = mass[type] ? clamp(-curve[type] / mass[type], -0.08, 0.08) : 0;
  }
  return { offset, skill };
}

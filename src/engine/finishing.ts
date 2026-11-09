// Close-shot technique, preference and execution. These helpers have no random
// calls: the game chooses a technique once, then uses that same event for its
// result, statistics and description. Location alone never names the technique.
export const FINISH_TYPES = ['layup', 'dunk', 'floater', 'hook', 'tip', 'paintJumper'] as const;
export type FinishType = (typeof FINISH_TYPES)[number];
export interface FinishPlayer {
  r: any;
  grp?: string;
  tend?: { dunk?: number };
}
export interface FinishContext {
  transition?: boolean;
  putback?: boolean;
  opening?: number;
  post?: boolean; // a post-up: his back to the basket, so more of his close shots are hooks and turnarounds (Inside)
}
export interface FinishNorms {
  offset: Record<FinishType, number>;
  skill: Record<FinishType, number>;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rating = (r: any, key: string, fallback = 55) => (Number.isFinite(r?.[key]) ? clamp(r[key], 1, 99) : fallback);
const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));
const empty = (): Record<FinishType, number> => ({ layup: 0, dunk: 0, floater: 0, hook: 0, tip: 0, paintJumper: 0 });

// A rim protector's execution effect depends on whether he can contest this
// finish. Positioning already determines how often each opening occurs.
export type CloseContest = 'open' | 'pressured' | 'contested';
const neutralDifficulty = (contest: CloseContest, paint: boolean) =>
  contest === 'open' ? (paint ? 0.018 : 0.055) : contest === 'contested' ? -0.028 : -0.005;
export function closeContestExposure(contest: CloseContest, paint = false): number {
  const anchor = paint ? 0.06 : 0.11;
  return 1 - (neutralDifficulty(contest, paint) + 0.028) / anchor;
}

export function closeDefenseAdjustment(interior: number, contest: CloseContest, paint = false): number {
  const anchor = paint ? 0.06 : 0.11;
  // The league-average contest reproduces the previous difficulty curve. Scale
  // actual, nonnegative pressure, so a weak defender cannot make a tightly
  // contested finish easier than the identical open finish.
  return closeContestExposure(contest, paint) * Math.max(0, anchor + interior) - anchor + 0.028;
}

// Baseline attempts by technique, before matchup, fatigue, venue and the other
// game-context terms in sim.ts. This is a population model, not a conversion of
// any one player's observed FG% directly into a skill rating.
// 2026-11-08: dunks 0.94 → 0.87. Every dunk went in (98% after the open-look bonus, NBA about 90%), so a big's
// finishing rode on how often he dunked, not on his touch.
export const FINISH_BASE: Record<FinishType, number> = {
  layup: 0.56,
  dunk: 0.87,
  floater: 0.43,
  hook: 0.445,
  tip: 0.53,
  paintJumper: 0.43,
};

// Natural preference is only a default. An authored frequency can be zero, and
// does not change the probability of executing an otherwise identical attempt.
// 2026-11-08: the Dunks rating gates it across the whole scale (was centered at 35, so anyone over 60 counted as a
// full dunker), and capable dunkers want more of their looks as dunks (cap 0.7 → 1, reach centered at 56, not 60):
// bigs dunked on 15% of their rim attempts and the league on 3.6% of its shots (NBA centers about 35%, the league
// about 6–7%).
export const DUNK_WANT = { cap: 0.75, reach: 54, reachK: 9, dnk: 42, dnkK: 14 };
export function naturalDunkShare(r: any, _grp?: string): number {
  const reach = 0.65 * rating(r, 'hgt') + 0.25 * rating(r, 'jmp') + 0.1 * rating(r, 'dnk'); // was 0.55 / 0.3 / 0.15: guards dunked too often
  return (
    DUNK_WANT.cap * sigmoid((reach - DUNK_WANT.reach) / DUNK_WANT.reachK) * sigmoid((rating(r, 'dnk') - DUNK_WANT.dnk) / DUNK_WANT.dnkK)
  );
}
// How open the gather is, for finishMix's `opening` (2026-11-08): a clear look 1; a defender close but not contesting
// (sim.ts 'pressured') DUNK_PRESSURED; a contested one only for a real dunker, who goes up through the contact
// (DUNK_CONTESTED at most, by his Dunks rating), and the contest then makes it harder and blockable.
export const DUNK_PRESSURED = 0.7,
  DUNK_CONTESTED = 0.3,
  DUNK_THROUGH = { dnk: 60, k: 8 };
export const dunkOpening = (contest: CloseContest, r: any) =>
  contest === 'open'
    ? 1
    : contest === 'pressured'
      ? DUNK_PRESSURED
      : DUNK_CONTESTED * sigmoid((rating(r, 'dnk') - DUNK_THROUGH.dnk) / DUNK_THROUGH.k);
// Whether he can finish a clear gather with a dunk at all, beyond what he'd like: reach and lift, and (2026-11-08)
// his Dunks rating, so a tall, bouncy player who can't dunk in traffic lays it up instead. Ability, not preference:
// it applies in the game itself, whatever his playing style says.
export const DUNK_ABLE = { dnk: 46, k: 10 };
export const dunkAble = (r: any) =>
  sigmoid((0.55 * rating(r, 'hgt') + 0.35 * rating(r, 'jmp') + 0.1 * rating(r, 'dnk') - 30) / 7) *
  sigmoid((rating(r, 'dnk') - DUNK_ABLE.dnk) / DUNK_ABLE.k);

// A clear gather depends on creation, help defense and how predictable the attack is.
export function rimOpening(
  creation: number,
  help: number,
  spacing: number,
  usage: number,
  rimShare: number,
  transition: boolean,
  putback: boolean,
): number {
  const attention = Math.max(0, usage - 0.19) * 4 + Math.max(0, rimShare - 0.38) * 1.8;
  return sigmoid(0.1 + 0.055 * creation - 0.045 * help + 0.024 * spacing - attention + (transition ? 2 : putback ? 0.65 : 0));
}

export function rimDenial(opening: number, usage: number, rimShare: number): number {
  return (1 - opening) * clamp(0.1 + 0.78 * Math.max(0, rimShare - 0.32) + 0.8 * Math.max(0, usage - 0.2), 0, 1);
}

export function finishMix(p: FinishPlayer, zone: 'rim' | 'paint', context: FinishContext = {}): Record<FinishType, number> {
  const r = p.r,
    mix = empty(),
    big = p.grp === 'B',
    guard = p.grp === 'G';
  if (zone === 'paint') {
    // Non-RA paint contains short jumpers too. Floaters and hooks share a
    // location, but use different execution skills and can occur at every group.
    // Out of a post-up (2026-11-08) most are hooks and turnarounds, so Inside decides them.
    const post = !!context.post;
    mix.layup = big ? 0.04 : guard ? 0.02 : 0.03;
    mix.floater = post ? (big ? 0.04 : guard ? 0.3 : 0.15) : big ? 0.13 : guard ? 0.53 : 0.32;
    mix.hook = post ? (big ? 0.72 : guard ? 0.15 : 0.4) : big ? 0.54 : guard ? 0.025 : 0.18;
    mix.paintJumper = 1 - mix.layup - mix.floater - mix.hook;
    return mix;
  }
  const authored = p.tend?.dunk;
  let preference = Number.isFinite(authored) ? clamp(authored!, 0, 1) : naturalDunkShare(r, p.grp);
  // Run-outs and rebound catches create different opportunities. The smooth
  // odds tilt leaves an explicit zero at zero and never introduces a threshold.
  const tilt = context.transition ? 1.4 : context.putback ? 1.15 : 1;
  preference = (preference * tilt) / (1 + preference * (tilt - 1));
  const post = !!context.post && !context.putback;
  mix.dunk = preference * dunkAble(r) * (context.opening ?? 1) * (post ? 0.7 : 1);
  const rest = 1 - mix.dunk;
  const tip = context.putback ? 0.4 : big ? 0.025 : 0.003;
  // A post-up that gets all the way to the rim ends in a jump hook as often as a layup (2026-11-08).
  const hook = context.putback ? (big ? 0.04 : 0.01) : post ? (big ? 0.3 : guard ? 0.06 : 0.15) : big ? 0.08 : guard ? 0.005 : 0.025;
  const floater = context.putback || post ? 0 : big ? 0.015 : guard ? 0.055 : 0.035;
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
    case 'layup':
      return 0.9 * lay + 0.1 * rating(r, 'jmp');
    case 'dunk':
      return 0.8 * rating(r, 'dnk') + 0.12 * rating(r, 'jmp') + 0.08 * rating(r, 'stre');
    case 'floater':
      return 0.75 * lay + 0.25 * rating(r, 'fg');
    case 'hook':
      return 0.85 * rating(r, 'ins') + 0.15 * rating(r, 'stre');
    case 'tip':
      return 0.6 * lay + 0.25 * rating(r, 'ins') + 0.15 * rating(r, 'jmp');
    case 'paintJumper':
      return rating(r, 'fg');
  }
}

// Each technique's skill → its change in make chance, per point from 55 (below, above). 2026-11-08: about half as steep
// again for layups, tips, hooks and floaters, and much steeper below 55 for dunks: +10 Layups was worth about 2.7
// points of layup accuracy and +10 Dunks 0.3 of dunk accuracy, so height and leaping did most of the finishing.
export const FINISH_SLOPE: Record<FinishType, [number, number]> = {
  layup: [0.0065, 0.0045],
  tip: [0.0065, 0.0045],
  dunk: [0.006, 0.0024],
  hook: [0.005, 0.006],
  floater: [0.004, 0.0035],
  paintJumper: [0.003, 0.0028],
};
export function finishCurve(type: FinishType, skill: number): number {
  const d = skill - 55,
    [down, up] = FINISH_SLOPE[type];
  return d < 0 ? d * down : (d * up) / (1 + d / 40);
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
  return { layup: 'a layup', dunk: 'a dunk', floater: 'a floater', hook: 'a hook shot', tip: 'a tip-in', paintJumper: 'a short jumper' }[
    type
  ];
}

export function computeFinishNorms(entries: { p: FinishPlayer; rimWeight: number; paintWeight: number }[]): FinishNorms {
  const mass = empty(),
    skill = empty(),
    curve = empty();
  for (const entry of entries) {
    const rim = finishMix(entry.p, 'rim'),
      paint = finishMix(entry.p, 'paint');
    for (const type of FINISH_TYPES) {
      const w = Math.max(0, entry.rimWeight) * rim[type] + Math.max(0, entry.paintWeight) * paint[type];
      const s = finishSkill(entry.p.r, type);
      mass[type] += w;
      skill[type] += w * s;
      curve[type] += w * finishCurve(type, s);
    }
  }
  const offset = empty();
  for (const type of FINISH_TYPES) {
    skill[type] = mass[type] ? skill[type] / mass[type] : 55;
    offset[type] = mass[type] ? clamp(-curve[type] / mass[type], -0.08, 0.08) : 0;
  }
  return { offset, skill };
}

# Individual rating ceilings

Updated 2026-11-15. Implemented in `ratingCeilings.ts`, `potential.ts`, `development.ts`, `translation.ts` and `Game.ts`.

Every generated player has a separate hidden `p.ceil` value for each of these 21 trainable ratings:

| Group | Ratings |
| --- | --- |
| Basketball skills | Inside, Layups, Dunks, Free throws, Mid-range, Three-pointers, Passing, Dribbling, Offensive IQ, Defensive IQ, Blocks, Steals, Rebounding, Boxing out |
| Physical | Speed, Acceleration, Jumping, Strength, Endurance |
| Intangibles | Feel, Poise |

Height and wingspan remain measurements. Individual ceilings vary with the player's starting ability, development profile and frame. Training, coaching, good seasons and available overall potential do not raise these limits. Once a rating reaches its limit, normal positive growth stops. Growth that cannot fit can go to another skill below its own limit, or is lost. Filling every skill no longer unlocks higher ceilings. Decline and injury losses can still occur.

The physical frame allowance is now subject to the same `ceilFor`/`softTop` upper curve as skills: above 85, each additional point becomes harder to obtain, approaching 98. A natural 99 requires a designated generational rating or a recorded 98-to-99 breakthrough. The generational roll occurs once per player, including a failed roll, at 1 / 1,449,000. The existing breakthrough budget is 1/150 per league summer, shared across eligible ratings at 98; age and overall-room requirements can make the realized frequency lower. These exceptions apply to all trainable categories. A legacy or God-edited 98 above a lower personal ceiling is ineligible for a natural breakthrough; an edit cannot silently become a higher permanent ceiling.

`limitGrowth` is independent of the God Mode switch. Ordinary development, summer noise, first training camp, late-career IQ gains, and Feel/Poise growth all enforce individual limits. Potential refreshes cannot keep raising ceilings. Missing limits fail closed until initialization completes them.

Switching God Mode on reveals the ceilings without changing them. Explicit rating edits can exceed them and keep the edited values through save/reload; the existing ceilings remain stored and normal growth still respects them. An explicit True potential or player-card edit can deliberately establish a new skill plan. Existing saves acquire missing physical/intangible ceilings once. Already-earned or manually edited ratings above a legacy ceiling are preserved, but cannot gain farther naturally.

## Verification

`scripts/ratingCeilings.mts` checks 3,291 generated players across three seeded worlds, all 21 limits, within-player skill diversity, saturation, first camp, the real summer route, late IQ gains, physical limits and breakthrough exceptions, active development with God Mode on/off, explicit edits, save/reload and old-save completion. Its 300 30-year player development stress paths produced no ceiling overruns or unauthorized 99s; none of the sampled players reached a 90+ physical rating. This finite sample does not estimate the probability of the very rare generational event.

The build and all 19 fast regression checks passed. The independent 100,000-game rating-value regression passed against the previous reference; the 160,000-game reference was then refreshed from four full, original benchmark workers (seeds 7001–7004), with the overall-rating weights unchanged.

The six-season league audit completed with two extreme-record flags (8 and 9 wins) and one unrelated contract invariant failure: Atlanta exceeded a first-apron hard cap by about $2M. A separate fixture reproduced the existing `cbaFlow.ts` `fillRoster` minimum-signing path exceeding an existing hard cap; that function and the contract/CBA code are unchanged by this update. These remain separate open issues, not relaxed ceiling rules or relaxed test bands.

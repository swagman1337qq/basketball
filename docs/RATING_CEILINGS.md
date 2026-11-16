# Individual rating ceilings

Updated 2026-11-15. Implemented in `ratingCeilings.ts`, `potential.ts`, `development.ts`, `translation.ts` and `Game.ts`.

Every generated player has a separate hidden `p.ceil` value for each of these 21 trainable ratings:

| Group | Ratings |
| --- | --- |
| Basketball skills | Inside, Layups, Dunks, Free throws, Mid-range, Three-pointers, Passing, Dribbling, Offensive IQ, Defensive IQ, Blocks, Steals, Rebounding, Boxing out |
| Physical | Speed, Acceleration, Jumping, Strength, Endurance |
| Intangibles | Feel, Poise |

Height and wingspan remain measurements. Individual ceilings vary with the player's starting ability, development profile and frame. Training, coaching, good seasons and available overall potential do not raise these limits. Once a rating reaches its limit, normal positive growth stops. Growth that cannot fit can go to another skill below its own limit, or is lost. Filling every skill no longer unlocks higher ceilings. Decline and injury losses can still occur.

The physical frame allowance is now subject to the same `ceilFor`/`softTop` upper curve as skills: above 88, each additional point becomes harder to obtain, approaching 98. A natural 99 requires a designated generational rating or a recorded 98-to-99 breakthrough. The generational roll occurs once per player, including a failed roll, at 1 / 1,449,000. The existing breakthrough budget is 1/150 per league summer, shared across eligible ratings at 98; age and overall-room requirements can make the realized frequency lower. These exceptions apply to all trainable categories. A legacy or God-edited 98 above a lower personal ceiling is ineligible for a natural breakthrough; an edit cannot silently become a higher permanent ceiling.

`limitGrowth` is independent of the God Mode switch. Ordinary development, summer noise, first training camp, late-career IQ gains, and Feel/Poise growth all enforce individual limits. Potential refreshes cannot keep raising ceilings. Missing limits fail closed until initialization completes them.

Switching God Mode on reveals the ceilings without changing them. Explicit rating edits can exceed them and keep the edited values through save/reload; the existing ceilings remain stored and normal growth still respects them. An explicit True potential or player-card edit can deliberately establish a new skill plan. Existing saves acquire missing physical/intangible ceilings once. Already-earned or manually edited ratings above a legacy ceiling are preserved, but cannot gain farther naturally.

## The 88+ elite range

`SOFT_K` is 88 and `SOFT_SCALE` is 24: an exceptional raw ceiling near 117 produces a 95 personal ceiling without a generational flag. Ordinary development has no upper-scale penalty before 88 (personal ceilings and frame/age limits still apply). Marginal growth above 88 follows `exp(-(rating - 88) / 3)`: about 51% remains at 90, 26% at 92, 10% at 95 and 5% at 97. The rare generational gift uses scale 5.

`ratingGrowthGain` integrates this rate over the entire gain, including crossing 88. Starting at 88, seven raw points yield about 3.6 actual points; about 28 raw points are needed to reach 95. The result is the same whether that work is one update or many small updates. Raw training allocation is also bounded by `SKILL_WORK_PER_YEAR` 10, prorated to the update duration (5 raw points for a half-year summer, about 0.83 for a month), before the elite slowdown. This prevents a low-weight skill from absorbing an enormous overall-growth budget. First-camp revelations and annual luck use the same upper-tail curve. Skill redistribution happens before this final slowdown; unused high-end work is not refunded into the same ratings. Body growth, IQ gains, intangibles, summer luck and first-camp gains follow the curve; camp retains fractional progress. Declines are unchanged. Existing ratings, on-court effects and stored personal ceilings are preserved.

Controlled exceptional profiles with all other skills at their ceilings and a single 88 signature skill with a 95+ personal ceiling reached a displayed 95 in Blocks, Mid-range and Passing through the actual development functions, without God Mode, a generational flag or a breakthrough. They used a fixed 0.06-overall monthly development budget and focused training; the observed 36 months demonstrate attainability in these deliberately exceptional fixtures, not a career forecast or league frequency.

## Verification

`scripts/ratingCeilings.mts` checks 3,291 generated players across three seeded worlds, all 21 limits, within-player skill diversity, saturation, first camp, the real summer route, late IQ gains, physical limits and breakthrough exceptions, active development with God Mode on/off, explicit edits, save/reload and old-save completion. With the 88+ curve and training-work bound, its 300 30-year player development paths produced no ceiling overruns or unauthorized 99s; none reached a 90+ physical rating. Four players ever reached a 95+ signature, occupying 11 of 4,617 sampled development-years through age 36 (about 0.24%). These are controlled development paths, not a prediction of NBA population frequency. This finite sample does not estimate the probability of the very rare generational event.

The original ceiling update passed the build and all 19 fast regression checks; the 88+ follow-up adds `scripts/upperTail.mts` to the fast suite. The independent 100,000-game rating-value regression passed against the previous reference; the 160,000-game reference was then refreshed from four full, original benchmark workers (seeds 7001–7004), with the overall-rating weights unchanged.

The original ceiling update's six-season league audit completed with two extreme-record flags (8 and 9 wins) and one unrelated contract invariant failure: Atlanta exceeded a first-apron hard cap by about $2M. A separate fixture reproduced the existing `cbaFlow.ts` `fillRoster` minimum-signing path exceeding an existing hard cap; that function and the contract/CBA code are unchanged by this update. These remain separate open issues, not relaxed ceiling rules or relaxed test bands.

The 88+ follow-up passed the build and all 20 fast checks. Its independent 100,000-game rating-value check passed against both the previous and refreshed 160,000-game references, using full benchmark workers; overall weights remain unchanged. The six-season league audit had no broken invariants and one realism-band failure: a 7-win team in seed 11's opening season. The other five seasons passed. The existing emergency-signing hard-cap issue remains open even though it did not recur in this sample. The rating-value report also continues to flag weight/share differences for wing rebounding and big-man free throws; this progression change does not recalibrate overall weights.

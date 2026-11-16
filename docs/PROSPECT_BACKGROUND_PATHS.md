# Generated college and international backgrounds

Updated 2026-11-16. Implemented in `engine/prospectPathways.ts` and `Game.pipe` / `Game.mkProspect`.

Birthplace, childhood country, heritage, names and national-team eligibility come from `Game.bio`. Attending an American college changes the playing destination; it does not turn a player into someone born or raised in the United States, remove a native-script name, or add U.S. citizenship.

Generated NCAA prospects include U.S.-born players with foreign heritage, overseas-born players who moved to the U.S. earlier, and players born and raised abroad who come over for college. Club-to-professional careers remain available. The nationality-weight settings still determine the overall country mix.

College-player profiles show **Born**, **Grew up** and **Represents** separately, so an overseas childhood is visible alongside the American college.

For a player old enough to enter college, the destination is sampled separately from his childhood background. The following are **game design weights, not measured real-world enrollment percentages**:

| Childhood country | College route chance when a local club route is available |
| --- | --- |
| U.S., tribal nations, Canada, Bahamas | 100% (existing North American pipeline) |
| Australia, New Zealand | 60% |
| Nigeria, Senegal, Cameroon, Mali, DR Congo, South Sudan, Kenya, Angola, Côte d’Ivoire | 60% |
| European countries | 40% |
| Other countries | 45% |

Without a listed senior club, the existing college destination remains the fallback. His youth background now remains in his childhood country: a listed U18 club, a Canadian/Bahamian secondary school, or a city basketball academy. A missing club entry no longer invents a U.S. prep-school childhood. Players already raised in the U.S. still follow the U.S. high-school route.

Future-class prospects retain both their youth team and planned college/club destination in `p.pth`. The displayed current team changes with age through `prospectFrom`; birthplace and eligibility stay the same. Eighteen-year-old high-school/junior prospects retain the existing age rules. Initial veteran playing backgrounds use the same country-sensitive college choice.

Existing saves keep their generated people and stored paths. Newly generated future classes use the new rules. Authored cards and historical draft classes are not rewritten.

## Verification

`scripts/prospectPathways.mts` checks Finnish, German, Chinese and Nigerian overseas-to-college paths, continued domestic club routes where club data exists, foreign youth backgrounds without club data, U.S.-born heritage players, early immigrants, age-based team progression, identity/eligibility preservation and save/reload. It is part of `npm test`.

In one diagnostic sample of 3,000 generated prospects with default nationality weights, overseas-raised college prospects increased from 140 to 199; foreign-born college prospects increased from 264 to 330. U.S.-born prospects with foreign heritage remained present. These are finite generation samples, not fixed class quotas or real-world demographic estimates.

The six-season league audit (seeds 11 and 12, three seasons each) passed every realism band and reported zero broken invariants. The calendar fixture now isolates minute-target fatigue reductions from the separate full-game rest policy; it retains the strict same-player target reduction assertion.

The build and all 21 regression checks passed. The independent 100,000-game rating-value guard passed against the prior reference; a new 160,000-game reference was recorded from four complete original workers (seeds 7001–7004), and the same independent check passed against it. No partial-run restarts or reduced samples were used. The report still gives advisory weight/share warnings (including wing speed/acceleration and shooting/feel); no overall weights or on-court formulas were changed for this background update.

# Player cards: overall, abilities and court value — November 27, 2026

Reviewed all 37 available builds after the first published card review. Four further ability refinements pass both independent fit checks: Bronny James’s rookie season, Jeremy Lin’s Knicks stint, Monte Morris and KJ Simpson. Lin’s rookie potential rises from 56 to 60 so it no longer rules out his later existing Knicks build. Six other proposed ability changes were rejected. Michael Kidd-Gilchrist’s stronger published build remains unchanged at 52 overall and 62 potential.

This is a qualified improvement, not a claim that every card now reproduces the player perfectly. Some cards still use extreme defensive or shooting inputs to fit the engine; the evidence and unresolved cases are below. The simulation formulas, global overall weights, league statistics and save/autosave paths are unchanged.

## What the overall means in this game

The displayed overall comes from the position-specific rating weights, Feel and position adjustments in ratings.ts. It drives roster and management decisions; actual game output also depends on tendencies, role, stamina, teammates and opposition. A card’s descriptive ovr field cannot override that calculation.

Across four fresh leagues there are 1,689 rostered players: median exact overall 48.0, 90th percentile 60.9 and 99th percentile 68.0. Each team’s five highest-rated players have a median of 56.9; its next five have a median of 47.3. Therefore 66–68 here is near the top of this generated league. Embiid’s MVP build is at the 98.1st percentile; Barkley’s 1992–93 build at the 99.1st. Those are pool-relative rankings, not a guarantee of historical awards.

Badges summarize input abilities; their Hall-of-Fame tier is not a claim of career Hall-of-Fame status. An inflated input can still produce a misleading badge or automatic role even if its box score is close. This follow-up tests that problem rather than assigning arbitrary overall bonuses to famous names.

## Further changes adopted

- **Bronny James – Rookie year (2024–25) (48 → 44 overall):** Model a developmental reserve instead of a historically elite ball thief from 181 NBA minutes. Fresh mean: 2.34 PPG versus 2.30, 0.60 APG versus 0.81. These are minute-normalized results, not forced season records.
- **Jeremy Lin – Linsanity season (2011–12 Knicks) (57 → 57 overall):** Keep the attacking playmaker from the Knicks stint, without treating a short-season steal rate as a near-max defensive ability. Fresh mean: 14.76 PPG versus 14.63, 6.34 APG versus 6.17. These are minute-normalized results, not forced season records.
- **Monte Morris – 2018–19 (59 → 58 overall):** Preserve the efficient low-turnover reserve guard; distinguish one excellent shooting season from generational shooting ability. Fresh mean: 10.97 PPG versus 10.38, 4.30 APG versus 3.62. These are minute-normalized results, not forced season records.
- **KJ Simpson – Draft night (2024, Colorado) (43 → 42 overall):** Replace the elite-finisher/elite-steal compensation with a raw small guard; keep the separately fitted college build. Fresh mean: 9.12 PPG versus 7.83, 2.84 APG versus 3.11. These are minute-normalized results, not forced season records.
- **Lin rookie potential only:** 56 → 60. This is a projected development ceiling grounded in the already available later card, not a claim to simulate his entire career. Present ratings, tendencies and historical source totals stay intact.

KJ’s potential of 50 is an estimated development projection. His separately fitted Colorado ratings and statistics remain intact. Exact historical totals and percentage references on every card are unchanged. Untouched saved library templates update, while explicit rating/style/potential/Feel/work/college edits stay protected. Existing players require reapplying a template; the league migration version is unchanged.

## All 37 builds: normal overall and actual engine checks

The automatic minutes column shows the mean target on four generated teams / historical MPG. It measures coaching decisions in those contexts. It cannot identify real medical restrictions, injuries, tanking, depth-chart openings or development assignments. NCAA minutes are not directly comparable with a hypothetical NBA role.

The court-effect column comes from 384 games per card in four other worlds. Each build plays a fixed 24-minute role against the same-position generated comparator nearest overall 50, with the same teammates, AI-refreshed style, rotating opponents and alternating home court. It is the change in **whole-team net points per 100 possessions**, not NBA BPM. The brackets are a diagnostic normal interval using the larger of game-paired and between-world uncertainty. Four worlds are a limited sample; overlap and system uncertainty preclude confident fine rankings.

| Build | Overall before → shipped | Generated-pool percentile | Auto target / real MPG | Team effect [diagnostic interval] | Decision |
|---|---:|---:|---|---:|---|
| 0 · Luka Dončić – Rookie year (2018–19) | 58 → 58 | 84.1% | 31.8 / 32.2 | 1.58 [-0.06, 3.22] | Retained |
| 1 · Dalton Knecht – Rookie year (2024–25) | 48 → 48 | 47.8% | 13.4 / 19.2 | -1.51 [-3.54, 0.53] | Retained |
| 2 · Ben Simmons – Rookie year (2017–18) | 57 → 57 | 83.6% | 31.8 / 33.7 | 2.13 [0.40, 3.87] | Retained |
| 3 · Al Horford – Rookie year (2007–08) | 52 → 52 | 67.8% | 26.0 / 31.4 | 0.27 [-1.38, 1.93] | Retained |
| 4 · Chris Paul – Rookie year (2005–06) | 59 → 59 | 86.4% | 32.0 / 36.0 | 3.55 [1.82, 5.27] | Retained |
| 5 · Klay Thompson – Rookie year (2011–12) | 55 → 55 | 76.7% | 27.0 / 24.4 | -1.70 [-3.49, 0.09] | Retained |
| 6 · Kawhi Leonard – Rookie year (2011–12) | 57 → 57 | 82.1% | 31.0 / 24.0 | 1.46 [-0.83, 3.76] | Retained |
| 7 · Dwight Howard – Rookie year (2004–05) | 53 → 53 | 68.6% | 26.5 / 32.6 | 0.68 [-1.45, 2.81] | Retained |
| 8 · John Wall – Rookie year (2010–11) | 56 → 56 | 80.7% | 31.8 / 37.8 | 1.69 [-0.07, 3.44] | Retained |
| 9 · Yi Jianlian – Rookie year (2007–08) | 50 → 50 | 59.1% | 23.3 / 25.0 | -0.06 [-1.80, 1.68] | Retained |
| 10 · Andrei Kirilenko – Rookie year (2001–02) | 58 → 58 | 85.8% | 31.5 / 26.2 | 0.63 [-1.93, 3.19] | Retained |
| 11 · Jeremy Lin – Rookie year (2010–11) | 52 → 52 | 66.1% | 24.5 / 9.8 | 2.58 [0.83, 4.34] | Potential only |
| 12 · Toney Douglas – Rookie year (2009–10) | 55 → 55 | 75.3% | 29.5 / 19.4 | 1.94 [0.18, 3.71] | Retained |
| 13 · Jan Veselý – Rookie year (2011–12) | 49 → 49 | 54.4% | 23.3 / 18.9 | 0.51 [-1.20, 2.22] | Retained |
| 14 · Bismack Biyombo – Rookie year (2011–12) | 50 → 50 | 60.1% | 24.3 / 23.1 | 0.65 [-1.01, 2.31] | Retained |
| 15 · Bronny James – Rookie year (2024–25) | 48 → 44 | 30.8% | 5.0 / 6.7 | -2.52 [-4.32, -0.72] | Refined |
| 16 · Jarrett Culver – Rookie year (2019–20) | 53 → 53 | 70.2% | 26.5 / 23.9 | 0.96 [-0.74, 2.65] | Retained |
| 17 · Jarred Vanderbilt – 2022–23 | 55 → 55 | 77.0% | 31.0 / 24.1 | 0.97 [-0.85, 2.79] | Retained |
| 18 · Maxi Kleber – Prime (2019–20) | 55 → 55 | 76.4% | 31.0 / 25.5 | 1.20 [-0.57, 2.96] | Retained |
| 19 · Joel Embiid – Draft night (2014, Kansas) | 62 → 62 | 92.6% | NCAA; separate context | 2.59 [0.19, 4.98]¹ | Retained |
| 20 · Joel Embiid – Rookie year (2016–17) | 64 → 64 | 95.5% | 34.8 / 25.4 | 4.67 [2.96, 6.38] | Retained |
| 21 · Joel Embiid – MVP season (2022–23) | 66 → 66 | 98.1% | 37.4 / 34.6 | 3.69 [2.05, 5.33] | Retained |
| 22 · Anthony Bennett – Draft night (2013, UNLV) | 46 → 46 | 40.9% | NCAA; separate context | -0.35 [-2.09, 1.40]¹ | Retained |
| 23 · Tyler Hansbrough – Draft night (2009, North Carolina) | 47 → 47 | 42.9% | NCAA; separate context | -0.65 [-2.74, 1.45]¹ | Retained |
| 24 · Blake Griffin – Rookie year (2010–11) | 59 → 59 | 87.7% | 32.5 / 38.0 | 2.68 [1.00, 4.37] | Retained |
| 25 · Jeremy Lin – Linsanity season (2011–12 Knicks) | 57 → 57 | 82.7% | 31.8 / 26.9 | 3.17 [1.43, 4.91] | Refined |
| 26 · Robert Sacre – Prime (2013–14) | 50 → 50 | 56.8% | 24.3 / 16.8 | 0.07 [-2.25, 2.38] | Retained |
| 27 · Matt Ryan – 2023–24 | 42 → 42 | 25.6% | 7.1 / 13.9 | -3.60 [-6.53, -0.67] | Retained |
| 28 · Monte Morris – 2018–19 | 59 → 58 | 85.6% | 31.8 / 24.0 | -0.12 [-1.85, 1.60] | Refined |
| 29 · Jalen Green – Rookie year (2021–22) | 51 → 51 | 61.3% | 21.5 / 31.9 | -0.65 [-2.40, 1.09] | Retained |
| 30 · Emmanuel Mudiay – 2021–22 | 50 → 50 | 59.0% | 23.0 / 21.7 | 0.19 [-1.58, 1.97] | Retained |
| 31 · KJ Simpson – Draft night (2024, Colorado) | 43 → 42 | 23.2% | 1.1 / 23.4 | -0.69 [-2.43, 1.05] | Refined |
| 32 · Henry Ellenson – Worst season (2016–17 rookie) | 39 → 39 | 15.7% | 0.0 / 7.7 | -1.27 [-2.92, 0.39] | Retained |
| 33 · Charles Barkley – Rookie (1984-85 Philadelphia 76ers) | 59 → 59 | 86.6% | 32.5 / 28.6 | 2.21 [0.34, 4.09] | Retained |
| 34 · Charles Barkley – Statistical peak (1989-90 Philadelphia 76ers) | 66 → 66 | 97.6% | 36.8 / 39.1 | 2.21 [-0.32, 4.74] | Retained |
| 35 · Charles Barkley – MVP (1992-93 Phoenix Suns) | 68 → 68 | 99.1% | 38.0 / 37.6 | 3.12 [1.35, 4.88] | Retained |
| 36 · Michael Kidd-Gilchrist – Rookie (2012–13 Charlotte Bobcats) | 52 → 52 | 66.7% | 25.5 / 26.0 | 0.30 [-1.40, 2.00] | Retained |

¹ College-only builds are hypothetical NBA projections in this court test. Their validated NCAA output does not establish that NBA readiness.

MKG’s normal target is 25.5 minutes versus his 26.0 historical target. Bronny’s changes reduce the normal target from 13.1 to 5.0 versus 6.7 historically. Morris’s normal target only falls from 32.8 to 31.8 versus 24.0; that discrepancy remains. KJ’s target is only 1.1 versus 23.4 in the real NBA sample. A fair counterfactual team is not the same as his actual team’s opportunities, so these differences are reported rather than hidden with manual overall overrides.

The same-role court check also prevents treating a similar overall as identical usefulness: rookie Chris Paul has a larger measured benefit than Morris in this experiment despite their close overalls. The interval for Embiid rookie overlaps the MVP build’s interval; this test does not prove the rookie was better or establish a historical MVP ranking.

## Candidate comparison and rejection rule

Four training worlds were separate from the six held-out validation worlds. For NBA cards each build was checked for 80 games per held-out world in each of two style modes (960 games per build). The Kansas college candidate uses generated college identities; its NBA court projection is a separate diagnostic.

The first exploratory comparisons did not reproduce exactly in a fresh standalone process. All four shipped ability refinements were rechecked with the published standalone runner before release and passed both improvement gates. Exploratory raw results are retained separately; the report uses the standalone recheck.

Adoption requires at least a 2% improvement in both scores and no new major category diagnostic miss. The sampling-aware box score adds rough binomial/Poisson sampling bands to fixed model tolerances; these bands are practical diagnostics, not formal uncertainty estimates of a player’s true talent. The detailed score also checks source shot-location shares, conversion and supported creation labels. Smaller is better; the two scales are different.

| Candidate | Ability decision | Sampling-aware box error | Detailed source/chart error |
|---|---|---:|---:|
| 5 · Klay Thompson – Rookie year (2011–12) | Retain published abilities | 0.087 → 0.080 | 2.010 → 2.173 |
| 9 · Yi Jianlian – Rookie year (2007–08) | Retain published abilities | 0.326 → 0.372 | 4.328 → 4.637 |
| 11 · Jeremy Lin – Rookie year (2010–11) | Retain published abilities | 0.137 → 0.214 | 2.597 → 3.680 |
| 15 · Bronny James – Rookie year (2024–25) | Adopt ability change | 0.046 → 0.032 | 1.384 → 0.695 |
| 19 · Joel Embiid – Draft night (2014, Kansas) | Retain published abilities | 0.041 → 0.066 | 0.710 → 0.957 |
| 25 · Jeremy Lin – Linsanity season (2011–12 Knicks) | Adopt ability change | 0.050 → 0.046 | 1.080 → 1.015 |
| 26 · Robert Sacre – Prime (2013–14) | Retain published abilities | 0.108 → 0.133 | 0.911 → 1.270 |
| 27 · Matt Ryan – 2023–24 | Retain published abilities | 0.053 → 0.050 | 4.138 → 4.665 |
| 28 · Monte Morris – 2018–19 | Adopt ability change | 0.235 → 0.190 | 1.806 → 1.686 |
| 31 · KJ Simpson – Draft night (2024, Colorado) | Adopt ability change | 0.395 → 0.314 | 5.319 → 4.314 |

Klay and Matt Ryan improve the sampling-aware aggregate slightly but lose detailed shot-chart accuracy, so their published abilities stay. Lowering Lin rookie, Yi, Sacre or Kansas Embiid’s extreme inputs worsens the fit; those changes stay rejected. Lin rookie’s potential correction is independent of the rejected ability change. All rejected builds and raw outputs remain in the JSON audit.

## Player identity checks

These interpretations compare the named version and its input abilities with its observed reference, not the player’s entire career. They are scouting judgments, not a new numeric real-world ranking.

- **Luka Dončić – Rookie year (2018–19):** Large on-ball creator; rookie efficiency and incomplete defense, not his later peak.
- **Dalton Knecht – Rookie year (2024–25):** Scoring/shooting reserve; a weak defensive profile limits the overall.
- **Ben Simmons – Rookie year (2017–18):** Large transition playmaker and finisher with a very limited jumper.
- **Al Horford – Rookie year (2007–08):** Mobile, rebounding rookie big; role and teammates affect his minutes.
- **Chris Paul – Rookie year (2005–06):** High-IQ lead guard and passer; a poor rookie three-point season is not peak CP3 shooting.
- **Klay Thompson – Rookie year (2011–12):** Shooting wing; the max three-point input remains a fit compensation, not proof of generational rookie shooting.
- **Kawhi Leonard – Rookie year (2011–12):** Low-usage defensive/rebounding wing; generated teams often start him more than the real rookie team did.
- **Dwight Howard – Rookie year (2004–05):** Athletic rebounding big; later post game and peak defense are not the rookie reference.
- **John Wall – Rookie year (2010–11):** Fast lead guard and playmaker with unreliable outside shooting.
- **Yi Jianlian – Rookie year (2007–08):** Athletic shooting big; near-max blocking remains an unresolved compensation in the source fit.
- **Andrei Kirilenko – Rookie year (2001–02):** Versatile defensive forward; box rates do not certify his full defensive impact.
- **Jeremy Lin – Rookie year (2010–11):** Small-sample reserve with later upside; extreme steal/block inputs and excess automatic minutes remain unresolved.
- **Toney Douglas – Rookie year (2009–10):** Reserve guard; generated teams give him more minutes than the historical reference.
- **Jan Veselý – Rookie year (2011–12):** Athletic reserve big with major shooting limitations.
- **Bismack Biyombo – Rookie year (2011–12):** Young rebounding/rim-protection big with a limited offensive role.
- **Bronny James – Rookie year (2024–25):** Developmental reserve; constrained defense/passing/endurance inputs fit the tiny NBA sample better.
- **Jarrett Culver – Rookie year (2019–20):** Raw wing with offensive limitations; shooting and role still depend on context.
- **Jarred Vanderbilt – 2022–23:** Rebounding defensive forward, limited shooting; availability is not recreated by the card.
- **Maxi Kleber – Prime (2019–20):** Stretch/defensive big; automatic minutes can exceed the reference.
- **Joel Embiid – Draft night (2014, Kansas):** College rim-protection prospect; NCAA output does not validate this high NBA-ready overall.
- **Joel Embiid – Rookie year (2016–17):** Productive rookie center; real medical minutes restrictions are outside this build.
- **Joel Embiid – MVP season (2022–23):** Elite scoring center near the top of the generated pool; same-role game effects are not a proof of MVP ranking.
- **Anthony Bennett – Draft night (2013, UNLV):** College scoring forward; NBA readiness remains a projection, not a validated career outcome.
- **Tyler Hansbrough – Draft night (2009, North Carolina):** College interior scorer/rebounder; NBA readiness remains a projection.
- **Blake Griffin – Rookie year (2010–11):** Athletic rookie scorer/rebounder; Oklahoma snapshot is separate.
- **Jeremy Lin – Linsanity season (2011–12 Knicks):** Attacking Knicks lead guard; less inflated stealing and stronger decision-making fit this stint better.
- **Robert Sacre – Prime (2013–14):** Backup center; near-max blocking and excess automatic minutes remain unresolved engine-fit compromises.
- **Matt Ryan – 2023–24:** Deep-bench shooting specialist; a max shooting input from 91 threes remains uncertain.
- **Monte Morris – 2018–19:** Efficient low-turnover reserve guard; lowering shooting/handle/endurance reduces the inflated profile, but generated minutes remain high.
- **Jalen Green – Rookie year (2021–22):** Raw high-volume rookie scorer; generated teams do not reproduce his real team’s developmental minutes.
- **Emmanuel Mudiay – 2021–22:** Estimated post-prime level from 2018–20; two 2021–22 games cannot identify stable skills.
- **KJ Simpson – Draft night (2024, Colorado):** Raw small NBA guard; remove elite-finisher/steal compensation, keep Colorado separately. Generated-team minutes remain much lower than the real sample.
- **Henry Ellenson – Worst season (2016–17 rookie):** Deep reserve offensive big; generated teams may give him no minutes even when a real team used a brief trial.
- **Charles Barkley – Rookie (1984-85 Philadelphia 76ers):** Strong rebounding/finishing rookie forward; later peak skill is not assumed.
- **Charles Barkley – Statistical peak (1989-90 Philadelphia 76ers):** Elite efficient interior scorer/rebounder near the top of the generated pool.
- **Charles Barkley – MVP (1992-93 Phoenix Suns):** Elite primary scorer/rebounder; the highest overall among these Barkley builds.
- **Michael Kidd-Gilchrist – Rookie (2012–13 Charlotte Bobcats):** Athletic defensive/rebounding wing with a very weak jumper; automatic minute target is close to his rookie role.

## Remaining engine and evidence limits

- Lin’s 285-minute rookie sample contains 33 steals. His published high steal input still produces substantially fewer steals at historical minutes. Sacre’s lower blocking proposal loses a previously close block-rate fit. Those are engine-fit conflicts, not reasons to pretend an extreme raw input is realistic.
- Klay, Matt Ryan and Morris demonstrate why one season’s shooting percentage cannot be treated as generational talent. Two more conservative proposals lose the detailed fit and are retained only as rejected experiments. Morris’s accepted proposal lowers the inflated profile but still overproduces assists (about 4.30 versus 3.62 at his real minutes).
- KJ still scores about 9.12 versus 7.83 at historical minutes. Bronny’s mean assists are about 0.60 versus 0.81, despite better overall fit. Better aggregate fit does not mean every category improves.
- MKG’s non-restricted-area paint conversion remains above the historical 16-for-67 sample. Supported named action labels do not identify the full catch-and-shoot/pull-up split. Era, system, availability, defense, complete careers and some older shot charts remain unverified.
- The 100,000-game rating guard passes preservation of each rating’s measured value, but warns that several overall weights differ from current measured effects. Examples: guard passing 6.5% weight versus 11.5% measured; wing defensive IQ 12.1% versus 16.7%; big blocking 6.5% versus 0.9%. This review does not silently reweight every player or re-record a baseline to hide those warnings.

Historical source totals and URLs are retained per card. The first audit remains an unchanged record of the first publication. Primary checks include the [official Lakers media guide](https://lalweb.blob.core.windows.net/public/lakers/media-relations/2025-26-Lakers-Media-Guide.pdf) for Bronny’s season and [Denver’s discussion of Morris’s reserve role and ball security](https://www.nba.com/nuggets/news/denver-nuggets-stat-of-week-monte-morris-assist-turnover-ratio-081319). Basketball-Reference explains why its [BPM estimate](https://www.basketball-reference.com/about/bpm2.html) is a different measure from the controlled team-effect experiment here. Mirrored NBA shot records in the first audit are secondary data and are labeled by source; their per-season makes/attempts were reconciled to season totals.

## Reproduction and safety checks

- node --import tsx scripts/cardAccuracy.mts INDEX 80 reproduces the current card’s held-out comparison; full before/after outputs are in the audit.
- node --import tsx scripts/cardRealism.mts INDEX 96 reproduces the current 384-game court check. Defaults select MKG (36).
- scripts/playerCardRefinement.mts checks all 37 current builds, protected edits, prior-library upgrades, college preservation, apply/undo and source identities. The overall review stores both previous and shipped templates.
- Scouting selection is read-only and consumes no simulation randomness. A four-scout monthly refresh measured about 2.79 ms versus 1.36 ms previously; the added work is about 1.43 ms **per monthly refresh**, not per game possession. Cached analytics coverage reads measured 0.025 ms. This microbenchmark is not a season-throughput guarantee.

Complete data: [overall/ability audit](PLAYER_CARD_REALISM_2026-11-27.json). Earlier source and fit record: [first published review](PLAYER_CARD_REFINEMENT_2026-11-27.md). The downloadable pack contains the latest importable cards and both reviews.

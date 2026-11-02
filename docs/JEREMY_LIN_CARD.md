# Jeremy Lin — Linsanity season (2011–12 Knicks)

Added 2026-10-31 as preset 25; rebuilt 2026-11-02 from the official NBA shot chart. The separate 2010–11 Warriors rookie card remains available. This card represents all 35 Knicks regular-season appearances, including pre-breakout games, rather than extrapolating the February hot streak.

In God Mode, open Player cards and choose **Jeremy Lin – Linsanity season (2011–12 Knicks)**. Untouched saved library copies update when the app is reopened. If the card is already applied to a player, apply it again to give that player the revised build. Customized library builds and previously imported JSON files retain their edits. The downloadable copy is `public/cards/jeremy-lin-2011-12.json`. Applying keeps the recipient's identity, age, team, contract and history.

## What changed, and why the finishing ratings are modest

The previous fit moved Inside, Dunks, Layups and Mid-range together to match aggregate FG%. That hid an incorrect shooting profile. The new procedure holds physical attributes fixed, tests rim accuracy separately from outside-paint mid-range accuracy, and then checks scoring volume and the rest of the box score.

| Rating | Before | Revised |
|---|---:|---:|
| Inside | 29 | 35 |
| Dunks | 29 | 10 |
| Layups | 49 | 40 |
| Mid-range | 42 | 65 |

These are engine-scale judgments, not literal shooting percentages or uniquely measurable historical skills. The full-season restricted-area result was below the contemporary league average: **74/152 (48.7%) versus 60.5%**. The chart labels **69/133 layups (51.9%)** and **3/3 dunks**. Three successful dunks do not establish elite NBA dunking ability. His speed and acceleration remain 82 and 85; the finishing rebuild does not reduce his quickness.

The simulator still blends Inside, Dunks, Layups, height and jumping into rim skill; non-RA paint also blends rim/jumper touch. Dunk versus layup play-by-play descriptions do not have separately simulated success probabilities. This update improves the card's measured zone profile; it does **not** resolve that engine limitation or prove isolated layup/dunk skill. Avoid reading the individual numbers as independently validated probabilities.

## Recorded shot locations

The official NBA `Shot_Chart_Detail` response has 383 attempts and 171 makes across 35 game IDs, dated 2011-12-28 through 2012-03-24. Its `SHOT_ZONE_BASIC` counts reconcile exactly with the season totals.

| NBA zone | Made / attempted | FG% | Share of attempts |
|---|---:|---:|---:|
| Restricted area | 74 / 152 | 48.7% | 39.7% |
| Non-RA paint | 37 / 77 | 48.1% | 20.1% |
| Mid-range outside the paint | 36 / 79 | 45.6% | 20.6% |
| Corner three, both sides | 6 / 13 | 46.2% | 3.4% |
| Above-the-break three | 18 / 62 | 29.0% | 16.2% |
| All shots | 171 / 383 | 44.6% | 100% |

The card's zone preferences now use these attempt shares, rounded to one decimal. Basketball Reference's 0–3-foot distance bin is a different boundary from the NBA restricted area and is not substituted for it. Corner shooting is checked through combined three-point output; thirteen attempts cannot support a precise independent corner skill.

Creation remains an estimate: older NBA action tags do not reliably distinguish every ordinary jump shot taken off the catch from one off the dribble. The excessive 20% stepback preference is reduced to 2%, informed by the chart's two tagged stepbacks; fadeaways are 3%. The 25% catch/70% pull-up split is an authored estimate, not a claimed tracking measurement. Shot-location records, action tags and inferred creation preferences are kept distinct.

## Independent production-engine comparison

The final build was checked on world seeds **101, 202, 303**, unused during fitting, at 200 games per world/style: **1,200 games per build, 2,400 total old/new**. Authored and AI-refreshed tendencies are tested separately, alternating home/away against all 29 opposing rosters. AI refresh is invoked once at fixed skills/age; this is not a career or monthly development simulation. World generation and game random streams are seeded independently.

Rates below are normalized by actual simulated minutes to his historical 940/35 = 26.86 minutes. No points, shot results, or box-score counters are forced.

| Category | Actual | Previous card on current engine | Revised |
|---|---:|---:|---:|
| Points | 14.63 | 15.10 | 14.22 |
| Field-goal attempts | 10.94 | 10.90 | 10.37 |
| Three-point attempts | 2.14 | 2.27 | 2.11 |
| Free-throw attempts | 5.23 | 5.82 | 5.38 |
| Offensive rebounds | 0.51 | 0.67 | 0.62 |
| Defensive rebounds | 2.54 | 3.08 | 2.76 |
| Total rebounds | 3.06 | 3.75 | 3.38 |
| Assists | 6.17 | 5.70 | 5.73 |
| Steals | 1.57 | 1.46 | 1.55 |
| Blocks | 0.26 | 0.26 | 0.23 |
| Turnovers | 3.60 | 3.94 | 3.53 |
| Personal fouls | 2.23 | 2.57 | 2.48 |
| FG% | 44.6% | 44.5% | 44.6% |
| 3P% | 32.0% | 31.7% | 33.3% |
| FT% | 79.8% | 80.6% | 79.6% |

| Zone result | Actual | Previous | Revised |
|---|---:|---:|---:|
| Restricted-area FG% | 48.7% | 53.6% | 50.1% |
| Non-RA-paint FG% | 48.1% | 40.2% | 43.9% |
| Outside-paint mid-range FG% | 45.6% | 39.7% | 45.1% |
| Restricted-area attempt share | 39.7% | 45.8% | 41.6% |
| Non-RA-paint attempt share | 20.1% | 14.7% | 18.7% |
| Mid-range attempt share | 20.6% | 18.7% | 19.4% |
| Corner-three attempt share | 3.4% | 2.2% | 3.6% |
| Above-break-three attempt share | 16.2% | 18.6% | 16.7% |

The unweighted RMSE across restricted-area, non-RA-paint and outside-paint-mid-range FG% falls from **6.33 to 2.58 percentage points**, a 59% reduction. The revised card measures **58 overall, 60 potential** under the current overall weights.

All declared box-score and zone diagnostic bands pass, including separate checks after AI refresh. The remaining non-RA-paint miss is **4.2 percentage points low**. Overall rebounding and fouls are somewhat high; assists are somewhat low. Corner and above-break efficiency do not reproduce the noisy 13- and 62-attempt historical splits separately. These are measured limitations, not claims of exact realism.

Team context, age, tactics, fatigue, minutes and development affect live results. Physical ratings, personality, intangibles and potential are authored judgments. Historical teammate effects, exact play types, injuries and future development are not validated. Freeze attributes to retain the season's build; Freeze tendencies retains its preferences exactly.

## Sources and reproduction

- [NBA player shooting page](https://www.nba.com/stats/player/202391/shooting?Season=2011-12): official shot-chart endpoint, player 202391, season 2011–12, Regular Season, `ContextMeasure=FGA`; retrieved 2026-11-02. The complete request URL, zone/action counts and league comparison counts are frozen in `.review/jeremy-lin-targets.json`.
- [Basketball Reference](https://www.basketball-reference.com/players/l/linje01.html) and [complete season totals](https://www.landofbasketball.com/nba_players_season_stats/2012/jeremy_lin_full.htm): box-score totals, divided by 35; shooting percentages use total makes/attempts.

With Node 24+: `node .review/validate-jeremy-lin.mjs`. The script uses the production engine via `.review/lin-card-eval.mjs`, checks source reconciliation and preset/download parity, exercises library upgrades while protecting manual edits, and verifies identity/contracts and undo. Numerical results, seeds, exact card and declared tolerances are saved in `.review/jeremy-lin-validation.json`.

No global shooting formula, league baseline, other card, contract rule or saved-league migration version changes in this rebuild.

Broader-suite note: `.review/test-card-migrations.mjs` currently fails its pre-existing Luka authored-style comparison (`dom` 72 versus 67.3). The same failure was reproduced with published `playerCard.ts` and `cardBuilds.ts` at `fa3db2f`; Lin’s focused source/import/library/undo checks above pass. The general carrier-retune path is outside this card-only rebuild.

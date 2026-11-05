# Sequential engine audit, November 5, 2026

## 1. Turnover and foul event intervals

Accepted a correctness fix. Road and adjustment turnover risk previously shortened the shooting-foul interval by the same amount. The event selector now gives the full configured interval to shooting fouls and removes the additional turnover probability from ordinary shots. Ratings, turnover coefficients, contracts and player cards are unchanged. Existing leagues use the correction on their next game.

The proposed turnover-to-transition explanation was checked and rejected. The baseline engine does not start a fast break after a steal. Its transition flag comes from defensive rebounds against a glass-crashing offense. No transition change was made in this step. The 100-season baseline had a mean within-season turnover-rate standard deviation of 1.05 turnovers per 100 possessions, with team-season rates from 10.40 to 17.81. These observations alone do not justify flattening ball-security skill differences.

### Validation

- Exact event-distribution regression, 100,000 evenly spaced draws per condition. Adding 2.8 percentage points of turnover risk keeps shooting fouls at 8.8%, increases turnovers from 11.8% to 14.6%, and reduces ordinary shots by 2.8 points.
- Six archived outlier schedules, six independent 82-game replays per team, before and after. Total 5,904 games. Identical inputs and seeds in each pair. Player/team scoring, field-goal counts, steal/turnover relationships and shot probabilities passed.
- Denver's average replay wins changed from 10.17 to 11.83. Its net rating changed from -17.75 to -16.73. This is a targeted replay result, not a long-save forecast. Cincinnati still averaged 69.83 wins and Birmingham still averaged 11.33.
- Two fresh spectator leagues for three seasons each, including native offseasons. Total 7,380 regular-season games, zero roster-integrity flags. Compared with the same six baseline seed-years, the largest win total moved from 70 to 69, the smallest stayed 11, average absolute margin moved from 13.89 to 14.01, and 20-point blowouts moved from 25.47% to 25.56%. Extreme-record frequency is unresolved.
- Full-season FG% stayed near baseline, 47.17% before and 47.10% after. FTA/FGA rose from 25.95% to 26.63%, as expected when restoring shooting-foul opportunities.
- Typecheck, production build and finishing integration passed, including 20 same-seed watched/quick pairs and old-save round trip. Existing build size warnings remain.

### Decision

Keep the event-interval correction because it fixes a demonstrated probability-allocation error. It does not materially fix league parity. Continue to shot context, then rebounding, then roster construction.

## 2. Close-shot contest exposure

Accepted the revised contest model after rejecting a first candidate that could reverse the open/contested ordering against weak rim protection. The final model scales nonnegative interior pressure by how much of the finish the defense can contest. Its neutral-pressure case reproduces the prior open, pressured and contested difficulty values. It also reduces close-shot block probability when a finisher gets clear. Jump-shot defense and shooting ratings are unchanged. The pressure anchors, 0.11 at the rim and 0.06 in non-RA paint, are model parameters, not measured NBA tracking estimates.

### Validation

- `scripts/shotContext.mts` plays 320 games with matched offense and weak/strong shot-blocking opponents. Raising the defenders' block rating from 35 to 75 reduces expected layup accuracy by 2.37 percentage points on open looks and 10.59 points on contested looks. A deterministic pressure sweep verifies open <= pressured <= contested defensive difficulty, including very weak defenses.
- 1,200 paired neutral-schedule games per version, with identical teams, venues and seeds. Absolute margin fell from 14.58 to 13.99, and 20-point blowouts from 28.92% to 24.58%. Team scoring stayed near 110.2–110.4. Blocks fell from 5.86 to 4.02 per team. That count remains a calibration limitation against the engine's 4.8 baseline.
- Six archived outlier schedules, four independent 82-game replays per team per version, total 3,936 games. Expected net rating moved toward zero for five of six cases. Denver's expected net was essentially unchanged (-16.89 before and after). Birmingham's actual net moved the wrong way despite a better expected net. Small replay samples do not establish long-save extreme-record frequency.
- Two fresh spectator leagues, three seasons each, total 7,380 regular-season games and zero roster flags. Against step 1, standings spread moved from 16.02% to 15.27%, absolute margin from 14.01 to 13.82, 30-point blowouts from 8.21% to 7.78%. The 20-point rate barely changed, 25.56% to 25.51%. The best record was 65 wins and the worst 9. The weak-team tail remains unresolved. FG% stayed 47.09% and FTA/FGA 26.62%.
- Typecheck, production build, finishing integration and the new shot-context regression passed.

### Decision

Keep the revised shot-context behavior. It improves the relationship between an opening and rim protection, with encouraging but incomplete parity results. Do not mark extreme records solved. Rebounding and roster construction follow as separate steps.

## 3. Rebounding sensitivity

Accepted a modest calibration from ORB_K 0.0022 to 0.0019. Rebound control still responds continuously to glass skill, box-outs, fatigue, tactics and clutch context. The baseline 26% chance and player rebound-credit weights are unchanged.

The 100-season baseline averaged team ORB-rate spread 3.07 percentage points and DRB-rate spread 1.78. Calculating population standard deviations from RealGM's 30-team tables gives ORB/DRB spreads of 2.27/1.40 in 2023–24, 2.48/1.48 in 2024–25, and 3.09/1.65 in 2025–26. Large offensive-rebounding advantages can be real. This supports a small sensitivity change, not removing that team strength. [2023–24](https://basketball.realgm.com/nba/team-stats/2024/Advanced_Stats/Team_Totals/Regular_Season/ortg/desc), [2024–25](https://basketball.realgm.com/nba/team-stats/2025/Advanced_Stats/Team_Totals/Regular_Season/ortg/desc), [2025–26](https://basketball.realgm.com/nba/team-stats/2026/Advanced_Stats/Team_Totals/Regular_Season/ortg/desc).

### Validation

- `scripts/reboundResponse.mts`, 200,000 live rebound decisions. Matched glass skill returned 25.98% offensive control. Better offensive box-outs raised it to 27.39%, better defensive box-outs lowered it to 24.53%, and rebounding skill still moved control in both directions.
- Six archived outlier schedules, four replays per version, total 3,936 games, with all bookkeeping/probability checks passing. Cincinnati's rebound-rate gap fell from 10.23 to 9.88 points, Vancouver's deficit from 10.80 to 10.01 points. The high/low-record problem persists in these rosters.
- 1,200 paired neutral-schedule games per version showed essentially unchanged means, margins and blowout rate. Team offensive rebounds were 11.552 before and 11.552 after. This is evidence against a large immediate parity effect.
- Six fresh spectator seasons, 7,380 games and zero roster flags. Relative to step 2, absolute margin was 13.82 before and 13.34 after, 20-point blowouts 25.51% and 23.50%, 30-point blowouts 7.78% and 7.01%, best/worst records 65/9 and 68/10. Offseason random paths diverge after an engine change, so these differences cannot be attributed solely to the rebound coefficient.
- Fresh-season ORB spread was 2.42 before and 2.72 after, and DRB spread 1.58 before and 1.48 after. Both resulting spreads are within the three NBA season ranges above. The increase in ORB spread illustrates why league averages and selected teams alone are inadequate validation.
- Typecheck, production build and the rebound-response regression passed.

### Decision

Keep the modest sensitivity adjustment. Its direct matchup effect is small. Roster formation still needs correction and a new long-save audit remains necessary.

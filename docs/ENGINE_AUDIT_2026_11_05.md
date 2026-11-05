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

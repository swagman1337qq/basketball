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

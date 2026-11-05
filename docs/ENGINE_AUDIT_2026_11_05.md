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

## 4. Complete and validate AI roster upgrades

Accepted a roster-decision correctness fix. The old upgrade branch checked whether a free agent was more valuable, waived the incumbent, and stopped. It did not verify that the free agent was affordable or sign him. A deterministic reproduction with a $100,000M asking price still released Xavier Jones and added $5.39M of dead money, leaving the team with 14 standard players.

The AI now previews the vacancy and existing guaranteed-salary debt, finds acceptable legal terms for a valuable replacement, and completes both actions in one decision. If no replacement clears the existing signing, acceptance, buyout and owner-budget checks, nobody is waived. The preview assumes no waiver claim, so it cannot count on another team clearing the outgoing salary. Existing salary, guarantee, cap and CBA rules are reused without modification.

### Validation

- `scripts/aiRosterUpgrade.mts` reproduces the old Release-only behavior in four scenarios. With the correction, an affordable upgrade leaves 15 standard players and signs the replacement immediately. An unaffordable ask, a hard-cap block, and the existing apron buyout restriction each return no move and preserve roster, free agents and cap data. Guaranteed dead money and unique roster membership are checked.
- Six fresh spectator seasons including offseasons, 7,380 regular-season games, zero roster-integrity flags. Best/worst records were 72/12. Relative to step 3, average absolute margin increased from 13.34 to 13.94, 20-point blowouts from 23.50% to 26.25%, and standings spread from 13.93% to 15.18%. The roster fix does not establish better parity.
- Typecheck, production build, calendar/save compatibility, player-value migration and rotation guards, finishing kernel/preferences, the shot-context regression and possession-event tests passed.

### Decision

Keep the correction because teams should not waive players for a replacement they cannot sign, and successful upgrades should complete. Broader roster quality and extreme records remain under investigation. The separately frozen 100-season combined audit is complete. Its results and remaining failures are recorded below.

## 5. Combined 100-season audit

**The functional repairs passed. The overall balance target did not pass.**

Completed ten spectator leagues for ten consecutive seasons each, using seeds 11, 12, 13, 17, 21, 41, 77, 82, 134 and 211 and normal offseasons. The run contains 123,000 regular-season games. Each team played 82 games per season. All ten workers finished successfully. The 92 frozen engine/data/helper files still matched the working source at completion. Tested production revision: 7b2842611e55c01e43dde8c2bbdb6bbbf722874c.

The original comparison is the November 4 production engine at 1a65ddeb988179431495573084d07062356ef0c0. Both audits use the same league seeds and external random-stream scheme. Engine and AI changes cause subsequent rosters and random paths to diverge, so the long runs are aggregate comparisons rather than identical game pairs.

| Measure | Original 100 seasons | Combined 100 seasons |
|---|---:|---:|
| Best record seen | 73 wins | 76 wins |
| Worst record seen | 4 wins | 8 wins |
| Median season leader | 66 wins | 66 wins |
| Median last-place team | 16 wins | 17 wins |
| Seasons with a 70-win team | 18 | 25 |
| Seasons with a team at 10 wins or fewer | 7 | 3 |
| Average absolute game margin | 14.11 | 13.92 |
| Games decided by 20 or more | 26.00% | 25.53% |
| Games decided by 30 or more | 8.69% | 8.10% |
| Team point-differential spread | 6.37 | 6.08 |
| Standings win-percentage spread | 16.10% | 15.46% |
| Roster-integrity flags | 0 | 0 |

Threshold counts are league-seasons. Multiple teams can share a season. The run also passed independent post-run checks of season scoring identities, team/opponent totals, finite statistics, makes versus attempts, total wins and losses, and unique season journals. It recorded 472 completed regular-season AI waiver/sign upgrades.

The first year produced one 70-win team in ten leagues. Years 2–10 produced 24 such seasons out of 90, so dominant teams remain a long-save issue. The low-record tail improved in this sample, while dominant records became more frequent. Ten leagues with related seasons are not 100 independent experiments, and these counts do not establish a precise real-world frequency.

### New outlier replays

Each case was rerun six times against its exact 82 opponents, dates and venues. The as-played condition preserved original game-day availability, targets and condition. The opening condition used both sides' opening-night teams. Total 2,952 additional simulated games.

| Team and observed record | As-played wins, average and range | Opening wins, average | Threshold repeats with as-played teams |
|---|---:|---:|---:|
| Vancouver Drought, 8–74 | 15.00 (10–22) | 13.67 | 2 of 6 at 10 or fewer |
| Dallas Axolotls, 72–10 | 66.67 (63–70) | 64.00 | 1 of 6 at 70 or more |
| Los Angeles Strollers, 76–6 | 71.00 (68–74) | 68.83 | 5 of 6 at 70 or more |

Luck contributed to the observed extremes. Persistent strength differences remain. Replay expected net ratings were -13.21 for Vancouver, +15.10 for Dallas and +16.04 for Los Angeles. The Strollers' opening rotation contained 67-, 65- and 63-overall players plus strong complementary creators and defenders. The current evidence identifies a durable advantage; it does not uniquely establish which roster-acquisition or possession interaction causes its size.

### Remaining problems

- Dominant-team frequency and blowouts remain too high. The earlier NBA comparison is about 12.4 average absolute margin, 19.5% 20-point games and 6.1% 30-point games from a five-season analysis of game logs. Nine full NBA seasons averaged 14.9% standings spread and 4.97 team point-differential spread. These NBA samples are smaller and come from a different league. [Game-margin comparison](https://vertizesports.com/blog/nba-blowouts-margin-of-victory).
- Blocks averaged 3.90 per team against the engine's 4.8 baseline. Clear finishes receive fewer implausible blocks, but block-count calibration needs follow-up.
- Team ORB/DRB spreads averaged 2.95/1.72 percentage points, compared with 3.07/1.78 before. The small rebound change has not eliminated the spread mismatch.
- Overall weights were measured before the November 5 possession changes. A fresh skill-sensitivity check is still needed once the possession model is settled.
- Shot coverage remains a probability model, without player coordinates or a fitted NBA tracking model. Steals still do not start transition possessions in this engine. No player-card ratings or contract/CBA rules were changed.

### Decision

Retain the demonstrated event and roster corrections and the audited close-shot behavior. Treat rebounding as a modest calibration adjustment. Do not describe the engine's rare-record problem as solved. The next investigation should trace how dominant cores form and isolate how creation, rim protection, turnover pressure and rebounding combine in the same lineup. That needs controlled tests rather than assuming another global coefficient change will solve it.

### Reproduction and artifacts

Use the recorded source revision and a fresh output directory. Run each seed with:

    npx tsx scripts/standingsAudit.mts SEED .review/new-audit 10

The runner records season journals, shot-context totals, completed upgrades and compressed outlier replay inputs. It rejects an existing journal rather than mixing runs. Its invalid-seed and existing-journal guards were checked. Raw artifacts, source hashes, summaries, reconciliation results and the three new replay reports remain in .review/sequential-audit/final. Per-step comparisons remain in .review/sequential-audit.

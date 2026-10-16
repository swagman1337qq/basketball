# How EPM, LEBRON and DARKO are estimated

This document records everything that goes into the game's EPM, LEBRON and DARKO numbers: what data they use, every calculation step with its constants, how the scaling was chosen, and what was checked.

The code is in `src/engine/advanced.ts` (`computeAdvanced`). The stats were added on 2026-10-16.

---

## 1. Why these are estimates

The real metrics depend on things the game doesn't keep:

| Real metric | What it uses that the game doesn't have |
|---|---|
| **EPM** (Estimated Plus-Minus, Dunks & Threes) | Player-tracking data (touches, drives, contested shots, distances) feeding a "statistical plus-minus" prior, then blended with possession-level RAPM (on/off adjusted for every teammate and opponent on the floor). |
| **LEBRON** (BBall Index) | A box-score prior with player "roles" from tracking data, plus luck-adjusted RAPM: every possession's three-point and free-throw outcomes are replaced by their expected values before the regression. |
| **DARKO** (Kostya Medvedovsky) | A day-by-day Kalman filter over every game's box score, with decay rates fitted per stat, a regression to priors, and an aging curve. |

The game keeps:
- each player's **season box-score totals**: minutes, points, shots, rebounds, assists, steals, blocks, turnovers, fouls and his plus-minus;
- each **team's season totals**, plus its opponents' totals;
- each player's **past seasons'** box-score totals;
- his **age**.

It doesn't keep lineup-by-lineup possession data or tracking data. So each estimate follows its metric's published idea using only that data:
- **EPM:** a box-score prior plus on/off, as the player's sample grows.
- **LEBRON:** the same, with shooting luck removed.
- **DARKO:** a time-weighted, regressed and aging-adjusted rating of his current level.

---

## 2. Data gathered

**For each season** (`seasonAdvanced`):

1. **Every player who played that season.** His regular-season rows are summed across teams if he was traded, and he's credited to the team he played the most minutes for. Anyone with zero games or minutes is skipped.
2. **Every team's season totals.** That's its own points, field goals, threes, free throws, rebounds, assists, steals, blocks, turnovers and fouls, and the same for its opponents. A past season with no team totals stored uses a league-average team.
3. **League totals:** the sum of all teams.
4. **For DARKO only:** each player's own rows from the **three previous seasons**, regular season only.

---

## 3. Shared building blocks

These are computed for every player first and are also used by the existing advanced stats.

| Quantity | How it's calculated |
|---|---|
| Team possessions | Basketball-Reference estimate, averaged over the team and its opponents: FGA + 0.4·FTA − 1.07 × ORB% × (FGA − FGM) + TOV |
| League pace | league possessions / league games |
| His share of team minutes | his minutes / (team minutes / 5) |
| Possessions on the floor (`possOn`) | team possessions × his share |
| per100(v) | v × 100 / possOn |
| **Raw OBPM** | 0.8 × per100(0.86·PTS − 0.56·FGA − 0.246·FTA + 0.389·3PM + 0.807·AST − 0.964·TOV + 0.397·ORB) |
| **Raw DBPM** | per100(0.25·DRB + 1.6·STL + 1.2·BLK − 0.3·PF) |
| **Team adjustment** | Each team's minute-weighted OBPM and DBPM are shifted so they match its ratings: offense to (team ORtg − league ORtg)/5, defense to (league ORtg − team DRtg)/5. Every player on the team gets the same shift. |
| **Small-sample shrink** | rel = min(1, minutes/500). OBPM = OBPM × rel − 1.5 × (1 − rel), and DBPM the same toward −0.5. |
| **Plus-minus per 100** | his season +/− × 100 / possOn |
| **On/off per 100** | his +/− per 100 − the team's net points per 100 with him off the floor. Team net with him off = (team point differential − his +/−) / (team possessions − possOn). |
| League raw-box means (`boxO`, `boxD`) | minute-weighted league averages of raw OBPM and raw DBPM (used to put past seasons on this league's scale for DARKO) |

---

## 4. EPM (estimate)

**Idea:** the box score is a strong prior. On/off counts for more the more possessions he's played, because on/off is very noisy in small samples.

**Steps:**
1. Split his on/off evenly into offense and defense (the game doesn't keep on/off separately for each end): onOffO = onOffD = ½ × on/off.
2. Weight: w = possOn / (possOn + **6000**). For example, 1,500 possessions gives 0.2, 3,000 gives 0.33, 6,000 gives 0.5.
3. O-EPM (raw) = OBPM × (1 − w) + onOffO × w
4. D-EPM (raw) = DBPM × (1 − w) + onOffD × w
5. Centre and scale (section 7) with factor **0.6**.
6. EPM = O-EPM + D-EPM

---

## 5. LEBRON (estimate)

**Idea:** like EPM, but the on/off part has luck removed first. That's the "Luck-adjusted" in LEBRON. The real metric removes luck from every shot by both teams. The game only keeps his own season shooting, so this removes his own three-point luck.

**Steps:**
1. League 3P% = league 3PM / league 3PA (0.36 if there are none).
2. Expected 3P% = (his 3PM + **750** × league 3P%) / (his 3PA + 750). His percentage is regressed toward the league's, with 750 attempts of league-average shooting added. A shooter with 750 attempts lands halfway between his own and the league's.
3. Luck points = 3 × (his 3PM − his 3PA × expected 3P%): the points from threes made above (or below) what's expected.
4. Luck-adjusted on/off = on/off − luck points × 100 / possOn.
5. Weight: w = possOn / (possOn + **5000**). This is the "Regularized" part: ridge-style shrinkage toward the box prior.
6. O-LEBRON (raw) = OBPM × (1 − w) + ½ × luck-adjusted on/off × w
7. D-LEBRON (raw) = DBPM × (1 − w) + ½ × luck-adjusted on/off × w
8. Centre and scale with factor **0.55**.
9. LEBRON = O-LEBRON + D-LEBRON

---

## 6. DARKO (estimate)

**Idea:** the player's current level, not one season's line. Recent seasons count most, older ones fade like a Kalman filter's memory, the estimate is regressed toward average when there's little data, and it's adjusted for where he is on the aging curve.

**Steps:**
1. **This season:** OBPM and DBPM (team-adjusted and shrunk, section 3), weighted by possOn.
2. **His last three seasons**, regular season only, each season's rows summed:
   - Estimated possessions on the floor = minutes × league pace / 48. Seasons under 50 possessions are skipped.
   - Raw OBPM and DBPM for that season (the section 3 formulas with those possessions), minus this league's raw means (`boxO`, `boxD`).
   - Weight = possessions × **0.55** ^ (seasons back): last season ×0.55, two back ×0.30, three back ×0.17.
3. **Combine with a prior** worth **1,500** possessions:
   - Offense: (Σ weight × O + 1500 × **−0.9**) / (Σ weight + 1500)
   - Defense: (Σ weight × D + 1500 × **−0.6**) / (Σ weight + 1500)
   - The prior totals −1.5, a little below average, because a player with almost no minutes is usually a fringe player.
4. **Age adjustment** (the age in that season): +0.4 per year under 26, −0.4 per year over 30, 0 from 26 to 30. 60% of it goes to offense and 40% to defense.
5. Centre and scale with factor **0.65**.
6. DARKO = O-DARKO + D-DARKO

---

## 7. Centering and scaling (all three)

After every player's raw values are computed:

1. **Centre.** Subtract the league's minute-weighted average of the offense part, and separately of the defense part. A league-average player is 0 on each.
2. **Scale.** Multiply each part by the metric's factor (EPM 0.6, LEBRON 0.55, DARKO 0.65), then add the two parts for the total.

**Why the scaling is needed:** the game's BPM runs wider than the real one (a spread of about 4.8 for players with 500+ minutes, against about 3.5 in the NBA, and a top of about +16). Real EPM, LEBRON and DARKO have spreads of about 2.5–3, and the league's best are about +7 to +9. Without scaling, the first version topped out at +18.

---

## 8. How the constants were chosen, and what was checked

**Test data:** the "my-league_5" save (season 2032, 7 seasons in), seasons 2031 and 2032, players with 500+ minutes (322–332 players).

**First version** (on/off priors of 4,000 for EPM and 2,500 for LEBRON, no scaling):

| | Spread | Best player |
|---|---|---|
| BPM (existing) | 4.8 | +16 |
| EPM | 5.0–5.1 | +18.5 |
| LEBRON | 5.2–5.4 | +18.9 |
| DARKO | 3.8–3.9 | +15.1 |

That was too wide: on/off was too influential, and the BPM base runs wide.

**Changes:**
- The on/off priors were raised to 6,000 (EPM) and 5,000 (LEBRON). This matches the real metrics, where on/off is a minority of the signal for most players.
- Centering and scaling were added (factors 0.6, 0.55 and 0.65), chosen so each metric's spread lands at about 2.5–3 with the league's best around +8 to +10.

**Final results:**

| Season | Metric | Minute-weighted mean | Spread | Correlation with BPM |
|---|---|---|---|---|
| 2031 | EPM | 0.15 | 2.88 | 0.88 |
| 2031 | LEBRON | 0.14 | 2.62 | 0.85 |
| 2031 | DARKO | 0.06 | 2.54 | 0.97 |
| 2032 | EPM | 0.19 | 2.94 | 0.88 |
| 2032 | LEBRON | 0.17 | 2.70 | 0.85 |
| 2032 | DARKO | 0.08 | 2.48 | 0.96 |

The means are slightly above 0 because the check only counts players with 500+ minutes, who are better than average. Across everyone, centering puts them at 0.

**2032 top players, as a sanity check:**

| Player | Ovr | BPM | On/off | EPM | LEBRON | DARKO |
|---|---|---|---|---|---|---|
| Kevin Weiner | 74 | 13.3 | +22.8 | 10.3 | 9.4 | 6.2 |
| Felix Scholz | 75 | 16.2 | +17.9 | 10.0 | 9.0 | 9.3 |
| Rasheen Morgan | 71 | 16.2 | +15.2 | 9.3 | 8.4 | 7.4 |
| Kyle Mortimer | 69 | 7.5 | +24.7 | 8.7 | 8.4 | 3.6 |
| Jaylin Bostick | 79 | 13.7 | +13.9 | 8.0 | 7.4 | 7.1 |

They behave the way the real metrics do relative to each other:
- **Mortimer's** huge on/off lifts his EPM and LEBRON well above his box score.
- **DARKO** stays close to his longer track record (3.6), because one season's on/off doesn't enter DARKO.
- **DARKO** tracks BPM history most closely (correlation 0.96).

---

## 8b. Small implementation details

- **DARKO's past seasons use this season's league pace and raw-box means** (`lgPace`, `boxO`, `boxD`) to turn minutes into possessions and to centre them, not the pace and means of the season they came from. Past seasons are also raw box: no team adjustment and no small-sample shrink. Only this season's part is team-adjusted.
- **DARKO's history is always regular-season rows**, even when computing playoff values, and seasons are summed across teams if he was traded.
- **A player with no three-point attempts** has an expected 3P% equal to the league's and zero luck points. A player with 0 possessions on the floor gets 0 for his luck-adjusted on/off.
- **"League" in LEBRON's 3P%** means every team's threes that season (or that postseason, for playoff values).

## 9. Where they show up

- **Player profile → Stats → Advanced:** EPM, LEBRON and DARKO columns, with tooltips.
- **Stats page → Advanced mode:** the same three columns.
- **League Leaders:** EPM, LEBRON and DARKO boards.
- **Award formulas:** the variables `epm oepm depm lebron olebron dlebron darko odarko ddarko`.

They're computed for every season (and the CCP), the same way as the other advanced stats. Playoff values use the playoff box scores with each team's regular-season context scaled to its playoff games.

---

## 10. Known limits

- **On/off is split evenly between offense and defense**, because the game doesn't keep offense and defense on/off separately.
- **On/off isn't adjusted for teammates and opponents** (no RAPM). A bench player who always plays with the starters can look better than he is. The heavy priors limit this.
- **LEBRON's luck adjustment only covers his own threes.** Opponent shooting luck while he's on the floor, and free-throw luck, aren't stored.
- **DARKO works season by season, not game by game,** and goes back three seasons.
- **The scaling factors were fit on one league** (seven seasons in). In a very different league (a brand-new one, or one with a very different talent spread), the spreads can come out a little wider or narrower.

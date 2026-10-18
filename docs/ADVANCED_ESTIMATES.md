# How EPM, LEBRON and DARKO are estimated

This document records everything that goes into the game's EPM, LEBRON and DARKO numbers: what data they use, every calculation step with its constants, how the scaling was chosen, and what was checked.

The code is in `src/engine/advanced.ts` (`computeAdvanced`, `finishImpact`, `rapm`, `agingCurve`). The stats were added on 2026-10-16 and reworked on 2026-10-17 (tracked on-floor data, RAPM, DARKO aging, per-league scaling).

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

**Tracked by the game engine** (since 2026-10-17, `sim.ts`, stored in every box score and season row):
- for each player, while he's on the floor: his team's points (`onF`) and the opponent's (`onA`), offensive and defensive possessions (`onPO`, `onPD`), and **expected points** for and against (`xF`, `xA`): every shot's make chance × its value plus every free throw's chance, for both teams;
- his own expected points (`xP`), from his shots and free throws;
- **lineup stints**: for every five-man unit in every game, its possessions, points and expected points on offense and allowed on defense. `Game.addStints` adds them into per-team regression totals (`db.rapm`, this season and last only, so saves stay small).

Seasons played before this have none of it; for them the estimates fall back to the older method (sections 4–5, "without tracking").

**For each season** (`seasonAdvanced`):
1. **Every player who played that season.** His regular-season rows are summed across teams if he was traded, and he's credited to the team he played the most minutes for. Anyone with zero games or minutes is skipped.
2. **Every team's season totals**, its opponents' too, and its on-floor totals (its players' sums / 5). A past season with no team totals stored uses a league-average team.
3. **League totals:** the sum of all teams.
4. **For DARKO:** each player's **three previous seasons**, each computed in full in its own season's context (kept once computed: past seasons don't change).

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

**Idea:** the real EPM is a regression on every possession (who was on the floor, what happened) with a box-score prior. This one is the same, within each team.

**With tracking (regular seasons since 2026-10-17): ridge RAPM** (`rapm`).
1. For each team, two small regressions: **offense** (possessions each pair of players shared, points scored with each on the floor) and **defense** (points allowed).
2. Solve (X′X + λI)β = X′y + λ·prior for each, where y is points above the league's per-possession average, the prior is his box score (OBPM / −DBPM per possession), and **λ = 10,000** possessions (`RAPM.lambda`, chosen by the prediction test in section 8).
3. O-EPM = β_offense × 100, D-EPM = −β_defense × 100 (fewer points allowed is better). A traded player's values from each team are averaged by possessions.
4. **Teammates are adjusted for** (that's what the regression does); **opponents count as average** (a full league-wide regression would need either a 900 × 900 matrix or every stint stored in the save).

**Without tracking (older seasons and the playoffs):** the box score blended with on/off.
- On/off per 100: offense and defense apart where tracked (points for and against with him on vs off), else the plus-minus on/off split evenly.
- Weight w = n / (n + 6000), with **n = 1 / (1/possessions on + 1/possessions off)**: a 36-minute starter has few possessions off the floor, so his on/off is noisy and gets about 0.2, not 0.5.

---

## 5. LEBRON (estimate)

**Idea:** like EPM, with luck taken out (the "Luck-adjusted" in LEBRON).

**With tracking:** the same RAPM with **expected points as y**: every shot's and free throw's luck is removed for both teams and every shot type, which is more than the real LEBRON can do. The box prior is luck-adjusted too: O-prior = OBPM − his own shooting luck, where his luck = 0.8 × 0.86 × (points − his expected points) per 100. Luck goes on **offense only**.

**Without tracking:** his threes regressed toward the league's (750 attempts) give his luck in makes; the box prior loses 2.375 per extra make per 100 (offense only), and the on/off part uses expected points where tracked. Weight n / (n + 5000), n as for EPM.

---

## 6. DARKO (estimate)

**Idea:** his current level, not one season's line.

1. **This season:** his **unshrunk**, team-adjusted box score (OBPM, DBPM before the small-sample shrink, which the prior below already does), weighted by his possessions.
2. **His last three seasons,** each from that season's own full computation: its own pace, league means and team adjustment. Weight = possessions × **0.55** ^ (seasons back).
3. **Each past season is aged forward to now** along the league's own aging curve: the expected yearly change in BPM at each age is fitted from this league's players with 1,000+ possessions in two straight completed seasons (Δ = a + b·(age − 27), `agingCurve`), and the changes from his age then to his age now are added (60% offense, 40% defense). With fewer than 40 such pairs (a young league) it uses an NBA-like default, Δ = −0.17 × (age − 26.5) a year, within ±1.5. **This season is not adjusted for age** (the old version added +0.4 a year under 26 to everything, which inflated young players).
4. **Prior** worth **1,500** possessions: offense −0.9, defense −0.6.

---

## 7. Centering and scaling (all three)

1. **Centre.** Subtract the league's minute-weighted average of the offense part, and separately of the defense part.
2. **Scale to the real metrics' spread, refit every season** (`IMPACT_SD` 2.7): the scale factor makes the spread (sd) of offense + defense equal 2.7 among the season's regulars (players with at least a quarter of the most minutes anyone played, 100+). With fewer than 30 regulars (the first days of a season) the old fixed factors apply (0.6 / 0.55 / 0.65).

---

## 8. How the constants were chosen, and what was checked

**Prediction test** (2026-10-17, 3 leagues, seasons 1 → 2): each team's season-2 net rating predicted from its players' season-1 metric, weighted by their season-2 minutes (newcomers as −2). Correlations:

| Metric | λ = 500 | 1,000 | 2,500 | 5,000 | 10,000 | 30,000 |
|---|---|---|---|---|---|---|
| EPM (RAPM) | 0.690 | 0.718 | 0.750 | 0.765 | **0.772** | 0.773 |
| LEBRON (RAPM, expected points) | 0.736 | 0.746 | 0.756 | 0.761 | **0.764** | 0.766 |

BPM alone: 0.778; DARKO: 0.773. In this engine the box score is already about as predictive as anything, and one season of lineup data adds more noise than signal, so a strong prior works best: λ = 10,000 keeps EPM at the box score's level while still adjusting for teammates.

**Spread:** in 2-season tests (2 leagues), the regulars' sd is 2.73–2.77 for all three every season; the league's best reach about +9 to +11.6 (a little above the real metrics' +7 to +10, because the game's star box scores run hot).

**Tracking checks:** on-floor points sum to exactly 5 × team points, on-floor possessions match the team's possession estimate within about 1%, and expected points land within 1–3% of actual points.

**First version (2026-10-16)**, for the record: on/off priors of 6,000 (EPM) and 5,000 (LEBRON) on 50/50-split on/off, fixed scale factors 0.6 / 0.55 / 0.65 fit on one save, DARKO with a +0.4-a-year age bonus under 26.

---

## 8b. Small implementation details

- **Past seasons are computed once and kept** per league in memory (`pastSeason`), and each is computed with its own DARKO history, so a 20-season league computes each season once.
- **DARKO's history is always regular-season rows**, even when computing playoff values.
- **A player with no three-point attempts** and no tracked expected points has zero luck.
- **The RAPM prior** for a player the regression sees but who has no row (rare) is −1.5 on offense and −0.5 on defense.
- **`db.rapm`** keeps only this season's and last season's totals.

## 9. Where they show up

- **Player profile → Stats → Advanced:** EPM, LEBRON and DARKO columns, with tooltips.
- **Stats page → Advanced mode:** the same three columns.
- **League Leaders:** EPM, LEBRON and DARKO boards.
- **Award formulas:** the variables `epm oepm depm lebron olebron dlebron darko odarko ddarko`.

They're computed for every season (and the CCP), the same way as the other advanced stats. Playoff values use the playoff box scores with each team's regular-season context scaled to its playoff games.

---

## 10. Known limits

- **RAPM is per team:** teammates are adjusted for, opponents count as average (over 82 games they mostly even out).
- **One season of lineup data is noisy,** so the box prior is strong (λ = 10,000); the regression mostly corrects players whose teammates make their box score misleading.
- **Seasons before 2026-10-17 have no tracking,** so their values use the older on/off method (with the better weighting).
- **Ground-truth test** (2026-10-18): 120 rotation players (1,500+ minutes, 2 leagues, one season each), each replaced by a league-average player at his position for 600 games with the same random seeds; his true value = the drop in his team's net rating per 48 minutes he played (spread 2.5–2.7, close to the metrics' 2.7). Correlation with that true value: EPM 0.80, LEBRON 0.81, DARKO 0.80, BPM 0.80, and the overall rating 0.83. All four metrics are about equally good; they run a little hot for high-usage stars (the top true value was +9.2, the top EPM +11.5). The truly most valuable players were all bigs.

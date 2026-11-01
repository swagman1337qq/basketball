# How EPM, LEBRON, DARKO, PER and EWA are calculated

This document records everything that goes into the game's EPM, LEBRON and DARKO numbers: what data they use, every calculation step with its constants, how the scaling was chosen, and what was checked.

The code is in `src/engine/advanced.ts` (`computeAdvanced`, `finishImpact`, `rapm`, `agingCurve`). The stats were added on 2026-10-16 and reworked on 2026-10-17 (tracked on-floor data, RAPM, DARKO aging, per-league scaling).

---

## 1. How close they are to the real metrics

PER and EWA are public formulas, and the game uses them exactly (section 6b). EPM, LEBRON and DARKO are each a company's or analyst's own model, with weights nobody outside has; the game runs each one's published method on its own data:

| Real metric | Its method | In the game |
|---|---|---|
| **EPM** (Estimated Plus-Minus, Dunks & Threes) | A box-score prior ("statistical plus-minus", with tracking data) blended with RAPM: a ridge regression on every possession of who was on the floor. | Ridge RAPM on every lineup stint, with the box score (BPM) as the prior. Teammates are adjusted for; opponents count as average (the regression is per team). |
| **LEBRON** (BBall Index) | The same, luck-adjusted: three-point and free-throw results replaced by their expected values first; a role-based prior. | The same RAPM on **expected points**: every shot's and free throw's luck removed for both teams (more than the real one can). |
| **DARKO** (Kostya Medvedovsky) | Updated after every game: each stat is a running rate that forgets old games at its own fitted speed (a Kalman filter), then mapped to impact, with an aging curve. | The same since 2026-11-01 (section 6): game by game, a fitted decay per stat, a fitted box-to-impact map, his games' age. |

The game keeps everything these need: each player's box score per game and per season, his team's and opponents' totals, and since 2026-10-17 every lineup stint's possessions, points and expected points.

## 2. Data gathered

**Tracked by the game engine** (since 2026-10-17, `sim.ts`, stored in every box score and season row):
- for each player, while he's on the floor: his team's points (`onF`) and the opponent's (`onA`), offensive and defensive possessions (`onPO`, `onPD`), and **expected points** for and against (`xF`, `xA`): every shot's make chance × its value plus every free throw's chance, for both teams;
- his own expected points (`xP`), from his shots and free throws;
- **lineup stints**: for every five-man unit in every game, its possessions, points and expected points on offense and allowed on defense. `Game.addStints` adds them into per-team regression totals (`db.rapm`, this season and last only, so saves stay small).

Seasons played before this have none of it; for them the metrics fall back to the older method (sections 4–5, "without tracking").

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

## 4. EPM

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

## 5. LEBRON

**Idea:** like EPM, with luck taken out (the "Luck-adjusted" in LEBRON).

**With tracking:** the same RAPM with **expected points as y**: every shot's and free throw's luck is removed for both teams and every shot type, which is more than the real LEBRON can do. The box prior is luck-adjusted too: O-prior = OBPM − his own shooting luck, where his luck = 0.8 × 0.86 × (points − his expected points) per 100. Luck goes on **offense only**.

**Without tracking:** his threes regressed toward the league's (750 attempts) give his luck in makes; the box prior loses 2.375 per extra make per 100 (offense only), and the on/off part uses expected points where tracked. Weight n / (n + 5000), n as for EPM.

---

## 6. DARKO

**Game by game (since 2026-11-01, `advanced.ts` `darkoUpdate`, called by `Game.addBox` after every regular-season game).** For each player the game keeps (p.dk) a running sum per stat (points, expected points, FGA, FTA, threes, assists, turnovers, offensive and defensive rebounds, steals, blocks, fouls) and of the possessions it came on (offensive trips for offense, defensive for defense). Each game:
1. every sum keeps a share **d** of what it had (its own per stat: about .985–.99 for scoring and shooting, .993–.998 for rebounds, steals, blocks and fouls), then adds tonight's game;
2. at the first game of a new season, each sum keeps a share **m** of itself (the summer: .2–.3 for scoring and assists, .5–.7 for the rest);
3. his current rate per stat = (sum + K × a bench player's rate) / (possessions + K), with K per stat (30–300 possessions);
4. those rates go through a box-to-impact map fitted to the engine's own lineup regression (offense and defense, each on every stat), and his team's adjustment (its minute-weighted value matched to its ratings, as for BPM) is added;
5. the average age of the games in his sums is kept too; the league's aging curve (as before) moves him from that age to now (60% offense, 40% defense).

d, m, K and the bench rates were fitted (`scripts/fitImpact.mts fit`, 3 leagues × 4 seasons, about 350,000 game lines) by how well each stat's rate predicts his **next 20 games**, as DARKO's are. Each season's latest value is kept in `p.dkS[season]` (offense, defense, years from his games' age to now), so past seasons show where he finished. A player's first game starts from his last season and this one so far, as the decay would have left them.

**Seasons without game-by-game state** (before 2026-11-01): the earlier season-level method. This season's unshrunk, team-adjusted box score and his last three seasons (each in its own context, weighted × 0.55 per season back, aged forward along the league's aging curve, fitted from this league's players with 1,000+ possessions in two straight seasons, Δ = a + b·(age − 27), or −0.17 × (age − 26.5) a year with fewer than 40 pairs), with a prior worth 1,500 possessions (offense −0.9, defense −0.6).

**Checked:** predicting next season's team results (section 8), game-by-game DARKO ties the season method (r .802 vs .804, 180 team-seasons); among regulars it correlates .77 with EPM and .82 with the overall.

## 6b. PER and EWA (exact formulas, since 2026-11-01)

**PER** (John Hollinger, as Basketball-Reference computes it; `hollingerU`): uPER = (1/MP) × [3P + ⅔·AST + (2 − factor·tmAST/tmFG)·FG + FT·½·(1 + (1 − tmAST/tmFG) + ⅔·tmAST/tmFG) − VOP·TOV − VOP·DRB%·(FGA − FG) − VOP·0.44·(0.44 + 0.56·DRB%)·(FTA − FT) + VOP·(1 − DRB%)·(TRB − ORB) + VOP·DRB%·ORB + VOP·STL + VOP·DRB%·BLK − PF·(lgFT/lgPF − 0.44·lgFTA/lgPF·VOP)], with factor = ⅔ − (½·lgAST/lgFG)/(2·lgFG/lgFT), VOP = lgPTS/(lgFGA − lgORB + lgTOV + 0.44·lgFTA), DRB% = lgDRB/lgTRB. aPER = uPER × league pace / team pace; PER = aPER × 15 / the league's minute-weighted aPER. Everywhere a PER shows (`Game.perOf`, the advanced tables), with his team's assist rate and pace (his main team for season totals).

**EWA** (Hollinger): value added = minutes × (PER − his position's replacement PER) / 67, wins added = value added / 30. Replacement PER (ESPN): point guards 11.0, shooting guards and small forwards 10.5, power forwards 11.5, centers 10.6; G, GF, F and FC average their two.

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

**A fitted prior (2026-11-01, not used).** Like the real EPM and LEBRON, a box-score prior was fitted to the engine's own lineup regression (`scripts/fitImpact.mts`; offense r .53 → .64 and defense .48 → .51 against BPM's fixed weights, in-sample, with LEBRON's by position group). On new leagues it predicted next season no better (EPM .804 vs .811, LEBRON .820 vs .823 at λ 10,000; no λ from 3,000 to 30,000 helped), so EPM and LEBRON keep BPM as their prior (`IMPACT_FIT.usePrior` false). The fitted map is what turns DARKO's rates into impact.

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

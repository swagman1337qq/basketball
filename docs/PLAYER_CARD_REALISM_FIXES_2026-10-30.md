# Player-card realism fixes — 2026-10-30

All 25 presets were recalibrated against their actual historical seasons after fixing the underlying shot-style, turnover, contact, rebounding and college calculations. The old broad rim-heavy-big efficiency problem is substantially reduced. This report records final measured results and the remaining deviations; it does not certify a simulation as identical to a real person in every respect.

## What changed

- Card preferences survive monthly AI refreshes and evolve relative to the starting skills/age. Team role still changes volume. Freeze tendencies keeps exact values fixed; cards without an authored style retain the ordinary AI targets.
- Turnover credit includes short touches and catches, avoiding the old usage-to-the-1.7-power starvation of low-usage players. Contact/position, defensive IQ and block gambling affect foul credit.
- Turnover risk, foul frequency and offensive-glass pursuit are independent editable habits, shown on profiles. They change event likelihoods and allocation; skills, minutes, teammates and opposition still determine the results.
- Poor rim finishing has a steeper downside, re-centered by league norms. Drawing contact depends on strength/attack/handle and is separate from making the shot. A strong foul-drawing lineup generates additional shooting-foul trips, bounded relative to the league.
- College FTA/FGA algebra is corrected: FGA + .44 × FTA = used possessions − turnovers, with FTA = FTr × FGA. Authored college shot preferences now control the mix; usage and foul drawing affect volume. Elite defensive rebounding is no longer capped too low, and personal-foul totals respect five fouls per game.
- College habits and authored zones are copied into the amateur snapshot before camp, so later NBA edits do not change that history. Older snapshots without these fields use neutral habits and their original computed shot mix.
- Variant-aware save updates retain growth and custom styles. Undo restores the previous tendency anchor/freeze and card identity. Card-library Auto can still reset a build to generic rating-based targets.

## Validation

Each production preset played 600 NBA games: three worlds (2027, 44, 7), 100 games per world and style, both authored and AI styles, rotating 29 opponents and alternating home/away. All 25 received a final run (15,000 games); changed outliers were rechecked afterward. Historical minutes and matched position-group starter/bench roles were used. Counts are normalized to historical minutes; percentages aggregate makes and attempts. Injuries, career development and between-game fatigue are held out of this controlled test.

The before column is the measured previous live build from commit 9e3541f3. Fitting used separate offsets and validation seeds; the production check was not the training sample. Four college cards additionally use production applyCard and seasonLine over 300 fresh identities each (5001–5300), compared per 40 minutes. Their NBA runs are stress tests, not college comparisons.

393 additional regression checks cover preserved generic shot-style targets, anchored/evolving/frozen styles, import and undo, habit effects, free-throw identities, contact without finishing inflation, foul-trip generation, frozen amateur history, explicit college zones and foul limits. All-card migration checks, the earlier 43 regression checks, TypeScript and the production build passed. Existing bundle-size/dynamic-import warnings remain.

## Generated-league guardrail

The same three worlds played 270 ordinary generated-team games (540 team observations), independently of the real-player presets. This checks whether card fixes distort the rest of the game.

| Per team / game | Before | After |
|---|---:|---:|
| PTS | 114.45 | 114.34 |
| PACE | 98.94 | 98.98 |
| FGA | 88.09 | 88.15 |
| TPA | 37.51 | 37.69 |
| FTA | 22.58 | 22.45 |
| FG | 47.2% | 47.2% |
| TP | 35.7% | 35.7% |
| FT | 79.1% | 79.0% |
| TOV | 14.29 | 14.41 |
| PF | 19.20 | 19.08 |
| ORB | 12.16 | 12.15 |
| DRB | 31.29 | 31.46 |
| AST | 25.91 | 26.02 |

A separate sample of 176 ordinary NCAA prospects retained similar scoring: 10.88 → 10.81 PPG; FTA 1.76 → 2.42.

## Diagnostic checks across the NBA cards

These counts use explicit engineering tolerances, not a percentage of real-life accuracy. Each of the 21 NBA presets is counted in both styles. Low-volume 3P% (under one historical attempt/game) is omitted.

| Category | Tolerance | Before within tolerance | Final within tolerance |
|---|---:|---:|---:|
| PTS | 1.5 | 28 / 42 | 41 / 42 |
| FGA | 1.2 | 32 / 42 | 41 / 42 |
| TPA | 0.8 | 34 / 42 | 42 / 42 |
| FTA | 0.8 | 26 / 42 | 40 / 42 |
| ORB | 0.5 | 30 / 42 | 41 / 42 |
| DRB | 0.8 | 33 / 42 | 42 / 42 |
| AST | 0.7 | 39 / 42 | 42 / 42 |
| STL | 0.25 | 32 / 42 | 40 / 42 |
| BLK | 0.25 | 35 / 42 | 42 / 42 |
| TOV | 0.5 | 24 / 42 | 42 / 42 |
| PF | 0.5 | 18 / 42 | 40 / 42 |
| FG | 3.5 percentage points | 20 / 42 | 40 / 42 |
| TP | 4.0 percentage points | 19 / 28 | 27 / 28 |
| FT | 3.5 percentage points | 28 / 42 | 34 / 42 |

## Remaining deviations by card

NBA rows use the final AI style. College counts use per 40. Small samples can make percentages noisy; passing these thresholds does not validate unmeasured impact or career behavior.

| Card | Remaining diagnostic gaps |
|---|---:|
| Luka Dončić – Rookie year (2018–19) | PTS 22.73 vs 21.20; FTA 7.81 vs 6.70 |
| Dalton Knecht – Rookie year (2024–25) | Within the listed tolerances |
| Ben Simmons – Rookie year (2017–18) | Within the listed tolerances |
| Al Horford – Rookie year (2007–08) | Within the listed tolerances |
| Chris Paul – Rookie year (2005–06) | Within the listed tolerances |
| Klay Thompson – Rookie year (2011–12) | Within the listed tolerances |
| Kawhi Leonard – Rookie year (2011–12) | Within the listed tolerances |
| Dwight Howard – Rookie year (2004–05) | Within the listed tolerances |
| John Wall – Rookie year (2010–11) | Within the listed tolerances |
| Yi Jianlian – Rookie year (2007–08) | FG 37.0% vs 42.1% |
| Andrei Kirilenko – Rookie year (2001–02) | Within the listed tolerances |
| Jeremy Lin – Rookie year (2010–11) | STL 0.65 vs 1.10; FT 70.1% vs 76.0% |
| Toney Douglas – Rookie year (2009–10) | Within the listed tolerances |
| Jan Veselý – Rookie year (2011–12) | Within the listed tolerances |
| Bismack Biyombo – Rookie year (2011–12) | FT 52.2% vs 48.3% |
| Bronny James – Rookie year (2024–25) | Within the listed tolerances |
| Jarrett Culver – Rookie year (2019–20) | FTA 2.72 vs 1.90 |
| Jarred Vanderbilt – 2022–23 | TP 27.8% vs 32.2%; FT 73.4% vs 69.1% |
| Maxi Kleber – Prime (2019–20) | Within the listed tolerances |
| Joel Embiid – Draft night (2014, Kansas) | Within the listed tolerances |
| Joel Embiid – Rookie year (2016–17) | Within the listed tolerances |
| Joel Embiid – MVP season (2022–23) | Within the listed tolerances |
| Anthony Bennett – Draft night (2013, UNLV) | Within the listed tolerances |
| Tyler Hansbrough – Draft night (2009, North Carolina) | Within the listed tolerances |
| Blake Griffin – Draft night (2009, Oklahoma) | Within the listed tolerances |

## Detailed season comparisons

### Luka Dončić – Rookie year (2018–19)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3945274/stats), 72 games, 72 starts, 32.2 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 21.20 | 21.50 | 21.26 | 22.73 |
| FGA | 16.50 | 17.91 | 15.66 | 16.74 |
| 3PA | 7.10 | 8.22 | 7.06 | 7.34 |
| FTA | 6.70 | 4.66 | 7.15 | 7.81 |
| FGM | 7.00 | 7.73 | 6.88 | 7.39 |
| 3PM | 2.30 | 2.60 | 2.38 | 2.49 |
| FTM | 4.80 | 3.44 | 5.12 | 5.45 |
| ORB | 1.20 | 1.58 | 1.25 | 1.17 |
| DRB | 6.60 | 6.67 | 6.63 | 6.65 |
| REB | 7.80 | 8.25 | 7.88 | 7.83 |
| AST | 6.00 | 5.22 | 6.33 | 6.04 |
| STL | 1.10 | 1.12 | 1.09 | 1.17 |
| BLK | 0.30 | 0.26 | 0.31 | 0.33 |
| TOV | 3.40 | 4.24 | 3.16 | 3.15 |
| PF | 1.90 | 3.29 | 2.24 | 1.99 |
| FG% | 42.7% | 43.2% | 43.9% | 44.2% |
| 3P% | 32.7% | 31.6% | 33.7% | 33.9% |
| FT% | 71.3% | 73.8% | 71.6% | 69.7% |
| 2P% | 50.0% | 53.0% | 52.3% | 52.2% |
| TS% | 54.5% | 53.9% | 56.5% | 56.3% |
| eFG% | 49.4% | 50.4% | 51.5% | 51.6% |
| FTA/FGA | 0.41 | 0.26 | 0.46 | 0.47 |
| TOV% | 14.9% | 17.5% | 14.4% | 13.5% |
| AST/TOV | 1.76 | 1.23 | 2.00 | 1.92 |

Actual final minutes before normalization: authored 31.73, AI 31.80.

### Dalton Knecht – Rookie year (2024–25)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4897943/stats), 78 games, 16 starts, 19.2 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 9.10 | 11.25 | 9.62 | 8.85 |
| FGA | 7.10 | 8.19 | 7.51 | 7.23 |
| 3PA | 4.40 | 4.62 | 4.54 | 4.52 |
| FTA | 1.10 | 2.31 | 0.89 | 0.82 |
| FGM | 3.30 | 3.85 | 3.57 | 3.28 |
| 3PM | 1.60 | 1.81 | 1.78 | 1.65 |
| FTM | 0.80 | 1.75 | 0.69 | 0.65 |
| ORB | 0.50 | 0.77 | 0.43 | 0.64 |
| DRB | 2.30 | 2.34 | 2.47 | 2.11 |
| REB | 2.80 | 3.11 | 2.91 | 2.75 |
| AST | 0.80 | 0.68 | 0.78 | 0.79 |
| STL | 0.30 | 0.35 | 0.34 | 0.35 |
| BLK | 0.10 | 0.10 | 0.13 | 0.10 |
| TOV | 0.50 | 1.33 | 0.50 | 0.50 |
| PF | 1.20 | 2.09 | 1.24 | 1.21 |
| FG% | 46.1% | 47.0% | 47.6% | 45.4% |
| 3P% | 37.6% | 39.2% | 39.3% | 36.5% |
| FT% | 76.2% | 75.7% | 77.6% | 79.3% |
| 2P% | 63.0% | 57.1% | 60.2% | 60.1% |
| TS% | 60.0% | 61.1% | 60.9% | 58.4% |
| eFG% | 57.7% | 58.0% | 59.4% | 56.8% |
| FTA/FGA | 0.15 | 0.28 | 0.12 | 0.11 |
| TOV% | 6.2% | 12.6% | 5.9% | 6.2% |
| AST/TOV | 1.60 | 0.51 | 1.55 | 1.58 |

Actual final minutes before normalization: authored 17.55, AI 17.73.

### Ben Simmons – Rookie year (2017–18)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3907387/stats), 81 games, 81 starts, 33.7 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 15.80 | 15.28 | 14.98 | 15.65 |
| FGA | 12.30 | 11.84 | 11.27 | 11.69 |
| 3PA | 0.10 | 0.31 | 0.18 | 0.21 |
| FTA | 4.20 | 3.61 | 4.34 | 4.27 |
| FGM | 6.70 | 6.62 | 6.23 | 6.59 |
| 3PM | 0.00 | 0.04 | 0.02 | 0.04 |
| FTM | 2.40 | 1.99 | 2.49 | 2.43 |
| ORB | 1.80 | 1.61 | 1.94 | 2.19 |
| DRB | 6.30 | 7.06 | 6.49 | 6.59 |
| REB | 8.10 | 8.67 | 8.43 | 8.78 |
| AST | 8.20 | 8.24 | 8.04 | 7.89 |
| STL | 1.70 | 1.63 | 1.68 | 1.70 |
| BLK | 0.90 | 1.09 | 0.85 | 0.90 |
| TOV | 3.40 | 2.81 | 3.00 | 3.21 |
| PF | 2.60 | 2.35 | 2.46 | 2.79 |
| FG% | 54.5% | 55.9% | 55.3% | 56.4% |
| 3P% | 0.0% | 13.3% | 13.5% | 18.0% |
| FT% | 56.0% | 55.1% | 57.3% | 56.9% |
| 2P% | 54.9% | 57.1% | 56.0% | 57.1% |
| TS% | 55.8% | 56.9% | 56.8% | 57.7% |
| eFG% | 54.5% | 56.1% | 55.4% | 56.6% |
| FTA/FGA | 0.34 | 0.31 | 0.38 | 0.36 |
| TOV% | 19.4% | 17.3% | 18.6% | 19.1% |
| AST/TOV | 2.41 | 2.93 | 2.68 | 2.46 |

Actual final minutes before normalization: authored 32.53, AI 32.55.

### Al Horford – Rookie year (2007–08)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3213/stats), 81 games, 77 starts, 31.4 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 10.10 | 14.12 | 8.99 | 9.18 |
| FGA | 8.20 | 8.89 | 7.93 | 7.89 |
| 3PA | 0.10 | 0.06 | 0.06 | 0.04 |
| FTA | 2.60 | 4.42 | 1.95 | 1.96 |
| FGM | 4.10 | 5.38 | 3.76 | 3.88 |
| 3PM | 0.00 | 0.01 | 0.00 | 0.01 |
| FTM | 1.90 | 3.35 | 1.48 | 1.42 |
| ORB | 3.10 | 3.70 | 3.50 | 3.53 |
| DRB | 6.60 | 7.13 | 6.22 | 6.39 |
| REB | 9.70 | 10.84 | 9.72 | 9.92 |
| AST | 1.50 | 1.82 | 1.36 | 1.43 |
| STL | 0.70 | 0.81 | 0.70 | 0.70 |
| BLK | 0.90 | 1.13 | 0.92 | 0.89 |
| TOV | 1.70 | 1.30 | 1.65 | 1.59 |
| PF | 3.30 | 2.26 | 3.46 | 3.24 |
| FG% | 49.8% | 60.5% | 47.4% | 49.1% |
| 3P% | 0.0% | 15.8% | 5.6% | 25.0% |
| FT% | 73.1% | 75.8% | 75.9% | 72.3% |
| 2P% | 50.6% | 60.8% | 47.7% | 49.2% |
| TS% | 54.0% | 65.2% | 51.2% | 52.4% |
| eFG% | 50.0% | 60.6% | 47.4% | 49.2% |
| FTA/FGA | 0.32 | 0.50 | 0.25 | 0.25 |
| TOV% | 15.4% | 10.7% | 15.8% | 15.4% |
| AST/TOV | 0.88 | 1.40 | 0.82 | 0.89 |

Actual final minutes before normalization: authored 30.56, AI 30.48.

### Chris Paul – Rookie year (2005–06)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2779/stats), 78 games, 78 starts, 36 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 16.10 | 19.89 | 15.21 | 16.06 |
| FGA | 12.10 | 16.18 | 11.14 | 11.65 |
| 3PA | 2.30 | 2.50 | 2.29 | 2.61 |
| FTA | 6.00 | 4.64 | 6.66 | 6.69 |
| FGM | 5.20 | 7.46 | 4.50 | 4.83 |
| 3PM | 0.60 | 0.67 | 0.64 | 0.75 |
| FTM | 5.10 | 4.30 | 5.57 | 5.64 |
| ORB | 0.80 | 1.22 | 0.78 | 0.75 |
| DRB | 4.30 | 5.85 | 4.34 | 4.24 |
| REB | 5.10 | 7.07 | 5.12 | 4.99 |
| AST | 7.80 | 7.32 | 8.21 | 7.70 |
| STL | 2.20 | 2.29 | 2.20 | 2.11 |
| BLK | 0.10 | 0.30 | 0.13 | 0.14 |
| TOV | 2.30 | 2.36 | 2.08 | 2.22 |
| PF | 2.80 | 2.59 | 2.87 | 2.86 |
| FG% | 43.0% | 46.1% | 40.3% | 41.5% |
| 3P% | 28.2% | 26.9% | 28.1% | 28.8% |
| FT% | 84.7% | 92.6% | 83.7% | 84.3% |
| 2P% | 46.9% | 49.6% | 43.5% | 45.1% |
| TS% | 54.6% | 54.6% | 54.0% | 55.0% |
| eFG% | 45.5% | 48.2% | 43.2% | 44.7% |
| FTA/FGA | 0.50 | 0.29 | 0.60 | 0.57 |
| TOV% | 13.5% | 11.5% | 12.9% | 13.2% |
| AST/TOV | 3.39 | 3.10 | 3.95 | 3.47 |

Actual final minutes before normalization: authored 34.92, AI 34.74.

### Klay Thompson – Rookie year (2011–12)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6475/stats), 66 games, 29 starts, 24.4 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 12.50 | 13.02 | 13.04 | 11.99 |
| FGA | 10.90 | 10.11 | 11.06 | 10.48 |
| 3PA | 4.10 | 6.75 | 4.55 | 3.99 |
| FTA | 1.40 | 2.10 | 1.17 | 1.25 |
| FGM | 4.80 | 4.31 | 5.12 | 4.71 |
| 3PM | 1.70 | 2.49 | 1.80 | 1.52 |
| FTM | 1.20 | 1.92 | 0.99 | 1.06 |
| ORB | 0.40 | 0.57 | 0.47 | 0.51 |
| DRB | 2.10 | 2.65 | 2.21 | 2.18 |
| REB | 2.40 | 3.22 | 2.69 | 2.69 |
| AST | 2.00 | 2.56 | 1.96 | 1.97 |
| STL | 0.70 | 0.54 | 0.63 | 0.65 |
| BLK | 0.30 | 0.28 | 0.30 | 0.34 |
| TOV | 1.60 | 2.01 | 1.54 | 1.57 |
| PF | 2.30 | 2.19 | 2.28 | 2.39 |
| FG% | 44.3% | 42.6% | 46.3% | 44.9% |
| 3P% | 41.4% | 36.8% | 39.6% | 38.1% |
| FT% | 86.8% | 91.7% | 84.8% | 84.7% |
| 2P% | 45.6% | 54.2% | 50.9% | 49.1% |
| TS% | 54.3% | 59.0% | 56.3% | 54.4% |
| eFG% | 51.8% | 54.9% | 54.4% | 52.2% |
| FTA/FGA | 0.13 | 0.21 | 0.11 | 0.12 |
| TOV% | 12.2% | 15.4% | 11.7% | 12.5% |
| AST/TOV | 1.25 | 1.27 | 1.27 | 1.25 |

Actual final minutes before normalization: authored 24.14, AI 23.89.

### Kawhi Leonard – Rookie year (2011–12)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6450/stats), 64 games, 39 starts, 24 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 7.90 | 8.72 | 7.88 | 7.48 |
| FGA | 6.30 | 6.76 | 6.15 | 6.06 |
| 3PA | 1.70 | 2.80 | 1.68 | 1.69 |
| FTA | 1.40 | 1.96 | 1.22 | 1.11 |
| FGM | 3.10 | 3.18 | 3.13 | 2.99 |
| 3PM | 0.60 | 0.85 | 0.66 | 0.63 |
| FTM | 1.10 | 1.51 | 0.96 | 0.87 |
| ORB | 1.60 | 1.58 | 1.87 | 1.89 |
| DRB | 3.50 | 4.45 | 3.55 | 3.72 |
| REB | 5.10 | 6.03 | 5.42 | 5.61 |
| AST | 1.10 | 1.12 | 1.02 | 1.24 |
| STL | 1.30 | 1.40 | 1.29 | 1.23 |
| BLK | 0.40 | 0.50 | 0.56 | 0.52 |
| TOV | 0.70 | 0.92 | 0.69 | 0.85 |
| PF | 1.40 | 1.63 | 1.60 | 1.53 |
| FG% | 49.3% | 47.1% | 50.9% | 49.3% |
| 3P% | 37.6% | 30.3% | 39.1% | 37.5% |
| FT% | 77.3% | 76.9% | 78.1% | 78.5% |
| 2P% | 54.3% | 59.0% | 55.3% | 53.8% |
| TS% | 57.1% | 57.2% | 58.9% | 57.1% |
| eFG% | 54.0% | 53.4% | 56.2% | 54.5% |
| FTA/FGA | 0.22 | 0.29 | 0.20 | 0.18 |
| TOV% | 9.2% | 10.8% | 9.3% | 11.4% |
| AST/TOV | 1.57 | 1.22 | 1.49 | 1.46 |

Actual final minutes before normalization: authored 23.84, AI 24.09.

### Dwight Howard – Rookie year (2004–05)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2384/stats), 82 games, 82 starts, 32.6 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 12.00 | 14.21 | 11.16 | 11.89 |
| FGA | 8.30 | 8.10 | 7.52 | 8.08 |
| 3PA | 0.00 | 0.04 | 0.03 | 0.04 |
| FTA | 5.00 | 5.68 | 4.52 | 4.81 |
| FGM | 4.30 | 5.24 | 4.03 | 4.31 |
| 3PM | 0.00 | 0.01 | 0.00 | 0.00 |
| FTM | 3.40 | 3.72 | 3.10 | 3.27 |
| ORB | 3.50 | 3.82 | 4.02 | 3.93 |
| DRB | 6.50 | 7.19 | 6.54 | 6.30 |
| REB | 10.00 | 11.00 | 10.56 | 10.24 |
| AST | 0.90 | 1.13 | 1.16 | 1.28 |
| STL | 0.90 | 0.95 | 0.97 | 0.83 |
| BLK | 1.70 | 1.75 | 1.88 | 1.70 |
| TOV | 2.00 | 1.51 | 1.68 | 1.96 |
| PF | 2.80 | 2.50 | 3.30 | 3.27 |
| FG% | 52.0% | 64.7% | 53.5% | 53.3% |
| 3P% | 0.0% | 27.3% | 0.0% | 0.0% |
| FT% | 67.1% | 65.5% | 68.6% | 68.0% |
| 2P% | 51.8% | 64.9% | 53.8% | 53.6% |
| TS% | 57.1% | 67.0% | 58.6% | 58.3% |
| eFG% | 51.8% | 64.8% | 53.5% | 53.3% |
| FTA/FGA | 0.60 | 0.70 | 0.60 | 0.60 |
| TOV% | 16.0% | 12.4% | 15.0% | 16.1% |
| AST/TOV | 0.45 | 0.75 | 0.69 | 0.65 |

Actual final minutes before normalization: authored 31.51, AI 31.30.

### John Wall – Rookie year (2010–11)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4237/stats), 69 games, 64 starts, 37.8 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 16.40 | 18.38 | 15.28 | 15.88 |
| FGA | 14.10 | 14.62 | 13.20 | 13.70 |
| 3PA | 1.70 | 3.20 | 1.70 | 1.86 |
| FTA | 5.70 | 5.50 | 5.51 | 5.54 |
| FGM | 5.80 | 6.60 | 5.34 | 5.53 |
| 3PM | 0.50 | 0.78 | 0.47 | 0.50 |
| FTM | 4.40 | 4.40 | 4.12 | 4.31 |
| ORB | 0.50 | 0.86 | 0.58 | 0.56 |
| DRB | 4.10 | 4.61 | 4.53 | 4.69 |
| REB | 4.60 | 5.48 | 5.11 | 5.25 |
| AST | 8.30 | 9.27 | 7.99 | 8.05 |
| STL | 1.80 | 1.88 | 1.94 | 1.94 |
| BLK | 0.50 | 0.78 | 0.63 | 0.57 |
| TOV | 3.80 | 3.65 | 3.87 | 4.05 |
| PF | 2.50 | 3.60 | 2.64 | 2.53 |
| FG% | 40.9% | 45.2% | 40.5% | 40.4% |
| 3P% | 29.6% | 24.3% | 27.8% | 26.7% |
| FT% | 76.6% | 80.0% | 74.8% | 77.9% |
| 2P% | 42.7% | 51.1% | 42.4% | 42.6% |
| TS% | 49.4% | 54.0% | 48.9% | 49.2% |
| eFG% | 42.9% | 47.8% | 42.3% | 42.2% |
| FTA/FGA | 0.40 | 0.38 | 0.42 | 0.40 |
| TOV% | 18.6% | 17.6% | 19.9% | 20.1% |
| AST/TOV | 2.18 | 2.54 | 2.06 | 1.99 |

Actual final minutes before normalization: authored 35.87, AI 36.15.

### Yi Jianlian – Rookie year (2007–08)

Historical record: [season statistics](https://www.basketball-reference.com/players/j/jianlyi01.html), 66 games, 49 starts, 25 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 8.60 | 10.67 | 8.00 | 7.33 |
| FGA | 7.90 | 8.48 | 7.60 | 7.34 |
| 3PA | 0.30 | 0.52 | 0.29 | 0.33 |
| FTA | 2.20 | 1.88 | 2.44 | 2.19 |
| FGM | 3.30 | 4.42 | 2.92 | 2.72 |
| 3PM | 0.10 | 0.14 | 0.08 | 0.10 |
| FTM | 1.80 | 1.69 | 2.09 | 1.79 |
| ORB | 1.60 | 1.97 | 1.99 | 1.92 |
| DRB | 3.60 | 3.80 | 3.54 | 3.63 |
| REB | 5.20 | 5.77 | 5.53 | 5.55 |
| AST | 0.80 | 1.15 | 1.13 | 1.16 |
| STL | 0.50 | 0.41 | 0.52 | 0.51 |
| BLK | 0.80 | 0.61 | 0.80 | 0.78 |
| TOV | 1.40 | 1.24 | 1.23 | 1.19 |
| PF | 2.30 | 2.50 | 2.43 | 2.34 |
| FG% | 42.1% | 52.2% | 38.4% | 37.0% |
| 3P% | 28.6% | 26.8% | 26.6% | 31.4% |
| FT% | 84.1% | 89.9% | 85.4% | 81.7% |
| 2P% | 42.1% | 53.8% | 38.9% | 37.3% |
| TS% | 48.5% | 57.3% | 46.1% | 44.2% |
| eFG% | 42.4% | 53.0% | 38.9% | 37.7% |
| FTA/FGA | 0.28 | 0.22 | 0.32 | 0.30 |
| TOV% | 13.6% | 11.8% | 12.4% | 12.6% |
| AST/TOV | 0.57 | 0.92 | 0.92 | 0.97 |

Actual final minutes before normalization: authored 26.72, AI 26.79.

### Andrei Kirilenko – Rookie year (2001–02)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/434/stats), 82 games, 40 starts, 26.2 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 10.70 | 8.29 | 11.60 | 11.14 |
| FGA | 7.70 | 5.75 | 7.89 | 7.52 |
| 3PA | 1.20 | 1.55 | 1.29 | 1.22 |
| FTA | 4.50 | 2.17 | 5.08 | 4.91 |
| FGM | 3.50 | 3.00 | 3.67 | 3.54 |
| 3PM | 0.30 | 0.47 | 0.34 | 0.31 |
| FTM | 3.50 | 1.83 | 3.92 | 3.75 |
| ORB | 1.80 | 1.08 | 1.73 | 1.86 |
| DRB | 3.10 | 3.42 | 3.29 | 3.14 |
| REB | 4.90 | 4.50 | 5.01 | 4.99 |
| AST | 1.10 | 1.17 | 1.09 | 1.01 |
| STL | 1.40 | 0.98 | 1.29 | 1.26 |
| BLK | 1.90 | 2.16 | 1.98 | 1.94 |
| TOV | 1.30 | 0.74 | 1.32 | 1.15 |
| PF | 1.90 | 1.11 | 2.06 | 2.09 |
| FG% | 45.0% | 52.1% | 46.6% | 47.1% |
| 3P% | 25.0% | 30.0% | 26.0% | 25.1% |
| FT% | 76.8% | 84.6% | 77.0% | 76.2% |
| 2P% | 49.2% | 60.3% | 50.6% | 51.4% |
| TS% | 55.3% | 61.9% | 57.3% | 57.5% |
| eFG% | 47.4% | 56.2% | 48.7% | 49.1% |
| FTA/FGA | 0.58 | 0.38 | 0.64 | 0.65 |
| TOV% | 11.8% | 9.9% | 11.6% | 10.6% |
| AST/TOV | 0.85 | 1.58 | 0.82 | 0.87 |

Actual final minutes before normalization: authored 26.56, AI 26.49.

### Jeremy Lin – Rookie year (2010–11)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4299/stats), 29 games, 0 starts, 9.8 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 2.60 | 2.83 | 2.87 | 2.75 |
| FGA | 2.50 | 2.42 | 2.45 | 2.53 |
| 3PA | 0.20 | 0.49 | 0.53 | 0.47 |
| FTA | 0.90 | 0.58 | 0.96 | 0.91 |
| FGM | 1.00 | 1.11 | 1.02 | 1.00 |
| 3PM | 0.00 | 0.16 | 0.14 | 0.11 |
| FTM | 0.70 | 0.46 | 0.70 | 0.64 |
| ORB | 0.40 | 0.17 | 0.38 | 0.35 |
| DRB | 0.80 | 0.75 | 0.93 | 1.02 |
| REB | 1.20 | 0.92 | 1.32 | 1.38 |
| AST | 1.40 | 1.27 | 1.25 | 1.29 |
| STL | 1.10 | 0.48 | 0.54 | 0.65 |
| BLK | 0.30 | 0.20 | 0.23 | 0.20 |
| TOV | 0.60 | 0.42 | 0.64 | 0.55 |
| PF | 1.10 | 0.74 | 1.05 | 1.10 |
| FG% | 38.9% | 45.6% | 41.6% | 39.6% |
| 3P% | 20.0% | 32.4% | 25.8% | 23.5% |
| FT% | 76.0% | 78.2% | 72.4% | 70.1% |
| 2P% | 43.5% | 48.9% | 45.9% | 43.2% |
| TS% | 44.9% | 52.7% | 50.0% | 46.9% |
| eFG% | 40.0% | 48.9% | 44.4% | 41.8% |
| FTA/FGA | 0.36 | 0.24 | 0.39 | 0.36 |
| TOV% | 17.2% | 13.6% | 18.2% | 15.8% |
| AST/TOV | 2.33 | 3.01 | 1.95 | 2.35 |

Actual final minutes before normalization: authored 9.59, AI 9.51.

### Toney Douglas – Rookie year (2009–10)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3979/stats), 56 games, 12 starts, 19.4 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 8.60 | 9.74 | 9.61 | 8.29 |
| FGA | 7.00 | 7.61 | 7.48 | 6.74 |
| 3PA | 3.10 | 3.80 | 3.32 | 3.12 |
| FTA | 1.20 | 1.74 | 1.54 | 1.26 |
| FGM | 3.20 | 3.44 | 3.54 | 3.02 |
| 3PM | 1.20 | 1.48 | 1.31 | 1.20 |
| FTM | 1.00 | 1.39 | 1.22 | 1.05 |
| ORB | 0.70 | 0.29 | 0.65 | 0.73 |
| DRB | 1.20 | 1.61 | 1.31 | 1.21 |
| REB | 1.90 | 1.90 | 1.96 | 1.94 |
| AST | 2.00 | 2.46 | 2.01 | 2.19 |
| STL | 0.80 | 1.07 | 0.93 | 0.93 |
| BLK | 0.10 | 0.23 | 0.08 | 0.11 |
| TOV | 1.00 | 1.27 | 1.34 | 1.23 |
| PF | 2.10 | 1.35 | 2.56 | 2.40 |
| FG% | 45.8% | 45.2% | 47.3% | 44.8% |
| 3P% | 38.9% | 38.9% | 39.5% | 38.6% |
| FT% | 80.9% | 79.6% | 79.2% | 83.4% |
| 2P% | 51.3% | 51.4% | 53.6% | 50.1% |
| TS% | 57.1% | 58.1% | 58.9% | 56.8% |
| eFG% | 54.3% | 54.8% | 56.1% | 53.7% |
| FTA/FGA | 0.17 | 0.23 | 0.21 | 0.19 |
| TOV% | 11.7% | 13.1% | 14.1% | 14.4% |
| AST/TOV | 2.00 | 1.94 | 1.50 | 1.78 |

Actual final minutes before normalization: authored 17.58, AI 17.36.

### Jan Veselý – Rookie year (2011–12)

Historical record: [season statistics](https://www.basketball-reference.com/players/v/veselja01.html), 57 games, 20 starts, 18.9 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 4.70 | 5.05 | 5.10 | 4.59 |
| FGA | 3.80 | 3.56 | 4.03 | 3.63 |
| 3PA | 0.02 | 0.02 | 0.03 | 0.03 |
| FTA | 1.10 | 1.12 | 1.02 | 1.01 |
| FGM | 2.10 | 2.22 | 2.28 | 2.04 |
| 3PM | 0.00 | 0.00 | 0.00 | 0.00 |
| FTM | 0.60 | 0.61 | 0.54 | 0.51 |
| ORB | 1.80 | 1.60 | 1.62 | 1.63 |
| DRB | 2.60 | 3.21 | 2.70 | 2.53 |
| REB | 4.40 | 4.81 | 4.31 | 4.15 |
| AST | 0.80 | 0.70 | 0.90 | 0.90 |
| STL | 0.70 | 0.78 | 0.78 | 0.75 |
| BLK | 0.60 | 0.85 | 0.64 | 0.72 |
| TOV | 1.10 | 0.46 | 1.11 | 1.14 |
| PF | 2.70 | 1.34 | 2.48 | 2.46 |
| FG% | 53.7% | 62.3% | 56.7% | 56.2% |
| 3P% | 0.0% | 20.0% | 0.0% | 14.3% |
| FT% | 53.2% | 54.4% | 52.3% | 50.7% |
| 2P% | 55.5% | 62.5% | 57.0% | 56.5% |
| TS% | 54.9% | 62.3% | 56.9% | 56.4% |
| eFG% | 55.3% | 62.3% | 56.7% | 56.2% |
| FTA/FGA | 0.29 | 0.31 | 0.25 | 0.28 |
| TOV% | 20.4% | 10.2% | 19.9% | 21.8% |
| AST/TOV | 0.73 | 1.52 | 0.81 | 0.79 |

Actual final minutes before normalization: authored 17.04, AI 16.91.

### Bismack Biyombo – Rookie year (2011–12)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6427/stats), 63 games, 41 starts, 23.1 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 5.20 | 4.54 | 5.16 | 5.14 |
| FGA | 4.40 | 3.20 | 4.28 | 4.30 |
| 3PA | 0.00 | 0.02 | 0.00 | 0.00 |
| FTA | 2.30 | 1.38 | 2.05 | 1.89 |
| FGM | 2.00 | 1.98 | 2.06 | 2.08 |
| 3PM | 0.00 | 0.00 | 0.00 | 0.00 |
| FTM | 1.10 | 0.57 | 1.03 | 0.99 |
| ORB | 1.80 | 1.44 | 1.83 | 2.00 |
| DRB | 4.00 | 2.60 | 3.99 | 3.81 |
| REB | 5.80 | 4.04 | 5.82 | 5.81 |
| AST | 0.40 | 0.87 | 0.74 | 0.68 |
| STL | 0.30 | 0.37 | 0.37 | 0.29 |
| BLK | 1.80 | 2.16 | 2.01 | 1.94 |
| TOV | 1.10 | 0.25 | 0.85 | 0.81 |
| PF | 2.30 | 1.28 | 2.66 | 2.74 |
| FG% | 46.4% | 61.9% | 48.2% | 48.3% |
| 3P% | 0.0% | 20.0% | n/a | n/a |
| FT% | 48.3% | 41.5% | 50.4% | 52.2% |
| 2P% | 45.5% | 62.1% | 48.2% | 48.3% |
| TS% | 48.0% | 59.6% | 49.7% | 50.0% |
| eFG% | 45.5% | 61.9% | 48.2% | 48.3% |
| FTA/FGA | 0.52 | 0.43 | 0.48 | 0.44 |
| TOV% | 16.9% | 6.1% | 14.0% | 13.6% |
| AST/TOV | 0.36 | 3.53 | 0.88 | 0.84 |

Actual final minutes before normalization: authored 22.96, AI 22.73.

### Bronny James – Rookie year (2024–25)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4683774/stats), 27 games, 1 starts, 6.7 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 2.30 | 1.44 | 2.29 | 2.39 |
| FGA | 2.50 | 1.39 | 2.57 | 2.46 |
| 3PA | 1.20 | 0.84 | 1.24 | 1.21 |
| FTA | 0.50 | 0.22 | 0.48 | 0.56 |
| FGM | 0.80 | 0.50 | 0.79 | 0.81 |
| 3PM | 0.30 | 0.27 | 0.32 | 0.35 |
| FTM | 0.40 | 0.17 | 0.39 | 0.44 |
| ORB | 0.10 | 0.12 | 0.12 | 0.11 |
| DRB | 0.50 | 0.54 | 0.50 | 0.54 |
| REB | 0.70 | 0.65 | 0.62 | 0.65 |
| AST | 0.80 | 0.79 | 0.91 | 1.03 |
| STL | 0.30 | 0.20 | 0.24 | 0.30 |
| BLK | 0.10 | 0.09 | 0.07 | 0.11 |
| TOV | 0.50 | 0.21 | 0.55 | 0.50 |
| PF | 0.50 | 0.50 | 0.52 | 0.47 |
| FG% | 31.3% | 36.0% | 30.6% | 32.7% |
| 3P% | 28.1% | 31.5% | 26.1% | 28.8% |
| FT% | 78.6% | 79.2% | 82.4% | 78.1% |
| 2P% | 38.5% | 43.0% | 34.8% | 36.4% |
| TS% | 42.3% | 48.5% | 41.2% | 44.2% |
| eFG% | 38.0% | 45.6% | 36.9% | 39.8% |
| FTA/FGA | 0.20 | 0.16 | 0.19 | 0.23 |
| TOV% | 15.5% | 12.6% | 16.6% | 15.7% |
| AST/TOV | 1.60 | 3.69 | 1.64 | 2.04 |

Actual final minutes before normalization: authored 7.14, AI 7.13.

### Jarrett Culver – Rookie year (2019–20)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4277928/stats), 63 games, 35 starts, 23.9 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 9.20 | 8.60 | 9.55 | 9.49 |
| FGA | 9.00 | 7.08 | 8.67 | 8.68 |
| 3PA | 3.50 | 3.72 | 3.40 | 3.48 |
| FTA | 1.90 | 1.63 | 2.40 | 2.72 |
| FGM | 3.70 | 3.23 | 3.65 | 3.56 |
| 3PM | 1.00 | 1.37 | 1.04 | 1.03 |
| FTM | 0.90 | 0.76 | 1.21 | 1.33 |
| ORB | 1.10 | 0.75 | 1.17 | 1.14 |
| DRB | 2.30 | 2.48 | 2.25 | 2.00 |
| REB | 3.40 | 3.24 | 3.42 | 3.14 |
| AST | 1.70 | 1.78 | 1.81 | 1.80 |
| STL | 0.90 | 0.63 | 0.78 | 0.70 |
| BLK | 0.60 | 0.53 | 0.59 | 0.59 |
| TOV | 1.30 | 0.74 | 1.25 | 1.11 |
| PF | 2.00 | 1.70 | 1.77 | 1.80 |
| FG% | 40.4% | 45.7% | 42.1% | 41.0% |
| 3P% | 29.9% | 36.9% | 30.5% | 29.7% |
| FT% | 46.2% | 46.6% | 50.6% | 49.1% |
| 2P% | 49.1% | 55.5% | 49.6% | 48.6% |
| TS% | 46.8% | 55.2% | 49.1% | 48.0% |
| eFG% | 46.7% | 55.4% | 48.1% | 47.0% |
| FTA/FGA | 0.21 | 0.23 | 0.28 | 0.31 |
| TOV% | 11.7% | 8.7% | 11.4% | 10.1% |
| AST/TOV | 1.31 | 2.41 | 1.45 | 1.62 |

Actual final minutes before normalization: authored 23.17, AI 23.44.

### Jarred Vanderbilt – 2022–23

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4278077/stats), 78 games, 65 starts, 24.1 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 7.90 | 9.36 | 7.82 | 7.61 |
| FGA | 5.80 | 6.71 | 5.60 | 5.42 |
| 3PA | 1.20 | 1.67 | 1.17 | 1.15 |
| FTA | 1.80 | 1.98 | 1.72 | 1.64 |
| FGM | 3.20 | 3.71 | 3.10 | 3.04 |
| 3PM | 0.40 | 0.57 | 0.35 | 0.32 |
| FTM | 1.20 | 1.37 | 1.28 | 1.20 |
| ORB | 2.20 | 2.91 | 2.43 | 2.42 |
| DRB | 5.30 | 5.33 | 5.31 | 5.55 |
| REB | 7.50 | 8.24 | 7.74 | 7.97 |
| AST | 2.40 | 2.46 | 2.30 | 2.33 |
| STL | 1.10 | 0.93 | 0.94 | 0.97 |
| BLK | 0.30 | 0.31 | 0.26 | 0.27 |
| TOV | 1.20 | 0.85 | 1.39 | 1.14 |
| PF | 2.40 | 1.40 | 2.70 | 2.59 |
| FG% | 54.8% | 55.2% | 55.3% | 56.1% |
| 3P% | 32.2% | 34.1% | 29.6% | 27.8% |
| FT% | 69.1% | 69.5% | 74.5% | 73.4% |
| 2P% | 60.9% | 62.3% | 62.1% | 63.8% |
| TS% | 59.9% | 61.7% | 61.5% | 61.9% |
| eFG% | 58.6% | 59.5% | 58.4% | 59.1% |
| FTA/FGA | 0.31 | 0.29 | 0.31 | 0.30 |
| TOV% | 15.4% | 10.0% | 18.0% | 15.6% |
| AST/TOV | 2.00 | 2.91 | 1.65 | 2.04 |

Actual final minutes before normalization: authored 23.16, AI 23.35.

### Maxi Kleber – Prime (2019–20)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2960236/stats), 74 games, 21 starts, 25.5 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 9.10 | 9.53 | 8.68 | 8.74 |
| FGA | 6.90 | 7.17 | 6.64 | 6.78 |
| 3PA | 4.30 | 4.67 | 4.27 | 4.40 |
| FTA | 1.30 | 1.59 | 1.12 | 1.07 |
| FGM | 3.20 | 3.20 | 3.10 | 3.07 |
| 3PM | 1.60 | 1.80 | 1.58 | 1.66 |
| FTM | 1.10 | 1.33 | 0.91 | 0.94 |
| ORB | 1.50 | 1.99 | 1.76 | 1.72 |
| DRB | 3.70 | 3.78 | 3.69 | 3.65 |
| REB | 5.20 | 5.77 | 5.45 | 5.37 |
| AST | 1.20 | 1.23 | 0.97 | 1.01 |
| STL | 0.30 | 0.42 | 0.45 | 0.37 |
| BLK | 1.10 | 1.24 | 1.21 | 1.17 |
| TOV | 0.80 | 0.94 | 0.62 | 0.57 |
| PF | 2.40 | 1.63 | 2.65 | 2.69 |
| FG% | 46.1% | 44.7% | 46.7% | 45.3% |
| 3P% | 37.3% | 38.5% | 36.9% | 37.7% |
| FT% | 84.9% | 83.5% | 80.6% | 87.8% |
| 2P% | 61.5% | 56.3% | 64.4% | 59.3% |
| TS% | 60.9% | 60.6% | 60.9% | 60.3% |
| eFG% | 58.0% | 57.2% | 58.6% | 57.6% |
| FTA/FGA | 0.19 | 0.22 | 0.17 | 0.16 |
| TOV% | 9.7% | 10.7% | 8.0% | 7.3% |
| AST/TOV | 1.50 | 1.30 | 1.58 | 1.78 |

Actual final minutes before normalization: authored 26.53, AI 26.58.

### Joel Embiid – Draft night (2014, Kansas)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/67433/stats), 28 games, 20 starts, 23.1 MPG.

| Per 40 | Historical | Before | Final |
|---|---:|---:|---:|
| PTS | 19.39 | 21.54 | 19.06 |
| FGA | 10.56 | 13.25 | 10.54 |
| 3PA | 0.35 | 0.44 | 0.35 |
| FTA | 8.83 | 6.57 | 8.66 |
| FGM | 6.58 | 8.44 | 6.51 |
| 3PM | 0.00 | 0.14 | 0.12 |
| FTM | 6.06 | 4.51 | 5.93 |
| ORB | 3.98 | 4.24 | 3.98 |
| DRB | 10.04 | 9.35 | 10.14 |
| REB | 14.03 | 13.59 | 14.13 |
| AST | 2.42 | 2.13 | 2.44 |
| STL | 1.56 | 1.55 | 1.62 |
| BLK | 4.50 | 4.54 | 4.63 |
| TOV | 4.16 | 3.74 | 4.22 |
| PF | 5.89 | 2.34 | 5.84 |
| FG% | 62.6% | 63.7% | 61.7% |
| 3P% | 20.0% | 31.1% | 33.5% |
| FT% | 68.5% | 68.7% | 68.5% |
| 2P% | 64.4% | 64.8% | 62.7% |
| TS% | 67.1% | 66.7% | 66.4% |
| eFG% | 62.3% | 64.2% | 62.3% |
| FTA/FGA | 0.84 | 0.50 | 0.82 |
| TOV% | 22.3% | 18.8% | 22.7% |
| AST/TOV | 0.58 | 0.57 | 0.58 |

### Joel Embiid – Rookie year (2016–17)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3059318/stats), 31 games, 31 starts, 25.4 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 20.20 | 20.10 | 20.56 | 19.97 |
| FGA | 13.80 | 12.59 | 12.87 | 12.89 |
| 3PA | 3.20 | 3.83 | 3.45 | 3.55 |
| FTA | 7.90 | 6.12 | 8.17 | 7.77 |
| FGM | 6.50 | 6.78 | 6.40 | 6.25 |
| 3PM | 1.20 | 1.42 | 1.30 | 1.29 |
| FTM | 6.20 | 5.12 | 6.46 | 6.18 |
| ORB | 2.00 | 2.75 | 2.10 | 2.33 |
| DRB | 5.90 | 5.55 | 5.78 | 5.62 |
| REB | 7.80 | 8.30 | 7.89 | 7.95 |
| AST | 2.10 | 1.79 | 1.94 | 1.96 |
| STL | 0.90 | 0.89 | 0.74 | 0.85 |
| BLK | 2.50 | 2.43 | 2.55 | 2.28 |
| TOV | 3.80 | 2.80 | 4.02 | 3.74 |
| PF | 3.60 | 1.74 | 3.64 | 3.56 |
| FG% | 46.6% | 53.9% | 49.7% | 48.5% |
| 3P% | 36.7% | 37.1% | 37.7% | 36.4% |
| FT% | 78.3% | 83.5% | 79.1% | 79.6% |
| 2P% | 50.0% | 61.2% | 54.1% | 53.1% |
| TS% | 58.5% | 65.7% | 62.4% | 61.2% |
| eFG% | 51.4% | 59.5% | 54.7% | 53.5% |
| FTA/FGA | 0.57 | 0.49 | 0.63 | 0.60 |
| TOV% | 18.0% | 15.5% | 19.6% | 18.7% |
| AST/TOV | 0.55 | 0.64 | 0.48 | 0.52 |

Actual final minutes before normalization: authored 25.65, AI 25.40.

### Joel Embiid – MVP season (2022–23)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3059318/stats), 66 games, 66 starts, 34.6 MPG.

| Category | Historical | Before AI | Final authored | Final AI |
|---|---:|---:|---:|---:|
| PTS | 33.10 | 32.32 | 32.21 | 32.80 |
| FGA | 20.10 | 20.26 | 18.62 | 19.30 |
| 3PA | 3.00 | 2.93 | 2.74 | 2.93 |
| FTA | 11.70 | 9.45 | 11.96 | 12.08 |
| FGM | 11.00 | 11.45 | 10.52 | 10.80 |
| 3PM | 1.00 | 1.00 | 0.99 | 0.95 |
| FTM | 10.00 | 8.43 | 10.16 | 10.25 |
| ORB | 1.70 | 3.65 | 1.59 | 1.65 |
| DRB | 8.40 | 7.13 | 8.32 | 8.39 |
| REB | 10.20 | 10.78 | 9.91 | 10.04 |
| AST | 4.20 | 4.45 | 4.37 | 4.51 |
| STL | 1.00 | 1.27 | 0.92 | 0.88 |
| BLK | 1.70 | 2.32 | 1.77 | 1.81 |
| TOV | 3.40 | 3.96 | 3.31 | 3.37 |
| PF | 3.10 | 2.28 | 3.64 | 3.40 |
| FG% | 54.8% | 56.5% | 56.5% | 55.9% |
| 3P% | 33.0% | 34.0% | 36.2% | 32.5% |
| FT% | 85.7% | 89.1% | 85.0% | 84.9% |
| 2P% | 58.5% | 60.3% | 60.0% | 60.1% |
| TS% | 65.5% | 66.2% | 67.4% | 66.6% |
| eFG% | 57.2% | 59.0% | 59.2% | 58.4% |
| FTA/FGA | 0.58 | 0.47 | 0.64 | 0.63 |
| TOV% | 11.9% | 14.0% | 12.2% | 12.0% |
| AST/TOV | 1.24 | 1.12 | 1.32 | 1.34 |

Actual final minutes before normalization: authored 32.68, AI 32.94.

### Anthony Bennett – Draft night (2013, UNLV)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/61902/stats), 35 games, 32 starts, 27.1 MPG.

| Per 40 | Historical | Before | Final |
|---|---:|---:|---:|
| PTS | 23.76 | 24.56 | 23.67 |
| FGA | 15.94 | 16.67 | 16.14 |
| 3PA | 3.99 | 4.40 | 4.04 |
| FTA | 7.53 | 6.36 | 7.58 |
| FGM | 8.56 | 9.19 | 8.43 |
| 3PM | 1.48 | 1.73 | 1.49 |
| FTM | 5.17 | 4.44 | 5.31 |
| ORB | 3.69 | 3.60 | 3.77 |
| DRB | 8.41 | 8.62 | 8.82 |
| REB | 11.96 | 12.22 | 12.59 |
| AST | 1.48 | 1.83 | 1.69 |
| STL | 1.03 | 1.02 | 1.01 |
| BLK | 1.77 | 1.80 | 1.78 |
| TOV | 2.80 | 3.58 | 2.81 |
| PF | 3.39 | 2.63 | 3.40 |
| FG% | 53.3% | 55.2% | 52.2% |
| 3P% | 37.5% | 39.3% | 37.0% |
| FT% | 70.1% | 69.8% | 70.0% |
| 2P% | 59.3% | 60.9% | 57.4% |
| TS% | 61.7% | 63.1% | 60.8% |
| eFG% | 58.3% | 60.4% | 56.9% |
| FTA/FGA | 0.47 | 0.38 | 0.47 |
| TOV% | 12.7% | 15.5% | 12.6% |
| AST/TOV | 0.53 | 0.51 | 0.60 |

### Tyler Hansbrough – Draft night (2009, North Carolina)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/27018/stats), 34 games, 34 starts, 30.3 MPG.

| Per 40 | Historical | Before | Final |
|---|---:|---:|---:|
| PTS | 27.33 | 28.45 | 26.59 |
| FGA | 16.90 | 17.67 | 16.24 |
| 3PA | 0.92 | 1.32 | 0.89 |
| FTA | 11.49 | 8.98 | 10.93 |
| FGM | 8.71 | 10.23 | 8.56 |
| 3PM | 0.40 | 0.49 | 0.35 |
| FTM | 9.64 | 7.50 | 9.13 |
| ORB | 3.96 | 3.01 | 3.92 |
| DRB | 6.73 | 7.64 | 6.99 |
| REB | 10.69 | 10.64 | 10.91 |
| AST | 1.32 | 1.91 | 2.00 |
| STL | 1.58 | 1.63 | 1.76 |
| BLK | 0.53 | 0.51 | 0.57 |
| TOV | 2.51 | 3.71 | 2.39 |
| PF | 3.04 | 2.76 | 3.04 |
| FG% | 51.4% | 57.9% | 52.7% |
| 3P% | 39.1% | 37.3% | 39.4% |
| FT% | 84.1% | 83.6% | 83.6% |
| 2P% | 52.1% | 59.6% | 53.5% |
| TS% | 62.2% | 65.8% | 63.2% |
| eFG% | 52.7% | 59.3% | 53.8% |
| FTA/FGA | 0.68 | 0.51 | 0.67 |
| TOV% | 10.3% | 14.6% | 10.2% |
| AST/TOV | 0.53 | 0.51 | 0.84 |

### Blake Griffin – Draft night (2009, Oklahoma)

Historical record: [season statistics](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/36259/stats), 35 games, 35 starts, 33.3 MPG.

| Per 40 | Historical | Before | Final |
|---|---:|---:|---:|
| PTS | 27.27 | 27.69 | 27.13 |
| FGA | 15.74 | 16.50 | 15.81 |
| 3PA | 0.24 | 0.57 | 0.24 |
| FTA | 11.17 | 8.91 | 11.12 |
| FGM | 10.33 | 11.10 | 10.22 |
| 3PM | 0.12 | 0.19 | 0.07 |
| FTM | 6.61 | 5.31 | 6.63 |
| ORB | 4.68 | 4.98 | 4.64 |
| DRB | 12.61 | 9.80 | 12.24 |
| REB | 17.30 | 14.78 | 16.88 |
| AST | 2.76 | 2.68 | 2.73 |
| STL | 1.32 | 1.33 | 1.34 |
| BLK | 1.44 | 1.45 | 1.39 |
| TOV | 3.96 | 3.68 | 3.89 |
| PF | 3.00 | 2.60 | 3.00 |
| FG% | 65.4% | 67.3% | 64.6% |
| 3P% | 37.5% | 32.6% | 29.3% |
| FT% | 59.0% | 59.6% | 59.6% |
| 2P% | 65.9% | 68.5% | 65.2% |
| TS% | 66.0% | 67.8% | 65.5% |
| eFG% | 66.0% | 67.8% | 64.9% |
| FTA/FGA | 0.71 | 0.54 | 0.70 |
| TOV% | 16.1% | 15.3% | 15.8% |
| AST/TOV | 0.70 | 0.73 | 0.70 |

## Sources and limits

Actual named-season targets are used, with no inflation to modern pace. Historical distance bins (0–3, 3–10, 10–three-point line) are approximations for the engine’s restricted-area/paint/mid zones, which have different boundaries. The verified distance records are listed in .review/card-distance-targets.json:

- Al Horford – Rookie year (2007–08): [shooting-distance record](https://www.basketball-reference.com/leagues/NBA_2008_shooting.html).
- Klay Thompson – Rookie year (2011–12): [shooting-distance record](https://www.basketball-reference.com/players/t/thompkl01.html).
- Kawhi Leonard – Rookie year (2011–12): [shooting-distance record](https://www.basketball-reference.com/players/l/leonaka01.html).
- John Wall – Rookie year (2010–11): [shooting-distance record](https://www.basketball-reference.com/players/w/walljo01.html).
- Yi Jianlian – Rookie year (2007–08): [shooting-distance record](https://www.basketball-reference.com/players/j/jianlyi01.html).
- Bismack Biyombo – Rookie year (2011–12): [shooting-distance record](https://www.basketball-reference.com/leagues/NBA_2012_shooting.html).
- Dwight Howard – Rookie year (2004–05): [shooting-distance record](https://www.basketball-reference.com/players/h/howardw01.html).
- Andrei Kirilenko – Rookie year (2001–02): [shooting-distance record](https://www.basketball-reference.com/leagues/NBA_2002_shooting.html).
- Jan Veselý – Rookie year (2011–12): [shooting-distance record](https://www.basketball-reference.com/leagues/NBA_2012_shooting.html).
- Joel Embiid – Rookie year (2016–17): [shooting-distance record](https://www.basketball-reference.com/teams/PHI/2017.html).

The [NCAA rules book](https://a.espncdn.com/sec/media/2021/NCAA%20MBB%20Playing%20Rules%20Book.pdf) defines fifth-foul disqualification; the season-line safeguard caps personal fouls accordingly. NBA games retain the existing [sixth-foul rule](https://official.nba.com/rule-no-3-players-substitutes-and-coaches).

Historical teammates, opponents, rules and spacing are not reconstructed season by season. Games played, starts and actual minutes/availability are not certified by a healthy fixed-exposure test. Defensive impact, matchup skill, personality, potential and full careers need separate longitudinal/scouting validation. Game EPM/LEBRON/DARKO remain estimates, not the published real metrics. Complete verified shot-creation/shot-location data are not available for every older card. These limits remain even where the box-score fit is close.

## Reproduction and evidence

Use Node 24+. Run node .review/test-realism.mjs; node .review/test-card-migrations.mjs; node .review/regressions.mjs; node .review/test-player-cards.mjs --current 0 24; node .review/validate-realism-college.mjs; node .review/check-realism-league.mjs; then node .review/refresh-realism-results.mjs and node .review/report-realism-fixes.mjs. The original measured baseline is committed, and can be regenerated from commit 9e3541f3. Current raw simulation outputs are generated locally and ignored. Compact results, target/source records, prior builds and final build/fit records are committed under .review/.

Save migrations: cardV 5, rimV 2, ftV 4. Only the affected finishing/free-throw normalization fields are refreshed for older saves. F13/F15 remain outside this change.

# Player-card historical accuracy audit — 2026-10-29

All 25 built-in cards were tested against their actual named seasons. Ten presets were adjusted after independent validation. Fifteen retain their earlier ratings because the tested changes did not pass the statistical or skill-plausibility guardrails. Full realism remains an open objective: the tests do not establish accuracy in every category.

## Method

The baseline used production applyCard and GameSim: three generated worlds (2027, 44, 7), 29 rotating opponents, alternating home/away, matched position group and starter/bench role, historical minutes, and both authored and AI-generated tendencies. Each card played 100 games per world and style: 600 per card, 15,000 baseline games. A final production-preset run repeats all 15,000 games after the changes and integration of concurrent commit 05ff22c9. Fitting and independent validation use additional seeds; final NBA candidate comparisons use 600 games per build with seed offset 3900011. Separate styles are shown below because their average can hide a mismatch in one style.

Counts are normalized by actual simulated minutes to historical MPG. Percentages use aggregate makes and attempts. Healthy players, fixed exposure and no between-game development/fatigue isolate skill and role; they do not validate availability or full careers. A card preserves recipient identity and age, so tests explicitly set card age. The AI normally replaces authored tendencies monthly unless the player freezes them.

The four college cards use amateurStats.seasonLine at their actual schools. Historical comparisons are per 40 minutes, over 300 independent identities (2001–2300), separate from fitting identities. Their NBA games are stress tests, not college validation. College comparisons reproduce exactly after the concurrent college-path changes. Transfers, redshirts and historical minutes/availability are not established by this isolated final-season test.

Candidates must improve a weighted fourteen-category fit on unseen seeds and pass category regression checks. Accepted skill changes are at most 18 points per rating, retaining body, athletic ratings, defensive IQ, personality and authored shot-location/creation shares. College fits can also change handling, offensive IQ and box out within that bound. Some optimizers demanded near-minimum finishing to offset engine rim efficiency; those were rejected. These are statistical fits, not proof that each individual rating is the correct scouting grade.

Diagnostic tolerances: PTS 1.5; FGA 1.2; 3PA/FTA 0.8; ORB 0.5; DRB 0.8; AST 0.7; STL/BLK 0.25; TOV/PF 0.5; FG/FT 3.5 percentage points; 3P 4 points. Three-point percentage is excluded from acceptance checks below one historical attempt per game (per 40 for college). These are engineering tolerances, not an accuracy percentage. Final style-specific results may differ from the held-out combined average.

## Findings and coverage limits

- Rim-heavy bigs remain a systematic problem: FG% is too high and low-usage bigs often commit too few turnovers. Some cards cannot match scoring, efficiency and realistic skills simultaneously with the current formulas.
- Historical counts are the target, with no pace inflation. The modern simulation does not reconstruct each historical season’s teammates, rules, spacing or defenses.
- Shot-location and creation counts were collected, but complete independently verified historical charts are not available for every card, especially pre-tracking seasons. These categories are not certified.
- Steals and blocks do not establish defensive impact or coverage skills. Game EPM/LEBRON/DARKO are estimates, not the published real metrics. BPM/PER/win shares require full team/league context and are not certified here.
- Games played, starts, injuries, aging, development, potential, clutch behavior and personality require separate season/career and scouting validation. Healthy fixed-exposure tests do not establish them. Body measurements were retained, not independently re-certified.
- Key shooting/rebounding/testing formulas in the guide were corrected. Its historical appendix and source-card tuning comments still include stale assumptions. Independent season records take precedence; the old Luka benchmark was incorrect.

## Every card at a glance

Largest remaining gaps use final AI style for NBA cards and the held-out final college model. All college counts are per 40. A retune does not mean every gap is resolved.

| Card | Retuned | Largest diagnostic gaps |
|---|---:|---:|
| Luka Dončić – Rookie year (2018–19) | Yes | PF 3.29 vs 1.90; FTA 4.66 vs 6.70; TOV 4.24 vs 3.40 |
| Dalton Knecht – Rookie year (2024–25) | Yes | PF 2.09 vs 1.20; TOV 1.33 vs 0.50; FTA 2.31 vs 1.10 |
| Ben Simmons – Rookie year (2017–18) | Yes | TOV 2.81 vs 3.40 |
| Al Horford – Rookie year (2007–08) | No | FG 60.5% vs 49.8%; PTS 14.12 vs 10.10; FTA 4.42 vs 2.60 |
| Chris Paul – Rookie year (2005–06) | No | FGA 16.18 vs 12.10; PTS 19.89 vs 16.10; FT 92.6% vs 84.7% |
| Klay Thompson – Rookie year (2011–12) | No | TPA 6.75 vs 4.10; FT 91.7% vs 86.8%; TP 36.8% vs 41.4% |
| Kawhi Leonard – Rookie year (2011–12) | No | TP 30.3% vs 37.6%; TPA 2.80 vs 1.70; DRB 4.45 vs 3.50 |
| Dwight Howard – Rookie year (2004–05) | Yes | FG 64.7% vs 52.0%; PTS 14.21 vs 12.00 |
| John Wall – Rookie year (2010–11) | Yes | PF 3.60 vs 2.50; TPA 3.20 vs 1.70; AST 9.27 vs 8.30 |
| Yi Jianlian – Rookie year (2007–08) | No | FG 52.2% vs 42.1%; FT 89.9% vs 84.1%; PTS 10.67 vs 8.60 |
| Andrei Kirilenko – Rookie year (2001–02) | No | FTA 2.17 vs 4.50; FT 84.6% vs 76.8%; FG 52.1% vs 45.0% |
| Jeremy Lin – Rookie year (2010–11) | No | STL 0.48 vs 1.10; FG 45.6% vs 38.9% |
| Toney Douglas – Rookie year (2009–10) | No | PF 1.35 vs 2.10; STL 1.07 vs 0.80 |
| Jan Veselý – Rookie year (2011–12) | No | PF 1.34 vs 2.70; FG 62.3% vs 53.7%; TOV 0.46 vs 1.10 |
| Bismack Biyombo – Rookie year (2011–12) | No | FG 61.9% vs 46.4%; PF 1.28 vs 2.30; FT 41.5% vs 48.3% |
| Bronny James – Rookie year (2024–25) | No | FG 36.0% vs 31.3% |
| Jarrett Culver – Rookie year (2019–20) | No | TP 36.9% vs 29.9%; FGA 7.08 vs 9.00; FG 45.7% vs 40.4% |
| Jarred Vanderbilt – 2022–23 | No | PF 1.40 vs 2.40; ORB 2.91 vs 2.20 |
| Maxi Kleber – Prime (2019–20) | Yes | PF 1.63 vs 2.40 |
| Joel Embiid – Draft night (2014, Kansas) | Yes | PF 2.34 vs 5.89; FTA 6.57 vs 8.83; FGA 13.25 vs 10.56 |
| Joel Embiid – Rookie year (2016–17) | No | PF 1.74 vs 3.60; FTA 6.12 vs 7.90; FG 53.9% vs 46.6% |
| Joel Embiid – MVP season (2022–23) | No | ORB 3.65 vs 1.70; FTA 9.45 vs 11.70; BLK 2.32 vs 1.70 |
| Anthony Bennett – Draft night (2013, UNLV) | Yes | TOV 3.58 vs 2.80; PF 2.63 vs 3.39; FTA 6.36 vs 7.53 |
| Tyler Hansbrough – Draft night (2009, North Carolina) | Yes | FTA 8.98 vs 11.49; TOV 3.71 vs 2.51; ORB 3.01 vs 3.96 |
| Blake Griffin – Draft night (2009, Oklahoma) | Yes | DRB 9.80 vs 12.61; FTA 8.91 vs 11.17 |

## Detailed comparisons

NBA counts are at real MPG. Original is the measured pre-change baseline; Final is the production build. Derived historical values can differ slightly because source averages are rounded. Tiny three-point samples are noisy.

### Luka Dončić – Rookie year (2018–19)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3945274/stats). 72 games, 72 starts, 32.2 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 7.00 | 7.66 | 8.07 | 6.79 | 7.73 |
| 3PM | 2.30 | 2.40 | 2.51 | 2.16 | 2.60 |
| FTM | 4.80 | 4.18 | 3.44 | 5.15 | 3.44 |
| 2P% | 50.0% | 53.5% | 53.1% | 52.8% | 53.0% |
| AST/TOV | 1.76 | 1.66 | 1.24 | 1.79 | 1.23 |
| PTS | 21.20 | 21.92 | 22.08 | 20.89 | 21.50 |
| FGA | 16.50 | 16.98 | 18.34 | 15.33 | 17.91 |
| 3PA | 7.10 | 7.14 | 7.87 | 6.57 | 8.22 |
| FTA | 6.70 | 5.73 | 4.86 | 7.00 | 4.66 |
| ORB | 1.20 | 1.82 | 1.86 | 1.69 | 1.58 |
| DRB | 6.60 | 7.11 | 7.56 | 6.56 | 6.67 |
| REB | 7.80 | 8.93 | 9.42 | 8.25 | 8.25 |
| AST | 6.00 | 5.57 | 5.04 | 5.62 | 5.22 |
| STL | 1.10 | 1.21 | 1.12 | 1.10 | 1.12 |
| BLK | 0.30 | 0.30 | 0.34 | 0.27 | 0.26 |
| TOV | 3.40 | 3.36 | 4.07 | 3.15 | 4.24 |
| PF | 1.90 | 3.17 | 3.25 | 3.01 | 3.29 |
| FG% | 42.7% | 45.1% | 44.0% | 44.3% | 43.2% |
| 3P% | 32.7% | 33.7% | 31.8% | 32.9% | 31.6% |
| FT% | 71.3% | 73.0% | 70.8% | 73.5% | 73.8% |
| TS% | 54.5% | 56.2% | 53.9% | 56.7% | 53.9% |
| eFG% | 49.4% | 52.2% | 50.8% | 51.3% | 50.4% |
| FTA/FGA | 0.41 | 0.34 | 0.26 | 0.46 | 0.26 |
| TOV% | 14.9% | 14.7% | 16.6% | 14.6% | 17.5% |

Actual final minutes before normalization: authored 30.99, AI 31.12.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.87 | 3.16 |
| Rim FGM | 1.97 | 2.24 |
| Paint + mid FGA | 5.88 | 6.53 |
| Paint + mid FGM | 2.66 | 2.90 |
| Corner 3PA | 0.42 | 0.71 |
| Above-break 3PA | 6.15 | 7.51 |
| Catch-and-shoot attempts | 0.87 | 1.16 |
| Pull-up attempts | 5.37 | 8.16 |
| Stepback attempts | 3.15 | 2.74 |
| Fadeaway attempts | 0.90 | 0.40 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Dalton Knecht – Rookie year (2024–25)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4897943/stats). 78 games, 16 starts, 19.2 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.30 | 4.37 | 4.10 | 3.40 | 3.85 |
| 3PM | 1.60 | 1.93 | 1.70 | 1.65 | 1.81 |
| FTM | 0.80 | 2.02 | 1.65 | 0.76 | 1.75 |
| 2P% | 63.0% | 60.3% | 60.1% | 59.8% | 57.1% |
| AST/TOV | 1.60 | 0.50 | 0.52 | 0.70 | 0.51 |
| PTS | 9.10 | 12.68 | 11.56 | 9.21 | 11.25 |
| FGA | 7.10 | 9.02 | 8.68 | 7.20 | 8.19 |
| 3PA | 4.40 | 4.97 | 4.69 | 4.27 | 4.62 |
| FTA | 1.10 | 2.78 | 2.33 | 0.98 | 2.31 |
| ORB | 0.50 | 0.65 | 0.74 | 0.69 | 0.77 |
| DRB | 2.30 | 2.16 | 2.13 | 2.37 | 2.34 |
| REB | 2.80 | 2.81 | 2.87 | 3.06 | 3.11 |
| AST | 0.80 | 0.77 | 0.73 | 0.75 | 0.68 |
| STL | 0.30 | 0.40 | 0.31 | 0.33 | 0.35 |
| BLK | 0.10 | 0.15 | 0.16 | 0.12 | 0.10 |
| TOV | 0.50 | 1.55 | 1.39 | 1.06 | 1.33 |
| PF | 1.20 | 2.05 | 2.01 | 2.01 | 2.09 |
| FG% | 46.1% | 48.4% | 47.2% | 47.2% | 47.0% |
| 3P% | 37.6% | 38.7% | 36.3% | 38.6% | 39.2% |
| FT% | 76.2% | 72.5% | 70.9% | 77.5% | 75.7% |
| TS% | 60.0% | 61.9% | 59.5% | 60.3% | 61.1% |
| eFG% | 57.7% | 59.1% | 57.0% | 58.7% | 58.0% |
| FTA/FGA | 0.15 | 0.31 | 0.27 | 0.14 | 0.28 |
| TOV% | 6.2% | 13.1% | 12.5% | 12.2% | 12.6% |

Actual final minutes before normalization: authored 17.62, AI 17.55.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 1.92 | 2.27 |
| Rim FGM | 1.30 | 1.50 |
| Paint + mid FGA | 1.02 | 1.30 |
| Paint + mid FGM | 0.46 | 0.54 |
| Corner 3PA | 0.97 | 1.10 |
| Above-break 3PA | 3.29 | 3.53 |
| Catch-and-shoot attempts | 3.38 | 3.58 |
| Pull-up attempts | 0.81 | 1.17 |
| Stepback attempts | 0.48 | 0.54 |
| Fadeaway attempts | 0.04 | 0.07 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Ben Simmons – Rookie year (2017–18)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3907387/stats). 81 games, 81 starts, 33.7 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 6.70 | 8.15 | 7.53 | 7.24 | 6.62 |
| 3PM | 0.00 | 0.05 | 0.04 | 0.05 | 0.04 |
| FTM | 2.40 | 2.82 | 2.72 | 2.35 | 1.99 |
| 2P% | 54.9% | 58.3% | 58.2% | 58.2% | 57.1% |
| AST/TOV | 2.41 | 2.22 | 2.70 | 2.76 | 2.93 |
| PTS | 15.80 | 19.16 | 17.81 | 16.88 | 15.28 |
| FGA | 12.30 | 14.15 | 13.16 | 12.63 | 11.84 |
| 3PA | 0.10 | 0.27 | 0.30 | 0.29 | 0.31 |
| FTA | 4.20 | 4.90 | 4.83 | 4.20 | 3.61 |
| ORB | 1.80 | 2.03 | 2.06 | 1.58 | 1.61 |
| DRB | 6.30 | 8.19 | 8.27 | 6.85 | 7.06 |
| REB | 8.10 | 10.23 | 10.33 | 8.43 | 8.67 |
| AST | 8.20 | 8.26 | 8.42 | 7.99 | 8.24 |
| STL | 1.70 | 1.79 | 1.72 | 1.69 | 1.63 |
| BLK | 0.90 | 1.36 | 1.26 | 0.96 | 1.09 |
| TOV | 3.40 | 3.72 | 3.11 | 2.90 | 2.81 |
| PF | 2.60 | 2.52 | 2.40 | 2.39 | 2.35 |
| FG% | 54.5% | 57.6% | 57.2% | 57.3% | 55.9% |
| 3P% | 0.0% | 17.9% | 15.1% | 17.6% | 13.3% |
| FT% | 56.0% | 57.6% | 56.2% | 56.0% | 55.1% |
| TS% | 55.8% | 58.8% | 58.3% | 58.3% | 56.9% |
| eFG% | 54.5% | 57.7% | 57.4% | 57.5% | 56.1% |
| FTA/FGA | 0.34 | 0.35 | 0.37 | 0.33 | 0.31 |
| TOV% | 19.4% | 18.6% | 16.9% | 16.7% | 17.3% |

Actual final minutes before normalization: authored 32.83, AI 32.60.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 7.69 | 7.19 |
| Rim FGM | 5.21 | 4.86 |
| Paint + mid FGA | 4.65 | 4.34 |
| Paint + mid FGM | 1.97 | 1.73 |
| Corner 3PA | 0.06 | 0.09 |
| Above-break 3PA | 0.23 | 0.22 |
| Catch-and-shoot attempts | 0.22 | 0.19 |
| Pull-up attempts | 0.88 | 0.91 |
| Stepback attempts | 0.37 | 0.55 |
| Fadeaway attempts | 0.47 | 0.40 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Al Horford – Rookie year (2007–08)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3213/stats). 81 games, 77 starts, 31.4 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 4.10 | 5.67 | 5.56 | 5.54 | 5.38 |
| 3PM | 0.00 | 0.02 | 0.00 | 0.02 | 0.01 |
| FTM | 1.90 | 3.21 | 3.16 | 3.32 | 3.35 |
| 2P% | 50.6% | 61.1% | 60.2% | 62.3% | 60.8% |
| AST/TOV | 0.88 | 1.50 | 1.27 | 1.42 | 1.40 |
| PTS | 10.10 | 14.57 | 14.29 | 14.42 | 14.12 |
| FGA | 8.20 | 9.33 | 9.31 | 8.94 | 8.89 |
| 3PA | 0.10 | 0.07 | 0.08 | 0.08 | 0.06 |
| FTA | 2.60 | 4.33 | 4.33 | 4.41 | 4.42 |
| ORB | 3.10 | 3.54 | 3.78 | 3.72 | 3.70 |
| DRB | 6.60 | 6.95 | 7.31 | 6.96 | 7.13 |
| REB | 9.70 | 10.48 | 11.09 | 10.68 | 10.84 |
| AST | 1.50 | 1.92 | 1.64 | 1.69 | 1.82 |
| STL | 0.70 | 0.78 | 0.75 | 0.88 | 0.81 |
| BLK | 0.90 | 1.07 | 0.94 | 1.04 | 1.13 |
| TOV | 1.70 | 1.28 | 1.29 | 1.19 | 1.30 |
| PF | 3.30 | 2.29 | 2.10 | 2.17 | 2.26 |
| FG% | 49.8% | 60.8% | 59.7% | 62.0% | 60.5% |
| 3P% | 0.0% | 22.7% | 4.0% | 30.4% | 15.8% |
| FT% | 73.1% | 74.0% | 73.0% | 75.3% | 75.8% |
| TS% | 54.0% | 64.8% | 63.7% | 66.3% | 65.2% |
| eFG% | 50.0% | 60.9% | 59.7% | 62.1% | 60.6% |
| FTA/FGA | 0.32 | 0.46 | 0.46 | 0.49 | 0.50 |
| TOV% | 15.4% | 10.2% | 10.3% | 9.9% | 10.7% |

Actual final minutes before normalization: authored 30.93, AI 31.10.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 5.53 | 5.42 |
| Rim FGM | 4.05 | 3.85 |
| Paint + mid FGA | 3.33 | 3.41 |
| Paint + mid FGM | 1.47 | 1.52 |
| Corner 3PA | 0.02 | 0.01 |
| Above-break 3PA | 0.05 | 0.06 |
| Catch-and-shoot attempts | 0.13 | 0.10 |
| Pull-up attempts | 0.17 | 0.20 |
| Stepback attempts | 0.02 | 0.01 |
| Fadeaway attempts | 0.68 | 0.74 |

Decision: Original ratings retained. tov: previously within tolerance

### Chris Paul – Rookie year (2005–06)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2779/stats). 78 games, 78 starts, 36 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 5.20 | 8.29 | 7.62 | 8.23 | 7.46 |
| 3PM | 0.60 | 0.79 | 0.67 | 0.83 | 0.67 |
| FTM | 5.10 | 4.56 | 3.96 | 4.78 | 4.30 |
| 2P% | 46.9% | 49.9% | 49.6% | 50.0% | 49.6% |
| AST/TOV | 3.39 | 2.28 | 3.00 | 2.35 | 3.10 |
| PTS | 16.10 | 21.93 | 19.86 | 22.06 | 19.89 |
| FGA | 12.10 | 17.83 | 16.47 | 17.75 | 16.18 |
| 3PA | 2.30 | 2.80 | 2.46 | 2.94 | 2.50 |
| FTA | 6.00 | 4.91 | 4.25 | 5.19 | 4.64 |
| ORB | 0.80 | 1.13 | 1.14 | 1.08 | 1.22 |
| DRB | 4.30 | 6.10 | 5.74 | 5.85 | 5.85 |
| REB | 5.10 | 7.23 | 6.88 | 6.93 | 7.07 |
| AST | 7.80 | 7.21 | 7.53 | 7.24 | 7.32 |
| STL | 2.20 | 2.29 | 2.47 | 2.33 | 2.29 |
| BLK | 0.10 | 0.25 | 0.25 | 0.26 | 0.30 |
| TOV | 2.30 | 3.15 | 2.51 | 3.08 | 2.36 |
| PF | 2.80 | 2.44 | 2.48 | 2.42 | 2.59 |
| FG% | 43.0% | 46.5% | 46.2% | 46.4% | 46.1% |
| 3P% | 28.2% | 28.3% | 27.3% | 28.1% | 26.9% |
| FT% | 84.7% | 92.8% | 93.3% | 92.1% | 92.6% |
| TS% | 54.6% | 54.8% | 54.2% | 55.1% | 54.6% |
| eFG% | 45.5% | 48.7% | 48.3% | 48.7% | 48.2% |
| FTA/FGA | 0.50 | 0.28 | 0.26 | 0.29 | 0.29 |
| TOV% | 13.5% | 13.6% | 12.0% | 13.3% | 11.5% |

Actual final minutes before normalization: authored 35.02, AI 35.11.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 10.12 | 9.70 |
| Rim FGM | 5.55 | 5.21 |
| Paint + mid FGA | 4.69 | 3.98 |
| Paint + mid FGM | 1.85 | 1.58 |
| Corner 3PA | 0.09 | 0.11 |
| Above-break 3PA | 2.84 | 2.39 |
| Catch-and-shoot attempts | 0.26 | 0.22 |
| Pull-up attempts | 2.89 | 2.61 |
| Stepback attempts | 1.54 | 1.28 |
| Fadeaway attempts | 0.05 | 0.04 |

Decision: Original ratings retained. tpa: previously within tolerance; fta: material regression

### Klay Thompson – Rookie year (2011–12)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6475/stats). 66 games, 29 starts, 24.4 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 4.80 | 4.64 | 4.33 | 4.79 | 4.31 |
| 3PM | 1.70 | 2.57 | 2.52 | 2.59 | 2.49 |
| FTM | 1.20 | 1.91 | 1.86 | 2.07 | 1.92 |
| 2P% | 45.6% | 54.8% | 54.4% | 55.7% | 54.2% |
| AST/TOV | 1.25 | 1.13 | 1.23 | 1.04 | 1.27 |
| PTS | 12.50 | 13.77 | 13.04 | 14.23 | 13.02 |
| FGA | 10.90 | 10.88 | 10.10 | 10.96 | 10.11 |
| 3PA | 4.10 | 7.10 | 6.76 | 7.00 | 6.75 |
| FTA | 1.40 | 2.06 | 2.02 | 2.24 | 2.10 |
| ORB | 0.40 | 0.61 | 0.55 | 0.51 | 0.57 |
| DRB | 2.10 | 2.80 | 2.70 | 2.75 | 2.65 |
| REB | 2.40 | 3.41 | 3.25 | 3.26 | 3.22 |
| AST | 2.00 | 2.53 | 2.47 | 2.37 | 2.56 |
| STL | 0.70 | 0.61 | 0.57 | 0.59 | 0.54 |
| BLK | 0.30 | 0.32 | 0.34 | 0.29 | 0.28 |
| TOV | 1.60 | 2.23 | 2.01 | 2.28 | 2.01 |
| PF | 2.30 | 2.18 | 2.24 | 2.44 | 2.19 |
| FG% | 44.3% | 42.7% | 42.9% | 43.7% | 42.6% |
| 3P% | 41.4% | 36.2% | 37.2% | 36.9% | 36.8% |
| FT% | 86.8% | 93.1% | 92.1% | 92.1% | 91.7% |
| TS% | 54.3% | 58.4% | 59.3% | 59.6% | 59.0% |
| eFG% | 51.8% | 54.5% | 55.3% | 55.5% | 54.9% |
| FTA/FGA | 0.13 | 0.19 | 0.20 | 0.20 | 0.21 |
| TOV% | 12.2% | 15.9% | 15.4% | 16.0% | 15.4% |

Actual final minutes before normalization: authored 23.97, AI 23.85.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.63 | 2.31 |
| Rim FGM | 1.69 | 1.37 |
| Paint + mid FGA | 1.32 | 1.05 |
| Paint + mid FGM | 0.52 | 0.45 |
| Corner 3PA | 1.26 | 1.11 |
| Above-break 3PA | 5.74 | 5.64 |
| Catch-and-shoot attempts | 5.57 | 5.15 |
| Pull-up attempts | 1.07 | 1.17 |
| Stepback attempts | 0.82 | 0.77 |
| Fadeaway attempts | 0.03 | 0.02 |

Decision: Original ratings retained. No consistent independent improvement established.

### Kawhi Leonard – Rookie year (2011–12)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6450/stats). 64 games, 39 starts, 24 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.10 | 3.52 | 3.51 | 3.44 | 3.18 |
| 3PM | 0.60 | 0.95 | 0.99 | 0.87 | 0.85 |
| FTM | 1.10 | 1.60 | 1.54 | 1.62 | 1.51 |
| 2P% | 54.3% | 61.9% | 61.3% | 61.0% | 59.0% |
| AST/TOV | 1.57 | 1.20 | 1.49 | 1.32 | 1.22 |
| PTS | 7.90 | 9.59 | 9.56 | 9.38 | 8.72 |
| FGA | 6.30 | 7.08 | 6.98 | 6.87 | 6.76 |
| 3PA | 1.70 | 2.93 | 2.87 | 2.65 | 2.80 |
| FTA | 1.40 | 2.03 | 1.90 | 2.03 | 1.96 |
| ORB | 1.60 | 1.49 | 1.51 | 1.50 | 1.58 |
| DRB | 3.50 | 4.41 | 4.41 | 4.45 | 4.45 |
| REB | 5.10 | 5.90 | 5.93 | 5.95 | 6.03 |
| AST | 1.10 | 1.15 | 1.21 | 1.24 | 1.12 |
| STL | 1.30 | 1.34 | 1.30 | 1.27 | 1.40 |
| BLK | 0.40 | 0.48 | 0.49 | 0.49 | 0.50 |
| TOV | 0.70 | 0.96 | 0.82 | 0.94 | 0.92 |
| PF | 1.40 | 1.65 | 1.56 | 1.61 | 1.63 |
| FG% | 49.3% | 49.7% | 50.3% | 50.2% | 47.1% |
| 3P% | 37.6% | 32.4% | 34.6% | 32.9% | 30.3% |
| FT% | 77.3% | 79.0% | 81.3% | 79.8% | 76.9% |
| TS% | 57.1% | 60.1% | 61.2% | 60.4% | 57.2% |
| eFG% | 54.0% | 56.4% | 57.4% | 56.5% | 53.4% |
| FTA/FGA | 0.22 | 0.29 | 0.27 | 0.30 | 0.29 |
| TOV% | 9.2% | 10.7% | 9.5% | 10.8% | 10.8% |

Actual final minutes before normalization: authored 23.20, AI 23.70.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.79 | 2.67 |
| Rim FGM | 1.94 | 1.82 |
| Paint + mid FGA | 1.43 | 1.28 |
| Paint + mid FGM | 0.63 | 0.51 |
| Corner 3PA | 0.69 | 0.75 |
| Above-break 3PA | 1.96 | 2.06 |
| Catch-and-shoot attempts | 2.17 | 2.39 |
| Pull-up attempts | 0.71 | 0.63 |
| Stepback attempts | 0.23 | 0.20 |
| Fadeaway attempts | 0.11 | 0.09 |

Decision: Original ratings retained. tpa: material regression; ft: previously within tolerance

### Dwight Howard – Rookie year (2004–05)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2384/stats). 82 games, 82 starts, 32.6 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 4.30 | 6.17 | 6.62 | 4.71 | 5.24 |
| 3PM | 0.00 | 0.00 | 0.01 | 0.01 | 0.01 |
| FTM | 3.40 | 5.59 | 5.30 | 3.07 | 3.72 |
| 2P% | 51.8% | 65.9% | 68.8% | 64.1% | 64.9% |
| AST/TOV | 0.45 | 0.57 | 0.51 | 0.88 | 0.75 |
| PTS | 12.00 | 17.93 | 18.55 | 12.50 | 14.21 |
| FGA | 8.30 | 9.38 | 9.66 | 7.38 | 8.10 |
| 3PA | 0.00 | 0.03 | 0.05 | 0.04 | 0.04 |
| FTA | 5.00 | 7.54 | 7.20 | 4.67 | 5.68 |
| ORB | 3.50 | 3.61 | 3.84 | 4.00 | 3.82 |
| DRB | 6.50 | 7.30 | 7.60 | 7.50 | 7.19 |
| REB | 10.00 | 10.91 | 11.45 | 11.50 | 11.00 |
| AST | 0.90 | 1.20 | 1.15 | 1.25 | 1.13 |
| STL | 0.90 | 0.92 | 0.77 | 0.83 | 0.95 |
| BLK | 1.70 | 1.97 | 1.96 | 1.84 | 1.75 |
| TOV | 2.00 | 2.11 | 2.23 | 1.42 | 1.51 |
| PF | 2.80 | 2.53 | 2.62 | 2.63 | 2.50 |
| FG% | 52.0% | 65.7% | 68.5% | 63.9% | 64.7% |
| 3P% | 0.0% | 0.0% | 12.5% | 18.2% | 27.3% |
| FT% | 67.1% | 74.2% | 73.6% | 65.7% | 65.5% |
| TS% | 57.1% | 70.6% | 72.3% | 66.2% | 67.0% |
| eFG% | 51.8% | 65.7% | 68.5% | 63.9% | 64.8% |
| FTA/FGA | 0.60 | 0.80 | 0.75 | 0.63 | 0.70 |
| TOV% | 16.0% | 14.2% | 14.8% | 13.1% | 12.4% |

Actual final minutes before normalization: authored 31.82, AI 31.50.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 5.63 | 6.61 |
| Rim FGM | 4.01 | 4.69 |
| Paint + mid FGA | 1.71 | 1.46 |
| Paint + mid FGM | 0.70 | 0.53 |
| Corner 3PA | 0.00 | 0.00 |
| Above-break 3PA | 0.03 | 0.03 |
| Catch-and-shoot attempts | 0.03 | 0.03 |
| Pull-up attempts | 0.02 | 0.01 |
| Stepback attempts | 0.00 | 0.00 |
| Fadeaway attempts | 0.04 | 0.03 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### John Wall – Rookie year (2010–11)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4237/stats). 69 games, 64 starts, 37.8 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 5.80 | 7.77 | 6.25 | 7.50 | 6.60 |
| 3PM | 0.50 | 0.33 | 0.28 | 0.37 | 0.78 |
| FTM | 4.40 | 4.67 | 3.79 | 4.31 | 4.40 |
| 2P% | 42.7% | 49.3% | 46.7% | 48.7% | 51.1% |
| AST/TOV | 2.18 | 2.14 | 2.40 | 2.34 | 2.54 |
| PTS | 16.40 | 20.54 | 16.56 | 19.67 | 18.38 |
| FGA | 14.10 | 16.56 | 14.14 | 16.13 | 14.62 |
| 3PA | 1.70 | 1.45 | 1.35 | 1.48 | 3.20 |
| FTA | 5.70 | 5.87 | 4.77 | 5.37 | 5.50 |
| ORB | 0.50 | 1.07 | 0.97 | 0.98 | 0.86 |
| DRB | 4.10 | 4.87 | 4.85 | 4.69 | 4.61 |
| REB | 4.60 | 5.94 | 5.82 | 5.67 | 5.48 |
| AST | 8.30 | 8.86 | 9.41 | 9.03 | 9.27 |
| STL | 1.80 | 1.97 | 1.79 | 1.70 | 1.88 |
| BLK | 0.50 | 0.82 | 0.84 | 0.78 | 0.78 |
| TOV | 3.80 | 4.13 | 3.93 | 3.86 | 3.65 |
| PF | 2.50 | 3.51 | 3.76 | 3.72 | 3.60 |
| FG% | 40.9% | 46.9% | 44.2% | 46.5% | 45.2% |
| 3P% | 29.6% | 22.4% | 20.6% | 25.1% | 24.3% |
| FT% | 76.6% | 79.6% | 79.4% | 80.2% | 80.0% |
| TS% | 49.4% | 53.6% | 51.0% | 53.2% | 54.0% |
| eFG% | 42.9% | 47.9% | 45.2% | 47.7% | 47.8% |
| FTA/FGA | 0.40 | 0.35 | 0.34 | 0.33 | 0.38 |
| TOV% | 18.6% | 17.8% | 19.5% | 17.3% | 17.6% |

Actual final minutes before normalization: authored 35.61, AI 35.18.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 9.75 | 8.65 |
| Rim FGM | 5.50 | 4.84 |
| Paint + mid FGA | 4.90 | 2.77 |
| Paint + mid FGM | 1.62 | 0.99 |
| Corner 3PA | 0.15 | 0.05 |
| Above-break 3PA | 1.33 | 3.15 |
| Catch-and-shoot attempts | 0.17 | 0.16 |
| Pull-up attempts | 1.60 | 2.11 |
| Stepback attempts | 1.15 | 1.73 |
| Fadeaway attempts | 0.01 | 0.02 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Yi Jianlian – Rookie year (2007–08)

Historical source: [NBA season](https://www.basketball-reference.com/players/j/jianlyi01.html). 66 games, 49 starts, 25 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.30 | 4.23 | 4.23 | 4.42 | 4.42 |
| 3PM | 0.10 | 0.15 | 0.15 | 0.14 | 0.14 |
| FTM | 1.80 | 1.59 | 1.59 | 1.69 | 1.69 |
| 2P% | 42.1% | 52.1% | 52.1% | 53.8% | 53.8% |
| AST/TOV | 0.57 | 0.91 | 0.91 | 0.92 | 0.92 |
| PTS | 8.60 | 10.19 | 10.19 | 10.67 | 10.67 |
| FGA | 7.90 | 8.34 | 8.34 | 8.48 | 8.48 |
| 3PA | 0.30 | 0.52 | 0.52 | 0.52 | 0.52 |
| FTA | 2.20 | 1.74 | 1.74 | 1.88 | 1.88 |
| ORB | 1.60 | 2.21 | 2.21 | 1.97 | 1.97 |
| DRB | 3.60 | 3.62 | 3.62 | 3.80 | 3.80 |
| REB | 5.20 | 5.83 | 5.83 | 5.77 | 5.77 |
| AST | 0.80 | 1.19 | 1.19 | 1.15 | 1.15 |
| STL | 0.50 | 0.44 | 0.44 | 0.41 | 0.41 |
| BLK | 0.80 | 0.65 | 0.65 | 0.61 | 0.61 |
| TOV | 1.40 | 1.30 | 1.30 | 1.24 | 1.24 |
| PF | 2.30 | 2.49 | 2.49 | 2.50 | 2.50 |
| FG% | 42.1% | 50.7% | 50.7% | 52.2% | 52.2% |
| 3P% | 28.6% | 29.5% | 29.5% | 26.8% | 26.8% |
| FT% | 84.1% | 91.2% | 91.2% | 89.9% | 89.9% |
| TS% | 48.5% | 56.0% | 56.0% | 57.3% | 57.3% |
| eFG% | 42.4% | 51.6% | 51.6% | 53.0% | 53.0% |
| FTA/FGA | 0.28 | 0.21 | 0.21 | 0.22 | 0.22 |
| TOV% | 13.6% | 12.5% | 12.5% | 11.8% | 11.8% |

Actual final minutes before normalization: authored 26.71, AI 26.71.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.86 | 2.86 |
| Rim FGM | 1.79 | 1.79 |
| Paint + mid FGA | 5.09 | 5.09 |
| Paint + mid FGM | 2.49 | 2.49 |
| Corner 3PA | 0.10 | 0.10 |
| Above-break 3PA | 0.42 | 0.42 |
| Catch-and-shoot attempts | 0.84 | 0.84 |
| Pull-up attempts | 1.47 | 1.47 |
| Stepback attempts | 0.58 | 0.58 |
| Fadeaway attempts | 2.17 | 2.17 |

Decision: Original ratings retained. fta: previously within tolerance

### Andrei Kirilenko – Rookie year (2001–02)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/434/stats). 82 games, 40 starts, 26.2 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.50 | 3.21 | 3.30 | 3.14 | 3.00 |
| 3PM | 0.30 | 0.52 | 0.55 | 0.44 | 0.47 |
| FTM | 3.50 | 1.75 | 1.67 | 1.72 | 1.83 |
| 2P% | 49.2% | 60.9% | 60.6% | 58.8% | 60.3% |
| AST/TOV | 0.85 | 1.18 | 1.34 | 1.33 | 1.58 |
| PTS | 10.70 | 8.70 | 8.81 | 8.44 | 8.29 |
| FGA | 7.70 | 6.17 | 6.28 | 6.14 | 5.75 |
| 3PA | 1.20 | 1.74 | 1.74 | 1.54 | 1.55 |
| FTA | 4.50 | 2.05 | 2.01 | 2.02 | 2.17 |
| ORB | 1.80 | 1.15 | 1.05 | 1.01 | 1.08 |
| DRB | 3.10 | 3.59 | 3.73 | 3.58 | 3.42 |
| REB | 4.90 | 4.74 | 4.78 | 4.59 | 4.50 |
| AST | 1.10 | 0.99 | 1.00 | 1.09 | 1.17 |
| STL | 1.40 | 1.09 | 0.99 | 1.03 | 0.98 |
| BLK | 1.90 | 1.80 | 1.93 | 1.98 | 2.16 |
| TOV | 1.30 | 0.84 | 0.75 | 0.82 | 0.74 |
| PF | 1.90 | 1.14 | 1.09 | 1.07 | 1.11 |
| FG% | 45.0% | 52.1% | 52.5% | 51.2% | 52.1% |
| 3P% | 25.0% | 30.0% | 31.6% | 28.6% | 30.0% |
| FT% | 76.8% | 85.6% | 82.7% | 85.2% | 84.6% |
| TS% | 55.3% | 61.6% | 61.5% | 60.1% | 61.9% |
| eFG% | 47.4% | 56.4% | 56.9% | 54.8% | 56.2% |
| FTA/FGA | 0.58 | 0.33 | 0.32 | 0.33 | 0.38 |
| TOV% | 11.8% | 10.6% | 9.4% | 10.4% | 9.9% |

Actual final minutes before normalization: authored 26.55, AI 26.67.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 3.77 | 3.33 |
| Rim FGM | 2.45 | 2.20 |
| Paint + mid FGA | 0.82 | 0.86 |
| Paint + mid FGM | 0.25 | 0.33 |
| Corner 3PA | 0.41 | 0.48 |
| Above-break 3PA | 1.13 | 1.06 |
| Catch-and-shoot attempts | 1.19 | 1.23 |
| Pull-up attempts | 0.32 | 0.26 |
| Stepback attempts | 0.17 | 0.20 |
| Fadeaway attempts | 0.02 | 0.01 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in ins, dnk, lay

### Jeremy Lin – Rookie year (2010–11)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4299/stats). 29 games, 0 starts, 9.8 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 1.00 | 1.14 | 1.07 | 1.14 | 1.11 |
| 3PM | 0.00 | 0.10 | 0.13 | 0.12 | 0.16 |
| FTM | 0.70 | 0.37 | 0.38 | 0.39 | 0.46 |
| 2P% | 43.5% | 47.6% | 49.4% | 48.8% | 48.9% |
| AST/TOV | 2.33 | 1.99 | 2.85 | 2.39 | 3.01 |
| PTS | 2.60 | 2.74 | 2.64 | 2.80 | 2.83 |
| FGA | 2.50 | 2.64 | 2.36 | 2.56 | 2.42 |
| 3PA | 0.20 | 0.45 | 0.45 | 0.46 | 0.49 |
| FTA | 0.90 | 0.51 | 0.49 | 0.51 | 0.58 |
| ORB | 0.40 | 0.10 | 0.10 | 0.13 | 0.17 |
| DRB | 0.80 | 0.77 | 0.77 | 0.75 | 0.75 |
| REB | 1.20 | 0.87 | 0.87 | 0.88 | 0.92 |
| AST | 1.40 | 1.12 | 1.36 | 1.34 | 1.27 |
| STL | 1.10 | 0.65 | 0.53 | 0.62 | 0.48 |
| BLK | 0.30 | 0.14 | 0.20 | 0.19 | 0.20 |
| TOV | 0.60 | 0.56 | 0.48 | 0.56 | 0.42 |
| PF | 1.10 | 0.74 | 0.74 | 0.82 | 0.74 |
| FG% | 38.9% | 43.1% | 45.2% | 44.7% | 45.6% |
| 3P% | 20.0% | 21.4% | 27.7% | 25.8% | 32.4% |
| FT% | 76.0% | 71.8% | 78.6% | 76.9% | 78.2% |
| TS% | 44.9% | 47.8% | 51.3% | 50.3% | 52.7% |
| eFG% | 40.0% | 44.9% | 47.9% | 47.0% | 48.9% |
| FTA/FGA | 0.36 | 0.19 | 0.21 | 0.20 | 0.24 |
| TOV% | 17.2% | 16.4% | 15.6% | 16.7% | 13.6% |

Actual final minutes before normalization: authored 9.40, AI 9.51.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 1.37 | 1.26 |
| Rim FGM | 0.74 | 0.64 |
| Paint + mid FGA | 0.73 | 0.67 |
| Paint + mid FGM | 0.28 | 0.31 |
| Corner 3PA | 0.04 | 0.02 |
| Above-break 3PA | 0.42 | 0.46 |
| Catch-and-shoot attempts | 0.22 | 0.22 |
| Pull-up attempts | 0.33 | 0.32 |
| Stepback attempts | 0.31 | 0.32 |
| Fadeaway attempts | 0.03 | 0.03 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in ins, dnk, lay

### Toney Douglas – Rookie year (2009–10)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3979/stats). 56 games, 12 starts, 19.4 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.20 | 3.52 | 3.40 | 3.55 | 3.44 |
| 3PM | 1.20 | 1.45 | 1.42 | 1.41 | 1.48 |
| FTM | 1.00 | 1.71 | 1.60 | 1.57 | 1.39 |
| 2P% | 51.3% | 52.0% | 52.0% | 52.8% | 51.4% |
| AST/TOV | 2.00 | 1.70 | 2.07 | 1.88 | 1.94 |
| PTS | 8.60 | 10.19 | 9.82 | 10.08 | 9.74 |
| FGA | 7.00 | 7.70 | 7.39 | 7.88 | 7.61 |
| 3PA | 3.10 | 3.72 | 3.57 | 3.84 | 3.80 |
| FTA | 1.20 | 2.13 | 2.01 | 2.02 | 1.74 |
| ORB | 0.70 | 0.29 | 0.21 | 0.24 | 0.29 |
| DRB | 1.20 | 1.49 | 1.47 | 1.65 | 1.61 |
| REB | 1.90 | 1.78 | 1.68 | 1.89 | 1.90 |
| AST | 2.00 | 2.64 | 2.70 | 2.63 | 2.46 |
| STL | 0.80 | 1.04 | 1.10 | 1.08 | 1.07 |
| BLK | 0.10 | 0.19 | 0.23 | 0.19 | 0.23 |
| TOV | 1.00 | 1.55 | 1.30 | 1.40 | 1.27 |
| PF | 2.10 | 1.43 | 1.31 | 1.34 | 1.35 |
| FG% | 45.8% | 45.7% | 46.0% | 45.0% | 45.2% |
| 3P% | 38.9% | 38.9% | 39.6% | 36.7% | 38.9% |
| FT% | 80.9% | 80.0% | 79.9% | 77.8% | 79.6% |
| TS% | 57.1% | 59.0% | 59.3% | 57.4% | 58.1% |
| eFG% | 54.3% | 55.1% | 55.6% | 53.9% | 54.8% |
| FTA/FGA | 0.17 | 0.28 | 0.27 | 0.26 | 0.23 |
| TOV% | 11.7% | 15.2% | 13.6% | 13.8% | 13.1% |

Actual final minutes before normalization: authored 17.48, AI 17.44.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 1.76 | 1.64 |
| Rim FGM | 1.11 | 0.95 |
| Paint + mid FGA | 2.28 | 2.18 |
| Paint + mid FGM | 1.03 | 1.02 |
| Corner 3PA | 0.84 | 0.83 |
| Above-break 3PA | 3.00 | 2.96 |
| Catch-and-shoot attempts | 3.60 | 3.47 |
| Pull-up attempts | 1.17 | 1.20 |
| Stepback attempts | 0.46 | 0.41 |
| Fadeaway attempts | 0.13 | 0.17 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in stl

### Jan Veselý – Rookie year (2011–12)

Historical source: [NBA season](https://www.basketball-reference.com/players/v/veselja01.html). 57 games, 20 starts, 18.9 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 2.10 | 2.28 | 2.14 | 2.28 | 2.22 |
| 3PM | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| FTM | 0.60 | 0.78 | 0.71 | 0.53 | 0.61 |
| 2P% | 55.5% | 60.8% | 63.3% | 63.5% | 62.5% |
| AST/TOV | 0.73 | 1.42 | 1.31 | 1.45 | 1.52 |
| PTS | 4.70 | 5.35 | 4.99 | 5.09 | 5.05 |
| FGA | 3.80 | 3.78 | 3.40 | 3.61 | 3.56 |
| 3PA | 0.02 | 0.04 | 0.01 | 0.03 | 0.02 |
| FTA | 1.10 | 1.52 | 1.24 | 1.04 | 1.12 |
| ORB | 1.80 | 1.77 | 1.62 | 1.64 | 1.60 |
| DRB | 2.60 | 2.99 | 3.10 | 2.91 | 3.21 |
| REB | 4.40 | 4.76 | 4.73 | 4.55 | 4.81 |
| AST | 0.80 | 0.80 | 0.74 | 0.77 | 0.70 |
| STL | 0.70 | 0.80 | 0.76 | 0.84 | 0.78 |
| BLK | 0.60 | 0.75 | 0.87 | 0.79 | 0.85 |
| TOV | 1.10 | 0.57 | 0.57 | 0.53 | 0.46 |
| PF | 2.70 | 1.47 | 1.40 | 1.55 | 1.34 |
| FG% | 53.7% | 60.3% | 63.1% | 63.0% | 62.3% |
| 3P% | 0.0% | 10.0% | 0.0% | 11.1% | 20.0% |
| FT% | 53.2% | 51.5% | 57.2% | 51.2% | 54.4% |
| TS% | 54.9% | 60.1% | 63.3% | 62.5% | 62.3% |
| eFG% | 55.3% | 60.3% | 63.1% | 63.0% | 62.3% |
| FTA/FGA | 0.29 | 0.40 | 0.36 | 0.29 | 0.31 |
| TOV% | 20.4% | 11.3% | 12.5% | 11.6% | 10.2% |

Actual final minutes before normalization: authored 17.11, AI 17.20.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.95 | 3.13 |
| Rim FGM | 2.02 | 2.07 |
| Paint + mid FGA | 0.63 | 0.42 |
| Paint + mid FGM | 0.25 | 0.15 |
| Corner 3PA | 0.00 | 0.00 |
| Above-break 3PA | 0.03 | 0.01 |
| Catch-and-shoot attempts | 0.03 | 0.01 |
| Pull-up attempts | 0.03 | 0.01 |
| Stepback attempts | 0.01 | 0.01 |
| Fadeaway attempts | 0.10 | 0.03 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in ins, dnk, lay

### Bismack Biyombo – Rookie year (2011–12)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/6427/stats). 63 games, 41 starts, 23.1 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 2.00 | 2.07 | 2.04 | 2.09 | 1.98 |
| 3PM | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| FTM | 1.10 | 0.60 | 0.53 | 0.61 | 0.57 |
| 2P% | 45.5% | 63.8% | 63.0% | 63.5% | 62.1% |
| AST/TOV | 0.36 | 3.06 | 3.41 | 2.93 | 3.53 |
| PTS | 5.20 | 4.74 | 4.60 | 4.79 | 4.54 |
| FGA | 4.40 | 3.27 | 3.26 | 3.30 | 3.20 |
| 3PA | 0.00 | 0.03 | 0.03 | 0.01 | 0.02 |
| FTA | 2.30 | 1.40 | 1.30 | 1.42 | 1.38 |
| ORB | 1.80 | 1.36 | 1.39 | 1.29 | 1.44 |
| DRB | 4.00 | 2.47 | 2.50 | 2.53 | 2.60 |
| REB | 5.80 | 3.83 | 3.88 | 3.82 | 4.04 |
| AST | 0.40 | 0.77 | 0.82 | 0.92 | 0.87 |
| STL | 0.30 | 0.35 | 0.32 | 0.32 | 0.37 |
| BLK | 1.80 | 2.20 | 2.23 | 2.28 | 2.16 |
| TOV | 1.10 | 0.25 | 0.24 | 0.31 | 0.25 |
| PF | 2.30 | 1.33 | 1.41 | 1.35 | 1.28 |
| FG% | 46.4% | 63.2% | 62.5% | 63.3% | 61.9% |
| 3P% | 0.0% | 10.0% | 0.0% | 0.0% | 20.0% |
| FT% | 48.3% | 42.8% | 40.8% | 43.2% | 41.5% |
| TS% | 48.0% | 61.0% | 60.1% | 61.0% | 59.6% |
| eFG% | 45.5% | 63.3% | 62.5% | 63.3% | 61.9% |
| FTA/FGA | 0.52 | 0.43 | 0.40 | 0.43 | 0.43 |
| TOV% | 16.9% | 6.1% | 5.9% | 7.4% | 6.1% |

Actual final minutes before normalization: authored 23.28, AI 23.34.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.88 | 2.78 |
| Rim FGM | 1.92 | 1.81 |
| Paint + mid FGA | 0.42 | 0.41 |
| Paint + mid FGM | 0.17 | 0.16 |
| Corner 3PA | 0.00 | 0.00 |
| Above-break 3PA | 0.01 | 0.02 |
| Catch-and-shoot attempts | 0.01 | 0.01 |
| Pull-up attempts | 0.01 | 0.00 |
| Stepback attempts | 0.01 | 0.00 |
| Fadeaway attempts | 0.02 | 0.01 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in ins, dnk, lay, blk, reb

### Bronny James – Rookie year (2024–25)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4683774/stats). 27 games, 1 starts, 6.7 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 0.80 | 0.62 | 0.60 | 0.55 | 0.50 |
| 3PM | 0.30 | 0.25 | 0.26 | 0.27 | 0.27 |
| FTM | 0.40 | 0.14 | 0.20 | 0.24 | 0.17 |
| 2P% | 38.5% | 63.4% | 57.7% | 47.9% | 43.0% |
| AST/TOV | 1.60 | 4.36 | 4.51 | 4.42 | 3.69 |
| PTS | 2.30 | 1.64 | 1.67 | 1.61 | 1.44 |
| FGA | 2.50 | 1.40 | 1.43 | 1.48 | 1.39 |
| 3PA | 1.20 | 0.82 | 0.85 | 0.89 | 0.84 |
| FTA | 0.50 | 0.21 | 0.26 | 0.31 | 0.22 |
| ORB | 0.10 | 0.08 | 0.08 | 0.11 | 0.12 |
| DRB | 0.50 | 0.56 | 0.54 | 0.57 | 0.54 |
| REB | 0.70 | 0.64 | 0.62 | 0.67 | 0.65 |
| AST | 0.80 | 0.80 | 0.88 | 0.90 | 0.79 |
| STL | 0.30 | 0.22 | 0.22 | 0.31 | 0.20 |
| BLK | 0.10 | 0.11 | 0.10 | 0.11 | 0.09 |
| TOV | 0.50 | 0.18 | 0.20 | 0.20 | 0.21 |
| PF | 0.50 | 0.48 | 0.49 | 0.52 | 0.50 |
| FG% | 31.3% | 44.3% | 41.9% | 37.3% | 36.0% |
| 3P% | 28.1% | 30.9% | 31.0% | 30.2% | 31.5% |
| FT% | 78.6% | 68.2% | 79.5% | 76.2% | 79.2% |
| TS% | 42.3% | 54.9% | 54.0% | 49.8% | 48.5% |
| eFG% | 38.0% | 53.4% | 51.1% | 46.4% | 45.6% |
| FTA/FGA | 0.20 | 0.15 | 0.18 | 0.21 | 0.16 |
| TOV% | 15.5% | 11.0% | 11.2% | 11.2% | 12.6% |

Actual final minutes before normalization: authored 7.23, AI 7.32.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 0.46 | 0.44 |
| Rim FGM | 0.25 | 0.20 |
| Paint + mid FGA | 0.13 | 0.11 |
| Paint + mid FGM | 0.04 | 0.03 |
| Corner 3PA | 0.13 | 0.11 |
| Above-break 3PA | 0.76 | 0.74 |
| Catch-and-shoot attempts | 0.61 | 0.60 |
| Pull-up attempts | 0.20 | 0.16 |
| Stepback attempts | 0.13 | 0.12 |
| Fadeaway attempts | 0.00 | 0.01 |

Decision: Original ratings retained. No consistent independent improvement established.

### Jarrett Culver – Rookie year (2019–20)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4277928/stats). 63 games, 35 starts, 23.9 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.70 | 3.54 | 3.32 | 3.55 | 3.23 |
| 3PM | 1.00 | 1.50 | 1.28 | 1.44 | 1.37 |
| FTM | 0.90 | 0.83 | 0.82 | 0.92 | 0.76 |
| 2P% | 49.1% | 56.4% | 59.3% | 59.1% | 55.5% |
| AST/TOV | 1.31 | 1.97 | 2.33 | 2.06 | 2.41 |
| PTS | 9.20 | 9.42 | 8.75 | 9.46 | 8.60 |
| FGA | 9.00 | 7.67 | 7.04 | 7.40 | 7.08 |
| 3PA | 3.50 | 4.05 | 3.59 | 3.82 | 3.72 |
| FTA | 1.90 | 1.72 | 1.81 | 1.75 | 1.63 |
| ORB | 1.10 | 0.79 | 0.84 | 0.82 | 0.75 |
| DRB | 2.30 | 2.50 | 2.49 | 2.64 | 2.48 |
| REB | 3.40 | 3.29 | 3.34 | 3.46 | 3.24 |
| AST | 1.70 | 1.62 | 1.62 | 1.85 | 1.78 |
| STL | 0.90 | 0.60 | 0.65 | 0.63 | 0.63 |
| BLK | 0.60 | 0.49 | 0.59 | 0.62 | 0.53 |
| TOV | 1.30 | 0.82 | 0.69 | 0.90 | 0.74 |
| PF | 2.00 | 1.74 | 1.74 | 1.64 | 1.70 |
| FG% | 40.4% | 46.2% | 47.2% | 48.0% | 45.7% |
| 3P% | 29.9% | 37.1% | 35.6% | 37.7% | 36.9% |
| FT% | 46.2% | 48.2% | 45.4% | 52.5% | 46.6% |
| TS% | 46.8% | 55.9% | 55.8% | 57.9% | 55.2% |
| eFG% | 46.7% | 56.0% | 56.3% | 57.7% | 55.4% |
| FTA/FGA | 0.21 | 0.22 | 0.26 | 0.24 | 0.23 |
| TOV% | 11.7% | 8.9% | 8.1% | 9.9% | 8.7% |

Actual final minutes before normalization: authored 23.14, AI 23.26.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 2.65 | 2.47 |
| Rim FGM | 1.71 | 1.51 |
| Paint + mid FGA | 0.93 | 0.88 |
| Paint + mid FGM | 0.40 | 0.35 |
| Corner 3PA | 1.11 | 1.13 |
| Above-break 3PA | 2.72 | 2.59 |
| Catch-and-shoot attempts | 2.52 | 2.53 |
| Pull-up attempts | 1.26 | 1.19 |
| Stepback attempts | 0.49 | 0.48 |
| Fadeaway attempts | 0.06 | 0.04 |

Decision: Original ratings retained. Skill plausibility guardrail: over 18 points in ins, dnk, lay

### Jarred Vanderbilt – 2022–23

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4278077/stats). 78 games, 65 starts, 24.1 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.20 | 3.36 | 3.87 | 3.49 | 3.71 |
| 3PM | 0.40 | 0.48 | 0.65 | 0.48 | 0.57 |
| FTM | 1.20 | 1.61 | 1.56 | 1.51 | 1.37 |
| 2P% | 60.9% | 56.2% | 64.1% | 58.8% | 62.3% |
| AST/TOV | 2.00 | 2.79 | 2.73 | 2.92 | 2.91 |
| PTS | 7.90 | 8.81 | 9.96 | 8.96 | 9.36 |
| FGA | 5.80 | 6.44 | 6.79 | 6.44 | 6.71 |
| 3PA | 1.20 | 1.31 | 1.77 | 1.33 | 1.67 |
| FTA | 1.80 | 2.18 | 2.19 | 2.12 | 1.98 |
| ORB | 2.20 | 3.09 | 3.09 | 2.91 | 2.91 |
| DRB | 5.30 | 5.66 | 5.64 | 5.62 | 5.33 |
| REB | 7.50 | 8.75 | 8.73 | 8.53 | 8.24 |
| AST | 2.40 | 2.50 | 2.36 | 2.51 | 2.46 |
| STL | 1.10 | 0.98 | 0.95 | 0.95 | 0.93 |
| BLK | 0.30 | 0.41 | 0.37 | 0.39 | 0.31 |
| TOV | 1.20 | 0.89 | 0.86 | 0.86 | 0.85 |
| PF | 2.40 | 1.49 | 1.50 | 1.41 | 1.40 |
| FG% | 54.8% | 52.2% | 57.1% | 54.1% | 55.2% |
| 3P% | 32.2% | 36.6% | 37.0% | 36.0% | 34.1% |
| FT% | 69.1% | 73.9% | 71.2% | 71.3% | 69.5% |
| TS% | 59.9% | 59.6% | 64.3% | 60.8% | 61.7% |
| eFG% | 58.6% | 55.9% | 61.9% | 57.8% | 59.5% |
| FTA/FGA | 0.31 | 0.34 | 0.32 | 0.33 | 0.29 |
| TOV% | 15.4% | 10.8% | 10.0% | 10.4% | 10.0% |

Actual final minutes before normalization: authored 23.51, AI 23.62.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 3.08 | 4.08 |
| Rim FGM | 2.13 | 2.73 |
| Paint + mid FGA | 2.03 | 0.96 |
| Paint + mid FGM | 0.88 | 0.40 |
| Corner 3PA | 1.19 | 0.41 |
| Above-break 3PA | 0.14 | 1.26 |
| Catch-and-shoot attempts | 1.46 | 1.53 |
| Pull-up attempts | 0.06 | 0.17 |
| Stepback attempts | 0.00 | 0.05 |
| Fadeaway attempts | 0.04 | 0.01 |

Decision: Original ratings retained. Final independent regression in tov

### Maxi Kleber – Prime (2019–20)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/2960236/stats). 74 games, 21 starts, 25.5 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 3.20 | 3.22 | 3.92 | 2.61 | 3.20 |
| 3PM | 1.60 | 1.92 | 2.47 | 1.47 | 1.80 |
| FTM | 1.10 | 1.11 | 1.65 | 0.86 | 1.33 |
| 2P% | 61.5% | 58.4% | 55.2% | 60.4% | 56.3% |
| AST/TOV | 1.50 | 1.44 | 0.85 | 2.05 | 1.30 |
| PTS | 9.10 | 9.48 | 11.95 | 7.54 | 9.53 |
| FGA | 6.90 | 6.81 | 8.59 | 5.47 | 7.17 |
| 3PA | 4.30 | 4.59 | 5.97 | 3.59 | 4.67 |
| FTA | 1.30 | 1.25 | 1.84 | 1.01 | 1.59 |
| ORB | 1.50 | 2.28 | 2.34 | 2.05 | 1.99 |
| DRB | 3.70 | 4.22 | 4.33 | 3.86 | 3.78 |
| REB | 5.20 | 6.49 | 6.67 | 5.91 | 5.77 |
| AST | 1.20 | 1.24 | 1.19 | 1.20 | 1.23 |
| STL | 0.30 | 0.42 | 0.48 | 0.41 | 0.42 |
| BLK | 1.10 | 1.34 | 1.41 | 1.08 | 1.24 |
| TOV | 0.80 | 0.86 | 1.40 | 0.58 | 0.94 |
| PF | 2.40 | 1.50 | 1.60 | 1.45 | 1.63 |
| FG% | 46.1% | 47.3% | 45.6% | 47.7% | 44.7% |
| 3P% | 37.3% | 41.9% | 41.3% | 41.0% | 38.5% |
| FT% | 84.9% | 89.4% | 89.4% | 84.8% | 83.5% |
| TS% | 60.9% | 64.4% | 63.5% | 63.8% | 60.6% |
| eFG% | 58.0% | 61.4% | 59.9% | 61.1% | 57.2% |
| FTA/FGA | 0.19 | 0.18 | 0.21 | 0.18 | 0.22 |
| TOV% | 9.7% | 10.5% | 12.9% | 9.0% | 10.7% |

Actual final minutes before normalization: authored 27.08, AI 27.17.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 1.46 | 1.46 |
| Rim FGM | 0.93 | 0.94 |
| Paint + mid FGA | 0.42 | 1.04 |
| Paint + mid FGM | 0.21 | 0.46 |
| Corner 3PA | 1.43 | 1.55 |
| Above-break 3PA | 2.15 | 3.12 |
| Catch-and-shoot attempts | 3.55 | 4.77 |
| Pull-up attempts | 0.12 | 0.33 |
| Stepback attempts | 0.00 | 0.03 |
| Fadeaway attempts | 0.02 | 0.11 |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Joel Embiid – Draft night (2014, Kansas)

Historical source: [college season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/67433/stats). 28 games, 20 starts, 23.1 MPG.

| Per 40 minutes | Historical | Original | Final |
|---|---:|---:|---:|
| FGM | 6.58 | 9.12 | 8.44 |
| 3PM | 0.00 | 0.12 | 0.14 |
| FTM | 6.06 | 4.62 | 4.51 |
| 2P% | 64.4% | 67.7% | 64.8% |
| AST/TOV | 0.58 | 0.60 | 0.57 |
| PTS | 19.39 | 22.99 | 21.54 |
| FGA | 10.56 | 13.70 | 13.25 |
| 3PA | 0.35 | 0.40 | 0.44 |
| FTA | 8.83 | 6.64 | 6.57 |
| ORB | 3.98 | 4.27 | 4.24 |
| DRB | 10.04 | 9.37 | 9.35 |
| REB | 14.03 | 13.64 | 13.59 |
| AST | 2.42 | 2.08 | 2.13 |
| STL | 1.56 | 1.82 | 1.55 |
| BLK | 4.50 | 4.40 | 4.54 |
| TOV | 4.16 | 3.47 | 3.74 |
| PF | 5.89 | 2.34 | 2.34 |
| FG% | 62.6% | 66.6% | 63.7% |
| 3P% | 20.0% | 29.9% | 31.1% |
| FT% | 68.5% | 69.6% | 68.7% |
| TS% | 67.1% | 69.1% | 66.7% |
| eFG% | 62.3% | 67.0% | 64.2% |
| FTA/FGA | 0.84 | 0.48 | 0.50 |
| TOV% | 22.3% | 17.3% | 18.8% |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Joel Embiid – Rookie year (2016–17)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3059318/stats). 31 games, 31 starts, 25.4 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 6.50 | 6.80 | 7.01 | 7.11 | 6.78 |
| 3PM | 1.20 | 1.75 | 1.53 | 1.66 | 1.42 |
| FTM | 6.20 | 5.33 | 5.10 | 5.45 | 5.12 |
| 2P% | 50.0% | 60.9% | 61.3% | 62.7% | 61.2% |
| AST/TOV | 0.55 | 0.66 | 0.64 | 0.66 | 0.64 |
| PTS | 20.20 | 20.68 | 20.64 | 21.33 | 20.10 |
| FGA | 13.80 | 13.10 | 12.88 | 13.26 | 12.59 |
| 3PA | 3.20 | 4.81 | 3.94 | 4.57 | 3.83 |
| FTA | 7.90 | 6.48 | 6.19 | 6.67 | 6.12 |
| ORB | 2.00 | 2.95 | 2.69 | 2.71 | 2.75 |
| DRB | 5.90 | 5.66 | 5.71 | 5.84 | 5.55 |
| REB | 7.80 | 8.61 | 8.41 | 8.55 | 8.30 |
| AST | 2.10 | 1.80 | 1.74 | 1.89 | 1.79 |
| STL | 0.90 | 0.80 | 0.84 | 0.83 | 0.89 |
| BLK | 2.50 | 2.17 | 2.23 | 2.30 | 2.43 |
| TOV | 3.80 | 2.73 | 2.74 | 2.86 | 2.80 |
| PF | 3.60 | 1.75 | 1.72 | 1.60 | 1.74 |
| FG% | 46.6% | 51.9% | 54.4% | 53.6% | 53.9% |
| 3P% | 36.7% | 36.4% | 38.7% | 36.3% | 37.1% |
| FT% | 78.3% | 82.3% | 82.4% | 81.6% | 83.5% |
| TS% | 58.5% | 64.8% | 66.1% | 65.8% | 65.7% |
| eFG% | 51.4% | 58.6% | 60.3% | 59.9% | 59.5% |
| FTA/FGA | 0.57 | 0.49 | 0.48 | 0.50 | 0.49 |
| TOV% | 18.0% | 14.6% | 14.9% | 15.0% | 15.5% |

Actual final minutes before normalization: authored 25.97, AI 25.79.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 5.17 | 5.08 |
| Rim FGM | 3.81 | 3.73 |
| Paint + mid FGA | 3.52 | 3.68 |
| Paint + mid FGM | 1.64 | 1.64 |
| Corner 3PA | 1.50 | 1.07 |
| Above-break 3PA | 3.07 | 2.76 |
| Catch-and-shoot attempts | 4.14 | 3.28 |
| Pull-up attempts | 1.33 | 0.92 |
| Stepback attempts | 0.20 | 0.18 |
| Fadeaway attempts | 0.48 | 0.99 |

Decision: Original ratings retained. No consistent independent improvement established.

### Joel Embiid – MVP season (2022–23)

Historical source: [NBA season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/3059318/stats). 66 games, 66 starts, 34.6 MPG.

| Category | Historical | Original authored | Original AI | Final authored | Final AI |
|---|---:|---:|---:|---:|---:|
| FGM | 11.00 | 11.16 | 11.38 | 11.04 | 11.45 |
| 3PM | 1.00 | 1.18 | 0.95 | 1.22 | 1.00 |
| FTM | 10.00 | 8.74 | 8.37 | 8.96 | 8.43 |
| 2P% | 58.5% | 61.5% | 59.5% | 60.4% | 60.3% |
| AST/TOV | 1.24 | 1.09 | 1.15 | 1.15 | 1.12 |
| PTS | 33.10 | 32.24 | 32.09 | 32.26 | 32.32 |
| FGA | 20.10 | 20.12 | 20.52 | 20.14 | 20.26 |
| 3PA | 3.00 | 3.88 | 2.98 | 3.89 | 2.93 |
| FTA | 11.70 | 9.67 | 9.32 | 9.96 | 9.45 |
| ORB | 1.70 | 3.42 | 3.46 | 3.48 | 3.65 |
| DRB | 8.40 | 7.02 | 7.12 | 6.96 | 7.13 |
| REB | 10.20 | 10.45 | 10.58 | 10.44 | 10.78 |
| AST | 4.20 | 4.17 | 4.43 | 4.41 | 4.45 |
| STL | 1.00 | 1.29 | 1.21 | 1.25 | 1.27 |
| BLK | 1.70 | 2.43 | 2.41 | 2.32 | 2.32 |
| TOV | 3.40 | 3.84 | 3.86 | 3.82 | 3.96 |
| PF | 3.10 | 2.25 | 2.26 | 2.26 | 2.28 |
| FG% | 54.8% | 55.5% | 55.5% | 54.8% | 56.5% |
| 3P% | 33.0% | 30.4% | 32.0% | 31.4% | 34.0% |
| FT% | 85.7% | 90.4% | 89.8% | 89.9% | 89.1% |
| TS% | 65.5% | 66.1% | 65.2% | 65.8% | 66.2% |
| eFG% | 57.2% | 58.4% | 57.8% | 57.8% | 59.0% |
| FTA/FGA | 0.58 | 0.48 | 0.45 | 0.49 | 0.47 |
| TOV% | 11.9% | 13.6% | 13.5% | 13.5% | 14.0% |

Actual final minutes before normalization: authored 33.58, AI 33.81.

| Final engine tracking (historical benchmark incomplete) | Authored | AI |
|---|---:|---:|
| Rim FGA | 9.12 | 9.03 |
| Rim FGM | 6.53 | 6.59 |
| Paint + mid FGA | 7.13 | 8.30 |
| Paint + mid FGM | 3.29 | 3.86 |
| Corner 3PA | 1.56 | 0.81 |
| Above-break 3PA | 2.34 | 2.12 |
| Catch-and-shoot attempts | 4.14 | 2.95 |
| Pull-up attempts | 1.76 | 1.18 |
| Stepback attempts | 0.25 | 0.27 |
| Fadeaway attempts | 0.97 | 1.97 |

Decision: Original ratings retained. Final independent regression in pts

### Anthony Bennett – Draft night (2013, UNLV)

Historical source: [college season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/61902/stats). 35 games, 32 starts, 27.1 MPG.

| Per 40 minutes | Historical | Original | Final |
|---|---:|---:|---:|
| FGM | 8.56 | 9.24 | 9.19 |
| 3PM | 1.48 | 1.63 | 1.73 |
| FTM | 5.17 | 4.68 | 4.44 |
| 2P% | 59.3% | 61.6% | 60.9% |
| AST/TOV | 0.53 | 0.61 | 0.51 |
| PTS | 23.76 | 24.79 | 24.56 |
| FGA | 15.94 | 16.51 | 16.67 |
| 3PA | 3.99 | 4.17 | 4.40 |
| FTA | 7.53 | 6.51 | 6.36 |
| ORB | 3.69 | 3.77 | 3.60 |
| DRB | 8.41 | 8.85 | 8.62 |
| REB | 11.96 | 12.62 | 12.22 |
| AST | 1.48 | 2.20 | 1.83 |
| STL | 1.03 | 1.33 | 1.02 |
| BLK | 1.77 | 1.97 | 1.80 |
| TOV | 2.80 | 3.60 | 3.58 |
| PF | 3.39 | 2.63 | 2.63 |
| FG% | 53.3% | 56.0% | 55.2% |
| 3P% | 37.5% | 39.2% | 39.3% |
| FT% | 70.1% | 71.8% | 69.8% |
| TS% | 61.7% | 64.0% | 63.1% |
| eFG% | 58.3% | 60.9% | 60.4% |
| FTA/FGA | 0.47 | 0.39 | 0.38 |
| TOV% | 12.7% | 15.7% | 15.5% |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Tyler Hansbrough – Draft night (2009, North Carolina)

Historical source: [college season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/27018/stats). 34 games, 34 starts, 30.3 MPG.

| Per 40 minutes | Historical | Original | Final |
|---|---:|---:|---:|
| FGM | 8.71 | 9.90 | 10.23 |
| 3PM | 0.40 | 0.35 | 0.49 |
| FTM | 9.64 | 6.58 | 7.50 |
| 2P% | 52.1% | 58.7% | 59.6% |
| AST/TOV | 0.53 | 0.62 | 0.51 |
| PTS | 27.33 | 26.74 | 28.45 |
| FGA | 16.90 | 17.32 | 17.67 |
| 3PA | 0.92 | 1.02 | 1.32 |
| FTA | 11.49 | 7.79 | 8.98 |
| ORB | 3.96 | 3.16 | 3.01 |
| DRB | 6.73 | 7.92 | 7.64 |
| REB | 10.69 | 11.08 | 10.64 |
| AST | 1.32 | 2.29 | 1.91 |
| STL | 1.58 | 1.48 | 1.63 |
| BLK | 0.53 | 0.86 | 0.51 |
| TOV | 2.51 | 3.70 | 3.71 |
| PF | 3.04 | 2.76 | 2.76 |
| FG% | 51.4% | 57.2% | 57.9% |
| 3P% | 39.1% | 33.8% | 37.3% |
| FT% | 84.1% | 84.6% | 83.6% |
| TS% | 62.2% | 64.5% | 65.8% |
| eFG% | 52.7% | 58.2% | 59.3% |
| FTA/FGA | 0.68 | 0.45 | 0.51 |
| TOV% | 10.3% | 15.1% | 14.6% |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

### Blake Griffin – Draft night (2009, Oklahoma)

Historical source: [college season](https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/36259/stats). 35 games, 35 starts, 33.3 MPG.

| Per 40 minutes | Historical | Original | Final |
|---|---:|---:|---:|
| FGM | 10.33 | 11.08 | 11.10 |
| 3PM | 0.12 | 0.11 | 0.19 |
| FTM | 6.61 | 5.18 | 5.31 |
| 2P% | 65.9% | 69.1% | 68.5% |
| AST/TOV | 0.70 | 0.91 | 0.73 |
| PTS | 27.27 | 27.46 | 27.69 |
| FGA | 15.74 | 16.24 | 16.50 |
| 3PA | 0.24 | 0.37 | 0.57 |
| FTA | 11.17 | 8.28 | 8.91 |
| ORB | 4.68 | 5.26 | 4.98 |
| DRB | 12.61 | 9.87 | 9.80 |
| REB | 17.30 | 15.12 | 14.78 |
| AST | 2.76 | 3.00 | 2.68 |
| STL | 1.32 | 1.59 | 1.33 |
| BLK | 1.44 | 1.73 | 1.45 |
| TOV | 3.96 | 3.29 | 3.68 |
| PF | 3.00 | 2.60 | 2.60 |
| FG% | 65.4% | 68.2% | 67.3% |
| 3P% | 37.5% | 30.0% | 32.6% |
| FT% | 59.0% | 62.6% | 59.6% |
| TS% | 66.0% | 69.0% | 67.8% |
| eFG% | 66.0% | 68.6% | 67.8% |
| FTA/FGA | 0.71 | 0.51 | 0.54 |
| TOV% | 16.1% | 14.2% | 15.3% |

Decision: Retuned; improved the independent combined fit and passed the guardrails.

## Save behavior and verification

Applying a card records its preset variant. Older carriers are compared against all variants/build history, including the current build as a no-op candidate. This prevents the draft, rookie and MVP Embiid cards being mistaken for each other. Retunes preserve growth, custom playing styles and custom library edits; untouched authored styles receive the updated usage/free-throw settings. Generic players without a recorded card name are skipped. Save cardV is now 4.

An application defect was also found: if rounded overall equaled potential but exact overall was higher, the potential cap could remove skill points when applying a card (observed on Culver). Application now floors potential at the ceiling of exact overall so the skills survive. Culver’s final production output includes this correction. Future development and peak potential were not fitted.

Executable checks cover every card’s application, variant recognition, old library upgrades, custom edits, migration idempotence, preserved growth, untouched generic players and preserved manual playing styles. TypeScript, the production build and the earlier trading/contract/postseason regression suite are checked separately.

## Reproduction

Use Node 24+ from the repository root. Run node .review/test-card-migrations.mjs; node .review/test-player-cards.mjs (archived original builds); node .review/test-player-cards.mjs --current 0 24 (production builds); and node .review/regressions.mjs. The small Culver application correction applies to both simulation commands on current code; committed results preserve the measured pre-fix original baseline.

Historical targets and links: .review/card-targets.json. Original snapshots: card-manifest.json. Compact measured results: card-results-summary.json. Independent accepted/rejected comparisons: card-selected-fits.json. Full raw runs, downloaded source data and temporary toolchains are local generated artifacts. To regenerate this report after simulations, run node .review/summarize-card-results.mjs and node .review/report-player-cards.mjs.

Next engine work: rim finishing versus shot difficulty, low-usage-big turnover rates, college free-throw/foul volume and historical era/team context, with league-wide checks. Full-career, defensive-impact and shot-chart validation remain necessary before claiming accuracy in all categories.

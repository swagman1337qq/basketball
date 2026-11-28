# Player-card review — November 27, 2026

Reviewed all 33 built-in presets, the three previously supplied Charles Barkley seasons, and Michael Kidd-Gilchrist’s rookie card. 26 revised builds improved the independent comparison; 11 retain their previous stronger builds. 29 modern NBA shot charts reconcile to their season FG/FGA/3PA totals. Griffin’s and KJ Simpson’s separate college builds were tested separately.

## Independent accuracy checks

NBA validation uses six generated worlds, 80 games in each world with each of two playing-style modes (Luka’s follow-up uses 100): authored and AI-refreshed. Before and proposed builds face the same worlds and seeds. Opponents rotate and home/away alternates. The training worlds and seeds are separate. The score weighs counting rates, shooting percentages, source shot locations and supported named jumper types. Smaller is better. Changes require at least a 2% overall score improvement, no major regression in an already-close category, and aggregate box-score error within 10% plus 0.05 normalized units of the previous build. Luka is the one explicit exception: his old height rating was 73 despite a 6′7″ listing. The corrected height-50 follow-up substantially improves shot locations and shooting accuracy, with aggregate box-score error moving from 1.010 to 1.177, mainly rebounds and assists. That tradeoff is retained and documented rather than preserving the wrong physical size. Raw results and the rejected proposals are retained in the JSON audit.

Counting-rate comparisons normalize to the reference minute target so an extra rotation minute is not mistaken for more scoring skill. The JSON also retains observed minutes and unadjusted per-game results. College comparisons use 1,200 held-out generated identities and rates per 40 minutes, not a forced season record. Minute targets inferred from ESPN’s one-decimal MPG are explicitly marked approximate. These tests do not certify exact advanced metrics, defense, team strength or future seasons.

| Card | Decision | Previous error | Shipped error |
|---|---|---:|---:|
| Luka Dončić – Rookie year (2018–19) | Retuned | 12.917 | 1.836 |
| Dalton Knecht – Rookie year (2024–25) | Retuned | 4.552 | 1.200 |
| Ben Simmons – Rookie year (2017–18) | Retuned | 4.066 | 1.899 |
| Al Horford – Rookie year (2007–08) | Retuned | 13.045 | 6.471 |
| Chris Paul – Rookie year (2005–06) | Retuned | 9.070 | 0.693 |
| Klay Thompson – Rookie year (2011–12) | Retuned | 5.986 | 2.093 |
| Kawhi Leonard – Rookie year (2011–12) | Prior build retained | 1.217 | 1.217 |
| Dwight Howard – Rookie year (2004–05) | Retuned | 14.185 | 1.302 |
| John Wall – Rookie year (2010–11) | Retuned | 5.108 | 1.965 |
| Yi Jianlian – Rookie year (2007–08) | Retuned | 8.368 | 2.761 |
| Andrei Kirilenko – Rookie year (2001–02) | Retuned | 1.732 | 0.874 |
| Jeremy Lin – Rookie year (2010–11) | Retuned | 38.344 | 2.398 |
| Toney Douglas – Rookie year (2009–10) | Retuned | 8.311 | 1.998 |
| Jan Veselý – Rookie year (2011–12) | Prior build retained | 11.730 | 11.730 |
| Bismack Biyombo – Rookie year (2011–12) | Retuned | 5.276 | 2.248 |
| Bronny James – Rookie year (2024–25) | Retuned | 56.582 | 0.645 |
| Jarrett Culver – Rookie year (2019–20) | Prior build retained | 16.015 | 16.015 |
| Jarred Vanderbilt – 2022–23 | Retuned | 9.909 | 2.393 |
| Maxi Kleber – Prime (2019–20) | Prior build retained | 2.513 | 2.513 |
| Joel Embiid – Draft night (2014, Kansas) | Retuned | 0.819 | 0.654 |
| Joel Embiid – Rookie year (2016–17) | Prior build retained | 1.745 | 1.745 |
| Joel Embiid – MVP season (2022–23) | Retuned | 8.527 | 1.206 |
| Anthony Bennett – Draft night (2013, UNLV) | Retuned | 0.136 | 0.060 |
| Tyler Hansbrough – Draft night (2009, North Carolina) | Prior build retained | 1.104 | 1.104 |
| Blake Griffin – Rookie year (2010–11) | Retuned | 10.645 | 0.700 |
| Jeremy Lin – Linsanity season (2011–12 Knicks) | Prior build retained | 0.869 | 0.869 |
| Robert Sacre – Prime (2013–14) | Retuned | 6.903 | 0.797 |
| Matt Ryan – 2023–24 | Prior build retained | 3.743 | 3.743 |
| Monte Morris – 2018–19 | Retuned | 7.437 | 1.742 |
| Jalen Green – Rookie year (2021–22) | Retuned | 4.157 | 3.540 |
| Emmanuel Mudiay – 2021–22 | Retuned | 7.763 | 1.437 |
| KJ Simpson – Draft night (2024, Colorado) | Retuned | 15.656 | 3.210 |
| Henry Ellenson – Worst season (2016–17 rookie) | Retuned | 9.107 | 1.380 |
| Charles Barkley – Rookie (1984-85 Philadelphia 76ers) | Prior build retained | 0.458 | 0.458 |
| Charles Barkley – Statistical peak (1989-90 Philadelphia 76ers) | Retuned | 0.809 | 0.462 |
| Charles Barkley – MVP (1992-93 Phoenix Suns) | Prior build retained | 0.658 | 0.658 |
| Michael Kidd-Gilchrist – Rookie (2012–13 Charlotte Bobcats) | Prior build retained | 1.061 | 1.061 |

## Michael Kidd-Gilchrist, 2012–13

| Rate | Historical | Authored | AI-refreshed |
|---|---:|---:|---:|
| pts | 9.026 | 8.898 | 8.709 |
| reb | 5.833 | 5.437 | 5.357 |
| ast | 1.500 | 1.460 | 1.467 |
| fg | 0.458 | 0.474 | 0.467 |
| ft | 0.749 | 0.768 | 0.758 |

All 613 historical attempts reconcile. Non-restricted-area paint accuracy remains an imperfect match: the source is 16 makes on 67 attempts. Exact historical decimals are stored as references; simulated games remain stochastic.

## Important source limits

- Lin’s 2011–12 reference is his Knicks stint only. Monte Morris’s 2018–19 chart excludes playoff attempts. Ellenson’s 2016–17 three-point reference is 10-for-35.
- Mudiay’s estimated 2021–22 level uses his combined 2018–19 and 2019–20 NBA record; two appearances in 2021–22 are insufficient to identify stable shooting ability.
- Named stepback and fadeaway labels help identify those moves. Generic “Jump Shot” records do not establish the complete catch-and-shoot/pull-up split. Those remaining shares stay estimates.
- Barkley and Kirilenko do not have a complete certified shot chart in this audit. Their location and creation shares remain scouting estimates.
- Low-volume three-point samples do not justify forcing an exact percentage or turning a tiny sample into a reliable shooting skill.

## Compatibility

Preset indices stay stable. Previous builds are archived. Untouched library copies update; manually changed ratings, style, potential, feel, work ethic and college builds are protected. Existing players’ stats and history are not rewritten, and the league card-migration version is unchanged. Imports change builds while preserving the carrier’s identity, team, contract and history. The simulation formulas and autosave paths are unchanged.

Exact source totals, source URLs, all previous/revised files, raw and minute-normalized tests, rejected candidates and the separate college checks are in [the JSON audit](PLAYER_CARD_REFINEMENT_2026-11-27.json). Individual importable files are in `public/cards`.

## Reproducing the comparison

Run `node --import tsx scripts/cardAccuracy.mts 36` for MKG’s full recorded comparison, or replace 36 with another index from the JSON audit. A second argument can shorten NBA games per world for a smoke check. `cardAccuracyHarness.mts` uses the production game simulator, separate authored/AI modes, rotating opponents and alternating home court. No league save is opened or changed.

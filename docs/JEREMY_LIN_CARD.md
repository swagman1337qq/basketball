# Jeremy Lin — Linsanity season (2011–12 Knicks)

Added 2026-10-31 as preset 25 (the 26th card). The 2010–11 Warriors rookie card stays available separately. This build represents his complete 35-game Knicks regular season, including the games before his breakout; it does not extrapolate the short February hot streak.

In God Mode, open Player cards and choose **Jeremy Lin – Linsanity season (2011–12 Knicks)**. Or import `public/cards/jeremy-lin-2011-12.json`, save, then apply it to a player. Applying keeps that player’s name, age, team, contract and history; edit the bio separately to make him Jeremy Lin. The measured build is 56 overall with 60 potential. Its ratings are calibrated to this engine’s scale.

## Historical comparison

900 fresh production-engine games: three generated worlds, authored and monthly-AI styles, 150 games per combination, alternating home/away against varied opponents. Rates are normalized by observed minutes to his real 940/35 = 26.86 minutes. Attributes are held fixed for this comparison. Seed offset 14000001 is separate from fitting seeds.

| Category | Actual 2011–12 | Simulation |
|---|---:|---:|
| Points | 14.63 | 14.51 |
| Field-goal attempts | 10.94 | 10.84 |
| Three-point attempts | 2.14 | 2.26 |
| Free-throw attempts | 5.23 | 5.12 |
| Offensive rebounds | 0.51 | 0.58 |
| Defensive rebounds | 2.54 | 2.67 |
| Assists | 6.17 | 6.20 |
| Steals | 1.57 | 1.43 |
| Blocks | 0.26 | 0.24 |
| Turnovers | 3.60 | 3.62 |
| Personal fouls | 2.23 | 2.23 |
| FG% | 44.6% | 44.6% |
| 3P% | 32.0% | 31.7% |
| FT% | 79.8% | 80.2% |

The simulation produces 3.25 total rebounds versus 3.06 historically. All 14 diagnostic category tolerances pass; these are practical comparison bands, not guarantees for a single season. Steals remain slightly low and rebounds slightly high. Team context, minutes, tactics, fatigue and development change results in a live league. Shot-location and creation shares are scouting estimates; personality and intangibles are design judgments. Historical teammate effects, exact play types, injuries and career development have not been validated. To retain this season’s attributes, use Freeze attributes; use Freeze tendencies to retain every preference exactly.

Sources: [Basketball Reference](https://www.basketball-reference.com/players/l/linje01.html), [complete season totals](https://www.landofbasketball.com/nba_players_season_stats/2012/jeremy_lin_full.htm). Targets use totals divided by 35 games; shooting uses made/attempted totals.

Reproduce with Node 24+: `node .review/validate-jeremy-lin.mjs`. The script also checks the import matches the built-in card, ratings and shares are valid, the rookie variant remains present, and applying preserves identity and contracts. Compact results: `.review/jeremy-lin-validation.json`.

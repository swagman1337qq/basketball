# Jeremy Lin — 2011–12 Knicks finishing update

Updated 2026-11-02 with separate finishing execution. This remains the full 35-game regular season, not an extrapolation of his February hot streak. The Warriors rookie card is separate.

The card now separates **Dunk ability 55** (a neutral, uncertain prior) from **2% desired dunk share** of restricted-area attempts. Three recorded dunks cannot identify a precise ability rating. **Layups 40** describes non-dunk execution; **Inside 35** describes post/hook skill. Inside and Dunks no longer enter every layup’s accuracy. These scores are NBA-relative engine parameters, not shooting percentages or established intrinsic measurements.

The historical targets are unchanged: 69/133 labeled layups; 3/3 dunks; RA74/152, non-RA paint37/77, mid-range36/79. The authored zone attempt shares remain39.7/20.1/20.6/3.4/16.2. NBA action tags are observational labels, not tracking-derived difficulty.

## Current production-engine comparison

1,200 games on held-out world seeds101/202/303, authored and AI-refreshed styles, normalized to940/35minutes.

| Category | Historical | Simulation |
|---|---:|---:|
| Points | 14.63 | 14.95 |
| FGA | 10.94 | 10.70 |
| 3PA | 2.14 | 2.11 |
| FTA | 5.23 | 5.64 |
| Assists | 6.17 | 5.92 |
| Rebounds | 3.06 | 3.35 |
| Turnovers | 3.60 | 3.73 |
| FG% | 44.6% | 45.7% |
| 3P% | 32.0% | 33.9% |
| FT% | 79.8% | 79.1% |
| Restricted-area FG% | 48.7% | 52.3% |
| Non-RA paint FG% | 48.1% | 45.0% |
| Outside-paint mid-range FG% | 45.6% | 44.2% |

All declared diagnostic bands passed. RA finishing remains about3.6percentage points high; paint about3.0points low. Rebounds, foul counts and free throws remain somewhat high. This is an improved, testable mechanism, not a claim of exact all-category realism. Individual skills are still authored estimates.

Reopen Player cards for the updated untouched preset. Reapply it to update a player already in a league; custom library builds stay customized. Applying preserves identity, age, contracts and history. Download: public/cards/jeremy-lin-2011-12.json.

Sources and exact shot/action counts: .review/jeremy-lin-targets.json; [NBA shooting](https://www.nba.com/stats/player/202391/shooting?Season=2011-12), [season totals](https://www.landofbasketball.com/nba_players_season_stats/2012/jeremy_lin_full.htm). Reproduce: node .review/validate-jeremy-lin.mjs. Detailed model scope and broader validation: [Finishing update](FINISHING_UPDATE_2026-11-02.md).

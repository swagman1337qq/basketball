# Feature spec: status

Every point of the feature spec, whether it's in the game, and where to find it. "Engine" paths are under `src/engine/`, screens under `src/ui/`.

Legend: **Done** is implemented and playable. **Partial** notes what's simplified.

## 1. Core simulation, season structure and statistical engine

| Point | Status | Where |
|---|---|---|
| 2026 baselines as the 50th-percentile means (pace 98.8, 113.8 PPG, 46.7 FG%, 36.0 3P% on 37.6 3PA, 78.0 FT%, 44.1/11.1/33.0 rebounds, 26.5 AST, 8.2 STL, 4.9 BLK, 14.3 TOV, 114.5 ORtg, 57.6 TS%, 54.3 eFG%, 12.6 TOV%, 25.2 ORB%, 0.189 FT/FGA, 14.5 ft, 69.6% at the rim, 38.8% corner threes) | Done | `sim.ts` `BASE`; `norms.ts` recenters ratings each season so league averages stay on these numbers. Compare live on **League stats**. |
| Bell-curve mean (90 shooter ≈ 39–41% from three, 40 shooter ≈ 26–28%) | Done | `sim.ts` `CURVE` / `curve()` |
| Usage-rate gatekeeper (expected points = possessions × USG% × TS%) | Done | `sim.ts` `usageRaw()` and the shot-taker draw in `GameSim.step()`; USG% shown on profiles and League stats |
| Four shot-quality tiers in the engine, five zones in the UI | Done | Engine tiers: rim, mid-range, corner 3, above-the-break 3 (`BASE.zone`). Profile **Overview → Shooting by zone** splits the rim tier into restricted area and paint for the five-zone view. |
| Four Factors clutch tiebreaker (last 5 minutes, margin ≤ 6) | Done | `sim.ts` `ffScore()`, applied per possession in `step()` |
| Season structure: 82 games, play-in, East/West best-of-7 bracket, lottery, draft, free agency | Done | **Playoffs** screen shows the play-in as a bracket and the NBA-style bracket; 15 teams per conference (16 after expansion) |
| Awards | Done | Voted by formula in the Basketball GM custom-award format (`data/awardDefs.ts`, evaluated by `formula.ts`): MVP, DPOY, ROY, 6MOY, MIP, Finals MVP, conference-finals MVPs, All-League (3), All-Defensive (2), All-Rookie (2), OPOY, Playmaker, the Jokic advanced-stats award, Glue Guy, LVP, Mr. Perfectly Average, Least Improved, Least Efficient, Worst Defender, plus Coach of the Year. The advanced stats they use (PER, WS/OWS/DWS/WS48, BPM/OBPM/DBPM, VORP, EWA, on/off, USG%, AST%, rebound/steal/block/turnover rates, ORtg/DRtg) come from `advanced.ts`. Edit, import or export the formulas in **Settings → Award formulas**. |

## 2. Injury, health and environment

| Point | Status | Where |
|---|---|---|
| Injury risk from age, strength, endurance, minutes, fatigue and chance | Done | `Game.injTick()` |
| Major injuries (torn ACL, ruptured Achilles) cut speed, jumping and strength, and can cost skill on return | Done | `Game.injTick()`; shown in profile **Development → Injury history** |
| Minor injuries: short absences or day-to-day at reduced effectiveness | Done | Day-to-day players play with a penalty (`sim.ts` `condPen`) |
| Cumulative youth stunting (frequent minor injuries under 24 slow growth and can lower potential) | Done | `Game.devTick()`; flagged in the monthly report and the Development tab |
| Home/road splits for role players (crowd-reliant hit hardest; stars steady) | Done | `sim.ts` `roadPen`; profile **Overview → Home / road** |

## 3. Ownership, front office and personnel

| Point | Status | Where |
|---|---|---|
| Dual role: you are GM and head coach, no assistant staff | Done | Tactics, rotation, training and roster decisions are all yours |
| Transparent owner archetypes (Win-Now Spender, Frugal Profit-Seeker, Asset Hoarder, Hype Focus, Meddling Micromanager) | Done | `frontOffice.ts` `ownerReview()`; **Owner** screen lists every demand, limit and firing condition |
| Firing conditions enforced | Done | `seasonReview()` at the end of each season; toggle in **Settings → Owner can fire you** |
| Named (fictional) owners and GMs for every club | Done | Generated in `Game.makeDB()`; quoted in the **Press room**, trade talks and draft night |
| AI coaches without tactical modifiers | Done | AI teams play default tactics; only human-run clubs have tactics/situational presets |

## 4. Player development and coaching

| Point | Status | Where |
|---|---|---|
| Training focus per player with hidden decimal attributes | Done | **Development** screen; formula in `Game.devTick()`; decimals visible in profile **Development → Hidden decimals** |
| Monthly growth formula | Done | age curve × Coaching budget × minutes (or dev league) × injury × work ethic × stunting × random 0.6–1.4, focus attributes ×2.2 and others ×0.45; previewed on **Tactics → Training focus preview** |
| Minor/dev league reps | Done | Send down / recall on **Development**; young players without minutes stall |
| Threshold-based evolution (roles unlock at attribute thresholds and unlock tactics) | Done | `roleDefs()`; profile shows the next thresholds; **Tactics** options unlock by roster roles |

## 5. Global scouting and draft

| Point | Status | Where |
|---|---|---|
| Regional talent pools, tiers 1–4 | Done | `regions()` in `data/world.ts` (tier 4: Angola, Côte d’Ivoire, Jamaica, Venezuela, Uruguay) |
| Scout specialties; mismatches widen margins | Done | **Scouting** screen; `Game.regFactorK()` |
| Fuzzy reports with margins that shrink with investment; strengths, weaknesses, intangibles, comparisons | Done | Profile scouting report; intel accumulates monthly (`overseas.ts` `scoutTick()`), focus up to five prospects |
| Verbal draft promises with hidden commitment strength | Done | Promise from a prospect's profile |
| Draft-night heists: boycott (loyalty) or betrayal (ambition, agent reputation hit) | Done | `Game.aiDraft()` / `heistLoyal()` |

## 6. Contracts and finances

| Point | Status | Where |
|---|---|---|
| Incentives: availability, statistical, team success, accolades | Done | Chosen when signing; `frontOffice.ts` `incentiveOptions()`; settled after the season |
| Likely vs unlikely cap accounting | Done | `Game.capHit()`; profile **Contract → Bonus checklist** |
| Stat-padding dilemmas (protect a percentage, garbage-time minutes, feature me) | Done | Dashboard **Front-office inbox** (`inboxTick()` / `resolveInbox()`) |
| Tiered tax, aprons, repeater tax, owner fire sales | Done | `financesOf()` (tiered and repeater rates); taxpayer MLE and no aggregation above the aprons (`Game.signHow()`, `Game.propose()`); payroll mandates become a fire sale at the deadline (`fireSale()`) |

## 7. International and minor-league lifecycle

| Point | Status | Where |
|---|---|---|
| Overseas redemption arcs (minutes abroad grow confidence and skill) | Done | Release a player overseas from his profile; arc shown in **History** |
| Overseas market limited to drafted or declared players, with projected translation | Done | **Overseas** screen; `overseas.ts` `translation()` by league strength |
| Buyout negotiations (out clauses vs negotiated fees, cap hit, assets) | Done | **Overseas → Negotiate buyout**: hidden floor, counters, second-round pick, walk-away |
| 15-game adjustment period, shortened by minutes and coaching | Done | `adjustGames()`; decays faster with 24+ minutes and a $25M+ Coaching budget |

## 8. Interface

| Point | Status | Where |
|---|---|---|
| Premium dark theme, neon green / soft red / glowing gold, team-color accents | Done | `theme.ts`, `styles/app.css` |
| Every player name clickable, profile opens as an overlay | Done | Tables, transactions, logs, inbox, press and play-by-play (`kit.tsx` `linkNames()`) |
| Dual-script names (Romanized in box scores and play-by-play; native in parentheses on rosters; both in the profile header) | Done | `nativeMaps()`; roster, profile |
| Profile tabs: Overview, Contract, Development, History, Comparison | Done | `ui/modals/PlayerModal.tsx`, `ProfileExtras.tsx` |
| Monthly development feed | Done | **Development** screen reports and the per-player growth feed |
| Tactics and rotation hub (drag-and-drop, situational presets, training visualization) | Done | **Tactics** |
| Career and job market (vacancies, applications, offers, contract choice, switch teams) | Done | **Career** |

## 9. Settings, saves and multi-team control

| Point | Status | Where |
|---|---|---|
| Select managed teams (1 to 30) at league creation | Done | Title screen |
| Multi-team dashboard with alerts | Done | **My teams** |
| God Mode: take over or abandon any team mid-season | Done | **My teams**, team modal |
| AI takeover by owner archetype when you resign | Done | `Game.handToAI()` |

## 10. God Mode editors and assets

| Point | Status | Where |
|---|---|---|
| Player editor: first/last names (Romanized and native), DOB, age, nationality, height, weight, wingspan | Done | Profile **✎ Edit player** |
| CA/PA and every attribute; age changes re-cap potential | Done | Same |
| Hidden traits (Clutch, Injury prone, Stat padder, …), work ethic, loyalty, ambition, morale | Done | Same |
| Heal, fatigue, trigger specific injuries | Done | Same |
| Logos for all default teams with colors | Done | `TEAM_STYLE`, `TeamLogo.tsx` (original crests for the fictional clubs) |
| Procedural expansion teams (name, palette, crest from the city) | Done | **Settings → League expansion**: pick an East and a West city, reroll identities (`genExpansionTeam()`) |
| Upload logos and headshots (auto crop and resize) | Done | `ui/upload.ts`; League editor and player editor |
| Team and league editor: names, colors, logos, arena name and capacity, cap/tax/owner-budget adjustments, add/remove players, force trades | Done | **League editor** (God Mode) |
| Guardrails: IDs, engine formulas and past-season stats locked | Done | Editors never touch IDs, `sim.ts` constants or earlier seasons' stat rows; both editors say so |

## Simplifications worth knowing

- Days on the calendar are game days, so the playoffs finish in the winter on the in-game calendar.
- Team renames apply to past seasons' displays too (history stores team IDs, not names).
- The five-zone view derives the restricted-area/paint split from the rim tier by typical league shares.

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
| 2027 “3-2-1” draft lottery: 16 teams, 37 balls (3 for non-play-in teams, 2 for the bottom three and the 9/10 play-in seeds, 1 for 7 v 8 losers), all 16 picks drawn, bottom-three floor at 12, no No. 1 in consecutive drafts / top-5 in three straight (by original team) | Done | `engine/lottery.ts` (exact odds over every drum state), **Lottery** page with odds for every pick |
| Season bar: every step is clickable: Play-in, Playoffs and Lottery show “if the season ended today” mid-season; Draft shows the projected order | Done | `PlayinScreen`, `PlayoffsScreen`, `LotteryScreen` |
| Lottery night: picks revealed 16 → 1, each waiting team's live chance at No. 1 (exact, conditioned on the picks shown) | Done | `liveNo1()` in `lottery.ts`, `LotteryNight` |
| Create your GM: name, nationality, experience (none → legendary), race, generated headshot (new face / upload) | Done | `GMSetupModal`, `gmCareer.ts` |
| GM contract: years and salary; owner offers extensions when happy, lets it expire when not; pay by owner personality (frugal caps it, win-now spends); ask for an extension once a season | Done | `contractDecision()`, `askExtension()`, Career screen, owner letter |
| Tutorial: quick / in-depth (every tab and rule) / no thanks; automation offered at the end | Done | `Tour.tsx` |
| Readable UI: Inter throughout, plain full-height numbers; collapsible menu with labeled icons; Western Conference first everywhere; brand renamed Basketball Manager; Dallas replaced Salt Lake (now in the expansion database) | Done | `classical.css`, `AlmanacSidebar` |
| Personality traits with hover descriptions (Egotistic, Legacy-driven, Ball-dominant, Team player, Professional, Volatile, Crowd-fed, Clutch, Injury prone, Selfish); other teams' players show your scouts' read (can be wrong or empty); click a trait for everyone with it; filter free agents and the draft board by trait | Done | `engine/traits.ts`, `TraitFilter` |
| Selfish players: more shots and points, fewer passes, worse team offense and defense (negative +/-), teammates annoyed | Done | `sim.ts`, `moodOf()` |
| Vietnamese names: family + middle + given (3 parts ~82%, 4 parts ~15%), weighted surnames (Nguyễn 38%…), full diacritics as the native name | Done | `data/vietnamese.ts` |
| Back from a player opened out of a country / draft-class list returns to that list | Done | `pageStack` in `viewModel.ts` |
| Locker room (team morale): happiness, veteran leaders, winning, troublemakers; affects mood, shooting and growth | Done | `engine/lockerRoom.ts`, Roster header |
| Mentoring and culture: paired or informal veteran mentors can remove bad traits / pass on good ones; bad rooms breed egos, great rooms team players; all gated by a hidden malleability (God Mode shows it) and rare | Done | `mentorTick()`, Development → Mentoring |
| Click-to-sort columns (player by last name) on player lists, standings, transactions (date), stats, trade, draft, free agency, shortlist, scouting, overseas, development; college / former club opens a player list | Done | `ui/sortable.tsx` |
| Player transaction history (drafted, signed / re-signed, traded with everything that came back, waived, expansion draft, sent overseas, retired); traded picks followed to the player they became; AI contenders trade players + firsts for veterans | Done | `engine/txlog.ts`, profile → Transactions |
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
| Tiered tax, aprons, repeater tax, owner fire sales | Done | `cba.ts` `taxBill()` (tiered and repeater rates, assessed on the last day of the regular season); apron rules in `signingMethods()` and `checkTrade()`; payroll mandates become a fire sale at the deadline (`fireSale()`) |
| The full CBA: every contract type and signing mechanism | Done | See "NBA CBA" below; **Cap sheet** screen |

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

- The 82 game days are spread from late October to mid-April; 10-day, trade-deadline and DPE dates sit on that calendar.
- Two-way players play for the NBA team only (there's no simulated G League), up to 50 games.
- Sign-and-trades and cash in trades aren't modeled.
- Team renames apply to past seasons' displays too (history stores team IDs, not names).
- The five-zone view derives the restricted-area/paint split from the rim tier by typical league shares.

## Added since

| Feature | Where |
|---|---|
| Ratings, overall and potential top out at 100 | Engine clamps and the player editor |
| Mandatory retirement age (off by default); players retire the moment they reach it | Settings → Retirement age; `Game.enforceRetirement()` |
| Families: sons of former players (~2%) and brothers (~3%), at roughly real NBA rates, sharing surname, heritage and look; "Jr." for some sons; legacy retired players from before the league's records | `engine/family.ts`; profile Father/Son/Brother rows |
| Hall of Fame: 3-season wait, transparent career score, up to five inductees a year, ballot and active-player watch list | `engine/hof.ts`; **Hall of Fame** screen |
| Owner's year-end letter when the playoffs end: what you did right and wrong, how he feels, the verdict, next season's expectations | `engine/ownerLetter.ts`; reopen past letters on the **Owner** screen |
| Team overall rating, worst-roster start, badges, profile redesign, draft-class and family links, God Mode true ratings and job security | Team overview, title screen, player profile |
| Salary-cap outlook: real history since 1984-85 and a year-by-year projection for 500 seasons (inflation, fading real growth, media deals every 11 years, recessions, the 10% cap on yearly growth), applied each summer | `engine/capModel.ts`; League → **Cap outlook** |
| Every country (215: all 193 UN members plus Kosovo, Palestine, Chinese Taipei, Hong Kong, Macau, Vatican City and FIBA territories), each with census-share population groups, name pools, cities, scouting region and flag | `data/nations.ts`, `data/names.ts`, `data/heritage.ts` |
| Bigger name pools (40–60 per major pool), native scripts for Cyrillic, Arabic, Persian, Thai, Armenian and more; Chinese surnames weighted by frequency (Yuan Yida's published shares, top 100); Taiwanese surnames by the household registry | `data/names.ts`, `CN_SURNAMES`, `TW_POOL` |
| U.S. and Canadian heritage mix matches NBA players (≈74% African American, 13.5% white, 10.5% multiracial, 1.6% Hispanic, 0.4% Asian American); separate first-name pools by community | `data/heritage.ts` |
| Type-to-search country picker; God Mode: add/remove national-team eligibility with a reason, switch who he represents; add any country to the nationality mix | `CountryPicker` in `ui/kit.tsx`; profile **Eligible for**; Settings |
| Player search on every layout (accent-insensitive) | `ui/PlayerSearch.tsx` |
| Roster: any team and season, record/rank/rating/MOV/age/spots/payroll/cap/profit, cap indicator, play-through-injuries, auto sort / keep sorted / reset minutes, team notes, jersey numbers, starter/bench color blocks, per-player minute targets, NBA roster groups (15 standard, 3 two-way, Exhibit 10) | `ui/screens/RosterScreen.tsx`, `engine/jerseys.ts` |
| Assistant coaches' lineup advice (starters with a positional mix, minutes for fatigue, age, form, development) with one-click apply | `engine/assistants.ts` |
| Badge hover cards (what it is, tier, how it plays); mood hover cards (priorities, what's pulling on him, every factor) | `ui/BadgeChip.tsx`, `ui/MoodChip.tsx` |
| Scouting reports for any player: measurements, 12 graded categories (scouts' eye blended with game production), overview, strengths, weaknesses, outlook, comparisons (plays like / best / worst case), notes, stat line; accuracy by scout skill, region, budget and time | `engine/scoutReport.ts`; **Scouting**, profile **Scouting report** |
| Stats hub: player stats for any season or career (per game, totals, per 36, shooting, advanced), team stats and ratings by season, league stats, league history (champions, runners-up, Finals MVP, awards, best record, this season's race) | `ui/screens/StatsScreen.tsx` |
| Player and team pages (full pages with Back) instead of pop-ups | `GMView.tsx` |
| Play a month; sim to the trade deadline (early February) | Phase bar |
| Team nicknames tied to what each city is known for | `data/world.ts` (`TEAMS`; old saves with default names are migrated) |
| League cities all have metro areas of 1 million+ (San Jose and San Antonio replaced Honolulu and Albuquerque); franchise database of 45 ready-made teams (1M+ cities, plus a few smaller ones flagged) with colors, crests and metro populations; create-your-own teams; expand by any even number, again in later seasons | `data/franchises.ts`; Settings → **League expansion** |
| Floating hover cards (never clipped, never force a scroll) for badges and moods | `ui/HoverCard.tsx` |
| Free-agent pool at NBA size: about 90 in season, 150–230 when free agency opens; draft classes of about 100 prospects, the best ~45 undrafted become free agents (tagged, some unsigned for years) | `Game.makeDB()`, `Game.startPreseason()`, `Game.startSeason()` |
| G League: every club has an affiliate; unsigned players play there on standard G League contracts ($40,500 in 2025-26, scaling with the cap) and any NBA team can call them up; affiliate rights (up to 5 camp cuts) and returning rights; Exhibit 10 cuts join the affiliate; G League stat lines; young players develop there | `engine/gleague.ts`; Free agency filter, profile label |
| Tutorial (only when you press it): a coach card that walks through basketball basics, ratings, lineups, the calendar, the cap, tax, aprons, Bird rights, free agency, trades, the draft and the owner, jumping to each screen and highlighting what it describes; skippable | `ui/Tour.tsx`; nav → **Tutorial** |
| Easy mode (every switch off by default): lineup and minutes, tactics, contract paperwork, filling the roster in free agency, draft picks, never fired, easier scouting, resting injured players | `engine/easy.ts`; Settings → **Easy mode** and the tutorial's first step |

## NBA CBA (2023 agreement)

All dollar figures are the CBA's real ratios to the cap, so they move with the cap outlook.

| Rule | Where |
|---|---|
| Cap, tax line, 1st and 2nd aprons, salary floor (shortfall paid to players) | `cba.ts` `nums()`; **Cap sheet** |
| Max salary 25/30/35% by service; Rose Rule (30% rookie extension after MVP/All-League/DPOY); designated veteran supermax (35%) | `maxFor()`, `honorsQualify()` |
| Minimum salary by years of service; one-year veteran minimums count as the 2-year minimum | `nums().min()`; `applySigning()` (`capOverride`) |
| Rookie scale (120% of scale, 4 years, team options on years 3 and 4); two-round, 60-pick draft; second-rounders on two-way or minimum deals | `rookieDeal()`, `signDraftee()` |
| Bird rights: Full (up to the max, 5 yrs), Early (175% / 105% of average, 2–4 yrs), Non-Bird (120%); rights travel in trades | `birdOf()`, `signingMethods()` |
| Cap holds, renouncing, incomplete-roster charges | `capHold()`, `teamSalary({ holds })`, `renounce()` |
| Non-taxpayer MLE (hard cap at 1st apron), taxpayer MLE (2nd apron), room exception, bi-annual (not back-to-back), minimum exception, disabled player exception | `signingMethods()`, `freshExceptions()`, `seasonTick()` |
| Hard caps triggered by the exceptions; method limits shrink to fit under them | `applySigning()`, `signingMethods()` |
| Qualifying offers, restricted free agency, offer sheets and matching (user decides on the Cap sheet; AI decides by value), Arenas provision; unsigned RFAs accept the QO | `qoFor()`, `openFreeAgency()`, `aiFreeAgencyDay()`, `answerOfferSheet()` |
| Player and team options; option decisions and QOs chosen on the Cap sheet before free agency | `openFreeAgency()`, `decisionsFor()` |
| Two-way contracts (3 per team, under 4 years of service, off the cap, 50 games, not playoff-eligible, convertible) | `stdIds()/twoWayIds()`, `convertContract()`, `Game.simTeam()` |
| Exhibit 10 (camp deals, convert to two-way or keep), 21-man offseason roster, 15 in season, 14 minimum | `signingMethods()`, `Game.startSeason()` |
| 10-day contracts (two per team, then rest of season), hardship exception | `signingMethods()`, `seasonTick()` |
| Extensions: rookie scale (up to 5 yrs, Rose Rule), veteran (2 years after signing, 140% rule, 4 yrs or 5 for supermax), over-38 rule | Profile **Contract → Extension** |
| Trade kickers (up to 15%), no-trade clauses (8+ years, 4+ with the team) | Signing dialog; `tradeCap()` |
| Waive (dead money as due), stretch provision (2N+1), buyouts, waiver claims, post-March 1 playoff ineligibility, buyout-market ban above the 1st apron | `waivePlayer()`, `buyoutBlocked()`, Release dialog |
| Trade salary matching (200%+, +$ band, 125%+; 100% above the 1st apron; no aggregation above the 2nd), TPEs (one year), newly signed players can't be traded yet, deadline, Stepien rule, frozen pick above the 2nd apron, first-rounder to 30th after 3 of 5 seasons above it | `checkTrade()`, `tradeCap()`, `Game.runLottery()` |
| Luxury tax brackets, repeater tax | `taxBill()`, `financesOf()` |
| The new league year (cap growth, exceptions reset) starts when free agency opens | `Game.startFA()`, `openFreeAgency()` |

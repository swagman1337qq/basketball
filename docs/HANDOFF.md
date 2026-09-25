# Front Office — Basketball GM prototype: page-by-page spec for Claude Code

A single-player basketball GM + head-coach sim. The prototype is built as a Design Component in `GM App.dc.html` with one child component, `Live Game.dc.html`. `Basketball GM Redesign.dc.html` is only a canvas that shows three shell layouts side by side. Treat this doc as the product spec, and the prototype as the reference implementation of every rule below.

---

## 0. Files and architecture

| File | Role |
|---|---|
| `GM App.dc.html` | The whole app: seeded world generation, all state, all screens, modals, season engine. Prop `variant` = `A`/`B`/`C` (shell layout). Prop `theme` = `dark`/`light`. |
| `Live Game.dc.html` | Possession-by-possession game viewer and engine. Props: `home`, `away` (`{tid,name,abbr,rec,players[]}`), `userSide`, `tactics`, `onFinish({us,them,win})`, `onPlayer(id)`, `onTeam(tid)`. |
| `styles.css` | Design tokens (Classical system). The dark theme overrides the CSS variables on the app root at runtime (`applyTheme`). |
| `Basketball GM Redesign.dc.html` | Presentation canvas only (1a/1b/1c shells). |

**Suggested production split:** `data/` (countries, name pools, native-script maps, clubs, colleges, nationality weights), `engine/` (worldgen, sim, liveGame, injuries, development, contracts, trades AI, draft, seasonCycle), `state/` (single store), `ui/` (screens and modals below). Keep everything seeded (a mulberry32 RNG seeded with 2027) so a new save is reproducible.

**The user team is `tid 0` (Baltimore Tides).** Many rules assume this. Multi-team control needs this generalized first (see §7).

### Global state (key fields)
`screen, phase ('regular'|'playoffs'|'lottery'|'draft'|'fa'|'preseason'), season (ending year; starts 2027), day, teams[] (w,l,hw,hl,rw,rl,seq,str,mkt,owner,arch,gm), rosters{tid:[pid]} (index order = rotation; first 5 start), fa[], overseas[], assets[] (draft picks {id,yr,rd,orig,owner}), picks[] (current draft order {n,orig,pid}), pi (pick index), results[], log[] (user moves), lgLog[] (league moves), po (playoff rounds), playinRes, history[], budget{Coaching,Health,Facilities,Scouting,Tickets}, tactics{pace,off,def,clutch}, train{pid:focus}, reports[], scouts[], promises{pid:{n,str}}, agentRep, natW{country:weight}, lists[] (shortlist categories), taxHist[], mleUsed, buyoutCash, god, expansion/expanded, theme, modal/pid/ptab, teamModal, listModal, dialog`.

Player record (`P[id]`): `name, native, pos, grp (G/W/B), age, ovr, pot, r{15 ratings}, rx{} (hidden decimals), hgt, wt, amt, exp, ext, rookie, yrsWith, birdTid, dr{rd,pick}, draft, cls (prospect class year), from{team,lg,country}, her/born/raised/rep/elig[]/city/race, pers{mot, alpha, touches, pro, volatile, crowd, clutch, prone}, inj, injHist, minorCount, dev (dev-league flag), adjust (games left in adjustment), abroad{club,lg,country,pts,reb,ast,clause,fee}, gp/min/pts/reb/ast/per, ask, mood`.

The 15 ratings are `hgt stre spd jmp endu ins dnk ft fg tp oiq diq drb pss reb`.

---

## 1. Global chrome (every screen)

**Shells** (same content, different navigation):
- **A, Almanac:** grouped left sidebar with the play buttons.
- **B, Broadsheet:** newspaper masthead plus a wrapping tab row.
- **C, Desk:** icon rail, player search box, and a right panel with the next game, "books" and transactions.

**Nav groups:**
- **League:** Dashboard, Standings, Schedule, Transactions, Playoffs, Settings.
- **Team:** Roster, Depth chart, Development, Tactics, Finances.
- **Front office:** Trade, Free agency, Draft, Shortlist, Scouting, Overseas, Owner.

**Phase bar** (top of main, every screen):
- Shows the season label, a stepper (Regular season → Play-in → Playoffs → Lottery → Draft → Free agency → Preseason), a context note, and the phase actions.
- The current step opens its screen; the next step is outlined and runs the primary action.
- Actions by phase:
  - **Regular:** Play a day / Play a week / Sim to end of regular season. After game 82: **Start the play-in**.
  - **Playoffs:** Sim a game / Sim round / Sim to champion. Then **Go to the draft lottery**.
  - **Lottery:** Run the lottery.
  - **Draft:** Sim to my pick / Auto-draft the rest. When the user is on the clock: Go to the board / Auto-pick for me. When done: **Open free agency**.
  - **FA:** Advance a day / **Start preseason**.
  - **Preseason:** **Start the regular season** (blocked above 15 players).

**Universal links:** every player name opens the Player modal, every team name opens the Team modal, and every country opens the Country list modal.

**Theme:** dark (default) or light. The toggle is in every shell and in Settings. Colour code: `--gm-good` green = growth, wins, happy; `--gm-bad` red = decline, injuries, unhappy; gold `accent-700` = elite ratings (≥65).

---

## 2. Screens (workflow per page)

### Dashboard
- **Shows:** record, conference seed, payroll vs cap/tax, roster count; next-game card; recent results; team leaders; starting five (faces, flags); conference top-10 with a playoff line. In preseason it also shows an Offseason development card (each player's ovr from → to).
- **Actions:** Watch game (opens Live Game), Quick sim, Week, Set lineup (goes to Roster), Standings.

### Live Game (`screen = game`, via `Live Game.dc.html`)
- **Shows:** scoreboard with quarter scores; box score for both teams (Min, FG, 3P, FT, OR, Reb, Ast, TO, Stl, Blk, PF, Pts, +/−), with players on the floor shaded; a shot-zone line per team (Rim / Mid / Corner 3 / Above-the-break 3); scrolling play-by-play.
- **Controls:** Pause/Play, Step one play, Speed 1–5, Sim to end. At Final: Continue → calls `onFinish`, and the parent calls `sim(1, result)`.
- **Roster rules:** injured and dev-league players are excluded. The first 5 healthy players in roster order start. Bench rotation windows are fixed by quarter and clock; blowouts go to the deep bench.
- **Engine per possession:**
  - Length 6.5–18.5 s (×0.92 Fast / ×1.08 Slow pace for the user's offense).
  - Turnover chance .112, of which 57% are steals.
  - Shooting foul: 2 FTs at .76 + (ft−50)·.003.
  - Otherwise a shot:
    - **Tier chosen first** from the league shares rim .28 / mid .29 / corner-3 .09 / above-break-3 .34, nudged by lineup skill and user tactics.
    - **Shooter chosen second**, weighted by usage × tier affinity.
    - **Make probability by tier:**
      - rim .70 + (avg(dnk,ins)−50)·.004
      - mid .445 + (fg−50)·.003
      - 3P base .28 + (tp−40)·.0025, plus .045 for a corner 3 or .012 above the break
      - minus defense (avg diq−50)·.0015
    - **Blocks:** 7% of rim shots and 2% of mid shots, scaled by the tallest defender.
    - **Rebounds:** offensive rebound .252 + rebounding difference.
    - **Assists:** 82% of made 3s, 55% at the rim, 45% from mid.
  - **Clutch** (Q4/OT, last 5:00, margin ≤6): a Four Factors advantage (shooting, ball security, offensive rebounding, FT rate) shifts make, turnover and rebound odds. The `Clutch` trait adds +.03.
  - **Away role players** (not in the lineup's top-2 usage): −2.5% make and more turnovers; −5% if `Crowd reliant`. Stars are unaffected.
  - **Adjustment period:** returning overseas players shoot −3%.
  - **Tactics:**
    - Aggressive D: +2% opponent turnovers, more fouls.
    - Switch: −1% opponent 3P, +1% opponent rim.
    - Drop: +2% opponent mid, −2% opponent rim.
    - Isolate the star: ×2.5 shot share to the top-usage player in clutch.
- **Targets (2026 baselines):** about 98.8 possessions, 113.8 points, 46.7% FG, 37.6 3PA at 36%, 78% FT, 14.3 TOV, 26.5 AST, 25.2% ORB.

### Standings
- Conference or Division toggle.
- Columns: seed, team, W, L, Pct, GB, Home, Road, L10, Strk.
- Solid rule after seed 6 (straight to the playoffs); dashed rule after seed 10 (play-in).

### Schedule
- Past results (W/L and score) plus the next 15 games.
- The next game has Watch / Quick sim.

### Transactions (league-wide)
- Filters: All / Trades / Signings / Releases / Draft (injuries and awards also appear under All). User moves are shaded.
- AI moves happen with 35% chance per day: FA signings, AI-to-AI trades of similar value, waivers. Major injuries and the champion are logged too.

### Playoffs
- **Before the play-in:** projected first round.
- **After:** bracket columns (First round, Conference semifinals, Conference finals, Finals), the play-in results, the draft lottery table (moves up and down), a champion banner, and a Past seasons table (champion, runner-up, user record, user finish).

### Settings
- Theme.
- **God Mode** toggle.
- **League expansion** toggle (applies at the next preseason).
- **Nationality mix:** editable weights, default about NBA player counts since 1980; shows the share %, a reset button, and each country links to its list modal.
- Season format note.

### Roster
- Sortable table: #, Player (flag, native script, S = starter, injury tag), Pos, Age, Ovr, Pot, Contract, Exp, GP, Min, Pts, Reb, Ast, PER, Mood.
- **Sorting keeps starters (rows 1–5) above the rule and the bench below it.**
- Reorder by drag or ↑↓. Auto-sort by rating. Hint when a bench player out-rates a starter.

### Depth chart / Roster construction
- **Summary:** guards · wings · bigs count, average age, thin spots, international count.
- **Depth chart:** the 5 starters are assigned to PG/SG/SF/PF/C by the best-fit permutation (flag "Playing out of position" when fit < .8); bench players go under their best slot.
- **Roles table** (from ratings; a player can hold several) with target ranges and status Thin / Covered / Surplus: Primary creator, Floor spacer, 3-and-D wing, Point-of-attack defender, Slasher, Rim protector, Stretch big, Rebounder, Connector.

### Development
- **Per player:** training focus (Balanced / Shooting / Finishing / Playmaking / Defense / Rebounding / Athleticism / Conditioning), assignment (Main roster ↔ Dev league; eligible if age ≤25 and ovr <58), last month's change.
- **Monthly tick** (on each calendar month change during the sim) for every rostered player:
  - `annual = age≤22: 4 | ≤25: 2.5 | ≤28: .8 | ≤31: −1.2 | else −3`
  - `monthly = annual/12 × coaching (1 + (budget−18)/60, user only) × minutes (dev league 1.4; age≤24: <10 mpg .55, <20 .85, else 1.1) × injury (major .2, minor .7) × random .6–1.4`
  - Focused ratings get ×2.2, the others ×.45. Height only grows for age ≤20. Speed, jumping and endurance decline faster from age 29.
  - Changes accumulate in hidden decimals (`rx`, `ox`) and apply when they cross whole numbers.
- **Monthly report rows:** ovr change to 2 decimals, the top 3 rating changes, and a note: unlocked role (threshold evolution), dev-league acceleration, "stalled without minutes", injury, age decline, or "focus paying off".
- The preseason yearly growth is halved to compensate.

### Tactics & rotation
- **Identity presets:** Pace, Offense, Defense, Clutch play (effects listed under Live Game).
- **Fit line:** `tacFit` from the top-8 averages (tp for Perimeter / Pace and space, ins+dnk for Inside, spd+endu for Fast, diq for Aggressive, spd for Switch, hgt for Drop), clamped ±1.5. It is added to the team's quick-sim strength.
- **Rotation:** minutes slider per player (0–42) with the total vs 240. Minutes drive stats, development and happiness.

### Finances
- **Payroll bar** on a $120–240M scale with markers: Minimum $148.5M, Cap $165.0M, Tax $201.0M, 1st apron $209.0M, 2nd apron $221.7M (2026–27 figures), plus a status line.
- **Revenue:** tickets (price × attendance × 41), national media $152M, local media 34·mkt^1.5, sponsorship 48·mkt, merchandise 22·mkt·(.8+.4·win%), tax distribution $11.5M if under the tax, revenue sharing received if the market is small.
- **Expenses:** payroll, luxury tax (brackets of $5M starting at 1.5×, +1.0 on every bracket under the **repeater** rule = taxpayer in 3 of the last 4 seasons), arena ops $55M, front office $25M, travel $9M, revenue sharing paid (25·(mkt−.95)), overseas buyouts, and the budgets.
- **Budget sliders** (per season, with league rank and effect text): Ticket price $35–300, Coaching $5–40M (progression), Health $3–25M (injury recovery), Facilities $3–30M (attendance), Scouting $1–12M (draft margins).
- **Committed salary ledger,** 5 seasons, including extensions.

### Trade
- Your roster and picks on the left; the partner's roster and picks on the right (team select labelled with its direction). "View roster" opens the Team modal.
- **Summary:** salary out/in, payroll after, salary rule, roster limits, **their direction** (Rebuilding / On the rise / Contending, with professional copy), an appetite meter and verdict.
- **Buttons:** Propose, What would it take? (adds the smallest asset of yours that makes it acceptable), Clear.
- **Salary rules:**
  - Under the cap after the trade: always OK.
  - Up to the 1st apron: incoming ≤ 125% of outgoing + $0.25M.
  - Above the 1st apron: incoming ≤ 100% of outgoing.
  - Above the 2nd apron: no combining salaries.
  - Rosters ≤15.
- **AI valuation (by direction):**
  - **Player value:** `(ovr−38)^1.9/10 × age factor`, plus a youth upside term (pot−ovr).
    - Rebuilding: vets ×.55, youth ×1.7, bad contracts barely penalized.
    - On the rise: +8 for players ≤24 with pot ≥60, and reluctant to give picks.
    - Contending: current ability ×1.35, youth ×.5.
    - Excess salary over fair value × years left is subtracted.
  - **Pick value:** first-rounders by projected slot (current standings, regressed toward the middle for future years); second-rounders flat.
    - Receiving multiplier: rebuild 1.6, rise 1.05, contend .7.
    - Giving multiplier: rebuild 1.6, rise 1.45, contend .75.
  - **Accept** if received − given ≥ max(1, 6% of given).
  - Replies are quoted from the partner's named GM.
- **God Mode:** always accepted, rules ignored.

### Free agency
- Sortable table: player (flag), Pos, Age, Ovr, Pot, Asking, Through, Mood, Wants (motivation), Exception, Sign.
- **Asking price is personalized** (`askFor`):
  - Money: +10% (+20% if age ≥30).
  - Winning: −10% (−20% if age ≥30) when the user's team is top-6 in its conference, +15% for vets otherwise.
  - Fame: scales with market size.
- **Signing paths, in order:** God Mode → Bird rights (own expiring players in the offseason) → cap space → veteran minimum ($3.87M) → non-taxpayer MLE ($15.0M, once, must stay under the 1st apron).
- Roster ≤15 during the season.

### Draft
- **Class tabs:** current year (live draft) plus the next two years (early look, rating ranges).
- **Current-class bar:** status and your next pick, Sim to my pick, Auto-draft the rest. Outside the Draft phase it explains that the draft opens after the playoffs and lottery.
- **Advice** (current class, needs a pick):
  - **Ask scouts:** highest projected ceiling among players likely still available at your pick.
  - **Ask assistant GM:** best fit for your Thin roles vs best available.
- **Left column:** first-round order (with "via") or your future picks.
- **Board columns:** Rk, Prospect (flag), Pos, Age, Playing for (club + league), Hgt, Ovr, Pot, Draft.
- **Margins:** `estimate = true value + noise × spread`, where `spread = (yearsOut·5+3) × scoutBudgetFactor × regionFactor`.
- **Rookie contracts** by pick: $2.9–13.8M for 4 years.
- **AI picks:** best available with light randomness; promised players are skipped 60% of the time unless top-3.

### Shortlist
- Create and delete custom categories. Add a player to a category from the Player modal chips.
- Each category lists flag, name, team (link), pos, age, ovr, pot, contract or asking, Remove.

### Scouting
- **Regions table:** 8 regions with Tier 1–3, typical archetypes, prospect counts across 3 classes, coverage, and margins now and in 2 years.
- **Scouts:** 4 named scouts (specialty, skill 1–5 stars, assignment select).
  - A scout working his specialty: factor .45; outside it: .75; both × (1.2 − skill·.08).
  - An uncovered region: 1.25.
- **Draft promises** (max 2) and the agent reputation meter.
  - If a rival drafts a promised player: loyal → boycott (goes overseas, +3 reputation); ambitious (Money/Fame) → signs anyway (−10).
  - Drafting your promised player at your pick: +5. Picking someone else there: −15. Withdrawing: −5.

### Overseas market
- Eligible: drafted, or declared and went undrafted.
- **Row:** player, club (league, country), stats abroad, projected ovr range, contract (NBA out clause $0.3–1.0M or Buyout $1.5–5.0M; the part above $0.85M is a cap hit this season), asking, Sign.
- **On signing:** buyout cash goes to Finances, and a 15-game adjustment period starts.
- **Release to play overseas** (from the Player modal): the player grows monthly abroad if age ≤29 (×1.3 if redeeming) and can return later.

### Owner
- Owner name and archetype, with a description, job security meter, budget limits, "You're fired if" list, and an expectations table with Met / At risk / Failing.
- **Archetypes:** Win-Now Spender, Frugal Profit-Seeker, Asset Hoarder, Hype Focus, Meddling Micromanager.
- `security = 60 + (win%−.5)·80 + Σ(Met +6, At risk −6, Failing −15)`.
- *Firing is displayed but not enforced yet.*

---

## 3. Modals

**Player modal** (tabs):
- **Header:**
  - face, flag and represented country (link), position, team (link);
  - name | native script;
  - bio line: "Age · height · weight · Drafted YYYY in round R, pick #P, overall #O – out of Club, Country" (or "(NCAA)" / "Undrafted");
  - contract line, Ovr/Pot;
  - actions: Release, Release to play overseas, Trade for, Sign.
  - Shortlist chips appear under the header.
- **Overview:**
  - **Background:** Health (injury plus history count), Born (city, state/region, country → link), Represents (link), Draft class (link → class modal), Eligible for (each country a link, with reason: by birth / through parents / naturalized).
  - **Ratings** in 3 groups with bars.
  - **Scouting report** for prospects and overseas players: margin, strengths and weaknesses, plays-like comparison (nearest rating shape in the league), intangibles once scouted well, promise controls.
  - **Personality:** motivation, traits.
  - **Happiness** (own players): a breakdown of factors — team success, role, No. 1 option, touches, pay, extension, market, loyalty, professional; volatile ×1.4, professional ×.7.
- **Contract:** salary, through, type, Bird rights (Full ≥3 years / Early 2 / Non-Bird), service, max tier (25/30/35% of cap at 0–6 / 7–9 / 10+ years), status (restricted FA with a qualifying offer of about 135% of salary for rookie-scale players, unrestricted with Bird re-sign limits).
  - **Extension offer:** years and amount sliders.
    - Rookie scale: up to 5 years, eligible when exp = next season.
    - Veteran: up to 4 years, first year ≤140% of current salary, eligible if exp ≤ next season and ≥2 years with the team.
    - The ask is set by fair value × motivation × mood. Players who want out refuse.
- **History:** season-by-season (pre-draft club seasons included), face JSON, download all faces as JSON.
- **Edit player** (God Mode only):
  - name and native script, represents, motivation, team (force-move anywhere);
  - age, ovr (shifts all ratings), pot, salary, contract through;
  - all 15 ratings, the traits;
  - heal / minor injury / major injury.
  - Locked: IDs and past-season stats.

**Team modal:** logo placeholder (initials), record/streak/L10, market, direction, owner + archetype + GM, payroll status, roster, picks owned, Propose a trade. God Mode adds rename region/name/abbr.

**List modal:** Country (everyone who represents it; born column) or Draft class (in pick order or board rank).

**Dialog:** confirm sign / release / release overseas.

---

## 4. Season cycle (engine)
1. **Regular season:** 82 games; every team plays daily. The sim stops at 82.
   - **Daily:** AI transactions (35%), injury ticks, games-played counts, adjustment countdown. On a month change: development report and overseas growth.
2. **Play-in** (per conference): 7v8 winner = seed 7; 9v10 winner plays the 7v8 loser for seed 8.
3. **Playoffs:** 1-8 / 4-5 / 3-6 / 2-7, re-paired within the conference by seed. Best-of-7, home court 2-2-1-1-1. Finals home court goes to the better record. The champion is added to history.
4. **Lottery:** non-playoff teams with odds 140,140,140,125,105,90,75,60,45,30,20,15,10,5 (per 1000); the top 4 are drawn, the rest go in record order, then playoff teams.
5. **Draft:** first round only. User picks, AI picks, promises resolved.
6. **Free agency:**
   - AI draftees join their rosters; boycotters go overseas.
   - Extensions take effect.
   - Expiring deals: AI re-signs 55% at fair value, the rest become FAs (users' own players carry Bird rights).
   - The MLE resets. AI fills rosters day by day.
7. **Preseason:**
   - Season +1; players age a year.
   - **Growth:** half of the annual curve, plus a coaching bonus for the user. Stunting: age <24 with ≥3 minor injuries → −2 growth and −1 to −3 potential.
   - Retirements (age ≥35).
   - Undrafted prospects go to FA. The next class is promoted (HS → college, U18 → senior). A new class is generated with the nationality weights.
   - New season of pick assets; expansion if enabled (+2 teams, expansion draft of 1 player from each team outside its top 8, cap and aprons +2%, +2 prospects).
   - AI rosters trimmed or filled to 13–15. Season stats re-estimated (usage-gated: `98.8 × min/48 × USG × TS × 2`).
   - New 82-game schedule; records reset; repeater-tax history recorded.
   - The user must be at ≤15 players to start.

## 5. Injuries
- **Per game, per rotation player:** `.0045 × (1 + max(0, age−27)·.05) × (1.45 − endu/100) × (1.25 − stre/200) × (min/30) × (1.8 if prone)`.
- **Severity:**
  - 3% major (torn ACL / ruptured Achilles, 70–130 games; −3 to −6 spd/jmp/stre, −2 ovr).
  - 12% moderate (8–21 games).
  - 85% minor (1–6 games; counts toward stunting).
- The health budget shortens the user's recovery times.

## 6. World generation
- **Teams:** 30 made-up teams (fictional city + nickname; original logo placeholders only — no NBA marks). Market multiplier per team; owner/archetype/GM names.
- **Rosters:** 14 players per team with a positional template of 5 G / 4 W / 5 B. Salaries are scaled so the user's payroll is $178.4M.
- **Nationality:**
  - Heritage country from the weights.
  - Scenarios: diaspora players born in the US/CA, South Sudanese heritage born in Kenya and raised in Australia or the US, Africans raised in the US/FR/ES, military-base births, Europeans raised in the US.
  - Eligibility from birth (jus soli countries), parents, and naturalization.
  - Race, and therefore face, follows heritage. Name pools follow heritage.
  - Native script for Chinese (with tone marks), Korean, Japanese, Greek, Georgian, Hebrew and Serbian Cyrillic.
- **Pre-draft pipeline:** US → NCAA; Europe → mostly real clubs by league (EuroLeague, ACB, ABA…); Australia/New Zealand → NBL or NCAA; China → CBA; and so on. Future classes → U18 or high school.
- **Faces:** custom, deterministic per player ID (`face(pid)` → JSON: skin, head, hair style/colour by heritage, eyes (narrow for East Asian), brows, nose, mouth, facial hair (none under 21), ears, grey hair for some players 33+). Rendered as SVG with jersey team colours. **Do not use facesjs.**

## 7. Not built yet (next for Claude Code)
1. **Contract incentives:** availability, stat, team and award bonuses; likely vs unlikely cap accounting; stat-padding events.
2. **Job market and firing:** enforce the owner fire conditions at season end; vacancies screen; incoming offers; switch teams.
3. **Multi-team control:** save setup with "Select managed teams". Replace every `tid 0` assumption with `managed: Set<tid>` and an `activeTid`. Add a multi-team dashboard, God Mode take-over / abandon, and AI takeover driven by owner archetype.
4. Awards (MVP, ROY, DPOY, 6MOY, MIP, All-League); full per-game stat accumulation (replace estimated season stats with live box-score totals); persistence (IndexedDB save files); custom logo/face uploads in God Mode; injuries inside Live Game.

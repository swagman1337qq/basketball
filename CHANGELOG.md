# Changelog

Every change to Basketball Manager, newest first. The game shows this page under **What's new**.

## 2026-10-01

### Added
- **Two new ratings: Blocks and Steals.** They're shown under Skill on every profile, and you can edit them in God Mode.
  - Blocks are timing and leap. Steals are quick hands. Neither is the same as Defensive IQ, so a player can rack up steals without being a good defender, like Luka.
  - Existing players get theirs from their body, quickness and length, and their overall doesn't move.
- **Racking up blocks takes everything at once.** That means the Blocks rating plus height, wingspan, jumping, lateral quickness and positioning (Defensive IQ). One weak spot holds the total down. Nothing is capped: block leaders land around 3 a game, like the NBA's best.
- **Gamblers hurt the defense.** A player whose Blocks or Steals run well ahead of his Defensive IQ leaves his spot to go for the play. He gets the blocks and steals, but the shots he doesn't reach are easier (think Hassan Whiteside).
- **Defensive three seconds.** Bigs who can't read the play get called for camping in the lane. The other team shoots a technical free throw and keeps the ball.
- New badges: **Shot Swatter** (Blocks) and **Defensive Anchor** (Defensive IQ). **Pickpocket** now comes from Steals, and **Rim Protector** from Blocks and positioning.

### Changed
- **Defensive IQ now means positioning.** Rotations, help defense, staying in front, reading the play. A lineup's Defensive IQ makes every shot harder, and low Defensive IQ means more fouls.
- **Offensive IQ now means decision-making.** It covers shot selection, cutting at the right time, knowing when to pass and when to shoot, and turnovers.
  - A smart player the defense keys on makes the read and gets a better shot.
  - An alpha (or a player on a heat check) shoots over the double team anyway, Kobe-style.
  - High-IQ teammates also lead to more assisted baskets.
- The Aggressive defense scheme now suits teams with quick hands (Steals), not just Defensive IQ.
- Scouting reports describe the new ratings: shot-blocking, hands, positioning and decision-making.

- **Pre-Free Agency, a new offseason step between the draft and free agency.** When the draft ends, click "Start Pre-Free Agency". The Pre-Free Agency screen shows:
  - **Player options:** whether each of your players opted in or out (the player decides).
  - **Team options:** Exercise or Decline.
  - **Expiring contracts:** Re-sign now (opens his Contract tab to negotiate an extension), Re-sign in free agency (keep his Bird rights and cap hold), Qualifying offer (makes a young player restricted), or Don't re-sign (his rights are renounced and his cap hold comes off your books).
  - **Extension candidates:** Extend or Don't extend. Extend gives you a reminder on July 6, when the window opens.
  - Recommended choices are marked ★. Free agency won't open until every team option and expiring contract has a decision.
- **You're told how every offer turns out.** A popup says whether the player signed with you or turned you down (and why), whether his team matched your offer sheet, and later if he signed somewhere else.
  - You also hear when your own free agents sign elsewhere, when another team gives one of your restricted free agents an offer sheet, and when your restricted free agents accept their qualifying offers.
  - When free agency opens, the popup lists every contract of yours that expired, the options decided, and whose rights you renounced.

- **You can make any offer the league allows, even one the player's camp says no to.** The signing button now says "Make the offer anyway" instead of being greyed out, and a turned-down offer shows up as "Declined".

### Fixed
- **Russia now has leagues in the player editor.** Pick Russia under "Playing for" / "Came from" and you get the VTB United League (CSKA Moscow, Zenit, UNICS Kazan and the rest) and Super League 1. Leagues were also added for Ukraine, Belarus, Kazakhstan, Poland, Czechia, Hungary, Romania, Bulgaria, North Macedonia, Austria, Estonia, Belgium, the Netherlands, Portugal, Denmark, Sweden, Venezuela, Uruguay, Lebanon, Iran, Taiwan, Egypt, Tunisia, Morocco, Nigeria, Senegal, Rwanda and Cameroon.

## 2026-09-30

### Added
- **Auto button for each Finances budget.** Auto sets that category to a recommended level and keeps adjusting it as your record and revenue change. Hover it to see the recommendation.
  - Spending follows your revenue compared with the rest of the league, then your owner (frugal owners spend less, win-now owners more, hype-focused owners more on facilities) and your roster (rebuilding teams scout more, young teams get more coaching).
  - Ticket price is set to bring in the most ticket money while keeping the arena at least 80% full (90% for a hype-focused owner).
  - **Auto all** puts every category on Auto at once. Moving a slider takes that category off Auto.

### Changed
- **Finances budgets are sliders from 0% to 100%.** 0% is the least you're allowed to spend and 100% the most. The dollar amount (or average ticket price) sits under the percentage in gray and moves as you slide.
- **Owner payroll orders happen only in the offseason, and you get warned first.** No more fire sales in the middle of the season.
  - When free agency opens, an owner whose payroll ceiling you're over tells you in your inbox how far over you are and gives you until opening night to fix it. The top bar keeps reminding you through the summer and training camp.
  - You can trade or waive players to get under (waived salary still counts as dead money).
  - If you're still over on opening night, he orders the fire sale then, before the first game. The worst-value contracts are traded for nothing to teams with the room, and the other team waives a minimum-salary player if it needs the roster spot.
  - Rookie-scale players and your two best players are never dumped. Nobody is ever cut into nowhere again.
- **Transactions shows this season only.** That's everything since free agency opened (the NBA's league year), in order. Older moves are on each player's Transactions tab.
- **Schedule moved to the Team section** of the menu.

### Fixed
- **A player lost in a fire sale is back.** When no team could take a dumped contract, the old fire sale removed the player from your roster without sending him anywhere, so he vanished (and so did his record). Players lost that way return to free agency when you open your league, and it can't happen again.
- **Changing who a player represents now updates "Eligible for".** Picking a new country under Edit player → Identity → Represents (or applying a player card from another country) used to leave his old country as his only eligibility, so he represented a country he wasn't eligible for. His eligibility is now redone from his new birthplace and heritage (e.g. Mexico, citizen by birth); countries you added by hand stay, and Undo puts the old list back.
- **Blank screen on some players' profiles** (e.g. sons of former players, like Brett Stroud Jr.): the season-end cleanup was trimming retired fathers from before the league began down to a name only, and drawing that father's headshot crashed the page. Fathers and brothers are no longer trimmed, fathers already trimmed in your league get their heritage and look back from their sons, and a headshot with missing details now draws with a default look instead of blanking the screen.

## 2026-09-29

### Added
- **Pick protections and pick swaps in trades:**
  - **Protections:** select a first-round pick in a trade and choose a protection (top-1, 3, 5, 8, 10, lottery / top-14, or top-20). If the pick lands inside it on lottery night, the team that traded it keeps it, and it rolls over to next year's first with the same protection. After two rollovers it conveys unprotected, and if next year's first is already gone, a second-rounder goes instead. Protected picks show it in their name (e.g. "2028 1st (via NY) · top-10 protected").
  - **Swap rights:** each side of the trade screen lists first-round swaps for the coming years. The team holding the right swaps its first for the other team's if the other one lands higher. A pick that stays home under its protection can't be swapped that year.
  - Other teams value both: a protection makes a pick worth less to them (more so if it's likely to land inside it), and a swap is worth more the worse the other team looks. Everything is settled on lottery night and written in the league log; team pages list swap rights.
- **Owner biographies** (Owner screen): who your owner is, how they made their money, what they're worth, and when they bought the team and for how much, written to fit their personality. Below it, **Owners around the league** lists every owner, richest first, with a search box and a filter by kind (fan first, passionate, profit first, institutional investor); click one to read the bio. A few owners are written by hand: **Panny "Mac-Pan" Macquiao** (Chicago: boxing legend turned media mogul), **Mao Ying** (Los Angeles: from Nanping to a renewable-energy fortune, fans and community first), **Tanner Matthews** (New York: profit first, the team is just an asset) and the **Aurelian Public Investment Fund** (Vancouver: a pension fund for nine million teachers, nurses and firefighters; patient and protective of its picks). In existing leagues they take over those teams unless you run them. New owners after a sale get a bio too.
- **All-Stars:** at the break in mid-February each conference names 12 All-Stars: five starters (two guards, three frontcourt: the fan vote, where fame and market count) and seven reserves (the coaches: production and winning). Then East plays West, with an All-Star Game MVP. You'll find them on the Awards screen, in the league log and the Press room, on the Accolades tab ("3× All-Star"), with a ★ by the season in a player's stats, and they count toward the Hall of Fame.
- **Stats laid out like Basketball-Reference** (player profile → Stats, and Stats → Players):
  - Season, Age, Team, Lg, Pos, G, GS, MP, FG, FGA, FG%, 3P, 3PA, 3P%, 2P, 2PA, 2P%, eFG%, FT, FTA, FT%, ORB, DRB, TRB, AST, STL, BLK, TOV, PF, PTS and an **Awards** column ("MVP-4, AS, NBA1": voting finishes, All-Star, All-League / All-Defensive / All-Rookie teams; winners in bold).
  - League leaders are in **bold**, per game or in totals. Traded seasons show a "2TM" line plus one line per team, with a career line and career lines with each team below.
- **CCP stats tab:** players who've played in the CCP get an NBA / CCP switch on their Stats tab, with the same per-game, totals, shooting and advanced tables. It's greyed out for players who never played there.
- **Box scores:** starters' names in bold, each stat's game high in bold (the number, not the player), and every player's flag.
- **God Mode · Daily schedule** (League menu, in pink): browse the schedule day by day and click a team to make it win, your own games included. Picked games are still played out with a real box score; the picked team just ends up on top.
- **God Mode · happiness:** a "Make happy" button on each profile, "Make everyone happy" on the Roster, and a happiness slider (0–100) in Edit player, with "Back to normal".
- **God Mode · freeze attributes** (Edit player → Status): a frozen player never improves or declines (no monthly growth, yearly aging changes or injury losses); he still ages.
- **God Mode · Force extension** (profile → Contract): he signs the terms you entered, whatever his mood, his ask or the CBA limits.
- **Trade screen cap bar:** a salary bar above the trade that moves as you add or remove players, with a tick where your payroll is now. Under "Payroll after", a **Cap space left** box says how much room is left until the cap, the luxury tax, the 1st apron and the 2nd apron (or how far over you'd be), and flags your hard cap if you have one.
- **Ask for advice (Trade):** your assistant GM gives his read on the deal you're building ("Fair deal. They'll say yes.", "Way too unrealistic. They'll ghost you.", "They'd accept in a heartbeat. We're the ones getting ripped off.") and on offers from other teams ("Take it. This is a steal.", "We're getting ripped off. Hang up the phone."), with the reasons: best player each way, the age swing, picks and payroll. It updates as you change the deal.
- **Cap easy mode** (Settings): no 1st or 2nd apron and none of their rules. You keep the soft cap and its exceptions, Bird rights, the luxury tax and repeater tax, and one hard cap (at the old 2nd apron) that no team can go over. The cap bars show Cap, Tax and Hard cap.
- **Change jersey numbers:** click the number on a player's profile. You can do it for your own players; in God Mode (in pink), for anyone. Taking a teammate's number swaps the two.
- **Cut players from the Roster and Contracts screens:** a red "Cut" button opens the same waive / stretch / buyout dialog as the Cap sheet.

### Changed
- **Stats tables look even more like Basketball-Reference:** the All-Star star next to a season is now a small gray ★, and every award in the Awards column (MVP-4, AS, NBA1…) is a link to that season's Awards screen, from a player's profile and from Stats → Players.
- **Injuries happen as often as in the real NBA.** Rates now follow the NBA's own injury database (Mack et al., *Sports Health* 2024, seasons 2013-14 to 2018-19): about 35 injuries per 1,000 player-games and 6.2 game-missing injuries per 10,000 player-minutes. Before this, the game had about a tenth of that.
  - A team now gets about 30–35 injuries a season. Roughly a third cost games (about 12–13), and teams lose about 100–120 player-games a season to injury.
  - Most are day-to-day knocks he plays through at reduced strength. Some are short absences (1–8 games), a few are multi-week (sprained MCLs, stress fractures, torn meniscus, 8–25 games), and ACL / Achilles tears happen about six times a season across the league.
  - Minutes, age, fatigue, low endurance or strength, and the injury-prone trait still raise the risk. Young players now need four missed-game injuries in a season (was three) before it dents their potential.
- **New York's owner is now Tanner Matthews**, with his full biography: a president's son-in-law who used the connection to make a fortune from wars and famine, and bought the team purely as an investment. Leagues that had Kared Jushner switch to Tanner Matthews.
- **Playoff rotations shorten, like the real NBA:** in the playoffs coaches play about eight guys and ride their starters (38–41 minutes); in an elimination game, seven. The 2023 Nuggets won the title with an eight-man rotation. In test seasons, teams went from 9.3 players with 10+ minutes a night to 8.2, and top players from 32 to 37.5 minutes.
- **Rating labels are relative to the league:** Elite now means the top 3% of NBA players at that skill, Great the top 12%, Good the top 30%, Average the middle 40%, Below avg the next 20% and Poor the bottom 10%. The line on each bar marks the league median, and hovering a rating shows "better than X% of NBA players". A 60 in dunking and a 60 in passing no longer mean the same thing.
- **Every player has shot tendencies now**, from his skills and personality, not just cards: a big with no range almost never shoots threes, a spot-up shooter who can't dribble takes his threes from the corners and rarely drives, a poor mid-range shooter avoids it, and heat checkers, alphas and ball-stoppers take more of their own jumpers, while team-first players take more catch-and-shoot threes. Tendencies set in God Mode or on a card still win. League averages barely move (about 112 points a game).
- **Louder team colors.** 15 teams wear loud colors (hot pink on black in Las Vegas, purple and neon green in Charlotte, highlighter yellow in Brooklyn, axolotl pink and turquoise in Dallas...). Three are ugly on purpose: Cincinnati wears Pantone 448 C, "the world's ugliest color" (the drab brown on plain cigarette packs), with mustard; St. Louis wears puce and chartreuse; Richmond wears olive drab and dusty mauve. The rest are brighter takes on classic sports colors. Existing leagues update too, unless you changed a team's colors yourself.
- **Media outlets renamed:** Bleacher Retort is now **Oohay! Sports**, Sports Illiterated is the **Plymouth Times (PYT)**, and Fox Spurts is **Waystar RoyCo. Sports (WAYA Sports)**.
- **Preseason roster count** now reads like "21/15 standard contracts · you can carry up to 21 until opening night", with "You'll need to cut 6 players when the regular season starts". The number goes down as you cut.
- **The draft marks your turn:** when your team is on the clock, the banner and your pick get a thick green border and read "You're on the clock", so they stand out from other teams' picks.
- **Phase buttons open their screen:** Start the play-in, Start the playoffs, Run the lottery, Open free agency and Open training camp take you to that screen.

### Fixed
- **Owner backgrounds make sense:** an owner's hometown now fits their name (a Rosenthal grows up in Brooklyn or Skokie, a Nakashima in Honolulu, an Okoro in a Nigerian immigrant family in Houston), not a random city anywhere in the world. Owners who bought a team in a sale made their money in the business the announcement described. Panny Macquiao, Mao Ying and Tanner Matthews keep their own stories.
- **National-team eligibility follows edits:** changing where a player was born or raised, or his heritage (e.g. from the U.S. to Mexico), now redoes the countries he can play for. Countries you added by hand stay.

## 2026-09-28

### Added
- **Teams get sold.** When free agency opens, an owner may sell the team or a controlling stake. The odds match the real NBA:
  - Each team has about a 5% chance a year, one or two sales a league-year. The NBA has had 20–25 change-of-control sales since 2010 (RotoWire, Front Office Sports).
  - Losing teams sell more often, and a new owner spends a little more in his first year. In test leagues, sold teams won about .033 more of their games the next season, and about 60% improved, close to the real NBA (+.039, 60%).
  - The new owner can be a different type, with new demands, a new budget and new firing conditions. Prices run from about $3B for small markets to $10B+ for the biggest, rising with league revenue.
  - AI teams' new owners often bring in their own GM.
  - If your team is sold, you get a message in your front-office inbox. Your contract stands, and the new owner gives you his first full season before judging you. The Owner screen shows when he bought the team, what he paid, and every past ownership change.
  - Sales also show up in the Press room and the league log.
  - Settings → Team sales: Off, Realistic (default) or Frequent (about 15% a year).
- **Negotiate your own GM contract** (Career screen): when your owner offers a new deal or an extension, you can accept it, decline it, or send a counter-offer with the number of years (up to 5) and the salary you want.
  - If your ask is within what he'll do, he signs it on the spot. If not, he comes back with his best offer, or only part of the way if you ask for far too much.
  - Owners give more when they're happy with you (job security) and when your reputation is high. A win-now spender pays up, a frugal owner barely moves, an asset hoarder likes long deals and a micromanager short ones. A longer deal can cost a little a year.
  - You get two counters, then his offer is final. Overreach twice on an early extension and he may pull it off the table (an expiring deal always stays on the table).

### Changed
- **Owners are more patient before firing you.** You can't be fired after your first season with a team, and every firing condition is gentler:
  - Job security has to drop below 10 (was 15), and it falls more slowly after a losing season or a missed demand.
  - Win-Now owners fire you after missing the playoffs three seasons in a row (was two).
  - Frugal owners fire you after losing more than $5M three seasons in a row (was two seasons without a profit), or for paying the luxury tax two seasons running or a single tax bill over $25M (was any tax at all).
  - Hype owners only fire you when attendance stays under 70% for a whole season; Meddling owners when you bench their favorite for 35+ games; Asset Hoarders when you hold no first-round picks at all.
  - The owner's page lists the new conditions.

### Fixed
- **Free agency navigation:** "Next day", "Next week" and "To July 6" now take you to the Free agency screen. From any other page (a profile or box score included), the sim button reads "Go to free agency". The phase names in the top bar and the menu now also close an open box score (it used to stay on screen), and "Go to draft" also shows when a profile is open over the draft.

## 2026-09-27

### Added
- **Two more personality traits:**
  - **Road villain:** feeds off hostile crowds; the boos and mocking on the road fire him up. He shoots better and wants the ball more away from home, with none of the usual road slump. It's the opposite of Crowd-fed.
  - **Fearless:** superstar mentality. He demands the ball in crunch time and pressure never rattles him.
  - A few generated players have them; toggle them in God Mode or on a player card. The Luka Dončić rookie card is now a Road villain and Fearless (no longer Crowd-fed), in saved card libraries too.
- **Player cards** (God Mode → any player, draft prospects included → Edit player → Player cards): a card is a whole player build: name, bio, ratings, potential, intangibles, personality traits and shot tendencies.
  - **Start one** from a blank template, from the player you're editing, from any player in the league (search by name), or from a card file or pasted JSON.
  - **Edit every field**, with the overall and badges updating live.
  - **Save** it to your card library (kept in your save), duplicate it, download it or copy its JSON.
  - **Apply** it to the player: he keeps his team, contract, stats and history (a draft prospect stays in his class), and "Undo last apply" puts him back.
  - Comes with a ready-made **Luka Dončić – Rookie year (2018–19)** card, tuned so a simmed rookie season lands close to his real one (about 21–22 points, 7 assists, 3 turnovers, 33% from three). Like every card, you can edit it.
- **Two new personality traits that change how a player plays:**
  - **Flashy:** no-look and behind-the-back passes. A few more assists, a lot more turnovers.
  - **Heat checker:** hit two in a row and he wants the ball every trip, pulling up from deep. Hot streaks get hotter, but the heat checks don't always fall.
  - **Volatile** players now also show it on the floor: after three straight misses (or a miss while down big) they force bad, contested shots out of frustration.
  - Some generated players have them; toggle any trait in God Mode.
- **Shot tendencies in God Mode** (Edit player → Tendencies): how often he shoots at the rim, from mid-range, from the corners and above the break, how often he draws shooting fouls and how loose he is with the ball, on top of what his ratings suggest. Build real players' shot diets, like rookie Luka Dončić's many threes and free throws.
- **U.S. hometowns with the state** (God Mode → Edit player → Hometown): for American players, one City field searches about 16,000 U.S. cities and towns across all 50 states and D.C., each shown with its state, next to a searchable State field. The two narrow each other: type Plano and the states are Illinois, Kentucky and Texas; pick Texas and the city list is every Texas town, still searchable. Leave one blank and it's filled in at random: Plano alone picks one of its states, Texas alone picks a Texas town, and a partial name like "Mars" in Texas becomes Marshall. Profiles and scouting reports now show the full hometown, e.g. "Marshall, Texas, United States".
- **Edit heritage in God Mode** (Edit player → Biography): pick his heritage country and his background within it (e.g. African American, Hispanic, Multiracial, Yoruba, Han; or type your own), and his look for the headshot. Picking a background gives him a matching look, which you can still change. Native American players keep their tribal-nation and mixed-race options. Heritage searches and lists follow your edits; the country he represents stays separate (edit that on the profile). Names don't change: use Generate for a new one.
- **Accolades tab on every player profile**, built from the season awards (your award formulas in Settings): a row of badges up top with the seasons each was won (e.g. "2× Most Valuable Player (2026–27, 2027–28)", "League Champion (2027–28)"), then championships (every player on the title team, even if he was hurt for the playoffs) and Finals trips, every award won with that season's stat line, Finals and conference finals MVPs, All-League / All-Defensive / All-Rookie teams, stat titles (led the league in points, rebounds, assists, steals or blocks per game, 58+ games), award voting finishes without winning ("3rd in MVP voting, 41.2% share"), the Hall of Fame, No. 1 overall pick, and the joke awards in their own "Dubious honors" box.
- **Edit contracts in God Mode** (player profile → Edit player → Contract): contract type (veteran, minimum, max, rookie scale, two-way, Exhibit 10, 10-day, hardship), this season's salary, how many seasons it runs, annual raise, player or team option, trade kicker, no-trade clause, cap hit, any extension, and his asking price for free agency. A strip shows his salary for every season of the deal. No CBA limits in God Mode.
- **Ask the assistant GM** (Free agency): press the button and your assistant GM picks who to sign for the season, with a short reason for each (where he'd rank on your roster, last season's numbers, what he's asking and how you'd pay for it). A contender gets players who help now, a rebuilding team gets youth and upside, and everyone gets the thin position filled; he only picks players you can actually afford, and he suggests up to two two-way prospects. His picks are highlighted and everyone else is dimmed, and it stays that way while you page, sort and filter until you press the button again.
- **Free agency filters:** set a range for age, overall and potential (e.g. age up to 21, overall under 60, potential 60 and up), a maximum asking price, and a position (guards, wings, bigs or one spot). **Players you can sign now** hides everyone you can't sign today (no cap room or exception that fits, roster full, hard cap, two-way limit); **Show every player in free agency** brings them back; **Reset all filters** clears everything. Your filters stay set when you leave the screen.
- **Roster count on Free agency**, by NBA rules: up to 21 standard contracts in the offseason (Exhibit 10 camp deals included), cut to 15 by opening night, plus 3 two-way players. The header shows your open spots correctly (it used to always count against 15 and included two-way players).
- **Convert contracts from the Roster screen, the player's Contract tab and the Cap sheet.** Every conversion the NBA allows is there:
  - **Two-way → standard:** the minimum for his years of service (or his current salary, if higher). He needs an open spot on the 15-man roster; he then counts against the cap, can play in the playoffs and can be extended.
  - **10-day or hardship → rest of the season:** a standard minimum deal through the end of this season, so he no longer runs out.
  - **Exhibit 10 → two-way**, or **keep him** on a guaranteed standard deal now instead of waiting for opening night.
  - The Contract tab explains each option; if a move isn't allowed (roster full, hard cap), it tells you why.
- **Stats tab on every player profile** (next to Overview), like Basketball Reference: regular season or playoffs; per game, per 36 minutes or totals. Traditional stats by season with a career line, shooting (true shooting, effective FG%, three-point and free-throw rates) and FG% from all five zones against the league average, advanced stats (PER, usage, assist, turnover, rebound, steal and block rates, offensive and defensive rating, win shares, box plus-minus, VORP, on/off) for the regular season and the playoffs, and this season's home, road and last-five splits.
- **Stats in list pop-ups** (draft classes, countries, heritage, colleges, traits…): points, rebounds, assists, steals, blocks and PER per game for this season (or his latest season, in grey). Sortable.
- **Scouting briefs** (Scouting screen): tick "Let him find players himself" on any scout and tell him what to look for (shooters, playmakers, slashers, rim protectors, 3-and-D wings, perimeter defenders, rebounders, stretch bigs, athletes, size and length, upside, ready now, best available, or intangibles for hidden gems), where (next draft class, all three classes, overseas, free agents, other NBA teams, everywhere), which position and what age. Every month he fills his 8 personal slots with the best fits by his own read, and shows why he picked each one (e.g. "3PT ~58 → ~63"). A better scout picks better players; you can still assign players by hand (right-click on the Draft board, Free agency, Overseas or the Shortlist): they always come first and bump his own picks, even when his 8 slots are full. Scouts can also skip region coverage and scout only personally.
- **A full playbook of tactics** (Tactics screen), researched from how real teams play, each explained in plain words:
  - **Pace:** Slow, Balanced, Fast, Seven seconds or less.
  - **Offense:** Motion, Pick and roll, Isolation, Post-up, Triangle, Princeton, Flex, Dribble drive, Five-out, Moreyball.
  - **Defense:** Switch everything, Drop coverage, Hedge, Blitz, Ice, Pressure, Pack line, Build a wall; 2-3, 3-2, 1-3-1 and matchup zones; Box-and-one and Triangle-and-two.
  - **Press:** 2-2-1, Diamond, Full-court pressure.
  - **Rebounding:** Crash the glass or Get back.
  - **Lineups:** Small ball or Twin towers.
  - **Emphasis:** Offense first or Defense first.
  - **Intentional fouls:** Hack-a-Shaq (never in the last two minutes of a quarter, like the real rule).
  - **Clutch play:** now also Pick and roll and Hot hand.
- **Tactics guide** (Tactics screen): every tactic and playbook explained in plain words, with what it needs to work and what it practises.
- **Playbooks:** one click to play like a famous team (Seven seconds or less, Moreyball, Death lineup, Triangle, Showtime, Grit and grind, Bad Boys, Princeton, Grinnell and more), or **Let the staff choose** what suits your roster.
- **Nothing is locked.** Run any tactic; each shows how well it suits your roster and what it needs. A bad fit loses games (Moreyball without shooters misses a lot of threes), and every option is a trade-off: presses force turnovers but tire your legs, crashing the glass gives up fast breaks, zones invite threes, a box-and-one only works on a team with one scorer, the wall only on a star who can't shoot, and the Triangle's long twos only pay with elite mid-range shooters.
- **Practice reps:** players who play in a system grow a little faster in the skills it uses (threes in Moreyball, post moves in Post-up, stamina in a press), as far as their natural feel allows: a center with no touch won't become a shooter.
- **Intangibles: Feel and Poise.** Feel is vision, anticipation and processing speed (the game slows down for him); Poise is composure under pressure. Neither counts in a player's overall, but both play in every game: high Feel makes teammates' shots better and cuts turnovers, high Poise helps in the clutch, on the road and against traps. They're on every profile; for other teams' players you only get the scouts' rough read.
- **Hidden gems.** Some young players are better than anyone projects (think Draymond Green, Jae Crowder, Ben Wallace, Manu Ginóbili, Jimmy Butler, and very rarely a Jokić). Their potential climbs over two to four seasons. Most become solid rotation players, some starters, a very few stars. High Feel, Poise and work ethic make it likelier, and a sharp scout sometimes gets a gut feeling about one.
- **Search anything.** The search bar now finds more than names: type a country or nationality ("china", "chinese", "greek"), a heritage or tribe ("native", "navajo", "mixed") and it shows the top 5 players with a See all link to the full list. It also finds positions ("pg", "center"), teams ("sloths"), colleges and clubs ("duke") and screens ("trade"). Name matches show the top 5 too, so the dropdown stays short.
- **Mixed-race Native American players.** About half of Native American players now have one Native parent and one African American, white or Hispanic parent. Most of them were born off the reservation, anywhere in the U.S. or in a city near their tribe (Bangor, Tulsa, Flagstaff, Rapid City…). Their heritage reads like "Penobscot · African American · Mixed race (Native)". Some players belong to two tribal nations, one from each parent ("Kiowa & Cherokee · Native American"). Two new nations from Maine: Penobscot and Passamaquoddy. Sons and brothers carry the family's tribes and mix. In God Mode, a Native American player's editor has pickers for his tribal nation, a second nation and mixed race.

### Changed
- **"Sim to champion" is now "Sim entire playoffs".** When the champion is crowned, the owner's year-end letter no longer pops up on its own. The season bar offers **Next: Owner letter** to open it when you're ready, then **End the season** (you can always reread it on the Owner screen).
- **"Sim to next game"** is the first option in the regular-season sim menu (it replaces "Play a day"). Like every sim it leaves you on your screen, and the Schedule calendar **turns the page with the sim**: when your games move into a new month, the calendar follows so you can watch the results fill in.
- **The Schedule is a calendar now,** one month at a time (‹ › to change months, Today to jump back).
  - Each game day shows the opponent, home or away.
  - Played games show the result in green or red; click it for the box score.
  - Upcoming games show the opponent's record.
  - Your next game is highlighted with Watch and Sim buttons.
  - Play-in and playoff games are listed below the calendar, and the old list view is still one click away.
- **Trade screen: click a player's name to open his profile;** the checkbox adds him to the trade (or takes him out).
- **Box scores open as a full page** instead of a pop-up. **← Back** takes you back to where you were, at the same spot on the page. **‹ Previous / Next ›** (or the ← → keys) step through that team's games in order, regular season then play-in and playoffs, with "Game 14 · 14 of 82" showing where you are.
- **Traditional, Advanced or Both in box scores.** Advanced covers true shooting %, eFG%, three-point and free-throw rates, offensive, defensive and total rebound %, assist, steal, block and turnover %, usage %, Game Score and +/−, all from that game alone. Your choice is remembered.
- **Playoff bracket round names sit right on top of their series** (West · R1, West · Semis, Finals…) instead of in a row across the top.
- **Sim buttons no longer move you to another screen.** Play next game, Play a day and the rest play in the background and leave you where you are (Watch your game is still in the sim menu if you want to watch it live). Starting the play-in, the playoffs, the lottery or free agency also keeps you where you are. To jump to a phase, click its name in the season bar at the top (Play-in, Playoffs, Lottery, Draft, Free agency, Preseason).
- **After the lottery the main button reads "Go to draft"**, with Sim one pick and the rest in the menu. Once you're on the draft board it goes back to the pick options.
- **Your team's row is highlighted in the lottery**, in both the draw and the results (a full-width band with an accent edge), so you can spot your pick at a glance.
- **Your playoff games are colored:** in your series the game buttons (G1, G2…) are green for wins and red for losses.
- **Luka Dončić rookie card retuned to his real shot chart** (2018–19 shooting splits: at the rim, 3 ft to the arc, threes). Simmed over 8 leagues his rookie year now comes out at about 21.6 points on 17 shots, 42.9% from the field, 3.4 shots a game at the rim (65%), 6.6 from 3 feet to the arc (42%), 7 threes (33.5%), 6.5 free throws (72%), 7.3 rebounds, 6.2 assists, 3.5 turnovers, a 19.2 PER and 54% true shooting, within a few percent of the real line. An unedited copy in your saved library updates too.
- **New shot tendency: "Assisted on his makes."** Self-creators like rookie Luka (only 27% of his makes were assisted) create their own shots, so teammates don't pick up assists they didn't earn. Set it in God Mode's Tendencies or on any player card.
- **God Mode is pink.** Every God Mode control now shows in hot pink, and none of them appear when God Mode is off:
  - the Player cards and League editor tabs;
  - Edit player (tab and button);
  - Take over, Force accept, and team renaming;
  - national-team eligibility editing;
  - the "God Mode" signing notes, and signing past the rules;
  - the true-ratings notes.

  A pink **God Mode** badge sits at the top of every page while it's on (click it to go to Settings).
- **Player card ratings in three blocks:** Physical, Technical and Mental, with potential on its own line. Much easier to read.
- **Back button in Player cards:** open it from a player's Edit player tab and "← Back to [player]" returns you there. After you apply a card, "open his profile →" takes you to him.
- **Player cards now have their own tab**: Management → **Player cards**, shown in God Mode pink. It's there only while God Mode is on and disappears completely when you turn it off. Pick the player to apply cards to at the top (anyone: rosters, free agents, overseas, draft prospects). Edit player has a shortcut that opens the tab with that player already picked.
- **The Birmingham Vulcans replace Pittsburgh** in new leagues. Birmingham is a cradle of the civil rights movement, majority Black, a blue city, and a small market with fiercely loyal fans and no big-four pro team. Their colors are rust and furnace orange, with a hammer crest for the Vulcan statue and the city's iron and steel past. Their minor-league affiliate is the Bessemer Marvels, named for the steel town next door. Birmingham plays in the Southeast and Nashville moves to the Central. Pittsburgh is still available as an expansion team. Leagues you've already started keep Pittsburgh (rename or relocate it in God Mode's League editor if you like).
- **Assists and turnovers now spread like the NBA's.** The best passer on a team no longer grabs nearly every assist: league leaders now average about 8–12 a game (they used to reach 15+). Stars who have the ball all the time now turn it over like real ones (about 3 a game for 25-point scorers, up to 4 for the heaviest creators); a good handle still helps. Team totals are unchanged.
- Titles on the Accolades tab now read **League Champion**.
- **Real superstars.** The top of the rating scale stretches: superstars are 75+, All-Stars 66+ (starters and everyone below are unchanged). New leagues open with seven or eight superstars and a top ten averaging about 75–78, contenders and good teams built around one.
- **No more rating inflation.** Draft prospects now get realistic ceilings (per class, roughly 15–20 future starters, 3–4 All-Stars and about one superstar, plus the occasional generational talent and hidden gems), and potential is a real ceiling: players no longer drift past it. Before, the league slowly filled with stars (by year 15, about 90 players rated 70+ and a top ten averaging 86); now it holds steady for decades. Tested over 200+ simulated seasons.
- **Star usage and scoring like the NBA.** A typical superstar uses about 31–33% of his team's plays; one to four players average 30 in a season, a dozen average 25. The more a player shoots, the harder the defense makes it (the usage–efficiency trade-off), and elite ratings pay off a little less at the very top (an elite finisher makes about 75–80% at the rim, not 90%). A star far better than everyone around him still takes over: a 75 among 20s averages about 38.
- **A player's overall is now his skills.** It's calculated from his ratings, weighted by what matters at his position (a guard's handle and shooting, a big's size, rebounding and rim protection), plus his wingspan, on one scale for every position. Overall, skills and badges always agree: raise a skill in God Mode or through development and the overall moves with it; set the overall and every skill shifts to match. Leagues you already started are recalculated once when you load them (players whose skills had drifted from their overall move; the rest barely change).
- **Badges mark real standouts.** Every badge's bar is higher: bench players have none, starters one or two, All-Stars about five, superstars eight or nine (a 65 used to collect seven or more).
- **New leagues look like the real NBA.** Teams start in real situations: contenders built on veteran stars, good teams, capped-out teams paying above-average starters with no young stars and no cap room, the middle, rebuilders with young high-ceiling prospects, and hopeless teams with no young talent and bad contracts. Ages now follow ratings: young stars are rare and most 20–22-year-olds are still raw, so rookie classes top out around the mid-50s and the best rookie scores about 18–20 a game (not 30).
- **Usage has an NBA-history ceiling.** A star uses at most about 38% of his team's plays while he's on the floor (Luka Dončić's heaviest season; the record is Russell Westbrook's 41.7%). Only a star far better than everyone around him can go higher, up to about 52%: a 75 among 20s averages about 40, and nobody averages 50. League-wide, two to five players average 30.
- **Potential moves with real growth.** A player's overall grows by what his new skills are worth at his position (a point guard's dribbling counts far more than a center's), and his potential follows: growth in the skills his position needs raises his ceiling; growth spent elsewhere lowers it a little.
- **Team menus are alphabetical** (Roster, Trade, Stats, the league editor, a player's team in God Mode, and the CCP clubs), and the ‹ › arrows step through teams in that order.
- **Click a tab you're already on to start it fresh.** On Roster that takes you back to your own team and this season, after looking at other teams.
- **New team names.** Every team is now named for something its city is not known for at all: an object, a group of people, a word or (for a few) an animal. The Baltimore Camels, New York Hermits, Brooklyn Squares, Newark Monocles, Philadelphia Koalas, Cleveland Parasols, Detroit Oxcarts, Chicago Sloths, Pittsburgh Ballerinas, Cincinnati Narwhals, Charlotte Bohemians, Atlanta Snowplows, Tampa Sleds, Richmond Samurai, Nashville Librarians, Seattle Scorpions, Portland Sultans, Vancouver Drought, St. Louis Puffins, Denver Deep, San Diego Mittens, Oakland Barons, Las Vegas Monks, Los Angeles Strollers, San Jose Typewriters, Austin Hush, San Antonio Frost, Phoenix Chill, Dallas Axolotls and Houston Caribou, each with a new crest. The expansion teams are now the Hartford Jesters, Providence Emus, Columbus Ibex, Kansas City Sailors, Sacramento Wombats and Raleigh Gondolas. Leagues you already started switch over too, except teams you renamed yourself.

### Fixed
- The **Watch game** buttons (Dashboard, Schedule) open the live game again instead of quick-simming it.
- **"Play a month" at the start of the season now plays a full month.** It used to stop at the end of the calendar month, which on opening night (October 21) meant only 5 games. It now plays up to the same date next month (about 15 games).
- **The Schedule, Transactions and Shortlist pages were empty after the last update.** Fixed.
- The scouting report's opening line now includes the U.S. state in a player's hometown ("from Marshall, Texas, United States"), like the profile.
- **Page buttons no longer move under your mouse.** The ‹ › arrows now sit at the start of every list's pager, and the page numbers always take the same space, so clicking fast through a list never lands on a page number or "Show 25 more" by accident.
- **Free agents no longer ask for more than the max.** Asking prices now stop at the max contract for his years of service (25% of the cap for 0–6 years, 30% for 7–9, 35% for 10+), even for a Money-first or reluctant player. Players past 30 ask less each year (about 14% less at 32, 28% less at 34), because teams pay for the years ahead. Free agents in your current save are fixed when you load it.
- **Owner fire sales keep at least 13 players.** An owner-ordered salary dump could strip a roster down to 8.
- **"Watch your game" shows your game.** It used to open another team's game when you ran any team but the first one.

## 2026-09-26

### Added
- **Native American players.** Tribal nations are their own place of birth and heritage, like Han for China: a player's heritage reads "Hopi · Native American", "Navajo · Native American" or "Cherokee · Native American", he's born in a tribal town (Window Rock, Tahlequah, Pine Ridge, Kykotsmovi, Anadarko…), and as a U.S. citizen he can only represent the United States. 19 tribal nations by population (Navajo, Cherokee, Lakota & Dakota, Ojibwe, Choctaw, Apache, Lumbee, Muscogee, Blackfeet, Haudenosaunee, Pueblo, Comanche, Cheyenne, Tohono O'odham, Kiowa, Osage, Seminole, Hopi, Crow), with common names like Begay, Harjo, Locklear or Sixkiller. About one or two per league, like the NBA. In God Mode, "Native American" is in the country pickers; choosing it for Represents keeps him on the U.S. team.
- **Stop button.** While a multi-day sim runs (a week, a month, to the deadline, to the end of the season), the season bar shows ■ Stop: the day in progress finishes and the sim halts.
- **CCP games setting** (Settings): Quick results (the default) work out each development-league game from the clubs' strength and players' ratings, so sims run much faster; Full engine plays every CCP game possession by possession like NBA games.
- **The Continental Championship Pathway (CCP)**, the development league, with its own tab (Management → CCP) and a hammer-and-sickle crest. 31 clubs, one affiliate for every NBA team plus an independent, in the most remote places in the U.S. and Canada: the Utqiaġvik Polar Nights, Alert Sentinels (the northernmost settlement on Earth), Supai Mule Train (mail still arrives by mule), Monowi Ones (population 1), Fogo Island Flat Earthers, Whittier Tunnel Rats and more, each with a crest and the story of its town. It follows the G League's 2025–26 format: a 14-game Tip-Off Tournament in four regions, the Winter Showcase for the eight best, a 36-game regular season, and 16-team playoffs with a best-of-three Finals. Every game is played by the real game engine, so every player has real stats. Scroll through the clubs with ‹ ›, see each roster (CCP contracts, local tryouts, CCP draft picks, returning rights, affiliate players, your two-ways and anyone you send down) with full stats, the league-wide player list, standings, results, the schedule and past champions. Players on CCP contracts are free agents to the NBA: a Sign… button shows which deals you can offer (two-way, minimum, 10-day…). Clubs keep 10–12 players, signing new ones from the player pool when players are called up.
- **Recommended position** (God Mode editors): under the Position menu the game suggests the position his body and skills fit, mostly from height, nudged by wingspan and whether his skills are a guard's or a big's (a 7-footer is a center; a 6′9″ playmaker is a wing). It updates as you edit him; press Use to apply it, or pick any position you like.
- **Badges in the rotation** (Tactics): each player shows his top badges under his name, with the rest behind "+N". Hover a badge for what it does.
- **Ask for trade offers.** On the Trade screen, select players or picks on your side and press **📣 Ask for offers**: every team that can put together a deal it likes (one that also passes the league office) calls with its best offer, from none to all 29. Or select the other team's players and press **📣 Ask what they want**: they name every package from your roster they'd take. Step through offers with ‹ ›, marked Strong, Fair or Lowball, then **Accept**, **Decline** (drops it from the list) or **Negotiate…** (loads it into the trade builder to change). When the salary or roster rules need it, a team may ask you to add a low-value player of yours, or add a small contract of theirs.
- **Trade screen: ‹ › arrows** on either side of the other team's menu step through the league one team at a time.
- **Let assistant coaches decide** (Development tab), for one player or everyone at once. The coaches pick his training focus (the costliest gaps for his position; conditioning for veterans 31 and up) and decide between the development league and the main roster (young players outside the top ten go down for game reps and come back once they earn a rotation spot). They re-check both every month and moves show in your log. Hover the coaches' tag to see why; "Take over" hands control back.
- **Extend buttons.** Players eligible for an extension have an "Extend…" button on their profile header and on the Contracts tab (which also lists everyone eligible right now). It opens the extension offer on his Contract tab.
- **Contracts tab** (Team): your upcoming free agents summer by summer for the next four summers. Each player is marked restricted (with his estimated qualifying offer) or unrestricted, with the Bird rights you'll hold, his estimated cap hold, player and team options (and what happens if they're declined), and when he can sign an extension. Also shows offer sheets, your own free agents during free agency, and decisions due on the Cap sheet.
- **Scouting reports list:** click the "Plays like" player to open his profile.
- **God Mode: edit height and wingspan in feet and inches**, next to the numbers (the height rating and the wingspan in inches). Change either one and the other follows; wingspan moves with height. **Position** is editable too (PG, SG, G, SF, GF, F, PF, FC, C) on the profile editor and the Edit player tab.
- **Trade for players just drafted.** On draft night, a player an AI team has picked shows up in the trade screen as its "Draft rights" (and "Trade for player" on the draft board). As in the NBA, that team made the pick on your behalf: his record shows who drafted him, the rights are traded to you, and he signs his rookie deal with you.
- **Sim one pick** on draft night (Draft screen and the season bar): the team on the clock makes its pick, and you watch the draft unfold one selection at a time.
- **Scout any player you select.** Tick players (checkboxes, select all, or shift-click a range) on the Draft board, Free agency, Overseas or the Shortlist, then right-click (or use the bar above the table) to have one of your scouts follow them personally. Your read on them sharpens far faster than regional scouting alone, best in the scout's own region. Each scout can follow 8 players; a 👁 tag shows who's following whom.
- **Player progress.** The Roster shows ▲/▼ under each player's Ovr and Pot: how much he's improved or declined over the past year (to one decimal, e.g. ▲6.9, ▼1.1). His profile shows the change beside every rating, and his Development tab has a year-by-year table: overall on opening night, change during the season, over the summer, the year's total, and his biggest gains and drops. Ratings are recorded on opening night and at the end of every season.
- **Box score team names** open the team's page.
- **Full scouting report button** on a player's Overview, next to the short report, jumps to his complete Scouting report tab.
- **Box scores.** Click any score (Dashboard, Schedule, play-in games, and G1, G2… under each playoff series) to see the box score: quarter by quarter, and every player's minutes, points, rebounds, assists, steals, blocks, turnovers, shooting and +/−. Kept for the current season.
- **A new world for every league.** New leagues start from a random seed, so players, rosters, owners and draft classes are different each time. Type a seed (or press 2027 for the reference world) to replay one exactly. More owner names.
- **Leagues menu.** A "Leagues ▾" button at the top of the sidebar (also in the collapsed rail): back to the main menu, start a new league, export this one, or switch straight to another saved league. Your league is saved first.
- **What's new.** This changelog, readable in the game (League → What's new) and kept up to date with every change.
- **AI extensions.** AI teams now sign rookie-scale and veteran extensions for players worth keeping, in a July window and at the October deadline before opening night. Loyal players sign more readily, money-first players tend to test free agency, and owners won't go past their payroll limit.
- **Roster notes.** Each roster row shows how the player joined the team ("#2 pick in 2027", "Signed as a free agent in 2027", "Traded from DAL in 2028") and his latest extension or re-signing. Blank for players who were already on the roster when the league began.
- **Free agency on the NBA calendar.** Opens June 30, moratorium until July 6, Summer League in mid-July, a quiet August, camp invites until training camp on September 30. Most big names agree in the first days and the rest trickle in. Next day, Next week, To July 6, or Sim to training camp. A tracker shows the date, how many of the top 50 have signed, dated signings and the best still available.
- **Predictions tab.** Seven parody outlets make preseason picks, each with its own biases: PEEN, The Donger, Bleacher Retort, The Athleisure, Sports Illiterated, Fox Spurts and the DraftQueens sportsbook. Projected standings, win totals and title odds, champion, Finals, MVP, DPOY and Rookie of the Year picks, and a top 100 players list from each outlet plus a consensus. Locked on opening night; results appear alongside as the season plays out.
- **Mock drafts.** Draft tab → Mock drafts: every outlet's first round with a reason for each pick, and hits highlighted once the draft happens.
- **Draft board trade buttons.** "Trade for pick" / "Trade pick" opens the trade screen with that pick selected; "Propose trade" opens it with the pick's owner.
- **"Playing for" picker** (God Mode): pick a league (top tier first), then one of its teams, or type any league or team. Real leagues with full club lists for about 30 countries.

### Changed
- **Every team is named for what its city is least known for** (like the Utah Jazz or the Los Angeles Lakers): the Baltimore Cacti, New York Nappers, Brooklyn Ranchers, Newark Tourists, Philadelphia Gentlemen, Cleveland Tropics, Detroit Pedal Pushers, Chicago Doldrums, Pittsburgh Flatlanders, Cincinnati Surfers, Charlotte Speed Bumps, Atlanta Open Roads, Tampa Mountaineers, Richmond Monarchists, Nashville Mimes, Seattle Sunburn, Portland Normies, Vancouver Bargains, St. Louis Igloos, Denver Submarines, San Diego Monsoons, Oakland Lifers, Las Vegas Early Birds, Los Angeles Unknowns, San Jose Luddites, Austin Vegetarians, San Antonio Amnesiacs, Phoenix Icebergs, Dallas Minimalists and Houston Dry Heat, each with a new crest. Expansion teams too (the Providence Skyscrapers, Hartford Risk Takers, Columbus Homebodies, Kansas City Tofu, Sacramento Paupers, Raleigh Clear-Cutters). Leagues you already started switch over too, except teams you renamed yourself.
- **The CCP moves mostly to the U.S.**: its clubs now play in fading steel and coal towns (Gary Steelworkers, Flint Sit-Downers, Youngstown Black Mondays, Braddock Carnegies, East St. Louis Bridgemen), ghost towns (Picher Chat Piles, Centralia Smolder, Cairo Levees), Appalachian coal country (Welch Coal Barons, Hazard Headlamps, Matewan Feudists, Harlan Picket Lines), reservation towns (Pine Ridge Buttes, Window Rock Sandstones, Browning Glaciers) and the most isolated places around, with just four in the Canadian north. The clubs that moved out stay available for expansion teams.
- **Retired players who never played in the league are removed.** CCP-only players, undrafted prospects and anyone else who retires without a single NBA game is taken out of the database (only a name is kept, so old draft results and transactions still read correctly); they no longer appear in lists, searches or profiles. Anyone who played at least one game is kept. Saves stay much smaller over a long career.
- **Much faster.** Simulating a season takes about half as long, a week in the browser about a quarter (the screen now redraws a few times a second during sims instead of after every day), free agency about a quarter, screens build 3–6x faster and a new league is created in a fraction of a second. Retired players who never reached the NBA are stored more compactly, so saves grow more slowly. Rarely used screens load when you first open them.
- **Long lists come a page at a time**: free agency, the CCP, the draft board, transactions, stats, scouting reports, overseas, the shortlist, predictions, the Hall of Fame ballot, the press room, expansion cities and player lists (a country, a draft class, a college…). Each shows "Showing 1–25 of 300 players" with page numbers and a "Show more" button.
- **Badges follow what you know.** Your own players and NBA veterans show all their badges; prospects, rookies, overseas and CCP players show only what your scouts have seen (a sharp read shows all of them, a rough one only the best, a stranger none). God Mode shows everything.
- The G League is now called the CCP everywhere (free agency tags, the Development tab, the tutorial).
- **The five biggest U.S. cities are in the league.** New leagues now have the New York Empires, Philadelphia Bells, Chicago Gales, Los Angeles Marquees and Houston Orbit (Phoenix was already in), with big-market revenue to match. They replace five of the smallest markets: the Hartford Underwriters, Providence Jewelers, Columbus Explorers, Sacramento Prospectors and Kansas City Pitmasters, which are now expansion franchises (Settings → League expansion) with their colors, crests and G League affiliates. St. Louis moves to the Northwest. The **Richmond Liberty** (for Patrick Henry's "Give me liberty, or give me death!" speech, given in Richmond in 1775) replace the Raleigh Oaks, the league's smallest metro; Raleigh is an expansion franchise too. Leagues you already started keep their teams.
- **Trades in God Mode work like normal trades.** The other team judges your offer and the league office checks the salary and roster rules as usual. A new **⚡ Force accept** button (God Mode only) makes them accept and skips the rules.
- **Extensions follow the NBA's rules.** Rookie-scale extensions: the summer before the final year of the rookie deal, from July 6 until the day before the regular season (miss it and he heads for restricted free agency). Veteran extensions: two years after he signed (three for a five-year deal); with more than one season left only between July 6 and opening night, and in the final season of his deal any time until June 30, including during the season. Up to five seasons including what's left of his deal (six for a supermax). No extensions during the July moratorium. If he isn't eligible, his Contract tab says why and when he will be.
- **Extend-and-trade rule:** an extension with a raise of more than 5% means he can't be traded for six months.
- **Revenue sharing works like the NBA's.** About $400M a year (at today's cap) goes to the roughly 18–20 teams below the league's average local revenue, up to about $45M for the smallest markets (it was about $5M). Half of the league's luxury-tax payments fund it and big-market teams pay the rest (they now see "Revenue sharing paid" on Finances). A receiving team that doesn't fill its arena gets up to 25% less.
- **Overall and Potential rings are colour-coded** by where the rating ranks in the league, with the tier named underneath ("Starter", "All-Star ceiling"…): purple Superstar (70+), bright green All-Star (63+), green Starter (56+), white Rotation (48+), orange Bench (41+), red Fringe (below 41). Hover the tier name for the scale. Scouted Ovr/Pot in scouting reports use the same colours.
- **Scouting reports show the scouted Ovr and Pot** (what your scouts see, within their margin) instead of a separate 40–99 grade that was easy to mistake for either. The list has Ovr and Pot columns.
- **Scouting report labels match this league.** "Quality starter", "rotation player", "end-of-bench" and the rest now follow where a rating really ranks: 56+ is a starter (about the top five on an average team), 48+ a rotation player, 63+ an All-Star, 70+ a franchise player. A 56 overall was being called end-of-bench.
- **Player header:** height, weight and wingspan sit under the age, the season count under the draft slot, and points, rebounds, assists and PER are one line.
- **Development isn't a straight line.** Every player now has a hidden development year: most are normal, some are breakouts, and some go nowhere or backwards. About a quarter to a third of young players don't improve in a given season. Potential can fall too: a serious injury, a rookie who can't adapt to NBA strength or pace, a young player who stalls, or a year well below expectations. The reason appears in the Development tab's year-by-year table.
- **Scouting reports end with "The bottom line":** what he does well, what he can become, what has to develop, and where he stands in his class ("Byrd has the size, rebounding instincts and scoring punch to become a high-level NBA big. If his shooting and explosiveness continue to develop, he has legitimate star upside and is one of the elite prospects in the 2027 NBA Draft."). NBA and overseas players get one in the same style. Each part is written several different ways, so reports don't all read alike. This replaces the old "depends on development: above all, …" line.
- **Scouting reports:** "with more upside" appears only when a prospect's ceiling is clearly above his comparison's. Comparisons are closer to his projected level. Size is judged from real height and wingspan for his position, and is never named as what his development depends on.
- **Height and wingspan in development:** wingspan never changes. Height changes only with an extremely rare late growth spurt: one inch, for teenagers and 20–21-year-olds, about one player every two or three seasons league-wide, announced in Transactions. Before, the height rating crept up on its own (including in the G League and overseas).
- **Season bar:** the sim buttons are one split button. The main part runs your usual choice; ▾ lists every option (a day, a week, a month, to the trade deadline, to the end of the season…) and remembers what you picked.
- **Sidebar:** Team (Dashboard, Roster, Depth chart…) is at the top, then Management, then League, with clear dividers and gold section names between them.
- **Draft board:** your picks stand out much more (thick gold border, gold background, a YOUR PICK tag).
- **Draft advice** judges what a prospect projects into at his ceiling, not relative to his own ratings: a raw 19-year-old with a weak shot is no longer called a floor spacer, and "3-and-D wing" needs wing size.
- **Min target** (Roster) is a bigger box with large − / + buttons. It's greyed out while minutes are automatic; press Manual to set them yourself, Auto to hand them back. The column is centered.
- **Roster notes** are bigger and easier to read.
- **Development.** Yearly growth now depends on potential (players grow toward their ceiling), work ethic (hard workers improve even without minutes), minutes, G League time, coaching, training focus, the locker room, mentors, traits, a hidden development factor (late bloomers and players who peak early), the season he had, and luck. Potential is re-estimated every offseason.
- **Aging.** Decline speeds up every year after 29: about −1 a year at 31, −2 at 33, −3 at 35, −5 at 38 and −7 at 40. Athleticism goes first; shooting and basketball IQ last longer.
- **Wingspan is a rating.** 50 is a normal wingspan for a player's height; each inch longer or shorter is 6 points. It counts toward the overall (up to about ±4 for bigs, ±3 for wings, ±2 for guards).
- **Rating edits move the overall** (God Mode) by how much that skill matters for the position, and potential moves with it. "−1 all / +1 all" moves potential too.
- **Height shows feet and inches** next to the rating; changing the height rating changes his height (4 points an inch), and wingspan follows. Wingspan is editable in the ratings editor.
- **One draft order everywhere.** The draft board, the trade screen and AI pick values use the same projection, so a pick's projected slot always agrees.
- **East Asian faces** look natural: dark hair (no red or blond), mostly clean-shaven, fitting hairstyles and eyes.

### Fixed
- Trade screen: the column headings (Age, Ovr, Pot, Contract) line up with their numbers again, and the team menu no longer cuts off the team's name.
- Other GMs turning down a trade now speak for themselves ("I want young, high-upside players, and I'm not giving up our picks easily") instead of describing their own team as "they". Several ways to say it for each kind of team.
- The player header's season count includes seasons before this league began (a 2022 draftee is in season 5, not his "rookie season").
- Monthly development reports said "undefined" instead of Acc (acceleration); Layups and Box out were also missing from report and tactics labels. Old reports are corrected when the league loads.
- Tactics → training growth chart: all 18 ratings now fit on one row with their labels lined up.
- Scores from games played before box scores existed now say so on hover instead of looking clickable.
- Create your GM: the name-order choices use your own name (which part is the family name, and what the owner will call you) instead of a fixed Vietnamese example.
- Saved leagues show your own team's name and record (they showed the first team in the league).
- The name fields in Identity and Biography (God Mode) stay in sync both ways.
- The Represents 🎲 picks from every country; changing Represents moves hometown and "Playing for" to that country but leaves eligibility alone.
- Back from the Edit player tab returns to the profile you were on, not the top of the draft.

## Earlier on 2026-09-26

### Added
- Clickable season bar with "if the season ended today" play-in, playoffs and lottery views; the 2027 NBA 3-2-1 draft lottery with pick protections and a live lottery night.
- Create your GM (name, nationality, experience, race, headshot) and GM contracts with owner-driven extensions.
- An in-depth tutorial covering every tab.
- Dallas; the Basketball Manager name; one-team picker by default.
- Personality traits with scouting reads and a Selfish trait; a locker room with mentoring and hidden malleability; sortable lists everywhere.
- Player transaction history with trade trees; AI teams trade draft picks.
- Owners address family-name-first GMs by their given name; award voting details (100 media voters).
- Wingspan, layups, acceleration and box out ratings; editable hometown.
- More hometowns for every country; all 20 CBA clubs; God Mode randomizers on every field; far more face variety.
- Vietnamese names with three or four parts.
- Formula awards with advanced stats, a name generator, typed number fields, rating cap of 100, retirement age, families, Hall of Fame, the owner's year-end letter.
- Team rating, worst-roster start, badges, profile redesign; richer team crests.
- Full NBA CBA contracts and a 500-season salary cap outlook.
- About 210 countries with flags, bigger name pools, scouting reports, the stats hub, the G League, easy mode.
- Published on GitHub Pages.

## 2026-09-25

### Added
- The first version: a browser basketball GM with real simulated games, any team to pick, team crests.
- Engine realism: 2026 league baselines, bell-curve ratings, usage.
- Multi-team control, play-in and an NBA-style bracket, awards.
- Front office: owner reviews and firing, job market, press room, incentives, mandates.
- Scouting, overseas players and development.
- Player profile tabs, tactics, league stats, God Mode editors, uploads and expansion teams.

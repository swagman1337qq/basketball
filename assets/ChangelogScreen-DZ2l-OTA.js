import{t as e}from"./jsx-runtime-D3jfb0Ew.js";import{u as t,w as n}from"./index-C2ijK2dF.js";var r=`# Changelog

Every change to Basketball Manager, newest first. The game shows this page under **What's new**.

## 2026-10-05

### Changed
- **High skills are even harder to raise.** The slowdown now starts at 70 instead of 75 and gets steep fast: a skill at 75 takes in about two thirds of the growth aimed at it, at 80 under half, at 85 about 30%, at 90 about a fifth, and at 95 about 12% (it used to be about half at 85 and a quarter at 95). The rest goes into his weaker skills.
- **True potential is a real ceiling now.** Every player's true potential is decided once, when he enters the league, and it never changes on its own (only God Mode can change it).
  - His overall can never go past it. His skills keep improving until his overall gets there, whatever the individual skills could reach on their own.
  - The potential you see on a profile is the scouts' read. It can sell a player short but never oversell him, so it's never above his true potential, and it moves as his ratings change. Only God Mode shows the true number.
  - Hidden gems are part of a player's true potential from day one. The scouts see it surface over the years.
- **No more rocketing up a whole career in a season.** A second-round pick in one league went from a 33 to a 63 in a season and a half. His work ethic, a high hidden development factor, a breakout year and a great situation all multiplied together, to about 4.5× a normal pace. Now everything that speeds a player up together tops out at 2.5×, and the hidden factor has a smaller range. Fast developers and breakout years still happen.
- **Superstars are rare again.** Players were reaching about 89% of their planned growth instead of the intended 77%, so the league slowly filled with stars: from 5 players at 75+ to 12–15 after a decade. Growth is recalibrated, and in a 30-season test about 8 players were 75+ at any time (the top 8, roughly), with 15–20 at 70+.
- **A 99 is now about a once-in-150-seasons event.** Each summer there's about a 1-in-150 chance that one rating somewhere in the league breaks through from 98 to 99, however many 98s there are.
- **Every rating now tops out at 99, and a 99 is close to impossible.** That goes for every rating: skills, speed, strength and the rest, height and wingspan, and God Mode's editors too.
  - Players top out at 98, and getting there takes years. Near the top every point is harder to earn, so a 98 is rare too.
  - The last step to 99 is a breakthrough, almost unheard of: a rating already at 98 has a tiny chance each summer (for players 31 and younger). When it happens, it makes the league news. Expect one every decade or two.
  - Generational skills still exist, about one league in 138.
  - A perfect free throw shooter is now a 99 (it was 100) and still makes 98%.
  - In existing leagues, anything above 99 comes down to 99.
- **Box scores: a bar between the starters and the bench.** A clear line now splits each team's starting five from its bench, so you can tell them apart at a glance.

### Fixed
- **Playoffs screen scrolls smoothly again.** After the playoffs it stuttered to about 20 frames a second. The cause was the dotted underline on the small game buttons under every series (G1, G2…), which the browser is slow to draw a hundred times over. The underline only shows on hover now, and the page scrolls at a full 60 frames a second.
- **The championship banner hangs right under the Finals.** It used to sit below the whole bracket.
- **No more sneaking up to 99.** A skill could grow half a point past its ceiling, and the ceiling then moved up to meet it, so over a few seasons some players still crept to 99 or even 100. A skill now stops at 98 for good, unless it's a generational one, and a big growth year can't push one past it either.

## 2026-10-04

### Added
- **Free agency: Last team column.** Every free agent shows the team he was on last (logo and abbreviation, hover for the full name and season, click to open the team). It says "(drafted)" if a team only held his draft rights, and — if he's never been on an NBA team. Sort by it like any other column.
- **Roster: a Starters / Bench bar.** A clear bar now splits the starting five from the bench, so you can see at a glance where the lineup ends. Drag a player onto the bar to make him the first man off the bench.
- **Trade screen: filter both rosters by position.** Each roster has its own **Pos** column (sortable, point guard to center) and position buttons above it: All, PG, SG, SF, PF, C, each with a count.
  - Hybrids count for every spot they play: a G shows under PG and SG, a GF under SG and SF, an F under SF and PF, an FC under PF and C.
  - Players you've already put in the trade stay in the list whatever the filter.
- **Arrange the menu your way.** Every tab on the left (Trade, Owner, Career and the rest) can be moved:
  - **Drag** a tab onto another to put it just above that one, in that section. Drop it on a section title (Team, Management, League) to move it to the end of that section.
  - **Arrange menu** (at the bottom of the sidebar) adds ▲▼ arrows to every tab, for touch screens and keyboards. Past the top or bottom of a section, a tab moves into the next one.
  - **Reset menu** puts everything back.
  - Your menu is saved in this browser and applies to every league. It works in the collapsed icon menu and the other layouts too.

### Fixed
- **Smaller saves, and long leagues stay quick.** Retired players no longer carry their development data, and older seasons drop their home/road splits (only the current season shows them). A 30-season league's save is about 28% smaller (42 MB → 30 MB), and your current league shrinks about a quarter the first time you open it. Every simulated day also stopped re-reading every retired player's stats, as did the league leaders and advanced stats pages, so the game no longer slows down as the league gets older. Retired players' profiles keep their stats, awards, transactions and year-by-year development (the season total; the in-season vs summer split isn't kept).
- **Selfish players hand out assists again.** A point guard with the Selfish trait barely got credited with any assists: one starting point guard with good passing averaged about 1 a game for five straight seasons. The trait was cutting his assists to about a third. Now a selfish player plays like a real ball-stopper. He still takes more shots and scores more, and his assists are only a little lower. The cost falls on his team instead: less passing while he's on the floor, more of his own baskets come off the dribble, his teammates shoot a bit worse and he still coasts on defense.
- **Your lineup stays the way you set it.** When one of your players is hurt, the game parks him at the end of the roster and puts him back in his old spot when he heals. But if you'd already moved him yourself (back into the starting lineup, say), a long sim would still shuffle him back to his old spot when he healed, which looked like the roster re-sorting itself. Now a hurt player still drops to the end and goes back to his old spot when he heals, even if you've signed or traded for players in the meantime. If you moved him yourself while he was out, he stays where you put him, with the minutes you gave him.
- **AI teams no longer salary-dump top draft picks for nothing.** A salary dump looks for "bad contracts", players paid far more than they're worth. It judged worth by today's overall, so a just-drafted No. 1 pick, paid the top rookie salary while still raw, looked like the worst contract in the league: one league had a No. 1 pick dumped a month after the draft. Now:
  - Rookie-scale contracts never count as bad contracts.
  - Young players are judged on where they're headed, not only where they are.
  - A team sweetening a dump throws in its least valuable young players, never a first-round pick from the top 14.
  - The same rule covers dumps AI teams offer you. In a test league, 32 of the 46 "bad contracts" were top-14 rookies; now none are, and the 13 that remain are overpaid veterans.
- **Every AI team charged the same $118 for tickets.** Now each owner sets his own price, from demand (market size, how good the team is, the arena he's built) and his owner type:
  - **Frugal Profit-Seekers** charge the most and accept some empty seats (about 88% full).
  - **Hype Focus owners** keep prices low to pack the building (about 99%).
  - **Win-Now Spenders, Asset Hoarders and Meddling Micromanagers** fall in between (about 93–94%), and meddlers go more with their gut.
  - Every owner also has his own small pricing quirk.
  - In a test league prices ran from about $87 (a small-market loser) to $270 (a 65-win big-market team), averaging about $142, with arenas about 94% full league-wide. They move with the team's record as the season goes, like dynamic pricing.
- **AI teams' finances now use their owners' real facilities budgets**, not a league default, so League finances shows each club's actual attendance, revenue and profit.
- **Preseason projections no longer treat every team as winless.** Before any games, attendance and merchandise counted each team as 0–82, so a preseason projection read as a half-empty arena. Teams now start from a .500 projection that follows their record from game 30 on.
- **Your Finances screen compares your ticket price and Health budget with what the other teams actually charge and spend**, like the rest of your budgets already did.
- **Star playmakers no longer pile up 13–16 assists a game.** When a teammate scored, the engine credited the assist almost entirely to the best passer: passing, vision (Feel) and Offensive IQ multiplied together, so a player strong in all three took about 70% of his team's assists while on the floor. They now add up more modestly.
  - Elite playmakers assist on about 35–45% of teammates' baskets, as in the NBA.
  - The Chris Paul rookie card now averages about 9–10 assists (40% of teammates' baskets; his real AST% was 36.7). That's his 7.8 from 2005–06, adjusted for today's faster pace and higher assist rates.
  - League assist leaders land around 9–10 a game. Team assist totals are unchanged.

## 2026-10-03

### Fixed
- **Depth chart boxes line up.** A starter playing out of position had a taller box (its note could wrap onto two lines), which pushed that column's bench list down. Every starter box is now the same height, with a one-line "Out of position" note, so the five columns always align.
- **Draft picks were listed twice.** Every training camp added each team's picks two years out a second time, so the trade screen showed, for example, two 2030 firsts. The extra copies are gone from existing leagues the next time they're opened, and no new ones are made.
- **Names fit the culture they come from.**
  - **First and last names now come from the same community.** Groups that mixed Indian, Pakistani and Bangladeshi names could produce "Arif Srinivasan" (a Muslim first name with a Tamil Hindu surname); now both parts come from one. The same goes for Korean and Japanese names in Guam, Albanian and Serbian names in Switzerland, and similar cases.
  - **The Gulf states count their citizens.** Oman, Qatar, the UAE, Kuwait, Bahrain and Saudi Arabia drew most of their players from their foreign workers, who can't become citizens or play for the national team, so an "Omani" was often South Asian. Now nearly all are Omani, Qatari, Emirati and so on, with Oman's own family names (Al Busaidi, Al Harthy, Al Balushi for Omani Baloch...).
  - **A native script appears only where names are written that way.** A Moroccan gets Arabic script, but a Frenchman of Moroccan descent doesn't (French names are written in Latin), and neither does an American-born player of Lebanese descent. Vietnamese Czechs, Greek Australians and Russians in Finland lose scripts they shouldn't have had.
  - Asian American players get an American first name and the family's surname, one community at a time, instead of a Chinese given name with a Korean surname. Black Canadians and Black Britons are split by community (Caribbean, Haitian, Somali, Nigerian), so a Somali surname comes with a Somali first name. Afghanistan's Tajiks and Uzbeks get Afghan names instead of Russian-style ones, and Iran's Azerbaijanis Persian ones.
- **Long names no longer push the page around.** An unusually long name used to wrap onto two or three lines, pushing the whole player page (and roster rows) down. Now a name always stays on one line: on a player's page it shrinks to fit, then ends in "…" (the native script gives way first). Rosters, the dashboard, depth chart, draft board, free agency, trade, shortlist and scouting lists, and stat tables cut it with "…" too. Hover any shortened name to see all of it.
- **God Mode: Freeze attributes works properly and sits next to "−1 all / +1 all".** The checkbox moved from Status to the Ratings box, beside the buttons that shift every rating. A frozen player's ratings now stay exactly where they are through all development: no growth, no aging decline, and no training-camp surprise either (a frozen rookie's camp translation used to change his ratings anyway). Injuries don't cost him ratings. Your own edits still work while he's frozen. Nothing else stops: he ages, gets hurt and heals, his mood moves, and he can still retire.
- **"Swap my roster with the worst roster" no longer hands you a stash of prospects.** It took the lowest-rated roster, which was almost always a rebuilding team full of raw kids with big ceilings (often two to five, sometimes more). You still get the weakest roster on the floor, but its young players with real upside go to other teams for veterans about as good today. At most one modest prospect stays (true potential under 64), and with several teams the first still gets the very worst.
- **God Mode: True potential now goes all the way to 100, at any age.** Setting it used to stop short: Luka Dončić's card topped out around 84 and raw prospects in the 70s, because his potential was rebuilt from skill ceilings that stopped at 99 and couldn't count his height or frame. For a player 29 or older, the setting did nothing at all.
  - Now the number you set is exactly what he gets, and it holds.
  - A veteran gets three seasons to grow toward it.
  - Player cards set their potential the same way, and a manual edit afterwards still wins.
  - A bad development year no longer makes a high ceiling backfire.
  - His ratings still decide how far he actually gets: not every body can reach an overall of 100.

### Changed
- **A 99 is extremely hard to get now.** In a 100-season test, almost 500 players reached 99 in at least one skill (four had all 14). Now:
  - Every skill gets harder to raise the higher it is: a skill at 85 takes in about half of the growth aimed at it, at 90 a third, at 95 a quarter. The rest goes into his other skills, so players still improve, just not into a wall of 99s.
  - A normal player's skills top out at 97 or 98.
  - The only way to a 99 is a generational skill (think Steph Curry's shooting or Shaq's inside game) that can reach 99 or 100 if he develops into it. About one league in 138 ever gets one (a 30-season league).
  - Development still varies a lot from player to player: fast and slow developers, breakouts, busts and hidden gems.
  - In existing leagues, ratings already at 99 stay, but nobody new climbs there without a generational skill.
- **A perfect 100 at the line is automatic.** A player with a Free Throw rating of 100 now makes about 98% of his free throws, every year: José Calderón's NBA record season (98.1%) as his normal. It's a rare tier: a 99 still shoots about 92%. In a test season, a star set to 100 went 619 for 631.
- **Elite free throw shooters shoot like elite free throw shooters.** A Free Throw rating of 100 used to top out around 87%. Now a 90 makes about 90% and a 100 about 92–93%, the range of Steph Curry and Steve Nash. League-wide free throw shooting stays at the NBA's 78%.
- **Terrible free throw shooters are terrible now.** A Free Throw rating of 1 used to still make about 51% at the line. Below 40 the rating now matters more: a 20 shoots about 55% (Shaq territory) and a 1 about 40% (Ben Wallace). In a test season, a starting center set to 1 went 302 for 789 (38%). Ratings of 40 and up shoot the same as before.
- **Size matters at the rim.** Small guards used to finish layups almost as well as 7-footers (about 68% against 72%). Height and wingspan now count for much more on shots at the rim, so a 6′2″ guard makes about 64% there and a 7-footer about 73%, close to the NBA's gap. Strong rim protectors bother small finishers more, and small players get their shots at the rim blocked a little more often. A small guard with great touch (high Layups and Inside) still finishes well. League-wide scoring is unchanged.
- **Native scripts, checked name by name.** Every name in these pools now has its native form, verified against how real people write it (native-language Wikipedia, news media, federation rosters), so players from these countries always get their script:
  - Afghanistan (Dari, with Pashtun names in Pashto), Armenia, Cambodia (Khmer), Laos, Myanmar (Burmese), Iraq, Lebanon, Syria, Jordan, Morocco, Algeria, Tunisia, Sudan, Oman, Pakistan (Urdu), Bangladesh (Bengali), Nepal, Bhutan (Dzongkha), Tajikistan, Kyrgyzstan, Cyprus (Greek), Sri Lanka (Sinhala), the Maldives (Dhivehi), Ethiopia (Amharic), Kurdish names in Iraq and Iran, and Punjabi Sikh names (Gurmukhi).
  - India now draws from its language communities, each in its own script: Hindi belt (Devanagari), Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayali and Punjabi. Indian Muslims get Muslim names, and Malayali Hindu and Christian families no longer mix (no more "Joseph Nair"). Sri Lankan Tamils, and the Tamil communities of Malaysia and Singapore, get Tamil names in Tamil script instead of generic Indian ones.
  - Hong Kong and Macau mix Cantonese names in Chinese characters (Chan Ka-ho, 陳家豪) with English names, which have no characters (Kevin Wong). Malaysian and Singaporean Chinese names are written family name first, with characters.
  - Ethiopia's Oromo players get Oromo names (Feyisa Tola), written in Latin script as Afaan Oromoo is, instead of Amharic ones. Eritreans get Eritrean names (Biniam Tesfay) rather than Ethiopian ones, and Sri Lankan Moors their community's names (Rizwan Marikar) rather than Pakistani ones.
  - Women's names that had slipped into the pools were removed (Akter, Dema, Simran, Naaz), along with a few names that read wrong for their pool.
- **Scoring matches the 2025-26 NBA, team by team.** Teams averaged about 111 points; now about 115.6, as in 2025-26. The spread is realistic too: the best offense scores about 122–125 a game and the worst about 105, where it used to run from about 92 to 131. Records follow: the best team wins about 60–70 games and the worst about 15, not 76-6 and 11-71. What changed underneath:
  - **League levels** follow Basketball-Reference's 2025-26 averages: about 99 possessions, 89 field goal attempts (37 from three, at 36%), 23.5 free throw attempts at 78%, 14.5 turnovers, 11.4 offensive rebounds and 26.7 assists a game.
  - **Turnovers:** a lineup's ball-handling used to swing a team from 9.5 to 22 turnovers a game; the range is now NBA-like (about 12–17). The turnovers fall mostly on high-usage ball handlers.
  - **Shooting:** defenses key on a lineup of shot-makers and help off one that can't shoot, so team shooting spreads like the NBA's (about .520–.580 effective FG%) while the difference between a great and a poor shooter stays. Poor shooters lose a little less than before.
  - **Single games:** a big lead makes a team relax and the trailing team play with urgency, and garbage time starts a little earlier, so final margins vary about as much as real ones. Home court is worth about 2.5 points (it was about 5).
  - **Pace:** AI teams now have their own tempo (their coach's taste and their roster: quick, young teams run, veteran teams grind), from about 97 to 104 possessions a game.
- **Many more American names.** American players used to come from about 90 first names and 50 surnames per community, so the same names turned up in every world. They now draw from the U.S. Census Bureau's 2020 Census name tables: about 3,000 first names and 5,000 surnames for African American players, 1,500 first names and 6,000 surnames for white American players, each as common as it really is (Smith, Johnson and Williams are still the most common surnames). First names lean toward the generation of today's players: Isaiah, Elijah and Jayden come up more than Willie or Larry. A curated set of today's common player names (the Jalens and the rest) still shows up about one time in five. Spellings the census flattens are restored: DeAndre and Deandre, D'Andre, O'Connell, McDonald.
  - In a test of three new worlds, each had about 580 different first names and 690 surnames among its ~980 American players (it used to be about 140 and 110), and two worlds shared 4 full names instead of about 150.
- **God Mode signings: Sign plays by the rules, Force Sign doesn't.** In God Mode the regular **Sign** button used to skip every rule. It now works exactly as it does outside God Mode: cap room, exceptions, aprons and hard caps, roster limits, contract rules, and the player can turn you down. A new pink **Force Sign** button is the one way past the salary cap: it signs him on the terms you set even when that puts you over the cap, with no cap room or exception needed (it doesn't use up an exception or trigger a hard cap), and he accepts. It also signs past the roster limit and past an overseas club's buyout clause (the club gets its asking price), but you can't play a game while you're over the limit: the sim buttons grey out until you waive or trade players.
- **Your team is highlighted in its own color.** On League leaders, Awards, League finances and Team history, the team you're running now (and its players) is marked in its primary team color instead of lavender, with the text switching between dark and white to stay readable. Only that team gets it: when you run several teams, the others aren't highlighted. Another team's history still marks its current players in lavender.
- **Tendencies are now the shot categories the NBA tracks, nothing else.** Every player has nine, shown in the NBA's own units:
  - **Usage rate** (USG%)
  - **Shooting by zone**, as shares of his shots that always add up to 100%: **Restricted Area**, **In the Paint (Non-RA)**, **Mid-Range**, **Corner 3**, **Above the Break 3**
  - **Catch & Shoot** and **Pull-Up** (jump shots from 10+ feet with no dribble, or off the dribble), as shares of his shots
  - **Free throw rate** (free throw attempts per field goal attempt)

  Gone: drives, isolation, pick-and-roll ball handler and roll man, post-ups and passes made (they aren't shot tendencies), the 3-point attempt rate (the zones cover it), and God Mode's "fine-tuning" multipliers (draws fouls, turnovers, assisted on his makes and the rest). Player cards carry the new tendencies.
  - Each one matters on the court. The zones decide where he shoots, and the game now plays floaters and hooks in the paint apart from mid-range jumpers, so all five zones are real numbers in the box score. Catch & shoot against pull-ups decides how often his makes are assisted, and free throw rate how often he's the one fouled.
  - They match what players actually do, and the profile shows this season's real number next to each where the box score keeps it. Non-shooters take almost no threes, and bigs live at the rim and in the paint.
  - God Mode edits them in the same units (a zone's share of his shots, with the others making room).
  - Leagues in progress move over automatically.
- **Shot volume now grows and shrinks with a player's game.** A player's usage used to follow his overall (defense included), and his usage tendency barely moved as he developed. Now:
  - It follows his **offense**: how well he scores and creates. A defensive specialist isn't fed the ball like a scorer anymore.
  - His **usage tendency evolves**. A player who becomes a better scorer, a more complete creator or grows an elite weapon (a sniper, a rim finisher), or becomes his team's best option, takes on a bigger share of the offense over a season or two. Young players grow into a bigger role fastest, and on a rebuilding team the young talent gets the ball (on a contender, a young role player waits his turn).
  - When his offense fades or his role shrinks, his shots go down too.
  - **Personality**: Egotistic, Ball-dominant and Selfish players want more shots than their game earns and keep taking shots they can't make, and they hold on to their shots as they age. Heat checkers, Fearless and Legacy-driven players shoot a little more; Team players less.
  - Leagues in progress: every player's usage tendency is reset once to fit his game, role and personality.
- **Badges are off the Roster table**, which was getting too busy. They're still on player profiles, in free agency and on Tactics.
- **On a player's profile, the "+5" after his first seven badges is now a "+5 more badges" button.** Hover it to see which badges they are, click it to show them all, and hover any badge for what it does.

### Added
- **Spectator Mode: watch the league run itself.** Pick it on the start screen (or Settings → Start spectating in any league) and you don't run a team: the AI makes every decision for every team, from rosters, trades and free agency to the draft and lineups, with the same logic it uses for AI clubs, and nothing stops to ask you anything (no notices, owner letters, trade offers or GM reviews).
  - **Sim as far as you like:** a day, a week, a month, to the trade deadline, to the end of the regular season, to the champion, through the draft, through the offseason to opening night, or 2, 3, 5 or 10 seasons in a row. **Stop** pauses at any moment.
  - **See everything as it happens:** the Spectator dashboard shows both conferences with the playoff and play-in lines, the champion and Finals MVP, league leaders, everyone who's hurt, the latest moves and every champion so far. Standings, playoffs, stats, leaders, awards, transactions, the draft and the Hall of Fame keep their full history.
  - **Take over any team, any time:** Manage a team… (on the dashboard, the sidebar, Settings or a team's page) ends Spectator Mode and makes you its GM right where the season is. The owner won't fire you over a season you only just joined.
- **Transactions: earlier league years and injuries.** A picker on the Transactions screen shows any earlier league year's moves (each starts when free agency opens), and a new Injuries filter lists the major injuries.
- **Trade button on your players' pages.** Above Release: it opens the trade screen with him already on your side of the table.
- **God Mode: choose the roster size.** Settings → Roster size sets the league's limits for every team: the most standard contracts in season (10 to 20; the offseason limit stays six above) and the fewest on opening night. AI teams over a lowered limit waive players right away. Two-way contracts stay at 3.
- **New faces, drawn far more realistically.** Every face is new: shaded with soft light from the upper left, with real head shapes (cheekbones, jaw, chin), seven eye shapes, brows, noses, lips and ears that all vary, skin tones on a smooth range with undertones, and athletes' builds (a heavier player has a fuller face and neck).
  - **About 35 hairstyles**, from fades, waves, twists, locs, cornrows and box braids to crops, quiffs, middle parts, man buns, mullets and long hair, with different hairlines (shape-ups, widow's peaks, rounded, receding) and lengths. The style follows the hair's texture, not who wears it, and anyone can have dyed hair, highlights or frosted tips.
  - **15 kinds of facial hair**, from stubble to thick beards, with natural texture.
  - **Expressions:** serious, slight smile, smile, relaxed, mean mug and smirk, all kept subtle.
  - **Accessories at realistic rates:** headbands are common, earrings fairly common, nose studs uncommon, lip and eyebrow rings rare, glasses and face shields exceptionally rare. Freckles, moles, neck tattoos and undershirts show up too.
  - **Players age:** hair greys and hairlines recede at different ages for different players, and lines appear. Sons and brothers look like their fathers and brothers.
  - **Every league looks different:** the same player number no longer gets the same face in every new league.
- **New Face and Edit face, without God Mode.** Under the portrait on every player's page: New Face rolls a new random face (nothing else about him changes), and Edit face lets you change any part of it by hand: expression, skin, head shape, eyes, brows, nose, lips, ears, hair (style, texture, color, dye, hairline, grey), facial hair, accessories and marks. Cancel puts the old face back.
- **Two new franchises replace Tampa and Phoenix** (in new leagues):
  - **Iŋaliq Ivories.** Iŋaliq is the Iñupiaq name of Little Diomede, Alaska, in the Bering Strait, a village known for its walrus-ivory carving. Their crest is a walrus head carved in ivory, with the fine incised lines and dots of Iñupiat engraving, set on an Arctic night sky with the northern lights and the two Diomede islands on the horizon. Navy, ivory and aurora teal.
  - **Wazíbló Dragoons.** Wazíbló is Pine Ridge, South Dakota, home of the Oglala Lakota. Their crest is a dragoon (a rider at full gallop) over the eight-pointed morning star of the Lakota star quilt, above a ridge of pines. Red, gold, black and white, the colors of the four directions. It has no headdress, weapons or caricature: the horse culture and the star quilt carry the design.
  - Both play in the West's Northwest, with the league's smallest markets. To keep 15 teams a conference, St. Louis moves to the East's Central, Nashville to the Southeast and Denver to the Southwest. Each new team has its own development-league club (the Tuktoyaktuk Pingos, the Pine Ridge Buttes).
  - Tampa and Phoenix aren't gone for good: both can return through expansion. Leagues already in progress keep their teams.
- **"Give me the most hopeless roster" on the start screen**, next to "Give me the worst roster" (pick one or neither). The worst roster is just the weakest team on the floor; the most hopeless one is a franchise stuck in a hole:
  - It starts from the worst overall situation among the ten weakest rosters (little talent, old, overpaid for years, no young upside), then gets worse.
  - **No real prospects:** young players with upside are traded for veterans about as good today.
  - **Old:** the rotation averages about 29–30 years old.
  - **Bad money:** three to five mediocre veterans (rated about 50) earn around $30–35M a year for three or four more seasons, so the payroll sits at or over the luxury tax with no cap room.
  - **Holes:** role players start, and its best guard is gone.
  - **No picks:** this season's first-round pick and the one two years out already belong to other teams, plus next year's second-rounder. Losing won't even buy a top pick.
  - Bottom five in team rating, but not necessarily last. A welcome note lists exactly what you inherited. Your club keeps its name, market and owner.
- **God Mode: delete and clone players.** The Edit player tab has a new **Player management** box.
  - **Delete player…** asks you to confirm, then removes him from the league for good: from his team or free agency, his draft class, trade offers, watch lists, scouting, training plans, mentors and his family. Box scores, drafts and awards he already won keep his name; his profile and stats are gone.
  - **Clone player** creates a second, separate player with the same ratings, body, background, personality, tendencies and face, but none of the original's stats, awards, contract or family. He starts as a free agent (a draft prospect's clone joins the same class), and his page opens on the Edit tab so you can rename him and change his ratings, contract, team or face.
- **God Mode: NBA family on Edit player.** A new **NBA family** box shows his father, brothers and sons, each a real player in the league. Add, change or remove any of them by searching for a player. Links are always kept on both players: making someone his father makes him that player's son, and brothers share their brothers (and a father, if only one side has one). Impossible links are refused, like a "father" who isn't at least 15 years older.
- **"View Trade Offer" on trade-offer pop-ups.** When an AI team calls with an offer, its pop-up now has a **View Trade Offer** button that takes you straight to that offer on the Trade screen: the players and picks both ways, with Accept, Negotiate and Decline. If the offer has expired by the time you look, the pop-up says so.
- **League leaders.** A new **League leaders** tab (under League) shows the top 10 in every stat for any season: points, rebounds, assists and the rest per game or as totals, the shooting percentages, and advanced stats (PER, true shooting, usage, win shares, box plus-minus, VORP, EWA and more). It uses the same qualifying rules as the bold league-leading numbers. Your players are highlighted in lavender.
- **The Awards screen highlights your players** in lavender wherever they appear: winners, the voting, the All-League, All-Defensive and All-Rookie teams, the All-Stars and the Finals MVPs (and you, when you're Coach of the Year).
- **Championship rings in player stats.** On a player's Stats tab, a ring marks every season he won the title, as Basketball-Reference does. Only players on the champion's roster when the Finals ended get one: from now on the league remembers that roster (for earlier seasons, it's the champion's players who played in those playoffs). Team history and the Hall of Fame count titles the same way.
- **League finances.** A new **League finances** tab (under League) lists every team's market size, attendance, ticket price, revenue, profit, payroll, cap space, open roster spots, strategy and budgets (scouting, coaching, health, facilities). Your team is highlighted in lavender. Sort by any column; **Trade with** opens a trade with that team.
- **A championship banner on the Playoffs screen.** When the Finals end, the champion's banner (its colors, the year and its crest) hangs under the Finals in the bracket.
- **Team history, with retired jerseys and championship banners.** A new **Team history** tab (under Team) opens on your team; the arrows and the team menu show any other.
  - **Overall**: the total record and win %, playoff and Finals appearances, championships, and the best and worst records.
  - **Seasons**: every season's record and how it ended ("made conference finals", "league champs" in bold). Click a season to see that year's roster.
  - **Championships**: a banner for every title, in the team's colors, with the year and the crest.
  - **Players**: everyone who has played for the team, with his games, minutes, points, rebounds, assists, PER, EWA and titles there, and his last season there. Sort by any column, search, and choose how many show per page.
  - Rows are colored by where he is now: **lavender** if he's on the team, **green** if he's still playing somewhere else (another team, unsigned, abroad or in the CCP), **gold** if he's in the Hall of Fame, and no color if he's retired. A key above the list explains the colors.
  - **Retire jersey**: on a team you run, retire a former player's number from his row (not while he's still on the team). If he wore more than one number there you pick it; if the league never recorded it you type it in. No one new can wear a retired number; a current player who already wears it keeps it until he leaves.
  - **Retired jerseys** lists each retired number with the player's position, a link to his profile and his titles with the team. **Unretire** puts a number back in circulation.
  - Every section folds away, and the league remembers which ones you folded.
- **Playing style: tendencies that evolve as players develop.** Every player now has ten tendencies:
  - Shot volume
  - Pass-first
  - Drives to the rim
  - Isolation
  - Pick and roll
  - Post-ups
  - Catch-and-shoot
  - Pull-up jumpers
  - Mid-range
  - Three-pointers

  They decide how he plays: which shots he looks for, how often he finishes the play himself, whether he passes, drives, posts up or pulls up. His ratings still decide whether the shots go in. You'll find them under **Playing style** on every profile, with arrows showing how each changed since last summer.
- **Tendencies change gradually, not overnight.** Each summer after development, and a little each month in season, they drift toward what his skills, role and team ask of him. For example:
  - A player who becomes a better shooter takes more threes.
  - A player whose handle and burst improve drives more.
  - A player who becomes a better passer turns pass-first.
  - A veteran losing his athleticism drives and posts up less and leans on his jumper.
  - Young players adapt fastest. Every player keeps his own quirks, so two players with the same ratings don't play alike.
- **Shot volume grows with the role.** A player who develops into a star, becomes a better scorer or becomes his team's first option takes on more of the offense over a season or two. One whose game declines, or who joins a better team, gives some back.
  - It isn't tied to overall: a defensive specialist stays low-volume.
  - No player is stuck at a low shot volume he started with.
- **God Mode:** edit all ten tendencies on the Edit player tab, and lock them so they stop changing. Hand-set fine-tuning (and a player card's tendencies) now fades back to normal over a few summers unless locked.

## 2026-10-02

### Added
- **God Mode: Hidden gem** on a player's Development tab (under How he develops): whether he's a hidden gem, what kind (role player, starter or star), and how much extra potential is still to surface.
- **AI teams call you with trade offers.** Every offer has a reason that fits the team's plans:
  - A contender, or a team on the rise, after one of your players at the position it needs.
  - A rebuilding team moving a veteran for your young players or picks.
  - A team over the tax paying you to take a contract, when you have the room.
  - You get a notice when an offer arrives. Under Trade → Offers to you, you can accept, negotiate or decline; an offer stands for about ten days, and the same offer isn't made twice.
- **God Mode: how far ahead picks can be traded** (Settings → Trading picks). The default is four drafts ahead (the NBA allows seven), and it applies to every team, including the AI.
- **Injuries show games and days,** for example "5 games / 12 days".
  - Games count down as his team plays; days count down on the calendar.
  - Over the summer the days keep running while the games wait for next season.
  - Free agents heal on the calendar.
- **Drafted by and current team** in a draft class list: click the draft line on a player's profile.
  - The team that drafted him never changes.
  - Current team shows where he is now: an NBA team, retired, free agent, his CCP club, his club abroad, or still a prospect.
  - The profile's draft line shows both too.
- **Every team judges potential through its own scouts.** In trades, re-signings and extensions, AI teams value other teams' players on their own read: the league's read plus their scouts' miss, which a bigger scouting budget shrinks. They know their own players best.
  - Your screens show your scouts' read of other teams' players, so your Scouting budget matters in trades too.
  - Your assistants' free-agent ideas use the same read.
- **AI teams have medical staffs.** A win-now owner's team gets players back from injuries faster, and a frugal owner's slower.
- **Development reports say why.** Monthly notes now include, for example:
  - "The bench is costing him growth" or "His role is making him a shooter".
  - "Falling behind his development plan", "Ahead of schedule" or "Close to his ceiling".
  - The year-by-year notes add "Held back by his situation", "A good place to grow" and "Sophomore slump".
- **Bigger swings from year to year.** A breakout year is partly given back the next season and a down year partly made up (sophomore slumps, bounce-backs), without changing where careers end up on average.
- **Size** on the Development tab: a player's height, his height rating, and whether he plays bigger or smaller than his height.
- **Where a player develops matters.** How fast he closes in on his potential depends on his team's environment.
  - The factors are coaching, facilities, playing time (for players 24 and under; CCP minutes count, and a hard worker makes up most of what the bench costs), the locker room, and a veteran mentor.
  - Together they're capped at ±25%, with diminishing returns. They matter most for players with modest potential: a fringe player's career swings on where he lands, while a top prospect develops anywhere.
  - They never raise his ceiling.
  - Your players' Development tab shows the breakdown; God Mode shows anyone's.
- **AI teams spend on coaching and facilities the way their owners would.** A win-now spender has the best staff and gym, and a frugal owner the barest. Finances now ranks your budgets against theirs.
- **A player's role shapes his growth.** The shots, drives, passing, defense and rebounding he's asked for in games get the reps, and his growth leans that way.
- **AI teams draft on their own scouting.** Each team reads prospects through its own scouts, so teams disagree about who's best, and a frugal owner's thin staff misses more often.
- **Potential is a ceiling now, not a destination.** It's how good a player could become if everything goes right, and most players stop short of it.
  - Every player has a development plan from the day he comes into the league, and a hidden pace for how much of it he gets. A typical player gets about four fifths of the way. About one in nine barely develops at all, and about one in seven develops fast.
  - A lost year stays lost: nothing makes it up later. His potential shrinks as years go by without the growth, and it can still rise with a breakout or a hidden gem.
  - Every player has a ceiling in each skill. A specialist's are high in his area and modest elsewhere, so reaching his potential doesn't mean being good at everything.
- **The potential you see is a scouting read.** It's the league's estimate: a few points off for prospects, closer every season he plays. Your own staff reads your players more closely, and AI teams draft and trade on the league's read, not the truth.
- **God Mode shows the true potential.**
  - The ring on a player's profile reads "True potential", and roster tables and the draft board show it too.
  - The Development tab shows it next to the league's read, plus his ceiling in every skill, his full ceiling and his hidden development pace.
  - The editor's "True potential" slider sets it.
- **Players develop their own way.** Every player has a hidden development profile.
  - Some pour their growth into one area and become specialists, like a shooter who keeps getting better from deep while his defense stays where it was. Others grow two areas, or round out a little everywhere.
  - Where a player's growth goes carries over from year to year. Skills he isn't working on stall, and can slip.
  - Feel for the game (Offensive and Defensive IQ, boxing out) comes later in a career; dunking and shot-blocking come early.
  - Aging works the same way: athleticism goes first, while feel for the game and the shot hold on longest.
- **The body has its own schedule.** Learning to shoot no longer makes a player faster.
  - Speed, burst and leaping barely grow after 20–21. They start to fade at each player's own athletic peak, somewhere from 26 to 29.
  - Strength and stamina fill out into the mid-20s, each up to a limit set by his frame.
  - Young players arrive with their athleticism mostly there and their skills still raw.
- **"How he develops"** on the Development tab of your own players' profiles: where his growth goes, his slowest area, how his body is changing, and his work ethic. God Mode shows the hidden numbers.
- **God Mode makes you the boss.** The owner has nothing over you.
  - No firing, no payroll orders, no fire sales and no meddling. Your contract renews itself.
  - Losing money doesn't matter. The Owner screen shows your job security as "God Mode · 100".
  - You dictate every contract. Players sign whatever you offer, and the signing and extension boxes no longer cap the amount or the years. Your owner also accepts any counter you make on your own contract.
- **God Mode: edit the owner.** League editor → Owner, or "Edit owner or sell the team" on the Owner screen.
  - You can change his name, personality (owner type), kind, where the money came from, net worth, when he got the team and what he paid.
  - You can rewrite the biography, or go back to the generated one.
- **God Mode: sell any team.** League editor → Sell the team.
  - Name a buyer (or leave it blank for a new one) and pick the owner type and background.
  - The club changes hands right away, at about what it's worth.
- **God Mode: move any player.** Every player's profile has "Move to my team" and "Move to a team…".
  - A player under contract keeps his deal, and the move goes on his record.
  - A free agent, CCP player, player abroad or draft prospect signs a fair contract for his value and age, not a minimum.
  - A full AI roster waives its last minimum-salary player to make room.
- **Draft surprises.** The draft board shows how a prospect played as an amateur. How his game carries over to the NBA only shows at his first training camp.
  - About half are what the scouts saw. Others come in 3–6 points worse or better.
  - About one in eight is a real bust or a real steal: a "50" who turns up at 42, or at 58.
  - Many have a different shape than advertised. For example, he shoots better than his college numbers showed but can't run an offense.
  - Ceilings move too. Some top picks plateau as good players rather than stars.
  - A camp report lists how each of your rookies looks. God Mode can peek at a prospect's translation on his profile.
- **Past drafts.** Draft → Past drafts shows every draft held in your league.
  - Each pick, who made it and how the player rated on draft night.
  - How his game carried over at his first camp and how he's turned out: his rating now, career numbers and where he plays.
- **Seven new rookie cards** in the card library (God Mode → Player cards):
  - Dalton Knecht (2024–25), Ben Simmons (2017–18), Al Horford (2007–08), Chris Paul (2005–06), Klay Thompson (2011–12), Kawhi Leonard (2011–12) and Dwight Howard (2004–05).
  - Each is tuned against his real rookie season (per-game and advanced stats, shooting by distance, month-by-month splits), translated to today's league.
  - Example: Knecht has his scorching November and cold December, Simmons finishes at the rim and never shoots threes, and Howard lives on dunks.
- **New trait: Streaky.** A streaky shooter's jumper runs hot and cold for weeks at a time. His season average is the same, but the ride is wilder. About one player in eight has it.
- **Shot volume** is a new tendency in the God Mode player editor: how often he ends a possession.

### Changed
- **Undrafted players rarely become stars now.** Before, a team that signed enough undrafted players would find several starters a year. Now, for a league's undrafted players each year:
  - The overwhelming majority never become NBA players.
  - About three become bench players, and one in a season or two a real starter.
  - A high-level player turns up every few years, and a star about once a decade (a Ben Wallace or an Austin Reaves).
  - Undrafted isn't a ceiling. A late bloomer can still surprise everyone (a hidden gem, or a game that translates better than the scouts saw), and the youngest have the most room to climb.
  - The league reads a CCP or tryout player's potential less precisely than a drafted prospect's: fewer scouts watch him.
- **Players in the CCP and abroad develop on their own plan.** Before, they got the same flat bump every month. CCP reps and minutes abroad still help.
- **The draft's best undrafted rookies stay around** as free agents and CCP players instead of disappearing in the summer cleanup.
- **Draft picks are valued by where they'll really land.** A future pick's projected spot comes from each team's outlook, not just its record:
  - Its current strength, its players' ages and contracts, who's likely to leave, and how it's playing.
  - The further out a pick is, the more it's pulled toward the middle, with more uncertainty.
  - A bad team's future firsts are worth much more than a good team's.
- **Pick swaps are worth more:** the chance the other team's pick lands higher, times how much higher. Two future swaps with a 3-win team are now worth far more than a 50-win team's #19.
- **Taking on a bad contract has a price.** The team absorbing an overpaid contract demands picks, swaps or young players for it. How much depends on:
  - The salary and years left, how good and how old the player is.
  - The receiving team's cap room and timeline: a team over the tax minds most, one with room least.
  - A contender dumping salary has to pay to do it.
- **AI-to-AI trades are more common, and each has a reason:** a contender filling a hole from a seller, a salary dump with a sweetener, or two teams swapping surplus for need. Both teams have to come out ahead by their own read, and AI teams trade in free agency too. The trade log says why each deal happened.
- **AI teams are patient with their high draft picks.** Every cut, waiver and rookie team option now weighs the team's draft investment.
  - A top pick gets years of patience, and real minutes to develop, from the team that drafted him. That fades as his rookie deal runs out.
  - A #1 pick is almost never cut in his first seasons, and a lottery pick's third-year option is nearly always picked up.
  - Being cut doesn't lower anyone's potential. If a pick doesn't develop, his ratings and play show it over time.
- **Roster cuts are real basketball decisions.** AI teams, and your staff when it decides for you, keep the players worth most to the team, not just the highest overalls. They weigh:
  - Ability now, plus upside (the team's own read, worth more the younger he is) and which way he's trending.
  - Age against the team's timeline, his role, position depth, and any skill nobody else on the roster has.
  - His contract: guaranteed money is paid either way, so cutting it saves nothing.
- **"Make free agency and roster decisions for me"** (easy mode; it was "Fill my roster in free agency") now also trims your roster to 15 on opening night, with the same judgment.
- **Player cards are shared by all your leagues.** A card you create, edit or delete in one league shows up in every league's library.
  - Applying a card still changes only that one player in that league. Editing a card later never changes players it was already applied to.
  - Each league's own cards join the shared library the first time you open it.
- **The height rating now mostly follows listed height,** at about 4 points an inch. Some players still play bigger or smaller than their size. Existing players' overalls don't change.
- **Facilities help development a little,** up to +6% for the best.
- **Playing time counts through the same capped environment.** Sitting on the bench costs a young player at most about a quarter of his growth, and less for a hard worker. It used to cost nearly half.
- **Projections** ("projects as", the scout report's outlook) now grow a player's skills, not his speed and leaping.
- **The Coaching budget speeds growth by at most 12%,** with diminishing returns, and slows aging a little. It used to add flat points every year, at any age, so a big coaching budget pushed players past their potential.
- **Training focus decides where a player's growth goes, not how much.** His focus skills take a much bigger share and the rest stall. Athleticism and Conditioning only help while he's still filling out. The preview on the Tactics screen shows the new split.
- Growth in the CCP and overseas follows each player's own development profile too, instead of raising every rating alike.
- In leagues you already have, players already in the league keep the athleticism they have now. Undrafted prospects get the new young body.
- In leagues you already have, every player's potential is re-read as a ceiling. Young players' numbers rise a little, and most won't reach them.
- Top draft prospects arrive more athletic and with rawer skills.
- **Owners come from all walks of life.** There are about forty backgrounds, and no two owners in a league share one. Examples:
  - A cable-network founder, or a retired AI chief living off his dividends.
  - A family that inherited the team, or a founding partner from the expansion days.
  - A former star, a music mogul, a crypto founder, or a local group that bought the team to keep it in town.
  - A buyer's background matches how his purchase was announced. The owner directory shows where each fortune came from and how each owner got the team.
- **More American names**, including spelling variants of the same name.
  - Jalen, Jaylen, Jaylin, Jalon, Jaylon, Jaelen, Jalyn and more.
  - Michael, Mikal, Mikel and Mikael.
  - The variants are rarer than the name they come from.

### Fixed
- **A rookie who looks better than expected at his first camp no longer keeps growing extra fast because of it.** His jump at camp counted twice: once at camp and again in his development plan for years after. A rookie who looked worse also grew too slowly for the same reason.
- **AI teams no longer trade after the trade deadline.**
- **An injured player now comes back to his spot.** On a team you run, a player who's out drops to the end of the roster with no minutes. When he's healthy, he returns to his old spot and minutes. Before, a star hurt early in the season could sit in the last slot, with no minutes, for the rest of the season.
- **Injuries now count down in the play-in and playoffs, and free agents heal.** Before, an unsigned player's injury never healed.
- **Work ethic now counts.** It was missing for every generated player, so it never affected development. Hard workers now grow faster and age more slowly, and scouting reports call out gym rats and questionable work ethics.
- A big Coaching budget made veterans decline faster during the season. It now slows their decline a little.
- The training focus preview on the Tactics screen labels the Blocks and Steals bars.

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
`,i=e(),a=e=>e.split(/(\*\*[^*]+\*\*)/).map((e,t)=>e.startsWith(`**`)?(0,i.jsx)(`b`,{children:e.slice(2,-2)},t):e),o={Added:`var(--gm-good)`,Changed:`#4a9fd8`,Fixed:`var(--gm-elite)`};function s(){let e=[],s=``;return r.split(`
`).forEach(t=>{if(t.startsWith(`## `))e.push({date:t.slice(3).trim(),secs:[]});else if(t.startsWith(`### `))e[e.length-1]?.secs.push({name:t.slice(4).trim(),items:[],subs:[]});else if(t.startsWith(`- `)){let n=e[e.length-1],r=n?.secs[n.secs.length-1];r&&(r.items.push(t.slice(2)),r.subs.push([]))}else if(/^\s+- /.test(t)){let n=e[e.length-1],r=n?.secs[n.secs.length-1];r?.subs.length&&r.subs[r.subs.length-1].push(t.trim().slice(2))}else!e.length&&t.trim()&&!t.startsWith(`#`)&&(s=t.trim())}),(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:22,maxWidth:900},children:[s&&(0,i.jsx)(`p`,{style:{...n,margin:0,fontSize:`13px`},children:a(s.replace(` The game shows this page under **What's new**.`,``))}),e.map((e,n)=>(0,i.jsxs)(`section`,{children:[(0,i.jsx)(`h3`,{style:{margin:`0 0 8px`,fontSize:`19px`,borderBottom:`1px solid var(--color-divider)`,paddingBottom:4},children:e.date}),e.secs.map((e,n)=>(0,i.jsxs)(`div`,{style:{marginBottom:10},children:[(0,i.jsx)(t,{children:(0,i.jsx)(`span`,{style:{color:o[e.name]},children:e.name})}),(0,i.jsx)(`ul`,{style:{margin:`4px 0 0`,paddingLeft:20,display:`flex`,flexDirection:`column`,gap:5,fontSize:`13.5px`,lineHeight:1.5},children:e.items.map((t,n)=>(0,i.jsxs)(`li`,{children:[a(t),e.subs[n]?.length>0&&(0,i.jsx)(`ul`,{style:{margin:`3px 0 0`,paddingLeft:18,display:`flex`,flexDirection:`column`,gap:2},children:e.subs[n].map((e,t)=>(0,i.jsx)(`li`,{children:a(e)},t))})]},n))})]},n))]},n))]})}export{s as ChangelogScreen};
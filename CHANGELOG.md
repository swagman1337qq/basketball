# Changelog

Every change to Basketball Manager, newest first. The game shows this page under **What's new**.

## 2026-09-26

### Added
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
- **Development isn't a straight line.** Every player now has a hidden development year: most are normal, some are breakouts, and some go nowhere or backwards. About a quarter to a third of young players don't improve in a given season. Potential can fall too: a serious injury, a rookie who can't adapt to NBA strength or pace, a young player who stalls, or a year well below expectations. The reason appears in the Development tab's year-by-year table.
- **Scouting report outlook reads like a draft analyst's take.** Prospects get a "Draft room take": what he does well, what he can become, what has to develop, and where he stands in his class ("Byrd has the size, rebounding instincts and scoring punch to become a high-level NBA big. If his shooting and explosiveness continue to develop, he has legitimate star upside and is one of the elite prospects in the 2027 NBA Draft."). NBA and overseas players get a "Scout's take" in the same style. This replaces the old "depends on development: above all, …" line.
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

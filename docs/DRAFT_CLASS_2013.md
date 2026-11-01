# 2013 draft class

Added 2026-11-01. Load **God Mode → Draft classes → 2013 draft class**, or use **Load draft class…** on an undrafted board. The library contains 100 fictional prospects: 58 drafted selections, 22 other remaining early entrants and 20 notable undrafted players. Giannis Antetokounmpo and Rudy Gobert are excluded entirely, including fictional stand-ins. This is a curated class, not every automatically eligible senior worldwide.

Ages, birthdays and season offsets move with the league year when loading. Loading replaces that year’s undrafted class. Existing leagues retain their prospects until the class is explicitly loaded. The 2000 preset is unchanged.

## Construction and limits

Every fictional full name keeps the original first and last initials and matches their separate spoken syllable counts using basketball or native-language pronunciation as closely as possible. Initials such as C.J. count as two spoken letters; Jr./II are suffixes, not surname syllables. Familiar individual names may be reused; the full names are fictional. Accents do not create extra syllables. The table records intended readings; pronunciation varies by accent. The private identity key is not published.

Schools and clubs, including transfers, are replaced with rivals. Height, weight and age use draft-era listings where available, with other biographies filling gaps. Conflicting measurements are rounded to the game’s feet/inches and pounds. Jerseys are college or known pre-draft club numbers; null means unverified. Position and personality are authored interpretations, not verified measurements of character.

Overall estimates NBA readiness on draft night; true potential estimates NBA career level; the scouting read follows draft position and contemporary expectations. Undrafted prospects receive a low scouting read even when their true ceiling is higher. These estimates do not guarantee reproduction of actual careers. The engine rounds true potential to a whole point and sets overall approximately; displayed scouting potential changes with age and development. Existing rating shaping blends traditional numbers with a generated build. Shot locations, defensive impact and injuries are not comprehensively calibrated by this update.

## Historical records

95 players have at least one recorded, played pre-draft season. Ritchie Leno has a college sitout and no invented college production. Four lack a sufficiently verified complete line: **Kimo Gardley, Lóránt Dobay, Alexandro Parados and Stanimir Stojičić**; their amateur stats use the existing generator. Missing earlier JUCO, youth or domestic seasons are omitted.

College counting and shooting rates use ESPN season totals divided by games and are stored to three decimals; minutes use published averages. Jude Tayler’s Division II season uses official Fresno Pacific totals. Grant Reece includes his 2012–13 D-League season. Fernando Campano uses the nine-game 2012 South American club tournament, completed before the draft; it is not a complete domestic season.

Club histories use archived domestic and continental lines through 2012–13. Identical duplicate rows are removed. Different competitions for the same team-season are combined by games played, while transfer stints stay separate. Most archive rates are rounded to one decimal, so reconstructed percentages and sums have rounding error. Where a total rebound field conflicts materially with offensive and defensive components, the total is derived from those components and retains their source uncertainty. Competition coverage and cutoff dates vary; missing games are not inferred. Advanced amateur stats are calculated by the game and remain estimates.

Sources reviewed:

- [ESPN 2013 draft records](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/draft?season=2013) for selections and draft-era bio listings.
- [NBA final early-entry withdrawal notice](https://pr.nba.com/early-entry-candidates-withdraw-2013-nba-draft/) for eligibility; withdrawn candidates are excluded.
- ESPN historical college season APIs, by athlete ID, for season totals and biographies.
- [Fresno Pacific official 2012–13 totals](https://www.fpusunbirds.com/cumestats.aspx?path=mbball&year=2012) for the Division II record.
- [ShamSports](https://www.shamsports.com/) historical club and D-League archives, cross-checked against NBA draft releases and EuroLeague/EuroCup archives where available.
- [FIBA 2012 South American club tournament record](https://www.fiba.basketball/en/history/318-liga-sudamericana-de-baloncesto-fiba/7154/players/163373-facundo-campazzo) for the nine-game Argentine club sample.

## Validation

Run `node --import tsx scripts/historicalClass.mts`: all 100 entries, arithmetic with source-rounding tolerance, unique team-season rows, import/export, physical and country data, engine height and wingspan, true/scouting potential, saved histories and reopening across seeds 11, 44 and 2027, including a future-year load and two complete 60-pick drafts. Production compilation: `npm run build`. Private checks compare the 58 retained draft selections and alias initials/counts against the source worksheet. No identity mapping is included in the published test.

## Fictional pronunciations

| Prospect | First name | Syllables | Last name | Syllables |
| --- | --- | ---: | --- | ---: |
| Antony Benton | AN-tuh-nee | 3 | BEN-tun | 2 |
| Viktor Oladayo | VIK-ter | 2 | oh-la-DAH-yo | 4 |
| Orlo Portman | OR-lo | 2 | PORT-man | 2 |
| Cory Zellman | COR-ee | 2 | ZELL-man | 2 |
| Alec Lenz | AL-ek | 2 | LENZ | 1 |
| Nerlan Novell | NER-lan | 2 | no-VELL | 2 |
| Brett McLenner | BRETT | 1 | muh-LEN-er | 3 |
| Kentarius Calder-Payne | ken-TAR-ee-us | 4 | CAL-der-PAYNE | 3 |
| Trent Burks | TRENT | 1 | BURKS | 1 |
| C.D. McCallen | SEE-DEE | 2 | muh-CAL-en | 3 |
| Micah Carter-Wilson | MY-kuh | 2 | CAR-ter-WILL-sun | 4 |
| Stefan Adkins | STE-fan | 2 | AD-kinz | 2 |
| Kelsey Olenik | KELL-see | 2 | oh-LEN-ik | 3 |
| Shamar Mustafa | shuh-MAR | 2 | mus-TAH-fa | 3 |
| Lukas Noronha | LOO-kas | 2 | no-RON-ya | 3 |
| Denny Schröter | DEN-ee | 2 | SHROE-ter | 2 |
| Shawn Larken | SHAWN | 1 | LAR-ken | 2 |
| Semyon Karelin | sem-YON | 2 | ka-RE-lin | 3 |
| Toby Sneed | TO-bee | 2 | SNEED | 1 |
| Gorguy Diop | GOR-guy | 2 | DYOP | 1 |
| Madden Plumley | MAD-en | 2 | PLUM-lee | 2 |
| Sullivan Hilt | SUL-uh-vun | 3 | HILT | 1 |
| Tom Harriman | TOM | 1 | HAR-i-man | 3 |
| Rennie Bullard | REN-ee | 2 | BULL-ard | 2 |
| Anders Robison | AN-derz | 2 | ROB-i-sun | 3 |
| Ludovic Jean-Claude | loo-do-VEEK | 3 | zhawn-KLOAD | 2 |
| Arlie Goodman | AR-lee | 2 | GOOD-man | 2 |
| Nebojša Nenadić | ne-BOY-sha | 3 | NE-na-dich | 3 |
| Alden Crabb | AL-den | 2 | CRABB | 1 |
| Axel Arbines | AX-el | 2 | ar-BEE-nes | 3 |
| Cedric Fenwick | CED-rik | 2 | FEN-wik | 2 |
| Isiah Cannon | eye-ZY-uh | 3 | CAN-un | 2 |
| Grant Reece | GRANT | 1 | REECE | 1 |
| Reid McCallan | REID | 1 | muh-CAL-un | 3 |
| Toby Mitton | TO-bee | 2 | MIT-un | 2 |
| Nash Walters | NASH | 1 | WAL-terz | 2 |
| Judd Witham | JUDD | 1 | WITH-um | 2 |
| Gage Jerrick | GAGE | 1 | JER-ik | 2 |
| Jamar Franklyn | juh-MAR | 2 | FRANK-lin | 2 |
| Pierre Jacksen | PIERRE | 1 | JACK-sen | 2 |
| Ritchie Leno | RICH-ee | 2 | LEE-no | 2 |
| Mitch Muscatto | MITCH | 1 | mus-CAT-oh | 3 |
| Mirko Todorjević | MEER-ko | 2 | to-DOR-ye-vich | 4 |
| Evan Greene | EV-un | 2 | GREEN | 1 |
| Renan Neves | he-NAN | 2 | NE-ves | 2 |
| Rylan Keller | RY-lun | 2 | KELL-er | 2 |
| Eero Murley | EE-ro | 2 | MUR-lee | 2 |
| Jace Emmett | JACE | 1 | EM-it | 2 |
| Ramiro Osgood | ra-MEE-ro | 3 | OZ-good | 2 |
| Larenzo Browne | la-REN-zo | 3 | BROWN | 1 |
| Corbin Iversen | COR-bin | 2 | EYE-ver-sen | 3 |
| Ardalan Karimi | ar-da-LAN | 3 | ka-REE-mi | 3 |
| Joris Laverne | ZHO-ris | 2 | la-VERN | 2 |
| Paxton Sina | PAX-tun | 2 | SEE-na | 2 |
| Alec Oriyomi | AL-ek | 2 | o-ri-YO-mi | 4 |
| DeShay Thomsen | duh-SHAY | 2 | TOM-sun | 2 |
| Boris Dubrović | BO-ris | 2 | DOO-bro-vich | 3 |
| Juris Tīmers | YOO-ris | 2 | TEE-mers | 2 |
| C.D. Aikman | SEE-DEE | 2 | AYK-man | 2 |
| Victor Blume | VIK-ter | 2 | BLOOM | 1 |
| Adrian Colman | AY-dree-un | 3 | COLE-man | 2 |
| Devan Demmon | DEV-un | 2 | DEM-un | 2 |
| Kimo Gardley | KEE-mo | 2 | GARD-lee | 2 |
| Christian Kabanga | KRIS-chun | 2 | ka-BAN-ga | 3 |
| Mick Kambala | MICK | 1 | kam-BA-la | 3 |
| C.D. Lesley | SEE-DEE | 2 | LEZ-lee | 2 |
| Nuredeen Lindley | noo-ri-DEEN | 3 | LIND-lee | 2 |
| Amar M'Bane | ah-MAR | 2 | em-BAYN | 2 |
| Marquel Power | mar-KELL | 2 | POW-er | 2 |
| Pierce Pressman | PIERCE | 1 | PRESS-man | 2 |
| Travis Sampson | TRAV-is | 2 | SAM-sun | 2 |
| Ty Tait | TY | 1 | TATE | 1 |
| Jude Tayler | JUDE | 1 | TAY-ler | 2 |
| Adrian Thomsen | AY-dree-un | 3 | TOM-sun | 2 |
| B.D. Yates | BEE-DEE | 2 | YATES | 1 |
| Lóránt Dobay | LO-rant | 2 | DO-bay | 2 |
| Alexandro Parados | a-lex-AN-dro | 4 | pa-RA-dos | 3 |
| Boris Radomirović | BO-ris | 2 | ra-do-MEE-ro-vich | 5 |
| Stanimir Stojičić | STA-ni-mir | 3 | STO-yi-chich | 3 |
| David Thies | DA-vid | 2 | TEES | 1 |
| Chase Babb | CHASE | 1 | BABB | 1 |
| Rylan Brookham | RY-lun | 2 | BROOK-um | 2 |
| Fernando Campano | fer-NAN-do | 3 | cam-PA-no | 3 |
| Wes Cherrin | WES | 1 | CHER-in | 2 |
| Iain Clarke | EE-un | 2 | CLARK | 1 |
| Jace Coley | JACE | 1 | COLE-ee | 2 |
| Robin Covendon | ROB-in | 2 | COV-en-dun | 3 |
| Shane Currey | SHANE | 1 | CUR-ee | 2 |
| Trent Darnell | TRENT | 1 | dar-NELL | 2 |
| Brenton Davers | BREN-tun | 2 | DAY-verz | 2 |
| Mathew Dallaverona | MATH-yoo | 2 | dal-la-ve-RO-na | 5 |
| Lenny Drake | LEN-ee | 2 | DRAKE | 1 |
| Elian Harrel | EE-lee-un | 3 | HAR-el | 2 |
| Rennie Hearne | REN-ee | 2 | HERN | 1 |
| Ronan McGrady | RO-nun | 2 | muh-GRAY-dee | 3 |
| Trent McKinnon-James | TRENT | 1 | muh-KIN-un-JAMES | 4 |
| Nicola Mello | NEE-ko-la | 3 | MELL-o | 2 |
| Brenton Paull | BREN-tun | 2 | PAUL | 1 |
| Jace Sutherland | JACE | 1 | SUTH-er-lund | 3 |
| D.K. Steffens | DEE-KAY | 2 | STEF-enz | 2 |

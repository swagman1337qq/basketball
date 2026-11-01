# Draft class files

God Mode → **Draft classes** (or **Load draft class…** on the Draft board): browse the library, **Add from a file…** to put your own `.json` class in it (shared by all your leagues in this browser), and **Load** one into a class that hasn't been drafted. **Save the class as a file** downloads one of your league's classes in this format, so the easiest way to make your own is to save one and edit it. Loaded prospects are edited in God Mode like any player.

```json
{
  "label": "My draft class",
  "players": [
    {
      "first": "Kevin", "last": "Mitchell",
      "pos": "FC",                      // PG, SG, G, GF, SF, F, PF, FC or C
      "hgt": [6, 9], "wt": 234,         // feet and inches; pounds (null: the game picks)
      "born": "12-30",                  // month-day (null: the game picks); the year follows from age
      "age": 22,                        // age on draft night (17–30)
      "rep": "US",                      // country code (FR, TR, CA, ...)
      "num": 6,                         // jersey number (null: none yet)
      "kind": "col",                    // col (college), hs (high school) or club (abroad)
      "from": { "team": "Xavier", "lg": "NCAA", "country": "US" },   // lg: NCAA, JUCO, NAIA, NCAA Division II, High school, or a club league
      "pers": { "mot": "Winning", "work": 70, "volatile": 1, "fearless": 1 },  // traits: alpha, touches, pro, volatile, flashy, heat, crowd, villain, fearless, clutch, prone, padder, team, legacy, streaky
      "ovr": 44.7,                      // overall on draft night
      "tpot": 60.4,                     // true potential (hidden; God Mode shows it)
      "read": 72,                       // the scouts' read of his potential (what the board shows); leave out to match tpot
      "real": [                         // his seasons, per game; null or left out: the game generates them
        { "y": -3, "team": "Xavier", "cls": "FR", "gp": 22, "gs": 3, "mp": 10.6, "fg": 1.2, "fga": 1.8, "tp": 0, "tpa": 0, "ft": 0.5, "fta": 1.5,
          "orb": 1.2, "drb": 2.2, "trb": 3.4, "ast": 0.5, "stl": 0.6, "blk": 1.1, "tov": 0.7, "pf": 2.3, "pts": 2.8 }
      ]
    }
  ]
}
```

- `y` is the season relative to the draft: 0 is the season just before it, -1 the one before that. A season he sat out: `{ "y": -2, "team": "Xavier", "note": "sitout" }`.
- Advanced stats (PER, TS%, BPM, Win Shares, …) are worked out from these traditional numbers by the game's own formulas.
- His ratings are shaped by his numbers (shooting, passing, rebounding, blocks, steals) and then set to `ovr`; his ceiling to `tpot`.
- Up to 200 players. A file with a mistake is refused with the first problem named; nothing is replaced.
- Ready-made classes are real drafts with every name made up and every school or club swapped for a rival; who's who is never in the game.

# Player Card Guide

Everything you need to build a player card that plays the way you want: what a card contains, what every field does, how the engine turns ratings into box-score stats, and a step-by-step method for matching a real player's numbers.

The numbers in this guide come straight from the engine code (as of 2026-10-16). Shooting percentages are approximate. They are the starting point before defense, fatigue, the venue and the game situation move them a little on every shot.

---

## 1. What a card is and what it changes

A card is a **build**, not a person. When you load one onto a player in God Mode (Edit player → Player card, or the Player cards screen):

| Copied onto the player | Kept as the player's own |
|---|---|
| Position (`pos`) | Name, age, birthday |
| Height (`hgt`), weight (`wt`), wingspan (`wing`) | Hometown, country, heritage, look |
| All 20 ratings (`r`) | Team, contract, stats, history, ID |
| Potential (`pot`): becomes his exact true potential | |
| Personality (`pers`) | |
| Intangibles (`intg`: Feel, Poise) | |
| Playing style (`ten`: shot mix, usage, free-throw rate) | |

A card can still carry the real player's name and bio. The card library shows them, but they are never copied onto the player.

**Two things that catch people out:**

1. **The AI resets every player's playing style once a month**, and again each summer, to match his ratings, role and team. To keep your card's exact shot mix, open Edit player → Tendencies and press **Freeze**.
2. **Ratings keep developing** after you load the card: the player grows, peaks and ages like anyone else. To keep the card exactly as built, use **Freeze attributes** in Edit player.

---

## 2. The card format (JSON)

```json
{
  "card": 1,
  "label": "My Player",
  "name": "My Player",
  "pos": "SF",
  "hgt": "6′7″",
  "wt": 220,
  "wing": 83,
  "r": {
    "hgt": 50, "stre": 50, "spd": 50, "acc": 50, "jmp": 50, "endu": 50,
    "ins": 50, "dnk": 50, "lay": 50, "ft": 50, "fg": 50, "tp": 50,
    "oiq": 50, "diq": 50, "blk": 50, "stl": 50, "drb": 50, "pss": 50,
    "reb": 50, "box": 50
  },
  "pot": 60,
  "intg": { "feel": 50, "poise": 50 },
  "pers": {
    "mot": "Winning", "work": 50,
    "alpha": false, "touches": false, "pro": false, "volatile": false,
    "flashy": false, "heat": false, "crowd": false, "villain": false,
    "fearless": false, "clutch": false, "prone": false, "padder": false,
    "team": false, "legacy": false, "streaky": false
  },
  "ten": {
    "usage": 50, "ftr": 50,
    "ra": 31, "paint": 13.5, "mid": 12.5, "c3": 10.5, "atb": 32.5,
    "cns": 52, "pullup": 32, "step": 9, "fade": 7
  }
}
```

| Field | Values | Notes |
|---|---|---|
| `pos` | PG, SG, G, GF, SF, F, PF, FC, C | Decides his group: **G** (PG, SG, G), **W** (GF, SF, F) or **B** (PF, FC, C). The group sets his overall weights, rebounding role, shot-mix limits and more. |
| `hgt` | e.g. `"6′7″"` | Listed height. His height rating should match it (section 4). |
| `wt` | pounds | Display only. |
| `wing` | inches | Wingspan. NBA average is height + 4″ (range −6″ to +12″). It counts toward the overall and toward defense, rebounds and rim finishing. |
| `r` | 1–99 each | The 20 ratings (section 3). A missing rating keeps the player's current value. |
| `pot` | at least his overall, up to 100 | Becomes his **exact** true potential (his ceiling). |
| `intg.feel`, `intg.poise` | 1–99 | Intangibles (section 8). |
| `pers` | see section 8 | Any trait you leave out keeps the player's current value. |
| `ten` | see section 6 | Leave it out and his style comes from his ratings. |

`ovr` is never read from a card. The overall is always computed from the ratings.

---

## 3. The 20 ratings: what each one does

**Overall weight** is that rating's share of the overall for a Guard / Wing / Big. Larger numbers move the overall more.

### Body

| Key | Rating | What it does in games | Overall weight (G / W / B) |
|---|---|---|---|
| `hgt` | Height | Finishing at the rim (25% of rim skill), getting jumpers off over contests, rebounding, rim protection, perimeter contests. Rim finishing also gets a straight bonus for size. | 12.0% / 10.6% / 12.6% |
| `stre` | Strength | Post game (hooks, fadeaways), drawing fouls (bigs), injury resistance, rebounding floor. | 2.3% / 3.9% / 6.8% |
| `spd` | Speed | Perimeter defense, steals, slashing, fatigue-free pace. | 6.9% / 5.8% / 2.9% |
| `acc` | Acceleration | Creating separation (stepbacks), perimeter defense, steals, scoring/usage. | 6.9% / 5.3% / 2.4% |
| `jmp` | Jumping | Rim finishing, rebounding, blocks. | 3.7% / 4.8% / 5.3% |
| `endu` | Endurance | How fast his energy drains on the floor (section 7.9), how quickly fatigue from heavy minutes clears between games, injury risk. | 4.4% / 4.6% / 4.6% |

### Scoring

| Key | Rating | What it does | Overall weight (G / W / B) |
|---|---|---|---|
| `ins` | Inside | Post scoring and rim finishing (20% of rim skill), drawing fouls. | 1.4% / 2.7% / 6.3% |
| `dnk` | Dunks | Rim finishing (20% of rim skill), slashing, lobs. | 1.9% / 3.1% / 4.3% |
| `lay` | Layups | Rim finishing (25% of rim skill), floaters. | 4.4% / 3.8% / 3.1% |
| `ft` | Free throws | Free-throw %, directly (section 7.5). | 2.1% / 2.2% / 1.9% |
| `fg` | Mid-range | Mid-range and paint jump shots, fadeaways. | 4.4% / 4.6% / 2.7% |
| `tp` | Three-pointers | Every three (corner and above the break). | 6.0% / 5.8% / 2.2% |

### Skill and smarts

| Key | Rating | What it does | Overall weight (G / W / B) |
|---|---|---|---|
| `oiq` | Offensive IQ | Decision-making: fewer turnovers, better shots (and a better shot when the defense keys on him), assists for teammates, avoiding late-game mental mistakes. | **12.0% / 10.9% / 8.7%** |
| `diq` | Defensive IQ | Positioning and rotations: makes every shot the opponent takes harder, fewer fouls, no defensive three seconds. | **9.0% / 11.4% / 11.8%** |
| `blk` | Blocks | Who gets the block (timing). Above his Defensive IQ he gambles: more blocks, easier shots for everyone else. | 0.6% / 1.5% / 3.6% |
| `stl` | Steals | Who gets the steal (hands). Gambling works the same way as Blocks. | 2.1% / 2.2% / 1.1% |
| `drb` | Ball handling | Fewer turnovers; part of how assists are shared out (the ball handler makes most plays); pull-ups and stepbacks. | 8.3% / 5.3% / 1.9% |
| `pss` | Passing | Who gets the assist on a teammate's make, and how often his lineup's baskets are assisted. | 8.3% / 4.8% / 3.4% |
| `reb` | Rebounding | Who grabs the rebound. | 1.9% / 3.9% / 8.2% |
| `box` | Box out | Team rebounding (keeps the opponent off the glass) without grabbing as many himself. | 1.4% / 2.9% / 6.3% |

### How ratings translate to quality

Across all rotation players, most ratings average about 54–57. As a rough guide: **40** is poor, **55** average, **65** good, **75** very good, **85** elite. Ratings past 85 get harder to reach, so **95+** is generational.

---

## 4. The overall, height and wingspan

**Overall** = the weighted average of all 20 ratings (weights in section 3) + a wingspan bonus − a position adjustment (G 1.6, W 1.64, B 4.38). The adjustment keeps a typical guard, wing and big on the same scale. Hidden decimal progress counts too, so a player can sit at 57.4.

**The height rating should match the listed height:**

`height rating ≈ 34 + (inches − 75) × 4`

| Listed height | Height rating |
|---|---|
| 6′0″ | 22 |
| 6′3″ | 34 |
| 6′5″ | 42 |
| 6′7″ | 50 |
| 6′9″ | 58 |
| 6′11″ | 66 |
| 7′1″ | 74 |
| 7′3″ | 82 |

Generated players sit within ±5 of this. A card can go further (a 6′6″ guard who plays like he's 6′9″), but there's no reason to stray far.

**The wingspan rating** comes from the gap between wingspan and height. Height + 4″ = 50, and every inch longer or shorter is 6 points. Its overall bonus is `(wingspan rating − 50) × 0.05` for guards, `× 0.075` for wings and `× 0.095` for bigs. A +12″ big gets about +4.6 overall.

**The overall scale in a league:** the very best players are about 78–85, good starters 60–68, the median rotation player about 52, and deep bench 40–45. Draft prospects often start at 25–40.

---

## 5. Potential and development

- **`pot` on a card becomes his exact true potential**: the highest overall he can reach. It can go up to 100 and is never cut.
- He grows toward it on a plan spread over the years to about age 27, with most growth by 23. Growth is fastest at 18–22.
- **A typical player reaches about 77% of the way** to his potential. "Potential" is the best case, not the expected outcome.
- **What speeds or slows growth:**
  - Work ethic (`pers.work`): 0 is about 0.7× normal growth, 100 about 1.3×.
  - A hidden pace that is fixed per player.
  - A yearly form roll from −0.5× to 2.2× (breakout years and down years).
  - His environment: coaching and facilities budgets, minutes for players 24 and under, the locker room and mentors. Together these are capped at ±25%.
  - Traits: `pro` is +6%, `legacy` +8%, `volatile` −6%.
  - Overall, growth never runs faster than 1.8× his plan.
- **Aging:** decline starts after 29. It's about −0.5 overall a year at 30, −2 at 33 and −3 at 35. Athleticism goes first; shooting and feel last longer. Good coaching and work ethic slow it.
- **For a veteran card** (29+) with potential above his overall, God Mode gives him a fresh three-season plan to grow into it.
- **To lock a card exactly as built:** use Freeze attributes. This stops all growth and decline.

---

## 6. Playing style (tendencies): how he chooses shots

Stored the way the NBA reports it.

### Shot location: five shares that add up to 100

| Key | Zone | League typical |
|---|---|---|
| `ra` | Restricted area (at the rim) | 31% |
| `paint` | Paint, outside the restricted area (floaters, hooks) | 13.5% |
| `mid` | Mid-range | 12.5% |
| `c3` | Corner three | 10.5% |
| `atb` | Above-the-break three | 32.5% |

### How he creates his jump shots: four shares that add up to 100

| Key | Type | League typical | Effect |
|---|---|---|---|
| `cns` | Catch and shoot | 52% | +2.2% make rate; almost always assisted |
| `pullup` | Pull-up | 32% | −1.5%, better with ball handling; rarely assisted |
| `step` | Stepback | 9% | −4.5%, better with handle and acceleration; almost never assisted, rarely blocked |
| `fade` | Fadeaway / turnaround | 7% | −3.5%, better with mid-range, height and strength; hard to block |

### Volume and fouls: 0–100 scores, 50 is typical

| Key | What it controls |
|---|---|
| `usage` | Shot volume on top of what his game earns him. +20 means about 40% more of the offense. |
| `ftr` | How often he's the one fouled on drives (free-throw rate). |

### Limits the engine enforces regardless of the card

- A **guard or wing can take at most 58% of his shots at the rim.** The defense walls off the paint. Bigs are exempt.
- A **high-usage shooter's three-heavy mix bends back** toward 48% threes as he carries more of the offense. At 20+ shots a night, 75% threes plays as about 55%.
- **Heat-check and tilt moods** (traits) push extra pull-up threes or forced jumpers in streaks.

Remember: **Freeze the tendencies** or the AI will reset them next month.

---

## 7. How the engine turns ratings into stats

Each game is played possession by possession, about 100 per team. Every trip ends in a shot, free throws or a turnover.

### 7.1 Minutes

Minutes come from the rotation: your minute settings, or the coach's targets by overall. Fouls, fatigue and blowouts adjust them.

### 7.2 Shot volume (usage), the gatekeeper for points

`usage = e^(0.019 × (offensive ability − 57)) × usage tendency`, then:
- `alpha` ×1.05
- `touches` ×1.06
- the Primary creator role ×1.05
- `padder` (selfish) ×1.1

**Offensive ability** = 55% scoring + 17% ball handling + 15% Offensive IQ + 13% acceleration. The scoring part is 50% of his best scoring skill (rim, mid-range or three), 30% of the second, 10% of the third and 10% free throws. Rotation players average about 57.

On each trip, the shooter is picked in proportion to usage among the five on the floor. His share is capped at about 33% of the team's shots (more only when he's far better than everyone around him, as with a star among scrubs).

**Points ≈ minutes × usage × efficiency.** A great shooter with low usage won't score 25.

### 7.3 Which shot

The zone is picked from his shot-mix shares (section 6), then the creation type for a jump shot. Late in close games the score decides this instead (section 7.10).

### 7.4 Make chance

`make % = league zone baseline + skill curve + creation type + defense + situation`

League baselines: rim .696, paint/mid-range about .37, corner three .388, above-the-break three .351.

**Skill per zone:**
- **Rim** = 0.2 Dunks + 0.25 Layups + 0.2 Inside + 0.25 Height + 0.1 Jumping, plus wingspan.
- **Mid** = Mid-range + 0.12 × (Height − 50).
- **Three** = 3PT + 0.08 × (Height − 50).

Each point above average is worth a little less (diminishing returns). Below average costs a little more.

**Approximate catch-and-shoot three-point % above the break**, before defense (the corner adds about +3.5%):

| 3PT rating | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 99 |
|---|---|---|---|---|---|---|---|---|
| 3P% | ~.265 | ~.295 | ~.325 | ~.35 | ~.375 | ~.385 | ~.39 | ~.395 |

The league's best three-point shooters (about 85–95 on 3PT) land at .38–.43 over a season once shot selection and luck are in.

**Defense:** the lineup's Defensive IQ makes every shot harder. Rim protectors (height, Defensive IQ, blocks, wingspan) hit rim shots, especially from small finishers. Perimeter defense (Defensive IQ, speed, acceleration, height, wingspan) hits jump shots.

**At the rim, a guard or wing who can't shoot** (his best of 3PT and mid-range under 55) faces a packed paint. That costs up to 6% at the very worst. Shooters around him open the lane a little.

**Situation effects:**
- Fatigue (section 7.9).
- Home and road.
- Hot and cold streaks for `streaky` players.
- Clutch time (`clutch` +3%, Poise).
- A heavy-usage star's shots get a little harder, unless his Offensive IQ is high.

### 7.5 Free throws

**FT% ≈ .80 + curve.** Free-throw rating 99 (98.5+) is a flat 98%.

| FT rating | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 99 |
|---|---|---|---|---|---|---|---|---|---|
| FT% | ~.55 | ~.63 | ~.70 | ~.75 | ~.80 | ~.85 | ~.88 | ~.91 | .98 |

**Who gets fouled on drives:** usage × (Inside, Dunks/Layups, Strength, Acceleration) × the `ftr` tendency.

### 7.6 Assists

**How often a make is assisted** depends on:
- The zone: threes are 82–95% assisted, rim shots 55%.
- The creation type: catch-and-shoot almost always, stepbacks almost never.
- The teammates' passing and ball handling, Feel and Offensive IQ.

**Who gets the assist:** Passing^2.4 × ball handling × small boosts from Feel and Offensive IQ, with a minimum share for the worst passers.

Typical results:
- A lead guard with 80+ passing and good handling: about 7–10 assists a game.
- A non-passing big: about 1 per 36 minutes.

### 7.7 Rebounds

**Team offensive-rebound chance:** 26% baseline, ± the lineups' glass skill (rebounding, height, jumping, wingspan, box-out), fatigue and tactics.

**Who grabs it:** (0.55 Rebounding + 0.33 Height + 0.12 Jumping + wingspan)², with a little less for big box-out specialists (they free up teammates).

**Rebounding floor:** every player rebounds and boxes out at least what his body gives him: about 0.3 Height + 0.2 Jumping + 0.15 Strength − 6. That's about 25 for a 6′5″ guard and 40 for a 7-footer.

### 7.8 Steals, blocks, turnovers, fouls

- **Turnovers:** the lineup's ball handling and passing, Offensive IQ, Feel and fatigue against the defense's pressure, hands and Feel. The ball handler (high usage, passing) commits most. `flashy` adds a few.
- **Steals:** credited by Steals rating + acceleration, speed and wingspan (the Point-of-attack defender role ×1.5).
- **Blocks:** credited by a combination of Blocks, height, wingspan, jumping, quickness and Defensive IQ. A weakness anywhere drags it down. The Rim protector role ×1.6.
- **Fouls committed:** lower Defensive IQ fouls more.

### 7.9 Energy and fatigue (Endurance)

- **Energy (0–100) drains on the floor** at about `3.7 × (1.55 − Endurance/100)` per minute: ~2.4 a minute at 50 Endurance, ~1.5 at 90, ~3.0 at 30. Players 33 and older drain 10% faster.
- **It recovers** 2.8 a minute on the bench, +6 at quarter breaks and +18 at halftime.
- **Below about 88 he's tired.** He shoots worse (jump shots most), defends worse, turns it over more and rebounds less. Coaches sub out gassed players sooner.
- **Heavy minutes over several games** leave him starting games with less energy. Endurance also clears that faster between games.

### 7.10 End of close games (last 48 seconds of the 4th or OT, within 12)

- **Down 3:** he shoots a three (it goes to a shooter).
- **Tied or down 1–2:** hold for the last shot, mostly attacking for two.
- **The trailing team fouls on purpose;** the team ahead runs out the clock.
- **Intentional free-throw misses.**
- **Low Offensive IQ:** more mental mistakes, such as taking a two when down 3 or forgetting to miss a free throw. About 17% at 30, 3% at 50, under 1% at 70.

---

## 8. Personality and intangibles

| Trait | Effect |
|---|---|
| `work` (0–100) | Growth speed and how well he ages (the biggest development lever after potential). |
| `mot` | What he wants in contracts and his mood: Winning, Money, Fame, Loyalty or Playing time. |
| `alpha` | Wants the ball: higher usage, believes in tough shots, more pull-ups and mid-range. |
| `touches` | Wants touches: higher usage. |
| `padder` | Stat padder (selfish): about 1.3× shots, stops the ball, fewer assists around him. |
| `team` | Team player: takes fewer shots, more catch-and-shoot, corner threes. |
| `heat` | Heat checker: after two straight makes he wants the ball and pulls up from deep. |
| `volatile` | After three straight misses he forces bad shots. Slightly slower growth. |
| `streaky` | Hot and cold stretches that swing his shooting. |
| `clutch` | +3% on shots in clutch time. |
| `fearless` | Takes over in clutch time (much higher usage, steady nerves). |
| `flashy` | More above-the-break threes, more turnovers, slightly more assists. |
| `crowd` | Rattled on the road (double the road penalty). |
| `villain` | Thrives on the road (no road penalty, slightly more shots). |
| `prone` | Injury-prone (1.8× injury risk). |
| `pro` | Professional: +6% growth, slower decline. |
| `legacy` | Legacy-driven: +8% growth. |

**Intangibles:**
- **Feel** (vision and reading the game): better shots, fewer turnovers, more assists, more steals on defense.
- **Poise** (composure): steadier in clutch time, on the road and at the free-throw line late in games.

---

## 9. Roles (unlocked by ratings)

Roles show on the profile and change how the engine uses him.

| Role | Needs | Effect |
|---|---|---|
| Primary creator | Ball handling 62+, Passing 60+ | More usage and assists. |
| Floor spacer | 3PT 60+ | Takes more threes. |
| 3-and-D wing | Wing (or guard with Height 45+), 3PT 54+, Defensive IQ 54+ | More corner threes. |
| Point-of-attack defender | Not a big, Defensive IQ 58+, Speed 60+ | More steals, more turnovers forced. |
| Slasher | avg(Speed, Jumping, Dunks) 60+ | More drives, more fouls drawn. |
| Rim protector | Big, Height 62+, Defensive IQ 52+ | More blocks, harder rim shots for opponents. |
| Stretch big | Big, 3PT 48+ | Takes threes. |
| Rebounder | Rebounding 62+ | More rebounds. |
| Connector | Passing 52+, Offensive IQ 55+, Defensive IQ 50+ | Fewer turnovers, more assists. |

---

## 10. Building a card to match a real player: step by step

1. **Body first.** Set `pos`, `hgt` and `wing` to the real numbers, and set the height rating from the table in section 4. Speed, acceleration, jumping and strength come from the scouting reports (an elite athlete is 80–90).
2. **Shooting from the real percentages.** Use the tables in section 7: 3P% sets 3PT, mid-range % sets Mid-range, FT% sets Free throws. Rim % depends on Dunks, Layups, Inside and Height together, so a small guard needs high Layups to finish well.
3. **Volume from usage.** Points come from minutes × usage × efficiency. If he scores too little, raise his offensive ability (best scoring skill, ball handling, Offensive IQ, acceleration) or `ten.usage`. If he scores too much, lower them.
4. **Shot mix.** Fill in `ten` from the real shot chart (NBA.com shooting by zone gives exactly these five shares), then **Freeze tendencies** after loading.
5. **Playmaking.** Assists come from Passing and Ball handling relative to his teammates. A real 8-assist point guard needs about 80+ Passing and 75+ Ball handling.
6. **Defense and rebounding.** Set Defensive IQ for overall defense, Steals and Blocks for the counting stats (don't push them far above Defensive IQ unless he's a gambler), and Rebounding plus Box out to match his rebound numbers.
7. **Potential.** For a rookie card, use his prime overall. He'll grow toward it at about 77% typical progress, faster with high `work`.
8. **Test it.** Load the card, sim 20–40 games, compare his per-game line and shooting splits to the real ones, and adjust one rating at a time. Change efficiency through the shooting ratings, volume through usage and offensive ability, and assists through Passing and Ball handling.

**Common mistakes:**
- **Forgetting to Freeze tendencies.** The AI rewrites the shot mix next month.
- **A height rating that doesn't match the listed height.** Rim finishing, rebounds and contests all lean on it.
- **Stat ratings far above Defensive IQ.** The player racks up blocks or steals but leaves his spot, so his defense gets worse.
- **Expecting a high 3PT rating alone to make a high-volume shooter.** Volume comes from usage. A 90 shooter with low usage takes 4 threes a game.
- **A non-shooting guard with a rim-heavy shot mix.** The engine caps him at 58% rim shots and the packed paint costs him at the rim.

---

## 11. Quick reference: league baselines (NBA 2024–25-like)

| Per team per game | Value |
|---|---|
| Points | ~113–116 |
| Possessions | ~99–100 |
| FG% | ~.465–.47 |
| 3PA / 3P% | ~36–37 / ~.355 |
| FTA | ~23 |
| Assists | ~25–26 (about 62% of makes) |
| Turnovers | ~14.5 |
| Offensive rebounds | ~11–12 |

Every season the engine also corrects league-wide shooting and turnovers toward these baselines, so a league doesn't drift as it ages.

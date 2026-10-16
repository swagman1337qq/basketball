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

The weights are measured from the game engine itself: every rating was nudged up and down for every rotation player across 160,000 simulated games, and each weight is how much +10 in that rating changes his team's net points per 100 possessions, as a share of the total for his position (minimum 1%). So the overall tracks how much a player actually helps his team win in this engine. Steals and blocks measure at or below zero: raising them past Defensive IQ makes a player gamble, which costs about as much as the extra steals and blocks gain. Rim finishing, mid-range, ball handling and strength also measure close to zero in this engine.

### Body

| Key | Rating | What it does in games | Overall weight (G / W / B) |
|---|---|---|---|
| `hgt` | Height | Finishing at the rim (25% of rim skill), getting jumpers off over contests, rebounding, rim protection, perimeter contests. Rim finishing also gets a straight bonus for size. | **12.5% / 15% / 18%** |
| `stre` | Strength | Post game (hooks, fadeaways), drawing fouls (bigs), injury resistance, rebounding floor. | 1% / 1% / 1% |
| `spd` | Speed | Perimeter defense, steals, slashing, fatigue-free pace. | 3% / 2% / 1% |
| `acc` | Acceleration | Creating separation (stepbacks), perimeter defense, steals, scoring/usage. | 4.5% / 3.5% / 3% |
| `jmp` | Jumping | Rim finishing, rebounding, blocks. | 2.5% / 3.5% / 3% |
| `endu` | Endurance | How fast his energy drains on the floor (section 7.9), how quickly fatigue from heavy minutes clears between games, injury risk. | 7.5% / 8.5% / 6.5% |

### Scoring

| Key | Rating | What it does | Overall weight (G / W / B) |
|---|---|---|---|
| `ins` | Inside | Post scoring and rim finishing (20% of rim skill), drawing fouls. | 1% / 1% / 2% |
| `dnk` | Dunks | Rim finishing (20% of rim skill), slashing, lobs. | 1% / 1% / 1% |
| `lay` | Layups | Rim finishing (25% of rim skill), floaters. | 1% / 2% / 1% |
| `ft` | Free throws | Free-throw %, directly (section 7.5). | 3.5% / 4.5% / 4.5% |
| `fg` | Mid-range | Mid-range and paint jump shots, fadeaways. | 1% / 1% / 2% |
| `tp` | Three-pointers | Every three (corner and above the break). | 8% / 8% / 4% |

### Skill and smarts

| Key | Rating | What it does | Overall weight (G / W / B) |
|---|---|---|---|
| `oiq` | Offensive IQ | Decision-making: fewer turnovers, better shots (and a better shot when the defense keys on him), assists for teammates, avoiding late-game mental mistakes. | 7.5% / 9% / 8% |
| `diq` | Defensive IQ | Positioning and rotations: makes every shot the opponent takes harder, fewer fouls, no defensive three seconds. | **22.5% / 21% / 23%** |
| `blk` | Blocks | Who gets the block (timing). Above his Defensive IQ he gambles: more blocks, easier shots for everyone else. | 1% / 1% / 1% |
| `stl` | Steals | Who gets the steal (hands). Gambling works the same way as Blocks. | 1% / 1% / 1% |
| `drb` | Ball handling | Fewer turnovers; part of how assists are shared out (the ball handler makes most plays); pull-ups and stepbacks. | 1% / 3% / 3.5% |
| `pss` | Passing | Who gets the assist on a teammate's make, and how often his lineup's baskets are assisted. | 3.5% / 1% / 2.5% |
| `reb` | Rebounding | Who grabs the rebound. | 10.5% / 9% / 9% |
| `box` | Box out | Team rebounding (keeps the opponent off the glass) without grabbing as many himself. | 6.5% / 4% / 5.5% |

### How ratings translate to quality

Across all rotation players, most ratings average about 54–57. As a rough guide: **40** is poor, **55** average, **65** good, **75** very good, **85** elite. Ratings past 85 get harder to reach, so **95+** is generational.

---

## 4. The overall, height and wingspan

**Overall** = the weighted average of all 20 ratings (weights in section 3) + a wingspan bonus − a position adjustment (G −2.2, W 1.58, B 3.49). The adjustment keeps a typical guard, wing and big on the same scale. Hidden decimal progress counts too, so a player can sit at 57.4.

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

---

# Appendix: the exact formulas

This appendix is for testing cards in detail. It lists every formula the engine uses for a player's stats, copied from the code (`src/engine/sim.ts` unless noted). In the formulas:

- `r.x` is one of his ratings (for example `r.tp` is 3PT).
- `n.x` is the league's norm for that quantity. The engine recomputes the norms from all rosters every season, so "above average" always means above *this* league's average.
- `cl(v, a, b)` keeps `v` between `a` and `b`.
- `avg(lineup, f)` averages `f` over the five players on the floor.

## A. Composite skills

| Name | Formula |
|---|---|
| wingspan edge `ape` | wingspan − height in inches − 4 (0 = league typical) |
| rim skill | 0.2·dnk + 0.25·lay + 0.2·ins + 0.25·hgt + 0.1·jmp + 1.0·ape |
| mid skill | fg + 0.12·(hgt − 50) |
| three skill | tp + 0.08·(hgt − 50) |
| offensive ability | 0.55·scoring + 0.17·drb + 0.15·oiq + 0.13·acc, where scoring = 0.5·best + 0.3·second + 0.1·third of {rim finishing, fg, tp} + 0.1·ft, and rim finishing = 0.25·dnk + 0.25·lay + 0.3·ins + 0.1·hgt + 0.1·jmp |
| perimeter D | 0.5·diq + 0.125·spd + 0.125·acc + 0.25·hgt + 0.8·ape |
| interior D | 0.4·hgt + 0.3·diq + 0.15·blk + 0.15·jmp + 1.5·ape |
| rebound skill | 0.55·reb + 0.33·hgt + 0.12·jmp + 0.9·ape |
| glass skill (team rebounding) | 0.75·rebound skill + 0.25·box |
| steal skill | 0.7·stl + 0.15·acc + 0.15·spd + 1.0·ape |
| block skill | 100 × blk^0.32 × hgt^0.18 × (50 + 6·ape)^0.15 × jmp^0.12 × (0.6·acc + 0.4·spd)^0.10 × diq^0.16, each as a fraction of 100. It's geometric, so a weakness anywhere drags it down. |
| gambling | max(0, blk − diq − 8) for blocks, max(0, stl − diq − 8) for steals |

## B. Shot volume (usage)

```
usage  = e^(0.019 × (offensive ability − 57)) × e^((ten.usage − 50) / 60)
         × 1.05 if alpha × 1.06 if touches × 1.05 if Primary creator
         × 1.3 if padder (selfish) × 0.9 if playing hurt (day-to-day)
```

- **Mood multipliers:** heat check ×1.45, tilt ×1.3, villain on the road ×1.08, fearless in clutch time ×1.6.
- **Usage cap:** the top-usage player on the floor is held to **33%** of the lineup's shots. The cap rises toward 50% when he's 28 to 55 overall points better than the other four, and clutch time ignores it. A star far better than his teammates also gets a takeover boost of 1 + (gap − 25)/20.
- **Who ends each trip:** the shooter is picked at random, weighted by usage. Who gets fouled on a drive is weighted by usage × (ins + avg(dnk, lay) + stre/2 + acc/4) × 1.2 for Slashers × `ten.ftr`.

## C. Which shot

1. **Zone** comes from his shot mix (`ten.ra + ten.paint`, `ten.mid`, `ten.c3`, `ten.atb`), tilted by tactics and the game situation:
   - Heat check: above-the-break threes ×2, corner threes ×0.6.
   - Tilt: mid-range ×1.5, threes ×1.4, rim ×0.6.
   - Fast break: rim ×2.2.
2. **High-usage bend.** When his share of the lineup's shots `s` is above 17%, a mix with more than 48% threes is pulled toward 48% by `0.8 × cl((s − 0.17)/0.15, 0, 1)` of the excess.
3. **Rim cap.** A guard or wing (not on a putback) takes at most **58%** of his shots at the rim. Anything above that goes to his other zones in proportion.
4. **Paint or mid-range.** A shot in the mid tier is in the paint with probability `ten.paint / (ten.paint + ten.mid)`.
5. **Creation type** for a jump shot is picked from `ten.cns / pullup / step / fade`.

## D. Make chance (every term)

`P(make) = cl(sum of the terms below, 0.10, 0.90)`

| Term | Value |
|---|---|
| Zone baseline | rim .696, mid tier .37, corner .388, above the break .351 |
| Calibration | rim +.007, mid +.008, corner +.007, above the break +.005 |
| Skill curve | zone skill `s` against the curve's midpoint `m`: if `s ≥ m`, up × (s − m) / (1 + (s − m)/40); else down × (s − m). Rim: m = 60, up .0025, down .0032. Mid-range: m = 55, up .0022, down .0028. Threes: m = 65, up .0016, down .0029. |
| League re-centering | − the league's average curve value (keeps the league on its baselines), + last season's drift correction |
| Paint vs mid-range | paint +.02 (plus half his rim-vs-mid skill gap); mid-range −.02 × .52/.48 |
| Creation type | catch-and-shoot +.022; pull-up −.015 + .0006·(drb − 55); stepback −.045 + .0012·((drb + acc)/2 − 55); fadeaway −.035 + .001·(.5·fg + .25·hgt + .25·stre − 52); minus the league's average creation |
| Shot selection (Offensive IQ) | +.0003 per point above the league's Offensive IQ, −.0005 per point below |
| Usage burden | if his share `s` of the lineup's shots > 24%: −(s − .24) × .18 × cl(1 − (oiq − n.oiq)/60, 0.4, 1.5) (×1.1 flat for alphas and heat checks) |
| Size at the rim | +.0015 × (hgt − league rim height) |
| Sag off non-shooters (guards and wings at the rim) | −.15 × cl((55 − max(tp, fg))/100, 0, 0.4) |
| Spacing at the rim | +.0006 × (teammates' average tp − 50) |
| Lineup regression | −.66 × (lineup's usage-weighted shooting edge); hot lineups give part of their edge back |
| Rim defense | −(size factor) × [.0021 × (interior D of his two tallest defenders − norm) + .007 if a Rim protector is on the floor] + .0005 × block gambling. Size factor = cl(1 + (55 − hgt)/100, .75, 1.3), so small finishers are hit harder. |
| Jump-shot defense | −.001 (mid) / −.0008 (three) × (lineup perimeter D − norm) + .0003/.0004 × steal gambling |
| Team defense | −.0008 × (defenders' average diq − norm) |
| Fatigue | −.055 × (his tiredness − .13) × (.8 rim, 1.15 jumpers) + .025 × (defenders' average tiredness − .13) |
| Feel | +.00012 × (offense's average Feel − 54) − .0001 × (defense's average Feel − 54) |
| Clutch (last 5:00, within 6) | +.0005 × (Poise − 55) (fearless counts Poise as at least 80); +.03 if `clutch`; Four Factors edge ×.012 |
| Venue | road role players −.013 (−.026 if `crowd`), scaled by Poise; villain on the road +.02; home team's defense slightly better |
| Condition | adjusting to a new league −.03; playing hurt −.03 (the engine has a confidence term of ±.012, but nothing sets it yet, so it's always 0) |
| Streaks / moods | `streaky` hot or cold stretch ±(.025 rim, .09 jumpers) × hot; heat check −.02; tilt −.04 |
| Score effect | −.0018 × his team's lead (±30 at most) |
| Buzzer | 4th quarter or OT: −.05 with ≤ 2.5 s, −.12 with ≤ 1.2 s, −.25 for a last-second heave |
| Tactics | scheme effects; forcing shots outside his natural mix costs extra for poor shooters; fast-break layups +.06 |

**Blocks.** A missed shot was blocked with probability `1.18 × base × e^((avg of the defense's top-two block skill − norm)/22) × 1.3 if a Rim protector`. Base per zone: rim .36, mid .053, threes .008. Small finishers are blocked more at the rim. Stepbacks (×0.45) and fadeaways (×0.3) are rarely blocked.

**Who gets the block:** weighted by max(30, block skill)³ × 1.6 for Rim protectors.

## E. Free throws

```
FT% = cl(.783 + .019 + curve_ft(ft) + league FT offset − .02 if adjusting
         − .03 × (tiredness − .13) + .0006 × (Poise − 55) in the last 5:00, .30, .95)
curve_ft: m = 60, up .005 with softness 80, down .005, and an extra −.0025 per point under 40.
A 98.5+ free-throw rating: 98% flat (cap .99).
```

- **Shooting fouls:** about 6.6% of trips. 8% of those are on a three (3 free throws).
- **And-ones:** 7.2% of made shots.
- **Bonus fouls:** 6.6% of trips are a non-shooting foul, which gives 2 free throws once the defense is in the bonus.
- **Rebounds off free throws:** 90% of missed last free throws are live.

## F. Turnovers and steals

```
P(turnover) = .118 × e^(−(handle − n)/200 + (pressure − n)/85 − (Feel_O − 54)/400 + (Feel_D − 54)/210
              − (oiq − n)/350 + (hands − n)/420)
              × (1 + .02 per flashy) × (1 + .3 × (tiredness − .13)) × (1 − .015 per Connector)
              × (1 + .025 per Point-of-attack defender) × last season's correction
```

- **handle** = the lineup's average of .45·drb + .45·pss + .1·acc.
- **pressure** = the defense's average perimeter D.
- **hands** = the defense's average steal skill.
- **oiq** = the lineup's average Offensive IQ.

**Who commits the turnover:** weighted by usage^1.7 × (.5 + pss/100) × (1.25 − drb/220) × (1.35 − oiq/150) × 1.3 if flashy.

**What kind of turnover:**
- A steal, with probability cl(.573 × e^((hands − n)/160), .35, .8). The steal goes to a defender weighted by (max(32, steal skill + .4·(Feel − 54)))^1.2, ×1.5 for a Point-of-attack defender.
- Otherwise an offensive foul 10% of the time, or the ball out of bounds.

## G. Assists

```
P(assisted | make) = 1.39 × zone rate × e^((teammates' avg of max(pss, (pss + drb)/2) − n.pss)/60)
                    × e^((Feel_O − 54)/120) × e^((teammates' oiq − n)/110) + .02 per Connector
                    × creation factor (catch-and-shoot 1.5, pull-up .22, stepback .12, fadeaway .55)
                    × .9 if a selfish teammate × .85 if the shooter is selfish     (kept between .05 and .97)
zone rates: rim .55, mid .48, corner .95, above the break .82; no assists on putbacks
```

**Who gets the assist** (any teammate but the shooter), weighted by:

```
max(42, pss × (1 + (Feel − 54)/300 + (oiq − 50)/400))^2.4
 × cl(.45 + drb/80, .75, 1.45) × 1.2 if Primary creator × .85 if selfish × 1.12 if flashy
```

## H. Rebounds

```
P(offensive rebound) = cl(.26 + .004 × (offense's avg glass skill − defense's) + .03 × (defense's
                       avg tiredness − offense's) + .015 × clutch edge + tactics, .12, .45)
```

- 89% of rebounds are credited to a player (the rest are team rebounds).
- **Who grabs it:** weighted by max(36, rebound skill)² × 1.3 for a Rebounder × (1 − max(0, box − 55)/120) × (1 − .35 × tiredness).
- **Rebounding floor** (`ratings.ts`): reb ≥ round(.3·hgt + .2·jmp + .15·stre − 6), and box ≥ that − 4.

## I. Minutes, fatigue and rotation

- **Energy** starts at 100 − .35 × season fatigue (− 5 if playing hurt), kept between 55 and 100.
- **On the floor:** −3.7 × (1.55 − endu/100) per minute (×1.1 at 33+).
- **On the bench:** +2.8 per minute. Quarter breaks +6, halftime +18.
- **Tiredness** = cl((88 − energy)/60, 0, 1).
- **Subs:** each player's "minutes owed" is his target share of the time elapsed minus his minutes played. Subtract 15 minutes for foul trouble, and 10 seconds for each energy point under 72. A bench player comes in when he's owed at least 285 seconds more than the man he replaces.
- **Season fatigue:** each game day it changes by −(8 + endu/10) + 1.1 × (minutes over 20) + .3 × (age − 30) for players over 30.

## J. Development (`Game.ts` devTick and the summer)

- **Yearly plan rate:** (true potential − overall at plan start) × this age's share of the plan, × hidden pace × .96. The age shares are 18: 14%, 19: 15%, 20: 15%, 21: 14%, 22: 13%, 23: 11%, 24: 9%, 25: 7%, 26: 5%, 27: 3%, 28: 1%.
- **Monthly growth:** plan rate / 12 × min(1.8, form × environment × work) × injury factor × stunting × random(0.6–1.4).
  - Work = (.7 + work/167) × 1.08 if legacy × 1.06 if pro × .94 if volatile × hidden factor^0.6.
- **Form roll** each opening night: 1 + .55·N + .35·N′ − .7 × last year's timing + (work − 50)/200, kept between −0.5 and 2.2. N and N′ are bell-curve draws.
- **Aging** (29+): (−.4 − .25t − .03t²)/.83 a year, where t = age − 29.

## K. How the AI sets tendencies (`tendencies.ts` tenTargets)

Each month, unless you Freeze them, every player's tendencies are reset from his ratings, personality, age, role and team.

**Relative skill:** rel(x) = x − L + .3·(L − 52), where L is the average of drb, pss, fg, tp, ins, finishing, acc and oiq. A skill counts against the rest of his own game.

**Three-point desire:** shoot3 = 50 + .7·rel(tp). Under 50 3PT it ramps down toward 50 + 2.2·(tp − 50), and under 40 it's that value only.

| Tendency | Score |
|---|---|
| Restricted area | 41 + 1.1·rel(rim skill) + 10 big / −3 guard + .5 per 3PT point under 40 − 1.5 per year over 30 |
| Paint | 42 + 1.0·rel(post or floater skill) + 8 big / −2 guard |
| Mid-range | 46 + 1.2·rel(fg) + 4 alpha + 4 touches + 3 volatile + 4 if 31+ − 6 for a big under 50 fg |
| Corner three | 5 + shoot3 + 6 wing / −3 guard / −6 big − .4 × (handle − L) + 4 team player |
| Above-the-break three | 5 + shoot3 + 4 guard / −8 big + .3 × (handle − L) + 4 heat + 2 alpha |
| Usage | 48 + level + weapon + scorer-vs-stopper + option rank (+6 first option … −6 seventh) + team situation + ego − pass-first + age effects |

Each score becomes a share: league share × e^((score − 50)/k), where k is about 28–38 above 50 and 14–22 below. The zones are then scaled to add up to 100.

## L. Loading a card: exactly what happens (`playerCard.ts` applyCard)

The card is rejected if:
- it has no `r` object;
- any rating isn't a number;
- `pos` isn't one of the nine positions.

Otherwise, in this order:

1. `pos`, `hgt`, `wt` and `wing` are copied as given. The group (G, W or B) is set from `pos`.
2. **Every rating in `r` is rounded and kept between 1 and 99.** Ratings the card leaves out keep the player's own values.
3. `pers`: the card's traits are laid over his own, so a missing trait keeps his value.
4. `intg`: Feel and Poise are rounded and kept between 1 and 99. A missing one keeps his value, or 50.
5. Hidden decimal progress is cleared (unless the card carries `_rx`, `_px` or `_gem`, which only an undo does). His overall is computed from the ratings.
6. **His skill ceilings are rebuilt from scratch.** `pot` (kept between his overall and 100) becomes his exact true potential as God Mode's word. His ceilings may go up to 100, his growth plan restarts from today, and the league's read of his potential is reset to the truth (no scouting miss).
7. **Tendencies:**
   - With the current format (`step` or `fade` present): `usage` and `ftr` are kept between 2 and 98; each group of shares (zones, then creation) is scaled to add up to 100; missing shares come from his ratings.
   - With an older format (0–100 scores per tendency, or multipliers in `tend`): the cards play the shot mix they played back then.
   - Without `ten`: tendencies come from his ratings plus his personal quirks.
8. **Freeze tendencies is turned off.** Press it again if you want the card's mix kept.

**What a card does not change:**
- His **work ethic** comes from the card if `pers.work` is set; otherwise he keeps his own.
- His **hidden development factors** (pace, the hidden factor, his development profile and athletic peak) are seeded from his player ID. A card doesn't change them, so the same card grows differently on different players.
- His **hidden gem** status is cleared (no gem).
- His **injury, mood, contract and season fatigue** are untouched.

## M. Hidden development factors (all fixed per player, from his ID)

| Factor | Distribution | Effect |
|---|---|---|
| **Pace** (`paceOf`) | 11%: 0.1–0.3 ("barely develops"); 74%: 0.75–1.1 ("normal"); 15%: 1.1–1.3 ("fast") | Multiplies his yearly plan rate. |
| **Hidden factor** (`devK`) | e^(±0.84 at the extremes), mostly 0.75–1.3 | Growth ×factor^0.6. Decline ÷√factor. |
| **Work ethic** (`workEthicOf`) | 50 ± 18 (5–99) unless set | Growth ×(.7 + work/167). Decline ×(1.2 − work/250). Form roll +(work − 50)/200. Body growth ×(.85 + work/333). |
| **Development profile** | 30% specialist, 20% two areas, 15% well-rounded, 35% organic | Where skill growth goes (section N). |
| **Athletic peak** | age 26–29.5 | When speed, acceleration and jumping start to decline. |
| **Frame** | quickness room 0.5–7 (each of speed, acceleration and jumping), strength +4–16, endurance +3–12 | How much each body rating can still grow from age 18. |

## N. Where growth lands, rating by rating (`development.ts`)

**Skill groups:**
- **shooting:** tp, fg, ft
- **finishing:** ins, lay, dnk
- **playmaking:** pss, drb, oiq
- **defense:** diq, stl, blk
- **rebounding:** reb, box

**Each skill's share of a month's growth** is:

```
group affinity (from his profile, scaled by how well the group fits his position)
 × this year's emphasis (e^(0.25·N) per group, fixed for the season)
 × his game role (roleReps: what he does on the court, from 0.75 to 1.5 by group)
 × age: Offensive IQ, Defensive IQ and Box out grow more with age (×0.65 at 19 up to ×1.4);
         Dunks and Blocks grow more young (×1.25 at 21, falling to ×0.5)
 × training focus: ×2.2 for the focus's ratings, ×0.45 for everything else
 × practice reps in your system's skills
 × cl(1 + (skill − his average skill)/50, 0.6, 1.4)          what he's already good at grows faster
 × cl((ceiling − skill)/12, 0.02, 1.4) × cl((100 − skill)/40, 0.05, 1.2)   slows near his ceiling
```

**More rules:**
- **Neglect.** Skills he isn't working on can slip a little (up to 22% of an even share).
- **Spill.** No skill grows more than about 1.6× faster than an even spread would need.
- **Diminishing returns.** Above 70, only e^(−(skill − 70)/12) of the growth aimed at a skill lands there: about two thirds at 75, half at 78, 30% at 85, 12% at 95. A generational skill (`p.gen`) only starts slowing past 80. What doesn't land goes to his other skills.
- **Caps.** Skills stop at 98.4, or 99.4 for a generational skill or a breakthrough. The overall can never pass true potential; anything over comes off all skills evenly.
- **Decline order** (relative slip): Dunks 1.8, Blocks 1.5, Steals 1.2, Layups/Rebounding 1.0, Ball handling 0.9, Inside 0.9, 3PT 0.65, Box out/Mid-range 0.6, FT 0.55, Defensive IQ 0.5, Passing 0.45, Offensive IQ 0.35. Athleticism goes first; feel for the game lasts longest.

**Training focus options** (your team only):

| Focus | Ratings it targets |
|---|---|
| Balanced | none |
| Shooting | tp, fg, ft |
| Finishing | ins, dnk, lay |
| Playmaking | drb, pss, oiq |
| Defense | diq, blk, stl |
| Rebounding | reb, box, plus strength ×1.2 on body growth |
| Athleticism | speed, acceleration, jumping and strength grow ×1.5 (never past his frame) |
| Conditioning | endurance grows ×1.5 |

**Coaching budget:** growth ×(1 + up to .12) at the $40M maximum, ×(1 − .09) at the $5M minimum, with diminishing returns. Aging is slowed by 60% of that boost. All environment effects together (coaching, facilities, minutes for players 24 and under, the locker room, mentors) are capped at about ±25–30%, weighted toward fringe players.

## O. The body (`bodyChange`)

- **Growth.** Each year a body rating grows by the room left in his frame × this age's share. Speed, acceleration and jumping are done by about 22.5; strength by about 26.5; endurance by about 27. Each year is capped: speed, acceleration and jumping +2.5, strength and endurance +4. That's × focus (above) × (.85 + work/333) × random(0.5–1.5).
- **Decline** per year, × slow (work ethic and `pro` reduce it):
  - **Speed, acceleration, jumping:** 0.4 + 0.5t + 0.04t², where t = years past his athletic peak.
  - **Endurance:** 0.4 + 0.45t, where t = age − 29.
  - **Strength:** 0.3 + 0.35t, where t = age − 31.
- **Young bodies arrive ready.** A new young player starts with his body ratings close to his peak, and his skills start lower by the same weight (the overall is unchanged). That's why prospects look athletic but raw.
- **Height never changes**, apart from a rare one-inch growth spurt in young players.

## P. Intangibles and hidden gems (`intangibles.ts`)

- **Feel** for generated players ≈ .35·oiq + .15·pss + 30 ± 11 (15–99). League average is about 50.
- **Poise** ≈ 52 + 1.2 × (age − 24) ± 11, +10 if `clutch`, −12 if `volatile`, +4 if `pro` (10–99).
- **Neither one counts toward the overall.** In games:
  - **Feel:** better shots for his lineup (+.00012 per point), fewer turnovers, more assists, more steals.
  - **Poise:** clutch shooting (+.0005 per point over 55), late free throws, less road penalty.
- **Hidden gems** (players under 25): base chance 5–7%, raised by Feel over 60, Poise over 60 and work over 60.
  - 62% are role-player gems (+5–9 true potential).
  - 31% are starter gems (+10–15).
  - 7% are star gems (+16–24).
  - The extra potential surfaces over about three seasons: faster with minutes and work ethic, and never after 29.

## Q. Draft translation (`translation.ts`, prospects only)

At his first training camp a prospect's real level shows:
- About half are what the scouts saw (±2).
- The rest are 3–6 worse or better.
- About 1 in 8 is a bust (7–10 worse) or a steal (7–11 better).

One skill group is often better and another worse ("he can really shoot, but he's no point guard"), and his ceiling moves partly with it.

**A card loaded on a drafted prospect before camp** still gets his camp translation. Load the card after camp, or use Freeze attributes, to avoid it.

## R. Injuries and the ratings

- **Risk per game:**
  ```
  .05 × (1 + .05 × years over 27) × (1.45 − endu/100) × (1.25 − stre/200)
      × minutes/30 × 1.8 if prone × (1 + season fatigue/80) × 1.5 if already hurt
  ```
  The medical staff budget shortens recovery.
- **Torn ACL or ruptured Achilles** (0.7% of injuries): out 126–170 games (9–12 months), and speed, acceleration, jumping, strength and endurance each lose 3–7.
- **Any major injury:** half the time he comes back 1–3 points down in one of ball handling, mid-range, 3PT, inside or passing.
- **Under 24 with 2+ minor injuries in a season:** growth ×(1 − .12 per injury), at least .4. With 3+, there's a 20% chance a month to lose 1 point of true potential.
- **Freeze attributes** blocks these rating losses too.

## S. The remaining tendency formulas (`tenTargets`)

L, rel(x) and shoot3 are defined in section K. "handle" = (drb + acc)/2, and "finishing" = max(dnk, lay).

| Tendency | Score (then a personal quirk is added, and the result is kept between 2 and 98) |
|---|---|
| Catch and shoot | ramp(50 + 1.8·(tp − 50) → 50 + .85·rel(tp)) − .5·(handle − L) + 8 team player + 3 pro |
| Pull-up | 50 + 1.3·rel(avg(drb, avg(fg, tp))) + 6 heat + 3 flashy + 3 alpha + 3 touches − 10 big |
| Stepback | 50 + 1.3·rel((drb + acc + max(tp, fg))/3) + 5 flashy + 4 heat + 3 alpha − 16 big / −2 wing / +2 guard − 1.5 per year over 31 |
| Fadeaway | 50 + 1.1·rel(.55·fg + .45·post) + 3 alpha + 3 touches + 3 big / −3 guard + 1.2 per year over 29 |
| Free-throw rate | 41.5 + 1.1·rel(attack) + 3 big + 2 fearless + 1 flashy − 1 per year over 31 |

**More definitions:**
- **post** = .5·ins + .25·stre + .25·hgt.
- **attack** for a big = .45·post + .3·dnk + .25·stre. For anyone else = .3·acc + .15·spd + .25·drb + .3·finishing.
- **Usage** = 48 + level + weapon + scorer-vs-stopper + rank + situation + ego − pass-first + age, where:
  - level = .55 × (offensive ability − 57), halved when negative for alpha or padder;
  - weapon = cl((best scoring skill − 64)/4, 0, 4);
  - scorer-vs-stopper = cl(.35 × (offensive ability − defensive ability), −6, 3);
  - rank (offensive option on his team) = +6, +3, 0, −2, −4, −5, −6;
  - situation = +3 for 24 and under on a rebuilding team, −2 for a young non-first option on a contender;
  - ego = cl(alpha 6, touches 4, padder 3, heat 2, fearless 2, legacy 1.5, flashy 1, volatile 1, team −5; total −5 to 8);
  - pass-first = cl((pss − offensive ability) × .12, −3, 4);
  - age = −3 for a 20-year-old who isn't the first option, −3 at 33+.
- **Personal quirks:** fixed per player, about ±7 on each score (±3.5 on usage).
- **From scores to shares:** league share × calibration × e^((score − 50)/k), then each group is scaled to add up to 100. Calibration: ra 1.03, paint 1.17, mid 1.12, corner 0.91, above the break 0.985. For creation: cns 1.083, pullup 1.016, step 0.73, fade 0.86. k above 50 / below 50: ra, paint and mid 28/22; corner 34/14; above the break 38/14; creation 22, 20, 15 and 15 either way.
- **Role multipliers:** Slasher rim ×1.3, Floor spacer threes ×1.25, 3-and-D wing corner ×1.4, Stretch big threes ×1.5.

## T. Small things that still matter

- **Hot and cold streaks** (`streaky`): each game day `hot` = .85 × yesterday's + a random amount, kept between −1 and 1. It moves every jump shot by up to ±9% (±2.5% at the rim).
- **Heat check:** after 2 straight makes, usage ×1.45, above-the-break threes ×2 and −2% per shot.
- **Tilt** (`volatile`): after 3 straight misses (or any miss while down 18+), usage ×1.3 and −4% per shot.
- **Adjusting** (back from overseas): −3% per shot until the adjustment games run out.
- **Playing hurt** (day-to-day): −3% per shot, usage ×0.9, starts with 5 less energy.
- **Selfish teammates** (`padder`): −1.5% on everyone else's shots; selfish defenders give the offense +1.2%.
- **Defensive three seconds:** bigs with low Defensive IQ get called about 0.4 times a game. Each call is one technical free throw.
- **Fouls:** who commits each foul is weighted by (110 − diq).
- **Garbage time:** up 20+ with 5:00 left (or 24+ with 8:00, 15+ with 3:00), the deep bench plays.
- **Tactics:** your team's schemes (pace, defense, focus) shift shot mixes and make rates, and add practice reps that steer growth toward the system's skills (sections D and N).
- **Ratings shown in the game are rounded.** Hidden decimals (`rx`) keep counting, so a 74 can be 74.9.

## U. Minutes, roles off the court, hidden traits and advanced stats

**Minute targets by rotation spot.** Players are ranked by overall (or your order and minutes if you set them by hand):

| Spot | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11+ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Regular season | 34 | 33 | 32 | 30 | 28 | 24 | 20 | 17 | 14 | 6 | 2, then 0 |
| Playoffs | 39 | 38 | 37 | 35 | 32 | 24 | 18 | 12 | 5 | 0 | 0 |
| Elimination game | 41 | 40 | 38 | 36 | 34 | 27 | 21 | 3 | 0 | 0 | 0 |

- A promised minimum (`minMin`, from a contract promise) raises his target to at least that.
- Hand-set minutes (Roster → Manual) replace the target. A lineup style (Small ball, Twin towers) can't push a hand-set player far past his minutes.
- In-game, fouls, fatigue, blowouts and the late-game rules move these.

**"Protect his percentage."** A player on a three-point bonus clause can ask to take fewer threes. If you agree (`p.protect`), his threes are halved in his shot mix and −2% on the ones he still takes, for the rest of the season.

**Hidden personality values** (not in cards unless you add them):
- **`mal`** (malleability, 3–97, average 50): how open he is to his personality changing. Each month there's a small chance a trait flips. The chance is ×(mal/100)² × 2.5 (90 → 2.0, 50 → 0.63, 20 → 0.1), × age (1.3 at 22 or younger, 1.0 to 25, 0.6 to 29, 0.3 older), × his mentor, × the locker room. A good mentor can remove bad habits and pass on good ones; a bad locker room breeds egos.
- **`loyalty`** and **`ambition`** (0–100): only used when a promised free agent decides whether to sign with a rival. If left out they come from `mot` (Loyalty 75, otherwise 45; ambition 75 for Money or Fame).

You can put `mal`, `loyalty` and `ambition` in a card's `pers`; they're copied like the other traits.

**Advanced stats** (`advanced.ts`; for reading results, they don't affect play). "Team" values are his team's; per-100 values are per 100 possessions while he's on the floor.

| Stat | Formula |
|---|---|
| TS% | PTS / (2 × (FGA + .44 × FTA)) |
| eFG% | (FGM + .5 × 3PM) / FGA |
| USG% | (FGA + .44·FTA + TOV) × (team minutes/5) / (MIN × team (FGA + .44·FTA + TOV)) |
| AST% | AST / (his share of team made shots − his own FGM) |
| ORB%, DRB%, TRB% | his rebounds / available rebounds while he's on the floor |
| STL% / BLK% | per opponent possession / per opponent two-point attempt, while on the floor |
| TOV% | TOV / (FGA + .44·FTA + TOV) |
| PER | 15 × (efficiency per minute) / league efficiency per minute, where efficiency = PTS + REB + AST + STL + BLK − missed FG − missed FT − TOV |
| ORtg / DRtg | points produced per 100 possessions used (simplified Dean Oliver, scaled so the league adds up) / team DRtg − .5 × (his stops per 100 − league average) |
| OWS / DWS / WS / WS/48 | marginal offense and defense over replacement, in wins |
| BPM | Offense: .8 × per100(.86·PTS − .56·FGA − .246·FTA + .389·3PM + .807·AST − .964·TOV + .397·ORB). Defense: per100(.25·DRB + 1.6·STL + 1.2·BLK − .3·PF). Each adjusted so his team's minute-weighted BPM matches its ratings, then shrunk toward −1.5 / −0.5 under 500 minutes. |
| VORP | (BPM + 2) × his share of team minutes × games/82 |
| EWA | (PER − 11) × MIN / 67 / 30 |
| On/Off | his +/− per 100 possessions − the team's per 100 without him |
| EPM (estimate) | Box prior blended with on/off. O = OBPM × (1 − w) + ½·on/off × w (same for D, with DBPM), w = possessions / (possessions + 6000). Then centred on the league (minute-weighted 0) and ×0.6. |
| LEBRON (estimate) | Same blend with luck-adjusted on/off: his own 3P% is regressed toward the league's with 750 attempts, and 3 × (made threes above that) per 100 is taken out of his on/off. w = possessions / (possessions + 5000). Centred, ×0.55. |
| DARKO (estimate) | His current level: this season's OBPM/DBPM and his last three seasons' raw box per 100, weighted by possessions × 0.55 per year back, regressed toward −1.5 with a 1,500-possession prior, then +0.4 a year under 26 and −0.4 a year over 30. Centred, ×0.65. |

The real EPM, LEBRON and DARKO use player-tracking data, play-by-play lineups and models that aren't public. These follow each one's published method with the data the game keeps, and are scaled so the league's best are about +7 to +10.

That is everything that touches a player's ratings, development and stats. Contracts, mood, trade value and awards come from these same numbers but don't feed back into how he plays.

# Code and game review — October 29, 2026

Reviewed source revision: [`a40d31fa`](https://github.com/swagman1337qq/basketball/commit/a40d31fa3a958a4be772b13d16e5ae6f271d4c70), on `claude/basketball-gm-website-2h8gs7`.

The review found **16 reproducible defects: 5 P1, 10 P2, and 1 P3**. The most consequential problems are season/setup crashes, incorrect ownership of traded picks, and contract/cap accounting. The ordinary season loop works in the scenarios tested, but passing a normal season does not exercise these failures.

No production game code was changed, and nothing was committed, pushed, or deployed. This document and `.review/` contain the review and its evidence.

## Scope and evidence

- Inventoried **204 source files, 30,908 lines**, plus build/deployment and offline files. Before writing the review documents, compared all 204 source files and 10 selected documentation/package files with GitHub's blob hashes: **214 matches, no differences**.
- Read the project instructions, README, handoff/product specification, feature map and issue checklist, implementation-status document, and relevant advanced-stat documentation and changelog history. The handoff describes the original product; later changes supersede many of its rules.
- Reviewed the high-risk engine paths in depth: creation/load/save, regular season/play-in/playoffs, draft/free agency/camp, player development and aging, trades and pick rights, signing/waivers/extensions, finances/owners, scouting/overseas, pruning, and browser integration. Inventoried the remaining data, presentation, and utility modules and exercised the principal screens.
- Retrieved the **complete 382-commit source-branch ancestry**, from the initial build on September 25 to October 28. Read the commit chronology and changelog and inspected selected historical patches to identify origins and interactions. This is **not a claim that every line of all 382 historical patches was independently audited**. The full commit inventory is `.review/history.json`.
- Executed the actual engine modules after removing TypeScript syntax with Node's built-in transform. The only stub is React's `createElement`, used for face rendering; simulation, contracts, development, and save logic are the real modules.
- Saved a reusable probe script: **`.review/reproduce.mjs`**. Run `node .review/reproduce.mjs` with Node 24 or later. All **F01–F16** reproduced in the final run; evidence is in `.review/reproduced.json`. The script intentionally reports whether each defect is observed, so `observed: true` means the defect is still present.
- Additional season-run evidence is in `.review/results.json`. Fixtures construct valid feature situations directly; they are not all click-by-click browser reproductions.

## Confirmed findings

### F01 — P1: Managing all 30 teams crashes league creation

**Trigger:** select every club, then create the league. `Game.create(44, [0, …, 29])` throws `Cannot read properties of undefined (reading 'tid')`.

`initState` assumes an unmanaged team exists when selecting the trade partner. The same assumption exists in the preseason rollover, so acquiring control of every team later also threatens progression. The README explicitly supports managing all 30.

**Location:** [Game.ts:840](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L840), [Game.ts:1697](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L1697).

**History:** both unsafe selections were introduced with multi-team control in [`22a306b3`](https://github.com/swagman1337qq/basketball/commit/22a306b3). **Repair:** permit a managed club as the trade partner, with a safe fallback when every club is managed, and test both creation and rollover.

### F02 — P1: Releasing a player overseas erases guaranteed cap obligations

**Trigger:** release a player with $40M annually and four future contract seasons to an overseas club through his normal profile action.

The roster loses the player, but the release bypasses the waiver/dead-money machinery entirely. In the probe, team salary fell from **$145.21M to $105.21M**, with **zero dead money**. A player can shed an unwanted guaranteed contract using the overseas action rather than paying the ordinary waiver cost. This action is available outside God Mode.

**Location:** [Game.ts:2474](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2474), compared with [contracts.ts:125](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/contracts.ts#L125).

**History:** the direct roster removal dates to the [initial build](https://github.com/swagman1337qq/basketball/commit/9695c50e); it was left in place when the full CBA was added. **Repair:** settle the existing contract through a common release operation before placing the player abroad.

### F03 — P1: A waived extension survives a new contract and activates for the new team

**Trigger:** waive/buy out someone who already has a signed future extension, then sign him to a new deal elsewhere.

`remainingGuaranteed` stops at `p.exp` and excludes the signed extension. Neither the waiver nor `applySigning` removes `p.ext`. The next free-agency rollover consequently replaces the player's new contract with the old extension. The final probe signed a new **$2.85M** deal; the next rollover changed it to the previous **$30M extension through 2031**, while the original team's dead-money calculation included only its $10M current season.

**Location:** [cba.ts:247–252](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cba.ts#L247-L252), [contracts.ts:34–48](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/contracts.ts#L34-L48), [contracts.ts:125–140](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/contracts.ts#L125-L140), [cbaFlow.ts:335](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L335).

**Repair:** include extension guarantees when terminating the original contract, and clear all superseded contract state on a genuinely new signing. Preserve it on an actual waiver claim, where the old contract travels intact.

### F04 — P1: A pick swap can transfer a third team's pick without consent

**Trigger:** club A owns swap rights against B, then trades its own first to C before the lottery. B's pick lands better.

Settlement exchanges the `owner` fields of A's original pick and B's original pick without establishing that those owners are the parties entitled to exercise the swap. In the probe, a pick owned by **team 2** was reassigned to **team 1**; the swap holder was **team 0**, which received neither pick. An unrelated buyer's asset is silently changed.

**Location:** [pickRules.ts:39–44](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/pickRules.ts#L39-L44), trade recording at [Game.ts:2505–2506](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2505-L2506).

**History:** swap settlement arrived in [`8f347362`](https://github.com/swagman1337qq/basketball/commit/8f347362). **Repair:** model the rights and underlying pick encumbrances explicitly, and validate the ownership chain when trading and settling them.

### F05 — P2: Ordinary signing methods bypass restricted-free-agent matching rights

**Trigger:** open an opposing RFA's signing dialog and choose an ordinary available method, such as the non-taxpayer MLE, instead of `Offer sheet`.

The dialog exposes those methods. `userSign` invokes matching only when `t.method === 'offer'`; an MLE/cap/minimum signing otherwise goes straight through `applySigning`, which deletes `p.rfa`. The probe signed the player with **zero pending offer sheets**, even when his original team was another managed club.

**Location:** [cba.ts:153–181](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cba.ts#L153-L181), [cbaFlow.ts:114–132](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L114-L132), [ContractDialog.tsx:55–56](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/ui/modals/ContractDialog.tsx#L55-L56).

**Repair:** decide whether matching is required from the player's status and destination, independently of the funding method.

### F06 — P2: The `offer` method signs RFAs without spending its funding source

**Trigger:** sign an opposing RFA via `Offer sheet`, and have the original club decline to match.

`offer` is treated as a signing method but does not retain the actual cap/exception method behind it. `applySigning` does not debit an exception or record cap-space use for it, and it triggers no corresponding hard cap. A **$10M offer sheet** left all **$15.05M of the non-taxpayer MLE available**, with `used: []` and no hard cap.

**Location:** [cba.ts:153–155](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cba.ts#L153-L155), [contracts.ts:55–61](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/contracts.ts#L55-L61), [cbaFlow.ts:157](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L157).

**Repair:** make an offer sheet a transaction status that wraps validated cap-space or exception terms, and reserve/consume that funding consistently.

### F07 — P2: Matching an offer sheet checks the wrong hard-cap line

**Trigger:** match an RFA while hard-capped at the first apron, with enough salary to exceed AP1 but remain below AP2.

The guard compares every hard-capped team against `N.AP2`. A team at **$207M**, hard-capped at **$209M**, successfully matched a **$5M** offer and reached **$212M**. Ordinary signing validation would reject it.

**Location:** [cbaFlow.ts:156–157](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L156-L157).

**History:** F05–F07 are visible in the original [full-CBA commit](https://github.com/swagman1337qq/basketball/commit/958e97cc). **Repair:** run matching through common validation using the actual AP1/AP2 cap and all salary components.

### F08 — P2: A legal hardship signing prevents the team from playing

**Trigger:** have 15 standard contracts and four injured players, then use the offered hardship exception.

The signing validator correctly allows the temporary 16th player. The global roster guard counts that hardship contract as an ordinary excess player and blocks every game. The probe returned **valid signing, player signed, 16 contracts, `canPlay() === false`**.

**Location:** [cba.ts:178](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cba.ts#L178), [Game.ts:2211–2219](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2211-L2219).

**History:** the blanket blocking guard was added in [`93bb6abc`](https://github.com/swagman1337qq/basketball/commit/93bb6abc), after hardship contracts existed. **Repair:** count valid hardship allowances consistently in signing, display, and simulation eligibility.

### F09 — P2: Stepien validation ignores incoming first-round picks

**Trigger:** exchange two consecutive years' firsts for another club's firsts in those same years.

Both clubs retain a first in each year after the transaction. The validator removes outgoing picks but never adds incoming ones, so it rejects the exchange as leaving both clubs without consecutive firsts. The probe exchanging **2028 and 2029 firsts** produced that false rejection for both teams.

**Location:** [cba.ts:227–229](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cba.ts#L227-L229).

**Repair:** evaluate each club's projected ownership after the entire transaction, including incoming assets and relevant contingent obligations.

### F10 — P2: Pre-Free Agency ignores decisions for other managed clubs

**Trigger:** manage two clubs, finish the active club's required decisions, and open free agency while another managed club still has unresolved decisions or a selected `Don't re-sign` choice.

The phase gate checks only `s.me`. Renunciation also collects `let` decisions only for `s.me`. The probe advanced with **three unresolved decisions for the second club**; its player explicitly marked to leave still had that club's Bird rights afterward. These holds affect the second club's usable cap room.

**Location:** [Game.ts:1445](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L1445), [cbaFlow.ts:356](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L356), [cbaFlow.ts:366–367](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L366-L367).

**History:** the active-club-only checks were introduced in [`79c32c33`](https://github.com/swagman1337qq/basketball/commit/79c32c33). **Repair:** gate and apply required decisions for every managed club, and maintain per-club renunciation results.

### F11 — P2: Postseason games skip injury and between-game fatigue updates

**Trigger:** simulate a play-in or playoff game, including a watched result submitted through the postseason path.

The possession engine is shared, but its surrounding lifecycle is not. Regular-season games call injury, fatigue, and adjustment updates. `postGame` records stats and the playoff callers decrement existing injuries, but never run the new-injury or between-game fatigue tick. Instrumenting a playoff game produced **one completed game, zero injury-tick calls, zero fatigue-tick calls**. In-game energy still exists; this finding concerns condition across games. Overseas adjustment countdowns also remain on the regular-season path.

**Location:** [Game.ts:1272–1277](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L1272-L1277), compared with [Game.ts:2283–2285](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2283-L2285).

**Repair:** share a post-game player-condition operation across regular season, play-in, playoffs, quick simulation, and watched games.

### F12 — P2: Expansion gives second-round draftees incorrect pick numbers

**Trigger:** expand to 32 teams and draft at overall pick 33, the first selection of round two.

The stored record becomes **round 2, pick 3** because the engine subtracts 30. The boycott branch has the same constant. This permanently misrecords the player's draft metadata; larger expansions increase the error. The second-round salary path itself remains a minimum/two-way path.

**Location:** [cbaFlow.ts:290](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L290), [cbaFlow.ts:330](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/cbaFlow.ts#L330).

**Repair:** derive the round-relative pick from the actual number of clubs/picks in the first round, including forfeitures under the chosen numbering convention.

### F13 — P2: Saving and reopening a brand-new league changes player ratings

**Trigger:** create seed 2027, export its state immediately, and load it again with the same code version and no games played.

The load path recomputes automatic positions after generation's later body/rating/feel changes. Generation's earlier position normalization does not guarantee the same final state. In the probe, **18 players changed position group or overall**, with 52 position/summary changes in the initial broader comparison. Player 130 changed **PG/G, 58 overall, 63 true potential** into **SF/W, 55 overall, 61 true potential** simply on load.

**Location:** [Game.ts:730–739](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L730-L739), [Game.ts:388–389](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L388-L389), [Game.ts:2088–2097](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2088-L2097).

**History:** automatic positions were expanded on October 26. **Repair:** finalize generated players with the same normalization used on load, after all build transformations; require a same-version round trip to preserve the player build.

### F14 — P2: Paid incentive bonuses remain an expense in later seasons

**Trigger:** earn incentive bonuses, then roll into another season.

`seasonReview` accumulates `bonusPaid`, and finances includes that number as this season's expense. It is never reset for a new season. The probe carried a **$5M incentive expense** unchanged into the next preseason without new earnings. `bonusPaid` is also absent from `CLUB_KEYS`, so it does not follow the ordinary per-club switching mechanism.

**Location:** [frontOffice.ts:267–268](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/frontOffice.ts#L267-L268), [frontOffice.ts:149](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/frontOffice.ts#L149), [Game.ts:885](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L885).

**History:** the accumulation and expense appeared with incentives in [`3e72b2cb`](https://github.com/swagman1337qq/basketball/commit/3e72b2cb). **Repair:** store paid bonuses by club and season, archive them with financial history, and reset the current-season expense.

### F15 — P3: Public-asset changes do not invalidate the offline cache

**Trigger:** update the contents of an existing public file, such as an icon or flag, without changing filenames or the generated bundle names.

The service-worker version hashes only the list of filenames. Its content and version remain identical, so the browser has no changed worker to install; cache-first assets can stay stale. The probe ran the actual plugin against isolated public fixtures and changed `icon.svg` contents: the generated service worker was **byte-for-byte identical**.

**Location:** [offlinePlugin.mjs:15–18](https://github.com/swagman1337qq/basketball/blob/a40d31fa/pwa/offlinePlugin.mjs#L15-L18), [sw-template.js:34–37](https://github.com/swagman1337qq/basketball/blob/a40d31fa/pwa/sw-template.js#L34-L37).

**History:** introduced with offline support in [`663dd67c`](https://github.com/swagman1337qq/basketball/commit/663dd67c). **Repair:** include content hashes for public assets in the version/precache manifest.

### F16 — P1: Paying an overseas buyout with a pick crashes the future draft

**Trigger:** negotiate an overseas buyout and include a second-round pick, then reach the draft containing that pick.

The negotiation succeeds and marks the pick's owner as **-1**, representing the overseas compensation. Draft progression still tries to use it as an ordinary club-owned pick; `aiDraft` obtains `teams[-1]` and then reads its abbreviation. The probe negotiated for Mark Johnson, surrendered **2028-2-0**, and reproduced `Cannot read properties of undefined (reading 'abbr')` when that selection came up. The season cannot finish the draft through this path.

**Location:** [overseas.ts:40–46](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/overseas.ts#L40-L46), [Game.ts:2361–2388](https://github.com/swagman1337qq/basketball/blob/a40d31fa/src/engine/Game.ts#L2361-L2388).

**Repair:** give forfeited picks an explicit state and consistently skip/record them in lottery order, draft progression, ownership display, and signing. Do not pass a non-club owner into club operations.

## Validation that passed

| Check | Result |
|---|---|
| Normal season progression | Two complete 30-team regular seasons, each **1,230 games**, plus both play-ins, playoff brackets, drafts, free agencies, camps, and opening nights |
| Expansion | Expanded to **32 teams**, completed camp/opening night, then simulated **five days / 80 games** |
| Structural invariants | At recorded checkpoints: no duplicate player across NBA rosters, free agency and overseas; no retired/missing player in those pools; finite overall/potential/salary/expiry; ratings within bounds |
| Raw box-score arithmetic | Three worlds: seed **7, 44, 2027**; both teams' points matched shots and player totals, minutes matched 240 plus overtime, plus-minus summed to five times the margin, and makes did not exceed attempts |
| Stored boxes | All **80** saved boxes after expansion matched player point totals to team scores |
| Compact save records | Semantic comparisons preserved rosters, player statistics/transactions/rating history, team totals/history, and awards, including the expanded league; repeated load was stable. This does not negate F13's new-player build changes |
| Published browser app | Created a separate league named **Code review — 2026-10-29**, completed a quick game and a watched game, visited 30 principal navigation screens, explicitly waited for lazy screens, and verified a reload retained the **1–1** save |
| Browser logs | No warnings/errors reported during those smoke checks |
| Deployment | Latest source commit's [GitHub Actions deploy run](https://github.com/swagman1337qq/basketball/actions/runs/40771365280) completed successfully |

The browser test league remains separate from any real league. The browser initially had no saved leagues.

The second simulated regular season averaged **117.73 points, 47.46% FG, 36.26% 3P, 39.02 three attempts, 23.37 free throws, 14.43 turnovers and 26.01 assists** per team per game. Scoring and three-point volume were above the current baseline, but one league is insufficient to call that a balance defect. The historical changelog's 10–100-season experiments were read as prior evidence, not represented as tests rerun in this review.

## Evolution since the game's first commit

| Period | Principal changes and review implications |
|---|---|
| **Sep 25 — 8 commits** | Initial React/Vite/IndexedDB game; genuine league-wide games replaced estimated outcomes; baseline possession engine, multi-team control, play-in/playoff bracket, awards, owners/jobs/incentives, scouting/development, editors. Several surviving lifecycle assumptions date to this first day: F01, F02, F14 |
| **Sep 26 — 71 commits** | Full CBA and long cap outlook; global player backgrounds, stats/scouting pages, families/Hall of Fame, GM contracts/tutorial, G League and expansions, player cards and extension windows. Contract mechanisms became much richer without a single common transaction-validation path; F03, F05–F07, F09 and F12 concern those boundaries |
| **Sep 27–30 — 63 commits** | Overall from skills, star usage/efficiency controls, deeper CCP simulation, scouting briefs, custom cards and traits, owner sales, protected picks/swaps, contract conversions, roster and schedule improvements. F04 concerns the added swap ownership model |
| **Oct 1–4 — 64 commits** | Pre-Free Agency, separate blocks/steals, extensive development/potential/environment and draft-translation rework, trade outlooks and offers, global card library, injury restoration, Spectator Mode, roster enforcement and duplicate-pick repair. F08 and F10 are integration regressions from this period |
| **Oct 5–12 — 58 commits** | Shooting/tendency and free-throw recalibration, faces and body/length effects, coaching/tactical control, injury/calendar fixes, richer player cards and data |
| **Oct 14–18 — 59 commits** | Endgame decision-making, energy/fatigue, measured overall weights, tracked on/off and expected points/RAPM estimates, drift correction for pace and shot mix, revised award formulas, star minutes, draft and salary-rank tuning |
| **Oct 20–23 — 30 commits** | Long-save compaction and cache/performance fixes, stronger salary-market/floor behavior, rookie and upper-talent compression, position-based development allocation, shot creation and measured weights. These have useful documented experiments but still need repeatable repository checks |
| **Oct 25–28 — 29 commits** | Offline/installable app, automatic positions, team TV/sponsor contracts, amateur statistics and player cards, overseas circulation/pricing, ceiling fitting and skill-specific aging forecasts. F13 and F15 concern recently added creation/load and offline behavior |

Source history begins at [`9695c50e`](https://github.com/swagman1337qq/basketball/commit/9695c50e) and ends at [`a40d31fa`](https://github.com/swagman1337qq/basketball/commit/a40d31fa). The inventory covers source-branch ancestry, not generated `gh-pages` deployment commits or inaccessible/deleted branches.

The recurring pattern is **feature interaction**: a feature works in isolation, while another path misses its rules. Examples are hardship signing versus roster enforcement, offer sheets versus funding, waivers versus extensions, overseas compensation versus draft progression, and multi-team control versus active-team-only decisions. Recent calibration work does not address those transaction invariants.

## Other risks and limits

These are separate from the 16 reproduced defects, and several are already acknowledged in `FEATURE_MAP.md`:

- **No repository test command or CI regression suite.** The deploy runs installation and the build. The review probes are evidence, not a complete production test suite. Preserve these failure cases as assertions when fixing them and add a seeded season/transaction invariant suite.
- **Weak type coverage.** `strict` and `noImplicitAny` are disabled; the central state/database are `any`. A successful typecheck does not validate ownership graphs, contract transitions, save schema, or phase invariants.
- **Error recovery and imports.** There is no React error boundary. Opening a league has no guarded `Game.load`; import validation checks only a few envelope fields and can store a save the engine cannot load. Add schema/version validation and a recoverable error screen without overwriting the original save.
- **Dense central modules and many migration flags.** `Game.ts` is about 271 KB, and view-model logic contains very long lines. Separate phase orchestration and transaction application; type the state passed between them. Include migration fixtures from real historical versions.
- **Documentation drift.** The original handoff still describes rules/features that later changed; some checklist text and advanced-estimate introductory wording predate current implementations. Treat the changelog, current code, and tests as evidence together, rather than interpreting every original specification difference as a bug.
- **Balance and long careers remain empirical.** The newest aging/ceiling changes, extreme records, salary-market settling, scouting miss quality, and advanced-metric predictive quality need multiple leagues and long-run distribution checks. This review did not independently reproduce every historical calibration claim, verify all real-world source data, exhaust every card/face/country combination, or test every mobile/browser/storage-failure scenario.

**Local build limitation:** this source export has no `.git`, installed project dependencies, or `node`/`npm` executables on the shell path. I did not claim a local `npm run build` or typecheck. Instead, I verified the exact source revision, inspected its successful deployment, ran the headless engine with the available Node runtime, and smoke-tested the published browser application. No dependency installation was required.

## Recommended repair order

1. Fix **F01, F03, F04 and F16** to prevent progression failures and persistent contract/asset corruption; close **F02**'s guaranteed-salary escape.
2. Unify RFA, funding and hard-cap validation (**F05–F07**), then roster allowances and post-game condition updates (**F08, F11**).
3. Correct projected pick ownership and every managed club's offseason decisions (**F09–F10**), then draft metadata, creation/load consistency, annual expenses and cache invalidation (**F12–F15**).
4. Turn the reproductions into permanent regression tests before further balance tuning, then run a multi-league long-career distribution suite.

The review is complete for the scope and checks described above. The findings are **unfixed** and ready for implementation review.

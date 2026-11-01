# Review regression checks

Use Node 24 or newer from the repository root:

```sh
node .review/regressions.mjs
node .review/reproduce.mjs
```

The regression runner asserts the requested fixes. The original reproductions record whether each old defect is still observed; F01, F07, F13 and F15 intentionally remain observable. Tests transform TypeScript with Node's built-in transform and stub only React's createElement; simulation and contract code run unchanged. Generated runtime folders and temporary toolchain downloads are ignored.

## Historical player-card audit

Node 24+; no additional packages are required for the engine tests.

```sh
node .review/test-card-migrations.mjs
node .review/test-player-cards.mjs
node .review/test-player-cards.mjs --current 0 24
node .review/summarize-card-results.mjs
node .review/report-player-cards.mjs
```

The 25-card manifest preserves original builds; historical targets carry independently checked season/source links. The final run uses production presets. Each run covers 15,000 NBA games; college games are stress tests and the four college comparisons use the separate amateur model. The committed summary preserves the measured original baseline; rerunning on current code also applies the small Culver application correction. Running summarize uses freshly generated baseline/current raw results. Optional range arguments after --current permit independent batches; the summary script combines them.

`card-selected-fits.json` stores accepted/rejected independent comparisons, not a claim of all-category accuracy. `verify-current-card-fits.mjs` and `verify-college-current.mjs` can rerun candidate checks. See `docs/PLAYER_CARD_AUDIT_2026-10-29.md` for exposure, tolerances, limits and remaining work. Raw results, downloaded source responses and local toolchains are ignored.

## Realism fixes (2026-10-30)

```sh
node .review/test-realism.mjs
node .review/test-card-migrations.mjs
node .review/test-player-cards.mjs --current 0 24
node .review/validate-realism-college.mjs
node .review/check-realism-league.mjs
node .review/refresh-realism-results.mjs
node .review/report-realism-fixes.mjs
```

The final report is docs/PLAYER_CARD_REALISM_FIXES_2026-10-30.md. The compact realism-results dataset preserves the measured previous live baseline even when refreshed. Current simulations use the production engine and source presets. Optional comma-separated indices after the range select a subset for a recheck; the refresh script chooses the latest results per card. College validation uses production applyCard and 300 fresh identities per card. Generic-player style fixtures and generated-league baseline measurements are committed so the checks run without old temporary runtimes. Original builds and final-build records are retained as JSON; staging optimizer losses are omitted.

## Jeremy Lin’s 2011–12 Knicks card

Run `node .review/validate-jeremy-lin.mjs` for 900 fresh games across three generated worlds and authored/AI styles, plus import and identity checks. Historical totals, final measurements and the exact card are in `jeremy-lin-validation.json`; comparison bands and limitations are in `docs/JEREMY_LIN_CARD.md`.

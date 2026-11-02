# Finishing execution update — 2026-11-02

The engine now chooses a real finishing technique before resolving the attempt. Layups, dunks, floaters, hooks, tips and short paint jumpers have separate execution functions and actual made/attempt counters. Inside no longer contributes to every ordinary layup; Dunk skill cannot directly improve a fixed layup's execution.

The shared implementation is src/engine/finishing.ts. Conditional probabilities depend on technique-specific skills, with type-weighted normalization in norms.ts. Physical defense, fatigue, spacing, passing and game context still affect results. Technique baselines and slopes are population calibration parameters, not uniquely measured historical abilities.

## Playing style and events

Dunk share is a new 0–100 percentage preference for restricted-area attempts, separate from dunk execution. Zero is allowed. Availability changes smoothly with physical ability; the old rating-62 label switch is gone. AI refresh, authored card anchors, manual edits, freezes, import/export and undo preserve the preference appropriately. Old cards receive a natural default.

The profile shows tracked finishing makes/attempts. finishRaA provides the denominator for games played under the new model, so earlier games do not dilute the new dunk share. Older untracked counts are not reconstructed. Existing aggregate rim/mid/three statistics retain their meanings; paint has separate execution inside the legacy mid aggregate.

Shooting-foul actions now select an actual shooter, zone and technique before the outcome. Fouled misses receive no FGA; fouled makes receive a made field goal and one extra FT. A three-shot foul follows an actual three-point attempt. The former independent flat and-one draw is removed. Contact make probability uses a calibrated reduction of the ordinary attempt probability; this is a simplified conditional model, not tracking-derived contact physics.

Actual putbacks belong to the offensive rebounder; a kick-out is a recycled possession. Both stay quick, while only an immediate putback receives putback technique choice. Continuation state clears at quarter boundaries. Normal-shot priors reserve estimated transition/contact and rebounder-specific putback exposure, so special shots do not simply add extra rim volume on top of the authored diet.

Descriptions are deterministic functions of the resolved technique. Watching a game no longer consumes additional basketball randomness for dunk labels or turnover wording.

## Other simulation paths and compatibility

CCP quick and full games share execution semantics; the quick model keeps cheaper context approximations. Amateur results use the same technique meanings with competition scaling. Historical draft shaping no longer pretends aggregate 2P% independently measures Inside, Dunks and Layups.

A new finishV=1 migration refreshes finishing norms without changing player ratings, identity, contracts or past statistics. Retired-player pruning includes new counters. Custom cards/tendencies remain editable and frozen choices remain frozen. F13 auto-position behavior and F15 public-cache behavior are outside this change.

Seven existing presets were adapted: Luka/Chris Paul foul-drawing preferences, Howard volume, Vesely/Kirilenko/MVP Embiid non-dunk execution, and the Knicks Lin card. Only relevant preferences/skills changed; no common Inside/Dunk/Layup/FG shift was used. Untouched library copies update through archived exact versions. Reapply a card to update an existing league player.

## Validation

- scripts/finishingKernel.mts: fixed-technique independence, frequency/ability separation, monotonicity, zero preferences, smooth availability and exposure-weighted normalization.
- scripts/finishingPreferences.mts: card defaults, 0/100 preferences, AI anchors, freeze, import/export, undo and custom carrier edits.
- scripts/finishingIntegration.mts: 20 same-seed watched/quick pairs; NBA and CCP zero-dunk games; subtype/zone/points identities; fouled miss, and-one, block and rebounder-putback branches; amateur/historical semantics; old-history save roundtrip; paint-only players cannot recenter true mid-range jumpers; quarter-boundary continuation reset.
- All 26 previous cards compared on frozen before/after engines, then current adapted cards screened over 12,480 production games across three worlds and authored/AI styles. The remaining flag was Horford's tiny three-point sample: 9 makes in 31 attempts across 480 simulated appearances. It does not warrant changing his three-point skill from this evidence.
- Final generated-league screen: seeds 11/12/13, three full seasons total, all diagnostic bands passed and no broken states. A prior nine-season development screen found three tail outliers (a 39.6-ppg leader, a 9%-win team and a 90%-win team); other league averages and talent drift passed. The final exposure/normalization changes followed that longer screen, so it is not a final nine-season guarantee.
- Lin's focused 1,200-game check is recorded separately in docs/JEREMY_LIN_CARD.md and .review/jeremy-lin-validation.json.
- Typecheck and production build required before release.

## Limits

This is a tested first finishing rework. Half-court origins, contest/contact severity and natural technique mixes remain approximations. It is not a full court-position/tracking simulator. Existing overall weights have not been re-estimated against the new model; they retain their earlier calibration. Individual cards remain statistical approximations with sampling uncertainty, and matching totals does not uniquely establish intrinsic skill.

The broad historical carrier-migration test's pre-existing Luka dominance mismatch is still documented in FEATURE_MAP.md. The new finishing migration/preferences have separate passing tests.

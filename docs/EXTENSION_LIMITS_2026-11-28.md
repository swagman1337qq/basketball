# Designated veteran extension limits — 2026-11-28

The extension form advertised a 35% designated veteran maximum while restricting every veteran to the ordinary 140% ceiling. A qualifying player asking for about $153M could therefore be offered only about $93.7M. AI extensions duplicated that restriction.

## Rules and behavior

`extensionRules` in `src/engine/cba.ts` supplies salary and length limits to both the player form and AI negotiations. `validateExtension` checks the offer against those limits and the existing extension window.

- A designated veteran extension can use the 35% maximum for its starting season. It must cover six total seasons: five new seasons with one season remaining, or four with two remaining. Its first-year salary must reach the 30% threshold.
- The designated option requires the offseason window and the third signing anniversary. The existing honor, service and team-eligibility calculation remains in `maxFor`; its explicit `designated` flag distinguishes this exception from an ordinary ten-year veteran's 35% maximum.
- A shorter ordinary extension retains its ordinary salary limit. That calculation uses the final guaranteed-year salary or league average, rather than treating a future raise as already earned this season. A market asking price can still exceed this limit; the player may wait for free agency.
- The form defaults to the required designated length and explains why a shorter offer or a closed designated window cannot meet the asking price. Salary entry supports $0.01M increments so the exact maximum survives input and blur.
- AI negotiations use the same legal limits and retain market asking prices when an ordinary extension cannot meet them. An eligible player whose market price is below the designated minimum can receive an ordinary offer instead.
- Existing signed agreements and statistical history are untouched. Easy Contracts retain their simplified terms. God Mode's Force extension keeps the entered dollars and length without cap-percentage metadata.

The [2023 NBA–NBPA CBA](https://imgix.cosmicjs.com/25da5eb0-15eb-11ee-b5b3-fbd321202bdf-Final-2023-NBA-Collective-Bargaining-Agreement-6-28-23.pdf), Article VII.7(a)(3), supplies the ordinary 140% rule and designated exception; Article IX.1 specifies six total seasons. Existing simplified rules elsewhere in the game's contract system were not expanded as part of this fix.

## Validation

- `scripts/extensionLimits.mts`: reproduces the screenshot ceiling; checks legal designated lengths, minimums, anniversary and offseason restrictions; checks ordinary and final-year limits, Easy Contracts, rendered text, actual negotiation acceptance, AI parity, preserved salary/history and exact God Mode terms. Registered in the main regression suite.
- A disposable Chrome test changes the years field, observes the salary ceiling and explanation update, rejects the insufficient ordinary offer, enters the exact maximum and signs through **Offer extension**. The result is five new years at $153.02M, with 35% maximum provenance and no browser errors. This uses a synthetic league, never a user's save.
- The 65-script regression suite, TypeScript and production build pass. The build retains its existing bundle-size and mixed-import warnings.
- Seeds 11 and 12 each complete three seasons under ordinary contracts, and the same three seasons under Easy Contracts: 12 league-seasons, no statistical-band failures and no structural/economy errors. These runs cover development, retirements, playoff progression, extensions, drafts and free agency.

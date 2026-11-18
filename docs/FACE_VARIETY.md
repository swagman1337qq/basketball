# Face variety and facial hair

Implemented 2026-11-18. Generation, editing and the illustrated SVG renderer share the same editable face description.

## Illustrated portraits

`faceSvg` now paints the approved illustrated direction with defined local-color contours, broad cel tones, shaped eyes/brows/noses/lips, grouped hair locks/curls and connected facial-hair shapes. The drawing style does not force a square jaw or identical eyes on everyone: head width/height, roundness, cheeks, jaw, chin and individual features still control the geometry. It is an editable procedural interpretation of the concept sheets, rather than a fixed picture assigned to a player.

The portrait uses a consistent closer framing with headroom for tall hair. Team names and jersey numbers remain complete in their own stable branding layer. Player, staff and manager portraits use the shared renderer, including aging, women, mixed appearances, dyes, glasses, face shields, piercings and undershirts. Uploaded custom headshots remain custom images.

The renderer is deterministic and never changes a face description, saved edits, the gameplay RNG or simulation values. Existing face seeds and all generation distributions are unchanged by this art update. It uses native SVG shapes without external portrait downloads, filters, gradients, clip paths or shared ids. A representative 18-face comparison uses about 25% fewer drawing elements and about 25% fewer SVG bytes than the earlier renderer; this is a structural comparison, not a browser frame-time guarantee.

`scripts/faceRendering.mts` checks 936 hairstyle/texture/expression combinations, all offered feature controls, every beard density control, accessories, repeated instances, deterministic immutable painting and SVG size budgets. The face-variety/save tests below remain separate. This drawing-only change does not alter possession, rating, contract or development logic.

## Appearance sources

`faceAncestry.ts` treats the existing five looks as overlapping drawing presets, not exhaustive ethnic categories or a genetics model. Weights are art tuning, not measured population frequencies. Nationality, birthplace, name, eligibility and basketball ability do not change when an appearance blend changes.

Sources, in priority order:

1. An explicit `p.faceX.ancestry` edit.
2. Stored generated `p.faceAncestry` weights.
3. Recognized older mixed descriptions, including existing Native American mixed records and explicit combinations such as `Black / East Asian`.
4. The existing `p.race` appearance preset.

Weights accept any number of valid sources, ignore invalid/nonfinite/negative entries, and normalize safely. Names and passports are never parsed to guess ancestry. Older unrecognized descriptions retain their existing look.

New fictional players have a 10% chance of a stored two-source appearance. Both sources and the blend strength vary. This is a conservative visual-variety setting, not a claim about the league's real ancestry distribution. The draw uses its own seeded stream and consumes none of the world's/gameplay random draws. Existing players are not assigned new random mixed backgrounds on load.

Skin, eye-shape/color probabilities, nose/lip distributions, hair texture/color and beard-growth weights combine the sources. Individual random feature draws still make people with the same blend different. Head shapes, eye spacing, noses, lips, brows and jaw/chin proportions vary independently; liking an angular drawing style does not mean every player has a sharp square jaw or identical eyes/brows.

## Beard generation

The existing age-specific style tables remain: teenage portraits do not acquire adult full-beard styles. A separate stable individual growth tendency varies within every appearance, and the East Asian share reduces the frequency of dense/connected styles and average density. Clean-shaven, sparse, patchy, moustache, goatee, stubble and full styles remain possible as age allows.

There is no ethnicity-based style prohibition. The broad East Asian look does not stand for all Asian backgrounds; other appearance sources retain their overlapping ranges. These are tunable drawing distributions, not a medical model.

The change preserves the original main portrait RNG draw count. For unedited legacy single-source faces, only facial hair changes; head/eyes/nose/mouth, scalp hair, expression, aging and accessories retain their original draws.

## Editing and persistence

Edit face retains all previous controls and adds **Blend with** plus a strength slider. Selecting a single Look explicitly replaces a blend. New Face retains the chosen blend while rerolling other custom features; Undo my changes returns to the generated appearance, and Cancel restores the original edits.

All individual feature edits apply after generation, including full beards and density overrides on any look. The shared staff face editor uses the same controls. Generated sources and edits persist through save/load and cloning; family generation inherits stored appearance sources.

## Checks

Run `node --import tsx scripts/faceVariety.mts`, also included in `npm test`.

The regression covers:

- 500 before-change legacy face fingerprints, excluding facial hair and new metadata.
- 6,000 deterministic appearance samples, eye/brow/head/hair diversity, relative beard distributions and full-beard exceptions.
- Mixed features beyond skin color, including three-source blends and legacy mixed records.
- Invalid imported weights and independent RNG use.
- 4,600 manual feature overrides, including dense-beard exceptions.
- Renderer validity, editor controls, reroll behavior, generated-world adoption, staff edits, cloning and real save/load.

Uniqueness and distribution checks do not prove every drawing looks good. Concept sheets and inspection of actual SVG portraits remain separate visual checks.

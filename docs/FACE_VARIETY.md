# Portrait variety and compatibility

Updated 2026-11-18. The visible portrait system now uses complete illustrations; individual-feature editing has been removed by request. See `docs/PORTRAIT_ARTWORK.md` for the artwork, picker and rendering path.

## Visible portraits

The original approved sixteen portraits are displayed from the supplied PNG without changing the illustration. Additional player and staff sheets follow the same style. `portraitCatalog.ts` selects one whole picture using stable seeded choices and authored appearance metadata; explicit gallery choices override that default. A portrait stays the same across birthdays and team changes. Mixed appearances are represented by complete illustrated people, rather than blending eyes/noses/skin from separate parts.

Players, staff and the manager share the same renderer. The gallery offers selection, reroll and upload. Staff uploads and selections survive save/load. The bank is finite and can repeat images; users can replace any portrait with a choice or upload. Pictures do not automatically age or receive different clothes/colors when game data changes.

## Retained legacy appearance data

The prior seeded face descriptions remain intact for saved-data compatibility and export. `faceAncestry.ts` normalizes explicit `faceX.ancestry`, stored `faceAncestry` and recognized legacy mixed descriptions; it never guesses ancestry from passports or names. Appearance presets are overlapping art categories, not biological classifications.

New fictional players retain the 10% art-tuning chance of stored mixed appearance sources using an isolated seeded stream. Existing players are not randomly assigned new ancestry on load. The legacy description still varies beard-growth weights by age, an individual seeded tendency and appearance sources, without a hard style prohibition. Those old feature fields no longer repaint the finished portrait. Choosing an image does not alter biography, playing ability, simulation randomness or the underlying appearance data.

The new explicit selection is only `faceX['portrait.id']`; all other prior fields are retained. New portrait/clear/cancel actions preserve unrelated legacy fields and uploads appropriately. Existing clone/save paths carry the selection naturally. Staff biography editing carries both `faceX` and `faceImg`.

## Checks

- `scripts/faceRendering.mts`: exact supplied PNG hash, all complete pictures and crop bounds, file dimensions, no per-feature painting/tinting, stable selections, staff/player style path, no simulation RNG, gallery controls and edit rollback.
- `scripts/faceVariety.mts`: legacy generation fingerprints/distributions, explicit metadata, portrait overrides, world generation, staff edits/uploads, cloning and real save/load.

Generation metadata diversity is separate from the number of visible pictures. Visual QA uses actual rendered crops from the complete-image code, not generated concept sheets alone.

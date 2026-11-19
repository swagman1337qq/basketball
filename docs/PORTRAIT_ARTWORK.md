# Complete illustrated portraits

Implemented 2026-11-18. Players and staff display complete, finished illustrations. No eyes, noses, mouths, hair or head shapes are combined or warped at runtime. The exact supplied reference is included unchanged as the first sixteen choices. Additional player and staff images use the same reference, warm inked outlines, shading and framing.

## Files and display

- `src/assets/complete-portraits/`: the supplied PNG, five complete-portrait sheets saved as high-quality JPEGs, and a crop/metadata manifest. There are 96 portraits: 64 players and 32 staff, including 16 women. The shared image files total about 5 MB.
- `src/engine/portraitCatalog.ts`: authored catalog metadata, stable default selection, picker helpers and the whole-image renderer. Each portrait is one image inside an SVG viewport; the crop removes only sheet gutters/neighboring pictures and preserves proportions.
- `src/engine/faces.ts`: retains the seeded legacy appearance description for data compatibility, ancestry metadata and export. `faceSvg` delegates to the complete-portrait renderer. Its former jersey/label arguments remain compatible call arguments; they no longer recolor or print over the finished artwork.
- `src/ui/modals/FaceEditor.tsx`: portrait gallery, collection/gender filters, previous/next pages, non-repeating reroll, upload, automatic portrait, Cancel and Done. Individual-feature sliders/options are removed at the user's request.
- `CoachFace.tsx`, `CoachBioEditor.tsx`, `coachEditing.ts`: staff use the same complete-image path. Staff selections and uploaded images persist; former league players retain their player portrait unless explicitly edited.
- `GMSetupModal.tsx`: the manager uses the staff collection, with the existing custom-upload override.

The source prompts and generation identifiers are in `portrait-art-prompts.json`. The supplied PNG has SHA-256 `6ca3e609bd5db7f6042b492b20b3c6d6c8790b17e534e8f6555afa46527a1e2a`. Regression tests enforce that exact file, not an imitation assembled from parts. Additional sheets were made using the built-in image generator with that source as the style reference, then format-compressed at JPEG quality 95. No illustration components were repainted or recombined during implementation.

## Selection, saved games and limits

The catalog includes authored broad appearance presets and mixed appearances. These are fictional drawing metadata, not a classifier, measured demographics or a genetics model. Default selection uses the stable face seed and appearance weights. Staff prefer the staff collection; gender selects a matching default collection. Explicit portrait choices can use any gallery image and never change race, nationality, gender, name, age, ratings or career data.

`faceX['portrait.id']` stores a chosen catalog id; `faceImg` stores an optional processed upload. Existing uploads still take precedence. Artwork is shared with the application, never embedded into every player's save record. There are no image-generation requests during play. Existing ancestry, seeds and old feature-edit fields remain saved, but individual-feature fields no longer change the finished picture. Reroll preserves ancestry. Cancel restores the original image and all prior edit data, including after an upload.

These are fixed portrait photographs/illustrations. Birthdays do not replace a person's identity or automatically grow hair, beards or wrinkles. A different age/look can be selected manually. The finite bank can repeat pictures. The portrait's clothing, colors and lighting remain part of the artwork; team-colored UI accents, actual player numbers and biography still come from the game as before. Future catalog expansions must preserve existing ids and default-selection compatibility.

## Checks

`scripts/faceRendering.mts` checks all 96 crop regions, actual PNG/JPEG dimensions, local bundled files, the exact supplied artwork hash, one unchanged image per portrait, stable identities across birthdays/team changes/old feature edits, 4,000 default-selection samples, staff/player consistency, no gameplay RNG consumption, reroll exclusion, selection/clear/Cancel behavior and removal of individual controls.

`scripts/faceVariety.mts` retains legacy appearance-data compatibility checks and verifies that portrait choices, staff uploads, cloning and real save/load persist. Legacy feature-distribution tests describe retained metadata; they are not evidence that the new pictures are constructed from those features. Actual player and staff crops are also rendered offline and compared visually with the supplied reference.

# Painted portrait components

Implemented 2026-11-18. The approved sports-illustration contact sheet supplies the art direction. Production portraits combine generated painted parts rather than assigning one of the finished mockup pictures to each player.

## Artwork and runtime

- `src/assets/portraits/`: 118 PNG component files, including head shapes, paired eyes, brows, noses, lips, ears, scalp hair and facial hair. Eye skin, iris and ink/whites are separated so skin and eye colors can change independently without tinting the whites or pupils.
- `src/engine/portraitParts.ts`: explicit bundled URLs and dimensions. Vite publishes the assets with the game; no external image service is used during play.
- `src/engine/illustratedFaces.ts`: part selection, proportion transforms, skin/hair/iris/lip tint tables, head strips, hairline/dye masks, accessories, marks, aging accents and jersey colors/labels.
- `src/engine/faces.ts`: existing seeded generation, ancestry, beard weights, aging and saved edit application. Its `faceSvg` delegates to the new assembly.
- `src/ui/modals/FaceEditor.tsx`: painted head/nose/lip shape options plus the proportion/color controls. Nose shape replaces the separate bridge/tip sliders; nose width and length still adjust independently. Hair texture variants are offered for compatible short/loose cuts, while structured braids and locs retain their selected construction.

The original generation uses individual continuous feature values. Generated shape choices map those values to painted components, then width/height/spacing and lower-face transforms retain individual proportions. Explicit `head.style`, `nose.style` and `mouth.style` edits override the automatic component choice. The existing `faceX`, seed and ancestry fields persist as before; artwork bytes are never written into saves. Cancel, undo, reroll, staff editing, cloning and custom uploaded headshots retain their existing paths.

The source artwork was generated with the built-in image tool from the supplied style reference. Atlas sprites were cropped/downsampled without repainting them. Eyelid/iris/ink separation uses alpha masks over the painted eye pixels; tinting and geometric changes occur during portrait assembly. Source prompts and generation identifiers are recorded in `portrait-art-prompts.json`.

## Visual and technical limits

These are interchangeable illustrations, not a biological or genetics model. Appearance source weights are existing art-tuning distributions. The assembled result follows the reference direction; it is not pixel-identical to the sixteen completed reference portraits. Shape changes transform painted components, so very extreme edits can exaggerate proportions. New hair/feature designs require additional artwork rather than unrestricted generative images while playing.

The entire shared library is about 6.4 MB. The browser reuses the same image files between players. Drawing size checks measure markup and asset size, not a guarantee of browser frame time. Tint and mask identifiers are based only on their complete definitions: repeated identifiers have identical resources, verified across many portraits.

## Validation

- `scripts/faceRendering.mts`: 936 hairstyle/texture/expression combinations, all existing edited fields, each painted shape option, every beard-density option, accessories, immutable/deterministic output, bundled PNG dimensions, local resource references and rendering budgets.
- `scripts/faceVariety.mts`: generation fingerprints/distributions, mixed sources, manual exceptions, player/staff edits, cloning and real save/load.
- Offline raster checks inspect the actual assembly at profile and roster sizes, including tall/wide hair and head extremes. Concept pictures are not used as evidence that the code renders correctly.

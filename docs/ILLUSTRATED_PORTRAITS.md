# Editable illustrated portraits

Expanded 2026-11-19. Open a player’s **Edit face → Portrait style → Illustrated**. The Illustrated editor now offers only the full editable catalogue. Staff use the same editor through their existing God Mode biography editor.

## Catalogue

The new painted set has **16 editable base heads, 45 hairstyles and 17 facial-hair choices**. It includes all 39 Classic hairstyle IDs and all 15 Classic facial-hair IDs, plus wolf cuts, K-pop two-blocks, small/long ponytails, balding buzz cuts, horseshoe balding, pencil mustaches and long goatees.

The Face group edits head width/length, cheekbones, jaw, chin, cleft, seven eye shapes, eye colors, eye size/spacing/tilt, six brow shapes and weight, brow slits, six expressions, nose width/length/bridge/tip, mouth width, both lips, ears and build. Other groups edit skin tone/undertone, extra freckles, moles, tattoos, hair texture/length/sideburns/hairline/recession/grey, natural colors, dyes and highlights/tips, beard density/grey, headbands, earrings/metals, piercings, glasses/frames, face shields, undershirts and five clothing choices.

Head choices are open to everyone and do not edit the person’s name, background, gender or gameplay data. Authored head recommendations overlap and include mixed looks. Automatic hair choices use validated in-game appearance and texture pools, including on initial conversion, New portrait, New Face, Shuffle features and Reset edits. Source hair cannot bypass the pool: Black/darker-skin presets exclude middle-part/K-pop defaults, and East Asian presets exclude locs/coily defaults. Explicit appearance mixtures use normalized weights from both contributing profiles; nationality does not choose the pool. Facial-hair defaults account for appearance and age, with substantial East Asian beards a rare automatic exception and no substantial teenage beards. These are authored game defaults. Manual hairstyles/beards and already-saved portraits have no race gate. Buzz cuts remain available to every group. Shuffle features preserves the selected base, skin tone and manually chosen facial hair. New portrait chooses a recommended head and fresh proportions using isolated seeded randomness.

The previous library picker and its one-head/seven-hairstyle editor have been removed. The older 56 finished paintings cannot be selected or randomly assigned through the game. Their decoder, renderer and artwork remain solely to load older saves without replacing saved faces. Editing an older illustration opens an editable replacement draft: Done accepts it, while Cancel restores the old portrait exactly. Classic remains available with all its original controls. No existing/generated population is automatically replaced.

## Saves and compatibility

Settings use the existing `faceX.illustration` field. Version 1 retains its original decoder and painter; version 2 records the base/part IDs, proportions, colors, accessories, clothing and aging flags. Pictures are shared WebP assets, never embedded into each player’s save.

There is no bulk save migration or simulation change. Unknown versions/base IDs safely use Classic; recognized settings are validated and bounded. Existing Classic feature edits remain alongside the illustrated settings. Switching styles restores them; switching back restores editable illustrated settings. Cancel restores a deep snapshot of the original seed, edits, race and uploaded image. Done uses the existing autosave system. Uploads retain priority. New Face keeps the Illustrated style and always uses the full editable catalogue, including when replacing a retired illustration. Explicit staff appearance/gender changes also use the editable catalogue.

Staff use the same renderer and `faceX` field. Their face edits remain drafts until Done followed by Save changes; God Mode is enforced again by `saveCoachBio`. Changing staff gender or appearance keeps the active illustrated style and recommends a matching head. Existing playing/coaching records retain their existing editing rules. Player archives are not edited when changing a former player’s staff portrait.

## Rendering and performance

- `fullPortraits.ts`: stable catalogue, version-2 validation and deterministic recommendations.
- `fullPortraitPainter.ts`: painted layer composition, color/skin/clothing masks and bounded proportions.
- `fullPortraitOverlays.ts`: small inked accessories and age details at transformed landmarks.
- `FullPortrait.tsx`: lazy image loading, cropped fallback, cancellation, drawing queue and bounded caches.
- `FullFaceEditor.tsx`: feature groups and head picker; shared by player and staff editors.
- `illustratedPortraits.ts` / `IllustratedPortrait.tsx`: version dispatch and unchanged version-1 painting.

Six new sheets in `assets/illustrated/full/` hold registered heads, three hair collections, beards and staff clothing. New artwork uses the approved inked/cel-painted style. Proportions adjust the existing painting with a smooth inverse map. Combined changes are limited using every corner of the interpolation cells; accessories follow that same map. Hair remains separately painted, preserving head identity when cuts change.

Only requested sheets/frames are decoded. The frame cache is capped at 24, completed drawings at 16, and one drawing job runs per animation frame. Obsolete requests never paint after a newer selection or unmount. During an edit, the last completed image stays visible to avoid source-art flicker. Different people get different component identities. Failed artwork can be retried without losing settings. Cropped SVGs and canvases fill portrait frames without letterbox bars or stretching.

Hair length only changes loose ends below the root anchor; the painted crown stays attached at every length. A bounded, weakly cached head/hair registration fits lower source crowns to the head without moving the front root anchor. Balding presets bypass cap expansion, and hairline/recession controls retain their intended forehead changes. Head and registered hair are then warped together. This is a renderer correction; stored feature values and source sheets are unchanged.

That registration also centres the painted roots on the head’s scalp, with a bounded horizontal offset. The mohawk is restricted to its centre strip so its source cap does not form an unintended band across the forehead. Beard cells have independent authored mouth/chin anchors: each is mapped to the selected head’s upper lip, width and chin before the common feature warp. Stubble and chinstraps stay within the jaw; faint fragments above the upper lip are masked over the nose. Longer beard styles retain their intentional length below the chin. The Black/darker-skin automatic hair pool uses the textured drawings themselves, avoiding straight-haired long, parted, bun and fringe drawings whose IDs were not labelled as middle parts. Manual choices remain unrestricted.

First-load previews wait for the fitted drawing, avoiding a flash of unfitted source layers; existing completed frames remain visible while edits render. The head picker shows clean base heads. Alignment corrections apply to saved version-2 portraits after updating the app; revised automatic style pools are used on the next New portrait, New Face, Shuffle features or Reset edits. Saved manual selections are not replaced automatically.

Portraits use a closer frame with less blank space above the hair. A temporary head/hair alpha mask follows the same geometry warp; it chooses a bounded top crop (0–40 source pixels), protecting tall styles and keeping framing stable across hair/skin colour edits. The crop only changes presentation, with no source-pixel or save changes. The canvas extends to the bottom of its frame without a new bar. Clean base-head thumbnails use the same closer framing.

The new set follows team jersey colors where fabric is visible. Staff have painted polos, suits and blouses. Age can add grey, recession and subtle lines; manual grey/recession overrides remain available. Skin details respect visible skin, and shirt numbers are only drawn on visible jersey fabric.

## Limits

The catalogue starts from 16 painted identities (12 men, four women). Shape, color, hair and accessory edits add variation; combination counts must not be presented as a count of unique people. Eye/brow/expression presets are bounded adjustments to the base painting. Existing freckles/shading intrinsic to a base remain; Extra freckles adds more.

Portrait selection is optional. Classic’s detailed family-resemblance generation is not replaced by the painted set. The older finished paintings retain their pictured age/clothing. Managers’ setup portraits are unchanged.

## Checks

`scripts/fullPortraits.mts` runs with `npm test`: exact original option coverage, 12,240 valid independent head/hair/beard selections, 2,000 stable randomized settings, invalid-input handling, isolated randomness, combined proportion limits, inverse landmark accuracy, complete player/staff save/load, clone isolation, exact Classic restoration, uploads, one-player incremental autosave and complete export/import.

`scripts/illustratedPortraits.mts` retains 30 exact Classic render baselines and version-1 compatibility coverage. Additional browser/art checks exercise actual painted pixels, all hairstyles/facial hair, visible feature/accessory choices, Cancel/Done, Classic/version switches, mobile layout, staff gender/appearance and God Mode, rapid/out-of-order requests, unmount/person changes, team colors, aging and asset retry. Contact sheets are visually inspected. The validation record is in `docs/ILLUSTRATED_PORTRAIT_CHECKS.json`; source prompts and registration notes are in the asset folder.

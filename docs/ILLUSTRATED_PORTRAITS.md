# Optional illustrated portraits

Added 2026-11-18. Open a player’s **Edit face**, then choose **Illustrated** under Portrait style. Staff use the same library through their existing God Mode editor. The current implementation is an optional first art library, not a replacement for the full generated population.

## Available art and controls

- One editable head with seven hairstyles (swept, textured crop, buzz, wolf cut, crew, middle part and K-pop two-block), two eye/nose/brow/facial-hair/expression choices and jaw-width, eye-spacing and mouth-width sliders.
- 24 additional complete player illustrations and 32 complete staff illustrations (16 men and 16 women). These have fixed features. The editor labels this and only offers detailed controls on the editable head.
- All pictures can be selected for any person. Hair choices have no race restriction. Choosing a picture never edits race, nationality, gender, ratings or any background record.
- Default recommendations use authored appearance tags, role, gender and broad age band. They consume their own seeded randomness, not the simulation’s random stream. There is no new genetics or mixed-background generator in this release.

## Persistence and compatibility

Settings live in existing `faceX.illustration`: version 1, enabled, base ID, hair/eyes/nose/brows/beard/smile choices and jaw/spacing/mouth proportions. Source images are shared assets, not embedded into every player’s save.

Classic remains the default for new and existing players. No migration or generation code is changed. The original `makeFace` and SVG drawing remain intact; `faceSvg` selects an illustration only for a valid enabled record. Unknown base IDs/versions use Classic safely. Existing Classic feature overrides remain alongside the illustrated settings. Switching styles restores them, and switching back restores the illustrated choice. Cancel restores a deep snapshot of the original seed, edits, race and uploaded image. Done keeps changes through the existing save system. Uploads retain priority. New Face rerolls within the currently enabled style.

Coaches use the shared renderer and their existing `faceX` field. Draft edits require Done followed by Save changes; God Mode access remains enforced by `saveCoachBio`. Former-player coaches refresh when the linked player’s face changes. Managers’ setup and generated portraits are unchanged.

## Rendering

`illustratedPortraits.ts` contains the catalog, validation, selection and bounded painter; `IllustratedPortrait.tsx` contains lazy image decoding and the shared React renderer. Four WebP sheets hold the art. Each static face has its own cropped SVG view and clip path, so neighbouring cells never leak into the portrait. SVG slice and canvas cover use the same top-centred fill, removing letterbox bars without stretching the face.

The editable source uses the successful matched-head prototype’s eleven 320px frames. Smooth masks limit patches to each feature; proportional adjustments are bounded locally. The wolf-cut mask includes its longer nape and limits beard blending to avoid erasing that hair. Canvas decoding happens only when an editable control is used. Canceled jobs never paint after a newer selection or unmount. Rendering is queued by animation frame and the pixel cache is capped at 16 configurations. Static choices require no pixel processing. Image errors show a readable placeholder; a drawing error retains the same intact base illustration.

## Current limits

This is **one fully editable identity**, not 57 independently editable heads. It does not yet supply the full Classic option catalogue in painted form. The additional portraits have diverse authored appearances, including mixed looks, but the finite library can repeat. Paintings retain their pictured age, hairstyle and clothing: birthdays and team changes do not repaint them. Classic still supports age, family resemblance, team jerseys and all its original feature controls.

Do not enable these pictures automatically for every generated player until a substantially larger, fully editable library exists and its appearance/age/clothing behavior has been reviewed. Do not describe parameter counts as unique people or infer demographics from the paintings.

## Verification

`scripts/illustratedPortraits.mts` runs with `npm test`: 30 exact pre-change Classic render baselines, all 57 catalog boundaries, invalid-setting handling, isolated deterministic defaults, save/load, cloning, retained Classic edits, uploads, rerolls, staff persistence/access control and former-player coach cache refresh.

Browser checks additionally exercise the real editor and player profile, rapid changes against exact expected pixels, Cancel/Done, style restoration, staff draft/Save, dark/light modes, phone sizing and unavailable artwork. All 224 painted presets and 1,792 proportion extremes are checked against the production painter, including opaque pixels, reset identity and feature isolation. The full game regression suite and production build run before publication.

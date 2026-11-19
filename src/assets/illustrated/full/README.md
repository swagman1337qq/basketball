# Full editable portrait artwork

Six local WebP sheets, registered to 320px square cells. Generated with the built-in image tool using the approved portrait style. Final prompts and source-image identifiers are in `provenance.json`.

| Sheet | Grid | Contents |
| --- | --- | --- |
| heads.webp | 4 × 4 | 16 bald base heads: 12 men, four women, including mixed looks |
| hair1.webp | 4 × 4 | Side part, crop, buzz, crew, fade, Caesar, waves, short afro, afro, twists, frohawk, mohawk, short/long/tied locs, cornrows |
| hair2.webp | 4 × 4 | Braids, curly top/mop, slick, quiff, fringe, middle part, messy, spiky, undercut, man bun, long, mullet, shag, high-top, flat-top |
| hair3.webp | 4 × 3 | Bob, long middle part, long curls, bun, pixie, wolf, K-pop, small ponytail, balding buzz, shaved stubble, horseshoe balding, long ponytail |
| beards.webp | 4 × 4 | The 14 visible Classic beard styles, pencil mustache, long goatee; clean-shaven is no layer |
| clothes.webp | 2 × 2 | Polo, suit/open shirt, blouse, suit/tie |

Head source cells were cropped inside their grid borders and registered at scale .84, top .16, with extended edge colors. Hair layers were registered around the same scalp, usually 202px at (59,51); buzz uses 212px at (54,43), and braids are raised slightly. Disconnected lower-cell fragments were removed. Long/fringed styles were checked against eyes/ears; front fringes are lifted locally while retaining long side hair. Beard layers use a 205 × 192 placement at (58,78). Staff clothing uses a 320 × 225 placement at (0,95), with a small shoulder lift so the original jersey does not show.

RGBA/alpha is retained. Runtime composition never changes source pixels. Shared artwork is covered by immutable-input checks and is not copied into saves. Clothing is retinted inside the garment mask, preserving painted shadows and antialiased trim.

Keep IDs stable when expanding sheets; preserve the separate version-1 catalogue. Inspect rendered combinations and rerun checks after changes, including skin-tone extremes, longer hair and staff clothing.

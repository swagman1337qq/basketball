# Painted portrait sources

These are generated fictional illustrations, prepared from the approved portrait style and the working matched-head demonstration. No new procedural facial drawing replaces the existing Classic renderer.

- `editable.webp`: 4 columns × 3 rows, eleven used 320px square frames. Original, eyes, nose, textured crop, facial hair, brows, buzz, wolf, crew, middle part, K-pop two-block. The sixth hair-generation cell sheet was registered to the canonical face (scale 1.11, x +3.5, y −10) before limiting edits to feathered masks. The last atlas cell is unused.
- `players.webp`: 6 × 4 complete fictional portraits; crop coordinates exclude white gutters.
- `staffMen.webp` and `staffWomen.webp`: 4 × 4 complete portraits each, with matching inked/cel-shaded style, taupe backgrounds and grey staff clothing.
- `catalog.json`: stable IDs, crop bounds, dimensions, role/gender/age/appearance recommendation tags. Tags were authored for the fictional drawings; they are not a model that identifies real people.

Original generation identifiers:

| Art | Source image |
| --- | --- |
| Matched feature head | exec-9082066b-8549-43b5-ae75-fe46cf19c22e.png |
| Five extra hairstyles | exec-4072d001-8ffa-4550-b77b-6f45aab90864.png |
| Diverse players | exec-8f274b77-7002-41eb-911d-e7f66aa7f620.png |
| Men staff | exec-ba3f3a81-d181-4e60-9550-fe1339a05a7a.png |
| Women staff | exec-9056050a-998e-405b-9bde-0da99ccfc3aa.png |

The editable-source prompts are retained in `provenance.json`. The additional finished staff portraits reuse generated art from the earlier whole-portrait experiment, without restoring its population replacement or feature-loss behavior. All sources are bundled locally; rendering requires no image service or network request to a third party.

See `docs/ILLUSTRATED_PORTRAITS.md` for controls, persistence and limitations.

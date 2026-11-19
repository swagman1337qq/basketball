# Restoring Classic portraits

Classic is retained in the GitHub codebase, with no in-game style selector. To restore it, change `style: 'illustrated'` to `style: 'classic'` in `src/engine/portraitMode.ts`, then test, rebuild and deploy normally.

The switch restores `classicFaceSvg` in `src/engine/faces.ts` and the complete individual-feature editor in `src/ui/modals/ClassicFaceEditor.tsx`. The original generator, feature lists and saved Classic fields remain intact. Thirty exact render hashes and a source-switch editor check guard this fallback.

Illustrated defaults do not bulk-rewrite players or staff. Editing an illustration preserves the underlying Classic feature fields alongside it. A source rollback therefore uses the person's retained seed and Classic edits. New Face deliberately changes that person's seed, as before. Uploaded headshots keep priority in both modes.

Changing the source switch back to Illustrated restores saved version-2 settings, or deterministic editable defaults when none are stored. The retired version-1 decoder/artwork remains in source, though the live selector is removed.

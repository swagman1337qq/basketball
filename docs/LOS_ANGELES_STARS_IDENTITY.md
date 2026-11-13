# Los Angeles Stars identity — 2026-11-12

The Stars use the exact vintage illustration approved by the user: a full-body golden star dribbling in a lavender uniform and high-top shoes, with cream Los Angeles and Stars lettering. The original transparent PNG is preserved at `src/assets/los-angeles-stars-vintage.png`; every size displays this artwork without cropping or replacing it with the earlier geometric concept. Its colors stay as approved.

`src/ui/StarsLogo.tsx` displays the approved artwork inside the shared SVG surface. `teamMarks.tsx` registers it as the LA default, and `teamCrests.tsx` exposes it through the normal crest registry. Vite publishes the image with a content-based asset URL. The previous pram artwork is removed.

## All logo placements

`src/ui/TeamLogo.tsx` is the central renderer. LA is explicitly routed to the new artwork before a stored logo image or style can take precedence. This also handles old snapshot names in the save library without rewriting a save merely to preview it. Other teams retain their existing behavior.

The placement audit found these paths:

- Start screen: save rows, selected-save preview, selected new-league team and team picker (`TitleScreen.tsx`, `TitleNewLeague.tsx`).
- Application navigation and team search: `viewModel.ts`'s `logo(tid, size)` helper, `AlmanacSidebar`, `BroadsheetMasthead`, `DeskRail` and `search.ts`.
- Team and player contexts: roster, depth/team overviews, player profiles, transaction history, ownership and team-management pages; their logos come from the same helper or `TeamLogo`.
- Trade and free-agent contexts: partner headings, offers, incoming assets and last-team marks.
- Draft: pick order, completed picks, lottery, mock drafts and prospect/team contexts.
- Competition: dashboard, daily schedule, schedule, standings, league statistics, leaders, playoffs, play-in, predictions and awards.
- History: team history, Hall of Fame, career history and championship banners (`ChampBanner.tsx` directly uses `TeamLogo`).
- League editing and expansion: previews also use `TeamLogo`, so saved custom-image/style settings do not revive the previous LA mark.

The override is based on the LA franchise abbreviation, so history and old previews do not depend on having today's nickname in their snapshot. The selected illustration retains its approved colors.

## Verification

- Rendered the logo at 16, 20, 28, 40, 64, 128 and 256 pixels.
- Checked default LA, legacy Strollers names, uploaded-image overrides and template-style overrides.
- Checked that all 29 other main-league franchise identities still use their own artwork.
- Inspected the primary full-size logo and checked transparent margins for clipping.
- Type check and production build.

# Front Office

A single-player basketball GM and head-coach sim that runs entirely in your browser. Pick any of the 30 clubs, then set the rotation and tactics, trade, sign free agents and overseas players, scout and draft, develop young players, and keep the owner happy, season after season.

The UI is built from the Claude Design handoff ("Basketball GM redesign", Classical design system). `docs/HANDOFF.md` is the product spec and lists every rule the engine follows.

## Stack (all free)

| Piece | Choice | Why |
|---|---|---|
| Framework | **React 19 + TypeScript**, built with **Vite** | Same model as the prototype (components + a view model), fast dev server, static output. |
| Database | **IndexedDB** in the browser, via **Dexie** | There's no server and no account. Leagues save automatically and work offline. Use Export/Import to back up or move a league. |
| Hosting | **GitHub Pages** (workflow included) | Free static hosting. Netlify, Cloudflare Pages or Vercel also work: upload `dist/`. |
| Fonts & flags | Bundled locally (`@fontsource`, `flag-icons`, MIT/OFL) | No third-party requests at runtime. |

A server database (such as Supabase or Firebase) only becomes useful if you later want accounts, cloud saves across devices, or multiplayer. The save format (`Game.toSave()`) is plain JSON, so you can move to one later.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Deploy to GitHub Pages

1. Push to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. `.github/workflows/deploy.yml` builds and publishes the site. It will be at `https://<user>.github.io/<repo>/`.

## Code map

```
src/
  data/world.ts          countries, name pools, clubs, scouting regions, roster roles, teams
  engine/Game.ts         world generation + season engine + observable store (setState/subscribe)
  engine/sim.ts          possession-by-possession game engine (used by quick sims and the Live Game)
  engine/faces.ts        deterministic SVG faces
  engine/rng.ts          seeded mulberry32 RNG (the world seed is saved with the league)
  db/saves.ts            IndexedDB save slots, export/import
  ui/viewModel.ts        turns game state into the values each screen renders
  ui/GMView.tsx          app chrome: the three shells (Almanac / Broadsheet / Desk), phase bar, modals
  ui/screens/*.tsx       one file per screen (Dashboard, Roster, Trade, Draft, …)
  ui/modals/*.tsx        player, team, list and confirm dialogs
  ui/live/               Live Game viewer: scoreboard, box score, play-by-play
  ui/TeamLogo.tsx        team crests (club colors + a Lucide glyph)
  ui/TitleScreen.tsx     league list, new league, team picker, import
  styles/classical.css   Classical design tokens (unchanged from the design system)
```

Game rules live in `engine/Game.ts` (season cycle, trades AI, contracts, injuries, development) and `engine/sim.ts` (the game engine). Every game in the league, whether watched, quick-simmed, AI vs AI, play-in or playoffs, is simulated possession by possession; box scores are summed into per-season stat rows, and the averages shown everywhere are totals ÷ games played. Screens only render values from the view model and call its handlers.

The team you pick is stored in slot 0 (`tid 0`), which is how the engine identifies the user's club.

## Next steps from the handoff (§7)

- Awards (MVP, ROY, DPOY, 6MOY, MIP, All-League).
- Enforce the owner's firing conditions and add a job market.
- Control more than one team: generalize the `tid 0` assumptions.
- Watch playoff games live (they are simulated in full, but only regular-season games can be watched).
- Contract incentives.

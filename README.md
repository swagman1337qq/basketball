# Front Office

A single-player basketball GM and head-coach sim that runs entirely in your browser. Run one club or any number of the 30 (15 per conference): set the rotation and tactics, trade, sign free agents and overseas players, scout the world and draft, develop young players, and keep your owner happy, season after season, through a play-in, an East/West playoff bracket, awards, and a job market that can fire or hire you.

`docs/SPEC_STATUS.md` walks through the full feature spec point by point and says where each piece lives.

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
  data/world.ts          countries, name pools, clubs, scouting regions (tiers 1–4), roles, teams,
                         owner archetypes, team colors/crests, procedural expansion teams
  engine/Game.ts         world generation, season cycle, multi-team control, trades AI, contracts,
                         injuries, development, draft, free agency, playoffs; observable store
  engine/sim.ts          possession engine anchored to the 2026 baselines (bell curve, usage
                         gatekeeper, four shot tiers, Four Factors clutch tiebreaker)
  engine/norms.ts        league-wide rating norms that keep the averages on the baselines
  engine/awards.ts       MVP, DPOY, ROY, 6MOY, MIP, Coach of the Year, All-League/Defense/Rookie
  engine/frontOffice.ts  finances, owner reviews and firing, job market, press, incentives,
                         stat-padding dilemmas, payroll mandates and fire sales
  engine/overseas.ts     league-strength translation, buyouts, confidence, scouting intel
  engine/faces.ts        deterministic SVG faces
  engine/rng.ts          seeded mulberry32 RNG (the world seed is saved with the league)
  db/saves.ts            IndexedDB save slots, export/import
  ui/viewModel.ts        turns game state into the values each screen renders
  ui/GMView.tsx          app chrome: the three shells (Almanac / Broadsheet / Desk), phase bar, modals
  ui/screens/*.tsx       one file per screen (Dashboard, Roster, Tactics, Career, League editor, …)
  ui/modals/*.tsx        player profile (with Development/Comparison tabs and the God Mode editor),
                         team, list and confirm dialogs
  ui/live/               Live Game viewer: scoreboard, box score, play-by-play
  ui/TeamLogo.tsx        team crests (club colors + a Lucide glyph, or an uploaded logo)
  ui/upload.ts           crop/resize for uploaded logos and headshots
  ui/TitleScreen.tsx     league list, new league, managed-team picker, import
  styles/classical.css   Classical design tokens (unchanged from the design system)
```

Every game in the league, whether watched, quick-simmed, AI vs AI, play-in or playoffs, is simulated possession by possession; box scores are summed into per-season stat rows, and the averages shown everywhere are totals ÷ games played. Screens only render values from the view model (or read the engine directly in the hand-written screens) and call its handlers.

`state.managed` lists the franchises you run and `state.me` is the one on screen; each club's tactics, budget, scouts, training and inbox live in `state.clubs` while it's off screen.

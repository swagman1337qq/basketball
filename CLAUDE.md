# Basketball Manager

A browser basketball GM game (React + TypeScript + Vite). Live at https://swagman1337qq.github.io/basketball/.

- Develop on the branch `claude/basketball-gm-website-2h8gs7`; commit and push after each change. Every push publishes the site automatically (GitHub Actions, `.github/workflows/deploy.yml`, runs `npm run deploy`); run `npm run deploy` by hand only if the workflow can't.
- **Keep CHANGELOG.md up to date.** Every user-facing change gets a line under the current date (Added / Changed / Fixed), newest first, in plain words a player understands. The game shows this file under "What's new", so update it in the same commit as the change.
- Owners, GMs and media are fictional: always use made-up names.
- Typecheck with `npx tsc --noEmit -p .` (strict mode; implicit `any` is still allowed).
- Format with `npm run format` before committing (Prettier, `.prettierrc.json`; `src/data/` tables and the logo art are left compact, `.prettierignore`). The 2026-11-08 reformat commit is in `.git-blame-ignore-revs`.
- Before every push: `npm test` (unit tests and every regression script, about 10 seconds). After engine or contract changes also `npm run test:league` (realism + contract outcomes over 3 seasons); after engine changes `npm run test:ratings` (each rating's value in games; ~8 minutes; after a deliberate engine change re-record its baseline with `npx tsx scripts/measureOvr.mts baseline`).
- **`docs/FEATURE_MAP.md` is the map of every feature and where it lives.** Read it before building on a feature; update it (and its "Known issues to address" checklist) when features are added, moved or fixed.

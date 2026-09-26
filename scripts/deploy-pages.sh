#!/usr/bin/env bash
# Build the site and publish it to the gh-pages branch (GitHub Pages serves that branch at
# https://swagman1337qq.github.io/basketball/). Run from the repo root: npm run deploy
set -euo pipefail
npm run build
touch dist/.nojekyll
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git fetch origin gh-pages >/dev/null 2>&1 || true
if git show-ref --quiet refs/remotes/origin/gh-pages; then git worktree add -f "$TMP" origin/gh-pages --detach >/dev/null; else git worktree add -f "$TMP" --detach >/dev/null; (cd "$TMP" && git checkout -q --orphan gh-pages); fi
(cd "$TMP" && git rm -rqf . >/dev/null 2>&1 || true; cp -r "$OLDPWD/dist/." . && git add -A && git commit -q -m "Deploy site ($SRC)" && git push -q origin HEAD:gh-pages)
git worktree remove --force "$TMP"
echo "Deployed $SRC → https://swagman1337qq.github.io/basketball/"

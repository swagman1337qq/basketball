#!/usr/bin/env bash
# Build the site and publish it to the gh-pages branch (GitHub Pages serves that branch at
# https://swagman1337qq.github.io/basketball/). GitHub Actions runs this on every push to the
# development branch (.github/workflows/deploy.yml); run it by hand from the repo root with
# npm run deploy. DRY_RUN=1 builds and commits in a scratch worktree but doesn't push.
set -euo pipefail
npm run build
touch dist/.nojekyll
SRC=$(git rev-parse --short HEAD)
ROOT=$(pwd)
TMP=$(mktemp -d)
cleanup() { git -C "$ROOT" worktree remove --force "$TMP" >/dev/null 2>&1 || true; git -C "$ROOT" worktree prune; }
trap cleanup EXIT # the scratch worktree goes away even if a step fails
git fetch origin gh-pages >/dev/null 2>&1 || true
if git show-ref --quiet refs/remotes/origin/gh-pages; then
  git worktree add -f "$TMP" origin/gh-pages --detach >/dev/null
else
  git worktree add -f "$TMP" --detach >/dev/null
  git -C "$TMP" checkout -q --orphan gh-pages
fi
git -C "$TMP" rm -rqf . >/dev/null 2>&1 || true
cp -r "$ROOT/dist/." "$TMP/"
git -C "$TMP" add -A
if git -C "$TMP" diff --cached --quiet; then
  echo "The site is already up to date ($SRC): nothing to publish."
  exit 0
fi
git -C "$TMP" commit -q -m "Deploy site ($SRC)"
if [ "${DRY_RUN:-}" = 1 ]; then echo "DRY_RUN: built and committed $SRC in a scratch worktree; not pushed."; exit 0; fi
git -C "$TMP" push -q origin HEAD:gh-pages
echo "Deployed $SRC → https://swagman1337qq.github.io/basketball/"

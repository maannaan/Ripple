#!/usr/bin/env bash
# Create public GitHub repo and push branches (requires gh auth).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${GITHUB_REPO_NAME:-ripple-change-impact}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in to GitHub. Run:"
  echo "  gh auth login"
  echo "Or: export GH_TOKEN=<personal-access-token>"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already exists:"
  git remote get-url origin
  echo "Pushing branches..."
  git push -u origin main
  git push -u origin phase-6-submission
  exit 0
fi

echo "Creating public repo ${REPO_NAME}..."
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

echo ""
echo "Pushing phase-6-submission branch..."
git push -u origin phase-6-submission

echo ""
echo "Open PR for Qodo review:"
echo "  gh pr create --base main --head phase-6-submission --title 'Phase 6: demo polish and submission' --body-file docs/pr-phase6-body.md"
echo ""
USER="$(gh api user -q .login)"
echo "Repo URL: https://github.com/${USER}/${REPO_NAME}"

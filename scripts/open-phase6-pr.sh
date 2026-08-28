#!/usr/bin/env bash
# Open Phase 6 PR for Qodo review (requires gh auth + pushed branches).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

gh pr create \
  --base main \
  --head phase-6-submission \
  --title "Phase 6: demo polish and hackathon submission" \
  --body-file docs/pr-phase6-body.md

echo ""
echo "Next: install Qodo GitHub App, wait for review (or comment /agentic_review)"
echo "See docs/SUBMISSION.md"

#!/usr/bin/env bash
# Print manual submission checklist (Phase 6).
set -euo pipefail

cat <<'EOF'
=== Ripple manual submission checklist ===

1. GitHub (required)
   gh auth login
   npm run publish:github
   npm run pr:phase6

2. Qodo (required for judging)
   - Install Qodo GitHub App on the repo
   - Wait for PR review or comment /agentic_review on the Phase 6 PR
   - Fix High findings; dismiss others with reason
   - Merge PR after follow-up review
   - Update README Qodo section with merged PR URL

3. Skill (after public push)
   export RIPPLE_SKILL_GIT_URL=https://github.com/<you>/ripple-change-impact
   npm run skill:register
   npm run agent:update

4. Demo video (~3 min)
   npm run demo:prep
   Follow docs/DEMO.md
   Upload video per hackathon portal

5. Submit
   https://www.wemakedevs.org/hackathons/trueforge
   - Public repo URL
   - Demo video link

EOF

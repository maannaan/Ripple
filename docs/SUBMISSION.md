# Hackathon submission steps

Manual tasks after Phase 6 implementation.

## 1. Publish to GitHub

```bash
gh auth login
npm run publish:github    # creates public repo + pushes main and phase-6-submission
npm run pr:phase6       # open PR for Qodo review
```

## 2. Qodo setup

1. Install [Qodo GitHub App](https://www.qodo.ai/) on the public Ripple repo
2. Open PR from `phase-6-submission` → `main`
3. Wait for Qodo review (or comment `/agentic_review`)
4. Fix High-severity findings; dismiss others with reason in thread
5. Merge PR after Qodo follow-up review

## 2. Update README

Replace placeholders in **Qodo Code Review Evidence** with:

- Merged PR URL
- 1–2 sentences on findings and fixes

## 3. Demo video (~3 min)

Follow [DEMO.md](DEMO.md). Record screen + optional voiceover.

## 4. Submit

1. [Agent Harness Hackathon](https://www.wemakedevs.org/hackathons/trueforge)
2. Public repo URL
3. Demo video link
4. Optional: DEV.to blog post

## 5. Skill registration (local)

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<you>/Ripple
npm run skill:register
npm run agent:update
```

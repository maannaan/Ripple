# Hackathon submission steps

## 1. Pre-demo checks

```bash
npm run demo:prep
npm run rehearsal:verify
npm run ci
```

## 2. TrueForge + skill

```bash
npm run trueforge              # terminal 1
npm run mcp:dev                # terminal 2
npm run mcp:register
export RIPPLE_SKILL_GIT_URL=https://github.com/maannaan/Ripple
npm run skill:register
npm run agent:update
```

## 3. Qodo review

1. Install [Qodo GitHub App](https://www.qodo.ai/) on `maannaan/Ripple`
2. Merge PR with submission docs (Qodo review on PR)
3. Fix High findings; dismiss others with reason
4. Update README **Qodo Code Review Evidence** with findings

## 4. Demo video

Follow [VIDEO.md](VIDEO.md) and [DEMO.md](DEMO.md). Run manual chat **twice** before recording.

## 5. Portal submit

See [PORTAL_SUBMIT.md](PORTAL_SUBMIT.md) — https://www.wemakedevs.org/hackathons/trueforge

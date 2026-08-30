# Final handoff — your 3 remaining steps

Everything automatable from the Hackathon Win Plan is done. **You** must complete these before Aug 30.

## Done for you

- [x] `main` synced with GitHub
- [x] `npm run demo:prep`, `ci`, `verify:phase6` — all passed
- [x] Skill registered: `https://github.com/maannaan/Ripple`
- [x] Agent updated with `ripple-simulation` skill + sandbox
- [x] `npm run rehearsal:verify` passed twice (automated)
- [x] PR [#2](https://github.com/maannaan/Ripple/pull/2) open — CI green, `/agentic_review` posted

TrueForge is running at http://localhost:8790. MCP at http://localhost:3100.

---

## Step 1 — Qodo + merge PR #2 (~30 min)

1. Install [Qodo GitHub App](https://www.qodo.ai/) on `maannaan/Ripple`
2. Open https://github.com/maannaan/Ripple/pull/2 — wait for Qodo review (or comment `/agentic_review` again)
3. Fix **High** findings; dismiss others with reason
4. **Merge PR #2**
5. On `main`, edit README **Qodo Code Review Evidence** with 1–2 sentences on findings

```bash
git checkout main && git pull
# edit README, commit, push (or small PR)
```

---

## Step 2 — Manual chat rehearsal + video (~45 min)

Run the chat flow **twice** in TrueForge (Agents → ripple):

1. `What is the impact of changing SKU ACME-1847 to ACME-2847?`
2. Confirm revenue **21850**
3. `Approve safe updates` → **Allow** on `apply_product_update`

If DB is dirty: `npm run demo:prep` first.

Record using [docs/VIDEO.md](VIDEO.md). Upload to YouTube/Loom.

---

## Step 3 — Portal submit (~10 min)

1. Add video URL to README checklist
2. Submit at https://www.wemakedevs.org/hackathons/trueforge
3. Repo: `https://github.com/maannaan/Ripple`

See [docs/PORTAL_SUBMIT.md](PORTAL_SUBMIT.md).

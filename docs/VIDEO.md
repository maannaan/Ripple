# Demo video checklist (~3 minutes)

**Target track:** Best Use of TrueForge

## Before recording

```bash
npm run demo:prep
npm run trueforge          # terminal 1
npm run mcp:dev            # terminal 2
npm run mcp:register       # once
export RIPPLE_SKILL_GIT_URL=https://github.com/maannaan/Ripple
npm run skill:register
npm run agent:update
npm run rehearsal:verify   # after MCP + TrueForge are running
```

Run the **manual chat flow twice** successfully before recording.

## Shot list (show on screen)

| Time | Must show |
|------|-----------|
| 0:00–0:30 | Problem + "TrueForge harness, not just a chatbot" |
| 0:30–1:30 | Tool calls: `get_product`, `find_*` in TrueForge UI |
| 1:30–2:00 | Sandbox / `simulate_change.py` execution |
| 2:00–2:30 | Impact report — revenue **21850**, POs **101/102** |
| 2:30–2:50 | Approval prompt → **Allow** on `apply_product_update` |
| 2:50–3:00 | Success + `audit_id` or SQL proof (SKU **ACME-2847**) |

## Prompts

1. `What is the impact of changing SKU ACME-1847 to ACME-2847?`
2. `Approve safe updates`

## After upload

Add video URL to [README.md](../README.md) hackathon checklist and submit on [WeMakeDevs portal](https://www.wemakedevs.org/hackathons/trueforge).

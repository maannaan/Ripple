# Ripple — Product launch video (YC style)

**Format:** 90–120 second animated explainer  
**Style:** YC demo day / modern SaaS launch (Linear, Vercel, Retool energy)  
**Tools:** Remotion, Claude, After Effects, or Runway + voiceover  

**Companion:** Live demo script → [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md)

---

## Video at a glance

| Section | Time | Purpose |
|---------|------|---------|
| Hook | 0:00–0:05 | Stop the scroll |
| Problem | 0:05–0:25 | Pain they feel |
| Insight | 0:25–0:35 | Why chatbots fail |
| Solution | 0:35–0:50 | Meet Ripple |
| How it works | 0:50–1:15 | 4-step loop (animated) |
| Features | 1:15–1:35 | Harness capabilities |
| Proof | 1:35–1:50 | Numbers + approval |
| CTA | 1:50–2:00 | GitHub + try it |

**Total:** ~2 minutes (trim to 90s by shortening Problem + Features)

---

## Brand & motion direction (give this to your designer / Remotion)

### Visual identity
- **Background:** Dark navy `#0B0F19` → subtle gradient to `#111827`
- **Primary accent:** Electric teal `#2DD4BF` (ripple / water metaphor)
- **Secondary:** Warm amber `#FBBF24` (risk / warning)
- **Success:** Soft green `#34D399` (approval / safe)
- **Text:** White `#F9FAFB`, muted `#9CA3AF` for labels
- **Font:** Inter or Geist (bold headlines, regular body)

### Motion principles
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — snappy YC feel
- **Stagger:** 3–5 frames between list items
- **No clutter:** One idea per scene; big type, minimal copy
- **Metaphor:** SKU change = stone dropped in water → **ripples** spread to POs, shipments, orders
- **UI mockups:** Simplified TrueForge-style cards (not pixel-perfect — clean wireframes)

### Sound (optional)
- Subtle whoosh on scene transitions
- Soft click on “Allow” approval
- Low ambient pad under voiceover (no cheesy corporate music)

---

## Full voiceover script (read for recording or TTS)

> **[HOOK — 0:00]**  
> One SKU change. Four systems. Zero visibility — until something breaks.
>
> **[PROBLEM — 0:05]**  
> Supply chain teams rename product codes all the time. A supplier update. A rebrand. A typo fix.  
> But a SKU isn’t just a label. It’s wired into purchase orders, in-transit shipments, open customer orders, and regional pricing.  
> Change it blind, and you flag the wrong shipments, miss revenue at risk, or corrupt live orders.
>
> **[INSIGHT — 0:25]**  
> A generic chatbot can *talk* about impact. It can’t prove it.  
> You need real data, deterministic math, and a human gate before anything touches production.
>
> **[SOLUTION — 0:35]**  
> **Meet Ripple.**  
> A change-impact agent built on **TrueForge** — the agent harness hackathon stack.  
> Ripple reads your operational database, simulates the blast radius in a sandbox, and only writes after you approve.
>
> **[HOW IT WORKS — 0:50]**  
> Four steps. Every time.  
> **Fetch** — MCP tools pull live product, order, shipment, and pricing data from Postgres.  
> **Simulate** — a deterministic script calculates revenue exposure and safe auto-updates. No guessing.  
> **Report** — you get a clear impact summary: what’s affected, what’s manual, what’s safe.  
> **Approve** — destructive writes are blocked until you click Allow.
>
> **[FEATURES — 1:15]**  
> Ripple isn’t a slide deck. It’s a harness-native workflow.  
> **MCP integration** for trustworthy reads.  
> **Sandbox simulation** so numbers are code, not hallucinations.  
> **Approval gates** on every dangerous tool.  
> **Audit logs** for every applied change.  
> **Subagent orchestration** to keep heavy work isolated — fetch, simulate, then decide.
>
> **[PROOF — 1:35]**  
> Demo scenario: change ACME-1847 to ACME-2847.  
> Revenue at risk: **twenty-one thousand eight hundred fifty dollars**.  
> Two purchase orders. Two customer orders flagged for manual review.  
> One in-transit shipment queued for remapping.  
> You approve. SKU updates. Shipment flags. Orders stay safe.
>
> **[CTA — 1:50]**  
> **Ripple.** Simulate first. Approve second. Ship with confidence.  
> Open source on GitHub. Clone it, run the demo in three minutes.  
> **github.com/maannaan/Ripple**

---

## Scene-by-scene storyboard (animation + on-screen text)

### Scene 1 — Hook (0:00–0:05)
| | |
|--|--|
| **Visual** | Black screen. Single SKU tag `ACME-1847` center. It **morphs** to `ACME-2847` with a ripple animation radiating outward. |
| **On-screen text** | `One change. Every system.` |
| **Animation** | Ripple rings expand; at ring edge, icons pop in: 📦 PO, 🚚 Shipment, 🛒 Order, 💲 Price (use simple line icons, not emoji in final render) |
| **VO** | “One SKU change. Four systems. Zero visibility — until something breaks.” |

---

### Scene 2 — Problem: the mess (0:05–0:15)
| | |
|--|--|
| **Visual** | Isometric or flat **supply chain graph**: Product node center, edges to PO / Shipment / Order / Pricing nodes. All green. |
| **Animation** | SKU label changes → edges turn **amber/red**, nodes shake slightly, “?” badges appear |
| **On-screen text** | `Rename a SKU` → `Break POs • Miss shipments • Risk revenue` |
| **VO** | “Supply chain teams rename product codes all the time…” |

---

### Scene 3 — Problem: stakes (0:15–0:25)
| | |
|--|--|
| **Visual** | Split screen: left = spreadsheet chaos (blurred rows), right = alert stack (“Order 9001 mismatch”, “Shipment 5002 unmapped”) |
| **Animation** | Alerts slide in with stagger; revenue counter ticks up in red: `+$ at risk` |
| **On-screen text** | `Live orders. Real money. No dry run.` |
| **VO** | “…Change it blind, and you flag the wrong shipments, miss revenue at risk…” |

---

### Scene 4 — Insight (0:25–0:35)
| | |
|--|--|
| **Visual** | Generic chat bubble with fake confident text: “Impact is probably low :)” — then **red stamp: UNVERIFIED** |
| **Animation** | Chat bubble glitches; crossfade to checklist: ✓ Real data ✓ Deterministic math ✓ Human approval |
| **On-screen text** | `Chat ≠ proof` |
| **VO** | “A generic chatbot can talk about impact. It can’t prove it.” |

---

### Scene 5 — Logo reveal: Meet Ripple (0:35–0:45)
| | |
|--|--|
| **Visual** | Logo wordmark **Ripple** with teal ripple underline. Subtitle: `Change-impact agent on TrueForge` |
| **Animation** | Logo scale 0.9→1.0 + fade; particles settle |
| **On-screen text** | `Meet Ripple` |
| **VO** | “Meet Ripple. A change-impact agent built on TrueForge.” |

---

### Scene 6 — Architecture diagram (0:45–0:55)
| | |
|--|--|
| **Visual** | Clean architecture: `TrueForge` → `MCP` → `Postgres` + `Sandbox` → `Impact Report` → `Approval` → `Apply` |
| **Animation** | Data pulse travels left-to-right; approval step **pauses** with lock icon until user clicks Allow |
| **On-screen text** | `Fetch → Simulate → Report → Approve` |
| **VO** | “Reads your database, simulates in a sandbox, writes only after you approve.” |

---

### Scene 7 — How it works: Fetch (0:55–1:03)
| | |
|--|--|
| **Visual** | UI card mock: tool calls `get_product`, `find_purchase_orders`, `find_shipments`… |
| **Animation** | Each tool call slides in; JSON snippet fills (simplified, pretty-printed) |
| **On-screen text** | `① Fetch — MCP reads Postgres` |
| **VO** | “Fetch — MCP tools pull live data.” |

---

### Scene 8 — How it works: Simulate (1:03–1:10)
| | |
|--|--|
| **Visual** | Sandbox terminal: `python simulate_change.py --input input.json` → output JSON highlights `revenue_exposure: 21850` |
| **Animation** | Terminal typewriter effect; number **counts up** to 21850 |
| **On-screen text** | `② Simulate — code, not guesses` |
| **VO** | “Simulate — deterministic script. No guessing.” |

---

### Scene 9 — How it works: Report + Approve (1:10–1:18)
| | |
|--|--|
| **Visual** | Impact Report card + TrueForge **Allow / Deny** modal on `apply_product_update` |
| **Animation** | Cursor clicks **Allow** → green checkmark; DB row SKU flips ACME-1847 → ACME-2847 |
| **On-screen text** | `③ Report  ④ Approve` |
| **VO** | “Report the blast radius. Approve before anything mutates.” |

---

### Scene 10 — Feature grid (1:18–1:30)
| | |
|--|--|
| **Visual** | 2×3 bento grid, icons + labels |
| **Cards** | MCP Reads • Sandbox Math • Approval Gate • Audit Log • Subagents • Postgres Seed Demo |
| **Animation** | Cards flip in with stagger (60ms apart) |
| **On-screen text** | `Harness-native` |
| **VO** | “MCP integration. Sandbox simulation. Approval gates. Audit logs. Subagent orchestration.” |

---

### Scene 11 — Proof / numbers (1:30–1:45)
| | |
|--|--|
| **Visual** | Big stat hero: **$21,850** revenue at risk; smaller chips: PO 101 • PO 102 • Orders 9001/9002 • Shipment 5002 |
| **Animation** | Stats count up; shipment 5002 gets `needs_remapping` badge |
| **On-screen text** | `Scenario A — demo ready` |
| **VO** | “Twenty-one thousand eight hundred fifty dollars at risk. Two POs. Manual orders flagged. One shipment remapped — after you approve.” |

---

### Scene 12 — CTA (1:45–2:00)
| | |
|--|--|
| **Visual** | GitHub repo card + QR optional; command line: `npm run demo:prep` |
| **Animation** | Logo + URL fade in; subtle loop ripple on background |
| **On-screen text** | `github.com/maannaan/Ripple` · `npm run demo:prep` |
| **VO** | “Ripple. Simulate first. Approve second. Open source — try it today.” |

---

## On-screen copy cheat sheet (minimal text per scene)

```
1. One change. Every system.
2. Rename a SKU → Break POs • Miss shipments • Risk revenue
3. Live orders. Real money. No dry run.
4. Chat ≠ proof
5. Meet Ripple — Change-impact agent on TrueForge
6. Fetch → Simulate → Report → Approve
7. ① Fetch — MCP reads Postgres
8. ② Simulate — code, not guesses
9. ③ Report  ④ Approve
10. Harness-native: MCP • Sandbox • Approval • Audit • Subagents
11. $21,850 at risk | PO 101/102 | Orders 9001/9002 | Shipment 5002
12. github.com/maannaan/Ripple
```

---

# MASTER PROMPT — paste into Claude (Remotion / product video)

Copy everything inside the block below into Claude. Ask it to generate a **Remotion** project (React + TypeScript) or storyboard frames.

```markdown
You are a senior motion designer and Remotion engineer. Build a 2-minute YC-style product launch video for **Ripple**.

## Product context

**Ripple** is a change-impact analysis agent for supply chain / operations teams. Built for the TrueForge Agent Harness Hackathon.

**Problem:** Changing a product SKU (stock keeping unit) affects purchase orders, in-transit shipments, customer orders, and regional pricing. Teams often change SKUs without knowing the blast radius — risking revenue loss and broken orders.

**Solution:** Ripple on TrueForge:
1. **Fetch** — MCP tools read live Postgres (get_product, find_purchase_orders, find_shipments, find_customer_orders, find_pricing_rules)
2. **Simulate** — sandbox runs `simulate_change.py` (deterministic JSON in/out, no LLM math)
3. **Report** — Impact Report with revenue exposure, affected IDs, manual vs safe updates
4. **Approve** — `apply_product_update` blocked until human clicks Allow in TrueForge (approval gate)
5. **Apply** — SKU update + flag in-transit shipments + audit_log entry

**Demo golden numbers (Scenario A):**
- SKU change: ACME-1847 → ACME-2847
- Revenue at risk: $21,850
- POs: 101, 102
- Customer orders (manual): 9001, 9002
- In-transit shipment to flag: 5002

**Tech stack to show:** TrueForge, MCP, Docker Postgres, Python sandbox, Fireworks LLM (optional mention)

**Repo:** https://github.com/maannaan/Ripple

## Video requirements

- **Duration:** 120 seconds (provide 90s cut variant)
- **Style:** YC demo day / Linear / Vercel — dark UI, teal accent (#2DD4BF), bold typography (Inter), minimal copy, snappy motion
- **Structure:** Problem first → why chatbots fail → Meet Ripple → how it works (4 steps animated) → feature bento → proof numbers → CTA
- **Audience:** Hackathon judges + supply chain engineers who have never seen Ripple
- **Tone:** Confident, clear, no jargon without explanation. Simple English.

## Deliverables

1. **Remotion project structure:**
   - `src/Root.tsx` with Composition 1920×1080, 30fps, durationInFrames=3600
   - One component per scene (Scene01Hook … Scene12CTA)
   - Shared `theme.ts` (colors, fonts, spring configs)
   - Use `@remotion/transitions` or spring() for scene transitions

2. **Per scene provide:**
   - Duration in seconds
   - Voiceover line (from script below)
   - On-screen headline (max 8 words)
   - Animation description (what moves, easing, stagger)
   - Any SVG/icon needs

3. **Animations to include:**
   - Ripple effect from SKU change propagating to connected nodes (PO, shipment, order, price)
   - Data flow pulse along architecture diagram
   - Terminal typewriter for simulate_change.py
   - Count-up animation for $21,850
   - Allow/Deny modal with click → success state
   - Bento grid stagger for features

4. **Voiceover script** — use exactly:

[Insert full voiceover from "Full voiceover script" section above]

5. **Do NOT:**
   - Use stock photo people
   - Use more than 12 words on screen at once (except stat scene)
   - Claim Ripple is production SaaS — it's a hackathon OSS demo on TrueForge

6. **Output format:**
   - Complete Remotion TSX for each scene (production-ready skeleton)
   - `voiceover.md` with timestamps
   - `README.md` with `npx remotion studio` instructions

Start with Scene 1–3 code, then continue scene by scene.
```

---

## Alternative tool prompts (shorter)

### For Runway / Pika (B-roll only)
```
Dark tech background, abstract supply chain network graph, nodes labeled PO Shipment Order Price, 
a central product SKU label morphs from ACME-1847 to ACME-2847, teal ripple waves propagate outward, 
nodes turn amber when touched, cinematic lighting, minimal, 4K, no text, 5 seconds
```

### For ElevenLabs / TTS
Use the **Full voiceover script** section above. Voice: calm, confident, American or Indian English neutral, pace 150 wpm.

### For Canva / Pitch (no code)
Import the **Scene-by-scene storyboard** table as 12 slides. Animate with “rise” + “stagger” per bullet. Export MP4 1080p.

---

## Suggested workflow

| Step | Tool | Output |
|------|------|--------|
| 1 | Claude + prompt above | Remotion project |
| 2 | `npx remotion render` | `ripple-launch.mp4` |
| 3 | ElevenLabs | `voiceover.mp3` |
| 4 | DaVinci Resolve / CapCut | Merge VO + music + render |
| 5 | YouTube | Unlisted link for hackathon portal |

**Hackathon tip:** Submit **both** videos if allowed:
- **VIDEO_SCRIPT.md** — live TrueForge demo (proves it works)
- **This launch video** — explains the product to strangers in 2 minutes

---

## 90-second cut (if you need shorter)

Remove or shorten:
- Scene 3 (stakes) → merge into Scene 2
- Scene 10 (feature grid) → show 3 features only: MCP, Sandbox, Approval
- Scene 11 → show only `$21,850` + “Approve to apply”

Target VO word count: ~180 words.

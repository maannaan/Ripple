# Ripple demo video — full script (~3 minutes)

Simple language. Read this while you record, or practice once before going live.

**Goal:** A stranger should understand what Ripple does and how to try it themselves.

---

## Part 0 — Before you record (off camera)

Run these in order. Do this **once** before recording. Do not show this part in the video (or show it in 10 seconds max).

```bash
cd Ripple
npm run demo:prep
```

Terminal 1:
```bash
npm run trueforge
```

Terminal 2:
```bash
npm run mcp:dev
```

Then once:
```bash
npm run agent:update
```

Open in browser: **http://localhost:8790**  
Go to: **Agents → ripple** → **Clear chat**

Practice the chat flow once without recording. If it works, you are ready.

---

## Part 1 — The problem (0:00 – 0:30)

### What to show
- Your face or a simple slide, OR the Ripple README title on screen.

### What to say (read slowly)

> Hi. This is **Ripple**.
>
> Imagine you work in supply chain or operations. You need to change a product code — a **SKU** — from one number to another.
>
> That sounds small. But one SKU change can hit **purchase orders**, **shipments**, **customer orders**, and **pricing**.
>
> If you change the database too fast, you can break live orders or lose money.
>
> **Ripple** helps you see the full impact **before** you change anything — and it only writes to the database **after you say yes**.

### Optional one-liner on screen
```
Problem: SKU change → who gets hurt?  Solution: simulate first, approve, then apply.
```

---

## Part 2 — What Ripple is built with (0:30 – 1:00)

### What to show
1. TrueForge in the browser — **Agents → ripple**
2. Briefly point at: agent name **ripple**, model, tools count (should not be zero)
3. Optional: one terminal with Docker/Postgres running (you can just say “Postgres in Docker”)

### What to say

> Ripple runs on **TrueForge** — an agent harness, not just a chat window.
>
> It uses three pieces working together:
>
> **One** — an **MCP server** that reads real data from a **Postgres** database: products, orders, shipments, pricing.
>
> **Two** — a **sandbox** that runs a small Python script called `simulate_change.py`. That script does the math. The agent does not guess numbers.
>
> **Three** — an **approval gate**. Dangerous writes — like updating the SKU — are blocked until I click **Allow**.
>
> The full loop is: **fetch data → simulate impact → show report → you approve → apply safe changes**.

---

## Part 3 — Ask the impact question (1:00 – 1:45)

### What to show
- TrueForge chat on the **ripple** agent
- Type the prompt slowly so viewers can read it

### Type exactly (copy-paste)

```
What is the impact of changing SKU ACME-1847 to ACME-2847?
```

### What to say while it runs

> I am asking: what happens if we change SKU **ACME-1847** to **ACME-2847**?
>
> Watch the **Agent steps** panel. Ripple is not making this up. It calls tools to read the database.

### What to point at when steps appear

Say each item in plain English:

| Tool you see | Say this |
|--------------|----------|
| `get_product` | “It loads the product from the catalog.” |
| `find_purchase_orders` | “It finds purchase orders tied to this product.” |
| `find_shipments` | “It finds shipments — including what is still in transit.” |
| `find_customer_orders` | “It finds customer orders that might need manual review.” |
| `find_pricing_rules` | “It checks pricing rules by region.” |
| `simulate_change.py` | “It runs the simulator in the sandbox. All dollar amounts come from this script.” |

If you see **subagent threads**, you can add:

> “TrueForge can split work into subagents — fetch and simulate in isolation — then merge the result.”

---

## Part 4 — Read the impact report (1:45 – 2:15)

### What to show
- Scroll so the **Impact Report** numbers are visible on screen
- Pause 3–5 seconds on the revenue line

### What to say

> Here is the impact report. These are the numbers judges should see for this demo:
>
> **Revenue at risk: 21,850 dollars.**
>
> **Purchase orders: 101 and 102** are affected.
>
> **Customer orders 9001 and 9002** need **manual review** — we do not auto-change those.
>
> **Shipment 5002** is **in transit**, so it would be flagged for remapping.
>
> Ripple is telling us what is safe to auto-update versus what a human must handle.

### Golden numbers (must match)

| Item | Value |
|------|-------|
| Revenue | **21850** |
| POs | **101**, **102** |
| Orders (manual) | **9001**, **9002** |
| In-transit shipment | **5002** |

If numbers are wrong, stop recording, run `npm run demo:prep`, clear chat, try again.

---

## Part 5 — Approve and apply (2:15 – 2:45)

### What to show
- Type the approval prompt
- TrueForge **Allow / Deny** dialog for `apply_product_update`
- Click **Allow**

### Type exactly

```
Approve safe updates
```

### What to say

> I am not done yet. Ripple asks for explicit approval before it changes the database.
>
> I say: **Approve safe updates**.
>
> TrueForge pauses and shows **apply_product_update**. This is the approval gate.
>
> I click **Allow**.
>
> Only now does Ripple update the product SKU and flag the in-transit shipment. Customer orders stay for manual follow-up.

---

## Part 6 — Prove it worked (2:45 – 3:00)

### What to show (pick one or both)

**Option A — in chat:**
```
get_product for SKU ACME-2847
```

**Option B — in terminal (very clear for judges):**

```bash
docker compose exec -T postgres psql -U ripple -d ripple -c \
  "SELECT sku FROM products WHERE product_id=1; SELECT shipment_id, needs_remapping FROM shipments WHERE product_id=1;"
```

### What to say

> Proof: the SKU in the database is now **ACME-2847**.
>
> Shipment **5002** has **needs_remapping** set to true.
>
> Ripple also wrote an **audit log** entry so the change is traceable.

### Closing (last 10 seconds)

> That is Ripple: real data, deterministic simulation, human approval, audited writes.
>
> Repo: **github.com/maannaan/Ripple**. Clone it, run `npm run demo:prep`, open `docs/DEMO.md`, and try the same prompts yourself.
>
> Thanks for watching.

---

## Quick reference — exact prompts

| Step | You type |
|------|----------|
| 1 | `What is the impact of changing SKU ACME-1847 to ACME-2847?` |
| 2 | `Approve safe updates` → click **Allow** |
| 3 (optional) | `get_product for SKU ACME-2847` |

---

## How a stranger can use Ripple (say this in closing or put in video description)

```text
1. git clone https://github.com/maannaan/Ripple
2. cd Ripple && npm install
3. npm run demo:prep
4. Terminal 1: npm run trueforge
5. Terminal 2: npm run mcp:dev
6. npm run mcp:register && npm run agent:update
7. Open http://localhost:8790 → Agents → ripple
8. Ask the two prompts above
```

Add your **Fireworks or Gemini API key** in TrueForge → Settings → Models.

---

## If something goes wrong while recording

| Problem | Fix |
|---------|-----|
| Agent asks “what systems?” with 0 tools | You are not on **Agents → ripple**. Switch agent. |
| SKU already ACME-2847 | `npm run demo:prep` then clear chat |
| Sandbox / git error | Say “retry” — agent can curl the simulator; or fix git with `npm run fix:sandbox-git` |
| Wrong revenue | Agent skipped simulation — check skill registered, run `npm run agent:update` |

---

## Video description template (paste on YouTube)

```text
Ripple — SKU change-impact agent on TrueForge (Agent Harness Hackathon).

Before you change a product SKU, Ripple:
- Reads live data from Postgres (MCP)
- Simulates impact in a sandbox (revenue, orders, shipments)
- Shows a report
- Waits for your approval before writing

Demo: ACME-1847 → ACME-2847, revenue at risk $21,850.

Repo: https://github.com/maannaan/Ripple
Setup: docs/DEMO.md
```

---

## Recording tips

- Speak slower than normal — viewers are learning Ripple for the first time
- Zoom browser to 110–125% so tool names are readable
- Expand **Agent steps** — judges want to see MCP + sandbox
- Keep it under **3 minutes**; cut the problem section if you run long
- Record in one take if possible; a second take after `demo:prep` is fine

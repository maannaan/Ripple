# Legacy setup notes (Phase 0)

Ripple MVP no longer depends on Anthropic. Use Fireworks or Gemini for the demo. This page preserves original Phase 0 steps.

## TrueForge ports

```bash
npm run trueforge
```

Open [http://localhost:8790](http://localhost:8790).

If port 8790 is in use:

```bash
TRUEFORGE_PORT=8792 npm run trueforge
```

Optional: isolate TrueForge SQLite data:

```bash
SQLITE_PATH=~/.ripple/trueforge.sqlite npm run trueforge
```

## Configure Anthropic (optional)

1. Open **Settings → Models**
2. Select **Anthropic** from the catalog
3. Paste your API key and click **Create**

```bash
export ANTHROPIC_API_KEY=your-key
npm run configure:anthropic
```

## Smoke test

In chat: `Reply with exactly: RIPPLE_PHASE0_OK`

## Phase 0 verification

```bash
npm run verify:phase0
```

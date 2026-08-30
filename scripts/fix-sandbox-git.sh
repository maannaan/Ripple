#!/usr/bin/env bash
# Diagnose git/skill sandbox issues on macOS for TrueForge ripple-simulation skill.
set -euo pipefail

echo "=== Ripple sandbox git diagnostic ==="

if ! command -v git >/dev/null 2>&1; then
  echo "FAIL: git not found — install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

echo "git: $(git --version)"
echo "xcode-select: $(xcode-select -p 2>&1 || echo 'not set')"

if git ls-remote https://github.com/maannaan/Ripple HEAD >/dev/null 2>&1; then
  echo "PASS: git ls-remote to GitHub works in this shell"
else
  echo "FAIL: git ls-remote failed in this shell"
fi

if [[ -d /Library/Developer/CommandLineTools ]]; then
  echo ""
  echo "Command Line Tools are installed. If TrueForge sandbox still fails with"
  echo "'no active GUI session', switch developer directory (requires password):"
  echo "  sudo xcode-select --switch /Library/Developer/CommandLineTools"
  echo "Then restart TrueForge: npm run trueforge"
else
  echo ""
  echo "Install Command Line Tools: xcode-select --install"
fi

echo ""
echo "Workaround: agent instructions include a curl fallback for simulate_change.py"
echo "when git skill init fails — clear chat and retry the SKU question after npm run agent:update"

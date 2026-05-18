#!/usr/bin/env bash
# pre-commit-build-check.sh — Verify backend + frontend build before commit
# Blocks commit if compilation fails. Skip with: SKIP=build-check git commit
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

# --- Backend: compile only (skip tests for speed) ---
if git diff --cached --name-only | grep -qE '^backend/.*\.java$|^backend/.*/pom\.xml$'; then
  echo "pre-commit: backend Java changed → running mvnw compile..."
  if (cd "$ROOT_DIR/backend" && ./mvnw compile -q 2>&1); then
    echo "pre-commit: backend compile OK"
  else
    echo "pre-commit: FAIL — backend compile failed" >&2
    FAILED=1
  fi
fi

# --- Frontend: build ---
if git diff --cached --name-only | grep -qE '^frontend/.*\.(ts|tsx|js|jsx|css|json)$'; then
  echo "pre-commit: frontend changed → running pnpm build..."
  if (cd "$ROOT_DIR/frontend" && pnpm build 2>&1); then
    echo "pre-commit: frontend build OK"
  else
    echo "pre-commit: FAIL — frontend build failed" >&2
    FAILED=1
  fi
fi

exit $FAILED

#!/usr/bin/env bash
# ============================================================================
# smoke-test.sh — Basic verification: build + unit test + frontend build
#
# Exit 0 = ALL PASS, Exit 1 = FAIL
# Usage: ./scripts/smoke-test.sh
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "=== Smoke Test ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Backend unit tests
# ---------------------------------------------------------------------------
echo "[1/3] Backend: ./mvnw test ..."
if (cd "$ROOT_DIR/backend" && ./mvnw -B test 2>&1); then
  echo "[PASS] Backend tests"
else
  echo "[FAIL] Backend tests failed"
  FAIL=1
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Frontend: Lint + TypeCheck + Test + Build
# ---------------------------------------------------------------------------
echo "[2/3] Frontend: Verifying quality ..."

# 2.1 Lint
echo "       - pnpm lint ..."
if (cd "$ROOT_DIR/frontend" && pnpm lint 2>&1); then
  echo "       [PASS] Lint"
else
  echo "       [FAIL] Lint failed"
  FAIL=1
fi

# 2.2 Type check
echo "       - pnpm typecheck ..."
if (cd "$ROOT_DIR/frontend" && pnpm typecheck 2>&1); then
  echo "       [PASS] Type check"
else
  echo "       [FAIL] Type check failed"
  FAIL=1
fi

# 2.3 Unit tests
echo "       - pnpm test ..."
if (cd "$ROOT_DIR/frontend" && pnpm test --run 2>&1); then
  echo "       [PASS] Unit tests"
else
  echo "       [FAIL] Unit tests failed"
  FAIL=1
fi

# 2.4 Build
echo "       - pnpm build ..."
if (cd "$ROOT_DIR/frontend" && pnpm build 2>&1); then
  echo "       [PASS] Build"
else
  echo "       [FAIL] Build failed"
  FAIL=1
fi
echo ""


# ---------------------------------------------------------------------------
# 3. Pre-commit hooks (dry-run check)
# ---------------------------------------------------------------------------
echo "[3/3] Pre-commit hooks check ..."
if cd "$ROOT_DIR" && git diff --cached --quiet 2>/dev/null; then
  echo "[SKIP] No staged files to check"
else
  echo "[INFO] Run 'pre-commit run --all-files' separately if needed"
fi
echo ""

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ "$FAIL" -eq 0 ]; then
  echo "=== RESULT: ALL PASS ==="
  exit 0
else
  echo "=== RESULT: FAILURES DETECTED ==="
  exit 1
fi

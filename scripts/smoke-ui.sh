#!/usr/bin/env bash
# ============================================================================
# smoke-ui.sh — UI health check: verifies dev server or production build
#
# Exit 0 = ALL PASS, Exit 1 = FAIL
# Usage: ./scripts/smoke-ui.sh [BASE_URL]
# ============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
FAIL=0

echo "=== UI Smoke Test ==="
echo "Base URL: $BASE_URL"
echo ""

# ---------------------------------------------------------------------------
# 1. Health check / Availability
# ---------------------------------------------------------------------------
echo "[1/2] Web Server: GET $BASE_URL ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "[PASS] Web server reachable ($HTTP_CODE)"
else
  echo "[FAIL] Web server not reachable (got $HTTP_CODE, expected 200)"
  echo "       Is the frontend dev server running? Try: cd frontend && pnpm dev"
  FAIL=1
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Content check (Anti-White-Screen)
# ---------------------------------------------------------------------------
if [ "$FAIL" -eq 0 ]; then
  echo "[2/2] Content: Checking for root element ..."
  HTML_BODY=$(curl -s "$BASE_URL")

  # Check if root div exists (standard React entry point)
  if echo "$HTML_BODY" | grep -q 'id="root"'; then
    echo "[PASS] Root element found"
  else
    echo "[FAIL] Root element not found! Possible build error or white screen."
    FAIL=1
  fi
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

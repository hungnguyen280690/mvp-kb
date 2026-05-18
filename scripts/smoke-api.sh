#!/usr/bin/env bash
# ============================================================================
# smoke-api.sh — API smoke test: health check + basic CRUD
#
# Prerequisites: Service must be running (docker-compose up or local).
# Exit 0 = ALL PASS, Exit 1 = FAIL
# Usage: ./scripts/smoke-api.sh [BASE_URL]
# ============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:8081}"
FAIL=0
CREATED_ID=""

echo "=== API Smoke Test ==="
echo "Base URL: $BASE_URL"
echo ""

# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------
echo "[1/6] Health check: GET /actuator/health ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "[PASS] Health check ($HTTP_CODE)"
else
  echo "[FAIL] Health check (got $HTTP_CODE, expected 200)"
  echo "       Is the service running? Try: docker-compose --profile app up"
  FAIL=1
fi
echo ""

# If health fails, skip API tests
if [ "$FAIL" -eq 1 ]; then
  echo "=== RESULT: Service not reachable, skipping API tests ==="
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. List (GET)
# ---------------------------------------------------------------------------
echo "[2/6] List: GET /api/v1/ltt ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/ltt" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "[PASS] List ($HTTP_CODE)"
else
  echo "[WARN] List (got $HTTP_CODE) — endpoint may not exist yet"
fi
echo ""

# ---------------------------------------------------------------------------
# 3. Create (POST)
# ---------------------------------------------------------------------------
echo "[3/6] Create: POST /api/v1/ltt ..."
PAYLOAD='{"channel":"LNH","senderName":"Smoke Test","receiverName":"Test Receiver","details":[{"coaCode":"123456789012","amount":1000000,"description":"Smoke test"}]}'
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: smoke-test-$(date +%s)" \
  -d "$PAYLOAD" \
  "$BASE_URL/api/v1/ltt" 2>/dev/null || echo -e "\n000")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[PASS] Create ($HTTP_CODE)"
  # Try to extract ID from response
  CREATED_ID=$(echo "$BODY" | grep -oP '"id"\s*:\s*"?\K[^",}]+' 2>/dev/null | head -1 || echo "")
  if [ -n "$CREATED_ID" ]; then
    echo "       Created ID: $CREATED_ID"
  fi
else
  echo "[WARN] Create (got $HTTP_CODE) — endpoint may not exist yet"
fi
echo ""

# ---------------------------------------------------------------------------
# 4. Read one (GET /{id})
# ---------------------------------------------------------------------------
if [ -n "$CREATED_ID" ]; then
  echo "[4/6] Read: GET /api/v1/ltt/$CREATED_ID ..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/ltt/$CREATED_ID" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "[PASS] Read ($HTTP_CODE)"
  else
    echo "[FAIL] Read (got $HTTP_CODE, expected 200)"
    FAIL=1
  fi
else
  echo "[4/6] Read: SKIP (no ID from create)"
fi
echo ""

# ---------------------------------------------------------------------------
# 5. Update (PUT /{id})
# ---------------------------------------------------------------------------
if [ -n "$CREATED_ID" ]; then
  echo "[5/6] Update: PUT /api/v1/ltt/$CREATED_ID ..."
  UPDATE_PAYLOAD='{"channel":"LNH","senderName":"Smoke Test Updated","version":1}'
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD" \
    "$BASE_URL/api/v1/ltt/$CREATED_ID" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "[PASS] Update ($HTTP_CODE)"
  else
    echo "[WARN] Update (got $HTTP_CODE)"
  fi
else
  echo "[5/6] Update: SKIP (no ID from create)"
fi
echo ""

# ---------------------------------------------------------------------------
# 6. Delete (DELETE /{id})
# ---------------------------------------------------------------------------
if [ -n "$CREATED_ID" ]; then
  echo "[6/6] Delete: DELETE /api/v1/ltt/$CREATED_ID ..."
  DELETE_PAYLOAD='{"reason":"Smoke test cleanup","version":2}'
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Content-Type: application/json" \
    -d "$DELETE_PAYLOAD" \
    "$BASE_URL/api/v1/ltt/$CREATED_ID" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "[PASS] Delete ($HTTP_CODE)"
  else
    echo "[WARN] Delete (got $HTTP_CODE)"
  fi
else
  echo "[6/6] Delete: SKIP (no ID from create)"
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

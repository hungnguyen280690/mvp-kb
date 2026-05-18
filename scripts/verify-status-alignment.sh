#!/usr/bin/env bash
# ============================================================================
# verify-status-alignment.sh — Compare LTT status values across 3 sources:
#   1. Java enum:   backend/ltt-core/.../LttStatus.java
#   2. TypeScript:  frontend/apps/ltt-ui/src/api/lttApi.ts
#   3. OpenAPI:     features/FT-001/04-openapi.yaml (if exists)
#
# Extracts enum names (e.g. DRAFT, READY_FOR_APPROVAL) and reports mismatches.
# Exit 0 if aligned, exit 1 if any mismatch found.
# ============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# File paths
JAVA_ENUM="${ROOT_DIR}/backend/ltt-core/src/main/java/com/kb/ltt/domain/model/LttStatus.java"
TS_API="${ROOT_DIR}/frontend/apps/ltt-ui/src/api/lttApi.ts"
OPENAPI_YAML="${ROOT_DIR}/features/FT-001/04-openapi.yaml"

# Temporary files for extracted values
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

JAVA_VALUES="${TMP_DIR}/java_statuses.txt"
TS_VALUES="${TMP_DIR}/ts_statuses.txt"
OPENAPI_VALUES="${TMP_DIR}/openapi_statuses.txt"

echo "=== LTT Status Alignment Verification ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Extract Java enum values
# ---------------------------------------------------------------------------
if [[ ! -f "$JAVA_ENUM" ]]; then
  echo "[FAIL] Java enum not found: ${JAVA_ENUM}"
  exit 1
fi

# Extract enum constant names: lines matching uppercase identifiers before '('
grep -oP '^\s{4}\K[A-Z][A-Z0-9_]*(?=\()' "$JAVA_ENUM" | sort -u > "$JAVA_VALUES"

echo "[INFO] Java LttStatus values ($(wc -l < "$JAVA_VALUES")):"
sed 's/^/       /' "$JAVA_VALUES"
echo ""

# ---------------------------------------------------------------------------
# 2. Extract TypeScript union type values
# ---------------------------------------------------------------------------
if [[ ! -f "$TS_API" ]]; then
  echo "[FAIL] TypeScript API file not found: ${TS_API}"
  exit 1
fi

# Extract values from LttStatus type union: lines with 'string' in single quotes
# under the LttStatus type definition
# Pattern: | 'VALUE'
sed -n '/^export type LttStatus/,/;/p' "$TS_API" \
  | grep -oP "'\K[A-Z][A-Z0-9_]*(?=')" \
  | sort -u > "$TS_VALUES"

echo "[INFO] TypeScript LttStatus values ($(wc -l < "$TS_VALUES")):"
sed 's/^/       /' "$TS_VALUES"
echo ""

# ---------------------------------------------------------------------------
# 3. Extract OpenAPI enum values (if file exists)
# ---------------------------------------------------------------------------
if [[ -f "$OPENAPI_YAML" ]]; then
  # Try to extract LttStatus enum from OpenAPI spec
  # Look for enum block under LttStatus schema or in parameter definitions
  # Pattern matches YAML like:
  #   LttStatus:
  #     type: string
  #     enum:
  #       - DRAFT
  #       - READY_FOR_APPROVAL
  sed -n '/LttStatus/,/^[^ ]/p' "$OPENAPI_YAML" \
    | grep -oP '^\s+-\s+\K[A-Z][A-Z0-9_]*' \
    | sort -u > "$OPENAPI_VALUES"

  echo "[INFO] OpenAPI LttStatus values ($(wc -l < "$OPENAPI_VALUES")):"
  sed 's/^/       /' "$OPENAPI_VALUES"
  echo ""
else
  echo "[WARN] OpenAPI yaml not found (${OPENAPI_YAML}) — skipping OpenAPI comparison"
  echo ""
fi

# ---------------------------------------------------------------------------
# Compare Java vs TypeScript
# ---------------------------------------------------------------------------
MISMATCH=0

echo "--- Java vs TypeScript ---"
ONLY_JAVA=$(comm -23 "$JAVA_VALUES" "$TS_VALUES")
ONLY_TS=$(comm -13 "$JAVA_VALUES" "$TS_VALUES")

if [[ -n "$ONLY_JAVA" ]]; then
  MISMATCH=1
  echo "[FAIL] In Java but NOT in TypeScript:"
  while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_JAVA"
fi

if [[ -n "$ONLY_TS" ]]; then
  MISMATCH=1
  echo "[FAIL] In TypeScript but NOT in Java:"
  while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_TS"
fi

if [[ -z "$ONLY_JAVA" && -z "$ONLY_TS" ]]; then
  echo "[PASS] Java and TypeScript status values are aligned"
fi
echo ""

# ---------------------------------------------------------------------------
# Compare Java vs OpenAPI (if available)
# ---------------------------------------------------------------------------
if [[ -f "$OPENAPI_YAML" && -s "$OPENAPI_VALUES" ]]; then
  echo "--- Java vs OpenAPI ---"
  ONLY_JAVA_OA=$(comm -23 "$JAVA_VALUES" "$OPENAPI_VALUES")
  ONLY_OA=$(comm -13 "$JAVA_VALUES" "$OPENAPI_VALUES")

  if [[ -n "$ONLY_JAVA_OA" ]]; then
    MISMATCH=1
    echo "[FAIL] In Java but NOT in OpenAPI:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_JAVA_OA"
  fi

  if [[ -n "$ONLY_OA" ]]; then
    MISMATCH=1
    echo "[FAIL] In OpenAPI but NOT in Java:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_OA"
  fi

  if [[ -z "$ONLY_JAVA_OA" && -z "$ONLY_OA" ]]; then
    echo "[PASS] Java and OpenAPI status values are aligned"
  fi
  echo ""
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [[ "$MISMATCH" -eq 0 ]]; then
  echo "=== RESULT: All status values aligned ==="
  exit 0
else
  echo "=== RESULT: Status value mismatches detected ==="
  exit 1
fi

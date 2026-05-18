#!/usr/bin/env bash
# ============================================================================
# verify-api-contract.sh — Compare API endpoints across 3 sources:
#   1. OpenAPI yaml:    features/FT-001/04-openapi.yaml (if exists)
#   2. Backend:         @RequestMapping/@GetMapping/... annotations in Java
#   3. Frontend:        fetch/api calls in lttApi.ts
#
# Reports endpoints present in one source but missing from another.
# Exit 0 if aligned, exit 1 if any mismatch found.
# ============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# File / directory paths
OPENAPI_YAML="${ROOT_DIR}/features/FT-001/04-openapi.yaml"
CONTROLLER_DIR="${ROOT_DIR}/backend/ltt-core/src/main/java/com/kb/ltt"
TS_API="${ROOT_DIR}/frontend/apps/ltt-ui/src/api/lttApi.ts"

# Temporary files
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

OPENAPI_ENDPOINTS="${TMP_DIR}/openapi_endpoints.txt"
BACKEND_ENDPOINTS="${TMP_DIR}/backend_endpoints.txt"
FRONTEND_ENDPOINTS="${TMP_DIR}/frontend_endpoints.txt"

echo "=== API Contract Verification ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Extract endpoints from OpenAPI yaml (if available)
# ---------------------------------------------------------------------------
if [[ -f "$OPENAPI_YAML" ]]; then
  # Extract path lines and their methods
  # OpenAPI format:
  #   /api/v1/ltt:
  #     get:
  #     post:
  #   /api/v1/ltt/{id}:
  #     get:
  #     put:
  #     delete:
  python3 -c "
import yaml, sys
with open('${OPENAPI_YAML}') as f:
    spec = yaml.safe_load(f)
paths = spec.get('paths', {})
for path, methods in paths.items():
    for method in methods:
        if method.lower() in ('get','post','put','delete','patch'):
            print(f'{method.upper()} {path}')
" 2>/dev/null | sort -u > "$OPENAPI_ENDPOINTS" || true

  # Fallback: grep-based extraction if python/yaml parsing fails
  if [[ ! -s "$OPENAPI_ENDPOINTS" ]]; then
    # Simple grep approach: find path keys and method keys
    awk '
      /^  \// { current_path=$1; gsub(/:$/, "", current_path) }
      /^    (get|post|put|delete|patch):/ {
        method=$1; gsub(/:$/, "", method)
        print toupper(method) " " current_path
      }
    ' "$OPENAPI_YAML" | sort -u > "$OPENAPI_ENDPOINTS"
  fi

  echo "[INFO] OpenAPI endpoints ($(wc -l < "$OPENAPI_ENDPOINTS")):"
  sed 's/^/       /' "$OPENAPI_ENDPOINTS"
  echo ""
else
  echo "[WARN] OpenAPI yaml not found — skipping OpenAPI comparison"
  echo ""
  touch "$OPENAPI_ENDPOINTS"
fi

# ---------------------------------------------------------------------------
# 2. Extract endpoints from Backend Java controllers
# ---------------------------------------------------------------------------
# Strategy: Parse @RequestMapping for base path, then combine with method
# annotations to build full endpoint paths.

# Find all controller files
controller_files=$(find "$CONTROLLER_DIR" -name '*Controller*.java' -type f 2>/dev/null || true)

if [[ -n "$controller_files" ]]; then
  while IFS= read -r ctrl_file; do
    # Extract class-level @RequestMapping base path
    base_path=$(grep -oP '@RequestMapping\s*\(\s*"\K[^"]+' "$ctrl_file" 2>/dev/null | head -1 || echo "")

    # Extract method-level mappings
    # @GetMapping("/{id}")  -> GET /{id}
    # @PostMapping          -> POST
    while IFS= read -r line; do
      method=$(echo "$line" | grep -oP '@\K(Get|Post|Put|Delete|Patch)Mapping' | head -1 | sed 's/Mapping$//' | tr '[:lower:]' '[:upper:]')
      # Extract the path from the annotation
      path=$(echo "$line" | grep -oP 'Mapping\s*\(\s*(value\s*=\s*)?"\K[^"]+' 2>/dev/null || echo "")

      if [[ -n "$method" ]]; then
        # If no path in annotation, it maps to the base path
        full_path="${base_path}${path}"
        echo "${method} ${full_path}"
      fi
    done < <(grep -E '@(Get|Post|Put|Delete|Patch)Mapping' "$ctrl_file" 2>/dev/null || true)

  done <<< "$controller_files" | sort -u > "$BACKEND_ENDPOINTS"
else
  touch "$BACKEND_ENDPOINTS"
fi

echo "[INFO] Backend endpoints ($(wc -l < "$BACKEND_ENDPOINTS")):"
sed 's/^/       /' "$BACKEND_ENDPOINTS"
echo ""

# ---------------------------------------------------------------------------
# 3. Extract endpoints from Frontend API calls
# ---------------------------------------------------------------------------
if [[ -f "$TS_API" ]]; then
  true > "$FRONTEND_ENDPOINTS"

  # Extract API_BASE value
  api_base=$(grep -oP "const API_BASE = '\K[^']+" "$TS_API" 2>/dev/null || echo "/api/v1/ltt")

  # Use awk to parse multi-line patterns across the whole file.
  # Each exported async function defines an endpoint. We extract:
  #   - the URL path from `${API_BASE}/path` or `API_BASE` (bare)
  #   - the HTTP method from `method: 'POST'` etc., defaulting to GET
  #
  # The awk script joins continuation lines and processes each function block.
  awk -v base="$api_base" '
    BEGIN { url = ""; method = "GET" }
    /^export async function/ {
      # Flush previous endpoint if any
      if (url != "") {
        print method " " base url
      }
      url = ""
      method = "GET"
    }
    /request</ || /return request/ {
      # Extract URL from backtick template: `${API_BASE}/path`
      if (match($0, /`\$\{API_BASE\}[^`]*/)) {
        s = substr($0, RSTART, RLENGTH)
        gsub(/`\$\{API_BASE\}/, "", s)
        gsub(/`.*/, "", s)
        url = s
      }
      # Or bare API_BASE without template literal
      else if (match($0, /[^$]API_BASE[^}]/) && !match($0, /\$\{API_BASE\}/)) {
        url = ""
      }
      # Extract method on same line
      if (match($0, /method:[[:space:]]*.([A-Z]+)/, m)) {
        # gawk match with array
      }
      if ($0 ~ /method:[[:space:]]*.POST/)  method = "POST"
      else if ($0 ~ /method:[[:space:]]*.PUT/)   method = "PUT"
      else if ($0 ~ /method:[[:space:]]*.DELETE/) method = "DELETE"
      else if ($0 ~ /method:[[:space:]]*.PATCH/)  method = "PATCH"
    }
    /method:/ {
      if ($0 ~ /method:[[:space:]]*.POST/)  method = "POST"
      else if ($0 ~ /method:[[:space:]]*.PUT/)   method = "PUT"
      else if ($0 ~ /method:[[:space:]]*.DELETE/) method = "DELETE"
      else if ($0 ~ /method:[[:space:]]*.PATCH/)  method = "PATCH"
    }
    END {
      if (url != "") {
        print method " " base url
      }
    }
  ' "$TS_API" | sort -u > "$FRONTEND_ENDPOINTS"

  echo "[INFO] Frontend endpoints ($(wc -l < "$FRONTEND_ENDPOINTS")):"
  sed 's/^/       /' "$FRONTEND_ENDPOINTS"
  echo ""
else
  echo "[WARN] Frontend API file not found — skipping frontend comparison"
  echo ""
  touch "$FRONTEND_ENDPOINTS"
fi

# ---------------------------------------------------------------------------
# Compare sources
# ---------------------------------------------------------------------------
MISMATCH=0

# Normalize endpoints for comparison: strip trailing slashes, replace path params
# Handles both Java {id} and TS ${id} template literal syntax
normalize() {
  sed 's|/$||' | sed 's|\${[^}]*}|{id}|g' | sed 's|{[^}]*}|{id}|g'
}

BACKEND_NORM="${TMP_DIR}/backend_norm.txt"
FRONTEND_NORM="${TMP_DIR}/frontend_norm.txt"
OPENAPI_NORM="${TMP_DIR}/openapi_norm.txt"

normalize "$BACKEND_ENDPOINTS" > "$BACKEND_NORM"
normalize "$FRONTEND_ENDPOINTS" > "$FRONTEND_NORM"
normalize "$OPENAPI_ENDPOINTS" > "$OPENAPI_NORM"

# --- Backend vs Frontend ---
echo "--- Backend vs Frontend ---"
ONLY_BE=$(comm -23 "$BACKEND_NORM" "$FRONTEND_NORM")
ONLY_FE=$(comm -13 "$BACKEND_NORM" "$FRONTEND_NORM")

if [[ -n "$ONLY_BE" ]]; then
  MISMATCH=1
  echo "[FAIL] In Backend but NOT in Frontend:"
  while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_BE"
fi
if [[ -n "$ONLY_FE" ]]; then
  MISMATCH=1
  echo "[FAIL] In Frontend but NOT in Backend:"
  while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_FE"
fi
if [[ -z "$ONLY_BE" && -z "$ONLY_FE" ]]; then
  echo "[PASS] Backend and Frontend endpoints are aligned"
fi
echo ""

# --- Backend vs OpenAPI ---
if [[ -s "$OPENAPI_ENDPOINTS" ]]; then
  echo "--- Backend vs OpenAPI ---"
  ONLY_BE_OA=$(comm -23 "$BACKEND_NORM" "$OPENAPI_NORM")
  ONLY_OA_BE=$(comm -13 "$BACKEND_NORM" "$OPENAPI_NORM")

  if [[ -n "$ONLY_BE_OA" ]]; then
    MISMATCH=1
    echo "[FAIL] In Backend but NOT in OpenAPI:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_BE_OA"
  fi
  if [[ -n "$ONLY_OA_BE" ]]; then
    MISMATCH=1
    echo "[FAIL] In OpenAPI but NOT in Backend:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_OA_BE"
  fi
  if [[ -z "$ONLY_BE_OA" && -z "$ONLY_OA_BE" ]]; then
    echo "[PASS] Backend and OpenAPI endpoints are aligned"
  fi
  echo ""

  # --- Frontend vs OpenAPI ---
  echo "--- Frontend vs OpenAPI ---"
  ONLY_FE_OA=$(comm -23 "$FRONTEND_NORM" "$OPENAPI_NORM")
  ONLY_OA_FE=$(comm -13 "$FRONTEND_NORM" "$OPENAPI_NORM")

  if [[ -n "$ONLY_FE_OA" ]]; then
    MISMATCH=1
    echo "[FAIL] In Frontend but NOT in OpenAPI:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_FE_OA"
  fi
  if [[ -n "$ONLY_OA_FE" ]]; then
    MISMATCH=1
    echo "[FAIL] In OpenAPI but NOT in Frontend:"
    while IFS= read -r line; do echo "       $line"; done <<< "$ONLY_OA_FE"
  fi
  if [[ -z "$ONLY_FE_OA" && -z "$ONLY_OA_FE" ]]; then
    echo "[PASS] Frontend and OpenAPI endpoints are aligned"
  fi
  echo ""
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [[ "$MISMATCH" -eq 0 ]]; then
  echo "=== RESULT: All API contracts aligned ==="
  exit 0
else
  echo "=== RESULT: API contract mismatches detected ==="
  exit 1
fi

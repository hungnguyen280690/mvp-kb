#!/usr/bin/env bash
# ============================================================================
# gate-verify.sh — Gate verification for MARBO workflow
# Usage: bash scripts/gate-verify.sh FT-001 G1   (or G2, G3, G4)
#
# Each check prints [PASS] or [FAIL] with a description.
# Exit 0 if all PASS, exit 1 if any FAIL.
# ============================================================================

set -euo pipefail

FT="${1:?Usage: gate-verify.sh <FEATURE> <GATE>  (e.g. FT-001 G1)}"
GATE="${2:?Usage: gate-verify.sh <FEATURE> <GATE>  (e.g. FT-001 G1)}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FEATURE_DIR="${ROOT_DIR}/features/${FT}"
GATES_DIR="${ROOT_DIR}/gates"

FAIL_COUNT=0

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

pass() {
  echo "[PASS] $*"
}

fail() {
  echo "[FAIL] $*"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

check_file_exists_nonempty() {
  local filepath="$1"
  local label="$2"
  if [[ ! -f "$filepath" ]]; then
    fail "${label} not found: ${filepath}"
    return
  fi
  if [[ ! -s "$filepath" ]]; then
    fail "${label} is empty: ${filepath}"
    return
  fi
  pass "${label} exists and is non-empty"
}

check_no_missing_info() {
  local search_dir="$1"
  local label="$2"
  local count
  count=$(grep -rl '<<MISSING-INFO>>' "$search_dir" --include='*.md' 2>/dev/null | wc -l || true)
  if [[ "$count" -gt 0 ]]; then
    local files
    files=$(grep -rl '<<MISSING-INFO>>' "$search_dir" --include='*.md' 2>/dev/null)
    fail "${label}: <<MISSING-INFO>> found in: ${files}"
  else
    pass "${label}: no <<MISSING-INFO>> placeholders"
  fi
}

# ---------------------------------------------------------------------------
# G1 — BA Gate
# ---------------------------------------------------------------------------
gate_g1() {
  echo ""
  echo "=== G1 (BA Gate) verification for ${FT} ==="
  echo ""

  # 0. BA Plan exists
  check_file_exists_nonempty "${GATES_DIR}/${FT}-BA-Plan.md" "BA Plan"

  # 1. Three spec files (replacing old single 01-business-spec.md)
  check_file_exists_nonempty "${FEATURE_DIR}/01_spec_field.md" "Field spec"
  check_file_exists_nonempty "${FEATURE_DIR}/01_spec_button.md" "Button spec"
  check_file_exists_nonempty "${FEATURE_DIR}/01_spec_function.md" "Function spec"

  # 2. BDD scenarios exists and non-empty
  check_file_exists_nonempty "${FEATURE_DIR}/01b-bdd-scenarios.md" "BDD scenarios"

  # 3. Glossary exists
  check_file_exists_nonempty "${ROOT_DIR}/docs/domain/glossary.md" "Domain glossary"

  # 4. No MISSING-INFO placeholders in feature .md files
  check_no_missing_info "${FEATURE_DIR}" "Feature .md files"

  # 5. No PENDING-DECISION markers
  local pd_count
  pd_count=$(grep -rl '<<PENDING-DECISION>>' "${FEATURE_DIR}" --include='*.md' 2>/dev/null | wc -l || echo "0")
  if [[ "$pd_count" -gt 0 ]]; then
    fail "Found <<PENDING-DECISION>> markers in feature .md files"
  else
    pass "No <<PENDING-DECISION>> markers"
  fi

  # 5. Gherkin syntax validation: at least 5 Scenario blocks, each with Given/When/Then
  local bdd_file="${FEATURE_DIR}/01b-bdd-scenarios.md"
  if [[ -f "$bdd_file" ]]; then
    local scenario_count
    scenario_count=$(grep -cE '^\s*Scenario:' "$bdd_file" 2>/dev/null || echo "0")

    if [[ "$scenario_count" -lt 5 ]]; then
      fail "BDD scenarios: need at least 5 'Scenario:' blocks, found ${scenario_count}"
    else
      pass "BDD scenarios: found ${scenario_count} 'Scenario:' blocks (>= 5)"
    fi

    # Check each Scenario has Given, When, Then
    # Extract scenario blocks and verify each one has the required keywords
    local incomplete=0
    local current_scenario=""
    local has_given=0 has_when=0 has_then=0

    while IFS= read -r line; do
      if echo "$line" | grep -qE '^\s*Scenario:'; then
        # Check previous scenario completeness
        if [[ -n "$current_scenario" ]]; then
          if [[ "$has_given" -eq 0 || "$has_when" -eq 0 || "$has_then" -eq 0 ]]; then
            incomplete=$((incomplete + 1))
            fail "Gherkin: scenario '${current_scenario}' missing Given/When/Then"
          fi
        fi
        current_scenario=$(echo "$line" | sed 's/^\s*Scenario://' | sed 's/^[[:space:]]*//')
        has_given=0
        has_when=0
        has_then=0
      elif echo "$line" | grep -qiE '^\s*Given'; then
        has_given=1
      elif echo "$line" | grep -qiE '^\s*When'; then
        has_when=1
      elif echo "$line" | grep -qiE '^\s*Then'; then
        has_then=1
      fi
    done < "$bdd_file"

    # Check last scenario
    if [[ -n "$current_scenario" ]]; then
      if [[ "$has_given" -eq 0 || "$has_when" -eq 0 || "$has_then" -eq 0 ]]; then
        incomplete=$((incomplete + 1))
        fail "Gherkin: scenario '${current_scenario}' missing Given/When/Then"
      fi
    fi

    if [[ "$incomplete" -eq 0 ]]; then
      pass "Gherkin syntax: all scenarios have Given/When/Then"
    fi
  else
    fail "Cannot validate Gherkin syntax: ${bdd_file} not found"
  fi
}

# ---------------------------------------------------------------------------
# G2 — Design Gate
# ---------------------------------------------------------------------------
gate_g2() {
  echo ""
  echo "=== G2 (Design Gate) verification for ${FT} ==="
  echo ""

  # 0. SA Plan exists
  check_file_exists_nonempty "${GATES_DIR}/${FT}-SA-Plan.md" "SA Plan"

  # 1. BA readiness check approved
  local readiness_file="${GATES_DIR}/${FT}-G1-ba-readiness.md"
  if [[ -f "$readiness_file" ]] && grep -q 'APPROVED' "$readiness_file"; then
    pass "BA readiness check: APPROVED"
  else
    fail "BA readiness check not found or not APPROVED: ${readiness_file}"
  fi

  # 2. Design doc
  check_file_exists_nonempty "${FEATURE_DIR}/02-design.md" "Design document"

  # 3. Schema SQL
  check_file_exists_nonempty "${FEATURE_DIR}/03-schema.sql" "Schema SQL"

  # 4. OpenAPI yaml
  check_file_exists_nonempty "${ROOT_DIR}/contracts/openapi.yaml" "OpenAPI spec"

  # 5. No MISSING-INFO in design files
  check_no_missing_info "${FEATURE_DIR}" "Design .md files"
}

# ---------------------------------------------------------------------------
# G3 — Dev Gate
# ---------------------------------------------------------------------------
gate_g3() {
  echo ""
  echo "=== G3 (Dev Gate) verification for ${FT} ==="
  echo ""

  # 0. Dev Plan exists
  check_file_exists_nonempty "${GATES_DIR}/${FT}-Dev-Plan.md" "Dev Plan"

  local backend_dir="${ROOT_DIR}/backend"
  local frontend_dir="${ROOT_DIR}/frontend"
  local frontend_src="${frontend_dir}/apps/ltt-ui/src"

  # 1. Backend compilation
  echo "--- Backend compilation ---"
  if (cd "$backend_dir" && ./mvnw compile -pl ltt-core -q 2>&1); then
    pass "Backend ltt-core compiles successfully"
  else
    fail "Backend ltt-core compilation failed"
  fi

  # 2. Backend tests
  echo "--- Backend tests ---"
  local test_output
  test_output=$(cd "$backend_dir" && ./mvnw test -pl ltt-core 2>&1) || true

  if echo "$test_output" | grep -qE 'BUILD SUCCESS'; then
    # Check for test failures in output
    local failures
    failures=$(echo "$test_output" | grep -oE 'Tests run: [0-9]+, Failures: [0-9]+' | grep -oE 'Failures: [0-9]+' | grep -oE '[0-9]+' | head -1 || echo "0")

    if [[ "$failures" -gt 0 ]]; then
      fail "Backend tests: ${failures} test(s) failed"
    else
      pass "Backend ltt-core tests pass (100%)"
    fi
  else
    fail "Backend ltt-core tests failed (BUILD FAILURE)"
  fi

  # 3. Frontend build
  echo "--- Frontend build ---"
  if (cd "$frontend_dir" && pnpm build 2>&1); then
    pass "Frontend pnpm build succeeds"
  else
    fail "Frontend pnpm build failed"
  fi

  # 4. No STUB_ in frontend TSX files
  echo "--- Code quality checks ---"
  local stub_count
  stub_count=$(find "$frontend_src" -name '*.tsx' -exec grep -l 'STUB_' {} + 2>/dev/null | wc -l || echo "0")
  if [[ "$stub_count" -gt 0 ]]; then
    local stub_files
    stub_files=$(find "$frontend_src" -name '*.tsx' -exec grep -l 'STUB_' {} + 2>/dev/null)
    fail "Found STUB_ in frontend .tsx files: ${stub_files}"
  else
    pass "No STUB_ references in frontend .tsx files"
  fi

  # 5. No console.log in frontend TSX files
  local console_count
  console_count=$(find "$frontend_src" -name '*.tsx' -exec grep -l 'console\.log' {} + 2>/dev/null | wc -l || echo "0")
  if [[ "$console_count" -gt 0 ]]; then
    local console_files
    console_files=$(find "$frontend_src" -name '*.tsx' -exec grep -l 'console\.log' {} + 2>/dev/null)
    fail "Found console.log in frontend .tsx files: ${console_files}"
  else
    pass "No console.log in frontend .tsx files"
  fi

  # 6. No "// TODO: call" in frontend TSX files
  local todo_count
  todo_count=$(find "$frontend_src" -name '*.tsx' -exec grep -l '// TODO: call' {} + 2>/dev/null | wc -l || echo "0")
  if [[ "$todo_count" -gt 0 ]]; then
    local todo_files
    todo_files=$(find "$frontend_src" -name '*.tsx' -exec grep -l '// TODO: call' {} + 2>/dev/null)
    fail "Found '// TODO: call' in frontend .tsx files: ${todo_files}"
  else
    pass "No '// TODO: call' stubs in frontend .tsx files"
  fi

  # 7. Status values alignment across backend/frontend
  echo "--- Status alignment ---"
  if [[ -x "${ROOT_DIR}/scripts/verify-status-alignment.sh" ]]; then
    if (bash "${ROOT_DIR}/scripts/verify-status-alignment.sh" 2>&1); then
      pass "LTT status values aligned across backend/frontend/openapi"
    else
      fail "LTT status values misaligned — run verify-status-alignment.sh for details"
    fi
  else
    fail "verify-status-alignment.sh not found or not executable"
  fi
}

# ---------------------------------------------------------------------------
# G4 — QA Gate
# ---------------------------------------------------------------------------
gate_g4() {
  echo ""
  echo "=== G4 (QA Gate) verification for ${FT} ==="
  echo ""

  # 0. QA Plan exists
  check_file_exists_nonempty "${GATES_DIR}/${FT}-QA-Plan.md" "QA Plan"

  # 1. All G3 checks must pass (run G3 first)
  gate_g3

  echo ""
  echo "--- G4 additional checks ---"

  # 2. Dev signoff exists
  check_file_exists_nonempty "${GATES_DIR}/${FT}-G3-dev-signoff.md" "G3 dev signoff"

  # 3. Test data file exists
  check_file_exists_nonempty "${FEATURE_DIR}/08-test-data.md" "Test data"

  # 4. Smoke test script pass
  if [[ -x "${ROOT_DIR}/scripts/smoke-test.sh" ]]; then
    echo "--- Smoke test ---"
    if (bash "${ROOT_DIR}/scripts/smoke-test.sh" 2>&1); then
      pass "smoke-test.sh passed"
    else
      fail "smoke-test.sh failed"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

echo "============================================="
echo " Gate Verification: ${FT} / ${GATE}"
echo "============================================="

case "$GATE" in
  G1) gate_g1 ;;
  G2) gate_g2 ;;
  G3) gate_g3 ;;
  G4) gate_g4 ;;
  *)  echo "ERROR: Unknown gate '${GATE}'. Must be G1, G2, G3, or G4."; exit 1 ;;
esac

echo ""
echo "============================================="
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo " RESULT: ALL CHECKS PASSED (${GATE})"
  echo "============================================="
  exit 0
else
  echo " RESULT: ${FAIL_COUNT} CHECK(S) FAILED (${GATE})"
  echo "============================================="
  exit 1
fi

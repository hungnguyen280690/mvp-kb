#!/usr/bin/env bash
# init-feature.sh — bootstrap a new feature folder for mvp-kho-bac.
#
# Usage:
#   ./scripts/init-feature.sh <feature-slug>
#
# Example:
#   ./scripts/init-feature.sh TT-OUT-MANUAL
#   ./scripts/init-feature.sh TT-IN-MANUAL
#
# Creates:
#   features/<feature-slug>/
#   ├── 00-idea.md ... 08-test-data.md  (skeletons)
#   ├── OWNERS.md, CLAUDE.md, MEMORY.md
#   ├── gap-report.md
#   ├── decisions/, loop-iterations/, sessions/

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <feature-slug>"
    echo ""
    echo "Examples:"
    echo "  $0 TT-OUT-MANUAL"
    echo "  $0 TT-IN-MANUAL"
    echo "  $0 TT-CROSS-BORDER"
    exit 1
fi

FEATURE_SLUG="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TODAY="$(date -u +%Y-%m-%d)"

FEATURE_DIR="$REPO_ROOT/features/$FEATURE_SLUG"

if [ -d "$FEATURE_DIR" ]; then
    echo "ERROR: feature folder already exists: $FEATURE_DIR" >&2
    echo "       Pick a different slug or delete the existing folder." >&2
    exit 3
fi

echo "Bootstrapping feature folder: $FEATURE_DIR"

mkdir -p "$FEATURE_DIR"/{decisions,loop-iterations,sessions}

# ─── Artifact skeleton helper ───
make_artifact() {
    local num="$1" name="$2" owner="$3"
    cat > "$FEATURE_DIR/${num}-${name}.md" <<EOF
---
artifact: ${num}-${name}
status: Draft
classification: Internal
feature: ${FEATURE_SLUG}
owner_role: ${owner}
authors:
  humans: []
  agents: []
last_human_read: null
generated_by: null
linter_min_version: 1.4
applies_adrs: [0001, 0006, 0007, 0017]
last_synced_with: {}
---

# ${num}-${name} — ${FEATURE_SLUG}

> Per ADR-0017: cite every claim, no forbidden hedge phrases. Use measurable thresholds.
> If a fact is unknown, write \`<<MISSING-INFO: <what>>>\` and escalate via \`docs/escalations/\`.

## Status: Draft

*(To be filled by ${owner} role. See workspace CLAUDE.md for instructions.)*

## Content

EOF
}

# ─── 9 Artifacts ───
make_artifact "00" "idea" "PO"
make_artifact "01" "requirements" "BA"
make_artifact "02" "design" "SA"
make_artifact "03" "api-contract" "SA"
make_artifact "04" "db-schema" "DBA"
make_artifact "05" "implementation" "Dev-BE/Dev-FE"
make_artifact "06" "threat-model" "Security"
make_artifact "07" "ui-spec" "UI/UX"
make_artifact "08" "test-data" "QA"

# ─── OWNERS.md ───
cat > "$FEATURE_DIR/OWNERS.md" <<EOF
---
artifact_type: feature-owners
feature: ${FEATURE_SLUG}
classification: Internal
linter_min_version: 1.4
applies_adrs: [0001, 0006, 0007, 0010]
---

# ${FEATURE_SLUG} — OWNERS.md

## Per-role assignment

| Role | Human | Stage | Key artifact |
|---|---|---|---|
| PO | | 1 | 00-idea.md |
| BA | | 1 | 01-requirements.md |
| SA | | 2 | 02-design.md, 03-api-contract.md |
| DBA | | 2 | 04-db-schema.md |
| Security | | 2 | 06-threat-model.md |
| UI/UX | | 2-3 | 07-ui-spec.md |
| Dev-BE | | 3 | 05-implementation.md (BE) |
| Dev-FE | | 3 | 05-implementation.md (FE) |
| QA | | 4 | 08-test-data.md |
| DevOps | | 5 | (runbook, deploy) |

## Budget (per FINOPS.md)

- Per-feature budget: \$72 (default)
- Hard cap: \$108 (150%)
EOF

# ─── CLAUDE.md ───
cat > "$FEATURE_DIR/CLAUDE.md" <<EOF
# CLAUDE.md — ${FEATURE_SLUG} feature context

## What this feature is

<1-2 sentences describing the feature>

## Pipeline stage

- Current stage: **TBD** (gates/ check for signoff)
- Feature lead: @TBD

## Artifacts

| # | Artifact | Status | Owner |
|---|---|---|---|
| 00 | idea.md | Draft | PO |
| 01 | requirements.md | Draft | BA |
| 02 | design.md | Draft | SA |
| 03 | api-contract.md | Draft | SA |
| 04 | db-schema.md | Draft | DBA |
| 05 | implementation.md | Draft | Dev |
| 06 | threat-model.md | Draft | Security |
| 07 | ui-spec.md | Draft | UI/UX |
| 08 | test-data.md | Draft | QA |

## Feature-specific constraints

(Things that supersede root CLAUDE.md for this feature)

## Domain glossary (extends docs/CONTEXT.md)

(Feature-specific terms only)
EOF

# ─── MEMORY.md ───
cat > "$FEATURE_DIR/MEMORY.md" <<EOF
# MEMORY.md — ${FEATURE_SLUG} memory snapshot

> Cross-session memory. Append-only; updates require human review.

## Project status (as of ${TODAY})

- Phase: Pre-pipeline
- Feature: ${FEATURE_SLUG}

## Key decisions recorded

| Decision | Rationale | Reference |
|---|---|---|

## Surprises encountered

| Surprise | Captured in | Lesson |
|---|---|---|

## Open follow-ups

| Item | Owner | Status |
|---|---|---|

## Memory index across sessions

| Session ID | Date | Topic | Outcome |
|---|---|---|---|
EOF

# ─── gap-report.md ───
cat > "$FEATURE_DIR/gap-report.md" <<EOF
---
artifact_type: gap-report
feature: ${FEATURE_SLUG}
classification: Internal
linter_min_version: 1.4
applies_adrs: [0018]
---

# Gap Report — ${FEATURE_SLUG}

> Per ADR-0018: proactive gap detection between artifacts. Generated after Stage 2.

## Coverage status

| Rule | Description | Status | Gap |
|---|---|---|---|
| R0240 | Requirements-to-contract | Pending | — |
| R0241 | Contract-to-code | Pending | — |
| R0242 | Test plan coverage | Pending | — |
| R0243 | UI spec coverage | Pending | — |
| R0244 | Test data coverage | Pending | — |
| R0245 | Upstream change propagation | Pending | — |
| R0246 | Orphan detection | Pending | — |

## Gaps found

*(To be filled during Stage 2 review)*
EOF

# ─── .gitkeep for empty subdirs ───
touch "$FEATURE_DIR/decisions/.gitkeep"
touch "$FEATURE_DIR/loop-iterations/.gitkeep"
touch "$FEATURE_DIR/sessions/.gitkeep"

# ─── Print next-steps ───
cat <<EOF

Bootstrapped: $FEATURE_DIR

  ├── 00-idea.md ... 08-test-data.md  (9 artifact skeletons)
  ├── OWNERS.md            (fill humans + budget)
  ├── CLAUDE.md            (feature context for AI agents)
  ├── MEMORY.md            (cross-session memory)
  ├── gap-report.md        (coverage tracking)
  ├── decisions/           (feature-local ADRs)
  ├── loop-iterations/     (agent review iterations)
  └── sessions/            (agent session logs)

Next steps:
  1. Fill OWNERS.md — name humans per role, set budget
  2. PO: author 00-idea.md
  3. BA: parse SRS → 01-requirements.md (Stage 1)
  4. SA + DBA + Security + UI/UX: generate Stage 2 artifacts
  5. Run gap-report.md checks after Stage 2

Pre-flight:
  [ ] Gate signoffs exist in gates/ for completed stages
  [ ] Budget allocated in OWNERS.md (see docs/FINOPS.md)
  [ ] Quality rules enforced via docs/quality-rules/
EOF

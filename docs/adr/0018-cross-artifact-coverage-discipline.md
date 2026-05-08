# ADR-0018: Cross-artifact coverage discipline (BA + QA + UI/UX proactive gap detection)

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** SA (lead), BA, QA, UI/UX, all roles consulted
- **Tags:** workflow, traceability, gap-detection, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

Gen 2 TT.OUT.MANUAL regen exposed a workflow gap. The system caught **per-artifact** completeness violations (R0103 no-TBD, R0220 missing a11y baseline, R0230 forbidden hedges, R1001 cite-or-die) but missed **cross-artifact** gaps:

1. `07-ui-spec.md §3` route map listed `/customers`, `/subscriptions`, `/invoices` as full pages — Frontend agent shipped placeholders. Spec ↔ implementation drifted silently.
2. `07-ui-spec.md §7` data-contracts referenced `GET /v1/customers` (admin search) — backend `02-design.md` API table didn't include this endpoint. Spec ↔ design drifted silently.
3. `01-requirements.md` FR-1.4 ("self-service plan change") had no UI implementation. Requirements ↔ implementation drifted silently.
4. No QA agent verified that every endpoint in design has a test in `04-test-plan.md`. Design ↔ tests drifted silently.

Per ADR-0013, the **per-batch (middle-layer) loop** was supposed to catch these — coordinator reviews ALL artifacts together for cross-cutting consistency. But the demonstration slice didn't actually run the per-batch reviewer; I (the orchestrator) wrote `07-ui-spec.md` independently of the Frontend agent's output. The check existed in design but not in execution.

The fix is twofold:

- **Mandatory automated coverage checks** (linter R0240 family) — machine-enforced; can't be skipped
- **Mandatory proactive role-level reviews** (BA + QA + UI/UX workflow extensions) — humans/agents do gap detection BEFORE Dev implements, not after

## Decision

Adopt **Cross-artifact Coverage Discipline** with three enforcement layers:

### Layer 1 — Linter rule family R0240 (machine-enforced cross-artifact checks)

| Rule      | Check                                                                                                                                                              | Severity |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **R0240** | Every API endpoint in `07-ui-spec.md §7` data-contracts table EXISTS in `02-design.md` API/integration section                                                     | error    |
| **R0241** | Every UI route in `07-ui-spec.md §3` route map has a corresponding E2E test in `04-test-plan.md §UI E2E`                                                           | error    |
| **R0242** | Every Functional Requirement (FR-N) in `01-requirements.md` is referenced by ≥1 test in `04-test-plan.md` traceability matrix                                      | error    |
| **R0243** | Every API endpoint in `02-design.md` API table has ≥1 integration test in `04-test-plan.md §Integration`                                                           | error    |
| **R0244** | Every page in `07-ui-spec.md §3` route map has implementation in code repo (file matches `frontend/src/routes/<page>.tsx` or equivalent) — checked at code-PR time | error    |
| **R0245** | Every component in `07-ui-spec.md §4.2` composites table has implementation file matching `frontend/src/components/tt-out-manual/<Component>.tsx`                  | error    |
| **R0246** | Every endpoint in `02-design.md` API table has implementation route in code (Java: `mux.HandleFunc("METHOD /v1/...", ...)` exists)                                 | error    |

R0240-R0243: doc-only (run on documentation PRs)
R0244-R0246: code-doc bridge (run on code PRs; require declared spec linkage in PR description)

Severity: **error from Phase 0** for R0240-R0243 (doc-doc checks are cheap and unambiguous); **warn → error in Phase 1** for R0244-R0246 (allow time to backfill coverage during MVP).

### Layer 2 — BA proactive design-gap review

BA's workflow extends beyond `Approved01` to a new state:

```
Approved01 → ConsultingDesign → MonitoringDesign → Approved01-Final
```

After SA submits `02-design.md` for review, **BA agent runs `design-gap-review` procedure**:

- Reads `01-requirements.md` (their own output)
- Reads `02-design.md` (SA's draft)
- For each requirement (FR-N), confirms an API endpoint or component exists in design that addresses it
- Output: `02-design.md` review comment listing any uncovered FRs
- If gaps found → SA fixes via inner-loop fix-attempt; ripple through

This makes BA the **first line of cross-artifact defense** for requirements ↔ design coverage.

### Layer 3 — QA pre-implementation gap detection

QA's workflow gains a new state BEFORE `Drafting04`:

```
Reviewing01 → Reviewing02 → Reviewing03 → GapDetection → Drafting04
```

In `GapDetection`, **QA agent runs `pre-implementation-gap-detection` procedure**:

- Reads `01-requirements.md`, `02-design.md`, `03-schema.md`, `07-ui-spec.md` (all available predecessors)
- Cross-checks:
  - Every FR has a target test category
  - Every API endpoint in design has a test slot
  - Every UI page in spec has an E2E test slot
  - Every PII column in schema has a test in security-tests
- Output: `04-test-plan.md` Draft pre-populated with traceability matrix; AND a separate `gap-report.md` listing uncovered items
- If gaps found → respective role-owner fixes upstream artifact; QA's matrix becomes the contract Dev must implement

This makes QA the **second line of defense** before Dev burns cycles on incomplete specs.

### Layer 4 — UI/UX data-contract consistency check

UI/UX's workflow extends to a new check during `Drafting07`:

- After UI/UX drafts `07-ui-spec.md §7` data-contracts table, agent verifies each endpoint exists in `02-design.md` API table
- Mismatches → file `escalations/conflict.md` to SA (request endpoint addition or remove from UI scope)

This is the **third line of defense** — UI doesn't ship a spec referencing endpoints SA hasn't designed.

### Per-batch reviewer (the catch-all)

Per ADR-0013 middle layer: a coordinator agent (`@claude-architect-reviewer` with batch-review prompt) runs after all per-artifact loops converge. It runs R0240-R0243 + manual cross-cut review. If it finds gaps the per-role checks missed, those gaps become **regression cases** — added to the corresponding role's procedure as a checkable item.

## Consequences

### Positive

- **Workflow gap closed**: cross-artifact coverage isn't optional; checked at 4 separate points (BA, UI/UX, QA, per-batch reviewer) plus 7 linter rules
- Dev agents receive **validated specs** — fewer post-hoc fix iterations; less reassignment churn
- Gen 2's specific failures (placeholder pages, missing endpoints) become impossible: R0244 (page implementation) and R0240 (endpoint coverage) catch them mechanically
- Proactive gap detection cheaper than reactive fix (ADR-0009 defense-in-depth principle)

### Negative / Costs

- BA + QA + UI/UX role workloads grow ~10-15% (the extra review states add ~1 day per feature)
- 7 new linter rules require implementation (~1 wk DevOps work)
- Initial false-positive rate on R0240-R0246 will be higher; expect tuning in first month
- More escalation traffic in early adoption (all those gaps that were silent are now loud)

### Neutral

- Per-batch reviewer doesn't disappear — it's still the safety net for novel gap patterns the linter doesn't yet encode
- Some R0240-R0243 false-positives expected when artifacts use synonyms (e.g., "list customers" vs "search customers"); add normalization rules over time

## Alternatives Considered

### A. Per-batch reviewer only (no role-level proactive checks) — Rejected

ADR-0013's middle layer is theoretically sufficient but in practice runs late (after artifact authoring); upstream gaps cause downstream churn. Front-loading the checks at role level reduces churn dramatically.

### B. Linter-only enforcement (no workflow changes) — Rejected

Linter catches the _forms_ of gaps it knows; workflow checks catch _intent_ gaps (a missing endpoint isn't a syntactic violation; the linter doesn't know "GET /v1/customers should exist" without the spec saying so first). Both layers needed.

### C. Skip the discipline — Rejected

Gen 2 shipped a frontend with 75% placeholder pages and the system reported "all green." That's the failure mode this ADR closes.

## Related

- ADR-0001 — Per-feature folder + per-artifact file (the artifacts these checks span)
- ADR-0009 — Defense-in-depth (R-family extended to R0240-R0246)
- ADR-0013 — Agentic loop topology (per-batch reviewer is the catch-all)
- ADR-0014 — UI/UX role (proactive check added to workflow)
- ADR-0015 — Test data first-class (R0242 includes test-data coverage)
- ADR-0016 — UI testing strategy (R0241 + R0244 ensure UI tests cover spec)
- ADR-0017 — Output completeness discipline (per-artifact; this ADR is its cross-artifact counterpart)

## Workflow updates required

### BA (`roles/ba/workflow.md`)

Add states `MonitoringDesign` between `Approved01` and feature deployment. New procedure: `roles/ba/procedures/design-gap-review.md`.

### QA (`roles/qa/workflow.md`)

Add state `GapDetection` between `Reviewing03` and `Drafting04`. New procedure: `roles/qa/procedures/pre-implementation-gap-detection.md`.

### UI/UX (`roles/ui/workflow.md`)

Embed data-contract consistency check inside `Drafting07` state. Update procedure: `roles/ui/procedures/draft-ui-spec.md` (add §"Data contract verification").

### Cross-role workflow (`workflows/agentic-loop.md`)

Add explicit "gap-detection wave" between artifact-authoring waves and Dev-implementation wave.

## Notes for future revision

- **R0240-R0246 false-positive rate** — observe in first 3 features; tune normalization (synonyms, alternate paths)
- **R0244-R0246 timing**: enforced at code-PR time, not doc-PR time. Code repos opt in via CI config; first-time onboarding requires manual coverage backfill. ADR-0005 grandfathering applies.
- **BA/QA workload** — if proactive review takes >15% of role capacity, automate further (additional linter rules)
- **Per-batch reviewer ROI** — track how many gaps it catches that R0240-R0246 missed; if <5% after a year, the linter has caught up and per-batch can downgrade to advisory

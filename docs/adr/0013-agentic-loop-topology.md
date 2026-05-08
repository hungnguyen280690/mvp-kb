# ADR-0013: Agentic loop topology — nested layers with explicit termination

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** SA (lead), DevOps, Security
- **Tags:** agents, loop, convergence, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

ADRs 0001-0012 produce a system where each artifact has a status state machine (`Draft → In Review → Approved`) — already an implicit per-artifact loop. The first TT.OUT.MANUAL MVP run exposed gaps: 3 of 6 agents stalled at the 600s watchdog, requiring manual gap-fill. Naïve "retry on failure" loops without termination guarantees produce **cost runaways** (ADR-0009) and **divergent agents that never converge**.

Three loop scopes exist; using only one fails:

- **Per-artifact only**: cross-cutting issues (schema vs design drift) slip through
- **Per-batch only**: one bad artifact triggers full re-runs (waste)
- **Per-feature only**: agents iterate on already-Approved upstream artifacts trying to fix downstream symptoms

## Decision

Adopt **nested loops at three layers** with an explicit termination contract per layer:

```
Per-feature loop (outer):
  termination: 04-test-plan release-readiness criteria met
  budget:      OWNERS.md monthly_token_cost (per ADR-0012)
  max iters:   3 → human escalation per ADR-0009
  wall clock:  7 days → ADR-0012 graduated approval

  Per-batch loop (middle):
    termination: integration tests + cross-cutting review pass
    budget:      30% of feature budget per batch
    max iters:   2

    Per-artifact loop (inner):
      termination: artifact reviewer reports zero error-severity findings
      budget:      prompt template's estimated_cost_usd × 3
      max iters:   3
      reassignment: per ADR-0013 ladder (companion section below)
```

**Three termination paths every loop must declare:**

1. **Success** — convergence criteria met → exit cleanly
2. **Budget** — cost or iteration cap hit → escalate via `escalations/runaway-prevented.md`
3. **Divergence** — same finding fingerprints recur (Jaccard >50%) → escalate via `escalations/divergence-detected.md` (new 7th escalation enum)

**Divergence detection algorithm (locked):**

```
fingerprint = rule_id + ':' + path_relative_to_feature_folder + ':' + bucketed_line_range_to_10 + ':' + category_enum

prev = set(iter_N_minus_1.findings_fingerprints)
curr = set(iter_N.findings_fingerprints)
jaccard = |prev ∩ curr| / |prev ∪ curr|
diverged = jaccard > 0.50  # tunable; emits warning at 0.30
```

## Consequences

### Positive

- Cost-bounded: every layer has explicit caps; runaway prevented at the layer that detects it.
- Divergence-detectable: the loop knows when to stop, even when the agent thinks it's progressing.
- Reuses existing machinery (status state machine, ripple detection, severity tiers).
- Cross-layer composability: per-artifact convergence feeds per-batch review; per-batch feeds per-feature.

### Negative / Costs

- Bookkeeping overhead at three layers (loop-iteration records per ADR-0013 §Records).
- Divergence threshold (0.50 Jaccard) is heuristic; will need tuning from observed data.
- Wall-clock 7-day cap on outer loop forces decisions that humans might prefer to defer; intentional.

### Neutral

- Aligns with the "selective review" / "risk-based deep review" pattern from ADR-0008 — high-risk artifacts get more iterations; routine ones converge fast.

## Reassignment ladder (companion to topology)

When inner-loop iteration fails, the orchestrator walks a **trigger-specific ladder** (cheap-first):

| Trigger         | 1st action                         | 2nd                    | 3rd                | Hard stop                   |
| --------------- | ---------------------------------- | ---------------------- | ------------------ | --------------------------- |
| Timeout         | Same-agent retry (transient)       | Cross-provider switch  | Premium escalation | Human after 4               |
| Iteration cap   | Cross-provider switch              | Premium + scope-reduce | —                  | Human after 3               |
| Divergence      | Premium escalation OR scope-reduce | —                      | —                  | Human after 2               |
| Cost cap        | NO auto-reassign                   | —                      | —                  | ADR-0012 graduated approval |
| Self-escalation | Per escalation enum routing        | Human                  | —                  | Human always                |

Hard rules:

- Never re-use a path that already failed (anti-loop, extends ADR-0008 Rule 2)
- Each reassignment logged in `loop-reassignment-record.md` per the schema in `templates/collaboration/`
- Cross-provider preferred over premium when both viable (cheaper + uncorrelated)

## Records (audit trail per ADR-0007)

Every loop iteration produces a markdown record under the feature folder:

```
docs/features/<feature>/loop-iterations/
├── iter-001-review-by-<reviewer-handle>.md
├── iter-001-fix-attempt-by-<author-handle>.md
├── iter-002-review-by-<reviewer-handle>.md
├── divergence-check-iter-002-vs-001.md
└── reassignment-iter-002.md   (when applicable)
```

Append-only (per ADR-0004 immutability discipline). Schema defined in `templates/collaboration/loop-iteration-record.md`.

## Health-check protocol (replaces ad-hoc 600s watchdog)

```
Every 60s during agent execution:
  - Heartbeat ping
  - If no heartbeat for 120s: send intervention prompt
  - If no response for 180s: kill agent → trigger timeout reassignment
```

Per-agent timeouts in `agent-roster.md`:

```yaml
<agent-handle>:
  health_check:
    heartbeat_interval_s: 60
    no_progress_kill_s: 300
    intervention_window_s: 180
  retry_budget:
    transient_max: 1
    total_reassignments_max: 3
```

## Quarantine (long-term, links to ADR-0011)

Agent failing ≥5 times in 7-day rolling window across features → DevOps roster-quarantine PR auto-opened (Active → Quarantined per ADR-0011 lifecycle).

## Alternatives Considered

### A. Per-artifact only — Rejected

Cross-cutting issues slip through.

### B. Per-batch only — Rejected

Waste from full-batch re-runs on single artifact failures.

### C. Per-feature only — Rejected

Too coarse; agents iterate on Approved upstream content.

### D. No explicit divergence detection — Rejected

The actual failure mode for naïve loops; without this, "agentic loop" is just "infinite retry."

## Related

- ADR-0006 — A-is-human-only (loop "approval" still requires human; advisory PR comments suffice for inner-loop convergence)
- ADR-0008 — Tiered approval matrix (anti-loop guard extended to reassignment chain)
- ADR-0009 — Defense-in-depth (R1NNN family extended; new R3NNN for loop records)
- ADR-0011 — Hybrid agent identity (quarantine integration)
- ADR-0012 — FinOps governance (budget caps drive termination)
- Cross-role workflow: `workflows/agentic-loop.md`

## Notes for future revision

- **Jaccard threshold** is tunable; observe in first quarter of operation, adjust if false-positive rate >5% or false-negative rate >10%.
- **7-day outer wall-clock** assumes feature-team workdays; adjust for org rhythms (e.g., orgs with 2-week sprints might pick 10).
- **Quarantine threshold (5/7d)** is starting point; tighten if an agent persistently underperforms.

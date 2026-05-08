# ADR-0011: Hybrid agent identity with tiered upgrades and behavioral testing

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** DevOps (lead, owns framework), SA, Security, role-owners (own golden files)
- **Tags:** agents, lifecycle, versioning, drift-detection
- **Supersedes:** —
- **Superseded by:** —

## Context

The base SDLC's actors are humans, who do not have version numbers. Agents do — and they change on a cadence the team does not control. Concrete events the system must handle:

- Anthropic ships Opus 4.8; current `@claude-opus-reviewer` pinned to 4.7
- zAI deprecates GLM-4 in favor of GLM-5; existing GLM-4-authored artifacts need decision
- New specialized subagent proposed (`@claude-opus-incident-investigator`) — what's the gate?
- Agent found to have systematic bias on schema-typing — how to remove without breaking work?
- Provider silently rolls weights without version bump — how do you know?

If ungoverned, three failure modes:

| Failure                  | Consequence                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Silent capability drift  | Workflow that worked Tuesday breaks Thursday; root cause invisible because attribution shows same handle                     |
| Roster churn             | If every version is a new identity, OWNERS.md churns weekly; attribution graphs become noisy                                 |
| Identity continuity loss | If only stable handle is recorded, you cannot reproduce what model authored an artifact 6 months later — auditor's nightmare |

These conflict: continuity vs reproducibility. Both must be supported.

## Decision

Adopt a **two-level hybrid identity model** with **tiered upgrade flows** and **golden-file behavioral testing**.

### Two-level identity

| Level                                          | Lives in                                                                     | Stable across              |
| ---------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| **Logical agent** (`@claude-opus-reviewer`)    | OWNERS.md, RACI, role-cards                                                  | Versions and minor updates |
| **Concrete model version** (`claude-opus-4-7`) | `agent-roster.md`, artifact front-matter at authorship time, commit trailers | Pinned at each invocation  |

Front-matter records both at authorship time:

```yaml
authors:
  agents:
    - handle: claude-opus-reviewer # stable logical identity
      model_at_authorship: claude-opus-4-7 # frozen pin
      model_version_introduced: 2026-04-01
      session_started: 2026-05-07T14:23:00Z
```

Upgrading an agent's version changes only `agent-roster.md`'s `model:` field. OWNERS.md is unaffected. Historical artifacts retain their authorship-time pin. New artifacts get the new pin.

### Four lifecycle flows

**Flow 1 — Onboarding a new agent**

Mirrors human onboarding (shadow → R → A advancement) but no path to A:

1. **Proposal ADR** — capability gap, cost-benefit, provider trust
2. **Sandbox evaluation** (~1 week) — representative workloads + golden-file behavioral tests
3. **Trust ramp** — added as `permitted_C_for_roles:` only; no R yet
4. **Pilot** (~2 weeks) — single feature, single role, deep human review every PR
5. **Promotion to R** — explicit ADR after pilot meets criteria (defect rate, cost, time saved)
6. **General availability** — role-cards updated, agent-roster active

**Flow 2 — Model version upgrade (most frequent)**

Tiered by bump magnitude:

| Bump                                  | Process                                                                                                                       | Timing     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Major** (Opus 4 → 5)                | Full proposal-evaluation-pilot flow as new agent; old remains in parallel for 30+ days                                        | 4-6 weeks  |
| **Minor** (4.7 → 4.8)                 | Behavioral tests must pass + 1-week parallel run + ADR documenting behavioral changes                                         | 1-2 weeks  |
| **Patch / weights** (no version bump) | Detect via fingerprint if possible; treat as silent if undisclosed; behavioral tests must still pass; failures raise incident | Continuous |

Behavioral tests are the gating mechanism. Live in `tools/doc-lint/agent-tests/<handle>/` with:

- `prompts/` — standard test prompts
- `expected/` — output shape (not exact text), substantive correctness criteria
- `tolerance.yml` — similarity thresholds

Run nightly. Cannot pin "exact output" (non-determinism); pin **shape** and **substantive correctness**.

**Flow 3 — Deprecation**

Triggers: cost issue, defect cluster, vendor deprecation, capability obsolescence, security finding.

1. **Quarantine** — `deprecated_at:` set; linter blocks new artifacts using the agent
2. **Impact assessment** — query `model_at_authorship` matches; classify by artifact tier
3. **Backfill matrix:**

   | Artifact classification | Action                                                                |
   | ----------------------- | --------------------------------------------------------------------- |
   | Restricted              | Re-author by replacement (human or new agent); old archived           |
   | Confidential            | Human deep-review; if substantive issue found, re-author              |
   | Internal                | Tag as `deprecated_authorship`; revalidate on next substantive change |
   | Public                  | Grandfather; no action                                                |

4. **Replacement migration** — bot opens fan-out PRs (mechanism from ADR-0003)
5. **Removal** — after migration window (typically 90 days), agent removed from active roster; historical entry kept in `retired/`
6. **Postmortem** — RCA in agent-incident-runbook (ADR-0009)

**Flow 4 — Cross-provider migration**

Special case: switching to a successor on a different provider. Treated as full deprecation + new onboarding. Sandbox specifically tests provider-specific gotchas (auth, attribution format, cost structure). Provider-specific runbook section.

### Capability drift detection

1. **Nightly behavioral tests** (above)
2. **Output fingerprinting** — sample agent outputs daily; track entropy, length, citation rate, hallucination indicators; alert on sudden shift
3. **Cost drift detection** — same prompt should cost similar tokens; big change = possible model swap
4. **Cross-provider triangulation** — same prompt to multiple providers; if one diverges from historical pattern but others are stable, that one drifted
5. **Vendor announcement scraping** — read provider release notes; correlate with detected drift

When drift detected: pause adoption of new artifacts authored by drifted agent; rerun behavioral tests; ADR (accept the drift with documented behavior change, or rollback if vendor allows).

### Roster lifecycle states

```yaml
agents:
  claude-opus-reviewer:
    status: Active # Proposed | Sandbox | Pilot | Active | Quarantined | Deprecated | Retired
    model: claude-opus-4-7
    since: 2026-04-15
    behavioral_tests_passing: 14/14
    next_review: 2026-Q3
```

State transitions are linter-enforced and ADR-tracked.

### Ownership of behavioral tests

- **Framework** (test runner, comparison logic, test definition format): **DevOps** owns
- **Golden files** (specific prompts and expected shapes for each agent + role): **role that uses the agent** owns. e.g. `@claude-opus-reviewer`'s tests for design-review work are Dev/SA-authored; for security-heuristic work are Security-authored.

This distributed ownership matches usage and prevents DevOps from becoming a bottleneck on every agent's golden-file maintenance.

## Consequences

### Positive

- Continuity: OWNERS.md and RACI don't churn on every model update.
- Reproducibility: every historical artifact pins exact model version at authorship; audit-friendly.
- Drift detection catches silent vendor updates before they pollute production.
- Tiered upgrade flow makes minor updates lightweight; major updates rigorous.
- Deprecation has explicit migration path with classification-tier-based effort.
- Distributed test ownership keeps the framework manageable.

### Negative / Costs

- ~3 weeks added: behavioral test framework + initial golden files (~1 wk), lifecycle state machine (~1 wk), drift detection harness (~0.5 wk), deprecation/backfill bot extension (~0.5 wk).
- Ongoing: golden-file maintenance ~1 day/agent/quarter; ADR drafts on each upgrade.
- Behavioral tests cannot pin exact output (non-determinism) — shape-based testing is harder to write and maintain.
- Cross-provider triangulation costs tokens (running same prompt to multiple providers).
- Deprecation backfill on Restricted/Confidential artifacts is expensive (re-authorship); cap it.

### Neutral

- Some upgrades will have no detected behavioral change; flow is fast in those cases.
- Vendor lock-in risk decreases (cross-provider migration is a defined flow, not a panic).

## Alternatives Considered

### A. Lightweight: version-pinned handles only, no behavioral tests, no drift detection — Rejected

Accept silent drift, manual ad-hoc deprecations. Cheaper but quietly rotting; first major drift incident is unmanageable.

### B. Aggressive: every version is a new agent identity — Rejected

Maximum reproducibility, OWNERS.md churn weekly, attribution graphs noisy.

### C. Lazy: don't formalize; vendor manages deprecation — Rejected

Fast and dangerous; vendor schedules don't align with audit needs.

## Related

- **ADR-0005** — Severity-tiered rule lifecycle (linter rule changes follow same pattern)
- **ADR-0006** — A-is-human-only (preserved across version changes)
- **ADR-0007** — Full attribution (the front-matter `model_at_authorship` field this depends on)
- **ADR-0009** — Defense-in-depth (capability drift is one of the failure modes)
- **ADR-0012** — FinOps governance (cost-drift detection feeds into cost dashboard)
- **Design history**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #6

## Notes for future revision

- **Golden-file maintenance** is the unsexy work that sustains the framework. Watch for stale tests after a year; they accumulate without intervention.
- **Vendor announcement scraping** is fragile (provider docs change). Consider subscribing to vendor mailing lists or using their official changelogs as primary signal.
- **Multi-provider triangulation cost** can grow unbounded; bound it to Critical-tier artifact decisions where the protection is worth the spend.
- If a fourth or fifth provider is adopted, ensure the lifecycle state machine and roster format extend cleanly. The current scheme is provider-agnostic by design.

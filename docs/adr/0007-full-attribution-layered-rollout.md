# ADR-0007: Full attribution layered rollout (agent roster + handle convention + front-matter authors + last_human_read + commit trailers + session logs)

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** DevOps (lead), Security, SA, all roles consulted
- **Tags:** agents, attribution, provenance, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

ADR-0006 mandates that artifact A fields resolve only to humans. **The linter cannot enforce that without a structured way to distinguish humans from agents** — and our specific stack adds complexity:

| Surface               | Anthropic Claude Code                 | zAI GLM                             |
| --------------------- | ------------------------------------- | ----------------------------------- |
| GitHub identity       | OAuth bot account possible            | None (API-only)                     |
| Commit attribution    | Native `Co-Authored-By` works         | Must be synthesized by tooling      |
| Token/cost visibility | API exposes usage                     | API exposes usage, different format |
| Multi-model           | Sonnet vs Opus vs Haiku (4.5/4.6/4.7) | GLM-4, GLM-4-Air, GLM-4-Plus        |

Without standardization:

- Cannot enforce A-is-human (linter has no way to tell `@alice` from `@glm-4-air`)
- Cannot trace hallucinations (no model/version/prompt linkage)
- Cannot attribute costs (cost dashboard cannot exist)
- Cannot reason about deprecation (don't know which artifacts an obsolete model authored)
- Cannot honor compliance audits (cannot answer "who actually decided X")

A specific 70/30 failure mode: **rubber-stamping**. At 70% agent throughput humans get review fatigue, approve without reading. The system needs an explicit signal of human engagement that goes beyond merge approval.

## Decision

Adopt **four-layer attribution**, rolled out by phase matching ADR-0005's severity tiers:

### Layer 1 — Agent roster (mirrors team-roster)

`docs-platform/standards/agent-roster.md`:

```yaml
agents:
  claude-opus-reviewer:
    provider: anthropic
    model: claude-opus-4-7
    primary_role: code-review
    capabilities: [architecture, security-heuristic, design-review]
    cost_tier: premium
    permitted_R_for_roles: [Dev, SA]
    permitted_C_for_roles: [DBA, QA, DevOps, Security]
    forbidden_for_roles: [Security-as-R]
    introduced: 2026-05-07
    deprecated: null
```

The linter parses this. Every handle in OWNERS.md, front-matter, or commit trailers must resolve to an entry in `team-roster.md` (kind: employee|contractor|vendor) or `agent-roster.md`. Unknown handle = PR rejected.

### Layer 2 — Stable handle convention

`@<provider>-<model-family>-<role-spec>` — e.g. `@claude-opus-reviewer`, `@claude-sonnet-test-automator`, `@glm-4-air-doc-drafter`.

Version is **not in the handle** (would churn weekly). Version lives in the roster's `model:` field. Historical artifacts pin it via front-matter at authorship time (Layer 3).

### Layer 3 — Front-matter authorship

```yaml
authors:
  humans: [@alice]
  agents:
    - handle: claude-opus-reviewer
      model_at_authorship: claude-opus-4-7
      session_started: 2026-05-07T14:23:00Z
      contribution: drafted-sections [4, 5], reviewed-all
last_human_read: <sha>
last_human_read_by: @alice
```

**`last_human_read` is the most important field** for the 30/70 mix — it pins when a human actually engaged with the content, distinct from when they merged it. The linter flags artifacts where `last_human_read` is older than the latest substantive change (the rubber-stamp detector).

### Layer 4 — Commit trailers + PR description

Git commit trailer:

```
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
Agent-Provider: anthropic
Agent-Handle: claude-opus-reviewer
Agent-Session: <session-id>
Triggered-By: @alice
```

For zAI/GLM (no native GitHub identity), the CLI/wrapper synthesizes the same trailer set with `Agent-Provider: zai`. **`Triggered-By` is always present and always a human handle.**

PR description auto-injection:

```markdown
## Agent Attribution

- Authors: @claude-opus-reviewer, @glm-4-air-doc-drafter
- Triggered by: @alice (human)
- Token cost: ~$0.45 (Opus 50K/15K + GLM-4 30K/8K)
- Session log: docs-confidential/agent-sessions/2026-05-07/<hash>.json
```

### Session logs (two-tier per ADR-0004)

- **Public meta** (`docs-platform/agent-sessions/<date>/<hash>.meta.json`) — provider, model, tokens, duration, role; no prompt content
- **Confidential body** (`docs-confidential/agent-sessions/<date>/<hash>.full.json`) — actual prompt + output; PII/secret risk; retention-policy gated

### Phased rollout

| Layer                      | Phase                | Severity               |
| -------------------------- | -------------------- | ---------------------- |
| Agent roster               | 0                    | Critical               |
| Handle convention          | 0                    | Critical               |
| Front-matter `authors:`    | 0 (warn) → 1 (error) | Important → Critical   |
| `last_human_read`          | 1                    | Critical               |
| Commit trailers            | 1                    | Important              |
| PR description auto-inject | 1                    | Cosmetic               |
| Public meta session logs   | 2                    | Important              |
| Confidential session logs  | 4                    | Critical-if-compliance |

### The linter rule that holds the system together

> _Every artifact's RACI A field MUST resolve to a `kind: employee | contractor` entry in `team-roster.md`. A fields resolving to `agent-roster.md` entries are rejected._

This is the mechanical enforcement of ADR-0006.

## Consequences

### Positive

- Mechanically enforces A-is-human-only.
- Provides full provenance for cost attribution, hallucination tracing, deprecation impact analysis, compliance audits.
- `last_human_read` is the structural defense against rubber-stamping at 70% agent throughput.
- Multi-provider works without special-casing — both Anthropic and zAI flow through the same roster + handle + trailer scheme.
- Stable logical handles in OWNERS.md prevent weekly churn from version updates.

### Negative / Costs

- Front-matter verbosity grows; templates must include the new `authors:` block.
- Session-log storage is non-trivial (especially confidential body); retention/archive policies needed.
- Token-management complexity: machine-account PAT for cross-repo, scoped, audited.
- zAI integration requires custom commit-trailer synthesis (no native GitHub identity).
- Discipline cost: `last_human_read` must be updated honestly; if humans treat it as a checkbox, it becomes meaningless.

### Neutral

- Existing tooling (Claude Code's `Co-Authored-By` trailer) integrates naturally; this layer is an extension, not a replacement.
- The roster grows over time but slowly (an agent every few weeks); manageable.

## Alternatives Considered

### A. Roster + handle + front-matter only (defer trailers and session logs) — Possible Phase 0 stopping point but rejected as final

Gets to ~70% of the value; loses fine-grained git-history attribution and post-hoc audit ability. Acceptable for early phases; insufficient for compliance.

### B. Minimal `Co-Authored-By` only — Rejected

Relies entirely on Claude Code's native attribution; ignores GLM. **Breaks A-is-human-only enforcement** because the linter has no roster to check against.

### C. Don't formalize, trust per-PR review — Rejected

At 70% agent ratio, becomes the mathematical bottleneck (see ADR-0010).

## Related

- **ADR-0001** — Per-feature folder + per-artifact file (artifacts get the new front-matter)
- **ADR-0004** — Two-tier confidentiality (session logs split by tier)
- **ADR-0005** — Severity-tiered rule lifecycle (the new rules adopt the same lifecycle)
- **ADR-0006** — A-is-human-only (the rule this enforces)
- **ADR-0011** — Hybrid agent identity (the model/version pinning that historical attribution depends on)
- **Design history**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #2

## Notes for future revision

- Watch for `last_human_read` rot — humans may flip the field without actually reading. Pair with rubber-stamp time-window heuristic (Attack #3).
- Session log retention (especially confidential body) interacts with compliance scope; tighten retention if HIPAA/PCI is added.
- If a third provider is adopted, ensure the trailer-synthesis pattern and roster format extend cleanly. The current scheme is provider-agnostic by design.

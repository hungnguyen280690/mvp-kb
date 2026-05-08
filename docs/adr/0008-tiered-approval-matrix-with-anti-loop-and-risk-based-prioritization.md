# ADR-0008: Tiered approval matrix with anti-loop guard and risk-based prioritization

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** SA (lead), Security, DevOps, all roles consulted
- **Tags:** agents, review-gates, workflow, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

The base SDLC's review model assumed: PR opens → named human reviewer approves → merge. Adding agents creates four scenarios, only one of which is safe by default:

| Author | Reviewer | Default safety                                                |
| ------ | -------- | ------------------------------------------------------------- |
| Agent  | Human    | ✅ Standard "AI assists, human approves"                      |
| Human  | Agent    | ⚠️ Agent finds bugs but shouldn't substitute for human review |
| Agent  | Agent    | ❌ Catastrophic auto-merge loop                               |
| Human  | Human    | ✅ Pre-existing rule                                          |

GitHub branch protection cannot distinguish these. It just counts approvals — setting "1 approval required" lets two agents form a closed loop and merge unchecked.

A second problem at 30/70: **the math doesn't work**. A senior engineer reviews ~8-12 PRs/day meaningfully. At 70% agent throughput, raw output exceeds review capacity. Either humans rubber-stamp (which `last_human_read` from ADR-0007 detects but doesn't prevent), or PRs queue and throughput collapses to human capacity.

The system needs **selective review**: humans review what matters most, with reduced touch on routine.

## Decision

Adopt a **tiered approval matrix enforced by custom CI check (not GitHub branch protection)**, with anti-loop guard and risk-based review modes.

### Rule 1 — Asymmetric approval substitutability

- A human approval ALWAYS satisfies any approval requirement.
- An agent approval NEVER satisfies a "human approval required" requirement.
- Agent approvals can fail (block PR) but cannot satisfy required-reviewer counts.

Enforced by linter parsing approval-reviewer handles against rosters, NOT by GitHub's native count.

### Rule 2 — Anti-loop guard

- An agent cannot approve a PR it co-authored.
- An agent cannot approve a PR authored by another agent of the same provider+model family (correlated blind spots).
- Cross-provider agent review (Claude reviewing GLM, GLM reviewing Claude) is permitted as advisory; still doesn't satisfy human-required counts.

### Rule 3 — Per-artifact-class approval requirements

| Artifact                                   | Author = Agent                                            | Author = Human                  |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| Public / Internal feature artifact         | 1 human (named role-owner)                                | Existing rule: named human peer |
| Confidential                               | 2 humans (one Security)                                   | 1 human + 1 cross-role          |
| Restricted                                 | NOT PERMITTED as R; agent may only be C                   | 2 humans (Security or DevOps)   |
| ADR (any)                                  | Draft only; promotion needs human SA + 1 human cross-role | SA approval                     |
| Standards / Templates / Linter rules       | Draft only; merge needs human DevOps                      | Existing rule                   |
| `team-roster.md` / `agent-roster.md`       | NOT PERMITTED                                             | 2 humans (DevOps + SA)          |
| Cross-feature fan-out PR (template ripple) | 1 human batch-approval after sample-check                 | Existing rule                   |

### Rule 4 — Risk-based review modes

Three review intensities, assigned by linter at PR open:

1. **Deep review** — full reading + comments + may request changes. Reserved for: ADRs, Confidential/Restricted, schema migrations, security-touching code, anything `applies_adrs`/`applies_policies` cites a critical-tier item.
2. **Sample review** — agent PRs in low-risk classes get deep-reviewed at a sampling rate (start 100% in Phase 1, drop to ~25% by Phase 4). Random selection enforced by linter; recorded in front-matter for audit.
3. **Approve-on-green** — pure mechanical changes (link bumps, SHA pin updates from fan-out bot) auto-approved if all CI checks pass AND change matches a known-safe diff pattern. Logged but not deeply reviewed.

The review-mode assignment is recorded in front-matter so audits show what intensity each merge received.

### Rule 5 — Velocity caps as circuit breakers

In agent-roster:

```yaml
glm-4-air-doc-drafter:
  rate_limit:
    max_open_prs: 5
    max_daily_merges: 20
    cool_down_after_human_block: 30min
```

Linter enforces; prevents flood (intentional or hallucinatory).

### Rule 6 — Cross-provider advisory routine

Always have an opposite-provider agent give advisory review on agent-authored PRs before requesting human review. Advisory PR comments accelerate human review and catch cross-provider-uncorrelated errors cheaply.

## Consequences

### Positive

- 30/70 ratio becomes mathematically viable — humans review what matters; routine is sample/auto-approved.
- Auto-merge ouroboros eliminated by anti-loop guard.
- Critical artifacts (ADRs, Confidential/Restricted) get extra-strict review automatically.
- Cross-provider advisory provides cheap pre-review; humans get pre-vetted PRs.
- Audit trail records review intensity, not just approval.

### Negative / Costs

- Custom CI check is non-trivial (parse approvers, validate against rosters, gate merge); ~1.5-2 weeks build.
- Sampling rate is a tunable that requires observed-data calibration; wrong rate burns capacity or creates blind spots.
- Cross-provider advisory adds tokens to every agent PR; budget impact (mitigated by cheap-model routing).
- Approve-on-green mode is risk-tolerance call; conservative orgs may reject it.
- Reviewers may resent randomized deep-review assignment ("why is THIS routine PR my deep review?"); cultural framing needed.

### Neutral

- The matrix is per-artifact-class, not per-PR-touched-files; some PRs touch multiple classes — linter takes the strictest.
- Rate limits are per-agent in roster; can be tightened or relaxed without rule changes.

## Alternatives Considered

### A. Simple any-human approval suffices, agent approvals advisory only — Rejected

Works at low agent throughput (≤10 PRs/day per human). Math fails at 30/70.

### B. Strict two-human rule for everything — Rejected

Safest. Mathematically incompatible with 30/70 unless team is large.

### C. GitHub-default — any approver counts, no agent/human distinction — Rejected with strong warning

Allows agent auto-merge loops. Fundamentally unsafe.

### D. Skip sampling, deep-review all — Rejected

At 30/70, this is the rubber-stamp trap dressed up as discipline. Fails on first sprint pressure.

## Related

- **ADR-0001** — Per-feature folder + per-artifact file (artifacts being approved)
- **ADR-0004** — Two-tier confidentiality (Confidential/Restricted classes drive matrix rows)
- **ADR-0005** — Severity-tiered rule lifecycle (matrix rules live in linter)
- **ADR-0006** — A-is-human-only (the rule this matrix mechanically enforces)
- **ADR-0007** — Full attribution (handle resolution depends on rosters)
- **ADR-0010** — Human role design (review work is one of the human work classes)
- **Design history**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #3

## Notes for future revision

- **Sampling rate** is the most important tunable. Start at 100% in Phase 1; observe defect rate; drop in steps to ~25% by Phase 4. Tune per artifact class, not globally.
- **Cross-provider advisory cost**: budget for it. GLM-4-Air pre-checking Opus output is cheap; Opus checking GLM is more expensive but justifies on Critical artifacts.
- **Review-mode escalation**: a deep reviewer who finds substantive issues should be empowered to flag the artifact for permanent deep-review status (escape sampling). Linter respects this flag.
- **Approve-on-green diff patterns**: maintain a curated list. New patterns require human approval to be added (meta-rule).
- **At lower agent ratios** (e.g. 60/40 or 70/30), this matrix is overkill — relax to (a) of the alternatives. Only use full matrix at high agent ratios where math demands it.

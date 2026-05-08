# ADR-0006: Per-role agent specialization with A-is-human-only

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** SA (lead), Security, DevOps, all roles consulted
- **Tags:** agents, roles, accountability, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

The base SDLC system (ADRs 0001-0005) assumed all actors are humans. We are adopting a mixed human/AI agent workforce at approximately 30% humans / 70% AI agents, using Claude Code (Anthropic Sonnet/Opus subagents) and zAI GLM models.

Four ways to integrate agents into the role taxonomy:

1. **Tools wielded by humans** — no separate agent identity; commits attributed to triggering human. **Loses provenance** at 70% agent throughput; audit chain becomes meaningless ("Alice approved 40 PRs this sprint" while really agents authored most).
2. **Co-actors with equal RACI** — agents can be Accountable. **Breaks audit chain** for SOC2/HIPAA/PCI/GDPR; agents can't defend decisions in postmortems, can't carry on-call, can't sign legal commitments.
3. **A new 9th "Agent" role** — too coarse. A security-audit agent and a code-review agent have radically different capabilities; conflating them defeats the purpose of role-based ownership.
4. **Per-role agent specialization** — each existing role can be filled by humans, agents, or both. Agents fill R or C slots; A is always human. **Maps to how Claude Code subagents actually work** (code-reviewer, debugger, test-automator, security-auditor as distinct specializations).

## Decision

Adopt **per-role agent specialization** with the hard rule: **agents may be Responsible (R) or Consulted (C); never Accountable (A).**

Each of the 8 existing roles (PO, BA, SA, DBA, Dev, QA, DevOps, Security) has separate `humans:` and `agents:` slots in `OWNERS.md`:

```yaml
dev:
  humans: [@alice]
  agents: [@claude-code-opus, @claude-code-sonnet, @glm-4-air]
dba:
  humans: [@bob]
  agents: [@claude-code-opus]
security:
  humans: [@dave]
  agents: []                    # explicit: no agent autonomy on security R-work
```

The RACI table from ADR-0001 is **unchanged**. Only the names filling R/C slots in `OWNERS.md` may include agents. **A column resolves only to humans from `team-roster.md`.**

The linter enforces: every artifact's A field MUST resolve to a `kind: employee | contractor` entry in `team-roster.md`. A fields resolving to `agent-roster.md` entries are rejected.

### Why "A is human only" is non-negotiable

1. **Audit compliance**: SOC2/HIPAA/PCI/GDPR require named human accountability for in-scope decisions.
2. **Postmortem semantics**: agents lack memory of why they made a choice; cannot defend it in a blameless review.
3. **Legal authority**: contractual commitments, vendor decisions, retention policies need a named human.
4. **On-call carry**: A is the person paged at 3 AM. Agents do not carry pagers.

## Consequences

### Positive

- **Extends ADR-0001 minimally** — no change to artifact structure, RACI table, or feature folder layout. Only OWNERS.md content expands.
- **Real provenance** at 70% agent throughput — every artifact's authorship is unambiguous.
- **Audit chain preserved** — every decision traces to a named human Accountable.
- **Maps to existing tooling** — Claude Code subagent model fits per-role specialization naturally.
- **Multi-provider supported** — different providers' agents are different roster entries with their own capability profiles.

### Negative / Costs

- **OWNERS.md verbosity grows** — each role has two sub-lists (humans, agents).
- **Linter must distinguish handle types** — requires agent-roster + team-roster as parallel sources of truth (covered in ADR-0007).
- **Cultural adjustment** — teams accustomed to "any senior approves" must adopt strict human-A-required posture.
- **Capability differentiation between agents** — within a role, three different agents (Opus/Sonnet/GLM) have different trust levels; the roster must encode this.

### Neutral

- Some roles may have **no agents** (Security has agents=[] in the example above). This is a deliberate per-role calibration, not an omission.
- The RACI table stays portable to all-human teams — adopting agents later requires only OWNERS.md updates.

## Alternatives Considered

### A. Agents as tools, no separate identity — Rejected

Loses provenance; cost attribution invisible; deceptive accounting at 70% agent ratio.

### B. Agents as co-actors with equal RACI (agents can be A) — Rejected

Breaks audit chain. Compliance non-starter for any regulated org.

### C. New 9th "Agent" role — Rejected

Conflates radically different agent capabilities under one role; RACI by role becomes uninformative.

## Related

- **ADR-0001** — Per-feature folder + per-artifact file (the artifact structure this ADR fills)
- **ADR-0007** — Full attribution layered rollout (the mechanism that enforces A-is-human-only)
- **ADR-0008** — Tiered approval matrix (review gates that respect the role distinction)
- **ADR-0010** — Human role design (what humans actually do at 30/70)
- **Design history**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #1

## Notes for future revision

- If agent capabilities advance to where audit/compliance frameworks recognize agent accountability (legally, this is unlikely in current frameworks), revisit. Until then, A-is-human-only is a hard rule.
- The per-role `humans:`/`agents:` split assumes both can exist for any role. Some roles may permanently exclude agents (e.g. Security R-work). Capture exclusions in the agent-roster's `forbidden_for_roles:` field, not by omitting from OWNERS.md.
- If the team grows or shrinks, ratio targets per role (ADR-0010) tune around this rule. The rule itself does not change.

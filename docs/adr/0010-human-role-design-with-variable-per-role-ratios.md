# ADR-0010: Human role design with variable per-role ratios and structural defenses

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** SA + Engineering Manager (lead), DevOps, HR/leadership consulted
- **Tags:** agents, organization, human-role, sustainability
- **Supersedes:** —
- **Superseded by:** —

## Context

ADRs 0006-0009 build mechanism (roles, attribution, gates, defenses) but do not define **what humans actually do** at 30/70 ratio. The default assumption is "humans do whatever agents don't" — the residual-role trap, with predictable failure modes:

| Failure                 | Symptom                                                                                    | Timeline    |
| ----------------------- | ------------------------------------------------------------------------------------------ | ----------- |
| Rubber-stamping         | PRs approved 2 minutes after open; `last_human_read` recent but humans visibly didn't read | Weeks       |
| Skill atrophy           | Humans haven't authored from scratch in months; junior pipeline broken                     | Months      |
| Morale collapse         | "I'm just a janitor for AI output"; voluntary turnover spikes                              | 6-12 months |
| Knowledge fragmentation | Agent makes decisions, human rubber-stamps; nobody understands the system                  | Months      |
| Hiring crisis           | "Senior engineer who reviews AI code" is a hard pitch                                      | Continuous  |
| Bus-factor collapse     | Only one human can intervene when an agent fails; that human leaves                        | Variable    |

Without explicit role design, **70% agent throughput hollows the human role into gatekeeping**. Gatekeeping doesn't sustain a career, doesn't build expertise, doesn't onboard juniors. The system survives Phase 1-2 on novelty energy and collapses in Phase 4 when the first senior leaves.

A blanket 30/70 across all roles is also wrong — different roles have different judgment-density and risk profiles. Security and PO need higher human ratios than QA or routine Dev work.

This decision requires **management buy-in beyond DevOps**: career ladder updates, hiring profile changes, quarterly calibration cadence are HR/leadership decisions.

## Decision

Adopt **explicit human role design** with five components:

### 1. Five work classes humans must perform

| Work class                | Description                                                                           | Cannot be agent-substituted because                    |
| ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Direction**             | Defining what to build, business goals, prioritization, scope                         | Agents lack stakeholder context                        |
| **Critical judgment**     | A-RACI decisions: ADRs, supersession, trade-off resolution, risk acceptance           | A-is-human-only (ADR-0006); legal/compliance authority |
| **Integration**           | Cross-system reasoning; spotting feature-folder boundary interactions                 | Agents work in narrow contexts                         |
| **Unblocking + recovery** | Agent-failure resolution, ambiguity escalation, novel situations, incident response   | By definition: where agents have failed                |
| **Calibration**           | Tuning prompts, role-cards, agent rosters; defining quality standards; auditing drift | Agents can't tune themselves trustworthily             |

### 2. Per-role variable ratio targets

In `docs-platform/standards/role-ratio-targets.md`:

| Role               | Target ratio (human/agent) | Reason                                                        |
| ------------------ | -------------------------- | ------------------------------------------------------------- |
| PO                 | 90/10                      | Strategy, stakeholder relationships                           |
| BA                 | 60/40                      | Elicitation human; structuring agent-good                     |
| Solution Architect | 60/40                      | Decisions human; routine analysis agent                       |
| DBA                | 40/60                      | Patterns agent-good; constraints human-verified               |
| Dev                | 30/70                      | Default — patterns agents handle                              |
| QA                 | 25/75                      | Stubs, regression coverage agent-good; exploratory human      |
| DevOps             | 50/50                      | Decisions human; routine config agent                         |
| Security           | 70/30                      | Threat models, policy decisions human; routine scanning agent |

Reviewed quarterly by SA + Tech Lead + DevOps. Adjustments are ADR-tracked.

### 3. Per-role contract in role-cards

Role-cards (from base SDLC's onboarding) get explicit human-work / agent-work / hybrid sections:

```yaml
# docs-platform/onboarding/dev.md
role: Dev
human_responsibilities:
  - All A-RACI decisions
  - Cross-feature integration design
  - Critical bug investigation (production incidents)
  - Code review of Confidential/Restricted-tier changes
  - Author at least 1 substantive feature artifact per quarter (skill maintenance)
  - Mentor agent: weekly review of agent output quality
agent_responsibilities:
  - Initial drafting of routine code/test/doc artifacts
  - Mechanical updates (link bumps, SHA refresh, format fixes)
  - First-pass code review
  - Test stub generation
hybrid:
  - Refactors: human direction, agent execution, human verification
  - Schema migrations: agent drafts, human owns A
target_ratio: 30/70
```

### 4. Structural defenses

**Anti-rubber-stamp:**

- Linter metric: time-from-PR-open to approval. Approvals <30s on Critical-tier flagged.
- Quarterly **deep-dive cycle**: every Critical-tier artifact gets substantive human re-read, tracked as `last_human_deep_review`.

**Anti-skill-atrophy:**

- **Authorship rotation rule**: every human authors ≥1 substantive artifact/quarter without agent assistance.
- Protected human-only time slot (cultural mechanism, not linter).

**Anti-morale-collapse:**

- Career ladder explicitly recognizes "AI orchestration", "quality engineering", "system architect" as senior tracks.
- Promotion criteria include: agent calibration, role-card contributions, incident-response leadership, integration work.

**Anti-knowledge-fragmentation:**

- **Bus-factor metric**: per-artifact, count of humans with `last_human_deep_review` within 90 days. Alert at <2.
- Confidential/Restricted artifacts require ≥2 humans with deep-review history.

**Anti-hiring-crisis:**

- Job descriptions explicitly describe the human role at 30/70.
- **Junior pathway**: sandbox features authored end-to-end without agent assistance for first 6-12 months.
- Senior pathway: judgment work, system thinking, agent calibration explicitly recognized.

**Anti-bus-factor-collapse:**

- Same as knowledge-fragmentation defense + quarterly rotation across feature folders.

### 5. Governed metrics + quarterly review

```yaml
# docs-platform/standards/role-ratio-targets.md
roles:
  Dev:
    target_ratio: 30/70
    measurement: artifacts_with_human_R / total_artifacts
    review_cadence: quarterly
    last_calibrated: 2026-Q2
    next_review: 2026-Q3
    trajectory: stable # stable | drifting-up | drifting-down
    health_signals:
      rubber_stamp_rate: 4% # target <10%
      bus_factor_avg: 2.3 # target ≥2
      junior_authorship_share: 12% # target ≥10%
      voluntary_turnover_q: 2
```

Quarterly review reads these signals; trajectory + adjustments captured as ADR.

## Consequences

### Positive

- Sustainable 30/70 — human role has substance, not just gatekeeping.
- Career ladder and junior pathway preserved; team can grow and onboard.
- Per-role variable ratios match risk and judgment-density; not a forced uniform standard.
- Failure modes (rubber-stamp, atrophy, fragmentation) have explicit detection + remediation.
- Quarterly governance creates a feedback loop; ratio is a target, not a destination.

### Negative / Costs

- Requires HR/leadership engagement, not just engineering team buy-in.
- Career ladder updates and hiring profile changes are slow organizational work.
- Junior pathway (sandbox features without agents) costs throughput; explicit allocation needed.
- Mentor allocation (humans reviewing agent output quality) competes with feature work.
- Quarterly calibration meetings consume senior time.
- ~3 weeks added to platform work (role-card rewrites, ratio governance, linter metrics) + cultural work continues forever.

### Neutral

- Some roles may be permanently outside agent reach (e.g. PO at 90/10); this is fine.
- The ratio is a target, not a measurement of success. Drift detection matters more than hitting an exact number.

## Alternatives Considered

### A. Variable ratio per role only — Rejected

Let teams calibrate; skip skill maintenance and bus-factor enforcement. Cheaper but relies on individual managers catching failure modes; doesn't scale.

### B. Accept hollowing — Rejected (unless explicitly chosen as strategy)

Hire for orchestration, accept skill drift, treat 30/70 as transition state. Honest if explicitly chosen; commit to it via ADR if so.

### C. Don't formalize — Rejected

Ratio emerges, role evolves organically. Highest risk of failure modes hitting full force; worst sustainability.

## Related

- **ADR-0001** — Per-feature folder + per-artifact file (where humans contribute as authors)
- **ADR-0006** — A-is-human-only (the structural reason humans cannot be eliminated)
- **ADR-0007** — `last_human_read` + `last_human_deep_review` (mechanism for tracking engagement)
- **ADR-0008** — Tiered approval matrix (where human review work happens)
- **Design history**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #5

## Notes for future revision

- **30/70 may not be steady state**. Three trajectories possible: stabilizes at 30/70 with discipline; drifts to 10/90 as agents improve; reverts to 70/30 due to burnout or novel-problem failures. Build the metrics to detect trajectory; revisit ratio targets quarterly.
- **Junior pathway** is the most fragile component. Without it, the role becomes pure-senior and the org cannot grow. Allocate explicitly.
- **Career ladder** updates require HR partnership; without it, "AI orchestration engineer" is a vague title that doesn't translate to compensation bands.
- Watch the `voluntary_turnover_q` signal early — it's the leading indicator of morale collapse.

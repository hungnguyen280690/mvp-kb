# ADR-0005: Severity-tiered rule lifecycle with dated waivers and backfill program

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** DevOps (lead, owns linter), Security, SA, all roles consulted
- **Tags:** linter, governance, infrastructure
- **Supersedes:** —
- **Superseded by:** —

## Context

The custom doc-linter (committed in design-grill Attack #5) enforces ~20+ rules across file presence, front-matter schema, predecessor approval, ripple/staleness, cross-repo SHA pinning, ADR/policy/standard linkage, roster validation, classification, and CODEOWNERS sanity.

**These rules will change over time**: incidents add rules, compliance changes tighten rules, new roles add checks, deprecated patterns get removed. Three pure approaches all break:

- **Force migration always**: every PR must bring its feature folder up to current rule set. A typo PR gets blocked because someone added a `06-threat-model.md` requirement last week. **Sprint chaos.**
- **Grandfather always**: rules apply only to features created after rule introduction. Two-tier docs forever. Old features rot. Dashboard becomes a graveyard. "No missing" becomes "no missing for features started after Q3."
- **Per-feature linter version pin**: each feature pins to a linter version; only those rules apply. Reproducible but exponential maintenance — N versions of the linter forever, stale-rule rot invisible.

We need rule evolution without sprint paralysis or two-tier rot, plus a structured way to handle exceptions (a feature legitimately can't comply due to legacy code or emergency).

## Decision

Adopt **severity-tiered rule lifecycle with dated waivers and a tracked backfill program**.

### Every rule carries lifecycle metadata

```yaml
# tools/doc-lint/rules/r0042-threat-model-required.yml
id: R0042
title: All features must have a threat-model artifact
severity: error # error | warning | info
introduced: 2026-Q3
applies_to: all # all | new-features-only | architecturally-significant
enforce_after: 2026-09-01 # before this date: warn; after: error
bypass: requires-waiver # requires-waiver | not-allowed
backport: needed # needed | not-needed
owner: Security
```

### Severity tiers govern handling

- **Critical (security/compliance)** — force migration immediately. Bot fan-out PRs to update all affected features. **No grandfathering.** Examples: PII handling, classification labels, signed-commit on `Restricted` artifacts.
- **Important** — soft migration: warn for N weeks (default 6), then error. Examples: new required artifact (`07-observability.md`), new front-matter field.
- **Cosmetic / advisory** — info-level, never blocks. Examples: preferred section ordering, cross-link style.

### Waivers are explicit, dated, approved

```yaml
# OWNERS.md or feature front-matter
linter_waivers:
  - rule: R0042
    reason: "Pre-existing feature, threat model planned for 2026-Q4"
    expires: 2026-12-31
    approved_by: @security-lead     # required reviewer enforced by linter itself
```

The linter validates: waiver has `reason`, has `expires` (date), has `approved_by` from the rule's owner role. Expired waivers become errors automatically.

### Backfill is a tracked program

When a critical rule is added, the linter auto-generates a **backfill issue** listing every non-compliant feature folder across all repos. The bot generates per-repo PRs proposing fixes. The rule's owner role is **Accountable** for closing the backfill within a stated timeframe.

### Linter version pinned per repo, not per feature

Each code repo has `mass-doc-lint@x.y.z` pin in CI config. Per-feature pinning would let one feature drift forever — kills "no missing." Repo-level pinning lets teams adopt rule changes on their cadence. Renovate-style PRs propose linter upgrades.

### Rule deprecation cycle

Rules don't just get added. Removed rules must:

- Have **no waivers depending on them** (linter checks)
- Have a **deprecation period** (3 months minimum) — warns "deprecated, will be removed in version X"
- Be **announced** in `docs-platform/standards/linter-changelog.md`

### The linter has its own SDLC

Rule additions are PRs against `tools/doc-lint/`. Each rule has unit tests (golden-file: input → expected error). The linter is versioned with semver, has its own changelog, and follows the same PR review rules as production code. **DevOps role owns the linter as production code, with explicit time allocation.**

Per-rule RACI:

- Security rules: **R**=Security, **A**=Security, **C**=DevOps + SA
- Schema rules: **R**=DBA, **A**=DBA, **C**=DevOps + SA
- General process rules: **R**=anyone, **A**=SA, **C**=DevOps + role owners

## Consequences

### Positive

- **Avoids two-tier rot**: critical rules apply to everything; old features get backfilled.
- **Avoids sprint paralysis**: important rules soft-migrate; cosmetic rules don't block.
- **Waivers visible and time-bounded**: no `// TODO ignore` rot. The linter itself flags expired waivers.
- **Predictable rule rollout**: announced, dated, owned. Teams plan around `enforce_after`.
- **Linter as code**: tests, semver, changelog, ownership. Treats it like the production system it is.

### Negative / Costs

- **Rule metadata is overhead**: writing a new rule costs more than just adding a check function. Templates and tooling can mitigate.
- **Backfill program needs ownership**: critical-rule additions create work for the rule's owner role. **Cannot add critical rules without staffing the backfill.**
- **Linter testing discipline**: every rule needs tests. Without this, rule changes break builds across all repos. ~20% of rule-development time is test-writing.
- **Waiver creep**: under deadline pressure, waivers get over-issued. Periodic waiver audit (quarterly, by Security/DevOps) is required.
- **DevOps capacity**: ongoing 10-15% team capacity for linter maintenance, rule additions, fan-out PRs. **Without explicit time allocation, this collapses within months.**

### Neutral

- **Linter version skew across repos** is normal. Repos upgrade on their cadence; central tracking dashboard shows version distribution.
- **Rule debate is healthy**: rule additions go through PR review like any other code. Disagreements force explicit decisions about scope.

## Alternatives Considered

### A. Force migration always — Rejected for general use

Cleanest state, painful in practice. Reasonable for very small teams (<5 people) or strict-compliance orgs that can absorb the friction. We expect typical teams of 8+ roles to reject this within the first month.

### B. Grandfather always (only new features get new rules) — Rejected

Easiest, cheapest. Permanent two-tier-docs cost. Old features become legacy artifacts; dashboard splits into "covered" and "uncovered." Acceptable if you explicitly drop the strict "no missing" claim — name it for what it is.

### C. Per-feature linter version pinning — Rejected

Maximum flexibility, exponential maintenance. N versions of the linter live forever; old versions accumulate technical debt. "Stale rules" rot invisible because each feature is "compliant for its version." Hard pass.

### D. No rule lifecycle, manual rollout — Rejected (this is the trap)

What teams default to without explicit design. Rules added ad-hoc, no `enforce_after`, no waivers. Trust collapses on the first surprise PR rejection. **Avoid by design.**

## Related

- **ADR-0001** — Per-feature folder structure (the rules enforce this)
- **ADR-0002** — Doc-as-source-of-truth (the rules enforce front-matter as authoritative)
- **ADR-0003** — Multi-repo hybrid (linter is published from `docs-platform`)
- **ADR-0004** — Two-tier confidentiality (classification rules are critical-tier)
- **Design history**: [`design/2026-05-07-sdlc-system-grill.md`](../design/2026-05-07-sdlc-system-grill.md), Attack #11

## Notes for future revision

- **First six months**: expect to discover rules you didn't anticipate. Add them as `important` (soft migration), watch the warning-rate on real PRs, decide whether to promote to `error` or relax to `info` based on signal.
- **Waiver audit**: at least quarterly. If >10% of features have active waivers for the same rule, the rule may be too aggressive — re-evaluate.
- **Linter performance**: cross-repo SHA fetches are slow. Cache aggressively. Linter runtime on a typical PR should stay <2 minutes; if it exceeds 5 minutes, teams will start adding `[skip ci]` workarounds.
- **Helpful errors**: every rule's error message must include rule ID, one-sentence why, exact fix instructions, and a link to the example in `docs/templates/`. **This is non-optional** — without it, the linter becomes an obstacle, not a teacher.

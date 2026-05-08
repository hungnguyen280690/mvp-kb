# ADR-0004: Two-tier confidentiality (`docs-platform` + `docs-confidential`) with classification front-matter

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** Security (lead), DevOps, SA, all roles consulted
- **Tags:** security, compliance, repo-topology
- **Supersedes:** —
- **Superseded by:** —

## Context

The doc system designed in ADR-0001 / ADR-0002 / ADR-0003 assumes everyone with repo access reads everything. That model collides with content classes that **cannot be openly shared**:

- **Threat models** — map of how to attack us
- **Compliance evidence** — SOC2/HIPAA/PCI/GDPR attestations, control mappings, audit-trail extracts
- **Security incident playbooks** — runbooks naming exploit details, kill-switches
- **Customer/PII references** — PII columns named in schema docs, example queries with realistic shapes
- **Vendor terms / pricing** — contract confidentiality
- **Pre-announcement strategy** — embargo'd roadmap
- **Internal IP / trade secrets**

GitHub does not support **per-file access control** within a repo. The only access boundary is **repo-level**. Therefore: any content that needs different visibility classes lives in **different repos**.

Compliance content additionally needs:

- **Chain of custody** — signed commits, hard-required CODEOWNERS
- **Immutability** — append-only, no force-push, tag-based releases
- **Retention** — documented retention periods, automated archive vs delete
- **Audit trail** — every change linked to a ticket with reason

These requirements are stricter than ordinary documentation and don't fit a casual ADR repo.

## Decision

Adopt **two-tier confidentiality** with **classification front-matter** on every artifact:

**Tier 1 — `docs-platform`** (org-readable, the central repo from ADR-0003)

- CONTEXT, public-safe ADRs, standards, templates, dashboard, linter source
- Default classification: `Internal`
- Some content may be `Public` (e.g. an OSS project's published architecture overview)

**Tier 2 — `docs-confidential`** (locked-down, Security-owned)

- Threat models, compliance evidence, restricted policies, security playbooks
- Default classification: `Confidential` or `Restricted`
- Signed commits required; CODEOWNERS hard-required for any merge
- Append-only branches; tag-based releases; documented retention metadata

**Classification front-matter** on every artifact across all repos:

```yaml
classification: Public | Internal | Confidential | Restricted
```

**Stub-and-link pattern** for confidential content referenced from open repos:

- A feature's `06-threat-model.md` in the code repo is a **stub** with `classification: Internal` containing only `see internal/threat-models/2026-05-feature.md` and a link to `docs-confidential`.
- The actual threat model lives in `docs-confidential/threat-models/`.
- The linter cross-fetches `docs-confidential` using a **machine-account token** to validate the stub target exists and isn't stale — **without rendering content** in the open repo.

**Linter rules enforced:**

- `Public` files cannot embed PII patterns (regex-based heuristic + manual review).
- `Restricted` files require signed-commit + retention metadata.
- A feature folder cannot have a `Confidential`/`Restricted` artifact directly (must use stub-and-link to `docs-confidential`).
- Cross-repo links from `Internal` files to `docs-confidential` paths are allowed only as stubs (link, no quoted content).

**Ownership:** Security role **owns** `docs-confidential` (with co-ownership from DevOps for tooling). This finally gives Security a place they're accountable for, not just a reviewer slot.

## Consequences

### Positive

- **Real security boundary** at the repo level — leakage of `docs-confidential` requires explicit access grant, not accidental over-share.
- **Compliance posture preserved** — chain of custody, immutability, retention all attainable in `docs-confidential` without polluting `docs-platform`.
- **Security has explicit ownership** of an artifact home, not just review duties.
- **Auditors can be granted scoped access** to `docs-confidential` only.
- **Stubs maintain doc graph integrity** — feature folders still have a `06-threat-model.md`; "no missing" enforceable.
- **Classification front-matter** is useful even within a tier — labels content for human readers and supports future migrations.

### Negative / Costs

- **One additional repo and access matrix** to maintain.
- **Linter complexity increases**: secret-token handling, classification rules, stub-target validation, cross-repo fetch.
- **Compliance overhead is real**: signed commits, retention automation, audit-trail discipline. Small teams must decide if compliance is in scope before adopting this overhead (it is for SOC2/HIPAA/PCI/GDPR scope; not otherwise).
- **Stub files in open repos are a known leak surface** — they reveal that a threat model exists for feature X. Acceptable for most cases; for highly-classified work, the stub itself must be omitted (and the linter rule for "every feature has a 06-threat-model.md" relaxed via waiver).
- **Token management**: machine-account PAT for cross-repo fetch must be rotated, scoped to read-only, audit-logged.
- **Cannot reuse single-repo tooling**: search, grep, dashboards must all handle two tiers.

### Neutral

- **Public-mirror option**: `docs-platform` content classified `Public` can be exported to a public-facing static site via filtered-publish workflow. Useful for OSS or external partners; deferred until needed.
- **Three-tier escalation** (adding a fourth `Restricted-Plus` repo for top-secret content) is possible if scope grows. Don't pre-build it.

## Alternatives Considered

### A. Single private repo for everything — Rejected for general use

Works for small private orgs where everyone with repo access is cleared for everything. Ignores least-privilege. Acceptable if your org is small and internal-only; otherwise insufficient.

### B. Single repo + classification front-matter only (no access split) — Rejected

Labels content but cannot enforce visibility. Useful as a labeling discipline (and we adopted it within each tier), but **not a security control on its own**. Org-wide repo readers still see everything.

### C. Confidential content not in markdown at all (SaaS GRC tools / IriusRisk for threat models / Vanta for compliance) — Considered

Loses single-source-of-truth and offloads compliance machinery to a vendor. Reasonable for orgs that already use such tools; defer to existing investment if it exists. Otherwise, two-tier markdown is more cohesive.

### D. External secret store (Vault, GCP Secret Manager) for sensitive content — Rejected for living docs

Good for short secrets and rotating credentials. **Awful for living documents** — vaults aren't markdown editors and don't merge.

## Related

- **ADR-0001** — Per-feature folder structure (artifact `06-threat-model.md` is the stub-link surface)
- **ADR-0003** — Multi-repo hybrid (`docs-confidential` is the third repo in the topology)
- **ADR-0005** — Linter rule lifecycle (classification rules and waiver mechanism enforce this)
- **Design history**: [`design/2026-05-07-sdlc-system-grill.md`](../design/2026-05-07-sdlc-system-grill.md), Attack #10

## Notes for future revision

- **OSS / external contributors**: if the project is OSS, the public mirror of `docs-platform` becomes the contributor-facing surface. The `Internal`-classified content stays in the original repo, available only to org members. Plan this BEFORE going OSS, not after.
- **Compliance scope changes**: if HIPAA/PCI/GDPR scope is added later, retention and signed-commit rules in `docs-confidential` may need to tighten. Capture as a new ADR superseding the relevant policies.
- **Stub leak audits**: periodically (quarterly) the Security role audits whether stub filenames in open repos reveal too much. For features with extreme sensitivity, the stub itself is replaced with `00-internal-only.md` placeholder.

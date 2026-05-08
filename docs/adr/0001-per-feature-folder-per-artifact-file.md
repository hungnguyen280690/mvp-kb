# ADR-0001: Per-feature folder + per-artifact file structure

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** SA (lead), DevOps, all roles consulted
- **Tags:** doc-architecture, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

We need a markdown-based SDLC documentation system across 8 roles (PO, BA, Solution Architect, DBA, Dev, QA, DevOps, Security) with multi-personnel per role. The stated goal is **no missing, no conflict, no overlap** of role/scope/task across the lifecycle (idea → requirements → analyze → design → develop → test → deploy).

The naïve interpretation — "share some common .md file" — fails immediately:

- A **single shared file** edited by 8+ roles produces line-level merge conflicts hourly. Markdown merges are notoriously fragile even for non-overlapping edits.
- **One file per role** (`po.md`, `dba.md`, `dev.md`, …) fragments the document by author rather than by content. The same fact (e.g. schema choice) ends up in three role-files, drifting out of sync. This is "overlap" by our own definition.
- **Sections inside a single file with section-level ownership** is unenforceable: GitHub CODEOWNERS does not support sub-file granularity.

We need a structure where (a) each fact has exactly one home file, (b) each file has exactly one writer at a time, (c) each role has clear ownership, and (d) the structure scales to multiple concurrent features.

## Decision

Adopt a **per-feature folder + per-artifact file** structure. Each feature in flight gets a folder under `docs/features/`. Inside the folder, a fixed set of artifact files, each owned by exactly one role via CODEOWNERS, with named reviewer roles.

```
docs/features/2026-XX-<feature-slug>/
├── OWNERS.md              # Per-feature human assignment (Attack #3)
├── 00-idea.md             # PO owns,    BA reviews
├── 01-requirements.md     # BA owns,    PO + SA + QA + Security review
├── 02-design.md           # SA owns,    Dev + DBA + Security review
├── 03-schema.md           # DBA owns,   Dev + SA review
├── 04-test-plan.md        # QA owns,    Dev + BA review
├── 05-runbook.md          # DevOps owns, SA + Dev + Security review
├── 06-threat-model.md     # Security owns (stub → docs-confidential)
└── decisions/             # Feature-local ADR drafts; promoted on accept
```

Cross-references between artifacts are **markdown links** to specific files/sections — never copy-paste of facts. Each fact has exactly one home file; other artifacts link to it.

## Consequences

### Positive

- **No file-level merge conflicts**: each artifact has a single CODEOWNER, so only one author at a time writes to it.
- **No content overlap**: a fact (e.g. schema choice) lives only in `03-schema.md`; everything else links to it.
- **No missing artifact** (when paired with a linter): a CI job can verify every feature folder has the required files (template manifest).
- **Cross-role consistency**: adjacent roles are required PR reviewers. `02-design.md` cannot merge without DBA + Security approval.
- **Phase progression encoded by file numbering**: makes lifecycle order obvious without separate phase folders.
- **Parallel features**: each feature is its own folder — no global lock, no contention.

### Negative / Costs

- **More files** than a single-file approach. Discoverability needs a generated dashboard.
- **Requires templates** (Attack #5) for required-section enforcement and joiner ramp.
- **Requires linter** (ADR-0005) to catch missing files / empty sections — without it, completeness is aspirational.
- **Cross-references break if files are renamed** — must enforce stable paths or use IDs.
- **Folder count grows linearly** with features; needs a retirement/archive convention long-term.

### Neutral

- The number of artifacts (currently 7) is calibrated for a typical feature. Some features will have empty/stub artifacts (e.g. no schema change → `03-schema.md` is `status: Not Applicable`). This is fine — emptiness is recorded, not absent.

## Alternatives Considered

### A. Single shared file (`SDLC.md` containing all phases) — Rejected

Direct expression of the "common .md file" framing. **Fails on day one** — 8 roles editing one file produces constant merge conflicts. Cannot enforce per-role ownership. Cannot detect missing content. **Literally the opposite of "no conflict."**

### B. One file per role (`po.md`, `dba.md`, `dev.md`, …) — Rejected

Fragments by author, not by content. The schema decision lives in DBA's, Dev's, and DevOps' files simultaneously. Drift is guaranteed within weeks. **"Overlap" by our own definition.**

### C. Single repo-wide files per artifact (`/docs/requirements.md`, `/docs/design.md`, …) — Rejected

Works only if exactly one feature is in flight at a time. With multiple parallel features, all roles edit the same `requirements.md` simultaneously. Same merge-hell as Option A.

### D. Per-phase folder with role-owned sections inside — Rejected

Tempting (`design.md` has `## Schema (DBA)`, `## API (Dev)`, …) but **section-level CODEOWNERS doesn't exist** in GitHub. Cannot enforce ownership. Cannot prevent two people editing the same file via different sections at the same time → merge conflict.

## Related

- **ADR-0002** — Doc-as-source-of-truth (lifecycle state lives in front-matter of these files)
- **ADR-0003** — Multi-repo hybrid (these feature folders live in code repos, not central docs repo)
- **ADR-0005** — Linter rule lifecycle (the linter that enforces this structure)
- **Design history**: [`design/2026-05-07-sdlc-system-grill.md`](../design/2026-05-07-sdlc-system-grill.md), Attack #2

## Notes for future revision

- If feature scope routinely grows beyond 7 artifacts (e.g. data-pipeline projects with separate ingestion/transform/load designs), consider sub-artifacts (`02-design/01-ingestion.md`, `02-design/02-transform.md`) rather than expanding the top-level set. Keep the file count per folder bounded.
- File-numbering (`00-`, `01-`, …) is a convention, not enforced semantics. The lifecycle is enforced via `predecessors:` in front-matter (ADR-0002 / ADR-0005).

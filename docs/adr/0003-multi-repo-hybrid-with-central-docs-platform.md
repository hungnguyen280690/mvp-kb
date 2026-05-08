# ADR-0003: Multi-repo hybrid with central `docs-platform` + per-code-repo features + cross-repo SHA pins

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** SA (lead), DevOps, all roles consulted
- **Tags:** repo-topology, foundation, infrastructure
- **Supersedes:** —
- **Superseded by:** —

## Context

Most real organizations have multiple code repositories — one per service, plus separate frontend, infra-as-code, mobile, shared libraries. Our SDLC documentation system must work with this reality, not against it.

A single-repo design (everything monorepo) makes the linter, ripple detection, and CODEOWNERS trivial — but is rarely available to existing organizations. Forcing a monorepo migration just to support a doc system is bad engineering economics.

Multi-repo introduces five problems any solution must answer:

1. **Cross-repo ripple detection** — when ADR-0007 changes in one repo, every feature in other repos that pinned its SHA needs to know.
2. **CODEOWNERS divergence** — each repo has its own; team handles drift over time.
3. **Template drift** — without a single source, every repo's templates diverge in 6 months.
4. **Feature folder placement** — a feature touching 3 repos is "owned" by which one?
5. **Search & dashboards** — "find every feature referencing ADR-0007" requires federated search.

Pure alternatives all have hard breakages:

- **Monorepo only**: assumes greenfield or willingness to migrate; not realistic for existing orgs.
- **Central docs repo only** (no per-repo `docs/features/`): code changes in repo A don't trigger doc PRs in the central repo — code/doc drift is now the dominant failure.
- **Distributed only** (every repo owns all its docs, no central): cross-cutting consistency dies; teams diverge on ADRs and policies.

## Decision

**Hybrid topology**:

- **`docs-platform`** repo — central, authoritative for cross-cutting content (CONTEXT, ADRs, policies, standards, templates, team-roster, linter source, aggregator dashboard).
- **Each code repo** — has its own `docs/features/` directory containing feature folders for features primarily owned by that service. Plus optional `docs/service-context.md` extending the central CONTEXT.
- **Cross-repo references are SHA-pinned** in front-matter (e.g. `applies_adrs: [{id: 0007, repo: docs-platform, sha: <commit>}]`).
- **A bot fans out PRs** when central documents change: bumping SHA pins or flagging staleness in dependent repos.
- **The linter is published as a CLI** (`mass-doc-lint`), pulled into every repo's CI as a versioned dependency.
- **A primary-repo rule** governs cross-repo features: each feature has exactly one primary repo (where its full feature folder lives); other repos host thin "shadow" folders with only their slice of work, linking back to the primary.

```
docs-platform/                       (org-readable, central)
├── CONTEXT.md
├── adr/
├── policies/
├── standards/
│   ├── team-handles.md             (canonical CODEOWNER team names)
│   └── linter-changelog.md
├── templates/                      (manifest.yml + per-artifact templates)
├── team-roster.md
└── tools/doc-lint/                 (linter source, versioned releases)

service-orders/                      (each code repo same shape)
├── docs/
│   ├── features/
│   │   └── 2026-05-XX-feature/     (full feature folder, with cross-repo SHA pins)
│   └── service-context.md
├── .github/CODEOWNERS              (validated by linter against team-handles.md)
└── src/
```

## Consequences

### Positive

- **Code and feature docs co-located**: PRs touching code can also touch the feature design atomically.
- **Single source of cross-cutting truth**: ADRs and policies don't diverge across repos.
- **Linter version pinning per repo**: each repo team controls its upgrade cadence.
- **Each repo's compliance scope can differ** without forcing the loosest standard everywhere.
- **Aggregator dashboard** runs in `docs-platform`, fetches feature folders from every repo via GitHub API.

### Negative / Costs

- **Linter must speak HTTP/Git for cross-repo SHA fetch** — significantly more complex than single-repo.
- **Bot for fan-out PRs** is a real piece of infrastructure (GitHub App or scheduled action with PAT) — ~1 week to build, ongoing maintenance.
- **CODEOWNERS consistency** is a discipline, not automatic — linter rule needed (`docs-platform/standards/team-handles.md` is canonical; per-repo CODEOWNERS validated against it).
- **Cross-repo ripple is best-effort**: when ADR changes in `docs-platform`, the bot opens PRs but they may sit unreviewed for days. Staleness windows are wider than single-repo.
- **Primary-repo selection is a judgment call** for cross-cutting features; sometimes contested (which service "owns" a feature touching 3 services?).
- **Token management**: linter and bot need machine-account tokens with cross-repo read; rotation, scope, audit are all real ops concerns.

### Neutral

- **Search**: federated. The dashboard provides the single search surface. Direct grep across repos requires a local tool (`mass-doc-lint search` or similar).
- **Public/private mix**: `docs-platform` can be partially mirrored to a public-facing site (e.g. via subset-publish workflow) while keeping `docs-confidential` (ADR-0004) entirely private.

## Alternatives Considered

### A. Monorepo (code + all docs, single repo) — Rejected for general use

Simplest. Works only if greenfield or already-monorepo. Most existing orgs can't migrate just for a doc system. Acceptable if your situation matches; otherwise pick the hybrid.

### B. Central docs repo only, code repos have no docs — Rejected

Code/doc drift becomes the dominant failure mode. Every code change requires a separate PR in another repo. Sprint pressure ensures this drifts within weeks. Effectively turns "no missing" into wishful thinking.

### C. Distributed only — every repo owns all its docs, no central — Rejected

Cross-cutting consistency dies. Different services adopt different ADRs, policies, even templates. Defeats the whole point of "no overlap/conflict."

### D. Docs-as-submodule (central docs repo pulled into each code repo as git submodule) — Rejected

Submodules are notoriously painful: version-pinning is awkward, contributors hit checkout traps, and updates require submodule bumps in every repo. Bot-driven fan-out PRs are simpler and more transparent.

### E. Backstage / TechDocs platform — Rejected (for now)

Industry-standard, decent search. Adds a heavy stack (Backstage app, plugins, hosting) and learning curve. Not necessary for our scope; reconsider if team grows past ~30 engineers and search/discovery becomes the bottleneck.

## Related

- **ADR-0001** — Per-feature folder structure (lives inside each code repo's `docs/features/`)
- **ADR-0004** — Two-tier confidentiality (`docs-confidential` is the third repo in the topology)
- **ADR-0005** — Linter rule lifecycle (linter is published from `docs-platform`)
- **Design history**: [`design/2026-05-07-sdlc-system-grill.md`](../design/2026-05-07-sdlc-system-grill.md), Attack #8

## Notes for future revision

- **Migration path to monorepo**: if the org consolidates repos in the future, the hybrid collapses gracefully — feature folders move to subdirectories, SHA-pinning becomes trivial. The hybrid is forward-compatible.
- **Migration path to Backstage**: front-matter is structured enough that Backstage's `mkdocs-techdocs-core` plugin can ingest it. Adoption deferred but not foreclosed.
- **Watch for**: primary-repo arguments about cross-cutting features. If they recur, that's a signal a feature is too cross-cutting for a single primary — split into sub-features per service, each with its own primary.

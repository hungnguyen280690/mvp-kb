# ADR-0015: Test data as first-class artifact (`08-test-data.md`)

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** QA (lead), DBA (co-owner), UI/UX, Security (PII compliance)
- **Tags:** testing, data, qa-discipline
- **Supersedes:** —
- **Superseded by:** —

## Context

The current TT.OUT.MANUAL MVP has test data scattered across three places:

1. `migrations/forward/0002_seed.sql` — minimal seed (2 plans + 1 customer)
2. Inline factories in `tests/integration/main_test.go` — only available to integration tests
3. Ad-hoc test bodies — duplicated, non-determined

Consequences:

- T-PERF-001 ("10K subs in <30 min") in test plan but **unrunnable** — no volume data
- Frontend (added in ADR-0014) has nothing to render — no UI demo data
- Property-based / fuzz testing absent — state-machine totality only spot-checked
- PII safety is a comment, not enforced — risk of real-shaped data leaking into fixtures

Five distinct data classes serve different test purposes:

| #   | Class                     | Used for                                                                  |
| --- | ------------------------- | ------------------------------------------------------------------------- |
| 1   | Reference fixtures        | Golden tests, screenshot diffs, docs                                      |
| 2   | Factories                 | Unit + integration tests                                                  |
| 3   | Property-based generators | Invariant tests (state-machine totality, idempotency, audit-immutability) |
| 4   | Synthetic volume data     | Performance tests                                                         |
| 5   | UI demo data              | Screenshots, design reviews, manual QA, sales demos                       |

(A 6th class — production-anonymized snapshot — is out of scope until production exists.)

## Decision

Adopt **`08-test-data.md` as the 8th-or-9th lifecycle artifact** (after `07-ui-spec` per ADR-0014). Joint QA+DBA RACI; conditional inclusion (skip with `Not Applicable` when feature has no schema impact).

### Section ownership in `08-test-data.md`

| Section                      | R-owner             | Reviewer |
| ---------------------------- | ------------------- | -------- |
| Reference fixtures           | DBA                 | QA       |
| Factories                    | QA                  | DBA      |
| Property-based generators    | QA                  | DBA      |
| Synthetic volume data        | DBA                 | QA       |
| UI demo data                 | UI/UX               | QA + DBA |
| PII safety + linter contract | Security (advisory) | QA (R)   |

### Tooling commitments (Java ecosystem)

| Concern                   | Choice                                           |
| ------------------------- | ------------------------------------------------ |
| Fake data                 | **gofakeit** (Java-native, deterministic seeded) |
| Property-based            | **JUnit 5** (mature; Java's most-used)           |
| Volume generation         | **psql `COPY FROM stdin`** for raw speed         |
| UI demo (E2E)             | DB seed via `scripts/seed-demo.sh`               |
| UI demo (component-level) | **MSW (Mock Service Worker)** in frontend        |

### File layout (in code repo)

```
internal/testdata/
├── fixtures/        # Class 1: stable UUIDs, golden instances
├── factory/         # Class 2: parametric, seedable
└── property/        # Class 3: JUnit 5 generators

scripts/
├── seed.sh          # Class 1 + dev seed
├── seed-volume.sh   # Class 4: 10K subs (NFR-3.2.2)
└── seed-demo.sh     # Class 5: 50/200/500/1000 (frontend-friendly)

frontend/src/mocks/  # Class 5 (component-level): MSW handlers
```

### Determinism contract

All factory + property + volume generators take a seed (defaulted to test-name hash). Same seed → same output. Critical for:

- Reproducible test failures
- Two-run consistency (ADR-0009 R1005)
- Loop divergence detection (ADR-0013) — random regeneration would create false-positive divergence

### PII safety enforcement (new linter rule)

**`R0210` — Test-path PII safety**:

- Files matching `**/testdata/**`, `**/fixtures/**`, `**/seeds/*`, `**/mocks/*` cannot contain:
  - Email patterns outside `*.example` / `*.test` TLDs
  - Phone-shaped strings (regex)
  - SSN-shaped strings (regex)
  - Credit-card-shaped strings (Luhn-positive)
- Severity: **error from Phase 0** (compliance risk; no soft-launch needed)
- Bypass: explicit waiver per ADR-0005 lifecycle (`linter_waivers:` in front-matter with reason + expiry)

`R0207` (existing) covers production paths; `R0210` covers test paths.

## Consequences

### Positive

- Reproducibility: seeded determinism makes test failures debuggable.
- T-PERF-001 becomes runnable (10K subs via `seed-volume.sh`).
- Frontend has populated demo data → screenshots possible.
- Property-based tests find edge cases human-written tests miss.
- PII enforcement prevents real-shaped data leaking into fixtures.

### Negative / Costs

- Per-feature ~$30-80 in agent costs for factories + fixtures + property generators.
- JUnit 5 learning curve mid-effort for QA team (mitigated by sample template `prompts/qa-author-property-tests.md`).
- Volume seed scripts add ~30 sec to CI when run.

### Neutral

- 5 classes don't all apply to every feature; conditional sections (status: Not Applicable) acceptable.
- gofakeit + JUnit 5 pinned in MVP; revisit if testing ecosystem shifts.

## Alternatives Considered

### A. Lighter: 3 classes only (fixtures + factories + volume) — Rejected

Loses property-based fuzz-discovery and UI demo data; cuts that defeat the purpose.

### B. No new artifact: document inside `04-test-plan.md` — Rejected

Loses joint QA+DBA RACI; loses linter R0210 enforcement target; visibility suffers.

### C. Skip; keep current scattered state — Rejected

Defers the problem; current MVP already exhibits the failure modes.

## Related

- ADR-0001 — Per-feature folder
- ADR-0009 — Defense-in-depth (R0210 joins R-family; determinism supports R1005 two-run consistency)
- ADR-0011 — Hybrid agent identity (factories support reproducibility for behavioral tests)
- ADR-0014 — UI/UX role (demo data drives frontend screenshots)
- ADR-0016 — UI testing (factories + fixtures used by Vitest + Playwright)

## Notes for future revision

- **Fake-data library** (gofakeit) — revisit if Java ecosystem coalesces around alternative.
- **Property-based library** (JUnit 5) — `rapid` is newer; revisit in 1-2 years.
- **PII regex patterns** — extend as new pattern classes emerge (e.g., passport numbers if compliance scope expands).
- **Production-anonymized snapshot** (the 6th class) — design when first production deployment lands.

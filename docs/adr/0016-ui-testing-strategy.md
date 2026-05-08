# ADR-0016: UI testing strategy — layered stack with loop integration

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** QA (lead), UI/UX (co-owner), Security (a11y), DevOps (CI integration)
- **Tags:** testing, ui, accessibility, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

ADR-0014 added UI/UX role + `07-ui-spec.md` artifact. The existing `04-test-plan.md` template has 4 categories (Functional, Integration, Performance, Security) — none cover UI. Without a UI testing strategy, regressions ship freely and a11y is unverified.

Six concerns UI testing must cover:

1. End-to-end browser flows
2. Component-level rendering / interaction
3. Visual regression (screenshot diff)
4. Accessibility (WCAG 2.1 AA target from ADR-0014)
5. API contract (frontend ↔ backend types in sync)
6. UI performance (Core Web Vitals)

## Decision

Adopt **layered tooling stack** with **5 new test categories** in `04-test-plan.md`, **3 new reviewer agents** in roster, and **loop-integrated UI findings**.

### Tooling stack

| Layer                         | Tool                                                          | Why                                                                                 |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| E2E browser flows             | **Playwright**                                                | Multi-browser; trace viewer; codegen; built-in screenshot diff                      |
| Component rendering           | **Vitest + React Testing Library**                            | Vite-native (matches frontend build); Jest-API-compatible; fast                     |
| Visual regression             | **Playwright snapshot comparison**                            | One tool covers E2E + visual; baselines committed to repo                           |
| Accessibility                 | **`@axe-core/playwright`** (E2E) + **`jest-axe`** (component) | De facto a11y standard; WCAG 2.1 AA rule set                                        |
| Component dev / visual review | **Storybook** with CSF stories                                | Required when `07-ui-spec.md` lists >5 components; doubles as design-review surface |
| Component-level API mocks     | **MSW** (Mock Service Worker)                                 | Per ADR-0015                                                                        |
| API contract                  | **Hand-mirrored TS types** (MVP) → OpenAPI/Pact (v2)          | Manual sufficient at MVP scale                                                      |
| UI performance                | **Lighthouse CI**                                             | Industry standard for Core Web Vitals                                               |

### New test categories in `04-test-plan.md` template

Existing 4 categories → 9. Section ownership:

| #     | Category              | Owner                     | Tool                     |
| ----- | --------------------- | ------------------------- | ------------------------ |
| 1     | Functional            | QA-A                      | Java                     |
| 2     | Integration           | QA-B                      | Java + Playwright        |
| 3     | Performance (backend) | QA-B                      | Java + k6                |
| 4     | Security              | QA + Security             | Java + ZAP scan          |
| **5** | **UI E2E**            | **QA + UI/UX**            | **Playwright**           |
| **6** | **UI Component**      | **UI/UX + QA**            | **Vitest + RTL**         |
| **7** | **Accessibility**     | **UI/UX + QA + Security** | **axe-core**             |
| **8** | **Visual Regression** | **UI/UX**                 | **Playwright snapshots** |
| **9** | **UI Performance**    | **UI/UX**                 | **Lighthouse CI**        |

### New reviewer roster handles (extending ADR-0011)

| Handle                       | Underlying                                          | Loop layer                    | permitted_C         |
| ---------------------------- | --------------------------------------------------- | ----------------------------- | ------------------- |
| `@claude-ui-design-reviewer` | `comprehensive-review:architect-review` (UI prompt) | per-artifact (07-ui-spec)     | UI/UX, SA, Dev      |
| `@claude-a11y-auditor`       | (axe-core findings → loop format)                   | per-artifact (UI components)  | UI/UX, Security, QA |
| `@claude-visual-diff-triage` | (Playwright snapshot diff → finding triage)         | per-artifact (visual changes) | UI/UX               |

### Loop integration — UI findings as fingerprints

When Playwright fails in the loop, **failed visual diffs and a11y violations become fingerprints** in the loop-iteration format from ADR-0013:

```yaml
findings_fingerprints:
  - R-VISUAL-001:components/PlanList.tsx:0-0:visual-regression
  - R-A11Y-002:routes/customers.tsx:0-0:a11y-contrast
```

Visual-regression fingerprints have a special `suggested_fix.type`:

| Fix type             | Behavior                                      |
| -------------------- | --------------------------------------------- |
| `accept-baseline`    | Human approves; bot updates baseline PNG      |
| `revert-to-baseline` | Change unintentional; fixer reverts component |
| `escalate`           | Ambiguous; human review                       |

Loop **cannot** auto-decide visual changes (judgment); emits the finding; human approves baseline updates. ADR-0006 A-is-human-only respected.

### CI workflow targets

```
make test           # Java integration (existing) + frontend Vitest
make test-e2e       # Playwright (requires services running)
make test-a11y      # axe-core on built UI
make test-visual    # Playwright screenshot diffs
make test-ui        # all UI categories above
make test-all       # everything
```

### Severity tiers (per ADR-0005 lifecycle)

| Test category     | Phase 0 severity | Phase 1+ severity                           |
| ----------------- | ---------------- | ------------------------------------------- |
| UI E2E            | warn             | error                                       |
| UI Component      | warn             | error                                       |
| Accessibility     | warn             | error (new code only; legacy grandfathered) |
| Visual Regression | warn             | warn (always — humans approve)              |
| UI Performance    | info             | warn                                        |

### Linter rule additions

- **`R0220`** — UI artifacts must declare `applies_a11y_baseline` (defaulting to "WCAG-2.1-AA"); `07-ui-spec.md` must populate
- **`R0221`** — `04-test-plan.md` UI sections cross-reference the test categories above (no missing category for features with `07-ui-spec.md` Approved)
- **`R0222`** — Storybook stories required when `07-ui-spec.md` lists >5 components (advisory)

## Consequences

### Positive

- 9 test categories give credible UI coverage; matches the upgraded design ambition.
- Playwright's 3-in-1 (E2E + visual + a11y via plugin) keeps tooling lean.
- a11y violations surface as loop findings — agentic fixer can address simple cases (alt text, ARIA labels); humans handle complex ones.
- Visual baselines committed in repo (no SaaS dep) supports "local-runnable" goal.

### Negative / Costs

- One-time platform: ~3-4 days (ADR + role agent updates + prompts + linter rules).
- Per-feature added: ~$30-80 in agent costs for UI test authoring.
- Visual regression maintenance — baselines must be deliberately updated; humans approve diffs.
- Browser binaries: Playwright downloads ~150MB on first run.

### Neutral

- Chromium-only for MVP (fast CI); add Firefox + WebKit in v2.
- Storybook adds dev-time tooling (~30s extra on `pnpm install`); pays for itself on UI-heavy features.

## Alternatives Considered

### A. Cypress + Vitest — Rejected

Equally capable for E2E; smaller multi-browser story; Playwright is the better long-term bet.

### B. Selenium — Rejected

Slow, brittle; legacy.

### C. Skip UI testing in MVP — Rejected

Misses the user's explicit ask; produces UI without test coverage.

### D. Playwright + Vitest only (skip Storybook + visual + Lighthouse) — Rejected

~50% of value; loses visual diffs and component-dev velocity.

## Related

- ADR-0008 — Tiered approval matrix (cross-provider advisory routine extended to UI reviewers)
- ADR-0009 — Defense-in-depth (R0220-R0222 join the R-family)
- ADR-0011 — Hybrid agent identity (3 new roster handles)
- ADR-0013 — Agentic loop topology (UI findings integrated into loop format)
- ADR-0014 — UI/UX role + 07-ui-spec.md (this ADR tests that artifact)
- ADR-0015 — Test data first-class (UI demo data + factories used by Vitest/Playwright)

## Notes for future revision

- **Browser coverage** — chromium-only is a deliberate cut; add Firefox + WebKit when CI time budget allows.
- **Visual baseline storage** — committed PNGs work for MVP; migrate to Chromatic or LFS when baseline volume exceeds ~50MB.
- **a11y rule strictness** — start at WCAG 2.1 AA; tighten to AAA only if specific compliance need surfaces.
- **Lighthouse CI thresholds** — start with default Core Web Vitals; tune after observing real performance.

# ADR-0014: UI/UX role addition + `07-ui-spec.md` artifact

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** SA (lead), UI/UX Tech Lead, all roles consulted
- **Tags:** roles, artifacts, ui, frontend
- **Supersedes:** —
- **Superseded by:** —

## Context

ADR-0010 noted UX as "optional, depending on UI scope." TT.OUT.MANUAL has a customer self-service UI + admin UI; treating UI work as a buried Dev concern conflates design judgment with code execution and loses dedicated review. The current MVP's `web/index.html` is vanilla-JS placeholder — sufficient for curl-substitution, insufficient for real product.

Three options for elevating UI:

- **Absorb into Dev** — one of 3 Devs is "frontend lead." Loses dedicated artifact + RACI.
- **Pair (Designer + Frontend Dev)** — 10-role taxonomy, heavyweight for TT.OUT.MANUAL.
- **Single UI/UX role** with both design + implementation oversight — clean accountability without role explosion.

## Decision

Add **UI/UX as the 9th role** (joining PO, BA, SA, DBA, Dev, QA, DevOps, Security) and **`07-ui-spec.md` as the 8th lifecycle artifact**.

### Role definition

| Aspect                      | Value                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target ratio (per ADR-0010) | **60/40** human/agent                                                                                                                                                                                                   |
| RACI on `07-ui-spec.md`     | **R/A**: UI/UX; **C**: Dev (feasibility), BA (requirements alignment), QA (testability), Security (XSS/CSRF surface), SA (architecture fit)                                                                             |
| Workflow states             | Awaiting → ReviewingRequirements → Drafting07 → InReview07 → Approved07 → ConsultingDev → Operating                                                                                                                     |
| Authorized agents           | `@claude-opus-reviewer` (component-design analysis), `@claude-sonnet-test-automator` (component scaffolding), `@glm-4-air-doc-drafter` (boilerplate forms), `@claude-architect-reviewer` (cross-cutting UI consistency) |
| Authorship rotation         | ≥1 substantive `07-ui-spec.md` per quarter without agent assistance                                                                                                                                                     |

### `07-ui-spec.md` required sections (per `manifest.yml` update)

- User personas (pulls from `00-idea`/`01-requirements`)
- User flows (Mermaid sequence per primary flow)
- Information architecture (route map, navigation hierarchy)
- Component specification (composition tree, state machines, loading/error/empty states)
- Design tokens (colors, typography, spacing, motion)
- **Accessibility requirements (WCAG 2.1 AA target)**
- Data contracts (per-page API endpoints, request/response shapes)
- Out of scope

Required when feature has UI scope; `Not Applicable` status acceptable for backend-only features.

### Tech stack baseline

- **React 18 + TypeScript + Tailwind + TypeScript 5 + Vite + Tailwind 3 + shadcn/ui**
- **TanStack Query** (server state) + **Zustand** (client state)
- **React Router v6** (file-based routing optional in v2)
- **WCAG 2.1 AA** target

Baseline locked; deviations require feature-local ADR.

### Repo placement

- **MVP**: `frontend/` subdirectory in same code repo (single-repo simplicity)
- **Production**: separate repo per ADR-0003 multi-repo hybrid (when team scales)

## Consequences

### Positive

- Dedicated artifact + RACI for UI work; no more conflation.
- shadcn/ui's copy-paste-source pattern means no runtime dep + full customization.
- Tech stack matches `02-design.md` ("React + TypeScript") and is well-trained in agent corpus.
- WCAG 2.1 AA target is testable (axe-core; see ADR-0016).

### Negative / Costs

- 9th role expands roster + role-cards + workflows; +~1-2 weeks of platform updates one-time.
- Frontend build pipeline adds Node+Vite dependency on developer workstation (low cost; single `pnpm install`).
- shadcn copy-paste means manual updates when shadcn evolves; trade-off accepted for no-runtime-dep benefit.

### Neutral

- `07-ui-spec.md` is conditional: features without UI mark `Not Applicable`; not every feature gets one.
- TanStack Query + Zustand split is industry-standard but not universal; tunable per project.

## Alternatives Considered

### A. Absorb UI into Dev — Rejected

Loses dedicated review surface; conflates disciplines.

### B. Designer + Frontend Dev pair (10 roles) — Rejected

Heavyweight; saved for orgs >30 engineers.

### C. UI subsection in `02-design.md` only — Rejected

SA reviews UI design; conflates with architecture; no enforced "must have UI section."

### D. Stay vanilla JS / HTMX — Rejected

Agent training coverage weaker; bets against locked design doc choice.

## Related

- ADR-0001 — Per-feature folder + per-artifact file (`07-ui-spec.md` is the 8th artifact)
- ADR-0003 — Multi-repo hybrid (production frontend split)
- ADR-0006 — A-is-human-only (UI/UX role A is human; agents R/C only)
- ADR-0010 — Human role design (UI/UX at 60/40 ratio)
- ADR-0016 — UI testing strategy (companion ADR; testing the artifact this ADR creates)

## Notes for future revision

- **Component library choice** (shadcn vs Material vs Mantine) — shadcn picked for no-runtime-dep + agent-friendliness; revisit if accessibility issues emerge.
- **State management split** (TanStack Query + Zustand) — works for MVP scale; if global state grows, consider Redux Toolkit.
- **shadcn updates** — manual; track via component-version comments in copied source files; periodic refresh.

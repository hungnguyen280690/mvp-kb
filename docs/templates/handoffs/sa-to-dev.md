# Handoff: SA → Dev (BE + FE)

## Context

- **Feature**: [tên feature]
- **Stage completed**: Stage 2 (SA + DBA + Security + UI)
- **Gates signed**: G2 — [date], G-DBA — [date], G-SEC — [date], G-UI — [date]

## Artifacts handed off

| Artifact         | Path                                      | Owner    | Status |
| ---------------- | ----------------------------------------- | -------- | ------ |
| OpenAPI internal | `contracts/openapi/api-internal-v1.yaml`  | SA       | Active |
| OpenAPI callback | `contracts/openapi/api-callback-v1.yaml`  | SA       | Active |
| AsyncAPI events  | `contracts/asyncapi/events-v1.yaml`       | SA       | Active |
| MQ XSD schema    | `contracts/mq/lnh-message.xsd`            | SA       | Active |
| Canonical JSON   | `contracts/schemas/payment-order-v1.json` | SA       | Active |
| DDL Migrations   | `db/migrations/V1-V5.sql`                 | DBA      | Active |
| Threat model     | `features/{{FEATURE}}/06-threat-model.md` | Security | Active |
| UI Spec          | `features/{{FEATURE}}/07-ui-spec.md`      | UI       | Active |
| Feature ADRs     | `docs/adr/`                               | SA       | Active |

## Key decisions made

- Architecture: 4 services (BFF, LTT-Core, Integration Gateway, GL Pusher)
- Outbox pattern cho MQ messaging
- Saga orchestration cho LTT lifecycle
- Audit hash chain cho tamper-proof trail

## Open questions for Dev

- [Question 1]
- [Question 2]

## Dev Checklist

### Dev-BE

- [ ] Verify OpenAPI contracts match expectations
- [ ] Verify DDL migrations run clean on Oracle Free
- [ ] Implement 4 services theo DDD layers
- [ ] Critical paths coverage ≥ 90%

### Dev-FE

- [ ] Verify UI spec match screens.yaml
- [ ] Verify OpenAPI có đủ endpoints cho 7 screens
- [ ] Implement React components theo shadcn/ui
- [ ] Form validation match validation-rules.yaml

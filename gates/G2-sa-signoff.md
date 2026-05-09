# Gate G2 — SA Sign-off

## Thông tin

- **Gate**: G2 — Stage 2 (SA)
- **Reviewer**: SA Lead / Solution Architect
- **Ngày ký**: 2026-05-10
- **Trạng thái**: ✅ APPROVED

## Artifacts đã review

| File | Trạng thái |
|------|-----------|
| `contracts/openapi/api-internal-v1.yaml` (17 endpoints) | ✅ Đạt |
| `contracts/openapi/api-callback-v1.yaml` (1 endpoint, HMAC) | ✅ Đạt |
| `contracts/asyncapi/events-v1.yaml` (22 events, 7 channels) | ✅ Đạt |
| `contracts/mq/lnh-message.xsd` | ✅ Đạt |
| `contracts/schemas/payment-order-v1.json` (57 fields, CRITICAL) | ✅ Đạt |
| `db/migrations/V1__init_ltt.sql` (LTT + 4 tables) | ✅ Đạt |
| `db/migrations/V2__outbox.sql` (outbox + PL/SQL + AQ) | ✅ Đạt |
| `db/migrations/V3__audit_hash_chain.sql` (hash chain + verify) | ✅ Đạt |
| `db/migrations/V4__lock_table.sql` (lock pkg + scheduler) | ✅ Đạt |
| `docs/adr/0001-0006` (6 ADRs) | ✅ Đạt |
| `docs/c4/context.mmd` + `container.mmd` + `component.mmd` | ✅ Đạt |
| `docs/threat-model.md` (20 threats, STRIDE) | ✅ Đạt |

## Kiến trúc xác nhận

- 4-service: BFF → LTT Service → Gateway Service → Audit Service
- Outbox pattern cho DB+MQ atomic (ADR-0001)
- Saga orchestration cho LTT lifecycle (ADR-0002)
- SHA-256 hash chain cho tamper-proof audit (ADR-0003)
- Optimistic lock + If-Match (ADR-0004)
- Client-generated idempotency key (ADR-0005)
- Server-side COA validation + 2-tier cache (ADR-0006)

## Ghi chú

- payment-order-v1.json: 57 fields khớp screens.yaml S02, 36 VAL constraints đầy đủ
- DDL Oracle 19c: SoD CHECK constraints trên MAKER_ID/CHECKER_ID/APPROVER_ID
- Threat model: đủ chống tampering (hash chain) và replay (idempotency + HMAC)
- INC-001/002/003 từ BA đã được handle trong SA design

---

**Ký duyệt**: ✅ G2 APPROVED — Cho phép Stage 3 (Dev) bắt đầu.

**Chữ ký**: hungnguyen280690
**Ngày**: 2026-05-10

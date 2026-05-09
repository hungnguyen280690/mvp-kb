# G2 Summary — Stage 2 SA Sign-off

> Sinh tự động bởi AI | Ngày: 2026-05-10
> Cần G2 reviewer (Solution Architect Lead) review trong 24h

## Tổng quan

Stage 2 (SA) đã hoàn thành thiết kế kiến trúc cho VDBAS TT.OUT.MANUAL dựa trên 12 domain artifacts từ Stage 1.

## Artifacts đã sinh (19 files)

### API Contracts (4 files)

| File | Nội dung | Kích thước |
|------|----------|------------|
| `contracts/openapi/api-internal-v1.yaml` | 17 endpoints BFF API, 36 VAL → 422 error mapping | 52.3 KB |
| `contracts/openapi/api-callback-v1.yaml` | Callback API từ NHNN/KB, HMAC verification | 12.9 KB |
| `contracts/asyncapi/events-v1.yaml` | 22 MQ events trên 7 channels, IBM MQ bindings | ~15 KB |
| `contracts/mq/lnh-message.xsd` | XSD cho tin nhắn LNH/CITAD | 7.9 KB |

### Canonical Schema (1 file — CRITICAL)

| File | Nội dung | Kích thước |
|------|----------|------------|
| `contracts/schemas/payment-order-v1.json` | 57 fields, 36 VAL constraints, 11 COA segments, state machine | 20.9 KB |

### Oracle DDL (4 files)

| File | Nội dung | Kích thước |
|------|----------|------------|
| `db/migrations/V1__init_ltt.sql` | LTT + 4 phụ bảng, 57+ cột, 15 indexes, SoD constraints | 30.5 KB |
| `db/migrations/V2__outbox.sql` | Outbox table + PL/SQL package + Oracle AQ integration | 15.7 KB |
| `db/migrations/V3__audit_hash_chain.sql` | Hash chain table + VERIFY_CHAIN function + auto-trigger | 19.6 KB |
| `db/migrations/V4__lock_table.sql` | Lock table + PL/SQL package + Scheduler jobs | 17.6 KB |

### ADRs (6 files)

| ADR | Quyết định |
|-----|------------|
| 0001-outbox-pattern | Transactional Outbox + Polling Publisher cho DB+MQ atomic |
| 0002-saga-orchestration | Orchestration over choreography cho LTT 8+ bước |
| 0003-audit-hash-chain | SHA-256 hash chain cho tamper-proof audit |
| 0004-optimistic-lock | Version column + If-Match header, 409 conflict response |
| 0005-idempotency-design | Client-generated key cho POST/MQ/Gateway |
| 0006-coa-validation-strategy | Server-side COA validation + Caffeine L1 + Redis L2 cache |

### C4 Diagrams (3 Mermaid files)

| File | Nội dung |
|------|----------|
| `docs/c4/context.mmd` | System context: 4 actors, VDBAS, 9 external systems |
| `docs/c4/container.mmd` | 5 containers: SPA, BFF, LTT Service, Gateway, Audit Service |
| `docs/c4/component.mmd` | 13 components trong LTT Service |

### Threat Model (1 file)

| File | Nội dung |
|------|----------|
| `docs/threat-model.md` | STRIDE: 20 threats (14 HIGH, 6 MED), focus tampering + replay |

## Key Architecture Decisions

### 4-service architecture
```
React SPA → BFF → LTT Service (core) → Oracle 19c
                 → Gateway Service → IBM MQ → NHNN/CITAD
                 → Audit Service → Hash chain + Outbox publisher
```

### Critical design points
1. **Outbox pattern**: DB write + MQ publish trong cùng 1 Oracle transaction
2. **Saga orchestration**: LTT Service là orchestrator, quản lý state machine
3. **Hash chain**: Mỗi audit entry hash prev_hash + current data, verify by PL/SQL
4. **Optimistic lock**: VERSION column, auto-increment by trigger
5. **Idempotency**: 3 strategies — REST (UUID header), MQ (correlationId), Gateway (requestId+channel)
6. **COA validation**: 18-segment matrix validated server-side, cached 2-tier

## Self-check

| Checklist | Status |
|-----------|--------|
| payment-order-v1.json — 57 fields, 36 VAL constraints | ✅ |
| OpenAPI 17 endpoints + 422 error mapping | ✅ |
| AsyncAPI 22 events + 7 MQ channels | ✅ |
| DDL V1-V4 Oracle 19c, SoD CHECK constraints | ✅ |
| 6 ADRs với context/decision/consequences | ✅ |
| C4 context.mmd + container.mmd + component.mmd | ✅ |
| STRIDE threat model (20 threats) | ✅ |
| LNH message XSD | ✅ |

## Action items cho G2 reviewer

1. **`payment-order-v1.json`** — verify 57 fields match screens.yaml S02, VAL constraints correct
2. **DDL Oracle** — đặc biệt V3 (hash chain) và V4 (lock package)
3. **Threat model** — đủ chống tampering/replay chưa?
4. **C4 diagrams** — visually verify 4-service architecture + data flow
5. **6 ADRs** — đồng ý với các quyết định kiến trúc?
6. **Inconsistencies từ BA** — INC-001/002/003 đã được handle trong SA design chưa?

---

*Sign-off: Tạo file `gates/G2-sa-signoff.md` khi đồng ý.*

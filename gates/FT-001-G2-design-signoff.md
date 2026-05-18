# Gate G2 — Design Sign-off: FT-001

## Kết quả
- **Status**: APPROVED
- **Ngày**: 2026-05-18

## Artifacts đã tạo

| File | Kích thước | Mô tả |
|------|-----------|--------|
| `features/FT-001/02-design.md` | 15KB | Service design, state machine, integration patterns |
| `features/FT-001/03-schema.sql` | 21KB | 9 tables, 37 constraints, 24 indexes, hash-chain audit |
| `contracts/openapi.yaml` | 82KB | 16 endpoints, 31 schemas, OpenAPI 3.1 |

## Schema highlights
- 9 tables: payment_order, payment_order_detail, approval_log, audit_log, role, role_function, user_role, attachment, sys_function
- Hash chain audit (SHA-256)
- Optimistic locking (version column)
- State machine constraint (9 trạng thái)

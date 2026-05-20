# G2 Sign-off: FT-001 — PAY.OUT.MANUAL (Design)

**Tính năng:** FT-001 — PAY.OUT.MANUAL (Lệnh thanh toán đi thủ công — CRUD + Workflow)
**Ngày:** 2026-05-19
**SA Agent:** Claude AI
**Trạng thái:** APPROVED

---

## 1. Danh sách Artifacts đã hoàn thành

| File                                     | Mô tả                                                                                                         | Trạng thái |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| `features/FT-001/02-design.md`           | Thiết kế kỹ thuật: kiến trúc, State Machine 7 trạng thái, SoD 3 lớp, optimistic lock, idempotency, audit hash | Done       |
| `features/FT-001/contracts/openapi.yaml` | OpenAPI 3.1 contract: 20 endpoints, request/response schemas, RBAC, error format                              | Done       |
| `features/FT-001/03-schema.sql`          | DB Schema Oracle 19c: 7 bảng, 1 sequence, 1 trigger, indexes, CHECK constraints (SoD, enum, amount)           | Done       |
| `features/FT-001/04-impact-analysis.md`  | System Impact: 7 services, 20 API mới, 7 bảng mới, 9 security impacts, 5 hạ tầng, 6 technical risks           | Done       |
| `features/FT-001/06-threat-model.md`     | STRIDE Threat Model: 30 threats, 14 mitigations, 8 residual risks, 12 Phase 2 recommendations                 | Done       |

---

## 2. Checklist G2 — Verified by Human

- [x] **BDD Coverage**: openapi.yaml bao phu 100% BDD use cases (7 files, 20 endpoints). Verified by Human.
- [x] **Impact Assessment**: 04-impact-analysis.md da bo sung System Impact day du. Verified by Human.
- [x] **Naming Alignment**: Tat ca ten API/DB/field dung glossary. Verified by Human.
- [x] **Security Schema**: RBAC, audit, validation day du trong design. Verified by Human.
- [x] **Constraints**: Optimistic lock, idempotency, SoD reflect trong schema. Verified by Human.

---

## Lich su Sua doi

- **2026-05-19** | **SA Agent** | FT-001 | Tao G2 sign-off voi 5 artifacts.
- **2026-05-19** | **Human** | FT-001 | Duyet G2 — Status: APPROVED.

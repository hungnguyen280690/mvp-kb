# G2 Sign-off: FT-001 — PAY.OUT.MANUAL (Design)

**Tính năng:** FT-001 — PAY.OUT.MANUAL (Lệnh thanh toán đi thủ công — CRUD + Workflow)
**Ngày:** 2026-05-19
**SA Agent:** Claude AI
**Trạng thái:** CHỜ HUMAN DUYỆT

---

## 1. Danh sách Artifacts đã hoàn thành

| File                                     | Mô tả                                                                                                         | Trạng thái |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| `features/FT-001/02-design.md`           | Thiết kế kỹ thuật: kiến trúc, State Machine 7 trạng thái, SoD 3 lớp, optimistic lock, idempotency, audit hash | ✅         |
| `features/FT-001/contracts/openapi.yaml` | OpenAPI 3.1 contract: 20 endpoints, request/response schemas, RBAC, error format                              | ✅         |
| `features/FT-001/03-schema.sql`          | DB Schema Oracle 19c: 7 bảng, 1 sequence, 1 trigger, indexes, CHECK constraints (SoD, enum, amount)           | ✅         |
| `features/FT-001/04-impact-analysis.md`  | System Impact: 7 services, 20 API mới, 7 bảng mới, 9 security impacts, 5 hạ tầng, 6 technical risks           | ✅         |
| `features/FT-001/06-threat-model.md`     | STRIDE Threat Model: 30 threats, 14 mitigations, 8 residual risks, 12 Phase 2 recommendations                 | ✅         |

---

## 2. Tóm tắt quyết định thiết kế quan trọng

| #   | Quyết định                                                        | Lý do / Tham chiếu                                |
| --- | ----------------------------------------------------------------- | ------------------------------------------------- |
| 1   | **F-ID = UUID (VARCHAR2(36))**                                    | INC-G-01: tách biệt REF_NO, distributed-friendly  |
| 2   | **REF_NO auto-gen `<KBNN>-YYYYMM-<seq6>`**                        | INC-G-02: tránh sai thủ công, đảm bảo unique      |
| 3   | **PAYMENT_DATE editable, validate trong kỳ OPEN**                 | INC-G-13: ưu tiên TC.1.05, nhu cầu backdating T-1 |
| 4   | **Optimistic lock JPA @Version + If-Match header**                | VAL-15, ADR-0004                                  |
| 5   | **Idempotency 24h TTL, X-Idempotency-Key header**                 | ADR-0005                                          |
| 6   | **Audit hash-chain SHA-256, append-only, DB trigger immutable**   | BIZ-007, ADR-0003                                 |
| 7   | **SoD 3 lớp: JWT role + application guard + DB CHECK constraint** | BIZ-001, INC-G-17                                 |
| 8   | **CCID Caffeine L1 cache TTL 30 phút, re-validate lúc Submit**    | ADR-0006, MVP only                                |
| 9   | **Soft delete = STATUS='DELETED', không cột is_deleted riêng**    | BIZ-003, BIZ-006                                  |
| 10  | **Export sync cap ≤50k records**                                  | MVP giới hạn, Phase 2 async                       |

---

## 3. Checklist G2 — Giai đoạn 2 (SA / Thiết kế)

> Nguồn: `docs/WORKFLOW.md` — Checklist Giai đoạn 2 (SA)

- [ ] **BDD Coverage**: Hợp đồng `openapi.yaml` và các API endpoint đã bao phủ 100% Use Case từ G1 (7 BDD files → 20 endpoints)?
- [ ] **Impact Assessment**: `04-impact-analysis.md` đã bổ sung System Impact (Service, API, Table, Security)?
- [ ] **Naming Alignment**: Tất cả tên API, bảng DB, field đã dùng đúng thuật ngữ từ `glossary.md`?
- [ ] **Security Schema**: Các endpoint nhạy cảm đã có RBAC, audit, validation trong design?
- [ ] **Constraints**: Các ràng buộc kỹ thuật (optimistic lock, idempotency, SoD) đã được reflect trong schema?

---

## 4. Xác nhận

> **HUMAN**: Vui lòng đánh dấu `[X]` cho từng mục checklist ở Section 3 sau khi rà soát. Khi tất cả đã `[X]`, SA Stage 2 hoàn thành.

---

## Lịch sử Sửa đổi

- **2026-05-19** | **SA Agent** | FT-001 | Tạo G2 sign-off. 5 artifacts hoàn thành: design, openapi, schema, system impact, threat model.

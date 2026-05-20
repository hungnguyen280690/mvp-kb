# G2 Design Sign-off — FT-001: PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                           |
| ------------ | ------------------------------------------------- |
| Mã tính năng | FT-001                                            |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công |
| Giai đoạn    | Stage 2 (SA / Design)                             |
| Ngày tạo     | 2026-05-20                                        |
| Người soạn   | SA Agent                                          |
| Trạng thái   | **CHỜ HUMAN DUYỆT**                               |

---

## Tóm tắt artifacts đã hoàn thành

| #   | Artifact                                            | Trạng thái | Ghi chú                                                                           |
| --- | --------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| 1   | `features/FT-001/02-design.md`                      | ✅ Đã tạo  | Technical Design v1.0: Architecture, State Machine, Constraints                   |
| 2   | `features/FT-001/contracts/openapi.yaml`            | ✅ Đã tạo  | OpenAPI 3.1, 20 endpoints, 4 tags, đủ security scheme                             |
| 3   | `features/FT-001/03-schema.sql`                     | ✅ Đã tạo  | DDL Oracle 19c: 7 tables, constraints, sequences, triggers                        |
| 4   | `features/FT-001/04-impact-analysis.md` (Section 2) | ✅ Đã tạo  | System Impact: Services, API, DB, Security                                        |
| 5   | `features/FT-001/06-threat-model.md`                | ⏭ Bỏ qua  | Không phát sinh rủi ro mới ngoài những gì đã cover trong design (SoD, PII, audit) |

---

## Checklist G2 — Giai đoạn 2 (SA / Thiết kế)

> Nguồn: `docs/WORKFLOW.md` — Checklist Giai đoạn 2 (SA)

### Để Human duyệt — đánh dấu `[X]` vào từng mục sau khi xác nhận:

- [ ] **BDD Coverage** — `openapi.yaml` và 20 API endpoints đã bao phủ 100% Use Case từ G1?
  - bdd-01 (CREATE): POST `/api/pay-out-manual`, POST `/api/pay-out-manual/{id}/submit` ✓
  - bdd-02 (EDIT): PUT `/api/pay-out-manual/{id}` ✓
  - bdd-03 (APPROVE): `/check-approve`, `/approve`, `/return`, `/reject` ✓
  - bdd-04 (LIST): GET `/api/pay-out-manual` với full filter ✓
  - bdd-05 (DELETE): DELETE `/api/pay-out-manual/{id}` (soft) ✓
  - bdd-06 (EXPORT): POST `/api/pay-out-manual/export` ✓
  - bdd-07 (COPY): POST `/api/pay-out-manual/{id}/copy` ✓
  - Attachment (bdd-01 TC.1.06..07): POST/GET/DELETE attachments ✓
  - Audit/Stepper: GET audit-log, GET approval-status ✓
  - CCID validate: POST validate-ccid ✓
  - Lookup LOV: GET lookup/{type} ✓

- [ ] **Impact Assessment** — `04-impact-analysis.md` Section 2 đã bổ sung System Impact đầy đủ?
  - Services bị ảnh hưởng: `bff-service`, `ltt-service`, `audit-service` ✓
  - 20 API endpoints mới liệt kê rõ ràng ✓
  - 7 bảng DB mới liệt kê đủ ✓
  - Security impact: RBAC, SoD, PII, Audit, Idempotency, Optimistic Lock, Attachment, Export ✓

- [ ] **Naming Alignment** — Tất cả tên API, bảng DB, field đã dùng đúng thuật ngữ từ `docs/domain/glossary.md`?
  - Table prefix `LTT_` ✓
  - Field names `UPPER_SNAKE_CASE` trong DB ✓
  - API path `kebab-case` ✓
  - JSON camelCase theo convention ✓
  - Enum values khớp với glossary (MAKER/CHECKER/APPROVER, 7 states) ✓

- [ ] **Security Schema** — Các endpoint nhạy cảm đã có RBAC, audit, validation trong design?
  - Bearer JWT RS256 trên mọi endpoint ✓
  - RBAC per-endpoint trong openapi.yaml (description + permission code) ✓
  - `X-Idempotency-Key` bắt buộc mọi mutating POST/PUT/DELETE ✓
  - `If-Match` bắt buộc PUT/DELETE/workflow actions ✓
  - SoD 3-layer enforcement documented ✓
  - PII masking identified (senderIdentifyId, receiverIdentifyId, receiverName) ✓
  - Audit log entry sinh cho mọi mutating action ✓

- [ ] **Constraints** — Các ràng buộc kỹ thuật đã reflected đầy đủ trong schema?
  - Optimistic lock: cột `VERSION NUMBER(10)`, `If-Match` header, 409 MSG-ERR-LOCK ✓
  - Idempotency: bảng `LTT_IDEMPOTENCY_STORE`, TTL 24h ✓
  - SoD: DB CHECK constraint `checker_id <> created_by`, `approver_id <> created_by AND <> checker_id` ✓
  - Soft delete: STATUS='DELETED' thay vì is_deleted flag ✓
  - Audit hash chain: `LTT_AUDIT_LOG` với trigger chặn UPDATE/DELETE ✓
  - REF_NO auto-gen: `LTT_REF_NO_SEQUENCE` + MERGE atomic ✓
  - Attachment: size limit 10MB/file, 50MB/record, SHA-256 checksum ✓

---

## Điểm cần chú ý (Notes for Human)

1. **15 mục `[NEEDS CLARIFICATION]`** trong `01-inconsistencies.md` — SA đã đưa ra quyết định MVP thực tế nhất cho tất cả. Các quyết định được ghi trong `02-design.md`. Nếu chuyên gia nghiệp vụ có yêu cầu khác, cần rework trước khi vào Stage 3.

2. **`06-threat-model.md` được bỏ qua** — Threat model cơ bản đã được phân tích trong `02-design.md` (SoD, Audit, PII, Idempotency). Không phát sinh mối đe dọa mới ngoài những gì đã có giải pháp tường minh. SA đánh giá không cần file riêng cho MVP.

3. **openapi.yaml** — Spec đầy đủ ở level chi tiết cho Dev implement và QA test. Nếu có endpoint nào cần thay đổi tên/method sau khi duyệt, sẽ cần cập nhật đồng bộ cả `02-design.md`.

---

## Quyết định: Ký duyệt G2

> **Hướng dẫn**: Sau khi xem xét 5 mục Checklist ở trên, Human đánh dấu `[X]` vào từng mục và ký bên dưới để chuyển sang Stage 3 (Dev Agent).

**Ngày duyệt:** ****\_\_\_****

**Người duyệt:** ****\_\_\_****

**Ghi chú của người duyệt:** _(tùy chọn)_

> ⚠️ Sau khi Human ký duyệt file này, Dev Agent sẽ đọc gate này và bắt đầu Stage 3.

---

## Lịch sử Sửa đổi

- **2026-05-20** | **SA Agent** | FT-001 | Tạo file G2 Design Sign-off, liệt kê đầy đủ artifacts hoàn thành và Checklist G2.

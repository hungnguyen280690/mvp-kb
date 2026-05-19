# 02 — Technical Design Document: FT-001 — PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| Mã tính năng | FT-001                                                                    |
| Tên đầy đủ   | PAY.OUT.MANUAL — Lệnh Thanh Toán Đi Thủ Công (CRUD + Workflow)            |
| Phiên bản    | 1.0 (MVP)                                                                 |
| Ngày tạo     | 2026-05-19                                                                |
| Người soạn   | SA Agent                                                                  |
| Trạng thái   | DRAFT — chờ duyệt G2                                                      |
| Dependencies | `01-scope.md`, `01-inconsistencies.md`, `bdd-01` → `bdd-07`, ADR-0003..06 |

---

## Section 1. Tổng quan kiến trúc (Architecture Overview)

### 1.1. Service Boundaries

Tính năng `FT-001` được đặt trong miền nghiệp vụ **LTT** (Lệnh Thanh Toán). Theo `docs/ARCHITECTURE.md`, có 2 service backend liên quan:

| Service               | Vai trò trong FT-001                                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`bff-service`**     | Backend-for-Frontend: cung cấp REST API tổng hợp dành cho `ltt-ui` (Micro-frontend). Đảm nhận: validate JWT, gọi `ltt-service`, ghép dữ liệu attachment/audit-log/approval-history cho 1 màn hình duy nhất, return DTO theo hợp đồng UI. |
| **`ltt-service`**     | Core domain service: chứa State Machine của Payment Order, business rules (SoD, optimistic lock, CCID validation), persistence layer (Oracle 19c), event publishing tới audit-service (qua outbox).                                      |
| `audit-service`       | (Reuse hạ tầng có sẵn) Consume event từ `ltt-service`, ghi vào bảng `ltt_audit_log` với hash-chain (ADR-0003). Trong MVP có thể merge logic này vào `ltt-service` (chế độ embedded) để giảm độ phức tạp.                                 |
| `integration-gateway` | **Out of scope MVP** — sẽ dùng ở Phase 2 khi đẩy lệnh APPROVED sang Oracle EBS GL.                                                                                                                                                       |

### 1.2. Data Flow

```
[ltt-ui (React)]
   │  HTTP/JSON + JWT + X-Idempotency-Key + If-Match (ETag)
   ▼
[bff-service]
   │  1) Verify JWT → trích role, userId, kbnnId
   │  2) Aggregate / Map DTO
   ▼
[ltt-service]  ←  REST internal (mTLS / service mesh)
   │
   ├── Domain layer  ─ State Machine, SoD guards, validators
   ├── Application   ─ Use cases (CreateOrder, SubmitOrder, ApproveAsChecker, ...)
   └── Infrastructure
        ├─ JPA / Oracle 19c (LTT_PAY_ORDER, LTT_PAY_ORDER_LINE, ...)
        ├─ COA Validator (Caffeine cache + DB lookup — ADR-0006)
        ├─ Audit hash-chain writer (ADR-0003)
        └─ Outbox publisher (ADR-0001)
```

### 1.3. External Dependencies (MVP scope)

| Dependency                        | Cách dùng trong MVP                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Master Data (LOV.01..07)**      | Đọc qua REST nội bộ tới `master-data-service` (giả định đã tồn tại). Lookup popups dùng `/lookup/{type}` endpoint chuẩn.    |
| **CCID config (DMHT.COA-MATRIX)** | Bảng read-only `DMHT_COA_MATRIX` (out-of-scope tạo lại trong FT-001, giả định đã có). COA Validator query theo ADR-0006.    |
| **Oracle EBS GL**                 | **MOCK ONLY** — Trạng thái `TRANSFERRED_TO_GL`, `POSTED` không được implement; UI hiển thị label tĩnh, không có transition. |
| **Notification service**          | Gửi in-app qua REST POST `/notifications/inapp`. Email → stub (log lại, không gửi thật) trong MVP.                          |
| **AuthN/AuthZ (SSO)**             | Reuse SSO của VDBAS. Token JWT chứa `sub` (userId), `roles[]`, `kbnnId`. `bff-service` validate signature + expiry.         |
| **File Storage**                  | Sử dụng object storage on-prem (S3-compatible MinIO hoặc filesystem mount). Path: `/ltt/{orderId}/{attachmentId}.{ext}`.    |

---

## Section 2. API Design (Summary)

> Chi tiết đầy đủ schema tại `features/FT-001/contracts/openapi.yaml`. Phần này chỉ liệt kê endpoints + decision quan trọng.

### 2.1. REST Endpoints

| #   | Method | Path                                              | Mô tả                                                         | Auth Role                        |
| --- | ------ | ------------------------------------------------- | ------------------------------------------------------------- | -------------------------------- |
| 1   | POST   | `/api/pay-out-manual`                             | Tạo mới lệnh (DRAFT). REF_NO auto-generate.                   | MAKER                            |
| 2   | GET    | `/api/pay-out-manual/{id}`                        | Xem chi tiết. Trả ETag = F-VER.                               | MAKER, CHECKER, APPROVER, VIEWER |
| 3   | PUT    | `/api/pay-out-manual/{id}`                        | Sửa (DRAFT / RETURNED_TO_MAKER). Yêu cầu `If-Match`.          | MAKER (chỉ Maker gốc)            |
| 4   | DELETE | `/api/pay-out-manual/{id}`                        | Soft-delete. Body: `{deleteReason, confirmed}`. `If-Match`.   | MAKER (chỉ Maker gốc)            |
| 5   | POST   | `/api/pay-out-manual/{id}/submit`                 | Gửi kiểm soát (DRAFT/RETURNED → READY_FOR_APPROVAL).          | MAKER                            |
| 6   | POST   | `/api/pay-out-manual/{id}/check-approve`          | Checker phê duyệt (READY → PENDING_APPROVER).                 | CHECKER                          |
| 7   | POST   | `/api/pay-out-manual/{id}/approve`                | Approver phê duyệt cuối (PENDING_APPROVER → APPROVED).        | APPROVER                         |
| 8   | POST   | `/api/pay-out-manual/{id}/return`                 | Trả lại Maker (READY/PENDING → RETURNED_TO_MAKER). Lý do ≥10. | CHECKER, APPROVER                |
| 9   | POST   | `/api/pay-out-manual/{id}/reject`                 | Từ chối (READY/PENDING → REJECTED). Lý do ≥10.                | CHECKER, APPROVER                |
| 10  | POST   | `/api/pay-out-manual/{id}/copy`                   | Tạo lệnh mới từ lệnh sẵn có (clone → DRAFT).                  | MAKER                            |
| 11  | GET    | `/api/pay-out-manual`                             | Danh sách (lọc + sort + paginate).                            | MAKER, CHECKER, APPROVER, VIEWER |
| 12  | POST   | `/api/pay-out-manual/export`                      | Export Excel/PDF/CSV (sync ≤ 50k records).                    | MAKER, CHECKER, APPROVER, VIEWER |
| 13  | POST   | `/api/pay-out-manual/{id}/attachments`            | Upload file đính kèm. Multipart.                              | MAKER (chỉ trên DRAFT/RETURNED)  |
| 14  | GET    | `/api/pay-out-manual/{id}/attachments`            | Danh sách file.                                               | Mọi role được phép xem           |
| 15  | GET    | `/api/pay-out-manual/{id}/attachments/{attachId}` | Download file.                                                | Mọi role được phép xem           |
| 16  | DELETE | `/api/pay-out-manual/{id}/attachments/{attachId}` | Xoá file (soft).                                              | MAKER (chỉ trên DRAFT/RETURNED)  |
| 17  | GET    | `/api/pay-out-manual/{id}/audit-log`              | Lịch sử thao tác (audit + history tab).                       | Mọi role được phép xem           |
| 18  | GET    | `/api/pay-out-manual/{id}/approval-status`        | Workflow stepper (Maker→Checker→Approver).                    | Mọi role được phép xem           |
| 19  | POST   | `/api/pay-out-manual/{id}/validate-ccid`          | Validate tổ hợp COA segments (debounce 300ms từ FE).          | MAKER                            |
| 20  | GET    | `/api/pay-out-manual/lookup/{type}`               | Popup tra cứu danh mục (BANK, USER, DVQHNS, CURRENCY, COA).   | Mọi role                         |

### 2.2. Authentication & Authorization

- **AuthN**: JWT Bearer token. `bff-service` verify signature (HMAC RS256), expiry, issuer.
- **AuthZ**: RBAC theo roles trong JWT claim `roles[]`. Mỗi endpoint mark required role(s).
- **Permission codes** (đề xuất từ INC-G-06):

  ```
  PAY.OUT.MANUAL.CREATE / .READ / .UPDATE / .DELETE
  PAY.OUT.MANUAL.SUBMIT
  PAY.OUT.MANUAL.CHECK / .APPROVE / .RETURN / .REJECT
  PAY.OUT.MANUAL.EXPORT / .PRINT
  PAY.OUT.MANUAL.VIEW_PII / .EXPORT_PII
  ```

- **Standard headers**:

  | Header              | Bắt buộc cho                | Mục đích                        |
  | ------------------- | --------------------------- | ------------------------------- |
  | `Authorization`     | Mọi endpoint                | JWT Bearer                      |
  | `X-Idempotency-Key` | POST / PUT / DELETE         | Idempotency UUID v4 (ADR-0005)  |
  | `If-Match`          | PUT / DELETE / state action | ETag = F-VER (ADR-0004)         |
  | `X-Request-Id`      | Mọi endpoint                | Trace correlation (audit + log) |

### 2.3. Error Response Format

```json
{
  "traceId": "req_abc123",
  "timestamp": "2026-05-19T09:00:00+07:00",
  "code": "MSG-ERR-LOCK",
  "message": "Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại.",
  "details": [{ "field": "F-VER", "yourVersion": 3, "currentVersion": 5 }]
}
```

Mã code khớp với danh mục §A9 của spec (29 message codes).

---

## Section 3. Database Design (Summary)

> Chi tiết DDL đầy đủ tại `features/FT-001/03-schema.sql`. Phần này tóm tắt cấu trúc và quyết định.

### 3.1. Danh sách Tables

| Bảng                       | Mục đích                                                           | Sống động?                   |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| `LTT_PAY_ORDER`            | Bảng cha — Lệnh thanh toán (header, 4 tab thông tin).              | Mutable (CRUD + soft-delete) |
| `LTT_PAY_ORDER_LINE`       | Chi tiết khoản mục COA (12 segments + amount) — 1-N với header.    | Mutable                      |
| `LTT_PAY_ORDER_ATTACHMENT` | File đính kèm — 1-N với header. Soft-delete (`is_deleted`).        | Mutable                      |
| `LTT_PAY_ORDER_APPROVAL`   | Lịch sử workflow (mỗi action: submit/check/approve/return/reject). | Append-only                  |
| `LTT_AUDIT_LOG`            | Audit hash-chain (ADR-0003) — toàn bộ entity types.                | Append-only (DBA-protected)  |
| `LTT_IDEMPOTENCY_STORE`    | Lưu Idempotency-Key + response cache (ADR-0005). TTL 24h.          | TTL cleanup                  |
| `LTT_REF_NO_SEQUENCE`      | Bảng phụ trợ sinh REF_NO atomic per `(kbnn_id, year_month)`.       | Mutable                      |
| `SEQ_LTT_AUDIT_LOG`        | Oracle Sequence cho audit_log.id.                                  | Sequence                     |

### 3.2. Quyết định thiết kế quan trọng

#### 3.2.1. `F-ID = UUID (VARCHAR2(36))`

Giải quyết INC-G-01. Lý do:

- **Tách biệt khỏi REF_NO**: REF_NO có ý nghĩa nghiệp vụ, F-ID là khoá kỹ thuật → tách 2 concern.
- **Distributed-friendly**: Không phụ thuộc Oracle sequence, có thể generate ở `ltt-service` mà không cần round-trip DB.
- **Sinh phía application**: `UUID.randomUUID()` Java standard, không cần DB hỗ trợ.

#### 3.2.2. `REF_NO` auto-generate pattern `<MaKBNN>-YYYYMM-<seq6>`

Giải quyết INC-G-02 (đã chốt trong SA-Plan). Implement bằng:

- Bảng `LTT_REF_NO_SEQUENCE` với composite key `(kbnn_id, year_month)`, column `last_seq NUMBER(10)`.
- Atomic increment trong transaction: `SELECT ... FOR UPDATE` → `last_seq + 1` → ghép pattern → assign vào `LTT_PAY_ORDER.ref_no`.
- Chạy tại lúc Maker bấm "Tạo mới" (lưu DRAFT), không thay đổi suốt vòng đời record.
- Unique constraint trên `LTT_PAY_ORDER.ref_no` là failsafe phòng trùng (xác suất rất thấp).

> Lưu ý: dùng row-lock thay vì Oracle Sequence vì cần sequence-per-tenant (per KBNN + per month). Oracle Sequence là global.

#### 3.2.3. `F-VER (version)` & Optimistic Lock (ADR-0004)

- Cột `version NUMBER(10) NOT NULL DEFAULT 1`.
- JPA `@Version` trên entity `PayOrderEntity` để auto-handle ở persistence layer.
- Header `If-Match: "<version>"` bắt buộc cho PUT/DELETE/state-action.
- Mismatch → HTTP 409 `MSG-ERR-LOCK` với `currentVersion` trong response.
- Workflow action (submit/check/approve) cũng tăng version (mỗi lần update là 1 step).

#### 3.2.4. `F-AUDIT` — Tách thành các cột rời + table riêng

Không dùng JSON blob. Lưu rời để query/filter dễ:

- Cột trong header: `created_by`, `created_at`, `updated_by`, `updated_at`, `created_ip`, `updated_ip`.
- Cột workflow attribution: `checker_id`, `checker_action_at`, `approver_id`, `approver_action_at`.
- Audit chi tiết oldValue→newValue: ghi vào `LTT_AUDIT_LOG` (hash-chain).

#### 3.2.5. `LTT_AUDIT_LOG` — Hash chain SHA-256

Theo ADR-0003:

- Cột: `id, entity_type, entity_id, action, payload (CLOB JSON), performed_by, performed_at, ip_address, version_before, version_after, prev_hash (VARCHAR2(64)), hash (VARCHAR2(64))`.
- DB-level trigger ngăn UPDATE/DELETE (chỉ INSERT).
- Application user có quyền INSERT only; admin role `AUDIT_ADMIN` không gán cho human trong môi trường thường.
- Verify batch job ngoài scope FT-001 (đã có infrastructure).

#### 3.2.6. SoD enforcement — DB-level CHECK + Application guard

- **Application layer (primary)**: Khi Checker/Approver gọi API, `ltt-service` so sánh `currentUserId` với `created_by`, `checker_id`. Vi phạm → 403 `MSG-ERR-PERMISSION` (BIZ-001).
- **DB-level (defense-in-depth)**: `CHECK (checker_id IS NULL OR checker_id != created_by)` và tương tự cho approver. Bảo đảm dù bypass app layer thì DB cũng từ chối.

#### 3.2.7. Soft Delete

- Không dùng `is_deleted BOOLEAN` riêng — soft delete đã hiển thị bằng `F-STATUS = 'DELETED'`.
- Cột phụ: `delete_reason VARCHAR2(500)`, `deleted_by VARCHAR2(36)`, `deleted_at TIMESTAMP WITH TIME ZONE`.
- LIST query mặc định thêm `WHERE F-STATUS != 'DELETED'`. User tick "Hiển thị DELETED" → bỏ filter (chỉ role cấp cao thấy option).

### 3.3. Quan hệ (ERD textual)

```
LTT_PAY_ORDER (1)
   ├─ (N) LTT_PAY_ORDER_LINE       (FK: order_id)
   ├─ (N) LTT_PAY_ORDER_ATTACHMENT (FK: order_id)
   └─ (N) LTT_PAY_ORDER_APPROVAL   (FK: order_id)  -- workflow timeline

LTT_AUDIT_LOG (entity_type='PAY_ORDER', entity_id=LTT_PAY_ORDER.id) — không FK cứng vì cross-entity
LTT_REF_NO_SEQUENCE (kbnn_id, year_month) — utility table, không FK
LTT_IDEMPOTENCY_STORE (idempotency_key) — utility table, không FK
```

---

## Section 4. Xử lý các ràng buộc kỹ thuật

### 4.1. Optimistic Lock (VAL-15, ADR-0004)

```
Flow:
  GET  /api/pay-out-manual/{id} → 200 OK
       Response-Header: ETag: "3"
       Response-Body:   { id, version: 3, ... }

  PUT  /api/pay-out-manual/{id}
       Request-Header: If-Match: "3"
       Request-Body:   { ..., version: 3 }

  Server:
       BEGIN TX
       SELECT version FROM LTT_PAY_ORDER WHERE id = ? FOR UPDATE   -- row lock
       IF version != If-Match → ROLLBACK + 409 MSG-ERR-LOCK
       UPDATE LTT_PAY_ORDER SET ..., version = version + 1 WHERE id = ?
       COMMIT
```

**Áp dụng cho**: PUT, DELETE, /submit, /check-approve, /approve, /return, /reject.
**Không cần If-Match cho**: GET, POST (create), /copy, /export, attachment upload (vì có Idempotency-Key bảo vệ).

### 4.2. Idempotency (§C2.8, ADR-0005)

```
Flow:
  POST /api/pay-out-manual
       Header: X-Idempotency-Key: <uuid-v4>
       Body:   {...}

  Server:
       1) SELECT * FROM LTT_IDEMPOTENCY_STORE WHERE idempotency_key = ?
       2) IF found AND request_hash == sha256(body):
            → trả lại response cũ (HTTP status + body)
          ELSE IF found AND request_hash != sha256(body):
            → 422 Unprocessable Entity (key đã dùng cho data khác)
          ELSE (not found):
            → execute business logic
            → INSERT INTO LTT_IDEMPOTENCY_STORE (key, hash, status, body, ttl=NOW+24h)
            → return response
```

**Áp dụng cho mọi mutating endpoint**:

- POST `/api/pay-out-manual`
- POST `/api/pay-out-manual/{id}/submit|check-approve|approve|return|reject|copy`
- POST `/api/pay-out-manual/{id}/attachments`

Client `ltt-ui` gen `crypto.randomUUID()` per button-click, reset khi form re-mount.
TTL = 24h, cleanup batch job 1h/lần (out-of-scope FT-001, hạ tầng chung).

### 4.3. Audit Hash Chain (BIZ-007, ADR-0003)

Mỗi mutating action (CREATE/UPDATE/DELETE/SUBMIT/APPROVE/REJECT/RETURN) sinh 1 entry `LTT_AUDIT_LOG`:

```java
hash_i = SHA256(
  prev_hash || entity_type || entity_id || action ||
  user_id || performed_at_micros || payload_json || ip_address
)
```

- `prev_hash` lấy từ entry mới nhất có cùng `entity_id` (lookup table `last_hash_per_entity` cache in-memory để giảm DB roundtrip).
- Entry đầu tiên: `prev_hash = GENESIS_SALT` (constant trong config, không bao giờ lộ).
- `payload` JSON: `{ field: oldValue → newValue, version_before, version_after }`.
- INSERT trong cùng transaction với business update → đảm bảo audit consistency.
- DB trigger `BEFORE UPDATE/DELETE ON LTT_AUDIT_LOG FOR EACH ROW RAISE_APPLICATION_ERROR(-20001, 'Audit log is immutable')`.

### 4.4. SoD Enforcement (BIZ-001, INC-G-17)

**Quy tắc**: Trong cùng record, `created_by ≠ checker_id ≠ approver_id` (3 user khác nhau), bất kể user assignment role nào.

**Implementation 3 lớp**:

1. **JWT / Token verification (bff-service)**: Endpoint `/check-approve` chỉ accept user có role `CHECKER`.
2. **Application guard (ltt-service)**: Trước khi chuyển trạng thái, đọc `created_by` (và `checker_id` nếu là approve step), so sánh với `currentUserId`. Vi phạm → 403 `MSG-ERR-PERMISSION` + audit log `SECURITY_VIOLATION`.
3. **DB CHECK constraint**: `CHECK (checker_id IS NULL OR checker_id <> created_by)`, `CHECK (approver_id IS NULL OR (approver_id <> created_by AND approver_id <> checker_id))`. Đây là failsafe defense-in-depth.

### 4.5. REF_NO Auto-generation (INC-G-02)

```sql
-- Lúc Maker tạo mới (DRAFT), trong cùng transaction với INSERT LTT_PAY_ORDER:

DECLARE
  v_kbnn        VARCHAR2(10) := :kbnnId;
  v_yyyymm      VARCHAR2(6) := TO_CHAR(SYSDATE, 'YYYYMM');
  v_next_seq    NUMBER(10);
  v_ref_no      VARCHAR2(20);
BEGIN
  MERGE INTO LTT_REF_NO_SEQUENCE t
  USING (SELECT v_kbnn AS kbnn_id, v_yyyymm AS year_month FROM dual) s
  ON (t.kbnn_id = s.kbnn_id AND t.year_month = s.year_month)
  WHEN MATCHED THEN UPDATE SET t.last_seq = t.last_seq + 1
  WHEN NOT MATCHED THEN INSERT (kbnn_id, year_month, last_seq) VALUES (s.kbnn_id, s.year_month, 1);

  SELECT last_seq INTO v_next_seq
    FROM LTT_REF_NO_SEQUENCE
    WHERE kbnn_id = v_kbnn AND year_month = v_yyyymm;

  v_ref_no := v_kbnn || '-' || v_yyyymm || '-' || LPAD(v_next_seq, 6, '0');
  -- Gán vào LTT_PAY_ORDER.ref_no
END;
```

Hoặc tương đương ở Java/JPA layer với pessimistic lock trên `LTT_REF_NO_SEQUENCE` row. Trong implementation Java, sẽ ưu tiên triển khai ở `ltt-service` (không dùng PL/SQL block) để giữ logic ở application layer (theo Hexagonal Architecture).

---

## Section 5. State Machine

### 5.1. Bảy trạng thái MVP

| Trạng thái           | Mô tả                                                   | Editable?       | Visible trong LIST mặc định? |
| -------------------- | ------------------------------------------------------- | --------------- | ---------------------------- |
| `DRAFT`              | Maker mới tạo, có thể sửa/xoá/submit.                   | YES (Maker gốc) | YES                          |
| `READY_FOR_APPROVAL` | Đã Submit, chờ Checker.                                 | NO              | YES                          |
| `PENDING_APPROVER`   | Checker đã duyệt cấp 1, chờ Approver.                   | NO              | YES                          |
| `APPROVED`           | Approver đã duyệt cuối. Final state cho MVP.            | NO              | YES                          |
| `RETURNED_TO_MAKER`  | Checker/Approver trả lại, Maker có thể sửa và resubmit. | YES (Maker gốc) | YES                          |
| `REJECTED`           | Checker/Approver từ chối. Final state. Lý do ≥10.       | NO              | YES                          |
| `DELETED`            | Soft-delete bởi Maker gốc. Có lý do.                    | NO              | NO (cần tick để hiển thị)    |

> **Mock display only**: `TRANSFERRED_TO_GL`, `POSTED` không được implement transition. UI có thể hiển thị label ở badge nếu cần demo nhưng không có endpoint nào set 2 trạng thái này trong MVP.

### 5.2. Transitions Matrix

| #   | Sự kiện (trigger)    | From                          | To                                        | Role được phép    | Guard                                                           |
| --- | -------------------- | ----------------------------- | ----------------------------------------- | ----------------- | --------------------------------------------------------------- |
| 1   | `CREATE`             | (none)                        | `DRAFT`                                   | MAKER             | Valid payload (VAL-01..10)                                      |
| 2   | `UPDATE` (in-place)  | `DRAFT` / `RETURNED_TO_MAKER` | `DRAFT` / `RETURNED_TO_MAKER` (no change) | MAKER (Maker gốc) | F-VER match (VAL-15)                                            |
| 3   | `SUBMIT`             | `DRAFT` / `RETURNED_TO_MAKER` | `READY_FOR_APPROVAL`                      | MAKER (Maker gốc) | Full validation (VAL-01..19) + CCID OK                          |
| 4   | `DELETE` (soft)      | `DRAFT` / `RETURNED_TO_MAKER` | `DELETED`                                 | MAKER (Maker gốc) | reason length ∈ [10, 500] + confirmed=true                      |
| 5   | `CHECK_APPROVE`      | `READY_FOR_APPROVAL`          | `PENDING_APPROVER`                        | CHECKER           | `checker_id != created_by` (SoD)                                |
| 6   | `RETURN_BY_CHECKER`  | `READY_FOR_APPROVAL`          | `RETURNED_TO_MAKER`                       | CHECKER           | `checker_id != created_by` + reason ≥10                         |
| 7   | `REJECT_BY_CHECKER`  | `READY_FOR_APPROVAL`          | `REJECTED`                                | CHECKER           | `checker_id != created_by` + reason ≥10                         |
| 8   | `APPROVE`            | `PENDING_APPROVER`            | `APPROVED`                                | APPROVER          | `approver_id != created_by AND approver_id != checker_id` (SoD) |
| 9   | `RETURN_BY_APPROVER` | `PENDING_APPROVER`            | `RETURNED_TO_MAKER`                       | APPROVER          | SoD + reason ≥10                                                |
| 10  | `REJECT_BY_APPROVER` | `PENDING_APPROVER`            | `REJECTED`                                | APPROVER          | SoD + reason ≥10                                                |

> **Tất cả các transition khác đều bị reject** với HTTP 409 `MSG-ERR-STATUS`. State machine guard được implement trong `domain/PayOrder.java` (pure logic, không phụ thuộc framework).

### 5.3. State Diagram

```
                               ┌──────────────────────────────────┐
                               ▼                                  │
[Start]──CREATE──▶[DRAFT]──SUBMIT──▶[READY_FOR_APPROVAL]──CHECK_APPROVE──▶[PENDING_APPROVER]──APPROVE──▶[APPROVED]
            │   ▲                          │     │                         │      │             │
            │   │RETURN_BY_*               │REJ  │RETURN                   │ REJ  │RETURN       │
            │   │                          ▼     │                         │      │             │ (END — mock only)
            │   └──[RETURNED_TO_MAKER]◀────┘     ▼                         ▼      ▼             ▼
            │                                 [REJECTED]               [REJECTED] [RETURNED_TO_MAKER]
            │
            └──DELETE──▶[DELETED]
```

---

## Section 6. Phụ thuộc & Giới hạn

### 6.1. Phụ thuộc bên ngoài (External Dependencies)

| Dependency               | Trạng thái MVP                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Oracle EBS GL**        | **MOCKED**. Không có integration thực. UI có thể stub label `TRANSFERRED_TO_GL`/`POSTED`.             |
| **IBM MQ trục tích hợp** | **Out of scope MVP**. Phase 2 dùng outbox pattern (ADR-0001) đẩy event qua MQ.                        |
| **CCID Validation**      | Reuse `DMHT_COA_MATRIX` (giả định đã có). COA Validator cache Caffeine theo ADR-0006.                 |
| **AV Scan attachment**   | **Out of scope MVP**. Chỉ check size + extension + magic byte (VAL-09 partial).                       |
| **Email Notification**   | Stub trong MVP — chỉ log ra. In-app notification gửi qua REST `/notifications/inapp` (BIZ-009).       |
| **Period Control GL**    | Lookup qua REST `/gl/periods/current` (giả định endpoint đã có). Validate PAYMENT_DATE trong kỳ OPEN. |

### 6.2. CCID Validation Strategy (Reference ADR-0006)

**Triggering points**:

1. **Real-time (on field change)**: `ltt-ui` debounce 300ms gọi `POST /api/pay-out-manual/{id}/validate-ccid` → server check L1 Caffeine cache → trả `{valid, errors[]}`.
2. **On Submit (final guard)**: `ltt-service` re-validate toàn bộ lines trước khi đổi state sang `READY_FOR_APPROVAL`. Bypass FE không vượt được server validation.

**Cache layer**: MVP dùng Caffeine L1 only (in-process). Redis L2 là enhancement Phase 2.

**TTL**: 30 phút (L1).

### 6.3. Giới hạn MVP đã chốt (Recap)

- **Tỷ giá ngoại tệ**: User nhập tay, validate > 0 (INC-G-09).
- **Tolerance tổng tiền**: Tolerance = 0 (so khớp tuyệt đối, INC-G-08).
- **Limit/Threshold 500tr**: Hard-code threshold trong config, role Supervisor (INC-A-10).
- **Pessimistic lock**: Không implement. Chỉ optimistic (VAL-15).
- **Async export > 50k**: Không implement. Cap dataset ≤ 50k.
- **Restore DELETED**: Không có UI/API trong MVP.
- **Notification email**: Stub log only.

---

## Section 7. Tóm tắt cập nhật Glossary / Architecture

Trong quá trình thiết kế, các artifact toàn cục đã được/được dự kiến cập nhật:

- `docs/ARCHITECTURE.md`: KHÔNG cần thêm service mới (reuse `bff-service`, `ltt-service`).
- `docs/domain/glossary.md`: ĐÃ có đầy đủ thuật ngữ FT-001 từ BA (Maker/Checker/Approver/RBAC/SoD/Optimistic Lock/Audit Trail...). Không bổ sung thêm trong G2.
- `features/FT-001/04-impact-analysis.md`: SA phải cập nhật Section 2 (System Impact) — sẽ được làm song song với artifact này.

---

## Lịch sử Sửa đổi

- **2026-05-19** | **SA Agent** | FT-001 | Tạo Technical Design v1.0. Chốt: F-ID=UUID, REF_NO auto-gen `<KBNN>-YYYYMM-<seq6>`, PAYMENT_DATE editable, optimistic lock JPA @Version + If-Match, idempotency 24h TTL, audit hash chain SHA-256, SoD 3-layer enforcement, CCID Caffeine L1 only cho MVP.

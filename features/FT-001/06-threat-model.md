# Threat Model — FT-001: PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                                     |
| ------------ | ----------------------------------------------------------- |
| Mã tính năng | FT-001                                                      |
| Phương pháp  | STRIDE                                                      |
| Ngày tạo     | 2026-05-19                                                  |
| Người soạn   | SA Agent                                                    |
| Phiên bản    | 1.0 (MVP)                                                   |
| Tham chiếu   | `02-design.md`, `03-schema.sql`, ADR-0003..0006, `RULES.md` |

---

## 1. Tổng quan (Overview)

### 1.1. Bối cảnh tính năng

FT-001 triển khai module **PAY.OUT.MANUAL — Lệnh Thanh Toán Đi Thủ Công**, bao gồm CRUD + workflow 3 tầng phê duyệt (Maker → Checker → Approver). Đây là nghiệp vụ tài chính nhạy cảm, liên quan trực tiếp đến luồng tiền từ Kho bạc Nhà nước (KBNN). Mọi thao tác đều cần kiểm soát chặt chẽ về mặt phân quyền (SoD), toàn vẹn dữ liệu (optimistic lock, hash chain), và truy vết (audit log append-only).

### 1.2. Phân loại dữ liệu (Data Classification)

| Loại dữ liệu                      | Mức độ nhạy cảm | Ví dụ cột/table                                                                             |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| **PII — Thông tin cá nhân**       | Cao             | `SENDER_IDENTIFY_ID`, `RECEIVER_IDENTIFY_ID` (CMND/CCCD/HC), `SENDER_NAME`, `RECEIVER_NAME` |
| **Tài chính — Số tiền giao dịch** | Cao             | `AMOUNT`, `LINE_AMOUNT`, `EXCHANGE_RATE`, `FN_AMOUNT`                                       |
| **Tài khoản ngân hàng**           | Cao             | `RECEIVER_GL_SEGMENT2` (số TK), `RECEIVER_BANK_CODE`, `SENDER_BANK_CODE`                    |
| **Workflow attribution**          | Trung bình      | `CREATED_BY`, `CHECKER_ID`, `APPROVER_ID`, `*_ACTION_AT`                                    |
| **Chứng từ đính kèm**             | Cao             | `LTT_PAY_ORDER_ATTACHMENT` (file path, hash)                                                |
| **Audit log**                     | Cao             | `LTT_AUDIT_LOG` (old/new value, hash chain)                                                 |
| **Tham chiếu giao dịch**          | Trung bình      | `REF_NO`, `ORIGIN_NUM`                                                                      |

### 1.3. Actors

| Actor          | Mô tả                                              | Trust Level   |
| -------------- | -------------------------------------------------- | ------------- |
| **Maker**      | Kế toán viên — lập lệnh thanh toán                 | Authenticated |
| **Checker**    | Kiểm soát viên — kiểm tra lệnh (cấp 1)             | Authenticated |
| **Approver**   | Lãnh đạo — phê duyệt cuối (cấp 2)                  | Authenticated |
| **Viewer**     | Người tra cứu / Kiểm toán nội bộ                   | Authenticated |
| **Supervisor** | Xử lý lệnh vượt hạn mức                            | Authenticated |
| **Admin DBA**  | Quản trị CSDL — có quyền cao nhất trên DB          | Privileged    |
| **System**     | Batch job (cleanup idempotency, verify hash chain) | Internal      |

---

## 2. Trust Boundaries (Ranh giới Tin cậy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Internet / Intranet                          │
│                                                                     │
│  ┌──────────────┐     TB-1          ┌───────────────┐              │
│  │  Browser      │ ───────────────▶ │  bff-service  │              │
│  │  (ltt-ui)    │   JWT Bearer      │  (REST API)   │              │
│  └──────────────┘   (RS256)         └───────┬───────┘              │
│                                             │                       │
│                                    TB-2     │  mTLS / Service Mesh  │
│                                             ▼                       │
│                                     ┌───────────────┐              │
│                                     │  ltt-service  │              │
│                                     │  (Core Domain)│              │
│                                     └──┬─────┬──────┘              │
│                               TB-3     │     │     TB-4            │
│                          DB auth       │     │   S3-compatible     │
│                                       ▼     ▼   Object Storage    │
│                               ┌──────────┐ ┌──────────┐           │
│                               │ Oracle   │ │ MinIO /  │           │
│                               │ 19c DB   │ │ FS Mount │           │
│                               └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1. Chi tiết Trust Boundaries

| ID   | Trust Boundary                          | Protocol          | Mô tả                                                                                                      |
| ---- | --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| TB-1 | Browser → bff-service                   | HTTPS + JWT RS256 | User gửi JWT Bearer token qua HTTPS. bff-service verify signature, expiry, issuer. Boundary public-facing. |
| TB-2 | bff-service → ltt-service               | REST + mTLS       | Internal service-to-service. Mỗi request forward `X-Request-Id`, user context (userId, role, kbnnId).      |
| TB-3 | ltt-service → Oracle 19c DB             | JDBC + DB auth    | Connection pool riêng, user `LTT_APP_USER` chỉ có quyền DML trên bảng LTT\_\*.\_audit log chỉ INSERT.      |
| TB-4 | ltt-service → Object Storage (MinIO/FS) | S3 API / file I/O | Upload/download attachment. Path: `/ltt/{orderId}/{attachmentId}.{ext}`. Pre-signed URL (Phase 2).         |

---

## 3. STRIDE Analysis

### 3.1. Spoofing (Giả mạo danh tính)

| ID    | Mối đe doạ                                                                                        | Source            | Likelihood | Impact   | Severity   | Mitigation đã triển khai                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------- | ----------------- | ---------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| SP-01 | **JWT token bị đánh cắp và replay** — attacker lấy token qua XSS, network sniffing, hoặc log leak | External Attacker | Medium     | High     | **High**   | JWT có `exp` claim (short-lived access token); HTTPS bắt buộc mọi endpoint; HttpOnly + Secure cookie cho refresh token; kiểm tra `iss`, `aud` claim. |
| SP-02 | **Session hijacking** — attacker chiếm session đang hoạt động của user Maker/Checker/Approver     | External Attacker | Low        | High     | **Medium** | JWT stateless không có server session → không bị session fixation; binding token với IP (tùy chọn, Phase 2).                                         |
| SP-03 | **Giả mạo service identity** — request từ service lạ gửi đến ltt-service                          | Internal Attacker | Low        | High     | **Medium** | mTLS giữa bff-service và ltt-service; service mesh (nếu có) reject certificate không hợp lệ.                                                         |
| SP-04 | **Giả mạo user thông qua JWT manipulation** — attacker sửa claim `roles[]` hoặc `sub` trong JWT   | External Attacker | Low        | Critical | **High**   | JWT ký bằng RS256 (asymmetric) — bff-service verify signature bằng public key; không chấp nhận alg=none.                                             |

### 3.2. Tampering (Thao túng / Sửa đổi dữ liệu)

| ID                                                                        | Mối đe doạ                                                                                           | Source             | Likelihood | Impact     | Severity                                                                                                                                                                                                  | Mitigation đã triển khai                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TM-01                                                                     | **Concurrent edit race condition** — 2 user cùng sửa 1 record, thay đổi bị mất                       | Authenticated User | Medium     | Medium     | **Medium**                                                                                                                                                                                                | Optimistic lock qua cột `VERSION` (ADR-0004); header `If-Match` bắt buộc cho PUT/DELETE/state-action; JPA `@Version` tự tăng; mismatch → HTTP 409 `MSG-ERR-LOCK`.                                                                                  |
| TM-02                                                                     | **API parameter tampering** — attacker sửa `id`, `status`, `amount`, `kbnnId` trong request body/URL | External Attacker  | Medium     | High       | **High**                                                                                                                                                                                                  | Server-side validation toàn bộ payload (VAL-01..19); `status` chỉ thay đổi qua state machine transition (không cho phép set trực tiếp); `kbnnId` lấy từ JWT claim, không tin giá trị client gửi; `amount` kiểm tra `= SUM(line_amount)` (BIZ-004). |
| TM-03                                                                     | **Thao túng workflow state** — cố gắng skip bước Checker, chuyển thẳng từ DRAFT sang APPROVED        | Authenticated User | Low        | Critical   | **High**                                                                                                                                                                                                  | State machine hard-coded trong domain layer `PayOrder.java`; không có endpoint cho phép bỏ bước; SoD guard check `created_by ≠ checker_id ≠ approver_id`.                                                                                          |
| TM-04 **Thao túng REF_NO** — attacker gửi REF_NO giả trong payload CREATE | External Attacker                                                                                    | Low                | High       | **Medium** | REF_NO auto-generate phía server trong transaction (`LTT_REF_NO_SEQUENCE` + `SELECT ... FOR UPDATE`); cột `REF_NO` không nhận giá trị từ client; unique constraint `UK_LTT_PAY_ORDER_REF_NO` là failsafe. |
| TM-05                                                                     | **File đính kèm bị thay thế** — attacker upload file mới ghi đè file cũ                              | Authenticated User | Low        | Medium     | **Low**                                                                                                                                                                                                   | Mỗi attachment có `ID` riêng (UUID); soft-delete (`IS_DELETED=1`) tạo record mới, không ghi đè; `FILE_HASH` SHA-256 lưu trong DB để verify toàn vẹn; path chứa `attachmentId` unique.                                                              |
| TM-06                                                                     | **Idempotency key reuse với data khác** — client gửi cùng key nhưng payload khác                     | Authenticated User | Low        | Medium     | **Low**                                                                                                                                                                                                   | `LTT_IDEMPOTENCY_STORE` lưu `REQUEST_HASH = SHA-256(body)`; nếu key trùng nhưng hash khác → HTTP 422 Unprocessable Entity (ADR-0005).                                                                                                              |

### 3.3. Repudiation (Chối bỏ thao tác)

| ID    | Mối đe doạ                                                                 | Source                | Likelihood | Impact   | Severity | Mitigation đã triển khai                                                                                                                                                                                                                        |
| ----- | -------------------------------------------------------------------------- | --------------------- | ---------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RP-01 | **User phủ nhận đã thực hiện hành động** — "Tôi không hề approve lệnh này" | Authenticated User    | Medium     | High     | **High** | Mọi mutating action sinh entry trong `LTT_AUDIT_LOG` với `performed_by`, `performed_at`, `ip_address`, `user_agent`, `trace_id`. Hash chain SHA-256 (ADR-0003) đảm bảo tính liên tục và không thể chối cãi.                                     |
| RP-02 | **Thao túng audit log** — xóa hoặc sửa audit entry để xoá dấu vết          | Privileged User (DBA) | Low        | Critical | **High** | DB trigger `TRG_LTT_AUDIT_LOG_IMMUTABLE` chặn hoàn toàn UPDATE/DELETE trên `LTT_AUDIT_LOG`; application user `LTT_APP_USER` chỉ có quyền INSERT + SELECT; hash chain phát hiện nếu có bất kỳ entry nào bị cắt ra khỏi chuỗi (verify batch job). |
| RP-03 | **Chối bỏ do thiếu IP/User-Agent** — không đủ bằng chứng kỹ thuật          | N/A                   | Low        | Medium   | **Low**  | Header `X-Request-Id` bắt buộc (trace correlation); `CREATED_IP`, `UPDATED_IP`, `PERFORMED_IP` ghi mọi thao tác; `USER_AGENT` ghi trong audit log.                                                                                              |

### 3.4. Information Disclosure (Rò rỉ thông tin)

| ID    | Mối đe doạ                                                                                                                   | Source             | Likelihood | Impact | Severity   | Mitigation đã triển khai                                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID-01 | **PII exposure — CMND/CCCD, tên, địa chỉ** lộ cho user không có quyền xem                                                    | Authenticated User | Medium     | High   | **High**   | Permission code `PAY.OUT.MANUAL.VIEW_PII` riêng; API response mặc định mask (`***1234`) cho user không có permission; masking thực hiện ở bff-service layer.                                                    |
| ID-02 | **Số tài khoản ngân hàng lộ** — `RECEIVER_GL_SEGMENT2` hiển thị full cho user không cần thiết                                | Authenticated User | Medium     | High   | **High**   | Áp dụng cùng cơ chế masking với ID-01; chỉ hiển thị full khi user có `VIEW_PII` hoặc `EXPORT_PII` permission.                                                                                                   |
| ID-03 | **API response data leakage** — endpoint GET detail trả về quá nhiều trường, bao gồm cả workflow attribution không cần thiết | Authenticated User | Low        | Medium | **Low**    | bff-service map DTO theo role; Maker chỉ thấy trường Maker cần, Checker/Approver thấy thêm comment; audit log endpoint chỉ trả dữ liệu tối thiểu cho user thường.                                               |
| ID-04 | **Attachment truy cập trái phép** — user download file đính kèm của lệnh thuộc KBNN khác                                     | Authenticated User | Low        | High   | **Medium** | API download check `kbnnId` của record vs `kbnnId` trong JWT; ltt-service enforce multi-tenant isolation qua `WHERE kbnn_id = :currentUserKbnnId`; object storage path chứa `orderId` (random UUID) → khó đoán. |
| ID-05 | **Error message lộ internal info** — stack trace, DB structure, internal IP lộ trong error response                          | System             | Medium     | Medium | **Medium** | Global error handler bắt mọi exception; response chỉ trả `{traceId, code, message}` theo format chuẩn (Section 2.3, 02-design.md); không expose stack trace trong production profile.                           |
| ID-06 | **Export file rò rỉ PII** — file Excel/PDF/CSV chứa toàn bộ dữ liệu không mask                                               | Authenticated User | Medium     | High   | **High**   | Endpoint export yêu cầu permission `PAY.OUT.MANUAL.EXPORT_PII` riêng để xuất dữ liệu có PII; export không có PII permission → tự động mask trường nhạy cảm trong output.                                        |
| ID-07 | **Audit log đọc được toàn vẹn** — user tra cứu audit log thấy oldValue/newValue chứa PII của người khác                      | Authenticated User | Low        | Medium | **Low**    | Audit log endpoint chỉ trả dữ liệu của record thuộc `kbnnId` của user; bff-service filter theo scope; PII trong payload JSON audit log được mask nếu user không có `VIEW_PII`.                                  |

### 3.5. Denial of Service (Từ chối dịch vụ)

| ID    | Mối đe doạ                                                                                                                | Source             | Likelihood | Impact | Severity   | Mitigation đã triển khai                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-01 | **Attachment upload abuse** — upload file lớn hoặc số lượng file rất nhiều làm đầy storage                                | Authenticated User | Medium     | Medium | **Medium** | DB constraint `FILE_SIZE <= 10485760` (10MB/file); application limit tổng ≤ 50MB/record (BIZ-005); chỉ cho phép upload khi status = DRAFT/RETURNED_TO_MAKER; validate MIME type + extension + magic byte (VAL-09 partial). |
| DS-02 | **Export large dataset** — request export toàn bộ dữ liệu gây quá tải server                                              | Authenticated User | Low        | Medium | **Low**    | Cap dataset ≤ 50.000 records cho export đồng bộ; request vượt → HTTP 400 + message hướng dẫn thu hẹp filter; async export là Phase 2.                                                                                      |
| DS-03 | **Idempotency store exhaustion** — attacker gửi hàng triệu request với key khác nhau làm đầy bảng `LTT_IDEMPOTENCY_STORE` | External Attacker  | Low        | Low    | **Low**    | TTL 24h + cleanup batch job 1h/lần; bảng không join với table nghiệp vụ → không ảnh hưởng performance query chính; rate limiting ở API gateway (Phase 2).                                                                  |
| DS-04 | **CCID validation spam** — gọi liên tục `/validate-ccid` gây quá tải COA Validator hoặc làm đầy Caffeine cache            | Authenticated User | Low        | Low    | **Low**    | FE debounce 300ms trước khi gọi; Caffeine cache TTL 30 phút, tự eviction; kết quả cache cho identical request.                                                                                                             |

### 3.6. Elevation of Privilege (Leo thang đặc quyền)

| ID                                                                                                     | Mối đe doạ                                                                                                    | Source             | Likelihood | Impact     | Severity                                                                                                                                                                   | Mitigation đã triển khai                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EP-01                                                                                                  | **Maker tự approve lệnh của mình (SoD bypass)** — user có cả role MAKER và CHECKER tự duyệt lệnh mình tạo     | Authenticated User | Medium     | Critical   | **High**                                                                                                                                                                   | SoD enforcement 3 lớp: (1) bff-service kiểm tra role đúng endpoint; (2) ltt-service so sánh `currentUserId` vs `created_by`/`checker_id`; (3) DB CHECK constraint `checker_id <> created_by` và `approver_id <> created_by AND approver_id <> checker_id` (BIZ-001, INC-G-17). |
| EP-02                                                                                                  | **Role escalation qua JWT manipulation** — attacker sửa claim `roles[]` để thêm role APPROVER                 | External Attacker  | Low        | Critical   | **High**                                                                                                                                                                   | JWT RS256 signature — không thể forge không có private key; bff-service verify signature + issuer; claim `roles[]` được trust vì do IdP ký; không cho phép client-side role override.                                                                                          |
| EP-03                                                                                                  | **Cross-tenant data access** — user KBNN_A truy cập dữ liệu KBNN_B                                            | Authenticated User | Medium     | High       | **High**                                                                                                                                                                   | Mọi query thêm `WHERE kbnn_id = :currentUserKbnnId`; `kbnnId` lấy từ JWT claim (không tin query param); bff-service inject `kbnnId` vào mọi request xuống ltt-service; API không cho phép filter theo `kbnnId` khác.                                                           |
| EP-04                                                                                                  | **Action trên trạng thái không hợp lệ** — Checker cố approve lệnh đang DRAFT (skip Submit)                    | Authenticated User | Low        | High       | **Medium**                                                                                                                                                                 | State machine hard-coded reject mọi transition không hợp lệ → HTTP 409 `MSG-ERR-STATUS`; domain layer kiểm tra trước khi cho phép action; không có endpoint "universal state change".                                                                                          |
| EP-05 **Privilege qua copy** — Maker copy một lệnh APPROVED và tự submit + approve (nếu có multi-role) | Authenticated User                                                                                            | Low                | High       | **Medium** | Lệnh copy luôn tạo ở trạng thái DRAFT; phải đi qua full workflow Maker→Checker→Approver; SoD check áp dụng trên lệnh mới; `created_by` của lệnh mới = user thực hiện copy. |
| EP-06                                                                                                  | **Attachment delete trên lệnh đã Submit** — Maker cố xóa file đính kèm sau khi đã submit để che giấu chứng từ | Authenticated User | Low        | High       | **Medium**                                                                                                                                                                 | API chỉ cho phép delete attachment khi status = DRAFT hoặc RETURNED_TO_MAKER; state machine guard chặn ở application layer; soft-delete preserve audit trail.                                                                                                                  |

---

## 4. Risk Assessment (Đánh giá Rủi ro)

### 4.1. Ma trận Severity

|                        | **Impact: Low** | **Impact: Medium** | **Impact: High** | **Impact: Critical** |
| ---------------------- | --------------- | ------------------ | ---------------- | -------------------- |
| **Likelihood: High**   | Medium          | High               | Critical         | Critical             |
| **Likelihood: Medium** | Low             | Medium             | High             | Critical             |
| **Likelihood: Low**    | Low             | Low                | Medium           | High                 |

### 4.2. Tổng hợp xếp hạng theo mức độ nghiêm trọng

#### Critical / High — Phải giải quyết trước Go-live

| ID    | Mối đe doạ                           | Severity | Trạng thái Mitigation                                  |
| ----- | ------------------------------------ | -------- | ------------------------------------------------------ |
| SP-01 | JWT token bị đánh cắp và replay      | High     | Da triển khai — HTTPS + short-lived JWT                |
| SP-04 | Giả mạo user qua JWT manipulation    | High     | Da triển khai — RS256 signature                        |
| TM-02 | API parameter tampering              | High     | Da triển khai — server-side validation + state machine |
| TM-03 | Thao túng workflow state (skip bước) | High     | Da triển khai — state machine + SoD guard              |
| RP-01 | User phủ nhận hành động              | High     | Da triển khai — audit hash chain                       |
| RP-02 | Thao túng audit log                  | High     | Da triển khai — DB trigger + hash chain                |
| ID-01 | PII exposure (CMND/CCCD)             | High     | Da triển khai — VIEW_PII permission + masking          |
| ID-02 | So tai khoan lộ                      | High     | Da triển khai — masking + permission                   |
| ID-06 | Export file rò rỉ PII                | High     | Da triển khai — EXPORT_PII permission                  |
| EP-01 | Maker tự approve (SoD bypass)        | High     | Da triển khai — 3-layer enforcement                    |
| EP-02 | Role escalation qua JWT              | High     | Da triển khai — RS256 + issuer verify                  |
| EP-03 | Cross-tenant data access             | High     | Da triển khai — kbnnId isolation                       |

#### Medium — Nên xử lý trong MVP nếu nguồn lực cho phép

| ID    | Mối đe doạ                            | Severity | Trạng thái Mitigation                 |
| ----- | ------------------------------------- | -------- | ------------------------------------- |
| SP-02 | Session hijacking                     | Medium   | Da triển khai — JWT stateless         |
| SP-03 | Giả mạo service identity              | Medium   | Da triển khai — mTLS                  |
| TM-01 | Concurrent edit race condition        | Medium   | Da triển khai — optimistic lock       |
| TM-04 | Thao túng REF_NO                      | Medium   | Da triển khai — server-side gen       |
| ID-04 | Attachment truy cập trái phép         | Medium   | Da triển khai — kbnnId check          |
| ID-05 | Error message lộ internal info        | Medium   | Da triển khai — global error handler  |
| EP-04 | Action trên trạng thái không hợp lệ   | Medium   | Da triển khai — state machine         |
| EP-05 | Privilege qua copy                    | Medium   | Da triển khai — DRAFT + full workflow |
| EP-06 | Attachment delete trên lệnh đã Submit | Medium   | Da triển khai — status guard          |
| DS-01 | Attachment upload abuse               | Medium   | Da triển khai — size limit + MIME     |

#### Low — Chấp nhận rủi ro trong MVP, theo dõi

| ID    | Mối đe doạ                          | Severity | Trạng thái Mitigation               |
| ----- | ----------------------------------- | -------- | ----------------------------------- |
| TM-05 | File đính kèm bị thay thế           | Low      | Da triển khai — UUID + SHA-256      |
| TM-06 | Idempotency key reuse với data khác | Low      | Da triển khai — REQUEST_HASH check  |
| RP-03 | Chối bỏ do thiếu IP/User-Agent      | Low      | Da triển khai — header logging      |
| ID-03 | API response data leakage           | Low      | Da triển khai — DTO per role        |
| ID-07 | Audit log PII rò rỉ                 | Low      | Da triển khai — scope filter        |
| DS-02 | Export large dataset                | Low      | Da triển khai — cap 50k records     |
| DS-03 | Idempotency store exhaustion        | Low      | Da triển khai — TTL + cleanup batch |
| DS-04 | CCID validation spam                | Low      | Da triển khai — debounce + cache    |

---

## 5. Mitigations Already Implemented (Mitigation đã triển khai)

### 5.1. Mapping: Threat → Mitigation → Thiết kế

| Lớp bảo vệ                      | Mitigation                                                                                                                                                        | Threat IDs đã cover        | Tham chiếu thiết kế                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------- |
| **Authentication (JWT RS256)**  | Verify signature, expiry, issuer, audience; short-lived access token                                                                                              | SP-01, SP-04, EP-02        | 02-design.md Section 2.2                                  |
| **Authorization (RBAC)**        | Role-based endpoint guard trong bff-service; permission codes phân tách (`VIEW_PII`, `EXPORT_PII`)                                                                | ID-01, ID-02, ID-06, EP-04 | 02-design.md Section 2.2                                  |
| **Segregation of Duties (SoD)** | 3-layer enforcement: (1) JWT role check, (2) application guard, (3) DB CHECK constraint `checker_id <> created_by`, `approver_id <> created_by AND <> checker_id` | EP-01, TM-03               | 02-design.md Section 4.4, 03-schema.sql CK constraints    |
| **Optimistic Lock**             | Cột `VERSION NUMBER(10)` + JPA `@Version` + `If-Match` header; HTTP 409 khi conflict                                                                              | TM-01                      | 02-design.md Section 4.1, ADR-0004                        |
| **State Machine**               | Hard-coded transitions trong domain layer `PayOrder.java`; reject mọi transition không hợp lệ                                                                     | TM-03, EP-04, EP-06        | 02-design.md Section 5                                    |
| **Audit Hash Chain**            | `LTT_AUDIT_LOG` append-only; SHA-256(prev_hash \|\| data); DB trigger chặn UPDATE/DELETE; verify batch job                                                        | RP-01, RP-02               | 02-design.md Section 4.3, ADR-0003, 03-schema.sql trigger |
| **Multi-tenant Isolation**      | Mọi query thêm `WHERE kbnn_id = :currentUserKbnnId`; `kbnnId` từ JWT claim                                                                                        | EP-03, ID-04               | 03-schema.sql column KBNN_ID                              |
| **Idempotency**                 | `X-Idempotency-Key` UUID v4; `LTT_IDEMPOTENCY_STORE` với `REQUEST_HASH`; TTL 24h                                                                                  | TM-06, DS-03               | 02-design.md Section 4.2, ADR-0005                        |
| **PII Masking**                 | bff-service mask PII theo permission; permission `VIEW_PII` / `EXPORT_PII` riêng                                                                                  | ID-01, ID-02, ID-06, ID-07 | 02-design.md Section 2.2                                  |
| **File Attachment Security**    | Size limit 10MB/file (DB CHECK), 50MB/record (app); MIME + extension + magic byte validation; SHA-256 hash per file                                               | DS-01, TM-05               | 03-schema.sql `CK_LTT_PAY_ORDER_ATTACH_SIZE`              |
| **REF_NO Server-side Gen**      | Auto-generate trong transaction; `LTT_REF_NO_SEQUENCE` + row-level lock; unique constraint failsafe                                                               | TM-04                      | 02-design.md Section 4.5, 03-schema.sql                   |
| **mTLS Service Mesh**           | Internal service-to-service communication qua mTLS; certificate validation                                                                                        | SP-03                      | 02-design.md Section 1.1                                  |
| **Global Error Handling**       | Structured error response `{traceId, code, message}`; không lộ stack trace                                                                                        | ID-05                      | 02-design.md Section 2.3                                  |
| **Export Cap**                  | Giới hạn 50.000 records cho export đồng bộ; từ chối request vượt                                                                                                  | DS-02                      | 02-design.md Section 6.3                                  |

### 5.2. Defense-in-Depth Summary

Nhiều mối đe doạ được bảo vệ bởi **nhiều lớp** (defense-in-depth). Ví dụ điển hình:

- **SoD (EP-01)**: JWT role (Layer 1) → Application guard (Layer 2) → DB CHECK constraint (Layer 3). Kẻ tấn công phải vượt cả 3 lớp.
- **Audit integrity (RP-01, RP-02)**: Application ghi hash chain (Layer 1) → DB trigger chặn sửa/xóa (Layer 2) → Verify batch job phát hiện chain break (Layer 3).
- **Data tampering (TM-02)**: Input validation (Layer 1) → State machine guard (Layer 2) → DB CHECK constraints (Layer 3) → Audit log ghi oldValue/newValue (Layer 4).

---

## 6. Residual Risks (Rủi ro còn lại trong MVP)

Các rủi ro sau được xác nhận là **không có mitigation hoàn chỉnh trong phạm vi MVP** nhưng được chấp nhận vì lý do thời gian hoặc phụ thuộc hạ tầng:

| ID    | Rủi ro còn lại                                                       | Lý do chấp nhận trong MVP                                               | Impact | Giám sát tạm thời                                                        |
| ----- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| RR-01 | **Không có Anti-Virus scan cho file upload**                         | AV scan phụ thuộc hạ tầng chung, chưa sẵn sàng (INC dependency #14)     | Medium | Validate MIME type + extension + magic byte; hạn chế file type whitelist |
| RR-02 | **Không có rate limiting ở API layer**                               | API Gateway (IBM Datapower) chưa cấu hình trong MVP test nội bộ         | Medium | Application-level throttling cơ bản (nếu cần)                            |
| RR-03 | **Không có pre-signed URL cho attachment download**                  | Object storage (MinIO) dùng direct path; không có time-limited URL      | Low    | Attachment path chứa UUID → khó đoán; kbnnId check                       |
| RR-04 | **Hash chain verify batch job chưa implement trong FT-001**          | Verify job là hạ tầng dùng chung, ngoài scope FT-001                    | Low    | Trigger `TRG_LTT_AUDIT_LOG_IMMUTABLE` là failsafe                        |
| RR-05 | **Không có brute-force protection trên API login**                   | SSO xử lý bởi VDBAS platform, ngoài scope FT-001                        | Low    | Giả định SSO platform có account lockout                                 |
| RR-06 | **Tỷ giá ngoại tệ do user nhập tay — không validate nguồn ngoại bộ** | INC-G-09 chốt cho MVP: manual input; không tích hợp API tỷ giá          | Low    | Validate `EXCHANGE_RATE > 0`; checker/approver review                    |
| RR-07 | **Attachment không mã hoá tại rest (encryption at rest)**            | Object storage on-prem; mã hoá phụ thuộc hạ tầng storage                | Medium | Network isolation + access control; file path chứa UUID                  |
| RR-08 | **Không có audit log cho thao tác đọc (read access log)**            | MVP chỉ audit mutating action; audit GET request tạo khối lượng log lớn | Low    | Bổ sung trong Phase 2 nếu yêu cầu kiểm toán                              |

---

## 7. Recommendations for Phase 2 (Đề xuất giai đoạn sau)

| ID     | Đề xuất                                         | Ưu tiên | Mối đe doạ liên quan | Mô tả chi tiết                                                                                                                                               |
| ------ | ----------------------------------------------- | ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PH2-01 | **Tích hợp Anti-Virus scan file upload**        | High    | DS-01                | Scan file bằng ClamAV hoặc tương đương trước khi lưu vào object storage. Reject file infected. Có thể triển khai async (scan sau, quarantine nếu phát hiện). |
| PH2-02 | **API Rate Limiting + Throttling**              | High    | DS-03, DS-04         | Cấu hình trên API Gateway (IBM Datapower): rate limit per user/IP per endpoint. Đặc biệt cho upload, export, validate-ccid.                                  |
| PH2-03 | **Pre-signed URL cho attachment download**      | High    | ID-04, RR-03         | Sinh URL có thời hạn (15-30 phút) thay vì direct path. Giảm rủi ro link sharing, kiểm soát truy cập thời gian thực.                                          |
| PH2-04 | **Attachment encryption at rest**               | Medium  | RR-07                | Mã hoá AES-256 file khi lưu, decrypt khi download. Key management bằng Vault hoặc KMS on-prem.                                                               |
| PH2-05 | **Read access audit log**                       | Medium  | RR-08                | Ghi log truy cập PII (CMND/CCCD, số TK) — ai đã xem, lúc nào. Dùng cho kiểm toán tuân thủ bảo vệ dữ liệu cá nhân.                                            |
| PH2-06 | **Digital signature / OTP cho Approver action** | High    | RP-01, EP-01         | Approver phải ký số hoặc xác nhận OTP trước khi approve lệnh. Tăng tính pháp lý, chống chối bỏ.                                                              |
| PH2-07 | **Automated SoD conflict detection**            | Medium  | EP-01                | Công cụ scan định kỳ phát hiện user có multi-role (Maker + Checker) trên cùng KBNN. Cảnh báo admin.                                                          |
| PH2-08 | **Anomaly detection trên workflow**             | Low     | TM-03, EP-01         | Phát hiện pattern bất thường: approve quá nhanh, cùng IP approve nhiều lệnh, approve ngoài giờ làm việc. Cảnh báo cho Supervisor.                            |
| PH2-09 | **Redis L2 cache cho COA Validator**            | Low     | DS-04                | Caffeine L1 → thêm Redis L2 để giảm load DB khi multiple instance. Theo ADR-0006.                                                                            |
| PH2-10 | **Async export cho dataset > 50k**              | Low     | DS-02                | Background job + notification khi export hoàn thành. Hủy giới hạn 50k.                                                                                       |
| PH2-11 | **Data Loss Prevention (DLP) scan trên export** | Medium  | ID-06                | Scan nội dung export file để phát hiện PII rò rỉ ngoài kênh chính thức.                                                                                      |
| PH2-12 | **Hash chain verification dashboard**           | Medium  | RP-02                | Giao diện admin để verify hash chain integrity, hiển thị chain status, cảnh báo nếu phát hiện断裂 (broken chain).                                            |

---

## Lịch sử Sửa đổi

- **2026-05-19** | **SA Agent** | FT-001 | Tạo Threat Model v1.0. STRIDE analysis: 30 threats, 13 High/Critical mitigated, 8 residual risks accepted, 12 Phase 2 recommendations.

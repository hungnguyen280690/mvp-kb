# Báo cáo Phân tích Tác động (Impact Analysis) — FT-001

Tài liệu này ghi nhận các tác động của tính năng **FT-001 — PAY.OUT.MANUAL (Lệnh thanh toán đi thủ công)** đến hệ thống VDBAS hiện có, giúp đảm bảo tính ổn định và xác định phạm vi kiểm thử hồi quy.

**Mã tính năng:** FT-001
**Phiên bản:** 1.0
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent
**Trạng thái:** Đang chờ SA bổ sung Section 2, Dev bổ sung Section 3, QA bổ sung Section 4.

---

## 1. Business Impact (BA Agent)

_Mục tiêu: Xác định tác động đến quy trình nghiệp vụ và người dùng._

### 1.1. Quy trình nghiệp vụ bị tác động

| #   | Quy trình                                             | Trạng thái hiện tại                                                   | Thay đổi do FT-001                                                                                                                          | Mức độ                 |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | **Quy trình lập & duyệt Lệnh thanh toán đi tại KBNN** | Đang được thực hiện thủ công (giấy + Excel) hoặc trên hệ thống legacy | **Số hoá hoàn toàn** theo quy trình Maker → Checker → Approver trên VDBAS. Audit log đầy đủ, notification tự động.                          | **Cao** (Core feature) |
| 2   | **Quy trình kiểm soát ngân sách (COA / CCID)**        | Kiểm tra thủ công, dễ sai sót khi áp tổ hợp segment                   | Validate **CCID Cross-Validation Rule** tự động ở client + server trước khi cho Submit; chặn ngay tổ hợp không hợp lệ.                      | **Cao**                |
| 3   | **Quy trình đối soát số liệu cuối kỳ**                | Đối soát thủ công từ chứng từ giấy                                    | Sau MVP, dữ liệu thanh toán trên VDBAS sẽ là nguồn cấp cho đối soát; ngắn hạn vẫn giữ song song với hệ thống cũ trong thời gian chuyển đổi. | **Trung bình**         |
| 4   | **Quy trình lưu trữ chứng từ**                        | Lưu giấy/PDF rời rạc                                                  | Đính kèm điện tử (`pdf/jpg/png/docx/xlsx`, ≤10MB/file, ≤50MB/bản ghi) gắn trực tiếp với lệnh thanh toán; tính SHA-256 chống trùng/giả mạo.  | **Trung bình**         |
| 5   | **Quy trình xử lý lệnh bị trả lại / từ chối**         | Email/giấy thông báo Maker chỉnh sửa                                  | Notification in-app + email tự động; trạng thái `RETURNED_TO_MAKER` / `REJECTED` rõ ràng trong workflow; lý do bắt buộc ≥ 10 ký tự.         | **Trung bình**         |
| 6   | **Quy trình xoá / huỷ lệnh**                          | Xoá vật lý hoặc gạch chéo trên giấy                                   | **Soft-delete** bắt buộc — bản ghi vẫn truy được qua audit; cần lý do + tick checkbox xác nhận.                                             | **Cao** (Compliance)   |

### 1.2. Vai trò / Người dùng bị tác động

| Vai trò                                                         | Công việc hàng ngày thay đổi                                                                                                                                          | Mức độ training cần thiết                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Maker** (Người lập — Kế toán viên)                            | Chuyển từ lập chứng từ thủ công sang nhập trên form VDBAS 4 tab; phải hiểu state machine để biết khi nào Sửa được/Submit được; làm quen với CCID và validate tự động. | **Cao** — cần đào tạo thao tác chi tiết, ít nhất 1 buổi/người. |
| **Checker** (Người kiểm soát — Kiểm soát viên)                  | Nhận notification, vào màn `PAY.OUT.MANUAL.APPROVE` để kiểm soát; có 3 lựa chọn rõ ràng: Phê duyệt / Trả lại / Từ chối; lý do bắt buộc.                               | **Trung bình** — quy trình mới nhưng tương đối trực quan.      |
| **Approver** (Người phê duyệt — Lãnh đạo)                       | Tương tự Checker, là cấp duyệt cuối; chịu trách nhiệm pháp lý với lệnh APPROVED. Có thể cần ký số/OTP ở các phase sau.                                                | **Trung bình** — chủ yếu cần training thao tác UI.             |
| **Viewer** (Người tra cứu — Kiểm toán nội bộ, Lãnh đạo cấp cao) | Có công cụ tra cứu/export mới; có thể giảm phụ thuộc vào việc xin số liệu từ Maker/Checker.                                                                           | **Thấp** — chủ yếu là dùng tính năng tra cứu.                  |
| **Supervisor** (Giám sát)                                       | Vai trò mới được định nghĩa cho MVP để xử lý các lệnh vượt hạn mức (BIZ-010).                                                                                         | **Trung bình** — cần định nghĩa SOP rõ.                        |
| **Quản trị hệ thống (Admin)**                                   | Phải cấu hình master data đầy đủ (LOV.01..07, CCID, hạn mức, RBAC) trước khi go-live.                                                                                 | **Cao** — cần đào tạo cấu hình.                                |

### 1.3. Tài liệu / Báo cáo bị tác động

| #   | Tài liệu / Báo cáo                                   | Tác động                                                                                                 | Ghi chú                                                    |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Sổ chi tiết Lệnh thanh toán**                      | **Nguồn dữ liệu thay đổi**: lấy từ DB VDBAS thay vì Excel/giấy.                                          | Định dạng output có thể thay đổi theo template Export mới. |
| 2   | **Báo cáo tổng hợp giao dịch theo ngày/đơn vị/kênh** | Có thể sinh tự động bằng Export hoặc qua module Báo cáo (Phase 2).                                       | MVP chỉ có chức năng Export tại `PAY.OUT.MANUAL.LIST`.     |
| 3   | **Báo cáo audit/kiểm toán nội bộ**                   | **Có thêm dữ liệu** từ audit log của FT-001 (`PAY.OUT.MANUAL.AUDIT.WRITE`).                              | Module kiểm toán nội bộ cần biết cấu trúc audit log mới.   |
| 4   | **Phiếu in chứng từ thanh toán**                     | Có template mới (Mẫu chuẩn / Mẫu rút gọn / Mẫu LNH / Mẫu TTSP) — sinh tự động từ `PAY.OUT.MANUAL.PRINT`. | Cần xác nhận template với phía Nghiệp vụ KBNN.             |
| 5   | **Báo cáo phục vụ thanh tra/kiểm tra**               | Dữ liệu có thêm trường audit chi tiết (oldValue→newValue) — tăng độ tin cậy.                             | Tích cực, không yêu cầu thay đổi format.                   |
| 6   | **Sổ cái kế toán (GL)**                              | **MVP CHƯA tích hợp** — sẽ có ở Phase 2 khi nối với Oracle EBS.                                          | Out of scope.                                              |

### 1.4. Rủi ro Nghiệp vụ (Business Risks)

| Mã          | Rủi ro                                                    | Mức độ         | Tác động nếu xảy ra                                                         | Đề xuất giảm thiểu (Mitigation)                                                                 |
| ----------- | --------------------------------------------------------- | -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **R-BA-01** | Lệnh thanh toán bị APPROVED dù dữ liệu sai (validate yếu) | **Cao**        | Chi sai địa chỉ, sai đơn vị thụ hưởng → tổn thất tài chính, rủi ro pháp lý. | Tuân thủ đầy đủ 19 quy tắc VAL-\*, đặc biệt VAL-19 (CCID); kiểm thử negative case đầy đủ.       |
| **R-BA-02** | Maker tự duyệt lệnh của chính mình (vi phạm SoD)          | **Cao**        | Vi phạm BIZ-001, có thể dẫn đến gian lận/trục lợi.                          | Server-side check bắt buộc: Maker ≠ Checker ≠ Approver. Test case bảo mật riêng.                |
| **R-BA-03** | Bản ghi DELETED bị mất hoàn toàn (xoá cứng nhầm)          | **Cao**        | Vi phạm BIZ-003, mất bằng chứng nghiệp vụ, không truy được audit.           | Bắt buộc soft-delete; UI và backend cùng chặn xoá cứng; có script verify định kỳ.               |
| **R-BA-04** | Lệnh bị thao tác đồng thời, mất thay đổi (race condition) | **Trung bình** | Maker A và B cùng sửa, mất thay đổi của một bên.                            | VAL-15 Optimistic lock (`F-ID`, `F-VER`); MSG-ERR-LOCK yêu cầu tải lại.                         |
| **R-BA-05** | Vượt hạn mức không được phát hiện                         | **Trung bình** | Chi vượt thẩm quyền → vi phạm phân cấp duyệt.                               | VAL-12: warning vàng + bắt buộc phê duyệt cấp cao hơn (Supervisor / Approver cấp cao).          |
| **R-BA-06** | Lộ thông tin nhạy cảm (CMND/CCCD/Số TK)                   | **Trung bình** | Vi phạm pháp luật bảo vệ dữ liệu cá nhân.                                   | Masking mặc định cho user không có `VIEW_PII`; audit truy cập trường nhạy cảm.                  |
| **R-BA-07** | Audit log bị thao túng / xoá                              | **Cao**        | Mất khả năng truy vết, không tuân thủ kiểm toán.                            | Audit log append-only; backup định kỳ; phân quyền chặt (chỉ Admin xem, không ai sửa).           |
| **R-BA-08** | Notification không tới Checker/Approver → lệnh treo       | **Trung bình** | Chậm tiến độ thanh toán, ảnh hưởng đối tác.                                 | Cơ chế retry notification + dashboard pending; in-app notification làm fallback nếu email hỏng. |
| **R-BA-09** | Nghiệp vụ chuyển đổi từ legacy → VDBAS có gap             | **Trung bình** | Dữ liệu lệnh cũ chưa migrate, song song hai hệ thống dễ sai.                | Có kế hoạch migration / song hành rõ ràng do Project Manager (ngoài MVP).                       |
| **R-BA-10** | User thao tác sai do UI không trực quan                   | **Thấp**       | Tăng tỷ lệ Returned_to_Maker, giảm hiệu suất.                               | Tuân thủ `VDBAS_UIUX_Rule.md`; training; có tooltip/help inline.                                |

### 1.5. Phụ thuộc (Dependencies)

#### 1.5.1. Phụ thuộc Module / Phân hệ nội bộ VDBAS

| #   | Module / Phân hệ                                                | Loại phụ thuộc         | Mô tả                                                                                           |
| --- | --------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **Nền tảng Quản trị dùng chung — Xác thực tập trung (SSO/MFA)** | Bắt buộc               | Đăng nhập, lấy thông tin user, vai trò.                                                         |
| 2   | **Phân hệ Quản lý Danh mục (Master Data)**                      | Bắt buộc               | Cung cấp các LOV.01..07 (Channel, Bank, Branch, Currency, Expense, Payment Type, COA Segments). |
| 3   | **Phân hệ GL — Period Control**                                 | Bắt buộc               | Kiểm tra kỳ kế toán OPEN/CLOSED (VAL-08).                                                       |
| 4   | **Phân hệ GL — COA / CCID Setup**                               | Bắt buộc               | Cung cấp cấu hình Cross-Validation Rule (VAL-19).                                               |
| 5   | **Phân hệ Notification (in-app + email)**                       | Bắt buộc               | Gửi thông báo chuyển trạng thái cho user kế tiếp (BIZ-009).                                     |
| 6   | **Phân hệ Audit Log dùng chung**                                | Bắt buộc               | Ghi log thao tác (BIZ-007). Nếu chưa có, MVP cần tự xây bảng audit riêng.                       |
| 7   | **Phân hệ Lưu trữ điện tử (File Storage)**                      | Bắt buộc               | Lưu attachment (≤10MB/file, ≤50MB/bản ghi).                                                     |
| 8   | **Phân hệ Cấu hình Hạn mức (Limit)**                            | Bắt buộc               | VAL-12 — kiểm tra hạn mức theo user/đơn vị/sản phẩm.                                            |
| 9   | **Phân hệ Quản lý Người dùng & Vai trò (RBAC)**                 | Bắt buộc               | Cung cấp roles: `PAY_OUT_MAKER/CHECKER/APPROVER/VIEWER/SUPERVISOR`.                             |
| 10  | **Hệ thống Báo cáo & Kho dữ liệu**                              | Không bắt buộc cho MVP | Phase 2 sẽ dùng dữ liệu lệnh thanh toán để sinh báo cáo tổng hợp.                               |

#### 1.5.2. Phụ thuộc Hệ thống ngoài / Tích hợp

| #   | Hệ thống                             | Loại phụ thuộc                     | Trạng thái MVP                                                                             |
| --- | ------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| 11  | **Oracle EBS — GL (Sổ cái kế toán)** | Sẽ tích hợp ở Phase 2              | **MVP chỉ mock** 2 trạng thái `TRANSFERRED_TO_GL` và `POSTED`.                             |
| 12  | **IBM Datapower (API Gateway)**      | Bắt buộc khi expose API public     | MVP có thể chỉ test nội bộ; API public sẽ tuân theo cấu hình DataPower ở giai đoạn deploy. |
| 13  | **IBM MQ (trục tích hợp)**           | Không bắt buộc MVP                 | Phase 2 — chuyển message sang EBS.                                                         |
| 14  | **Oracle GoldenGate (sync DB)**      | Hạ tầng — không tác động trực tiếp | DBA quản lý replication.                                                                   |
| 15  | **Dịch vụ quét virus (AV)**          | Không bắt buộc MVP                 | MVP chỉ validate kích thước/định dạng/MIME/magic byte.                                     |

#### 1.5.3. Phụ thuộc Tuân thủ / Pháp lý

| #   | Quy định                                                     | Tác động                                                   |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 16  | **Quyết định 4060/QĐ-BTC (Khung kiến trúc số Bộ Tài chính)** | Tuân thủ kiến trúc microservices + nền tảng dùng chung.    |
| 17  | **Quy định ATTT cấp độ + IPv6**                              | Endpoint/DB/Network phải đạt chuẩn ở giai đoạn nghiệm thu. |
| 18  | **Quy định bảo vệ dữ liệu cá nhân**                          | Masking trường nhạy cảm; audit truy cập PII.               |

---

## 2. System Impact (SA Agent)

_Mục tiêu: Xác định tác động đến kiến trúc, API và CSDL._

### 2.1. Dịch vụ (Services) bị ảnh hưởng

| Service                | Loại tác động    | Mô tả                                                                                                                                   |
| ---------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **`bff-service`**      | MỚI (tính năng)  | Thêm 20 REST endpoints mới dưới path `/api/pay-out-manual/**`. Cần: validate JWT, map DTO, aggregate attachment/audit/approval history. |
| **`ltt-service`**      | MỚI (tính năng)  | Thêm domain module `PayOrder` (State Machine, SoD guard, CCID validator, REF_NO generator). Thêm infrastructure JPA + Oracle 19c.       |
| `audit-service`        | REUSE / TÍCH HỢP | Receive event từ `ltt-service` qua outbox pattern (ADR-0001). MVP có thể chạy embedded trong `ltt-service`.                             |
| `master-data-service`  | REUSE (readonly) | Cung cấp lookup LOV.01..07 qua REST `/lookup/{type}`. Không cần thay đổi.                                                               |
| `notification-service` | REUSE (readonly) | Nhận POST `/notifications/inapp` từ `ltt-service` sau mỗi workflow transition. Email: stub log trong MVP.                               |

> `integration-gateway` và `gl-pusher` **Out of scope MVP** — sẽ sử dụng ở Phase 2.

### 2.2. API Endpoints mới

Tổng cộng **20 endpoints** được thêm vào `bff-service`. Chi tiết đầy đủ tại `features/FT-001/contracts/openapi.yaml`.

| #   | Method | Path                                              | Vai trò RBAC bắt buộc         |
| --- | ------ | ------------------------------------------------- | ----------------------------- |
| 1   | POST   | `/api/pay-out-manual`                             | MAKER                         |
| 2   | GET    | `/api/pay-out-manual/{id}`                        | MAKER/CHECKER/APPROVER/VIEWER |
| 3   | PUT    | `/api/pay-out-manual/{id}`                        | MAKER (Maker gốc)             |
| 4   | DELETE | `/api/pay-out-manual/{id}`                        | MAKER (Maker gốc)             |
| 5   | POST   | `/api/pay-out-manual/{id}/submit`                 | MAKER                         |
| 6   | POST   | `/api/pay-out-manual/{id}/check-approve`          | CHECKER                       |
| 7   | POST   | `/api/pay-out-manual/{id}/approve`                | APPROVER                      |
| 8   | POST   | `/api/pay-out-manual/{id}/return`                 | CHECKER/APPROVER              |
| 9   | POST   | `/api/pay-out-manual/{id}/reject`                 | CHECKER/APPROVER              |
| 10  | POST   | `/api/pay-out-manual/{id}/copy`                   | MAKER                         |
| 11  | GET    | `/api/pay-out-manual`                             | MAKER/CHECKER/APPROVER/VIEWER |
| 12  | POST   | `/api/pay-out-manual/export`                      | MAKER/CHECKER/APPROVER/VIEWER |
| 13  | POST   | `/api/pay-out-manual/{id}/attachments`            | MAKER (trên DRAFT/RETURNED)   |
| 14  | GET    | `/api/pay-out-manual/{id}/attachments`            | Mọi role                      |
| 15  | GET    | `/api/pay-out-manual/{id}/attachments/{attachId}` | Mọi role                      |
| 16  | DELETE | `/api/pay-out-manual/{id}/attachments/{attachId}` | MAKER (trên DRAFT/RETURNED)   |
| 17  | GET    | `/api/pay-out-manual/{id}/audit-log`              | Mọi role                      |
| 18  | GET    | `/api/pay-out-manual/{id}/approval-status`        | Mọi role                      |
| 19  | POST   | `/api/pay-out-manual/{id}/validate-ccid`          | MAKER                         |
| 20  | GET    | `/api/pay-out-manual/lookup/{type}`               | Mọi role                      |

### 2.3. Bảng DB mới (Oracle 19c)

| Bảng                       | Loại        | Mô tả                                                                     |
| -------------------------- | ----------- | ------------------------------------------------------------------------- |
| `LTT_PAY_ORDER`            | MỚI         | Bảng header lệnh thanh toán. 7 trạng thái. Optimistic lock + soft-delete. |
| `LTT_PAY_ORDER_LINE`       | MỚI         | Chi tiết khoản mục COA (12 segments). 1-N với LTT_PAY_ORDER.              |
| `LTT_PAY_ORDER_ATTACHMENT` | MỚI         | File đính kèm (metadata). 1-N với LTT_PAY_ORDER.                          |
| `LTT_PAY_ORDER_APPROVAL`   | MỚI         | Lịch sử workflow (append-only). 1-N với LTT_PAY_ORDER.                    |
| `LTT_AUDIT_LOG`            | MỚI / REUSE | Audit hash-chain SHA-256 (ADR-0003). Dùng chung cho toàn bộ entity LTT.   |
| `LTT_IDEMPOTENCY_STORE`    | MỚI / REUSE | Lưu Idempotency-Key + response (ADR-0005). TTL 24h.                       |
| `LTT_REF_NO_SEQUENCE`      | MỚI         | Bảng phụ trợ sinh REF_NO atomic per (kbnn_id, year_month).                |

> Không có bảng nào hiện tại bị thay đổi schema trong MVP này.

### 2.4. Security Impact

| Khía cạnh               | Mô tả                                                                                                                                                                           | Mức độ rủi ro  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **RBAC mới**            | Thêm 5 permission role mới: `PAY_OUT_MAKER`, `PAY_OUT_CHECKER`, `PAY_OUT_APPROVER`, `PAY_OUT_VIEWER`, `PAY_OUT_SUPERVISOR`. Cần cấu hình trong hệ thống RBAC/SSO trước go-live. | **Cao**        |
| **SoD enforcement**     | 3-layer: JWT role check → Application guard `(createdBy ≠ checkerId ≠ approverId)` → DB CHECK constraint. Vi phạm ghi SECURITY_VIOLATION vào audit log.                         | **Cao**        |
| **PII masking**         | Các trường `senderIdentifyId`, `receiverIdentifyId`, `receiverName` cần masking cho user thiếu quyền `PAY.OUT.MANUAL.VIEW_PII`.                                                 | **Trung bình** |
| **Audit chain**         | Mọi thao tác mutating đều sinh entry `LTT_AUDIT_LOG` với SHA-256 hash-chain. DB trigger chặn UPDATE/DELETE trên bảng này (ADR-0003).                                            | **Cao**        |
| **Idempotency**         | `X-Idempotency-Key` bắt buộc cho POST/PUT/DELETE. TTL 24h trong `LTT_IDEMPOTENCY_STORE`. Ngăn double-submit do retry tự động.                                                   | **Trung bình** |
| **Optimistic lock**     | `If-Match` header bắt buộc cho PUT/DELETE/workflow actions. Mismatch trả 409 với `currentVersion`. Ngăn lost-update (ADR-0004).                                                 | **Trung bình** |
| **Attachment security** | Validate MIME type + magic bytes. Giới hạn 10MB/file, 50MB/bản ghi. SHA-256 checksum chống giả mạo. AV scan out-of-scope MVP.                                                   | **Trung bình** |
| **Export PII**          | Export có thể chứa dữ liệu PII. Permission riêng `PAY.OUT.MANUAL.EXPORT_PII` cho phép export đầy đủ. Dataset cap 50k records.                                                   | **Trung bình** |

---

## 3. Code Impact (Dev Agent)

_Mục tiêu: Xác định các thành phần mã nguồn cụ thể cần can thiệp._

**Chờ Dev Agent (Stage 3) bổ sung sau khi SA hoàn thành G2.**

- **Backend (Java):** _(Dev sẽ điền)_
- **Frontend (React):** _(Dev sẽ điền)_
- **Shared Packages:** _(Dev sẽ điền)_
- **Unit/Integration Tests cũ:** _(Dev sẽ điền)_

---

## 4. Regression Test Scope (QA Agent)

_Mục tiêu: Xác định phạm vi kiểm thử hồi quy dựa trên các tác động trên._

**Chờ QA Agent (Stage 4) bổ sung sau khi Dev hoàn thành G3.**

- **Vùng kiểm thử tập trung:** _(QA sẽ điền)_
- **Kịch bản hồi quy (Regression Scenarios):** _(QA sẽ điền)_
- **Dữ liệu kiểm thử hồi quy:** _(QA sẽ điền — tham chiếu `08-test-data.md`)_

---

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Khởi tạo file, hoàn thành Section 1 — Business Impact (quy trình, vai trò, báo cáo, rủi ro, phụ thuộc).
- **2026-05-20** | **SA Agent** | FT-001 | Hoàn thành Section 2 — System Impact (Services, API endpoints, DB tables mới, Security impact).

# Mô hình hóa Mối đe dọa — VDBAS TT.OUT.MANUAL

- **Generated**: 2026-05-10 | SA Stage 2
- **Methodology**: STRIDE (Microsoft Threat Modeling)
- **Phạm vi**: Hệ thống VDBAS TT.OUT.MANUAL — Lệnh thanh toán đi NHNN thủ công
- **Tập trung chính**: Tampering (Sửa đổi) và Replay (Phát lại)
- **Decision makers**: SA Lead + Security Review

---

## Tổng quan Hệ thống

Hệ thống VDBAS TT.OUT.MANUAL xử lý Lệnh thanh toán đi NHNN, bao gồm:
- **4 actors**: Maker, Checker, Approver, Admin
- **5 containers**: React SPA, BFF, LTT Service, Gateway Service, Audit Service
- **5 external systems**: NHNN/CITAD Gateway, GL, TAD-COMM, ECM, IBM MQ
- **Cơ sở dữ liệu**: Oracle 19c (LTT, audit log, outbox, danh mục)

**Ranh giới tin cậy (Trust Boundary)**:
1. Internet → OpenShift Ingress → BFF (ranh giới mạng ngoài)
2. BFF → LTT Service / Audit Service (ranh giới mạng trong cluster)
3. LTT Service → IBM MQ → NHNN/CITAD (ranh giới mạng ngoài, kênh thanh toán)
4. LTT Service → Oracle DB (ranh giới mạng trong data center)
5. LTT Service → TAD-COMM (ranh giới mạng ngoài, kênh ký số)

---

## S — Spoofing (Giả mạo)

### S-01: Giả mạo token JWT để truy cập API

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công đánh cắp JWT token của user hợp lệ (vd: qua XSS, network sniffing) và sử dụng để gửi yêu cầu API giả mạo |
| **Vector tấn công** | XSS trên SPA, MITM trên HTTP (không HTTPS), token storage không an toàn (localStorage thay vì httpOnly cookie) |
| **Tác động** | **HIGH** — Kẻ tấn công có thể tạo, sửa, phê duyệt LTT với danh tính của user khác |
| **Giảm thiểu** | (1) JWT ngắn hạn (15 phút) + refresh token rotation; (2) httpOnly + Secure + SameSite cookie; (3) HTTPS bắt buộc trên mọi endpoint; (4) Token blacklist khi logout; (5) RBAC kiểm tra ở mọi API endpoint |
| **Ánh xạ nguyên tắc** | SoD (BIZ-SOD), Maker-Checker-Approver (BIZ-MAKER-CHECKER) |

### S-02: Giả mạo chứng thư số khi ký LTT

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công sử dụng chứng thư số giả mạo hoặc đã hết hạn để ký LTT, hệ thống không phát hiện |
| **Vector tấn công** | Sử dụng chứng thư stolen, chứng thư tự ký, hoặc replay chữ ký cũ |
| **Tác động** | **HIGH** — LTT được ký bởi người không có thẩm quyền, có thể gửi đi NHNN |
| **Giảm thiểu** | (1) Xác minh chứng thư qua CA chain (TAD-COMM); (2) Kiểm tra expiry date; (3) Kiểm tra certificate revocation (OCSP/CRL); (4) Khớp CN (Common Name) với user identity; (5) Lưu hash chữ ký vào audit chain (ADR-SA-0003) |
| **Ánh xạ nguyên tắc** | BIZ-SIGN-TAD-COMM, ADR-SA-0003 (audit hash chain) |

### S-03: Giả mạo callback từ NHNN/CITAD

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công gửi callback giả mạo đến API-009 (PaymentCallback), làm hệ thống tin rằng NHNN đã xác nhận LTT |
| **Vector tấn công** | HTTP request giả mạo đến `/api/payment/callback` với payload success giả |
| **Tác động** | **HIGH** — LTT chuyển sang CONFIRMED, hạch toán GL cho giao dịch chưa thực sự được xác nhận |
| **Giảm thiểu** | (1) HMAC-SHA256 signature trên callback payload (NHNN ký bằng shared secret); (2) IP whitelist chỉ cho phép NHNN gateway IP; (3) Mutual TLS (mTLS) giữa VDBAS và NHNN; (4) Verify correlationId tồn tại trong DB |
| **Ánh xạ nguyên tắc** | BIZ-RETRY, API-009 |

---

## T — Tampering (Sửa đổi)

### T-01: Sửa đổi LTT trong quá trình truyền

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công chặn và sửa đổi dữ liệu LTT giữa SPA và BFF, hoặc giữa LTT Service và NHNN Gateway |
| **Vector tấn công** | Man-in-the-middle (MITM) trên network path |
| **Tác động** | **HIGH** — Thay đổi số tiền, tài khoản nhận, hoặc thông tin thụ hưởng |
| **Giảm thiểu** | (1) HTTPS (TLS 1.3) bắt buộc trên mọi kết nối; (2) mTLS cho service-to-service; (3) HMAC-SHA256 trên message MQ; (4) Digital signature trên LTT gửi NHNN (TAD-COMM); (5) Payload integrity check bằng SHA-256 hash |
| **Ánh xạ nguyên tắc** | Nguyên tắc bảo mật hai tầng (ADR-0004), BIZ-SIGN-TAD-COMM |

### T-02: Sửa đổi trực tiếp dữ liệu trong Oracle DB

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | DBA hoặc kẻ tấn công có quyền DB trực tiếp UPDATE bản ghi LTT hoặc audit log |
| **Vector tấn công** | Truy cập DB trực tiếp (SQL*Plus, tool quản trị), lợi dụng quyền DBA |
| **Tác động** | **HIGH** — Sửa đổi số tiền LTT, thay đổi trạng thái, xóa audit trail |
| **Giảm thiểu** | (1) **Audit hash chain** (ADR-SA-0003) — mọi sửa đổi đều phá vỡ chuỗi hash; (2) Phân quyền DB nghiêm ngặt (principle of least privilege); (3) Trigger chặn UPDATE/DELETE trên audit_log; (4) Database Activity Monitoring (DAM); (5) Backup offline định kỳ; (6) Separate DBA roles: application user vs audit admin |
| **Ánh xạ nguyên tắc** | Nguyên tắc 4 (Kiểm toán chuỗi Hash), BIZ-AUDIT |

### T-03: Sửa đổi message trên IBM MQ

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công chặn và sửa đổi message LTT trên hàng đợi IBM MQ trước khi đến NHNN hoặc trước khi consumer xử lý |
| **Vector tấn công** | Truy cập MQ admin console, hoặc MITM trên MQ network channel |
| **Tác động** | **HIGH** — Thay đổi nội dung LTT gửi đi NHNN, hoặc thay đổi callback result |
| **Giảm thiểu** | (1) MQ channel encryption (TLS); (2) HMAC signature trên mỗi message; (3) Message integrity check ở consumer (verify hash); (4) MQ ACL chặn user không xác thực; (5) Idempotency key (correlationId) để phát hiện duplicate/tampered message |
| **Ánh xạ nguyên tắc** | ADR-SA-0001 (outbox), ADR-SA-0005 (idempotency), BIZ-RETRY |

### T-04: Sửa đổi LTT ở trạng thái immutable

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công (hoặc bug) cố tình sửa LTT đã SUBMITTED, APPROVED, hoặc POSTED — các trạng thái không cho phép sửa |
| **Vector tấn công** | Bypass frontend validation, gửi API request trực tiếp (curl, Postman) |
| **Tác động** | **MEDIUM** — LTT đã duyệt bị sửa nội dung, vi phạm tính toàn vẹn chứng từ |
| **Giảm thiểu** | (1) **Optimistic lock** (ADR-SA-0004) — version check trên mọi update; (2) Server-side state guard — kiểm tra trạng thái cho phép sửa trước khi update; (3) BIZ-EDIT-IMMUTABLE — backend reject nếu cố đổi immutable fields; (4) Audit diff ghi lại mọi thay đổi (BIZ-EDIT-AUDIT) |
| **Ánh xạ nguyên tắc** | BIZ-EDIT-IMMUTABLE, BIZ-OPTIMISTIC-LOCK, states.yaml (allowed_actions per state) |

---

## R — Repudiation (Chối bỏ)

### R-01: Người dùng phủ nhận đã thực hiện thao tác trên LTT

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | User phủ nhận đã tạo, sửa, phê duyệt, hoặc từ chối LTT. Không có bằng chứng kỹ thuật số đủ mạnh |
| **Vector tấn công** | Người dùng lợi dụng thiếu audit trail hoặc audit trail có thể sửa |
| **Tác động** | **HIGH** — Không chứng minh được ai đã thực hiện thao tác, vi phạm quy định ngân hàng |
| **Giảm thiểu** | (1) **Audit hash chain** (ADR-SA-0003) — immutable, tamper-proof; (2) Ghi user_id + timestamp + IP trên mọi thao tác (BIZ-AUDIT); (3) Digital signature cho Approve + Sign (BIZ-SIGN-TAD-COMM); (4) Non-repudiation qua chứng thư số cá nhân (CKS) |
| **Ánh xạ nguyên tắc** | Nguyên tắc 4 (Kiểm toán chuỗi Hash), BIZ-AUDIT, BIZ-SIGN-TAD-COMM |

### R-02: Chối bỏ việc gửi LTT đến NHNN

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Hệ thống VDBAS gửi LTT đến NHNN nhưng không có bằng chứng gửi, NHNN và VDBAS tranh chấp |
| **Vector tấn công** | Outbox event bị mất, MQ message không được persist |
| **Tác động** | **MEDIUM** — Tranh chấp giữa VDBAS và NHNN về việc đã gửi hay chưa |
| **Giảm thiểu** | (1) **Outbox pattern** (ADR-SA-0001) — message được persist trong DB trước khi gửi; (2) Lưu correlationId + timestamp gửi; (3) Callback từ NHNN (API-009) là bằng chứng xác nhận; (4) Audit log ghi SENT + CONFIRMED |
| **Áánh xạ nguyên tắc** | ADR-SA-0001, BIZ-EVENT-PUBLISH, BIZ-RETRY |

---

## I — Information Disclosure (Tiết lộ thông tin)

### I-01: Tiết lộ PII trong LTT (thông tin cá nhân, số tài khoản)

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Dữ liệu LTT chứa thông tin nhạy cảm: tên người thụ hưởng, số tài khoản, số tiền, thông tin ngân sách. Tiết lộ qua API response, log, hoặc DB breach |
| **Vector tấn công** | (1) API trả quá nhiều fields (over-fetching); (2) Log ghi plain text PII; (3) DB breach; (4) Insider threat — user xem LTT không thuộc quyền |
| **Tác động** | **HIGH** — Vi phạm bảo mật thông tin ngân hàng, vi phạm quy định bảo vệ dữ liệu cá nhân |
| **Giảm thiểu** | (1) **Masking số tài khoản** — hiển thị `****1234` trong list view; (2) API response chỉ trả fields cần thiết (DTO projection); (3) RBAC kiểm tra quyền xem LTT theo đơn vị; (4) Không ghi PII vào application log; (5) DB column encryption cho PII fields; (6) Audit log truy cập — ghi ai đã xem LTT nào |
| **Ánh xạ nguyên tắc** | Nguyên tắc bảo mật hai tầng (ADR-0004), SoD (BIZ-SOD) |

### I-02: Tiết lộ thông tin qua log và error message

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Application log hoặc error response chứa thông tin nhạy cảm: JWT token, DB connection string, SQL query, stack trace |
| **Vector tấn công** | (1) Truy cập log file (Loki, file log); (2) Error response trả về client; (3) Kênh thông tin (side-channel) qua error message timing |
| **Tác động** | **MEDIUM** — Kẻ tấn công sử dụng thông tin kỹ thuật để tấn công có chủ đích |
| **Giảm thiểu** | (1) Sanitize log — không ghi JWT, password, PII; (2) Error response chuẩn hóa — không trả stack trace cho client; (3) Structured logging (JSON) để dễ filter; (4) Log access control — chỉ DevOps và Admin được xem log |
| **Áánh xạ nguyên tắc** | OWASP Top 10 — Security Logging and Monitoring Failures |

### I-03: Tiết lộ dữ liệu qua MQ message chưa mã hóa

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Message LTT trên IBM MQ chứa dữ liệu nhạy cảm (số tài khoản, số tiền) và có thể bị sniff trên mạng |
| **Vector tấn công** | Network sniffing trên MQ channel, truy cập MQ queue không xác thực |
| **Tác động** | **MEDIUM** — Tiết lộ thông tin giao dịch ngân hàng |
| **Giảm thiểu** | (1) MQ channel TLS encryption; (2) Message-level encryption cho PII fields; (3) MQ ACL — chỉ cho phép application user read/write; (4) Network segmentation — MQ chỉ truy cập được từ within data center |
| **Ánh xạ nguyên tắc** | Nguyên tắc bảo mật hai tầng (ADR-0004) |

---

## D — Denial of Service (Từ chối dịch vụ)

### D-01: MQ flooding — làm ngập hàng đợi IBM MQ

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công (hoặc bug) gửi số lượng lớn LTT, làm ngập hàng đợi MQ và gây backlog. Gateway không xử lý kịp, callback timeout |
| **Vector tấn công** | (1) Script tự động tạo và submit LTT liên tục; (2) MQ consumer crash, message tích tụ; (3) Retry storm — nhiều LTT retry cùng lúc |
| **Tác động** | **HIGH** — Toàn bộ LTT gửi NHNN bị đình trệ, timeout, sai trạng thái |
| **Giảm thiểu** | (1) Rate limiting trên BFF — giới hạn 100 request/phút/user; (2) MQ queue depth monitoring + alert; (3) Consumer auto-scaling trên OpenShift (HPA); (4) Circuit breaker trên gateway (Resilience4j); (5) Dead Letter Queue (DLQ) cho message fail nhiều lần; (6) Backpressure — reject new LTT submit khi queue depth > threshold |
| **Ánh xạ nguyên tắc** | BIZ-RETRY, BIZ-COT-CHECK |

### D-02: DB lock exhaustion — cạn kiệt DB connection/lock

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Nhiều transaction dài chạy đồng thời (saga steps, COA validation) làm cạn kiệt DB connection pool hoặc row locks |
| **Vector tấn công** | (1) Nhiều user submit LTT cùng lúc (flash crowd); (2) Slow query trên COA-MATRIX; (3) Long-running saga không commit |
| **Tác động** | **MEDIUM** — Hệ thống chậm, timeout, user không thể thao tác |
| **Giảm thiểu** | (1) Connection pool sizing phù hợp (HikariCP); (2) Query timeout — mọi query phải có timeout; (3) Optimistic lock thay vì pessimistic lock (ADR-SA-0004) — không giữ row lock lâu; (4) Saga step timeout — mỗi step có SLA (vd: 30s); (5) DB monitoring — alert khi connection usage > 80% |
| **Áánh xạ nguyên tắc** | ADR-SA-0004 (optimistic lock), BIZ-OPTIMISTIC-LOCK |

---

## E — Elevation of Privilege (Nâng cấp đặc quyền)

### E-01: Bypass SoD — Phân tách trách nhiệm bị vi phạm

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | User đóng nhiều vai trò (vd: vừa là Maker vừa là Checker cho cùng một LTT), vi phạm nguyên tắc SoD: người_lập ≠ người_kiểm_soát ≠ người_phê_duyệt |
| **Vector tấn công** | (1) Lợi dụng cấu hình quyền sai (QLHT.PERM_MANUAL); (2) User có nhiều account khác role; (3) API bypass — gửi request approve cho LTT do mình tạo |
| **Tác động** | **HIGH** — Một người kiểm soát toàn bộ quy trình, có thể tạo và tự duyệt LTT gian lận |
| **Giảm thiểu** | (1) **DB constraint** — CHECK (maker_id != checker_id != approver_id) trên payment_order; (2) Server-side SoD enforcement (BIZ-SOD, BIZ-MAKER-CHECKER); (3) State machine guard — kiểm tra SoD tại mỗi transition; (4) Audit log mọi vi phạm SoD; (5) Alert security khi phát hiện SoD violation; (6) **BLOCKED state** — hệ thống tự động chặn LTT khi phát hiện SoD violation (states.yaml global transition) |
| **Ánh xạ nguyên tắc** | Nguyên tắc 7 (Maker-Checker-Approver), BIZ-SOD, BIZ-MAKER-CHECKER |

### E-02: Role escalation — Nâng cấp vai trò trái phép

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | User có vai trò Maker cố gắng thực hiện hành động của Checker hoặc Approver (phê duyệt, ký số, gửi) |
| **Vector tấn công** | (1) Gửi trực tiếp API endpoint approve/send (bypass UI); (2) Sửa JWT claims để thay đổi role; (3) Lợi dụng API không kiểm tra role đầy đủ |
| **Tác động** | **HIGH** — User cấp thấp thực hiện hành động cấp cao, vi phạm phân quyền |
| **Giảm thiểu** | (1) RBAC enforcement trên BFF — mọi endpoint kiểm tra role; (2) Method-level security (@PreAuthorize) trên LTT Service; (3) JWT validation + signature verification; (4) Principle of least privilege — user chỉ có 1 role active; (5) Audit log mọi truy cập bị từ chối |
| **Áánh xạ nguyên tắc** | BIZ-SOD, permissions.yaml (4 vai trò + 5 SoD rules) |

### E-03: Admin thực hiện thao tác tác nghiệp

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Admin (vai trò tra cứu) cố gắng tạo, sửa, phê duyệt LTT thông qua API |
| **Vector tấn công** | Gọi trực tiếp API endpoint tác nghiệp |
| **Tác động** | **MEDIUM** — Admin thực hiện tác nghiệp ngoài quyền tra cứu |
| **Giảm thiểu** | (1) RBAC — Admin chỉ có quyền READ; (2) API endpoint phân quyền rõ ràng; (3) Audit log mọi truy cập |
| **Áánh xạ nguyên tắc** | permissions.yaml — Admin: "Tra cứu thông tin, không tham gia tác nghiệp" |

---

## Replay Attacks (Tấn công phát lại)

### RP-01: Replay yêu cầu REST POST (tạo LTT)

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công chặn và replay yêu cầu POST tạo LTT hợp lệ, tạo ra nhiều LTT trùng lặp |
| **Vector tấn công** | Network sniffing + replay HTTP request |
| **Tác động** | **HIGH** — Tạo nhiều LTT giống hệt, gây thất thoát quỹ |
| **Giảm thiểu** | (1) **Idempotency Key** (ADR-SA-0005) — client gửi unique key, server reject duplicate; (2) HTTPS (TLS 1.3) — chống sniffing; (3) **Duplicate Detector** (BIZ-DUPLICATE) — cảnh báo LTT trùng trong N phút; (4) Timestamp validation — reject request cũ hơn 5 phút; (5) Nonce trong request header |
| **Ánh xạ nguyên tắc** | ADR-SA-0005, BIZ-DUPLICATE |

### RP-02: Replay message MQ (callback NHNN)

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | MQ redelivery hoặc kẻ tấn công replay callback message từ NHNN, gây xử lý lặp |
| **Vector tấn công** | (1) MQ redelivery khi consumer crash; (2) Replay message đã capture trên mạng |
| **Tác động** | **HIGH** — LTT bị chuyển trạng thái sai (CONFIRMED lặp, GL post lặp) |
| **Giảm thiểu** | (1) **Idempotency Store** (ADR-SA-0005) — processed_messages table; (2) CorrelationId unique constraint; (3) Consumer check trạng thái LTT trước khi xử lý (đã CONFIRMED thì bỏ qua); (4) MQ message TTL — message cũ hơn X bị discard |
| **Áánh xạ nguyên tắc** | ADR-SA-0005, ADR-SA-0001 (outbox), BIZ-RETRY |

### RP-03: Replay chữ ký số (signature replay)

| Thuộc tính | Giá trị |
| :--------- | :------ |
| **Mô tả** | Kẻ tấn công sao chép chữ ký số từ LTT đã ký và áp dụng cho LTT khác |
| **Vector tấn công** | Copy signature value + signerCert từ response LTT cũ, dán vào request ký LTT mới |
| **Tác động** | **HIGH** — LTT chưa được Approver ký nhưng có chữ ký hợp lệ |
| **Giảm thiểu** | (1) Chữ ký bao gồm **LTT ID + timestamp + nonce** — không thể reuse cho LTT khác; (2) TAD-COMM verify chữ ký gắn với document cụ thể; (3) Server-side check: signature document hash phải khớp với LTT hiện tại; (4) Audit hash chain ghi signature event |
| **Áánh xạ nguyên tắc** | BIZ-SIGN-TAD-COMM, ADR-SA-0003 (audit hash chain) |

---

## Ma trận Tổng hợp Mối đe dọa

| ID | Loại STRIDE | Mô tả ngắn | Tác động | Ưu tiên |
| :-- | :---------- | :--------- | :------- | :------- |
| S-01 | Spoofing | Giả mạo JWT token | HIGH | P1 |
| S-02 | Spoofing | Giả mạo chứng thư số | HIGH | P1 |
| S-03 | Spoofing | Giả mạo callback NHNN | HIGH | P1 |
| T-01 | Tampering | Sửa LTT trong truyền | HIGH | P1 |
| T-02 | Tampering | Sửa trực tiếp DB | HIGH | P1 |
| T-03 | Tampering | Sửa message MQ | HIGH | P1 |
| T-04 | Tampering | Sửa LTT immutable state | MEDIUM | P2 |
| R-01 | Repudiation | Chối bỏ thao tác | HIGH | P1 |
| R-02 | Repudiation | Chối bỏ gửi NHNN | MEDIUM | P2 |
| I-01 | Info Disclosure | Tiết lộ PII trong LTT | HIGH | P1 |
| I-02 | Info Disclosure | Tiết lộ qua log/error | MEDIUM | P2 |
| I-03 | Info Disclosure | Tiết lộ qua MQ message | MEDIUM | P2 |
| D-01 | Denial of Service | MQ flooding | HIGH | P1 |
| D-02 | Denial of Service | DB lock exhaustion | MEDIUM | P2 |
| E-01 | Elevation | Bypass SoD | HIGH | P1 |
| E-02 | Elevation | Role escalation | HIGH | P1 |
| E-03 | Elevation | Admin thực hiện tác nghiệp | MEDIUM | P2 |
| RP-01 | Replay | Replay REST POST tạo LTT | HIGH | P1 |
| RP-02 | Replay | Replay MQ callback | HIGH | P1 |
| RP-03 | Replay | Replay chữ ký số | HIGH | P1 |

**Tổng**: 14 HIGH, 6 MEDIUM, 0 LOW

---

## Ánh xạ Mitigations → ADR / Nguyên tắc

| Mitigation | ADR | Nguyên tắc CLAUDE.md | Business Rule |
| :--------- | :-- | :------------------- | :------------ |
| Audit hash chain (SHA-256) | ADR-SA-0003 | Nguyên tắc 4 | BIZ-AUDIT |
| Optimistic locking | ADR-SA-0004 | Nguyên tắc 6 | BIZ-OPTIMISTIC-LOCK |
| Idempotency key | ADR-SA-0005 | Nguyên tắc 6 | BIZ-RETRY |
| Outbox pattern | ADR-SA-0001 | Nguyên tắc 2 | BIZ-EVENT-PUBLISH |
| Saga orchestration | ADR-SA-0002 | Nguyên tắc 3 | — |
| COA server-side validation | ADR-SA-0006 | Nguyên tắc 1 | BIZ-COA-CROSS |
| HTTPS / mTLS | — | Nguyên tắc bảo mật hai tầng | — |
| RBAC + SoD enforcement | — | Nguyên tắc 7 | BIZ-SOD, BIZ-MAKER-CHECKER |
| Rate limiting | — | — | — |
| Duplicate detection | — | — | BIZ-DUPLICATE |

---

## Khuyến nghị tiếp theo

1. **Security Review**: Chuyển tài liệu này cho workspace `workspaces/security/` để review và bổ sung chi tiết cho Giai đoạn 2.
2. **Penetration Testing**: Lên kế hoạch pentest sau khi MVP hoàn thành Giai đoạn 3.
3. **Security Headers**: Cấu hình CSP, X-Frame-Options, X-Content-Type-Options trên BFF.
4. **Secret Management**: Sử dụng OpenShift Secrets / Vault cho JWT secret, MQ credentials, DB password.
5. **Logging Security**: Đảm bảo structured logging không ghi PII, sử dụng OpenTelemetry + Loki.
6. **Incident Response**: Xây dựng playbook xử lý sự cố bảo mật dựa trên các kịch bản STRIDE.

---

*Generated by: SA Agent | Review by: Security Lead + SA Lead*
*Reference: [CONTEXT.md](../../../../docs/CONTEXT.md), [business-rules.yaml](../../../ba/domain/business-rules.yaml), [states.yaml](../../../ba/domain/states.yaml)*

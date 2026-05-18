# Bảng đặc tả chức năng

> Chức năng **Tích hợp ra ngoài** (Outbound Integration) điển hình — góc nhìn nền tảng tích hợp (Integration Platform / Adapter): connector + mapping + routing + scheduling + monitoring. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế. (Bổ trợ cho `BangDacTaChucNang_DayDuLieu_DienHinh.md` với góc nhìn cấu hình & đa hệ đích.)

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.INT.OUT.<FlowCode>` |
| Tên chức năng | Tích hợp ra ngoài `<Tên luồng nghiệp vụ>` |
| Người sử dụng | Hệ thống nguồn (event/job), Người vận hành tích hợp (Ops), Quản trị connector, Người duyệt phát hành cấu hình |
| Mô tả | Chuyển dữ liệu (giao dịch, sự kiện, snapshot, file) từ hệ thống hiện tại ra một hoặc nhiều hệ thống đích thông qua **Adapter/Connector** được khai báo: định nghĩa endpoint, phương thức (REST/SOAP/MQ/SFTP/Webhook/DB-link), kênh xác thực, **mapping** (source → target schema), **routing** (điều kiện gửi tới destination nào), **scheduling** (real-time/near-real-time/batch), **policy** (retry, idempotency, rate limit, circuit breaker), kèm **monitoring** (run, throughput, lag, error) |
| Độ ưu tiên | Cao |
| URD reference | `<URD-INT-OUT-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Connector tới hệ đích `<DstSys>` đã được khai báo, active và pass health-check |
| 2 | Credential / certificate / API key của hệ đích đã được nạp vào Secret Manager và còn hiệu lực |
| 3 | Mapping (source → target) đã được duyệt và publish phiên bản `vN` |
| 4 | Routing rules (điều kiện chọn hệ đích) đã được duyệt và publish |
| 5 | SLA, rate limit, contact điểm vận hành phía hệ đích đã được ký nhận |
| 6 | Hệ thống nguồn đã phát sinh dữ liệu hợp lệ (transaction COMPLETED, event PUBLISHED, snapshot CLOSED…) |
| 7 | Outbox / Queue / Staging table cho luồng `<FlowCode>` đã sẵn sàng và được monitor |
| 8 | (Batch/SFTP) Window thời gian chạy nằm trong cấu hình; lock đơn luồng đã sẵn sàng |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Bản ghi nguồn được đánh dấu trạng thái phù hợp: `SENT` / `ACKED` / `FAILED_AT_DEST` / `RETRYING` / `CIRCUIT_OPEN` / `DEAD_LETTER` |
| 2 | Hệ đích đã nhận và xác nhận (synchronous ack hoặc asynchronous callback); `externalId` / receipt được lưu kèm |
| 3 | Audit & integration log đầy đủ: correlationId, traceId, payload (mask PII), header, response, latency, retry count |
| 4 | Metric được cập nhật (sent, success, fail by reason, latency p50/p95/p99, throughput, lag, queue depth) |
| 5 | (Async/callback) Sự kiện trả về từ hệ đích đã được tiếp nhận và cập nhật trạng thái cuối |
| 6 | (Batch) Báo cáo đối chiếu (reconcile) cuối ngày sinh ra; chênh lệch (nếu có) được flag để Ops xử lý |
| 7 | Cấu hình hiện tại của connector/mapping/routing không bị thay đổi ngầm; mọi thay đổi đều có phiên bản & người duyệt |

## 4. Luồng chính

| Bước | Tác nhân | Hệ thống |
|---|---|---|
| 1 | Hệ thống nguồn ghi sự kiện vào **Transactional Outbox** trong cùng transaction nghiệp vụ | Đảm bảo nguyên tử: nghiệp vụ commit ⇔ outbox commit; sinh `correlationId` |
| 2 | **Outbox Relay / Dispatcher** poll/subscribe outbox | Lấy batch theo thứ tự (FIFO theo `aggregateId`); đánh dấu `IN_PROGRESS` với lease |
| 3 | **Router** áp dụng **routing rules** trên sự kiện | Lọc theo điều kiện (loại GD, kênh, đơn vị, hạn mức, vùng địa lý…); xác định danh sách `<DstSys>` cần gửi (1..n); fan-out cho từng đích |
| 4 | **Mapper** chuyển source DTO → target DTO theo mapping `vN` | Áp dụng transformation: rename field, đổi enum, format date/number, mask, đối chiếu danh mục (lookup), enrich từ master; validate schema target |
| 5 | **Adapter** tương ứng được gọi (REST/SOAP/MQ/SFTP/Webhook) | Đính kèm header chuẩn: `X-Correlation-Id`, `X-Idempotency-Key = hash(aggregateId+version+dst)`, `X-Schema-Version`, `Authorization` (OAuth2/Basic/HMAC/mTLS); ký số payload nếu yêu cầu |
| 6 | **Rate Limiter** kiểm tra ngưỡng theo hệ đích | Token bucket / leaky bucket; nếu vượt → đẩy lại queue với delay |
| 7 | **Circuit Breaker** kiểm tra trạng thái breaker cho `<DstSys>` | Nếu `OPEN` → fast-fail, đẩy vào DLQ-PENDING; nếu `HALF_OPEN` → cho phép thăm dò |
| 8 | Gửi request tới hệ đích | Đo latency; nhận response/HTTP-code/fault |
| 9 | Xử lý response | 2xx → đánh `SENT` (nếu async callback) hoặc `ACKED` (nếu sync ack); 4xx (trừ 408/429) → `FAILED_AT_DEST` (no-retry); 5xx/408/429 → `RETRYING` |
| 10 | (Async) Hệ đích gọi callback xác nhận xử lý | Endpoint callback verify chữ ký/HMAC, đối chiếu correlationId; cập nhật trạng thái cuối (`ACKED` / `REJECTED_AT_DEST` kèm reason) |
| 11 | Ghi audit & metric | Lưu request/response (mask PII), latency, retry count, breaker state; cập nhật dashboard |
| 12 | Dispatcher tiếp tục lượt poll kế tiếp | Quản lý lease, ack outbox row, dọn hàng đợi |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | Phát hành **mapping/connector/routing version mới** | Tạo bản nháp → diff → trình duyệt → publish `vN+1`; rollback về `vN` bằng 1 click; lưu lịch sử thay đổi |
| A2 | **Manual trigger** từ Ops console | Chọn bản ghi/lô; chọn destination; chọn version mapping; chạy lại; ghi `manualTriggeredBy` |
| A3 | **Replay từ DLQ** | Chọn message DLQ; xem payload; chỉnh tham số routing/destination (nếu cấu hình cho phép); replay ≤ N lần |
| A4 | **Batch / SFTP** | Gom dữ liệu trong cửa sổ thời gian; sinh file theo template + checksum; upload SFTP/atomic rename; gửi event "file ready"; chờ ack hoặc reconcile T+1 |
| A5 | **Message Queue (Kafka/RabbitMQ)** | Publish lên topic; partition key = `aggregateId`; consumer phía đích chịu trách nhiệm ack; theo dõi lag |
| A6 | **Webhook đa subscriber** | Một event fan-out cho nhiều subscriber đã đăng ký; mỗi subscriber có endpoint/secret riêng; tách hạch toán trạng thái cho từng subscriber |
| A7 | **Fan-out có ưu tiên** (priority routing) | Gửi tới đích quan trọng trước (vd cơ quan thuế) rồi mới tới các đích phụ; cho phép critical path fail-fast |
| A8 | **Hệ đích bảo trì có lịch** | Đọc lịch bảo trì (whitelist/blackout window); hoãn gửi → `SCHEDULED`; tự nối lại khi hết bảo trì |
| A9 | **Sửa transient lỗi** | Ops cập nhật credential mới / chứng chỉ mới qua màn hình connector; auto-reload không cần restart |
| A10 | **Dry-run** | Thực thi luồng nhưng không gọi thật hệ đích, chỉ in payload sau mapping để kiểm thử mapping/routing |
| A11 | **EOD reconcile** | T+1 đối chiếu danh sách đã gửi vs danh sách hệ đích xác nhận; chênh → tạo task Ops, gửi alert |
| A12 | **Pause/Resume luồng** | Quản trị tạm dừng `<FlowCode>` cho `<DstSys>`; dispatcher giữ message ở outbox; resume khi sẵn sàng |
| A13 | **Throttle thủ công** | Ops giảm rate limit khi hệ đích báo quá tải; tự nâng lại theo thời điểm cấu hình |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Connector không health-check thành công | Cảnh báo Ops; `<FlowCode>` chuyển `DEGRADED`; outbox tiếp tục tích luỹ; không drop |
| E2 | Credential/cert hết hạn hoặc bị thu hồi | Fail-fast 401/403; đánh dấu connector `CREDENTIAL_EXPIRED`; gửi alert; chặn gửi tới khi cập nhật |
| E3 | Mapping `vN` lỗi (thiếu field bắt buộc target, sai kiểu) | Reject ở Mapper; ghi `MAPPING_ERROR` với chi tiết field; không gọi adapter; vào DLQ-MAPPING |
| E4 | Routing không khớp rule nào | Theo cấu hình: (a) drop kèm warning, (b) fan-out fallback destination, (c) park `UNROUTED` chờ Ops xử lý |
| E5 | HTTP 4xx (không kể 408/429) | No-retry; đánh `FAILED_AT_DEST`; lưu response chi tiết; tạo task Ops nếu mã lỗi nghiêm trọng |
| E6 | HTTP 5xx / 408 / 429 | Retry với exponential backoff (cấu hình: vd 1s, 5s, 30s, 2m, 10m, max N lần); 429 tôn trọng `Retry-After` |
| E7 | Vượt quota retry | Đẩy vào DLQ-DEST; alert Ops; chờ replay thủ công |
| E8 | Circuit breaker `OPEN` | Fast-fail; tạm dừng gửi; thử thăm dò sau cooldown; metric `breaker_state` tăng |
| E9 | Hệ đích trả ack nhưng không có callback trong SLA (vd 24h) | Auto-move sang `ACK_TIMEOUT`; gửi reconcile request; alert Ops |
| E10 | Callback nhận được không khớp signature / correlationId | Reject 401; ghi `CALLBACK_INVALID`; cảnh báo bảo mật |
| E11 | Duplicate idempotency key (cùng aggregate + version cùng đích) | Đích trả `IDEMPOTENT_REPLAY`; cập nhật `ACKED` mà không sinh tác động kép |
| E12 | Lỗi nghiêm trọng tại adapter (NPE, OOM, kết nối) | Đánh `IN_PROGRESS` → release lease sau timeout; outbox được poll lại bởi instance khác |
| E13 | Outbox lag vượt ngưỡng (vd > 5 phút) | Alert cao; auto-scale dispatcher; nếu vẫn cao → tạo incident |
| E14 | File SFTP upload dở dang | Sử dụng atomic rename (`.tmp` → `final`); reset upload nếu fail; không bao giờ commit file lỗi |
| E15 | Replay DLQ vượt giới hạn N lần | Khoá replay; yêu cầu approve cấp cao; ghi `LOCKED_BY_POLICY` |
| E16 | Thay đổi cấu hình không có phiên bản (drift) | Phát hiện qua hash; cảnh báo; revert về `vN` đang publish |
| E17 | Mất kết nối Secret Manager | Adapter từ chối khởi động; circuit breaker `OPEN`; alert hạ tầng |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-INT-OUT-01 — Mọi sự kiện gửi ra ngoài phải đi qua **Transactional Outbox** trong cùng giao dịch nghiệp vụ (không gọi trực tiếp hệ đích từ logic nghiệp vụ) |
| 2 | BIZ-INT-OUT-02 — `correlationId` được tạo tại nguồn và xuyên suốt mọi hop; bắt buộc xuất hiện trong header, log, audit, response |
| 3 | BIZ-INT-OUT-03 — `idempotencyKey = hash(aggregateId + version + dst)`; hệ đích phải xử lý idempotent; replay 2 lần ≠ 2 tác động |
| 4 | BIZ-INT-OUT-04 — Retry chỉ áp dụng cho lỗi tạm thời (5xx, 408, 429, network); 4xx khác là no-retry |
| 5 | BIZ-INT-OUT-05 — Backoff exponential với jitter; max N lần (cấu hình); sau N lần → DLQ |
| 6 | BIZ-INT-OUT-06 — Circuit breaker theo `<DstSys>`: threshold lỗi (vd 50% trong 1 phút) → `OPEN`; cooldown rồi `HALF_OPEN` |
| 7 | BIZ-INT-OUT-07 — Rate limit theo `<DstSys>` (per-second + per-minute); vượt → defer chứ không drop |
| 8 | BIZ-INT-OUT-08 — Mapping/connector/routing đều phải có **phiên bản**, **người duyệt**, **lịch sử thay đổi**, **rollback ≤ 1 click**; cấm sửa trực tiếp production |
| 9 | BIZ-INT-OUT-09 — Audit log lưu payload đã mask PII (số CCCD, số TK, mật khẩu, mã OTP, email, SĐT), nhưng giữ hash để truy vết khi cần điều tra |
| 10 | BIZ-INT-OUT-10 — Tất cả gọi ra ngoài bắt buộc qua kênh an toàn: TLS 1.2+; mTLS hoặc HMAC-signature khi yêu cầu; whitelist IP/SNI |
| 11 | BIZ-INT-OUT-11 — Schema version (`X-Schema-Version`) bắt buộc trong header; backward-compatible giữa 2 phiên bản kế tiếp; deprecation period ≥ 90 ngày |
| 12 | BIZ-INT-OUT-12 — DLQ phải có TTL và backup; replay phải có người duyệt nếu ≥ 3 lần |
| 13 | BIZ-INT-OUT-13 — State machine bản ghi: `PENDING → IN_PROGRESS → SENT → ACKED` (happy); nhánh: `RETRYING`, `FAILED_AT_DEST`, `ACK_TIMEOUT`, `DEAD_LETTER`, `CIRCUIT_OPEN`, `CANCELLED` |
| 14 | BIZ-INT-OUT-14 — Đối chiếu EOD T+1 bắt buộc cho mọi luồng tài chính; chênh lệch > ngưỡng → tự tạo ticket |
| 15 | BIZ-INT-OUT-15 — Phân tách quyền: người cấu hình connector ≠ người duyệt phát hành ≠ người vận hành replay (SoD) |
| 16 | BIZ-INT-OUT-16 — Manual trigger / replay phải ghi rõ `actor`, `reason`, `ticketId`; giới hạn quota theo user/ngày |
| 17 | BIZ-INT-OUT-17 — Mọi cấu hình nhạy cảm (secret, cert) lấy từ Secret Manager khi runtime; không lưu trong file cấu hình thường |
| 18 | BIZ-INT-OUT-18 — SLA gửi & ack được khai báo theo `<DstSys>`; vi phạm SLA → alert + log; báo cáo SLA hàng tháng |
| 19 | BIZ-INT-OUT-19 — Khi `<DstSys>` công bố bảo trì, luồng tự `SCHEDULED` chờ tới hết bảo trì rồi gửi; không retry liên tục gây nhiễu |
| 20 | BIZ-INT-OUT-20 — Mọi sự kiện gửi ra phải có khả năng **truy vết end-to-end** (correlationId → outbox → adapter → hệ đích → callback) trong tối thiểu 180 ngày |

## 8. Giao diện liên quan

| STT | Màn hình / Component |
|---|---|
| 1 | `<MOD>.INT.OUT.MONITOR` — Dashboard tổng quan: throughput, success rate, latency, queue depth, breaker state theo `<DstSys>` |
| 2 | `<MOD>.INT.OUT.RUN.LIST` — Danh sách bản ghi: filter theo trạng thái, correlationId, destination, thời gian, mã lỗi |
| 3 | `<MOD>.INT.OUT.RUN.DETAIL` — Chi tiết một bản ghi: timeline, payload sau mapping, request/response, retry history, audit |
| 4 | `<MOD>.INT.OUT.CONNECTOR.LIST` — Danh sách connector đến các hệ đích, trạng thái health-check |
| 5 | `<MOD>.INT.OUT.CONNECTOR.EDIT` — Form khai báo/edit connector (endpoint, auth, certs, timeout, rate limit, breaker) — workflow Maker/Checker |
| 6 | `<MOD>.INT.OUT.MAPPING` — Trình soạn mapping: drag-and-drop field source ↔ target, transformation, validation, preview |
| 7 | `<MOD>.INT.OUT.MAPPING.VERSIONS` — Lịch sử & rollback mapping |
| 8 | `<MOD>.INT.OUT.ROUTING` — Quy tắc routing (condition → destination(s)), test bằng sample event |
| 9 | `<MOD>.INT.OUT.SCHEDULE` — Lịch chạy batch / blackout windows |
| 10 | `<MOD>.INT.OUT.DLQ` — Hàng đợi dead-letter; xem payload, replay (đơn lẻ/đa chọn), gắn ticket |
| 11 | `<MOD>.INT.OUT.MANUAL` — Trigger thủ công cho một/nhiều bản ghi; chọn mapping version, destination |
| 12 | `<MOD>.INT.OUT.RECONCILE` — Báo cáo đối chiếu cuối ngày với hệ đích; danh sách chênh lệch |
| 13 | `<MOD>.INT.OUT.AUDIT` — Tra cứu audit log theo correlationId/user/thời gian |
| 14 | `<MOD>.INT.OUT.SECRETS` — Trạng thái secrets/cert sắp hết hạn (chỉ Quản trị) |
| 15 | `<MOD>.INT.OUT.ALERT.RULES` — Quản lý alert (threshold lỗi, SLA, lag, queue depth) và kênh nhận |
| 16 | `<MOD>.INT.OUT.DRY.RUN` — Console test mapping/routing với payload mẫu |
| 17 | `<MOD>.INT.OUT.CHANGE.LOG` — Lịch sử thay đổi cấu hình connector/mapping/routing (ai, khi, diff, approver) |

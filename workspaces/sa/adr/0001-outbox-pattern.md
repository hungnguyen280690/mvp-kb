# ADR-SA-0001: Mô hình Transactional Outbox cho ghi DB + đẩy MQ nguyên tử

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Hệ thống VDBAS TT.OUT.MANUAL yêu cầu sau mỗi chuyển trạng thái LTT, phải publish event lên message bus (IBM MQ) cho các phân hệ QLChi/QLT/So cái/ECM/Notification subscribe (BIZ-EVENT-PUBLISH). Đồng thời, dữ liệu LTT phải được ghi vào Oracle 19c trong cùng một giao dịch.

**Vấn đề**: Oracle DB và IBM MQ là hai hệ thống độc lập. Không thể dùng phân tán giao dịch (XA) hai pha một cách đáng tin cậy giữa Oracle và IBM MQ trong môi trường OpenShift. Nếu ghi DB thành công nhưng đẩy MQ thất bại (hoặc ngược lại), dữ liệu sẽ không nhất quán.

**Ràng buộc**:

- Yêu cầu exactly-once processing cho mọi LTT (CLAUDE.md nguyên tắc 6).
- Retry gateway yêu cầu cùng correlationId (BIZ-RETRY), nghĩa là tin nhắn không được gửi lặp.
- Hệ thống sử dụng Oracle 19c làm DB chính và IBM MQ làm message bus.
- Triển khai trên OpenShift 4.x, các pod có thể bị restart bất ngờ.

**Các lựa chọn xem xét**:

1. **Giao dịch XA hai pha** giữa Oracle và IBM MQ.
2. **Ghi DB trước, đẩy MQ sau** (best-effort) với retry.
3. **Transactional Outbox**: Ghi cả business data và message vào cùng một giao dịch DB, sau đó dùng polling publisher đọc outbox table và đẩy lên MQ.

## Decision

Chọn **Transactional Outbook với Polling Publisher** (lựa chọn 3).

**Cơ chế hoạt động**:

1. Trong cùng một giao dịch Oracle, ghi dữ liệu LTT vào bảng `payment_order` đồng thời ghi event message vào bảng `outbox_events`.
2. Một Polling Publisher (Spring Boot scheduler, chạy mỗi 500ms) quét `outbox_events` WHERE `status = 'PENDING'` ORDER BY `created_at ASC`.
3. Publisher đẩy message lên IBM MQ. Nếu thành công, cập nhật `status = 'PUBLISHED'`. Nếu thất bại, giữ nguyên để retry ở lần quét tiếp.
4. Message trên MQ sau khi được consumer xử lý thành công thì ack. Nếu consumer fail, MQ redeliver (at-least-once). Consumer sử dụng idempotency key để lặp (xem ADR-SA-0005).
5. Outbox events cũ hơn 7 ngày được dọn dẹp bởi batch job (retention policy).

**Cấu trúc bảng outbox**:

```
outbox_events
├── id              (UUID, PK)
├── aggregate_type  (VARCHAR2) — vd: 'PAYMENT_ORDER'
├── aggregate_id    (VARCHAR2) — vd: So YCTT
├── event_type      (VARCHAR2) — vd: 'SUBMITTED', 'APPROVED'
├── payload         (CLOB/JSON) — event payload
├── status          (VARCHAR2) — PENDING / PUBLISHED / FAILED
├── created_at      (TIMESTAMP)
├── published_at    (TIMESTAMP, nullable)
├── retry_count     (NUMBER, default 0)
└── max_retries     (NUMBER, default 5)
```

**Lý do chọn**:

- Đảm bảo **atomicity**: DB và outbox trong cùng giao dịch Oracle — không bao giờ mất event.
- **Không phụ thuộc XA**: Tránh phức tạp và overhead của distributed transaction.
- **Phù hợp hạ tầng**: Oracle 19c hỗ trợ JSON type và IBM MQ JMS client sẵn có.
- **Tương thích OpenShift**: Polling publisher là stateless, dễ scale và restart.

## Consequences

### Tích cực

- **Đảm bảo nhất quán**: DB và MQ luôn đồng bộ. Không bao giờ mất event khi pod restart.
- **Tương thích exactly-once**: Kết hợp với idempotency key (ADR-SA-0005) đảm bảo tin nhắn không bị xử lý lặp.
- **Khả năng quan sát**: Outbox table là nguồn truth, dễ truy vấn để debug.
- **Không cần XA**: Giảm phức tạp hạ tầng, tránh single point of failure của transaction coordinator.
- **Retry tự nhiên**: Message fail sẽ được retry ở lần polling tiếp, không cần DLQ riêng cho outbox.

### Tiêu cực

- **Độ trễ tăng**: Polling interval 500ms nghĩa là message có thể bị trễ tối đa 500ms so với real-time push. Chấp nhận được cho nghiệp vụ LTT.
- **Phức tạp thêm**: Cần thêm outbox table, polling scheduler, cleanup batch job.
- **Overhead lưu trữ**: Outbox table tăng kích thước DB. Cần retention policy dọn dẹp.
- **Polling overhead**: Query polling mỗi 500ms tạo load DB. Có thể giảm bằng Oracle Change Notification hoặc Debezium CDC trong tương lai.

### Rủi ro và giảm thiểu

| Rủi ro                                         | Mức độ | Giảm thiểu                                                                  |
| :--------------------------------------------- | :----- | :-------------------------------------------------------------------------- |
| Polling lag > 500ms                            | LOW    | Monitoring alert nếu lag > 2s; cân nhắc migrate sang CDC (Debezium) nếu cần |
| Outbox table phình to                          | MEDIUM | Retention 7 ngày + batch cleanup; partition theo tháng                      |
| Publisher crash giữa đẩy MQ và cập nhật status | LOW    | Idempotency key trên MQ đảm bảo duplicate an toàn                           |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 2: Mô hình Outbox
- [CONTEXT.md](../../../../docs/CONTEXT.md) — IBM MQ kênh LNH/SP/LKB
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-EVENT-PUBLISH, BIZ-RETRY
- [states.yaml](../../../ba/domain/states.yaml) — Các chuyển trạng thái phát event
- Martin Kleppmann, "Designing Data-Intensive Applications", Ch. 11 — Stream Processing
- ADR-SA-0005: Idempotency Design

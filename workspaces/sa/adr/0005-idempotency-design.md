# ADR-SA-0005: Thiết kế Idempotency — Khóa định danh duy nhất do client sinh

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Hệ thống VDBAS TT.OUT.MANUAL hoạt động trong môi trường phân tán với nhiều nguồn gây lặp yêu cầu:

- **Network retry**: Frontend retry khi timeout hoặc connection reset.
- **MQ redelivery**: IBM MQ redeliver message khi consumer không ack (pod crash, network issue).
- **Gateway retry**: Retry 3 lần khi gửi NHNN/CITAD fail (BIZ-RETRY), mỗi lần dùng cùng correlationId.
- **User double-click**: User bấm nút Gửi/Phê duyệt nhiều lần nhanh liên tiếp.

CLAUDE.md nguyên tắc 6: "Mã định danh duy nhất (Idempotency) — Áp dụng cho mọi yêu cầu REST POST và tin nhắn MQ."

**Ràng buộc**:

- Mọi REST POST request phải idempotent (không gây side effect nếu gọi lặp).
- Mọi MQ message phải idempotent (consumer xử lý lặp an toàn).
- API-001 (SubmitPaymentLNH): "Idempotent theo requestId+channel; retry 3 lần backoff 5/15/45s".
- API-009 (PaymentCallback): "Idempotent: nếu nhận callback trùng thì trả 00 và bỏ qua".
- BIZ-RETRY: Gateway gửi NH có retry 3 lần với cùng correlationId.

**Các lựa chọn xem xét**:

1. **Server-generated id + dedup**: Client gửi request, server sinh unique ID, check duplicate bằng DB unique constraint.
2. **Client-generated idempotency key**: Client gửi `Idempotency-Key` header, server lưu key + response, request trùng trả response cũ.
3. **Natural key dedup**: Dùng key nghiệp vụ (vd: So YCTT + channel) để lọc trùng.

## Decision

Chọn **Client-generated Idempotency Key** (lựa chọn 2), kết hợp natural key dedup (lựa chọn 3) cho các trường hợp đặc thù.

**Cơ chế hoạt động cho REST POST**:

```
1. Client gửi POST request:
   POST /api/payment-orders
   Header: Idempotency-Key: "550e8400-e29b-41d4-a716-446655440000"
   Body: { ... LTT data ... }

2. Server xử lý:
   a. Kiểm tra idempotency_key trong bảng idempotency_store:
      - Nếu tìm thấy → trả response đã lưu (không thực thi lại)
      - Nếu không tìm thấy → thực thi nghiệp vụ, lưu key + response

3. Lưu trữ idempotency:
   idempotency_store
   ├── idempotency_key    (VARCHAR2(64), PK)
   ├── request_hash       (VARCHAR2(64)) — SHA-256 của request body
   ├── response_status    (NUMBER) — HTTP status code
   ├── response_body      (CLOB) — response body
   ├── created_at         (TIMESTAMP)
   ├── expires_at         (TIMESTAMP) — TTL 24h
   └── generated_by       (VARCHAR2) — client app version
```

**Cơ chế cho MQ consumer**:

```
1. Consumer nhận message từ MQ:
   Message chứa: { correlationId, messageId, payload }

2. Consumer xử lý:
   a. Kiểm tra (correlationId, messageId) trong bảng processed_messages:
      - Nếu đã xử lý → ack, bỏ qua
      - Nếu chưa → xử lý nghiệp vụ, lưu (correlationId, messageId), ack

3. Cleanup: processed_messages cũ hơn 7 ngày được batch delete.
```

**Quy tắc áp dụng**:

| Loại request                     | Idempotency mechanism                    | Key                                           |
| :------------------------------- | :--------------------------------------- | :-------------------------------------------- |
| REST POST (tạo mới LTT)          | Idempotency-Key header                   | UUID do client sinh                           |
| REST PUT (sửa LTT)               | (id, version) optimistic lock            | Natural key — không cần Idempotency-Key riêng |
| REST DELETE (xoá LTT)            | (id, version) optimistic lock            | Natural key                                   |
| MQ message (gateway callback)    | (correlationId) trong processed_messages | correlationId từ NH                           |
| MQ message (outbox event)        | (event_id) trong outbox_events           | event_id = UUID                               |
| Gateway gửi NH (API-001/002/003) | requestId + channel                      | requestId = So YCTT                           |

**Lý do chọn**:

- **An toàn network retry**: Client retry cùng Idempotency-Key → server trả kết quả cũ, không tạo LTT mới.
- **Phù hợp MQ**: correlationId/messageId là idempotency key tự nhiên cho MQ.
- **Đồng bộ API spec**: API-001..003 đã định nghĩa idempotency theo requestId+channel.

## Consequences

### Tích cực

- **Exactly-once semantics**: Kết hợp với outbox pattern (ADR-SA-0001), đảm bảo tin nhắn không bị xử lý lặp.
- **An toàn retry**: Frontend và gateway có thể retry tự do mà không sợ side effect.
- **Tuân thủ API spec**: Mọi outbound API đã yêu cầu idempotency key.
- **Debug dễ dàng**: Idempotency key log trong mọi audit entry, dễ truy vết.

### Tiêu cực

- **Quản lý key storage**: Bảng `idempotency_store` và `processed_messages` cần cleanup định kỳ. Overhead lưu trữ ~100 bytes/request.
- **Client phải sinh UUID**: Frontend cần thêm logic sinh UUID (crypto.randomUUID() hoặc uuid library).
- **TTL cần cấu hình**: Key hết hạn quá sớm → retry sau TTL sẽ tạo bản ghi mới. Key tồn tại quá lâu → phình storage. Khuyến nghị: TTL 24h cho REST, 7 ngày cho MQ.

### Rủi ro và giảm thiểu

| Rủi ro                                              | Mức độ   | Giảm thiểu                                                                                                        |
| :-------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| Client gửi same key cho data khác                   | LOW      | Lưu request_hash; nếu key trùng nhưng hash khác → trả 422 Unprocessable Entity                                    |
| Idempotency store phình to                          | MEDIUM   | TTL 24h + batch cleanup mỗi giờ; partition theo ngày                                                              |
| Race condition: 2 request cùng key đến cùng lúc     | LOW      | DB unique constraint trên idempotency_key; request thứ 2 bị constraint violation → trả response đã lưu            |
| MQ redelivery sau khi processed_messages đã cleanup | VERY LOW | TTL 7 ngày >> MQ redelivery window (thường < 1 giờ); kết hợp business logic check (LTT đã ở trạng thái tương ứng) |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 6: Mã định danh duy nhất
- [CONTEXT.md](../../../../docs/CONTEXT.md) — Mã định danh duy nhất (định nghĩa)
- [api-spec.yaml](../../../ba/domain/api-spec.yaml) — API-001..009 (idempotency notes)
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-RETRY, BIZ-DUPLICATE
- [ADR-SA-0001](./0001-outbox-pattern.md) — Outbox pattern (outbox_events as idempotency store)
- IETF draft-ietf-httpapi-idempotency-key-header-00 — Idempotency-Key HTTP Header

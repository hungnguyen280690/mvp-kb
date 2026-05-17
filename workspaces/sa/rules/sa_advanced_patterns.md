# SA Rules: Nâng cao - Patterns & Integrity

Tài liệu này bổ sung các Pattern bắt buộc cho SA Agent.

## 1. Outbox Pattern (BIZ-RULE-001)
- Mọi thao tác ghi DB và gửi tin nhắn (MQ) phải nằm trong cùng một Transaction cục bộ.
- Sử dụng bảng `LTT_OUTBOX` để lưu tin nhắn trước khi đẩy đi.

## 2. Hash Chain Audit (BIZ-RULE-002)
- Các bản ghi giao dịch trọng yếu phải được liên kết bằng chuỗi Hash: `current_hash = SHA256(previous_hash + current_data + timestamp)`.
- Chống sửa lùi và đảm bảo tính toàn vẹn dữ liệu.

## 3. Saga Orchestration (BIZ-RULE-003)
- Với các luồng nghiệp vụ kéo dài qua nhiều Microservices (e.g., LTT LNH), sử dụng mô hình Saga để quản lý trạng thái và rollback nghiệp vụ (Compensating Transactions).

## 4. Separation of Duties (SoD)
- Áp dụng Check ràng buộc tại DB: `CHECK (CREATED_BY <> CHECKED_BY AND CHECKED_BY <> APPROVED_BY)`.

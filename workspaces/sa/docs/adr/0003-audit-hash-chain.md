# ADR-SA-0003: Kiểm toán chuỗi Hash SHA-256 cho tính toàn vẹn dữ liệu

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Hệ thống VDBAS xử lý Lệnh thanh toán đi NHNN — chứng từ điện tử có giá trị pháp lý trong quản lý Ngân sách Nhà nước. Quy định ngân hàng và KBNN yêu cầu nhật ký kiểm toán (audit log) không thể bị sửa xóa hoặc làm giả (immutable audit trail).

CLAUDE.md nguyên tắc 4: "Kiểm toán chuỗi Hash — Chống sửa lùi dữ liệu."

**Ràng buộc**:
- Mọi thao tác trên LTT phải được ghi audit: create, update, submit, approve, reject, cancel, sign, send (BIZ-AUDIT).
- Audit diff cấp trường khi Sửa: {field, oldValue, newValue} + version trước/sau (BIZ-EDIT-AUDIT).
- Audit log phải phát hiện được bất kỳ sửa đổi nào sau khi ghi.
- Hệ thống sử dụng Oracle 19c làm DB.

**Mối đe dọa cần đối phó**:
- Insider threat: DBA sửa trực tiếp bản ghi audit trong DB.
- Tampering: Kẻ tấn công sửa log để che giấu hành vi gian lận.
- Repudiation: Người dùng phủ nhận đã thực hiện thao tác.

**Các lựa chọn xem xét**:

1. **Append-only table** với quyền INSERT ONLY: Chỉ cho phép INSERT, không UPDATE/DELETE.
2. **Hash chain**: Mỗi audit entry chứa hash của entry trước + dữ liệu hiện tại, tạo thành chuỗi liên kết.
3. **Merkle Tree**: Cây băm cho phép xác minh tính toàn vẹn của tập hợp audit records.
4. **Blockchain** (on-prem): Lưu audit trên blockchain nội bộ.

## Decision

Chọn **Hash Chain SHA-256** (lựa chọn 2), kết hợp với append-only table (lựa chọn 1).

**Cơ chế hoạt động**:

```
Mỗi audit entry (dòng i):
  hash_i = SHA-256(
    hash_{i-1}          // hash của entry trước (chuỗi liên kết)
    | entity_type       // vd: 'PAYMENT_ORDER'
    | entity_id         // vd: So YCTT
    | action            // vd: 'SUBMIT', 'EDIT', 'APPROVE'
    | user_id           // người thực hiện
    | timestamp         // thời gian (UTC, microsecond precision)
    | payload           // JSON: {field, oldValue, newValue, version}
    | ip_address        // IP người dùng
  )

Entry đầu tiên (i=0):
  hash_0 = SHA-256(GENESIS_SALT | entity_type | entity_id | ...)
```

**Cấu trúc bảng audit**:

```
audit_log
├── id              (NUMBER, PK, sequence)
├── entity_type     (VARCHAR2) — vd: 'PAYMENT_ORDER'
├── entity_id       (VARCHAR2) — vd: So YCTT
├── action          (VARCHAR2) — vd: 'CREATE', 'EDIT', 'SUBMIT'
├── user_id         (VARCHAR2) — người thực hiện
├── performed_at    (TIMESTAMP(6)) — UTC, microsecond
├── ip_address      (VARCHAR2)
├── payload         (CLOB/JSON) — diff chi tiết
├── version_before  (NUMBER, nullable) — version trước
├── version_after   (NUMBER, nullable) — version sau
├── prev_hash       (VARCHAR2(64)) — hash của entry trước
├── hash            (VARCHAR2(64)) — hash của entry hiện tại
├── generated_by    (VARCHAR2) — 'AI_AGENT' / 'HUMAN' (ADR-0007)
└── is_verified     (NUMBER(1), default 0) — flag đã verify chưa
```

**Quy trình verify**:
1. Một batch job chạy hàng ngày (hoặc on-demand), quét audit_log theo entity_id, tính lại hash cho từng entry và so sánh với hash đã lưu.
2. Nếu phát hiện mismatch → alert ngay cho Admin và Security, đánh dấu `is_verified = 0`.
3. Báo cáo verify được lưu vào `audit_verification_log`.

**Bảo vệ bảng audit**:
- Oracle quyền INSERT ONLY cho application user.
- UPDATE/DELETE chỉ dành cho `AUDIT_ADMIN` role riêng (không phải application user).
- Trigger Oracle ngăn UPDATE/DELETE trên bảng `audit_log`.
- Backup định kỳ sang storage riêng (offline, read-only).

## Consequences

### Tích cực
- **Phát hiện sửa đổi**: Bất kỳ thay đổi nào trên một audit entry sẽ làm hỏng chuỗi hash, phát hiện được ngay.
- **Không thể chối cãi (Non-repudiation)**: Chuỗi hash liên kết chặt chẽ, user không thể phủ nhận thao tác đã ghi.
- **Đơn giản triển khai**: SHA-256 có sẵn trong Java (MessageDigest), không cần thư viện ngoài.
- **Hiệu quả verify**: Verify chỉ cần duyệt tuần tự và tính lại hash — O(n) với n là số entry của entity.
- **Tuân thủ quy định**: Đáp ứng yêu cầu kiểm toán bất biến của KBNN/NHNN.

### Tiêu cực
- **Overhead ghi**: Mỗi audit entry phải đọc prev_hash từ entry trước + tính SHA-256. Overhead ~1-2ms/entry.
- **Lưu trữ tăng**: Hash chain lưu prev_hash + hash cho mỗi entry (~128 bytes/entry thêm).
- **Verify toàn chuỗi khi nghi vấn**: Nếu phát hiện mismatch ở entry i, toàn bộ chuỗi từ i trở đi đều cần kiểm tra.
- **Không tự động sửa chữa**: Hash chain chỉ phát hiện, không sửa chữa. Cần quy trình vận hành riêng khi phát hiện vi phạm.

### Rủi ro và giảm thiểu
| Rủi ro | Mức độ | Giảm thiểu |
| :------ | :------ | :--------- |
| Hiệu năng ghi audit chậm do đọc prev_hash | LOW | Cache prev_hash gần nhất trong memory (last hash per entity_type); batch insert không dùng (phải tuần tự) |
| Mất entry giữa chừng (gap in chain) | MEDIUM | Verify job phát hiện gap; prev_hash != hash của entry liền trước → alert |
| DBA có quyền cao sửa cả hash | MEDIUM | Trigger chặn UPDATE/DELETE; backup offline; giám sát DBA activity |
| Hash collision SHA-256 | NEGLIGIBLE | SHA-256 collision xác suất ~2^-256, không đáng lo |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 4: Kiểm toán chuỗi Hash
- [CONTEXT.md](../../../../docs/CONTEXT.md) — Kiểm toán chuỗi Hash (định nghĩa)
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-AUDIT, BIZ-EDIT-AUDIT
- [ADR-0007](../../../../docs/adr/0007-full-attribution-layered-rollout.md) — Full Attribution (generated_by)
- NIST FIPS 180-4 — SHA-256 standard

# ADR-SA-0004: Khóa lạc quan (Optimistic Locking) cho cập nhật LTT

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Nhiều thao tác trên LTT yêu cầu kiểm soát đồng thời: Sửa (Edit), Xoá (Delete), Submit, Approve, Sign, Send. Hai người dùng (hoặc hai request) có thể thao tác trên cùng một LTT cùng lúc.

CLAUDE.md nguyên tắc 6: "Khóa lạc quan — Áp dụng cho mọi cập nhật LTT (sử dụng header If-Match)."

**Đặc thù nghiệp vụ**:
- Mỗi LTT thường chỉ có 1-2 người thao tác tại một thời điểm (Maker sửa, Checker/Approver duyệt).
- Xung đột (conflict) hiếm khi xảy ra vì quy trình tuần tự: Maker → Checker → Approver.
- Chỉ có Edit và Delete trên DRAFT/RETURNED_TO_MAKER cần kiểm soát đồng thời chặt (nhiều user có thể mở form cùng lúc).
- Các trạng thái khác (SUBMITTED, IN_CONTROL, APPROVED...) chỉ có 1 user thao tác tại mỗi bước.

**Ràng buộc**:
- BIZ-OPTIMISTIC-LOCK: Mọi thao tác Sửa/Xoá đều dùng optimistic-lock theo (id, version, updatedAt).
- VAL-036: Version client != version server → từ chối thao tác.
- Header HTTP `If-Match` chứa version hiện tại để server kiểm tra.
- API-011 (UpdateLTTDraft) trả 409 Conflict khi version mismatch.

**Các lựa chọn xem xét**:

1. **Khóa bi quan (Pessimistic Locking)**: Khoá bản ghi trên DB khi user mở form edit, giải phóng khi đóng form.
2. **Khóa lạc quan (Optimistic Locking)**: Kiểm tra version khi update, từ chối nếu version đã thay đổi.
3. **Không lock**: Tin tưởng client, không kiểm tra đồng thời.

## Decision

Chọn **Optimistic Locking với version column + If-Match header** (lựa chọn 2).

**Cơ chế hoạt động**:

```
1. Client mở LTT để sửa:
   GET /api/internal/ltt/{id}
   → Response header: ETag: "3"
   → Response body: { ..., version: 3, updatedAt: "2026-05-10T14:30:00Z" }

2. Client gửi yêu cầu sửa:
   PUT /api/internal/ltt/{id}
   Header: If-Match: "3"
   Body: { ..., version: 3, ... }

3. Server kiểm tra:
   - Đọc version hiện tại từ DB: SELECT version FROM payment_order WHERE id = ?
   - Nếu If-Match == version DB → cho phép update, version++
   - Nếu If-Match != version DB → trả 409 Conflict
     Response: { error: "VERSION_MISMATCH", currentVersion: 5, yourVersion: 3 }

4. Client nhận 409:
   - Hiển thị thông báo: "LTT đã được chỉnh sửa bởi user khác. Vui lòng tải lại."
   - Option: Hiển thị diff giữa version client và version server.
```

**Cấu trúc bảng**:

```
payment_order
├── id              (VARCHAR2, PK) — So YCTT
├── version         (NUMBER, NOT NULL, default 0) — optimistic lock version
├── updated_at      (TIMESTAMP(6)) — thời gian cập nhật cuối
├── updated_by      (VARCHAR2) — người cập nhật cuối
└── ... (các cột nghiệp vụ khác)
```

**Quy tắc áp dụng**:
- Optmistic lock áp dụng cho **mọi** thao tác UPDATE/DELETE trên `payment_order` (Edit, Delete, Submit, Approve, Reject, Sign, Send, Cancel).
- Chỉ Edit và Delete trên DRAFT/RETURNED_TO_MAKER yêu cầu If-Match từ client (API-011, API-012).
- Các thao tác workflow (Submit, Approve, Sign, Send) sử dụng version nội bộ — không bắt buộc client gửi If-Match vì mỗi bước chỉ có 1 user thao tác.
- Sau mỗi update thành công: `version = version + 1`, `updated_at = CURRENT_TIMESTAMP`, `updated_by = current_user`.

**Lý do chọn**:
- **Phù hợp đặc thù**: Xung đột hiếm (1-2 user/LTT), optimistic lock là mô hình tối ưu.
- **Khả năng mở rộng**: Không giữ lock trên DB → nhiều user có thể mở form cùng lúc, chỉ check version khi update.
- **Đồng bộ với API spec**: API-011, API-012 đã định nghĩa sẵn If-Match + 409 response.
- **Tuân thủ CLAUDE.md**: Nguyên tắc 6 yêu cầu optimistic lock.

## Consequences

### Tích cực
- **Khả năng mở rộng (Scalability)**: Không giữ DB lock → nhiều user làm việc song song mà không block nhau.
- **Đơn giản**: Triển khai dễ dàng với JPA `@Version` annotation trong Spring Boot.
- **Không deadlocks**: Không có database-level locks, loại bỏ rủi ro deadlock.
- **User experience tốt hơn**: User có thể mở form edit tự do, chỉ bị từ chối khi thực sự có xung đột.
- **Tương thích REST chuẩn**: ETag / If-Match là HTTP standard (RFC 7232).

### Tiêu cực
- **Xử lý xung đột**: Khi conflict xảy ra, user phải reload và nhập lại. Tuy nhiên, với tần suất xung đột thấp, điều này chấp nhận được.
- **Client phải gửi If-Match**: Frontend phải lưu ETag từ response GET và gửi lại khi PUT/DELETE. Thêm logic frontend.
- **Không phù hợp khi xung đột cao**: Nếu nhiều user cùng sửa một LTT, optimistic lock sẽ reject nhiều. Tuy nhiên, nghiệp vụ LTT không có kịch bản này.

### Rủi ro và giảm thiểu
| Rủi ro | Mức độ | Giảm thiểu |
| :------ | :------ | :--------- |
| User mất dữ liệu khi conflict | MEDIUM | Hiển thị diff giữa version cũ và mới; cho phép merge hoặc re-apply |
| Frontend quên gửi If-Match | LOW | Backend bắt buộc kiểm tra If-Match cho Edit/Delete; trả 428 Precondition Required nếu thiếu |
| Race condition giữa đọc và ghi | LOW | Database-level row lock trong transaction: SELECT ... FOR UPDATE khi verify version |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 6: Khóa lạc quan
- [CONTEXT.md](../../../../docs/CONTEXT.md) — Khóa lạc quan (định nghĩa)
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-OPTIMISTIC-LOCK
- [api-spec.yaml](../../../ba/domain/api-spec.yaml) — API-011, API-012 (If-Match, 409)
- [states.yaml](../../../ba/domain/states.yaml) — Transitions có guard BIZ-OPTIMISTIC-LOCK
- RFC 7232 — Hypertext Transfer Protocol (HTTP/1.1): Conditional Requests

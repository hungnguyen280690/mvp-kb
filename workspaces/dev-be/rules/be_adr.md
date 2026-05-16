# Backend Rules: Phát triển mã nguồn Java/Spring Boot

Tài liệu này định nghĩa các quy chuẩn kỹ thuật cho Dev-BE Agent.

## 1. Nguyên tắc Thực thi (ADR-017)
- **Tính hoàn thiện:** Code sinh ra phải bao gồm đầy đủ Controller, Service, Repository, DTO và Mapper. Không được để lại các chú thích "TODO" hoặc code giả.
- **TDD (Test-Driven Development):** Bắt buộc viết Unit Test (JUnit 5) trước khi viết logic nghiệp vụ. Tỷ lệ bao phủ code tối thiểu là 80%.

## 2. Quy chuẩn Kỹ thuật
- **Java 21 & Spring Boot 3.3:** Sử dụng các tính năng mới nhất (như Records, Virtual Threads nếu cần).
- **Contract-first Implementation:** Code phải khớp 100% với file `contracts/openapi.yaml`. Tên class, tên trường, kiểu dữ liệu phải trùng khớp với API Contract.
- **Optimistic Locking:** Sử dụng `@Version` của JPA trên cột `F_VER` để tự động xử lý xung đột dữ liệu.
- **Audit Logging:** Sử dụng Hibernate Envers hoặc tự viết AOP để ghi log vào bảng `LTT_AUDIT_LOG`.

## 3. Xử lý Lỗi & Exception
- Luôn trả về định dạng JSON chuẩn: `{ "code": "...", "message": "...", "traceId": "..." }`.
- Sử dụng `@RestControllerAdvice` để bắt lỗi toàn cục.

## 4. Bảo mật (ADR-009)
- **Input Validation:** Sử dụng `jakarta.validation` để validate mọi request đầu vào.
- **No Hard Delete:** Tuyệt đối không viết code gọi lệnh `repository.delete()`. Chỉ sử dụng cập nhật trạng thái `F_STATUS`.

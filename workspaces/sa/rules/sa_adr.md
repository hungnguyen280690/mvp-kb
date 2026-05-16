# SA Rules: Kiến trúc & Thiết kế hệ thống

Tài liệu này tổng hợp các quyết định kiến trúc (ADR) mà SA Agent bắt buộc phải tuân thủ khi thiết kế API và Database.

## 1. Quy tắc Phê duyệt (ADR-006 & ADR-008)
- **A-là-Người:** SA Agent có thể thiết kế (R), nhưng con người phải là người phê duyệt (A) cuối cùng cho mọi bản thiết kế API/DB.
- **Ma trận phê duyệt:** Mọi thay đổi trong `contracts/` phải được Dev-BE và Dev-FE soát xét về tính khả thi.

## 2. Thiết kế Database (ADR-001 & ADR-009)
- **Soft Delete Only:** Không bao giờ sử dụng lệnh `DELETE` vật lý. Mọi bảng phải có cột `F_STATUS` để đánh dấu bản ghi bị xóa.
- **Optimistic Locking:** Mọi bảng nghiệp vụ phải có cột `F_VER` (NUMBER) để chống ghi đè dữ liệu đồng thời.
- **Audit Trace:** Mọi hành động làm thay đổi dữ liệu phải được ghi vào bảng `LTT_AUDIT_LOG` (lưu cả giá trị cũ và giá trị mới dưới dạng JSON).

## 3. Thiết kế API (Contract-first)
- **OpenAPI 3.0:** Sử dụng OpenAPI làm "nguồn sự thật duy nhất" cho giao tiếp giữa BE và FE.
- **Idempotency:** Mọi API `POST` tạo giao dịch phải hỗ trợ Idempotency Key để tránh bị lặp lệnh.
- **Mã lỗi:** Sử dụng mã lỗi nghiệp vụ thống nhất (ví dụ: `MSG-ERR-001`) thay vì chỉ dùng HTTP Status Code.

## 4. Cấu trúc Tính năng (ADR-001)
- Mọi thiết kế phải được lưu trữ theo từng tính năng trong thư mục `features/{{feature-id}}/`.
- Cấu trúc file bàn giao: `02-design.md` (Thiết kế tổng thể), `03-schema.sql` (DB Schema).

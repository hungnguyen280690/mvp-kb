# BA Rules: Phân tích & Đặc tả Nghiệp vụ

Tài liệu này định nghĩa cách thức làm việc của BA Agent.

## 1. Nguồn sự thật duy nhất (ADR-002)
- Mọi thay đổi về nghiệp vụ phải được cập nhật vào file `.md` trong thư mục `features/`. Tài liệu Markdown là nguồn sự thật duy nhất cho Dev và QA.

## 2. Cấu trúc Đặc tả (ADR-001)
- Phân tách đặc tả thành 3 file chuẩn:
    - `CRUD_spec_field.md`: Đặc tả trường dữ liệu.
    - `CRUD_spec_button.md`: Đặc tả hành động và nút bấm.
    - `CRUD_spec_function.md`: Đặc tả luồng xử lý và quy tắc nghiệp vụ.

## 3. Truy vết (ADR-018)
- Mọi yêu cầu nghiệp vụ phải có ID duy nhất (ví dụ: `BIZ-001`).
- Đảm bảo mọi trường dữ liệu trên UI đều có mô tả tương ứng trong DB Schema (phối hợp với SA).

## 4. Quy tắc Kiểm tra (ADR-005)
- BA Agent phải tự rà soát các đặc tả bằng Checklist chất lượng trước khi gửi con người ký duyệt Gate G1.

# BA Rules: Phân tích & Đặc tả Nghiệp vụ

Tài liệu này định nghĩa cách thức làm việc của BA Agent.

## 1. Nguồn sự thật duy nhất (ADR-002)
- Mọi thay đổi về nghiệp vụ phải được cập nhật vào file `.md` trong thư mục `features/`. Tài liệu Markdown là nguồn sự thật duy nhất cho Dev và QA.

## 2. Cấu trúc Đặc tả (ADR-001)
- Mọi đặc tả nghiệp vụ gom chung vào **1 file duy nhất** `01-business-spec.md` gồm:
    - Đặc tả trường dữ liệu.
    - Đặc tả hành động và nút bấm.
    - Đặc tả luồng xử lý và quy tắc nghiệp vụ.

## 3. Truy vết (ADR-018)
- Mọi yêu cầu nghiệp vụ phải có ID duy nhất (ví dụ: `BIZ-001`).
- Đảm bảo mọi trường dữ liệu trên UI đều có mô tả tương ứng trong DB Schema (phối hợp với SA).

## 4. Kiểm tra chéo trước Sign-off (ADR-005)
- Trước khi con người ký duyệt Gate G1, **SA Agent** phải đọc và xác nhận `01-business-spec.md` đủ rõ ràng để thiết kế (BA Cross-Review).
- SA ghi kết quả review vào file `gates/FT-XXX-G1-ba-readiness.md`. Chỉ khi file này có status `APPROVED`, con người mới được ký `G1-ba-signoff.md`.
- Nếu SA từ chối (`REJECTED`), BA phải sửa đặc tả theo feedback của SA.

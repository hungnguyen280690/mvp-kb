# BA Rules: Phân tích & Đặc tả Nghiệp vụ

Tài liệu này định nghĩa cách thức làm việc của BA Agent.

## 0. Đầu vào bắt buộc (ADR-019)

Trước khi phân tích, BA phải kiểm tra đủ các file đầu vào trong `features/FT-XXX/`:

- File `01-po-requirement.md` — Yêu cầu thô từ PO.
- **Tối thiểu 1 file HTML mẫu** (`*.html`) — Export từ Figma hoặc design tool.
- **File CSS mẫu** (`*.css`) — Style cho HTML mẫu.
- (Tùy chọn) File ảnh UI (`*.png`, `*.jpg`) — Hữu ích cho Dev/QA tham khảo visual.
- (Tùy chọn) File Use Case MD — Mô tả use case chi tiết.

Nếu thiếu file HTML mẫu, BA phải dừng và yêu cầu PO cung cấp.

## 1. Nguồn sự thật duy nhất (ADR-002)

- Mọi thay đổi về nghiệp vụ phải được cập nhật vào file `.md` trong thư mục `features/`. Tài liệu Markdown là nguồn sự thật duy nhất cho Dev và QA.

## 2. Cấu trúc Đặc tả (ADR-001) — Tách 3 file

- Đặc tả nghiệp vụ được chia thành **3 file riêng biệt**:
  - `01_spec_field.md` — Đặc tả trường dữ liệu (tên field, kiểu dữ liệu, bắt buộc, default, constraint).
  - `01_spec_button.md` — Đặc tả nút bấm & hành động (action name, điều kiện hiển thị, xác nhận, icon).
  - `01_spec_function.md` — Đặc tả luồng xử lý & quy tắc nghiệp vụ (BIZ-xxx, VAL-xxx, state machine, validation rules).
- BA phải phân tích file HTML mẫu để trích xuất chính xác trường, nút bấm và luồng xử lý.

## 3. Truy vết (ADR-018)

- Mọi yêu cầu nghiệp vụ phải có ID duy nhất (ví dụ: `BIZ-001`).
- Đảm bảo mọi trường dữ liệu trên UI (HTML mẫu) đều có mô tả tương ứng trong `01_spec_field.md` và DB Schema (phối hợp với SA).

## 4. Kiểm tra chéo trước Sign-off (ADR-005)

- Trước khi con người ký duyệt Gate G1, **SA Agent** phải đọc và xác nhận cả 3 file spec (`01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`) đủ rõ ràng để thiết kế (BA Cross-Review).
- SA ghi kết quả review vào file `gates/FT-XXX-G1-ba-readiness.md`. Chỉ khi file này có status `APPROVED`, con người mới được ký `G1-ba-signoff.md`.
- Nếu SA từ chối (`REJECTED`), BA phải sửa đặc tả theo feedback của SA.

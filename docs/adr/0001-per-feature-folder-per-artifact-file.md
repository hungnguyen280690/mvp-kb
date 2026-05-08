# ADR-0001: Cấu trúc thư mục theo từng tính năng và từng sản phẩm bàn giao

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA), DevOps, tham vấn tất cả các vai trò
- **Thẻ:** kiến-trúc-tài-liệu, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Chúng ta cần một hệ thống quản lý tài liệu SDLC dựa trên Markdown cho 8 vai trò (PO, BA, SA, DBA, Dev, QA, DevOps, Bảo mật) với nhiều nhân sự cho mỗi vai trò. Mục tiêu đặt ra là **không thiếu sót, không mâu thuẫn, không chồng chéo** giữa các vai trò/phạm vi/nhiệm vụ trong suốt vòng đời dự án (từ ý tưởng → yêu cầu → phân tích → thiết kế → lập trình → kiểm thử → triển khai).

Cách tiếp cận thông thường là "dùng chung một file .md" sẽ thất bại ngay lập tức:

- **Một file chung duy nhất** được chỉnh sửa bởi hơn 8 vai trò sẽ gây ra xung đột khi trộn mã nguồn (merge conflict) liên tục.
- **Mỗi vai trò một file** (`ba.md`, `dba.md`, ...) sẽ làm phân mảnh tài liệu theo tác giả thay vì theo nội dung. Cùng một thông tin (ví dụ: cấu trúc bảng DB) sẽ nằm ở 3 file khác nhau dẫn đến mất đồng bộ. Đây chính là sự "chồng chéo".
- **Các mục trong cùng một file với quyền sở hữu theo mục** là không thể thực thi được vì GitHub CODEOWNERS không hỗ trợ phân quyền chi tiết dưới mức file.

Chúng ta cần một cấu trúc mà: (a) mỗi thông tin chỉ có một file duy nhất, (b) mỗi file chỉ có một người viết tại một thời điểm, (c) mỗi vai trò có quyền sở hữu rõ ràng, và (d) cấu trúc này có thể mở rộng cho nhiều tính năng chạy song song.

## Quyết định

Áp dụng cấu trúc **thư mục theo từng tính năng + file riêng cho từng sản phẩm bàn giao**. Mỗi tính năng đang thực hiện sẽ có một thư mục riêng trong `features/`. Bên trong thư mục đó là tập hợp các file sản phẩm cố định, mỗi file do đúng một vai trò sở hữu thông qua CODEOWNERS, với các vai trò soát xét (reviewer) cụ thể.

```
features/2026-XX-<tên-tính-năng>/
├── OWNERS.md              # Phân công nhân sự cho tính năng này
├── 00-idea.md             # PO sở hữu, BA soát xét
├── 01-requirements.md     # BA sở hữu, PO + SA + QA + Bảo mật soát xét
├── 02-design.md           # SA sở hữu, Dev + DBA + Bảo mật soát xét
├── 03-schema.md           # DBA sở hữu, Dev + SA soát xét
├── 04-test-plan.md        # QA sở hữu, Dev + BA soát xét
├── 05-runbook.md          # DevOps sở hữu, SA + Dev + Bảo mật soát xét
├── 06-threat-model.md     # Bảo mật sở hữu
└── decisions/             # Các bản nháp ADR nội bộ của tính năng
```

Việc tham chiếu giữa các sản phẩm được thực hiện qua **liên kết Markdown** đến các file/mục cụ thể — tuyệt đối không sao chép nội dung. Mỗi thông tin chỉ nằm tại một file gốc duy nhất.

## Hệ quả

### Tích cực

- **Không có xung đột merge file**: Mỗi sản phẩm chỉ có một vai trò sở hữu, vì vậy tại một thời điểm chỉ có một tác giả viết.
- **Không chồng chéo nội dung**: Một thông tin (ví dụ: cấu trúc bảng) chỉ nằm ở `03-schema.md`; các file khác chỉ dẫn link đến đó.
- **Không thiếu sót sản phẩm**: Công cụ kiểm tra (linter) sẽ xác nhận mọi thư mục tính năng đều phải có đủ các file theo mẫu.
- **Tính nhất quán đa vai trò**: Các vai trò liên quan bắt buộc phải soát xét PR. Ví dụ, `02-design.md` không thể merge nếu thiếu sự phê duyệt của DBA và Bảo mật.
- **Thứ tự vòng đời rõ ràng**: Việc đánh số file (00, 01, ...) giúp nhận biết giai đoạn mà không cần chia thư mục theo giai đoạn.

### Hạn chế / Chi phí

- **Số lượng file nhiều hơn**: Cần một trang tổng hợp (dashboard) để dễ dàng tra cứu.
- **Yêu cầu các bản mẫu (Template)**: Để đảm bảo cấu trúc nội dung thống nhất.
- **Cần công cụ kiểm tra (Linter)**: Để phát hiện các file bị thiếu hoặc các mục bị để trống.
- **Liên kết có thể bị hỏng nếu đổi tên file**: Cần duy trì đường dẫn ổn định.

## Các phương án đã cân nhắc

### A. Một file chia sẻ duy nhất (`SDLC.md` chứa tất cả các giai đoạn) — Bị loại bỏ

Gây ra xung đột merge liên tục và không thể phân quyền sở hữu theo vai trò.

### B. Mỗi vai trò một file (`po.md`, `dba.md`, ...) — Bị loại bỏ

Làm phân mảnh nội dung. Thông tin về DB sẽ nằm ở cả file của DBA, Dev và DevOps. Dẫn đến mất đồng bộ nhanh chóng.

### C. Các file sản phẩm dùng chung cho toàn bộ kho lưu trữ (`/docs/design.md`, ...) — Bị loại bỏ

Chỉ hoạt động nếu tại một thời điểm chỉ có duy nhất một tính năng được thực hiện. Khi có nhiều tính năng chạy song song, mọi vai trò sẽ sửa cùng một file `design.md`, gây ra xung đột merge trầm trọng.

## Liên kết liên quan

- **ADR-0002** — Tài liệu là nguồn dữ liệu gốc duy nhất (Trạng thái vòng đời nằm trong khai báo đầu file).
- **ADR-0005** — Quy trình kiểm tra quy tắc chất lượng (Công cụ kiểm tra cấu trúc này).

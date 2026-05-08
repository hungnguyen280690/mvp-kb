# ADR-0004: Bảo mật hai tầng (`docs-platform` + `docs-confidential`) với phân loại ở phần đầu file

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Bảo mật (SA dẫn dắt), DevOps, SA, tham vấn tất cả các vai trò
- **Thẻ:** bảo-mật, tuân-thủ, cấu-trúc-kho-lưu-trữ
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Hệ thống tài liệu được thiết kế trong các ADR-0001 / ADR-0002 / ADR-0003 giả định rằng bất kỳ ai có quyền truy cập vào repo đều có thể đọc mọi thứ. Mô hình đó mâu thuẫn với các loại nội dung **không thể chia sẻ công khai**:

- **Mô hình hóa mối đe dọa** — Bản đồ về cách tấn công chúng ta.
- **Bằng chứng tuân thủ** — Các chứng nhận SOC2/HIPAA/PCI/GDPR, ánh xạ kiểm soát, trích xuất nhật ký kiểm toán.
- **Kịch bản xử lý sự cố bảo mật** — Các tài liệu vận hành nêu chi tiết cách khai thác, các nút thắt khẩn cấp.
- **Tham chiếu khách hàng / Dữ liệu cá nhân (PII)** — Các cột PII được nêu tên trong tài liệu cấu trúc bảng, các truy vấn ví dụ với dữ liệu thực tế.
- **Điều khoản / Giá cả của nhà cung cấp** — Tính bảo mật của hợp đồng.
- **Chiến lược trước khi công bố** — Lộ trình sản phẩm đang được giữ kín.

GitHub không hỗ trợ **kiểm soát truy cập theo từng file** bên trong một repo. Ranh giới truy cập duy nhất là ở **mức repo**. Do đó: bất kỳ nội dung nào cần các cấp độ hiển thị khác nhau đều phải nằm ở **các repo khác nhau**.

Nội dung tuân thủ còn cần thêm:

- **Chuỗi lưu ký (Chain of custody)** — Các commit phải được ký số, bắt buộc phải có CODEOWNERS.
- **Tính bất biến** — Chỉ thêm vào (append-only), không cho phép ép đẩy (force-push), phát hành dựa trên thẻ (tag).
- **Lưu trữ** — Các giai đoạn lưu trữ được ghi chép lại, tự động lưu trữ hoặc xóa.
- **Nhật ký kiểm toán** — Mọi thay đổi đều được liên kết với một phiếu yêu cầu kèm theo lý do.

Các yêu cầu này nghiêm ngặt hơn tài liệu thông thường và không phù hợp với một repo ADR thông thường.

## Quyết định

Áp dụng **bảo mật hai tầng** với **phân loại ở phần khai báo đầu file** trên mọi sản phẩm bàn giao:

**Tầng 1 — `docs-platform`** (Toàn tổ chức có quyền đọc, repo trung tâm từ ADR-0003)

- NGỮ CẢNH, các ADR an toàn công khai, tiêu chuẩn, bản mẫu, bảng theo dõi, mã nguồn công cụ kiểm tra.
- Phân loại mặc định: `Internal` (Nội bộ).
- Một số nội dung có thể là `Public` (Công khai - ví dụ: tổng quan kiến trúc của một dự án mã nguồn mở).

**Tầng 2 — `docs-confidential`** (Bị khóa chặt, do bộ phận Bảo mật sở hữu)

- Mô hình mối đe dọa, bằng chứng tuân thủ, các chính sách hạn chế, kịch bản bảo mật.
- Phân loại mặc định: `Confidential` (Bảo mật) hoặc `Restricted` (Hạn chế).
- Bắt buộc ký số commit; bắt buộc có CODEOWNERS cho bất kỳ lần trộn mã nguồn nào.
- Nhánh chỉ cho phép thêm; phát hành dựa trên thẻ; thông tin siêu dữ liệu về thời gian lưu trữ được ghi chép rõ ràng.

**Phân loại ở phần đầu file** trên mọi sản phẩm bàn giao ở tất cả các repo:

```yaml
classification: Public | Internal | Confidential | Restricted
```

**Mô hình "Liên kết và Thế chỗ" (Stub-and-link)** cho các nội dung mật được tham chiếu từ repo mở:

- File `06-threat-model.md` của một tính năng trong repo mã nguồn là một **file thế chỗ (stub)** với `classification: Internal` chỉ chứa nội dung `xem tại internal/threat-models/2026-05-feature.md` và một liên kết đến `docs-confidential`.
- Nội dung mô hình mối đe dọa thực tế nằm trong `docs-confidential/threat-models/`.
- Công cụ kiểm tra sẽ lấy dữ liệu từ `docs-confidential` bằng một **mã máy (machine-account token)** để xác nhận file đích tồn tại và không bị lạc hậu — mà **không hiển thị nội dung** trong repo mở.

**Các quy tắc kiểm tra được thực thi:**

- Các file `Public` không được chứa các mẫu dữ liệu cá nhân (PII).
- Các file `Restricted` yêu cầu commit có chữ ký số + thông tin lưu trữ.
- Một thư mục tính năng không được chứa trực tiếp sản phẩm `Confidential`/`Restricted` (phải dùng mô hình liên kết và thế chỗ đến `docs-confidential`).
- Các liên kết chéo repo từ file `Internal` đến đường dẫn trong `docs-confidential` chỉ được phép ở dạng file thế chỗ (chỉ có link, không có nội dung trích dẫn).

**Quyền sở hữu:** Vai trò Bảo mật **sở hữu** `docs-confidential` (với sự đồng sở hữu từ DevOps cho các công cụ). Điều này giúp Bảo mật có một nơi để họ chịu trách nhiệm chính, không chỉ là một vai trò soát xét.

## Hệ quả

### Tích cực

- **Ranh giới bảo mật thực sự** ở mức repo — việc rò rỉ `docs-confidential` yêu cầu phải được cấp quyền rõ ràng, không phải do vô ý chia sẻ.
- **Duy trì vị thế tuân thủ** — chuỗi lưu ký, tính bất biến, việc lưu trữ đều có thể thực hiện được trong `docs-confidential` mà không làm ảnh hưởng đến `docs-platform`.
- **Bảo mật có quyền sở hữu rõ ràng** đối với nơi chứa sản phẩm của mình.
- **Các kiểm toán viên có thể được cấp quyền truy cập giới hạn** chỉ vào `docs-confidential`.
- **Các file thế chỗ duy trì tính toàn vẹn của biểu đồ tài liệu** — các thư mục tính năng vẫn có file `06-threat-model.md`; mục tiêu "không thiếu sót" vẫn có thể thực thi được.

### Hạn chế / Chi phí

- **Thêm một repo và ma trận quyền truy cập** cần duy trì.
- **Độ phức tạp của công cụ kiểm tra tăng lên**: Xử lý mã bí mật, các quy tắc phân loại, xác thực mục tiêu thế chỗ, lấy dữ liệu chéo repo.
- **Chi phí tuân thủ là có thực**: Ký số commit, tự động hóa lưu trữ, kỷ luật nhật ký kiểm toán.
- **Các file thế chỗ trong repo mở là một bề mặt rò rỉ thông tin**: Chúng tiết lộ rằng có một mô hình mối đe dọa tồn tại cho tính năng X.
- **Quản lý mã (Token)**: Mã máy để lấy dữ liệu chéo repo phải được thay đổi định kỳ, giới hạn quyền chỉ đọc và có nhật ký kiểm toán.

### Trung lập

- **Tùy chọn phản chiếu công khai**: Nội dung trong `docs-platform` được phân loại là `Public` có thể được xuất ra một trang web tĩnh công khai.
- **Mở rộng ba tầng**: Có thể thêm tầng thứ tư cho các nội dung tối mật nếu phạm vi dự án mở rộng.

## Các phương án đã cân nhắc

### A. Một repo riêng tư duy nhất cho tất cả — Bị loại bỏ

Chỉ hoạt động cho các tổ chức nhỏ nơi mọi người đều có quyền đọc mọi thứ. Bỏ qua nguyên tắc đặc quyền tối thiểu.

### B. Một repo duy nhất + phân loại ở đầu file (không chia quyền truy cập) — Bị loại bỏ

Chỉ gắn nhãn nội dung nhưng không thể thực thi việc hiển thị. Đây không phải là một cơ chế kiểm soát bảo mật.

### C. Nội dung bảo mật không để ở dạng Markdown — Cân nhắc

Làm mất đi nguồn dữ liệu gốc duy nhất và đẩy việc quản lý tuân thủ cho một bên thứ ba. Nếu tổ chức đã có sẵn các công cụ như Vanta hay IriusRisk thì có thể cân nhắc. Nếu không, Markdown hai tầng sẽ gắn kết hơn.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục theo từng tính năng (file `06-threat-model.md` là bề mặt liên kết thế chỗ).
- **ADR-0003** — Mô hình đa repo lai (`docs-confidential` là repo thứ ba trong cấu trúc).
- **ADR-0005** — Quy trình kiểm tra quy tắc chất lượng (các quy tắc phân loại thực thi điều này).

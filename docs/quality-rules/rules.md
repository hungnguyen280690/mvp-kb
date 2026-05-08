# Quy tắc Chất lượng — Danh sách Đầy đủ

## R0010–R0099: Cấu trúc & Định dạng

### R0010 — Yêu cầu Khai báo đầu file (Front-matter)

**BẮT BUỘC**. Mọi sản phẩm bàn giao dạng `.md` phải có phần khai báo YAML đầu file với các trường: `status` (trạng thái), `classification` (phân loại), `applies_adrs` (các ADR áp dụng).

### R0011 — Các giá trị Trạng thái

**BẮT BUỘC**. Trường `status` chỉ chấp nhận các giá trị: `Draft` (Nháp), `In-Review` (Đang soát xét), `Active` (Hiệu lực), `Deprecated` (Hết hạn), `Superseded` (Được thay thế).

### R0012 — Các giá trị Phân loại

**BẮT BUỘC**. Trường `classification` chỉ chấp nhận các giá trị: `Public` (Công khai), `Internal` (Nội bộ), `Confidential` (Bảo mật), `Restricted` (Hạn chế).

### R0013 — Quy ước đặt tên

**BẮT BUỘC**. Tên file sản phẩm bàn giao phải theo định dạng: `{Số_thứ_tự}-{tên-sản-phẩm}.md` (từ 00 đến 08).

### R0014 — Một người viết cho mỗi sản phẩm

**BẮT BUỘC**. Mỗi sản phẩm bàn giao chỉ có duy nhất một vai sở hữu (vai chịu trách nhiệm chính trong ma trận RACI). Các vai khác chỉ đóng vai trò tham vấn hoặc nhận thông tin.

### R0020 — Chuyển đổi trạng thái vòng đời

**CẦN TUÂN THỦ**. Sản phẩm bàn giao phải tuân theo luồng trạng thái: `Draft → In-Review → Active`. Các trạng thái `Deprecated` và `Superseded` cần có tham chiếu đến file thay thế.

### R0030 — Ghim mã SHA khi tham chiếu chéo

**BẮT BUỘC**. Mọi tham chiếu chéo đến file khác phải dùng đường dẫn tương đối. Nếu tham chiếu giữa các kho lưu trữ (repo) khác nhau, phải ghim mã SHA của commit.

### R0040 — Tham chiếu ADR

**CẦN TUÂN THỦ**. Mỗi sản phẩm bàn giao nên khai báo trường `applies_adrs` trong phần đầu file để liệt kê các Quyết định Kiến trúc (ADR) có ảnh hưởng.

### R0042 — Tính nhất quán với ADR Schema

**BẮT BUỘC**. Việc thực thi không được mâu thuẫn với các ADR đang có hiệu lực.

## R0100–R0199: Độ bao phủ & Tính đầy đủ

### R0100 — Yêu cầu đầy đủ các sản phẩm bàn giao

**BẮT BUỘC**. Mỗi tính năng (feature) phải có đủ 9 sản phẩm bàn giao: từ `00-idea.md` đến `08-test-data.md`.

### R0101 — Sản phẩm Ý tưởng là bắt buộc

**BẮT BUỘC**. File `00-idea.md` phải được hoàn thành trước khi bắt đầu bất kỳ sản phẩm bàn giao nào khác.

### R0103 — Yêu cầu kịch bản Rollback (Hoàn tác)

**BẮT BUỘC**. Mỗi kịch bản thay đổi cấu trúc DB (migration) phải có kịch bản hoàn tác tương ứng.

### R0110 — Ma trận truy xuất nguồn gốc (Traceability matrix)

**CẦN TUÂN THỦ**. Mỗi tính năng nên có ma trận truy xuất nguồn gốc ánh xạ từ quy tắc nghiệp vụ sang các ca kiểm thử (test cases).

### R0120 — Độ bao phủ của kế hoạch kiểm thử

**BẮT BUỘC**. Kế hoạch kiểm thử phải bao phủ toàn bộ các quy tắc nghiệp vụ (BIZ) và quy tắc kiểm soát (VAL) từ tài liệu yêu cầu.

## R0200–R0246: Tính nhất quán & Liên kết sản phẩm

### R0200 — Khả năng truy xuất từ Yêu cầu đến Thiết kế

**BẮT BUỘC**. Mọi yêu cầu trong `01-requirements.md` phải có quyết định thiết kế tương ứng trong `02-design.md`.

### R0207 — Chú thích phân loại dữ liệu cá nhân (PII)

**BẮT BUỘC**. Mọi cột hoặc trường dữ liệu cá nhân phải có chú thích về phân loại bảo mật. Các sản phẩm công khai KHÔNG được chứa dữ liệu cá nhân thực tế.

### R0210 — Tính nhất quán giữa Hợp đồng API và Mã nguồn

**BẮT BUỘC**. Hợp đồng OpenAPI phải khớp hoàn toàn với mã nguồn thực thi. Sẽ có công cụ kiểm tra (oasdiff) để chặn các thay đổi gây lỗi.

### R0220 — Tiêu chuẩn tiếp cận của Đặc tả UI

**BẮT BUỘC**. File `07-ui-spec.md` phải khai báo việc tuân thủ tiêu chuẩn tiếp cận (ví dụ: WCAG 2.1 AA tối thiểu).

### R0230 — An toàn dữ liệu kiểm thử

**BẮT BUỘC**. File `08-test-data.md` KHÔNG được chứa dữ liệu cá nhân thật. Chỉ dùng dữ liệu giả lập.

### R0240 — Độ bao phủ từ Yêu cầu đến Hợp đồng API

**BẮT BUỘC**. Mọi yêu cầu về API trong `01-requirements.md` phải có endpoint tương ứng trong hợp đồng OpenAPI.

### R0241 — Độ bao phủ từ Hợp đồng API đến Mã nguồn

**CẦN TUÂN THỦ**. Mọi endpoint trong OpenAPI nên được thực thi trong mã nguồn.

### R0242 — Độ bao phủ của kế hoạch kiểm thử đối với yêu cầu

**BẮT BUỘC**. Mọi quy tắc BIZ/VAL phải có ít nhất 1 ca kiểm thử trong kế hoạch kiểm thử.

### R0243 — Độ bao phủ của Đặc tả UI đối với màn hình

**BẮT BUỘC**. Mọi màn hình được liệt kê trong `screens.yaml` phải có mục đặc tả UI tương ứng.

### R0244 — Độ bao phủ dữ liệu kiểm thử

**CẦN TUÂN THỦ**. Mọi bước chuyển đổi trạng thái nên có dữ liệu kiểm thử tương ứng.

### R0245 — Lan truyền thay đổi từ thượng nguồn

**BẮT BUỘC**. Khi một sản phẩm ở giai đoạn trước thay đổi (ví dụ: thay đổi yêu cầu), các sản phẩm ở giai đoạn sau phải được soát xét và cập nhật theo (quy trình ripple update).

### R0246 — Phát hiện phần tử mồ côi (Orphan)

**CẦN TUÂN THỦ**. Các phần trong sản phẩm bàn giao không có tham chiếu từ giai đoạn trước sẽ bị coi là mồ côi và cần được soát xét lại.

## Thực thi

- **CI doc-lint job**: Chạy các quy tắc BẮT BUỘC, chặn lệnh merge nếu thất bại.
- **Pre-commit hooks**: Chạy các quy tắc CẦN TUÂN THỦ, đưa ra cảnh báo nếu thất bại.
- **Soát xét thủ công**: Các quy tắc CÓ THỂ sẽ do người soát xét kiểm tra trong các buổi họp kiểm soát cổng chất lượng (gate review).

Xem thêm: [lifecycle.md](./lifecycle.md) để biết quy trình xin ngoại lệ (waiver).

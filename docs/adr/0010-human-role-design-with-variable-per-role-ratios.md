# ADR-0010: Thiết kế vai trò con người với tỷ lệ linh hoạt và các biện pháp bảo vệ cấu trúc

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA) + Quản lý kỹ thuật (lead), DevOps, tham vấn nhân sự/lãnh đạo
- **Thẻ:** agent, tổ-chức, vai-trò-con-người, tính-bền-vững
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Các ADR 0006-0009 xây dựng các cơ chế vận hành (vai trò, ghi nhận, cổng soát xét, phòng thủ) nhưng chưa định nghĩa **con người thực sự làm gì** trong tỷ lệ 30/70. Giả định mặc định là "con người làm những gì Agent không làm" sẽ dẫn đến các lỗi hệ thống có thể dự đoán được:

| Lỗi hệ thống        | Triệu chứng                                                                            | Lộ trình   |
| :------------------ | :------------------------------------------------------------------------------------- | :--------- |
| Phê duyệt tự động   | PR được duyệt sau 2 phút mở; con người không thực sự đọc.                              | Vài tuần   |
| Teo tóp kỹ năng     | Con người không tự viết gì từ đầu trong nhiều tháng; mất khả năng đào tạo nhân sự trẻ. | Vài tháng  |
| Sụp đổ tinh thần    | "Tôi chỉ là người dọn dẹp đầu ra của AI"; tỷ lệ nghỉ việc tăng cao.                    | 6-12 tháng |
| Phân mảnh kiến thức | Agent đưa ra quyết định, người duyệt cho xong; không ai hiểu toàn bộ hệ thống.         | Vài tháng  |

Nếu không có thiết kế vai trò rõ ràng, **sản lượng 70% của Agent sẽ biến vai trò con người thành "người gác cổng" thuần túy**. Việc gác cổng không giúp phát triển sự nghiệp, không xây dựng chuyên môn và không thể đào tạo người mới. Hệ thống sẽ sụp đổ khi những nhân sự nòng cốt đầu tiên rời đi.

Việc áp dụng cứng nhắc tỷ lệ 30/70 cho tất cả các vai trò cũng là sai lầm — mỗi vai trò có mật độ phán đoán và hồ sơ rủi ro khác nhau. Bảo mật và PO cần tỷ lệ con người cao hơn so với QA hoặc Dev thông thường.

## Quyết định

Áp dụng **thiết kế vai trò con người rõ ràng** với năm thành phần chính:

### 1. Năm loại công việc con người BẮT BUỘC phải thực hiện

| Loại công việc          | Mô tả                                                                 | Tại sao Agent không thể thay thế                     |
| :---------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------- |
| **Định hướng**          | Định nghĩa thứ cần xây dựng, mục tiêu kinh doanh, ưu tiên, phạm vi.   | Agent thiếu ngữ cảnh của các bên liên quan.          |
| **Phán đoán trọng yếu** | Các quyết định cấp A: ADR, giải quyết đánh đổi, chấp nhận rủi ro.     | Quy tắc A-luôn-là-người (ADR-0006).                  |
| **Tích hợp**            | Tư duy liên hệ thống; phát hiện tương tác chéo giữa các tính năng.    | Agent chỉ làm việc trong ngữ cảnh hẹp.               |
| **Gỡ rối & Phục hồi**   | Giải quyết khi Agent bế tắc, xử lý sự cố, các tình huống mới lạ.      | Theo định nghĩa: nơi mà Agent đã thất bại.           |
| **Hiệu chuẩn**          | Tinh chỉnh prompt, danh sách Agent; định nghĩa tiêu chuẩn chất lượng. | Agent không thể tự hiệu chuẩn một cách đáng tin cậy. |

### 2. Mục tiêu tỷ lệ linh hoạt theo từng vai trò

| Vai trò        | Tỷ lệ mục tiêu (Người/Agent) | Lý do                                                                      |
| :------------- | :--------------------------- | :------------------------------------------------------------------------- |
| PO             | 90/10                        | Chiến lược, quan hệ đối tác.                                               |
| BA             | 60/40                        | Khơi gợi yêu cầu là việc của người; cấu trúc hóa là việc của Agent.        |
| SA (Kiến trúc) | 60/40                        | Quyết định là việc của người; phân tích thường nhật là Agent.              |
| Dev            | 30/70                        | Mặc định — Agent xử lý các khuôn mẫu mã nguồn.                             |
| QA             | 25/75                        | Agent tạo khung/bao phủ lỗi cũ tốt; người tập trung vào kiểm thử khám phá. |
| Bảo mật        | 70/30                        | Mô hình mối đe dọa, chính sách cần con người; quét lỗi cần Agent.          |

### 3. Biện pháp bảo vệ cấu trúc

- **Chống phê duyệt tự động**: Công cụ kiểm tra đo lường thời gian từ khi mở PR đến khi duyệt. Các phê duyệt < 30 giây cho các sản phẩm quan trọng sẽ bị cảnh báo.
- **Chống teo tóp kỹ năng (Quy tắc luân phiên tác giả)**: Mỗi nhân sự BẮT BUỘC phải tự viết ít nhất 1 sản phẩm bàn giao quan trọng mỗi quý mà không có sự hỗ trợ của Agent.
- **Lộ trình đào tạo nhân sự trẻ**: Các tính năng trong môi trường thử nghiệm (sandbox) phải được nhân sự trẻ tự viết từ đầu đến cuối không dùng Agent trong 6-12 tháng đầu tiên.

### 4. Quản trị và soát xét hàng quý

Tỷ lệ này sẽ được soát xét và điều chỉnh hàng quý dựa trên các chỉ số sức khỏe hệ thống (tỷ lệ lỗi, tốc độ bàn giao, sự hài lòng của nhân viên).

## Hệ quả

### Tích cực

- Duy trì tỷ lệ 30/70 bền vững — vai trò con người có nội hàm, không chỉ là gác cổng.
- Bảo tồn được lộ trình thăng tiến và đào tạo người mới.
- Tỷ lệ linh hoạt phù hợp với rủi ro của từng vai trò.

### Hạn chế / Chi phí

- Đòi hỏi sự cam kết từ ban lãnh đạo và bộ phận nhân sự.
- Việc đào tạo nhân sự trẻ (không dùng Agent) sẽ làm giảm sản lượng tạm thời.
- Các buổi họp hiệu chuẩn hàng quý tiêu tốn thời gian của nhân sự cấp cao.

## Liên kết liên quan

- **ADR-0006** — Quy tắc A-luôn-là-người (lý do cấu trúc khiến con người không thể bị loại bỏ).
- **ADR-0007** — Xác nhận của con người (cơ chế theo dõi sự tham gia thực tế).
- **ADR-0008** — Ma trận phê duyệt phân tầng (nơi công việc soát xét của con người diễn ra).

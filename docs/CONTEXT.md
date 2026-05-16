# Ngữ cảnh Nghiệp vụ — VDBAS TT.OUT.MANUAL

Ngôn ngữ chung (ubiquitous language) cho dự án. Mọi Agent và người tham gia phải sử dụng đúng các thuật ngữ trong tài liệu này. Khi có thay đổi hoặc bổ sung, phải cập nhật ở đây trước khi điều chỉnh mã nguồn hoặc Agent.

## Thuật ngữ Quản trị

| Thuật ngữ                         | Định nghĩa                                                                            |
| :-------------------------------- | :------------------------------------------------------------------------------------ |
| **RACI**                          | Responsible/Accountable/Consulted/Informed — Ma trận phân công vai trò và trách nhiệm |
| **Cổng kiểm soát chất lượng**     | Các tiêu chí chất lượng phải vượt qua trước khi trộn (merge) mã nguồn                 |
| **Vòng đời Tính năng**            | Quản lý vòng đời tính năng từ ý tưởng đến khi triển khai thực tế                      |
| **Khả năng truy xuất sản phẩm**   | Khả năng theo dõi sản phẩm bàn giao từ giai đoạn trước đến giai đoạn sau              |
| **ADR**                           | Architectural Decision Record — Hồ sơ ghi nhận các quyết định về kiến trúc            |
| **Mức độ Ràng buộc**              | BẮT BUỘC/CẦN TUÂN THỦ/CÓ THỂ — Các cấp độ thực thi quy tắc chất lượng                 |
| **Ngoại lệ (Waiver)**             | Cho phép tạm thời bỏ qua quy tắc BẮT BUỘC, có thời hạn cụ thể                         |
| **Báo cáo cấp trên (Escalation)** | Mẫu chuẩn khi AI Agent cần sự can thiệp của con người                                 |

## Thuật ngữ Cơ sở dữ liệu

| Thuật ngữ                                   | Định nghĩa                                                                    |
| :------------------------------------------ | :---------------------------------------------------------------------------- |
| **Thay đổi cấu trúc (Migration)**           | Thay đổi cấu trúc DB thông qua các kịch bản có đánh số phiên bản (V1, V2...)  |
| **Kiểm toán chuỗi Hash**                    | Chuỗi kiểm toán không thể sửa xóa: hash trước + dữ liệu + thời gian → SHA-256 |
| **Khóa lạc quan**                           | Kiểm soát cập nhật đồng thời thông qua cột phiên bản + header If-Match        |
| **Mô hình Outbox**                          | Ghi dữ liệu vào DB và đẩy tin nhắn vào hàng đợi trong cùng một giao dịch      |
| **Mã định danh duy nhất (Idempotency Key)** | Mã đảm bảo một yêu cầu không bị xử lý lặp lại hai lần                         |

## Thuật ngữ Bảo mật

| Thuật ngữ                       | Định nghĩa                                                                                             |
| :------------------------------ | :----------------------------------------------------------------------------------------------------- |
| **STRIDE**                      | Mô hình phân loại rủi ro: Giả mạo/Sửa đổi/Chối bỏ/Tiết lộ thông tin/Từ chối dịch vụ/Nâng cấp đặc quyền |
| **OWASP Top 10**                | Danh sách 10 rủi ro bảo mật web phổ biến nhất                                                          |
| **Phân tách trách nhiệm (SoD)** | Separation of Duties — Người lập ≠ Người kiểm soát ≠ Người phê duyệt                                   |
| **Mô hình hóa mối đe dọa**      | Phân tích các mối đe dọa tiềm tàng đối với hệ thống                                                    |
| **Bảo mật hai tầng**            | Kho lưu trữ mã nguồn công khai kết hợp với tài liệu mật được khóa riêng                                |

## Thuật ngữ Giao diện (UI/UX)

| Thuật ngữ               | Định nghĩa                                                       |
| :---------------------- | :--------------------------------------------------------------- |
| **Hệ thống thiết kế**   | Bộ thành phần và hướng dẫn nhất quán cho giao diện người dùng    |
| **WCAG 2.1 AA**         | Tiêu chuẩn về khả năng tiếp cận — mức tối thiểu bắt buộc         |
| **shadcn/ui**           | Thư viện thành phần React + Tailwind (được cố định bởi ADR-0014) |
| **Thư viện thành phần** | Bộ các thành phần có thể tái sử dụng cho giao diện               |

## Hệ thống liên quan

| Mã              | Tên đầy đủ                                  | Vai trò                                           |
| :-------------- | :------------------------------------------ | :------------------------------------------------ |
| **VDBAS**       | Vietnam Development Bank Application System | Hệ thống ứng dụng KBNN (đang xây dựng)            |
| **KBNN**        | Kho bạc Nhà nước                            | Cơ quan nhà nước quản lý ngân sách nhà nước       |
| **NHNN**        | Ngân hàng Nhà nước Việt Nam                 | Ngân hàng trung ương                              |
| **NHTM**        | Ngân hàng thương mại                        | Ngân hàng thương mại nhận thanh toán              |
| **CITAD**       | Hệ thống thanh toán liên ngân hàng          | Cổng thanh toán qua Ngân hàng Nhà nước            |
| **TABMIS / GL** | Sổ cái kế toán KBNN                         | Nguồn dữ liệu gốc về kế toán, KHÔNG ĐƯỢC TỰ Ý SỬA |
| **QLT**         | Quản lý thu                                 | Phân hệ quản lý thu Ngân sách Nhà nước            |
| **QLChi**       | Quản lý chi                                 | Phân hệ quản lý chi Ngân sách Nhà nước, hợp đồng  |
| **ECM**         | Quản lý nội dung doanh nghiệp               | Hệ thống lưu trữ chứng từ điện tử                 |

## Khái niệm nghiệp vụ chính

| Mã                | Tên đầy đủ                       | Định nghĩa ngắn gọn                                      |
| :---------------- | :------------------------------- | :------------------------------------------------------- |
| **LTT**           | Lệnh thanh toán                  | Chứng từ điện tử yêu cầu chuyển tiền                     |
| **TT.OUT.MANUAL** | Lệnh thanh toán đi NHNN thủ công | Phân hệ hiện tại — Người lập nhập tay (không tự động)    |
| **YCTT**          | Yêu cầu thanh toán               | Số định danh duy nhất cho một Lệnh thanh toán            |
| **NSNN**          | Ngân sách Nhà nước               | Nguồn vốn ngân sách nhà nước                             |
| **DVQHNS**        | Đơn vị có quan hệ ngân sách      | Đơn vị có mã định danh trong hệ thống NSNN               |
| **ĐVSDNS**        | Đơn vị sử dụng ngân sách         | Đơn vị được giao dự toán chi ngân sách                   |
| **NDKT**          | Nội dung kinh tế                 | Mã phân loại khoản chi (ví dụ: lương, công tác phí)      |
| **COA**           | Hệ thống mục lục ngân sách       | Hệ thống mã tài khoản kế toán nhà nước                   |
| **TPCP**          | Trái phiếu chính phủ             | Loại lệnh thanh toán đặc thù                             |
| **CKS**           | Chữ ký số                        | Ký bằng chứng thư số cá nhân hợp lệ                      |
| **SoD**           | Phân tách trách nhiệm            | Đảm bảo một người không đảm nhận nhiều vai trò chéo nhau |

## Vai trò người dùng

| Vai trò                        | Mô tả                   | Quyền hạn chính                              |
| :----------------------------- | :---------------------- | :------------------------------------------- |
| **Người lập (Maker)**          | Cán bộ ĐVSDNS / KBNN    | Tạo / Sửa / Xóa / Gửi LTT do mình lập        |
| **Người kiểm soát (Checker)**  | Cán bộ KBNN duyệt cấp 1 | Phê duyệt / Từ chối sau khi Người lập gửi    |
| **Người phê duyệt (Approver)** | Cán bộ KBNN duyệt cấp 2 | Phê duyệt cuối / Ký số / Gửi / Hủy           |
| **Quản trị viên (Admin)**      | Quản trị viên đơn vị    | Tra cứu thông tin, không tham gia tác nghiệp |

**Ràng buộc SoD**: Đối với một LTT, `người_lập ≠ người_kiểm_soát ≠ người_phê_duyệt`.

## Kênh thanh toán

| Kênh    | Tên                    | Đối tượng | Định dạng số YCTT        | Hàng đợi (MQ)              |
| :------ | :--------------------- | :-------- | :----------------------- | :------------------------- |
| **LNH** | Liên ngân hàng (CITAD) | NHNN      | `ddMMyyyy + 6 chữ số`    | `LNH.SEND.Q` / `LNH.ACK.Q` |
| **SP**  | Thanh toán song phương | NHTM      | `<mã_NH>YYYYMMDD<số_tt>` | `SP.SEND.Q` / `SP.ACK.Q`   |
| **LKB** | Liên kho bạc           | KBNN khác | `<mã_KB>YYYY<số_tt>`     | `LKB.SEND.Q` / `LKB.ACK.Q` |

**Phạm vi MVP** (đề xuất): **Chỉ thực hiện kênh LNH** — chờ xác nhận tại Cổng Giai đoạn 1.

## Các trạng thái Lệnh thanh toán

Tham chiếu chi tiết tại: [STATES.md](STATES.md) (sinh tại Giai đoạn 1). Tóm tắt luồng:

```
DRAFT (Nháp) → SUBMITTED (Đã gửi) → IN_CONTROL (Đang kiểm soát) → APPROVED (Đã duyệt) → SIGNED (Đã ký) → SENT (Đã gửi NH) → CONFIRMED (Đã xác nhận) → POSTED (Đã hạch toán)
                    ↓                        ↓
            RETURNED_TO_MAKER        RETURNED_TO_CHECKER
            (Trả lại người lập)      (Trả lại người kiểm soát)
                                             ↓
                                      CANCELLED (Đã hủy) / SEND_FAILED (Gửi lỗi) / POST_FAILED (Hạch toán lỗi) / REVERSED (Đã đảo) / BLOCKED (Bị chặn)
```

## Các điểm tích hợp

| Hệ thống tích hợp    | Vai trò                     | Có trong MVP không? |
| :------------------- | :-------------------------- | :------------------ |
| **NHNN/CITAD (LNH)** | Gửi LTT đi                  | ✓ Có                |
| **NHTM (SP)**        | Gửi LTT đi                  | ✗ Giai đoạn 2       |
| **LKB**              | Gửi LTT đi                  | ✗ Giai đoạn 2       |
| **GL (Sổ cái)**      | Hạch toán sau khi CONFIRMED | ✓ Có                |
| **QLT**              | Cập nhật phân hệ thu        | ✗ Giai đoạn 2       |
| **QLChi**            | Giảm dư nợ hợp đồng         | ✗ Giai đoạn 2       |
| **ECM**              | Lưu trữ chứng từ điện tử    | ✗ Giai đoạn 2       |

## Quy ước trình bày

- **PascalCase** cho các thực thể Java (`PaymentOrder`, `LineItem`)
- **snake_case** cho các bảng Oracle (`payment_order`, `line_item`)
- **kebab-case** cho các điểm cuối REST (`/api/payment-orders`)
- **SCREAMING_SNAKE** cho các trạng thái (`DRAFT`, `IN_CONTROL`)
- **camelCase** cho các trường dữ liệu JSON
- Sử dụng Tiếng Việt **cho toàn bộ** tài liệu, giao diện và chú thích nghiệp vụ. Mã nguồn (code), nhật ký hệ thống (log) và kiểm toán (audit) sử dụng Tiếng Anh theo chuẩn kỹ thuật.

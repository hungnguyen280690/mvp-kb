# Từ điển Nghiệp vụ (Domain Glossary)

> Tài liệu này chứa các thuật ngữ nghiệp vụ dùng trong hệ thống MVP Kho Bạc. Mọi Agent BẮT BUỘC tham chiếu file này trước khi đặt tên biến, API field, hay DB column (Rule 1.4).

## Thuật ngữ Chung

| Thuật ngữ | Viết tắt | Tiếng Anh | Định nghĩa |
|-----------|----------|-----------|------------|
| Lệnh Thanh Toán | LTT | Payment Order | Giao dịch thanh toán qua Kênh Liên ngân hàng hoặc Thanh toán song phương. |
| Kênh Liên Ngân Hàng | LNH | Inter-bank Channel | Kênh thanh toán qua hệ thống Liên ngân hàng (NHNN). |
| Thanh toán Song phương | TTSP | Bilateral Payment | Kênh thanh toán trực tiếp giữa 2 NH/KB có thiết lập cặp. |
| Đơn vị Quan hệ Ngân sách | DVQHNS | Budget Relationship Unit | Đơn vị quan hệ ngân sách 7 ký tự, thành phần của mã COA. |
| Chart of Accounts | COA | Chart of Accounts | Mã tài khoản kế toán tổng hợp, gồm 12 segment. |
| Cross-Validation ID | CCID | Cross-Validation ID | Quy tắc kiểm tra kết hợp chéo các segment của COA. |
| Tài khoản Tự nhiên | — | Natural Account | GL_Segment2, tài khoản kế toán cấp 4 ký tự. |
| Số Yêu cầu Thanh Toán | YCTT | Payment Request Number | Số tham chiếu duy nhất cho mỗi LTT (REF_NO). |
| Hạn mức | — | Limit | Giới hạn số tiền theo user/đơn vị/sản phẩm. Vượt hạn mức → yêu cầu phê duyệt cấp cao hơn. |

## Vai trò (Roles)

| Thuật ngữ | Mã | Định nghĩa |
|-----------|-----|------------|
| Người lập | Maker | Người tạo/sửa LTT. Chỉ Maker gốc được sửa/xoá LTT ở trạng thái Draft/Returned_To_Maker. |
| Người kiểm soát | Checker | Người soát xét LTT, chuyển lên Approver hoặc trả lại/từ chối. Phải khác Maker (SoD). |
| Người phê duyệt | Approver | Người duyệt cuối cùng. Phải khác Maker và Checker (SoD). |
| Separation of Duties | SoD | Bắt buộc Maker ≠ Checker ≠ Approver. |

## Trạng thái Giao dịch (F-STATUS)

| Trạng thái | Mã | Mô tả |
|-----------|-----|------------|
| Bản nháp | Draft | LTT mới tạo hoặc đang soạn, chưa gửi kiểm soát. |
| Chờ kiểm soát | Ready_For_Approval | Maker đã Submit, chờ Checker soát xét. |
| Chờ phê duyệt | Pending_Approver | Checker đã duyệt, chờ Approver quyết định. |
| Đã phê duyệt | Approved | Approver đã phê duyệt, chờ hạch toán. |
| Đã chuyển GL | Transferred_to_GL | Đã đẩy dữ liệu hạch toán sang Sổ cái. |
| Đã ghi sổ | Posted | Hoàn tất vòng đời nghiệp vụ. |
| Trả lại | Returned_To_Maker | Checker/Approver trả lại cho Maker sửa. |
| Từ chối | Rejected | Checker/Approver từ chối, giao dịch bị khoá. |
| Đã xoá | Deleted | Soft-delete, vẫn truy được qua audit. |

## Danh mục (Master Data References)

| Danh mục | Mô tả |
|----------|--------|
| Kênh | Liên ngân hàng, Thanh toán song phương. |
| Loại lệnh (LNH) | Lệnh thông thường, Lệnh trái phiếu chính phủ, Lệnh có thông tin thu NSNN. |
| Loại lệnh (TTSP) | Lệnh chuyển khoản, Lệnh chi TM cho KBNN, Lệnh chi TM cho KH, TT bằng ngoại tệ khác. |
| Loại giao dịch (LNH) | Lệnh chuyển Có GT thấp/Nợ GT thấp/Có GT cao/Nợ GT cao. Ngưỡng: ≥ 500 triệu = GT cao. |
| Loại tiền | VND (mặc định) + danh mục tiền tệ ngoại tệ. |
| GL_Segment (1-12) | Mã quỹ, TK tự nhiên, DVQHNS, Cấp NS, Chương, Ngành KT, NDKT, ĐB, CTMT, MN, Kho bạc, DP. |

## Kỹ thuật (Technical Terms)

| Thuật ngữ | Mô tả |
|-----------|--------|
| Optimistic Lock | Cơ chế chống xung đột dùng F-VER. Khi save, kiểm tra F-VER client = F-VER DB. |
| F-VER | Phiên bản bản ghi (version number), tăng +1 mỗi lần sửa. |
| Soft-delete | Đánh dấu F-STATUS=Deleted, không xoá vật lý. Bản ghi vẫn truy được qua audit. |
| Audit Hash Chain | PrevHash + Payload → CurrentHash. Đảm bảo tính toàn vẹn chuỗi audit. |
| Idempotency Key | X-Request-ID chống lặp lệnh trên API giao dịch. |
| Outbox Pattern | Ghi event vào outbox table cùng transaction với dữ liệu chính, đảm bảo eventual consistency. |

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-18** | **System** | Khởi tạo glossary từ đặc tả FT-001 (BA spec).

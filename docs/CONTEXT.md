# Từ điển Nền tảng (Foundation Context)

> **LƯU Ý QUAN TRỌNG ĐỐI VỚI AI AGENT:** 
> Tài liệu này CHỈ chứa các thuật ngữ nền tảng về quản trị, bảo mật và kỹ thuật dùng chung cho MỌI dự án.
> Các thuật ngữ nghiệp vụ đặc thù (Business Domain Glossary) của dự án cụ thể **KHÔNG ĐƯỢC GHI Ở ĐÂY**. Chúng sẽ do BA Agent tự động phân tích từ tài liệu Yêu cầu (Requirement) và sinh ra tại thư mục `docs/domain/glossary.md`.

## Thuật ngữ Quản trị (Governance)

| Thuật ngữ                         | Định nghĩa                                                                            |
| :-------------------------------- | :------------------------------------------------------------------------------------ |
| **RACI**                          | Responsible/Accountable/Consulted/Informed — Ma trận phân công vai trò và trách nhiệm |
| **Cổng kiểm soát (Quality Gate)** | Các tiêu chí chất lượng phải vượt qua trước khi trộn (merge) mã nguồn hoặc chuyển phase |
| **ADR**                           | Architectural Decision Record — Hồ sơ ghi nhận các quyết định về kiến trúc            |
| **Báo cáo cấp trên (Escalation)** | Mẫu chuẩn khi AI Agent gặp bế tắc và cần sự can thiệp của con người                   |

## Thuật ngữ Cơ sở dữ liệu (Database)

| Thuật ngữ                                   | Định nghĩa                                                                    |
| :------------------------------------------ | :---------------------------------------------------------------------------- |
| **Thay đổi cấu trúc (Migration)**           | Thay đổi cấu trúc DB thông qua các kịch bản có đánh số phiên bản (V1, V2...)  |
| **Kiểm toán chuỗi Hash**                    | Chuỗi kiểm toán không thể sửa xóa: hash trước + dữ liệu + thời gian → SHA-256 |
| **Khóa lạc quan (Optimistic Locking)**      | Kiểm soát cập nhật đồng thời thông qua cột phiên bản + header If-Match        |
| **Mô hình Outbox**                          | Ghi dữ liệu vào DB và đẩy tin nhắn vào hàng đợi trong cùng một giao dịch      |
| **Mã định danh duy nhất (Idempotency Key)** | Mã đảm bảo một yêu cầu không bị xử lý lặp lại hai lần                         |

## Thuật ngữ Bảo mật (Security)

| Thuật ngữ                       | Định nghĩa                                                                                             |
| :------------------------------ | :----------------------------------------------------------------------------------------------------- |
| **STRIDE**                      | Mô hình phân loại rủi ro: Giả mạo/Sửa đổi/Chối bỏ/Tiết lộ thông tin/Từ chối dịch vụ/Nâng cấp đặc quyền |
| **OWASP Top 10**                | Danh sách 10 rủi ro bảo mật web phổ biến nhất                                                          |
| **Phân tách trách nhiệm (SoD)** | Separation of Duties — Người lập ≠ Người kiểm soát ≠ Người phê duyệt                                   |
| **Mô hình hóa mối đe dọa**      | Phân tích các mối đe dọa tiềm tàng đối với hệ thống (Threat Modeling)                                  |

## Thuật ngữ Giao diện (UI/UX)

| Thuật ngữ               | Định nghĩa                                                       |
| :---------------------- | :--------------------------------------------------------------- |
| **WCAG 2.1 AA**         | Tiêu chuẩn về khả năng tiếp cận — mức tối thiểu bắt buộc         |
| **shadcn/ui**           | Thư viện thành phần React + Tailwind                             |

## Quy ước trình bày (Code Convention)

- **PascalCase** cho các thực thể hướng đối tượng (VD: `PaymentOrder`)
- **snake_case** cho các bảng cơ sở dữ liệu (VD: `payment_order`)
- **kebab-case** cho các điểm cuối REST API (VD: `/api/payment-orders`)
- **SCREAMING_SNAKE** cho các trạng thái (VD: `DRAFT`, `IN_CONTROL`)
- **camelCase** cho các trường dữ liệu JSON (VD: `amountValue`)
- Sử dụng **Tiếng Việt** cho toàn bộ tài liệu đặc tả, giao diện và chú thích nghiệp vụ. Mã nguồn (code), nhật ký hệ thống (log) và kiểm toán (audit) sử dụng **Tiếng Anh** theo chuẩn kỹ thuật.

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-17** | **System** | Tẩy rửa các thuật ngữ nghiệp vụ đặc thù, chuyển thành Foundation Context.
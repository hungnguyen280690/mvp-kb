# Sổ cái Kiến trúc (Project Structure Ledger)

Tài liệu này định nghĩa "Bộ gen" (Architectural DNA) của dự án **MVP Kho Bạc**, dựa trên các phương pháp luận kiến trúc tiên tiến để đảm bảo tính độc lập, khả năng mở rộng và tái lập.

## 1. Phương pháp luận Backend: Hexagonal Architecture (Kiến trúc Lục giác)
Mục tiêu: Cô lập logic nghiệp vụ khỏi các phụ thuộc bên ngoài (Framework, DB, Messaging).

### Module Nghiệp vụ Chính: `ltt-core`
- **Domain**: Chứa logic lõi của Lệnh Thanh Toán.
- **Application**: Chứa Use Cases và Ports.
- **Infrastructure**: Adapters cho Web và Persistence (Oracle 19c).

### Module Tích hợp Hệ thống (Messaging): `integration-gateway`
- **Mục tiêu**: Đóng gói toàn bộ logic kết nối với **IBM MQ** (Kênh Liên ngân hàng/NHNN).
- **Architecture**: Sử dụng Hexagonal Adapters.
    - `infrastructure/adapter/out/mq`: Chứa JMS/IBM MQ Client implementation.
    - `application/port/out`: Interface gửi tin nhắn (e.g., `MessageSenderPort`).
- **Tech Stack**: Spring Boot Starter JMS, IBM MQ Resource Adapter.

## 2. Phương pháp luận Frontend: Modular Monorepo & Micro-frontend
Mục tiêu: Phân tách quyền sở hữu và khả năng deploy độc lập.

### Cấu trúc Monorepo: `frontend`
- **apps/shell**: Host App điều phối chung.
- **apps/ltt-ui**: Remote App cho nghiệp vụ Lệnh Thanh Toán.
- **packages/ui-shared**: Design System (shadcn/ui, Tailwind).
- **packages/core-utils**: Shared logic (API, Validators).

## 3. Quy chuẩn Công nghệ (Tech Stack)
- **Backend:** Java 21, Spring Boot 3.3.4, Maven Multi-module.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Database:** Oracle 19c.
- **Messaging:** **IBM MQ** (Phục vụ truyền tin LNH/NHNN).
- **Communication:** RESTful (OpenAPI 3.0 Contract-first).

---
*Tài liệu này là nguồn sự thật duy nhất về cấu trúc. Mọi Agent phải tuân thủ nghiêm ngặt để đảm bảo tính tái lập.*

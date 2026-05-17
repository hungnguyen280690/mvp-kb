# Kiến trúc Hệ thống (Software Architecture) & Dịch vụ (Service Catalog)

Tài liệu này là bản thiết kế kỹ thuật cốt lõi (System Design) và Danh mục Dịch vụ "Sống" (Living Catalog) cho dự án **MVP Kho Bạc**. Không bao gồm các quy trình quản lý hay phân quyền.

## 1. Kiến trúc Tổng thể (Tech Stack)

### Backend: Microservices & Hexagonal Architecture
Hệ thống Backend được phân mảnh thành các Microservices, thiết kế theo kiến trúc Hexagonal (Ports and Adapters) nhằm cô lập hoàn toàn logic nghiệp vụ khỏi các phụ thuộc bên ngoài.
- **Ngôn ngữ & Framework**: Java 21 + Spring Boot 3.3.
- **Database Engine**: Oracle 19c. (Cơ chế: Soft delete, Optimistic locking, Separation of Duties).
- **Patterns Sử dụng**: Contract-first, Outbox Pattern, Saga Orchestration, Audit Hash Chain, Idempotency.

### Frontend: Modular Monorepo (Micro-frontend)
Giao diện dạng Micro-frontend nhằm phân tách quyền sở hữu và khả năng deploy độc lập.
- **Framework**: React 18 + Vite + TypeScript.
- **Styling**: Tailwind CSS + shadcn/ui.
- **Patterns Sử dụng**: Maker-Checker-Approver UI flow, Optimistic Locking.


## 2. Danh mục Dịch vụ Toàn cục (Global Service Catalog)

> **LƯU Ý DÀNH CHO SA AGENT**:
> Danh sách dưới đây là TÀI SẢN TOÀN CỤC. Khi bạn thiết kế một Tính năng mới (Feature) và quyết định tạo ra một Microservice mới, bạn **BẮT BUỘC** phải cập nhật tên service đó vào danh sách này (trên nhánh Feature Branch của bạn) để các Agent khác nắm được ngữ cảnh hệ thống hiện tại.

### Core Backend (Thư mục `backend/`)
- **`ltt-service`**: Xử lý logic nghiệp vụ chính (Lệnh Thanh Toán), quản lý State Machine và Saga.
- **`integration-gateway`**: Module kết nối và chuyển đổi giao thức với IBM MQ (Kênh Liên Ngân Hàng/NHNN).
- **`audit-service` / `gl-pusher`**: Module chuyên trách ghi nhật ký thay đổi, tính toán Hash Chain Audit và đẩy dữ liệu hạch toán sang Sổ cái (GL).
- **`bff-service`**: Backend-for-Frontend, cung cấp REST API điều phối, tổng hợp dữ liệu dành riêng cho UI.

### Frontend Apps (Thư mục `frontend/apps/`)
- **`shell`**: Host ứng dụng, quản lý Layout, Navigation, và Global Auth.
- **`ltt-ui`**: Remote App (Micro-frontend) chứa luồng nghiệp vụ của Lệnh Thanh Toán.

## 3. Quy chuẩn Kỹ thuật (Technical Constraints)
- **Reproducibility**: Hệ thống phải có khả năng tái tạo lại Skeleton chỉ dựa trên tài liệu và script tự động.
- **Audit Hash Chain**: Mọi giao dịch quan trọng phải được liên kết bằng thuật toán băm (Hash Chain) ở cấp độ Database để chống chỉnh sửa dữ liệu trái phép.
- **Contract-first API**: Giao tiếp giữa các module (FE-BE hoặc BE-BE) bắt buộc phải tuân thủ hợp đồng OpenAPI/AsyncAPI.

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-17** | **System** | Cập nhật cấu trúc thư mục từ Dev-BE/Dev-FE thành Fullstack Dev.
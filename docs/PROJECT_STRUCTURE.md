# Sổ cái Kiến trúc (Project Structure Ledger)

Tài liệu này định nghĩa "Bộ gen" (Architectural DNA) của dự án **MVP Kho Bạc**, dựa trên các phương pháp luận kiến trúc tiên tiến để đảm bảo tính độc lập, khả năng mở rộng và tái lập.

## 1. Phương pháp luận Backend: Microservices & Hexagonal Architecture
Mục tiêu: Cô lập logic nghiệp vụ khỏi các phụ thuộc bên ngoài (Framework, DB, Messaging).

### Danh mục Microservices (`backend/`)
- **`ltt-service`**: Module nghiệp vụ lõi về Lệnh Thanh Toán.
- **`integration-gateway`**: Module đóng gói logic kết nối IBM MQ (Kênh LNH/NHNN).
- **`audit-service`**: Module chuyên trách ghi nhật ký thay đổi và Hash Chain Audit.
- **`bff-service`**: Backend-for-Frontend, làm cổng điều phối và tổng hợp dữ liệu cho UI.

### Cấu trúc nội tại (Hexagonal Design)
Mọi service nghiệp vụ phải tuân thủ:
- **`domain/`**: Lõi nghiệp vụ (Domain Models, Business Rules) - Thuần Java.
- **`application/`**: Luồng sử dụng (Use Cases & Ports).
- **`infrastructure/`**: Hạ tầng & Adapters (Web Controllers, Persistence Adapters, MQ Adapters).

## 2. Phương pháp luận Frontend: Modular Monorepo (Micro-frontend)
Mục tiêu: Phân tách quyền sở hữu và khả năng deploy độc lập.

### Cấu trúc Workspaces (`frontend/`)
- **`apps/shell`**: Host App điều phối Layout, Auth, và Shared Routing.
- **`apps/ltt-ui`**: Remote App (Micro-frontend) cho nghiệp vụ Lệnh Thanh Toán.
- **`packages/ui-shared`**: Design System (shadcn/ui, Tailwind Config).
- **`packages/core-utils`**: Shared logic (API Client, Validators, Hooks).

## 3. Quản lý Tài liệu & Artifacts (Stage-Gate Process)

### Thư mục Nghiệp vụ Chung (`docs/domain/`)
Chứa các định nghĩa xuyên suốt toàn bộ dự án:
- `glossary.md`: Từ điển thuật ngữ nghiệp vụ (Ubiquitous Language).
- `states.yaml`: Ma trận chuyển trạng thái giao dịch toàn cục.
- `rules.yaml`: Các quy tắc nghiệp vụ (BIZ) và kiểm soát (VAL) dùng chung.

### Thư mục Tính năng (`features/{{feature-id}}/`)
Tổ chức theo cấu trúc bàn giao đánh số để đảm bảo tính truy vết:
- `00-idea.md`: Ý tưởng ban đầu (PO).
- `01-po-requirement.md`: Đặc tả yêu cầu chi tiết (BA).
- `02-design.md`: Thiết kế kiến trúc & API (SA).
- `03-schema.sql`: Thiết kế Database chi tiết (DBA).
- `04-test-plan.md`: Kế hoạch kiểm thử (QA).
- `06-threat-model.md`: Mô hình hóa mối đe dọa (Security).
- `07-ui-spec.md`: Đặc tả giao diện & Component (UI/UX).
- `08-test-data.md`: Dữ liệu kiểm thử & Factory (QA/DBA).

### Thư mục Cổng Kiểm soát (`gates/`)
Lưu trữ các file ký duyệt (Sign-off) cho từng giai đoạn (G1, G2, G3, G3', G4, G5).

## 4. Quy chuẩn "Tử huyệt" (Core Constraints)
- **Contract-first**: Tuyệt đối không viết code trước khi có OpenAPI được duyệt.
- **Reproducibility**: Hệ thống phải có khả năng tái tạo lại Skeleton dựa trên tài liệu này.
- **Output Completeness**: Không chấp nhận "TBD", "TODO". Mọi yêu cầu phải định lượng được.
- **Audit Hash Chain**: Mọi giao dịch quan trọng phải được liên kết bằng Hash Chain.

---
*Tài liệu này là nguồn sự thật duy nhất về cấu trúc. Mọi Agent phải tuân thủ nghiêm ngặt.*

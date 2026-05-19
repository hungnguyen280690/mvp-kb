# Quy ước Đặt tên và Cấu trúc (Naming Rules & Project Structure)

Tài liệu này định nghĩa cấu trúc mã nguồn, quy tắc phân lớp và quy ước đặt tên (Naming Conventions) bắt buộc phải tuân thủ cho toàn bộ dự án **MVP Kho Bạc**.

## 1. Cấu trúc Dự án (Project Structure)

```text
/
├── backend/            # Mã nguồn Java (Microservices)
├── frontend/           # Mã nguồn React (Monorepo)
├── contracts/          # Hợp đồng API (OpenAPI/AsyncAPI yaml)
├── features/           # Nơi lưu trữ artifact đặc tả tính năng
├── gates/              # Cổng kiểm duyệt (Chứa file Plan/Sign-off)
├── workspaces/         # MÔI TRƯỜNG ĐỘC LẬP CHO CÁC AGENT (Không chứa code logic)
├── docs/               # Kho tri thức và kiến trúc dùng chung
├── scripts/            # Scripts tự động hóa
├── CLAUDE.md           # Master Instruction
└── README.md
```

## 2. Quy tắc Đặt tên Backend

### Tên Service (Microservices)

- **Dịch vụ Nghiệp vụ:** Dùng hậu tố `-service` (VD: `ltt-service`, `account-service`).
- **Dịch vụ Kỹ thuật/Hạ tầng:** Dùng hậu tố `-gateway` hoặc `-pusher` (VD: `integration-gateway`, `gl-pusher`).

### Cấu trúc nội tại Service (Hexagonal Design)

Bên trong thư mục `src/main/java/com/kb/{domain}/`, mọi service nghiệp vụ phải chia thành 3 lớp tuyệt đối:

- **`domain/`**: Lõi nghiệp vụ (Domain Models, Business Rules, Value Objects). Lớp này THUẦN JAVA, cấm import framework (`spring`, `javax.persistence`...).
- **`application/`**: Luồng sử dụng (Use Cases & Ports - Interface).
- **`infrastructure/`**: Hạ tầng & Adapters (Web Controllers, JPA Entities, Repositories, MQ Adapters).

## 3. Quy tắc Đặt tên Frontend

### Quy tắc đặt tên App/Package

- **Ứng dụng (App):** `{domain}-ui` (VD: `ltt-ui`).
- **Thư viện (Package):** `{type}-shared` hoặc `{type}-utils` (VD: `ui-shared`, `core-utils`).

### Cấu trúc nội tại (`frontend/`)

- `apps/shell`: Host App điều phối Layout.
- `apps/ltt-ui`: Micro-frontend Lệnh Thanh Toán.
- `packages/ui-shared`: Design System (shadcn/ui).
- `packages/core-utils`: Shared logic, API Client, Validators.

## 4. Quản lý Artifacts và Tính năng (`features/`)

Tổ chức thư mục tính năng theo cấu trúc bàn giao đánh số, phục vụ tính truy vết (Traceability).
**Ví dụ:** `features/LTT-001-create-order/` hoặc `features/FT-001-CRUD-LTT/`

Bên trong mỗi tính năng gồm các mốc tài liệu:

- `01_spec.md`: Đặc tả tính năng (BA).
- `02-design.md`: Thiết kế kiến trúc & API (SA).
- `03-schema.sql`: Thiết kế Database chi tiết (DBA).
- `04-test-plan.md`: Kế hoạch kiểm thử (QA).
- `06-threat-model.md`: Mô hình hóa mối đe dọa (Security).
- `07-ui-spec.md`: Đặc tả giao diện & Component (UI/UX).
- `08-test-data.md`: Dữ liệu kiểm thử & Factory (QA/DBA).

_Mọi tài liệu đầu ra từ con người hay AI đều bắt buộc tuân theo quy chuẩn này._

---

## Lịch sử Sửa đổi (Audit Log)

- **2026-05-17** | **System** | Khởi tạo quy ước đặt tên và cấu trúc tính năng.

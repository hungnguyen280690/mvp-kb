# MVP Kho Bạc - Hệ thống Lệnh Thanh Toán (LTT)

Dự án MVP cho hệ thống KBNN với luồng làm việc 3 Agent siêu tối giản, ưu tiên tính đúng đắn và chống bias.

## 🚀 Luồng làm việc (4-Phase Workflow)

1. **Đầu vào gốc**: Product Owner (PO) cung cấp file `docs/requirement.md` định nghĩa yêu cầu High-level.
2. **Giai đoạn song song (Phase 0 & 1)**:
    - **Phase 0 (SA/Tech Lead)**: Đọc yêu cầu High-level để khởi tạo **Base Project** (Skeleton) tại `backend/` và `frontend/`. Chốt Tech Stack và cấu hình nền tảng.
    - **Phase 1 (BA)**: Đọc yêu cầu High-level để rã thành các đặc tả chi tiết `.md` trong thư mục `features/`. BA Agent soát xét và ký duyệt `G1`.
3. **Giai đoạn 2 (SA - Detailed Design)**: SA Agent đọc đặc tả chi tiết + Base Project để gen Database Schema vật lý và OpenAPI tại `contracts/`. Phải có Plan được duyệt trước khi gen. Ký duyệt `G2`.
4. **Giai đoạn 3 (Dev - Implementation)**: Dev Agent đọc OpenAPI + Đặc tả để gen Code tính năng vào Base Project. Áp dụng **TDD**: Viết Test trước trong Plan -> Duyệt Test -> Gen Code. Ký duyệt `G3`.

## 🛠️ Quy tắc Tử huyệt

- **Plan-First**: Luôn sinh Plan trong thư mục `gates/` trước khi hành động.
- **No CI/CD Bias**: Chạy test local pass 100% trước khi ký Gate.
- **Traceability**: Mọi code và test đều phải map với ID nghiệp vụ.

## 📂 Cấu trúc Thư mục

- `features/`: Nơi chứa đặc tả nghiệp vụ (.md).
- `backend/`: Mã nguồn Java (Root).
- `frontend/`: Mã nguồn React (Root).
- `contracts/`: File OpenAPI (Root).
- `docs/`: Tài liệu quy trình và luật lệ cốt lõi.
- `gates/`: Nơi lưu trữ các Kế hoạch (Plan) và file Ký duyệt (Sign-off).
- `workspaces/`: Không gian ảo cho Agent (ba, sa, dev).
- `scripts/`: Các tiện ích hỗ trợ.

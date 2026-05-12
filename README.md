# MVP Kho Bạc - Hệ thống Lệnh Thanh Toán (LTT)

Dự án MVP cho hệ thống KBNN với luồng làm việc 3 Agent siêu tối giản, ưu tiên tính đúng đắn và chống bias.

## 🚀 Luồng làm việc (3-Step Workflow)

1. **Giai đoạn 1 (BA)**: BA con người đẩy file đặc tả `.md` vào thư mục `features/`. BA Agent soát xét và ký duyệt `G1`.
2. **Giai đoạn 2 (SA)**: SA Agent đọc đặc tả + DB Schema (`docs/ARCHITECTURE.md`) để gen OpenAPI. Phải có Plan được duyệt trước khi gen. Ký duyệt `G2`.
3. **Giai đoạn 3 (Dev)**: Dev Agent đọc OpenAPI + Đặc tả để gen Code (Fullstack). Áp dụng **TDD**: Viết Test trước trong Plan -> Duyệt Test -> Gen Code. Ký duyệt `G3`.

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

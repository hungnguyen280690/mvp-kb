# MVP Kho Bạc — VDBAS Lệnh Thanh Toán

Dự án MVP cho hệ thống KBNN. Dự án này sử dụng luồng làm việc **3-Agent Siêu Tối Giản** với mã nguồn tập trung ở thư mục gốc và ngữ cảnh Agent được cách ly qua các Virtual Workspaces.

## 🚀 Nguyên tắc Cốt lõi (Tử huyệt)

1. **Plan-First (Kế hoạch trước)**: Agent KHÔNG ĐƯỢC sinh mã nguồn hay API contract nếu chưa tạo file Plan trong `gates/` và được con người gõ chữ "Duyệt".
2. **TDD Bias Prevention (Chống thiên vị)**: Dev Agent phải viết Test Case (kèm logic nghiệp vụ) vào file Plan. Con người duyệt Test trước, Agent mới được viết logic code sau.
3. **Database Respect**: Kiến trúc và Schema Database đã được chốt cứng tại `docs/ARCHITECTURE.md`. Không tự ý dùng lệnh `ALTER/CREATE`.
4. **Mã nguồn tập trung**: Backend (`backend/`), Frontend (`frontend/`), và API (`contracts/`) nằm ở thư mục gốc.

## 📂 Cấu trúc Dự án

```text
/home/hungnv256/mvp-kho-bac/
├── backend/           <-- Mã nguồn Java Spring Boot
├── frontend/          <-- Mã nguồn React
├── contracts/         <-- File OpenAPI yaml
├── features/          <-- Nơi con người đẩy file đặc tả nghiệp vụ (.md)
├── gates/             <-- Nơi chứa file Plan và Sign-off của các Agent
├── workspaces/        <-- KHÔNG GIAN ẢO (Chỉ chứa cấu hình để Agent nhập vai)
│   ├── ba/
│   ├── sa/
│   └── dev/
└── docs/              <-- Tài liệu cốt lõi
    ├── CONTEXT.md     (Từ điển nghiệp vụ)
    ├── ARCHITECTURE.md(Tech stack & Database Schema)
    ├── CONVENTIONS.md (Quy ước naming, folder)
    ├── RULES.md       (Luật chất lượng, bảo mật dùng chung)
    └── WORKFLOW.md    (Mô tả chi tiết luồng 3 bước)
```

## 🎭 3 Vai trò (Agents)

Dự án chỉ có 3 Agent. Để nhập vai, hãy `cd` vào thư mục tương ứng trong `workspaces/` và chạy CLI. CLI sẽ tự động nạp cấu hình giới hạn đường dẫn để Agent thao tác đúng vào các thư mục gốc.

### 1. BA Agent (`workspaces/ba/`)

- **Nhiệm vụ**: Thẩm định (Validate) file đặc tả `.md` của con người trong `features/`.
- **Hành động**: Báo lỗi hoặc ký duyệt Gate 1 (`G1`). Tuyệt đối không tự sửa file MD.

### 2. SA Agent (`workspaces/sa/`)

- **Nhiệm vụ**: Đọc đặc tả + DB Schema -> Lên Kế hoạch -> Sinh `OpenAPI.yaml` tại `contracts/`.
- **Hành động**: Sinh Kế hoạch (`gates/SA-Plan.md`) -> Chờ duyệt -> Gen OpenAPI -> Ký duyệt `G2`.

### 3. Dev Agent (`workspaces/dev/`)

- **Nhiệm vụ**: Lập trình Fullstack (Java + React) + TDD dựa trên OpenAPI.
- **Hành động**: Sinh Kế hoạch TDD (`gates/Dev-Plan.md`) chứa mã nguồn test -> Chờ duyệt -> Gen Code BE/FE vào root -> Chạy test local -> Ký duyệt `G3`.

---

_Lưu ý cho Agent: Dù bạn được gọi từ thư mục `workspaces/_/`, hãy luôn nhớ đường dẫn tương đối `../../` để trỏ về đúng thư mục mã nguồn/tài liệu ở root.\*

# MARBO Workflow - Tài liệu Hướng dẫn Người mới (Onboarding)

Chào mừng bạn gia nhập dự án **MVP Kho Bạc**. Dự án này áp dụng mô hình **Multi-Agent Role-Based Orchestration (MARBO)**, một quy trình phát triển dựa trên sự phối hợp chặt chẽ giữa Con người và các AI Agent chuyên biệt.

Tài liệu này sẽ giúp bạn nắm bắt nhanh cách vận hành để không bị "ngợp" trước các quy định khắt khe của hệ thống.

---

## 🛠 1. Chuẩn bị Môi trường (Setup)

Dự án sử dụng bộ công cụ hiện đại để đảm bảo tính nhất quán:

- **mise**: Quản lý phiên bản runtime (Java, Node, Maven...). Chạy `mise install`.
- **pnpm**: Quản lý package Frontend. Chạy `pnpm install` tại thư mục `frontend/`.
- **Maven**: Quản lý Backend. Sử dụng `./mvnw`.
- **Docker**: Chạy hạ tầng (Oracle 19c, Artemis). Chạy `make infra`.

---

## 🧬 2. Luồng làm việc 4 Giai đoạn (Stage-Gate)

Mọi tính năng (Feature) đều phải đi qua 4 "Cổng kiểm soát" (Gate). Không được phép nhảy cóc.

1.  **Giai đoạn 1 — BA (Nghiệp vụ)**: Chuyển hóa yêu cầu thô thành BDD Scenarios, xác định Scope và **Impact Analysis**.
2.  **Giai đoạn 2 — SA (Thiết kế)**: Thiết kế API Contract (OpenAPI), Schema DB và giải pháp kỹ thuật.
3.  **Giai đoạn 3 — Dev (Lập trình)**: Thực thi mã nguồn (Java/React) theo đúng Contract. Đảm bảo pass Unit Test & Lint.
4.  **Giai đoạn 4 — QA (Kiểm thử)**: Viết kịch bản Automation Test (**Playwright**) và verify toàn hệ thống.

---

## 🤖 3. Cách làm việc với các AI Agent

Trong dự án này, bạn không làm việc một mình. Các Agent (`workspaces/`) sẽ hỗ trợ bạn:

- **Plan-First**: Trước khi làm bất cứ việc gì (viết code hay viết tài liệu), Agent **BẮT BUỘC** phải lập file Plan trong thư mục `gates/` (VD: `FT-001-Dev-Plan.md`).
- **Human-in-the-loop**: Agent sẽ dừng lại và hỏi bạn: _"Bạn đã duyệt Plan này chưa?"_. Bạn cần rà soát kỹ các mục Checklist và trả lời _"OK"_ hoặc _"Duyệt"_ qua chat.
- **Marker**: Chỉ khi bạn xác nhận, Agent mới ghi dòng `[X] Verified by Human` vào file và bắt đầu thực hiện.

---

## ⚠️ 4. Các "Luật huyệt" cần nhớ

- **Đóng băng (Frozen)**: Một khi đã ký duyệt Gate (VD: xong G1), các file ở Giai đoạn đó sẽ bị đóng băng. **Tuyệt đối không tự ý sửa**. Nếu sai, phải dùng quy trình Escalation để xin "Unfreeze".
- **Impact Analysis**: Mọi thay đổi phải được phân tích tác động vào file `04-impact-analysis.md`. Đây là file "sống" được BA, SA, Dev và QA cùng cập nhật.
- **Traceability**: Mọi dòng code, API hay Test Case phải có chú thích ID nghiệp vụ tương ứng (VD: `// BIZ-LTT-001`).
- **Dữ liệu Test**: QA là "chủ xị" của file `08-test-data.md`. Dev có thể đề xuất nhưng QA mới là người quyết định cuối cùng.

---

## 🚀 5. Các lệnh quan trọng (Cheatsheet)

| Lệnh                               | Ý nghĩa                                                   |
| :--------------------------------- | :-------------------------------------------------------- |
| `make infra`                       | Chạy Oracle & Message Broker                              |
| `make dev`                         | Chạy cả BE và FE ở chế độ Development                     |
| `scripts/gate-verify.sh FT-xxx Gx` | Công cụ kiểm tra tự động xem Agent đã làm đủ bài tập chưa |
| `scripts/smoke-test.sh`            | Build + Test nhanh toàn bộ dự án                          |
| `scripts/smoke-api.sh`             | Kiểm tra API đang sống hay chết                           |
| `scripts/smoke-ui.sh`              | Kiểm tra UI có bị lỗi màn hình trắng không                |
| `pnpm run test:e2e`                | Chạy bộ test Playwright của QA                            |

---

## 📂 6. Cấu trúc Feature (Thư mục `features/FT-XXX/`)

- `01_spec_*.md`: Đặc tả nghiệp vụ (BA).
- `01b-bdd-scenarios.md`: Kịch bản test nghiệp vụ (BA).
- `02-design.md`: Thiết kế kỹ thuật (SA).
- `03-schema.sql`: Cấu trúc Database (SA).
- `04-impact-analysis.md`: Báo cáo tác động (Chung).
- `08-test-data.md`: Dữ liệu mẫu (QA).

**Hãy đọc kỹ `docs/WORKFLOW.md` và `docs/RULES.md` để biết thêm chi tiết!**

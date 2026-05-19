# KBNN - Hệ thống Lệnh Thanh Toán (LTT) MVP

Dự án MVP cho hệ thống Quản lý Lệnh Thanh Toán của Kho Bạc Nhà Nước (KBNN), áp dụng mô hình vận hành **MARBO (Multi-Agent Role-Based Orchestration)**.

## 🌟 Tổng quan

MARBO là phương pháp luận phát triển phần mềm dựa trên sự phối hợp giữa con người và 6 AI Agent chuyên trách (BA, SA, Dev, QA, Security, UI). Quy trình này đảm bảo tính minh bạch, khả năng truy vết tuyệt đối và chất lượng code cao nhất thông qua mô hình **Stage-Gate**.

👉 **[Bắt đầu tại đây: Tài liệu Onboarding](./onboard.md)**

---

## 🛠 Công nghệ (Tech Stack)

| Thành phần   | Công nghệ                                                |
| :----------- | :------------------------------------------------------- |
| **Backend**  | Java 17, Spring Boot 3, Oracle 19c, Artemis (JMS)        |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui (Micro-frontend) |
| **Contract** | OpenAPI 3.0.3 (Design-First)                             |
| **QA**       | Playwright (E2E), Vitest (Unit), RestAssured (API)       |
| **Infra**    | Docker, Docker Compose, mise                             |

---

## 🧬 Quy trình Stage-Gate

1.  **Giai đoạn 1 (BA)**: Đặc tả nghiệp vụ & BDD. [Gate G1 Sign-off]
2.  **Giai đoạn 2 (SA)**: Thiết kế API & Database. [Gate G2 Sign-off]
3.  **Giai đoạn 3 (Dev)**: Lập trình TDD & Fullstack. [Gate G3 Sign-off]
4.  **Giai đoạn 4 (QA)**: Kiểm thử tự động & Regression. [Gate G4 Sign-off]

_Hệ thống hỗ trợ luồng **Fast-Track (Hotfix)** cho các thay đổi nhỏ không ảnh hưởng logic nghiệp vụ._

---

## 📂 Cấu trúc dự án

- `/backend`: Mã nguồn Java Monolith (Hexagonal Architecture).
- `/frontend`: Workspace React (Micro-frontends).
- `/features`: Tài liệu đặc tả và thiết kế cho từng tính năng.
- `/gates`: Kế hoạch (Plan) và Biên bản ký duyệt (Sign-off).
- `/docs`: Thư viện tài liệu (Architecture, Rules, Workflow).
- `/workspaces`: Chỉ dẫn (CLAUDE.md) cho từng AI Agent.

---

## 🚀 Lệnh nhanh (Quick Start)

```bash
# 1. Cài đặt runtime
mise install

# 2. Chạy hạ tầng (Oracle, JMS)
make infra

# 3. Chạy môi trường phát triển
make dev

# 4. Kiểm tra cổng (Gate Verification)
bash scripts/gate-verify.sh FT-001 G1
```

---

## 📄 Tài liệu quan trọng

- `CLAUDE.md`: Hướng dẫn tổng cho AI Agents.
- `onboard.md`: Hướng dẫn cho người mới.
- `docs/WORKFLOW.md`: Quy trình làm việc chi tiết.
- `docs/RULES.md`: Các quy tắc chất lượng bắt buộc.
- `docs/ARCHITECTURE.md`: Kiến trúc hệ thống.

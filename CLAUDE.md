# MVP Kho Bạc — VDBAS TT.OUT.MANUAL

Dự án MVP cho phân hệ **Lệnh thanh toán đi NHNN thủ công** của hệ thống VDBAS (Kho bạc Nhà nước).
Mục tiêu: Giả lập đầy đủ quy trình **BA → SA → Dev → Test → DevOps** với AI đóng vai trò thực thi chính, con người đóng vai trò kiểm soát tại các cổng chất lượng.

## Nguồn dữ liệu gốc

- **Tài liệu SRS gốc**: `/home/hung/home-task-manager/VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx`
- **Từ điển nghiệp vụ**: [docs/CONTEXT.md](docs/CONTEXT.md)
- **Mô hình trạng thái**: [docs/STATES.md](docs/STATES.md) _(Sinh tại Giai đoạn 1)_
- **Quy tắc nghiệp vụ**: [docs/RULES.md](docs/RULES.md) _(Sinh tại Giai đoạn 1)_
- **Hợp đồng API**: [docs/CONTRACTS.md](docs/CONTRACTS.md) _(Sinh tại Giai đoạn 2)_

## Cách thức làm việc

- **Thành viên mới**: Đọc ngay tài liệu **[Hướng dẫn nhập cuộc (docs/ONBOARDING.md)](docs/ONBOARDING.md)**.
- **Quy trình 5 Giai đoạn**: Xem [docs/WORKFLOW.md](docs/WORKFLOW.md)
- **Người gác cổng (Gatekeepers)**: Xem [docs/GATEKEEPERS.md](docs/GATEKEEPERS.md)
- **Quy ước lập trình**: Xem [docs/CONVENTIONS.md](docs/CONVENTIONS.md) _(Sinh tại Giai đoạn 3)_

## Công nghệ sử dụng

| Tầng          | Công nghệ                         |
| :------------ | :-------------------------------- |
| Hạ tầng       | OpenShift on-prem (OCP 4.x)       |
| Backend       | Java 21 + Spring Boot 3.3 + Maven |
| Frontend      | React 18 + Vite + TypeScript      |
| Cơ sở dữ liệu | Oracle 19c                        |
| Tin nhắn      | IBM MQ (Kênh LNH/SP/LKB)          |
| GitOps        | Tekton + ArgoCD + Helm            |
| Quan sát      | OpenTelemetry + Grafana + Loki    |

## Nguyên tắc cốt lõi

1. **Ưu tiên hợp đồng (Contract-first)**: Mã nguồn sinh ra từ OpenAPI/AsyncAPI, không làm ngược lại.
2. **Mô hình Outbox**: Ghi dữ liệu vào DB và đẩy tin nhắn vào hàng đợi trong cùng một giao dịch Oracle.
3. **Điều phối Saga**: Sử dụng cơ chế điều phối (orchestration) thay vì biên đạo (choreography) cho một LTT.
4. **Kiểm toán chuỗi Hash**: Chống sửa lùi dữ liệu.
5. **Mã định danh duy nhất (Idempotency)**: Áp dụng cho mọi yêu cầu REST POST và tin nhắn MQ.
6. **Khóa lạc quan**: Áp dụng cho mọi cập nhật LTT (sử dụng header `If-Match`).
7. **Maker-Checker-Approver**: Mô hình 3 lớp, ràng buộc tại DB: `người_lập ≠ người_kiểm_soát ≠ người_phê_duyệt`.
8. **Giữ chỗ nguồn vốn (Reserve fund)**: Khi Gửi lệnh, giải phóng khi Từ chối/Hủy.
9. **Xóa mềm (Soft delete)**: Chỉ đánh dấu xóa cho LTT, không xóa vật lý trong DB.

## Quy tắc cho AI Agent

- **Phải đọc** `docs/CONTEXT.md` trước khi sinh mã nguồn có liên quan đến nghiệp vụ.
- **Tham chiếu** đến các tài liệu cụ thể thay vì nhồi nhét nội dung vào câu lệnh (prompt).
- **Cập nhật** tài liệu trong thư mục `docs/` khi nghiệp vụ thay đổi, không sửa cứng trong prompt của Agent.
- **Không tự quyết định** 4 thứ: Quy tắc nghiệp vụ, Hợp đồng API, Chính sách bảo mật, Phát hành chính thức.
- **Mọi PR** phải bao gồm: Kiểm thử đạt (xanh), Khớp OpenAPI, Nhật ký kiểm toán, Kiểm tra mã định danh duy nhất.
- **Chống lặp (Anti-loop)**: Tối đa 3 lần lặp cho mỗi sản phẩm bàn giao (ADR-0013).
- **Tính đầy đủ**: Không dùng các cụm từ thoái thác, dùng `<<THIẾU-THÔNG-TIN>>` khi cần (ADR-0017).
- **Ghi công (Attribution)**: Mọi sản phẩm do AI sinh ra phải có thông tin `generated_by` (ADR-0007).
- **Báo cáo cấp trên (Escalation)**: Khi gặp bế tắc → dùng mẫu tại `docs/escalations/`.
- **Bảo mật hai tầng**: KHÔNG đưa dữ liệu cá nhân (PII) hoặc nội dung hạn chế vào kho lưu trữ công khai (ADR-0004).
- **Quản lý chi phí (FinOps)**: Tuân thủ ngân sách cho từng tính năng (ADR-0012).

## 9 Vai trò & Ma trận RACI

| Vai trò     | Giai đoạn | Không gian làm việc    | Sản phẩm chịu trách nhiệm chính (R) |
| :---------- | :-------- | :--------------------- | :---------------------------------- |
| **BA**      | 1         | `workspaces/ba/`       | R: 01-requirements                  |
| **SA**      | 2         | `workspaces/sa/`       | R/A: 02-design, 03-api-contract     |
| **DBA**     | 2         | `workspaces/dba/`      | R: 04-db-schema                     |
| **Bảo mật** | 2         | `workspaces/security/` | R/A: 06-threat-model                |
| **UI/UX**   | 2-3       | `workspaces/ui/`       | R/A: 07-ui-spec                     |
| **Dev-BE**  | 3         | `workspaces/dev-be/`   | R: 05-implementation (BE)           |
| **Dev-FE**  | 3         | `workspaces/dev-fe/`   | R: 05-implementation (FE)           |
| **QA**      | 4         | `workspaces/qa/`       | R: 08-test-data                     |
| **DevOps**  | 5         | `workspaces/devops/`   | R/A: 05-runbook                     |

Chi tiết ma trận RACI: [docs/WORKFLOW.md § Ma trận RACI](docs/WORKFLOW.md)

## Cấu trúc dự án — Không gian làm việc đa vai trò + Khả năng truy xuất

```
mvp-kho-bac/                       ← Gốc kho lưu trữ
├── CLAUDE.md                      ← Tài liệu bạn đang đọc
├── docs/                          ← Tài liệu dùng chung (mọi vai trò)
│   ├── adr/                       ← 18 Quyết định Kiến trúc (ADR)
│   ├── quality-rules/             ← Quy tắc chất lượng R0010–R0246
│   ├── escalations/               ← 7 Mẫu báo cáo cấp trên
│   ├── templates/                 ← Mẫu bàn giao, prompt, nhật ký phiên
│   ├── FINOPS.md                  ← Quản lý chi phí Agent AI
│   ├── lessons-learned.md         ← Nhật ký các bài học kinh nghiệm
│   └── roles/                     ← Hướng dẫn riêng cho 9 vai trò
├── shared/specs/                  ← SRS xlsx (Chỉ đọc)
├── features/                      ← Thư mục sản phẩm theo Từng Tính Năng
│   └── {{FEATURE}}/               ← Toàn bộ sản phẩm bàn giao + quyết định
├── .claude/
│   ├── settings.json              ← Cấu hình quyền truy cập dùng chung
│   ├── plugins.lock               ← Cố định phiên bản plugin Claude
│   └── agents/                    ← Các Agent dùng chung (soát xét CI, điều phối)
├── workspaces/                    ← THƯ MỤC RIÊNG CỦA TỪNG VAI TRÒ (9 vai)
│   ├── ba/        (Gđ 1)          → Đầu ra: domain/ + features/
│   ├── sa/        (Gđ 2)          → Đầu ra: contracts/ + features/
│   ├── dba/       (Gđ 2)          → Đầu ra: db/migrations/ + features/
│   ├── security/  (Gđ 2)          → Đầu ra: security/ + features/
│   ├── ui/        (Gđ 2-3)        → Đầu ra: ui/ + features/
│   ├── dev-be/    (Gđ 3)          → Đầu ra: services/
│   ├── dev-fe/    (Gđ 3')         → Đầu ra: frontend/
│   ├── qa/        (Gđ 4)          → Đầu ra: tests/ + features/
│   └── devops/    (Gđ 5)          → Đầu ra: deploy/, observability/
├── scripts/
│   ├── setup.sh                   ← Thiết lập môi trường
│   ├── init-feature.sh            ← Tạo thư mục tính năng mới
│   ├── install-claude-plugins.sh  ← Cài đặt plugin theo khóa
│   └── verify-env.sh              ← Kiểm tra môi trường tiêu chuẩn
├── gates/                         ← Ký duyệt tại các cổng chất lượng
└── .github/                       ← CI/CD
```

## Luồng công việc giữa các vai trò

```
BA (workspaces/ba/)  →  đẩy  →  GitHub  →  kéo  →  SA + DBA + Bảo mật + UI
                      (Giai đoạn 1)               (Giai đoạn 2, song song)
                                                            │
                                                            v đẩy
                                                        GitHub
                                                            │
                                            ┌───── kéo ─────┴────────┐
                                            v                        v
                              Dev BE (workspaces/dev-be/)   Dev FE (workspaces/dev-fe/)
                                            │                        │
                                            └────── đẩy ──────────┐  đẩy
                                                                  v
                                                              GitHub
                                                                  │
                                                              QA + DevOps
```

Mỗi vai trò mở Claude Code tại thư mục làm việc tương ứng:

```bash
cd workspaces/ba   # hoặc sa, dba, security, ui, dev-be, dev-fe, qa, devops
claude code .
```

Claude Code tự động tải **2 tầng cấu hình**: gốc `.claude/` (dùng chung) + thư mục làm việc `.claude/` (theo vai trò).
Kết quả của AI được viết vào `features/{{FEATURE}}/` để đảm bảo khả năng truy xuất.

# Architecture Blueprint: Multi-Agent Role-Based Orchestration (MARBO)

Tài liệu này mô tả kiến trúc và cấu trúc thư mục của project **MVP Kho Bạc**, được thiết kế để tối ưu hóa việc cộng tác giữa nhiều Agent AI chuyên biệt (BA, SA, Dev, QA, DevOps).

## 1. Triết lý Thiết kế (Core Philosophy)

- **Role-Based Isolation**: Mỗi Agent AI làm việc trong một `workspace/` riêng biệt, có `CLAUDE.md` riêng để định hướng nhiệm vụ.
- **Stage-Gate Process**: Quy trình 5 giai đoạn (BA → Design → Dev → Test → DevOps) với các cổng chất lượng (Quality Gates) cần con người ký duyệt.
- **Document-as-Source-of-Truth**: Tài liệu Markdown (ADRs, CONTEXT.md) là nguồn tri thức duy nhất, thay thế cho việc trao đổi miệng hoặc ghi nhớ trong session.
- **Traceability**: Sản phẩm bàn giao của từng giai đoạn cho mỗi tính năng được lưu trữ tập trung tại `features/{{FEATURE_NAME}}/`.

## 2. Cấu trúc Thư mục (Folder Structure)

```text
/
├── CLAUDE.md                      # Chỉ dẫn tổng thể cho Orchestrator/User
├── docs/                          # Kho tri thức dùng chung
│   ├── adr/                       # Architectural Decision Records (18+ bản)
│   ├── roles/                     # Hướng dẫn chi tiết cho từng vai trò Agent
│   ├── quality-rules/             # Quy tắc kiểm soát chất lượng (R001...)
│   ├── escalations/               # Mẫu báo cáo khi AI bế tắc
│   ├── CONTEXT.md                 # Ngôn ngữ chung và thuật ngữ nghiệp vụ
│   ├── WORKFLOW.md                # Chi tiết 5 giai đoạn và ma trận RACI
│   └── ONBOARDING.md              # Hướng dẫn cho người/Agent mới
├── workspaces/                    # Khu vực làm việc biệt lập của các Agent
│   ├── ba/                        # Phân tích nghiệp vụ (Stage 1)
│   ├── sa/                        # Kiến trúc & Hợp đồng API (Stage 2)
│   ├── dba/                       # Thiết kế Database (Stage 2)
│   ├── dev-be/                    # Phát triển Backend Java (Stage 3)
│   ├── dev-fe/                    # Phát triển Frontend React (Stage 3')
│   ├── qa/                        # Kiểm thử đa tầng (Stage 4)
│   └── devops/                    # Triển khai & Vận hành (Stage 5)
├── features/                      # Lưu trữ artifacts theo từng tính năng
│   └── {{feature-id}}/            # Ví dụ: LTT-001-create-order/
│       ├── 01-requirements.md
│       ├── 02-design.md
│       ├── 03-api-contract.yaml
│       └── ...
├── gates/                         # Lưu trữ các bản ký duyệt (Sign-off)
├── shared/                        # Dữ liệu đầu vào thô (SRS, Specs)
├── scripts/                       # Scripts tự động hóa (init, verify, setup)
└── .claude/                       # Cấu hình Agent, Plugins, Orchestrator
```

## 3. Kiến trúc Kỹ thuật (Tech Stack)

### Backend (workspaces/dev-be)

- **Framework**: Java 21 + Spring Boot 3.3.
- **Microservices**:
  - `ltt-core`: Xử lý logic nghiệp vụ chính, State Machine, Saga.
  - `integration-gateway`: Kết nối IBM MQ (kênh LNH).
  - `gl-pusher`: Đẩy dữ liệu hạch toán sang Sổ cái (GL).
  - `bff-service`: Backend for Frontend, cung cấp REST API cho UI.
- **Patterns**: Contract-first, Outbox Pattern, Saga Orchestration, Audit Hash Chain, Idempotency.

### Frontend (workspaces/dev-fe)

- **Framework**: React 18 + Vite + TypeScript.
- **Styling**: Tailwind CSS + shadcn/ui.
- **API Client**: Sinh tự động từ OpenAPI contract (codegen).
- **Patterns**: Maker-Checker-Approver UI flow, Optimistic Locking (`If-Match`), Client-side Idempotency Key.

### Database (workspaces/dba)

- **Engine**: Oracle 19c.
- **Migration**: Flyway hoặc Liquibase.
- **Principles**: Soft delete, Optimistic locking (version column), Separation of Duties (SoD) constraints tại DB.

### Infrastructure & DevOps (workspaces/devops)

- **Platform**: OpenShift (OCP 4.x).
- **CI/CD**: Tekton Pipelines + ArgoCD.
- **Monitoring**: OpenTelemetry + Grafana + Loki.
- **Packaging**: Helm Charts.

## 4. Luồng Công việc (Workflow)

1.  **Stage 1 (BA)**: Đọc SRS từ `shared/`, sinh `domain/` và `.feature` (Gherkin).
2.  **Stage 2 (Design)**:
    - SA sinh OpenAPI/AsyncAPI.
    - DBA sinh DDL/Migrations.
    - Security sinh Threat Model.
3.  **Stage 3 (Dev)**:
    - Dev-BE sinh mã nguồn Java dựa trên API Contract và DDL.
    - Dev-FE sinh giao diện React.
4.  **Stage 4 (Test)**: QA chạy Unit, Integration, E2E, Performance, Security test.
5.  **Stage 5 (DevOps)**: Triển khai lên môi trường OCP qua GitOps.

## 5. Hướng dẫn Tái khởi tạo Project (For AI Agents)

Để tạo một project tương tự, hãy thực hiện các bước:

1.  **Thiết lập Folder Structure**: Tạo toàn bộ cấu trúc thư mục như mục 2.
2.  **Khởi tạo Docs**:
    - Sao chép các ADR mẫu (đặc biệt là ADR-0001 đến ADR-0018).
    - Tạo `CONTEXT.md` với các thuật ngữ nghiệp vụ cốt lõi.
    - Tạo `WORKFLOW.md` định nghĩa RACI và 5 giai đoạn.
3.  **Khởi tạo Workspaces**:
    - Trong mỗi thư mục `workspaces/`, tạo file `CLAUDE.md` định nghĩa: Vai trò, Output bắt buộc, Quy tắc (Rules), và Công cụ (Plugins).
4.  **Thiết lập root CLAUDE.md**: File này đóng vai trò "Master Instruction" điều phối toàn bộ project.
5.  **Tự động hóa**: Cung cấp các scripts trong `scripts/` để khởi tạo thư mục tính năng (`init-feature.sh`) và kiểm tra tính tuân thủ của môi trường.

---

_Tài liệu được sinh bởi SA Agent - 2026-05-15_

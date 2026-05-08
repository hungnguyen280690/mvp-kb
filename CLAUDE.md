# MVP Kho Bạc — VDBAS TT.OUT.MANUAL

Vibe-code MVP cho module **Lệnh thanh toán đi NHNN thủ công** của hệ thống VDBAS (Kho bạc Nhà nước).
Mục tiêu: giả lập đầy đủ pipeline **BA → SA → Dev → Test → DevOps** với AI làm bulk, người chỉ đứng ở gate.

## Nguồn sự thật

- **SRS gốc**: `/home/hung/home-task-manager/VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx`
- **Domain glossary**: [docs/CONTEXT.md](docs/CONTEXT.md)
- **State machine**: [docs/STATES.md](docs/STATES.md) *(sinh ở Stage 1)*
- **Rules**: [docs/RULES.md](docs/RULES.md) *(sinh ở Stage 1)*
- **API contracts**: [docs/CONTRACTS.md](docs/CONTRACTS.md) *(sinh ở Stage 2)*

## Cách làm việc

- **Pipeline 5 stage**: xem [docs/WORKFLOW.md](docs/WORKFLOW.md)
- **Người gác cổng**: xem [docs/GATEKEEPERS.md](docs/GATEKEEPERS.md)
- **Coding convention**: xem [docs/CONVENTIONS.md](docs/CONVENTIONS.md) *(sinh ở Stage 3)*

## Stack

| Tầng | Công nghệ |
|---|---|
| Container | OpenShift on-prem (OCP 4.x) |
| Backend | Java 21 + Spring Boot 3.3 + Maven |
| Frontend | React 18 + Vite + TypeScript |
| DB | Oracle 19c |
| Message | IBM MQ (LNH/SP/LKB channels) |
| GitOps | Tekton + ArgoCD + Helm |
| Observability | OpenTelemetry + Grafana + Loki |

## Nguyên tắc

1. **Contract-first**: code sinh từ OpenAPI/AsyncAPI, không ngược lại
2. **Outbox pattern**: ghi DB + queue trong cùng transaction Oracle
3. **Saga orchestration** (không phải choreography) cho 1 LTT
4. **Hash chain audit** chống sửa lùi
5. **Idempotency key** mọi REST POST + MQ message
6. **Optimistic lock** mọi update LTT (`If-Match` header)
7. **Maker-Checker-Approver** 3-tier, constraint DB: maker_id ≠ checker_id ≠ approver_id
8. **Reserve fund** khi Submit, release khi Reject/Cancel
9. **Soft delete only** cho LTT, không xoá vật lý

## Quy tắc cho AI agent

- **Đọc** `docs/CONTEXT.md` trước khi sinh code có nghiệp vụ
- **Trỏ tới** docs cụ thể trong prompt thay vì nhồi nội dung
- **Cập nhật** docs/* khi domain thay đổi, không sửa hard-code trong agent prompt
- **Không tự quyết** 4 thứ: domain rules, API contracts, security policy, prod release
- **Mỗi PR** phải có: test xanh, OpenAPI khớp, audit log, idempotency check

## Cấu trúc project — Multi-role workspace

```
mvp-kho-bac/                       ← repo root
├── CLAUDE.md                      ← bạn đang đọc
├── docs/                          ← shared docs (mọi role đọc)
├── shared/specs/                  ← SRS xlsx (read-only)
├── .claude/
│   ├── settings.json              ← shared permission allowlist
│   ├── plugins.lock               ← lock version Claude plugin
│   └── agents/                    ← shared agent (ci-reviewer)
├── workspaces/                    ← THƯ MỤC RIÊNG TỪNG ROLE
│   ├── ba/        (Stage 1)       → output: domain/
│   ├── sa/        (Stage 2)       → output: contracts/, db/migrations/
│   ├── dev-be/    (Stage 3)       → output: services/
│   ├── dev-fe/    (Stage 3')      → output: frontend/
│   ├── qa/        (Stage 4)       → output: tests/
│   └── devops/    (Stage 5)       → output: deploy/, observability/
├── scripts/
│   ├── setup.sh                   ← bootstrap môi trường
│   ├── install-claude-plugins.sh  ← cài plugin theo plugins.lock
│   └── verify-env.sh              ← check môi trường khớp tiêu chuẩn
├── gates/                         ← signoff các gate
└── .github/                       ← CI/CD (sau dual-stack với .gitlab/)
```

## Workflow giữa các role

```
BA (workspaces/ba/)  →  push  →  GitHub  →  pull  →  SA (workspaces/sa/)
                                                            │
                                                            v push
                                                        GitHub
                                                            │
                                            ┌───── pull ────┴────────┐
                                            v                        v
                              Dev BE (workspaces/dev-be/)   Dev FE (workspaces/dev-fe/)
                                            │                        │
                                            └────── push ─────────┐  push
                                                                  v
                                                              GitHub
                                                                  │
                                                              QA + DevOps
```

Mỗi role mở Claude Code ở workspace của mình:
```bash
cd workspaces/ba   # hoặc sa, dev-be, dev-fe, qa, devops
claude code .
```
Claude Code tự load **2 tầng config**: root `.claude/` (shared) + workspace `.claude/` (role-specific).

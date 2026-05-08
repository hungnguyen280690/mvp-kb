# MVP Kho Bạc — VDBAS TT.OUT.MANUAL

Vibe-code MVP cho module **Lệnh thanh toán đi NHNN thủ công** của hệ thống VDBAS (Kho bạc Nhà nước).
Mục tiêu: giả lập đầy đủ pipeline **BA → SA → Dev → Test → DevOps** với AI làm bulk, người chỉ đứng ở gate.

## Nguồn sự thật

- **SRS gốc**: `/home/hung/home-task-manager/VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx`
- **Domain glossary**: [docs/CONTEXT.md](docs/CONTEXT.md)
- **State machine**: [docs/STATES.md](docs/STATES.md) _(sinh ở Stage 1)_
- **Rules**: [docs/RULES.md](docs/RULES.md) _(sinh ở Stage 1)_
- **API contracts**: [docs/CONTRACTS.md](docs/CONTRACTS.md) _(sinh ở Stage 2)_

## Cách làm việc

- **Người mới**: đọc ngay **[docs/ONBOARDING.md](docs/ONBOARDING.md)** để bắt nhịp vibe dự án.
- **Pipeline 5 stage**: xem [docs/WORKFLOW.md](docs/WORKFLOW.md)
- **Người gác cổng**: xem [docs/GATEKEEPERS.md](docs/GATEKEEPERS.md)
- **Coding convention**: xem [docs/CONVENTIONS.md](docs/CONVENTIONS.md) _(sinh ở Stage 3)_

## Stack

| Tầng          | Công nghệ                         |
| ------------- | --------------------------------- |
| Container     | OpenShift on-prem (OCP 4.x)       |
| Backend       | Java 21 + Spring Boot 3.3 + Maven |
| Frontend      | React 18 + Vite + TypeScript      |
| DB            | Oracle 19c                        |
| Message       | IBM MQ (LNH/SP/LKB channels)      |
| GitOps        | Tekton + ArgoCD + Helm            |
| Observability | OpenTelemetry + Grafana + Loki    |

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
- **Cập nhật** docs/\* khi domain thay đổi, không sửa hard-code trong agent prompt
- **Không tự quyết** 4 thứ: domain rules, API contracts, security policy, prod release
- **Mỗi PR** phải có: test xanh, OpenAPI khớp, audit log, idempotency check
- **Anti-loop**: max 3 iterations per artifact, Jaccard convergence > 0.85 (ADR-0013)
- **Output completeness**: cấm hedge phrases, dùng `<<MISSING-INFO>>` khi thiếu (ADR-0017)
- **Attribution**: mọi AI artifact phải có `generated_by` front-matter + commit trailer (ADR-0007)
- **Escalation**: khi gặp blocker → dùng template từ `docs/escalations/`, không tự giải quyết
- **Two-tier confidentiality**: KHÔNG đưa PII/restricted content vào public repo (ADR-0004)
- **FinOps**: respect per-feature budget, track trong session logs (ADR-0012)

## 9 Roles & RACI

| Role         | Stage | Workspace              | RACI (key artifacts)            |
| ------------ | ----- | ---------------------- | ------------------------------- |
| **BA**       | 1     | `workspaces/ba/`       | R: 01-requirements              |
| **SA**       | 2     | `workspaces/sa/`       | R/A: 02-design, 03-api-contract |
| **DBA**      | 2     | `workspaces/dba/`      | R: 04-db-schema                 |
| **Security** | 2     | `workspaces/security/` | R/A: 06-threat-model            |
| **UI/UX**    | 2-3   | `workspaces/ui/`       | R/A: 07-ui-spec                 |
| **Dev-BE**   | 3     | `workspaces/dev-be/`   | R: 05-implementation (BE)       |
| **Dev-FE**   | 3     | `workspaces/dev-fe/`   | R: 05-implementation (FE)       |
| **QA**       | 4     | `workspaces/qa/`       | R: 08-test-data                 |
| **DevOps**   | 5     | `workspaces/devops/`   | R/A: 05-runbook                 |

Full RACI matrix: [docs/WORKFLOW.md § RACI Matrix](docs/WORKFLOW.md)

## Cấu trúc project — Multi-role workspace + Feature traceability

```
mvp-kho-bac/                       ← repo root
├── CLAUDE.md                      ← bạn đang đọc
├── docs/                          ← shared docs (mọi role đọc)
│   ├── adr/                       ← 18 ADRs (governance decisions)
│   ├── quality-rules/             ← quality rules R0010–R0246 + lifecycle
│   ├── escalations/               ← 7 escalation templates
│   ├── templates/                 ← handoffs, prompts, session-logs
│   ├── FINOPS.md                  ← AI agent cost control
│   ├── lessons-learned.md         ← failure pattern log
│   └── roles/                     ← 9 role-specific guides
├── shared/specs/                  ← SRS xlsx (read-only)
├── features/                      ← PER-FEATURE artifact folders
│   └── {{FEATURE}}/               ← all 9 artifacts + decisions + sessions
├── .claude/
│   ├── settings.json              ← shared permission allowlist
│   ├── plugins.lock               ← lock version Claude plugin
│   └── agents/                    ← shared agents (ci-reviewer, orchestrator)
├── workspaces/                    ← THƯ MỤC RIÊNG TỪNG ROLE (9 roles)
│   ├── ba/        (Stage 1)       → output: domain/ + features/
│   ├── sa/        (Stage 2)       → output: contracts/ + features/
│   ├── dba/       (Stage 2)       → output: db/migrations/ + features/
│   ├── security/  (Stage 2)       → output: security/ + features/
│   ├── ui/        (Stage 2-3)     → output: ui/ + features/
│   ├── dev-be/    (Stage 3)       → output: services/
│   ├── dev-fe/    (Stage 3')      → output: frontend/
│   ├── qa/        (Stage 4)       → output: tests/ + features/
│   └── devops/    (Stage 5)       → output: deploy/, observability/
├── scripts/
│   ├── setup.sh                   ← bootstrap môi trường
│   ├── init-feature.sh            ← tạo feature folder mới
│   ├── install-claude-plugins.sh  ← cài plugin theo plugins.lock
│   └── verify-env.sh              ← check môi trường khớp tiêu chuẩn
├── gates/                         ← signoff các gate
└── .github/                       ← CI/CD
```

## Workflow giữa các role

```
BA (workspaces/ba/)  →  push  →  GitHub  →  pull  →  SA + DBA + Security + UI
                      (Stage 1)                         (Stage 2, song song)
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
cd workspaces/ba   # hoặc sa, dba, security, ui, dev-be, dev-fe, qa, devops
claude code .
```

Claude Code tự load **2 tầng config**: root `.claude/` (shared) + workspace `.claude/` (role-specific).
AI output viết vào `features/{{FEATURE}}/` để traceability, workspace-local dirs cho code.

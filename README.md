# MVP Kho Bạc — VDBAS TT.OUT.MANUAL

Vibe-code MVP cho module **Lệnh thanh toán đi NHNN thủ công** (KBNN). Giả lập đầy đủ pipeline **BA → SA → Dev → Test → DevOps** với AI làm bulk, người chỉ đứng ở gate.

## TL;DR

```bash
# 1. Onboard 1 lần
./scripts/setup.sh
./scripts/install-claude-plugins.sh

# 2. Mở workspace của vai trò bạn phụ trách
cd workspaces/ba          # BA / Stage 1
# hoặc:
cd workspaces/sa          # SA / Stage 2
cd workspaces/dev-be      # Backend Dev / Stage 3
cd workspaces/dev-fe      # Frontend Dev / Stage 3'
cd workspaces/qa          # QA / Stage 4
cd workspaces/devops      # SRE / Stage 5

# 3. Khởi động Claude Code (load 2 tầng config: shared + role)
claude code .
```

## Stack

| Tầng | Công nghệ |
|---|---|
| Container | OpenShift on-prem (OCP 4.x) |
| Backend | Java 21 + Spring Boot 3.3 + Maven |
| Frontend | React 18 + Vite + TypeScript |
| DB | Oracle 19c |
| Message | IBM MQ (LNH/SP/LKB) |
| GitOps | Tekton + ArgoCD + Helm |
| Observability | OpenTelemetry + Grafana + Loki |
| Source | git (GitHub primary, sau dual với GitLab) |

## Cấu trúc

```
mvp-kho-bac/
├── CLAUDE.md, README.md
├── docs/                   ← shared docs (CONTEXT, GATEKEEPERS, WORKFLOW, SAFETY, QUALITY_GATES)
├── shared/specs/           ← SRS xlsx (read-only)
├── .claude/
│   ├── settings.json       ← shared permissions
│   ├── plugins.lock        ← lock version Claude plugin
│   └── agents/             ← shared agent (ci-reviewer)
├── workspaces/             ← thư mục riêng từng role (6 cái)
│   └── <role>/
│       ├── CLAUDE.md       ← role guide
│       └── .claude/agents/ ← role-specific agent
├── scripts/                ← setup, verify, install-claude-plugins
├── gates/                  ← signoff per stage
└── .github/                ← CI/CD (sau dual với .gitlab/)
```

## 5 Stage Pipeline

```
SRS xlsx (đã có)
    │
    ▼
[Stage 1 BA] → domain/         (✋ G1: BA Lead, ~2h)
    │
    ▼
[Stage 2 SA] → contracts/, db/ (✋ G2: SA Lead, ~4h)
    │
    ▼
[Stage 3 Dev BE+FE]            (✋ G3+G3': Java + FE Lead, ~5h)
    │
    ▼
[Stage 4 Test]                 (✋ G4: QA Lead, ~30min)
    │
    ▼
[Stage 5 DevOps]               (✋ G5: SRE, ~1h)
    │
    ▼
Production
```

Tổng người gác: ~13h trên 3-4 tuần × 1 người + AI.

Chi tiết: [docs/WORKFLOW.md](docs/WORKFLOW.md)

## Người gác cổng (Gatekeepers)

| Gate | Stage | Vai trò |
|---|---|---|
| G1 | 1 — BA | BA / Nghiệp vụ KBNN |
| G2 | 2 — SA | Solution Architect |
| G3 | 3 — Dev BE | Senior Java Lead |
| G3' | 3 — Dev FE | Senior Frontend Lead |
| G4 | 4 — Test | QA Lead / Test Architect |
| G5 | 5 — DevOps | DevOps / SRE Lead |

Chi tiết: [docs/GATEKEEPERS.md](docs/GATEKEEPERS.md)

## Quy tắc bắt buộc

- ✅ **Contract-first** — code sinh từ OpenAPI/AsyncAPI
- ✅ **Outbox pattern** — DB + queue trong cùng transaction
- ✅ **Saga orchestration** — không 2PC qua MQ
- ✅ **Hash chain audit** — append-only, chống sửa lùi
- ✅ **Idempotency key** — mọi REST POST + MQ message
- ✅ **Optimistic lock** — `If-Match` header
- ✅ **Maker-Checker-Approver** — DB constraint, không bypass
- ✅ **Reserve fund** — Submit hold, Reject/Cancel release
- ✅ **Soft delete only** — không xoá vật lý

Chi tiết: [docs/SAFETY.md](docs/SAFETY.md), [docs/QUALITY_GATES.md](docs/QUALITY_GATES.md)

## Auto-merge & CI

PR tự merge khi **TẤT CẢ** đều xanh:
- 18 gate kỹ thuật (lint, test, security, OpenAPI, Helm, ...)
- Claude AI reviewer (`ci-reviewer` agent) LGTM
- ≥ 1 human approval từ CODEOWNERS

Chi tiết: [docs/QUALITY_GATES.md](docs/QUALITY_GATES.md), [.github/workflows/ci.yml](.github/workflows/ci.yml)

## Common commands

```bash
make help                    # liệt kê lệnh
make setup                   # bootstrap dev env (1 lần)
make verify                  # check môi trường
make plugin-install          # cài Claude plugin theo lock file
make dev                     # khởi động Oracle + IBM MQ + Pact + Mailhog + Jaeger
make test                    # unit + integration test
make lint                    # lint Java + TS + YAML + Dockerfile
make format                  # auto-fix format
make gate-status             # status 5 gate
make git-init                # init git local
make git-hooks               # cài pre-commit hook
make ci-local                # chạy GitHub Actions local (cần `act`)
```

## Onboarding cho thành viên mới

1. Clone: `git clone <url> mvp-kho-bac && cd mvp-kho-bac`
2. Bootstrap: `./scripts/setup.sh`
3. Plugin: `./scripts/install-claude-plugins.sh`
4. Verify: `./scripts/verify-env.sh` (must pass)
5. Đọc:
   - [`CLAUDE.md`](CLAUDE.md)
   - [`docs/CONTEXT.md`](docs/CONTEXT.md)
   - [`docs/WORKFLOW.md`](docs/WORKFLOW.md)
   - [`docs/SAFETY.md`](docs/SAFETY.md)
   - [`workspaces/<your-role>/CLAUDE.md`](workspaces/)
6. Chạy thử: `cd workspaces/<your-role> && claude code .`

## Ghi chú

- **SharePoint**: chỉ dùng để mirror artifact (xlsx, pptx, mockup) cho stakeholder. **Code + agent + CI ở git permanently**.
- **GitLab migration**: code + docs giữ nguyên, chỉ thay `.github/` → `.gitlab/` và CI workflow file. Xem [docs/branch-protection-setup.md](docs/branch-protection-setup.md).
- **Plugin Claude**: lock version trong [`.claude/plugins.lock`](.claude/plugins.lock). Update plugin = sửa lock file → team chạy `make plugin-install`.

## License

Internal — KBNN / VDBAS only.

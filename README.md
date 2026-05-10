# MVP KB — VDBAS TT.OUT.MANUAL

Vibe-code MVP cho module **Lệnh thanh toán đi NHNN thủ công** (KBNN). Giả lập đầy đủ pipeline **BA → SA → Dev → Test → DevOps** với AI làm bulk, người chỉ đứng ở gate.

## Onboarding cho thành viên mới

> [!IMPORTANT]
> Nếu bạn là người mới, hãy đọc **[Hướng dẫn Onboarding 24h (docs/ONBOARDING.md)](docs/ONBOARDING.md)** trước để hiểu tư duy và cách làm việc "vibe-code".

## TL;DR

```bash
# 0. Prerequisites (1 lần / máy mới — xem chi tiết bên dưới)
#    mise, Docker, gh CLI, SSH key, Claude Code CLI

# 1. Clone
git clone git@github.com:hungnguyen280690/mvp-kho-bac.git
cd mvp-kho-bac

# 2. Onboard
./scripts/setup.sh
./scripts/install-claude-plugins.sh
./scripts/verify-env.sh   # must pass

# 3. Mở workspace của vai trò bạn phụ trách
cd workspaces/ba          # BA / Stage 1
# hoặc:
cd workspaces/sa          # SA / Stage 2
cd workspaces/dba         # DBA / Stage 2
cd workspaces/security    # Security / Stage 2
cd workspaces/ui          # UI/UX / Stage 2-3
cd workspaces/dev-be      # Backend Dev / Stage 3
cd workspaces/dev-fe      # Frontend Dev / Stage 3'
cd workspaces/qa          # QA / Stage 4
cd workspaces/devops      # SRE / Stage 5

# 4. Khởi động Claude Code (load 2 tầng config: shared + role)
claude code .
```

## Stack

| Tầng          | Công nghệ                                 |
| ------------- | ----------------------------------------- |
| Container     | OpenShift on-prem (OCP 4.x)               |
| Backend       | Java 21 + Spring Boot 3.3 + Maven         |
| Frontend      | React 18 + Vite + TypeScript              |
| DB            | Oracle 19c                                |
| Message       | IBM MQ (LNH/SP/LKB)                       |
| GitOps        | Tekton + ArgoCD + Helm                    |
| Observability | OpenTelemetry + Grafana + Loki            |
| Source        | git (GitHub primary, sau dual với GitLab) |

## Cấu trúc

```
mvp-kho-bac/
├── CLAUDE.md, README.md
├── docs/                   ← shared docs
│   ├── CONTEXT.md          ← domain glossary (ubiquitous language)
│   ├── WORKFLOW.md         ← 5-stage pipeline + 9 roles
│   ├── SAFETY.md           ← safety policy + agent rules
│   ├── QUALITY_GATES.md    ← 21+ quality gates
│   ├── GATEKEEPERS.md      ← 9 gatekeepers
│   ├── ONBOARDING.md       ← 24h onboarding guide
│   ├── ROLE_PLAYBOOK.md    ← role guide index
│   ├── FINOPS.md           ← AI agent cost control
│   ├── lessons-learned.md  ← failure pattern log
│   ├── adr/                ← 18 architectural decision records
│   ├── quality-rules/      ← quality rules (R0010–R0246) + lifecycle
│   ├── escalations/        ← 7 escalation templates
│   ├── roles/              ← 9 role-specific guides
│   └── templates/          ← handoffs, prompts, session-logs
├── shared/specs/           ← SRS xlsx (read-only)
├── features/               ← per-feature artifact folders (traceability)
├── .claude/
│   ├── settings.json       ← shared permissions
│   ├── plugins.lock        ← lock version Claude plugin
│   └── agents/             ← shared agents (ci-reviewer, orchestrator)
├── workspaces/             ← thư mục riêng từng role (9 cái)
│   └── <role>/
│       ├── CLAUDE.md       ← role guide
│       └── .claude/agents/ ← role-specific agent
├── scripts/                ← setup, verify, init-feature
├── gates/                  ← signoff per stage
└── .github/                ← CI/CD
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

| Gate | Stage      | Vai trò                  |
| ---- | ---------- | ------------------------ |
| G1   | 1 — BA     | BA / Nghiệp vụ KBNN      |
| G2   | 2 — SA     | Solution Architect       |
| G3   | 3 — Dev BE | Senior Java Lead         |
| G3'  | 3 — Dev FE | Senior Frontend Lead     |
| G4   | 4 — Test   | QA Lead / Test Architect |
| G5   | 5 — DevOps | DevOps / SRE Lead        |

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

### Prerequisites (cài trước khi clone)

| Tool                | Cài                                                                                                              | Kiểm tra                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **mise**            | `curl https://mise.run \| sh` rồi thêm `eval "$(mise activate bash)"` vào `~/.bashrc`                            | `mise --version`        |
| **Docker**          | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) (cần cho Oracle + IBM MQ local)                | `docker --version`      |
| **gh CLI**          | Ubuntu: `sudo apt install gh -y` · Mac: `brew install gh`                                                        | `gh --version`          |
| **SSH key**         | `ssh-keygen -t ed25519 -C "you@email.com"` rồi add public key vào GitHub Settings → SSH keys                     | `ssh -T git@github.com` |
| **Claude Code CLI** | Tải tại [claude.com/claude-code](https://claude.com/claude-code) hoặc `npm install -g @anthropic-ai/claude-code` | `claude --version`      |

### Các bước onboard

```bash
# 1. GitHub auth
gh auth login              # chọn GitHub.com → HTTPS → browser login

# 2. Clone repo
git clone git@github.com:hungnguyen280690/mvp-kho-bac.git
cd mvp-kho-bac

# 3. Bootstrap môi trường (mise install + pre-commit hooks)
./scripts/setup.sh

# 4. Cài Claude Code plugin
./scripts/install-claude-plugins.sh

# 5. Verify mọi thứ OK
./scripts/verify-env.sh    # tất cả phải pass

# 6. (Optional) Khởi động infra local
make infra-up              # Oracle + IBM MQ + Pact + Jaeger
```

### Đọc bắt buộc

1. [`CLAUDE.md`](CLAUDE.md) — nguyên tắc dự án
2. [`docs/CONTEXT.md`](docs/CONTEXT.md) — domain glossary
3. [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — pipeline + incremental flow
4. [`docs/SAFETY.md`](docs/SAFETY.md) — quy tắc an toàn
5. [`workspaces/<your-role>/CLAUDE.md`](workspaces/) — guide cho role của bạn

### Chạy thử

```bash
cd workspaces/<your-role>   # ba, sa, dev-be, dev-fe, qa, devops
claude code .
```

### Khi đổi máy mới

Lặp lại đúng các bước trên. Mọi config nằm trong git — clone về là đủ. Chú ý:

- SSH key phải tạo mới + add vào GitHub
- `gh auth login` phải chạy lại
- `mise install` sẽ cài đúng version theo `.mise.toml`

## Ghi chú

- **SharePoint**: chỉ dùng để mirror artifact (xlsx, pptx, mockup) cho stakeholder. **Code + agent + CI ở git permanently**.
- **GitLab migration**: code + docs giữ nguyên, chỉ thay `.github/` → `.gitlab/` và CI workflow file. Xem [docs/branch-protection-setup.md](docs/branch-protection-setup.md).
- **Plugin Claude**: lock version trong [`.claude/plugins.lock`](.claude/plugins.lock). Update plugin = sửa lock file → team chạy `make plugin-install`.

## License

Internal — KBNN / VDBAS only.

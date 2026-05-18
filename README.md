# MVP Kho Bac - He thong Lenh Thanh Toan (LTT)

Du an MVP cho he thong KBNN quan ly Lenh Thanh Toan (LTT) voi luong lam viec **Multi-Agent Role-Based Orchestration (MARBO)** — 4 giai doan, 6 Agent chuyen biệt.

## Luong lam viec (4-Stage MARBO Workflow)

| Stage | Agent | Cong | Dau vao | Dau ra |
|-------|-------|------|---------|--------|
| 1 — BA | BA Agent | G1 | HTML mau (Figma) + CSS + Use Case | 3 spec files + BDD |
| 2 — Design | SA / Security / UI | G2 | 3 spec files | API Contract + DB Schema + Threat Model |
| 3 — Dev | Fullstack Dev | G3 | OpenAPI + Schema | Backend + Frontend code |
| 4 — Test | QA Agent | G4 | Spec + Code | E2E tests + Test data |

**Fast-Track (Audit-Only)**: Neu tinh nang da co du 3 spec + BDD, BA chi can tra sosat doi chieu HTML mau roi chuyen thang SA.

## Cau truc Feature

```text
features/FT-001/
├── 01_spec_field.md         (BA — Dac ta truong du lieu)
├── 01_spec_button.md        (BA — Dac ta nut bam & hanh dong)
├── 01_spec_function.md      (BA — Dac ta luong xu ly & quy tac)
├── 01b-bdd-scenarios.md     (BA — BDD Scenarios)
├── *.html                   (Dau vao bat buoc — HTML mau tu Figma)
├── *.css                    (Dau vao bat buoc — CSS mau)
├── 02-design.md             (SA — Thiet ke giai phap)
├── 03-schema.sql            (SA — Oracle 19c DDL)
├── 06-threat-model.md       (Security — Tuy chon)
└── 08-test-data.md          (QA — Du lieu test)
```

## Dau vao bat buoc cho moi Feature

1. **Toi thieu 1 file HTML mau** — Export tu Figma.
2. **File CSS mau** — Style cho HTML mau.
3. **File Use Case MD** — Mo ta use case nghiep vu.
4. (Tuy chon) Anh UI (`*.png`, `*.jpg`) — Visual reference cho Dev/QA.

## Quy tac tu huyet

- **Stage-Gate Process**: Khong nhay coc cong. Khong co G1 thi cam SA lam viec.
- **Plan-First**: Luong sinh Plan trong `gates/` truoc khi hanh dong.
- **Traceability**: Moi code va test phai map voi ID nghiep vu (`BIZ-xxx`, `VAL-xxx`).
- **Frozen Artifacts**: File qua cong sign-off bi dong bang. Cam tu y sua.
- **Context Sync**: Moi Agent phai cap nhat glossary khi phat hien thuat ngu moi.

## Cong nghe

| Layer | Tech |
|-------|------|
| Backend | Java 17 + Spring Boot 3 + Oracle 19c |
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui (micro-frontend) |
| API Contract | OpenAPI 3.0.3 |
| Architecture | Hexagonal (Ports & Adapters) |
| CI/CD | GitHub Actions |

## Cau truc Thu muc

```
├── backend/               # Java monolith (modules: ltt-core, bff, audit-service, ...)
├── frontend/              # React micro-frontends (apps/shell, apps/ltt-ui)
├── contracts/             # OpenAPI contract
├── docs/                  # Tai lieu quy trinh, luat le, kien truc
│   ├── ARCHITECTURE.md    # Kien truc he thong & danh muc services
│   ├── CONTEXT.md         # Tu dien nen tang
│   ├── RULES.md           # Luat chat luong & an toan
│   ├── WORKFLOW.md        # Quy trinh 4 giai doan
│   └── conventions/       # Quy tac dat ten
├── features/              # Dac ta nghiep vu theo tinh nang (FT-001, FT-002, ...)
├── gates/                 # Plan, Sign-off, Readiness check
├── scripts/               # Tien ich verify (API contract, status alignment)
└── workspaces/            # Khong gian lam viec cho tung Agent
    ├── ba/                # BA Agent (Stage 1)
    ├── sa/                # SA Agent (Stage 2)
    ├── dev/               # Fullstack Dev Agent (Stage 3)
    └── qa/                # QA Agent (Stage 4)
```

## Quick Start

```bash
# Backend
cd backend && mvn clean install

# Frontend
cd frontend && pnpm install && pnpm build

# Verify API contract alignment
./scripts/verify-api-contract.sh

# Verify status enum alignment (Java ↔ TypeScript ↔ OpenAPI)
./scripts/verify-status-alignment.sh
```

## Tai lieu chinh

- `CLAUDE.md` — Hien phap MARBO (master instruction cho AI agents)
- `docs/WORKFLOW.md` — Quy trinh 4 giai doan chi tiet
- `docs/ARCHITECTURE.md` — Kien truc he thong & service catalog
- `docs/RULES.md` — Luat chat luong & an toan
- `docs/CONTEXT.md` — Tu dien nen tang

# Workspace: SA — Solution Architect (Stage 2)

Workspace dành riêng cho **Stage 2 Solution Architecture**. Đọc output BA, sinh contracts + DDL + ADR + threat model.

## Vai trò

Đọc `workspaces/ba/domain/` (read-only) → sinh artifact kỹ thuật để Dev (Stage 3) build.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/sa
# Verify G1 đã sign:
test -f ../../gates/G1-ba-signoff.md || echo "❌ G1 chưa sign-off"

claude code .
# > sa-designer
```

## Đọc trước (bắt buộc)

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md)
- [docs/WORKFLOW.md § Stage 2](../../docs/WORKFLOW.md)
- [docs/SAFETY.md](../../docs/SAFETY.md)
- [docs/GATEKEEPERS.md § G2](../../docs/GATEKEEPERS.md)
- **Output BA**: `../ba/domain/*.yaml`, `../ba/domain/scope.yaml`

## Output bắt buộc

```
contracts/
├── openapi/
│   ├── api-internal-v1.yaml
│   ├── api-callback-v1.yaml
├── asyncapi/
│   └── events-v1.yaml
├── mq/
│   └── lnh-message.xsd
└── schemas/
    └── payment-order-v1.json    ← canonical, CRITICAL

db/migrations/
├── V1__init_ltt.sql
├── V2__outbox.sql
├── V3__audit_hash_chain.sql
└── V4__lock_table.sql

docs/
├── adr/
│   ├── 0001-outbox-pattern.md
│   ├── 0002-saga-orchestration.md
│   ├── 0003-audit-hash-chain.md
│   ├── 0004-optimistic-lock.md
│   ├── 0005-idempotency-design.md
│   └── 0006-coa-validation-strategy.md
├── c4/
│   ├── context.mmd
│   ├── container.mmd
│   └── component.mmd
└── threat-model.md             ← STRIDE, focus tampering/replay
```

## Gate G2 — Critical review

G2 reviewer (SA Lead) tập trung:
- `payment-order-v1.json` — sai cái này = sửa cả pipeline
- DDL Oracle, đặc biệt audit hash chain
- threat model — đủ chống replay/tampering chưa
- 6 ADR

Sign-off: `gates/G2-sa-signoff.md`.

## Khi nào SA vào (incremental)

Xem [WORKFLOW.md § Incremental Change Flow](../../docs/WORKFLOW.md). SA chỉ cần vào khi: `domain/*` thay đổi, thêm/sửa API contract, thêm DB migration.

## KHÔNG được làm

- Sửa `domain/` của BA (read-only)
- Sinh code service / frontend (Stage 3)
- Đổi schema sau khi sign-off (cần tạo PR sửa, re-sign)

## Agent có sẵn

- `sa-designer` *(sẽ tạo)* — sinh contracts từ domain/
- `threat-modeler` *(sẽ tạo)* — sinh threat model STRIDE

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
- **`docs/c4/*.mmd` — visually verify kiến trúc 4 service + data flow** (BẮT BUỘC, không optional)

Sign-off: `gates/G2-sa-signoff.md`.

## Khi nào SA vào (incremental)

Xem [WORKFLOW.md § Incremental Change Flow](../../docs/WORKFLOW.md). SA chỉ cần vào khi: `domain/*` thay đổi, thêm/sửa API contract, thêm DB migration.

## KHÔNG được làm

- Sửa `domain/` của BA (read-only)
- Sinh code service / frontend (Stage 3)
- Đổi schema sau khi sign-off (cần tạo PR sửa, re-sign)

## Agent & Plugin hỗ trợ

Tận dụng AI để hiện thực hoá kiến trúc:

- **Agent `sa-designer`**:
  - **Cách gọi**: `> sa-designer`
  - **Kỹ năng**: Đọc `domain/*.yaml` của BA để sinh OpenAPI, AsyncAPI, và DDL Oracle.
- **Agent `threat-modeler`**:
  - **Cách gọi**: `> threat-modeler`
  - **Kỹ năng**: Phân tích STRIDE dựa trên luồng dữ liệu của LTT.
- **Plugin `superpowers`**:
  - **Ứng dụng**: Kiểm tra tính nhất quán giữa Schema JSON và DDL SQL.

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/` và workspace-local directories

- [02-design.md]: `features/{{FEATURE_NAME}}/02-design.md`
- contracts/: `contracts/` (workspace-local, là nguồn cho Dev đọc)
- db/migrations/: `db/migrations/` (coordinate với DBA workspace)
- docs/adr/: `docs/adr/` (feature-specific ADRs)

## Nhiệm vụ trọng tâm (Day 1)

1. Kiểm tra G1 đã sign-off tại `gates/G1-ba-signoff.md`.
2. Chạy `sa-designer` để sinh bộ Contract.
3. Review kỹ `payment-order-v1.json` - đây là "trái tim" của hệ thống.

## Khi gặp vướng

- Contract conflict với BA requirements: dùng `docs/escalations/conflict.md` template
- Cần clarification từ BA: dùng `docs/escalations/ambiguity.md` template

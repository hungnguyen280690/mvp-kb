# Workspace: DBA — Database Administrator (Stage 2)

Workspace dành riêng cho **Stage 2 DBA**. Làm việc song song với SA, đọc output BA, sinh schema + migrations.

## Vai trò

Đọc `workspaces/ba/domain/` + `workspaces/sa/contracts/` (read-only) → sinh Oracle DDL migrations, schema validation, audit hash chain.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/dba
# Verify G1 đã sign:
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"

claude code .
# > dba-schema-builder
```

## Đọc trước (bắt buộc)

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md) — glossary VDBAS/KBNN
- [docs/WORKFLOW.md § Stage 2](../../docs/WORKFLOW.md) — yêu cầu output
- [docs/SAFETY.md](../../docs/SAFETY.md) — quy tắc dữ liệu nhạy cảm
- [docs/GATEKEEPERS.md § G-DBA](../../docs/GATEKEEPERS.md) — bạn là G-DBA
- **ADR reference**: [docs/adr/](../../docs/adr/) — đặc biệt ADR outbox, audit hash chain

## Input

- **BA output**: `../ba/domain/*.yaml` (read-only)
- **SA contracts**: `../sa/contracts/` (read-only)

## Output bắt buộc (sinh trong `features/{{FEATURE}}/` và `db/`)

```
features/{{FEATURE}}/
└── 04-db-schema.md              ← documentation của schema

db/migrations/
├── V1__init_ltt.sql             ← bảng chính LTT + indexes
├── V2__outbox.sql               ← outbox pattern table
├── V3__audit_hash_chain.sql     ← audit trail append-only
├── V4__lock_table.sql           ← optimistic locking
└── V5__coa_segments.sql         ← COA validation table

db/rollback/
├── R1__init_ltt.sql
├── R2__outbox.sql
├── R3__audit_hash_chain.sql
├── R4__lock_table.sql
└── R5__coa_segments.sql
```

## Quy tắc

- **Mỗi migration có rollback** — KHÔNG ngoại lệ (R0103)
- **PII columns** phải có annotation `classification: Confidential` (R0207)
- **KHÔNG sửa migration đã merge** — tạo migration mới
- **Oracle-specific**: sử dụng SEQUENCE, không auto-increment
- **Audit hash chain**: `prev_hash || payload || timestamp` → SHA-256
- **Outbox table**: cùng transaction với LTT write
- **SoD constraint**: `maker_id ≠ checker_id ≠ approver_id` ở DB level

## Gate G-DBA

Khi xong:

1. Self-check: tất cả migration + rollback có đủ không
2. Verify hash chain logic
3. AI tóm tắt thành `gates/G-DBA-summary.md`
4. G-DBA reviewer (DBA Lead) review trong 24h
5. Sign-off → tạo `gates/G-DBA-signoff.md`

## KHÔNG được làm

- Sửa `domain/` của BA (read-only)
- Sửa `contracts/` của SA (read-only)
- Sinh code service (Stage 3)
- Tự đổi data type sau khi SA sign-off (cần PR)

## Agent & Plugin hỗ trợ

- **Agent `dba-schema-builder`**: Đọc domain YAML + contracts → sinh DDL Oracle + rollback scripts.
  - **Cách gọi**: `> dba-schema-builder`
- **Plugin `superpowers`**: Cross-check schema vs OpenAPI contract consistency.

## Nhiệm vụ trọng tâm (Day 1)

1. Verify Gate G1 đã sign-off.
2. Chạy `dba-schema-builder` để sinh bộ migration.
3. Review kỹ `V3__audit_hash_chain.sql` — đây là cơ sở chống sửa lùi.
4. Verify rollback scripts chạy đúng trên Oracle Free.

## Khi gặp vướng

- Schema conflict với SA design: flag và coordinate với SA workspace
- Migration performance issue trên Oracle: đánh giá partitioning strategy
- PII handling chưa rõ: hỏi Security role + xem SAFETY.md

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/`

- [04-db-schema.md]: `features/{{FEATURE_NAME}}/04-db-schema.md`
- Migration files: `db/migrations/` (shared, không theo feature folder)

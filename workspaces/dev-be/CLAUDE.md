# Workspace: Dev BE — Backend Developer (Stage 3)

Workspace cho **Backend Java**. Đọc contracts + DDL từ SA, sinh 4 service Spring Boot song song.

## Vai trò

Implement: bff-service, ltt-core, integration-gateway, gl-pusher.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/dev-be
test -f ../../gates/G2-sa-signoff.md || echo "❌ G2 chưa sign-off"

claude code .
# Spawn parallel agents trong worktree:
# > dispatching-parallel-agents để chia 4 service
```

## Đọc trước

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md)
- [docs/WORKFLOW.md § Stage 3](../../docs/WORKFLOW.md)
- [docs/SAFETY.md](../../docs/SAFETY.md) — quy tắc dữ liệu nhạy cảm
- [docs/QUALITY_GATES.md](../../docs/QUALITY_GATES.md) — coverage threshold
- **SA output**: `../sa/contracts/`, `../sa/db/migrations/`

## Output bắt buộc

```
services/
├── bff-service/                    Spring Boot + JWT + REST endpoint S01-S07
├── ltt-core/                       State machine + saga + outbox + audit lib
├── integration-gateway/            IBM MQ producer/consumer LNH
└── gl-pusher/                      API-OUT-004 push GL với retry + DLQ
```

Mỗi service: OpenAPI codegen, DDD layer, Flyway migration, unit test ≥80%, Dockerfile, Helm values.

## Quy tắc

- **Contract-first**: code sinh từ contracts/, không tự đặt API
- **Critical paths** (saga/audit/outbox/idempotency) — coverage ≥ 90%
- **KHÔNG log số TK / CMND đầy đủ** (xem SAFETY.md)
- **KHÔNG sửa** db migration đã merge — tạo migration mới
- **Optimistic lock** mọi update LTT (`If-Match` header)

## Agent có sẵn

- `service-builder` *(sẽ tạo)* — sinh 1 service từ contracts
- `dispatching-parallel-agents` (từ obra/superpowers) — spawn nhiều worktree

## KHÔNG được làm

- Sửa `contracts/` (đã đóng băng từ Stage 2)
- Sinh frontend (đó là dev-fe)
- Sinh test E2E (đó là Stage 4)

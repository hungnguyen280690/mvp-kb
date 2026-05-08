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

## Agent & Plugin hỗ trợ

Dành riêng cho Java Senior Lead:

- **Plugin `java-development`**:
  - **Kỹ năng**: Maven compile, run test, fix compile error tự động, quản lý dependency.
  - **Cách dùng**: Yêu cầu Claude `"Dùng plugin java-dev để check lỗi compile sau khi sinh code"`.
- **Plugin `superpowers`**:
  - **Ứng dụng**: Quản lý nhiều worktree song song cho 4 service (`git worktree`).
- **Agent `service-builder`**:
  - **Cách gọi**: `> service-builder`
  - **Kỹ năng**: Đọc OpenAPI contract và sinh code theo cấu trúc DDD mẫu.

## Nhiệm vụ trọng tâm (Day 1)

1. Verify Gate G2 đã sign-off.
2. Dùng `dispatching-parallel-agents` để spawn 4 luồng xây dựng service.
3. Tập trung review logic: Saga, Outbox và Audit Hash Chain.

## KHÔNG được làm

- Sửa `contracts/` (đã đóng băng từ Stage 2)
- Sinh frontend (đó là dev-fe)
- Sinh test E2E (đó là Stage 4)

## Merge orchestration

Khi 4 service hoàn thành và CI xanh, **KHÔNG tự merge**. Thay vào đó:

1. Gọi orchestrator agent: `> orchestrator`
2. Orchestrator sẽ merge theo thứ tự: core → gateway → gl → bff
3. Nếu có conflict trên pom.xml, orchestrator giải quyết. Nếu có conflict logic, flag cho G3.

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/` và `services/`

- [05-implementation.md]: `features/{{FEATURE_NAME}}/05-implementation.md`
- services/: `services/` (4 Spring Boot services)

## Shared dependency lock

Nếu service cần thêm dependency vào root `pom.xml`:

1. Tạo file `services/<name>/DEPENDENCY_REQUEST.md` với groupId:artifactId:version
2. Orchestrator approve và thêm vào root pom trong lúc merge
3. **KHÔNG tự sửa root pom.xml** trong worktree

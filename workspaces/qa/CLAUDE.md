# Workspace: QA — Test Architect (Stage 4)

Workspace cho **Test pyramid 5 tầng**. Sinh test từ Gherkin + contracts + code.

## Vai trò

Đảm bảo CI xanh trước khi auto-merge. Sinh: unit, contract, integration, E2E, perf, security test.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/qa
test -f ../../gates/G3-dev-signoff.md || echo "❌ G3 chưa sign-off"
claude code .
# > test-writer
```

## Đọc trước

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/QUALITY_GATES.md](../../docs/QUALITY_GATES.md) — 20 gate auto-merge
- **BA**: `../ba/domain/user-stories/*.feature`
- **SA**: `../sa/contracts/`
- **Dev**: `../dev-be/services/`, `../dev-fe/frontend/`

## Output bắt buộc

```
tests/
├── contract/                       Pact 2 chiều (consumer + provider)
├── integration/                    Testcontainers Oracle + IBM MQ
├── e2e/                            Playwright từ 30 .feature
├── perf/                           k6 5 endpoint hot path
└── security/
    ├── zap-baseline.yaml
    └── trivy-policy.yaml
```

Unit test sống cùng code (mỗi service tự sinh).

## Quy tắc

- E2E từ `.feature` → mỗi scenario có tag `@VAL-X` / `@BIZ-X` để traceability
- Perf: p95 < 500ms, p99 < 1s, 50 RPS sustained
- Security: 0 HIGH/CRITICAL trong Trivy + ZAP
- Chaos test cho saga: random fail MQ, GL down, DB down

## Agent có sẵn

- `test-writer` *(sẽ tạo)* — sinh test từ Gherkin + contracts

## Khi nào QA vào (incremental)

Xem [WORKFLOW.md § Incremental Change Flow](../../docs/WORKFLOW.md). QA cần vào khi: code thay đổi, thêm test. **Không cần BA/SA nếu chỉ thêm/chạy test.**

## KHÔNG được làm

- Sửa code prod để pass test
- Disable test mà không qua G4 approval
- Test chạm production data

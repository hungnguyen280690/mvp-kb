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
- [docs/QUALITY_GATES.md](../../docs/QUALITY_GATES.md) — 21 gate auto-merge
- **BA**: `../ba/domain/user-stories/*.feature`, `../ba/domain/traceability-matrix.yaml`
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
- **Traceability matrix**: mỗi test case phải tag với BIZ/VAL rule ID từ `domain/traceability-matrix.yaml`. Uncovered rules = test gap → phải viết test.
- **Pact là tầng test CHÍNH** — phủ >80% integration concern. Integration test (Testcontainers) chỉ cho high-risk flow: saga, audit hash chain, outbox.
- Perf: p95 < 500ms, p99 < 1s, 50 RPS sustained
- Security: 0 HIGH/CRITICAL trong Trivy + ZAP
- Chaos test cho saga: random fail MQ, GL down, DB down

## Agent & Plugin hỗ trợ

- **Agent `test-writer`**:
  - **Cách gọi**: `> test-writer`
  - **Kỹ năng**: Chuyển đổi Gherkin (`.feature`) thành Playwright test và Pact contract test.
- **Plugin `security-scanning`**:
  - **Kỹ năng**: Chạy Trivy, ZAP scan và phân tích kết quả bảo mật.
  - **Cách dùng**: Yêu cầu Claude `"Sử dụng plugin security-scan để audit image backend"`.
- **Plugin `superpowers`**:
  - **Ứng dụng**: Traceability giữa test case và Business Rule ID.

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/` và `tests/`

- [08-test-data.md]: `features/{{FEATURE_NAME}}/08-test-data.md`
- tests/: `tests/` (workspace-local)

## Nhiệm vụ trọng tâm (Day 1)

1. Verify G3/G3' sign-off.
2. Chạy `test-writer` để phủ kín các Scenario High-risk.
3. Triage các lỗi bảo mật từ `security-scanning`.

## KHÔNG được làm

- Sửa code prod để pass test
- Disable test mà không qua G4 approval
- Test chạm production data

# Quality Gates — Tiêu chí cho phép auto-merge

Auto-merge chỉ kích hoạt khi **TẤT CẢ** check dưới đây đều xanh. Có 1 đỏ → block, không có exception trừ khi G2/G5 sign-off file `docs/security-exception.md` với lý do + thời hạn.

## Bảng gate cho PR

| #   | Gate                  | Tool                         | Required              | Block khi                                        |
| --- | --------------------- | ---------------------------- | --------------------- | ------------------------------------------------ |
| 1   | Lint                  | Spotless (Java), ESLint (TS) | ✓                     | warning > 0                                      |
| 2   | Build                 | Maven, Vite                  | ✓                     | fail                                             |
| 3   | Unit test             | JUnit 5, Vitest              | ✓                     | fail hoặc coverage < 80%                         |
| 4   | Integration test      | Testcontainers               | ✓                     | fail                                             |
| 5   | Contract test         | Pact                         | ✓                     | provider/consumer không khớp                     |
| 6   | E2E test              | Playwright                   | ✓ (PR mở >24h)        | flaky > 5% hoặc fail                             |
| 7   | SAST                  | Semgrep                      | ✓                     | finding HIGH/CRITICAL                            |
| 8   | Dependency scan       | Trivy / OWASP                | ✓                     | CVE HIGH/CRITICAL có patch                       |
| 9   | Secret scan           | gitleaks                     | ✓                     | bất kỳ secret nào                                |
| 10  | License check         | license-checker              | ✓                     | GPL / unapproved license                         |
| 11  | Image scan            | Trivy image                  | ✓                     | base image CVE HIGH/CRITICAL                     |
| 12  | SBOM                  | Syft                         | ✓                     | không sinh được SBOM                             |
| 13  | OpenAPI lint          | spectral                     | ✓                     | error                                            |
| 14  | OpenAPI diff          | oasdiff                      | ⚠️                    | breaking change → require G2                     |
| 15  | DB migration check    | Liquibase / Flyway dry-run   | ✓                     | sai cú pháp / sửa file đã merge                  |
| 16  | Helm lint             | helm lint                    | ✓                     | error                                            |
| 17  | Kubernetes manifest   | kubeconform                  | ✓                     | invalid schema                                   |
| 18  | Terraform plan        | tflint + checkov             | ✓ (nếu có change IaC) | severity HIGH                                    |
| 19  | **Claude AI review**  | Claude Code agent            | ✓                     | LGTM=false                                       |
| 20  | **Human approval**    | CODEOWNERS                   | ✓ (≥1)                | chưa có approval                                 |
| 21  | **Diagram generated** | PlantUML/Mermaid             | ✓ (Stage 1-2 PR)      | diagram file .pml/.mmd missing hoặc unrenderable |

## Quy tắc auto-merge

```
PR opened
    ↓
[1-18] CI check tự động chạy → tất cả ✅
    ↓
[19] Claude AI reviewer agent chạy
    ↓
   ┌─ LGTM=false → comment + RequestChanges → STOP
   │
   └─ LGTM=true
       ↓
   [20] CODEOWNERS approve (≥1 người, theo path file)
       ↓
   GitHub Action `auto-merge` kích hoạt
       ↓
   Squash merge vào main
       ↓
   ArgoCD sync dev (auto)
       ↓
   E2E smoke test trên dev
       ↓
   Notify Slack + Linear close ticket
```

## Phân loại PR theo rủi ro

Claude reviewer + branch protection áp dụng quy tắc khác nhau:

### 🟢 Low-risk (1 reviewer cần)

- Docs only (`docs/**/*.md`)
- Comment / typo
- Test only (không sửa code prod)
- Dependency patch version (npm `~`, Maven minor)

### 🟡 Medium-risk (2 reviewer cần — 1 human + Claude)

- Code thường (service logic không touch tiền/audit/auth)
- Frontend UI (không touch auth/payment form)
- Helm values dev/uat
- Test framework upgrade

### 🔴 High-risk (3 reviewer + G2/G3 hoặc G5)

- Code chạm: `LTT`, `outbox`, `audit`, `saga`, `payment`, `signature`, `auth`, `permissions`, `idempotency`
- DB migration (V\_\_\*.sql)
- Helm values prod
- CI/CD workflow file
- `.claude/settings.json` permission change
- `docs/SAFETY.md` change
- Branch protection / CODEOWNERS

## Coverage chi tiết

| Component                | Min coverage | Loại                               |
| ------------------------ | ------------ | ---------------------------------- |
| `ltt-core/domain/**`     | 95%          | Line + branch                      |
| `ltt-core/saga/**`       | 90%          | Line + branch                      |
| `ltt-core/audit/**`      | 95%          | Line + branch                      |
| `bff/**` controller      | 80%          | Line                               |
| `integration-gateway/**` | 90%          | Line + branch (bao gồm retry path) |
| `gl-pusher/**`           | 90%          | Line + branch                      |
| `frontend/components/**` | 75%          | Line                               |
| `frontend/hooks/**`      | 80%          | Line + branch                      |
| **Project tổng**         | 80%          | Line                               |

## Tiered test strategy

### Tier 1 — Mọi PR (phải pass trong <5 phút)

- Static checks (lint, secret scan, OpenAPI lint)
- Unit test (Java + React)
- Contract test (Pact) — chạy không cần container
- SAST + dependency scan

### Tier 2 — Medium/High-risk PR (phải pass trong <15 phút tổng)

- Integration test (Oracle + IBM MQ Testcontainers)
- E2E (Playwright)

### Tier 3 — Main branch only (post-merge)

- Image build + scan + sign
- SBOM generation

### Skip rules

- PR với label `skip-integration` + risk classification = low → integration job skipped
- Docs-only PR → chỉ chạy static checks
- CI reviewer agent validates skip decision

### Contract test coverage target

- Pact consumer contracts: 4 services x 2 providers = 8 contracts minimum
- Pact provider verification: chạy trên mọi PR (không cần container)
- Goal: catch 80% integration issues qua Pact, chỉ dựa full integration cho stateful flows (saga, audit hash chain, outbox)

## Cross-Artifact Coverage Rules (R0240–R0246)

Adapt từ ADR-0018. Đảm bảo consistency giữa artifacts.

| Rule  | Gate   | Description                                                                |
| ----- | ------ | -------------------------------------------------------------------------- |
| R0240 | MUST   | Mọi requirement trong `01-requirements.md` phải có endpoint trong OpenAPI  |
| R0241 | SHOULD | Mọi OpenAPI endpoint phải có implementation                                |
| R0242 | MUST   | Mọi BIZ/VAL rule phải có ít nhất 1 test case                               |
| R0243 | MUST   | Mọi screen trong `screens.yaml` phải có UI spec entry                      |
| R0244 | SHOULD | Mọi state transition phải có test data                                     |
| R0245 | MUST   | Upstream artifact thay đổi → downstream phải review/update (ripple update) |
| R0246 | SHOULD | Artifact/section không được reference = orphan → review                    |

## Anti-Loop Quality Gates

Adapt từ ADR-0013. Ngăn AI agent quay vòng vô tận.

| Parameter                    | Default | Description                                           |
| ---------------------------- | ------- | ----------------------------------------------------- |
| Max iterations per artifact  | 3       | Agent không chạy quá 3 lần cho cùng artifact          |
| Jaccard similarity threshold | 0.85    | 2 iterations liên tiếp similarity < 0.85 = divergence |
| Convergence required         | Yes     | Iteration cuối phải > threshold mới pass              |
| Escalation trigger           | Auto    | Khi max iterations hit hoặc divergence detected       |

## Tiered Approval Matrix

Adapt từ ADR-0008. Không phải artifact nào cũng cần cùng mức review.

| Artifact type                    | Approval level  | Reviewers            |
| -------------------------------- | --------------- | -------------------- |
| Docs only (typo, comment)        | Auto-merge      | CI pass = đủ         |
| Non-critical code                | Single-reviewer | 1 human + Claude AI  |
| Critical code (LTT, audit, saga) | Dual-reviewer   | 2 humans + Claude AI |
| Security-related                 | Security-review | G-SEC + G2/G3        |
| DB migration                     | DBA-review      | G-DBA + G2           |
| UI spec                          | UI-review       | G-UI + G3'           |
| Prod deployment                  | Manual gate     | G5 manual sync       |

## Doc-Lint Gate (#22)

CI doc-lint job kiểm tra quality rules từ [docs/quality-rules/](quality-rules/):

| Check                    | Rules                      | Blocking? |
| ------------------------ | -------------------------- | --------- |
| Front-matter validation  | R0010, R0011, R0012, R0013 | Yes       |
| Coverage check           | R0100, R0103, R0120        | Yes       |
| Cross-reference validity | R0030, R0040               | Yes       |
| Cross-artifact coverage  | R0240, R0242, R0243, R0245 | Yes       |
| PII check                | R0207                      | Yes       |
| Hedge phrase scan        | Output completeness rules  | Warning   |

## Exception process

Nếu 1 PR cần bypass 1 gate (rất hiếm):

1. Tạo file `docs/exceptions/{date}-{pr-number}.md` với:
   - Gate nào bypass
   - Lý do (technical) + impact analysis
   - Compensating control (vd: extra E2E, manual test)
   - Thời hạn fix (max 30 ngày)
2. Cần 2 chữ ký: G2 (SA) + G5 (SRE)
3. CI bot tự tạo follow-up issue, milestone = ngày hết hạn
4. Quá hạn → revert PR

## SLA cho gate

| Gate                  | Thời gian tối đa |
| --------------------- | ---------------- |
| CI tự động (1-18)     | 15 phút          |
| Claude AI review (19) | 5 phút           |
| Human review (20)     | 24h business     |
| Exception sign-off    | 48h              |

Quá SLA → escalate Slack `#vibe-pipeline-stuck`.

## Metric tracking

Đo hàng tuần (dashboard Grafana):

- **First-pass rate**: % PR pass tất cả gate lần đầu (mục tiêu > 70%)
- **Time-to-merge**: từ PR open tới merge (mục tiêu < 4h cho low-risk, < 24h high-risk)
- **Claude LGTM rate**: % PR Claude tự duyệt (mục tiêu 60-80%, > 90% nghi quá lỏng, < 40% nghi quá khắt)
- **Human override rate**: % PR human approve dù Claude RequestChanges (audit để cải thiện prompt)
- **Defect escape rate**: bug prod / PR (mục tiêu < 1/100)

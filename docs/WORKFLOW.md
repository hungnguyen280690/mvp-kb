# Pipeline 5 Stage — BA → SA → Dev → Test → DevOps

Mọi công việc đi qua 5 stage tuần tự. Output stage trước = input stage sau. Mỗi stage có gatekeeper riêng (xem [GATEKEEPERS.md](GATEKEEPERS.md)).

## Tổng quan

```
SRS xlsx (input gốc, đã có)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 1 — BA (AI parse SRS)             ✋ G1: BA       │
│ Output: domain/glossary, states, rules, *.feature       │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 2 — SA (AI generate)              ✋ G2: SA       │
│ Output: contracts/*, db/migrations, ADR, threat model   │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 3 — Dev (AI parallel agents)      ✋ G3: Java Lead│
│                                         ✋ G3': FE Lead  │
│ Output: 4 service Java + React FE                       │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 4 — Test (AI test pyramid)        ✋ G4: QA Lead  │
│ Output: unit + contract + integration + E2E + perf + sec│
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 5 — DevOps (AI pipeline)          ✋ G5: SRE      │
│ Output: Tekton + ArgoCD + Helm + OTel + runbook         │
└─────────────────────────────────────────────────────────┘
```

---

## STAGE 1 — BA

**Input**: SRS xlsx (`/home/hung/home-task-manager/VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx`)

**AI làm**:
- Parse 22 sheet thành **semantic model YAML** (máy đọc được)
- Sinh `domain/glossary.md` (domain glossary đầy đủ, mở rộng từ CONTEXT.md)
- Sinh `domain/states.yaml` — 15 trạng thái + transitions
- Sinh `domain/business-rules.yaml` — 29 BIZ rule
- Sinh `domain/validation-rules.yaml` — 36 VAL rule
- Sinh `domain/permissions.yaml` — phân quyền + 5 SoD
- Sinh `domain/coa-segments.yaml` — COA matrix
- Sinh `domain/user-stories/*.feature` — Gherkin (~30 stories)
- Sinh `domain/scope.yaml` — MVP scope đã chốt (channel, touchpoint, tier)
- Flag inconsistency: rule nào không có test? state nào không reach được?

**G1 review** (~2h):
- Đọc `domain/scope.yaml` — chốt MVP narrow (LNH only? GL only? 3-tier?)
- Spot-check `domain/business-rules.yaml` 5-10 rule quan trọng
- Sign-off: `gates/G1-ba-signoff.md`

**Output dùng cho stage sau**: `domain/*` cố định, không tự ý sửa ở stage 2.

---

## STAGE 2 — SA

**Input**: `domain/*` từ Stage 1.

**AI làm**:
- Sinh `contracts/openapi/api-internal-v1.yaml` (4 internal API từ sheet 6)
- Sinh `contracts/openapi/api-callback-v1.yaml` (1 inbound callback)
- Sinh `contracts/asyncapi/events-v1.yaml` (event bus nội bộ)
- Sinh `contracts/mq/lnh-message.xsd` (IBM MQ message format)
- Sinh `contracts/schemas/payment-order-v1.json` (canonical schema, source of truth)
- Sinh `db/migrations/V1__init_ltt.sql` — bảng LTT, line item, party
- Sinh `db/migrations/V2__outbox.sql` — outbox table
- Sinh `db/migrations/V3__audit_hash_chain.sql` — append-only audit
- Sinh `db/migrations/V4__lock_table.sql` — optimistic + pessimistic lock
- Sinh `docs/c4/{context,container,component}.mmd`
- Sinh `docs/adr/000{1..6}-*.md` — 6 quyết định kiến trúc
- Sinh `docs/threat-model.md` — STRIDE, focus tampering/replay/idempotency

**G2 review** (~4h):
- `payment-order-v1.json` — CRITICAL, sai cái này là sửa cả pipeline
- `db/migrations/*` — DDL Oracle, đặc biệt audit hash chain
- `threat-model.md` — đủ chống replay/tampering chưa
- Sign-off: `gates/G2-sa-signoff.md`

**Output dùng cho stage sau**: `contracts/*` đóng băng, không sửa khi đã sign-off.

---

## STAGE 3 — Dev (BE + FE song song)

**Input**: `contracts/*` + `db/migrations/*` từ Stage 2.

**AI làm** — spawn 5 agent song song (5 worktree git):

| Agent | Worktree | Sinh ra |
|---|---|---|
| `bff-builder` | `wt/bff` | `services/bff-service/` Spring Boot + JWT + REST endpoint S01-S07 |
| `core-builder` | `wt/core` | `services/ltt-core/` State machine + saga + outbox + audit lib |
| `gateway-builder` | `wt/gateway` | `services/integration-gateway/` IBM MQ producer/consumer LNH |
| `gl-builder` | `wt/gl` | `services/gl-pusher/` API-OUT-004 push GL với retry + DLQ |
| `react-builder` | `wt/fe` | `frontend/` React 18 + Vite + TS, 7 màn S01-S07 |

**Mỗi agent tự sinh**: OpenAPI codegen, DDD layer, Flyway migration, unit test ≥80%, Dockerfile, Helm values, ArgoCD app, mở PR.

**G3 review** (~5h tổng):
- G3 review 4 PR Java: focus BIZ-MAKER-CHECKER, BIZ-RESERVE-FUND, BIZ-AUDIT, BIZ-OPTIMISTIC-LOCK, BIZ-IDEMPOTENCY
- G3' review 1 PR React: focus UX form lệnh chi (S02), workflow approval (S04), accessibility
- KHÔNG đọc boilerplate (DTO mapping, CRUD)

**Output dùng cho stage sau**: code merge vào main, CI xanh.

---

## STAGE 4 — Test

**Input**: code từ Stage 3 + Gherkin từ Stage 1.

**AI làm** — sinh 5 tầng test:

| Tầng | Tool | Số case dự kiến |
|---|---|---|
| Unit | JUnit 5 + Mockito | ~200 |
| Contract | Pact 2 chiều | 4 service × 2 |
| Integration | Testcontainers (Oracle + IBM MQ) | ~30 |
| E2E | Playwright (từ 30 .feature) | ~30 |
| Perf | k6 (5 endpoint hot path) | 5 |
| Security | ZAP + Trivy + Semgrep + Checkov | toàn pipeline |

**G4 review** (~30min):
- Triage flaky test (E2E hay flaky)
- Spot-check 1-2 critical scenario (vd: maker-checker bypass attempt)
- Sign-off: `gates/G4-test-signoff.md`

**Output**: CI tất cả xanh, coverage ≥80%.

---

## STAGE 5 — DevOps

**Input**: services + Helm chart từ Stage 3.

**AI làm**:
- `.tekton/build-pipeline.yaml` — build → test → SAST → image scan → cosign sign → push
- `.tekton/deploy-pipeline.yaml` — trigger ArgoCD sync
- `.tekton/promote-pipeline.yaml` — dev → uat → prod (manual gate)
- `deploy/argocd/apps/*-{dev,uat,prod}.yaml`
- `deploy/helm/_shared/values-{dev,uat,prod}.yaml`
- `observability/otel-collector.yaml`
- `observability/grafana-dashboard.json` (auto-gen từ metric naming)
- `observability/alerts.yaml` — SLO-based
- `observability/runbook/{outbox-stuck,mq-down,gl-failed-dlq}.md`

**G5 review** (~1h):
- Approve ArgoCD prod sync (manual button)
- Đọc 3 runbook để biết khi alert thì làm gì
- Test rollback bằng feature flag 1 lần
- Sign-off: `gates/G5-devops-signoff.md`

**Output**: 1 click deploy dev/uat, prod sync manual.

---

## Quy tắc xuyên suốt

1. **Không nhảy stage** — không generate code (Stage 3) khi contract (Stage 2) chưa sign-off.
2. **Stage trước đóng băng artifact** sau khi sign-off. Stage sau chỉ đọc.
3. **Cần sửa stage trước**: tạo PR sửa artifact đó, gatekeeper re-sign, downstream re-run.
4. **AI tự dispatch agent kế tiếp** sau khi gate pass — agent đọc gate signoff để biết tiến.
5. **Mọi artifact** sống trong git, không có "trao tay miệng".

## Tracking

- Task list: `TaskList` tool (10 task chính + foundation)
- Per-stage progress: `gates/G{N}-progress.md` (AI cập nhật)
- Per-PR review: GitHub/GitLab PR

## Khi có thay đổi yêu cầu

- Thay đổi NHỎ (rule, validation): sửa ở `domain/*`, re-run từ Stage 2 partial.
- Thay đổi LỚN (scope, kiến trúc): sửa ở `domain/scope.yaml` + `contracts/*`, re-run từ Stage 2 full.
- KHÔNG bao giờ sửa thẳng code Stage 3 mà bỏ qua việc cập nhật contract.

---

## Incremental Change Flow — Bỏ qua các giai đoạn không liên quan

Sau khi MVP pipeline đầu tiên hoàn tất và tất cả đã được ký kết, các thay đổi tiếp theo **không cần chạy hết 5 giai đoạn**. Xác định giai đoạn bị ảnh hưởng và chỉ chạy từ đó trở đi.

### Ma trận thay đổi → Giai đoạn

| Thay đổi | Giai đoạn cần chạy | Bỏ qua | Gate cần |
|---|---|---|---|
| Thêm/sửa SRS (sheet mới, rule mới) | 1 → 2 → 3 → 4 → 5 | — | G1 |
| Thêm domain rule (không đổi SRS) | 1 → 2 → 3 → 4 | 5 | G1 |
| Thêm/sửa API contract | 2 → 3 → 4 → 5 | 1 | G2 |
| Thêm/sửa DB migration | 2 → 3 → 4 | 1 | G2 |
| Sửa code business logic (không đổi contract) | 3 → 4 | 1, 2 | G3 |
| Sửa UI/UX (không đổi API) | 3' → 4 | 1, 2, 5 | G3' |
| Thêm/sửa test | 4 | 1, 2, 3 | G4 |
| Sửa infra, Helm, pipeline | 5 | 1, 2, 3, 4 | G5 |
| Sửa docs (không đổi artifact) | — | tất cả | — |
| Hotfix prod (gấp) | 3 → 4 → 5 | 1, 2 | G3 + G5 |

### Quy tắc bỏ qua giai đoạn

1. **Chỉ bỏ qua khi tất cả các giai đoạn trước đã được ký kết** (có `gates/G*-signoff.md`).
2. **Thay đổi chạm `domain/*`** → phải chạy lại từ Giai đoạn 1.
3. **Thay đổi chạm `contracts/*` hoặc `db/migrations/*`** → phải chạy lại từ Giai đoạn 2.
4. **Thay đổi chỉ chạm `services/*`** → chạy từ Giai đoạn 3.
5. **Gatekeeper chỉ review khi giai đoạn của họ bị ảnh hưởng** — không review oan.

### Quick-reference cho từng role

| Role | Khi nào vào? | Làm gì? |
|---|---|---|
| **BA** | SRS thay đổi / thêm use case / sửa rule nghiệp vụ | Parse sheet mới → update `domain/*` → G1 sign-off |
| **SA** | `domain/*` thay đổi / thêm API / sửa DB schema | Update `contracts/*` + `db/migrations/*` → G2 sign-off |
| **Dev BE** | `contracts/*` thay đổi / sửa logic / hotfix | Implement theo contract → mở PR → G3 review |
| **Dev FE** | `contracts/*` thay đổi / sửa UI | Implement UI → mở PR → G3' review |
| **QA** | Code thay đổi / thêm test | Sinh + chạy test → G4 sign-off |
| **DevOps** | Service thay đổi / sửa infra | Update Helm + pipeline → G5 sign-off |

### Ví dụ cụ thể

**"Thêm SRS mới"**: BA parse sheet mới → update domain/ → nếu có rule mới ảnh hưởng contract → SA update → Dev implement → QA test → DevOps deploy.

**"Sửa bug code nhỏ"**: Dev sửa trực tiếp → mở PR → CI chạy → QA verify → merge. Không cần BA hay SA.

**"Thêm field mới trên form"**: BA thêm vào domain/ → SA thêm vào contract → Dev FE update UI → QA test. DevOps không cần vào nếu không đổi infra.

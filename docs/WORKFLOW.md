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
│ STAGE 2 — SA + DBA + Security + UI/UX   ✋ G2: SA       │
│ (AI generate, 4 roles song song)        ✋ G-DBA        │
│ Output: contracts, DDL, threat model, UI spec           │
│                                         ✋ G-SEC         │
│                                         ✋ G-UI          │
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
- Sinh `domain/traceability-matrix.yaml` — ánh xạ moi BIZ/VAL rule sang user-story scenario
- Sinh `domain/diagrams/states.pml` — PlantUML state machine (15 trạng thái + transition)
- Sinh `domain/diagrams/rules-matrix.pml` — PlantUML rule coverage matrix
- Flag inconsistency: rule nào không có test? state nào không reach được?

**G1 review** (~2h):

- Đọc `domain/scope.yaml` — chốt MVP narrow (LNH only? GL only? 3-tier?)
- **Visually verify `domain/diagrams/states.pml`** — render bằng `make diagrams`, chốt 15 trạng thái + transition
- **Review `domain/traceability-matrix.yaml`** — moi rule có scenario cover, xử lý uncovered
- Spot-check `domain/business-rules.yaml` 5-10 rule quan trọng
- Sign-off: `gates/G1-ba-signoff.md`

**Output dùng cho stage sau**: `domain/*` cố định, không tự ý sửa ở stage 2.

---

## STAGE 2 — SA + DBA + Security + UI/UX

**Input**: `domain/*` từ Stage 1.

4 roles chạy song song trong Stage 2:

### SA (lead)

**AI làm**:

- Sinh `contracts/openapi/api-internal-v1.yaml` (4 internal API từ sheet 6)
- Sinh `contracts/openapi/api-callback-v1.yaml` (1 inbound callback)
- Sinh `contracts/asyncapi/events-v1.yaml` (event bus nội bộ)
- Sinh `contracts/mq/lnh-message.xsd` (IBM MQ message format)
- Sinh `contracts/schemas/payment-order-v1.json` (canonical schema, source of truth)
- Sinh `docs/c4/{context,container,component}.mmd`
- Sinh `docs/adr/000{1..6}-*.md` — 6 quyết định kiến trúc

**G2 review** (~4h):

- `payment-order-v1.json` — CRITICAL, sai cái này là sửa cả pipeline
- **`docs/c4/*.mmd` — visually verify kiến trúc 4 service + data flow**
- Sign-off: `gates/G2-sa-signoff.md`

### DBA

**AI làm**:

- Sinh `db/migrations/V1__init_ltt.sql` — bảng LTT, line item, party
- Sinh `db/migrations/V2__outbox.sql` — outbox table
- Sinh `db/migrations/V3__audit_hash_chain.sql` — append-only audit
- Sinh `db/migrations/V4__lock_table.sql` — optimistic + pessimistic lock
- Sinh `db/migrations/V5__coa_segments.sql` — COA validation
- Sinh rollback scripts cho mỗi migration

**G-DBA review** (~1h):

- DDL Oracle, đặc biệt audit hash chain
- Rollback scripts test trên Oracle Free
- SoD constraint ở DB level
- Sign-off: `gates/G-DBA-signoff.md`

### Security

**AI làm**:

- Sinh `docs/threat-model.md` — STRIDE, focus tampering/replay/idempotency
- Sinh `security/policies/access-control.md` — RBAC + SoD
- Sinh `security/policies/data-classification.md` — PII/Restricted/Internal/Public
- Sinh `security/compliance/owasp-top10-checklist.md`

**G-SEC review** (~1h):

- Threat model đủ chống replay/tampering chưa
- SoD matrix cover đủ 4 vai trò
- PII handling đúng SAFETY.md
- Sign-off: `gates/G-SEC-signoff.md`

### UI/UX

**AI làm**:

- Sinh `features/{{FEATURE}}/07-ui-spec.md` — 7 screens S01-S07
- Sinh `ui/design-system/` — colors, typography, components
- Sinh `ui/accessibility/a11y-baseline.md` — WCAG 2.1 AA

**G-UI review** (~45min):

- S02 form validation match BA rules
- Accessibility baseline đạt WCAG 2.1 AA
- Design system consistency
- Sign-off: `gates/G-UI-signoff.md`

**Output dùng cho stage sau**: `contracts/*` + `db/migrations/*` + `security/*` + `ui/*` đóng băng, không sửa khi đã sign-off.

## Agentic Loop Topology

Adapt từ ADR-0013. 3-layer nested loop cho AI agent generation:

```
Layer 1: Per-artifact loop
  └── Agent generates artifact → quality rules check → fix if needed
      └── Max 3 iterations, Jaccard convergence > 0.85

Layer 2: Per-batch loop (Stage 2: SA+DBA+Security+UI)
  └── Cross-artifact consistency check → ripple update if needed

Layer 3: Per-feature loop
  └── End-to-end coverage check → gap detection → backfill if needed
```

**Convergence criteria**: Jaccard similarity > 0.85 giữa 2 iterations liên tiếp.
**Divergence handling**: Dùng template `docs/escalations/divergence-detected.md`.
**Max iterations**: 3 per artifact. Override cần human approval.

## Agent Attribution

Adapt từ ADR-0007. 4-layer attribution system:

| Layer             | What                                | Where                   |
| ----------------- | ----------------------------------- | ----------------------- |
| 1. Agent roster   | Agent identity + capabilities       | `.claude/agents/`       |
| 2. Session handle | Session-specific identifier         | Session log `meta.json` |
| 3. Front-matter   | `generated_by` field trong artifact | Mỗi `.md` file          |
| 4. Commit trailer | `Co-Authored-By` / `Generated-by`   | Git commit              |

**Quy tắc**: Mọi AI-generated artifact phải có ít nhất layer 3 (front-matter). PR phải có layer 4 (commit trailer).

## RACI Matrix — 9 Roles

| Artifact           | PO      | BA    | SA      | DBA   | Dev-BE | Dev-FE | QA    | Security | UI/UX   | DevOps  |
| ------------------ | ------- | ----- | ------- | ----- | ------ | ------ | ----- | -------- | ------- | ------- |
| 00-idea.md         | **R/A** | C     | I       | I     | I      | I      | I     | I        | I       | I       |
| 01-requirements.md | I       | **R** | C       | C     | I      | I      | C     | C        | C       | I       |
| 02-design.md       | I       | C     | **R/A** | C     | C      | C      | C     | C        | C       | C       |
| 03-api-contract    | I       | C     | **R/A** | I     | C      | C      | C     | I        | I       | I       |
| 04-db-schema.md    | I       | C     | C       | **R** | C      | I      | C     | C        | I       | C       |
| 05-implementation  | I       | I     | I       | I     | **R**  | **R**  | C     | I        | I       | I       |
| 06-threat-model.md | I       | C     | C       | C     | C      | C      | C     | **R/A**  | C       | C       |
| 07-ui-spec.md      | I       | C     | C       | I     | I      | C      | C     | I        | **R/A** | I       |
| 08-test-data.md    | I       | C     | I       | I     | C      | C      | **R** | C        | C       | I       |
| 05-runbook.md      | I       | I     | C       | C     | C      | I      | I     | C        | I       | **R/A** |

## Ripple Update Workflow

Khi upstream artifact thay đổi:

1. Agent detect change (via SHA diff)
2. Identify downstream artifacts (via RACI matrix)
3. Evaluate impact (full re-gen vs patch)
4. Generate ripple update
5. Re-run quality gates on affected artifacts
6. Re-sign affected gates if needed

Xem template: `docs/escalations/conflict.md`

---

## STAGE 3 — Dev (BE + FE song song)

**Input**: `contracts/*` + `db/migrations/*` từ Stage 2.

**AI làm** — spawn 5 agent song song (5 worktree git):

| Agent             | Worktree     | Sinh ra                                                           |
| ----------------- | ------------ | ----------------------------------------------------------------- |
| `bff-builder`     | `wt/bff`     | `services/bff-service/` Spring Boot + JWT + REST endpoint S01-S07 |
| `core-builder`    | `wt/core`    | `services/ltt-core/` State machine + saga + outbox + audit lib    |
| `gateway-builder` | `wt/gateway` | `services/integration-gateway/` IBM MQ producer/consumer LNH      |
| `gl-builder`      | `wt/gl`      | `services/gl-pusher/` API-OUT-004 push GL với retry + DLQ         |
| `react-builder`   | `wt/fe`      | `frontend/` React 18 + Vite + TS, 7 màn S01-S07                   |

**Mỗi agent tự sinh**: OpenAPI codegen, DDD layer, Flyway migration, unit test ≥80%, Dockerfile, Helm values, ArgoCD app, mở PR.

**G3 review** (~5h tổng):

- G3 review 4 PR Java: focus BIZ-MAKER-CHECKER, BIZ-RESERVE-FUND, BIZ-AUDIT, BIZ-OPTIMISTIC-LOCK, BIZ-IDEMPOTENCY
- G3' review 1 PR React: focus UX form lệnh chi (S02), workflow approval (S04), accessibility
- KHÔNG đọc boilerplate (DTO mapping, CRUD)

**Merge orchestration**:

- KHÔNG tự merge. Gọi orchestrator agent (`> orchestrator`).
- Merge theo thứ tự: ltt-core → integration-gateway → gl-pusher → bff-service → frontend
- Core phải merge trước vì 3 service còn lại phụ thuộc domain model của nó
- Conflict trên pom.xml: orchestrator giải quyết (additive merge)
- Conflict logic: flag cho G3 review

**Output dùng cho stage sau**: code merge vào main, CI xanh.

---

## STAGE 4 — Test

**Input**: code từ Stage 3 + Gherkin từ Stage 1.

**AI làm** — sinh 5 tầng test:

| Tầng        | Tool                             | Số case dự kiến |
| ----------- | -------------------------------- | --------------- |
| Unit        | JUnit 5 + Mockito                | ~200            |
| Contract    | Pact 2 chiều                     | 4 service × 2   |
| Integration | Testcontainers (Oracle + IBM MQ) | ~30             |
| E2E         | Playwright (từ 30 .feature)      | ~30             |
| Perf        | k6 (5 endpoint hot path)         | 5               |
| Security    | ZAP + Trivy + Semgrep + Checkov  | toàn pipeline   |

**G4 review** (~30min):

- Triage flaky test (E2E hay flaky)
- Spot-check 1-2 critical scenario (vd: maker-checker bypass attempt)
- **Traceability matrix**: moi BIZ/VAL rule có ít nhất 1 test case xanh, coverage >95%
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
4. **Mọi tính năng mới đều có nhánh riêng** — `feat/<tên-tính-năng>`. AI tạo nhánh khi bắt đầu task. Trên nhánh đó AI tự do commit + push, CI tự review.
5. **Auto-commit + debounce-push** — hook `git-auto-push.sh`: commit mỗi 30s, push gom 2 phút. Nếu đang trên main thì chỉ commit local, không push.
6. **Con người chỉ quyết định merge** — AI tự code, tự push, CI tự review. Gatekeeper chỉ approve merge nhánh `feat/*` vào main.
7. **AI tự dispatch agent kế tiếp** sau khi gate pass — agent đọc gate signoff để biết tiến.
8. **Mọi artifact** sống trong git, không có "trao tay miệng".

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

| Thay đổi                                     | Giai đoạn cần chạy | Bỏ qua     | Gate cần |
| -------------------------------------------- | ------------------ | ---------- | -------- |
| Thêm/sửa SRS (sheet mới, rule mới)           | 1 → 2 → 3 → 4 → 5  | —          | G1       |
| Thêm domain rule (không đổi SRS)             | 1 → 2 → 3 → 4      | 5          | G1       |
| Thêm/sửa API contract                        | 2 → 3 → 4 → 5      | 1          | G2       |
| Thêm/sửa DB migration                        | 2 → 3 → 4          | 1          | G2       |
| Sửa code business logic (không đổi contract) | 3 → 4              | 1, 2       | G3       |
| Sửa UI/UX (không đổi API)                    | 3' → 4             | 1, 2, 5    | G3'      |
| Thêm/sửa test                                | 4                  | 1, 2, 3    | G4       |
| Sửa infra, Helm, pipeline                    | 5                  | 1, 2, 3, 4 | G5       |
| Sửa docs (không đổi artifact)                | —                  | tất cả     | —        |
| Hotfix prod (gấp)                            | 3 → 4 → 5          | 1, 2       | G3 + G5  |

### Quy tắc bỏ qua giai đoạn

1. **Chỉ bỏ qua khi tất cả các giai đoạn trước đã được ký kết** (có `gates/G*-signoff.md`).
2. **Thay đổi chạm `domain/*`** → phải chạy lại từ Giai đoạn 1.
3. **Thay đổi chạm `contracts/*` hoặc `db/migrations/*`** → phải chạy lại từ Giai đoạn 2.
4. **Thay đổi chỉ chạm `services/*`** → chạy từ Giai đoạn 3.
5. **Gatekeeper chỉ review khi giai đoạn của họ bị ảnh hưởng** — không review oan.

### Quick-reference cho từng role

| Role         | Khi nào vào?                                      | Làm gì?                                                  |
| ------------ | ------------------------------------------------- | -------------------------------------------------------- |
| **BA**       | SRS thay đổi / thêm use case / sửa rule nghiệp vụ | Parse sheet mới → update `domain/*` → G1 sign-off        |
| **SA**       | `domain/*` thay đổi / thêm API / sửa kiến trúc    | Update `contracts/*` → G2 sign-off                       |
| **DBA**      | `domain/*` thay đổi / thêm API / sửa DB schema    | Update `db/migrations/*` + rollback → G-DBA sign-off     |
| **Security** | `domain/*` hoặc `contracts/*` thay đổi            | Update threat model + security policies → G-SEC sign-off |
| **UI/UX**    | `domain/*` thay đổi / thêm screen / sửa UX        | Update UI spec + design system → G-UI sign-off           |
| **Dev BE**   | `contracts/*` thay đổi / sửa logic / hotfix       | Implement theo contract → mở PR → G3 review              |
| **Dev FE**   | `contracts/*` hoặc UI spec thay đổi               | Implement UI → mở PR → G3' review                        |
| **QA**       | Code thay đổi / thêm test                         | Sinh + chạy test → G4 sign-off                           |
| **DevOps**   | Service thay đổi / sửa infra                      | Update Helm + pipeline → G5 sign-off                     |

### Ví dụ cụ thể

**"Thêm SRS mới"**: BA parse sheet mới → update domain/ → nếu có rule mới ảnh hưởng contract → SA update → Dev implement → QA test → DevOps deploy.

**"Sửa bug code nhỏ"**: Dev sửa trực tiếp → mở PR → CI chạy → QA verify → merge. Không cần BA hay SA.

**"Thêm field mới trên form"**: BA thêm vào domain/ → SA thêm vào contract → Dev FE update UI → QA test. DevOps không cần vào nếu không đổi infra.

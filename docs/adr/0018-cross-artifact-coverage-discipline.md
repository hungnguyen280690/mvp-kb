# ADR-0018: Kỷ luật bao phủ chéo sản phẩm bàn giao (phát hiện khoảng trống chủ động bởi BA + QA + UI/UX)

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** SA (dẫn dắt), BA, QA, UI/UX, tham vấn tất cả các vai trò
- **Thẻ:** quy-trình, khả-năng-truy-nguồn, phát-hiện-khoảng-trống, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Việc tái tạo Gen 2 TT.OUT.MANUAL đã phơi bày một khoảng trống quy trình. Hệ thống phát hiện được vi phạm tính đầy đủ **trong từng sản phẩm bàn giao** (R0103 no-TBD, R0220 thiếu baseline a11y, R0230 cụm từ lảng tránh bị cấm, R1001 cite-or-die) nhưng bỏ sót các khoảng trống **chéo giữa các sản phẩm bàn giao**:

1. `07-ui-spec.md §3` bản đồ tuyến liệt kê `/customers`, `/subscriptions`, `/invoices` là các trang đầy đủ — Agent Frontend chỉ giao các trang giữ chỗ. Spec <-> triển khai sai lệch âm thầm.
2. `07-ui-spec.md §7` hợp đồng dữ liệu tham chiếu `GET /v1/customers` (tìm kiếm admin) — bảng API `02-design.md` của backend không bao gồm endpoint này. Spec <-> thiết kế sai lệch âm thầm.
3. `01-requirements.md` FR-1.4 ("tự đổi gói cước") không có triển khai UI. Yêu cầu <-> triển khai sai lệch âm thầm.
4. Không có agent QA nào xác minh rằng mọi endpoint trong thiết kế đều có kiểm thử trong `04-test-plan.md`. Thiết kế <-> kiểm thử sai lệch âm thầm.

Theo ADR-0013, **vòng lặp theo lô (tầng giữa)** đáng lẽ phải phát hiện những vấn đề này — coordinator soát xét TẤT CẢ sản phẩm bàn giao cùng lúc để đảm bảo tính nhất quán xuyên suốt. Nhưng lát cắt demo thực tế không chạy reviewer theo lô; tôi (orchestrator) đã viết `07-ui-spec.md` độc lập với đầu ra của agent Frontend. Kiểm tra tồn tại trong thiết kế nhưng không được thực thi.

Khắc phục theo hai hướng:

- **Kiểm tra bao phủ tự động bắt buộc** (họ linter R0240) — ép buộc bằng máy; không thể bỏ qua
- **Soát xét chủ động ở mức vai trò bắt buộc** (mở rộng quy trình BA + QA + UI/UX) — con người/agent phát hiện khoảng trống TRƯỚC KHI Dev triển khai, không phải sau

## Quyết định

Áp dụng **Kỷ luật bao phủ chéo sản phẩm bàn giao** với ba lớp ép buộc:

### Lớp 1 — Họ quy tắc linter R0240 (kiểm tra chéo sản phẩm bàn giao ép buộc bằng máy)

| Quy tắc  | Kiểm tra                                                                                                                                                           | Nghiêm trọng |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| **R0240** | Mọi API endpoint trong bảng hợp đồng dữ liệu `07-ui-spec.md §7` đều TỒN TẠI trong mục API/tích hợp của `02-design.md`                                             | error        |
| **R0241** | Mọi tuyến UI trong bản đồ tuyến `07-ui-spec.md §3` đều có kiểm thử E2E tương ứng trong `04-test-plan.md §UI E2E`                                                  | error        |
| **R0242** | Mọi Yêu cầu Chức năng (FR-N) trong `01-requirements.md` đều được tham chiếu bởi >=1 kiểm thử trong ma trận truy nguồn `04-test-plan.md`                           | error        |
| **R0243** | Mọi API endpoint trong bảng API `02-design.md` đều có >=1 kiểm thử tích hợp trong `04-test-plan.md §Integration`                                                  | error        |
| **R0244** | Mọi trang trong bản đồ tuyến `07-ui-spec.md §3` đều có triển khai trong kho mã (file khớp `frontend/src/routes/<page>.tsx` hoặc tương đương) — kiểm tra tại thời điểm PR code | error |
| **R0245** | Mọi component trong bảng tổng hợp `07-ui-spec.md §4.2` đều có file triển khai khớp `frontend/src/components/tt-out-manual/<Component>.tsx`                         | error        |
| **R0246** | Mọi endpoint trong bảng API `02-design.md` đều có tuyến triển khai trong code (Java: `mux.HandleFunc("METHOD /v1/...", ...)` tồn tại)                             | error        |

R0240-R0243: chỉ tài liệu (chạy trên PR tài liệu)
R0244-R0246: cầu nối code-tài liệu (chạy trên PR code; yêu cầu liên kết spec khai báo trong mô tả PR)

Nghiêm trọng: **error từ Phase 0** cho R0240-R0243 (kiểm tra doc-doc rẻ và rõ ràng); **warn -> error ở Phase 1** cho R0244-R0246 (cho thời gian bổ sung bao phủ trong MVP).

### Lớp 2 — BA soát xét khoảng trống thiết kế chủ động

Quy trình của BA mở rộng vượt ra khỏi `Approved01` với trạng thái mới:

```
Approved01 -> ConsultingDesign -> MonitoringDesign -> Approved01-Final
```

Sau khi SA nộp `02-design.md` để soát xét, **agent BA chạy quy trình `design-gap-review`**:

- Đọc `01-requirements.md` (đầu ra của chính BA)
- Đọc `02-design.md` (bản nháp của SA)
- Với mỗi yêu cầu (FR-N), xác nhận có endpoint API hoặc component trong thiết kế giải quyết nó
- Đầu ra: nhận xét soát xét `02-design.md` liệt kê các FR chưa được bao phủ
- Nếu phát hiện khoảng trống -> SA khắc phục qua inner-loop fix-attempt; lan truyền

Điều này làm BA trở thành **tuyến phòng thủ đầu tiên chéo sản phẩm bàn giao** cho bao phủ yêu cầu <-> thiết kế.

### Lớp 3 — QA phát hiện khoảng trống trước triển khai

Quy trình của QA thêm trạng thái mới TRƯỚC `Drafting04`:

```
Reviewing01 -> Reviewing02 -> Reviewing03 -> GapDetection -> Drafting04
```

Trong `GapDetection`, **agent QA chạy quy trình `pre-implementation-gap-detection`**:

- Đọc `01-requirements.md`, `02-design.md`, `03-schema.md`, `07-ui-spec.md` (tất cả tiền nhiệm hiện có)
- Kiểm tra chéo:
  - Mọi FR đều có danh mục kiểm thử mục tiêu
  - Mọi API endpoint trong thiết kế đều có slot kiểm thử
  - Mọi trang UI trong spec đều có slot kiểm thử E2E
  - Mọi cột PII trong schema đều có kiểm thử trong security-tests
- Đầu ra: Bản nháp `04-test-plan.md` được điền trước ma trận truy nguồn; VÀ một `gap-report.md` riêng liệt kê các mục chưa bao phủ
- Nếu phát hiện khoảng trống -> chủ sở hữu vai trò tương ứng khắc phục sản phẩm bàn giao thượng nguồn; ma trận của QA trở thành hợp đồng mà Dev phải triển khai

Điều này làm QA trở thành **tuyến phòng thủ thứ hai** trước khi Dev lãng phí công sức trên spec chưa đầy đủ.

### Lớp 4 — Kiểm tra nhất quán hợp đồng dữ liệu UI/UX

Quy trình của UI/UX mở rộng với kiểm tra mới trong `Drafting07`:

- Sau khi UI/UX viết bảng hợp đồng dữ liệu `07-ui-spec.md §7`, agent xác nhận mỗi endpoint tồn tại trong bảng API `02-design.md`
- Không khớp -> tạo `escalations/conflict.md` gửi SA (yêu cầu thêm endpoint hoặc loại khỏi phạm vi UI)

Đây là **tuyến phòng thủ thứ ba** — UI không giao spec tham chiếu endpoint mà SA chưa thiết kế.

### Reviewer theo lô (bắt tất cả)

Theo ADR-0013 tầng giữa: một agent coordinator (`@claude-architect-reviewer` với prompt batch-review) chạy sau khi tất cả vòng lặp per-artifact hội tụ. Nó chạy R0240-R0243 + soát xét chéo thủ công. Nếu phát hiện khoảng trống mà kiểm tra per-role bỏ sót, những khoảng trống đó trở thành **ca hồi quy** — được thêm vào quy trình của vai trò tương ứng dưới dạng mục kiểm tra.

## Consequences

### Positive

- **Workflow gap closed**: cross-artifact coverage isn't optional; checked at 4 separate points (BA, UI/UX, QA, per-batch reviewer) plus 7 linter rules
- Dev agents receive **validated specs** — fewer post-hoc fix iterations; less reassignment churn
- Gen 2's specific failures (placeholder pages, missing endpoints) become impossible: R0244 (page implementation) and R0240 (endpoint coverage) catch them mechanically
- Proactive gap detection cheaper than reactive fix (ADR-0009 defense-in-depth principle)

### Negative / Costs

- BA + QA + UI/UX role workloads grow ~10-15% (the extra review states add ~1 day per feature)
- 7 new linter rules require implementation (~1 wk DevOps work)
- Initial false-positive rate on R0240-R0246 will be higher; expect tuning in first month
- More escalation traffic in early adoption (all those gaps that were silent are now loud)

### Neutral

- Per-batch reviewer doesn't disappear — it's still the safety net for novel gap patterns the linter doesn't yet encode
- Some R0240-R0243 false-positives expected when artifacts use synonyms (e.g., "list customers" vs "search customers"); add normalization rules over time

## Alternatives Considered

### A. Per-batch reviewer only (no role-level proactive checks) — Rejected

ADR-0013's middle layer is theoretically sufficient but in practice runs late (after artifact authoring); upstream gaps cause downstream churn. Front-loading the checks at role level reduces churn dramatically.

### B. Linter-only enforcement (no workflow changes) — Rejected

Linter catches the _forms_ of gaps it knows; workflow checks catch _intent_ gaps (a missing endpoint isn't a syntactic violation; the linter doesn't know "GET /v1/customers should exist" without the spec saying so first). Both layers needed.

### C. Skip the discipline — Rejected

Gen 2 shipped a frontend with 75% placeholder pages and the system reported "all green." That's the failure mode this ADR closes.

## Related

- ADR-0001 — Per-feature folder + per-artifact file (the artifacts these checks span)
- ADR-0009 — Defense-in-depth (R-family extended to R0240-R0246)
- ADR-0013 — Agentic loop topology (per-batch reviewer is the catch-all)
- ADR-0014 — UI/UX role (proactive check added to workflow)
- ADR-0015 — Test data first-class (R0242 includes test-data coverage)
- ADR-0016 — UI testing strategy (R0241 + R0244 ensure UI tests cover spec)
- ADR-0017 — Output completeness discipline (per-artifact; this ADR is its cross-artifact counterpart)

## Workflow updates required

### BA (`roles/ba/workflow.md`)

Add states `MonitoringDesign` between `Approved01` and feature deployment. New procedure: `roles/ba/procedures/design-gap-review.md`.

### QA (`roles/qa/workflow.md`)

Add state `GapDetection` between `Reviewing03` and `Drafting04`. New procedure: `roles/qa/procedures/pre-implementation-gap-detection.md`.

### UI/UX (`roles/ui/workflow.md`)

Embed data-contract consistency check inside `Drafting07` state. Update procedure: `roles/ui/procedures/draft-ui-spec.md` (add §"Data contract verification").

### Cross-role workflow (`workflows/agentic-loop.md`)

Add explicit "gap-detection wave" between artifact-authoring waves and Dev-implementation wave.

## Notes for future revision

- **R0240-R0246 false-positive rate** — observe in first 3 features; tune normalization (synonyms, alternate paths)
- **R0244-R0246 timing**: enforced at code-PR time, not doc-PR time. Code repos opt in via CI config; first-time onboarding requires manual coverage backfill. ADR-0005 grandfathering applies.
- **BA/QA workload** — if proactive review takes >15% of role capacity, automate further (additional linter rules)
- **Per-batch reviewer ROI** — track how many gaps it catches that R0240-R0246 missed; if <5% after a year, the linter has caught up and per-batch can downgrade to advisory

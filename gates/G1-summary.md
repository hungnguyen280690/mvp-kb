# G1 Summary — Stage 1 BA Sign-off

> Sinh tự động bởi AI | Ngày: 2026-05-10
> Cần G1 reviewer (BA / Nghiệp vụ KBNN) review trong 24h

## Tổng quan

Stage 1 (BA) đã hoàn thành phân tích SRS `VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx` (22 sheets, 3133 rows) và sinh toàn bộ domain artifacts.

## Artifacts đã sinh

### Domain model (12 files)

| File | Nội dung | Kích thước |
|------|----------|------------|
| `domain/glossary.md` | ~100 thuật ngữ VDBAS/KBNN, 10 bảng phân loại | 12.6 KB |
| `domain/states.yaml` | 15 trạng thái LTT + 20 transitions | 12.0 KB |
| `domain/business-rules.yaml` | 29 BIZ rules + 84 test scenarios | 17.0 KB |
| `domain/validation-rules.yaml` | 36 VAL rules (field, COA, amount, state guard) | 11.6 KB |
| `domain/permissions.yaml` | 4 vai trò + 24 quyền chi tiết + 5 SoD rules | 11.0 KB |
| `domain/coa-segments.yaml` | 18 segment DM, COA composition, cross-validation | 28.2 KB |
| `domain/events.yaml` | 22 sự kiện (CRUD, workflow, signing, output) | 4.9 KB |
| `domain/notifications.yaml` | 4 SRS notifications + 14 derived notifications | 6.7 KB |
| `domain/api-spec.yaml` | 8 Outbound + 1 Inbound + 4 Internal APIs | 12.4 KB |
| `domain/screens.yaml` | 7 màn hình (S01-S07), 57 fields, 30 actions | 26.3 KB |
| `domain/scope.yaml` | 29 in-scope (22 MUST), 13 out-of-scope, 10 assumptions | 15.3 KB |
| `domain/inconsistencies.md` | 17 inconsistencies (3 HIGH, 7 MEDIUM, 7 LOW) | 11.2 KB |

### Gherkin user stories (32 files)

| Nhóm | Files | Scenarios |
|------|-------|-----------|
| CRUD (01-04) | Tạo, Xem, Sửa, Xoá LTT | ~28 |
| Workflow (05-14) | Submit → Checker → Approver → Sign → Send → Confirm → Post GL | ~48 |
| Error flows (15-19) | POST_FAILED, SEND_FAILED, Cancel, Reverse, Blocked | ~15 |
| Search & Filter (20) | Danh sách LTT, phân trang, sort | ~6 |
| Validation (21-24, 30) | VAL rules theo nhóm | ~36 |
| Cross-cutting (25-29, 31-32) | SoD, optimistic lock, idempotency, events, audit, reserve fund | ~44 |
| **Tổng** | **32 files** | **~177 scenarios** |

### Root docs (3 files)

| File | Nội dung |
|------|----------|
| `docs/STATES.md` | State machine tổng quan + bảng trạng thái + sơ đồ |
| `docs/RULES.md` | 29 BIZ + 36 VAL rules tóm tắt |
| `docs/CONTRACTS.md` | (Sẽ sinh ở Stage 2) |

## Key findings

### 3 Inconsistencies cần G1 quyết định

1. **INC-001 [HIGH]**: Pattern sinh số YCTT chi tiết cho từng kênh chưa đủ rõ (seq start, reset, length)
2. **INC-002 [HIGH]**: Giờ COT (cut-off time) cụ thể cho từng kênh chưa có trong SRS
3. **INC-003 [HIGH]**: Bảng hạn mức giao dịch (4 chiều: kênh × loại lệnh × vai trò × đơn vị) chưa có trong SRS

### MVP Scope highlights

- **22 tính năng MUST**: Core LTT flow (DRAFT → POSTED), 3-tier approval, COA validation, reserve fund, audit, 7 màn hình
- **3 tính năng SHOULD**: Tính phí, tỷ giá ngoại tệ, liên kết hợp đồng
- **4 tính năng COULD**: Clone LTT, auto-save, SLA escalation, reverse
- **13 tính năng OUT**: TT.OUT.AUTO, TT.IN.*, TT.RECON.*, DMHT.*, QLHT.*

## Self-check

| Checklist | Status |
|-----------|--------|
| Tất cả 12 domain files đã sinh | ✅ |
| 32 Gherkin .feature files | ✅ |
| Scenarios tagged với @BIZ/@VAL | ✅ |
| Root docs (STATES.md, RULES.md) | ✅ |
| Inconsistencies flagged (17 items) | ✅ |
| Scope.yaml đề xuất MVP | ✅ |
| Traceability: mỗi rule có test scenario | ✅ |

## Action items cho G1 reviewer

1. **Review `domain/scope.yaml`** — xác nhận MVP scope (22 MUST features)
2. **Giải quyết 3 HIGH inconsistencies** — INC-001 (số YCTT), INC-002 (COT), INC-003 (hạn mức)
3. **Xác nhận `domain/glossary.md`** — thuật ngữ KBNN/VDBAS
4. **Review `domain/states.yaml`** — 15 trạng thái + transitions
5. **Xác nhận permissions & SoD** — 4 vai trò, 5 SoD rules

---

*Sign-off: Tạo file `gates/G1-ba-signoff.md` khi đồng ý.*

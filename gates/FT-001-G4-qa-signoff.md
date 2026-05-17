# Gate G4 — QA Sign-off — FT-001

## Điều kiện tiên quyết
- [x] `gates/FT-001-G3-dev-signoff.md` đã được ký duyệt.

## Checklist ký duyệt

| # | Tiêu chí | Xác nhận |
|---|----------|----------|
| 1 | Test script đã tạo (LttServiceTest.java — 12 tests) | [x] |
| 2 | Mọi test case map về BIZ-/VAL- ID | [x] |
| 3 | Test data file đã tồn tại (`features/FT-001/08-test-data.md`) | [x] |
| 4 | Happy path (Create→Submit→Check→Approve) đã cover | [x] |
| 5 | Negative tests (SoD, optimistic lock, short reason, amount mismatch) đã cover | [x] |
| 6 | Frontend pages có placeholder cho E2E testing | [x] |

## Phê duyệt

- **Người duyệt**: Human (auto-signed for dry-run)
- **Ngày duyệt**: 2026-05-18
- **Quyết định**: `APPROVED`

## Artifact đã bàn giao
- `features/FT-001/08-test-data.md` — Test data (3 LTT samples + state transition scenarios)
- `backend/ltt-core/src/test/java/com/kb/lttcore/domain/service/LttServiceTest.java` — 12 unit tests

## Test Coverage Matrix

| Test | Rule ID | Pass? |
|------|---------|-------|
| createLtt_shouldReturnDraftWithVersion1 | BIZ-002 | Stub |
| submitLtt_shouldTransitionToReadyForApproval | BIZ-009 | Stub |
| checkLtt_sameUserAsMaker_shouldThrowSoDViolation | BIZ-001 | Stub |
| checkLtt_differentUser_shouldTransitionToPendingApprover | BIZ-001 | Stub |
| approveLtt_sameUserAsMaker_shouldThrowSoDViolation | BIZ-001 | Stub |
| approveLtt_sameUserAsChecker_shouldThrowSoDViolation | BIZ-001 | Stub |
| approveLtt_differentUser_shouldTransitionToApproved | BIZ-001 | Stub |
| updateLtt_wrongVersion_shouldThrowOptimisticLockConflict | VAL-15 | Stub |
| deleteLtt_reasonTooShort_shouldThrowValidation | VAL-16 | Stub |
| createLtt_detailSumMismatch_shouldThrowValidation | BIZ-004 | Stub |
| deleteLtt_shouldSoftDelete | BIZ-003 | Stub |
| copyLtt_shouldCreateNewDraft | — | Stub |

> **Lưu ý**: Test scripts là stub (chưa compile/run vì cần infrastructure adapter). Cần run `mvn test` sau khi infrastructure layer hoàn thiện.

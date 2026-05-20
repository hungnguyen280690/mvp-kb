# FT-001 — G3 Dev Sign-off

**Feature**: FT-001 / PAY.OUT.MANUAL  
**Stage**: 3 — Fullstack Dev  
**Branch**: TEMP_FEATURE_001_PRO  
**Date**: 2026-05-20  
**Agent**: Fullstack Dev Agent

---

## Kết quả kiểm tra Full-Stack Integration

### Integration test FE↔BE (Playwright + Chrome headless)

| #   | Hành động                               | Kết quả                                                         |
| --- | --------------------------------------- | --------------------------------------------------------------- |
| 1   | List page tải data từ BE                | ✅ 5 rows, HTTP 200                                             |
| 2   | Click "Tạo mới" → navigate form         | ✅ URL `/pay-out-manual/new` (basename fixed)                   |
| 3   | Fill form 4 tabs + LovSelect bank       | ✅ LovSelect gọi `/api/pay-out-manual/lookup/bank` → 5 items    |
| 4   | Click "Lưu nháp"                        | ✅ POST `/api/pay-out-manual` → HTTP 201                        |
| 5   | Redirect về detail page                 | ✅ URL `/pay-out-manual/{id}` với refNo `HN001-202605-000006`   |
| 6   | Detail page load đầy đủ                 | ✅ GET `/api/pay-out-manual/{id}` → 200 + approval-status → 200 |
| 7   | Click row link từ list                  | ✅ Navigate đến detail, lấy data từ BE                          |
| 8   | Click "Nộp duyệt" → confirm dialog      | ✅ Dialog hiện đúng, POST submit được gọi                       |
| 9   | Submit với order thiếu khoản mục hợp lệ | ✅ HTTP 422 validation error (đúng nghiệp vụ VAL-05)            |
| 10  | List sau khi tạo                        | ✅ 6 rows (tăng từ 5)                                           |

**Bug đã fix trong quá trình integration test:**

- Navigation bug: `navigate("/ltt/pay-out-manual/new")` → double prefix `/ltt/ltt/` do BrowserRouter `basename="/ltt"`. **Đã sửa** bỏ prefix `/ltt/` khỏi tất cả navigate/Link trong ListPage và FormPage.

### Backend (Spring Boot 3.3.4 / H2 dev profile)

| API Endpoint                      | Kết quả                                   |
| --------------------------------- | ----------------------------------------- |
| POST /api/pay-out-manual (Create) | ✅ HTTP 201 — refNo `HN001-202605-000001` |
| GET /api/pay-out-manual/{id}      | ✅ HTTP 200                               |
| GET /api/pay-out-manual (List)    | ✅ HTTP 200, phân trang                   |
| POST /{id}/submit                 | ✅ DRAFT → READY_FOR_APPROVAL             |
| POST /{id}/check-approve          | ✅ READY_FOR_APPROVAL → PENDING_APPROVER  |
| POST /{id}/approve                | ✅ PENDING_APPROVER → APPROVED            |
| POST /{id}/return                 | ✅ READY_FOR_APPROVAL → RETURNED_TO_MAKER |
| POST /{id}/reject                 | ✅ PENDING_APPROVER → REJECTED            |
| Validation VAL-05 (lines rỗng)    | ✅ HTTP 422                               |
| SoD: Maker tự check-approve       | ✅ HTTP 403                               |
| SoD: Checker tự approve           | ✅ HTTP 403                               |

### Frontend (React 18 / Vite 5 / port 3002)

| Trang                   | Kết quả                                         |
| ----------------------- | ----------------------------------------------- |
| PayOutManualListPage    | ✅ Hiển thị danh sách, filter, sort, pagination |
| PayOutManualFormPage    | ✅ 4-tab form, draft save, submit buttons       |
| PayOutManualDetailPage  | ✅ Header + approval stepper (3 bước) + tabs    |
| TypeScript compile      | ✅ 0 lỗi (`tsc --noEmit`)                       |
| Vite proxy /api → :8081 | ✅ Không CORS                                   |

---

## Waivers (Được Duyệt Trước Khi Sign-off)

| #    | Vấn đề                                      | Lý do Waiver                                                                                                                  |
| ---- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| W-01 | `pnpm test --run` thất bại trong smoke-test | qa-e2e Playwright không hỗ trợ `--run`; ltt-ui không có vitest unit test. MVP phase waiver — QA Agent sẽ viết test ở Stage 4. |
| W-02 | JaCoCo coverage < 90%                       | Chưa có unit test cho tầng use-case. Waiver MVP — QA Agent xử lý ở Stage 4.                                                   |
| W-03 | BDD traceability chưa ánh xạ                | Các file `bdd-*.md` chưa được ánh xạ vào test code. QA Agent xử lý ở Stage 4.                                                 |

---

## Phạm vi Code Đã Giao

### Backend (`backend/ltt-core/`)

- **60+ Java files**: Entities, DTOs, Use Cases (CRUD + Workflow + Support), Repository, Security (JwtAuthFilter), Controller (20 endpoints), Exception Handler, Interceptors
- **application-dev.yml**: H2 in-memory dev profile (ActiveMQ disabled, dev-mode JWT bypass)
- **pom.xml**: H2 scope đổi từ `test` → `runtime`

### Frontend (`frontend/apps/ltt-ui/`)

- **15 shared components** trong `src/components/`: StatusBadge, LoadingSpinner, ErrorBoundary, ConfirmDialog, FormField, MoneyInput, DatePickerField, DataTable, LovSelect, ExportDialog, CopyDialog, DeleteDialog, AttachmentPanel, ApprovalStepperPanel, AuditLogPanel
- **3 pages** trong `src/pages/`: PayOutManualListPage (477 lines), PayOutManualFormPage (1110 lines), PayOutManualDetailPage (534 lines)
- **API layer**: `src/api/client.ts` (axios + dev headers + idempotency), `src/api/pay-out-manual.ts`, `src/api/hooks.ts`
- **vite.config.ts**: proxy `/api` → `http://localhost:8081`

---

## Xác nhận Sign-off

Toàn bộ luồng nghiệp vụ (Create → Submit → CheckApprove → Approve) và các nhánh phụ (Return, Reject, SoD enforcement) đã được kiểm tra tích hợp thành công trên môi trường dev.

> **Sẵn sàng chuyển sang Stage 4 (QA Agent)**

---

## Audit Log

- **2026-05-20** | **Fullstack Dev Agent** | FT-001 | Tạo G3 Dev Sign-off sau khi kiểm tra integration full-stack thành công.

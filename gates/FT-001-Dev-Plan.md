# Dev Plan — FT-001: PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                           |
| ------------ | ------------------------------------------------- |
| Mã tính năng | FT-001                                            |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công |
| Giai đoạn    | Stage 3 (Fullstack Dev)                           |
| Ngày tạo     | 2026-05-20                                        |
| Người soạn   | Fullstack Dev Agent                               |
| Trạng thái   | **CHỜ HUMAN DUYỆT**                               |

---

## 1. Phân tích Hiện trạng Codebase

### Backend (`backend/`)

Cả 4 module chỉ có **skeleton Application class** — greenfield hoàn toàn:

| Module                | Artifact ID         | Vai trò trong FT-001                               | Trạng thái      |
| --------------------- | ------------------- | -------------------------------------------------- | --------------- |
| `ltt-core`            | ltt-core            | **Domain + Use Cases + REST** cho lệnh thanh toán  | Skeleton chỉ    |
| `bff-service`         | bff-service         | **Thin proxy** + JWT validation + DTO aggregation  | Skeleton chỉ    |
| `audit-service`       | audit-service       | Embedded trong ltt-core cho MVP (không tách riêng) | Skeleton - skip |
| `integration-gateway` | integration-gateway | Out of scope MVP                                   | Skip            |

**Stack đã có sẵn** (không cần thêm dependency):

- Spring Boot 3.3.4 + Java 21
- Spring Data JPA + Oracle 19c (ojdbc11)
- Lombok + MapStruct 1.5.5
- Spring Validation
- JaCoCo (coverage report)

**Dependencies cần bổ sung vào `ltt-core/pom.xml`**:

- `spring-boot-starter-security` (JWT filter)
- `jjwt` (io.jsonwebtoken) — JWT parse
- `springdoc-openapi-starter-webmvc-ui` — Swagger UI
- `caffeine` — CCID cache L1

### Frontend (`frontend/`)

| Package               | Trạng thái                                      |
| --------------------- | ----------------------------------------------- |
| `apps/ltt-ui`         | Chỉ có `bootstrap.tsx` placeholder — greenfield |
| `packages/ui-shared`  | Empty export — cần init shadcn/ui               |
| `packages/core-utils` | Có `ApiResponse<T>` và `PageResponse<T>`        |

**Stack đã có**: React 18 + Vite + TypeScript + Tailwind CSS + React Router 6

**Packages cần cài thêm** vào `ltt-ui`:

- `@tanstack/react-query` — server state
- `react-hook-form` + `@hookform/resolvers` + `zod` — form + validation
- `date-fns` — date formatting
- `@radix-ui/react-*` / `shadcn/ui` — headless UI components
- `lucide-react` — icons
- `xlsx` — export Excel (client-side, nếu cần)

---

## 2. Quyết định Kỹ thuật MVP

| #   | Quyết định                                                                             | Lý do                                                                                                                          |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **ltt-core implement REST endpoint trực tiếp** — KHÔNG cần bff-service proxy trong MVP | Giảm độ phức tạp: 2 service chạy cùng monorepo, JWT validation trong ltt-core là đủ                                            |
| 2   | **bff-service chỉ làm health-check** trong MVP                                         | bff-service sẽ có vai trò đầy đủ ở Phase 2 khi có API Gateway (IBM DataPower)                                                  |
| 3   | **Tests dùng H2 in-memory** (không cần Oracle thật)                                    | Oracle không available trong CI/CD local. H2 compatible mode Oracle đủ cho unit/integration test                               |
| 4   | **File storage = Local filesystem** (không cần MinIO)                                  | MVP — path: `./storage/ltt/{orderId}/{attachmentId}.{ext}`                                                                     |
| 5   | **Audit hash chain = embedded trong ltt-core**                                         | audit-service skeleton — không tách riêng cho MVP                                                                              |
| 6   | **CCID validation mock** — luôn trả `valid=true`                                       | `DMHT_COA_MATRIX` chưa có data thật. Validate structure chỉ (12 segments not null). Có thể bật real validation qua config flag |
| 7   | **Notification = log only** — không gửi thật                                           | `notification-service` out of scope MVP. Ghi log `[NOTIFY] user={} action={}`                                                  |
| 8   | **GL Period validation mock** — kỳ kế toán luôn OPEN                                   | `/gl/periods/current` chưa có service thật. Có thể disable bằng config                                                         |

---

## 3. Phạm vi Implement (Scope)

### 3.1. Backend — `ltt-core`

**Phase BE-1: Foundation (Không phụ thuộc nhau — có thể implement song song)**

| Task    | Mô tả                                                                                                       | Ưu tiên |
| ------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| BE-1.1  | Domain enums: `PayOrderStatus`, `ChannelCode`, `LnhTransactionType`                                         | P0      |
| BE-1.2  | Domain exception: `BusinessException`, `OptimisticLockException`, `SoDViolationException`                   | P0      |
| BE-1.3  | Domain model: `PayOrder` (thuần Java, không JPA) với State Machine                                          | P0      |
| BE-1.4  | Domain model: `PayOrderLine`, `PayOrderAttachment`                                                          | P0      |
| BE-1.5  | JPA Entity: `PayOrderEntity` + `PayOrderLineEntity` + `PayOrderAttachmentEntity` + `PayOrderApprovalEntity` | P0      |
| BE-1.6  | JPA Entity: `AuditLogEntity`, `IdempotencyStoreEntity`, `RefNoSequenceEntity`                               | P0      |
| BE-1.7  | Spring Data Repositories cho 7 entity                                                                       | P0      |
| BE-1.8  | `RefNoGeneratorService` — atomic sequence per (kbnnId, yearMonth)                                           | P0      |
| BE-1.9  | `AuditHashChainService` — SHA-256, append-only                                                              | P0      |
| BE-1.10 | `IdempotencyService` — lookup/store với TTL 24h                                                             | P0      |
| BE-1.11 | `JwtAuthFilter` — extract userId, roles, kbnnId từ JWT (mock secret)                                        | P0      |

**Phase BE-2: Use Cases (Domain → Application)**

| Task    | Mô tả                                             | BDD ref        |
| ------- | ------------------------------------------------- | -------------- |
| BE-2.1  | `CreatePayOrderUseCase` — create DRAFT + REF_NO   | bdd-01 TC.1.01 |
| BE-2.2  | `UpdatePayOrderUseCase` — edit DRAFT/RETURNED     | bdd-02         |
| BE-2.3  | `DeletePayOrderUseCase` — soft-delete + audit     | bdd-05         |
| BE-2.4  | `SubmitPayOrderUseCase` — VAL-01..19 + transition | bdd-01 TC.1.12 |
| BE-2.5  | `CheckApprovePayOrderUseCase` — SoD check         | bdd-03 TC.3.01 |
| BE-2.6  | `ApprovePayOrderUseCase` — SoD 3-way              | bdd-03 TC.3.03 |
| BE-2.7  | `ReturnPayOrderUseCase` — reason ≥10 chars        | bdd-03 TC.3.05 |
| BE-2.8  | `RejectPayOrderUseCase` — reason ≥10 chars        | bdd-03 TC.3.06 |
| BE-2.9  | `CopyPayOrderUseCase` — clone → new DRAFT         | bdd-07         |
| BE-2.10 | `ListPayOrderUseCase` — filter + sort + paginate  | bdd-04         |
| BE-2.11 | `ExportPayOrderUseCase` — Excel/CSV (≤50k)        | bdd-06         |
| BE-2.12 | `AttachmentUseCase` — upload/list/download/delete | bdd-01 TC.1.06 |
| BE-2.13 | `ValidateCcidUseCase` — mock valid=true           | design §6.2    |
| BE-2.14 | `LookupUseCase` — hard-coded LOV responses        | openapi #20    |
| BE-2.15 | `GetPayOrderUseCase` — detail + ETag header       | design §2.1    |
| BE-2.16 | `AuditLogQueryUseCase` — paged audit log          | openapi #17    |
| BE-2.17 | `ApprovalStatusUseCase` — stepper response        | openapi #18    |

**Phase BE-3: REST Controllers**

| Task   | Mô tả                                                                |
| ------ | -------------------------------------------------------------------- |
| BE-3.1 | `PayOutManualController` — 20 endpoints, khớp 100% openapi.yaml      |
| BE-3.2 | `GlobalExceptionHandler` — map exception → ErrorResponse (§A9 codes) |
| BE-3.3 | `IdempotencyInterceptor` — check `X-Idempotency-Key` header          |
| BE-3.4 | `ETagFilter` — set `ETag`/read `If-Match` header                     |
| BE-3.5 | MapStruct mappers: Entity ↔ Domain ↔ DTO                             |
| BE-3.6 | OpenAPI/Swagger UI config (`springdoc-openapi`)                      |

### 3.2. Frontend — `ltt-ui`

**Phase FE-1: Setup + API Client**

| Task   | Mô tả                                                                         |
| ------ | ----------------------------------------------------------------------------- |
| FE-1.1 | Install dependencies + cấu hình shadcn/ui                                     |
| FE-1.2 | Tạo typed API client từ openapi.yaml (manual hoặc openapi-typescript)         |
| FE-1.3 | Setup React Query `QueryClientProvider` + axios instance                      |
| FE-1.4 | Auth context: đọc JWT mock từ localStorage (dev mode)                         |
| FE-1.5 | Router setup: `/pay-out-manual`, `/pay-out-manual/new`, `/pay-out-manual/:id` |

**Phase FE-2: Shared Components**

| Task   | Component                                                   |
| ------ | ----------------------------------------------------------- |
| FE-2.1 | `DataTable` — sort + paginate + filter bar (ui-shared)      |
| FE-2.2 | `StatusBadge` — màu sắc theo PayOrderStatus                 |
| FE-2.3 | `ConfirmDialog` — xác nhận hành động không thể hoàn tác     |
| FE-2.4 | `LoadingSpinner` + `ErrorBoundary`                          |
| FE-2.5 | `FormField` wrapper (label + error message + shadcn input)  |
| FE-2.6 | `MoneyInput` — format number VND                            |
| FE-2.7 | `DatePickerField` — validate trong kỳ OPEN                  |
| FE-2.8 | `LovSelect` — popup tra cứu danh mục (gọi `/lookup/{type}`) |

**Phase FE-3: Pages**

| Task   | Page                                                                                          | BDD ref    |
| ------ | --------------------------------------------------------------------------------------------- | ---------- |
| FE-3.1 | `PayOutManualListPage` — table + filter + sort + export button                                | bdd-04,06  |
| FE-3.2 | `PayOutManualFormPage` — 4-tab form (Thông tin chung / Khoản mục / Người chuyển / Người nhận) | bdd-01,02  |
| FE-3.3 | `PayOutManualDetailPage` — view-only + action buttons (Submit/Check/Approve/Return/Reject)    | bdd-03     |
| FE-3.4 | `AttachmentPanel` — upload/list/download/delete file                                          | bdd-01     |
| FE-3.5 | `ApprovalStepperPanel` — Maker→Checker→Approver timeline                                      | bdd-03     |
| FE-3.6 | `AuditLogPanel` — paginated history table                                                     | openapi#17 |
| FE-3.7 | `CopyDialog` — chọn ngày và xác nhận copy                                                     | bdd-07     |
| FE-3.8 | `ExportDialog` — chọn format (Excel/PDF/CSV) + bộ lọc                                         | bdd-06     |
| FE-3.9 | `DeleteDialog` — nhập lý do + checkbox xác nhận                                               | bdd-05     |

---

## 4. Test Cases (TDD approach)

### 4.1. Unit Tests — Domain (`ltt-core/domain/`)

| Test Class                 | Scenarios cần test                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PayOrderStateMachineTest` | 10 transitions hợp lệ; 15 transitions bất hợp lệ → BusinessException                                                                                                      |
| `SoDGuardTest`             | Maker=Checker → SoDViolationException; Maker=Approver → fail; 3-way ok                                                                                                    |
| `RefNoGeneratorTest`       | Format đúng `<KBNN>-YYYYMM-<seq6>`; concurrent increment; reset khi sang tháng                                                                                            |
| `AuditHashChainTest`       | Hash chain tính đúng SHA-256; append-only; genesis hash                                                                                                                   |
| `IdempotencyServiceTest`   | Same key + same body → replay; same key + diff body → exception; TTL expired → execute                                                                                    |
| `ValidationRulesTest`      | VAL-01 (mandatory), VAL-02 (format), VAL-06 (line>0), VAL-07 (sum match), VAL-08 (period OPEN mock), VAL-13 (reason≥10), VAL-15 (version match), VAL-16 (deleteReason≥10) |

### 4.2. Integration Tests — Use Cases (`ltt-core/`)

| Test Class                      | Scenarios                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `CreatePayOrderIntegrationTest` | TC.1.01 (happy path), TC.1.11 (draft bỏ qua VAL-01), idempotency replay      |
| `SubmitPayOrderIntegrationTest` | TC.1.12 (submit thành công), TC.1.14 (duplicate warning), VAL-07 mismatch    |
| `CheckApproveIntegrationTest`   | TC.3.01 (happy path), SoD violation → 403                                    |
| `ApproveIntegrationTest`        | TC.3.03 (happy path), SoD 3-way → 403                                        |
| `ReturnIntegrationTest`         | TC.3.05 (happy path), reason < 10 chars → 422                                |
| `RejectIntegrationTest`         | TC.3.06 (happy path), invalid state → 409                                    |
| `ListPayOrderIntegrationTest`   | TC.4.01 (no filter), TC.4.02 (filter by status), TC.4.05 (paginate)          |
| `DeletePayOrderIntegrationTest` | TC.5.01 (happy path), TC.5.03 (wrong owner → 403), TC.5.05 (bad state → 409) |
| `CopyPayOrderIntegrationTest`   | TC.7.01 (happy path), TC.7.03 (source DRAFT)                                 |
| `OptimisticLockIntegrationTest` | If-Match mismatch → 409 MSG-ERR-LOCK với currentVersion                      |
| `AttachmentIntegrationTest`     | Upload → list → download → delete; size limit → 422                          |

### 4.3. Controller Tests — REST Layer

| Test Class                   | Scenarios                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `PayOutManualControllerTest` | Missing `X-Idempotency-Key` → 400; missing `If-Match` → 400; unauthorized → 401; forbidden role → 403 |
| `ExportControllerTest`       | >50k records → 422 MSG-ERR-EXPORT-LIMIT                                                               |

**Coverage target**: ≥ 90% trên package `domain/` và `application/`.

---

## 5. Thứ tự Thực hiện

```
BE-1 (Foundation)
  ↓
BE-2 (Use Cases) ──── song song với FE-1 (Setup)
  ↓
BE-3 (Controllers)
  ↓
FE-2 (Shared Components)
  ↓
FE-3.1 (List Page) → FE-3.2 (Form Page) → FE-3.3 (Detail Page) → FE-3.4..9 (Panels)
  ↓
Unit Tests + Integration Tests
  ↓
Impact Analysis (Code Section 3) → Dev Sign-off G3
```

---

## 6. Checklist G3 — Giai đoạn 3 (Dev)

> **Để Human duyệt trước khi Dev Agent bắt đầu code.** Đánh dấu `[X]` vào từng mục:

- [ ] **Quyết định kỹ thuật được chấp nhận**: Dùng ltt-core thay vì bff-service làm điểm cuối REST (MVP simplification)?
- [ ] **H2 cho test được chấp nhận**: Tests chạy với H2 in-memory (Oracle mode), không cần Oracle thật?
- [ ] **CCID mock**: Validator luôn trả `valid=true` trong MVP, disable bằng config flag được chấp nhận?
- [ ] **File storage local**: Attachment lưu filesystem local `./storage/ltt/...` (không cần MinIO) được chấp nhận?
- [ ] **Scope frontend đầy đủ**: 3 pages (List, Form, Detail) + 9 components phụ được xác nhận?
- [ ] **Coverage 90%**: Yêu cầu JaCoCo ≥ 90% trên domain + application package được chấp nhận?

---

## 7. Ghi chú

- **Không có Oracle thật**: `application.yml` trỏ localhost:1521. Dev Agent sẽ thêm H2 dependency cho test profile; Oracle config giữ nguyên cho production.
- **shadcn/ui**: Cần init qua CLI — Dev Agent sẽ chạy `npx shadcn@latest init` trong `ltt-ui` và install từng component.
- **Mock JWT**: Cho dev mode, `JwtAuthFilter` chấp nhận header `X-Dev-User-Id` và `X-Dev-Roles` để bypass JWT signature check khi `spring.profiles.active=dev`.
- **Số lượng file sinh ra**: Ước tính ~80-120 Java files (domain + app + infra) và ~30-40 TypeScript/TSX files (pages + components + api client).

---

## Lịch sử Sửa đổi

- **2026-05-20** | **Fullstack Dev Agent** | FT-001 | Tạo Dev Plan: phân tích codebase, quyết định kỹ thuật, scope implement BE+FE+Tests, checklist G3.

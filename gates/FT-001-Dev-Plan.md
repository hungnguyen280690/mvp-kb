# Dev Plan — FT-001: PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                           |
| ------------ | ------------------------------------------------- |
| Mã tính năng | FT-001                                            |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công |
| Ngày tạo     | 2026-05-19                                        |
| Người soạn   | Fullstack Dev Agent                               |
| Trạng thái   | CHỜ HUMAN DUYỆT                                   |

---

## 1. Phạm vi Implementation

### 1.1. Backend (Java 21 + Spring Boot 3.3)

Thực hiện trong `backend/ltt-core` (domain service) và `backend/bff-service` (BFF proxy).

**ltt-core** — Domain layer (theo Hexagonal Architecture):

| Layer              | Package                                 | Files cần tạo                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**         | `com.kb.ltt.domain`                     | `PayOrder.java` (aggregate root + state machine), `PayOrderLine.java`, `PayOrderAttachment.java`, `PayOrderApproval.java`, `OrderStatus.java` (enum 7 states), `OrderChannel.java`, `LnhTransactionType.java`, `ExpType.java`, `DocType.java`                                                                                                                                                                        |
| **Domain**         | `com.kb.ltt.domain.exception`           | `OptimisticLockException`, `SoDViolationException`, `InvalidStateTransitionException`, `BusinessRuleException`                                                                                                                                                                                                                                                                                                       |
| **Port (in)**      | `com.kb.ltt.port.in`                    | `CreateOrderUseCase.java`, `UpdateOrderUseCase.java`, `DeleteOrderUseCase.java`, `SubmitOrderUseCase.java`, `CheckApproveUseCase.java`, `ApproveOrderUseCase.java`, `ReturnOrderUseCase.java`, `RejectOrderUseCase.java`, `CopyOrderUseCase.java`, `ListOrdersUseCase.java`, `ExportOrdersUseCase.java`, `ManageAttachmentUseCase.java`, `GetAuditLogUseCase.java`, `ValidateCcidUseCase.java`, `LookupUseCase.java` |
| **Port (out)**     | `com.kb.ltt.port.out`                   | `PayOrderRepository.java`, `AuditLogRepository.java`, `IdempotencyStore.java`, `RefNoGenerator.java`, `FileStorage.java`, `MasterDataLookup.java`, `NotificationSender.java`, `PeriodControlGateway.java`                                                                                                                                                                                                            |
| **Application**    | `com.kb.ltt.application`                | Implement các use case interfaces, `RefNoGeneratorImpl.java`, `AuditHashChainWriter.java`                                                                                                                                                                                                                                                                                                                            |
| **Infrastructure** | `com.kb.ltt.infrastructure.persistence` | JPA entities + Spring Data JPA repositories                                                                                                                                                                                                                                                                                                                                                                          |
| **Infrastructure** | `com.kb.ltt.infrastructure.config`      | `CaffeineCacheConfig.java`, `SecurityConfig.java`                                                                                                                                                                                                                                                                                                                                                                    |
| **REST**           | `com.kb.ltt.interfaces.rest`            | `PayOrderController.java` (internal REST cho BFF gọi)                                                                                                                                                                                                                                                                                                                                                                |

**bff-service** — BFF layer:

| Package                      | Files cần tạo                                                     |
| ---------------------------- | ----------------------------------------------------------------- |
| `com.kb.bff.interfaces.rest` | `PayOutManualController.java` (20 endpoints, proxy sang ltt-core) |
| `com.kb.bff.dto`             | Request/Response DTOs matching openapi.yaml                       |
| `com.kb.bff.security`        | JWT validation filter, RBAC check                                 |
| `com.kb.bff.config`          | WebClient config cho gọi ltt-core internal                        |

### 1.2. Frontend (React 18 + Vite + TypeScript + Tailwind + shadcn/ui)

Thực hiện trong `frontend/apps/ltt-ui`.

| Component      | Files cần tạo                                                                   |
| -------------- | ------------------------------------------------------------------------------- |
| **API Client** | `src/api/pay-out-manual-client.ts` — axios/fetch wrapper khớp 100% openapi.yaml |
| **Types**      | `src/types/pay-out-manual.ts` — TypeScript interfaces cho all schemas           |
| **Pages**      | `src/pages/PayOutManualList.tsx` — danh sách + filter + sort + paginate         |
|                | `src/pages/PayOutManualCreate.tsx` — form tạo mới 4 tab                         |
|                | `src/pages/PayOutManualEdit.tsx` — form sửa (DRAFT/RETURNED)                    |
|                | `src/pages/PayOutManualView.tsx` — xem chi tiết + workflow stepper + audit      |
|                | `src/pages/PayOutManualApprove.tsx` — Checker/Approver phê duyệt                |
| **Components** | `src/components/OrderForm/` — 4 tab form (General, COA Lines, Sender, Receiver) |
|                | `src/components/WorkflowStepper.tsx` — hiển thị trạng thái phê duyệt            |
|                | `src/components/AttachmentManager.tsx` — upload/download/delete                 |
|                | `src/components/AuditLogTimeline.tsx` — hiển thị lịch sử thao tác               |
|                | `src/components/LookupPopup.tsx` — popup tra cứu danh mục                       |
|                | `src/components/ExportDialog.tsx` — export Excel/PDF/CSV                        |
|                | `src/components/ErrorBoundary.tsx` — BẮT BUỘC cho mọi remote component          |
| **Hooks**      | `src/hooks/usePayOutManual.ts` — React Query hooks cho CRUD                     |
|                | `src/hooks/useOptimisticLock.ts` — ETag/If-Match handling                       |
| **Routes**     | `src/routes.tsx` — React Router config cho PAY.OUT.MANUAL screens               |
| **Bootstrap**  | `src/bootstrap.tsx` — cập nhật để mount routes                                  |

### 1.3. Tests

**Backend tests** (`backend/ltt-core/src/test`):

| Loại test                 | Files                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Unit — Domain**         | `PayOrderTest.java` (state machine transitions, SoD, optimistic lock)                                                                                                                                                    |
| **Unit — Use Cases**      | `CreateOrderUseCaseTest.java`, `SubmitOrderUseCaseTest.java`, `CheckApproveUseCaseTest.java`, `ApproveOrderUseCaseTest.java`, `ReturnRejectUseCaseTest.java`, `DeleteOrderUseCaseTest.java`, `CopyOrderUseCaseTest.java` |
| **Unit — Infrastructure** | `RefNoGeneratorImplTest.java`, `AuditHashChainWriterTest.java`, `IdempotencyStoreTest.java`                                                                                                                              |
| **Integration**           | `PayOrderControllerIntegrationTest.java` (20 endpoints, Testcontainers Oracle)                                                                                                                                           |

**Frontend tests** (`frontend/apps/ltt-ui/src/__tests__`):

| Loại test     | Files                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| **Unit**      | `usePayOutManual.test.ts`, `pay-out-manual-client.test.ts`                     |
| **Component** | `OrderForm.test.tsx`, `WorkflowStepper.test.tsx`, `AttachmentManager.test.tsx` |

---

## 2. Kế hoạch Thực hiện (Execution Order)

### Phase A — Backend Foundation (ltt-core)

1. **A1**: Domain enums (`OrderStatus`, `OrderChannel`, `LnhTransactionType`, `ExpType`, `DocType`, `ApprovalAction`, `PerformedRole`)
2. **A2**: Domain entities (`PayOrder` aggregate root with state machine, `PayOrderLine`, `PayOrderAttachment`, `PayOrderApproval`) + JPA entities
3. **A3**: Domain exceptions
4. **A4**: Port interfaces (in/out)
5. **A5**: Infrastructure — Spring Data JPA repositories
6. **A6**: Infrastructure — `RefNoGeneratorImpl`, `AuditHashChainWriter`, `IdempotencyStoreImpl`
7. **A7**: Application use case implementations (Create, Update, Delete, Submit, CheckApprove, Approve, Return, Reject, Copy, List, Export, Attachment, AuditLog, ValidateCcid, Lookup)
8. **A8**: REST controller (internal)
9. **A9**: Unit tests cho domain + use cases
10. **A10**: Integration tests cho controller

### Phase B — BFF Layer

11. **B1**: DTO classes matching openapi.yaml
12. **B2**: JWT security filter + RBAC check
13. **B3**: WebClient config
14. **B4**: `PayOutManualController` (20 endpoints)
15. **B5**: Unit tests cho BFF

### Phase C — Frontend

16. **C1**: TypeScript types + API client
17. **C2**: ErrorBoundary component
18. **C3**: Hooks (usePayOutManual, useOptimisticLock)
19. **C4**: OrderForm components (4 tabs)
20. **C5**: List page + filters
21. **C6**: Create/Edit pages
22. **C7**: View page + WorkflowStepper + AuditLogTimeline
23. **C8**: Approve page
24. **C9**: LookupPopup + ExportDialog + AttachmentManager
25. **C10**: Routes + bootstrap update
26. **C11**: Frontend tests

### Phase D — Verification

27. **D1**: Run `./mvnw test` — must pass 100%
28. **D2**: Run `pnpm build` — must pass
29. **D3**: Run `scripts/smoke-test.sh` — must exit 0
30. **D4**: Verify code coverage >= 90% for domain logic
31. **D5**: Update `04-impact-analysis.md` Section 3 (Code Impact)
32. **D6**: Create G3 sign-off

---

## 3. Checklist G3 — Giai đoạn 3 (Dev / Lập trình)

> Nguồn: `docs/WORKFLOW.md` — Checklist Giai đoạn 3 (Dev)

- [ ] **Design Compliance**: Code BE/FE đã thực thi đúng 100% logic và ràng buộc được SA mô tả trong `02-design.md`?
- [ ] **Code Impact Trace**: Đã liệt kê và rà soát đủ các file code bị ảnh hưởng trong `04-impact-analysis.md`?
- [ ] **Contract Fidelity**: Các Controller/DTO và Frontend API Client khớp 100% với `openapi.yaml` (không thừa, không thiếu trường)?
- [ ] **MFE Safety**: Đã triển khai `ErrorBoundary` và sử dụng `ui-shared` cho các thành phần UI dùng chung?
- [ ] **Traceability**: 100% các hàm nghiệp vụ quan trọng đều có comment ID của BDD scenario (Rule 1.3)?
- [ ] **Frontend Quality**: Đã chạy `pnpm lint`, `pnpm typecheck` và đạt 100% unit tests pass cho Frontend?
- [ ] **Validation Pass**: Đã chạy `smoke-test.sh` pass?

---

## 4. Ghi chú

- **Oracle 19c**: Dùng H2 in-memory cho integration tests (compatibility mode Oracle). Testcontainers nếu cần.
- **State Machine**: Implement pure Java trong `PayOrder.java` (no framework dependency).
- **CCID Validation**: MVP dùng mock lookup, Caffeine cache config sẵn.
- **Export**: MVP sync export, PDF/Excel generation dùng Apache POI + OpenPDF.
- **File Storage**: MVP dùng local filesystem, abstract behind `FileStorage` port.

---

> CHỜ HUMAN DUYỆT: Vui lòng xác nhận Plan trước khi bắt đầu code.

## Lịch sử Sửa đổi

- **2026-05-19** | **Dev Agent** | FT-001 | Tạo Dev Plan: 32 bước thực hiện, BE hexagonal architecture, FE React MFE, TDD approach.

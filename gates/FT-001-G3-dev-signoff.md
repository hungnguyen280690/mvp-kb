# Gate G3 — Dev Sign-off: FT-001

## Kết quả
- **Status**: APPROVED
- **Ngày**: 2026-05-18

## Verify
- `./mvnw compile -pl ltt-core` ✅ Pass
- `./mvnw test -pl ltt-core` ✅ 27/27 tests pass
- `pnpm build --filter @kb/shell` ✅ Pass (238KB JS, 16KB CSS)

## Backend Artifacts (24 Java files)

| Layer | Files | Mô tả |
|-------|-------|--------|
| domain/model | 3 entities | PaymentOrder, PaymentOrderDetail, ApprovalLog |
| domain/model/enums | 2 enums | OrderStatus (9 states), ApprovalAction |
| domain/repository | 1 repo | PaymentOrderRepository with filters |
| domain/service | 2 services | PaymentOrderService, StateMachine |
| api/dto | 7 DTOs | Request/Response/Page objects |
| api/mapper | 1 mapper | PaymentOrderMapper (MapStruct) |
| api/controller | 1 controller | PaymentOrderController (16 endpoints) |
| api/exception | 4 exceptions | Business, StateTransition, OptimisticLock, NotFound |
| api/exception | 1 handler | GlobalExceptionHandler |
| config | 1 app | LttCoreApplication |

## Frontend Artifacts (9 files)

| File | Mô tả |
|------|--------|
| App.tsx | React Router with 5 routes |
| components/Layout.tsx | Gov-style layout with sidebar |
| pages/Dashboard.tsx | Stats cards placeholder |
| pages/PaymentOrderList.tsx | List with search, filter, status badges |
| pages/PaymentOrderForm.tsx | Create/Edit form with 5 sections |
| pages/PaymentOrderDetail.tsx | Detail with progress bar + 4 tabs |
| api/mockData.ts | 10 mock rows with Vietnamese data |
| types/index.ts | TypeScript interfaces |
| main.tsx | Entry point |

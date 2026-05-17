# Dev Plan — FT-001

## Thông tin chung
- **Tính năng**: FT-001 — Quản lý Lệnh Thanh Toán
- **Người thực hiện**: Fullstack Dev Agent
- **Ngày lập**: 2026-05-18
- **Tham chiếu**: `features/FT-001/02-design.md`, `contracts/openapi.yaml`, `features/FT-001/03-schema.sql`

## Phạm vi Implementation

### Backend (ltt-core module)
| # | Component | File | Mô tả |
|---|-----------|------|-------|
| 1 | Domain Model | `domain/model/LttStatus.java` | State machine enum |
| 2 | Domain Model | `domain/model/LttChannel.java` | Channel enum |
| 3 | Domain Model | `domain/model/LttHeader.java` | Main entity |
| 4 | Domain Model | `domain/model/LttDetail.java` | Detail lines |
| 5 | Domain Model | `domain/model/LttSender.java` | Sender info |
| 6 | Domain Model | `domain/model/LttReceiver.java` | Receiver info |
| 7 | Port Inbound | `domain/port/inbound/LttService.java` | Use case interface |
| 8 | Port Outbound | `domain/port/outbound/LttRepository.java` | Persistence port |
| 9 | Port Outbound | `domain/port/outbound/AuditEventPublisher.java` | Audit port |
| 10 | Service | `domain/service/LttServiceImpl.java` | Business logic |
| 11 | Persistence | `infrastructure/persistence/*.java` | JPA adapters |
| 12 | Controller | `infrastructure/web/LttController.java` | REST endpoints |

### Frontend (ltt-ui micro-frontend)
| # | Component | File | Mô tả |
|---|-----------|------|-------|
| 1 | API Client | `src/api/lttApi.ts` | Fetch wrapper + types |
| 2 | List Page | `src/pages/LttListPage.tsx` | Grid + filter + pagination |
| 3 | Form Page | `src/pages/LttFormPage.tsx` | Create/Edit tabs |
| 4 | View Page | `src/pages/LttViewPage.tsx` | Read-only detail |
| 5 | Approve Page | `src/pages/LttApprovePage.tsx` | Checker/Approver |
| 6 | Status Badge | `src/components/LttStatusBadge.tsx` | Color-coded badge |
| 7 | App Router | `src/App.tsx` | Route definitions |

### Test Cases
| # | Test | Type | Rule ID |
|---|------|------|---------|
| 1 | Create LTT as Draft | Unit | BIZ-002 |
| 2 | Submit LTT → READY_FOR_APPROVAL | Unit | BIZ-009 |
| 3 | Checker approve → PENDING_APPROVER (SoD check) | Unit | BIZ-001 |
| 4 | Checker reject (same user as Maker → fail) | Unit | BIZ-001 |
| 5 | Approver approve → APPROVED (SoD check) | Unit | BIZ-001 |
| 6 | Update LTT with wrong fVer → conflict | Unit | VAL-15 |
| 7 | Delete LTT with reason < 10 chars → fail | Unit | VAL-16 |
| 8 | Detail amount sum != header amount → fail | Unit | BIZ-004 |
| 9 | Soft-delete (status = DELETED) | Unit | BIZ-003 |
| 10 | Copy LTT creates new Draft | Unit | — |

## Trạng thái
- [x] Plan đã duyệt (auto-approved for dry-run)

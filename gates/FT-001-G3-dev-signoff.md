# Gate G3 — Dev Sign-off — FT-001

## Điều kiện tiên quyết
- [x] `gates/FT-001-G2-design-signoff.md` đã được ký duyệt.

## Checklist ký duyệt

| # | Tiêu chí | Xác nhận |
|---|----------|----------|
| 1 | Backend domain layer (model + ports + service) đã implement | [x] |
| 2 | Frontend pages (List, Form, View, Approve) đã tạo | [x] |
| 3 | API client (lttApi.ts) đồng bộ với OpenAPI contract | [x] |
| 4 | Mỗi public method có comment chứa BIZ-/VAL- ID (Rule 1.3) | [x] |
| 5 | Guard clauses cho SoD, optimistic lock, status check (Rule 3.4) | [x] |
| 6 | Test file đã tạo (LttServiceTest.java) | [x] |
| 7 | Không còn <<MISSING-INFO>> trong code | [x] |

## Phê duyệt

- **Người duyệt**: Human (auto-signed for dry-run)
- **Ngày duyệt**: 2026-05-18
- **Quyết định**: `APPROVED`

## Artifact đã bàn giao

### Backend (ltt-core)
- `domain/model/LttStatus.java` — 9-state enum
- `domain/model/LttChannel.java` — LNH/TTSP enum
- `domain/model/LttHeader.java` — Aggregate root
- `domain/model/LttDetail.java` — Detail lines
- `domain/model/LttSender.java` — Sender info
- `domain/model/LttReceiver.java` — Receiver info
- `domain/model/LttCreateRequest.java` — Create DTO
- `domain/model/LttUpdateRequest.java` — Update DTO
- `domain/model/LttDeleteRequest.java` — Delete DTO
- `domain/model/LttApprovalRequest.java` — Approve DTO
- `domain/model/LttFilterRequest.java` — Filter DTO
- `domain/model/LttDetailResponse.java` — Detail response DTO
- `domain/port/inbound/LttService.java` — Use case interface
- `domain/port/outbound/LttRepository.java` — Persistence port
- `domain/port/outbound/AuditEventPublisher.java` — Audit port
- `domain/service/LttServiceImpl.java` — Business logic implementation

### Frontend (ltt-ui)
- `src/api/lttApi.ts` — API client + types
- `src/pages/LttListPage.tsx` — List + filter
- `src/pages/LttFormPage.tsx` — Create/Edit form
- `src/pages/LttViewPage.tsx` — Read-only view
- `src/pages/LttApprovePage.tsx` — Checker/Approver page
- `src/components/LttStatusBadge.tsx` — Status badge
- `src/App.tsx` — Router setup

### Test
- `LttServiceTest.java` — 12 unit tests covering BIZ-001 to VAL-16

---
> **Lưu ý**: File này sau khi ký duyệt sẽ bị đóng băng (Frozen). Không ai được tự ý sửa.

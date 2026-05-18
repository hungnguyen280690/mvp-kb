# FT-001 Design Document - Lenh Thanh Toan (Payment Order)

> **Agent**: SA | **Date**: 2026-05-18 | **Status**: Draft
> **Ref**: CRUD_spec_field.md, CRUD_spec_function.md, ROLE_spec_field.md, REPORT_spec_field.md, ARCHITECTURE.md

---

## 1. Service Design: ltt-service (Core Business Logic)

### 1.1. Responsibility Boundary

`ltt-service` owns the payment order aggregate root (`payment_order` + `payment_order_detail` + `attachment`). It implements CRUD operations, the state machine, validation rules (VAL-*), and business rules (BIZ-*). It publishes domain events via the Outbox pattern.

### 1.2. Hexagonal Architecture (Ports & Adapters)

```
                    +-----------------------------------+
                    |           REST Controller         |  <-- inbound port
                    +-----------------------------------+
                                  |
                    +-----------------------------------+
                    |        Application Service        |  <-- use-case orchestration
                    +-----------------------------------+
                       |              |             |
            +----------+   +----------+   +---------+
            | State         | Validation    | Domain
            | Machine       | Engine        | Model
            +----------+   +----------+   +---------+
                       |              |             |
                    +-----------------------------------+
                    |        Repository Port (I/F)      |  <-- outbound port
                    +-----------------------------------+
                                  |
                    +-----------------------------------+
                    |   Oracle Adapter (JPA + JDBC)     |  <-- adapter
                    +-----------------------------------+
```

### 1.3. Domain Model

```java
// Aggregate root
PaymentOrder (Entity)
  |- uuid: String
  |- refNo: String
  |- status: PaymentOrderStatus (enum)
  |- version: Long  (optimistic lock)
  |- channel: Channel
  |- transactionType: TransactionType
  |- amount: BigDecimal
  |- currencyCode: String
  |- details: List<PaymentOrderDetail>  (child entities)
  |- attachments: List<Attachment>
  |- auditEntries: List<ApprovalLog>

// Value objects
PaymentOrderStatus (enum): DRAFT, READY_FOR_APPROVAL, PENDING_APPROVER,
    APPROVED, TRANSFERRED_TO_GL, POSTED, RETURNED_TO_MAKER, REJECTED, DELETED

Channel (enum): LIEN_NGAN_HANG, THANH_TOAN_SONG_PHUONG
```

### 1.4. State Machine

Implementation: Spring StateMachine or hand-rolled transition table (recommended for MVP due to simplicity).

**Transition Table** (source: CRUD_spec_function.md SS11):

| From | Event | To | Guard |
|---|---|---|---|
| (Start) | `NEW.OPEN` | `DRAFT` | User has MAKER role |
| `DRAFT` | `NEW.SAVE` | `DRAFT` | Same user (maker) |
| `DRAFT` | `NEW.SUBMIT` | `READY_FOR_APPROVAL` | Full validation pass |
| `DRAFT` | `DELETE.CONFIRM` | `DELETED` | Maker == created_by; reason >= 10 chars |
| `DRAFT` | `EDIT.SAVE` | `DRAFT` | Optimistic lock check; version++ |
| `DRAFT` | `NEW.CANCEL` | (End) | Only if never persisted |
| `RETURNED_TO_MAKER` | `EDIT.SAVE` | `DRAFT` | Same guard as DRAFT.EDIT.SAVE |
| `RETURNED_TO_MAKER` | `NEW.SUBMIT` | `READY_FOR_APPROVAL` | Full validation |
| `RETURNED_TO_MAKER` | `DELETE.CONFIRM` | `DELETED` | Same guard |
| `READY_FOR_APPROVAL` | `APPROVE.CHECKER` | `PENDING_APPROVER` | Checker != Maker (SoD) |
| `READY_FOR_APPROVAL` | `APPROVE.RETURN` | `RETURNED_TO_MAKER` | Reason >= 10 chars |
| `READY_FOR_APPROVAL` | `APPROVE.REJECT` | `REJECTED` | Reason >= 10 chars |
| `PENDING_APPROVER` | `APPROVE.APPROVER` | `APPROVED` | Approver != Maker, != Checker |
| `PENDING_APPROVER` | `APPROVE.RETURN` | `RETURNED_TO_MAKER` | Reason >= 10 chars |
| `PENDING_APPROVER` | `APPROVE.REJECT` | `REJECTED` | Reason >= 10 chars |
| `APPROVED` | `SYSTEM.TRANSFER_GL` | `TRANSFERRED_TO_GL` | Saga trigger |
| `TRANSFERRED_TO_GL` | `SYSTEM.POST` | `POSTED` | GL confirmation received |
| `DELETED` | `ADMIN.RESTORE` | `DRAFT` | Admin role only |

**State Diagram**:

```
   Start
     |
     | Maker.New
     v
   DRAFT <----------+
     |               |
     | Submit        | Return
     v               |
   READY_FOR_APPROVAL ---+
     |                   |
     | Checker.Approve   |
     v                   |
   PENDING_APPROVER -----+
     |                   |
     | Approver.Approve  |
     v                   |
   APPROVED              |
     |                   |
     | Transfer to GL    |
     v                   |
   TRANSFERRED_TO_GL     |
     |                   |
     | Post              |
     v                   |
   POSTED -------> End   |
                          |
   Maker.Delete --------->+
     |
     v
   DELETED ---------> End
     |
     | Admin.Restore
     +-----------> DRAFT
```

### 1.5. Key Service Methods

| Method | Endpoint Pattern | Description |
|---|---|---|
| `createDraft()` | `POST /api/payment-orders` | Create DRAFT, auto-fill audit fields, generate refNo |
| `updateDraft()` | `PUT /api/payment-orders/{id}` | Update fields, validate optimistic lock, version++ |
| `submit()` | `POST /api/payment-orders/{id}/submit` | Full validation, transition DRAFT/RETURNED -> READY_FOR_APPROVAL |
| `delete()` | `POST /api/payment-orders/{id}/delete` | Soft-delete with reason, transition -> DELETED |
| `approveChecker()` | `POST /api/payment-orders/{id}/check` | Checker action: approve/return/reject |
| `approveApprover()` | `POST /api/payment-orders/{id}/approve` | Approver action: approve/return/reject |
| `getById()` | `GET /api/payment-orders/{id}` | Load aggregate with details, attachments, approval log |
| `search()` | `GET /api/payment-orders` | Paginated search with multi-criteria filter |

### 1.6. Validation Strategy

Layer validation per CRUD_spec_function.md SS8:

1. **Field-level** (`@Valid` on DTO): VAL-01 (required), VAL-02 (format), VAL-04 (range)
2. **Cross-field** (Service layer): VAL-05 (sender != receiver), VAL-07 (detail sum == header amount)
3. **Business** (Domain layer): VAL-13 (status guard), VAL-14 (maker ownership), VAL-15 (optimistic lock)
4. **Security** (Filter/Interceptor): VAL-10 (XSS/sanitize), VAL-11 (unique ref_no)

### 1.7. Event Publishing (Outbox Pattern)

Every state transition publishes a domain event to an `outbox` table within the same transaction:

```
Table: outbox
  - id (PK)
  - aggregate_type: 'PAYMENT_ORDER'
  - aggregate_id: payment_order.id
  - event_type: e.g. 'PAYMENT_ORDER_SUBMITTED', 'PAYMENT_ORDER_APPROVED'
  - payload: JSON (snapshot of changed fields)
  - created_at: timestamp
  - published: 0/1
```

A background relay reads unpublished events and pushes to a message channel (IBM MQ for outbound, internal topic for notifications).

---

## 2. Service Design: bff-service (API Aggregation)

### 2.1. Responsibility

`bff-service` is the single entry point for the React frontend. It:
- Aggregates calls to `ltt-service`, `audit-service`, and reference data services
- Transforms backend DTOs into frontend-friendly shapes
- Handles authentication/authorization token relay
- Manages pagination, sorting, and filter translation

### 2.2. API Endpoints (BFF Layer)

| Endpoint | Backend Call(s) | Purpose |
|---|---|---|
| `GET /api/bff/payment-orders` | `ltt-service.search()` + count | List with filter/sort/page |
| `GET /api/bff/payment-orders/{id}` | `ltt-service.getById()` + `audit-service.getLog()` | View detail + history |
| `POST /api/bff/payment-orders` | `ltt-service.createDraft()` | Create |
| `PUT /api/bff/payment-orders/{id}` | `ltt-service.updateDraft()` | Edit |
| `POST /api/bff/payment-orders/{id}/submit` | `ltt-service.submit()` | Submit to checker |
| `POST /api/bff/payment-orders/{id}/check` | `ltt-service.approveChecker()` | Checker action |
| `POST /api/bff/payment-orders/{id}/approve` | `ltt-service.approveApprover()` | Approver action |
| `DELETE /api/bff/payment-orders/{id}` | `ltt-service.delete()` | Soft delete |
| `GET /api/bff/lookups/{type}` | Reference data service | Bank, user, COA, currency lookups |
| `GET /api/bff/payment-orders/{id}/history` | `audit-service.getLog(recordId)` | Audit history with diff |
| `POST /api/bff/payment-orders/{id}/attachments` | File storage service | Upload attachment |
| `GET /api/bff/reports/run` | Report service | Trigger report generation |

### 2.3. Response Shaping

The BFF transforms responses for the frontend:
- Flatten nested structures for list views (only columns needed for the grid)
- Mask PII fields based on user permissions (`VIEW_PII` role function)
- Add computed fields: badge color for status, formatted amounts, truncated descriptions
- Include `_links` for HATEOAS-driven UI actions (edit/delete/submit visible based on status + user role)

---

## 3. Integration Patterns

### 3.1. Outbound (Payment Order -> IBM MQ -> Interbank)

Ref: `BangDacTaChucNang_TichHopRa_DienHinh.md`

```
PaymentOrder (APPROVED)
       |
       v
  Outbox Event: PAYMENT_ORDER_APPROVED
       |
       v
  integration-gateway picks up event
       |
       v
  Transform to VDBAS message format (ISO 20022 / proprietary)
       |
       v
  Send to IBM MQ (outbound queue)
       |
       v
  Wait for ACK -> update status to TRANSFERRED_TO_GL
       |
       v
  Receive posting confirmation -> update status to POSTED
```

Key design decisions:
- **Idempotency**: Each outbound message carries `idempotency_key` from `payment_order` table
- **Retry**: Exponential backoff (3 attempts, 5s/30s/120s) with dead-letter queue
- **Saga**: If posting fails after APPROVED, trigger compensation (reversal order) or alert operations team

### 3.2. Inbound (IBM MQ -> Payment Order)

Ref: `BangDacTaChucNang_Inquiry_DienHinh.md`

```
IBM MQ (inbound queue)
       |
       v
  integration-gateway listener
       |
       v
  Parse VDBAS message
       |
       v
  Route by message type:
    - Posting confirmation -> update payment_order status
    - Reversal notification -> create reversal entry
    - Status inquiry response -> update inquiry status
    - Statement line -> reconcile with payment_order
```

### 3.3. Audit Service Integration

Every data mutation in `ltt-service` must:
1. Compute `current_hash = SHA-256(prev_hash || table_name || record_id || action || actor || action_date || diff_json)`
2. Insert into `audit_log` within the same transaction
3. The first audit record for any table uses a known sentinel hash `SHA-256('GENESIS')`

---

## 4. State Machine Implementation Detail

### 4.1. Transition Guard Summary

| Guard | Rule | Validation Code |
|---|---|---|
| Maker ownership | `currentUser == payment_order.created_by` | VAL-14 |
| SoD Checker | `currentUser != payment_order.created_by` | BIZ-001 |
| SoD Approver | `currentUser != payment_order.created_by AND currentUser != payment_order.checked_by` | BIZ-001 |
| Status allowed | `status IN allowedStatusesForAction` | VAL-13 |
| Optimistic lock | `request.version == db.version` | VAL-15 |
| Full validation | All field-level + cross-field + business rules pass | VAL-01..18 |
| Reason required | `note.length >= 10` for REJECT/RETURN | BIZ-006 |

### 4.2. Status Color Mapping (UI)

| Status | Badge Color | Hex |
|---|---|---|
| DRAFT | Gray | `#9CA3AF` |
| READY_FOR_APPROVAL | Yellow/Amber | `#F59E0B` |
| PENDING_APPROVER | Yellow/Amber | `#F59E0B` |
| APPROVED | Green | `#10B981` |
| TRANSFERRED_TO_GL | Green | `#10B981` |
| POSTED | Blue | `#3B82F6` |
| RETURNED_TO_MAKER | Orange | `#F97316` |
| REJECTED | Red | `#EF4444` |
| DELETED | Dark gray | `#4B5563` |

---

## 5. Security Considerations

### 5.1. Authentication & Authorization

- **Auth**: JWT-based (Spring Security + OAuth2 Resource Server)
- **Authorization**: RBAC via `role` + `role_function` + `user_role` tables
- **Endpoint protection**: Each API endpoint checks `function_code` + `read_perm`/`write_perm`
- **SoD enforcement**: Database-level check constraint is impractical; enforce at service layer with audit log on violation

### 5.2. Sensitive Data Handling

| Data | Storage | Display | Transport |
|---|---|---|---|
| Passwords | Hashed (bcrypt) | Never | TLS only |
| CMND/CCCD | Encrypted column | Masked (last 4 chars) unless `VIEW_PII` | TLS only |
| Account numbers | Plain (audit need) | Masked unless `VIEW_PII` | TLS only |
| Amounts | Plain | Formatted with thousands separator | TLS only |
| File attachments | BLOB + SHA-256 hash | Download link only | TLS + signed URL |

### 5.3. API Security

- **Idempotency**: `X-Request-ID` header required for all mutating endpoints (Rule 2.3)
- **Rate limiting**: Per-user and per-IP rate limits on API gateway
- **Input validation**: Server-side validation for all fields; client-side is UX only
- **XSS/Injection**: All text input sanitized (VAL-10); parameterized queries only
- **File upload**: MIME check + magic byte verification; virus scan before storage; max 10MB per file, 50MB total per record

### 5.4. Audit & Non-repudiation

- **Hash chain**: `audit_log` table links every change via SHA-256 chain
- **Approval log**: Every approval/rejection recorded with actor, role, IP, timestamp, auth method
- **Digital signature**: High-value transactions (>500M VND) require digital signature (CAdES/PAdES)
- **OTP**: Standard approval uses OTP with 60s TTL
- **Session**: JWT with configurable TTL; idle timeout enforced at gateway

### 5.5. Database Security

- **Row-level security**: Oracle VPD or application-level filtering by user's org scope
- **Soft delete**: `is_deleted = 1` + `delete_reason` preserved; physical delete only by DBA
- **Optimistic locking**: `version` column prevents lost updates; conflict returns HTTP 409
- **Connection**: Encrypted (TLS) connection pool; read-only replicas for reporting queries

---

## 6. Cross-Cutting Concerns

### 6.1. Error Handling

All errors follow a standard envelope:

```json
{
  "traceId": "uuid",
  "timestamp": "2026-05-18T10:30:00.000+07:00",
  "code": "MSG-ERR-REQUIRED",
  "message": "Vui long nhap [Ten truong]",
  "field": "fieldName",
  "severity": "ERROR"
}
```

### 6.2. Pagination

All list endpoints return:

```json
{
  "content": [...],
  "page": { "number": 0, "size": 20, "totalElements": 1234, "totalPages": 62 }
}
```

### 6.3. Notification Pattern

On state transitions (BIZ-009):
- `PAYMENT_ORDER_SUBMITTED` -> notify assigned Checker(s)
- `PAYMENT_ORDER_CHECKED` -> notify assigned Approver(s)
- `PAYMENT_ORDER_APPROVED/REJECTED/RETURNED` -> notify Maker
- Notification channels: in-app (WebSocket) + email (SMTP relay)

---

## 7. Technology Mapping

| Concern | Technology | Location |
|---|---|---|
| REST API | Spring Web | `backend/ltt-service/` |
| Persistence | Spring Data JPA + Hibernate | `backend/ltt-service/` |
| State Machine | Custom (enum + guard table) | `backend/ltt-service/` |
| Validation | Jakarta Bean Validation + custom | `backend/ltt-service/` |
| Auth | Spring Security + JWT | `backend/bff-service/` |
| MQ Integration | Spring Integration + JMS (IBM MQ) | `backend/integration-gateway/` |
| Audit Hash | Application service (SHA-256) | `backend/audit-service/` |
| Outbox | Debezium or polling relay | `backend/ltt-service/` |
| Frontend | React 18 + Vite + TypeScript | `frontend/apps/ltt-ui/` |
| UI Components | shadcn/ui + Tailwind CSS | `frontend/apps/ltt-ui/` |
| API Contract | OpenAPI 3.1 YAML | `contracts/` |

---

_Change log:_
_- 2026-05-18 | SA Agent | Initial design document for FT-001_

# Thiết kế Giải pháp — FT-001: Quản lý Lệnh Thanh Toán (LTT)

> **Giai đoạn**: Stage 2 — SA Design
> **Đầu vào**: `01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`
> **Đầu ra**: File này + `03-schema.sql`

---

## 1. Tổng quan Kiến trúc (Solution Overview)

### 1.1. Phương pháp tiếp cận

FT-001 triển khai CRUD Lệnh Thanh Toán (LTT) với luồng Maker-Checker-Approver 3 cấp. Thiết kế tuân thủ kiến trúc Hexagonal (Ports & Adapters), chia tách rõ ràng giữa domain logic, application use cases và infrastructure adapters.

Nguyên tắc thiết kế cốt lõi:

- **Domain-First**: State machine và business rules nằm hoàn toàn trong domain layer của `ltt-service`, không phụ thuộc framework.
- **Contract-Driven**: Mọi giao tiếp giữa modules (BFF <-> ltt-service, ltt-service <-> audit-service) tuân thủ OpenAPI contract.
- **Eventual Consistency**: Phê duyệt (Approved) trigger downstream (audit hash, GL push) qua Outbox + Saga, không đồng bộ.
- **Security by Design**: SoD enforcement ở cả application layer và DB constraint; JWT + Idempotency Key trên mọi mutating endpoint.

### 1.2. Luồng xử lý tổng thể

```text
[User/Browser] --> [BFF (8080)] --> [ltt-service (8081)] --> [Oracle 19c]
                                       |
                    +------------------+------------------+
                    v                  v                  v
            [audit-service     [integration-       [Notification
             (8083)]            gateway (8082)]     Service]
            Hash Chain          IBM MQ               In-app + Email
            Audit Trail         GL Push
```

---

## 2. Phân công Dịch vụ (Service Mapping)

### 2.1. `ltt-service` (Port 8081) — Domain Core

| Trách nhiệm                | Chi tiết                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **State Machine**          | Quản lý vòng đời LTT: Draft -> Ready_For_Approval -> Pending_Approver -> Approved -> Transferred_to_GL -> Posted. Sử dụng enum-based transition table. |
| **CRUD Business Logic**    | Create, Update, Delete (soft), Copy LTT. Validate đầy đủ theo VAL-01..VAL-18.                                                                          |
| **Maker-Checker-Approver** | SoD enforcement (maker_id <> checker_id <> approver_id). Phân quyền theo role.                                                                         |
| **CCID Cross-Validation**  | Validate 12 GL Segments (COA) theo lookup table. Tổng tiền chi tiết = tổng header.                                                                     |
| **Outbox Publisher**       | Ghi event vào `LTT_OUTBOX` trong cùng transaction với business data.                                                                                   |
| **Optimistic Lock**        | Sử dụng cột `VERSION` + `@Version` JPA. Reject nếu mismatch (VAL-15).                                                                                  |
| **Idempotency**            | Kiểm tra `X-Request-ID` trên mọi POST/PUT. Lưu vào `IDEMPOTENCY_CACHE` table.                                                                          |

**Cấu trúc Hexagonal nội tại**:

```text
backend/ltt-service/src/main/java/com/kb/ltt/
├── domain/                      # THUẦN JAVA, cấm import Spring/JPA
│   ├── model/
│   │   ├── PaymentOrder.java          # Aggregate Root
│   │   ├── PaymentOrderDetail.java    # Entity (khoản mục)
│   │   ├── PaymentOrderAttachment.java
│   │   └── PaymentOrderState.java     # Enum state machine
│   ├── service/
│   │   ├── PaymentOrderDomainService.java
│   │   ├── StateTransitionGuard.java  # VAL-13, VAL-14, SoD
│   │   └── CcidValidator.java         # 12-segment cross-validation
│   ├── event/
│   │   ├── PaymentOrderCreatedEvent.java
│   │   ├── PaymentOrderApprovedEvent.java
│   │   └── PaymentOrderStateChangedEvent.java
│   └── exception/
│       ├── BusinessRuleViolationException.java
│       ├── SoDViolationException.java
│       └── OptimisticLockConflictException.java
├── application/
│   ├── port/
│   │   ├── in/                         # Incoming ports (use cases)
│   │   │   ├── CreatePaymentOrderUseCase.java
│   │   │   ├── UpdatePaymentOrderUseCase.java
│   │   │   ├── DeletePaymentOrderUseCase.java
│   │   │   ├── SubmitPaymentOrderUseCase.java
│   │   │   ├── CheckPaymentOrderUseCase.java
│   │   │   ├── ApprovePaymentOrderUseCase.java
│   │   │   ├── RejectPaymentOrderUseCase.java
│   │   │   ├── ReturnPaymentOrderUseCase.java
│   │   │   └── QueryPaymentOrderUseCase.java
│   │   └── out/                        # Outgoing ports (interfaces)
│   │       ├── PaymentOrderRepositoryPort.java
│   │       ├── AuditEventPort.java
│   │       ├── NotificationPort.java
│   │       ├── OutboxPort.java
│   │       └── GlIntegrationPort.java
│   └── service/
│       ├── PaymentOrderApplicationService.java  # Facade, điều phối use cases
│       └── PaymentOrderQueryService.java        # Read-side
├── infrastructure/
│   ├── web/
│   │   ├── PaymentOrderController.java          # REST adapter
│   │   ├── dto/
│   │   │   ├── CreatePaymentOrderRequest.java
│   │   │   ├── UpdatePaymentOrderRequest.java
│   │   │   ├── PaymentOrderResponse.java
│   │   │   ├── PaymentOrderListResponse.java
│   │   │   └── ApprovalRequest.java
│   │   └── mapper/
│   │       └── PaymentOrderDtoMapper.java
│   ├── persistence/
│   │   ├── entity/
│   │   │   ├── PaymentOrderJpaEntity.java
│   │   │   ├── PaymentOrderDetailJpaEntity.java
│   │   │   ├── PaymentOrderAttachmentJpaEntity.java
│   │   │   └── PaymentOrderOutboxJpaEntity.java
│   │   ├── repository/
│   │   │   ├── PaymentOrderJpaRepository.java
│   │   │   └── PaymentOrderDetailJpaRepository.java
│   │   └── adapter/
│   │       └── PaymentOrderRepositoryAdapter.java  # Implements port out
│   ├── outbox/
│   │   ├── OutboxPoller.java                     # Scheduled poller
│   │   └── OutboxMessagePublisher.java
│   ├── audit/
│   │   └── AuditEventAdapter.java                # Implements AuditEventPort
│   └── config/
│       ├── StateMachineConfig.java
│       └── SecurityConfig.java
```

### 2.2. `bff-service` (Port 8080) — API Aggregation

| Trách nhiệm            | Chi tiết                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **API Gateway cho UI** | Tổng hợp data từ `ltt-service`, `audit-service` thành response duy nhất cho frontend. |
| **Auth Forwarding**    | Forward JWT token, inject `X-Request-ID`, handle session timeout.                     |
| **Response Shaping**   | Transform domain model thành UI-friendly DTO (masking PII, format currency/date).     |
| **Pagination Wrapper** | Chuẩn hóa response pagination cho `LIST` screen.                                      |

**Luồng BFF**:

```text
Client --> BFF GET /api/v1/ltt/{id}
         |--> Call ltt-service --> PaymentOrder (header + details + attachments)
         |--> Call audit-service --> Audit trail (history)
         +--> Merge --> Single enriched response cho VIEW screen
```

### 2.3. `audit-service` (Port 8083) — Hash Chain Audit

| Trách nhiệm       | Chi tiết                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Hash Chain**    | Tính `currentHash = SHA-256(prevHash + payload + timestamp)`. Mỗi bản ghi audit liên kết với bản ghi trước. |
| **Audit Storage** | Lưu trữ mọi action trên LTT: CREATE, UPDATE, DELETE, SUBMIT, CHECK, APPROVE, REJECT, RETURN.                |
| **Diff Tracking** | Ghi `oldValue -> newValue` cho mỗi field thay đổi (BIZ-007).                                                |
| **Query API**     | Cung cấp API đọc audit history theo `lttId` cho tab History và export.                                      |

### 2.4. `integration-gateway` (Port 8082) — IBM MQ

| Trách nhiệm           | Chi tiết                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Message Transform** | Chuyển đổi LTT Approved -> định dạng IBM MQ message (LNH / TTSP).                         |
| **Reliable Delivery** | Đảm bảo at-least-once delivery qua MQ. Idempotent consumer ở phía NHNN/ngân hàng đối ứng. |
| **Callback Handling** | Nhận ACK/NACK từ MQ, update trạng thái LTT (Transferred_to_GL / Posted).                  |

---

## 3. Thiết kế API (API Design Summary)

### 3.1. Base Path & Common Headers

```text
Base URL: /api/v1/ltt
Content-Type: application/json
Authorization: Bearer <JWT>
X-Request-ID: <UUID>           # Bat buoc tren POST/PUT/DELETE
If-Match: <version>            # Bat buoc tren PUT (optimistic lock)
```

### 3.2. Endpoints

#### CRUD Operations

| Method   | Path                    | Mo ta                           | Req Body                    | Success        | Event                |
| -------- | ----------------------- | ------------------------------- | --------------------------- | -------------- | -------------------- |
| `POST`   | `/api/v1/ltt`           | Tao moi LTT (Draft)             | `CreatePaymentOrderRequest` | 201 Created    | `LTT.NEW.SAVE`       |
| `GET`    | `/api/v1/ltt`           | Danh sach LTT (phan trang, loc) | Query params                | 200 OK + Page  | `LTT.LIST.VIEW`      |
| `GET`    | `/api/v1/ltt/{id}`      | Xem chi tiet LTT                | --                          | 200 OK + ETag  | `LTT.VIEW.OPEN`      |
| `PUT`    | `/api/v1/ltt/{id}`      | Cap nhat LTT (Draft/Returned)   | `UpdatePaymentOrderRequest` | 200 OK + ETag  | `LTT.EDIT.SAVE`      |
| `DELETE` | `/api/v1/ltt/{id}`      | Soft-delete LTT                 | `{ "reason": "..." }`       | 204 No Content | `LTT.DELETE.CONFIRM` |
| `POST`   | `/api/v1/ltt/{id}/copy` | Sao chep LTT                    | --                          | 201 Created    | `LTT.NEW.COPY`       |

#### Workflow Operations (State Transitions)

| Method | Path                       | Mo ta                                         | Req Body           | Success | Event                  |
| ------ | -------------------------- | --------------------------------------------- | ------------------ | ------- | ---------------------- |
| `POST` | `/api/v1/ltt/{id}/submit`  | Gui kiem soat (Draft -> Ready_For_Approval)   | --                 | 200 OK  | `LTT.NEW.SUBMIT`       |
| `POST` | `/api/v1/ltt/{id}/check`   | Checker kiem soat (Ready -> Pending_Approver) | `ApprovalRequest`  | 200 OK  | `LTT.APPROVE.CHECKER`  |
| `POST` | `/api/v1/ltt/{id}/approve` | Approver phe duyet (Pending -> Approved)      | `ApprovalRequest`  | 200 OK  | `LTT.APPROVE.APPROVER` |
| `POST` | `/api/v1/ltt/{id}/reject`  | Tu choi (-> Rejected)                         | `RejectionRequest` | 200 OK  | `LTT.APPROVE.REJECT`   |
| `POST` | `/api/v1/ltt/{id}/return`  | Tra lai Maker (-> Returned_To_Maker)          | `ReturnRequest`    | 200 OK  | `LTT.APPROVE.RETURN`   |

#### Attachment Operations

| Method   | Path                                               | Mo ta                            | Success        |
| -------- | -------------------------------------------------- | -------------------------------- | -------------- |
| `POST`   | `/api/v1/ltt/{id}/attachments`                     | Upload file dinh kem (multipart) | 201 Created    |
| `GET`    | `/api/v1/ltt/{id}/attachments`                     | Danh sach dinh kem               | 200 OK         |
| `GET`    | `/api/v1/ltt/{id}/attachments/{attachId}/download` | Tai file                         | 200 + Stream   |
| `DELETE` | `/api/v1/ltt/{id}/attachments/{attachId}`          | Xoa dinh kem                     | 204 No Content |

#### Query & Export

| Method | Path                               | Mo ta                            | Success                           |
| ------ | ---------------------------------- | -------------------------------- | --------------------------------- |
| `GET`  | `/api/v1/ltt/{id}/history`         | Lich su audit (tu audit-service) | 200 OK                            |
| `GET`  | `/api/v1/ltt/{id}/approval-status` | Trang thai phe duyet (workflow)  | 200 OK                            |
| `POST` | `/api/v1/ltt/export`               | Xuat Excel/PDF/CSV               | 200 + File / 202 Accepted (async) |

### 3.3. Key DTOs

```java
// CreatePaymentOrderRequest
{
  "channel": "LIEN_NGAN_HANG",           // LIEN_NGAN_HANG | THANH_TOAN_SONG_PHUONG
  "transactionType": "LENH_THONG_THUONG", // Theo danh muc
  "senderCode": "string",
  "receiverCode": "string",
  "refNo": "string",                      // So YCTT / So but toan
  "paymentDate": "2026-05-18",
  "amount": 500000000.00,
  "currencyCode": "VND",
  "transactionCategory": "LENH_CHUYEN_CO_GT_CAO", // Chi LNH
  "exchangeRate": null,                    // Chi ngoai te
  "originalDocNo": "string",              // Chi TTSP
  "originalDocDate": "2026-05-18",        // Chi TTSP
  "expenseType": null,                     // Chi ngoai te
  "fnCode1": null,
  "fnCode2": null,
  "fnAmount": null,
  "description": "string",
  "details": [                             // Khoan muc
    {
      "lineNo": 1,
      "glSegment1": "01",
      "glSegment2": "1121",
      "glSegment3": "1010101",
      "glSegment4": null,
      "glSegment5": "000",
      "glSegment6": "000",
      "glSegment7": "0000",
      "glSegment8": "00000",
      "glSegment9": "00000",
      "glSegment10": "00",
      "glSegment11": "0000",
      "glSegment12": "00",
      "lineDescription": "string",
      "lineAmount": 500000000.00
    }
  ],
  "senderInfo": {
    "senderName": "string",
    "senderAddress": "string",
    "senderAccount": "1121",
    "senderNum": null,
    "senderBankCode": "string",
    "senderIdentifyId": null,
    "senderIssuedDate": null,
    "senderIssuedPlace": null,
    "tpcpCode": null
  },
  "receiverInfo": {
    "receiverName": "string",
    "receiverAddress": "string",
    "receiverAccount": "string",
    "receiverBankName": "string",
    "receiverBankCode": "string",
    "receiverIdentifyId": null,
    "receiverIssuedDate": null,
    "receiverIssuedPlace": null
  }
}

// ApprovalRequest
{
  "result": "APPROVE",         // APPROVE | REJECT | RETURN
  "note": "string",            // Bat buoc neu REJECT/RETURN, >= 10 ky tu
  "errorCode": null,           // Danh muc ma loi neu REJECT/RETURN
  "authMethod": "OTP",         // OTP | DIGITAL_SIGN
  "otpCode": "123456",         // Neu OTP
  "certSerial": null,          // Neu DIGITAL_SIGN
  "signature": null            // Neu DIGITAL_SIGN
}

// PaymentOrderListQueryParams
?channel=LIEN_NGAN_HANG
&transactionType=LENH_THONG_THUONG
&status=DRAFT,READY_FOR_APPROVAL
&refNo=YCTT
&senderCode=KB01
&receiverCode=KB02
&fromDate=2026-05-11
&toDate=2026-05-18
&dateField=CREATED_DATE      // CREATED_DATE | PAYMENT_DATE | CHECKED_DATE | APPROVED_DATE
&amountFrom=1000000
&amountTo=500000000
&currencyCode=VND
&createdBy=user01
&page=0
&size=20
&sort=createdDate,DESC
```

### 3.4. Error Response Format

```json
{
  "timestamp": "2026-05-18T10:30:00.000+07:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Vui long nhap So YCTT",
  "errorCode": "MSG-ERR-REQUIRED",
  "traceId": "abc-123-def",
  "fieldErrors": [
    {
      "field": "refNo",
      "message": "Vui long nhap So YCTT",
      "code": "MSG-ERR-REQUIRED"
    }
  ]
}
```

### 3.5. HTTP Status Codes

| Code                        | Su dung khi                                     |
| --------------------------- | ----------------------------------------------- |
| `200 OK`                    | GET, PUT thanh cong, workflow action thanh cong |
| `201 Created`               | POST tao moi thanh cong                         |
| `204 No Content`            | DELETE thanh cong                               |
| `400 Bad Request`           | Validation loi (VAL-\*), business rule vi pham  |
| `401 Unauthorized`          | JWT het han / khong hop le                      |
| `403 Forbidden`             | Khong co quyen (SoD violation, wrong role)      |
| `404 Not Found`             | LTT khong ton tai                               |
| `409 Conflict`              | Optimistic lock mismatch (VAL-15)               |
| `422 Unprocessable Entity`  | State transition khong hop le (VAL-13)          |
| `429 Too Many Requests`     | Duplicate request (idempotency)                 |
| `500 Internal Server Error` | Loi he thong                                    |

---

## 4. Thiết kế Cơ sở dữ liệu (Database Design Summary)

Chi tiet DDL day du trong file `03-schema.sql`. Duoi day la tong quan cac bang chinh.

### 4.1. Bang Nghiep vu (Business Tables)

| Bang                | Mo ta                            | Khoa chinh                  |
| ------------------- | -------------------------------- | --------------------------- |
| `LTT_HEADER`        | Header cua Lenh Thanh Toan       | `ID` (BIGINT, sequence)     |
| `LTT_DETAIL`        | Chi tiet khoan muc (GL Segments) | `ID`, FK -> `LTT_HEADER.ID` |
| `LTT_ATTACHMENT`    | File dinh kem                    | `ID`, FK -> `LTT_HEADER.ID` |
| `LTT_SENDER_INFO`   | Thong tin nguoi chuyen (1:1)     | `ID`, FK -> `LTT_HEADER.ID` |
| `LTT_RECEIVER_INFO` | Thong tin nguoi nhan (1:1)       | `ID`, FK -> `LTT_HEADER.ID` |

### 4.2. Bang Kiem toan & Ha tang (Audit & Infrastructure Tables)

| Bang                | Mo ta                               | Khoa chinh            |
| ------------------- | ----------------------------------- | --------------------- |
| `LTT_AUDIT`         | Audit log + Hash Chain              | `ID` (sequence)       |
| `LTT_OUTBOX`        | Outbox pattern cho event publishing | `ID`                  |
| `IDEMPOTENCY_CACHE` | Chong lap request                   | `REQUEST_ID` (unique) |
| `LTT_LOCK`          | Distributed lock (concurrent edit)  | `LTT_ID`              |

### 4.3. Bang Danh muc (Reference Tables)

| Bang                   | Mo ta                                                  |
| ---------------------- | ------------------------------------------------------ |
| `REF_BANK`             | Danh muc NH/KB                                         |
| `REF_CURRENCY`         | Danh muc tien te                                       |
| `REF_COA`              | Ma COA (12 segments) -- dung cho CCID validation       |
| `REF_TRANSACTION_TYPE` | Danh muc loai lenh theo kenh                           |
| `REF_EXPENSE_TYPE`     | Danh muc loai phi                                      |
| `REF_ERROR_CODE`       | Danh muc ma loi nghiep vu (CHECK, APPROVE)             |
| `REF_GL_SEGMENT`       | Danh muc tung segment GL (quy, TK tu nhien, DVQHNS...) |
| `REF_APPROVAL_LIMIT`   | Han muc phe duyet theo user/role                       |

### 4.4. Key Columns trong LTT_HEADER

```text
ID                  BIGINT          PK, auto-increment
LTT_NO              VARCHAR(20)     Ma LTT duy nhat (business key), format: LTTyyyyMMdd_SEQ
CHANNEL             VARCHAR(30)     LIEN_NGAN_HANG / THANH_TOAN_SONG_PHUONG
TRANSACTION_TYPE    VARCHAR(50)     Loai lenh
SENDER_CODE         VARCHAR(20)     NH/KB chuyen
RECEIVER_CODE       VARCHAR(20)     NH/KB nhan
REF_NO              VARCHAR(50)     So YCTT / So but toan
PAYMENT_DATE        DATE            Ngay thanh toan
AMOUNT              NUMBER(18,2)    So tien chuyen
CURRENCY_CODE       VARCHAR(3)      Loai tien (mac dinh VND)
STATUS              VARCHAR(30)     Trang thai state machine
VERSION             INTEGER         Optimistic lock (@Version)
CREATED_BY          VARCHAR(50)     Maker (user ID)
CREATED_DATE        TIMESTAMP       Ngay lap
CHECKED_BY          VARCHAR(50)     Checker (user ID)
CHECKED_DATE        TIMESTAMP       Ngay kiem soat
APPROVED_BY         VARCHAR(50)     Approver (user ID)
APPROVED_DATE       TIMESTAMP       Ngay phe duyet
DELETED_BY          VARCHAR(50)     Nguoi xoa
DELETED_DATE        TIMESTAMP       Ngay xoa
DELETE_REASON       VARCHAR(500)    Ly do xoa
DESCRIPTION         VARCHAR(1000)   Noi dung thanh toan
EXCHANGE_RATE       NUMBER(12,4)    Ty gia (neu ngoai te)
TRANSACTION_CATEGORY VARCHAR(50)    Loai giao dich (LNH: GT cao/thap)
ORIGINAL_DOC_NO     VARCHAR(50)     So chung tu goc
ORIGINAL_DOC_DATE   DATE            Ngay chung tu
EXPENSE_TYPE        VARCHAR(30)     Loai phi
FN_CODE1            VARCHAR(3)      Ma ngoai te trich no
FN_CODE2            VARCHAR(3)      Ma ngoai te TT
FN_AMOUNT           NUMBER(18,2)    So tien ngoai te
IS_DELETED          CHAR(1)         Soft-delete flag (Y/N)
```

### 4.5. Database Constraints quan trọng

```sql
-- SoD: Checker khong duoc la Maker
ALTER TABLE LTT_HEADER ADD CONSTRAINT chk_sod_checker
  CHECK (CHECKED_BY IS NULL OR CHECKED_BY != CREATED_BY);

-- SoD: Approver khong duoc la Maker hoac Checker
ALTER TABLE LTT_HEADER ADD CONSTRAINT chk_sod_approver
  CHECK (APPROVED_BY IS NULL OR (APPROVED_BY != CREATED_BY AND APPROVED_BY != CHECKED_BY));

-- Status trong danh muc hop le
ALTER TABLE LTT_HEADER ADD CONSTRAINT chk_status_valid
  CHECK (STATUS IN ('DRAFT','READY_FOR_APPROVAL','PENDING_APPROVER',
                     'APPROVED','TRANSFERRED_TO_GL','POSTED',
                     'RETURNED_TO_MAKER','REJECTED','DELETED'));

-- Amount > 0
ALTER TABLE LTT_HEADER ADD CONSTRAINT chk_amount_positive
  CHECK (AMOUNT > 0);

-- Unique REF_NO trong pham vi (sender, payment_date)
ALTER TABLE LTT_HEADER ADD CONSTRAINT uk_ref_no_unique
  UNIQUE (REF_NO, SENDER_CODE, PAYMENT_DATE);
```

---

## 5. Tích hợp State Machine (State Machine Integration)

### 5.1. Lựa chọn kỹ thuật

Su dung **enum-based transition table** thay vi Spring StateMachine full framework, vi:

- MVP can don gian, de debug, de test.
- So trang thai va transition huu han, khong can hierarchical/parallel states.
- Full Spring StateMachine them complexity khong can thiet cho MVP.

```java
// BR-LTT-01: State Machine
public enum LttState {
    DRAFT,
    READY_FOR_APPROVAL,
    PENDING_APPROVER,
    APPROVED,
    TRANSFERRED_TO_GL,
    POSTED,
    RETURNED_TO_MAKER,
    REJECTED,
    DELETED
}

public enum LttEvent {
    CREATE,         // Start -> DRAFT
    SAVE,           // DRAFT -> DRAFT
    SUBMIT,         // DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL
    CHECK_APPROVE,  // READY_FOR_APPROVAL -> PENDING_APPROVER
    APPROVE,        // PENDING_APPROVER -> APPROVED
    RETURN,         // READY_FOR_APPROVAL/PENDING_APPROVER -> RETURNED_TO_MAKER
    REJECT,         // READY_FOR_APPROVAL/PENDING_APPROVER -> REJECTED
    DELETE,         // DRAFT/RETURNED_TO_MAKER -> DELETED
    TRANSFER_TO_GL, // APPROVED -> TRANSFERRED_TO_GL
    POST,           // TRANSFERRED_TO_GL -> POSTED
    RESTORE         // DELETED -> DRAFT (admin only)
}
```

### 5.2. Transition Table

```java
// BR-LTT-02: Transition Guard
private static final Map<LttState, Set<LttEvent>> ALLOWED_TRANSITIONS = Map.of(
    DRAFT,                EnumSet.of(SAVE, SUBMIT, DELETE),
    READY_FOR_APPROVAL,   EnumSet.of(CHECK_APPROVE, RETURN, REJECT),
    PENDING_APPROVER,     EnumSet.of(APPROVE, RETURN, REJECT),
    APPROVED,             EnumSet.of(TRANSFER_TO_GL),
    TRANSFERRED_TO_GL,    EnumSet.of(POST),
    RETURNED_TO_MAKER,    EnumSet.of(SAVE, SUBMIT, DELETE),
    DELETED,              EnumSet.of(RESTORE)
    // POSTED, REJECTED: terminal states, no outgoing transitions
);
```

### 5.3. Guard Conditions

Truoc moi transition, `StateTransitionGuard` kiem tra:

1. **State validity**: `targetEvent` co thuoc `ALLOWED_TRANSITIONS.get(currentState)` khong?
2. **Role check**: User co role phu hop khong? (Maker = CREATE/SAVE/SUBMIT/DELETE, Checker = CHECK_APPROVE, Approver = APPROVE).
3. **SoD check** (BIZ-001): `currentUserId != record.createdBy` cho Checker/Approver. `currentUserId != record.checkedBy` cho Approver.
4. **Ownership check** (VAL-14): Chi `createdBy` duoc EDIT/DELETE.
5. **Amount limit check** (BIZ-010, VAL-12): Neu AMOUNT vuot han muc cua Approver -> yeu cau cap cao hon.

### 5.4. State Transition Diagram

```text
                                       Maker.New        Maker.Save/Edit
                            Start ---------> DRAFT <-----------+
                                              |                |
                                              | Submit         | Return
                                              v                |
                                  Ready_For_Approval ----------+
                                              |                |
                                              | Checker.Approve|
                                              v                |
                                   Pending_Approver ------------+
                                              |                |
                                              | Approver.Approve
                                              v
                                          Approved ---------> Posted ---> End
                                              |                   |
                                              | Reject            |
                                              v                   v
                                          Rejected ------------> End

                               Maker.Delete (Draft/Returned_To_Maker)
                            DRAFT/RETURNED ------> Deleted ------> End
                                                      |
                                                      | Admin.Restore
                                                      +-------------+
```

---

## 6. Saga & Outbox Pattern (Eventual Consistency)

### 6.1. Outbox Flow

Khi LTT duoc phe duyet (Approved), he thong can trigger nhieu downstream actions. Thay vi goi dong bo, su dung **Transactional Outbox**:

```text
1. ltt-service: Trong 1 DB transaction:
   a. UPDATE LTT_HEADER SET STATUS = 'APPROVED'
   b. INSERT INTO LTT_OUTBOX (aggregate_type, aggregate_id, event_type, payload, created_date)
      VALUES ('LTT', {id}, 'LTT_APPROVED', '{json}', NOW())

2. Outbox Poller (scheduled, 5s):
   a. SELECT * FROM LTT_OUTBOX WHERE STATUS = 'PENDING' ORDER BY CREATED_DATE
   b. Publish message den Kafka/RabbitMQ
   c. UPDATE LTT_OUTBOX SET STATUS = 'PUBLISHED'
```

### 6.2. Saga: Approval -> GL Push

```text
[LTT_APPROVED event]
    |
    +-> Step 1: audit-service ghi Hash Chain Audit
    |            (compensate: log failure, retry)
    |
    +-> Step 2: integration-gateway push IBM MQ message
    |            (compensate: mark TRANSFER_TO_GL_FAILED, retry)
    |
    +-> Step 3: ltt-service update STATUS = TRANSFERRED_TO_GL
    |
    +-> Step 4: GL acknowledgment received
                 -> ltt-service update STATUS = POSTED
```

### 6.3. Idempotent Consumer

Moi downstream service kiem tra idempotency khi nhan event:

```text
Key: {eventId} + {consumerId}
Neu da xu ly -> skip (return 200 OK)
Neu chua -> xu ly + ghi marker
```

---

## 7. Bảo mật (Security)

### 7.1. Authentication & Authorization

| Co che                 | Chi tiet                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **JWT Authentication** | Bearer token trong `Authorization` header. Token chua: `sub` (userId), `roles` (MAKER/CHECKER/APPROVER/VIEWER), `org` (ma don vi), `exp`. |
| **Role-Based Access**  | Moi endpoint kiem tra role qua Spring Security `@PreAuthorize`.                                                                           |
| **SoD Enforcement**    | O 2 tang: (1) Application Service check truoc khi goi domain, (2) DB Constraint `chk_sod_checker` / `chk_sod_approver`.                   |

### 7.2. Endpoint Security Matrix

| Endpoint                        | Role duoc phep                      | Ghi chu                            |
| ------------------------------- | ----------------------------------- | ---------------------------------- |
| `POST /api/v1/ltt`              | MAKER                               | --                                 |
| `PUT /api/v1/ltt/{id}`          | MAKER (owner only)                  | VAL-14                             |
| `DELETE /api/v1/ltt/{id}`       | MAKER (owner only)                  | VAL-14, VAL-13                     |
| `POST /api/v1/ltt/{id}/submit`  | MAKER (owner only)                  | --                                 |
| `POST /api/v1/ltt/{id}/check`   | CHECKER                             | SoD: checker != maker              |
| `POST /api/v1/ltt/{id}/approve` | APPROVER                            | SoD: approver != maker, != checker |
| `POST /api/v1/ltt/{id}/reject`  | CHECKER / APPROVER                  | Tuy trang thai hien tai            |
| `POST /api/v1/ltt/{id}/return`  | CHECKER / APPROVER                  | Tuy trang thai hien tai            |
| `GET /api/v1/ltt/*`             | MAKER / CHECKER / APPROVER / VIEWER | PII masking theo quyen             |

### 7.3. Idempotency

```text
Moi POST/PUT/DELETE request phai kem header X-Request-ID (UUID).
ltt-service kiem tra bang IDEMPOTENCY_CACHE:
  - Neu REQUEST_ID da ton tai -> tra response cu (200/201) + warning header
  - Neu chua -> xu ly binh thuong, ghi vao IDEMPOTENCY_CACHE
TTL: 24 gio (cleanup scheduled job)
```

### 7.4. Data Protection

| Quy tac                 | Chi tiet                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **PII Masking**         | CMND/CCCD: chi hien thi 4 ky tu cuoi voi user khong co quyen `VIEW_PII`. So tai khoan tuong tu. BFF thuc hien masking truoc khi tra cho UI. |
| **Soft Delete**         | `IS_DELETED = 'Y'`, khong xoa vat ly. Admin co the restore (DELETED -> DRAFT).                                                              |
| **File Security**       | Attachment: validate MIME type + magic bytes, SHA-256 hash, scan virus.                                                                     |
| **Audit Log Immutable** | Bang `LTT_AUDIT` khong co UPDATE/DELETE grant, chi INSERT + SELECT.                                                                         |

---

## 8. Kiến trúc Frontend (Frontend Architecture)

### 8.1. Micro-frontend Structure

```text
frontend/
├── apps/
│   ├── shell/                    # Host App
│   │   ├── src/
│   │   │   ├── layouts/          # MainLayout, Sidebar, Header
│   │   │   ├── auth/             # Login, JWT refresh, Role guard
│   │   │   ├── navigation/       # Menu config, routing
│   │   │   └── bootstrap.tsx     # Module Federation host
│   │   └── vite.config.ts
│   │
│   └── ltt-ui/                   # Remote App (Micro-frontend)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LttListPage.tsx          # <MOD>.LIST
│       │   │   ├── LttNewPage.tsx           # <MOD>.NEW
│       │   │   ├── LttViewPage.tsx          # <MOD>.VIEW
│       │   │   ├── LttEditPage.tsx          # <MOD>.EDIT
│       │   │   └── LttApprovePage.tsx       # <MOD>.APPROVE
│       │   ├── components/
│       │   │   ├── LttForm/                 # Form dung chung NEW/EDIT
│       │   │   │   ├── GeneralInfoTab.tsx
│       │   │   │   ├── DetailGridTab.tsx    # Khoan muc (12 GL segments)
│       │   │   │   ├── SenderInfoTab.tsx
│       │   │   │   └── ReceiverInfoTab.tsx
│       │   │   ├── LttList/                 # Grid + filter + toolbar
│       │   │   ├── LttApproval/             # Check/Approve form
│       │   │   ├── LttAttachment/           # Upload/Download
│       │   │   ├── LttHistory/              # Audit timeline
│       │   │   └── LttDeleteDialog.tsx      # Popup xac nhan xoa
│       │   ├── hooks/
│       │   │   ├── useLttList.ts            # Fetch + filter + pagination
│       │   │   ├── useLttForm.ts            # Form state + validation
│       │   │   ├── useLttStateMachine.ts    # State-based UI logic
│       │   │   └── useOptimisticLock.ts     # ETag/Version handling
│       │   ├── services/
│       │   │   └── lttApi.ts               # API client (axios)
│       │   ├── types/
│       │   │   └── ltt.types.ts            # TypeScript interfaces
│       │   ├── validators/
│       │   │   └── lttValidator.ts          # VAL-01..VAL-18 rules
│       │   └── bootstrap.tsx               # Module Federation remote
│       └── vite.config.ts
│
└── packages/
    ├── ui-shared/                 # Design system (shadcn/ui wrappers)
    │   ├── components/
    │   │   ├── DataTable.tsx
    │   │   ├── FilterBar.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── AmountDisplay.tsx
    │   │   ├── LookupDialog.tsx
    │   │   └── ConfirmDialog.tsx
    │   └── utils/
    │       ├── formatCurrency.ts
    │       ├── formatDate.ts
    │       └── maskPii.ts
    └── core-utils/
        ├── api/
        │   ├── apiClient.ts       # Axios instance + JWT interceptor
        │   └── errorHandler.ts
        ├── auth/
        │   ├── useAuth.ts
        │   └── roleGuard.ts
        └── state/
            └── queryClient.ts     # TanStack Query config
```

### 8.2. BFF Aggregation cho Frontend

BFF tong hop data tu nhieu service de giam so luong request tu browser:

```text
VIEW screen (LttViewPage):
  BFF GET /api/v1/ltt/{id}
    -> ltt-service: GET /internal/v1/ltt/{id} (header + details + sender + receiver)
    -> audit-service: GET /internal/v1/audit?aggregateId={id}
    -> Merge response: { ltt: {...}, history: [...], approvalStatus: {...} }

LIST screen (LttListPage):
  BFF GET /api/v1/ltt?page=0&size=20&...
    -> ltt-service: GET /internal/v1/ltt?page=0&size=20&...
    -> BFF them: statusLabel (vi), amountFormatted, maskedPii
```

### 8.3. Key Frontend Patterns

| Pattern                   | Ap dung                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| **Module Federation**     | `shell` la host, `ltt-ui` la remote. Lazy-load LTT module khi user navigate vao menu.    |
| **TanStack Query**        | Server state management (caching, background refresh, optimistic updates).               |
| **React Hook Form + Zod** | Form validation dong bo voi backend VAL-\* rules.                                        |
| **State-based UI**        | `useLttStateMachine` hook quyet dinh hien thi/an nut, tab, field dua tren STATUS + role. |
| **Optimistic Lock**       | Moi PUT request kem `If-Match` header = `version`. Xu ly 409 -> prompt reload.           |
| **Keyboard Shortcuts**    | Global hotkey registry trong shell, scoped activation theo page focus.                   |

### 8.4. Routing

```text
/ltt                        -> LttListPage
/ltt/new                    -> LttNewPage
/ltt/:id                    -> LttViewPage
/ltt/:id/edit               -> LttEditPage
/ltt/:id/approve            -> LttApprovePage (role: CHECKER/APPROVER)
/ltt/:id/print              -> LttPrintPage
```

---

## 9. Cross-Cutting Concerns

### 9.1. Notification

Khi state chuyen doi, he thong phat notification:

- **Channel**: In-app (WebSocket / SSE) + Email.
- **Trigger points**: Submit -> notify Checker; Check -> notify Approver; Approve/Reject/Return -> notify Maker.
- **Implementation**: `NotificationPort` (outgoing port), implement boi `NotificationAdapter` goi notification-service hoac truc tiep email.

### 9.2. Concurrent Edit Handling

Su dung optimistic locking ket hop distributed advisory lock:

1. **Optimistic**: Cot `VERSION` (`@Version` JPA). Client gui `If-Match: <version>`. Server reject neu mismatch -> 409 Conflict.
2. **Advisory Lock** (optional cho MVP): Khi user mo form EDIT, acquire soft-lock (`LTT_LOCK` table). Release khi save/cancel. Phat hien conflict -> thong bao user khac dang sua (MSG-ERR-CONCURRENT).

### 9.3. Duplicate Detection (VAL-18)

Truoc khi Submit, kiem tra trong N phut (configurable) co LTT nao cung `(SENDER_CODE + AMOUNT + ORIGINAL_DOC_NO)` khong. Neu co -> tra ve warning `MSG-WRN-DUPLICATE`, client hien thi confirm dialog.

### 9.4. Export (Async)

- Neu ban ghi < 50,000: sync export, tra file truc tiep.
- Neu >= 50,000: async job, tra 202 Accepted + jobId. Client poll status, nhan notification khi xong.

---

## 10. Sequence Diagram -- Luồng Submit -> Approve (Happy Path)

```text
Maker         BFF(8080)    ltt-service(8081)    audit-service(8083)    integration-gw(8082)
  |               |               |                      |                     |
  |--Submit------>|               |                      |                     |
  |               |--POST/submit->|                      |                     |
  |               |               |--Validate (VAL-*)--->|                     |
  |               |               |--State check-------->|                     |
  |               |               |--Save DRAFT->READY----|                     |
  |               |               |--Outbox INSERT--------|                     |
  |               |               |--Audit write--------->|                     |
  |               |<--200 OK------|                      |                     |
  |<--MSG-OK------|               |                      |                     |
  |               |               |                      |                     |
  |   [Outbox Poller publishes event]                    |                     |
  |               |               |--Notify Checker------>|                     |
  |               |               |                      |                     |
  - - - - - Checker actions - - - - - - - - - - - - - - -
  Checker--Check->|--POST/check-->|                      |                     |
  |               |               |--SoD check (OK)----->|                     |
  |               |               |--READY->PENDING------|                     |
  |               |               |--Outbox + Audit----->|                     |
  |               |<--200 OK------|                      |                     |
  |               |               |--Notify Approver----->|                    |
  |               |               |                      |                     |
  - - - - - Approver actions - - - - - - - - - - - - - -
  Approver-Appr->|--POST/approve>|                      |                     |
  |               |               |--SoD check (OK)----->|                     |
  |               |               |--PENDING->APPROVED---|                     |
  |               |               |--Outbox INSERT--------|                     |
  |               |               |--Audit write--------->|--Hash Chain------->|
  |               |<--200 OK------|                      |                     |
  |               |               |                      |                     |
  |   [Saga: Approved -> GL Push]  |                     |                     |
  |               |               |--LTT_APPROVED event----------------------->|
  |               |               |                      |     --MQ Send------>|NHNN
  |               |               |<--ACK--------------------------------------|
  |               |               |--STATUS=TRANSFERRED--|                     |
  |               |               |--STATUS=POSTED-------|                     |
```

---

## 11. Traceability Matrix

Bang tham chieu giua Business Rules (BA spec) va Technical Implementation.

| Business Rule                 | Technical Component                                    | File/Location                                                  |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| BIZ-001 (SoD)                 | `StateTransitionGuard` + DB constraints                | `domain/service/StateTransitionGuard.java` + `03-schema.sql`   |
| BIZ-002 (Owner only)          | `StateTransitionGuard.checkOwnership()`                | `domain/service/StateTransitionGuard.java`                     |
| BIZ-003 (Soft delete)         | `DeletePaymentOrderUseCase` + `IS_DELETED` flag        | `application/port/in/DeletePaymentOrderUseCase.java`           |
| BIZ-004 (Sum detail = header) | `CcidValidator.validateTotal()`                        | `domain/service/CcidValidator.java`                            |
| BIZ-005 (Attachment limit)    | `PaymentOrderApplicationService.validateAttachment()`  | `application/service/PaymentOrderApplicationService.java`      |
| BIZ-006 (Reason length)       | Request DTO validation (`@Size(min=10, max=500)`)      | `infrastructure/web/dto/RejectionRequest.java`                 |
| BIZ-007 (Audit log)           | `AuditEventAdapter` -> `audit-service`                 | `infrastructure/audit/AuditEventAdapter.java`                  |
| BIZ-008 (History tracking)    | JPA auditing (`@CreatedDate`, `@LastModifiedDate`)     | `infrastructure/persistence/entity/PaymentOrderJpaEntity.java` |
| BIZ-009 (Notification)        | `NotificationPort` + Outbox event                      | `application/port/out/NotificationPort.java`                   |
| BIZ-010 (Amount limit)        | `StateTransitionGuard.checkApprovalLimit()`            | `domain/service/StateTransitionGuard.java`                     |
| VAL-01..VAL-18                | Frontend Zod + Backend Bean Validation + Domain guards | `validators/lttValidator.ts` + `domain/service/`               |
| VAL-15 (Optimistic lock)      | `@Version` JPA + `If-Match` header                     | `infrastructure/persistence/entity/PaymentOrderJpaEntity.java` |

---

## Lịch sử Sửa đổi (Audit Log)

- **2026-05-18** | **SA Agent** | FT-001 | Khoi tao thiet ke giai phap: API, DB, State Machine, Saga, Security, Frontend.

# Kiến trúc Hệ thống (Architecture)

## 1. Tech Stack

- **Backend**: Java 17, Spring Boot 3.x.
- **Frontend**: React 18, Vanilla CSS.
- **Database**: Oracle 19c (Sử dụng Schema có sẵn bên dưới).
- **Contract**: OpenAPI 3.0.

## 2. Database Schema (Existing)

_Ghi chú: BA/SA dựa vào đây để ánh xạ nghiệp vụ._

```sql
-- Ví dụ: Bảng lệnh thanh toán
CREATE TABLE LTT_PAYMENT (
    ID NUMBER PRIMARY KEY,
    TRANS_ID VARCHAR2(50) UNIQUE, -- Map với X-Request-ID
    AMOUNT NUMBER(18,2),
    CURRENCY VARCHAR2(3),
    STATUS VARCHAR2(20), -- INIT, PENDING, APPROVED, REJECTED
    MAKER_ID VARCHAR2(50),
    CHECKER_ID VARCHAR2(50),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP
);

-- Bảng Audit Trail
CREATE TABLE AUDIT_LOG (
    ID NUMBER PRIMARY KEY,
    ENTITY_NAME VARCHAR2(50),
    ENTITY_ID NUMBER,
    ACTION VARCHAR2(20),
    PAYLOAD CLOB,
    PREV_HASH VARCHAR2(64),
    CURRENT_HASH VARCHAR2(64),
    CREATED_AT TIMESTAMP
);
```

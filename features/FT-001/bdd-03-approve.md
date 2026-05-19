# BDD-03 — Workflow Phê duyệt (Maker → Checker → Approver)

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-APPROVE (`PAY.OUT.MANUAL.APPROVE`)
**Tham chiếu testcase:** D2.04 (workflow), liên quan toàn bộ State Machine
**Tham chiếu State Machine:** A11 #7, #8, #9, #10, #11, #12
**Tham chiếu Quy tắc:** BIZ-001 (SoD), BIZ-006 (lý do), BIZ-009 (notification)
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Workflow Phê duyệt 3 cấp Maker-Checker-Approver
  Mã tính năng: FT-001 | Luồng: UC-APPROVE
  Mô tả: Checker phê duyệt lệnh ở READY_FOR_APPROVAL → PENDING_APPROVER.
    Approver phê duyệt cuối PENDING_APPROVER → APPROVED.
    Mỗi cấp có quyền Trả lại (RETURNED_TO_MAKER) hoặc Từ chối (REJECTED).
    Ràng buộc SoD (BIZ-001): Maker ≠ Checker ≠ Approver (3 user khác nhau).
  Tham chiếu: spec §A5 (A5, A6), §A11 (#7..#12), §C1 (Phê duyệt/Trả lại/Từ chối),
              BIZ-001, BIZ-006, BIZ-009.

  Background:
    Given hệ thống VDBAS đang hoạt động và kỳ kế toán "05/2026" đang OPEN
    And tồn tại các user:
      | username   | role     | dvqhns  |
      | maker01    | Maker    | 1234567 |
      | checker01  | Checker  | 1234567 |
      | approver01 | Approver | 1234567 |
      | maker02    | Maker    | 1234567 |
    And tồn tại lệnh F-ID="POM-20260519-00200":
      | Trường        | Giá trị             |
      | CREATED_BY    | maker01             |
      | F-STATUS      | READY_FOR_APPROVAL  |
      | AMOUNT        | 500,000,000 VND     |
      | F-VER         | 1                   |

  # ===================================================================
  # @happy-path — Luồng phê duyệt 2 cấp thành công
  # ===================================================================

  @happy-path
  Scenario: Checker phê duyệt cấp 1 thành công (READY_FOR_APPROVAL → PENDING_APPROVER)
    Given "checker01" có quyền "PAY_OUT_CHECKER" đã đăng nhập và mở màn hình "PAY.OUT.MANUAL.APPROVE"
    And "checker01" thấy lệnh F-ID="POM-20260519-00200" trong danh sách chờ duyệt
    When "checker01" chọn lệnh và bấm "Phê duyệt" (phím tắt "F8", sự kiện "PAY.OUT.MANUAL.APPROVE.CHECKER")
    Then hệ thống kiểm tra SoD: CREATED_BY="maker01" ≠ CHECKED_BY="checker01" → PASS (BIZ-001)
    And hệ thống chuyển F-STATUS từ "READY_FOR_APPROVAL" → "PENDING_APPROVER"
    And hệ thống tự set CHECKED_BY="checker01" và CHECKED_DATE = thời gian hiện tại
    And hệ thống gửi notification in-app + email tới Approver phụ trách (BIZ-009)
    And hệ thống hiển thị "MSG-INF-NOTIFY-APPROVER: Đã gửi thông báo đến Người phê duyệt"
    And hệ thống ghi audit "PAY.OUT.MANUAL.APPROVE.CHECKER" với oldValue="READY_FOR_APPROVAL", newValue="PENDING_APPROVER"

  @happy-path
  Scenario: Approver phê duyệt cuối thành công (PENDING_APPROVER → APPROVED)
    Given lệnh F-ID="POM-20260519-00200" đang ở F-STATUS="PENDING_APPROVER"
    And CHECKED_BY="checker01"
    And "approver01" có quyền "PAY_OUT_APPROVER" đã đăng nhập
    When "approver01" mở lệnh và bấm "Phê duyệt" (phím tắt "F9", sự kiện "PAY.OUT.MANUAL.APPROVE.APPROVER")
    Then hệ thống kiểm tra SoD: CREATED_BY ≠ CHECKED_BY ≠ APPROVED_BY="approver01" → PASS
    And hệ thống chuyển F-STATUS → "APPROVED"
    And hệ thống set APPROVED_BY="approver01" và APPROVED_DATE = thời gian hiện tại
    And hệ thống gửi notification tới Maker gốc ("maker01") thông báo lệnh đã duyệt
    And hệ thống ghi audit "PAY.OUT.MANUAL.APPROVE.APPROVER"
    And lệnh trong MVP DỪNG ở trạng thái "APPROVED" (TRANSFERRED_TO_GL / POSTED out of scope MVP)

  @happy-path
  Scenario: Tab "Trạng thái phê duyệt" hiển thị workflow stepper đúng tiến trình
    Given lệnh F-ID="POM-20260519-00200" ở F-STATUS="PENDING_APPROVER"
    And CHECKED_BY="checker01" tại "19/05/2026 10:30:00"
    When "approver01" mở "PAY.OUT.MANUAL.VIEW" và bấm tab "Trạng thái phê duyệt" (Alt+P, sự kiện "PAY.OUT.MANUAL.VIEW.APPROVAL")
    Then hệ thống hiển thị stepper horizontal 3 bước: Maker → Checker → Approver
    And bước "Maker" hiển thị tên "maker01" + thời gian submit + trạng thái "Done"
    And bước "Checker" hiển thị tên "checker01" + thời gian "19/05/2026 10:30:00" + trạng thái "Done"
    And bước "Approver" highlight là "Pending" với tooltip "Đang chờ phê duyệt"

  # ===================================================================
  # @alternative — Trả lại, Từ chối, Vượt hạn mức
  # ===================================================================

  @alternative
  Scenario: Checker trả lại Maker — yêu cầu lý do hợp lệ
    Given "checker01" đang ở "PAY.OUT.MANUAL.APPROVE" với lệnh F-ID="POM-20260519-00200"
    When "checker01" bấm "Trả lại" (phím tắt "Alt+B", sự kiện "PAY.OUT.MANUAL.APPROVE.RETURN")
    Then hệ thống mở popup nhập RETURN_REASON
    When "checker01" nhập RETURN_REASON = "Thiếu chứng từ hợp đồng, vui lòng bổ sung và submit lại"
    And "checker01" bấm "Xác nhận"
    Then hệ thống validate lý do (10 ≤ độ dài ≤ 500 ký tự, BIZ-006) → PASS
    And hệ thống chuyển F-STATUS từ "READY_FOR_APPROVAL" → "RETURNED_TO_MAKER"
    And hệ thống lưu RETURN_REASON vào audit và hiển thị trên form VIEW
    And hệ thống gửi notification tới "maker01" thông báo lệnh bị trả lại kèm lý do
    And hệ thống ghi audit "PAY.OUT.MANUAL.APPROVE.RETURN"

  @alternative
  Scenario: Approver từ chối — khoá giao dịch vĩnh viễn
    Given lệnh F-ID="POM-20260519-00200" ở F-STATUS="PENDING_APPROVER"
    When "approver01" bấm "Từ chối" (phím tắt "Alt+J", sự kiện "PAY.OUT.MANUAL.APPROVE.REJECT")
    Then hệ thống mở popup nhập REJECT_REASON
    When "approver01" nhập REJECT_REASON = "Nghiệp vụ không hợp lệ, không phê duyệt"
    And "approver01" bấm "Xác nhận"
    Then hệ thống chuyển F-STATUS → "REJECTED"
    And hệ thống khoá giao dịch (không cho Sửa/Xoá/Resubmit)
    And hệ thống gửi notification tới "maker01"
    And bước "Approver" trong stepper hiển thị trạng thái "Rejected" với màu đỏ + tooltip lý do

  @alternative @VAL-12 @BIZ-010
  Scenario: Vượt hạn mức — cảnh báo phê duyệt cấp cao hơn (giữ flag OVER_LIMIT)
    Given hạn mức cấu hình cho Approver thông thường là "100,000,000 VND"
    And lệnh F-ID="POM-20260519-00200" có AMOUNT = "500,000,000 VND" (vượt hạn mức)
    When "approver01" mở lệnh
    Then hệ thống hiển thị warning vàng "MSG-WRN-LIMIT: Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn"
    When "approver01" vẫn bấm "Phê duyệt" (theo INC-A-02 phương án đơn giản: cho duyệt với flag)
    Then hệ thống cho phép APPROVED nhưng ghi audit với flag "OVER_LIMIT=true"
    And audit log lưu cảnh báo để kiểm toán nội bộ

  # ===================================================================
  # @exception — SoD, Permission, State
  # ===================================================================

  @exception @BIZ-001 @SoD
  Scenario: Vi phạm SoD — Maker không được tự duyệt lệnh của mình
    Given "maker01" có cả role "Maker" và "Checker" (đa vai trò)
    And lệnh F-ID="POM-20260519-00200" có CREATED_BY="maker01", F-STATUS="READY_FOR_APPROVAL"
    When "maker01" cố gắng mở "PAY.OUT.MANUAL.APPROVE" và bấm "Phê duyệt" lệnh do chính mình tạo
    Then hệ thống chặn theo BIZ-001 (action-based, INC-G-17): created_by ≠ checked_by
    And hệ thống hiển thị "MSG-ERR-PERMISSION: Bạn không có quyền thực hiện thao tác này" với tooltip "Vi phạm Separation of Duties — bạn là người lập"
    And hệ thống ghi audit bảo mật action="SOD_VIOLATION"

  @exception @BIZ-001 @SoD
  Scenario: Vi phạm SoD — Checker không được duyệt cuối lệnh mình đã kiểm soát
    Given lệnh F-ID="POM-20260519-00200" có CHECKED_BY="checker01", F-STATUS="PENDING_APPROVER"
    And "checker01" cũng có vai trò "Approver" (đa vai trò)
    When "checker01" cố bấm "Phê duyệt" cuối
    Then hệ thống chặn: checked_by ≠ approved_by → vi phạm
    And hệ thống hiển thị "MSG-ERR-PERMISSION" + tooltip "Vi phạm SoD — bạn đã kiểm soát lệnh này"
    And ghi audit bảo mật

  @exception @VAL-13
  Scenario Outline: Checker/Approver chỉ thao tác được trên trạng thái hợp lệ
    Given lệnh ở F-STATUS="<status>"
    When "<user>" cố bấm "<action>"
    Then nút "<action>" bị disable hoặc API reject
    And hệ thống hiển thị "MSG-ERR-STATUS: Giao dịch đang ở trạng thái [<status>], không cho phép Sửa/Xoá"

    Examples:
      | status              | user       | action            |
      | DRAFT               | checker01  | Phê duyệt (F8)    |
      | DRAFT               | approver01 | Phê duyệt (F9)    |
      | READY_FOR_APPROVAL  | approver01 | Phê duyệt (F9)    |
      | APPROVED            | checker01  | Trả lại (Alt+B)   |
      | REJECTED            | approver01 | Phê duyệt (F9)    |
      | RETURNED_TO_MAKER   | checker01  | Phê duyệt (F8)    |

  @exception @BIZ-006
  Scenario Outline: Return/Reject thất bại — lý do không đủ độ dài
    Given "checker01" đang ở popup "Trả lại" cho lệnh F-ID="POM-20260519-00200"
    When "checker01" nhập RETURN_REASON = "<reason>" và bấm "Xác nhận"
    Then hệ thống chặn submit
    And hệ thống hiển thị "<message>"

    Examples:
      | reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | message                                                                  |
      | abc                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | MSG-ERR-DELETE-CFM (tương tự): Vui lòng nhập lý do ≥ 10 ký tự            |
      | (rỗng)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | MSG-ERR-REQUIRED: Vui lòng nhập Lý do trả lại                            |
      | LongReasonExceeding500CharactersAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEnd | MSG-ERR-RANGE: Lý do nằm ngoài phạm vi cho phép (10–500 ký tự)           |

  @exception
  Scenario: Concurrent — 2 Checker cùng phê duyệt 1 lệnh
    Given "checker01" và "checker02" cùng mở lệnh F-ID="POM-20260519-00200" tại thời điểm T1
    When "checker01" bấm "Phê duyệt" tại T2, hệ thống chuyển F-STATUS sang "PENDING_APPROVER" và F-VER+1
    And "checker02" bấm "Phê duyệt" tại T3 (sau T2)
    Then hệ thống phát hiện F-STATUS hiện tại ≠ "READY_FOR_APPROVAL"
    And hệ thống chặn action của "checker02", hiển thị "MSG-ERR-STATUS" hoặc "MSG-ERR-LOCK"
    And ghi audit "PAY.OUT.MANUAL.LOCK.CONFLICT"

  @exception
  Scenario: Maker bấm "Gửi kiểm soát" lại trên lệnh đã READY_FOR_APPROVAL — chặn double-submit
    Given lệnh F-ID="POM-20260519-00200" đã ở "READY_FOR_APPROVAL"
    When "maker01" cố bấm "Gửi kiểm soát" lần nữa (có thể do double-click)
    Then client disable nút ngay sau click đầu tiên
    And server kiểm tra idempotency key + F-STATUS → reject request thứ 2
    And hệ thống hiển thị "MSG-ERR-STATUS"
```

---

## Tổng kết scenarios — bdd-03-approve.md

| Tầng         | Số lượng                   |
| ------------ | -------------------------- |
| @happy-path  | 3                          |
| @alternative | 3                          |
| @exception   | 5 (gồm 2 Scenario Outline) |
| **Tổng**     | **11 scenarios**           |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-APPROVE (Maker-Checker-Approver) với 11 scenarios.

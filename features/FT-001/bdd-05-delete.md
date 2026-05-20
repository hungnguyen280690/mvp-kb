# BDD-05 — Xoá lệnh thanh toán (Soft Delete)

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-DELETE (`PAY.OUT.MANUAL.DELETE`)
**Tham chiếu testcase:** D4 — Nhóm 4 Xoá (TC.4.01 → TC.4.06)
**Tham chiếu State Machine:** A11 #6
**Tham chiếu Quy tắc:** BIZ-002, BIZ-003, BIZ-006, BIZ-007, VAL-13, VAL-14, VAL-16
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Xoá lệnh thanh toán (Soft Delete)
  Mã tính năng: FT-001 | Luồng: UC-DELETE
  Mô tả: Maker gốc thực hiện xoá mềm (F-STATUS=DELETED) trên lệnh
    ở DRAFT hoặc RETURNED_TO_MAKER. Bắt buộc nhập lý do (10-500 ký tự)
    + tick checkbox xác nhận. Bản ghi vẫn truy được qua audit/history.
  Tham chiếu: spec §A4 bước 9-10, §A11 #6, §B3.1, §C1 #8, #9,
              §D4 (TC.4.01 → TC.4.06).

  Background:
    Given hệ thống VDBAS đang hoạt động và kỳ kế toán "05/2026" đang OPEN
    And người dùng "maker01" có vai trò "Maker" đã đăng nhập VDBAS
    And tồn tại lệnh F-ID="POM-20260519-00300":
      | Trường        | Giá trị             |
      | REF_NO        | CT-202605-00300     |
      | CREATED_BY    | maker01             |
      | F-STATUS      | DRAFT               |
      | AMOUNT        | 5,000,000 VND       |
      | F-VER         | 1                   |

  # ===================================================================
  # @happy-path
  # ===================================================================

  @happy-path @TC-4.01
  Scenario: Maker xoá thành công lệnh ở DRAFT — soft delete
    Given "maker01" đang ở "PAY.OUT.MANUAL.LIST" và chọn lệnh F-ID="POM-20260519-00300"
    When "maker01" bấm "Xoá" (phím tắt "Delete", sự kiện "PAY.OUT.MANUAL.DELETE.OPEN")
    Then hệ thống mở popup "PAY.OUT.MANUAL.DELETE" với các trường:
      | Trường              | Giá trị mặc định       |
      | REF_NO              | CT-202605-00300 (read) |
      | ORDER_TYPE          | (read-only)            |
      | AMOUNT              | 5,000,000 VND (read)   |
      | F-STATUS            | DRAFT (read-only)      |
      | DELETE_REASON       | (rỗng, bắt buộc)       |
      | CONFIRM_REVIEWED    | Off (bắt buộc tick)    |
    And nút "Xác nhận xoá" ban đầu bị disable (VAL-16)
    When "maker01" nhập DELETE_REASON = "Lệnh nhập sai số tài khoản, cần huỷ" (40 ký tự)
    And "maker01" tick checkbox CONFIRM_REVIEWED
    Then nút "Xác nhận xoá" chuyển sang enable
    When "maker01" bấm "Xác nhận xoá" (Enter, sự kiện "PAY.OUT.MANUAL.DELETE.CONFIRM")
    Then hệ thống thực hiện soft-delete: F-STATUS → "DELETED"
    And hệ thống set DELETED_BY="maker01" và DELETED_DATE = thời gian hiện tại
    And hệ thống lưu DELETE_REASON vào audit
    And hệ thống ghi audit "PAY.OUT.MANUAL.DELETE.CONFIRM" với oldValue=full snapshot, newValue=null (theo INC-A-18)
    And hệ thống hiển thị "MSG-OK-DELETE: Xoá giao dịch thành công"
    And lệnh bị ẩn khỏi LIST mặc định (DELETED không hiển thị trừ khi tick)

  @happy-path
  Scenario: Maker xoá thành công lệnh RETURNED_TO_MAKER
    Given lệnh F-ID="POM-20260519-00301" có F-STATUS="RETURNED_TO_MAKER", CREATED_BY="maker01"
    When "maker01" mở popup Xoá, nhập DELETE_REASON = "Huỷ vì không còn nhu cầu chi"
    And tick CONFIRM_REVIEWED, bấm "Xác nhận xoá"
    Then hệ thống soft-delete thành công, F-STATUS → "DELETED"
    And hiển thị MSG-OK-DELETE

  @happy-path @TC-4.06
  Scenario: Bản ghi đã xoá vẫn truy được qua Audit Log
    Given lệnh F-ID="POM-20260519-00300" đã bị xoá (F-STATUS="DELETED")
    When Admin truy vấn audit log với entity_id="POM-20260519-00300"
    Then audit log trả về entry với:
      | Trường       | Giá trị                                              |
      | action       | DELETE                                               |
      | user_id      | maker01                                              |
      | timestamp    | (thời điểm xoá)                                      |
      | ip           | (IP của maker01)                                     |
      | old_value    | snapshot toàn bộ object trước khi xoá                |
      | new_value    | null                                                 |
      | reason       | "Lệnh nhập sai số tài khoản, cần huỷ"                |
    And BIZ-003: bản ghi vẫn truy được, BIZ-007: audit đầy đủ

  # ===================================================================
  # @alternative
  # ===================================================================

  @alternative
  Scenario: Maker huỷ popup Xoá khi đã nhập lý do
    Given popup Xoá đang mở và "maker01" đã nhập DELETE_REASON
    When "maker01" bấm nút "Huỷ" hoặc phím "Esc"
    Then hệ thống đóng popup, KHÔNG xoá lệnh
    And lệnh vẫn ở F-STATUS="DRAFT" và dữ liệu nguyên vẹn
    And không có audit entry được tạo

  @alternative
  Scenario: Admin xem lại lệnh DELETED bằng cách tick filter DELETED
    Given lệnh F-ID="POM-20260519-00300" đã ở F-STATUS="DELETED"
    And "admin01" có quyền xem DELETED
    When "admin01" mở LIST, mở dropdown F-STATUS, tick "DELETED"
    And bấm "Tìm kiếm"
    Then danh sách hiển thị lệnh DELETED với badge xám đậm
    And "admin01" có thể click REF_NO để xem chi tiết VIEW (read-only, hiển thị thêm DELETED_BY, DELETED_DATE, DELETE_REASON)

  # ===================================================================
  # @exception
  # ===================================================================

  @exception @TC-4.02 @VAL-13
  Scenario Outline: Chặn Xoá khi F-STATUS không cho phép
    Given lệnh F-ID="POM-20260519-00310" có F-STATUS="<status>", CREATED_BY="maker01"
    When "maker01" mở LIST và chọn lệnh
    Then nút "Xoá" bị disable
    And tooltip hiển thị "MSG-ERR-STATUS: Giao dịch đang ở trạng thái [<status>], không cho phép Sửa/Xoá"
    When "maker01" cố gọi trực tiếp API DELETE
    Then backend reject, hiển thị MSG-ERR-STATUS và ghi audit bảo mật

    Examples:
      | status              |
      | READY_FOR_APPROVAL  |
      | PENDING_APPROVER    |
      | APPROVED            |
      | REJECTED            |
      | DELETED             |

  @exception @TC-4.03 @VAL-14
  Scenario: Chặn Xoá khi không phải Maker gốc
    Given lệnh F-ID="POM-20260519-00300" có CREATED_BY="maker01", F-STATUS="DRAFT"
    And người dùng "maker02" (cũng Maker) đã đăng nhập
    When "maker02" chọn lệnh và xem nút Xoá
    Then nút "Xoá" bị disable
    And tooltip "MSG-ERR-MAKER: Chỉ Người lập gốc mới được phép Sửa/Xoá"
    When "maker02" cố gọi trực tiếp API DELETE với F-ID này
    Then backend reject với MSG-ERR-MAKER
    And ghi audit bảo mật action="UNAUTHORIZED_DELETE"

  @exception @TC-4.04 @VAL-16
  Scenario Outline: Lý do xoá vi phạm độ dài (10 ≤ length ≤ 500)
    Given "maker01" đã mở popup Xoá
    When "maker01" nhập DELETE_REASON = "<reason>" có độ dài <length> ký tự
    And tick CONFIRM_REVIEWED
    Then nút "Xác nhận xoá" "<button_state>"
    And nếu submit thì hệ thống hiển thị "<message>"

    Examples:
      | reason            | length | button_state         | message                                                       |
      | abc               | 3      | disable              | MSG-ERR-DELETE-CFM: Vui lòng nhập lý do (≥ 10 ký tự)          |
      | rỗng              | 0      | disable              | MSG-ERR-REQUIRED: Vui lòng nhập Lý do xoá                     |
      | (chuỗi 501 ký tự) | 501    | disable hoặc reject  | MSG-ERR-RANGE: Lý do nằm ngoài phạm vi cho phép (10–500)      |
      | đủ 10 ký tự ABC   | 13     | enable               | (không lỗi, cho phép xoá)                                     |

  @exception @TC-4.05 @VAL-16
  Scenario: Chưa tick checkbox xác nhận — chặn xoá
    Given "maker01" đã mở popup Xoá và nhập DELETE_REASON = "Lý do hợp lệ ≥ 10 ký tự"
    And CONFIRM_REVIEWED vẫn ở trạng thái Off (chưa tick)
    Then nút "Xác nhận xoá" vẫn bị disable
    When "maker01" cố submit qua keyboard Enter
    Then hệ thống chặn, hiển thị MSG-ERR-DELETE-CFM (yêu cầu tick checkbox)

  @exception
  Scenario: Phiên hết hạn trước khi xác nhận xoá
    Given "maker01" đã mở popup Xoá hơn 30 phút và phiên hết hạn
    When "maker01" bấm "Xác nhận xoá"
    Then hệ thống chặn, hiển thị "MSG-ERR-SESSION: Phiên đăng nhập đã hết hạn"
    And redirect đăng nhập, không thực hiện xoá

  @exception
  Scenario: Double-submit xoá — chặn bằng idempotency key
    Given popup Xoá đang mở, đủ điều kiện submit
    When "maker01" bấm "Xác nhận xoá" 2 lần liên tiếp (double-click)
    Then client disable nút sau click đầu tiên
    And server kiểm tra idempotency key (X-Idempotency-Key) → request thứ 2 trả về same response, KHÔNG xoá lại
    And chỉ có 1 audit entry được ghi
```

---

## Tổng kết scenarios — bdd-05-delete.md

| Tầng         | Số lượng                   |
| ------------ | -------------------------- |
| @happy-path  | 3                          |
| @alternative | 2                          |
| @exception   | 6 (gồm 2 Scenario Outline) |
| **Tổng**     | **11 scenarios**           |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-DELETE với 11 scenarios.

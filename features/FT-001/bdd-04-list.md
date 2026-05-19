# BDD-04 — Danh sách lệnh thanh toán (List + Filter + Search)

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-LIST (`PAY.OUT.MANUAL.LIST`)
**Tham chiếu testcase:** D2.01 (View), D1/D3/D4 (action trên LIST)
**Tham chiếu Spec:** §B2 (B2.1, B2.2, B2.3), §A10 events #1, #2
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Danh sách lệnh thanh toán, lọc và tra cứu
  Mã tính năng: FT-001 | Luồng: UC-LIST
  Mô tả: Hiển thị danh sách lệnh, hỗ trợ filter theo nhiều tiêu chí,
    sort, phân trang, hiển thị tổng tiền theo loại tiền, và truy cập
    các thao tác Xem/Sửa/Xoá/Sao chép/Submit/Phê duyệt theo VAL-13/14.
  Tham chiếu: spec §B2.1, §B2.2, §B2.3, §A10 #1, #2,
              §C1 #5, #12.

  Background:
    Given hệ thống VDBAS đang hoạt động
    And người dùng "viewer01" có vai trò "Viewer" đã đăng nhập VDBAS
    And tồn tại 35 lệnh trong DB với các trạng thái:
      | F-STATUS              | Số lượng |
      | DRAFT                 | 5        |
      | READY_FOR_APPROVAL    | 8        |
      | PENDING_APPROVER      | 6        |
      | APPROVED              | 10       |
      | RETURNED_TO_MAKER     | 3        |
      | REJECTED              | 2        |
      | DELETED               | 1        |
    And "viewer01" đang ở màn hình "PAY.OUT.MANUAL.LIST"

  # ===================================================================
  # @happy-path
  # ===================================================================

  @happy-path
  Scenario: Mở LIST mặc định — ẩn DELETED, sort theo CREATED_DATE DESC, page size 20
    When "viewer01" mở "PAY.OUT.MANUAL.LIST" (sự kiện "PAY.OUT.MANUAL.LIST.VIEW")
    Then hệ thống tự áp dụng bộ lọc mặc định:
      | Filter        | Giá trị mặc định           |
      | FROM_DATE     | Ngày hiện tại − 7          |
      | TO_DATE       | Ngày hiện tại              |
      | DATE_FIELD    | Ngày lập                   |
      | F-STATUS      | Tất cả trừ DELETED         |
    And hệ thống trả về 34 bản ghi (35 trừ 1 DELETED)
    And mặc định sort theo CREATED_DATE DESC
    And page size mặc định = 20 (trang đầu)
    And footer hiển thị "Số bản ghi: 34" và "Tổng số tiền: <theo từng loại tiền>"
    And cột "Trạng thái" hiển thị badge màu:
      | F-STATUS              | Màu badge |
      | APPROVED              | Xanh      |
      | PENDING_APPROVER      | Vàng      |
      | READY_FOR_APPROVAL    | Vàng      |
      | DRAFT                 | Xám       |
      | REJECTED              | Đỏ        |
      | RETURNED_TO_MAKER     | Cam       |

  @happy-path
  Scenario: Filter theo Trạng thái + khoảng số tiền — kết quả khớp
    Given "viewer01" đang ở "PAY.OUT.MANUAL.LIST"
    When "viewer01" chọn F-STATUS multi-select = ["APPROVED", "PENDING_APPROVER"]
    And "viewer01" nhập AMOUNT_FROM = "1,000,000" và AMOUNT_TO = "10,000,000"
    And "viewer01" nhập FROM_DATE = "01/05/2026", TO_DATE = "19/05/2026"
    And "viewer01" bấm "Tìm kiếm" (hoặc Enter, sự kiện "PAY.OUT.MANUAL.LIST.FILTER")
    Then hệ thống trả về danh sách chỉ chứa các lệnh có:
      | Điều kiện                                                   |
      | F-STATUS ∈ {APPROVED, PENDING_APPROVER}                     |
      | 1,000,000 ≤ AMOUNT ≤ 10,000,000                             |
      | CREATED_DATE giữa 01/05/2026 và 19/05/2026                  |
    And footer cập nhật "Số bản ghi" và "Tổng số tiền" theo kết quả mới

  @happy-path
  Scenario: Click link REF_NO mở chi tiết VIEW
    Given danh sách hiển thị lệnh có REF_NO="CT-202605-00010"
    When "viewer01" click vào link REF_NO
    Then hệ thống mở form "PAY.OUT.MANUAL.VIEW" ở chế độ read-only (sự kiện "PAY.OUT.MANUAL.VIEW.OPEN")
    And hiển thị đầy đủ 4 tab thông tin + tab Đính kèm + tab Lịch sử + tab Trạng thái phê duyệt

  # ===================================================================
  # @alternative
  # ===================================================================

  @alternative
  Scenario: Search theo REF_NO (chính xác)
    Given tồn tại lệnh REF_NO="CT-202605-00007"
    When "viewer01" nhập vào ô filter REF_NO = "CT-202605-00007" và bấm Tìm kiếm
    Then hệ thống trả về đúng 1 bản ghi khớp chính xác
    And footer hiển thị "Số bản ghi: 1"

  @alternative
  Scenario: Lookup SENDER bằng phím tắt F4
    Given "viewer01" đang focus vào ô filter SENDER
    When "viewer01" nhấn phím "F4"
    Then hệ thống mở popup "PAY.OUT.MANUAL.LOOKUP.BANK"
    When "viewer01" tìm theo CODE chứa "NH001" và chọn một dòng
    Then popup đóng, ô SENDER được điền giá trị đã chọn
    And danh sách LIST tự refresh nếu auto-search được bật

  @alternative
  Scenario: Multi-select trạng thái — chọn bao gồm DELETED (chỉ user có quyền)
    Given "admin01" có vai trò "Supervisor" / "Admin" đã đăng nhập
    When "admin01" mở dropdown F-STATUS
    Then dropdown hiển thị option "DELETED" KHÔNG tick mặc định
    When "admin01" tick "DELETED" + "APPROVED"
    And bấm "Tìm kiếm"
    Then danh sách hiển thị cả lệnh DELETED và APPROVED
    And badge DELETED hiển thị màu xám đậm với strikethrough

  @alternative
  Scenario: Đặt lại bộ lọc về mặc định (Reset)
    Given "viewer01" đã thay đổi nhiều filter
    When "viewer01" bấm "Đặt lại" (phím tắt "F5" hoặc "Ctrl+R")
    Then tất cả filter trở về giá trị mặc định (xem @happy-path đầu tiên)
    And danh sách tự refresh

  @alternative
  Scenario: Đổi page size sang 100 và sort theo AMOUNT giảm dần
    Given danh sách đang hiển thị 20 bản ghi/trang
    When "viewer01" đổi page size sang "100"
    And "viewer01" click header cột "AMOUNT" để sort DESC
    Then hệ thống hiển thị tối đa 100 bản ghi/trang
    And bản ghi sắp xếp theo AMOUNT giảm dần
    And cột AMOUNT có icon mũi tên xuống chỉ chiều sort

  @alternative
  Scenario: Nút thao tác trên dòng theo VAL-13/14
    Given dòng lệnh F-ID="POM-20260519-00100" có F-STATUS="DRAFT", CREATED_BY="maker01"
    And người dùng "maker01" đang xem LIST
    Then cột "Thao tác" hiển thị các icon enable: Xem (F3), Sửa (F2), Xoá (Delete), Sao chép (Ctrl+Shift+C), Gửi kiểm soát (F9)
    Given người dùng "maker02" (Maker khác) đang xem LIST
    Then cột "Thao tác" của dòng đó chỉ hiển thị Xem, Sao chép enable; các icon Sửa/Xoá/Submit bị disable kèm tooltip MSG-ERR-MAKER

  # ===================================================================
  # @exception
  # ===================================================================

  @exception
  Scenario: FROM_DATE > TO_DATE — chặn tìm kiếm
    When "viewer01" nhập FROM_DATE = "20/05/2026" và TO_DATE = "10/05/2026"
    And bấm "Tìm kiếm"
    Then hệ thống chặn submit filter
    And hệ thống hiển thị "MSG-ERR-CROSS-FIELD: Từ ngày và Đến ngày không hợp lệ: Từ ngày phải ≤ Đến ngày"

  @exception
  Scenario: Khoảng thời gian vượt 90 ngày — cảnh báo
    When "viewer01" nhập FROM_DATE = "01/01/2026" và TO_DATE = "19/05/2026" (≈ 139 ngày)
    And bấm "Tìm kiếm"
    Then hệ thống hiển thị warning "Khoảng thời gian vượt 90 ngày, có thể chậm. Vui lòng thu hẹp"
    And vẫn cho phép tiếp tục nhưng cap dataset ở 50.000 bản ghi (MVP, theo INC-A-07)

  @exception
  Scenario: AMOUNT_FROM > AMOUNT_TO — chặn tìm kiếm
    When "viewer01" nhập AMOUNT_FROM = "10,000,000" và AMOUNT_TO = "1,000,000"
    And bấm "Tìm kiếm"
    Then hệ thống chặn submit
    And hệ thống hiển thị "MSG-ERR-CROSS-FIELD: Số tiền từ và Số tiền đến không hợp lệ: Số tiền đến phải ≥ Số tiền từ"

  @exception @VAL-03
  Scenario: Lookup BANK trả về giá trị không nằm trong danh mục (manual nhập)
    Given "viewer01" focus ô SENDER
    When "viewer01" nhập tay "NH-INVALID-999" (không có trong LOV.02)
    And blur khỏi ô
    Then hệ thống validate, hiển thị "MSG-ERR-LOOKUP: Giá trị không nằm trong danh mục"
    And hệ thống clear ô SENDER

  @exception
  Scenario: User không có quyền truy cập LIST
    Given người dùng "guest01" KHÔNG có bất kỳ role nào trong {Maker, Checker, Approver, Viewer, Supervisor}
    When "guest01" cố truy cập URL "PAY.OUT.MANUAL.LIST"
    Then hệ thống chặn truy cập
    And hệ thống hiển thị "MSG-ERR-PERMISSION: Bạn không có quyền thực hiện thao tác này"
    And ghi audit bảo mật action="UNAUTHORIZED_LIST_ACCESS"

  @exception
  Scenario: Phiên hết hạn khi đang tải LIST
    Given "viewer01" để màn hình LIST mở quá 30 phút không tương tác
    When "viewer01" bấm "Tìm kiếm"
    Then hệ thống phát hiện session timeout (sự kiện "PAY.OUT.MANUAL.SESSION.TIMEOUT")
    And hệ thống hiển thị "MSG-ERR-SESSION: Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
    And redirect về trang đăng nhập
```

---

## Tổng kết scenarios — bdd-04-list.md

| Tầng         | Số lượng         |
| ------------ | ---------------- |
| @happy-path  | 3                |
| @alternative | 5                |
| @exception   | 6                |
| **Tổng**     | **14 scenarios** |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-LIST với 14 scenarios.

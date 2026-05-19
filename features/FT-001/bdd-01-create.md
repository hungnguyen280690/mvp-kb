# BDD-01 — Tạo lệnh thanh toán đi thủ công

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-CREATE (`PAY.OUT.MANUAL.NEW`)
**Tham chiếu testcase:** D1 — Nhóm 1 Tạo mới (TC.1.01 → TC.1.14)
**Tham chiếu State Machine:** A11 #1, #2, #3, #5
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Tạo lệnh thanh toán đi thủ công
  Mã tính năng: FT-001 | Luồng: UC-CREATE
  Mô tả: Maker mở form Thêm mới, nhập đủ trường ở 4 tab
    (Thông tin chung / Khoản mục / Người chuyển / Người nhận),
    Lưu nháp (DRAFT) hoặc Gửi kiểm soát (READY_FOR_APPROVAL).
  Tham chiếu: spec §A4, §A11 (#1, #2, #5), §C1 (#1, #2, #3, #4),
              §D1 (TC.1.01 → TC.1.14).

  Background:
    Given hệ thống VDBAS đang hoạt động và kỳ kế toán hiện tại "05/2026" đang OPEN
    And Master Data LOV.01..LOV.07 đã được cấu hình đầy đủ
    And cấu hình CCID Cross-Validation Rules đã sẵn sàng
    And người dùng "maker01" có vai trò "Maker" với quyền "PAY_OUT_MAKER" đã đăng nhập VDBAS qua SSO/MFA
    And người dùng "maker01" đang ở màn hình "PAY.OUT.MANUAL.LIST"

  # ===================================================================
  # @happy-path — Luồng chính thành công
  # ===================================================================

  @happy-path @TC-1.01
  Scenario: Maker tạo và Lưu nháp thành công lệnh thanh toán hợp lệ
    Given Maker đã bấm nút "Tạo mới" (sự kiện "PAY.OUT.MANUAL.NEW.OPEN")
    And hệ thống đã sinh F-ID preview, đặt F-VER=1, F-STATUS="DRAFT"
    And hệ thống đã tự điền CREATED_BY="maker01" và CREATED_DATE theo thời gian hiện tại
    When Maker nhập các trường ở Tab "Thông tin chung":
      | Trường           | Giá trị                       |
      | CHANNEL          | Liên ngân hàng                |
      | ORDER_TYPE       | Lệnh chuyển khoản             |
      | REF_NO           | CT-202605-00001               |
      | RECEIVER         | NH001-CN-HANOI                |
      | CURRENCY_CODE    | VND                           |
      | DESCRIPTION      | Thanh toán chi thường xuyên T5|
    And Maker nhập 1 dòng ở Tab "Thông tin khoản mục" với LINE_AMOUNT="1,000,000" và CCID hợp lệ
    And AMOUNT header tự tổng thành "1,000,000" theo VAL-07
    And Maker nhập đầy đủ Tab "Người chuyển" và "Người nhận"
    And Maker bấm nút "Lưu nháp" (phím tắt "Ctrl+Shift+S", sự kiện "PAY.OUT.MANUAL.NEW.SAVE")
    Then hệ thống chỉ validate định dạng (bỏ qua validate đầy đủ) theo luồng A1
    And hệ thống lưu bản ghi với F-STATUS="DRAFT", F-VER=1
    And hệ thống hiển thị thông báo "MSG-OK-SAVE: Lưu giao dịch thành công"
    And hệ thống ghi audit "PAY.OUT.MANUAL.AUDIT.WRITE" với oldValue=null và newValue=snapshot toàn bộ object

  @happy-path @TC-1.12
  Scenario: Maker Gửi kiểm soát thành công lệnh ở trạng thái DRAFT
    Given tồn tại lệnh F-ID="POM-20260519-00001" ở F-STATUS="DRAFT" do "maker01" tạo
    And toàn bộ trường bắt buộc đã được nhập đầy đủ trên 4 tab
    And SUM(LINE_AMOUNT) = AMOUNT (khớp tuyệt đối, tolerance=0)
    And tổ hợp segment COA của mọi dòng chi tiết đã PASS CCID (VAL-19)
    When Maker mở lệnh và bấm nút "Gửi kiểm soát" (phím tắt "F9", sự kiện "PAY.OUT.MANUAL.NEW.SUBMIT")
    Then hệ thống thực hiện validate đầy đủ tất cả VAL-01 đến VAL-19
    And hệ thống chuyển F-STATUS từ "DRAFT" → "READY_FOR_APPROVAL"
    And hệ thống gửi notification in-app + email tới Checker phụ trách (BIZ-009)
    And hệ thống hiển thị thông báo "MSG-OK-SUBMIT: Đã gửi giao dịch để kiểm soát/phê duyệt"
    And hệ thống hiển thị "MSG-INF-NOTIFY-CHECKER: Đã gửi thông báo đến Người kiểm soát"
    And hệ thống ghi audit với action="SUBMIT", oldValue="DRAFT", newValue="READY_FOR_APPROVAL"

  @happy-path @TC-1.13
  Scenario: Maker huỷ form sau khi đã nhập dữ liệu, có xác nhận
    Given Maker đã mở form "PAY.OUT.MANUAL.NEW" và đã nhập một số trường
    When Maker bấm nút "Huỷ" (phím tắt "Esc", sự kiện "PAY.OUT.MANUAL.NEW.CANCEL")
    Then hệ thống hiển thị popup xác nhận "MSG-CFM-CANCEL: Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?"
    When Maker xác nhận "Đồng ý"
    Then hệ thống đóng form và bỏ toàn bộ thay đổi
    And hệ thống KHÔNG sinh bản ghi DB (vì chưa từng Save)

  # ===================================================================
  # @alternative — Luồng rẽ nhánh
  # ===================================================================

  @alternative @TC-1.11
  Scenario: Lưu nháp thành công ngay cả khi chưa nhập đủ trường bắt buộc
    Given Maker đã mở form "PAY.OUT.MANUAL.NEW"
    And Maker mới chỉ nhập REF_NO và DESCRIPTION, còn nhiều trường bắt buộc bỏ trống
    When Maker bấm "Lưu nháp" (Ctrl+Shift+S)
    Then hệ thống bỏ qua validate VAL-01 (Mandatory) theo luồng thay thế A1
    And hệ thống vẫn chạy VAL-02 (Format), VAL-10 (XSS/SQLi)
    And hệ thống lưu DRAFT thành công với MSG-OK-SAVE

  @alternative @TC-1.14
  Scenario: Cảnh báo trùng giao dịch — Maker chọn Tiếp tục
    Given trong 30 phút gần nhất đã tồn tại lệnh có cùng SENDER + AMOUNT + ORIGIN_NUM với lệnh đang lập
    When Maker bấm "Gửi kiểm soát"
    Then hệ thống hiển thị "MSG-WRN-DUPLICATE: Phát hiện giao dịch tương tự đã được lập gần đây. Bạn có muốn tiếp tục?"
    And hệ thống hiển thị 2 nút "Tiếp tục" / "Huỷ"
    When Maker chọn "Tiếp tục"
    Then hệ thống cho phép submit, chuyển F-STATUS → "READY_FOR_APPROVAL"
    And hệ thống ghi audit với flag "DUPLICATE_OVERRIDE=true"

  @alternative
  Scenario: Tự tính AMOUNT header theo SUM(LINE_AMOUNT)
    Given Maker đang ở form "PAY.OUT.MANUAL.NEW", Tab "Thông tin khoản mục"
    When Maker thêm 3 dòng khoản mục với LINE_AMOUNT lần lượt 100,000 / 200,000 / 300,000
    Then trường AMOUNT ở Tab "Thông tin chung" tự cập nhật thành "600,000"
    And footer Tab "Khoản mục" hiển thị "Tổng số dòng: 3, Tổng số tiền dòng: 600,000"
    And không hiển thị MSG-WRN-AMOUNT-MISMATCH (vì SUM khớp AMOUNT)

  @alternative
  Scenario: Chọn Channel = Liên kho bạc — ORDER_TYPE bị disable
    Given Maker đang ở form "PAY.OUT.MANUAL.NEW"
    When Maker chọn CHANNEL = "Liên kho bạc"
    Then trường ORDER_TYPE chuyển sang trạng thái mờ (disabled), không cho phép chọn
    And trường LNH_TRANSACTION_TYPE bị ẩn (chỉ hiển thị khi CHANNEL = "Liên ngân hàng")
    And hệ thống KHÔNG yêu cầu ORDER_TYPE là bắt buộc (theo INC-G-16: chuyển ORDER_TYPE thành conditional)

  @alternative
  Scenario Outline: Auto-set LNH_TRANSACTION_TYPE theo AMOUNT khi Channel = Liên ngân hàng
    Given Maker đã chọn CHANNEL = "Liên ngân hàng" và CURRENCY_CODE = "<currency>"
    When AMOUNT (tính từ SUM(LINE_AMOUNT)) đạt giá trị "<amount>"
    Then hệ thống set mặc định LNH_TRANSACTION_TYPE = "<default_type>"
    And hệ thống "<allow_change>" cho phép Maker đổi sang loại khác

    Examples:
      | currency | amount       | default_type             | allow_change |
      | VND      | 600,000,000  | Lệnh chuyển Có GT cao    | không        |
      | VND      | 100,000,000  | Lệnh chuyển Có GT thấp   | có           |
      | USD      | 50,000       | Lệnh chuyển Có GT thấp   | có           |

  # ===================================================================
  # @exception — Luồng lỗi / Validation
  # ===================================================================

  @exception @TC-1.02
  Scenario: Chặn truy cập form Tạo mới khi không có quyền Maker
    Given người dùng "viewer01" có vai trò "Viewer" đã đăng nhập
    When "viewer01" truy cập màn hình "PAY.OUT.MANUAL.LIST"
    Then nút "Tạo mới" bị ẩn hoặc disable kèm tooltip "MSG-ERR-PERMISSION: Bạn không có quyền thực hiện thao tác này"
    When "viewer01" cố tình truy cập trực tiếp URL "PAY.OUT.MANUAL.NEW"
    Then hệ thống chặn truy cập và hiển thị "MSG-ERR-PERMISSION"
    And hệ thống ghi audit bảo mật với action="UNAUTHORIZED_ACCESS"

  @exception @TC-1.03 @VAL-01
  Scenario: Submit thất bại — trường bắt buộc REF_NO bị bỏ trống
    Given Maker đã mở form "PAY.OUT.MANUAL.NEW" và đã nhập gần đủ các trường, NHƯNG bỏ trống REF_NO
    When Maker bấm "Gửi kiểm soát"
    Then hệ thống chặn submit, highlight đỏ trường REF_NO
    And hệ thống hiển thị "MSG-ERR-REQUIRED: Vui lòng nhập Số YCTT/Số bút toán"
    And F-STATUS vẫn giữ nguyên "DRAFT"

  @exception @TC-1.04 @VAL-02
  Scenario: Submit thất bại — PAYMENT_DATE sai định dạng
    Given Maker đã mở form "PAY.OUT.MANUAL.NEW"
    When Maker nhập PAYMENT_DATE = "32/13/2025" và bấm "Lưu"
    Then hệ thống chặn lưu, hiển thị viền đỏ và thông báo "MSG-ERR-FORMAT: Định dạng Ngày thanh toán không hợp lệ"
    And hệ thống yêu cầu định dạng "dd/MM/yyyy" (theo INC-C-04 chuẩn hoá)

  @exception @TC-1.05 @VAL-08
  Scenario: Submit thất bại — PAYMENT_DATE nằm ngoài kỳ kế toán OPEN
    Given kỳ kế toán hiện tại là "05/2026" (OPEN); các kỳ trước đã CLOSED
    When Maker nhập PAYMENT_DATE = "01/01/2024" và bấm "Gửi kiểm soát"
    Then hệ thống chặn submit
    And hệ thống hiển thị "MSG-ERR-RANGE: Ngày thanh toán nằm ngoài phạm vi cho phép (kỳ kế toán đang đóng)"

  @exception @TC-1.06 @VAL-11
  Scenario: Submit thất bại — REF_NO trùng trong cùng kỳ + đơn vị + loại
    Given đã tồn tại lệnh với REF_NO="CT001" thuộc cùng SENDER + kỳ "05/2026" + ORDER_TYPE
    When Maker nhập REF_NO="CT001" cho lệnh mới và bấm "Gửi kiểm soát"
    Then hệ thống chặn submit
    And hệ thống hiển thị "MSG-ERR-DUPLICATE: Đã tồn tại bản ghi có Số YCTT/Số bút toán = CT001"

  @exception @TC-1.07 @VAL-07 @BIZ-004
  Scenario: Submit thất bại — Tổng dòng chi tiết không khớp AMOUNT header
    Given Maker đã nhập AMOUNT header = "1,000,000" (thủ công)
    And các dòng khoản mục có SUM(LINE_AMOUNT) = "900,000"
    And chênh lệch 100,000 vượt tolerance=0
    When Maker bấm "Gửi kiểm soát"
    Then hệ thống chặn submit
    And hệ thống hiển thị "MSG-ERR-AMOUNT-MISMATCH: Tổng số tiền dòng chi tiết không khớp với AMOUNT ở Tab Thông tin chung"
    And footer Tab "Khoản mục" highlight đỏ phần chênh lệch

  @exception @TC-1.08 @VAL-19
  Scenario: Submit thất bại — Tổ hợp segment COA vi phạm CCID
    Given Maker đã nhập 2 dòng khoản mục
    And dòng số 1 có tổ hợp GL_SEGMENT2 + GL_SEGMENT3 + GL_SEGMENT4 KHÔNG thuộc CCID hợp lệ
    When Maker bấm "Gửi kiểm soát"
    Then hệ thống chặn submit
    And hệ thống highlight đỏ toàn dòng số 1 với tooltip chi tiết segment vi phạm (INC-A-15)
    And hệ thống hiển thị "MSG-ERR-CCID: Tổ hợp segment COA không hợp lệ theo Cross-Validation Rule (CCID)"
    And footer Tab "Khoản mục" hiển thị "Có 1 dòng vi phạm CCID, xem chi tiết tại dòng 1"

  @exception @TC-1.09 @VAL-09
  Scenario: Upload đính kèm thất bại — vượt 10MB/file
    Given Maker đang ở form "PAY.OUT.MANUAL.NEW", popup "PAY.OUT.MANUAL.ATTACH" đang mở
    When Maker chọn file PDF kích thước 15MB
    Then hệ thống chặn upload
    And hệ thống hiển thị "MSG-ERR-FILE: File vượt giới hạn hoặc sai định dạng"
    And bản ghi attachment KHÔNG được tạo

  @exception @TC-1.10 @VAL-09
  Scenario Outline: Upload đính kèm thất bại — sai định dạng
    Given Maker đang ở form "PAY.OUT.MANUAL.NEW"
    When Maker chọn file đính kèm có phần mở rộng "<extension>"
    Then hệ thống "<result>" upload
    And nếu chặn thì hiển thị "MSG-ERR-FILE"

    Examples:
      | extension | result      |
      | .pdf      | cho phép    |
      | .jpg      | cho phép    |
      | .png      | cho phép    |
      | .docx     | cho phép    |
      | .xlsx     | cho phép    |
      | .exe      | chặn        |
      | .zip      | chặn        |
      | .bat      | chặn        |

  @exception @VAL-10
  Scenario: Submit thất bại — DESCRIPTION chứa ký tự XSS
    Given Maker đã nhập DESCRIPTION = "<script>alert('xss')</script>"
    When Maker bấm "Gửi kiểm soát"
    Then hệ thống sanitize/escape input và lưu dạng an toàn (theo VAL-10, §B4 mục 7)
    And hệ thống KHÔNG render mã script khi hiển thị lại
```

---

## Tổng kết scenarios — bdd-01-create.md

| Tầng         | Số lượng                   |
| ------------ | -------------------------- |
| @happy-path  | 3                          |
| @alternative | 4 (gồm 1 Scenario Outline) |
| @exception   | 9 (gồm 1 Scenario Outline) |
| **Tổng**     | **16 scenarios**           |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-CREATE với 16 scenarios.

# BDD-06 — Xuất dữ liệu danh sách lệnh (Export)

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-EXPORT (`PAY.OUT.MANUAL.EXPORT`)
**Tham chiếu Spec:** §B3.7, §A5 (A3), §A10 #3, §C1 #13
**Tham chiếu Quy tắc:** BIZ-007 (audit), §B4 mục 8 (masking PII)
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

> **Lưu ý phạm vi:** Theo `00-scope.md`, MVP chỉ làm **sync export** (cap ≤ 50.000 bản ghi); async export khi vượt giới hạn là **OUT OF SCOPE** (mục 4.2 #9). Quyền `EXPORT_PII` cũng out of scope — MVP mask mặc định.

---

```gherkin
Feature: PAY.OUT.MANUAL — Xuất dữ liệu danh sách lệnh thanh toán
  Mã tính năng: FT-001 | Luồng: UC-EXPORT
  Mô tả: Cho phép xuất danh sách lệnh đã lọc ra Excel/PDF/CSV.
    Hỗ trợ chọn phạm vi, trường xuất, mã hoá file (password),
    watermark cho PDF, kế thừa filter từ LIST.
    MVP: chỉ sync (≤ 50k bản ghi); cột PII mask mặc định.
  Tham chiếu: spec §B3.7, §A5 (A3), §A10 #3, §C1 #13, BIZ-007.

  Background:
    Given hệ thống VDBAS đang hoạt động
    And người dùng "viewer01" có vai trò "Viewer" + quyền "PAY.OUT.MANUAL.EXPORT" đã đăng nhập
    And "viewer01" đang ở "PAY.OUT.MANUAL.LIST" với bộ lọc đã áp dụng:
      | Filter      | Giá trị        |
      | FROM_DATE   | 01/05/2026     |
      | TO_DATE     | 19/05/2026     |
      | F-STATUS    | APPROVED       |
    And kết quả lọc trả về 250 bản ghi (< 50.000)

  # ===================================================================
  # @happy-path
  # ===================================================================

  @happy-path
  Scenario: Export Excel (XLSX) toàn bộ kết quả lọc — sync thành công
    When "viewer01" bấm "Xuất" (phím tắt "Ctrl+Shift+E", sự kiện "PAY.OUT.MANUAL.LIST.EXPORT")
    Then hệ thống mở màn hình "PAY.OUT.MANUAL.EXPORT" với giá trị mặc định:
      | Trường            | Giá trị mặc định                                  |
      | EXPORT_FORMAT     | XLSX                                              |
      | EXPORT_SCOPE      | Toàn bộ kết quả lọc                               |
      | EXPORT_FIELDS     | 10 trường mặc định (REF_NO, CHANNEL, ...)         |
      | INHERIT_FILTER    | On                                                |
      | INCLUDE_SUMMARY   | On                                                |
      | ENCRYPT_FILE      | Off                                               |
      | LANGUAGE          | Tiếng Việt                                        |
      | FILE_NAME         | PAY.OUT.MANUAL_LIST_<yyyyMMdd_HHmm>               |
    When "viewer01" bấm "Xác nhận xuất"
    Then hệ thống thực hiện export sync (vì 250 < 50.000)
    And hệ thống áp dụng filter hiện tại từ LIST (INHERIT_FILTER=On)
    And hệ thống trả file Excel có:
      | Sheet  | Nội dung                                                     |
      | Data   | 250 dòng dữ liệu theo 10 trường đã chọn                       |
      | Total  | Dòng tổng tiền theo từng loại tiền (INCLUDE_SUMMARY=On)       |
    And các cột PII (CMND/CCCD, số TK đầy đủ) được mask (chỉ 4 ký tự cuối, theo §B4 mục 8)
    And hệ thống ghi audit "PAY.OUT.MANUAL.LIST.EXPORT" với chi tiết tham số xuất + hash file
    And browser tự động download file với tên "PAY.OUT.MANUAL_LIST_20260519_1430.xlsx"

  @happy-path
  Scenario: Export PDF có watermark
    When "viewer01" mở "PAY.OUT.MANUAL.EXPORT"
    And "viewer01" chọn EXPORT_FORMAT = "PDF"
    Then trường WATERMARK_TEXT hiển thị (bắt buộc khi format=PDF)
    When "viewer01" nhập WATERMARK_TEXT = "KBNN - CONFIDENTIAL"
    And bấm "Xác nhận xuất"
    Then hệ thống sinh PDF với watermark "KBNN - CONFIDENTIAL" trên mỗi trang
    And file PDF có header, footer, số trang
    And audit ghi đầy đủ

  @happy-path
  Scenario: Export CSV bao gồm dòng chi tiết khoản mục
    When "viewer01" chọn EXPORT_FORMAT = "CSV"
    And tick INCLUDE_DETAIL = On
    And bấm "Xác nhận xuất"
    Then hệ thống xuất CSV trong đó mỗi YCTT trải thêm các dòng `PAY.OUT.MANUAL.DETAIL.GRID`
    And cấu trúc: dòng header + (1 dòng YCTT + N dòng chi tiết) × 250
    And encoding UTF-8 với BOM để Excel mở đúng tiếng Việt

  # ===================================================================
  # @alternative
  # ===================================================================

  @alternative
  Scenario: Export với mã hoá file bằng password
    When "viewer01" tick ENCRYPT_FILE = On
    Then trường EXPORT_PASSWORD chuyển thành bắt buộc
    When "viewer01" nhập EXPORT_PASSWORD = "Kbnn@2026!"
    And bấm "Xác nhận xuất"
    Then hệ thống validate password ≥ 8 ký tự, có chữ + số + ký tự đặc biệt → PASS
    And hệ thống mã hoá file XLSX bằng password
    And user mở file phải nhập đúng password mới đọc được nội dung

  @alternative
  Scenario: Export theo Trang hiện tại thay vì Toàn bộ
    Given LIST đang hiển thị trang 1 với 20 bản ghi
    When "viewer01" mở "PAY.OUT.MANUAL.EXPORT" và chọn EXPORT_SCOPE = "Trang hiện tại"
    And bấm "Xác nhận xuất"
    Then hệ thống chỉ xuất 20 bản ghi của trang hiện tại
    And file output có 20 dòng

  @alternative
  Scenario: Export "Theo lựa chọn" — checkbox dòng
    Given "viewer01" đã tick chọn 5 dòng cụ thể trên LIST
    When "viewer01" mở EXPORT và chọn EXPORT_SCOPE = "Theo lựa chọn"
    And bấm "Xác nhận xuất"
    Then hệ thống xuất đúng 5 dòng đã chọn

  @alternative
  Scenario: Tuỳ chỉnh EXPORT_FIELDS — chỉ chọn 3 cột
    Given danh sách trường mặc định gồm 10 cột
    When "viewer01" bỏ tick 7 cột, giữ lại 3 cột: REF_NO, AMOUNT, F-STATUS
    And bấm "Xác nhận xuất"
    Then file xuất chỉ có 3 cột tương ứng
    And các cột khác không xuất hiện trong header

  @alternative
  Scenario: Override SORT_BY trong export
    Given LIST đang sort theo CREATED_DATE DESC
    When "viewer01" chọn SORT_BY = "AMOUNT ASC"
    And bấm "Xác nhận xuất"
    Then file xuất sắp xếp theo AMOUNT tăng dần (override sort của LIST)

  # ===================================================================
  # @exception
  # ===================================================================

  @exception @VAL-02
  Scenario Outline: Password mã hoá file không đủ độ phức tạp
    Given "viewer01" đã tick ENCRYPT_FILE = On
    When "viewer01" nhập EXPORT_PASSWORD = "<password>"
    And bấm "Xác nhận xuất"
    Then hệ thống chặn xuất
    And hiển thị "<message>"

    Examples:
      | password     | message                                                                                |
      | abc          | MSG-ERR-FORMAT: Mật khẩu phải ≥ 8 ký tự                                                |
      | abcdefgh     | MSG-ERR-FORMAT: Mật khẩu phải có chữ + số + ký tự đặc biệt                              |
      | abcd1234     | MSG-ERR-FORMAT: Mật khẩu phải có ký tự đặc biệt                                         |
      | (rỗng)       | MSG-ERR-REQUIRED: Vui lòng nhập Mật khẩu (bắt buộc khi mã hoá file)                     |

  @exception
  Scenario: FILE_NAME chứa ký tự không hợp lệ
    When "viewer01" sửa FILE_NAME = "Bao cao 05/2026 *.xlsx"
    And bấm "Xác nhận xuất"
    Then hệ thống chặn xuất
    And hiển thị "MSG-ERR-FORMAT: Tên file chỉ chấp nhận [A-Za-z0-9_-]"

  @exception
  Scenario: Vượt giới hạn MVP (> 50.000 bản ghi) — chặn export sync
    Given bộ lọc đang trả về 75.000 bản ghi
    When "viewer01" bấm "Xác nhận xuất"
    Then hệ thống chặn export theo cap MVP (out of scope async)
    And hiển thị thông báo "Số bản ghi (75,000) vượt giới hạn xuất MVP (50,000). Vui lòng thu hẹp bộ lọc."
    And cung cấp hint "Giảm khoảng thời gian, lọc theo trạng thái..."

  @exception
  Scenario: User không có quyền Export
    Given người dùng "guest01" không có quyền "PAY.OUT.MANUAL.EXPORT"
    When "guest01" cố mở "PAY.OUT.MANUAL.EXPORT"
    Then hệ thống chặn truy cập
    And hiển thị "MSG-ERR-PERMISSION: Bạn không có quyền thực hiện thao tác này"
    And ghi audit bảo mật

  @exception
  Scenario: Export rỗng — không có bản ghi khớp filter
    Given bộ lọc hiện tại trả về 0 bản ghi
    When "viewer01" bấm "Xác nhận xuất"
    Then hệ thống cảnh báo "Không có dữ liệu để xuất. Vui lòng điều chỉnh bộ lọc"
    And không sinh file
    And không ghi audit export

  @exception
  Scenario: Export PDF thiếu WATERMARK_TEXT (bắt buộc theo format)
    When "viewer01" chọn EXPORT_FORMAT = "PDF"
    And bỏ trống WATERMARK_TEXT (nhưng EXPORT_FORMAT=PDF làm field này conditional)
    And bấm "Xác nhận xuất"
    Then hệ thống chặn xuất (theo INC: WATERMARK_TEXT là C khi format=PDF)
    And hiển thị "MSG-ERR-REQUIRED: Vui lòng nhập Watermark"
```

---

## Tổng kết scenarios — bdd-06-export.md

| Tầng         | Số lượng                   |
| ------------ | -------------------------- |
| @happy-path  | 3                          |
| @alternative | 5                          |
| @exception   | 6 (gồm 1 Scenario Outline) |
| **Tổng**     | **14 scenarios**           |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-EXPORT với 14 scenarios.

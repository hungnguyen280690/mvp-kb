# BDD-07 — Sao chép lệnh thanh toán

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-COPY (`PAY.OUT.MANUAL.NEW.COPY`)
**Tham chiếu testcase:** D3 — TC.3.07 (Sao chép chứng từ thành công)
**Tham chiếu Spec:** §A5 (A4), §A10 #8, §C1 #11
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Sao chép lệnh thanh toán
  Mã tính năng: FT-001 | Luồng: UC-COPY
  Mô tả: Maker chọn 1 lệnh có sẵn (ở bất kỳ trạng thái nào)
    và tạo lệnh mới bằng cách sao chép dữ liệu. Lệnh mới được sinh
    F-ID mới, F-VER=1, F-STATUS=DRAFT, REF_NO mới tự sinh (hoặc rỗng
    để user nhập), các trường audit reset theo user hiện tại.
  Tham chiếu: spec §A5 A4, §A10 #8, §C1 #11, §D3 TC.3.07.

  Background:
    Given hệ thống VDBAS đang hoạt động và kỳ kế toán "05/2026" đang OPEN
    And người dùng "maker01" có vai trò "Maker" + quyền tạo mới đã đăng nhập VDBAS
    And tồn tại lệnh F-ID="POM-20260519-00500" để làm nguồn copy:
      | Trường            | Giá trị                            |
      | REF_NO            | CT-202605-00500                    |
      | CHANNEL           | Liên ngân hàng                     |
      | ORDER_TYPE        | Lệnh chuyển khoản                  |
      | SENDER            | NH001-CN-HANOI                     |
      | RECEIVER          | NH002-CN-HCM                       |
      | AMOUNT            | 10,000,000 VND                     |
      | CURRENCY_CODE     | VND                                |
      | DESCRIPTION       | Chi thường xuyên tháng 5           |
      | F-STATUS          | APPROVED                           |
      | CREATED_BY        | maker99                            |
      | CREATED_DATE      | 15/05/2026 09:00:00                |
      | F-VER             | 3                                  |
    And lệnh nguồn có 2 dòng khoản mục với CCID hợp lệ
    And lệnh nguồn có 1 file đính kèm "chungtu.pdf"

  # ===================================================================
  # @happy-path
  # ===================================================================

  @happy-path @TC-3.07
  Scenario: Maker sao chép lệnh thành công, dữ liệu được copy đúng
    Given "maker01" đang ở "PAY.OUT.MANUAL.LIST" và chọn lệnh F-ID="POM-20260519-00500"
    When "maker01" bấm "Sao chép" (phím tắt "Ctrl+Shift+C", sự kiện "PAY.OUT.MANUAL.NEW.COPY")
    Then hệ thống mở form "PAY.OUT.MANUAL.NEW" với:
      | Trường            | Hành vi                                                       |
      | F-ID              | Sinh F-ID mới (vd "POM-20260519-00501")                       |
      | F-VER             | Reset = 1                                                     |
      | F-STATUS          | DRAFT                                                         |
      | REF_NO            | Reset rỗng (user nhập mới) HOẶC tự sinh theo pattern          |
      | CHANNEL           | Copy = "Liên ngân hàng"                                       |
      | ORDER_TYPE        | Copy = "Lệnh chuyển khoản"                                    |
      | SENDER            | Copy = "NH001-CN-HANOI"                                       |
      | RECEIVER          | Copy = "NH002-CN-HCM"                                         |
      | AMOUNT            | Copy = "10,000,000"                                           |
      | CURRENCY_CODE     | Copy = "VND"                                                  |
      | DESCRIPTION       | Copy = "Chi thường xuyên tháng 5"                             |
      | PAYMENT_DATE      | Reset = Ngày hiện tại                                         |
      | CREATED_BY        | Reset = "maker01" (user hiện tại)                             |
      | CREATED_DATE      | Reset = thời gian hiện tại                                    |
      | CHECKED_BY        | Reset = null                                                  |
      | APPROVED_BY       | Reset = null                                                  |
      | Dòng khoản mục    | Copy nguyên 2 dòng với LINE_AMOUNT + COA giữ nguyên           |
      | Đính kèm          | KHÔNG copy (user phải upload mới)                             |
    And hệ thống ghi audit "PAY.OUT.MANUAL.NEW.COPY" với source_id="POM-20260519-00500"
    When "maker01" nhập REF_NO mới (vd "CT-202605-00600") và bấm "Lưu"
    Then hệ thống lưu lệnh mới ở F-STATUS="DRAFT"
    And hiển thị "MSG-OK-SAVE: Lưu giao dịch thành công"

  @happy-path
  Scenario: Sao chép từ lệnh REJECTED — vẫn cho phép tạo lệnh mới
    Given tồn tại lệnh F-ID="POM-20260519-00510" ở F-STATUS="REJECTED"
    When "maker01" chọn lệnh và bấm "Sao chép"
    Then hệ thống cho phép copy (Copy không phụ thuộc F-STATUS của lệnh nguồn)
    And lệnh mới sinh ra ở F-STATUS="DRAFT", F-VER=1
    And user có thể sửa lại theo yêu cầu Approver đã từ chối trước đó

  @happy-path
  Scenario: Sao chép từ lệnh đã DELETED — admin có thể recover dữ liệu
    Given lệnh F-ID="POM-20260519-00520" ở F-STATUS="DELETED"
    And "admin01" có quyền xem DELETED và sao chép
    When "admin01" tick filter DELETED, mở LIST, chọn lệnh và bấm "Sao chép"
    Then hệ thống cho phép copy dữ liệu (BIZ-003: bản ghi DELETED vẫn truy được)
    And lệnh mới F-STATUS="DRAFT" được tạo
    And audit ghi "Khôi phục thông qua COPY", source_id=POM-20260519-00520

  # ===================================================================
  # @alternative
  # ===================================================================

  @alternative
  Scenario: Sao chép sau đó chỉnh sửa trước khi Lưu
    Given "maker01" đã bấm Sao chép từ "POM-20260519-00500", form NEW đã mở với dữ liệu copy
    When "maker01" thay đổi RECEIVER = "NH003-CN-DA-NANG"
    And thay đổi DESCRIPTION = "Chi điều chỉnh"
    And bấm "Lưu nháp"
    Then hệ thống lưu lệnh DRAFT với dữ liệu đã chỉnh sửa (không phải dữ liệu gốc)
    And lệnh nguồn POM-20260519-00500 vẫn nguyên vẹn

  @alternative
  Scenario: Sao chép — cascading áp dụng khi user thay đổi CHANNEL
    Given form NEW đã mở từ Copy, CHANNEL = "Liên ngân hàng", ORDER_TYPE = "Lệnh chuyển khoản"
    When "maker01" đổi CHANNEL = "Thanh toán song phương"
    Then hệ thống cascade reset ORDER_TYPE theo VAL-06 (dropdown ORDER_TYPE refresh sang danh mục của TTSP)
    And "Lệnh chuyển khoản" không hợp lệ với TTSP → clear field với cảnh báo
    And các trường conditional khác (ORIGIN_NUM, TRANSACTION_DATE) chuyển thành bắt buộc

  @alternative
  Scenario: Sao chép — chọn không copy dòng khoản mục
    Given lệnh nguồn có 5 dòng khoản mục
    When "maker01" bấm "Sao chép" và hệ thống mở popup options copy (nếu MVP triển khai)
    And "maker01" bỏ tick "Sao chép dòng khoản mục"
    And bấm "Tiếp tục"
    Then form NEW mở với header data copy nhưng Tab "Khoản mục" trống
    And user phải nhập lại dòng chi tiết
    # Lưu ý: option này tuỳ chọn MVP; nếu không triển khai → mặc định luôn copy

  @alternative
  Scenario: Sao chép trên lệnh có nhiều dòng và CCID phải re-validate
    Given lệnh nguồn có 3 dòng với GL_SEGMENT đã thoả CCID
    When "maker01" Sao chép, form NEW mở với 3 dòng đã copy
    Then hệ thống hiển thị các dòng với CCID đã pass
    When "maker01" thay đổi GL_SEGMENT3 ở dòng 1 sang giá trị mới có thể vi phạm CCID
    And bấm "Gửi kiểm soát"
    Then hệ thống re-validate CCID trên toàn bộ dòng (VAL-19)
    And nếu vi phạm → hiển thị MSG-ERR-CCID và chặn submit

  # ===================================================================
  # @exception
  # ===================================================================

  @exception
  Scenario: User không có quyền Maker — không thấy nút Sao chép
    Given người dùng "viewer01" có vai trò "Viewer" đã đăng nhập
    When "viewer01" mở LIST và chọn 1 lệnh
    Then nút "Sao chép" bị ẩn hoặc disable
    And tooltip hiển thị "MSG-ERR-PERMISSION: Bạn không có quyền thực hiện thao tác này"
    When "viewer01" cố nhấn phím tắt "Ctrl+Shift+C"
    Then hệ thống không phản hồi (action bị block ở client + server)

  @exception
  Scenario: Sao chép từ lệnh có DESCRIPTION chứa ký tự nguy hiểm — sanitize
    Given lệnh nguồn có DESCRIPTION = "<script>alert(1)</script>Chi NS"
    When "maker01" bấm "Sao chép"
    Then hệ thống copy DESCRIPTION đã được sanitize/escape (theo VAL-10, §B4 mục 7)
    And form NEW hiển thị "Chi NS" (đã loại bỏ tag script)
    And không có XSS xảy ra

  @exception @VAL-11
  Scenario: Sao chép lệnh và submit ngay với REF_NO trùng lệnh nguồn
    Given lệnh nguồn có REF_NO = "CT-202605-00500"
    And hệ thống đã tự reset REF_NO ở form NEW (rỗng)
    When "maker01" cố nhập lại REF_NO = "CT-202605-00500" (trùng với nguồn)
    And bấm "Gửi kiểm soát"
    Then hệ thống chặn submit do unique constraint (VAL-11)
    And hiển thị "MSG-ERR-DUPLICATE: Đã tồn tại bản ghi có Số YCTT/Số bút toán = CT-202605-00500"

  @exception @VAL-08
  Scenario: Sao chép từ lệnh có PAYMENT_DATE thuộc kỳ đã đóng — reset về ngày hiện tại
    Given lệnh nguồn có PAYMENT_DATE = "01/01/2024" (kỳ đã CLOSED)
    When "maker01" bấm "Sao chép"
    Then hệ thống reset PAYMENT_DATE = ngày hiện tại (theo §B1.1 mặc định)
    And không copy PAYMENT_DATE cũ
    When "maker01" bấm "Gửi kiểm soát"
    Then PAYMENT_DATE hợp lệ trong kỳ "05/2026" OPEN → không chặn

  @exception
  Scenario: Sao chép lệnh đang ở DRAFT của user khác — vẫn cho phép copy header
    Given lệnh F-ID="POM-20260519-00530" ở DRAFT, CREATED_BY="maker02"
    When "maker01" mở LIST và bấm "Sao chép" trên lệnh này
    Then hệ thống cho phép Copy (Copy chỉ đọc dữ liệu, không vi phạm VAL-14)
    And lệnh mới có CREATED_BY="maker01" (user hiện tại)
    But user maker01 KHÔNG được phép Sửa lệnh gốc POM-20260519-00530 (VAL-14 vẫn áp dụng)

  @exception
  Scenario: Sao chép thất bại — lệnh nguồn không tồn tại (race condition)
    Given "maker01" mở LIST hiển thị lệnh F-ID="POM-20260519-00540"
    And lệnh này vừa bị Admin xoá vĩnh viễn (giả định Phase 2)
    When "maker01" bấm "Sao chép"
    Then hệ thống trả lỗi "MSG-ERR-SYSTEM: Lỗi hệ thống, traceId: <…>"
    And đề nghị user refresh LIST
    And ghi audit lỗi để truy vết
```

---

## Tổng kết scenarios — bdd-07-copy.md

| Tầng         | Số lượng         |
| ------------ | ---------------- |
| @happy-path  | 3                |
| @alternative | 4                |
| @exception   | 6                |
| **Tổng**     | **13 scenarios** |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-COPY với 13 scenarios.

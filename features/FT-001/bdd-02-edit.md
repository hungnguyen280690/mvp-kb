# BDD-02 — Chỉnh sửa lệnh thanh toán đi thủ công

**Mã tính năng:** FT-001
**Luồng nghiệp vụ:** UC-EDIT (`PAY.OUT.MANUAL.EDIT`)
**Tham chiếu testcase:** D3 — Nhóm 3 Cập nhật (TC.3.01 → TC.3.06)
**Tham chiếu State Machine:** A11 #4, #17, #18
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

```gherkin
Feature: PAY.OUT.MANUAL — Chỉnh sửa lệnh thanh toán đi thủ công
  Mã tính năng: FT-001 | Luồng: UC-EDIT
  Mô tả: Chỉ Maker gốc được sửa lệnh ở trạng thái DRAFT hoặc
    RETURNED_TO_MAKER. Áp dụng optimistic lock theo F-VER (VAL-15).
    Các trường immutable: F-ID, F-AUDIT (CREATED_BY/CREATED_DATE), F-VER (VAL-17).
  Tham chiếu: spec §A4 bước 7-8, §A11 #4, §C1 (#6, #7),
              §D3 (TC.3.01 → TC.3.06).

  Background:
    Given hệ thống VDBAS đang hoạt động và kỳ kế toán "05/2026" đang OPEN
    And người dùng "maker01" có vai trò "Maker" đã đăng nhập VDBAS
    And tồn tại lệnh F-ID="POM-20260519-00100" do "maker01" tạo, F-VER=1, F-STATUS="DRAFT"

  # ===================================================================
  # @happy-path
  # ===================================================================

  @happy-path @TC-3.01
  Scenario: Maker gốc sửa thành công lệnh ở trạng thái DRAFT
    Given "maker01" đang ở "PAY.OUT.MANUAL.LIST" và đã chọn dòng F-ID="POM-20260519-00100"
    When "maker01" bấm nút "Sửa" (phím tắt "F2", sự kiện "PAY.OUT.MANUAL.EDIT.OPEN")
    Then hệ thống mở form "PAY.OUT.MANUAL.EDIT" ở chế độ editable
    And hệ thống load F-VER hiện hành = 1 vào hidden field
    And các trường immutable (F-ID, CREATED_BY, CREATED_DATE, F-VER) hiển thị read-only
    When "maker01" thay đổi DESCRIPTION từ "Thanh toán cũ" thành "Thanh toán mới T5"
    And "maker01" bấm "Lưu" (Ctrl+S, sự kiện "PAY.OUT.MANUAL.EDIT.SAVE")
    Then hệ thống kiểm tra optimistic lock: F-VER trong DB = F-VER load (=1) → PASS
    And hệ thống cập nhật F-VER = 2
    And hệ thống ghi audit với oldValue={DESCRIPTION:"Thanh toán cũ"}, newValue={DESCRIPTION:"Thanh toán mới T5"} (BIZ-007)
    And hệ thống hiển thị "MSG-OK-SAVE: Lưu giao dịch thành công"
    And F-STATUS vẫn giữ nguyên "DRAFT"

  @happy-path @TC-3.06
  Scenario: Maker sửa thành công lệnh RETURNED_TO_MAKER sau khi Checker trả lại
    Given lệnh F-ID="POM-20260519-00100" hiện đang ở F-STATUS="RETURNED_TO_MAKER"
    And Checker đã ghi RETURN_REASON = "Thiếu chứng từ gốc, vui lòng bổ sung"
    When "maker01" mở lệnh, bấm "Sửa"
    Then hệ thống mở form editable và hiển thị RETURN_REASON ở banner phía trên
    When "maker01" điều chỉnh theo yêu cầu Checker (vd thêm file đính kèm) và bấm "Lưu"
    Then hệ thống cập nhật F-VER+1, F-STATUS vẫn "RETURNED_TO_MAKER"
    And hệ thống ghi audit oldValue→newValue
    And "maker01" có thể bấm "Gửi kiểm soát" lại để chuyển sang "READY_FOR_APPROVAL"

  @happy-path
  Scenario: Maker huỷ chỉnh sửa khi đã thay đổi dữ liệu
    Given "maker01" đã mở form Sửa và đã chỉnh sửa một số trường
    When "maker01" bấm "Huỷ" (Esc, sự kiện "PAY.OUT.MANUAL.EDIT.CANCEL")
    Then hệ thống hiển thị "MSG-CFM-CANCEL: Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?"
    When "maker01" xác nhận "Đồng ý"
    Then hệ thống đóng form, bỏ thay đổi
    And bản ghi DB vẫn giữ F-VER=1, dữ liệu cũ không thay đổi

  # ===================================================================
  # @alternative
  # ===================================================================

  @alternative
  Scenario: Cập nhật khoản mục — thêm dòng mới, AMOUNT header tự cập nhật
    Given "maker01" đang ở form Sửa, lệnh có 2 dòng khoản mục tổng 1,000,000
    When "maker01" thêm dòng mới với LINE_AMOUNT=500,000 và CCID hợp lệ
    Then AMOUNT header tự cập nhật thành 1,500,000 (VAL-07)
    When "maker01" bấm "Lưu"
    Then hệ thống lưu thành công, F-VER+1
    And footer "Khoản mục" hiển thị "Tổng số dòng: 3, Tổng số tiền dòng: 1,500,000"

  @alternative
  Scenario: Cập nhật trường COA dẫn tới cascading reset trường con
    Given "maker01" đang ở form Sửa
    When "maker01" thay đổi GL_SEGMENT3 (DVQHNS) sang giá trị mới
    Then hệ thống refresh dropdown các trường con phụ thuộc (GL_SEGMENT4, GL_SEGMENT5...) theo VAL-06
    And nếu giá trị con cũ KHÔNG còn hợp lệ → hệ thống clear trường con và hiển thị cảnh báo "Giá trị Cấp NS đã được reset do thay đổi DVQHNS"
    And nếu giá trị con cũ VẪN hợp lệ → hệ thống giữ nguyên (theo INC-G-10)

  @alternative
  Scenario: Sửa attachment — Xoá file đính kèm cũ
    Given "maker01" đang ở form Sửa, lệnh đã có 1 file đính kèm "chungtu.pdf"
    When "maker01" bấm "Xoá đính kèm" (Shift+Delete, sự kiện "PAY.OUT.MANUAL.ATTACH.DELETE")
    Then hệ thống hỏi xác nhận xoá
    When "maker01" xác nhận
    Then hệ thống soft-delete file (ATTACH_STATUS=DELETED), ghi audit
    And tab Đính kèm cập nhật lại danh sách, ẩn file đã xoá

  # ===================================================================
  # @exception
  # ===================================================================

  @exception @TC-3.02 @VAL-13
  Scenario Outline: Chặn Sửa khi F-STATUS không cho phép
    Given lệnh F-ID="POM-20260519-00100" hiện đang ở F-STATUS="<status>"
    When "maker01" mở "PAY.OUT.MANUAL.LIST", chọn lệnh và xem nút "Sửa"
    Then nút "Sửa" bị disable
    And tooltip hiển thị "MSG-ERR-STATUS: Giao dịch đang ở trạng thái [<status>], không cho phép Sửa/Xoá"
    When "maker01" cố gắng gọi trực tiếp API EDIT_SAVE
    Then backend reject với mã lỗi MSG-ERR-STATUS và ghi audit bảo mật

    Examples:
      | status              |
      | READY_FOR_APPROVAL  |
      | PENDING_APPROVER    |
      | APPROVED            |
      | REJECTED            |
      | DELETED             |

  @exception @TC-3.03 @VAL-14
  Scenario: Chặn Sửa khi không phải Maker gốc
    Given lệnh F-ID="POM-20260519-00100" ở F-STATUS="DRAFT", CREATED_BY="maker01"
    And người dùng "maker02" (cũng có vai trò Maker) đã đăng nhập
    When "maker02" chọn lệnh và xem nút "Sửa"
    Then nút "Sửa" bị disable
    And tooltip hiển thị "MSG-ERR-MAKER: Chỉ Người lập gốc mới được phép Sửa/Xoá"
    When "maker02" cố gắng gọi trực tiếp API EDIT_SAVE
    Then backend reject với MSG-ERR-MAKER và ghi audit bảo mật (action="UNAUTHORIZED_EDIT")

  @exception @TC-3.04 @VAL-15
  Scenario: Optimistic lock conflict — user khác đã lưu trước
    Given "maker01" mở form Sửa lệnh F-ID="POM-20260519-00100" tại thời điểm T1, load F-VER=1
    And "maker01" (từ session khác / tab khác) đã lưu thay đổi tại T2, F-VER tăng lên 2 trong DB
    When "maker01" (session đầu, vẫn giữ F-VER=1 đã load) bấm "Lưu" tại T3
    Then hệ thống phát hiện F-VER trong DB (=2) ≠ F-VER đã load (=1)
    And hệ thống chặn lưu, hiển thị "MSG-ERR-LOCK: Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục"
    And hệ thống cung cấp nút "Tải lại" để reload bản ghi mới nhất
    And hệ thống ghi audit "PAY.OUT.MANUAL.LOCK.CONFLICT"

  @exception @VAL-17
  Scenario: Backend reject khi client cố thay đổi trường immutable
    Given "maker01" đang ở form Sửa
    When client gửi request PUT chứa cả các trường immutable: F-ID="POM-DIFFERENT", CREATED_BY="hacker", CREATED_DATE="01/01/2020"
    Then backend reject các thay đổi trên trường immutable theo VAL-17
    And backend chỉ accept các trường được phép sửa
    And nếu request cố thay F-ID → trả về lỗi 400 "MSG-ERR-SYSTEM: Trường F-ID không được phép thay đổi"
    And ghi audit bảo mật

  @exception @TC-1.04 @VAL-02
  Scenario: Edit thất bại — Format ngày sai sau khi sửa
    Given "maker01" đang ở form Sửa lệnh DRAFT
    When "maker01" thay đổi TRANSACTION_DATE thành "abc" (chuỗi không phải date)
    And "maker01" bấm "Lưu"
    Then hệ thống chặn lưu, hiển thị "MSG-ERR-FORMAT: Định dạng Ngày chứng từ không hợp lệ"
    And F-VER không thay đổi

  @exception
  Scenario: Phiên hết hạn khi đang sửa
    Given "maker01" đã mở form Sửa và đang nhập liệu hơn 30 phút
    And phiên đăng nhập đã hết hạn (sự kiện "PAY.OUT.MANUAL.SESSION.TIMEOUT")
    When "maker01" bấm "Lưu"
    Then hệ thống chặn lưu, hiển thị "MSG-ERR-SESSION: Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
    And hệ thống redirect về trang đăng nhập
    And hệ thống lưu draft tạm vào localStorage (theo A11 #19)
```

---

## Tổng kết scenarios — bdd-02-edit.md

| Tầng         | Số lượng                                  |
| ------------ | ----------------------------------------- |
| @happy-path  | 3                                         |
| @alternative | 3                                         |
| @exception   | 6 (gồm 1 Scenario Outline với 5 examples) |
| **Tổng**     | **12 scenarios**                          |

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo BDD luồng UC-EDIT với 12 scenarios.

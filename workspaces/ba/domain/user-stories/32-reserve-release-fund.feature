# language: vi
# ============================================================================
# Tính năng: Reserve và Release giữ quỹ
# Tham chiếu: BIZ-RESERVE-FUND, BIZ-RELEASE-HOLD
# ============================================================================

Tính năng: Reserve và release giữ quỹ
  Với vai trò hệ thống
  Tôi muốn quản lý giữ và giải phóng quỹ
  Để chống chi vượt số dư khả dụng

  @BIZ-RESERVE-FUND
  Kịch bản: Submit LTT đặt hold số dư tài khoản nguồn
    Cho rằng LTT "LTT-001" có số tiền 500.000.000 VND
    Và số dư khả dụng tài khoản nguồn là 1.000.000.000 VND
    Khi LTT chuyển sang "SUBMITTED"
    Thì hệ thống hold 500.000.000 VND từ tài khoản nguồn
    Và số dư khả dụng còn 500.000.000 VND

  @BIZ-RESERVE-FUND
  Kịch bản: Số dư không đủ không cho submit
    Cho rằng LTT "LTT-001" có số tiền 500.000.000 VND
    Và số dư khả dụng tài khoản nguồn chỉ còn 300.000.000 VND
    Khi tôi cố gắng submit
    Thì hệ thống không cho submit
    Và hiển thị "Số dư không đủ"

  @BIZ-RELEASE-HOLD
  Kịch bản: Reject LTT release hold
    Cho rằng LTT "LTT-001" ở trạng thái "SUBMITTED" đã hold 500.000.000 VND
    Khi Checker từ chối LTT
    Thì hệ thống release hold 500.000.000 VND
    Và số dư khả dụng phục hồi
    Và audit log ghi "RELEASE_HOLD"

  @BIZ-RELEASE-HOLD
  Kịch bản: Cancel LTT release hold
    Cho rằng LTT "LTT-001" ở trạng thái "SIGNED" đã hold quỹ
    Khi Approver huỷ LTT
    Thì hệ thống release hold số dư
    Và audit log ghi "RELEASE_HOLD"

  @BIZ-RELEASE-HOLD
  Kịch bản: Xoá LTT chưa reserve fund không release
    Cho rằng LTT "LTT-001" ở trạng thái "DRAFT" chưa submit
    Và chưa bao giờ reserve fund
    Khi tôi xoá LTT
    Thì hệ thống không thực hiện release hold
    Và không ghi audit "RELEASE_HOLD"

  @BIZ-RELEASE-HOLD
  Kịch bản: SEND_FAILED release hold
    Cho rằng LTT "LTT-001" gửi thất bại sau retry
    Khi LTT chuyển sang "SEND_FAILED"
    Thì hệ thống release hold số dư tài khoản nguồn
    Và audit log ghi "RELEASE_HOLD"

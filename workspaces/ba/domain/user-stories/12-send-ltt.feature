# language: vi
# ============================================================================
# Tính năng: Gửi LTT qua gateway (SIGNED → SENT)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Approver
# Tham chiếu: states.yaml SIGNED→SENT, BIZ-CHANNEL-ROUTING, BIZ-RETRY
# ============================================================================

Tính năng: Gửi LTT qua gateway
  Với vai trò Approver
  Tôi muốn gửi LTT đã ký số đến NHNN/KB
  Để hoàn tất thanh toán

  @BIZ-CHANNEL-ROUTING
  Kịch bản: Gửi LTT kênh LNH đến gateway Liên ngân hàng
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SIGNED"
    Và kênh LTT là "Liên ngân hàng" (LNH)
    Khi tôi bấm "Gửi NH"
    Thì hệ thống định tuyến đến gateway LNH
    Và LTT chuyển từ "SIGNED" sang "SENT"
    Và audit log ghi thao tác "send"

  @BIZ-CHANNEL-ROUTING
  Kịch bản: Gửi LTT kênh SP đến gateway Song phương
    Cho rằng tồn tại LTT "LTT-002" ở trạng thái "SIGNED"
    Và kênh LTT là "Song phương" (SP)
    Khi tôi bấm "Gửi NH"
    Thì hệ thống định tuyến đến gateway SP
    Và LTT chuyển sang "SENT"

  @BIZ-CHANNEL-ROUTING
  Kịch bản: Gửi LTT kênh LKB đến gateway Liên kho bạc
    Cho rằng tồn tại LTT "LTT-003" ở trạng thái "SIGNED"
    Và kênh LTT là "Liên kho bạc" (LKB)
    Khi tôi bấm "Gửi NH"
    Thì hệ thống định tuyến đến gateway LKB
    Và LTT chuyển sang "SENT"

  @BIZ-CHANNEL-ROUTING
  Kịch bản: Nhiều route khả dụng chọn theo Routing Priority
    Cho rằng tồn tại LTT kênh LNH với nhiều gateway khả dụng
    Khi hệ thống định tuyến
    Thì chọn gateway theo bảng Routing Priority cấu hình

  @BIZ-RETRY
  Kịch bản: Gửi NH lần đầu thất bại retry sau 5 giây
    Cho rằng LTT đã bấm "Gửi NH"
    Và gateway trả về lỗi tạm thời lần 1
    Khi hệ thống thực hiện retry
    Thì retry sau 5 giây với cùng correlationId

  @BIZ-RETRY
  Kịch bản: Gửi NH retry lần 2 thất bại retry sau 15 giây
    Cho rằng LTT đã retry lần 1 thất bại
    Khi hệ thống thực hiện retry lần 2
    Thì retry sau 15 giây

  @BIZ-RETRY
  Kịch bản: Gửi NH retry lần 3 thất bại retry sau 45 giây
    Cho rằng LTT đã retry lần 2 thất bại
    Khi hệ thống thực hiện retry lần 3
    Thì retry sau 45 giây

  @BIZ-RETRY
  Kịch bản: Gửi NH thất bại sau 3 lần retry chuyển SEND_FAILED
    Cho rằng LTT đã retry 3 lần đều thất bại
    Khi retry lần cuối thất bại
    Thì LTT chuyển sang "SEND_FAILED"
    Và hệ thống release hold số dư
    Và thông báo gửi đến Approver

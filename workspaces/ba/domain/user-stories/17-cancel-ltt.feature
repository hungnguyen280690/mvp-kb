# language: vi
# ============================================================================
# Tính năng: Huỷ LTT (SIGNED → CANCELLED)
# Vai trò: Approver
# Tham chiếu: states.yaml SIGNED→CANCELLED, BIZ-RELEASE-HOLD, VAL-030
# ============================================================================

Tính năng: Huỷ LTT
  Với vai trò Approver
  Tôi muốn huỷ LTT đã ký số nhưng chưa gửi
  Để ngăn chặn thanh toán không cần thiết

  @VAL-030 @BIZ-REJECT-REASON @BIZ-RELEASE-HOLD
  Kịch bản: Huỷ LTT ở trạng thái SIGNED thành công
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SIGNED"
    Và tôi đăng nhập với vai trò Approver
    Khi tôi bấm "Huỷ"
    Và tôi nhập lý do huỷ "Huỷ lệnh do phát hiện sai thông tin người thụ hưởng" (>= 10 ký tự)
    Và tôi bấm "Xác nhận huỷ"
    Thì LTT chuyển từ "SIGNED" sang "CANCELLED"
    Và lý do huỷ được lưu vào audit
    Và hệ thống release hold số dư tài khoản nguồn
    Và audit log ghi thao tác "RELEASE_HOLD"
    Và thông báo gửi đến Maker

  @VAL-030
  Kịch bản: Huỷ LTT không nhập lý do bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SIGNED"
    Khi tôi bấm "Huỷ" mà không nhập lý do
    Thì hệ thống chặn thao tác

  @VAL-030
  Kịch bản: Huỷ LTT với lý do quá ngắn bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SIGNED"
    Khi tôi bấm "Huỷ" và nhập lý do "Huỷ" (4 ký tự)
    Thì hệ thống chặn thao tác
    Và hiển thị "Vui lòng nhập lý do tối thiểu 10 ký tự"

# language: vi
# ============================================================================
# Tính năng: Xử lý LTT gửi thất bại (SEND_FAILED)
# Vai trò: Approver
# Tham chiếu: states.yaml SEND_FAILED, BIZ-RETRY, BIZ-OPTIMISTIC-LOCK, VAL-030
# ============================================================================

Tính năng: Xử lý LTT gửi thất bại
  Với vai trò Approver
  Tôi muốn xử lý LTT gửi NH thất bại sau retry
  Để tiếp tục thanh toán hoặc huỷ bỏ

  @BIZ-RETRY @BIZ-OPTIMISTIC-LOCK
  Kịch bản: Approver chỉnh sửa và gửi lại LTT từ SEND_FAILED
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SEND_FAILED"
    Và tôi đăng nhập với vai trò Approver
    Khi tôi bấm "Gửi lại"
    Thì LTT chuyển từ "SEND_FAILED" quay về "SIGNED"
    Và hệ thống thực hiện ký lại (re_sign)
    Và audit log ghi thao tác "resend"

  @VAL-030 @BIZ-REJECT-REASON
  Kịch bản: Approver huỷ LTT từ SEND_FAILED
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SEND_FAILED"
    Và tôi đăng nhập với vai trò Approver
    Khi tôi bấm "Huỷ"
    Và nhập lý do huỷ hợp lệ (>= 10 ký tự)
    Thì LTT chuyển từ "SEND_FAILED" sang "CANCELLED"
    Và audit log ghi thao tác "cancel"

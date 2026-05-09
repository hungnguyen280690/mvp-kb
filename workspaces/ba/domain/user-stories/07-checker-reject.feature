# language: vi
# ============================================================================
# Tính năng: Checker từ chối LTT (SUBMITTED → RETURNED_TO_MAKER)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Checker
# Tham chiếu: states.yaml SUBMITTED→RETURNED_TO_MAKER, BIZ-MAKER-CHECKER,
#             BIZ-REJECT-REASON, BIZ-RELEASE-HOLD, VAL-030, BIZ-NOTIFY
# ============================================================================

Tính năng: Checker từ chối LTT
  Với vai trò Checker (Người kiểm soát)
  Tôi muốn từ chối LTT không hợp lệ
  Để trả lại LTT cho Maker chỉnh sửa

  @BIZ-MAKER-CHECKER @BIZ-REJECT-REASON @VAL-030 @BIZ-RELEASE-HOLD
  Kịch bản: Checker từ chối LTT thành công — happy path
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Và tôi đăng nhập với vai trò Checker user "checker01" (khác Maker)
    Và LTT đã được reserve fund
    Khi tôi bấm "Từ chối"
    Và tôi nhập lý do "Thông tin người thụ hưởng không chính xác, cần kiểm tra lại" (>= 10 ký tự)
    Và tôi bấm "Xác nhận từ chối"
    Thì LTT chuyển từ trạng thái "SUBMITTED" sang "RETURNED_TO_MAKER"
    Và lý do từ chối được lưu vào audit
    Và hệ thống release hold số dư tài khoản nguồn
    Và audit log ghi thao tác "RELEASE_HOLD"
    Và thông báo gửi đến Maker

  @BIZ-REJECT-REASON @VAL-030
  Kịch bản: Từ chối LTT không nhập lý do bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Khi tôi bấm "Từ chối" mà không nhập lý do
    Thì hệ thống chặn thao tác
    Và hiển thị "Vui lòng nhập lý do tối thiểu 10 ký tự"

  @BIZ-REJECT-REASON @VAL-030
  Kịch bản: Từ chối LTT với lý do quá ngắn bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Khi tôi bấm "Từ chối" và nhập lý do "Sai" (3 ký tự)
    Thì hệ thống chặn thao tác
    Và hiển thị "Vui lòng nhập lý do tối thiểu 10 ký tự"

  @BIZ-REJECT-REASON @VAL-030
  Kịch bản: Từ chối LTT với lý do quá dài bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Khi tôi bấm "Từ chối" và nhập lý do dài hơn 500 ký tự
    Thì hệ thống chặn thao tác
    Và hiển thị lỗi vượt quá giới hạn ký tự

  @BIZ-MAKER-CHECKER
  Kịch bản: Checker cùng user với Maker không thể từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Và Maker gốc là user "user01"
    Và tôi đăng nhập với user "user01"
    Khi tôi cố gắng từ chối LTT "LTT-001"
    Thì hệ thống từ chối do vi phạm SoD (Maker = Checker)

# language: vi
# ============================================================================
# Tính năng: Approver từ chối LTT (IN_CONTROL → RETURNED_TO_CHECKER)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Approver
# Tham chiếu: states.yaml IN_CONTROL→RETURNED_TO_CHECKER, BIZ-MAKER-CHECKER,
#             BIZ-REJECT-REASON, VAL-030, BIZ-NOTIFY
# ============================================================================

Tính năng: Approver từ chối LTT
  Với vai trò Approver (Người phê duyệt)
  Tôi muốn từ chối LTT đã qua kiểm soát
  Để trả lại LTT cho Checker tái thẩm định

  @BIZ-MAKER-CHECKER @BIZ-REJECT-REASON @VAL-030
  Kịch bản: Approver từ chối LTT thành công — happy path
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và tôi đăng nhập với vai trò Approver user "approver01" (khác Maker và Checker)
    Khi tôi bấm "Từ chối"
    Và tôi nhập lý do "Số tiền không khớp với hợp đồng cam kết chi, yêu cầu kiểm tra lại" (>= 10 ký tự)
    Và tôi bấm "Xác nhận từ chối"
    Thì LTT chuyển từ trạng thái "IN_CONTROL" sang "RETURNED_TO_CHECKER"
    Và lý do từ chối được lưu vào audit
    Và thông báo gửi đến Checker

  @BIZ-REJECT-REASON @VAL-030
  Kịch bản: Approver từ chối không nhập lý do bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Khi tôi bấm "Từ chối" mà không nhập lý do
    Thì hệ thống chặn thao tác
    Và hiển thị "Vui lòng nhập lý do tối thiểu 10 ký tự"

  @BIZ-SOD
  Kịch bản: Approver từ chối vi phạm SoD bị chặn
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và user Approver vi phạm quy tắc SoD
    Khi Approver cố gắng từ chối
    Thì hệ thống chặn thao tác và ghi audit vi phạm SoD

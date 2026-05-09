# language: vi
# ============================================================================
# Tính năng: Xử lý LTT bị trả lại (Return flows)
# Màn hình: S02 / S03
# Vai trò: Maker, Checker
# Tham chiếu: states.yaml RETURNED_TO_MAKER, RETURNED_TO_CHECKER
# ============================================================================

Tính năng: Xử lý LTT bị trả lại
  Với vai trò Maker hoặc Checker
  Tôi muốn xử lý LTT bị trả lại từ cấp trên
  Để tiếp tục quy trình hoặc điều chỉnh thông tin

  # ---- RETURNED_TO_MAKER: Checker trả lại Maker ----

  Kịch bản: Maker chỉnh sửa và gửi lại LTT từ RETURNED_TO_MAKER
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "RETURNED_TO_MAKER"
    Và tôi là Maker gốc
    Khi tôi chỉnh sửa thông tin LTT
    Và bấm "Gửi kiểm soát"
    Thì LTT chuyển từ "RETURNED_TO_MAKER" sang "SUBMITTED"
    Và hệ thống reserve fund lại
    Và audit log ghi thao tác "resubmit"
    Và thông báo gửi đến Checker

  Kịch bản: Maker chuyển RETURNED_TO_MAKER về DRAFT để sửa tạm
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "RETURNED_TO_MAKER"
    Và tôi là Maker gốc
    Khi tôi bấm "Sửa" và "Lưu nháp" (chưa Submit)
    Thì LTT chuyển từ "RETURNED_TO_MAKER" về "DRAFT"
    Và audit log ghi thao tác "edit_after_return"

  Kịch bản: Maker xoá LTT ở trạng thái RETURNED_TO_MAKER
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "RETURNED_TO_MAKER"
    Và tôi là Maker gốc
    Khi tôi thực hiện xoá với lý do hợp lệ và tick xác nhận
    Thì LTT được soft-delete thành công
    Và nếu trước đó đã reserve fund → hệ thống release hold

  # ---- RETURNED_TO_CHECKER: Approver trả lại Checker ----

  Kịch bản: Checker tái thẩm và gửi lại LTT từ RETURNED_TO_CHECKER
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "RETURNED_TO_CHECKER"
    Và tôi là Checker đã thẩm định trước đó
    Khi tôi xem lại lý do từ chối từ Approver
    Và tôi bấm "Tái thẩm và Gửi lại"
    Thì LTT chuyển từ "RETURNED_TO_CHECKER" sang "IN_CONTROL"
    Và audit log ghi thao tác "resubmit"
    Và thông báo gửi đến Approver

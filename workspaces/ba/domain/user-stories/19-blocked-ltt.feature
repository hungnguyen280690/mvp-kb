# language: vi
# ============================================================================
# Tính năng: Chặn LTT do vi phạm (BLOCKED)
# Vai trò: Hệ thống + Vận hành
# Tham chiếu: states.yaml BLOCKED, BIZ-SOD, BIZ-DUPLICATE
# ============================================================================

Tính năng: Chặn LTT do vi phạm hệ thống
  Với vai trò hệ thống
  Khi phát hiện vi phạm SoD hoặc trùng lặp
  LTT sẽ bị chặn mọi thao tác cho đến khi vận hành giải block

  @BIZ-SOD @BIZ-DUPLICATE
  Kịch bản: Hệ thống chặn LTT khi phát hiện vi phạm SoD
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Khi hệ thống phát hiện vi phạm SoD
    Thì LTT chuyển sang trạng thái "BLOCKED"
    Và mọi thao tác bị chặn
    Và audit log ghi thao tác "block"
    Và cảnh báo gửi đến vận hành

  @BIZ-SOD @BIZ-DUPLICATE
  Kịch bản: Hệ thống chặn LTT khi phát hiện trùng lặp bất thường
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Khi hệ thống phát hiện trùng lặp bất thường (duplicate)
    Thì LTT chuyển sang trạng thái "BLOCKED"
    Và mọi thao tác bị chặn

  Kịch bản: Vận hành giải block sau khi xác minh
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "BLOCKED"
    Khi vận hành xác minh không còn vi phạm
    Và bấm "Giải block"
    Thì LTT quay về trạng thái trước khi bị block
    Và audit log ghi thao tác "unblock"
    Và cảnh báo gửi đến vận hành

  Kịch bản: BLOCKED có thể xảy ra từ bất kỳ trạng thái non-final
    Cho rằng LTT đang ở bất kỳ trạng thái non-final nào
    (DRAFT, SUBMITTED, IN_CONTROL, RETURNED_TO_MAKER, RETURNED_TO_CHECKER,
     APPROVED, SIGNED, SENT, SEND_FAILED, CONFIRMED, POST_FAILED)
    Khi hệ thống phát hiện vi phạm
    Thì LTT chuyển sang "BLOCKED"

# language: vi
# ============================================================================
# Tính năng: Xác nhận LTT từ NH/KB callback (SENT → CONFIRMED)
# Vai trò: Hệ thống (tự động)
# Tham chiếu: states.yaml SENT→CONFIRMED, BIZ-RETRY
# ============================================================================

Tính năng: Xác nhận LTT từ NH/KB callback
  Với vai trò hệ thống
  Khi nhận được callback success từ NH/KB
  LTT sẽ chuyển sang CONFIRMED và đẩy GL post

  @BIZ-RETRY
  Kịch bản: Callback success từ NH/KB chuyển CONFIRMED
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SENT"
    Khi hệ thống nhận callback success từ gateway NH/KB
    Thì LTT chuyển từ "SENT" sang "CONFIRMED"
    Và hệ thống đẩy GL posted
    Và đẩy ECM
    Và đẩy QLT/QLChi
    Và audit log ghi thao tác "confirm"

  @BIZ-RETRY
  Kịch bản: Callback fail/timeout retry hết chuyển SEND_FAILED
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SENT"
    Và đã retry hết số lần cho phép
    Khi callback vẫn fail hoặc timeout
    Thì LTT chuyển từ "SENT" sang "SEND_FAILED"
    Và hệ thống release hold số dư
    Và thông báo gửi đến Approver
    Và audit log ghi thao tác "fail"

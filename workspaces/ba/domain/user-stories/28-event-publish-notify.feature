# language: vi
# ============================================================================
# Tính năng: Publish event và thông báo workflow
# Tham chiếu: BIZ-EVENT-PUBLISH, BIZ-NOTIFY
# ============================================================================

Tính năng: Publish event và thông báo workflow
  Với vai trò hệ thống
  Khi LTT chuyển trạng thái
  Hệ thống publish event lên message bus và gửi thông báo cho user liên quan

  @BIZ-EVENT-PUBLISH
  Kịch bản: Submit LTT publish event SUBMITTED lên bus
    Cho rằng LTT "LTT-001" chuyển sang "SUBMITTED"
    Khi chuyển trạng thái hoàn tất
    Thì event "TT.OUT.MANUAL.SUBMITTED" được publish lên message bus
    Và payload event chứa thông tin LTT đầy đủ
    Và subscriber QLChi/QLT/So cái/ECM/Notification nhận event

  @BIZ-EVENT-PUBLISH
  Kịch bản: Approve LTT publish event APPROVED lên bus
    Cho rằng LTT "LTT-001" chuyển sang "APPROVED"
    Khi chuyển trạng thái hoàn tất
    Thì event "TT.OUT.MANUAL.APPROVED" được publish lên message bus

  @BIZ-NOTIFY
  Kịch bản: Submit LTT gửi thông báo cho Checker
    Cho rằng LTT "LTT-001" vừa được Submit
    Khi chuyển sang "SUBMITTED"
    Thì thông báo in-app gửi đến Checker
    Và email gửi đến Checker

  @BIZ-NOTIFY
  Kịch bản: Reject LTT gửi thông báo cho Maker
    Cho rằng LTT "LTT-001" bị Checker Reject
    Khi chuyển sang "RETURNED_TO_MAKER"
    Thì thông báo in-app gửi đến Maker
    Và email gửi đến Maker

  @BIZ-NOTIFY
  Kịch bản: Approve LTT gửi thông báo cho tất cả involved users
    Cho rằng LTT "LTT-001" được Approver phê duyệt
    Khi chuyển sang "APPROVED"
    Thì thông báo gửi đến Maker, Checker, và Approver

  @BIZ-NOTIFY
  Kịch bản: Sent LTT gửi thông báo cho Maker
    Cho rằng LTT "LTT-001" chuyển sang "SENT"
    Khi gửi qua gateway thành công
    Thì thông báo gửi đến Maker

  @BIZ-NOTIFY
  Kịch bản: Confirmed LTT gửi thông báo cho Maker
    Cho rằng LTT "LTT-001" chuyển sang "CONFIRMED"
    Khi nhận callback success từ NH/KB
    Thì thông báo gửi đến Maker

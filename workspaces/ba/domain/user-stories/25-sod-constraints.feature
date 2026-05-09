# language: vi
# ============================================================================
# Tính năng: Phân tách trách nhiệm (SoD - Segregation of Duties)
# Tham chiếu: BIZ-MAKER-CHECKER, BIZ-SOD
# ============================================================================

Tính năng: Phân tách trách nhiệm
  Với vai trò hệ thống
  Tôi muốn đảm bảo phân tách trách nhiệm giữa Maker, Checker, Approver
  Để ngăn chặn gian lận và đảm bảo kiểm soát nội bộ

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Maker không thể tự kiểm soát (Checker) LTT của mình
    Cho rằng user "user01" vừa lập (Maker) LTT "LTT-001"
    Và LTT "LTT-001" ở trạng thái "SUBMITTED"
    Khi "user01" cố gắng phê duyệt kiểm soát (Checker) LTT "LTT-001"
    Thì hệ thống từ chối do Maker và Checker phải khác user

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Checker không thể tự phê duyệt (Approver) LTT đã kiểm soát
    Cho rằng user "checker01" vừa phê duyệt kiểm soát LTT "LTT-001"
    Và LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Khi "checker01" cố gắng phê duyệt (Approver) LTT "LTT-001"
    Thì hệ thống từ chối do Checker và Approver phải khác user

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Maker không thể phê duyệt (Approver) LTT của mình
    Cho rằng user "maker01" vừa lập LTT "LTT-001"
    Và LTT "LTT-001" đã qua Checker và ở trạng thái "IN_CONTROL"
    Khi "maker01" cố gắng phê duyệt (Approver) LTT "LTT-001"
    Thì hệ thống từ chối do Maker và Approver phải khác user

  @BIZ-MAKER-CHECKER
  Kịch bản: 3 user khác nhau cho cả 3 vai trò được chấp nhận
    Cho rằng LTT "LTT-001" có Maker "maker01", Checker "checker01"
    Khi "approver01" (khác cả maker01 và checker01) phê duyệt
    Thì hệ thống chấp nhận và LTT chuyển sang "APPROVED"

  @BIZ-SOD
  Kịch bản: Vi phạm SoD theo bảng cấu hình bị chặn và ghi audit
    Cho rằng user vi phạm quy tắc SoD theo bảng cấu hình (sheet 3)
    Khi user cố gắng thực hiện thao tác vi phạm
    Thì hệ thống chặn thao tác
    Và ghi audit log vi phạm SoD

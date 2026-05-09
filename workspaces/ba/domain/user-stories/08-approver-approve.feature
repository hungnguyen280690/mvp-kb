# language: vi
# ============================================================================
# Tính năng: Approver phê duyệt LTT (IN_CONTROL → APPROVED)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Approver
# Tham chiếu: states.yaml IN_CONTROL→APPROVED, BIZ-MAKER-CHECKER, BIZ-SOD
#             BIZ-NOTIFY
# ============================================================================

Tính năng: Approver phê duyệt LTT
  Với vai trò Approver (Người phê duyệt)
  Tôi muốn phê duyệt LTT đã qua kiểm soát
  Để LTT sẵn sàng cho ký số và gửi NHNN/KB

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Approver phê duyệt thành công — happy path
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và tôi đăng nhập với vai trò Approver user "approver01"
    Và "approver01" khác user Maker "maker01" và khác Checker "checker01"
    Khi tôi bấm "Phê duyệt" trên màn hình chi tiết LTT
    Thì LTT chuyển từ trạng thái "IN_CONTROL" sang "APPROVED"
    Và trường "Approver" được gán bằng user "approver01"
    Và audit log ghi thao tác "approve"
    Và thông báo gửi đến người ký số

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Approver cùng user với Checker bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và Checker là user "checker01"
    Và tôi đăng nhập với user "checker01" có vai trò Approver
    Khi tôi cố gắng phê duyệt LTT "LTT-001"
    Thì hệ thống từ chối do vi phạm SoD (Checker = Approver)

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Approver cùng user với Maker bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và Maker là user "maker01"
    Và tôi đăng nhập với user "maker01" có vai trò Approver
    Khi tôi cố gắng phê duyệt LTT "LTT-001"
    Thì hệ thống từ chối do vi phạm SoD (Maker = Approver)

  @BIZ-MAKER-CHECKER
  Kịch bản: 3 user khác nhau cho Maker-Checker-Approver được chấp nhận
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "IN_CONTROL"
    Và Maker là "maker01", Checker là "checker01"
    Và tôi đăng nhập với Approver "approver01" (khác cả 2)
    Khi tôi bấm "Phê duyệt"
    Thì LTT chuyển sang "APPROVED" thành công

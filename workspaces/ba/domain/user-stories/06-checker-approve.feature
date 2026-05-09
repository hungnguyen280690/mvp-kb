# language: vi
# ============================================================================
# Tính năng: Checker phê duyệt kiểm soát LTT (SUBMITTED → IN_CONTROL)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Checker
# Tham chiếu: states.yaml SUBMITTED→IN_CONTROL, BIZ-MAKER-CHECKER, BIZ-SOD
#             VAL-032, BIZ-NOTIFY
# ============================================================================

Tính năng: Checker phê duyệt kiểm soát LTT
  Với vai trò Checker (Người kiểm soát)
  Tôi muốn thẩm định và phê duyệt LTT do Maker gửi
  Để LTT chuyển tiếp sang Approver phê duyệt

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Checker phê duyệt kiểm soát thành công — happy path
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Và tôi đăng nhập với vai trò Checker user "checker01"
    Và "checker01" khác user Maker gốc "maker01"
    Khi tôi bấm "Phê duyệt KS" trên màn hình chi tiết LTT
    Thì LTT chuyển từ trạng thái "SUBMITTED" sang "IN_CONTROL"
    Và trường "Checker" được gán bằng user "checker01"
    Và audit log ghi thao tác "approve_check"
    Và thông báo gửi đến Approver

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Checker cùng user với Maker bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Và Maker gốc là user "user01"
    Và tôi đăng nhập với user "user01" có vai trò Checker
    Khi tôi cố gắng phê duyệt kiểm soát LTT "LTT-001"
    Thì hệ thống từ chối thao tác
    Và hiển thị thông báo lỗi phân tách trách nhiệm (SoD)

  @BIZ-SOD
  Kịch bản: Checker vi phạm SoD bị chặn thao tác
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "SUBMITTED"
    Và user Checker vi phạm quy tắc SoD theo bảng cấu hình
    Khi Checker cố gắng phê duyệt
    Thì hệ thống chặn thao tác và ghi audit vi phạm SoD

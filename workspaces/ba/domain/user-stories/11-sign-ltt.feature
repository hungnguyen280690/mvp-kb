# language: vi
# ============================================================================
# Tính năng: Ký số LTT (APPROVED → SIGNED)
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Approver
# Tham chiếu: states.yaml APPROVED→SIGNED, BIZ-SIGN-TAD-COMM
# ============================================================================

Tính năng: Ký số LTT
  Với vai trò Approver (Người ký số)
  Tôi muốn ký số LTT đã phê duyệt
  Để LTT sẵn sàng gửi đến NHNN/KB qua gateway

  @BIZ-SIGN-TAD-COMM
  Kịch bản: Ký số LTT thành công với chứng thư hợp lệ
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "APPROVED"
    Và tôi đăng nhập với vai trò Approver user "approver01"
    Và chứng thư số hợp lệ, chưa hết hạn, đúng cá nhân
    Khi tôi bấm "Ký số"
    Thì LTT chuyển từ trạng thái "APPROVED" sang "SIGNED"
    Và chữ ký được lưu vào ECM
    Và hash SHA-256 của LTT được ghi nhận
    Và audit log ghi thao tác "sign"

  @BIZ-SIGN-TAD-COMM
  Kịch bản: Ký số với chứng thư hết hạn bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "APPROVED"
    Và chứng thư số đã hết hạn
    Khi tôi cố gắng ký số
    Thì hệ thống từ chối ký số
    Và hiển thị thông báo "Chứng thư số đã hết hạn"

  @BIZ-SIGN-TAD-COMM
  Kịch bản: Ký số với chứng thư không đúng cá nhân bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "APPROVED"
    Và chứng thư số thuộc về user khác
    Khi tôi cố gắng ký số
    Thì hệ thống từ chối
    Và hiển thị thông báo "Chứng thư số không đúng cá nhân"

  @BIZ-MAKER-CHECKER
  Kịch bản: Approver ký số phải là user đã phê duyệt
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "APPROVED"
    Và Approver phê duyệt là user "approver01"
    Khi user "approver02" cố gắng ký số
    Thì hệ thống từ chối do không phải Approver đã phê duyệt

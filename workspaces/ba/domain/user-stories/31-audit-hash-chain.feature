# language: vi
# ============================================================================
# Tính năng: Audit log và kiểm toán chuỗi hash
# Tham chiếu: BIZ-AUDIT, BIZ-EDIT-AUDIT
# ============================================================================

Tính năng: Audit log và kiểm toán
  Với vai trò hệ thống
  Tôi muốn ghi nhận mọi thao tác trên LTT
  Để đảm bảo tính truy vết và kiểm toán

  @BIZ-AUDIT
  Kịch bản: Tạo LTT ghi audit log thao tác create
    Cho rằng tôi tạo LTT mới và lưu nháp
    Khi thao tác hoàn tất
    Thì audit log ghi: hành động "create", user, timestamp, IP
    Và oldValue=null, newValue=thông tin LTT

  @BIZ-AUDIT
  Kịch bản: Sửa LTT ghi audit log thao tác update
    Cho rằng tôi sửa LTT "LTT-001" thay đổi trường "Số tiền"
    Khi lưu thành công
    Thì audit log ghi: hành động "update", oldValue, newValue

  @BIZ-AUDIT
  Kịch bản: Submit LTT ghi audit log thao tác submit
    Cho rằng tôi gửi kiểm soát LTT "LTT-001"
    Khi LTT chuyển sang "SUBMITTED"
    Thì audit log ghi: hành động "submit", trạng thái trước, trạng thái sau

  @BIZ-AUDIT
  Kịch bản: Approve LTT ghi audit log thao tác approve
    Cho rằng Checker phê duyệt LTT "LTT-001"
    Khi LTT chuyển sang "IN_CONTROL"
    Thì audit log ghi: hành động "approve_check", user Checker, timestamp

  @BIZ-AUDIT
  Kịch bản: Reject LTT ghi audit log kèm lý do
    Cho rằng Checker từ chối LTT "LTT-001" với lý do "Thông tin không chính xác"
    Khi từ chối hoàn tất
    Thì audit log ghi: hành động "reject", user, lý do từ chối

  @BIZ-AUDIT
  Kịch bản: Mọi thao tác ghi user, timestamp, IP
    Cho rằng bất kỳ thao tác nào trên LTT
    Khi audit log được ghi
    Thì mỗi entry chứa đầy đủ: user, timestamp, IP address
    Và oldValue → newValue cho các trường thay đổi

  @BIZ-EDIT-AUDIT
  Kịch bản: Audit diff hiển thị trên màn hình lịch sử
    Cho rằng LTT "LTT-001" đã sửa 2 trường
    Khi tôi mở tab "Lịch sử xử lý"
    Thì diff hiển thị chính xác {field, oldValue, newValue} cho mỗi trường
    Và version trước/sau hiển thị kèm

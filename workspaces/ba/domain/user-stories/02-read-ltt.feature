# language: vi
# ============================================================================
# Tính năng: Xem chi tiết Lệnh thanh toán
# Màn hình: S03 - Chi tiết LTT
# Vai trò: Maker, Checker, Approver
# Tham chiếu: BIZ-AUDIT
# ============================================================================

Tính năng: Xem chi tiết Lệnh thanh toán
  Với vai trò người dùng có quyền xem LTT
  Tôi muốn xem chi tiết một LTT
  Để nắm bắt thông tin đầy đủ và ra quyết định xử lý

  Kịch bản: Xem chi tiết LTT ở trạng thái DRAFT
    Cho rằng tồn tại LTT mã "LTT-001" ở trạng thái "DRAFT"
    Và tôi là Maker gốc của LTT này
    Khi tôi mở màn hình chi tiết LTT "LTT-001"
    Thì hệ thống hiển thị đầy đủ thông tin LTT
    Và nút "Sửa" được hiển thị và kích hoạt
    Và nút "Xoá" được hiển thị và kích hoạt
    Và nút "Gửi kiểm soát" được hiển thị và kích hoạt

  Kịch bản: Xem chi tiết LTT ở trạng thái SUBMITTED với vai trò Checker
    Cho rằng tồn tại LTT mã "LTT-002" ở trạng thái "SUBMITTED"
    Và tôi đăng nhập với vai trò Checker
    Khi tôi mở màn hình chi tiết LTT "LTT-002"
    Thì hệ thống hiển thị đầy đủ thông tin LTT
    Và nút "Phê duyệt KS" được hiển thị
    Và nút "Từ chối" được hiển thị
    Và các nút "Sửa", "Xoá" bị ẩn hoặc vô hiệu

  Kịch bản: Xem chi tiết LTT ở trạng thái IN_CONTROL với vai trò Approver
    Cho rằng tồn tại LTT mã "LTT-003" ở trạng thái "IN_CONTROL"
    Và tôi đăng nhập với vai trò Approver
    Khi tôi mở màn hình chi tiết LTT "LTT-003"
    Thì hệ thống hiển thị đầy đủ thông tin LTT
    Và nút "Phê duyệt" được hiển thị
    Và nút "Từ chối" được hiển thị
    Và các nút "Sửa", "Xoá", "Gửi kiểm soát" bị ẩn hoặc vô hiệu

  Kịch bản: Xem chi tiết LTT ở trạng thái POSTED
    Cho rằng tồn tại LTT mã "LTT-004" ở trạng thái "POSTED"
    Khi tôi mở màn hình chi tiết LTT "LTT-004"
    Thì hệ thống hiển thị đầy đủ thông tin LTT
    Và tất cả các nút thao tác bị ẩn hoặc vô hiệu
    Và nút "Đảo lệnh" được hiển thị nếu user có quyền Approver

  Kịch bản: Xem lịch sử audit của LTT
    Cho rằng tồn tại LTT mã "LTT-001" đã qua nhiều lần thao tác
    Khi tôi mở tab "Lịch sử xử lý" trên màn hình chi tiết
    Thì hệ thống hiển thị danh sách tất cả thao tác theo thứ tự thời gian
    Và mỗi entry hiển thị: timestamp, user, hành động, oldValue, newValue

# language: vi
# ============================================================================
# Tính năng: Xoá Lệnh thanh toán (Soft delete)
# Màn hình: S07 - Xác nhận xoá
# Vai trò: Maker
# Tham chiếu: states.yaml DRAFT/RETURNED_TO_MAKER, BIZ-DELETE-DRAFT, BIZ-DELETE-SOFT
#             VAL-031, VAL-032, VAL-035, BIZ-OPTIMISTIC-LOCK
# ============================================================================

Tính năng: Xoá lệnh thanh toán
  Với vai trò Người lập (Maker)
  Tôi muốn xoá LTT đang ở trạng thái DRAFT hoặc RETURNED_TO_MAKER
  Để loại bỏ LTT không cần thiết khỏi hệ thống

  @BIZ-DELETE-DRAFT @BIZ-DELETE-SOFT
  Kịch bản: Xoá LTT DRAFT thành công với đầy đủ điều kiện
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và tôi là Maker gốc của LTT này
    Và LTT chưa được reserve fund
    Khi tôi bấm "Xoá" trên màn hình chi tiết
    Và tôi nhập lý do xoá "Không cần thanh toán nữa do sai thông tin" (>= 10 ký tự)
    Và tôi tick checkbox "Đã rà soát và xác nhận xoá"
    Và tôi bấm "Xác nhận xoá"
    Thì LTT được đánh dấu soft-delete: is_deleted=true
    Và deleted_by, deleted_at, deleted_reason được ghi nhận
    Và bản ghi không bị xoá vật lý khỏi database
    Và audit log ghi thao tác "delete"

  @BIZ-DELETE-DRAFT @BIZ-DELETE-SOFT
  Kịch bản: Xoá LTT RETURNED_TO_MAKER thành công
    Cho rằng tồn tại LTT "LTT-002" ở trạng thái "RETURNED_TO_MAKER"
    Và tôi là Maker gốc của LTT này
    Khi tôi thực hiện xoá với lý do hợp lệ và tick xác nhận
    Thì LTT được soft-delete thành công

  @BIZ-RELEASE-HOLD
  Kịch bản: Xoá LTT đã reserve fund thì release hold
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và LTT đã được reserve fund khi Submit trước đó
    Khi tôi xoá LTT thành công
    Thì hệ thống release hold số dư tài khoản nguồn
    Và audit log ghi thao tác "RELEASE_HOLD"

  @VAL-035
  Kịch bản: Xoá LTT không nhập lý do bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và tôi là Maker gốc
    Khi tôi bấm "Xoá" mà không nhập lý do
    Thì nút "Xác nhận xoá" bị vô hiệu
    Và hiển thị "Vui lòng tick xác nhận đã rà soát"

  @VAL-035
  Kịch bản: Xoá LTT chưa tick checkbox xác nhận bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và tôi đã nhập lý do xoá
    Khi tôi bấm "Xoá" mà chưa tick checkbox xác nhận
    Thì nút "Xác nhận xoá" bị vô hiệu

  @VAL-031
  Kịch bản: Xoá LTT ở trạng thái không cho phép bị từ chối
    Cho rằng tồn tại LTT "LTT-003" ở trạng thái "SUBMITTED"
    Khi tôi bấm "Xoá"
    Thì hệ thống từ chối thao tác
    Và hiển thị thông báo "LTT đang ở trạng thái [SUBMITTED], không cho phép Sửa/Xoá"

  @VAL-032
  Kịch bản: User khác Maker gốc không được xoá LTT
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và tôi đăng nhập với user "maker02" (không phải Maker gốc)
    Khi tôi mở chi tiết LTT "LTT-001"
    Thì nút "Xoá" bị vô hiệu

  @BIZ-DELETE-SOFT
  Kịch bản: Số YCTT của LTT đã soft-delete không được tái sử dụng
    Cho rằng LTT "LTT-001" với số YCTT "10052026000001" đã bị soft-delete
    Khi tôi tạo LTT mới và cố gắng dùng số YCTT "10052026000001"
    Thì hệ thống từ chối và thông báo số YCTT đã tồn tại

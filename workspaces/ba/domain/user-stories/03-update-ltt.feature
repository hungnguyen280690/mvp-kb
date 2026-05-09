# language: vi
# ============================================================================
# Tính năng: Sửa Lệnh thanh toán (Edit)
# Màn hình: S02 - Sửa LTT
# Vai trò: Maker
# Tham chiếu: states.yaml DRAFT/RETURNED_TO_MAKER, BIZ-EDIT-OWN, BIZ-EDIT-IMMUTABLE
#             VAL-031, VAL-032, VAL-033, VAL-034, VAL-036, BIZ-OPTIMISTIC-LOCK
# ============================================================================

Tính năng: Sửa Lệnh thanh toán
  Với vai trò Người lập (Maker)
  Tôi muốn sửa LTT đang ở trạng thái DRAFT hoặc RETURNED_TO_MAKER
  Để điều chỉnh thông tin trước khi gửi kiểm soát

  @BIZ-EDIT-OWN @VAL-031
  Kịch bản: Maker gốc sửa LTT ở trạng thái DRAFT thành công
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và tôi là Maker gốc của LTT này
    Khi tôi bấm "Sửa" trên màn hình chi tiết LTT
    Thì hệ thống mở form S02 ở chế độ Edit
    Và các trường thông tin được điền sẵn từ dữ liệu hiện tại

  @BIZ-EDIT-OWN @VAL-031
  Kịch bản: Maker gốc sửa LTT ở trạng thái RETURNED_TO_MAKER thành công
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "RETURNED_TO_MAKER"
    Và tôi là Maker gốc của LTT này
    Khi tôi bấm "Sửa" trên màn hình chi tiết LTT
    Thì hệ thống mở form S02 ở chế độ Edit
    Và tôi có thể chỉnh sửa các trường thông tin

  @VAL-031
  Kịch bản: Sửa LTT ở trạng thái không cho phép bị từ chối
    Cho rằng tồn tại LTT "LTT-002" ở trạng thái "SUBMITTED"
    Khi tôi bấm "Sửa" trên màn hình chi tiết LTT
    Thì hệ thống từ chối thao tác
    Và hiển thị thông báo "LTT đang ở trạng thái [SUBMITTED], không cho phép Sửa/Xoá"

  @VAL-032
  Kịch bản: User khác Maker gốc không được phép sửa LTT
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và Maker gốc là user "maker01"
    Và tôi đăng nhập với user "maker02"
    Khi tôi mở chi tiết LTT "LTT-001"
    Thì nút "Sửa" bị vô hiệu
    Và hệ thống hiển thị "Chỉ Người lập gốc mới được phép Sửa/Xoá LTT này"

  @VAL-033
  Kịch bản: Không mở sửa khi LTT đang bị user khác hold lock
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "DRAFT"
    Và user "maker02" đang mở form sửa LTT này
    Khi tôi cố gắng mở sửa LTT "LTT-001"
    Thì hệ thống từ chối và hiển thị "LTT đang được [maker02] chỉnh sửa, vui lòng thử lại sau"

  @BIZ-EDIT-IMMUTABLE @VAL-034
  Kịch bản: Không thể thay đổi trường immutable khi sửa LTT
    Cho rằng tôi đang sửa LTT "LTT-001" ở trạng thái "DRAFT"
    Khi tôi xem các trường "Số YCTT", "Người lập", "Ngày lập"
    Thì các trường này hiển thị ở trạng thái disabled (không thể chỉnh sửa)
    Và nếu gửi request đổi giá trị immutable → backend reject

  @BIZ-OPTIMISTIC-LOCK @VAL-036
  Kịch bản: Optimistic lock từ chối khi version client khác version server
    Cho rằng tôi đang sửa LTT "LTT-001" với version client = 3
    Và version server hiện tại đã là 4 (do user khác sửa trước đó)
    Khi tôi bấm "Lưu"
    Thì hệ thống từ chối thao tác
    Và hiển thị "Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục"

  @BIZ-EDIT-AUDIT
  Kịch bản: Sửa LTT ghi audit diff cấp trường
    Cho rằng tôi sửa LTT "LTT-001" thay đổi "Số tiền" từ 100000000 thành 200000000
    Và thay đổi "NH nhận" từ "NH01" thành "NH02"
    Khi tôi bấm "Lưu"
    Thì audit log lưu 2 diff entry
    Và mỗi entry chứa {field, oldValue, newValue}
    Và version trước/sau được ghi kèm

# language: vi
# ============================================================================
# Tính năng: Optimistic lock cho LTT
# Tham chiếu: BIZ-OPTIMISTIC-LOCK, VAL-036
# ============================================================================

Tính năng: Optimistic lock cho LTT
  Với vai trò hệ thống
  Tôi muốn đảm bảo optimistic lock trên mọi thao tác Sửa/Xoá
  Để ngăn chặn xung đột khi nhiều user thao tác cùng lúc

  @BIZ-OPTIMISTIC-LOCK
  Kịch bản: Version client trùng version server cho phép thao tác
    Cho rằng tôi mở sửa LTT "LTT-001" với version = 3
    Và version server hiện tại cũng là 3
    Khi tôi bấm "Lưu"
    Thì hệ thống chấp nhận thao tác
    Và version tăng lên 4

  @BIZ-OPTIMISTIC-LOCK @VAL-036
  Kịch bản: Version client khác version server từ chối thao tác
    Cho rằng tôi mở sửa LTT "LTT-001" với version client = 3
    Và version server hiện tại đã là 4
    Khi tôi bấm "Lưu"
    Thì hệ thống từ chối thao tác
    Và hiển thị "Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục"

  @BIZ-OPTIMISTIC-LOCK
  Kịch bản: Hai user sửa cùng lúc user sau bị từ chối
    Cho rằng user A mở sửa LTT "LTT-001" version 3
    Và user B cũng mở sửa LTT "LTT-001" version 3
    Khi user A lưu thành công (version → 4)
    Và user B cố gắng lưu với version 3
    Thì thao tác của user B bị từ chối
    Và user B phải tải lại trang để lấy version mới nhất

  @BIZ-OPTIMISTIC-LOCK
  Kịch bản: Optimistic lock áp dụng cho cả thao tác Xoá
    Cho rằng tôi mở xoá LTT "LTT-001" với version = 3
    Và version server đã thay đổi
    Khi tôi bấm "Xác nhận xoá"
    Thì hệ thống từ chối do version không khớp

  @BIZ-OPTIMISTIC-LOCK
  Kịch bản: Optimistic lock sử dụng If-Match header
    Cho rằng tôi gửi request Sửa/Xoá LTT
    Khi request được gửi
    Thì header "If-Match" chứa version hiện tại của client
    Và backend so sánh với version server

# language: vi
# ============================================================================
# Tính năng: Tìm kiếm và lọc danh sách LTT
# Màn hình: S01 - Danh sách LTT
# Vai trò: Tất cả vai trò
# Tham chiếu: BIZ-001, BIZ-002
# ============================================================================

Tính năng: Tìm kiếm và lọc danh sách LTT
  Với vai trò người dùng
  Tôi muốn tìm kiếm và lọc danh sách LTT
  Để nhanh chóng tìm thấy LTT cần xử lý

  @BIZ-001
  Kịch bản: Tìm kiếm LTT với tất cả tham số hợp lệ
    Cho rằng tồn tại nhiều LTT trong hệ thống
    Khi tôi nhập các tham số tìm kiếm: trạng thái "SUBMITTED", kênh "LNH", ngày TT từ-đến hợp lệ
    Và bấm "Tìm kiếm"
    Thì hệ thống trả về danh sách LTT thoả mãn tất cả điều kiện lọc

  @BIZ-001
  Kịch bản: Bỏ trống một tham số tìm kiếm không lọc theo trường đó
    Cho rằng tồn tại nhiều LTT với các kênh khác nhau
    Khi tôi chỉ nhập trạng thái "DRAFT" và bỏ trống kênh
    Và bấm "Tìm kiếm"
    Thì kết quả trả về tất cả LTT trạng thái "DRAFT" bất kể kênh

  @BIZ-001
  Kịch bản: Tìm kiếm với tham số không hợp lệ bị từ chối
    Cho rằng tôi đang ở màn hình S01
    Khi tôi nhập "Từ ngày" lớn hơn "Đến ngày"
    Và bấm "Tìm kiếm"
    Thì hệ thống hiển thị lỗi "Khoảng thời gian không hợp lệ"
    Và không thực hiện tìm kiếm

  @BIZ-002
  Kịch bản: Phân trang mặc định 20 bản ghi sort theo ngày GD giảm dần
    Cho rằng tồn tại hơn 20 LTT trong hệ thống
    Khi tôi mở màn hình S01-Danh sách LTT
    Thì danh sách hiển thị 20 bản ghi đầu tiên
    Và sort theo "Ngày giao dịch" giảm dần

  @BIZ-002
  Kịch bản: Thay đổi page size sang 50 bản ghi
    Cho rằng tôi đang ở màn hình S01
    Khi tôi chọn page size = 50
    Thì danh sách hiển thị 50 bản ghi trên một trang

  @BIZ-002
  Kịch bản: Chuyển trang trong danh sách LTT
    Cho rằng tồn tại hơn 20 LTT và tôi đang ở trang 1
    Khi tôi bấm trang 2
    Thì danh sách hiển thị 20 bản ghi tiếp theo
    Và thông tin phân trang được cập nhật

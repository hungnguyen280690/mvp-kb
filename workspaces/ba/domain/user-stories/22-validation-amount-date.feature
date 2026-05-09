# language: vi
# ============================================================================
# Tính năng: Kiểm tra dữ liệu số tiền và ngày tháng
# Màn hình: S02 - Lập LTT
# Tham chiếu: VAL-012, VAL-013, VAL-014, VAL-015, VAL-016, VAL-028
# ============================================================================

Tính năng: Kiểm tra dữ liệu số tiền và ngày tháng
  Với vai trò Maker
  Khi nhập thông tin số tiền và ngày thanh toán
  Hệ thống kiểm tra tính hợp lệ

  @VAL-014
  Kịch bản: Số tiền bằng 0 bị từ chối
    Cho rằng tôi nhập số tiền chuyển = 0
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Số tiền phải lớn hơn 0"

  @VAL-014
  Kịch bản: Số tiền âm bị từ chối
    Cho rằng tôi nhập số tiền chuyển = -100000
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Số tiền phải lớn hơn 0"

  @VAL-015
  Kịch bản: Tổng tiền chi tiết khác tổng tiền LTT
    Cho rằng tôi nhập tổng tiền LTT là 500.000.000 VND
    Và tổng tiền các dòng khoản mục là 450.000.000 VND
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Tổng tiền chi tiết khác tổng tiền LTT"

  @VAL-016
  Kịch bản: Loại tiền ngoại tệ nhưng ty giá bỏ trống
    Cho rằng tôi chọn loại tiền "USD"
    Và bỏ trống trường "Tỷ giá"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vui lòng nhập tỷ giá hợp lệ với ngoại tệ"

  @VAL-016
  Kịch bản: Loại tiền ngoại tệ nhưng tỷ giá bằng 0
    Cho rằng tôi chọn loại tiền "USD"
    Và nhập tỷ giá = 0
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vui lòng nhập tỷ giá hợp lệ với ngoại tệ"

  @VAL-012
  Kịch bản: Ngày thanh toán nhỏ hơn ngày làm việc hiện tại
    Cho rằng ngày làm việc hiện tại là "10/05/2026"
    Và tôi nhập ngày thanh toán "09/05/2026"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Ngày thanh toán không được nhỏ hơn ngày làm việc hiện tại"

  @VAL-013
  Kịch bản: Ngày thanh toán rơi vào ngày nghỉ/ lễ
    Cho rằng ngày tôi chọn rơi vào ngày nghỉ theo lịch hệ thống
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Ngày thanh toán rơi vào ngày nghỉ; vui lòng chọn ngày làm việc"

  @VAL-028
  Kịch bản: Số tiền vượt hạn mức giao dịch
    Cho rằng số tiền LTT = 2.000.000.000 VND
    Và hạn mức cấu hình cho kênh/loại lệnh/vai trò là 1.000.000.000 VND
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Số tiền vượt hạn mức được phép duyệt"

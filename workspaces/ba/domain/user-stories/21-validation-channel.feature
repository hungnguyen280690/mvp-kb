# language: vi
# ============================================================================
# Tính năng: Kiểm tra dữ liệu kênh thanh toán
# Màn hình: S02 - Lập LTT
# Tham chiếu: VAL-006, VAL-007, VAL-008, VAL-009, VAL-017
# ============================================================================

Tính năng: Kiểm tra dữ liệu kênh thanh toán
  Với vai trò Maker
  Khi nhập thông tin kênh thanh toán
  Hệ thống kiểm tra tính hợp lệ của kênh, loại lệnh, NH nhận

  @VAL-006
  Kịch bản: Kênh LNH nhưng NH nhận không thuộc danh mục NHNN/CITAD
    Cho rằng tôi chọn kênh "Liên ngân hàng"
    Và nhập NH nhận không có trong danh mục NHNN/CITAD
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "NH nhận không thuộc kênh LNH; vui lòng kiểm tra cấu hình"
    Và highlight đỏ trường NH nhận

  @VAL-007
  Kịch bản: Kênh SP nhưng loại lệnh không thuộc nhóm Song phương
    Cho rằng tôi chọn kênh "Song phương"
    Và chọn loại lệnh không thuộc nhóm SP
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Loại lệnh không hợp lệ với kênh đã chọn"

  @VAL-008
  Kịch bản: NH/KB chuyển khác mã NH trực tiếp của user
    Cho rằng tôi thuộc đơn vị mã NH "01101"
    Và trường "NH/KB chuyển" autofill là "01101"
    Khi tôi cố gắng đổi "NH/KB chuyển" sang mã khác
    Thì hệ thống hiển thị lỗi "Đơn vị không có quyền chuyển từ mã NH này"

  @VAL-009
  Kịch bản: NH/KB nhận trùng với NH/KB chuyển
    Cho rằng tôi nhập NH/KB chuyển "01101"
    Và nhập NH/KB nhận cũng là "01101"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "NH chuyển và NH nhận không được trùng nhau"

  @VAL-017
  Kịch bản: Kênh LNH nhưng không chọn loại giao dịch
    Cho rằng tôi chọn kênh "Liên ngân hàng"
    Và không chọn "Loại giao dịch"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Loại giao dịch là bắt buộc với kênh LNH"

# language: vi
# ============================================================================
# Tính năng: Kiểm tra dữ liệu tham chiếu và định danh
# Màn hình: S02 - Lập LTT
# Tham chiếu: VAL-010, VAL-011, VAL-018, VAL-023, VAL-025, VAL-026, VAL-027
# ============================================================================

Tính năng: Kiểm tra dữ liệu tham chiếu và định danh
  Với vai trò Maker
  Khi nhập số YCTT, chứng từ, định danh
  Hệ thống kiểm tra tính hợp lệ

  @VAL-010
  Kịch bản: Số YCTT đã tồn tại trong cùng ngày, cùng đơn vị
    Cho rằng đã tồn tại LTT với số YCTT "10052026000001" trong ngày 10/05/2026
    Và cùng đơn vị KBNN
    Khi tôi nhập số YCTT "10052026000001" cho LTT mới cùng ngày, cùng đơn vị
    Thì hệ thống hiển thị lỗi "Số YCTT đã tồn tại, vui lòng kiểm tra hoặc để hệ thống tự sinh"

  @VAL-011
  Kịch bản: Số YCTT không đúng định dạng kênh LNH
    Cho rằng tôi chọn kênh "LNH"
    Và nhập số YCTT không khớp pattern "ddMMyyyy + 6-digit seq"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Số YCTT không đúng định dạng cấu hình"

  @VAL-018
  Kịch bản: Kênh SP nhưng bỏ trống số chứng từ gốc
    Cho rằng tôi chọn kênh "Song phương" (SP)
    Và bỏ trống trường "Số chứng từ gốc"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vui lòng nhập số chứng từ gốc cho kênh TTSP"

  @VAL-023
  Kịch bản: Diễn giải khoản mục bỏ trống
    Cho rằng tôi bỏ trống trường "Diễn giải khoản mục"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Diễn giải bắt buộc và tối đa 250 ký tự"

  @VAL-023
  Kịch bản: Diễn giải khoản mục quá 250 ký tự
    Cho rằng tôi nhập diễn giải dài hơn 250 ký tự
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Diễn giải bắt buộc và tối đa 250 ký tự"

  @VAL-025
  Kịch bản: Định dạng CCCD sai
    Cho rằng tôi nhập số CCCD "12345" (không đủ 12 số)
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Định dạng giấy tờ không hợp lệ"

  @VAL-025
  Kịch bản: Định dạng mã doanh nghiệp sai
    Cho rằng tôi nhập mã doanh nghiệp "AB" (không đúng 10-13 ký tự)
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Định dạng giấy tờ không hợp lệ"

  @VAL-026
  Kịch bản: Nhập CCCD nhưng bỏ trống ngày cấp
    Cho rằng tôi nhập số CCCD hợp lệ
    Nhưng bỏ trống "Ngày cấp"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vui lòng nhập đầy đủ Ngày cấp và Nơi cấp"

  @VAL-026
  Kịch bản: Nhập CCCD nhưng bỏ trống nơi cấp
    Cho rằng tôi nhập số CCCD hợp lệ và ngày cấp
    Nhưng bỏ trống "Nơi cấp"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vui lòng nhập đầy đủ Ngày cấp và Nơi cấp"

  @VAL-027
  Kịch bản: Loại lệnh trái phiếu chính phủ nhưng thiếu mã TPCP
    Cho rằng tôi chọn loại lệnh "Trái phiếu chính phủ"
    Và bỏ trống trường "Mã TPCP"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Mã TPCP bắt buộc và phải đúng định dạng"

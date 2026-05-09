# language: vi
# ============================================================================
# Tính năng: Kiểm tra dữ liệu COA và tài khoản
# Màn hình: S02 - Lập LTT
# Tham chiếu: VAL-019, VAL-020, VAL-021, VAL-022, VAL-024
# ============================================================================

Tính năng: Kiểm tra dữ liệu COA và tài khoản
  Với vai trò Maker
  Khi nhập thông tin tổ hợp COA và tài khoản
  Hệ thống kiểm tra tính hợp lệ theo bảng cấu hình

  @VAL-019 @BIZ-COA-CROSS
  Kịch bản: Tổ hợp COA hợp lệ được chấp nhận
    Cho rằng tôi nhập tổ hợp Mã quỹ/TK/Cấp NS/Chương/NDKT hợp lệ
    Và tổ hợp tồn tại trong DMHT.COA-MATRIX
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống chấp nhận tổ hợp COA

  @VAL-019 @BIZ-COA-CROSS
  Kịch bản: Tổ hợp COA không hợp lệ bị từ chối
    Cho rằng tôi nhập tổ hợp Mã quỹ/TK/Cấp NS/Chương không có trong DMHT.COA-MATRIX
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Tổ hợp COA không hợp lệ tại [segment]"

  @BIZ-COA-CROSS
  Kịch bản: Đổi Mã quỹ kiểm tra lại toàn bộ tổ hợp COA
    Cho rằng tôi đã nhập tổ hợp COA hợp lệ với Mã quỹ "01"
    Khi tôi đổi Mã quỹ sang "02"
    Thì hệ thống kiểm tra lại toàn bộ tổ hợp COA với Mã quỹ mới

  @VAL-020
  Kịch bản: Mã DVQHNS không tồn tại
    Cho rằng tôi nhập mã DVQHNS không có trong DMHT.DVQHNS
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Mã DVQHNS không hợp lệ hoặc đang bị khoá"

  @VAL-020
  Kịch bản: Mã DVQHNS đã bị khoá
    Cho rằng tôi nhập mã DVQHNS đã bị đánh dấu khoá
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Mã DVQHNS không hợp lệ hoặc đang bị khoá"

  @VAL-021
  Kịch bản: Cấp NS/Chương không khớp với Mã quỹ
    Cho rằng tôi chọn Mã quỹ "01"
    Và chọn Cấp NS/Chương không thuộc danh mục cho phép theo Mã quỹ "01"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Cấp NS / Chương không khớp với mã quỹ"

  @VAL-022 @BIZ-NDND-RULE
  Kịch bản: NDKT không hợp lệ với loại lệnh đã chọn
    Cho rằng tôi chọn loại lệnh "01"
    Và chọn NDKT không thuộc tập hợp cho phép theo loại lệnh "01"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "NDKT không hợp lệ với loại lệnh đã chọn"

  @VAL-024
  Kịch bản: Số tài khoản sai checksum chuẩn NHNN
    Cho rằng tôi nhập số tài khoản không đúng checksum theo chuẩn TK NHNN
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Số tài khoản không hợp lệ"

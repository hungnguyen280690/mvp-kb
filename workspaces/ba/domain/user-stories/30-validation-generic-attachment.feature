# language: vi
# ============================================================================
# Tính năng: Kiểm tra dữ liệu chung và đính kèm
# Tham chiếu: VAL-001, VAL-002, VAL-003, VAL-004, VAL-029
# ============================================================================

Tính năng: Kiểm tra dữ liệu chung và đính kèm
  Với vai trò Maker
  Khi nhập thông tin LTT và đính kèm chứng từ
  Hệ thống kiểm tra tính hợp lệ

  @VAL-001
  Kịch bản: Giá trị dropdown không tồn tại trong danh mục
    Cho rằng tôi chọn giá trị từ dropdown "Loại lệnh"
    Và giá trị không tồn tại trong danh mục cấu hình
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Giá trị không nằm trong danh mục"
    Và highlight đỏ trường tương ứng

  @VAL-002
  Kịch bản: Độ dài trường vượt quá giới hạn
    Cho rằng tôi nhập diễn giải dài hơn giới hạn cấu hình
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Vượt quá số ký tự cho phép"
    Và highlight đỏ trường tương ứng

  @VAL-003
  Kịch bản: Sai định dạng ngày tháng
    Cho rằng tôi nhập ngày với định dạng không đúng "dd/MM/yyyy"
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Ngày không hợp lệ"

  @VAL-004
  Kịch bản: Từ ngày lớn hơn Đến ngày
    Cho rằng tôi nhập "Từ ngày" = "15/05/2026"
    Và "Đến ngày" = "10/05/2026"
    Khi tôi bấm "Tìm kiếm" hoặc "Gửi kiểm soát"
    Thì hệ thống hiển thị lỗi "Khoảng thời gian không hợp lệ"

  @VAL-029
  Kịch bản: Đính kèm file quá 10MB bị từ chối
    Cho rằng tôi đính kèm file chứng từ có dung lượng 15MB
    Khi tôi bấm "Tải lên"
    Thì hệ thống từ chối file
    Và hiển thị lỗi "File đính kèm vượt giới hạn hoặc sai định dạng"

  @VAL-029
  Kịch bản: Đính kèm file sai định dạng bị từ chối
    Cho rằng tôi đính kèm file có định dạng ".exe"
    Khi tôi bấm "Tải lên"
    Thì hệ thống từ chối file
    Và chỉ cho phép định dạng pdf, jpg, png, docx

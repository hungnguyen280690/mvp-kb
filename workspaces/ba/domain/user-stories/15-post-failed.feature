# language: vi
# ============================================================================
# Tính năng: Xử lý LTT ghi sổ thất bại (POST_FAILED)
# Vai trò: Hệ thống + Vận hành
# Tham chiếu: states.yaml POST_FAILED
# ============================================================================

Tính năng: Xử lý LTT ghi sổ thất bại
  Với vai trò vận hành
  Tôi muốn xử lý LTT bị lỗi ghi sổ kế toán
  Để đảm bảo tính toàn vẹn dữ liệu

  Kịch bản: LTT POST_FAILED bị chặn mọi thao tác
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "POST_FAILED"
    Khi user mở chi tiết LTT
    Thì tất cả các nút thao tác bị vô hiệu
    Và hệ thống hiển thị cảnh báo vận hành
    Và cảnh báo được gửi đến đội vận hành

  Kịch bản: Hệ thống đẩy message vào DLQ khi POST_FAILED
    Cho rằng LTT "LTT-001" chuyển sang "POST_FAILED"
    Khi lỗi GL post xảy ra
    Thì message được đẩy vào Dead Letter Queue (DLQ)
    Và LTT bị chặn (block)
    Và cảnh báo gửi đến vận hành

  Kịch bản: POST_FAILED không có transition tự động
    Cho rằng tồn tại LTT ở trạng thái "POST_FAILED"
    Thì không có transition tự động nào khả dụng
    Và cần can thiệp thủ công từ vận hành

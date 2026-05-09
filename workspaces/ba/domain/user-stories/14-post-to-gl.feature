# language: vi
# ============================================================================
# Tính năng: Ghi sổ kế toán GL (CONFIRMED → POSTED)
# Vai trò: Hệ thống (tự động)
# Tham chiếu: states.yaml CONFIRMED→POSTED, BIZ-COA-CROSS
# ============================================================================

Tính năng: Ghi sổ kế toán GL
  Với vai trò hệ thống
  Khi LTT đã được NH/KB xác nhận thành công
  Hệ thống ghi sổ kế toán (GL post) và khoá chỉnh sửa LTT

  @BIZ-COA-CROSS
  Kịch bản: GL post thành công chuyển POSTED
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "CONFIRMED"
    Và tổ hợp COA hợp lệ
    Khi hệ thống thực hiện GL post
    Thì LTT chuyển từ "CONFIRMED" sang "POSTED"
    Và số chứng từ GL được cập nhật
    Và LTT bị khoá không cho chỉnh sửa
    Và audit log ghi thao tác "post"

  @BIZ-COA-CROSS
  Kịch bản: GL post thất bại do kỳ đóng
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "CONFIRMED"
    Và kỳ kế toán đã đóng
    Khi hệ thống thực hiện GL post
    Thì GL post thất bại
    Và LTT chuyển sang "POST_FAILED"

  @BIZ-COA-CROSS
  Kịch bản: GL post thất bại do COA sai
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "CONFIRMED"
    Và tổ hợp COA không hợp lệ
    Khi hệ thống thực hiện GL post
    Thì GL post thất bại
    Và LTT chuyển sang "POST_FAILED"

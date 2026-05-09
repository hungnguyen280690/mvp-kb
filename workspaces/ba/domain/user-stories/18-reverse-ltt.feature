# language: vi
# ============================================================================
# Tính năng: Đảo lệnh thanh toán (POSTED → REVERSED)
# Vai trò: Approver
# Tham chiếu: states.yaml POSTED→REVERSED, BIZ-MAKER-CHECKER, BIZ-SOD
# ============================================================================

Tính năng: Đảo lệnh thanh toán
  Với vai trò Approver
  Tôi muốn tạo bút toán đảo cho LTT đã ghi sổ
  Để sửa lỗi hoặc hoàn tác thanh toán

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Tạo bút toán đảo cho LTT POSTED thành công
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "POSTED"
    Và tôi đăng nhập với vai trò Approver user "approver01"
    Khi tôi bấm "Đảo lệnh" trên màn hình chi tiết
    Thì hệ thống tạo LTT đảo mới
    Và LTT gốc "LTT-001" bị khoá không cho chỉnh sửa
    Và LTT gốc chuyển sang trạng thái "REVERSED"
    Và LTT đảo chạy chu trình mới từ DRAFT
    Và audit log ghi thao tác "reverse"

  @BIZ-MAKER-CHECKER @BIZ-SOD
  Kịch bản: Đảo lệnh vi phạm SoD bị từ chối
    Cho rằng tồn tại LTT "LTT-001" ở trạng thái "POSTED"
    Và user Approver vi phạm SoD
    Khi cố gắng đảo lệnh
    Thì hệ thống từ chối thao tác

  Kịch bản: LTT REVERSED là trạng thái cuối
    Cho rằng LTT "LTT-001" ở trạng thái "REVERSED"
    Khi user mở chi tiết LTT
    Thì không có nút thao tác nào hiển thị
    Và LTT bị khoá hoàn toàn
    Và chỉ có thể xem thông tin và lịch sử

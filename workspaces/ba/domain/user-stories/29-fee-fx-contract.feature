# language: vi
# ============================================================================
# Tính năng: Tính phí, tỷ giá, liên kết hợp đồng
# Tham chiếu: BIZ-FEE-CALC, BIZ-FX-RATE, BIZ-CONTRACT-LINK
# ============================================================================

Tính năng: Tính phí, tỷ giá và liên kết hợp đồng
  Với vai trò Maker và Approver
  Hệ thống tự động tính phí, kiểm tra tỷ giá và liên kết hợp đồng

  @BIZ-FEE-CALC
  Kịch bản: Tính phí tự động theo kênh x loại lệnh x số tiền
    Cho rằng tôi nhập LTT kênh "LNH", loại lệnh "01", số tiền 100.500.000 VND
    Khi tôi điền thông tin
    Thì hệ thống tự động tính phí theo bảng phí cấu hình
    Và phí được làm tròn đến đồng cho VND

  @BIZ-FEE-CALC
  Kịch bản: Phí ngoại tệ làm tròn đến cent
    Cho rằng tôi nhập LTT ngoại tệ USD
    Khi hệ thống tính phí
    Thì phí được làm tròn đến cent

  @BIZ-FEE-CALC
  Kịch bản: Đổi kênh hoặc loại lệnh tính lại phí
    Cho rằng phí đã được tính cho kênh "LNH"
    Khi tôi đổi kênh sang "SP"
    Thì hệ thống tính lại phí theo kênh "SP"

  @BIZ-FX-RATE
  Kịch bản: LTT ngoại tệ tỷ giá trong biên độ ±2% được chấp nhận
    Cho rằng tôi nhập LTT ngoại tệ USD với tỷ giá 25.500
    Và tỷ giá tham chiếu là 25.300
    Và biên độ 0,79% (trong ±2%)
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống chấp nhận tỷ giá

  @BIZ-FX-RATE
  Kịch bản: LTT ngoại tệ tỷ giá vượt biên độ ±2% cảnh báo Approver
    Cho rằng tôi nhập LTT ngoại tệ USD với tỷ giá 26.500
    Và tỷ giá tham chiếu là 25.300
    Và biên độ vượt ±2%
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống cảnh báo Approver về tỷ giá vượt biên độ

  @BIZ-FX-RATE
  Kịch bản: LTT VND không kiểm tra tỷ giá
    Cho rằng tôi nhập LTT loại tiền VND
    Khi hệ thống xử lý
    Thì không kiểm tra tỷ giá

  @BIZ-CONTRACT-LINK
  Kịch bản: LTT liên kết hợp đồng số dư đủ được chấp nhận
    Cho rằng tôi liên kết LTT với hợp đồng QLChi
    Và số dư hợp đồng còn lại >= số tiền LTT
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống chấp nhận

  @BIZ-CONTRACT-LINK
  Kịch bản: LTT liên kết hợp đồng số dư không đủ bị từ chối
    Cho rằng tôi liên kết LTT với hợp đồng QLChi
    Và số dư hợp đồng còn lại < số tiền LTT
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống từ chối và thông báo số dư hợp đồng không đủ

  @BIZ-CONTRACT-LINK
  Kịch bản: Approve LTT giảm trừ số dư hợp đồng
    Cho rằng LTT "LTT-001" đã liên kết hợp đồng và được Approve
    Khi LTT chuyển sang "APPROVED"
    Thì số dư hợp đồng được giảm trừ bằng số tiền LTT

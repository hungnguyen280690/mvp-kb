# language: vi
# ============================================================================
# Tính năng: Gửi kiểm soát LTT (Submit: DRAFT → SUBMITTED)
# Màn hình: S02 - Lập LTT
# Vai trò: Maker
# Tham chiếu: states.yaml DRAFT→SUBMITTED, VAL-005, VAL-019, BIZ-COA-CROSS,
#             BIZ-LIMIT, BIZ-COT-CHECK, BIZ-RESERVE-FUND, BIZ-DUPLICATE
# ============================================================================

Tính năng: Gửi kiểm soát LTT
  Với vai trò Người lập (Maker)
  Tôi muốn gửi LTT để Checker thẩm định
  Để LTT vào quy trình kiểm soát 3 cấp

  @VAL-005 @VAL-019 @BIZ-COA-CROSS @BIZ-LIMIT @BIZ-COT-CHECK
  Kịch bản: Gửi kiểm soát LTT thành công — happy path
    Cho rằng tôi đã nhập đầy đủ tất cả trường bắt buộc trên form S02
    Và tổ hợp COA hợp lệ theo DMHT.COA-MATRIX
    Và số tiền trong hạn mức cho phép
    Và thời gian hiện tại trong giờ giao dịch của kênh
    Khi tôi bấm "Gửi kiểm soát"
    Thì LTT chuyển từ trạng thái "DRAFT" sang "SUBMITTED"
    Và hệ thống reserve fund số dư tài khoản nguồn bằng số tiền LTT
    Và audit log ghi thao tác "submit"
    Và thông báo gửi đến Checker

  @VAL-005
  Kịch bản: Gửi kiểm soát với trường bắt buộc bị bỏ trống bị từ chối
    Cho rằng tôi đang ở form S02
    Và trường "NH/KB nhận" bị bỏ trống
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống từ chối gửi
    Và highlight đỏ trường "NH/KB nhận"
    Và hiển thị "Vui lòng nhập NH/KB nhận"

  @BIZ-RESERVE-FUND
  Kịch bản: Gửi kiểm soát khi số dư tài khoản nguồn không đủ bị từ chối
    Cho rằng tôi đã nhập đầy đủ thông tin LTT với số tiền 500.000.000 VND
    Và số dư khả dụng tài khoản nguồn chỉ còn 300.000.000 VND
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống từ chối và thông báo "Số dư không đủ để đặt giữ quỹ"

  @BIZ-COT-CHECK
  Kịch bản: Gửi kiểm soát sau giờ cut-off kênh LNH
    Cho rằng tôi đã nhập đầy đủ thông tin LTT kênh LNH
    Và thời gian hiện tại đã sau giờ cut-off của kênh LNH
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống cảnh báo và đề xuất chuyển sang ngày làm việc kế tiếp
    Và hiển thị thông báo xác nhận cho user

  @BIZ-COT-CHECK
  Kịch bản: Gửi kiểm soát trước giờ cut-off 5 phút vẫn thành công
    Cho rằng tôi đã nhập đầy đủ thông tin LTT
    Và thời gian hiện tại trước giờ cut-off 5 phút
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống chấp nhận và LTT chuyển sang "SUBMITTED"

  @BIZ-DUPLICATE
  Kịch bản: Cảnh báo LTT trùng lặp trong N phút gần đây
    Cho rằng trong 30 phút gần nhất đã có LTT cùng đơn vị, NH nhận, số tiền, số chứng từ gốc
    Khi tôi bấm "Gửi kiểm soát" cho LTT mới có cùng thông tin
    Thì hệ thống hiển thị cảnh báo trùng lặp
    Và yêu cầu user xác nhận trước khi tiếp tục

  @BIZ-DUPLICATE
  Kịch bản: User xác nhận sau cảnh báo trùng lặp thì cho gửi
    Cho rằng hệ thống đã cảnh báo LTT trùng lặp
    Khi tôi bấm "Xác nhận tiếp tục"
    Thì hệ thống cho phép gửi kiểm soát bình thường

  @BIZ-LIMIT
  Kịch bản: Số tiền vượt hạn mức yêu cầu phê duyệt cấp cao hơn
    Cho rằng tôi nhập số tiền 1.000.000.000 VND
    Và hạn mức cấu hình cho kênh/loại lệnh/vai trò là 500.000.000 VND
    Khi tôi bấm "Gửi kiểm soát"
    Thì hệ thống cảnh báo số tiền vượt hạn mức
    Và yêu cầu phê duyệt cấp cao hơn

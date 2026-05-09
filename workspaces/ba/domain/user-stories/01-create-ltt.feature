# language: vi
# ============================================================================
# Tính năng: Lập lệnh thanh toán đi thủ công (Tạo mới)
# Màn hình: S02 - Lập LTT
# Vai trò: Maker
# Tham chiếu: states.yaml DRAFT, BIZ-AUTOFILL, BIZ-IDGEN, VAL-005, VAL-019
# ============================================================================

Tính năng: Lập lệnh thanh toán đi thủ công
  Với vai trò Người lập (Maker)
  Tôi muốn tạo mới Lệnh thanh toán (LTT) đi NHNN thủ công
  Để thực hiện thanh toán cho đối tượng thụ hưởng qua các kênh LNH/SP/LKB

  @BIZ-AUTOFILL @BIZ-IDGEN
  Kịch bản: Mở form lập LTT mới với giá trị mặc định autofill
    Cho rằng tôi đã đăng nhập với vai trò Maker
    Và tôi thuộc đơn vị KBNN mã "01101"
    Khi tôi mở màn hình S02-Lập LTT mới
    Thì trường "NH/KB chuyển" được điền tự động bằng mã NH trực tiếp của user
    Và trường "Người lập" được điền tự động bằng tên user hiện tại
    Và trường "Ngày thanh toán" được điền tự động bằng ngày làm việc hiện tại
    Và trường "Loại tiền" mặc định là "VND"
    Và trường "Mã quỹ" mặc định là "01"
    Và LTT ở trạng thái "DRAFT"

  @BIZ-IDGEN
  Kịch bản: Hệ thống tự sinh số YCTT khi Maker bỏ trống kênh LNH
    Cho rằng tôi đang ở màn hình S02-Lập LTT mới
    Và tôi chọn kênh "Liên ngân hàng" (LNH)
    Và tôi bỏ trống trường "Số YCTT"
    Khi tôi bấm "Lưu nháp"
    Thì hệ thống tự sinh số YCTT theo pattern "ddMMyyyy + 6-digit seq" của đơn vị
    Và số YCTT là duy nhất trong ngày làm việc và đơn vị

  @BIZ-IDGEN
  Kịch bản: Hệ thống tự sinh số YCTT khi Maker bỏ trống kênh SP
    Cho rằng tôi đang ở màn hình S02-Lập LTT mới
    Và tôi chọn kênh "Song phương" (SP)
    Và tôi bỏ trống trường "Số YCTT"
    Khi tôi bấm "Lưu nháp"
    Thì hệ thống tự sinh số YCTT theo pattern "<maNH>YYYYMMDD<seq>"

  @BIZ-IDGEN
  Kịch bản: Hệ thống tự sinh số YCTT khi Maker bỏ trống kênh LKB
    Cho rằng tôi đang ở màn hình S02-Lập LTT mới
    Và tôi chọn kênh "Liên kho bạc" (LKB)
    Và tôi bỏ trống trường "Số YCTT"
    Khi tôi bấm "Lưu nháp"
    Thì hệ thống tự sinh số YCTT theo pattern "<maKB>YYYY<seq>"

  @BIZ-IDGEN
  Kịch bản: Hai LTT cùng kênh LNH cùng ngày sinh số thứ tự tăng dần không trùng
    Cho rằng đã có LTT kênh LNH được lập trong ngày với seq "000001"
    Khi tôi lập LTT mới cùng kênh LNH cùng ngày
    Thì số YCTT mới có seq "000002"
    Và không trùng với LTT đã có

  @BIZ-IDGEN
  Kịch bản: Maker nhập sẵn số YCTT thì hệ thống giữ nguyên
    Cho rằng tôi đang ở màn hình S02-Lập LTT mới
    Và tôi nhập số YCTT "10052026000099"
    Khi tôi bấm "Lưu nháp"
    Thì hệ thống giữ nguyên số YCTT "10052026000099"
    Và không tự sinh số mới

  @VAL-005
  Kịch bản: Lưu nháp LTT thành công khi nhập đủ trường bắt buộc
    Cho rằng tôi đã nhập đầy đủ các trường bắt buộc trên form S02
    Khi tôi bấm "Lưu nháp"
    Thì LTT được lưu với trạng thái "DRAFT"
    Và hệ thống hiển thị thông báo "Lưu nháp thành công"
    Và audit log ghi thao tác "create" với user, timestamp, IP

  @BIZ-AUDIT
  Kịch bản: Tạo LTT mới ghi audit log đầy đủ
    Cho rằng tôi đăng nhập với user "maker01"
    Khi tôi tạo mới LTT và lưu nháp thành công
    Thì audit log ghi nhận thao tác "create"
    Và audit log chứa user "maker01", timestamp, IP address
    Và audit log chứa oldValue=null và newValue=thông tin LTT

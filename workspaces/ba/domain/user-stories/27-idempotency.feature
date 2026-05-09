# language: vi
# ============================================================================
# Tính năng: Idempotency cho LTT
# Tham chiếu: BIZ-RETRY, BIZ-DUPLICATE
# ============================================================================

Tính năng: Idempotency cho LTT
  Với vai trò hệ thống
  Tôi muốn đảm bảo tính idempotency cho mọi request REST POST và tin nhắn MQ
  Để ngăn chặn xử lý trùng lặp khi retry hoặc mạng chậm

  Kịch bản: POST tạo LTT trùng idempotency key không tạo bản ghi mới
    Cho rằng tôi gửi POST tạo LTT với idempotency key "IDEM-001"
    Và LTT đã được tạo thành công
    Khi tôi gửi lại POST với cùng idempotency key "IDEM-001"
    Thì hệ thống không tạo LTT mới
    Và trả về LTT đã tạo trước đó

  @BIZ-RETRY
  Kịch bản: Gửi LTT qua gateway dùng cùng correlationId khi retry
    Cho rằng LTT "LTT-001" gửi qua gateway lần 1 với correlationId "COR-001"
    Khi hệ thống retry với cùng correlationId "COR-001"
    Thì gateway nhận biết là retry và không xử lý trùng lặp
    Và chỉ chuyển trạng thái khi nhận callback success

  @BIZ-DUPLICATE
  Kịch bản: Cảnh báo trùng lặp LTT dựa trên business key
    Cho rằng trong N phút gần nhất đã có LTT cùng Đơn vị, NH nhận, Số tiền, Số chứng từ gốc
    Khi tôi gửi LTT mới có cùng business key
    Thì hệ thống cảnh báo và yêu cầu xác nhận
    Nhưng không tự động chặn (user có thể confirm tiếp tục)

  Kịch bản: Tin nhắn MQ xử lý idempotent dựa trên message ID
    Cho rằng hệ thống nhận tin nhắn MQ với message ID "MSG-001"
    Và tin nhắn đã được xử lý thành công trước đó
    Khi hệ thống nhận lại tin nhắn cùng message ID "MSG-001"
    Thì hệ thống bỏ qua không xử lý lại

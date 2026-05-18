# Bảng đặc tả chức năng

> Chức năng **Đẩy dữ liệu ra hệ thống bên ngoài** điển hình — tích hợp outbound (gửi dữ liệu sang hệ thống đối tác qua kênh trực tuyến hoặc theo lô). BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.OUT.<DstSys>` |
| Tên chức năng | Đẩy dữ liệu `<Tên nghiệp vụ>` sang hệ thống `<Tên hệ thống đích>` |
| Hệ thống đích | `<Hệ thống đích>` (vd: Sổ cái nhà nước, Hệ thống ký số, Ngân hàng thương mại, Kho bạc, …) |
| Người sử dụng | Tài khoản hệ thống (tự động); Quản trị tích hợp (giám sát, cấu hình); Vận hành (đẩy lại, đối soát) |
| Cơ chế kích hoạt | `<Theo sự kiện nghiệp vụ / Theo lịch định kỳ / Người dùng bấm gửi từ giao diện / Quét hộp thư đi định kỳ>` |
| Phương thức truyền | `<Gọi trực tuyến / Gửi qua hàng đợi tin nhắn / Truyền tệp qua thư mục an toàn>` |
| Mô tả | Tổng hợp, chuyển đổi định dạng và gửi dữ liệu `<…>` từ hệ thống hiện tại sang `<Hệ thống đích>`; theo dõi kết quả; xử lý lỗi và đối soát đầy đủ |
| Độ ưu tiên | Cao |
| SLA | `<vd: gửi trong vòng 30 giây sau khi kích hoạt; tỷ lệ gửi thành công ≥ 99.5%; tối đa 3 lần gửi lại nếu lỗi tạm thời; phản hồi 95% giao dịch trong 2 giây>` |
| URD reference | `<URD-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Bản ghi tại hệ thống nguồn ở trạng thái cho phép gửi (vd: đã được duyệt, sẵn sàng gửi) |
| 2 | Kênh tích hợp tới `<Hệ thống đích>` đang ở trạng thái hoạt động (không bị tạm dừng) |
| 3 | Thông tin xác thực (chứng chỉ, khoá ký, tài khoản tích hợp) còn hiệu lực |
| 4 | Bảng cấu hình mapping/danh mục đối tác đầy đủ và đã được phê duyệt phiên bản hiện hành |
| 5 | Nhật ký (audit log), giám sát, cảnh báo và hộp lỗi đã được cấu hình |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Bản ghi đã được gửi thành công, trạng thái cập nhật ĐÃ GỬI (SENT) và lưu mã định danh (correlationId) trả về từ `<Hệ thống đích>` |
| 2 | Bản ghi lỗi đã được đẩy vào hộp lỗi (DLQ) kèm dữ liệu gốc, lý do lỗi và số lần đã gửi lại |
| 3 | Đã nhận được xác nhận/phản hồi (callback) từ `<Hệ thống đích>` và đối chiếu được với bản ghi gốc |
| 4 | Nhật ký lưu đủ: mã định danh, hệ thống đích, dấu vân tay (hash) của dữ liệu gửi, phản hồi nhận về, thời gian xử lý, kết quả |
| 5 | Sự kiện nội bộ đã được phát hành (`<MOD>.OUT.SENT` hoặc `<MOD>.OUT.FAILED`) để các phân hệ liên quan tiếp tục xử lý |
| 6 | Số liệu giám sát (số bản ghi, tỷ lệ thành công, thời gian xử lý) đã cập nhật lên dashboard |

## 4. Luồng chính

| Bước | Người dùng / Kích hoạt | Hệ thống hiện tại | Hệ thống đích `<DstSys>` |
|---|---|---|---|
| 1 | Bản ghi được duyệt **hoặc** kích hoạt theo lịch / theo sự kiện / theo thao tác người dùng | Phát hiện bản ghi đủ điều kiện gửi; phát sự kiện `<MOD>.OUT.READY` | – |
| 2 | – | Ghi bản ghi vào "hộp thư đi" cùng lúc với bản ghi nghiệp vụ để đảm bảo không thất lạc dữ liệu | – |
| 3 | – | Chuyển đổi dữ liệu sang định dạng mà `<Hệ thống đích>` yêu cầu (mapping trường, tra cứu danh mục) | – |
| 4 | – | Kiểm tra dữ liệu trước khi gửi (xem §8): cấu trúc, độ dài, biên độ, danh mục đích, ký số bắt buộc | – |
| 5 | – | Ký số/tạo chữ ký bảo mật trên gói dữ liệu (nếu kênh yêu cầu) | – |
| 6 | – | Gửi gói dữ liệu qua kênh tích hợp; cập nhật trạng thái → ĐANG GỬI (SENDING) | Nhận yêu cầu |
| 7 | – | Chờ phản hồi đồng bộ hoặc xác nhận bất đồng bộ (callback) | Xác thực, kiểm tra, xử lý → trả phản hồi |
| 8 | – | Cập nhật bản ghi: trạng thái → ĐÃ GỬI (SENT); lưu mã định danh do `<Hệ thống đích>` trả về | – |
| 9 | – | Khi nhận được callback xác nhận chính thức → cập nhật trạng thái → ĐÃ XÁC NHẬN (CONFIRMED); ghi nhật ký đầy đủ | – |
| 10 | – | Phát sự kiện nội bộ `<MOD>.OUT.SENT` / `<MOD>.OUT.CONFIRMED`; cập nhật số liệu giám sát | – |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | Gửi theo lịch (cuối ngày hoặc trong cửa sổ thời gian) | Bộ điều phối quét bản ghi đủ điều kiện trong cửa sổ thời gian → gửi theo lô |
| A2 | Người dùng bấm **Gửi lại** trên giao diện (đẩy lại thủ công) | Kiểm tra quyền và trạng thái bản ghi → đẩy lại đúng bản ghi đang lỗi/đang treo |
| A3 | Gửi theo tệp lô (truyền tệp an toàn) | Gom N bản ghi vào 1 tệp → ký + nén nếu cần → đẩy tệp lên thư mục `<Hệ thống đích>` |
| A4 | Gửi qua hàng đợi tin nhắn (publish sự kiện) | Đưa bản ghi vào hàng đợi; bên đích đọc và xử lý → gửi xác nhận |
| A5 | Đối soát truyền tin (cuối ngày) | Đếm số lượng + tổng giá trị bản ghi đã gửi và so với báo cáo của `<Hệ thống đích>`; sinh báo cáo chênh lệch; gửi cảnh báo nếu lệch |
| A6 | Đối soát chi tiết với ngân hàng | So khớp dữ liệu đã hạch toán với báo cáo từ `<Hệ thống đích báo về>`; sinh báo cáo chênh lệch; cảnh báo |
| A7 | Đối soát lãi/phí cuối kỳ | (Cuối tháng) So khớp dữ liệu lãi/phí đã ghi nhận với báo cáo `<Hệ thống đích báo về>`; sinh báo cáo chênh lệch |
| A8 | Tạm dừng kênh tích hợp (bảo trì/xử lý lỗi) | Quản trị tạm dừng kênh; bản ghi mới chờ ở hộp thư đi; giữ nguyên thứ tự khi mở lại |
| A9 | Tra cứu trạng thái tại đích (đối với bản ghi quá hạn chưa có callback) | Hệ thống tự gọi tra cứu trạng thái tại `<Hệ thống đích>` hoặc đẩy lên màn hình rà soát thủ công |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Bản ghi không đủ điều kiện gửi (chưa được duyệt / thiếu trường bắt buộc) | (1) Không đẩy, (2) Ghi nhật ký, (3) Thông báo người lập / Quản trị |
| E2 | Không tìm thấy mã đối tác/mã đơn vị trong bảng mapping | (1) Đánh dấu `THIẾU_MAPPING`, (2) Cảnh báo quản trị tích hợp, (3) Treo bản ghi đến khi cấu hình xong |
| E3 | `<Hệ thống đích>` từ chối nghiệp vụ (lỗi dữ liệu, sai logic) | (1) Cập nhật trạng thái → THẤT BẠI TẠI ĐÍCH (FAILED_AT_DEST), (2) Đẩy hộp lỗi kèm lý do, (3) Gửi cảnh báo nghiệp vụ |
| E4 | Lỗi tạm thời (mất kết nối, hệ thống đích quá tải, hết thời gian chờ) | Tự động gửi lại theo chính sách giãn cách tăng dần (5s/15s/45s, tối đa 3 lần); sau đó đẩy hộp lỗi |
| E5 | Lỗi vĩnh viễn từ phía đích (dữ liệu hỏng, định dạng không tương thích) | Không gửi lại; đẩy hộp lỗi trạng thái `LỖI_VĨNH_VIỄN`; cảnh báo vận hành |
| E6 | Kênh tích hợp bị tạm dừng / đang bảo trì | Giữ bản ghi ở hộp thư đi; tự động gửi lại theo thứ tự khi kênh mở |
| E7 | Quá hạn chờ xác nhận (không nhận callback trong `<N giờ>`) | Cập nhật trạng thái → QUÁ HẠN CHỜ XÁC NHẬN; kích hoạt luồng tra cứu trạng thái (A9) |
| E8 | Vượt ngưỡng lỗi liên tiếp với 1 đích | Tự động tạm dừng kênh (cơ chế ngắt mạch); cảnh báo quản trị; tự thử khôi phục sau `<N giây>` |
| E9 | Vượt giới hạn tốc độ gửi do `<Hệ thống đích>` quy định | Giãn nhịp gửi (throttle); không đẩy đích quá tải |
| E10 | Người dùng bấm gửi lại nhưng đã vượt giới hạn (≥ 3 lần) | Không cho gửi lại; yêu cầu phê duyệt cấp cao hơn / xử lý nghiệp vụ trước |
| E11 | Phát hiện chênh lệch khi đối soát cuối ngày | Sinh báo cáo chênh lệch; chặn nghiệp vụ cuối ngày tiếp theo cho đến khi xử lý xong |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-OUT-01 — Nguyên tắc "ghi đồng thời": bản ghi nghiệp vụ và bản ghi trong hộp thư đi phải được ghi trong cùng một giao dịch để đảm bảo không thất lạc dữ liệu nếu hệ thống dừng đột ngột |
| 2 | BIZ-OUT-02 — Mỗi lần gửi gắn một mã định danh duy nhất (correlationId) và mã chống trùng (idempotency key) để `<Hệ thống đích>` không xử lý trùng nếu nhận lại |
| 3 | BIZ-OUT-03 — Chỉ tự động gửi lại với lỗi tạm thời (mất kết nối, hết thời gian chờ, đích quá tải); không tự động gửi lại với lỗi do dữ liệu/quyền |
| 4 | BIZ-OUT-04 — Cơ chế tạm dừng kênh tự động: khi số lỗi liên tiếp vượt ngưỡng → tạm dừng để bảo vệ đích; sau khoảng thời gian sẽ thử khôi phục dần |
| 5 | BIZ-OUT-05 — Cấu trúc dữ liệu gửi có phiên bản; trong thời gian chuyển đổi phải hỗ trợ song song ≥ 2 phiên bản |
| 6 | BIZ-OUT-06 — Nhật ký bắt buộc lưu: mã định danh, hệ thống đích, dấu vân tay dữ liệu gửi, phản hồi, thời gian xử lý, số lần gửi lại, kết quả; dữ liệu nhạy cảm phải che một phần |
| 7 | BIZ-OUT-07 — Giới hạn tốc độ gửi theo đích (vd: ≤ 100 yêu cầu/giây); vượt → giãn nhịp, không gây quá tải đích |
| 8 | BIZ-OUT-08 — Trạng thái bản ghi outbound chỉ chuyển theo lộ trình quy định ở §11; mọi chuyển trạng thái phải ghi nhật ký |
| 9 | BIZ-OUT-09 — Đối soát cuối ngày bắt buộc: số lượng + tổng giá trị + dấu kiểm tra (checksum) so với `<Hệ thống đích>`; chênh lệch → chặn nghiệp vụ cuối ngày và gửi cảnh báo |
| 10 | BIZ-OUT-10 — Gửi lại thủ công từ hộp lỗi phải ghi nhật ký: người thao tác, thời điểm, lý do, kết quả; tối đa 3 lần / bản ghi; vượt phải có phê duyệt |
| 11 | BIZ-OUT-11 — Mọi thay đổi mapping/cấu trúc phải có yêu cầu thay đổi và đã thử nghiệm trên môi trường tạm trước khi triển khai |
| 12 | BIZ-OUT-12 — Bảo mật đường truyền bắt buộc: kênh công khai phải ký số dữ liệu; kênh nội bộ tối thiểu kết nối bảo mật hai chiều hoặc xác thực bằng tài khoản dịch vụ |
| 13 | BIZ-OUT-13 — Tạm dừng / mở lại kênh tích hợp phải có nhật ký và phê duyệt; bản ghi tích luỹ trong thời gian tạm dừng phải giữ thứ tự khi mở lại |
| 14 | BIZ-OUT-14 — Bản ghi `QUÁ HẠN CHỜ XÁC NHẬN` quá `<N giờ>` chưa có callback → tự động tra cứu trạng thái tại đích hoặc đẩy lên màn hình rà soát thủ công |
| 15 | BIZ-OUT-15 — Quản lý chứng chỉ/khoá ký theo lịch luân chuyển; cảnh báo trước `<N ngày>` hết hạn |

## 8. Quy tắc kiểm tra dữ liệu

> Mã hoá theo phân loại: **Chung (CHG)** — áp dụng toàn hệ thống; **Phân hệ (PH-INT)** — áp dụng phân hệ Tích hợp; **Chức năng (OUT)** — riêng cho chức năng outbound này.

| STT | Mã | Phân loại | Đối tượng | Mô tả quy tắc | Mã thông báo |
|---|---|---|---|---|---|
| 1 | VAL-CHG-01 | Chung | Mọi trường | Trường bắt buộc không được rỗng | MSG-ERR-OUT-001 |
| 2 | VAL-CHG-02 | Chung | Trường số | Kiểu số, không chứa ký tự lạ, đúng dấu thập phân theo cấu hình | MSG-ERR-OUT-002 |
| 3 | VAL-CHG-03 | Chung | Trường ngày | Đúng định dạng `YYYY-MM-DD`; ngày hợp lệ; thuộc kỳ kế toán đang mở | MSG-ERR-OUT-003 |
| 4 | VAL-CHG-04 | Chung | Trường chuỗi | Không vượt độ dài tối đa quy định | MSG-ERR-OUT-004 |
| 5 | VAL-CHG-05 | Chung | Trường tham chiếu | Giá trị phải tồn tại trong danh mục đang còn hiệu lực | MSG-ERR-OUT-005 |
| 6 | VAL-PH-INT-01 | Phân hệ | Bản ghi | Bản ghi phải ở trạng thái cho phép gửi (đã duyệt, sẵn sàng) | MSG-ERR-OUT-010 |
| 7 | VAL-PH-INT-02 | Phân hệ | Mã đối tác | Mã đối tác/đơn vị/sản phẩm có ánh xạ trong bảng mapping `<Hệ thống đích>` | MSG-ERR-OUT-011 |
| 8 | VAL-PH-INT-03 | Phân hệ | Kênh tích hợp | Kênh tích hợp đến `<Hệ thống đích>` phải đang hoạt động (không tạm dừng) | MSG-ERR-OUT-012 |
| 9 | VAL-PH-INT-04 | Phân hệ | Mã định danh | Mã định danh (correlationId) duy nhất trong cửa sổ chống trùng | MSG-ERR-OUT-013 |
| 10 | VAL-PH-INT-05 | Phân hệ | Chứng chỉ | Chứng chỉ/khoá ký còn hạn ≥ 1 ngày | MSG-WRN-OUT-001 |
| 11 | VAL-PH-INT-06 | Phân hệ | Quyền | Người thao tác có quyền với chức năng tương ứng (gửi, gửi lại, tạm dừng) | MSG-ERR-OUT-014 |
| 12 | VAL-OUT-01 | Chức năng | Gói dữ liệu | Đúng cấu trúc và phiên bản mà `<Hệ thống đích>` đang chấp nhận | MSG-ERR-OUT-020 |
| 13 | VAL-OUT-02 | Chức năng | Số tiền/định mức | Trong biên độ cho phép theo cấu hình của `<Hệ thống đích>` | MSG-ERR-OUT-021 |
| 14 | VAL-OUT-03 | Chức năng | Liên trường | Tổng chi tiết phải bằng tổng tiêu đề; ngày hiệu lực ≥ ngày phát sinh | MSG-ERR-OUT-022 |
| 15 | VAL-OUT-04 | Chức năng | Ký số | Gói dữ liệu đã được ký số bằng đúng chứng chỉ đăng ký | MSG-ERR-OUT-023 |
| 16 | VAL-OUT-05 | Chức năng | Số lần gửi | Số lần gửi lại không vượt giới hạn (3 lần / bản ghi) | MSG-ERR-OUT-024 |
| 17 | VAL-OUT-06 | Chức năng | Kích thước gói | Không vượt kích thước tối đa theo hợp đồng tích hợp | MSG-ERR-OUT-025 |
| 18 | VAL-OUT-07 | Chức năng | Tốc độ gửi | Không vượt giới hạn tốc độ (vd ≤ 100 yêu cầu/giây) cho đích | MSG-WRN-OUT-002 |
| 19 | VAL-OUT-08 | Chức năng | Trạng thái đích | `<Hệ thống đích>` đang nhận (không trong cửa sổ bảo trì) | MSG-WRN-OUT-003 |
| 20 | VAL-OUT-09 | Chức năng | Đối soát | Tổng gửi và tổng `<Hệ thống đích>` báo nhận khớp nhau trong cửa sổ EOD | MSG-ERR-OUT-026 |

## 9. Danh sách thông báo

> Phân loại 1: `ERR` lỗi chặn / `WRN` cảnh báo / `OK` thành công / `CFM` xác nhận / `INF` thông tin.
> Phân loại 2: `OUT` outbound.

| STT | Phân loại 1 | Phân loại 2 | Mã thông báo | Nội dung |
|---|---|---|---|---|
| 1 | ERR | OUT | MSG-ERR-OUT-001 | Trường bắt buộc `<tên trường>` không được để trống |
| 2 | ERR | OUT | MSG-ERR-OUT-002 | Trường `<tên trường>` không đúng định dạng số |
| 3 | ERR | OUT | MSG-ERR-OUT-003 | Trường ngày `<tên trường>` không hợp lệ hoặc ngoài kỳ kế toán đang mở |
| 4 | ERR | OUT | MSG-ERR-OUT-004 | Trường `<tên trường>` vượt độ dài tối đa cho phép |
| 5 | ERR | OUT | MSG-ERR-OUT-005 | Giá trị `<…>` không tồn tại trong danh mục hoặc không còn hiệu lực |
| 6 | ERR | OUT | MSG-ERR-OUT-010 | Bản ghi chưa đủ điều kiện gửi (chưa được duyệt / chưa sẵn sàng) |
| 7 | ERR | OUT | MSG-ERR-OUT-011 | Không tìm thấy mã đối tác/đơn vị trong bảng mapping `<Hệ thống đích>` |
| 8 | ERR | OUT | MSG-ERR-OUT-012 | Kênh tích hợp đến `<Hệ thống đích>` đang tạm dừng. Vui lòng thử lại sau |
| 9 | ERR | OUT | MSG-ERR-OUT-013 | Mã định danh đã được sử dụng. Hệ thống không cho phép gửi trùng |
| 10 | ERR | OUT | MSG-ERR-OUT-014 | Bạn không có quyền thực hiện chức năng `<…>` |
| 11 | ERR | OUT | MSG-ERR-OUT-020 | Cấu trúc gói dữ liệu không khớp phiên bản mà `<Hệ thống đích>` đang chấp nhận |
| 12 | ERR | OUT | MSG-ERR-OUT-021 | Giá trị `<…>` ngoài biên độ cho phép của `<Hệ thống đích>` |
| 13 | ERR | OUT | MSG-ERR-OUT-022 | Số liệu chi tiết và tiêu đề không khớp / ngày không hợp lệ |
| 14 | ERR | OUT | MSG-ERR-OUT-023 | Gói dữ liệu chưa được ký số hoặc chữ ký không hợp lệ |
| 15 | ERR | OUT | MSG-ERR-OUT-024 | Đã đạt giới hạn 3 lần gửi lại cho bản ghi này. Vui lòng liên hệ quản trị |
| 16 | ERR | OUT | MSG-ERR-OUT-025 | Kích thước gói dữ liệu vượt giới hạn của `<Hệ thống đích>` |
| 17 | ERR | OUT | MSG-ERR-OUT-026 | Phát hiện chênh lệch khi đối soát cuối ngày. Vui lòng kiểm tra báo cáo |
| 18 | ERR | OUT | MSG-ERR-OUT-030 | `<Hệ thống đích>` từ chối nghiệp vụ. Lý do: `<chi tiết>` |
| 19 | ERR | OUT | MSG-ERR-OUT-031 | Mất kết nối tới `<Hệ thống đích>`. Hệ thống sẽ tự gửi lại |
| 20 | ERR | OUT | MSG-ERR-OUT-032 | Quá hạn chờ xác nhận từ `<Hệ thống đích>`. Đang tra cứu trạng thái |
| 21 | ERR | OUT | MSG-ERR-OUT-033 | Bản ghi đã rơi vào hộp lỗi (DLQ). Vui lòng xử lý từ màn hình hộp lỗi |
| 22 | WRN | OUT | MSG-WRN-OUT-001 | Chứng chỉ/khoá ký sẽ hết hạn trong `<N>` ngày. Vui lòng làm thủ tục gia hạn |
| 23 | WRN | OUT | MSG-WRN-OUT-002 | Đang vượt tốc độ gửi cho phép. Hệ thống đã giãn nhịp |
| 24 | WRN | OUT | MSG-WRN-OUT-003 | `<Hệ thống đích>` đang trong cửa sổ bảo trì. Hệ thống sẽ gửi sau |
| 25 | WRN | OUT | MSG-WRN-OUT-004 | Số lỗi liên tiếp vượt ngưỡng. Kênh tích hợp tạm dừng tự động |
| 26 | OK | OUT | MSG-OK-OUT-001 | Gửi dữ liệu thành công. Mã định danh: `<correlationId>` |
| 27 | OK | OUT | MSG-OK-OUT-002 | `<Hệ thống đích>` đã xác nhận tiếp nhận bản ghi |
| 28 | OK | OUT | MSG-OK-OUT-003 | Đối soát cuối ngày thành công. Không có chênh lệch |
| 29 | OK | OUT | MSG-OK-OUT-004 | Đã đẩy lại bản ghi thành công |
| 30 | CFM | OUT | MSG-CFM-OUT-001 | Bạn có chắc muốn gửi lại bản ghi này tới `<Hệ thống đích>`? |
| 31 | CFM | OUT | MSG-CFM-OUT-002 | Bạn có chắc muốn tạm dừng kênh tích hợp với `<Hệ thống đích>`? |
| 32 | CFM | OUT | MSG-CFM-OUT-003 | Bạn có chắc muốn bỏ qua (ack-skip) bản ghi này trong hộp lỗi? |
| 33 | CFM | OUT | MSG-CFM-OUT-004 | Bạn có chắc muốn mở lại kênh tích hợp? Bản ghi tích luỹ sẽ được gửi tiếp |
| 34 | INF | OUT | MSG-INF-OUT-001 | Đang chờ phản hồi từ `<Hệ thống đích>`. Vui lòng không thao tác lại |
| 35 | INF | OUT | MSG-INF-OUT-002 | Bản ghi đã được đưa vào hàng đợi gửi |
| 36 | INF | OUT | MSG-INF-OUT-003 | Bản ghi đã được đẩy lên màn hình rà soát thủ công do quá hạn chờ xác nhận |
| 37 | INF | OUT | MSG-INF-OUT-004 | Kênh tích hợp đã được mở lại. Hệ thống đang gửi các bản ghi tích luỹ |

## 10. Danh sách sự kiện

> Quy ước: `<MOD>.OUT.<HÀNH ĐỘNG>` — phát hành lên bus sự kiện nội bộ. Phân loại: **NV** (nghiệp vụ) / **HT** (hệ thống/kỹ thuật) / **GS** (giám sát/đối soát).

| STT | Mã sự kiện | Phân loại | Chức năng / Ngữ cảnh | Mô tả |
|---|---|---|---|---|
| 1 | `<MOD>.OUT.READY` | NV | Bước 1 luồng chính | Bản ghi đủ điều kiện gửi, đã được đặt vào hộp thư đi |
| 2 | `<MOD>.OUT.MAPPING.START` | HT | Bước 3 | Bắt đầu chuyển đổi dữ liệu sang định dạng `<Hệ thống đích>` |
| 3 | `<MOD>.OUT.MAPPING.DONE` | HT | Bước 3 | Hoàn tất chuyển đổi dữ liệu |
| 4 | `<MOD>.OUT.MAPPING.MISSING` | NV | Ngoại lệ E2 | Không tìm thấy mã ánh xạ; bản ghi treo chờ cấu hình |
| 5 | `<MOD>.OUT.VALIDATE.FAILED` | NV | Bước 4 / E1 | Kiểm tra dữ liệu trước khi gửi thất bại |
| 6 | `<MOD>.OUT.SIGN.DONE` | HT | Bước 5 | Đã ký số gói dữ liệu thành công |
| 7 | `<MOD>.OUT.SIGN.FAILED` | HT | Bước 5 | Ký số thất bại (chứng chỉ hết hạn, khoá không hợp lệ) |
| 8 | `<MOD>.OUT.SENDING` | HT | Bước 6 | Bắt đầu gửi gói dữ liệu tới `<Hệ thống đích>` |
| 9 | `<MOD>.OUT.SENT` | NV | Bước 8 | Đã gửi và `<Hệ thống đích>` đã nhận sơ bộ |
| 10 | `<MOD>.OUT.CONFIRMED` | NV | Bước 9 | Đã nhận xác nhận chính thức (callback) từ `<Hệ thống đích>` |
| 11 | `<MOD>.OUT.FAILED` | NV | Bước 6-7 / E3 | Gửi thất bại do `<Hệ thống đích>` từ chối nghiệp vụ |
| 12 | `<MOD>.OUT.FAILED_AT_DEST` | NV | E3 | `<Hệ thống đích>` báo lỗi nghiệp vụ sau khi đã nhận |
| 13 | `<MOD>.OUT.RETRY` | HT | E4 | Tự động gửi lại do lỗi tạm thời |
| 14 | `<MOD>.OUT.RETRY.EXCEEDED` | HT | E4 / E10 | Vượt số lần gửi lại cho phép; chuyển vào hộp lỗi |
| 15 | `<MOD>.OUT.TIMEOUT` | HT | E7 | Quá hạn chờ xác nhận từ `<Hệ thống đích>` |
| 16 | `<MOD>.OUT.STATUS_QUERY` | HT | A9 | Hệ thống tự tra cứu trạng thái bản ghi tại `<Hệ thống đích>` |
| 17 | `<MOD>.OUT.DLQ.MOVED` | HT | E4 / E5 | Bản ghi được chuyển vào hộp lỗi (DLQ) |
| 18 | `<MOD>.OUT.REPLAY.MANUAL` | NV | A2 | Người dùng đẩy lại thủ công từ hộp lỗi |
| 19 | `<MOD>.OUT.REPLAY.AUTO` | HT | E4 | Hệ thống tự đẩy lại theo chính sách giãn cách |
| 20 | `<MOD>.OUT.PAUSE` | HT | A8 | Kênh tích hợp đã được tạm dừng (thủ công hoặc tự động ngắt mạch) |
| 21 | `<MOD>.OUT.RESUME` | HT | A8 | Kênh tích hợp đã được mở lại |
| 22 | `<MOD>.OUT.CIRCUIT.OPENED` | HT | E8 | Ngắt mạch tự động do lỗi liên tiếp vượt ngưỡng |
| 23 | `<MOD>.OUT.CIRCUIT.CLOSED` | HT | E8 | Khôi phục kênh tích hợp sau khi ngắt mạch |
| 24 | `<MOD>.OUT.THROTTLED` | HT | E9 | Đã giãn nhịp gửi do chạm giới hạn tốc độ |
| 25 | `<MOD>.OUT.SCHEDULED.START` | HT | A1 | Bắt đầu phiên gửi theo lịch |
| 26 | `<MOD>.OUT.SCHEDULED.DONE` | HT | A1 | Kết thúc phiên gửi theo lịch |
| 27 | `<MOD>.OUT.BATCH.FILE_PUSHED` | HT | A3 | Đã đẩy tệp lô lên thư mục `<Hệ thống đích>` |
| 28 | `<MOD>.OUT.RECONCILE.MATCH` | GS | A5-A7 | Đối soát thành công, không chênh lệch |
| 29 | `<MOD>.OUT.RECONCILE.MISMATCH` | GS | A5-A7 | Phát hiện chênh lệch khi đối soát; sinh báo cáo và cảnh báo |
| 30 | `<MOD>.OUT.RECONCILE.BLOCK_EOD` | GS | A5 | Chặn nghiệp vụ cuối ngày do còn chênh lệch chưa xử lý |
| 31 | `<MOD>.OUT.CERT.EXPIRING` | HT | BIZ-OUT-15 | Cảnh báo chứng chỉ/khoá ký sắp hết hạn |
| 32 | `<MOD>.OUT.CONFIG.CHANGED` | HT | BIZ-OUT-11 | Có thay đổi cấu hình mapping/kết nối/schema |
| 33 | `<MOD>.OUT.ALERT.THRESHOLD` | GS | – | Vượt ngưỡng cảnh báo (tỷ lệ lỗi, độ trễ, backlog) |

## 11. Trạng thái tích hợp (Outbound)

### 11.1 Trạng thái bản ghi gửi đi

| Trạng thái | Ý nghĩa nghiệp vụ |
|---|---|
| `READY` (SẴN SÀNG) | Đã được đưa vào hộp thư đi, chờ gửi |
| `SENDING` (ĐANG GỬI) | Đang trong quá trình gửi tới `<Hệ thống đích>` |
| `SENT` (ĐÃ GỬI) | `<Hệ thống đích>` đã nhận sơ bộ, có mã định danh |
| `CONFIRMED` (ĐÃ XÁC NHẬN) | `<Hệ thống đích>` đã xác nhận chính thức (callback) |
| `FAILED` (THẤT BẠI) | Gửi không thành công (lỗi truyền/timeout sau khi vượt số lần gửi lại) |
| `FAILED_AT_DEST` (THẤT BẠI TẠI ĐÍCH) | `<Hệ thống đích>` đã nhận nhưng từ chối nghiệp vụ |
| `TIMEOUT_AWAITING_CALLBACK` (QUÁ HẠN CHỜ XÁC NHẬN) | Đã gửi nhưng quá `<N giờ>` chưa có callback |
| `IN_DLQ` (TRONG HỘP LỖI) | Đã chuyển vào hộp lỗi, chờ xử lý/đẩy lại |
| `PAUSED` (TẠM DỪNG) | Bản ghi nằm trong kênh đang tạm dừng |
| `CANCELLED` (HUỶ) | Bị huỷ do nghiệp vụ thay đổi hoặc vượt giới hạn gửi lại |

### 11.2 Bảng chuyển trạng thái

| # | Trạng thái hiện tại | Sự kiện / Hành động | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | (chưa có) | Bản ghi nghiệp vụ được duyệt → ghi hộp thư đi | `READY` | Phát `<MOD>.OUT.READY` |
| 2 | `READY` | Bắt đầu gửi (luồng chính bước 6) | `SENDING` | Phát `<MOD>.OUT.SENDING`; ghi nhật ký |
| 3 | `READY` | Kênh bị tạm dừng | `PAUSED` | Phát `<MOD>.OUT.PAUSE` |
| 4 | `SENDING` | `<Hệ thống đích>` trả nhận sơ bộ (2xx/ack) | `SENT` | Lưu correlationId; phát `<MOD>.OUT.SENT` |
| 5 | `SENDING` | Lỗi tạm thời (mất kết nối/timeout) | `READY` | Tăng `retryCount`; lập lịch gửi lại; phát `<MOD>.OUT.RETRY` |
| 6 | `SENDING` | Vượt số lần gửi lại | `IN_DLQ` | Phát `<MOD>.OUT.RETRY.EXCEEDED`, `<MOD>.OUT.DLQ.MOVED` |
| 7 | `SENDING` | `<Hệ thống đích>` báo lỗi 4xx (dữ liệu sai) | `FAILED_AT_DEST` | Phát `<MOD>.OUT.FAILED_AT_DEST`; gửi cảnh báo nghiệp vụ |
| 8 | `SENT` | Nhận được callback xác nhận thành công | `CONFIRMED` | Phát `<MOD>.OUT.CONFIRMED`; cập nhật đối soát |
| 9 | `SENT` | Callback báo từ chối/thất bại | `FAILED_AT_DEST` | Phát `<MOD>.OUT.FAILED_AT_DEST` |
| 10 | `SENT` | Quá `<N giờ>` chưa có callback | `TIMEOUT_AWAITING_CALLBACK` | Phát `<MOD>.OUT.TIMEOUT` |
| 11 | `TIMEOUT_AWAITING_CALLBACK` | Tra cứu trạng thái tại đích thành công (đã xử lý) | `CONFIRMED` | Phát `<MOD>.OUT.STATUS_QUERY`, `<MOD>.OUT.CONFIRMED` |
| 12 | `TIMEOUT_AWAITING_CALLBACK` | Tra cứu trạng thái: đích không có bản ghi | `READY` | Đẩy lại; phát `<MOD>.OUT.REPLAY.AUTO` |
| 13 | `TIMEOUT_AWAITING_CALLBACK` | Vượt thời hạn xử lý | `IN_DLQ` | Phát `<MOD>.OUT.DLQ.MOVED` |
| 14 | `FAILED_AT_DEST` | NSD bấm Gửi lại (đã sửa dữ liệu) | `READY` | Phát `<MOD>.OUT.REPLAY.MANUAL` |
| 15 | `IN_DLQ` | NSD bấm Gửi lại từ hộp lỗi | `READY` | Phát `<MOD>.OUT.REPLAY.MANUAL`; tăng `replayCount` |
| 16 | `IN_DLQ` | NSD chọn ack-skip / huỷ | `CANCELLED` | Ghi lý do; cập nhật đối soát |
| 17 | `PAUSED` | Kênh được mở lại | `READY` | Phát `<MOD>.OUT.RESUME` |
| 18 | bất kỳ | Vượt 3 lần gửi lại + chưa được phê duyệt cấp cao hơn | `CANCELLED` | Phát `<MOD>.OUT.RETRY.EXCEEDED` |

### 11.3 Sơ đồ trạng thái (ASCII)

```
                            (bản ghi nghiệp vụ duyệt)
                                        |
                                        v
                                  +-----------+
                       +--------> |   READY   | <----------+
                       |          +-----+-----+            |
                       |                |                  |
                  (gửi lại auto)   (bắt đầu gửi)      (mở lại kênh)
                       |                |                  |
                       |                v                  |
                       |          +-----------+            |
                       |          |  SENDING  |            |
                       |          +-----+-----+            |
                       |     +----------+----------+       |
                       |     |          |          |       |
                       |  (2xx/ack) (4xx đích)  (lỗi tạm thời)
                       |     v          v              |
                       |   +----+   +-----------+      |
                       |   |SENT|   |FAILED_AT_ |      |
                       |   +-+--+   |   DEST    |      |
                       |     |      +-----+-----+      |
                       |     |            |            |
              (callback OK)  | (timeout)  | (NSD sửa,  |
                       |     v            v   gửi lại) |
                  +--------+ +--------------+          |
                  |CONFIRM-| |TIMEOUT_AWAIT-|          |
                  |  ED    | |ING_CALLBACK  |          |
                  +--------+ +-------+------+          |
                                     |                 |
                              (status query /          |
                               quá hạn)                |
                                     |                 |
                                     v                 |
                                 +-------+             |
                                 | IN_DLQ|<------------+
                                 +---+---+    (vượt số lần gửi lại)
                                     |
                              (NSD replay / cancel)
                                     |
                                     v
                                 +--------+
                                 |CANCELL-|
                                 |  ED    |
                                 +--------+

         +--------+   (tạm dừng kênh)         (mở lại kênh)
         | READY  | -----------------> PAUSED -----------> READY
         +--------+
```

## 12. Giao diện liên quan

| STT | Màn hình / Thành phần |
|---|---|
| 1 | `<MOD>.OUT.OUTBOX` — Hộp thư đi (trạng thái, số lần gửi lại, thời điểm dự kiến) |
| 2 | `<MOD>.OUT.SENDER` — Dịch vụ đẩy bản ghi tới `<DstSys>` |
| 3 | `<MOD>.OUT.CALLBACK` — Điểm nhận xác nhận (callback) từ `<DstSys>` |
| 4 | `<MOD>.OUT.MONITOR` — Dashboard giám sát: số lượng, tỷ lệ thành công, độ trễ, hàng tồn đọng, trạng thái ngắt mạch |
| 5 | `<MOD>.OUT.DLQ` — Hộp lỗi: tra cứu, xem dữ liệu gốc + phản hồi, đẩy lại, bỏ qua |
| 6 | `<MOD>.OUT.AUDIT` — Tra cứu nhật ký outbound theo mã định danh / hệ thống đích / thời gian |
| 7 | `<MOD>.OUT.MAPPING` — Cấu hình mapping/cấu trúc/danh mục đối tác với `<DstSys>` |
| 8 | `<MOD>.OUT.RECONCILE` — Báo cáo đối soát cuối ngày + chênh lệch + công cụ xử lý |
| 9 | `<MOD>.OUT.CONFIG` — Cấu hình kết nối, xác thực, gửi lại, giới hạn tốc độ, ngắt mạch, phiên bản |
| 10 | `<MOD>.OUT.PAUSE` — Tạm dừng / mở lại kênh tích hợp (kèm phê duyệt) |
| 11 | `<MOD>.OUT.NOTIFY` — Cấu hình thông báo/cảnh báo (email/Teams/Slack) khi lỗi vượt ngưỡng |
| 12 | `<MOD>.OUT.SECRETS` — Quản lý chứng chỉ/khoá ký (kho khoá + lịch luân chuyển) |
| 13 | `<MOD>.OUT.REPLAY` — Màn hình thao tác đẩy lại thủ công (có nhật ký + giới hạn 3 lần) |
| 14 | `<MOD>.OUT.STATUS-QUERY` — Tra cứu trạng thái tại `<DstSys>` cho bản ghi quá hạn chờ xác nhận |

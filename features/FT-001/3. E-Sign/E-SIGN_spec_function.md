# Bảng đặc tả chức năng

> Chức năng **Ký số điện tử chứng từ** điển hình — tích hợp với hệ thống cung cấp dịch vụ chứng thực số (CA Provider) để ký số theo lộ trình Người lập → Kiểm soát → Phê duyệt. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.ESIGN.<CAProvider>` |
| Tên chức năng | Ký số điện tử chứng từ `<Loại chứng từ>` qua `<CAProvider>` |
| Hệ thống đối tác | `<Hệ thống ký số / CA Provider>` (vd: VNPT-SmartCA, FastCA Remote, BCA-CA, ViettelCA, MISA-CA, HSM tổ chức,…) |
| Người sử dụng | Người lập chứng từ (Maker); Người kiểm soát (Checker); Người phê duyệt (Approver / Chủ tài khoản); Quản trị tích hợp (giám sát, cấu hình); Vận hành (xử lý lỗi, đối soát) |
| Phương thức ký | Người dùng cuối ký số trên giao diện VDBAS — chứng chỉ có thể nằm trên (1) USB token cá nhân, (2) Remote Signing (HSM phía CA), (3) HSM tổ chức/đóng dấu cơ quan tự động |
| Tiêu chuẩn ký | Định dạng PAdES (PDF Advanced Electronic Signatures); ký số kèm dấu thời gian (Timestamp) và kiểm tra trạng thái chứng chỉ (OCSP/CRL) tại thời điểm ký |
| Mô tả | Tạo chứng từ PDF từ dữ liệu giao dịch; gửi yêu cầu ký số sang `<CAProvider>` theo từng vai trò (Kiểm soát, Phê duyệt); ghép chữ ký số (và chữ ký hình ảnh nếu có) vào PDF; xác minh và lưu trữ chứng từ đã ký |
| Độ ưu tiên | Cao — chứng từ chỉ có giá trị pháp lý sau khi đủ chữ ký |
| SLA | `<vd: thời gian sẵn sàng ký ≥ 99.5%; 95% giao dịch ký thành công ≤ 5 giây từ khi người dùng xác thực; tối đa 3 lần thử lại đối với lỗi tạm thời>` |
| URD reference | `<URD-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Chứng từ ở trạng thái đã hoàn thiện nội dung và đã được Người lập gửi đi (không còn chỉnh sửa được) |
| 2 | Người ký (Kiểm soát hoặc Phê duyệt) có chứng chỉ số còn hiệu lực, đúng thẩm quyền với loại chứng từ |
| 3 | Kết nối với `<CAProvider>` đang ở trạng thái hoạt động (không bị tạm dừng) |
| 4 | Bảng cấu hình vai trò ký, vị trí ô ký trên PDF và thứ tự ký đã được phê duyệt phiên bản hiện hành |
| 5 | Dịch vụ đóng dấu thời gian (TSA) và dịch vụ kiểm tra trạng thái chứng chỉ (OCSP/CRL) đang sẵn sàng |
| 6 | Nhật ký ký số, giám sát và cảnh báo đã được cấu hình |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | PDF chứng từ đã được ghép đủ chữ ký số theo lộ trình; trạng thái cập nhật ĐÃ KÝ KIỂM SOÁT / ĐÃ KÝ PHÊ DUYỆT |
| 2 | Mỗi chữ ký số đã được xác minh (hợp lệ, đóng dấu thời gian, chứng chỉ chưa thu hồi tại thời điểm ký) |
| 3 | PDF đã ký được lưu trữ trong kho chứng từ với bản hash để đối chiếu toàn vẹn |
| 4 | Nhật ký ký số ghi đầy đủ: mã chứng từ, người ký, vai trò, chứng chỉ (serial), thời điểm ký, kết quả, mã định danh phiên ký |
| 5 | Sự kiện nội bộ đã phát hành (`<MOD>.ESIGN.SIGNED.CONTROL`, `<MOD>.ESIGN.SIGNED.APPROVAL`) để các phân hệ liên quan tiếp tục xử lý |
| 6 | Số liệu giám sát (số chứng từ ký thành công, tỷ lệ thất bại, độ trễ ký, hàng tồn đọng) đã cập nhật lên dashboard |

## 4. Luồng chính

| Bước | Người dùng | Hệ thống VDBAS | Hệ thống ký số `<CAProvider>` |
|---|---|---|---|
| 1 | Người lập tạo chứng từ → bấm **Gửi kiểm soát** | Kiểm tra dữ liệu chứng từ; chuyển trạng thái → CHỜ KIỂM SOÁT; phát sự kiện `<MOD>.ESIGN.SUBMITTED` | – |
| 2 | Người kiểm soát mở chứng từ trong danh sách chờ kiểm soát | Hiển thị nội dung chứng từ + bản xem trước PDF + vị trí ô ký Kiểm soát | – |
| 3 | Người kiểm soát rà soát nội dung → bấm **Kiểm soát + Ký số** (có thể kéo-thả ảnh chữ ký vào ô ký nếu cấu hình yêu cầu hiển thị chữ ký) | Sinh PDF chứng từ chính thức từ mẫu; tính dấu vân tay (hash) của PDF cần ký; mở phiên ký số (sessionId) | – |
| 4 | – | Gửi yêu cầu ký số tới `<CAProvider>`: gồm hash, thông tin chứng chỉ định danh, ô ký, vị trí hiển thị, vai trò Kiểm soát | Tiếp nhận yêu cầu; xác thực phiên; trả về chỉ dẫn cho người dùng (yêu cầu OTP / chạm xác thực sinh trắc / nhập PIN USB token) |
| 5 | Người kiểm soát thực hiện thao tác xác thực ký số trên thiết bị tương ứng | Hiển thị trạng thái CHỜ NGƯỜI KÝ XÁC THỰC; chờ phản hồi từ `<CAProvider>` | Xác thực người ký; sử dụng khoá bí mật (HSM/Token) tạo giá trị chữ ký số trên hash |
| 6 | – | – | Trả về giá trị chữ ký số + dấu thời gian (TSA) + thông tin chứng chỉ về VDBAS |
| 7 | – | Ghép chữ ký số (và chữ ký hình ảnh nếu có) vào PDF theo chuẩn PAdES; xác minh ngay tại chỗ (toàn vẹn, OCSP/CRL chứng chỉ tại thời điểm ký) | – |
| 8 | – | Cập nhật trạng thái chứng từ → ĐÃ KÝ KIỂM SOÁT; lưu PDF tạm thời cùng nhật ký phiên ký; phát `<MOD>.ESIGN.SIGNED.CONTROL`; chuyển trạng thái → CHỜ PHÊ DUYỆT | – |
| 9 | Người phê duyệt mở chứng từ trong danh sách chờ phê duyệt | Hiển thị PDF đã có chữ ký Kiểm soát + vị trí ô ký Phê duyệt | – |
| 10 | Người phê duyệt rà soát → bấm **Phê duyệt + Ký số** | Lặp lại các bước 3–7 cho vai trò Phê duyệt: tính hash mới (đã bao gồm chữ ký Kiểm soát) → gửi yêu cầu ký → ghép chữ ký Phê duyệt vào PDF → xác minh | (tương tự bước 4–6 cho Phê duyệt) |
| 11 | – | Cập nhật trạng thái chứng từ → ĐÃ KÝ PHÊ DUYỆT (HOÀN TẤT); lưu PDF cuối vào kho chứng từ; ghi nhật ký đầy đủ; phát `<MOD>.ESIGN.SIGNED.APPROVAL` và `<MOD>.ESIGN.COMPLETED` | – |
| 12 | – | Cập nhật số liệu giám sát (số ký thành công, độ trễ, hàng tồn đọng); thông báo Người lập biết chứng từ đã hoàn tất | – |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | Ký bằng USB token cá nhân | VDBAS phối hợp với phần bổ trợ trình duyệt (plugin) hoặc ứng dụng ký số ở máy người dùng để đọc hash → người dùng nhập PIN trên token → token trả giá trị chữ ký → VDBAS ghép vào PDF |
| A2 | Ký bằng Remote Signing (HSM phía `<CAProvider>`) | VDBAS gọi API ký từ xa; người dùng nhận thông báo trên ứng dụng di động → xác thực sinh trắc/OTP → CA ký bằng khoá nằm trên HSM phía CA |
| A3 | Đóng dấu cơ quan tự động (chữ ký của tổ chức) | Hệ thống ký tự động bằng chứng chỉ tổ chức lưu trên HSM nội bộ; không cần thao tác người dùng (vd: đóng dấu báo cáo định kỳ) |
| A4 | Người kiểm soát/phê duyệt **Trả lại** chứng từ cho Người lập | Không thực hiện ký; chuyển trạng thái → TRẢ LẠI; lưu lý do; thông báo Người lập sửa lại |
| A5 | Người kiểm soát/phê duyệt **Từ chối** chứng từ | Không thực hiện ký; chuyển trạng thái → TỪ CHỐI (kết thúc luồng); lưu lý do |
| A6 | Ký theo lô (chọn nhiều chứng từ ký cùng lúc) | Hệ thống gom danh sách hash → mở một phiên ký gộp → người dùng xác thực 1 lần ký nhiều chứng từ; ghép chữ ký từng PDF; cập nhật trạng thái song song |
| A7 | Đại diện ký (uỷ quyền tạm thời) | Kiểm tra uỷ quyền còn hiệu lực; người được uỷ quyền ký bằng chứng chỉ của mình; nhật ký ghi cả người uỷ quyền và người được uỷ quyền |
| A8 | Yêu cầu ký lại (re-sign) khi chữ ký hỏng | Quản trị bấm **Ký lại** trên chứng từ ở trạng thái KÝ THẤT BẠI / QUÁ HẠN KÝ; quay về bước phù hợp trong luồng chính |
| A9 | Đối soát số lượng + giá trị chữ ký với `<CAProvider>` cuối ngày | Tác vụ EOD đối chiếu danh sách phiên ký đã thực hiện với log của `<CAProvider>`; sinh báo cáo chênh lệch |
| A10 | Tạm dừng kênh ký số (bảo trì) | Quản trị tạm dừng kênh; người dùng không thể bắt đầu phiên ký mới; phiên đang dở vẫn hoàn tất theo thứ tự |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Người ký không có chứng chỉ số hiệu lực / chứng chỉ hết hạn | Chặn ký; thông báo người dùng gia hạn chứng chỉ; ghi nhật ký |
| E2 | Chứng chỉ đã bị thu hồi (CRL/OCSP báo REVOKED) tại thời điểm ký | Chặn ký; chuyển trạng thái → KÝ THẤT BẠI; cảnh báo bảo mật |
| E3 | Người ký không đủ thẩm quyền với loại chứng từ này | Chặn ký; thông báo và ghi nhật ký |
| E4 | Người dùng huỷ phiên ký trên thiết bị (huỷ PIN/OTP/thông báo di động) | Chuyển trạng thái → CHỜ NGƯỜI KÝ XÁC THỰC → trạng thái trước đó (CHỜ KIỂM SOÁT / CHỜ PHÊ DUYỆT); cho phép thực hiện lại |
| E5 | Quá hạn xác thực ký (vd > 2 phút không có phản hồi từ người dùng) | Tự động đóng phiên ký; chuyển trạng thái → QUÁ HẠN KÝ; cho phép Ký lại |
| E6 | Mất kết nối tạm thời tới `<CAProvider>` | Gửi lại tự động theo chính sách giãn cách tăng dần (5s/15s/45s, tối đa 3 lần); sau đó chuyển → KÝ THẤT BẠI |
| E7 | `<CAProvider>` báo lỗi nghiệp vụ (sai định dạng yêu cầu, sai cấu hình, hash không khớp) | Chuyển → KÝ THẤT BẠI; ghi lý do; cảnh báo quản trị tích hợp |
| E8 | Vượt ngưỡng lỗi liên tiếp với `<CAProvider>` | Tự động tạm dừng kênh ký số (cơ chế ngắt mạch); cảnh báo quản trị; thử khôi phục dần sau `<N giây>` |
| E9 | TSA (dấu thời gian) không phản hồi | Tuỳ cấu hình: (1) ký không có TSA và đánh dấu cảnh báo; (2) chặn ký và cho thử lại |
| E10 | Xác minh ngay sau khi ký phát hiện chữ ký không hợp lệ (do PDF bị thay đổi giữa chừng, hoặc giá trị chữ ký không khớp hash) | Huỷ kết quả ký; chuyển → KÝ THẤT BẠI; cảnh báo nghiêm trọng (có thể là tấn công) |
| E11 | PDF vượt kích thước tối đa cho ký (vd > 10MB) | Chặn ký; thông báo và yêu cầu kiểm tra dữ liệu chứng từ |
| E12 | Đã ký Kiểm soát nhưng người Phê duyệt cũng là người Kiểm soát (vi phạm phân ly trách nhiệm) | Chặn; yêu cầu chọn người Phê duyệt khác |
| E13 | Đối soát EOD phát hiện chênh lệch giữa nhật ký VDBAS và log `<CAProvider>` | Sinh báo cáo chênh lệch; cảnh báo; chặn nghiệp vụ cuối ngày kế tiếp đến khi xử lý xong |
| E14 | Vượt số lần ký lại cho phép (3 lần) | Chặn ký lại; yêu cầu phê duyệt cấp cao hơn hoặc trả về Người lập tạo lại chứng từ |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-ESIGN-01 — Một chứng từ phải có đủ chữ ký số theo lộ trình cấu hình (tối thiểu: 1 Kiểm soát + 1 Phê duyệt) thì mới có giá trị pháp lý |
| 2 | BIZ-ESIGN-02 — Người lập KHÔNG ký số ở bước tạo; chỉ Người kiểm soát và Người phê duyệt mới ký |
| 3 | BIZ-ESIGN-03 — Người ký phải dùng chứng chỉ số do CA được cấp phép; chứng chỉ phải còn hiệu lực và chưa bị thu hồi tại thời điểm ký |
| 4 | BIZ-ESIGN-04 — Phân ly trách nhiệm: cùng một chứng từ, người Phê duyệt phải khác người Kiểm soát; người Kiểm soát phải khác Người lập (trừ khi có cấu hình ngoại lệ kèm phê duyệt cấp cao) |
| 5 | BIZ-ESIGN-05 — Mỗi phiên ký số phải có mã định danh duy nhất (sessionId) và mã chống trùng để `<CAProvider>` không xử lý trùng |
| 6 | BIZ-ESIGN-06 — Ký số phải gắn dấu thời gian (TSA) lấy từ nguồn tin cậy; nếu cấu hình yêu cầu TSA mà TSA không phản hồi → không cho ký (ngoại trừ chế độ cấu hình cho phép) |
| 7 | BIZ-ESIGN-07 — Sau khi ký, hệ thống phải xác minh ngay (kiểm tra toàn vẹn + trạng thái chứng chỉ qua OCSP/CRL); xác minh không qua → không công nhận chữ ký |
| 8 | BIZ-ESIGN-08 — PDF đã ký không được sửa nội dung; mọi cập nhật nội dung yêu cầu tạo phiên bản chứng từ mới và ký lại từ đầu |
| 9 | BIZ-ESIGN-09 — Chỉ tự động gửi lại với lỗi tạm thời (mất kết nối, `<CAProvider>` quá tải); không tự gửi lại khi lỗi do người dùng (huỷ, OTP sai, PIN sai, chứng chỉ thu hồi) |
| 10 | BIZ-ESIGN-10 — Cơ chế tạm dừng kênh tự động khi `<CAProvider>` lỗi liên tiếp; tự khôi phục dần sau khoảng thời gian cấu hình |
| 11 | BIZ-ESIGN-11 — Nhật ký bắt buộc lưu: mã chứng từ, người ký, vai trò, serial chứng chỉ, CA Issuer, thời điểm ký, IP, kết quả, sessionId, dấu vân tay PDF trước và sau ký |
| 12 | BIZ-ESIGN-12 — Trạng thái chứng từ trong luồng ký chỉ chuyển theo lộ trình quy định ở §11; mọi chuyển trạng thái phải ghi nhật ký |
| 13 | BIZ-ESIGN-13 — Cho phép Ký lại tối đa 3 lần / chứng từ; vượt phải có phê duyệt cấp cao hơn hoặc tạo chứng từ mới |
| 14 | BIZ-ESIGN-14 — Ký theo lô tối đa `<N>` chứng từ / phiên; mỗi chứng từ phải có nhật ký riêng để truy vết |
| 15 | BIZ-ESIGN-15 — Đối soát cuối ngày bắt buộc: số lượng phiên ký, số chữ ký thành công/thất bại, dấu kiểm tra với `<CAProvider>`; chênh lệch → chặn nghiệp vụ cuối ngày |
| 16 | BIZ-ESIGN-16 — Quản lý chứng chỉ tổ chức (đóng dấu cơ quan) theo lịch luân chuyển; cảnh báo trước `<N>` ngày hết hạn |
| 17 | BIZ-ESIGN-17 — Uỷ quyền ký phải có quyết định bằng văn bản đã lưu trong hệ thống và còn hiệu lực; uỷ quyền không vượt quá thẩm quyền của người uỷ quyền |
| 18 | BIZ-ESIGN-18 — Chữ ký hình ảnh (visible signature) là PHỤ trợ; giá trị pháp lý nằm ở chữ ký số mật mã, không phải ở ảnh chữ ký |

## 8. Quy tắc kiểm tra dữ liệu

> Mã hoá theo phân loại: **Chung (CHG)** — áp dụng toàn hệ thống; **Phân hệ (PH-INT)** — phân hệ Tích hợp; **Chức năng (ESIGN)** — riêng cho chức năng ký số này.

| STT | Mã | Phân loại | Đối tượng | Mô tả quy tắc | Mã thông báo |
|---|---|---|---|---|---|
| 1 | VAL-CHG-01 | Chung | Mọi trường | Trường bắt buộc không được rỗng | MSG-ERR-ESIGN-001 |
| 2 | VAL-CHG-02 | Chung | Trường số | Kiểu số, không chứa ký tự lạ, đúng dấu thập phân theo cấu hình | MSG-ERR-ESIGN-002 |
| 3 | VAL-CHG-03 | Chung | Trường ngày | Đúng định dạng `YYYY-MM-DD`; ngày hợp lệ; thuộc kỳ kế toán đang mở | MSG-ERR-ESIGN-003 |
| 4 | VAL-CHG-04 | Chung | Trường tham chiếu | Giá trị phải tồn tại trong danh mục đang còn hiệu lực | MSG-ERR-ESIGN-004 |
| 5 | VAL-PH-INT-01 | Phân hệ | Kênh tích hợp | Kết nối với `<CAProvider>` đang hoạt động (không tạm dừng) | MSG-ERR-ESIGN-010 |
| 6 | VAL-PH-INT-02 | Phân hệ | Phiên ký | Mỗi phiên ký có sessionId duy nhất; idempotency theo (chứng từ, vai trò ký, lần ký) | MSG-ERR-ESIGN-011 |
| 7 | VAL-PH-INT-03 | Phân hệ | Chứng chỉ tổ chức | Chứng chỉ HSM tổ chức còn hạn ≥ 1 ngày | MSG-WRN-ESIGN-001 |
| 8 | VAL-PH-INT-04 | Phân hệ | Quyền | Người thao tác có quyền với chức năng (Kiểm soát/Phê duyệt/Ký lại/Tạm dừng kênh) | MSG-ERR-ESIGN-012 |
| 9 | VAL-PH-INT-05 | Phân hệ | Tốc độ ký | Không vượt giới hạn tốc độ ký do `<CAProvider>` quy định | MSG-WRN-ESIGN-002 |
| 10 | VAL-ESIGN-01 | Chức năng | Trạng thái chứng từ | Chứng từ phải ở đúng trạng thái cho phép ký (CHỜ KIỂM SOÁT / CHỜ PHÊ DUYỆT) | MSG-ERR-ESIGN-020 |
| 11 | VAL-ESIGN-02 | Chức năng | Chứng chỉ người ký | Chứng chỉ số của người ký còn hiệu lực, đúng định danh (CMND/CCCD/MST khớp hồ sơ trong hệ thống) | MSG-ERR-ESIGN-021 |
| 12 | VAL-ESIGN-03 | Chức năng | Trạng thái chứng chỉ | OCSP/CRL trả về `VALID` (không thu hồi) tại thời điểm ký | MSG-ERR-ESIGN-022 |
| 13 | VAL-ESIGN-04 | Chức năng | Thẩm quyền | Người ký có thẩm quyền với loại chứng từ này (theo bảng phân quyền nghiệp vụ) | MSG-ERR-ESIGN-023 |
| 14 | VAL-ESIGN-05 | Chức năng | Phân ly trách nhiệm | Người Phê duyệt ≠ Người Kiểm soát; Người Kiểm soát ≠ Người lập (trừ ngoại lệ có phê duyệt) | MSG-ERR-ESIGN-024 |
| 15 | VAL-ESIGN-06 | Chức năng | Kích thước PDF | Không vượt kích thước tối đa cho ký (vd 10MB) | MSG-ERR-ESIGN-025 |
| 16 | VAL-ESIGN-07 | Chức năng | Vị trí ô ký | Ô ký Kiểm soát/Phê duyệt phải có mặt trong mẫu chứng từ và chưa được ký trước đó | MSG-ERR-ESIGN-026 |
| 17 | VAL-ESIGN-08 | Chức năng | Toàn vẹn hash | Hash PDF tại thời điểm tạo phiên ký phải khớp với PDF khi ghép chữ ký | MSG-ERR-ESIGN-027 |
| 18 | VAL-ESIGN-09 | Chức năng | Dấu thời gian | TSA trả về dấu thời gian hợp lệ trong cửa sổ cho phép | MSG-ERR-ESIGN-028 |
| 19 | VAL-ESIGN-10 | Chức năng | Thời hạn xác thực | Người ký xác thực (OTP/PIN/sinh trắc) trong vòng `<N>` giây kể từ khi mở phiên | MSG-ERR-ESIGN-029 |
| 20 | VAL-ESIGN-11 | Chức năng | Số lần ký lại | Số lần ký lại / chứng từ không vượt giới hạn (3 lần) | MSG-ERR-ESIGN-030 |
| 21 | VAL-ESIGN-12 | Chức năng | Xác minh sau ký | Kết quả xác minh ngay sau ký phải `VALID` (toàn vẹn + chứng chỉ hợp lệ) | MSG-ERR-ESIGN-031 |
| 22 | VAL-ESIGN-13 | Chức năng | Ký theo lô | Số chứng từ trong một phiên ký lô không vượt `<N>` (vd 50) | MSG-WRN-ESIGN-003 |
| 23 | VAL-ESIGN-14 | Chức năng | Uỷ quyền | Quyết định uỷ quyền còn hiệu lực; người được uỷ quyền không vượt thẩm quyền | MSG-ERR-ESIGN-032 |
| 24 | VAL-ESIGN-15 | Chức năng | Đối soát | Tổng phiên ký VDBAS và tổng `<CAProvider>` báo về khớp nhau trong cửa sổ EOD | MSG-ERR-ESIGN-033 |

## 9. Danh sách thông báo

> Phân loại 1: `ERR` lỗi chặn / `WRN` cảnh báo / `OK` thành công / `CFM` xác nhận / `INF` thông tin.
> Phân loại 2: `ESIGN` ký số.

| STT | Phân loại 1 | Phân loại 2 | Mã thông báo | Nội dung |
|---|---|---|---|---|
| 1 | ERR | ESIGN | MSG-ERR-ESIGN-001 | Trường bắt buộc `<tên trường>` không được để trống |
| 2 | ERR | ESIGN | MSG-ERR-ESIGN-002 | Trường `<tên trường>` không đúng định dạng số |
| 3 | ERR | ESIGN | MSG-ERR-ESIGN-003 | Trường ngày `<tên trường>` không hợp lệ hoặc ngoài kỳ kế toán đang mở |
| 4 | ERR | ESIGN | MSG-ERR-ESIGN-004 | Giá trị `<…>` không tồn tại trong danh mục hoặc không còn hiệu lực |
| 5 | ERR | ESIGN | MSG-ERR-ESIGN-010 | Kênh ký số đến `<CAProvider>` đang tạm dừng. Vui lòng thử lại sau |
| 6 | ERR | ESIGN | MSG-ERR-ESIGN-011 | Phiên ký đã được sử dụng. Hệ thống không cho phép ký trùng |
| 7 | ERR | ESIGN | MSG-ERR-ESIGN-012 | Bạn không có quyền thực hiện chức năng `<…>` |
| 8 | ERR | ESIGN | MSG-ERR-ESIGN-020 | Chứng từ không ở trạng thái cho phép ký. Trạng thái hiện tại: `<…>` |
| 9 | ERR | ESIGN | MSG-ERR-ESIGN-021 | Chứng chỉ số không hợp lệ: `<lý do — hết hạn / không khớp định danh người ký>` |
| 10 | ERR | ESIGN | MSG-ERR-ESIGN-022 | Chứng chỉ đã bị thu hồi. Không thể ký số chứng từ này |
| 11 | ERR | ESIGN | MSG-ERR-ESIGN-023 | Bạn không đủ thẩm quyền ký loại chứng từ `<…>` |
| 12 | ERR | ESIGN | MSG-ERR-ESIGN-024 | Người Phê duyệt không được trùng với Người Kiểm soát / Người lập |
| 13 | ERR | ESIGN | MSG-ERR-ESIGN-025 | Kích thước PDF vượt giới hạn cho ký (`<N>`MB) |
| 14 | ERR | ESIGN | MSG-ERR-ESIGN-026 | Mẫu chứng từ thiếu ô ký `<vai trò>` hoặc ô ký đã được sử dụng |
| 15 | ERR | ESIGN | MSG-ERR-ESIGN-027 | Phát hiện PDF bị thay đổi giữa quá trình ký. Hệ thống đã huỷ phiên ký |
| 16 | ERR | ESIGN | MSG-ERR-ESIGN-028 | Không lấy được dấu thời gian (TSA). Vui lòng thử lại |
| 17 | ERR | ESIGN | MSG-ERR-ESIGN-029 | Đã quá thời hạn xác thực ký. Vui lòng bắt đầu lại |
| 18 | ERR | ESIGN | MSG-ERR-ESIGN-030 | Đã đạt giới hạn 3 lần ký lại cho chứng từ này. Vui lòng liên hệ quản trị |
| 19 | ERR | ESIGN | MSG-ERR-ESIGN-031 | Xác minh chữ ký sau ký thất bại. Chữ ký không được công nhận |
| 20 | ERR | ESIGN | MSG-ERR-ESIGN-032 | Quyết định uỷ quyền không tồn tại / hết hiệu lực / vượt thẩm quyền |
| 21 | ERR | ESIGN | MSG-ERR-ESIGN-033 | Phát hiện chênh lệch khi đối soát ký số cuối ngày. Vui lòng kiểm tra báo cáo |
| 22 | ERR | ESIGN | MSG-ERR-ESIGN-040 | `<CAProvider>` từ chối yêu cầu ký. Lý do: `<chi tiết>` |
| 23 | ERR | ESIGN | MSG-ERR-ESIGN-041 | Mất kết nối tới `<CAProvider>`. Hệ thống sẽ tự thử lại |
| 24 | ERR | ESIGN | MSG-ERR-ESIGN-042 | Người ký đã huỷ phiên ký trên thiết bị |
| 25 | ERR | ESIGN | MSG-ERR-ESIGN-043 | Sai PIN / OTP / xác thực sinh trắc. Vui lòng thử lại |
| 26 | WRN | ESIGN | MSG-WRN-ESIGN-001 | Chứng chỉ tổ chức / chứng chỉ HSM sẽ hết hạn trong `<N>` ngày. Vui lòng gia hạn |
| 27 | WRN | ESIGN | MSG-WRN-ESIGN-002 | Đang vượt tốc độ ký cho phép. Hệ thống đã giãn nhịp |
| 28 | WRN | ESIGN | MSG-WRN-ESIGN-003 | Vượt số lượng chứng từ trong một phiên ký lô. Chỉ ký các chứng từ trong giới hạn |
| 29 | WRN | ESIGN | MSG-WRN-ESIGN-004 | TSA không phản hồi. Hệ thống đang ký không có dấu thời gian theo cấu hình `<…>` |
| 30 | WRN | ESIGN | MSG-WRN-ESIGN-005 | Số lỗi liên tiếp vượt ngưỡng. Kênh ký số tạm dừng tự động |
| 31 | OK | ESIGN | MSG-OK-ESIGN-001 | Đã ký số Kiểm soát thành công. Chứng từ chuyển sang chờ phê duyệt |
| 32 | OK | ESIGN | MSG-OK-ESIGN-002 | Đã ký số Phê duyệt thành công. Chứng từ đã hoàn tất ký |
| 33 | OK | ESIGN | MSG-OK-ESIGN-003 | Xác minh chữ ký số thành công |
| 34 | OK | ESIGN | MSG-OK-ESIGN-004 | Đã ký lại chứng từ thành công |
| 35 | OK | ESIGN | MSG-OK-ESIGN-005 | Đối soát ký số cuối ngày thành công, không chênh lệch |
| 36 | CFM | ESIGN | MSG-CFM-ESIGN-001 | Bạn có chắc chắn KIỂM SOÁT và KÝ SỐ chứng từ này? |
| 37 | CFM | ESIGN | MSG-CFM-ESIGN-002 | Bạn có chắc chắn PHÊ DUYỆT và KÝ SỐ chứng từ này? |
| 38 | CFM | ESIGN | MSG-CFM-ESIGN-003 | Bạn có chắc TRẢ LẠI chứng từ cho Người lập? Vui lòng nhập lý do |
| 39 | CFM | ESIGN | MSG-CFM-ESIGN-004 | Bạn có chắc TỪ CHỐI chứng từ này? Sau khi từ chối không thể khôi phục |
| 40 | CFM | ESIGN | MSG-CFM-ESIGN-005 | Bạn có chắc KÝ LẠI chứng từ ở trạng thái KÝ THẤT BẠI? |
| 41 | CFM | ESIGN | MSG-CFM-ESIGN-006 | Bạn có chắc KÝ THEO LÔ `<N>` chứng từ đã chọn? |
| 42 | CFM | ESIGN | MSG-CFM-ESIGN-007 | Bạn có chắc TẠM DỪNG kênh ký số với `<CAProvider>`? |
| 43 | INF | ESIGN | MSG-INF-ESIGN-001 | Đang chờ bạn xác thực ký trên thiết bị. Vui lòng không thao tác lại |
| 44 | INF | ESIGN | MSG-INF-ESIGN-002 | Đã gửi yêu cầu ký sang `<CAProvider>`. Vui lòng thực hiện xác thực |
| 45 | INF | ESIGN | MSG-INF-ESIGN-003 | Phiên ký đã được tạo. Mã phiên: `<sessionId>` |
| 46 | INF | ESIGN | MSG-INF-ESIGN-004 | Đã đóng phiên ký do quá hạn. Bạn có thể bắt đầu lại |
| 47 | INF | ESIGN | MSG-INF-ESIGN-005 | Kênh ký số đã được mở lại. Các chứng từ chờ ký sẽ được xử lý tiếp |

## 10. Danh sách sự kiện

> Quy ước: `<MOD>.ESIGN.<HÀNH ĐỘNG>` — phát hành lên bus sự kiện nội bộ. Phân loại: **NV** (nghiệp vụ) / **HT** (hệ thống/kỹ thuật) / **GS** (giám sát/đối soát).

| STT | Mã sự kiện | Phân loại | Chức năng / Ngữ cảnh | Mô tả |
|---|---|---|---|---|
| 1 | `<MOD>.ESIGN.SUBMITTED` | NV | Bước 1 | Người lập gửi chứng từ vào lộ trình ký |
| 2 | `<MOD>.ESIGN.PDF.GENERATED` | HT | Bước 3 / 10 | Hệ thống đã sinh PDF chứng từ chuẩn bị ký |
| 3 | `<MOD>.ESIGN.HASH.COMPUTED` | HT | Bước 3 / 10 | Hệ thống đã tính dấu vân tay PDF cần ký |
| 4 | `<MOD>.ESIGN.SESSION.OPENED` | HT | Bước 3 / 10 | Đã mở phiên ký (sessionId) |
| 5 | `<MOD>.ESIGN.REQUEST.SENT` | HT | Bước 4 / 10 | Đã gửi yêu cầu ký sang `<CAProvider>` |
| 6 | `<MOD>.ESIGN.PROMPT.SHOWN` | HT | Bước 5 / 10 | Đã hiển thị/đẩy thông báo xác thực tới người ký |
| 7 | `<MOD>.ESIGN.AUTH.OK` | HT | Bước 5 / 10 | Người ký xác thực thành công (PIN/OTP/sinh trắc) |
| 8 | `<MOD>.ESIGN.AUTH.FAILED` | HT | E4 / E5 | Xác thực ký thất bại (sai PIN/OTP, huỷ, quá hạn) |
| 9 | `<MOD>.ESIGN.SIGN.RECEIVED` | HT | Bước 6 / 10 | Đã nhận giá trị chữ ký từ `<CAProvider>`/token |
| 10 | `<MOD>.ESIGN.TSA.OK` | HT | Bước 6 / 10 | Đã đóng dấu thời gian TSA thành công |
| 11 | `<MOD>.ESIGN.TSA.FAILED` | HT | E9 | Không lấy được dấu thời gian TSA |
| 12 | `<MOD>.ESIGN.PDF.MERGED` | HT | Bước 7 / 10 | Đã ghép chữ ký số vào PDF |
| 13 | `<MOD>.ESIGN.VERIFY.OK` | HT | Bước 7 / 10 | Xác minh chữ ký ngay sau ký thành công |
| 14 | `<MOD>.ESIGN.VERIFY.FAILED` | HT | E10 | Xác minh chữ ký sau ký thất bại; huỷ kết quả ký |
| 15 | `<MOD>.ESIGN.CERT.OCSP.OK` | HT | Bước 7 | Chứng chỉ hợp lệ theo OCSP/CRL tại thời điểm ký |
| 16 | `<MOD>.ESIGN.CERT.REVOKED` | NV | E2 | Chứng chỉ đã bị thu hồi |
| 17 | `<MOD>.ESIGN.SIGNED.CONTROL` | NV | Bước 8 | Đã ký Kiểm soát thành công; chuyển sang chờ phê duyệt |
| 18 | `<MOD>.ESIGN.SIGNED.APPROVAL` | NV | Bước 11 | Đã ký Phê duyệt thành công |
| 19 | `<MOD>.ESIGN.COMPLETED` | NV | Bước 11 | Chứng từ đủ chữ ký, hoàn tất luồng ký |
| 20 | `<MOD>.ESIGN.RETURNED` | NV | A4 | Người Kiểm soát/Phê duyệt trả lại chứng từ cho Người lập |
| 21 | `<MOD>.ESIGN.REJECTED` | NV | A5 | Người Kiểm soát/Phê duyệt từ chối chứng từ |
| 22 | `<MOD>.ESIGN.FAILED` | NV | E1-E3, E6-E10 | Ký số thất bại (tổng quát) |
| 23 | `<MOD>.ESIGN.TIMEOUT` | HT | E5 | Quá hạn xác thực ký; phiên bị đóng |
| 24 | `<MOD>.ESIGN.RETRY` | HT | E6 | Tự động gửi lại yêu cầu do lỗi tạm thời |
| 25 | `<MOD>.ESIGN.RETRY.EXCEEDED` | HT | E14 | Vượt số lần ký lại; chặn ký |
| 26 | `<MOD>.ESIGN.RESIGN.MANUAL` | NV | A8 | Người dùng / quản trị thực hiện Ký lại thủ công |
| 27 | `<MOD>.ESIGN.BATCH.STARTED` | HT | A6 | Bắt đầu phiên ký theo lô |
| 28 | `<MOD>.ESIGN.BATCH.DONE` | HT | A6 | Kết thúc phiên ký theo lô |
| 29 | `<MOD>.ESIGN.DELEGATE.USED` | NV | A7 | Có sử dụng quyết định uỷ quyền để ký |
| 30 | `<MOD>.ESIGN.ORG.STAMP.APPLIED` | HT | A3 | Đã đóng dấu cơ quan tự động bằng chứng chỉ tổ chức |
| 31 | `<MOD>.ESIGN.SESSION.CLOSED` | HT | – | Đã đóng phiên ký (kết thúc/quá hạn) |
| 32 | `<MOD>.ESIGN.PAUSE` | HT | A10 | Kênh ký số đã được tạm dừng |
| 33 | `<MOD>.ESIGN.RESUME` | HT | A10 | Kênh ký số đã được mở lại |
| 34 | `<MOD>.ESIGN.CIRCUIT.OPENED` | HT | E8 | Ngắt mạch tự động do lỗi liên tiếp vượt ngưỡng |
| 35 | `<MOD>.ESIGN.CIRCUIT.CLOSED` | HT | E8 | Khôi phục kênh ký số sau ngắt mạch |
| 36 | `<MOD>.ESIGN.THROTTLED` | HT | – | Đã giãn nhịp ký do chạm giới hạn tốc độ |
| 37 | `<MOD>.ESIGN.RECONCILE.MATCH` | GS | A9 | Đối soát ký số EOD khớp, không chênh lệch |
| 38 | `<MOD>.ESIGN.RECONCILE.MISMATCH` | GS | E13 | Phát hiện chênh lệch khi đối soát; sinh báo cáo và cảnh báo |
| 39 | `<MOD>.ESIGN.RECONCILE.BLOCK_EOD` | GS | E13 | Chặn nghiệp vụ cuối ngày do còn chênh lệch chưa xử lý |
| 40 | `<MOD>.ESIGN.CERT.EXPIRING` | HT | BIZ-ESIGN-16 | Cảnh báo chứng chỉ tổ chức/HSM sắp hết hạn |
| 41 | `<MOD>.ESIGN.CONFIG.CHANGED` | HT | – | Có thay đổi cấu hình kết nối / mẫu chứng từ / lộ trình ký |
| 42 | `<MOD>.ESIGN.ALERT.THRESHOLD` | GS | – | Vượt ngưỡng cảnh báo (tỷ lệ lỗi, độ trễ, hàng tồn đọng) |

## 11. Trạng thái tích hợp (Ký số)

### 11.1 Trạng thái chứng từ trong luồng ký

| Trạng thái | Ý nghĩa nghiệp vụ |
|---|---|
| `DRAFT` (NHÁP) | Người lập đang soạn, chưa gửi đi |
| `PENDING_CONTROL` (CHỜ KIỂM SOÁT) | Người lập đã gửi, đang chờ Người kiểm soát thao tác |
| `CONTROL_SIGNING` (ĐANG KÝ KIỂM SOÁT) | Người kiểm soát đã bấm Ký, đang chờ xác thực với `<CAProvider>` |
| `CONTROL_SIGNED` (ĐÃ KÝ KIỂM SOÁT) | Ký Kiểm soát thành công, chờ Người phê duyệt |
| `PENDING_APPROVAL` (CHỜ PHÊ DUYỆT) | Đã có chữ ký Kiểm soát; đang chờ Người phê duyệt thao tác |
| `APPROVAL_SIGNING` (ĐANG KÝ PHÊ DUYỆT) | Người phê duyệt đã bấm Ký, đang chờ xác thực với `<CAProvider>` |
| `COMPLETED` (HOÀN TẤT) | Đã đủ chữ ký Kiểm soát + Phê duyệt; chứng từ có giá trị pháp lý |
| `RETURNED` (TRẢ LẠI) | Người kiểm soát/phê duyệt trả về cho Người lập sửa |
| `REJECTED` (TỪ CHỐI) | Người kiểm soát/phê duyệt từ chối; kết thúc luồng |
| `SIGN_FAILED` (KÝ THẤT BẠI) | Ký số thất bại (lỗi `<CAProvider>` / chứng chỉ / xác minh sau ký) |
| `SIGN_TIMEOUT` (QUÁ HẠN KÝ) | Người ký không xác thực kịp thời hạn |
| `CANCELLED` (HUỶ) | Bị huỷ do vượt số lần ký lại hoặc nghiệp vụ thay đổi |

### 11.2 Bảng chuyển trạng thái

| # | Trạng thái hiện tại | Sự kiện / Hành động | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | (chưa có) | Người lập tạo chứng từ | `DRAFT` | – |
| 2 | `DRAFT` | Người lập bấm **Gửi kiểm soát** (sau khi qua kiểm tra dữ liệu) | `PENDING_CONTROL` | Phát `<MOD>.ESIGN.SUBMITTED` |
| 3 | `PENDING_CONTROL` | Người kiểm soát bấm **Kiểm soát + Ký số** | `CONTROL_SIGNING` | Sinh PDF; mở phiên ký; phát `<MOD>.ESIGN.SESSION.OPENED`, `<MOD>.ESIGN.REQUEST.SENT` |
| 4 | `PENDING_CONTROL` | Người kiểm soát bấm **Trả lại** | `RETURNED` | Phát `<MOD>.ESIGN.RETURNED`; thông báo Người lập |
| 5 | `PENDING_CONTROL` | Người kiểm soát bấm **Từ chối** | `REJECTED` | Phát `<MOD>.ESIGN.REJECTED` |
| 6 | `CONTROL_SIGNING` | Xác thực thành công + nhận chữ ký + xác minh OK | `CONTROL_SIGNED` → `PENDING_APPROVAL` | Phát `<MOD>.ESIGN.SIGNED.CONTROL`; chuyển tiếp |
| 7 | `CONTROL_SIGNING` | Người dùng huỷ / sai PIN-OTP | `PENDING_CONTROL` | Phát `<MOD>.ESIGN.AUTH.FAILED`; cho thử lại |
| 8 | `CONTROL_SIGNING` | Quá hạn xác thực (`<N>` giây) | `SIGN_TIMEOUT` | Phát `<MOD>.ESIGN.TIMEOUT` |
| 9 | `CONTROL_SIGNING` | `<CAProvider>` lỗi tạm thời → đã gửi lại đủ số lần | `SIGN_FAILED` | Phát `<MOD>.ESIGN.RETRY.EXCEEDED`, `<MOD>.ESIGN.FAILED` |
| 10 | `CONTROL_SIGNING` | Chứng chỉ thu hồi / vượt thẩm quyền / xác minh sau ký FAIL | `SIGN_FAILED` | Phát `<MOD>.ESIGN.FAILED` (kèm lý do) |
| 11 | `PENDING_APPROVAL` | Người phê duyệt bấm **Phê duyệt + Ký số** | `APPROVAL_SIGNING` | Tương tự bước 3 cho vai trò Phê duyệt |
| 12 | `PENDING_APPROVAL` | Người phê duyệt bấm **Trả lại** | `RETURNED` | Phát `<MOD>.ESIGN.RETURNED` |
| 13 | `PENDING_APPROVAL` | Người phê duyệt bấm **Từ chối** | `REJECTED` | Phát `<MOD>.ESIGN.REJECTED` |
| 14 | `APPROVAL_SIGNING` | Ký thành công + xác minh OK | `COMPLETED` | Phát `<MOD>.ESIGN.SIGNED.APPROVAL`, `<MOD>.ESIGN.COMPLETED`; lưu PDF cuối |
| 15 | `APPROVAL_SIGNING` | Người dùng huỷ / sai PIN-OTP | `PENDING_APPROVAL` | Phát `<MOD>.ESIGN.AUTH.FAILED` |
| 16 | `APPROVAL_SIGNING` | Quá hạn xác thực | `SIGN_TIMEOUT` | Phát `<MOD>.ESIGN.TIMEOUT` |
| 17 | `APPROVAL_SIGNING` | Lỗi không khắc phục được | `SIGN_FAILED` | Phát `<MOD>.ESIGN.FAILED` |
| 18 | `SIGN_TIMEOUT` | Người dùng bấm **Ký lại** | `PENDING_CONTROL` hoặc `PENDING_APPROVAL` (về trạng thái ngay trước) | Phát `<MOD>.ESIGN.RESIGN.MANUAL` |
| 19 | `SIGN_FAILED` | Quản trị/người dùng bấm **Ký lại** (chưa vượt giới hạn) | `PENDING_CONTROL` hoặc `PENDING_APPROVAL` | Phát `<MOD>.ESIGN.RESIGN.MANUAL`; tăng `resignCount` |
| 20 | `SIGN_FAILED` | Vượt 3 lần ký lại + chưa được phê duyệt cấp cao | `CANCELLED` | Phát `<MOD>.ESIGN.RETRY.EXCEEDED` |
| 21 | `RETURNED` | Người lập sửa và gửi lại | `PENDING_CONTROL` | Phát `<MOD>.ESIGN.SUBMITTED` (lượt mới) |
| 22 | `COMPLETED` | Có yêu cầu huỷ/đảo từ nghiệp vụ thượng nguồn | (giữ `COMPLETED`, sinh chứng từ đảo) | Xử lý ở chức năng huỷ/đảo riêng — PDF đã ký không sửa được |

### 11.3 Sơ đồ trạng thái (ASCII)

```
                                +---------+
                                |  DRAFT  |
                                +----+----+
                                     | (gửi kiểm soát)
                                     v
                            +------------------+
                            | PENDING_CONTROL  | <----------------+
                            +-------+----------+                  |
                       (trả lại) /  |  \  (từ chối)               |
                          v        |   v                          |
                     +--------+    | +---------+                  |
                     |RETURNED|    | |REJECTED |                  |
                     +---+----+    | +---------+                  |
              (Người lập sửa)      | (kiểm soát + ký)             |
                     |             v                              |
                     +--->  +----------------+                    |
                            |CONTROL_SIGNING |                    |
                            +-------+--------+                    |
                  (huỷ/sai PIN-OTP) |  (timeout)  (lỗi)          |
                        +-----------+-----+--------+              |
                        |                 |        v              |
                        v                 |    +-----------+      |
                  PENDING_CONTROL         |    |SIGN_FAILED|      |
                  (thử lại)               v    +-----+-----+      |
                                    +-------------+   |            |
                                    |SIGN_TIMEOUT |   |(ký lại)    |
                                    +------+------+   |            |
                                           |          +------------+
                                       (ký lại)
                                           |
                                           v
                                  PENDING_CONTROL
                                           |
                                  (ký kiểm soát OK)
                                           v
                                  +-----------------+
                                  | CONTROL_SIGNED  |
                                  +-------+---------+
                                          v
                                  +-----------------+
                                  |PENDING_APPROVAL |<------+
                                  +-------+---------+       |
                          (trả lại / từ chối)               |
                                          v                 |
                                  RETURNED / REJECTED       |
                                          |                 |
                                 (phê duyệt + ký)           |
                                          v                 |
                                  +-----------------+       |
                                  |APPROVAL_SIGNING |       |
                                  +--------+--------+       |
                  (huỷ/timeout/lỗi)        |   (OK + xác minh OK)
                       +-----------------+ |       |
                       |                 | |       v
                       v                 | |  +---------+
                 SIGN_TIMEOUT/FAILED -----+ |  |COMPLETED|
                       |                    |  +---------+
                  (ký lại) (vượt 3 lần)     |
                       |        |           |
                       +------> CANCELLED   |
                       |                    |
                       +--------------------+

       PENDING_CONTROL / PENDING_APPROVAL --(tạm dừng kênh)--> (giữ hàng đợi)
                                          --(mở lại kênh)-----> (xử lý tiếp)
```

## 12. Giao diện liên quan

| STT | Màn hình / Thành phần |
|---|---|
| 1 | `<MOD>.ESIGN.QUEUE.CONTROL` — Danh sách chứng từ chờ kiểm soát |
| 2 | `<MOD>.ESIGN.QUEUE.APPROVAL` — Danh sách chứng từ chờ phê duyệt |
| 3 | `<MOD>.ESIGN.SIGN-PANEL` — Khung ký số (xem PDF, thả chữ ký hình ảnh, bấm Ký, chờ xác thực) |
| 4 | `<MOD>.ESIGN.BATCH` — Màn hình ký theo lô (chọn nhiều chứng từ, xác thực 1 lần) |
| 5 | `<MOD>.ESIGN.MONITOR` — Dashboard giám sát: số phiên ký, tỷ lệ thành công/thất bại, độ trễ, hàng tồn đọng, trạng thái ngắt mạch |
| 6 | `<MOD>.ESIGN.SESSION` — Tra cứu phiên ký theo sessionId / chứng từ / người ký / khoảng thời gian |
| 7 | `<MOD>.ESIGN.AUDIT` — Tra cứu nhật ký ký số đầy đủ (serial chứng chỉ, kết quả xác minh, PDF hash) |
| 8 | `<MOD>.ESIGN.VERIFY` — Công cụ xác minh chữ ký số trên PDF đã lưu trữ (re-verification) |
| 9 | `<MOD>.ESIGN.RECONCILE` — Báo cáo đối soát ký số cuối ngày với `<CAProvider>` |
| 10 | `<MOD>.ESIGN.CONFIG.ROUTE` — Cấu hình lộ trình ký (vai trò, thứ tự, ngoại lệ) theo loại chứng từ |
| 11 | `<MOD>.ESIGN.CONFIG.TEMPLATE` — Cấu hình mẫu chứng từ + vị trí ô ký Kiểm soát/Phê duyệt |
| 12 | `<MOD>.ESIGN.CONFIG.PROVIDER` — Cấu hình kết nối `<CAProvider>`, TSA, OCSP/CRL, giới hạn tốc độ, ngắt mạch |
| 13 | `<MOD>.ESIGN.PAUSE` — Tạm dừng / mở lại kênh ký số (kèm phê duyệt) |
| 14 | `<MOD>.ESIGN.NOTIFY` — Cấu hình thông báo/cảnh báo (email/Teams/Slack) khi lỗi vượt ngưỡng |
| 15 | `<MOD>.ESIGN.CERT-MGR` — Quản lý chứng chỉ tổ chức / HSM (gia hạn, luân chuyển, danh sách chứng chỉ cá nhân được cấp) |
| 16 | `<MOD>.ESIGN.DELEGATE` — Quản lý uỷ quyền ký (tạo, gia hạn, huỷ, danh sách hiệu lực) |
| 17 | `<MOD>.ESIGN.RESIGN` — Màn hình thao tác Ký lại thủ công (có nhật ký + giới hạn 3 lần) |
| 18 | `<MOD>.ESIGN.STORAGE` — Kho lưu trữ chứng từ đã ký (tải về, in, xác minh lại) |

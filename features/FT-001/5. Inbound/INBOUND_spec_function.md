# Bảng đặc tả chức năng

> Chức năng **Nhận dữ liệu từ hệ thống bên ngoài** điển hình — tích hợp inbound (nhận trực tuyến, qua hàng đợi tin nhắn, qua tệp, hoặc chủ động kéo theo lịch). BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.IN.<SrcSys>` |
| Tên chức năng | Nhận dữ liệu `<Loại dữ liệu>` từ hệ thống `<SrcSys>` |
| Hệ thống nguồn | `<Tên hệ thống bên ngoài>` (vd: NHNN/CITAD, T24, ERP, Cổng dịch vụ công Quốc gia, …) |
| Người sử dụng | Tài khoản hệ thống (tự động); Quản trị tích hợp (giám sát, cấu hình); Vận hành (đẩy lại, đối soát, duyệt thủ công) |
| Phương thức tiếp nhận | `<Hệ thống nguồn gọi trực tuyến (REST/SOAP) / Nhận qua hàng đợi tin nhắn / Nhận tệp qua thư mục an toàn / Chủ động kéo theo lịch>` |
| Mô tả | Tiếp nhận, xác thực, kiểm tra hợp lệ, ánh xạ và lưu dữ liệu `<…>` từ `<SrcSys>` vào hệ thống hiện tại; xử lý lỗi qua hộp lỗi và phản hồi kết quả cho hệ thống nguồn |
| Độ ưu tiên | Cao |
| SLA | `<vd: thời gian sẵn sàng nhận ≥ 99.9%; xử lý ≤ 2s/bản ghi; thông lượng ≥ N bản ghi/giây>` |
| URD reference | `<URD-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Điểm tiếp nhận (đường dẫn API / hàng đợi / thư mục tệp) đã được cấu hình và đăng ký với `<SrcSys>` |
| 2 | Thông tin xác thực (chứng chỉ, khoá ký, tài khoản tích hợp) đã được cài đặt và còn hiệu lực |
| 3 | Tài khoản hệ thống có quyền ghi dữ liệu vào bảng tạm/bảng chính và phát sự kiện nội bộ |
| 4 | Cấu trúc dữ liệu (theo định dạng JSON/XML/CSV) và bảng mapping đã được thống nhất, đã có phiên bản hiệu lực |
| 5 | Danh mục tham chiếu (đơn vị, loại tiền, mã giao dịch…) đã được đồng bộ |
| 6 | Hộp lỗi, nhật ký, hệ thống giám sát/cảnh báo đã được cấu hình |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Bản ghi hợp lệ đã được lưu vào bảng chính với trạng thái ĐÃ TIẾP NHẬN (RECEIVED) hoặc ĐÃ HẠCH TOÁN (POSTED) |
| 2 | Bản ghi lỗi đã được đẩy vào hộp lỗi kèm mã định danh, lý do và dữ liệu gốc |
| 3 | Hệ thống nguồn đã nhận được phản hồi (đồng bộ hoặc bất đồng bộ) theo thoả thuận tích hợp |
| 4 | Nhật ký ghi nhận: mã định danh, hệ thống nguồn, thời điểm, dấu vân tay (hash) dữ liệu, kích thước, kết quả |
| 5 | Sự kiện nội bộ đã được phát hành (vd `<MOD>.IN.RECEIVED`, `<MOD>.IN.POSTED`) cho các phân hệ liên quan |
| 6 | Số liệu giám sát (số bản ghi, tỷ lệ lỗi, độ trễ) đã được cập nhật lên dashboard |

## 4. Luồng chính

| Bước | Người dùng / Hệ thống nguồn | Hệ thống hiện tại |
|---|---|---|
| 1 | `<SrcSys>` gửi dữ liệu qua kênh tiếp nhận tương ứng | Tiếp nhận yêu cầu; sinh mã định danh; ghi nhật ký dữ liệu thô + thông tin gửi |
| 2 | – | Xác thực: kiểm tra chứng chỉ/khoá/tài khoản tích hợp; kiểm tra danh sách địa chỉ được phép kết nối |
| 3 | – | Kiểm tra cấu trúc: phân tích dữ liệu; đối chiếu với mẫu cấu trúc theo phiên bản đang dùng |
| 4 | – | Kiểm tra trùng lặp: tra mã định danh; nếu đã xử lý → trả lại kết quả cũ (chống trùng) |
| 5 | – | Kiểm tra dữ liệu nghiệp vụ theo §8 (định dạng, biên độ, danh mục, liên trường) |
| 6 | – | Chuyển đổi và ánh xạ dữ liệu theo bảng mapping (trường-theo-trường, tra cứu danh mục) |
| 7 | – | Ghi vào bảng tạm với trạng thái CHỜ XỬ LÝ (PENDING); chốt giao dịch dữ liệu |
| 8 | – | Áp dụng quy tắc nghiệp vụ (vd định tuyến, gán đơn vị, gán kỳ kế toán) |
| 9 | – | Chuyển từ bảng tạm sang bảng chính; cập nhật trạng thái → ĐÃ HẠCH TOÁN (POSTED); cập nhật số dư/giữ tạm nếu áp dụng |
| 10 | – | Phát sự kiện nội bộ `<MOD>.IN.POSTED` cho các phân hệ liên quan (Sổ cái, Thông báo, Báo cáo…) |
| 11 | – | Trả phản hồi cho `<SrcSys>`: thành công + mã định danh; hoặc gửi xác nhận bất đồng bộ |
| 12 | – | Cập nhật số liệu giám sát; ghi nhật ký đầy đủ |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | Chủ động kéo theo lịch | Bộ điều phối định kỳ gọi `<SrcSys>` lấy bản ghi mới theo cột mốc thời gian; lưu cột mốc sau khi xử lý xong |
| A2 | Nhận tệp lô qua thư mục an toàn | Quét thư mục đầu vào; với mỗi tệp: kiểm tra tên/kích thước/dấu kiểm tra → giải nén → xử lý từng bản ghi → di chuyển sang thư mục đã xử lý/lỗi |
| A3 | Nhận tin nhắn từ hàng đợi | Bộ tiêu thụ nhận theo nhóm; xác nhận sau khi xử lý xong; trả lại + chờ gửi lại nếu lỗi tạm thời |
| A4 | Bản ghi trùng (đã xử lý trước đó) | Bỏ qua xử lý nghiệp vụ; trả lại kết quả cũ; ghi nhật ký thông tin |
| A5 | Bản ghi cần phê duyệt thủ công (vd vượt hạn mức) | Lưu bảng chính trạng thái CHỜ DUYỆT (HOLD_FOR_REVIEW); gửi thông báo cho người duyệt; chờ thao tác |
| A6 | Vận hành bấm **Đẩy lại** trong hộp lỗi | Lấy lại dữ liệu gốc, áp dụng cấu trúc/mapping mới, chạy lại từ bước kiểm tra dữ liệu; cập nhật trạng thái |
| A7 | Đối soát cuối ngày | Tác vụ EOD đối chiếu tổng số bản ghi/tổng giá trị với `<SrcSys>`; sinh báo cáo chênh lệch |
| A8 | Tạm dừng kênh tiếp nhận (bảo trì) | Quản trị tạm dừng; `<SrcSys>` nhận thông báo bận; dữ liệu đã vào hàng đợi vẫn được xử lý theo thứ tự khi mở lại |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Xác thực thất bại (sai khoá, hết hạn, chữ ký không hợp lệ, địa chỉ không thuộc danh sách cho phép) | Trả phản hồi từ chối truy cập; không lưu dữ liệu nhạy cảm trong nhật ký; gửi cảnh báo bảo mật nếu vượt ngưỡng (vd > 5 lần/phút) |
| E2 | Dữ liệu sai cấu trúc (không khớp mẫu) | Trả phản hồi `LỖI_CẤU_TRÚC`; đẩy hộp lỗi với lý do "Sai cấu trúc dữ liệu" |
| E3 | Kích thước gói dữ liệu vượt mức tối đa (vd > 5MB) | Trả phản hồi gói quá lớn; ghi nhật ký; không xử lý |
| E4 | Kiểm tra dữ liệu nghiệp vụ thất bại (xem §8) | Trả phản hồi chi tiết lỗi từng trường; đẩy hộp lỗi; không ghi bảng chính |
| E5 | Lỗi tạm thời (cơ sở dữ liệu chậm phản hồi, hệ thống phụ thuộc không sẵn sàng) | Tự động xử lý lại theo chính sách giãn cách tăng dần (5s/15s/45s, tối đa 3 lần); sau đó đẩy hộp lỗi |
| E6 | Lỗi vĩnh viễn (dữ liệu hỏng, ánh xạ không tồn tại) | Không xử lý lại; đẩy hộp lỗi trạng thái `LỖI_VĨNH_VIỄN`; cảnh báo vận hành |
| E7 | Mapping danh mục không khớp (vd mã đơn vị không tồn tại trong danh mục) | Lưu bảng chính trạng thái CHỜ ÁNH XẠ (MAPPING_PENDING); thông báo quản trị bổ sung danh mục; đẩy lại sau khi xử lý |
| E8 | Trùng mã định danh nhưng dữ liệu khác (xung đột) | Không ghi đè; đẩy hộp lỗi `XUNG_ĐỘT_TRÙNG`; cảnh báo |
| E9 | `<SrcSys>` gửi quá nhanh vượt giới hạn cho phép | Trả phản hồi giới hạn tốc độ + đề nghị thử lại sau; áp dụng giãn nhịp |
| E10 | Không thể gửi xác nhận về cho `<SrcSys>` | Lưu vào hộp thư đi chiều ngược lại; gửi lại theo lịch cho đến khi `<SrcSys>` nhận |
| E11 | Tệp truyền vào bị hỏng / sai dấu kiểm tra | Di chuyển sang thư mục "lỗi"; ghi nhật ký; gửi cảnh báo |
| E12 | Đối soát cuối ngày phát hiện chênh lệch | Sinh báo cáo chênh lệch; gửi cho vận hành; chặn nghiệp vụ cuối ngày kế tiếp đến khi xử lý xong |
| E13 | Bản ghi CHỜ DUYỆT quá `<N>` ngày chưa duyệt | Tự động từ chối; thông báo cho người duyệt và người gửi |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-IN-01 — Mọi bản ghi tiếp nhận đều phải có mã định danh duy nhất; chống trùng theo (hệ thống nguồn, mã định danh) |
| 2 | BIZ-IN-02 — Bắt buộc xác thực và kiểm tra địa chỉ cho phép trước khi xử lý nội dung dữ liệu |
| 3 | BIZ-IN-03 — Cấu trúc dữ liệu có phiên bản; trong thời gian chuyển đổi phải hỗ trợ song song ≥ 2 phiên bản |
| 4 | BIZ-IN-04 — Mọi bản ghi lỗi phải đẩy vào hộp lỗi với đủ dữ liệu gốc + thông tin gửi + lý do + số lần đã xử lý lại |
| 5 | BIZ-IN-05 — Chỉ tự động xử lý lại với lỗi tạm thời; không tự động xử lý lại với lỗi do dữ liệu/quyền |
| 6 | BIZ-IN-06 — Nhật ký bắt buộc: mã định danh, hệ thống nguồn, thời điểm, địa chỉ, dấu vân tay dữ liệu, kích thước, kết quả, độ trễ |
| 7 | BIZ-IN-07 — Dữ liệu nhạy cảm (thông tin cá nhân, số tài khoản) phải che một phần trong nhật ký; dữ liệu thô chỉ lưu trong kho khoá có giới hạn |
| 8 | BIZ-IN-08 — Giới hạn tốc độ tiếp nhận theo hệ thống nguồn (vd ≤ 100 yêu cầu/giây, đỉnh 200); vượt → trả phản hồi giới hạn tốc độ |
| 9 | BIZ-IN-09 — Trạng thái bản ghi inbound chỉ chuyển theo lộ trình quy định ở §11; mọi chuyển trạng thái phải ghi nhật ký |
| 10 | BIZ-IN-10 — Đối soát cuối ngày bắt buộc: số lượng + tổng giá trị + dấu kiểm tra so với `<SrcSys>`; chênh lệch → chặn nghiệp vụ cuối ngày |
| 11 | BIZ-IN-11 — Đẩy lại thủ công từ hộp lỗi phải ghi nhật ký: người thao tác, thời điểm, lý do, kết quả; không cho phép đẩy lại quá 3 lần / bản ghi |
| 12 | BIZ-IN-12 — Mọi thay đổi cấu trúc/mapping phải có yêu cầu thay đổi + đã thử nghiệm trước khi triển khai; có sẵn phương án phục hồi |
| 13 | BIZ-IN-13 — Bản ghi CHỜ DUYỆT chỉ được xử lý sau khi người có quyền duyệt; quá `<N>` ngày chưa duyệt → tự từ chối + thông báo |
| 14 | BIZ-IN-14 — Quản lý chứng chỉ/khoá theo lịch luân chuyển; cảnh báo trước `<N>` ngày hết hạn |

## 8. Quy tắc kiểm tra dữ liệu

> Mã hoá theo phân loại: **Chung (CHG)** — áp dụng toàn hệ thống; **Phân hệ (PH-INT)** — áp dụng phân hệ Tích hợp; **Chức năng (IN)** — riêng cho chức năng inbound này.

| STT | Mã | Phân loại | Đối tượng | Mô tả quy tắc | Mã thông báo |
|---|---|---|---|---|---|
| 1 | VAL-CHG-01 | Chung | Mọi trường | Trường bắt buộc không được rỗng | MSG-ERR-IN-001 |
| 2 | VAL-CHG-02 | Chung | Trường số | Kiểu số, không chứa ký tự lạ, đúng dấu thập phân theo cấu hình | MSG-ERR-IN-002 |
| 3 | VAL-CHG-03 | Chung | Trường ngày | Đúng định dạng `YYYY-MM-DD`; ngày hợp lệ; thuộc kỳ kế toán đang mở | MSG-ERR-IN-003 |
| 4 | VAL-CHG-04 | Chung | Trường chuỗi | Không vượt độ dài tối đa quy định | MSG-ERR-IN-004 |
| 5 | VAL-CHG-05 | Chung | Trường tham chiếu | Giá trị phải tồn tại trong danh mục đang còn hiệu lực | MSG-ERR-IN-005 |
| 6 | VAL-PH-INT-01 | Phân hệ | Yêu cầu | Yêu cầu phải gắn mã định danh duy nhất (chống trùng) | MSG-ERR-IN-010 |
| 7 | VAL-PH-INT-02 | Phân hệ | Xác thực | Khoá/chứng chỉ/tài khoản tích hợp còn hiệu lực và đúng quyền | MSG-ERR-IN-011 |
| 8 | VAL-PH-INT-03 | Phân hệ | Địa chỉ | Địa chỉ gửi thuộc danh sách được phép kết nối | MSG-ERR-IN-012 |
| 9 | VAL-PH-INT-04 | Phân hệ | Cấu trúc | Dữ liệu khớp mẫu cấu trúc đang có hiệu lực | MSG-ERR-IN-013 |
| 10 | VAL-PH-INT-05 | Phân hệ | Kênh | Kênh tiếp nhận đang ở trạng thái hoạt động (không tạm dừng) | MSG-WRN-IN-001 |
| 11 | VAL-PH-INT-06 | Phân hệ | Tốc độ | Không vượt giới hạn tốc độ theo hệ thống nguồn | MSG-WRN-IN-002 |
| 12 | VAL-IN-01 | Chức năng | Mã định danh | Mã định danh duy nhất theo (`<SrcSys>`, mã định danh); nếu trùng dữ liệu giống nhau → coi là chống trùng; khác → xung đột | MSG-ERR-IN-020 |
| 13 | VAL-IN-02 | Chức năng | Kích thước gói | Không vượt giới hạn tối đa của hợp đồng tích hợp (vd 5MB) | MSG-ERR-IN-021 |
| 14 | VAL-IN-03 | Chức năng | Biên độ giá trị | Số tiền/định mức nằm trong biên độ cho phép theo hợp đồng | MSG-ERR-IN-022 |
| 15 | VAL-IN-04 | Chức năng | Liên trường | Tổng chi tiết bằng tổng tiêu đề; ngày phát sinh ≤ ngày tiếp nhận; mã đối tác - mã giao dịch khớp nhau | MSG-ERR-IN-023 |
| 16 | VAL-IN-05 | Chức năng | Danh mục đích | Mã đơn vị/đối tác đã tồn tại trong danh mục nội bộ (nếu không → CHỜ ÁNH XẠ) | MSG-ERR-IN-024 |
| 17 | VAL-IN-06 | Chức năng | Kỳ kế toán | Bản ghi thuộc kỳ kế toán đang mở; không gửi lùi quá `<N>` ngày | MSG-ERR-IN-025 |
| 18 | VAL-IN-07 | Chức năng | Hạn mức / cảnh báo | Vượt hạn mức kiểm soát → chuyển sang CHỜ DUYỆT thay vì từ chối | MSG-WRN-IN-003 |
| 19 | VAL-IN-08 | Chức năng | Tệp lô | Đúng tên/định dạng/dấu kiểm tra; số bản ghi khớp tiêu đề tệp | MSG-ERR-IN-026 |
| 20 | VAL-IN-09 | Chức năng | Đối soát | Tổng nhận và tổng `<SrcSys>` báo gửi khớp nhau trong cửa sổ EOD | MSG-ERR-IN-027 |

## 9. Danh sách thông báo

> Phân loại 1: `ERR` lỗi chặn / `WRN` cảnh báo / `OK` thành công / `CFM` xác nhận / `INF` thông tin.
> Phân loại 2: `IN` inbound.

| STT | Phân loại 1 | Phân loại 2 | Mã thông báo | Nội dung |
|---|---|---|---|---|
| 1 | ERR | IN | MSG-ERR-IN-001 | Trường bắt buộc `<tên trường>` không được để trống |
| 2 | ERR | IN | MSG-ERR-IN-002 | Trường `<tên trường>` không đúng định dạng số |
| 3 | ERR | IN | MSG-ERR-IN-003 | Trường ngày `<tên trường>` không hợp lệ hoặc ngoài kỳ kế toán đang mở |
| 4 | ERR | IN | MSG-ERR-IN-004 | Trường `<tên trường>` vượt độ dài tối đa cho phép |
| 5 | ERR | IN | MSG-ERR-IN-005 | Giá trị `<…>` không tồn tại trong danh mục hoặc không còn hiệu lực |
| 6 | ERR | IN | MSG-ERR-IN-010 | Thiếu mã định danh duy nhất trong yêu cầu |
| 7 | ERR | IN | MSG-ERR-IN-011 | Xác thực thất bại: khoá/chứng chỉ/tài khoản không hợp lệ hoặc hết hạn |
| 8 | ERR | IN | MSG-ERR-IN-012 | Địa chỉ gửi không nằm trong danh sách được phép kết nối |
| 9 | ERR | IN | MSG-ERR-IN-013 | Dữ liệu sai cấu trúc so với mẫu phiên bản `<v>` |
| 10 | ERR | IN | MSG-ERR-IN-020 | Mã định danh đã được sử dụng nhưng dữ liệu khác. Yêu cầu bị từ chối do xung đột |
| 11 | ERR | IN | MSG-ERR-IN-021 | Gói dữ liệu vượt kích thước tối đa cho phép |
| 12 | ERR | IN | MSG-ERR-IN-022 | Giá trị `<…>` ngoài biên độ cho phép của hợp đồng tích hợp |
| 13 | ERR | IN | MSG-ERR-IN-023 | Dữ liệu không nhất quán giữa các trường (tổng/ngày/mã đối tác) |
| 14 | ERR | IN | MSG-ERR-IN-024 | Không tìm thấy mã `<…>` trong danh mục nội bộ. Bản ghi chuyển sang CHỜ ÁNH XẠ |
| 15 | ERR | IN | MSG-ERR-IN-025 | Bản ghi thuộc kỳ kế toán đã đóng. Vui lòng kiểm tra |
| 16 | ERR | IN | MSG-ERR-IN-026 | Tệp lô bị hỏng / sai dấu kiểm tra / số bản ghi không khớp tiêu đề |
| 17 | ERR | IN | MSG-ERR-IN-027 | Phát hiện chênh lệch khi đối soát cuối ngày. Vui lòng kiểm tra báo cáo |
| 18 | ERR | IN | MSG-ERR-IN-030 | Lỗi tạm thời. Hệ thống sẽ tự xử lý lại |
| 19 | ERR | IN | MSG-ERR-IN-031 | Lỗi vĩnh viễn. Bản ghi đã được đẩy vào hộp lỗi |
| 20 | ERR | IN | MSG-ERR-IN-032 | Bản ghi đã chuyển sang CHỜ DUYỆT do vượt hạn mức kiểm soát |
| 21 | ERR | IN | MSG-ERR-IN-033 | Bản ghi CHỜ DUYỆT đã quá `<N>` ngày, bị tự động từ chối |
| 22 | WRN | IN | MSG-WRN-IN-001 | Kênh tiếp nhận `<SrcSys>` đang tạm dừng |
| 23 | WRN | IN | MSG-WRN-IN-002 | `<SrcSys>` đang gửi vượt tốc độ. Hệ thống đã trả lời giới hạn tốc độ |
| 24 | WRN | IN | MSG-WRN-IN-003 | Bản ghi vượt hạn mức kiểm soát, chuyển sang CHỜ DUYỆT |
| 25 | WRN | IN | MSG-WRN-IN-004 | Chứng chỉ/khoá xác thực sẽ hết hạn trong `<N>` ngày |
| 26 | WRN | IN | MSG-WRN-IN-005 | Số lỗi xác thực vượt ngưỡng. Đã gửi cảnh báo bảo mật |
| 27 | OK | IN | MSG-OK-IN-001 | Tiếp nhận và hạch toán thành công. Mã định danh: `<correlationId>` |
| 28 | OK | IN | MSG-OK-IN-002 | Xác nhận chống trùng. Trả lại kết quả của lần xử lý trước |
| 29 | OK | IN | MSG-OK-IN-003 | Đối soát cuối ngày thành công. Không có chênh lệch |
| 30 | OK | IN | MSG-OK-IN-004 | Đã đẩy lại bản ghi thành công từ hộp lỗi |
| 31 | OK | IN | MSG-OK-IN-005 | Bản ghi đã được duyệt thủ công và hạch toán |
| 32 | CFM | IN | MSG-CFM-IN-001 | Bạn có chắc muốn đẩy lại bản ghi này? |
| 33 | CFM | IN | MSG-CFM-IN-002 | Bạn có chắc muốn duyệt bản ghi `<…>` để hạch toán? |
| 34 | CFM | IN | MSG-CFM-IN-003 | Bạn có chắc muốn từ chối bản ghi CHỜ DUYỆT này? |
| 35 | CFM | IN | MSG-CFM-IN-004 | Bạn có chắc muốn tạm dừng kênh tiếp nhận với `<SrcSys>`? |
| 36 | CFM | IN | MSG-CFM-IN-005 | Bạn có chắc muốn bỏ qua bản ghi này trong hộp lỗi? |
| 37 | INF | IN | MSG-INF-IN-001 | Bản ghi đang được tiếp nhận và xử lý |
| 38 | INF | IN | MSG-INF-IN-002 | Bản ghi đã được lưu vào bảng tạm, đang chờ áp dụng quy tắc nghiệp vụ |
| 39 | INF | IN | MSG-INF-IN-003 | Bản ghi chuyển sang CHỜ ÁNH XẠ. Vui lòng bổ sung danh mục `<…>` |
| 40 | INF | IN | MSG-INF-IN-004 | Đã gửi xác nhận về `<SrcSys>` |

## 10. Danh sách sự kiện

> Quy ước: `<MOD>.IN.<HÀNH ĐỘNG>` — phát hành lên bus sự kiện nội bộ. Phân loại: **NV** (nghiệp vụ) / **HT** (hệ thống/kỹ thuật) / **GS** (giám sát/đối soát).

| STT | Mã sự kiện | Phân loại | Chức năng / Ngữ cảnh | Mô tả |
|---|---|---|---|---|
| 1 | `<MOD>.IN.RECEIVED` | NV | Bước 1 | Đã tiếp nhận yêu cầu từ `<SrcSys>` |
| 2 | `<MOD>.IN.AUTHENTICATED` | HT | Bước 2 | Xác thực thành công |
| 3 | `<MOD>.IN.AUTH.FAILED` | HT | E1 | Xác thực thất bại |
| 4 | `<MOD>.IN.SCHEMA.OK` | HT | Bước 3 | Cấu trúc dữ liệu hợp lệ |
| 5 | `<MOD>.IN.SCHEMA.FAILED` | HT | E2 | Cấu trúc dữ liệu không hợp lệ |
| 6 | `<MOD>.IN.IDEMPOTENT.HIT` | NV | A4 | Phát hiện trùng; trả kết quả cũ |
| 7 | `<MOD>.IN.IDEMPOTENT.CONFLICT` | NV | E8 | Trùng mã định danh nhưng dữ liệu khác |
| 8 | `<MOD>.IN.VALIDATING` | HT | Bước 5 | Đang kiểm tra dữ liệu nghiệp vụ |
| 9 | `<MOD>.IN.VALIDATE.FAILED` | NV | E4 | Kiểm tra dữ liệu nghiệp vụ thất bại |
| 10 | `<MOD>.IN.MAPPING.DONE` | HT | Bước 6 | Hoàn tất ánh xạ dữ liệu |
| 11 | `<MOD>.IN.MAPPING.PENDING` | NV | E7 | Thiếu mã ánh xạ; bản ghi chờ bổ sung danh mục |
| 12 | `<MOD>.IN.STAGING.WRITE` | HT | Bước 7 | Đã ghi vào bảng tạm |
| 13 | `<MOD>.IN.POSTED` | NV | Bước 9 | Đã chuyển từ bảng tạm sang bảng chính và hạch toán |
| 14 | `<MOD>.IN.HOLD_FOR_REVIEW` | NV | A5 | Bản ghi chờ phê duyệt thủ công |
| 15 | `<MOD>.IN.REVIEW.APPROVED` | NV | A5 | Người duyệt đã phê duyệt bản ghi |
| 16 | `<MOD>.IN.REVIEW.REJECTED` | NV | A5 / E13 | Người duyệt từ chối bản ghi (thủ công hoặc tự động hết hạn) |
| 17 | `<MOD>.IN.FAILED` | NV | E2 / E4 / E6 | Bản ghi xử lý thất bại |
| 18 | `<MOD>.IN.RETRY` | HT | E5 | Tự động xử lý lại do lỗi tạm thời |
| 19 | `<MOD>.IN.RETRY.EXCEEDED` | HT | E5 | Vượt số lần xử lý lại cho phép; chuyển vào hộp lỗi |
| 20 | `<MOD>.IN.DLQ.MOVED` | HT | E5 / E6 | Bản ghi đã chuyển vào hộp lỗi |
| 21 | `<MOD>.IN.REPLAY.MANUAL` | NV | A6 | Vận hành đẩy lại thủ công từ hộp lỗi |
| 22 | `<MOD>.IN.ACK.SENT` | HT | Bước 11 | Đã gửi xác nhận về `<SrcSys>` |
| 23 | `<MOD>.IN.ACK.FAILED` | HT | E10 | Gửi xác nhận về `<SrcSys>` thất bại; sẽ thử lại |
| 24 | `<MOD>.IN.PULL.SCHEDULED` | HT | A1 | Bắt đầu phiên kéo dữ liệu theo lịch |
| 25 | `<MOD>.IN.PULL.DONE` | HT | A1 | Kết thúc phiên kéo dữ liệu theo lịch |
| 26 | `<MOD>.IN.BATCH.FILE_RECEIVED` | HT | A2 | Đã nhận tệp lô qua thư mục an toàn |
| 27 | `<MOD>.IN.BATCH.FILE_INVALID` | HT | E11 | Tệp lô bị hỏng / sai dấu kiểm tra |
| 28 | `<MOD>.IN.QUEUE.CONSUMED` | HT | A3 | Đã đọc tin nhắn từ hàng đợi |
| 29 | `<MOD>.IN.THROTTLED` | HT | E9 | Đã giới hạn tốc độ do vượt ngưỡng |
| 30 | `<MOD>.IN.PAUSE` | HT | A8 | Kênh tiếp nhận đã được tạm dừng |
| 31 | `<MOD>.IN.RESUME` | HT | A8 | Kênh tiếp nhận đã được mở lại |
| 32 | `<MOD>.IN.RECONCILE.MATCH` | GS | A7 | Đối soát EOD thành công, không chênh lệch |
| 33 | `<MOD>.IN.RECONCILE.MISMATCH` | GS | A7 / E12 | Phát hiện chênh lệch khi đối soát; sinh báo cáo và cảnh báo |
| 34 | `<MOD>.IN.RECONCILE.BLOCK_EOD` | GS | E12 | Chặn nghiệp vụ cuối ngày do còn chênh lệch chưa xử lý |
| 35 | `<MOD>.IN.CERT.EXPIRING` | HT | BIZ-IN-14 | Cảnh báo chứng chỉ/khoá xác thực sắp hết hạn |
| 36 | `<MOD>.IN.CONFIG.CHANGED` | HT | BIZ-IN-12 | Có thay đổi cấu hình tiếp nhận / mapping / cấu trúc |
| 37 | `<MOD>.IN.ALERT.THRESHOLD` | GS | – | Vượt ngưỡng cảnh báo (tỷ lệ lỗi, độ trễ, hàng tồn đọng) |
| 38 | `<MOD>.IN.SECURITY.ALERT` | GS | E1 | Cảnh báo bảo mật do xác thực thất bại liên tục |

## 11. Trạng thái tích hợp (Inbound)

### 11.1 Trạng thái bản ghi tiếp nhận

| Trạng thái | Ý nghĩa nghiệp vụ |
|---|---|
| `RECEIVED` (ĐÃ TIẾP NHẬN) | Đã ghi nhận yêu cầu vào hệ thống, chưa kiểm tra |
| `VALIDATING` (ĐANG KIỂM TRA) | Đang xác thực + kiểm tra cấu trúc + kiểm tra nghiệp vụ |
| `PENDING` (CHỜ XỬ LÝ) | Đã ghi vào bảng tạm, chờ áp dụng quy tắc nghiệp vụ |
| `POSTED` (ĐÃ HẠCH TOÁN) | Đã chuyển sang bảng chính và phát sự kiện hạch toán |
| `HOLD_FOR_REVIEW` (CHỜ DUYỆT) | Cần phê duyệt thủ công trước khi hạch toán |
| `MAPPING_PENDING` (CHỜ ÁNH XẠ) | Thiếu mã trong danh mục nội bộ, chờ bổ sung |
| `FAILED` (THẤT BẠI) | Đã thất bại sau khi hết số lần xử lý lại |
| `IN_DLQ` (TRONG HỘP LỖI) | Đã chuyển vào hộp lỗi, chờ xử lý/đẩy lại |
| `REJECTED` (TỪ CHỐI) | Bị từ chối (do người duyệt hoặc tự động hết hạn) |
| `DUPLICATED` (TRÙNG) | Đã xử lý trước đó, trả kết quả cũ |

### 11.2 Bảng chuyển trạng thái

| # | Trạng thái hiện tại | Sự kiện / Hành động | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | (chưa có) | `<SrcSys>` gửi yêu cầu vào hệ thống | `RECEIVED` | Phát `<MOD>.IN.RECEIVED`; ghi nhật ký |
| 2 | `RECEIVED` | Xác thực thất bại | `FAILED` | Phát `<MOD>.IN.AUTH.FAILED`; trả phản hồi từ chối |
| 3 | `RECEIVED` | Cấu trúc dữ liệu sai | `FAILED` → `IN_DLQ` | Phát `<MOD>.IN.SCHEMA.FAILED`, `<MOD>.IN.DLQ.MOVED` |
| 4 | `RECEIVED` | Phát hiện trùng (mã định danh + dữ liệu giống) | `DUPLICATED` | Phát `<MOD>.IN.IDEMPOTENT.HIT`; trả kết quả cũ |
| 5 | `RECEIVED` | Trùng mã nhưng dữ liệu khác | `IN_DLQ` | Phát `<MOD>.IN.IDEMPOTENT.CONFLICT`, `<MOD>.IN.DLQ.MOVED` |
| 6 | `RECEIVED` | Bắt đầu kiểm tra dữ liệu nghiệp vụ | `VALIDATING` | Phát `<MOD>.IN.VALIDATING` |
| 7 | `VALIDATING` | Kiểm tra hợp lệ | `PENDING` | Ghi vào bảng tạm; phát `<MOD>.IN.STAGING.WRITE` |
| 8 | `VALIDATING` | Kiểm tra thất bại | `FAILED` → `IN_DLQ` | Phát `<MOD>.IN.VALIDATE.FAILED`, `<MOD>.IN.DLQ.MOVED` |
| 9 | `VALIDATING` | Thiếu mã ánh xạ | `MAPPING_PENDING` | Phát `<MOD>.IN.MAPPING.PENDING`; thông báo quản trị |
| 10 | `VALIDATING` | Vượt hạn mức kiểm soát | `HOLD_FOR_REVIEW` | Phát `<MOD>.IN.HOLD_FOR_REVIEW`; thông báo người duyệt |
| 11 | `PENDING` | Áp dụng quy tắc nghiệp vụ thành công | `POSTED` | Phát `<MOD>.IN.POSTED`; gửi xác nhận về `<SrcSys>` |
| 12 | `PENDING` | Lỗi tạm thời | `PENDING` (giữ nguyên) | Tăng `retryCount`; phát `<MOD>.IN.RETRY` |
| 13 | `PENDING` | Vượt số lần xử lý lại | `IN_DLQ` | Phát `<MOD>.IN.RETRY.EXCEEDED`, `<MOD>.IN.DLQ.MOVED` |
| 14 | `MAPPING_PENDING` | Quản trị bổ sung danh mục → tự đẩy lại | `VALIDATING` | Phát `<MOD>.IN.REPLAY.MANUAL` |
| 15 | `MAPPING_PENDING` | Quá `<N>` ngày chưa bổ sung | `IN_DLQ` | Phát `<MOD>.IN.DLQ.MOVED` |
| 16 | `HOLD_FOR_REVIEW` | Người có quyền duyệt | `POSTED` | Phát `<MOD>.IN.REVIEW.APPROVED`, `<MOD>.IN.POSTED` |
| 17 | `HOLD_FOR_REVIEW` | Người có quyền từ chối | `REJECTED` | Phát `<MOD>.IN.REVIEW.REJECTED`; trả phản hồi về `<SrcSys>` |
| 18 | `HOLD_FOR_REVIEW` | Quá `<N>` ngày chưa duyệt | `REJECTED` | Phát `<MOD>.IN.REVIEW.REJECTED` (tự động) |
| 19 | `IN_DLQ` | Vận hành bấm Đẩy lại | `RECEIVED` | Phát `<MOD>.IN.REPLAY.MANUAL`; tăng `replayCount` |
| 20 | `IN_DLQ` | Vận hành chọn bỏ qua (ack-skip) | `REJECTED` | Ghi lý do; cập nhật đối soát |
| 21 | `POSTED` | Có nghiệp vụ huỷ/đảo từ `<SrcSys>` | (giữ POSTED, sinh bản ghi đảo) | Phát sự kiện đảo (xử lý ở chức năng huỷ/đảo riêng) |

### 11.3 Sơ đồ trạng thái (ASCII)

```
        (`<SrcSys>` gửi)
                |
                v
         +-------------+
         |  RECEIVED   |--------(xác thực thất bại)-----> FAILED
         +------+------+
                |
       (sai cấu trúc / xung đột)----------> IN_DLQ
                |
       (trùng, dữ liệu khớp) ---> DUPLICATED (trả kết quả cũ)
                |
                v
         +-------------+
         | VALIDATING  |
         +------+------+
                |
     +----------+----------+----------+
     |          |          |          |
 (OK) (lỗi nghiệp vụ) (thiếu ánh xạ) (vượt hạn mức)
     |          |          |          |
     v          v          v          v
  +------+   +------+  +---------+ +----------+
  |PEND- |   |FAILED|  |MAPPING_ | |HOLD_FOR_ |
  |  ING |   |      |  | PENDING | |  REVIEW  |
  +--+---+   +--+---+  +----+----+ +-----+----+
     |          |           |             |
     |          v           |  (quá hạn)  |  (duyệt)
     |        IN_DLQ <------+-------------+
     |                           |        |
     |                           |        v
     |                           |     +-------+
     |                           |     |POSTED |
     |                           v     +-------+
     |                       (từ chối)
     |                           |
     |                           v
     |                       +-------+
     +--------(thành công)-> |POSTED |
                             +-------+

   IN_DLQ --(vận hành Đẩy lại)--> RECEIVED
   IN_DLQ --(vận hành Bỏ qua)---> REJECTED
```

## 12. Giao diện liên quan

| STT | Màn hình / Điểm tiếp nhận |
|---|---|
| 1 | `<MOD>.IN.ENDPOINT` — Điểm tiếp nhận trực tuyến (REST/SOAP/Webhook) từ `<SrcSys>` |
| 2 | `<MOD>.IN.CONSUMER` — Dịch vụ tiêu thụ tin nhắn từ hàng đợi |
| 3 | `<MOD>.IN.SFTP` — Tác vụ quét thư mục an toàn nhận tệp |
| 4 | `<MOD>.IN.PULL` — Tác vụ chủ động kéo dữ liệu từ `<SrcSys>` theo lịch |
| 5 | `<MOD>.IN.MONITOR` — Dashboard giám sát: số lượng, độ trễ, tỷ lệ lỗi, thông lượng, hàng tồn đọng |
| 6 | `<MOD>.IN.DLQ` — Hộp lỗi: tra cứu, xem chi tiết, đẩy lại, bỏ qua |
| 7 | `<MOD>.IN.AUDIT` — Tra cứu nhật ký inbound theo mã định danh / hệ thống nguồn / thời gian |
| 8 | `<MOD>.IN.MAPPING` — Cấu hình cấu trúc/danh mục giữa `<SrcSys>` và hệ thống |
| 9 | `<MOD>.IN.REVIEW` — Màn hình duyệt thủ công bản ghi CHỜ DUYỆT |
| 10 | `<MOD>.IN.RECONCILE` — Báo cáo đối soát cuối ngày + chênh lệch + công cụ xử lý |
| 11 | `<MOD>.IN.CONFIG` — Cấu hình kết nối, xác thực, giới hạn tốc độ, xử lý lại, danh sách địa chỉ cho phép |
| 12 | `<MOD>.IN.PAUSE` — Tạm dừng / mở lại kênh tiếp nhận (kèm phê duyệt) |
| 13 | `<MOD>.IN.NOTIFY` — Cấu hình thông báo/cảnh báo (email/Teams/Slack) khi lỗi vượt ngưỡng |
| 14 | `<MOD>.IN.SECRETS` — Quản lý chứng chỉ/khoá tiếp nhận (kho khoá + lịch luân chuyển) |
| 15 | `<MOD>.IN.REPLAY` — Màn hình thao tác đẩy lại thủ công (có nhật ký + giới hạn 3 lần) |

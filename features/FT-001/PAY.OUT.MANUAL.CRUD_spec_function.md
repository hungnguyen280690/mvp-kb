# A-Bảng đặc tả chức năng

> Chức năng **Thêm mới / Xem / Sửa / Xoá** giao dịch **Lệnh thanh toán đi thủ công**.

## A1. Thông tin chung

| Trường             | Giá trị                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Mã chức năng       | `PAY.OUT.MANUAL`                                                                                                         |
| Tên chức năng (VN) | Lệnh thanh toán đi thủ công — Thêm mới / Xem / Sửa / Xoá                                                                 |
| Tên chức năng (EN) | PAY.OUT.MANUAL                                                                                                           |
| Người sử dụng      | Người lập (Maker), Người kiểm soát (Checker), Người phê duyệt (Approver), Người tra cứu (Viewer)                         |
| Mô tả              | Cho phép NSD tạo mới, tra cứu, sửa, xoá lệnh thanh toán đi thủ công; gửi kiểm soát theo quy trình Maker–Checker–Approver |
| Độ ưu tiên         | Cao                                                                                                                      |
| URD reference      | _(chưa cung cấp)_                                                                                                        |

## A2. Tiền điều kiện

| STT | Điều kiện                                                                              |
| --- | -------------------------------------------------------------------------------------- |
| 1   | NSD đã đăng nhập hệ thống                                                              |
| 2   | NSD có quyền truy cập màn hình theo vai trò (Maker/Checker/Approver/Viewer)            |
| 3   | Các danh mục Master Data đã được cấu hình (đơn vị, tài khoản, loại tiền, mã quỹ…)      |
| 4   | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái DRAFT hoặc RETURNED_TO_MAKER |
| 5   | (Trường hợp Sửa/Xoá) NSD là Maker gốc của bản ghi                                      |

## A3. Hậu điều kiện

| STT | Điều kiện                                                                             |
| --- | ------------------------------------------------------------------------------------- |
| 1   | (Trường hợp Thêm/Sửa) Bản ghi được lưu với trạng thái DRAFT hoặc READY_FOR_APPROVAL   |
| 2   | (Trường hợp Xoá) Bản ghi được soft-delete, ẩn khỏi danh sách, vẫn truy được qua audit |
| 3   | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue)               |
| 4   | (Trường hợp Submit giao dịch) Notification đã gửi đến Checker/Approver                |
| 5   | Số dư hold (nếu có) được cập nhật tương ứng                                           |

## A4. Luồng chính

| Bước | Người dùng                                                                    | Hệ thống                                                                                                                                |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Bấm **Thêm mới** trên màn hình danh sách, hoặc Menu "Thêm mới"                | (1) Mở form trống, (2) Sinh ID của giao dịch, (3) Trạng thái giao dịch=DRAFT, (4) Tự động điền thông tin (người lập/ngày lập)           |
| 2    | Nhập các trường dữ liệu theo Bảng đặc tả Field                                | (1) Kiểm tra dữ liệu khi rời ô nhập (onBlur), (2) Kiểm tra ràng buộc giữa các trường khi gửi lệnh, (3) Kiểm tra theo quy định nghiệp vụ |
| 3    | Đính kèm chứng từ (File upload) _(Optional)_                                  | Validate ≤ 10MB, định dạng pdf/jpg/png/docx (VAL-09)                                                                                    |
| 4    | Bấm **Lưu**                                                                   | Validate cơ bản; lưu DRAFT; hiển thị MSG-OK-SAVE                                                                                        |
| 5    | Bấm **Submit** (Gửi kiểm soát/phê duyệt)                                      | Validate đầy đủ (tham chiếu mục 6. Luồng ngoại lệ); chuyển trạng thái READY_FOR_APPROVAL; gửi notify Checker                            |
| 6    | (Xem) Chọn dòng trong danh sách, bấm **Xem** hoặc click link `<Mã giao dịch>` | Mở form read-only; hiển thị đầy đủ trường, [Tab] Đính kèm, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt                          |
| 7    | (Sửa) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Sửa**                       | Mở form editable; load phiên bản hiện hành F-VER; cho phép thay đổi các trường                                                          |
| 8    | (Sửa) Lưu thay đổi                                                            | Kiểm tra optimistic lock (VAL-15); cập nhật F-VER+1; ghi audit oldValue→newValue                                                        |
| 9    | (Xoá) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Xoá**                       | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận đã rà soát                                                                     |
| 10   | (Xoá) Bấm **Xác nhận xoá**                                                    | Soft-delete (F-STATUS=DELETED), ghi audit, release hold (nếu có), hiển thị MSG-OK-DELETE                                                |

## A5. Luồng thay thế

| Mã  | Mô tả                                           | Hệ thống                                                                       |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| A1  | NSD bấm **Lưu nháp** thay vì Submit             | Bỏ qua validate đầy đủ, chỉ validate định dạng; lưu DRAFT                      |
| A2  | NSD bấm **Huỷ** khi đang nhập                   | Nếu form đã nhập dữ liệu → hỏi xác nhận; nếu xác nhận → đóng form, bỏ thay đổi |
| A3  | NSD bấm **Export**                              | Xuất Excel/PDF/CSV (sync nếu < 50k bản ghi, async nếu vượt)                    |
| A4  | NSD copy từ bản ghi đã có                       | Mở form Thêm mới với dữ liệu sao chép; F-ID mới, F-STATUS=DRAFT                |
| A5  | Checker bấm **Phê duyệt** → chuyển Approver     | Cập nhật trạng thái PENDING_APPROVER; notify Approver                          |
| A6  | Approver bấm **Phê duyệt**                      | Cập nhật APPROVED; trigger luồng nghiệp vụ kế tiếp                             |
| A7  | NSD bấm **In phiếu** trên [Tab] Thông tin chung | Sinh PDF theo template, hiển thị preview                                       |

## A6. Luồng ngoại lệ

| Mã  | Điều kiện                                          | Xử lý                                                                                       |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| E1  | Trường bắt buộc bị bỏ trống khi Submit (VAL-01)    | Highlight đỏ + hiển thị `Vui lòng nhập [Tên trường]`; chặn submit                           |
| E2  | Giá trị không thuộc danh mục (VAL-03)              | Thông báo `Giá trị không nằm trong danh mục`; clear trường                                  |
| E3  | Cross-field không thoả mãn (VAL-05/07/08)          | Hiển thị thông báo cụ thể tại trường lỗi; chặn Submit                                       |
| E4  | File đính kèm vượt giới hạn/sai định dạng (VAL-09) | Thông báo `File vượt giới hạn hoặc sai định dạng`; không upload                             |
| E5  | Sửa/Xoá khi trạng thái không cho phép (VAL-13)     | Thông báo `Giao dịch đang ở trạng thái [<state>], không cho phép Sửa/Xoá`; disable nút      |
| E6  | Sửa/Xoá khi không phải Maker gốc (VAL-14)          | Thông báo `Chỉ Người lập gốc mới được phép Sửa/Xoá`                                         |
| E7  | Optimistic lock conflict (VAL-15)                  | Thông báo `Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục`       |
| E8  | Confirm xoá không đủ điều kiện (VAL-16)            | Disable nút Xác nhận xoá đến khi nhập đủ lý do + tick checkbox                              |
| E9  | Vượt hạn mức (VAL-12)                              | Hiển thị warning vàng `Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn`; cho phép tiếp tục |
| E10 | Lỗi hệ thống / API timeout                         | Hiển thị `Lỗi hệ thống, traceId: <…>`; rollback giao dịch                                   |
| E11 | Concurrent edit (record đang bị lock)              | Thông báo `Giao dịch đang được [<user>] chỉnh sửa, vui lòng thử lại sau`                    |

## A7. Quy tắc nghiệp vụ

| STT | Quy tắc                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | BIZ-001 — Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò                                    |
| 2   | BIZ-002 — Chỉ Maker gốc được Sửa/Xoá khi bản ghi ở DRAFT/RETURNED_TO_MAKER                                      |
| 3   | BIZ-003 — Xoá là soft-delete; bản ghi vẫn truy được qua audit/history                                           |
| 4   | BIZ-004 — Tổng tiền dòng chi tiết (`SUM(LINE_AMOUNT)`) phải bằng `AMOUNT` của bản ghi cha (Tab Thông tin chung) |
| 5   | BIZ-005 — File đính kèm: tối đa 10MB/file, định dạng pdf/jpg/png/docx; tối đa N file/bản ghi                    |
| 6   | BIZ-006 — Lý do từ chối/huỷ ≥ 10 ký tự và ≤ 500 ký tự, lưu vào audit                                            |
| 7   | BIZ-007 — Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue                                  |
| 8   | BIZ-008 — Transaction History ghi thông tin: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE       |
| 9   | BIZ-009 — Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp                             |
| 10  | BIZ-010 — Vượt hạn mức cấu hình → bắt buộc phê duyệt cấp cao hơn                                                |

## A8. Quy tắc kiểm tra dữ liệu

| STT | Phân loại | Mã     | Quy tắc                                                                                                                                                                                                |
| --- | --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Chung     | VAL-01 | Trường bắt buộc (`Mandatory`) không được bỏ trống khi Submit; highlight đỏ + thông báo `Vui lòng nhập [Tên trường]`                                                                                    |
| 2   | Chung     | VAL-02 | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Integer/Decimal (range, số chữ số thập phân), Date/DateTime (định dạng `dd/MM/yyyy [HH:mm:ss]`), Email (RFC 5322), Phone (E.164),... |
| 3   | Chung     | VAL-03 | Giá trị thuộc danh mục Master Data (Dropdown/Combobox/Tree-select/Picker); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường                                               |
| 4   | Chung     | VAL-04 | Range/min-max cho số và ngày (vd Số tiền > 0, Ngày hiệu lực ≥ Ngày hiện tại); DateRange: Từ ngày ≤ Đến ngày, không vượt biên độ cấu hình                                                               |
| 5   | Chung     | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các trường (vd Đơn vị thụ hưởng ≠ Đơn vị thanh toán; Tài khoản nợ ≠ Tài khoản có; Loại tiền nợ = Loại tiền có)                                                  |
| 6   | Chung     | VAL-06 | Trường phụ thuộc (cascading): khi giá trị trường cha thay đổi → reset/refresh dropdown trường con                                                                                                      |
| 7   | Chung     | VAL-07 | Tổng dòng chi tiết = giá trị tổng hợp ở bản ghi cha (vd `SUM(LINE_AMOUNT) = AMOUNT`); chênh lệch > tolerance → chặn Submit                                                                             |
| 8   | Chung     | VAL-08 | Ràng buộc theo thời gian: ngày phải nằm trong kỳ kế toán mở; ngoài giờ giao dịch → cảnh báo                                                                                                            |
| 9   | Chung     | VAL-09 | File đính kèm: ≤ 10MB/file, định dạng pdf/jpg/png/docx; ≤ N file/bản ghi; quét virus trước khi lưu                                                                                                     |
| 10  | Chung     | VAL-10 | Trường Text: trim, không cho phép ký tự điều khiển (`\x00-\x1F`); chống XSS/SQL Injection bằng escape                                                                                                  |
| 11  | Chung     | VAL-11 | Unique constraint: mã giao dịch / số chứng từ duy nhất trong phạm vi (đơn vị, kỳ, loại)                                                                                                                |
| 12  | Phân hệ   | VAL-12 | Hạn mức theo cấu hình phân hệ (user/đơn vị/sản phẩm): vượt → warning vàng, yêu cầu phê duyệt cấp cao hơn                                                                                               |
| 13  | Chung     | VAL-13 | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với DRAFT/RETURNED_TO_MAKER; không cho thao tác trên bản ghi đã APPROVED/POSTED                                                                              |
| 14  | Chung     | VAL-14 | Người sở hữu: chỉ Maker gốc được Sửa/Xoá; phá vỡ → chặn + log audit bảo mật                                                                                                                            |
| 15  | Chung     | VAL-15 | Optimistic lock theo `(F-ID, F-VER)`: khi Lưu nếu `F-VER` trong DB ≠ `F-VER` đã load → chặn, thông báo tải lại                                                                                         |
| 16  | Chung     | VAL-16 | Confirm xoá: bắt buộc nhập **Lý do** ≥ 10 ký tự và tick checkbox xác nhận; thiếu → disable nút Xác nhận xoá                                                                                            |
| 17  | Chung     | VAL-17 | Trường immutable trong Edit-mode: F-ID, F-AUDIT (người lập, ngày lập), F-VER; backend reject nếu client gửi thay đổi                                                                                   |
| 18  | Chung     | VAL-18 | Cảnh báo trùng: trong N phút có giao dịch cùng (Đơn vị + Số tiền + Số chứng từ gốc) → warning + nút `Tiếp tục`/`Huỷ`                                                                                   |
| 19  | Chức năng | VAL-19 | Cross-Validation Rule (CCID) cho các trường COA (GL_SEGMENT1..12): tổ hợp segment phải thuộc CCID hợp lệ đã cấu hình; vi phạm → highlight dòng lỗi, hiển thị MSG-ERR-CCID, chặn Submit                 |

## A9. Danh sách thông báo

| STT | Phân loại 1 | Phân loại 2 | Mã                      | Nội dung                                                                                                |
| --- | ----------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Chung       | Error       | MSG-ERR-REQUIRED        | Vui lòng nhập `[Tên trường]`                                                                            |
| 2   | Chung       | Error       | MSG-ERR-FORMAT          | Định dạng `[Tên trường]` không hợp lệ                                                                   |
| 3   | Chung       | Error       | MSG-ERR-LOOKUP          | Giá trị không nằm trong danh mục                                                                        |
| 4   | Chung       | Error       | MSG-ERR-RANGE           | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`)                                             |
| 5   | Chung       | Error       | MSG-ERR-CROSS-FIELD     | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]`                                  |
| 6   | Chung       | Error       | MSG-ERR-FILE            | File vượt giới hạn hoặc sai định dạng                                                                   |
| 7   | Chung       | Error       | MSG-ERR-DUPLICATE       | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]`                                                     |
| 8   | Chung       | Error       | MSG-ERR-SYSTEM          | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị                                    |
| 9   | Chung       | Error       | MSG-ERR-TIMEOUT         | Yêu cầu quá thời gian xử lý, vui lòng thử lại                                                           |
| 10  | Chung       | Error       | MSG-ERR-PERMISSION      | Bạn không có quyền thực hiện thao tác này                                                               |
| 11  | Chung       | Error       | MSG-ERR-SESSION         | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại                                                      |
| 12  | Chung       | Success     | MSG-OK-SAVE             | Lưu giao dịch thành công                                                                                |
| 13  | Chung       | Success     | MSG-OK-DELETE           | Xoá giao dịch thành công                                                                                |
| 14  | Chung       | Success     | MSG-OK-SUBMIT           | Đã gửi giao dịch để kiểm soát/phê duyệt                                                                 |
| 15  | Chung       | Confirm     | MSG-CFM-CANCEL          | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?                                                            |
| 16  | Chung       | Confirm     | MSG-CFM-DELETE          | Bạn có chắc muốn xoá giao dịch `<Mã giao dịch>`?                                                        |
| 17  | Chung       | Warning     | MSG-WRN-LIMIT           | Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn                                                        |
| 18  | Chung       | Warning     | MSG-WRN-OUTSIDE-HOUR    | Ngoài giờ giao dịch, vui lòng xem lại                                                                   |
| 19  | Chung       | Error       | MSG-ERR-STATUS          | Giao dịch đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá                                         |
| 20  | Chung       | Error       | MSG-ERR-MAKER           | Chỉ Người lập gốc mới được phép Sửa/Xoá                                                                 |
| 21  | Chung       | Error       | MSG-ERR-LOCK            | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục                               |
| 22  | Chung       | Error       | MSG-ERR-CONCURRENT      | Giao dịch đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau                                          |
| 23  | Chung       | Error       | MSG-ERR-DELETE-CFM      | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát                                                 |
| 24  | Chung       | Warning     | MSG-WRN-DUPLICATE       | Phát hiện giao dịch tương tự đã được lập gần đây. Bạn có muốn tiếp tục?                                 |
| 25  | Chung       | Info        | MSG-INF-NOTIFY-CHECKER  | Đã gửi thông báo đến Người kiểm soát `<…>`                                                              |
| 26  | Chức năng   | Error       | MSG-ERR-AMOUNT-MISMATCH | Tổng số tiền dòng chi tiết (`SUM(LINE_AMOUNT)`) không khớp với `AMOUNT` ở Tab Thông tin chung           |
| 27  | Chức năng   | Warning     | MSG-WRN-AMOUNT-MISMATCH | Chênh lệch giữa tổng dòng chi tiết và Số tiền chuyển nằm trong ngưỡng tolerance — vui lòng kiểm tra lại |
| 28  | Chức năng   | Error       | MSG-ERR-CCID            | Tổ hợp segment COA không hợp lệ theo Cross-Validation Rule (CCID)                                       |
| 29  | Chung       | Info        | MSG-INF-NOTIFY-APPROVER | Đã gửi thông báo đến Người phê duyệt `<…>`                                                              |

## A10. Danh sách sự kiện

| STT | Mã sự kiện (Event_id)             | Phân loại | Chức năng    | Mô tả                                                     |
| --- | --------------------------------- | --------- | ------------ | --------------------------------------------------------- |
| 1   | `PAY.OUT.MANUAL.LIST.VIEW`        | Chung     | Danh sách    | Mở màn hình danh sách giao dịch                           |
| 2   | `PAY.OUT.MANUAL.LIST.FILTER`      | Chung     | Danh sách    | NSD áp dụng bộ lọc/tìm kiếm/sort                          |
| 3   | `PAY.OUT.MANUAL.LIST.EXPORT`      | Chung     | Danh sách    | NSD xuất dữ liệu Excel/PDF/CSV                            |
| 4   | `PAY.OUT.MANUAL.NEW.OPEN`         | Chung     | Thêm mới     | Mở form Thêm mới, sinh F-ID preview                       |
| 5   | `PAY.OUT.MANUAL.NEW.SAVE`         | Chung     | Thêm mới     | Lưu bản ghi DRAFT                                         |
| 6   | `PAY.OUT.MANUAL.NEW.SUBMIT`       | Chung     | Thêm mới     | Submit → READY_FOR_APPROVAL; notify Checker               |
| 7   | `PAY.OUT.MANUAL.NEW.CANCEL`       | Chung     | Thêm mới     | Huỷ form, bỏ thay đổi                                     |
| 8   | `PAY.OUT.MANUAL.NEW.COPY`         | Chung     | Thêm mới     | Tạo mới bằng cách copy từ bản ghi đã có                   |
| 9   | `PAY.OUT.MANUAL.VIEW.OPEN`        | Chung     | Xem          | Mở form Xem (read-only)                                   |
| 10  | `PAY.OUT.MANUAL.VIEW.HISTORY`     | Chung     | Xem          | Mở tab Lịch sử giao dịch / Audit                          |
| 11  | `PAY.OUT.MANUAL.VIEW.APPROVAL`    | Chung     | Xem          | Mở tab Trạng thái phê duyệt                               |
| 12  | `PAY.OUT.MANUAL.EDIT.OPEN`        | Chung     | Sửa          | Mở form Sửa, load F-VER hiện hành                         |
| 13  | `PAY.OUT.MANUAL.EDIT.SAVE`        | Chung     | Sửa          | Lưu thay đổi, cập nhật F-VER+1, ghi audit                 |
| 14  | `PAY.OUT.MANUAL.EDIT.CANCEL`      | Chung     | Sửa          | Huỷ chỉnh sửa, bỏ thay đổi                                |
| 15  | `PAY.OUT.MANUAL.DELETE.OPEN`      | Chung     | Xoá          | Mở popup Xoá (lý do + checkbox)                           |
| 16  | `PAY.OUT.MANUAL.DELETE.CONFIRM`   | Chức năng | Xoá          | Soft-delete, release hold, ghi audit                      |
| 17  | `PAY.OUT.MANUAL.ATTACH.UPLOAD`    | Chung     | Đính kèm     | Upload file (validate kích thước/định dạng/AV)            |
| 18  | `PAY.OUT.MANUAL.ATTACH.DELETE`    | Chung     | Đính kèm     | Xoá file đính kèm                                         |
| 18a | `PAY.OUT.MANUAL.ATTACH.DOWNLOAD`  | Chung     | Đính kèm     | Tải file đính kèm xuống máy NSD; ghi audit truy cập       |
| 19  | `PAY.OUT.MANUAL.APPROVE.CHECKER`  | Chung     | Kiểm soát    | Checker phê duyệt → chuyển Approver                       |
| 20  | `PAY.OUT.MANUAL.APPROVE.APPROVER` | Chung     | Phê duyệt    | Approver phê duyệt → APPROVED                             |
| 21  | `PAY.OUT.MANUAL.APPROVE.REJECT`   | Chung     | Phê duyệt    | Từ chối → REJECTED + lý do                                |
| 22  | `PAY.OUT.MANUAL.APPROVE.RETURN`   | Chung     | Phê duyệt    | Trả lại Maker → RETURNED_TO_MAKER                         |
| 23  | `PAY.OUT.MANUAL.PRINT.PREVIEW`    | Chung     | In phiếu     | Sinh PDF preview theo template                            |
| 24  | `PAY.OUT.MANUAL.NOTIFY.SEND`      | Chung     | Notification | Gửi notification chuyển trạng thái (in-app + email)       |
| 25  | `PAY.OUT.MANUAL.AUDIT.WRITE`      | Chung     | Audit        | Ghi log thao tác (user, timestamp, IP, oldValue→newValue) |
| 26  | `PAY.OUT.MANUAL.SESSION.TIMEOUT`  | Chung     | Phiên        | Phiên hết hạn → buộc đăng nhập lại                        |
| 27  | `PAY.OUT.MANUAL.LOCK.ACQUIRE`     | Chức năng | Concurrent   | Lấy lock khi mở Sửa; release khi đóng/lưu                 |
| 28  | `PAY.OUT.MANUAL.LOCK.CONFLICT`    | Chức năng | Concurrent   | Phát hiện conflict (optimistic lock mismatch)             |

## A11. State Machine (Trạng thái giao dịch)

> Trạng thái sử dụng: `Start`, `DRAFT`, `READY_FOR_APPROVAL`, `PENDING_APPROVER`, `APPROVED`, `TRANSFERRED_TO_GL`, `POSTED`, `RETURNED_TO_MAKER`, `REJECTED`, `DELETED`, `End`.

| STT | Sự kiện                                                  | Trạng thái                                                                     | Trạng thái mới     | Tác động                                                      |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------- |
| 1   | Maker tạo mới (`PAY.OUT.MANUAL.NEW.OPEN`)                | Start                                                                          | DRAFT              | Sinh F-ID, F-VER=1, F-STATUS=DRAFT, autofill F-AUDIT; ghi log |
| 2   | Maker Lưu/Lưu nháp (`PAY.OUT.MANUAL.NEW.SAVE`)           | DRAFT                                                                          | DRAFT              | Lưu thay đổi; ghi audit; MSG-OK-SAVE; F-VER không đổi         |
| 3   | Maker huỷ Thêm mới (`PAY.OUT.MANUAL.NEW.CANCEL`)         | DRAFT (chưa lưu)                                                               | End                | Đóng form, bỏ thay đổi; nếu chưa Save → không sinh bản ghi DB |
| 4   | Maker Sửa & Lưu (`PAY.OUT.MANUAL.EDIT.SAVE`)             | DRAFT / RETURNED_TO_MAKER                                                      | DRAFT              | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit         |
| 5   | Maker Submit (`PAY.OUT.MANUAL.NEW.SUBMIT`)               | DRAFT / RETURNED_TO_MAKER                                                      | READY_FOR_APPROVAL | Validate đầy đủ; notify Checker; ghi audit                    |
| 6   | Maker Xoá (`PAY.OUT.MANUAL.DELETE.CONFIRM`)              | DRAFT / RETURNED_TO_MAKER                                                      | DELETED            | Soft-delete; release hold; ghi audit; MSG-OK-DELETE           |
| 7   | Checker phê duyệt (`PAY.OUT.MANUAL.APPROVE.CHECKER`)     | READY_FOR_APPROVAL                                                             | PENDING_APPROVER   | Chuyển chờ Approver; notify Approver; ghi audit               |
| 8   | Checker trả lại Maker (`PAY.OUT.MANUAL.APPROVE.RETURN`)  | READY_FOR_APPROVAL                                                             | RETURNED_TO_MAKER  | Lý do ≥ 10 ký tự; notify Maker; ghi audit                     |
| 9   | Checker từ chối (`PAY.OUT.MANUAL.APPROVE.REJECT`)        | READY_FOR_APPROVAL                                                             | REJECTED           | Lý do; notify Maker; khoá giao dịch; ghi audit                |
| 10  | Approver phê duyệt (`PAY.OUT.MANUAL.APPROVE.APPROVER`)   | PENDING_APPROVER                                                               | APPROVED           | APPROVED; trigger downstream; notify Maker; ghi audit         |
| 11  | Approver trả lại Maker (`PAY.OUT.MANUAL.APPROVE.RETURN`) | PENDING_APPROVER                                                               | RETURNED_TO_MAKER  | Lý do; notify Maker; ghi audit                                |
| 12  | Approver từ chối (`PAY.OUT.MANUAL.APPROVE.REJECT`)       | PENDING_APPROVER                                                               | REJECTED           | Lý do; notify Maker; khoá giao dịch; ghi audit                |
| 13  | Hệ thống hạch toán                                       | APPROVED                                                                       | TRANSFERRED_TO_GL  | Trigger downstream; ghi audit                                 |
| 14  | Hệ thống ghi sổ                                          | TRANSFERRED_TO_GL                                                              | POSTED             | Trigger downstream; ghi audit                                 |
| 15  | Đóng nghiệp vụ                                           | POSTED / REJECTED / DELETED                                                    | End                | Khoá Sửa/Xoá; chỉ Xem; ghi audit truy cập                     |
| 16  | (Vi phạm) Cố Sửa/Xoá ở trạng thái không cho phép         | READY_FOR_APPROVAL / PENDING_APPROVER / APPROVED / POSTED / REJECTED / DELETED | (Không đổi)        | Chặn (VAL-13); MSG-ERR-STATUS; ghi audit bảo mật              |
| 17  | (Vi phạm) Không phải Maker gốc Sửa/Xoá                   | DRAFT / RETURNED_TO_MAKER                                                      | (Không đổi)        | Chặn (VAL-14); MSG-ERR-MAKER; ghi audit bảo mật               |
| 18  | (Concurrent) Optimistic lock mismatch                    | DRAFT / RETURNED_TO_MAKER                                                      | (Không đổi)        | Chặn (VAL-15); MSG-ERR-LOCK; ghi audit                        |
| 19  | (Hệ thống) Phiên hết hạn                                 | (Bất kỳ)                                                                       | (Không đổi)        | Đăng nhập lại; lưu draft tạm; MSG-ERR-SESSION                 |
| 20  | (Quản trị) Khôi phục bản ghi đã xoá                      | DELETED                                                                        | DRAFT              | Restore F-STATUS=DRAFT; ghi audit; chỉ Quản trị               |

## A12. Giao diện liên quan

| STT | Màn hình                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `PAY.OUT.MANUAL.LIST` — Danh sách lệnh thanh toán đi thủ công (lọc, sort, phân trang, export)                |
| 2   | `PAY.OUT.MANUAL.NEW` — Form Thêm mới                                                                         |
| 3   | `PAY.OUT.MANUAL.VIEW` — Form Xem (read-only), gồm: [Tab] Đính kèm, [Tab] Lịch sử, [Tab] Trạng thái phê duyệt |
| 4   | `PAY.OUT.MANUAL.EDIT` — Form Sửa                                                                             |
| 5   | `PAY.OUT.MANUAL.DELETE` — Popup xác nhận Xoá                                                                 |
| 6   | `PAY.OUT.MANUAL.DETAIL.GRID` — Inline grid chi tiết khoản mục                                                |
| 7   | `PAY.OUT.MANUAL.ATTACH` — Popup quản lý đính kèm                                                             |
| 8   | `PAY.OUT.MANUAL.HISTORY` — Popup lịch sử audit                                                               |
| 9   | `PAY.OUT.MANUAL.LOOKUP.*` — Popup tra cứu danh mục (BANK, USER, DVQHNS, COA, CURRENCY, …)                    |
| 10  | `PAY.OUT.MANUAL.APPROVE` — Màn hình kiểm soát/phê duyệt                                                      |
| 11  | `PAY.OUT.MANUAL.PRINT` — Preview in phiếu                                                                    |
| 12  | `PAY.OUT.MANUAL.EXPORT` — Tuỳ chọn xuất Excel/PDF/CSV                                                        |

###########################################

# B - Đặc tả trường dữ liệu

> Chú thích cột **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện.
> Chú thích cột **Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / DateTime Picker / Checkbox / Radio / File Upload / Lookup.

## B1. Màn hình `PAY.OUT.MANUAL.NEW`, `PAY.OUT.MANUAL.VIEW`, `PAY.OUT.MANUAL.EDIT`

### B1.1. \[Tab\] Thông tin chung

| Trường               | Trường (ENG)         | Loại              | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------- | ----------------- | -------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kênh                 | CHANNEL              | Dropdown          | Y        |                  | String       | Mặc định hiển thị theo user đăng nhập. Danh mục `LOV.01.Channel`: Liên ngân hàng / Thanh toán song phương / Liên kho bạc.                                                                                                                                                                                                                                      |
| Loại lệnh            | ORDER_TYPE           | Dropdown          | Y        |                  | String       | Danh mục `LOV.01.Channel_Type` phụ thuộc Kênh. Nếu **Kênh = Thanh toán song phương**: Lệnh thông thường / Lệnh trái phiếu chính phủ / Lệnh có thông tin thu NSNN. Nếu **Kênh = Liên ngân hàng**: Lệnh chuyển khoản / Lệnh chi TM cho KBNN / Lệnh chi TM cho KH / TT bằng ngoại tệ khác. Nếu **Kênh = Liên kho bạc**: trường này mờ, không cho phép chọn.       |
| NH/KB chuyển         | SENDER               | TextBox           | Y        |                  | String       | Tự hiển thị mã NH trực tiếp của đơn vị user đăng nhập, không cho sửa. Tham chiếu `LOV.02.Bank_Account_Number` + `LOV.03.Branch_Name`.                                                                                                                                                                                                                          |
| NH/KB nhận           | RECEIVER             | TextBox           | Y        |                  | String       | Tự hiển thị theo cặp thiết lập song phương và cho sửa với lệnh TTSP; tự hiển thị mã NH trực tiếp của người nhận và không cho sửa với lệnh LNH. Tham chiếu `LOV.02.Bank_Account_Number` + `LOV.03.Branch_Name`.                                                                                                                                                 |
| Số YCTT/Số bút toán  | REF_NO               | TextBox           | Y        |                  | String       | Bắt buộc nhập. Với kênh Liên ngân hàng, số YCTT được hiểu là số bút toán.                                                                                                                                                                                                                                                                                      |
| Ngày thanh toán      | PAYMENT_DATE         | Date Picker       | Y        | Ngày hiện tại    | Date         | Tự hiển thị ngày hiện tại, không cho phép sửa.                                                                                                                                                                                                                                                                                                                 |
| Số tiền chuyển       | AMOUNT               | Number Field      | Y        |                  | Number       | Tự hiển thị bằng tổng tiền ở các dòng chi tiết khoản mục (`SUM(LINE_AMOUNT)`).                                                                                                                                                                                                                                                                                 |
| Loại tiền            | CURRENCY_CODE        | Dropdown          | Y        | VND              | String       | Mặc định "VND" và cho phép chọn lại trong danh mục `LOV.04.Currency_Code`.                                                                                                                                                                                                                                                                                     |
| Loại giao dịch       | LNH_TRANSACTION_TYPE | Dropdown          | C        |                  | String       | Chỉ hiển thị khi **Kênh = Liên ngân hàng**. Danh mục `LOV.06.Payment_Type_Code`: Lệnh chuyển Có GT thấp/cao, Lệnh chuyển Nợ GT thấp/cao. (1) Nếu AMOUNT ≥ 500 triệu → mặc định "Lệnh chuyển Có GT cao", không cho chọn loại GT thấp. (2) Nếu AMOUNT < 500 triệu hoặc Loại tiền là ngoại tệ → mặc định "Lệnh chuyển Có GT thấp", cho phép chọn lên loại GT cao. |
| Tỷ giá               | EXCHANGE_RATE        | Number Field      | C        |                  | Number       | Chỉ hiển thị và bắt buộc nhập nếu Loại tiền là ngoại tệ.                                                                                                                                                                                                                                                                                                       |
| Số chứng từ gốc      | ORIGIN_NUM           | TextBox           | C        |                  | Varchar      | Bắt buộc nhập nếu Kênh = Thanh toán song phương.                                                                                                                                                                                                                                                                                                               |
| Ngày chứng từ        | TRANSACTION_DATE     | Date Picker       | C        |                  | Date         | Bắt buộc nhập nếu Kênh = Thanh toán song phương.                                                                                                                                                                                                                                                                                                               |
| Loại phí             | EXP_TYPE             | Dropdown + Lookup | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Tham chiếu `LOV.05.Expense_Code` (EXP01..EXP05).                                                                                                                                                                                                                                                               |
| Mã ngoại tệ trích nợ | FN_CODE1             | Dropdown + Lookup | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Chọn trong `LOV.04.Currency_Code`.                                                                                                                                                                                                                                                                             |
| Mã ngoại tệ TT       | FN_CODE2             | Dropdown + Lookup | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Chọn trong `LOV.04.Currency_Code`.                                                                                                                                                                                                                                                                             |
| Số tiền ngoại tệ TT  | FN_AMOUNT            | Number Field      | C        |                  | Number       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác.                                                                                                                                                                                                                                                                                                                |
| Nội dung thanh toán  | DESCRIPTION          | TextArea          | Y        |                  | String       | Bắt buộc nhập.                                                                                                                                                                                                                                                                                                                                                 |
| Người lập            | CREATED_BY           | TextBox           | N (auto) |                  | String       | Hệ thống tự lấy user hiện tại, không cho phép sửa.                                                                                                                                                                                                                                                                                                             |
| Ngày lập             | CREATED_DATE         | Date Picker       | N (auto) |                  | DateTime     | Tự động hiển thị thời gian ngày làm việc hiện tại theo định dạng `dd/mm/yyyy hh:MM:ss`, không cho sửa.                                                                                                                                                                                                                                                         |

### B1.2. \[Tab\] Thông tin khoản mục

| Trường      | Trường (ENG) | Loại             | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                           |
| ----------- | ------------ | ---------------- | -------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Mã quỹ      | GL_SEGMENT1  | Dropbox + Lookup | N        | 01               | Varchar(2)   | 2 ký tự. Cho phép sửa, tuân theo CCID. Tham chiếu `LOV.07.1.Segment_Code`.                                                  |
| TK tự nhiên | GL_SEGMENT2  | Number Field     | Y        |                  | Varchar(4)   | Tài khoản tự nhiên 4 ký tự, tuân theo CCID. Tham chiếu `LOV.07.2.Segment_Code`.                                             |
| DVQHNS      | GL_SEGMENT3  | Dropbox + Lookup | Y        |                  | Varchar(7)   | Đơn vị quan hệ ngân sách 7 ký tự, tuân theo CCID. Tham chiếu `LOV.07.3.Segment_Code`.                                       |
| Cấp NS      | GL_SEGMENT4  | Dropbox + Lookup | C        |                  | Varchar      | Cấp ngân sách, tuân theo CCID. Tham chiếu `LOV.07.4.Segment_Code`.                                                          |
| Chương      | GL_SEGMENT5  | Dropbox + Lookup | C        | 000              | Varchar(3)   | Mã chương 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`. Tham chiếu `LOV.07.5.Segment_Code`.               |
| Ngành KT    | GL_SEGMENT6  | Dropbox + Lookup | C        | 000              | Varchar(3)   | Mã ngành kinh tế 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`. Tham chiếu `LOV.07.6.Segment_Code`.        |
| NDKT        | GL_SEGMENT7  | Dropbox + Lookup | C        | 0000             | Varchar(4)   | Nội dung kinh tế 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`. Tham chiếu `LOV.07.7.Segment_Code`.       |
| ĐB          | GL_SEGMENT8  | Dropbox + Lookup | C        | 00000            | Varchar(5)   | Mã địa bàn 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`. Tham chiếu `LOV.07.8.Segment_Code`.            |
| CTMT        | GL_SEGMENT9  | Dropbox + Lookup | C        | 00000            | Varchar(5)   | Chương trình mục tiêu 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`. Tham chiếu `LOV.07.9.Segment_Code`. |
| MN          | GL_SEGMENT10 | Dropbox + Lookup | C        | 00               | Varchar(2)   | Mã nguồn kinh phí 2 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`. Tham chiếu `LOV.07.10.Segment_Code`.       |
| Kho bạc     | GL_SEGMENT11 | Dropbox + Lookup | C        | 0000             | Varchar(4)   | Mã kho bạc 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`. Tham chiếu `LOV.07.11.Segment_Code`.            |
| DP          | GL_SEGMENT12 | Dropbox + Lookup | C        | 00               | Varchar(3)   | Mã dự phòng, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`. Tham chiếu `LOV.07.12.Segment_Code`.                     |
| Diễn giải   | DESCRIPTION  | TextArea         | Y        |                  | String       | Diễn giải số tiền chi tiết của dòng.                                                                                        |
| Số tiền     | LINE_AMOUNT  | Number Field     | Y        |                  | Number       | Số tiền của dòng chi tiết. Tổng `LINE_AMOUNT` = `AMOUNT` ở Tab Thông tin chung.                                             |

### B1.3. \[Tab\] Thông tin người chuyển

| Trường             | Trường (ENG)        | Loại             | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                     |
| ------------------ | ------------------- | ---------------- | -------- | ---------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| Tên                | SENDER_NAME         | TextBox          | Y        |                  | String       | Tự hiển thị theo mã COA đã nhập và cho phép sửa.                                                      |
| Địa chỉ            | SENDER_ADDRESS      | TextBox          | Y        |                  | String       | Cho nhập.                                                                                             |
| Tài khoản          | SENDER_GL_SEGMENT2  | Number Field     | Y        |                  | Number       | Tự hiển thị theo mã COA và không cho sửa. Tham chiếu `LOV.07.2.Segment_Code`.                         |
| Mã KH              | SENDER_NUM          | Number Field     | N        |                  | Number       | Cho nhập.                                                                                             |
| Mở tại NH/KB       | SENDER_BANK_CODE    | Dropbox + Lookup | Y        |                  | String       | Tự hiển thị mã NH của user đăng nhập. Tham chiếu `LOV.02.Bank_Account_Number` + `LOV.03.Branch_Name`. |
| CMND/CCCD/HC/Mã DN | SENDER_IDENTIFY_ID  | TextBox          | N        |                  | String       | Cho nhập.                                                                                             |
| Ngày cấp           | SENDER_ISSUED_DATE  | Date Picker      | C        |                  | Date         | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.                                                      |
| Nơi cấp            | SENDER_ISSUED_PLACE | TextBox          | C        |                  | String       | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.                                                      |
| Mã TPCP            | TPCP_CODE           | TextBox          | C        |                  | String       | Bắt buộc nhập nếu Loại lệnh = Lệnh trái phiếu chính phủ.                                              |

### B1.4. \[Tab\] Thông tin người nhận

| Trường             | Trường (ENG)          | Loại             | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                 |
| ------------------ | --------------------- | ---------------- | -------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| Tên                | RECEIVER_NAME         | TextBox          | Y        |                  | String       | Cho nhập.                                                                                         |
| Địa chỉ            | RECEIVER_ADDRESS      | TextBox          | N        |                  | String       | Cho nhập.                                                                                         |
| Tài khoản          | RECEIVER_GL_SEGMENT2  | Dropbox + Lookup | Y        |                  | Number       | Cho phép nhập số tài khoản của người nhận tiền. Tham chiếu `LOV.07.2.Segment_Code`.               |
| Mở tại NH/KB       | RECEIVER_BANK_CODE    | Dropbox + Lookup | Y        |                  | String       | Mã NH/KB người nhận mở tài khoản. Tham chiếu `LOV.02.Bank_Account_Number` + `LOV.03.Branch_Name`. |
| Tên tài khoản      | RECEIVER_ACCOUNT_NAME | TextBox          | Y        |                  | String       | Tên tài khoản của người nhận tiền.                                                                |
| CMND/CCCD/HC/Mã DN | RECEIVER_IDENTIFY_ID  | TextBox          | N        |                  | String       | Cho nhập.                                                                                         |
| Ngày cấp           | RECEIVER_ISSUED_DATE  | Date Picker      | C        |                  | Date         | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.                                                  |
| Nơi cấp            | RECEIVER_ISSUED_PLACE | TextBox          | C        |                  | String       | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.                                                  |

### B1.5. \[Tab\] Đính kèm tài liệu

> Mục đích: Cho phép đính kèm file định dạng pdf/jpg/png/docx/xlsx cho bản ghi. Khi click vào Tab này sẽ liên kết đến `PAY.OUT.MANUAL.ATTACH`.

---

## B2. Màn hình `PAY.OUT.MANUAL.LIST`

> Mục đích: liệt kê các yêu cầu thanh toán (YCTT)/bút toán đã lập; cho phép tra cứu theo nhiều tiêu chí và truy cập các thao tác Xem/Sửa/Xoá/Sao chép/Gửi kiểm soát/Phê duyệt/Xuất/In.

### B2.1. Khu vực bộ lọc tìm kiếm

| Trường               | Trường (ENG)         | Loại                                            | Bắt buộc | Giá trị mặc định         | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                   |
| -------------------- | -------------------- | ----------------------------------------------- | -------- | ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Kênh                 | CHANNEL              | Dropdown                                        | N        | Tất cả                   | String       | Danh mục `LOV.01.Channel`: Liên ngân hàng / Thanh toán song phương / Liên kho bạc / Tất cả.                                         |
| Loại lệnh            | ORDER_TYPE           | Dropdown                                        | N        | Tất cả                   | String       | Danh mục `LOV.01.Channel_Type` động theo Kênh; mặc định Tất cả.                                                                     |
| Loại giao dịch (LNH) | LNH_TRANSACTION_TYPE | Dropdown                                        | N        | Tất cả                   | String       | Chỉ hiển thị khi Kênh = Liên ngân hàng. Danh mục `LOV.06.Payment_Type_Code`.                                                        |
| Số YCTT/Số bút toán  | REF_NO               | TextBox                                         | N        |                          | String       | Hỗ trợ tìm chính xác hoặc bắt đầu bằng.                                                                                             |
| Số chứng từ gốc      | ORIGIN_NUM           | TextBox                                         | N        |                          | String       | Tìm chính xác/bắt đầu bằng.                                                                                                         |
| Trạng thái           | F-STATUS             | Dropdown (multi-select)                         | N        | Tất cả trạng thái hợp lệ | String       | DRAFT, READY_FOR_APPROVAL, PENDING_APPROVER, APPROVED, RETURNED_TO_MAKER, REJECTED, DELETED. Mặc định ẩn DELETED trừ khi tick chọn. |
| NH/KB chuyển         | SENDER               | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.BANK`   | N        | Mã đơn vị user đăng nhập | String       | F4 để tra cứu danh mục NH/KB.                                                                                                       |
| NH/KB nhận           | RECEIVER             | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.BANK`   | N        |                          | String       | F4 để tra cứu.                                                                                                                      |
| Tài khoản chuyển     | SENDER_GL_SEGMENT2   | Dropbox + Lookup                                | N        |                          | Number       | Lọc theo TK tự nhiên người chuyển.                                                                                                  |
| Tài khoản nhận       | RECEIVER_GL_SEGMENT2 | Dropbox + Lookup                                | N        |                          | Number       | Lọc theo TK tự nhiên người nhận.                                                                                                    |
| Từ ngày              | FROM_DATE            | Date Picker                                     | Y        | Ngày hiện tại − 7        | Date         | Khoảng thời gian "Ngày lập" hoặc "Ngày thanh toán" (chọn 1 trong `DATE_FIELD`).                                                     |
| Đến ngày             | TO_DATE              | Date Picker                                     | Y        | Ngày hiện tại            | Date         | Phải ≥ Từ ngày; khoảng cách ≤ 90 ngày (cảnh báo nếu vượt).                                                                          |
| Loại ngày lọc        | DATE_FIELD           | Dropdown                                        | Y        | Ngày lập                 | String       | Danh mục: Ngày lập / Ngày thanh toán / Ngày kiểm soát / Ngày phê duyệt.                                                             |
| Số tiền từ           | AMOUNT_FROM          | Number Field                                    | N        |                          | Number       | Định dạng nhóm hàng nghìn.                                                                                                          |
| Số tiền đến          | AMOUNT_TO            | Number Field                                    | N        |                          | Number       | ≥ Số tiền từ.                                                                                                                       |
| Loại tiền            | CURRENCY_CODE        | Dropdown                                        | N        | Tất cả                   | String       | Danh mục `LOV.04.Currency_Code`.                                                                                                    |
| Người lập            | CREATED_BY           | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.USER`   | N        |                          | String       | Hỗ trợ tra cứu user nội bộ.                                                                                                         |
| Người kiểm soát      | CHECKED_BY           | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.USER`   | N        |                          | String       |                                                                                                                                     |
| Người phê duyệt      | APPROVED_BY          | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.USER`   | N        |                          | String       |                                                                                                                                     |
| DVQHNS               | GL_SEGMENT3          | Dropbox + Lookup `PAY.OUT.MANUAL.LOOKUP.DVQHNS` | N        |                          | Varchar(7)   | Lọc theo DVQHNS phát sinh trong dòng chi tiết.                                                                                      |

### B2.2. Khu vực kết quả (grid)

| STT | Trường              | Trường (ENG)         | Loại hiển thị                   | Sắp xếp | Mô tả / Ràng buộc                                                                                                                |
| --- | ------------------- | -------------------- | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Số YCTT/Số bút toán | REF_NO               | Link (mở `PAY.OUT.MANUAL.VIEW`) | ✓       | Click mở chi tiết giao dịch.                                                                                                     |
| 2   | Kênh                | CHANNEL              | Text                            | ✓       |                                                                                                                                  |
| 3   | Loại lệnh           | ORDER_TYPE           | Text                            | ✓       |                                                                                                                                  |
| 4   | Loại GD (LNH)       | LNH_TRANSACTION_TYPE | Text                            | –       | Chỉ hiển thị giá trị khi Kênh = LNH.                                                                                             |
| 5   | Ngày lập            | CREATED_DATE         | Text (`dd/mm/yyyy hh:MM`)       | ✓       |                                                                                                                                  |
| 6   | Ngày thanh toán     | PAYMENT_DATE         | Text (`dd/mm/yyyy`)             | ✓       |                                                                                                                                  |
| 7   | NH/KB chuyển        | SENDER               | Text                            | ✓       |                                                                                                                                  |
| 8   | NH/KB nhận          | RECEIVER             | Text                            | ✓       |                                                                                                                                  |
| 9   | Tên người chuyển    | SENDER_NAME          | Text                            | –       | Truncate, tooltip full.                                                                                                          |
| 10  | Tên người nhận      | RECEIVER_NAME        | Text                            | –       | Truncate, tooltip full.                                                                                                          |
| 11  | Số tiền chuyển      | AMOUNT               | Number (right-align, 2 dec)     | ✓       |                                                                                                                                  |
| 12  | Loại tiền           | CURRENCY_CODE        | Text (center)                   | –       |                                                                                                                                  |
| 13  | Nội dung TT         | DESCRIPTION          | Text                            | –       | Truncate ≥ 60 ký tự, tooltip full.                                                                                               |
| 14  | Trạng thái          | F-STATUS             | Badge (màu theo trạng thái)     | ✓       | Xanh: APPROVED; Vàng: PENDING_APPROVER/READY_FOR_APPROVAL; Xám: DRAFT; Đỏ: REJECTED; Cam: RETURNED_TO_MAKER.                     |
| 15  | Người lập           | CREATED_BY           | Text                            | ✓       |                                                                                                                                  |
| 16  | Người kiểm soát     | CHECKED_BY           | Text                            | ✓       |                                                                                                                                  |
| 17  | Người phê duyệt     | APPROVED_BY          | Text                            | ✓       |                                                                                                                                  |
| 18  | F-VER               | F-VER                | Text                            | –       | Số phiên bản.                                                                                                                    |
| 19  | Thao tác            | ACTIONS              | Icon group                      | –       | Tổ hợp nút theo VAL-13/VAL-14: Xem (F3), Sửa (F2), Xoá (Delete), Sao chép (Ctrl+Shift+C), Gửi kiểm soát (F9), Phê duyệt (F8/F9). |

### B2.3. Khu vực thanh công cụ và footer

| Trường       | Mô tả                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Số bản ghi   | Tổng số bản ghi khớp bộ lọc.                                                                     |
| Tổng số tiền | Tổng `AMOUNT` (theo từng loại tiền) của các bản ghi khớp bộ lọc — chỉ tính trạng thái ≠ DELETED. |
| Phân trang   | 20 / 50 / 100 / 200 bản ghi/trang; mặc định 20.                                                  |
| Sắp xếp      | Mặc định `CREATED_DATE` DESC.                                                                    |
| Lưu bộ lọc   | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope).                                                |

---

## B3. Đặc tả trường cho các màn hình bổ sung

### B3.1. Màn hình `PAY.OUT.MANUAL.DELETE`

> Popup xác nhận xoá mềm bản ghi YCTT/bút toán ở trạng thái cho phép xoá (DRAFT, RETURNED_TO_MAKER).

| Trường              | Trường (ENG)     | Loại     | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                              |
| ------------------- | ---------------- | -------- | -------- | ------------------ | ------------ | ---------------------------------------------- |
| Số YCTT/Số bút toán | REF_NO           | Label    | –        | Tự lấy từ bản ghi  | String       | Read-only.                                     |
| Loại lệnh           | ORDER_TYPE       | Label    | –        | Tự lấy             | String       | Read-only.                                     |
| Số tiền chuyển      | AMOUNT           | Label    | –        | Tự lấy             | Number       | Hiển thị có nhóm hàng nghìn + loại tiền.       |
| Trạng thái hiện tại | F-STATUS         | Label    | –        | Tự lấy             | String       | Phải ∈ {DRAFT, RETURNED_TO_MAKER} (VAL-13).    |
| Lý do xoá           | DELETE_REASON    | TextArea | Y        |                    | String       | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16). |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y        | Off                | Boolean      | Phải tick mới enable nút "Xác nhận xoá".       |
| Người xoá           | DELETED_BY       | Label    | –        | User hiện tại      | String       | Auto.                                          |
| Thời gian xoá       | DELETED_DATE     | Label    | –        | Thời gian hệ thống | DateTime     | Auto, hiển thị `dd/mm/yyyy hh:MM:ss`.          |

### B3.2. Màn hình `PAY.OUT.MANUAL.DETAIL.GRID`

> Lưới chi tiết khoản mục (hiển thị/sửa nhiều dòng chi tiết COA) — popup hoặc inline trong `PAY.OUT.MANUAL.NEW`/`PAY.OUT.MANUAL.EDIT`.

| Trường      | Trường (ENG)     | Loại             | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                     |
| ----------- | ---------------- | ---------------- | -------- | ---------------- | ------------ | ----------------------------------------------------- |
| STT         | LINE_NO          | Label            | –        | Tự tăng          | Number       | Auto, không cho sửa.                                  |
| Mã quỹ      | GL_SEGMENT1      | Dropbox + Lookup | N        | 01               | Varchar(2)   | Tuân theo CCID.                                       |
| TK tự nhiên | GL_SEGMENT2      | TextBox + Lookup | Y        |                  | Varchar(4)   | Tuân theo CCID.                                       |
| DVQHNS      | GL_SEGMENT3      | Dropbox + Lookup | Y        |                  | Varchar(7)   | Tuân theo CCID.                                       |
| Cấp NS      | GL_SEGMENT4      | Dropdown         | C        |                  | Varchar      | Tuân theo CCID.                                       |
| Chương      | GL_SEGMENT5      | Dropbox + Lookup | C        | 000              | Varchar(3)   |                                                       |
| Ngành KT    | GL_SEGMENT6      | Dropbox + Lookup | C        | 000              | Varchar(3)   |                                                       |
| NDKT        | GL_SEGMENT7      | Dropbox + Lookup | C        | 0000             | Varchar(4)   |                                                       |
| ĐB          | GL_SEGMENT8      | Dropbox + Lookup | C        | 00000            | Varchar(5)   |                                                       |
| CTMT        | GL_SEGMENT9      | Dropbox + Lookup | C        | 00000            | Varchar(5)   |                                                       |
| MN          | GL_SEGMENT10     | Dropbox + Lookup | C        | 00               | Varchar(2)   |                                                       |
| Kho bạc     | GL_SEGMENT11     | Dropbox + Lookup | C        | 0000             | Varchar(4)   |                                                       |
| DP          | GL_SEGMENT12     | Dropbox + Lookup | C        | 00               | Varchar(3)   |                                                       |
| Diễn giải   | LINE_DESCRIPTION | TextArea         | Y        |                  | String       | Diễn giải dòng chi tiết.                              |
| Số tiền     | LINE_AMOUNT      | Number Field     | Y        |                  | Number       | Tổng `LINE_AMOUNT` = `AMOUNT` tab Thông tin chung.    |
| Thao tác    | ACTIONS          | Icon group       | –        |                  | –            | Thêm dòng / Xoá dòng / Sao chép dòng / Sửa CCID dòng. |

**Footer:** Hiển thị "Tổng số dòng", "Tổng số tiền dòng" và so khớp với "Số tiền chuyển" — chênh lệch sẽ hiển thị MSG-WRN-AMOUNT-MISMATCH.

### B3.3. Màn hình `PAY.OUT.MANUAL.ATTACH`

> Quản lý tài liệu đính kèm cho bản ghi.

| Trường        | Trường (ENG)  | Loại        | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                                                              |
| ------------- | ------------- | ----------- | -------- | ------------------ | ------------ | ------------------------------------------------------------------------------ |
| Tên file      | FILE_NAME     | Label       | –        |                    | String       | Lấy từ tên gốc upload.                                                         |
| Loại tài liệu | DOC_TYPE      | Dropdown    | Y        |                    | String       | Danh mục: Chứng từ gốc / Hợp đồng / Hoá đơn / Bảng kê / Văn bản khác.          |
| Mô tả         | NOTE          | TextArea    | N        |                    | String       | ≤ 250 ký tự.                                                                   |
| File upload   | FILE_BLOB     | File Upload | Y        |                    | Binary       | ≤ 10MB/file; định dạng: pdf/jpg/png/docx/xlsx; check MIME + magic byte.        |
| Kích thước    | FILE_SIZE     | Label       | –        | Tự tính            | Number       | Hiển thị KB/MB.                                                                |
| Hash          | FILE_HASH     | Label       | –        | Tự tính            | String       | SHA-256, dùng để chống trùng & toàn vẹn.                                       |
| Người upload  | UPLOADED_BY   | Label       | –        | User hiện tại      | String       | Auto.                                                                          |
| Ngày upload   | UPLOADED_DATE | Label       | –        | Thời gian hệ thống | DateTime     | Auto.                                                                          |
| Trạng thái    | ATTACH_STATUS | Label       | –        |                    | String       | Active/DELETED (soft-delete).                                                  |
| Thao tác      | ACTIONS       | Icon group  | –        |                    | –            | Tải xuống (Ctrl+J) / Xem trước / Xoá (Shift+Delete) — theo quyền và VAL-13/14. |

**Footer:** "Tổng số file: N", "Tổng dung lượng: X MB" (giới hạn tổng ≤ 50MB/bản ghi).

### B3.4. Màn hình `PAY.OUT.MANUAL.HISTORY`

> Lịch sử thay đổi của bản ghi (chế độ chỉ đọc).

| Trường              | Trường (ENG)      | Loại  | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                      |
| ------------------- | ----------------- | ----- | -------- | ---------------- | ------------ | -------------------------------------- |
| STT                 | SEQ_NO            | Label | –        | Tự tăng          | Number       |                                        |
| Người tạo           | CREATED_BY        | Label | –        |                  | String       | Username + Họ tên + Vai trò.           |
| Ngày tạo            | CREATED_DATE      | Label | –        |                  | Datetime     | Thời điểm tạo giao dịch.               |
| Người cập nhật cuối | LAST_UPDATED_BY   | Label | –        |                  | String       | Username + Họ tên + Vai trò.           |
| Ngày cập nhật cuối  | LAST_UPDATED_DATE | Label | –        |                  | Datetime     | Thời điểm cập nhật giao dịch gần nhất. |

### B3.5. Màn hình `PAY.OUT.MANUAL.LOOKUP`

> Popup tra cứu danh mục dùng chung (mỗi danh mục có 1 màn hình `PAY.OUT.MANUAL.LOOKUP.<TYPE>`: BANK, USER, DVQHNS, CURRENCY, COA, …).

**Khu vực bộ lọc:**

| Trường       | Trường (ENG)  | Loại     | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                         |
| ------------ | ------------- | -------- | -------- | ---------------- | ------------ | ------------------------------------------------------------------------- |
| Mã           | CODE          | TextBox  | N        |                  | String       | Tìm chính xác / chứa / bắt đầu bằng (radio).                              |
| Tên          | NAME          | TextBox  | N        |                  | String       | Tìm chứa, không phân biệt hoa thường, hỗ trợ tiếng Việt có dấu/không dấu. |
| Nhóm/Phạm vi | GROUP         | Dropdown | N        |                  | String       | Tuỳ danh mục (ví dụ nhóm NH thành viên, NH đại lý…).                      |
| Trạng thái   | ACTIVE_STATUS | Dropdown | N        | Đang hoạt động   | String       | Active/Inactive/All.                                                      |

**Khu vực kết quả:**

| STT | Trường                 | Trường (ENG)  | Loại hiển thị | Mô tả                                                         |
| --- | ---------------------- | ------------- | ------------- | ------------------------------------------------------------- |
| 1   | Mã                     | CODE          | Text          | Click để chọn (single-select) hoặc checkbox (multi-select).   |
| 2   | Tên                    | NAME          | Text          |                                                               |
| 3   | Tên viết tắt           | SHORT_NAME    | Text          |                                                               |
| 4   | Diễn giải              | DESCRIPTION   | Text          | Truncate, tooltip full.                                       |
| 5   | Trạng thái             | ACTIVE_STATUS | Badge         | Active = xanh, Inactive = xám.                                |
| 6   | Cột phụ thuộc danh mục | –             | Text          | Ví dụ: với BANK có "Mã NH trực tiếp", với DVQHNS có "Cấp NS"… |
| 7   | Thao tác               | ACTIONS       | Button        | "Chọn" / "Xem chi tiết".                                      |

**Footer:** Phân trang 10/20/50; nút "Chọn"/"Huỷ"; phím tắt `Enter` chọn dòng đang focus, `Esc` đóng.

### B3.6. Màn hình `PAY.OUT.MANUAL.PRINT`

> Cấu hình + xem trước trước khi in chứng từ giao dịch.

| Trường          | Trường (ENG)        | Loại         | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                                              |
| --------------- | ------------------- | ------------ | -------- | ------------------ | ------------ | -------------------------------------------------------------- |
| Mẫu in          | TEMPLATE_CODE       | Dropdown     | Y        | Mẫu chuẩn          | String       | Danh mục: Mẫu chuẩn / Mẫu rút gọn / Mẫu LNH / Mẫu TTSP…        |
| Khổ giấy        | PAPER_SIZE          | Dropdown     | Y        | A4                 | String       | A4 / A5 / Letter.                                              |
| Hướng giấy      | ORIENTATION         | Radio        | Y        | Portrait           | String       | Portrait / Landscape.                                          |
| Số bản          | COPIES              | Number Field | Y        | 1                  | Integer      | 1–10.                                                          |
| Loại bản        | PRINT_TYPE          | Radio        | Y        | Bản chính          | String       | Bản nháp / Bản chính / Bản sao. Bản nháp có watermark "DRAFT". |
| Watermark       | WATERMARK_TEXT      | TextBox      | N        |                    | String       | Chỉ enable nếu PRINT_TYPE = Bản nháp/Bản sao; ≤ 30 ký tự.      |
| In kèm đính kèm | INCLUDE_ATTACHMENTS | Checkbox     | N        | Off                | Boolean      | Nếu tick → đính kèm các file PDF/ảnh (chuyển ảnh sang PDF).    |
| In kèm lịch sử  | INCLUDE_HISTORY     | Checkbox     | N        | Off                | Boolean      | Nếu tick → in phần "Lịch sử phê duyệt" cuối chứng từ.          |
| Ngôn ngữ in     | LANGUAGE            | Dropdown     | Y        | Tiếng Việt         | String       | Tiếng Việt / Tiếng Anh.                                        |
| Vùng xem trước  | PREVIEW             | PDF Viewer   | –        | Tự sinh            | Binary       | Render PDF tạm; chỉ phép tải/in sau khi xác nhận.              |
| Người in        | PRINTED_BY          | Label        | –        | User hiện tại      | String       | Auto, ghi audit khi bấm "In".                                  |
| Thời gian in    | PRINTED_DATE        | Label        | –        | Thời gian hệ thống | DateTime     | Auto.                                                          |

### B3.7. Màn hình `PAY.OUT.MANUAL.EXPORT`

> Cấu hình + thực hiện xuất dữ liệu danh sách giao dịch.

| Trường                | Trường (ENG)    | Loại           | Bắt buộc | Giá trị mặc định                      | Loại dữ liệu | Mô tả / Ràng buộc                                                        |
| --------------------- | --------------- | -------------- | -------- | ------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| Định dạng             | EXPORT_FORMAT   | Radio          | Y        | XLSX                                  | String       | XLSX / CSV / PDF.                                                        |
| Phạm vi               | EXPORT_SCOPE    | Radio          | Y        | Toàn bộ kết quả lọc                   | String       | Trang hiện tại / Toàn bộ kết quả lọc / Theo lựa chọn.                    |
| Trường xuất           | EXPORT_FIELDS   | Checkbox list  | Y        | Mặc định 10 trường chính              | String[]     | Cho phép chọn/bỏ chọn từng cột; lưu preset cá nhân.                      |
| Sắp xếp theo          | SORT_BY         | Dropdown       | N        | Theo grid hiện tại                    | String       | Có thể override sắp xếp.                                                 |
| Bộ lọc kế thừa        | INHERIT_FILTER  | Checkbox       | Y        | On                                    | Boolean      | Tick → dùng bộ lọc đang áp dụng tại `PAY.OUT.MANUAL.LIST`.               |
| Bao gồm dòng chi tiết | INCLUDE_DETAIL  | Checkbox       | N        | Off                                   | Boolean      | Nếu tick → mỗi YCTT trải thêm các dòng `PAY.OUT.MANUAL.DETAIL.GRID`.     |
| Bao gồm tổng cộng     | INCLUDE_SUMMARY | Checkbox       | N        | On                                    | Boolean      | Thêm dòng tổng số tiền theo từng loại tiền cuối file.                    |
| Mã hoá file           | ENCRYPT_FILE    | Checkbox       | N        | Off                                   | Boolean      | Nếu tick → mã hoá file bằng mật khẩu.                                    |
| Mật khẩu              | EXPORT_PASSWORD | Password Field | C        |                                       | String       | Bắt buộc nếu ENCRYPT_FILE = On; ≥ 8 ký tự, có chữ + số + ký tự đặc biệt. |
| Tên file              | FILE_NAME       | TextBox        | Y        | `PAY.OUT.MANUAL_LIST_<yyyyMMdd_HHmm>` | String       | Cho sửa, chỉ chấp nhận `[A-Za-z0-9_\-]`.                                 |
| Watermark (PDF)       | WATERMARK_TEXT  | TextBox        | C        |                                       | String       | Chỉ hiển thị khi EXPORT_FORMAT = PDF.                                    |
| Ngôn ngữ tiêu đề cột  | LANGUAGE        | Dropdown       | Y        | Tiếng Việt                            | String       | Tiếng Việt / Tiếng Anh.                                                  |
| Người xuất            | EXPORTED_BY     | Label          | –        | User hiện tại                         | String       | Auto, ghi audit `PAY.OUT.MANUAL.LIST.EXPORT`.                            |
| Thời gian xuất        | EXPORTED_DATE   | Label          | –        | Thời gian hệ thống                    | DateTime     | Auto.                                                                    |

**Ràng buộc chung:**

- Số bản ghi vượt 50,000 → bắt buộc chạy async, trả notification khi xong.
- File xuất không chứa cột nhạy cảm (CMND/CCCD đầy đủ) trừ khi có quyền `EXPORT_PII`.
- Log chi tiết tham số xuất + hash file vào audit (BIZ-007).

---

## B4. Quy ước chung về đặc tả trường

| STT | Quy ước                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mọi trường tiền tệ hiển thị có nhóm hàng nghìn (`#,##0.00`); căn phải; tổng tiền hiển thị theo từng loại tiền.                      |
| 2   | Mọi trường ngày hiển thị theo `dd/mm/yyyy`; ngày giờ `dd/mm/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh.                        |
| 3   | Mọi trường COA (GL_SEGMENT\*) sử dụng cùng popup Lookup `PAY.OUT.MANUAL.LOOKUP.COA` và phải tuân theo Cross-Validation Rule (CCID). |
| 4   | Mọi trường Lookup có icon kính lúp + phím tắt `F4`.                                                                                 |
| 5   | Mọi trường bắt buộc đánh dấu sao đỏ (`*`); trường bắt buộc có điều kiện đánh dấu `(*)`.                                             |
| 6   | Khi field bị disable phải có tooltip giải thích; field lỗi validate hiển thị viền đỏ + thông báo lỗi nằm dưới ô nhập.               |
| 7   | Mọi `TextArea` chống XSS bằng sanitize/escape; mọi input chống SQL Injection bằng prepared statement.                               |
| 8   | Trường nhạy cảm (CMND/CCCD, số tài khoản) masking theo policy: chỉ hiển thị 4 ký tự cuối với vai trò không có quyền `VIEW_PII`.     |
| 9   | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload.                                             |
| 10  | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F8`, `F9`, …) đồng bộ với `spec_button.md`.                                          |

#################################

# C - Đặc tả nút chức năng

## C1 - Chi tiết đặc tả nút chức năng

> Tổng hợp các nút thao tác trên các màn hình của chức năng `PAY.OUT.MANUAL`. Mã sự kiện tham chiếu §A10 và §A11.

| STT | Tên nút                 | Tên nút (ENG)        | Mã sự kiện / Event ID                                      | ĐK kích hoạt               | Phím tắt              | Mô tả                                                                                                 | Ghi chú                                                                  |
| --- | ----------------------- | -------------------- | ---------------------------------------------------------- | -------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Tạo mới                 | New                  | `PAY.OUT.MANUAL.NEW.OPEN`                                  | On click                   | `Ctrl+N`              | (1) Mở form Thêm mới trống                                                                            | Trên `PAY.OUT.MANUAL.LIST`; chỉ enable với Maker                         |
| 2   | Lưu                     | Save                 | `PAY.OUT.MANUAL.NEW.SAVE`                                  | On click                   | `Ctrl+S`              | (1) Validate đầy đủ các quy tắc kiểm tra dữ liệu                                                      | Trên `PAY.OUT.MANUAL.NEW`; bind phím tắt `Ctrl+S`                        |
| 3   | Lưu nháp                | Save Draft           | `PAY.OUT.MANUAL.NEW.SAVE`                                  | On click                   | `Ctrl+Shift+S`        | (1) Bỏ qua validate đầy đủ, (2) Chỉ validate định dạng, (3) Lưu DRAFT                                 | Cùng event với "Lưu"; giúp Maker lưu giữa chừng                          |
| 4   | Gửi kiểm soát           | Submit               | `PAY.OUT.MANUAL.NEW.SUBMIT`                                | On click                   | `Ctrl+Enter` / `F9`   | (1) Validate đầy đủ, (2) Chuyển DRAFT/RETURNED_TO_MAKER → READY_FOR_APPROVAL, (3) Notify Checker      | Trên `PAY.OUT.MANUAL.LIST` (row action), `.NEW`, `.EDIT`; chỉ Maker      |
| 5   | Xem                     | View                 | `PAY.OUT.MANUAL.VIEW.OPEN`                                 | On click row / link REF_NO | `F3`                  | Mở form read-only; hiển thị đầy đủ trường + Đính kèm + Lịch sử + Trạng thái phê duyệt                 | Trên `PAY.OUT.MANUAL.LIST`                                               |
| 6   | Sửa                     | Edit                 | `PAY.OUT.MANUAL.EDIT.OPEN`                                 | On click                   | `F2`                  | (1) Mở form editable, (2) Load F-VER hiện hành                                                        | Chỉ enable khi F-STATUS ∈ {DRAFT, RETURNED_TO_MAKER} và NSD là Maker gốc |
| 7   | Lưu (Sửa)               | Save (Edit)          | `PAY.OUT.MANUAL.EDIT.SAVE`                                 | On click                   | `Ctrl+S`              | (1) Cập nhật F-VER+1, (2) Ghi audit oldValue→newValue                                                 | Trên `PAY.OUT.MANUAL.EDIT`                                               |
| 8   | Xoá                     | Delete               | `PAY.OUT.MANUAL.DELETE.OPEN`                               | On click                   | `Delete`              | (1) Mở popup `PAY.OUT.MANUAL.DELETE` nhập Lý do ≥ 10 ký tự + checkbox                                 | Chỉ enable khi F-STATUS ∈ {DRAFT, RETURNED_TO_MAKER} và là Maker gốc     |
| 9   | Xác nhận xoá            | Confirm Delete       | `PAY.OUT.MANUAL.DELETE.CONFIRM`                            | On click                   | `Enter` (trong popup) | (1) Soft-delete F-STATUS=DELETED, (2) Ghi audit log                                                   | Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox                      |
| 10  | Huỷ                     | Cancel               | `PAY.OUT.MANUAL.NEW.CANCEL` / `PAY.OUT.MANUAL.EDIT.CANCEL` | On click                   | `Esc`                 | (1) Nếu form đã nhập → hỏi xác nhận, (2) Xác nhận → đóng form, huỷ thay đổi                           |                                                                          |
| 11  | Sao chép                | Copy                 | `PAY.OUT.MANUAL.NEW.COPY`                                  | On click                   | `Ctrl+Shift+C`        | (1) Mở form Thêm mới với dữ liệu sao chép, (2) Sinh F-ID mới, (3) F-STATUS=DRAFT                      | Trên `PAY.OUT.MANUAL.LIST` (row action)                                  |
| 12  | Đặt lại                 | Reset                | `PAY.OUT.MANUAL.LIST.FILTER`                               | On click                   | `F5` / `Ctrl+R`       | Xoá bộ lọc về mặc định; tải lại danh sách                                                             | Trên `PAY.OUT.MANUAL.LIST`                                               |
| 13  | Xuất                    | Export               | `PAY.OUT.MANUAL.LIST.EXPORT`                               | On click                   | `Ctrl+Shift+E`        | Xuất Excel/PDF/CSV                                                                                    | Trên `PAY.OUT.MANUAL.LIST` và `.EXPORT`                                  |
| 14  | In phiếu                | Print                | `PAY.OUT.MANUAL.PRINT.PREVIEW`                             | On click                   | `Ctrl+P`              | (1) Sinh PDF preview, (2) Mở `PAY.OUT.MANUAL.PRINT`                                                   | Trên `.NEW`, `.EDIT`, `.VIEW` (tab Thông tin chung)                      |
| 15  | Đính kèm                | Upload               | `PAY.OUT.MANUAL.ATTACH.UPLOAD`                             | On click → On select file  | `Ctrl+U`              | (1) Mở popup `.ATTACH`, (2) Chọn file, (3) Validate ≤ 10MB, định dạng pdf/jpg/png/docx, (4) Upload    | Trên `.NEW`, `.EDIT`                                                     |
| 16  | Xoá đính kèm            | Remove Attachment    | `PAY.OUT.MANUAL.ATTACH.DELETE`                             | On click                   | `Shift+Delete`        | (1) Xoá file đính kèm, (2) Ghi audit, (3) Hỏi xác nhận                                                | Chỉ Maker gốc + trạng thái cho phép Sửa                                  |
| 17  | Tải file đính kèm       | Download Attachment  | `PAY.OUT.MANUAL.ATTACH.DOWNLOAD`                           | On click                   | `Ctrl+J`              | Tải file được chọn xuống thư mục chỉ định                                                             | Trên `.ATTACH`, `.NEW`/`.EDIT`/`.VIEW` (tab Đính kèm)                    |
| 18  | Mở Lịch sử              | Open History         | `PAY.OUT.MANUAL.VIEW.HISTORY`                              | On click tab               | `Alt+H`               | Mở tab Lịch sử giao dịch                                                                              | Trên `.NEW`, `.EDIT`, `.VIEW`                                            |
| 19  | Mở Trạng thái phê duyệt | Open Approval Status | `PAY.OUT.MANUAL.VIEW.APPROVAL`                             | On click tab               | `Alt+P`               | (1) Mở tab Trạng thái phê duyệt, (2) Workflow Maker → Checker → Approver, (3) Highlight bước hiện tại | Trên `.NEW`, `.EDIT`, `.VIEW`                                            |
| 20  | Tra cứu danh mục        | Lookup               | (Mở popup `PAY.OUT.MANUAL.LOOKUP.*`)                       | On click icon kính lúp     | `F4`                  | (1) Mở popup tra cứu danh mục, (2) Chọn giá trị → trả về form                                         | Đi kèm Combobox/Picker                                                   |

## C2 - Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mỗi nút phải kiểm tra quyền theo vai trò (Maker/Checker/Approver/Viewer) trước khi hiển thị; thiếu quyền → ẩn nút (hoặc disable + tooltip MSG-ERR-PERMISSION)                    |
| 2   | Nút Sửa/Xoá: chỉ enable khi F-STATUS ∈ {DRAFT, RETURNED_TO_MAKER} (VAL-13) **và** NSD là Maker gốc (VAL-14); vi phạm trạng thái → MSG-ERR-STATUS; vi phạm sở hữu → MSG-ERR-MAKER |
| 3   | Nút Phê duyệt/Trả lại/Từ chối: chỉ hiển thị trên `PAY.OUT.MANUAL.APPROVE` cho user có thẩm quyền tương ứng; SoD bắt buộc (BIZ-001)                                               |
| 4   | Nút Submit/Lưu: disable khi form chứa lỗi validate cứng; enable lại khi tất cả lỗi đã được fix                                                                                   |
| 5   | Nút Xác nhận xoá: disable cho đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16)                                                                                               |
| 6   | Nút Phê duyệt/Submit cho GD trọng yếu (vượt hạn mức / loại ưu tiên cao): bổ sung bước nhập OTP hoặc ký số trước khi commit                                                       |
| 7   | Mỗi lần bấm nút thành công: ghi audit (`PAY.OUT.MANUAL.AUDIT.WRITE`) gồm user, timestamp, IP, action, oldValue→newValue (BIZ-007)                                                |
| 8   | Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server                                                                                       |
| 9   | Khi phiên hết hạn (`PAY.OUT.MANUAL.SESSION.TIMEOUT`) → mọi nút chuyển disable, hiển thị MSG-ERR-SESSION, redirect đăng nhập                                                      |
| 10  | Mọi nút hiển thị tooltip giải thích khi disable; hỗ trợ accessibility (ARIA label, phím tắt)                                                                                     |
| 11  | Phím tắt phải hiển thị trong tooltip (ví dụ "Lưu (Ctrl+S)") và đăng ký toàn cục; tránh xung đột với phím tắt trình duyệt (vd `Ctrl+N` → `preventDefault` khi focus trong form)   |
| 12  | Phím tắt nhóm phê duyệt (`F8`, `F9`, `Alt+B`, `Alt+J`) chỉ active trên `PAY.OUT.MANUAL.APPROVE`; `F2`, `F3`, `Delete` chỉ active khi có dòng được chọn trên `.LIST`              |
| 13  | Hỗ trợ `Tab`/`Shift+Tab` để di chuyển focus; `Enter` kích hoạt nút có focus; cung cấp `Alt+/` để mở bảng tra cứu phím tắt                                                        |

## C3 - Quy ước phím tắt

- **Nhóm soạn thảo (Maker)**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Ctrl+Shift+S` (Lưu nháp), `Ctrl+Enter`/`F9` (Gửi kiểm soát), `Esc` (Huỷ), `Ctrl+Shift+C` (Sao chép).
- **Nhóm thao tác bản ghi (LIST)**: `F2` (Sửa), `F3` (Xem), `Delete` (Xoá), `F5`/`Ctrl+R` (Đặt lại bộ lọc), `Ctrl+Shift+E` (Xuất), `Ctrl+P` (In).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup).
- **Nhóm kiểm soát/phê duyệt**: `F8` (Kiểm soát), `F9` (Phê duyệt), `Alt+B` (Trả lại), `Alt+J` (Từ chối).
- **Nhóm đính kèm**: `Ctrl+U` (Upload), `Ctrl+J` (Download), `Shift+Delete` (Remove).
- **Nhóm điều hướng tab trong `PAY.OUT.MANUAL.VIEW`**: `Alt+H` (Lịch sử), `Alt+P` (Trạng thái phê duyệt).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

##########################

# D - Testcase: PAY.OUT.MANUAL

> **Cấu trúc mã TC:** `PAY.OUT.MANUAL.TC.<Nhóm>.<Số thứ tự>`
>
> **Nhóm:** 1 = Tạo mới, 2 = Xem, 3 = Cập nhật, 4 = Xoá
>
> **Loại UC:** Positive = luồng thành công; Negative = luồng lỗi/ngoại lệ

---

## D1 - Nhóm 1 — Tạo mới

| Mã TC                  | Tên Testcase                                                            | Loại UC  | Given                                                         | When                                                                                                                         | Then                                                                                   | Tham chiếu                      |
| ---------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| PAY.OUT.MANUAL.TC.1.01 | Tạo chứng từ thành công                                                 | Positive | Maker đã đăng nhập; có quyền tạo chứng từ; kỳ kế toán đang mở | Nhập đầy đủ: REF_NO, PAYMENT_DATE, RECEIVER, AMOUNT, CURRENCY_CODE, DESCRIPTION; nhập ≥ 1 dòng khoản mục hợp lệ; bấm **Lưu** | Hệ thống lưu DRAFT thành công; hiển thị MSG-OK-SAVE; CREATED_BY/CREATED_DATE tự điền   | VAL-01, VAL-07, BIZ-007         |
| PAY.OUT.MANUAL.TC.1.02 | Tạo chứng từ không thành công — Không có quyền                          | Negative | User không có vai trò Maker                                   | Truy cập màn hình Tạo mới                                                                                                    | Nút **Tạo mới** bị ẩn hoặc disable; hiển thị MSG-ERR-PERMISSION nếu truy cập trực tiếp | BIZ-001, VAL-01                 |
| PAY.OUT.MANUAL.TC.1.03 | Tạo chứng từ không thành công — Trường bắt buộc bỏ trống khi Submit     | Negative | Maker đã đăng nhập                                            | Để trống REF_NO; bấm **Gửi kiểm soát**                                                                                       | Highlight đỏ trường REF_NO; hiển thị MSG-ERR-REQUIRED; chặn submit                     | VAL-01                          |
| PAY.OUT.MANUAL.TC.1.04 | Tạo chứng từ không thành công — PAYMENT_DATE sai định dạng              | Negative | Maker đã đăng nhập                                            | Nhập PAYMENT_DATE = "32/13/2025"; bấm **Lưu**                                                                                | Hiển thị MSG-ERR-FORMAT cho PAYMENT_DATE; chặn lưu                                     | VAL-02                          |
| PAY.OUT.MANUAL.TC.1.05 | Tạo chứng từ không thành công — PAYMENT_DATE ngoài kỳ kế toán           | Negative | Kỳ kế toán hiện tại là tháng 05/2026                          | Nhập PAYMENT_DATE = 01/01/2024 (kỳ đã đóng); bấm **Gửi kiểm soát**                                                           | Hiển thị MSG-ERR-RANGE: ngày chi ngoài kỳ kế toán đang mở; chặn submit                 | VAL-08                          |
| PAY.OUT.MANUAL.TC.1.06 | Tạo chứng từ không thành công — REF_NO trùng trong kỳ                   | Negative | Đã tồn tại chứng từ REF_NO="CT001" trong kỳ                   | Nhập REF_NO="CT001"; bấm **Gửi kiểm soát**                                                                                   | Hiển thị MSG-ERR-DUPLICATE; chặn submit                                                | VAL-11                          |
| PAY.OUT.MANUAL.TC.1.07 | Tạo chứng từ không thành công — Tổng khoản mục không khớp AMOUNT header | Negative | Maker đã đăng nhập                                            | Nhập AMOUNT header = 1,000,000; nhập dòng khoản mục tổng = 900,000; bấm **Gửi kiểm soát**                                    | Hiển thị MSG-ERR-AMOUNT-MISMATCH; chặn submit                                          | VAL-07, BIZ-004                 |
| PAY.OUT.MANUAL.TC.1.08 | Tạo chứng từ không thành công — CCID không hợp lệ                       | Negative | Maker đã đăng nhập                                            | Nhập GL_SEGMENT2 và GL_SEGMENT3 không thuộc CCID hợp lệ; bấm **Gửi kiểm soát**                                               | Hiển thị MSG-ERR-CCID; highlight dòng khoản mục lỗi; chặn submit                       | VAL-19                          |
| PAY.OUT.MANUAL.TC.1.09 | Tạo chứng từ không thành công — File đính kèm vượt giới hạn             | Negative | Maker đã đăng nhập; đang ở form Thêm mới                      | Upload file > 10MB                                                                                                           | Hiển thị MSG-ERR-FILE; không upload file; form vẫn mở                                  | VAL-09                          |
| PAY.OUT.MANUAL.TC.1.10 | Tạo chứng từ không thành công — File đính kèm sai định dạng             | Negative | Maker đã đăng nhập                                            | Upload file .exe                                                                                                             | Hiển thị MSG-ERR-FILE; không upload file                                               | VAL-09                          |
| PAY.OUT.MANUAL.TC.1.11 | Lưu nháp thành công khi dữ liệu chưa đủ                                 | Positive | Maker đã đăng nhập; chưa nhập đủ trường bắt buộc              | Bấm **Lưu nháp**                                                                                                             | Hệ thống lưu DRAFT; không validate đầy đủ; hiển thị MSG-OK-SAVE                        | A1                              |
| PAY.OUT.MANUAL.TC.1.12 | Gửi kiểm soát thành công                                                | Positive | Chứng từ ở DRAFT; đã nhập đầy đủ; CCID hợp lệ; tổng khớp      | Bấm **Gửi kiểm soát**                                                                                                        | Trạng thái chuyển READY_FOR_APPROVAL; notify Checker; hiển thị MSG-OK-SUBMIT           | VAL-01, VAL-07, VAL-19, BIZ-009 |
| PAY.OUT.MANUAL.TC.1.13 | Huỷ form khi đã nhập dữ liệu                                            | Positive | Maker đang nhập dữ liệu                                       | Bấm **Huỷ** hoặc `Esc`                                                                                                       | Hiển thị MSG-CFM-CANCEL; xác nhận → đóng form; không lưu                               | A2                              |
| PAY.OUT.MANUAL.TC.1.14 | Cảnh báo chứng từ trùng                                                 | Positive | Đã có chứng từ cùng Đơn vị + Số tiền trong 30 phút gần nhất   | Tạo chứng từ mới cùng RECEIVER + AMOUNT                                                                                      | Hiển thị MSG-WRN-DUPLICATE với nút `Tiếp tục`/`Huỷ`; chọn Tiếp tục → cho phép tạo      | VAL-18                          |

---

## D2 - Nhóm 2 — Xem

| Mã TC                  | Tên Testcase                                   | Loại UC  | Given                                                             | When                                                       | Then                                                                                                    | Tham chiếu            |
| ---------------------- | ---------------------------------------------- | -------- | ----------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------- |
| PAY.OUT.MANUAL.TC.2.01 | Xem chứng từ thành công                        | Positive | Tồn tại chứng từ ở bất kỳ trạng thái; NSD có quyền Viewer trở lên | Click link REF_NO trên LIST                                | Mở form read-only; hiển thị §1.1, §1.2, §1.3 + tab Lịch sử + tab Trạng thái phê duyệt                   | §4 Luồng chính bước 7 |
| PAY.OUT.MANUAL.TC.2.02 | Xem chứng từ không thành công — Không có quyền | Negative | User không có quyền truy cập                                      | Truy cập trực tiếp URL màn hình VIEW                       | Hiển thị MSG-ERR-PERMISSION; chuyển về trang chủ                                                        | BIZ-001               |
| PAY.OUT.MANUAL.TC.2.03 | Kiểm tra tab Lịch sử giao dịch                 | Positive | Chứng từ đã có nhiều lần sửa đổi                                  | Mở form VIEW; click tab **Lịch sử** (`Alt+H`)              | Hiển thị audit: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE, action, oldValue→newValue | BIZ-007, BIZ-008      |
| PAY.OUT.MANUAL.TC.2.04 | Kiểm tra tab Trạng thái phê duyệt              | Positive | Chứng từ đang PENDING_APPROVER                                    | Mở form VIEW; click tab **Trạng thái phê duyệt** (`Alt+P`) | Hiển thị workflow Maker→Checker→Approver; highlight bước Approver đang chờ                              | §11 State Machine     |
| PAY.OUT.MANUAL.TC.2.05 | In phiếu chứng từ                              | Positive | Chứng từ ở trạng thái bất kỳ; NSD có quyền in                     | Bấm **In phiếu** (`Ctrl+P`) trên form VIEW                 | Mở `PAY.OUT.MANUAL.PRINT`; sinh PDF preview theo template; ghi audit                                    | §10 Event 23          |

---

## D3 - Nhóm 3 — Cập nhật

| Mã TC                  | Tên Testcase                                          | Loại UC  | Given                                                        | When                                                 | Then                                                                  | Tham chiếu         |
| ---------------------- | ----------------------------------------------------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------ |
| PAY.OUT.MANUAL.TC.3.01 | Cập nhật chứng từ thành công                          | Positive | Chứng từ ở DRAFT; NSD là Maker gốc                           | Bấm **Sửa**; thay đổi DESCRIPTION; bấm **Lưu**       | F-VER tăng +1; ghi audit oldValue→newValue; hiển thị MSG-OK-SAVE      | VAL-15, BIZ-007    |
| PAY.OUT.MANUAL.TC.3.02 | Cập nhật không thành công — Trạng thái không cho phép | Negative | Chứng từ ở READY_FOR_APPROVAL                                | Cố gắng bấm **Sửa**                                  | Nút **Sửa** bị disable; tooltip MSG-ERR-STATUS                        | VAL-13             |
| PAY.OUT.MANUAL.TC.3.03 | Cập nhật không thành công — Không phải Maker gốc      | Negative | Chứng từ ở DRAFT; NSD là user khác                           | Cố gắng bấm **Sửa**                                  | Nút **Sửa** bị disable; tooltip MSG-ERR-MAKER                         | VAL-14             |
| PAY.OUT.MANUAL.TC.3.04 | Cập nhật không thành công — Optimistic lock conflict  | Negative | Chứng từ đang được user A giữ form Sửa; user B cũng đang sửa | User B bấm **Lưu** sau khi user A đã lưu             | Hiển thị MSG-ERR-LOCK; yêu cầu user B tải lại bản ghi                 | VAL-15             |
| PAY.OUT.MANUAL.TC.3.05 | Cập nhật không thành công — Concurrent edit           | Negative | Chứng từ đang được user A mở form Sửa                        | User B cố gắng mở form Sửa cùng chứng từ             | Hiển thị MSG-ERR-CONCURRENT với tên user A; không cho mở              | §6 E11             |
| PAY.OUT.MANUAL.TC.3.06 | Cập nhật chứng từ RETURNED_TO_MAKER thành công        | Positive | Chứng từ ở RETURNED_TO_MAKER; NSD là Maker gốc               | Mở Sửa; điều chỉnh theo yêu cầu Checker; bấm **Lưu** | F-VER tăng +1; ghi audit; có thể Submit lại                           | VAL-13, §11 bước 4 |
| PAY.OUT.MANUAL.TC.3.07 | Sao chép chứng từ thành công                          | Positive | Tồn tại chứng từ bất kỳ; NSD là Maker                        | Bấm **Sao chép** (`Ctrl+Shift+C`) trên LIST          | Mở form Thêm mới với dữ liệu copy; REF_NO mới tự sinh; F-STATUS=DRAFT | A4                 |

---

## D4 - Nhóm 4 — Xoá

| Mã TC                  | Tên Testcase                                       | Loại UC  | Given                                       | When                                                                    | Then                                                                           | Tham chiếu               |
| ---------------------- | -------------------------------------------------- | -------- | ------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------ |
| PAY.OUT.MANUAL.TC.4.01 | Xoá chứng từ thành công                            | Positive | Chứng từ ở DRAFT; NSD là Maker gốc          | Bấm **Xoá**; nhập Lý do ≥ 10 ký tự; tick checkbox; bấm **Xác nhận xoá** | Soft-delete: F-STATUS=DELETED; ẩn khỏi LIST; ghi audit; hiển thị MSG-OK-DELETE | VAL-16, BIZ-003, BIZ-007 |
| PAY.OUT.MANUAL.TC.4.02 | Xoá không thành công — Trạng thái không cho phép   | Negative | Chứng từ ở READY_FOR_APPROVAL               | Cố gắng bấm **Xoá**                                                     | Nút **Xoá** bị disable; tooltip MSG-ERR-STATUS                                 | VAL-13                   |
| PAY.OUT.MANUAL.TC.4.03 | Xoá không thành công — Không phải Maker gốc        | Negative | Chứng từ ở DRAFT; NSD không phải người tạo  | Cố gắng bấm **Xoá**                                                     | Nút **Xoá** bị disable; tooltip MSG-ERR-MAKER                                  | VAL-14                   |
| PAY.OUT.MANUAL.TC.4.04 | Xoá không thành công — Lý do không đủ ký tự        | Negative | Popup Xoá đang mở                           | Nhập Lý do < 10 ký tự; bấm **Xác nhận xoá**                             | Nút **Xác nhận xoá** vẫn disable; hiển thị MSG-ERR-DELETE-CFM                  | VAL-16                   |
| PAY.OUT.MANUAL.TC.4.05 | Xoá không thành công — Chưa tick checkbox xác nhận | Negative | Popup Xoá đang mở; đã nhập Lý do ≥ 10 ký tự | Chưa tick checkbox; bấm **Xác nhận xoá**                                | Nút **Xác nhận xoá** vẫn disable                                               | VAL-16                   |
| PAY.OUT.MANUAL.TC.4.06 | Chứng từ đã xoá vẫn truy được qua audit            | Positive | Chứng từ đã bị xoá (F-STATUS=DELETED)       | Admin truy vấn audit log                                                | Bản ghi xuất hiện trong audit với action=DELETE; oldValue→newValue đầy đủ      | BIZ-003, BIZ-007         |

---

# Phụ lục — Danh mục LOV tham chiếu

### LOV.01 — Danh mục kênh thanh toán / Payment Channel

| Channel                | Channel_Type               | Ghi chú                                                                                                |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Liên ngân hàng         | Lệnh chuyển khoản          |                                                                                                        |
| Liên ngân hàng         | Lệnh chi TM cho KBNN       |                                                                                                        |
| Liên ngân hàng         | Lệnh chi TM cho KH         |                                                                                                        |
| Liên ngân hàng         | TT bằng ngoại tệ khác      |                                                                                                        |
| Thanh toán song phương | Lệnh thông thường          |                                                                                                        |
| Thanh toán song phương | Lệnh trái phiếu chính phủ  |                                                                                                        |
| Thanh toán song phương | Lệnh có thông tin thu NSNN |                                                                                                        |
| Liên kho bạc           | –                          | Không có loại kênh ⇒ Khi chọn Kênh = Liên kho bạc thì trường Loại lệnh sẽ mờ, không cho phép nhập/chọn |

### LOV.02 — Danh mục ngân hàng / Bank Account Number

| Type | Bank_Account_Number | Bank_Branch_Name      | Bank_Code | Bank_Name                       |
| ---- | ------------------- | --------------------- | --------- | ------------------------------- |
| Bank | 12919218            | Chi nhánh VCB Ba Đình | VCB       | Ngân hàng ngoại thương Việt Nam |

### LOV.03 — Danh mục kho bạc / Branch Code

| Type | Branch_Code | Branch_Name    |
| ---- | ----------- | -------------- |
| KBNN | 0191818     | KBNN Hoàn Kiếm |

### LOV.04 — Danh mục tiền tệ

| Currency_Code | Currency_Name |
| ------------- | ------------- |
| VND           | Việt Nam Đồng |
| USD           | Đôla Mỹ       |

### LOV.05 — Loại chi phí / Expense Type

| Expense_Code | Expense_Name                      |
| ------------ | --------------------------------- |
| EXP01        | Phí chuyển tiền đi                |
| EXP02        | Điện phí                          |
| EXP03        | Phí chuyển đổi ngoại tệ           |
| EXP04        | Phí ngân hàng đại lý / trung gian |
| EXP05        | Các loại phí khác                 |

### LOV.06 — Loại thanh toán / Payment Type

| Payment_Type_Code | Payment_Type_Name           |
| ----------------- | --------------------------- |
| LTT01             | Lệnh chuyển Nợ giá trị thấp |
| LTT02             | Lệnh chuyển Nợ giá trị cao  |
| LTT03             | Lệnh chuyển Có giá trị thấp |
| LTT04             | Lệnh chuyển Có giá trị cao  |

### LOV.07 — Danh mục COA Segment

| LOV ID    | Segment                | Mẫu Segment_Code | Ghi chú |
| --------- | ---------------------- | ---------------- | ------- |
| LOV.07.1  | Segment1 — Mã quỹ      | `01`             | 2 ký tự |
| LOV.07.2  | Segment2 — TK tự nhiên | `0001`           | 4 ký tự |
| LOV.07.3  | Segment3 — DVQHNS      | `0000001`        | 7 ký tự |
| LOV.07.4  | Segment4 — Cấp NS      | `1`              | 1 ký tự |
| LOV.07.5  | Segment5 — Chương      | `001`            | 3 ký tự |
| LOV.07.6  | Segment6 — Ngành KT    | `001`            | 3 ký tự |
| LOV.07.7  | Segment7 — NDKT        | `0001`           | 4 ký tự |
| LOV.07.8  | Segment8 — ĐB          | `00001`          | 5 ký tự |
| LOV.07.9  | Segment9 — CTMT        | `00001`          | 5 ký tự |
| LOV.07.10 | Segment10 — MN         | `01`             | 2 ký tự |
| LOV.07.11 | Segment11 — Kho bạc    | `0001`           | 4 ký tự |
| LOV.07.12 | Segment12 — DP         | `001`            | 3 ký tự |

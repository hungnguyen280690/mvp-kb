# Bảng đặc tả chức năng

> Chức năng điển hình **Thêm mới / Xem / Sửa / Xoá** một giao dịch. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế, giữ nguyên cấu trúc và danh mục kiểu trường/quy tắc.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<Mã chức năng>` |
| Tên chức năng | Quản lý giao dịch `<Tên chức năng>` — Thêm mới / Xem / Sửa / Xoá |
| Người sử dụng | Người lập (Maker), Người kiểm soát (Checker), Người phê duyệt (Approver), Người tra cứu (Viewer) |
| Mô tả | Cho phép NSD tạo mới, tra cứu, sửa, xoá giao dịch `<Tên chức năng>`; gửi kiểm soát theo quy trình Maker–Checker–Approver |
| Độ ưu tiên | Cao |
| URD reference | `<URD-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền truy cập màn hình theo vai trò (Maker/Checker/Approver/Viewer) |
| 3 | Các danh mục Master Data đã được cấu hình (đơn vị, tài khoản, loại tiền, mã quỹ…) |
| 4 | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái DRAFT hoặc RETURNED_TO_MAKER |
| 5 | (Trường hợp Sửa/Xoá) NSD là Maker gốc của bản ghi |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | (Trường hợp Thêm/Sửa) Bản ghi được lưu với trạng thái DRAFT hoặc READY_FOR_APPROVAL |
| 2 | (Trường hợp Xoá) Bản ghi được soft-delete, ẩn khỏi danh sách, vẫn truy được qua audit |
| 3 | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) |
| 4 | (Trường hợp Submit giao dịch) Notification đã gửi đến Checker/Approver |
| 5 | Số dư hold (nếu có) được cập nhật tương ứng |

## 4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | Bấm **Thêm mới** trên màn hình danh sách, hoặc Menu "Thêm mới" | (1) Mở form trống, (2) Sinh ID của giao dịch, (3) Trạng thái giao dịch=DRAFT, (4) Tự động điền thông tin (người lập/ngày lập) |
| 2 | Nhập các trường dữ liệu theo Bảng đặc tả Field | (1) Kiểm tra dữ liệu khi rời ô nhập (onBlur), (2) Kiểm tra ràng buộc giữa các trường khi gửi lệnh, (3) Kiểm tra theo quy định nghiệp vụ |
| 3 | Đính kèm chứng từ (File upload) *(Optional)* | Validate ≤ 10MB, định dạng pdf/jpg/png/docx (VAL-09) |
| 4 | Bấm **Lưu** | Validate cơ bản; lưu DRAFT; hiển thị MSG-OK-SAVE |
| 5 | Bấm **Submit** (Gửi kiểm soát/phê duyệt) | Validate đầy đủ (Tham chiếu mục 6. Luồng ngoại lệ); chuyển trạng thái READY_FOR_APPROVAL; gửi notify Checker |
| 6 | (Trường hợp Xem) Chọn dòng trong danh sách, bấm **Xem** hoặc click link `<Mã giao dịch>` | Mở form read-only; hiển thị đầy đủ trường, [Tab] Đính kèm, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt |
| 7 | (Trường hợp Sửa) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Sửa** | Mở form editable; load phiên bản hiện hành F-VER của giao dịch; cho phép thay đổi các trường thông tin theo đặc tả Field |
| 8 | (Trường hợp Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); cập nhật phiên bản giao dịch F-VER+1; ghi audit oldValue→newValue |
| 9 | (Trường hợp Xoá) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Xoá** | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận đã rà soát |
| 10 | (Xoá) Bấm **Xác nhận xoá** | Soft-delete (F-STATUS=DELETED), ghi audit, release hold (nếu có), hiển thị MSG-OK-DELETE |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Lưu nháp** thay vì Submit | Bỏ qua validate đầy đủ, chỉ validate định dạng; lưu DRAFT |
| A2 | NSD bấm **Huỷ** khi đang nhập | Nếu form đã nhập dữ liệu → hỏi xác nhận; nếu xác nhận → đóng form, bỏ thay đổi |
| A3 | NSD bấm **Export** | Xuất Excel/PDF/CSV (sync nếu < 50k bản ghi, async nếu vượt) |
| A4 | NSD copy từ bản ghi đã có | Mở form Thêm mới với dữ liệu sao chép; F-ID mới, F-STATUS=DRAFT |
| A5 | Checker bấm **Phê duyệt** → chuyển Approver | Cập nhật trạng thái READY_FOR_APPROVAL; notify Approver |
| A6 | Approver bấm **Phê duyệt** | Cập nhật APPROVED; trigger luồng nghiệp vụ kế tiếp |
| A7 | NSD bấm **In phiếu** trên [Tab] Nhập liệu chính | Sinh PDF theo template, hiển thị preview |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc bị bỏ trống khi Submit (VAL-01) | Highlight đỏ + hiển thị `Vui lòng nhập [Tên trường]`; chặn submit |
| E2 | Giá trị không thuộc danh mục (VAL-03) | Thông báo `Giá trị không nằm trong danh mục`; clear trường |
| E3 | Cross-field không thoả mãn (VAL-05/07/08) | Hiển thị thông báo cụ thể tại trường lỗi; chặn Submit |
| E4 | File đính kèm vượt giới hạn/sai định dạng (VAL-09) | Thông báo `File vượt giới hạn hoặc sai định dạng`; không upload |
| E5 | Sửa/Xoá khi trạng thái không cho phép (VAL-13) | Thông báo `Giao dịch đang ở trạng thái [<state>], không cho phép Sửa/Xoá`; disable nút |
| E6 | Sửa/Xoá khi không phải Maker gốc (VAL-14) | Thông báo `Chỉ Người lập gốc mới được phép Sửa/Xoá` |
| E7 | Optimistic lock conflict (VAL-15) | Thông báo `Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục` |
| E8 | Confirm xoá không đủ điều kiện (VAL-16) | Disable nút Xác nhận xoá đến khi nhập đủ lý do + tick checkbox |
| E9 | Vượt hạn mức (VAL-12) | Hiển thị warning vàng `Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn`; cho phép tiếp tục |
| E10 | Lỗi hệ thống / API timeout | Hiển thị `Lỗi hệ thống, traceId: <…>`; rollback giao dịch |
| E11 | Concurrent edit (record đang bị lock) | Thông báo `Giao dịch đang được [<user>] chỉnh sửa, vui lòng thử lại sau` |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-001 — Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò |
| 2 | BIZ-002 — Chỉ Maker gốc được Sửa/Xoá khi bản ghi ở DRAFT/RETURNED_TO_MAKER |
| 3 | BIZ-003 — Xoá là soft-delete; bản ghi vẫn truy được qua audit/history |
| 4 | BIZ-004 — Tổng tiền dòng chi tiết phải bằng F-AMOUNT của bản ghi cha |
| 5 | BIZ-005 — File đính kèm: tối đa 10MB/file, định dạng pdf/jpg/png/docx; tối đa N file/bản ghi |
| 6 | BIZ-006 — Lý do từ chối/huỷ ≥ 10 ký tự và ≤ 500 ký tự, lưu vào audit |
| 7 | BIZ-007 — Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue |
| 8 | BIZ-008 — Transaction History ghi thông tin: created_by, created_date, last_updated_by, last_updated_date |
| 9 | BIZ-009 — Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp |
| 10 | BIZ-010 — Vượt hạn mức cấu hình → bắt buộc phê duyệt cấp cao hơn |

## 8. Quy tắc kiểm tra dữ liệu

> Tổng hợp các quy tắc Validate được tham chiếu trong §4–§6. Phân loại theo phạm vi áp dụng: **Chung** (mọi chức năng/phân hệ), **Chức năng** (riêng chức năng này), **Phân hệ** (dùng chung trong phân hệ).

| STT | Phân loại | Mã | Quy tắc |
|---|---|---|---|
| 1 | Chung | VAL-01 | Trường bắt buộc (`Mandatory`) không được bỏ trống khi Submit; highlight đỏ + thông báo `Vui lòng nhập [Tên trường]` |
| 2 | Chung | VAL-02 | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Integer/Decimal (range, số chữ số thập phân), Date/DateTime (định dạng `dd/MM/yyyy [HH:mm:ss]`), Email (RFC 5322), Phone (E.164),... |
| 3 | Chung | VAL-03 | Giá trị thuộc danh mục Master Data (Dropdown/Combobox/Tree-select/Picker); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường |
| 4 | Chung | VAL-04 | Range/min-max cho số và ngày (vd Số tiền > 0, Ngày hiệu lực ≥ Ngày hiện tại); DateRange: Từ ngày ≤ Đến ngày, không vượt biên độ cấu hình |
| 5 | Chung | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các trường (vd Đơn vị thụ hưởng ≠ Đơn vị thanh toán; Tài khoản nợ ≠ Tài khoản có; Loại tiền nợ = Loại tiền có) |
| 6 | Chung | VAL-06 | Trường phụ thuộc (cascading): khi giá trị trường cha thay đổi → reset/refresh dropdown trường con (vd Tỉnh → Huyện → Xã) |
| 7 | Chung | VAL-07 | Tổng dòng chi tiết = giá trị tổng hợp ở bản ghi cha (vd `SUM(F-DETAIL.AMOUNT) = F-HEADER.AMOUNT`); chênh lệch > tolerance → chặn Submit |
| 8 | Chung | VAL-08 | Ràng buộc theo thời gian: ngày phải nằm trong kỳ kế toán mở; ngoài giờ giao dịch → cảnh báo |
| 9 | Chung | VAL-09 | File đính kèm: ≤ 10MB/file, định dạng pdf/jpg/png/docx; ≤ N file/bản ghi; quét virus trước khi lưu |
| 10 | Chung | VAL-10 | Trường Text: trim, không cho phép ký tự điều khiển (`\x00-\x1F`); chống XSS/SQL Injection bằng escape |
| 11 | Chung | VAL-11 | Unique constraint: mã giao dịch / số chứng từ duy nhất trong phạm vi (đơn vị, kỳ, loại) |
| 12 | Phân hệ | VAL-12 | Hạn mức theo cấu hình phân hệ (user/đơn vị/sản phẩm): vượt → warning vàng, yêu cầu phê duyệt cấp cao hơn |
| 13 | Chung | VAL-13 | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với DRAFT/RETURNED_TO_MAKER; không cho thao tác trên bản ghi đã APPROVED/POSTED |
| 14 | Chung | VAL-14 | Người sở hữu: chỉ Maker gốc được Sửa/Xoá; phá vỡ → chặn + log audit bảo mật |
| 15 | Chung | VAL-15 | Optimistic lock theo `(F-ID, F-VER)`: khi Lưu nếu `F-VER` trong DB ≠ `F-VER` đã load → chặn, thông báo tải lại |
| 16 | Chung | VAL-16 | Confirm xoá: bắt buộc nhập **Lý do** ≥ 10 ký tự và tick checkbox xác nhận; thiếu → disable nút Xác nhận xoá |
| 17 | Chung | VAL-17 | Trường immutable trong Edit-mode: F-ID, F-AUDIT (người lập, ngày lập), F-VER; backend reject nếu client gửi thay đổi |
| 18 | Chung | VAL-18 | Cảnh báo trùng: trong N phút có giao dịch cùng (Đơn vị + Số tiền + Số chứng từ gốc) → warning + nút `Tiếp tục`/`Huỷ` |

## 9. Danh sách thông báo

> Tổng hợp các thông báo trong §4–§6 và §8. Phân loại: **Error** (chặn xử lý), **Warning** (cho phép tiếp tục có cảnh báo), **Info/Success** (thông báo kết quả), **Confirm** (yêu cầu xác nhận).

| STT | Phân loại 1 | Phân loại 2 | Mã | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên trường]` |
| 2 | Chung | Error | MSG-ERR-FORMAT | Định dạng `[Tên trường]` không hợp lệ |
| 3 | Chung | Error | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | MSG-ERR-RANGE | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`) |
| 5 | Chung | Error | MSG-ERR-CROSS-FIELD | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]` |
| 6 | Chung | Error | MSG-ERR-FILE | File vượt giới hạn hoặc sai định dạng |
| 7 | Chung | Error | MSG-ERR-DUPLICATE | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]` |
| 8 | Chung | Error | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 9 | Chung | Error | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 10 | Chung | Error | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 11 | Chung | Error | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 12 | Chung | Success | MSG-OK-SAVE | Lưu giao dịch thành công |
| 13 | Chung | Success | MSG-OK-DELETE | Xoá giao dịch thành công |
| 14 | Chung | Success | MSG-OK-SUBMIT | Đã gửi giao dịch để kiểm soát/phê duyệt |
| 15 | Chung | Confirm | MSG-CFM-CANCEL | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 16 | Chung | Confirm | MSG-CFM-DELETE | Bạn có chắc muốn xoá giao dịch `<Mã giao dịch>`? |
| 17 | Chung | Warning | MSG-WRN-LIMIT | Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn |
| 18 | Chung | Warning | MSG-WRN-OUTSIDE-HOUR | Ngoài giờ giao dịch, vui lòng xem lại |
| 19 | Chung | Error | MSG-ERR-STATUS | Giao dịch đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá |
| 20 | Chung | Error | MSG-ERR-MAKER | Chỉ Người lập gốc mới được phép Sửa/Xoá |
| 21 | Chung | Error | MSG-ERR-LOCK | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 22 | Chung | Error | MSG-ERR-CONCURRENT | Giao dịch đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau |
| 23 | Chung | Error | MSG-ERR-DELETE-CFM | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát |
| 24 | Chung | Warning | MSG-WRN-DUPLICATE | Phát hiện giao dịch tương tự đã được lập gần đây. Bạn có muốn tiếp tục? |
| 25 | Chung | Info | MSG-INF-NOTIFY-CHECKER | Đã gửi thông báo đến Người kiểm soát `<…>` |

## 10. Danh sách sự kiện

> Tổng hợp các sự kiện (UI action + backend event) phát sinh trong vòng đời CRUD. Quy ước Event_id: `<MOD>.<ACTION>` (action ở thì hiện tại đơn).

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `<MOD>.LIST.VIEW` | Chung | Danh sách | Mở màn hình danh sách giao dịch |
| 2 | `<MOD>.LIST.FILTER` | Chung | Danh sách | NSD áp dụng bộ lọc/tìm kiếm/sort |
| 3 | `<MOD>.LIST.EXPORT` | Chung | Danh sách | NSD xuất dữ liệu Excel/PDF/CSV |
| 4 | `<MOD>.NEW.OPEN` | Chung | Thêm mới | Mở form Thêm mới, sinh F-ID preview |
| 5 | `<MOD>.NEW.SAVE` | Chung | Thêm mới | Lưu bản ghi DRAFT |
| 6 | `<MOD>.NEW.SUBMIT` | Chung | Thêm mới | Submit → READY_FOR_APPROVAL; notify Checker |
| 7 | `<MOD>.NEW.CANCEL` | Chung | Thêm mới | Huỷ form, bỏ thay đổi |
| 8 | `<MOD>.NEW.COPY` | Chung | Thêm mới | Tạo mới bằng cách copy từ bản ghi đã có |
| 9 | `<MOD>.VIEW.OPEN` | Chung | Xem | Mở form Xem (read-only) |
| 10 | `<MOD>.VIEW.HISTORY` | Chung | Xem | Mở tab Lịch sử giao dịch / Audit |
| 11 | `<MOD>.VIEW.APPROVAL` | Chung | Xem | Mở tab Trạng thái phê duyệt |
| 12 | `<MOD>.EDIT.OPEN` | Chung | Sửa | Mở form Sửa, load F-VER hiện hành |
| 13 | `<MOD>.EDIT.SAVE` | Chung | Sửa | Lưu thay đổi, cập nhật F-VER+1, ghi audit |
| 14 | `<MOD>.EDIT.CANCEL` | Chung | Sửa | Huỷ chỉnh sửa, bỏ thay đổi |
| 15 | `<MOD>.DELETE.OPEN` | Chung | Xoá | Mở popup Xoá (lý do + checkbox) |
| 16 | `<MOD>.DELETE.CONFIRM` | Chức năng | Xoá | Soft-delete, release hold, ghi audit |
| 17 | `<MOD>.ATTACH.UPLOAD` | Chung | Đính kèm | Upload file (validate kích thước/định dạng/AV) |
| 18 | `<MOD>.ATTACH.DELETE` | Chung | Đính kèm | Xoá file đính kèm |
| 19 | `<MOD>.APPROVE.CHECKER` | Chung | Kiểm soát | Checker phê duyệt → chuyển Approver |
| 20 | `<MOD>.APPROVE.APPROVER` | Chung | Phê duyệt | Approver phê duyệt → APPROVED |
| 21 | `<MOD>.APPROVE.REJECT` | Chung | Phê duyệt | Từ chối → REJECTED + lý do |
| 22 | `<MOD>.APPROVE.RETURN` | Chung | Phê duyệt | Trả lại Maker → RETURNED_TO_MAKER |
| 23 | `<MOD>.PRINT.PREVIEW` | Chung | In phiếu | Sinh PDF preview theo template |
| 24 | `<MOD>.NOTIFY.SEND` | Chung | Notification | Gửi notification chuyển trạng thái (in-app + email) |
| 25 | `<MOD>.AUDIT.WRITE` | Chung | Audit | Ghi log thao tác (user, timestamp, IP, oldValue→newValue) |
| 26 | `<MOD>.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 27 | `<MOD>.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 28 | `<MOD>.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện conflict (optimistic lock mismatch) |

## 11. State Machine (Trạng thái giao dịch)

> Tổng hợp các bước chuyển trạng thái dựa trên §3 (Hậu điều kiện), §4 (Luồng chính), §5 (Luồng thay thế) và §10 (Sự kiện). Các trạng thái sử dụng: `Start`, `Draft`, `Ready_For_Approval` (cấp Checker), `Pending_Approver` (cấp Approver), `Approved`, `Posted`, `Returned_To_Maker`, `Rejected`, `Deleted`, `End`.
>
> Quy ước: cột **Trạng thái** = trạng thái trước sự kiện; cột **Trạng thái mới** = trạng thái sau sự kiện. Một số dòng có thể có nhiều trạng thái nguồn (ghi rõ bằng dấu `/`).

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | Maker tạo mới giao dịch (`<MOD>.NEW.OPEN`) | Start | Draft | Hệ thống sinh F-ID, F-VER=1, F-STATUS=Draft, autofill F-AUDIT (người lập, ngày lập); ghi log |
| 2 | Maker bấm Lưu/Lưu nháp (`<MOD>.NEW.SAVE`) | Draft | Draft | Lưu thay đổi field; ghi audit; hiển thị MSG-OK-SAVE; F-VER không đổi |
| 3 | Maker huỷ thao tác Thêm mới (`<MOD>.NEW.CANCEL`) | Draft (chưa lưu) | End | Đóng form, bỏ thay đổi; nếu chưa từng Save → không sinh bản ghi DB |
| 4 | Maker bấm Sửa & Lưu (`<MOD>.EDIT.SAVE`) | Draft / Returned_To_Maker | Draft | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 5 | Maker bấm Submit (`<MOD>.NEW.SUBMIT`) | Draft / Returned_To_Maker | Ready_For_Approval | Validate đầy đủ; chuyển trạng thái; gửi notify Checker; ghi audit |
| 6 | Maker bấm Xoá (Xác nhận xoá) (`<MOD>.DELETE.CONFIRM`) | Draft / Returned_To_Maker | Deleted | Soft-delete (F-STATUS=Deleted); release hold (nếu có); ghi audit; hiển thị MSG-OK-DELETE |
| 7 | Checker phê duyệt (`<MOD>.APPROVE.CHECKER`) | Ready_For_Approval | Pending_Approver | Chuyển sang chờ Approver; gửi notify Approver; ghi audit |
| 8 | Checker trả lại Maker (`<MOD>.APPROVE.RETURN`) | Ready_For_Approval | Returned_To_Maker | Bắt buộc lý do trả lại ≥ 10 ký tự; notify Maker; ghi audit |
| 9 | Checker từ chối (`<MOD>.APPROVE.REJECT`) | Ready_For_Approval | Rejected | Bắt buộc lý do từ chối; notify Maker; khoá giao dịch không cho Sửa; ghi audit |
| 10 | Approver phê duyệt (`<MOD>.APPROVE.APPROVER`) | Pending_Approver | Approved | Chuyển trạng thái Approved; trigger luồng nghiệp vụ kế tiếp; gửi notify Maker; ghi audit |
| 11 | Approver trả lại Maker (`<MOD>.APPROVE.RETURN`) | Pending_Approver | Returned_To_Maker | Bắt buộc lý do; notify Maker; ghi audit |
| 12 | Approver từ chối (`<MOD>.APPROVE.REJECT`) | Pending_Approver | Rejected | Bắt buộc lý do; notify Maker; khoá giao dịch; ghi audit |
| 13 | Hệ thống hạch toán | Approved | Transferred_to_GL | Trigger downstream (số dư, sổ cái, integration); ghi audit; chuyển trạng thái Transferred_to_GL |
| 14 | Hệ thống ghi sổ | Transferred_to_GL | Posted | Trigger downstream (số dư, sổ cái, integration); ghi audit; chuyển trạng thái Posted |
| 15 | Đóng nghiệp vụ (kết thúc vòng đời) | Posted / Rejected / Deleted | End | Khoá toàn bộ thao tác Sửa/Xoá; chỉ cho phép Xem; ghi audit truy cập |
| 16 | (Vi phạm) Cố tình Sửa/Xoá ở trạng thái không cho phép | Ready_For_Approval / Pending_Approver / Approved / Posted / Rejected / Deleted | (Không đổi) | Chặn thao tác (VAL-13); thông báo MSG-ERR-STATUS; disable nút; ghi audit bảo mật |
| 17 | (Vi phạm) Người khác Maker gốc Sửa/Xoá | Draft / Returned_To_Maker | (Không đổi) | Chặn (VAL-14); thông báo MSG-ERR-MAKER; ghi audit bảo mật |
| 18 | (Concurrent) Optimistic lock mismatch khi Lưu | Draft / Returned_To_Maker | (Không đổi) | Chặn (VAL-15); thông báo MSG-ERR-LOCK; yêu cầu tải lại; ghi audit |
| 19 | (Hệ thống) Phiên đăng nhập hết hạn | (Bất kỳ) | (Không đổi) | Bắt buộc đăng nhập lại; lưu draft tạm (nếu form đang dirty); MSG-ERR-SESSION |
| 20 | (Quản trị) Khôi phục bản ghi đã xoá (nếu phân hệ cho phép) | Deleted | Draft | Restore F-STATUS=Draft; ghi audit khôi phục; chỉ Quản trị/quy trình duyệt mới được phép |

### Sơ đồ chuyển trạng thái

```
                                      ┌──────────────────────────────────────────┐
                                      │                                          │
              Maker.New        Maker.Save/Edit                                   │
   ┌─Start────────────▶ Draft ◀───────────┐                                      │
   │                     │                │                                      │
   │                     │ Submit         │ Return                               │
   │                     ▼                │                                      │
   │             Ready_For_Approval ──────┤                                      │
   │                     │                │                                      │
   │                     │ Checker.Approve│                                      │
   │                     ▼                │                                      │
   │              Pending_Approver ───────┤                                      │
   │                     │                │                                      │
   │                     │ Approver.Approve                                      │
   │                     ▼                                                       │
   │                 Approved ────▶ Posted ──┐                                   │
   │                     │                   │                                   │
   │                     │ Reject            │                                   │
   │                     ▼                   ▼                                   │
   │                 Rejected ───────────▶  End                                  │
   │                                                                             │
   │            Maker.Delete (Draft/Returned_To_Maker)                           │
   └────────────────────────▶ Deleted ───────────────────▶ End                   │
                                  │                                              │
                                  │ Admin.Restore                                │
                                  └──────────────────────────────────────────────┘
```

[Inference] Sơ đồ trên minh hoạ vòng đời điển hình; tuỳ phân hệ có thể bổ sung trạng thái phụ (vd `On_Hold`, `Suspended`, `Reversed`) hoặc chu trình nhiều cấp Approver hơn.

## 12. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `<MOD>.LIST` — Màn hình Danh sách giao dịch (lọc, sort, phân trang, export) |
| 2 | `<MOD>.NEW` — Form Thêm mới |
| 3 | `<MOD>.VIEW` — Form Xem (read-only), gồm: [Tab] Đính kèm, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt |
| 4 | `<MOD>.EDIT` — Form Sửa |
| 5 | `<MOD>.DELETE` — Popup xác nhận Xoá (lý do + checkbox) |
| 6 | `<MOD>.DETAIL.GRID` — Inline grid chi tiết khoản mục |
| 7 | `<MOD>.ATTACH` — Popup quản lý đính kèm |
| 8 | `<MOD>.HISTORY` — Popup lịch sử audit (oldValue→newValue) |
| 9 | `<MOD>.LOOKUP.*` — Popup tra cứu danh mục (đơn vị, tài khoản, mã quỹ…) |
| 10 | `<MOD>.APPROVE` — Màn hình kiểm soát/phê duyệt |
| 11 | `<MOD>.PRINT` — Màn hình Preview in phiếu/báo cáo |
| 12 | `<MOD>.EXPORT` — Tuỳ chọn xuất Excel/PDF/CSV |

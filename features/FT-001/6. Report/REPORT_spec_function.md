# Bảng đặc tả chức năng

> Chức năng **Báo cáo** điển hình — gồm: (1) Form nhập tham số báo cáo, (2) Kết xuất báo cáo (sync/async), (3) Xem/In/Tải/Gửi phân phối, (4) Lập lịch & lịch sử kết xuất. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<Mã báo cáo>` |
| Tên chức năng | Báo cáo `<Tên báo cáo nghiệp vụ>` |
| Người sử dụng | Người lập, Người kiểm soát, Người phê duyệt, Người tra cứu, Quản trị |
| Mô tả | Cho phép NSD nhập tham số, kết xuất báo cáo theo template chuẩn (PDF/Excel/CSV), xem trước, tải, in, gửi qua email/Notification; hỗ trợ lập lịch tự động và lưu lịch sử kết xuất |
| Độ ưu tiên | Cao |
| URD reference | `<URD-RPT-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền truy cập báo cáo `<Tên báo cáo>` theo vai trò + đơn vị |
| 3 | Template báo cáo đã được khai báo (`<MOD>.RPT.TEMPLATE`) |
| 4 | Dữ liệu nguồn (giao dịch, master, snapshot EOD) đã sẵn sàng, đặc biệt với báo cáo cuối ngày/cuối kỳ |
| 5 | Tham số mặc định (đơn vị, kỳ báo cáo, loại tiền) đã cấu hình theo user/role/nhóm role/đơn vị |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | File báo cáo được sinh đúng template, đúng tham số |
| 2 | Bản ghi lịch sử kết xuất (`F-RPT-RUN-ID`) được lưu kèm: user, timestamp, tham số, định dạng, kích thước file, hash, đường dẫn |
| 3 | Notification + ký số khi file đã sẵn sàng (đối với báo cáo có ký số) |
| 4 | Audit log ghi nhận thao tác kết xuất/tải/gửi phân phối (đối với báo cáo có ký số) |
| 5 | Không phát sinh thay đổi dữ liệu nghiệp vụ (read-only) |

## 4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | NSD chọn báo cáo `<Tên báo cáo>` trong danh sách báo cáo được phân quyền | (1) Hiển thị form tham số với mặc định (vd: Đơn vị = đơn vị của user, Kỳ báo cáo = kỳ hiện tại, Định dạng = PDF, Ngôn ngữ = VI) |
| 2 | Nhập/chọn tham số theo đặc tả field| Validate theo Bảng quy tắc kiểm tra dữ liệu |
| 3 | (Tuỳ chọn) Bấm **Xem trước** | Render preview báo cáo với dữ liệu thực |
| 4 | Bấm **Kết xuất** | (1) Validate dữ liệu theo Bảng quy trắc kiểm tra dữ liệu, (2) Kiểm tra phân quyền theo đơn vị|
| 5 | | (1) Query dữ liệu → render theo template → áp dụng định dạng → sinh file → trả về download ngay, (2) Lưu vào lịch sử kết xuất |
| 7 | NSD xem **Lịch sử kết xuất** | Hiển thị danh sách run: runId, thời gian, user, tham số, trạng thái (QUEUED/RUNNING/SUCCESS/FAILED), kích thước, định dạng, link tải |
| 8 | NSD bấm **Tải file** trên một run SUCCESS | (1) Tải file, (2) Ghi log |
| 9 | NSD bấm **In** | Mở preview in (PDF) với template chuẩn (header/footer, số trang, mã báo cáo, người kết xuất) |
| 11 | NSD bấm **Lập lịch** → chọn tần suất (Daily/Weekly/Monthly/Cron); danh sách người nhận; định dạng | (1) Lưu cấu hình lịch (`F-RPT-SCHED-ID`), (2) Kích hoạt scheduler, (3) Ghi log |
| 12 | NSD bấm **Reset** | Xoá toàn bộ tham số đã nhập về mặc định |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Lưu bộ tham số** | Lưu preset theo user (tối đa N preset); tải nhanh ở lần sau |
| A2 | Báo cáo hỗ trợ **Drill-down** | Click vào dòng tổng hợp → mở báo cáo chi tiết tương ứng, truyền tham số đã lọc |
| A3 | NSD bấm **Hủy job** đang chạy | (1) Đánh dấu job `CANCELLED`, (2) Giải phóng tài nguyên, (3) Ghi log |
| A4 | Scheduler chạy theo lịch | (1) Tự động kết xuất theo preset, (2) Ghi run vào lịch sử |
| A5 | NSD chọn `Định dạng = Excel` với báo cáo bảng | Sinh workbook với sheet metadata (tham số, người kết xuất), sheet dữ liệu, sheet pivot/chart (nếu cấu hình) |
| A6 | NSD chọn `Định dạng = CSV` | Bỏ format/biểu đồ; chỉ dữ liệu thô; encoding UTF-8 BOM; phân tách theo cấu hình |
| A7 | NSD bấm **Ký số file** (nếu báo cáo bắt buộc ký) | Áp dụng chữ ký số tổ chức + người kết xuất; gắn timestamp; xác thực |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Tham số bắt buộc bỏ trống (VAL-01) | Highlight + thông báo `Vui lòng nhập [Tên tham số]`; chặn kết xuất |
| E2 | DateRange ngược / vượt biên (VAL-04) | Thông báo `Khoảng thời gian không hợp lệ / vượt biên độ cho phép`; chặn kết xuất |
| E3 | Tham số ngoài phạm vi phân quyền | Tự động giới hạn; thông báo `Đã giới hạn theo phạm vi phân quyền của bạn` |
| E4 | Dữ liệu nguồn chưa sẵn sàng (vd snapshot EOD chưa close) | Thông báo `Dữ liệu kỳ <…> chưa được chốt, vui lòng thử lại sau khi EOD hoàn tất` |
| E5 | Kết quả rỗng | Vẫn sinh file theo template với phần dữ liệu trống + dòng `Không có dữ liệu phù hợp`; hiển thị warning trên UI |
| E6 | Vượt ngưỡng sync (vd > 50.000 dòng / > 100 trang) | Tự chuyển sang async; thông báo `Báo cáo lớn — sẽ được gửi qua Notification/email khi hoàn tất` |
| E7 | Render timeout (vd > 10 phút) | Đánh dấu job `FAILED` với reason `TIMEOUT`; cho phép retry; thông báo cho NSD |
| E8 | Lỗi template (placeholder thiếu/syntax) | Đánh dấu `FAILED` với reason `TEMPLATE_ERROR`; thông báo `Mẫu báo cáo gặp lỗi, vui lòng liên hệ Quản trị`; gửi alert cho team kỹ thuật |
| E9 | Lỗi sinh file (đĩa đầy, OOM) | Đánh dấu `FAILED`; tự retry tối đa N lần với backoff; vượt → thông báo lỗi kèm traceId |
| E10 | File vượt giới hạn email (vd > 20MB) khi gửi phân phối | Tự chuyển sang gửi link tải có ký số; thông báo cho người gửi |
| E11 | Link tải hết hạn | Hiển thị `Liên kết đã hết hạn`; yêu cầu kết xuất lại |
| E12 | Phiên đăng nhập hết hạn khi đang kết xuất sync | Job vẫn tiếp tục nền; lưu vào lịch sử; thông báo qua Notification/email khi NSD đăng nhập lại |
| E13 | NSD không có quyền tải file của run do user khác tạo | Disable nút Tải; tooltip `Bạn không có quyền tải báo cáo của người dùng khác` |
| E14 | Scheduler không gửi được email cho người nhận | Đánh dấu run `PARTIAL_SUCCESS`; ghi danh sách người nhận lỗi; retry email N lần |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-RPT-01 — Chỉ kết xuất dữ liệu thuộc phạm vi phân quyền của NSD (đơn vị, vai trò, sản phẩm) |
| 2 | BIZ-RPT-02 — Báo cáo cuối ngày/cuối kỳ chỉ kết xuất sau khi snapshot tương ứng được chốt (status = CLOSED) |
| 3 | BIZ-RPT-03 — Sync ≤ ngưỡng cấu hình (vd 50.000 dòng / 100 trang); vượt → bắt buộc async |
| 4 | BIZ-RPT-04 — Async job có timeout cấu hình (vd 10 phút); retry tối đa N lần với exponential backoff |
| 5 | BIZ-RPT-05 — File sinh ra phải dùng template chuẩn có header (logo, mã báo cáo, kỳ), footer (số trang, người kết xuất, thời gian), watermark `BẢN NHÁP / CHÍNH THỨC` tuỳ trạng thái |
| 6 | BIZ-RPT-06 — File nhạy cảm (PII, số tiền lớn) bắt buộc che mask theo chính sách, chỉ user có quyền `RPT_UNMASK` mới thấy đầy đủ |
| 7 | BIZ-RPT-07 — Ký số bắt buộc với báo cáo gửi cơ quan ngoài hoặc báo cáo pháp lý; lưu chứng nhận TSA |
| 8 | BIZ-RPT-08 — Lưu trữ file theo TTL cấu hình (vd 90 ngày); sau TTL chuyển sang archive (cold storage) |
| 9 | BIZ-RPT-09 — Link tải dùng URL ký số có hiệu lực ≤ 15 phút; mỗi lần tải ghi audit |
| 10 | BIZ-RPT-10 — Audit log ghi: user, timestamp, IP, action (CREATE/DOWNLOAD/DISTRIBUTE/SCHEDULE), tham số, runId, kích thước, hash file |
| 11 | BIZ-RPT-11 — Preset bộ tham số lưu theo user (tối đa N preset); preset chia sẻ phải được Quản trị duyệt |
| 12 | BIZ-RPT-12 — Lập lịch tự động: tối đa N lịch/user; cron phải thuộc whitelist; phải có ít nhất 1 người nhận hợp lệ |
| 13 | BIZ-RPT-13 — So sánh kỳ trước chỉ áp dụng khi kỳ trước có snapshot CLOSED; thiếu kỳ → hiển thị `N/A` thay vì 0 |
| 14 | BIZ-RPT-14 — Hủy job đang chạy chỉ cho phép bởi chủ job hoặc Quản trị; ghi audit |
| 15 | BIZ-RPT-15 — Báo cáo phải đối chiếu được (reconcile) với dữ liệu nguồn: tổng phải khớp với báo cáo tổng hợp khác cùng kỳ; lệch → cảnh báo trên UI |
| 16 | BIZ-RPT-16 — Hash file (SHA-256) lưu trong lịch sử để kiểm tra tính toàn vẹn khi tải |


## 8. Quy tắc kiểm tra dữ liệu

> Tổng hợp các quy tắc Validate được tham chiếu trong §4–§6 và §7. Phân loại theo phạm vi áp dụng: **Chung** (mọi chức năng/phân hệ — đồng bộ với `BangDacTaChucNang_CRUD_DienHinh.md`), **Phân hệ** (dùng chung trong phân hệ Báo cáo), **Chức năng** (riêng chức năng báo cáo này).

| STT | Phân loại | Mã | Quy tắc |
|---|---|---|---|
| 1 | Chung | VAL-01 | Tham số bắt buộc (`Mandatory`) không được bỏ trống khi bấm **Kết xuất**/**Xem trước**; highlight đỏ + thông báo `Vui lòng nhập [Tên tham số]` |
| 2 | Chung | VAL-02 | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Integer/Decimal (range), Date/DateTime (`dd/MM/yyyy [HH:mm:ss]`), Email (RFC 5322), Cron (whitelist) |
| 3 | Chung | VAL-03 | Giá trị thuộc danh mục Master Data (Đơn vị, Mã quỹ, Loại tiền, Sản phẩm…); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường |
| 4 | Chung | VAL-04 | Range/DateRange: Từ ngày ≤ Đến ngày; không vượt biên độ cấu hình (vd ≤ 366 ngày); kỳ báo cáo ≤ kỳ hiện tại; kỳ tương lai → chặn |
| 5 | Chung | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các tham số (vd Loại báo cáo = `So sánh kỳ` → bắt buộc nhập `Kỳ so sánh`; Định dạng = `Excel` → cho phép chọn sheet pivot) |
| 6 | Chung | VAL-06 | Trường phụ thuộc (cascading): thay đổi trường cha → reset/refresh dropdown trường con (vd Đơn vị cha → Đơn vị con; Loại báo cáo → Bộ template áp dụng) |
| 7 | Chung | VAL-08 | Ràng buộc theo thời gian: ngày phải nằm trong kỳ kế toán mở hoặc đã đóng; kỳ EOD chưa CLOSED → chặn (VAL-RPT-04) |
| 8 | Chung | VAL-10 | Trường Text (Lý do, Ghi chú, Người nhận email): trim, không cho phép ký tự điều khiển; chống XSS/SQL Injection bằng escape |
| 9 | Chung | VAL-RPT-01 | Phân quyền tham số: giá trị tham số (Đơn vị, Sản phẩm, Mã quỹ…) phải thuộc phạm vi phân quyền của NSD; vượt phạm vi → tự giới hạn về phạm vi cho phép + cảnh báo (BIZ-RPT-01) |
| 10 | Phân hệ | VAL-RPT-02 | Ngưỡng sync: ước lượng số dòng/trang > ngưỡng cấu hình (vd 50.000 dòng / 100 trang) → tự chuyển sang async, không cho ép sync (BIZ-RPT-03) |
| 11 | Phân hệ | VAL-RPT-03 | Timeout async: job vượt timeout cấu hình (vd 10 phút) → đánh dấu `FAILED`/`TIMEOUT`; cho phép retry tối đa N lần với exponential backoff (BIZ-RPT-04) |
| 12 | Phân hệ | VAL-RPT-04 | Snapshot kỳ báo cáo: báo cáo cuối ngày/cuối kỳ yêu cầu snapshot tương ứng có status = `CLOSED`; nếu chưa → chặn + thông báo `Dữ liệu kỳ <…> chưa được chốt` |
| 13 | Phân hệ | VAL-RPT-05 | Template báo cáo: mã template phải tồn tại + active + thuộc bộ template được phép cho `<Mã báo cáo>`; placeholder phải khớp với data model (validate khi load template) |
| 14 | Phân hệ | VAL-RPT-06 | Định dạng đầu ra: thuộc whitelist (`PDF`/`XLSX`/`CSV`/`DOCX`); báo cáo có biểu đồ → không cho chọn `CSV`; báo cáo ký số bắt buộc → chỉ cho `PDF` |
| 15 | Phân hệ | VAL-RPT-07 | Che mask PII/số nhạy cảm: NSD không có quyền `RPT_UNMASK` → áp mask theo policy; cố tình truy `_RAW` → reject (BIZ-RPT-06) |
| 16 | Phân hệ | VAL-RPT-08 | Ngôn ngữ template: thuộc whitelist `VI`/`EN`; thiếu bản dịch khoá nào → fallback `VI` + ghi log warning |
| 17 | Phân hệ | VAL-RPT-09 | Hủy job: chỉ chủ job hoặc role `RPT_ADMIN` được hủy; người khác → reject + log (BIZ-RPT-14) |
| 18 | Chức năng | VAL-RPT-10 | Lập lịch: cron expression thuộc whitelist (Daily/Weekly/Monthly hoặc cron 5-trường được phê duyệt); ngoài whitelist → reject |
| 19 | Chức năng | VAL-RPT-11 | Lập lịch: phải có ≥ 1 người nhận hợp lệ (email format + thuộc danh bạ tổ chức hoặc khai báo external được duyệt); tối đa M người nhận/lịch |
| 20 | Chức năng | VAL-RPT-12 | Giới hạn số lịch active: ≤ N lịch/user; vượt → reject + đề nghị tắt lịch cũ (BIZ-RPT-12) |
| 21 | Chức năng | VAL-RPT-13 | Preset: số preset/user ≤ N; tên preset unique theo user; preset chia sẻ → bắt buộc duyệt bởi `RPT_ADMIN` (BIZ-RPT-11) |
| 22 | Chức năng | VAL-RPT-14 | Quyền tải file của run: NSD chỉ tải file do mình tạo hoặc được chia sẻ; tải file user khác mà không có quyền → reject + log security |
| 23 | Chức năng | VAL-RPT-15 | TTL link tải: URL ký số chỉ có hiệu lực ≤ 15 phút; hết hạn → reject + yêu cầu sinh link mới (BIZ-RPT-09) |
| 24 | Chức năng | VAL-RPT-16 | TTL file lưu trữ: file lưu ≤ TTL cấu hình (vd 90 ngày); sau TTL → archive cold storage, marker `EXPIRED` trên lịch sử (BIZ-RPT-08) |
| 25 | Chức năng | VAL-RPT-17 | Kích thước file gửi email: ≤ giới hạn cấu hình (vd 20MB); vượt → tự chuyển sang gửi link tải ký số (BIZ-RPT-09) |
| 26 | Chức năng | VAL-RPT-18 | Toàn vẹn file: lưu hash SHA-256 khi sinh; mỗi lần tải so khớp hash → lệch → reject + alert (BIZ-RPT-16) |
| 27 | Chức năng | VAL-RPT-19 | Reconcile: tổng các chỉ tiêu chính phải khớp với báo cáo tổng hợp khác cùng kỳ trong tolerance cấu hình; lệch → warning vàng trên UI và watermark `KIỂM TRA SỐ LIỆU` (BIZ-RPT-15) |
| 28 | Chức năng | VAL-RPT-20 | Drill-down: tham số drill-down phải tương thích với báo cáo chi tiết; thiếu mapping → ẩn link drill-down + log |
| 29 | Chức năng | VAL-RPT-21 | Ký số: chỉ cho ký khi định dạng = `PDF` + template hỗ trợ trường ký + chứng thư hợp lệ + OCSP/CRL phản hồi `good`; lỗi → reject (BIZ-RPT-07) |
| 30 | Chức năng | VAL-RPT-22 | So sánh kỳ trước: kỳ so sánh phải có snapshot `CLOSED`; thiếu → hiển thị `N/A` cho các ô so sánh, không hiển thị `0` (BIZ-RPT-13) |

## 9. Danh sách thông báo

> Tổng hợp các thông báo trong §4–§6 và §8. Phân loại: **Error** (chặn xử lý), **Warning** (cho phép tiếp tục có cảnh báo), **Success/Info** (thông báo kết quả), **Confirm** (yêu cầu xác nhận). Phân loại 1 đồng bộ với `BangDacTaChucNang_CRUD_DienHinh.md`: **Chung**, **Phân hệ**, **Chức năng**.

| STT | Phân loại 1 | Phân loại 2 | Mã | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên tham số]` |
| 2 | Chung | Error | MSG-ERR-FORMAT | Định dạng `[Tên tham số]` không hợp lệ |
| 3 | Chung | Error | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | MSG-ERR-RANGE | `[Tên tham số]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`) |
| 5 | Chung | Error | MSG-ERR-DATE-RANGE | Khoảng thời gian không hợp lệ hoặc vượt biên độ cho phép (`[max_days]` ngày) |
| 6 | Chung | Error | MSG-ERR-CROSS-FIELD | `[Tên tham số A]` và `[Tên tham số B]` không hợp lệ: `[mô tả ràng buộc]` |
| 7 | Chung | Error | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 8 | Chung | Error | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 9 | Chung | Error | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 10 | Chung | Error | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 11 | Phân hệ | Error | MSG-ERR-RPT-DATA-NOT-READY | Dữ liệu kỳ `<…>` chưa được chốt, vui lòng thử lại sau khi EOD hoàn tất |
| 12 | Phân hệ | Error | MSG-ERR-RPT-TEMPLATE | Mẫu báo cáo gặp lỗi `[reason]`, vui lòng liên hệ Quản trị |
| 13 | Phân hệ | Error | MSG-ERR-RPT-RENDER | Lỗi sinh file báo cáo (traceId: `<…>`); job sẽ tự retry hoặc thử lại |
| 14 | Phân hệ | Error | MSG-ERR-RPT-TIMEOUT | Báo cáo đã quá thời gian xử lý cho phép. Trạng thái: `FAILED`. Nhấn **Thử lại** để chạy lại |
| 15 | Phân hệ | Error | MSG-ERR-RPT-FORMAT-NOT-SUPPORTED | Định dạng `[Định dạng]` không hỗ trợ với báo cáo này |
| 16 | Phân hệ | Error | MSG-ERR-RPT-CANCEL-PERM | Chỉ chủ job hoặc Quản trị mới được hủy job kết xuất |
| 17 | Chức năng | Error | MSG-ERR-RPT-DOWNLOAD-PERM | Bạn không có quyền tải báo cáo của người dùng khác |
| 18 | Chức năng | Error | MSG-ERR-RPT-LINK-EXPIRED | Liên kết tải đã hết hạn. Vui lòng kết xuất lại để lấy liên kết mới |
| 19 | Chức năng | Error | MSG-ERR-RPT-FILE-EXPIRED | File báo cáo đã hết hạn lưu trữ (TTL `[N]` ngày) và đã chuyển sang lưu trữ lạnh |
| 20 | Chức năng | Error | MSG-ERR-RPT-HASH-MISMATCH | File bị thay đổi hoặc lỗi truyền tải (hash không khớp). Vui lòng kết xuất lại |
| 21 | Chức năng | Error | MSG-ERR-RPT-SCHED-CRON | Biểu thức lịch (cron) không thuộc whitelist được phép |
| 22 | Chức năng | Error | MSG-ERR-RPT-SCHED-RECIPIENT | Phải có ít nhất 1 người nhận hợp lệ; tối đa `[M]` người nhận/lịch |
| 23 | Chức năng | Error | MSG-ERR-RPT-SCHED-LIMIT | Đã đạt giới hạn `[N]` lịch active/user. Vui lòng tắt lịch cũ trước khi tạo mới |
| 24 | Chức năng | Error | MSG-ERR-RPT-PRESET-LIMIT | Đã đạt giới hạn `[N]` preset/user. Vui lòng xoá bớt preset cũ |
| 25 | Chức năng | Error | MSG-ERR-RPT-SIGN-CERT | Chứng thư ký số không hợp lệ hoặc đã thu hồi (OCSP/CRL). Không thể ký file |
| 26 | Chung | Success | MSG-OK-RPT-EXPORT | Kết xuất báo cáo thành công |
| 27 | Phân hệ | Success | MSG-OK-RPT-DOWNLOAD | Đã tải file `[Tên file]` (kích thước `[size]`) |
| 28 | Phân hệ | Success | MSG-OK-RPT-PRINT | Đã gửi yêu cầu in tới máy in `[Tên máy in]` |
| 29 | Chức năng | Success | MSG-OK-RPT-DISTRIBUTE | Đã gửi báo cáo cho `[N]` người nhận; thất bại: `[K]` |
| 30 | Chức năng | Success | MSG-OK-RPT-SCHEDULE | Đã tạo lịch kết xuất tự động `[F-RPT-SCHED-ID]` |
| 31 | Chức năng | Success | MSG-OK-RPT-PRESET | Đã lưu bộ tham số `[Tên preset]` |
| 32 | Chức năng | Success | MSG-OK-RPT-SIGN | Đã ký số file thành công (chứng thư `[CN]`, TSA `[time]`) |
| 33 | Chức năng | Success | MSG-OK-RPT-CANCEL | Đã hủy job kết xuất `[F-RPT-RUN-ID]` |
| 34 | Chung | Confirm | MSG-CFM-RPT-RESET | Bạn có chắc muốn xoá toàn bộ tham số đã nhập về mặc định? |
| 35 | Chức năng | Confirm | MSG-CFM-RPT-CANCEL-JOB | Bạn có chắc muốn hủy job kết xuất `[F-RPT-RUN-ID]` đang chạy? |
| 36 | Chức năng | Confirm | MSG-CFM-RPT-DELETE-SCHED | Bạn có chắc muốn xoá lịch kết xuất `[F-RPT-SCHED-ID]`? |
| 37 | Chức năng | Confirm | MSG-CFM-RPT-OVERWRITE-PRESET | Đã tồn tại preset `[Tên preset]`. Bạn có muốn ghi đè? |
| 38 | Phân hệ | Warning | MSG-WRN-RPT-PERM-LIMITED | Đã giới hạn theo phạm vi phân quyền của bạn (`[Phạm vi]`) |
| 39 | Phân hệ | Warning | MSG-WRN-RPT-EMPTY | Không có dữ liệu phù hợp với tham số đã chọn. File sẽ vẫn được sinh với phần dữ liệu trống |
| 40 | Phân hệ | Warning | MSG-WRN-RPT-LARGE | Báo cáo lớn (`[ước lượng]` dòng) — sẽ chuyển sang chế độ xử lý nền (async). Bạn sẽ nhận thông báo khi hoàn tất |
| 41 | Phân hệ | Warning | MSG-WRN-RPT-EMAIL-LIMIT | File vượt giới hạn `[MAX]` MB cho gửi email — đã tự chuyển sang gửi link tải ký số |
| 42 | Chức năng | Warning | MSG-WRN-RPT-RECONCILE | Phát hiện chênh lệch số liệu giữa báo cáo này và `[Báo cáo tham chiếu]`: `[delta]`. Vui lòng kiểm tra trước khi sử dụng |
| 43 | Chức năng | Warning | MSG-WRN-RPT-PREV-PERIOD-MISSING | Kỳ so sánh `[period]` chưa có snapshot CLOSED — các giá trị so sánh sẽ hiển thị `N/A` |
| 44 | Chức năng | Warning | MSG-WRN-RPT-MASKED | Dữ liệu nhạy cảm đã được che mask theo chính sách. Yêu cầu quyền `RPT_UNMASK` để xem đầy đủ |
| 45 | Chức năng | Warning | MSG-WRN-RPT-PARTIAL-DISTRIBUTE | Một số người nhận không gửi được email: `[danh sách]`. Hệ thống sẽ retry `[N]` lần |
| 46 | Phân hệ | Info | MSG-INF-RPT-QUEUED | Đã đưa vào hàng đợi xử lý (`F-RPT-RUN-ID = [id]`). Vị trí hàng đợi: `[pos]` |
| 47 | Phân hệ | Info | MSG-INF-RPT-RUNNING | Báo cáo đang được xử lý — tiến độ `[%]`. Bạn có thể đóng cửa sổ và quay lại sau |
| 48 | Phân hệ | Info | MSG-INF-RPT-READY | Báo cáo `[Tên báo cáo]` đã sẵn sàng. [Tải file] hoặc xem trong Lịch sử kết xuất |
| 49 | Chức năng | Info | MSG-INF-RPT-NOTIFY-SENT | Đã gửi thông báo kết xuất hoàn tất tới `[N]` người nhận |
| 50 | Chức năng | Info | MSG-INF-RPT-SCHED-NEXT-RUN | Lần chạy tiếp theo của lịch `[F-RPT-SCHED-ID]`: `[next_run_time]` |

## 10. Danh sách sự kiện

> Tổng hợp các sự kiện (UI action + backend event) phát sinh trong vòng đời của báo cáo, đồng bộ quy ước Event_id với `BangDacTaChucNang_CRUD_DienHinh.md`: `<MOD>.<ACTION>` (action ở thì hiện tại đơn). Riêng các sự kiện của chức năng Báo cáo dùng namespace `<MOD>.BC.<ACTION>` để tránh trùng với CRUD.

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `<MOD>.BC.LIST.VIEW` | Chung | Danh sách báo cáo | Mở màn hình danh sách báo cáo được phân quyền |
| 2 | `<MOD>.BC.LIST.FILTER` | Chung | Danh sách báo cáo | NSD tìm kiếm/lọc/sort báo cáo trong danh sách |
| 3 | `<MOD>.BC.LIST.SELECT` | Chung | Danh sách báo cáo | NSD chọn một báo cáo để mở form tham số |
| 4 | `<MOD>.BC.FORM.OPEN` | Chức năng | Form tham số | Mở form tham số; hệ thống điền giá trị mặc định theo user/role/đơn vị |
| 5 | `<MOD>.BC.FORM.PARAM.CHANGE` | Chức năng | Form tham số | NSD thay đổi giá trị tham số; trigger cascading + validate onBlur |
| 6 | `<MOD>.BC.FORM.RESET` | Chức năng | Form tham số | NSD bấm **Reset** → xoá tham số về mặc định |
| 7 | `<MOD>.BC.PREVIEW.OPEN` | Chức năng | Xem trước | NSD bấm **Xem trước** → render preview HTML/ảnh trang đầu |
| 8 | `<MOD>.BC.EXPORT.RUN` | Chức năng | Kết xuất | NSD bấm **Kết xuất** → submit job; sinh `F-RPT-RUN-ID`, trạng thái `Queued` |
| 9 | `<MOD>.BC.EXPORT.START` | Chức năng | Kết xuất | Engine bắt đầu xử lý job → trạng thái `Running` |
| 10 | `<MOD>.BC.EXPORT.PROGRESS` | Chức năng | Kết xuất | Engine cập nhật tiến độ (`progress %`) cho UI/Notification |
| 11 | `<MOD>.BC.EXPORT.SUCCESS` | Chức năng | Kết xuất | Sinh file thành công → trạng thái `Success`; lưu hash, kích thước, đường dẫn |
| 12 | `<MOD>.BC.EXPORT.FAILED` | Chức năng | Kết xuất | Job thất bại → trạng thái `Failed`; ghi reason (`TIMEOUT`/`TEMPLATE_ERROR`/`DATA_NOT_READY`/`OOM`/`DISK_FULL`/`SYSTEM`) |
| 13 | `<MOD>.BC.EXPORT.CANCEL` | Chức năng | Kết xuất | NSD/Quản trị hủy job đang chạy → trạng thái `Cancelled` |
| 14 | `<MOD>.BC.EXPORT.RETRY` | Chức năng | Kết xuất | Hệ thống/NSD retry job `Failed` → tạo run mới hoặc tiếp tục theo cấu hình |
| 15 | `<MOD>.BC.EXPORT.ASYNC.SWITCH` | Phân hệ | Kết xuất | Vượt ngưỡng sync (VAL-RPT-02) → tự chuyển sang async |
| 16 | `<MOD>.BC.HISTORY.VIEW` | Chức năng | Lịch sử kết xuất | NSD mở màn hình Lịch sử kết xuất |
| 17 | `<MOD>.BC.HISTORY.DETAIL` | Chức năng | Lịch sử kết xuất | NSD mở chi tiết một run (tham số, log, hash, kích thước) |
| 18 | `<MOD>.BC.DOWNLOAD.LINK` | Chức năng | Tải file | Sinh URL ký số TTL ngắn cho file của một run `Success` |
| 19 | `<MOD>.BC.DOWNLOAD.HIT` | Chức năng | Tải file | NSD tải file qua URL ký số; verify hash; ghi audit |
| 20 | `<MOD>.BC.PRINT.PREVIEW` | Chức năng | In | Mở preview in (PDF) với header/footer/người kết xuất |
| 21 | `<MOD>.BC.DISTRIBUTE.SEND` | Chức năng | Gửi phân phối | NSD gửi file/link tới danh sách người nhận; nếu vượt giới hạn email → đổi sang link tải |
| 22 | `<MOD>.BC.DISTRIBUTE.PARTIAL` | Chức năng | Gửi phân phối | Một số người nhận gửi lỗi → trạng thái run `Partial_Success`; retry email |
| 23 | `<MOD>.BC.SCHEDULE.CREATE` | Chức năng | Lập lịch | NSD tạo lịch tự động (`F-RPT-SCHED-ID`); validate cron whitelist + recipient |
| 24 | `<MOD>.BC.SCHEDULE.UPDATE` | Chức năng | Lập lịch | NSD cập nhật lịch (tần suất, người nhận, định dạng) |
| 25 | `<MOD>.BC.SCHEDULE.DELETE` | Chức năng | Lập lịch | NSD xoá lịch (soft-delete) |
| 26 | `<MOD>.BC.SCHEDULE.PAUSE` | Chức năng | Lập lịch | Tạm dừng lịch (giữ cấu hình, không trigger) |
| 27 | `<MOD>.BC.SCHEDULE.RESUME` | Chức năng | Lập lịch | Kích hoạt lại lịch đã `Paused` |
| 28 | `<MOD>.BC.SCHEDULE.TRIGGER` | Chức năng | Lập lịch | Scheduler kích hoạt theo cron → tạo run với chủ job = system + người nhận theo cấu hình |
| 29 | `<MOD>.BC.PRESET.SAVE` | Chức năng | Preset tham số | NSD lưu bộ tham số thành preset |
| 30 | `<MOD>.BC.PRESET.LOAD` | Chức năng | Preset tham số | NSD load preset → fill tham số vào form |
| 31 | `<MOD>.BC.PRESET.DELETE` | Chức năng | Preset tham số | NSD xoá preset |
| 32 | `<MOD>.BC.DRILLDOWN.OPEN` | Chức năng | Drill-down | NSD click ô tổng hợp → mở báo cáo chi tiết tương ứng, truyền tham số đã lọc |
| 33 | `<MOD>.BC.SIGN.APPLY` | Phân hệ | Ký số | Áp chữ ký số tổ chức + người kết xuất; gắn TSA; xác thực OCSP/CRL |
| 34 | `<MOD>.BC.NOTIFY.SEND` | Phân hệ | Notification | Gửi notification (in-app + email) khi kết xuất xong/lỗi/lịch tới hạn |
| 35 | `<MOD>.BC.FILE.ARCHIVE` | Phân hệ | Lưu trữ | File vượt TTL → chuyển archive cold storage; cập nhật marker `Expired` |
| 36 | `<MOD>.BC.FILE.PURGE` | Phân hệ | Lưu trữ | (Quản trị) Xoá file lưu trữ theo chính sách dài hạn; ghi audit |
| 37 | `<MOD>.BC.AUDIT.WRITE` | Chung | Audit | Ghi log: user, timestamp, IP, action, runId, tham số, kích thước, hash |
| 38 | `<MOD>.BC.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn khi đang kết xuất sync → job vẫn chạy nền; thông báo khi NSD đăng nhập lại |

## 11. State Machine (Trạng thái giao dịch)

> Báo cáo là chức năng read-only nên **không** dùng vòng đời Maker-Checker-Approver như CRUD. Thay vào đó có 2 vòng đời riêng:
> - **Vòng đời Run** (`F-RPT-RUN-ID`): `Start` → `Queued` → `Running` → (`Success` / `Failed` / `Cancelled` / `Partial_Success`) → `Expired` → `End`
> - **Vòng đời Schedule** (`F-RPT-SCHED-ID`): `Active` ↔ `Paused` → `Disabled` → `End`
>
> Quy ước: cột **Trạng thái** = trạng thái trước sự kiện; cột **Trạng thái mới** = trạng thái sau sự kiện. `(Bất kỳ)` = áp dụng cho mọi trạng thái nguồn.

### 11.1. Vòng đời Run (kết xuất một lần)

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | NSD bấm Kết xuất (`<MOD>.BC.EXPORT.RUN`) — async hoặc sync hàng đợi đầy | Start | Queued | Sinh `F-RPT-RUN-ID`, lưu tham số snapshot, đẩy vào queue; gửi MSG-INF-RPT-QUEUED |
| 2 | NSD bấm Kết xuất — sync trực tiếp | Start | Running | Bỏ qua queue, engine xử lý ngay; vẫn lưu run record |
| 3 | Engine bắt đầu xử lý (`<MOD>.BC.EXPORT.START`) | Queued | Running | Phân bổ tài nguyên; ghi log; gửi MSG-INF-RPT-RUNNING |
| 4 | Vượt ngưỡng sync (`<MOD>.BC.EXPORT.ASYNC.SWITCH`, VAL-RPT-02) | Running (sync) | Queued | Hủy stream sync; chuyển sang async; thông báo MSG-WRN-RPT-LARGE |
| 5 | Sinh file thành công (`<MOD>.BC.EXPORT.SUCCESS`) | Running | Success | Lưu file + hash SHA-256 + kích thước + đường dẫn; gửi MSG-OK-RPT-EXPORT + Notification MSG-INF-RPT-READY |
| 6 | Lỗi xử lý (`<MOD>.BC.EXPORT.FAILED`) | Running | Failed | Ghi reason (TIMEOUT/TEMPLATE_ERROR/DATA_NOT_READY/OOM/DISK_FULL/SYSTEM); cho phép retry (theo BIZ-RPT-04) |
| 7 | NSD/Quản trị hủy job (`<MOD>.BC.EXPORT.CANCEL`, VAL-RPT-09) | Queued / Running | Cancelled | Giải phóng tài nguyên; gửi MSG-OK-RPT-CANCEL; ghi audit |
| 8 | Hệ thống retry job (`<MOD>.BC.EXPORT.RETRY`) | Failed | Queued | Backoff theo BIZ-RPT-04; sinh run mới hoặc giữ runId cũ + tăng `F-RETRY-COUNT` |
| 9 | Gửi phân phối thành công đầy đủ (`<MOD>.BC.DISTRIBUTE.SEND`) | Success | Success | Không đổi trạng thái; ghi audit DISTRIBUTE |
| 10 | Một số người nhận lỗi (`<MOD>.BC.DISTRIBUTE.PARTIAL`) | Success | Partial_Success | Ghi danh sách người nhận lỗi; retry email N lần (BIZ-RPT-12); gửi MSG-WRN-RPT-PARTIAL-DISTRIBUTE |
| 11 | Retry phân phối thành công đầy đủ | Partial_Success | Success | Cập nhật trạng thái về `Success`; ghi audit |
| 12 | NSD tải file (`<MOD>.BC.DOWNLOAD.HIT`) | Success / Partial_Success | (Không đổi) | Verify hash (VAL-RPT-18); ghi audit DOWNLOAD; nếu lệch hash → MSG-ERR-RPT-HASH-MISMATCH |
| 13 | Ký số file (`<MOD>.BC.SIGN.APPLY`, VAL-RPT-21) | Success | Success | Cập nhật metadata signed=true, chứng thư, TSA; gửi MSG-OK-RPT-SIGN; ghi audit |
| 14 | File hết TTL (`<MOD>.BC.FILE.ARCHIVE`, VAL-RPT-16, BIZ-RPT-08) | Success / Partial_Success | Expired | Chuyển archive cold storage; xoá file khỏi hot storage; disable link tải |
| 15 | (Quản trị) Purge dài hạn (`<MOD>.BC.FILE.PURGE`) | Expired | End | Xoá vĩnh viễn theo chính sách lưu trữ; vẫn giữ run metadata cho audit |
| 16 | Hủy hậu kỳ — đóng vòng đời | Cancelled / Failed | End | Sau N ngày run record được mark closed; metadata vẫn giữ cho audit |
| 17 | (Vi phạm) Tải file không có quyền (VAL-RPT-14) | Success / Partial_Success | (Không đổi) | Reject; MSG-ERR-RPT-DOWNLOAD-PERM; ghi audit security |
| 18 | (Vi phạm) Hủy job không phải chủ job/Quản trị (VAL-RPT-09) | Queued / Running | (Không đổi) | Reject; MSG-ERR-RPT-CANCEL-PERM; ghi audit security |
| 19 | (Hệ thống) Phiên hết hạn (`<MOD>.BC.SESSION.TIMEOUT`) | Queued / Running | (Không đổi) | Job tiếp tục chạy nền; sau khi NSD đăng nhập lại → gửi notification trạng thái mới nhất |

### 11.2. Vòng đời Schedule (lịch kết xuất tự động)

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | NSD tạo lịch (`<MOD>.BC.SCHEDULE.CREATE`) | Start | Active | Sinh `F-RPT-SCHED-ID`; validate cron whitelist (VAL-RPT-10), recipient (VAL-RPT-11), giới hạn lịch (VAL-RPT-12); MSG-OK-RPT-SCHEDULE |
| 2 | NSD cập nhật lịch (`<MOD>.BC.SCHEDULE.UPDATE`) | Active / Paused | (Không đổi) | Cập nhật tần suất/recipient/định dạng; ghi audit oldValue→newValue |
| 3 | NSD tạm dừng lịch (`<MOD>.BC.SCHEDULE.PAUSE`) | Active | Paused | Scheduler bỏ qua các lần kích hoạt cho đến khi `Resume`; giữ nguyên cấu hình |
| 4 | NSD bật lại lịch (`<MOD>.BC.SCHEDULE.RESUME`) | Paused | Active | Tính lại `next_run_time` theo cron; ghi audit |
| 5 | Scheduler kích hoạt (`<MOD>.BC.SCHEDULE.TRIGGER`) | Active | Active | Tạo run mới (mục §11.1) với chủ job = system, người nhận theo cấu hình lịch |
| 6 | NSD xoá lịch (`<MOD>.BC.SCHEDULE.DELETE`) | Active / Paused | Disabled | Soft-delete; ngừng trigger; ghi audit DELETE |
| 7 | (Quản trị) Khôi phục lịch đã xoá | Disabled | Paused | Khôi phục cấu hình ở trạng thái Paused (yêu cầu NSD bật lại); ghi audit |
| 8 | Đóng vòng đời lịch | Disabled | End | Sau N ngày bản ghi schedule được mark closed |
| 9 | (Vi phạm) Vượt giới hạn lịch active (VAL-RPT-12) | — | (Không tạo) | Reject `CREATE`/`RESUME`; MSG-ERR-RPT-SCHED-LIMIT |
| 10 | (Vi phạm) Cron không whitelist (VAL-RPT-10) | — | (Không tạo) | Reject `CREATE`/`UPDATE`; MSG-ERR-RPT-SCHED-CRON |

### 11.3. Sơ đồ chuyển trạng thái

```
Vòng đời Run (F-RPT-RUN-ID)
                                     Cancel
        Export.Run            ┌──────────────────┐
   Start ───────────▶ Queued ─┤                  │
        Export.Run    │       └────▶ Cancelled ──┐
        (sync)        │  Start                   │
                      ▼                          │
                   Running ──────▶ Failed ───────┤
                      │            │ Retry       │
                      │            └────▶ Queued │
                      │                          │
                      ▼ Success                  │
                   Success ◀──────┐              │
                      │           │              │
            Distribute│Partial    │ Retry Email  │
                      ▼           │  Complete    │
              Partial_Success ────┘              │
                      │                          │
                      ▼ TTL Expire               │
                   Expired ──────▶ End ◀─────────┘
                                          (also from Failed/Cancelled
                                           after archive period)

Vòng đời Schedule (F-RPT-SCHED-ID)
                  Create                          Delete
   Start ───────────────▶ Active ◀──Resume── Paused ───▶ Disabled ──▶ End
                            │ ◀──── Pause ────┘            ▲
                            │                              │
                            └─────────── Delete ───────────┘
                            │
                            └─ Trigger ──▶ tạo Run (xem §11.1)
```

[Inference] Sơ đồ trên minh hoạ vòng đời điển hình cho chức năng Báo cáo. Tuỳ phân hệ có thể bổ sung trạng thái phụ (vd `Suspended` khi phát hiện lệch reconcile theo VAL-RPT-19, `Pending_Sign` khi chờ chứng thư ký số) hoặc bước phê duyệt phân phối trước khi gửi ra bên ngoài.

## 12. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `<MOD>.BC.LIST` — Form hiển thị danh sách báo cáo được phân quyền |
| 2 | `<MOD>.BC.FORM` — Form nhập tham số báo cáo |
| 3 | `<MOD>.BC.PREVIEW` — Preview báo cáo (HTML/ảnh trang đầu) |
| 4 | `<MOD>.BC.HISTORY` — Lịch sử kết xuất (theo user/đơn vị) |
| 5 | `<MOD>.BC.DOWNLOAD` — Cửa sổ tải file (URL ký số) |
| 6 | `<MOD>.BC.PRINT` — Preview in PDF |
| 7 | `<MOD>.BC.DISTRIBUTE` — Popup gửi phân phối (chọn người nhận, ghi chú) |
| 8 | `<MOD>.BC.SCHEDULE` — Quản lý lịch kết xuất tự động |
| 9 | `<MOD>.BC.PRESET` — Quản lý preset bộ tham số |
| 10 | `<MOD>.BC.TEMPLATE.ADMIN` — Quản trị template báo cáo (chỉ Quản trị) |
| 11 | `<MOD>.BC.LOOKUP.*` — Popup tra cứu danh mục (đơn vị, mã quỹ, sản phẩm…) |
| 12 | `<MOD>.BC.NOTIFY` — Thông báo kết xuất async hoàn tất (link tải) |
| 13 | `<MOD>.BC.DRILLDOWN` — Màn hình chi tiết khi drill-down từ báo cáo tổng hợp |
| 14 | `<MOD>.BC.LOG` — Lịch sử chi tiết của một run report |

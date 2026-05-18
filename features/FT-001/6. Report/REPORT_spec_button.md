# Đặc tả nút chức năng — Chức năng Báo cáo

> Tổng hợp các nút thao tác trên các màn hình của chức năng Báo cáo điển hình (`<MOD>.BC.LIST`, `<MOD>.BC.FORM`, `<MOD>.BC.PREVIEW`, `<MOD>.BC.HISTORY`, `<MOD>.BC.DOWNLOAD`, `<MOD>.BC.PRINT`, `<MOD>.BC.DISTRIBUTE`, `<MOD>.BC.SCHEDULE`, `<MOD>.BC.PRESET`, `<MOD>.BC.TEMPLATE.ADMIN`, `<MOD>.BC.LOOKUP.*`, `<MOD>.BC.NOTIFY`, `<MOD>.BC.DRILLDOWN`, `<MOD>.BC.LOG`). Mã sự kiện tham chiếu §10 và §11 của `BangDacTaChucNang_Report_DienHinh.md`. Mã VAL/MSG tham chiếu §8 và §9.

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt / Trigger | Phím tắt / Shortcut | Mô tả / Description | Ghi chú / Note |
|---|---|---|---|---|---|---|---|
| 1 | Mở báo cáo | Open Report | `<MOD>.BC.LIST.SELECT` | On click row / On click link `<Mã báo cáo>` | `Enter` | (1) Mở form tham số `<MOD>.BC.FORM` cho báo cáo được chọn, (2) Điền giá trị mặc định theo user/role/đơn vị | (1) Trên màn hình `<MOD>.BC.LIST`, (2) Chỉ hiển thị các báo cáo thuộc phạm vi phân quyền (VAL-RPT-01) |
| 2 | Lọc danh sách báo cáo | Filter | `<MOD>.BC.LIST.FILTER` | On change | – | Áp dụng bộ lọc tìm kiếm theo từ khoá/nhóm báo cáo | Trên `<MOD>.BC.LIST` |
| 3 | Xem trước | Preview | `<MOD>.BC.PREVIEW.OPEN` | On click | `Alt+P` | (1) Validate cơ bản tham số, (2) Render preview HTML/ảnh trang đầu báo cáo với dữ liệu thực | (1) Trên `<MOD>.BC.FORM`, (2) Disable khi form có lỗi validate cứng |
| 4 | Kết xuất | Export | `<MOD>.BC.EXPORT.RUN` | On click | `Ctrl+Enter` (hoặc `Ctrl+Shift+E`) | (1) Validate đầy đủ theo §8 (VAL-01, VAL-04, VAL-RPT-01…22), (2) Kiểm tra phân quyền theo đơn vị, (3) Sinh `F-RPT-RUN-ID`, (4) Auto sync/async theo VAL-RPT-02, (5) Lưu lịch sử kết xuất | (1) Trên `<MOD>.BC.FORM` và `<MOD>.BC.PREVIEW`, (2) Disable khi form invalid hoặc đang có job Running cùng tham số |
| 5 | Đặt lại tham số | Reset | (UI action) | On click | `F5` (hoặc `Ctrl+R`) | (1) Hiển thị MSG-CFM-RPT-RESET, (2) Xác nhận → xoá toàn bộ tham số về mặc định | Trên `<MOD>.BC.FORM` |
| 6 | Tra cứu danh mục | Lookup | (Mở popup `<MOD>.BC.LOOKUP.*`) | On click icon kính lúp | `F4` | (1) Mở popup tra cứu (đơn vị/NH-KB/người dùng/DVQHNS/mã quỹ/template…), (2) Chọn giá trị → trả về form | (1) Đi kèm TextBox + Lookup, (2) Hỗ trợ tìm kiếm, phân trang |
| 7 | Chọn (Lookup) | Select | (UI action, đóng popup) | On click | `Enter` | Trả giá trị đã chọn về form gọi; đóng popup | Trên `<MOD>.BC.LOOKUP.*` |
| 8 | Lưu preset | Save Preset | `<MOD>.BC.PRESET.SAVE` | On click | `Ctrl+S` | (1) Lưu bộ tham số hiện tại thành preset, (2) Validate VAL-RPT-13 (giới hạn N preset/user, unique tên) | Trên `<MOD>.BC.FORM` và `<MOD>.BC.PRESET` |
| 9 | Tải preset | Load Preset | `<MOD>.BC.PRESET.LOAD` | On click | `Ctrl+L` | (1) Load tham số từ preset đã lưu vào form, (2) Tăng `USE_COUNT`, cập nhật `LAST_USED_AT` | Trên `<MOD>.BC.FORM`; dropdown chọn preset |
| 10 | Xoá preset | Delete Preset | `<MOD>.BC.PRESET.DELETE` | On click | `Shift+Delete` | (1) Hiển thị xác nhận, (2) Xoá preset; preset mặc định không cho xoá nếu chưa gỡ ghim | Trên `<MOD>.BC.PRESET` |
| 11 | Lập lịch | Schedule | `<MOD>.BC.SCHEDULE.CREATE` | On click | `Alt+L` | (1) Mở popup `<MOD>.BC.SCHEDULE` form, (2) Mang theo bộ tham số hiện tại | Trên `<MOD>.BC.FORM` và `<MOD>.BC.SCHEDULE` (nút tạo mới) |
| 12 | Cập nhật lịch | Update Schedule | `<MOD>.BC.SCHEDULE.UPDATE` | On click | `Ctrl+S` (trong popup) | Cập nhật cấu hình lịch; validate VAL-RPT-10/11/12; ghi audit | Trên `<MOD>.BC.SCHEDULE` |
| 13 | Tạm dừng lịch | Pause | `<MOD>.BC.SCHEDULE.PAUSE` | On click | `Alt+U` | Tạm dừng scheduler; giữ nguyên cấu hình | Trên `<MOD>.BC.SCHEDULE` (row action); chỉ enable khi `SCHED_STATUS = Active` |
| 14 | Kích hoạt lại lịch | Resume | `<MOD>.BC.SCHEDULE.RESUME` | On click | `Alt+R` | Bật lại scheduler; tính lại `NEXT_RUN_AT` | Trên `<MOD>.BC.SCHEDULE` (row action); chỉ enable khi `SCHED_STATUS = Paused` |
| 15 | Chạy ngay | Run Now | `<MOD>.BC.SCHEDULE.TRIGGER` | On click | `F9` | (1) Kích hoạt scheduler ngay lập tức, (2) Sinh run mới với chủ job = user thao tác | Trên `<MOD>.BC.SCHEDULE` (row action); ghi audit `RUN_NOW = true` |
| 16 | Xoá lịch | Delete Schedule | `<MOD>.BC.SCHEDULE.DELETE` | On click | `Delete` | (1) Hiển thị MSG-CFM-RPT-DELETE-SCHED, (2) Xác nhận → soft-delete (`SCHED_STATUS = Disabled`) | Trên `<MOD>.BC.SCHEDULE` (row action); chỉ chủ lịch hoặc `RPT_ADMIN` |
| 17 | Xem lịch sử kết xuất | History | `<MOD>.BC.HISTORY.VIEW` | On click | `Alt+H` | Mở màn hình `<MOD>.BC.HISTORY` lọc theo user/đơn vị/báo cáo | Trên `<MOD>.BC.LIST` và `<MOD>.BC.FORM` |
| 18 | Xem chi tiết run | View Run Log | `<MOD>.BC.HISTORY.DETAIL` | On click | `F3` | Mở `<MOD>.BC.LOG` của run được chọn (thông tin + bảng event) | Trên `<MOD>.BC.HISTORY` (row action) |
| 19 | Tải file | Download | `<MOD>.BC.DOWNLOAD.LINK` → `<MOD>.BC.DOWNLOAD.HIT` | On click | `Ctrl+J` | (1) Sinh URL ký số TTL ≤ 15 phút (BIZ-RPT-09), (2) Verify hash trước khi trả (VAL-RPT-18), (3) Ghi audit DOWNLOAD | (1) Trên `<MOD>.BC.HISTORY` (row action) và `<MOD>.BC.DOWNLOAD`, (2) Chỉ enable khi `RUN_STATUS ∈ {Success, Partial_Success}` và NSD có quyền tải (VAL-RPT-14) |
| 20 | Sao chép URL tải | Copy URL | (UI action) | On click | `Ctrl+Shift+C` | Sao chép URL ký số vào clipboard | Trên `<MOD>.BC.DOWNLOAD`; tooltip cảnh báo TTL |
| 21 | Hủy job | Cancel Job | `<MOD>.BC.EXPORT.CANCEL` | On click | `Alt+C` | (1) Hiển thị MSG-CFM-RPT-CANCEL-JOB, (2) Xác nhận → đánh dấu run `Cancelled`, giải phóng tài nguyên (VAL-RPT-09, BIZ-RPT-14) | Trên `<MOD>.BC.HISTORY` (row action); chỉ chủ job hoặc `RPT_ADMIN`; chỉ enable khi `RUN_STATUS ∈ {Queued, Running}` |
| 22 | Thử lại | Retry | `<MOD>.BC.EXPORT.RETRY` | On click | `Alt+T` | Tạo run mới hoặc tiếp tục run cũ (theo `F-RETRY-COUNT`) với backoff theo BIZ-RPT-04 | Trên `<MOD>.BC.HISTORY` (row action); chỉ enable khi `RUN_STATUS = Failed` và chưa vượt giới hạn retry |
| 23 | In | Print | `<MOD>.BC.PRINT.PREVIEW` | On click | `Ctrl+P` | (1) Mở `<MOD>.BC.PRINT` với preview PDF, (2) Sau khi cấu hình → gửi lệnh tới máy in client | Trên `<MOD>.BC.HISTORY` (row action) và `<MOD>.BC.DOWNLOAD`; cần file `RUN_STATUS = Success` |
| 24 | Gửi phân phối | Distribute | `<MOD>.BC.DISTRIBUTE.SEND` | On click | `Alt+D` | (1) Mở popup `<MOD>.BC.DISTRIBUTE`, (2) Nhập người nhận + tiêu đề/nội dung, (3) Gửi qua Email/Link/In-app/SFTP; auto chuyển link khi vượt VAL-RPT-17 | Trên `<MOD>.BC.HISTORY` (row action) và `<MOD>.BC.DOWNLOAD`; ghi audit DISTRIBUTE |
| 25 | Ký số file | Sign | `<MOD>.BC.SIGN.APPLY` | On click | `F8` | (1) Validate chứng thư + OCSP/CRL (VAL-RPT-21), (2) Áp chữ ký số tổ chức + người kết xuất + TSA (BIZ-RPT-07), (3) Cập nhật metadata `SIGNED = true` | Trên `<MOD>.BC.HISTORY` (row action) và `<MOD>.BC.DOWNLOAD`; chỉ enable khi `OUTPUT_FORMAT = PDF` và template hỗ trợ ký |
| 26 | Drill-down | Drill-down | `<MOD>.BC.DRILLDOWN.OPEN` | On click ô tổng hợp | `Ctrl+D` | (1) Mở báo cáo chi tiết tương ứng, (2) Truyền tham số đã lọc + ngữ cảnh dòng được click | Trên `<MOD>.BC.PREVIEW` và file kết xuất HTML; ẩn link khi VAL-RPT-20 thiếu mapping |
| 27 | Đính kèm template | Upload Template | (Upload) | On select file | `Ctrl+U` | (1) Upload file template (.docx/.xlsx/.html/.jrxml ≤ 20MB), (2) Quét AV, (3) Validate placeholder theo schema | Trên `<MOD>.BC.TEMPLATE.ADMIN`; chỉ `RPT_ADMIN` |
| 28 | Kích hoạt template | Activate Template | (UI action) | On click | `Alt+A` | Chuyển `TEMPLATE_STATUS = Active`; deprecate các phiên bản cũ cùng `TEMPLATE_CODE` | Trên `<MOD>.BC.TEMPLATE.ADMIN`; ghi audit |
| 29 | Ngừng dùng template | Deprecate Template | (UI action) | On click | `Alt+X` | Chuyển `TEMPLATE_STATUS = Deprecated`; vẫn xem nhưng không cho phép gán mới | Trên `<MOD>.BC.TEMPLATE.ADMIN`; chỉ `RPT_ADMIN` |
| 30 | Thử render template | Test Render | (UI action) | On click | `Alt+M` | (1) Render thử template với dữ liệu mẫu, (2) Hiển thị output preview + cảnh báo placeholder thiếu | Trên `<MOD>.BC.TEMPLATE.ADMIN` |
| 31 | Đánh dấu đã đọc | Mark Read | (UI action) | On click | `Alt+K` | Đánh dấu `READ_STATUS = Read`; cập nhật bộ đếm Notification Center | Trên `<MOD>.BC.NOTIFY` |
| 32 | Mở chi tiết notification | Open Notification | (UI action → mở `<MOD>.BC.LOG`) | On click | `Enter` | (1) Mở chi tiết run liên quan, (2) Tự đánh dấu đã đọc | Trên `<MOD>.BC.NOTIFY` |
| 33 | Tạm hoãn thông báo | Snooze | (UI action) | On click | `Alt+Z` | Ẩn thông báo trong N giờ; sau khoảng đó hiện lại | Trên `<MOD>.BC.NOTIFY` |
| 34 | Xoá thông báo | Delete Notification | (UI action) | On click | `Shift+Delete` | Xoá khỏi Notification Center; vẫn giữ trong DB nếu thuộc loại audit | Trên `<MOD>.BC.NOTIFY` |
| 35 | Quay lại | Back | (UI action) | On click | `Esc` | Đóng popup/quay lại màn hình trước (BC.PREVIEW → BC.FORM; BC.DRILLDOWN → báo cáo nguồn) | Trên `<MOD>.BC.PREVIEW`, `<MOD>.BC.DRILLDOWN`, `<MOD>.BC.DOWNLOAD`, `<MOD>.BC.PRINT`, `<MOD>.BC.DISTRIBUTE` |
| 36 | Đóng | Close | (UI action) | On click | `Esc` | Đóng popup; nếu form đang dirty → hỏi xác nhận | Tất cả popup trong chức năng Báo cáo |
| 37 | Sao chép traceId | Copy TraceId | (UI action) | On click | `Ctrl+Alt+C` | Sao chép `TRACE_ID` để gửi cho team kỹ thuật | Trên `<MOD>.BC.LOG` |
| 38 | Xuất log run | Export Run Log | (UI action — CSV) | On click | `Ctrl+Shift+E` | Xuất bảng event của run sang CSV; ghi audit | Trên `<MOD>.BC.LOG`; chỉ `RPT_ADMIN` hoặc chủ run |
| 39 | Yêu cầu chia sẻ preset | Share Preset | (UI action) | On click | `Alt+S` | (1) Gửi yêu cầu chia sẻ tới `RPT_ADMIN` (BIZ-RPT-11), (2) Trạng thái `SHARE_STATUS = Pending` | Trên `<MOD>.BC.PRESET` |
| 40 | Sao chép preset | Copy Preset | (UI action) | On click | `Ctrl+Shift+C` | Tạo bản sao của preset hiện tại với tên `<Tên> - Copy` | Trên `<MOD>.BC.PRESET` |
| 41 | Refresh danh sách | Refresh | (UI action) | On click | `F5` | Tải lại danh sách báo cáo / lịch / run / preset / template (theo màn đang mở) | Trên mọi màn hình danh sách của Báo cáo |

## Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
|---|---|
| 1 | Mỗi nút phải kiểm tra quyền theo vai trò (Người lập / Người kiểm soát / Người phê duyệt / Người tra cứu / `RPT_ADMIN`) và phạm vi phân quyền (đơn vị, sản phẩm, mã quỹ) trước khi hiển thị; thiếu quyền → ẩn nút (hoặc disable + tooltip MSG-ERR-PERMISSION) |
| 2 | Nút **Kết xuất / Xem trước**: disable khi form có lỗi validate cứng (VAL-01, VAL-04, VAL-RPT-01…); enable lại khi tất cả lỗi đã fix |
| 3 | Nút **Hủy job**: chỉ enable khi `RUN_STATUS ∈ {Queued, Running}` (VAL-RPT-09, BIZ-RPT-14); chỉ chủ job hoặc `RPT_ADMIN`; vi phạm → MSG-ERR-RPT-CANCEL-PERM + ghi audit security |
| 4 | Nút **Tải file**: chỉ enable khi `RUN_STATUS ∈ {Success, Partial_Success}` **và** NSD là chủ run (hoặc được chia sẻ) — VAL-RPT-14; chỉ sinh URL ký số TTL ≤ 15 phút (BIZ-RPT-09, VAL-RPT-15); hết hạn → MSG-ERR-RPT-LINK-EXPIRED |
| 5 | Nút **Ký số**: chỉ enable khi `OUTPUT_FORMAT = PDF` + template hỗ trợ trường ký + chứng thư hợp lệ + OCSP/CRL phản hồi `good` (VAL-RPT-21); thất bại → MSG-ERR-RPT-SIGN-CERT |
| 6 | Nút **Gửi phân phối**: tự đổi sang gửi link tải khi `FILE_SIZE > MAX_EMAIL` (VAL-RPT-17, BIZ-RPT-09); cảnh báo MSG-WRN-RPT-EMAIL-LIMIT; bắt buộc nhập `SEND_REASON` với báo cáo nhạy cảm |
| 7 | Nút **Lập lịch / Cập nhật lịch**: validate cron whitelist (VAL-RPT-10), ≥ 1 recipient hợp lệ (VAL-RPT-11), ≤ N lịch/user (VAL-RPT-12); vi phạm → MSG-ERR-RPT-SCHED-CRON / MSG-ERR-RPT-SCHED-RECIPIENT / MSG-ERR-RPT-SCHED-LIMIT |
| 8 | Nút **Run Now / Pause / Resume / Xoá lịch**: chỉ chủ lịch hoặc `RPT_ADMIN`; enable theo `SCHED_STATUS` (Pause khi Active; Resume khi Paused; xoá khi Active/Paused) — §11.2 |
| 9 | Nút **Lưu / Xoá preset**: kiểm tra VAL-RPT-13 (giới hạn N preset/user, unique tên); preset chia sẻ chỉ xoá được khi đã `Reject` hoặc chưa `Approved` |
| 10 | Nút **Drill-down**: ẩn khi VAL-RPT-20 thiếu mapping; xuất ra PDF không nhúng hyperlink — chỉ HTML/Excel render link |
| 11 | Mọi nút có ảnh hưởng đến file/dữ liệu (Kết xuất, Tải, Phân phối, Ký số, Lập lịch, Xoá lịch, Xoá preset, Upload template) phải ghi audit `<MOD>.BC.AUDIT.WRITE` gồm user, timestamp, IP, action, runId/schedId, kích thước, hash file (BIZ-RPT-10) |
| 12 | Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server cho `<MOD>.BC.EXPORT.RUN`, `<MOD>.BC.DISTRIBUTE.SEND`, `<MOD>.BC.SCHEDULE.CREATE` |
| 13 | Khi phiên hết hạn (`<MOD>.BC.SESSION.TIMEOUT`) → mọi nút disable, MSG-ERR-SESSION; với job sync đang chạy thì job vẫn tiếp tục nền, sau khi đăng nhập lại NSD nhận Notification trạng thái mới nhất |
| 14 | Mọi nút hiển thị tooltip giải thích khi disable (lý do không cho thao tác); hỗ trợ accessibility (ARIA label, phím tắt); phím tắt hiển thị trong tooltip (vd "Kết xuất (Ctrl+Enter)") |
| 15 | Phím tắt nhóm lịch (`F9` Run Now, `Alt+U` Pause, `Alt+R` Resume, `Delete` Xoá) chỉ active trên `<MOD>.BC.SCHEDULE` khi có dòng được chọn; phím `F3`, `F8`, `Ctrl+J`, `Alt+C`, `Alt+T`, `Alt+D` chỉ active trên `<MOD>.BC.HISTORY` khi có run được chọn |
| 16 | Báo cáo nhạy cảm (chứa PII/số tiền lớn) chưa được `RPT_UNMASK`: nút **Tải / In / Gửi phân phối** bắt buộc tick `CONFIRM_TERMS` và nhập lý do (VAL-RPT-07, BIZ-RPT-06) |
| 17 | Khi `RUN_STATUS = Expired` (VAL-RPT-16): tất cả nút thao tác trên file (Tải/In/Phân phối/Ký số) đều disable; chỉ cho phép xem metadata + nút **Thử lại** sinh run mới |

## Quy ước phím tắt

- **Nhóm tham số & kết xuất (Form)**: `Alt+P` (Xem trước – Preview), `Ctrl+Enter` / `Ctrl+Shift+E` (Kết xuất – Export), `F5` / `Ctrl+R` (Đặt lại tham số – Reset), `Esc` (Đóng/Quay lại).
- **Nhóm preset**: `Ctrl+S` (Lưu preset – Save), `Ctrl+L` (Tải preset – Load), `Ctrl+Shift+C` (Sao chép preset), `Alt+S` (Yêu cầu chia sẻ – Share), `Shift+Delete` (Xoá preset).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường có icon kính lúp; `Enter` chọn giá trị; `Esc` đóng popup.
- **Nhóm lịch sử run (HISTORY)**: `F3` (Xem chi tiết – View Log), `Ctrl+J` (Tải – Download), `Ctrl+P` (In – Print), `Alt+D` (Gửi phân phối – Distribute), `F8` (Ký số – Sign), `Alt+C` (Hủy job – Cancel), `Alt+T` (Thử lại – reTry), `Alt+H` (Mở History – History).
- **Nhóm lập lịch (SCHEDULE)**: `Alt+L` (Lập lịch – schedule), `Ctrl+S` (Cập nhật – Update), `F9` (Chạy ngay – Run now), `Alt+U` (Tạm dừng – paUse), `Alt+R` (Kích hoạt lại – Resume), `Delete` (Xoá – Delete).
- **Nhóm quản trị template (Admin)**: `Ctrl+U` (Upload template), `Alt+A` (Kích hoạt – Activate), `Alt+X` (Ngừng dùng – deactivate), `Alt+M` (Thử render – test Render).
- **Nhóm thông báo (NOTIFY)**: `Alt+K` (Đánh dấu đã đọc – marK read), `Alt+Z` (Tạm hoãn – snooZe), `Enter` (Mở chi tiết), `Shift+Delete` (Xoá thông báo).
- **Nhóm drill-down**: `Ctrl+D` (Drill-down), `Esc` (Quay lại báo cáo nguồn).
- **Nhóm log/troubleshoot (LOG)**: `Ctrl+Alt+C` (Sao chép traceId), `Ctrl+Shift+E` (Xuất log CSV).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

## Rà soát nhất quán với `BangDacTaChucNang_Report_DienHinh.md`

| Hạng mục | Tham chiếu trong spec_button | Đối chiếu Report spec | Kết quả |
|---|---|---|---|
| Quy tắc kiểm tra dữ liệu | VAL-01, VAL-04, VAL-RPT-01, VAL-RPT-02, VAL-RPT-07, VAL-RPT-09, VAL-RPT-10, VAL-RPT-11, VAL-RPT-12, VAL-RPT-13, VAL-RPT-14, VAL-RPT-15, VAL-RPT-16, VAL-RPT-17, VAL-RPT-18, VAL-RPT-20, VAL-RPT-21 | §8 (30 mã VAL gồm VAL-01…10 chung và VAL-RPT-01…22) | OK – tất cả mã VAL tham chiếu đều tồn tại trong §8 |
| Danh sách thông báo | MSG-ERR-PERMISSION, MSG-ERR-SESSION, MSG-ERR-RPT-LINK-EXPIRED, MSG-ERR-RPT-DOWNLOAD-PERM, MSG-ERR-RPT-CANCEL-PERM, MSG-ERR-RPT-SCHED-CRON, MSG-ERR-RPT-SCHED-RECIPIENT, MSG-ERR-RPT-SCHED-LIMIT, MSG-ERR-RPT-SIGN-CERT, MSG-CFM-RPT-RESET, MSG-CFM-RPT-CANCEL-JOB, MSG-CFM-RPT-DELETE-SCHED, MSG-WRN-RPT-EMAIL-LIMIT, MSG-OK-RPT-EXPORT, MSG-OK-RPT-DOWNLOAD, MSG-OK-RPT-PRINT, MSG-OK-RPT-DISTRIBUTE, MSG-OK-RPT-SCHEDULE, MSG-OK-RPT-PRESET, MSG-OK-RPT-SIGN, MSG-OK-RPT-CANCEL | §9 (50 mã MSG) | OK – tất cả mã MSG tham chiếu đều tồn tại trong §9 |
| Danh sách màn hình | `<MOD>.BC.LIST`, `<MOD>.BC.FORM`, `<MOD>.BC.PREVIEW`, `<MOD>.BC.HISTORY`, `<MOD>.BC.DOWNLOAD`, `<MOD>.BC.PRINT`, `<MOD>.BC.DISTRIBUTE`, `<MOD>.BC.SCHEDULE`, `<MOD>.BC.PRESET`, `<MOD>.BC.TEMPLATE.ADMIN`, `<MOD>.BC.LOOKUP.*`, `<MOD>.BC.NOTIFY`, `<MOD>.BC.DRILLDOWN`, `<MOD>.BC.LOG` | §12 (14 màn hình) | OK – tất cả màn hình tham chiếu đã có trong §12 |
| Mã sự kiện | `<MOD>.BC.LIST.SELECT/FILTER`, `<MOD>.BC.FORM.OPEN`, `<MOD>.BC.PREVIEW.OPEN`, `<MOD>.BC.EXPORT.RUN/START/SUCCESS/FAILED/CANCEL/RETRY/ASYNC.SWITCH`, `<MOD>.BC.HISTORY.VIEW/DETAIL`, `<MOD>.BC.DOWNLOAD.LINK/HIT`, `<MOD>.BC.PRINT.PREVIEW`, `<MOD>.BC.DISTRIBUTE.SEND/PARTIAL`, `<MOD>.BC.SCHEDULE.CREATE/UPDATE/DELETE/PAUSE/RESUME/TRIGGER`, `<MOD>.BC.PRESET.SAVE/LOAD/DELETE`, `<MOD>.BC.DRILLDOWN.OPEN`, `<MOD>.BC.SIGN.APPLY`, `<MOD>.BC.NOTIFY.SEND`, `<MOD>.BC.AUDIT.WRITE`, `<MOD>.BC.SESSION.TIMEOUT` | §10 (38 sự kiện) | OK – tất cả Event ID tham chiếu đều tồn tại trong §10 |
| Quy tắc nghiệp vụ | BIZ-RPT-01 (phân quyền), BIZ-RPT-04 (timeout/retry), BIZ-RPT-06 (mask PII), BIZ-RPT-07 (ký số), BIZ-RPT-09 (URL ký số TTL), BIZ-RPT-10 (audit), BIZ-RPT-11 (preset chia sẻ), BIZ-RPT-14 (hủy job) | §7 (16 BIZ-RPT) | OK – các BIZ tham chiếu đều có trong §7 |
| Trạng thái run/lịch | `Queued`, `Running`, `Success`, `Failed`, `Cancelled`, `Partial_Success`, `Expired` (Run); `Active`, `Paused`, `Disabled` (Schedule) | §11.1 (19 transitions) và §11.2 (10 transitions) | OK – các trạng thái tham chiếu đều có trong sơ đồ |

[Inference] Bộ phím tắt được thiết kế để **không xung đột** với bộ CRUD (`spec_button.md`): các phím dùng chung (`F4`, `F5`, `Ctrl+P`, `Ctrl+J`, `Ctrl+S`, `Esc`, `Enter`, `Delete`, `Shift+Delete`, `Ctrl+Shift+C`, `Ctrl+Shift+E`) giữ nguyên ngữ nghĩa; các phím riêng cho chức năng Báo cáo (`Alt+L`, `Alt+D`, `Alt+U`, `Alt+T`, `Alt+M`, `Alt+K`, `Alt+Z`, `Ctrl+Enter`, `Ctrl+L`, `Ctrl+D`, `Ctrl+Alt+C`) được chọn theo nguyên tắc mnemonic VI/EN (L=schedule/Load, D=Distribute/Drill, U=paUse, T=reTry, M=test Render, K=marK, Z=snooZe). Khi triển khai cần `preventDefault` trên các phím dễ xung đột với trình duyệt (`Ctrl+L`, `Ctrl+D`).

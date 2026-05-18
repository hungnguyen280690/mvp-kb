# Đặc tả trường dữ liệu — Chức năng Báo cáo

> Đặc tả trường cho các màn hình thuộc chức năng Báo cáo theo §12 `BangDacTaChucNang_Report_DienHinh.md`. Mã sự kiện/validate/thông báo tham chiếu trực tiếp file đặc tả chức năng Báo cáo (`<MOD>.BC.*`). Quy ước cột:
>
> - **Loại**: kiểu hiển thị (Dropdown, TextBox, Date Picker, Number Field, Checkbox, Radio, TextArea, Label, Multi-select, File Upload, Tree-select, Lookup…).
> - **Bắt buộc**: `Y` (Yes), `N` (No), `C` (Conditional — bắt buộc khi điều kiện đi kèm thoả mãn).
> - **Loại dữ liệu**: String, Number, Date, DateTime, Boolean, JSON, Binary…
> - **Mô tả/Ràng buộc**: ghi rõ VAL/MSG/Event tham chiếu khi có.

---

## 1. Màn hình `<MOD>.BC.LIST` — Bảng kê danh sách Lệnh thanh toán

> Báo cáo "Bảng kê danh sách Lệnh thanh toán" — kết xuất danh sách các YCTT/bút toán theo bộ tham số do NSD nhập. Dữ liệu cột tham chiếu `spec_field.md` §2 (`<MOD>.LIST`) của phân hệ Thanh toán. Mã báo cáo gợi ý: `RPT-TT-LIST-001`.

### 1.1. Khu vực tham số đầu vào (mặt báo cáo / header parameters)

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã báo cáo | RPT_CODE | Label | – | `RPT-TT-LIST-001` | String | Read-only; hiển thị ở header file kết xuất. |
| Tên báo cáo | RPT_NAME | Label | – | `Bảng kê danh sách Lệnh thanh toán` | String | Read-only; bilingual (VI/EN) theo VAL-RPT-08. |
| Đơn vị báo cáo | ORG_CODE | TextBox + Lookup `<MOD>.BC.LOOKUP.ORG` | Y | Đơn vị của user đăng nhập | String | Phải thuộc phạm vi phân quyền (VAL-RPT-01); F4 mở lookup. |
| Kênh | Channel | Dropdown | N | Tất cả | String | Danh mục: Liên ngân hàng / Thanh toán song phương / Tất cả. |
| Loại lệnh | Transaction Type | Dropdown | N | Tất cả | String | Cascading theo Kênh (VAL-06). |
| Loại GD (LNH) | LNH_Transaction_Type | Dropdown | C | Tất cả | String | Chỉ hiển thị khi Kênh = Liên ngân hàng. |
| Trạng thái | F-STATUS | Multi-select | N | Tất cả ≠ Deleted | String | Danh mục: Draft, Ready_For_Approval, Pending_Approver, Approved, Returned_To_Maker, Rejected, Deleted. |
| Loại ngày lọc | DATE_FIELD | Dropdown | Y | Ngày lập | String | Ngày lập / Ngày thanh toán / Ngày kiểm soát / Ngày phê duyệt. |
| Từ ngày | FROM_DATE | Date Picker | Y | Ngày hiện tại − 7 | Date | `dd/mm/yyyy`; theo VAL-04. |
| Đến ngày | TO_DATE | Date Picker | Y | Ngày hiện tại | Date | ≥ Từ ngày; khoảng cách ≤ 366 ngày (VAL-04). |
| Loại tiền | CURRENCY_CODE | Dropdown | N | Tất cả | String | Danh mục tiền tệ. |
| Số tiền từ | AMOUNT_FROM | Number Field | N |  | Number | Định dạng nhóm hàng nghìn. |
| Số tiền đến | AMOUNT_TO | Number Field | N |  | Number | ≥ Số tiền từ. |
| NH/KB chuyển | SENDER | TextBox + Lookup | N |  | String | F4 mở `<MOD>.BC.LOOKUP.BANK`. |
| NH/KB nhận | RECEIVER | TextBox + Lookup | N |  | String | F4 mở `<MOD>.BC.LOOKUP.BANK`. |
| DVQHNS | GL_Segment3 | TextBox + Lookup | N |  | Varchar(7) | Lọc theo DVQHNS phát sinh trong dòng chi tiết. |
| Người lập | CREATED_BY | TextBox + Lookup `<MOD>.BC.LOOKUP.USER` | N |  | String |  |
| Sắp xếp | SORT_BY | Dropdown | Y | Ngày lập DESC | String | Ngày lập / Ngày TT / Số tiền — ASC/DESC. |
| Tuỳ chọn nhóm | GROUP_BY | Dropdown | N | Không nhóm | String | Không nhóm / Theo trạng thái / Theo kênh / Theo NH-KB chuyển / Theo loại tiền. |
| Hiển thị tổng phụ | SHOW_SUBTOTAL | Checkbox | N | On | Boolean | Hiển thị dòng tổng phụ khi có nhóm. |
| Định dạng | OUTPUT_FORMAT | Radio | Y | PDF | String | PDF / XLSX / CSV; theo VAL-RPT-06. |
| Ngôn ngữ | LANG | Radio | Y | VI | String | VI / EN (VAL-RPT-08). |
| Người kết xuất | EXPORTED_BY | Label | – | User hiện tại | String | Auto; hiển thị ở footer file. |
| Thời gian kết xuất | EXPORTED_AT | Label | – | Thời gian hệ thống | DateTime | `dd/mm/yyyy hh:MM:ss`; footer file. |

### 1.2. Khu vực cột dữ liệu báo cáo (report body)

| STT | Trường | Trường (ENG) | Loại hiển thị | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|
| 1 | STT | SEQ_NO | Number (right) | Number | Auto-increment trong file. |
| 2 | Số YCTT/Số bút toán | REF_NO | Text | String | Có thể là hyperlink drill-down tới `<MOD>.BC.DRILLDOWN` (PDF không hyperlink). |
| 3 | Kênh | Channel | Text | String |  |
| 4 | Loại lệnh | Transaction Type | Text | String |  |
| 5 | Loại GD (LNH) | LNH_Transaction_Type | Text | String | Trống khi Kênh ≠ LNH. |
| 6 | Ngày lập | CREATED_DATE | Date | DateTime | `dd/mm/yyyy hh:MM`. |
| 7 | Ngày thanh toán | PAYMENT_DATE | Date | Date | `dd/mm/yyyy`. |
| 8 | NH/KB chuyển | SENDER | Text | String |  |
| 9 | Tên người chuyển | SENDER_NAME | Text | String | Truncate ≥ 30 ký tự ở PDF. |
| 10 | TK người chuyển | SENDER_GL_Segment2 | Text | String |  |
| 11 | NH/KB nhận | RECEIVER | Text | String |  |
| 12 | Tên người nhận | RECEIVER_NAME | Text | String | Truncate ≥ 30 ký tự ở PDF. |
| 13 | TK người nhận | RECEIVER_GL_Segment2 | Text | String |  |
| 14 | Số tiền chuyển | AMOUNT | Number (right, 2 dec, nhóm 3) | Number |  |
| 15 | Loại tiền | CURRENCY_CODE | Text (center) | String |  |
| 16 | Tỷ giá | Exchange_Rate | Number (right, 4 dec) | Number | Trống khi VND. |
| 17 | Số chứng từ gốc | ORGIN_NUM | Text | String |  |
| 18 | Nội dung TT | DESCRIPTION | Text (wrap) | String | Wrap dòng PDF; ≤ 60 ký tự trên XLSX hoặc autofit. |
| 19 | Trạng thái | F-STATUS | Text (Badge ở PDF render) | String | Hiển thị theo bộ màu chuẩn. |
| 20 | Người lập | CREATED_BY | Text | String |  |
| 21 | Người kiểm soát | CHECKED_BY | Text | String |  |
| 22 | Người phê duyệt | APPROVED_BY | Text | String |  |
| 23 | F-VER | F-VER | Number (right) | Number |  |

### 1.3. Khu vực tổng kết / chân báo cáo (summary & footer)

| Trường | Trường (ENG) | Loại | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|
| Tổng số bản ghi | TOTAL_RECORD | Label | Number | Tổng số dòng dữ liệu (đã loại Deleted nếu không tick). |
| Tổng tiền theo loại tiền | TOTAL_AMOUNT_BY_CCY | Bảng phụ | Number | Liệt kê tổng `AMOUNT` theo từng `CURRENCY_CODE`; làm tròn 2 chữ số. |
| Tổng theo trạng thái | TOTAL_BY_STATUS | Bảng phụ | Number | Số bản ghi theo F-STATUS (chỉ khi `GROUP_BY = Theo trạng thái`). |
| Watermark | WATERMARK | Image/Label | String | `BẢN NHÁP` nếu chứa bản ghi Draft/Returned_To_Maker; `CHÍNH THỨC` khi tất cả ≥ Ready_For_Approval; `KIỂM TRA SỐ LIỆU` khi VAL-RPT-19 cảnh báo. |
| Người kết xuất | EXPORTED_BY | Label | String | User hiện tại; ghi audit `<MOD>.BC.EXPORT.RUN`. |
| Thời gian kết xuất | EXPORTED_AT | Label | DateTime | Server time. |
| Mã run | F-RPT-RUN-ID | Label | String | Hiển thị ở footer để truy ngược lịch sử. |
| Hash file | FILE_HASH | Label | String | SHA-256 (BIZ-RPT-16, VAL-RPT-18); hiển thị 8 ký tự đầu trên PDF. |
| Số trang | PAGE_X_OF_Y | Label | String | Format `Trang X / Y` ở footer PDF. |
| Chữ ký số | DIGITAL_SIGN | Block | – | Khi BIZ-RPT-07 yêu cầu; gồm CN, TSA time, Serial chứng thư. |

---

## 2. Đặc tả trường cho các màn hình bổ sung

### 2.1. Màn hình `<MOD>.BC.FORM` — Form nhập tham số báo cáo

> Form chung để NSD nhập tham số trước khi kết xuất bất kỳ báo cáo nào. Các trường tham số nghiệp vụ sẽ được sinh động theo `<Mã báo cáo>`; bảng dưới mô tả khung tham số/điều khiển dùng chung.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã báo cáo | RPT_CODE | Label | – | Theo lựa chọn ở BC.LIST | String | Read-only. |
| Tên báo cáo | RPT_NAME | Label | – | Tự lấy | String | Read-only; bilingual. |
| Đơn vị áp dụng | ORG_CODE | TextBox + Lookup | Y | Đơn vị user | String | VAL-RPT-01. |
| Kỳ báo cáo | PERIOD | Dropdown / Date | Y | Kỳ hiện tại | String/Date | Danh mục: Ngày / Tuần / Tháng / Quý / Năm / Tuỳ chọn; chuyển sang DateRange khi chọn Tuỳ chọn. |
| Từ ngày | FROM_DATE | Date Picker | C |  | Date | Khi Kỳ = Tuỳ chọn; VAL-04. |
| Đến ngày | TO_DATE | Date Picker | C |  | Date | Khi Kỳ = Tuỳ chọn; ≥ FROM_DATE. |
| Kỳ so sánh | COMPARE_PERIOD | Dropdown | N | Không so sánh | String | Áp dụng theo VAL-RPT-22; thiếu snapshot → MSG-WRN-RPT-PREV-PERIOD-MISSING. |
| Loại tiền | CURRENCY_CODE | Dropdown | N | Tất cả | String |  |
| Bộ lọc nghiệp vụ | DYNAMIC_PARAMS | Khối động | C |  | JSON | Sinh động theo metadata báo cáo; mỗi tham số có định nghĩa kiểu/ràng buộc riêng. |
| Định dạng đầu ra | OUTPUT_FORMAT | Radio | Y | PDF | String | PDF / XLSX / CSV / DOCX theo VAL-RPT-06. |
| Ngôn ngữ | LANG | Radio | Y | VI | String | VI / EN. |
| Template | TEMPLATE_CODE | Dropdown | Y | Template mặc định | String | Whitelist theo VAL-RPT-05. |
| Che mask PII | MASK_PII | Checkbox | Y | On | Boolean | Off chỉ khi NSD có quyền `RPT_UNMASK` (VAL-RPT-07). |
| Bao gồm biểu đồ | INCLUDE_CHART | Checkbox | N | Off | Boolean | Disable khi `OUTPUT_FORMAT = CSV`. |
| Chế độ chạy | RUN_MODE | Radio | Y | Auto | String | Auto / Sync / Async; Auto chuyển theo VAL-RPT-02. |
| Người nhận thông báo | NOTIFY_EMAIL | Multi-input email | N | Email user hiện tại | String | Áp dụng cho async; gửi MSG-INF-RPT-READY khi xong. |
| Ghi chú | NOTE | TextArea | N |  | String | ≤ 500 ký tự. |
| Lưu preset | SAVE_AS_PRESET | Checkbox | N | Off | Boolean | Trigger nhập `Tên preset`. |
| Tên preset | PRESET_NAME | TextBox | C |  | String | Khi `SAVE_AS_PRESET = On`; unique theo user (VAL-RPT-13). |
| Tải preset | LOAD_PRESET | Dropdown | N |  | String | Load `<MOD>.BC.PRESET`. |
| Nút **Xem trước** | BTN_PREVIEW | Button | – |  | – | Event `<MOD>.BC.PREVIEW.OPEN`. |
| Nút **Kết xuất** | BTN_EXPORT | Button | – |  | – | Event `<MOD>.BC.EXPORT.RUN`. |
| Nút **Reset** | BTN_RESET | Button | – |  | – | Trigger MSG-CFM-RPT-RESET. |
| Nút **Lập lịch** | BTN_SCHEDULE | Button | – |  | – | Mở `<MOD>.BC.SCHEDULE`. |

### 2.2. Màn hình `<MOD>.BC.PREVIEW` — Xem trước báo cáo

> Render bản preview HTML hoặc ảnh trang đầu của báo cáo với tham số NSD đã nhập (chưa lưu run lịch sử).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã báo cáo | RPT_CODE | Label | – | Auto | String |  |
| Tên báo cáo | RPT_NAME | Label | – | Auto | String |  |
| Tham số đã chọn | PARAM_SNAPSHOT | Label / Tooltip | – | Auto | JSON | Hiển thị tóm tắt tham số (Đơn vị, Kỳ, Định dạng…). |
| Khung xem trước | PREVIEW_PANE | Iframe / Image | – |  | HTML / Image | Render trang 1 (PDF/HTML) hoặc 50 dòng đầu (XLSX/CSV). |
| Số trang ước lượng | EST_PAGES | Label | – | Auto | Number | Hỗ trợ NSD ước lượng async hay sync. |
| Số dòng ước lượng | EST_ROWS | Label | – | Auto | Number | Cảnh báo MSG-WRN-RPT-LARGE khi vượt VAL-RPT-02. |
| Cảnh báo dữ liệu rỗng | EMPTY_WARN | Label | – |  | Boolean | Hiển thị nếu dataset rỗng (MSG-WRN-RPT-EMPTY). |
| Cảnh báo reconcile | RECONCILE_WARN | Label | – |  | Boolean | Hiển thị khi VAL-RPT-19 lệch tolerance. |
| Cảnh báo che mask | MASK_WARN | Label | – |  | Boolean | Hiển thị MSG-WRN-RPT-MASKED. |
| Nút **Kết xuất** | BTN_EXPORT | Button | – |  | – | Trigger `<MOD>.BC.EXPORT.RUN`. |
| Nút **Sửa tham số** | BTN_BACK | Button | – |  | – | Quay lại BC.FORM. |
| Nút **Đóng** | BTN_CLOSE | Button | – |  | – |  |

### 2.3. Màn hình `<MOD>.BC.HISTORY` — Lịch sử kết xuất

> Liệt kê các lần kết xuất (run) của user/đơn vị; chế độ chỉ đọc.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã run | F-RPT-RUN-ID | Label / Link | – | Auto | String | Link mở `<MOD>.BC.LOG`. |
| Mã báo cáo | RPT_CODE | Label | – |  | String |  |
| Tên báo cáo | RPT_NAME | Label | – |  | String |  |
| Người kết xuất | EXPORTED_BY | Label | – |  | String | User hoặc `SYSTEM (scheduler)`. |
| Thời gian kết xuất | EXPORTED_AT | Label | – |  | DateTime | `dd/mm/yyyy hh:MM:ss`; sort DESC mặc định. |
| Tham số snapshot | PARAM_SNAPSHOT | Expandable JSON | – |  | JSON | Toàn bộ tham số đã chạy. |
| Định dạng | OUTPUT_FORMAT | Label | – |  | String |  |
| Chế độ | RUN_MODE | Label | – |  | String | Sync / Async / Scheduled. |
| Trạng thái | RUN_STATUS | Badge | – |  | String | Queued / Running / Success / Failed / Cancelled / Partial_Success / Expired (§11.1). |
| Lý do thất bại | FAIL_REASON | Label | – |  | String | TIMEOUT / TEMPLATE_ERROR / DATA_NOT_READY / OOM / DISK_FULL / SYSTEM. |
| Tiến độ | PROGRESS | ProgressBar | – | 0% | Number | 0–100; cho Running. |
| Kích thước file | FILE_SIZE | Label | – |  | Number | KB/MB. |
| Hash file | FILE_HASH | Label (tooltip full) | – |  | String | SHA-256, truncate 8 ký tự đầu. |
| Số người nhận | RECIPIENT_COUNT | Label | – |  | Number | Cho run có distribute. |
| Số người nhận lỗi | RECIPIENT_FAIL | Label | – |  | Number | Khi `Partial_Success`. |
| Ký số | SIGNED | Badge | – |  | Boolean | Yes/No. |
| Bộ lọc tìm kiếm — Từ ngày | FROM_DATE | Date Picker | Y | Ngày hiện tại − 30 | Date |  |
| Bộ lọc tìm kiếm — Đến ngày | TO_DATE | Date Picker | Y | Ngày hiện tại | Date | ≥ FROM_DATE; ≤ 366 ngày. |
| Bộ lọc tìm kiếm — Báo cáo | RPT_CODE_FILTER | Dropdown | N | Tất cả | String |  |
| Bộ lọc tìm kiếm — Trạng thái | RUN_STATUS_FILTER | Multi-select | N | Tất cả | String |  |
| Bộ lọc tìm kiếm — Người kết xuất | EXPORTED_BY_FILTER | TextBox + Lookup | N | User hiện tại | String | Quản trị mới được xem run của user khác. |
| Thao tác | ACTIONS | Icon group | – |  | – | Tải (`<MOD>.BC.DOWNLOAD`) / Xem log (`<MOD>.BC.LOG`) / Hủy (`<MOD>.BC.EXPORT.CANCEL`) / Retry (`<MOD>.BC.EXPORT.RETRY`) / Gửi phân phối / Ký số — enable theo trạng thái. |

### 2.4. Màn hình `<MOD>.BC.DOWNLOAD` — Cửa sổ tải file

> Popup sinh URL ký số TTL ngắn để NSD tải file của một run `Success`/`Partial_Success`.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã run | F-RPT-RUN-ID | Label | – | Auto | String |  |
| Tên file | FILE_NAME | Label | – | Auto | String | Format `<RPT_CODE>_<ORG>_<period>_<yyyyMMdd_HHmm>.<ext>`. |
| Định dạng | OUTPUT_FORMAT | Label | – | Auto | String |  |
| Kích thước | FILE_SIZE | Label | – | Auto | Number |  |
| Hash file | FILE_HASH | Label | – | Auto | String | SHA-256 (VAL-RPT-18). |
| URL tải | DOWNLOAD_URL | Label (mask) | – | Auto | String | URL ký số TTL ≤ 15 phút (BIZ-RPT-09, VAL-RPT-15). |
| Thời gian hết hạn | EXPIRES_AT | Label (countdown) | – | now + 15 phút | DateTime | Hiển thị countdown. |
| Lý do tải | DOWNLOAD_REASON | TextArea | C |  | String | Bắt buộc khi file chứa PII unmask hoặc cờ `audit_reason_required = true`. |
| Confirm điều khoản | CONFIRM_TERMS | Checkbox | C | Off | Boolean | Bắt buộc với báo cáo nhạy cảm; tick mới enable nút Tải. |
| Mật khẩu file | FILE_PASSWORD | Label (mask + reveal) | – | Tự sinh | String | Khi báo cáo có mã hoá file; gửi qua kênh phụ. |
| Nút **Tải file** | BTN_DOWNLOAD | Button | – |  | – | Event `<MOD>.BC.DOWNLOAD.HIT`; verify hash, ghi audit. |
| Nút **Sao chép URL** | BTN_COPY | Button | – |  | – | Copy URL ký số. |
| Nút **Gửi qua email** | BTN_EMAIL | Button | – |  | – | Mở `<MOD>.BC.DISTRIBUTE`. |
| Thông báo lỗi | ERR_MSG | Label | – |  | String | MSG-ERR-RPT-LINK-EXPIRED / MSG-ERR-RPT-HASH-MISMATCH / MSG-ERR-RPT-DOWNLOAD-PERM. |

### 2.5. Màn hình `<MOD>.BC.PRINT` — Xem trước & In PDF

> Render preview in (PDF) với header/footer/người kết xuất chuẩn; cho phép NSD chọn máy in, khổ giấy, hướng giấy, số bản.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã run | F-RPT-RUN-ID | Label | – | Auto | String |  |
| Tên báo cáo | RPT_NAME | Label | – | Auto | String |  |
| Khung preview | PRINT_PREVIEW | Iframe / Image | – | Auto | – | Render đầy đủ PDF. |
| Máy in | PRINTER | Dropdown | Y | Máy in mặc định | String | Danh mục máy in cấu hình ở client. |
| Khổ giấy | PAPER_SIZE | Dropdown | Y | A4 | String | A4 / A3 / Letter / Legal. |
| Hướng giấy | ORIENTATION | Radio | Y | Portrait | String | Portrait / Landscape. |
| Lề trang (mm) | MARGIN | Number Field × 4 | Y | 15 / 15 / 20 / 20 | Number | Top/Bottom/Left/Right. |
| Phạm vi trang | PAGE_RANGE | TextBox | N | Tất cả | String | `1-3,5,8-10`; validate VAL-02. |
| Số bản | COPIES | Number Field | Y | 1 | Number | 1–99. |
| Hai mặt | DUPLEX | Checkbox | N | Off | Boolean |  |
| Đen trắng | GRAYSCALE | Checkbox | N | Off | Boolean |  |
| Chèn watermark | INCLUDE_WATERMARK | Checkbox | Y | On | Boolean | Theo BIZ-RPT-05. |
| Header tuỳ chỉnh | HEADER_TEXT | TextBox | N | Auto theo template | String | ≤ 100 ký tự. |
| Footer tuỳ chỉnh | FOOTER_TEXT | TextBox | N | Auto theo template | String | ≤ 100 ký tự. |
| Nút **In** | BTN_PRINT | Button | – |  | – | Event `<MOD>.BC.PRINT.PREVIEW` → gửi máy in; MSG-OK-RPT-PRINT. |
| Nút **Đóng** | BTN_CLOSE | Button | – |  | – |  |

### 2.6. Màn hình `<MOD>.BC.DISTRIBUTE` — Popup gửi phân phối

> Popup gửi file/link tới danh sách người nhận; tự đổi sang gửi link tải khi vượt giới hạn email.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã run | F-RPT-RUN-ID | Label | – | Auto | String |  |
| Tên file | FILE_NAME | Label | – | Auto | String |  |
| Kích thước file | FILE_SIZE | Label | – | Auto | Number | MSG-WRN-RPT-EMAIL-LIMIT khi vượt VAL-RPT-17. |
| Phương thức gửi | DELIVERY_METHOD | Radio | Y | Email | String | Email / Link tải / In-app Notification / SFTP. |
| Người nhận (Đến) | TO_RECIPIENTS | Multi-input + Lookup | Y |  | String | Email hoặc user nội bộ; tối đa N (VAL-RPT-11). |
| Người nhận (CC) | CC_RECIPIENTS | Multi-input + Lookup | N |  | String | Tối đa N. |
| Người nhận (BCC) | BCC_RECIPIENTS | Multi-input + Lookup | N |  | String | Tối đa N. |
| Nhóm phân phối | DIST_GROUP | Dropdown | N |  | String | Cho phép gắn nhóm cố định (mailing list). |
| Tiêu đề | SUBJECT | TextBox | Y | `[Báo cáo] <RPT_NAME> - <Kỳ>` | String | ≤ 150 ký tự. |
| Nội dung | BODY | TextArea | N | Template mặc định | String | Hỗ trợ placeholder `{RPT_NAME}`, `{PERIOD}`, `{LINK}`. |
| Ngôn ngữ email | EMAIL_LANG | Radio | Y | VI | String | VI / EN. |
| Đính kèm file | ATTACH_FILE | Checkbox | Y | On (nếu ≤ 20MB) | Boolean | Tự off + chuyển sang link nếu vượt VAL-RPT-17. |
| Đính kèm link tải | ATTACH_LINK | Checkbox | Y | Off | Boolean | URL ký số TTL theo BIZ-RPT-09. |
| Mật khẩu mở file | FILE_PASSWORD | TextBox | C |  | String | Khi báo cáo có mã hoá; gửi mật khẩu qua kênh phụ. |
| Lý do gửi | SEND_REASON | TextArea | C |  | String | Bắt buộc với báo cáo nhạy cảm. |
| Confirm điều khoản | CONFIRM_TERMS | Checkbox | C | Off | Boolean |  |
| Nút **Gửi** | BTN_SEND | Button | – |  | – | Event `<MOD>.BC.DISTRIBUTE.SEND`. |
| Nút **Lưu nháp** | BTN_DRAFT | Button | – |  | – | Lưu draft phân phối. |
| Nút **Đóng** | BTN_CLOSE | Button | – |  | – |  |
| Bảng kết quả gửi | DELIVERY_RESULT | Grid | – |  | – | Cột: Người nhận / Trạng thái (Sent/Failed/Retrying) / Lý do / Thời gian; sau khi gửi. |

### 2.7. Màn hình `<MOD>.BC.SCHEDULE` — Quản lý lịch kết xuất tự động

> Tạo/sửa/tạm dừng/xoá lịch chạy báo cáo tự động.

#### 2.7.1. Khu vực bộ lọc danh sách lịch

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã báo cáo | RPT_CODE | Dropdown | N | Tất cả | String |  |
| Trạng thái lịch | SCHED_STATUS | Multi-select | N | Active, Paused | String | Active / Paused / Disabled (§11.2). |
| Người tạo | CREATED_BY | TextBox + Lookup | N |  | String |  |
| Tần suất | FREQUENCY | Dropdown | N | Tất cả | String | Daily / Weekly / Monthly / Cron. |
| Từ khoá | KEYWORD | TextBox | N |  | String | Tìm theo Tên lịch. |

#### 2.7.2. Khu vực kết quả danh sách lịch

| Trường | Trường (ENG) | Loại hiển thị | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|
| Mã lịch | F-RPT-SCHED-ID | Link | String | Click mở chi tiết. |
| Tên lịch | SCHED_NAME | Text | String |  |
| Mã báo cáo | RPT_CODE | Text | String |  |
| Tần suất | FREQUENCY | Text | String | Daily/Weekly/Monthly/Cron. |
| Cron expression | CRON_EXPR | Text | String | Hiển thị friendly + tooltip raw. |
| Người nhận | RECIPIENTS_SUMMARY | Text | String | `<N> người nhận`; tooltip danh sách. |
| Định dạng | OUTPUT_FORMAT | Text | String |  |
| Trạng thái | SCHED_STATUS | Badge | String | Active / Paused / Disabled. |
| Lần chạy gần nhất | LAST_RUN_AT | Text | DateTime |  |
| Trạng thái lần gần nhất | LAST_RUN_STATUS | Badge | String | Success/Failed/Partial_Success. |
| Lần chạy kế tiếp | NEXT_RUN_AT | Text | DateTime |  |
| Người tạo | CREATED_BY | Text | String |  |
| Ngày tạo | CREATED_AT | Text | DateTime |  |
| Thao tác | ACTIONS | Icon group | – | Sửa / Pause / Resume / Run now / Xoá (theo §11.2). |

#### 2.7.3. Khu vực form lịch (popup tạo/sửa)

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã lịch | F-RPT-SCHED-ID | Label | – | Auto | String | Sinh khi tạo. |
| Tên lịch | SCHED_NAME | TextBox | Y |  | String | ≤ 100 ký tự, unique theo user. |
| Mã báo cáo | RPT_CODE | Dropdown | Y |  | String |  |
| Tham số báo cáo | PARAM_SNAPSHOT | Khối động | Y |  | JSON | Inline form như `<MOD>.BC.FORM`. |
| Tần suất | FREQUENCY | Radio | Y | Daily | String | Daily / Weekly / Monthly / Cron. |
| Cron expression | CRON_EXPR | TextBox | C |  | String | Khi `FREQUENCY = Cron`; whitelist (VAL-RPT-10). |
| Ngày bắt đầu | START_DATE | Date Picker | Y | Ngày hiện tại | Date |  |
| Ngày kết thúc | END_DATE | Date Picker | N | Không giới hạn | Date | ≥ START_DATE. |
| Múi giờ | TIME_ZONE | Dropdown | Y | Asia/Ho_Chi_Minh | String |  |
| Người nhận | RECIPIENTS | Multi-input + Lookup | Y |  | String | ≥ 1, ≤ M (VAL-RPT-11). |
| Phương thức gửi | DELIVERY_METHOD | Multi-select | Y | Email | String | Email / Link tải / In-app Notification. |
| Định dạng | OUTPUT_FORMAT | Radio | Y | PDF | String |  |
| Ngôn ngữ | LANG | Radio | Y | VI | String |  |
| Mật khẩu mở file | FILE_PASSWORD_MODE | Radio | Y | Không | String | Không / Tự sinh / Tuỳ chỉnh. |
| Trạng thái | SCHED_STATUS | Radio | Y | Active | String | Active / Paused. |
| Ghi chú | NOTE | TextArea | N |  | String | ≤ 500 ký tự. |
| Người tạo | CREATED_BY | Label | – | User hiện tại | String | Auto. |
| Ngày tạo | CREATED_AT | Label | – | Auto | DateTime |  |
| Người cập nhật | UPDATED_BY | Label | – | Auto | String |  |
| Ngày cập nhật | UPDATED_AT | Label | – | Auto | DateTime |  |

### 2.8. Màn hình `<MOD>.BC.PRESET` — Quản lý preset bộ tham số

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã preset | PRESET_ID | Label | – | Auto | String |  |
| Tên preset | PRESET_NAME | TextBox | Y |  | String | Unique theo user; ≤ 100 ký tự (VAL-RPT-13). |
| Mã báo cáo | RPT_CODE | Dropdown / Label | Y |  | String | Tự lấy nếu mở từ BC.FORM. |
| Mô tả | DESCRIPTION | TextArea | N |  | String | ≤ 300 ký tự. |
| Tham số snapshot | PARAM_SNAPSHOT | Khối động | Y |  | JSON | Toàn bộ tham số đã chọn. |
| Phạm vi chia sẻ | SHARE_SCOPE | Radio | Y | Cá nhân | String | Cá nhân / Nhóm role / Đơn vị / Toàn hệ thống. Chia sẻ → cần duyệt `RPT_ADMIN` (BIZ-RPT-11). |
| Trạng thái chia sẻ | SHARE_STATUS | Badge | – | Pending | String | Pending / Approved / Rejected (khi share). |
| Ghim lên đầu | PINNED | Checkbox | N | Off | Boolean | Ghim trong dropdown load preset. |
| Mặc định | IS_DEFAULT | Checkbox | N | Off | Boolean | Tự load khi mở `<MOD>.BC.FORM` cho `RPT_CODE` này. |
| Người tạo | CREATED_BY | Label | – | User hiện tại | String |  |
| Ngày tạo | CREATED_AT | Label | – | Auto | DateTime |  |
| Lần dùng gần nhất | LAST_USED_AT | Label | – |  | DateTime |  |
| Số lần dùng | USE_COUNT | Label | – | 0 | Number |  |
| Thao tác | ACTIONS | Icon group | – |  | – | Load (`<MOD>.BC.PRESET.LOAD`) / Sửa / Sao chép / Xoá / Yêu cầu chia sẻ. |

### 2.9. Màn hình `<MOD>.BC.TEMPLATE.ADMIN` — Quản trị template báo cáo (Quản trị)

> Chỉ Quản trị (`RPT_ADMIN`); CRUD template báo cáo (file `.docx/.xlsx/.html/.jrxml`) và mapping placeholder.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã template | TEMPLATE_CODE | TextBox | Y |  | String | Unique; pattern `[A-Z0-9_\-]{3,40}`. |
| Tên template | TEMPLATE_NAME | TextBox | Y |  | String | Bilingual VI/EN. |
| Mã báo cáo áp dụng | RPT_CODE | Multi-select | Y |  | String | Whitelist các `<Mã báo cáo>` được dùng. |
| Loại engine | ENGINE | Dropdown | Y | Apache POI | String | Apache POI / JasperReports / Aspose / HTML-to-PDF. |
| Định dạng đầu ra | OUTPUT_FORMAT | Multi-select | Y | PDF, XLSX | String | Subset của VAL-RPT-06. |
| Ngôn ngữ | LANG | Multi-select | Y | VI | String | VI / EN; thiếu → fallback VI (VAL-RPT-08). |
| File template | TEMPLATE_FILE | File Upload | Y |  | Binary | ≤ 20MB; định dạng theo engine; quét AV. |
| Schema placeholder | PLACEHOLDER_SCHEMA | TextArea / Editor | Y |  | JSON | Mô tả các placeholder + kiểu + nguồn dữ liệu (VAL-RPT-05). |
| Phiên bản | TEMPLATE_VER | Label | – | Auto | Number | Tăng sau mỗi lần upload. |
| Trạng thái | TEMPLATE_STATUS | Radio | Y | Draft | String | Draft / Active / Deprecated / Disabled. |
| Hiệu lực từ | EFFECTIVE_FROM | Date Picker | Y | Ngày hiện tại | Date |  |
| Hiệu lực đến | EFFECTIVE_TO | Date Picker | N |  | Date | ≥ EFFECTIVE_FROM. |
| Watermark | WATERMARK_CONFIG | TextArea | N |  | String | Cấu hình BẢN NHÁP/CHÍNH THỨC/KIỂM TRA. |
| Header/Footer chuẩn | HEADER_FOOTER_REF | Dropdown | Y | Default | String | Bộ header/footer chuẩn theo BIZ-RPT-05. |
| Hỗ trợ ký số | SUPPORT_SIGN | Checkbox | N | Off | Boolean | Khi On → bắt buộc khai vị trí trường ký số trong template. |
| Vị trí trường ký số | SIGN_FIELDS | TextArea | C |  | JSON | Khi `SUPPORT_SIGN = On`. |
| Người tạo / cập nhật | CREATED_BY / UPDATED_BY | Label | – | Auto | String |  |
| Thời gian tạo / cập nhật | CREATED_AT / UPDATED_AT | Label | – | Auto | DateTime |  |
| Ghi chú | NOTE | TextArea | N |  | String | ≤ 500 ký tự. |
| Thao tác | ACTIONS | Icon group | – |  | – | Tạo / Sửa / Active / Deprecate / Xem lịch sử phiên bản / Test render. |

### 2.10. Màn hình `<MOD>.BC.LOOKUP.*` — Popup tra cứu danh mục

> Áp dụng cho các lookup phục vụ tham số báo cáo: `BC.LOOKUP.ORG`, `BC.LOOKUP.BANK`, `BC.LOOKUP.USER`, `BC.LOOKUP.DVQHNS`, `BC.LOOKUP.PRODUCT`, `BC.LOOKUP.CURRENCY`, `BC.LOOKUP.TEMPLATE`, …

#### 2.10.1. Khu vực tham số tra cứu

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Loại lookup | LOOKUP_TYPE | Label | – | Theo `<MOD>.BC.LOOKUP.*` | String | Read-only. |
| Mã / Tên | KEYWORD | TextBox | N |  | String | Tìm chứa (contains); ≥ 1 ký tự để gọi API. |
| Trạng thái | STATUS | Dropdown | N | Active | String | Active / Inactive / Tất cả. |
| Đơn vị | ORG_FILTER | Dropdown | N | Đơn vị user | String | Áp dụng khi lookup phụ thuộc đơn vị (DVQHNS, USER…). |
| Bộ lọc động | DYNAMIC_FILTER | Khối động | N |  | JSON | Riêng theo từng `LOOKUP_TYPE` (vd `LOOKUP.PRODUCT` có thêm `PRODUCT_GROUP`). |
| Sắp xếp | SORT_BY | Dropdown | Y | Mã ASC | String | Mã/Tên — ASC/DESC. |

#### 2.10.2. Khu vực kết quả tra cứu

| Trường | Trường (ENG) | Loại hiển thị | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|
| Chọn | SELECT | Radio / Checkbox | – | Radio nếu chế độ single-select; Checkbox nếu multi-select. |
| Mã | CODE | Text | String | Bắt buộc hiển thị. |
| Tên | NAME | Text | String | Bilingual VI/EN nếu có. |
| Mã cha | PARENT_CODE | Text | String | Khi danh mục có cấu trúc cha-con (đơn vị, COA). |
| Trạng thái | ITEM_STATUS | Badge | String | Active / Inactive. |
| Thuộc tính bổ sung | EXTRA | Text / Tooltip | String | Riêng theo `LOOKUP_TYPE`. |
| Nút **Chọn** | BTN_SELECT | Button | – | Trả giá trị về form gọi; đóng popup. |
| Nút **Đóng** | BTN_CLOSE | Button | – |  |
| Phân trang | PAGER | Pager | – | 20/50/100; mặc định 20. |

### 2.11. Màn hình `<MOD>.BC.NOTIFY` — Thông báo kết xuất hoàn tất

> Thông báo (in-app + email) gửi cho NSD khi async/scheduled run hoàn tất. Hiển thị thành widget hoặc popup từ Notification Center.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã thông báo | NOTIFY_ID | Label | – | Auto | String |  |
| Mã run | F-RPT-RUN-ID | Label / Link | – | Auto | String | Click mở `<MOD>.BC.LOG`. |
| Loại thông báo | NOTIFY_TYPE | Badge | – |  | String | Success / Failed / Partial_Success / Cancelled / Schedule_Triggered. |
| Mã báo cáo | RPT_CODE | Label | – |  | String |  |
| Tên báo cáo | RPT_NAME | Label | – |  | String |  |
| Tiêu đề | NOTIFY_TITLE | Label | – | Auto | String | VD `Báo cáo <RPT_NAME> đã sẵn sàng`. |
| Nội dung | NOTIFY_BODY | RichText | – | Auto | String | Theo template MSG-INF-RPT-READY / MSG-ERR-RPT-*. |
| Người gửi | SENDER | Label | – | `SYSTEM` | String |  |
| Người nhận | RECIPIENT | Label | – | User hiện tại | String |  |
| Thời gian gửi | SENT_AT | Label | – | Auto | DateTime |  |
| Trạng thái đọc | READ_STATUS | Badge | – | Unread | String | Unread / Read. |
| Link tải | DOWNLOAD_LINK | Button / Link | – |  | String | Mở `<MOD>.BC.DOWNLOAD`; chỉ enable khi run = Success/Partial_Success. |
| Kênh gửi | CHANNEL | Label | – | In-app | String | In-app / Email / SMS / Webhook. |
| Mức độ | SEVERITY | Badge | – | Info | String | Info / Warning / Error. |
| Thao tác | ACTIONS | Icon group | – |  | – | Đánh dấu đã đọc / Mở chi tiết / Tải / Snooze / Xoá. |

### 2.12. Màn hình `<MOD>.BC.DRILLDOWN` — Drill-down chi tiết

> Mở báo cáo chi tiết khi click vào dòng tổng hợp; truyền tham số đã lọc từ báo cáo gốc.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã báo cáo nguồn | SOURCE_RPT_CODE | Label | – | Auto | String | Read-only. |
| Mã run nguồn | SOURCE_RUN_ID | Label / Link | – | Auto | String | Quay lại `<MOD>.BC.LOG`. |
| Mã báo cáo đích | TARGET_RPT_CODE | Label | – | Auto | String | Tự xác định theo mapping drill-down. |
| Tham số kế thừa | INHERITED_PARAMS | Khối động | – | Auto | JSON | Hiển thị tham số đã truyền (Đơn vị, Kỳ, dòng được click…). |
| Tham số bổ sung | EXTRA_PARAMS | Khối động | C |  | JSON | Cho phép NSD chỉnh nếu báo cáo đích yêu cầu tham số ngoài inherited (VAL-RPT-20). |
| Cấp drill-down | DRILL_LEVEL | Label | – | 1 | Number | Hỗ trợ tối đa N cấp (vd 3). |
| Khung kết quả | RESULT_PANE | Iframe / Grid | – |  | – | Render báo cáo đích inline hoặc popup. |
| Nút **Quay lại** | BTN_BACK | Button | – |  | – | Quay về báo cáo nguồn. |
| Nút **Kết xuất** | BTN_EXPORT | Button | – |  | – | Event `<MOD>.BC.EXPORT.RUN` với tham số inherited. |
| Nút **Đóng** | BTN_CLOSE | Button | – |  | – |  |
| Thông báo lỗi | ERR_MSG | Label | – |  | String | Khi mapping drill-down thiếu (VAL-RPT-20) → ẩn link, hiển thị `Drill-down không khả dụng`. |

### 2.13. Màn hình `<MOD>.BC.LOG` — Lịch sử chi tiết của một run

> Chế độ chỉ đọc; hiển thị toàn bộ event/audit phát sinh trong một run (`F-RPT-RUN-ID`).

#### 2.13.1. Khu vực thông tin tổng quan run

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã run | F-RPT-RUN-ID | Label | – | Auto | String |  |
| Mã báo cáo | RPT_CODE | Label | – | Auto | String |  |
| Tên báo cáo | RPT_NAME | Label | – | Auto | String |  |
| Người kết xuất | EXPORTED_BY | Label | – | Auto | String | User hoặc `SYSTEM (scheduler)`. |
| Mã lịch (nếu có) | F-RPT-SCHED-ID | Link | – |  | String | Link sang `<MOD>.BC.SCHEDULE`. |
| Chế độ chạy | RUN_MODE | Label | – | Auto | String | Sync / Async / Scheduled. |
| Tham số snapshot | PARAM_SNAPSHOT | Expandable JSON | – | Auto | JSON |  |
| Định dạng | OUTPUT_FORMAT | Label | – | Auto | String |  |
| Trạng thái | RUN_STATUS | Badge | – | Auto | String | Theo §11.1. |
| Lý do thất bại | FAIL_REASON | Label | – |  | String |  |
| Số lần retry | RETRY_COUNT | Label | – | 0 | Number | Theo BIZ-RPT-04. |
| Thời gian bắt đầu | START_AT | Label | – | Auto | DateTime |  |
| Thời gian kết thúc | END_AT | Label | – | Auto | DateTime |  |
| Thời gian xử lý | DURATION_MS | Label | – | Auto | Number | Hiển thị `s/ms`. |
| Số dòng dữ liệu | ROW_COUNT | Label | – |  | Number |  |
| Số trang | PAGE_COUNT | Label | – |  | Number |  |
| Kích thước file | FILE_SIZE | Label | – |  | Number | MB. |
| Hash file | FILE_HASH | Label | – |  | String | SHA-256 (BIZ-RPT-16). |
| Ký số | SIGNED | Badge | – |  | Boolean | Yes/No; tooltip CN + TSA. |
| Người tải gần nhất | LAST_DOWNLOAD_BY | Label | – |  | String |  |
| Thời gian tải gần nhất | LAST_DOWNLOAD_AT | Label | – |  | DateTime |  |
| Số lần tải | DOWNLOAD_COUNT | Label | – | 0 | Number |  |
| Trạng thái lưu trữ | STORAGE_STATUS | Badge | – | Hot | String | Hot / Cold / Purged (VAL-RPT-16). |

#### 2.13.2. Khu vực bảng nhật ký event

| Trường | Trường (ENG) | Loại hiển thị | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|
| STT | SEQ_NO | Number | Number |  |
| Thời điểm | EVENT_AT | Text | DateTime | `dd/mm/yyyy hh:MM:ss.SSS`; sort ASC. |
| Mã sự kiện | EVENT_ID | Text | String | Tham chiếu §10 Báo cáo: `<MOD>.BC.EXPORT.START/SUCCESS/FAILED/CANCEL/RETRY`, `<MOD>.BC.DOWNLOAD.LINK/HIT`, `<MOD>.BC.SIGN.APPLY`, `<MOD>.BC.NOTIFY.SEND`, `<MOD>.BC.DISTRIBUTE.SEND`, `<MOD>.BC.AUDIT.WRITE`… |
| Phân loại | EVENT_CATEGORY | Badge | String | Lifecycle / Auth / Download / Distribute / Sign / Notify / Audit / System. |
| Mức | LEVEL | Badge | String | DEBUG / INFO / WARN / ERROR. |
| Người thực hiện | ACTOR | Text | String | User hoặc `SYSTEM`. |
| Vai trò | ACTOR_ROLE | Text | String |  |
| IP máy trạm | CLIENT_IP | Text | String |  |
| Tên máy | HOST_NAME | Text | String |  |
| Channel | CHANNEL | Text | String | Web / API / Mobile. |
| traceId | TRACE_ID | Text | String | Liên kết log hệ thống. |
| Nội dung | MESSAGE | Text | String | Mô tả ngắn gọn (≤ 250 ký tự). |
| Chi tiết | DETAIL | Expandable JSON | JSON | Payload đầy đủ (oldValue→newValue, traceId, request/response tóm tắt). |

#### 2.13.3. Khu vực thanh công cụ

| Trường | Mô tả |
|---|---|
| Bộ lọc theo Mức/Phân loại | Multi-select; mặc định ẩn DEBUG. |
| Bộ lọc theo Từ/Đến giờ | DateTime range trong khoảng `START_AT`–`END_AT`. |
| Tìm kiếm theo từ khoá | Tìm trong `MESSAGE` / `EVENT_ID` / `ACTOR`. |
| Xuất log | Cho phép export CSV (chỉ với quyền `RPT_ADMIN` hoặc chủ run); ghi audit. |
| Sao chép traceId | Sao chép `TRACE_ID` để gửi cho team kỹ thuật. |

---

## 3. Quy ước chung

| STT | Quy ước |
|---|---|
| 1 | Mã trường dùng `UPPER_SNAKE_CASE`; tên trường VI/EN bilingual. |
| 2 | Các kiểu hiển thị thống nhất theo `VDBAS_UIUX_Rule.md` §11; nút thao tác theo `spec_button.md`. |
| 3 | Mặc định/whitelist được lấy từ Master Data của phân hệ; cấu hình lookup theo `<MOD>.BC.LOOKUP.*`. |
| 4 | Tham chiếu VAL/MSG/Event xuyên suốt với `BangDacTaChucNang_Report_DienHinh.md` §8/§9/§10. |
| 5 | Trạng thái run/lịch trong các bảng khớp đúng §11.1/§11.2 của file đặc tả chức năng Báo cáo. |
| 6 | Mọi trường nhạy cảm (PII, số tài khoản, số tiền lớn) phải áp mask theo VAL-RPT-07 trừ khi có quyền `RPT_UNMASK`. |
| 7 | Audit: mọi thao tác CREATE/UPDATE/DELETE/DOWNLOAD/DISTRIBUTE/SCHEDULE ghi log theo BIZ-RPT-10 (user, timestamp, IP, action, runId, hash). |
| 8 | Các trường DateTime hiển thị `dd/mm/yyyy hh:MM[:ss]`; backend lưu UTC; convert theo `TIME_ZONE` user. |

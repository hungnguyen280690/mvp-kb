# Đặc tả trường dữ liệu

> Chú thích cột **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện (ghi rõ điều kiện trong "Mô tả/Ràng buộc").
>
> Chú thích cột **Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / DateTime Picker / Checkbox / Radio / File Upload / Lookup.



## 1. Màn hình `<MOD>.NEW`, `<MOD>.VIEW`, `<MOD>.EDIT`

### 1.1. \[Tab\] Thông tin chung

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Kênh | Channel | Dropdown | Y |  | String | Mặc định hiển thị theo user đăng nhập. Danh mục gồm: Liên ngân hàng; Thanh toán song phương. |
| Loại lệnh | Transaction Type | Dropdown | Y |  | String | Bắt buộc chọn trong danh mục. Nếu **Kênh = Thanh toán song phương**: Lệnh chuyển khoản / Lệnh chi TM cho KBNN / Lệnh chi TM cho KH / TT bằng ngoại tệ khác. Nếu **Kênh = Liên ngân hàng**: mặc định "Lệnh thông thường"; danh mục gồm: Lệnh thông thường / Lệnh trái phiếu chính phủ / Lệnh có thông tin thu NSNN. |
| NH/KB chuyển | SENDER | TextBox | Y |  | String | Tự hiển thị mã NH trực tiếp của đơn vị user đăng nhập, không cho sửa. |
| NH/KB nhận | RECEIVER | TextBox | Y |  | String | Tự hiển thị theo cặp thiết lập song phương và cho sửa với lệnh TTSP. Tự hiển thị mã NH trực tiếp của thông tin người nhận và không cho sửa với lệnh LNH. |
| Số YCTT/Số bút toán | REF_NO | TextBox | Y |  | String | Bắt buộc nhập. Với kênh Liên ngân hàng, số YCTT được hiểu là số bút toán. |
| Ngày thanh toán | PAYMENT_DATE | Date Picker | Y | Ngày hiện tại | Date | Tự hiển thị ngày hiện tại và không cho phép sửa. |
| Số tiền chuyển | AMOUNT | Number Field | Y |  | Number | Tự hiển thị bằng tổng tiền ở các dòng chi tiết khoản mục. |
| Loại tiền | CURRENCY_CODE | Dropdown | Y | VND | String | Mặc định "VNĐ" và cho phép chọn lại trong danh mục tiền tệ. |
| Loại giao dịch | Transaction_Type | Dropdown | C |  | String | Chỉ hiển thị khi **Kênh = Liên ngân hàng**. Danh mục: Lệnh chuyển Có GT thấp / Lệnh chuyển Nợ GT thấp / Lệnh chuyển Có GT cao / Lệnh chuyển Nợ GT cao. (1) Nếu Số tiền chuyển ≥ 500 triệu đồng → mặc định "Lệnh chuyển Có GT cao", không cho chọn lại loại GT thấp. (2) Nếu Số tiền chuyển < 500 triệu đồng hoặc Loại tiền là ngoại tệ → mặc định "Lệnh chuyển Có GT thấp", cho phép chọn lại lên loại GT cao. |
| Tỷ giá | Exchange_Rate | Number Field | C |  | Number | Chỉ hiển thị và bắt buộc nhập nếu chọn Loại tiền là ngoại tệ. |
| Số chứng từ gốc | ORGIN_NUM | TextBox | C |  | Varchar | Bắt buộc nhập nếu Kênh = Thanh toán song phương. |
| Ngày chứng từ | Transaction_Date | Date Picker | C |  | Date | Bắt buộc nhập nếu Kênh = Thanh toán song phương. |
| Loại phí | EXP_TYPE | Dropdown | C |  | String | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. |
| Mã ngoại tệ trích nợ | FN_CODE1 | Dropdown | C |  | String | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Cho chọn trong danh mục tiền tệ. |
| Mã ngoại tệ TT | FN_CODE2 | Dropdown | C |  | String | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Cho chọn trong danh mục tiền tệ. |
| Số tiền ngoại tệ TT | FN_AMOUNT | Number Field | C |  | Number | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. |
| Nội dung thanh toán | DESCRIPTION | TextArea | Y |  | String | Bắt buộc nhập. |
| Người lập | CREATED_BY | TextBox | N (auto) |  | String | Hệ thống tự lấy user hiện tại đang lập lệnh thanh toán, không cho phép sửa. |
| Ngày lập | CREATED_DATE | Date Picker | N (auto) |  | DateTime | Tự động hiển thị thời gian ngày làm việc hiện tại lập lệnh theo định dạng `dd/mm/yyyy hh:MM:ss`, không cho phép sửa. |

### 1.2. \[Tab\] Thông tin khoản mục

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quỹ | GL_Segment1 | TextBox | N | 01 | Varchar(2) | 2 ký tự. Cho phép sửa, tuân theo ràng buộc kết hợp chéo (CCID). |
| TK tự nhiên | GL_Segment2 | Number Field | Y |  | Varchar(4) | Tài khoản tự nhiên 4 ký tự, tuân theo CCID. |
| DVQHNS | GL_Segment3 | Number Field | Y |  | Varchar(7) | Đơn vị quan hệ ngân sách 7 ký tự, tuân theo CCID. |
| Cấp NS | GL_Segment4 | Number Field | C |  | Varchar | Cấp ngân sách, tuân theo CCID. |
| Chương | GL_Segment5 | Number Field | C | 000 | Varchar(3) | Mã chương 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`. |
| Ngành KT | GL_Segment6 | Number Field | C | 000 | Varchar(3) | Mã ngành kinh tế 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`. |
| NDKT | GL_Segment7 | Number Field | C | 0000 | Varchar(4) | Nội dung kinh tế 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`. |
| ĐB | GL_Segment8 | Number Field | C | 00000 | Varchar(5) | Mã địa bàn 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`. |
| CTMT | GL_Segment9 | Number Field | C | 00000 | Varchar(5) | Chương trình mục tiêu 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`. |
| MN | GL_Segment10 | Number Field | C | 00 | Varchar(2) | Mã nguồn kinh phí 2 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`. |
| Kho bạc | GL_Segment11 | Number Field | C | 0000 | Varchar(4) | Mã kho bạc 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`. |
| DP | GL_Segment12 | Number Field | C | 00 | Varchar(3) | Mã dự phòng, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`. |
| Diễn giải | DESCRIPTION | TextArea | Y |  | String | Diễn giải số tiền chi tiết của dòng. |
| Số tiền | AMOUNT | Number Field | Y |  | Number | Số tiền của dòng chi tiết. Tổng dòng = Số tiền chuyển ở Tab Thông tin chung. |

### 1.3. \[Tab\] Thông tin người chuyển

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Tên | SENDER_NAME | TextBox | Y |  | String | Tự hiển thị theo mã COA đã nhập và cho phép sửa. |
| Địa chỉ | SENDER_ADDRESS | TextBox | Y |  | String | Cho nhập. |
| Tài khoản | SENDER_GL_Segment2 | Number Field | Y |  | Number | Tự hiển thị theo mã COA và không cho sửa. |
| Mã KH | SENDER_NUM | Number Field | N |  | Number | Cho nhập. |
| Mở tại NH/KB | SENDER_BANK_CODE | TextBox | Y |  | String | Tự hiển thị mã NH của user đăng nhập. |
| CMND/CCCD/HC/Mã DN | SENDER_IDENTIFY_ID | TextBox | N |  | String | Cho nhập. |
| Ngày cấp | SENDER_ISSUED_DATE | Date Picker | C |  | Date | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |
| Nơi cấp | SENDER_ISSUED_PLACE | TextBox | C |  | String | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |
| Mã TPCP | TPCP_CODE | TextBox | C |  | String | Bắt buộc nhập nếu Loại lệnh = Lệnh trái phiếu chính phủ. |

### 1.4. \[Tab\] Thông tin người nhận

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Tên | RECEIVER_NAME | TextBox | Y |  | String | Cho nhập. |
| Địa chỉ | RECEIVER_ADDRESS | TextBox | N |  | String | Cho nhập. |
| Tài khoản | RECEIVER_GL_Segment2 | Number Field | Y |  | Number | Cho phép nhập số tài khoản của người nhận tiền. |
| Mở tại NH/KB | RECEIVER_BANK_NAME | TextBox | Y |  | String | Cho nhập. |
| Tên tài khoản | RECEIVER_BANK_CODE | TextBox | Y |  | String | Cho phép nhập tên tài khoản của người nhận tiền. |
| CMND/CCCD/HC/Mã DN | RECEIVER_IDENTIFY_ID | TextBox | N |  | String | Cho nhập. |
| Ngày cấp | RECEIVER_ISSUED_DATE | Date Picker | C |  | Date | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |
| Nơi cấp | RECEIVER_ISSUED_PLACE | TextBox | C |  | String | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |

---

## 2. Màn hình `<MOD>.LIST`

> Mục đích: liệt kê các yêu cầu thanh toán (YCTT)/bút toán đã lập; cho phép tra cứu theo nhiều tiêu chí và truy cập các thao tác Xem/Sửa/Xoá/Sao chép/Gửi kiểm soát/Phê duyệt/Xuất/In.

### 2.1. Khu vực bộ lọc tìm kiếm

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Kênh | Channel | Dropdown | N | Tất cả | String | Danh mục: Liên ngân hàng; Thanh toán song phương; Tất cả. |
| Loại lệnh | Transaction Type | Dropdown | N | Tất cả | String | Danh mục động theo "Kênh"; mặc định Tất cả. |
| Loại giao dịch (LNH) | LNH_Transaction_Type | Dropdown | N | Tất cả | String | Chỉ hiển thị khi Kênh = Liên ngân hàng. Danh mục: GT cao Có/Nợ, GT thấp Có/Nợ, Tất cả. |
| Số YCTT/Số bút toán | REF_NO | TextBox | N |  | String | Hỗ trợ tìm chính xác hoặc bắt đầu bằng. |
| Số chứng từ gốc | ORGIN_NUM | TextBox | N |  | String | Tìm chính xác/bắt đầu bằng. |
| Trạng thái | F-STATUS | Dropdown (multi-select) | N | Tất cả trạng thái hợp lệ | String | Danh mục theo §11 CRUD: Draft, Ready_For_Approval, Pending_Approver, Approved, Returned_To_Maker, Rejected, Deleted. Mặc định ẩn các bản ghi Deleted trừ khi tick chọn. |
| NH/KB chuyển | SENDER | TextBox + Lookup `<MOD>.LOOKUP.BANK` | N | Mã đơn vị user đăng nhập | String | F4 để tra cứu danh mục NH/KB. |
| NH/KB nhận | RECEIVER | TextBox + Lookup `<MOD>.LOOKUP.BANK` | N |  | String | F4 để tra cứu. |
| Tài khoản chuyển | SENDER_GL_Segment2 | Number Field | N |  | Number | Lọc theo TK tự nhiên người chuyển. |
| Tài khoản nhận | RECEIVER_GL_Segment2 | Number Field | N |  | Number | Lọc theo TK tự nhiên người nhận. |
| Từ ngày | FROM_DATE | Date Picker | Y | Ngày hiện tại − 7 | Date | Khoảng thời gian "Ngày lập" hoặc "Ngày thanh toán" (chọn 1 trong combobox `DATE_FIELD`). |
| Đến ngày | TO_DATE | Date Picker | Y | Ngày hiện tại | Date | Phải ≥ Từ ngày; khoảng cách ≤ 90 ngày (cảnh báo nếu vượt). |
| Loại ngày lọc | DATE_FIELD | Dropdown | Y | Ngày lập | String | Danh mục: Ngày lập / Ngày thanh toán / Ngày kiểm soát / Ngày phê duyệt. |
| Số tiền từ | AMOUNT_FROM | Number Field | N |  | Number | Định dạng nhóm hàng nghìn. |
| Số tiền đến | AMOUNT_TO | Number Field | N |  | Number | ≥ Số tiền từ. |
| Loại tiền | CURRENCY_CODE | Dropdown | N | Tất cả | String | Danh mục tiền tệ. |
| Người lập | CREATED_BY | TextBox + Lookup `<MOD>.LOOKUP.USER` | N |  | String | Hỗ trợ tra cứu user nội bộ. |
| Người kiểm soát | CHECKED_BY | TextBox + Lookup `<MOD>.LOOKUP.USER` | N |  | String |  |
| Người phê duyệt | APPROVED_BY | TextBox + Lookup `<MOD>.LOOKUP.USER` | N |  | String |  |
| DVQHNS | GL_Segment3 | TextBox + Lookup `<MOD>.LOOKUP.DVQHNS` | N |  | Varchar(7) | Lọc theo DVQHNS phát sinh trong dòng chi tiết. |

### 2.2. Khu vực kết quả (grid)

| STT | Trường | Trường (ENG) | Loại hiển thị | Sắp xếp | Mô tả / Ràng buộc |
|---|---|---|---|---|---|
| 1 | Số YCTT/Số bút toán | REF_NO | Link (mở `<MOD>.VIEW`) | ✓ | Click mở chi tiết giao dịch. |
| 2 | Kênh | Channel | Text | ✓ |  |
| 3 | Loại lệnh | Transaction Type | Text | ✓ |  |
| 4 | Loại GD (LNH) | LNH_Transaction_Type | Text | – | Chỉ hiển thị giá trị khi Kênh = LNH. |
| 5 | Ngày lập | CREATED_DATE | Text (`dd/mm/yyyy hh:MM`) | ✓ |  |
| 6 | Ngày thanh toán | PAYMENT_DATE | Text (`dd/mm/yyyy`) | ✓ |  |
| 7 | NH/KB chuyển | SENDER | Text | ✓ |  |
| 8 | NH/KB nhận | RECEIVER | Text | ✓ |  |
| 9 | Tên người chuyển | SENDER_NAME | Text | – | Truncate, tooltip full. |
| 10 | Tên người nhận | RECEIVER_NAME | Text | – | Truncate, tooltip full. |
| 11 | Số tiền chuyển | AMOUNT | Number (right-align, 2 dec) | ✓ |  |
| 12 | Loại tiền | CURRENCY_CODE | Text (center) | – |  |
| 13 | Nội dung TT | DESCRIPTION | Text | – | Truncate ≥ 60 ký tự, tooltip full. |
| 14 | Trạng thái | F-STATUS | Badge (màu theo trạng thái) | ✓ | Xanh: Approved; Vàng: Pending_Approver/Ready_For_Approval; Xám: Draft; Đỏ: Rejected; Cam: Returned_To_Maker. |
| 15 | Người lập | CREATED_BY | Text | ✓ |  |
| 16 | Người kiểm soát | CHECKED_BY | Text | ✓ |  |
| 17 | Người phê duyệt | APPROVED_BY | Text | ✓ |  |
| 18 | F-VER | F-VER | Text | – | Số phiên bản. |
| 19 | Thao tác | ACTIONS | Icon group | – | Tổ hợp nút theo VAL-13/VAL-14: Xem (F3), Sửa (F2), Xoá (Delete), Sao chép (Ctrl+Shift+C), Gửi kiểm soát (F9), Phê duyệt (F8/F9). |

### 2.3. Khu vực thanh công cụ và footer

| Trường | Mô tả |
|---|---|
| Số bản ghi | Tổng số bản ghi khớp bộ lọc. |
| Tổng số tiền | Tổng `AMOUNT` (theo từng loại tiền) của các bản ghi khớp bộ lọc — chỉ tính trạng thái ≠ Deleted. |
| Phân trang | 20 / 50 / 100 / 200 bản ghi/trang; mặc định 20. |
| Sắp xếp | Mặc định `CREATED_DATE` DESC. |
| Lưu bộ lọc | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope). |

---

## 3. Đặc tả trường cho các màn hình bổ sung

### 3.1. Màn hình `<MOD>.DELETE`

> Popup xác nhận xoá mềm bản ghi YCTT/bút toán ở trạng thái cho phép xoá (Draft, Returned_To_Maker).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Số YCTT/Số bút toán | REF_NO | Label | – | Tự lấy từ bản ghi | String | Read-only. |
| Loại lệnh | Transaction Type | Label | – | Tự lấy | String | Read-only. |
| Số tiền chuyển | AMOUNT | Label | – | Tự lấy | Number | Hiển thị có nhóm hàng nghìn + loại tiền. |
| Trạng thái hiện tại | F-STATUS | Label | – | Tự lấy | String | Phải ∈ {Draft, Returned_To_Maker} (VAL-13). |
| Lý do xoá | DELETE_REASON | TextArea | Y |  | String | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16). |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y | Off | Boolean | Phải tick mới enable nút "Xác nhận xoá". |
| Người xoá | DELETED_BY | Label | – | User hiện tại | String | Auto. |
| Thời gian xoá | DELETED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto, hiển thị `dd/mm/yyyy hh:MM:ss`. |

### 3.2. Màn hình `<MOD>.DETAIL.GRID`

> Lưới chi tiết khoản mục (hiển thị/sửa nhiều dòng chi tiết COA) — popup hoặc inline trong `<MOD>.NEW`/`<MOD>.EDIT`.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | LINE_NO | Label | – | Tự tăng | Number | Auto, không cho sửa. |
| Mã quỹ | GL_Segment1 | TextBox + Lookup | N | 01 | Varchar(2) | Tuân theo CCID. |
| TK tự nhiên | GL_Segment2 | TextBox + Lookup | Y |  | Varchar(4) | Tuân theo CCID. |
| DVQHNS | GL_Segment3 | TextBox + Lookup | Y |  | Varchar(7) | Tuân theo CCID. |
| Cấp NS | GL_Segment4 | Dropdown | C |  | Varchar | Tuân theo CCID. |
| Chương | GL_Segment5 | TextBox + Lookup | C | 000 | Varchar(3) |  |
| Ngành KT | GL_Segment6 | TextBox + Lookup | C | 000 | Varchar(3) |  |
| NDKT | GL_Segment7 | TextBox + Lookup | C | 0000 | Varchar(4) |  |
| ĐB | GL_Segment8 | TextBox + Lookup | C | 00000 | Varchar(5) |  |
| CTMT | GL_Segment9 | TextBox + Lookup | C | 00000 | Varchar(5) |  |
| MN | GL_Segment10 | TextBox + Lookup | C | 00 | Varchar(2) |  |
| Kho bạc | GL_Segment11 | TextBox + Lookup | C | 0000 | Varchar(4) |  |
| DP | GL_Segment12 | TextBox + Lookup | C | 00 | Varchar(3) |  |
| Diễn giải | LINE_DESCRIPTION | TextArea | Y |  | String | Diễn giải dòng chi tiết. |
| Số tiền | LINE_AMOUNT | Number Field | Y |  | Number | Tổng `LINE_AMOUNT` = `AMOUNT` tab Thông tin chung. |
| Thao tác | ACTIONS | Icon group | – |  | – | Thêm dòng / Xoá dòng / Sao chép dòng / Sửa CCID dòng. |

**Footer:** Hiển thị "Tổng số dòng", "Tổng số tiền dòng" và so khớp với "Số tiền chuyển" — chênh lệch sẽ hiển thị MSG-WAR-AMOUNT-MISMATCH.

### 3.3. Màn hình `<MOD>.ATTACH`

> Quản lý tài liệu đính kèm cho bản ghi.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Tên file | FILE_NAME | Label | – |  | String | Lấy từ tên gốc upload. |
| Loại tài liệu | DOC_TYPE | Dropdown | Y |  | String | Danh mục: Chứng từ gốc / Hợp đồng / Hoá đơn / Bảng kê / Văn bản khác. |
| Mô tả | NOTE | TextArea | N |  | String | ≤ 250 ký tự. |
| File upload | FILE_BLOB | File Upload | Y |  | Binary | ≤ 10MB/file; định dạng: pdf/jpg/png/docx/xlsx; check MIME + magic byte. |
| Kích thước | FILE_SIZE | Label | – | Tự tính | Number | Hiển thị KB/MB. |
| Hash | FILE_HASH | Label | – | Tự tính | String | SHA-256, dùng để chống trùng & toàn vẹn. |
| Người upload | UPLOADED_BY | Label | – | User hiện tại | String | Auto. |
| Ngày upload | UPLOADED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |
| Trạng thái | ATTACH_STATUS | Label | – |  | String | Active/Deleted (soft-delete). |
| Thao tác | ACTIONS | Icon group | – |  | – | Tải xuống (Ctrl+J) / Xem trước / Xoá (Shift+Delete) — theo quyền và VAL-13/14. |

**Footer:** "Tổng số file: N", "Tổng dung lượng: X MB" (giới hạn tổng ≤ 50MB/bản ghi).

### 3.4. Màn hình `<MOD>.HISTORY`

> Lịch sử thay đổi/audit của bản ghi (chế độ chỉ đọc).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | SEQ_NO | Label | – | Tự tăng | Number |  |
| Thời điểm | ACTION_DATE | Label | – |  | DateTime | `dd/mm/yyyy hh:MM:ss`, sắp xếp DESC mặc định. |
| Người thực hiện | ACTOR | Label | – |  | String | Username + Họ tên + Vai trò. |
| Vai trò | ACTOR_ROLE | Label | – |  | String | Maker / Checker / Approver / System. |
| Hành động | ACTION | Label | – |  | String | Tham chiếu Event ID §10 CRUD: NEW.OPEN/SAVE/SUBMIT, EDIT.OPEN/SAVE, DELETE.CONFIRM, APPROVE.CHECKER/APPROVER/RETURN/REJECT, ATTACH.UPLOAD/DELETE/DOWNLOAD, PRINT.PREVIEW, LIST.EXPORT… |
| Trạng thái trước | STATUS_FROM | Label | – |  | String | F-STATUS trước hành động. |
| Trạng thái sau | STATUS_TO | Label | – |  | String | F-STATUS sau hành động. |
| Phiên bản | F-VER | Label | – |  | Number |  |
| Lý do/Ghi chú | NOTE | Label | – |  | String | Lý do từ chối/trả lại/xoá. |
| IP máy trạm | CLIENT_IP | Label | – |  | String | IPv4/IPv6. |
| Tên máy | HOST_NAME | Label | – |  | String |  |
| Channel | CHANNEL | Label | – |  | String | Web / API / Mobile. |
| Trường thay đổi (Diff) | DIFF | Expandable | – |  | JSON | Hiển thị `field`, `oldValue`, `newValue` (BIZ-007). |

**Bộ lọc:** Theo hành động (multi-select), khoảng thời gian, vai trò, người thực hiện. **Xuất:** Cho phép export Excel/CSV (audit log).

### 3.5. Màn hình `<MOD>.LOOKUP`

> Popup tra cứu danh mục dùng chung (mỗi danh mục có 1 màn hình `<MOD>.LOOKUP.<TYPE>`: BANK, USER, DVQHNS, CURRENCY, COA, …).

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã | CODE | TextBox | N |  | String | Tìm chính xác / chứa / bắt đầu bằng (radio). |
| Tên | NAME | TextBox | N |  | String | Tìm chứa, không phân biệt hoa thường, hỗ trợ tiếng Việt có dấu/không dấu. |
| Nhóm/Phạm vi | GROUP | Dropdown | N |  | String | Tuỳ danh mục (ví dụ nhóm NH thành viên, NH đại lý…). |
| Trạng thái | ACTIVE_STATUS | Dropdown | N | Đang hoạt động | String | Active/Inactive/All. |

**Khu vực kết quả:**

| STT | Trường | Trường (ENG) | Loại hiển thị | Mô tả |
|---|---|---|---|---|
| 1 | Mã | CODE | Text | Click để chọn (single-select) hoặc checkbox (multi-select). |
| 2 | Tên | NAME | Text |  |
| 3 | Tên viết tắt | SHORT_NAME | Text |  |
| 4 | Diễn giải | DESCRIPTION | Text | Truncate, tooltip full. |
| 5 | Trạng thái | ACTIVE_STATUS | Badge | Active = xanh, Inactive = xám. |
| 6 | Cột phụ thuộc danh mục | – | Text | Ví dụ: với BANK có "Mã NH trực tiếp", với DVQHNS có "Cấp NS"… |
| 7 | Thao tác | ACTIONS | Button | "Chọn" / "Xem chi tiết". |

**Footer:** Phân trang 10/20/50; nút "Chọn"/"Huỷ"; phím tắt `Enter` chọn dòng đang focus, `Esc` đóng.

### 3.6. Màn hình `<MOD>.CHECK` (Kiểm soát viên — Checker)

> Hiển thị toàn bộ trường từ §1 ở chế độ read-only, kèm vùng thao tác kiểm soát.

**Khu vực thông tin giao dịch (read-only):** Mọi trường tại §1.1 → §1.4 + §3.2 Detail Grid + §3.3 Attach Tab + §3.4 History Tab.

**Khu vực thao tác Kiểm soát:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Kết quả kiểm soát | CHECK_RESULT | Radio | Y | (chưa chọn) | String | Một trong: Đồng ý kiểm soát / Trả lại Maker / Từ chối. |
| Ghi chú kiểm soát | CHECK_NOTE | TextArea | C |  | String | Bắt buộc nếu chọn "Trả lại" hoặc "Từ chối", ≥ 10 ký tự. |
| Mã lỗi nghiệp vụ | CHECK_ERROR_CODE | Dropdown | C |  | String | Tra cứu danh mục mã lỗi (BIZ-CHECK-ERR-*) nếu trả lại/từ chối. |
| Người kiểm soát | CHECKED_BY | Label | – | User hiện tại | String | Auto, phải ≠ Maker (SoD — BIZ-001). |
| Vai trò | CHECKER_ROLE | Label | – |  | String | Auto. |
| Thời gian kiểm soát | CHECKED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |
| Checklist rà soát | CHECKLIST | Checkbox list | Y | Off | Boolean | Buộc tick đủ các mục trước khi enable nút "Đồng ý kiểm soát" (mục theo cấu hình: TK chuyển/nhận đúng, COA hợp lệ, Hạn mức, Khớp tổng tiền, Đính kèm hợp lệ…). |

### 3.7. Màn hình `<MOD>.APPROVE` (Người phê duyệt — Approver)

> Tương tự `<MOD>.CHECK` nhưng dành cho cấp phê duyệt cuối; ràng buộc thẩm quyền theo hạn mức.

**Khu vực thông tin giao dịch (read-only):** Mọi trường tại §1.1 → §1.4 + §3.2 Detail Grid + §3.3 Attach Tab + §3.4 History Tab + thông tin kiểm soát tại §3.6.

**Khu vực thao tác Phê duyệt:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Kết quả phê duyệt | APPROVE_RESULT | Radio | Y | (chưa chọn) | String | Một trong: Đồng ý phê duyệt / Trả lại / Từ chối. |
| Ghi chú phê duyệt | APPROVE_NOTE | TextArea | C |  | String | Bắt buộc nếu chọn "Trả lại"/"Từ chối", ≥ 10 ký tự. |
| Hạn mức áp dụng | LIMIT_APPLIED | Label | – | Tự tính | Number | Hạn mức của Approver hiện tại; báo lỗi nếu AMOUNT > hạn mức (MSG-ERR-LIMIT). |
| Người phê duyệt | APPROVED_BY | Label | – | User hiện tại | String | Auto, phải ≠ Maker và ≠ Checker (SoD — BIZ-001). |
| Vai trò/Cấp duyệt | APPROVER_ROLE | Label | – |  | String | Cấp 1/Cấp 2 theo cấu hình workflow. |
| Thời gian phê duyệt | APPROVED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |
| Phương thức xác thực | AUTH_METHOD | Radio | Y | OTP | String | OTP / Ký số. Với GD vượt ngưỡng — bắt buộc Ký số. |
| OTP | OTP_CODE | TextBox | C |  | String(6) | Bắt buộc nếu AUTH_METHOD = OTP; TTL 60s. |
| Chứng thư số | CERT_SERIAL | Label | C |  | String | Bắt buộc nếu AUTH_METHOD = Ký số; chọn từ USB Token/HSM. |
| Chữ ký số | SIGNATURE | Hidden (Base64) | C |  | String | Sinh bởi mô-đun ký số (CAdES/PAdES), không hiển thị giá trị raw. |

### 3.8. Màn hình `<MOD>.PRINT`

> Cấu hình + xem trước trước khi in chứng từ giao dịch.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mẫu in | TEMPLATE_CODE | Dropdown | Y | Mẫu chuẩn | String | Danh mục mẫu cấu hình (Mẫu chuẩn / Mẫu rút gọn / Mẫu LNH / Mẫu TTSP…). |
| Khổ giấy | PAPER_SIZE | Dropdown | Y | A4 | String | A4 / A5 / Letter. |
| Hướng giấy | ORIENTATION | Radio | Y | Portrait | String | Portrait / Landscape. |
| Số bản | COPIES | Number Field | Y | 1 | Integer | 1–10. |
| Loại bản | PRINT_TYPE | Radio | Y | Bản chính | String | Bản nháp / Bản chính / Bản sao. Bản nháp có watermark "DRAFT". |
| Watermark | WATERMARK_TEXT | TextBox | N |  | String | Chỉ enable nếu PRINT_TYPE = Bản nháp/Bản sao; ≤ 30 ký tự. |
| In kèm đính kèm | INCLUDE_ATTACHMENTS | Checkbox | N | Off | Boolean | Nếu tick → đính kèm các file PDF/ảnh ở §3.3 (chuyển ảnh sang PDF). |
| In kèm lịch sử | INCLUDE_HISTORY | Checkbox | N | Off | Boolean | Nếu tick → in phần "Lịch sử phê duyệt" cuối chứng từ. |
| Ngôn ngữ in | LANGUAGE | Dropdown | Y | Tiếng Việt | String | Tiếng Việt / Tiếng Anh. |
| Vùng xem trước | PREVIEW | PDF Viewer | – | Tự sinh | Binary | Render PDF tạm; chỉ phép tải xuống/in sau khi xác nhận. |
| Người in | PRINTED_BY | Label | – | User hiện tại | String | Auto, ghi audit khi bấm "In". |
| Thời gian in | PRINTED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |

### 3.9. Màn hình `<MOD>.EXPORT`

> Cấu hình + thực hiện xuất dữ liệu danh sách giao dịch.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Định dạng | EXPORT_FORMAT | Radio | Y | XLSX | String | XLSX / CSV / PDF. |
| Phạm vi | EXPORT_SCOPE | Radio | Y | Toàn bộ kết quả lọc | String | Trang hiện tại / Toàn bộ kết quả lọc / Theo lựa chọn (checkbox trên LIST). |
| Trường xuất | EXPORT_FIELDS | Checkbox list | Y | Mặc định 10 trường chính | String[] | Cho phép chọn/bỏ chọn từng cột của §2.2; lưu preset cá nhân. |
| Sắp xếp theo | SORT_BY | Dropdown | N | Theo grid hiện tại | String | Có thể override sắp xếp. |
| Bộ lọc kế thừa | INHERIT_FILTER | Checkbox | Y | On | Boolean | Tick → dùng bộ lọc đang áp dụng tại `<MOD>.LIST`; bỏ tick → mở popup nhập lại bộ lọc. |
| Bao gồm dòng chi tiết | INCLUDE_DETAIL | Checkbox | N | Off | Boolean | Nếu tick → mỗi YCTT được trải thêm các dòng `<MOD>.DETAIL.GRID` ở sheet/trang kế tiếp. |
| Bao gồm tổng cộng | INCLUDE_SUMMARY | Checkbox | N | On | Boolean | Thêm dòng tổng số tiền theo từng loại tiền cuối file. |
| Mã hoá file | ENCRYPT_FILE | Checkbox | N | Off | Boolean | Nếu tick → mã hoá file bằng mật khẩu (gửi qua kênh riêng). |
| Mật khẩu | EXPORT_PASSWORD | Password Field | C |  | String | Bắt buộc nếu ENCRYPT_FILE = On; ≥ 8 ký tự, có chữ + số + ký tự đặc biệt. |
| Tên file | FILE_NAME | TextBox | Y | `<MOD>_LIST_<yyyyMMdd_HHmm>` | String | Cho sửa, chỉ chấp nhận `[A-Za-z0-9_\-]`. |
| Watermark (PDF) | WATERMARK_TEXT | TextBox | C |  | String | Chỉ hiển thị khi EXPORT_FORMAT = PDF. |
| Ngôn ngữ tiêu đề cột | LANGUAGE | Dropdown | Y | Tiếng Việt | String | Tiếng Việt / Tiếng Anh. |
| Người xuất | EXPORTED_BY | Label | – | User hiện tại | String | Auto, ghi audit `<MOD>.LIST.EXPORT`. |
| Thời gian xuất | EXPORTED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |

**Ràng buộc chung:**
- Nếu số bản ghi vượt ngưỡng (mặc định 50,000) → bắt buộc chạy bất đồng bộ (job nền), trả về email/notification khi xong; không cho tải trực tiếp trên trình duyệt (tránh OOM).
- File xuất không chứa cột nhạy cảm (CMND/CCCD đầy đủ) trừ khi user có quyền `EXPORT_PII`.
- Log chi tiết tham số xuất + hash file vào audit (BIZ-007).

---

## 4. Quy ước chung về đặc tả trường

| STT | Quy ước |
|---|---|
| 1 | Mọi trường tiền tệ hiển thị có nhóm hàng nghìn (`#,##0.00`); căn phải; tổng tiền hiển thị theo từng loại tiền. |
| 2 | Mọi trường ngày hiển thị theo `dd/mm/yyyy`; ngày giờ `dd/mm/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh. |
| 3 | Mọi trường COA (GL_Segment*) sử dụng cùng popup Lookup `<MOD>.LOOKUP.COA` và phải tuân theo Cross-Validation Rule (CCID). |
| 4 | Mọi trường Lookup có icon kính lúp + phím tắt `F4` (theo `spec_button.md`). |
| 5 | Mọi trường bắt buộc đánh dấu sao đỏ (`*`) cạnh nhãn; trường bắt buộc có điều kiện đánh dấu `(*)` và mô tả điều kiện trong tooltip. |
| 6 | Khi field bị disable phải có tooltip giải thích lý do; field đang lỗi validate hiển thị viền đỏ + thông báo lỗi nằm dưới ô nhập (tham chiếu MSG §9 CRUD). |
| 7 | Mọi `TextArea` chống XSS bằng cách sanitize/escape khi hiển thị; mọi input chống SQL Injection bằng prepared statement phía server. |
| 8 | Trường dữ liệu nhạy cảm (CMND/CCCD, số tài khoản) thực hiện masking theo policy: chỉ hiển thị 4 ký tự cuối với vai trò không có quyền `VIEW_PII`. |
| 9 | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload. |
| 10 | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F8`, `F9`, …) đồng bộ với `spec_button.md`. |

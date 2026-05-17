# Đặc tả trường dữ liệu

> Chú thích cột **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện (ghi rõ điều kiện trong "Mô tả/Ràng buộc").
>
> Chú thích cột **Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / DateTime Picker / Checkbox / Radio / File Upload / Lookup.

## 1. Màn hình `<MOD>.NEW`, `<MOD>.VIEW`, `<MOD>.EDIT`

### 1.1. \[Tab\] Thông tin chung

| Trường               | Trường (ENG)     | Loại         | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | ---------------- | ------------ | -------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kênh                 | Channel          | Dropdown     | Y        |                  | String       | Mặc định hiển thị theo user đăng nhập. Danh mục gồm: Liên ngân hàng; Thanh toán song phương.                                                                                                                                                                                                                                                                                                                   |
| Loại lệnh            | Transaction Type | Dropdown     | Y        |                  | String       | Bắt buộc chọn trong danh mục. Nếu **Kênh = Thanh toán song phương**: Lệnh chuyển khoản / Lệnh chi TM cho KBNN / Lệnh chi TM cho KH / TT bằng ngoại tệ khác. Nếu **Kênh = Liên ngân hàng**: mặc định "Lệnh thông thường"; danh mục gồm: Lệnh thông thường / Lệnh trái phiếu chính phủ / Lệnh có thông tin thu NSNN.                                                                                             |
| NH/KB chuyển         | SENDER           | TextBox      | Y        |                  | String       | Tự hiển thị mã NH trực tiếp của đơn vị user đăng nhập, không cho sửa.                                                                                                                                                                                                                                                                                                                                          |
| NH/KB nhận           | RECEIVER         | TextBox      | Y        |                  | String       | Tự hiển thị theo cặp thiết lập song phương và cho sửa với lệnh TTSP. Tự hiển thị mã NH trực tiếp của thông tin người nhận và không cho sửa với lệnh LNH.                                                                                                                                                                                                                                                       |
| Số YCTT/Số bút toán  | REF_NO           | TextBox      | Y        |                  | String       | Bắt buộc nhập. Với kênh Liên ngân hàng, số YCTT được hiểu là số bút toán.                                                                                                                                                                                                                                                                                                                                      |
| Ngày thanh toán      | PAYMENT_DATE     | Date Picker  | Y        | Ngày hiện tại    | Date         | Tự hiển thị ngày hiện tại và không cho phép sửa.                                                                                                                                                                                                                                                                                                                                                               |
| Số tiền chuyển       | AMOUNT           | Number Field | Y        |                  | Number       | Tự hiển thị bằng tổng tiền ở các dòng chi tiết khoản mục.                                                                                                                                                                                                                                                                                                                                                      |
| Loại tiền            | CURRENCY_CODE    | Dropdown     | Y        | VND              | String       | Mặc định "VNĐ" và cho phép chọn lại trong danh mục tiền tệ.                                                                                                                                                                                                                                                                                                                                                    |
| Loại giao dịch       | Transaction_Type | Dropdown     | C        |                  | String       | Chỉ hiển thị khi **Kênh = Liên ngân hàng**. Danh mục: Lệnh chuyển Có GT thấp / Lệnh chuyển Nợ GT thấp / Lệnh chuyển Có GT cao / Lệnh chuyển Nợ GT cao. (1) Nếu Số tiền chuyển ≥ 500 triệu đồng → mặc định "Lệnh chuyển Có GT cao", không cho chọn lại loại GT thấp. (2) Nếu Số tiền chuyển < 500 triệu đồng hoặc Loại tiền là ngoại tệ → mặc định "Lệnh chuyển Có GT thấp", cho phép chọn lại lên loại GT cao. |
| Tỷ giá               | Exchange_Rate    | Number Field | C        |                  | Number       | Chỉ hiển thị và bắt buộc nhập nếu chọn Loại tiền là ngoại tệ.                                                                                                                                                                                                                                                                                                                                                  |
| Số chứng từ gốc      | ORGIN_NUM        | TextBox      | C        |                  | Varchar      | Bắt buộc nhập nếu Kênh = Thanh toán song phương.                                                                                                                                                                                                                                                                                                                                                               |
| Ngày chứng từ        | Transaction_Date | Date Picker  | C        |                  | Date         | Bắt buộc nhập nếu Kênh = Thanh toán song phương.                                                                                                                                                                                                                                                                                                                                                               |
| Loại phí             | EXP_TYPE         | Dropdown     | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác.                                                                                                                                                                                                                                                                                                                                                                |
| Mã ngoại tệ trích nợ | FN_CODE1         | Dropdown     | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Cho chọn trong danh mục tiền tệ.                                                                                                                                                                                                                                                                                                                               |
| Mã ngoại tệ TT       | FN_CODE2         | Dropdown     | C        |                  | String       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác. Cho chọn trong danh mục tiền tệ.                                                                                                                                                                                                                                                                                                                               |
| Số tiền ngoại tệ TT  | FN_AMOUNT        | Number Field | C        |                  | Number       | Bắt buộc nếu Loại lệnh = TT bằng ngoại tệ khác.                                                                                                                                                                                                                                                                                                                                                                |
| Nội dung thanh toán  | DESCRIPTION      | TextArea     | Y        |                  | String       | Bắt buộc nhập.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Người lập            | CREATED_BY       | TextBox      | N (auto) |                  | String       | Hệ thống tự lấy user hiện tại đang lập lệnh thanh toán, không cho phép sửa.                                                                                                                                                                                                                                                                                                                                    |
| Ngày lập             | CREATED_DATE     | Date Picker  | N (auto) |                  | DateTime     | Tự động hiển thị thời gian ngày làm việc hiện tại lập lệnh theo định dạng `dd/mm/yyyy hh:MM:ss`, không cho phép sửa.                                                                                                                                                                                                                                                                                           |

### 1.2. \[Tab\] Thông tin khoản mục

| Trường      | Trường (ENG) | Loại         | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                       |
| ----------- | ------------ | ------------ | -------- | ---------------- | ------------ | --------------------------------------------------------------------------------------- |
| Mã quỹ      | GL_Segment1  | TextBox      | N        | 01               | Varchar(2)   | 2 ký tự. Cho phép sửa, tuân theo ràng buộc kết hợp chéo (CCID).                         |
| TK tự nhiên | GL_Segment2  | Number Field | Y        |                  | Varchar(4)   | Tài khoản tự nhiên 4 ký tự, tuân theo CCID.                                             |
| DVQHNS      | GL_Segment3  | Number Field | Y        |                  | Varchar(7)   | Đơn vị quan hệ ngân sách 7 ký tự, tuân theo CCID.                                       |
| Cấp NS      | GL_Segment4  | Number Field | C        |                  | Varchar      | Cấp ngân sách, tuân theo CCID.                                                          |
| Chương      | GL_Segment5  | Number Field | C        | 000              | Varchar(3)   | Mã chương 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`.               |
| Ngành KT    | GL_Segment6  | Number Field | C        | 000              | Varchar(3)   | Mã ngành kinh tế 3 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `000`.        |
| NDKT        | GL_Segment7  | Number Field | C        | 0000             | Varchar(4)   | Nội dung kinh tế 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`.       |
| ĐB          | GL_Segment8  | Number Field | C        | 00000            | Varchar(5)   | Mã địa bàn 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`.            |
| CTMT        | GL_Segment9  | Number Field | C        | 00000            | Varchar(5)   | Chương trình mục tiêu 5 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00000`. |
| MN          | GL_Segment10 | Number Field | C        | 00               | Varchar(2)   | Mã nguồn kinh phí 2 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`.        |
| Kho bạc     | GL_Segment11 | Number Field | C        | 0000             | Varchar(4)   | Mã kho bạc 4 ký tự, tuân theo CCID. Nếu không bắt buộc thì mặc định `0000`.             |
| DP          | GL_Segment12 | Number Field | C        | 00               | Varchar(3)   | Mã dự phòng, tuân theo CCID. Nếu không bắt buộc thì mặc định `00`.                      |
| Diễn giải   | DESCRIPTION  | TextArea     | Y        |                  | String       | Diễn giải số tiền chi tiết của dòng.                                                    |
| Số tiền     | AMOUNT       | Number Field | Y        |                  | Number       | Số tiền của dòng chi tiết. Tổng dòng = Số tiền chuyển ở Tab Thông tin chung.            |

### 1.3. \[Tab\] Thông tin người chuyển

| Trường             | Trường (ENG)        | Loại         | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                        |
| ------------------ | ------------------- | ------------ | -------- | ---------------- | ------------ | -------------------------------------------------------- |
| Tên                | SENDER_NAME         | TextBox      | Y        |                  | String       | Tự hiển thị theo mã COA đã nhập và cho phép sửa.         |
| Địa chỉ            | SENDER_ADDRESS      | TextBox      | Y        |                  | String       | Cho nhập.                                                |
| Tài khoản          | SENDER_GL_Segment2  | Number Field | Y        |                  | Number       | Tự hiển thị theo mã COA và không cho sửa.                |
| Mã KH              | SENDER_NUM          | Number Field | N        |                  | Number       | Cho nhập.                                                |
| Mở tại NH/KB       | SENDER_BANK_CODE    | TextBox      | Y        |                  | String       | Tự hiển thị mã NH của user đăng nhập.                    |
| CMND/CCCD/HC/Mã DN | SENDER_IDENTIFY_ID  | TextBox      | N        |                  | String       | Cho nhập.                                                |
| Ngày cấp           | SENDER_ISSUED_DATE  | Date Picker  | C        |                  | Date         | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.         |
| Nơi cấp            | SENDER_ISSUED_PLACE | TextBox      | C        |                  | String       | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN.         |
| Mã TPCP            | TPCP_CODE           | TextBox      | C        |                  | String       | Bắt buộc nhập nếu Loại lệnh = Lệnh trái phiếu chính phủ. |

### 1.4. \[Tab\] Thông tin người nhận

| Trường             | Trường (ENG)          | Loại         | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                |
| ------------------ | --------------------- | ------------ | -------- | ---------------- | ------------ | ------------------------------------------------ |
| Tên                | RECEIVER_NAME         | TextBox      | Y        |                  | String       | Cho nhập.                                        |
| Địa chỉ            | RECEIVER_ADDRESS      | TextBox      | N        |                  | String       | Cho nhập.                                        |
| Tài khoản          | RECEIVER_GL_Segment2  | Number Field | Y        |                  | Number       | Cho phép nhập số tài khoản của người nhận tiền.  |
| Mở tại NH/KB       | RECEIVER_BANK_NAME    | TextBox      | Y        |                  | String       | Cho nhập.                                        |
| Tên tài khoản      | RECEIVER_BANK_CODE    | TextBox      | Y        |                  | String       | Cho phép nhập tên tài khoản của người nhận tiền. |
| CMND/CCCD/HC/Mã DN | RECEIVER_IDENTIFY_ID  | TextBox      | N        |                  | String       | Cho nhập.                                        |
| Ngày cấp           | RECEIVER_ISSUED_DATE  | Date Picker  | C        |                  | Date         | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |
| Nơi cấp            | RECEIVER_ISSUED_PLACE | TextBox      | C        |                  | String       | Bắt buộc nhập nếu đã nhập số CMND/CCCD/HC/Mã DN. |

---

## 2. Màn hình `<MOD>.LIST`

> Mục đích: liệt kê các yêu cầu thanh toán (YCTT)/bút toán đã lập; cho phép tra cứu theo nhiều tiêu chí và truy cập các thao tác Xem/Sửa/Xoá/Sao chép/Gửi kiểm soát/Phê duyệt/Xuất/In.

### 2.1. Khu vực bộ lọc tìm kiếm

| Trường               | Trường (ENG)         | Loại                                   | Bắt buộc | Giá trị mặc định         | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                                                       |
| -------------------- | -------------------- | -------------------------------------- | -------- | ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kênh                 | Channel              | Dropdown                               | N        | Tất cả                   | String       | Danh mục: Liên ngân hàng; Thanh toán song phương; Tất cả.                                                                                                               |
| Loại lệnh            | Transaction Type     | Dropdown                               | N        | Tất cả                   | String       | Danh mục động theo "Kênh"; mặc định Tất cả.                                                                                                                             |
| Loại giao dịch (LNH) | LNH_Transaction_Type | Dropdown                               | N        | Tất cả                   | String       | Chỉ hiển thị khi Kênh = Liên ngân hàng. Danh mục: GT cao Có/Nợ, GT thấp Có/Nợ, Tất cả.                                                                                  |
| Số YCTT/Số bút toán  | REF_NO               | TextBox                                | N        |                          | String       | Hỗ trợ tìm chính xác hoặc bắt đầu bằng.                                                                                                                                 |
| Số chứng từ gốc      | ORGIN_NUM            | TextBox                                | N        |                          | String       | Tìm chính xác/bắt đầu bằng.                                                                                                                                             |
| Trạng thái           | F-STATUS             | Dropdown (multi-select)                | N        | Tất cả trạng thái hợp lệ | String       | Danh mục theo §11 CRUD: Draft, Ready_For_Approval, Pending_Approver, Approved, Returned_To_Maker, Rejected, Deleted. Mặc định ẩn các bản ghi Deleted trừ khi tick chọn. |
| NH/KB chuyển         | SENDER               | TextBox + Lookup `<MOD>.LOOKUP.BANK`   | N        | Mã đơn vị user đăng nhập | String       | F4 để tra cứu danh mục NH/KB.                                                                                                                                           |
| NH/KB nhận           | RECEIVER             | TextBox + Lookup `<MOD>.LOOKUP.BANK`   | N        |                          | String       | F4 để tra cứu.                                                                                                                                                          |
| Tài khoản chuyển     | SENDER_GL_Segment2   | Number Field                           | N        |                          | Number       | Lọc theo TK tự nhiên người chuyển.                                                                                                                                      |
| Tài khoản nhận       | RECEIVER_GL_Segment2 | Number Field                           | N        |                          | Number       | Lọc theo TK tự nhiên người nhận.                                                                                                                                        |
| Từ ngày              | FROM_DATE            | Date Picker                            | Y        | Ngày hiện tại − 7        | Date         | Khoảng thời gian "Ngày lập" hoặc "Ngày thanh toán" (chọn 1 trong combobox `DATE_FIELD`).                                                                                |
| Đến ngày             | TO_DATE              | Date Picker                            | Y        | Ngày hiện tại            | Date         | Phải ≥ Từ ngày; khoảng cách ≤ 90 ngày (cảnh báo nếu vượt).                                                                                                              |
| Loại ngày lọc        | DATE_FIELD           | Dropdown                               | Y        | Ngày lập                 | String       | Danh mục: Ngày lập / Ngày thanh toán / Ngày kiểm soát / Ngày phê duyệt.                                                                                                 |
| Số tiền từ           | AMOUNT_FROM          | Number Field                           | N        |                          | Number       | Định dạng nhóm hàng nghìn.                                                                                                                                              |
| Số tiền đến          | AMOUNT_TO            | Number Field                           | N        |                          | Number       | ≥ Số tiền từ.                                                                                                                                                           |
| Loại tiền            | CURRENCY_CODE        | Dropdown                               | N        | Tất cả                   | String       | Danh mục tiền tệ.                                                                                                                                                       |
| Người lập            | CREATED_BY           | TextBox + Lookup `<MOD>.LOOKUP.USER`   | N        |                          | String       | Hỗ trợ tra cứu user nội bộ.                                                                                                                                             |
| Người kiểm soát      | CHECKED_BY           | TextBox + Lookup `<MOD>.LOOKUP.USER`   | N        |                          | String       |                                                                                                                                                                         |
| Người phê duyệt      | APPROVED_BY          | TextBox + Lookup `<MOD>.LOOKUP.USER`   | N        |                          | String       |                                                                                                                                                                         |
| DVQHNS               | GL_Segment3          | TextBox + Lookup `<MOD>.LOOKUP.DVQHNS` | N        |                          | Varchar(7)   | Lọc theo DVQHNS phát sinh trong dòng chi tiết.                                                                                                                          |

### 2.2. Khu vực kết quả (grid)

| STT | Trường              | Trường (ENG)         | Loại hiển thị               | Sắp xếp | Mô tả / Ràng buộc                                                                                                                |
| --- | ------------------- | -------------------- | --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Số YCTT/Số bút toán | REF_NO               | Link (mở `<MOD>.VIEW`)      | ✓       | Click mở chi tiết giao dịch.                                                                                                     |
| 2   | Kênh                | Channel              | Text                        | ✓       |                                                                                                                                  |
| 3   | Loại lệnh           | Transaction Type     | Text                        | ✓       |                                                                                                                                  |
| 4   | Loại GD (LNH)       | LNH_Transaction_Type | Text                        | –       | Chỉ hiển thị giá trị khi Kênh = LNH.                                                                                             |
| 5   | Ngày lập            | CREATED_DATE         | Text (`dd/mm/yyyy hh:MM`)   | ✓       |                                                                                                                                  |
| 6   | Ngày thanh toán     | PAYMENT_DATE         | Text (`dd/mm/yyyy`)         | ✓       |                                                                                                                                  |
| 7   | NH/KB chuyển        | SENDER               | Text                        | ✓       |                                                                                                                                  |
| 8   | NH/KB nhận          | RECEIVER             | Text                        | ✓       |                                                                                                                                  |
| 9   | Tên người chuyển    | SENDER_NAME          | Text                        | –       | Truncate, tooltip full.                                                                                                          |
| 10  | Tên người nhận      | RECEIVER_NAME        | Text                        | –       | Truncate, tooltip full.                                                                                                          |
| 11  | Số tiền chuyển      | AMOUNT               | Number (right-align, 2 dec) | ✓       |                                                                                                                                  |
| 12  | Loại tiền           | CURRENCY_CODE        | Text (center)               | –       |                                                                                                                                  |
| 13  | Nội dung TT         | DESCRIPTION          | Text                        | –       | Truncate ≥ 60 ký tự, tooltip full.                                                                                               |
| 14  | Trạng thái          | F-STATUS             | Badge (màu theo trạng thái) | ✓       | Xanh: Approved; Vàng: Pending_Approver/Ready_For_Approval; Xám: Draft; Đỏ: Rejected; Cam: Returned_To_Maker.                     |
| 15  | Người lập           | CREATED_BY           | Text                        | ✓       |                                                                                                                                  |
| 16  | Người kiểm soát     | CHECKED_BY           | Text                        | ✓       |                                                                                                                                  |
| 17  | Người phê duyệt     | APPROVED_BY          | Text                        | ✓       |                                                                                                                                  |
| 18  | F-VER               | F-VER                | Text                        | –       | Số phiên bản.                                                                                                                    |
| 19  | Thao tác            | ACTIONS              | Icon group                  | –       | Tổ hợp nút theo VAL-13/VAL-14: Xem (F3), Sửa (F2), Xoá (Delete), Sao chép (Ctrl+Shift+C), Gửi kiểm soát (F9), Phê duyệt (F8/F9). |

### 2.3. Khu vực thanh công cụ và footer

| Trường       | Mô tả                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Số bản ghi   | Tổng số bản ghi khớp bộ lọc.                                                                     |
| Tổng số tiền | Tổng `AMOUNT` (theo từng loại tiền) của các bản ghi khớp bộ lọc — chỉ tính trạng thái ≠ Deleted. |
| Phân trang   | 20 / 50 / 100 / 200 bản ghi/trang; mặc định 20.                                                  |
| Sắp xếp      | Mặc định `CREATED_DATE` DESC.                                                                    |
| Lưu bộ lọc   | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope).                                                |

---

## 3. Đặc tả trường cho các màn hình bổ sung

### 3.1. Màn hình `<MOD>.DELETE`

> Popup xác nhận xoá mềm bản ghi YCTT/bút toán ở trạng thái cho phép xoá (Draft, Returned_To_Maker).

| Trường              | Trường (ENG)     | Loại     | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                              |
| ------------------- | ---------------- | -------- | -------- | ------------------ | ------------ | ---------------------------------------------- |
| Số YCTT/Số bút toán | REF_NO           | Label    | –        | Tự lấy từ bản ghi  | String       | Read-only.                                     |
| Loại lệnh           | Transaction Type | Label    | –        | Tự lấy             | String       | Read-only.                                     |
| Số tiền chuyển      | AMOUNT           | Label    | –        | Tự lấy             | Number       | Hiển thị có nhóm hàng nghìn + loại tiền.       |
| Trạng thái hiện tại | F-STATUS         | Label    | –        | Tự lấy             | String       | Phải ∈ {Draft, Returned_To_Maker} (VAL-13).    |
| Lý do xoá           | DELETE_REASON    | TextArea | Y        |                    | String       | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16). |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y        | Off                | Boolean      | Phải tick mới enable nút "Xác nhận xoá".       |
| Người xoá           | DELETED_BY       | Label    | –        | User hiện tại      | String       | Auto.                                          |
| Thời gian xoá       | DELETED_DATE     | Label    | –        | Thời gian hệ thống | DateTime     | Auto, hiển thị `dd/mm/yyyy hh:MM:ss`.          |

### 3.2. Màn hình `<MOD>.DETAIL.GRID`

> Lưới chi tiết khoản mục (hiển thị/sửa nhiều dòng chi tiết COA) — popup hoặc inline trong `<MOD>.NEW`/`<MOD>.EDIT`.

| Trường      | Trường (ENG)     | Loại             | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                     |
| ----------- | ---------------- | ---------------- | -------- | ---------------- | ------------ | ----------------------------------------------------- |
| STT         | LINE_NO          | Label            | –        | Tự tăng          | Number       | Auto, không cho sửa.                                  |
| Mã quỹ      | GL_Segment1      | TextBox + Lookup | N        | 01               | Varchar(2)   | Tuân theo CCID.                                       |
| TK tự nhiên | GL_Segment2      | TextBox + Lookup | Y        |                  | Varchar(4)   | Tuân theo CCID.                                       |
| DVQHNS      | GL_Segment3      | TextBox + Lookup | Y        |                  | Varchar(7)   | Tuân theo CCID.                                       |
| Cấp NS      | GL_Segment4      | Dropdown         | C        |                  | Varchar      | Tuân theo CCID.                                       |
| Chương      | GL_Segment5      | TextBox + Lookup | C        | 000              | Varchar(3)   |                                                       |
| Ngành KT    | GL_Segment6      | TextBox + Lookup | C        | 000              | Varchar(3)   |                                                       |
| NDKT        | GL_Segment7      | TextBox + Lookup | C        | 0000             | Varchar(4)   |                                                       |
| ĐB          | GL_Segment8      | TextBox + Lookup | C        | 00000            | Varchar(5)   |                                                       |
| CTMT        | GL_Segment9      | TextBox + Lookup | C        | 00000            | Varchar(5)   |                                                       |
| MN          | GL_Segment10     | TextBox + Lookup | C        | 00               | Varchar(2)   |                                                       |
| Kho bạc     | GL_Segment11     | TextBox + Lookup | C        | 0000             | Varchar(4)   |                                                       |
| DP          | GL_Segment12     | TextBox + Lookup | C        | 00               | Varchar(3)   |                                                       |
| Diễn giải   | LINE_DESCRIPTION | TextArea         | Y        |                  | String       | Diễn giải dòng chi tiết.                              |
| Số tiền     | LINE_AMOUNT      | Number Field     | Y        |                  | Number       | Tổng `LINE_AMOUNT` = `AMOUNT` tab Thông tin chung.    |
| Thao tác    | ACTIONS          | Icon group       | –        |                  | –            | Thêm dòng / Xoá dòng / Sao chép dòng / Sửa CCID dòng. |

**Footer:** Hiển thị "Tổng số dòng", "Tổng số tiền dòng" và so khớp với "Số tiền chuyển" — chênh lệch sẽ hiển thị MSG-WAR-AMOUNT-MISMATCH.

### 3.3. Màn hình `<MOD>.ATTACH`

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
| Trạng thái    | ATTACH_STATUS | Label       | –        |                    | String       | Active/Deleted (soft-delete).                                                  |
| Thao tác      | ACTIONS       | Icon group  | –        |                    | –            | Tải xuống (Ctrl+J) / Xem trước / Xoá (Shift+Delete) — theo quyền và VAL-13/14. |

**Footer:** "Tổng số file: N", "Tổng dung lượng: X MB" (giới hạn tổng ≤ 50MB/bản ghi).

### 3.4. Màn hình `<MOD>.HISTORY`

> Lịch sử thay đổi/audit của bản ghi (chế độ chỉ đọc).

| Trường                 | Trường (ENG) | Loại       | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                                                                      |
| ---------------------- | ------------ | ---------- | -------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STT                    | SEQ_NO       | Label      | –        | Tự tăng          | Number       |                                                                                                                                                                                        |
| Thời điểm              | ACTION_DATE  | Label      | –        |                  | DateTime     | `dd/mm/yyyy hh:MM:ss`, sắp xếp DESC mặc định.                                                                                                                                          |
| Người thực hiện        | ACTOR        | Label      | –        |                  | String       | Username + Họ tên + Vai trò.                                                                                                                                                           |
| Vai trò                | ACTOR_ROLE   | Label      | –        |                  | String       | Maker / Checker / Approver / System.                                                                                                                                                   |
| Hành động              | ACTION       | Label      | –        |                  | String       | Tham chiếu Event ID §10 CRUD: NEW.OPEN/SAVE/SUBMIT, EDIT.OPEN/SAVE, DELETE.CONFIRM, APPROVE.CHECKER/APPROVER/RETURN/REJECT, ATTACH.UPLOAD/DELETE/DOWNLOAD, PRINT.PREVIEW, LIST.EXPORT… |
| Trạng thái trước       | STATUS_FROM  | Label      | –        |                  | String       | F-STATUS trước hành động.                                                                                                                                                              |
| Trạng thái sau         | STATUS_TO    | Label      | –        |                  | String       | F-STATUS sau hành động.                                                                                                                                                                |
| Phiên bản              | F-VER        | Label      | –        |                  | Number       |                                                                                                                                                                                        |
| Lý do/Ghi chú          | NOTE         | Label      | –        |                  | String       | Lý do từ chối/trả lại/xoá.                                                                                                                                                             |
| IP máy trạm            | CLIENT_IP    | Label      | –        |                  | String       | IPv4/IPv6.                                                                                                                                                                             |
| Tên máy                | HOST_NAME    | Label      | –        |                  | String       |                                                                                                                                                                                        |
| Channel                | CHANNEL      | Label      | –        |                  | String       | Web / API / Mobile.                                                                                                                                                                    |
| Trường thay đổi (Diff) | DIFF         | Expandable | –        |                  | JSON         | Hiển thị `field`, `oldValue`, `newValue` (BIZ-007).                                                                                                                                    |

**Bộ lọc:** Theo hành động (multi-select), khoảng thời gian, vai trò, người thực hiện. **Xuất:** Cho phép export Excel/CSV (audit log).

### 3.5. Màn hình `<MOD>.LOOKUP`

> Popup tra cứu danh mục dùng chung (mỗi danh mục có 1 màn hình `<MOD>.LOOKUP.<TYPE>`: BANK, USER, DVQHNS, CURRENCY, COA, …).

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

### 3.6. Màn hình `<MOD>.CHECK` (Kiểm soát viên — Checker)

> Hiển thị toàn bộ trường từ §1 ở chế độ read-only, kèm vùng thao tác kiểm soát.

**Khu vực thông tin giao dịch (read-only):** Mọi trường tại §1.1 → §1.4 + §3.2 Detail Grid + §3.3 Attach Tab + §3.4 History Tab.

**Khu vực thao tác Kiểm soát:**

| Trường              | Trường (ENG)     | Loại          | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                                                                                                                                             |
| ------------------- | ---------------- | ------------- | -------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kết quả kiểm soát   | CHECK_RESULT     | Radio         | Y        | (chưa chọn)        | String       | Một trong: Đồng ý kiểm soát / Trả lại Maker / Từ chối.                                                                                                        |
| Ghi chú kiểm soát   | CHECK_NOTE       | TextArea      | C        |                    | String       | Bắt buộc nếu chọn "Trả lại" hoặc "Từ chối", ≥ 10 ký tự.                                                                                                       |
| Mã lỗi nghiệp vụ    | CHECK_ERROR_CODE | Dropdown      | C        |                    | String       | Tra cứu danh mục mã lỗi (BIZ-CHECK-ERR-\*) nếu trả lại/từ chối.                                                                                               |
| Người kiểm soát     | CHECKED_BY       | Label         | –        | User hiện tại      | String       | Auto, phải ≠ Maker (SoD — BIZ-001).                                                                                                                           |
| Vai trò             | CHECKER_ROLE     | Label         | –        |                    | String       | Auto.                                                                                                                                                         |
| Thời gian kiểm soát | CHECKED_DATE     | Label         | –        | Thời gian hệ thống | DateTime     | Auto.                                                                                                                                                         |
| Checklist rà soát   | CHECKLIST        | Checkbox list | Y        | Off                | Boolean      | Buộc tick đủ các mục trước khi enable nút "Đồng ý kiểm soát" (mục theo cấu hình: TK chuyển/nhận đúng, COA hợp lệ, Hạn mức, Khớp tổng tiền, Đính kèm hợp lệ…). |

### 3.7. Màn hình `<MOD>.APPROVE` (Người phê duyệt — Approver)

> Tương tự `<MOD>.CHECK` nhưng dành cho cấp phê duyệt cuối; ràng buộc thẩm quyền theo hạn mức.

**Khu vực thông tin giao dịch (read-only):** Mọi trường tại §1.1 → §1.4 + §3.2 Detail Grid + §3.3 Attach Tab + §3.4 History Tab + thông tin kiểm soát tại §3.6.

**Khu vực thao tác Phê duyệt:**

| Trường               | Trường (ENG)   | Loại            | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                                                            |
| -------------------- | -------------- | --------------- | -------- | ------------------ | ------------ | ---------------------------------------------------------------------------- |
| Kết quả phê duyệt    | APPROVE_RESULT | Radio           | Y        | (chưa chọn)        | String       | Một trong: Đồng ý phê duyệt / Trả lại / Từ chối.                             |
| Ghi chú phê duyệt    | APPROVE_NOTE   | TextArea        | C        |                    | String       | Bắt buộc nếu chọn "Trả lại"/"Từ chối", ≥ 10 ký tự.                           |
| Hạn mức áp dụng      | LIMIT_APPLIED  | Label           | –        | Tự tính            | Number       | Hạn mức của Approver hiện tại; báo lỗi nếu AMOUNT > hạn mức (MSG-ERR-LIMIT). |
| Người phê duyệt      | APPROVED_BY    | Label           | –        | User hiện tại      | String       | Auto, phải ≠ Maker và ≠ Checker (SoD — BIZ-001).                             |
| Vai trò/Cấp duyệt    | APPROVER_ROLE  | Label           | –        |                    | String       | Cấp 1/Cấp 2 theo cấu hình workflow.                                          |
| Thời gian phê duyệt  | APPROVED_DATE  | Label           | –        | Thời gian hệ thống | DateTime     | Auto.                                                                        |
| Phương thức xác thực | AUTH_METHOD    | Radio           | Y        | OTP                | String       | OTP / Ký số. Với GD vượt ngưỡng — bắt buộc Ký số.                            |
| OTP                  | OTP_CODE       | TextBox         | C        |                    | String(6)    | Bắt buộc nếu AUTH_METHOD = OTP; TTL 60s.                                     |
| Chứng thư số         | CERT_SERIAL    | Label           | C        |                    | String       | Bắt buộc nếu AUTH_METHOD = Ký số; chọn từ USB Token/HSM.                     |
| Chữ ký số            | SIGNATURE      | Hidden (Base64) | C        |                    | String       | Sinh bởi mô-đun ký số (CAdES/PAdES), không hiển thị giá trị raw.             |

### 3.8. Màn hình `<MOD>.PRINT`

> Cấu hình + xem trước trước khi in chứng từ giao dịch.

| Trường          | Trường (ENG)        | Loại         | Bắt buộc | Giá trị mặc định   | Loại dữ liệu | Mô tả / Ràng buộc                                                      |
| --------------- | ------------------- | ------------ | -------- | ------------------ | ------------ | ---------------------------------------------------------------------- |
| Mẫu in          | TEMPLATE_CODE       | Dropdown     | Y        | Mẫu chuẩn          | String       | Danh mục mẫu cấu hình (Mẫu chuẩn / Mẫu rút gọn / Mẫu LNH / Mẫu TTSP…). |
| Khổ giấy        | PAPER_SIZE          | Dropdown     | Y        | A4                 | String       | A4 / A5 / Letter.                                                      |
| Hướng giấy      | ORIENTATION         | Radio        | Y        | Portrait           | String       | Portrait / Landscape.                                                  |
| Số bản          | COPIES              | Number Field | Y        | 1                  | Integer      | 1–10.                                                                  |
| Loại bản        | PRINT_TYPE          | Radio        | Y        | Bản chính          | String       | Bản nháp / Bản chính / Bản sao. Bản nháp có watermark "DRAFT".         |
| Watermark       | WATERMARK_TEXT      | TextBox      | N        |                    | String       | Chỉ enable nếu PRINT_TYPE = Bản nháp/Bản sao; ≤ 30 ký tự.              |
| In kèm đính kèm | INCLUDE_ATTACHMENTS | Checkbox     | N        | Off                | Boolean      | Nếu tick → đính kèm các file PDF/ảnh ở §3.3 (chuyển ảnh sang PDF).     |
| In kèm lịch sử  | INCLUDE_HISTORY     | Checkbox     | N        | Off                | Boolean      | Nếu tick → in phần "Lịch sử phê duyệt" cuối chứng từ.                  |
| Ngôn ngữ in     | LANGUAGE            | Dropdown     | Y        | Tiếng Việt         | String       | Tiếng Việt / Tiếng Anh.                                                |
| Vùng xem trước  | PREVIEW             | PDF Viewer   | –        | Tự sinh            | Binary       | Render PDF tạm; chỉ phép tải xuống/in sau khi xác nhận.                |
| Người in        | PRINTED_BY          | Label        | –        | User hiện tại      | String       | Auto, ghi audit khi bấm "In".                                          |
| Thời gian in    | PRINTED_DATE        | Label        | –        | Thời gian hệ thống | DateTime     | Auto.                                                                  |

### 3.9. Màn hình `<MOD>.EXPORT`

> Cấu hình + thực hiện xuất dữ liệu danh sách giao dịch.

| Trường                | Trường (ENG)    | Loại           | Bắt buộc | Giá trị mặc định             | Loại dữ liệu | Mô tả / Ràng buộc                                                                      |
| --------------------- | --------------- | -------------- | -------- | ---------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| Định dạng             | EXPORT_FORMAT   | Radio          | Y        | XLSX                         | String       | XLSX / CSV / PDF.                                                                      |
| Phạm vi               | EXPORT_SCOPE    | Radio          | Y        | Toàn bộ kết quả lọc          | String       | Trang hiện tại / Toàn bộ kết quả lọc / Theo lựa chọn (checkbox trên LIST).             |
| Trường xuất           | EXPORT_FIELDS   | Checkbox list  | Y        | Mặc định 10 trường chính     | String[]     | Cho phép chọn/bỏ chọn từng cột của §2.2; lưu preset cá nhân.                           |
| Sắp xếp theo          | SORT_BY         | Dropdown       | N        | Theo grid hiện tại           | String       | Có thể override sắp xếp.                                                               |
| Bộ lọc kế thừa        | INHERIT_FILTER  | Checkbox       | Y        | On                           | Boolean      | Tick → dùng bộ lọc đang áp dụng tại `<MOD>.LIST`; bỏ tick → mở popup nhập lại bộ lọc.  |
| Bao gồm dòng chi tiết | INCLUDE_DETAIL  | Checkbox       | N        | Off                          | Boolean      | Nếu tick → mỗi YCTT được trải thêm các dòng `<MOD>.DETAIL.GRID` ở sheet/trang kế tiếp. |
| Bao gồm tổng cộng     | INCLUDE_SUMMARY | Checkbox       | N        | On                           | Boolean      | Thêm dòng tổng số tiền theo từng loại tiền cuối file.                                  |
| Mã hoá file           | ENCRYPT_FILE    | Checkbox       | N        | Off                          | Boolean      | Nếu tick → mã hoá file bằng mật khẩu (gửi qua kênh riêng).                             |
| Mật khẩu              | EXPORT_PASSWORD | Password Field | C        |                              | String       | Bắt buộc nếu ENCRYPT_FILE = On; ≥ 8 ký tự, có chữ + số + ký tự đặc biệt.               |
| Tên file              | FILE_NAME       | TextBox        | Y        | `<MOD>_LIST_<yyyyMMdd_HHmm>` | String       | Cho sửa, chỉ chấp nhận `[A-Za-z0-9_\-]`.                                               |
| Watermark (PDF)       | WATERMARK_TEXT  | TextBox        | C        |                              | String       | Chỉ hiển thị khi EXPORT_FORMAT = PDF.                                                  |
| Ngôn ngữ tiêu đề cột  | LANGUAGE        | Dropdown       | Y        | Tiếng Việt                   | String       | Tiếng Việt / Tiếng Anh.                                                                |
| Người xuất            | EXPORTED_BY     | Label          | –        | User hiện tại                | String       | Auto, ghi audit `<MOD>.LIST.EXPORT`.                                                   |
| Thời gian xuất        | EXPORTED_DATE   | Label          | –        | Thời gian hệ thống           | DateTime     | Auto.                                                                                  |

**Ràng buộc chung:**

- Nếu số bản ghi vượt ngưỡng (mặc định 50,000) → bắt buộc chạy bất đồng bộ (job nền), trả về email/notification khi xong; không cho tải trực tiếp trên trình duyệt (tránh OOM).
- File xuất không chứa cột nhạy cảm (CMND/CCCD đầy đủ) trừ khi user có quyền `EXPORT_PII`.
- Log chi tiết tham số xuất + hash file vào audit (BIZ-007).

---

## 4. Quy ước chung về đặc tả trường

| STT | Quy ước                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mọi trường tiền tệ hiển thị có nhóm hàng nghìn (`#,##0.00`); căn phải; tổng tiền hiển thị theo từng loại tiền.                                            |
| 2   | Mọi trường ngày hiển thị theo `dd/mm/yyyy`; ngày giờ `dd/mm/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh.                                              |
| 3   | Mọi trường COA (GL_Segment\*) sử dụng cùng popup Lookup `<MOD>.LOOKUP.COA` và phải tuân theo Cross-Validation Rule (CCID).                                |
| 4   | Mọi trường Lookup có icon kính lúp + phím tắt `F4` (theo `spec_button.md`).                                                                               |
| 5   | Mọi trường bắt buộc đánh dấu sao đỏ (`*`) cạnh nhãn; trường bắt buộc có điều kiện đánh dấu `(*)` và mô tả điều kiện trong tooltip.                        |
| 6   | Khi field bị disable phải có tooltip giải thích lý do; field đang lỗi validate hiển thị viền đỏ + thông báo lỗi nằm dưới ô nhập (tham chiếu MSG §9 CRUD). |
| 7   | Mọi `TextArea` chống XSS bằng cách sanitize/escape khi hiển thị; mọi input chống SQL Injection bằng prepared statement phía server.                       |
| 8   | Trường dữ liệu nhạy cảm (CMND/CCCD, số tài khoản) thực hiện masking theo policy: chỉ hiển thị 4 ký tự cuối với vai trò không có quyền `VIEW_PII`.         |
| 9   | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload.                                                                   |
| 10  | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F8`, `F9`, …) đồng bộ với `spec_button.md`.                                                                |
# Đặc tả nút chức năng

> Tổng hợp các nút thao tác trên các màn hình của chức năng CRUD điển hình (`<MOD>.LIST`, `<MOD>.NEW`, `<MOD>.VIEW`, `<MOD>.EDIT`, `<MOD>.DELETE`, `<MOD>.APPROVE`, `<MOD>.ATTACH`, `<MOD>.PRINT`, `<MOD>.EXPORT`). Mã sự kiện tham chiếu §10 và §11 của `BangDacTaChucNang_CRUD_DienHinh.md`.

| STT | Tên nút                 | Tên nút (ENG)        | Mã sự kiện / Event ID                    | ĐK kích hoạt / Trigger                        | Phím tắt / Shortcut      | Mô tả / Description                                                                                                                                                                          | Ghi chú / Note                                                                                                                     |
| --- | ----------------------- | -------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tạo mới                 | New                  | `<MOD>.NEW.OPEN`                         | On click                                      | `Ctrl+N`                 | (1) Mở form Thêm mới trống                                                                                                                                                                   | (1) Hiển thị trên màn hình `<MOD>.LIST`, (2) Chỉ enable với user có vai trò Maker                                                  |
| 2   | Lưu                     | Save                 | `<MOD>.NEW.SAVE`                         | On click                                      | `Ctrl+S`                 | (1) Validate đầy đủ các quy tắc kiểm tra dữ liệu                                                                                                                                             | (1) Trên màn hình `<MOD>.NEW`, (2) Bind phím tắt `Ctrl+S`                                                                          |
| 3   | Lưu nháp                | Save Draft           | `<MOD>.NEW.SAVE`                         | On click                                      | `Ctrl+Shift+S`           | (1) Bỏ qua validate đầy đủ, (2) Chỉ validate định dạng, (3) Lưu DRAFT                                                                                                                        | Cùng event với "Lưu"; giúp Maker lưu giữa chừng khi dữ liệu chưa đủ                                                                |
| 4   | Gửi kiểm soát           | Submit               | `<MOD>.NEW.SUBMIT`                       | On click                                      | `Ctrl+Enter` (hoặc `F9`) | (1) Validate đầy đủ quy tắc kiểm tra dữ liệu, (2) Chuyển trạng thái Draft/Returned_To_Maker → Ready_For_Approval, (3) Gửi notify Checker                                                     | (1) Trên màn hình `<MOD>.LIST` (row action) và `<MOD>.NEW`, (2) Chỉ enable với user có vai trò Maker, (3) Disable nếu form invalid |
| 5   | Xem                     | View                 | `<MOD>.VIEW.OPEN`                        | On click row / On click link `<Mã giao dịch>` | `F3`                     | (1) Mở form read-only, (2) Hiển thị đầy đủ trường + [Tab] Đính kèm + [Tab] Lịch sử giao dịch + [Tab] Trạng thái phê duyệt                                                                    | Trên màn hình `<MOD>.LIST` (row action)                                                                                            |
| 6   | Sửa                     | Edit                 | `<MOD>.EDIT.OPEN`                        | On click                                      | `F2`                     | (1) Mở form editable; (2) Load phiên bản F-VER hiện hành; (3) Cho phép thay đổi field theo đặc tả                                                                                            | (1) Chỉ enable khi trạng thái F-STATUS là {Draft, Returned_To_Maker} và NSD là Maker gốc                                           |
| 7   | Lưu (Sửa)               | Save (Edit)          | `<MOD>.EDIT.SAVE`                        | On click                                      | `Ctrl+S`                 | (1) Cập nhật F-VER+1, (2) Ghi audit oldValue→newValue                                                                                                                                        | Trên màn hình `<MOD>.EDIT`                                                                                                         |
| 8   | Xoá                     | Delete               | `<MOD>.DELETE.OPEN`                      | On click                                      | `Delete`                 | (1) Mở popup `<MOD>.DELETE` nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận đã rà soát                                                                                                       | (1) Chỉ enable khi trạng thái F-STATUS là {Draft, Returned_To_Maker}, (2) NSD là Maker gốc                                         |
| 9   | Xác nhận xoá            | Confirm Delete       | `<MOD>.DELETE.CONFIRM`                   | On click                                      | `Enter` (trong popup)    | (1) Soft-delete (F-STATUS=Deleted); (2) Ghi audit log                                                                                                                                        | (1) Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox                                                                            |
| 10  | Huỷ                     | Cancel               | `<MOD>.NEW.CANCEL` / `<MOD>.EDIT.CANCEL` | On click                                      | `Esc`                    | (1) Nếu form đã có dữ liệu nhập → hỏi xác nhận, (2) Xác nhận → đóng form, (3) Huỷ bỏ các thay đổi đã thực hiện trên form                                                                     | Phím tắt `Esc`                                                                                                                     |
| 11  | Sao chép                | Copy                 | `<MOD>.NEW.COPY`                         | On click                                      | `Ctrl+Shift+C`           | (1) Mở form Thêm mới với dữ liệu sao chép từ bản ghi đang chọn, (2) Sinh F-ID giao dịch mới, (3) Trạng thái F-STATUS=Draft                                                                   | Trên màn hình `<MOD>.LIST` (row action)                                                                                            |
| 12  | Đặt lại                 | Reset                | `<MOD>.LIST.FILTER`                      | On click                                      | `F5` (hoặc `Ctrl+R`)     | Xoá bộ lọc về mặc định; tải lại danh sách                                                                                                                                                    | Trên màn hình `<MOD>.LIST`                                                                                                         |
| 13  | Xuất                    | Export               | `<MOD>.LIST.EXPORT`                      | On click                                      | `Ctrl+Shift+E`           | Xuất Excel/PDF/CSV                                                                                                                                                                           | Trên màn hình `<MOD>.LIST` và `<MOD>.EXPORT`                                                                                       |
| 14  | In phiếu                | Print                | `<MOD>.PRINT.PREVIEW`                    | On click                                      | `Ctrl+P`                 | (1) Sinh PDF preview theo template, (2) mở màn hình `<MOD>.PRINT`                                                                                                                            | Trên màn hình `<MOD>.VIEW` (tab Nhập liệu chính)                                                                                   |
| 15  | Đính kèm                | Upload               | `<MOD>.ATTACH.UPLOAD`                    | On click → On select file                     | `Ctrl+U`                 | (1) Mở popup `<MOD>.ATTACH`, (2) Chọn file, (3) Validate ≤ 10MB/file, (4) Định dạng pdf/jpg/png/docx, (5) upload lên kho lưu trữ                                                             | Trên màn hình `<MOD>.NEW`/`<MOD>.EDIT`                                                                                             |
| 16  | Xoá đính kèm            | Remove Attachment    | `<MOD>.ATTACH.DELETE`                    | On click                                      | `Shift+Delete`           | (1) Xoá file đính kèm khỏi bản ghi, (2) Ghi audit, (3) Hỏi xác nhận trước khi xoá                                                                                                            | Chỉ Maker gốc + trạng thái cho phép Sửa được phép thực hiện                                                                        |
| 17  | Tải file đính kèm       | Download Attachment  | `<MOD>.ATTACH.DOWNLOAD`                  | On click                                      | `Ctrl+J`                 | Tải file được tích lựa chọn tải xuống thư mục chỉ định                                                                                                                                       | Trên màn hình `<MOD>.ATTACH` và `<MOD>.VIEW` (tab Đính kèm)                                                                        |
| 18  | Kiểm soát (Checker)     | Approve (Checker)    | `<MOD>.APPROVE.CHECKER`                  | On click                                      | `F8`                     | (1) Validate thẩm quyền + SoD, (2) Chuyển trạng thái Ready_For_Approval → Pending_Approver, (3) Notify Approver                                                                              | (1) Trên màn hình `<MOD>.APPROVE`, (2) Người kiểm soát (Checker) không phải là Maker                                               |
| 19  | Phê duyệt (Approver)    | Approve (Approver)   | `<MOD>.APPROVE.APPROVER`                 | On click                                      | `F9`                     | (1) Chuyển trạng thái Pending_Approver → Approved, (2) Trigger luồng nghiệp vụ kế tiếp, (3) Notify Maker, Checker                                                                            | (1) Trên `<MOD>.APPROVE`, Người duyệt (Approver) không phải là Maker hay Checker                                                   |
| 20  | Trả lại                 | Return               | `<MOD>.APPROVE.RETURN`                   | On click                                      | `Alt+B`                  | (1) Nhập lý do trả lại, (2) Chuyển trạng thái về Returned_To_Maker, (3) notify Maker                                                                                                         | (1) Trên màn hình `<MOD>.APPROVE`, (2) Áp dụng cho cả Checker và Approver                                                          |
| 21  | Từ chối                 | Reject               | `<MOD>.APPROVE.REJECT`                   | On click                                      | `Alt+J`                  | (1) Nhập lý do từ chối, (2) Chuyển trạng thái về Rejected, (3) Khoá giao dịch, (4) Notify Maker                                                                                              | Trên màn hình `<MOD>.APPROVE`                                                                                                      |
| 22  | Mở Lịch sử              | Open History         | `<MOD>.VIEW.HISTORY`                     | On click tab                                  | `Alt+H`                  | Mở tab Lịch sử giao dịch trong `<MOD>.VIEW`; hiển thị thông tin người tạo, ngày tạo, người cập nhật cuối, ngày cập nhật cuối                                                                 | Trên màn hình `<MOD>.VIEW`                                                                                                         |
| 23  | Mở Trạng thái phê duyệt | Open Approval Status | `<MOD>.VIEW.APPROVAL`                    | On click tab                                  | `Alt+P`                  | (1) Mở tab Trạng thái phê duyệt, (2) Hiển thị workflow Maker → Checker → Approver, (3) Highlight trên workflow cho trạng thái hiện tại của giao dịch thuộc về Maker hay Checker hay Approver | Trên `<MOD>.VIEW`                                                                                                                  |
| 24  | Tra cứu danh mục        | Lookup               | (Mở popup `<MOD>.LOOKUP.*`)              | On click icon kính lúp                        | `F4`                     | (1) Mở popup tra cứu danh mục (đơn vị/tài khoản/mã quỹ…), (2) Chọn giá trị → trả về form                                                                                                     | (1) Đi kèm Combobox/Picker, (2) Hỗ trợ tìm kiếm, phân trang                                                                        |

## Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Mỗi nút phải kiểm tra quyền theo vai trò (Maker/Checker/Approver/Viewer) trước khi hiển thị; thiếu quyền → ẩn nút (hoặc disable + tooltip MSG-ERR-PERMISSION)                                                                              |
| 2   | Nút Sửa/Xoá: chỉ enable khi F-STATUS ∈ {Draft, Returned_To_Maker} (VAL-13) **và** NSD là Maker gốc (VAL-14); vi phạm trạng thái → MSG-ERR-STATUS; vi phạm sở hữu → MSG-ERR-MAKER                                                           |
| 3   | Nút Phê duyệt/Trả lại/Từ chối: chỉ hiển thị trên `<MOD>.APPROVE` cho user có thẩm quyền tương ứng cấp; SoD bắt buộc (BIZ-001)                                                                                                              |
| 4   | Nút Submit/Lưu: disable khi form chứa lỗi validate cứng; enable lại khi tất cả lỗi đã được fix                                                                                                                                             |
| 5   | Nút Xác nhận xoá: disable cho đến khi đủ lý do ≥ 10 ký tự + tick checkbox xác nhận (VAL-16)                                                                                                                                                |
| 6   | Nút Phê duyệt/Submit cho GD trọng yếu (vượt hạn mức / loại ưu tiên cao): bổ sung bước nhập OTP hoặc ký số trước khi commit                                                                                                                 |
| 7   | Mỗi lần bấm nút thành công: ghi audit (`<MOD>.AUDIT.WRITE`) gồm user, timestamp, IP, action, oldValue→newValue (BIZ-007)                                                                                                                   |
| 8   | Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server                                                                                                                                                 |
| 9   | Khi phiên hết hạn (`<MOD>.SESSION.TIMEOUT`) → mọi nút chuyển disable, hiển thị MSG-ERR-SESSION, redirect đăng nhập                                                                                                                         |
| 10  | Mọi nút hiển thị tooltip giải thích khi disable (lý do không cho thao tác); hỗ trợ accessibility (ARIA label, phím tắt)                                                                                                                    |
| 11  | Phím tắt phải được hiển thị trong tooltip nút (ví dụ "Lưu (Ctrl+S)") và đăng ký toàn cục trong form; tránh xung đột với phím tắt mặc định của trình duyệt (ví dụ `Ctrl+N` mở tab mới → ứng dụng cần `preventDefault` khi focus trong form) |
| 12  | Phím tắt nhóm chức năng phê duyệt (`F8`, `F9`, `Alt+B`, `Alt+J`) chỉ active trên `<MOD>.APPROVE`; phím `F2`, `F3`, `Delete` chỉ active khi có dòng được chọn trên `<MOD>.LIST`                                                             |
| 13  | Hỗ trợ phím `Tab`/`Shift+Tab` để di chuyển focus giữa các nút theo thứ tự logic; `Enter` kích hoạt nút có focus; cung cấp tổ hợp `Alt+/` để mở bảng tra cứu phím tắt                                                                       |

## Quy ước phím tắt

- **Nhóm soạn thảo (Maker)**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Ctrl+Shift+S` (Lưu nháp), `Ctrl+Enter`/`F9` (Gửi kiểm soát), `Esc` (Huỷ), `Ctrl+Shift+C` (Sao chép).
- **Nhóm thao tác bản ghi (LIST)**: `F2` (Sửa), `F3` (Xem), `Delete` (Xoá), `F5`/`Ctrl+R` (Đặt lại bộ lọc), `Ctrl+Shift+E` (Xuất), `Ctrl+P` (In).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường có icon kính lúp.
- **Nhóm kiểm soát/phê duyệt**: `F8` (Kiểm soát – Checker), `F9` (Phê duyệt – Approver), `Alt+B` (Trả lại – Back), `Alt+J` (Từ chối – reJect).
- **Nhóm đính kèm**: `Ctrl+U` (Upload), `Ctrl+J` (Download), `Shift+Delete` (Remove).
- **Nhóm điều hướng tab trong `<MOD>.VIEW`**: `Alt+H` (Lịch sử – History), `Alt+P` (Trạng thái phê duyệt – approval).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).
# Bảng đặc tả chức năng

> Chức năng điển hình **Thêm mới / Xem / Sửa / Xoá** một giao dịch. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế, giữ nguyên cấu trúc và danh mục kiểu trường/quy tắc.

## 1. Thông tin chung

| Trường        | Giá trị                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Mã chức năng  | `<Mã chức năng>`                                                                                                         |
| Tên chức năng | Quản lý giao dịch `<Tên chức năng>` — Thêm mới / Xem / Sửa / Xoá                                                         |
| Người sử dụng | Người lập (Maker), Người kiểm soát (Checker), Người phê duyệt (Approver), Người tra cứu (Viewer)                         |
| Mô tả         | Cho phép NSD tạo mới, tra cứu, sửa, xoá giao dịch `<Tên chức năng>`; gửi kiểm soát theo quy trình Maker–Checker–Approver |
| Độ ưu tiên    | Cao                                                                                                                      |
| URD reference | `<URD-XXX>`                                                                                                              |

## 2. Tiền điều kiện

| STT | Điều kiện                                                                              |
| --- | -------------------------------------------------------------------------------------- |
| 1   | NSD đã đăng nhập hệ thống                                                              |
| 2   | NSD có quyền truy cập màn hình theo vai trò (Maker/Checker/Approver/Viewer)            |
| 3   | Các danh mục Master Data đã được cấu hình (đơn vị, tài khoản, loại tiền, mã quỹ…)      |
| 4   | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái DRAFT hoặc RETURNED_TO_MAKER |
| 5   | (Trường hợp Sửa/Xoá) NSD là Maker gốc của bản ghi                                      |

## 3. Hậu điều kiện

| STT | Điều kiện                                                                             |
| --- | ------------------------------------------------------------------------------------- |
| 1   | (Trường hợp Thêm/Sửa) Bản ghi được lưu với trạng thái DRAFT hoặc READY_FOR_APPROVAL   |
| 2   | (Trường hợp Xoá) Bản ghi được soft-delete, ẩn khỏi danh sách, vẫn truy được qua audit |
| 3   | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue)               |
| 4   | (Trường hợp Submit giao dịch) Notification đã gửi đến Checker/Approver                |
| 5   | Số dư hold (nếu có) được cập nhật tương ứng                                           |

## 4. Luồng chính

| Bước | Người dùng                                                                               | Hệ thống                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Bấm **Thêm mới** trên màn hình danh sách, hoặc Menu "Thêm mới"                           | (1) Mở form trống, (2) Sinh ID của giao dịch, (3) Trạng thái giao dịch=DRAFT, (4) Tự động điền thông tin (người lập/ngày lập)           |
| 2    | Nhập các trường dữ liệu theo Bảng đặc tả Field                                           | (1) Kiểm tra dữ liệu khi rời ô nhập (onBlur), (2) Kiểm tra ràng buộc giữa các trường khi gửi lệnh, (3) Kiểm tra theo quy định nghiệp vụ |
| 3    | Đính kèm chứng từ (File upload) _(Optional)_                                             | Validate ≤ 10MB, định dạng pdf/jpg/png/docx (VAL-09)                                                                                    |
| 4    | Bấm **Lưu**                                                                              | Validate cơ bản; lưu DRAFT; hiển thị MSG-OK-SAVE                                                                                        |
| 5    | Bấm **Submit** (Gửi kiểm soát/phê duyệt)                                                 | Validate đầy đủ (Tham chiếu mục 6. Luồng ngoại lệ); chuyển trạng thái READY_FOR_APPROVAL; gửi notify Checker                            |
| 6    | (Trường hợp Xem) Chọn dòng trong danh sách, bấm **Xem** hoặc click link `<Mã giao dịch>` | Mở form read-only; hiển thị đầy đủ trường, [Tab] Đính kèm, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt                          |
| 7    | (Trường hợp Sửa) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Sửa**                       | Mở form editable; load phiên bản hiện hành F-VER của giao dịch; cho phép thay đổi các trường thông tin theo đặc tả Field                |
| 8    | (Trường hợp Sửa) Lưu thay đổi                                                            | Kiểm tra optimistic lock (VAL-15); cập nhật phiên bản giao dịch F-VER+1; ghi audit oldValue→newValue                                    |
| 9    | (Trường hợp Xoá) Trên bản ghi DRAFT/RETURNED_TO_MAKER, bấm **Xoá**                       | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận đã rà soát                                                                     |
| 10   | (Xoá) Bấm **Xác nhận xoá**                                                               | Soft-delete (F-STATUS=DELETED), ghi audit, release hold (nếu có), hiển thị MSG-OK-DELETE                                                |

## 5. Luồng thay thế

| Mã  | Mô tả                                           | Hệ thống                                                                       |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| A1  | NSD bấm **Lưu nháp** thay vì Submit             | Bỏ qua validate đầy đủ, chỉ validate định dạng; lưu DRAFT                      |
| A2  | NSD bấm **Huỷ** khi đang nhập                   | Nếu form đã nhập dữ liệu → hỏi xác nhận; nếu xác nhận → đóng form, bỏ thay đổi |
| A3  | NSD bấm **Export**                              | Xuất Excel/PDF/CSV (sync nếu < 50k bản ghi, async nếu vượt)                    |
| A4  | NSD copy từ bản ghi đã có                       | Mở form Thêm mới với dữ liệu sao chép; F-ID mới, F-STATUS=DRAFT                |
| A5  | Checker bấm **Phê duyệt** → chuyển Approver     | Cập nhật trạng thái READY_FOR_APPROVAL; notify Approver                        |
| A6  | Approver bấm **Phê duyệt**                      | Cập nhật APPROVED; trigger luồng nghiệp vụ kế tiếp                             |
| A7  | NSD bấm **In phiếu** trên [Tab] Nhập liệu chính | Sinh PDF theo template, hiển thị preview                                       |

## 6. Luồng ngoại lệ

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

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- |
| 1   | BIZ-001 — Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò                              |
| 2   | BIZ-002 — Chỉ Maker gốc được Sửa/Xoá khi bản ghi ở DRAFT/RETURNED_TO_MAKER                                |
| 3   | BIZ-003 — Xoá là soft-delete; bản ghi vẫn truy được qua audit/history                                     |
| 4   | BIZ-004 — Tổng tiền dòng chi tiết phải bằng F-AMOUNT của bản ghi cha                                      |
| 5   | BIZ-005 — File đính kèm: tối đa 10MB/file, định dạng pdf/jpg/png/docx; tối đa N file/bản ghi              |
| 6   | BIZ-006 — Lý do từ chối/huỷ ≥ 10 ký tự và ≤ 500 ký tự, lưu vào audit                                      |
| 7   | BIZ-007 — Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue                            |
| 8   | BIZ-008 — Transaction History ghi thông tin: created_by, created_date, last_updated_by, last_updated_date |
| 9   | BIZ-009 — Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp                       |
| 10  | BIZ-010 — Vượt hạn mức cấu hình → bắt buộc phê duyệt cấp cao hơn                                          |

## 8. Quy tắc kiểm tra dữ liệu

> Tổng hợp các quy tắc Validate được tham chiếu trong §4–§6. Phân loại theo phạm vi áp dụng: **Chung** (mọi chức năng/phân hệ), **Chức năng** (riêng chức năng này), **Phân hệ** (dùng chung trong phân hệ).

| STT | Phân loại | Mã     | Quy tắc                                                                                                                                                                                                |
| --- | --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Chung     | VAL-01 | Trường bắt buộc (`Mandatory`) không được bỏ trống khi Submit; highlight đỏ + thông báo `Vui lòng nhập [Tên trường]`                                                                                    |
| 2   | Chung     | VAL-02 | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Integer/Decimal (range, số chữ số thập phân), Date/DateTime (định dạng `dd/MM/yyyy [HH:mm:ss]`), Email (RFC 5322), Phone (E.164),... |
| 3   | Chung     | VAL-03 | Giá trị thuộc danh mục Master Data (Dropdown/Combobox/Tree-select/Picker); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường                                               |
| 4   | Chung     | VAL-04 | Range/min-max cho số và ngày (vd Số tiền > 0, Ngày hiệu lực ≥ Ngày hiện tại); DateRange: Từ ngày ≤ Đến ngày, không vượt biên độ cấu hình                                                               |
| 5   | Chung     | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các trường (vd Đơn vị thụ hưởng ≠ Đơn vị thanh toán; Tài khoản nợ ≠ Tài khoản có; Loại tiền nợ = Loại tiền có)                                                  |
| 6   | Chung     | VAL-06 | Trường phụ thuộc (cascading): khi giá trị trường cha thay đổi → reset/refresh dropdown trường con (vd Tỉnh → Huyện → Xã)                                                                               |
| 7   | Chung     | VAL-07 | Tổng dòng chi tiết = giá trị tổng hợp ở bản ghi cha (vd `SUM(F-DETAIL.AMOUNT) = F-HEADER.AMOUNT`); chênh lệch > tolerance → chặn Submit                                                                |
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

## 9. Danh sách thông báo

> Tổng hợp các thông báo trong §4–§6 và §8. Phân loại: **Error** (chặn xử lý), **Warning** (cho phép tiếp tục có cảnh báo), **Info/Success** (thông báo kết quả), **Confirm** (yêu cầu xác nhận).

| STT | Phân loại 1 | Phân loại 2 | Mã                     | Nội dung                                                                  |
| --- | ----------- | ----------- | ---------------------- | ------------------------------------------------------------------------- |
| 1   | Chung       | Error       | MSG-ERR-REQUIRED       | Vui lòng nhập `[Tên trường]`                                              |
| 2   | Chung       | Error       | MSG-ERR-FORMAT         | Định dạng `[Tên trường]` không hợp lệ                                     |
| 3   | Chung       | Error       | MSG-ERR-LOOKUP         | Giá trị không nằm trong danh mục                                          |
| 4   | Chung       | Error       | MSG-ERR-RANGE          | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`)               |
| 5   | Chung       | Error       | MSG-ERR-CROSS-FIELD    | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]`    |
| 6   | Chung       | Error       | MSG-ERR-FILE           | File vượt giới hạn hoặc sai định dạng                                     |
| 7   | Chung       | Error       | MSG-ERR-DUPLICATE      | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]`                       |
| 8   | Chung       | Error       | MSG-ERR-SYSTEM         | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị      |
| 9   | Chung       | Error       | MSG-ERR-TIMEOUT        | Yêu cầu quá thời gian xử lý, vui lòng thử lại                             |
| 10  | Chung       | Error       | MSG-ERR-PERMISSION     | Bạn không có quyền thực hiện thao tác này                                 |
| 11  | Chung       | Error       | MSG-ERR-SESSION        | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại                        |
| 12  | Chung       | Success     | MSG-OK-SAVE            | Lưu giao dịch thành công                                                  |
| 13  | Chung       | Success     | MSG-OK-DELETE          | Xoá giao dịch thành công                                                  |
| 14  | Chung       | Success     | MSG-OK-SUBMIT          | Đã gửi giao dịch để kiểm soát/phê duyệt                                   |
| 15  | Chung       | Confirm     | MSG-CFM-CANCEL         | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?                              |
| 16  | Chung       | Confirm     | MSG-CFM-DELETE         | Bạn có chắc muốn xoá giao dịch `<Mã giao dịch>`?                          |
| 17  | Chung       | Warning     | MSG-WRN-LIMIT          | Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn                          |
| 18  | Chung       | Warning     | MSG-WRN-OUTSIDE-HOUR   | Ngoài giờ giao dịch, vui lòng xem lại                                     |
| 19  | Chung       | Error       | MSG-ERR-STATUS         | Giao dịch đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá           |
| 20  | Chung       | Error       | MSG-ERR-MAKER          | Chỉ Người lập gốc mới được phép Sửa/Xoá                                   |
| 21  | Chung       | Error       | MSG-ERR-LOCK           | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 22  | Chung       | Error       | MSG-ERR-CONCURRENT     | Giao dịch đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau            |
| 23  | Chung       | Error       | MSG-ERR-DELETE-CFM     | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát                   |
| 24  | Chung       | Warning     | MSG-WRN-DUPLICATE      | Phát hiện giao dịch tương tự đã được lập gần đây. Bạn có muốn tiếp tục?   |
| 25  | Chung       | Info        | MSG-INF-NOTIFY-CHECKER | Đã gửi thông báo đến Người kiểm soát `<…>`                                |

## 10. Danh sách sự kiện

> Tổng hợp các sự kiện (UI action + backend event) phát sinh trong vòng đời CRUD. Quy ước Event_id: `<MOD>.<ACTION>` (action ở thì hiện tại đơn).

| STT | Mã sự kiện (Event_id)    | Phân loại | Chức năng    | Mô tả                                                     |
| --- | ------------------------ | --------- | ------------ | --------------------------------------------------------- |
| 1   | `<MOD>.LIST.VIEW`        | Chung     | Danh sách    | Mở màn hình danh sách giao dịch                           |
| 2   | `<MOD>.LIST.FILTER`      | Chung     | Danh sách    | NSD áp dụng bộ lọc/tìm kiếm/sort                          |
| 3   | `<MOD>.LIST.EXPORT`      | Chung     | Danh sách    | NSD xuất dữ liệu Excel/PDF/CSV                            |
| 4   | `<MOD>.NEW.OPEN`         | Chung     | Thêm mới     | Mở form Thêm mới, sinh F-ID preview                       |
| 5   | `<MOD>.NEW.SAVE`         | Chung     | Thêm mới     | Lưu bản ghi DRAFT                                         |
| 6   | `<MOD>.NEW.SUBMIT`       | Chung     | Thêm mới     | Submit → READY_FOR_APPROVAL; notify Checker               |
| 7   | `<MOD>.NEW.CANCEL`       | Chung     | Thêm mới     | Huỷ form, bỏ thay đổi                                     |
| 8   | `<MOD>.NEW.COPY`         | Chung     | Thêm mới     | Tạo mới bằng cách copy từ bản ghi đã có                   |
| 9   | `<MOD>.VIEW.OPEN`        | Chung     | Xem          | Mở form Xem (read-only)                                   |
| 10  | `<MOD>.VIEW.HISTORY`     | Chung     | Xem          | Mở tab Lịch sử giao dịch / Audit                          |
| 11  | `<MOD>.VIEW.APPROVAL`    | Chung     | Xem          | Mở tab Trạng thái phê duyệt                               |
| 12  | `<MOD>.EDIT.OPEN`        | Chung     | Sửa          | Mở form Sửa, load F-VER hiện hành                         |
| 13  | `<MOD>.EDIT.SAVE`        | Chung     | Sửa          | Lưu thay đổi, cập nhật F-VER+1, ghi audit                 |
| 14  | `<MOD>.EDIT.CANCEL`      | Chung     | Sửa          | Huỷ chỉnh sửa, bỏ thay đổi                                |
| 15  | `<MOD>.DELETE.OPEN`      | Chung     | Xoá          | Mở popup Xoá (lý do + checkbox)                           |
| 16  | `<MOD>.DELETE.CONFIRM`   | Chức năng | Xoá          | Soft-delete, release hold, ghi audit                      |
| 17  | `<MOD>.ATTACH.UPLOAD`    | Chung     | Đính kèm     | Upload file (validate kích thước/định dạng/AV)            |
| 18  | `<MOD>.ATTACH.DELETE`    | Chung     | Đính kèm     | Xoá file đính kèm                                         |
| 19  | `<MOD>.APPROVE.CHECKER`  | Chung     | Kiểm soát    | Checker phê duyệt → chuyển Approver                       |
| 20  | `<MOD>.APPROVE.APPROVER` | Chung     | Phê duyệt    | Approver phê duyệt → APPROVED                             |
| 21  | `<MOD>.APPROVE.REJECT`   | Chung     | Phê duyệt    | Từ chối → REJECTED + lý do                                |
| 22  | `<MOD>.APPROVE.RETURN`   | Chung     | Phê duyệt    | Trả lại Maker → RETURNED_TO_MAKER                         |
| 23  | `<MOD>.PRINT.PREVIEW`    | Chung     | In phiếu     | Sinh PDF preview theo template                            |
| 24  | `<MOD>.NOTIFY.SEND`      | Chung     | Notification | Gửi notification chuyển trạng thái (in-app + email)       |
| 25  | `<MOD>.AUDIT.WRITE`      | Chung     | Audit        | Ghi log thao tác (user, timestamp, IP, oldValue→newValue) |
| 26  | `<MOD>.SESSION.TIMEOUT`  | Chung     | Phiên        | Phiên hết hạn → buộc đăng nhập lại                        |
| 27  | `<MOD>.LOCK.ACQUIRE`     | Chức năng | Concurrent   | Lấy lock khi mở Sửa; release khi đóng/lưu                 |
| 28  | `<MOD>.LOCK.CONFLICT`    | Chức năng | Concurrent   | Phát hiện conflict (optimistic lock mismatch)             |

## 11. State Machine (Trạng thái giao dịch)

> Tổng hợp các bước chuyển trạng thái dựa trên §3 (Hậu điều kiện), §4 (Luồng chính), §5 (Luồng thay thế) và §10 (Sự kiện). Các trạng thái sử dụng: `Start`, `Draft`, `Ready_For_Approval` (cấp Checker), `Pending_Approver` (cấp Approver), `Approved`, `Posted`, `Returned_To_Maker`, `Rejected`, `Deleted`, `End`.
>
> Quy ước: cột **Trạng thái** = trạng thái trước sự kiện; cột **Trạng thái mới** = trạng thái sau sự kiện. Một số dòng có thể có nhiều trạng thái nguồn (ghi rõ bằng dấu `/`).

| STT | Sự kiện                                                    | Trạng thái                                                                     | Trạng thái mới     | Tác động                                                                                        |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | Maker tạo mới giao dịch (`<MOD>.NEW.OPEN`)                 | Start                                                                          | Draft              | Hệ thống sinh F-ID, F-VER=1, F-STATUS=Draft, autofill F-AUDIT (người lập, ngày lập); ghi log    |
| 2   | Maker bấm Lưu/Lưu nháp (`<MOD>.NEW.SAVE`)                  | Draft                                                                          | Draft              | Lưu thay đổi field; ghi audit; hiển thị MSG-OK-SAVE; F-VER không đổi                            |
| 3   | Maker huỷ thao tác Thêm mới (`<MOD>.NEW.CANCEL`)           | Draft (chưa lưu)                                                               | End                | Đóng form, bỏ thay đổi; nếu chưa từng Save → không sinh bản ghi DB                              |
| 4   | Maker bấm Sửa & Lưu (`<MOD>.EDIT.SAVE`)                    | Draft / Returned_To_Maker                                                      | Draft              | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue                         |
| 5   | Maker bấm Submit (`<MOD>.NEW.SUBMIT`)                      | Draft / Returned_To_Maker                                                      | Ready_For_Approval | Validate đầy đủ; chuyển trạng thái; gửi notify Checker; ghi audit                               |
| 6   | Maker bấm Xoá (Xác nhận xoá) (`<MOD>.DELETE.CONFIRM`)      | Draft / Returned_To_Maker                                                      | Deleted            | Soft-delete (F-STATUS=Deleted); release hold (nếu có); ghi audit; hiển thị MSG-OK-DELETE        |
| 7   | Checker phê duyệt (`<MOD>.APPROVE.CHECKER`)                | Ready_For_Approval                                                             | Pending_Approver   | Chuyển sang chờ Approver; gửi notify Approver; ghi audit                                        |
| 8   | Checker trả lại Maker (`<MOD>.APPROVE.RETURN`)             | Ready_For_Approval                                                             | Returned_To_Maker  | Bắt buộc lý do trả lại ≥ 10 ký tự; notify Maker; ghi audit                                      |
| 9   | Checker từ chối (`<MOD>.APPROVE.REJECT`)                   | Ready_For_Approval                                                             | Rejected           | Bắt buộc lý do từ chối; notify Maker; khoá giao dịch không cho Sửa; ghi audit                   |
| 10  | Approver phê duyệt (`<MOD>.APPROVE.APPROVER`)              | Pending_Approver                                                               | Approved           | Chuyển trạng thái Approved; trigger luồng nghiệp vụ kế tiếp; gửi notify Maker; ghi audit        |
| 11  | Approver trả lại Maker (`<MOD>.APPROVE.RETURN`)            | Pending_Approver                                                               | Returned_To_Maker  | Bắt buộc lý do; notify Maker; ghi audit                                                         |
| 12  | Approver từ chối (`<MOD>.APPROVE.REJECT`)                  | Pending_Approver                                                               | Rejected           | Bắt buộc lý do; notify Maker; khoá giao dịch; ghi audit                                         |
| 13  | Hệ thống hạch toán                                         | Approved                                                                       | Transferred_to_GL  | Trigger downstream (số dư, sổ cái, integration); ghi audit; chuyển trạng thái Transferred_to_GL |
| 14  | Hệ thống ghi sổ                                            | Transferred_to_GL                                                              | Posted             | Trigger downstream (số dư, sổ cái, integration); ghi audit; chuyển trạng thái Posted            |
| 15  | Đóng nghiệp vụ (kết thúc vòng đời)                         | Posted / Rejected / Deleted                                                    | End                | Khoá toàn bộ thao tác Sửa/Xoá; chỉ cho phép Xem; ghi audit truy cập                             |
| 16  | (Vi phạm) Cố tình Sửa/Xoá ở trạng thái không cho phép      | Ready_For_Approval / Pending_Approver / Approved / Posted / Rejected / Deleted | (Không đổi)        | Chặn thao tác (VAL-13); thông báo MSG-ERR-STATUS; disable nút; ghi audit bảo mật                |
| 17  | (Vi phạm) Người khác Maker gốc Sửa/Xoá                     | Draft / Returned_To_Maker                                                      | (Không đổi)        | Chặn (VAL-14); thông báo MSG-ERR-MAKER; ghi audit bảo mật                                       |
| 18  | (Concurrent) Optimistic lock mismatch khi Lưu              | Draft / Returned_To_Maker                                                      | (Không đổi)        | Chặn (VAL-15); thông báo MSG-ERR-LOCK; yêu cầu tải lại; ghi audit                               |
| 19  | (Hệ thống) Phiên đăng nhập hết hạn                         | (Bất kỳ)                                                                       | (Không đổi)        | Bắt buộc đăng nhập lại; lưu draft tạm (nếu form đang dirty); MSG-ERR-SESSION                    |
| 20  | (Quản trị) Khôi phục bản ghi đã xoá (nếu phân hệ cho phép) | Deleted                                                                        | Draft              | Restore F-STATUS=Draft; ghi audit khôi phục; chỉ Quản trị/quy trình duyệt mới được phép         |

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

| STT | Màn hình                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `<MOD>.LIST` — Màn hình Danh sách giao dịch (lọc, sort, phân trang, export)                                   |
| 2   | `<MOD>.NEW` — Form Thêm mới                                                                                   |
| 3   | `<MOD>.VIEW` — Form Xem (read-only), gồm: [Tab] Đính kèm, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt |
| 4   | `<MOD>.EDIT` — Form Sửa                                                                                       |
| 5   | `<MOD>.DELETE` — Popup xác nhận Xoá (lý do + checkbox)                                                        |
| 6   | `<MOD>.DETAIL.GRID` — Inline grid chi tiết khoản mục                                                          |
| 7   | `<MOD>.ATTACH` — Popup quản lý đính kèm                                                                       |
| 8   | `<MOD>.HISTORY` — Popup lịch sử audit (oldValue→newValue)                                                     |
| 9   | `<MOD>.LOOKUP.*` — Popup tra cứu danh mục (đơn vị, tài khoản, mã quỹ…)                                        |
| 10  | `<MOD>.APPROVE` — Màn hình kiểm soát/phê duyệt                                                                |
| 11  | `<MOD>.PRINT` — Màn hình Preview in phiếu/báo cáo                                                             |
| 12  | `<MOD>.EXPORT` — Tuỳ chọn xuất Excel/PDF/CSV                                                                  |

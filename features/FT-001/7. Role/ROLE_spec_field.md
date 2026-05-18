# Đặc tả trường dữ liệu — TT_PHANQUYEN (Quản lý phân quyền)

> Chú thích cột **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện (ghi rõ điều kiện trong "Mô tả/Ràng buộc").
>
> Chú thích cột **Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / DateTime Picker / Checkbox / Radio / File Upload / Lookup / Icon Button / Label.
>
> Phân hệ: `TT` (Thanh toán). Tham chiếu chéo: `BangDacTaChucNang_PhanQuyen_DienHinh.md` (BIZ/VAL/MSG/Event/State).

---

## 1. Màn hình `TT_PHANQUYEN.NEW`, `TT_PHANQUYEN.VIEW`, `TT_PHANQUYEN.EDIT`

Form Tạo mới/Xem/Sửa quyền — gồm 2 khu vực: Thông tin chung (`TT_PHANQUYEN.3.1`) và Thông tin chi tiết (`TT_PHANQUYEN.3.2`).

### 1.1. Khu vực Thông tin chung (`TT_PHANQUYEN.3.1`)

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quyền | Role_Code | Number Field | Y |  | Number(10) | (1) Số tự nhiên, độ dài 1–10 chữ số (VAL-PQ-08). (2) Duy nhất toàn hệ thống — kiểm tra unique khi Lưu (VAL-PQ-01, MSG-ERR-PQ-CODE-DUP). (3) Không cho phép sửa sau khi tạo (VAL-PQ-07, VAL-17) — disable trên `TT_PHANQUYEN.EDIT`. |
| Tên quyền | Role_Name | TextBox | Y |  | String(40) | (1) Tối đa 40 ký tự. (2) Trim đầu/cuối; không cho phép ký tự nguy hiểm `< > " ' ;` (VAL-10, MSG-ERR-PQ-INVALID-CHAR). |
| Nhóm quyền | Role_Group_Name | TextBox + Lookup `TT_PHANQUYEN.LOOKUP.ROLE_GROUP` | Y |  | String(40) | (1) Tối đa 40 ký tự. (2) Cho phép nhập tự do hoặc chọn từ danh mục Nhóm quyền đã cấu hình. (3) Phím tắt `F4` mở popup tra cứu. |
| Trạng thái | Status | List of Value | N (auto) | Nháp | String | (1) Hệ thống tự gán. (2) Giá trị: `Nháp` / `Ready_For_Approval` / `Pending_Approver` / `Returned_To_Maker` / `Rejected` / `Hiệu lực` / `Hết hiệu lực` / `Deleted` (tham chiếu §11 state machine). (3) Trên form NEW = `Nháp`; trên VIEW/EDIT hiển thị giá trị hiện hành, không cho sửa. |
| Người tạo | Created_By | Label | N (auto) | User hiện tại | String(40) | Auto-fill khi tạo mới; không cho sửa (immutable VAL-17). |
| Thời gian tạo | Created_Date | Label | N (auto) | Thời gian hệ thống | Date (DD/MM/YYYY) | Auto-fill khi tạo mới; định dạng `dd/MM/yyyy`; không cho sửa. |
| Người cập nhật | Last_Updated_By | Label | N (auto) |  | String(40) | Được ghi nhận & hiển thị sau khi "Lưu" giao dịch lần kế tiếp; cập nhật theo user hiện tại. |
| Thời gian cập nhật cuối | Last_Updated_Date | Label | N (auto) |  | Date (DD/MM/YYYY) | Được ghi nhận & hiển thị sau khi "Lưu" giao dịch; định dạng `dd/MM/yyyy`. |
| Phiên bản | F-VER | Label | N (auto) | 1 | Number | Phiên bản optimistic lock (VAL-15); không hiển thị mặc định, dùng debug/audit. |

### 1.2. Khu vực Thông tin chi tiết — Grid Function (`TT_PHANQUYEN.3.2`)

> Grid danh sách Function được gán cho quyền, mỗi dòng = 1 Function với cấu hình Read/Write + thời hạn hiệu lực.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | Seq | Label | – | Tự tăng | Number(5) | Auto-tăng theo thứ tự thêm dòng; không cho sửa. |
| Hành động | Action | Icon Button | – |  | – | Icon: **Xoá dòng** (Shift+Delete) — chỉ enable khi form ở chế độ NEW/EDIT và NSD là Maker gốc; mỗi lần xoá hiển thị MSG-CFM-DEL-LINE để xác nhận. |
| Mã chức năng | Function_Code | TextBox + Lookup `TT_PHANQUYEN.LOOKUP.FUNCTION` | Y |  | Number(10) | (1) Số tự nhiên, tối đa 10 chữ số. (2) Phải tồn tại trong danh mục Function và đang Active (VAL-PQ-09, MSG-ERR-PQ-FUNC-INACTIVE). (3) Không trùng `Function_Code` trong cùng bản ghi (VAL-PQ-02, MSG-ERR-PQ-FUNC-DUP). (4) Phím tắt `F4` mở popup tra cứu. |
| Chức năng | Function_Name | Label | Y (auto) |  | String(40) | (1) Hiển thị tự động theo `Function_Code` được chọn — read-only. (2) Lấy từ CSDL danh mục Function. (3) Truncate nếu > 40 ký tự, tooltip full. |
| Đọc | Read | Checkbox | C | Off | Boolean | (1) Cho phép tick/untick độc lập với `Write`. (2) Tick → user được gán quyền có quyền đọc Function này. (3) Phải tick ít nhất 1 trong {Read, Write} (VAL-PQ-03, MSG-ERR-PQ-RW-EMPTY). |
| Ghi | Write | Checkbox | C | Off | Boolean | (1) Cho phép tick/untick độc lập với `Read`. (2) Tick → user được gán quyền có quyền ghi/sửa Function này. (3) Phải tick ít nhất 1 trong {Read, Write} (VAL-PQ-03). [Inference] Thông thường khi tick `Write` thì hệ thống cũng tự tick `Read` (tuỳ cấu hình `WRITE_IMPLIES_READ`) — cần thống nhất với TKHT. |
| Ngày hiệu lực | Effective_Date_From | Date Picker | N | Ngày hiện tại | Date (DD/MM/YYYY) | (1) Mặc định = ngày tạo bản ghi quyền (`Created_Date`). (2) Cho phép sửa; nhưng `Effective_Date_From` ≥ ngày hiện tại (VAL-04) trừ khi user có quyền backdate. |
| Ngày hết hiệu lực | Effective_Date_To | Date Picker | N |  | Date (DD/MM/YYYY) | (1) Có thể bỏ trống → hiệu lực vô thời hạn. (2) Nếu nhập: phải ≥ `Effective_Date_From` (VAL-PQ-04, MSG-ERR-PQ-DATE). (3) Khi tới ngày này, job nền chuyển dòng sang trạng thái Hết hạn (BIZ-011). |

**Footer Grid:** Hiển thị "Tổng số chức năng: N / 200" — cảnh báo khi đạt 90% (180 dòng); chặn thêm khi đạt 200 (VAL-PQ-05, MSG-ERR-PQ-MAX-LINE).

**Nút thực thi vùng `TT_PHANQUYEN.3.2`** (sắp xếp trên/dưới grid):

| Vị trí | Tên nút | Sự kiện | Ghi chú |
|---|---|---|---|
| Trên grid | Thêm mới (`Add`) | `TT_PHANQUYEN.DETAIL.ADD` | Thêm 1 dòng trống; auto-focus vào ô `Function_Code` |
| Dưới grid | Lưu (`Save`) | `TT_PHANQUYEN.NEW.SAVE` / `TT_PHANQUYEN.EDIT.SAVE` | Validate đầy đủ và lưu bản ghi |
| Dưới grid | Huỷ (`Cancel`) | `TT_PHANQUYEN.NEW.CANCEL` / `TT_PHANQUYEN.EDIT.CANCEL` | Đóng form, hỏi xác nhận nếu form dirty |

---

## 2. Màn hình `TT_PHANQUYEN.LIST` (`TT_PHANQUYEN.1` + `TT_PHANQUYEN.2`)

> Mục đích: tra cứu danh sách quyền theo nhiều tiêu chí; hỗ trợ các thao tác Xem/Sửa/Huỷ/Sao chép/Xuất.

### 2.1. Khu vực bộ lọc tìm kiếm (`TT_PHANQUYEN.1`)

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quyền | Role_Code | Number Field | N |  | Number(10) | Tìm chính xác hoặc bắt đầu bằng (radio chọn chế độ). Tối đa 10 chữ số. |
| Tên quyền | Role_Name | TextBox | N |  | String(40) | Tìm chứa, không phân biệt hoa thường, hỗ trợ tiếng Việt có dấu/không dấu. |
| Nhóm quyền | Role_Group_Name | TextBox + Lookup | N |  | String(40) | Tìm chứa; phím tắt `F4` mở popup tra cứu danh mục Nhóm quyền. |
| Người tạo | Created_By | TextBox + Lookup `TT_PHANQUYEN.LOOKUP.USER` | N |  | String(40) | `F4` tra cứu user nội bộ. |
| Thời gian tạo từ ngày | Created_Date_From | Date Picker | N | Ngày hiện tại − 30 | Date (DD/MM/YYYY) | Định dạng `dd/MM/yyyy`. |
| Thời gian tạo đến ngày | Created_Date_To | Date Picker | N | Ngày hiện tại | Date (DD/MM/YYYY) | Phải ≥ `Created_Date_From` (VAL-05); khoảng cách ≤ 365 ngày — cảnh báo MSG-WRN-PQ-RANGE (VAL-PQ-10). |
| Người cập nhật | Last_Updated_By | TextBox + Lookup `TT_PHANQUYEN.LOOKUP.USER` | N |  | String(40) | `F4` tra cứu. |
| Thời gian cập nhật từ ngày | Last_Updated_Date_From | Date Picker | N |  | Date (DD/MM/YYYY) | Định dạng `dd/MM/yyyy`. |
| Thời gian cập nhật đến ngày | Last_Updated_Date_To | Date Picker | N |  | Date (DD/MM/YYYY) | Phải ≥ `Last_Updated_Date_From`. [Lưu ý] File nguồn ghi nhầm `Last_Updated_Date_From` 2 lần — đã chuẩn hoá thành `Last_Updated_Date_From` và `Last_Updated_Date_To`. |
| Trạng thái | Status | Dropdown (multi-select) | N | Tất cả trạng thái hợp lệ trừ `Deleted` | String | Danh mục: `Nháp`, `Ready_For_Approval`, `Pending_Approver`, `Returned_To_Maker`, `Rejected`, `Hiệu lực`, `Hết hiệu lực`, `Deleted` (chỉ admin mới được lọc bản ghi Deleted). |

**Nút thực thi vùng `TT_PHANQUYEN.1`** (sắp xếp từ trái sang phải):

| Tên nút | Event | Phím tắt |
|---|---|---|
| Tìm kiếm (`Find`) | `TT_PHANQUYEN.LIST.FILTER` | `Enter` (khi focus trong khu vực filter) hoặc `Ctrl+F` |
| Tạo mới (`Create`) | `TT_PHANQUYEN.NEW.OPEN` | `Ctrl+N` |
| Đặt lại (`Refresh`) | `TT_PHANQUYEN.LIST.RESET` | `F5` |

### 2.2. Khu vực kết quả — grid (`TT_PHANQUYEN.2`)

> Điều kiện: hiển thị sau khi NSD bấm **Tìm kiếm** tại `TT_PHANQUYEN.1`. Hệ thống thực hiện lọc theo tham số được nhập.

| STT | Trường | Trường (ENG) | Loại hiển thị | Sắp xếp | Mô tả / Ràng buộc |
|---|---|---|---|---|---|
| 1 | STT | Seq | Number(5) | – | Auto-tăng theo dòng trong trang hiện tại; format `1, 2, 3,…`. |
| 2 | Hành động | Action | Icon group | – | Icon: **Xem** (View — F3) luôn hiển thị; **Huỷ** (Delete — `Delete`) chỉ enable khi `Status` ∈ {Nháp, Returned_To_Maker} và NSD là Maker gốc (VAL-13, VAL-14). |
| 3 | Mã quyền | Role_Code | Link (mở `TT_PHANQUYEN.VIEW`) | ✓ | Click mở chi tiết quyền (sự kiện `TT_PHANQUYEN.VIEW.OPEN`). |
| 4 | Tên quyền | Role_Name | Text | ✓ | Truncate nếu > 40 ký tự, tooltip full. |
| 5 | Nhóm quyền | Role_Group_Name | Text | ✓ | [Lưu ý] File nguồn ghi nhầm Type = Date — đã chuẩn hoá thành Text. |
| 6 | Người tạo | Created_By | Text | ✓ |  |
| 7 | Thời điểm tạo | Created_Date | Text (`dd/MM/yyyy`) | ✓ | Mặc định sort DESC theo trường này. |
| 8 | Người cập nhật | Last_Updated_By | Text | ✓ |  |
| 9 | Thời điểm cập nhật cuối | Last_Updated_Date | Text (`dd/MM/yyyy`) | ✓ |  |
| 10 | Trạng thái | Status | Badge (màu theo trạng thái) | ✓ | Xanh: `Hiệu lực`/`Approved`; Vàng: `Ready_For_Approval`/`Pending_Approver`; Xám: `Nháp`/`Hết hiệu lực`; Đỏ: `Rejected`; Cam: `Returned_To_Maker`; Đen mờ: `Deleted`. |

### 2.3. Khu vực thanh công cụ và footer

| Trường | Mô tả |
|---|---|
| Tổng số bản ghi | Tổng số quyền khớp bộ lọc (không tính Deleted nếu không tick). |
| Phân trang | 10 / 20 / 50 / 100 bản ghi/trang; mặc định 20. |
| Sắp xếp | Mặc định `Created_Date DESC`; cho phép click header cột để đổi sort. |
| Lưu bộ lọc | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope). |
| Xuất (`Export`) | `Ctrl+Shift+E` — sự kiện `TT_PHANQUYEN.LIST.EXPORT`; sync nếu < 5,000 bản ghi, async nếu vượt. |

---

## 3. Đặc tả trường cho các màn hình bổ sung

### 3.1. Màn hình `TT_PHANQUYEN.DELETE`

> Popup xác nhận huỷ mềm bản ghi quyền ở trạng thái cho phép (`Nháp`, `Returned_To_Maker`).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quyền | Role_Code | Label | – | Tự lấy từ bản ghi | Number(10) | Read-only. |
| Tên quyền | Role_Name | Label | – | Tự lấy | String(40) | Read-only. |
| Nhóm quyền | Role_Group_Name | Label | – | Tự lấy | String(40) | Read-only. |
| Số chức năng đính kèm | Function_Count | Label | – | Tự đếm | Number | Hiển thị số dòng `TT_PHANQUYEN.3.2` của bản ghi. |
| Trạng thái hiện tại | Status | Label | – | Tự lấy | String | Phải ∈ {Nháp, Returned_To_Maker} (VAL-13). |
| Lý do huỷ | DELETE_REASON | TextArea | Y |  | String(500) | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16, BIZ-006). |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y | Off | Boolean | Phải tick mới enable nút "Xác nhận huỷ". |
| Người huỷ | DELETED_BY | Label | – | User hiện tại | String(40) | Auto. |
| Thời gian huỷ | DELETED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto, hiển thị `dd/MM/yyyy hh:MM:ss`. |

### 3.2. Màn hình `TT_PHANQUYEN.DETAIL.DELETE`

> Popup xác nhận xoá 1 dòng Function khỏi grid `TT_PHANQUYEN.3.2`. Chỉ hiển thị khi dòng đã được lưu trước đó (đã commit vào DB); nếu dòng chưa lưu — xoá trực tiếp không hỏi confirm.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã chức năng | Function_Code | Label | – | Tự lấy | Number(10) | Read-only. |
| Tên chức năng | Function_Name | Label | – | Tự lấy | String(40) | Read-only. |
| Quyền Đọc | Read | Label | – | Tự lấy | Boolean | Hiển thị Có/Không. |
| Quyền Ghi | Write | Label | – | Tự lấy | Boolean | Hiển thị Có/Không. |
| Xác nhận xoá dòng | CONFIRM_DEL_LINE | Checkbox | Y | Off | Boolean | Phải tick mới enable nút Xác nhận. |

### 3.3. Màn hình `TT_PHANQUYEN.HISTORY`

> Tab/Popup lịch sử thay đổi/audit của bản ghi quyền (chế độ chỉ đọc). Mở từ `TT_PHANQUYEN.VIEW` (`Alt+H`).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | SEQ_NO | Label | – | Tự tăng | Number |  |
| Thời điểm | ACTION_DATE | Label | – |  | DateTime | `dd/MM/yyyy hh:MM:ss`, sắp xếp DESC mặc định. |
| Người thực hiện | ACTOR | Label | – |  | String | Username + Họ tên + Vai trò. |
| Vai trò | ACTOR_ROLE | Label | – |  | String | Maker / Checker / Approver / Admin / System. |
| Hành động | ACTION | Label | – |  | String | Tham chiếu Event ID §10 PhanQuyen: `TT_PHANQUYEN.NEW.OPEN/SAVE/SUBMIT`, `TT_PHANQUYEN.EDIT.OPEN/SAVE`, `TT_PHANQUYEN.DELETE.CONFIRM`, `TT_PHANQUYEN.APPROVE.CHECKER/APPROVER/RETURN/REJECT`, `TT_PHANQUYEN.DETAIL.ADD/REMOVE/TOGGLE_READ/TOGGLE_WRITE`, `TT_PHANQUYEN.LIST.EXPORT`,… |
| Trạng thái trước | STATUS_FROM | Label | – |  | String | Status trước hành động. |
| Trạng thái sau | STATUS_TO | Label | – |  | String | Status sau hành động. |
| Phiên bản | F-VER | Label | – |  | Number |  |
| Lý do/Ghi chú | NOTE | Label | – |  | String | Lý do từ chối/trả lại/huỷ. |
| IP máy trạm | CLIENT_IP | Label | – |  | String | IPv4/IPv6. |
| Tên máy | HOST_NAME | Label | – |  | String |  |
| Channel | CHANNEL | Label | – |  | String | Web / API / Mobile. |
| Trường thay đổi (Diff) | DIFF | Expandable | – |  | JSON | Hiển thị `field`, `oldValue`, `newValue` (BIZ-007). Lưu ý: với chi tiết grid, mỗi dòng thay đổi sẽ được ghi `seq, Function_Code, oldRead/Write, newRead/Write, oldDates, newDates`. |

**Bộ lọc:** Theo hành động (multi-select), khoảng thời gian, vai trò, người thực hiện. **Xuất:** Cho phép export Excel/CSV.

### 3.4. Màn hình `TT_PHANQUYEN.LOOKUP.FUNCTION`

> Popup tra cứu danh mục Function (chức năng hệ thống) — mở khi click icon kính lúp tại trường `Function_Code` trên grid `TT_PHANQUYEN.3.2`, hoặc bấm `F4`.

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã chức năng | Function_Code | TextBox | N |  | Number(10) | Tìm chính xác / chứa / bắt đầu bằng (radio). |
| Tên chức năng | Function_Name | TextBox | N |  | String(40) | Tìm chứa, không phân biệt hoa thường. |
| Module/Phân hệ | Module_Code | Dropdown | N | Tất cả | String | Danh mục module (TT, KS, KB, BC,…). |
| Trạng thái | Active_Status | Dropdown | N | Active | String | Active / Inactive / All — mặc định chỉ hiển thị Active (VAL-PQ-09). |

**Khu vực kết quả:**

| STT | Trường | Trường (ENG) | Loại hiển thị | Mô tả |
|---|---|---|---|---|
| 1 | STT | Seq | Number(5) |  |
| 2 | Mã chức năng | Function_Code | Number(10) | Click để chọn (single-select). |
| 3 | Tên chức năng | Function_Name | Text(40) |  |
| 4 | Module | Module_Code | Text | TT / KS / KB / BC… |
| 5 | Mô tả | Function_Description | Text | Truncate, tooltip full. |
| 6 | Trạng thái | Active_Status | Badge | Active = xanh, Inactive = xám. |
| 7 | Thao tác | Action | Button | "Chọn" — trả `Function_Code` + `Function_Name` về form gốc. |

**Footer:** Phân trang 10/20/50; nút "Chọn"/"Huỷ"; phím tắt `Enter` chọn dòng đang focus, `Esc` đóng popup.

### 3.5. Màn hình `TT_PHANQUYEN.LOOKUP.USER`

> Popup tra cứu danh mục User — mở khi click `F4` tại các trường `Created_By` / `Last_Updated_By` trên `TT_PHANQUYEN.1`.

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Username | User_Name | TextBox | N |  | String | Tìm chứa / bắt đầu bằng. |
| Họ tên | Full_Name | TextBox | N |  | String | Tìm chứa, hỗ trợ tiếng Việt có dấu/không dấu. |
| Đơn vị | Org_Code | Dropdown + Lookup | N |  | String | Theo cây tổ chức (chỉ user trong phạm vi NSD được phép xem). |
| Trạng thái | Active_Status | Dropdown | N | Active | String | Active / Inactive / Locked. |

**Khu vực kết quả:** Cột `Username`, `Họ tên`, `Đơn vị`, `Email`, `Trạng thái`, `Hành động`.

### 3.6. Màn hình `TT_PHANQUYEN.LOOKUP.ROLE_GROUP`

> Popup tra cứu danh mục Nhóm quyền — mở khi click `F4` tại trường `Role_Group_Name`.

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã nhóm quyền | Role_Group_Code | TextBox | N |  | String | Tìm chứa. |
| Tên nhóm quyền | Role_Group_Name | TextBox | N |  | String(40) | Tìm chứa, không phân biệt hoa thường. |
| Trạng thái | Active_Status | Dropdown | N | Active | String | Active / Inactive. |

**Khu vực kết quả:** Cột `Mã nhóm`, `Tên nhóm`, `Mô tả`, `Trạng thái`, `Hành động`.

### 3.7. Màn hình `TT_PHANQUYEN.APPROVE` (Kiểm soát viên / Phê duyệt viên)

> Hiển thị toàn bộ trường từ §1 ở chế độ read-only, kèm vùng thao tác kiểm soát/phê duyệt. SoD (BIZ-001) — Checker ≠ Maker; Approver ≠ Maker và ≠ Checker.

**Khu vực thông tin quyền (read-only):** Mọi trường tại §1.1 + §1.2 grid Function detail + §3.3 History tab.

**Khu vực thao tác Kiểm soát/Phê duyệt:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Kết quả | APPROVE_RESULT | Radio | Y | (chưa chọn) | String | Một trong: Đồng ý / Trả lại Maker / Từ chối. |
| Ghi chú | APPROVE_NOTE | TextArea | C |  | String(500) | Bắt buộc nếu chọn "Trả lại" hoặc "Từ chối", ≥ 10 ký tự (BIZ-006). |
| Checklist rà soát | CHECKLIST | Checkbox list | Y | Off | Boolean | Buộc tick đủ các mục trước khi enable nút "Đồng ý": (a) Mã quyền hợp lệ và duy nhất, (b) Tên quyền/Nhóm quyền không trùng định nghĩa cũ, (c) Danh sách Function đầy đủ và phù hợp mục đích, (d) Read/Write hợp lý theo Function, (e) Effective dates hợp lệ, (f) Không vi phạm phân cấp quyền (BIZ-012). |
| Người kiểm soát/phê duyệt | ACTOR | Label | – | User hiện tại | String | Auto, phải ≠ Maker (SoD — BIZ-001); Approver phải ≠ Checker. |
| Vai trò | ACTOR_ROLE | Label | – |  | String | Checker / Approver — auto theo cấu hình workflow. |
| Thời gian | ACTION_DATE | Label | – | Thời gian hệ thống | DateTime | Auto, `dd/MM/yyyy hh:MM:ss`. |
| Phương thức xác thực | AUTH_METHOD | Radio | Y | OTP | String | OTP / Ký số. Phê duyệt quyền có Function nhạy cảm (cấu hình `SENSITIVE_FUNC_LIST`) — bắt buộc Ký số. |
| OTP | OTP_CODE | TextBox | C |  | String(6) | Bắt buộc nếu `AUTH_METHOD = OTP`; TTL 60s. |
| Chứng thư số | CERT_SERIAL | Label | C |  | String | Bắt buộc nếu `AUTH_METHOD = Ký số`. |

### 3.8. Màn hình `TT_PHANQUYEN.EXPORT`

> Cấu hình + thực hiện xuất dữ liệu danh sách quyền.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Định dạng | EXPORT_FORMAT | Radio | Y | XLSX | String | XLSX / CSV / PDF. |
| Phạm vi | EXPORT_SCOPE | Radio | Y | Toàn bộ kết quả lọc | String | Trang hiện tại / Toàn bộ kết quả lọc / Theo lựa chọn (checkbox trên LIST). |
| Trường xuất | EXPORT_FIELDS | Checkbox list | Y | Mặc định 10 trường ở §2.2 | String[] | Cho chọn/bỏ chọn từng cột; lưu preset cá nhân. |
| Bao gồm chi tiết Function | INCLUDE_DETAIL | Checkbox | N | Off | Boolean | Nếu tick → mỗi quyền có sheet/trang phụ liệt kê danh sách Function (`TT_PHANQUYEN.3.2`). |
| Bộ lọc kế thừa | INHERIT_FILTER | Checkbox | Y | On | Boolean | Tick → dùng bộ lọc đang áp dụng tại `TT_PHANQUYEN.1`. |
| Mã hoá file | ENCRYPT_FILE | Checkbox | N | Off | Boolean | Nếu tick → mã hoá file bằng mật khẩu. |
| Mật khẩu | EXPORT_PASSWORD | Password Field | C |  | String(≥8) | Bắt buộc nếu `ENCRYPT_FILE = On`. |
| Tên file | FILE_NAME | TextBox | Y | `TT_PHANQUYEN_LIST_<yyyyMMdd_HHmm>` | String | Chỉ chấp nhận `[A-Za-z0-9_\-]`. |
| Ngôn ngữ tiêu đề cột | LANGUAGE | Dropdown | Y | Tiếng Việt | String | Tiếng Việt / Tiếng Anh. |
| Người xuất | EXPORTED_BY | Label | – | User hiện tại | String | Auto, ghi audit `TT_PHANQUYEN.LIST.EXPORT`. |
| Thời gian xuất | EXPORTED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |

**Ràng buộc chung:**
- Số bản ghi > 5,000 → bắt buộc chạy bất đồng bộ (job nền), trả về notification khi xong.
- Log chi tiết tham số xuất + hash file vào audit (BIZ-007).

---

## 4. Quy ước chung về đặc tả trường

| STT | Quy ước |
|---|---|
| 1 | Mọi trường ngày hiển thị theo `dd/MM/yyyy`; ngày giờ `dd/MM/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh. |
| 2 | Mọi trường Number nguyên (như Mã quyền, Mã chức năng) không chứa ký tự đặc biệt, không có dấu phẩy phần thập phân; backend reject nếu input không phải số tự nhiên. |
| 3 | Mọi trường Text/TextArea chống XSS bằng cách sanitize/escape khi hiển thị; chống SQL Injection bằng prepared statement phía server (VAL-10). |
| 4 | Mọi trường Lookup có icon kính lúp + phím tắt `F4` (theo `PhanQuyen_spec_button.md`). |
| 5 | Mọi trường bắt buộc đánh dấu sao đỏ (`*`) cạnh nhãn; trường bắt buộc có điều kiện đánh dấu `(*)` và mô tả điều kiện trong tooltip. |
| 6 | Khi field bị disable phải có tooltip giải thích lý do (ví dụ "Mã quyền không cho phép sửa sau khi tạo — VAL-PQ-07"); field đang lỗi validate hiển thị viền đỏ + thông báo lỗi nằm dưới ô nhập (tham chiếu MSG §9 PhanQuyen). |
| 7 | Trường dữ liệu nhạy cảm (email, số điện thoại trong popup `LOOKUP.USER`) thực hiện masking theo policy cho vai trò không có quyền `VIEW_PII`. |
| 8 | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload (vd `Role_Code`, `Function_Code`, `Effective_Date_From`). |
| 9 | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F4`, `F5`, `F8`, `F9`, …) đồng bộ với `PhanQuyen_spec_button.md`. |
| 10 | Trường Read/Write trên grid chi tiết phải đảm bảo tick ít nhất 1 (VAL-PQ-03); nếu cấu hình `WRITE_IMPLIES_READ=true` thì tick `Write` sẽ tự tick `Read` và disable untick `Read`. |
| 11 | Trên `TT_PHANQUYEN.LIST` (grid kết quả), cột Trạng thái hiển thị Badge có màu theo state machine §11 PhanQuyen để hỗ trợ nhận diện trực quan. |
| 12 | Mọi thao tác CRUD trên bản ghi quyền và dòng chi tiết Function đều phát sự kiện audit (`TT_PHANQUYEN.AUDIT.WRITE`) với đầy đủ user/timestamp/IP/oldValue→newValue (BIZ-007). |

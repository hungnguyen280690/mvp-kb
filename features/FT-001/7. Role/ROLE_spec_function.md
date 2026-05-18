# Bảng đặc tả chức năng — Quản lý phân quyền (TT_PHANQUYEN)

> Chức năng quản lý danh sách quyền (Role) và gán chức năng cụ thể (Function) cho từng quyền, hỗ trợ phân quyền theo Read/Write và thời hạn hiệu lực. BA dùng làm tham chiếu cho phân hệ TT (Thanh toán) — các phân hệ khác có thể sao chép cấu trúc, thay `<MOD>` = `TT_PHANQUYEN` để phù hợp.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `TT_PHANQUYEN` |
| Tên chức năng | Quản lý phân quyền — Tra cứu danh sách quyền / Tạo mới / Xem / Sửa / Huỷ |
| Người sử dụng | Quản trị viên phân hệ (Maker), Người kiểm soát (Checker), Người phê duyệt (Approver), Người tra cứu (Viewer) |
| Mô tả | (1) Cho phép Quản trị viên tra cứu, lọc danh sách quyền hiện có; (2) Tạo mới một quyền và gán các chức năng (Function) cụ thể với mức Read/Write + thời hạn hiệu lực; (3) Tuân theo quy trình Maker–Checker–Approver trước khi quyền có hiệu lực gán cho người dùng |
| Độ ưu tiên | Cao |
| URD reference | `URD-TT-PQ-01`, `URD-TT-PQ-02` |
| Use Case liên quan | `UC-TT-PQ-01` (Tra cứu danh sách quyền), `UC-TT-PQ-02` (Phân quyền chức năng — Tạo mới quyền) |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống VDBAS |
| 2 | NSD có quyền truy cập màn hình `TT_PHANQUYEN` theo vai trò (Quản trị viên/Maker/Checker/Approver/Viewer) |
| 3 | Danh mục Function (`Function_Code`, `Function_Name`) đã được khai báo trong CSDL hệ thống |
| 4 | Danh mục Nhóm quyền (`Role_Group_Name`) đã được cấu hình (tuỳ chọn) |
| 5 | (Trường hợp Sửa/Huỷ) Bản ghi quyền tồn tại và đang ở trạng thái `Nháp` hoặc `Returned_To_Maker` |
| 6 | (Trường hợp Sửa/Huỷ) NSD là Maker gốc của bản ghi quyền |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | (Tạo mới/Sửa) Bản ghi quyền được lưu với trạng thái `Nháp` hoặc `Ready_For_Approval` |
| 2 | (Phê duyệt thành công) Bản ghi quyền chuyển sang trạng thái `Hiệu lực` — sẵn sàng gán cho người dùng |
| 3 | (Huỷ) Bản ghi quyền được soft-delete (`F-STATUS=Deleted`), ẩn khỏi danh sách thông thường, vẫn tra được qua audit |
| 4 | (Hết hạn) Khi `Last_Updated_Date` > `Effective_Date_To` của tất cả dòng chi tiết → trạng thái chuyển `Hết hiệu lực` (job nền chạy hàng ngày) |
| 5 | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) — BIZ-007 |
| 6 | Notification đã gửi đến Checker/Approver khi Maker Submit |
| 7 | Cache quyền của người dùng đang được gán quyền này được invalidate sau khi quyền có hiệu lực |

## 4. Luồng chính

### 4.1. Luồng tra cứu danh sách quyền (`UC-TT-PQ-01`)

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | Truy cập màn hình `TT_PHANQUYEN.LIST` (Khu vực 01 — `TT_PHANQUYEN.1`) | (1) Hiển thị khu vực bộ lọc; (2) Khu vực kết quả (`TT_PHANQUYEN.2`) trống/ẩn cho đến khi NSD bấm Tìm kiếm |
| 2 | Nhập tiêu chí lọc (Mã quyền, Tên quyền, Nhóm quyền, Người tạo, Khoảng thời gian tạo/cập nhật, Trạng thái) | Validate định dạng `onBlur` theo từng trường (VAL-02, VAL-04) |
| 3 | Bấm **Tìm kiếm** (`Find`) | (1) Validate ràng buộc cross-field (Từ ngày ≤ Đến ngày — VAL-05); (2) Truy vấn DB theo tiêu chí; (3) Hiển thị kết quả ở `TT_PHANQUYEN.2`; (4) Mặc định ẩn bản ghi Deleted; (5) Sắp xếp `Created_Date DESC`; (6) Phân trang 20 bản ghi/trang |
| 4 | (Tuỳ chọn) Bấm **Đặt lại** (`Refresh`) | Reset toàn bộ tham số lọc về mặc định; ẩn khu vực kết quả |
| 5 | Click icon **Xem** (View) hoặc click vào `Role_Code` trong dòng kết quả | Mở màn hình `TT_PHANQUYEN.VIEW` (read-only) với đầy đủ thông tin chung + thông tin chi tiết (danh sách function đã gán) + [Tab] Lịch sử + [Tab] Trạng thái phê duyệt |
| 6 | (Tuỳ chọn) Click icon **Huỷ** trên dòng kết quả | Chỉ hiển thị/enable khi `Status` ∈ {Nháp, Returned_To_Maker} và NSD là Maker gốc (VAL-13, VAL-14) → mở popup `TT_PHANQUYEN.DELETE` |

### 4.2. Luồng tạo mới quyền và phân quyền chức năng (`UC-TT-PQ-02`)

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | Trên `TT_PHANQUYEN.1`, bấm **Tạo mới** (`Create`) | (1) Mở màn hình `TT_PHANQUYEN.NEW` (gồm 2 khu vực: `TT_PHANQUYEN.3.1` — Thông tin chung và `TT_PHANQUYEN.3.2` — Thông tin chi tiết); (2) Sinh `Role_ID` (UUID nội bộ); (3) Trạng thái = `Nháp`; (4) Auto-fill `Created_By` = user hiện tại, `Created_Date` = thời gian hệ thống |
| 2 | Nhập **Thông tin chung** (`TT_PHANQUYEN.3.1`): Mã quyền, Tên quyền, Nhóm quyền | Validate onBlur theo `spec_field` (VAL-01, VAL-02, VAL-10, VAL-11); kiểm tra unique Mã quyền (VAL-PQ-01); Trạng thái auto = `Nháp` |
| 3 | Tại **Thông tin chi tiết** (`TT_PHANQUYEN.3.2`), bấm **Thêm mới** (`Add`) | Thêm một dòng trống vào grid; auto-tăng `Seq` |
| 4 | Trên dòng vừa thêm, chọn **Mã chức năng** (`Function_Code`) qua popup Lookup `TT_PHANQUYEN.LOOKUP.FUNCTION` | (1) Mở popup tra cứu danh mục Function; (2) Sau khi chọn → autofill `Function_Name` (read-only); (3) Kiểm tra trùng `Function_Code` trong cùng bản ghi (VAL-PQ-02) — nếu trùng → MSG-ERR-PQ-FUNC-DUP, không cho thêm |
| 5 | Tick **Đọc** (`Read`) và/hoặc **Ghi** (`Write`) | Cho phép tick độc lập; nhưng cần ít nhất 1 trong 2 phải tick (VAL-PQ-03); auto-fill `Effective_Date_From` = ngày hiện tại |
| 6 | (Tuỳ chọn) Nhập **Ngày hết hiệu lực** (`Effective_Date_To`) | Validate `Effective_Date_To` ≥ `Effective_Date_From` (VAL-PQ-04); nếu để trống → quyền có hiệu lực vô thời hạn |
| 7 | Lặp lại bước 3–6 cho các Function khác | Có thể thêm nhiều dòng; tối đa 200 Function/quyền (VAL-PQ-05) |
| 8 | (Tuỳ chọn) Click icon **Xoá dòng** trên dòng chi tiết | Xoá dòng khỏi grid (chưa lưu); hỏi confirm nếu dòng đã được lưu trước đó |
| 9 | Bấm **Lưu** (`Save`) | (1) Validate cơ bản (định dạng, độ dài, bắt buộc); (2) Validate phải có ≥ 1 dòng chi tiết (VAL-PQ-06); (3) Lưu với trạng thái `Nháp`; (4) Hiển thị MSG-OK-SAVE; (5) `Last_Updated_By` = user, `Last_Updated_Date` = thời gian hệ thống |
| 10 | Bấm **Gửi kiểm soát** (Submit) | Validate đầy đủ (Tham chiếu §6 Luồng ngoại lệ); chuyển trạng thái `Ready_For_Approval`; notify Checker (BIZ-009) |
| 11 | (Xem) Trên `TT_PHANQUYEN.LIST` chọn dòng → bấm **Xem** | Mở `TT_PHANQUYEN.VIEW` (read-only); đầy đủ trường + [Tab] Lịch sử + [Tab] Trạng thái phê duyệt |
| 12 | (Sửa) Trên bản ghi `Nháp`/`Returned_To_Maker`, bấm **Sửa** | Mở `TT_PHANQUYEN.EDIT`; load F-VER hiện hành; cho phép thay đổi Tên quyền, Nhóm quyền, danh sách function chi tiết. Mã quyền **không cho phép sửa** (VAL-PQ-07) |
| 13 | (Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 14 | (Huỷ) Trên bản ghi `Nháp`/`Returned_To_Maker`, bấm **Huỷ** trên dòng kết quả | Mở popup `TT_PHANQUYEN.DELETE` nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận |
| 15 | (Huỷ) Bấm **Xác nhận huỷ** | Soft-delete (F-STATUS=Deleted); ghi audit; hiển thị MSG-OK-DELETE |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Lưu nháp** thay vì Submit | Bỏ qua validate đầy đủ; chỉ validate định dạng cơ bản; lưu `Nháp` |
| A2 | NSD bấm **Huỷ** (`Cancel`) khi đang nhập form Tạo mới/Sửa | Nếu form đã nhập dữ liệu → hỏi xác nhận (MSG-CFM-CANCEL); nếu xác nhận → đóng form, bỏ thay đổi |
| A3 | NSD lọc/tìm kiếm nhiều lần liên tiếp | Truy vấn lại theo bộ lọc mới; phân trang về trang 1; sort theo cột chọn |
| A4 | NSD copy từ quyền đã có | Mở form `TT_PHANQUYEN.NEW` với dữ liệu sao chép (trừ Mã quyền — bắt buộc nhập mới); F-STATUS=`Nháp` |
| A5 | Checker bấm **Kiểm soát** (Approve - Checker) | Cập nhật trạng thái `Pending_Approver`; notify Approver |
| A6 | Approver bấm **Phê duyệt** (Approve - Approver) | Cập nhật `Approved` → tự động chuyển sang `Hiệu lực` (active); cache invalidation; gửi notify Maker |
| A7 | Hết hạn tự động (Job nền) | Job chạy hàng ngày 00:05; quyền có `MAX(Effective_Date_To)` < ngày hiện tại → chuyển `Hết hiệu lực`; ghi audit |
| A8 | NSD bấm **Xuất** trên `TT_PHANQUYEN.LIST` | Xuất Excel/PDF/CSV danh sách quyền (sync nếu < 5,000 bản ghi, async nếu vượt) |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc bị bỏ trống khi Submit (VAL-01) — Mã quyền/Tên quyền/Nhóm quyền/Mã chức năng/Chức năng | Highlight đỏ + hiển thị MSG-ERR-REQUIRED `Vui lòng nhập [Tên trường]`; chặn submit |
| E2 | Mã quyền vượt 10 chữ số hoặc chứa ký tự không phải số (VAL-02, VAL-PQ-08) | Hiển thị MSG-ERR-PQ-CODE-FORMAT `Mã quyền phải là số tự nhiên, tối đa 10 chữ số`; clear/highlight |
| E3 | Mã quyền đã tồn tại (VAL-PQ-01) | Hiển thị MSG-ERR-PQ-CODE-DUP `Mã quyền [<value>] đã tồn tại`; chặn submit |
| E4 | Tên quyền/Nhóm quyền/Chức năng vượt 40 ký tự (VAL-02) | Hiển thị MSG-ERR-FORMAT; cắt input đến giới hạn hoặc chặn |
| E5 | Trùng Mã chức năng trong cùng bản ghi (VAL-PQ-02) | Hiển thị MSG-ERR-PQ-FUNC-DUP `Chức năng [<Function_Code>] đã được thêm`; không thêm dòng |
| E6 | Không tick cả Read và Write trên cùng dòng chi tiết (VAL-PQ-03) | Hiển thị MSG-ERR-PQ-RW-EMPTY `Phải chọn ít nhất Đọc hoặc Ghi cho mỗi chức năng`; chặn Lưu |
| E7 | `Effective_Date_To` < `Effective_Date_From` (VAL-PQ-04) | Hiển thị MSG-ERR-PQ-DATE `Ngày hết hiệu lực phải ≥ Ngày hiệu lực`; chặn |
| E8 | Số dòng chi tiết > 200 (VAL-PQ-05) | Hiển thị MSG-ERR-PQ-MAX-LINE `Tối đa 200 chức năng/quyền`; chặn thêm dòng |
| E9 | Bản ghi không có dòng chi tiết nào khi Submit (VAL-PQ-06) | Hiển thị MSG-ERR-PQ-NO-DETAIL `Vui lòng thêm ít nhất một chức năng vào quyền`; chặn Submit |
| E10 | NSD sửa Mã quyền trong form EDIT (VAL-PQ-07) | Field disable; nếu vẫn cố submit (qua API) → backend reject + ghi audit bảo mật |
| E11 | Sửa/Huỷ khi trạng thái không cho phép (VAL-13) | Hiển thị MSG-ERR-STATUS `Quyền đang ở trạng thái [<state>], không cho phép Sửa/Huỷ`; disable nút |
| E12 | Sửa/Huỷ khi không phải Maker gốc (VAL-14) | Hiển thị MSG-ERR-MAKER `Chỉ Người lập gốc mới được phép Sửa/Huỷ` |
| E13 | Optimistic lock conflict khi Lưu (VAL-15) | Hiển thị MSG-ERR-LOCK `Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục` |
| E14 | Confirm huỷ không đủ điều kiện (VAL-16) | Disable nút Xác nhận huỷ đến khi nhập đủ lý do + tick checkbox |
| E15 | Lookup `Function_Code` trả về danh mục trống / Function không Active | Hiển thị MSG-ERR-PQ-FUNC-INACTIVE `Chức năng đã ngừng sử dụng, vui lòng chọn chức năng khác` |
| E16 | Khoảng thời gian lọc (Từ ngày → Đến ngày) trên `TT_PHANQUYEN.1` > 365 ngày | Warning vàng MSG-WRN-PQ-RANGE `Khoảng thời gian lọc lớn có thể làm chậm truy vấn`; cho phép tiếp tục |
| E17 | Ký tự nguy hiểm (`< > " ' ;`) trong Tên quyền/Nhóm quyền (VAL-10) | Hiển thị MSG-ERR-PQ-INVALID-CHAR `Tên quyền/Nhóm quyền không chứa các ký tự đặc biệt < > " ' ;`; chặn |
| E18 | Lỗi hệ thống / API timeout | Hiển thị MSG-ERR-SYSTEM `Lỗi hệ thống, traceId: <…>`; rollback giao dịch |

## 7. Quy tắc nghiệp vụ

| STT | Mã | Quy tắc |
|---|---|---|
| 1 | BIZ-001 | Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò (Separation of Duties — SoD) |
| 2 | BIZ-002 | Chỉ Maker gốc được Sửa/Huỷ khi bản ghi quyền ở trạng thái `Nháp`/`Returned_To_Maker` |
| 3 | BIZ-003 | Huỷ quyền là soft-delete; bản ghi vẫn tra được qua audit/history. Hard-delete chỉ qua quy trình bảo trì DB |
| 4 | BIZ-004 | Mã quyền (`Role_Code`) là duy nhất toàn hệ thống, không cho phép sửa sau khi tạo |
| 5 | BIZ-005 | Mỗi quyền phải có ≥ 1 dòng chi tiết Function; mỗi dòng chi tiết phải tick ≥ 1 trong {Đọc, Ghi} |
| 6 | BIZ-006 | Tối đa 200 Function/quyền (cấu hình `MAX_FUNC_PER_ROLE`); vượt → chặn |
| 7 | BIZ-007 | Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue cho mọi thao tác CRUD trên quyền và dòng chi tiết |
| 8 | BIZ-008 | Lịch sử ghi nhận thông tin: `Created_By`, `Created_Date`, `Last_Updated_By`, `Last_Updated_Date`; cập nhật tự động khi Lưu |
| 9 | BIZ-009 | Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp trong luồng (Checker → Approver → Maker) |
| 10 | BIZ-010 | Khi quyền chuyển trạng thái `Hiệu lực` (sau khi Approve) → invalidate cache quyền của tất cả user đang được gán quyền này; force re-login nếu cấu hình `FORCE_RELOGIN_ON_PERM_CHANGE=true` |
| 11 | BIZ-011 | Khi quyền `Hết hiệu lực` (job nền hoặc tất cả dòng chi tiết hết hạn) → tự động unbind khỏi user; user mất quyền truy cập các Function tương ứng |
| 12 | BIZ-012 | Không cho phép Maker tạo quyền cấp cao hơn quyền hiện tại của Maker (cấu hình `PERMISSION_HIERARCHY_CHECK=true`) |
| 13 | BIZ-013 | Quyền `Hết hiệu lực` không cho phép phục hồi trực tiếp; phải tạo quyền mới hoặc tạo bản ghi sao chép và gửi duyệt lại |

## 8. Quy tắc kiểm tra dữ liệu

> Tổng hợp các quy tắc Validate được tham chiếu trong §4–§6. Phân loại: **Chung** (mọi chức năng/phân hệ), **Phân hệ** (dùng chung cho phân hệ TT), **Chức năng** (riêng cho `TT_PHANQUYEN`).

| STT | Phân loại | Mã | Quy tắc |
|---|---|---|---|
| 1 | Chung | VAL-01 | Trường bắt buộc không được bỏ trống khi Submit; highlight đỏ + thông báo MSG-ERR-REQUIRED |
| 2 | Chung | VAL-02 | Định dạng dữ liệu theo kiểu trường: Text (độ dài min/max), Number (số chữ số), Date `dd/MM/yyyy`, List of Value |
| 3 | Chung | VAL-03 | Giá trị thuộc danh mục (Dropdown/Lookup); ngoài danh mục → thông báo MSG-ERR-LOOKUP và clear trường |
| 4 | Chung | VAL-04 | Range/min-max cho ngày (vd `Effective_Date_From` ≥ ngày hiện tại); DateRange: Từ ngày ≤ Đến ngày |
| 5 | Chung | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các trường (vd `Effective_Date_To` ≥ `Effective_Date_From`, `Created_Date_From` ≤ `Created_Date_To`) |
| 6 | Chung | VAL-10 | Trường Text: trim; không cho phép ký tự điều khiển (`\x00-\x1F`) và ký tự nguy hiểm (`< > " ' ;`) để chống XSS/SQL Injection |
| 7 | Chung | VAL-11 | Unique constraint: Mã quyền (`Role_Code`) duy nhất toàn hệ thống |
| 8 | Chung | VAL-13 | Trạng thái cho phép thao tác: Sửa/Huỷ chỉ với `Nháp`/`Returned_To_Maker`; không cho thao tác trên bản ghi `Hiệu lực`/`Approved`/`Posted` |
| 9 | Chung | VAL-14 | Người sở hữu: chỉ Maker gốc được Sửa/Huỷ; phá vỡ → chặn + log audit bảo mật |
| 10 | Chung | VAL-15 | Optimistic lock theo `(Role_ID, F-VER)`: khi Lưu nếu `F-VER` trong DB ≠ `F-VER` đã load → chặn, thông báo tải lại |
| 11 | Chung | VAL-16 | Confirm huỷ: bắt buộc nhập **Lý do** ≥ 10 ký tự và tick checkbox xác nhận; thiếu → disable nút Xác nhận huỷ |
| 12 | Chung | VAL-17 | Trường immutable trong Edit-mode: `Role_ID`, `Role_Code`, `Created_By`, `Created_Date`, `F-VER`; backend reject nếu client gửi thay đổi |
| 13 | Chức năng | VAL-PQ-01 | `Role_Code` phải duy nhất; truy vấn DB trước khi insert; chặn nếu trùng (MSG-ERR-PQ-CODE-DUP) |
| 14 | Chức năng | VAL-PQ-02 | `Function_Code` không được trùng trong cùng một bản ghi quyền (kiểm tra ngay khi thêm dòng — MSG-ERR-PQ-FUNC-DUP) |
| 15 | Chức năng | VAL-PQ-03 | Mỗi dòng chi tiết phải tick ≥ 1 trong {`Read`, `Write`}; không tick cả 2 → MSG-ERR-PQ-RW-EMPTY |
| 16 | Chức năng | VAL-PQ-04 | `Effective_Date_To` ≥ `Effective_Date_From` (nếu nhập); để trống `Effective_Date_To` → hiệu lực vô thời hạn |
| 17 | Chức năng | VAL-PQ-05 | Tối đa 200 dòng chi tiết/bản ghi quyền (cấu hình `MAX_FUNC_PER_ROLE`) |
| 18 | Chức năng | VAL-PQ-06 | Bản ghi quyền phải có ≥ 1 dòng chi tiết khi Submit; chỉ có thông tin chung → MSG-ERR-PQ-NO-DETAIL |
| 19 | Chức năng | VAL-PQ-07 | `Role_Code` không cho sửa sau khi tạo (field disable trên `TT_PHANQUYEN.EDIT`); backend reject thay đổi |
| 20 | Chức năng | VAL-PQ-08 | `Role_Code`: số tự nhiên, độ dài 1–10 chữ số, không có ký tự đặc biệt |
| 21 | Chức năng | VAL-PQ-09 | `Function_Code` chỉ chọn từ danh mục Function đang Active (status = Active trong danh mục Function); không cho phép chọn Function `Inactive` |
| 22 | Phân hệ | VAL-PQ-10 | Khoảng lọc `Created_Date_From → Created_Date_To` ≤ 365 ngày (cảnh báo nếu vượt — MSG-WRN-PQ-RANGE) |
| 23 | Chức năng | VAL-PQ-11 | Maker không được tạo quyền chứa Function vượt cấp quyền của chính Maker (kiểm tra theo BIZ-012) |

## 9. Danh sách thông báo

> Tổng hợp các thông báo trong §4–§6 và §8. Phân loại: **Error** (chặn xử lý), **Warning** (cho phép tiếp tục có cảnh báo), **Info/Success** (thông báo kết quả), **Confirm** (yêu cầu xác nhận).

| STT | Phân loại 1 | Phân loại 2 | Mã | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên trường]` |
| 2 | Chung | Error | MSG-ERR-FORMAT | Định dạng `[Tên trường]` không hợp lệ |
| 3 | Chung | Error | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | MSG-ERR-RANGE | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`) |
| 5 | Chung | Error | MSG-ERR-CROSS-FIELD | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]` |
| 6 | Chung | Error | MSG-ERR-DUPLICATE | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]` |
| 7 | Chung | Error | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 8 | Chung | Error | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 9 | Chung | Error | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 10 | Chung | Error | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 11 | Chung | Error | MSG-ERR-STATUS | Quyền đang ở trạng thái `[<state>]`, không cho phép Sửa/Huỷ |
| 12 | Chung | Error | MSG-ERR-MAKER | Chỉ Người lập gốc mới được phép Sửa/Huỷ |
| 13 | Chung | Error | MSG-ERR-LOCK | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 14 | Chung | Error | MSG-ERR-CONCURRENT | Quyền đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau |
| 15 | Chung | Error | MSG-ERR-DELETE-CFM | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát |
| 16 | Chung | Success | MSG-OK-SAVE | Lưu quyền thành công |
| 17 | Chung | Success | MSG-OK-DELETE | Huỷ quyền thành công |
| 18 | Chung | Success | MSG-OK-SUBMIT | Đã gửi quyền để kiểm soát/phê duyệt |
| 19 | Chung | Success | MSG-OK-APPROVE | Phê duyệt thành công; quyền đã có hiệu lực |
| 20 | Chung | Confirm | MSG-CFM-CANCEL | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 21 | Chung | Confirm | MSG-CFM-DELETE | Bạn có chắc muốn huỷ quyền `<Mã quyền>`? |
| 22 | Chung | Confirm | MSG-CFM-DEL-LINE | Bạn có chắc muốn xoá dòng chức năng `<Function_Code>` khỏi quyền? |
| 23 | Chung | Info | MSG-INF-NOTIFY-CHECKER | Đã gửi thông báo đến Người kiểm soát `<…>` |
| 24 | Chung | Info | MSG-INF-NOTIFY-APPROVER | Đã gửi thông báo đến Người phê duyệt `<…>` |
| 25 | Chức năng | Error | MSG-ERR-PQ-CODE-DUP | Mã quyền `[<value>]` đã tồn tại, vui lòng nhập mã khác |
| 26 | Chức năng | Error | MSG-ERR-PQ-CODE-FORMAT | Mã quyền phải là số tự nhiên, tối đa 10 chữ số |
| 27 | Chức năng | Error | MSG-ERR-PQ-FUNC-DUP | Chức năng `[<Function_Code>]` đã được thêm vào quyền này |
| 28 | Chức năng | Error | MSG-ERR-PQ-RW-EMPTY | Phải chọn ít nhất `Đọc` hoặc `Ghi` cho mỗi chức năng |
| 29 | Chức năng | Error | MSG-ERR-PQ-DATE | Ngày hết hiệu lực phải ≥ Ngày hiệu lực |
| 30 | Chức năng | Error | MSG-ERR-PQ-MAX-LINE | Tối đa 200 chức năng/quyền |
| 31 | Chức năng | Error | MSG-ERR-PQ-NO-DETAIL | Vui lòng thêm ít nhất một chức năng vào quyền trước khi gửi kiểm soát |
| 32 | Chức năng | Error | MSG-ERR-PQ-FUNC-INACTIVE | Chức năng `[<Function_Code>]` đã ngừng sử dụng, vui lòng chọn chức năng khác |
| 33 | Chức năng | Error | MSG-ERR-PQ-INVALID-CHAR | Tên quyền/Nhóm quyền/Chức năng không được chứa các ký tự đặc biệt `< > " ' ;` |
| 34 | Chức năng | Error | MSG-ERR-PQ-HIERARCHY | Bạn không có thẩm quyền tạo quyền chứa chức năng `[<Function_Code>]` (vượt cấp quyền hiện tại) |
| 35 | Chức năng | Warning | MSG-WRN-PQ-RANGE | Khoảng thời gian lọc lớn (`> 365 ngày`) có thể làm chậm truy vấn |
| 36 | Chức năng | Warning | MSG-WRN-PQ-EXPIRED | Quyền sẽ hết hiệu lực vào `[<ngày>]` (tất cả dòng chi tiết đã hết hạn) |
| 37 | Chức năng | Info | MSG-INF-PQ-CACHE | Đã làm mới cache quyền cho `<N>` người dùng đang được gán quyền này |

## 10. Danh sách sự kiện

> Tổng hợp các sự kiện (UI action + backend event) phát sinh trong vòng đời chức năng. Quy ước Event_id: `TT_PHANQUYEN.<ACTION>` (action ở thì hiện tại đơn).

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `TT_PHANQUYEN.LIST.VIEW` | Chung | Danh sách | Mở màn hình `TT_PHANQUYEN.1` (khu vực bộ lọc) |
| 2 | `TT_PHANQUYEN.LIST.FILTER` | Chung | Danh sách | NSD áp dụng bộ lọc (`Find`) — trả kết quả ở `TT_PHANQUYEN.2` |
| 3 | `TT_PHANQUYEN.LIST.RESET` | Chung | Danh sách | NSD bấm `Refresh` — reset bộ lọc |
| 4 | `TT_PHANQUYEN.LIST.EXPORT` | Chung | Danh sách | NSD xuất dữ liệu Excel/PDF/CSV |
| 5 | `TT_PHANQUYEN.NEW.OPEN` | Chức năng | Tạo mới | Mở form Tạo mới (`TT_PHANQUYEN.3.1` + `TT_PHANQUYEN.3.2`); sinh `Role_ID` |
| 6 | `TT_PHANQUYEN.NEW.SAVE` | Chức năng | Tạo mới | Lưu bản ghi `Nháp` |
| 7 | `TT_PHANQUYEN.NEW.SUBMIT` | Chức năng | Tạo mới | Submit → `Ready_For_Approval`; notify Checker |
| 8 | `TT_PHANQUYEN.NEW.CANCEL` | Chức năng | Tạo mới | Huỷ form, bỏ thay đổi |
| 9 | `TT_PHANQUYEN.NEW.COPY` | Chức năng | Tạo mới | Tạo mới bằng cách copy từ bản ghi đã có |
| 10 | `TT_PHANQUYEN.DETAIL.ADD` | Chức năng | Chi tiết | Thêm 1 dòng chi tiết Function vào grid `TT_PHANQUYEN.3.2` |
| 11 | `TT_PHANQUYEN.DETAIL.REMOVE` | Chức năng | Chi tiết | Xoá 1 dòng chi tiết Function khỏi grid |
| 12 | `TT_PHANQUYEN.DETAIL.LOOKUP_FUNCTION` | Chức năng | Chi tiết | Mở popup tra cứu Function (`TT_PHANQUYEN.LOOKUP.FUNCTION`) |
| 13 | `TT_PHANQUYEN.DETAIL.TOGGLE_READ` | Chức năng | Chi tiết | Tick/untick checkbox `Read` trên dòng chi tiết |
| 14 | `TT_PHANQUYEN.DETAIL.TOGGLE_WRITE` | Chức năng | Chi tiết | Tick/untick checkbox `Write` trên dòng chi tiết |
| 15 | `TT_PHANQUYEN.VIEW.OPEN` | Chức năng | Xem | Mở form Xem (read-only) |
| 16 | `TT_PHANQUYEN.VIEW.HISTORY` | Chức năng | Xem | Mở tab Lịch sử / Audit |
| 17 | `TT_PHANQUYEN.VIEW.APPROVAL` | Chức năng | Xem | Mở tab Trạng thái phê duyệt |
| 18 | `TT_PHANQUYEN.EDIT.OPEN` | Chức năng | Sửa | Mở form Sửa; load F-VER hiện hành |
| 19 | `TT_PHANQUYEN.EDIT.SAVE` | Chức năng | Sửa | Lưu thay đổi; F-VER+1; ghi audit |
| 20 | `TT_PHANQUYEN.EDIT.CANCEL` | Chức năng | Sửa | Huỷ chỉnh sửa, bỏ thay đổi |
| 21 | `TT_PHANQUYEN.DELETE.OPEN` | Chức năng | Huỷ | Mở popup Huỷ (lý do + checkbox) |
| 22 | `TT_PHANQUYEN.DELETE.CONFIRM` | Chức năng | Huỷ | Soft-delete; ghi audit |
| 23 | `TT_PHANQUYEN.APPROVE.CHECKER` | Phân hệ | Kiểm soát | Checker phê duyệt → chuyển Approver |
| 24 | `TT_PHANQUYEN.APPROVE.APPROVER` | Phân hệ | Phê duyệt | Approver phê duyệt → `Approved` → tự động chuyển `Hiệu lực` |
| 25 | `TT_PHANQUYEN.APPROVE.REJECT` | Phân hệ | Phê duyệt | Từ chối → `Rejected` + lý do |
| 26 | `TT_PHANQUYEN.APPROVE.RETURN` | Phân hệ | Phê duyệt | Trả lại Maker → `Returned_To_Maker` |
| 27 | `TT_PHANQUYEN.NOTIFY.SEND` | Phân hệ | Notification | Gửi notification chuyển trạng thái (in-app + email) |
| 28 | `TT_PHANQUYEN.AUDIT.WRITE` | Chung | Audit | Ghi log thao tác |
| 29 | `TT_PHANQUYEN.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 30 | `TT_PHANQUYEN.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 31 | `TT_PHANQUYEN.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện conflict (optimistic lock mismatch) |
| 32 | `TT_PHANQUYEN.CACHE.INVALIDATE` | Phân hệ | Cache | Invalidate cache quyền của tất cả user được gán quyền sau khi Approve |
| 33 | `TT_PHANQUYEN.JOB.EXPIRE` | Hệ thống | Job nền | Job hàng ngày 00:05 — chuyển quyền hết hạn sang `Hết hiệu lực` |
| 34 | `TT_PHANQUYEN.HIERARCHY.CHECK` | Phân hệ | Bảo mật | Kiểm tra Maker có thẩm quyền tạo quyền với Function được chọn (BIZ-012) |

## 11. State Machine (Trạng thái bản ghi quyền)

> Tổng hợp các bước chuyển trạng thái dựa trên §3 (Hậu điều kiện), §4 (Luồng chính), §5 (Luồng thay thế) và §10 (Sự kiện). Trạng thái sử dụng: `Start`, `Nháp` (Draft), `Ready_For_Approval` (chờ Checker), `Pending_Approver` (chờ Approver), `Approved`, `Hiệu lực` (Active), `Hết hiệu lực` (Expired), `Returned_To_Maker`, `Rejected`, `Deleted`, `End`.
>
> Quy ước: cột **Trạng thái** = trạng thái trước sự kiện; cột **Trạng thái mới** = trạng thái sau sự kiện. Một số dòng có thể có nhiều trạng thái nguồn (ghi rõ bằng dấu `/`).

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | Maker tạo mới quyền (`TT_PHANQUYEN.NEW.OPEN`) | Start | Nháp | Sinh `Role_ID`, `F-VER=1`, `F-STATUS=Nháp`; autofill `Created_By`, `Created_Date`; ghi log |
| 2 | Maker bấm Lưu/Lưu nháp (`TT_PHANQUYEN.NEW.SAVE`) | Nháp | Nháp | Lưu thay đổi field; ghi audit; cập nhật `Last_Updated_By/Date`; F-VER không đổi |
| 3 | Maker huỷ thao tác Tạo mới (`TT_PHANQUYEN.NEW.CANCEL`) | Nháp (chưa lưu) | End | Đóng form, bỏ thay đổi; nếu chưa Save → không sinh bản ghi DB |
| 4 | Maker bấm Sửa & Lưu (`TT_PHANQUYEN.EDIT.SAVE`) | Nháp / Returned_To_Maker | Nháp | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit |
| 5 | Maker bấm Submit (`TT_PHANQUYEN.NEW.SUBMIT`) | Nháp / Returned_To_Maker | Ready_For_Approval | Validate đầy đủ (VAL-PQ-06); chuyển trạng thái; notify Checker (BIZ-009) |
| 6 | Maker bấm Huỷ — Xác nhận huỷ (`TT_PHANQUYEN.DELETE.CONFIRM`) | Nháp / Returned_To_Maker | Deleted | Soft-delete (`F-STATUS=Deleted`); ghi audit; MSG-OK-DELETE |
| 7 | Checker phê duyệt (`TT_PHANQUYEN.APPROVE.CHECKER`) | Ready_For_Approval | Pending_Approver | Chuyển sang chờ Approver; notify Approver; ghi audit |
| 8 | Checker trả lại Maker (`TT_PHANQUYEN.APPROVE.RETURN`) | Ready_For_Approval | Returned_To_Maker | Bắt buộc lý do ≥ 10 ký tự; notify Maker; ghi audit |
| 9 | Checker từ chối (`TT_PHANQUYEN.APPROVE.REJECT`) | Ready_For_Approval | Rejected | Bắt buộc lý do; notify Maker; khoá bản ghi; ghi audit |
| 10 | Approver phê duyệt (`TT_PHANQUYEN.APPROVE.APPROVER`) | Pending_Approver | Approved | Chuyển `Approved`; gửi notify Maker; ghi audit |
| 11 | Hệ thống tự động active sau Approve | Approved | Hiệu lực | Trigger `TT_PHANQUYEN.CACHE.INVALIDATE`; quyền sẵn sàng gán cho user |
| 12 | Approver trả lại Maker | Pending_Approver | Returned_To_Maker | Bắt buộc lý do; notify Maker; ghi audit |
| 13 | Approver từ chối | Pending_Approver | Rejected | Bắt buộc lý do; notify Maker; khoá bản ghi; ghi audit |
| 14 | Job nền phát hiện hết hạn (`TT_PHANQUYEN.JOB.EXPIRE`) | Hiệu lực | Hết hiệu lực | Tất cả dòng chi tiết có `Effective_Date_To` < ngày hiện tại → chuyển `Hết hiệu lực`; unbind khỏi user (BIZ-011); ghi audit |
| 15 | Kết thúc vòng đời quyền | Hết hiệu lực / Rejected / Deleted | End | Khoá Sửa; chỉ cho phép Xem; ghi audit truy cập |
| 16 | (Vi phạm) Cố tình Sửa/Huỷ ở trạng thái không cho phép | Ready_For_Approval / Pending_Approver / Hiệu lực / Hết hiệu lực / Rejected / Deleted | (Không đổi) | Chặn (VAL-13); MSG-ERR-STATUS; disable nút; ghi audit bảo mật |
| 17 | (Vi phạm) Không phải Maker gốc Sửa/Huỷ | Nháp / Returned_To_Maker | (Không đổi) | Chặn (VAL-14); MSG-ERR-MAKER; ghi audit bảo mật |
| 18 | (Concurrent) Optimistic lock mismatch khi Lưu | Nháp / Returned_To_Maker | (Không đổi) | Chặn (VAL-15); MSG-ERR-LOCK; yêu cầu tải lại |
| 19 | (Hệ thống) Phiên đăng nhập hết hạn | (Bất kỳ) | (Không đổi) | Bắt buộc đăng nhập lại; lưu draft tạm nếu form dirty; MSG-ERR-SESSION |
| 20 | (Quản trị) Sao chép quyền `Hết hiệu lực` để tạo mới | Hết hiệu lực | Start (bản ghi mới) | Tạo bản ghi mới `F-STATUS=Nháp` với dữ liệu sao chép; Mã quyền cũ giữ nguyên ở trạng thái Hết hiệu lực |

### Sơ đồ chuyển trạng thái

```
                                      ┌─────────────────────────────────────────┐
                                      │                                         │
              Maker.New        Maker.Save/Edit                                   │
   ┌─Start────────────▶  Nháp  ◀───────────┐                                     │
   │                     │                 │                                     │
   │                     │ Submit          │ Return                              │
   │                     ▼                 │                                     │
   │             Ready_For_Approval ───────┤                                     │
   │                     │                 │                                     │
   │                     │ Checker.Approve │                                     │
   │                     ▼                 │                                     │
   │              Pending_Approver ────────┤                                     │
   │                     │                 │                                     │
   │                     │ Approver.Approve│                                     │
   │                     ▼                                                       │
   │                 Approved ─auto→ Hiệu lực ─Job.Expire→ Hết hiệu lực ─┐       │
   │                     │             │                                │       │
   │                     │ Reject      │ Copy.New                       │       │
   │                     ▼             ▼                                ▼       │
   │                 Rejected ──────▶ (bản ghi mới) ─────▶ End ◀────────┘       │
   │                                                                            │
   │            Maker.Delete (Nháp/Returned_To_Maker)                           │
   └────────────────────────▶ Deleted ──────────────▶ End                       │
                                                                                │
                                                                                │
```

[Inference] Sơ đồ trên minh hoạ vòng đời điển hình của bản ghi quyền; tuỳ cấu hình `MAX_LEVEL_APPROVE` có thể có nhiều cấp Approver hoặc bỏ cấp Checker khi quyền có phạm vi nhỏ.

## 12. Giao diện liên quan

| STT | Màn hình | Mô tả |
|---|---|---|
| 1 | `TT_PHANQUYEN.LIST` (tổng = `TT_PHANQUYEN.1` + `TT_PHANQUYEN.2`) | Màn hình tra cứu danh sách quyền (Khu vực 01 = bộ lọc, Khu vực 02 = grid kết quả) |
| 2 | `TT_PHANQUYEN.1` | Khu vực bộ lọc + thanh nút Tìm kiếm / Tạo mới / Đặt lại |
| 3 | `TT_PHANQUYEN.2` | Khu vực grid kết quả tra cứu |
| 4 | `TT_PHANQUYEN.NEW` (tổng = `TT_PHANQUYEN.3.1` + `TT_PHANQUYEN.3.2`) | Form Tạo mới quyền |
| 5 | `TT_PHANQUYEN.3.1` | Khu vực Thông tin chung của form Tạo mới/Sửa/Xem |
| 6 | `TT_PHANQUYEN.3.2` | Khu vực Thông tin chi tiết (grid danh sách Function được gán) |
| 7 | `TT_PHANQUYEN.VIEW` | Form Xem (read-only); gồm: Thông tin chung + Chi tiết + [Tab] Lịch sử + [Tab] Trạng thái phê duyệt |
| 8 | `TT_PHANQUYEN.EDIT` | Form Sửa quyền |
| 9 | `TT_PHANQUYEN.DELETE` | Popup xác nhận Huỷ quyền (lý do + checkbox) |
| 10 | `TT_PHANQUYEN.DETAIL.DELETE` | Popup xác nhận xoá dòng Function khỏi grid chi tiết |
| 11 | `TT_PHANQUYEN.HISTORY` | Popup/Tab lịch sử audit của bản ghi quyền |
| 12 | `TT_PHANQUYEN.APPROVE` | Màn hình kiểm soát/phê duyệt quyền (dành cho Checker/Approver) |
| 13 | `TT_PHANQUYEN.LOOKUP.FUNCTION` | Popup tra cứu danh mục Function (Function_Code + Function_Name) |
| 14 | `TT_PHANQUYEN.LOOKUP.USER` | Popup tra cứu danh mục User (cho lọc `Created_By` / `Last_Updated_By`) |
| 15 | `TT_PHANQUYEN.LOOKUP.ROLE_GROUP` | Popup tra cứu danh mục Nhóm quyền |
| 16 | `TT_PHANQUYEN.EXPORT` | Tuỳ chọn xuất Excel/PDF/CSV |
| 17 | `TT_PHANQUYEN.PRINT` | Preview in danh sách quyền/chi tiết quyền (tuỳ chọn) |

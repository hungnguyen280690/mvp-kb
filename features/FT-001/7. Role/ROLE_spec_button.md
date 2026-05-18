# Đặc tả nút chức năng — TT_PHANQUYEN (Quản lý phân quyền)

> Tổng hợp các nút thao tác trên các màn hình của chức năng quản lý phân quyền (`TT_PHANQUYEN.LIST` = `TT_PHANQUYEN.1` + `TT_PHANQUYEN.2`, `TT_PHANQUYEN.NEW` = `TT_PHANQUYEN.3.1` + `TT_PHANQUYEN.3.2`, `TT_PHANQUYEN.VIEW`, `TT_PHANQUYEN.EDIT`, `TT_PHANQUYEN.DELETE`, `TT_PHANQUYEN.DETAIL.DELETE`, `TT_PHANQUYEN.APPROVE`, `TT_PHANQUYEN.LOOKUP.*`, `TT_PHANQUYEN.EXPORT`, `TT_PHANQUYEN.HISTORY`). Mã sự kiện tham chiếu §10 và §11 của `BangDacTaChucNang_PhanQuyen_DienHinh.md`.

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt / Trigger | Phím tắt / Shortcut | Mô tả / Description | Ghi chú / Note |
|---|---|---|---|---|---|---|---|
| 1 | Tìm kiếm | Find | `TT_PHANQUYEN.LIST.FILTER` | On click | `Enter` (khi focus trong filter) hoặc `Ctrl+F` | (1) Validate cross-field ngày lọc (VAL-05); (2) Truy vấn DB theo tham số ở `TT_PHANQUYEN.1`; (3) Hiển thị kết quả tại `TT_PHANQUYEN.2`; (4) Phân trang 20/trang; (5) Sort mặc định `Created_Date DESC` | (1) Trên màn hình `TT_PHANQUYEN.1`; (2) Hiển thị MSG-WRN-PQ-RANGE nếu khoảng ngày > 365 ngày |
| 2 | Tạo mới | Create | `TT_PHANQUYEN.NEW.OPEN` | On click | `Ctrl+N` | (1) Mở form Tạo mới (`TT_PHANQUYEN.3.1` + `TT_PHANQUYEN.3.2`); (2) Sinh `Role_ID`; (3) Trạng thái = `Nháp`; (4) Auto-fill `Created_By`, `Created_Date` | (1) Trên `TT_PHANQUYEN.1`; (2) Chỉ enable với user có vai trò Maker/Quản trị viên |
| 3 | Đặt lại | Refresh | `TT_PHANQUYEN.LIST.RESET` | On click | `F5` (hoặc `Ctrl+R`) | (1) Reset toàn bộ tham số lọc ở `TT_PHANQUYEN.1` về giá trị mặc định; (2) Ẩn/clear `TT_PHANQUYEN.2` | Trên `TT_PHANQUYEN.1` |
| 4 | Xem | View | `TT_PHANQUYEN.VIEW.OPEN` | On click icon Action / On click `Role_Code` link | `F3` | (1) Mở `TT_PHANQUYEN.VIEW` (read-only); (2) Hiển thị Thông tin chung (`TT_PHANQUYEN.3.1`) + Chi tiết Function (`TT_PHANQUYEN.3.2`) + [Tab] Lịch sử + [Tab] Trạng thái phê duyệt | (1) Trên grid `TT_PHANQUYEN.2`; (2) Luôn enable cho mọi trạng thái |
| 5 | Huỷ (trên row) | Delete | `TT_PHANQUYEN.DELETE.OPEN` | On click icon Action | `Delete` | (1) Mở popup `TT_PHANQUYEN.DELETE` nhập **Lý do huỷ** (≥ 10 ký tự) + checkbox xác nhận đã rà soát | (1) Trên grid `TT_PHANQUYEN.2`; (2) Chỉ enable khi `Status` ∈ {Nháp, Returned_To_Maker} (VAL-13) và NSD là Maker gốc (VAL-14) |
| 6 | Sửa | Edit | `TT_PHANQUYEN.EDIT.OPEN` | On click | `F2` | (1) Mở `TT_PHANQUYEN.EDIT`; (2) Load F-VER hiện hành (VAL-15); (3) Field `Role_Code` bị disable (VAL-PQ-07) | (1) Trên grid `TT_PHANQUYEN.2` hoặc trên `TT_PHANQUYEN.VIEW`; (2) Chỉ enable khi `Status` ∈ {Nháp, Returned_To_Maker} và NSD là Maker gốc |
| 7 | Thêm mới (dòng chi tiết) | Add | `TT_PHANQUYEN.DETAIL.ADD` | On click | `Ctrl++` (hoặc nút) | (1) Thêm 1 dòng trống vào grid `TT_PHANQUYEN.3.2`; (2) Auto-tăng `Seq`; (3) Auto-focus vào ô `Function_Code`; (4) Kiểm tra giới hạn 200 dòng (VAL-PQ-05) | (1) Vị trí phía trên grid `TT_PHANQUYEN.3.2`; (2) Disable khi đạt 200 dòng — MSG-ERR-PQ-MAX-LINE |
| 8 | Lưu | Save | `TT_PHANQUYEN.NEW.SAVE` / `TT_PHANQUYEN.EDIT.SAVE` | On click | `Ctrl+S` | (1) Validate đầy đủ (VAL-01..VAL-PQ-09); (2) Kiểm tra ≥ 1 dòng chi tiết (VAL-PQ-06); (3) Kiểm tra optimistic lock (VAL-15) khi Edit; (4) Lưu bản ghi; (5) Cập nhật `Last_Updated_By`, `Last_Updated_Date`; (6) Hiển thị MSG-OK-SAVE | (1) Vị trí dưới grid `TT_PHANQUYEN.3.2`; (2) Áp dụng cho `TT_PHANQUYEN.NEW` và `TT_PHANQUYEN.EDIT`; (3) Sự kiện EDIT.SAVE tăng F-VER+1 |
| 9 | Lưu nháp | Save Draft | `TT_PHANQUYEN.NEW.SAVE` | On click | `Ctrl+Shift+S` | (1) Bỏ qua validate đầy đủ; (2) Chỉ validate định dạng cơ bản; (3) Cho phép lưu khi grid chi tiết còn trống; (4) Lưu trạng thái `Nháp` | Cùng event với "Lưu"; giúp Maker lưu giữa chừng khi dữ liệu chưa đủ |
| 10 | Gửi kiểm soát | Submit | `TT_PHANQUYEN.NEW.SUBMIT` | On click | `Ctrl+Enter` (hoặc `F9`) | (1) Validate đầy đủ (VAL-PQ-06 — ≥ 1 dòng chi tiết); (2) Kiểm tra BIZ-012 phân cấp quyền; (3) Chuyển `Nháp`/`Returned_To_Maker` → `Ready_For_Approval`; (4) Notify Checker (BIZ-009); (5) Hiển thị MSG-OK-SUBMIT | (1) Trên `TT_PHANQUYEN.NEW`/`TT_PHANQUYEN.EDIT`; (2) Chỉ enable với Maker; (3) Disable nếu form invalid |
| 11 | Huỷ (Cancel form) | Cancel | `TT_PHANQUYEN.NEW.CANCEL` / `TT_PHANQUYEN.EDIT.CANCEL` | On click | `Esc` | (1) Nếu form dirty → hỏi xác nhận MSG-CFM-CANCEL; (2) Xác nhận → đóng form, bỏ thay đổi | (1) Vị trí dưới grid `TT_PHANQUYEN.3.2`; (2) Khác với nút "Huỷ" trên grid kết quả `TT_PHANQUYEN.2` (event = `DELETE.OPEN`) |
| 12 | Xoá dòng (chi tiết) | Remove Line | `TT_PHANQUYEN.DETAIL.REMOVE` | On click icon Action trên dòng | `Shift+Delete` (khi dòng được focus) | (1) Nếu dòng chưa được lưu vào DB → xoá trực tiếp khỏi grid; (2) Nếu dòng đã lưu → mở popup `TT_PHANQUYEN.DETAIL.DELETE` xác nhận; (3) Ghi audit `TT_PHANQUYEN.DETAIL.REMOVE` | (1) Trên grid `TT_PHANQUYEN.3.2`; (2) Chỉ enable khi form ở chế độ NEW/EDIT |
| 13 | Xác nhận huỷ | Confirm Delete | `TT_PHANQUYEN.DELETE.CONFIRM` | On click | `Enter` (trong popup) | (1) Soft-delete (`F-STATUS=Deleted`); (2) Ghi audit log với lý do huỷ; (3) Hiển thị MSG-OK-DELETE; (4) Đóng popup, refresh grid | (1) Trên popup `TT_PHANQUYEN.DELETE`; (2) Disable đến khi nhập đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 14 | Xác nhận xoá dòng | Confirm Delete Line | (đóng popup, xoá khỏi grid) | On click | `Enter` (trong popup) | (1) Xoá dòng Function khỏi grid; (2) Đánh dấu dirty form; (3) Sự kiện được ghi audit khi user Save bản ghi | Trên popup `TT_PHANQUYEN.DETAIL.DELETE`; disable đến khi tick CONFIRM_DEL_LINE |
| 15 | Sao chép | Copy | `TT_PHANQUYEN.NEW.COPY` | On click | `Ctrl+Shift+C` | (1) Mở `TT_PHANQUYEN.NEW` với dữ liệu sao chép từ bản ghi đang chọn (trừ `Role_Code` — bắt buộc nhập mới); (2) Trạng thái = `Nháp` | (1) Trên grid `TT_PHANQUYEN.2` (row action); (2) Hỗ trợ tạo nhanh bản ghi tương tự, áp dụng cho cả bản ghi `Hết hiệu lực` để tạo phiên bản kế tiếp |
| 16 | Tra cứu danh mục | Lookup | (Mở popup `TT_PHANQUYEN.LOOKUP.*`) | On click icon kính lúp | `F4` | (1) Mở popup tra cứu (`LOOKUP.FUNCTION` / `LOOKUP.USER` / `LOOKUP.ROLE_GROUP`); (2) Chọn giá trị → trả về form; (3) Hỗ trợ tìm kiếm, phân trang | (1) Đi kèm các trường: `Role_Group_Name`, `Function_Code`, `Created_By`, `Last_Updated_By`; (2) `Function_Code` chỉ hiển thị Function Active (VAL-PQ-09) |
| 17 | Chọn (trong Lookup) | Select | (đóng popup, trả giá trị) | On click row / `Enter` trên dòng | `Enter` | (1) Trả về `<Mã>` + `<Tên>` cho form gốc; (2) Đóng popup | Trên `TT_PHANQUYEN.LOOKUP.*` |
| 18 | Xuất | Export | `TT_PHANQUYEN.LIST.EXPORT` | On click | `Ctrl+Shift+E` | (1) Mở màn `TT_PHANQUYEN.EXPORT`; (2) Cấu hình định dạng + phạm vi; (3) Xuất file Excel/PDF/CSV (sync < 5,000 / async ≥ 5,000) | Trên `TT_PHANQUYEN.LIST` (`TT_PHANQUYEN.1`) |
| 19 | In | Print | (mở `TT_PHANQUYEN.PRINT`) | On click | `Ctrl+P` | (1) Mở màn xem trước in chứng từ phân quyền | Tuỳ chọn, chỉ active trên `TT_PHANQUYEN.VIEW` |
| 20 | Kiểm soát (Checker) | Approve (Checker) | `TT_PHANQUYEN.APPROVE.CHECKER` | On click | `F8` | (1) Validate SoD (Checker ≠ Maker — BIZ-001); (2) Tick đủ Checklist rà soát; (3) Validate AUTH (OTP/Ký số); (4) Chuyển `Ready_For_Approval` → `Pending_Approver`; (5) Notify Approver | (1) Trên `TT_PHANQUYEN.APPROVE` cho user vai trò Checker; (2) Người kiểm soát ≠ Maker |
| 21 | Phê duyệt (Approver) | Approve (Approver) | `TT_PHANQUYEN.APPROVE.APPROVER` | On click | `F9` | (1) Validate SoD (Approver ≠ Maker & ≠ Checker — BIZ-001); (2) Validate AUTH; (3) Chuyển `Pending_Approver` → `Approved` → tự động `Hiệu lực` (BIZ-010); (4) Trigger `TT_PHANQUYEN.CACHE.INVALIDATE`; (5) Notify Maker, Checker | (1) Trên `TT_PHANQUYEN.APPROVE`; (2) Người duyệt ≠ Maker và ≠ Checker |
| 22 | Trả lại | Return | `TT_PHANQUYEN.APPROVE.RETURN` | On click | `Alt+B` | (1) Bắt buộc nhập **Ghi chú** ≥ 10 ký tự (BIZ-006); (2) Chuyển trạng thái về `Returned_To_Maker`; (3) Notify Maker | (1) Trên `TT_PHANQUYEN.APPROVE`; (2) Áp dụng cho cả Checker và Approver |
| 23 | Từ chối | Reject | `TT_PHANQUYEN.APPROVE.REJECT` | On click | `Alt+J` | (1) Bắt buộc nhập **Ghi chú** ≥ 10 ký tự; (2) Chuyển về `Rejected`; (3) Khoá bản ghi; (4) Notify Maker | Trên `TT_PHANQUYEN.APPROVE` |
| 24 | Mở Lịch sử | Open History | `TT_PHANQUYEN.VIEW.HISTORY` | On click tab | `Alt+H` | Mở tab Lịch sử (`TT_PHANQUYEN.HISTORY`); hiển thị audit log của bản ghi quyền (theo BIZ-007, BIZ-008) | Trên `TT_PHANQUYEN.VIEW` |
| 25 | Mở Trạng thái phê duyệt | Open Approval Status | `TT_PHANQUYEN.VIEW.APPROVAL` | On click tab | `Alt+P` | (1) Mở tab Trạng thái phê duyệt; (2) Hiển thị workflow Maker → Checker → Approver; (3) Highlight cấp hiện tại; (4) Hiển thị thông tin Người kiểm soát/Phê duyệt + Thời gian | Trên `TT_PHANQUYEN.VIEW` |

## Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
|---|---|
| 1 | Mỗi nút phải kiểm tra quyền theo vai trò (Maker/Checker/Approver/Viewer/Admin) trước khi hiển thị; thiếu quyền → ẩn nút (hoặc disable + tooltip MSG-ERR-PERMISSION) |
| 2 | Nút Sửa/Huỷ trên row của `TT_PHANQUYEN.2`: chỉ enable khi `Status` ∈ {Nháp, Returned_To_Maker} (VAL-13) **và** NSD là Maker gốc (VAL-14); vi phạm trạng thái → MSG-ERR-STATUS; vi phạm sở hữu → MSG-ERR-MAKER |
| 3 | Nút Kiểm soát/Phê duyệt/Trả lại/Từ chối: chỉ hiển thị trên `TT_PHANQUYEN.APPROVE` cho user có thẩm quyền tương ứng cấp; SoD bắt buộc (BIZ-001) |
| 4 | Nút Submit/Lưu: disable khi form chứa lỗi validate cứng; enable lại khi tất cả lỗi đã được fix |
| 5 | Nút Xác nhận huỷ trên popup `TT_PHANQUYEN.DELETE`: disable cho đến khi đủ lý do ≥ 10 ký tự + tick checkbox xác nhận (VAL-16) |
| 6 | Nút Thêm mới dòng (`Add`) trên grid `TT_PHANQUYEN.3.2`: disable khi đạt 200 dòng (VAL-PQ-05), tooltip MSG-ERR-PQ-MAX-LINE |
| 7 | Nút Xoá dòng trên grid `TT_PHANQUYEN.3.2`: chỉ enable khi form ở chế độ NEW/EDIT và NSD là Maker gốc; hỏi confirm qua popup `TT_PHANQUYEN.DETAIL.DELETE` nếu dòng đã được lưu trước đó (MSG-CFM-DEL-LINE) |
| 8 | Nút Phê duyệt cho quyền có Function nhạy cảm (cấu hình `SENSITIVE_FUNC_LIST`): bắt buộc xác thực bằng Ký số thay vì OTP |
| 9 | Mỗi lần bấm nút thành công: ghi audit (`TT_PHANQUYEN.AUDIT.WRITE`) gồm user, timestamp, IP, action, oldValue→newValue (BIZ-007) |
| 10 | Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server |
| 11 | Khi phiên hết hạn (`TT_PHANQUYEN.SESSION.TIMEOUT`) → mọi nút chuyển disable, hiển thị MSG-ERR-SESSION, redirect đăng nhập |
| 12 | Mọi nút hiển thị tooltip giải thích khi disable (lý do không cho thao tác); hỗ trợ accessibility (ARIA label, phím tắt) |
| 13 | Phím tắt phải được hiển thị trong tooltip nút (ví dụ "Lưu (Ctrl+S)") và đăng ký toàn cục trong form; tránh xung đột với phím tắt mặc định của trình duyệt (ví dụ `Ctrl+N`, `Ctrl+P` → ứng dụng cần `preventDefault` khi focus trong form) |
| 14 | Phím tắt nhóm phê duyệt (`F8`, `F9`, `Alt+B`, `Alt+J`) chỉ active trên `TT_PHANQUYEN.APPROVE`; phím `F2`, `F3`, `Delete` chỉ active khi có dòng được chọn trên `TT_PHANQUYEN.2` |
| 15 | Hỗ trợ phím `Tab`/`Shift+Tab` để di chuyển focus giữa các nút và ô nhập theo thứ tự logic; `Enter` kích hoạt nút có focus; tổ hợp `Alt+/` mở bảng tra cứu phím tắt |

## Quy ước phím tắt

- **Nhóm soạn thảo (Maker)**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Ctrl+Shift+S` (Lưu nháp), `Ctrl+Enter`/`F9` (Gửi kiểm soát), `Esc` (Huỷ form), `Ctrl+Shift+C` (Sao chép).
- **Nhóm grid chi tiết Function**: `Ctrl++` (Thêm dòng), `Shift+Delete` (Xoá dòng), `F4` (Lookup `Function_Code`).
- **Nhóm thao tác bản ghi (`TT_PHANQUYEN.2`)**: `F2` (Sửa), `F3` (Xem), `Delete` (Huỷ), `F5`/`Ctrl+R` (Đặt lại bộ lọc), `Ctrl+Shift+E` (Xuất), `Ctrl+F` hoặc `Enter` (Tìm kiếm), `Ctrl+P` (In).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường có icon kính lúp (`Role_Group_Name`, `Function_Code`, `Created_By`, `Last_Updated_By`).
- **Nhóm kiểm soát/phê duyệt**: `F8` (Kiểm soát – Checker), `F9` (Phê duyệt – Approver), `Alt+B` (Trả lại – Back), `Alt+J` (Từ chối – reJect).
- **Nhóm điều hướng tab trong `TT_PHANQUYEN.VIEW`**: `Alt+H` (Lịch sử – History), `Alt+P` (Trạng thái phê duyệt – aPproval).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

## Rà soát nhất quán với `BangDacTaChucNang_PhanQuyen_DienHinh.md` và `PhanQuyen_spec_field.md`

| Hạng mục | Tham chiếu trong spec_button | Đối chiếu PhanQuyen | Kết quả |
|---|---|---|---|
| Quy tắc kiểm tra dữ liệu | VAL-13, VAL-14, VAL-15, VAL-16, VAL-PQ-01, VAL-PQ-05, VAL-PQ-06, VAL-PQ-07, VAL-PQ-09 | §8 (VAL-01..VAL-PQ-11) | OK – tất cả mã VAL tham chiếu đều tồn tại trong §8 PhanQuyen |
| Danh sách thông báo | MSG-ERR-PERMISSION, MSG-ERR-STATUS, MSG-ERR-MAKER, MSG-ERR-SESSION, MSG-OK-SAVE, MSG-OK-DELETE, MSG-OK-SUBMIT, MSG-CFM-CANCEL, MSG-CFM-DEL-LINE, MSG-ERR-PQ-MAX-LINE, MSG-WRN-PQ-RANGE | §9 (37 mã MSG) | OK – tất cả mã MSG tham chiếu đều tồn tại trong §9 PhanQuyen |
| Danh sách màn hình | `TT_PHANQUYEN.LIST` (1+2), `TT_PHANQUYEN.NEW` (3.1+3.2), `TT_PHANQUYEN.VIEW`, `TT_PHANQUYEN.EDIT`, `TT_PHANQUYEN.DELETE`, `TT_PHANQUYEN.DETAIL.DELETE`, `TT_PHANQUYEN.APPROVE`, `TT_PHANQUYEN.LOOKUP.FUNCTION/USER/ROLE_GROUP`, `TT_PHANQUYEN.EXPORT`, `TT_PHANQUYEN.PRINT`, `TT_PHANQUYEN.HISTORY` | §12 (17 màn hình) | OK – tất cả màn hình tham chiếu đã có trong §12 |
| Mã sự kiện | `TT_PHANQUYEN.LIST.FILTER/RESET/EXPORT`, `TT_PHANQUYEN.NEW.OPEN/SAVE/SUBMIT/CANCEL/COPY`, `TT_PHANQUYEN.VIEW.OPEN/HISTORY/APPROVAL`, `TT_PHANQUYEN.EDIT.OPEN/SAVE/CANCEL`, `TT_PHANQUYEN.DELETE.OPEN/CONFIRM`, `TT_PHANQUYEN.DETAIL.ADD/REMOVE/LOOKUP_FUNCTION/TOGGLE_READ/TOGGLE_WRITE`, `TT_PHANQUYEN.APPROVE.CHECKER/APPROVER/RETURN/REJECT`, `TT_PHANQUYEN.AUDIT.WRITE`, `TT_PHANQUYEN.CACHE.INVALIDATE`, `TT_PHANQUYEN.SESSION.TIMEOUT` | §10 (34 sự kiện) | OK – tất cả Event ID tham chiếu đều có trong §10 |
| Quy tắc nghiệp vụ | BIZ-001 (SoD), BIZ-006 (lý do ≥ 10), BIZ-007 (audit), BIZ-009 (notification), BIZ-010 (cache invalidate), BIZ-012 (phân cấp) | §7 (BIZ-001..BIZ-013) | OK |
| Trạng thái Status | Nháp, Ready_For_Approval, Pending_Approver, Returned_To_Maker, Rejected, Approved, Hiệu lực, Hết hiệu lực, Deleted | §11 (state machine 20 transitions) | OK – các state tham chiếu đều có trong sơ đồ |
| Phím tắt | `F2`/`F3`/`F4`/`F5`/`F8`/`F9`, `Ctrl+N`/`Ctrl+S`/`Ctrl+Shift+S`/`Ctrl+Enter`/`Ctrl+Shift+C`/`Ctrl+Shift+E`/`Ctrl+F`/`Ctrl+P`, `Shift+Delete`, `Alt+B`/`Alt+J`/`Alt+H`/`Alt+P`, `Esc`/`Enter` | Spec field §4 quy ước chung (mục 9) | OK – đồng bộ, không xung đột với phím tắt trình duyệt |

# Bảng đặc tả chức năng

> Chức năng **Tra cứu** điển hình — gồm: (1) Form nhập tham số tra cứu, (2) Thực hiện tra cứu, (3) Trả kết quả tra cứu. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.TC` |
| Tên chức năng | Tra cứu `<Tên đối tượng nghiệp vụ>` |
| Người sử dụng | Người lập, Người kiểm soát, Người phê duyệt, Người tra cứu, Quản trị |
| Mô tả | Cho phép NSD nhập điều kiện tra cứu, thực hiện truy vấn dữ liệu theo phạm vi phân quyền và xem/xuất kết quả; không làm thay đổi dữ liệu |
| Độ ưu tiên | Cao |
| URD reference | `<URD-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền truy cập chức năng tra cứu `<…>` |
| 3 | Các danh mục tham chiếu phục vụ tra cứu đã được cấu hình |
| 4 | Dữ liệu nguồn (master + lịch sử) đã sẵn sàng để truy vấn |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Danh sách kết quả được hiển thị theo bộ lọc + phân quyền |
| 2 | Không phát sinh thay đổi dữ liệu hệ thống (read-only) |
| 3 | Audit log ghi nhận thao tác tra cứu nếu áp dụng (user, timestamp, tham số tra cứu, số bản ghi trả về) |
| 4 | (Export) File kết quả được tạo và gửi qua kênh tải về / email |

## 4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | NSD mở màn hình tra cứu | Hiển thị form tham số với giá trị mặc định (đơn vị của user, ngày làm việc hiện tại, kênh = Tất cả) |
| 2 | Nhập/chọn tham số tra cứu: **Text** (Mã/Số chứng từ); **Combobox** (Đơn vị – có search); **Dropdown** (Trạng thái); **Multi-select** (Kênh, Loại lệnh); **DateRange** (Từ ngày–Đến ngày); **Decimal range** (Từ số tiền–Đến số tiền); **Picker popup** (Tài khoản); **Tree-select** (Mã quỹ); **Radio** (Phạm vi: Đơn vị tôi / Toàn hệ thống); **Checkbox** (Bao gồm bản ghi đã xoá) | Validate onBlur (định dạng, biên độ); cập nhật trường phụ thuộc; gợi ý autocomplete cho Combobox |
| 3 | Bấm **Tìm kiếm** | Validate tổng hợp (VAL-01..VAL-05); áp dụng phân quyền theo đơn vị/vai trò; truy vấn DB; paging mặc định 20 bản ghi/trang, sort theo Ngày giảm dần |
| 4 | (Hệ thống) | Hiển thị bảng kết quả: STT, các cột dữ liệu chính, cột Trạng thái (Tag), cột Hành động (Xem/Export/In); hiển thị tổng số bản ghi |
| 5 | NSD đổi page size (10/20/50/100) hoặc chuyển trang | Truy vấn lại theo paging mới, giữ điều kiện lọc |
| 6 | NSD bấm vào tiêu đề cột để sort | Truy vấn lại theo sort mới (ASC/DESC), giữ paging trang 1 |
| 7 | NSD chọn dòng → bấm **Xem** hoặc click link Mã | Mở form chi tiết read-only ở popup/route mới; hiển thị đầy đủ trường + đính kèm + lịch sử |
| 8 | NSD bấm **Export** → chọn định dạng (Excel/PDF/CSV) | Nếu ≤ 50.000 bản ghi: tạo file đồng bộ, trả về download; nếu > 50.000: tạo job async, gửi link/email khi xong |
| 9 | NSD bấm **Reset** | Xoá toàn bộ tham số về mặc định; clear bảng kết quả |
| 10 | NSD bấm **Lưu bộ lọc** (tuỳ chọn) | Lưu preset bộ lọc theo user; load nhanh ở lần sau |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD không nhập tham số nào, bấm Tìm | Trả về toàn bộ dữ liệu theo phạm vi phân quyền (paging, có cảnh báo nếu vượt ngưỡng cấu hình) |
| A2 | NSD nhập một phần tham số | Lọc theo các tham số đã nhập (AND), bỏ qua trường rỗng |
| A3 | Kết quả rỗng | Hiển thị thông báo `Không tìm thấy dữ liệu phù hợp với điều kiện tra cứu`; gợi ý mở rộng điều kiện |
| A4 | Kết quả > ngưỡng cảnh báo (vd 10.000 bản ghi) | Hiển thị warning `Kết quả lớn, vui lòng thu hẹp điều kiện hoặc dùng Export async` |
| A5 | NSD bấm **In** trên một dòng | Sinh PDF chi tiết bản ghi theo template, hiển thị preview |
| A6 | NSD bấm **Tải bộ lọc đã lưu** | Load preset từ user profile; áp dụng và truy vấn ngay |
| A7 | NSD chọn nhiều dòng → bấm **Export đã chọn** | Export chỉ các dòng được tick |
| A8 | NSD mở chi tiết từ kết quả → bấm liên kết bản ghi liên quan | Điều hướng sang màn hình tra cứu khác với tham số được truyền sẵn |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Giá trị tham số không thuộc danh mục (VAL-03) | Hiển thị `Giá trị không nằm trong danh mục`; chặn Tìm |
| E2 | Định dạng ngày/số sai (VAL-04) | Hiển thị `Định dạng [trường] không hợp lệ`; chặn Tìm |
| E3 | DateRange ngược (VAL-05): Từ ngày > Đến ngày | Hiển thị `Khoảng thời gian không hợp lệ`; chặn Tìm |
| E4 | DateRange vượt biên độ tối đa cấu hình (vd > 1 năm) | Hiển thị `Khoảng thời gian vượt biên độ cho phép, vui lòng thu hẹp` |
| E5 | NSD nhập điều kiện ngoài phạm vi phân quyền (vd đơn vị khác) | Tự động giới hạn về phạm vi cho phép; thông báo `Đã giới hạn theo phạm vi phân quyền` |
| E6 | Truy vấn vượt timeout cấu hình | Huỷ truy vấn; thông báo `Tra cứu vượt thời gian xử lý, vui lòng thu hẹp điều kiện` |
| E7 | Export đồng bộ vượt 50.000 bản ghi | Tự chuyển sang chế độ async; thông báo `Kết quả lớn — file sẽ được gửi qua email/Notification khi hoàn tất` |
| E8 | Mất kết nối / lỗi hệ thống | Thông báo `Lỗi hệ thống, traceId: <…>`; cho phép thử lại |
| E9 | Phiên đăng nhập hết hạn | Điều hướng về trang đăng nhập; giữ điều kiện tra cứu tạm thời |
| E10 | NSD không có quyền xem chi tiết bản ghi từ kết quả | Disable nút Xem cho dòng đó; tooltip `Bạn không có quyền xem chi tiết bản ghi này` |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-001 — Chỉ hiển thị dữ liệu thuộc phạm vi phân quyền của NSD (đơn vị, vai trò, chi nhánh) |
| 2 | BIZ-002 — Điều kiện kết hợp theo AND; trường rỗng không tham gia lọc |
| 3 | BIZ-003 — Phân trang mặc định 20 bản ghi/trang; cho phép 10/20/50/100; sort mặc định Ngày giảm dần |
| 4 | BIZ-004 — Không cho phép sửa/xoá dữ liệu tại màn hình tra cứu; chỉ điều hướng sang chức năng nghiệp vụ tương ứng nếu được phép |
| 5 | BIZ-005 — DateRange tối đa cấu hình (vd 365 ngày); vượt phải thu hẹp |
| 6 | BIZ-006 — Truy vấn có timeout cấu hình (vd 30s); vượt → huỷ và yêu cầu thu hẹp |
| 7 | BIZ-007 — Export sync ≤ 50.000 bản ghi; vượt → bắt buộc async, gửi qua Notification/email |
| 8 | BIZ-008 — Audit log ghi: user, timestamp, tham số tra cứu, số bản ghi trả về, IP |
| 9 | BIZ-009 — Cảnh báo (không chặn) khi kết quả vượt ngưỡng (vd 10.000 bản ghi) |
| 10 | BIZ-010 — Bản ghi đã soft-delete chỉ hiển thị khi NSD tick `Bao gồm bản ghi đã xoá` và có quyền tương ứng |
| 11 | BIZ-011 — Preset bộ lọc lưu theo user; tối đa N preset/user (vd 10) |
| 12 | BIZ-012 — Truy cập dữ liệu nhạy cảm (PII, số tiền lớn) phải log audit chi tiết và che dấu mặc định (mask), bấm mới hiện đầy đủ |

## 8. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `<MOD>.TC.FORM` — Form nhập tham số tra cứu |
| 2 | `<MOD>.TC.RESULT` — Bảng kết quả tra cứu (paging, sort, chọn nhiều) |
| 3 | `<MOD>.TC.DETAIL` — Popup/route chi tiết bản ghi (read-only) |
| 4 | `<MOD>.TC.LOOKUP.*` — Popup tra cứu danh mục (đơn vị, tài khoản, mã quỹ…) |
| 5 | `<MOD>.TC.EXPORT` — Popup chọn định dạng & phạm vi export (toàn bộ / đã chọn) |
| 6 | `<MOD>.TC.PRINT` — Preview in chi tiết bản ghi |
| 7 | `<MOD>.TC.PRESET` — Quản lý preset bộ lọc của user |
| 8 | `<MOD>.TC.HISTORY` — Popup lịch sử audit của bản ghi (mở từ Detail) |
| 9 | `<MOD>.TC.NOTIFY` — Thông báo Export async hoàn tất (link tải) |

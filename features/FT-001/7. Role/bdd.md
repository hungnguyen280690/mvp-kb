# BDD Use Cases — Quản lý phân quyền (TT_PHANQUYEN)

> Sinh từ `ROLE_spec_function.md`. Mô tả tiếng Việt, từ khóa Given/When/Then tiếng Anh.

---

## UC-PQ-01: Tra cứu danh sách quyền (Main Flow)

**Mô tả**: NSD lọc và xem danh sách quyền trên màn hình TT_PHANQUYEN.LIST.

```gherkin
Given NSD đã đăng nhập hệ thống VDBAS
  And NSD có quyền truy cập màn hình TT_PHANQUYEN
When NSD truy cập màn hình TT_PHANQUYEN.LIST
Then hệ thống hiển thị khu vực bộ lọc (TT_PHANQUYEN.1)
  And khu vực kết quả (TT_PHANQUYEN.2) trống/ẩn

Given khu vực bộ lọc đang hiển thị
When NSD nhập tiêu chí lọc (Mã quyền, Tên quyền, Nhóm quyền, Trạng thái, khoảng thời gian)
  And NSD bấm "Tìm kiếm"
Then hệ thống validate cross-field (Từ ngày <= Đến ngày)
  And truy vấn DB theo tiêu chí
  And hiển thị kết quả ở TT_PHANQUYEN.2
  And ẩn bản ghi đã Deleted
  And sắp xếp Created_Date DESC
  And phân trang 20 bản ghi/trang
```

## UC-PQ-02: Xem chi tiết quyền

```gherkin
Given danh sách quyền đang hiển thị kết quả
When NSD click icon "Xem" hoặc click vào Role_Code trên dòng kết quả
Then hệ thống mở màn hình TT_PHANQUYEN.VIEW (read-only)
  And hiển thị đầy đủ thông tin chung + danh sách function đã gán
  And hiển thị [Tab] Lịch sử + [Tab] Trạng thái phê duyệt
```

## UC-PQ-03: Đặt lại bộ lọc

```gherkin
Given NSD đã nhập tiêu chí lọc và có kết quả hiển thị
When NSD bấm "Đặt lại" (Refresh)
Then hệ thống reset toàn bộ tham số lọc về mặc định
  And ẩn khu vực kết quả
```

## UC-PQ-04: Tạo mới quyền — Lưu nháp (Main Flow)

```gherkin
Given NSD có quyền Maker trên TT_PHANQUYEN
When NSD bấm "Tạo mới" trên TT_PHANQUYEN.1
Then hệ thống mở form TT_PHANQUYEN.NEW (TT_PHANQUYEN.3.1 + TT_PHANQUYEN.3.2)
  And sinh Role_ID (UUID nội bộ)
  And trạng thái = "Nháp"
  And auto-fill Created_By = user hiện tại, Created_Date = thời gian hệ thống

Given form tạo mới đang mở
When NSD nhập Thông tin chung: Mã quyền (số, 1-10 chữ số), Tên quyền, Nhóm quyền
  And NSD bấm "Thêm mới" tại khu vực chi tiết
  And chọn Function_Code qua popup Lookup (Function đang Active)
  And tick Đọc và/hoặc Ghi
  And lặp lại cho các Function khác
  And NSD bấm "Lưu"
Then hệ thống validate cơ bản (định dạng, độ dài, bắt buộc)
  And validate có >= 1 dòng chi tiết (VAL-PQ-06)
  And validate Role_Code unique (VAL-PQ-01)
  And validate không trùng Function_Code (VAL-PQ-02)
  And validate mỗi dòng tick >= 1 trong {Read, Write} (VAL-PQ-03)
  And lưu bản ghi trạng thái "Nháp"
  And hiển thị MSG-OK-SAVE
```

## UC-PQ-05: Tạo mới quyền — Gửi kiểm soát (Submit)

```gherkin
Given bản ghi quyền đã lưu ở trạng thái "Nháp"
  And có >= 1 dòng chi tiết với đầy đủ thông tin
When NSD bấm "Gửi kiểm soát" (Submit)
Then hệ thống validate đầy đủ theo §6 Luồng ngoại lệ
  And chuyển trạng thái "Ready_For_Approval"
  And gửi notification cho Checker (BIZ-009)
  And hiển thị MSG-OK-SUBMIT
```

## UC-PQ-06: Sửa quyền (nháp / trả lại)

```gherkin
Given bản ghi quyền ở trạng thái "Nháp" hoặc "Returned_To_Maker"
  And NSD là Maker gốc
When NSD bấm "Sửa"
Then hệ thống mở form TT_PHANQUYEN.EDIT
  And load F-VER hiện hành
  And cho phép thay đổi Tên quyền, Nhóm quyền, danh sách function chi tiết
  And field Mã quyền bị disable (VAL-PQ-07)

Given NSD đã sửa xong
When NSD bấm "Lưu"
Then hệ thống kiểm tra optimistic lock (VAL-15)
  And F-VER+1
  And ghi audit oldValue -> newValue
  And hiển thị MSG-OK-SAVE
```

## UC-PQ-07: Huỷ quyền

```gherkin
Given bản ghi quyền ở trạng thái "Nháp" hoặc "Returned_To_Maker"
  And NSD là Maker gốc
When NSD bấm icon "Huỷ" trên dòng kết quả
Then hệ thống mở popup TT_PHANQUYEN.DELETE
  And yêu cầu nhập Lý do (>= 10 ký tự) + tick checkbox xác nhận
When NSD nhập đủ điều kiện và bấm "Xác nhận huỷ"
Then hệ thống soft-delete (F-STATUS=Deleted)
  And ghi audit
  And hiển thị MSG-OK-DELETE
```

---

## UC-PQ-A01: Lưu nháp thay vì Submit (Alternate)

```gherkin
Given NSD đang nhập form tạo mới/sửa
  And chưa nhập đủ dữ liệu cho Submit
When NSD bấm "Lưu" (Save Draft)
Then hệ thống chỉ validate định dạng cơ bản
  And lưu bản ghi trạng thái "Nháp"
  And hiển thị MSG-OK-SAVE
```

## UC-PQ-A02: Huỷ form khi đang nhập

```gherkin
Given NSD đang nhập form Tạo mới/Sửa
  And form đã có dữ liệu (dirty)
When NSD bấm "Huỷ" (Cancel)
Then hệ thống hiển thị confirm "Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?"
When NSD xác nhận
Then đóng form, bỏ thay đổi
```

## UC-PQ-A03: Tìm kiếm nhiều lần liên tiếp

```gherkin
Given NSD đang ở màn hình danh sách
When NSD thay đổi tiêu chí lọc và bấm "Tìm kiếm" nhiều lần
Then hệ thống truy vấn lại theo bộ lọc mới mỗi lần
  And phân trang reset về trang 1
  And sort theo cột NSD chọn
```

## UC-PQ-A04: Copy từ quyền đã có

```gherkin
Given NSD đang xem danh sách quyền
When NSD chọn "Copy" từ một quyền đã có
Then hệ thống mở form TT_PHANQUYEN.NEW với dữ liệu sao chép
  And Mã quyền để trống — bắt buộc nhập mới
  And trạng thái = "Nháp"
```

## UC-PQ-A05: Checker kiểm soát (Approve - Checker)

```gherkin
Given bản ghi quyền ở trạng thái "Ready_For_Approval"
  And NSD có vai trò Checker
When Checker bấm "Kiểm soát" (Approve)
Then hệ thống cập nhật trạng thái "Pending_Approver"
  And gửi notification cho Approver
  And ghi audit
```

## UC-PQ-A06: Approver phê duyệt (Approve - Approver)

```gherkin
Given bản ghi quyền ở trạng thái "Pending_Approver"
  And NSD có vai trò Approver
When Approver bấm "Phê duyệt"
Then hệ thống cập nhật trạng thái "Approved"
  And tự động chuyển sang "Hiệu lực" (active)
  And invalidate cache quyền của tất cả user đang được gán quyền này
  And gửi notification cho Maker
  And ghi audit
```

## UC-PQ-A07: Hết hạn tự động (Job nền)

```gherkin
Given quyền ở trạng thái "Hiệu lực"
  And MAX(Effective_Date_To) của tất cả dòng chi tiết < ngày hiện tại
When job nền chạy hàng ngày (00:05)
Then hệ thống chuyển trạng thái "Hết hiệu lực"
  And tự động unbind quyền khỏi user
  And ghi audit
```

## UC-PQ-A08: Xuất danh sách quyền

```gherkin
Given danh sách quyền đang hiển thị kết quả
When NSD bấm "Xuất" và chọn định dạng (Excel/PDF/CSV)
Then hệ thống xuất dữ liệu danh sách quyền
  And nếu < 5.000 bản ghi -> sync
  And nếu >= 5.000 bản ghi -> async
```

## UC-PQ-A09: Checker trả lại Maker

```gherkin
Given bản ghi quyền ở trạng thái "Ready_For_Approval"
  And NSD có vai trò Checker
When Checker bấm "Trả lại" và nhập lý do (>= 10 ký tự)
Then hệ thống chuyển trạng thái "Returned_To_Maker"
  And gửi notification cho Maker
  And ghi audit
```

## UC-PQ-A10: Approver từ chối

```gherkin
Given bản ghi quyền ở trạng thái "Pending_Approver"
  And NSD có vai trò Approver
When Approver bấm "Từ chối" và nhập lý do
Then hệ thống chuyển trạng thái "Rejected"
  And gửi notification cho Maker
  And khoá bản ghi
  And ghi audit
```

---

## UC-PQ-E01: Trường bắt buộc bỏ trống khi Submit (Exception)

```gherkin
Given NSD đang ở form tạo mới/sửa quyền
When NSD bỏ trống trường bắt buộc (Mã quyền/Tên quyền/Nhóm quyền/Mã chức năng) và bấm Submit
Then hệ thống highlight đỏ trường bị thiếu
  And hiển thị "Vui lòng nhập [Tên trường]"
  And chặn Submit
```

## UC-PQ-E02: Mã quyền sai định dạng

```gherkin
Given NSD đang nhập Mã quyền
When NSD nhập giá trị chứa ký tự không phải số hoặc vượt 10 chữ số
Then hệ thống hiển thị "Mã quyền phải là số tự nhiên, tối đa 10 chữ số"
  And clear/highlight trường
```

## UC-PQ-E03: Mã quyền đã tồn tại

```gherkin
Given NSD đang nhập Mã quyền
When NSD nhập giá trị đã tồn tại trong hệ thống
Then hệ thống hiển thị "Mã quyền [<value>] đã tồn tại"
  And chặn Submit
```

## UC-PQ-E04: Tên quyền/Nhóm quyền vượt giới hạn ký tự

```gherkin
Given NSD đang nhập Tên quyền hoặc Nhóm quyền
When NSD nhập vượt 40 ký tự
Then hệ thống hiển thị MSG-ERR-FORMAT
  And cắt input đến giới hạn hoặc chặn nhập thêm
```

## UC-PQ-E05: Trùng Function_Code trong cùng bản ghi

```gherkin
Given NSD đang thêm dòng chi tiết
When NSD chọn Function_Code đã tồn tại trong bản ghi quyền hiện tại
Then hệ thống hiển thị "Chức năng [<Function_Code>] đã được thêm"
  And không thêm dòng mới
```

## UC-PQ-E06: Không tick cả Read và Write

```gherkin
Given NSD đang nhập dòng chi tiết
When NSD không tick cả Read và Write trên cùng dòng
  And bấm "Lưu"
Then hệ thống hiển thị "Phải chọn ít nhất Đọc hoặc Ghi cho mỗi chức năng"
  And chặn Lưu
```

## UC-PQ-E07: Effective_Date_To < Effective_Date_From

```gherkin
Given NSD đang nhập ngày hết hiệu lực trên dòng chi tiết
When NSD nhập Effective_Date_To < Effective_Date_From
Then hệ thống hiển thị "Ngày hết hiệu lực phải >= Ngày hiệu lực"
  And chặn lưu dòng
```

## UC-PQ-E08: Vượt giới hạn 200 Function/quyền

```gherkin
Given bản ghi quyền đã có 200 dòng chi tiết
When NSD bấm "Thêm mới" dòng chi tiết thứ 201
Then hệ thống hiển thị "Tối đa 200 chức năng/quyền"
  And chặn thêm dòng
```

## UC-PQ-E09: Submit khi không có dòng chi tiết

```gherkin
Given NSD đã nhập thông tin chung nhưng chưa thêm dòng chi tiết nào
When NSD bấm "Gửi kiểm soát" (Submit)
Then hệ thống hiển thị "Vui lòng thêm ít nhất một chức năng vào quyền"
  And chặn Submit
```

## UC-PQ-E10: Cố tình sửa Mã quyền qua API

```gherkin
Given bản ghi quyền đã tạo (Role_Code đã set)
When client gửi request sửa Role_Code qua API
Then backend reject thay đổi
  And ghi audit bảo mật
```

## UC-PQ-E11: Sửa/Huỷ khi trạng thái không cho phép

```gherkin
Given bản ghi quyền ở trạng thái "Hiệu lực" / "Approved" / "Ready_For_Approval" / "Pending_Approver" / "Rejected" / "Deleted"
When NSD bấm "Sửa" hoặc "Huỷ"
Then hệ thống disable nút Sửa/Huỷ
  And hiển thị "Quyền đang ở trạng thái [<state>], không cho phép Sửa/Huỷ"
```

## UC-PQ-E12: Sửa/Huỷ khi không phải Maker gốc

```gherkin
Given bản ghi quyền ở trạng thái "Nháp" hoặc "Returned_To_Maker"
  And NSD hiện tại KHÔNG phải là Maker gốc
When NSD cố gắng Sửa hoặc Huỷ
Then hệ thống hiển thị "Chỉ Người lập gốc mới được phép Sửa/Huỷ"
  And ghi audit bảo mật
```

## UC-PQ-E13: Optimistic lock conflict

```gherkin
Given NSD A đang mở form Sửa quyền, F-VER = 5
  And NSD B đã lưu thay đổi, F-VER trong DB = 6
When NSD A bấm "Lưu"
Then hệ thống phát hiện F-VER không khớp (VAL-15)
  And hiển thị "Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục"
  And chặn lưu
```

## UC-PQ-E14: Confirm huỷ không đủ điều kiện

```gherkin
Given NSD đang ở popup Huỷ quyền
When NSD chưa nhập lý do (hoặc lý do < 10 ký tự) hoặc chưa tick checkbox xác nhận
Then nút "Xác nhận huỷ" bị disable
```

## UC-PQ-E15: Lookup Function trả về danh mục trống / Function Inactive

```gherkin
Given NSD mở popup Lookup Function
When NSD chọn một Function_Code có status = Inactive
Then hệ thống hiển thị "Chức năng [<Function_Code>] đã ngừng sử dụng, vui lòng chọn chức năng khác"
  And không cho chọn
```

## UC-PQ-E16: Khoảng thời gian lọc vượt 365 ngày

```gherkin
Given NSD đang ở màn hình danh sách
When NSD nhập khoảng lọc (Từ ngày -> Đến ngày) > 365 ngày
Then hệ thống hiển thị warning "Khoảng thời gian lọc lớn có thể làm chậm truy vấn"
  And cho phép NSD tiếp tục tìm kiếm
```

## UC-PQ-E17: Ký tự nguy hiểm trong Tên quyền/Nhóm quyền

```gherkin
Given NSD đang nhập Tên quyền hoặc Nhóm quyền
When NSD nhập chứa ký tự < > " ' ;
Then hệ thống hiển thị "Tên quyền/Nhóm quyền không chứa các ký tự đặc biệt < > \" ' ;"
  And chặn nhập
```

## UC-PQ-E18: Lỗi hệ thống / API timeout

```gherkin
Given NSD đang thao tác trên màn hình TT_PHANQUYEN
When hệ thống gặp lỗi hoặc API timeout
Then hệ thống hiển thị "Lỗi hệ thống, traceId: <...>"
  And rollback giao dịch
```

## UC-PQ-E19: Maker tạo quyền vượt cấp

```gherkin
Given cấu hình PERMISSION_HIERARCHY_CHECK = true
When Maker chọn Function_Code mà Maker không có quyền truy cập (vượt cấp)
Then hệ thống hiển thị "Bạn không có thẩm quyền tạo quyền chứa chức năng [<Function_Code>] (vượt cấp quyền hiện tại)"
  And chặn thêm Function
```

## UC-PQ-E20: Quyền Hết hiệu lực — không phục hồi trực tiếp

```gherkin
Given quyền ở trạng thái "Hết hiệu lực"
When NSD cố gắng sửa hoặc phục hồi quyền
Then hệ thống chặn thao tác
  And gợi ý: phải tạo quyền mới hoặc sao chép từ quyền hết hiệu lực và gửi duyệt lại
```

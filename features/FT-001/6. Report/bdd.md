# BDD Use Cases — Chức năng Báo cáo

> Sinh từ `REPORT_spec_function.md`. Mô tả tiếng Việt, từ khóa Given/When/Then tiếng Anh.

---

## UC-RPT-01: Kết xuất báo cáo đồng bộ (Main Flow)

**Mô tả**: NSD nhập tham số hợp lệ, kết xuất báo cáo nhỏ, nhận file ngay.

```gherkin
Given NSD đã đăng nhập và có quyền truy cập báo cáo <Tên báo cáo>
  And template báo cáo đã được khai báo
  And dữ liệu nguồn đã sẵn sàng
When NSD chọn báo cáo <Tên báo cáo> trong danh sách
Then hệ thống hiển thị form tham số với giá trị mặc định (Đơn vị, Kỳ báo cáo, Định dạng=PDF, Ngôn ngữ=VI)

Given form tham số đang hiển thị
When NSD nhập/ chọn tham số hợp lệ
  And NSD bấm "Kết xuất"
Then hệ thống validate tham số thành công
  And kiểm tra phân quyền theo đơn vị thành công
  And hệ thống query dữ liệu, render theo template, sinh file
  And file trả về download ngay
  And bản ghi lịch sử kết xuất được lưu (runId, user, timestamp, tham số, định dạng, kích thước, hash, đường dẫn)
```

## UC-RPT-02: Xem trước báo cáo

```gherkin
Given NSD đang ở form tham số báo cáo
  And đã nhập tham số hợp lệ
When NSD bấm "Xem trước"
Then hệ thống render preview báo cáo với dữ liệu thực
  And hiển thị preview trên UI
```

## UC-RPT-03: Tải file từ lịch sử kết xuất

```gherkin
Given tồn tại bản ghi kết xuất ở trạng thái SUCCESS do NSD tạo
When NSD mở màn hình "Lịch sử kết xuất"
  And NSD bấm "Tải file" trên run SUCCESS
Then hệ thống sinh URL ký số có TTL <= 15 phút
  And NSD tải file thành công
  And audit log ghi nhận thao tác DOWNLOAD
```

## UC-RPT-04: In báo cáo

```gherkin
Given NSD đang xem file báo cáo kết xuất thành công
When NSD bấm "In"
Then hệ thống mở preview in (PDF) với template chuẩn (header: logo, mã báo cáo, kỳ; footer: số trang, người kết xuất, thời gian)
```

## UC-RPT-05: Reset tham số

```gherkin
Given NSD đang ở form tham số và đã nhập dữ liệu
When NSD bấm "Reset"
Then hệ thống hiển thị confirm "Bạn có chắc muốn xoá toàn bộ tham số đã nhập về mặc định?"
When NSD xác nhận
Then toàn bộ tham số được reset về giá trị mặc định
```

---

## UC-RPT-A01: Lưu bộ tham số preset (Alternate)

```gherkin
Given NSD đang ở form tham số đã nhập đủ dữ liệu
  And số preset hiện tại của user < giới hạn N
When NSD bấm "Lưu bộ tham số" và nhập tên preset
Then hệ thống lưu preset theo user
  And hiển thị MSG-OK-RPT-PRESET
```

## UC-RPT-A02: Drill-down báo cáo

```gherkin
Given NSD đang xem báo cáo tổng hợp có hỗ trợ drill-down
When NSD click vào dòng tổng hợp
Then hệ thống mở báo cáo chi tiết tương ứng, truyền tham số đã lọc từ dòng được click
```

## UC-RPT-A03: Hủy job đang chạy

```gherkin
Given tồn tại job kết xuất ở trạng thái RUNNING hoặc QUEUED
  And NSD là chủ job hoặc có quyền RPT_ADMIN
When NSD bấm "Hủy job" và xác nhận
Then hệ thống đánh dấu job CANCELLED
  And giải phóng tài nguyên
  And ghi audit
  And hiển thị MSG-OK-RPT-CANCEL
```

## UC-RPT-A04: Scheduler chạy theo lịch

```gherkin
Given đã cấu hình lịch kết xuất tự động ở trạng thái Active
  And đến thời điểm trigger theo cron
When scheduler kích hoạt
Then hệ thống tự động kết xuất theo preset tham số
  And ghi run vào lịch sử kết xuất (chủ job = system)
  And gửi file/link tới danh sách người nhận theo cấu hình
```

## UC-RPT-A05: Kết xuất định dạng Excel

```gherkin
Given NSD đang ở form tham số báo cáo dạng bảng
When NSD chọn "Định dạng = Excel"
  And bấm "Kết xuất"
Then hệ thống sinh workbook có: sheet metadata (tham số, người kết xuất), sheet dữ liệu, sheet pivot/chart (nếu cấu hình)
```

## UC-RPT-A06: Kết xuất định dạng CSV

```gherkin
Given NSD đang ở form tham số
When NSD chọn "Định dạng = CSV"
  And bấm "Kết xuất"
Then hệ thống sinh file chỉ chứa dữ liệu thô, không format/biểu đồ, encoding UTF-8 BOM
```

## UC-RPT-A07: Ký số file báo cáo

```gherkin
Given báo cáo đã kết xuất thành công ở định dạng PDF
  And template hỗ trợ trường ký số
  And chứng thư ký số hợp lệ (OCSP/CRL trả về good)
When NSD bấm "Ký số file"
Then hệ thống áp dụng chữ ký số tổ chức + người kết xuất
  And gắn timestamp TSA
  And cập nhật metadata signed=true
  And hiển thị MSG-OK-RPT-SIGN
```

## UC-RPT-A08: Lập lịch kết xuất tự động

```gherkin
Given NSD đang ở form tham số hoặc màn hình lịch
  And số lịch active hiện tại < giới hạn N
When NSD bấm "Lập lịch", chọn tần suất (Daily/Weekly/Monthly/Cron hợp lệ), danh sách người nhận, định dạng
Then hệ thống validate cron thuộc whitelist (VAL-RPT-10)
  And validate có >= 1 người nhận hợp lệ (VAL-RPT-11)
  And lưu cấu hình lịch (F-RPT-SCHED-ID), trạng thái Active
  And kích hoạt scheduler
  And ghi audit
```

---

## UC-RPT-E01: Tham số bắt buộc bỏ trống (Exception)

```gherkin
Given NSD đang ở form tham số
When NSD bỏ trống trường bắt buộc và bấm "Kết xuất" hoặc "Xem trước"
Then hệ thống highlight đỏ trường đó
  And hiển thị "Vui lòng nhập [Tên tham số]"
  And chặn kết xuất
```

## UC-RPT-E02: DateRange không hợp lệ

```gherkin
Given NSD đang ở form tham số
When NSD nhập "Từ ngày" > "Đến ngày" hoặc khoảng vượt biên độ cho phép
Then hệ thống hiển thị "Khoảng thời gian không hợp lệ / vượt biên độ cho phép"
  And chặn kết xuất
```

## UC-RPT-E03: Tham số ngoài phạm vi phân quyền

```gherkin
Given NSD đang ở form tham số
When NSD nhập giá trị tham số (Đơn vị, Sản phẩm...) vượt phạm vi phân quyền
Then hệ thống tự động giới hạn về phạm vi cho phép
  And hiển thị cảnh báo "Đã giới hạn theo phạm vi phân quyền của bạn"
```

## UC-RPT-E04: Dữ liệu nguồn chưa sẵn sàng (snapshot EOD chưa close)

```gherkin
Given NSD đang kết xuất báo cáo cuối ngày/cuối kỳ
  And snapshot kỳ báo cáo chưa có status = CLOSED
When NSD bấm "Kết xuất"
Then hệ thống hiển thị "Dữ liệu kỳ <...> chưa được chốt, vui lòng thử lại sau khi EOD hoàn tất"
  And chặn kết xuất
```

## UC-RPT-E05: Kết quả rỗng

```gherkin
Given NSD nhập tham số hợp lệ
When hệ thống query dữ liệu và trả về kết quả rỗng
Then hệ thống vẫn sinh file theo template với phần dữ liệu trống + dòng "Không có dữ liệu phù hợp"
  And hiển thị warning trên UI
```

## UC-RPT-E06: Vượt ngưỡng sync — chuyển async

```gherkin
Given NSD bấm "Kết xuất"
  And hệ thống ước lượng kết quả > 50.000 dòng hoặc > 100 trang
Then hệ thống tự chuyển sang async
  And hiển thị "Báo cáo lớn — sẽ được gửi qua Notification/email khi hoàn tất"
  And tạo run record với trạng thái QUEUED
```

## UC-RPT-E07: Render timeout

```gherkin
Given job kết xuất async đang chạy
  And vượt timeout cấu hình (vd 10 phút)
Then hệ thống đánh dấu job FAILED với reason TIMEOUT
  And cho phép retry
  And thông báo cho NSD
```

## UC-RPT-E08: Lỗi template

```gherkin
Given job kết xuất đang chạy
When phát hiện lỗi template (placeholder thiếu / syntax lỗi)
Then hệ thống đánh dấu job FAILED với reason TEMPLATE_ERROR
  And hiển thị "Mẫu báo cáo gặp lỗi, vui lòng liên hệ Quản trị"
  And gửi alert cho team kỹ thuật
```

## UC-RPT-E09: Lỗi sinh file (đĩa đầy / OOM)

```gherkin
Given job kết xuất đang chạy
When phát hiện lỗi sinh file (đĩa đầy, OOM)
Then hệ thống tự retry tối đa N lần với exponential backoff
When vượt số lần retry
  Then đánh dấu FAILED
  And thông báo lỗi kèm traceId
```

## UC-RPT-E10: File vượt giới hạn email khi gửi phân phối

```gherkin
Given NSD gửi phân phối file báo cáo qua email
  And kích thước file > 20MB
Then hệ thống tự chuyển sang gửi link tải có ký số thay vì đính kèm file
  And thông báo cho người gửi
```

## UC-RPT-E11: Link tải hết hạn

```gherkin
Given NSD truy cập link tải file báo cáo
  And URL ký số đã hết hạn (> 15 phút)
Then hệ thống hiển thị "Liên kết đã hết hạn"
  And yêu cầu kết xuất lại
```

## UC-RPT-E12: Phiên hết hạn khi đang kết xuất sync

```gherkin
Given NSD đang kết xuất báo cáo đồng bộ
  And phiên đăng nhập hết hạn
Then job vẫn tiếp tục chạy nền
  And kết quả được lưu vào lịch sử
  And khi NSD đăng nhập lại, hệ thống gửi notification trạng thái mới nhất
```

## UC-RPT-E13: Không có quyền tải file của user khác

```gherkin
Given tồn tại run SUCCESS do user khác tạo
  And NSD hiện tại không có quyền tải file đó
When NSD xem lịch sử kết xuất
Then nút "Tải" bị disable
  And tooltip hiển thị "Bạn không có quyền tải báo cáo của người dùng khác"
```

## UC-RPT-E14: Scheduler không gửi được email

```gherkin
Given scheduler kích hoạt và kết xuất thành công
When gửi email cho danh sách người nhận nhưng một số lỗi
Then hệ thống đánh dấu run PARTIAL_SUCCESS
  And ghi danh sách người nhận lỗi
  And retry email tối đa N lần
```

## UC-RPT-E15: Dữ liệu nhạy cảm che mask

```gherkin
Given NSD không có quyền RPT_UNMASK
  And báo cáo chứa dữ liệu nhạy cảm (PII, số tiền lớn)
When hệ thống sinh file
Then dữ liệu nhạy cảm được che mask theo chính sách
  And hiển thị cảnh báo "Dữ liệu nhạy cảm đã được che mask theo chính sách"
```

## UC-RPT-E16: Chênh lệch reconcile

```gherkin
Given hệ thống sinh báo cáo xong
  And tổng chỉ tiêu chính lệch với báo cáo tổng hợp khác cùng kỳ (ngoài tolerance)
Then hệ thống hiển thị warning vàng trên UI
  And watermark "KIỂM TRA SỐ LIỆU" trên file báo cáo
```

## UC-RPT-E17: File hết TTL lưu trữ

```gherkin
Given file báo cáo đã lưu trữ vượt TTL (vd 90 ngày)
When NSD mở lịch sử kết xuất
Then marker "EXPIRED" hiển thị trên dòng run
  And link tải bị disable
  And file đã chuyển sang archive cold storage
```

## UC-RPT-E18: Hash không khớp khi tải

```gherkin
Given NSD tải file báo cáo
When hệ thống so khớp hash SHA-256 phát hiện lệch
Then hệ thống reject việc tải
  And hiển thị "File bị thay đổi hoặc lỗi truyền tải (hash không khớp). Vui lòng kết xuất lại"
  And gửi alert bảo mật
```

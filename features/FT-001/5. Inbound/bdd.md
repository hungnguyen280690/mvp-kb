# BDD Use Cases — Inbound (Nhận dữ liệu từ hệ thống nguồn)

> Sinh từ `INBOUND_spec_function.md`. Mô tả nghiệp vụ bằng Tiếng Việt, từ khóa Given/When/Then bằng tiếng Anh.

---

## UC-I1: Luồng chính — Tiếp nhận và hạch toán thành công

**Mô tả:** Hệ thống nguồn gửi dữ liệu hợp lệ, hệ thống tiếp nhận, kiểm tra, ánh xạ và hạch toán thành công.

```gherkin
Given điểm tiếp nhận đã cấu hình và đăng ký với hệ thống nguồn
And chứng chỉ/khoá/tài khoản tích hợp còn hiệu lực
And cấu trúc dữ liệu và bảng mapping có phiên bản hiệu lực
And danh mục tham chiếu đã đồng bộ
When hệ thống nguồn gửi dữ liệu qua kênh tiếp nhận
Then hệ thống tiếp nhận yêu cầu, sinh mã định danh, ghi nhật ký dữ liệu thô
And xác thực thành công: chứng chỉ/khoá/tài khoản hợp lệ, địa chỉ thuộc danh sách cho phép
And kiểm tra cấu trúc thành công: dữ liệu khớp mẫu phiên bản đang dùng
And kiểm tra trùng lặp: mã định danh chưa từng xử lý
And kiểm tra dữ liệu nghiệp vụ thành công (định dạng, biên độ, danh mục, liên trường)
And chuyển đổi và ánh xạ dữ liệu theo bảng mapping
And ghi vào bảng tạm trạng thái PENDING
And áp dụng quy tắc nghiệp vụ (định tuyến, gán đơn vị, gán kỳ kế toán)
And chuyển sang bảng chính, trạng thái → POSTED
And phát sự kiện `<MOD>.IN.POSTED>`
And trả phản hồi thành công cho hệ thống nguồn kèm correlationId
And nhật ký ghi đầy đủ và cập nhật giám sát
```

## UC-I2: Chống trùng — Dữ liệu đã xử lý trước đó

**Mô tả:** Hệ thống nguồn gửi lại bản ghi đã được xử lý thành công, hệ thống trả kết quả cũ.

```gherkin
Given hệ thống nguồn gửi dữ liệu
And mã định danh đã tồn tại trong hệ thống
And dữ liệu gửi giống hệt dữ liệu đã xử lý trước đó
When hệ thống kiểm tra trùng lặp
Then bỏ qua xử lý nghiệp vụ
And trạng thái → DUPLICATED
And phát sự kiện `<MOD>.IN.IDEMPOTENT.HIT>`
And trả lại kết quả của lần xử lý trước (MSG-OK-IN-002)
And ghi nhật ký thông tin chống trùng
```

## UC-I3: Xung đột trùng — Cùng mã nhưng dữ liệu khác

**Mô tả:** Hệ thống nguồn gửi dữ liệu mới nhưng dùng lại mã định danh đã tồn tại.

```gherkin
Given hệ thống nguồn gửi dữ liệu
And mã định danh đã tồn tại trong hệ thống
And dữ liệu gửi khác với dữ liệu đã xử lý trước đó
When hệ thống kiểm tra trùng lặp
Then không ghi đè
And trạng thái → IN_DLQ với lý do XUNG_ĐỘT_TRÙNG
And phát sự kiện `<MOD>.IN.IDEMPOTENT.CONFLICT>` và `<MOD>.IN.DLQ.MOVED>`
And cảnh báo vận hành
```

## UC-I4: Xác thực thất bại

**Mô tả:** Yêu cầu gửi sai chứng chỉ/khoá/tài khoản hoặc từ địa chỉ không được phép.

```gherkin
Given hệ thống nguồn gửi yêu cầu
When xác thực thất bại (sai khoá / chứng chỉ hết hạn / chữ ký không hợp lệ / địa chỉ không thuộc danh sách cho phép)
Then trả phản hồi từ chối truy cập
And trạng thái → FAILED
And phát sự kiện `<MOD>.IN.AUTH.FAILED>`
And không lưu dữ liệu nhạy cảm trong nhật ký
When xác thực thất bại liên tục vượt ngưỡng (vd > 5 lần/phút)
Then gửi cảnh báo bảo mật (phát `<MOD>.IN.SECURITY.ALERT>`)
```

## UC-I5: Sai cấu trúc dữ liệu

**Mô tả:** Dữ liệu không khớp mẫu cấu trúc theo phiên bản đang dùng.

```gherkin
Given hệ thống nguồn gửi dữ liệu
And xác thực thành công
When dữ liệu không khớp mẫu cấu trúc đang hiệu lực
Then trả phản hồi LỖI_CẤU_TRÚC (MSG-ERR-IN-013)
And trạng thái → FAILED → IN_DLQ với lý do "Sai cấu trúc dữ liệu"
And phát sự kiện `<MOD>.IN.SCHEMA.FAILED>` và `<MOD>.IN.DLQ.MOVED>`
```

## UC-I6: Gói quá lớn

**Mô tả:** Kích thước gói dữ liệu vượt mức tối đa.

```gherkin
Given hệ thống nguồn gửi dữ liệu
When kích thước gói vượt giới hạn (vd > 5MB)
Then trả phản hồi gói quá lớn (MSG-ERR-IN-021)
And ghi nhật ký
And không xử lý tiếp
```

## UC-I7: Kiểm tra nghiệp vụ thất bại

**Mô tả:** Dữ liệu đúng cấu trúc nhưng vi phạm quy tắc nghiệp vụ.

```gherkin
Given bản ghi đã qua xác thực và kiểm tra cấu trúc thành công
When kiểm tra dữ liệu nghiệp vụ phát hiện lỗi
Then trả phản hồi chi tiết lỗi từng trường
And trạng thái → FAILED → IN_DLQ
And phát sự kiện `<MOD>.IN.VALIDATE.FAILED>` và `<MOD>.IN.DLQ.MOVED>`
And không ghi vào bảng chính
```

## UC-I8: Thiếu ánh xạ danh mục (MAPPING_PENDING)

**Mô tả:** Mã đơn vị/đối tác trong dữ liệu gửi không tồn tại trong danh mục nội bộ.

```gherkin
Given bản ghi đang ở trạng thái VALIDATING
When phát hiện mã đơn vị/đối tác không tồn tại trong danh mục nội bộ
Then trạng thái → MAPPING_PENDING
And phát sự kiện `<MOD>.IN.MAPPING.PENDING>`
And thông báo quản trị bổ sung danh mục (MSG-INF-IN-003)
And bản ghi chờ cho đến khi mapping được bổ sung
```

## UC-I9: Mapping được bổ sung — Tự đẩy lại

**Mô tả:** Quản trị bổ sung danh mục, bản ghi tự động xử lý lại.

```gherkin
Given bản ghi ở trạng thái MAPPING_PENDING
When quản trị bổ sung mã ánh xạ vào danh mục
Then trạng thái chuyển → VALIDATING
And phát sự kiện `<MOD>.IN.REPLAY.MANUAL>`
And bản ghi tiếp tục luồng kiểm tra nghiệp vụ
```

## UC-I10: Mapping quá hạn — Đẩy hộp lỗi

**Mô tả:** Bản ghi CHỜ ÁNH XẠ quá N ngày chưa bổ sung.

```gherkin
Given bản ghi ở trạng thái MAPPING_PENDING
And đã quá N ngày chưa bổ sung mapping
Then trạng thái chuyển → IN_DLQ
And phát sự kiện `<MOD>.IN.DLQ.MOVED>`
```

## UC-I11: Xử lý lại tự động — Lỗi tạm thời

**Mô tả:** Lỗi tạm thời (DB chậm, phụ thuộc không sẵn sàng), hệ thống tự xử lý lại.

```gherkin
Given bản ghi đang xử lý và gặp lỗi tạm thời
When số lần xử lý lại chưa vượt 3
Then tăng retryCount
And phát sự kiện `<MOD>.IN.RETRY`
And lập lịch xử lý lại theo giãn cách 5s → 15s → 45s
```

## UC-I12: Vượt số lần xử lý lại — Đẩy hộp lỗi

**Mô tả:** Sau 3 lần tự xử lý lại vẫn lỗi tạm thời.

```gherkin
Given bản ghi đã tự xử lý lại 3 lần
And vẫn gặp lỗi tạm thời
When retryCount đạt giới hạn
Then trạng thái chuyển → IN_DLQ
And phát sự kiện `<MOD>.IN.RETRY.EXCEEDED>` và `<MOD>.IN.DLQ.MOVED>`
And hộp lỗi chứa: dữ liệu gốc, thông tin gửi, lý do, số lần đã xử lý lại
```

## UC-I13: Lỗi vĩnh viễn

**Mô tả:** Dữ liệu hỏng hoặc ánh xạ không tồn tại, không tự xử lý lại.

```gherkin
Given bản ghi gặp lỗi vĩnh viễn (dữ liệu hỏng / ánh xạ không tồn tại)
Then không tự động xử lý lại (BIZ-IN-05)
And trạng thái → IN_DLQ với trạng thái LỖI_VĨNH_VIỄN
And cảnh báo vận hành
```

## UC-I14: Đẩy lại thủ công từ hộp lỗi

**Mô tả:** Vận hành bấm "Đẩy lại" trên màn hình hộp lỗi.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
And vận hành có quyền thao tác
And số lần đẩy lại chưa vượt 3
When vận hành bấm "Đẩy lại"
Then hiển thị xác nhận (MSG-CFM-IN-001)
When vận hành xác nhận
Then lấy lại dữ liệu gốc, áp dụng cấu trúc/mapping mới
And trạng thái chuyển → RECEIVED
And phát sự kiện `<MOD>.IN.REPLAY.MANUAL>`
And chạy lại từ bước kiểm tra dữ liệu
And nhật ký ghi: người thao tác, thời điểm, lý do, kết quả (BIZ-IN-11)
```

## UC-I15: Đẩy lại thủ công — Vượt 3 lần

**Mô tả:** Vận hành cố đẩy lại khi đã đạt giới hạn.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
And replayCount đã đạt 3
When vận hành bấm "Đẩy lại"
Then hệ thống từ chối, không cho đẩy lại (BIZ-IN-11)
```

## UC-I16: Bỏ qua bản ghi trong hộp lỗi

**Mô tả:** Vận hành chọn bỏ qua (ack-skip) bản ghi.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
When vận hành chọn "Bỏ qua"
Then hiển thị xác nhận (MSG-CFM-IN-005)
When vận hành xác nhận
Then trạng thái → REJECTED
And ghi lý do bỏ qua
And cập nhật đối soát
```

## UC-I17: Vượt hạn mức — Chờ duyệt thủ công

**Mô tả:** Bản ghi vượt hạn mức kiểm soát, chuyển sang chờ phê duyệt thay vì từ chối.

```gherkin
Given bản ghi đang ở trạng thái VALIDATING
And kiểm tra nghiệp vụ thành công
When phát hiện giá trị vượt hạn mức kiểm soát
Then trạng thái → HOLD_FOR_REVIEW
And phát sự kiện `<MOD>.IN.HOLD_FOR_REVIEW>`
And gửi thông báo cho người duyệt
And hiển thị MSG-WRN-IN-003
```

## UC-I18: Duyệt bản ghi CHỜ DUYỆT

**Mô tả:** Người có quyền duyệt bản ghi đang chờ phê duyệt.

```gherkin
Given bản ghi ở trạng thái HOLD_FOR_REVIEW
When người có quyền duyệt chọn "Phê duyệt"
Then hiển thị xác nhận (MSG-CFM-IN-002)
When người duyệt xác nhận
Then trạng thái → POSTED
And phát sự kiện `<MOD>.IN.REVIEW.APPROVED>` và `<MOD>.IN.POSTED>`
And hiển thị MSG-OK-IN-005
```

## UC-I19: Từ chối bản ghi CHỜ DUYỆT

**Mô tả:** Người duyệt từ chối bản ghi.

```gherkin
Given bản ghi ở trạng thái HOLD_FOR_REVIEW
When người có quyền chọn "Từ chối"
Then hiển thị xác nhận (MSG-CFM-IN-003)
When người duyệt xác nhận
Then trạng thái → REJECTED
And phát sự kiện `<MOD>.IN.REVIEW.REJECTED>`
And trả phản hồi về hệ thống nguồn
```

## UC-I20: CHỜ DUYỆT quá hạn — Tự động từ chối

**Mô tả:** Bản ghi CHỜ DUYỆT quá N ngày chưa được duyệt.

```gherkin
Given bản ghi ở trạng thái HOLD_FOR_REVIEW
And đã quá N ngày chưa được duyệt
When hệ thống phát hiện quá hạn
Then trạng thái tự động → REJECTED
And phát sự kiện `<MOD>.IN.REVIEW.REJECTED>` (tự động)
And thông báo cho người duyệt và người gửi (MSG-ERR-IN-033)
```

## UC-I21: Chủ động kéo dữ liệu theo lịch

**Mô tả:** Bộ điều phối định kỳ gọi hệ thống nguồn lấy bản ghi mới.

```gherkin
Given đã đến lịch kéo dữ liệu
When bộ điều phối kích hoạt phiên kéo
Then gọi API hệ thống nguồn lấy bản ghi mới theo cột mốc thời gian
And phát sự kiện `<MOD>.IN.PULL.SCHEDULED>`
When nhận được dữ liệu
Then xử lý từng bản ghi theo luồng chính (UC-I1)
And lưu cột mốc thời gian sau khi xử lý xong
When kết thúc phiên kéo
Then phát sự kiện `<MOD>.IN.PULL.DONE>`
```

## UC-I22: Nhận tệp lô qua thư mục an toàn

**Mô tả:** Quét thư mục đầu vào, xử lý từng bản ghi trong tệp.

```gherkin
Given thư mục đầu vào đã cấu hình
When tác vụ quét phát hiện tệp mới
Then kiểm tra tên tệp, kích thước, dấu kiểm tra (checksum)
And phát sự kiện `<MOD>.IN.BATCH.FILE_RECEIVED>`
When tệp hợp lệ
Then giải nén nếu cần, xử lý từng bản ghi theo luồng chính
And di chuyển tệp sang thư mục "đã xử lý"

When tệp bị hỏng hoặc sai checksum
Then di chuyển tệp sang thư mục "lỗi"
And phát sự kiện `<MOD>.IN.BATCH.FILE_INVALID>`
And gửi cảnh báo
```

## UC-I23: Nhận tin nhắn từ hàng đợi

**Mô tả:** Bộ tiêu thụ nhận tin nhắn theo nhóm.

```gherkin
Given hàng đợi tin nhắn đã cấu hình
When bộ tiêu thụ nhận tin nhắn mới
Then phát sự kiện `<MOD>.IN.QUEUE.CONSUMED>`
And xử lý tin nhắn theo luồng chính
When xử lý thành công
Then xác nhận (ack) tin nhắn
When xử lý gặp lỗi tạm thời
Then trả lại tin nhắn (nack) + chờ xử lý lại
```

## UC-I24: Giới hạn tốc độ tiếp nhận

**Mô tả:** Hệ thống nguồn gửi quá nhanh vượt giới hạn.

```gherkin
Given tốc độ gửi từ hệ thống nguồn vượt giới hạn (vd > 100 req/giây)
When hệ thống phát hiện vượt giới hạn
Then trả phản hồi giới hạn tốc độ + đề nghị thử lại sau
And phát sự kiện `<MOD>.IN.THROTTLED>`
And hiển thị cảnh báo MSG-WRN-IN-002
```

## UC-I25: Tạm dừng / Mở lại kênh tiếp nhận

**Mô tả:** Quản trị tạm dừng kênh tiếp nhận để bảo trì.

```gherkin
Given quản trị có quyền thao tác kênh tiếp nhận
When quản trị chọn tạm dừng kênh
Then hiển thị xác nhận (MSG-CFM-IN-004)
When quản trị xác nhận
Then kênh chuyển sang trạng thái tạm dừng
And phát sự kiện `<MOD>.IN.PAUSE>`
And hệ thống nguồn nhận thông báo bận
And dữ liệu đã trong hàng đợi vẫn xử lý theo thứ tự khi mở lại

Given kênh đang tạm dừng
When quản trị chọn mở lại
Then kênh mở lại, phát sự kiện `<MOD>.IN.RESUME>`
And dữ liệu tích luỹ trong hàng đợi xử lý theo thứ tự
```

## UC-I26: Gửi xác nhận về hệ thống nguồn thất bại

**Mô tả:** Không thể gửi xác nhận (ack) về cho hệ thống nguồn.

```gherkin
Given bản ghi đã xử lý thành công (POSTED)
And cần gửi xác nhận về hệ thống nguồn
When gửi xác nhận thất bại
Then lưu xác nhận vào hộp thư đi chiều ngược lại
And phát sự kiện `<MOD>.IN.ACK.FAILED>`
And hệ thống thử gửi lại theo lịch cho đến khi hệ thống nguồn nhận
```

## UC-I27: Đối soát cuối ngày — Khớp

**Mô tả:** Đối chiếu tổng số bản ghi/tổng giá trị với hệ thống nguồn, kết quả khớp.

```gherkin
Given đã đến thời điểm đối soát cuối ngày
And hệ thống đã tổng hợp số lượng + tổng giá trị + checksum tất cả bản ghi đã nhận
When đối chiếu với báo cáo từ hệ thống nguồn
And số liệu khớp hoàn toàn
Then phát sự kiện `<MOD>.IN.RECONCILE.MATCH>`
And hiển thị MSG-OK-IN-003
And cập nhật số liệu giám sát
```

## UC-I28: Đối soát cuối ngày — Chênh lệch

**Mô tả:** Phát hiện chênh lệch khi đối soát, chặn nghiệp vụ cuối ngày.

```gherkin
Given đã đến thời điểm đối soát cuối ngày
When đối chiếu với báo cáo từ hệ thống nguồn
And phát hiện chênh lệch (số lượng hoặc tổng giá trị)
Then phát sự kiện `<MOD>.IN.RECONCILE.MISMATCH>`
And sinh báo cáo chênh lệch chi tiết
And gửi cho vận hành
And chặn nghiệp vụ cuối ngày kế tiếp (phát `<MOD>.IN.RECONCILE.BLOCK_EOD>`)
And hiển thị MSG-ERR-IN-027
```

## UC-I29: Kiểm tra dữ liệu — Liên trường

**Mô tả:** Kiểm tra tính nhất quán giữa các trường trong bản ghi.

```gherkin
Given bản ghi đang ở trạng thái VALIDATING
When tổng chi tiết khác tổng tiêu đề
Then trả lỗi MSG-ERR-IN-023

When ngày phát sinh lớn hơn ngày tiếp nhận
Then trả lỗi MSG-ERR-IN-023

When mã đối tác không khớp mã giao dịch
Then trả lỗi MSG-ERR-IN-023
```

## UC-I30: Kiểm tra dữ liệu — Kỳ kế toán

**Mô tả:** Bản ghi thuộc kỳ kế toán đã đóng.

```gherkin
Given bản ghi đang ở trạng thái VALIDATING
When phát hiện ngày phát sinh thuộc kỳ kế toán đã đóng
Then trả lỗi MSG-ERR-IN-025
And không ghi vào bảng chính
```

## UC-I31: Kiểm tra dữ liệu — Biên độ giá trị

**Mô tả:** Số tiền vượt biên độ cho phép theo hợp đồng.

```gherkin
Given bản ghi đang ở trạng thái VALIDATING
When phát hiện số tiền/định mức vượt biên độ cho phép
Then trả lỗi MSG-ERR-IN-022
```

## UC-I32: Cảnh báo chứng chỉ sắp hết hạn

**Mô tả:** Chứng chỉ/khoá xác thực sắp hết hạn.

```gherkin
Given chứng chỉ/khoá xác thực còn dưới N ngày trước khi hết hạn
When hệ thống kiểm tra định kỳ
Then phát sự kiện `<MOD>.IN.CERT.EXPIRING>`
And hiển thị cảnh báo MSG-WRN-IN-004
```

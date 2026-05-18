# BDD Use Cases — Outbound (Đẩy dữ liệu ra hệ thống đích)

> Sinh từ `OUTBOUND_spec_function.md`. Mô tả nghiệp vụ bằng Tiếng Việt, từ khóa Given/When/Then bằng tiếng Anh.

---

## UC-O1: Luồng chính — Gửi thành công và nhận xác nhận

**Mô tả:** Bản ghi đủ điều kiện được gửi sang hệ thống đích, đích nhận và xác nhận thành công.

```gherkin
Given bản ghi nghiệp vụ đã được duyệt và ở trạng thái cho phép gửi
And kênh tích hợp tới hệ thống đích đang hoạt động
And chứng chỉ/khoá ký còn hiệu lực
And bảng mapping đã có phiên bản hiệu lực
When hệ thống phát hiện bản ghi đủ điều kiện gửi
Then bản ghi được ghi vào hộp thư đi cùng lúc với bản ghi nghiệp vụ trong cùng giao dịch (BIZ-OUT-01)
And hệ thống chuyển đổi dữ liệu sang định dạng hệ thống đích yêu cầu
And hệ thống kiểm tra dữ liệu thành công (cấu trúc, biên độ, danh mục, ký số)
And hệ thống gửi gói dữ liệu và cập nhật trạng thái → SENDING
And hệ thống đích trả phản hồi sơ bộ (2xx/ack)
And trạng thái cập nhật → SENT, lưu correlationId
When hệ thống nhận callback xác nhận chính thức từ hệ thống đích
Then trạng thái cập nhật → CONFIRMED
And phát sự kiện nội bộ `<MOD>.OUT.CONFIRMED`
And nhật ký ghi đầy đủ: correlationId, hệ thống đích, hash dữ liệu, phản hồi, thời gian, kết quả
```

## UC-O2: Luồng chính — Gửi theo lịch (cuối ngày)

**Mô tả:** Bộ điều phối quét bản ghi đủ điều kiện trong cửa sổ thời gian và gửi theo lô.

```gherkin
Given có bản ghi ở trạng thái READY trong cửa sổ gửi theo lịch
And kênh tích hợp đang hoạt động
When bộ điều phối kích hoạt phiên gửi theo lịch
Then hệ thống gom các bản ghi đủ điều kiện
And hệ thống xử lý từng bản ghi theo luồng chính (UC-O1)
When tất cả bản ghi đã xử lý xong
Then phát sự kiện `<MOD>.OUT.SCHEDULED.DONE`
And cập nhật số liệu giám sát
```

## UC-O3: Gửi lại tự động — Lỗi tạm thời

**Mô tả:** Gửi gặp lỗi tạm thời (mất kết nối, timeout, đích quá tải), hệ thống tự gửi lại theo giãn cách tăng dần.

```gherkin
Given bản ghi ở trạng thái SENDING
And hệ thống đích trả lỗi tạm thời (mất kết nối / timeout / quá tải)
When số lần gửi lại chưa vượt 3
Then trạng thái chuyển về READY
And tăng retryCount
And lập lịch gửi lại theo giãn cách 5s → 15s → 45s
And phát sự kiện `<MOD>.OUT.RETRY`
```

## UC-O4: Gửi lại tự động — Vượt số lần, đẩy hộp lỗi (DLQ)

**Mô tả:** Sau 3 lần gửi lại vẫn lỗi tạm thời, bản ghi được chuyển vào hộp lỗi.

```gherkin
Given bản ghi đã gửi lại 3 lần và vẫn gặp lỗi tạm thời
When retryCount đạt giới hạn (3 lần)
Then trạng thái chuyển → IN_DLQ
And phát sự kiện `<MOD>.OUT.RETRY.EXCEEDED` và `<MOD>.OUT.DLQ.MOVED`
And bản ghi trong DLQ chứa: dữ liệu gốc, lý do lỗi, số lần đã gửi lại
```

## UC-O5: Gửi lại thủ công từ hộp lỗi

**Mô tả:** Vận hành bấm "Gửi lại" trên màn hình hộp lỗi.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
And vận hành có quyền gửi lại (VAL-PH-INT-06)
And số lần gửi lại chưa vượt 3 (VAL-OUT-05)
When vận hành bấm "Gửi lại"
Then hiển thị xác nhận "Bạn có chắc muốn gửi lại?" (MSG-CFM-OUT-001)
When vận hành xác nhận
Then trạng thái chuyển → READY
And phát sự kiện `<MOD>.OUT.REPLAY.MANUAL`
And nhật ký ghi: người thao tác, thời điểm, lý do, kết quả
```

## UC-O6: Gửi lại thủ công — Vượt giới hạn 3 lần

**Mô tả:** Vận hành cố gửi lại khi đã đạt giới hạn 3 lần.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
And replayCount đã đạt 3
When vận hành bấm "Gửi lại"
Then hệ thống từ chối và hiển thị MSG-ERR-OUT-024
And yêu cầu phê duyệt cấp cao hơn hoặc xử lý nghiệp vụ trước
```

## UC-O7: Lỗi vĩnh viễn từ hệ thống đích

**Mô tả:** Hệ thống đích trả lỗi 4xx (dữ liệu sai, logic sai), bản ghi không được tự gửi lại.

```gherkin
Given bản ghi ở trạng thái SENDING
And hệ thống đích trả lỗi 4xx (từ chối nghiệp vụ do dữ liệu/quyền)
Then trạng thái chuyển → FAILED_AT_DEST
And phát sự kiện `<MOD>.OUT.FAILED_AT_DEST`
And đẩy hộp lỗi kèm lý do từ chối chi tiết
And gửi cảnh báo nghiệp vụ
And không tự động gửi lại (BIZ-OUT-03)
```

## UC-O8: Lỗi mapping — Thiếu mã đối tác

**Mô tả:** Không tìm thấy mã đối tác/đơn vị trong bảng mapping khi chuyển đổi dữ liệu.

```gherkin
Given hệ thống đang chuyển đổi dữ liệu sang định dạng đích (bước mapping)
And mã đối tác/đơn vị không có trong bảng mapping
Then bản ghi được đánh dấu THIẾU_MAPPING
And phát sự kiện `<MOD>.OUT.MAPPING.MISSING`
And cảnh báo quản trị tích hợp
And bản ghi bị treo cho đến khi cấu hình mapping xong
```

## UC-O9: Quá hạn chờ xác nhận (Timeout callback)

**Mô tả:** Đã gửi thành công nhưng quá N giờ chưa nhận callback xác nhận.

```gherkin
Given bản ghi ở trạng thái SENT
And đã quá N giờ chưa nhận callback từ hệ thống đích
When hệ thống phát hiện quá hạn
Then trạng thái chuyển → TIMEOUT_AWAITING_CALLBACK
And phát sự kiện `<MOD>.OUT.TIMEOUT`
And kích hoạt luồng tra cứu trạng thái tại đích (UC-O10)
```

## UC-O10: Tra cứu trạng thái tại đích

**Mô tả:** Tra cứu bản ghi quá hạn tại hệ thống đích để xác định kết quả thực tế.

```gherkin
Given bản ghi ở trạng thái TIMEOUT_AWAITING_CALLBACK
When hệ thống gọi tra cứu tại hệ thống đích
And đích báo đã xử lý thành công
Then trạng thái chuyển → CONFIRMED
And phát sự kiện `<MOD>.OUT.STATUS_QUERY` và `<MOD>.OUT.CONFIRMED`

Given bản ghi ở trạng thái TIMEOUT_AWAITING_CALLBACK
When hệ thống gọi tra cứu tại hệ thống đích
And đích báo không có bản ghi
Then trạng thái chuyển → READY
And đẩy lại bản ghi, phát `<MOD>.OUT.REPLAY.AUTO>`

Given bản ghi ở trạng thái TIMEOUT_AWAITING_CALLBACK
When vượt thời hạn xử lý tối đa
Then trạng thái chuyển → IN_DLQ
```

## UC-O11: Ngắt mạch tự động (Circuit Breaker)

**Mô tả:** Lỗi liên tiếp với một đích vượt ngưỡng, kênh tự tạm dừng.

```gherkin
Given số lỗi liên tiếp gửi tới hệ thống đích vượt ngưỡng cấu hình
When hệ thống phát hiện vượt ngưỡng
Then kênh tích hợp tự động tạm dừng (circuit breaker mở)
And phát sự kiện `<MOD>.OUT.CIRCUIT.OPENED`
And cảnh báo quản trị
And bản ghi mới giữ ở hộp thư đi, giữ nguyên thứ tự

When khoảng thời gian thử khôi phục đã qua
Then hệ thống thử gửi lại với lưu lượng nhỏ
When gửi thành công
Then kênh khôi phục, phát `<MOD>.OUT.CIRCUIT.CLOSED>`

When gửi vẫn lỗi
Then kênh tiếp tục tạm dừng
```

## UC-O12: Giới hạn tốc độ gửi (Throttle)

**Mô tả:** Gửi vượt tốc độ cho phép của hệ thống đích.

```gherkin
Given tốc độ gửi đang vượt giới hạn (vd > 100 req/giây) của hệ thống đích
When hệ thống phát hiện vượt giới hạn
Then hệ thống giãn nhịp gửi (throttle)
And phát sự kiện `<MOD>.OUT.THROTTLED`
And hiển thị cảnh báo MSG-WRN-OUT-002
And không đẩy hệ thống đích quá tải
```

## UC-O13: Tạm dừng / Mở lại kênh tích hợp

**Mô tả:** Quản trị tạm dừng kênh bảo trì, sau đó mở lại.

```gherkin
Given quản trị có quyền thao tác kênh tích hợp
When quản trị chọn tạm dừng kênh
Then hiển thị xác nhận (MSG-CFM-OUT-002)
When quản trị xác nhận
Then kênh chuyển sang trạng thái tạm dừng
And các bản ghi READY chuyển → PAUSED
And phát sự kiện `<MOD>.OUT.PAUSE`
And nhật ký ghi: người thao tác, thời điểm, lý do

Given kênh đang tạm dừng
When quản trị chọn mở lại kênh
Then hiển thị xác nhận (MSG-CFM-OUT-004)
When quản trị xác nhận
Then kênh mở lại, phát sự kiện `<MOD>.OUT.RESUME`
And bản ghi PAUSED chuyển → READY, giữ thứ tự
And hiển thị MSG-INF-OUT-004
```

## UC-O14: Đối soát cuối ngày — Khớp

**Mô tả:** Đối soát số lượng + tổng giá trị gửi với báo cáo của hệ thống đích, kết quả khớp.

```gherkin
Given đã đến thời điểm đối soát cuối ngày
And hệ thống đã tổng hợp số lượng + tổng giá trị + checksum tất cả bản ghi đã gửi
When đối chiếu với báo cáo từ hệ thống đích
And số liệu khớp hoàn toàn
Then phát sự kiện `<MOD>.OUT.RECONCILE.MATCH`
And hiển thị MSG-OK-OUT-003
And cập nhật số liệu giám sát
```

## UC-O15: Đối soát cuối ngày — Chênh lệch

**Mô tả:** Phát hiện chênh lệch khi đối soát, chặn nghiệp vụ cuối ngày.

```gherkin
Given đã đến thời điểm đối soát cuối ngày
When đối chiếu với báo cáo từ hệ thống đích
And phát hiện chênh lệch (số lượng hoặc tổng giá trị)
Then phát sự kiện `<MOD>.OUT.RECONCILE.MISMATCH`
And sinh báo cáo chênh lệch chi tiết
And gửi cảnh báo cho vận hành
And chặn nghiệp vụ cuối ngày tiếp theo (phát `<MOD>.OUT.RECONCILE.BLOCK_EOD>`)
And hiển thị MSG-ERR-OUT-026
```

## UC-O16: Đối soát chi tiết với ngân hàng

**Mô tả:** So khớp dữ liệu đã hạch toán với báo cáo từ hệ thống đích.

```gherkin
Given có báo cáo chi tiết từ hệ thống đích báo về
When hệ thống so khớp từng bản ghi đã hạch toán với báo cáo
Then sinh báo cáo chênh lệch nếu có
And gửi cảnh báo nếu phát hiện sai lệch
```

## UC-O17: Đối soát lãi/phí cuối kỳ

**Mô tả:** Cuối tháng, so khớp dữ liệu lãi/phí đã ghi nhận.

```gherkin
Given đã đến cuối kỳ (cuối tháng)
And có báo cáo lãi/phí từ hệ thống đích báo về
When hệ thống so khớp dữ liệu lãi/phí đã ghi nhận
Then sinh báo cáo chênh lệch nếu có
And gửi cảnh báo nếu phát hiện sai lệch
```

## UC-O18: Kiểm tra dữ liệu trước khi gửi — Lỗi

**Mô tả:** Dữ liệu không vượt qua bước kiểm tra trước khi gửi.

```gherkin
Given hệ thống đang kiểm tra dữ liệu trước khi gửi (bước 4)
When phát hiện trường bắt buộc rỗng
Then trả lỗi MSG-ERR-OUT-001, không gửi

When phát hiện trường số sai định dạng
Then trả lỗi MSG-ERR-OUT-002, không gửi

When phát hiện ngày không hợp lệ hoặc ngoài kỳ kế toán
Then trả lỗi MSG-ERR-OUT-003, không gửi

When phát hiện trường vượt độ dài tối đa
Then trả lỗi MSG-ERR-OUT-004, không gửi

When phát hiện giá trị không tồn tại trong danh mục
Then trả lỗi MSG-ERR-OUT-005, không gửi

When phát hiện cấu trúc gói không khớp phiên bản đích
Then trả lỗi MSG-ERR-OUT-020, không gửi

When phát hiện giá trị ngoài biên độ cho phép
Then trả lỗi MSG-ERR-OUT-021, không gửi

When tổng chi tiết khác tổng tiêu đề hoặc ngày không hợp lệ
Then trả lỗi MSG-ERR-OUT-022, không gửi
```

## UC-O19: Gửi theo tệp lô

**Mô tả:** Gom N bản ghi vào tệp, ký + nén, đẩy lên thư mục hệ thống đích.

```gherkin
Given có bản ghi READY cần gửi theo chế độ tệp lô
When bộ điều phối gom N bản ghi vào 1 tệp
Then hệ thống ký số và nén tệp nếu cần
And đẩy tệp lên thư mục hệ thống đích
And phát sự kiện `<MOD>.OUT.BATCH.FILE_PUSHED`
And cập nhật trạng thái các bản ghi → SENT
```

## UC-O20: Huỷ bản ghi từ hộp lỗi

**Mô tả:** Vận hành chọn bỏ qua (ack-skip) bản ghi trong hộp lỗi.

```gherkin
Given bản ghi ở trạng thái IN_DLQ
When vận hành chọn "Bỏ qua" (ack-skip)
Then hiển thị xác nhận (MSG-CFM-OUT-003)
When vận hành xác nhận
Then trạng thái chuyển → CANCELLED
And ghi lý do bỏ qua
And cập nhật đối soát
```

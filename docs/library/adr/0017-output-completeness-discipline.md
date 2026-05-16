# ADR-0017: Kỷ luật tính đầy đủ của đầu ra — triệt tiêu phỏng đoán, triệt tiêu ảo giác

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** SA (dẫn dắt), tất cả các vai trò
- **Thẻ:** chất-lượng, prompt, linter, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

ADR-0009 đã giới thiệu cite-or-die (R1001) và no-TBD (R0103). Những quy tắc này ngăn chặn các ảo giác và placeholder nghiêm trọng nhất. Chúng cần thiết nhưng chưa đủ — các khoảng trống quan sát được:

- **Cụm từ lảng tránh mơ hồ** sống sót qua cite-or-die: "hệ thống sẽ hiệu năng tốt," "chúng ta sử dụng bộ nhớ đệm phù hợp," "lỗi được xử lý khéo léo"
- **Giả định ngầm** lan truyền: thiết kế bỏ sót một mục mà vai trò tiếp theo cần, vai trò đó phải hỏi ngược lại; lãng phí một vòng lặp
- **Cụm từ mơ hồ nhẹ** cho phép agent phát ra đầu ra nghe có vẻ tự tin mà người đọc hạ lưu diễn giải khác nhau
- **Các mục bị thiếu nhưng không bắt buộc** không vi phạm quy tắc linter (vốn chỉ kiểm tra các mục bắt buộc)
- **Sự mơ hồ về số học** vẫn tồn tại: "độ trễ thấp" thay vì "p95 <200ms"; "độ sẵn sàng cao" thay vì "99.9% (ngân sách 43 phút/tháng)"

Khẳng định của hệ thống là "không thiếu sót / không mâu thuẫn / không chồng chéo về vai trò / phạm vi / nhiệm vụ." Tính đầy đủ là nền tảng của "không thiếu sót." Đầu ra mơ hồ là **thiếu một nửa** — từ ngữ tồn tại nhưng thông tin thì không.

## Quyết định

Áp dụng **Kỷ luật tính đầy đủ của đầu ra** như một nguyên tắc xuyên suốt, với ba lớp ép buộc:

### Lớp 1 — Boilerplate prompt agent (tất cả bản mẫu prompt)

Mọi bản mẫu prompt đều có mục bắt buộc `## Hợp đồng chống ảo giác + tính đầy đủ`:

```markdown
## Hợp đồng chống ảo giác + tính đầy đủ

Trước khi phát ra đầu ra, bạn PHẢI:

1. **Trích dẫn mọi tuyên bố thực tế** đến một nguồn cụ thể (id ADR + sha; trích dẫn bên liên quan + timestamp;
   tham chiếu tiêu chuẩn; mục sản phẩm bàn giao tiền nhiệm). Không tuyên bố nào không có trích dẫn.
2. **Thay thế cụm từ lảng tránh bằng phép đo cụ thể**:
   - "hiệu năng tốt" -> mục tiêu độ trễ/thông lượng cụ thể ("p95 <200ms ở 100 RPS")
   - "có thể mở rộng" -> mục tiêu quy mô cụ thể ("10K gói cước trong <30 phút")
   - "an toàn" -> kiểm soát cụ thể ("bearer token OIDC; CSP `default-src 'self'`")
   - "thân thiện với người dùng" -> tiêu chí UX cụ thể ("<3 lần click để đổi gói cước; luồng chỉ dùng bàn phím khả thi")
3. **Cấm các cụm từ mơ hồ nhẹ**: "obvious", "should", "as appropriate", "where applicable",
   "etc.", "and so on", "tbd", "todo", "lorem ipsum", "to be determined", "later".
   Nếu không thể tránh, xuất `<<MISSING-INFO: <cái_gì>>>` thay thế và tạo
   `escalations/incomplete-input.md`.
4. **Tự xác minh trước khi phát ra**: đọc lại đầu ra của bạn theo danh sách kiểm tra trong mục
   `## Danh sách kiểm tra tính đầy đủ đầu ra` của bản mẫu prompt. Nếu bất kỳ mục nào thất bại, khắc phục hoặc leo thang.
5. **Không bịa đặt**: nếu một thông tin không có trong ngữ cảnh của bạn, KHÔNG tạo ra nó. Xuất `<<MISSING-INFO>>`
   và leo thang.
```

### Lớp 2 — Danh sách kiểm tra tính đầy đủ cho từng sản phẩm bàn giao (trong mỗi bản mẫu sản phẩm)

Mỗi bản mẫu sản phẩm bàn giao bao gồm mục `## Danh sách kiểm tra tính đầy đủ đầu ra` mà agent tác giả (và người soát xét) xác minh trước khi trạng thái: Đang soát xét:

```markdown
## Danh sách kiểm tra tính đầy đủ đầu ra (KHÔNG THƯƠNG LƯỢNG)

- [ ] Mọi tiêu đề mục đều có mặt (không bỏ sót mục); các mục trống được đánh dấu
      `Not Applicable` kèm lý do, không bao giờ để trống
- [ ] Mọi tuyên bố thực tế đều trích dẫn nguồn
- [ ] Không có cụm từ lảng tránh bị cấm (kiểm tra regex bởi linter R0230)
- [ ] Mọi yêu cầu có thể đo lường đều có mục tiêu có thể đo lường (đơn vị, ngưỡng)
- [ ] Mọi tham chiếu chéo đều hợp lệ (đường dẫn tồn tại, anchor hợp lệ)
- [ ] Mọi phụ thuộc được khai báo trong front-matter (`predecessors`, `applies_adrs`,
      `applies_policies`, `applies_standards`)
- [ ] Không còn đánh dấu `<<MISSING-INFO>>` nào (leo thang nếu có)
- [ ] Người soát xét có thể hoàn thành công việc của họ sử dụng CHỈ sản phẩm bàn giao này + các sản phẩm
      tiền nhiệm đã khai báo (không cần ngữ cảnh ngầm)
```

### Lớp 3 — Họ quy tắc linter mới R0230-R0239 (cụm từ lảng tránh bị cấm + tính đầy đủ)

| Quy tắc | Mô tả                                                                              | Nghiêm trọng |
| ------- | ---------------------------------------------------------------------------------- | ------------ |
| R0230   | Cụm từ lảng tránh bị cấm (regex theo enum khóa)                                   | error        |
| R0231   | Mơ hồ số học (regex: "low/high/fast/slow" không có phép đo gần đó)                | warn         |
| R0232   | Mọi tiêu đề mục từ manifest bản mẫu đều có mặt                                     | error        |
| R0233   | Không có đánh dấu `<<MISSING-INFO>>` trong `status: In Review` hoặc sau đó         | error        |
| R0234   | Mục tự xác minh sản phẩm bàn giao đã được điền (danh sách kiểm tra trên, đã đánh dấu) | warn      |
| R0235   | Khẳng định "Người soát xét có thể hoàn thành chỉ dùng sản phẩm này + tiền nhiệm" đã được xác minh | advisory |

### Các cụm từ lảng tránh bị cấm (enum khóa, R0230)

```yaml
forbidden_hedges:
  - "obvious"
  - "should be" # dùng "must" hoặc kết quả cụ thể
  - "as appropriate"
  - "where applicable"
  - "etc."
  - "and so on"
  - "tbd"
  - "todo"
  - "lorem ipsum"
  - "to be determined"
  - "later" # phụ thuộc ngữ cảnh; cho phép trong mục "các bản sửa đổi tương lai"
  - "user-friendly" # dùng tiêu chí UX cụ thể
  - "performant" # dùng mục tiêu hiệu năng cụ thể
  - "scalable" # dùng mục tiêu quy mô cụ thể
  - "robust" # dùng độ bao phủ chế độ lỗi cụ thể
  - "industry-standard" # trích dẫn tiêu chuẩn cụ thể
  - "best practice" # trích dẫn nguồn cụ thể
```

Danh sách có thể điều chỉnh; việc bổ sung cần tuân theo vòng đời ADR-0005 (phân tầng nghiêm trọng với `enforce_after`).

### Mở rộng reviewer agent với trọng tâm tính đầy đủ

Các agent `@claude-code-reviewer` và `@claude-architect-reviewer` hiện có (theo ADR-0011) được cập nhật prompt: danh mục kết quả của họ giờ bao gồm `completeness-gap` (danh mục fingerprint kết quả mới) ánh xạ đến R0230-R0234.

Một chuyên môn reviewer mới:

- `@claude-completeness-reviewer` — nhiệm vụ duy nhất là xác minh danh sách kiểm tra tính đầy đủ, quét regex tìm cụm từ lảng tránh, và kiểm chứng "vai trò hạ lưu có thể sử dụng mà không cần hỏi ngược lại."

## Hệ quả

### Tích cực

- Đầu ra cụ thể, có thể đo lường trở thành mặc định — không còn "sẽ hiệu năng tốt"
- Các vai trò hạ dựng ít thời gian hỏi ngược lại hơn; thời gian thực tế mỗi tính năng giảm
- Phân kỳ vòng lặp giảm (kết quả cụ thể -> dễ khắc phục dứt khoát)
- Chuỗi kiểm toán mạnh hơn — mọi tuyên bố đều được trích dẫn
- Ảo giác xuất hiện dưới dạng đánh dấu `<<MISSING-INFO>>` thay vì bịa tạo nghe có vẻ tự tin

### Hạn chế / Chi phí

- Viết tác phẩm mất nhiều thời gian hơn — bản nháp đầu tiên không còn dựa vào cụm từ lảng tránh
- Tăng ~10-20% token prompt mỗi lần gọi agent (boilerplate)
- Nhiều leo thang `incomplete-input` hơn trong giai đoạn đầu áp dụng (sẽ giảm khi sản phẩm thượng nguồn chặt hơn)
- Enum cụm từ lảng tránh bị cấm cần bảo trì khi xuất hiện mẫu mơ hồ mới

### Trung tính

- Khẳng định "Người soát xét có thể hoàn thành chỉ dùng sản phẩm này + tiền nhiệm" cố ý rất mạnh; một số sản phẩm cần siết chặt tiền nhiệm để thỏa mãn
- Quy tắc mơ hồ số học (R0231) mang tính heuristic; điều chỉnh tỷ lệ dương tính giả trong tháng đầu tiên

## Các phương án đã cân nhắc

### A. Chỉ tăng cường cite-or-die (mở rộng R1001) — Bị loại bỏ

Không phát hiện được mơ hồ số học hoặc cụm từ lảng tránh nhẹ; không ép buộc danh sách kiểm tra tính đầy đủ.

### B. Chỉ ép buộc qua reviewer (không có linter) — Bị loại bỏ

Reviewer bỏ sót ở quy mô lớn; nguyên tắc phòng thủ chiều sâu của ADR-0009 nói phát hiện chỉ là một lớp.

### C. Bỏ qua; tin tưởng prompt — Bị loại bỏ

Không có ép buộc, boilerplate prompt bị loại bỏ trong các chỉnh sửa nhanh.

## Liên kết liên quan

- ADR-0001 — Thư mục theo tính năng + file theo sản phẩm bàn giao
- ADR-0009 — Phòng thủ chiều sâu (họ R được mở rộng)
- ADR-0011 — Nhận dạng agent lai (`@claude-completeness-reviewer` gia nhập danh sách)
- ADR-0013 — Cấu trúc liên kết vòng lặp agent (`completeness-gap` gia nhập enum danh mục kết quả)
- Tất cả bản mẫu prompt được cập nhật để bao gồm mục hợp đồng

## Ghi chú cho lần xem xét sau

- **Enum cụm từ lảng tránh bị cấm** tiến hóa; xem xét hàng quý về dương tính giả + mẫu mới
- **R0231 mơ hồ số học** là khó ép buộc nhất — bắt đầu advisory, siết chặt khi tích lũy dữ liệu
- **Quy ước đánh dấu `<<MISSING-INFO>>`** phải được tôn trọng bởi tất cả agent tác giả (cần cập nhật prompt trên tất cả bản mẫu prompt hiện có như một lần di chuyển)
- **Bước tự xác minh** có thể được tự kiểm tra một phần bởi linter (R0234); con người vẫn quyết định các mục cần phán đoán

# ADR-0015: Dữ liệu kiểm thử là sản phẩm bàn giao hạng nhất (`08-test-data.md`)

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** QA (dẫn dắt), DBA (đồng sở hữu), UI/UX, Bảo mật (tuân thủ PII)
- **Thẻ:** kiểm-thử, dữ-liệu, kỷ-luật-qa
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

MVP TT.OUT.MANUAL hiện tại có dữ liệu kiểm thử rải rác ở ba nơi:

1. `migrations/forward/0002_seed.sql` — dữ liệu gieo tối thiểu (2 gói cước + 1 khách hàng)
2. Factory nội tuyến trong `tests/integration/main_test.go` — chỉ khả dụng cho kiểm thử tích hợp
3. Thân bài kiểm thử tạm thời — bị trùng lặp, không xác định

Hệ quả:

- T-PERF-001 ("10K gói cước trong <30 phút") có trong kế hoạch kiểm thử nhưng **không thể chạy** — không có dữ liệu khối lượng lớn
- Frontend (được thêm trong ADR-0014) không có gì để render — không có dữ liệu demo UI
- Kiểm thử dựa trên thuộc tính / fuzz vắng mặt — tính toàn vẹn state-machine chỉ được kiểm tra điểm
- An toàn PII chỉ là nhận xét, không được ép buộc — nguy cơ dữ liệu có hình dạng thật rò rỉ vào fixtures

Năm lớp dữ liệu riêng biệt phục vụ các mục đích kiểm thử khác nhau:

| #   | Lớp                         | Mục đích sử dụng                                                      |
| --- | --------------------------- | --------------------------------------------------------------------- |
| 1   | Fixtures tham chiếu         | Golden tests, so sánh ảnh chụp, tài liệu                              |
| 2   | Factory                     | Kiểm thử đơn vị + tích hợp                                            |
| 3   | Bộ sinh dựa trên thuộc tính | Kiểm thử bất biến (tính toàn vẹn state-machine, lũy đẳng, bất biến audit) |
| 4   | Dữ liệu khối lượng tổng hợp | Kiểm thử hiệu năng                                                    |
| 5   | Dữ liệu demo UI             | Ảnh chụp, soát xét thiết kế, QA thủ công, demo bán hàng               |

(Lớp thứ 6 — ảnh chụp ẩn danh từ sản xuất — nằm ngoài phạm vi cho đến khi có môi trường sản xuất.)

## Quyết định

Áp dụng **`08-test-data.md` là sản phẩm bàn giao thứ 8 hoặc thứ 9 trong vòng đời** (sau `07-ui-spec` theo ADR-0014). RACI chung QA+DBA; đưa vào có điều kiện (bỏ qua với `Not Applicable` khi tính năng không ảnh hưởng đến schema).

### Quyền sở hữu các mục trong `08-test-data.md`

| Mục                              | Chủ sở hữu (R)        | Người soát xét     |
| -------------------------------- | --------------------- | ------------------ |
| Fixtures tham chiếu              | DBA                   | QA                 |
| Factory                          | QA                    | DBA                |
| Bộ sinh dựa trên thuộc tính      | QA                    | DBA                |
| Dữ liệu khối lượng tổng hợp      | DBA                   | QA                 |
| Dữ liệu demo UI                  | UI/UX                 | QA + DBA           |
| An toàn PII + hợp đồng linter    | Bảo mật (tư vấn)      | QA (R)             |

### Cam kết công cụ (hệ sinh thái Java)

| Mối quan tâm             | Lựa chọn                                          |
| ------------------------ | ------------------------------------------------- |
| Dữ liệu giả              | **gofakeit** (Java gốc, xác định bằng seed)       |
| Dựa trên thuộc tính      | **JUnit 5** (trưởng thành; được sử dụng nhiều nhất trong Java) |
| Sinh khối lượng          | **psql `COPY FROM stdin`** cho tốc độ thô         |
| Demo UI (E2E)            | Gieo DB qua `scripts/seed-demo.sh`                |
| Demo UI (mức component)  | **MSW (Mock Service Worker)** trong frontend      |

### Bố cục file (trong kho mã nguồn)

```
internal/testdata/
├── fixtures/        # Lớp 1: UUID ổn định, instance vàng
├── factory/         # Lớp 2: tham số hóa, có thể gieo seed
└── property/        # Lớp 3: bộ sinh JUnit 5

scripts/
├── seed.sh          # Lớp 1 + gieo phát triển
├── seed-volume.sh   # Lớp 4: 10K gói cước (NFR-3.2.2)
└── seed-demo.sh     # Lớp 5: 50/200/500/1000 (thân thiện frontend)

frontend/src/mocks/  # Lớp 5 (mức component): handler MSW
```

### Hợp đồng tính xác định

Tất cả bộ sinh factory + property + khối lượng đều nhận một seed (mặc định là hash tên kiểm thử). Cùng seed ra cùng kết quả. Quan trọng cho:

- Khả năng tái hiện lỗi kiểm thử
- Tính nhất quán hai lần chạy (ADR-0009 R1005)
- Phát hiện phân kỳ vòng lặp (ADR-0013) — sinh ngẫu nhiên lại sẽ tạo phân dương tính giả

### Ép buộc an toàn PII (quy tắc linter mới)

**`R0210` — An toàn PII trên đường dẫn kiểm thử**:

- Các file khớp `**/testdata/**`, `**/fixtures/**`, `**/seeds/*`, `**/mocks/*` không được chứa:
  - Mẫu email ngoài TLD `*.example` / `*.test`
  - Chuỗi có dạng số điện thoại (regex)
  - Chuỗi có dạng SSN (regex)
  - Chuỗi có dạng thẻ tín dụng (Luhn-dương)
- Mức nghiêm trọng: **error từ Phase 0** (rủi ro tuân thủ; không cần giai đoạn mềm)
- Bỏ qua: miễn trừ rõ ràng theo vòng đời ADR-0005 (`linter_waivers:` trong front-matter kèm lý do + hạn sử dụng)

`R0207` (hiện có) bao phủ đường dẫn sản xuất; `R0210` bao phủ đường dẫn kiểm thử.

## Hệ quả

### Tích cực

- Khả năng tái hiện: tính xác định có seed giúp lỗi kiểm thử có thể gỡ lỗi.
- T-PERF-001 trở nên có thể chạy (10K gói cước qua `seed-volume.sh`).
- Frontend có dữ liệu demo đầy đủ -> có thể chụp ảnh màn hình.
- Kiểm thử dựa trên thuộc tính tìm ra các trường hợp biên mà kiểm thử do con người viết bỏ sót.
- Ép buộc PII ngăn dữ liệu có hình dạng thật rò rỉ vào fixtures.

### Hạn chế / Chi phí

- Mỗi tính năng tốn khoảng ~$30-80 chi phí agent cho factory + fixture + bộ sinh property.
- Khó khăn học JUnit 5 giữa dự án cho đội QA (được giảm nhẹ bằng mẫu `prompts/qa-author-property-tests.md`).
- Script gieo khối lượng thêm ~30 giây vào CI khi chạy.

### Trung tính

- 5 lớp không phải đều áp dụng cho mọi tính năng; các mục có điều kiện (status: Not Applicable) là chấp nhận được.
- gofakeit + JUnit 5 được ghim trong MVP; xem xét lại nếu hệ sinh thái kiểm thử thay đổi.

## Các phương án đã cân nhắc

### A. Nhẹ hơn: chỉ 3 lớp (fixtures + factory + khối lượng) — Bị loại bỏ

Mất khả năng phát hiện fuzz dựa trên thuộc tính và dữ liệu demo UI; cắt giảm đánh bại mục đích.

### B. Không tạo sản phẩm mới: tài liệu hóa bên trong `04-test-plan.md` — Bị loại bỏ

Mất RACI chung QA+DBA; mất mục tiêu ép buộc linter R0210; giảm khả năng hiển thị.

### C. Bỏ qua; giữ nguyên trạng thái phân tán hiện tại — Bị loại bỏ

Hoãn vấn đề; MVP hiện tại đã thể hiện các lỗi này.

## Liên kết liên quan

- ADR-0001 — Thư mục theo tính năng
- ADR-0009 — Phòng thủ chiều sâu (R0210 gia nhập họ R; tính xác định hỗ trợ R1005 nhất quán hai lần chạy)
- ADR-0011 — Nhận dạng agent lai (factory hỗ trợ khả năng tái hiện cho kiểm thử hành vi)
- ADR-0014 — Vai trò UI/UX (dữ liệu demo thúc đẩy ảnh chụp frontend)
- ADR-0016 — Chiến lược kiểm thử UI (factory + fixture được sử dụng bởi Vitest + Playwright)

## Ghi chú cho lần xem xét sau

- **Thư viện dữ liệu giả** (gofakeit) — xem xét lại nếu hệ sinh thái Java hội tụ quanh giải pháp thay thế.
- **Thư viện dựa trên thuộc tính** (JUnit 5) — `rapid` mới hơn; xem xét lại trong 1-2 năm.
- **Mẫu regex PII** — mở rộng khi xuất hiện các lớp mẫu mới (ví dụ: số hộ chiếu nếu phạm vi tuân thủ mở rộng).
- **Ảnh chụp ẩn danh từ sản xuất** (lớp thứ 6) — thiết kế khi triển khai sản xuất đầu tiên đi vào hoạt động.

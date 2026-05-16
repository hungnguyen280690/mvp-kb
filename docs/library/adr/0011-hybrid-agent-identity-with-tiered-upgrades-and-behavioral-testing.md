# ADR-0011: Định danh Agent lai với nâng cấp phân tầng và kiểm thử hành vi

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** DevOps (dẫn dắt), SA, Bảo mật, các chủ sở hữu vai trò
- **Thẻ:** agent, vòng-đời, phiên-bản, phát-hiện-trôi-dạt
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Trong hệ thống SDLC truyền thống, con người không có số phiên bản. Agent thì có — và chúng thay đổi theo nhịp độ mà chúng ta không kiểm soát được. Các sự kiện cụ thể mà hệ thống phải xử lý:

- Anthropic ra mắt Opus 4.8; `@claude-opus-reviewer` hiện tại đang cố định ở 4.7.
- zAI ngừng hỗ trợ GLM-4 để thay bằng GLM-5.
- Một Agent chuyên biệt mới được đề xuất (ví dụ: `@claude-opus-incident-investigator`).
- Nhà cung cấp âm thầm cập nhật trọng số mô hình mà không đổi số phiên bản.

Nếu không quản trị, sẽ nảy sinh ba lỗi:

1. **Trôi dạt khả năng âm thầm**: Quy trình hoạt động tốt vào thứ Ba nhưng bị hỏng vào thứ Năm mà không rõ nguyên nhân.
2. **Biến động danh sách**: Nếu mỗi phiên bản là một định danh mới, file `OWNERS.md` sẽ phải cập nhật hàng tuần.
3. **Mất tính liên tục của định danh**: 6 tháng sau không thể tái lập được mô hình nào đã viết ra sản phẩm này — cơn ác mộng của kiểm toán.

## Quyết định

Áp dụng **mô hình định danh lai hai cấp độ** kết hợp với **luồng nâng cấp phân tầng** và **kiểm thử hành vi dựa trên file mẫu (golden-file)**.

### Định danh hai cấp độ

| Cấp độ                                    | Vị trí lưu trữ                       | Tính ổn định                    |
| :---------------------------------------- | :----------------------------------- | :------------------------------ |
| **Agent Logic** (`@claude-opus-reviewer`) | OWNERS.md, RACI, cẩm nang vai trò    | Ổn định qua các phiên bản       |
| **Phiên bản Mô hình** (`claude-opus-4-7`) | `agent-roster.md`, khai báo đầu file | Cố định tại thời điểm thực hiện |

Khai báo đầu file ghi nhận cả hai:

```yaml
authors:
  agents:
    - handle: claude-opus-reviewer # định danh logic ổn định
      model_at_authorship: claude-opus-4-7 # cố định phiên bản
```

### Bốn luồng vòng đời

**Luồng 1 — Tiếp nhận Agent mới**
Tương tự như tiếp nhận nhân sự mới (quan sát → thực hiện dưới giám sát):

1. **ADR đề xuất** — nêu khoảng trống năng lực, chi phí-lợi ích.
2. **Đánh giá Sandbox** (~1 tuần) — chạy các bộ kiểm thử hành vi mẫu.
3. **Thử nghiệm (Pilot)** — áp dụng cho 1 tính năng duy nhất, con người soát xét sâu mọi PR.
4. **Phát hành chính thức** — cập nhật danh sách Agent.

**Luồng 2 — Nâng cấp phiên bản mô hình (thường xuyên nhất)**

- **Nâng cấp lớn (Major)**: Quy trình như tiếp nhận Agent mới.
- **Nâng cấp nhỏ (Minor)**: Vượt qua các bài kiểm thử hành vi + chạy song song 1 tuần.

**Luồng 3 — Ngừng hỗ trợ (Deprecation)**
Khi Agent bị lỗi thời, tốn kém hoặc có lỗi hệ thống:

- Đánh dấu trạng thái `deprecated_at:`.
- Ma trận xử lý sản phẩm cũ: Sản phẩm Hạn chế/Bảo mật phải được viết lại bởi người hoặc Agent mới; sản phẩm Nội bộ chỉ cần xác nhận lại khi có thay đổi lớn.

### Phát hiện trôi dạt khả năng

1. **Kiểm thử hành vi hàng đêm**: Chạy lại các prompt chuẩn và so sánh cấu trúc đầu ra với "file mẫu".
2. **Dấu vân tay đầu ra (Fingerprinting)**: Theo dõi độ dài, tỷ lệ trích dẫn, tỷ lệ ảo giác để phát hiện thay đổi đột ngột từ nhà cung cấp.

## Hệ quả

### Tích cực

- Tính liên tục: `OWNERS.md` và RACI không bị xáo trộn mỗi khi mô hình cập nhật.
- Tính tái lập: Mọi sản phẩm cũ đều ghi chính xác phiên bản mô hình đã tạo ra nó.
- Phát hiện sớm các thay đổi âm thầm từ nhà cung cấp trước khi chúng làm hỏng hệ thống.

### Hạn chế / Chi phí

- Đòi hỏi xây dựng khung kiểm thử hành vi và duy trì các file mẫu (golden files).
- Các bài kiểm thử hành vi không thể so sánh khớp 100% văn bản (do tính ngẫu nhiên), nên việc viết logic so sánh cấu trúc sẽ phức tạp hơn.

## Liên kết liên quan

- **ADR-0006** — Quy tắc A-luôn-là-người (được duy trì qua các phiên bản).
- **ADR-0007** — Ghi nhận đầy đủ nguồn gốc (trường `model_at_authorship`).
- **ADR-0009** — Phòng thủ chiều sâu (trôi dạt khả năng là một loại lỗi).
- **ADR-0012** — Quản trị FinOps (theo dõi chi phí thay đổi theo phiên bản).

# ADR-0008: Ma trận phê duyệt phân tầng với cơ chế chống lặp và ưu tiên dựa trên rủi ro

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA), Bảo mật, DevOps, tham vấn tất cả các vai trò
- **Thẻ:** agent, cổng-soát-xét, luồng-công-việc, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Mô hình soát xét của SDLC cơ bản giả định: PR được mở → người soát xét được chỉ định phê duyệt → trộn mã nguồn (merge). Việc thêm Agent tạo ra bốn tình huống, trong đó chỉ có một tình huống là an toàn mặc định:

| Tác giả   | Người soát xét | Độ an toàn mặc định                                          |
| :-------- | :------------- | :----------------------------------------------------------- |
| Agent     | Con người      | ✅ Chuẩn: "AI hỗ trợ, con người phê duyệt"                   |
| Con người | Agent          | ⚠️ Agent tìm lỗi nhưng không nên thay thế con người soát xét |
| Agent     | Agent          | ❌ Nguy hiểm: Vòng lặp tự động trộn mã nguồn                 |
| Con người | Con người      | ✅ Quy tắc đã có từ trước                                    |

Tính năng bảo vệ nhánh của GitHub không phân biệt được các thực thể này. Nó chỉ đếm số lượt phê duyệt — nếu thiết lập "cần 1 lượt phê duyệt", hai Agent có thể tạo thành một vòng lặp kín và tự merge mà không có sự kiểm soát.

Vấn đề thứ hai ở tỷ lệ 30/70: **phép toán không khớp**. Một kỹ sư cao cấp soát xét khoảng 8-12 PR/ngày một cách kỹ lưỡng. Với tỷ lệ Agent 70%, sản lượng đầu ra vượt quá khả năng soát xét. Hoặc con người sẽ phê duyệt "cho xong" ( rubber-stamping), hoặc các PR sẽ bị dồn ứ và năng suất bị kéo xuống mức khả năng của con người.

Hệ thống cần **soát xét có chọn lọc**: con người soát xét những gì quan trọng nhất, giảm bớt sự can thiệp vào các việc thường nhật.

## Quyết định

Áp dụng **ma trận phê duyệt phân tầng được thực thi bởi công cụ kiểm tra (CI check)**, với cơ chế chống lặp và các chế độ soát xét dựa trên rủi ro.

### Quy tắc 1 — Tính bất đối xứng trong việc thay thế phê duyệt

- Một lượt phê duyệt của con người LUÔN LUÔN thỏa mãn bất kỳ yêu cầu phê duyệt nào.
- Một lượt phê duyệt của Agent KHÔNG BAO GIỜ thỏa mãn yêu cầu "cần con người phê duyệt".
- Sự phê duyệt của Agent có thể làm thất bại PR (nếu phát hiện lỗi) nhưng không thể giúp PR đạt đủ số lượng phê duyệt bắt buộc.

### Quy tắc 2 — Cơ chế chống lặp

- Một Agent không thể phê duyệt PR do chính nó là đồng tác giả.
- Một Agent không thể phê duyệt PR do một Agent khác cùng dòng mô hình/nhà cung cấp tạo ra (tránh các điểm mù tương quan).
- Việc soát xét chéo nhà cung cấp (Claude soát xét GLM và ngược lại) được khuyến khích nhưng vẫn không thay thế được lượt phê duyệt của con người.

### Quy tắc 3 — Yêu cầu phê duyệt theo tầng sản phẩm

| Loại sản phẩm                   | Tác giả = Agent                                      | Tác giả = Con người               |
| :------------------------------ | :--------------------------------------------------- | :-------------------------------- |
| Sản phẩm Public / Internal      | 1 người (chủ sở hữu vai trò)                         | Theo quy tắc cũ: 1 người đồng cấp |
| Sản phẩm Confidential (Bảo mật) | 2 người (1 người từ Bảo mật)                         | 1 người + 1 vai trò chéo          |
| Sản phẩm Restricted (Hạn chế)   | Agent KHÔNG ĐƯỢC làm vai R                           | 2 người (Bảo mật hoặc DevOps)     |
| ADR (Bất kỳ loại nào)           | Chỉ là bản nháp; merge cần SA + 1 người vai trò chéo | SA phê duyệt                      |
| Tiêu chuẩn / Bản mẫu / Quy tắc  | Chỉ là bản nháp; merge cần DevOps                    | Theo quy tắc cũ                   |
| Danh sách nhân sự / Agent       | KHÔNG ĐƯỢC PHÉP                                      | 2 người (DevOps + SA)             |

### Quy tắc 4 — Các chế độ soát xét dựa trên rủi ro

Công cụ kiểm tra sẽ chỉ định cường độ soát xét khi PR được mở:

1. **Soát xét sâu (Deep review)**: Đọc toàn bộ + nhận xét + có thể yêu cầu thay đổi. Dùng cho: các ADR, sản phẩm Bảo mật/Hạn chế, thay đổi cấu trúc DB, code liên quan đến bảo mật.
2. **Soát xét mẫu (Sample review)**: Các PR của Agent trong các loại ít rủi ro được soát xét sâu theo tỷ lệ lấy mẫu (bắt đầu 100% ở Giai đoạn 1, giảm xuống ~25% ở Giai đoạn 4). Việc chọn mẫu ngẫu nhiên do công cụ thực hiện.
3. **Phê duyệt tự động (Approve-on-green)**: Các thay đổi cơ học thuần túy (cập nhật link, cập nhật mã SHA) được tự động phê duyệt nếu mọi CI xanh VÀ thay đổi khớp với các mẫu an toàn đã biết.

### Quy tắc 5 — Ngưỡng giới hạn tốc độ (Velocity caps)

Trong danh sách Agent:

```yaml
glm-4-air-doc-drafter:
  rate_limit:
    max_open_prs: 5
    max_daily_merges: 20
```

Điều này ngăn chặn tình trạng "lụt" PR (do vô tình hoặc do Agent bị lỗi).

## Hệ quả

### Tích cực

- Tỷ lệ 30/70 trở nên khả thi về mặt toán học — con người tập trung vào thứ quan trọng; việc thường nhật được lấy mẫu hoặc tự động duyệt.
- Loại bỏ được vòng lặp tự động merge của Agent.
- Nhật ký kiểm toán ghi nhận cả cường độ soát xét, không chỉ là sự phê duyệt.

### Hạn chế / Chi phí

- Cần xây dựng CI check tùy chỉnh để phân tích người phê duyệt, đối soát với danh sách và chặn merge.
- Tỷ lệ lấy mẫu cần được điều chỉnh dựa trên dữ liệu thực tế; tỷ lệ sai sẽ gây lãng phí nguồn lực hoặc tạo ra điểm mù.
- Các chế độ tự động duyệt (Approve-on-green) đòi hỏi sự chấp nhận rủi ro từ tổ chức.

## Liên kết liên quan

- **ADR-0004** — Bảo mật hai tầng (các mức độ bảo mật định hướng ma trận phê duyệt).
- **ADR-0006** — Quy tắc A-luôn-là-người (ma trận này thực thi quy tắc đó).
- **ADR-0007** — Ghi nhận đầy đủ nguồn gốc (định danh để đối soát).
- **ADR-0010** — Thiết kế vai trò con người (công việc soát xét là một phần việc của con người).

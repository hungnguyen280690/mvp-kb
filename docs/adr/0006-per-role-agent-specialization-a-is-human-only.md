# ADR-0006: Chuyên môn hóa Agent theo vai trò với quy tắc A-luôn-là-người

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA), Bảo mật, DevOps, tham vấn tất cả các vai trò
- **Thẻ:** agent, vai-trò, trách-nhiệm, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Hệ thống SDLC cơ bản (ADR 0001-0005) giả định rằng tất cả những người tham gia đều là con người. Chúng ta đang áp dụng một lực lượng lao động hỗn hợp Người/AI với tỷ lệ xấp xỉ 30% Người / 70% Agent AI, sử dụng Claude Code (các subagent Sonnet/Opus) và các mô hình zAI GLM.

Có bốn cách để tích hợp Agent vào hệ thống vai trò:

1. **Công cụ do con người sử dụng** — Không có định danh Agent riêng biệt; các thay đổi được ghi nhận cho người thực hiện. **Làm mất đi nguồn gốc** khi tỷ lệ Agent lên tới 70%; chuỗi kiểm toán trở nên vô nghĩa ("Alice đã phê duyệt 40 PR trong Sprint này" trong khi thực tế hầu hết là do Agent viết).
2. **Cùng tham gia với quyền RACI tương đương** — Agent có thể đóng vai trò Chịu trách nhiệm chính (Accountable - A). **Phá vỡ chuỗi kiểm toán** đối với các tiêu chuẩn SOC2/HIPAA/PCI/GDPR; Agent không thể giải trình các quyết định trong các buổi hậu kiểm, không thể trực sự cố (on-call), không thể ký các cam kết pháp lý.
3. **Một vai trò thứ 9 mới mang tên "Agent"** — Quá chung chung. Một Agent kiểm toán bảo mật và một Agent soát xét mã nguồn có khả năng hoàn toàn khác nhau; việc gộp chung họ sẽ làm mất đi mục đích của quyền sở hữu dựa trên vai trò.
4. **Chuyên môn hóa Agent theo vai trò** — Mỗi vai trò hiện có đều có thể được đảm nhận bởi con người, Agent hoặc cả hai. Agent đảm nhận các vị trí R (Thực hiện) hoặc C (Tham vấn); A (Chịu trách nhiệm chính) luôn là con người. **Khớp với cách các subagent của Claude Code thực sự hoạt động** (soát xét mã nguồn, sửa lỗi, tự động hóa kiểm thử, kiểm toán bảo mật là các chuyên môn hóa riêng biệt).

## Quyết định

Áp dụng **chuyên môn hóa Agent theo vai trò** với quy tắc cứng: **Agent có thể đóng vai trò Thực hiện (R) hoặc Tham vấn (C); tuyệt đối không bao giờ đóng vai trò Chịu trách nhiệm chính (A).**

Mỗi vai trò trong 8 vai trò hiện có (PO, BA, SA, DBA, Dev, QA, DevOps, Bảo mật) sẽ có hai mục `humans:` (người) và `agents:` (agent) riêng biệt trong file `OWNERS.md`:

```yaml
dev:
  humans: [@alice]
  agents: [@claude-code-opus, @claude-code-sonnet, @glm-4-air]
dba:
  humans: [@bob]
  agents: [@claude-code-opus]
security:
  humans: [@dave]
  agents: []                    # Quy định rõ: không có agent tự quyết cho công việc Bảo mật mức R
```

Ma trận RACI từ ADR-0001 **không thay đổi**. Chỉ có các tên điền vào vị trí R/C trong `OWNERS.md` mới có thể bao gồm Agent. **Cột A luôn luôn chỉ bao gồm con người từ danh sách `team-roster.md`.**

Công cụ kiểm tra sẽ thực thi: Trường A của mọi sản phẩm bàn giao BẮT BUỘC phải là một nhân sự thuộc loại `kind: employee | contractor` trong `team-roster.md`. Các trường A trỏ đến Agent trong `agent-roster.md` sẽ bị từ chối.

### Tại sao "A luôn luôn là người" là quy tắc không thể thương lượng

1. **Tuân thủ kiểm toán**: Các tiêu chuẩn bảo mật và pháp lý yêu cầu phải định danh được con người chịu trách nhiệm cho các quyết định quan trọng.
2. **Ý nghĩa của hậu kiểm**: Agent thiếu khả năng ghi nhớ tại sao nó lại đưa ra một lựa chọn cụ thể; không thể giải trình hoặc bảo vệ quyết định đó trong một buổi soát xét không đổ lỗi.
3. **Thẩm quyền pháp lý**: Các cam kết hợp đồng, quyết định về nhà cung cấp, chính sách lưu trữ cần một con người có định danh pháp lý.
4. **Trực sự cố (On-call)**: Vai trò A là người sẽ bị gọi lúc 3 giờ sáng nếu có sự cố. Agent không thể trực điện thoại.

## Hệ quả

### Tích cực

- **Mở rộng ADR-0001 một cách tối thiểu** — Không thay đổi cấu trúc sản phẩm bàn giao, ma trận RACI hay sơ đồ thư mục. Chỉ có nội dung `OWNERS.md` được mở rộng.
- **Nguồn gốc thực sự** khi tỷ lệ Agent đạt 70% — Quyền tác giả của mọi sản phẩm đều rõ ràng, không nhập nhằng.
- **Duy trì chuỗi kiểm toán** — Mọi quyết định đều truy xuất được đến một con người cụ thể chịu trách nhiệm.

### Hạn chế / Chi phí

- **Nội dung `OWNERS.md` trở nên dài dòng hơn** — Mỗi vai trò có hai danh sách con (người, agent).
- **Công cụ kiểm tra phải phân biệt được các loại định danh** — Yêu cầu danh sách Agent và danh sách nhân sự là hai nguồn dữ liệu song song.
- **Sự thay đổi về văn hóa** — Các nhóm vốn quen với việc "bất kỳ ai cấp cao đều có thể phê duyệt" phải chuyển sang chế độ bắt buộc vai trò A là con người.

### Trung lập

- Một số vai trò có thể **không có Agent** (ví dụ vai Bảo mật ở trên). Đây là một sự hiệu chuẩn có tính toán cho từng vai trò, không phải là thiếu sót.
- Ma trận RACI vẫn có thể áp dụng cho các nhóm chỉ có con người — việc áp dụng Agent sau này chỉ yêu cầu cập nhật file `OWNERS.md`.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục từng tính năng và từng sản phẩm (cấu trúc mà ADR này làm đầy).
- **ADR-0007** — Ghi nhận đầy đủ nguồn gốc (cơ chế thực thi quy tắc A-luôn-là-người).
- **ADR-0008** — Ma trận phê duyệt phân tầng (các cổng soát xét tuân thủ sự phân biệt vai trò này).
- **ADR-0010** — Thiết kế vai trò con người (những gì con người thực sự làm trong tỷ lệ 30/70).

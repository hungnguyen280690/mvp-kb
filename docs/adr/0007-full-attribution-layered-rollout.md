# ADR-0007: Ghi nhận đầy đủ nguồn gốc (Danh sách Agent + Quy ước định danh + Tác giả ở phần đầu file + Xác nhận của con người + Session log)

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** DevOps (dẫn dắt), Bảo mật, SA, tham vấn tất cả các vai trò
- **Thẻ:** agent, ghi-nhận-nguồn-gốc, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

ADR-0006 quy định rằng trường A của sản phẩm bàn giao chỉ được là con người. **Công cụ kiểm tra không thể thực thi điều đó nếu không có cách cấu trúc để phân biệt con người với Agent** — và hệ thống của chúng ta còn có thêm sự phức tạp sau:

| Bề mặt           | Anthropic Claude Code           | zAI GLM                                   |
| :--------------- | :------------------------------ | :---------------------------------------- |
| Định danh GitHub | Có thể dùng tài khoản OAuth bot | Không có (chỉ dùng API)                   |
| Ghi nhận commit  | Có hỗ trợ `Co-Authored-By`      | Phải được tổng hợp bởi công cụ            |
| Chi phí          | API hiển thị mức sử dụng        | API hiển thị mức sử dụng (định dạng khác) |
| Đa mô hình       | Sonnet vs Opus (4.5/4.6/4.7)    | GLM-4, GLM-4-Air, GLM-4-Plus              |

Nếu không có sự tiêu chuẩn hóa:

- Không thể thực thi quy tắc "A là con người" (công cụ không biết phân biệt `@alice` với `@glm-4-air`).
- Không thể truy vết hiện tượng "ảo giác" của AI (không có liên kết với mô hình/phiên bản/prompt).
- Không thể thống kê chi phí.
- Không thể thực hiện các cuộc kiểm toán tuân thủ (không thể trả lời "ai thực sự đã quyết định X").

Một lỗi phổ biến khi áp dụng tỷ lệ 70/30: **"Phê duyệt tự động" (rubber-stamping)**. Khi khối lượng công việc của Agent quá lớn, con người bị mệt mỏi và phê duyệt mà không thực sự đọc. Hệ thống cần một tín hiệu rõ ràng về sự tham gia của con người vượt lên trên việc chỉ nhấn nút trộn mã nguồn.

## Quyết định

Áp dụng **hệ thống ghi nhận 4 lớp**, được triển khai theo từng giai đoạn tương ứng với các mức độ nghiêm trọng của ADR-0005:

### Lớp 1 — Danh sách Agent (Agent roster)

File `docs-platform/standards/agent-roster.md`:

```yaml
agents:
  claude-opus-reviewer:
    provider: anthropic
    model: claude-opus-4-7
    primary_role: code-review
    capabilities: [architecture, security-heuristic, design-review]
    cost_tier: premium
    permitted_R_for_roles: [Dev, SA]
    permitted_C_for_roles: [DBA, QA, DevOps, Security]
    forbidden_for_roles: [Security-as-R]
    introduced: 2026-05-07
    deprecated: null
```

Công cụ kiểm tra sẽ phân tích file này. Mọi định danh trong `OWNERS.md`, phần khai báo đầu file hoặc nhật ký commit đều phải khớp với một mục trong `team-roster.md` (con người) hoặc `agent-roster.md` (agent). Định danh lạ sẽ bị từ chối.

### Lớp 2 — Quy ước định danh ổn định

`@<nhà_cung_cấp>-<dòng_mô_hình>-<chuyên_môn>` — ví dụ: `@claude-opus-reviewer`, `@claude-sonnet-test-automator`, `@glm-4-air-doc-drafter`.
Phiên bản cụ thể **không nằm trong định danh** (vì sẽ thay đổi hàng tuần) mà nằm trong trường `model:` của danh sách Agent.

### Lớp 3 — Tác giả trong phần khai báo đầu file

```yaml
authors:
  humans: [@alice]
  agents:
    - handle: claude-opus-reviewer
      model_at_authorship: claude-opus-4-7
      session_started: 2026-05-07T14:23:00Z
      contribution: drafted-sections [4, 5], reviewed-all
last_human_read: <mã_sha>
last_human_read_by: @alice
```

**`last_human_read` (lần cuối con người đọc) là trường quan trọng nhất** — nó ghi nhận thời điểm một con người thực sự tương tác với nội dung, phân biệt với việc họ chỉ nhấn nút merge. Công cụ kiểm tra sẽ đánh dấu các sản phẩm có `last_human_read` cũ hơn các thay đổi nội dung mới nhất.

### Lớp 4 — Nhật ký Commit + Mô tả PR

Ghi nhận trong commit:

```
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
Agent-Provider: anthropic
Agent-Handle: claude-opus-reviewer
Agent-Session: <mã_phiên>
Triggered-By: @alice
```

**`Triggered-By` (được kích hoạt bởi) luôn luôn hiện diện và luôn là một định danh con người.**

Tự động thêm vào mô hình PR:

```markdown
## Ghi nhận Agent

- Tác giả: @claude-opus-reviewer, @glm-4-air-doc-drafter
- Kích hoạt bởi: @alice (con người)
- Chi phí token: ~$0.45
- Session log: docs-confidential/agent-sessions/2026-05-07/<hash>.json
```

### Nhật ký phiên (Session logs - theo ADR-0004)

- **Thông tin công khai** (`docs-platform/agent-sessions/...`): Nhà cung cấp, mô hình, số token, thời gian, vai trò; không có nội dung prompt.
- **Nội dung mật** (`docs-confidential/agent-sessions/...`): Nội dung prompt và kết quả thực tế; có rủi ro về PII/bí mật; được quản lý theo chính sách lưu trữ.

## Hệ quả

### Tích cực

- Thực thi về mặt kỹ thuật quy tắc "A là con người".
- Cung cấp nguồn gốc đầy đủ cho việc tính toán chi phí, truy vết ảo giác và kiểm toán tuân thủ.
- `last_human_read` là rào cản cấu trúc chống lại việc phê duyệt tự động khi tỷ lệ Agent cao.
- Hỗ trợ đa nhà cung cấp một cách đồng nhất.

### Hạn chế / Chi phí

- Phần khai báo đầu file trở nên dài dòng hơn.
- Việc lưu trữ nhật ký phiên (đặc biệt là nội dung mật) tốn dung lượng và cần chính sách bảo trì.
- Chi phí kỷ luật: `last_human_read` phải được cập nhật một cách trung thực; nếu con người coi đó chỉ là một ô để tích cho xong, nó sẽ trở nên vô nghĩa.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục (các sản phẩm có thêm phần khai báo đầu file mới).
- **ADR-0004** — Bảo mật hai tầng (nhật ký phiên được chia theo tầng).
- **ADR-0006** — Quy tắc A-luôn-là-người (quy tắc mà hệ thống này thực thi).
- **ADR-0011** — Định danh Agent lai (việc ghim mô hình/phiên bản).
- **ADR-0012** — Quản trị FinOps (theo dõi chi phí).

# 🎭 Cẩm nang Chi tiết: Vai SA (Solution Architect) — Stage 2

## 🎯 Sứ mệnh

Xây dựng "Bản thiết kế kỹ thuật" dựa trên nghiệp vụ của BA. Bạn đảm bảo hệ thống chạy ổn định, bảo mật và các Dev có thể code mà không cần hỏi lại rule.

---

## 🛠️ Công cụ AI của bạn

### 1. Agent: `sa-designer`

- **Kích hoạt:** Gõ `> sa-designer` trong Claude Code.
- **Nhiệm vụ:** Đọc YAML từ BA và sinh ra OpenAPI, AsyncAPI, DDL SQL (Oracle).

### 2. Agent: `threat-modeler`

- **Kích hoạt:** Gõ `> threat-modeler`.
- **Nhiệm vụ:** Phân tích các rủi ro bảo mật (STRIDE) cho luồng tiền.

### 3. Plugin: `superpowers`

- **Mục đích:** Kiểm tra tính nhất quán giữa các tài liệu thiết kế.
- **Lệnh mẫu:**
  - `@superpowers kiểm tra xem bảng 'PAYMENT_ORDER' trong file SQL có đủ các trường như trong 'payment-order-v1.json' không?`
  - `@superpowers tìm tất cả các ADR liên quan đến 'Idempotency' và tóm tắt lại.`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Kiểm chứng đầu vào

```bash
cd workspaces/sa
# Phải đảm bảo file này tồn tại:
ls ../../gates/G1-ba-signoff.md
```

### Bước 2: Thiết kế Contract & DB

Yêu cầu Claude:

> "Dùng agent `sa-designer` để sinh bộ contract (OpenAPI, AsyncAPI) và Database Migrations. Lấy thông tin từ `workspaces/ba/domain/`."

### Bước 3: Review Schema Cốt lõi

Mở file `workspaces/sa/contracts/schemas/payment-order-v1.json`.

- **Hành động:** Đây là "trái tim" hệ thống. Hãy soi kỹ từng kiểu dữ liệu. Nếu thấy sai:
  > "Cập nhật schema: trường 'amount' phải là kiểu BigDecimal (string format) để tránh mất độ chính xác khi tính toán tiền tệ."

### Bước 4: Phân tích Bảo mật

Yêu cầu Claude:

> "Chạy agent `threat-modeler` để phân tích các rủi ro Tampering (sửa đổi lệnh) và Replay (gửi trùng lệnh). Sinh file `docs/threat-model.md`."

### Bước 5: Viết ADR (Quyết định kiến trúc)

Mở các file `docs/adr/*.md`.

- **Hành động:** Đảm bảo AI giải thích đủ "Tại sao". Ví dụ:
  > "Bổ sung ADR về việc sử dụng Outbox Pattern: Tại sao chúng ta không dùng 2PC qua MQ mà dùng Outbox trong Oracle?"

### Bước 6: Ký duyệt (Sign-off)

Yêu cầu Claude:

> "Tóm tắt các thay đổi về kiến trúc vào `gates/G2-summary.md` và tạo file sign-off `gates/G2-sa-signoff.md`."

---

## ⚠️ Lưu ý tử huyệt

1. **SCHEMA IS KING:** Một khi đã ký G2, Contract là "đóng băng". Sửa Contract sau đó sẽ làm hỏng toàn bộ Stage 3.
2. **SECURITY FIRST:** Không bao giờ bỏ qua bước phân tích Replay attack.
3. **DDL COMPATIBILITY:** Đảm bảo SQL sinh ra tương thích với Oracle 19c (không dùng syntax của Postgres/MySQL).

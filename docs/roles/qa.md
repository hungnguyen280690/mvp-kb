# 🎭 Cẩm nang Chi tiết: Vai QA (Test Architect) — Stage 4

## 🎯 Sứ mệnh

Trở thành "Cơn ác mộng" của Dev. Bạn dùng AI để tự động hóa mọi kịch bản kiểm thử, từ logic tiền nong đến các lỗ hổng bảo mật tiềm ẩn.

---

## 🛠️ Công cụ AI của bạn

### 1. Agent: `test-writer`

- **Kích hoạt:** Gõ `> test-writer`.
- **Nhiệm vụ:** Biến Gherkin Feature thành script Playwright (E2E) và Pact (Contract test).

### 2. Plugin: `security-scanning`

- **Mục đích:** Tự động săn lùng lỗ hổng.
- **Lệnh mẫu:**
  - `@security-scan chạy Trivy scan cho image 'vdbas/bff-service:latest', liệt kê các thư viện lỗi thời.`
  - `@security-scan dùng ZAP scan endpoint '/api/internal/payment-orders/{id}', kiểm tra lỗi Broken Object Level Authorization (BOLA).`

### 3. Plugin: `superpowers`

- **Mục đích:** Truy vết (Traceability).
- **Lệnh mẫu:**
  - `@superpowers tạo bảng báo cáo: Scenario nào đã có test, scenario nào còn trống, dựa trên domain/user-stories.`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Kiểm tra Code sẵn sàng

```bash
cd workspaces/qa
# Đảm bảo CI đã xanh ở tầng Unit test của Dev
```

### Bước 2: Sinh Contract Test (Chặn lỗi vỡ API)

Yêu cầu Claude:

> "Sử dụng `test-writer` để sinh Pact test. Consumer là 'dev-fe', Provider là 'bff-service'. Đảm bảo cả hai bên đều khớp nhau về schema."

### Bước 3: Tự động hóa E2E (Playwright)

Yêu cầu Claude:

> "Đọc các file .feature tại `workspaces/ba/domain/user-stories/`. Hãy sinh script Playwright để chạy full luồng: Maker lập -> Checker duyệt -> Approver ký số."

### Bước 4: Quét bảo mật tự động

Dùng plugin `security-scan`:

> "@security-scan chạy audit cho toàn bộ Dockerfile trong project. Phát hiện các lỗi như: chạy root user, lộ secret trong ENV."

### Bước 5: Kiểm thử Hiệu năng (Perf)

Yêu cầu Claude:

> "Viết script k6 để giả lập 50 Maker cùng lập lệnh một lúc. Đo p95 response time của endpoint POST lệnh chi."

### Bước 6: Ký duyệt (Sign-off)

> "Tóm tắt kết quả test: Coverage %, số bug High phát hiện, và các rủi ro bảo mật còn tồn tại vào `gates/G4-test-signoff.md`."

---

## ⚠️ Lưu ý tử huyệt

1. **TRACEABILITY:** Một test case không gắn với Rule ID (VAL-X/BIZ-X) là một test vô nghĩa.
2. **FLAKY TEST:** Nếu test lúc xanh lúc đỏ, hãy bắt AI sửa lại cơ chế `waitForResponse`, đừng bao giờ dùng `sleep()`.
3. **IDEMPOTENCY TEST:** Phải test trường hợp gửi 2 request cùng lúc với cùng 1 Idempotency Key - hệ thống chỉ được tạo 1 lệnh.

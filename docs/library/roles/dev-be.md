# 🎭 Cẩm nang Chi tiết: Vai Dev Backend (Java Lead) — Stage 3

## 🎯 Sứ mệnh

Hiện thực hóa logic nghiệp vụ bằng code Java sạch, hiệu năng cao và tuân thủ các quy tắc an toàn tài chính. Bạn điều khiển một đội quân AI thợ xây.

---

## 🛠️ Công cụ AI của bạn

### 1. Agent: `service-builder`

- **Kích hoạt:** Gõ `> service-builder`.
- **Nhiệm vụ:** Đọc OpenAPI và sinh code Spring Boot, DDD layers, Unit tests.

### 2. Plugin: `java-development`

- **Mục đích:** Mọi thứ liên quan đến Maven, Fix bug và Compile.
- **Lệnh mẫu:**
  - `@java-dev chạy 'mvn clean compile' cho service bff, nếu có lỗi syntax hãy tự sửa.`
  - `@java-dev phân tích log lỗi NullPointerException này và tìm file nguồn để fix.`
  - `@java-dev viết thêm Unit Test cho class X, yêu cầu line coverage đạt 90%.`

### 3. Plugin: `superpowers`

- **Mục đích:** Quản lý môi trường làm việc phức tạp.
- **Lệnh mẫu:**
  - `@superpowers dùng 'git worktree' để spawn 4 thư mục riêng cho 4 service khác nhau.`
  - `@superpowers tìm tất cả các chỗ đang sử dụng thư mục chung 'shared-lib'.`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Chuẩn bị Môi trường

```bash
cd workspaces/dev-be
claude code .
```

### Bước 2: Sinh Code Scaffold

Yêu cầu Claude:

> "Dùng agent `service-builder` để tạo service `ltt-core`. Sử dụng OpenAPI tại `workspaces/sa/contracts/openapi/api-internal-v1.yaml`. Cấu trúc project theo DDD: domain, application, infrastructure."

### Bước 3: Hiện thực hóa Logic nghiệp vụ

Đừng để AI tự viết logic bừa bãi. Hãy ra lệnh cụ thể:

> "Implement rule BIZ-008: Khi trạng thái chuyển sang APPROVED, hãy gửi message vào IBM MQ qua integration-gateway và ghi vào Outbox table trong cùng 1 transaction Oracle."

### Bước 4: Compile & Sửa lỗi (Vòng lặp quan trọng)

Dùng plugin `java-dev`:

> "@java-dev compile và chạy unit test. Nếu fail, hãy dùng quyền Edit để sửa code cho đến khi xanh hết."

### Bước 5: Kiểm tra Quy tắc An toàn (Safety)

> "Rà soát lại toàn bộ log trong code, đảm bảo KHÔNG ghi số tài khoản (PAN) hay CMND đầy đủ ra log. Sử dụng hàm Masking đã có."

### Bước 6: Tạo Pull Request

> "Tóm tắt các thay đổi vào PR description. Gửi PR cho G3 (Java Lead) review."

---

## ⚠️ Lưu ý tử huyệt

1. **CONTRACT-FIRST:** Cấm tuyệt đối việc thêm/sửa API endpoint mà không sửa file OpenAPI ở Stage 2 trước.
2. **TRANSACTIONAL:** Các nghiệp vụ tiền nong PHẢI nằm trong transaction Oracle.
3. **IDEMPOTENCY:** Mọi API POST phải kiểm tra Idempotency Key để tránh trùng lệnh.

# 🎭 Cẩm nang Chi tiết: Vai Dev Frontend (React) — Stage 3'

## 🎯 Sứ mệnh

Xây dựng giao diện "vibe" ngân hàng: chính xác, dễ dùng và bảo mật. Bạn biến các màn hình S01-S07 thành trải nghiệm người dùng thực tế.

---

## 🛠️ Công cụ AI của bạn

_Lưu ý: Vai Dev FE **KHÔNG BẮT BUỘC** Docker (trừ khi bạn muốn chạy Backend local)._

### 1. Agent: `react-builder`

- **Kích hoạt:** Gõ `> react-builder`.
- **Nhiệm vụ:** Sinh React components (Vite + TS + Tailwind) từ mô tả màn hình của BA.

### 2. Plugin: `superpowers`

- **Mục đích:** Kiểm tra sự khớp nhau giữa UI và Đặc tả.
- **Lệnh mẫu:**
  - `@superpowers đọc file 'workspaces/ba/domain/screens.yaml', so sánh với component 'PaymentForm.tsx' xem có thiếu field nào không?`
  - `@superpowers tìm tất cả các file .feature liên quan đến màn hình S02.`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Khởi động

```bash
cd workspaces/dev-fe
claude code .
```

### Bước 2: Sinh bộ API Client

Yêu cầu Claude:

> "Dùng OpenAPI Generator (hoặc plugin tương đương) để sinh API Client từ file `workspaces/sa/contracts/openapi/api-internal-v1.yaml`."

### Bước 3: Xây dựng Giao diện (The UI Flow)

Yêu cầu Claude:

> "Sử dụng agent `react-builder` để tạo màn hình S02 (Lập lệnh thanh toán). Yêu cầu: dùng Tailwind CSS, tuân thủ bảng màu chuẩn của VDBAS, và tích hợp các rule validation từ `validation-rules.yaml`."

### Bước 4: Xử lý Logic "Maker-Checker"

> "Cấu hình màn hình S04 (Hàng đợi kiểm soát). Chỉ hiển thị các lệnh có trạng thái SUBMITTED. Thêm nút 'Duyệt' và 'Trả lại' cho người dùng vai Checker."

### Bước 5: Bảo mật UI (Masking)

> "Viết một reusable component `MaskedText` để tự động ẩn 6 số giữa của số tài khoản. Áp dụng cho tất cả các màn hình hiển thị danh sách lệnh."

### Bước 6: Test & Build

> "Chạy `npm run build` để kiểm tra lỗi TypeScript. Chạy Vitest cho các component quan trọng."

---

## ⚠️ Lưu ý tử huyệt

1. **VALIDATION:** Đừng chỉ tin vào backend. Frontend phải validate đủ 36 rule VAL-\* để tăng UX.
2. **OPTIMISTIC LOCK:** Phải gửi header `If-Match` (chứa version) khi update lệnh để tránh ghi đè dữ liệu cũ.
3. **ACCESSIBILITY:** Phải dùng đúng thẻ HTML (button, input) để hỗ trợ phím tắt cho cán bộ kho bạc thao tác nhanh.

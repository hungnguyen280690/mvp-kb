# 🎭 Cẩm nang Chi tiết: Vai Phân tích Nghiệp vụ (BA) — Giai đoạn 1

## 🎯 Sứ mệnh

Biến tài liệu SRS Excel cồng kềnh thành bộ dữ liệu máy đọc được (YAML) và các kịch bản kiểm thử (Gherkin) chuẩn xác. Bạn là người định hình "linh hồn" nghiệp vụ của hệ thống.

---

## 🛠️ Công cụ AI của bạn

### 1. Agent: `ba-parser`

- **Kích hoạt:** Gõ `> ba-parser` trong Claude Code.
- **Nhiệm vụ:** Phân tích 22 sheet Excel và sinh ra các file trong thư mục `domain/`.

### 2. Plugin: `superpowers`

- **Mục đích:** Tra cứu nhanh thông tin trong hàng nghìn dòng Excel hoặc tài liệu dự án.
- **Lệnh mẫu:**
  - `@superpowers tìm trong file SRS sheet '5.5', liệt kê tất cả các quy tắc liên quan đến 'Trạng thái LTT'.`

---

## 🔄 Quy trình làm việc (Từng bước)

### Bước 1: Khởi động Không gian làm việc

```bash
cd workspaces/ba
claude code .
```

### Bước 2: Chạy phân tích tự động

Yêu cầu Claude: "Chạy agent `ba-parser` để đọc file SRS. Sinh đầy đủ các file trong domain/."

### Bước 3: Xử lý mâu thuẫn nghiệp vụ

Mở file `workspaces/ba/domain/inconsistencies.md`. AI sẽ liệt kê các điểm SRS viết chồng chéo hoặc thiếu logic.

- **Hành động:** Thảo luận với các bên liên quan (KBNN), sau đó cập nhật quy tắc vào file YAML.

### Bước 4: Chốt Phạm vi MVP

Mở file `workspaces/ba/domain/scope.yaml`.

- **Hành động:** Kiểm tra xem danh sách các tính năng AI đề xuất làm ở MVP đã đúng chưa.

### Bước 5: Ký duyệt (Sign-off)

Khi mọi thứ đã chuẩn, yêu cầu Claude tóm tắt kết quả và tạo file ký duyệt tại `gates/G1-ba-signoff.md`.

---

## ⚠️ Lưu ý quan trọng

1. **KHÔNG** tự ý sửa mã nguồn trong `services/` hay `frontend/`.
2. **LUÔN** đối chiếu thuật ngữ với `docs/CONTEXT.md`.
3. **MỌI** thay đổi về nghiệp vụ phải được phản ánh vào file YAML, không được thỏa thuận miệng.
